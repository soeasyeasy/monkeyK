---
title: "第四章：静态资源处理"
description: "学习 Vite 如何处理图片、字体、JSON 等静态资源"
---

# 第四章：静态资源处理

## 资源分类

Vite 将资源分为两类：

| 类型 | 目录 | 处理方式 |
| --- | --- | --- |
| 公共资源 | `public/` | 原样复制到构建输出 |
| 模块资源 | `src/assets/` | 经过构建处理，生成哈希文件名 |

## 公共目录（public）

### 基本使用

`public` 目录中的文件在开发时可以直接通过根路径访问：

```
public/
├── favicon.ico
├── robots.txt
├── manifest.json
└── images/
    └── logo.png
```

在 HTML 中引用：

```html
<!-- index.html -->
<link rel="icon" href="/favicon.ico" />
<link rel="manifest" href="/manifest.json" />
<img src="/images/logo.png" alt="Logo" />
```

### 特点

- 文件不会被构建工具处理
- 文件名不会添加哈希
- 始终复制到构建输出根目录

### 适用场景

- `favicon.ico`、`manifest.json` 等必须固定路径的文件
- `robots.txt`
- 不需要被代码引用的静态文件

## 模块资源（src/assets）

### 导入资源

在 JavaScript 或 Vue 组件中导入资源：

```javascript
// 导入图片
import logo from './assets/logo.png'

// 使用
document.getElementById('logo').src = logo
```

```vue
<!-- Vue 组件 -->
<template>
  <img :src="logo" alt="Logo" />
</template>

<script setup>
import logo from './assets/logo.png'
</script>
```

### 构建输出

构建后，资源文件会被重命名为带哈希的文件：

```
dist/assets/logo-8f3a2b1c.png
```

这样做的好处：

- 缓存优化：文件内容变化时哈希变化
- 避免缓存问题
- 长期缓存友好

## 图片处理

### 支持的格式

Vite 支持以下图片格式：

- PNG (`.png`)
- JPEG (`.jpg`, `.jpeg`)
- SVG (`.svg`)
- GIF (`.gif`)
- WebP (`.webp`)
- AVIF (`.avif`)

### 内联小图片

小于 4KB 的图片会自动转为 base64 内联：

```javascript
import smallIcon from './assets/icon.png'
// 如果小于 4KB，会被转为 data:image/png;base64,...
```

### 修改内联阈值

```javascript
export default defineConfig({
  build: {
    assetsInlineLimit: 8192, // 8KB
  },
})
```

### 强制内联或引用

```javascript
// 强制内联（添加 ?inline）
import icon from './assets/icon.png?inline'

// 强制 URL 引用（添加 ?url）
import logo from './assets/logo.png?url'
```

## 字体文件

### 导入字体

```javascript
import myFont from './assets/fonts/MyFont.woff2'

// 使用
const fontFace = new FontFace('MyFont', `url(${myFont})`)
document.fonts.add(fontFace)
```

### CSS 中引用

```css
@font-face {
  font-family: 'MyFont';
  src: url('./assets/fonts/MyFont.woff2') format('woff2');
}
```

### 支持的字体格式

- WOFF2 (`.woff2`)
- WOFF (`.woff`)
- TTF (`.ttf`)
- OTF (`.otf`)
- EOT (`.eot`)

## JSON 文件

### 直接导入

```javascript
import data from './assets/data.json'

console.log(data)
```

### 导入特定字段

```javascript
import { version } from './package.json'

console.log(version)
```

## URL 资源引用

### 在 CSS 中

```css
.background {
  background-image: url('./assets/bg.png');
}

.icon {
  background: url('./assets/icon.svg') no-repeat center;
}
```

### 在 HTML 模板中

```vue
<template>
  <!-- 静态资源引用 -->
  <img src="./assets/logo.png" />

  <!-- 动态绑定 -->
  <img :src="logoUrl" />
</template>
```

### 在 JavaScript 中

```javascript
const imageUrl = new URL('./assets/image.png', import.meta.url).href
```

## 资源哈希

### 文件名格式

构建时，资源文件名会包含内容哈希：

```javascript
build: {
  rollupOptions: {
    output: {
      assetFileNames: 'assets/[name]-[hash][extname]',
    },
  },
}
```

### 自定义哈希

```javascript
build: {
  rollupOptions: {
    output: {
      // 使用短哈希
      assetFileNames: 'assets/[name]-[hash:8][extname]',
    },
  },
}
```

## 资源目录结构

### 推荐结构

```
src/
├── assets/
│   ├── images/          # 图片资源
│   │   ├── logos/
│   │   ├── backgrounds/
│   │   └── icons/
│   ├── fonts/           # 字体文件
│   ├── styles/          # 样式文件
│   │   ├── variables.css
│   │   └── global.css
│   └── data/            # 数据文件
│       └── config.json
```

### 按功能组织

```
src/
├── components/
│   ├── Header/
│   │   ├── index.vue
│   │   └── assets/
│   │       └── logo.png
│   └── Footer/
│       ├── index.vue
│       └── assets/
│           └── background.jpg
```

## 资源优化

### 图片优化

```javascript
import { defineConfig } from 'vite'
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
          {
            name: 'removeEmptyAttrs',
            active: false,
          },
        ],
      },
    }),
  ],
})
```

### 资源预加载

```html
<!-- index.html -->
<link rel="preload" href="/assets/critical.css" as="style" />
<link rel="preload" href="/assets/main.js" as="script" />
<link rel="prefetch" href="/assets/next-page.js" as="script" />
```

## 外部资源

### CDN 资源

```html
<!-- 使用外部 CDN -->
<script src="https://cdn.example.com/library.js"></script>
<link rel="stylesheet" href="https://cdn.example.com/style.css" />
```

### 排除外部资源

```javascript
build: {
  rollupOptions: {
    external: [
      'https://cdn.example.com/library.js',
    ],
  },
}
```

## 常见问题

### 资源路径问题

```javascript
// 错误：相对路径在构建后可能失效
const img = './assets/image.png'

// 正确：使用 import
import img from './assets/image.png'
```

### 动态资源引用

```javascript
// 错误：动态路径无法被构建工具分析
const img = import(`./assets/${name}.png`)

// 正确：使用 import.meta.glob
const modules = import.meta.glob('./assets/*.png', { eager: true })
const img = modules[`./assets/${name}.png`]
```

### 大文件处理

```javascript
// 对于大文件，考虑：
// 1. 使用 CDN
// 2. 懒加载
// 3. 压缩优化

import largeVideo from './assets/video.mp4?url'
// 使用 ?url 确保不会被内联
```

## 小结

本章介绍了 Vite 处理静态资源的方式，包括公共目录和模块资源的区别、图片、字体、JSON 等资源的处理方法。合理组织和使用资源可以提升应用性能和开发体验。

下一章我们将学习 Vite 中的 CSS 和预处理器支持。
