---
title: "第十二章：Vue 中的 TypeScript"
description: "在 Vue 3 中使用 TypeScript，充分利用类型系统提升开发体验。"
---

# 第十二章：Vue 中的 TypeScript

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Vue 3 为什么要用 TypeScript？不用行不行？
- `ref<number>(0)` 和 `ref(0)` 有什么区别？什么时候需要手动标注类型？
- `defineProps` 的两种写法有什么区别？为什么推荐基于类型的写法？
- 组件的 Props、Emits 怎么标注类型？API 请求返回的数据怎么定义类型？

这一章就是为了解答这些问题。我们会先搞清楚 **Vue 3 对 TypeScript 的支持原理**，再学习各种场景下的类型标注方法。

学完本章，你将能够：
- 在 Vue 3 项目中正确使用 TypeScript
- 为组件的 Props、Emits、响应式数据标注类型
- 为 API 请求定义类型安全的接口
- 编写可复用的泛型组件

---

## 1 为什么需要这个技术？

### 痛点分析

想象一下，你正在开发一个用户列表组件，需要接收一个 `users` 属性：

```javascript
// ❌ 没有 TypeScript 的世界
<script setup>
const props = defineProps({
  users: {
    type: Array,
    required: true
  }
})
</script>

<template>
  <div v-for="user in users" :key="user.id">
    <!-- 这里 user 是什么结构？完全不知道 -->
    {{ user.name }}
    {{ user.age }}
  </div>
</template>
```

**问题出现了：**
- 父组件传了 `users`，但你不知道每个 user 有哪些字段
- 写代码时没有智能提示，全靠猜
- 传错了数据类型，运行时才报错
- 重构时不知道哪里用到了这个属性，改起来提心吊胆

### 解决方案

有了 TypeScript，代码变成了这样：

```typescript
// ✅ 有 TypeScript 的世界
<script setup lang="ts">
interface User {
  id: number
  name: string
  age: number
}

const props = defineProps<{
  users: User[]
}>()
</script>

<template>
  <div v-for="user in users" :key="user.id">
    <!-- 输入框提示：user.id, user.name, user.age -->
    {{ user.name }}
    {{ user.age }}
  </div>
</template>
```

**效果对比：**

| 场景 | 没有 TypeScript | 有 TypeScript |
| --- | --- | --- |
| 代码提示 | ❌ 全靠猜 | ✅ 自动补全字段 |
| 类型检查 | ❌ 运行时才报错 | ✅ 写代码时就提示错误 |
| 重构信心 | ❌ 不知道改哪里 | ✅ 自动找出所有引用 |
| 文档维护 | ❌ 注释容易过时 | ✅ 类型就是活文档 |

打个比方：

> **没有 TypeScript 就像点外卖不看菜单**——你不知道送来的菜是什么，吃到嘴里才知道对不对。
> 
> **有了 TypeScript 就像看着菜单点餐**——每道菜有什么配料、什么口味，一目了然，点错了系统会提醒你。

> **一句话总结**：TypeScript 让 Vue 组件开发更安全、更高效、更省心。

---

## 2 核心原理

### Vue 3 对 TypeScript 的支持

Vue 3 是用 TypeScript 写的，所以天生支持类型系统。在 Vue 3 中使用 TypeScript，主要依赖以下几个机制：

#### 1. `<script setup lang="ts">`

这是 Vue 3 推荐的写法，`lang="ts"` 告诉 Vite 用 TypeScript 处理这个脚本块。

```vue
<script setup lang="ts">
// 这里可以写 TypeScript 代码
const count = ref<number>(0)
</script>
```

#### 2. 类型推导（Type Inference）

Vue 会自动推导很多类型，你不需要手动标注：

```typescript
// ✅ 自动推导为 number
const count = ref(0)

// ✅ 自动推导为 string
const message = ref('hello')

// ✅ 自动推导为 { name: string, age: number }
const user = ref({ name: 'Alice', age: 25 })
```

