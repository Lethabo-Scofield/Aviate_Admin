# Aviate Dispatch System — Full System Documentation

---

## 1. System Overview

Aviate is a multi-tenant logistics dispatch SaaS. Companies register, upload delivery addresses, and the system automatically geocodes, clusters, and optimizes delivery routes. Admins assign drivers to jobs. Drivers log in on their own device (mobile app or web) to see their assigned deliveries and mark stops as completed.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│                                                             │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│   │  Admin Web    │    │  Driver Web  │    │  Driver App  │  │
│   │  (React SPA)  │    │  (React SPA) │    │  (Mobile)    │  │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│          │                   │                   │          │
└──────────┼───────────────────┼───────────────────┼──────────┘
           │                   │                   │
           ▼                   ▼                   ▼
   ┌───────────────────────────────────────────────────────┐
   │              Flask REST API (Python)                   │
   │              Port 8000 / gunicorn                      │
   │                                                       │
   │  • JWT Authentication (HS256, 30-day tokens)          │
   │  • Role-based access (admin / driver)                 │
   │  • Multi-tenant isolation (company_id on every query) │
   │  • Geocoding (Nominatim via GeoPy)                    │
   │  • Route optimization (Google OR-Tools)               │
   │  • OSRM road geometry (external API)                  │
   └───────────────────┬───────────────────────────────────┘
                       │
                       ▼
   ┌───────────────────────────────────────────────────────┐
   │            Neon PostgreSQL Database                    │
   │            (SQLAlchemy ORM)                            │
   │                                                       │
   │  Tables: companies, users, drivers, stops, jobs       │
   └───────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer      | Technology                                             |
|------------|--------------------------------------------------------|
| Frontend   | React 19 + Vite, Tailwind CSS, React Router, Leaflet  |
| Backend    | Python Flask, gunicorn (production)                    |
| Database   | PostgreSQL (Neon serverless)                           |
| ORM        | SQLAlchemy                                             |
| Auth       | JWT (PyJWT HS256) + bcrypt password hashing            |
| Geocoding  | Nominatim (via GeoPy)                                  |
| Routing    | Google OR-Tools (optimization), OSRM (road geometry)   |

---

## 2. Database Schema

### companies
| Column     | Type     | Notes                     |
|------------|----------|---------------------------|
| id         | String   | PK, format: `CMP-XXXXXXXX` |
| name       | String   | Company name              |
| domain     | String   | Email domain (optional)   |
| created_at | DateTime | UTC timestamp             |

### users
| Column        | Type     | Notes                                    |
|---------------|----------|------------------------------------------|
| id            | String   | PK, format: `USR-XXXXXXXX`               |
| email         | String   | Unique, used for login                   |
| password_hash | String   | bcrypt hash                              |
| name          | String   | Display name                             |
| role          | String   | `"admin"` or `"driver"`                  |
| company_id    | String   | FK → companies.id                        |
| driver_id     | String   | FK → drivers.id (null for admins)        |
| created_at    | DateTime | UTC timestamp                            |

### drivers
| Column       | Type     | Notes                          |
|--------------|----------|--------------------------------|
| id           | String   | PK, format: `DRV-XXXXXX`       |
| name         | String   | Driver name                    |
| email        | String   | Same as linked user email      |
| vehicle_type | String   | `van`, `truck`, `bike`, `car`  |
| status       | String   | `available` (default)          |
| company_id   | String   | FK → companies.id              |
| user_id      | String   | Linked user account ID         |
| created_at   | DateTime | UTC timestamp                  |

### stops
| Column            | Type     | Notes                         |
|-------------------|----------|-------------------------------|
| id                | String   | PK                            |
| order_id          | String   | Business order reference      |
| customer_name     | String   | Recipient name                |
| address           | String   | Full street address           |
| lat               | Float    | Latitude (geocoded)           |
| lng               | Float    | Longitude (geocoded)          |
| demand            | Integer  | Package weight/count          |
| service_time      | Integer  | Minutes at stop               |
| phone             | String   | Customer phone                |
| notes             | Text     | Delivery notes                |
| time_window_start | String   | Earliest delivery time        |
| time_window_end   | String   | Latest delivery time          |
| job_id            | String   | FK → jobs.id (null if unassigned) |
| stop_number       | Integer  | Optimized sequence position   |
| completed         | Boolean  | Whether delivery is done      |
| completed_at      | DateTime | When marked complete          |
| company_id        | String   | FK → companies.id             |

