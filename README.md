# ALFRED — Modular Desktop Productivity Workspace (Phase 1 Foundation)

ALFRED is a modular Windows desktop productivity workspace inspired by JARVIS. ALFRED is not a monolithic dashboard; it acts as a host environment that supports independently developed tools and modules (e.g. TempoFlow, To-Do, Bitcoin Monitor, Weather, Notes) via a standardized module compatibility contract.

The repository also contains the standalone web application **TempoFlow** and its full test suite, preserved in parallel.

---

## Architecture Overview

ALFRED maintains a strict separation of concerns across four layers:

1. **Electron Main Process (`electron/main.cjs`):**
   - Creates and manages application windows.
   - Lifecycle management (`whenReady`, `window-all-closed`, `activate`).
   - Hardened security configuration: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`.
   - IPC communication handlers for window actions and system details with parameter validation.
   - Restricts unvetted navigation and external window popups.

2. **Preload Script (`electron/preload.cjs`):**
   - Securely bridges Electron IPC to the renderer via `contextBridge.exposeInMainWorld('alfredAPI', ...)`.
   - Exposes only explicit, safe window control primitives (`isElectron`, `minimizeWindow`, `maximizeWindow`, `closeWindow`, `getAppInfo`).
   - Prevents unrestricted Node.js and IPC access from frontend components.

3. **React Renderer & Dashboard (`src/`):**
   - Built with React and Vite using plain JavaScript (ESM) and vanilla CSS (no Tailwind, no Redux).
   - Futuristic dark JARVIS-inspired aesthetic with CSS custom properties (`src/styles/variables.css`).
   - **Header (`src/components/Header.jsx`):** ALFRED branding, live digital clock, current date, time-based dynamic greeting ("Good morning / afternoon / evening"), operational status indicators, and settings launcher.
   - **Module Launcher (`src/components/ModuleLauncher.jsx`):** Subsystem overview displaying registered tools with active badges and one-click "+ Open" / "Hide" toggling.
   - **Widget Container Area (`src/components/WidgetContainer.jsx`):** Grid layout housing active tool widgets with headers, category tags, and close controls.
   - **Empty State (`src/components/EmptyState.jsx`):** Displays helpful guidance when no modules are active.
   - **Settings Modal (`src/components/SettingsModal.jsx`):** Allows users to configure call sign / user name, 12h/24h time format, and clock seconds.
   - **Persistence Service (`src/services/storage.js`):** Lightweight LocalStorage service persisting active modules and user preferences across reloads.

4. **Module Compatibility Contract & Demonstration Module (`src/modules/`):**
   - **Contract Specification (`src/modules/registry.js`):** Standard schema defining module ID, title, description, category, dimensions, and compatibility flags (`canBeWidget`, `canBeWindow`).
   - **Demonstration Module — Precision Chrono (`src/modules/demo-clock/`):**
     - Module ID: `demo-clock`
     - Independent component (`DemoClock.jsx`) and isolated stylesheet (`demo-clock.css`).
     - Features 12h/24h toggle, seconds toggle, UTC conversion mode, and widget uptime session counter.
     - Can be removed from the dashboard without affecting ALFRED and reopened at any time via the launcher.

---

## Project Structure

```
├── electron/
│   ├── main.cjs                # Electron main process
│   └── preload.cjs             # Hardened contextBridge preload
├── src/
│   ├── index.html              # Vite HTML template
│   ├── main.jsx                # React root mount
│   ├── App.jsx                 # Dashboard coordinator
│   ├── components/
│   │   ├── Header.jsx          # Branding, greeting, live clock & date
│   │   ├── ModuleLauncher.jsx  # Subsystem module activator
│   │   ├── WidgetContainer.jsx # Frame container for active widgets
│   │   ├── EmptyState.jsx      # Placeholder when no widgets are open
│   │   └── SettingsModal.jsx   # Call sign & clock preferences modal
│   ├── modules/
│   │   ├── registry.js         # Module compatibility contract & registry
│   │   ├── components.jsx      # Dynamic component resolver
│   │   └── demo-clock/
│   │       ├── DemoClock.jsx   # Demonstration module
│   │       └── demo-clock.css  # Isolated module styles
│   ├── services/
│   │   └── storage.js          # LocalStorage persistence service
│   └── styles/
│       ├── variables.css       # Theme tokens (JARVIS dark palette)
│       ├── global.css          # Reset, scrollbars, base styles
│       └── dashboard.css       # Layout, header, launcher, modal styles
├── tests/
│   ├── test_alfred_registry.mjs # Contract validator & registry tests
│   ├── test_alfred_storage.mjs  # Preferences & widget state persistence tests
│   ├── verify_electron.cjs      # Electron headless verification harness
│   ├── test_timer.js            # TempoFlow TimerEngine unit tests
│   ├── test_scheduler_stats.js  # TempoFlow Scheduler & Stats unit tests
│   └── test_custom_studio.js    # TempoFlow Custom Studio unit tests
├── vite.config.js              # Vite build configuration
├── package.json                # Project dependencies & scripts
├── netlify.toml                # Static deployment configuration
└── js/, css/, index.html       # Standalone TempoFlow web app
```

---

## Running ALFRED Locally

### Prerequisites
- Node.js (v18+ or v22+)
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
Start Vite dev server:
```bash
npm run dev
```

### 3. Build Production Bundle
Build the React renderer bundle into `dist/`:
```bash
npm run build
```

### 4. Run Electron Desktop App
```bash
npm start
```

### 5. Run Automated Tests
Execute all unit tests (ALFRED registry & storage tests alongside TempoFlow tests):
```bash
npm test
```

### 6. Verify Electron Headless (Linux / CI)
```bash
xvfb-run -a ./node_modules/.bin/electron tests/verify_electron.cjs
```
