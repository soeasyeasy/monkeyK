---
title: '第十四章：Pinia 状态管理'
description: '使用 Pinia 管理 Vue 3 应用的全局状态'
---

# 第十四章：Pinia 状态管理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么需要 Pinia？组件之间传参不是用 props 就够了吗？
- Pinia 和 Vuex 有什么区别？为什么要用 Pinia 而不是 Vuex？
- Store 到底是什么？它和普通的数据对象有什么不同？
- 什么时候该用 Pinia？什么时候用组件本地状态就够了？

这一章就是为了解答这些问题。我们会先搞清楚 **为什么需要状态管理**，再理解 **Pinia 的核心概念**，最后动手实践。学完这章，你就能在项目中优雅地管理全局状态了。

---

## 14.1 为什么需要 Pinia？

### 痛点分析

想象一下这个场景：你开发了一个电商网站，用户登录后，用户信息需要被多个组件使用——导航栏显示用户名、购物车页面显示用户地址、订单页面显示用户手机号。

如果用 props 传递，你需要这样做：

```vue
<!-- 父组件 -->
<template>
  <NavBar :user="user" />
  <Cart :user="user" />
  <Order :user="user" />
</template>

<script setup>
import { ref } from 'vue'
const user = ref({ name: '张三', phone: '13800138000' })
</script>
```

问题来了：

- 如果组件嵌套很深呢？爷爷组件 → 父组件 → 子组件 → 孙组件，你要一层层传递 props
- 如果兄弟组件需要共享数据呢？它们没有父子关系，怎么传？
- 如果多个组件都要修改同一个数据呢？怎么保证数据同步？

这就是 **"props 钻洞"（prop drilling）** 问题——数据要穿过很多层组件才能到达需要的地方。

### 解决方案

Pinia 就像一个 **共享仓库**：

- 所有组件都可以从这个仓库取数据
- 所有组件都可以往仓库存数据
- 数据变化时，使用它的组件会自动更新

打个比方：

> 以前你要给每个房间送水，需要一桶桶搬过去（props 传递）。现在你在楼顶建了一个水箱（Pinia Store），每个房间装个水龙头（useStore）就能直接用水了。

```typescript
// 创建共享仓库（Store）
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 仓库里的货物（状态）
  const user = ref({ name: '张三', phone: '13800138000' })

  return { user }
})
```

```vue
<!-- 任何组件都可以直接使用 -->
<script setup>
import { useUserStore } from './stores/user'

const userStore = useUserStore()
// 直接访问，不用层层传递
console.log(userStore.user.name)
</script>
```

> **一句话总结**：Pinia 解决了组件间数据传递的痛点，让全局状态管理变得简单、直观、类型安全。

---

## 14.2 核心原理

### 什么是 Store？

Store 是 Pinia 的核心概念。它包含三个部分：

1. **State（状态）**：存储数据的地方，相当于仓库里的货物
2. **Getters（计算属性）**：基于 state 的派生值，相当于查询系统
3. **Actions（操作）**：修改 state 的方法，相当于仓库工人

打个比方：

> Store 就像一个智能仓库：
>
> - State 是仓库里的货物（存储数据）
> - Getters 是查询系统（比如"查询库存总量"）
> - Actions 是操作工人（比如"入库"、"出库"）

### 响应式原理

Pinia 的 state 是响应式的，这意味着：

- 当 state 变化时，使用它的组件会自动更新
- 底层使用了 Vue 3 的 `ref` 和 `reactive`
- 不需要手动触发更新

```typescript
// 创建 store
const useCounterStore = defineStore('counter', () => {
  // state 是响应式的
  const count = ref(0)

  // 修改 state
  const increment = () => count.value++

  return { count, increment }
})

// 在组件中使用
const store = useCounterStore()
store.increment() // count 变成 1
// 模板中的 {{ store.count }} 会自动更新
```

### 两种定义方式

Pinia 支持两种方式定义 store：

