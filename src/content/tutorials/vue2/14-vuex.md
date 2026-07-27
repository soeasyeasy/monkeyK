---
title: "第十四章：Vuex 状态管理"
description: "学习 Vue 2 中的状态管理库 Vuex，掌握 state、getters、mutations、actions、modules 的使用。"
---

# 第十四章：Vuex 状态管理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 组件之间传递数据太麻烦了，有没有更好的方式？
- 为什么需要 Vuex？直接用 props 和 events 不行吗？
- state、getters、mutations、actions 这么多概念，到底该怎么用？
- 项目多大的时候才需要用 Vuex？

这一章就是为了解答这些问题。我们会先搞清楚 **为什么需要状态管理**，再学习 Vuex 的核心概念，最后动手实现一个完整的 Todo 应用。学完这一章，你就能轻松管理大型应用中的共享数据了。

---

## 14.1 为什么需要 Vuex？

### 痛点分析

想象一下这个场景：你正在开发一个电商网站，有购物车功能。

```vue
<!-- 商品列表页 -->
<template>
  <div>
    <button @click="addToCart(product)">加入购物车</button>
  </div>
</template>

<script>
export default {
  methods: {
    addToCart(product) {
      // 问题：购物车数据存在哪里？
      // 如果存在当前组件，其他组件访问不到
      this.cart.push(product)
    }
  }
}
</script>
```

```vue
<!-- 购物车页面 -->
<template>
  <div>
    <!-- 问题：如何获取购物车数据？ -->
    <p>购物车有 {{ cart.length }} 件商品</p>
  </div>
</template>
```

**没有 Vuex 时的问题：**

1. **数据传递复杂**：需要用 props 一层层传递，或者用 EventBus 跨组件通信
2. **数据同步困难**：多个组件修改同一份数据，很难追踪谁改了什么
3. **调试困难**：数据变化分散在各处，出 bug 时不知道从哪里查起

### 解决方案

Vuex 就像一个**全局的数据仓库**，所有组件都可以从这里取数据、改数据。

打个比方：

> 把 Vuex 想象成银行的保险柜。你把钱（数据）存到保险柜（store）里，任何时候、任何地方（任何组件）都可以去取。而且每次取钱都要登记（mutations），这样就能追踪谁在什么时候取了多少钱。

```javascript
// 使用 Vuex 后
// store/index.js
export default new Vuex.Store({
  state: {
    cart: [] // 购物车数据存在这里，所有组件都能访问
  },
  mutations: {
    ADD_TO_CART(state, product) {
      state.cart.push(product) // 统一在这里修改数据
    }
  }
})
```

```vue
<!-- 商品列表页 -->
<script>
export default {
  methods: {
    addToCart(product) {
      // 直接提交 mutation，修改全局状态
      this.$store.commit('ADD_TO_CART', product)
    }
  }
}
</script>
```

```vue
<!-- 购物车页面 -->
<template>
  <p>购物车有 {{ cart.length }} 件商品</p>
</template>

<script>
export default {
  computed: {
    cart() {
      // 直接从 store 读取数据
      return this.$store.state.cart
    }
  }
}
</script>
```

> **一句话总结**：Vuex 把数据集中管理，让数据流动变得可预测、可追踪。

---

## 14.2 核心原理

### 核心概念

Vuex 有 5 个核心概念，我们用"餐厅"来类比：

| 概念 | 作用 | 类比 |
|------|------|------|
| **state** | 存储数据 | 餐厅的仓库（存放食材） |
| **getters** | 计算属性 | 厨师（把食材加工成菜品） |
| **mutations** | 同步修改数据 | 仓库管理员（只能同步操作） |
| **actions** | 异步操作 | 采购员（可以外出采购，异步操作） |
| **modules** | 模块化 | 不同区域的仓库（蔬菜库、肉类库） |

### 数据流向

Vuex 的数据流向是**单向的**，这很重要：

