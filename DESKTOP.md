# Procura Desktop (Windows)

## Install / update
- Download `Procura-Setup-x.y.z.exe` from the repository's **Releases** page and install it.
- Every push to `main` builds a new version and publishes it as a Release. The installed app checks for updates
  and asks you to restart when one has downloaded. Your data is kept. (The Portable .exe cannot self-update.)

## Where the data lives
All records are stored in a local SQLite database: `%APPDATA%\Procura\procura.db`
(one row per record: requests, tenders, bids, purchase orders, deliveries, payments, users, audit log).
It survives restarts and updates. Use Settings > "Download JSON Backup" to export, or copy the .db file.

## Accounts and passwords
- Passwords are salted PBKDF2-SHA256 hashes. Plain-text passwords are never stored or logged.
- Demo accounts (after "Load Demo Data") all use the password `Procura@2026`.
- 5 wrong sign-in attempts lock that account for 5 minutes. Password policy: 8+ characters with letters and a number.
- New staff get a temporary password from the Organization Admin and must change it at first sign-in.

## Develop
    npm install --legacy-peer-deps
    npm run desktop          # build + open the desktop app
    npm run dist:win         # build installer locally (Windows)

## Automated checks (tools/)
Run with `xvfb-run -a npx electron tools/<file> --no-sandbox` after `npm run build:desktop`:
`audit-main.cjs` (every role, every screen), `award-e2e.cjs` (high-value award -> Authority -> PO),
`pdf-test.cjs` (single Print/Save PDF), `persist-test.cjs`, and `auth-e2e.cjs` (needs `VITE_E2E=1` build).


## Defense-readiness checks

The unit tests run with `npm test` before the Windows packaging step in the release workflow. Run the checks locally after installing dependencies:

| Check | Command | Current agent run |
|---|---|---|
| Dependency install | `npm install --legacy-peer-deps` | Not run: this environment cannot resolve `github.com` for checkout/dependency access |
| TypeScript | `npx tsc --noEmit` | Not run |
| Unit tests | `npm test` | Added; not run here |
| Desktop build | `npm run build:desktop` | Not run |
| Electron UI / award / PDF tests | `xvfb-run -a npx electron tools/audit-main.cjs --no-sandbox`, `tools/award-e2e.cjs`, `tools/pdf-test.cjs` | Not run; Electron/Xvfb execution is unavailable in this environment |

These are **not passing results**. Confirm the commands and the release workflow on a machine/runner with dependencies installed before treating the build as defense-ready.