### jobs
| Column            | Type     | Notes                                        |
|-------------------|----------|----------------------------------------------|
| id                | String   | PK, format: `JOB-XXXXXX`                     |
| area              | String   | Geographic cluster name (e.g., "Sandton")    |
| total_stops       | Integer  | Number of stops in this job                  |
| total_distance_km | Float    | Optimized route distance                     |
| estimated_time_min| Integer  | Estimated drive + service time               |
| estimated_cost    | Float    | Cost estimate (ZAR)                          |
| center_lat        | Float    | Cluster center latitude                      |
| center_lng        | Float    | Cluster center longitude                     |
| status            | String   | `unassigned`, `assigned`, or `completed`     |
| driver_id         | String   | FK → drivers.id (null if unassigned)         |
| driver_name       | String   | Denormalized driver name                     |
| route_geometry    | Text     | Encoded polyline (OSRM format)               |
| assigned_at       | DateTime | When driver was assigned                     |
| completed_at      | DateTime | When all stops completed                     |
| company_id        | String   | FK → companies.id                            |

---

## 3. Authentication System

### How It Works

1. **Registration** — Admin provides name, email, password, company name → system creates a `Company` + `User` (role=admin) → returns a JWT token
2. **Login** — Email + password → bcrypt verification → returns JWT token
3. **JWT Token** — Signed with HS256 using `JWT_SECRET` env var, expires after 30 days

### JWT Token Payload

```json
{
  "user_id": "USR-A1B2C3D4",
  "company_id": "CMP-E5F6G7H8",
  "email": "admin@company.co.za",
  "role": "admin",
  "driver_id": null,
  "exp": 1720000000,
  "iat": 1717408000
}
```

For driver accounts, the token includes:
```json
{
  "role": "driver",
  "driver_id": "DRV-X1Y2Z3"
}
```

### Using the Token

Every authenticated request must include the token as a Bearer token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Roles

| Role     | Can do                                                  |
|----------|--------------------------------------------------------|
| `admin`  | Everything: upload, optimize, assign, manage drivers    |
| `driver` | View own assigned jobs, mark stops complete              |

### Driver Account Creation Flow

1. Admin adds a driver on the web dashboard (name + email required)
2. Backend automatically creates both a `Driver` record AND a `User` record with role `"driver"`
3. If no password is specified, an 8-character random password is generated
4. The generated password is returned ONCE in the API response
5. Admin shares the email + password with the driver
6. Driver logs in using the same `/api/auth/login` endpoint
7. The mobile app checks `user.role` — if `"driver"`, it shows the driver UI

---

## 4. API Documentation

Base URL: `https://your-domain.com/api`

All responses are JSON. Errors return `{"error": "message"}` with appropriate HTTP status codes.

---

### 4.1 Authentication Endpoints (No token required)

#### POST /api/auth/register

Create a new company and admin account.

**Request:**
```json
{
  "name": "John Smith",
  "email": "john@acmelogistics.co.za",
  "password": "securepass123",
  "company_name": "Acme Logistics"
}
```

**Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "USR-A1B2C3D4",
    "email": "john@acmelogistics.co.za",
    "name": "John Smith",
    "role": "admin",
    "company_id": "CMP-E5F6G7H8",
    "company_name": "Acme Logistics",
    "driver_id": null,
    "created_at": "2026-04-10T12:00:00+00:00"
  }
}
```

**Errors:** 400 (missing fields), 409 (email exists)

---

#### POST /api/auth/login

Authenticate an existing user (admin or driver).

**Request:**
```json
{
  "email": "john@acmelogistics.co.za",
  "password": "securepass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "USR-A1B2C3D4",
    "email": "john@acmelogistics.co.za",
    "name": "John Smith",
    "role": "admin",
    "company_id": "CMP-E5F6G7H8",
    "company_name": "Acme Logistics",
    "driver_id": null,
    "created_at": "2026-04-10T12:00:00+00:00"
  }
}
```

**Errors:** 400 (missing fields), 401 (wrong credentials)

---

#### GET /api/auth/me

Get current user info. Requires Bearer token.

**Response (200):**
```json
{
  "user": {
    "id": "USR-A1B2C3D4",
    "email": "john@acmelogistics.co.za",
    "name": "John Smith",
    "role": "admin",
    "company_id": "CMP-E5F6G7H8",
    "company_name": "Acme Logistics",
    "driver_id": null,
    "created_at": "2026-04-10T12:00:00+00:00"
  }
}
```

---

### 4.2 Admin Endpoints (Require token + admin role)

#### POST /api/drivers

Add a new driver. Automatically creates a login account.

**Request:**
```json
{
  "name": "Sipho Ndlovu",
  "email": "sipho@gmail.com",
  "vehicle_type": "van",
  "password": ""
}
```

If `password` is empty or omitted, an 8-character random password is generated.

**Response (201):**
```json
{
  "success": true,
  "driver": {
    "id": "DRV-A1B2C3",
    "name": "Sipho Ndlovu",
    "email": "sipho@gmail.com",
    "vehicle_type": "van",
    "status": "available",
    "has_account": true,
    "created_at": "2026-04-10T12:00:00+00:00",
    "generated_password": "f3a9c1d2"
  }
}
```

**Important:** `generated_password` is only returned once. The admin must share it with the driver.

---

#### GET /api/drivers

List all drivers for the company.

**Response (200):**
```json
{
  "drivers": [
    {
      "id": "DRV-A1B2C3",
      "name": "Sipho Ndlovu",
      "email": "sipho@gmail.com",
      "vehicle_type": "van",
      "status": "available",
      "has_account": true,
      "created_at": "2026-04-10T12:00:00+00:00"
    }
  ]
}
```

---

#### DELETE /api/drivers/:driver_id

Remove a driver and their login account. Unassigns all their jobs.

**Response (200):**
```json
{ "success": true }
```

---

#### POST /api/upload

Upload an Excel file with delivery addresses. Backend geocodes each address.

**Request:** `multipart/form-data` with field `file` (`.xlsx` or `.xls`)

**Excel columns:**
- **Required:** `Full_Address` (or `address`)
- **Optional:** `Order_ID`, `Customer_Name`, `Demand`, `Time_Window_Start`, `Time_Window_End`, `Service_Time`, `Phone`, `Notes`

**Response (200):**
```json
{
  "success": true,
  "total_rows": 20,
  "geocoded": 18,
  "failed": 2,
  "failed_details": ["Row 5: 123 Bad Address"],
  "stops": [ ... ]
}
```

---

#### POST /api/optimize

Cluster stops by geographic proximity and optimize route order using OR-Tools.

**Request:**
```json
{
  "cluster_radius": 8,
  "stops": []
}
```

`cluster_radius` is in kilometers (default 8). `stops` is optional — if omitted, uses all unassigned stops for the company.

**Response (200):**
```json
{
  "success": true,
  "jobs": [
    {
      "id": "JOB-A1B2C3",
      "area": "Sandton",
      "stops": [ ... ],
      "total_stops": 5,
      "total_distance_km": 23.4,
      "estimated_time_min": 95,
      "estimated_cost": 285.00,
      "center_lat": -26.107,
      "center_lng": 28.056,
      "status": "unassigned",
      "driver_id": null,
      "driver_name": null,
      "route_geometry": "encoded_polyline_string...",
      "assigned_at": null,
      "completed_at": null,
      "created_at": "2026-04-10T12:00:00+00:00"
    }
  ],
  "total_jobs": 4,
  "total_stops": 20,
  "total_distance_km": 87.2,
  "total_estimated_cost": 1050.00
}
```

---

#### GET /api/jobs

List all jobs for the company.

**Response (200):**
```json
{
  "jobs": [
    {
      "id": "JOB-A1B2C3",
      "area": "Sandton",
      "stops": [
        {
          "id": "stop_abc123",
          "order_id": "ORD-001",
          "customer_name": "Sipho Ndlovu",
          "address": "Vilakazi Street, Soweto",
          "lat": -26.2382,
          "lng": 27.9082,
          "demand": 2,
          "service_time": 15,
          "phone": "+27 72 100 0001",
          "notes": "Ring bell twice",
          "time_window_start": "",
          "time_window_end": "",
          "job_id": "JOB-A1B2C3",
          "stop_number": 1,
          "completed": false,
          "completed_at": null
        }
      ],
      "total_stops": 5,
      "total_distance_km": 23.4,
      "estimated_time_min": 95,
      "estimated_cost": 285.00,
      "center_lat": -26.107,
      "center_lng": 28.056,
      "status": "assigned",
      "driver_id": "DRV-A1B2C3",
      "driver_name": "Sipho Ndlovu",
      "route_geometry": "encoded_polyline_string...",
      "assigned_at": "2026-04-10T14:00:00+00:00",
      "completed_at": null,
      "created_at": "2026-04-10T12:00:00+00:00"
    }
  ]
}
```

---

#### POST /api/jobs/:job_id/assign

Assign a driver to a job.

**Request:**
```json
{ "driver_id": "DRV-A1B2C3" }
```

**Response (200):**
```json
{ "success": true, "job": { ... } }
```

---

#### POST /api/jobs/:job_id/unassign

Remove the driver from a job.

**Response (200):**
```json
{ "success": true, "job": { ... } }
```

---

#### GET /api/stats

Dashboard statistics.

**Response (200):**
```json
{
  "total_jobs": 4,
  "unassigned": 1,
  "assigned": 2,
  "completed": 1,
  "total_stops": 20,
  "total_distance_km": 87.2,
  "total_estimated_cost": 1050.00,
  "total_drivers": 3
}
```

---

#### GET /api/stops

List all stops for the company.

---

#### POST /api/test-data

Load 20 pre-geocoded Johannesburg test stops (for development).

---

### 4.3 Driver Endpoints (Require token, any role)

These are the endpoints a **mobile app** should use.

#### GET /api/my-jobs

Get all jobs assigned to the logged-in driver.

**Response (200):**
```json
{
  "driver": {
    "id": "DRV-A1B2C3",
    "name": "Sipho Ndlovu",
    "email": "sipho@gmail.com",
    "vehicle_type": "van",
    "status": "available",
    "has_account": true,
    "created_at": "2026-04-10T12:00:00+00:00"
  },
  "jobs": [
    {
      "id": "JOB-X1Y2Z3",
      "area": "Soweto",
      "stops": [
        {
          "id": "stop_abc123",
          "order_id": "ORD-001",
          "customer_name": "Thandi Mokoena",
          "address": "Chris Hani Rd, Meadowlands, Soweto",
          "lat": -26.263,
          "lng": 27.893,
          "demand": 1,
          "service_time": 10,
          "phone": "+27 72 100 0002",
          "notes": "Leave at gate",
          "time_window_start": "",
          "time_window_end": "",
          "job_id": "JOB-X1Y2Z3",
          "stop_number": 1,
          "completed": false,
          "completed_at": null
        },
        {
          "id": "stop_def456",
          "order_id": "ORD-002",
          "customer_name": "Bongani Sithole",
          "address": "Diepkloof Square, Soweto",
          "lat": -26.253,
          "lng": 27.958,
          "demand": 1,
          "service_time": 10,
          "phone": "+27 72 100 0010",
          "notes": "",
          "time_window_start": "",
          "time_window_end": "",
          "job_id": "JOB-X1Y2Z3",
          "stop_number": 2,
          "completed": true,
          "completed_at": "2026-04-10T15:30:00+00:00"
        }
      ],
      "total_stops": 5,
      "total_distance_km": 18.7,
      "estimated_time_min": 75,
      "estimated_cost": 190.00,
      "center_lat": -26.258,
      "center_lng": 27.925,
      "status": "assigned",
      "driver_id": "DRV-A1B2C3",
      "driver_name": "Sipho Ndlovu",
      "route_geometry": "encoded_polyline_string...",
      "assigned_at": "2026-04-10T14:00:00+00:00",
      "completed_at": null,
      "created_at": "2026-04-10T12:00:00+00:00"
    }
  ]
}
```

If the driver has no jobs yet, returns `{"jobs": [], "driver": {...}}`.

---

#### POST /api/my-jobs/:job_id/complete/:stop_id

Mark a specific stop as delivered.

**Response (200):**
```json
{
  "success": true,
  "stop": {
    "id": "stop_abc123",
    "completed": true,
    "completed_at": "2026-04-10T15:45:00+00:00",
    ...
  },
  "job_status": "assigned"
}
```

When the last stop in a job is completed, `job_status` automatically becomes `"completed"`.

**Errors:** 403 (no driver profile), 404 (job/stop not found or not yours)

---

## 5. Mobile App Integration Guide

### What the Mobile App Needs to Implement

#### 5.1 Login Screen

1. Show email + password fields
2. POST to `/api/auth/login`
3. Store the `token` string securely (Keychain on iOS, EncryptedSharedPreferences on Android)
4. Store the `user` object for display purposes
5. Check `user.role`:
   - If `"driver"` → show the driver job list screen
   - If `"admin"` → show admin features (or redirect to web)

#### 5.2 Token Management

- Include on every request: `Authorization: Bearer <token>`
- Token expires after 30 days
- If any request returns HTTP 401 → clear stored token → redirect to login
- On app launch, call `GET /api/auth/me` to verify the token is still valid

#### 5.3 Driver Job List Screen

1. Call `GET /api/my-jobs` on load and pull-to-refresh
2. Display each job as a card showing:
   - `job.area` (geographic area name)
   - `job.total_stops` (total deliveries)
   - Count of `job.stops.filter(s => s.completed)` vs total (progress)
   - `job.total_distance_km` (route distance)
   - `job.status` (`assigned` or `completed`)
3. Sort active jobs first, completed jobs at the bottom

#### 5.4 Job Detail / Stop List Screen

1. Show stops sorted by `stop_number` (this is the optimized delivery order)
2. For each stop, display:
   - `stop.customer_name`
   - `stop.address`
   - `stop.phone` (make it tappable to call)
   - `stop.notes` (delivery instructions)
   - `stop.completed` status
3. "Navigate" button → open the address in Google Maps / Apple Maps:
   - iOS: `maps://maps.apple.com/?daddr={lat},{lng}`
   - Android: `geo:{lat},{lng}?q={address}`
   - Or Google Maps: `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`
