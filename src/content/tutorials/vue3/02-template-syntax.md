---
title: '第二章：模板语法'
description: '深入理解 Vue 3 模板语法，掌握数据绑定、指令和事件处理的原理与实战'
---

# 第二章：模板语法

## 本章导读

上一章我们创建了一个最简单的 Vue 项目，看到了 `{{ message }}` 能把数据显示在页面上。但模板能做的远不止这些。

这一章你会学到：

- **插值表达式**：怎么在 HTML 里显示数据
- **属性绑定**：怎么让 HTML 属性也变成动态的
- **事件绑定**：怎么响应用户的操作
- **条件渲染**：怎么根据数据显示或隐藏元素
- **列表渲染**：怎么循环渲染一组数据
- **双向绑定**：怎么让表单输入自动同步到数据

学完这章，你就能写出真正"活"的页面了。

---

## 2.1 插值表达式：在 HTML 里显示数据

### 基础用法

双大括号 `{{ }}` 是 Vue 的插值语法，作用是**把 JS 表达式的值显示在页面上**。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const message = ref('Hello Vue!')
const count = ref(42)
</script>

<template>
  <p>{{ message }}</p>
  <p>{{ count }}</p>
  <p>{{ count * 2 }}</p>
  <p>{{ count > 40 ? '大' : '小' }}</p>
</template>
```

> **原理**：`{{ }}` 里面可以写任何 JS 表达式（注意是表达式，不是语句）。Vue 会在数据变化时自动重新计算并更新显示。

### 支持的内容

```vue
<template>
  <!-- ✅ 支持：变量、运算、三元表达式、函数调用 -->
  <p>{{ message.split('').reverse().join('') }}</p>
  <p>{{ new Date().getFullYear() }}</p>

  <!-- ❌ 不支持：if、for 等语句 -->
  <!-- {{ if (ok) { return 'yes' } }}  这样写会报错 -->
</template>
```

### v-once：只渲染一次

如果你确定某些内容永远不会变，可以用 `v-once` 优化性能：

```vue
<template>
  <p v-once>{{ message }}</p>
  <!-- 即使 message 后面变了，这里也不会更新 -->
</template>
```

> **原理**：`v-once` 告诉 Vue"这个节点只编译一次"，后续数据变化时跳过它的更新。适合显示静态内容。

### v-html：渲染原始 HTML

默认情况下，`{{ }}` 会把内容当纯文本显示。如果你想渲染 HTML 标签：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const htmlContent = ref('<strong>加粗文本</strong>')
</script>

<template>
  <!-- 纯文本显示 -->
  <p>{{ htmlContent }}</p>

  <!-- 渲染为真正的 HTML -->
  <p v-html="htmlContent"></p>
</template>
```

> **⚠️ 警告**：`v-html` 有 XSS 攻击风险！永远不要用它渲染用户输入的内容。只在你完全信任数据来源时使用。

---

## 2.2 属性绑定：让 HTML 属性也变成动态的

### 基础用法

HTML 属性（如 `id`、`src`、`class`）通常是写死的。但很多时候我们需要根据数据动态设置属性。

Vue 提供了 `v-bind` 指令来实现属性绑定：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const dynamicId = ref('app')
const imgSrc = ref('https://example.com/image.png')
const isActive = ref(true)
</script>

<template>
  <!-- 完整写法 -->
  <div v-bind:id="dynamicId">完整写法</div>

  <!-- 缩写形式（推荐） -->
  <div :id="dynamicId">缩写写法</div>

  <img :src="imgSrc" alt="示例图片" />
</template>
```

> **原理**：`v-bind:id="dynamicId"` 的意思是"把 `id` 属性的值设置为 `dynamicId` 这个变量的值"。缩写 `:id` 是同样的意思。

### 动态 class

`class` 绑定是最常用的场景之一，Vue 提供了专门的语法：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isActive = ref(true)
const hasError = ref(false)
const activeClass = ref('active')
</script>

<template>
  <!-- 对象语法：根据 true/false 决定是否添加 class -->
  <div :class="{ active: isActive, error: hasError }">对象语法</div>

  <!-- 数组语法：同时应用多个 class -->
  <div :class="[activeClass, 'another-class']">数组语法</div>

  <!-- 混合使用 -->
  <div class="static" :class="{ active: isActive }">静态 + 动态</div>
</template>
```

> **原理**：`:class="{ active: isActive }"` 的意思是"如果 `isActive` 为 true，就添加 `active` 这个 class"。Vue 会自动合并静态和动态的 class。

### 动态 style

类似地，`:style` 可以动态设置内联样式：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const fontSize = ref('16px')
const color = ref('red')
</script>

<template>
  <div :style="{ fontSize: fontSize, color: color }">动态样式</div>

  <!-- 可以简写（驼峰命名） -->
  <div :style="{ fontSize, color }">简写形式</div>