```
组件 → dispatch action → commit mutation → 修改 state → 视图更新
```

打个比方：

> 你想改仓库里的数据，不能直接改，必须走流程：先找采购员（action），采购员通知仓库管理员（mutation），管理员才能改仓库（state）。这样每次改动都有记录，出了问题能追溯。

### 为什么 mutation 必须是同步的？

这是一个重要的设计决策：

```javascript
// ❌ 错误：在 mutation 中做异步操作
mutations: {
  fetchData(state) {
    setTimeout(() => {
      state.data = 'xxx' // 这样 DevTools 追踪不到
    }, 1000)
  }
}

// ✅ 正确：异步操作放在 action 中
actions: {
  async fetchData({ commit }) {
    const data = await api.getData() // 异步操作
    commit('SET_DATA', data) // 同步修改 state
  }
}
```

**为什么？** 因为 Vue DevTools 需要追踪每次 state 变化。如果 mutation 是异步的，DevTools 就不知道数据是什么时候变的，调试就乱了。

---

## 14.3 基础用法

### 安装和配置

```bash
# 安装 Vuex 3（Vue 2 对应版本）
npm install vuex@3
```

```javascript
// store/index.js
import Vue from 'vue' // 引入 Vue
import Vuex from 'vuex' // 引入 Vuex

Vue.use(Vuex) // 注册 Vuex 插件，让 Vue 知道如何使用 Vuex

// 创建 store 实例并导出
export default new Vuex.Store({
  // state：存储数据的地方
  state: {
    count: 0, // 计数器
    user: null // 用户信息
  },
  
  // getters：计算属性，类似组件的 computed
  getters: {
    // 接收 state 作为参数，返回计算后的值
    doubleCount: state => state.count * 2, // 返回 count 的两倍
    
    // 可以接收其他 getter 作为第二个参数
    countInfo: (state, getters) => `当前计数：${getters.doubleCount}`
  },
  
  // mutations：同步修改 state 的方法
  mutations: {
    // 第一个参数是 state，后续参数是 payload（载荷）
    increment(state) {
      state.count++ // 同步修改 count
    },
    
    // 带参数的 mutation
    incrementBy(state, amount) {
      state.count += amount // 增加指定的数量
    },
    
    // 修改用户信息
    setUser(state, user) {
      state.user = user // 设置用户对象
    }
  },
  
  // actions：处理异步操作
  actions: {
    // 接收 context 对象（包含 commit、dispatch 等方法）
    asyncLogin({ commit }, credentials) {
      // 模拟异步 API 调用
      return api.login(credentials).then(user => {
        commit('setUser', user) // 异步操作完成后，提交 mutation
      })
    }
  }
})
```

```javascript
// main.js
import Vue from 'vue' // 引入 Vue
import App from './App.vue' // 引入根组件
import store from './store' // 引入 store

// 创建 Vue 实例时注入 store
new Vue({
  store, // 这样所有子组件都能通过 this.$store 访问 store
  render: h => h(App) // 渲染函数
}).$mount('#app') // 挂载到 #app 元素
```

### 在组件中使用 State

```vue
<template>
  <div>
    <!-- 方式一：直接访问（不推荐，每次都要写 $store.state） -->
    <p>{{ $store.state.count }}</p>
    
    <!-- 方式二：计算属性（推荐，代码更简洁） -->
    <p>{{ count }}</p>
    
    <!-- 方式三：mapState 辅助函数（推荐，适合多个状态） -->
    <p>{{ count }}</p>
    <p>{{ user }}</p>
  </div>
</template>

<script>
import { mapState } from 'vuex' // 引入 mapState

export default {
  computed: {
    // 方式二：手动映射
    count() {
      return this.$store.state.count // 返回 store 中的 count
    },
    
    // 方式三：使用 mapState（数组写法）
    ...mapState(['count', 'user']), // 等价于上面的写法
    
    // mapState（对象写法，可以重命名）
    ...mapState({
      myCount: 'count', // 把 state.count 映射为 this.myCount
      userName: state => state.user.name // 使用箭头函数访问嵌套属性
    }),
    
    // 带命名空间的模块
    ...mapState('moduleA', ['count']) // 访问 moduleA 模块的 count
  }
}
</script>
```

