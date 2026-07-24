---
title: "第三章：依赖管理基础"
description: "学习如何安装、卸载和管理项目依赖"
---

# 第三章：依赖管理基础

## 安装依赖

### 安装所有依赖

```bash
# 根据 package.json 安装所有依赖
npm install
# 简写
npm i
```

### 安装指定包

```bash
# 安装到 dependencies（运行时依赖）
npm install vue
npm install vue@latest
npm install vue@3.4.0

# 安装到 devDependencies（开发依赖）
npm install -D typescript
npm install --save-dev vite

# 安装多个包
npm install vue axios lodash
```

### 从 package.json 安装

```bash
# 安装 production 依赖（不包含 devDependencies）
npm install --production
npm install --omit=dev
```

## 卸载依赖

```bash
# 卸载包（同时从 package.json 中移除）
npm uninstall vue
npm un vue

# 卸载开发依赖
npm uninstall -D typescript
```

## 更新依赖

```bash
# 更新到符合 package.json 中版本范围的最新版本
npm update

# 更新指定包
npm update vue

# 更新全局包
npm update -g typescript

# 查看过期依赖
npm outdated

# 交互式更新（使用 npm-check-updates）
npx npm-check-updates -i
```

## dependencies vs devDependencies

| 类型 | 说明 | 示例 | 何时使用 |
| --- | --- | --- | --- |
| dependencies | 运行时依赖 | vue, axios, lodash | 项目运行必需的包 |
| devDependencies | 开发时依赖 | typescript, vite, eslint | 仅开发/构建时需要的包 |

### 为什么区分两者？

1. **减小生产包体积**：部署时不安装开发依赖
2. **加快 CI/CD 速度**：生产环境只安装必要依赖
3. **清晰的职责分离**：明确哪些是运行必需，哪些是开发工具

### 实际场景

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "eslint": "^8.56.0"
  }
}
```

## 常用安装选项

### --save-exact / -E

精确安装指定版本，不使用版本范围符号。

```bash
# 安装 vue@3.4.0，package.json 中记录为 "3.4.0" 而非 "^3.4.0"
npm install -E vue@3.4.0
```

### --legacy-peer-deps

忽略 peer dependencies 冲突。

```bash
npm install --legacy-peer-deps
```

### --force

强制重新安装所有包。

```bash
npm install --force
```

### --no-save

安装包但不写入 package.json。

```bash
npm install lodash --no-save
```

## 查看依赖信息

```bash
# 查看已安装的包（树形结构）
npm list

# 查看全局安装的包
npm list -g

# 查看指定包的详细信息
npm list vue

# 查看深度（只显示第一层）
npm list --depth=0

# 查看包信息
npm info vue

# 查看包的所有版本
npm view vue versions
```

## 清理依赖

```bash
# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json
npm install

# Windows PowerShell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

## 依赖提升（Hoisting）

npm 会自动将依赖提升到顶层 `node_modules`，以减少重复安装。

```
node_modules/
├── vue/
├── lodash/
└── some-lib/
    └── node_modules/
        └── lodash/  # 版本冲突时才会嵌套
```

## 最佳实践

1. **始终使用 `npm install` 而非手动复制 node_modules**
2. **区分 dependencies 和 devDependencies**
3. **定期运行 `npm outdated` 检查过期依赖**
4. **使用 `npm ci` 进行 CI/CD 安装**（下一章详解）
5. **不要手动修改 package-lock.json**

## 下一步

下一章我们将深入理解版本控制与语义化版本规范。
