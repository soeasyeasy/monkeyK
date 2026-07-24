---
title: "第十一章：服务端渲染"
description: "学习 Vite 中的 SSR 基础、流式渲染和 hydration"
---

# 第十一章：服务端渲染

## SSR 基础

### 什么是 SSR

服务端渲染（Server-Side Rendering）是指在服务器端将 Vue 组件渲染为 HTML 字符串，然后发送到浏览器。

### SSR 的优势

| 优势 | 说明 |
| --- | --- |
| SEO 友好 | 完整 HTML 内容，搜索引擎可抓取 |
| 首屏加载快 | 无需等待 JavaScript 下载执行 |
| 用户体验好 | 内容立即可见 |

### SSR 的挑战

- 服务器负载增加
- 开发复杂度提高
- 需要处理 hydration

## Vite SSR 配置

### 基础配置

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    // 客户端构建
    rollupOptions: {
      input: 'src/entry-client.js',
    },
  },
  ssr: {
    // 服务端构建
    external: ['vue'],
  },
})
```

### 入口文件

```javascript
// src/entry-server.js
import { createSSRApp } from 'vue'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  return { app }
}
```

```javascript
// src/entry-client.js
import { createApp } from './entry-server'

const { app } = createApp()
app.mount('#app')
```

## 服务器设置

### Express 服务器

```javascript
// server.js
import express from 'express'
import { createServer as createViteServer } from 'vite'
import { renderToString } from 'vue/server-renderer'

async function createServer() {
  const app = express()

  // 创建 Vite 开发服务器
  const vite = await createViteServer({
    server: { middlewareMode: true },
  })

  // 使用 Vite 中间件
  app.use(vite.middlewares)

  // 处理所有请求
  app.use('*', async (req, res) => {
    const { createApp } = await vite.ssrLoadModule('/src/entry-server.js')
    const { app } = createApp()

    // 渲染为 HTML
    const appContent = await renderToString(app)

    // 读取 index.html
    const fs = await import('fs')
    const template = fs.readFileSync('index.html', 'utf-8')

    // 注入渲染内容
    const html = template.replace('<!--app-html-->', appContent)

    res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
  })

  app.listen(3000, () => {
    console.log('Server running on http://localhost:3000')
  })
}

createServer()
```

### 生产环境 SSR

```javascript
// server-prod.js
import express from 'express'
import { createServer as createViteServer } from 'vite'
import { renderToString } from 'vue/server-renderer'
import { manifest } from './dist/server/manifest.json'

async function createServer() {
  const app = express()

  // 静态资源
  app.use(express.static('dist/client'))

  // 处理请求
  app.use('*', async (req, res) => {
    const { createApp } = await import('./dist/server/entry-server.js')
    const { app } = createApp()

    const appContent = await renderToString(app)

    const fs = await import('fs')
    const template = fs.readFileSync('dist/client/index.html', 'utf-8')

    const html = template.replace('<!--app-html-->', appContent)

    res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
  })

  app.listen(3000)
}

createServer()
```

## 流式渲染

### 基础流式渲染

```javascript
import { renderToStream } from 'vue/server-renderer'

app.use('*', async (req, res) => {
  const { createApp } = await import('./entry-server.js')
  const { app } = createApp()

  // 流式渲染
  const stream = await renderToStream(app)

  res.status(200).set({ 'Content-Type': 'text/html' })

  stream.pipe(res)
})
```

### 分块渲染

```javascript
import { renderToNodeStream } from 'vue/server-renderer'

app.use('*', async (req, res) => {
  const { createApp } = await import('./entry-server.js')
  const { app } = createApp()

  // 分块渲染
  const stream = renderToNodeStream(app)

  // 发送头部
  res.write('<!DOCTYPE html><html><head><title>My App</title></head><body>')

  // 管道渲染内容
  stream.pipe(res, { end: false })

  stream.on('end', () => {
    res.end('</body></html>')
  })
})
```

## Hydration

### 什么是 Hydration

Hydration 是指在客户端将服务端渲染的静态 HTML 转换为可交互的 Vue 应用的过程。

### 客户端 Hydration

```javascript
// src/entry-client.js
import { createApp } from './entry-server'

const { app } = createApp()

// Hydrate 服务端渲染的 HTML
app.mount('#app')
```

### Hydration 错误

```vue
<template>
  <!-- 错误：服务端和客户端渲染不一致 -->
  <div>{{ isClient ? 'Client' : 'Server' }}</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isClient = ref(false)

onMounted(() => {
  isClient.value = true
})
</script>
```

## 状态管理

### 服务端状态

```javascript
// src/entry-server.js
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  app.use(pinia)

  return { app, pinia }
}
```

### 状态序列化

```javascript
// server.js
app.use('*', async (req, res) => {
  const { app, pinia } = createApp()

  const appContent = await renderToString(app)

  // 序列化状态
  const state = JSON.stringify(pinia.state.value)

  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>My App</title></head>
      <body>
        <div id="app">${appContent}</div>
        <script>window.__PINIA_STATE__ = ${state}</script>
        <script type="module" src="/src/entry-client.js"></script>
      </body>
    </html>
  `

  res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
})
```

### 客户端恢复状态

```javascript
// src/entry-client.js
import { createApp } from './entry-server'

const { app, pinia } = createApp()

// 恢复服务端状态
if (window.__PINIA_STATE__) {
  pinia.state.value = JSON.parse(window.__PINIA_STATE__)
}

app.mount('#app')
```

## 数据预取

### 使用 onServerPrefetch

```vue
<template>
  <div>
    <h1>{{ user.name }}</h1>
  </div>
</template>

<script setup>
import { ref, onServerPrefetch } from 'vue'

const user = ref({})

onServerPrefetch(async () => {
  // 服务端预取数据
  user.value = await fetchUser(1)
})
</script>
```

### 路由级数据预取

```javascript
// src/router/index.js
const routes = [
  {
    path: '/user/:id',
    component: User,
    async beforeRouteEnter(to, from, next) {
      const user = await fetchUser(to.params.id)
      next((vm) => {
        vm.user = user
      })
    },
  },
]
```

## 常见问题

### 内存泄漏

```javascript
// 每次请求创建新实例
app.use('*', async (req, res) => {
  const { app } = createApp() // 每次创建新实例
  // ...
})
```

### 第三方库兼容性

```javascript
// 检查是否在服务端
if (import.meta.env.SSR) {
  // 服务端逻辑
} else {
  // 客户端逻辑
}
```

## 小结

本章介绍了 Vite 中的服务端渲染，包括基础配置、流式渲染、hydration 和状态管理。SSR 可以提升首屏加载速度和 SEO 效果。

下一章我们将学习 Vite 的构建优化。