### 在组件中使用 Getters

```javascript
// store/index.js
export default new Vuex.Store({
  state: {
    todos: [
      { id: 1, text: '学习 Vue', done: true },
      { id: 2, text: '学习 Vuex', done: false },
      { id: 3, text: '学习 Vue Router', done: true }
    ]
  },
  getters: {
    // 基础 getter：返回已完成的 todos
    doneTodos: state => {
      return state.todos.filter(todo => todo.done) // 过滤出 done 为 true 的项
    },
    
    // getter 可以接收其他 getter
    doneTodosCount: (state, getters) => {
      return getters.doneTodos.length // 返回已完成 todos 的数量
    },
    
    // 返回函数：支持传参（注意：这种方式不会缓存）
    getTodoById: state => id => {
      return state.todos.find(todo => todo.id === id) // 根据 id 查找 todo
    }
  }
})
```

```vue
<script>
import { mapGetters } from 'vuex' // 引入 mapGetters

export default {
  computed: {
    // 方式一：手动访问
    doneTodosCount() {
      return this.$store.getters.doneTodosCount // 访问 getter
    },
    
    // 方式二：mapGetters（数组写法）
    ...mapGetters(['doneTodos', 'doneTodosCount']),
    
    // mapGetters（对象写法，可以重命名）
    ...mapGetters({
      finishedCount: 'doneTodosCount' // 重命名为 finishedCount
    })
  },
  methods: {
    showTodo() {
      // 调用带参数的 getter
      const todo = this.$store.getters.getTodoById(1)
      console.log(todo) // { id: 1, text: '学习 Vue', done: true }
    }
  }
}
</script>
```

### 在组件中使用 Mutations

```javascript
// store/index.js
export default new Vuex.Store({
  state: {
    count: 0,
    user: null
  },
  mutations: {
    // 基础 mutation
    increment(state) {
      state.count++ // 同步修改 count
    },
    
    // 带参数（payload）
    incrementBy(state, amount) {
      state.count += amount // 增加指定的数量
    },
    
    // payload 是对象（推荐，更清晰）
    incrementByObject(state, payload) {
      state.count += payload.amount // 从对象中取值
    },
    
    // 修改对象属性
    updateUser(state, payload) {
      // 使用对象展开运算符合并更新
      state.user = {
        ...state.user, // 保留原有属性
        ...payload // 覆盖新属性
      }
    }
  }
})
```

```vue
<script>
import { mapMutations } from 'vuex' // 引入 mapMutations

export default {
  methods: {
    // 方式一：直接提交（使用字符串事件名）
    increment() {
      this.$store.commit('increment') // 提交 increment mutation
    },
    
    // 带参数
    incrementBy() {
      this.$store.commit('incrementBy', 10) // 传递 payload
    },
    
    // 对象风格的提交（推荐）
    incrementByObject() {
      this.$store.commit('incrementByObject', { amount: 10 }) // 传递对象
    },
    
    // 方式二：mapMutations（数组写法）
    ...mapMutations(['increment', 'incrementBy']), // 映射为同名方法
    
    // mapMutations（对象写法，可以重命名）
    ...mapMutations({
      add: 'increment', // 把 this.add() 映射为 commit('increment')
      addBy: 'incrementBy' // 把 this.addBy() 映射为 commit('incrementBy')
    })
  }
}
</script>
```

::: warning ⚠️ 重要提醒
**Mutations 必须是同步函数！** 不要在 mutation 中执行异步操作（如 API 调用、setTimeout 等）。异步操作应该放在 actions 中。
:::

### 在组件中使用 Actions

