---
title: "第十章：库模式"
description: "学习如何使用 Vite 构建库，包括 UMD/ESM 格式和外部依赖处理"
---

# 第十章：库模式

## 基础配置

### 启用库模式

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'MyLibrary',
      fileName: 'my-library',
    },
  },
})
```

### 入口文件

```javascript
// src/index.js
export function hello() {
  return 'Hello from my library!'
}

export function add(a, b) {
  return a + b
}
```

## 输出格式

### 多种格式

```javascript
build: {
  lib: {
    entry: resolve(__dirname, 'src/index.js'),
    name: 'MyLibrary',
    fileName: (format) => `my-library.${format}.js`,
    formats: ['es', 'cjs', 'umd', 'iife'],
  },
}
```

### 格式说明

| 格式 | 说明 | 使用场景 |
| --- | --- | --- |
| `es` | ES Module | 现代打包工具 |
| `cjs` | CommonJS | Node.js |
| `umd` | Universal Module Definition | 浏览器和 Node.js |
| `iife` | Immediately Invoked Function Expression | 浏览器 `<script>` |

## 外部依赖

### 排除依赖

```javascript
build: {
  lib: {
    entry: resolve(__dirname, 'src/index.js'),
    name: 'MyLibrary',
    fileName: 'my-library',
  },
  rollupOptions: {
    // 排除不需要打包的依赖
    external: ['vue', 'react'],
    output: {
      // 提供全局变量名
      globals: {
        vue: 'Vue',
        react: 'React',
      },
    },
  },
}
```

### package.json 配置

```json
{
  "name": "my-library",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/my-library.cjs.js",
  "module": "./dist/my-library.es.js",
  "exports": {
    ".": {
      "import": "./dist/my-library.es.js",
      "require": "./dist/my-library.cjs.js"
    }
  },
  "files": [
    "dist"
  ],
  "peerDependencies": {
    "vue": "^3.0.0"
  }
}
```

## CSS 处理

### 提取 CSS

```javascript
build: {
  lib: {
    entry: resolve(__dirname, 'src/index.js'),
    name: 'MyLibrary',
    fileName: 'my-library',
  },
  rollupOptions: {
    output: {
      // 提取 CSS 到单独文件
      assetFileNames: 'my-library.[ext]',
    },
  },
}
```

### 内联 CSS

```javascript
import './style.css'

export function init() {
  // CSS 会被内联
}
```

## TypeScript 支持

### 生成类型声明

```bash
npm install -D vite-plugin-dts
```

```javascript
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      include: ['src'],
      outputDir: 'dist',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MyLibrary',
      fileName: 'my-library',
    },
  },
})
```

## 多入口

### 多个入口文件

```javascript
build: {
  lib: {
    entry: {
      index: resolve(__dirname, 'src/index.js'),
      utils: resolve(__dirname, 'src/utils.js'),
      components: resolve(__dirname, 'src/components/index.js'),
    },
    name: 'MyLibrary',
    fileName: (format, entryName) => `${entryName}.${format}.js`,
  },
}
```

## 资源处理

### 图片资源

```javascript
build: {
  lib: {
    entry: resolve(__dirname, 'src/index.js'),
    name: 'MyLibrary',
    fileName: 'my-library',
  },
  rollupOptions: {
    output: {
      assetFileNames: 'assets/[name]-[hash][extname]',
    },
  },
}
```

### 内联小资源

```javascript
build: {
  assetsInlineLimit: 4096, // 4KB
}
```

## 发布库

### 准备发布

```bash
# 构建
npm run build

# 检查 dist 目录
ls dist

# 发布到 npm
npm publish
```

### .npmignore

```
src/
node_modules/
vite.config.js
*.log
```

### 版本管理

```bash
# 更新版本
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# 发布
npm publish
```

## 示例：Vue 组件库

### 目录结构

```
my-vue-lib/
├── src/
│   ├── components/
│   │   ├── Button.vue
│   │   └── Input.vue
│   ├── index.js
│   └── styles/
│       └── index.css
├── package.json
└── vite.config.js
```

### 入口文件

```javascript
// src/index.js
import './styles/index.css'

import Button from './components/Button.vue'
import Input from './components/Input.vue'

export { Button, Input }

export default {
  install(app) {
    app.component('MyButton', Button)
    app.component('MyInput', Input)
  },
}
```

### Vite 配置

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src'],
      outputDir: 'dist',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'MyVueLib',
      fileName: 'my-vue-lib',
    },
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

### package.json

```json
{
  "name": "my-vue-lib",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/my-vue-lib.cjs.js",
  "module": "./dist/my-vue-lib.es.js",
  "exports": {
    ".": {
      "import": "./dist/my-vue-lib.es.js",
      "require": "./dist/my-vue-lib.cjs.js"
    },
    "./dist/style.css": "./dist/style.css"
  },
  "files": ["dist"],
  "peerDependencies": {
    "vue": "^3.0.0"
  }
}
```

## 小结

本章介绍了如何使用 Vite 构建库，包括库模式配置、输出格式、外部依赖处理等。通过库模式可以轻松构建和发布 JavaScript 库。

下一章我们将学习 Vite 的服务端渲染。
