---
title: "第十六章：Vue 2 到 Vue 3 迁移指南"
description: "了解 Vue 2 到 Vue 3 的破坏性变更和迁移策略，帮助项目平滑升级。"
---

# 第十六章：Vue 2 到 Vue 3 迁移指南

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Vue 3 和 Vue 2 到底有哪些不同？直接升级会出什么问题？
- 我的 Vue 2 项目能平滑迁移到 Vue 3 吗？需要改多少代码？
- Composition API 是什么？一定要用它吗？
- 迁移过程中有哪些常见的坑需要提前注意？

这一章就是为了解答这些问题。我们会系统梳理 Vue 2 到 Vue 3 的**破坏性变更**，手把手教你迁移步骤，介绍 Vue 3 的新特性，并帮你避开常见的迁移陷阱。学完这一章，你就能自信地把 Vue 2 项目升级到 Vue 3 了。

---

## 1 为什么需要迁移到 Vue 3？

### 痛点分析

Vue 2 已经非常优秀了，为什么还要迁移到 Vue 3？

1. **Vue 2 已于 2023 年底停止维护（EOL）**，不再有安全更新和 bug 修复
2. **TypeScript 支持差**：Vue 2 的 TS 支持是"后加"的，体验不好
3. **大型项目代码组织困难**：Options API 让同一个功能的代码分散在 data、methods、computed 等不同位置
4. **性能瓶颈**：响应式系统基于 `Object.defineProperty`，有性能限制和无法检测属性增删的问题

### 解决方案

Vue 3 带来了全方位的升级：

打个比方：

> 如果 Vue 2 是一辆好车，那 Vue 3 就是同一品牌的新一代车型——发动机（响应式系统）换了，底盘（虚拟 DOM）升级了，驾驶体验（Composition API）也更好了。但方向盘的基本操作（模板语法、核心概念）还是一样的。

| 特性 | Vue 2 | Vue 3 |
|------|-------|-------|
| 响应式系统 | `Object.defineProperty` | `Proxy`（更快、更全面） |
| API 风格 | Options API | Options API + Composition API |
| TypeScript | 支持一般 | 原生支持 |
| 性能 | 良好 | 更快（体积减小 40%，速度提升 50%） |
| 多根节点 | ❌ 不支持 | ✅ 支持（Fragment） |
| Teleport | ❌ 没有 | ✅ 内置 |
| Suspense | ❌ 没有 | ✅ 内置（实验性） |

> **一句话总结**：Vue 3 更快、更强、对 TypeScript 更友好，而且 Vue 2 已经停止维护，迁移是迟早的事。

---

## 2 核心原理

### 响应式系统升级

Vue 2 使用 `Object.defineProperty` 实现响应式，Vue 3 改用 `Proxy`。

打个比方：

> Vue 2 的响应式像给每个房间装了监控，但新盖的房间（新增属性）监控不到，需要提前申报（`Vue.set`）。Vue 3 的 Proxy 像在大门口装了一个总监控，不管哪个房间（包括新盖的），进出都会被看到。

```javascript
// Vue 2 的响应式限制
const obj = { name: '张三' }

// ❌ 新增属性，Vue 2 检测不到
obj.age = 25 // 不会触发视图更新

// ✅ Vue 2 必须用 Vue.set
Vue.set(obj, 'age', 25) // 才能触发更新
```

```javascript
// Vue 3 的 Proxy 没有这个限制
const obj = reactive({ name: '张三' })

// ✅ 直接新增属性，Vue 3 能检测到
obj.age = 25 // 自动触发视图更新！
```

### 虚拟 DOM 重写

Vue 3 重写了虚拟 DOM，加入了**静态提升**和**补丁标记**等优化。

打个比方：

> Vue 2 每次更新都要对比整棵"树"（虚拟 DOM），Vue 3 会标记哪些"树枝"是静态的（不会变），对比时直接跳过，只看会变化的部分。就像改文章时，只检查修改过的段落，没改的直接跳过。

---

## 3 破坏性变更详解

### 1. 全局 API 变更