```javascript
// store/index.js
export default new Vuex.Store({
  state: {
    user: null,
    loading: false,
    error: null
  },
  mutations: {
    setUser(state, user) {
      state.user = user // 设置用户信息
    },
    setLoading(state, loading) {
      state.loading = loading // 设置加载状态
    },
    setError(state, error) {
      state.error = error // 设置错误信息
    }
  },
  actions: {
    // 基础 action：接收 context 对象
    async login({ commit }, credentials) {
      commit('setLoading', true) // 设置加载状态为 true
      commit('setError', null) // 清空之前的错误
      
      try {
        // 模拟异步 API 调用
        const user = await api.login(credentials)
        commit('setUser', user) // 登录成功，设置用户信息
        return user // 返回用户信息（可选）
      } catch (error) {
        commit('setError', error.message) // 登录失败，设置错误信息
        throw error // 抛出错误让组件处理
      } finally {
        commit('setLoading', false) // 无论成功失败，都设置加载状态为 false
      }
    },
    
    // action 中可以调用其他 action
    async loginAndRedirect({ dispatch, commit }, credentials) {
      await dispatch('login', credentials) // 调用 login action
      router.push('/dashboard') // 登录成功后跳转
    },
    
    // 使用根级别的 action（在模块中）
    someAction({ rootCommit }) {
      rootCommit('someMutation') // 提交根级别的 mutation
    }
  }
})
```

```vue
<script>
import { mapActions } from 'vuex' // 引入 mapActions

export default {
  methods: {
    // 方式一：直接分发
    async login() {
      try {
        // 分发 action，传递参数
        await this.$store.dispatch('login', {
          username: 'admin',
          password: '123456'
        })
        console.log('登录成功')
      } catch (error) {
        console.error('登录失败', error)
      }
    },
    
    // 方式二：mapActions（数组写法）
    ...mapActions(['login']), // 映射为同名方法
    
    // mapActions（对象写法，可以重命名）
    ...mapActions({
      userLogin: 'login' // 把 this.userLogin() 映射为 dispatch('login')
    })
  }
}
</script>
```

---

## 14.4 进阶用法

### Modules 模块化

当应用变得复杂时，store 会变得很臃肿。Modules 让你可以把 store 分割成多个模块。

```javascript
// store/modules/user.js
export default {
  namespaced: true, // 开启命名空间（推荐）
  
  state: {
    profile: null, // 用户资料
    token: null // 登录令牌
  },
  
  getters: {
    // 模块内的 getter，第一个参数是模块的 state
    isLoggedIn: state => !!state.token, // 判断是否登录
    userName: state => state.profile?.name // 获取用户名
  },
  
  mutations: {
    setProfile(state, profile) {
      state.profile = profile // 设置用户资料
    },
    setToken(state, token) {
      state.token = token // 设置 token
    },
    clearUser(state) {
      state.profile = null // 清空用户资料
      state.token = null // 清空 token
    }
  },
  
  actions: {
    async fetchProfile({ commit }) {
      const profile = await api.getProfile() // 异步获取用户资料
      commit('setProfile', profile) // 提交 mutation
    },
    
    async logout({ commit }) {
      await api.logout() // 调用登出 API
      commit('clearUser') // 清空用户信息
    }
  }
}
```

```javascript
// store/modules/cart.js
export default {
  namespaced: true, // 开启命名空间
  
  state: {
    items: [] // 购物车商品列表
  },
  
  getters: {
    // 计算购物车总价
    totalPrice: state => {
      return state.items.reduce((total, item) => {
        return total + item.price * item.quantity // 累加每项的价格×数量
      }, 0)
    },
    
    // 计算商品总数
    totalItems: state => {
      return state.items.reduce((total, item) => {
        return total + item.quantity // 累加数量
      }, 0)
    }
  },
  
  mutations: {
    addItem(state, item) {
      state.items.push(item) // 添加商品
    },
    removeItem(state, index) {
      state.items.splice(index, 1) // 删除指定索引的商品
    },
    updateQuantity(state, { index, quantity }) {
      state.items[index].quantity = quantity // 更新商品数量
    },
    clearCart(state) {
      state.items = [] // 清空购物车
    }
  },
  
  actions: {
    async checkout({ state, commit }) {
      await api.checkout(state.items) // 提交订单
      commit('clearCart') // 清空购物车
    }
  }
}
```