</template>
```

---

## 2.3 事件绑定：响应用户操作

### 基础用法

`v-on` 指令用于监听 DOM 事件：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

const increment = () => {
  count.value++
}

const handleClick = (event: MouseEvent) => {
  console.log('点击坐标', event.clientX, event.clientY)
}
</script>

<template>
  <!-- 完整写法 -->
  <button v-on:click="increment">v-on 写法</button>

  <!-- 缩写形式（推荐） -->
  <button @click="increment">@ 缩写</button>

  <!-- 内联表达式 -->
  <button @click="count++">内联写法</button>

  <!-- 传递事件对象 -->
  <button @click="handleClick">获取事件对象</button>

  <p>计数：{{ count }}</p>
</template>
```

> **原理**：`@click="increment"` 的意思是"监听 click 事件，触发时执行 `increment` 函数"。`@` 是 `v-on:` 的缩写。

### 事件修饰符

Vue 提供了事件修饰符来简化常见的事件处理逻辑：

```vue
<template>
  <!-- .prevent：阻止默认行为（相当于 event.preventDefault()） -->
  <form @submit.prevent="onSubmit">
    <button type="submit">提交</button>
  </form>

  <!-- .stop：阻止事件冒泡（相当于 event.stopPropagation()） -->
  <div @click="outerClick">
    <button @click.stop="innerClick">内部按钮</button>
  </div>

  <!-- .once：只触发一次 -->
  <button @click.once="onlyOnce">只能点一次</button>

  <!-- 按键修饰符 -->
  <input @keyup.enter="onEnter" placeholder="按回车触发" />
</template>
```

> **原理**：修饰符是以 `.` 开头的特殊后缀，告诉 Vue 对事件做特殊处理。`.prevent` 自动调用 `event.preventDefault()`，`.stop` 自动调用 `event.stopPropagation()`。

---

## 2.4 条件渲染：根据数据显示或隐藏元素

### v-if / v-else-if / v-else

```vue
<script setup lang="ts">
import { ref } from 'vue'

const score = ref(85)
</script>

<template>
  <p v-if="score >= 90">优秀</p>
  <p v-else-if="score >= 80">良好</p>
  <p v-else-if="score >= 60">及格</p>
  <p v-else>不及格</p>
</template>
```

> **原理**：`v-if` 是"真正的"条件渲染——当条件为 false 时，元素会被完全从 DOM 中移除（不是隐藏）。`v-else-if` 和 `v-else` 必须紧跟在 `v-if` 或另一个 `v-else-if` 后面。

### v-show

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isVisible = ref(true)
</script>

<template>
  <p v-show="isVisible">v-show 控制的元素</p>
</template>
```

> **原理**：`v-show` 只是简单地切换 CSS 的 `display` 属性。元素始终在 DOM 中，只是视觉上隐藏了。

### v-if vs v-show 怎么选？

| 场景             | 推荐                               |
| ---------------- | ---------------------------------- |
| 条件很少变化     | `v-if`（避免初始渲染开销）         |
| 需要频繁切换     | `v-show`（避免反复创建/销毁 DOM）  |
| 条件复杂、有嵌套 | `v-if`（`v-show` 不支持 `v-else`） |

---

## 2.5 列表渲染：循环渲染一组数据

### v-for 基础

```vue
<script setup lang="ts">
import { ref } from 'vue'

const items = ref(['苹果', '香蕉', '橘子'])
</script>

<template>
  <ul>
    <li v-for="item in items" :key="item">
      {{ item }}
    </li>
  </ul>
</template>
```

> **原理**：`v-for="item in items"` 的意思是"遍历 `items` 数组，每次循环把当前元素赋值给 `item`"。`:key` 是必须的，用来帮助 Vue 识别每个节点的身份（后面会详细解释）。

### 获取索引

```vue
<template>
  <ul>
    <li v-for="(item, index) in items" :key="index">{{ index + 1 }}. {{ item }}</li>
  </ul>
</template>
```

### 遍历对象

```vue
<script setup lang="ts">
import { ref } from 'vue'

const user = ref({
  name: '张三',
  age: 25,
  city: '北京',
})
</script>

<template>
  <ul>
    <li v-for="(value, key) in user" :key="key">{{ key }}: {{ value }}</li>
  </ul>
</template>
```

### 为什么需要 key？

```vue
<!-- ❌ 不推荐：用 index 作为 key -->
<li v-for="(item, index) in items" :key="index">

<!-- ✅ 推荐：用唯一标识作为 key -->
<li v-for="item in items" :key="item.id">
```

> **原理**：当列表顺序变化时（比如插入、删除、排序），Vue 需要知道哪个元素对应哪个数据。`key` 就是元素的"身份证"，帮助 Vue 高效地更新 DOM。用 `index` 作为 key 在列表顺序变化时会出问题。

---

## 2.6 双向绑定：表单输入自动同步

### v-model 基础

`v-model` 可以在表单元素和数据之间创建双向绑定：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const text = ref('')
const checked = ref(false)
const selected = ref('A')
</script>

<template>
  <!-- 文本输入 -->
  <input v-model="text" placeholder="输入内容" />
  <p>输入的内容：{{ text }}</p>

  <!-- 复选框 -->
  <label>
    <input type="checkbox" v-model="checked" />
    复选框
  </label>
  <p>选中状态：{{ checked }}</p>

  <!-- 下拉选择 -->
  <select v-model="selected">
    <option value="A">选项 A</option>
    <option value="B">选项 B</option>
  </select>
  <p>选中的值：{{ selected }}</p>
</template>
```

