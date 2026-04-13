# Aviate - Logistics Dispatch SaaS

## Overview
Aviate is a multi-tenant logistics dispatch platform for managing delivery routes, drivers, and stops. It features route optimization using Google OR-Tools, geocoding via GeoPy, and interactive map visualization.

## Architecture

### Frontend (React + Vite)
- **Deployment target**: Vercel
- **Port**: 5000 (dev)
- **Stack**: React 19, Vite, Tailwind CSS 4, React Router DOM 7, Leaflet/React-Leaflet
- **API config**: `VITE_API_URL` env var (defaults to `/api` for dev proxy)

### Backend (Python Flask)
- **Deployment target**: Render
- **Port**: 8000 (dev)
- **Stack**: Flask, SQLAlchemy, Google OR-Tools, GeoPy, pandas
- **Database**: PostgreSQL (Neon)

## Project Structure

```
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React context providers (AuthContext)
│   ├── pages/              # Route pages (Dashboard, Jobs, Drivers, etc.)
│   └── services/           # API client (api.js)
├── backend/                # Python Flask backend
│   ├── app.py              # Flask app factory, CORS, migrations
│   ├── config.py           # Environment configuration
│   ├── middleware.py        # Auth decorators (require_auth, require_admin)
│   ├── models.py           # SQLAlchemy models (Company, User, Driver, Stop, Job)
│   ├── utils.py             # Shared utilities (token gen, haversine, clustering)
│   ├── optimize_route.py   # OR-Tools route optimization
│   ├── wsgi.py             # Gunicorn entry point
│   ├── Procfile            # Render process config
│   ├── render.yaml         # Render deployment config
│   ├── requirements.txt    # Python dependencies
│   ├── routes/             # API route blueprints
│   │   ├── __init__.py     # Blueprint definitions
│   │   ├── auth.py         # Auth routes (register, login, me)
│   │   ├── jobs.py         # Job management (list, assign, unassign)
│   │   ├── drivers.py      # Driver CRUD + driver-specific endpoints
│   │   ├── stops.py        # Stop listing
│   │   ├── optimization.py # Upload, optimize, test-data, routing
│   │   └── stats.py        # Dashboard statistics
│   └── data/               # Static data files
│       ├── test_stops.json  # Test delivery stops (Johannesburg)
│       └── areas.json       # Area name definitions for zone labeling
├── public/                 # Static frontend assets
├── package.json            # Frontend dependencies
├── vite.config.js          # Vite config with API proxy
├── vercel.json             # Vercel SPA deployment config
└── index.html              # Frontend entry point
```

## Environment Variables

### Backend (Required)
- `NEON_DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `ALLOWED_ORIGINS` - CORS origins (default: "*")

### Frontend (Optional)
- `VITE_API_URL` - Backend API base URL (for production, e.g. `https://your-api.onrender.com/api`)

## Development (Replit)
- **Start application** workflow runs `npm run dev` (Vite on port 5000)
- **Backend API** workflow runs `cd backend && python app.py` (Flask on port 8000)
- Vite proxies `/api` requests to the Flask backend

## Deployment

### Frontend → Vercel
1. Connect repo to Vercel
2. Set `VITE_API_URL` to your Render backend URL + `/api`
3. Build command: `npm run build`, output: `dist/`

### Backend → Render
1. Set root directory to `backend/`
2. Set environment variables: `NEON_DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS`
3. Uses `render.yaml` for auto-configuration

## Key Features
- Multi-tenant (company-scoped data isolation)
- Excel/CSV upload with geocoding
- Route optimization via OR-Tools TSP solver
- OSRM road geometry for map visualization
- Driver management with auto-generated login credentials
- Real-time stop completion tracking
