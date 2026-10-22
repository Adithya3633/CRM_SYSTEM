# CRM System

A full-stack customer relationship management platform for sales teams. CRM System combines a Django REST API with a React and TypeScript interface for managing leads, customers, sales activity, and team performance.

## Highlights

- JWT-based authentication with public organization registration
- Role-based access for admins, sales managers, and sales executives
- Lead pipeline with search, filters, assignment, stage transitions, and CRUD operations
- Customer records with contacts, purchase history, and meeting notes
- Dashboard KPIs, revenue reporting, monthly sales, and team performance
- Organization and team-member administration
- Responsive Kanban and table views
- Organization-scoped data access
## Demo Video

[Watch the CRM System demo](https://drive.google.com/file/d/1nR4OZX0_Hgby5D8zITxcACfECWMkUuJg/view?usp=sharing)

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts, React Router |
| Backend | Django 5, Django REST Framework |
| Authentication | Simple JWT |
| Database | SQLite for local development |
| Integration | CORS headers and Vite API proxy |

## Project Structure

```text
.
├── backend_django/
│   ├── manage.py
│   ├── requirements.txt
│   ├── crm_django/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── crm_api/
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       ├── urls.py
│       ├── migrations/
│       └── management/commands/seed_demo.py
├── frontend/
│   ├── src/
│   │   ├── api.ts
│   │   ├── components/
│   │   ├── context/
│   │   └── pages/
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```

## Requirements

- Python 3.11 or newer
- Node.js 18 or newer
- npm 10 or newer recommended
- Ports `8000` and `5173` available locally

## Quick Start

Run the backend and frontend in separate terminals from the project root.

### 1. Start Django

```powershell
cd backend_django
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 127.0.0.1:8000
```

The API is available at `http://127.0.0.1:8000`.

### 2. Start React

```powershell
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. Vite proxies `/api` requests to Django on port 8000. The frontend uses hash-based routes (for example, `/#/customers`) so reloading a page works on static hosts without SPA rewrite support.

### Health Check

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
```

Expected response:

```json
{"status":"ok"}
```

## Demo Accounts

The demo seed command creates one organization and these accounts. The password for each account is `password123`.

| Role | Email |
| --- | --- |
| Admin | `admin@crm.com` |
| Sales Manager | `manager@crm.com` |
| Sales Executive | `john@crm.com` |
| Sales Executive | `emily@crm.com` |

For a clean local database:

```powershell
cd backend_django
Remove-Item crm_django.sqlite3 -ErrorAction SilentlyContinue
python manage.py migrate
python manage.py seed_demo
```

Do not use the demo credentials in production.

## Roles and Permissions

| Role | Permissions |
| --- | --- |
| Sales Executive | View and manage assigned leads and customers; view personal dashboard data |
| Sales Manager | Manage organization leads and customers; assign records; view team performance |
| Admin | All manager capabilities plus organization settings and user administration |

New users can register from the login screen. Registration creates a new organization and makes the first user its admin.

## API Overview

Protected endpoints require:

```text
Authorization: Bearer <access-token>
```

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | API health check |
| POST | `/api/auth/register` | Create an organization and first admin |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/auth/me` | Return the current user |
| GET, POST | `/api/auth/users` | List or create organization users |
| PUT, DELETE | `/api/auth/users/:id` | Update or remove a user |
| GET, PUT | `/api/organization` | Read or update organization settings |
| GET, POST | `/api/leads` | List or create leads |
| GET, PUT, DELETE | `/api/leads/:id` | Read, update, or delete a lead |
| PATCH | `/api/leads/:id/stage` | Move a lead through the pipeline |
| GET, POST | `/api/customers` | List or create customers |
| GET, PUT, DELETE | `/api/customers/:id` | Read, update, or delete a customer |
| POST | `/api/customers/:id/contacts` | Add a customer contact |
| POST | `/api/customers/:id/purchases` | Add a purchase |
| POST | `/api/customers/:id/notes` | Add a meeting note |
| GET | `/api/dashboard` | Return dashboard metrics and chart data |

## Development Commands

### Backend

```powershell
cd backend_django
python manage.py check
python manage.py makemigrations
python manage.py migrate
python manage.py test
```

### Frontend

```powershell
cd frontend
npm run build
npm run preview
```

## Configuration

Development defaults are defined in `backend_django/crm_django/settings.py`. Before deployment, move these values to environment variables:

- Django `SECRET_KEY`
- Database connection
- JWT configuration
- Allowed hosts
- CORS origins

The local SQLite database is intentionally excluded from version control by `.gitignore`. Use migrations and `seed_demo` to initialize a development database.

### Vercel frontend and Render API

For a split deployment, set these environment variables:

- **Vercel** (`frontend` project): `VITE_API_BASE_URL=https://crm-system-1pxk.onrender.com/api`
- **Render** (Django service): `DJANGO_ALLOWED_HOSTS=crm-system-1pxk.onrender.com`
- **Render** (Django service): `CORS_ALLOWED_ORIGINS=https://crmsystem-gray.vercel.app`

Set the Vercel variable for the Production environment (and Preview if needed), then redeploy Vercel because Vite embeds `VITE_` variables at build time. Set the Render variables before redeploying its service. For Vercel preview deployments, add each preview URL you use to `CORS_ALLOWED_ORIGINS` as a comma-separated origin. Confirm `https://crm-system-1pxk.onrender.com/api/health` returns `{"status":"ok"}` before testing registration. The frontend can use `/api` as a same-origin fallback for local development.

In the Render service settings, set **Start Command** to:

```text
python manage.py migrate --noinput && python manage.py seed_demo && python manage.py collectstatic --noinput && gunicorn crm_django.wsgi:application --bind 0.0.0.0:$PORT
```

The seed command creates a separate demo organization and skips if that demo organization already exists, so it can seed an existing database without mixing organizations. Demo credentials are publicly documented in this README, so treat this as sample data only and use a persistent production database for real customer data.

## Security Notes

Before production deployment:

1. Replace the development secret key and demo credentials.
2. Set `DEBUG = False`.
3. Configure `ALLOWED_HOSTS` and explicit CORS origins.
4. Use HTTPS and secure cookie/token transport policies.
5. Add rate limiting, structured logging, and production monitoring.
6. Use PostgreSQL or another production database for multi-user workloads.
7. Add automated tests for authentication, authorization, CRUD operations, and organization isolation.

## Verification

The project has been locally verified with:

- `python manage.py check`
- Django migrations and demo seeding
- Django API health, login, registration, dashboard, lead, and customer requests
- `npm run build`
- Frontend development server at `http://127.0.0.1:5173`

## License

No license has been specified for this project yet.
# CRM System

Full-stack customer relationship management application for managing sales leads, customers, team members, and performance metrics.

The backend is Django REST Framework. The active application code is split between `backend_django/` and `frontend/`.

## Current Functionality

- Public account creation: creates a new organization and its first admin account.
- Sign in with JWT authentication and persistent browser sessions.
- Role-based access for administrators, sales managers, and sales executives.
- Lead pipeline with six stages: New, Contacted, Qualified, Proposal Sent, Won, and Lost.
- Lead search, stage filtering, assignee filtering, create, edit, stage changes, and delete.
- Customer search, status filtering, create, edit, delete, and detail pages.
- Customer contacts, purchases, and meeting notes.
- Dashboard KPIs, revenue charts, monthly sales, recent leads, and team performance.
- Admin organization settings and team-member management.

## Access Rules

| Role | Access |
|---|---|
| Sales Executive | Own assigned leads and customers, personal dashboard, create records assigned to self |
| Sales Manager | Organization leads and customers, team performance, record assignment |
| Admin | Everything above, organization settings, and user management |

The public registration form creates an isolated organization and assigns the registering user the `admin` role. Admins can then create additional team members from **Administration > Add User**.

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Recharts, React Router, lucide-react
- Backend: Django 5, Django REST Framework, Simple JWT, django-cors-headers
- Database: local SQLite file at `backend_django/crm_django.sqlite3`

## Requirements

- Python 3.11 or newer
- Node.js 18 or newer for the React frontend
- npm 10 or newer is recommended.
- Ports `8000` and `5173` available locally.

## Run Locally

Open two terminals from the repository root.

### Terminal 1: Django Backend

```powershell
cd backend_django
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 127.0.0.1:8000
```

The API is available at `http://localhost:8000`. Confirm it is running:

```powershell
Invoke-RestMethod http://localhost:8000/api/health
```

### Terminal 2: Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in a browser. Vite proxies `/api` requests to Django on port 8000.

To use bash instead of PowerShell, the equivalent commands are:

```bash
cd backend_django && python -m pip install -r requirements.txt && python manage.py migrate && python manage.py seed_demo && python manage.py runserver 127.0.0.1:8000
cd frontend && npm install && npm run dev
```

## Demo Accounts

The first backend start seeds the following accounts. All use `password123`.

| Role | Email |
|---|---|
| Admin | `admin@crm.com` |
| Sales Manager | `manager@crm.com` |
| Sales Executive | `john@crm.com` |
| Sales Executive | `emily@crm.com` |

For a clean demo database, stop Django, delete `backend_django/crm_django.sqlite3`, then run `python manage.py migrate` and `python manage.py seed_demo` again.

## Account Creation

From the login page, select **Create an account**, then provide:

- Your name
- Organization name
- Email address
- Password with at least eight characters

The API endpoint is `POST /api/auth/register`. It returns a JWT and signs the new user in immediately. Email addresses are normalized to lowercase and duplicate addresses return HTTP `409`.

## API Reference

All endpoints except health, login, and registration require `Authorization: Bearer <token>`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Server health check |
| POST | `/api/auth/register` | Create organization and first admin |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Get current user |
| GET/POST | `/api/auth/users` | List or create users; admin only |
| PUT/DELETE | `/api/auth/users/:id` | Update or delete a user; admin only |
| GET/PUT | `/api/organization` | Read or update organization; admin only |
| GET/POST | `/api/leads` | List or create leads |
| GET/PUT/DELETE | `/api/leads/:id` | Read, update, or delete a lead |
| PATCH | `/api/leads/:id/stage` | Move a lead between pipeline stages |
| GET/POST | `/api/customers` | List or create customers |
| GET/PUT/DELETE | `/api/customers/:id` | Read, update, or delete a customer |
| POST | `/api/customers/:id/contacts` | Add a customer contact |
| POST | `/api/customers/:id/purchases` | Add a purchase |
| POST | `/api/customers/:id/notes` | Add a meeting note |
| GET | `/api/dashboard` | Get dashboard KPIs and chart data |

## Useful Development Commands

```powershell
# Frontend type-check and production build
cd frontend
npm run build

# Serve the built frontend locally
npm run preview

# Check Django configuration
cd ../backend_django
python manage.py check

# Create and apply migrations after model changes
python manage.py makemigrations
python manage.py migrate

# Run Django tests
python manage.py test
```

The backend currently has no automated test script. A practical smoke test is:

```powershell
Invoke-RestMethod http://localhost:8000/api/health
$login = Invoke-RestMethod http://localhost:8000/api/auth/login -Method Post -ContentType 'application/json' -Body '{"email":"admin@crm.com","password":"password123"}'
$headers = @{ Authorization = "Bearer $($login.token)" }
Invoke-RestMethod http://localhost:8000/api/dashboard -Headers $headers
Invoke-RestMethod http://localhost:8000/api/leads -Headers $headers
Invoke-RestMethod http://localhost:8000/api/customers -Headers $headers
```

## Verification Status

Verified locally on September 21, 2026:

- Frontend `npm run build`: passes.
- Django migrations, seed command, and `manage.py check`: pass on Python 3.11.9.
- Django backend startup: passes on `http://127.0.0.1:8000`.
- Health endpoint: passes.
- Seeded admin login: passes.
- Authenticated dashboard, leads, and customers reads: pass.
- New account creation and `/api/auth/me`: pass.
- Duplicate account protection: returns `409`.
- Frontend build emits a bundle-size warning because the main JavaScript chunk is over 500 kB.

## Recommended Improvements

1. Move Django `SECRET_KEY`, JWT settings, database URL, and CORS origins to environment variables.
2. Add request validation with a schema library such as Zod or Joi, including numeric bounds and email validation.
3. Restrict `assigned_to` to users in the current organization and enforce allowed roles server-side.
4. Add automated backend tests for authentication, role permissions, CRUD, and organization isolation.
5. Add frontend error boundaries and visible error states for failed data loads and saves.
6. Add pagination and indexes for larger lead and customer datasets.
7. Split the frontend bundle with route-level lazy loading and configure Vite `manualChunks`.
8. Add rate limiting, security headers, structured logging, and production CORS allowlists.
9. Replace demo passwords and seed data before deploying.
10. Use a production database and migration process instead of a local SQLite file for multi-user deployments.

## Project Structure

```text
backend_django/
    manage.py                 Django management entry point
    crm_django/settings.py    Django configuration
    crm_api/models.py         CRM database models
    crm_api/views.py          REST API views
    crm_api/serializers.py    JSON serializers
    crm_api/management/       Demo seed command
frontend/
    src/api.ts                Typed API client
    src/context/AuthContext.tsx  Auth state and token lifecycle
    src/pages/                Application screens
    src/components/           Layout and shared form/UI components
```
