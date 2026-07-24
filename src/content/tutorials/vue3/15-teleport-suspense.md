---
title: '第十五章：Teleport 与 Suspense'
description: '学习 Vue 3 的传送门和异步组件处理'
---

# 第十五章：Teleport 与 Suspense

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 模态框被父元素的 `overflow: hidden` 截断了，怎么办？
- 异步组件加载时要显示 loading，难道每个地方都要手写 `v-if` 判断？
- `Teleport` 到底是怎么把 DOM "传送"走的？会不会脱离 Vue 的控制？
- `Suspense` 是实验性功能，现在能用在项目里吗？

这一章就是为了解答这些问题。我们会先搞清楚 **Teleport 和 Suspense 的核心原理**，再动手写出完整可运行的代码。学完之后，你就能优雅地处理模态框层级问题和异步组件加载状态。

---

## 15.1 为什么需要这个技术？

### Teleport 的痛点

想象一下这个场景：你在一个深层嵌套的组件里写了一个模态框，代码写得很开心，一运行——模态框被父容器的 `overflow: hidden` 吃掉了！

```
❌ 问题代码：
<div class="deep-container">  <!-- 这个容器设了 overflow: hidden -->
  <div class="modal">我是模态框</div>  <!-- 被截断了！ -->
</div>
```

打个比方：这就像你在一个房间里放了个大气球，但房间天花板太低，气球被压扁了。你需要把气球"传送"到外面的操场上去。

> **Teleport 就是那个传送门**——组件逻辑还在原地，但 DOM 渲染到任意位置（比如 `<body>` 下面）。

### Suspense 的痛点

再想想异步加载的场景：你有一个组件需要从接口拿数据，在数据回来之前，你想显示一个 loading 动画。没有 Suspense 的时候，你得在每个组件里手写一堆状态管理：

```
❌ 没有 Suspense 时：
const loading = ref(false)    // 手动管理加载状态
const error = ref(null)       // 手动管理错误状态
const data = ref(null)        // 手动管理数据

onMounted(async () => {
  loading.value = true
  try {
    data.value = await fetchData()
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
})
```

每个异步组件都要重复这一套逻辑，烦不烦？

> **Suspense 就像一个智能 waiter**——你只管点菜（写异步逻辑），它帮你搞定"等待中"和"出菜"的切换。

---

## 15.2 核心原理

### Teleport 原理

打个比方：

> Teleport 就像快递柜。你在 A 小区寄了个包裹（组件逻辑），但包裹实际送到了 B 小区的快递柜（目标 DOM 位置）。Vue 的虚拟 DOM 仍然管理着这个节点，只是它的物理位置变了。

核心要点：

- **逻辑不变**：组件的事件、响应式数据、生命周期全部正常工作
- **DOM 搬家**：渲染时把内部 DOM 移到 `to` 指定的位置
- **销毁时清理**：组件销毁时，Teleport 会把 DOM 也一起移除

### Suspense 原理

打个比方：

> Suspense 就像餐厅的叫号系统。你在后厨做菜（异步操作），前台显示"请等待"（fallback），菜做好了自动端上来（default 插槽）。

核心要点：

- 内部组件如果有 **异步 setup** 或 **异步组件**，Suspense 会自动等待
- 等待期间显示 `#fallback` 插槽内容
- 所有异步完成后，切换到 `#default` 插槽内容
- 提供 `@resolve`、`@pending`、`@fallback` 事件来监听状态变化

### 对比表格

| 特性       | Teleport             | Suspense                          |
| ---------- | -------------------- | --------------------------------- |
| 用途       | 传送 DOM 到任意位置  | 处理异步组件的加载状态            |
| 解决的问题 | CSS 层级/溢出截断    | 重复的 loading 状态管理           |
| 核心属性   | `to`（目标选择器）   | `#default` + `#fallback` 插槽     |
| 事件       | 无                   | `@resolve` `@pending` `@fallback` |
| 典型场景   | 模态框、通知、弹出层 | 异步数据加载、路由懒加载          |
| 稳定性     | 稳定                 | Vue 3.3 中仍为实验性功能          |

---

## 15.3 Teleport 基础用法

### 示例 1：模态框组件

