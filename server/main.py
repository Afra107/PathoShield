from typing import Any, Dict, List, Optional

import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure, ServerSelectionTimeoutError
import httpx

from routers.prediction import router as prediction_router
from routers.surveillance import router as surveillance_router
from routers.prediction import SPECIES_ANTIBIOTICS


# Load environment variables
load_dotenv()

app = FastAPI(
    title="AMR Prediction & Surveillance API",
    description="API for Antimicrobial Resistance prediction and surveillance",
    version="0.2.0",
)


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# MongoDB connection (assume a default local URL, override via env if needed)
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME", "amr_db")

client = None
db = None

try:
    # For MongoDB Atlas, ensure connection string is properly formatted
    # If database name is not in URI, it will be specified when accessing client[DB_NAME]
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
    db = client[DB_NAME]
    # Test connection with a simple ping
    client.admin.command("ping")
    print(f"✅ Connected to MongoDB successfully (database: {DB_NAME})")
except (ConnectionFailure, OperationFailure, ServerSelectionTimeoutError) as e:
    print(f"⚠️  MongoDB connection failed: {type(e).__name__}: {str(e)}")
    print("⚠️  Running without database - API will still work but data won't be persisted")
    print("⚠️  Check your MongoDB credentials and IP whitelist settings")
    client = None
    db = None
except Exception as e:
    print(f"⚠️  Unexpected error connecting to MongoDB: {type(e).__name__}: {str(e)}")
    print("⚠️  Running without database - API will still work but data won't be persisted")
    client = None
    db = None


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "AMR Prediction & Surveillance API",
        "version": "0.2.0",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    health_status: Dict[str, Any] = {
        "status": "healthy",
        "message": "Backend is running",
        "database": "connected" if db is not None else "disconnected",
    }

    if db is not None:
        try:
            client.admin.command("ping")
            health_status["database"] = "connected"
        except Exception as e:  # pragma: no cover - defensive
            health_status["database"] = f"error: {str(e)}"
            health_status["status"] = "degraded"

    return health_status


# Include feature routers
app.include_router(prediction_router)
app.include_router(surveillance_router)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _months_ago_six() -> datetime:
    # Approximate 6 months as 183 days to avoid extra deps.
    return _utcnow() - timedelta(days=183)


def _build_species_csv_rows(samples: List[dict], antibiotic_order: List[str]) -> str:
    """
    CSV columns:
    - spectrum_0..spectrum_5999
    - antibiotic label columns in the provided order (0/1)
    """
    output = []
    header = [f"spectrum_{i}" for i in range(6000)] + antibiotic_order
    output.append(",".join(header))

    for s in samples:
        spectrum: Optional[list] = s.get("spectrum")
        labels: Optional[dict] = s.get("labels")
        if not isinstance(spectrum, list) or len(spectrum) != 6000:
            continue
        if not isinstance(labels, dict):
            continue

        try:
            spectrum_part = ",".join(str(float(v)) for v in spectrum)
        except Exception:
            continue

        try:
            labels_part = ",".join(str(int(labels[ab])) for ab in antibiotic_order)
        except Exception:
            continue

        output.append(f"{spectrum_part},{labels_part}")

    return "\n".join(output) + "\n"


def _union_antibiotic_columns() -> List[str]:
    """
    Stable union ordering: species iteration order as defined in SPECIES_ANTIBIOTICS,
    with each species' antibiotic list appended (deduped).
    """
    seen = set()
    union: List[str] = []
    for _, abx_list in SPECIES_ANTIBIOTICS.items():
        for ab in abx_list:
            if ab in seen:
                continue
            seen.add(ab)
            union.append(ab)
    return union


