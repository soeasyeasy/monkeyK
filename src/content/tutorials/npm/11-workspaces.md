---
title: "第十一章：工作区与 Monorepo"
description: "使用 npm workspaces 管理多包项目"
---

# 第十一章：工作区与 Monorepo

## 什么是 Monorepo

Monorepo 是将多个项目放在同一个仓库中管理的策略。

| 策略 | 说明 | 适用场景 |
| --- | --- | --- |
| Monorepo | 多项目单仓库 | 共享代码、统一版本 |
| Polyrepo | 多项目多仓库 | 独立发布、团队隔离 |

## npm workspaces

npm 7+ 内置支持 workspaces，无需额外工具。

### 项目结构

```
my-monorepo/
├── package.json          # 根配置
├── packages/
│   ├── ui/               # UI 组件库
│   │   ├── package.json
│   │   └── src/
│   ├── utils/            # 工具库
│   │   ├── package.json
│   │   └── src/
│   └── app/              # 应用
│       ├── package.json
│       └── src/
└── node_modules/         # 统一的依赖目录
```

### 根 package.json

```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

### 子包 package.json

```json
// packages/utils/package.json
{
  "name": "@myorg/utils",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "test": "vitest"
  }
}
```

```json
// packages/app/package.json
{
  "name": "@myorg/app",
  "version": "1.0.0",
  "dependencies": {
    "@myorg/utils": "^1.0.0",
    "vue": "^3.4.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

## 常用命令

### 安装依赖

```bash
# 安装所有工作区的依赖
npm install

# 为特定工作区安装依赖
npm install lodash --workspace=@myorg/utils
npm install vue --workspace=@myorg/app

# 简写
npm i lodash -w @myorg/utils
```

### 运行脚本

```bash
# 在所有工作区运行脚本
npm run build --workspaces
npm run build -ws

# 在特定工作区运行
npm run build --workspace=@myorg/utils
npm run build -w @myorg/utils

# 忽略缺失脚本
npm run build -ws --if-present
```

### 执行命令

```bash
# 在工作区执行任意命令
npm exec --workspace=@myorg/utils -- tsc --version

# 简写
npm exec -w @myorg/utils -- tsc --version
```

## 依赖提升

workspaces 会自动将依赖提升到根目录：

```
node_modules/
├── vue/              # @myorg/app 依赖
├── lodash/           # @myorg/utils 依赖
├── typescript/       # 根 devDependency
├── @myorg/
│   ├── utils -> ../packages/utils    # 符号链接
│   └── app -> ../packages/app        # 符号链接
```

## 包间引用

```javascript
// packages/app/src/main.js
import { formatDate } from '@myorg/utils'

// 直接引用，npm 会自动解析符号链接
```

## 版本管理

### 统一版本

```json
// 所有子包使用相同版本
{
  "version": "1.0.0"
}
```

### 独立版本

```json
// 每个子包独立版本
// packages/ui/package.json
{ "version": "2.1.0" }

// packages/utils/package.json
{ "version": "1.3.0" }
```

## 与工具集成

### TypeScript

```json
// tsconfig.base.json（根目录）
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "paths": {
      "@myorg/utils": ["./packages/utils/src"],
      "@myorg/ui": ["./packages/ui/src"]
    }
  }
}
```

```json
// packages/app/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

### ESLint

```javascript
// eslint.config.js（根目录）
export default [
  {
    ignores: ["**/node_modules/**", "**/dist/**"]
  },
  // 所有工作区共享配置
]
```

## 实际案例

### Vue 组件库 Monorepo

```
vue-component-lib/
├── package.json
├── packages/
│   ├── components/     # 组件库
│   ├── utils/          # 工具函数
│   ├── docs/           # 文档站点
│   └── playground/     # 开发 playground
└── tsconfig.base.json
```

## 最佳实践

1. **根目录设置 private: true**：防止意外发布
2. **共享开发依赖**：typescript、eslint 放在根目录
3. **统一构建工具**：使用相同的构建配置
4. **使用 changesets 管理版本**：自动化版本和 changelog
5. **CI/CD 优化**：只构建变更的包

## 下一步

下一章我们将学习 npm 缓存与性能优化。
