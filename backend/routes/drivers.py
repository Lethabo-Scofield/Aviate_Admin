import uuid
import traceback

import bcrypt
from flask import request, jsonify, g

from routes import drivers_bp
from middleware import require_auth, require_admin
from models import Driver, User, Job
from utils import get_db_session


@drivers_bp.route("/api/drivers", methods=["GET"])
@require_auth
@require_admin
def get_drivers():
    db = get_db_session()
    try:
        drivers = db.query(Driver).filter(Driver.company_id == g.company_id).all()
        return jsonify({"drivers": [d.to_dict() for d in drivers]})
    finally:
        db.close()


@drivers_bp.route("/api/drivers", methods=["POST"])
@require_auth
@require_admin
def add_driver():
    data = request.get_json() or {}
    name = data.get("name")
    email = (data.get("email") or "").strip().lower()
    vehicle_type = data.get("vehicle_type", "van")
    password = data.get("password", "")

    if not name:
        return jsonify({"error": "Driver name is required"}), 400

    if not email:
        return jsonify({"error": "Driver email is required for app login"}), 400

    db = get_db_session()
    try:
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            return jsonify({"error": f"A user with email {email} already exists"}), 409

        driver_id = f"DRV-{uuid.uuid4().hex[:6].upper()}"

        if not password:
            password = uuid.uuid4().hex[:8]

        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"

        driver = Driver(
            id=driver_id,
            name=name,
            email=email,
            vehicle_type=vehicle_type,
            company_id=g.company_id,
            user_id=user_id,
        )
        db.add(driver)
        db.flush()

        user = User(
            id=user_id,
            email=email,
            password_hash=password_hash,
            name=name,
            role="driver",
            company_id=g.company_id,
            driver_id=driver_id,
        )
        db.add(user)
        db.commit()

        result = driver.to_dict()
        result["generated_password"] = password

        return jsonify({"success": True, "driver": result}), 201
    except Exception:
        db.rollback()
        traceback.print_exc()
        return jsonify({"error": "Failed to add driver"}), 500
    finally:
        db.close()


@drivers_bp.route("/api/drivers/<driver_id>", methods=["DELETE"])
@require_auth
@require_admin
def remove_driver(driver_id):
    db = get_db_session()
    try:
        driver = db.query(Driver).filter(Driver.id == driver_id, Driver.company_id == g.company_id).first()
        if not driver:
            return jsonify({"error": "Driver not found"}), 404

        jobs = db.query(Job).filter(Job.driver_id == driver_id, Job.company_id == g.company_id).all()
        for job in jobs:
            job.status = "unassigned"
            job.driver_id = None
            job.driver_name = None

        if driver.user_id:
            user = db.query(User).filter(User.id == driver.user_id).first()
            if user:
                db.delete(user)

        db.delete(driver)
        db.commit()
        return jsonify({"success": True})
    except Exception:
        db.rollback()
        traceback.print_exc()
        return jsonify({"error": "Failed to remove driver"}), 500
    finally:
        db.close()


@drivers_bp.route("/api/my-jobs", methods=["GET"])
@require_auth
def get_my_jobs():
    db = get_db_session()
    try:
        driver = db.query(Driver).filter(
            Driver.user_id == g.user_id,
            Driver.company_id == g.company_id,
        ).first()

        if not driver:
            driver = db.query(Driver).filter(
                Driver.email == g.user_email,
                Driver.company_id == g.company_id,
            ).first()

        if not driver:
            return jsonify({"jobs": [], "driver": None})

        my_jobs = db.query(Job).filter(
            Job.driver_id == driver.id,
            Job.company_id == g.company_id,
        ).all()

        return jsonify({
            "driver": driver.to_dict(),
            "jobs": [j.to_dict() for j in my_jobs],
        })
    finally:
        db.close()


@drivers_bp.route("/api/my-jobs/<job_id>/complete/<stop_id>", methods=["POST"])
@require_auth
def complete_my_stop(job_id, stop_id):
    from models import Stop
    from datetime import datetime, timezone

    db = get_db_session()
    try:
        driver = db.query(Driver).filter(
            Driver.user_id == g.user_id,
            Driver.company_id == g.company_id,
        ).first()

        if not driver:
            driver = db.query(Driver).filter(
                Driver.email == g.user_email,
                Driver.company_id == g.company_id,
            ).first()

        if not driver:
            return jsonify({"error": "No driver profile linked to your account"}), 403

        job = db.query(Job).filter(
            Job.id == job_id,
            Job.driver_id == driver.id,
            Job.company_id == g.company_id,
        ).first()
        if not job:
            return jsonify({"error": "Job not found or not assigned to you"}), 404

        stop = db.query(Stop).filter(Stop.id == stop_id, Stop.job_id == job_id).first()
        if not stop:
            return jsonify({"error": "Stop not found"}), 404

        stop.completed = True
        stop.completed_at = datetime.now(timezone.utc)

        all_stops = db.query(Stop).filter(Stop.job_id == job_id).all()
        if all(s.completed for s in all_stops):
            job.status = "completed"
            job.completed_at = datetime.now(timezone.utc)

        db.commit()
        return jsonify({"success": True, "stop": stop.to_dict(), "job_status": job.status})
    except Exception:
        db.rollback()
        traceback.print_exc()
        return jsonify({"error": "Failed to complete stop"}), 500
    finally:
        db.close()


@drivers_bp.route("/api/driver/<driver_id>/jobs", methods=["GET"])
@require_auth
def get_driver_jobs(driver_id):
    db = get_db_session()
    try:
        driver = db.query(Driver).filter(
            Driver.id == driver_id,
            Driver.company_id == g.company_id,
        ).first()
        if not driver:
            return jsonify({"error": "Driver not found"}), 404
        driver_jobs = db.query(Job).filter(Job.driver_id == driver_id, Job.company_id == g.company_id).all()
        return jsonify({"driver_id": driver_id, "jobs": [j.to_dict() for j in driver_jobs]})
    finally:
        db.close()


@drivers_bp.route("/api/driver/<driver_id>/complete/<job_id>/<stop_id>", methods=["POST"])
@require_auth
def complete_stop(driver_id, job_id, stop_id):
    from models import Stop
    from datetime import datetime, timezone

    db = get_db_session()
    try:
        job = db.query(Job).filter(
            Job.id == job_id,
            Job.driver_id == driver_id,
            Job.company_id == g.company_id,
        ).first()
        if not job:
            return jsonify({"error": "Job not found"}), 404

        stop = db.query(Stop).filter(Stop.id == stop_id, Stop.job_id == job_id).first()
        if not stop:
            return jsonify({"error": "Stop not found"}), 404

        stop.completed = True
        stop.completed_at = datetime.now(timezone.utc)

        all_stops = db.query(Stop).filter(Stop.job_id == job_id).all()
        if all(s.completed for s in all_stops):
            job.status = "completed"
            job.completed_at = datetime.now(timezone.utc)

        db.commit()
        return jsonify({"success": True, "stop": stop.to_dict(), "job_status": job.status})
    except Exception:
        db.rollback()
        return jsonify({"error": "Failed to complete stop"}), 500
    finally:
        db.close()
