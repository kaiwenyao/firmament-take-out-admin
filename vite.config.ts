/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      // Coverage is scoped to the units covered by the unit-test suite:
      // API layer, hooks, utilities, presentational components and the
      // simpler pages. See the PR description for the rationale.
      include: [
        "src/api/*.ts",
        "src/hooks/useWebSocket.ts",
        "src/lib/utils.ts",
        "src/utils/navigation.ts",
        "src/utils/upload.ts",
        "src/App.tsx",
        "src/components/DateRangePicker.tsx",
        "src/components/DateTimePicker.tsx",
        "src/components/Header.tsx",
        "src/components/ProtectedLayout.tsx",
        "src/components/Sidebar.tsx",
        "src/pages/Login.tsx",
        "src/pages/NotFound.tsx",
      ],
      exclude: [
        "src/test/**",
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.test.tsx",
      ],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90,
      },
    },
  },
  server: {
    proxy: {
      // WebSocket 路径：/api/ws/* -> /ws/* (与生产环境 nginx 配置一致)
      '/api/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true, // 启用 WebSocket 支持
        rewrite: (path) => path.replace(/^\/api/, '') // /api/ws -> /ws
      },
      // 普通 API 路径：/api/* -> /admin/*
      '/api': {
        target: 'http://localhost:8080', // 你的后端地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/admin') // 把 /api 替换为 /admin
      }
    }
  }
})
