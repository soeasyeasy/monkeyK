---
title: "第二章：package.json 详解"
description: "深入理解 package.json 文件的各个字段与配置"
---

# 第二章：package.json 详解

## 什么是 package.json

`package.json` 是 Node.js 项目的核心配置文件，位于项目根目录。它记录了项目的所有元信息和依赖关系。

## 生成 package.json

```bash
# 交互式创建（会逐步询问）
npm init

# 使用默认值快速创建
npm init -y

# 指定初始化文件
npm init -y --init-author-name "Your Name"
```

## 完整字段说明

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "description": "项目描述",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "vite",
    "build": "vite build",
    "test": "vitest"
  },
  "keywords": ["vue", "typescript"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {},
  "devDependencies": {},
  "peerDependencies": {},
  "engines": {
    "node": ">=18.0.0"
  },
  "private": true
}
```

## 核心字段详解

### name

包的名称，发布到 npm 时使用。

```json
{
  "name": "my-awesome-package"
}
```

规则：
- 必须小写
- 不能有空格
- 可以使用 `-` 和 `_` 分隔
- 不能与已有包同名

### version

遵循语义化版本规范（SemVer）：`主版本号.次版本号.补丁号`

```json
{
  "version": "1.2.3"
}
```

| 位置 | 含义 | 何时更新 |
| --- | --- | --- |
| 主版本号 | 不兼容的 API 变更 | 重大功能变化 |
| 次版本号 | 向下兼容的功能性新增 | 新增功能 |
| 补丁号 | 向下兼容的问题修正 | Bug 修复 |

### main

包的入口文件（CommonJS 模块）。

```json
{
  "main": "dist/index.js"
}
```

### type

模块系统类型。

```json
{
  "type": "module"
}
```

| 值 | 含义 |
| --- | --- |
| `"commonjs"` | 使用 `require()` / `module.exports`（默认） |
| `"module"` | 使用 `import` / `export` |

### scripts

定义可运行的命令别名。

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src/"
  }
}
```

运行方式：

```bash
npm run dev
npm run build
```

### dependencies

运行时依赖，项目运行必需的包。

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "axios": "^1.6.0"
  }
}
```

### devDependencies

开发时依赖，仅在开发环境使用。

```json
{
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

### peerDependencies

对等依赖，声明你的包需要宿主项目提供的依赖。

```json
{
  "peerDependencies": {
    "vue": "^3.0.0"
  }
}
```

### engines

指定 Node.js 版本要求。

```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### private

设为 `true` 时，npm 会拒绝发布此包。

```json
{
  "private": true
}
```

### keywords

包的关键词，用于 npm 搜索。

```json
{
  "keywords": ["vue", "typescript", "tutorial"]
}
```

### license

开源许可证。

```json
{
  "license": "MIT"
}
```

常见许可证：MIT、Apache-2.0、GPL-3.0、ISC

## 其他常用字段

### bin

指定可执行文件。

```json
{
  "bin": {
    "my-cli": "./bin/cli.js"
  }
}
```

### files

发布时包含的文件/目录。

```json
{
  "files": ["dist", "README.md", "LICENSE"]
}
```

### repository

代码仓库地址。

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/user/repo.git"
  }
}
```

### bugs

问题反馈地址。

```json
{
  "bugs": {
    "url": "https://github.com/user/repo/issues"
  }
}
```

### homepage

项目主页。

```json
{
  "homepage": "https://example.com"
}
```

## 最佳实践

1. **始终设置 `private: true`**：防止意外发布私有项目
2. **明确 engines 字段**：避免团队成员使用不兼容的 Node 版本
3. **合理区分 dependencies 和 devDependencies**：减小生产环境包体积
4. **使用有意义的 keywords**：提高包的可发现性
5. **保持 version 语义化**：遵循 SemVer 规范

## 下一步

下一章我们将学习如何管理项目依赖。
