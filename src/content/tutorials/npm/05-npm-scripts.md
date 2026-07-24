---
title: '第五章：npm scripts'
description: '学习使用 npm scripts 自动化项目任务'
---

# 第五章：npm scripts

## 什么是 npm scripts

npm scripts 是定义在 `package.json` 中的命令别名，用于自动化开发、构建、测试等任务。

## 基础用法

### 定义脚本

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src/",
    "format": "prettier --write src/"
  }
}
```

### 运行脚本

```bash
# 运行 scripts 中定义的命令
npm run dev
npm run build
npm run test

# 简写（部分内置命令）
npm start    # 等同于 npm run start
npm test     # 等同于 npm run test
npm stop     # 等同于 npm run stop
npm restart  # 等同于 npm run restart
```

## 常用脚本示例

### Vue 项目

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts",
    "format": "prettier --write src/",
    "type-check": "vue-tsc --noEmit"
  }
}
```

### Node.js 项目

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/",
    "format": "prettier --write src/"
  }
}
```

## 脚本组合

### 串行执行（&&）

一个接一个执行，前一个失败则停止。

```json
{
  "scripts": {
    "build": "npm run clean && npm run compile && npm run bundle",
    "clean": "rimraf dist",
    "compile": "tsc",
    "bundle": "rollup -c"
  }
}
```

### 并行执行（&）

同时执行多个命令。

```json
{
  "scripts": {
    "dev:all": "npm run dev:server & npm run dev:client",
    "dev:server": "nodemon server.js",
    "dev:client": "vite"
  }
}
```

### 使用 concurrently

更好的并行执行体验：

```bash
npm install -D concurrently
```

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "nodemon server.js",
    "dev:client": "vite"
  }
}
```

### 使用 npm-run-all

```bash
npm install -D npm-run-all
```

```json
{
  "scripts": {
    "build": "run-s clean compile bundle",
    "dev": "run-p dev:server dev:client",
    "clean": "rimraf dist",
    "compile": "tsc",
    "bundle": "rollup -c",
    "dev:server": "nodemon server.js",
    "dev:client": "vite"
  }
}
```

## 生命周期脚本

npm 会在特定时机自动执行某些脚本：

| 脚本名        | 触发时机                              |
| ------------- | ------------------------------------- |
| `preinstall`  | 安装前                                |
| `install`     | 安装后                                |
| `postinstall` | 安装完成后                            |
| `prepublish`  | 发布前                                |
| `prepare`     | 发布前 / 安装后（无参数 npm install） |
| `pretest`     | 运行 test 前                          |
| `test`        | 运行测试                              |
| `posttest`    | 运行测试后                            |
| `prestart`    | 运行 start 前                         |
| `start`       | 启动服务                              |
| `poststart`   | 启动服务后                            |

### 示例

```json
{
  "scripts": {
    "preinstall": "echo 'Installing...'",
    "postinstall": "echo 'Installed!'",
    "prepare": "npm run build",
    "pretest": "npm run lint",
    "test": "vitest",
    "posttest": "echo 'Tests complete!'"
  }
}
```

## 传递参数

### 向脚本传递参数

```bash
# 使用 -- 分隔 npm 参数和脚本参数
npm run dev -- --port 3000
npm run build -- --mode production

# 等同于直接运行
vite --port 3000
vite build --mode production
```

### 在脚本中使用环境变量

```json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development vite",
    "build:prod": "cross-env NODE_ENV=production vite build"
  }
}
```

需要安装 `cross-env`：

```bash
npm install -D cross-env
```

## 预置和后置钩子

npm 支持为自定义脚本添加 `pre` 和 `post` 钩子：

```json
{
  "scripts": {
    "build": "vite build",
    "prebuild": "npm run clean && npm run type-check",
    "postbuild": "echo 'Build complete!'",
    "clean": "rimraf dist",
    "type-check": "vue-tsc --noEmit"
  }
}
```

运行 `npm run build` 时会自动执行：

1. `prebuild`（清理 + 类型检查）
2. `build`（构建）
3. `postbuild`（输出完成信息）

## 环境变量

npm 会在脚本中注入一些环境变量：

```json
{
  "scripts": {
    "show-env": "echo $npm_package_name && echo $npm_package_version"
  }
}
```

常用环境变量：

| 变量                  | 说明       |
| --------------------- | ---------- |
| `npm_package_name`    | 包名       |
| `npm_package_version` | 版本号     |
| `npm_config_*`        | npm 配置项 |
| `NODE_ENV`            | Node 环境  |

## 最佳实践

1. **保持脚本简洁**：复杂逻辑提取到单独脚本文件
2. **使用有意义的名称**：`build:prod`、`test:unit`、`lint:fix`
3. **利用钩子自动化**：`prebuild`、`prepublish` 等
4. **跨平台兼容**：使用 `cross-env` 设置环境变量
5. **文档化脚本**：在 README 中说明常用脚本

## 下一步

下一章我们将学习全局安装与本地安装的区别。
