---
title: '第九章：生命周期'
description: '深入掌握 Vue 3 组合式 API 中的生命周期钩子原理与实战'
---

# 第九章：生命周期

## 本章导读

前面我们学会了怎么创建组件、传递数据，但组件从创建到销毁的整个过程是怎么样的？在哪些时刻可以执行特定操作？

你可能会问：

- 组件的生命周期有哪些阶段？
- 什么时候可以访问 DOM？
- 怎么在组件销毁时清理定时器？
- `onMounted` 和 `onUpdated` 有什么区别？

这一章我们会彻底搞懂 Vue 的生命周期，让你知道在什么时机做什么事。

---

## 1 为什么需要生命周期？

### 痛点分析

假设你要做一个"实时时钟"组件，显示当前时间并每秒更新。如果不知道生命周期，你可能会这样写：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const currentTime = ref(new Date().toLocaleTimeString())

// ❌ 问题：定时器永远不会被清理
setInterval(() => {
  currentTime.value = new Date().toLocaleTimeString()
}, 1000)
</script>
```

问题很明显：

- **定时器永远不会停止**：即使组件被销毁，定时器还在运行，造成内存泄漏
- **不知道什么时候该初始化**：有些操作需要等 DOM 渲染完成后才能执行
- **不知道什么时候该清理**：组件销毁时需要清理定时器、事件监听等

### Vue 的解决方案：生命周期钩子

Vue 提供了生命周期钩子，让你在组件的不同阶段执行特定操作：

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const currentTime = ref(new Date().toLocaleTimeString())
let timer: number | null = null

// ✅ 组件挂载后启动定时器
onMounted(() => {
  timer = window.setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString()
  }, 1000)
})

// ✅ 组件卸载后清理定时器
onUnmounted(() => {
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
})
</script>
```

> **一句话总结**：生命周期钩子让你在组件的不同阶段执行特定操作，避免内存泄漏和错误操作。

---

## 2 核心原理

### 组件的生命周期

一个组件从创建到销毁，会经历以下阶段：

```
创建 → 挂载 → 更新 → 卸载
```

每个阶段都有对应的钩子函数：

| 钩子函数          | 调用时机 | 常见用途                           |
| ----------------- | -------- | ---------------------------------- |
| `onBeforeMount`   | 挂载前   | 初始化数据、设置初始状态           |
| `onMounted`       | 挂载后   | DOM 操作、发起网络请求、启动定时器 |
| `onBeforeUpdate`  | 更新前   | 获取更新前的 DOM 状态              |
| `onUpdated`       | 更新后   | 操作更新后的 DOM                   |
| `onBeforeUnmount` | 卸载前   | 清理定时器、取消订阅               |
| `onUnmounted`     | 卸载后   | 最终清理工作                       |

> **类比**：生命周期像人的一生——出生（创建）、成长（挂载）、变化（更新）、死亡（卸载）。每个阶段都有特定的事情要做。

### 执行顺序

```
1. setup() 函数执行（同步）
2. 模板编译，DOM 挂载
3. onBeforeMount 钩子执行
4. onMounted 钩子执行
5. 数据变化触发更新
6. onBeforeUpdate 钩子执行
7. DOM 更新
8. onUpdated 钩子执行
9. 组件卸载
10. onBeforeUnmount 钩子执行
11. onUnmounted 钩子执行
```

---

## 3 基础用法

### 基础生命周期钩子

```vue
<script setup lang="ts">
import {
  ref,
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
} from 'vue'

const count = ref(0)
const message = ref('初始化')

// 挂载前
onBeforeMount(() => {
  console.log('组件即将挂载')
  // 此时 DOM 还未生成，不能访问 DOM
})

// 挂载后
onMounted(() => {
  console.log('组件已挂载')
  // 可以访问 DOM
  message.value = '已挂载'

  // 常见用途：发起网络请求
  fetchData()
})

// 更新前
onBeforeUpdate(() => {
  console.log('组件即将更新')
  // 可以获取更新前的 DOM 状态
})

// 更新后
onUpdated(() => {
  console.log('组件已更新')
  // DOM 已更新
})

// 卸载前
onBeforeUnmount(() => {
  console.log('组件即将卸载')
  // 清理工作
})

// 卸载后
onUnmounted(() => {
  console.log('组件已卸载')
  // 最终清理
})

const fetchData = async () => {
  // 模拟网络请求
  message.value = '数据加载中...'
}

const increment = () => {
  count.value++
}
</script>

<template>
  <div>
    <p>{{ message }}</p>
    <p>计数：{{ count }}</p>
    <button @click="increment">+1</button>
  </div>
</template>
```

