---
title: "第十二章：自定义 Hooks"
description: "学习如何封装可复用的组合式函数（Composables）"
---

# 第十二章：自定义 Hooks

## 运行结果

| Hook 名称 | 功能 | 使用场景 |
| --- | --- | --- |
| `useCounter` | 计数器逻辑 | 需要计数的组件 |
| `useFetch` | 数据请求 | API 调用 |
| `useLocalStorage` | 本地存储 | 持久化数据 |
| `useDebounce` | 防抖处理 | 输入框搜索 |
| `useMouse` | 鼠标位置 | 交互效果 |
| `useMediaQuery` | 响应式断点 | 自适应布局 |

## 代码示例

### 1. useCounter - 计数器

```typescript
// composables/useCounter.ts
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)

  const doubleCount = computed(() => count.value * 2)

  const increment = (step = 1) => {
    count.value += step
  }

  const decrement = (step = 1) => {
    count.value -= step
  }

  const reset = () => {
    count.value = initialValue
  }

  return {
    count,
    doubleCount,
    increment,
    decrement,
    reset
  }
}
```

```vue
<!-- 使用 -->
<script setup lang="ts">
import { useCounter } from './composables/useCounter'

const { count, doubleCount, increment, decrement, reset } = useCounter(10)
</script>

<template>
  <p>计数：{{ count }}</p>
  <p>双倍：{{ doubleCount }}</p>
  <button @click="increment">+1</button>
  <button @click="decrement">-1</button>
  <button @click="reset">重置</button>
</template>
```

### 2. useFetch - 数据请求

```typescript
// composables/useFetch.ts
import { ref, watchEffect } from 'vue'

export function useFetch<T>(url: string) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const loading = ref(false)

  const fetchData = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const json = await response.json()
      data.value = json
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  watchEffect(() => {
    fetchData()
  })

  return {
    data,
    error,
    loading,
    refetch: fetchData
  }
}
```

```vue
<!-- 使用 -->
<script setup lang="ts">
import { useFetch } from './composables/useFetch'

interface User {
  id: number
  name: string
  email: string
}

const { data, error, loading, refetch } = useFetch<User[]>('/api/users')
</script>

<template>
  <div v-if="loading">加载中...</div>
  <div v-else-if="error">错误：{{ error.message }}</div>
  <div v-else>
    <ul>
      <li v-for="user in data" :key="user.id">
        {{ user.name }} - {{ user.email }}
      </li>
    </ul>
    <button @click="refetch">刷新</button>
  </div>
</template>
```

### 3. useLocalStorage - 本地存储

```typescript
// composables/useLocalStorage.ts
import { ref, watch } from 'vue'

export function useLocalStorage<T>(key: string, initialValue: T) {
  // 从 localStorage 读取初始值
  const storedValue = localStorage.getItem(key)
  const data = ref<T>(storedValue ? JSON.parse(storedValue) : initialValue)

  // 监听变化，同步到 localStorage
  watch(data, (newValue) => {
    localStorage.setItem(key, JSON.stringify(newValue))
  }, { deep: true })

  return data
}
```

```vue
<!-- 使用 -->
<script setup lang="ts">
import { useLocalStorage } from './composables/useLocalStorage'

const username = useLocalStorage('username', '访客')
const theme = useLocalStorage('theme', 'light')

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}
</script>

<template>
  <div>
    <input v-model="username" placeholder="用户名" />
    <p>当前主题：{{ theme }}</p>
    <button @click="toggleTheme">切换主题</button>
  </div>
</template>
```

### 4. useDebounce - 防抖

```typescript
// composables/useDebounce.ts
import { ref, watch } from 'vue'

export function useDebounce<T>(value: T, delay = 300) {
  const debouncedValue = ref<T>(value)
  let timer: number | null = null

  watch(value, (newValue) => {
    if (timer !== null) {
      clearTimeout(timer)
    }

    timer = window.setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  })

  return debouncedValue
}
```

```vue
<!-- 使用 -->
<script setup lang="ts">
import { ref } from 'vue'
import { useDebounce } from './composables/useDebounce'

const keyword = ref('')
const debouncedKeyword = useDebounce(keyword, 500)

// 监听防抖后的值
watch(debouncedKeyword, (newValue) => {
  console.log('搜索：', newValue)
  // 发起搜索请求
})
</script>

<template>
  <input v-model="keyword" placeholder="搜索..." />
  <p>实时值：{{ keyword }}</p>
  <p>防抖值：{{ debouncedKeyword }}</p>
</template>
```

