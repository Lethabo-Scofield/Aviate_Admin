# Aviate Dispatch System — Logistics SaaS MVP

## Overview
A real logistics dispatch system where admins upload an Excel file of delivery addresses, the backend geocodes them (Nominatim), clusters stops into geographic jobs, optimizes routes using OR-Tools, and assigns drivers. Drivers with emails receive login credentials and can see their assigned jobs on their own device. Data persists to Neon PostgreSQL. Multi-tenant auth isolates data per company.

## Tech Stack
- **Frontend**: React 19 + Vite, Tailwind CSS 4, React Router, Lucide icons
- **Backend**: Python Flask, Google OR-Tools (route optimization), GeoPy (geocoding via Nominatim), Pandas, PyJWT + bcrypt (auth)
- **Database**: Neon PostgreSQL via `NEON_DATABASE_URL` env var, SQLAlchemy ORM
- **Production**: gunicorn via `backend/wsgi.py`, configurable CORS via `ALLOWED_ORIGINS` env var

## Authentication & Multi-Tenancy
- **JWT auth**: PyJWT with HS256, 30-day token expiry, secret from `JWT_SECRET` env var
- **Password hashing**: bcrypt
- **Token storage**: `localStorage` keys `aviate_token` and `aviate_user`
- **Roles**: `admin` (default for registered users) and `driver` (auto-created when admin adds a driver)
- **Auth flow**: Register creates Company + User (role=admin) → returns JWT; Login validates → returns JWT with role + driver_id
- **Driver accounts**: When admin adds a driver with email, a User with role="driver" is auto-created with a generated password. Admin shares credentials with driver. Driver logs in and sees only the "My Jobs" view.
- **Tenant isolation**: `require_auth` decorator extracts `company_id`, `user_role`, `driver_id` from JWT into `g.*`; all queries filter by `company_id`
- **Frontend**: `AuthContext` provider, `ProtectedRoute` wrapper, role-based routing (admin→full dashboard, driver→My Jobs only)

## Database
- **Connection**: `NEON_DATABASE_URL` environment variable (shared secret)
- **ORM**: SQLAlchemy with `psycopg2-binary` driver
- **Models** (`backend/models.py`):
  - `Company` — id, name, domain, created_at
  - `User` — id, email, password_hash, name, role (admin|driver), company_id (FK→companies), driver_id (FK→drivers, nullable), created_at
  - `Driver` — id, name, email, vehicle_type, status, company_id (FK→companies), user_id (linked User account), created_at
  - `Stop` — id, order_id, customer_name, address, lat, lng, demand, service_time, phone, notes, time_window_start, time_window_end, job_id (FK→jobs), stop_number, completed, completed_at, company_id (FK→companies)
  - `Job` — id, area, total_stops, total_distance_km, estimated_time_min, estimated_cost, center_lat, center_lng, status, driver_id (FK→drivers), driver_name, route_geometry (OSRM polyline), assigned_at, completed_at, company_id (FK→companies)
- **Session management**: `SessionLocal()` per request, manual open/close pattern
- Tables auto-created on startup via `init_db()` / `Base.metadata.create_all()`
- Startup migration adds missing columns (route_geometry, company_id, user_id, driver_id) to existing tables