| 特性            | 选项式写法                    | 组合式写法（推荐）           |
| --------------- | ----------------------------- | ---------------------------- |
| 语法风格        | 类似 Vue 2 的 options API     | 类似 setup 语法              |
| 代码组织        | 按 state/getters/actions 分组 | 按功能逻辑分组               |
| TypeScript 支持 | 需要额外配置                  | 自动类型推导                 |
| 灵活性          | 较低                          | 更高，可以使用任何组合式 API |
| 适用场景        | 简单场景                      | 复杂逻辑、需要组合式 API     |

> **建议**：新项目统一使用组合式写法，代码更灵活、类型推导更好。

---

## 14.3 基础用法

### 1. 安装和配置 Pinia

首先安装 Pinia：

```bash
npm install pinia
```

然后在 main.ts 中注册：

```typescript
// main.ts
import { createApp } from 'vue' // 引入 Vue 创建应用函数
import { createPinia } from 'pinia' // 引入 Pinia 创建实例函数
import App from './App.vue' // 引入根组件

const app = createApp(App) // 创建 Vue 应用实例
const pinia = createPinia() // 创建 Pinia 实例

app.use(pinia) // 将 Pinia 注册到 Vue 应用中
app.mount('#app') // 挂载到 DOM
```

> **原理**：`app.use(pinia)` 会将 Pinia 实例注入到 Vue 应用中，这样所有组件都可以使用 `useXxxStore()` 访问 store。

### 2. 定义 Store（选项式写法）

```typescript
// stores/counter.ts
import { defineStore } from 'pinia' // 引入 defineStore 函数

// 使用选项式写法定义 store
export const useCounterStore = defineStore('counter', {
  // state：存储数据的地方
  state: () => ({
    count: 0, // 计数器初始值为 0
    name: '计数器', // 计数器名称
  }),

  // getters：基于 state 的计算属性
  getters: {
    // 接收 state 作为参数，返回计算结果
    doubleCount: (state) => state.count * 2, // 双倍计数

    // 使用 this 访问 state（注意：需要返回类型注解）
    countPlusOne(): number {
      return this.count + 1 // 计数加一
    },
  },

  // actions：修改 state 的方法
  actions: {
    // 同步操作
    increment() {
      this.count++ // 计数加 1
    },
    decrement() {
      this.count-- // 计数减 1
    },

    // 异步操作（支持 async/await）
    async fetchCount() {
      const response = await fetch('/api/count') // 发起网络请求
      const data = await response.json() // 解析 JSON 响应
      this.count = data.count // 更新 state
    },
  },
})
```

### 3. 定义 Store（组合式写法 - 推荐）

```typescript
// stores/counter.ts
import { defineStore } from 'pinia' // 引入 defineStore 函数
import { ref, computed } from 'vue' // 引入 Vue 组合式 API

// 使用组合式写法定义 store（推荐）
export const useCounterStoreSetup = defineStore('counter-setup', () => {
  // state：使用 ref 定义响应式数据
  const count = ref(0) // 计数器初始值为 0
  const name = ref('计数器') // 计数器名称

  // getters：使用 computed 定义计算属性
  const doubleCount = computed(() => count.value * 2) // 双倍计数
  const countPlusOne = computed(() => count.value + 1) // 计数加一

  // actions：普通函数
  const increment = () => count.value++ // 计数加 1
  const decrement = () => count.value-- // 计数减 1

  // 异步操作
  const fetchCount = async () => {
    const response = await fetch('/api/count') // 发起网络请求
    const data = await response.json() // 解析 JSON 响应
    count.value = data.count // 更新 state
  }

  // 必须返回要暴露的内容
  return {
    count, // state
    name, // state
    doubleCount, // getter
    countPlusOne, // getter
    increment, // action
    decrement, // action
    fetchCount, // action
  }
})
```

> **为什么推荐组合式写法？**
>
> - 代码组织更灵活，可以按功能逻辑分组
> - 可以使用任何组合式 API（watch、watchEffect 等）
> - TypeScript 类型推导更好
> - 更符合 Vue 3 的 setup 语法风格

### 4. 在组件中使用 Store

