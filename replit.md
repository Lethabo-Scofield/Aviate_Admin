# Aiviate - Logistics Dispatch SaaS

## Overview
Aiviate is a multi-tenant logistics dispatch platform for managing delivery routes, drivers, and stops. It features route optimization using Google OR-Tools, geocoding via GeoPy, and interactive map visualization.

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
├── docs/                   # Documentation
│   ├── API.md              # Full API reference
│   └── SYSTEM.md           # System architecture & schema docs
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

## Design System
- **Aesthetic**: Apple-inspired minimal design — clean white backgrounds, grey/black typography, teal accent
- **Accent color**: `#008080` (teal) — RESERVED for status badges, progress rings, step indicators only. NOT used for nav or buttons
- **Primary button**: `#6e6e73` (grey) — main CTAs
- **Active nav**: `#e8e8ed` bg with `#3a3a3c` text — subtle grey, NOT dark/bold, NOT teal
- **Text hierarchy**: `#1d1d1f` (primary), `#6e6e73` / `#86868b` (secondary), `#aeaeb2` (tertiary), `#c7c7cc` (quaternary)
- **Surfaces**: White (`#ffffff`) backgrounds, `#f5f5f7` for card interiors/stat tiles/hover states
- **Cards**: `.apple-card` class — white with subtle shadow, 16px border-radius
- **Inputs**: `.apple-input` class — `#f5f5f7` background, teal focus ring
- **Buttons**: `.apple-btn` + `.apple-btn-primary` / `.apple-btn-secondary` / `.apple-btn-accent`
- **Stat cards**: `.stat-card` class — `#f5f5f7` background tiles for metrics
- **Typography**: Inter (Google Fonts, 400/500/600/700) as primary, system font stack fallback
- **Avatars**: `/default-avatar.png` placeholder image — no initials. Used in Sidebar, DriverLayout, Profile
- **Vehicle icons**: Van=Container, Truck=Truck, Car=Car, Bike=Bike (all from lucide-react)
- **Responsive**: Mobile-first with `sm:`, `md:`, `lg:` breakpoints. All page h1 headings use `text-[24px] sm:text-[28px]`. Map view legend scrolls only on desktop. Input font-size 16px on small screens (prevents iOS zoom). Stat card padding reduced on mobile

## Key Features
- Multi-tenant (company-scoped data isolation)
- Excel/CSV upload with geocoding
- Route optimization via OR-Tools TSP solver
- OSRM road geometry for map visualization
- Driver management with auto-generated login credentials
- Driver detail panel: view info, login credentials, block/unblock, delivery history
- Block/unblock drivers (enforced at both login and per-request middleware)
- Password reset for drivers with viewable credentials
- Completed deliveries tracking per driver with progress indicators
- Real-time stop completion tracking

## Driver Management API
- `GET /api/drivers/<id>` — Driver detail with stats, credentials, job history
- `POST /api/drivers/<id>/block` — Toggle block/unblock a driver
- `POST /api/drivers/<id>/reset-password` — Generate new password for a driver
- `GET /api/drivers/<id>/deliveries` — Driver's delivery history with completion %
