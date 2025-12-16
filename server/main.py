from typing import Any, Dict

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure, ServerSelectionTimeoutError

from routers.prediction import router as prediction_router
from routers.surveillance import router as surveillance_router


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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
