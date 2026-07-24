---
title: '第八章：组件基础'
description: '深入掌握 Vue 3 组件的注册、通信和基础用法'
---

# 第八章：组件基础

## 本章导读

前面我们学会了怎么在一个组件里写代码，但真实项目不可能把所有代码都塞在一个文件里。我们需要把页面拆分成一个个"组件"——比如导航栏、按钮、卡片——然后像搭积木一样组合起来。

你可能会问：

- 组件到底是什么？和 HTML 标签有什么区别？
- 怎么在组件之间传递数据？
- 全局注册和局部注册有什么区别？
- `provide/inject` 是什么？什么时候用？

这一章我们会彻底搞懂组件的注册方式和通信机制，让你能构建模块化的大型应用。

---

## 8.1 为什么需要组件？

### 痛点分析

假设你要做一个电商网站，页面有导航栏、商品列表、购物车、页脚。如果所有代码都写在一个文件里：

```vue
<!-- App.vue - 所有代码挤在一起 -->
<template>
  <div>
    <!-- 导航栏 100 行 -->
    <!-- 商品列表 200 行 -->
    <!-- 购物车 150 行 -->
    <!-- 页脚 50 行 -->
  </div>
</template>

<script setup lang="ts">
// 导航栏逻辑 100 行
// 商品列表逻辑 200 行
// 购物车逻辑 150 行
// 页脚逻辑 50 行
</script>
```

问题很明显：

- **代码难以维护**：一个文件几千行，找代码像大海捞针
- **无法复用**：导航栏在多个页面都要用，难道每个页面都复制一遍？
- **团队协作困难**：多人改同一个文件，冲突不断

### Vue 的解决方案：组件化

Vue 让你把页面拆分成独立的组件，每个组件有自己的逻辑和样式：

```
App.vue
├── NavBar.vue（导航栏）
├── ProductList.vue（商品列表）
│   └── ProductCard.vue（商品卡片）
├── ShoppingCart.vue（购物车）
└── Footer.vue（页脚）
```

```vue
<!-- App.vue - 组合组件 -->
<template>
  <div>
    <NavBar />
    <ProductList />
    <ShoppingCart />
    <Footer />
  </div>
</template>
```

> **一句话总结**：组件化让你可以"分而治之"——把复杂页面拆成小块，每块独立开发、测试、复用。

---

## 8.2 核心原理

### 组件是什么？

组件本质上是一个"可复用的 UI 单元"。它有自己的：

- **模板**（HTML）：定义长什么样
- **逻辑**（JS/TS）：定义行为
- **样式**（CSS）：定义外观

> **类比**：组件像乐高积木——每个积木都是独立的，你可以用它们搭出各种东西。

### 组件通信

组件之间需要传递数据，Vue 提供了多种通信方式：

| 方式           | 方向        | 场景                   |
| -------------- | ----------- | ---------------------- |
| Props          | 父 → 子     | 父组件向子组件传递数据 |
| Emits          | 子 → 父     | 子组件向父组件发送事件 |
| provide/inject | 祖先 → 后代 | 跨层级组件通信         |

---

## 8.3 基础用法

### 组件注册

#### 全局注册

全局注册的组件可以在整个应用的任何地方使用：

```typescript
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import MyButton from './components/MyButton.vue'

const app = createApp(App)

// 全局注册
app.component('MyButton', MyButton)

app.mount('#app')
```

```vue
<!-- 任意组件中使用 -->
<template>
  <MyButton>点击我</MyButton>
</template>
```

> **适用场景**：通用基础组件（如按钮、输入框），在整个应用中频繁使用。

#### 局部注册（推荐）

局部注册的组件只在当前组件中可用：

```vue
<script setup lang="ts">
// 导入组件
import MyButton from './components/MyButton.vue'
import MyInput from './components/MyInput.vue'
</script>

<template>
  <!-- 只能在当前组件中使用 -->
  <MyButton>按钮</MyButton>
  <MyInput v-model="text" />
</template>
```

> **优势**：按需引入，支持 Tree-shaking（未使用的组件不会被打包），减小包体积。

---

## 8.4 进阶用法

### Props：父组件向子组件传递数据