#### 3. 类型标注（Type Annotation）

当自动推导不够准确，或者类型比较复杂时，需要手动标注：

```typescript
// ✅ 手动标注联合类型
const status = ref<'loading' | 'success' | 'error'>('loading')

// ✅ 手动标注可能为 null 的类型
const user = ref<User | null>(null)
```

打个比方：

> **类型推导就像自动识别**——你给一张猫的照片，系统自动识别为"猫"。
> 
> **类型标注就像手动打标签**——你明确告诉系统"这是一只橘猫，3岁，公的"。

### Vue 3 的类型工具

Vue 3 提供了一些专门的类型工具：

| 工具 | 作用 | 使用场景 |
| --- | --- | --- |
| `ref<T>()` | 标注 ref 的类型 | 需要明确指定类型时 |
| `reactive<T>()` | 标注 reactive 的类型 | 复杂对象状态 |
| `defineProps<T>()` | 基于类型定义 Props | 组件属性类型定义 |
| `defineEmits<T>()` | 基于类型定义 Emits | 组件事件类型定义 |
| `PropType<T>` | 运行时声明的类型工具 | 兼容 Options API 写法 |

---

## 3 基础用法

### 3.1 ref 的类型标注

`ref` 可以接收泛型参数来明确指定类型。

```vue
<script setup lang="ts">
import { ref } from 'vue'

// ✅ 基本类型 - 通常不需要手动标注，自动推导即可
const count = ref(0) // 自动推导为 Ref<number>
const message = ref('hello') // 自动推导为 Ref<string>

// ✅ 联合类型 - 需要手动标注
const status = ref<'loading' | 'success' | 'error'>('loading')

// ✅ 可能为 null - 需要手动标注
const user = ref<User | null>(null)

// ✅ 复杂对象 - 建议定义 interface
interface User {
  id: number
  name: string
  age: number
}

const currentUser = ref<User>({
  id: 1,
  name: 'Alice',
  age: 25
})

// ✅ 数组类型
const users = ref<User[]>([])

// ✅ 访问和修改
count.value++ // 2
status.value = 'success' // ✅ 类型正确
// status.value = 'pending' // ❌ 类型错误，编译时报错

if (user.value) {
  console.log(user.value.name) // TypeScript 知道 user.value 不是 null
}
</script>
```

> **原理**：`ref<T>(value)` 返回的类型是 `Ref<T>`，访问和修改需要通过 `.value` 属性。在模板中会自动解包，不需要 `.value`。

### 3.2 reactive 的类型标注

`reactive` 用于创建响应式对象，通常配合 `interface` 使用。

```vue
<script setup lang="ts">
import { reactive } from 'vue'

// ✅ 定义接口
interface State {
  count: number
  message: string
  items: string[]
  user: {
    name: string
    age: number
  } | null
}

// ✅ 创建响应式状态
const state = reactive<State>({
  count: 0,
  message: 'Hello',
  items: ['item1', 'item2'],
  user: null
})

// ✅ 访问和修改 - 不需要 .value
state.count++ // 1
state.message = 'World'
state.items.push('item3')
state.user = { name: 'Alice', age: 25 }

// ❌ 错误示例
// state.count = 'string' // 类型错误，编译时报错
// state.notExist = 123 // 属性不存在，编译时报错
</script>
```

### 3.3 computed 的类型推导

`computed` 会自动推导返回类型，通常不需要手动标注。

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const count = ref(0)
const message = ref('hello')

// ✅ 自动推导为 number
const doubleCount = computed(() => count.value * 2)

// ✅ 自动推导为 string
const upperMessage = computed(() => message.value.toUpperCase())

// ✅ 自动推导为 boolean
const isPositive = computed(() => count.value > 0)

// ✅ 复杂类型 - 自动推导
interface User {
  name: string
  age: number
}

const users = ref<User[]>([
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 30 }
])

// 自动推导为 User[]
const adultUsers = computed(() => users.value.filter(u => u.age >= 18))