4. "Mark Complete" button → `POST /api/my-jobs/{job_id}/complete/{stop_id}`

#### 5.5 Route Map (Optional)

Each job has a `route_geometry` field containing an encoded polyline (Google Polyline Encoding format). To draw the route on a map:

**Decoding the polyline** (pseudocode):
```
function decodePolyline(encoded):
  // Standard Google polyline decoding algorithm
  // Returns array of [lat, lng] coordinate pairs
```

Libraries available:
- iOS: `import Polyline` (CocoaPods)
- Android: `com.google.maps.android:android-maps-utils`
- React Native: `@mapbox/polyline`
- Flutter: `google_polyline_algorithm`

#### 5.6 Polling / Real-time Updates

The API is REST-only (no WebSockets). The mobile app should:
- Poll `GET /api/my-jobs` periodically (every 30-60 seconds) for new assignments
- Or use pull-to-refresh for manual updates
- Background notifications would require a push notification service (not built yet)

#### 5.7 Offline Handling

The API requires internet. If offline:
- Cache the last fetched job list locally
- Queue "mark complete" actions and replay when back online
- Show a clear offline indicator

---

## 6. Hosting & Deployment

### 6.1 Environment Variables Required

| Variable           | Required | Description                                       |
|--------------------|----------|---------------------------------------------------|
| `NEON_DATABASE_URL` | Yes      | PostgreSQL connection string from Neon             |
| `JWT_SECRET`       | Yes      | Random string for signing JWT tokens (32+ chars). Must be the same across restarts. |
| `ALLOWED_ORIGINS`  | No       | Comma-separated allowed CORS origins. Default `*`. For production, set to your app domains. Example: `https://aviate.co.za,https://app.aviate.co.za` |
| `FLASK_DEBUG`      | No       | Set `true` for debug mode (never in production)   |

