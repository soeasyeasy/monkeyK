---
title: "第九章：构建工具优化"
description: "掌握 Tree Shaking、代码分割、压缩策略等构建时优化技术"
---

# 第九章：构建工具优化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Tree Shaking？怎么让没用到的代码自动删除？
- 代码分割怎么分？分太细会不会反而变慢？
- Gzip 和 Brotli 有什么区别？怎么配置？
- 怎么分析打包后的产物，找出体积大的模块？

这一章就是为了解答这些问题。构建工具优化可以在打包阶段大幅减少资源体积，是性能优化的重要环节。

---

## 9.1 为什么需要构建工具优化？

### 痛点分析

你可能遇到过这些问题：

- 打包后的 JS 文件有 2MB，用户加载很慢
- 明明只用了 lodash 的一个函数，整个库都被打包了
- 每次修改代码都要重新下载整个 bundle
- 不知道打包产物里哪些模块体积最大

打个比方：

> 构建优化就像搬家打包：
> - Tree Shaking = 扔掉不用的东西
> - 代码分割 = 分多个箱子装，按需取用
> - 压缩 = 真空压缩，减少体积
> - 预压缩 = 提前压缩好，不用现场压

### 优化目标

```
构建优化目标：
├── 减少体积 → Tree Shaking、压缩、代码分割
├── 减少请求 → 合并、内联
├── 提升加载 → 预加载、资源提示
└── 提升缓存 → 文件名 Hash、长期缓存
```

---

## 9.2 Tree Shaking

### 核心原理

移除未使用的代码（Dead Code Elimination）。

```
原理：
├── 基于 ES Modules 的静态分析
├── 编译时确定哪些导出被使用
└── 删除未使用的导出
```

打个比方：

> Tree Shaking 就像摇树：
> - 树 = 你的代码
> - 摇 = 构建工具分析
> - 掉下来的叶子 = 未使用的代码
> - 剩下的果实 = 实际使用的代码

### 基础示例

```javascript
// utils.js
// ✅ 导出的函数
export function usedFunction() {
  return 'used';
}

// ❌ 未使用的函数（会被 Tree Shaking 移除）
export function unusedFunction() {
  return 'unused';
}

// main.js
// ✅ 只导入使用的函数
import { usedFunction } from './utils.js';
console.log(usedFunction());
// unusedFunction 会被 Tree Shaking 移除
```

### 启用配置

```json
// package.json
{
  // ✅ 标记项目没有副作用
  "sideEffects": false
}
```

```json
// 有副作用的模块需要标记
{
  "sideEffects": [
    "./src/polyfills.js",  // polyfills 有副作用
    "*.css"                // CSS 有副作用
  ]
}
```

**说明**：

- `sideEffects: false` 告诉 Webpack 所有文件都没有副作用
- 有副作用的文件需要明确列出，否则会被 Tree Shaking 移除

### 注意事项

```javascript
// ❌ 避免：默认导入破坏 Tree Shaking
import _ from 'lodash'; // 整个 lodash 被包含

// ✅ 推荐：按需导入
import debounce from 'lodash/debounce';

// ✅ 或使用 lodash-es（ES Modules 版本）
import { debounce } from 'lodash-es';
```

**原理**：

- lodash 是 CommonJS 模块，无法静态分析
- lodash-es 是 ES Modules，支持 Tree Shaking
- 按需导入路径更小，只打包需要的部分

---

## 9.3 代码分割

### 入口分割

```javascript
// webpack.config.js
module.exports = {
  // ✅ 多个入口
  entry: {
    main: './src/main.js',      // 主应用
    vendor: './src/vendor.js'   // 第三方库
  },
  output: {
    // ✅ 文件名带 Hash（用于缓存）
    filename: '[name].[contenthash].js'
  }
};
```

**原理**：

- 第三方库很少变化，可以长期缓存
- 业务代码经常变化，单独打包
- 用户访问时，vendor.js 可以命中缓存

### 动态导入

```javascript
// ✅ 路由级别分割
const routes = [
  {
    path: '/dashboard',
    // 访问 /dashboard 时才加载 Dashboard 组件
    component: () => import('./views/Dashboard.vue')
  },
  {
    path: '/settings',
    component: () => import('./views/Settings.vue')
  }
];

// ✅ 交互级别分割
button.addEventListener('click', async () => {
  // 用户点击时才加载 modal 模块
  const { openModal } = await import('./modal.js');
  openModal();
});
```

**原理**：

- `import()` 返回 Promise，异步加载模块
- 构建工具会自动分割代码
- 只在需要时才下载对应的 chunk

