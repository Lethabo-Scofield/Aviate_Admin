import os
import uuid
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from optimize_route import optimize_route_from_data, geocode_address, build_distance_matrix, DEPOT
from geopy.geocoders import Nominatim
import time as time_module
import numpy as np
from math import radians, sin, cos, sqrt, atan2

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

store = {
    "stops": [],
    "jobs": [],
    "drivers": [],
    "assignments": {},
}


def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


def cluster_stops(stops, radius_km=8):
    clusters = []
    used = set()

    sorted_stops = sorted(stops, key=lambda s: (s["lat"], s["lng"]))

    for i, stop in enumerate(sorted_stops):
        if i in used:
            continue
        cluster = [stop]
        used.add(i)

        for j, other in enumerate(sorted_stops):
            if j in used:
                continue
            dist = haversine(stop["lat"], stop["lng"], other["lat"], other["lng"])
            if dist <= radius_km:
                cluster.append(other)
                used.add(j)

        clusters.append(cluster)

    return clusters


@app.route('/')
def root():
    return jsonify({"status": "ok", "service": "Aviate Dispatch API"})


@app.route('/api/upload', methods=['POST'])
def upload_excel():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    ext = file.filename.rsplit('.', 1)[-1].lower()
    if ext not in ('xlsx', 'xls', 'csv'):
        return jsonify({"error": "Unsupported file type. Upload .xlsx, .xls, or .csv"}), 400

    filepath = os.path.join(UPLOAD_FOLDER, f"upload_{uuid.uuid4().hex[:8]}.{ext}")
    file.save(filepath)

    try:
        if ext == 'csv':
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)

        required_cols = ['Full_Address']
        if not all(col in df.columns for col in required_cols):
            alt_check = 'address' in [c.lower() for c in df.columns]
            if not alt_check:
                return jsonify({"error": f"Excel must contain a 'Full_Address' or 'address' column. Found: {df.columns.tolist()}"}), 400
            addr_col = [c for c in df.columns if c.lower() == 'address'][0]
            df = df.rename(columns={addr_col: 'Full_Address'})

        for col in ['Order_ID', 'Customer_Name', 'Demand', 'Time_Window_Start',
                     'Time_Window_End', 'Service_Time', 'Phone', 'Notes']:
            if col not in df.columns:
                if col == 'Order_ID':
                    df[col] = [f"ORD-{i+1:03d}" for i in range(len(df))]
                elif col == 'Customer_Name':
                    df[col] = [f"Customer {i+1}" for i in range(len(df))]
                elif col == 'Demand':
                    df[col] = 1
                elif col == 'Service_Time':
                    df[col] = 15
                elif col == 'Phone':
                    df[col] = ""
                elif col == 'Notes':
                    df[col] = ""
                elif col in ('Time_Window_Start', 'Time_Window_End'):
                    df[col] = ""

        geolocator = Nominatim(user_agent="aviate-dispatch-mvp", timeout=10)
        stops = []
        failed = []

        for idx, row in df.iterrows():
            addr = str(row['Full_Address']).strip()
            if not addr or addr == 'nan':
                failed.append({"row": idx + 2, "address": addr, "reason": "Empty address"})
                continue

            lat, lng = geocode_address(addr, geolocator)

            if lat == DEPOT["lat"] and lng == DEPOT["lng"]:
                failed.append({"row": idx + 2, "address": addr, "reason": "Could not geocode"})
                continue

            stop = {
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
            stops.append(stop)
            time_module.sleep(1.1)

        store["stops"] = stops

        return jsonify({
            "success": True,
            "total_rows": len(df),
            "geocoded": len(stops),
            "failed": len(failed),
            "failed_details": failed,
            "stops": stops,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            os.remove(filepath)
        except:
            pass


@app.route('/api/optimize', methods=['POST'])
def optimize():
    data = request.get_json() or {}
    stops = data.get("stops") or store.get("stops", [])
    num_drivers = int(data.get("num_drivers", 4))
    cluster_radius = float(data.get("cluster_radius", 8))

    if not stops or len(stops) < 2:
        return jsonify({"error": "Need at least 2 stops to optimize"}), 400

    try:
        clusters = cluster_stops(stops, radius_km=cluster_radius)

        jobs = []
        for ci, cluster in enumerate(clusters):
            if len(cluster) == 0:
                continue

            center_lat = sum(s["lat"] for s in cluster) / len(cluster)
            center_lng = sum(s["lng"] for s in cluster) / len(cluster)

            locations = [(DEPOT["lat"], DEPOT["lng"])] + [(s["lat"], s["lng"]) for s in cluster]
            dist_matrix = build_distance_matrix(locations)

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
                else:
                    ordered_stops = cluster
                    total_dist = sum(dist_matrix[0][i + 1] for i in range(len(cluster)))
            else:
                ordered_stops = cluster
                total_dist = sum(dist_matrix[0][i + 1] for i in range(len(cluster)))

            for i, stop in enumerate(ordered_stops):
                stop["stop_number"] = i + 1

            area_name = _determine_area_name(center_lat, center_lng, ordered_stops)

            est_time = int(total_dist / 35 * 60) + sum(s.get("service_time", 15) for s in ordered_stops)

            job = {
                "id": f"JOB-{uuid.uuid4().hex[:6].upper()}",
                "area": area_name,
                "stops": ordered_stops,
                "total_stops": len(ordered_stops),
                "total_distance_km": round(total_dist, 1),
                "estimated_time_min": est_time,
                "estimated_cost": round(total_dist * 12 + est_time * 2.5, 2),
                "center_lat": center_lat,
                "center_lng": center_lng,
                "status": "unassigned",
                "driver_id": None,
                "driver_name": None,
                "created_at": datetime.now().isoformat(),
            }
            jobs.append(job)

        jobs.sort(key=lambda j: j["total_stops"], reverse=True)

        store["jobs"] = jobs

        return jsonify({
            "success": True,
            "total_stops": len(stops),
            "total_jobs": len(jobs),
            "jobs": jobs,
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


def _determine_area_name(lat, lng, stops):
    areas = [
        (-26.195, 28.045, "Johannesburg CBD"),
        (-26.107, 28.057, "Sandton"),
        (-26.146, 28.044, "Rosebank"),
        (-26.146, 27.967, "Northcliff"),
        (-26.126, 27.989, "Randburg"),
        (-26.065, 28.024, "Bryanston"),
        (-26.170, 28.063, "Orange Grove"),
        (-26.147, 28.066, "Melrose"),
        (-26.230, 28.043, "Rosettenville"),
        (-26.178, 27.916, "Florida"),
        (-26.187, 28.043, "Braamfontein"),
        (-26.193, 28.015, "Auckland Park"),
        (-26.133, 28.101, "Edenvale"),
        (-26.088, 28.149, "Kempton Park"),
        (-26.188, 28.032, "Newtown"),
        (-26.260, 28.075, "Alberton"),
        (-26.100, 28.000, "Fourways"),
        (-26.152, 27.904, "Roodepoort"),
    ]
    best = "Zone"
    best_dist = float('inf')
    for a_lat, a_lng, name in areas:
        d = haversine(lat, lng, a_lat, a_lng)
        if d < best_dist:
            best_dist = d
            best = name

    if best_dist > 15:
        best = f"Area ({round(lat, 2)}, {round(lng, 2)})"

    return best


@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    return jsonify({"jobs": store.get("jobs", [])})


@app.route('/api/jobs/<job_id>/assign', methods=['POST'])
def assign_driver(job_id):
    data = request.get_json() or {}
    driver_id = data.get("driver_id")

    if not driver_id:
        return jsonify({"error": "driver_id is required"}), 400

    driver = next((d for d in store.get("drivers", []) if d["id"] == driver_id), None)
    if not driver:
        return jsonify({"error": "Driver not found"}), 404

    job = None
    for j in store.get("jobs", []):
        if j["id"] == job_id:
            job = j
            break

    if not job:
        return jsonify({"error": "Job not found"}), 404

    job["status"] = "assigned"
    job["driver_id"] = driver_id
    job["driver_name"] = driver["name"]
    job["assigned_at"] = datetime.now().isoformat()

    if driver_id not in store["assignments"]:
        store["assignments"][driver_id] = []
    store["assignments"][driver_id].append(job_id)

    return jsonify({"success": True, "job": job})


@app.route('/api/jobs/<job_id>/unassign', methods=['POST'])
def unassign_driver(job_id):
    job = None
    for j in store.get("jobs", []):
        if j["id"] == job_id:
            job = j
            break

    if not job:
        return jsonify({"error": "Job not found"}), 404

    old_driver = job.get("driver_id")
    job["status"] = "unassigned"
    job["driver_id"] = None
    job["driver_name"] = None

    if old_driver and old_driver in store["assignments"]:
        store["assignments"][old_driver] = [jid for jid in store["assignments"][old_driver] if jid != job_id]

    return jsonify({"success": True, "job": job})


@app.route('/api/drivers', methods=['GET'])
def get_drivers():
    return jsonify({"drivers": store.get("drivers", [])})


@app.route('/api/drivers', methods=['POST'])
def add_driver():
    data = request.get_json() or {}
    name = data.get("name")
    phone = data.get("phone", "")
    vehicle_type = data.get("vehicle_type", "van")

    if not name:
        return jsonify({"error": "Driver name is required"}), 400

    driver = {
        "id": f"DRV-{uuid.uuid4().hex[:6].upper()}",
        "name": name,
        "phone": phone,
        "vehicle_type": vehicle_type,
        "status": "available",
        "created_at": datetime.now().isoformat(),
    }
    store["drivers"].append(driver)
    return jsonify({"success": True, "driver": driver}), 201


@app.route('/api/drivers/<driver_id>', methods=['DELETE'])
def remove_driver(driver_id):
    drivers = store.get("drivers", [])
    store["drivers"] = [d for d in drivers if d["id"] != driver_id]

    for job in store.get("jobs", []):
        if job.get("driver_id") == driver_id:
            job["status"] = "unassigned"
            job["driver_id"] = None
            job["driver_name"] = None

    if driver_id in store["assignments"]:
        del store["assignments"][driver_id]

    return jsonify({"success": True})


@app.route('/api/driver/<driver_id>/jobs', methods=['GET'])
def get_driver_jobs(driver_id):
    driver_jobs = [j for j in store.get("jobs", []) if j.get("driver_id") == driver_id]
    return jsonify({"driver_id": driver_id, "jobs": driver_jobs})


@app.route('/api/driver/<driver_id>/complete/<job_id>/<stop_id>', methods=['POST'])
def complete_stop(driver_id, job_id, stop_id):
    for job in store.get("jobs", []):
        if job["id"] == job_id and job.get("driver_id") == driver_id:
            for stop in job["stops"]:
                if stop["id"] == stop_id:
                    stop["completed"] = True
                    stop["completed_at"] = datetime.now().isoformat()

                    all_done = all(s.get("completed") for s in job["stops"])
                    if all_done:
                        job["status"] = "completed"
                        job["completed_at"] = datetime.now().isoformat()

                    return jsonify({"success": True, "stop": stop, "job_status": job["status"]})

    return jsonify({"error": "Stop not found"}), 404


@app.route('/api/stops', methods=['GET'])
def get_stops():
    return jsonify({"stops": store.get("stops", [])})


@app.route('/api/stats', methods=['GET'])
def get_stats():
    jobs = store.get("jobs", [])
    drivers = store.get("drivers", [])

    total_jobs = len(jobs)
    unassigned = len([j for j in jobs if j["status"] == "unassigned"])
    assigned = len([j for j in jobs if j["status"] == "assigned"])
    completed = len([j for j in jobs if j["status"] == "completed"])
    total_stops = sum(j["total_stops"] for j in jobs)
    total_distance = sum(j["total_distance_km"] for j in jobs)
    total_cost = sum(j["estimated_cost"] for j in jobs)

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


if __name__ == '__main__':
    print("Aviate Dispatch API starting on port 8000")
    app.run(debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true", host='0.0.0.0', port=8000)