## Design System (Apple-Inspired)
- Background: `#f5f5f7` (Apple light grey)
- Cards: white with subtle shadows (`apple-card` class)
- Text primary: `#1d1d1f`, secondary: `#86868b`, tertiary: `#aeaeb2`
- Primary accent: `#008080` (teal) — used sparingly for status badges, focus rings, step indicators, active counts
- Secondary colors: green `#34c759`, orange `#ff9500`, red `#ff3b30`
- Active nav/buttons: `#1d1d1f` (near-black)
- Logo: `public/logo.png` — used in sidebar, driver header, and as loading indicator (`LogoLoader` component)
- Favicon: `public/favicon.ico` (multi-size ICO), `public/favicon-32x32.png`, `public/apple-touch-icon.png` (180×180), `public/icon-192.png` (192×192)
- SEO: Full meta tags in `index.html` — title, description, keywords, Open Graph, Twitter Card, canonical, theme-color (#008080)
- Frosted glass sidebar with backdrop blur
- Skeleton loaders, logo pulse loader, fade-in/slide-up animations
- Typography: SF Pro / system font stack, tight tracking
- Inputs: `apple-input` class with teal focus rings
- Buttons: `apple-btn apple-btn-primary` / `apple-btn-secondary`

## Project Structure
```
├── backend/
│   ├── app.py                 # Flask API (port 8000) — auth, upload, geocode, cluster, optimize, assign, driver endpoints
│   ├── models.py              # SQLAlchemy ORM models (Company, User, Driver, Stop, Job)
│   ├── optimize_route.py      # OR-Tools route optimizer
│   ├── wsgi.py                # Gunicorn WSGI entry point
│   ├── Procfile               # Production process definition
│   └── requirements.txt
├── src/
│   ├── App.jsx                # Root with BrowserRouter + AuthProvider + role-based routing
│   ├── main.jsx
│   ├── index.css              # Tailwind + global styles
│   ├── contexts/
│   │   └── AuthContext.jsx    # Auth state, login/register/logout, token management
│   ├── services/
│   │   └── api.js             # API client — all backend calls with JWT headers
│   ├── components/
│   │   ├── Layout.jsx         # Admin layout: Sidebar + Outlet wrapper
│   │   ├── DriverLayout.jsx   # Driver layout: minimal header + Outlet
│   │   ├── Sidebar.jsx        # Admin navigation sidebar with user info + logout
│   │   ├── ProtectedRoute.jsx # Auth guard — redirects to /login if unauthenticated
│   │   └── Loader.jsx         # Spinner, skeleton loaders
│   └── pages/
│       ├── Dashboard.jsx      # Overview stats + onboarding (empty state → stats view)
│       ├── DispatchCenter.jsx  # 3-step wizard: Upload → Optimize → Results
│       ├── Jobs.jsx           # Jobs list with inline driver assignment
│       ├── MapView.jsx        # Leaflet map with color-coded jobs, route lines, legend, toggle
│       ├── Drivers.jsx        # Fleet management — add drivers (auto-creates login), remove drivers
│       ├── MyJobs.jsx         # Driver view — see assigned jobs, mark stops complete
│       ├── Login.jsx          # Login page (shared by admins and drivers)
│       ├── Register.jsx       # Registration page (creates company + admin user)
│       └── NotFound.jsx       # 404 page
```

## API Endpoints

### Auth (unprotected)
- `POST /api/auth/register` — Create company + user, returns JWT
- `POST /api/auth/login` — Authenticate user, returns JWT (includes role + driver_id)
- `GET /api/auth/me` — Get current user info (requires JWT)

### Protected (require JWT)
- `POST /api/upload` — Upload Excel with delivery addresses, geocodes via Nominatim
- `POST /api/test-data` — Load 20 pre-geocoded Johannesburg test stops
- `POST /api/optimize` — Cluster stops geographically, optimize route per cluster via OR-Tools
- `POST /api/route` — Proxy endpoint for OSRM road route fetching
- `GET /api/jobs` — List jobs (tenant-scoped)
- `POST /api/jobs/:id/assign` — Assign driver to job
- `POST /api/jobs/:id/unassign` — Unassign driver from job
- `GET /api/drivers` — List drivers (tenant-scoped)
- `POST /api/drivers` — Add a new driver (auto-creates User with role=driver, returns generated_password)
- `DELETE /api/drivers/:id` — Remove a driver (also deletes linked User account)
- `GET /api/stats` — Dashboard statistics (tenant-scoped)
- `GET /api/stops` — List stops (tenant-scoped)

### Driver-facing (require JWT, driver role)
- `GET /api/my-jobs` — Get jobs assigned to the logged-in driver
- `POST /api/my-jobs/:job_id/complete/:stop_id` — Mark a stop as completed

### Legacy Driver API (require JWT, backward compat)
- `GET /api/driver/:id/jobs` — Driver: get assigned jobs by driver ID
- `POST /api/driver/:id/complete/:job_id/:stop_id` — Driver marks stop complete

## Driver Account System
1. Admin adds a driver with name + email → backend creates both a `Driver` record and a `User` record (role="driver")
2. If no password is provided, an 8-char random password is generated
3. The generated password is returned once in the API response so the admin can share it
4. Driver logs in with email + password → JWT includes `role: "driver"` and `driver_id`
5. Frontend detects `role === "driver"` → renders `DriverLayout` with `MyJobs` page (no admin sidebar)
6. Driver sees assigned jobs, can expand to see stops, and mark each stop as completed
7. When all stops in a job are completed, the job status auto-updates to "completed"
8. Deleting a driver also deletes their User account

## Excel Format
- **Required column**: `Full_Address` (or `address`)
- **Optional columns**: Order_ID, Customer_Name, Demand, Time_Window_Start, Time_Window_End, Service_Time, Phone, Notes

## Core Flow
1. Admin registers company → logs in with JWT
2. Admin uploads Excel file → backend geocodes each address via Nominatim (1.1s delay per address)
3. Admin clicks Optimize → backend clusters stops by geographic radius (default 8km), runs OR-Tools per cluster
4. Jobs are created from clusters with optimized stop order
5. Admin adds drivers (with email) → system auto-creates login accounts
6. Admin assigns drivers to jobs
7. Admin shares login credentials with drivers
8. Drivers log in on their device → see "My Jobs" view → mark stops as completed

## Environment Variables
- `NEON_DATABASE_URL` — PostgreSQL connection string (required)
- `JWT_SECRET` — HMAC secret for JWT signing (required for persistence across restarts)
- `ALLOWED_ORIGINS` — Comma-separated allowed CORS origins (default: `*`, set for production)
- `FLASK_DEBUG` — Set to `true` for Flask debug mode

## Architecture — Split API Layer
The app has two API servers:

### Node.js API (port 3001) — Auth + CRUD
Handles all authentication and data operations directly against Neon PostgreSQL. This server works independently of Flask, so login, registration, jobs, drivers, stats, and all CRUD operations work even when Flask is not running.

**Files**: `server/index.js`, `server/db.js`, `server/auth.js`, `server/routes.js`

**Endpoints handled by Node.js**:
- All `/api/auth/*` (register, login, me)
- `/api/jobs`, `/api/jobs/:id/assign`, `/api/jobs/:id/unassign`
- `/api/drivers` (GET, POST, DELETE)
- `/api/my-jobs`, `/api/my-jobs/:id/complete/:stopId`
- `/api/driver/:id/jobs`, `/api/driver/:id/complete/:jobId/:stopId`
- `/api/stops`, `/api/stats`
- `/api/route` (OSRM proxy)

### Flask Backend (port 8000) — Optimization Engine Only
Handles compute-heavy operations that require Python libraries (OR-Tools, Pandas, GeoPy).

**Endpoints handled by Flask**:
- `POST /api/upload` — Excel upload + geocoding via Nominatim
- `POST /api/optimize` — Route optimization via Google OR-Tools
- `POST /api/test-data` — Load test data

### Vite Proxy Config
Vite proxies `/api/upload`, `/api/optimize`, `/api/test-data` → Flask (port 8000). All other `/api/*` → Node.js (port 3001).

## Ports
- **Frontend (Vite)**: port 5000 (webview)
- **Node.js API**: port 3001 (console) — auth + CRUD
- **Backend (Flask)**: port 8000 (console) — optimization engine

## Workflows
- **Start application**: `npm run dev` — React/Vite frontend (port 5000)
- **Node API**: `node server/index.js` — Node.js API server (port 3001)
- **Backend API**: `cd backend && python app.py` — Flask optimization engine (port 8000)

## Key Dependencies
### Frontend (npm)
- react-router-dom, lucide-react, papaparse, xlsx, leaflet, react-leaflet

### Node.js API (npm)
- express, pg, jsonwebtoken, bcryptjs, cors, uuid

### Backend (pip)
- flask, flask-cors, pandas, openpyxl, geopy, ortools, sqlalchemy, psycopg2-binary, requests, PyJWT, bcrypt, gunicorn

## Important Notes
- Auth works independently of Flask — login/register/data operations only need the Node.js API + Neon database
- Always cast numpy types to Python native types before DB insert
- Use `datetime.now(timezone.utc)` not `datetime.utcnow()` (deprecated)
- OSRM routes stored as encoded polyline in `Job.route_geometry`, decoded with `decodePolyline()` in MapView
- Driver `to_dict()` includes `has_account: bool` field based on `user_id` presence