```vue
<!-- UserCard.vue - 子组件 -->
<script setup lang="ts">
// 定义 Props 接口
interface Props {
  name: string
  age: number
  email?: string
}

// 声明 props，带默认值
const props = withDefaults(defineProps<Props>(), {
  email: '未提供',
})
</script>

<template>
  <div class="user-card">
    <h3>{{ props.name }}</h3>
    <p>年龄：{{ props.age }}</p>
    <p>邮箱：{{ props.email }}</p>
  </div>
</template>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
import UserCard from './UserCard.vue'
</script>

<template>
  <!-- 传递 props -->
  <UserCard name="张三" :age="25" />
  <UserCard name="李四" :age="30" email="lisi@example.com" />
</template>
```

> **原理**：Props 是单向数据流——父组件的数据变化会自动同步到子组件，但子组件不能直接修改 props。

### Props 验证

```vue
<script setup lang="ts">
// 运行时验证
const props = defineProps({
  // 基础类型检查
  name: String,

  // 多个可能的类型
  id: [String, Number],

  // 必填 + 类型
  title: {
    type: String,
    required: true,
  },

  // 带默认值的对象
  config: {
    type: Object,
    default: () => ({ theme: 'light' }),
  },

  // 自定义验证函数
  age: {
    type: Number,
    validator: (value: number) => value >= 0 && value <= 150,
  },
})
</script>
```

> **原理**：Props 验证在开发模式下会检查传入的值是否符合要求，不符合会在控制台警告。

### Emits：子组件向父组件发送事件

```vue
<!-- SearchBox.vue - 子组件 -->
<script setup lang="ts">
import { ref } from 'vue'

const keyword = ref('')

// 声明可以触发的事件
const emit = defineEmits<{
  search: [keyword: string]
  clear: []
}>()

const handleSearch = () => {
  emit('search', keyword.value)
}

const handleClear = () => {
  keyword.value = ''
  emit('clear')
}
</script>

<template>
  <div>
    <input v-model="keyword" placeholder="搜索..." />
    <button @click="handleSearch">搜索</button>
    <button @click="handleClear">清除</button>
  </div>
</template>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
import SearchBox from './SearchBox.vue'

const handleSearch = (keyword: string) => {
  console.log('搜索关键词：', keyword)
}

const handleClear = () => {
  console.log('已清除')
}
</script>

<template>
  <!-- 监听子组件的事件 -->
  <SearchBox @search="handleSearch" @clear="handleClear" />
</template>
```

> **原理**：Emits 声明了组件可以触发哪些事件，父组件用 `@事件名` 监听。

### v-model 在组件上

`v-model` 不仅能用在原生表单元素上，还能用在自定义组件上：

```vue
<!-- CustomInput.vue -->
<script setup lang="ts">
// 接收 modelValue prop
const props = defineProps<{
  modelValue: string
}>()

// 触发 update:modelValue 事件
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <input
    :value="props.modelValue"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
import { ref } from 'vue'
import CustomInput from './CustomInput.vue'

const text = ref('')
</script>

<template>
  <!-- 在组件上使用 v-model -->
  <CustomInput v-model="text" />
  <p>{{ text }}</p>
</template>
```

> **原理**：组件上的 `v-model` 等价于 `:modelValue` + `@update:modelValue`。

### 多个 v-model

一个组件可以有多个 `v-model`：

```vue
<!-- UserName.vue -->
<script setup lang="ts">
const props = defineProps<{
  firstName: string
  lastName: string
}>()

const emit = defineEmits<{
  'update:firstName': [value: string]
  'update:lastName': [value: string]
}>()
</script>

<template>
  <input
    :value="props.firstName"
    @input="emit('update:firstName', ($event.target as HTMLInputElement).value)"
    placeholder="名"
  />
  <input
    :value="props.lastName"
    @input="emit('update:lastName', ($event.target as HTMLInputElement).value)"
    placeholder="姓"
  />
</template>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
import { ref } from 'vue'
import UserName from './UserName.vue'

const firstName = ref('')
const lastName = ref('')
</script>

<template>
  <!-- 多个 v-model -->
  <UserName v-model:firstName="firstName" v-model:lastName="lastName" />
  <p>姓名：{{ lastName }}{{ firstName }}</p>
</template>
```

### provide/inject：跨层级通信

当组件嵌套很深时，用 Props 逐层传递很麻烦。`provide/inject` 可以让祖先组件直接向后代组件传递数据：