Vue 2 的全局 API 会污染全局 Vue 对象，Vue 3 改为应用实例级别。

```javascript
// ===== Vue 2 =====
import Vue from 'vue' // 引入 Vue 构造函数

// 全局配置（影响所有实例）
Vue.config.productionTip = false // 关闭生产提示

// 全局注册组件（影响所有实例）
Vue.component('my-component', { /* ... */ }) // 所有 Vue 实例都能用

// 全局注册指令
Vue.directive('focus', { // 所有 Vue 实例都能用
  inserted(el) { el.focus() }
})

// 全局混入（影响所有实例，容易冲突）
Vue.mixin({ // 污染所有组件
  created() { console.log('混入') }
})

// 创建根实例
new Vue({
  render: h => h(App)
}).$mount('#app')
```

```javascript
// ===== Vue 3 =====
import { createApp } from 'vue' // 引入 createApp 工厂函数

const app = createApp(App) // 创建应用实例

// 应用级配置（只影响当前实例）
app.config.productionTip = false // 只影响这个实例

// 应用级注册组件（只影响当前实例）
app.component('my-component', { /* ... */ }) // 只有这个实例能用

// 应用级注册指令
app.directive('focus', { // 只有这个实例能用
  mounted(el) { el.focus() } // 注意：inserted 改为 mounted
})

// 应用级混入（只影响当前实例）
app.mixin({ // 只影响这个实例的组件
  created() { console.log('混入') }
})

// 挂载应用
app.mount('#app')
```

**为什么这样改？** Vue 2 的全局 API 会导致多个 Vue 实例互相影响。Vue 3 的应用实例互相隔离，更安全。

### 2. 过滤器（Filters）被移除

```vue
<!-- ===== Vue 2：使用过滤器 -->
<template>
  <p>{{ message | capitalize }}</p> <!-- 使用 | 管道符 -->
  <p>{{ price | currency('¥') }}</p> <!-- 过滤器可以传参 -->
</template>

<script>
export default {
  filters: {
    capitalize(value) {
      return value.toUpperCase() // 转大写
    },
    currency(value, symbol = '¥') {
      return symbol + value.toFixed(2) // 格式化货币
    }
  }
}
</script>
```

```vue
<!-- ===== Vue 3：使用 computed 或方法替代 -->
<template>
  <p>{{ capitalizedMessage }}</p> <!-- 使用 computed -->
  <p>{{ formatCurrency(price) }}</p> <!-- 使用方法 -->
</template>

<script>
export default {
  data() {
    return {
      message: 'hello',
      price: 99.5
    }
  },
  computed: {
    // 替代过滤器：用 computed
    capitalizedMessage() {
      return this.message.toUpperCase() // 转大写
    }
  },
  methods: {
    // 替代过滤器：用方法
    formatCurrency(value, symbol = '¥') {
      return symbol + value.toFixed(2) // 格式化货币
    }
  }
}
</script>
```

**为什么移除？** 过滤器虽然方便，但增加了模板的"魔法"。用 computed 和方法替代，逻辑更清晰，也更容易测试。

### 3. `.sync` 修饰符被移除

```vue
<!-- ===== Vue 2：使用 .sync -->
<template>
  <!-- 父组件 -->
  <child :title.sync="pageTitle" />
  <!-- 等价于 -->
  <child :title="pageTitle" @update:title="pageTitle = $event" />
</template>
```

```vue
<!-- ===== Vue 3：合并到 v-model -->
<template>
  <!-- 父组件：直接用 v-model:prop -->
  <child v-model:title="pageTitle" />
  <!-- 等价于 -->
  <child :title="pageTitle" @update:title="pageTitle = $event" />
</template>

<script>
// 子组件
export default {
  props: ['title'], // 接收 title
  methods: {
    updateTitle() {
      this.$emit('update:title', '新标题') // 触发 update:title 事件
    }
  }
}
</script>
```

**为什么这样改？** `.sync` 和 `v-model` 做的事情一样，Vue 3 统一用 `v-model:prop` 语法，减少概念负担。

### 4. v-model 变更

