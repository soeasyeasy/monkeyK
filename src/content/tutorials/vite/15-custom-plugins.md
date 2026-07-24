---
title: "第十五章：自定义插件开发"
description: "学习 Vite 插件 API、钩子函数和实战案例"
---

# 第十五章：自定义插件开发

## 插件基础

### 插件结构

```javascript
// my-plugin.js
export default function myPlugin(options = {}) {
  return {
    name: 'my-plugin',

    // 钩子函数
    buildStart() {
      // 构建开始
    },

    resolveId(id) {
      // 解析模块 ID
    },

    load(id) {
      // 加载模块
    },

    transform(code, id) {
      // 转换模块
    },

    buildEnd() {
      // 构建结束
    },
  }
}
```

### 使用插件

```javascript
// vite.config.js
import myPlugin from './my-plugin.js'

export default defineConfig({
  plugins: [myPlugin({ debug: true })],
})
```

## 插件钩子

### 通用钩子（Rollup 兼容）

| 钩子 | 说明 | 阶段 |
| --- | --- | --- |
| `buildStart` | 构建开始 | 构建 |
| `resolveId` | 解析模块 ID | 构建 |
| `load` | 加载模块 | 构建 |
| `transform` | 转换模块 | 构建 |
| `buildEnd` | 构建结束 | 构建 |
| `renderChunk` | 渲染 chunk | 构建 |
| `generateBundle` | 生成 bundle | 构建 |

### Vite 特有钩子

| 钩子 | 说明 | 阶段 |
| --- | --- | --- |
| `config` | 修改配置 | 配置 |
| `configResolved` | 配置解析后 | 配置 |
| `configureServer` | 配置开发服务器 | 开发 |
| `configurePreviewServer` | 配置预览服务器 | 预览 |
| `transformIndexHtml` | 转换 HTML | 开发/构建 |
| `handleHotUpdate` | 处理 HMR | 开发 |

## 实战案例

### 虚拟模块插件

```javascript
// virtual-module-plugin.js
export default function virtualModulePlugin() {
  const virtualModuleId = 'virtual:my-module'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  return {
    name: 'virtual-module',

    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },

    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `
          export const version = '1.0.0'
          export const name = 'My Virtual Module'
        `
      }
    },
  }
}
```

### Markdown 转换插件

```javascript
// markdown-plugin.js
import { marked } from 'marked'

export default function markdownPlugin() {
  return {
    name: 'markdown',

    transform(code, id) {
      if (id.endsWith('.md')) {
        // 将 Markdown 转为 HTML
        const html = marked(code)

        // 返回 JavaScript 模块
        return `
          export default ${JSON.stringify(html)}
        `
      }
    },
  }
}
```

### 文件监听插件

```javascript
// file-watcher-plugin.js
import fs from 'fs'
import path from 'path'

export default function fileWatcherPlugin(options = {}) {
  const watchDir = options.dir || 'src'

  return {
    name: 'file-watcher',

    configureServer(server) {
      // 监听文件变化
      const watcher = fs.watch(watchDir, { recursive: true }, (event, filename) => {
        console.log(`File ${filename} changed (${event})`)

        // 触发 HMR
        server.ws.send({
          type: 'custom',
          event: 'file-change',
          data: {
            event,
            filename,
          },
        })
      })

      // 清理
      server.httpServer?.on('close', () => {
        watcher.close()
      })
    },
  }
}
```

### 自动导入插件

```javascript
// auto-import-plugin.js
import MagicString from 'magic-string'

export default function autoImportPlugin() {
  const imports = {
    'vue': ['ref', 'reactive', 'computed', 'watch'],
    'lodash-es': ['debounce', 'throttle'],
  }

  return {
    name: 'auto-import',

    transform(code, id) {
      if (!id.endsWith('.vue') && !id.endsWith('.js')) {
        return
      }

      const s = new MagicString(code)

      // 检查并添加导入
      for (const [module, names] of Object.entries(imports)) {
        for (const name of names) {
          if (code.includes(name) && !code.includes(`import ${name}`)) {
            s.prepend(`import { ${name} } from '${module}'\n`)
          }
        }
      }

      return {
        code: s.toString(),
        map: s.generateMap(),
      }
    },
  }
}
```

