---
title: "第十五章：Teleport 与 Suspense"
description: "学习 Vue 3 的传送门和异步组件处理"
---

# 第十五章：Teleport 与 Suspense

## 运行结果

| 特性 | 用途 | 使用场景 |
| --- | --- | --- |
| `<Teleport>` | 传送 DOM | 模态框、通知、弹出层 |
| `<Suspense>` | 异步组件处理 | 加载状态、错误处理 |
| `defineAsyncComponent` | 定义异步组件 | 代码分割、懒加载 |
| `async setup` | 异步 setup | 组件内数据获取 |

## 代码示例

### 1. Teleport 基础用法

```vue
<!-- Modal.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  modelValue: boolean
  title: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const close = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <!-- 将内容传送到 body 下 -->
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click="close">
      <div class="modal-content" @click.stop>
        <h2>{{ title }}</h2>
        <slot />
        <button @click="close">关闭</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  min-width: 400px;
}
</style>
```

```vue
<!-- 使用 -->
<script setup lang="ts">
import { ref } from 'vue'
import Modal from './Modal.vue'

const showModal = ref(false)
</script>

<template>
  <div>
    <h1>页面内容</h1>
    <button @click="showModal = true">打开模态框</button>

    <Modal v-model="showModal" title="提示">
      <p>这是模态框内容</p>
    </Modal>
  </div>
</template>
```

### 2. Teleport 动态目标

```vue
<script setup lang="ts">
import { ref } from 'vue'

const targetSelector = ref('#modal-container')
const showModal = ref(false)
</script>

<template>
  <div>
    <select v-model="targetSelector">
      <option value="#modal-container">容器 1</option>
      <option value="#another-container">容器 2</option>
      <option value="body">Body</option>
    </select>

    <button @click="showModal = true">显示</button>

    <Teleport :to="targetSelector">
      <div v-if="showModal" class="modal">
        <p>传送到 {{ targetSelector }}</p>
        <button @click="showModal = false">关闭</button>
      </div>
    </Teleport>
  </div>
</template>
```

### 3. Teleport 多个目标

```vue
<template>
  <div>
    <!-- 可以传送到多个目标 -->
    <Teleport to="#notifications">
      <div class="notification">通知 1</div>
    </Teleport>

    <Teleport to="#notifications">
      <div class="notification">通知 2</div>
    </Teleport>

    <!-- 内容会按顺序追加 -->
  </div>
</template>
```

### 4. Suspense 基础用法

```vue
<!-- AsyncComponent.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const data = ref<string[]>([])

// 异步 setup
const fetchData = async () => {
  await new Promise(resolve => setTimeout(resolve, 2000))
  data.value = ['数据 1', '数据 2', '数据 3']
}

await fetchData()
</script>

<template>
  <ul>
    <li v-for="item in data" :key="item">{{ item }}</li>
  </ul>
</template>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
import { ref } from 'vue'
import AsyncComponent from './AsyncComponent.vue'

const showComponent = ref(false)
</script>

<template>
  <div>
    <button @click="showComponent = true">加载异步组件</button>

    <Suspense v-if="showComponent">
      <!-- 异步组件 -->
      <template #default>
        <AsyncComponent />
      </template>

      <!-- 加载状态 -->
      <template #fallback>
        <div>加载中...</div>
      </template>
    </Suspense>
  </div>
</template>
```

### 5. Suspense 与异步组件

```vue
<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'

const HeavyComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)

const showHeavy = ref(false)
</script>

<template>
  <div>
    <button @click="showHeavy = true">加载重型组件</button>

    <Suspense v-if="showHeavy">
      <template #default>
        <HeavyComponent />
      </template>

      <template #fallback>
        <div class="loading">
          <div class="spinner"></div>
          <p>组件加载中...</p>
        </div>
      </template>
    </Suspense>
  </div>
</template>
```

### 6. Suspense 事件

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isLoading = ref(false)
const error = ref<Error | null>(null)

const handleResolve = () => {
  console.log('异步操作完成')
  isLoading.value = false
}

const handlePending = () => {
  console.log('开始加载')
  isLoading.value = true
}

const handleError = (err: Error) => {
  console.error('加载失败：', err)
  error.value = err
  isLoading.value = false
}
</script>