```javascript
// store/index.js
import Vue from 'vue'
import Vuex from 'vuex'
import user from './modules/user' // 引入 user 模块
import cart from './modules/cart' // 引入 cart 模块

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    user, // 注册 user 模块
    cart // 注册 cart 模块
  },
  
  // 根级别的 state（不属于任何模块）
  state: {
    appName: '电商网站'
  },
  
  // 根级别的 getters
  getters: {
    appInfo: state => state.appName
  }
})
```

```vue
<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  computed: {
    // 访问模块 state（需要指定模块名）
    ...mapState('user', ['profile', 'token']),
    ...mapState('cart', ['items']),
    
    // 访问模块 getters
    ...mapGetters('user', ['isLoggedIn', 'userName']),
    ...mapGetters('cart', ['totalPrice', 'totalItems']),
    
    // 访问根级别 state（不需要模块名）
    ...mapState(['appName'])
  },
  
  methods: {
    // 调用模块 actions
    ...mapActions('user', ['fetchProfile', 'logout']),
    ...mapActions('cart', ['addItem', 'removeItem', 'checkout'])
  }
}
</script>
```

### 严格模式

严格模式下，直接修改 state 会抛出错误，强制你必须通过 mutation 修改。

```javascript
// store/index.js
export default new Vuex.Store({
  strict: true, // 开启严格模式（开发环境推荐开启）
  
  state: {
    count: 0
  },
  
  mutations: {
    increment(state) {
      state.count++ // ✅ 正确：通过 mutation 修改
    }
  }
})
```

```vue
<script>
export default {
  methods: {
    wrongWay() {
      // ❌ 错误：直接修改 state，严格模式下会报错
      this.$store.state.count++
    },
    
    rightWay() {
      // ✅ 正确：通过 mutation 修改
      this.$store.commit('increment')
    }
  }
}
</script>
```

::: tip 💡 提示
严格模式会性能损耗，**不要在生产环境开启**！可以用环境变量控制：

```javascript
export default new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production' // 只在开发环境开启
})
```
:::

### 插件开发

Vuex 插件是一个函数，接收 store 作为参数，可以在每次 mutation 后执行回调。

```javascript
// plugins/logger.js
export default function loggerPlugin(store) {
  // 订阅 mutation
  store.subscribe((mutation, state) => {
    console.log('Mutation 类型:', mutation.type) // 打印 mutation 名称
    console.log('Payload:', mutation.payload) // 打印传递的参数
    console.log('修改后的 state:', state) // 打印修改后的状态
  })
}
```

```javascript
// plugins/persist.js
export default function persistPlugin(store) {
  // 从 localStorage 恢复状态
  const savedState = localStorage.getItem('vuex-state')
  if (savedState) {
    store.replaceState(JSON.parse(savedState)) // 恢复状态
  }
  
  // 每次 mutation 后保存到 localStorage
  store.subscribe((mutation, state) => {
    localStorage.setItem('vuex-state', JSON.stringify(state)) // 保存状态
  })
}
```

```javascript
// store/index.js
import loggerPlugin from './plugins/logger'
import persistPlugin from './plugins/persist'

export default new Vuex.Store({
  plugins: [
    loggerPlugin, // 注册日志插件
    persistPlugin // 注册持久化插件
  ]
})
```

---

## 14.5 核心知识点总结

| 概念 | 作用 | 同步/异步 | 使用场景 |
|------|------|-----------|----------|
| **state** | 存储数据 | - | 存储应用的全局状态 |
| **getters** | 计算属性 | 同步 | 从 state 派生出一些状态（如过滤、计算） |
| **mutations** | 修改 state | 必须同步 | 同步修改 state 的唯一方式 |
| **actions** | 业务逻辑 | 可以异步 | 处理异步操作（API 调用等） |
| **modules** | 模块化 | - | 大型应用拆分 store |

