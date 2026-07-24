---
title: '第十二章：Vue中的TypeScript'
description: '掌握在 Vue 3 中使用 TypeScript 的最佳实践，包括组件类型、组合式 API、Props 类型、事件类型等。'
---

# 第十二章：Vue中的TypeScript

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Vue 3 如何支持 TypeScript？
- 组合式 API 如何进行类型推断？
- Props 和 Emits 如何定义类型？
- ref、reactive、computed 的类型怎么处理？
- Vue 3 的类型工具（Component、DefineComponent）怎么用？

这一章就是为了解答这些问题。我们会先搞清楚 **Vue 3 + TypeScript 的核心概念**，再动手实践。

---

## 12.1 为什么需要在 Vue 中使用 TypeScript？

### 痛点分析

在没有 TypeScript 时，Vue 组件的开发存在以下问题：

```javascript
// ❌ JavaScript 中没有类型检查
export default {
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  methods: {
    greet() {
      // 不知道 user 有哪些属性
      console.log(`Hello ${this.user.name}`)
      // 如果 user 没有 name 属性，运行时才会报错
    }
  }
}
```

想象一下：你收到一个礼物盒，但不知道里面有什么，打开才发现不是你想要的——这就是没有 TypeScript 的问题。

### 解决方案

使用 TypeScript 后，我们可以在编译时就发现问题：

```typescript
// ✅ TypeScript 提供类型检查
interface User {
  id: number
  name: string
  email: string
}

export default defineComponent({
  props: {
    user: {
      type: Object as PropType<User>,
      required: true
    }
  },
  methods: {
    greet() {
      console.log(`Hello ${this.user.name}`)  // ✅ 有类型提示
      // console.log(this.user.xyz)  // ❌ 编译错误！
    }
  }
})
```

> **一句话总结**：TypeScript 让 Vue 组件的开发更安全、更高效，在编译时就能发现错误。

---

## 12.2 核心原理

### Vue 3 对 TypeScript 的支持

Vue 3 从底层设计就支持 TypeScript，主要体现在：

1. **组合式 API**：`setup()` 函数天然支持类型推断
2. **响应式 API**：`ref()`、`reactive()`、`computed()` 都有完善的类型支持
3. **组件类型**：`DefineComponent`、`Component` 等类型定义
4. **Props 类型**：`PropType`、`withDefaults` 等工具函数

打个比方：

> Vue 3 就像一个智能工具箱，TypeScript 是它的说明书——有了说明书，你才能正确、高效地使用每个工具。

---

## 12.3 Vue 3 + TypeScript 实战

### 1. 项目配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "lib": ["ESNext", "DOM"],
    "skipLibCheck": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 2. 组合式 API 的类型推断

```typescript
import { ref, reactive, computed } from 'vue'

// ref：自动推断类型
const count = ref(0)  // Ref<number>
const name = ref('Alice')  // Ref<string>
const isLoading = ref(false)  // Ref<boolean>

// ref：显式指定类型
const items = ref<string[]>([])  // Ref<string[]>
const user = ref<User | null>(null)  // Ref<User | null>

// reactive：自动推断类型
const state = reactive({
  count: 0,
  name: 'Alice'
})  // { count: number; name: string }

// reactive：显式指定类型
const userState = reactive<User>({
  id: 1,
  name: 'Alice',
  email: 'alice@test.com'
})

// computed：自动推断返回类型
const doubled = computed(() => count.value * 2)  // ComputedRef<number>
const userName = computed(() => user.value?.name ?? 'Unknown')  // ComputedRef<string>
```

### 3. Props 类型定义

```typescript
import { defineComponent, PropType, withDefaults } from 'vue'

interface User {
  id: number
  name: string
  email: string
}

// 方式一：使用 defineComponent
const UserCard = defineComponent({
  props: {
    // 基础类型
    title: String,
    count: {
      type: Number,
      required: true
    },
    // 对象类型需要使用 PropType
    user: {
      type: Object as PropType<User>,
      required: true
    },
    // 数组类型
    tags: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    // 自定义验证
    status: {
      type: String as PropType<'active' | 'inactive' | 'pending'>,
      default: 'pending',
      validator: (value: string) => ['active', 'inactive', 'pending'].includes(value)
    }
  },
  setup(props) {
    console.log(props.user.name)  // ✅ 有类型提示
    return {}
  }
})

// 方式二：使用 withDefaults（推荐）
interface Props {
  title?: string
  count: number
  user: User
  tags?: string[]
  status?: 'active' | 'inactive' | 'pending'
}

const UserCard2 = withDefaults(defineComponent<Props>({
  setup(props) {
    console.log(props.user.name)
    return {}
  }
}), {
  title: 'User Card',
  tags: () => [],
  status: 'pending'
})
```