```vue
<script setup lang="ts">
import { useCounterStore } from './stores/counter' // 引入 store
import { storeToRefs } from 'pinia' // 引入 storeToRefs 工具函数

// 获取 store 实例
const counterStore = useCounterStore()

// ❌ 错误：直接解构会丢失响应式
// const { count, doubleCount } = counterStore

// ✅ 正确：使用 storeToRefs 保持响应式
const { count, doubleCount } = storeToRefs(counterStore)

// ✅ 方法可以直接解构，不需要 storeToRefs
const { increment, decrement } = counterStore
</script>

<template>
  <div>
    <!-- 直接访问 store 属性 -->
    <h2>{{ counterStore.name }}</h2>

    <!-- 使用解构后的响应式数据 -->
    <p>计数：{{ count }}</p>
    <p>双倍：{{ doubleCount }}</p>

    <!-- 调用 store 方法 -->
    <button @click="increment">+1</button>
    <button @click="decrement">-1</button>
    <button @click="counterStore.fetchCount">从服务器获取</button>
  </div>
</template>
```

> **重要**：解构 state 和 getters 时必须使用 `storeToRefs`，否则会丢失响应式。方法不需要，因为它们不是响应式的。

### 5. 修改 State 的四种方式

```vue
<script setup lang="ts">
import { useCounterStore } from './stores/counter' // 引入 store

const counterStore = useCounterStore() // 获取 store 实例

// 方式 1：直接修改（最简单）
const method1 = () => {
  counterStore.count++ // 直接修改 state 属性
}

// 方式 2：使用 $patch 对象（适合修改多个属性）
const method2 = () => {
  counterStore.$patch({
    count: 100, // 批量修改 count
    name: '新名称', // 批量修改 name
  })
}

// 方式 3：使用 $patch 函数（适合复杂逻辑，特别是数组操作）
const method3 = () => {
  counterStore.$patch((state) => {
    state.count++ // 修改 count
    state.name = '修改后的名称' // 修改 name
  })
}

// 方式 4：替换整个 state（适合重置）
const method4 = () => {
  counterStore.$state = {
    count: 0, // 重置 count
    name: '重置', // 重置 name
  }
}
</script>
```

> **选择建议**：
>
> - 修改单个属性：方式 1（直接修改）
> - 修改多个属性：方式 2（$patch 对象）
> - 复杂逻辑（如数组增删）：方式 3（$patch 函数）
> - 重置状态：方式 4（替换 $state）

### 6. 实际案例：用户 Store

```typescript
// stores/user.ts
import { defineStore } from 'pinia' // 引入 defineStore
import { ref, computed } from 'vue' // 引入组合式 API

// 定义用户类型接口
interface User {
  id: number // 用户 ID
  username: string // 用户名
  email: string // 邮箱
  role: string // 角色
}

// 定义用户 store
export const useUserStore = defineStore('user', () => {
  // state：存储用户信息和 token
  const user = ref<User | null>(null) // 用户信息，初始为 null
  const token = ref<string | null>(null) // 登录 token，初始为 null

  // getters：计算属性
  const isLoggedIn = computed(() => !!user.value && !!token.value) // 是否已登录
  const isAdmin = computed(() => user.value?.role === 'admin') // 是否是管理员
  const displayName = computed(() => user.value?.username || '访客') // 显示名称

  // actions：业务逻辑
  const login = async (username: string, password: string) => {
    try {
      // 发起登录请求
      const response = await fetch('/api/login', {
        method: 'POST', // POST 请求
        headers: { 'Content-Type': 'application/json' }, // 请求头
        body: JSON.stringify({ username, password }), // 请求体
      })

      // 检查响应状态
      if (!response.ok) {
        throw new Error('登录失败') // 抛出错误
      }

      // 解析响应数据
      const data = await response.json()
      user.value = data.user // 保存用户信息
      token.value = data.token // 保存 token

      // 保存到 localStorage（持久化）
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
    } catch (error) {
      console.error('登录失败：', error)
      throw error // 重新抛出错误
    }
  }

  // 退出登录
  const logout = () => {
    user.value = null // 清空用户信息
    token.value = null // 清空 token
    localStorage.removeItem('token') // 移除 localStorage
    localStorage.removeItem('user') // 移除 localStorage
  }

  // 从 localStorage 加载（页面刷新时恢复登录状态）
  const loadFromStorage = () => {
    const storedToken = localStorage.getItem('token') // 读取 token
    const storedUser = localStorage.getItem('user') // 读取用户信息

    if (storedToken && storedUser) {
      token.value = storedToken // 恢复 token
      user.value = JSON.parse(storedUser) // 恢复用户信息
    }
  }

  return {
    user, // state
    token, // state
    isLoggedIn, // getter
    isAdmin, // getter
    displayName, // getter
    login, // action
    logout, // action
    loadFromStorage, // action
  }
})
```

