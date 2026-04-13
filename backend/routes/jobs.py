import traceback
from datetime import datetime, timezone

from flask import request, jsonify, g

from routes import jobs_bp
from middleware import require_auth, require_admin
from models import Job, Driver
from utils import get_db_session


@jobs_bp.route("/api/jobs", methods=["GET"])
@require_auth
@require_admin
def get_jobs():
    db = get_db_session()
    try:
        jobs = db.query(Job).filter(Job.company_id == g.company_id).all()
        return jsonify({"jobs": [j.to_dict() for j in jobs]})
    finally:
        db.close()


@jobs_bp.route("/api/jobs/<job_id>/assign", methods=["POST"])
@require_auth
@require_admin
def assign_driver(job_id):
    data = request.get_json() or {}
    driver_id = data.get("driver_id")

    if not driver_id:
        return jsonify({"error": "driver_id is required"}), 400

    db = get_db_session()
    try:
        driver = db.query(Driver).filter(Driver.id == driver_id, Driver.company_id == g.company_id).first()
        if not driver:
            return jsonify({"error": "Driver not found"}), 404

        job = db.query(Job).filter(Job.id == job_id, Job.company_id == g.company_id).first()
        if not job:
            return jsonify({"error": "Job not found"}), 404

        job.status = "assigned"
        job.driver_id = driver_id
        job.driver_name = driver.name
        job.assigned_at = datetime.now(timezone.utc)
        db.commit()

        return jsonify({"success": True, "job": job.to_dict()})
    except Exception:
        db.rollback()
        traceback.print_exc()
        return jsonify({"error": "Failed to assign driver"}), 500
    finally:
        db.close()


@jobs_bp.route("/api/jobs/<job_id>/unassign", methods=["POST"])
@require_auth
@require_admin
def unassign_driver(job_id):
    db = get_db_session()
    try:
        job = db.query(Job).filter(Job.id == job_id, Job.company_id == g.company_id).first()
        if not job:
            return jsonify({"error": "Job not found"}), 404

        job.status = "unassigned"
        job.driver_id = None
        job.driver_name = None
        job.assigned_at = None
        db.commit()

        return jsonify({"success": True, "job": job.to_dict()})
    except Exception:
        db.rollback()
        traceback.print_exc()
        return jsonify({"error": "Failed to unassign driver"}), 500
    finally:
        db.close()
