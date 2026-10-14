# Procura Desktop (Windows)

## Install / update
- Download `Procura-Setup-x.y.z.exe` from the repository's **Releases** page and install it.
- Every push to `main` builds a new version and publishes it as a Release. The installed app checks for updates
  and asks you to restart when one has downloaded. Your data is kept. (The Portable .exe cannot self-update.)

## Offline operation
- Fraunces and Manrope are bundled from local Fontsource packages; the UI does not load Google Fonts over the network.
- Core procurement, authentication, storage, and reporting work from the local SQLite database without a backend server.

## Where the data lives
All records are stored in a local SQLite database: `%APPDATA%\Procura\procura.db`
(one row per record: requests, tenders, bids, purchase orders, deliveries, payments, users, audit log).
It survives restarts and updates. Use Settings > "Download JSON Backup" for a JSON snapshot, or copy the .db file for a complete point-in-time backup. JSON snapshots omit bid data that is confidential until closing and are refused on restore while redacted; JSON restore never replaces existing audit history.

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

| Check | Command | GitHub Actions run #9 (14 Oct 2026) |
|---|---|---|
| Dependency install | `npm install --legacy-peer-deps` | PASS |
| TypeScript | `npx tsc --noEmit` | PASS |
| Unit tests | `npm test` | PASS (23 tests) |
| Desktop build | `npm run build:desktop` | PASS |
| Electron role and screen audit | `xvfb-run -a npx electron tools/audit-main.cjs --no-sandbox` | PASS |
| Award approval workflow | `xvfb-run -a npx electron tools/award-e2e.cjs --no-sandbox` | PASS |
| PDF output | `xvfb-run -a npx electron tools/pdf-test.cjs --no-sandbox` | PASS |
| Authentication | `VITE_E2E=1 npm run build:desktop` then `xvfb-run -a npx electron tools/auth-e2e.cjs --no-sandbox` | PASS |
| SQLite persistence | `xvfb-run -a npx electron tools/persist-test.cjs run1 --no-sandbox`, then `run2` | PASS |

Full runner results: https://github.com/Jumanji1818/fyp/actions/runs/38610145395