> **原理**：生命周期钩子是回调函数，Vue 会在特定时机调用它们。

---

## 4 进阶用法

### 定时器管理

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const seconds = ref(0)
let timer: number | null = null

// 组件挂载后启动定时器
onMounted(() => {
  console.log('启动计时器')
  timer = window.setInterval(() => {
    seconds.value++
  }, 1000)
})

// 组件卸载后清理定时器
onUnmounted(() => {
  console.log('清理计时器')
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<template>
  <p>已运行：{{ seconds }} 秒</p>
</template>
```

> **原理**：在 `onMounted` 中启动定时器，在 `onUnmounted` 中清理，防止内存泄漏。

### 事件监听管理

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const windowWidth = ref(window.innerWidth)

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

// 组件挂载后添加事件监听
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

// 组件卸载后移除事件监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <p>窗口宽度：{{ windowWidth }}px</p>
</template>
```

> **原理**：在 `onMounted` 中添加事件监听，在 `onUnmounted` 中移除，防止内存泄漏。

### DOM 操作

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

// 组件挂载后可以访问 DOM
onMounted(() => {
  // 访问 canvas 元素
  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d')
    if (ctx) {
      ctx.fillStyle = 'red'
      ctx.fillRect(10, 10, 100, 100)
    }
  }

  // 自动聚焦输入框
  inputRef.value?.focus()
})
</script>

<template>
  <canvas ref="canvasRef" width="200" height="200"></canvas>
  <input ref="inputRef" type="text" placeholder="自动聚焦" />
</template>
```

> **原理**：在 `onMounted` 中，DOM 已经渲染完成，可以通过 `ref` 访问 DOM 元素。

### 第三方库集成

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Chart from 'chart.js'

const chartRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const data = ref([10, 20, 30, 40, 50])

// 组件挂载后初始化图表
onMounted(() => {
  if (chartRef.value) {
    chartInstance = new Chart(chartRef.value, {
      type: 'bar',
      data: {
        labels: ['A', 'B', 'C', 'D', 'E'],
        datasets: [
          {
            label: '数据',
            data: data.value,
          },
        ],
      },
    })
  }
})

// 组件卸载后销毁图表
onUnmounted(() => {
  chartInstance?.destroy()
  chartInstance = null
})
</script>

<template>
  <canvas ref="chartRef"></canvas>
</template>
```

> **原理**：在 `onMounted` 中初始化第三方库，在 `onUnmounted` 中销毁，防止内存泄漏。

### keep-alive 生命周期

当组件被 `<keep-alive>` 缓存时，会触发额外的生命周期钩子：

```vue
<script setup lang="ts">
import { ref, onMounted, onActivated, onDeactivated } from 'vue'

const count = ref(0)

// 组件挂载（只执行一次）
onMounted(() => {
  console.log('组件挂载（只执行一次）')
})

// 组件激活（每次切换回来都执行）
onActivated(() => {
  console.log('组件激活（每次切换回来都执行）')
  // 可以重新获取数据
})

// 组件停用（每次切换走都执行）
onDeactivated(() => {
  console.log('组件停用（每次切换走都执行）')
  // 可以暂停任务
})
</script>

<template>
  <div>
    <p>计数：{{ count }}</p>
    <button @click="count++">+1</button>
  </div>
</template>
```

```vue
<!-- 父组件使用 keep-alive -->
<template>
  <keep-alive>
    <component :is="currentComponent" />
  </keep-alive>
</template>
```

> **原理**：`<keep-alive>` 会缓存组件实例，切换时不会销毁组件，而是触发 `onActivated` 和 `onDeactivated`。

---

## 5 核心知识点总结

| 钩子函数          | 调用时机        | 常见用途                           |
| ----------------- | --------------- | ---------------------------------- |
| `onBeforeMount`   | 挂载前          | 初始化数据、设置初始状态           |
| `onMounted`       | 挂载后          | DOM 操作、发起网络请求、启动定时器 |
| `onBeforeUpdate`  | 更新前          | 获取更新前的 DOM 状态              |
| `onUpdated`       | 更新后          | 操作更新后的 DOM                   |
| `onBeforeUnmount` | 卸载前          | 清理定时器、取消订阅               |
| `onUnmounted`     | 卸载后          | 最终清理工作                       |
| `onActivated`     | keep-alive 激活 | 恢复状态、重新获取数据             |
| `onDeactivated`   | keep-alive 停用 | 暂停任务、保存状态                 |

---

## 6 新手常见误区

### 误区 1："setup 里可以直接访问 DOM"

**不能！**

`setup` 执行时 DOM 还没渲染，不能访问 DOM。需要访问 DOM 的操作放在 `onMounted` 中：

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const inputRef = ref<HTMLInputElement | null>(null)

// ❌ 错误：setup 里 DOM 还没渲染
// inputRef.value?.focus()

// ✅ 正确：在 onMounted 中访问 DOM
onMounted(() => {
  inputRef.value?.focus()
})
</script>
```

### 误区 2："onMounted 里可以修改 props"

**不能！**

Props 是只读的，无论在哪个生命周期都不能修改。需要修改用 `emit` 通知父组件：

```vue
<script setup lang="ts">
import { onMounted } from 'vue'

const props = defineProps<{ count: number }>()

// ❌ 错误：不能修改 props
onMounted(() => {
  props.count++
})
</script>
```

### 误区 3："onUpdated 会在每次数据变化时触发"

**不一定！**

`onUpdated` 只在 DOM 实际更新后触发。如果数据变化但没有影响视图，不会触发：

```vue
<script setup lang="ts">
import { ref, onUpdated } from 'vue'

const count = ref(0)
const unused = ref(0)

onUpdated(() => {
  console.log('组件已更新')
})

const increment = () => {
  count.value++ // 触发更新
}

const incrementUnused = () => {
  unused.value++ // 不触发更新（unused 没在模板中使用）
}
</script>
```

### 误区 4："不需要在 onUnmounted 中清理"

**需要！**

如果不清理定时器、事件监听等，会导致内存泄漏：

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

let timer: number | null = null

onMounted(() => {
  timer = window.setInterval(() => {
    console.log('定时器运行')
  }, 1000)
})

// ✅ 必须清理
onUnmounted(() => {
  if (timer !== null) {
    clearInterval(timer)
  }
})
</script>
```

### 误区 5："onBeforeUpdate 和 onUpdated 可以访问相同的 DOM"

**不一样！**

- `onBeforeUpdate`：DOM 还没更新，可以获取更新前的状态
- `onUpdated`：DOM 已更新，可以获取更新后的状态

```vue
<script setup lang="ts">
import { ref, onBeforeUpdate, onUpdated } from 'vue'

const count = ref(0)
let oldDOMState: string

onBeforeUpdate(() => {
  // 获取更新前的 DOM 状态
  oldDOMState = document.querySelector('p')?.textContent || ''
})

onUpdated(() => {
  // 获取更新后的 DOM 状态
  const newDOMState = document.querySelector('p')?.textContent || ''
  console.log('DOM 从', oldDOMState, '变为', newDOMState)
})
</script>
```

---

## 7 动手练习

### 练习 1：实时时钟

实现一个实时时钟组件，显示当前时间并每秒更新。

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const currentTime = ref(new Date().toLocaleTimeString())
let timer: number | null = null

onMounted(() => {
  timer = window.setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString()
  }, 1000)
})

