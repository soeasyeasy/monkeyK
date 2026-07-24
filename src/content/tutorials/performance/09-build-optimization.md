---
title: "第九章：构建工具优化"
description: "Tree Shaking、代码分割、压缩策略等构建时优化技术"
---

# 第九章：构建工具优化

## 构建优化概览

构建时优化目标：

| 目标 | 手段 |
| --- | --- |
| 减少体积 | Tree Shaking、压缩、代码分割 |
| 减少请求 | 合并、内联 |
| 提升加载 | 预加载、资源提示 |

## Tree Shaking

### 原理

移除未使用的代码（Dead Code Elimination）。

```javascript
// utils.js
export function usedFunction() {
  return 'used';
}

export function unusedFunction() {
  return 'unused';
}

// main.js
import { usedFunction } from './utils.js';
console.log(usedFunction());
// unusedFunction 会被 Tree Shaking 移除
```

### 启用条件

```json
// package.json
{
  "sideEffects": false
}
```

```json
// 有副作用的模块需要标记
{
  "sideEffects": [
    "./src/polyfills.js",
    "*.css"
  ]
}
```

### 注意事项

```javascript
// 避免：默认导入破坏 Tree Shaking
import _ from 'lodash'; // 整个 lodash 被包含

// 推荐：按需导入
import debounce from 'lodash/debounce';

// 或使用 lodash-es
import { debounce } from 'lodash-es';
```

## 代码分割

### 入口分割

```javascript
// webpack.config.js
module.exports = {
  entry: {
    main: './src/main.js',
    vendor: './src/vendor.js'
  },
  output: {
    filename: '[name].[contenthash].js'
  }
};
```

### 动态导入

```javascript
// 路由级别分割
const routes = [
  {
    path: '/dashboard',
    component: () => import('./views/Dashboard.vue')
  },
  {
    path: '/settings',
    component: () => import('./views/Settings.vue')
  }
];

// 交互级别分割
button.addEventListener('click', async () => {
  const { openModal } = await import('./modal.js');
  openModal();
});
```

### 分割策略

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        },
        common: {
          minChunks: 2,
          priority: -10,
          reuseExistingChunk: true
        }
      }
    }
  }
};
```

## 代码压缩

### JavaScript 压缩

```javascript
// Vite 默认使用 esbuild 压缩
export default defineConfig({
  build: {
    minify: 'esbuild', // 或 'terser'
    terserOptions: {
      compress: {
        drop_console: true, // 移除 console
        drop_debugger: true
      }
    }
  }
});
```

### CSS 压缩

```javascript
// Vite 使用 cssnano
export default defineConfig({
  build: {
    cssMinify: true
  }
});
```

### HTML 压缩

```javascript
import { defineConfig } from 'vite';
import { minifyHtml } from 'vite-plugin-html';

export default defineConfig({
  plugins: [
    minifyHtml({
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true
    })
  ]
});
```

## 资源优化

### 图片压缩

```javascript
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    viteImagemin({
      gifsicle: { optimizationLevel: 3 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.65, 0.9] },
      svgo: {
        plugins: [
          { name: 'removeViewBox' },
          { name: 'removeEmptyAttrs', active: false }
        ]
      }
    })
  ]
});
```

### 字体子集化

```javascript
import { defineConfig } from 'vite';
import font from 'vite-plugin-font';

export default defineConfig({
  plugins: [
    font({
      subset: {
        // 只包含页面使用的字符
        text: '你好世界'
      }
    })
  ]
});
```

## 预渲染 / SSR

### 预渲染静态页面

```javascript
import { defineConfig } from 'vite';
import prerender from 'vite-plugin-prerender';

export default defineConfig({
  plugins: [
    prerender({
      routes: ['/', '/about', '/contact'],
      renderer: '@prerenderer/renderer-puppeteer'
    })
  ]
});
```

### 服务端渲染

```javascript
// Express + Vue SSR
import express from 'express';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';

const app = express();

app.get('*', async (req, res) => {
  const vueApp = createSSRApp(App);
  const html = await renderToString(vueApp);

  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>SSR</title></head>
      <body>
        <div id="app">${html}</div>
        <script src="/client.js"></script>
      </body>
    </html>
  `);
});
```

## 分析构建产物

### Vite 构建分析

```javascript
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ]
});
```

### Webpack Bundle Analyzer

```javascript
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin()
  ]
};
```

## Gzip / Brotli 压缩

### 预压缩资源

```javascript
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    // Gzip
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz'
    }),
    // Brotli
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br'
    })
  ]
});
```

### Nginx 配置

```nginx
# 启用 Gzip
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1024;

# 使用预压缩文件
gzip_static on;
```

## 核心知识点

1. **Tree Shaking**：移除未使用代码，需要 ES Modules 和 sideEffects 配置
2. **代码分割**：按路由、交互、组件分割，减少初始加载
3. **压缩策略**：JS/CSS/HTML 压缩，移除开发代码
4. **资源优化**：图片压缩、字体子集化
5. **预压缩**：Gzip/Brotli 预压缩，减少传输体积
