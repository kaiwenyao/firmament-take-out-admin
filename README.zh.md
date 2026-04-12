# 苍穹外卖 - 管理端

**[English](./README.md)** — 切换至英文

苍穹外卖平台的 Web 管理后台，涵盖数据看板、订单、菜品、套餐、分类、员工管理及实时订单通知。

## 演示网站

**访问地址：** https://firmament-admin.kaiwen.dev

### 登录信息

- **账号：** admin
- **密码：** 123456

## 技术栈

### 核心框架
- **React** ^19.2.0 - 用于构建用户界面的 JavaScript 库
- **TypeScript** ~5.9.3 - JavaScript 的超集，提供类型安全
- **Vite** ^7.2.4 - 下一代前端构建工具，提供快速的开发体验

### 路由管理
- **React Router DOM** ^7.11.0 - 用于单页应用的路由管理

### UI 组件库
- **shadcn/ui** - 基于 Radix UI 和 Tailwind CSS 的可复用组件系统
- **Tailwind CSS** ^4.1.18 - 实用优先的 CSS 框架
- **lucide-react** ^0.562.0 - 图标库

### 数据可视化
- **ECharts** ^6.0.0 - 强大的数据可视化图表库
- **echarts-for-react** ^3.0.5 - ECharts 的 React 封装

### HTTP 请求
- **Axios** ^1.13.2 - 基于 Promise 的 HTTP 客户端

### 开发工具
- **ESLint** ^9.39.1 - JavaScript/TypeScript 代码检查工具
- **TypeScript ESLint** ^8.46.4 - TypeScript 的 ESLint 插件
- **@vitejs/plugin-react-swc** ^4.2.2 - Vite 的 React SWC 插件
- **tw-animate-css** ^1.4.0 - Tailwind CSS 动画工具

## 项目结构

```
src/
├── api/          # API 接口定义
├── assets/       # 静态资源
├── components/   # 公共组件
├── hooks/        # 自定义 Hooks
├── lib/          # 内部工具（cn 辅助函数等）
├── pages/        # 页面组件
├── router.tsx    # 路由配置
└── utils/        # 工具函数
public/           # 公共静态文件
```

## 前置要求

- **Node.js** ^20.19.0 或 >=22.12.0（推荐 Node.js 24.x LTS）
- **npm** >= 9（通常随 Node.js 一起安装）

检查版本：

```bash
node --version
npm --version
```

## 本地调试

```bash
npm install
npm run dev
```

在浏览器中访问 **http://localhost:5173**。

`vite.config.ts` 中的开发代理默认将 `/api` 路径（REST 和 WebSocket）转发到 `http://localhost:8080`。如果后端运行在其他地址或端口，启动开发服务器前请先修改 `vite.config.ts` 中的 `target`。

其他脚本：

- `npm run build` — 类型检查并构建生产版本
- `npm run preview` — 本地预览生产构建
- `npm run lint` — 运行 ESLint
- `npm run dev-host` — 启动开发服务器并暴露到局域网
- `npm run sonar` — 运行 SonarQube 分析

## Jenkins 与 Docker

项目使用 Docker 容器化部署，通过 Jenkins 实现自动化 CI/CD。

### 自动化部署

每次推送代码都会触发 Jenkins 流水线（`Jenkinsfile`），各阶段执行条件如下：

1. 拉取代码 — 始终执行
2. 代码检查（`npm run lint`）— 始终执行
3. 构建项目（`npm run build`）— 始终执行
4. 构建 Docker 镜像并推送到 Docker Hub — PR 构建跳过
5. 通过 SSH 部署到服务器 — 仅限 main 分支且非 PR

### 部署文件

- **Dockerfile**：多阶段构建，使用 nginx 提供静态文件服务
- **deploy/nginx/admin.conf.tpl**：nginx 配置模板，支持环境变量配置后端地址
- **deploy/nginx/docker-entrypoint.d/99-envsubst.sh**：容器启动时替换环境变量
- **Jenkinsfile**：Jenkins 流水线定义（Kubernetes agent，Node 24 + Docker）

### 手动部署

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

根据实际后端服务调整 `FIRMAMENT_SERVER_*`。
