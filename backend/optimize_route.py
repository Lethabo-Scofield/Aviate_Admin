import pandas as pd
from geopy.geocoders import Nominatim
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import numpy as np
import time

DEPOT = {"name": "Main Warehouse", "lat": -26.1234, "lng": 28.0456}


def geocode_address(address, geolocator):
    try:
        location = geolocator.geocode(address + ", South Africa")
        if location:
            return location.latitude, location.longitude
        address_parts = address.split(',')
        if len(address_parts) > 2:
            simple_address = ','.join(address_parts[:-1]) + ", South Africa"
            location = geolocator.geocode(simple_address)
            if location:
                return location.latitude, location.longitude
        if len(address_parts) > 2:
            suburb_city = ','.join(address_parts[-3:]) + ", South Africa"
            location = geolocator.geocode(suburb_city)
            if location:
                return location.latitude, location.longitude
    except Exception:
        pass
    return DEPOT["lat"], DEPOT["lng"]


def build_distance_matrix(locations):
    def haversine(lat1, lon1, lat2, lon2):
        from math import radians, sin, cos, sqrt, atan2
        R = 6371
        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)
        a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return R * c

    n = len(locations)
    matrix = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            if i != j:
                matrix[i][j] = haversine(locations[i][0], locations[i][1], locations[j][0], locations[j][1])
    return matrix


def optimize_route_from_data(stops, num_vehicles=1):
    if len(stops) < 2:
        return stops

    locations = [(DEPOT["lat"], DEPOT["lng"])] + [(s["lat"], s["lng"]) for s in stops]
    dist_matrix = build_distance_matrix(locations)

    manager = pywrapcp.RoutingIndexManager(len(locations), num_vehicles, 0)
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

    if not solution:
        return stops

    ordered = []
    index = routing.Start(0)
    while not routing.IsEnd(index):
        node = manager.IndexToNode(index)
        if node > 0:
            ordered.append(stops[node - 1])
        index = solution.Value(routing.NextVar(index))

    return ordered
