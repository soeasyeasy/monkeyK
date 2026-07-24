---
title: '第十二章：自定义组合式函数'
description: '学习如何封装可复用的组合式函数（Composables），把逻辑从组件中抽离出来'
---

# 第十二章：自定义组合式函数

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是组合式函数（Composable）？它和组件有什么关系？
- 为什么要把代码抽离成独立的函数？直接在组件里写不行吗？
- 怎么封装一个自己的组合式函数？有什么命名规范吗？
- 多个组合式函数之间怎么组合使用？

这一章就是为了解答这些问题。我们会先搞清楚 **什么是组合式函数**，再动手封装 6 个常用的组合式函数，最后学会如何组合它们。

---

## 12.1 为什么需要组合式函数？

### 痛点分析

想象一下，你有一个电商网站，很多页面都需要用到"计数器"功能——购物车商品数量、收藏数量、浏览历史数量……

如果不用组合式函数，你得在每个组件里重复写这些代码：

```vue
<!-- 组件 A -->
<script setup>
import { ref } from 'vue'
const count = ref(0)
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

<!-- 组件 B：同样的代码又写一遍 -->
<script setup>
import { ref } from 'vue'
const count = ref(0)
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
```

❌ **问题很明显**：代码重复了！改一个地方，所有地方都要改。

### 生活化类比

打个比方：

> 组合式函数就像 **"工具箱里的工具"**。你不需要每次修东西都自己造一把螺丝刀，直接从工具箱里拿出来用就行了。
>
> 组合式函数就是你的 Vue 工具箱——把常用的逻辑封装好，随用随取。

### 解决方案

把计数器的逻辑抽离成一个独立的函数：

```typescript
// composables/useCounter.ts
// 一次封装，到处使用
export function useCounter(initialValue = 0) {
  // ... 封装好的逻辑
}
```

然后在任何组件里只需要一行代码就能用：

```typescript
const { count, increment, decrement, reset } = useCounter(10)
```

> **一句话总结**：组合式函数 = 把可复用的响应式逻辑抽离成独立函数，让代码更简洁、更好维护。

---

## 12.2 核心原理

### 什么是组合式函数？

组合式函数（Composable）就是一个 **普通的 JavaScript/TypeScript 函数**，但它有两个特点：

1. **名字以 `use` 开头**（这是 Vue 的约定）
2. **内部使用了 Vue 的组合式 API**（如 `ref`、`reactive`、`computed`、`watch`、生命周期钩子等）

打个比方：

> 组合式函数就像 **"封装好的菜谱"**。你把做一道菜的所有步骤（买菜、切菜、炒菜、调味）都写在一张纸上。别人拿到这张纸，按照步骤做，就能做出同样的菜——不需要知道具体细节。

### 为什么函数里的 ref 能保持响应式？

这是很多人最困惑的地方：为什么在函数里创建的 `ref`，返回到组件后还能保持响应式？

**答案：闭包（Closure）**

打个比方：

> 想象你去餐厅打包外卖。厨师把菜做好后，装进饭盒里交给你。虽然厨师（函数）已经离开了，但饭盒（ref 对象）还在你手里，里面的菜（数据）还是热的（响应式的）。
>
> 组合式函数就像"打包响应式数据"——函数执行完了，但它创建的 ref 对象还在，而且保持着响应式特性。

让我们看看底层原理：

```typescript
// 组合式函数内部
export function useCounter() {
  // 1. 创建一个 ref 对象
  // ref() 返回的是一个包含 { value: 0 } 的对象
  // 这个对象被 Vue 的响应式系统（Proxy）包装过
  const count = ref(0)

  // 2. 返回这个 ref 对象
  // 即使函数执行结束，count 这个对象仍然存在于内存中
  // 因为它被返回出去了，外部还在引用它
  return { count }
}

// 组件中使用
const { count } = useCounter()
// count 是 { value: 0 } 这个对象
// 它仍然被 Vue 的响应式系统追踪
// 所以 count.value++ 会触发视图更新
```

**关键点**：

- ✅ `ref` 返回的是一个对象 `{ value: ... }`，对象引用不会丢失
- ✅ Vue 的响应式系统（Proxy）追踪的是这个对象，不是函数作用域
- ✅ 只要对象还在被引用，响应式就一直有效

### 为什么能以 `use` 开头命名？

这是 Vue 团队的约定，目的是让你一眼就能认出："哦，这是一个组合式函数，里面封装了响应式逻辑。"

