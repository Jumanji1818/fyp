# Procura API (initial backend foundation)

This API is the first step in replacing browser-only state with a shared, persistent backend. It uses Node.js 22+, Express, PostgreSQL, bcrypt password hashes, database-backed opaque sessions, server-side role checks, organization-scoped queries, and an audit event table.

## Setup

1. Install Node.js 22.14 or newer and PostgreSQL.
2. Create a dedicated PostgreSQL database and application user.
3. Copy `.env.example` to `.env` and set `DATABASE_URL`, `FRONTEND_ORIGIN`, and `COOKIE_SECURE`.
4. From this directory run `npm install`.
5. For the first platform administrator only, configure a high-entropy `BOOTSTRAP_ADMIN_KEY`, call `POST /api/admin/bootstrap`, then remove the key from the deployment environment.
6. Apply the initial schema using `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/001_initial_schema.sql`.
7. Run `npm run dev`; health check is `GET http://localhost:4000/api/health`.

Never commit `.env` or production database credentials. Production deployments must use HTTPS and set `COOKIE_SECURE=true`.

## Initial endpoints

- `GET /api/health`
- `POST /api/admin/bootstrap` — creates the first Platform Admin only when `BOOTSTRAP_ADMIN_KEY` is configured; remove that secret after use.
- `POST /api/auth/register-organization` — creates an organization and admin account in pending approval state.
- `POST /api/auth/register-vendor` — creates a vendor profile and vendor login account.
- `GET /api/vendor/opportunities` — lists currently open tenders from active organizations without exposing competing vendor bids.
- `POST /api/vendor/bids` — submits a vendor bid to the tender-owning organization, validates the tender is open, and prevents a second bid from the same vendor.
- `POST /api/admin/organizations/:organizationId/approve` — Platform Admin-only organization approval.
- `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `POST /api/auth/change-password`
- `POST /api/auth/staff` — organization-admin-only staff provisioning.
- `GET /api/organizations/current`
- `GET /api/records/:recordType`, `POST /api/records`

Authentication uses an HttpOnly session cookie; session tokens are stored as SHA-256 digests in PostgreSQL. Passwords are bcrypt-hashed with cost 12. Authorization is checked by the API, not by UI visibility.

## Scope and limitations of this first increment

This is a backend foundation, not yet a complete application migration. Procurement records currently use a typed record envelope with JSONB payloads while organizations, departments, users, sessions, and audit events have relational tables. Full approval and procurement state machines, password recovery email delivery, CSRF protection for cross-site deployments, and the frontend's AppContext-to-API integration are subsequent required steps. Vendor registration and tender/bid API endpoints are present, but still need integration and end-to-end tests. Do not treat the existing localStorage demo as production-ready until those are completed and tested.