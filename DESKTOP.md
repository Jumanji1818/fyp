# Procura Desktop (Windows)

Run in development:   npm install --legacy-peer-deps && npm run desktop
Build the installer:  npm run dist:win     (output in /release: Setup .exe + portable .exe)
Or push to GitHub: the "Build Windows Desktop App" workflow produces both .exe files under Actions > Artifacts.

Data is stored per-PC in the app's own profile folder and survives restarts.
