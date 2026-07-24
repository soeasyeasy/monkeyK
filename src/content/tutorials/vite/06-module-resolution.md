---
title: "第六章：模块解析与别名"
description: "学习 Vite 中的路径别名、依赖预构建和外部化依赖处理"
---

# 第六章：模块解析与别名

## 路径别名

### 基础配置

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },
})
```

### 使用别名

```javascript
// 之前
import Component from '../../../components/Component.vue'
import { formatDate } from '../../../utils/date.js'

// 使用别名后
import Component from '@/components/Component.vue'
import { formatDate } from '@utils/date.js'
```

### 多个别名

```javascript
resolve: {
  alias: {
    '@': path.resolve(__dirname, 'src'),
    '~': path.resolve(__dirname, 'node_modules'),
    '@assets': path.resolve(__dirname, 'src/assets'),
    '@styles': path.resolve(__dirname, 'src/styles'),
  },
}
```

### TypeScript 支持

如果使用 TypeScript，需要同步配置 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

## 依赖预构建

### 什么是预构建

Vite 会在开发服务器启动时预构建依赖，将 CommonJS 或 UMD 格式的依赖转换为 ESM 格式。

### 配置预构建

```javascript
export default defineConfig({
  optimizeDeps: {
    // 包含特定依赖
    include: ['lodash-es', 'axios'],

    // 排除特定依赖
    exclude: ['some-dep'],

    // 强制预构建
    force: true,
  },
})
```

### 预构建缓存

预构建的结果会缓存在 `node_modules/.vite` 目录中。

```bash
# 清除缓存
rm -rf node_modules/.vite

# 或强制重新预构建
vite --force
```

### 预构建选项

```javascript
optimizeDeps: {
  // 入口文件
  entries: ['index.html', 'src/main.js'],

  // 扩展名
  extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx'],

  // 是否生成 sourcemap
  sourcemap: false,

  // esbuild 选项
  esbuildOptions: {
    target: 'es2020',
  },
}
```

## 外部化依赖

### 构建时排除

```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['vue', 'react', 'lodash'],
    },
  },
})
```

### 配置全局变量

```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
```

### CDN 引入

```html
<!-- index.html -->
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<script type="module">
  import { createApp } from 'vue'
  // vue 会从全局变量 Vue 中获取
</script>
```

## 模块解析顺序

Vite 的模块解析顺序：

1. 绝对路径
2. 相对路径
3. 路径别名
4. node_modules

### 自定义解析顺序

```javascript
resolve: {
  // 解析顺序
  conditions: ['import', 'module', 'browser', 'default'],

  // 主字段
  mainFields: ['module', 'jsnext:main', 'jsnext', 'main'],
}
```

## 文件扩展名

### 配置扩展名

```javascript
resolve: {
  extensions: ['.js', '.ts', '.jsx', '.tsx', '.vue', '.json'],
}
```

### 使用

```javascript
// 可以省略扩展名
import Component from './Component'
import utils from './utils'
```

## 条件导出

### package.json 中的导出

```json
{
  "name": "my-package",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"
    },
    "./utils": {
      "import": "./dist/utils.mjs",
      "require": "./dist/utils.cjs"
    }
  }
}
```

### Vite 解析

```javascript
resolve: {
  conditions: ['import', 'module', 'browser', 'default'],
}
```

## 浏览器兼容性

### 配置目标

```javascript
export default defineConfig({
  build: {
    target: 'es2015', // 或 'es2020', 'esnext' 等
  },
})
```

### 开发环境

```javascript
optimizeDeps: {
  esbuildOptions: {
    target: 'es2020',
  },
}
```

## 模块联邦

### 使用 @originjs/vite-plugin-federation

```bash
npm install -D @originjs/vite-plugin-federation
```

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    federation({
      name: 'app',
      remotes: {
        remoteApp: 'http://localhost:3001/remoteEntry.js',
      },
      shared: ['vue'],
    }),
  ],
})
```

## 常见问题

### 别名不生效

1. 检查配置是否正确
2. 重启开发服务器
3. 清除缓存

```bash
rm -rf node_modules/.vite
```

### TypeScript 路径不生效

确保 `tsconfig.json` 和 `vite.config.js` 配置一致。

### 循环依赖

```javascript
// 使用动态导入避免循环依赖
const module = await import('./module.js')
```

### 大依赖优化

```javascript
optimizeDeps: {
  // 排除大依赖
  exclude: ['large-dep'],

  // 或使用 CDN
}
```

## 小结

本章介绍了 Vite 的模块解析机制，包括路径别名、依赖预构建、外部化依赖等配置。合理配置模块解析可以提升开发效率和构建性能。

下一章我们将学习 Vite 的环境变量和模式配置。
