---
title: '第一章：Vue 3 简介与项目创建'
description: '从零开始认识 Vue 3，理解它解决了什么问题，并用 Vite 搭建你的第一个项目'
---

# 第一章：Vue 3 简介与项目创建

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Vue 是什么？和 HTML/JS 有什么关系？
- 我已经会写原生 JS 了，为什么还要学框架？
- Vue 2 和 Vue 3 有什么区别？该学哪个？

这一章就是为了解答这些问题。我们会先搞清楚 **Vue 到底解决了什么痛点**，再动手搭建项目，让你 5 分钟内看到第一个页面。

---

## 1 为什么需要 Vue？

### 原生 JS 的痛点

假设你要做一个"待办事项"功能：用户在输入框输入内容，点击按钮后，列表里新增一条。

用原生 JS 写起来是这样的：

```javascript
// 1. 手动找到 DOM 元素
const input = document.getElementById('todo-input')
const btn = document.getElementById('add-btn')
const list = document.getElementById('todo-list')

// 2. 手动监听点击事件
btn.addEventListener('click', () => {
  const text = input.value

  // 3. 手动创建 DOM 节点
  const li = document.createElement('li')
  li.textContent = text

  // 4. 手动插入到页面
  list.appendChild(li)

  // 5. 手动清空输入框
  input.value = ''
})
```

你会发现，**代码里全是"怎么操作 DOM"的步骤**，而不是"业务逻辑本身"。

这就像你去餐厅点菜，服务员不是直接帮你下单，而是要你自己：走到厨房、告诉厨师、端菜回来、摆好餐具。

### Vue 的解决方式：数据驱动

Vue 的核心思想是：**你只需要关心数据，页面自动更新**。

```vue
<script setup>
import { ref } from 'vue'

const todos = ref([])
const inputText = ref('')

const addTodo = () => {
  todos.value.push(inputText.value)
  inputText.value = ''
}
</script>

<template>
  <input v-model="inputText" placeholder="输入待办" />
  <button @click="addTodo">添加</button>
  <ul>
    <li v-for="todo in todos">{{ todo }}</li>
  </ul>
</template>
```

对比一下：

| 对比项     | 原生 JS                  | Vue                  |
| ---------- | ------------------------ | -------------------- |
| 操作方式   | 手动操作 DOM             | 数据变了，页面自动变 |
| 代码关注点 | "怎么找到元素、怎么插入" | "数据是什么、怎么变" |
| 代码量     | 多，步骤繁琐             | 少，逻辑清晰         |
| 可维护性   | 差，DOM 操作散落各处     | 好，数据和视图分离   |

> **一句话总结**：Vue 帮你做了"数据 → DOM"的同步工作，你只需要专注于业务逻辑。

---

## 2 Vue 3 相比 Vue 2 有什么变化？

Vue 3 是 2020 年发布的重大版本，主要变化有：

### 1. 性能更好

Vue 3 重写了底层的响应式系统。

- Vue 2 用 `Object.defineProperty` 监听数据变化（每次都要遍历对象所有属性）
- Vue 3 用 `Proxy` 监听数据变化（只在访问时才拦截，按需触发）

打个比方：

- Vue 2 像保安挨个检查每间房有没有人（全量遍历）
- Vue 3 像门口装了感应门，有人经过才报警（按需触发）

### 2. 更好的 TypeScript 支持

Vue 3 源码用 TypeScript 重写，类型推导更准确。写代码时 IDE 能给你更智能的提示和报错。

### 3. 全新的 Composition API（组合式 API）

Vue 2 用的是"选项式 API"，代码按 `data`、`methods`、`computed` 这些选项分类组织。当组件变大时，同一个功能的代码会散落在不同选项里，找起来很麻烦。

Vue 3 新增了"组合式 API"，可以把同一个功能的代码放在一起：

