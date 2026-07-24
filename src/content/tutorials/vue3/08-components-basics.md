---
title: "第八章：组件基础"
description: "学习 Vue 3 组件的注册、通信和基础用法"
---

# 第八章：组件基础

## 运行结果

| 注册方式 | 作用域 | 使用场景 |
| --- | --- | --- |
| 全局注册 | 整个应用 | 通用基础组件 |
| 局部注册 | 当前组件 | 按需引入，Tree-shaking |
| Props | 父 → 子 | 父组件向子组件传递数据 |
| Emits | 子 → 父 | 子组件向父组件发送事件 |
| provide/inject | 祖先 → 后代 | 跨层级组件通信 |

## 代码示例

### 1. 全局注册

```typescript
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import MyButton from './components/MyButton.vue'

const app = createApp(App)

// 全局注册，所有组件都可使用
app.component('MyButton', MyButton)

app.mount('#app')
```

```vue
<!-- 任意组件中使用 -->
<template>
  <MyButton>点击我</MyButton>
</template>
```

### 2. 局部注册

```vue
<script setup lang="ts">
import MyButton from './components/MyButton.vue'
import MyInput from './components/MyInput.vue'
</script>

<template>
  <MyButton>按钮</MyButton>
  <MyInput v-model="text" />
</template>
```

### 3. Props 传递数据

```vue
<!-- UserCard.vue -->
<script setup lang="ts">
interface Props {
  name: string
  age: number
  email?: string
}

const props = withDefaults(defineProps<Props>(), {
  email: '未提供'
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
  <UserCard name="张三" :age="25" />
  <UserCard name="李四" :age="30" email="lisi@example.com" />
</template>
```

### 4. Props 验证

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
    required: true
  },

  // 带默认值的对象
  config: {
    type: Object,
    default: () => ({ theme: 'light' })
  },

  // 自定义验证函数
  age: {
    type: Number,
    validator: (value: number) => value >= 0 && value <= 150
  }
})
</script>
```

### 5. Emits 发送事件

```vue
<!-- SearchBox.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const keyword = ref('')

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
  <SearchBox @search="handleSearch" @clear="handleClear" />
</template>
```

### 6. v-model 在组件上

```vue
<!-- CustomInput.vue -->
<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

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
  <CustomInput v-model="text" />
  <p>{{ text }}</p>
</template>
```

### 7. 多个 v-model

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
  <UserName v-model:firstName="firstName" v-model:lastName="lastName" />
  <p>姓名：{{ lastName }}{{ firstName }}</p>
</template>
```

### 8. provide / inject 跨层级通信

```vue
<!-- 祖先组件 App.vue -->
<script setup lang="ts">
import { provide, ref } from 'vue'

const theme = ref('light')
const user = ref({ name: '张三', role: 'admin' })

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

### 9. 透传 Attributes

```vue
<!-- MyButton.vue -->
<script setup lang="ts">
// 默认情况下，attrs 会自动透传到根元素
// 如果有多个根节点，需要手动指定
</script>

<template>
  <!-- 单根节点：自动透传 class、style、事件等 -->
  <button class="btn">
    <slot />
  </button>
</template>
```

```vue
<!-- 多根节点组件 -->
<script setup lang="ts">
import { useAttrs } from 'vue'

const attrs = useAttrs()
</script>

<template>
  <div>
    <button v-bind="attrs">按钮 1</button>
    <button>按钮 2</button>
  </div>
</template>
```

```vue
<!-- 禁用自动透传 -->
<script setup lang="ts">
defineOptions({
  inheritAttrs: false
})
</script>
```

## 核心知识点

1. **局部注册优先**：按需引入，支持 Tree-shaking
2. **Props 类型安全**：使用 TypeScript 泛型获得完整推导
3. **Emits 明确契约**：声明组件对外发送的事件
4. **v-model 简化双向绑定**：是 `modelValue` prop + `update:modelValue` 事件的语法糖
5. **provide/inject**：解决跨层级组件通信，避免 prop 逐层传递
6. **Attribute 透传**：class、style、事件监听器自动传递到根元素
