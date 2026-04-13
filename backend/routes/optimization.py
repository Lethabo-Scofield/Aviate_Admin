import os
import uuid
import traceback
import time as time_module

import pandas as pd
import requests as http_requests
from flask import request, jsonify, g
from geopy.geocoders import Nominatim

from routes import optimization_bp
from middleware import require_auth, require_admin
from models import Stop, Job
from optimize_route import geocode_address, build_distance_matrix, DEPOT
from utils import cluster_stops, determine_area_name, load_test_stops, get_db_session
from config import UPLOAD_FOLDER


@optimization_bp.route("/api/upload", methods=["POST"])
@require_auth
@require_admin
def upload_excel():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ("xlsx", "xls", "csv"):
        return jsonify({"error": "Unsupported file type. Upload .xlsx, .xls, or .csv"}), 400

    filepath = os.path.join(UPLOAD_FOLDER, f"upload_{uuid.uuid4().hex[:8]}.{ext}")
    file.save(filepath)

    try:
        if ext == "csv":
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)

        df = _normalize_columns(df)
        stops_data, failed = _geocode_stops(df)

        company_id = g.company_id
        db = get_db_session()
        try:
            db.query(Stop).filter(Stop.job_id.is_(None), Stop.company_id == company_id).delete()
            for s in stops_data:
                db.add(Stop(
                    id=s["id"], order_id=s["order_id"], customer_name=s["customer_name"],
                    address=s["address"], lat=s["lat"], lng=s["lng"], demand=s["demand"],
                    service_time=s["service_time"], phone=s["phone"], notes=s["notes"],
                    time_window_start=s["time_window_start"], time_window_end=s["time_window_end"],
                    company_id=company_id,
                ))
            db.commit()
        except Exception:
            db.rollback()
            traceback.print_exc()
            return jsonify({"error": "Failed to save stops"}), 500
        finally:
            db.close()

        return jsonify({
            "success": True,
            "total_rows": len(df),
            "geocoded": len(stops_data),
            "failed": len(failed),
            "failed_details": failed,
            "stops": stops_data,
        })

    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Failed to process upload"}), 500
    finally:
        try:
            os.remove(filepath)
        except OSError:
            pass


@optimization_bp.route("/api/test-data", methods=["POST"])
@require_auth
@require_admin
def load_test_data():
    test_stops = load_test_stops()
    company_id = g.company_id
    unique_prefix = uuid.uuid4().hex[:4]

    db = get_db_session()
    try:
        db.query(Stop).filter(Stop.job_id.is_(None), Stop.company_id == company_id).delete()
        db.query(Stop).filter(Stop.id.like("test%"), Stop.company_id == company_id).delete()
        db.flush()

        for s in test_stops:
            stop_id = f"{s['id']}_{unique_prefix}"
            db.add(Stop(
                id=stop_id, order_id=s["order_id"], customer_name=s["customer_name"],
                address=s["address"], lat=s["lat"], lng=s["lng"], demand=s["demand"],
                service_time=s["service_time"], phone=s["phone"], notes=s["notes"],
                time_window_start=s["time_window_start"], time_window_end=s["time_window_end"],
                company_id=company_id,
            ))
        db.commit()
    except Exception:
        db.rollback()
        traceback.print_exc()
        return jsonify({"error": "Failed to load test data"}), 500
    finally:
        db.close()

    return jsonify({
        "success": True,
        "total_rows": len(test_stops),
        "geocoded": len(test_stops),
        "failed": 0,
        "failed_details": [],
        "stops": test_stops,
    })


@optimization_bp.route("/api/optimize", methods=["POST"])
@require_auth
@require_admin
def optimize():
    data = request.get_json() or {}
    cluster_radius = float(data.get("cluster_radius", 8))
    company_id = g.company_id

    db = get_db_session()
    try:
        _clear_existing_jobs(db, company_id)

        stops_data = _get_stops_for_optimization(db, company_id, data)
        if not stops_data or len(stops_data) < 2:
            db.rollback()
            return jsonify({"error": "Need at least 2 stops to optimize"}), 400

        clusters = cluster_stops(stops_data, radius_km=cluster_radius)
        jobs_created = _create_jobs_from_clusters(db, clusters, company_id)

        db.commit()

        _fetch_route_geometries(jobs_created)
        db.commit()

        jobs_created.sort(key=lambda j: j.total_stops, reverse=True)
        jobs_out = [j.to_dict() for j in jobs_created]

        return jsonify({
            "success": True,
            "total_stops": len(stops_data),
            "total_jobs": len(jobs_out),
            "jobs": jobs_out,
        })

    except Exception:
        db.rollback()
        traceback.print_exc()
        return jsonify({"error": "Route optimization failed"}), 500
    finally:
        db.close()


