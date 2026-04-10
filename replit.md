# Logistics & Route Optimization MVP

## Overview
A logistics and route optimization application for delivery management. It has an Admin Dashboard for uploading delivery stops (CSV/Excel) and a Driver App for viewing optimized routes on a map.

## Tech Stack
- **Frontend**: React 19 + Vite, Tailwind CSS 4, Leaflet (maps), PapaParse (CSV), SheetJS/XLSX (Excel)
- **Backend**: Python Flask, Google OR-Tools (route optimization), GeoPy (geocoding), Pandas
- **External APIs**: OpenRouteService (road routing), Nominatim/OpenStreetMap (geocoding)

## Project Structure
```
├── backend/           # Python Flask API
│   ├── app.py         # Flask entry point, routes (port 8000)
│   ├── optimize_route.py  # OR-Tools VRP optimization
│   ├── requirements.txt   # Python dependencies
│   └── dummy_orders.xlsx  # Sample data
├── src/               # React frontend
│   ├── App.jsx        # Root component (Admin/Driver toggle)
│   ├── AdminMVP.jsx   # Admin dashboard, file upload, geocoding
│   └── DriverApp.jsx  # Driver map view, route tracking
├── vite.config.js     # Vite config (port 5000, proxy to backend)
└── package.json       # Node dependencies
```

## Ports
- **Frontend (Vite)**: port 5000 (webview)
- **Backend (Flask)**: port 8000 (console), proxied via Vite `/api` route

## Workflows
- **Start application**: `npm run dev` — starts the React/Vite frontend on port 5000
- **Backend API**: `cd backend && python app.py` — starts Flask API on port 8000

## Environment Variables
- `API` — OpenRouteService API key (used in DriverApp.jsx for road routing)

## Key Features
- Admin: upload CSV/Excel with delivery addresses, geocodes them via Nominatim
- Admin: previews route on Leaflet map before sending to driver
- Driver: views optimized delivery order with road-network routing via OpenRouteService
- Driver: marks stops as complete, sees distances between stops
