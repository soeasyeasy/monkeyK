---
title: "第九章：多页应用与 SPA"
description: "学习 Vite 中如何配置多页应用、SPA 路由集成和代码分割策略"
---

# 第九章：多页应用与 SPA

## 单页应用（SPA）

### 基础配置

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
  <head>
    <title>My SPA</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

```javascript
// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
```

### 路由配置

```javascript
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/about',
    component: () => import('../views/About.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
```

## 多页应用（MPA）

### 配置多入口

```javascript
// vite.config.js
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/pages/index/main.js'),
        about: resolve(__dirname, 'src/pages/about/main.js'),
        contact: resolve(__dirname, 'src/pages/contact/main.js'),
      },
      output: {
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})
```

### 目录结构

```
src/
├── pages/
│   ├── index/
│   │   ├── main.js
│   │   ├── index.html
│   │   └── App.vue
│   ├── about/
│   │   ├── main.js
│   │   ├── index.html
│   │   └── App.vue
│   └── contact/
│       ├── main.js
│       ├── index.html
│       └── App.vue
└── shared/
    ├── components/
    └── utils/
```

### 多 HTML 文件

使用 `vite-plugin-html` 或手动配置：

```javascript
import { createHtmlPlugin } from 'vite-plugin-html'

export default defineConfig({
  plugins: [
    createHtmlPlugin({
      pages: [
        {
          entry: 'src/pages/index/main.js',
          filename: 'index.html',
          template: 'src/pages/index/index.html',
        },
        {
          entry: 'src/pages/about/main.js',
          filename: 'about.html',
          template: 'src/pages/about/index.html',
        },
      ],
    }),
  ],
})
```

### 开发服务器配置

```javascript
server: {
  open: ['/index.html'], // 默认打开的页面
}
```

## 代码分割策略

### 路由级分割

```javascript
// 自动代码分割
const routes = [
  {
    path: '/',
    component: () => import('./views/Home.vue'),
  },
  {
    path: '/about',
    component: () => import('./views/About.vue'),
  },
]
```

### 手动分割

```javascript
// vite.config.js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        // 供应商代码
        vendor: ['vue', 'vue-router', 'pinia'],

        // 工具库
        utils: ['lodash-es', 'dayjs'],

        // 组件库
        ui: ['element-plus'],
      },
    },
  },
}
```

### 动态导入

```javascript
// 按需加载
async function loadModule() {
  const { default: module } = await import('./module.js')
  return module
}

// 预加载
const preloadModule = () => import('./module.js')
```

### 预加载提示

```html
<!-- index.html -->
<link rel="modulepreload" href="/src/main.js" />
<link rel="prefetch" href="/assets/about-page.js" />
```

## 共享代码

### 提取共享代码

```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        // 提取 node_modules 中的依赖
        if (id.includes('node_modules')) {
          return 'vendor'
        }

        // 提取共享组件
        if (id.includes('/src/shared/')) {
          return 'shared'
        }
      },
    },
  },
}
```

### 多页共享

```javascript
// src/shared/utils.js
export function formatDate(date) {
  // ...
}

// 在多个页面中使用
import { formatDate } from '@/shared/utils'
```

## 构建优化

### 分包策略

```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        // 按功能分包
        'vendor-vue': ['vue', 'vue-router', 'pinia'],
        'vendor-ui': ['element-plus', '@element-plus/icons-vue'],
        'vendor-utils': ['lodash-es', 'dayjs', 'axios'],
      },
    },
  },
}
```

### 按需加载

```javascript
// 组件按需加载
const AsyncComponent = defineAsyncComponent(() =>
  import('./components/HeavyComponent.vue')
)

// 路由按需加载
const routes = [
  {
    path: '/dashboard',
    component: () => import('./views/Dashboard.vue'),
    children: [
      {
        path: 'analytics',
        component: () => import('./views/analytics/Index.vue'),
      },
    ],
  },
]
```

## 常见问题

### SPA 路由 404

配置服务器重定向：

```javascript
// vite.config.js
server: {
  historyApiFallback: true,
}
```

### MPA 页面间跳转

```javascript
// 使用完整 URL
window.location.href = '/about.html'

// 或使用相对路径
window.location.href = '../about/index.html'
```

### 共享状态

```javascript
// 使用 localStorage
localStorage.setItem('shared-state', JSON.stringify(state))

// 或使用 sessionStorage
sessionStorage.setItem('shared-state', JSON.stringify(state))
```

## 小结

本章介绍了 Vite 中 SPA 和 MPA 的配置方式，以及代码分割策略。合理配置可以提升应用性能和用户体验。

下一章我们将学习 Vite 的库模式。