这是 Teleport 最经典的使用场景——模态框。

```vue
<!-- Modal.vue -->
<script setup lang="ts">
// 引入 Vue 的 ref 响应式函数（本例中未直接使用，但保留导入习惯）
import { ref } from 'vue'

// 定义组件接收的 props：modelValue 控制显示/隐藏，title 是模态框标题
const props = defineProps<{
  modelValue: boolean // v-model 绑定的值
  title: string // 模态框标题
}>()

// 定义组件会触发的事件：update:modelValue 用于支持 v-model
const emit = defineEmits<{
  'update:modelValue': [value: boolean] // 传递布尔值给父组件
}>()

// 关闭模态框的方法：通知父组件将 modelValue 设为 false
const close = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <!-- Teleport 将内部 DOM 传送到 body 标签下，避免被父容器 overflow 截断 -->
  <Teleport to="body">
    <!-- v-if 控制模态框是否渲染，点击遮罩层触发关闭 -->
    <div v-if="modelValue" class="modal-overlay" @click="close">
      <!-- 模态框内容区域，@click.stop 阻止点击事件冒泡到遮罩层 -->
      <div class="modal-content" @click.stop>
        <!-- 显示传入的标题 -->
        <h2>{{ title }}</h2>
        <!-- 默认插槽，父组件可以在这里放任意内容 -->
        <slot />
        <!-- 关闭按钮 -->
        <button @click="close">关闭</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* 遮罩层：固定定位覆盖整个屏幕，半透明黑色背景 */
.modal-overlay {
  position: fixed; /* 固定定位，相对于视口 */
  top: 0; /* 顶部对齐 */
  left: 0; /* 左侧对齐 */
  width: 100%; /* 宽度 100% */
  height: 100%; /* 高度 100% */
  background: rgba(0, 0, 0, 0.5); /* 半透明黑色背景 */
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  z-index: 9999; /* 确保在最上层 */
}

/* 模态框内容区域 */
.modal-content {
  background: white; /* 白色背景 */
  padding: 20px; /* 内边距 20px */
  border-radius: 8px; /* 圆角 8px */
  min-width: 400px; /* 最小宽度 400px */
}
</style>
```

```vue
<!-- 使用模态框的父组件 -->
<script setup lang="ts">
// 引入 ref 用于创建响应式数据
import { ref } from 'vue'
// 引入上面定义的 Modal 组件
import Modal from './Modal.vue'

// 控制模态框显示/隐藏的响应式变量
const showModal = ref(false)
</script>

<template>
  <div>
    <!-- 页面正常内容 -->
    <h1>页面内容</h1>
    <!-- 点击按钮打开模态框，将 showModal 设为 true -->
    <button @click="showModal = true">打开模态框</button>

    <!-- 使用 v-model 双向绑定 showModal，传入标题，插槽里放模态框内容 -->
    <Modal v-model="showModal" title="提示">
      <p>这是模态框内容</p>
    </Modal>
  </div>
</template>
```

### 示例 2：动态目标传送

Teleport 的 `to` 属性支持动态绑定，你可以随时改变传送目标。

```vue
<script setup lang="ts">
// 引入 ref 创建响应式数据
import { ref } from 'vue'

// 传送目标，默认是 #modal-container，可以通过下拉框切换
const targetSelector = ref('#modal-container')
// 控制内容是否显示
const showModal = ref(false)
</script>

<template>
  <div>
    <!-- 下拉选择框，v-model 绑定目标选择器 -->
    <select v-model="targetSelector">
      <!-- 选项 1：传送到 id 为 modal-container 的元素 -->
      <option value="#modal-container">容器 1</option>
      <!-- 选项 2：传送到 id 为 another-container 的元素 -->
      <option value="#another-container">容器 2</option>
      <!-- 选项 3：直接传送到 body -->
      <option value="body">Body</option>
    </select>

    <!-- 点击按钮显示内容 -->
    <button @click="showModal = true">显示</button>

    <!-- Teleport 的 to 属性动态绑定到 targetSelector，内容会传送到选中的目标 -->
    <Teleport :to="targetSelector">
      <!-- v-if 控制是否渲染 -->
      <div v-if="showModal" class="modal">
        <!-- 显示当前传送目标 -->
        <p>传送到 {{ targetSelector }}</p>
        <!-- 关闭按钮 -->
        <button @click="showModal = false">关闭</button>
      </div>
    </Teleport>
  </div>
</template>
```

