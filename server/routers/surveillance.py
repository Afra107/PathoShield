from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import httpx
import os
import logging

from fastapi import APIRouter, Depends
from pymongo.database import Database

logger = logging.getLogger(__name__)


def get_db() -> Optional[Database]:
    """
    Return the MongoDB database handle from the main application module.

    Works both when running `python main.py` from the `server/` directory
    and when the app is imported as a package.
    """
    try:
        from main import db  # type: ignore
    except Exception:
        try:
            from server.main import db  # type: ignore
        except Exception:
            db = None
    return db


router = APIRouter(prefix="/api/surveillance", tags=["Surveillance"])


@router.get("", summary="Get raw surveillance records (if available)")
async def get_surveillance_data(db: Optional[Database] = Depends(get_db)):
    """Return basic surveillance documents from the database, if configured."""
    if db is None:
        return {"data": [], "message": "Database not connected"}

    try:
        data: List[Dict[str, Any]] = list(
            db.surveillance.find({}, {"_id": 0}).limit(10)
        )
        return {"data": data, "count": len(data)}
    except Exception as e:
        return {"data": [], "message": f"Database error: {str(e)}"}


async def geocode_region(region_name: str, country: str = "Pakistan") -> Optional[Dict[str, float]]:
    """
    Fetch coordinates for a region name using OpenStreetMap Nominatim API.
    Returns {"lat": float, "lng": float} or None if not found.
    """
    if not region_name or not region_name.strip():
        return None
    
    # Use OpenStreetMap Nominatim (free, no API key required)
    # Add country to improve accuracy
    query = f"{region_name.strip()}, {country}"
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": query,
                    "format": "json",
                    "limit": 1,
                    "addressdetails": 1,
                },
                headers={
                    "User-Agent": "PathoShield-AMR-Surveillance/1.0"  # Required by Nominatim
                }
            )
            response.raise_for_status()
            data = response.json()
            
            if data and len(data) > 0:
                result = data[0]
                lat = float(result.get("lat", 0))
                lon = float(result.get("lon", 0))
                if lat and lon:
                    logger.info(f"Geocoded '{region_name}' to ({lat}, {lon})")
                    return {"lat": lat, "lng": lon}
            
            logger.warning(f"Could not geocode region: {region_name}")
            return None
            
    except Exception as e:
        logger.error(f"Error geocoding region '{region_name}': {str(e)}")
        return None