### 5. useMouse - 鼠标位置

```typescript
// composables/useMouse.ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  const x = ref(0)
  const y = ref(0)

  const update = (event: MouseEvent) => {
    x.value = event.pageX
    y.value = event.pageY
  }

  onMounted(() => {
    window.addEventListener('mousemove', update)
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', update)
  })

  return { x, y }
}
```

```vue
<!-- 使用 -->
<script setup lang="ts">
import { useMouse } from './composables/useMouse'

const { x, y } = useMouse()
</script>

<template>
  <p>鼠标位置：{{ x }}, {{ y }}</p>
</template>
```

### 6. useMediaQuery - 响应式断点

```typescript
// composables/useMediaQuery.ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useMediaQuery(query: string) {
  const matches = ref(false)
  let mediaQuery: MediaQueryList | null = null

  onMounted(() => {
    mediaQuery = window.matchMedia(query)
    matches.value = mediaQuery.matches

    const handler = (event: MediaQueryListEvent) => {
      matches.value = event.matches
    }

    mediaQuery.addEventListener('change', handler)
  })

  onUnmounted(() => {
    if (mediaQuery) {
      mediaQuery.removeEventListener('change', () => {})
    }
  })

  return matches
}
```

```vue
<!-- 使用 -->
<script setup lang="ts">
import { useMediaQuery } from './composables/useMediaQuery'

const isMobile = useMediaQuery('(max-width: 768px)')
const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)')
const isDesktop = useMediaQuery('(min-width: 1025px)')
</script>

<template>
  <div>
    <p v-if="isMobile">移动端布局</p>
    <p v-else-if="isTablet">平板布局</p>
    <p v-else>桌面端布局</p>
  </div>
</template>
```

### 7. useToggle - 切换状态

```typescript
// composables/useToggle.ts
import { ref } from 'vue'

export function useToggle(initialValue = false) {
  const state = ref(initialValue)

  const toggle = () => {
    state.value = !state.value
  }

  const setTrue = () => {
    state.value = true
  }

  const setFalse = () => {
    state.value = false
  }

  return {
    state,
    toggle,
    setTrue,
    setFalse
  }
}
```

```vue
<!-- 使用 -->
<script setup lang="ts">
import { useToggle } from './composables/useToggle'

const { state: isVisible, toggle, setTrue, setFalse } = useToggle(false)
</script>

<template>
  <div>
    <p v-if="isVisible">可见内容</p>
    <button @click="toggle">切换</button>
    <button @click="setTrue">显示</button>
    <button @click="setFalse">隐藏</button>
  </div>
</template>
```

### 8. 组合多个 Hooks

```typescript
// composables/useUser.ts
import { ref, computed } from 'vue'
import { useFetch } from './useFetch'
import { useLocalStorage } from './useLocalStorage'

export function useUser() {
  const userId = useLocalStorage('currentUserId', 1)

  const { data: user, loading, error } = useFetch(
    `/api/users/${userId.value}`
  )

  const isLoggedIn = computed(() => !!user.value)

  const logout = () => {
    userId.value = 0
  }

  return {
    user,
    loading,
    error,
    isLoggedIn,
    logout
  }
}
```

```vue
<!-- 使用 -->
<script setup lang="ts">
import { useUser } from './composables/useUser'

const { user, loading, isLoggedIn, logout } = useUser()
</script>

<template>
  <div v-if="loading">加载中...</div>
  <div v-else-if="isLoggedIn">
    <p>欢迎，{{ user?.name }}</p>
    <button @click="logout">退出</button>
  </div>
  <div v-else>
    <p>未登录</p>
  </div>
</template>
```

## 核心知识点

1. **Composable 命名规范**：以 `use` 开头，如 `useCounter`、`useFetch`
2. **返回响应式状态**：返回 `ref` 或 `reactive` 对象
3. **封装副作用**：在 composable 中处理生命周期、事件监听
4. **组合多个 Hooks**：一个 composable 可以调用其他 composable
5. **类型安全**：使用 TypeScript 泛型提供完整的类型推导
6. **可复用性**：将逻辑从组件中抽离，提高代码复用率
7. **测试友好**：独立的 composable 更容易进行单元测试