<template>
  <Suspense
    @resolve="handleResolve"
    @pending="handlePending"
    @fallback="handleError"
  >
    <template #default>
      <AsyncComponent />
    </template>

    <template #fallback>
      <div v-if="error">
        <p>加载失败：{{ error.message }}</p>
        <button @click="error = null">重试</button>
      </div>
      <div v-else>
        加载中...
      </div>
    </template>
  </Suspense>
</template>
```

### 7. 嵌套 Suspense

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const UserProfile = defineAsyncComponent(() =>
  import('./UserProfile.vue')
)

const UserPosts = defineAsyncComponent(() =>
  import('./UserPosts.vue')
)
</script>

<template>
  <Suspense>
    <template #default>
      <div class="user-page">
        <!-- 外层 Suspense 等待所有异步 -->
        <Suspense>
          <template #default>
            <UserProfile />
          </template>
          <template #fallback>
            <div>加载用户信息...</div>
          </template>
        </Suspense>

        <Suspense>
          <template #default>
            <UserPosts />
          </template>
          <template #fallback>
            <div>加载文章列表...</div>
          </template>
        </Suspense>
      </div>
    </template>

    <template #fallback>
      <div>页面加载中...</div>
    </template>
  </Suspense>
</template>
```

### 8. 实战：数据获取组件

```vue
<!-- DataFetcher.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  url: string
}>()

const data = ref<any>(null)
const error = ref<Error | null>(null)

// 异步 setup
const fetchData = async () => {
  try {
    const response = await fetch(props.url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    data.value = await response.json()
  } catch (e) {
    error.value = e as Error
  }
}

await fetchData()
</script>

<template>
  <div v-if="error">
    <p style="color: red">错误：{{ error.message }}</p>
    <slot name="error" :error="error" />
  </div>
  <div v-else>
    <slot :data="data" />
  </div>
</template>
```

```vue
<!-- 使用 -->
<script setup lang="ts">
import DataFetcher from './DataFetcher.vue'
</script>

<template>
  <Suspense>
    <template #default>
      <DataFetcher url="/api/users">
        <template #default="{ data }">
          <ul>
            <li v-for="user in data" :key="user.id">
              {{ user.name }}
            </li>
          </ul>
        </template>

        <template #error="{ error }">
          <p>获取用户失败：{{ error.message }}</p>
        </template>
      </DataFetcher>
    </template>

    <template #fallback>
      <div>正在获取用户数据...</div>
    </template>
  </Suspense>
</template>
```

### 9. Teleport + Suspense 组合

```vue
<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue'

const showModal = ref(false)

const AsyncModalContent = defineAsyncComponent(() =>
  import('./ModalContent.vue')
)
</script>

<template>
  <div>
    <button @click="showModal = true">打开模态框</button>

    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click="showModal = false">
        <div class="modal-content" @click.stop>
          <Suspense>
            <template #default>
              <AsyncModalContent />
            </template>

            <template #fallback>
              <div class="loading">
                <div class="spinner"></div>
                <p>内容加载中...</p>
              </div>
            </template>
          </Suspense>

          <button @click="showModal = false">关闭</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
```

### 10. 路由与 Suspense

```vue
<!-- App.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoading = ref(false)

router.beforeEach((to, from, next) => {
  isLoading.value = true
  next()
})

router.afterEach(() => {
  isLoading.value = false
})
</script>

<template>
  <div>
    <nav>
      <router-link to="/">首页</router-link>
      <router-link to="/about">关于</router-link>
    </nav>

    <div v-if="isLoading" class="loading-bar">加载中...</div>

    <router-view v-slot="{ Component }">
      <Suspense>
        <template #default>
          <component :is="Component" />
        </template>

        <template #fallback>
          <div class="page-loading">
            页面加载中...
          </div>
        </template>
      </Suspense>
    </router-view>
  </div>
</template>
```

## 核心知识点

1. **Teleport**：将组件 DOM 传送到任意位置，适合模态框、通知等
2. **Teleport to**：支持 CSS 选择器、DOM 元素、动态绑定
3. **Suspense**：处理异步组件和异步 setup 的加载状态
4. **Suspense 插槽**：`#default` 异步内容，`#fallback` 加载状态
5. **Suspense 事件**：`@resolve`、`@pending`、`@fallback`
6. **嵌套 Suspense**：可以嵌套使用，实现细粒度的加载控制
7. **异步组件**：`defineAsyncComponent` 实现代码分割
8. **async setup**：组件 setup 函数可以是异步的
9. **实验性功能**：Suspense 在 Vue 3.3 中仍是实验性功能