### 辅助函数对比

| 辅助函数 | 映射到 | 使用场景 |
|----------|--------|----------|
| `mapState` | computed | 映射 state 到计算属性 |
| `mapGetters` | computed | 映射 getters 到计算属性 |
| `mapMutations` | methods | 映射 mutations 到方法 |
| `mapActions` | methods | 映射 actions 到方法 |

---

## 14.6 新手常见误区

### 误区 1：在 mutation 中执行异步操作

```javascript
// ❌ 错误：mutation 中做异步操作
mutations: {
  fetchData(state) {
    setTimeout(() => {
      state.data = 'xxx' // DevTools 无法追踪这个变化
    }, 1000)
  }
}

// ✅ 正确：异步操作放在 action 中
actions: {
  async fetchData({ commit }) {
    const data = await api.getData()
    commit('SET_DATA', data) // 在 action 中异步调用后，同步提交 mutation
  }
}
```

**为什么错？** Mutation 必须是同步的，这样 Vue DevTools 才能准确追踪每次状态变化。异步操作会导致调试困难。

### 误区 2：直接修改 state

```javascript
// ❌ 错误：直接修改 state
methods: {
  increment() {
    this.$store.state.count++ // 严格模式下会报错
  }
}

// ✅ 正确：通过 mutation 修改
methods: {
  increment() {
    this.$store.commit('increment') // 提交 mutation
  }
}
```

**为什么错？** 直接修改 state 绕过了 Vuex 的追踪机制，导致状态变化不可预测，调试困难。

### 误区 3：模块没有开启命名空间

```javascript
// ❌ 错误：没有开启命名空间
export default {
  // 没有 namespaced: true
  state: { count: 0 },
  mutations: {
    increment(state) { state.count++ }
  }
}

// 使用时会污染全局命名空间
this.$store.commit('increment') // 多个模块有同名 mutation 会冲突

// ✅ 正确：开启命名空间
export default {
  namespaced: true, // 开启命名空间
  state: { count: 0 },
  mutations: {
    increment(state) { state.count++ }
  }
}

// 使用时需要指定模块名
this.$store.commit('user/increment') // 明确指定模块
```

**为什么错？** 不开启命名空间，所有模块的 mutation、action、getter 都会注册到全局命名空间，容易产生命名冲突。

### 误区 4：在组件中直接修改模块的 state

```javascript
// ❌ 错误：直接修改模块 state
methods: {
  updateProfile() {
    this.$store.state.user.profile.name = 'new name' // 直接修改
  }
}

// ✅ 正确：通过模块的 mutation 修改
methods: {
  updateProfile() {
    this.$store.commit('user/SET_PROFILE', { name: 'new name' }) // 提交模块 mutation
  }
}
```

**为什么错？** 直接修改模块 state 违反了 Vuex 的数据流规范，状态变化不可追踪。

### 误区 5：过度使用 Vuex

```javascript
// ❌ 错误：什么数据都放 Vuex
state: {
  formData: {}, // 表单数据不应该放 Vuex
  uiState: {}, // UI 状态不应该放 Vuex
  tempData: {} // 临时数据不应该放 Vuex
}

// ✅ 正确：只有真正需要共享的状态才放 Vuex
state: {
  user: null, // 用户信息需要全局共享
  cart: [], // 购物车需要跨组件访问
  theme: 'light' // 主题需要全局控制
}
```

**为什么错？** Vuex 适合管理真正需要跨组件共享的状态。组件内部数据应该用 `data`，父子组件通信用 `props/emit`，不要过度使用 Vuex。

---

## 14.7 动手练习

### 练习 1：基础练习 - 计数器

