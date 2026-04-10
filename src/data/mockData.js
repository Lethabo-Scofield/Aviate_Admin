const drivers = [
  { id: "D001", name: "Thabo Mokoena", vehicle_type: "van", status: "available", lat: -26.195, lng: 28.035, capacity: 1000, current_load: 200, phone: "+27 82 111 2233", rating: 4.8, completedToday: 5 },
  { id: "D002", name: "Sipho Ndlovu", vehicle_type: "truck", status: "available", lat: -26.210, lng: 28.050, capacity: 5000, current_load: 1200, phone: "+27 83 222 3344", rating: 4.6, completedToday: 3 },
  { id: "D003", name: "Lerato Dlamini", vehicle_type: "van", status: "en_route", lat: -26.180, lng: 28.020, capacity: 1000, current_load: 600, phone: "+27 84 333 4455", rating: 4.9, completedToday: 7 },
  { id: "D004", name: "Andile Zulu", vehicle_type: "bike", status: "available", lat: -26.225, lng: 28.065, capacity: 50, current_load: 0, phone: "+27 85 444 5566", rating: 4.3, completedToday: 12 },
  { id: "D005", name: "Naledi Khumalo", vehicle_type: "truck", status: "available", lat: -26.200, lng: 28.080, capacity: 5000, current_load: 800, phone: "+27 86 555 6677", rating: 4.7, completedToday: 4 },
  { id: "D006", name: "Mandla Sithole", vehicle_type: "van", status: "offline", lat: -26.170, lng: 28.010, capacity: 1000, current_load: 0, phone: "+27 87 666 7788", rating: 4.5, completedToday: 0 },
  { id: "D007", name: "Zanele Mthembu", vehicle_type: "van", status: "available", lat: -26.215, lng: 28.045, capacity: 1000, current_load: 350, phone: "+27 88 777 8899", rating: 4.4, completedToday: 6 },
  { id: "D008", name: "Bongani Nkosi", vehicle_type: "truck", status: "en_route", lat: -26.190, lng: 28.070, capacity: 5000, current_load: 3500, phone: "+27 89 888 9900", rating: 4.2, completedToday: 2 },
];

const jobs = [
  { id: "J001", pickup: "12 Commissioner St, Johannesburg", pickup_lat: -26.205, pickup_lng: 28.045, dropoff: "45 Rivonia Rd, Sandton", dropoff_lat: -26.107, dropoff_lng: 28.057, vehicle_type: "van", weight: 120, status: "assigned", driver_id: "D001", time_window: "08:00-10:00", priority: "high", created: "2026-04-10T06:30:00" },
  { id: "J002", pickup: "88 Oxford Rd, Rosebank", pickup_lat: -26.146, pickup_lng: 28.044, dropoff: "23 Beyers Naude Dr, Northcliff", dropoff_lat: -26.146, dropoff_lng: 27.967, vehicle_type: "truck", weight: 2500, status: "assigned", driver_id: "D002", time_window: "09:00-12:00", priority: "medium", created: "2026-04-10T07:00:00" },
  { id: "J003", pickup: "5 Mandela Bridge, Braamfontein", pickup_lat: -26.193, pickup_lng: 28.037, dropoff: "100 Fox St, Marshalltown", dropoff_lat: -26.208, dropoff_lng: 28.045, vehicle_type: "van", weight: 80, status: "in_transit", driver_id: "D003", time_window: "07:00-09:00", priority: "high", created: "2026-04-10T05:45:00" },
  { id: "J004", pickup: "32 Jan Smuts Ave, Parktown", pickup_lat: -26.175, pickup_lng: 28.037, dropoff: "17 Malibongwe Dr, Randburg", dropoff_lat: -26.126, dropoff_lng: 27.989, vehicle_type: "bike", weight: 5, status: "pending", driver_id: null, time_window: "10:00-11:00", priority: "low", created: "2026-04-10T08:15:00" },
  { id: "J005", pickup: "60 Eloff St, CBD", pickup_lat: -26.204, pickup_lng: 28.047, dropoff: "15 William Nicol Dr, Bryanston", dropoff_lat: -26.065, dropoff_lng: 28.024, vehicle_type: "van", weight: 300, status: "pending", driver_id: null, time_window: "11:00-14:00", priority: "medium", created: "2026-04-10T08:30:00" },
  { id: "J006", pickup: "22 Bree St, Newtown", pickup_lat: -26.201, pickup_lng: 28.032, dropoff: "8 Grayston Dr, Sandton", dropoff_lat: -26.106, dropoff_lng: 28.061, vehicle_type: "truck", weight: 4000, status: "completed", driver_id: "D005", time_window: "06:00-09:00", priority: "high", created: "2026-04-10T04:00:00" },
  { id: "J007", pickup: "44 Louis Botha Ave, Orange Grove", pickup_lat: -26.170, pickup_lng: 28.063, dropoff: "3 Corlett Dr, Melrose", dropoff_lat: -26.147, dropoff_lng: 28.066, vehicle_type: "van", weight: 150, status: "assigned", driver_id: "D007", time_window: "12:00-14:00", priority: "low", created: "2026-04-10T09:00:00" },
  { id: "J008", pickup: "70 Main Reef Rd, Rosettenville", pickup_lat: -26.230, pickup_lng: 28.043, dropoff: "55 Ontdekkers Rd, Florida", dropoff_lat: -26.178, dropoff_lng: 27.916, vehicle_type: "truck", weight: 3200, status: "pending", driver_id: null, time_window: "13:00-16:00", priority: "medium", created: "2026-04-10T09:30:00" },
];

