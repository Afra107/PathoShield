from datetime import datetime
from typing import Dict, List, Optional
import random
import csv
import io
import httpx
import os
import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from pymongo.database import Database

logger = logging.getLogger(__name__)

# Hugging Face API endpoint
HF_API_URL = os.getenv("HF_API_URL", "https://hasaan77-amr-prediction.hf.space")

# Hugging Face retrain endpoint (expects CSV upload)
HF_RETRAIN_URL = os.getenv("HF_RETRAIN_URL", f"{HF_API_URL}/retrain")
HF_API_TOKEN = os.getenv("HF_API_TOKEN")

# Canonical species -> antibiotic column order for retraining labels
SPECIES_ANTIBIOTICS: Dict[str, List[str]] = {
    "Escherichia coli": [
        "Ciprofloxacin",
        "Ceftriaxone",
        "Meropenem",
        "Piperacillin",
    ],
    "Klebsiella pneumoniae": [
        "Ciprofloxacin",
        "Ceftriaxone",
        "Meropenem",
        "Gentamicin",
        "Piperacillin",
    ],
    "Staphylococcus aureus": [
        "Oxacillin",
        "Clindamycin",
        "Fusidic acid",
    ],
    "Pseudomonas aeruginosa": [
        "Ciprofloxacin",
        "Meropenem",
        "Piperacillin",
        "Tobramycin",
        "Imipenem",
    ],
}

# Label encoding for retraining CSV
# 1 = Resistant, 0 = Susceptible
RESISTANT_LABEL_VALUE = 1
SUSCEPTIBLE_LABEL_VALUE = 0

# Mapping from common organism names to HF API format
ORGANISM_MAPPING = {
    "e. coli": "Escherichia coli",
    "e.coli": "Escherichia coli",
    "escherichia coli": "Escherichia coli",
    "k. pneumoniae": "Klebsiella pneumoniae",
    "k.pneumoniae": "Klebsiella pneumoniae",
    "klebsiella pneumoniae": "Klebsiella pneumoniae",
    "s. aureus": "Staphylococcus aureus",
    "s.aureus": "Staphylococcus aureus",
    "staphylococcus aureus": "Staphylococcus aureus",
    "p. aeruginosa": "Pseudomonas aeruginosa",
    "p.aeruginosa": "Pseudomonas aeruginosa",
    "pseudomonas aeruginosa": "Pseudomonas aeruginosa",
}


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


class AntibioticDetail(BaseModel):
    """Detailed information about an antibiotic prediction."""
    name: str
    prediction: str  # "Resistant" or "Susceptible"
    deterministicProbability: float
    meanBayesianProbability: float
    uncertainty: float
    confidence: float  # Calculated from uncertainty (higher uncertainty = lower confidence)


class PredictionResult(BaseModel):
    """Shape expected by the React Prediction & EPrescription pages."""

    bacterialSpecies: str
    susceptibleAntibiotics: List[str]
    resistantAntibiotics: List[str]
    antibioticDetails: List[AntibioticDetail]  # Detailed info for each antibiotic
    region: Optional[str] = None
    confidence: float  # Overall model confidence (0-100)
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


def parse_spectrum_file(file_content: bytes, filename: str) -> List[float]:
    """
    Parse the uploaded file to extract 6000-dim MALDI-TOF spectrum.
    Supports CSV and TXT formats.
    """
    try:
        # Try to decode as text
        content_str = file_content.decode("utf-8").strip()
        
        # Try CSV format first
        if filename.endswith(".csv"):
            reader = csv.reader(io.StringIO(content_str))
            values = []
            for row in reader:
                values.extend([float(val.strip()) for val in row if val.strip()])
            if len(values) == 6000:
                return values
        
        # Try space/tab/newline separated values
        values = []
        for line in content_str.split("\n"):
            for val in line.replace(",", " ").split():
                try:
                    values.append(float(val.strip()))
                except ValueError:
                    continue
        
        if len(values) == 6000:
            return values
        elif len(values) > 6000:
            # Take first 6000 values
            logger.warning(f"File has {len(values)} values, using first 6000")
            return values[:6000]
        else:
            raise ValueError(f"Expected 6000 values, got {len(values)}")
    
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse spectrum file: {str(e)}. Expected 6000 float values in CSV or text format."
        )