### 示例 3：多个 Teleport 传送到同一目标

多个 Teleport 可以传送到同一个目标，内容会按顺序追加。

```vue
<template>
  <div>
    <!-- 第一个 Teleport：传送通知 1 到 #notifications 容器 -->
    <Teleport to="#notifications">
      <div class="notification">通知 1</div>
    </Teleport>

    <!-- 第二个 Teleport：传送通知 2 到同一个 #notifications 容器 -->
    <Teleport to="#notifications">
      <div class="notification">通知 2</div>
    </Teleport>

    <!-- 两个通知会按顺序追加到 #notifications 容器中 -->
  </div>
</template>
```

---

## 15.4 Suspense 基础用法

### 示例 4：异步 setup 组件

Suspense 最常见的用法就是配合 **异步 setup**——组件的 `<script setup>` 里可以直接用 `await`。

```vue
<!-- AsyncComponent.vue -->
<script setup lang="ts">
// 引入 ref 创建响应式数据
import { ref } from 'vue'

// 存储从接口获取的数据，初始为空数组
const data = ref<string[]>([])

// 定义异步数据获取函数
const fetchData = async () => {
  // 模拟网络请求延迟 2 秒
  await new Promise((resolve) => setTimeout(resolve, 2000))
  // 2 秒后给 data 赋值模拟数据
  data.value = ['数据 1', '数据 2', '数据 3']
}

// ✅ 异步 setup：直接 await，Suspense 会自动等待这个组件准备好
await fetchData()
</script>

<template>
  <!-- 数据加载完成后渲染列表 -->
  <ul>
    <!-- v-for 遍历数据，:key 提供唯一标识 -->
    <li v-for="item in data" :key="item">{{ item }}</li>
  </ul>
</template>
```

```vue
<!-- 父组件：使用 Suspense 包裹异步组件 -->
<script setup lang="ts">
// 引入 ref 创建响应式数据
import { ref } from 'vue'
// 引入上面的异步组件
import AsyncComponent from './AsyncComponent.vue'

// 控制是否显示异步组件
const showComponent = ref(false)
</script>

<template>
  <div>
    <!-- 点击按钮后才显示异步组件 -->
    <button @click="showComponent = true">加载异步组件</button>

    <!-- Suspense 包裹异步组件，自动处理加载状态 -->
    <Suspense v-if="showComponent">
      <!-- #default 插槽：放异步组件，Suspense 会等它准备好 -->
      <template #default>
        <AsyncComponent />
      </template>

      <!-- #fallback 插槽：等待期间显示的内容 -->
      <template #fallback>
        <div>加载中...</div>
      </template>
    </Suspense>
  </div>
</template>
```

### 示例 5：配合 defineAsyncComponent

`defineAsyncComponent` 用于定义懒加载的组件（按需加载），配合 Suspense 可以显示加载状态。

```vue
<script setup lang="ts">
// 引入 defineAsyncComponent 和 ref
import { defineAsyncComponent, ref } from 'vue'

// 定义异步组件：只有用到时才会加载对应的 JS 文件（代码分割）
const HeavyComponent = defineAsyncComponent(
  () =>
    // 动态 import，Webpack/Vite 会自动做代码分割
    import('./HeavyComponent.vue'),
)

// 控制是否显示重型组件
const showHeavy = ref(false)
</script>

<template>
  <div>
    <!-- 点击按钮后加载重型组件 -->
    <button @click="showHeavy = true">加载重型组件</button>

    <!-- Suspense 等待异步组件加载完成 -->
    <Suspense v-if="showHeavy">
      <!-- 组件加载完成后渲染 -->
      <template #default>
        <HeavyComponent />
      </template>

      <!-- 组件加载期间显示 loading 动画 -->
      <template #fallback>
        <div class="loading">
          <!-- 旋转加载动画 -->
          <div class="spinner"></div>
          <!-- 加载提示文字 -->
          <p>组件加载中...</p>
        </div>
      </template>
    </Suspense>
  </div>
</template>
```

