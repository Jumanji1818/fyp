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