就像看到 `use` 开头的名字，你就知道它不是一个普通函数，它内部一定用了 Vue 的响应式系统。

### 组合式函数能做什么？

| 场景       | 没有组合式函数                         | 有组合式函数                           |
| ---------- | -------------------------------------- | -------------------------------------- |
| 计数器逻辑 | 每个组件重复写                         | `useCounter()` 一行搞定                |
| 数据请求   | 每个页面重复写 fetch + loading + error | `useFetch(url)` 封装好所有状态         |
| 本地存储   | 手动读写 localStorage                  | `useLocalStorage(key, value)` 自动同步 |
| 鼠标位置   | 手动 addEventListener + 清理           | `useMouse()` 自动管理生命周期          |
| 防抖处理   | 手动写 setTimeout + clearTimeout       | `useDebounce(value, delay)` 自动防抖   |

### 6 个常用 Hook 对比

| Hook 名称         | 核心功能   | 使用的 Vue API                    | 典型场景           | 返回值                                                |
| ----------------- | ---------- | --------------------------------- | ------------------ | ----------------------------------------------------- |
| `useCounter`      | 计数逻辑   | `ref`, `computed`                 | 购物车、点赞数     | `{ count, doubleCount, increment, decrement, reset }` |
| `useFetch`        | 数据请求   | `ref`, `watchEffect`              | API 调用、数据加载 | `{ data, error, loading, refetch }`                   |
| `useLocalStorage` | 本地存储   | `ref`, `watch`                    | 持久化用户偏好     | `ref<T>`（直接返回响应式值）                          |
| `useDebounce`     | 防抖处理   | `ref`, `watch`                    | 搜索输入、表单验证 | `ref<T>`（防抖后的值）                                |
| `useMouse`        | 鼠标追踪   | `ref`, `onMounted`, `onUnmounted` | 交互效果、游戏     | `{ x, y }`                                            |
| `useMediaQuery`   | 响应式断点 | `ref`, `onMounted`, `onUnmounted` | 自适应布局         | `ref<boolean>`                                        |

---

## 12.3 基础用法：6 个常用组合式函数

### 1. useCounter - 计数器

这是最基础的组合式函数，封装了计数相关的逻辑。

**生活化类比**：

> 想象你有一个**电子计数器**（就像超市收银员手里的那个）。你按"+"就加 1，按"-"就减 1，按"清零"就回到 0。这个计数器会一直显示当前数字，你不用管它内部怎么计算的。
>
> `useCounter` 就是你的"电子计数器"——封装好了加减和清零功能，你只管用。

```typescript
// composables/useCounter.ts
// 导入 Vue 的组合式 API
import { ref, computed } from 'vue'

// 导出一个以 use 开头的函数，接收初始值参数
export function useCounter(initialValue = 0) {
  // 创建一个响应式的计数值，初始值由参数决定
  const count = ref(initialValue)

  // 计算属性：返回 count 的双倍值，count 变化时自动更新
  const doubleCount = computed(() => count.value * 2)

  // 增加函数：默认每次加 1，也可以传入自定义步长
  const increment = (step = 1) => {
    count.value += step // 修改 ref 的值需要用 .value
  }

  // 减少函数：默认每次减 1
  const decrement = (step = 1) => {
    count.value -= step
  }

  // 重置函数：把 count 恢复到初始值
  const reset = () => {
    count.value = initialValue
  }

  // 返回所有需要的状态和方法，让调用者可以使用
  return {
    count, // 当前计数值（响应式）
    doubleCount, // 双倍值（计算属性，响应式）
    increment, // 增加方法
    decrement, // 减少方法
    reset, // 重置方法
  }
}
```

```vue
<!-- 在组件中使用 -->
<script setup lang="ts">
// 导入我们封装好的组合式函数
import { useCounter } from './composables/useCounter'

// 调用 useCounter，初始值设为 10
// 解构出需要的状态和方法
const { count, doubleCount, increment, decrement, reset } = useCounter(10)
</script>

<template>
  <!-- 显示当前计数值，count 变化时自动更新视图 -->
  <p>计数：{{ count }}</p>
  <!-- 显示双倍值，自动根据 count 计算 -->
  <p>双倍：{{ doubleCount }}</p>
  <!-- 点击按钮调用 increment，默认加 1 -->
  <button @click="increment">+1</button>
  <!-- 点击按钮调用 decrement，默认减 1 -->
  <button @click="decrement">-1</button>
  <!-- 点击按钮调用 reset，恢复到初始值 10 -->
  <button @click="reset">重置</button>
</template>
```