### 4. Emits 类型定义

```typescript
import { defineComponent } from 'vue'

// 方式一：字符串数组
const Button = defineComponent({
  emits: ['click', 'hover'],
  setup(props, { emit }) {
    const handleClick = () => emit('click')
    const handleHover = () => emit('hover')
    return { handleClick, handleHover }
  }
})

// 方式二：对象形式（带参数类型）
const Input = defineComponent({
  emits: {
    'update:modelValue': (value: string) => true,
    'focus': () => true,
    'blur': (value: string) => value.length > 0
  },
  setup(props, { emit }) {
    const handleInput = (event: Event) => {
      const target = event.target as HTMLInputElement
      emit('update:modelValue', target.value)
    }
    return { handleInput }
  }
})

// 方式三：类型声明
type Emits = {
  (e: 'click', id: number): void
  (e: 'delete'): void
}

const ListItem = defineComponent({
  emits: ['click', 'delete'] as Emits,
  setup(props, { emit }) {
    const handleClick = () => emit('click', props.id)  // ✅ 需要传 id
    const handleDelete = () => emit('delete')  // ✅ 不需要参数
    return { handleClick, handleDelete }
  }
})
```

### 5. 模板中的类型

```vue
<template>
  <div>
    <!-- 类型推断 -->
    <p>{{ count }}</p>  <!-- count: number -->
    
    <!-- 条件渲染 -->
    <div v-if="user">
      <p>{{ user.name }}</p>  <!-- user: User -->
      <p>{{ user.email }}</p>
    </div>
    
    <!-- 列表渲染 -->
    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.name }}  <!-- item: Item -->
      </li>
    </ul>
    
    <!-- 事件处理 -->
    <button @click="handleClick">Click</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface User {
  id: number
  name: string
  email: string
}

interface Item {
  id: number
  name: string
}

const count = ref(0)
const user = ref<User | null>(null)
const items = ref<Item[]>([])

const handleClick = () => {
  count.value++
}
</script>
```

### 6. 组合式函数的类型

```typescript
// useCounter.ts
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  
  const doubled = computed(() => count.value * 2)
  
  const increment = () => count.value++
  const decrement = () => count.value--
  const reset = () => count.value = initialValue
  
  return {
    count,
    doubled,
    increment,
    decrement,
    reset
  }
}

// 使用
const { count, doubled, increment } = useCounter(10)
console.log(count.value)  // 10
console.log(doubled.value)  // 20
increment()
console.log(count.value)  // 11
```

### 7. 全局属性类型扩展

```typescript
// src/types/global.d.ts
import type { ComponentCustomProperties } from 'vue'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    // 扩展全局方法
    $formatDate: (date: Date) => string
    $api: ApiClient
    $store: Store
  }
}

// main.ts
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app.config.globalProperties.$formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN').format(date)
}

app.mount('#app')

// 在组件中使用
export default defineComponent({
  mounted() {
    console.log(this.$formatDate(new Date()))  // ✅ 有类型提示
  }
})
```

### 8. 路由类型

```typescript
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

interface RouteMeta {
  title: string
  requiresAuth?: boolean
}

type Routes = RouteRecordRaw<RouteMeta>[]

const routes: Routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/users/:id',
    name: 'UserDetail',
    component: () => import('../views/UserDetail.vue'),
    meta: { title: '用户详情', requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 在组件中获取路由参数
import { useRoute } from 'vue-router'

const route = useRoute()
const userId = route.params.id  // string | string[] | undefined
```

### 9. Pinia 状态管理

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: number
  name: string
  email: string
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  
  // 计算属性
  const isLoggedIn = computed(() => !!user.value)
  const userName = computed(() => user.value?.name ?? 'Guest')
  
  // 动作
  async function fetchUser(id: number) {
    isLoading.value = true
    const response = await fetch(`/api/users/${id}`)
    user.value = await response.json()
    isLoading.value = false
  }
  
  function logout() {
    user.value = null
  }
  
  return {
    user,
    isLoading,
    isLoggedIn,
    userName,
    fetchUser,
    logout
  }
})

// 在组件中使用
import { useUserStore } from '@/stores/user'

