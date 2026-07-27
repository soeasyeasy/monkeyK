---
title: '第十章：侦听器'
description: '深入掌握 watch 和 watchEffect 的原理与实战'
---

# 第十章：侦听器

## 本章导读

前面我们学会了用 `computed` 来派生数据，但有时候数据变化后，我们不是要"计算新值"，而是要"执行副作用"——比如发网络请求、操作 DOM、打印日志。

你可能会问：

- 为什么需要侦听器？`computed` 不够用吗？
- `watch` 和 `watchEffect` 有什么区别？该用哪个？
- 怎么监听对象内部属性的变化？
- 怎么在组件销毁时自动停止侦听？

这一章我们会彻底搞懂侦听器的原理和各种用法，让你知道什么时候用 `computed`，什么时候用 `watch`。

---

## 1 为什么需要侦听器？

### 痛点分析

假设你要做一个"搜索框"，用户输入关键词后，自动发送网络请求获取搜索结果。

用 `computed` 写起来是这样的：

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const keyword = ref('')
const results = ref<string[]>([])

// ❌ 问题：computed 应该返回计算值，不应该有副作用
const search = computed(() => {
  // 这里不应该发网络请求
  fetch(`/api/search?q=${keyword.value}`)
    .then((res) => res.json())
    .then((data) => {
      results.value = data // 修改了其他响应式数据
    })

  return keyword.value // 返回值没用
})
</script>
```

问题很明显：

- **`computed` 应该有返回值**，不应该有副作用（如发网络请求）
- **`computed` 会缓存结果**，但网络请求的结果不应该被缓存
- **代码逻辑混乱**：`computed` 里修改其他数据，违反单一职责原则

### Vue 的解决方案：侦听器

Vue 提供了 `watch` 和 `watchEffect`，专门用来监听数据变化并执行副作用：

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

const keyword = ref('')
const results = ref<string[]>([])

// ✅ 正确：用 watch 监听数据变化，执行副作用
watch(keyword, async (newVal) => {
  if (newVal.trim()) {
    const response = await fetch(`/api/search?q=${newVal}`)
    const data = await response.json()
    results.value = data
  } else {
    results.value = []
  }
})
</script>
```

> **一句话总结**：`computed` 用来"计算新值"，`watch` 用来"执行副作用"。

---

## 2 核心原理

### 侦听器的工作流程

侦听器的工作流程分三步：

1. **监听数据源**：告诉 Vue "我要监听这个数据"
2. **数据变化时触发回调**：数据变化后，Vue 自动调用你定义的回调函数
3. **执行副作用**：在回调函数里执行你想要的操作（发请求、操作 DOM 等）

> **类比**：侦听器像"门铃"——你告诉门铃"有人按门铃时通知我"，然后有人按门铃时，门铃就会响。

### watch vs watchEffect

| 特性     | watch        | watchEffect                  |
| -------- | ------------ | ---------------------------- |
| 数据源   | 明确指定     | 自动收集                     |
| 新旧值   | 可以获取     | 没有旧值                     |
| 执行时机 | 数据变化后   | 立即执行一次，然后数据变化时 |
| 适用场景 | 需要精确控制 | 副作用自动追踪依赖           |

> **选择建议**：需要获取旧值或精确控制数据源用 `watch`，副作用逻辑简单用 `watchEffect`。

---

## 3 基础用法

### watch：侦听特定数据源

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

// 创建响应式数据
const count = ref(0)
const message = ref('Hello')

// 侦听单个数据源
// 回调函数接收新值和旧值
watch(count, (newVal, oldVal) => {
  console.log(`count 从 ${oldVal} 变为 ${newVal}`)
})

// 侦听多个数据源
// 回调函数接收数组形式的新值和旧值
watch([count, message], ([newCount, newMsg], [oldCount, oldMsg]) => {
  console.log('count 或 message 变化了')
  console.log(`count: ${oldCount} → ${newCount}`)
  console.log(`message: ${oldMsg} → ${newMsg}`)
})