onUnmounted(() => {
  if (timer !== null) {
    clearInterval(timer)
  }
})
</script>

<template>
  <p>当前时间：{{ currentTime }}</p>
</template>
```

</details>

### 练习 2：窗口尺寸监听

实现一个组件，实时显示窗口宽度和高度。

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

const handleResize = () => {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <p>窗口尺寸：{{ windowWidth }} x {{ windowHeight }}</p>
</template>
```

</details>

### 练习 3（挑战）：自动聚焦输入框

实现一个组件，页面加载后自动聚焦到输入框，并在输入框失去焦点时打印输入内容。

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const inputRef = ref<HTMLInputElement | null>(null)
const inputValue = ref('')

onMounted(() => {
  // 自动聚焦
  inputRef.value?.focus()
})

const handleBlur = () => {
  console.log('输入内容：', inputValue.value)
}
</script>

<template>
  <div>
    <input
      ref="inputRef"
      v-model="inputValue"
      @blur="handleBlur"
      placeholder="自动聚焦，失焦时打印"
    />
  </div>
</template>
```

</details>

---

## 下一章预告

下一章我们会学习 Vue 的**侦听器**——也就是 `watch` 和 `watchEffect`。你会学到怎么监听数据变化并执行副作用操作，以及 `watch` 和 `watchEffect` 的区别。
