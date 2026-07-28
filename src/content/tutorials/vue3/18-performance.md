---
title: '第十六章：性能优化与最佳实践'
description: '学习 Vue 3 应用的性能优化技巧和最佳实践'
---

# 第十六章：性能优化与最佳实践

## 本章导读

恭喜你走到了最后一章！前面 15 章我们学了很多 Vue 3 的"招式"，这一章要学的是"内功"——怎么让你的应用跑得更快。学完本章，你将掌握：

- **为什么我的应用越写越卡？** —— 性能瓶颈到底藏在哪里？
- **路由懒加载、异步组件、虚拟滚动……这么多优化手段，我该什么时候用哪个？**
- **`shallowRef` 和 `ref` 到底有什么区别？什么时候该"偷懒"用浅层响应式？**
- **`v-memo`、`v-once`、`keep-alive` 这些"缓存"指令/组件，用错了反而会更慢？**

---

## 为什么需要性能优化

### 痛点分析

想象你开了一家餐厅：

- 刚开始只有 10 个客人（数据量小），一个服务员（浏览器）就能搞定一切
- 后来客人越来越多（数据量暴增），服务员还是一个人，他开始记不住菜、上错菜、跑得越来越慢
- 客人开始抱怨："这餐厅怎么这么卡！"

你的 Vue 应用也是一样：

- 刚写的时候只有几个组件、几条数据，跑得飞快
- 功能越加越多，列表越来越长，组件越来越复杂
- 用户开始反馈："页面打开好慢""滚动好卡""切换标签要等半天"

### 生活化类比

性能优化就像是给餐厅做"流程改造"：

| 餐厅问题                       | 解决方案                       | 对应前端优化                               |
| ------------------------------ | ------------------------------ | ------------------------------------------ |
| 菜单太厚，服务员记不住         | 把菜单分成几本，用到哪本拿哪本 | **路由懒加载 / 异步组件**（按需加载代码）  |
| 客人排队等位，其实很多桌子空着 | 只渲染坐人的桌子               | **虚拟滚动**（只渲染看得到的列表项）       |
| 同一道菜反复计算价格           | 算一次记下来，价格没变就不重算 | **计算属性缓存**（computed 的缓存机制）    |
| 服务员每次都要重新认识客人     | 给常客留个专属座位             | **keep-alive**（缓存组件状态）             |
| 服务员不需要知道厨房每道工序   | 只关心最终结果                 | **shallowRef**（浅层响应式，减少追踪开销） |

---

## 核心原理讲解

### Vue 3 的性能机制

Vue 3 本身就做了很多性能优化（比如编译时优化、响应式系统升级），但作为开发者，我们还需要在"用法"上做文章。核心原理可以总结为三句话：

1. **少干活**：能不渲染的就不渲染，能不计算的就别计算
2. **晚干活**：能晚加载的就晚加载，用户不需要的代码别一开始就塞进去
3. **聪明地干活**：用对工具，大列表用虚拟滚动，大对象用浅层响应式

---

## 基础用法

### 1. 路由懒加载 —— 按需加载页面代码

> **类比**：餐厅不会把所有食材一次搬出来，而是用到什么拿什么。路由懒加载就是把每个页面的代码"分包"存放，用户访问哪个页面才下载哪个。

```typescript
// router/index.ts
// 引入 Vue Router 的两个核心函数
import { createRouter, createWebHistory } from 'vue-router'

// 定义路由规则数组
const routes = [
  {
    path: '/', // 首页路径
    name: 'Home', // 路由名称
    // 懒加载：用箭头函数 + import() 动态导入，只有访问 '/' 时才会加载 Home.vue
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/about', // 关于页路径
    name: 'About', // 路由名称
    // 同样是懒加载，访问 '/about' 时才下载 About.vue
    component: () => import('../views/About.vue'),
  },
  {
    path: '/dashboard', // 仪表盘路径
    name: 'Dashboard', // 路由名称
    // 使用 webpackChunkName 注释，告诉打包工具把这个文件命名为 "dashboard"
    component: () =>
      import(
        /* webpackChunkName: "dashboard" */
        '../views/Dashboard.vue'
      ),
  },
]

// 创建路由实例，使用 HTML5 History 模式（URL 没有 # 号）
const router = createRouter({
  history: createWebHistory(), // 使用 HTML5 History 模式
  routes, // 传入路由规则
})

// 导出路由实例，供 main.ts 使用
export default router
```

