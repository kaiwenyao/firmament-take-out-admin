# 🍜 Firmament Takeaway — Admin Console

**[中文](./README.zh.md)** — Switch to Chinese

A modern, responsive web admin dashboard for the **Firmament Takeaway** (苍穹外卖) platform. Built with React 19, TypeScript, and Tailwind CSS, it provides a complete back-office solution for managing orders, dishes, set meals, categories, employees, and real-time order notifications.

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🖼️ Screenshots](#️-screenshots)
- [🚀 Demo](#-demo)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Layout](#-project-layout)
- [⚡ Prerequisites](#-prerequisites)
- [💻 Local Development](#-local-development)
- [🐳 Jenkins and Docker](#-jenkins-and-docker)
- [🤝 Contributing](#-contributing)
- [📝 License](#-license)

---

## ✨ Features

- **📊 Dashboard** — Real-time business overview with key metrics, order trends, and revenue statistics powered by ECharts
- **📈 Statistics** — Detailed sales analytics, turnover reports, and user activity insights
- **📦 Order Management** — View, filter, and manage customer orders with status tracking and real-time WebSocket notifications
- **🍱 Set Meal Management** — Create and manage combo meals with pricing and dish bundling
- **🍽️ Dish Management** — CRUD operations for menu items with images, pricing, and categorization
- **🏷️ Category Management** — Organize dishes into categories for easy menu navigation
- **👥 Employee Management** — Manage staff accounts with role-based access control
- **🔔 Real-time Notifications** — WebSocket-powered instant order alerts and status updates
- **🌙 Modern UI** — Built with shadcn/ui components, fully responsive design with Tailwind CSS
- **🔒 Route Guards** — Protected routes with authentication and 404 handling

---

## 🖼️ Screenshots

> 🚧 Screenshots will be added soon. Check out the [live demo](https://firmament-admin.kaiwen.dev) to see the app in action!

---

## 🚀 Demo

**URL:** https://firmament-admin.kaiwen.dev

### Demo credentials

| Field    | Value    |
|----------|----------|
| Username | `admin`  |
| Password | `123456` |

---

## 🛠️ Tech Stack

### Core

| Technology     | Version | Purpose                          |
|----------------|---------|----------------------------------|
| React          | ^19.2.0 | UI library                       |
| TypeScript     | ~5.9.3  | Static typing                    |
| Vite           | ^7.2.4  | Dev server and production build  |

### Routing

| Technology       | Version  | Purpose        |
|------------------|----------|----------------|
| React Router DOM | ^7.11.0  | SPA routing    |

### UI

| Technology    | Version   | Purpose                                       |
|---------------|-----------|-----------------------------------------------|
| shadcn/ui     | latest    | Composable components on Radix UI + Tailwind  |
| Tailwind CSS  | ^4.1.18   | Utility-first styling                         |
| lucide-react  | ^0.562.0  | Icons                                         |

### Data Visualization

| Technology       | Version | Purpose                 |
|------------------|---------|-------------------------|
| ECharts          | ^6.0.0  | Charts                  |
| echarts-for-react| ^3.0.5  | React bindings          |

### HTTP

| Technology | Version  | Purpose                                                |
|------------|----------|--------------------------------------------------------|
| Axios      | ^1.13.2  | HTTP client (shared instance & interceptors)           |

### Tooling

| Technology               | Version  | Purpose                        |
|--------------------------|----------|--------------------------------|
| ESLint                   | ^9.39.1  | Linting                        |
| TypeScript ESLint        | ^8.46.4  | TypeScript rules for ESLint    |
| @vitejs/plugin-react-swc | ^4.2.2   | Fast React refresh with SWC    |
| tw-animate-css           | ^1.4.0   | Tailwind animation utilities   |

---

## 📁 Project Layout

```
src/
├── api/          # API modules (axios wrappers per domain)
├── assets/       # Images, audio, etc.
├── components/   # Shared UI (layout, shadcn/ui)
├── hooks/        # Custom hooks (e.g. WebSocket)
├── lib/          # Internal utilities (cn helper, etc.)
├── pages/        # Route-level pages
│   ├── Dashboard.tsx    # 📊 Dashboard overview
│   ├── Statistics.tsx   # 📈 Sales analytics
│   ├── Order.tsx        # 📦 Order management
│   ├── Setmeal.tsx      # 🍱 Set meal management
│   ├── Dish.tsx         # 🍽️ Dish management
│   ├── Category.tsx     # 🏷️ Category management
│   ├── Employee.tsx     # 👥 Employee management
│   └── Login.tsx        # 🔐 Authentication
├── router.tsx    # Route definitions
└── utils/        # Helpers (navigation, upload, …)
public/           # Static files served as-is
```

---

## ⚡ Prerequisites

- **Node.js** ^20.19.0 or >=22.12.0 (Node.js 24.x LTS recommended)
- **npm** >= 9 (usually bundled with Node.js)

Check versions:

```bash
node --version
npm --version
```

---

## 💻 Local Development

### 🔧 Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/firmament-take-out-admin.git

# 2. Navigate to the project directory
cd firmament-take-out-admin

# 3. Install dependencies
npm install
```

### ⚙️ Configuration

The dev server proxies API calls under `/api` to `http://localhost:8080` (configured in `vite.config.ts`). If your backend runs on a different host or port, update the `target` values before starting the dev server.

### ▶️ Running the App

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

### 📜 Available Scripts

| Script            | Description                                    |
|-------------------|------------------------------------------------|
| `npm run dev`     | Start the development server                   |
| `npm run dev-host`| Start dev server exposed on the local network  |
| `npm run build`   | Type-check and create production build         |
| `npm run preview` | Preview the production build locally           |
| `npm run lint`    | Run ESLint                                     |
| `npm run sonar`   | Run SonarQube analysis                         |

---

## 🐳 Jenkins and Docker

The app is built as static assets and served with nginx inside Docker; CI/CD is automated with Jenkins.

### Automated Deploy

The Jenkins pipeline (`Jenkinsfile`) runs on every push:

| Stage                        | Condition              |
|------------------------------|------------------------|
| 1. Pull code                 | Always                 |
| 2. Lint (`npm run lint`)     | Always                 |
| 3. Build (`npm run build`)   | Always                 |
| 4. Build Docker image & push | Skipped for PR builds  |
| 5. Deploy over SSH           | Main branch only       |

### Deploy-related Files

- **Dockerfile** — Multi-stage build; nginx serves the built frontend
- **deploy/nginx/admin.conf.tpl** — Nginx template (backend host/port via env)
- **deploy/nginx/docker-entrypoint.d/99-envsubst.sh** — Env substitution at container start
- **Jenkinsfile** — Jenkins pipeline definition (Kubernetes agent, Node 24 + Docker)

### Manual Docker Run

```bash
# Build the image
docker build -t firmament-admin:latest .

# Run the container
docker run -d \
  --name firmament-admin \
  --restart unless-stopped \
  -p 80:80 \
  -e FIRMAMENT_SERVER_HOST=your-backend-host \
  -e FIRMAMENT_SERVER_PORT=your-backend-port \
  firmament-admin:latest
```

Adjust `FIRMAMENT_SERVER_*` to match your backend service.

---

## 🤝 Contributing

Contributions are welcome! 🎉

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please make sure to run `npm run lint` before submitting a PR.

---

## 📝 License

This project is licensed under the **MIT License**.

---

Made with ❤️ by [Kaiwen Yao](https://github.com/kaiwenyao). Happy coding! 🚀