### 6.2 Option A: Deploy on Replit

The easiest path. The project is already configured for Replit:

1. Click "Deploy" / "Publish" in Replit
2. Set the environment variables in the Secrets tab
3. Replit handles HTTPS, domain, and process management
4. The frontend and backend both run as configured workflows

The API will be available at: `https://your-repl-name.replit.app/api/...`

### 6.3 Option B: Deploy Backend Separately (VPS / Cloud)

If you want to host the backend API separately (for a mobile app):

**Using gunicorn (production WSGI server):**
```bash
cd backend
pip install -r requirements.txt
export NEON_DATABASE_URL="postgresql://user:pass@host/db"
export JWT_SECRET="your-secret-key-here"
export ALLOWED_ORIGINS="https://yourdomain.com"
gunicorn wsgi:app --bind 0.0.0.0:8000 --workers 2 --timeout 120
```

**Using Docker:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/ .
RUN pip install -r requirements.txt
ENV PORT=8000
CMD gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
```

**Platform options:**
- **Railway** — Connect GitHub repo, set env vars, deploy
- **Render** — Free tier available, uses the Procfile
- **DigitalOcean App Platform** — Point to the `backend/` directory
- **AWS ECS / Google Cloud Run** — Use the Docker approach

### 6.4 Option C: Deploy Frontend + Backend Together

Build the React frontend and serve it from Flask:

```bash
# Build frontend
npm run build