```vue
<!-- 在组件中使用 -->
<script setup lang="ts">
import { useUserStore } from './stores/user' // 引入 store
import { storeToRefs } from 'pinia' // 引入工具函数
import { ref } from 'vue' // 引入 ref

// 获取 store 实例
const userStore = useUserStore()

// 解构响应式数据
const { isLoggedIn, displayName, isAdmin } = storeToRefs(userStore)

// 本地状态：登录表单
const username = ref('') // 用户名输入框
const password = ref('') // 密码输入框

// 处理登录
const handleLogin = async () => {
  try {
    await userStore.login(username.value, password.value) // 调用 store 方法
    alert('登录成功')
  } catch (error) {
    alert('登录失败')
  }
}

// 处理退出
const handleLogout = () => {
  userStore.logout() // 调用 store 方法
}
</script>

<template>
  <div>
    <!-- 已登录状态 -->
    <div v-if="isLoggedIn">
      <p>欢迎，{{ displayName }}</p>
      <p v-if="isAdmin">您是管理员</p>
      <button @click="handleLogout">退出登录</button>
    </div>

    <!-- 未登录状态 -->
    <div v-else>
      <input v-model="username" placeholder="用户名" />
      <input v-model="password" type="password" placeholder="密码" />
      <button @click="handleLogin">登录</button>
    </div>
  </div>
</template>
```

### 7. Store 之间通信

```typescript
// stores/cart.ts
import { defineStore } from 'pinia' // 引入 defineStore
import { ref, computed } from 'vue' // 引入组合式 API
import { useUserStore } from './user' // 引入其他 store

// 定义购物车项类型
interface CartItem {
  id: number // 商品 ID
  name: string // 商品名称
  price: number // 商品价格
  quantity: number // 数量
}

// 定义购物车 store
export const useCartStore = defineStore('cart', () => {
  // state：购物车商品列表
  const items = ref<CartItem[]>([])

  // getters：计算总价
  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
  )

  // getters：计算商品总数
  const itemCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))

  // actions：添加商品
  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    // 查找是否已存在
    const existing = items.value.find((i) => i.id === item.id)
    if (existing) {
      existing.quantity++ // 已存在则数量加 1
    } else {
      items.value.push({ ...item, quantity: 1 }) // 不存在则添加新项
    }
  }

  // actions：结账
  const checkout = async () => {
    // 在 action 中使用其他 store
    const userStore = useUserStore()

    // 检查是否登录
    if (!userStore.isLoggedIn) {
      throw new Error('请先登录')
    }

    // 提交订单
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userStore.token}`, // 使用其他 store 的数据
      },
      body: JSON.stringify({ items: items.value }),
    })

    if (!response.ok) {
      throw new Error('结账失败')
    }

    // 清空购物车
    items.value = []
  }

  return {
    items, // state
    totalPrice, // getter
    itemCount, // getter
    addItem, // action
    checkout, // action
  }
})
```

> **原理**：在 action 中调用 `useXxxStore()` 就可以访问其他 store。Pinia 会自动处理依赖关系。

### 8. Store 持久化插件

默认情况下，store 的数据在页面刷新后会丢失。使用 `pinia-plugin-persistedstate` 可以自动保存到 localStorage。

首先安装插件：

```bash
npm install pinia-plugin-persistedstate
```

然后在 main.ts 中注册：

```typescript
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate' // 引入插件
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia() // 创建 Pinia 实例