### 2. 异步组件 —— 延迟加载重型组件

> **类比**：有些菜制作时间很长（比如烤鸭），你不会在客人点单前就提前做好，而是等点单了再开始做，同时给客人一个"等待中"的提示牌。

```vue
<script setup lang="ts">
// 引入 defineAsyncComponent，这是 Vue 3 内置的异步组件定义函数
import { defineAsyncComponent } from 'vue'

// 基础用法：定义一个异步组件，只有在模板中使用时才会去加载
const AsyncComponent = defineAsyncComponent(
  () => import('./HeavyComponent.vue'), // 动态导入重型组件
)

// 进阶用法：带加载状态、错误处理和超时控制
const AsyncWithOptions = defineAsyncComponent({
  loader: () => import('./HeavyComponent.vue'), // 加载函数，返回一个动态 import
  loadingComponent: () => import('./Loading.vue'), // 加载中显示的组件（类似"等待中"提示牌）
  errorComponent: () => import('./Error.vue'), // 加载失败时显示的组件
  delay: 200, // 延迟 200ms 才显示 loading（避免闪烁，网络快的时候用户看不到 loading）
  timeout: 3000, // 超时时间 3000ms，超过 3 秒就显示错误组件
})
</script>

<template>
  <!-- 使用基础异步组件 -->
  <AsyncComponent />
  <!-- 使用带配置的异步组件 -->
  <AsyncWithOptions />
</template>
```

### 3. shallowRef 和 shallowReactive —— 浅层响应式

> **类比**：`ref` 就像给一个俄罗斯套娃的每一层都装了追踪器，改任何一层都会触发更新。`shallowRef` 只在最外面那层装追踪器，只有替换整个套娃才会触发更新。

```vue
<script setup lang="ts">
// 引入响应式 API：ref（深层响应式）、shallowRef（浅层 ref）
// reactive（深层响应式）、shallowReactive（浅层 reactive）
import { ref, shallowRef, reactive, shallowReactive } from 'vue'

// 普通 ref - 深层响应式，内部每一层属性都被追踪
const deepRef = ref({
  user: {
    // 第一层
    name: '张三', // 第二层
    address: {
      // 第三层
      city: '北京', // 第四层
    },
  },
})

// shallowRef - 浅层响应式，只追踪 .value 的替换，不追踪内部属性变化
const shallowUser = shallowRef({
  name: '张三', // 这些内部属性变化不会触发视图更新
  address: {
    city: '北京',
  },
})

// 修改深层属性
deepRef.value.user.address.city = '上海' // ✅ 触发更新（深层追踪，改到哪里都能感知）
shallowUser.value.address.city = '上海' // ❌ 不触发更新（只追踪 .value 本身，内部变化不管）

// 替换整个值 —— shallowRef 的正确用法
shallowUser.value = {
  // ✅ 触发更新（整个 .value 被替换了）
  name: '李四',
  address: { city: '上海' },
}

// shallowReactive - 浅层响应式，只追踪第一层属性的变化
const shallowState = shallowReactive({
  count: 0, // 第一层属性，变化会触发更新
  nested: {
    // 第一层属性（对象本身被追踪，但内部不被追踪）
    value: 1,
  },
})

shallowState.count++ // ✅ 触发更新（第一层属性变化）
shallowState.nested.value++ // ❌ 不触发更新（第二层属性变化，不追踪）
</script>

<template>
  <div>
    <!-- 显示 shallowUser 的 name -->
    <p>{{ shallowUser.name }}</p>
    <!-- 点击按钮时，用展开运算符创建新对象来替换整个 .value（shallowRef 的正确修改方式） -->
    <button @click="shallowUser = { ...shallowUser, name: '新名字' }">修改名字</button>
  </div>
</template>
```

### 4. v-once 和 v-memo —— 跳过不必要的渲染

> **类比**：`v-once` 就像刻石碑——内容刻上去就不会再改了。`v-memo` 就像贴了个"条件标签"——只要条件没变，内容就不更新。