// 触发变化的方法
const increment = () => count.value++
const updateMessage = () => (message.value = 'World')
</script>

<template>
  <p>{{ count }} - {{ message }}</p>
  <button @click="increment">count +1</button>
  <button @click="updateMessage">改消息</button>
</template>
```

> **原理**：`watch` 第一个参数是数据源（可以是 `ref`、`reactive`、getter 函数），第二个参数是回调函数。

### 侦听 getter 函数

当需要侦听 `reactive` 对象的某个属性时，用 getter 函数：

```vue
<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

// 创建响应式对象
const user = reactive({
  name: '张三',
  age: 25,
})

// 侦听单个属性
// 用 getter 函数返回要侦听的属性
watch(
  () => user.name,
  (newVal, oldVal) => {
    console.log(`name 从 ${oldVal} 变为 ${newVal}`)
  },
)

// 侦听多个属性
// 用数组包裹多个 getter 函数
watch([() => user.name, () => user.age], ([newName, newAge], [oldName, oldAge]) => {
  console.log('name 或 age 变化了')
})

// 触发变化的方法
const updateName = () => (user.name = '李四')
const updateAge = () => user.age++
</script>

<template>
  <p>{{ user.name }} - {{ user.age }}</p>
  <button @click="updateName">改名</button>
  <button @click="updateAge">+1 岁</button>
</template>
```

> **原理**：getter 函数 `() => user.name` 会被 Vue 追踪，当 `user.name` 变化时触发回调。

---

## 4 进阶用法

### 深度侦听

默认情况下，`watch` 侦听 `ref` 时是浅层侦听（只侦听 `.value` 变化），侦听 `reactive` 时是深层侦听。

```vue
<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

// reactive 对象默认深度侦听
const state = reactive({
  user: {
    name: '张三',
    address: {
      city: '北京',
    },
  },
})

// 深层属性变化也会触发
watch(state, (newVal) => {
  console.log('state 变化了', newVal)
})

// ref 对象默认浅层侦听
const userRef = ref({ name: '张三', age: 25 })

// 需要深度侦听 ref 对象，用 { deep: true }
watch(
  userRef,
  (newVal) => {
    console.log('userRef 深度变化', newVal)
  },
  { deep: true },
)

// 触发变化的方法
const updateCity = () => (state.user.address.city = '上海')
const updateAge = () => userRef.value.age++
</script>

<template>
  <p>{{ state.user.address.city }}</p>
  <p>{{ userRef.age }}</p>
  <button @click="updateCity">改城市</button>
  <button @click="updateAge">改年龄</button>
</template>
```

> **原理**：`{ deep: true }` 告诉 Vue 递归侦听对象的所有嵌套属性。

### 立即执行

用 `{ immediate: true }` 让侦听器在组件创建时立即执行一次：

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

const keyword = ref('')

// 立即执行一次（组件创建时就执行）
watch(
  keyword,
  (newVal) => {
    console.log('搜索关键词：', newVal)
    // 发起搜索请求
  },
  { immediate: true },
)
</script>

<template>
  <input v-model="keyword" placeholder="搜索..." />
</template>
```

> **原理**：`{ immediate: true }` 让侦听器在创建时立即执行一次，而不是等数据变化才执行。

### watchEffect：自动收集依赖

`watchEffect` 不需要明确指定数据源，它会自动收集回调函数中用到的响应式数据：

```vue
<script setup lang="ts">
import { ref, watchEffect } from 'vue'

const userId = ref(1)
const userData = ref<{ name: string; age: number } | null>(null)

// 自动收集依赖
// 回调函数中用到了 userId.value，所以 userId 变化时会重新执行
watchEffect(async () => {
  console.log('获取用户数据，ID：', userId.value)
  const response = await fetch(`/api/users/${userId.value}`)
  userData.value = await response.json()
})

const nextUser = () => userId.value++
</script>

<template>
  <div v-if="userData">
    <p>{{ userData.name }} - {{ userData.age }}</p>
  </div>
  <button @click="nextUser">下一个用户</button>
</template>
```