// ✅ 显式指定类型（可选，通常不需要）
const greeting = computed<string>(() => {
  return `Hello, ${message.value}!`
})
</script>
```

### 3.4 事件处理函数的类型

处理 DOM 事件时，需要为事件对象标注类型。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const message = ref('')

// ✅ 鼠标点击事件
function handleClick(event: MouseEvent): void {
  console.log('点击位置:', event.clientX, event.clientY)
}

// ✅ 输入事件
function handleInput(event: Event): void {
  // 需要类型断言，因为 event.target 可能是 null
  const target = event.target as HTMLInputElement
  message.value = target.value
}

// ✅ 键盘事件
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    console.log('按下回车键')
    console.log('输入内容:', message.value)
  }
}

// ✅ 表单提交事件
function handleSubmit(event: Event): void {
  event.preventDefault() // 阻止默认提交行为
  console.log('提交表单')
}
</script>

<template>
  <button @click="handleClick">点击我</button>
  <input @input="handleInput" :value="message" />
  <input @keydown="handleKeydown" v-model="message" />
  <form @submit="handleSubmit">
    <button type="submit">提交</button>
  </form>
</template>
```

---

## 4 进阶用法

### 4.1 defineProps 类型定义

子组件接收父组件传递的属性时，使用 `defineProps` 定义类型。

```vue
<!-- 子组件：UserCard.vue -->
<script setup lang="ts">
// ✅ 方式一：运行时声明（不推荐）
const props = defineProps({
  title: String,
  count: { type: Number, default: 0 },
  items: { 
    type: Array as () => string[], // 需要类型断言
    required: true 
  }
})

// ✅ 方式二：基于类型的声明（推荐）
interface Props {
  title: string
  count?: number // 可选属性
  items: string[] // 必填属性
  status?: 'active' | 'inactive' // 联合类型
}

const props = defineProps<Props>()

// ✅ 带默认值
const props = withDefaults(defineProps<Props>(), {
  count: 0,
  status: 'active'
})

// ✅ 使用 props
console.log(props.title)
console.log(props.count) // number | undefined
console.log(props.items) // string[]
</script>

<template>
  <div>
    <h2>{{ title }}</h2>
    <p>数量: {{ count }}</p>
    <ul>
      <li v-for="item in items" :key="item">{{ item }}</li>
    </ul>
    <span :class="status">{{ status }}</span>
  </div>
</template>
```

**父组件使用：**

```vue
<!-- 父组件 -->
<script setup lang="ts">
import UserCard from './UserCard.vue'

const items = ['苹果', '香蕉', '橙子']
</script>

<template>
  <!-- ✅ 类型正确，有代码提示 -->
  <UserCard 
    title="水果列表" 
    :items="items" 
    :count="3"
    status="active"
  />
  
  <!-- ❌ 类型错误，编译时会提示 -->
  <!-- <UserCard title="水果列表" :items="items" :count="'3'" /> -->
</template>
```

### 4.2 defineEmits 类型定义

子组件向父组件发送事件时，使用 `defineEmits` 定义类型。

```vue
<!-- 子组件：Counter.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

// ✅ 方式一：运行时声明（不推荐）
const emit = defineEmits(['change', 'update'])

// ✅ 方式二：基于类型的声明（推荐）
const emit = defineEmits<{
  // 事件名: [参数类型列表]
  change: [value: number]
  update: [id: number, payload: { name: string }]
  delete: [] // 无参数
}>()

function increment() {
  count.value++
  // ✅ 发送事件，类型正确
  emit('change', count.value)
}

function updateData() {
  emit('update', 1, { name: 'Alice' })
}

function remove() {
  emit('delete')
}
</script>

<template>
  <button @click="increment">增加</button>
  <button @click="updateData">更新</button>
  <button @click="remove">删除</button>
</template>
```

**父组件使用：**