pinia.use(piniaPluginPersistedstate) // 注册插件

app.use(pinia)
app.mount('#app')
```

定义 store 时启用持久化：

```typescript
// stores/settings.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

// 简单用法：自动持久化到 localStorage
export const useSettingsStore = defineStore(
  'settings',
  () => {
    const theme = ref('light') // 主题
    const language = ref('zh-CN') // 语言
    const fontSize = ref(14) // 字体大小

    return {
      theme,
      language,
      fontSize,
    }
  },
  {
    persist: true, // 启用持久化
  },
)

// 高级用法：自定义持久化配置
export const useSettingsStoreCustom = defineStore(
  'settings-custom',
  () => {
    const theme = ref('light') // 主题
    const language = ref('zh-CN') // 语言

    return { theme, language }
  },
  {
    persist: {
      key: 'my-settings', // 自定义 storage key
      storage: localStorage, // 存储方式（默认 localStorage）
      paths: ['theme'], // 只持久化部分字段
    },
  },
)
```

> **原理**：插件会在 state 变化时自动保存到 localStorage，页面加载时自动恢复。

### 9. 组合式函数封装

将 store 的使用封装成组合式函数，可以让代码更简洁：

```typescript
// composables/useCart.ts
import { useCartStore } from '../stores/cart' // 引入 store
import { storeToRefs } from 'pinia' // 引入工具函数

// 封装组合式函数
export function useCart() {
  const cartStore = useCartStore() // 获取 store 实例

  // 解构响应式数据
  const { items, totalPrice, itemCount } = storeToRefs(cartStore)

  // 解构方法
  const { addItem, checkout } = cartStore

  return {
    items, // state
    totalPrice, // getter
    itemCount, // getter
    addItem, // action
    checkout, // action
  }
}
```

```vue
<!-- 使用组合式函数 -->
<script setup lang="ts">
import { useCart } from './composables/useCart' // 引入组合式函数

// 直接解构使用
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

> **好处**：封装后，组件不需要知道 store 的细节，代码更简洁、更易维护。

---

## 14.4 核心知识点总结

| 知识点     | 说明                                                  | 示例                                             |
| ---------- | ----------------------------------------------------- | ------------------------------------------------ |
| Store 定义 | 使用 `defineStore` 定义，支持选项式和组合式           | `defineStore('id', () => {...})`                 |
| State      | 响应式状态，使用 `ref` 或 `reactive`                  | `const count = ref(0)`                           |
| Getters    | 计算属性，使用 `computed`，有缓存                     | `const double = computed(() => count.value * 2)` |
| Actions    | 业务逻辑，支持异步，可修改 state                      | `const increment = () => count.value++`          |
| State 修改 | 直接修改、`$patch` 对象、`$patch` 函数、替换 `$state` | `store.count++` 或 `store.$patch({...})`         |
| Store 通信 | 在 action 中调用其他 store                            | `const userStore = useUserStore()`               |
| 持久化     | 使用 `pinia-plugin-persistedstate` 插件               | `persist: true`                                  |
| DevTools   | 支持时间旅行、状态检查、导出导入                      | Vue DevTools 扩展                                |

---

## 14.5 新手常见误区

### 误区 1：解构 state 时不用 storeToRefs

**❌ 错误写法**：

```typescript
const store = useCounterStore()
const { count } = store // 解构后 count 失去响应式
count++ // 修改 count，但 store.count 不会更新
```

**问题**：直接解构会丢失响应式，`count` 变成普通值，不再是 ref。

**✅ 正确写法**：

```typescript
const store = useCounterStore()
const { count } = storeToRefs(store) // 使用 storeToRefs 保持响应式
count.value++ // 修改 count，store.count 也会更新
```

> **原理**：`storeToRefs` 会将 store 中的 ref 和 reactive 属性转换为 refs，保持响应式连接。

### 误区 2：在 getter 中修改 state

**❌ 错误写法**：

