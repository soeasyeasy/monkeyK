---
title: '第五章：事件处理'
description: '深入掌握 Vue 3 事件绑定、修饰符和事件对象的原理与实战'
---

# 第五章：事件处理

## 本章导读

前两章我们学会了怎么显示数据，但页面不能只是"看"，还要能"交互"。用户点击按钮、输入文字、按下键盘——这些都需要事件处理。

你可能会问：

- 用原生 JS 的 `addEventListener` 不行吗？为什么需要 `@click`？
- 事件修饰符（`.stop`、`.prevent`）到底是什么？什么时候用？
- 怎么在事件处理函数里同时拿到事件对象和自己的参数？

这一章我们会彻底搞懂 Vue 的事件处理机制，让你写出干净、高效的交互代码。

---

## 5.1 为什么需要 Vue 的事件处理？

### 痛点分析

假设你要做一个"点击计数器"，用原生 JS 写起来是这样的：

```javascript
// 原生 JS 方式
const btn = document.getElementById('btn')
const countEl = document.getElementById('count')
let count = 0

btn.addEventListener('click', () => {
  count++
  countEl.textContent = count
})
```

问题很明显：

- **需要手动找到 DOM 元素**
- **需要手动更新显示**
- **代码散落各处**，逻辑不集中

### Vue 的解决方案

Vue 让你直接在模板里绑定事件，逻辑和数据都在组件里：

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 响应式计数器
const count = ref(0)

// 事件处理函数
const increment = () => {
  count.value++
}
</script>

<template>
  <!-- 直接绑定事件，简洁明了 -->
  <button @click="increment">点击 +1</button>
  <p>计数：{{ count }}</p>
</template>
```

> **一句话总结**：Vue 的事件处理让你不用手动操作 DOM，事件、数据、视图自动同步。

---

## 5.2 核心原理

### 事件冒泡与事件捕获

在理解事件修饰符之前，你需要知道"事件冒泡"的概念。

当一个元素上发生事件时，这个事件会**从内向外传播**：

```
点击按钮 → 按钮 → 父元素 → 祖父元素 → ... → document
```

> **类比**：像往水里扔石头，波纹从中心向外扩散。按钮是"石头"，父元素是"波纹"。

### 默认行为

某些元素有"默认行为"，比如：

- 点击 `<a>` 会跳转
- 提交 `<form>` 会刷新页面
- 点击右键会弹出菜单

有时候你想阻止这些默认行为，Vue 提供了修饰符来简化操作。

---

## 5.3 基础用法

### 基础事件绑定

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 创建响应式计数器
const count = ref(0)

// 定义事件处理函数
const increment = () => {
  count.value++
}

const decrement = () => {
  count.value--
}
</script>

<template>
  <p>计数：{{ count }}</p>

  <!-- 绑定事件处理函数 -->
  <button @click="increment">+1</button>
  <button @click="decrement">-1</button>

  <!-- 内联表达式：直接写简单逻辑 -->
  <button @click="count++">内联 +1</button>
</template>
```

> **原理**：`@click` 是 `v-on:click` 的缩写。Vue 会在底层自动调用 `addEventListener`，并在组件销毁时自动移除监听器，防止内存泄漏。

### 事件参数

#### 自动获取事件对象

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 事件处理函数，参数是事件对象
const handleClick = (event: MouseEvent) => {
  // 可以访问事件的所有属性
  console.log('点击坐标：', event.clientX, event.clientY)
  console.log('目标元素：', event.target)
}
</script>

<template>
  <!-- Vue 会自动传入事件对象 -->
  <button @click="handleClick">点击获取坐标</button>
</template>
```

> **原理**：当你在 `@click` 里只写函数名时，Vue 会自动把事件对象作为第一个参数传入。

#### 同时传入事件和自定义参数

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 需要同时接收事件和自定义参数
const handleWithArgs = (event: MouseEvent, id: number) => {
  console.log('点击了项目：', id)
  console.log('点击坐标：', event.clientX)
}
</script>

<template>
  <!-- 用 $event 访问事件对象 -->
  <button @click="handleWithArgs($event, 42)">点击传入参数</button>
</template>
```

> **原理**：`$event` 是 Vue 的特殊变量，代表原生事件对象。当你需要同时传入事件和自定义参数时，用 `$event` 占位。

#### 只传自定义参数

```vue
<template>
  <!-- 不需要事件对象时，直接传参 -->
  <button @click="handleWithArgs($event, 100)">传入 ID</button>
</template>
```

---

## 5.4 进阶用法

### 事件修饰符

Vue 提供了多种修饰符来简化常见的事件处理逻辑。

#### .stop 阻止事件冒泡