> **原理**：`useCounter` 内部用 `ref` 创建了响应式数据，返回的 `count` 仍然是响应式的。所以在模板中使用 `{{ count }}` 时，数据变化会自动更新视图。

---

### 2. useFetch - 数据请求

封装网络请求逻辑，自动管理 `loading`、`error`、`data` 三个状态。

**生活化类比**：

> 想象你在餐厅点餐。你告诉服务员"我要一份宫保鸡丁"（传入 URL），然后：
>
> - 服务员说"好的，请稍等"（`loading = true`）
> - 厨房做好后，服务员把菜端上来（`data = 菜品`）
> - 如果厨房没食材了，服务员告诉你"抱歉，这道菜做不了"（`error = 错误信息`）
>
> `useFetch` 就是你的"智能服务员"——你只管点餐，它帮你处理等待、上菜、报错的所有流程。

```typescript
// composables/useFetch.ts
// 导入 ref 创建响应式数据，watchEffect 自动追踪依赖
import { ref, watchEffect } from 'vue'

// 泛型函数：T 是返回数据的类型
export function useFetch<T>(url: string) {
  // 存储请求返回的数据，初始为 null
  const data = ref<T | null>(null)
  // 存储错误信息，初始为 null
  const error = ref<Error | null>(null)
  // 存储加载状态，初始为 false
  const loading = ref(false)

  // 定义请求函数
  const fetchData = async () => {
    // 开始请求，设置 loading 为 true
    loading.value = true
    // 清空之前的错误信息
    error.value = null

    try {
      // 发起 fetch 请求
      const response = await fetch(url)
      // 如果 HTTP 状态码不是 2xx，抛出错误
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      // 把响应体解析为 JSON
      const json = await response.json()
      // 把解析后的数据赋值给响应式变量
      data.value = json
    } catch (e) {
      // 捕获错误，赋值给 error 响应式变量
      error.value = e as Error
    } finally {
      // 无论成功还是失败，都要把 loading 设为 false
      loading.value = false
    }
  }

  // watchEffect 会自动追踪内部用到的响应式数据
  // url 变化时会自动重新请求
  watchEffect(() => {
    fetchData()
  })

  // 返回所有状态和重新请求的方法
  return {
    data, // 请求的数据（响应式）
    error, // 错误信息（响应式）
    loading, // 加载状态（响应式）
    refetch: fetchData, // 手动重新请求的方法
  }
}
```

```vue
<!-- 在组件中使用 -->
<script setup lang="ts">
// 导入封装好的 useFetch
import { useFetch } from './composables/useFetch'

// 定义用户数据的 TypeScript 类型
interface User {
  id: number // 用户 ID
  name: string // 用户姓名
  email: string // 用户邮箱
}

// 调用 useFetch，传入 API 地址，泛型指定返回数据类型
const { data, error, loading, refetch } = useFetch<User[]>('/api/users')
</script>

<template>
  <!-- 如果正在加载，显示加载提示 -->
  <div v-if="loading">加载中...</div>
  <!-- 如果有错误，显示错误信息 -->
  <div v-else-if="error">错误：{{ error.message }}</div>
  <!-- 加载完成且没有错误，显示数据列表 -->
  <div v-else>
    <ul>
      <!-- 遍历用户列表，用 id 作为 key -->
      <li v-for="user in data" :key="user.id">{{ user.name }} - {{ user.email }}</li>
    </ul>
    <!-- 点击按钮手动重新请求 -->
    <button @click="refetch">刷新</button>
  </div>
</template>
```

> **原理**：`watchEffect` 会在组件挂载时自动执行一次请求，如果 `url` 发生变化，还会自动重新请求。

---

### 3. useLocalStorage - 本地存储

封装 localStorage 的读写操作，让数据变化时自动同步到本地存储。

**生活化类比**：

> 想象你有一个**自动笔记本**。你在笔记本上写任何东西，它会自动帮你复印一份存到保险箱里。下次你打开笔记本时，之前写的内容还在。
>
> `useLocalStorage` 就是这个"自动笔记本"——你只管修改数据，它自动帮你存到浏览器的 localStorage 里。刷新页面后数据也不会丢。