```javascript
// 选项式 API（Vue 2）—— 相关代码分散
export default {
  data() {
    return { count: 0, name: '' }
  },
  computed: {
    doubleCount() {
      return this.count * 2
    },
  },
  methods: {
    increment() {
      this.count++
    },
  },
}

// 组合式 API（Vue 3）—— 相关代码集中
import { ref, computed } from 'vue'

const count = ref(0)
const doubleCount = computed(() => count.value * 2)
const increment = () => count.value++
```

> 当项目变复杂时，组合式 API 的优势会非常明显——你可以按"功能"组织代码，而不是按"选项类型"。

### 4. 更多新特性

- **Teleport**：把组件渲染到 DOM 的任意位置（比如弹窗挂到 body 下）
- **Fragments**：组件可以有多个根节点，不用套一层多余的 div
- **Suspense**：优雅处理异步组件的加载状态

---

## 3 用 Vite 创建项目

### 什么是 Vite？

Vite（读作 /vit/，法语"快"的意思）是一个前端构建工具。

在 Vue 2 时代，大家用 Webpack 来打包代码。但 Webpack 启动慢、热更新也慢，项目一大就要等很久。

Vite 利用浏览器原生支持 ES Module 的特性，**开发时不需要打包**，所以启动速度极快（毫秒级）。

> 类比：Webpack 像每次修改都要重新印刷整本书；Vite 像只修改出错的那一页。

### 创建项目

打开终端，运行：

```bash
npm create vite@latest my-vue-app -- --template vue-ts
```

这条命令做了什么？

| 部分                     | 含义                                |
| ------------------------ | ----------------------------------- |
| `npm create vite@latest` | 使用 npm 运行 Vite 的最新版本脚手架 |
| `my-vue-app`             | 项目文件夹名称                      |
| `--template vue-ts`      | 使用 Vue + TypeScript 模板          |

然后进入项目并安装依赖：

```bash
cd my-vue-app
npm install
```

启动开发服务器：

```bash
npm run dev
```

浏览器打开 `http://localhost:5173`，你会看到 Vite + Vue 的欢迎页面。

### 项目目录结构

```
my-vue-app/
├── public/              # 静态资源（不经过构建处理，直接复制）
├── src/
│   ├── assets/          # 项目资源（图片、字体等，会经过构建处理）
│   ├── components/      # 公共组件（可复用的 UI 片段）
│   ├── App.vue          # 根组件（整个应用的入口组件）
│   └── main.ts          # 入口文件（整个应用的启动脚本）
├── index.html           # HTML 模板（Vite 会把它作为入口）
├── vite.config.ts       # Vite 配置文件
├── tsconfig.json        # TypeScript 配置文件
└── package.json         # 项目依赖和脚本配置
```

> **新手注意**：`public/` 和 `src/assets/` 都能放图片，区别是 `public/` 里的文件不会被构建工具处理（路径写死），`src/assets/` 里的会被处理（支持压缩、hash 命名等）。一般推荐用 `src/assets/`。

---

## 4 入口文件 main.ts

```typescript
// 从 vue 包中导入 createApp 函数
import { createApp } from 'vue'

// 从当前目录导入根组件 App.vue
// .vue 文件是 Vue 的单文件组件格式，包含模板、脚本、样式
import App from './App.vue'

// createApp(App) 创建一个 Vue 应用实例
// 把它赋值给变量 app，方便后续操作
const app = createApp(App)

// 把整个 Vue 应用挂载（mount）到页面上 id 为 "app" 的 DOM 元素
// 这个 #app 元素在 index.html 里已经写好了
app.mount('#app')
```

> **原理**：Vue 应用不是直接替换整个 HTML，而是找到 `index.html` 里的 `<div id="app"></div>`，然后把你的 Vue 组件渲染到这个 div 里面。div 之外的内容（比如 `<head>` 里的 meta 标签）不受影响。

---

## 5 第一个 Vue 组件

打开 `src/App.vue`，改成这样：

