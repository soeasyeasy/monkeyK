---
title: "第三章：响应式基础"
description: "深入理解 ref、reactive、computed 等响应式核心 API"
---

# 第三章：响应式基础

## 运行结果

| API | 适用类型 | 访问方式 | 特点 |
| --- | --- | --- | --- |
| `ref` | 基本类型 / 对象 | `.value` | 可替换整个值 |
| `reactive` | 对象 / 数组 | 直接访问 | 深层响应式 |
| `computed` | 派生状态 | `.value` | 缓存计算结果 |
| `readonly` | 对象 | 直接访问 | 只读代理 |

## 代码示例

### 1. ref - 基本类型响应式

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
const message = ref('Hello')

// 修改值需要 .value
const increment = () => {
  count.value++
}

// 在模板中自动解包，不需要 .value
</script>

<template>
  <p>{{ count }}</p>
  <p>{{ message }}</p>
  <button @click="increment">+1</button>
</template>
```

### 2. ref - 对象类型

```vue
<script setup lang="ts">
import { ref } from 'vue'

const user = ref({ name: '张三', age: 25 })

// 修改对象属性
const updateName = () => {
  user.value.name = '李四'
}

// 替换整个对象
const replaceUser = () => {
  user.value = { name: '王五', age: 30 }
}
</script>

<template>
  <p>{{ user.name }} - {{ user.age }}</p>
  <button @click="updateName">改名</button>
  <button @click="replaceUser">替换</button>
</template>
```

### 3. reactive - 对象响应式

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  count: 0,
  user: {
    name: '张三',
    age: 25
  },
  items: ['苹果', '香蕉']
})

// 直接修改属性，不需要 .value
const increment = () => {
  state.count++
}

// 深层响应式
const updateName = () => {
  state.user.name = '李四'
}
</script>

<template>
  <p>{{ state.count }}</p>
  <p>{{ state.user.name }}</p>
  <button @click="increment">+1</button>
  <button @click="updateName">改名</button>
</template>
```

### 4. ref vs reactive 的区别

```vue
<script setup lang="ts">
import { ref, reactive } from 'vue'

// ref：可以重新赋值
const countRef = ref(0)
countRef.value = 1  // ✅ 可以
countRef.value = 2  // ✅ 可以

// reactive：不能重新赋值整个对象
const state = reactive({ count: 0 })
// state = { count: 1 }  // ❌ 丢失响应式
state.count = 1        // ✅ 正确方式

// reactive 解构会丢失响应式
const { count } = state  // ❌ 丢失响应式
// 需要使用 toRefs
</script>
```

### 5. computed - 计算属性

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const firstName = ref('张')
const lastName = ref('三')

// 只读计算属性
const fullName = computed(() => {
  return firstName.value + lastName.value
})

// 可写计算属性
const writableFullName = computed({
  get: () => firstName.value + lastName.value,
  set: (val: string) => {
    firstName.value = val[0]
    lastName.value = val.slice(1)
  }
})

// 计算属性会缓存，依赖不变则不重新计算
const items = ref([1, 2, 3, 4, 5])
const evenItems = computed(() => items.value.filter(i => i % 2 === 0))
</script>

<template>
  <p>{{ fullName }}</p>
  <p>偶数：{{ evenItems }}</p>
</template>
```

### 6. readonly - 只读响应式

```vue
<script setup lang="ts">
import { reactive, readonly } from 'vue'

const original = reactive({ count: 0 })
const copy = readonly(original)

// 修改原始对象，副本也会更新
original.count++

// 不能修改只读副本
// copy.count++  // ❌ 警告
</script>
```

## 核心知识点

1. **ref**：适用于基本类型，通过 `.value` 访问和修改
2. **reactive**：适用于对象，深层响应式，不能重新赋值
3. **computed**：基于响应式依赖的缓存计算，依赖不变不重新计算
4. **readonly**：创建只读代理，防止意外修改
5. **选择建议**：基本类型用 `ref`，复杂对象用 `reactive`，需要重新赋值用 `ref`
