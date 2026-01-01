# 苍穹外卖 - 管理端

## 技术栈

### 核心框架
- **React** ^19.2.0 - 用于构建用户界面的 JavaScript 库
- **TypeScript** ~5.9.3 - JavaScript 的超集，提供类型安全
- **Vite** ^7.2.4 - 下一代前端构建工具，提供快速的开发体验

### 路由管理
- **React Router DOM** ^7.11.0 - 用于单页应用的路由管理

### UI 组件库
- **Radix UI** - 无样式、可访问的 UI 组件基础库
  - @radix-ui/react-alert-dialog ^1.1.15
  - @radix-ui/react-checkbox ^1.3.3
  - @radix-ui/react-dialog ^1.1.15
  - @radix-ui/react-dropdown-menu ^2.1.16
  - @radix-ui/react-label ^2.1.8
  - @radix-ui/react-popover ^1.1.15
  - @radix-ui/react-radio-group ^1.3.8
  - @radix-ui/react-separator ^1.1.8
  - @radix-ui/react-slot ^1.2.4
  - @radix-ui/react-tabs ^1.1.13
- **Tailwind CSS** ^4.1.18 - 实用优先的 CSS 框架
- **@tailwindcss/vite** ^4.1.18 - Tailwind CSS Vite 插件
- **lucide-react** ^0.562.0 - 图标库

### 数据可视化
- **ECharts** ^6.0.0 - 强大的数据可视化图表库
- **echarts-for-react** ^3.0.5 - ECharts 的 React 封装

### HTTP 请求
- **Axios** ^1.13.2 - 基于 Promise 的 HTTP 客户端

### 工具库
- **class-variance-authority** ^0.7.1 - 用于管理组件变体的工具
- **clsx** ^2.1.1 - 用于条件性地构造 className 字符串
- **tailwind-merge** ^3.4.0 - 智能合并 Tailwind CSS 类名
- **date-fns** ^4.1.0 - 日期处理库
- **react-day-picker** ^9.13.0 - 日期选择器组件
- **sonner** ^2.0.7 - Toast 通知组件
- **next-themes** ^0.4.6 - 主题切换工具

### 开发工具
- **ESLint** ^9.39.1 - JavaScript/TypeScript 代码检查工具
- **TypeScript ESLint** ^8.46.4 - TypeScript 的 ESLint 插件
- **@vitejs/plugin-react-swc** ^4.2.2 - Vite 的 React SWC 插件
- **tw-animate-css** ^1.4.0 - Tailwind CSS 动画工具

## 演示网站

**访问地址：** https://firmament-admin.kaiwen.dev

### 登录信息

- **账号：** admin
- **密码：** 123456

## 项目结构

```
admin-front-react/
├── src/
│   ├── api/          # API 接口定义
│   ├── assets/       # 静态资源
│   ├── components/   # 公共组件
│   ├── hooks/        # 自定义 Hooks
│   ├── pages/        # 页面组件
│   ├── router.tsx    # 路由配置
│   └── utils/        # 工具函数
├── public/           # 公共静态文件
└── package.json      # 项目依赖配置
```

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 启动开发服务器（允许外部访问）
npm run dev-host

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint
```