```vue
<!-- 父组件 -->
<script setup lang="ts">
import Counter from './Counter.vue'

function handleChange(value: number) {
  console.log('计数变化:', value)
}

function handleUpdate(id: number, payload: { name: string }) {
  console.log('更新:', id, payload)
}

function handleDelete() {
  console.log('删除')
}
</script>

<template>
  <Counter 
    @change="handleChange"
    @update="handleUpdate"
    @delete="handleDelete"
  />
</template>
```

### 4.3 API 请求类型定义

实际项目中，API 请求的类型定义非常重要。

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

// ✅ 定义统一的 API 响应类型
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// ✅ 定义业务数据类型
interface UserInfo {
  id: number
  username: string
  avatar: string
  email: string
}

interface Article {
  id: number
  title: string
  content: string
  createdAt: string
}

// ✅ 定义请求函数，明确返回类型
async function fetchUser(id: number): Promise<ApiResponse<UserInfo>> {
  const res = await fetch(`/api/user/${id}`)
  return res.json()
}

async function fetchArticles(): Promise<ApiResponse<Article[]>> {
  const res = await fetch('/api/articles')
  return res.json()
}

// ✅ 组件状态
const userInfo = ref<UserInfo | null>(null)
const articles = ref<Article[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// ✅ 加载用户信息
async function loadUser(id: number) {
  loading.value = true
  error.value = null
  
  try {
    const res = await fetchUser(id)
    if (res.code === 200) {
      userInfo.value = res.data
    } else {
      error.value = res.message
    }
  } catch (e) {
    error.value = '加载失败'
  } finally {
    loading.value = false
  }
}

// ✅ 加载文章列表
async function loadArticles() {
  loading.value = true
  
  try {
    const res = await fetchArticles()
    if (res.code === 200) {
      articles.value = res.data
    }
  } finally {
    loading.value = false
  }
}

// ✅ 组件挂载时加载数据
onMounted(() => {
  loadUser(1)
  loadArticles()
})
</script>

<template>
  <div v-if="loading">加载中...</div>
  <div v-else-if="error">错误: {{ error }}</div>
  <div v-else>
    <div v-if="userInfo">
      <img :src="userInfo.avatar" :alt="userInfo.username" />
      <h2>{{ userInfo.username }}</h2>
      <p>{{ userInfo.email }}</p>
    </div>
    
    <ul>
      <li v-for="article in articles" :key="article.id">
        <h3>{{ article.title }}</h3>
        <p>{{ article.content }}</p>
        <time>{{ article.createdAt }}</time>
      </li>
    </ul>
  </div>
</template>
```

### 4.4 泛型组件

Vue 3.3+ 支持泛型组件，可以创建更灵活的组件。

```vue
<!-- Select.vue - 泛型选择器组件 -->
<script setup lang="ts" generic="T">
// ✅ 定义泛型选项类型
interface Option<T> {
  label: string
  value: T
}

// ✅ Props 使用泛型
const props = defineProps<{
  options: Option<T>[]
  modelValue: T | null
  placeholder?: string
}>()

// ✅ Emits 使用泛型
const emit = defineEmits<{
  'update:modelValue': [value: T]
}>()

// ✅ 处理选择
function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const selectedIndex = target.selectedIndex
  const selectedOption = props.options[selectedIndex]
  
  if (selectedOption) {
    emit('update:modelValue', selectedOption.value)
  }
}
</script>

<template>
  <select :value="modelValue" @change="handleChange">
    <option v-if="placeholder" disabled :value="null">
      {{ placeholder }}
    </option>
    <option 
      v-for="option in options" 
      :key="String(option.value)"
      :value="option.value"
    >
      {{ option.label }}
    </option>
  </select>
