import os
import uuid
import traceback
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import Flask, request, jsonify, g
from flask_cors import CORS
import pandas as pd
import requests as http_requests
from optimize_route import geocode_address, build_distance_matrix, DEPOT
from geopy.geocoders import Nominatim
import time as time_module
from math import radians, sin, cos, sqrt, atan2
import jwt
import bcrypt
from models import init_db, SessionLocal, Driver, Stop, Job, Company, User, engine

app = Flask(__name__)

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*")
if ALLOWED_ORIGINS == "*":
    CORS(app)
else:
    CORS(app, origins=[o.strip() for o in ALLOWED_ORIGINS.split(",")])

JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET:
    JWT_SECRET = os.urandom(32).hex()
    print("WARNING: JWT_SECRET not set, using random secret. Tokens will not persist across restarts.")

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

init_db()

from sqlalchemy import text, inspect
with engine.connect() as conn:
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    def _add_col_if_missing(table, col_name, col_def):
        if table in table_names:
            cols = [c["name"] for c in inspector.get_columns(table)]
            if col_name not in cols:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_def}"))
                conn.commit()
                print(f"  Added {col_name} to {table}")

    _add_col_if_missing("jobs", "route_geometry", "TEXT")
    _add_col_if_missing("jobs", "company_id", "VARCHAR REFERENCES companies(id)")
    _add_col_if_missing("stops", "company_id", "VARCHAR REFERENCES companies(id)")
    _add_col_if_missing("drivers", "company_id", "VARCHAR REFERENCES companies(id)")
    _add_col_if_missing("drivers", "user_id", "VARCHAR")
    _add_col_if_missing("users", "driver_id", "VARCHAR")


def get_db():
    db = SessionLocal()
    try:
        return db
    except:
        db.close()
        raise


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

        if not token:
            return jsonify({"error": "Authentication required"}), 401

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            g.user_id = payload["user_id"]
            g.company_id = payload["company_id"]
            g.user_email = payload.get("email", "")
            g.user_role = payload.get("role", "admin")
            g.driver_id = payload.get("driver_id")
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, **kwargs)
    return decorated


def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if g.user_role != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated


