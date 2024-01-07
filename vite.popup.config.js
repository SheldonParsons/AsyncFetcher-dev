import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { AP_OUT_DIR } from './globalConfig'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: AP_OUT_DIR
  },
  server: {
    // 指定dev sever的端口号，默认为5173
    port: 4000,
    open: '/',
    // 设置反向代理
    proxy: {
      // 以下示例表示：请求URL中含有"/api"，则反向代理到http://localhost
      // 例如: http://localhost:3000/api/login -> http://localhost/api/login
      // 如果反向代理到localhost报错Error: connect ECONNREFUSED ::1:80，
      // 则将localhost改127.0.0.1
      '/api': {
        target: 'http://localhost:6001/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  plugins: [vue()]
})