### 示例 6：Suspense 事件监听

Suspense 提供了三个事件，让你可以监听异步加载的生命周期。

```vue
<script setup lang="ts">
// 引入 ref 创建响应式数据
import { ref } from 'vue'

// 跟踪加载状态
const isLoading = ref(false)
// 存储错误信息
const error = ref<Error | null>(null)

// @resolve 事件的回调：异步操作全部完成时触发
const handleResolve = () => {
  console.log('异步操作完成')  // 在控制台输出完成信息
  isLoading.value = false       // 更新加载状态为 false
}

// @pending 事件的回调：开始进入加载状态时触发
const handlePending = () => {
  console.log('开始加载')     // 在控制台输出开始加载
  isLoading.value = true        // 更新加载状态为 true
}

// @fallback 事件的回调：加载出错时触发
const handleError = (err: Error) => {
  console.error('加载失败：', err)  // 在控制台输出错误信息
  error.value = err                  // 保存错误对象
  isLoading.value = false            // 更新加载状态为 false
}
</script>

<template>
  <!-- Suspense 绑定三个事件监听器 -->
  <Suspense
    @resolve="handleResolve"   <!-- 异步完成时触发 -->
    @pending="handlePending"   <!-- 开始加载时触发 -->
    @fallback="handleError"    <!-- 出错时触发 -->
  >
    <!-- 异步内容 -->
    <template #default>
      <AsyncComponent />
    </template>

    <!-- 加载/错误状态 -->
    <template #fallback>
      <!-- 如果有错误，显示错误信息和重试按钮 -->
      <div v-if="error">
        <p>加载失败：{{ error.message }}</p>
        <button @click="error = null">重试</button>
      </div>
      <!-- 没有错误时显示加载中 -->
      <div v-else>
        加载中...
      </div>
    </template>
  </Suspense>
</template>
```

---

## 15.5 进阶用法

### 示例 7：嵌套 Suspense

你可以嵌套使用 Suspense，实现细粒度的加载控制——每个区域有独立的 loading 状态。

```vue
<script setup lang="ts">
// 引入 defineAsyncComponent 定义异步组件
import { defineAsyncComponent } from 'vue'

// 异步加载用户资料组件
const UserProfile = defineAsyncComponent(() => import('./UserProfile.vue'))

// 异步加载用户文章列表组件
const UserPosts = defineAsyncComponent(() => import('./UserPosts.vue'))
</script>

<template>
  <!-- 外层 Suspense：等待所有内层异步操作完成，显示"页面加载中" -->
  <Suspense>
    <template #default>
      <div class="user-page">
        <!-- 内层 Suspense 1：独立管理 UserProfile 的加载状态 -->
        <Suspense>
          <template #default>
            <UserProfile />
          </template>
          <template #fallback>
            <div>加载用户信息...</div>
          </template>
        </Suspense>

        <!-- 内层 Suspense 2：独立管理 UserPosts 的加载状态 -->
        <Suspense>
          <template #default>
            <UserPosts />
          </template>
          <template #fallback>
            <div>加载文章列表...</div>
          </template>
        </Suspense>
      </div>
    </template>

    <!-- 外层 fallback：所有内层都完成前显示的总 loading -->
    <template #fallback>
      <div>页面加载中...</div>
    </template>
  </Suspense>
</template>
```

### 示例 8：实战——通用数据获取组件

用异步 setup + Suspense 封装一个通用的数据获取组件，可以复用在任何需要拉取数据的地方。

```vue
<!-- DataFetcher.vue：通用数据获取组件 -->
<script setup lang="ts">
// 引入 ref 创建响应式数据
import { ref } from 'vue'

// 接收 props：url 是要请求的接口地址
const props = defineProps<{
  url: string
}>()

// 存储接口返回的数据
const data = ref<any>(null)
// 存储请求过程中的错误
const error = ref<Error | null>(null)

// 定义异步数据获取函数
const fetchData = async () => {
  try {
    // 发起 fetch 请求
    const response = await fetch(props.url)
    // 检查 HTTP 状态码是否正常（200-299）
    if (!response.ok) {
      // 如果不是 2xx，抛出一个带状态码的错误
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    // 将响应体解析为 JSON 并赋值给 data
    data.value = await response.json()
  } catch (e) {
    // 捕获请求或解析过程中的错误
    error.value = e as Error
  }
}

// ✅ 异步 setup：Suspense 会等待这个 await 完成
await fetchData()
</script>

<template>
  <!-- 如果有错误，显示错误信息 -->
  <div v-if="error">
    <p style="color: red">错误：{{ error.message }}</p>
    <!-- 提供 error 插槽，让父组件自定义错误展示 -->
    <slot name="error" :error="error" />
  </div>
  <!-- 没有错误时，通过默认插槽把数据传给父组件 -->
  <div v-else>
    <slot :data="data" />
  </div>
</template>
```

