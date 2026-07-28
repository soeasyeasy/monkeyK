---
title: '第十四章：过渡与动画'
description: '掌握 Vue 3 过渡与动画系统，为应用添加流畅的视觉效果'
---

# 第十四章：过渡与动画

## 本章导读

在前面章节中，我们实现了各种功能，但页面切换、元素显示/隐藏时都很生硬。如何让这些变化更自然、更美观？

- 如何让元素淡入淡出？
- 如何让列表增删时有平滑动画？
- 如何实现复杂的入场/离场效果？

这一章我们会学习 Vue 的过渡系统。学完你会掌握：
- `<Transition>` 和 `<TransitionGroup>` 组件的使用
- CSS 过渡和动画的集成
- JavaScript 钩子的自定义过渡
- 过渡类名的自定义

---

## 1 为什么需要过渡与动画？

### 痛点分析

假设你有一个弹窗组件，直接显示/隐藏：

```vue
<script setup>
import { ref } from 'vue'

const showModal = ref(false)
</script>

<template>
  <button @click="showModal = true">打开弹窗</button>
  
  <div v-if="showModal" class="modal">
    <p>这是一个弹窗</p>
    <button @click="showModal = false">关闭</button>
  </div>
</template>
```

问题很明显：
- 弹窗突然出现/消失，用户体验差
- 没有视觉反馈，显得生硬
- 无法引导用户注意力

### Vue 过渡的解决方案

```vue
<template>
  <button @click="showModal = true">打开弹窗</button>
  
  <Transition>
    <div v-if="showModal" class="modal">
      <p>这是一个弹窗</p>
      <button @click="showModal = false">关闭</button>
    </div>
  </Transition>
</template>

<style>
/* Vue 自动添加的过渡类 */
.v-enter-active, .v-leave-active {
  transition: opacity 0.3s ease;
}

.v-enter-from, .v-leave-to {
  opacity: 0;
}
</style>
```

> **一句话总结**：Vue 的过渡系统让你可以用 CSS 或 JavaScript 实现平滑的动画效果，提升用户体验。

---

## 2 核心原理

### 过渡的六个类名

当用 `<Transition>` 包裹元素时，Vue 会自动添加以下 CSS 类：

| 类名 | 说明 | 时机 |
|------|------|------|
| `v-enter-from` | 进入动画的起始状态 | 元素插入前 |
| `v-enter-active` | 进入动画的激活状态 | 元素插入时 |
| `v-enter-to` | 进入动画的结束状态 | 插入后的下一帧 |
| `v-leave-from` | 离开动画的起始状态 | 元素移除前 |
| `v-leave-active` | 离开动画的激活状态 | 元素移除时 |
| `v-leave-to` | 离开动画的结束状态 | 移除后的下一帧 |

### 过渡流程图

```
进入过渡：
1. 添加 v-enter-from 和 v-enter-active
2. 下一帧：移除 v-enter-from，添加 v-enter-to
3. 动画结束：移除 v-enter-active 和 v-enter-to

离开过渡：
1. 添加 v-leave-from 和 v-leave-active
2. 下一帧：移除 v-leave-from，添加 v-leave-to
3. 动画结束：移除元素和所有类
```

---

## 3 基础用法

### 单元素过渡

```vue
<script setup>
import { ref } from 'vue'

const show = ref(true)
</script>

<template>
  <button @click="show = !show">切换</button>
  
  <Transition>
    <p v-if="show">这段文字会淡入淡出</p>
  </Transition>
</template>

<style>
/* 进入和离开的过渡效果 */
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

/* 进入起点和离开终点 */
.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
```

### 自定义过渡类名

通过 `name` 属性可以自定义过渡类名前缀：

```vue
<template>
  <Transition name="fade">
    <p v-if="show">淡入淡出</p>
  </Transition>
  
  <Transition name="slide">
    <p v-if="show">滑动效果</p>
  </Transition>
</template>

<style>
/* fade 过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* slide 过渡 */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.5s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(100%);
}
</style>
```

### 使用 CSS 动画