```typescript
const useStore = defineStore('store', () => {
  const count = ref(0)

  // 错误：getter 不应该修改 state
  const doubleCount = computed(() => {
    count.value++ // 副作用！
    return count.value * 2
  })

  return { count, doubleCount }
})
```

**问题**：getter 应该是纯函数，只负责计算，不应该有副作用。

**✅ 正确写法**：

```typescript
const useStore = defineStore('store', () => {
  const count = ref(0)

  // 正确：getter 只计算，不修改 state
  const doubleCount = computed(() => count.value * 2)

  // 修改 state 应该放在 action 中
  const increment = () => count.value++

  return { count, doubleCount, increment }
})
```

> **原则**：getter 是只读的，action 才能修改 state。

### 误区 3：忘记在 main.ts 中注册 Pinia

**❌ 错误写法**：

```typescript
// main.ts
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
// 忘记注册 Pinia
app.mount('#app')

// 组件中使用
const store = useCounterStore() // 报错：getActivePinia was called with no active Pinia
```

**✅ 正确写法**：

```typescript
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia) // 必须先注册
app.mount('#app')
```

> **原因**：Pinia 实例需要注入到 Vue 应用中，否则 `useXxxStore()` 无法找到 Pinia 实例。

### 误区 4：在组件外部调用 useStore

**❌ 错误写法**：

```typescript
// 错误：在组件外部调用
const store = useCounterStore() // 报错：getActivePinia was called with no active Pinia

export default {
  setup() {
    // ...
  },
}
```

**✅ 正确写法**：

```typescript
// 正确：在 setup 中调用
export default {
  setup() {
    const store = useCounterStore() // 在 setup 内部调用
    return { store }
  }
}

// 或者使用 <script setup>
<script setup>
const store = useCounterStore() // 在 <script setup> 中调用
</script>
```

> **原因**：`useXxxStore()` 必须在 setup 上下文中调用，因为它需要访问当前组件的实例。

### 误区 5：所有数据都放在 Store 中

**❌ 错误做法**：

```typescript
// 错误：表单输入框的值也放在 store 中
const useStore = defineStore('form', () => {
  const username = ref('') // 只是临时输入
  const password = ref('') // 只是临时输入
  const showDialog = ref(false) // 只是 UI 状态

  return { username, password, showDialog }
})
```

**✅ 正确做法**：

```typescript
// 正确：只放真正需要全局共享的数据
const useUserStore = defineStore('user', () => {
  const user = ref(null) // 用户信息需要全局共享
  const token = ref(null) // token 需要全局共享

  return { user, token }
})

// 临时数据放在组件本地
<script setup>
import { ref } from 'vue'
const username = ref('') // 组件本地状态
const showDialog = ref(false) // 组件本地状态
</script>
```

> **原则**：只有真正需要跨组件共享的数据才放在 store，临时数据用组件本地状态。

---

## 14.6 动手练习

### 练习 1：基础练习 - 创建计数器 Store

创建一个计数器 store，包含：

- state：`count`（初始值 0）
- getter：`doubleCount`（双倍计数）
- actions：`increment`（加 1）、`decrement`（减 1）、`reset`（重置）

在组件中使用这个 store，显示计数、双倍计数，并提供按钮操作。

<details>
<summary>点击查看答案</summary>

```typescript
// stores/counter.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  // state
  const count = ref(0)

  // getters
  const doubleCount = computed(() => count.value * 2)

  // actions
  const increment = () => count.value++
  const decrement = () => count.value--
  const reset = () => (count.value = 0)

  return {
    count,
    doubleCount,
    increment,
    decrement,
    reset,
  }
})
```

```vue
<!-- Counter.vue -->
<script setup lang="ts">
import { useCounterStore } from './stores/counter'
import { storeToRefs } from 'pinia'

const counterStore = useCounterStore()
const { count, doubleCount } = storeToRefs(counterStore)
const { increment, decrement, reset } = counterStore
</script>

<template>
  <div>
    <h2>计数器</h2>
    <p>当前计数：{{ count }}</p>
    <p>双倍计数：{{ doubleCount }}</p>
    <button @click="increment">+1</button>
    <button @click="decrement">-1</button>
    <button @click="reset">重置</button>
  </div>
</template>
```

