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


@app.get("/api/surveillance/regions")
async def get_surveillance_regions():
    """Get surveillance data by regions with geographic coordinates"""
    # Mock data - replace with actual database query
    regions_data = [
        {
            "region": "Punjab",
            "lat": 31.5204,
            "lng": 74.3587,
            "cases": 456,
            "avg_resistance_rate": 0.235,
            "organisms": ["E. coli", "Klebsiella", "Pseudomonas", "S. aureus"],
            "trend": "increasing"
        },
        {
            "region": "Sindh",
            "lat": 24.8607,
            "lng": 67.0011,
            "cases": 342,
            "avg_resistance_rate": 0.182,
            "organisms": ["E. coli", "K. pneumoniae", "A. baumannii", "S. aureus"],
            "trend": "decreasing"
        },
        {
            "region": "KPK",
            "lat": 34.0151,
            "lng": 71.5249,
            "cases": 289,
            "avg_resistance_rate": 0.318,
            "organisms": ["S. aureus", "E. coli", "K. pneumoniae", "P. aeruginosa"],
            "trend": "increasing"
        },
        {
            "region": "Balochistan",
            "lat": 30.1798,
            "lng": 66.9750,
            "cases": 147,
            "avg_resistance_rate": 0.273,
            "organisms": ["E. coli", "S. aureus", "K. pneumoniae", "P. aeruginosa"],
            "trend": "stable"
        },
        {
            "region": "Gilgit-Baltistan",
            "lat": 35.8028,
            "lng": 74.4667,
            "cases": 45,
            "avg_resistance_rate": 0.195,
            "organisms": ["E. coli", "S. aureus"],
            "trend": "stable"
        },
        {
            "region": "Azad Kashmir",
            "lat": 33.7782,
            "lng": 73.8472,
            "cases": 38,
            "avg_resistance_rate": 0.168,
            "organisms": ["E. coli", "S. aureus", "K. pneumoniae"],
            "trend": "decreasing"
        }
    ]
    
    # If database is available, try to fetch real data
    if db is not None:
        try:
            db_regions = list(db.surveillance_regions.find({}, {"_id": 0}))
            if db_regions:
                return {"regions": db_regions, "Count": len(db_regions)}
        except Exception as e:
            print(f"Error fetching from database: {e}")
    
    return {"regions": regions_data, "Count": len(regions_data)}


@app.get("/api/surveillance/trends")
async def get_resistance_trends():
    """Get resistance trends over time (mock data)"""
    # Mock data for the last 12 months
    from datetime import datetime, timedelta
    
    trends_data = []
    base_date = datetime.now()
    
    # Generate monthly data for the past 12 months
    for i in range(11, -1, -1):
        month_date = base_date - timedelta(days=30 * i)
        month_name = month_date.strftime("%b %Y")
        
        # Simulate resistance rate with some variation
        base_rate = 0.25
        variation = (i % 3) * 0.02 - 0.02  # Slight variation
        resistance_rate = max(0.15, min(0.35, base_rate + variation))
        
        # Simulate case count
        base_cases = 300
        case_variation = (i % 4) * 20 - 30
        cases = max(200, base_cases + case_variation)
        
        trends_data.append({
            "month": month_name,
            "month_index": 11 - i,
            "resistance_rate": round(resistance_rate, 3),
            "cases": cases,
            "date": month_date.strftime("%Y-%m")
        })
    
    return {"trends": trends_data, "count": len(trends_data)}


@app.get("/api/surveillance/organisms")
async def get_organism_distribution():
    """Get organism distribution data (mock data) - Only 4 species"""
    # Mock organism distribution data - Only the 4 specified species
    # In a real application, this would be aggregated from the database
    distribution_data = [
        {"organism": "E. coli", "cases": 342, "percentage": 33.0},
        {"organism": "K. pneumoniae", "cases": 289, "percentage": 27.9},
        {"organism": "S. aureus", "cases": 256, "percentage": 24.7},
        {"organism": "P. aeruginosa", "cases": 147, "percentage": 14.2},
    ]
    
    total_cases = sum(item["cases"] for item in distribution_data)
    
    return {"distribution": distribution_data, "total_cases": total_cases, "count": len(distribution_data)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