除了 `transition`，还可以用 CSS `@keyframes` 动画：

```vue
<template>
  <Transition>
    <p v-if="show">弹跳效果</p>
  </Transition>
</template>

<style>
.v-enter-active {
  animation: bounce-in 0.5s;
}

.v-leave-active {
  animation: bounce-in 0.5s reverse;
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.25);
  }
  100% {
    transform: scale(1);
  }
}
</style>
```

---

## 4 进阶用法

### 列表过渡

用 `<TransitionGroup>` 实现列表的增删动画：

```vue
<script setup>
import { ref } from 'vue'

const items = ref(['苹果', '香蕉', '橘子'])
const newItem = ref('')

const addItem = () => {
  if (newItem.value) {
    items.value.push(newItem.value)
    newItem.value = ''
  }
}

const removeItem = (index) => {
  items.value.splice(index, 1)
}
</script>

<template>
  <input v-model="newItem" @keyup.enter="addItem" placeholder="添加水果" />
  <button @click="addItem">添加</button>
  
  <TransitionGroup tag="ul" name="list">
    <li v-for="(item, index) in items" :key="item">
      {{ item }}
      <button @click="removeItem(index)">删除</button>
    </li>
  </TransitionGroup>
</template>

<style>
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 移动动画 */
.list-move {
  transition: transform 0.5s ease;
}
</style>
```

### JavaScript 钩子

当 CSS 过渡无法满足需求时，可以用 JavaScript 钩子：

```vue
<script setup>
import { ref } from 'vue'

const show = ref(false)

const onBeforeEnter = (el) => {
  el.style.opacity = 0
  el.style.transform = 'translateY(-30px)'
}

const onEnter = (el, done) => {
  // 使用 Web Animations API
  el.animate(
    [
      { opacity: 0, transform: 'translateY(-30px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ],
    {
      duration: 500,
      easing: 'ease-out'
    }
  ).onfinish = done
}

const onLeave = (el, done) => {
  el.animate(
    [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(30px)' }
    ],
    {
      duration: 500,
      easing: 'ease-in'
    }
  ).onfinish = done
}
</script>

<template>
  <button @click="show = !show">切换</button>
  
  <Transition
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @leave="onLeave"
  >
    <p v-if="show">JavaScript 动画</p>
  </Transition>
</template>
```

### 与第三方库集成

以 Animate.css 为例：

```vue
<template>
  <Transition
    enter-active-class="animate__animated animate__bounceIn"
    leave-active-class="animate__animated animate__bounceOut"
  >
    <p v-if="show">Animate.css 效果</p>
  </Transition>
</template>
```

### 过渡模式

`mode` 属性控制过渡的执行顺序：

```vue
<template>
  <!-- out-in: 先离开再进入 -->
  <Transition name="fade" mode="out-in">
    <component :is="currentComponent" />
  </Transition>
  
  <!-- in-out: 先进入再离开 -->
  <Transition name="fade" mode="in-out">
    <component :is="currentComponent" />
  </Transition>
</template>
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| `<Transition>` | 单元素/组件过渡 |
| `<TransitionGroup>` | 列表过渡 |
| 六个过渡类名 | `enter-from`、`enter-active`、`enter-to`、`leave-from`、`leave-active`、`leave-to` |
| `name` 属性 | 自定义过渡类名前缀 |
| `mode` 属性 | 控制过渡顺序（`out-in` / `in-out`） |
| JavaScript 钩子 | `@before-enter`、`@enter`、`@leave` 等 |
| `tag` 属性 | `<TransitionGroup>` 渲染的容器标签 |

---

## 6 新手常见误区

### 误区 1："v-if 和 v-show 的过渡效果一样"

**不一样！** `v-if` 会真正添加/移除 DOM，触发完整的进入/离开过渡。`v-show` 只是切换 `display`，只触发一次进入过渡，离开时没有动画。

### 误区 2："Transition 可以包裹多个元素"

**不能！** `<Transition>` 只能包裹单个元素或组件。如果要过渡多个元素，用 `<TransitionGroup>`。

### 误区 3："列表过渡不需要 key"

**必须加 key！** `<TransitionGroup>` 中的每个元素必须有唯一的 `key`，否则 Vue 无法识别元素的变化，动画会失效。

### 误区 4："CSS 过渡和动画不能同时用"

**可以同时用！** 但要注意优先级。如果同时定义了 `transition` 和 `animation`，Vue 会自动监听两者的结束事件。

### 误区 5："JavaScript 钩子不需要 done 回调"

**需要调用 done！** 在 `@enter` 和 `@leave` 钩子中，必须调用 `done()` 通知 Vue 动画结束，否则过渡会提前结束。

---

## 7 动手练习

### 练习 1：淡入淡出

创建一个按钮，点击后让文字淡入淡出。

<details>
<summary>点击查看答案</summary>

```vue
<script setup>
import { ref } from 'vue'

