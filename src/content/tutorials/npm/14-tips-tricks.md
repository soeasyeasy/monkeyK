---
title: "第十四章：常见命令与技巧"
description: "实用命令合集、调试技巧与故障排查"
---

# 第十四章：常见命令与技巧

## 常用命令速查

### 项目管理

```bash
# 初始化项目
npm init -y

# 安装所有依赖
npm install

# 清理重装
rm -rf node_modules package-lock.json && npm install

# 查看已安装包
npm list --depth=0

# 查看过期依赖
npm outdated
```

### 包信息

```bash
# 查看包详情
npm info vue

# 查看所有版本
npm view vue versions

# 查看最新版本
npm view vue version

# 查看最近发布
npm view vue time --json

# 查看包依赖
npm view vue dependencies

# 查看谁依赖了某包
npm view vue dependents
```

### 搜索与发现

```bash
# 搜索包
npm search vue component

# 按关键词搜索
npm search --tags vue3

# 查看热门包
npm stars
```

### 用户管理

```bash
# 查看当前用户
npm whoami

# 查看用户信息
npm profile get

# 修改密码
npm profile set password

# 查看发布的包
npm profile get --json | jq '.packages'
```

## 调试技巧

### 1. 查看安装过程

```bash
# 详细输出
npm install --verbose

# 查看网络请求
npm install --loglevel silly
```

### 2. 查看包内容

```bash
# 预览发布内容
npm pack --dry-run

# 解压查看
tar -xzf package-name-1.0.0.tgz
```

### 3. 查看依赖树

```bash
# 查看完整依赖树
npm list

# 查看为什么安装了某包
npm explain vue

# 查看包的安装路径
npm ls vue
```

### 4. 查看配置

```bash
# 查看所有配置
npm config list

# 查看完整配置（含默认值）
npm config list -l

# 查看特定配置
npm config get registry
```

## 故障排查

### ERESOLVE 错误

```bash
# 查看冲突详情
npm explain <package>

# 使用 --legacy-peer-deps 临时解决
npm install --legacy-peer-deps

# 或使用 overrides 永久解决
```

### ENOENT 错误

```bash
# 通常是路径问题
# 清理重装
rm -rf node_modules
npm install
```

### EACCES 权限错误

```bash
# macOS/Linux
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# 或使用 nvm 避免权限问题
```

### 网络超时

```bash
# 增加超时时间
npm config set fetch-timeout 120000

# 增加重试次数
npm config set fetch-retries 5

# 切换镜像源
npm config set registry https://registry.npmmirror.com/
```

## 实用技巧

### 1. 快速创建项目

```bash
# 使用 create-xxx 模板
npm create vite@latest my-app
npm create vue@latest my-app
npm create react-app my-app
```

### 2. 执行本地命令

```bash
# 使用 npx
npx tsc --version
npx vite --port 3000

# 指定版本
npx create-vite@5 my-app
```

### 3. 别名命令

```bash
# .bashrc / .zshrc
alias ni='npm install'
alias nrd='npm run dev'
alias nrb='npm run build'
```

### 4. 查看包大小

```bash
# 使用 bundlephobia（网页）
# https://bundlephobia.com/package/vue

# 或使用命令行
npx package-size vue
```

### 5. 比较包

```bash
# 使用 bundlejs（网页）
# https://bundlejs.com/?q=vue,react
```

## npm 配置大全

```bash
# 常用配置
npm config set registry <url>           # 镜像源
npm config set cache <path>             # 缓存目录
npm config set prefix <path>            # 全局安装路径
npm config set proxy <url>              # HTTP 代理
npm config set https-proxy <url>        # HTTPS 代理
npm config set maxsockets <num>         # 最大并发数
npm config set loglevel <level>         # 日志级别
npm config set save-exact <bool>        # 精确版本
npm config set engine-strict <bool>     # 严格引擎检查
npm config set fund <bool>              # 显示赞助信息
npm config set audit <bool>             # 自动审计
```

## 下一步

下一章我们将对比 npm、yarn 和 pnpm。
