---
title: "第十四章：Pinia 状态管理"
description: "使用 Pinia 管理 Vue 3 应用的全局状态"
---

# 第十四章：Pinia 状态管理

## 运行结果

| 特性 | 说明 | 优势 |
| --- | --- | --- |
| Store 定义 | 使用 `defineStore` | 类型安全、模块化 |
| State | 响应式状态 | 自动类型推导 |
| Getters | 计算属性 | 缓存、可组合 |
| Actions | 业务逻辑 | 支持异步、可修改 state |
| 插件 | 扩展功能 | 持久化、日志等 |
| DevTools | 调试工具 | 时间旅行、状态检查 |

## 代码示例

### 1. 安装和配置 Pinia

```bash
npm install pinia
```

```typescript
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```

### 2. 定义 Store

```typescript
// stores/counter.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 选项式写法
export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: '计数器'
  }),
  getters: {
    doubleCount: (state) => state.count * 2,
    countPlusOne(): number {
      return this.count + 1
    }
  },
  actions: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    },
    async fetchCount() {
      const response = await fetch('/api/count')
      const data = await response.json()
      this.count = data.count
    }
  }
})

// 组合式写法（推荐）
export const useCounterStoreSetup = defineStore('counter-setup', () => {
  // state
  const count = ref(0)
  const name = ref('计数器')

  // getters
  const doubleCount = computed(() => count.value * 2)
  const countPlusOne = computed(() => count.value + 1)

  // actions
  const increment = () => count.value++
  const decrement = () => count.value--

  const fetchCount = async () => {
    const response = await fetch('/api/count')
    const data = await response.json()
    count.value = data.count
  }

  return {
    count,
    name,
    doubleCount,
    countPlusOne,
    increment,
    decrement,
    fetchCount
  }
})
```

### 3. 使用 Store

```vue
<script setup lang="ts">
import { useCounterStore } from './stores/counter'
import { storeToRefs } from 'pinia'

const counterStore = useCounterStore()

// 解构时需要使用 storeToRefs 保持响应式
const { count, doubleCount } = storeToRefs(counterStore)
const { increment, decrement } = counterStore
</script>

<template>
  <div>
    <h2>{{ counterStore.name }}</h2>
    <p>计数：{{ count }}</p>
    <p>双倍：{{ doubleCount }}</p>
    <button @click="increment">+1</button>
    <button @click="decrement">-1</button>
    <button @click="counterStore.fetchCount">从服务器获取</button>
  </div>
</template>
```

### 4. 修改 State

```vue
<script setup lang="ts">
import { useCounterStore } from './stores/counter'

const counterStore = useCounterStore()

// 方式 1：直接修改
const method1 = () => {
  counterStore.count++
}

// 方式 2：使用 $patch 对象
const method2 = () => {
  counterStore.$patch({
    count: 100,
    name: '新名称'
  })
}

// 方式 3：使用 $patch 函数（适合数组操作）
const method3 = () => {
  counterStore.$patch((state) => {
    state.count++
    state.name = '修改后的名称'
  })
}

// 方式 4：替换整个 state
const method4 = () => {
  counterStore.$state = {
    count: 0,
    name: '重置'
  }
}
</script>
```

### 5. 用户 Store 示例

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: number
  username: string
  email: string
  role: string
}

export const useUserStore = defineStore('user', () => {
  // state
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  // getters
  const isLoggedIn = computed(() => !!user.value && !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const displayName = computed(() => user.value?.username || '访客')

  // actions
  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (!response.ok) {
        throw new Error('登录失败')
      }

      const data = await response.json()
      user.value = data.user
      token.value = data.token

      // 保存到 localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
    } catch (error) {
      console.error('登录失败：', error)
      throw error
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const loadFromStorage = () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
    }
  }

  return {
    user,
    token,
    isLoggedIn,
    isAdmin,
    displayName,
    login,
    logout,
    loadFromStorage
  }
})
```

```vue
<!-- 使用 -->
<script setup lang="ts">
import { useUserStore } from './stores/user'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

const userStore = useUserStore()
const { isLoggedIn, displayName, isAdmin } = storeToRefs(userStore)

const username = ref('')
const password = ref('')

const handleLogin = async () => {
  try {
    await userStore.login(username.value, password.value)
    alert('登录成功')
  } catch (error) {
    alert('登录失败')
  }
}

const handleLogout = () => {
  userStore.logout()
}
</script>

<template>
  <div>
    <div v-if="isLoggedIn">
      <p>欢迎，{{ displayName }}</p>
      <p v-if="isAdmin">您是管理员</p>
      <button @click="handleLogout">退出登录</button>
    </div>
    <div v-else>
      <input v-model="username" placeholder="用户名" />
      <input v-model="password" type="password" placeholder="密码" />
      <button @click="handleLogin">登录</button>
    </div>
  </div>
</template>
```

### 6. Store 之间通信

```typescript
// stores/cart.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

  const itemCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    const existing = items.value.find(i => i.id === item.id)
    if (existing) {
      existing.quantity++
    } else {
      items.value.push({ ...item, quantity: 1 })
    }
  }

  const checkout = async () => {
    const userStore = useUserStore()

    if (!userStore.isLoggedIn) {
      throw new Error('请先登录')
    }

    // 提交订单
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userStore.token}`
      },
      body: JSON.stringify({ items: items.value })
    })

    if (!response.ok) {
      throw new Error('结账失败')
    }

    // 清空购物车
    items.value = []
  }

  return {
    items,
    totalPrice,
    itemCount,
    addItem,
    checkout
  }
})
```

### 7. Store 持久化插件

```bash
npm install pinia-plugin-persistedstate
```

```typescript
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.mount('#app')
```

```typescript
// stores/settings.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref('light')
  const language = ref('zh-CN')
  const fontSize = ref(14)

  return {
    theme,
    language,
    fontSize
  }
}, {
  persist: true // 自动持久化到 localStorage
})

// 或自定义持久化配置
export const useSettingsStoreCustom = defineStore('settings-custom', () => {
  const theme = ref('light')

  return { theme }
}, {
  persist: {
    key: 'my-settings',
    storage: localStorage,
    paths: ['theme'] // 只持久化部分字段
  }
})
```

### 8. Store 组合式函数

```typescript
// composables/useCart.ts
import { useCartStore } from '../stores/cart'
import { storeToRefs } from 'pinia'

export function useCart() {
  const cartStore = useCartStore()
  const { items, totalPrice, itemCount } = storeToRefs(cartStore)
  const { addItem, checkout } = cartStore

  return {
    items,
    totalPrice,
    itemCount,
    addItem,
    checkout
  }
}
```

```vue
<!-- 使用 -->
<script setup lang="ts">
import { useCart } from './composables/useCart'

const { items, totalPrice, itemCount, addItem, checkout } = useCart()
</script>

<template>
  <div>
    <p>购物车商品数：{{ itemCount }}</p>
    <p>总价：¥{{ totalPrice }}</p>
    <button @click="checkout">结账</button>
  </div>
</template>
```

## 核心知识点

1. **Pinia 优势**：Vue 3 官方推荐，完整的 TypeScript 支持
2. **Store 定义**：`defineStore` 支持选项式和组合式两种写法
3. **State 修改**：直接修改、`$patch` 对象、`$patch` 函数、替换 `$state`
4. **Getters**：计算属性，支持缓存和组合
5. **Actions**：业务逻辑，支持异步操作
6. **Store 通信**：在一个 store 中使用另一个 store
7. **持久化插件**：`pinia-plugin-persistedstate` 自动保存到 localStorage
8. **DevTools 支持**：时间旅行、状态检查、导出导入
