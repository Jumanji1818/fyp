# Procura

Procura is a procurement workflow application with web, desktop (Electron), and Android (Capacitor) targets.

## Frontend demo

Install dependencies and run the current UI:

```bash
npm ci
npm run dev
```

The current frontend still contains demo/local state. Do not use it as a production multi-user system until the API migration is completed.

## Backend foundation

A persistent PostgreSQL API is being built in `backend/`. See [backend/README.md](backend/README.md) for setup and current endpoint coverage.

```bash
npm run backend:install
npm run backend:build
npm run backend:test
npm run backend:dev
```

The API requires a configured PostgreSQL database. Copy `backend/.env.example` to `backend/.env`, set the connection string, and apply `backend/migrations/001_initial_schema.sql` before starting it. Never commit credentials.

## Development status

The backend is an in-progress migration, not yet connected to all frontend workflows. Do not deploy it as production-ready until approval state transitions, vendor flows, password recovery, CSRF protections, complete audit coverage, and end-to-end tests are implemented.