### 分割策略

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',  // 对所有类型的 chunk 生效
      cacheGroups: {
        // ✅ 第三方库单独打包
        vendor: {
          test: /[\\/]node_modules[\\/]/,  // 匹配 node_modules
          name: 'vendors',                 // chunk 名称
          chunks: 'all'                    // 对所有 chunk 生效
        },
        // ✅ 公共模块单独打包
        common: {
          minChunks: 2,           // 至少被 2 个 chunk 引用
          priority: -10,          // 优先级
          reuseExistingChunk: true // 复用已有的 chunk
        }
      }
    }
  }
};
```

**说明**：

- `vendor`：将 node_modules 中的库单独打包
- `common`：将被多个 chunk 引用的公共模块单独打包
- 避免重复打包，减少总体积

---

## 9.4 代码压缩

### JavaScript 压缩

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // ✅ 使用 esbuild 压缩（默认，速度快）
    minify: 'esbuild',
    // ✅ 或使用 terser（功能更多，速度慢）
    // minify: 'terser',
    
    // ✅ terser 配置
    terserOptions: {
      compress: {
        // ✅ 生产环境移除 console
        drop_console: true,
        // ✅ 移除 debugger
        drop_debugger: true
      }
    }
  }
});
```

**对比**：

| 工具 | 速度 | 功能 | 推荐场景 |
| --- | --- | --- | --- |
| esbuild | 快 | 基础 | 默认选择 |
| terser | 慢 | 丰富 | 需要高级优化 |

### CSS 压缩

```javascript
// vite.config.js
export default defineConfig({
  build: {
    // ✅ 启用 CSS 压缩（默认使用 cssnano）
    cssMinify: true
  }
});
```

**原理**：

- cssnano 会移除空白、注释
- 合并重复的规则
- 优化属性值

### HTML 压缩

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { minifyHtml } from 'vite-plugin-html';

