---
title: "第五章：CSS 与预处理器"
description: "掌握 Vite 中的 CSS Modules、Sass/Less、PostCSS 和 CSS 代码分割"
---

# 第五章：CSS 与预处理器

## 基础 CSS

### 直接导入

```javascript
// main.js
import './style.css'
```

### 在组件中使用

```vue
<!-- Vue 组件 -->
<style>
.container {
  padding: 20px;
}
</style>
```

## CSS Modules

### 启用 CSS Modules

文件名以 `.module.css` 结尾：

```css
/* style.module.css */
.container {
  color: red;
}
```

```vue
<template>
  <div :class="$style.container">Hello</div>
</template>

<script setup>
import styles from './style.module.css'
// styles.container 会被转为唯一类名
</script>
```

### 配置 CSS Modules

```javascript
export default defineConfig({
  css: {
    modules: {
      // 生成类名格式
      generateScopedName: '[name]__[local]___[hash:base64:5]',

      // 或自定义函数
      generateScopedName: (name, filename, css) => {
        return `${name}-${css}`
      },
    },
  },
})
```

### 在 Vue 中使用

```vue
<template>
  <div :class="styles.container">
    <h1 :class="styles.title">Hello</h1>
  </div>
</template>

<script setup>
import styles from './Component.module.css'
</script>
```

## Sass/SCSS

### 安装

```bash
npm install -D sass
```

### 使用

```vue
<style lang="scss">
$primary-color: #42b883;

.container {
  color: $primary-color;

  .title {
    font-size: 24px;
  }
}
</style>
```

### 导入 SCSS 文件

```vue
<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.container {
  @include flex-center;
  color: $primary-color;
}
</style>
```

### 全局注入变量

```javascript
// vite.config.js
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "@/styles/variables.scss";
          @import "@/styles/mixins.scss";
        `,
      },
    },
  },
})
```

这样在所有 SCSS 文件中都可以直接使用这些变量和混入，无需手动导入。

### 多个文件注入

```javascript
css: {
  preprocessorOptions: {
    scss: {
      additionalData: `
        @import "@/styles/variables.scss";
        @import "@/styles/mixins.scss";
        @import "@/styles/functions.scss";
      `,
    },
  },
}
```

## Less

### 安装

```bash
npm install -D less
```

### 使用

```vue
<style lang="less">
@primary-color: #42b883;

.container {
  color: @primary-color;

  .title {
    font-size: 24px;
  }
}
</style>
```

### 配置 Less

```javascript
export default defineConfig({
  css: {
    preprocessorOptions: {
      less: {
        // 全局变量
        globalVars: {
          primary: '#42b883',
        },

        // 修改 Less 选项
        modifyVars: {
          'primary-color': '#42b883',
        },

        // JavaScript 支持
        javascriptEnabled: true,
      },
    },
  },
})
```

## Stylus

### 安装

```bash
npm install -D stylus
```

### 使用

```vue
<style lang="stylus">
primary-color = #42b883

.container
  color primary-color

  .title
    font-size 24px
</style>
```

## PostCSS

### 安装

```bash
npm install -D postcss autoprefixer
```

### 配置

```javascript
// postcss.config.js
export default {
  plugins: {
    autoprefixer: {},
  },
}
```

### 在 Vite 中配置

```javascript
export default defineConfig({
  css: {
    postcss: {
      plugins: [
        require('autoprefixer'),
        require('postcss-preset-env'),
      ],
    },
  },
})
```

### 常用 PostCSS 插件

#### postcss-preset-env

```bash
npm install -D postcss-preset-env
```

```javascript
// postcss.config.js
export default {
  plugins: {
    'postcss-preset-env': {
      stage: 2,
      features: {
        'nesting-rules': true,
        'custom-media-queries': true,
      },
    },
  },
}
```

#### postcss-px-to-viewport

```bash
npm install -D postcss-px-to-viewport
```

```javascript
// postcss.config.js
export default {
  plugins: {
    'postcss-px-to-viewport': {
      viewportWidth: 375,
      unitPrecision: 5,
      viewportUnit: 'vw',
      selectorBlackList: ['.ignore'],
      minPixelValue: 1,
      mediaQuery: false,
    },
  },
}
```

## CSS 代码分割

### 自动分割

Vite 会自动为每个异步 chunk 提取 CSS：

```javascript
// 动态导入
const module = await import('./module.js')
// 对应的 CSS 会自动加载
```

### 手动分割

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],
          styles: ['./src/styles/global.css'],
        },
      },
    },
  },
})
```

## CSS 压缩

### 默认压缩

Vite 默认使用 `esbuild` 压缩 CSS。

### 使用其他压缩器

```javascript
export default defineConfig({
  css: {
    // 使用 cssnano
    transformer: 'postcss',
  },
  build: {
    cssMinify: 'esbuild', // 或 'terser'
  },
})
```

## Source Map

### 开发环境

```javascript
export default defineConfig({
  css: {
    devSourcemap: true,
  },
})
```

### 生产环境

```javascript
export default defineConfig({
  build: {
    sourcemap: true,
  },
})
```

## CSS 注入控制

### 禁用 CSS 注入

```javascript
import './style.css?inline'
// ?inline 表示不注入到页面，只返回 CSS 字符串
```

### 在 JavaScript 中使用

```javascript
import cssString from './style.css?inline'

const style = document.createElement('style')
style.textContent = cssString
document.head.appendChild(style)
```

## 预处理器最佳实践

### 变量管理

```scss
// styles/variables.scss
$primary: #42b883;
$secondary: #35495e;
$spacing-unit: 8px;

// 间距
$spacing-sm: $spacing-unit;
$spacing-md: $spacing-unit * 2;
$spacing-lg: $spacing-unit * 3;
```

### 混入管理

```scss
// styles/mixins.scss
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin responsive($breakpoint) {
  @if $breakpoint == mobile {
    @media (max-width: 768px) { @content; }
  } @else if $breakpoint == tablet {
    @media (max-width: 1024px) { @content; }
  }
}
```

### 主题系统

```scss
// styles/themes/light.scss
:root {
  --primary-color: #42b883;
  --bg-color: #ffffff;
  --text-color: #2c3e50;
}

// styles/themes/dark.scss
[data-theme="dark"] {
  --primary-color: #42b883;
  --bg-color: #1a1a1a;
  --text-color: #ffffff;
}
```

```javascript
// 切换主题
function toggleTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}
```

## 常见问题

### 样式冲突

```vue
<!-- 使用 scoped -->
<style scoped>
.container {
  /* 只作用于当前组件 */
}
</style>
```

### 深度选择器

```vue
<style scoped>
/* Vue 3 */
:deep(.child-class) {
  color: red;
}

/* Vue 2 */
::v-deep .child-class {
  color: red;
}
</style>
```

### 全局样式

```javascript
// main.js
import './styles/global.css'
import './styles/reset.css'
```

## 小结

本章介绍了 Vite 中 CSS 和预处理器的使用，包括 CSS Modules、Sass/Less、PostCSS 等。合理配置和使用预处理器可以提升样式开发的效率和可维护性。

下一章我们将学习 Vite 的模块解析和别名配置。
