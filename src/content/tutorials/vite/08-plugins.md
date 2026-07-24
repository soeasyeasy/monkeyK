---
title: "第八章：插件系统"
description: "了解 Vite 的插件机制、官方插件和社区插件的使用"
---

# 第八章：插件系统

## 插件基础

### 配置插件

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})
```

### 多个插件

```javascript
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
})
```

## 官方插件

### @vitejs/plugin-vue

Vue 3 支持：

```bash
npm install -D @vitejs/plugin-vue
```

```javascript
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      // 自定义选项
      include: [/\.vue$/, /\.md$/],
      exclude: [/node_modules/],
    }),
  ],
})
```

### @vitejs/plugin-vue-jsx

Vue JSX 支持：

```bash
npm install -D @vitejs/plugin-vue-jsx
```

```javascript
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [vueJsx()],
})
```

### @vitejs/plugin-react

React 支持：

```bash
npm install -D @vitejs/plugin-react
```

```javascript
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // Babel 配置
      babel: {
        plugins: ['babel-plugin-macros'],
      },
    }),
  ],
})
```

### @vitejs/plugin-legacy

旧浏览器支持：

```bash
npm install -D @vitejs/plugin-legacy
```

```javascript
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    }),
  ],
})
```

## 社区插件

### vite-plugin-pwa

渐进式 Web 应用支持：

```bash
npm install -D vite-plugin-pwa
```

```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'My App',
        short_name: 'App',
        description: 'My awesome app',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
```

### vite-plugin-inspect

检查 Vite 中间转换结果：

```bash
npm install -D vite-plugin-inspect
```

```javascript
import Inspect from 'vite-plugin-inspect'

export default defineConfig({
  plugins: [Inspect()],
})
```

访问 `http://localhost:5173/__inspect/` 查看模块转换过程。

### vite-plugin-compression

Gzip/Brotli 压缩：

```bash
npm install -D vite-plugin-compression
```

```javascript
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
})
```

### vite-plugin-html

HTML 模板增强：

```bash
npm install -D vite-plugin-html
```

```javascript
import { createHtmlPlugin } from 'vite-plugin-html'

export default defineConfig({
  plugins: [
    createHtmlPlugin({
      minify: true,
      pages: [
        {
          entry: 'src/main.js',
          filename: 'index.html',
          template: 'index.html',
          injectOptions: {
            data: {
              title: 'My App',
            },
          },
        },
      ],
    }),
  ],
})
```

### vite-plugin-svg-icons

SVG 图标管理：

```bash
npm install -D vite-plugin-svg-icons
```

```javascript
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import path from 'path'

export default defineConfig({
  plugins: [
    createSvgIconsPlugin({
      iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
      symbolId: 'icon-[dir]-[name]',
    }),
  ],
})
```

## 插件开发基础

### 插件结构

```javascript
// my-plugin.js
export default function myPlugin(options = {}) {
  return {
    name: 'my-plugin',

    // 钩子函数
    configResolved(config) {
      // 配置解析后
    },

    configureServer(server) {
      // 配置开发服务器
    },

    transformIndexHtml(html) {
      // 转换 HTML
      return html.replace('</body>', '<script>console.log("injected")</script></body>')
    },

    transform(code, id) {
      // 转换模块
      if (id.endsWith('.txt')) {
        return `export default ${JSON.stringify(code)}`
      }
    },

    load(id) {
      // 自定义加载
      if (id.endsWith('.custom')) {
        return 'export default "custom content"'
      }
    },
  }
}
```

### 使用插件

```javascript
import myPlugin from './my-plugin.js'

export default defineConfig({
  plugins: [myPlugin({ debug: true })],
})
```

## 插件钩子

### 通用钩子

| 钩子 | 说明 |
| --- | --- |
| `buildStart` | 构建开始 |
| `resolveId` | 解析模块 ID |
| `load` | 加载模块 |
| `transform` | 转换模块 |
| `buildEnd` | 构建结束 |

### Vite 特有钩子

| 钩子 | 说明 |
| --- | --- |
| `config` | 修改配置 |
| `configResolved` | 配置解析后 |
| `configureServer` | 配置开发服务器 |
| `transformIndexHtml` | 转换 HTML |
| `handleHotUpdate` | 处理 HMR |

## 插件示例

### 虚拟模块

```javascript
export default function virtualModulePlugin() {
  const virtualModuleId = 'virtual:my-module'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  return {
    name: 'virtual-module',

    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },

    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `export const msg = "from virtual module"`
      }
    },
  }
}
```

### 文件转换

```javascript
export default function markdownPlugin() {
  return {
    name: 'markdown',

    transform(code, id) {
      if (id.endsWith('.md')) {
        // 将 Markdown 转为 HTML
        const html = markdownToHtml(code)
        return `export default ${JSON.stringify(html)}`
      }
    },
  }
}
```

## 插件顺序

插件执行顺序很重要：

```javascript
export default defineConfig({
  plugins: [
    // 1. 别名解析
    // 2. 核心转换
    // 3. 框架插件（vue、react）
    // 4. 其他插件
  ],
})
```

## 条件应用插件

```javascript
export default defineConfig(({ command, mode }) => {
  const plugins = []

  // 只在开发时使用
  if (command === 'serve') {
    plugins.push(inspectPlugin())
  }

  // 只在生产构建时使用
  if (command === 'build') {
    plugins.push(compressionPlugin())
  }

  // 特定模式
  if (mode === 'production') {
    plugins.push(legacyPlugin())
  }

  return {
    plugins,
  }
})
```

## 小结

本章介绍了 Vite 的插件系统，包括官方插件、社区插件和插件开发基础。Vite 兼容 Rollup 插件生态，提供了丰富的扩展能力。

下一章我们将学习 Vite 中的多页应用和 SPA 配置。
