---
title: "第十五章：npm vs yarn vs pnpm"
description: "对比主流包管理器，选择最适合的工具"
---

# 第十五章：npm vs yarn vs pnpm

## 三大包管理器对比

| 特性 | npm | yarn | pnpm |
| --- | --- | --- | --- |
| 首次发布 | 2010 | 2016 | 2017 |
| 默认源 | npmjs.org | registry.yarnpkg.com | npmjs.org |
| 锁文件 | package-lock.json | yarn.lock | pnpm-lock.yaml |
| 工作区 | npm 7+ 支持 | yarn 1.x / berry | 原生支持 |
| 安装速度 | 中等 | 快 | 最快 |
| 磁盘占用 | 大 | 中等 | 最小 |
| 严格模式 | 否 | 否 | 是 |
| 内置 Node | 是 | 否（需 corepack） | 否（需 corepack） |

## npm

### 优势

- Node.js 内置，无需额外安装
- 社区最大，文档最全
- 持续改进，性能提升明显

### 劣势

- 安装速度相对较慢
- 磁盘占用较大（每个项目独立 node_modules）
- 幽灵依赖问题

### 适用场景

- 小型项目
- 不想引入额外工具
- 团队统一使用 npm

## yarn

### 安装

```bash
# 使用 corepack（推荐）
corepack enable
corepack prepare yarn@stable --activate

# 或使用 npm
npm install -g yarn
```

### Yarn 1.x（Classic）

```bash
# 常用命令
yarn install
yarn add vue
yarn add -D typescript
yarn remove vue
yarn upgrade vue
yarn run dev

# 工作区
# package.json
{
  "private": true,
  "workspaces": ["packages/*"]
}
```

### Yarn Berry（2.x+）

```bash
# 启用 Berry
yarn set version berry

# Plug'n'Play（PnP）模式
# 不使用 node_modules，直接引用 .zip 文件
yarn install

# 切换回 node_modules 模式
# .yarnrc.yml
nodeLinker: node-modules
```

### yarn.lock 格式

```yaml
# yarn.lock
vue@^3.4.0:
  version "3.4.15"
  resolved "https://registry.yarnpkg.com/vue/-/vue-3.4.15.tgz#abc123"
  integrity sha512-xxx
  dependencies:
    "@vue/compiler-dom" "3.4.15"
```

## pnpm

### 安装

```bash
# 使用 corepack（推荐）
corepack enable
corepack prepare pnpm@latest --activate

# 或使用 npm
npm install -g pnpm
```

### 常用命令

```bash
# 安装依赖
pnpm install

# 添加依赖
pnpm add vue
pnpm add -D typescript

# 移除依赖
pnpm remove vue

# 运行脚本
pnpm dev
pnpm run build

# 更新依赖
pnpm update vue

# 查看过期依赖
pnpm outdated
```

### 核心优势

#### 1. 硬链接节省磁盘

```
store/                    # 全局存储
├── vue/3.4.15/           # 实际文件

node_modules/
└── .pnpm/
    └── vue@3.4.15/
        └── node_modules/
            └── vue -> ../../../../store/vue/3.4.15  # 硬链接
```

#### 2. 严格的依赖隔离

```
node_modules/
├── .pnpm/
│   ├── vue@3.4.15/
│   │   └── node_modules/
│   │       ├── vue/
│   │       └── @vue/compiler-dom/  # 只有 vue 能访问
│   └── lodash@4.17.21/
│       └── node_modules/
│           └── lodash/
├── vue -> .pnpm/vue@3.4.15/node_modules/vue      # 符号链接
└── lodash -> .pnpm/lodash@4.17.21/node_modules/lodash
```

**无法访问未声明的依赖**：

```javascript
// package.json 中没有声明 lodash
import _ from 'lodash' // ❌ pnpm 会报错
```

#### 3. 工作区

```json
// package.json
{
  "private": true,
  "pnpm": {
    "overrides": {
      "lodash": "^4.17.21"
    }
  }
}
```

```bash
# 工作区命令
pnpm --filter @myorg/utils build
pnpm --filter "./packages/**" test
```

### pnpm 特有功能

```bash
# 查看磁盘使用情况
pnpm store status

# 清理存储
pnpm store prune

# 查看为什么安装了某包
pnpm why vue

# 递归执行
pnpm -r run build
```

## 迁移指南

### npm → yarn

```bash
# 删除旧文件
rm -rf node_modules package-lock.json

# 安装
yarn install
```

### npm → pnpm

```bash
# 删除旧文件
rm -rf node_modules package-lock.json

# 安装
pnpm install
```

### yarn → pnpm

```bash
# 删除旧文件
rm -rf node_modules yarn.lock

# 安装
pnpm install
```

## 选择建议

| 场景 | 推荐 |
| --- | --- |
| 小型项目 / 快速原型 | npm |
| 大型项目 / Monorepo | pnpm |
| 已有 yarn 项目 | yarn |
| 追求性能 | pnpm |
| 严格依赖管理 | pnpm |
| 团队熟悉度 | 跟随团队 |

## 最佳实践

1. **团队统一工具**：不要混用包管理器
2. **提交锁文件**：无论使用哪个工具
3. **使用 corepack**：统一管理包管理器版本
4. **CI/CD 配置**：根据工具选择安装命令
5. **定期更新**：保持工具最新

## 下一步

下一章我们将学习 CI/CD 中的 npm 集成。