```vue
<!-- ===== Vue 2 ===== -->
<template>
  <child v-model="value" />
  <!-- 等价于 -->
  <child :value="value" @input="value = $event" />
</template>

<!-- 子组件 -->
<script>
export default {
  props: ['value'], // prop 名是 value
  methods: {
    update() {
      this.$emit('input', newValue) // 事件名是 input
    }
  }
}
</script>
```

```vue
<!-- ===== Vue 3 ===== -->
<template>
  <child v-model="value" />
  <!-- 等价于 -->
  <child :modelValue="value" @update:modelValue="value = $event" />
  
  <!-- 支持多个 v-model！ -->
  <child v-model:firstName="first" v-model:lastName="last" />
</template>

<!-- 子组件 -->
<script>
export default {
  props: ['modelValue'], // prop 名改为 modelValue
  emits: ['update:modelValue'], // 声明事件（推荐）
  methods: {
    update() {
      this.$emit('update:modelValue', newValue) // 事件名改为 update:modelValue
    }
  }
}
</script>
```

**关键变化：**
- `value` → `modelValue`
- `input` 事件 → `update:modelValue` 事件
- 支持多个 `v-model`

### 5. 移除的特性汇总

| 特性 | Vue 2 | Vue 3 替代方案 |
|------|-------|----------------|
| Filters（过滤器） | ✅ `{{ msg \| filter }}` | ❌ 用 computed 或 methods |
| `.sync` 修饰符 | ✅ `:title.sync` | ❌ 用 `v-model:title` |
| `$on/$off/$once` | ✅ EventBus 模式 | ❌ 用 mitt 或 tiny-emitter |
| `$children` | ✅ 访问子组件 | ❌ 用 `$refs` 或 `ref` |
| `$listeners` | ✅ 监听事件 | ❌ 合并到 `$attrs` |
| `$destroy` | ✅ 销毁实例 | ❌ 手动管理 |
| `functional` 选项 | ✅ 函数式组件 | ❌ 返回函数的组件 |
| `keyCode` 修饰符 | ✅ `@keyup.13` | ❌ 用 `@keyup.enter` |

### 6. 生命周期变更

```javascript
// ===== Vue 2 =====
export default {
  beforeCreate() {},   // 实例初始化之前
  created() {},        // 实例创建完成
  beforeMount() {},    // 挂载之前
  mounted() {},        // 挂载完成
  beforeUpdate() {},   // 更新之前
  updated() {},        // 更新完成
  beforeDestroy() {},  // 销毁之前
  destroyed() {}       // 销毁完成
}
```

```javascript
// ===== Vue 3（Options API）=====
export default {
  beforeCreate() {},    // 不变
  created() {},         // 不变
  beforeMount() {},     // 不变
  mounted() {},         // 不变
  beforeUpdate() {},    // 不变
  updated() {},         // 不变
  beforeUnmount() {},   // ✅ 更名：beforeDestroy → beforeUnmount
  unmounted() {}        // ✅ 更名：destroyed → unmounted
}
```

```javascript
// ===== Vue 3（Composition API）=====
import {
  onBeforeMount,     // 对应 beforeMount
  onMounted,         // 对应 mounted
  onBeforeUpdate,    // 对应 beforeUpdate
  onUpdated,         // 对应 updated
  onBeforeUnmount,   // 对应 beforeUnmount
  onUnmounted        // 对应 unmounted
} from 'vue'

export default {
  setup() {
    onBeforeMount(() => { /* 挂载之前 */ })
    onMounted(() => { /* 挂载完成 */ })
    onBeforeUnmount(() => { /* 卸载之前 */ })
    onUnmounted(() => { /* 卸载完成 */ })
  }
}
```

### 7. render 函数变更

```javascript
// ===== Vue 2：h 作为参数传入 =====
export default {
  render(h) { // h 作为 render 函数的参数
    return h('div', { class: 'box' }, 'Hello')
  }
}
```

```javascript
// ===== Vue 3：h 需要导入 =====
import { h } from 'vue' // 从 vue 中导入 h

export default {
  render() { // 没有参数了
    return h('div', { class: 'box' }, 'Hello')
  }
}
```

---