```vue
<!-- <script setup> 是 Vue 3 的语法糖，里面的变量和函数可以直接在模板中使用 -->
<script setup lang="ts">
// 从 vue 导入 ref 函数，用来创建响应式数据
import { ref } from 'vue'

// ref('Hello Vue 3!') 创建一个响应式的字符串
// message 是一个 Ref 对象，它的值存在 .value 属性里
const message = ref('Hello Vue 3!')
</script>

<!-- <template> 里写 HTML 模板 -->
<!-- {{ message }} 是插值表达式，会显示 message 的值 -->
<!-- 在模板中使用 ref 时，Vue 会自动解包，不需要写 .value -->
<template>
  <h1>{{ message }}</h1>
</template>
```

运行后页面上会显示一个大大的 **Hello Vue 3!**。

### 单文件组件（SFC）是什么？

Vue 组件使用 `.vue` 文件，它把三样东西封装在一起：

```
┌─────────────────────────┐
│  <script setup>         │  ← 逻辑（JS/TS 代码）
│  定义数据和行为            │
├─────────────────────────┤
│  <template>             │  ← 视图（HTML 模板）
│  定义页面长什么样          │
├─────────────────────────┤
│  <style scoped>         │  ← 样式（CSS）
│  定义组件的外观           │
└─────────────────────────┘
```

> 这种格式叫 **SFC（Single File Component）**，好处是：一个文件就是一个组件，逻辑、视图、样式都在一起，方便理解和维护。

---

## 6 核心知识点总结

| 知识点            | 说明                                      |
| ----------------- | ----------------------------------------- |
| Vue 的核心价值    | 数据驱动视图，不用手动操作 DOM            |
| Vue 3 vs Vue 2    | 性能更好、TS 支持更好、新增组合式 API     |
| Vite              | 新一代构建工具，开发环境启动极快          |
| `main.ts`         | 应用入口，负责创建 Vue 实例并挂载到 DOM   |
| `.vue` 单文件组件 | 把逻辑、模板、样式封装在一个文件里        |
| `<script setup>`  | Vue 3 的语法糖，让组合式 API 写起来更简洁 |

---

## 7 新手常见误区

### 误区 1："学了 Vue 就不用学 JS 了"

**错！** Vue 是基于 JS 的框架。你必须先掌握 JS 基础（变量、函数、数组、对象、ES6 语法），学 Vue 才不会吃力。Vue 只是帮你简化了 DOM 操作，不是替代 JS。

### 误区 2："Vue 3 比 Vue 2 难很多"

其实核心概念是一样的：数据绑定、组件化、生命周期。只是组织代码的方式变了。如果你之前没学过 Vue，直接从 Vue 3 开始反而更好，不用学旧写法。

### 误区 3："ref 和 reactive 随便选一个就行"

不是的。`ref` 适合基本类型（数字、字符串），`reactive` 适合对象。它们在行为上有区别，下一章会详细讲。

---

## 8 动手练习

### 练习 1：修改欢迎语

把 `App.vue` 里的 `message` 改成你自己的名字，比如 `你好，我是小明！`，确认页面能正确更新。

### 练习 2：添加一个计数器

在 `App.vue` 里新增一个计数器功能：

1. 定义一个响应式变量 `count`，初始值为 0
2. 页面上显示当前计数值
3. 添加一个按钮，点击后 count 加 1

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <p>当前计数：{{ count }}</p>
  <button @click="count++">点击 +1</button>
</template>
```

</details>

### 练习 3（挑战）：添加重置按钮

在练习 2 的基础上，再添加一个"重置"按钮，点击后把 count 变回 0。

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

const reset = () => {
  count.value = 0
}
</script>

<template>
  <p>当前计数：{{ count }}</p>
  <button @click="count++">点击 +1</button>
  <button @click="reset">重置</button>
</template>
```

</details>

---

## 下一章预告

下一章我们会学习 Vue 的 **模板语法**——也就是 `<template>` 里可以写哪些东西。你会学到怎么绑定属性、怎么处理事件、怎么做条件渲染和列表渲染。这些是写 Vue 页面最基础的工具。