```vue
<!-- 使用 DataFetcher 组件 -->
<script setup lang="ts">
// 引入封装好的数据获取组件
import DataFetcher from './DataFetcher.vue'
</script>

<template>
  <!-- Suspense 包裹，处理 DataFetcher 的异步 setup -->
  <Suspense>
    <template #default>
      <!-- 请求 /api/users 接口 -->
      <DataFetcher url="/api/users">
        <!-- 默认插槽：接收 data，渲染用户列表 -->
        <template #default="{ data }">
          <ul>
            <!-- 遍历用户数据 -->
            <li v-for="user in data" :key="user.id">
              {{ user.name }}
            </li>
          </ul>
        </template>

        <!-- 错误插槽：自定义错误展示 -->
        <template #error="{ error }">
          <p>获取用户失败：{{ error.message }}</p>
        </template>
      </DataFetcher>
    </template>

    <!-- 等待数据加载时显示 -->
    <template #fallback>
      <div>正在获取用户数据...</div>
    </template>
  </Suspense>
</template>
```

### 示例 9：Teleport + Suspense 组合

把 Teleport 和 Suspense 组合使用——模态框传送到 body，内部内容异步加载。

```vue
<script setup lang="ts">
// 引入 ref 和 defineAsyncComponent
import { ref, defineAsyncComponent } from 'vue'

// 控制模态框显示/隐藏
const showModal = ref(false)

// 定义异步加载的模态框内容组件
const AsyncModalContent = defineAsyncComponent(() => import('./ModalContent.vue'))
</script>

<template>
  <div>
    <!-- 打开模态框的按钮 -->
    <button @click="showModal = true">打开模态框</button>

    <!-- Teleport 将模态框传送到 body 下，避免层级问题 -->
    <Teleport to="body">
      <!-- v-if 控制模态框是否渲染 -->
      <div v-if="showModal" class="modal-overlay" @click="showModal = false">
        <!-- 模态框内容区域，@click.stop 阻止点击冒泡到遮罩层 -->
        <div class="modal-content" @click.stop>
          <!-- Suspense 处理异步组件的加载状态 -->
          <Suspense>
            <!-- 异步组件加载完成后渲染 -->
            <template #default>
              <AsyncModalContent />
            </template>

            <!-- 异步组件加载期间显示 loading -->
            <template #fallback>
              <div class="loading">
                <div class="spinner"></div>
                <p>内容加载中...</p>
              </div>
            </template>
          </Suspense>

          <!-- 关闭按钮 -->
          <button @click="showModal = false">关闭</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
```

### 示例 10：路由与 Suspense

在 Vue Router 中配合 Suspense 使用，实现页面切换时的加载状态。

```vue
<!-- App.vue -->
<script setup lang="ts">
// 引入 ref 和 useRouter
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// 获取路由实例
const router = useRouter()
// 跟踪页面加载状态
const isLoading = ref(false)

// 路由跳转前：设置 loading 状态为 true
router.beforeEach((to, from, next) => {
  isLoading.value = true // 显示加载中
  next() // 继续路由跳转
})

// 路由跳转后：设置 loading 状态为 false
router.afterEach(() => {
  isLoading.value = false // 隐藏加载中
})
</script>

<template>
  <div>
    <!-- 导航栏 -->
    <nav>
      <!-- 路由链接：跳转到首页 -->
      <router-link to="/">首页</router-link>
      <!-- 路由链接：跳转到关于页 -->
      <router-link to="/about">关于</router-link>
    </nav>

    <!-- 路由跳转时的顶部加载条 -->
    <div v-if="isLoading" class="loading-bar">加载中...</div>

    <!-- router-view 使用插槽模式，配合 Suspense 处理页面级异步 -->
    <router-view v-slot="{ Component }">
      <Suspense>
        <!-- 页面组件渲染 -->
        <template #default>
          <component :is="Component" />
        </template>

        <!-- 页面切换时的加载状态 -->
        <template #fallback>
          <div class="page-loading">页面加载中...</div>
        </template>
      </Suspense>
    </router-view>
  </div>
</template>
```

