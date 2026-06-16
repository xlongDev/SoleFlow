import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  base: '/SoleFlow/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // 调整 chunk 大小警告阈值（Excel 相关库本身就很大）
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 React 相关库单独打包
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // 将图表库单独打包
          'chart-vendor': ['recharts'],
          // 将工具库单独打包
          'util-vendor': ['date-fns', 'framer-motion', 'lucide-react', 'sonner'],
          // 将国际化库单独打包
          'i18n-vendor': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          // 将 Excel 相关库单独打包
          'excel-vendor': ['exceljs', 'xlsx', 'html-to-image', 'html2canvas'],
          // 将 UI 组件相关单独打包
          'ui-vendor': ['@radix-ui/react-slot', 'clsx', 'tailwind-merge'],
          // 将状态管理单独打包
          'state-vendor': ['zustand'],
        },
      },
    },
  },
})