const store = useUserStore()
console.log(store.userName)  // ✅ 有类型提示
store.fetchUser(1)  // ✅ 有类型提示
```

---

## 12.4 Vue 类型工具对比

| 类型工具 | 作用 | 示例 |
| --- | --- | --- |
| `PropType<T>` | 定义 Props 的复杂类型 | `type: Object as PropType<User>` |
| `withDefaults` | 为 Props 设置默认值 | `withDefaults(defineComponent<Props>, {})` |
| `ComponentCustomProperties` | 扩展组件实例属性 | `$api`、`$store` |
| `DefineComponent` | 组件类型定义 | `defineComponent<Props, Emits>` |
| `Ref<T>` | ref 的类型 | `Ref<number>` |
| `Reactive<T>` | reactive 的类型 | `Reactive<User>` |
| `ComputedRef<T>` | computed 的类型 | `ComputedRef<string>` |

---

## 12.5 新手常见误区

### 误区 1："ref 和 reactive 可以互换"

**错！** ref 用于基本类型，reactive 用于对象类型。

```typescript
// ✅ ref 用于基本类型
const count = ref(0)
count.value++  // 需要 .value

// ✅ reactive 用于对象类型
const state = reactive({ count: 0 })
state.count++  // 不需要 .value

// ❌ 不要用 reactive 包裹基本类型
// const count = reactive(0)  // 无效！
```

### 误区 2："Props 可以直接修改"

**错！** Props 是只读的，不能直接修改。

```typescript
export default defineComponent({
  props: {
    count: Number
  },
  setup(props) {
    // props.count++  // ❌ 编译错误！
    // 应该通过 emit 通知父组件修改
  }
})
```

### 误区 3："不需要为 ref 指定类型"

**对！但有时候需要。** ref 会自动推断类型，但有时候需要显式指定。

```typescript
// ✅ 自动推断
const count = ref(0)  // Ref<number>

// ✅ 需要显式指定（初始值为 null 或 undefined）
const user = ref<User | null>(null)  // Ref<User | null>
const items = ref<string[]>([])  // Ref<string[]>

// ❌ 错误：TypeScript 推断为 Ref<null>
// const user = ref(null)  // 无法推断 User 类型
```

### 误区 4："defineComponent 可以省略"

**错！** 在某些情况下需要使用 defineComponent 来获得更好的类型支持。

```typescript
// ✅ 使用 defineComponent（推荐）
export default defineComponent({
  props: {
    user: {
      type: Object as PropType<User>,
      required: true
    }
  }
})

// ⚠️ 不使用 defineComponent（类型支持有限）
export default {
  props: {
    user: Object
  }
}
```

---

## 12.6 动手练习

### 练习 1：基础练习

创建一个带有类型定义的用户列表组件。

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div class="user-list">
    <h2>{{ title }}</h2>
    <div v-if="loading" class="loading">加载中...</div>
    <ul v-else>
      <li 
        v-for="user in users" 
        :key="user.id"
        @click="$emit('select', user)"
      >
        <div class="avatar">{{ user.name.charAt(0) }}</div>
        <div class="info">
          <p class="name">{{ user.name }}</p>
          <p class="email">{{ user.email }}</p>
        </div>
      </li>
    </ul>
    <p v-if="users.length === 0 && !loading" class="empty">暂无用户</p>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

interface User {
  id: number
  name: string
  email: string
}

interface Props {
  title?: string
  users: User[]
  loading?: boolean
}

type Emits = {
  (e: 'select', user: User): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style scoped>
.user-list {
  max-width: 400px;
  margin: 0 auto;
}

.user-list h2 {
  margin-bottom: 16px;
  color: #333;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.user-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.user-list li {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-list li:hover {
  background-color: #f5f5f5;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #42b983;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 12px;
}

.info .name {
  margin: 0;
  font-weight: bold;
  color: #333;
}

.info .email {
  margin: 4px 0 0;
  color: #666;
  font-size: 14px;
}

.empty {
  text-align: center;
  color: #999;
  padding: 20px;
}
</style>
```

</details>

### 练习 2：进阶练习

创建一个组合式函数，用于处理表单验证。

<details>
<summary>点击查看答案</summary>