---

## 15.6 核心知识点总结

| 知识点                     | 说明                                                        |
| -------------------------- | ----------------------------------------------------------- |
| `<Teleport to="selector">` | 将组件 DOM 传送到指定位置，支持 CSS 选择器、DOM 元素        |
| Teleport 动态 `to`         | `:to` 支持动态绑定，可以运行时切换传送目标                  |
| 多个 Teleport 同目标       | 多个 Teleport 传送到同一目标时，内容按顺序追加              |
| `<Suspense>`               | 处理异步组件和异步 setup 的加载状态                         |
| `#default` 插槽            | 放异步内容，Suspense 等它准备好后才渲染                     |
| `#fallback` 插槽           | 等待期间显示的 loading 内容                                 |
| Suspense 事件              | `@resolve`（完成）、`@pending`（开始）、`@fallback`（出错） |
| 嵌套 Suspense              | 可以嵌套使用，实现细粒度的加载控制                          |
| `defineAsyncComponent`     | 定义异步组件，实现代码分割和懒加载                          |
| `async setup`              | 组件 setup 函数可以是异步的，直接用 await                   |
| ⚠️ Suspense 状态           | Vue 3.3 中仍为实验性功能，生产环境谨慎使用                  |

---

## 15.7 新手常见误区

### 误区 1："Teleport 会把组件从 Vue 树中移除"

**错！** Teleport 只是把 DOM 节点移到其他位置渲染，组件的事件、响应式数据、生命周期全部正常工作。Vue 的虚拟 DOM 仍然管理着这个组件。

打个比方：就像你把电视从客厅搬到卧室，遥控器（Vue 的控制）照样能用，只是电视的物理位置变了。

### 误区 2："Teleport 的 to 属性只能写 body"

不是的。`to` 支持任何 CSS 选择器：

```
✅ 正确写法：
<Teleport to="body">              <!-- 传送到 body -->
<Teleport to="#app">              <!-- 传送到 id 为 app 的元素 -->
<Teleport to=".modal-container">  <!-- 传送到 class 为 modal-container 的元素 -->
<Teleport :to="dynamicTarget">    <!-- 动态绑定 -->

❌ 错误写法：
<Teleport to="div">               <!-- 不推荐：匹配多个元素时行为不确定 -->
<Teleport>                        <!-- 缺少 to 属性，会报错 -->
```

### 误区 3："Suspense 里可以直接放普通同步组件"

可以放，但没意义。Suspense 是为异步内容设计的，如果里面全是同步组件，`#fallback` 永远不会显示，Suspense 就白用了。

```
❌ 没意义的用法：
<Suspense>
  <template #default>
    <SyncComponent />  <!-- 同步组件，瞬间渲染完 -->
  </template>
  <template #fallback>
    <div>加载中...</div>  <!-- 永远不会显示！ -->
  </template>
</Suspense>
```

### 误区 4："Suspense 是稳定功能，可以放心用在生产环境"

**注意！** 截至 Vue 3.3，Suspense 仍然是**实验性功能**。虽然很多项目已经在用，但 API 未来可能会有变化。如果你要在生产环境使用，建议关注 Vue 官方的更新日志。

### 误区 5："异步 setup 里不需要错误处理"

**错！** 异步 setup 里的错误如果不处理，会导致组件渲染失败。虽然 Suspense 有 `@fallback` 事件，但最佳实践是在组件内部也做好错误处理：

```
✅ 正确写法：
const data = ref(null)
const error = ref(null)

try {
  data.value = await fetchData()
} catch (e) {
  error.value = e as Error
}

await fetchData()  // 或者在顶层 await，让 Suspense 的 fallback 处理
```

