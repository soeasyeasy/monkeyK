---
title: "第十四章：Vuex 状态管理"
description: "学习 Vue 2 中的状态管理库 Vuex，掌握 state、getters、mutations、actions 的使用。"
---

# 第十四章：Vuex 状态管理

## 运行结果

- **状态管理**
  - 全局状态集中管理
  - 组件间共享数据
  - 状态变化可追踪
- **核心概念**
  - state：存储状态数据
  - getters：计算属性
  - mutations：同步修改状态
  - actions：异步操作
  - modules：模块化

## 代码详解

### 1. 安装与配置

```bash
npm install vuex@3
```

```javascript
// store/index.js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    count: 0,
    user: null
  },
  getters: {
    doubleCount: state => state.count * 2
  },
  mutations: {
    increment(state) {
      state.count++
    },
    setUser(state, user) {
      state.user = user
    }
  },
  actions: {
    asyncLogin({ commit }, credentials) {
      // 异步操作
      return api.login(credentials).then(user => {
        commit('setUser', user)
      })
    }
  }
})
```

```javascript
// main.js
import Vue from 'vue'
import App from './App.vue'
import store from './store'

new Vue({
  store,
  render: h => h(App)
}).$mount('#app')
```

### 2. State

```vue
<template>
  <div>
    <!-- 方式一：直接访问 -->
    <p>{{ $store.state.count }}</p>
    
    <!-- 方式二：计算属性 -->
    <p>{{ count }}</p>
    
    <!-- 方式三：mapState -->
    <p>{{ count }}</p>
    <p>{{ user }}</p>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  computed: {
    // 方式二
    count() {
      return this.$store.state.count
    },
    
    // 方式三：mapState
    ...mapState(['count', 'user']),
    
    // 带命名空间
    ...mapState('moduleA', ['count'])
  }
}
</script>
```

### 3. Getters

```javascript
// store/index.js
export default new Vuex.Store({
  state: {
    todos: [
      { id: 1, text: '学习 Vue', done: true },
      { id: 2, text: '学习 Vuex', done: false }
    ]
  },
  getters: {
    // 基础 getter
    doneTodos: state => {
      return state.todos.filter(todo => todo.done)
    },
    
    // 返回函数（支持参数）
    getTodoById: state => id => {
      return state.todos.find(todo => todo.id === id)
    }
  }
})
```

```vue
<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    // 方式一
    doneTodosCount() {
      return this.$store.getters.doneTodos.length
    },
    
    // 方式二：mapGetters
    ...mapGetters(['doneTodos', 'getTodoById'])
  },
  methods: {
    showTodo() {
      const todo = this.getTodoById(1)
      console.log(todo)
    }
  }
}
</script>
```

### 4. Mutations

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
      state.count++
    },
    
    // 带参数
    incrementBy(state, payload) {
      state.count += payload.amount
    },
    
    // 对象风格参数
    updateUser(state, payload) {
      state.user = {
        ...state.user,
        ...payload
      }
    }
  }
})
```

```vue
<script>
import { mapMutations } from 'vuex'

export default {
  methods: {
    // 方式一：直接提交
    increment() {
      this.$store.commit('increment')
    },
    
    // 带参数
    incrementBy() {
      this.$store.commit('incrementBy', { amount: 10 })
    },
    
    // 方式二：mapMutations
    ...mapMutations(['increment', 'incrementBy'])
  }
}
</script>
```

::: warning
Mutations 必须是同步函数，不要在 mutation 中执行异步操作。
:::

### 5. Actions

```javascript
// store/index.js
export default new Vuex.Store({
  state: {
    user: null,
    loading: false
  },
  mutations: {
    setUser(state, user) {
      state.user = user
    },
    setLoading(state, loading) {
      state.loading = loading
    }
  },
  actions: {
    // 基础 action
    async login({ commit }, credentials) {
      commit('setLoading', true)
      try {
        const user = await api.login(credentials)
        commit('setUser', user)
        return user
      } catch (error) {
        throw error
      } finally {
        commit('setLoading', false)
      }
    },
    
    // 使用其他 action
    async loginAndRedirect({ dispatch, commit }, credentials) {
      await dispatch('login', credentials)
      router.push('/dashboard')
    }
  }
})
```

```vue
<script>
import { mapActions } from 'vuex'

