"""
Corridor Risk Engine
Multi-factor matrix combining precipitation, drainage capacity, topography, and real-time hazard reports.
"""

def evaluate_route_risk(segments: list, rainfall_mm: float) -> dict:
    total_score = 0
    bottlenecks = []
    
    for seg in segments:
        elev = seg.get("elevation_susceptibility", 0.5)
        drain = seg.get("drainage_susceptibility", 0.5)
        vuln = seg.get("road_vulnerability", 0.5)
        
        rain_factor = min(1.0, rainfall_mm / 250.0)
        score = round(100.0 * (0.45 * rain_factor + 0.25 * elev + 0.20 * drain + 0.10 * vuln))
        total_score += score
        
        if score > 70:
            bottlenecks.append({
                "segment_id": seg.get("segment_id"),
                "road_name": seg.get("road_name"),
                "score": score
            })
            
    avg_score = round(total_score / max(1, len(segments)))
    return {
        "corridor_risk_score": avg_score,
        "status": "IMPASSABLE" if avg_score > 80 else "CRITICAL" if avg_score > 60 else "PASSABLE",
        "bottlenecks": bottlenecks
    }