export default defineConfig({
  plugins: [
    // ✅ HTML 压缩
    minifyHtml({
      collapseWhitespace: true,        // 合并空白
      removeComments: true,            // 移除注释
      removeRedundantAttributes: true  // 移除冗余属性
    })
  ]
});
```

---

## 9.5 资源优化

### 图片压缩

```javascript
// vite.config.js
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    // ✅ 图片压缩
    viteImagemin({
      // GIF 压缩
      gifsicle: { optimizationLevel: 3 },
      // PNG 压缩
      optipng: { optimizationLevel: 7 },
      // JPEG 压缩
      mozjpeg: { quality: 80 },
      // PNG 压缩（另一种）
      pngquant: { quality: [0.65, 0.9] },
      // SVG 压缩
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

**说明**：

- 不同格式使用不同的压缩工具
- JPEG 质量 80% 是平衡点
- SVG 移除不必要的属性

### 字体子集化

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import font from 'vite-plugin-font';

export default defineConfig({
  plugins: [
    // ✅ 字体子集化
    font({
      subset: {
        // ✅ 只包含页面使用的字符
        text: '你好世界'
      }
    })
  ]
});
```

**原理**：

- 中文字体文件很大（5-10MB）
- 子集化只保留页面用到的字符
- 体积可以减少 90% 以上

---

## 9.6 预渲染 / SSR

### 预渲染静态页面

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import prerender from 'vite-plugin-prerender';

export default defineConfig({
  plugins: [
    // ✅ 预渲染指定路由
    prerender({
      routes: ['/', '/about', '/contact'],
      renderer: '@prerenderer/renderer-puppeteer'
    })
  ]
});
```

**适用场景**：

- 内容不经常变化的页面
- 需要 SEO 的页面
- 不需要用户登录的页面

### 服务端渲染（SSR）

```javascript
// Express + Vue SSR
import express from 'express';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';

const app = express();

app.get('*', async (req, res) => {
  // ✅ 创建 SSR 应用
  const vueApp = createSSRApp(App);
  // ✅ 渲染为 HTML 字符串
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

**优势**：

- 首屏速度快（服务器直接返回 HTML）
- SEO 友好（完整 HTML）
- 适合内容型网站

---

## 9.7 分析构建产物

### Vite 构建分析

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    // ✅ 构建产物分析
    visualizer({
      open: true,           // 自动打开分析报告
      gzipSize: true,       // 显示 gzip 后的大小
      brotliSize: true      // 显示 brotli 后的大小
    })
  ]
});
```

**使用**：

- 运行 `npm run build`
- 自动打开 HTML 报告
- 可视化展示各模块体积

### Webpack Bundle Analyzer

```javascript
// webpack.config.js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    // ✅ 构建产物分析
    new BundleAnalyzerPlugin()
  ]
};
```

**使用**：

- 运行 `npm run build`
- 自动打开交互式 treemap
- 点击模块查看详情

---

## 9.8 Gzip / Brotli 压缩

### 预压缩资源

```javascript
// vite.config.js
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    // ✅ Gzip 压缩
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz'
    }),
    // ✅ Brotli 压缩
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br'
    })
  ]
});
```

**对比**：

| 算法 | 压缩率 | 速度 | 兼容性 |
| --- | --- | --- | --- |
| Gzip | 中等 | 快 | 全支持 |
| Brotli | 更高 | 慢 | 95%+ |

### Nginx 配置

```nginx
# ✅ 启用 Gzip
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1024;  # 小于 1KB 不压缩

# ✅ 使用预压缩文件（性能更好）
gzip_static on;
```

**说明**：

- `gzip_static on` 优先使用预压缩的 `.gz` 文件
- 避免实时压缩，提升性能

---

## 9.9 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| Tree Shaking | 移除未使用代码，需要 ES Modules 和 sideEffects 配置 |
| 代码分割 | 按路由、交互、组件分割，减少初始加载 |
| 压缩策略 | JS/CSS/HTML 压缩，移除开发代码 |
| 资源优化 | 图片压缩、字体子集化 |
| 预压缩 | Gzip/Brotli 预压缩，减少传输体积 |

---

## 9.10 新手常见误区

### 误区 1："Tree Shaking 对所有库都有效"

**错！** Tree Shaking 只对 ES Modules 有效，CommonJS 模块无法静态分析。

**正确做法**：

1. 使用 ES Modules 版本的库（如 lodash-es）
2. 按需导入（`import debounce from 'lodash/debounce'`）
3. 检查 package.json 的 `sideEffects` 字段

### 误区 2："代码分割越细越好"

**错！** 分割太细会导致请求数过多，HTTP/1.1 下反而变慢。

**正确做法**：

1. 按路由分割是基础
2. 重量级组件单独分割
3. 平衡分割粒度和请求数
4. HTTP/2 下可以更细粒度

### 误区 3："生产环境保留 console.log"

**错！** console.log 会影响性能，还会泄露敏感信息。

**正确做法**：

1. 使用 terser 的 `drop_console: true`
2. 或使用 babel-plugin-transform-remove-console
3. 开发环境可以使用条件编译

### 误区 4："不分析就直接优化"

**错！** 不知道哪里大，优化就是盲人摸象。

**正确做法**：

1. 先用 visualizer 或 Bundle Analyzer 分析
2. 找出体积最大的模块
3. 针对性优化（替换库、Tree Shaking、分割）

---

## 9.11 动手练习

### 练习 1：基础练习 - Tree Shaking

**题目**：优化以下代码，让 Tree Shaking 生效。

```javascript
// utils.js
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

// main.js
import * as utils from './utils.js';
console.log(utils.add(1, 2));
```

<details>
<summary>点击查看答案</summary>

```javascript
// utils.js（保持不变）
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

// ✅ main.js（修改导入方式）
import { add } from './utils.js';
console.log(add(1, 2));
// subtract 会被 Tree Shaking 移除
```

**优化点**：

1. 使用具名导入 `import { add }` 而不是 `import *`
2. 只导入使用的函数
3. 确保 package.json 设置 `sideEffects: false`

</details>

### 练习 2：进阶练习 - 代码分割

**题目**：为以下路由配置添加代码分割。

```javascript
import Home from './views/Home.vue';
import About from './views/About.vue';
import Contact from './views/Contact.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/contact', component: Contact }
];
```

<details>
<summary>点击查看答案</summary>

```javascript
// ✅ 使用动态导入
const routes = [
  { 
    path: '/', 
    component: () => import('./views/Home.vue')
  },
  { 
    path: '/about', 
    component: () => import('./views/About.vue')
  },
  { 
    path: '/contact', 
    component: () => import('./views/Contact.vue')
  }
];
```

**优化点**：

1. 移除顶部的静态导入
2. 使用箭头函数 + `import()` 动态导入
3. 每个路由独立 chunk，按需加载

</details>

### 练习 3（挑战）：综合练习 - 构建优化配置

**题目**：为 Vite 项目配置完整的构建优化。

<details>
<summary>点击查看答案</summary>

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    vue(),
    // ✅ 构建产物分析
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true
    }),
    // ✅ Gzip 压缩
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz'
    }),
    // ✅ Brotli 压缩
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br'
    })
  ],
  build: {
    // ✅ 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          // ✅ 第三方库单独打包
          vendor: ['vue', 'vue-router', 'pinia'],
          // ✅ UI 库单独打包
          ui: ['element-plus']
        }
      }
    },
    // ✅ 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        // ✅ 生产环境移除 console
        drop_console: true,
        drop_debugger: true
      }
    },
    // ✅ CSS 压缩
    cssMinify: true,
    // ✅ 文件名带 Hash
    assetsDir: 'assets',
    // ✅ 目标浏览器
    target: 'es2015'
  }
});
```

**优化点**：

1. 使用 visualizer 分析构建产物
2. 预压缩 Gzip 和 Brotli
3. 手动分割代码（vendor、ui）
4. 使用 terser 移除 console
5. CSS 压缩
6. 文件名带 Hash（长期缓存）

</details>

---

## 下一章预告

下一章我们会学习 **缓存策略**——也就是如何利用浏览器缓存减少重复加载。

你会学到：

- HTTP 缓存机制（强缓存、协商缓存）
- Cache-Control 和 ETag 的配置
- Service Worker 离线缓存
- CDN 缓存策略

缓存是性能优化的"免费午餐"，配置好了可以大幅提升二次访问速度。