export default {
  methods: {
    // 方式一：直接分发
    async login() {
      try {
        await this.$store.dispatch('login', {
          username: 'admin',
          password: '123456'
        })
        console.log('登录成功')
      } catch (error) {
        console.error('登录失败', error)
      }
    },
    
    // 方式二：mapActions
    ...mapActions(['login'])
  }
}
</script>
```

### 6. Modules

```javascript
// store/modules/user.js
export default {
  namespaced: true,
  state: {
    profile: null,
    token: null
  },
  getters: {
    isLoggedIn: state => !!state.token,
    userName: state => state.profile?.name
  },
  mutations: {
    setProfile(state, profile) {
      state.profile = profile
    },
    setToken(state, token) {
      state.token = token
    }
  },
  actions: {
    async fetchProfile({ commit }) {
      const profile = await api.getProfile()
      commit('setProfile', profile)
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
      return state.items.reduce((total, item) => {
        return total + item.price * item.quantity
      }, 0)
    }
  },
  mutations: {
    addItem(state, item) {
      state.items.push(item)
    },
    removeItem(state, index) {
      state.items.splice(index, 1)
    }
  }
}
```

```javascript
// store/index.js
import Vue from 'vue'
import Vuex from 'vuex'
import user from './modules/user'
import cart from './modules/cart'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    user,
    cart
  }
})
```

```vue
<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  computed: {
    // 访问模块状态
    ...mapState('user', ['profile', 'token']),
    ...mapState('cart', ['items']),
    
    // 访问模块 getters
    ...mapGetters('user', ['isLoggedIn', 'userName']),
    ...mapGetters('cart', ['totalPrice'])
  },
  methods: {
    // 调用模块 actions
    ...mapActions('user', ['fetchProfile']),
    ...mapActions('cart', ['addItem', 'removeItem'])
  }
}
</script>
```

### 7. 辅助函数

```vue
<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'

export default {
  computed: {
    // mapState
    ...mapState({
      count: state => state.count,
      userName: state => state.user.name
    }),
    
    // mapGetters
    ...mapGetters({
      doneCount: 'doneTodosCount',
      activeCount: 'activeTodosCount'
    })
  },
  methods: {
    // mapMutations
    ...mapMutations({
      add: 'increment', // 映射为 this.add()
      remove: 'decrement'
    }),
    
    // mapActions
    ...mapActions({
      loadUser: 'fetchUser',
      saveData: 'saveData'
    })
  }
}
</script>
```

### 8. 完整示例：Todo 应用

```javascript
// store/index.js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    todos: [],
    filter: 'all' // all, active, done
  },
  getters: {
    filteredTodos(state) {
      switch (state.filter) {
        case 'active':
          return state.todos.filter(todo => !todo.done)
        case 'done':
          return state.todos.filter(todo => todo.done)
        default:
          return state.todos
      }
    },
    activeCount: state => state.todos.filter(todo => !todo.done).length,
    doneCount: state => state.todos.filter(todo => todo.done).length
  },
  mutations: {
    ADD_TODO(state, todo) {
      state.todos.push({
        id: Date.now(),
        text: todo,
        done: false
      })
    },
    TOGGLE_TODO(state, id) {
      const todo = state.todos.find(t => t.id === id)
      if (todo) {
        todo.done = !todo.done
      }
    },
    REMOVE_TODO(state, id) {
      state.todos = state.todos.filter(t => t.id !== id)
    },
    SET_FILTER(state, filter) {
      state.filter = filter
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
    },
    setFilter({ commit }, filter) {
      commit('SET_FILTER', filter)
    }
  }
})
```

```vue
<!-- TodoApp.vue -->
<template>
  <div>
    <input
      v-model="newTodo"
      @keyup.enter="addTodo"
      placeholder="添加待办事项"
    />
    
    <ul>
      <li v-for="todo in filteredTodos" :key="todo.id">
        <input
          type="checkbox"
          :checked="todo.done"
          @change="toggleTodo(todo.id)"
        />
        <span :class="{ done: todo.done }">{{ todo.text }}</span>
        <button @click="removeTodo(todo.id)">删除</button>
      </li>
    </ul>
    
    <div>
      <button @click="setFilter('all')">全部</button>
      <button @click="setFilter('active')">未完成</button>
      <button @click="setFilter('done')">已完成</button>
    </div>
    
    <p>
      未完成：{{ activeCount }} | 已完成：{{ doneCount }}
    </p>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  data() {
    return {
      newTodo: ''
    }
  },
  computed: {
    ...mapGetters(['filteredTodos', 'activeCount', 'doneCount'])
  },
  methods: {
    ...mapActions(['addTodo', 'toggleTodo', 'removeTodo', 'setFilter']),
    addTodo() {
      if (this.newTodo.trim()) {
        this.$store.dispatch('addTodo', this.newTodo.trim())
        this.newTodo = ''
      }
    }
  }
}
</script>
```

## 最佳实践

::: info
- 使用 modules 组织大型应用
- Mutations 必须是同步函数
- Actions 处理异步操作
- 使用辅助函数简化代码
- 合理使用 getters 缓存计算结果
- 使用常量定义 mutation 类型
:::