const routeAssignments = [
  {
    id: "R001",
    driver_id: "D001",
    job_id: "J001",
    score: 12.4,
    score_breakdown: { distance_to_pickup: 2.1, extra_route_time: 3.5, idle_time: 1.8, lateness_risk: 5.0 },
    weights: { w1: 1.0, w2: 2.0, w3: 1.5, w4: 3.0 },
    explanation: {
      selected_reason: "Closest available van driver with lowest overall score. 2.1 km from pickup with minimal idle time.",
      distance_advantage: "2.1 km closer than next candidate",
      route_efficiency_gain: "15% more efficient route than alternative",
      workload_comparison: "5 deliveries today vs avg 6.2 for van drivers",
      rejected_candidates: [
        { driver_id: "D003", name: "Lerato Dlamini", score: 18.7, reason: "Currently en route to another delivery. Would add 12 min delay.", score_diff: 6.3 },
        { driver_id: "D007", name: "Zanele Mthembu", score: 22.1, reason: "Further from pickup (5.8 km). Higher idle driving time.", score_diff: 9.7 },
        { driver_id: "D006", name: "Mandla Sithole", score: null, reason: "Driver is offline. Not available for dispatch.", score_diff: null },
      ],
    },
    metrics: { distance: 18.4, time: 35, idle_time: 4, cost: 245.00, efficiency_score: 87 },
  },
  {
    id: "R002",
    driver_id: "D002",
    job_id: "J002",
    score: 15.8,
    score_breakdown: { distance_to_pickup: 4.2, extra_route_time: 2.8, idle_time: 3.1, lateness_risk: 5.7 },
    weights: { w1: 1.0, w2: 2.0, w3: 1.5, w4: 3.0 },
    explanation: {
      selected_reason: "Best available truck driver. Sufficient capacity for 2500 kg load with low lateness risk.",
      distance_advantage: "3.8 km closer than next truck",
      route_efficiency_gain: "22% fuel savings compared to alternative",
      workload_comparison: "3 deliveries today — well below truck driver avg of 4.5",
      rejected_candidates: [
        { driver_id: "D005", name: "Naledi Khumalo", score: 21.3, reason: "Further from pickup. Current load of 800 kg would leave tight capacity margin.", score_diff: 5.5 },
        { driver_id: "D008", name: "Bongani Nkosi", score: 28.9, reason: "Currently en route. Load at 3500 kg, insufficient remaining capacity.", score_diff: 13.1 },
      ],
    },
    metrics: { distance: 14.2, time: 28, idle_time: 6, cost: 380.00, efficiency_score: 74 },
  },
  {
    id: "R003",
    driver_id: "D003",
    job_id: "J003",
    score: 8.2,
    score_breakdown: { distance_to_pickup: 1.3, extra_route_time: 1.9, idle_time: 0.5, lateness_risk: 4.5 },
    weights: { w1: 1.0, w2: 2.0, w3: 1.5, w4: 3.0 },
    explanation: {
      selected_reason: "Nearest van driver to pickup with excellent route alignment. Minimal detour required.",
      distance_advantage: "0.8 km from pickup — closest of all candidates",
      route_efficiency_gain: "Route aligns with current heading, 28% less idle driving",
      workload_comparison: "7 deliveries today — above average but manageable given short routes",
      rejected_candidates: [
        { driver_id: "D001", name: "Thabo Mokoena", score: 14.1, reason: "Assigned to J001. Adding this job would cause scheduling conflict.", score_diff: 5.9 },
        { driver_id: "D007", name: "Zanele Mthembu", score: 16.5, reason: "3.5 km from pickup. Would add significant idle driving.", score_diff: 8.3 },
      ],
    },
    metrics: { distance: 3.2, time: 12, idle_time: 1, cost: 85.00, efficiency_score: 95 },
  },
  {
    id: "R004",
    driver_id: "D007",
    job_id: "J007",
    score: 14.0,
    score_breakdown: { distance_to_pickup: 3.8, extra_route_time: 2.2, idle_time: 2.5, lateness_risk: 5.5 },
    weights: { w1: 1.0, w2: 2.0, w3: 1.5, w4: 3.0 },
    explanation: {
      selected_reason: "Available van driver with adequate capacity. Reasonable proximity to pickup in Orange Grove.",
      distance_advantage: "1.5 km closer than next available van",
      route_efficiency_gain: "12% route efficiency improvement over alternative",
      workload_comparison: "6 deliveries today — aligned with daily average",
      rejected_candidates: [
        { driver_id: "D001", name: "Thabo Mokoena", score: 18.2, reason: "Already assigned to J001. Time window overlap detected.", score_diff: 4.2 },
        { driver_id: "D003", name: "Lerato Dlamini", score: 19.8, reason: "In transit for J003. Would not arrive before time window starts.", score_diff: 5.8 },
      ],
    },
    metrics: { distance: 5.6, time: 18, idle_time: 3, cost: 125.00, efficiency_score: 81 },
  },
  {
    id: "R005",
    driver_id: "D005",
    job_id: "J006",
    score: 11.0,
    score_breakdown: { distance_to_pickup: 2.8, extra_route_time: 1.5, idle_time: 2.0, lateness_risk: 4.7 },
    weights: { w1: 1.0, w2: 2.0, w3: 1.5, w4: 3.0 },
    explanation: {
      selected_reason: "Optimal truck driver for heavy load. Strong capacity margin and early availability matched time window.",
      distance_advantage: "2.0 km closer than next truck option",
      route_efficiency_gain: "18% cost reduction compared to alternative assignment",
      workload_comparison: "4 deliveries — below average, balanced workload",
      rejected_candidates: [
        { driver_id: "D002", name: "Sipho Ndlovu", score: 17.6, reason: "Higher current load reduces capacity margin. Slightly further from pickup.", score_diff: 6.6 },
        { driver_id: "D008", name: "Bongani Nkosi", score: 25.4, reason: "En route to different zone. Would require significant repositioning.", score_diff: 14.4 },
      ],
    },
    metrics: { distance: 16.8, time: 32, idle_time: 5, cost: 420.00, efficiency_score: 78 },
  },
];