### HTML 注入插件

```javascript
// html-inject-plugin.js
export default function htmlInjectPlugin(options = {}) {
  const { head = '', body = '' } = options

  return {
    name: 'html-inject',
    enforce: 'post',

    transformIndexHtml(html) {
      // 注入到 head
      if (head) {
        html = html.replace('</head>', `${head}\n</head>`)
      }

      // 注入到 body
      if (body) {
        html = html.replace('</body>', `${body}\n</body>`)
      }

      return html
    },
  }
}
```

### 环境变量插件

```javascript
// env-plugin.js
import fs from 'fs'
import path from 'path'

export default function envPlugin() {
  return {
    name: 'env',

    config(config) {
      // 读取 .env 文件
      const envPath = path.resolve(process.cwd(), '.env')

      if (fs.existsSync(envPath)) {
        const env = fs.readFileSync(envPath, 'utf-8')
        const envVars = {}

        env.split('\n').forEach((line) => {
          const [key, value] = line.split('=')
          if (key && value) {
            envVars[key.trim()] = value.trim()
          }
        })

        // 注入到 define
        config.define = config.define || {}
        for (const [key, value] of Object.entries(envVars)) {
          config.define[`import.meta.env.${key}`] = JSON.stringify(value)
        }
      }
    },
  }
}
```

## 插件开发技巧

### 异步钩子

```javascript
export default function asyncPlugin() {
  return {
    name: 'async-plugin',

    async buildStart() {
      // 异步操作
      const data = await fetch('https://api.example.com/data')
      const json = await data.json()

      console.log('Fetched data:', json)
    },
  }
}
```

### 访问配置

```javascript
export default function configPlugin() {
  let config

  return {
    name: 'config-plugin',

    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    buildStart() {
      console.log('Base URL:', config.base)
      console.log('Mode:', config.mode)
    },
  }
}
```

### 条件应用

```javascript
export default function conditionalPlugin() {
  return {
    name: 'conditional',

    // 只在开发环境应用
    apply(config) {
      return config.command === 'serve'
    },

    configureServer(server) {
      // 开发服务器配置
    },
  }
}
```

### 错误处理

```javascript
export default function errorHandlingPlugin() {
  return {
    name: 'error-handling',

    transform(code, id) {
      try {
        // 转换逻辑
        return transformCode(code)
      } catch (error) {
        this.error(`Failed to transform ${id}: ${error.message}`)
      }
    },
  }
}
```

## 插件测试

### 单元测试

```javascript
// plugin.test.js
import { describe, it, expect } from 'vitest'
import myPlugin from './my-plugin.js'

describe('myPlugin', () => {
  it('should return correct plugin name', () => {
    const plugin = myPlugin()
    expect(plugin.name).toBe('my-plugin')
  })

  it('should transform code correctly', () => {
    const plugin = myPlugin()
    const result = plugin.transform('const x = 1', 'test.js')
    expect(result).toContain('transformed')
  })
})
```

### 集成测试

```javascript
// integration.test.js
import { build } from 'vite'
import myPlugin from './my-plugin.js'

describe('integration', () => {
  it('should build successfully', async () => {
    const result = await build({
      plugins: [myPlugin()],
      logLevel: 'silent',
    })

    expect(result).toBeDefined()
  })
})
```

## 发布插件

### 准备发布

```json
// package.json
{
  "name": "vite-plugin-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist"],
  "keywords": ["vite", "plugin"],
  "peerDependencies": {
    "vite": "^5.0.0"
  }
}
```

### 发布

```bash
# 构建
npm run build

# 发布
npm publish
```

## 小结

本章介绍了 Vite 自定义插件开发，包括插件结构、钩子函数和实战案例。通过插件开发可以扩展 Vite 的功能，满足特定需求。

下一章我们将学习 Vite 的部署与最佳实践。
