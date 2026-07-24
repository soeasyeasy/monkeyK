---
title: '第七章：node_modules 与模块解析'
description: '深入理解 node_modules 目录结构、模块查找机制与常见问题'
---

# 第七章：node_modules 与模块解析

## node_modules 是什么

`node_modules` 是 npm 安装依赖时创建的目录，存放项目所有依赖包。

```
my-project/
├── node_modules/
│   ├── vue/
│   ├── lodash/
│   └── axios/
├── package.json
└── package-lock.json
```

## 模块解析机制

### CommonJS 解析（require）

```javascript
const vue = require('vue')
```

查找顺序：

1. 如果 `vue` 是核心模块（如 `fs`、`path`），直接返回
2. 查找当前目录的 `node_modules/vue`
3. 未找到则向上级目录查找，直到根目录的 `node_modules`
4. 仍未找到则抛出 `MODULE_NOT_FOUND` 错误

### ES Modules 解析（import）

```javascript
import { createApp } from 'vue'
```

Node.js 的 ESM 解析与 CommonJS 类似，但浏览器中需要配置 `import map` 或使用构建工具。

## 包的主入口

npm 按以下顺序确定包的入口文件：

1. 读取 `package.json` 的 `main` 字段（CommonJS）
2. 读取 `package.json` 的 `module` 字段（ESM，构建工具识别）
3. 读取 `package.json` 的 `exports` 字段（现代方式）
4. 查找 `index.js`

### exports 字段

```json
{
  "name": "my-lib",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./utils": {
      "import": "./dist/utils.mjs",
      "require": "./dist/utils.cjs"
    }
  }
}
```

使用方式：

```javascript
import myLib from 'my-lib'
import { helper } from 'my-lib/utils'
```

## 扁平化结构（Hoisting）

npm 3+ 会将依赖提升到顶层，减少重复安装：

```
node_modules/
├── vue/              # 3.4.0
├── lodash/           # 4.17.21
├── some-lib/         # 依赖 lodash@^4.0.0
└── another-lib/      # 依赖 lodash@^4.17.0
```

### 何时嵌套？

当版本冲突时，npm 会在子目录中安装不同版本：

```
node_modules/
├── lodash/           # 4.17.21（顶层）
├── some-lib/
│   └── node_modules/
│       └── lodash/   # 3.10.1（版本冲突，嵌套安装）
└── another-lib/
```

## 幽灵依赖（Phantom Dependencies）

由于扁平化，可能意外引用未声明的依赖：

```javascript
// package.json 中没有声明 lodash
// 但 lodash 被其他包安装到了顶层
import _ from 'lodash' // 能运行，但不应依赖此行为
```

### 检测方法

```bash
# 使用 depcheck 检测未使用的依赖和幽灵依赖
npx depcheck
```

## .bin 目录

`node_modules/.bin` 存放可执行文件的符号链接：

```
node_modules/
├── .bin/
│   ├── vite -> ../vite/bin/vite.js
│   ├── tsc -> ../typescript/bin/tsc
│   └── eslint -> ../eslint/bin/eslint.js
└── vite/
```

npm scripts 运行时会自动将 `.bin` 加入 PATH：

```json
{
  "scripts": {
    "dev": "vite"
  }
}
```

## 符号链接（Symlinks）

本地包链接：

```bash
# 创建全局链接
npm link my-lib

# 在项目中使用
npm link my-lib
```

结果：

```
node_modules/
└── my-lib -> /usr/local/lib/node_modules/my-lib
# 或 Windows:
# node_modules/my-lib -> C:\Users\xxx\AppData\Roaming\npm\node_modules\my-lib
```

## node_modules 的体积问题

### 为什么这么大？

1. 包含所有依赖及其子依赖
2. 包含源码、文档、测试文件等
3. 扁平化结构导致重复

### 优化方法

```bash
# 1. 清理不必要的文件
npm prune

# 2. 使用 --production 只安装运行时依赖
npm install --production

# 3. 使用 pnpm（硬链接，大幅减少体积）
# pnpm 的 node_modules 通常比 npm 小 50%+
```

## 常见问题

### 删除后重新安装

```bash
# 清理重装（解决各种诡异问题）
rm -rf node_modules package-lock.json
npm install

# Windows PowerShell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

### 权限问题

```bash
# macOS/Linux
sudo chown -R $(whoami) node_modules

# 或重新安装
rm -rf node_modules
npm install
```

### 循环依赖

```bash
# 检测循环依赖
npx madge --circular src/
```

## .npmrc 配置

项目级 `.npmrc` 文件：

```ini
# .npmrc
registry=https://registry.npmmirror.com
save-exact=true
engine-strict=true
```

| 配置项          | 说明               |
| --------------- | ------------------ |
| `registry`      | 镜像源地址         |
| `save-exact`    | 安装时使用精确版本 |
| `engine-strict` | 严格检查 Node 版本 |
| `fund`          | 是否显示赞助信息   |
| `audit`         | 是否自动审计       |

## 最佳实践

1. **将 node_modules 加入 .gitignore**
2. **不要手动修改 node_modules**
3. **遇到问题先删除重装**
4. **使用 depcheck 检测幽灵依赖**
5. **理解 exports 字段**：现代包的标准入口方式

## 下一步

下一章我们将深入了解 package-lock.json 的作用。