## 4 Vue 3 新特性介绍

### 1. Composition API

Composition API 是 Vue 3 最重要的新特性，让你可以按功能组织代码。

```vue
<!-- ===== Vue 2：Options API，代码按选项分散 ===== -->
<script>
export default {
  data() {
    return {
      // 搜索相关
      searchQuery: '',
      searchResults: [],
      // 分页相关
      currentPage: 1,
      pageSize: 10
    }
  },
  computed: {
    // 搜索和分页的代码混在一起
    totalPages() { return Math.ceil(this.searchResults.length / this.pageSize) },
    pagedResults() { /* ... */ }
  },
  methods: {
    search() { /* 搜索逻辑 */ },
    nextPage() { /* 分页逻辑 */ },
    prevPage() { /* 分页逻辑 */ }
  },
  watch: {
    searchQuery() { this.search() } // 搜索逻辑分散在 watch 中
  }
}
</script>
```

```vue
<!-- ===== Vue 3：Composition API，代码按功能聚合 ===== -->
<script setup>
import { ref, computed, watch } from 'vue'

// ===== 搜索功能（代码在一起）=====
const searchQuery = ref('') // 搜索关键词
const searchResults = ref([]) // 搜索结果

async function search() { // 搜索方法
  searchResults.value = await api.search(searchQuery.value)
}

watch(searchQuery, search) // 监听搜索词变化

// ===== 分页功能（代码在一起）=====
const currentPage = ref(1) // 当前页
const pageSize = ref(10) // 每页数量

const totalPages = computed(() => { // 总页数
  return Math.ceil(searchResults.value.length / pageSize.value)
})

function nextPage() { currentPage.value++ } // 下一页
function prevPage() { currentPage.value-- } // 上一页
</script>
```

**优势**：同一个功能的代码放在一起，不再是 data 写一点、methods 写一点、computed 写一点。

### 2. Teleport（传送门）

把组件的 DOM 渲染到指定位置（比如 `<body>` 下），常用于模态框。

```vue
<template>
  <button @click="showModal = true">打开模态框</button>
  
  <!-- 虽然写在这里，但 DOM 会渲染到 body 下 -->
  <teleport to="body">
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <p>这是模态框内容</p>
        <button @click="showModal = false">关闭</button>
      </div>
    </div>
  </teleport>
</template>

<script>
export default {
  data() {
    return {
      showModal: false // 控制模态框显示
    }
  }
}
</script>
```

**为什么需要？** 模态框如果在深层嵌套的组件里，`z-index` 和 `overflow` 可能导致显示异常。Teleport 把 DOM 直接放到 `<body>` 下，避免这些问题。

### 3. 多根节点（Fragment）

```vue
<!-- ===== Vue 2：必须单根节点 ===== -->
<template>
  <div> <!-- 必须有一个包裹元素 -->
    <header>头部</header>
    <main>内容</main>
    <footer>底部</footer>
  </div>
</template>
```

```vue
<!-- ===== Vue 3：支持多根节点 ===== -->
<template>
  <header>头部</header> <!-- 不需要包裹元素！ -->
  <main>内容</main>
  <footer>底部</footer>
</template>
```

### 4. 新的组件声明：defineProps / defineEmits（`<script setup>`）

```vue
<!-- ===== Vue 3 <script setup> ===== -->
<script setup>
import { ref } from 'vue'

// 声明 props（编译时宏，不需要导入）
const props = defineProps({
  title: String, // 标题
  count: { type: Number, default: 0 } // 计数，默认 0
})

// 声明 emits（编译时宏，不需要导入）
const emit = defineEmits(['update', 'delete'])

// 使用
function handleClick() {
  emit('update', props.count + 1) // 触发事件
}
</script>
```

---

## 5 迁移步骤

### 第一步：使用迁移构建版本

Vue 提供了 `@vue/compat` 包，让你在 Vue 3 环境下运行 Vue 2 代码，并给出兼容性警告。

```bash
# 安装兼容包
npm install vue@3 @vue/compat
```