```vue
<script setup lang="ts">
import { ref } from 'vue' // 引入 ref

const count = ref(0) // 计数器，初始值为 0
const items = ref([1, 2, 3, 4, 5]) // 列表数据
const staticContent = '静态内容' // 永远不会变的内容
</script>

<template>
  <div>
    <!-- v-once：只渲染一次，之后无论其他数据怎么变，这里都不会重新渲染 -->
    <p v-once>{{ staticContent }}</p>

    <!-- v-memo：只有当数组中的依赖值发生变化时，才会重新渲染这块内容 -->
    <!-- 这里依赖 count === 0 这个布尔值，只有 true→false 或 false→true 时才重新渲染 -->
    <div v-memo="[count === 0]">
      <p>只有当 count 从 0 变为非 0 或反之才会重新渲染</p>
      <p>当前计数：{{ count }}</p>
    </div>

    <!-- 在 v-for 中使用 v-memo：可以跳过列表中不需要更新的项 -->
    <!-- 每个 item 独立判断 item > 3 是否变化，没变化就跳过渲染 -->
    <div v-for="item in items" :key="item" v-memo="[item > 3]">
      <p>项目 {{ item }}</p>
    </div>

    <!-- 点击按钮让 count 加 1 -->
    <button @click="count++">+1</button>
  </div>
</template>
```

### 5. 计算属性缓存 —— 避免重复计算

> **类比**：你去超市买东西，总价 = 每件商品的价格 × 数量之和。如果你没有改购物车，每次看总价标签都应该是同一个数，不需要重新算一遍。计算属性就是这个"总价标签"。

```vue
<script setup lang="ts">
import { ref, computed } from 'vue' // 引入 ref 和 computed

// 购物车商品列表
const items = ref([
  { id: 1, name: '商品 A', price: 100, quantity: 2 }, // 100 × 2 = 200
  { id: 2, name: '商品 B', price: 200, quantity: 1 }, // 200 × 1 = 200
  { id: 3, name: '商品 C', price: 150, quantity: 3 }, // 150 × 3 = 450
]) // 总价 = 850

// ✅ 正确写法：使用计算属性 —— 有缓存机制
const totalPrice = computed(() => {
  console.log('计算总价') // 只在 items 变化时才执行这行，否则直接用缓存值
  return items.value.reduce((sum, item) => {
    return sum + item.price * item.quantity // 累加每件商品的小计
  }, 0)
})

// ❌ 错误写法：使用方法 —— 每次渲染都会重新计算，没有缓存
const getTotalPrice = () => {
  console.log('计算总价') // 每次组件重新渲染都会执行，即使 items 没变
  return items.value.reduce((sum, item) => {
    return sum + item.price * item.quantity // 同样的计算逻辑
  }, 0)
}
</script>

<template>
  <div>
    <!-- 使用计算属性，依赖不变就直接返回缓存值 -->
    <p>总价：{{ totalPrice }}</p>
    <!-- 使用方法，每次渲染都重新计算（性能浪费） -->
    <p>总价：{{ getTotalPrice() }}</p>
  </div>
</template>
```

### 6. 虚拟滚动 —— 大数据列表的救星

> **类比**：你有一本 10000 页的书，但你一次只能看 10 页。虚拟滚动就是只把当前看到的 10 页"摆出来"，翻页的时候动态替换内容，而不是把 10000 页全部摊开在桌上。