> **原理**：`v-model` 其实是语法糖，它做了两件事：
>
> 1. 绑定 `:value="text"`（数据 → 视图）
> 2. 监听 `@input="text = $event.target.value"`（视图 → 数据）

### v-model 修饰符

```vue
<template>
  <!-- .lazy：失去焦点时才更新（而不是每次输入） -->
  <input v-model.lazy="text" />

  <!-- .number：自动转换为数字 -->
  <input v-model.number="age" type="number" />

  <!-- .trim：自动去除首尾空格 -->
  <input v-model.trim="name" />
</template>
```

---

## 2.7 核心知识点总结

| 语法              | 用途       | 示例                        |
| ----------------- | ---------- | --------------------------- |
| `{{ }}`           | 文本插值   | `{{ message }}`             |
| `v-bind` / `:`    | 属性绑定   | `:class="active"`           |
| `v-on` / `@`      | 事件绑定   | `@click="handler"`          |
| `v-if` / `v-else` | 条件渲染   | `v-if="isVisible"`          |
| `v-show`          | 显示/隐藏  | `v-show="isVisible"`        |
| `v-for`           | 列表渲染   | `v-for="item in list"`      |
| `v-model`         | 双向绑定   | `v-model="text"`            |
| `v-once`          | 只渲染一次 | `<p v-once>{{ msg }}</p>`   |
| `v-html`          | 渲染 HTML  | `<div v-html="html"></div>` |

---

## 2.8 新手常见误区

### 误区 1："v-if 和 v-show 是一样的"

不是的。`v-if` 是真正添加/移除 DOM 元素，`v-show` 只是切换 CSS `display`。频繁切换用 `v-show`，条件很少变化用 `v-if`。

### 误区 2："v-for 不需要 key"

**必须加 key！** 不加 key 时 Vue 会用"就地复用"策略，列表顺序变化时可能导致状态错乱。用唯一标识（如 id）作为 key，不要用 index。

### 误区 3："v-model 只能用在 input 上"

`v-model` 可以用在任何表单元素上：`<input>`、`<textarea>`、`<select>`、`<checkbox>`、`<radio>` 等。

### 误区 4："{{ }} 里可以写任何 JS 代码"

`{{ }}` 里只能写**表达式**，不能写语句。比如可以写 `a + b`、`ok ? 'yes' : 'no'`，但不能写 `if (...) { ... }` 或 `for (...) { ... }`。

---

## 2.9 动手练习

### 练习 1：动态样式

创建一个按钮，点击后切换"激活"状态。激活时按钮变蓝色，未激活时变灰色。

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isActive = ref(false)
</script>

<template>
  <button
    :class="{ active: isActive }"
    :style="{ backgroundColor: isActive ? 'blue' : 'gray' }"
    @click="isActive = !isActive"
  >
    切换状态
  </button>
</template>

<style scoped>
.active {
  color: white;
}
</style>
```

</details>

### 练习 2：待办事项列表

实现一个简单的待办事项列表：输入框 + 添加按钮 + 列表显示。

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref } from 'vue'

const inputText = ref('')
const todos = ref<string[]>([])

const addTodo = () => {
  if (inputText.value.trim()) {
    todos.value.push(inputText.value)
    inputText.value = ''
  }
}
</script>

<template>
  <div>
    <input v-model="inputText" @keyup.enter="addTodo" placeholder="输入待办" />
    <button @click="addTodo">添加</button>

    <ul>
      <li v-for="(todo, index) in todos" :key="index">
        {{ todo }}
      </li>
    </ul>

    <p v-if="todos.length === 0">暂无待办事项</p>
  </div>
</template>
```

</details>

### 练习 3（挑战）：成绩评级

输入一个分数（0-100），根据分数显示等级：

- 90-100：优秀
- 80-89：良好
- 60-79：及格
- 0-59：不及格

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref } from 'vue'

const score = ref(0)
</script>

<template>
  <div>
    <input v-model.number="score" type="number" min="0" max="100" />

    <p v-if="score >= 90 && score <= 100">优秀</p>
    <p v-else-if="score >= 80">良好</p>
    <p v-else-if="score >= 60">及格</p>
    <p v-else-if="score >= 0">不及格</p>
    <p v-else>请输入有效分数</p>
  </div>
</template>
```

</details>

---

## 下一章预告

下一章我们会深入讲解 Vue 的**响应式系统**——也就是 `ref`、`reactive`、`computed` 这些 API 背后的原理。你会明白为什么数据变了页面会自动更新，以及怎么正确使用这些 API。