> **原理**：`watchEffect` 在执行回调时，会追踪所有用到的响应式数据，当这些数据变化时，自动重新执行回调。

### 停止侦听

`watch` 和 `watchEffect` 都返回一个停止函数，调用后可以停止侦听：

```vue
<script setup lang="ts">
import { ref, watch, watchEffect, onUnmounted } from 'vue'

const count = ref(0)

// watch 返回停止函数
const stopWatch = watch(count, (newVal) => {
  console.log('count:', newVal)
})

// watchEffect 返回停止函数
const stopEffect = watchEffect(() => {
  console.log('effect:', count.value)
})

// 手动停止侦听
const stopAll = () => {
  stopWatch()
  stopEffect()
}

// 组件卸载时自动停止（无需手动调用）
onUnmounted(() => {
  console.log('组件卸载，侦听器自动停止')
})

const increment = () => count.value++
</script>

<template>
  <p>{{ count }}</p>
  <button @click="increment">+1</button>
  <button @click="stopAll">停止侦听</button>
</template>
```

> **原理**：组件卸载时，Vue 会自动停止所有侦听器，防止内存泄漏。

---

## 5 核心知识点总结

| API               | 特点           | 使用场景               |
| ----------------- | -------------- | ---------------------- |
| `watch`           | 侦听特定数据源 | 需要知道旧值、精确控制 |
| `watchEffect`     | 自动收集依赖   | 副作用自动追踪依赖     |
| `watchPostEffect` | DOM 更新后执行 | 需要访问更新后的 DOM   |
| `watchSyncEffect` | 同步执行       | 需要同步刷新 DOM       |

---

## 6 新手常见误区

### 误区 1："computed 和 watch 可以互换"

**不能！**

- `computed` 用来"计算新值"，有缓存，不应该有副作用
- `watch` 用来"执行副作用"，没有缓存，可以发请求、操作 DOM

```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const count = ref(0)

// ✅ 正确：computed 计算新值
const doubleCount = computed(() => count.value * 2)

// ✅ 正确：watch 执行副作用
watch(count, (newVal) => {
  console.log('count 变化了：', newVal)
  // 发网络请求、操作 DOM 等
})

// ❌ 错误：computed 里发网络请求
const badComputed = computed(() => {
  fetch('/api/data') // 不应该有副作用
  return count.value * 2
})
</script>
```

### 误区 2："watch 侦听 reactive 对象时，需要 { deep: true }"

**不需要！**

`reactive` 对象默认就是深度侦听，只有 `ref` 对象才需要 `{ deep: true }`：

```vue
<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

const state = reactive({ count: 0 })
const userRef = ref({ name: '张三' })

// ✅ reactive 默认深度侦听
watch(state, (newVal) => {
  console.log('state 变化了')
})

// ✅ ref 需要 { deep: true } 才能深度侦听
watch(
  userRef,
  (newVal) => {
    console.log('userRef 变化了')
  },
  { deep: true },
)
</script>
```

### 误区 3："watchEffect 不需要指定数据源"

**对！**

`watchEffect` 会自动收集回调函数中用到的响应式数据，不需要明确指定：

```vue
<script setup lang="ts">
import { ref, watchEffect } from 'vue'

const count = ref(0)
const message = ref('Hello')

// ✅ watchEffect 自动收集 count 和 message
watchEffect(() => {
  console.log(`count=${count.value}, message=${message.value}`)
  // 用到了 count 和 message，所以它们变化时都会触发
})
</script>
```

### 误区 4："侦听器在组件销毁后还会执行"

**不会！**

组件销毁时，Vue 会自动停止所有侦听器，防止内存泄漏。如果需要手动停止，可以调用返回的停止函数：

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

const count = ref(0)

const stopWatch = watch(count, (newVal) => {
  console.log('count:', newVal)
})

// 手动停止
stopWatch()

