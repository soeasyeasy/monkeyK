---
title: "第一章：Vue 2 简介与环境搭建"
description: "了解 Vue 2 的核心特性，学习如何搭建开发环境并创建第一个 Vue 项目。"
---

# 第一章：Vue 2 简介与环境搭建

## 运行结果

- **Vue 实例**
  - `message = "Hello Vue 2!"`
  - `count = 0`
- **页面渲染**
  - 显示标题：Hello Vue 2!
  - 显示计数器：0
  - 按钮点击后 count 增加

## 代码详解

### 1. Vue 2 简介

Vue 2 是一个渐进式 JavaScript 框架，专注于视图层。它的核心特性包括：

- **响应式数据绑定**：数据与视图自动同步
- **组件化开发**：将 UI 拆分为独立、可复用的组件
- **虚拟 DOM**：高效的 DOM 更新机制
- **指令系统**：v-if、v-for、v-model 等强大指令
- **生命周期钩子**：在组件不同阶段执行逻辑

### 2. 环境搭建

#### 使用 Vue CLI 创建项目

```bash
# 全局安装 Vue CLI
npm install -g @vue/cli

# 创建新项目
vue create my-project

# 选择预设（推荐手动选择特性）
# - Babel: 转译 ES6+
# - Router: 单页应用路由
# - Vuex: 状态管理
# - CSS Pre-processors: CSS 预处理器
```

#### 项目结构

```
my-project/
├── public/              # 静态资源
│   └── index.html       # HTML 模板
├── src/                 # 源代码
│   ├── assets/          # 资源文件
│   ├── components/      # 组件
│   ├── views/           # 页面组件
│   ├── router/          # 路由配置
│   ├── store/           # Vuex 状态管理
│   ├── App.vue          # 根组件
│   └── main.js          # 入口文件
├── package.json         # 依赖配置
└── vue.config.js        # Vue CLI 配置
```

### 3. 第一个 Vue 实例

```javascript
// main.js
import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')
```

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <h1>{{ message }}</h1>
    <p>计数器：{{ count }}</p>
    <button @click="increment">增加</button>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      message: 'Hello Vue 2!',
      count: 0
    }
  },
  methods: {
    increment() {
      this.count++
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
```

### 4. Vue 实例选项

```javascript
new Vue({
  // 数据
  data() {
    return {
      message: 'Hello'
    }
  },
  
  // 方法
  methods: {
    greet() {
      return this.message
    }
  },
  
  // 计算属性
  computed: {
    upperMessage() {
      return this.message.toUpperCase()
    }
  },
  
  // 侦听器
  watch: {
    message(newVal, oldVal) {
      console.log(`变化：${oldVal} -> ${newVal}`)
    }
  },
  
  // 生命周期钩子
  created() {
    console.log('实例已创建')
  },
  mounted() {
    console.log('DOM 已挂载')
  }
})
```

### 5. 模板语法预览

```vue
<template>
  <div>
    <!-- 文本插值 -->
    <p>{{ message }}</p>
    
    <!-- 属性绑定 -->
    <img :src="imageUrl" />
    
    <!-- 事件绑定 -->
    <button @click="handleClick">点击</button>
    
    <!-- 双向绑定 -->
    <input v-model="inputValue" />
    
    <!-- 条件渲染 -->
    <p v-if="isVisible">可见</p>
    
    <!-- 列表渲染 -->
    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>
```

## Vue 2 核心概念

::: info
- **响应式系统**：Vue 使用 Object.defineProperty 实现数据劫持
- **模板编译**：将模板编译为渲染函数
- **虚拟 DOM**：通过 diff 算法最小化 DOM 操作
- **组件系统**：一切皆组件，支持组合与复用
:::

## 与 Vue 3 的区别

| 特性 | Vue 2 | Vue 3 |
| --- | --- | --- |
| 响应式实现 | Object.defineProperty | Proxy |
| API 风格 | 选项式 API | 组合式 API + 选项式 |
| TypeScript 支持 | 较弱 | 原生支持 |
| 性能 | 良好 | 更优 |
| 体积 | 较大 | 更小（Tree-shaking） |