```typescript
// composables/useLocalStorage.ts
// 导入 ref 创建响应式数据，watch 监听变化
import { ref, watch } from 'vue'

// 泛型函数：T 是存储数据的类型
export function useLocalStorage<T>(key: string, initialValue: T) {
  // 尝试从 localStorage 读取已有的数据
  const storedValue = localStorage.getItem(key)
  // 如果有存储的值就解析它，否则使用传入的初始值
  const data = ref<T>(storedValue ? JSON.parse(storedValue) : initialValue)

  // 监听 data 的变化，自动同步到 localStorage
  watch(
    data,
    (newValue) => {
      // 把新值序列化为 JSON 字符串，存入 localStorage
      localStorage.setItem(key, JSON.stringify(newValue))
      // deep: true 表示深度监听，对象内部变化也能监听到
    },
    { deep: true },
  )

  // 返回响应式数据，使用方式和普通 ref 一样
  return data
}
```

```vue
<!-- 在组件中使用 -->
<script setup lang="ts">
// 导入封装好的 useLocalStorage
import { useLocalStorage } from './composables/useLocalStorage'

// 创建用户名，自动从 localStorage 读取，默认值为"访客"
const username = useLocalStorage('username', '访客')
// 创建主题，自动从 localStorage 读取，默认值为"light"
const theme = useLocalStorage('theme', 'light')

// 切换主题的函数
const toggleTheme = () => {
  // 在 light 和 dark 之间切换
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}
</script>

<template>
  <div>
    <!-- 双向绑定用户名，输入时自动保存到 localStorage -->
    <input v-model="username" placeholder="用户名" />
    <!-- 显示当前主题 -->
    <p>当前主题：{{ theme }}</p>
    <!-- 点击按钮切换主题 -->
    <button @click="toggleTheme">切换主题</button>
  </div>
</template>
```

> **原理**：`watch` 监听了 `data` 的变化，每次修改 `data.value` 时，都会自动把新值写入 `localStorage`。刷新页面后，数据不会丢失。

---

### 4. useDebounce - 防抖

封装防抖逻辑，避免频繁触发操作（比如搜索输入）。

**生活化类比**：

> 想象你在电梯里，电梯门要关闭时，如果有人按了开门按钮，电梯会等几秒钟再关门。这个"等几秒钟"就是防抖。
>
> `useDebounce` 就像电梯的"延时关门"机制——用户停止操作后，等一段时间再执行。这样可以避免频繁触发（比如搜索时不用每次按键都发请求）。

```typescript
// composables/useDebounce.ts
// 导入 ref 创建响应式数据，watch 监听变化
import { ref, watch } from 'vue'

// 泛型函数：T 是值的类型，delay 是防抖延迟时间（毫秒）
export function useDebounce<T>(value: T, delay = 300) {
  // 创建防抖后的响应式值，初始值和传入的 value 相同
  const debouncedValue = ref<T>(value)
  // 定时器变量，用于清除之前的定时器
  let timer: number | null = null

  // 监听传入值的变化
  watch(value, (newValue) => {
    // 如果已有定时器在运行，先清除它
    if (timer !== null) {
      clearTimeout(timer)
    }

    // 设置新的定时器，延迟 delay 毫秒后再更新值
    timer = window.setTimeout(() => {
      // 延迟结束后，把新值赋给防抖值
      debouncedValue.value = newValue
    }, delay)
  })

  // 返回防抖后的值
  return debouncedValue
}
```

```vue
<!-- 在组件中使用 -->
<script setup lang="ts">
// 导入 ref 和 useDebounce
import { ref } from 'vue'
import { useDebounce } from './composables/useDebounce'

// 创建搜索关键词的响应式数据
const keyword = ref('')
// 对 keyword 进行防抖处理，延迟 500 毫秒
const debouncedKeyword = useDebounce(keyword, 500)

// 监听防抖后的值，只有用户停止输入 500ms 后才会触发
watch(debouncedKeyword, (newValue) => {
  console.log('搜索：', newValue)
  // 这里可以发起搜索请求
})
</script>

<template>
  <!-- 输入框双向绑定 keyword -->
  <input v-model="keyword" placeholder="搜索..." />
  <!-- 实时显示当前输入值（每次按键都变） -->
  <p>实时值：{{ keyword }}</p>
  <!-- 显示防抖后的值（停止输入 500ms 后才变） -->
  <p>防抖值：{{ debouncedKeyword }}</p>
</template>
```

> **原理**：每次 `keyword` 变化时，都会清除之前的定时器并重新设置。只有当用户停止输入超过 500ms 后，`debouncedKeyword` 才会更新，从而避免频繁发起请求。

