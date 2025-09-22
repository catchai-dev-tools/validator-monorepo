# Frontend (Admin UI)

This directory will host the React-based admin UI for the Data Validation platform (planned stack: Vite + React + Refine + MUI).

## Overview

- Manage Document Types, Rules, Rule Sets, Bulk Files, and Validation Runs.
- Consume the backend API documented via Swagger at `/api-docs`.
- Use object storage (e.g., MinIO/S3) for large validation result files when needed.

## Prerequisites

- Node.js 18+
- Yarn 1.22+
- Backend API running (see repository root `README.md` for DB and backend setup)

## Getting Started

1. Install dependencies (once the project is scaffolded):

```bash
# from repo root
cd frontend
yarn install
```

2. Configure environment (optional):

Create `frontend/.env.local` with the API base URL.

```bash
VITE_API_URL=http://localhost:3000
```

3. Start the dev server:

```bash
yarn dev
```

This should start the UI (default Vite port is 5173). If you proxy API requests, ensure the proxy points to the backend API.

## Directory Structure (planned)

```
frontend/
  src/
    components/
    pages/
    hooks/
    services/
    routes/
    theme/
  public/
```

## API Integration

- The app will consume endpoints exposed by the backend: `GET/POST/PUT/DELETE /api/*`.
- For API discovery and manual testing, open `http://localhost:3000/api-docs`.

## Notes

- Database setup, migrations, default users, and reset procedures live in the repository root `README.md`.
- This README will evolve as the frontend is implemented.
