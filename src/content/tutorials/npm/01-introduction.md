---
title: "第一章：npm 简介与安装"
description: "了解 npm 是什么，安装 Node.js 与 npm，配置国内镜像"
---

# 第一章：npm 简介与安装

## 什么是 npm

npm（Node Package Manager）是 Node.js 的包管理工具，也是世界上最大的软件注册表。它允许开发者：

| 功能 | 说明 |
| --- | --- |
| 包管理 | 安装、更新、卸载第三方依赖包 |
| 项目管理 | 通过 package.json 管理项目配置和依赖 |
| 脚本运行 | 执行自定义的 npm scripts |
| 包发布 | 将自己的代码发布为包供他人使用 |

## 安装 Node.js

npm 随 Node.js 一起安装，因此只需安装 Node.js 即可。

### Windows 安装

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS（长期支持）版本
3. 运行安装程序，按提示完成安装

### macOS 安装

```bash
# 使用 Homebrew
brew install node

# 或使用官方安装包
# 访问 https://nodejs.org/ 下载 .pkg 文件
```

### Linux 安装

```bash
# Ubuntu / Debian
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS / RHEL
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo yum install -y nodejs
```

## 验证安装

```bash
# 查看 Node.js 版本
node -v

# 查看 npm 版本
npm -v

# 查看 npx 版本（npm 5.2+ 自带）
npx -v
```

## 配置国内镜像

由于 npm 默认源在国外，国内访问较慢，建议配置淘宝镜像：

```bash
# 临时使用
npm install <package> --registry=https://registry.npmmirror.com

# 永久设置
npm config set registry https://registry.npmmirror.com

# 验证配置
npm config get registry

# 恢复官方源
npm config set registry https://registry.npmjs.org/
```

## npm、npx、corepack 的区别

| 命令 | 说明 |
| --- | --- |
| `npm` | 包管理器本体 |
| `npx` | 执行本地或临时安装的包，无需全局安装 |
| `corepack` | Node.js 内置工具，管理 yarn/pnpm 等包管理器 |

## 常用命令速查

```bash
# 初始化项目
npm init

# 快速初始化（使用默认值）
npm init -y

# 安装所有依赖
npm install

# 安装指定包
npm install <package>

# 卸载包
npm uninstall <package>

# 查看已安装的包
npm list

# 查看全局安装的包
npm list -g

# 查看包信息
npm info <package>

# 运行脚本
npm run <script>
```

## 下一步

下一章我们将深入了解 `package.json` 文件的各个字段及其作用。