@router.get("/regions", summary="Get regional surveillance data")
async def get_surveillance_regions(db: Optional[Database] = Depends(get_db)):
    """Get surveillance data by regions with geographic coordinates from database."""
    
    if db is not None:
        try:
            # First, check if we have any predictions at all
            total_predictions = db.predictions.count_documents({})
            print(f"Total predictions in database: {total_predictions}")
            
            if total_predictions == 0:
                return {"regions": [], "Count": 0, "message": "No predictions found in database"}
            
            # Get all unique regions from predictions (case-insensitive)
            # Check both "region" and "region_input" fields
            all_predictions = list(db.predictions.find({}, {
                "region": 1,
                "region_input": 1,  # Also check region_input field
                "bacterialSpecies": 1, 
                "susceptibleAntibiotics": 1, 
                "resistantAntibiotics": 1, 
                "created_at": 1
            }))
            
            print(f"Retrieved {len(all_predictions)} predictions from database")
            
            # Group by region (normalize to lowercase for matching)
            region_groups = {}
            predictions_without_region = 0
            for pred in all_predictions:
                # Try both "region" and "region_input" fields
                region = pred.get("region") or pred.get("region_input")
                if region and str(region).strip():
                    region_lower = str(region).strip().lower()
                    if region_lower not in region_groups:
                        region_groups[region_lower] = {
                            "predictions": [],
                            "organisms": set(),
                        }
                    region_groups[region_lower]["predictions"].append(pred)
                    if pred.get("bacterialSpecies"):
                        region_groups[region_lower]["organisms"].add(pred["bacterialSpecies"])
                else:
                    predictions_without_region += 1
            
            print(f"Found {len(region_groups)} unique regions: {list(region_groups.keys())}")
            if predictions_without_region > 0:
                print(f"Warning: {predictions_without_region} predictions have no region set")
            
            if region_groups:
                regions_with_trends = []
                for region_key, region_info in region_groups.items():
                    # Fetch coordinates using geocoding API
                    coords = await geocode_region(region_key)
                    
                    if not coords:
                        # Use default coordinates (center of Pakistan) if geocoding fails
                        logger.warning(f"Could not geocode region '{region_key}', using default coordinates")
                        coords = {"lat": 30.3753, "lng": 69.3451}  # Default: center of Pakistan
                    
                    # Use title case for display name
                    display_name = region_key.title()
                    
                    predictions = region_info["predictions"]
                    cases = len(predictions)
                    
                    # Calculate average resistance rate
                    total_resistance = 0
                    valid_predictions = 0
                    for pred in predictions:
                        susceptible_count = len(pred.get("susceptibleAntibiotics", []))
                        resistant_count = len(pred.get("resistantAntibiotics", []))
                        total = susceptible_count + resistant_count
                        if total > 0:
                            resistance_rate = resistant_count / total
                            total_resistance += resistance_rate
                            valid_predictions += 1
                    
                    avg_resistance_rate = total_resistance / valid_predictions if valid_predictions > 0 else 0.25
                    
                    # Calculate trend (compare last 30 days vs previous 30 days)
                    now = datetime.utcnow()
                    recent_count = 0
                    older_count = 0
                    
                    for p in predictions:
                        created_at = p.get("created_at")
                        if created_at:
                            # Handle both datetime objects and string dates
                            if isinstance(created_at, str):
                                try:
                                    created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                                except:
                                    try:
                                        created_at = datetime.strptime(created_at, "%Y-%m-%dT%H:%M:%S")
                                    except:
                                        continue
                            
                            if isinstance(created_at, datetime):
                                days_ago = (now - created_at.replace(tzinfo=None)).days
                                if days_ago <= 30:
                                    recent_count += 1
                                elif 30 < days_ago <= 60:
                                    older_count += 1
                    
                    if older_count == 0:
                        trend = "stable"
                    elif recent_count > older_count * 1.1:
                        trend = "increasing"
                    elif recent_count < older_count * 0.9:
                        trend = "decreasing"
                    else:
                        trend = "stable"
                    
                    regions_with_trends.append({
                        "region": display_name,
                        "lat": coords["lat"],
                        "lng": coords["lng"],
                        "cases": cases,
                        "avg_resistance_rate": round(avg_resistance_rate, 3),
                        "organisms": list(region_info["organisms"]),
                        "trend": trend,
                    })
                
                if regions_with_trends:
                    print(f"Returning {len(regions_with_trends)} regions with data")
                    print(f"Sample region data: {regions_with_trends[0] if regions_with_trends else 'None'}")
                    return {"regions": regions_with_trends, "Count": len(regions_with_trends)}
                else:
                    print(f"Warning: Found {len(region_groups)} region groups but none were added to results")
                    print(f"Region groups found: {list(region_groups.keys())}")
                    return {"regions": [], "Count": 0, "message": f"Found {len(region_groups)} regions but none matched coordinate map"}
        except Exception as e:
            import traceback
            print(f"Error aggregating region data: {e}")
            traceback.print_exc()
            return {"regions": [], "Count": 0, "error": str(e), "message": f"Error processing region data: {str(e)}"}
    
    # Fallback: return empty array if no database or no data
    return {"regions": [], "Count": 0, "message": "No region data available - database not connected"}


