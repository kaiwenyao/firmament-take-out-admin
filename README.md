# Firmament Takeaway — Admin Console

**[中文](./README.zh.md)** — Switch to Chinese

Web admin for the Firmament Takeaway (苍穹外卖) platform: dashboards, orders, dishes, set meals, categories, employees, and real-time order notifications.

## Demo

**URL:** https://firmament-admin.kaiwen.dev

### Demo credentials

- **Username:** `admin`
- **Password:** `123456`

## Tech stack

### Core

- **React** ^19.2.0 — UI library
- **TypeScript** ~5.9.3 — static typing
- **Vite** ^7.2.4 — dev server and production build

### Routing

- **React Router DOM** ^7.11.0 — SPA routing

### UI

- **shadcn/ui** — composable components on Radix UI and Tailwind CSS
- **Tailwind CSS** ^4.1.18 — utility-first styling
- **lucide-react** ^0.562.0 — icons

### Data visualization

- **ECharts** ^6.0.0 — charts
- **echarts-for-react** ^3.0.5 — React bindings for ECharts

### HTTP

- **Axios** ^1.13.2 — HTTP client (shared instance and interceptors in `src/api/request.ts`)

### Tooling

- **ESLint** ^9.39.1 — linting
- **TypeScript ESLint** ^8.46.4 — TypeScript rules for ESLint
- **@vitejs/plugin-react-swc** ^4.2.2 — fast React refresh with SWC
- **tw-animate-css** ^1.4.0 — Tailwind animation utilities

## Project layout

```
src/
├── api/          # API modules (axios wrappers per domain)
├── assets/       # Images, audio, etc.
├── components/   # Shared UI (layout, shadcn/ui)
├── hooks/        # Custom hooks (e.g. WebSocket)
├── lib/          # Internal utilities (cn helper, etc.)
├── pages/        # Route-level pages
├── router.tsx    # Route definitions
└── utils/        # Helpers (navigation, upload, …)
public/           # Static files served as-is
```

## Prerequisites

- **Node.js** ^20.19.0 or >=22.12.0 (Node.js 24.x LTS recommended)
- **npm** >= 9 (usually bundled with Node.js)

Check versions:

```bash
node --version
npm --version
```

## Local development

```bash
npm install
npm run dev
```

Open **http://localhost:5173**. API calls under `/api` are proxied in `vite.config.ts` to `http://localhost:8080` (both REST and WebSocket). If your backend runs on a different host or port, update the `target` values in `vite.config.ts` before starting the dev server.

Other scripts:

- `npm run build` — typecheck and production build
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint
- `npm run dev-host` — start dev server exposed on the local network
- `npm run sonar` — run SonarQube analysis

## Jenkins and Docker

The app is built as static assets and served with nginx inside Docker; CI/CD is automated with Jenkins.

### Automated deploy

The Jenkins pipeline (`Jenkinsfile`) runs on every push. Stage behaviour varies by context:

1. Pull code — always
2. Lint (`npm run lint`) — always
3. Build (`npm run build`) — always
4. Build Docker image and push to Docker Hub — skipped for PR builds
5. Deploy over SSH to the server — main branch only, non-PR

### Deploy-related files

- **Dockerfile** — multi-stage build; nginx serves the built frontend
- **deploy/nginx/admin.conf.tpl** — nginx template (backend host/port via env)
- **deploy/nginx/docker-entrypoint.d/99-envsubst.sh** — env substitution at container start
- **Jenkinsfile** — Jenkins pipeline definition (Kubernetes agent, Node 24 + Docker)

### Manual Docker run

```bash
docker build -t firmament-admin:latest .

docker run -d \
  --name firmament-admin \
  --restart unless-stopped \
  -p 80:80 \
  -e FIRMAMENT_SERVER_HOST=your-backend-host \
  -e FIRMAMENT_SERVER_PORT=your-backend-port \
  firmament-admin:latest
```

Adjust `FIRMAMENT_SERVER_*` to match your backend service.