```javascript
// vue.config.js（Webpack 配置）
module.exports = {
  chainWebpack: config => {
    // 把 vue 别名指向 @vue/compat
    config.resolve.alias.set('vue', '@vue/compat')
    
    // 配置编译器选项
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => {
        options.compilerOptions = {
          compatConfig: {
            MODE: 2 // 以 Vue 2 兼容模式运行
          }
        }
      })
  }
}
```

```javascript
// main.js
import Vue from 'vue' // 在兼容模式下，这实际上是 @vue/compat

// 配置兼容模式
Vue.configureCompat({
  MODE: 2, // 默认以 Vue 2 行为运行
  GLOBAL_MOUNT: false, // 关闭某些已迁移的特性
  FILTERS: false // 关闭过滤器兼容（如果你已经不用了）
})

new Vue({
  render: h => h(App)
}).$mount('#app')
```

### 第二步：运行并修复警告

```bash
# 启动开发服务器
npm run serve
```

运行后，控制台会输出类似这样的警告：

```
[Vue compat warn]: GLOBAL_MOUNT is using Vue 2 behavior and will need to be migrated.
```

根据警告逐步修复代码。

### 第三步：逐步关闭兼容特性

```javascript
// main.js
Vue.configureCompat({
  MODE: 2,
  FILTERS: false, // 已修复过滤器 → 关闭
  GLOBAL_MOUNT: false, // 已修复全局 API → 关闭
  // 继续关闭已修复的特性...
})
```

### 第四步：切换到真正的 Vue 3

当所有兼容特性都关闭后：

```bash
# 卸载兼容包
npm uninstall @vue/compat

# 安装 Vue 3
npm install vue@3
```

```javascript
// main.js：改为 Vue 3 写法
import { createApp } from 'vue' // 引入 createApp
import App from './App.vue'

const app = createApp(App) // 创建应用实例
app.mount('#app') // 挂载
```

### 迁移工具

```bash
# 安装官方迁移工具
npm install -g @vue/compat-migration

# 扫描项目，自动修复部分代码
vue-compat-migrate ./src
```

---

## 6 核心知识点总结

### 破坏性变更速查表

| 变更项 | Vue 2 | Vue 3 | 影响程度 |
|--------|-------|-------|----------|
| 创建实例 | `new Vue()` | `createApp()` | ⭐⭐⭐ 必改 |
| 全局 API | `Vue.xxx()` | `app.xxx()` | ⭐⭐⭐ 必改 |
| 过滤器 | `{{ msg \| filter }}` | computed / methods | ⭐⭐ 需改 |
| `.sync` | `:title.sync` | `v-model:title` | ⭐⭐ 需改 |
| v-model | `value` + `input` | `modelValue` + `update:modelValue` | ⭐⭐ 需改 |
| EventBus | `$on/$emit/$off` | mitt 库 | ⭐⭐ 需改 |
| 生命周期 | `beforeDestroy/destroyed` | `beforeUnmount/unmounted` | ⭐ 小改 |
| render 函数 | `render(h)` | `import { h }` | ⭐ 小改 |
| `$children` | 直接访问 | 用 `$refs` | ⭐ 需改 |

### 迁移优先级

| 优先级 | 任务 | 说明 |
|--------|------|------|
| 🔴 高 | 全局 API 迁移 | `new Vue()` → `createApp()` |
| 🔴 高 | 移除 Filters | 改用 computed 或 methods |
| 🟡 中 | v-model 更新 | 子组件 prop 和 emit 更名 |
| 🟡 中 | 移除 .sync | 改用 v-model:prop |
| 🟡 中 | EventBus 替换 | 改用 mitt |
| 🟢 低 | 生命周期更名 | `destroyed` → `unmounted` |
| 🟢 低 | render 函数更新 | 导入 h |

---

## 7 新手常见误区

### 误区 1：以为迁移必须一步到位

```
// ❌ 错误想法：必须一次性把所有代码都改成 Vue 3 写法

// ✅ 正确做法：使用兼容模式，逐步迁移
// 1. 先装 @vue/compat，让项目能在 Vue 3 下跑起来
// 2. 根据控制台警告，逐个修复
// 3. 全部修复后，再移除 compat 包
```