---

### 5. useMouse - 鼠标位置

封装鼠标位置追踪逻辑，自动管理事件监听的注册和清理。

**生活化类比**：

> 想象你请了一个**私人助理**，专门帮你记录鼠标的位置。你走到哪，他就记到哪。当你不需要这个服务时，跟助理说一声，他就离开了。
>
> `useMouse` 就是你的"鼠标位置助理"——自动追踪鼠标位置，组件销毁时自动"解雇"助理（移除事件监听），不会留下内存泄漏。

```typescript
// composables/useMouse.ts
// 导入 ref 和生命周期钩子
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  // 鼠标 X 坐标，初始为 0
  const x = ref(0)
  // 鼠标 Y 坐标，初始为 0
  const y = ref(0)

  // 鼠标移动事件处理函数
  const update = (event: MouseEvent) => {
    // pageX 是相对于整个文档的水平坐标
    x.value = event.pageX
    // pageY 是相对于整个文档的垂直坐标
    y.value = event.pageY
  }

  // 组件挂载后，注册鼠标移动事件监听
  onMounted(() => {
    window.addEventListener('mousemove', update)
  })

  // 组件卸载前，移除事件监听，防止内存泄漏
  onUnmounted(() => {
    window.removeEventListener('mousemove', update)
  })

  // 返回鼠标坐标
  return { x, y }
}
```

```vue
<!-- 在组件中使用 -->
<script setup lang="ts">
// 导入封装好的 useMouse
import { useMouse } from './composables/useMouse'

// 调用 useMouse，获取鼠标坐标
const { x, y } = useMouse()
</script>

<template>
  <!-- 实时显示鼠标位置，移动鼠标时自动更新 -->
  <p>鼠标位置：{{ x }}, {{ y }}</p>
</template>
```

> **原理**：`onMounted` 在组件挂载后注册事件监听，`onUnmounted` 在组件卸载前移除监听。这样就不会有内存泄漏的问题。

---

### 6. useMediaQuery - 响应式断点

封装 `window.matchMedia`，让 CSS 媒体查询的结果变成响应式数据。

**生活化类比**：

> 想象你有一个**智能窗户**，它能感知外面的天气。当检测到下雨时，它会自动关窗；天晴时，自动开窗。你不用亲自去看天气，窗户会告诉你结果。
>
> `useMediaQuery` 就是你的"智能窗户"——它监听屏幕尺寸变化，告诉你当前是移动端、平板还是桌面端，你只管根据结果调整布局。

```typescript
// composables/useMediaQuery.ts
// 导入 ref 和生命周期钩子
import { ref, onMounted, onUnmounted } from 'vue'

// 接收 CSS 媒体查询字符串，如 '(max-width: 768px)'
export function useMediaQuery(query: string) {
  // 存储是否匹配的结果，初始为 false
  const matches = ref(false)
  // 存储 MediaQueryList 对象，用于后续清理
  let mediaQuery: MediaQueryList | null = null
  // ✅ 保存 handler 引用，以便在 onUnmounted 中正确移除
  let handler: ((event: MediaQueryListEvent) => void) | null = null

  // 组件挂载后初始化
  onMounted(() => {
    // 创建 MediaQueryList 对象
    mediaQuery = window.matchMedia(query)
    // 设置初始匹配状态
    matches.value = mediaQuery.matches

    // 定义变化处理函数
    handler = (event: MediaQueryListEvent) => {
      // 当媒体查询匹配状态变化时，更新响应式值
      matches.value = event.matches
    }

    // 注册变化事件监听
    mediaQuery.addEventListener('change', handler)
  })

  // 组件卸载前清理
  onUnmounted(() => {
    // 如果 mediaQuery 和 handler 都存在，移除事件监听
    if (mediaQuery && handler) {
      mediaQuery.removeEventListener('change', handler)
    }
  })

  // 返回是否匹配的响应式值
  return matches
}
```

```vue
<!-- 在组件中使用 -->
<script setup lang="ts">
// 导入封装好的 useMediaQuery
import { useMediaQuery } from './composables/useMediaQuery'

// 判断是否为移动端（屏幕宽度 <= 768px）
const isMobile = useMediaQuery('(max-width: 768px)')
// 判断是否为平板（769px <= 屏幕宽度 <= 1024px）
const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)')
// 判断是否为桌面端（屏幕宽度 >= 1025px）
const isDesktop = useMediaQuery('(min-width: 1025px)')
</script>

<template>
  <div>
    <!-- 根据设备类型显示不同布局 -->
    <p v-if="isMobile">移动端布局</p>
    <p v-else-if="isTablet">平板布局</p>
    <p v-else>桌面端布局</p>
  </div>
</template>
```