@optimization_bp.route("/api/route", methods=["POST"])
@require_auth
@require_admin
def get_road_route():
    data = request.get_json() or {}
    waypoints = data.get("waypoints", [])

    if len(waypoints) < 2:
        return jsonify({"error": "Need at least 2 waypoints"}), 400

    coords = ";".join(f"{p[1]},{p[0]}" for p in waypoints)
    url = f"https://router.project-osrm.org/route/v1/driving/{coords}?overview=full&geometries=polyline"

    try:
        resp = http_requests.get(url, timeout=15)
        osrm_data = resp.json()
        if osrm_data.get("code") == "Ok" and osrm_data.get("routes"):
            return jsonify({
                "success": True,
                "geometry": osrm_data["routes"][0]["geometry"],
                "distance": osrm_data["routes"][0].get("distance", 0),
                "duration": osrm_data["routes"][0].get("duration", 0),
            })
        return jsonify({"success": False, "error": "No route found"}), 404
    except Exception:
        traceback.print_exc()
        return jsonify({"success": False, "error": "Failed to fetch route"}), 500


def _normalize_columns(df):
    required_cols = ["Full_Address"]
    if not all(col in df.columns for col in required_cols):
        alt_check = "address" in [c.lower() for c in df.columns]
        if not alt_check:
            raise ValueError(f"Excel must contain a 'Full_Address' or 'address' column. Found: {df.columns.tolist()}")
        addr_col = [c for c in df.columns if c.lower() == "address"][0]
        df = df.rename(columns={addr_col: "Full_Address"})

    defaults = {
        "Order_ID": [f"ORD-{i+1:03d}" for i in range(len(df))],
        "Customer_Name": [f"Customer {i+1}" for i in range(len(df))],
        "Demand": 1,
        "Service_Time": 15,
        "Phone": "",
        "Notes": "",
        "Time_Window_Start": "",
        "Time_Window_End": "",
    }
    for col, default in defaults.items():
        if col not in df.columns:
            df[col] = default

    return df


def _geocode_stops(df):
    geolocator = Nominatim(user_agent="aviate-dispatch-mvp", timeout=10)
    stops_data = []
    failed = []

    for idx, row in df.iterrows():
        addr = str(row["Full_Address"]).strip()
        if not addr or addr == "nan":
            failed.append({"row": idx + 2, "address": addr, "reason": "Empty address"})
            continue

        lat, lng = geocode_address(addr, geolocator)

        if lat == DEPOT["lat"] and lng == DEPOT["lng"]:
            failed.append({"row": idx + 2, "address": addr, "reason": "Could not geocode"})
            continue

        stop_dict = {
            "id": str(uuid.uuid4().hex[:8]),
            "order_id": str(row.get("Order_ID", f"ORD-{idx+1:03d}")),
            "customer_name": str(row.get("Customer_Name", f"Customer {idx+1}")),
            "address": addr,
            "lat": lat,
            "lng": lng,
            "demand": int(row.get("Demand", 1)) if not pd.isna(row.get("Demand", 1)) else 1,
            "time_window_start": str(row.get("Time_Window_Start", "")) if not pd.isna(row.get("Time_Window_Start", "")) else "",
            "time_window_end": str(row.get("Time_Window_End", "")) if not pd.isna(row.get("Time_Window_End", "")) else "",
            "service_time": int(row.get("Service_Time", 15)) if not pd.isna(row.get("Service_Time", 15)) else 15,
            "phone": str(row.get("Phone", "")) if not pd.isna(row.get("Phone", "")) else "",
            "notes": str(row.get("Notes", "")) if not pd.isna(row.get("Notes", "")) else "",
        }
        stops_data.append(stop_dict)
        time_module.sleep(1.1)

    return stops_data, failed


def _clear_existing_jobs(db, company_id):
    old_jobs = db.query(Job).filter(Job.company_id == company_id).all()
    for oj in old_jobs:
        for s in oj.stops:
            s.job_id = None
            s.stop_number = 0
        db.delete(oj)
    db.flush()


def _get_stops_for_optimization(db, company_id, data):
    unassigned_stops = db.query(Stop).filter(Stop.company_id == company_id).all()
    stops_data = [s.to_dict() for s in unassigned_stops]

    incoming_stops = data.get("stops")
    if incoming_stops and len(incoming_stops) >= 2:
        stops_data = incoming_stops

    return stops_data


