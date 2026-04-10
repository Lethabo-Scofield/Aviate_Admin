# Aviate Dispatch System — Logistics SaaS MVP

## Overview
A real logistics dispatch system where admins upload an Excel file of delivery addresses, the backend geocodes them (Nominatim), clusters stops into geographic jobs, optimizes routes using OR-Tools, and assigns drivers. Drivers receive their jobs via a REST API.

## Tech Stack
- **Frontend**: React 19 + Vite, Tailwind CSS 4, React Router, Recharts, Leaflet (maps), Lucide icons
- **Backend**: Python Flask, Google OR-Tools (route optimization), GeoPy (geocoding via Nominatim), Pandas
- **Data**: In-memory store (no database) — resets on restart

## Design System
- Primary: `#008080` (teal)
- Secondary: navy blue accents (`#0a1628`, `#1e3a5f`)
- Background: pure white `#FFFFFF`
- Style: clean SaaS dashboard (Stripe/Uber Freight inspired)

## Project Structure
```
├── backend/
│   ├── app.py                 # Flask API (port 8000) — upload, geocode, cluster, optimize, assign
│   ├── optimize_route.py      # OR-Tools route optimizer
│   └── requirements.txt
├── src/
│   ├── App.jsx                # Root with BrowserRouter
│   ├── main.jsx
│   ├── index.css              # Tailwind + global styles
│   ├── services/
│   │   └── api.js             # API client — all backend calls
│   ├── components/
│   │   ├── Layout.jsx         # Sidebar + Outlet wrapper
│   │   ├── Sidebar.jsx        # Navigation sidebar (8 pages)
│   │   ├── StatCard.jsx       # Metric display card
│   │   └── EfficiencyBar.jsx  # Visual efficiency progress bar
│   └── pages/
│       ├── Dashboard.jsx      # Overview metrics + welcome state
│       ├── DispatchCenter.jsx # Excel upload → geocode → optimize → jobs (3-step wizard)
│       ├── LiveMap.jsx        # Map with job stops and routes
│       ├── Jobs.jsx           # Jobs table with assign-driver modal
│       ├── Drivers.jsx        # Fleet management — add/list drivers
│       ├── Routes.jsx         # Optimized route details
│       ├── Analytics.jsx      # Charts + performance metrics
│       ├── Settings.jsx       # Cluster radius, driver count, API docs
│       └── NotFound.jsx       # 404 page
```

## API Endpoints
- `POST /api/upload` — Upload Excel with delivery addresses, geocodes via Nominatim
- `POST /api/optimize` — Cluster stops geographically, optimize route per cluster via OR-Tools
- `GET /api/jobs` — List all jobs
- `POST /api/jobs/:id/assign` — Assign driver to job
- `GET /api/drivers` — List all drivers
- `POST /api/drivers` — Add a new driver
- `GET /api/driver/:id/jobs` — Driver mobile API: get assigned jobs
- `POST /api/driver/:id/complete/:job_id/:stop_id` — Driver marks stop complete
- `GET /api/stats` — Dashboard statistics

## Excel Format
- **Required column**: `Full_Address` (or `address`)
- **Optional columns**: Order_ID, Customer_Name, Demand, Time_Window_Start, Time_Window_End, Service_Time, Phone, Notes

## Core Flow
1. Admin uploads Excel file → backend geocodes each address via Nominatim (1.1s delay per address)
2. Admin clicks Optimize → backend clusters stops by geographic radius (default 8km), runs OR-Tools per cluster
3. Jobs are created from clusters with optimized stop order
4. Admin assigns drivers to jobs
5. Drivers fetch their jobs via REST API and mark stops complete

## Ports
- **Frontend (Vite)**: port 5000 (webview)
- **Backend (Flask)**: port 8000 (console), proxied via Vite `/api`

## Workflows
- **Start application**: `npm run dev` — React/Vite frontend (port 5000)
- **Backend API**: `cd backend && python app.py` — Flask API (port 8000)

## Key Dependencies
### Frontend (npm)
- react-router-dom, recharts, leaflet, react-leaflet, lucide-react, papaparse, xlsx

### Backend (pip)
- flask, flask-cors, pandas, openpyxl, geopy, ortools
