from flask import jsonify, g

from routes import stats_bp
from middleware import require_auth, require_admin
from models import Job, Driver
from utils import get_db_session


@stats_bp.route("/api/stats", methods=["GET"])
@require_auth
@require_admin
def get_stats():
    db = get_db_session()
    try:
        jobs = db.query(Job).filter(Job.company_id == g.company_id).all()
        drivers = db.query(Driver).filter(Driver.company_id == g.company_id).all()

        total_jobs = len(jobs)
        unassigned = len([j for j in jobs if j.status == "unassigned"])
        assigned = len([j for j in jobs if j.status == "assigned"])
        completed = len([j for j in jobs if j.status == "completed"])
        total_stops = sum(j.total_stops for j in jobs)
        total_distance = sum(j.total_distance_km for j in jobs)
        total_cost = sum(j.estimated_cost for j in jobs)

        return jsonify({
            "total_jobs": total_jobs,
            "unassigned": unassigned,
            "assigned": assigned,
            "completed": completed,
            "total_stops": total_stops,
            "total_distance_km": round(total_distance, 1),
            "total_estimated_cost": round(total_cost, 2),
            "total_drivers": len(drivers),
        })
    finally:
        db.close()