```vue
<script setup lang="ts">
import { ref } from 'vue'

const outerClick = () => console.log('外层点击')
const innerClick = () => console.log('内层点击')
</script>

<template>
  <!-- 外层 div 监听点击 -->
  <div @click="outerClick">
    <!-- .stop 阻止事件冒泡到外层 -->
    <button @click.stop="innerClick">点击不会冒泡到外层</button>
  </div>
</template>
```

> **原理**：`.stop` 会在底层调用 `event.stopPropagation()`，阻止事件继续向父元素传播。

#### .prevent 阻止默认行为

```vue
<script setup lang="ts">
import { ref } from 'vue'

const formSubmit = () => {
  console.log('表单提交')
  // 这里可以发 AJAX 请求，不会刷新页面
}
</script>

<template>
  <!-- .prevent 阻止表单默认提交行为 -->
  <form @submit.prevent="formSubmit">
    <button type="submit">提交（不刷新页面）</button>
  </form>
</template>
```

> **原理**：`.prevent` 会在底层调用 `event.preventDefault()`，阻止元素的默认行为。

#### .once 只触发一次

```vue
<template>
  <!-- .once 让事件只触发一次，之后自动移除监听器 -->
  <button @click.once="innerClick">只能点击一次</button>
</template>
```

> **原理**：`.once` 会在第一次触发后自动移除事件监听器，适合"确认删除"等场景。

#### .self 只在事件目标是自身时触发

```vue
<template>
  <!-- .self 只有点击 div 本身才触发，点击子元素不触发 -->
  <div @click.self="outerClick" style="padding: 20px; background: #eee;">
    <button>点击子元素不会触发</button>
  </div>
</template>
```

> **原理**：`.self` 会检查 `event.target` 是否等于当前元素，只有相等时才执行处理函数。

#### 修饰符链式使用

```vue
<template>
  <!-- 可以同时使用多个修饰符 -->
  <a @click.stop.prevent="handleClick"> 阻止冒泡 + 阻止默认行为 </a>
</template>
```

### 按键修饰符

监听键盘事件时，可以用按键修饰符过滤特定按键。

#### 常用按键别名

```vue
<script setup lang="ts">
import { ref } from 'vue'

const inputText = ref('')

const handleSubmit = () => {
  console.log('提交：', inputText.value)
}
</script>

<template>
  <!-- 按回车键提交 -->
  <input @keyup.enter="handleSubmit" v-model="inputText" />
</template>
```

常用按键别名：

- `.enter` - 回车
- `.tab` - Tab
- `.delete` - Delete/Backspace
- `.esc` - Esc
- `.space` - 空格
- `.up` / `.down` / `.left` / `.right` - 方向键

#### 组合按键

```vue
<template>
  <!-- Ctrl + Enter -->
  <input @keyup.ctrl.enter="handleSubmit" />

  <!-- Ctrl + Click -->
  <button @click.ctrl="handleKeydown">Ctrl + Click</button>

  <!-- Shift + Click -->
  <button @click.shift="handleKeydown">Shift + Click</button>

  <!-- Alt + Click -->
  <button @click.alt="handleKeydown">Alt + Click</button>
</template>
```

#### .exact 精确匹配

```vue
<template>
  <!-- .exact 确保只按了 Ctrl，没有按其他修饰键 -->
  <button @click.ctrl.exact="handleKeydown">仅 Ctrl（不含其他修饰键）</button>
</template>
```

> **原理**：不加 `.exact` 时，`@click.ctrl` 在按 Ctrl+Shift 时也会触发。加了 `.exact` 后，必须精确匹配。

### 鼠标修饰符

```vue
<script setup lang="ts">
const handleMouse = () => {
  console.log('鼠标事件触发')
}
</script>

<template>
  <!-- .left 只响应左键 -->
  <button @mousedown.left="handleMouse">左键点击</button>

  <!-- .right 只响应右键 -->
  <button @mousedown.right="handleMouse">右键点击</button>

  <!-- .middle 只响应中键 -->
  <button @mousedown.middle="handleMouse">中键点击</button>
</template>
```

---

## 5.5 核心知识点总结

| 修饰符     | 用途                     | 示例                | 底层实现                  |
| ---------- | ------------------------ | ------------------- | ------------------------- |
| `.stop`    | 阻止事件冒泡             | `@click.stop`       | `event.stopPropagation()` |
| `.prevent` | 阻止默认行为             | `@submit.prevent`   | `event.preventDefault()`  |
| `.once`    | 只触发一次               | `@click.once`       | 自动移除监听器            |
| `.self`    | 只在事件目标是自身时触发 | `@click.self`       | 检查 `event.target`       |
| `.passive` | 被动监听器               | `@scroll.passive`   | 优化滚动性能              |
| `.capture` | 捕获模式                 | `@click.capture`    | 在捕获阶段触发            |
| `.enter`   | 回车键                   | `@keyup.enter`      | 过滤按键                  |
| `.ctrl`    | Ctrl 键                  | `@click.ctrl`       | 组合按键                  |
| `.exact`   | 精确匹配                 | `@click.ctrl.exact` | 严格匹配修饰键            |