</template>
```

**使用泛型组件：**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import Select from './Select.vue'

// ✅ 数字类型
const selectedId = ref<number | null>(null)
const idOptions = [
  { label: '选项一', value: 1 },
  { label: '选项二', value: 2 },
  { label: '选项三', value: 3 }
]

// ✅ 字符串类型
const selectedCode = ref<string | null>(null)
const codeOptions = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '广州', value: 'guangzhou' }
]

// ✅ 对象类型
interface User {
  id: number
  name: string
}

const selectedUser = ref<User | null>(null)
const userOptions: { label: string; value: User }[] = [
  { label: '张三', value: { id: 1, name: '张三' } },
  { label: '李四', value: { id: 2, name: '李四' } }
]
</script>

<template>
  <!-- ✅ 类型安全，有代码提示 -->
  <Select 
    v-model="selectedId" 
    :options="idOptions"
    placeholder="请选择ID"
  />
  
  <Select 
    v-model="selectedCode" 
    :options="codeOptions"
    placeholder="请选择城市"
  />
  
  <Select 
    v-model="selectedUser" 
    :options="userOptions"
    placeholder="请选择用户"
  />
</template>
```

---

## 5 核心知识点总结

| 知识点 | 说明 | 示例 |
| --- | --- | --- |
| `ref<T>()` | 标注 ref 的类型 | `ref<number>(0)` |
| `reactive<T>()` | 标注 reactive 的类型 | `reactive<State>({...})` |
| `computed` | 自动推导返回类型 | `computed(() => count.value * 2)` |
| `defineProps<T>()` | 基于类型定义 Props | `defineProps<{ title: string }>()` |
| `withDefaults` | 为 Props 设置默认值 | `withDefaults(defineProps<T>(), {...})` |
| `defineEmits<T>()` | 基于类型定义 Emits | `defineEmits<{ change: [value: number] }>()` |
| `generic="T"` | 泛型组件 | `<script setup lang="ts" generic="T">` |
| 事件类型 | DOM 事件的类型 | `MouseEvent`, `KeyboardEvent`, `Event` |

### ref vs reactive 选择建议

| 场景 | 推荐 | 原因 |
| --- | --- | --- |
| 基本类型（string, number, boolean） | `ref` | 简单直接 |
| 单个值 | `ref` | 语义清晰 |
| 复杂对象 | `reactive` | 不需要 `.value`，更方便 |
| 需要整体替换 | `ref` | `reactive` 不能整体替换 |
| 需要保持响应式引用 | `ref` | `reactive` 会丢失响应式 |

---

## 6 新手常见误区

### 误区 1："reactive 可以整体重新赋值"

**错！** `reactive` 不能整体重新赋值，会丢失响应式。

```typescript
// ❌ 错误示例
const state = reactive({ count: 0 })
state = { count: 1 } // 报错：Cannot assign to 'state' because it is a const

// ✅ 正确做法 1：使用 ref
const state = ref({ count: 0 })
state.value = { count: 1 } // 可以整体替换

// ✅ 正确做法 2：修改属性
const state = reactive({ count: 0 })
state.count = 1 // 修改属性
```

### 误区 2："ref 在模板中需要 .value"

**错！** `ref` 在模板中会自动解包，不需要 `.value`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <!-- ❌ 错误：不需要 .value -->
  <p>{{ count.value }}</p>
  
  <!-- ✅ 正确：自动解包 -->
  <p>{{ count }}</p>
  
  <!-- ❌ 错误：不需要 .value -->
  <button @click="count.value++">增加</button>
  
  <!-- ✅ 正确：自动解包 -->
  <button @click="count++">增加</button>
</template>
```

### 误区 3："defineProps 可以用变量"

**错！** `defineProps` 的类型参数必须是静态类型，不能用变量。

```typescript
// ❌ 错误示例
const myType = { title: String }
defineProps(myType) // 报错

// ✅ 正确做法：使用字面量或类型
defineProps<{
  title: string
}>()

// ✅ 或者使用运行时声明
defineProps({
  title: String
})
```

### 误区 4："所有类型都需要手动标注"

**错！** TypeScript 有很强的类型推导能力，很多类型不需要手动标注。

```typescript
// ❌ 过度标注
const count: number = ref<number>(0)
const message: string = ref<string>('hello')