**为什么错？** 一次性改完容易出错，而且项目可能很大。兼容模式让你可以边开发边迁移。

### 误区 2：以为必须用 Composition API

```vue
<!-- ❌ 错误想法：Vue 3 必须用 <script setup> -->
<script setup>
// 觉得必须这样写
</script>

<!-- ✅ 正确做法：Options API 在 Vue 3 中完全支持 -->
<script>
export default {
  data() { return { count: 0 } }, // Options API 照样能用
  methods: {
    increment() { this.count++ }
  }
}
</script>
```

**为什么错？** Vue 3 完全支持 Options API，Composition API 是可选的。你可以先用 Options API 迁移，之后再逐步改用 Composition API。

### 误区 3：忘记更新第三方库

```javascript
// ❌ 错误：只升级 Vue，不升级其他库
// package.json
{
  "vue": "^3.0.0",
  "vue-router": "^3.0.0", // Vue Router 3 是给 Vue 2 用的！
  "vuex": "^3.0.0" // Vuex 3 是给 Vue 2 用的！
}

// ✅ 正确：同步升级所有 Vue 生态库
// package.json
{
  "vue": "^3.0.0",
  "vue-router": "^4.0.0", // Vue Router 4 对应 Vue 3
  "vuex": "^4.0.0" // Vuex 4 对应 Vue 3（或直接用 Pinia）
}
```

**为什么错？** Vue 2 的生态库和 Vue 3 不兼容，必须升级到对应版本。

### 误区 4：忽略 render 函数的 h 参数变化

```javascript
// ❌ 错误：Vue 3 中 render 函数不再有 h 参数
export default {
  render(h) { // h 是 undefined！
    return h('div', 'Hello')
  }
}

// ✅ 正确：Vue 3 需要导入 h
import { h } from 'vue'

export default {
  render() { // 没有参数
    return h('div', 'Hello')
  }
}
```

**为什么错？** Vue 3 不再自动注入 `h` 参数，必须手动从 `vue` 导入。

### 误区 5：在兼容模式下忽略警告

```javascript
// ❌ 错误：看到警告不处理，直接上线
// 控制台输出了很多 compat warn，但不管不顾

// ✅ 正确：每个警告都要处理
// 1. 开发时关注控制台警告
// 2. 逐个修复
// 3. 最终目标是所有警告消失
```

**为什么错？** 兼容模式下的警告就是"定时炸弹"，现在不修，等移除 compat 包后就会报错。

---

## 8 动手练习

### 练习 1：基础练习 - 全局 API 迁移

将以下 Vue 2 代码迁移到 Vue 3：

```javascript
// Vue 2 代码
import Vue from 'vue'

Vue.config.productionTip = false

Vue.component('hello', {
  template: '<p>Hello!</p>'
})

Vue.directive('focus', {
  inserted(el) { el.focus() }
})

new Vue({
  render: h => h(App)
}).$mount('#app')
```

<details>
<summary>点击查看答案</summary>

```javascript
// Vue 3 迁移后
import { createApp } from 'vue' // 引入 createApp
import App from './App.vue'

const app = createApp(App) // 创建应用实例

// 全局组件改为实例方法
app.component('hello', {
  template: '<p>Hello!</p>'
})

// 全局指令改为实例方法
app.directive('focus', {
  mounted(el) { el.focus() } // inserted 改为 mounted
})

// 挂载
app.mount('#app')
```

</details>

### 练习 2：进阶练习 - 过滤器和 .sync 迁移

将以下 Vue 2 组件迁移到 Vue 3：

```vue
<!-- Vue 2 组件 -->
<template>
  <div>
    <p>{{ price | currency }}</p>
    <p>{{ name | uppercase }}</p>
    <child :title.sync="pageTitle" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      price: 99.5,
      name: 'hello',
      pageTitle: '首页'
    }
  },
  filters: {
    currency(value) {
      return '¥' + value.toFixed(2)
    },
    uppercase(value) {
      return value.toUpperCase()
    }
  }
}
</script>
```

<details>
<summary>点击查看答案</summary>

