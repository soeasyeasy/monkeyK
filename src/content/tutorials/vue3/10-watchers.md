---
title: "第十章：侦听器"
description: "深入理解 watch 和 watchEffect 的使用场景和区别"
---

# 第十章：侦听器

## 运行结果

| API | 特点 | 使用场景 |
| --- | --- | --- |
| `watch` | 侦听特定数据源 | 需要知道旧值、精确控制 |
| `watchEffect` | 自动收集依赖 | 副作用自动追踪依赖 |
| `watchPostEffect` | DOM 更新后执行 | 需要访问更新后的 DOM |
| `watchSyncEffect` | 同步执行 | 需要同步刷新 DOM |

## 代码示例

### 1. watch 基础用法

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

const count = ref(0)
const message = ref('Hello')

// 侦听单个数据源
watch(count, (newVal, oldVal) => {
  console.log(`count 从 ${oldVal} 变为 ${newVal}`)
})

// 侦听多个数据源
watch([count, message], ([newCount, newMsg], [oldCount, oldMsg]) => {
  console.log('count 或 message 变化了')
})

const increment = () => count.value++
</script>

<template>
  <p>{{ count }} - {{ message }}</p>
  <button @click="increment">+1</button>
</template>
```

### 2. 侦听 getter 函数

```vue
<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

const user = reactive({
  name: '张三',
  age: 25
})

// 侦听 reactive 对象的属性
watch(
  () => user.name,
  (newVal, oldVal) => {
    console.log(`name 从 ${oldVal} 变为 ${newVal}`)
  }
)

// 侦听多个属性
watch(
  [() => user.name, () => user.age],
  ([newName, newAge]) => {
    console.log('name 或 age 变化了')
  }
)

const updateName = () => user.name = '李四'
const updateAge = () => user.age++
</script>

<template>
  <p>{{ user.name }} - {{ user.age }}</p>
  <button @click="updateName">改名</button>
  <button @click="updateAge">+1 岁</button>
</template>
```

### 3. 深度侦听

```vue
<script setup lang="ts">
import { reactive, watch } from 'vue'

const state = reactive({
  user: {
    name: '张三',
    address: {
      city: '北京'
    }
  }
})

// 深度侦听 reactive 对象（默认就是深度的）
watch(state, (newVal) => {
  console.log('state 变化了', newVal)
})

// 侦听 ref 对象（默认浅层）
const userRef = ref({ name: '张三', age: 25 })

// 需要深度侦听 ref 对象
watch(
  userRef,
  (newVal) => {
    console.log('userRef 深度变化', newVal)
  },
  { deep: true }
)

const updateCity = () => state.user.address.city = '上海'
const updateAge = () => userRef.value.age++
</script>

<template>
  <p>{{ state.user.address.city }}</p>
  <p>{{ userRef.age }}</p>
  <button @click="updateCity">改城市</button>
  <button @click="updateAge">改年龄</button>
</template>
```

### 4. 立即执行

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
  { immediate: true }
)
</script>

<template>
  <input v-model="keyword" placeholder="搜索..." />
</template>
```

### 5. watchEffect 自动收集依赖

```vue
<script setup lang="ts">
import { ref, watchEffect } from 'vue'

const userId = ref(1)
const userData = ref<{ name: string; age: number } | null>(null)

// 自动收集依赖：userId 变化时重新执行
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

### 6. watchEffect vs watch

```vue
<script setup lang="ts">
import { ref, watch, watchEffect } from 'vue'

const count = ref(0)
const message = ref('Hello')

// watch：明确指定数据源，可以获取旧值
watch(count, (newVal, oldVal) => {
  console.log(`watch: ${oldVal} → ${newVal}`)
})

// watchEffect：自动收集依赖，没有旧值
watchEffect(() => {
  console.log(`watchEffect: count=${count.value}, message=${message.value}`)
})

const increment = () => count.value++
const updateMessage = () => message.value = 'World'
</script>

<template>
  <p>{{ count }} - {{ message }}</p>
  <button @click="increment">+1</button>
  <button @click="updateMessage">改消息</button>
</template>
```

### 7. 停止侦听

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

// 手动停止
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

### 8. 侦听器回调时机

```vue
<script setup lang="ts">
import { ref, watch, watchEffect, watchPostEffect, watchSyncEffect } from 'vue'

const count = ref(0)

// 默认：组件更新前异步执行（flush: 'pre'）
watch(count, () => {
  console.log('watch: DOM 更新前')
})

// DOM 更新后执行（flush: 'post'）
watchPostEffect(() => {
  console.log('watchPostEffect: DOM 更新后')
  // 可以访问更新后的 DOM
})

// 同步执行（flush: 'sync'）
watchSyncEffect(() => {
  console.log('watchSyncEffect: 同步执行')
  // 每次响应式变化都立即执行
})

const increment = () => count.value++
</script>

<template>
  <p>{{ count }}</p>
  <button @click="increment">+1</button>
</template>
```

### 9. 实战：搜索防抖

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
      results.value = [
        `${newVal} 结果 1`,
        `${newVal} 结果 2`,
        `${newVal} 结果 3`
      ]
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

### 10. 实战：表单验证

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')

watch(email, (newVal) => {
  if (!newVal) {
    emailError.value = '邮箱不能为空'
  } else if (!newVal.includes('@')) {
    emailError.value = '邮箱格式不正确'
  } else {
    emailError.value = ''
  }
}, { immediate: true })

watch(password, (newVal) => {
  if (!newVal) {
    passwordError.value = '密码不能为空'
  } else if (newVal.length < 6) {
    passwordError.value = '密码至少 6 位'
  } else {
    passwordError.value = ''
  }
}, { immediate: true })
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

## 核心知识点

1. **watch**：侦听特定数据源，可以获取新旧值
2. **watchEffect**：自动收集依赖，适合副作用操作
3. **深度侦听**：使用 `{ deep: true }` 侦听对象内部属性变化
4. **立即执行**：使用 `{ immediate: true }` 在组件创建时立即执行
5. **停止侦听**：返回停止函数，组件卸载时自动停止
6. **回调时机**：`flush: 'pre' | 'post' | 'sync'` 控制执行时机
7. **防抖/节流**：在侦听器中实现输入防抖等优化