// ✅ 让 TypeScript 自动推导
const count = ref(0) // 自动推导为 Ref<number>
const message = ref('hello') // 自动推导为 Ref<string>

// ✅ 只在必要时手动标注
const status = ref<'loading' | 'success' | 'error'>('loading') // 联合类型需要标注
const user = ref<User | null>(null) // 可能为 null 需要标注
```

### 误区 5："泛型组件太复杂，不要用"

**不是的。** 泛型组件虽然看起来复杂，但在某些场景下非常有用。

```typescript
// 场景：需要一个通用的选择器组件
// 不用泛型：需要为每种类型写一个组件
// 用泛型：一个组件支持所有类型

// ✅ 泛型组件让代码更简洁、更复用
<script setup lang="ts" generic="T">
const props = defineProps<{
  options: { label: string; value: T }[]
  modelValue: T | null
}>()
</script>
```

---

## 7 动手练习

### 练习 1：基础练习 - 为 Todo 列表添加类型

创建一个 Todo 列表组件，要求：
- 定义 `Todo` 接口，包含 `id`、`title`、`completed` 字段
- 使用 `ref` 存储 Todo 列表
- 实现添加、删除、切换完成状态的功能

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// ✅ 定义 Todo 接口
interface Todo {
  id: number
  title: string
  completed: boolean
}

// ✅ 响应式数据
const todos = ref<Todo[]>([])
const newTodoTitle = ref('')
let nextId = 1

// ✅ 计算属性
const completedCount = computed(() => {
  return todos.value.filter(todo => todo.completed).length
})

const totalCount = computed(() => todos.value.length)

// ✅ 添加 Todo
function addTodo() {
  if (newTodoTitle.value.trim() === '') return
  
  todos.value.push({
    id: nextId++,
    title: newTodoTitle.value,
    completed: false
  })
  
  newTodoTitle.value = ''
}

// ✅ 删除 Todo
function removeTodo(id: number) {
  const index = todos.value.findIndex(todo => todo.id === id)
  if (index !== -1) {
    todos.value.splice(index, 1)
  }
}

// ✅ 切换完成状态
function toggleTodo(id: number) {
  const todo = todos.value.find(todo => todo.id === id)
  if (todo) {
    todo.completed = !todo.completed
  }
}
</script>

<template>
  <div>
    <h2>Todo 列表</h2>
    
    <!-- 添加表单 -->
    <form @submit.prevent="addTodo">
      <input 
        v-model="newTodoTitle" 
        placeholder="输入待办事项"
      />
      <button type="submit">添加</button>
    </form>
    
    <!-- 统计信息 -->
    <p>总数: {{ totalCount }}，已完成: {{ completedCount }}</p>
    
    <!-- Todo 列表 -->
    <ul>
      <li v-for="todo in todos" :key="todo.id">
        <input 
          type="checkbox" 
          :checked="todo.completed"
          @change="toggleTodo(todo.id)"
        />
        <span :style="{ textDecoration: todo.completed ? 'line-through' : 'none' }">
          {{ todo.title }}
        </span>
        <button @click="removeTodo(todo.id)">删除</button>
      </li>
    </ul>
  </div>
</template>
```

</details>

### 练习 2：进阶练习 - 创建用户卡片组件

创建一个 `UserCard` 组件，要求：
- 接收 `user` 属性，类型为 `User` 接口
- 接收 `showEmail` 可选属性，默认为 `false`
- 发送 `edit` 事件，携带 `user.id`
- 发送 `delete` 事件，携带 `user.id`

<details>
<summary>点击查看答案</summary>

