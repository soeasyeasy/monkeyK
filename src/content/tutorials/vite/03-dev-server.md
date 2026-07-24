---
title: "第三章：开发服务器"
description: "掌握 Vite 开发服务器的配置、HMR、代理和 HTTPS 设置"
---

# 第三章：开发服务器

## 基础配置

Vite 开发服务器通过 `server` 选项配置：

```javascript
// vite.config.js
export default defineConfig({
  server: {
    // 服务器端口
    port: 3000,

    // 是否自动打开浏览器
    open: true,

    // 服务器主机
    host: 'localhost',

    // 启用 HTTPS
    https: false,

    // CORS 配置
    cors: true,

    // 强制预转换
    force: false,
  },
})
```

## 端口与主机

### 指定端口

```javascript
server: {
  port: 8080,
}
```

### 命令行指定

```bash
# 指定端口
vite --port 8080

# 指定主机
vite --host 0.0.0.0

# 同时指定
vite --host 0.0.0.0 --port 8080
```

### 允许局域网访问

```javascript
server: {
  host: '0.0.0.0', // 允许外部访问
}
```

启动后会显示网络地址：

```
  VITE v5.0.0  ready in 200 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.100:3000/
```

## 自动打开浏览器

```javascript
server: {
  open: true, // 默认浏览器打开

  // 或指定浏览器
  open: '/Applications/Google Chrome.app',

  // 或指定路径
  open: {
    target: 'http://localhost:3000/about',
    app: true,
  },
}
```

## HTTPS 配置

### 使用内置配置

```javascript
server: {
  https: true,
}
```

Vite 会使用 `@vitejs/plugin-basic-ssl` 生成自签名证书。

### 使用自定义证书

```javascript
import fs from 'fs'

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('/path/to/key.pem'),
      cert: fs.readFileSync('/path/to/cert.pem'),
      ca: fs.readFileSync('/path/to/ca.pem'),
    },
  },
})
```

### 使用 mkcert

```bash
# 安装 mkcert
npm install -D @vitejs/plugin-basic-ssl

# vite.config.js
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [basicSsl()],
  server: {
    https: true,
  },
})
```

## 代理配置

### 基础代理

```javascript
server: {
  proxy: {
    // 字符串简写
    '/api': 'http://localhost:8080',
  },
}
```

### 高级代理配置

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}
```

### 多个代理规则

```javascript
server: {
  proxy: {
    // API 代理
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },

    // WebSocket 代理
    '/ws': {
      target: 'ws://localhost:8080',
      ws: true,
    },

    // 带认证的代理
    '/secure-api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      auth: 'user:password',
    },
  },
}
```

### 代理配置选项

| 选项 | 说明 |
| --- | --- |
| `target` | 代理目标地址 |
| `changeOrigin` | 修改请求头中的 `Origin` 字段 |
| `rewrite` | 重写请求路径 |
| `ws` | 是否代理 WebSocket |
| `auth` | 基本认证信息 |
| `headers` | 自定义请求头 |
| `configure` | 自定义代理实例 |

### 自定义代理配置

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      configure: (proxy, options) => {
        // 监听代理事件
        proxy.on('proxyReq', (proxyReq, req, res) => {
          console.log('Proxying:', req.url)
        })

        proxy.on('proxyRes', (proxyRes, req, res) => {
          console.log('Received response for:', req.url)
        })
      },
    },
  },
}
```

## HMR（热模块替换）

### 基础 HMR

Vite 默认启用 HMR，修改代码后会自动更新页面。

### 配置 HMR

```javascript
server: {
  hmr: {
    // 覆盖 WebSocket 端口
    port: 3001,

    // 指定主机
    host: 'localhost',

    // 指定协议
    protocol: 'ws', // 或 'wss'
  },
}
```

### 禁用 HMR

```javascript
server: {
  hmr: false,
}
```

### 客户端 HMR API

在代码中使用 HMR API：

```javascript
// 接受自身更新
if (import.meta.hot) {
  import.meta.hot.accept()
}

// 接受依赖更新
if (import.meta.hot) {
  import.meta.hot.accept('./module.js', (newModule) => {
    // 处理更新
  })
}

// 处理自定义事件
if (import.meta.hot) {
  import.meta.hot.on('custom-event', (data) => {
    console.log('Custom event:', data)
  })
}

// 处置清理
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    // 清理副作用
  })
}

// 拒绝更新
if (import.meta.hot) {
  import.meta.hot.decline()
}

// 检查更新
if (import.meta.hot) {
  import.meta.hot.invalidate()
}
```

## 服务器钩子

### configureServer

```javascript
export default defineConfig({
  configureServer(server) {
    // 添加自定义中间件
    server.middlewares.use((req, res, next) => {
      console.log('Request:', req.url)
      next()
    })

    // 访问底层 HTTP 服务器
    server.httpServer?.on('listening', () => {
      console.log('Server is listening')
    })
  },
})
```

### 添加 API 端点

```javascript
export default defineConfig({
  configureServer(server) {
    server.middlewares.use('/custom-api', (req, res) => {
      res.end('Custom API response')
    })
  },
})
```

## 静态文件服务

### 公共目录

`public` 目录中的文件会作为静态文件提供：

```
public/
├── favicon.ico
├── robots.txt
└── images/
    └── logo.png
```

访问方式：

```
http://localhost:3000/favicon.ico
http://localhost:3000/robots.txt
http://localhost:3000/images/logo.png
```

### 自定义静态目录

```javascript
export default defineConfig({
  publicDir: 'static', // 默认是 'public'
})
```

### 禁用静态文件服务

```javascript
export default defineConfig({
  publicDir: false,
})
```

## 文件系统历史

Vite 开发服务器支持文件系统历史，可以在浏览器中查看请求历史：

```javascript
server: {
  fs: {
    // 限制访问的目录
    allow: ['..'],

    // 严格模式
    strict: true,
  },
}
```

## 预转换选项

```javascript
server: {
  // 强制预转换所有模块
  force: true,

  // 忽略特定模块
  optimizeDeps: {
    exclude: ['some-dep'],
  },
}
```

## 常见问题

### 端口被占用

```javascript
server: {
  port: 3000,
  strictPort: true, // 端口被占用时退出而不是尝试下一个
}
```

### CORS 问题

```javascript
server: {
  cors: {
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  },
}
```

### WebSocket 连接失败

```javascript
server: {
  hmr: {
    // 在代理后面时配置
    clientPort: 443,
    path: '/hmr',
  },
}
```

## 小结

本章详细介绍了 Vite 开发服务器的各种配置选项，包括端口、HTTPS、代理、HMR 等。合理配置开发服务器可以大大提升开发体验。

下一章我们将学习 Vite 如何处理静态资源。
