---
title: "第二章：项目结构与配置"
description: "了解 Vite 项目的目录结构、vite.config.js 配置和基础配置项"
---

# 第二章：项目结构与配置

## 标准项目结构

一个典型的 Vite 项目结构如下：

```
my-vite-app/
├── node_modules/          # 依赖包
├── public/                # 静态资源（不经过构建处理）
│   └── favicon.ico
├── src/                   # 源代码目录
│   ├── assets/            # 资源文件（会经过构建处理）
│   ├── components/        # 组件
│   ├── App.vue            # 根组件
│   └── main.js            # 入口文件
├── index.html             # HTML 模板
├── package.json           # 项目配置
├── vite.config.js         # Vite 配置文件
└── README.md
```

### 关键目录说明

| 目录/文件 | 说明 |
| --- | --- |
| `public/` | 静态资源目录，文件会被原样复制到构建输出目录 |
| `src/` | 源代码目录，包含所有需要构建处理的代码 |
| `src/assets/` | 资源文件目录，如图片、字体等，会被构建工具处理 |
| `index.html` | HTML 入口文件，Vite 会处理其中的资源引用 |
| `vite.config.js` | Vite 配置文件（可选） |

## vite.config.js 配置

### 基础配置

```javascript
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  // 配置选项
})
```

### 常用配置项

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  // 插件配置
  plugins: [vue()],

  // 解析选项
  resolve: {
    // 路径别名
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
    },
    // 文件扩展名
    extensions: ['.js', '.ts', '.vue', '.json'],
  },

  // 服务器配置
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  // 构建选项
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
        },
      },
    },
  },

  // CSS 配置
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },
  },
})
```

## 配置详解

### resolve.alias（路径别名）

路径别名可以简化导入路径：

```javascript
// 没有别名时
import MyComponent from '../../../components/MyComponent.vue'

// 使用别名后
import MyComponent from '@/components/MyComponent.vue'
```

### resolve.extensions（文件扩展名）

配置后，导入时可以省略扩展名：

```javascript
// 可以这样写
import utils from './utils'

// 而不是
import utils from './utils.js'
```

### server.proxy（开发服务器代理）

用于解决开发环境的跨域问题：

```javascript
server: {
  proxy: {
    // 字符串简写
    '/api': 'http://localhost:8080',

    // 对象写法（更多选项）
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
      // 自定义请求头
      headers: {
        'X-Custom-Header': 'value',
      },
    },
  },
}
```

### build.outDir（输出目录）

指定构建输出目录，默认为 `dist`：

```javascript
build: {
  outDir: 'build', // 输出到 build 目录
}
```

### build.assetsDir（资源目录）

指定静态资源目录，相对于 `outDir`：

```javascript
build: {
  assetsDir: 'static', // 资源输出到 dist/static
}
```

### build.sourcemap（Source Map）

控制是否生成 source map：

```javascript
build: {
  sourcemap: true,      // 生成独立的 .map 文件
  sourcemap: 'inline',  // 内联 source map
  sourcemap: 'hidden',  // 生成 .map 但不引用
}
```

### build.minify（代码压缩）

控制代码压缩方式：

```javascript
build: {
  minify: 'terser',     // 使用 Terser（默认）
  minify: 'esbuild',    // 使用 esbuild（更快）
  minify: false,        // 不压缩
}
```

### build.rollupOptions（Rollup 配置）

自定义底层 Rollup 打包配置：

```javascript
build: {
  rollupOptions: {
    // 外部依赖（不打包）
    external: ['vue', 'react'],

    // 输出配置
    output: {
      // 手动分包
      manualChunks: {
        vendor: ['vue', 'vue-router'],
        utils: ['lodash', 'dayjs'],
      },

      // 文件名格式
      entryFileNames: 'js/[name]-[hash].js',
      chunkFileNames: 'js/[name]-[hash].js',
      assetFileNames: 'assets/[name]-[hash].[ext]',
    },

    // 插件
    plugins: [
      // Rollup 插件
    ],
  },
}
```

## 环境变量配置

Vite 使用 `defineConfig` 辅助函数，提供 TypeScript 类型提示：

```javascript
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd())

  return {
    // 根据命令区分配置
    ...(command === 'serve' && {
      // 开发环境配置
    }),
    ...(command === 'build' && {
      // 生产环境配置
    }),

    // 使用环境变量
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION),
    },
  }
})
```

## 多环境配置

可以通过创建多个配置文件来管理不同环境：

```
vite.config.js           # 基础配置
vite.config.dev.js       # 开发环境配置
vite.config.prod.js      # 生产环境配置
```

或者使用函数式配置：

```javascript
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

  return {
    // 默认配置
  }
})
```

## TypeScript 支持

如果使用 TypeScript，配置文件可以命名为 `vite.config.ts`：

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // ... 其他配置
})
```

Vite 会自动识别 `.ts` 配置文件并提供类型提示。

## 小结

本章介绍了 Vite 项目的标准结构和常用配置项。通过合理的项目结构和配置，可以让开发更加高效和便捷。

下一章我们将深入了解 Vite 开发服务器的配置和使用。