创建一个简单的计数器应用，包含：
- 显示当前计数
- 增加按钮（+1）
- 减少按钮（-1）
- 重置按钮（归零）

<details>
<summary>点击查看答案</summary>

```javascript
// store/index.js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    count: 0 // 计数器状态
  },
  mutations: {
    INCREMENT(state) {
      state.count++ // 增加
    },
    DECREMENT(state) {
      state.count-- // 减少
    },
    RESET(state) {
      state.count = 0 // 重置
    }
  },
  actions: {
    increment({ commit }) {
      commit('INCREMENT')
    },
    decrement({ commit }) {
      commit('DECREMENT')
    },
    reset({ commit }) {
      commit('RESET')
    }
  }
})
```

```vue
<!-- Counter.vue -->
<template>
  <div>
    <h1>计数器：{{ count }}</h1>
    <button @click="increment">增加</button>
    <button @click="decrement">减少</button>
    <button @click="reset">重置</button>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  computed: {
    ...mapState(['count']) // 映射 state.count
  },
  methods: {
    ...mapActions(['increment', 'decrement', 'reset']) // 映射 actions
  }
}
</script>
```

</details>

### 练习 2：进阶练习 - Todo 列表

实现一个 Todo 列表，包含：
- 添加待办事项
- 标记完成/未完成
- 删除待办事项
- 显示已完成和未完成的数量

<details>
<summary>点击查看答案</summary>

```javascript
// store/index.js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    todos: [] // 待办事项列表
  },
  getters: {
    // 已完成的数量
    doneCount: state => state.todos.filter(todo => todo.done).length,
    // 未完成的数量
    activeCount: state => state.todos.filter(todo => !todo.done).length
  },
  mutations: {
    ADD_TODO(state, text) {
      state.todos.push({
        id: Date.now(), // 使用时间戳作为唯一 ID
        text,
        done: false // 默认未完成
      })
    },
    TOGGLE_TODO(state, id) {
      const todo = state.todos.find(t => t.id === id)
      if (todo) {
        todo.done = !todo.done // 切换完成状态
      }
    },
    REMOVE_TODO(state, id) {
      state.todos = state.todos.filter(t => t.id !== id) // 删除指定 id 的 todo
    }
  },
  actions: {
    addTodo({ commit }, text) {
      commit('ADD_TODO', text)
    },
    toggleTodo({ commit }, id) {
      commit('TOGGLE_TODO', id)
    },
    removeTodo({ commit }, id) {
      commit('REMOVE_TODO', id)
    }
  }
})
```

```vue
<!-- TodoList.vue -->
<template>
  <div>
    <input v-model="newTodo" @keyup.enter="addTodo" placeholder="添加待办事项" />
    
    <ul>
      <li v-for="todo in todos" :key="todo.id">
        <input type="checkbox" :checked="todo.done" @change="toggleTodo(todo.id)" />
        <span :style="{ textDecoration: todo.done ? 'line-through' : 'none' }">
          {{ todo.text }}
        </span>
        <button @click="removeTodo(todo.id)">删除</button>
      </li>
    </ul>
    
    <p>已完成：{{ doneCount }} | 未完成：{{ activeCount }}</p>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  data() {
    return {
      newTodo: '' // 输入框的值
    }
  },
  computed: {
    ...mapState(['todos']), // 映射 todos
    ...mapGetters(['doneCount', 'activeCount']) // 映射 getters
  },
  methods: {
    ...mapActions(['addTodo', 'toggleTodo', 'removeTodo']),
    addTodo() {
      if (this.newTodo.trim()) {
        this.$store.dispatch('addTodo', this.newTodo.trim())
        this.newTodo = '' // 清空输入框
      }
    }
  }
}
</script>
```

</details>

### 练习 3（挑战）：模块化购物车

实现一个模块化的购物车系统，包含：
- 用户模块（登录状态、用户信息）
- 商品模块（商品列表、添加到购物车）
- 购物车模块（购物车商品、总价计算、结算）