@router.get("/trends", summary="Get resistance trends over the past 12 months")
async def get_resistance_trends(db: Optional[Database] = Depends(get_db)):
    """Get resistance trends over time from database."""
    
    if db is not None:
        try:
            trends_data: List[Dict[str, Any]] = []
            base_date = datetime.utcnow()
            
            # Aggregate data by month for the past 12 months
            for i in range(11, -1, -1):
                month_start = base_date - timedelta(days=30 * (i + 1))
                month_end = base_date - timedelta(days=30 * i)
                month_date = month_end
                month_name = month_date.strftime("%b %Y")
                
                # Get all predictions and filter by date in Python (handles both datetime and string dates)
                all_predictions = list(db.predictions.find({}, {
                    "susceptibleAntibiotics": 1,
                    "resistantAntibiotics": 1,
                    "created_at": 1,
                }))
                
                month_predictions = []
                for pred in all_predictions:
                    created_at = pred.get("created_at")
                    if created_at:
                        # Handle both datetime objects and string dates
                        if isinstance(created_at, str):
                            try:
                                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                            except:
                                try:
                                    created_at = datetime.strptime(created_at, "%Y-%m-%dT%H:%M:%S")
                                except:
                                    continue
                        
                        if isinstance(created_at, datetime):
                            created_at = created_at.replace(tzinfo=None)
                            if month_start <= created_at < month_end:
                                month_predictions.append(pred)
                
                if month_predictions:
                    # Calculate average resistance rate for the month
                    total_resistance = 0
                    for pred in month_predictions:
                        susceptible_count = len(pred.get("susceptibleAntibiotics", []))
                        resistant_count = len(pred.get("resistantAntibiotics", []))
                        total = susceptible_count + resistant_count
                        if total > 0:
                            resistance_rate = resistant_count / total
                            total_resistance += resistance_rate
                    
                    avg_resistance_rate = total_resistance / len(month_predictions) if month_predictions else 0.25
                    cases = len(month_predictions)
                else:
                    # No data for this month
                    avg_resistance_rate = 0.25
                    cases = 0
                
                trends_data.append({
                    "month": month_name,
                    "month_index": 11 - i,
                    "resistance_rate": round(avg_resistance_rate, 3),
                    "cases": cases,
                    "date": month_date.strftime("%Y-%m"),
                })
            
            return {"trends": trends_data, "count": len(trends_data)}
        except Exception as e:
            print(f"Error fetching trends data: {e}")
    
    # Fallback: return empty trends if no database
    return {"trends": [], "count": 0}


@router.get("/organisms", summary="Get organism distribution statistics")
async def get_organism_distribution(db: Optional[Database] = Depends(get_db)):
    """
    Get organism distribution data from database - aggregated from predictions.
    """
    
    if db is not None:
        try:
            # Aggregate organism distribution from predictions
            pipeline = [
                {"$match": {"bacterialSpecies": {"$exists": True, "$ne": None}}},
                {
                    "$group": {
                        "_id": "$bacterialSpecies",
                        "cases": {"$sum": 1},
                    }
                },
                {"$sort": {"cases": -1}},
                {"$limit": 10},  # Top 10 organisms
            ]
            
            aggregated = list(db.predictions.aggregate(pipeline))
            
            if aggregated:
                total_cases = sum(item["cases"] for item in aggregated)
                
                distribution_data = []
                for item in aggregated:
                    percentage = (item["cases"] / total_cases * 100) if total_cases > 0 else 0
                    distribution_data.append({
                        "organism": item["_id"],
                        "cases": item["cases"],
                        "percentage": round(percentage, 1),
                    })
                
                print(f"Returning {len(distribution_data)} organisms")
                return {
                    "distribution": distribution_data,
                    "total_cases": total_cases,
                    "count": len(distribution_data),
                }
        except Exception as e:
            import traceback
            print(f"Error aggregating organism distribution: {e}")
            print(traceback.format_exc())
    
    # Fallback: return empty distribution if no database or no data
    return {
        "distribution": [],
        "total_cases": 0,
        "count": 0,
    }