</details>

### 练习 2：进阶练习 - 待办事项 Store

创建一个待办事项 store，包含：

- state：`todos`（待办列表，每项包含 id、text、done）
- getter：`activeTodos`（未完成的待办）、`completedTodos`（已完成的待办）
- actions：`addTodo`（添加）、`toggleTodo`（切换完成状态）、`removeTodo`（删除）

使用 `$patch` 方法实现批量操作。

<details>
<summary>点击查看答案</summary>

```typescript
// stores/todo.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Todo {
  id: number
  text: string
  done: boolean
}

export const useTodoStore = defineStore('todo', () => {
  // state
  const todos = ref<Todo[]>([])
  let nextId = 1

  // getters
  const activeTodos = computed(() => todos.value.filter((todo) => !todo.done))
  const completedTodos = computed(() => todos.value.filter((todo) => todo.done))

  // actions
  const addTodo = (text: string) => {
    todos.value.push({
      id: nextId++,
      text,
      done: false,
    })
  }

  const toggleTodo = (id: number) => {
    const todo = todos.value.find((t) => t.id === id)
    if (todo) {
      todo.done = !todo.done
    }
  }

  const removeTodo = (id: number) => {
    const index = todos.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      todos.value.splice(index, 1)
    }
  }

  // 批量操作示例
  const completeAll = () => {
    todos.value.forEach((todo) => {
      todo.done = true
    })
  }

  const clearCompleted = () => {
    todos.value = todos.value.filter((todo) => !todo.done)
  }

  return {
    todos,
    activeTodos,
    completedTodos,
    addTodo,
    toggleTodo,
    removeTodo,
    completeAll,
    clearCompleted,
  }
})
```

```vue
<!-- TodoList.vue -->
<script setup lang="ts">
import { useTodoStore } from './stores/todo'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

const todoStore = useTodoStore()
const { todos, activeTodos, completedTodos } = storeToRefs(todoStore)
const { addTodo, toggleTodo, removeTodo, completeAll, clearCompleted } = todoStore

const newTodoText = ref('')

const addNewTodo = () => {
  if (newTodoText.value.trim()) {
    addTodo(newTodoText.value)
    newTodoText.value = ''
  }
}
</script>

<template>
  <div>
    <h2>待办事项</h2>

    <!-- 添加待办 -->
    <input v-model="newTodoText" @keyup.enter="addNewTodo" placeholder="输入待办事项" />
    <button @click="addNewTodo">添加</button>

    <!-- 待办列表 -->
    <ul>
      <li v-for="todo in todos" :key="todo.id">
        <input type="checkbox" :checked="todo.done" @change="toggleTodo(todo.id)" />
        <span :style="{ textDecoration: todo.done ? 'line-through' : 'none' }">
          {{ todo.text }}
        </span>
        <button @click="removeTodo(todo.id)">删除</button>
      </li>
    </ul>

    <!-- 统计信息 -->
    <p>未完成：{{ activeTodos.length }}</p>
    <p>已完成：{{ completedTodos.length }}</p>

    <!-- 批量操作 -->
    <button @click="completeAll">全部完成</button>
    <button @click="clearCompleted">清除已完成</button>
  </div>
</template>
```

</details>

### 练习 3（挑战）：综合练习 - 购物车系统

创建一个完整的购物车系统，包含：

- 用户 store：管理用户登录状态
- 商品 store：管理商品列表
- 购物车 store：管理购物车，包含添加商品、计算总价、结账功能
- 购物车 store 需要访问用户 store 检查登录状态

实现：

1. 用户登录/退出功能
2. 商品列表展示
3. 添加到购物车
4. 购物车页面显示商品、数量、总价
5. 结账功能（需要登录）

<details>
<summary>点击查看答案</summary>

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref<{ id: number; name: string } | null>(null)
  const isLoggedIn = computed(() => !!user.value)

  const login = (name: string) => {
    user.value = { id: Date.now(), name }
  }

  const logout = () => {
    user.value = null
  }

  return { user, isLoggedIn, login, logout }
})
```

```typescript
// stores/product.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

