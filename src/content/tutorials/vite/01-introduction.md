---
title: "第一章：Vite 简介与快速上手"
description: "了解 Vite 是什么，为什么需要 Vite，以及如何快速创建项目"
---

# 第一章：Vite 简介与快速上手

## 什么是 Vite

Vite（法语意为"快速"）是一个下一代前端构建工具，由 Vue.js 的作者尤雨溪开发。它旨在提供更快速、更简洁的开发体验。

### Vite 的核心优势

| 特性 | 说明 |
| --- | --- |
| 极速启动 | 基于原生 ES 模块的开发服务器，无需打包即可启动 |
| 即时热更新 | HMR（热模块替换）速度快，修改代码立即生效 |
| 优化构建 | 使用 Rollup 进行生产环境构建，输出高度优化的代码 |
| 开箱即用 | 内置 TypeScript、JSX、CSS 模块等常用功能支持 |
| 插件生态 | 兼容 Rollup 插件，丰富的社区插件支持 |

## 为什么需要 Vite

### 传统构建工具的问题

在 Vite 之前，大多数前端项目使用 Webpack 作为构建工具。虽然 Webpack 功能强大，但存在以下问题：

1. **开发服务器启动慢**：需要打包整个项目才能启动
2. **热更新延迟**：项目越大，HMR 越慢
3. **配置复杂**：配置文件冗长且难以理解

### Vite 的解决方案

Vite 通过利用浏览器原生 ES 模块支持和现代工具链解决了这些问题：

- **开发时**：不打包代码，按需编译，实现秒级启动
- **生产时**：使用 Rollup 优化构建，确保输出质量

## 快速创建 Vite 项目

### 使用脚手架创建

```bash
# npm 6.x
npm create vite@latest my-vue-app --template vue

# npm 7+（需要额外的双横线）
npm create vite@latest my-vue-app -- --template vue

# yarn
yarn create vite my-vue-app --template vue

# pnpm
pnpm create vite my-vue-app --template vue
```

### 可用的模板

Vite 提供了多种框架模板：

- `vanilla`：纯 JavaScript 项目
- `vue`：Vue 3 项目
- `react`：React 项目
- `react-ts`：React + TypeScript 项目
- `preact`：Preact 项目
- `lit`：Lit 项目
- `svelte`：Svelte 项目

### 手动初始化

如果需要从零开始配置：

```bash
# 创建项目目录
mkdir my-vite-project
cd my-vite-project

# 初始化 package.json
npm init -y

# 安装 Vite
npm install -D vite

# 创建入口文件
echo '<!DOCTYPE html>
<html>
  <head>
    <title>My Vite App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/main.js"></script>
  </body>
</html>' > index.html

echo 'document.getElementById("app").innerHTML = "<h1>Hello Vite!</h1>"' > main.js
```

## 启动开发服务器

```bash
# 启动开发服务器
npm run dev

# 或指定端口
npx vite --port 3000

# 或指定主机
npx vite --host 0.0.0.0
```

启动后，你会看到类似输出：

```
  VITE v5.0.0  ready in 200 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## 构建生产版本

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

构建完成后，输出文件会保存在 `dist` 目录中。

## Vite 的工作原理

### 开发环境

开发时，Vite 将代码分为两类：

1. **源码**：你的应用代码（如 `.js`、`.vue` 文件）
2. **依赖**：第三方库（如 `vue`、`react`）

Vite 在开发服务器上为源码提供原生 ES 模块，浏览器按需请求和解析代码，无需打包整个应用。

### 生产环境

生产构建时，Vite 使用 Rollup 进行打包和优化，确保输出代码体积小、加载快。

## 与 Vue CLI 的对比

如果你之前使用 Vue CLI，以下是两者的对比：

| 功能 | Vue CLI | Vite |
| --- | --- | --- |
| 开发服务器 | Webpack dev server | 原生 ES 模块服务器 |
| 热更新速度 | 较慢（项目大时明显） | 极快 |
| 生产构建 | Webpack | Rollup |
| 配置复杂度 | 较高 | 较低 |
| 插件生态 | Vue CLI 插件 | Rollup 插件兼容 |

## 小结

本章介绍了 Vite 的基本概念、优势和使用场景。Vite 通过利用现代浏览器特性，提供了极速的开发体验，是构建现代前端应用的理想选择。

下一章我们将深入了解 Vite 的项目结构和配置选项。
