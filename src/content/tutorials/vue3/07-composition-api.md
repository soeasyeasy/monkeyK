---
title: '第七章：组合式 API'
description: '深入理解 setup 语法糖和组合式 API 的原理与实战'
---

# 第七章：组合式 API

## 本章导读

前面我们一直在用 `<script setup>` 写代码，但你有没有想过：

- 为什么 Vue 3 要引入组合式 API？选项式 API 不好用吗？
- `<script setup>` 到底是什么？和普通的 `<script>` 有什么区别？
- `defineProps`、`defineEmits` 这些宏是怎么工作的？
- 怎么在组件之间传递数据和事件？

这一章我们会彻底搞懂组合式 API 的原理和各种用法，让你写出更优雅、更易维护的代码。

---

## 1 为什么需要组合式 API？

### 选项式 API 的痛点

Vue 2 使用的是"选项式 API"，代码按 `data`、`methods`、`computed` 这些选项分类组织：

```javascript
// Vue 2 选项式 API
export default {
  data() {
    return {
      user: { name: '张三', age: 25 },
      cart: [],
      formData: { email: '', password: '' },
    }
  },
  computed: {
    userName() {
      return this.user.name
    },
    totalPrice() {
      return this.cart.reduce((sum, item) => sum + item.price, 0)
    },
    isFormValid() {
      return this.formData.email.includes('@') && this.formData.password.length >= 6
    },
  },
  methods: {
    updateUserName(name) {
      this.user.name = name
    },
    addToCart(item) {
      this.cart.push(item)
    },
    submitForm() {
      if (this.isFormValid) {
        console.log('提交表单', this.formData)
      }
    },
  },
}
```

问题很明显：

- **相关代码分散**：用户相关的逻辑散落在 `data`、`computed`、`methods` 中
- **组件变大时难以维护**：一个功能要在多个选项里跳来跳去
- **代码复用困难**：想复用一段逻辑，要拆成 `data`、`methods` 等多部分

### 组合式 API 的解决方案

Vue 3 的组合式 API 让你按"功能"组织代码，而不是按"选项类型"：

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// ========== 用户相关逻辑 ==========
const user = ref({ name: '张三', age: 25 })
const userName = computed(() => user.value.name)
const updateUserName = (name: string) => {
  user.value.name = name
}

// ========== 购物车相关逻辑 ==========
const cart = ref<{ id: number; name: string; price: number }[]>([])
const totalPrice = computed(() => cart.value.reduce((sum, item) => sum + item.price, 0))
const addToCart = (item: { id: number; name: string; price: number }) => {
  cart.value.push(item)
}

// ========== 表单相关逻辑 ==========
const formData = ref({ email: '', password: '' })
const isFormValid = computed(
  () => formData.value.email.includes('@') && formData.value.password.length >= 6,
)
const submitForm = () => {
  if (isFormValid.value) {
    console.log('提交表单', formData.value)
  }
}
</script>
```

> **一句话总结**：组合式 API 让你按"功能"组织代码，相关逻辑放在一起，更好理解和维护。

---

## 2 核心原理

### `<script setup>` 是什么？

`<script setup>` 是 Vue 3 的编译时语法糖，它做了两件事：

1. **自动暴露顶层绑定**：你在 `<script setup>` 里定义的变量和函数，可以直接在模板中使用，不需要 `return`
2. **简化组件逻辑**：不用写 `export default`，不用分 `data`、`methods` 等选项

```vue
<!-- 方式 1：普通 <script> -->
<script lang="ts">
import { ref } from 'vue'

export default {
  setup() {
    const count = ref(0)

    // 必须 return 才能在模板中使用
    return { count }
  },
}
</script>

<!-- 方式 2：<script setup>（推荐） -->
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

// 自动暴露，不需要 return
</script>
```

> **类比**：`<script setup>` 像一个"自动导出器"——你定义的东西自动就能在模板里用了。

### 编译器宏

`defineProps`、`defineEmits`、`defineExpose` 是编译器宏，不需要导入：

```vue
<script setup lang="ts">
// ❌ 不需要导入这些宏
// import { defineProps, defineEmits } from 'vue'