```vue
<!-- VirtualList.vue —— 虚拟滚动列表组件 -->
<script setup lang="ts">
// 引入必要的 Vue API
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 定义组件接收的 props
const props = defineProps<{
  items: any[] // 完整的数据列表（可能上万条）
  itemHeight: number // 每个列表项的固定高度（px）
  containerHeight: number // 容器可视区域的高度（px）
}>()

// 记录当前滚动位置
const scrollTop = ref(0)

// 计算当前可视区域第一个可见项的索引
const startIndex = computed(() => {
  return Math.floor(scrollTop.value / props.itemHeight) // 滚动距离 ÷ 每项高度 = 起始索引
})

// 计算当前可视区域最后一个可见项的索引
const endIndex = computed(() => {
  return Math.min(
    // 取较小值，防止越界
    startIndex.value + Math.ceil(props.containerHeight / props.itemHeight), // 起始索引 + 可见项数
    props.items.length, // 不能超过总数据量
  )
})

// 计算当前需要渲染的可见项数组（只取可视区域的数据）
const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value) // 截取可视范围的数据
})

// 计算整个列表的总高度（用来撑开滚动条）
const totalHeight = computed(() => {
  return props.items.length * props.itemHeight // 总条数 × 每项高度
})

// 计算可视区域的偏移量（用来定位可见项的位置）
const offsetY = computed(() => {
  return startIndex.value * props.itemHeight // 起始索引 × 每项高度
})

// 处理滚动事件，更新 scrollTop
const handleScroll = (e: Event) => {
  scrollTop.value = (e.target as HTMLElement).scrollTop // 读取容器的滚动距离
}
</script>

<template>
  <!-- 外层容器：固定高度，可滚动 -->
  <div class="virtual-list" :style="{ height: containerHeight + 'px' }" @scroll="handleScroll">
    <!-- 撑开滚动条的占位层（总高度 = 所有项的高度之和） -->
    <div class="virtual-list-spacer" :style="{ height: totalHeight + 'px' }">
      <!-- 实际渲染层：通过 translateY 偏移到正确位置 -->
      <div class="virtual-list-content" :style="{ transform: `translateY(${offsetY}px)` }">
        <!-- 只渲染可见项，大幅减少 DOM 节点数量 -->
        <div
          v-for="(item, index) in visibleItems"
          :key="startIndex + index"
          class="virtual-list-item"
          :style="{ height: itemHeight + 'px' }"
        >
          <!-- 通过插槽把每条数据传给父组件渲染 -->
          <slot :item="item" :index="startIndex + index" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 容器开启纵向滚动 */
.virtual-list {
  overflow-y: auto;
}

/* 实际渲染层使用绝对定位，配合 translateY 移动 */
.virtual-list-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}
</style>
```

```vue
<!-- 使用虚拟滚动组件 -->
<script setup lang="ts">
import { ref } from 'vue' // 引入 ref
import VirtualList from './VirtualList.vue' // 引入虚拟滚动组件

// 生成 10000 条测试数据
const items = ref(
  Array.from({ length: 10000 }, (_, i) => ({
    // 创建 10000 个对象的数组
    id: i, // 每项的 id
    name: `项目 ${i}`, // 每项的名称
  })),
)
</script>

<template>
  <!-- 使用虚拟滚动组件，传入数据和尺寸配置 -->
  <VirtualList :items="items" :item-height="50" :container-height="400">
    <!-- 通过作用域插槽自定义每一项的渲染内容 -->
    <template #default="{ item, index }">
      <div class="item-content">{{ index }}. {{ item.name }}</div>
    </template>
  </VirtualList>
</template>
```

### 7. 图片懒加载 —— 进入可视区域才加载

> **类比**：你逛画册的时候，只有翻到某一页才会看到那一页的图片。图片懒加载就是"翻到才加载"。