```vue
<!-- 祖先组件 App.vue -->
<script setup lang="ts">
import { provide, ref } from 'vue'

const theme = ref('light')
const user = ref({ name: '张三', role: 'admin' })

// 提供数据
provide('theme', theme)
provide('user', user)
</script>

<template>
  <ChildComponent />
</template>
```

```vue
<!-- 后代组件 DeepChild.vue -->
<script setup lang="ts">
import { inject } from 'vue'
import type { Ref } from 'vue'

// 注入数据
const theme = inject<Ref<string>>('theme')
const user = inject<{ name: string; role: string }>('user')

// 提供默认值
const fallbackTheme = inject('theme', 'light')
</script>

<template>
  <p>主题：{{ theme }}</p>
  <p>用户：{{ user?.name }}</p>
</template>
```

> **原理**：`provide` 在祖先组件中提供数据，`inject` 在后代组件中注入数据，无论中间隔了多少层。

### Attribute 透传

当组件有单个根节点时，父组件传递的 `class`、`style`、事件监听器等会自动透传到根元素：

```vue
<!-- MyButton.vue -->
<template>
  <!-- 自动接收 class、style、@click 等 -->
  <button class="btn">
    <slot />
  </button>
</template>
```

```vue
<!-- 父组件 -->
<template>
  <!-- class 和 @click 会自动透传到 button 上 -->
  <MyButton class="primary" @click="handleClick">点击</MyButton>
</template>
```

> **原理**：Vue 会自动把父组件传递的非 Props 属性（称为 `attrs`）透传到子组件的根元素。

---

## 8.5 核心知识点总结

| 注册方式       | 作用域        | 使用场景                   |
| -------------- | ------------- | -------------------------- |
| 全局注册       | 整个应用      | 通用基础组件               |
| 局部注册       | 当前组件      | 按需引入，Tree-shaking     |
| Props          | 父 → 子       | 父组件向子组件传递数据     |
| Emits          | 子 → 父       | 子组件向父组件发送事件     |
| provide/inject | 祖先 → 后代   | 跨层级组件通信             |
| v-model        | 双向绑定      | 组件的双向数据绑定         |
| Attribute 透传 | 父 → 子根元素 | class、style、事件自动传递 |

---

## 8.6 新手常见误区

### 误区 1："组件名必须用 PascalCase"

**不是！**

组件名可以用 PascalCase（`MyButton`）或 kebab-case（`my-button`），但在模板中推荐用 PascalCase，和 HTML 元素区分开：

```vue
<!-- ✅ 推荐：PascalCase -->
<MyButton />

<!-- ✅ 也可以：kebab-case -->
<my-button />
```

### 误区 2："子组件可以直接修改 props"

**不能！**

Props 是只读的，子组件不能直接修改 props。如果需要修改，用 `emit` 通知父组件：

```vue
<script setup lang="ts">
const props = defineProps<{ count: number }>()

// ❌ 错误：不能直接修改 props
props.count++

// ✅ 正确：用 emit 通知父组件
const emit = defineEmits<{ update: [value: number] }>()
const increment = () => emit('update', props.count + 1)
</script>
```

### 误区 3："全局注册比局部注册好"

**不一定！**

全局注册虽然方便，但会导致所有组件都被打包，即使某些组件只在少数地方使用。局部注册支持 Tree-shaking，未使用的组件不会被打包。

**建议**：通用基础组件（如按钮、输入框）用全局注册，其他组件用局部注册。

### 误区 4："provide/inject 可以替代所有 Props"

**不能！**

`provide/inject` 适合跨层级传递"全局"数据（如主题、用户信息），但不适合传递"局部"数据。Props 更明确、更易追踪，优先用 Props。

### 误区 5："组件的 v-model 只能绑定一个值"

**可以绑定多个！**

Vue 3 支持多个 `v-model`，每个绑定不同的属性：

```vue
<UserName v-model:firstName="firstName" v-model:lastName="lastName" />
```

---

## 8.7 动手练习

### 练习 1：按钮组件

创建一个可复用的按钮组件，支持自定义文本、类型（primary/success/danger）。

<details>
<summary>点击查看答案</summary>

