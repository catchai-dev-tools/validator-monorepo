# Validator Monorepo

This monorepo contains a backend API (Node.js/Express/TypeORM/PostgreSQL) and a frontend admin UI (React + Refine + MUI) for managing a data validation platform. Document Types are first-class and drive the main navigation. Users manage rules, rule sets, bulk files and validation runs. Validation run summaries are stored in the database; detailed results are stored as files (e.g., object storage like MinIO/S3) to avoid overloading the relational database.

## Repository Structure

- `backend/` — Node.js API (Express + TypeORM + Postgres)
- `frontend/` — React + Refine + MUI admin UI

---

## Prerequisites

- Node.js 18+
- Yarn (Classic) 1.22+
- PostgreSQL 12+

Optional (for file/object storage):
- MinIO/S3 or compatible object storage for large validation result files

---

## First-Time Database Setup

These steps apply to the whole project (backend and any future frontend that relies on this API). Use either psql inside your Docker container or any Postgres client.

1. **Create a dedicated database (and optional user):**
   - Using Docker container name `pgrest-db` from your compose:
   ```bash
   docker exec -it pgrest-db psql -U appuser -d postgres -c "CREATE DATABASE validation_db;"
   # Optional: create isolated user
   docker exec -it pgrest-db psql -U appuser -d postgres -c "CREATE USER validator_user WITH PASSWORD 'StrongPassword123!';"
   docker exec -it pgrest-db psql -U appuser -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE validation_db TO validator_user;"
   docker exec -it pgrest-db psql -U appuser -d validation_db -c "ALTER SCHEMA public OWNER TO validator_user;"
   ```
_
2. **Configure environment (.env at project root):**
   ```env
   PORT=3000
   NODE_ENV=development

   DB_HOST=192.168.10.108
   DB_PORT=5432
   DB_USERNAME=validator_user   # or appuser
   DB_PASSWORD=StrongPassword123!
   DB_NAME=validation_db
   ```

3. **Install dotenv (already added) and run migrations:**
   ```bash
   yarn typeorm migration:run -d src/data-source.ts
   ```
   This will also ensure the `uuid-ossp` extension exists.

4. **Create a default admin user (via API):**
   ```bash
   curl -X POST http://localhost:3000/api/users \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "ChangeMe123!",
       "role": "admin"
     }'
   ```

### Reset or start fresh

- Truncate tables (keeps schema):
  ```bash
  docker exec -it pgrest-db psql -U appuser -d validation_db -c "TRUNCATE \"ValidationRuns\", \"RuleSet_Rules\", \"RuleSets\", \"Rules\", \"BulkFiles\", \"Users\", \"DocumentTypes\" RESTART IDENTITY CASCADE;"
  ```

- Drop and recreate schema (dangerous, full reset):
  ```bash
  docker exec -it pgrest-db psql -U appuser -d validation_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
  yarn typeorm migration:run -d src/data-source.ts
  ```

- Dump and restore (backup/restore):
  ```bash
  # Dump
  pg_dump -h 192.168.10.108 -U appuser -d validation_db -Fc -f validation_db.dump
  # Restore
  pg_restore -h 192.168.10.108 -U appuser -d validation_db -c validation_db.dump
  ```

## Documentation Layout

- Root `README.md` (this file): cross-cutting topics such as project overview, database setup, and environment.
- `backend/README.md`: backend-specific details (API endpoints, running the server, Swagger docs).
- `frontend/README.md`: frontend-specific notes (build/run, environment, integration). If not present, it will be added as the frontend evolves.

---

## Backend Setup (`backend/`)

1. Install dependencies

```bash
# from repo root
cd backend
yarn install
```

2. Configure environment

Copy the example and adjust values:

```bash
cp .env.example .env
```

Important variables in `.env`:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `PORT` (default 3000)
- `NODE_ENV` (`development` enables TypeORM synchronize)
- `JWT_SECRET` (set a strong secret in non-dev)
- `UPLOAD_PATH` (default `./uploads`) – local directory to store uploaded files

