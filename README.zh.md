# 🍜 苍穹外卖 - 管理端

**[English](./README.md)** — 切换至英文

**苍穹外卖**（Firmament Takeaway）平台的后台管理系统。基于 React 19、TypeScript 和 Tailwind CSS 构建，提供订单管理、菜品管理、套餐管理、分类管理、员工管理及实时订单通知等完整的后台运营解决方案。

---

## 📋 目录

- [✨ 功能特性](#-功能特性)
- [🖼️ 截图预览](#️-截图预览)
- [🚀 在线演示](#-在线演示)
- [🛠️ 技术栈](#️-技术栈)
- [📁 项目结构](#-项目结构)
- [⚡ 前置要求](#-前置要求)
- [💻 本地开发](#-本地开发)
- [🐳 Jenkins 与 Docker](#-jenkins-与-docker)
- [🤝 贡献指南](#-贡献指南)
- [📝 开源协议](#-开源协议)

---

## ✨ 功能特性

- **📊 数据看板** — 实时经营概览，展示核心指标、订单趋势和营收统计，基于 ECharts 数据可视化
- **📈 统计分析** — 详细的销售分析、营业额报表和用户行为洞察
- **📦 订单管理** — 查看、筛选和管理客户订单，支持状态追踪和 WebSocket 实时通知
- **🍱 套餐管理** — 创建和管理组合套餐，支持定价和菜品绑定
- **🍽️ 菜品管理** — 菜单项的增删改查，支持图片上传、定价和分类
- **🏷️ 分类管理** — 将菜品组织到不同分类，便于菜单导航
- **👥 员工管理** — 管理员工账号，支持基于角色的访问控制
- **🔔 实时通知** — 基于 WebSocket 的即时订单提醒和状态更新
- **🌙 现代化 UI** — 基于 shadcn/ui 组件构建，Tailwind CSS 响应式设计
- **🔒 路由守卫** — 认证保护和 404 页面处理

---

## 🖼️ 截图预览

> 🚧 截图即将补充。欢迎访问 [在线演示](https://firmament-admin.kaiwen.dev) 体验完整功能！

---

## 🚀 在线演示

**访问地址：** https://firmament-admin.kaiwen.dev

### 登录信息

| 字段   | 值       |
|--------|----------|
| 账号   | `admin`  |
| 密码   | `123456` |

---

## 🛠️ 技术栈

### 核心框架

| 技术       | 版本    | 说明         |
|------------|---------|--------------|
| React      | ^19.2.0 | UI 库        |
| TypeScript | ~5.9.3  | 静态类型     |
| Vite       | ^7.2.4  | 构建工具     |

### 路由管理

| 技术             | 版本    | 说明         |
|------------------|---------|--------------|
| React Router DOM | ^7.11.0 | 单页路由     |

### UI 组件

| 技术          | 版本      | 说明                        |
|---------------|-----------|-----------------------------|
| shadcn/ui     | latest    | 基于 Radix UI + Tailwind    |
| Tailwind CSS  | ^4.1.18   | 原子化 CSS 框架             |
| lucide-react  | ^0.562.0  | 图标库                      |

### 数据可视化

| 技术              | 版本    | 说明            |
|-------------------|---------|-----------------|
| ECharts           | ^6.0.0  | 图表库          |
| echarts-for-react | ^3.0.5  | React 封装      |

### HTTP 请求

| 技术   | 版本     | 说明                     |
|--------|----------|--------------------------|
| Axios  | ^1.13.2  | HTTP 客户端（含拦截器）  |

### 开发工具

| 技术                     | 版本     | 说明                 |
|--------------------------|----------|----------------------|
| ESLint                   | ^9.39.1  | 代码检查             |
| TypeScript ESLint        | ^8.46.4  | TypeScript 规则      |
| @vitejs/plugin-react-swc | ^4.2.2   | SWC 快速热更新       |
| tw-animate-css           | ^1.4.0   | Tailwind 动画工具    |

---

## 📁 项目结构

```
src/
├── api/          # API 接口模块（按领域封装的 axios）
├── assets/       # 静态资源（图片、音频等）
├── components/   # 公共组件（布局、shadcn/ui）
├── hooks/        # 自定义 Hooks（如 WebSocket）
├── lib/          # 内部工具（cn 辅助函数等）
├── pages/        # 页面级组件
│   ├── Dashboard.tsx    # 📊 数据看板
│   ├── Statistics.tsx   # 📈 统计分析
│   ├── Order.tsx        # 📦 订单管理
│   ├── Setmeal.tsx      # 🍱 套餐管理
│   ├── Dish.tsx         # 🍽️ 菜品管理
│   ├── Category.tsx     # 🏷️ 分类管理
│   ├── Employee.tsx     # 👥 员工管理
│   └── Login.tsx        # 🔐 登录认证
├── router.tsx    # 路由配置
└── utils/        # 工具函数（导航、上传等）
public/           # 公共静态文件
```

---

## ⚡ 前置要求

- **Node.js** ^20.19.0 或 >=22.12.0（推荐 Node.js 24.x LTS）
- **npm** >= 9（通常随 Node.js 一起安装）

检查版本：

```bash
node --version
npm --version
```

---

## 💻 本地开发

### 🔧 安装

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/firmament-take-out-admin.git

# 2. 进入项目目录
cd firmament-take-out-admin

# 3. 安装依赖
npm install
```

### ⚙️ 配置

开发服务器默认将 `/api` 路径代理到 `http://localhost:8080`（配置在 `vite.config.ts` 中）。如果后端运行在其他地址或端口，请在启动开发服务器前修改 `target` 值。

### ▶️ 运行项目

```bash
npm run dev
```

在浏览器中访问 **http://localhost:5173**。

### 📜 可用脚本

| 命令              | 说明                        |
|-------------------|-----------------------------|
| `npm run dev`     | 启动开发服务器              |
| `npm run dev-host`| 启动开发服务器并暴露到局域网|
| `npm run build`   | 类型检查并构建生产版本      |
| `npm run preview` | 本地预览生产构建            |
| `npm run lint`    | 运行 ESLint                 |
| `npm run sonar`   | 运行 SonarQube 分析         |

---

## 🐳 Jenkins 与 Docker

项目使用 Docker 容器化部署，通过 Jenkins 实现自动化 CI/CD。

### 自动化部署

每次推送代码都会触发 Jenkins 流水线（`Jenkinsfile`）：

| 阶段                    | 执行条件          |
|-------------------------|-------------------|
| 1. 拉取代码             | 始终执行          |
| 2. 代码检查             | 始终执行          |
| 3. 构建项目             | 始终执行          |
| 4. 构建 Docker 镜像     | PR 构建跳过       |
| 5. SSH 部署到服务器     | 仅 main 分支      |

### 部署相关文件

- **Dockerfile** — 多阶段构建，nginx 提供静态文件服务
- **deploy/nginx/admin.conf.tpl** — nginx 配置模板（后端地址通过环境变量配置）
- **deploy/nginx/docker-entrypoint.d/99-envsubst.sh** — 容器启动时替换环境变量
- **Jenkinsfile** — Jenkins 流水线定义（Kubernetes agent，Node 24 + Docker）

### 手动部署

```bash
# 构建镜像
docker build -t firmament-admin:latest .

# 运行容器
docker run -d \
  --name firmament-admin \
  --restart unless-stopped \
  -p 80:80 \
  -e FIRMAMENT_SERVER_HOST=your-backend-host \
  -e FIRMAMENT_SERVER_PORT=your-backend-port \
  firmament-admin:latest
```

根据实际后端服务调整 `FIRMAMENT_SERVER_*`。

---

## 🤝 贡献指南

欢迎提交贡献！🎉

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 创建 Pull Request

提交 PR 前请确保运行 `npm run lint` 检查代码。

---

## 📝 开源协议

本项目基于 **MIT License** 开源。

---

Made with ❤️ by [Kaiwen Yao](https://github.com/kaiwenyao). Happy coding! 🚀
