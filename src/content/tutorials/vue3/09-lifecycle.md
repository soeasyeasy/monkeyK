---
title: "第九章：生命周期"
description: "掌握 Vue 3 组合式 API 中的生命周期钩子"
---

# 第九章：生命周期

## 运行结果

| 钩子函数 | 调用时机 | 常见用途 |
| --- | --- | --- |
| `onBeforeMount` | 挂载前 | 初始化数据、设置初始状态 |
| `onMounted` | 挂载后 | DOM 操作、发起网络请求、启动定时器 |
| `onBeforeUpdate` | 更新前 | 获取更新前的 DOM 状态 |
| `onUpdated` | 更新后 | 操作更新后的 DOM |
| `onBeforeUnmount` | 卸载前 | 清理定时器、取消订阅 |
| `onUnmounted` | 卸载后 | 最终清理工作 |
| `onActivated` | keep-alive 激活 | 恢复状态、重新获取数据 |
| `onDeactivated` | keep-alive 停用 | 暂停任务、保存状态 |

## 代码示例

### 1. 基础生命周期钩子

```vue
<script setup lang="ts">
import {
  ref,
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted
} from 'vue'

const count = ref(0)
const message = ref('初始化')

onBeforeMount(() => {
  console.log('组件即将挂载')
  // 此时 DOM 还未生成
})

onMounted(() => {
  console.log('组件已挂载')
  // 可以访问 DOM
  message.value = '已挂载'

  // 常见用途：发起网络请求
  fetchData()
})

onBeforeUpdate(() => {
  console.log('组件即将更新')
  // 可以获取更新前的 DOM 状态
})

onUpdated(() => {
  console.log('组件已更新')
  // DOM 已更新
})

onBeforeUnmount(() => {
  console.log('组件即将卸载')
  // 清理工作
})

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

### 2. 定时器管理

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const seconds = ref(0)
let timer: number | null = null

onMounted(() => {
  console.log('启动计时器')
  timer = window.setInterval(() => {
    seconds.value++
  }, 1000)
})

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

### 3. 事件监听管理

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const windowWidth = ref(window.innerWidth)

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <p>窗口宽度：{{ windowWidth }}px</p>
</template>
```

### 4. DOM 操作

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  // 访问 DOM 元素
  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d')
    if (ctx) {
      ctx.fillStyle = 'red'
      ctx.fillRect(10, 10, 100, 100)
    }
  }

  // 自动聚焦
  inputRef.value?.focus()
})
</script>

<template>
  <canvas ref="canvasRef" width="200" height="200"></canvas>
  <input ref="inputRef" type="text" placeholder="自动聚焦" />
</template>
```

### 5. 第三方库集成

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Chart from 'chart.js'

const chartRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const data = ref([10, 20, 30, 40, 50])

onMounted(() => {
  if (chartRef.value) {
    chartInstance = new Chart(chartRef.value, {
      type: 'bar',
      data: {
        labels: ['A', 'B', 'C', 'D', 'E'],
        datasets: [{
          label: '数据',
          data: data.value
        }]
      }
    })
  }
})

onUnmounted(() => {
  chartInstance?.destroy()
  chartInstance = null
})
</script>

<template>
  <canvas ref="chartRef"></canvas>
</template>
```

### 6. keep-alive 生命周期

```vue
<script setup lang="ts">
import { ref, onMounted, onActivated, onDeactivated } from 'vue'

const count = ref(0)

onMounted(() => {
  console.log('组件挂载（只执行一次）')
})

onActivated(() => {
  console.log('组件激活（每次切换回来都执行）')
  // 可以重新获取数据
})

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

### 7. 异步 setup 与生命周期

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const data = ref<string[]>([])

// 异步 setup（需要 Suspense）
const loadData = async () => {
  const response = await fetch('/api/data')
  data.value = await response.json()
}

onMounted(async () => {
  await loadData()
  console.log('数据加载完成')
})
</script>

<template>
  <ul>
    <li v-for="item in data" :key="item">{{ item }}</li>
  </ul>
</template>
```

### 8. 生命周期执行顺序

```vue
<script setup lang="ts">
import { onMounted, onUpdated, onUnmounted } from 'vue'

console.log('1. setup 执行（同步）')

onMounted(() => {
  console.log('3. onMounted（组件挂载后）')
})

onUpdated(() => {
  console.log('4. onUpdated（组件更新后）')
})

onUnmounted(() => {
  console.log('5. onUnmounted（组件卸载后）')
})
</script>

<template>
  <div>生命周期顺序</div>
</template>
```

执行顺序：
1. `setup()` 函数执行
2. 模板编译，DOM 挂载
3. `onMounted` 钩子执行
4. 数据变化触发更新 → `onUpdated`
5. 组件卸载 → `onUnmounted`

## 核心知识点

1. **组合式 API 钩子**：`onMounted`、`onUpdated`、`onUnmounted` 等
2. **清理副作用**：在 `onUnmounted` 中清理定时器、事件监听、订阅
3. **DOM 访问**：在 `onMounted` 中访问 DOM 元素
4. **异步操作**：在 `onMounted` 中发起网络请求
5. **keep-alive 钩子**：`onActivated` 和 `onDeactivated` 用于缓存组件
6. **执行顺序**：setup → onBeforeMount → onMounted → onUpdated → onUnmounted