def _build_union_csv_rows(samples_by_species: Dict[str, List[dict]]) -> str:
    """
    Build ONE CSV for all species:
    - spectrum_0..spectrum_5999
    - union antibiotic columns (0/1 labels); blanks for non-applicable antibiotics
    """
    antibiotic_union = _union_antibiotic_columns()
    output: List[str] = []
    header = [f"spectrum_{i}" for i in range(6000)] + antibiotic_union
    output.append(",".join(header))

    for species, samples in samples_by_species.items():
        if not samples:
            continue
        for s in samples:
            spectrum: Optional[list] = s.get("spectrum")
            labels: Optional[dict] = s.get("labels")
            if not isinstance(spectrum, list) or len(spectrum) != 6000:
                continue
            if not isinstance(labels, dict):
                continue

            try:
                spectrum_part = ",".join(str(float(v)) for v in spectrum)
            except Exception:
                continue

            # Fill union columns; blanks mean "no label" and will be skipped by HF retrain parser.
            label_cells: List[str] = []
            for ab in antibiotic_union:
                if ab in labels:
                    try:
                        label_cells.append(str(int(labels[ab])))
                    except Exception:
                        label_cells.append("")
                else:
                    label_cells.append("")

            output.append(f"{spectrum_part},{','.join(label_cells)}")

    return "\n".join(output) + "\n"


async def _maybe_trigger_periodic_retraining() -> None:
    """
    On startup:
    - If DB disconnected: skip
    - If last_trained missing or older than ~6 months: export per-species CSVs and POST to HF retrain endpoint
    """
    if db is None:
        print("ℹ️  Retraining check skipped (database disconnected)")
        return

    enabled = os.getenv("ENABLE_PERIODIC_RETRAINING", "true").strip().lower() in {"1", "true", "yes", "on"}
    if not enabled:
        print("ℹ️  Retraining check disabled by ENABLE_PERIODIC_RETRAINING")
        return

    hf_retrain_url = os.getenv("HF_RETRAIN_URL") or os.getenv("HF_API_URL", "").rstrip("/") + "/retrain"
    hf_api_token = os.getenv("HF_API_TOKEN")
    if not hf_retrain_url or hf_retrain_url.endswith("/retrain") is False:
        # If user provided a fully-qualified non-standard URL, still accept it.
        pass

    meta = db.model_metadata.find_one({"_id": "amr_model_v1"})
    last_trained = meta.get("last_trained") if isinstance(meta, dict) else None

    last_trained_dt: Optional[datetime] = None
    if isinstance(last_trained, datetime):
        last_trained_dt = last_trained
        if last_trained_dt.tzinfo is None:
            last_trained_dt = last_trained_dt.replace(tzinfo=timezone.utc)
    elif isinstance(last_trained, str):
        try:
            last_trained_dt = datetime.fromisoformat(last_trained.replace("Z", "+00:00"))
        except Exception:
            last_trained_dt = None

    if last_trained_dt is not None and last_trained_dt > _months_ago_six():
        print("✅ Model retraining not needed (trained within ~6 months)")
        return

    print("⏳ Model retraining triggered (older than ~6 months or unknown)")

    headers = {}
    if hf_api_token:
        headers["Authorization"] = f"Bearer {hf_api_token}"

    # Export ONE combined CSV (union of antibiotic columns) and call HF retrain once
    async with httpx.AsyncClient(timeout=120.0, headers=headers) as client_http:
        samples_by_species: Dict[str, List[dict]] = {}
        total_samples = 0
        for species in SPECIES_ANTIBIOTICS.keys():
            samples = list(
                db.training_samples.find({"species": species}, {"_id": 0, "spectrum": 1, "labels": 1}).limit(50000)
            )
            samples_by_species[species] = samples
            total_samples += len(samples)

        if total_samples == 0:
            print("ℹ️  No training samples found in database; skipping retrain")
            return

        csv_text = _build_union_csv_rows(samples_by_species)
        filename = "retrain__all_species_union.csv"

        files = {"file": (filename, csv_text.encode("utf-8"), "text/csv")}
        data = {"species": "ALL", "dataset_name": filename}

        try:
            resp = await client_http.post(hf_retrain_url, files=files, data=data)
            resp.raise_for_status()
            print(f"✅ Retrain request submitted (single call) ({total_samples} spectra)")
        except Exception as e:
            print(f"⚠️  Retrain request failed: {type(e).__name__}: {str(e)}")
            return

    # Update metadata timestamp after submitting all retrain requests
    db.model_metadata.update_one(
        {"_id": "amr_model_v1"},
        {"$set": {"last_trained": _utcnow(), "updated_at": _utcnow()}},
        upsert=True,
    )


@app.on_event("startup")
async def _startup_tasks():
    await _maybe_trigger_periodic_retraining()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
