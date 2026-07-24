---
title: "第十三章：性能分析与调优"
description: "学习 Vite 中的构建分析、依赖图分析和性能瓶颈定位"
---

# 第十三章：性能分析与调优

## 构建分析

### 使用 vite-plugin-inspect

```bash
npm install -D vite-plugin-inspect
```

```javascript
// vite.config.js
import Inspect from 'vite-plugin-inspect'

export default defineConfig({
  plugins: [Inspect()],
})
```

访问 `http://localhost:5173/__inspect/` 查看模块转换过程。

### 使用 rollup-plugin-visualizer

```bash
npm install -D rollup-plugin-visualizer
```

```javascript
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      emitFile: true,
    }),
  ],
})
```

### 构建报告

```bash
# 生成构建报告
vite build --mode production

# 查看报告
open dist/stats.html
```

## 依赖分析

### 查看依赖图

```bash
# 使用 vite-plugin-inspect
# 访问 http://localhost:5173/__inspect/

# 或使用 madge
npm install -D madge
npx madge --image dependency-graph.svg src/main.js
```

### 分析依赖大小

```javascript
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // 生成 manifest
    manifest: true,

    // 生成 stats
    rollupOptions: {
      output: {
        // 输出 chunk 信息
        chunkFileNames: 'js/[name]-[hash].js',
      },
    },
  },
})
```

### 使用 vite-bundle-analyzer

```bash
npm install -D vite-bundle-analyzer
```

```javascript
import { defineConfig } from 'vite'
import { analyzer } from 'vite-bundle-analyzer'

export default defineConfig({
  plugins: [analyzer()],
})
```

## 开发服务器性能

### 启动时间优化

```javascript
// vite.config.js
export default defineConfig({
  // 预构建优化
  optimizeDeps: {
    // 包含常用依赖
    include: ['vue', 'vue-router', 'pinia'],

    // 排除不常用依赖
    exclude: ['large-dep'],
  },

  // 服务器配置
  server: {
    // 禁用文件监听
    watch: {
      usePolling: false,
    },
  },
})
```

### HMR 优化

```javascript
server: {
  hmr: {
    // 覆盖 WebSocket 端口
    port: 3001,

    // 指定主机
    host: 'localhost',
  },
}
```

### 模块热替换优化

```javascript
// 使用 import.meta.hot
if (import.meta.hot) {
  // 接受自身更新
  import.meta.hot.accept()

  // 接受依赖更新
  import.meta.hot.accept('./module.js', (newModule) => {
    // 处理更新
  })

  // 处置清理
  import.meta.hot.dispose(() => {
    // 清理副作用
  })
}
```

## 生产环境性能

### 代码分割策略

```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        // 供应商代码
        vendor: ['vue', 'vue-router', 'pinia'],

        // 工具库
        utils: ['lodash-es', 'dayjs'],

        // 组件库
        ui: ['element-plus'],
      },
    },
  },
}
```

### 预加载关键资源

```html
<!-- index.html -->
<link rel="modulepreload" href="/src/main.js" />
<link rel="preload" href="/assets/critical.css" as="style" />
<link rel="prefetch" href="/assets/next-page.js" as="script" />
```

### 资源压缩

```javascript
build: {
  // 启用压缩
  minify: 'esbuild',

  // CSS 压缩
  cssMinify: 'esbuild',

  // Source Map（生产环境建议关闭）
  sourcemap: false,
}
```

## 性能监控

### 构建时间监控

```javascript
// vite.config.js
export default defineConfig({
  plugins: [
    {
      name: 'build-time',
      buildStart() {
        this.startTime = Date.now()
      },
      buildEnd() {
        const duration = Date.now() - this.startTime
        console.log(`Build completed in ${duration}ms`)
      },
    },
  ],
})
```

### 包大小监控

```javascript
import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    visualizer({
      filename: 'dist/stats.json',
      json: true,
    }),
  ],
})
```

### 性能预算

```javascript
// 设置性能预算
build: {
  rollupOptions: {
    output: {
      // 限制 chunk 大小
      manualChunks(id) {
        if (id.includes('node_modules')) {
          return 'vendor'
        }
      },
    },
  },
}

// 使用插件检查包大小
import { defineConfig } from 'vite'
import { sizeLimit } from 'vite-plugin-size-limit'

export default defineConfig({
  plugins: [
    sizeLimit({
      limit: '100kb',
    }),
  ],
})
```

## 常见问题定位

### 构建速度慢

1. **检查依赖数量**

```bash
# 查看依赖数量
npm ls --depth=0
```

2. **优化预构建**

```javascript
optimizeDeps: {
  // 预构建常用依赖
  include: ['vue', 'vue-router'],
}
```

3. **禁用不必要的功能**

```javascript
build: {
  sourcemap: false,
  minify: 'esbuild', // 使用更快的 esbuild
}
```

### 包体积过大

1. **分析包组成**

```bash
# 使用 rollup-plugin-visualizer
npm run build
open dist/stats.html
```

2. **按需导入**

```javascript
// 不好
import { Button, Input } from 'element-plus'

// 好
import Button from 'element-plus/es/components/button'
```

3. **使用 CDN**

```javascript
build: {
  rollupOptions: {
    external: ['vue', 'element-plus'],
  },
}
```

### HMR 速度慢

1. **检查模块依赖**

```javascript
// 使用 vite-plugin-inspect
// 查看模块转换过程
```

2. **优化热更新**

```javascript
if (import.meta.hot) {
  // 精确控制热更新
  import.meta.hot.accept('./module.js', (newModule) => {
    // 只更新必要的部分
  })
}
```

3. **排除大文件**

```javascript
server: {
  watch: {
    ignored: ['**/node_modules/**', '**/dist/**'],
  },
}
```

## 性能优化清单

### 开发阶段

- [ ] 配置预构建优化
- [ ] 使用 vite-plugin-inspect 分析模块
- [ ] 优化 HMR 配置
- [ ] 排除不必要的文件监听

### 构建阶段

- [ ] 启用 Tree-shaking
- [ ] 配置代码分割
- [ ] 使用 CDN 外部化大依赖
- [ ] 启用压缩（esbuild/terser）

### 生产阶段

- [ ] 预加载关键资源
- [ ] 启用 Gzip/Brotli 压缩
- [ ] 配置缓存策略
- [ ] 监控包大小

## 小结

本章介绍了 Vite 的性能分析与调优方法，包括构建分析、依赖分析、性能监控等。通过合理的分析和优化，可以显著提升开发和构建性能。

下一章我们将学习 Vite 的 Monorepo 支持。
