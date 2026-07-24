---
title: "第十二章：构建优化"
description: "掌握 Vite 中的 Rollup 配置、Tree-shaking、代码压缩和分包策略"
---

# 第十二章：构建优化

## 基础构建配置

### 构建选项

```javascript
// vite.config.js
export default defineConfig({
  build: {
    // 输出目录
    outDir: 'dist',

    // 资源目录
    assetsDir: 'assets',

    // 静态资源大小限制（4KB）
    assetsInlineLimit: 4096,

    // CSS 代码分割
    cssCodeSplit: true,

    // Source Map
    sourcemap: false,

    // 压缩选项
    minify: 'esbuild',

    // 目标浏览器
    target: 'modules',

    // 控制台输出
    manifest: false,
  },
})
```

## Tree-shaking

### 工作原理

Tree-shaking 是指移除 JavaScript 上下文中未引用的代码（dead-code）。

### ES Modules

```javascript
// utils.js
export function add(a, b) {
  return a + b
}

export function subtract(a, b) {
  return a - b
}

// main.js
import { add } from './utils.js'
// subtract 会被 tree-shake 移除
```

### 避免副作用

```javascript
// utils.js
export function add(a, b) {
  return a + b
}

// 标记为有副作用
/*#__PURE__*/
export function init() {
  console.log('Initializing...')
}
```

### package.json 配置

```json
{
  "name": "my-library",
  "sideEffects": false
}
```

## 代码压缩

### esbuild 压缩（默认）

```javascript
build: {
  minify: 'esbuild',
}
```

### Terser 压缩

```bash
npm install -D terser
```

```javascript
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true,
    },
    format: {
      comments: false,
    },
  },
}
```

### 禁用压缩

```javascript
build: {
  minify: false,
}
```

## Rollup 配置

### 基础配置

```javascript
build: {
  rollupOptions: {
    // 输入
    input: 'src/main.js',

    // 输出
    output: {
      // 文件名格式
      entryFileNames: 'js/[name]-[hash].js',
      chunkFileNames: 'js/[name]-[hash].js',
      assetFileNames: 'assets/[name]-[hash].[ext]',

      // 手动分包
      manualChunks: {
        vendor: ['vue', 'vue-router', 'pinia'],
      },
    },

    // 外部依赖
    external: ['vue'],

    // 插件
    plugins: [],
  },
}
```

### 分包策略

```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        // 提取 node_modules 中的依赖
        if (id.includes('node_modules')) {
          // 按包名分包
          const packageName = id.split('node_modules/')[1].split('/')[0]
          return `vendor-${packageName}`
        }

        // 提取组件
        if (id.includes('/src/components/')) {
          return 'components'
        }

        // 提取工具函数
        if (id.includes('/src/utils/')) {
          return 'utils'
        }
      },
    },
  },
}
```

### 动态分包

```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes('node_modules')) {
          return 'vendor'
        }
      },
    },
  },
}
```

## 代码分割

### 路由级分割

```javascript
// router/index.js
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

### 组件级分割

```vue
<script setup>
import { defineAsyncComponent } from 'vue'

const HeavyComponent = defineAsyncComponent(() =>
  import('./components/HeavyComponent.vue')
)
</script>
```

### 条件分割

```javascript
// 根据条件加载
async function loadModule() {
  if (import.meta.env.PROD) {
    return await import('./prod-module.js')
  } else {
    return await import('./dev-module.js')
  }
}
```

## 资源优化

### 图片优化

```bash
npm install -D vite-plugin-imagemin
```

```javascript
import viteImagemin from 'vite-plugin-imagemin'

export default defineConfig({
  plugins: [
    viteImagemin({
      gifsicle: {
        optimizationLevel: 7,
        interlaced: false,
      },
      optipng: {
        optimizationLevel: 7,
      },
      mozjpeg: {
        quality: 80,
      },
      pngquant: {
        quality: [0.8, 0.9],
        speed: 4,
      },
      svgo: {
        plugins: [
          {
            name: 'removeViewBox',
          },
        ],
      },
    }),
  ],
})
```

### CSS 优化

```javascript
build: {
  cssMinify: 'esbuild', // 或 'terser'
}
```

### 预加载

```html
<!-- index.html -->
<link rel="modulepreload" href="/src/main.js" />
<link rel="preload" href="/assets/critical.css" as="style" />
```

## 依赖优化

### 预构建优化

```javascript
optimizeDeps: {
  // 包含特定依赖
  include: ['lodash-es', 'axios'],

  // 排除特定依赖
  exclude: ['some-dep'],

  // esbuild 选项
  esbuildOptions: {
    target: 'es2020',
  },
}
```

### CDN 优化

```javascript
build: {
  rollupOptions: {
    external: ['vue', 'vue-router', 'pinia'],
    output: {
      globals: {
        vue: 'Vue',
        'vue-router': 'VueRouter',
        pinia: 'Pinia',
      },
    },
  },
}
```

```html
<!-- index.html -->
<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
<script src="https://unpkg.com/vue-router@4/dist/vue-router.global.prod.js"></script>
<script src="https://unpkg.com/pinia@2/dist/pinia.iife.prod.js"></script>
```

## 构建分析

### 使用 rollup-plugin-visualizer

```bash
npm install -D rollup-plugin-visualizer
```

```javascript
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
})
```

### 使用 vite-bundle-visualizer

```bash
npm install -D vite-bundle-visualizer
```

```javascript
import { defineConfig } from 'vite'
import { visualizer } from 'vite-bundle-visualizer'

export default defineConfig({
  plugins: [visualizer()],
})
```

## 性能优化技巧

### 按需导入

```javascript
// 不好：导入整个库
import { Button, Input, Table } from 'element-plus'

// 好：按需导入
import Button from 'element-plus/es/components/button'
import Input from 'element-plus/es/components/input'
import Table from 'element-plus/es/components/table'
```

### 使用自动导入插件

```bash
npm install -D unplugin-vue-components unplugin-auto-import
```

```javascript
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
})
```

### 延迟加载

```javascript
// 延迟加载非关键资源
async function loadAnalytics() {
  if (import.meta.env.PROD) {
    await import('./analytics.js')
  }
}

// 在用户交互后加载
document.addEventListener('click', loadAnalytics, { once: true })
```

## 常见问题

### 构建失败

```javascript
// 增加内存限制
node --max-old-space-size=4096 node_modules/vite/bin/vite.js build
```

### 构建速度慢

```javascript
// 使用 esbuild 替代 terser
build: {
  minify: 'esbuild',
}

// 禁用 sourcemap
build: {
  sourcemap: false,
}
```

### 包体积过大

1. 检查依赖是否按需导入
2. 使用 tree-shaking
3. 配置 manualChunks 分包
4. 使用 CDN 外部化大依赖

## 小结

本章介绍了 Vite 的构建优化，包括 Tree-shaking、代码压缩、分包策略等。合理配置可以显著减小包体积，提升加载性能。

下一章我们将学习 Vite 的性能分析与调优。