---

## 15.8 动手练习

### 练习 1（基础）：实现一个通知组件

用 Teleport 实现一个通知组件，通知内容传送到 `body` 下的 `#notification-area` 容器中。支持传入通知文本和显示时长（毫秒），到时自动消失。

<details>
<summary>点击查看答案</summary>

```vue
<!-- Notification.vue -->
<script setup lang="ts">
// 引入 ref 和 onMounted
import { ref, onMounted } from 'vue'

// 定义 props：message 是通知文本，duration 是显示时长（默认 3000ms）
const props = withDefaults(
  defineProps<{
    message: string // 通知文本内容
    duration?: number // 显示时长，单位毫秒
  }>(),
  {
    duration: 3000, // 默认 3 秒后消失
  },
)

// 控制通知是否可见
const visible = ref(true)

// 组件挂载后，定时器到时自动隐藏
onMounted(() => {
  // 设置定时器，duration 毫秒后将 visible 设为 false
  setTimeout(() => {
    visible.value = false
  }, props.duration)
})
</script>

<template>
  <!-- Teleport 将通知传送到 #notification-area 容器 -->
  <Teleport to="#notification-area">
    <!-- v-if 控制通知是否渲染 -->
    <div v-if="visible" class="notification">
      <!-- 显示通知文本 -->
      <p>{{ message }}</p>
    </div>
  </Teleport>
</template>

<style scoped>
/* 通知样式 */
.notification {
  background: #4caf50; /* 绿色背景 */
  color: white; /* 白色文字 */
  padding: 12px 20px; /* 内边距 */
  border-radius: 4px; /* 圆角 */
  margin: 8px 0; /* 外边距 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); /* 阴影 */
}
</style>
```

```vue
<!-- 使用 -->
<script setup lang="ts">
// 引入 ref
import { ref } from 'vue'
// 引入通知组件
import Notification from './Notification.vue'

// 控制是否显示通知
const showNotification = ref(false)
</script>

<template>
  <div>
    <!-- 页面上的通知容器（Teleport 的目标） -->
    <div id="notification-area"></div>

    <!-- 触发按钮 -->
    <button @click="showNotification = true">显示通知</button>

    <!-- 显示通知组件，3 秒后自动消失 -->
    <Notification v-if="showNotification" message="操作成功！" :duration="3000" />
  </div>
</template>
```

</details>

### 练习 2（进阶）：带错误重试的异步数据组件

用 Suspense + 异步 setup 实现一个数据获取组件，要求：

- 从 `/api/users` 获取用户列表
- 加载中显示 loading 动画
- 加载失败显示错误信息和"重试"按钮
- 点击重试可以重新请求

<details>
<summary>点击查看答案</summary>

```vue
<!-- UserList.vue -->
<script setup lang="ts">
// 引入 ref
import { ref } from 'vue'

// 存储用户数据
const users = ref<Array<{ id: number; name: string }>>([])
// 存储错误信息
const error = ref<Error | null>(null)

// 定义获取数据的函数
const fetchUsers = async () => {
  try {
    // 重置错误状态
    error.value = null
    // 模拟 API 请求，延迟 2 秒
    await new Promise((resolve) => setTimeout(resolve, 2000))
    // 模拟请求失败（50% 概率）
    if (Math.random() > 0.5) {
      throw new Error('网络请求失败')
    }
    // 模拟返回用户数据
    users.value = [
      { id: 1, name: '张三' },
      { id: 2, name: '李四' },
      { id: 3, name: '王五' },
    ]
  } catch (e) {
    // 捕获错误
    error.value = e as Error
  }
}

// ✅ 异步 setup：Suspense 会等待这个 await
await fetchUsers()
</script>

<template>
  <!-- 如果有错误，显示错误信息和重试按钮 -->
  <div v-if="error">
    <p style="color: red">加载失败：{{ error.message }}</p>
    <!-- 重试按钮：刷新页面重新触发异步 setup -->
    <button
      @click="
        () => {
          throw new Error('retry')
        }
      "
    >
      重试
    </button>
  </div>
  <!-- 数据加载成功，渲染用户列表 -->
  <ul v-else>
    <li v-for="user in users" :key="user.id">{{ user.name }}（ID: {{ user.id }}）</li>
  </ul>
</template>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
// 引入 ref
import { ref } from 'vue'
// 引入用户列表组件
import UserList from './UserList.vue'

// 用于强制重新挂载组件（实现重试效果）
const key = ref(0)
</script>

<template>
  <div>
    <!-- Suspense 包裹，处理异步加载状态 -->
    <Suspense :key="key">
      <!-- 异步内容 -->
      <template #default>
        <UserList />
      </template>

      <!-- 加载状态 -->
      <template #fallback>
        <div>
          <p>🔄 正在加载用户列表...</p>
        </div>
      </template>
    </Suspense>
  </div>
</template>
```