// ✅ 直接使用
const props = defineProps<{ title: string }>()
const emit = defineEmits<{ change: [value: string] }>()
</script>
```

> **原理**：这些宏在编译时会被 Vue 编译器特殊处理，转换成实际的代码。

---

## 3 基础用法

### 定义响应式状态和方法

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// 响应式状态
const count = ref(0)
const message = ref('Hello')

// 计算属性
const doubleCount = computed(() => count.value * 2)

// 方法
const increment = () => {
  count.value++
}
</script>

<template>
  <p>{{ message }}</p>
  <p>{{ count }} - {{ doubleCount }}</p>
  <button @click="increment">+1</button>
</template>
```

> **原理**：`<script setup>` 里的所有顶层绑定（变量、函数、导入的组件等）都会自动暴露给模板。

### 导入组件和指令

```vue
<script setup lang="ts">
import { ref } from 'vue'
import MyComponent from './MyComponent.vue'
import { vFocus } from './directives/focus'

const inputText = ref('')
</script>

<template>
  <!-- 导入的组件可以直接使用 -->
  <MyComponent />

  <!-- 导入的指令可以直接使用 -->
  <input v-focus v-model="inputText" />
</template>
```

> **原理**：导入的组件和指令也会自动暴露给模板，不需要额外注册。

---

## 4 进阶用法

### defineProps：定义组件属性

`defineProps` 用于声明组件接收的属性（props）。

#### 运行时声明

```vue
<!-- 子组件 Child.vue -->
<script setup lang="ts">
// 运行时声明（不推荐）
const props = defineProps({
  title: String,
  count: {
    type: Number,
    default: 0,
  },
})
</script>

<template>
  <h1>{{ props.title }}</h1>
  <p>计数：{{ props.count }}</p>
</template>
```

#### TypeScript 类型声明（推荐）

```vue
<!-- 子组件 Child.vue -->
<script setup lang="ts">
// 定义 Props 接口
interface Props {
  title?: string
  count: number
  items: string[]
}

// 使用泛型声明
const props = defineProps<Props>()

// 带默认值
const props = withDefaults(defineProps<Props>(), {
  count: 0,
  title: '默认标题',
})
</script>

<template>
  <h1>{{ props.title }}</h1>
  <p>计数：{{ props.count }}</p>
  <ul>
    <li v-for="item in props.items" :key="item">{{ item }}</li>
  </ul>
</template>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
import Child from './Child.vue'
</script>

<template>
  <Child title="Hello" :count="5" :items="['Vue', 'React']" />
</template>
```

> **原理**：`defineProps` 是编译器宏，Vue 编译器会把它转换成实际的 props 定义代码。

### defineEmits：定义组件事件

`defineEmits` 用于声明组件可以触发的事件。

```vue
<!-- 子组件 Child.vue -->
<script setup lang="ts">
// TypeScript 类型声明
const emit = defineEmits<{
  change: [value: string]
  update: [id: number, name: string]
}>()

const handleClick = () => {
  // 触发事件，传递参数
  emit('change', 'new value')
  emit('update', 1, '张三')
}
</script>

<template>
  <button @click="handleClick">触发事件</button>
</template>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
import Child from './Child.vue'

const handleChange = (value: string) => {
  console.log('change:', value)
}

const handleUpdate = (id: number, name: string) => {
  console.log('update:', id, name)
}
</script>

<template>
  <Child @change="handleChange" @update="handleUpdate" />
</template>
```

> **原理**：`defineEmits` 声明了组件可以触发哪些事件，父组件用 `@事件名` 监听。

### defineExpose：暴露组件属性

默认情况下，`<script setup>` 中的内容对外部是封闭的。用 `defineExpose` 可以显式暴露属性：

```vue
<!-- 子组件 Child.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const publicCount = ref(0)
const privateCount = ref(0)

const publicMethod = () => {
  console.log('公开方法')
}

// 显式暴露指定的属性
defineExpose({
  publicCount,
  publicMethod,
})
</script>

<template>
  <p>{{ publicCount }} - {{ privateCount }}</p>
</template>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
import { ref } from 'vue'
import Child from './Child.vue'

const childRef = ref()

const handleClick = () => {
  // 只能访问 exposed 的属性
  console.log(childRef.value.publicCount)
  childRef.value.publicMethod()

  // ❌ 无法访问 privateCount
  // console.log(childRef.value.privateCount)
}
</script>

<template>
  <Child ref="childRef" />
  <button @click="handleClick">访问子组件</button>
</template>
```