> **原理**：`window.matchMedia` 可以检测 CSS 媒体查询是否匹配。通过监听 `change` 事件，当窗口大小变化导致匹配状态改变时，自动更新响应式数据。

---

## 12.4 进阶用法：组合多个 Hooks

组合式函数最强大的地方在于 **可以互相组合**。一个组合式函数可以调用其他组合式函数。

**生活化类比**：

> 想象你在组装一台电脑。你不需要从零开始制造每个零件，而是直接买现成的 CPU、内存、硬盘，然后把它们组装在一起。
>
> 组合式函数就像电脑零件——`useFetch` 是"网卡"，`useLocalStorage` 是"硬盘"，你把它们组合起来，就成了一台完整的"电脑"（`useUser`）。

> 就像搭积木一样，你可以把小的积木拼成大的积木。`useFetch` + `useLocalStorage` 可以组合成一个 `useUser`。

```typescript
// composables/useUser.ts
// 导入需要的 Vue API 和其他组合式函数
import { ref, computed } from 'vue'
import { useFetch } from './useFetch'
import { useLocalStorage } from './useLocalStorage'

export function useUser() {
  // 使用 useLocalStorage 获取当前用户 ID，自动从本地存储读取
  const userId = useLocalStorage('currentUserId', 1)

  // 使用 useFetch 请求用户信息，URL 中用到了 userId
  const { data: user, loading, error } = useFetch(`/api/users/${userId.value}`)

  // 计算属性：判断是否已登录（有用户数据就是已登录）
  const isLoggedIn = computed(() => !!user.value)

  // 退出登录：把 userId 设为 0
  const logout = () => {
    userId.value = 0
  }

  // 返回所有状态和方法
  return {
    user, // 用户数据
    loading, // 加载状态
    error, // 错误信息
    isLoggedIn, // 是否已登录
    logout, // 退出方法
  }
}
```

```vue
<!-- 在组件中使用 -->
<script setup lang="ts">
// 导入组合好的 useUser
import { useUser } from './composables/useUser'

// 一行代码获取所有用户相关状态
const { user, loading, isLoggedIn, logout } = useUser()
</script>

<template>
  <!-- 加载中显示加载提示 -->
  <div v-if="loading">加载中...</div>
  <!-- 已登录显示用户信息和退出按钮 -->
  <div v-else-if="isLoggedIn">
    <p>欢迎，{{ user?.name }}</p>
    <button @click="logout">退出</button>
  </div>
  <!-- 未登录显示提示 -->
  <div v-else>
    <p>未登录</p>
  </div>
</template>
```

> **原理**：`useUser` 内部调用了 `useLocalStorage` 和 `useFetch`，把它们的返回值组合在一起。这就是组合式函数的魅力——像搭积木一样组合功能。

---

## 12.5 核心知识点总结

| 知识点     | 说明                                           |
| ---------- | ---------------------------------------------- |
| 命名规范   | 必须以 `use` 开头，如 `useCounter`、`useFetch` |
| 返回值     | 返回 `ref` 或 `reactive` 对象，保持响应式      |
| 封装副作用 | 可以在内部处理生命周期钩子、事件监听等         |
| 互相组合   | 一个 composable 可以调用其他 composable        |
| 类型安全   | 使用 TypeScript 泛型提供完整的类型推导         |
| 可复用性   | 将逻辑从组件中抽离，多个组件共享同一套逻辑     |
| 测试友好   | 独立的函数更容易进行单元测试                   |

---

## 12.6 新手常见误区

### 误区 1："组合式函数必须用在 `<script setup>` 里"

❌ **错！** 组合式函数就是一个普通函数，可以在任何地方调用。只是因为在 `<script setup>` 中使用最方便，所以给大家留下了这个印象。

✅ 正确理解：组合式函数可以在普通的 `setup()` 函数、`<script setup>`、甚至其他组合式函数中调用。

### 误区 2："解构后会失去响应式"

❌ **错！** 如果你解构的是 `ref`，响应式不会丢失。

```typescript
// ✅ 正确：ref 解构后仍然是响应式
const { count } = useCounter()
// count 是 ref，在模板中直接用 {{ count }} 就能响应式更新

// ✅ 也正确：如果 composable 返回 reactive 对象，解构会丢失响应式
// 这时候要用 toRefs 转换
```