<details>
<summary>点击查看答案</summary>

```javascript
// store/modules/user.js
export default {
  namespaced: true,
  state: {
    isLoggedIn: false,
    userInfo: null
  },
  mutations: {
    SET_LOGIN(state, status) {
      state.isLoggedIn = status
    },
    SET_USER_INFO(state, info) {
      state.userInfo = info
    }
  },
  actions: {
    login({ commit }, userInfo) {
      commit('SET_LOGIN', true)
      commit('SET_USER_INFO', userInfo)
    },
    logout({ commit }) {
      commit('SET_LOGIN', false)
      commit('SET_USER_INFO', null)
    }
  }
}
```

```javascript
// store/modules/products.js
export default {
  namespaced: true,
  state: {
    products: [
      { id: 1, name: 'iPhone', price: 5999 },
      { id: 2, name: 'iPad', price: 3999 },
      { id: 3, name: 'MacBook', price: 9999 }
    ]
  },
  getters: {
    getProductById: state => id => {
      return state.products.find(p => p.id === id)
    }
  }
}
```

```javascript
// store/modules/cart.js
export default {
  namespaced: true,
  state: {
    items: []
  },
  getters: {
    totalPrice: state => {
      return state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    },
    totalItems: state => {
      return state.items.reduce((sum, item) => sum + item.quantity, 0)
    }
  },
  mutations: {
    ADD_ITEM(state, product) {
      const existing = state.items.find(item => item.id === product.id)
      if (existing) {
        existing.quantity++
      } else {
        state.items.push({ ...product, quantity: 1 })
      }
    },
    REMOVE_ITEM(state, productId) {
      state.items = state.items.filter(item => item.id !== productId)
    },
    CLEAR_CART(state) {
      state.items = []
    }
  },
  actions: {
    addToCart({ commit }, product) {
      commit('ADD_ITEM', product)
    },
    removeFromCart({ commit }, productId) {
      commit('REMOVE_ITEM', productId)
    },
    checkout({ commit, state }) {
      if (state.items.length === 0) {
        alert('购物车是空的')
        return
      }
      alert(`结算成功，总价：${state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)}元`)
      commit('CLEAR_CART')
    }
  }
}
```

```javascript
// store/index.js
import Vue from 'vue'
import Vuex from 'vuex'
import user from './modules/user'
import products from './modules/products'
import cart from './modules/cart'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    user,
    products,
    cart
  }
})
```

```vue
<!-- ShoppingCart.vue -->
<template>
  <div>
    <h2>商品列表</h2>
    <div v-for="product in products" :key="product.id">
      <span>{{ product.name }} - ¥{{ product.price }}</span>
      <button @click="addToCart(product)">加入购物车</button>
    </div>
    
    <h2>购物车</h2>
    <div v-if="cartItems.length === 0">购物车是空的</div>
    <div v-else>
      <div v-for="item in cartItems" :key="item.id">
        <span>{{ item.name }} × {{ item.quantity }} = ¥{{ item.price * item.quantity }}</span>
        <button @click="removeFromCart(item.id)">删除</button>
      </div>
      <p>总价：¥{{ totalPrice }}</p>
      <button @click="checkout">结算</button>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  computed: {
    ...mapState('products', ['products']),
    ...mapState('cart', { cartItems: 'items' }),
    ...mapGetters('cart', ['totalPrice'])
  },
  methods: {
    ...mapActions('cart', ['addToCart', 'removeFromCart', 'checkout'])
  }
}
</script>
```

</details>

---

## 下一章预告

恭喜你完成了 Vuex 状态管理的学习！现在你已经掌握了如何在大型 Vue 应用中管理共享状态。

下一章我们会学习 **过渡与动画**，让你的应用拥有流畅的交互效果。你会学到如何使用 `<transition>` 和 `<transition-group>` 实现元素进出动画，如何结合 CSS 和 JavaScript 创建复杂的动画效果，以及如何优化动画性能。