```vue
<!-- Vue 3 迁移后 -->
<template>
  <div>
    <p>{{ formattedPrice }}</p> <!-- 用 computed 替代过滤器 -->
    <p>{{ upperName }}</p> <!-- 用 computed 替代过滤器 -->
    <child v-model:title="pageTitle" /> <!-- .sync 改为 v-model:title -->
  </div>
</template>

<script>
export default {
  data() {
    return {
      price: 99.5,
      name: 'hello',
      pageTitle: '首页'
    }
  },
  computed: {
    // 替代 currency 过滤器
    formattedPrice() {
      return '¥' + this.price.toFixed(2)
    },
    // 替代 uppercase 过滤器
    upperName() {
      return this.name.toUpperCase()
    }
  }
}
</script>
```

</details>

### 练习 3（挑战）：完整组件迁移

将以下 Vue 2 组件完整迁移到 Vue 3，使用 Composition API（`<script setup>`）：

```vue
<!-- Vue 2 组件 -->
<template>
  <div>
    <p>{{ message | uppercase }}</p>
    <p>计数：{{ count }}</p>
    <p>双倍：{{ doubleCount }}</p>
    <button @click="increment">增加</button>
    <child :value.sync="count" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'hello',
      count: 0
    }
  },
  computed: {
    doubleCount() {
      return this.count * 2
    }
  },
  methods: {
    increment() {
      this.count++
    }
  },
  filters: {
    uppercase(value) {
      return value.toUpperCase()
    }
  },
  beforeDestroy() {
    console.log('组件即将销毁')
  }
}
</script>
```

<details>
<summary>点击查看答案</summary>

```vue
<!-- Vue 3 迁移后（Composition API） -->
<template>
  <div>
    <p>{{ upperMessage }}</p> <!-- 过滤器改为 computed -->
    <p>计数：{{ count }}</p>
    <p>双倍：{{ doubleCount }}</p>
    <button @click="increment">增加</button>
    <child v-model="count" /> <!-- .sync 改为 v-model -->
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue' // 引入需要的 API

// 响应式数据
const message = ref('hello') // 替代 data
const count = ref(0) // 替代 data

// 计算属性（替代 filters 和 computed）
const upperMessage = computed(() => message.value.toUpperCase())
const doubleCount = computed(() => count.value * 2)

// 方法
function increment() {
  count.value++ // 注意：ref 需要 .value
}

// 生命周期（beforeDestroy → onBeforeUnmount）
onBeforeUnmount(() => {
  console.log('组件即将卸载')
})
</script>
```

</details>

---

## 总结

恭喜你完成了 Vue 2 全系列教程的学习！🎉

回顾一下我们学过的内容：

| 章节 | 主题 | 核心内容 |
|------|------|----------|
| 第 1-6 章 | Vue 基础 | 环境搭建、模板语法、计算属性、条件/列表渲染、事件处理、表单绑定 |
| 第 7-12 章 | 组件进阶 | 组件基础、组件通信、插槽、生命周期、混入/指令、渲染函数 |
| 第 13 章 | Vue Router | 路由配置、嵌套路由、导航守卫 |
| 第 14 章 | Vuex | state、getters、mutations、actions、modules |
| 第 15 章 | 过渡与动画 | transition、transition-group、JavaScript 钩子 |
| 第 16 章 | 迁移指南 | 破坏性变更、Composition API、迁移步骤 |

**下一步学习建议：**

1. **动手实践**：用 Vue 2 做一个完整的项目（如 Todo 应用、博客系统）
2. **学习 Vue 3**：转战本站的 [Vue 3 完全指南](/tutorials/vue3)系列，学习 Composition API、Pinia 等新特性
3. **深入原理**：了解响应式系统、虚拟 DOM 等底层原理
4. **关注生态**：学习 Vite、Pinia、VueUse 等现代 Vue 生态工具

Vue 2 虽然已经停止维护，但它的设计思想（响应式、组件化、声明式渲染）在 Vue 3 中完全延续。学好了 Vue 2，迁移到 Vue 3 会非常顺畅。祝你学习愉快！
