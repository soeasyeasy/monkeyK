---
title: "第十六章：性能优化与最佳实践"
description: "学习 Vue 3 应用的性能优化技巧和最佳实践"
---

# 第十六章：性能优化与最佳实践

## 运行结果

| 优化方向 | 技术 | 效果 |
| --- | --- | --- |
| 组件懒加载 | 路由懒加载、异步组件 | 减少初始包体积 |
| 响应式优化 | `shallowRef`、`shallowReactive` | 减少不必要的响应式追踪 |
| 渲染优化 | `v-memo`、`v-once` | 避免不必要的重新渲染 |
| 列表优化 | 虚拟滚动 | 大数据列表性能提升 |
| 计算优化 | 计算属性缓存 | 避免重复计算 |
| 资源优化 | 图片懒加载、代码分割 | 减少资源加载时间 |

## 代码示例

### 1. 路由懒加载

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    // 懒加载
    component: () => import('../views/Home.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    // 使用 webpackChunkName 指定 chunk 名称
    component: () => import(
      /* webpackChunkName: "dashboard" */
      '../views/Dashboard.vue'
    )
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
```

### 2. 异步组件

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// 基础用法
const AsyncComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)

// 带加载状态和错误处理
const AsyncWithOptions = defineAsyncComponent({
  loader: () => import('./HeavyComponent.vue'),
  loadingComponent: () => import('./Loading.vue'),
  errorComponent: () => import('./Error.vue'),
  delay: 200,        // 延迟显示 loading（ms）
  timeout: 3000      // 超时时间（ms）
})
</script>

<template>
  <AsyncComponent />
  <AsyncWithOptions />
</template>
```

### 3. shallowRef 和 shallowReactive

```vue
<script setup lang="ts">
import { ref, shallowRef, reactive, shallowReactive } from 'vue'

// 普通 ref - 深层响应式
const deepRef = ref({
  user: {
    name: '张三',
    address: {
      city: '北京'
    }
  }
})

// shallowRef - 浅层响应式
const shallowUser = shallowRef({
  name: '张三',
  address: {
    city: '北京'
  }
})

// 修改深层属性
deepRef.value.user.address.city = '上海'  // ✅ 触发更新
shallowUser.value.address.city = '上海'   // ❌ 不触发更新

// 替换整个值
shallowUser.value = {                     // ✅ 触发更新
  name: '李四',
  address: { city: '上海' }
}

// shallowReactive - 浅层响应式
const shallowState = shallowReactive({
  count: 0,
  nested: {
    value: 1
  }
})

shallowState.count++           // ✅ 触发更新
shallowState.nested.value++    // ❌ 不触发更新
</script>

<template>
  <div>
    <p>{{ shallowUser.name }}</p>
    <button @click="shallowUser = { ...shallowUser, name: '新名字' }">
      修改名字
    </button>
  </div>
</template>
```

### 4. v-once 和 v-memo

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
const items = ref([1, 2, 3, 4, 5])
const staticContent = '静态内容'
</script>

<template>
  <div>
    <!-- v-once：只渲染一次，后续不会重新渲染 -->
    <p v-once>{{ staticContent }}</p>

    <!-- v-memo：依赖不变时跳过重新渲染 -->
    <div v-memo="[count === 0]">
      <p>只有当 count 从 0 变为非 0 或反之才会重新渲染</p>
      <p>当前计数：{{ count }}</p>
    </div>

    <!-- 在 v-for 中使用 v-memo -->
    <div v-for="item in items" :key="item" v-memo="[item > 3]">
      <p>项目 {{ item }}</p>
    </div>

    <button @click="count++">+1</button>
  </div>
</template>
```

### 5. 计算属性缓存

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const items = ref([
  { id: 1, name: '商品 A', price: 100, quantity: 2 },
  { id: 2, name: '商品 B', price: 200, quantity: 1 },
  { id: 3, name: '商品 C', price: 150, quantity: 3 }
])

// ✅ 使用计算属性 - 有缓存
const totalPrice = computed(() => {
  console.log('计算总价') // 只在依赖变化时执行
  return items.value.reduce((sum, item) => {
    return sum + item.price * item.quantity
  }, 0)
})

// ❌ 使用方法 - 每次渲染都重新计算
const getTotalPrice = () => {
  console.log('计算总价') // 每次渲染都执行
  return items.value.reduce((sum, item) => {
    return sum + item.price * item.quantity
  }, 0)
}
</script>

<template>
  <div>
    <p>总价：{{ totalPrice }}</p>
    <p>总价：{{ getTotalPrice() }}</p>
  </div>
</template>
```

### 6. 虚拟滚动 - 大数据列表

```vue
<!-- VirtualList.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  items: any[]
  itemHeight: number
  containerHeight: number
}>()

const scrollTop = ref(0)

const startIndex = computed(() => {
  return Math.floor(scrollTop.value / props.itemHeight)
})

const endIndex = computed(() => {
  return Math.min(
    startIndex.value + Math.ceil(props.containerHeight / props.itemHeight),
    props.items.length
  )
})

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value)
})

const totalHeight = computed(() => {
  return props.items.length * props.itemHeight
})

const offsetY = computed(() => {
  return startIndex.value * props.itemHeight
})

const handleScroll = (e: Event) => {
  scrollTop.value = (e.target as HTMLElement).scrollTop
}
</script>

<template>
  <div
    class="virtual-list"
    :style="{ height: containerHeight + 'px' }"
    @scroll="handleScroll"
  >
    <div
      class="virtual-list-spacer"
      :style="{ height: totalHeight + 'px' }"
    >
      <div
        class="virtual-list-content"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="(item, index) in visibleItems"
          :key="startIndex + index"
          class="virtual-list-item"
          :style="{ height: itemHeight + 'px' }"
        >
          <slot :item="item" :index="startIndex + index" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.virtual-list {
  overflow-y: auto;
}

.virtual-list-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}
</style>
```

```vue
<!-- 使用 -->
<script setup lang="ts">
import { ref } from 'vue'
import VirtualList from './VirtualList.vue'

// 生成 10000 条数据
const items = ref(
  Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `项目 ${i}`
  }))
)
</script>

<template>
  <VirtualList
    :items="items"
    :item-height="50"
    :container-height="400"
  >
    <template #default="{ item, index }">
      <div class="item-content">
        {{ index }}. {{ item.name }}
      </div>
    </template>
  </VirtualList>
</template>
```

### 7. 图片懒加载

```vue
<!-- LazyImage.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  src: string
  alt: string
}>()

const imageRef = ref<HTMLImageElement | null>(null)
const isLoaded = ref(false)
const isInViewport = ref(false)

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          isInViewport.value = true
          observer.disconnect()
        }
      })
    },
    { threshold: 0.1 }
  )

  if (imageRef.value) {
    observer.observe(imageRef.value)
  }
})

const handleLoad = () => {
  isLoaded.value = true
}
</script>

<template>
  <div ref="imageRef" class="lazy-image">
    <img
      v-if="isInViewport"
      :src="src"
      :alt="alt"
      @load="handleLoad"
      :class="{ loaded: isLoaded }"
    />
    <div v-else class="placeholder">加载中...</div>
  </div>
</template>

<style scoped>
.lazy-image {
  min-height: 200px;
}

img {
  opacity: 0;
  transition: opacity 0.3s;
}

img.loaded {
  opacity: 1;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  height: 200px;
}
</style>
```

### 8. 组件缓存 - keep-alive

```vue
<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import TabA from './TabA.vue'
import TabB from './TabB.vue'
import TabC from './TabC.vue'

const currentTab = shallowRef(TabA)

const tabs = [
  { name: '标签 A', component: TabA },
  { name: '标签 B', component: TabB },
  { name: '标签 C', component: TabC }
]
</script>

<template>
  <div>
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        @click="currentTab = tab.component"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- 缓存所有组件 -->
    <keep-alive>
      <component :is="currentTab" />
    </keep-alive>

    <!-- 或只缓存特定组件 -->
    <keep-alive include="TabA,TabB">
      <component :is="currentTab" />
    </keep-alive>

    <!-- 或排除特定组件 -->
    <keep-alive exclude="TabC">
      <component :is="currentTab" />
    </keep-alive>

    <!-- 限制缓存数量 -->
    <keep-alive :max="10">
      <component :is="currentTab" />
    </keep-alive>
  </div>
</template>
```

### 9. 响应式数据优化

```vue
<script setup lang="ts">
import { ref, shallowRef, triggerRef } from 'vue'

// 大型对象使用 shallowRef
const largeData = shallowRef({
  items: Array.from({ length: 10000 }, (_, i) => i),
  metadata: { /* ... */ }
})

// 手动触发更新
const updateData = () => {
  largeData.value.items.push(10001)
  triggerRef(largeData) // 手动触发依赖更新
}

// 避免不必要的响应式
const staticConfig = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
}

// 不需要响应式的数据不用 ref/reactive
</script>

<template>
  <div>
    <p>数据量：{{ largeData.items.length }}</p>
    <button @click="updateData">添加数据</button>
  </div>
</template>
```

### 10. 性能监控

```typescript
// utils/performance.ts
export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now()
  fn()
  const end = performance.now()
  console.log(`${name} 耗时：${(end - start).toFixed(2)}ms`)
}

export function usePerformanceMonitor() {
  // 组件渲染时间
  const measureRender = (componentName: string) => {
    const start = performance.now()

    onMounted(() => {
      const end = performance.now()
      console.log(`${componentName} 挂载耗时：${(end - start).toFixed(2)}ms`)
    })
  }

  // 内存使用
  const logMemoryUsage = () => {
    if (performance.memory) {
      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory
      console.log({
        '已用堆内存': `${(usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        '总堆内存': `${(totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        '堆内存限制': `${(jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      })
    }
  }

  return {
    measureRender,
    logMemoryUsage
  }
}
```

```vue
<script setup lang="ts">
import { usePerformanceMonitor } from './utils/performance'

const { measureRender, logMemoryUsage } = usePerformanceMonitor()

measureRender('MyComponent')

// 定期监控内存
setInterval(logMemoryUsage, 5000)
</script>
```

## 核心知识点

1. **路由懒加载**：`() => import()` 实现代码分割
2. **异步组件**：`defineAsyncComponent` 延迟加载组件
3. **shallowRef/shallowReactive**：浅层响应式，适合大型对象
4. **v-once/v-memo**：避免不必要的重新渲染
5. **计算属性缓存**：基于依赖的缓存机制
6. **虚拟滚动**：大数据列表只渲染可视区域
7. **图片懒加载**：IntersectionObserver 实现
8. **keep-alive**：缓存组件状态，避免重复渲染
9. **性能监控**：Performance API 测量渲染时间和内存使用
10. **最佳实践**：按需加载、避免深层响应式、合理使用缓存
