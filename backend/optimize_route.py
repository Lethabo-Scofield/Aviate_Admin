import pandas as pd
from geopy.geocoders import Nominatim
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import numpy as np
import time

# Hardcoded depot location (Main Warehouse)
DEPOT = {"name": "Main Warehouse", "lat": -26.1234, "lng": 28.0456}

# Geocode addresses using Nominatim (OpenStreetMap)
def geocode_address(address, geolocator):
    try:
        # Try full address
        location = geolocator.geocode(address + ", South Africa")
        if location:
            return location.latitude, location.longitude
        # Try without postal code
        address_parts = address.split(',')
        if len(address_parts) > 2:
            simple_address = ','.join(address_parts[:-1]) + ", South Africa"
            location = geolocator.geocode(simple_address)
            if location:
                return location.latitude, location.longitude
        # Try suburb and city only
        if len(address_parts) > 2:
            suburb_city = ','.join(address_parts[-3:]) + ", South Africa"
            location = geolocator.geocode(suburb_city)
            if location:
                return location.latitude, location.longitude
    except Exception:
        pass
    # Fallback: return depot coordinates with warning
    print(f"Warning: Could not geocode address: {address}, using depot coordinates as fallback.")
    return DEPOT["lat"], DEPOT["lng"]

def build_distance_matrix(locations):
    # Use Haversine formula for demo (replace with real API for production)
    def haversine(lat1, lon1, lat2, lon2):
        from math import radians, sin, cos, sqrt, atan2
        R = 6371  # km
        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)
        a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        return R * c
    n = len(locations)
    matrix = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            if i == j:
                matrix[i][j] = 0
            else:
                matrix[i][j] = haversine(locations[i][0], locations[i][1], locations[j][0], locations[j][1])
    return matrix

def optimize_route(excel_path, num_vehicles=4, vehicle_capacity=200):
    df = pd.read_excel(excel_path)
    print("DEBUG: Number of orders loaded:", len(df))
    print("DEBUG: DataFrame columns:", df.columns.tolist())
    print("DEBUG: First few rows:\n", df.head())
    geolocator = Nominatim(user_agent="logistics-opt")
    # Geocode all addresses
    locations = [(DEPOT["lat"], DEPOT["lng"])]
    for addr in df["Full_Address"]:
        lat, lng = geocode_address(addr, geolocator)
        print(f"DEBUG: Geocoded {addr} -> ({lat}, {lng})")
        time.sleep(1)  # Be nice to Nominatim
        locations.append((lat, lng))
    demands = [0] + df["Demand"].tolist()
    service_times = [0] + df["Service_Time"].tolist()
    time_windows = [(0, 1440)]  # depot open all day
    for start, end in zip(df["Time_Window_Start"], df["Time_Window_End"]):
        if pd.isna(start) or pd.isna(end):
            time_windows.append((0, 1440))
        else:
            s = int(start.split(":")[0]) * 60 + int(start.split(":")[1])
            e = int(end.split(":")[0]) * 60 + int(end.split(":")[1])
            time_windows.append((s, e))
    print("DEBUG: demands:", demands)
    print("DEBUG: time_windows:", time_windows)
    print("DEBUG: locations:", locations)
    distance_matrix = build_distance_matrix(locations)
    # OR-Tools VRP
    manager = pywrapcp.RoutingIndexManager(len(distance_matrix), num_vehicles, 0)
    routing = pywrapcp.RoutingModel(manager)
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return int(distance_matrix[from_node][to_node] * 1000)  # meters
    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    # Add capacity constraint
    def demand_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return demands[from_node]
    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index, 0, [vehicle_capacity]*num_vehicles, True, 'Capacity')
    # Add time window constraint
    def service_time_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return service_times[from_node]
    service_callback_index = routing.RegisterUnaryTransitCallback(service_time_callback)
    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        travel_time = distance_matrix[from_node][to_node] / 40 * 60  # assume 40km/h
        return int(travel_time + service_times[from_node])
    time_callback_index = routing.RegisterTransitCallback(time_callback)
    routing.AddDimension(
        time_callback_index,
        30,  # allow waiting time
        1440,  # max time per vehicle (24h)
        False,
        'Time')
    time_dimension = routing.GetDimensionOrDie('Time')
    for idx, (open_t, close_t) in enumerate(time_windows):
        index = manager.NodeToIndex(idx)
        time_dimension.CumulVar(index).SetRange(open_t, close_t)
    # Solve
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.time_limit.seconds = 30
    solution = routing.SolveWithParameters(search_parameters)
    if not solution:
        raise Exception("No solution found")
    # Build output
    routes = []
    for vehicle_id in range(num_vehicles):
        index = routing.Start(vehicle_id)
        route = []
        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            route.append(node)
            index = solution.Value(routing.NextVar(index))
        routes.append(route)
    # Collect all stops from all vehicles (skip depot node 0)
    stop_list = []
    for vehicle_id, route in enumerate(routes):
        for i, node in enumerate(route[1:]):  # skip depot at index 0
            row = df.iloc[node-1]
            stop_list.append({
                "stop_number": int(i+1),
                "order_id": str(row["Order_ID"]),
                "customer_name": str(row["Customer_Name"]),
                "full_address": str(row["Full_Address"]),
                "demand": int(row["Demand"]),
                "time_window_start": str(row["Time_Window_Start"]) if not pd.isna(row["Time_Window_Start"]) else "",
                "time_window_end": str(row["Time_Window_End"]) if not pd.isna(row["Time_Window_End"]) else "",
                "service_time": int(row["Service_Time"]),
                "phone": str(row["Phone"]),
                "notes": "" if pd.isna(row["Notes"]) else str(row["Notes"]),
                "lat": float(locations[node][0]),
                "lng": float(locations[node][1]),
            })
    print("DEBUG: routes:", routes)
    print("DEBUG: stop_list:", stop_list)
    return {
        "route_id": "ROUTE-20260404-001",
        "driver_name": "Mr. Ngubane",
        "date": "2026-04-04",
        "total_stops": len(stop_list),
        "total_distance_km": float(np.sum([distance_matrix[routes[0][i]][routes[0][i+1]] for i in range(len(routes[0])-1)])),
        "estimated_duration_minutes": int(np.sum([distance_matrix[routes[0][i]][routes[0][i+1]]/40*60 for i in range(len(routes[0])-1)])),
        "depot_start": DEPOT,
        "stops": stop_list
    }
