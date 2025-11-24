from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv
from typing import Dict, Any

# Load environment variables
load_dotenv()

app = FastAPI(
    title="AMR Prediction & Surveillance API",
    description="API for Antimicrobial Resistance prediction and surveillance",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://mongodb:27017/")
DB_NAME = os.getenv("DB_NAME", "amr_db")

try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[DB_NAME]
    # Test connection
    client.admin.command('ping')
    print("✅ Connected to MongoDB successfully")
except ConnectionFailure:
    print("⚠️  MongoDB connection failed - running without database")
    db = None


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AMR Prediction & Surveillance API",
        "version": "0.1.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    health_status: Dict[str, Any] = {
        "status": "healthy",
        "message": "Backend is running",
        "database": "connected" if db is not None else "disconnected"
    }
    
    # Test database connection if available
    if db is not None:
        try:
            client.admin.command('ping')
            health_status["database"] = "connected"
        except Exception as e:
            health_status["database"] = f"error: {str(e)}"
            health_status["status"] = "degraded"
    
    return health_status


@app.get("/api/predictions")
async def get_predictions():
    """Get all predictions (placeholder)"""
    if db is None:
        return {"predictions": [], "message": "Database not connected"}
    
    try:
        predictions = list(db.predictions.find({}, {"_id": 0}).limit(10))
        return {"predictions": predictions, "count": len(predictions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/api/predictions")
async def create_prediction(prediction: Dict[str, Any]):
    """Create a new prediction (placeholder)"""
    if db is None:
        return {"message": "Database not connected", "prediction": prediction}
    
    try:
        result = db.predictions.insert_one(prediction)
        return {
            "message": "Prediction created successfully",
            "id": str(result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/surveillance")
async def get_surveillance_data():
    """Get surveillance data (placeholder)"""
    if db is None:
        return {"data": [], "message": "Database not connected"}
    
    try:
        data = list(db.surveillance.find({}, {"_id": 0}).limit(10))
        return {"data": data, "count": len(data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