```vue
<!-- MyButton.vue -->
<script setup lang="ts">
interface Props {
  type?: 'primary' | 'success' | 'danger'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  disabled: false,
})

const emit = defineEmits<{
  click: []
}>()

const handleClick = () => {
  if (!props.disabled) {
    emit('click')
  }
}
</script>

<template>
  <button :class="['btn', `btn-${type}`]" :disabled="disabled" @click="handleClick">
    <slot />
  </button>
</template>

<style scoped>
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-primary {
  background: #007bff;
  color: white;
}
.btn-success {
  background: #28a745;
  color: white;
}
.btn-danger {
  background: #dc3545;
  color: white;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

```vue
<!-- 使用 -->
<script setup lang="ts">
import MyButton from './MyButton.vue'

const handleClick = () => {
  console.log('按钮被点击')
}
</script>

<template>
  <MyButton type="primary" @click="handleClick">主要按钮</MyButton>
  <MyButton type="success">成功按钮</MyButton>
  <MyButton type="danger" disabled>禁用按钮</MyButton>
</template>
```

</details>

### 练习 2：用户列表组件

创建一个用户列表组件，接收用户数组作为 props，显示用户信息。

<details>
<summary>点击查看答案</summary>

```vue
<!-- UserList.vue -->
<script setup lang="ts">
interface User {
  id: number
  name: string
  age: number
  email: string
}

interface Props {
  users: User[]
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '用户列表',
})

const emit = defineEmits<{
  select: [user: User]
}>()
</script>

<template>
  <div>
    <h2>{{ title }}</h2>
    <ul>
      <li v-for="user in users" :key="user.id" @click="emit('select', user)">
        {{ user.name }} - {{ user.age }}岁 - {{ user.email }}
      </li>
    </ul>
    <p v-if="users.length === 0">暂无用户</p>
  </div>
</template>
```

```vue
<!-- 使用 -->
<script setup lang="ts">
import { ref } from 'vue'
import UserList from './UserList.vue'

const users = ref([
  { id: 1, name: '张三', age: 25, email: 'zhangsan@example.com' },
  { id: 2, name: '李四', age: 30, email: 'lisi@example.com' },
])

const handleSelect = (user: any) => {
  console.log('选中用户：', user)
}
</script>

<template>
  <UserList :users="users" title="团队成员" @select="handleSelect" />
</template>
```

</details>

### 练习 3（挑战）：主题切换系统

用 `provide/inject` 实现一个主题切换系统，祖先组件提供主题，后代组件注入并使用。

<details>
<summary>点击查看答案</summary>

```vue
<!-- App.vue - 祖先组件 -->
<script setup lang="ts">
import { provide, ref } from 'vue'
import ThemeToggle from './ThemeToggle.vue'
import ThemedCard from './ThemedCard.vue'

const theme = ref<'light' | 'dark'>('light')

// 提供主题
provide('theme', theme)

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}
</script>

<template>
  <div :class="theme">
    <ThemeToggle @toggle="toggleTheme" />
    <ThemedCard title="卡片 1" content="这是内容" />
    <ThemedCard title="卡片 2" content="这是内容" />
  </div>
</template>

<style>
.light {
  background: white;
  color: black;
}
.dark {
  background: #333;
  color: white;
}
</style>
```

```vue
<!-- ThemeToggle.vue -->
<script setup lang="ts">
const emit = defineEmits<{
  toggle: []
}>()
</script>

<template>
  <button @click="emit('toggle')">切换主题</button>
</template>
```

```vue
<!-- ThemedCard.vue - 后代组件 -->
<script setup lang="ts">
import { inject } from 'vue'
import type { Ref } from 'vue'

interface Props {
  title: string
  content: string
}

const props = defineProps<Props>()

// 注入主题
const theme = inject<Ref<'light' | 'dark'>>('theme')
</script>

<template>
  <div :class="['card', `card-${theme}`]">
    <h3>{{ title }}</h3>
    <p>{{ content }}</p>
    <small>当前主题：{{ theme }}</small>
  </div>
</template>

<style scoped>
.card {
  padding: 16px;
  margin: 8px;
  border-radius: 8px;
}
.card-light {
  background: #f0f0f0;
}
.card-dark {
  background: #555;
}
</style>
```

</details>

---

## 下一章预告

下一章我们会学习 Vue 的**插槽和动态组件**——也就是怎么在组件中分发内容，以及怎么动态切换组件。你会学到默认插槽、具名插槽、作用域插槽，以及 `<component :is="...">` 的用法。
