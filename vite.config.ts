/**
 * Vite 构建配置文件
 * 用于配置 Vue 3 项目的构建工具和开发服务器
 */
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  // 插件配置：Vue 支持 + Vue DevTools
  plugins: [vue(), vueDevTools()],
  // 路径别名配置
  resolve: {
    alias: {
      // '@' 别名指向 src 目录，方便导入
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
