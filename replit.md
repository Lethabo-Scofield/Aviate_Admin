# Aviate Dispatch System — Logistics SaaS Dashboard

## Overview
A production-style logistics SaaS dashboard with AI-powered route optimization and full decision transparency. Built as a modular, explainable dispatch system (not just a delivery tracker).

## Tech Stack
- **Frontend**: React 19 + Vite, Tailwind CSS 4, React Router, Recharts, Leaflet (maps), Lucide icons
- **Backend**: Python Flask, Google OR-Tools (route optimization), GeoPy (geocoding), Pandas
- **External APIs**: OpenRouteService (road routing), Nominatim/OpenStreetMap (geocoding)

## Design System
- Primary: `#008080` (teal)
- Secondary: navy blue accents (`#0a1628`, `#1e3a5f`)
- Background: pure white `#FFFFFF`
- Style: clean SaaS dashboard (Stripe/Uber Freight inspired)

## Project Structure
```
├── backend/                    # Python Flask API (port 8000)
│   ├── app.py
│   ├── optimize_route.py
│   └── requirements.txt
├── src/
│   ├── App.jsx                 # Root with BrowserRouter + WeightsProvider
│   ├── main.jsx
│   ├── index.css               # Tailwind + global styles
│   ├── context/
│   │   └── WeightsContext.jsx   # Shared scoring weights state
│   ├── services/
│   │   └── scoringEngine.js    # 4-layer optimization engine
│   ├── data/
│   │   └── mockData.js         # Drivers, jobs, routes, analytics data
│   ├── components/
│   │   ├── Layout.jsx          # Sidebar + Outlet wrapper
│   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   ├── StatCard.jsx        # Metric display card
│   │   ├── EfficiencyBar.jsx   # Visual efficiency progress bar
│   │   ├── RouteBreakdownCard.jsx  # Route metrics card
│   │   └── ExplainabilityPanel.jsx # AI decision transparency panel
│   └── pages/
│       ├── Dashboard.jsx       # Overview metrics
│       ├── DispatchCenter.jsx  # Job creation + auto-assign
│       ├── LiveMap.jsx         # Real-time driver/route map
│       ├── Jobs.jsx            # All deliveries table
│       ├── Drivers.jsx         # Fleet management cards
│       ├── Routes.jsx          # Optimization results + explainability
│       ├── Analytics.jsx       # Charts + performance metrics
│       ├── Settings.jsx        # Scoring weights + config
│       └── NotFound.jsx        # 404 page
```

## Optimization Engine (4 Layers)
1. **Candidate Filtering**: distance, vehicle type, availability, capacity, time window feasibility
2. **Scoring Engine**: weighted formula with priority multiplier — `score = (dist×w1 + route_time×w2 + idle×w3 + lateness×w4) × priority_multiplier`
3. **Route Sequencing**: metric calculation (distance, time, cost, efficiency)
4. **Real-time Adjustment**: structure for detecting changes (traffic, cancellations)

Weights are configurable via Settings page and shared through React Context.

## Ports
- **Frontend (Vite)**: port 5000 (webview)
- **Backend (Flask)**: port 8000 (console), proxied via Vite `/api`

## Workflows
- **Start application**: `npm run dev` — React/Vite frontend (port 5000)
- **Backend API**: `cd backend && python app.py` — Flask API (port 8000)

## Key Dependencies
- react-router-dom (routing)
- recharts (analytics charts)
- leaflet / react-leaflet (maps)
- lucide-react (icons)
- papaparse / xlsx (file parsing)