const show = ref(true)
</script>

<template>
  <button @click="show = !show">切换显示</button>
  
  <Transition>
    <p v-if="show">这段文字会淡入淡出</p>
  </Transition>
</template>

<style>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
```

</details>

### 练习 2：滑动效果

实现一个从右侧滑入/滑出的面板。

<details>
<summary>点击查看答案</summary>

```vue
<script setup>
import { ref } from 'vue'

const showPanel = ref(false)
</script>

<template>
  <button @click="showPanel = !showPanel">切换面板</button>
  
  <Transition name="slide">
    <div v-if="showPanel" class="panel">
      <p>这是侧边面板</p>
    </div>
  </Transition>
</template>

<style>
.panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 300px;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 10px rgba(0,0,0,0.1);
  padding: 20px;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
```

</details>

### 练习 3（挑战）：列表排序动画

创建一个待办列表，支持添加、删除，并且列表项位置变化时有平滑动画。

<details>
<summary>点击查看答案</summary>

```vue
<script setup>
import { ref } from 'vue'

const newTodo = ref('')
const todos = ref([
  { id: 1, text: '学习 Vue', done: false },
  { id: 2, text: '写代码', done: false },
  { id: 3, text: '看书', done: true }
])

let nextId = 4

const addTodo = () => {
  if (newTodo.value.trim()) {
    todos.value.push({
      id: nextId++,
      text: newTodo.value,
      done: false
    })
    newTodo.value = ''
  }
}

const removeTodo = (id) => {
  todos.value = todos.value.filter(todo => todo.id !== id)
}

const toggleTodo = (id) => {
  const todo = todos.value.find(t => t.id === id)
  if (todo) todo.done = !todo.done
}

const sortTodos = () => {
  todos.value.sort((a, b) => {
    if (a.done === b.done) return 0
    return a.done ? 1 : -1
  })
}
</script>

<template>
  <div>
    <input v-model="newTodo" @keyup.enter="addTodo" placeholder="添加待办" />
    <button @click="addTodo">添加</button>
    <button @click="sortTodos">排序</button>
    
    <TransitionGroup tag="ul" name="todo" class="todo-list">
      <li v-for="todo in todos" :key="todo.id" :class="{ done: todo.done }">
        <input type="checkbox" :checked="todo.done" @change="toggleTodo(todo.id)" />
        <span>{{ todo.text }}</span>
        <button @click="removeTodo(todo.id)">删除</button>
      </li>
    </TransitionGroup>
  </div>
</template>

<style>
.todo-list {
  list-style: none;
  padding: 0;
}

.todo-list li {
  margin: 5px 0;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.todo-list li.done span {
  text-decoration: line-through;
  color: #999;
}

.todo-enter-active,
.todo-leave-active {
  transition: all 0.5s ease;
}

.todo-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.todo-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.todo-move {
  transition: transform 0.5s ease;
}
</style>
```

</details>

---

## 下一章预告

下一章我们会学习 Vue 的**Teleport 与 Suspense**——也就是如何将组件渲染到 DOM 的任意位置，以及如何优雅地处理异步组件的加载状态。这些是构建复杂应用的重要工具。
