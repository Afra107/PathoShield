from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends
from pymongo.database import Database


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


@router.get("/regions", summary="Get regional surveillance data")
async def get_surveillance_regions(db: Optional[Database] = Depends(get_db)):
    """Get surveillance data by regions with geographic coordinates from database."""
    
    # Region coordinates mapping (static geographic data) - case-insensitive lookup
    region_coords_map = {
        "punjab": {"lat": 31.5204, "lng": 74.3587},
        "sindh": {"lat": 24.8607, "lng": 67.0011},
        "kpk": {"lat": 34.0151, "lng": 71.5249},
        "khyber pakhtunkhwa": {"lat": 34.0151, "lng": 71.5249},
        "balochistan": {"lat": 30.1798, "lng": 66.975},
        "gilgit-baltistan": {"lat": 35.8028, "lng": 74.4667},
        "azad kashmir": {"lat": 33.7782, "lng": 73.8472},
    }
    
    # Display names mapping
    region_display_names = {
        "punjab": "Punjab",
        "sindh": "Sindh",
        "kpk": "KPK",
        "khyber pakhtunkhwa": "KPK",
        "balochistan": "Balochistan",
        "gilgit-baltistan": "Gilgit-Baltistan",
        "azad kashmir": "Azad Kashmir",
    }
    
    if db is not None:
        try:
            # First, check if we have any predictions at all
            total_predictions = db.predictions.count_documents({})
            print(f"Total predictions in database: {total_predictions}")
            
            if total_predictions == 0:
                return {"regions": [], "Count": 0, "message": "No predictions found in database"}
            
            # Get all unique regions from predictions (case-insensitive)
            all_predictions = list(db.predictions.find({}, {"region": 1, "bacterialSpecies": 1, "susceptibleAntibiotics": 1, "resistantAntibiotics": 1, "created_at": 1}))
            
            # Group by region (normalize to lowercase for matching)
            region_groups = {}
            for pred in all_predictions:
                region = pred.get("region")
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
            
            print(f"Found {len(region_groups)} unique regions: {list(region_groups.keys())}")
            
            if region_groups:
                regions_with_trends = []
                for region_key, region_info in region_groups.items():
                    # Get coordinates (try exact match first, then lowercase)
                    coords = region_coords_map.get(region_key, None)
                    if not coords:
                        # Try to find partial match
                        for key, val in region_coords_map.items():
                            if key in region_key or region_key in key:
                                coords = val
                                break
                    
                    if not coords:
                        # Skip regions without coordinates
                        print(f"Skipping region '{region_key}' - no coordinates found")
                        continue
                    
                    # Get display name
                    display_name = region_display_names.get(region_key, region_key.title())
                    
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
                    recent_count = sum(1 for p in predictions if p.get("created_at") and (now - p.get("created_at")).days <= 30)
                    older_count = sum(1 for p in predictions if p.get("created_at") and 30 < (now - p.get("created_at")).days <= 60)
                    
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
                    return {"regions": regions_with_trends, "Count": len(regions_with_trends)}
        except Exception as e:
            import traceback
            print(f"Error aggregating region data: {e}")
            print(traceback.format_exc())
    
    # Fallback: return empty array if no database or no data
    return {"regions": [], "Count": 0, "message": "No region data available"}


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
                
                # Get predictions for this month
                month_predictions = list(db.predictions.find({
                    "created_at": {
                        "$gte": month_start,
                        "$lt": month_end
                    }
                }))
                
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
            # Get all predictions with bacterial species
            all_predictions = list(db.predictions.find(
                {"bacterialSpecies": {"$exists": True, "$ne": None}},
                {"bacterialSpecies": 1}
            ))
            
            print(f"Found {len(all_predictions)} predictions with bacterial species")
            
            if all_predictions:
                # Count organisms manually (more reliable than aggregation)
                organism_counts = {}
                for pred in all_predictions:
                    organism = pred.get("bacterialSpecies")
                    if organism:
                        organism_counts[organism] = organism_counts.get(organism, 0) + 1
                
                # Sort by count and get top 10
                sorted_organisms = sorted(organism_counts.items(), key=lambda x: x[1], reverse=True)[:10]
                
                total_cases = sum(count for _, count in sorted_organisms)
                
                distribution_data = []
                for organism, cases in sorted_organisms:
                    percentage = (cases / total_cases * 100) if total_cases > 0 else 0
                    distribution_data.append({
                        "organism": organism,
                        "cases": cases,
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


