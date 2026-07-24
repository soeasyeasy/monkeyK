---
title: "第二章：模板语法"
description: "掌握 Vue 3 模板语法，包括插值、指令和绑定表达式"
---

# 第二章：模板语法

## 运行结果

| 语法 | 用途 | 示例 |
| --- | --- | --- |
| `{{ }}` | 文本插值 | `{{ message }}` |
| `v-bind` | 属性绑定 | `:class="active"` |
| `v-on` | 事件绑定 | `@click="handler"` |
| `v-if` | 条件渲染 | `v-if="isVisible"` |
| `v-for` | 列表渲染 | `v-for="item in list"` |
| `v-model` | 双向绑定 | `v-model="text"` |

## 代码示例

### 1. 文本插值

```vue
<script setup lang="ts">
import { ref } from 'vue'

const message = ref('Hello Vue 3!')
const html = ref('<strong>加粗文本</strong>')
</script>

<template>
  <!-- 文本插值 -->
  <p>{{ message }}</p>

  <!-- 原始 HTML（慎用） -->
  <p v-html="html"></p>

  <!-- 单次插值 -->
  <p v-once>{{ message }}</p>
</template>
```

### 2. 属性绑定

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isActive = ref(true)
const imgSrc = ref('https://example.com/image.png')
const dynamicId = ref('app')
</script>

<template>
  <!-- 完整语法 -->
  <div v-bind:id="dynamicId">完整语法</div>

  <!-- 缩写 -->
  <div :id="dynamicId">缩写形式</div>

  <!-- 动态 class -->
  <div :class="{ active: isActive }">动态 class</div>

  <!-- 动态 style -->
  <div :style="{ color: isActive ? 'red' : 'blue' }">动态 style</div>

  <!-- 图片 src -->
  <img :src="imgSrc" alt="示例图片" />
</template>
```

### 3. 事件绑定

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
const increment = () => count.value++
const handleClick = (e: MouseEvent) => {
  console.log('点击坐标', e.clientX, e.clientY)
}
</script>

<template>
  <!-- 完整语法 -->
  <button v-on:click="increment">v-on 写法</button>

  <!-- 缩写 -->
  <button @click="increment">缩写写法</button>

  <!-- 传递事件对象 -->
  <button @click="handleClick">获取事件对象</button>

  <!-- 内联表达式 -->
  <button @click="count++">内联表达式</button>

  <p>计数：{{ count }}</p>
</template>
```

### 4. 条件与列表渲染

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isVisible = ref(true)
const items = ref(['苹果', '香蕉', '橘子'])
</script>

<template>
  <!-- 条件渲染 -->
  <p v-if="isVisible">现在你看到我了</p>
  <p v-else>现在看不到了</p>

  <!-- 列表渲染 -->
  <ul>
    <li v-for="(item, index) in items" :key="index">
      {{ index + 1 }}. {{ item }}
    </li>
  </ul>
</template>
```

### 5. 双向绑定

```vue
<script setup lang="ts">
import { ref } from 'vue'

const text = ref('')
const checked = ref(false)
const selected = ref('A')
</script>

<template>
  <input v-model="text" placeholder="输入内容" />
  <p>输入的内容：{{ text }}</p>

  <label>
    <input type="checkbox" v-model="checked" />
    复选框
  </label>

  <select v-model="selected">
    <option value="A">选项 A</option>
    <option value="B">选项 B</option>
  </select>
</template>
```

## 核心知识点

1. **插值表达式**：`{{ }}` 支持任意 JavaScript 表达式
2. **指令缩写**：`:` 是 `v-bind` 的缩写，`@` 是 `v-on` 的缩写
3. **修饰符**：如 `.prevent`、`.stop` 等，用于指定特殊行为
4. **v-model**：实现表单元素与数据的双向绑定
5. **v-once / v-memo**：性能优化指令，避免不必要的重新渲染
