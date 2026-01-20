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
  // --- 新增 server 配置 ---
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
