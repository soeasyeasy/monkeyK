---
title: "第五章：事件处理"
description: "学习 Vue 3 中的事件绑定、修饰符和事件对象"
---

# 第五章：事件处理

## 运行结果

| 修饰符 | 用途 | 示例 |
| --- | --- | --- |
| `.stop` | 阻止事件冒泡 | `@click.stop` |
| `.prevent` | 阻止默认行为 | `@submit.prevent` |
| `.once` | 只触发一次 | `@click.once` |
| `.self` | 只在事件目标是自身时触发 | `@click.self` |
| `.passive` | 被动监听器 | `@scroll.passive` |
| `.capture` | 捕获模式 | `@click.capture` |

## 代码示例

### 1. 基础事件绑定

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

const increment = () => {
  count.value++
}

const decrement = () => {
  count.value--
}
</script>

<template>
  <p>计数：{{ count }}</p>
  <button @click="increment">+1</button>
  <button @click="decrement">-1</button>

  <!-- 内联表达式 -->
  <button @click="count++">内联 +1</button>
</template>
```

### 2. 事件参数

```vue
<script setup lang="ts">
import { ref } from 'vue'

const handleClick = (event: MouseEvent) => {
  console.log('点击坐标：', event.clientX, event.clientY)
}

const handleWithArgs = (event: MouseEvent, id: number) => {
  console.log('点击了项目：', id)
}
</script>

<template>
  <!-- 自动传入事件对象 -->
  <button @click="handleClick">点击获取坐标</button>

  <!-- 同时传入事件和自定义参数 -->
  <button @click="handleWithArgs($event, 42)">
    点击传入参数
  </button>

  <!-- 只传自定义参数（不传事件） -->
  <button @click="handleWithArgs($event, 100)">
    传入 ID
  </button>
</template>
```

### 3. 事件修饰符

```vue
<script setup lang="ts">
import { ref } from 'vue'

const outerClick = () => console.log('外层点击')
const innerClick = () => console.log('内层点击')
const formSubmit = () => console.log('表单提交')
</script>

<template>
  <!-- .stop 阻止冒泡 -->
  <div @click="outerClick">
    <button @click.stop="innerClick">
      点击不会冒泡到外层
    </button>
  </div>

  <!-- .prevent 阻止默认行为 -->
  <form @submit.prevent="formSubmit">
    <button type="submit">提交（不刷新页面）</button>
  </form>

  <!-- .once 只触发一次 -->
  <button @click.once="innerClick">
    只能点击一次
  </button>

  <!-- .self 只在事件目标是自身时触发 -->
  <div @click.self="outerClick" style="padding: 20px; background: #eee;">
    <button>点击子元素不会触发</button>
  </div>
</template>
```

### 4. 按键修饰符

```vue
<script setup lang="ts">
import { ref } from 'vue'

const inputText = ref('')

const handleKeydown = (e: KeyboardEvent) => {
  console.log('按下的键：', e.key)
}

const handleSubmit = () => {
  console.log('提交：', inputText.value)
}
</script>

<template>
  <!-- 按键别名 -->
  <input @keyup.enter="handleSubmit" v-model="inputText" />

  <!-- 组合按键 -->
  <input @keyup.ctrl.enter="handleSubmit" />

  <!-- 系统修饰键 -->
  <button @click.ctrl="handleKeydown">Ctrl + Click</button>
  <button @click.shift="handleKeydown">Shift + Click</button>
  <button @click.alt="handleKeydown">Alt + Click</button>

  <!-- .exact 精确匹配 -->
  <button @click.ctrl.exact="handleKeydown">
    仅 Ctrl（不含其他修饰键）
  </button>
</template>
```

### 5. 鼠标修饰符

```vue
<script setup lang="ts">
const handleMouse = () => {
  console.log('鼠标事件触发')
}
</script>

<template>
  <!-- .left 左键 -->
  <button @mousedown.left="handleMouse">左键点击</button>

  <!-- .right 右键 -->
  <button @mousedown.right="handleMouse">右键点击</button>

  <!-- .middle 中键 -->
  <button @mousedown.middle="handleMouse">中键点击</button>
</template>
```

### 6. 实战：待办事项

```vue
<script setup lang="ts">
import { ref } from 'vue'

interface Todo {
  id: number
  text: string
  done: boolean
}

const newTodo = ref('')
const todos = ref<Todo[]>([])
let nextId = 1

const addTodo = () => {
  if (!newTodo.value.trim()) return
  todos.value.push({
    id: nextId++,
    text: newTodo.value,
    done: false
  })
  newTodo.value = ''
}

const removeTodo = (id: number) => {
  todos.value = todos.value.filter(t => t.id !== id)
}

const toggleTodo = (id: number) => {
  const todo = todos.value.find(t => t.id === id)
  if (todo) todo.done = !todo.done
}
</script>

<template>
  <div>
    <form @submit.prevent="addTodo">
      <input v-model="newTodo" placeholder="添加待办..." />
      <button type="submit">添加</button>
    </form>

    <ul>
      <li v-for="todo in todos" :key="todo.id">
        <input
          type="checkbox"
          :checked="todo.done"
          @change="toggleTodo(todo.id)"
        />
        <span :style="{ textDecoration: todo.done ? 'line-through' : 'none' }">
          {{ todo.text }}
        </span>
        <button @click="removeTodo(todo.id)">删除</button>
      </li>
    </ul>
  </div>
</template>
```

## 核心知识点

1. **`@` 是 `v-on` 的缩写**：用于绑定事件监听器
2. **事件修饰符可以链式使用**：如 `@click.stop.prevent`
3. **`$event` 访问原生事件对象**：在内联表达式中获取事件
4. **按键修饰符**：`.enter`、`.tab`、`.delete`、`.esc` 等
5. **`.passive` 修饰符**：优化滚动性能，不阻塞默认行为
