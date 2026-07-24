---
title: "第七章：组合式 API"
description: "深入理解 setup 语法糖和组合式 API 的使用方式"
---

# 第七章：组合式 API

## 运行结果

| 特性 | 说明 | 优势 |
| --- | --- | --- |
| `<script setup>` | 编译时语法糖 | 更简洁，自动暴露顶层绑定 |
| `setup()` 函数 | 组件逻辑入口 | 灵活组织响应式状态 |
| `defineProps` | 声明 props | 类型安全，自动推导 |
| `defineEmits` | 声明 emits | 明确事件契约 |
| `defineExpose` | 暴露组件属性 | 控制外部访问 |

## 代码示例

### 1. setup 语法糖基础

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

// 顶层绑定自动暴露给模板
</script>

<template>
  <p>{{ message }}</p>
  <p>{{ count }} - {{ doubleCount }}</p>
  <button @click="increment">+1</button>
</template>
```

### 2. 导入组件和指令

```vue
<script setup lang="ts">
import { ref } from 'vue'
import MyComponent from './MyComponent.vue'
import { vFocus } from './directives/focus'

const inputText = ref('')
</script>

<template>
  <input v-focus v-model="inputText" />
  <MyComponent />
</template>
```

### 3. defineProps 定义属性

```vue
<!-- 子组件 Child.vue -->
<script setup lang="ts">
// 运行时声明
const props = defineProps({
  title: String,
  count: {
    type: Number,
    default: 0
  }
})

// TypeScript 类型声明（推荐）
interface Props {
  title?: string
  count: number
  items: string[]
}

const props = defineProps<Props>()

// 带默认值
const props = withDefaults(defineProps<Props>(), {
  count: 0,
  title: '默认标题'
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

### 4. defineEmits 定义事件

```vue
<!-- 子组件 Child.vue -->
<script setup lang="ts">
// 运行时声明
const emit = defineEmits(['change', 'update'])

// TypeScript 类型声明（推荐）
const emit = defineEmits<{
  change: [value: string]
  update: [id: number, name: string]
}>()

const handleClick = () => {
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

### 5. defineExpose 暴露属性

```vue
<!-- 子组件 Child.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const publicCount = ref(0)
const privateCount = ref(0)

const publicMethod = () => {
  console.log('公开方法')
}

// 默认情况下，setup 中的内容对外部是封闭的
// 使用 defineExpose 显式暴露
defineExpose({
  publicCount,
  publicMethod
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
}
</script>

<template>
  <Child ref="childRef" />
  <button @click="handleClick">访问子组件</button>
</template>
```

### 6. 逻辑组织 - 按关注点分组

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// 用户相关逻辑
const user = ref({ name: '张三', age: 25 })
const userName = computed(() => user.value.name)
const updateUserName = (name: string) => {
  user.value.name = name
}

// 购物车相关逻辑
const cart = ref<{ id: number; name: string; price: number }[]>([])
const totalPrice = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price, 0)
)
const addToCart = (item: { id: number; name: string; price: number }) => {
  cart.value.push(item)
}

// 表单相关逻辑
const formData = ref({ email: '', password: '' })
const isFormValid = computed(() =>
  formData.value.email.includes('@') && formData.value.password.length >= 6
)
const submitForm = () => {
  if (isFormValid.value) {
    console.log('提交表单', formData.value)
  }
}
</script>

<template>
  <div>
    <h2>用户信息</h2>
    <p>{{ userName }}</p>

    <h2>购物车</h2>
    <p>总价：{{ totalPrice }}</p>

    <h2>表单</h2>
    <form @submit.prevent="submitForm">
      <input v-model="formData.email" type="email" />
      <input v-model="formData.password" type="password" />
      <button type="submit" :disabled="!isFormValid">提交</button>
    </form>
  </div>
</template>
```

### 7. 与非 setup 脚本共存

```vue
<script lang="ts">
// 普通 <script> - 用于选项式 API 或导出
export default {
  name: 'MyComponent',
  inheritAttrs: false
}
</script>

<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <p>{{ count }}</p>
</template>
```

## 核心知识点

1. **`<script setup>` 是编译时语法糖**：顶层绑定自动暴露给模板
2. **`defineProps` / `defineEmits`**：编译器宏，不需要导入
3. **TypeScript 类型声明**：使用泛型参数获得完整的类型推导
4. **`defineExpose`**：显式控制组件对外暴露的接口
5. **按逻辑关注点组织代码**：而非按选项类型（data、methods、computed）
6. **更好的类型推导**：Vue 3 原生为 TypeScript 设计