```typescript
// useForm.ts
import { ref, computed } from 'vue'

interface ValidationRule<T> {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  validate?: (value: T) => string | null
}

interface FormField<T = string> {
  value: T
  error: string | null
  rules?: ValidationRule<T>
}

export function useForm<T extends Record<string, FormField>>(initialForm: T) {
  const form = reactive<T>(initialForm)
  
  const errors = computed(() => {
    const result: Record<string, string | null> = {}
    for (const key in form) {
      result[key] = form[key].error
    }
    return result
  })
  
  const isValid = computed(() => {
    for (const key in form) {
      if (form[key].error !== null) return false
    }
    return true
  })
  
  function validateField<K extends keyof T>(fieldName: K): boolean {
    const field = form[fieldName]
    const value = field.value
    const rules = field.rules
    
    if (!rules) {
      field.error = null
      return true
    }
    
    if (rules.required && !value) {
      field.error = '此字段必填'
      return false
    }
    
    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
      field.error = `至少需要 ${rules.minLength} 个字符`
      return false
    }
    
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      field.error = `最多允许 ${rules.maxLength} 个字符`
      return false
    }
    
    if (rules.min && typeof value === 'number' && value < rules.min) {
      field.error = `最小值为 ${rules.min}`
      return false
    }
    
    if (rules.max && typeof value === 'number' && value > rules.max) {
      field.error = `最大值为 ${rules.max}`
      return false
    }
    
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      field.error = '格式不正确'
      return false
    }
    
    if (rules.validate) {
      const customError = rules.validate(value)
      if (customError) {
        field.error = customError
        return false
      }
    }
    
    field.error = null
    return true
  }
  
  function validate(): boolean {
    let isValid = true
    for (const key in form) {
      if (!validateField(key)) {
        isValid = false
      }
    }
    return isValid
  }
  
  function reset() {
    for (const key in form) {
      const field = form[key]
      if (key === 'password') {
        field.value = '' as T[typeof key]['value']
      } else {
        field.value = '' as T[typeof key]['value']
      }
      field.error = null
    }
  }
  
  return {
    form,
    errors,
    isValid,
    validateField,
    validate,
    reset
  }
}

// 使用示例
interface LoginForm {
  email: FormField<string>
  password: FormField<string>
}

const { form, validate, reset } = useForm<LoginForm>({
  email: {
    value: '',
    error: null,
    rules: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  },
  password: {
    value: '',
    error: null,
    rules: {
      required: true,
      minLength: 6
    }
  }
})

// 提交表单
async function handleSubmit() {
  if (validate()) {
    console.log('Form is valid:', form)
    // 提交逻辑...
  }
}
```

</details>

### 练习 3（挑战）：综合练习

创建一个完整的 Todo 应用，包含类型定义、组合式函数和组件。

<details>
<summary>点击查看答案</summary>

```typescript
// types/todo.ts
export interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: Date
}

export type TodoFilter = 'all' | 'active' | 'completed'
```

```typescript
// composables/useTodos.ts
import { ref, computed } from 'vue'
import type { Todo, TodoFilter } from '@/types/todo'

export function useTodos() {
  const todos = ref<Todo[]>([])
  const filter = ref<TodoFilter>('all')
  
  const filteredTodos = computed(() => {
    switch (filter.value) {
      case 'active':
        return todos.value.filter(t => !t.completed)
      case 'completed':
        return todos.value.filter(t => t.completed)
      default:
        return todos.value
    }
  })
  
  const activeCount = computed(() => {
    return todos.value.filter(t => !t.completed).length
  })
  
  const completedCount = computed(() => {
    return todos.value.filter(t => t.completed).length
  })
  
  function addTodo(title: string) {
    if (!title.trim()) return
    
    todos.value.push({
      id: Date.now().toString(),
      title: title.trim(),
      completed: false,
      createdAt: new Date()
    })
  }
  
  function toggleTodo(id: string) {
    const todo = todos.value.find(t => t.id === id)
    if (todo) {
      todo.completed = !todo.completed
    }
  }
  
  function deleteTodo(id: string) {
    todos.value = todos.value.filter(t => t.id !== id)
  }
  
  function clearCompleted() {
    todos.value = todos.value.filter(t => !t.completed)
  }
  
  function setFilter(newFilter: TodoFilter) {
    filter.value = newFilter
  }
  
  return {
    todos,
    filter,
    filteredTodos,
    activeCount,
    completedCount,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
    setFilter
  }
}
```