```vue
<!-- LazyImage.vue —— 图片懒加载组件 -->
<script setup lang="ts">
import { ref, onMounted } from 'vue' // 引入 ref 和 onMounted

// 定义 props：接收图片地址和 alt 文本
const props = defineProps<{
  src: string // 图片 URL
  alt: string // 图片的 alt 属性（无障碍描述）
}>()

// 图片容器的 DOM 引用
const imageRef = ref<HTMLImageElement | null>(null)
// 图片是否已加载完成
const isLoaded = ref(false)
// 图片是否已进入可视区域
const isInViewport = ref(false)

// 组件挂载后，设置 IntersectionObserver 监听元素是否进入可视区域
onMounted(() => {
  // 创建 IntersectionObserver 实例
  const observer = new IntersectionObserver(
    (entries) => {
      // 回调函数，接收观察到的元素变化
      entries.forEach((entry) => {
        // 遍历每个被观察的元素
        if (entry.isIntersecting) {
          // 如果元素进入了可视区域
          isInViewport.value = true // 标记为"已进入可视区域"，触发 img 渲染
          observer.disconnect() // 停止观察（只需要检测一次）
        }
      })
    },
    { threshold: 0.1 }, // 元素露出 10% 就算"进入可视区域"
  )

  // 如果拿到了 DOM 引用，开始观察
  if (imageRef.value) {
    observer.observe(imageRef.value) // 让 observer 开始监听这个 DOM 元素
  }
})

// 图片加载完成后的回调
const handleLoad = () => {
  isLoaded.value = true // 标记图片已加载完成，用于淡入动画
}
</script>

<template>
  <!-- 外层容器，用于 observer 监听 -->
  <div ref="imageRef" class="lazy-image">
    <!-- 只有进入可视区域才渲染 img 标签（才会发起图片请求） -->
    <img
      v-if="isInViewport"
      :src="src"
      :alt="alt"
      @load="handleLoad"
      :class="{ loaded: isLoaded }"
    />
    <!-- 未进入可视区域时显示占位符 -->
    <div v-else class="placeholder">加载中...</div>
  </div>
</template>

<style scoped>
/* 容器最小高度，防止布局跳动 */
.lazy-image {
  min-height: 200px;
}

/* 图片默认透明，加载完成后通过 class 变为不透明（实现淡入效果） */
img {
  opacity: 0;
  transition: opacity 0.3s;
}

img.loaded {
  opacity: 1;
}

/* 占位符样式 */
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  height: 200px;
}
</style>
```

### 8. keep-alive —— 缓存组件状态

> **类比**：你在餐厅有固定的座位，每次来都不用重新找位置、重新点常喝的饮料。`keep-alive` 就是给组件留个"固定座位"，切换回来时状态还在。

```vue
<script setup lang="ts">
import { ref, shallowRef } from 'vue' // 引入 ref 和 shallowRef
import TabA from './TabA.vue' // 引入标签页 A 组件
import TabB from './TabB.vue' // 引入标签页 B 组件
import TabC from './TabC.vue' // 引入标签页 C 组件

// 用 shallowRef 存储当前激活的组件（组件对象不需要深层响应式）
const currentTab = shallowRef(TabA)

// 标签页配置数组
const tabs = [
  { name: '标签 A', component: TabA }, // 标签 A 的配置
  { name: '标签 B', component: TabB }, // 标签 B 的配置
  { name: '标签 C', component: TabC }, // 标签 C 的配置
]
</script>

<template>
  <div>
    <!-- 标签按钮栏 -->
    <div class="tabs">
      <button v-for="tab in tabs" :key="tab.name" @click="currentTab = tab.component">
        {{ tab.name }}
      </button>
    </div>

    <!-- 用法一：缓存所有切换过的组件（都会保留状态） -->
    <keep-alive>
      <component :is="currentTab" />
    </keep-alive>

    <!-- 用法二：只缓存指定名称的组件（include 接收组件名，逗号分隔） -->
    <keep-alive include="TabA,TabB">
      <component :is="currentTab" />
    </keep-alive>

    <!-- 用法三：排除特定组件不缓存（exclude 接收组件名） -->
    <keep-alive exclude="TabC">
      <component :is="currentTab" />
    </keep-alive>

    <!-- 用法四：限制最多缓存多少个组件（防止内存占用过多） -->
    <keep-alive :max="10">
      <component :is="currentTab" />
    </keep-alive>
  </div>
</template>
```

### 9. 响应式数据优化 —— 大对象用浅层 + 手动触发

> **类比**：一个巨大的仓库（大对象），如果每件物品的移动都要汇报（深层响应式），管理员会累死。不如只在仓库大门装个计数器，需要的时候手动盘点（`triggerRef`）。