def normalize_organism_name(organism: str) -> str:
    """Map common organism names to HF API format."""
    organism_lower = organism.strip().lower()
    return ORGANISM_MAPPING.get(organism_lower, organism.strip())


def labels_from_prediction_result(species: str, result: PredictionResult) -> Optional[Dict[str, int]]:
    """
    Build a stable antibiotic->0/1 label mapping for a known species.

    Only returns labels for species present in SPECIES_ANTIBIOTICS.
    """
    antibiotics = SPECIES_ANTIBIOTICS.get(species)
    if not antibiotics:
        return None

    prediction_by_name: Dict[str, str] = {d.name: d.prediction for d in result.antibioticDetails}
    labels: Dict[str, int] = {}
    for ab in antibiotics:
        pred = prediction_by_name.get(ab)
        if pred == "Resistant":
            labels[ab] = RESISTANT_LABEL_VALUE
        elif pred == "Susceptible":
            labels[ab] = SUSCEPTIBLE_LABEL_VALUE
        else:
            # If model didn't return this antibiotic (unexpected), skip storing as a training sample
            return None
    return labels


async def call_hf_api(spectrum: List[float], bacteria_name: str) -> dict:
    """Call the Hugging Face AMR prediction API."""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{HF_API_URL}/predict_amr",
                json={
                    "spectrum": spectrum,
                    "bacteria_name": bacteria_name,
                    "mc_samples": 10,
                },
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"HF API HTTP error: {e.response.status_code} - {e.response.text}")
        raise HTTPException(
            status_code=502,
            detail=f"Model API error: {e.response.status_code}. Please check the model service."
        )
    except httpx.TimeoutException:
        logger.error("HF API timeout")
        raise HTTPException(
            status_code=504,
            detail="Model API timeout. Please try again later."
        )
    except Exception as e:
        logger.error(f"HF API error: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail=f"Failed to call model API: {str(e)}"
        )


def calculate_confidence_from_uncertainty(uncertainty: float) -> float:
    """
    Convert uncertainty (variance) to confidence score (0-100).
    Lower uncertainty = higher confidence.
    Uses a normalized scale where uncertainty is typically in range [0, 0.1].
    """
    # Normalize uncertainty to [0, 1] range (assuming max uncertainty ~0.1)
    # Higher uncertainty values get lower confidence
    normalized_uncertainty = min(uncertainty * 10, 1.0)  # Scale uncertainty
    confidence = (1.0 - normalized_uncertainty) * 100
    return max(0.0, min(100.0, confidence))  # Clamp to [0, 100]


def transform_hf_response(hf_response: dict, original_organism: str) -> PredictionResult:
    """Transform HF API response to frontend format."""
    results = hf_response.get("results", [])
    
    susceptible_antibiotics = []
    resistant_antibiotics = []
    antibiotic_details = []
    uncertainties = []
    
    for result in results:
        antibiotic = result.get("antibiotic", "")
        prediction = result.get("prediction", "")
        det_prob = result.get("deterministic_probability", 0.0)
        bay_prob = result.get("mean_bayesian_probability", 0.0)
        uncertainty = result.get("uncertainty", 0.0)
        
        if not antibiotic or prediction == "Error":
            continue  # Skip error results
        
        # Calculate confidence from uncertainty (lower uncertainty = higher confidence)
        confidence = calculate_confidence_from_uncertainty(uncertainty)
        
        antibiotic_detail = AntibioticDetail(
            name=antibiotic,
            prediction=prediction,
            deterministicProbability=round(det_prob, 4),
            meanBayesianProbability=round(bay_prob, 4),
            uncertainty=round(uncertainty, 6),
            confidence=round(confidence, 1),
        )
        antibiotic_details.append(antibiotic_detail)
        uncertainties.append(uncertainty)
        
        if prediction == "Susceptible":
            susceptible_antibiotics.append(antibiotic)
        elif prediction == "Resistant":
            resistant_antibiotics.append(antibiotic)
    
    # Calculate overall confidence: average of individual antibiotic confidences
    # This represents how confident the model is overall
    if antibiotic_details:
        overall_confidence = sum(detail.confidence for detail in antibiotic_details) / len(antibiotic_details)
    else:
        overall_confidence = 0.0
    
    # Use original organism name for display
    bacterial_species = original_organism.strip()
    patient_id = f"PAT-{random.randint(10000, 99999)}"
    
    return PredictionResult(
        bacterialSpecies=bacterial_species,
        susceptibleAntibiotics=susceptible_antibiotics,
        resistantAntibiotics=resistant_antibiotics,
        antibioticDetails=antibiotic_details,
        region=None,  # Will be set from form data
        confidence=round(overall_confidence, 1),
        patientId=patient_id,
    )