> **原理**：`defineExpose` 控制父组件通过 `ref` 能访问子组件的哪些属性和方法。

---

## 5 核心知识点总结

| 特性             | 说明             | 优势                     |
| ---------------- | ---------------- | ------------------------ |
| `<script setup>` | 编译时语法糖     | 更简洁，自动暴露顶层绑定 |
| `defineProps`    | 声明 props       | 类型安全，自动推导       |
| `defineEmits`    | 声明 emits       | 明确事件契约             |
| `defineExpose`   | 暴露组件属性     | 控制外部访问             |
| 按逻辑关注点组织 | 相关代码放在一起 | 更好理解和维护           |

---

## 6 新手常见误区

### 误区 1："`<script setup>` 里定义的变量要 return 才能在模板用"

**不需要！**

`<script setup>` 会自动暴露所有顶层绑定，不需要 `return`：

```vue
<!-- ❌ 错误：不需要 return -->
<script setup lang="ts">
const count = ref(0)
return { count }
</script>

<!-- ✅ 正确：直接定义就能用 -->
<script setup lang="ts">
const count = ref(0)
</script>
```

### 误区 2："defineProps 需要导入"

**不需要！**

`defineProps`、`defineEmits`、`defineExpose` 是编译器宏，不需要导入：

```vue
<!-- ❌ 错误：不需要导入 -->
<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
const props = defineProps<{ title: string }>()
</script>

<!-- ✅ 正确：直接使用 -->
<script setup lang="ts">
const props = defineProps<{ title: string }>()
</script>
```

### 误区 3："props 可以直接修改"

**不能！**

props 是只读的，不能直接修改。如果需要修改，用 `computed` 或 `emit` 通知父组件：

```vue
<script setup lang="ts">
const props = defineProps<{ count: number }>()

// ❌ 错误：不能直接修改 props
props.count++

// ✅ 正确：用 computed 派生新值
import { computed } from 'vue'
const doubleCount = computed(() => props.count * 2)

// ✅ 正确：用 emit 通知父组件修改
const emit = defineEmits<{ update: [value: number] }>()
const increment = () => emit('update', props.count + 1)
</script>
```

### 误区 4："子组件的所有属性父组件都能访问"

**不是！**

默认情况下，`<script setup>` 中的内容对外部是封闭的。父组件通过 `ref` 只能访问 `defineExpose` 暴露的属性：

```vue
<!-- 子组件 -->
<script setup lang="ts">
import { ref } from 'vue'

const publicData = ref('公开')
const privateData = ref('私有')

// 只暴露 publicData
defineExpose({ publicData })
</script>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
import { ref } from 'vue'
import Child from './Child.vue'

const childRef = ref()

const handleClick = () => {
  console.log(childRef.value.publicData) // ✅ 可以访问
  console.log(childRef.value.privateData) // ❌ 无法访问
}
</script>
```

### 误区 5："组合式 API 比选项式 API 难"

**不难！**

组合式 API 只是换了一种组织代码的方式。核心概念（响应式、计算属性、生命周期）是一样的。对于新项目，推荐直接用组合式 API，不用学旧写法。

---

## 7 动手练习

### 练习 1：计数器组件

创建一个计数器组件，支持自定义初始值和步长。

<details>
<summary>点击查看答案</summary>

```vue
<!-- Counter.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

// 定义 props
interface Props {
  initialValue?: number
  step?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialValue: 0,
  step: 1,
})

// 定义 emits
const emit = defineEmits<{
  change: [value: number]
}>()

// 响应式状态
const count = ref(props.initialValue)

// 方法
const increment = () => {
  count.value += props.step
  emit('change', count.value)
}

const decrement = () => {
  count.value -= props.step
  emit('change', count.value)
}
</script>

<template>
  <div>
    <button @click="decrement">-{{ step }}</button>
    <span>{{ count }}</span>
    <button @click="increment">+{{ step }}</button>
  </div>
</template>
```

