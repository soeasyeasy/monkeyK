---
title: "第一章：Vue 3 简介与项目创建"
description: "了解 Vue 3 的新特性，使用 Vite 快速搭建项目"
---

# 第一章：Vue 3 简介与项目创建

## 运行结果

| 特性 | 说明 |
| --- | --- |
| Composition API | 全新的组件逻辑组织方式 |
| Teleport | 将组件内容渲染到 DOM 任意位置 |
| Fragments | 组件支持多个根节点 |
| Emits API | 更明确的事件声明 |
| 更好的 TypeScript 支持 | 原生为 TS 设计 |
| Proxy 响应式 | 替代 Object.defineProperty |

## 代码示例

### 1. 使用 Vite 创建项目

```bash
npm create vite@latest my-vue-app -- --template vue-ts
cd my-vue-app
npm install
npm run dev
```

### 2. 项目目录结构

```
my-vue-app/
├── public/              # 静态资源
├── src/
│   ├── assets/          # 项目资源文件
│   ├── components/      # 公共组件
│   ├── App.vue          # 根组件
│   └── main.ts          # 入口文件
├── index.html           # HTML 模板
├── vite.config.ts       # Vite 配置
├── tsconfig.json        # TypeScript 配置
└── package.json         # 依赖管理
```

### 3. 入口文件 main.ts

```typescript
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.mount('#app')
```

### 4. 第一个 Vue 3 组件

```vue
<script setup lang="ts">
import { ref } from 'vue'

const message = ref('Hello Vue 3!')
</script>

<template>
  <h1>{{ message }}</h1>
</template>
```

### 5. 与 Vue 2 的对比

```typescript
// Vue 2 - 选项式 API
export default {
  data() {
    return { count: 0 }
  },
  methods: {
    increment() { this.count++ }
  }
}

// Vue 3 - 组合式 API
import { ref } from 'vue'

const count = ref(0)
const increment = () => count.value++
```

## 核心知识点

1. **Vite 的优势**：基于原生 ES Module，开发环境启动极快
2. **Composition API**：按逻辑关注点组织代码，而非选项
3. **`<script setup>`**：编译时语法糖，更简洁的组合式 API 写法
4. **Proxy 响应式**：解决了 Vue 2 中 Object.defineProperty 的局限
5. **TypeScript 优先**：Vue 3 源码使用 TS 重写，提供更好的类型推导