</details>

### 练习 3（挑战）：Teleport + Suspense 组合模态框

实现一个异步模态框：

- 用 Teleport 将模态框传送到 body
- 模态框内部用 Suspense 处理异步内容加载
- 支持打开/关闭动画
- 加载中显示 spinner，加载完成显示内容

<details>
<summary>点击查看答案</summary>

```vue
<!-- AsyncModal.vue -->
<script setup lang="ts">
// 引入 ref、defineAsyncComponent
import { ref, defineAsyncComponent } from 'vue'

// 定义 props
const props = defineProps<{
  modelValue: boolean // v-model 控制显示/隐藏
  title: string // 模态框标题
}>()

// 定义 emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// 异步加载模态框内容组件
const ModalBody = defineAsyncComponent(() => import('./ModalBody.vue'))

// 关闭模态框
const close = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <!-- Teleport 传送到 body，避免层级问题 -->
  <Teleport to="body">
    <!-- 过渡动画 -->
    <Transition name="modal">
      <!-- v-if 控制渲染 -->
      <div v-if="modelValue" class="modal-overlay" @click="close">
        <div class="modal-content" @click.stop>
          <!-- 标题栏 -->
          <div class="modal-header">
            <h2>{{ title }}</h2>
            <button class="close-btn" @click="close">×</button>
          </div>

          <!-- Suspense 处理异步内容 -->
          <Suspense>
            <!-- 异步组件加载完成后渲染 -->
            <template #default>
              <ModalBody />
            </template>

            <!-- 加载期间显示 spinner -->
            <template #fallback>
              <div class="loading-container">
                <div class="spinner"></div>
                <p>内容加载中...</p>
              </div>
            </template>
          </Suspense>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 遮罩层 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* 内容区域 */
.modal-content {
  background: white;
  padding: 20px;
  border-radius: 12px;
  min-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

/* 标题栏 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

/* 关闭按钮 */
.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

/* 加载容器 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
}

/* 旋转动画 */
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #eee;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* 旋转动画关键帧 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 进入动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

/* 进入/离开的起始和结束状态 */
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
```

```vue
<!-- ModalBody.vue：异步加载的内容组件 -->
<script setup lang="ts">
// 引入 ref
import { ref } from 'vue'

// 存储数据
const items = ref<string[]>([])

// 模拟异步数据加载，延迟 1.5 秒
await new Promise((resolve) => setTimeout(resolve, 1500))
items.value = ['项目 A', '项目 B', '项目 C', '项目 D']
</script>

<template>
  <div>
    <h3>异步加载的数据</h3>
    <ul>
      <li v-for="item in items" :key="item">{{ item }}</li>
    </ul>
  </div>
</template>
```

```vue
<!-- 使用 -->
<script setup lang="ts">
// 引入 ref
import { ref } from 'vue'
// 引入异步模态框组件
import AsyncModal from './AsyncModal.vue'

// 控制模态框显示
const showModal = ref(false)
</script>

<template>
  <div>
    <button @click="showModal = true">打开异步模态框</button>
    <AsyncModal v-model="showModal" title="异步数据展示" />
  </div>
</template>
```

</details>

---

## 下一章预告

下一章我们会学习 **Vue 3 的状态管理（Pinia）**——也就是 Vue 官方推荐的新一代状态管理库。你会学到如何用 Pinia 管理全局状态、如何实现状态的持久化、以及它和 Vuex 有什么区别。有了 Pinia，你就不用再手动在组件之间传来传去了，一个 store 搞定所有共享数据。