```vue
<!-- 使用 -->
<script setup lang="ts">
import Counter from './Counter.vue'

const handleChange = (value: number) => {
  console.log('计数变化：', value)
}
</script>

<template>
  <Counter :initial-value="10" :step="5" @change="handleChange" />
</template>
```

</details>

### 练习 2：用户信息卡片

创建一个用户信息卡片组件，显示用户姓名和年龄，支持编辑。

<details>
<summary>点击查看答案</summary>

```vue
<!-- UserCard.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

// 定义 props
interface Props {
  name: string
  age: number
}

const props = defineProps<Props>()

// 定义 emits
const emit = defineEmits<{
  update: [field: string, value: any]
}>()

// 编辑状态
const isEditing = ref(false)

// 表单数据
const editName = ref(props.name)
const editAge = ref(props.age)

// 保存
const save = () => {
  emit('update', 'name', editName.value)
  emit('update', 'age', editAge.value)
  isEditing.value = false
}

// 取消
const cancel = () => {
  editName.value = props.name
  editAge.value = props.age
  isEditing.value = false
}
</script>

<template>
  <div>
    <div v-if="!isEditing">
      <h3>{{ name }}</h3>
      <p>年龄：{{ age }}</p>
      <button @click="isEditing = true">编辑</button>
    </div>

    <div v-else>
      <input v-model="editName" placeholder="姓名" />
      <input v-model.number="editAge" type="number" placeholder="年龄" />
      <button @click="save">保存</button>
      <button @click="cancel">取消</button>
    </div>
  </div>
</template>
```

```vue
<!-- 使用 -->
<script setup lang="ts">
import { ref } from 'vue'
import UserCard from './UserCard.vue'

const user = ref({
  name: '张三',
  age: 25,
})

const handleUpdate = (field: string, value: any) => {
  user.value[field as keyof typeof user.value] = value
}
</script>

<template>
  <UserCard :name="user.name" :age="user.age" @update="handleUpdate" />
</template>
```

</details>

### 练习 3（挑战）：待办事项组件

创建一个待办事项组件，支持添加、删除、切换完成状态。

<details>
<summary>点击查看答案</summary>

```vue
<!-- TodoList.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

// 定义接口
interface Todo {
  id: number
  text: string
  done: boolean
}

// 响应式状态
const todos = ref<Todo[]>([])
const newTodo = ref('')
let nextId = 1

// 计算属性
const activeCount = computed(() => todos.value.filter((t) => !t.done).length)

const doneCount = computed(() => todos.value.filter((t) => t.done).length)

// 方法
const addTodo = () => {
  if (!newTodo.value.trim()) return
  todos.value.push({
    id: nextId++,
    text: newTodo.value,
    done: false,
  })
  newTodo.value = ''
}

const removeTodo = (id: number) => {
  todos.value = todos.value.filter((t) => t.id !== id)
}

const toggleTodo = (id: number) => {
  const todo = todos.value.find((t) => t.id === id)
  if (todo) todo.done = !todo.done
}

// 暴露方法给父组件
defineExpose({
  addTodo,
  removeTodo,
})
</script>

<template>
  <div>
    <!-- 添加表单 -->
    <form @submit.prevent="addTodo">
      <input v-model="newTodo" placeholder="添加待办..." />
      <button type="submit">添加</button>
    </form>

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

    <!-- 统计 -->
    <p v-if="todos.length > 0">已完成：{{ doneCount }}，未完成：{{ activeCount }}</p>
  </div>
</template>
```

```vue
<!-- 使用 -->
<script setup lang="ts">
import { ref } from 'vue'
import TodoList from './TodoList.vue'

const todoListRef = ref()

const handleAddFromParent = () => {
  // 通过 ref 调用子组件方法
  todoListRef.value?.addTodo()
}
</script>

<template>
  <TodoList ref="todoListRef" />
  <button @click="handleAddFromParent">从父组件添加</button>
</template>
```

</details>

---

## 下一章预告

下一章我们会学习 Vue 的**生命周期**——也就是组件从创建到销毁的整个过程。你会学到 `onMounted`、`onUpdated`、`onUnmounted` 等生命周期钩子，以及怎么在这些钩子里执行副作用操作。