> **关键区别**：`ref` 解构不会丢失响应式（因为解构出来的是 ref 对象本身），但 `reactive` 对象解构基本类型的属性会丢失响应式。

### 误区 3："组合式函数里不能用生命周期钩子"

❌ **错！** 组合式函数里完全可以使用 `onMounted`、`onUnmounted` 等生命周期钩子。

✅ 前提条件：组合式函数必须在组件的 `setup` 阶段（包括 `<script setup>`）被同步调用。这样 Vue 才能知道当前是哪个组件，从而正确绑定生命周期。

### 误区 4："每个功能都要封装成组合式函数"

❌ **过度封装！** 如果一个逻辑只在一个组件中使用，而且很简单，没必要抽成组合式函数。

✅ 正确做法：当同一段逻辑在多个组件中重复出现时，再考虑封装。不要为了封装而封装。

### 误区 5："组合式函数和 Vue 2 的 mixins 一样"

❌ **不一样！** 虽然都是复用逻辑的手段，但组合式函数有明显优势：

| 特性     | Mixins（Vue 2）           | Composables（Vue 3）   |
| -------- | ------------------------- | ---------------------- |
| 来源清晰 | 不知道属性从哪个 mixin 来 | 一眼看出从哪个函数解构 |
| 命名冲突 | 多个 mixin 可能属性同名   | 解构时可以重命名       |
| 类型推导 | 不支持 TypeScript         | 完整的类型推导         |
| 互相组合 | 不支持                    | 可以自由组合           |

---

## 12.7 动手练习

### 练习 1：基础练习 - 封装 useToggle

封装一个 `useToggle` 组合式函数，实现布尔值的切换功能。要求：

- 接收一个初始值（默认 `false`）
- 返回当前状态和切换方法

<details>
<summary>点击查看答案</summary>

```typescript
// composables/useToggle.ts
// 导入 ref 创建响应式数据
import { ref } from 'vue'

// 导出组合式函数，接收初始布尔值
export function useToggle(initialValue = false) {
  // 创建响应式的状态值
  const state = ref(initialValue)

  // 切换状态：true 变 false，false 变 true
  const toggle = () => {
    state.value = !state.value
  }

  // 手动设为 true
  const setTrue = () => {
    state.value = true
  }

  // 手动设为 false
  const setFalse = () => {
    state.value = false
  }

  // 返回状态和所有方法
  return {
    state, // 当前状态（响应式）
    toggle, // 切换方法
    setTrue, // 设为 true
    setFalse, // 设为 false
  }
}
```

```vue
<!-- 在组件中使用 -->
<script setup lang="ts">
// 导入 useToggle
import { useToggle } from './composables/useToggle'

// 调用 useToggle，初始值为 false
// 把 state 重命名为 isVisible 更语义化
const { state: isVisible, toggle, setTrue, setFalse } = useToggle(false)
</script>

<template>
  <div>
    <!-- 根据 isVisible 控制显示隐藏 -->
    <p v-if="isVisible">可见内容</p>
    <!-- 切换按钮 -->
    <button @click="toggle">切换</button>
    <!-- 显示按钮 -->
    <button @click="setTrue">显示</button>
    <!-- 隐藏按钮 -->
    <button @click="setFalse">隐藏</button>
  </div>
</template>
```

</details>

### 练习 2：进阶练习 - 封装 useTitle

封装一个 `useTitle` 组合式函数，实现动态修改页面标题（`document.title`）。要求：

- 接收一个初始标题
- 返回响应式的标题值
- 修改标题值时，`document.title` 自动同步更新

<details>
<summary>点击查看答案</summary>

```typescript
// composables/useTitle.ts
// 导入 ref 和 watch
import { ref, watch } from 'vue'

// 导出组合式函数，接收初始标题
export function useTitle(initialTitle = '') {
  // 创建响应式标题，初始值取 document.title 或传入的值
  const title = ref(initialTitle || document.title)

  // 监听 title 变化，同步到 document.title
  watch(title, (newTitle) => {
    // 把新标题赋值给 document.title
    document.title = newTitle
  })

  // 返回响应式标题
  return title
}
```

