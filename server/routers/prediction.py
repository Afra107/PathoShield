from datetime import datetime
from typing import List, Optional
import random

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from pymongo.database import Database


def get_db() -> Optional[Database]:
    """
    Dependency to provide MongoDB database instance.

    The actual client & db are created in main.py; we import lazily
    here to avoid circular imports at module import time. We try both
    'main' (when running from the server directory) and 'server.main'
    (when imported as a package).
    """
    try:
        from main import db  # type: ignore
    except Exception:
        try:
            from server.main import db  # type: ignore
        except Exception:
            db = None
    return db


router = APIRouter(prefix="/api", tags=["Prediction & E-Prescription"])


class PredictionRequestMeta(BaseModel):
    """Clinical/meta information sent along with the uploaded file."""

    organism: str
    patientAge: Optional[int] = None
    patientGender: Optional[str] = None
    region: Optional[str] = None


class PredictionResult(BaseModel):
    """Shape expected by the React Prediction & EPrescription pages."""

    bacterialSpecies: str
    susceptibleAntibiotics: List[str]
    resistantAntibiotics: List[str]
    region: Optional[str] = None
    confidence: float
    patientId: str


class PrescriptionPayload(BaseModel):
    """Payload coming from the E-Prescription page."""

    patientId: str
    bacterialSpecies: str
    region: Optional[str] = None
    antibiotic: str
    dosage: str
    duration: str
    instructions: Optional[str] = None
    confidence: Optional[float] = None


class PrescriptionDocument(BaseModel):
    """Document returned by the backend to render/print."""

    prescriptionId: str
    patientId: str
    date: datetime
    bacterialSpecies: str
    region: Optional[str] = None
    antibiotic: str
    dosage: str
    duration: str
    instructions: Optional[str] = None
    confidence: Optional[float] = None


@router.post(
    "/prediction/run",
    response_model=PredictionResult,
    summary="Run AMR prediction on uploaded file and clinical metadata",
)
async def run_prediction(
    file: UploadFile = File(..., description="Mass spectrometry data file"),
    organism: str = Form(...),
    patientAge: Optional[int] = Form(None),
    patientGender: Optional[str] = Form(None),
    region: Optional[str] = Form(None),
    db: Optional[Database] = Depends(get_db),
):
    """
    Run AMR prediction.

    For now this is a mocked model; it returns structured data matching
    what the frontend expects. The uploaded file is accepted and can be
    wired to a real ML model later.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="File is required")

    # TODO: Replace this with real model inference using the uploaded file.
    # For now, generate a randomized but plausible result using a fixed pool.
    organism_pool = [
        "E. coli",
        "K. pneumoniae",
        "S. aureus",
        "P. aeruginosa",
        "A. baumannii",
    ]
    susceptible_pool = [
        "Amoxicillin",
        "Amoxicillin-Clavulanate",
        "Ceftriaxone",
        "Cefazolin",
        "Trimethoprim-Sulfamethoxazole",
        "Azithromycin",
        "Piperacillin-Tazobactam",
        "Meropenem",
        "Imipenem",
        "Doxycycline",
    ]
    resistant_pool = [
        "Ciprofloxacin",
        "Levofloxacin",
        "Gentamicin",
        "Vancomycin",
        "Tobramycin",
    ]

    bacterial_species = organism.strip() if organism else random.choice(organism_pool)
    susceptible = random.sample(susceptible_pool, k=min(6, len(susceptible_pool)))
    resistant = random.sample(resistant_pool, k=min(3, len(resistant_pool)))
    confidence = round(random.uniform(75, 95), 1)
    patient_id = f"PAT-{random.randint(10000, 99999)}"

    mock_result = PredictionResult(
        bacterialSpecies=bacterial_species,
        susceptibleAntibiotics=susceptible,
        resistantAntibiotics=resistant,
        region=region,
        confidence=confidence,
        patientId=patient_id,
    )

    if db is not None:
        try:
            doc = mock_result.model_dump()
            doc.update(
                {
                    "organism_input": organism,
                    "patientAge": patientAge,
                    "patientGender": patientGender,
                    "region_input": region,
                    "filename": file.filename,
                    "created_at": datetime.utcnow(),
                }
            )
            db.predictions.insert_one(doc)
        except Exception:
            # Log error but don't break user flow
            pass

    return mock_result


@router.post(
    "/eprescription",
    response_model=PrescriptionDocument,
    summary="Create and persist an electronic prescription",
)
async def create_eprescription(
    payload: PrescriptionPayload,
    db: Optional[Database] = Depends(get_db),
):
    """
    Create an electronic prescription based on prediction results.

    The frontend currently generates prescription client-side; this
    endpoint provides a backend implementation that can store and
    later retrieve prescriptions if desired.
    """
    prescription_id = f"PRES-{int(datetime.utcnow().timestamp() * 1000)}"
    now = datetime.utcnow()

    doc = PrescriptionDocument(
        prescriptionId=prescription_id,
        patientId=payload.patientId,
        date=now,
        bacterialSpecies=payload.bacterialSpecies,
        region=payload.region,
        antibiotic=payload.antibiotic,
        dosage=payload.dosage,
        duration=payload.duration,
        instructions=payload.instructions,
        confidence=payload.confidence,
    )

    if db is not None:
        try:
            db.prescriptions.insert_one(doc.model_dump())
        except Exception:
            # Log error but still return generated prescription
            pass

    return doc