// 组件销毁时自动停止，无需手动调用
</script>
```

### 误区 5："watch 和 watchEffect 执行时机一样"

**不一样！**

- `watch`：数据变化后，在组件更新前执行（默认 `flush: 'pre'`）
- `watchEffect`：立即执行一次，然后数据变化时执行

```vue
<script setup lang="ts">
import { ref, watch, watchEffect } from 'vue'

const count = ref(0)

// watch：数据变化后执行
watch(count, (newVal) => {
  console.log('watch: 数据变化后执行')
})

// watchEffect：立即执行一次，然后数据变化时执行
watchEffect(() => {
  console.log('watchEffect: 立即执行')
})
</script>
```

---

## 7 动手练习

### 练习 1：搜索防抖

实现一个搜索框，用户输入后 500ms 再发送请求（防抖）。

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

const keyword = ref('')
const results = ref<string[]>([])
let timer: number | null = null

watch(keyword, (newVal) => {
  // 清除之前的定时器
  if (timer !== null) {
    clearTimeout(timer)
  }

  // 设置新的定时器（防抖 500ms）
  timer = window.setTimeout(async () => {
    if (newVal.trim()) {
      console.log('搜索：', newVal)
      // 模拟搜索请求
      results.value = [`${newVal} 结果 1`, `${newVal} 结果 2`, `${newVal} 结果 3`]
    } else {
      results.value = []
    }
  }, 500)
})
</script>

<template>
  <input v-model="keyword" placeholder="搜索..." />
  <ul>
    <li v-for="result in results" :key="result">
      {{ result }}
    </li>
  </ul>
</template>
```

</details>

### 练习 2：表单验证

实现一个表单，实时验证邮箱和密码格式。

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')

// 验证邮箱
watch(
  email,
  (newVal) => {
    if (!newVal) {
      emailError.value = '邮箱不能为空'
    } else if (!newVal.includes('@')) {
      emailError.value = '邮箱格式不正确'
    } else {
      emailError.value = ''
    }
  },
  { immediate: true },
)

// 验证密码
watch(
  password,
  (newVal) => {
    if (!newVal) {
      passwordError.value = '密码不能为空'
    } else if (newVal.length < 6) {
      passwordError.value = '密码至少 6 位'
    } else {
      passwordError.value = ''
    }
  },
  { immediate: true },
)
</script>

<template>
  <div>
    <div>
      <input v-model="email" type="email" placeholder="邮箱" />
      <span v-if="emailError" style="color: red">{{ emailError }}</span>
    </div>
    <div>
      <input v-model="password" type="password" placeholder="密码" />
      <span v-if="passwordError" style="color: red">{{ passwordError }}</span>
    </div>
  </div>
</template>
```

</details>

### 练习 3（挑战）：用户数据加载

实现一个组件，根据用户 ID 加载用户数据，支持切换用户。

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref, watchEffect } from 'vue'

const userId = ref(1)
const userData = ref<{ name: string; age: number } | null>(null)
const loading = ref(false)

// 自动收集依赖：userId 变化时重新执行
watchEffect(async () => {
  loading.value = true
  console.log('获取用户数据，ID：', userId.value)

  // 模拟网络请求
  await new Promise((resolve) => setTimeout(resolve, 500))

  // 模拟返回数据
  userData.value = {
    name: `用户${userId.value}`,
    age: 20 + userId.value,
  }

  loading.value = false
})

const nextUser = () => userId.value++
const prevUser = () => {
  if (userId.value > 1) userId.value--
}
</script>

<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="userData">
      <p>姓名：{{ userData.name }}</p>
      <p>年龄：{{ userData.age }}</p>
    </div>

    <button @click="prevUser" :disabled="userId <= 1">上一个</button>
    <button @click="nextUser">下一个</button>
    <p>当前用户 ID：{{ userId }}</p>
  </div>
</template>
```

</details>

---

## 下一章预告

下一章我们会学习 Vue 的**插槽和动态组件**——也就是怎么在组件中分发内容，以及怎么动态切换组件。你会学到默认插槽、具名插槽、作用域插槽，以及 `<component :is="...">` 的用法。