```vue
<!-- components/TodoList.vue -->
<template>
  <ul class="todo-list">
    <li 
      v-for="todo in todos" 
      :key="todo.id"
      :class="{ completed: todo.completed }"
    >
      <input 
        type="checkbox" 
        :checked="todo.completed"
        @change="$emit('toggle', todo.id)"
      />
      <span>{{ todo.title }}</span>
      <button @click="$emit('delete', todo.id)">×</button>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { Todo } from '@/types/todo'

defineProps<{
  todos: Todo[]
}>()

defineEmits<{
  (e: 'toggle', id: string): void
  (e: 'delete', id: string): void
}>()
</script>

<style scoped>
.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.todo-list li {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #eee;
  transition: all 0.2s;
}

.todo-list li.completed {
  opacity: 0.6;
}

.todo-list li.completed span {
  text-decoration: line-through;
}

.todo-list input {
  margin-right: 12px;
}

.todo-list span {
  flex: 1;
}

.todo-list button {
  background: none;
  border: none;
  color: #ff6b6b;
  font-size: 20px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.todo-list li:hover button {
  opacity: 1;
}
</style>
```

```vue
<!-- App.vue -->
<template>
  <div class="todo-app">
    <h1>Todo List</h1>
    
    <input 
      type="text" 
      v-model="newTodo"
      @keyup.enter="addTodo(newTodo)"
      placeholder="添加新任务..."
    />
    
    <TodoList 
      :todos="filteredTodos"
      @toggle="toggleTodo"
      @delete="deleteTodo"
    />
    
    <div class="footer">
      <span>{{ activeCount }} 个待完成</span>
      
      <div class="filters">
        <button 
          :class="{ active: filter === 'all' }"
          @click="setFilter('all')"
        >全部</button>
        <button 
          :class="{ active: filter === 'active' }"
          @click="setFilter('active')"
        >待完成</button>
        <button 
          :class="{ active: filter === 'completed' }"
          @click="setFilter('completed')"
        >已完成</button>
      </div>
      
      <button 
        v-if="completedCount > 0"
        @click="clearCompleted"
      >清除已完成</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TodoList from '@/components/TodoList.vue'
import { useTodos } from '@/composables/useTodos'

const newTodo = ref('')
const {
  filteredTodos,
  activeCount,
  completedCount,
  filter,
  addTodo,
  toggleTodo,
  deleteTodo,
  clearCompleted,
  setFilter
} = useTodos()
</script>

<style scoped>
.todo-app {
  max-width: 400px;
  margin: 40px auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.todo-app h1 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

.todo-app input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-top: 1px solid #eee;
  margin-top: 16px;
}

.footer span {
  color: #666;
  font-size: 14px;
}

.filters button {
  background: none;
  border: 1px solid transparent;
  padding: 4px 8px;
  margin: 0 4px;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  font-size: 14px;
  transition: all 0.2s;
}

.filters button:hover {
  border-color: #ddd;
}

.filters button.active {
  border-color: #42b983;
  color: #42b983;
}

.footer button:last-child {
  background: none;
  border: none;
  color: #ff6b6b;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.2s;
}

.footer button:last-child:hover {
  text-decoration: underline;
}
</style>
```

</details>

---

## 教程总结

恭喜你完成了本教程的全部内容！让我们回顾一下所学的知识：

### 基础知识
- **第1章：基础类型** — string、number、boolean、null、undefined、any、unknown、never
- **第2章：数组与元组** — 数组类型、readonly数组、元组类型
- **第3章：对象与接口** — interface、可选属性、只读属性、继承

### 进阶知识
- **第4章：类型别名与联合类型** — type、联合类型、交叉类型、字面量类型
- **第5章：函数类型** — 参数类型、返回类型、重载、this类型
- **第6章：类与面向对象** — 访问修饰符、继承、抽象类、静态成员
- **第7章：泛型** — 泛型函数、泛型接口、泛型类、泛型约束
- **第8章：枚举** — 数字枚举、字符串枚举、const枚举
- **第9章：类型断言与类型收窄** — as、!、typeof、instanceof、in、satisfies

### 高级知识
- **第10章：高级类型** — keyof、typeof、条件类型、infer、映射类型、模板字面量类型
- **第11章：工具类型实战** — Partial、Required、Pick、Omit、Record、ReturnType等
- **第12章：Vue中的TypeScript** — 组合式API、Props类型、Emits类型、Pinia状态管理

### 下一步建议

1. **实践项目**：尝试用 TypeScript 重构一个现有的 Vue 项目
2. **深入学习**：阅读 Vue 3 和 TypeScript 的官方文档
3. **探索更多**：学习 Vue 3 的其他特性，如 Suspense、Teleport、Composition API 等

> **记住**：TypeScript 是一个工具，它的目的是帮助我们写出更安全、更可维护的代码。不要为了使用 TypeScript 而使用它，而是要在合适的地方使用它。