def generate_token(user):
    now = datetime.now(timezone.utc)
    payload = {
        "user_id": user.id,
        "company_id": user.company_id,
        "email": user.email,
        "role": user.role,
        "driver_id": user.driver_id,
        "exp": now + timedelta(days=30),
        "iat": now,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password", "")
    name = (data.get("name") or "").strip()
    company_name = (data.get("company_name") or "").strip()

    if not email or not password or not name or not company_name:
        return jsonify({"error": "All fields are required: name, email, password, company_name"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    db = get_db()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            return jsonify({"error": "An account with this email already exists"}), 409

        domain = email.split("@")[1] if "@" in email else ""

        company_id = f"CMP-{uuid.uuid4().hex[:8].upper()}"
        company = Company(id=company_id, name=company_name, domain=domain)
        db.add(company)

        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
        user = User(
            id=user_id,
            email=email,
            password_hash=password_hash,
            name=name,
            role="admin",
            company_id=company_id,
        )
        db.add(user)
        db.commit()

        db.refresh(user)
        token = generate_token(user)
        return jsonify({
            "success": True,
            "token": token,
            "user": user.to_dict(),
        }), 201

    except Exception as e:
        db.rollback()
        traceback.print_exc()
        return jsonify({"error": "Registration failed"}), 500
    finally:
        db.close()


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    db = get_db()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return jsonify({"error": "Invalid email or password"}), 401

        if not bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8")):
            return jsonify({"error": "Invalid email or password"}), 401

        token = generate_token(user)
        return jsonify({
            "success": True,
            "token": token,
            "user": user.to_dict(),
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Login failed"}), 500
    finally:
        db.close()


@app.route('/api/auth/me', methods=['GET'])
@require_auth
def get_me():
    db = get_db()
    try:
        user = db.query(User).filter(User.id == g.user_id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"user": user.to_dict()})
    finally:
        db.close()


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
@require_auth
@require_admin
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
        stops_data = []
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

        company_id = g.company_id
        db = get_db()
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
        except Exception as e:
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

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Failed to process upload"}), 500
    finally:
        try:
            os.remove(filepath)
        except OSError:
            pass


@app.route('/api/test-data', methods=['POST'])
@require_auth
@require_admin
def load_test_data():
    test_stops = [
        {"id": "test01", "order_id": "ORD-001", "customer_name": "Sipho Ndlovu", "address": "Vilakazi Street, Orlando West, Soweto", "lat": -26.2382, "lng": 27.9082, "demand": 2, "service_time": 15, "phone": "+27 72 100 0001", "notes": "Ring bell twice", "time_window_start": "", "time_window_end": ""},
        {"id": "test02", "order_id": "ORD-002", "customer_name": "Thandi Mokoena", "address": "Chris Hani Rd, Meadowlands, Soweto", "lat": -26.2630, "lng": 27.8930, "demand": 1, "service_time": 10, "phone": "+27 72 100 0002", "notes": "Leave at gate", "time_window_start": "", "time_window_end": ""},
        {"id": "test03", "order_id": "ORD-003", "customer_name": "James van der Merwe", "address": "Kotze Street, Hillbrow, Johannesburg", "lat": -26.1920, "lng": 28.0490, "demand": 3, "service_time": 20, "phone": "+27 72 100 0003", "notes": "", "time_window_start": "", "time_window_end": ""},
        {"id": "test04", "order_id": "ORD-004", "customer_name": "Lerato Dlamini", "address": "Ponte City, Hillbrow, Johannesburg", "lat": -26.1983, "lng": 28.0530, "demand": 1, "service_time": 10, "phone": "+27 72 100 0004", "notes": "Call on arrival", "time_window_start": "", "time_window_end": ""},
        {"id": "test05", "order_id": "ORD-005", "customer_name": "Pieter Botha", "address": "Sandton City Mall, Sandton", "lat": -26.1076, "lng": 28.0567, "demand": 2, "service_time": 15, "phone": "+27 72 100 0005", "notes": "Deliver to concierge", "time_window_start": "", "time_window_end": ""},
        {"id": "test06", "order_id": "ORD-006", "customer_name": "Naledi Khumalo", "address": "London Rd, Alexandra, Johannesburg", "lat": -26.1063, "lng": 28.0890, "demand": 1, "service_time": 10, "phone": "+27 72 100 0006", "notes": "", "time_window_start": "", "time_window_end": ""},
        {"id": "test07", "order_id": "ORD-007", "customer_name": "David Naidoo", "address": "Rivonia Blvd, Rivonia, Sandton", "lat": -26.0570, "lng": 28.0610, "demand": 4, "service_time": 25, "phone": "+27 72 100 0007", "notes": "Heavy items", "time_window_start": "", "time_window_end": ""},
        {"id": "test08", "order_id": "ORD-008", "customer_name": "Ayanda Zulu", "address": "Maboneng Precinct, Jeppestown", "lat": -26.2023, "lng": 28.0570, "demand": 1, "service_time": 10, "phone": "+27 72 100 0008", "notes": "", "time_window_start": "", "time_window_end": ""},
        {"id": "test09", "order_id": "ORD-009", "customer_name": "Fatima Patel", "address": "Fordsburg Square, Fordsburg", "lat": -26.2050, "lng": 28.0260, "demand": 2, "service_time": 15, "phone": "+27 72 100 0009", "notes": "Fragile", "time_window_start": "", "time_window_end": ""},
        {"id": "test10", "order_id": "ORD-010", "customer_name": "Bongani Sithole", "address": "Diepkloof Square, Diepkloof, Soweto", "lat": -26.2530, "lng": 27.9580, "demand": 1, "service_time": 10, "phone": "+27 72 100 0010", "notes": "", "time_window_start": "", "time_window_end": ""},
        {"id": "test11", "order_id": "ORD-011", "customer_name": "Lindiwe Mthembu", "address": "Maponya Mall, Klipspruit, Soweto", "lat": -26.2680, "lng": 27.8970, "demand": 2, "service_time": 15, "phone": "+27 72 100 0011", "notes": "Second floor", "time_window_start": "", "time_window_end": ""},
        {"id": "test12", "order_id": "ORD-012", "customer_name": "Willem Pretorius", "address": "Rosebank Mall, Rosebank", "lat": -26.1460, "lng": 28.0436, "demand": 3, "service_time": 20, "phone": "+27 72 100 0012", "notes": "", "time_window_start": "", "time_window_end": ""},
        {"id": "test13", "order_id": "ORD-013", "customer_name": "Zanele Mahlangu", "address": "Newtown Junction, Newtown", "lat": -26.2010, "lng": 28.0340, "demand": 1, "service_time": 10, "phone": "+27 72 100 0013", "notes": "", "time_window_start": "", "time_window_end": ""},
        {"id": "test14", "order_id": "ORD-014", "customer_name": "Raj Govender", "address": "Bedfordview Centre, Bedfordview", "lat": -26.1816, "lng": 28.1282, "demand": 2, "service_time": 15, "phone": "+27 72 100 0014", "notes": "Gate code: 1234", "time_window_start": "", "time_window_end": ""},
        {"id": "test15", "order_id": "ORD-015", "customer_name": "Nosipho Cele", "address": "Melville 7th Street, Melville", "lat": -26.1768, "lng": 28.0067, "demand": 1, "service_time": 10, "phone": "+27 72 100 0015", "notes": "", "time_window_start": "", "time_window_end": ""},
        {"id": "test16", "order_id": "ORD-016", "customer_name": "Thabiso Maseko", "address": "Dobsonville Mall, Dobsonville, Soweto", "lat": -26.2190, "lng": 27.8650, "demand": 2, "service_time": 15, "phone": "+27 72 100 0016", "notes": "", "time_window_start": "", "time_window_end": ""},
        {"id": "test17", "order_id": "ORD-017", "customer_name": "Precious Mabaso", "address": "Fourways Mall, Fourways", "lat": -26.0187, "lng": 28.0073, "demand": 1, "service_time": 10, "phone": "+27 72 100 0017", "notes": "", "time_window_start": "", "time_window_end": ""},
        {"id": "test18", "order_id": "ORD-018", "customer_name": "Mohammed Ismail", "address": "Mayfair Centre, Mayfair", "lat": -26.2050, "lng": 28.0090, "demand": 3, "service_time": 20, "phone": "+27 72 100 0018", "notes": "Behind the mosque", "time_window_start": "", "time_window_end": ""},
        {"id": "test19", "order_id": "ORD-019", "customer_name": "Kagiso Molefe", "address": "Eldorado Park Shopping Centre, Eldorado Park", "lat": -26.2960, "lng": 27.9050, "demand": 1, "service_time": 10, "phone": "+27 72 100 0019", "notes": "", "time_window_start": "", "time_window_end": ""},
        {"id": "test20", "order_id": "ORD-020", "customer_name": "Anele Zungu", "address": "Braamfontein, Juta Street", "lat": -26.1920, "lng": 28.0340, "demand": 2, "service_time": 15, "phone": "+27 72 100 0020", "notes": "", "time_window_start": "", "time_window_end": ""},
    ]

    company_id = g.company_id
    unique_prefix = uuid.uuid4().hex[:4]

    db = get_db()
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
    except Exception as e:
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


@app.route('/api/optimize', methods=['POST'])
@require_auth
@require_admin
def optimize():
    data = request.get_json() or {}
    cluster_radius = float(data.get("cluster_radius", 8))
    company_id = g.company_id

    db = get_db()
    try:
        old_jobs = db.query(Job).filter(Job.company_id == company_id).all()
        for oj in old_jobs:
            for s in oj.stops:
                s.job_id = None
                s.stop_number = 0
            db.delete(oj)
        db.flush()

        unassigned_stops = db.query(Stop).filter(Stop.company_id == company_id).all()
        stops_data = [s.to_dict() for s in unassigned_stops]

        incoming_stops = data.get("stops")
        if incoming_stops and len(incoming_stops) >= 2:
            stops_data = incoming_stops

        if not stops_data or len(stops_data) < 2:
            db.rollback()
            return jsonify({"error": "Need at least 2 stops to optimize"}), 400

        clusters = cluster_stops(stops_data, radius_km=cluster_radius)

        jobs_created = []
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

            area_name = _determine_area_name(center_lat, center_lng, ordered_stops)
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

        db.commit()

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

        db.commit()

        jobs_created.sort(key=lambda j: j.total_stops, reverse=True)
        jobs_out = [j.to_dict() for j in jobs_created]

        return jsonify({
            "success": True,
            "total_stops": len(stops_data),
            "total_jobs": len(jobs_out),
            "jobs": jobs_out,
        })

    except Exception as e:
        db.rollback()
        traceback.print_exc()
        return jsonify({"error": "Route optimization failed"}), 500
    finally:
        db.close()


def _determine_area_name(lat, lng, stops):
    areas = [
        (-26.2041, 28.0473, "Johannesburg CBD"),
        (-26.1076, 28.0567, "Sandton"),
        (-26.1460, 28.0436, "Rosebank"),
        (-26.1460, 27.9670, "Northcliff"),
        (-26.1260, 27.9890, "Randburg"),
        (-26.0650, 28.0240, "Bryanston"),
        (-26.1700, 28.0630, "Orange Grove"),
        (-26.1470, 28.0660, "Melrose"),
        (-26.2300, 28.0430, "Rosettenville"),
        (-26.1780, 27.9160, "Florida"),
        (-26.1870, 28.0430, "Braamfontein"),
        (-26.1930, 28.0150, "Auckland Park"),
        (-26.1330, 28.1010, "Edenvale"),
        (-26.0880, 28.1490, "Kempton Park"),
        (-26.1880, 28.0320, "Newtown"),
        (-26.2600, 28.0750, "Alberton"),
        (-26.0187, 28.0073, "Fourways"),
        (-26.1520, 27.9040, "Roodepoort"),
        (-26.2485, 27.9100, "Soweto"),
        (-26.1983, 28.0486, "Hillbrow"),
        (-26.1063, 28.0890, "Alexandra"),
        (-26.1768, 28.0067, "Melville"),
        (-26.1170, 28.0340, "Hyde Park"),
        (-26.0850, 28.0100, "Lonehill"),
        (-26.1370, 28.0220, "Parkhurst"),
        (-26.1595, 28.0295, "Parktown North"),
        (-26.1540, 28.0705, "Norwood"),
        (-26.2023, 28.0570, "Maboneng"),
        (-26.2050, 28.0260, "Fordsburg"),
        (-26.1816, 28.1282, "Bedfordview"),
        (-26.2260, 27.9730, "Lenasia"),
        (-26.1330, 28.1530, "Boksburg"),
        (-26.1740, 28.1050, "Kensington"),
        (-26.1950, 28.0730, "Jeppestown"),
        (-26.2120, 28.0090, "Mayfair"),
        (-26.2200, 28.0400, "Turffontein"),
        (-26.1650, 28.0490, "Killarney"),
        (-26.1350, 28.0600, "Wynberg"),
        (-26.0950, 28.0400, "Rivonia"),
        (-26.0770, 28.0560, "Woodmead"),
        (-26.1100, 28.0130, "Craighall"),
        (-26.1890, 28.0870, "Observatory"),
        (-26.2400, 27.9300, "Eldorado Park"),
        (-26.1020, 28.1070, "Marlboro"),
        (-26.0570, 28.0600, "Midrand"),
        (-26.2090, 28.0350, "City Deep"),
        (-26.1690, 28.0200, "Westcliff"),
        (-26.1420, 28.0130, "Greenside"),
        (-26.2710, 28.1240, "Germiston"),
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
@require_auth
@require_admin
def get_jobs():
    db = get_db()
    try:
        jobs = db.query(Job).filter(Job.company_id == g.company_id).all()
        return jsonify({"jobs": [j.to_dict() for j in jobs]})
    finally:
        db.close()


@app.route('/api/jobs/<job_id>/assign', methods=['POST'])
@require_auth
@require_admin
def assign_driver(job_id):
    data = request.get_json() or {}
    driver_id = data.get("driver_id")

    if not driver_id:
        return jsonify({"error": "driver_id is required"}), 400

    db = get_db()
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
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        return jsonify({"error": "Failed to assign driver"}), 500
    finally:
        db.close()


@app.route('/api/jobs/<job_id>/unassign', methods=['POST'])
@require_auth
@require_admin
def unassign_driver(job_id):
    db = get_db()
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
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        return jsonify({"error": "Failed to unassign driver"}), 500
    finally:
        db.close()


@app.route('/api/drivers', methods=['GET'])
@require_auth
@require_admin
def get_drivers():
    db = get_db()
    try:
        drivers = db.query(Driver).filter(Driver.company_id == g.company_id).all()
        return jsonify({"drivers": [d.to_dict() for d in drivers]})
    finally:
        db.close()


@app.route('/api/drivers', methods=['POST'])
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

    db = get_db()
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
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        return jsonify({"error": "Failed to add driver"}), 500
    finally:
        db.close()


@app.route('/api/drivers/<driver_id>', methods=['DELETE'])
@require_auth
@require_admin
def remove_driver(driver_id):
    db = get_db()
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
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        return jsonify({"error": "Failed to remove driver"}), 500
    finally:
        db.close()


@app.route('/api/my-jobs', methods=['GET'])
@require_auth
def get_my_jobs():
    db = get_db()
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


@app.route('/api/my-jobs/<job_id>/complete/<stop_id>', methods=['POST'])
@require_auth
def complete_my_stop(job_id, stop_id):
    db = get_db()
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
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        return jsonify({"error": "Failed to complete stop"}), 500
    finally:
        db.close()


@app.route('/api/driver/<driver_id>/jobs', methods=['GET'])
@require_auth
def get_driver_jobs(driver_id):
    db = get_db()
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


@app.route('/api/driver/<driver_id>/complete/<job_id>/<stop_id>', methods=['POST'])
@require_auth
def complete_stop(driver_id, job_id, stop_id):
    db = get_db()
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
    except Exception as e:
        db.rollback()
        return jsonify({"error": "Failed to complete stop"}), 500
    finally:
        db.close()


@app.route('/api/stops', methods=['GET'])
@require_auth
@require_admin
def get_stops():
    db = get_db()
    try:
        stops = db.query(Stop).filter(Stop.company_id == g.company_id).all()
        return jsonify({"stops": [s.to_dict() for s in stops]})
    finally:
        db.close()


@app.route('/api/stats', methods=['GET'])
@require_auth
@require_admin
def get_stats():
    db = get_db()
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


@app.route('/api/route', methods=['POST'])
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
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": "Failed to fetch route"}), 500


if __name__ == '__main__':
    print("Aviate Dispatch API starting on port 8000")
    app.run(debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true", host='0.0.0.0', port=8000)