---

## 5.6 新手常见误区

### 误区 1："@click 和 onclick 是一样的"

**不一样！**

- `@click` 是 Vue 的指令，会自动处理响应式、内存泄漏等问题
- `onclick` 是原生 HTML 属性，需要手动管理

**正确做法**：在 Vue 中始终用 `@click`。

### 误区 2："事件处理函数不能传参数"

**可以传！**

用 `$event` 访问事件对象，同时传自定义参数：

```vue
<!-- ✅ 正确 -->
<button @click="handleClick($event, item.id)">点击</button>

<!-- ❌ 错误：这样 handleClick 收不到事件对象 -->
<button @click="handleClick(item.id)">点击</button>
```

### 误区 3："修饰符顺序无所谓"

**有讲究！**

修饰符是有顺序的，比如 `@click.self.prevent` 和 `@click.prevent.self` 行为不同：

- `@click.self.prevent`：只有点击自身时才阻止默认行为
- `@click.prevent.self`：先阻止默认行为，再判断是否点击自身

### 误区 4："@keyup.enter 只能用在 input 上"

**不是！**

`@keyup.enter` 可以用在任何元素上，只要该元素能接收键盘事件：

```vue
<!-- 整个 div 都能监听回车 -->
<div @keyup.enter="handleSubmit" tabindex="0">
  按回车触发
</div>
```

### 误区 5："事件处理函数里不能用箭头函数"

**可以用！**

箭头函数和普通函数在事件处理中没有区别。只要注意 `this` 的指向即可（在 `<script setup>` 中不需要考虑 `this`）。

---

## 5.7 动手练习

### 练习 1：计数器

实现一个计数器，支持 +1、-1、重置。

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 响应式计数器
const count = ref(0)

// 事件处理函数
const increment = () => {
  count.value++
}

const decrement = () => {
  count.value--
}

const reset = () => {
  count.value = 0
}
</script>

<template>
  <div>
    <p>计数：{{ count }}</p>
    <button @click="increment">+1</button>
    <button @click="decrement">-1</button>
    <button @click="reset">重置</button>
  </div>
</template>
```

</details>

### 练习 2：表单提交

实现一个表单，提交时阻止默认行为，打印输入内容。

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 表单数据
const username = ref('')
const email = ref('')

// 提交处理函数
const handleSubmit = () => {
  console.log('用户名：', username.value)
  console.log('邮箱：', email.value)
  // 这里可以发 AJAX 请求
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <label>用户名：</label>
      <input v-model="username" type="text" required />
    </div>
    <div>
      <label>邮箱：</label>
      <input v-model="email" type="email" required />
    </div>
    <button type="submit">提交</button>
  </form>
</template>
```

</details>

### 练习 3（挑战）：待办事项

实现一个完整的待办事项应用：

- 输入框 + 添加按钮（支持回车添加）
- 显示待办列表，可以勾选完成
- 可以删除待办
- 点击删除按钮时阻止事件冒泡

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 待办接口定义
interface Todo {
  id: number
  text: string
  done: boolean
}

// 表单数据
const newTodo = ref('')

// 待办列表
const todos = ref<Todo[]>([])

// 下一个 ID
let nextId = 1

// 添加待办
const addTodo = () => {
  if (!newTodo.value.trim()) return
  todos.value.push({
    id: nextId++,
    text: newTodo.value,
    done: false,
  })
  newTodo.value = ''
}

// 删除待办
const removeTodo = (id: number) => {
  todos.value = todos.value.filter((t) => t.id !== id)
}

// 切换完成状态
const toggleTodo = (id: number) => {
  const todo = todos.value.find((t) => t.id === id)
  if (todo) todo.done = !todo.done
}
</script>

<template>
  <div>
    <!-- 表单：支持回车添加 -->
    <form @submit.prevent="addTodo">
      <input v-model="newTodo" placeholder="添加待办..." />
      <button type="submit">添加</button>
    </form>

    <!-- 待办列表 -->
    <ul>
      <li v-for="todo in todos" :key="todo.id">
        <!-- 勾选框 -->
        <input type="checkbox" :checked="todo.done" @change="toggleTodo(todo.id)" />

        <!-- 文本：完成时划线 -->
        <span :style="{ textDecoration: todo.done ? 'line-through' : 'none' }">
          {{ todo.text }}
        </span>

        <!-- 删除按钮：.stop 阻止冒泡 -->
        <button @click.stop="removeTodo(todo.id)">删除</button>
      </li>
    </ul>
  </div>
</template>
```

</details>

---

## 下一章预告

下一章我们会学习 Vue 的**表单输入绑定**——也就是 `v-model` 在各类表单元素中的高级用法。你会学到 `v-model` 的修饰符、自定义组件的 `v-model`，以及表单验证技巧。