```vue
<!-- 在组件中使用 -->
<script setup lang="ts">
// 导入 useTitle
import { useTitle } from './composables/useTitle'

// 设置页面初始标题
const pageTitle = useTitle('我的页面')

// 3 秒后自动修改标题
setTimeout(() => {
  // 修改响应式值，document.title 会自动更新
  pageTitle.value = '标题变了！'
}, 3000)
</script>

<template>
  <div>
    <p>当前标题：{{ pageTitle }}</p>
    <!-- 输入框修改标题，document.title 会实时同步 -->
    <input v-model="pageTitle" placeholder="输入新标题" />
  </div>
</template>
```

</details>

### 练习 3（挑战）：综合练习 - 封装 useCounterWithHistory

封装一个 `useCounterWithHistory` 组合式函数，在计数器的基础上增加历史记录功能。要求：

- 包含 `useCounter` 的所有功能（count、increment、decrement、reset）
- 额外记录每次操作的历史（操作类型和时间）
- 提供查看历史记录的方法

提示：可以组合 `useCounter` 和额外的 `ref` 来实现。

<details>
<summary>点击查看答案</summary>

```typescript
// composables/useCounterWithHistory.ts
// 导入 ref 和 computed
import { ref, computed } from 'vue'
// 导入已有的 useCounter
import { useCounter } from './useCounter'

// 定义历史记录的类型
interface HistoryRecord {
  action: string // 操作类型：'increment' | 'decrement' | 'reset'
  timestamp: number // 操作时间戳
  value: number // 操作后的值
}

// 导出组合式函数
export function useCounterWithHistory(initialValue = 0) {
  // 组合已有的 useCounter
  const { count, doubleCount, increment, decrement, reset } = useCounter(initialValue)

  // 创建历史记录数组（响应式）
  const history = ref<HistoryRecord[]>([])

  // 添加记录的辅助函数
  const addRecord = (action: string) => {
    history.value.push({
      action, // 操作类型
      timestamp: Date.now(), // 当前时间戳
      value: count.value, // 当前计数值
    })
  }

  // 包装 increment 方法，增加记录功能
  const incrementWithHistory = (step = 1) => {
    increment(step) // 调用原始的 increment
    addRecord('increment') // 记录操作
  }

  // 包装 decrement 方法
  const decrementWithHistory = (step = 1) => {
    decrement(step) // 调用原始的 decrement
    addRecord('decrement') // 记录操作
  }

  // 包装 reset 方法
  const resetWithHistory = () => {
    reset() // 调用原始的 reset
    addRecord('reset') // 记录操作
  }

  // 计算属性：历史记录的数量
  const historyLength = computed(() => history.value.length)

  // 清空历史记录
  const clearHistory = () => {
    history.value = []
  }

  // 返回所有状态和方法
  return {
    count, // 当前计数值
    doubleCount, // 双倍值
    increment: incrementWithHistory, // 带记录的 increment
    decrement: decrementWithHistory, // 带记录的 decrement
    reset: resetWithHistory, // 带记录的 reset
    history, // 历史记录数组
    historyLength, // 历史记录数量
    clearHistory, // 清空历史
  }
}
```

```vue
<!-- 在组件中使用 -->
<script setup lang="ts">
// 导入 useCounterWithHistory
import { useCounterWithHistory } from './composables/useCounterWithHistory'

// 调用组合式函数
const { count, doubleCount, increment, decrement, reset, history, historyLength, clearHistory } =
  useCounterWithHistory(0)
</script>

<template>
  <div>
    <!-- 显示计数和双倍值 -->
    <p>计数：{{ count }}，双倍：{{ doubleCount }}</p>
    <!-- 操作按钮 -->
    <button @click="increment">+1</button>
    <button @click="decrement">-1</button>
    <button @click="reset">重置</button>
    <button @click="clearHistory">清空历史</button>

    <!-- 显示历史记录 -->
    <p>操作次数：{{ historyLength }}</p>
    <ul>
      <!-- 遍历历史记录 -->
      <li v-for="(record, index) in history" :key="index">
        {{ record.action }} → {{ record.value }} （{{
          new Date(record.timestamp).toLocaleTimeString()
        }}）
      </li>
    </ul>
  </div>
</template>
```

</details>

---

## 下一章预告

下一章我们会学习 **状态管理（Pinia）**——Vue 3 官方推荐的全局状态管理方案。当你的应用需要在多个组件之间共享状态时，组合式函数可能不够用，这时候就需要 Pinia 来统一管理全局状态。你会学到如何创建 store、如何使用 state/getters/actions，以及 Pinia 和组合式函数的关系。