# Copy dist/ to backend/static/
cp -r dist/* backend/static/

# Serve from Flask (add a catch-all route for SPA)
```

This gives you a single deployment unit.

### 6.5 Database (Neon PostgreSQL)

The database is already hosted on Neon (serverless PostgreSQL). No setup needed — the `NEON_DATABASE_URL` connection string handles everything. Tables are auto-created on first startup.

If you need a fresh database:
1. Create a new Neon project at neon.tech
2. Copy the connection string
3. Set it as `NEON_DATABASE_URL`
4. Restart the backend — tables are created automatically

### 6.6 CORS Configuration for Mobile Apps

Mobile apps making HTTP requests don't send an `Origin` header, so CORS typically isn't an issue. However, if you're also serving a web frontend from a different domain, set:

```
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

For development or mobile-only APIs, `ALLOWED_ORIGINS=*` (the default) is fine.

### 6.7 HTTPS

- **Replit**: Automatic HTTPS
- **Railway/Render**: Automatic HTTPS
- **Custom VPS**: Use Caddy (automatic HTTPS) or nginx + Let's Encrypt

HTTPS is mandatory for production. JWT tokens are sent in headers — without HTTPS, they can be intercepted.

---

## 7. Mobile App API Quick Reference

Here's the minimal set of endpoints a driver mobile app needs:

| Action                  | Method | Endpoint                                     | Auth    |
|-------------------------|--------|----------------------------------------------|---------|
| Login                   | POST   | `/api/auth/login`                             | None    |
| Verify token            | GET    | `/api/auth/me`                                | Bearer  |
| Get my jobs             | GET    | `/api/my-jobs`                                | Bearer  |
| Mark stop complete      | POST   | `/api/my-jobs/{job_id}/complete/{stop_id}`    | Bearer  |

That's it — 4 endpoints for a fully functional driver app.

### Typical Mobile App Flow

```
1. App opens
   └─ Check for stored token
      ├─ No token → Show Login screen
      │   └─ POST /api/auth/login
      │       ├─ Success → Store token, go to step 2
      │       └─ Fail → Show error
      │
      └─ Has token → GET /api/auth/me
          ├─ 200 OK → Go to step 2
          └─ 401 → Clear token, show Login
   
2. Job List screen
   └─ GET /api/my-jobs
      ├─ Show jobs grouped by status
      ├─ Pull to refresh
      └─ Tap job → Job Detail
   
3. Job Detail screen
   └─ Show stops in order (sorted by stop_number)
      ├─ Tap phone → Call customer
      ├─ Tap address → Open in Maps app
      └─ Tap "Complete" → POST /api/my-jobs/{job_id}/complete/{stop_id}
          └─ Refresh job list
```

---

## 8. Error Handling

All API errors follow this format:

```json
{ "error": "Human-readable error message" }
```

| Status | Meaning                                          |
|--------|--------------------------------------------------|
| 400    | Bad request (missing or invalid fields)           |
| 401    | Not authenticated (missing/expired/invalid token) |
| 403    | Not authorized (wrong role, or not your resource) |
| 404    | Resource not found                                |
| 409    | Conflict (e.g., email already exists)             |
| 500    | Server error                                      |

---

## 9. Security Notes

- All admin endpoints require both a valid JWT AND `role: "admin"`
- Driver endpoints verify ownership: a driver can only see/modify their own jobs
- All database queries are scoped by `company_id` (multi-tenant isolation)
- Passwords are hashed with bcrypt (never stored in plaintext)
- JWT secret must be a strong random string, set via environment variable
- The generated driver password is returned only once and never stored in plaintext
- Legacy driver endpoints (`/api/driver/:id/...`) also require JWT authentication