const analyticsData = {
  costPerDelivery: [
    { date: "Mon", cost: 185 }, { date: "Tue", cost: 210 }, { date: "Wed", cost: 195 },
    { date: "Thu", cost: 178 }, { date: "Fri", cost: 225 }, { date: "Sat", cost: 165 }, { date: "Sun", cost: 142 },
  ],
  avgDeliveryTime: [
    { date: "Mon", time: 32 }, { date: "Tue", time: 28 }, { date: "Wed", time: 35 },
    { date: "Thu", time: 25 }, { date: "Fri", time: 38 }, { date: "Sat", time: 22 }, { date: "Sun", time: 20 },
  ],
  driverUtilization: [
    { name: "Thabo M.", rate: 78 }, { name: "Sipho N.", rate: 65 }, { name: "Lerato D.", rate: 92 },
    { name: "Andile Z.", rate: 85 }, { name: "Naledi K.", rate: 70 }, { name: "Mandla S.", rate: 0 },
    { name: "Zanele M.", rate: 75 }, { name: "Bongani N.", rate: 58 },
  ],
  efficiencyTrend: [
    { week: "W1", score: 72 }, { week: "W2", score: 76 }, { week: "W3", score: 74 },
    { week: "W4", score: 80 }, { week: "W5", score: 83 }, { week: "W6", score: 87 },
  ],
  summary: {
    totalDeliveries: 847,
    avgCostPerDelivery: 186,
    avgDeliveryTime: 28.6,
    avgEfficiency: 83,
    activeDrivers: 7,
    fleetUtilization: 74,
  },
};

export { drivers, jobs, routeAssignments, analyticsData };