```vue
<script setup lang="ts">
// 引入 ref、shallowRef 和 triggerRef（手动触发更新）
import { ref, shallowRef, triggerRef } from 'vue'

// 大型数据对象使用 shallowRef（避免对 10000 条数据做深层追踪）
const largeData = shallowRef({
  items: Array.from({ length: 10000 }, (_, i) => i), // 10000 条数据
  metadata: {
    /* ... */
  }, // 元数据
})

// 修改数据后，手动触发响应式更新
const updateData = () => {
  largeData.value.items.push(10001) // 修改内部数据（shallowRef 不会自动感知）
  triggerRef(largeData) // 手动通知 Vue："数据变了，请更新视图"
}

// 不需要响应式的数据，直接用普通变量就好，别浪费 ref/reactive
const staticConfig = {
  apiUrl: 'https://api.example.com', // API 地址（不会变）
  timeout: 5000, // 超时时间（不会变）
}
// 这些配置不需要响应式追踪，直接用就行
</script>

<template>
  <div>
    <!-- 显示数据量 -->
    <p>数据量：{{ largeData.items.length }}</p>
    <!-- 点击按钮添加数据并手动触发更新 -->
    <button @click="updateData">添加数据</button>
  </div>
</template>
```

### 10. 性能监控 —— 用数据说话

> **类比**：优化不能靠感觉，得用秒表计时。性能监控就是你的"秒表"。

