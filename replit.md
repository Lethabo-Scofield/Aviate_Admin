# Aviate Dispatch System — Logistics SaaS MVP

## Overview
A real logistics dispatch system where admins upload an Excel file of delivery addresses, the backend geocodes them (Nominatim), clusters stops into geographic jobs, optimizes routes using OR-Tools, and assigns drivers. Drivers receive their jobs via a REST API.

## Tech Stack
- **Frontend**: React 19 + Vite, Tailwind CSS 4, React Router, Lucide icons
- **Backend**: Python Flask, Google OR-Tools (route optimization), GeoPy (geocoding via Nominatim), Pandas
- **Data**: In-memory store (no database) — resets on restart

## Design System (Apple-Inspired)
- Background: `#f5f5f7` (Apple light grey)
- Cards: white with subtle shadows (`apple-card` class)
- Text primary: `#1d1d1f`, secondary: `#86868b`, tertiary: `#aeaeb2`
- Accent blue: `#007aff`, green: `#34c759`, orange: `#ff9500`, red: `#ff3b30`
- Active nav/buttons: `#1d1d1f` (near-black)
- Frosted glass sidebar with backdrop blur
- Skeleton loaders, fade-in/slide-up animations
- Typography: SF Pro / system font stack, tight tracking
- Inputs: `apple-input` class with blue focus rings
- Buttons: `apple-btn apple-btn-primary` / `apple-btn-secondary`

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
│   │   ├── Sidebar.jsx        # Navigation sidebar (4 pages)
│   │   └── Loader.jsx         # Spinner, skeleton loaders
│   └── pages/
│       ├── Dashboard.jsx      # Overview stats + onboarding (empty state → stats view)
│       ├── DispatchCenter.jsx # 3-step wizard: Upload → Optimize → Results
│       ├── Jobs.jsx           # Jobs list with inline driver assignment
│       ├── Drivers.jsx        # Fleet management — add/remove drivers
│       └── NotFound.jsx       # 404 page
```

## API Endpoints
- `POST /api/upload` — Upload Excel with delivery addresses, geocodes via Nominatim
- `POST /api/optimize` — Cluster stops geographically, optimize route per cluster via OR-Tools
- `GET /api/jobs` — List all jobs
- `POST /api/jobs/:id/assign` — Assign driver to job (sends driver_id, backend derives name)
- `POST /api/jobs/:id/unassign` — Unassign driver from job
- `GET /api/drivers` — List all drivers
- `POST /api/drivers` — Add a new driver
- `DELETE /api/drivers/:id` — Remove a driver
- `GET /api/driver/:id/jobs` — Driver mobile API: get assigned jobs
- `POST /api/driver/:id/complete/:job_id/:stop_id` — Driver marks stop complete
- `GET /api/stats` — Dashboard statistics
- `GET /api/stops` — List all geocoded stops

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
- react-router-dom, lucide-react, papaparse, xlsx

### Backend (pip)
- flask, flask-cors, pandas, openpyxl, geopy, ortools