```vue
<!-- UserCard.vue -->
<script setup lang="ts">
// ✅ 定义 User 接口
interface User {
  id: number
  name: string
  email: string
  avatar: string
}

// ✅ 定义 Props
const props = withDefaults(defineProps<{
  user: User
  showEmail?: boolean
}>(), {
  showEmail: false
})

// ✅ 定义 Emits
const emit = defineEmits<{
  edit: [id: number]
  delete: [id: number]
}>()

// ✅ 处理编辑
function handleEdit() {
  emit('edit', props.user.id)
}

// ✅ 处理删除
function handleDelete() {
  emit('delete', props.user.id)
}
</script>

<template>
  <div class="user-card">
    <img :src="user.avatar" :alt="user.name" />
    <h3>{{ user.name }}</h3>
    <p v-if="showEmail">{{ user.email }}</p>
    <div>
      <button @click="handleEdit">编辑</button>
      <button @click="handleDelete">删除</button>
    </div>
  </div>
</template>
```

```vue
<!-- 父组件使用 -->
<script setup lang="ts">
import UserCard from './UserCard.vue'

const user = {
  id: 1,
  name: '张三',
  email: 'zhangsan@example.com',
  avatar: 'https://example.com/avatar.jpg'
}

function handleEdit(id: number) {
  console.log('编辑用户:', id)
}

function handleDelete(id: number) {
  console.log('删除用户:', id)
}
</script>

<template>
  <UserCard 
    :user="user" 
    :show-email="true"
    @edit="handleEdit"
    @delete="handleDelete"
  />
</template>
```

</details>

### 练习 3（挑战）：综合练习 - 泛型数据表格组件

创建一个泛型的数据表格组件 `DataTable`，要求：
- 接收泛型数据数组 `data: T[]`
- 接收列定义 `columns`，每列包含 `key`（T 的字段名）和 `label`（显示名称）
- 自动渲染表格

<details>
<summary>点击查看答案</summary>

```vue
<!-- DataTable.vue -->
<script setup lang="ts" generic="T">
// ✅ 定义列接口
interface Column<T> {
  key: keyof T // 必须是 T 的字段名
  label: string
}

// ✅ 定义 Props
const props = defineProps<{
  data: T[]
  columns: Column<T>[]
}>()
</script>

<template>
  <table>
    <thead>
      <tr>
        <th v-for="column in columns" :key="String(column.key)">
          {{ column.label }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, index) in data" :key="index">
        <td v-for="column in columns" :key="String(column.key)">
          {{ row[column.key] }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
```

```vue
<!-- 父组件使用 -->
<script setup lang="ts">
import { ref } from 'vue'
import DataTable from './DataTable.vue'

// ✅ 定义用户类型
interface User {
  id: number
  name: string
  age: number
  email: string
}

// ✅ 用户数据
const users = ref<User[]>([
  { id: 1, name: '张三', age: 25, email: 'zhangsan@example.com' },
  { id: 2, name: '李四', age: 30, email: 'lisi@example.com' },
  { id: 3, name: '王五', age: 28, email: 'wangwu@example.com' }
])

// ✅ 列定义 - 有类型提示，key 只能是 User 的字段名
const columns = [
  { key: 'id' as const, label: 'ID' },
  { key: 'name' as const, label: '姓名' },
  { key: 'age' as const, label: '年龄' },
  { key: 'email' as const, label: '邮箱' }
]
</script>

<template>
  <DataTable :data="users" :columns="columns" />
</template>
```

</details>

---

## 下一章预告

恭喜你完成了 TypeScript 系列教程的最后一章！

通过本章学习，你掌握了在 Vue 3 中使用 TypeScript 的核心技能：
- 为响应式数据标注类型
- 为组件的 Props 和 Emits 定义类型
- 为 API 请求定义类型安全的接口
- 创建可复用的泛型组件

**下一步学习建议：**
- 在实际项目中应用这些知识
- 阅读 Vue 3 官方文档的 TypeScript 章节
- 学习更多高级类型技巧，如条件类型、映射类型等
- 探索 Vue 3 的类型定义源码，深入理解原理

TypeScript 是一个强大的工具，能让你的 Vue 应用更安全、更可维护。继续实践，你会越来越熟练！