```typescript
// utils/performance.ts

// 工具函数：测量一段代码的执行耗时
export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now() // 记录开始时间（毫秒级精度）
  fn() // 执行要测量的函数
  const end = performance.now() // 记录结束时间
  // 打印耗时结果，保留 2 位小数
  console.log(`${name} 耗时：${(end - start).toFixed(2)}ms`)
}

// 组合式函数：提供组件渲染时间和内存使用的监控能力
export function usePerformanceMonitor() {
  // 测量组件挂载耗时
  const measureRender = (componentName: string) => {
    const start = performance.now() // 在 setup 阶段记录开始时间

    onMounted(() => {
      // 组件挂载完成后
      const end = performance.now() // 记录结束时间
      // 打印组件挂载耗时
      console.log(`${componentName} 挂载耗时：${(end - start).toFixed(2)}ms`)
    })
  }

  // 打印当前内存使用情况
  const logMemoryUsage = () => {
    if (performance.memory) {
      // performance.memory 仅在 Chrome 中可用
      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory
      console.log({
        已用堆内存: `${(usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`, // 已使用的内存
        总堆内存: `${(totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`, // 已分配的内存
        堆内存限制: `${(jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`, // 浏览器允许的最大内存
      })
    }
  }

  return {
    measureRender, // 返回组件挂载耗时测量函数
    logMemoryUsage, // 返回内存使用日志函数
  }
}
```

```vue
<!-- 在组件中使用性能监控 -->
<script setup lang="ts">
// 引入性能监控工具函数
import { usePerformanceMonitor } from './utils/performance'

// 解构获取监控方法
const { measureRender, logMemoryUsage } = usePerformanceMonitor()

// 测量当前组件的挂载耗时
measureRender('MyComponent')

// 每 5 秒打印一次内存使用情况（开发调试用，上线前记得去掉）
setInterval(logMemoryUsage, 5000)
</script>
```

---

## 对比表格

### 响应式 API 对比

| API               | 追踪深度    | 适用场景      | 修改方式                          | 性能               |
| ----------------- | ----------- | ------------- | --------------------------------- | ------------------ |
| `ref`             | 深层        | 小型嵌套对象  | 直接修改任意层级                  | 一般（追踪开销大） |
| `shallowRef`      | 仅 `.value` | 大型对象/数组 | 替换整个 `.value` 或 `triggerRef` | 好（追踪开销小）   |
| `reactive`        | 深层        | 小型嵌套对象  | 直接修改任意层级                  | 一般               |
| `shallowReactive` | 仅第一层    | 大型对象      | 修改第一层属性                    | 好                 |

### 渲染优化对比

| 技术         | 作用                 | 适用场景                        | 注意事项                           |
| ------------ | -------------------- | ------------------------------- | ---------------------------------- |
| `v-once`     | 只渲染一次，永不更新 | 纯静态内容（不会变的文本/配置） | 内容真的不会变才用                 |
| `v-memo`     | 依赖不变时跳过渲染   | 列表中的条件渲染、复杂子树      | 依赖数组要写对，写错了会导致不更新 |
| `keep-alive` | 缓存组件实例和状态   | Tab 切换、路由页面缓存          | 注意 `max` 限制，防止内存泄漏      |
| `computed`   | 基于依赖缓存计算结果 | 任何依赖响应式数据的派生计算    | 依赖不变就返回缓存值               |

### 加载优化对比

| 技术       | 作用                   | 适用场景                     | 注意事项                    |
| ---------- | ---------------------- | ---------------------------- | --------------------------- |
| 路由懒加载 | 按路由分割代码包       | 所有多页面应用               | 几乎没有副作用，必用        |
| 异步组件   | 延迟加载重型组件       | 弹窗、图表等不常用的重型组件 | 配合 loading/error 组件使用 |
| 图片懒加载 | 进入可视区域才加载图片 | 长页面中的图片列表           | 首屏图片不要懒加载          |
| 虚拟滚动   | 只渲染可视区域的列表项 | 超过 100 条的大列表          | 要求固定行高或动态行高方案  |

---

## 新手常见误区

### 误区 1：所有数据都用 `ref` / `reactive`

❌ **错误写法**：

```typescript
// 配置信息永远不会变，不需要响应式
const config = ref({
  apiUrl: 'https://api.example.com',
  timeout: 5000,
})
```

✅ **正确写法**：

```typescript
// 不会变的数据直接用普通对象就好
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
}
```

> **为什么**：`ref` 会给数据加上响应式追踪的"钩子"，数据不变的话这些钩子就是白白浪费性能。

### 误区 2：用 `shallowRef` 后还直接修改内部属性

❌ **错误写法**：

```typescript
const data = shallowRef({ count: 0 })
data.value.count++ // ❌ 不会触发视图更新！
```

✅ **正确写法**：

```typescript
const data = shallowRef({ count: 0 })
// 方式一：替换整个 .value
data.value = { ...data.value, count: data.value.count + 1 }
// 方式二：修改后手动触发
data.value.count++
triggerRef(data)
```

### 误区 3：`v-memo` 依赖数组写成了常量

❌ **错误写法**：

```vue
<!-- 依赖数组里是常量 true，永远不会变，等于 v-once -->
<div v-memo="[true]">内容</div>
```

✅ **正确写法**：

```vue
<!-- 依赖数组里应该是响应式数据的表达式 -->
<div v-memo="[count > 10]">内容</div>
```

### 误区 4：首屏图片也做懒加载

❌ **错误写法**：

```vue
<!-- 首屏 Banner 图也懒加载，用户打开页面先看到空白 -->
<LazyImage src="/banner.jpg" alt="首页大图" />
```

✅ **正确写法**：

```vue
<!-- 首屏关键图片直接加载，非首屏图片才用懒加载 -->
<img src="/banner.jpg" alt="首页大图" />
<LazyImage src="/photo1.jpg" alt="下方图片" />
```

### 误区 5：滥用 `keep-alive` 缓存所有组件

❌ **错误写法**：

```vue
<!-- 缓存所有组件，包括那些每次进来都需要重新获取数据的 -->
<keep-alive>
  <component :is="currentView" />
</keep-alive>
```

✅ **正确写法**：

```vue
<!-- 只缓存需要保留状态的组件，用 include 精确控制 -->
<keep-alive include="UserList,Settings">
  <component :is="currentView" />
</keep-alive>
```

---

## 动手练习

### 练习 1（基础）：给路由添加懒加载

把下面的路由配置改成懒加载形式，并给 Dashboard 页面指定 webpackChunkName 为 `"dashboard"`。

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import Dashboard from '../views/Dashboard.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/dashboard', component: Dashboard },
]
```

<details>
<summary>点击查看答案</summary>

```typescript
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    // 把静态 import 改成箭头函数 + 动态 import()
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/about',
    component: () => import('../views/About.vue'),
  },
  {
    path: '/dashboard',
    // 用 webpackChunkName 注释指定打包后的文件名
    component: () =>
      import(
        /* webpackChunkName: "dashboard" */
        '../views/Dashboard.vue'
      ),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})
```

</details>

### 练习 2（进阶）：用 `shallowRef` + `triggerRef` 优化大列表

有一个包含 5000 条数据的列表，需要实现"添加一条数据"和"删除最后一条数据"的功能。请使用 `shallowRef` 和 `triggerRef` 实现，确保不会因为深层追踪导致性能问题。

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { shallowRef, triggerRef } from 'vue'

// 用 shallowRef 存储大列表，避免对 5000 条数据做深层追踪
const list = shallowRef(Array.from({ length: 5000 }, (_, i) => ({ id: i, name: `项目 ${i}` })))

// 添加数据：修改数组后手动触发更新
const addItem = () => {
  list.value.push({
    // 向数组末尾添加新项
    id: list.value.length, // id 为当前长度
    name: `项目 ${list.value.length}`, // 名称
  })
  triggerRef(list) // 手动通知 Vue 数据变了
}

// 删除数据：修改数组后手动触发更新
const removeItem = () => {
  list.value.pop() // 移除数组最后一项
  triggerRef(list) // 手动通知 Vue 数据变了
}
</script>

<template>
  <div>
    <p>数据量：{{ list.length }}</p>
    <button @click="addItem">添加</button>
    <button @click="removeItem">删除</button>
  </div>
</template>
```

</details>

### 练习 3（挑战）：实现一个带缓存的购物车总价计算

实现一个购物车功能，要求：

1. 商品列表用 `ref` 存储，每项包含 `price` 和 `quantity`
2. 用 `computed` 计算总价（有缓存）
3. 用 `v-memo` 优化商品列表渲染（只有商品数量变化时才重新渲染该项）
4. 提供一个"打折"按钮，点击后所有商品打 8 折

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// 购物车商品列表
const items = ref([
  { id: 1, name: 'Vue 3 实战', price: 99, quantity: 1 },
  { id: 2, name: 'TypeScript 入门', price: 69, quantity: 2 },
  { id: 3, name: 'Vite 工程化', price: 79, quantity: 1 },
])

// 折扣比例（1 表示原价，0.8 表示 8 折）
const discount = ref(1)

// 计算总价：依赖 items 和 discount，任一变化才重新计算
const totalPrice = computed(() => {
  return items.value.reduce((sum, item) => {
    return sum + item.price * item.quantity * discount.value // 单价 × 数量 × 折扣
  }, 0)
})

// 打折函数：把所有商品打 8 折
const applyDiscount = () => {
  discount.value = 0.8 // 修改折扣，computed 会自动重新计算总价
}
</script>

<template>
  <div>
    <!-- 商品列表：v-memo 依赖 quantity，只有数量变了才重新渲染该项 -->
    <div v-for="item in items" :key="item.id" v-memo="[item.quantity]">
      <p>{{ item.name }} - ¥{{ item.price }} × {{ item.quantity }}</p>
    </div>

    <!-- 总价显示 -->
    <p>总价：¥{{ totalPrice.toFixed(2) }}</p>

    <!-- 打折按钮 -->
    <button @click="applyDiscount">打 8 折</button>
  </div>
</template>
```

</details>

---

## 总结与下一章预告

恭喜你完成了 Vue 3 教程的全部 16 章！让我们回顾一下这段旅程：

| 阶段   | 章节  | 你学会了什么                                     |
| ------ | ----- | ------------------------------------------------ |
| 入门   | 1-4   | 创建项目、模板语法、响应式数据、计算属性与侦听器 |
| 进阶   | 5-8   | 条件渲染、列表渲染、事件处理、表单绑定           |
| 组件化 | 9-12  | 组件通信、插槽、组合式函数、Provide/Inject       |
| 生态   | 13-15 | Vue Router、Pinia 状态管理、网络请求与错误处理   |
| 实战   | 16    | 性能优化与最佳实践（本章）                       |

### 接下来该学什么？

教程虽然结束了，但学习不会停止。以下是一些推荐的进阶方向：

1. **TypeScript 深入** —— 给 Vue 组件加上完整的类型定义
2. **单元测试** —— 用 Vitest + Vue Test Utils 写测试
3. **SSR / SSG** —— 学习 Nuxt 3，实现服务端渲染
4. **源码阅读** —— 深入 Vue 3 的响应式系统和虚拟 DOM 实现
5. **实战项目** —— 用学到的知识做一个完整的项目

> 记住：**学技术最好的方式就是动手写**。打开编辑器，从今天开始做你的下一个 Vue 3 项目吧！