@router.post(
    "/prediction/run",
    response_model=PredictionResult,
    summary="Run AMR prediction on uploaded file and clinical metadata",
)
async def run_prediction(
    file: UploadFile = File(..., description="Mass spectrometry data file (6000-dim spectrum)"),
    organism: str = Form(...),
    patientAge: Optional[int] = Form(None),
    patientGender: Optional[str] = Form(None),
    region: Optional[str] = Form(None),
    db: Optional[Database] = Depends(get_db),
):
    """
    Run AMR prediction using the Hugging Face deployed model.
    
    1. Parses the uploaded file to extract 6000-dim MALDI-TOF spectrum
    2. Normalizes organism name to match HF API format
    3. Calls HF API for prediction
    4. Transforms response to frontend format
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="File is required")
    
    # Read and parse the uploaded file
    try:
        file_content = await file.read()
        spectrum = parse_spectrum_file(file_content, file.filename)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File parsing error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read file: {str(e)}"
        )
    
    # Normalize organism name for HF API
    normalized_organism = normalize_organism_name(organism)
    logger.info(f"Original organism: {organism}, Normalized: {normalized_organism}")
    
    # Call Hugging Face API
    try:
        hf_response = await call_hf_api(spectrum, normalized_organism)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"HF API call error: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail=f"Failed to get prediction from model: {str(e)}"
        )
    
    # Transform response to frontend format
    result = transform_hf_response(hf_response, organism)
    result.region = region  # Set region from form data
    
    # Store in database - save both the transformed result (for frontend) and original HF response
    if db is not None:
        try:
            # Store the original HF API response in the exact format received
            normalized_species_for_storage = normalized_organism
            labels = labels_from_prediction_result(normalized_species_for_storage, result)
            hf_prediction_doc = {
                "bacteria_name": hf_response.get("bacteria_name", normalized_organism),
                "resistance_threshold": hf_response.get("resistance_threshold", 0.5),
                "results": hf_response.get("results", []),  # Store exact HF format
                # Also store transformed data for easy querying
                "bacterialSpecies": result.bacterialSpecies,
                "normalized_species": normalized_species_for_storage,
                "susceptibleAntibiotics": result.susceptibleAntibiotics,
                "resistantAntibiotics": result.resistantAntibiotics,
                "antibioticDetails": [detail.model_dump() for detail in result.antibioticDetails],
                "confidence": result.confidence,
                "patientId": result.patientId,
                "region": result.region,
                # Store raw spectrum and 0/1 labels for periodic retraining
                "spectrum": spectrum,
                "labels": labels,
                # Metadata
                "organism_input": organism,
                "normalized_organism": normalized_organism,
                "patientAge": patientAge,
                "patientGender": patientGender,
                "region_input": region,
                "filename": file.filename,
                "created_at": datetime.utcnow(),
            }
            insert_result = db.predictions.insert_one(hf_prediction_doc)
            logger.info(f"Saved prediction to database with {len(hf_response.get('results', []))} antibiotic results")

            # Also store in a dedicated collection for retraining datasets (per-species)
            # This makes exporting per-species CSVs fast and consistent.
            if labels is not None and normalized_species_for_storage in SPECIES_ANTIBIOTICS:
                db.training_samples.insert_one(
                    {
                        "species": normalized_species_for_storage,
                        "spectrum": spectrum,
                        "labels": labels,
                        "prediction_id": insert_result.inserted_id,
                        "created_at": datetime.utcnow(),
                    }
                )
        except Exception as e:
            logger.warning(f"Failed to save prediction to database: {str(e)}")
    
    return result


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


