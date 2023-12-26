import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { CRX_OUT_DIR } from './globalConfig'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: CRX_OUT_DIR
  },
  server: {
    // 指定dev sever的端口号，默认为5173
    port: 4000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  plugins: [vue()]
})
