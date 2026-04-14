# Aiviate Dispatch System

A multi-tenant logistics SaaS application for managing delivery routes, drivers, and stops. Features route optimization via Google OR-Tools and interactive map visualizations with Leaflet.

## Architecture

- **Frontend** (`/src`): React 19 SPA built with Vite and Tailwind CSS, served on port 5000
- **Backend** (`/backend`): Python Flask REST API, served on port 8000
- **Database**: PostgreSQL via Neon (external)

## Running the App

Two workflows run in parallel:
- **Start application** — Vite dev server (port 5000), proxies `/api` requests to the backend
- **Backend API** — Flask server (port 8000)

## Key Files

- `backend/app.py` — Flask app factory, registers all blueprints, runs DB migrations
- `backend/config.py` — Reads `NEON_DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS` from env
- `backend/models.py` — SQLAlchemy models: Companies, Users, Drivers, Jobs, Stops
- `backend/routes/` — API blueprints: auth, jobs, drivers, stops, optimization, stats
- `backend/optimize_route.py` — TSP route optimization using Google OR-Tools
- `src/App.jsx` — React router: public (Login/Register) and protected routes
- `src/services/api.js` — Centralized API client with JWT auth headers
- `src/contexts/AuthContext.jsx` — Auth state and session persistence
- `vite.config.js` — Vite config with proxy to backend and `allowedHosts: true`

## Environment Variables

| Variable | Description |
|---|---|
| `NEON_DATABASE_URL` | PostgreSQL connection string (Neon) |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `ALLOWED_ORIGINS` | CORS allowed origins (default: `*`) |

## Dependencies

- **Frontend**: React 19, Vite, Tailwind CSS, Leaflet/React-Leaflet, react-router-dom, papaparse, xlsx, lucide-react
- **Backend**: Flask, Flask-CORS, SQLAlchemy, psycopg2-binary, ortools, numpy, pandas, geopy, PyJWT, bcrypt, gunicorn
