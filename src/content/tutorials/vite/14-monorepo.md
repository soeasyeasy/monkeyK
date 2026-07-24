---
title: "第十四章：Monorepo 支持"
description: "学习 Vite 中的工作区配置、共享依赖和统一构建"
---

# 第十四章：Monorepo 支持

## Monorepo 基础

### 什么是 Monorepo

Monorepo 是指在一个仓库中管理多个项目的代码组织方式。

### Monorepo 的优势

| 优势 | 说明 |
| --- | --- |
| 代码共享 | 轻松共享组件、工具函数 |
| 统一构建 | 统一的构建配置和工具链 |
| 依赖管理 | 统一版本管理，避免版本冲突 |
| 原子提交 | 跨项目修改可以原子提交 |

## npm Workspaces

### 基础配置

```json
// package.json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "packages/*"
  ]
}
```

### 目录结构

```
my-monorepo/
├── packages/
│   ├── app/              # 应用
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.js
│   ├── ui/               # UI 组件库
│   │   ├── src/
│   │   └── package.json
│   └── utils/            # 工具函数库
│       ├── src/
│       └── package.json
├── package.json
└── vite.config.js
```

### 包配置

```json
// packages/ui/package.json
{
  "name": "@my-monorepo/ui",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts"
}
```

```json
// packages/utils/package.json
{
  "name": "@my-monorepo/utils",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs"
}
```

```json
// packages/app/package.json
{
  "name": "@my-monorepo/app",
  "version": "1.0.0",
  "dependencies": {
    "@my-monorepo/ui": "workspace:*",
    "@my-monorepo/utils": "workspace:*"
  }
}
```

### 安装依赖

```bash
# 安装所有依赖
npm install

# 安装特定包的依赖
npm install lodash --workspace=@my-monorepo/app
```

## Vite 配置

### 根目录配置

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@my-monorepo/ui': resolve(__dirname, 'packages/ui/src'),
      '@my-monorepo/utils': resolve(__dirname, 'packages/utils/src'),
    },
  },
})
```

### 应用配置

```javascript
// packages/app/vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      external: ['@my-monorepo/ui', '@my-monorepo/utils'],
    },
  },
})
```

### 库配置

```javascript
// packages/ui/vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'UI',
      fileName: 'ui',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
```

## 共享依赖

### 统一版本管理

```json
// package.json
{
  "devDependencies": {
    "vite": "^5.0.0",
    "vue": "^3.4.0"
  }
}
```

### 提升依赖

```json
// package.json
{
  "workspaces": [
    "packages/*"
  ],
  "devDependencies": {
    "vite": "^5.0.0",
    "vue": "^3.4.0"
  }
}
```

### 依赖提升规则

```bash
# 查看提升的依赖
npm ls --depth=0

# 强制提升
npm install --workspace=@my-monorepo/app --install-links
```

## 统一构建

### 根目录构建脚本

```json
// package.json
{
  "scripts": {
    "dev": "npm run dev --workspace=@my-monorepo/app",
    "build": "npm run build --workspaces",
    "build:app": "npm run build --workspace=@my-monorepo/app",
    "build:ui": "npm run build --workspace=@my-monorepo/ui",
    "build:utils": "npm run build --workspace=@my-monorepo/utils"
  }
}
```

### 构建顺序

```json
// package.json
{
  "scripts": {
    "build": "npm run build:utils && npm run build:ui && npm run build:app"
  }
}
```

### 并行构建

```bash
# 使用 concurrently
npm install -D concurrently
```

```json
{
  "scripts": {
    "build": "concurrently \"npm:build:*\""
  }
}
```

## 共享配置

### 共享 Vite 配置

```javascript
// configs/vite.base.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': process.cwd() + '/src',
    },
  },
})
```

```javascript
// packages/app/vite.config.js
import { defineConfig, mergeConfig } from 'vite'
import baseConfig from '../../configs/vite.base.js'

export default mergeConfig(
  baseConfig,
  defineConfig({
    // 应用特定配置
  })
)
```

### 共享 ESLint 配置

```javascript
// configs/eslint.base.js
module.exports = {
  extends: ['eslint:recommended', 'plugin:vue/vue3-recommended'],
  rules: {
    // 共享规则
  },
}
```

```javascript
// packages/app/.eslintrc.js
module.exports = {
  extends: ['../../configs/eslint.base.js'],
  // 应用特定规则
}
```

## TypeScript 支持

### 共享 tsconfig

```json
// configs/tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

```json
// packages/app/tsconfig.json
{
  "extends": "../../configs/tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"]
}
```

### 项目引用

```json
// tsconfig.json
{
  "references": [
    { "path": "./packages/app" },
    { "path": "./packages/ui" },
    { "path": "./packages/utils" }
  ]
}
```

## 常见模式

### 应用 + 库模式

```
my-monorepo/
├── apps/
│   ├── web/              # Web 应用
│   └── mobile/           # 移动应用
├── packages/
│   ├── ui/               # UI 组件库
│   ├── utils/            # 工具函数库
│   └── config/           # 共享配置
└── package.json
```

### 微前端模式

```
my-monorepo/
├── apps/
│   ├── main/             # 主应用
│   ├── app1/             # 子应用 1
│   └── app2/             # 子应用 2
├── packages/
│   ├── shared/           # 共享代码
│   └── components/       # 共享组件
└── package.json
```

## 常见问题

### 依赖版本冲突

```bash
# 查看依赖树
npm ls --all

# 强制使用特定版本
npm install vue@3.4.0 --workspace=@my-monorepo/app
```

### 构建顺序问题

```json
{
  "scripts": {
    "build": "npm run build:utils && npm run build:ui && npm run build:app"
  }
}
```

### 热更新不生效

```javascript
// vite.config.js
export default defineConfig({
  server: {
    watch: {
      // 监听工作区文件
      ignored: ['!**/node_modules/**', '!**/dist/**'],
    },
  },
})
```

## 小结

本章介绍了 Vite 中的 Monorepo 支持，包括工作区配置、共享依赖和统一构建。Monorepo 可以提升大型项目的开发效率和代码复用。

下一章我们将学习 Vite 的自定义插件开发。
