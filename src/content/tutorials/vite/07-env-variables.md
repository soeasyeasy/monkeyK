---
title: "第七章：环境变量与模式"
description: "掌握 Vite 中的环境变量配置、.env 文件和多环境管理"
---

# 第七章：环境变量与模式

## 环境变量基础

### 在代码中使用

```javascript
// 访问环境变量
console.log(import.meta.env.VITE_APP_TITLE)
console.log(import.meta.env.VITE_API_URL)
```

### 内置环境变量

| 变量 | 说明 |
| --- | --- |
| `import.meta.env.MODE` | 当前模式（development/production） |
| `import.meta.env.BASE_URL` | 应用基础路径 |
| `import.meta.env.PROD` | 是否生产环境 |
| `import.meta.env.DEV` | 是否开发环境 |
| `import.meta.env.SSR` | 是否服务端渲染 |

## .env 文件

### 文件加载顺序

Vite 按以下顺序加载 `.env` 文件：

1. `.env` - 所有情况
2. `.env.local` - 所有情况，被 git 忽略
3. `.env.[mode]` - 指定模式
4. `.env.[mode].local` - 指定模式，被 git 忽略

### 文件示例

```bash
# .env
VITE_APP_TITLE=My App
VITE_API_URL=http://localhost:8080/api

# .env.development
VITE_API_URL=http://localhost:8080/api

# .env.production
VITE_API_URL=https://api.example.com

# .env.local（不提交到 git）
VITE_SECRET_KEY=your-secret-key
```

### 变量命名规则

- 必须以 `VITE_` 开头（可配置）
- 使用大写字母和下划线
- 值可以是字符串、数字、布尔值

```bash
# 正确
VITE_APP_TITLE=My App
VITE_API_URL=http://localhost:8080
VITE_ENABLE_FEATURE=true

# 错误（不会暴露到客户端）
API_URL=http://localhost:8080
SECRET_KEY=your-secret
```

## 模式（Mode）

### 默认模式

- `development`：开发服务器
- `production`：构建命令

### 指定模式

```bash
# 开发时指定模式
vite --mode staging

# 构建时指定模式
vite build --mode production
```

### 模式配置

```javascript
// vite.config.js
export default defineConfig(({ mode }) => {
  if (mode === 'development') {
    return {
      // 开发配置
    }
  }

  if (mode === 'production') {
    return {
      // 生产配置
    }
  }

  if (mode === 'staging') {
    return {
      // 预发布配置
    }
  }

  return {
    // 默认配置
  }
})
```

## 自定义环境变量前缀

```javascript
export default defineConfig({
  envPrefix: ['VITE_', 'CUSTOM_'],
})
```

```bash
# .env
VITE_APP_TITLE=My App
CUSTOM_API_URL=http://localhost:8080
```

```javascript
// 都可以访问
console.log(import.meta.env.VITE_APP_TITLE)
console.log(import.meta.env.CUSTOM_API_URL)
```

## 在 HTML 中使用

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
  <head>
    <title><%- VITE_APP_TITLE %></title>
  </head>
  <body>
    <div id="app"></div>
    <script>
      window.API_URL = '<%- VITE_API_URL %>'
    </script>
  </body>
</html>
```

## 在配置中使用

```javascript
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd())

  return {
    define: {
      // 全局常量
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION),
    },

    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
        },
      },
    },
  }
})
```

## 多环境配置

### 创建环境文件

```bash
# .env.development
VITE_API_URL=http://localhost:8080
VITE_APP_ENV=development

# .env.staging
VITE_API_URL=https://staging-api.example.com
VITE_APP_ENV=staging

# .env.production
VITE_API_URL=https://api.example.com
VITE_APP_ENV=production
```

### package.json 脚本

```json
{
  "scripts": {
    "dev": "vite",
    "dev:staging": "vite --mode staging",
    "build": "vite build",
    "build:staging": "vite build --mode staging",
    "preview": "vite preview"
  }
}
```

### 类型定义

```typescript
// env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_URL: string
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

## 环境变量类型

### 字符串

```bash
VITE_APP_TITLE=My App
```

### 数字

```bash
VITE_PORT=3000
```

```javascript
const port = Number(import.meta.env.VITE_PORT)
```

### 布尔值

```bash
VITE_ENABLE_FEATURE=true
```

```javascript
const enabled = import.meta.env.VITE_ENABLE_FEATURE === 'true'
```

### JSON

```bash
VITE_CONFIG={"key":"value","enabled":true}
```

```javascript
const config = JSON.parse(import.meta.env.VITE_CONFIG)
```

## 敏感信息处理

### 不要暴露敏感信息

```bash
# .env.local（不提交到 git）
VITE_SECRET_KEY=your-secret-key
```

### 使用服务端环境变量

```javascript
// vite.config.js
export default defineConfig({
  define: {
    // 只在构建时可用
    __SECRET_KEY__: JSON.stringify(process.env.SECRET_KEY),
  },
})
```

## 环境变量最佳实践

### 集中管理

```javascript
// src/config/env.js
export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL,
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 5000,
  },
  app: {
    title: import.meta.env.VITE_APP_TITLE,
    version: import.meta.env.VITE_APP_VERSION,
  },
  feature: {
    enableNewUI: import.meta.env.VITE_ENABLE_NEW_UI === 'true',
  },
}
```

### 使用配置

```javascript
import { config } from '@/config/env'

fetch(`${config.api.baseUrl}/users`)
```

## 常见问题

### 环境变量不生效

1. 检查变量名是否以 `VITE_` 开头
2. 重启开发服务器
3. 清除缓存

```bash
rm -rf node_modules/.vite
```

### 类型提示

```typescript
// env.d.ts
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // ... 其他变量
}
```

### 构建时替换

```javascript
build: {
  rollupOptions: {
    plugins: [
      {
        name: 'replace-env',
        transform(code) {
          return code.replace(/process\.env\.NODE_ENV/g, JSON.stringify(process.env.NODE_ENV))
        },
      },
    ],
  },
}
```

## 小结

本章介绍了 Vite 的环境变量配置，包括 `.env` 文件、模式管理、多环境配置等。合理使用环境变量可以让应用在不同环境中灵活配置。

下一章我们将学习 Vite 的插件系统。