3. Prepare the database

Create a Postgres database (or use an existing one):

```sql
CREATE DATABASE validation_db;
```

4. Run the API (development)

```bash
yarn dev
```

This starts the server at `http://localhost:3000`.

5. API docs and health

- OpenAPI JSON: `http://localhost:3000/openapi.json`
- Swagger UI: `http://localhost:3000/api-docs`
- Health: `http://localhost:3000/health`


Alternatively, you can create via API:

```bash
curl -X POST http://localhost:3000/api/users \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"admin","role":"admin"}'
```

7. Auth and uploads

- Login: `POST /api/auth/login` → `{ token, user }`
- Current user: `GET /api/auth/me`
- Upload file: `POST /api/uploads` (multipart/form-data, field name `file`)
- Uploaded files served from: `http://localhost:3000/uploads/<filename>`

8. Core resources (CRUD)

- Users: `/api/users`
- Document Types: `/api/document-types` (+ `PATCH /:id/complete`)
- Bulk Files: `/api/bulk-files`, `/api/document-types/:documentTypeId/bulk-files`, `PATCH /bulk-files/:id/ingestion-status`
- Rules: `/api/rules`
- Rule Sets: `/api/rule-sets`, `/api/document-types/:documentTypeId/rule-sets`, `/api/document-types/:documentTypeId/rule-sets/latest`, `POST/DELETE /rule-sets/:id/rules`
- Validation Runs: `/api/validation-runs` (+ status/state updates, accept, stats)

Notes:
- Validation result detail files (record/field-level) are referenced by URL in `ValidationRun` (`recordSummaryReportUrl`, `fieldDetailReportUrl`). The DB stores only summary JSON, not detailed rows.

---

## Frontend Setup (`frontend/`)

1. Install dependencies

```bash
# from repo root
cd frontend
yarn install
```

2. Configure environment (optional if using defaults)

Create `frontend/.env.local` with the API URL:

```bash
VITE_API_URL=http://localhost:3000
```

3. Run the UI (development)

```bash
yarn dev
```

This starts the app at `http://localhost:5173` and proxies API requests to the backend.

4. Login

Navigate to `http://localhost:5173/login` and sign in with your admin credentials (e.g., `admin@test.com` / `admin`).

5. UI Highlights

- Top-level Document Type tabs populated from `/api/document-types`.
- Users, Document Types, Bulk Files, Rules, Rule Sets, Validation Runs pages use MUI DataGrid.
- Rules include a YAML editor with a Prettify action.
- For Bulk Files, you can upload a local file via `/api/uploads` and then set the returned URL when creating a Bulk File entry.

---

## Large Validation Results (MinIO/S3)

- Validation detail results (record-level and field-level) are stored as files (CSV/JSONL) in object storage (e.g., MinIO). The API stores only summary info.
- Planned: endpoints to stream/paginate large files for in-app viewing with server-side pagination/filters.
- Configuration for MinIO/S3 (to be added): environment keys and SDK usage for secure signed URL access or server-side streaming.

---

## Development Notes

- Backend uses TypeORM `synchronize` in development. For production use migrations.
- Keep frontend and backend code strictly separated in their folders.
- JWT secrets and DB credentials should be set via environment variables; never commit secrets.

---

## Scripts Quick Reference

Backend (`backend/`):
- `yarn dev` — start API with hot reload
- `yarn build` — build TypeScript to `dist/`
- `yarn start` — run compiled server

Frontend (`frontend/`):
- `yarn dev` — start Vite dev server
- `yarn build` — build static assets
- `yarn preview` — preview production build

---

## Troubleshooting

- If you see TypeScript errors about Node types, ensure `@types/node` is installed (already included in both projects) and your editor uses the workspace TypeScript version.
- Ensure Postgres is reachable with the credentials defined in `.env`.
- If uploads fail, check that `UPLOAD_PATH` exists or that the process can create it, and that the server is serving `/uploads` statically.
