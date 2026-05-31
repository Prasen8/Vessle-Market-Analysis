# Vessel Market Performance Application

Full-stack web application for tracking vessel hire rates vs regional market benchmarks.

## Tech Stack
- **Backend**: Django 4.2 + Django REST Framework + PostgreSQL
- **Frontend**: React 18 + Recharts + React Router v6

---

## Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

---

## Backend Setup

### 1. Create PostgreSQL database
```sql
CREATE DATABASE vessel_market_db;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE vessel_market_db TO postgres;
```

### 2. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Run migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Seed sample data (creates users + 6 vessels + 180 days of rates)
```bash
python manage.py seed_data
```

### 5. Start the server
```bash
python manage.py runserver
```

Backend runs at: http://localhost:8000

---

## Frontend Setup

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Start the dev server
```bash
npm start
```

Frontend runs at: http://localhost:3000

---



---

## API Endpoints

| Method | URL                          | Description                        |
|--------|------------------------------|------------------------------------|
| POST   | /api/auth/login/             | Login, returns token               |
| POST   | /api/auth/logout/            | Logout                             |
| GET    | /api/auth/me/                | Current user info                  |
| GET    | /api/vessels/                | List all vessels                   |
| GET    | /api/regions/                | List all regions                   |
| GET    | /api/rates/                  | List daily rates (filterable)      |
| POST   | /api/rates/                  | Create rate entry (admin only)     |
| PUT    | /api/rates/{id}/             | Update rate entry (admin only)     |
| DELETE | /api/rates/{id}/             | Delete rate entry (admin only)     |
| GET    | /api/aggregated/             | Aggregated rates (no HS codes)     |
| GET    | /api/dashboard/              | Dashboard KPIs                     |

### Rate list filters (query params)
- `?vessel=<id>` — filter by vessel
- `?region=<name>` — filter by region name
- `?date_from=YYYY-MM-DD` — start date
- `?date_to=YYYY-MM-DD` — end date

---

## Project Structure

```
vessel_market/
├── backend/
│   ├── market/
│   │   ├── models.py          # Region, Vessel, DailyRate models
│   │   ├── serializers.py     # DRF serializers
│   │   ├── views.py           # API views + aggregation logic
│   │   ├── urls.py            # App URL routing
│   │   ├── permissions.py     # IsAdminOrReadOnly permission
│   │   ├── admin.py           # Django admin config
│   │   └── management/
│   │       └── commands/
│   │           └── seed_data.py
│   ├── vessel_project/
│   │   ├── settings.py
│   │   └── urls.py
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── api/
        │   └── axios.js       # Axios instance + token interceptors
        ├── context/
        │   └── AuthContext.js # Auth state + login/logout
        ├── components/
        │   ├── Layout.js      # Sidebar + topbar shell
        │   └── Layout.css
        └── pages/
            ├── Login.js       # Login page
            ├── Dashboard.js   # Fleet KPIs + 30-day chart
            ├── RegionalView.js  # Per-vessel chart + HS code tooltips
            ├── AggregatedView.js # Fleet-wide aggregated charts
            └── DataEntry.js   # Admin-only CRUD form
```
