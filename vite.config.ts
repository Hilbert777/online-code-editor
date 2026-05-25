import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 使用 Vite 官方 Vue 插件解析 .vue 单文件组件。
  plugins: [vue()],
  build: {
    // Monaco Editor 体积较大，单独分包后主业务代码更清晰，也便于浏览器缓存。
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ['monaco-editor/esm/vs/editor/editor.api'],
        },
      },
    },
  },
  test: {
    // Vitest 只测试 utils 等纯逻辑模块，不依赖真实浏览器环境。
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
  },
})