def _create_jobs_from_clusters(db, clusters, company_id):
    jobs_created = []

    for cluster in clusters:
        if len(cluster) == 0:
            continue

        center_lat = sum(s["lat"] for s in cluster) / len(cluster)
        center_lng = sum(s["lng"] for s in cluster) / len(cluster)

        locations = [(DEPOT["lat"], DEPOT["lng"])] + [(s["lat"], s["lng"]) for s in cluster]
        dist_matrix = build_distance_matrix(locations)

        ordered_stops, total_dist = _solve_tsp(cluster, locations, dist_matrix)

        area_name = determine_area_name(center_lat, center_lng)
        est_time = int(total_dist / 35 * 60) + sum(s.get("service_time", 15) for s in ordered_stops)

        job_id = f"JOB-{uuid.uuid4().hex[:6].upper()}"
        job = Job(
            id=job_id,
            area=area_name,
            total_stops=int(len(ordered_stops)),
            total_distance_km=float(round(total_dist, 1)),
            estimated_time_min=int(est_time),
            estimated_cost=float(round(total_dist * 12 + est_time * 2.5, 2)),
            center_lat=float(center_lat),
            center_lng=float(center_lng),
            status="unassigned",
            company_id=company_id,
        )
        db.add(job)

        for i, stop_data in enumerate(ordered_stops):
            with db.no_autoflush:
                stop = db.query(Stop).filter(Stop.id == stop_data["id"], Stop.company_id == company_id).first()
            if stop:
                stop.job_id = job_id
                stop.stop_number = i + 1
            else:
                db.add(Stop(
                    id=stop_data["id"], order_id=stop_data.get("order_id", ""),
                    customer_name=stop_data.get("customer_name", ""),
                    address=stop_data.get("address", ""),
                    lat=stop_data["lat"], lng=stop_data["lng"],
                    demand=stop_data.get("demand", 1),
                    service_time=stop_data.get("service_time", 15),
                    phone=stop_data.get("phone", ""),
                    notes=stop_data.get("notes", ""),
                    time_window_start=stop_data.get("time_window_start", ""),
                    time_window_end=stop_data.get("time_window_end", ""),
                    job_id=job_id, stop_number=i + 1,
                    company_id=company_id,
                ))

        jobs_created.append(job)

    return jobs_created


def _solve_tsp(cluster, locations, dist_matrix):
    if len(cluster) > 2:
        from ortools.constraint_solver import pywrapcp, routing_enums_pb2

        manager = pywrapcp.RoutingIndexManager(len(locations), 1, 0)
        routing = pywrapcp.RoutingModel(manager)

        def distance_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return int(dist_matrix[from_node][to_node] * 1000)

        transit_cb = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_cb)

        search_params = pywrapcp.DefaultRoutingSearchParameters()
        search_params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        search_params.time_limit.seconds = 10

        solution = routing.SolveWithParameters(search_params)

        if solution:
            ordered_stops = []
            index = routing.Start(0)
            total_dist = 0
            while not routing.IsEnd(index):
                node = manager.IndexToNode(index)
                if node > 0:
                    ordered_stops.append(cluster[node - 1])
                prev_index = index
                index = solution.Value(routing.NextVar(index))
                from_node = manager.IndexToNode(prev_index)
                to_node = manager.IndexToNode(index) if not routing.IsEnd(index) else 0
                total_dist += dist_matrix[from_node][to_node]
            return ordered_stops, total_dist

    ordered_stops = cluster
    total_dist = sum(dist_matrix[0][i + 1] for i in range(len(cluster)))
    return ordered_stops, total_dist


def _fetch_route_geometries(jobs_created):
    for job in jobs_created:
        try:
            sorted_stops = sorted(job.stops, key=lambda s: s.stop_number or 0)
            valid_stops = [s for s in sorted_stops if s.lat and s.lng]
            if not valid_stops:
                continue
            waypoints = [[DEPOT["lat"], DEPOT["lng"]]]
            waypoints += [[float(s.lat), float(s.lng)] for s in valid_stops]
            waypoints.append([DEPOT["lat"], DEPOT["lng"]])
            coords = ";".join(f"{p[1]},{p[0]}" for p in waypoints)
            url = f"https://router.project-osrm.org/route/v1/driving/{coords}?overview=full&geometries=polyline"
            resp = http_requests.get(url, timeout=15)
            osrm_data = resp.json()
            if osrm_data.get("code") == "Ok" and osrm_data.get("routes"):
                job.route_geometry = osrm_data["routes"][0]["geometry"]
        except Exception as route_err:
            print(f"Route geometry fetch failed for {job.id}: {route_err}")
