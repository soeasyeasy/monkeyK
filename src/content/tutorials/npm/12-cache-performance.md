---
title: "第十二章：缓存与性能优化"
description: "理解 npm 缓存机制，优化安装性能"
---

# 第十二章：缓存与性能优化

## npm 缓存机制

npm 会缓存下载的包，避免重复下载。

### 缓存位置

```bash
# 查看缓存目录
npm config get cache

# Windows: %AppData%\npm-cache
# macOS/Linux: ~/.npm
```

### 缓存结构

```
~/.npm/
├── _cacache/
│   ├── content-v2/
│   │   └── sha512/
│   │       └── <hash>    # 包内容
│   └── index-v5/
│       └── <hash>        # 索引
└── _logs/                # 日志文件
```

## 缓存命令

```bash
# 查看缓存信息
npm cache ls

# 验证缓存完整性
npm cache verify

# 清理缓存
npm cache clean --force
```

## 镜像源配置

### 常用镜像源

| 镜像 | 地址 | 说明 |
| --- | --- | --- |
| 官方 | https://registry.npmjs.org/ | 最稳定 |
| 淘宝 | https://registry.npmmirror.com/ | 国内最快 |
| 华为云 | https://mirrors.huaweicloud.com/repository/npm/ | 备选 |

### 配置方式

```bash
# 永久设置
npm config set registry https://registry.npmmirror.com/

# 临时使用
npm install vue --registry=https://registry.npmmirror.com/

# 查看当前配置
npm config get registry
```

### .npmrc 配置

```ini
# 项目级 .npmrc
registry=https://registry.npmmirror.com/

# 用户级 ~/.npmrc
registry=https://registry.npmmirror.com/
```

## 性能优化

### 1. 使用 npm ci

```bash
# CI/CD 环境使用 npm ci
npm ci

# 优势：
# - 更快（跳过依赖解析）
# - 更可靠（严格匹配 lock 文件）
```

### 2. 并行安装

```bash
# npm 默认并行安装
# 可通过配置调整
npm config set maxsockets 50
```

### 3. 忽略可选依赖

```bash
# 跳过可选依赖
npm install --no-optional

# 或配置
npm config set optional false
```

### 4. 使用缓存

```bash
# 离线安装（使用缓存）
npm install --prefer-offline

# 强制使用缓存
npm install --offline
```

### 5. 减少网络请求

```bash
# 使用 --prefer-offline
npm install --prefer-offline

# 使用本地包
npm install ./local-package.tgz
```

## 日志与调试

### 日志级别

```bash
# 设置日志级别
npm config set loglevel verbose

# 日志级别：
# silent - 只显示错误
# error - 只显示错误和警告
# warn - 默认
# notice - 重要信息
# info - 一般信息
# verbose - 详细信息
# silly - 最详细
```

### 查看日志

```bash
# 日志位置
ls ~/.npm/_logs/

# 查看最新日志
cat ~/.npm/_logs/*-debug-0.log
```

### 调试安装问题

```bash
# 详细输出
npm install --verbose

# 最详细输出
npm install --loglevel silly

# 查看网络请求
npm install --fetch-retries 5
```

## 网络配置

### 代理设置

```bash
# HTTP 代理
npm config set proxy http://proxy.company.com:8080

# HTTPS 代理
npm config set https-proxy http://proxy.company.com:8080

# 无代理
npm config set noproxy "*"
```

### 超时设置

```bash
# 请求超时
npm config set fetch-timeout 60000

# 重试次数
npm config set fetch-retries 5

# 重试因子
npm config set fetch-retry-factor 10
```

## 常见问题

### 安装慢

```bash
# 1. 切换镜像源
npm config set registry https://registry.npmmirror.com/

# 2. 使用缓存
npm install --prefer-offline

# 3. 增加并发
npm config set maxsockets 50
```

### 缓存损坏

```bash
# 清理并重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 网络错误

```bash
# 检查代理
npm config get proxy
npm config get https-proxy

# 重置代理
npm config delete proxy
npm config delete https-proxy
```

## 最佳实践

1. **使用国内镜像源**：加速下载
2. **提交 package-lock.json**：利用缓存
3. **CI/CD 使用 npm ci**：更快更可靠
4. **定期清理缓存**：释放磁盘空间
5. **使用 .npmrc**：项目级配置统一

## 下一步

下一章我们将学习安全审计与漏洞修复。