interface Product {
  id: number
  name: string
  price: number
  stock: number
}

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([
    { id: 1, name: 'Vue 3 实战', price: 99, stock: 10 },
    { id: 2, name: 'Pinia 入门', price: 59, stock: 20 },
    { id: 3, name: 'TypeScript 进阶', price: 79, stock: 15 },
  ])

  return { products }
})
```

```typescript
// stores/cart.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user'

interface CartItem {
  productId: number
  name: string
  price: number
  quantity: number
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
  )

  const itemCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))

  const addItem = (product: { id: number; name: string; price: number }) => {
    const existing = items.value.find((item) => item.productId === product.id)
    if (existing) {
      existing.quantity++
    } else {
      items.value.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
      })
    }
  }

  const removeItem = (productId: number) => {
    const index = items.value.findIndex((item) => item.productId === productId)
    if (index !== -1) {
      items.value.splice(index, 1)
    }
  }

  const checkout = () => {
    const userStore = useUserStore()

    if (!userStore.isLoggedIn) {
      throw new Error('请先登录')
    }

    if (items.value.length === 0) {
      throw new Error('购物车为空')
    }

    // 模拟结账
    console.log('结账成功，总价：', totalPrice.value)
    items.value = []

    return true
  }

  return {
    items,
    totalPrice,
    itemCount,
    addItem,
    removeItem,
    checkout,
  }
})
```

```vue
<!-- App.vue -->
<script setup lang="ts">
import { useUserStore } from './stores/user'
import { useProductStore } from './stores/product'
import { useCartStore } from './stores/cart'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

const userStore = useUserStore()
const productStore = useProductStore()
const cartStore = useCartStore()

const { isLoggedIn, user } = storeToRefs(userStore)
const { products } = storeToRefs(productStore)
const { items, totalPrice, itemCount } = storeToRefs(cartStore)

const username = ref('')

const handleLogin = () => {
  if (username.value.trim()) {
    userStore.login(username.value)
    username.value = ''
  }
}

const handleAddToCart = (product: any) => {
  cartStore.addItem(product)
}

const handleCheckout = () => {
  try {
    cartStore.checkout()
    alert('结账成功！')
  } catch (error: any) {
    alert(error.message)
  }
}
</script>

<template>
  <div>
    <!-- 用户区域 -->
    <div v-if="isLoggedIn">
      <p>欢迎，{{ user?.name }}</p>
      <button @click="userStore.logout()">退出</button>
    </div>
    <div v-else>
      <input v-model="username" placeholder="用户名" />
      <button @click="handleLogin">登录</button>
    </div>

    <hr />

    <!-- 商品列表 -->
    <h2>商品列表</h2>
    <div v-for="product in products" :key="product.id">
      <span>{{ product.name }} - ¥{{ product.price }}</span>
      <button @click="handleAddToCart(product)">加入购物车</button>
    </div>

    <hr />

    <!-- 购物车 -->
    <h2>购物车（{{ itemCount }} 件商品）</h2>
    <div v-for="item in items" :key="item.productId">
      <span>{{ item.name }} x {{ item.quantity }} - ¥{{ item.price * item.quantity }}</span>
      <button @click="cartStore.removeItem(item.productId)">移除</button>
    </div>
    <p>总价：¥{{ totalPrice }}</p>
    <button @click="handleCheckout">结账</button>
  </div>
</template>
```

</details>

---

## 下一章预告

恭喜你完成了 Pinia 状态管理的学习！现在你已经能够优雅地管理 Vue 应用的全局状态了。

下一章我们会学习 **Teleport 与 Suspense**——Vue 3 的两个强大特性。你会学到：

- 如何使用 Teleport 将组件"传送"到 DOM 的任何位置（比如模态框）
- 如何使用 Suspense 处理异步组件的加载状态
- 这两个特性如何让组件开发更灵活

准备好了吗？让我们继续 Vue 3 的进阶之旅！
