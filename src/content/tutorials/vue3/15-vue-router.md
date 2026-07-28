---
title: '第十五章：Vue Router'
description: '掌握 Vue Router 4 的路由配置、导航守卫和动态路由'
---

# 第十五章：Vue Router

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 一个单页应用（SPA）那么多页面，到底是怎么做到"切换"的？
- 路由参数（比如 `/user/123` 里的 123）怎么拿到？怎么监听变化？
- 怎么控制谁能访问哪些页面？登录拦截怎么做？
- 路由那么多配置项，到底哪些是常用的，哪些可以以后再看？

这一章就是为了解答这些问题。我们会从 **为什么需要路由** 讲起，搞懂 **SPA 路由的核心原理**，然后手把手带你写出完整的路由配置、导航守卫、动态路由等代码。

---

## 1 为什么需要 Vue Router？

### 痛点分析

想象一下，你开了一家餐厅，但只有一个大门。所有客人——吃饭的、买单的、上厕所的——都得从同一个门进出，而且你还得自己记住"这个人是要去上厕所，别给他上菜"。

这就是 **没有路由时的多页面应用**：每次切换页面，浏览器都要重新向服务器请求一整个 HTML 页面，用户体验很差，服务器压力也大。

### 解决方案

Vue Router 就像给餐厅装了一个 **智能导航系统**——不同的客人（URL）自动被带到不同的区域（组件），整个过程不用重新开门（刷新页面）。

> **一句话总结**：Vue Router 让你在一个 HTML 页面里，根据 URL 的变化，展示不同的组件，实现"页面切换"的效果，而且不用刷新浏览器。

### 没有路由 vs 有路由

```
❌ 没有路由（传统多页面）：
用户点击链接 → 浏览器请求新页面 → 白屏等待 → 渲染新页面
每次切换都要重新加载整个页面

✅ 有路由（SPA 单页应用）：
用户点击链接 → URL 变化 → Vue Router 匹配组件 → 局部更新页面
切换是"瞬间"的，体验流畅
```

---

## 2 核心原理

### SPA 路由是怎么工作的？

打个比方：

> Vue Router 就像一个 **前台接待员**。你告诉它一张"地图"（路由表），上面写着"走这条路（URL）到哪个房间（组件）"。当客人（用户）走进来时，接待员看一眼地址，就把他带到对应的房间。

核心流程是这样的：

1. **路由表**：你定义一组规则，把 URL 路径映射到组件
2. **URL 监听**：Vue Router 监听浏览器地址栏的变化
3. **组件匹配**：根据当前 URL，在路由表中找到对应的组件
4. **视图渲染**：把匹配到的组件渲染到 `<router-view />` 的位置

### 两种路由模式

| 模式                   | 原理                    | URL 示例               | 特点                         |
| ---------------------- | ----------------------- | ---------------------- | ---------------------------- |
| `createWebHistory`     | 使用 HTML5 History API  | `example.com/user/1`   | URL 好看，需要服务器配置     |
| `createWebHashHistory` | 使用 URL 的 hash（`#`） | `example.com/#/user/1` | 不需要服务器配置，URL 带 `#` |

打个比方：

> - **History 模式** 像走正门——地址好看，但需要物业（服务器）配合，不然找不到房间
> - **Hash 模式** 像走后门——不需要物业配合，但地址上多个 `#`，不太好看

---

## 3 基础用法

### 第一步：创建路由配置

```typescript
// router/index.ts —— 路由配置文件

// 从 vue-router 中导入创建路由和创建历史模式的方法
import { createRouter, createWebHistory } from 'vue-router'

// 导入页面组件（这里用直接导入的方式）
import Home from '../views/Home.vue' // 首页组件
import About from '../views/About.vue' // 关于页组件

// 定义路由表：一个数组，每个对象描述一条"URL → 组件"的映射规则
const routes = [
  {
    path: '/', // URL 路径，'/' 表示根路径（首页）
    name: 'Home', // 路由名称，方便后续用名字跳转
    component: Home, // 匹配到这个路径时，渲染的组件
  },
  {
    path: '/about', // '/about' 路径
    name: 'About', // 路由名称
    component: About, // 对应的组件
  },
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(), // 使用 HTML5 History 模式（URL 不带 #）
  routes, // 传入上面定义的路由表
})

// 导出路由实例，供 main.ts 使用
export default router
```

### 第二步：在入口文件中注册路由

```typescript
// main.ts —— 应用入口文件

// 导入 Vue 的 createApp 方法
import { createApp } from 'vue'

// 导入根组件
import App from './App.vue'

// 导入刚才创建的路由实例
import router from './router'

// 创建 Vue 应用实例
const app = createApp(App)

// 注册路由插件——告诉 Vue "请用这个路由"
app.use(router)

// 挂载到 DOM 上的 #app 元素
app.mount('#app')
```

### 第三步：在根组件中使用路由

```vue
<!-- App.vue —— 根组件 -->
<template>
  <div>
    <!-- 导航区域：用 router-link 代替 a 标签 -->
    <!-- router-link 会渲染成 <a> 标签，但点击时不会刷新页面 -->
    <nav>
      <router-link to="/">首页</router-link>
      <!-- 点击后 URL 变成 /，显示 Home 组件 -->
      <router-link to="/about">关于</router-link>
      <!-- 点击后 URL 变成 /about，显示 About 组件 -->
    </nav>

    <!-- 路由出口：匹配到的组件会渲染在这里 -->
    <!-- 相当于一个"占位符"，Vue Router 会根据当前 URL 决定放哪个组件 -->
    <router-view />
  </div>
</template>
```

> **原理**：`<router-link>` 拦截了默认的跳转行为，改为通过 JavaScript 修改 URL；`<router-view />` 则根据当前 URL 从路由表中找到对应组件并渲染。

---

## 4 动态路由

有时候路径中包含"变量"，比如 `/user/123` 中的 `123` 是用户 ID。这时候就需要 **动态路由**。

```typescript
// router/index.ts —— 动态路由配置

const routes = [
  {
    // :id 是动态参数，可以匹配 /user/1、/user/2、/user/abc 等任何值
    path: '/user/:id',
    name: 'User',
    // 使用箭头函数懒加载组件——只有访问这个路由时才加载对应的 JS 文件
    component: () => import('../views/User.vue'),
  },
  {
    // 可以有多个动态参数
    path: '/post/:postId/comment/:commentId',
    name: 'PostComment',
    component: () => import('../views/PostComment.vue'),
  },
]
```

```vue
<!-- User.vue —— 获取动态路由参数 -->
<script setup lang="ts">
// 从 vue-router 导入 useRoute，用来获取当前路由信息
import { useRoute } from 'vue-router'

// 从 vue 导入 watch，用来监听数据变化
import { watch } from 'vue'

// 获取当前路由对象（包含路径、参数、查询等信息）
const route = useRoute()

// 监听路由参数 id 的变化
// 场景：从 /user/1 跳转到 /user/2 时，组件不会重新创建，但参数变了
watch(
  () => route.params.id, // 监听的目标：路由参数中的 id
  (newId) => {
    // 回调函数，newId 是变化后的新值
    console.log('用户 ID 变化：', newId)
    // 这里通常会重新请求接口，获取新用户的數據
  },
)
</script>

<template>
  <div>
    <!-- 在模板中直接访问路由参数 -->
    <h2>用户 {{ route.params.id }}</h2>
  </div>
</template>
```

---

## 5 嵌套路由

嵌套路由就是"页面中的页面"——比如一个后台管理系统，左侧是导航栏，右侧是内容区，切换内容时导航栏不变。

打个比方：

> 嵌套路由就像一栋办公楼——大门进去是大厅（Dashboard 组件），大厅里有电梯可以上不同楼层（子路由组件），但大厅本身一直在那里。

```typescript
// router/index.ts —— 嵌套路由配置

const routes = [
  {
    path: '/dashboard',
    // 父路由组件——包含侧边栏和 <router-view />
    component: () => import('../views/Dashboard.vue'),
    // children 定义子路由，它们会渲染在父组件的 <router-view /> 中
    children: [
      {
        path: '', // 空路径表示默认子路由（访问 /dashboard 时显示）
        name: 'DashboardHome',
        component: () => import('../views/dashboard/Home.vue'), // 仪表盘首页
      },
      {
        path: 'settings', // 完整路径是 /dashboard/settings
        name: 'DashboardSettings',
        component: () => import('../views/dashboard/Settings.vue'), // 设置页面
      },
      {
        path: 'profile', // 完整路径是 /dashboard/profile
        name: 'DashboardProfile',
        component: () => import('../views/dashboard/Profile.vue'), // 个人资料页面
      },
    ],
  },
]
```

```vue
<!-- Dashboard.vue —— 父路由组件 -->
<template>
  <div>
    <!-- 侧边栏导航——注意路径要写完整路径 -->
    <aside>
      <router-link to="/dashboard">概览</router-link>
      <!-- 匹配默认子路由 -->
      <router-link to="/dashboard/settings">设置</router-link>
      <!-- 匹配 settings 子路由 -->
      <router-link to="/dashboard/profile">个人资料</router-link>
      <!-- 匹配 profile 子路由 -->
    </aside>

    <!-- 子路由的组件会渲染在这里——侧边栏始终显示，只有这里的内容会切换 -->
    <main>
      <router-view />
    </main>
  </div>
</template>
```

---

## 6 路由懒加载

路由懒加载就是"用到才加载"——不是一开始就把所有页面的代码都下载下来，而是用户访问哪个页面才加载哪个页面的代码。

打个比方：

> 懒加载就像餐厅的菜单——你不会把所有菜都做好摆在那里，而是客人点了哪道菜，厨房才做哪道。

```typescript
// router/index.ts —— 路由懒加载配置

const routes = [
  {
    path: '/',
    name: 'Home',
    // ✅ 懒加载写法：用箭头函数包裹 import()，访问这个路由时才加载 Home.vue 的代码
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue'), // 懒加载 About 组件
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    // 使用 webpackChunkName 注释可以指定打包后的文件名，方便调试
    component: () =>
      import(
        /* webpackChunkName: "dashboard" */ // 告诉打包工具：这个文件叫 "dashboard"
        '../views/Dashboard.vue'
      ),
  },
]
```

| 加载方式 | 写法                     | 加载时机           | 适用场景            |
| -------- | ------------------------ | ------------------ | ------------------- |
| 直接导入 | `import Home from '...'` | 应用启动时全部加载 | 组件很少、首屏需要  |
| 懒加载   | `() => import('...')`    | 访问路由时才加载   | ✅ 推荐，大多数场景 |

---

## 7 导航守卫

导航守卫就是"门卫"——在用户切换页面之前/之后，执行一些逻辑，比如检查登录状态、修改页面标题等。

### 全局前置守卫

```typescript
// router/index.ts —— 全局前置守卫

import { createRouter, createWebHistory } from 'vue-router'

// 创建路由实例
const router = createRouter({
  history: createWebHistory(), // 使用 History 模式
  routes: [], // 路由表（省略具体内容）
})

// 全局前置守卫：每次路由跳转之前都会执行
router.beforeEach((to, from, next) => {
  // to: 目标路由对象（要去哪里）
  // from: 当前路由对象（从哪里来）
  // next: 放行函数（决定是否允许跳转）

  console.log('从', from.path, '到', to.path)

  // 从本地存储中获取登录凭证
  const isLoggedIn = localStorage.getItem('token')

  // 如果目标路由需要登录（meta.requiresAuth 为 true），且用户未登录
  if (to.meta.requiresAuth && !isLoggedIn) {
    // 重定向到登录页，并带上当前路径作为参数，登录后可以跳回来
    next({
      path: '/login',
      query: { redirect: to.fullPath }, // 记录原来想去的路径
    })
  } else {
    // 否则放行，允许跳转
    next()
  }
})

// 全局后置钩子：路由跳转完成后执行（不能阻止跳转）
router.afterEach((to, from) => {
  // 每次跳转后，自动修改浏览器标签页的标题
  document.title = `${to.meta.title || '未命名'} - 我的应用`
})

export default router
```

### 路由元信息（meta）

`meta` 就是给路由贴"标签"——你可以在路由配置中附加任意自定义信息，然后在守卫中读取。

```typescript
// router/index.ts —— 路由元信息配置

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: {
      title: '首页', // 页面标题
      requiresAuth: false, // 不需要登录就能访问
      keepAlive: true, // 自定义标记：是否缓存组件
    },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: {
      title: '控制台',
      requiresAuth: true, // 需要登录
      roles: ['admin', 'user'], // 允许的角色列表
    },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue'),
    meta: {
      title: '管理员',
      requiresAuth: true, // 需要登录
      roles: ['admin'], // 只允许管理员访问
    },
  },
]

// 权限检查守卫
router.beforeEach((to, from, next) => {
  // 从本地存储获取用户信息
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // 如果路由标记了需要登录
  if (to.meta.requiresAuth) {
    // 没有 token，说明没登录，跳转到登录页
    if (!user.token) {
      next('/login')
      return // 注意 return，防止继续执行下面的代码
    }

    // 有 token，但角色不匹配，跳转到 403 页面
    if (to.meta.roles && !to.meta.roles.includes(user.role)) {
      next('/403')
      return
    }
  }

  // 以上检查都通过，放行
  next()
})
```

### 组件内守卫

```vue
<script setup lang="ts">
// 从 vue-router 导入组件内守卫的钩子函数
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'

// 离开当前路由前触发——常用于"未保存提醒"
onBeforeRouteLeave((to, from, next) => {
  // 检查是否有未保存的更改（实际项目中会检查表单数据）
  const hasUnsavedChanges = true

  if (hasUnsavedChanges) {
    // 弹出确认框让用户选择
    const answer = window.confirm('确定要离开吗？未保存的更改将丢失')
    if (!answer) {
      next(false) // 传 false 取消导航，留在当前页面
      return
    }
  }

  next() // 放行，允许离开
})

// 当前路由参数变化时触发（比如从 /user/1 跳到 /user/2）
onBeforeRouteUpdate((to, from, next) => {
  console.log('路由参数更新：', to.params)
  // 这里可以重新获取数据
  next() // 放行
})
</script>

<template>
  <div>表单页面</div>
</template>
```

---

## 8 编程式导航

除了用 `<router-link>` 点击跳转，你还可以在代码中主动控制路由——这就是 **编程式导航**。

```vue
<script setup lang="ts">
// 导入 useRouter（用于跳转）和 useRoute（用于获取当前路由信息）
import { useRouter, useRoute } from 'vue-router'

// 获取路由实例——用来执行跳转操作
const router = useRouter()

// 获取当前路由对象——用来读取参数、路径等
const route = useRoute()

// 方式 1：字符串路径跳转
const goToHome = () => {
  router.push('/') // 跳转到首页，会在浏览器历史记录中留下一条记录
}

// 方式 2：带动态参数的路径跳转
const goToUser = (id: number) => {
  router.push({
    path: `/user/${id}`, // 拼接路径，比如 /user/1
  })
}

// 方式 3：使用命名路由 + params 传参（推荐，更清晰）
const goToPost = (postId: number, commentId: number) => {
  router.push({
    name: 'PostComment', // 用路由名称定位，不用写完整路径
    params: { postId, commentId }, // 动态参数，对应路由中的 :postId 和 :commentId
  })
}

// 方式 4：带查询参数（URL 中会显示 ?keyword=xxx）
const goToSearch = (keyword: string) => {
  router.push({
    path: '/search',
    query: { keyword }, // 最终 URL：/search?keyword=Vue
  })
}

// 方式 5：replace 替换当前历史记录（不会新增记录，用户点"后退"不会回到这个页面）
const replacePage = () => {
  router.replace('/login') // 常用于登录成功后，防止用户点"后退"回到登录页
}

// 方式 6：前进/后退
const goBack = () => {
  router.go(-1) // 后退一步，等同于浏览器"后退"按钮
}

const goForward = () => {
  router.go(1) // 前进一步，等同于浏览器"前进"按钮
}
</script>

<template>
  <div>
    <button @click="goToHome">首页</button>
    <!-- 点击跳转到 / -->
    <button @click="goToUser(1)">用户 1</button>
    <!-- 点击跳转到 /user/1 -->
    <button @click="goToSearch('Vue')">搜索 Vue</button>
    <!-- 点击跳转到 /search?keyword=Vue -->
    <button @click="goBack">返回</button>
    <!-- 点击后退一步 -->
  </div>
</template>
```

| 方法               | 作用           | 是否新增历史记录 | 常用场景       |
| ------------------ | -------------- | ---------------- | -------------- |
| `router.push()`    | 跳转到新页面   | ✅ 是            | 普通页面跳转   |
| `router.replace()` | 替换当前页面   | ❌ 否            | 登录成功后跳转 |
| `router.go(n)`     | 前进/后退 n 步 | —                | 返回上一页     |

---

## 9 路由过渡动画 & 滚动行为

### 过渡动画

给路由切换加一个淡入淡出效果，让页面切换不那么生硬。

```vue
<!-- App.vue —— 路由过渡动画 -->
<template>
  <!-- 使用 v-slot 获取 router-view 渲染的组件 -->
  <router-view v-slot="{ Component }">
    <!-- 用 <transition> 包裹，name="fade" 指定动画类名前缀 -->
    <!-- mode="out-in" 表示先离开再进入，避免新旧组件同时显示 -->
    <transition name="fade" mode="out-in">
      <component :is="Component" />
      <!-- 动态渲染当前路由匹配的组件 -->
    </transition>
  </router-view>
</template>

<style>
/* 进入和离开的过渡效果 */
.fade-enter-active,       /* 进入过程中的样式 */
.fade-leave-active {
  /* 离开过程中的样式 */
  transition: opacity 0.3s ease; /* 透明度过渡，0.3 秒，缓动 */
}

.fade-enter-from,         /* 进入前：完全透明 */
.fade-leave-to {
  /* 离开后：完全透明 */
  opacity: 0;
}
</style>
```

### 滚动行为

控制路由切换后页面滚动到哪里。

```typescript
// router/index.ts —— 滚动行为配置

const router = createRouter({
  history: createWebHistory(),
  routes: [],
  // scrollBehavior：路由切换后的滚动行为控制函数
  scrollBehavior(to, from, savedPosition) {
    // to: 目标路由
    // from: 来源路由
    // savedPosition: 浏览器记录的位置（只有前进/后退时才有值）

    // 如果是前进/后退操作，恢复到之前保存的滚动位置
    if (savedPosition) {
      return savedPosition
    }

    // 如果目标路由有锚点（比如 /about#team），平滑滚动到锚点位置
    if (to.hash) {
      return {
        el: to.hash, // 锚点选择器
        behavior: 'smooth', // 平滑滚动
      }
    }

    // 默认情况：平滑滚动到页面顶部
    return { top: 0, behavior: 'smooth' }
  },
})
```

---

## 10 核心知识点总结

| 知识点     | 说明                  | 关键 API                                     |
| ---------- | --------------------- | -------------------------------------------- |
| 路由配置   | 定义 URL 到组件的映射 | `createRouter`、`createWebHistory`           |
| 动态路由   | 路径中包含参数        | `:id`、`route.params`                        |
| 嵌套路由   | 页面中的子页面        | `children`、`<router-view />`                |
| 路由懒加载 | 按需加载组件代码      | `() => import()`                             |
| 导航守卫   | 路由跳转前后的拦截    | `beforeEach`、`afterEach`                    |
| 路由元信息 | 路由的附加数据        | `meta`                                       |
| 编程式导航 | 代码中控制跳转        | `router.push`、`router.replace`、`router.go` |
| 滚动行为   | 控制切换后的滚动位置  | `scrollBehavior`                             |

---

## 11 新手常见误区

### 误区 1："用 `<a>` 标签做导航"

❌ **错误**：用 `<a href="/about">` 做页面跳转

```vue
<!-- ❌ 错误写法 -->
<a href="/about">关于</a>
```

**为什么错？** `<a>` 标签会触发浏览器默认的跳转行为，导致整个页面刷新，SPA 的意义就没了。

✅ **正确做法**：用 `<router-link>` 代替

```vue
<!-- ✅ 正确写法 -->
<router-link to="/about">关于</router-link>
```

---

### 误区 2："动态路由参数变了，组件不更新"

❌ **常见困惑**：从 `/user/1` 跳到 `/user/2`，页面内容没变

**原因**：Vue Router 发现组件类型没变，会复用已有组件实例，不会重新创建。所以 `setup` 中的代码不会重新执行。

✅ **正确做法**：用 `watch` 监听 `route.params` 的变化

```typescript
// ✅ 监听参数变化，手动更新数据
watch(
  () => route.params.id,
  (newId) => {
    // 重新请求数据
    fetchUserData(newId)
  },
)
```

---

### 误区 3："在导航守卫中忘记调用 `next()`"

❌ **错误写法**：

```typescript
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    // 只处理了需要登录的情况，忘了放行其他情况
    if (!isLoggedIn) {
      next('/login')
    }
    // ❌ 如果 isLoggedIn 为 true，next() 没被调用，页面卡住！
  }
  // ❌ 如果不需要登录，next() 也没被调用
})
```

✅ **正确做法**：确保每个分支都调用了 `next()`

```typescript
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login')
  } else {
    next() // ✅ 别忘了放行
  }
})
```

---

### 误区 4："嵌套路由的 path 写成绝对路径"

❌ **错误写法**：

```typescript
children: [
  { path: '/settings', component: Settings }, // ❌ 带 / 变成绝对路径
]
```

**为什么错？** 子路由的 `path` 如果以 `/` 开头，会被当作绝对路径，不会拼在父路由后面。

✅ **正确写法**：子路由 path 不带 `/`

```typescript
children: [
  { path: 'settings', component: Settings }, // ✅ 完整路径是 /dashboard/settings
]
```

---

### 误区 5："所有组件都用直接导入"

❌ **错误写法**：

```typescript
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import Dashboard from '../views/Dashboard.vue'
// ... 几十个页面全部 import
```

**为什么错？** 所有组件打包到一个文件里，首屏加载极慢。

✅ **正确做法**：使用懒加载

```typescript
const routes = [
  { path: '/', component: () => import('../views/Home.vue') },
  { path: '/about', component: () => import('../views/About.vue') },
]
```

---

## 12 动手练习

### 练习 1（基础）：配置一个多页路由

创建一个路由配置，包含以下三个页面：

- 首页（`/`）
- 商品列表（`/products`）
- 联系我们（`/contact`）

每个页面都用懒加载方式引入，并设置 `meta.title`。

<details>
<summary>点击查看答案</summary>

```typescript
// router/index.ts

// 导入创建路由和历史模式的方法
import { createRouter, createWebHistory } from 'vue-router'

// 创建路由实例，使用 History 模式
const router = createRouter({
  history: createWebHistory(), // HTML5 History 模式
  routes: [
    {
      path: '/', // 首页路径
      name: 'Home', // 路由名称
      component: () => import('../views/Home.vue'), // 懒加载首页组件
      meta: { title: '首页' }, // 页面标题
    },
    {
      path: '/products', // 商品列表路径
      name: 'Products', // 路由名称
      component: () => import('../views/Products.vue'), // 懒加载商品组件
      meta: { title: '商品列表' }, // 页面标题
    },
    {
      path: '/contact', // 联系我们路径
      name: 'Contact', // 路由名称
      component: () => import('../views/Contact.vue'), // 懒加载联系组件
      meta: { title: '联系我们' }, // 页面标题
    },
  ],
})

// 全局后置钩子：自动设置页面标题
router.afterEach((to) => {
  document.title = (to.meta.title as string) || '我的应用' // 设置浏览器标签标题
})

export default router // 导出路由实例
```

</details>

---

### 练习 2（进阶）：实现登录权限拦截

在练习 1 的基础上，添加以下功能：

- `/products` 页面需要登录才能访问
- 未登录时跳转到 `/login`，并携带原来的目标路径
- 登录后能自动跳回原来的页面

<details>
<summary>点击查看答案</summary>

```typescript
// router/index.ts

import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/Home.vue'),
      meta: { title: '首页', requiresAuth: false }, // 首页不需要登录
    },
    {
      path: '/products',
      name: 'Products',
      component: () => import('../views/Products.vue'),
      meta: { title: '商品列表', requiresAuth: true }, // 商品页需要登录
    },
    {
      path: '/contact',
      name: 'Contact',
      component: () => import('../views/Contact.vue'),
      meta: { title: '联系我们', requiresAuth: false }, // 联系页不需要登录
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
      meta: { title: '登录' }, // 登录页
    },
  ],
})

// 全局前置守卫：检查登录状态
router.beforeEach((to, from, next) => {
  // 从 localStorage 获取 token
  const token = localStorage.getItem('token')

  // 如果目标路由需要登录，且没有 token
  if (to.meta.requiresAuth && !token) {
    // 跳转到登录页，并用 query 参数记住原来想去的路径
    next({
      path: '/login',
      query: { redirect: to.fullPath }, // 比如 /products?redirect=/products
    })
  } else {
    // 否则放行
    next()
  }
})

// 后置钩子：设置页面标题
router.afterEach((to) => {
  document.title = (to.meta.title as string) || '我的应用'
})

export default router
```

```vue
<!-- Login.vue —— 登录页面 -->
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter() // 获取路由实例
const route = useRoute() // 获取当前路由信息

// 模拟登录操作
const handleLogin = () => {
  // 模拟登录成功，保存 token
  localStorage.setItem('token', 'fake-token-123')

  // 获取登录前想去的路径，如果没有就回首页
  const redirect = (route.query.redirect as string) || '/'

  // 用 replace 跳转，这样用户点"后退"不会回到登录页
  router.replace(redirect)
}
</script>

<template>
  <div>
    <h2>登录页面</h2>
    <button @click="handleLogin">模拟登录</button>
    <!-- 点击登录 -->
  </div>
</template>
```

</details>

---

### 练习 3（挑战）：完整的后台管理系统路由

实现一个后台管理系统的路由，要求：

1. 使用嵌套路由实现侧边栏布局（`/admin`）
2. 包含三个子页面：用户管理、订单管理、系统设置
3. 使用路由元信息控制权限（`roles`）
4. 使用导航守卫检查角色权限
5. 添加路由过渡动画

<details>
<summary>点击查看答案</summary>

```typescript
// router/index.ts

import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  // 配置滚动行为：切换路由时滚动到顶部
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' } // 平滑滚动到顶部
  },
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'), // 登录页（独立页面）
    },
    {
      path: '/admin',
      name: 'Admin',
      component: () => import('../views/admin/Layout.vue'), // 后台布局（包含侧边栏）
      meta: { requiresAuth: true, roles: ['admin', 'editor'] }, // 需要登录，且是管理员或编辑
      children: [
        {
          path: '', // 默认子路由
          name: 'AdminHome',
          component: () => import('../views/admin/Home.vue'), // 后台首页概览
        },
        {
          path: 'users', // /admin/users
          name: 'UserManage',
          component: () => import('../views/admin/Users.vue'), // 用户管理
          meta: { roles: ['admin'] }, // 只有管理员能访问
        },
        {
          path: 'orders', // /admin/orders
          name: 'OrderManage',
          component: () => import('../views/admin/Orders.vue'), // 订单管理
          // 没有额外 meta.roles，继承父级的 roles
        },
        {
          path: 'settings', // /admin/settings
          name: 'SystemSettings',
          component: () => import('../views/admin/Settings.vue'), // 系统设置
          meta: { roles: ['admin'] }, // 只有管理员能访问
        },
      ],
    },
    {
      path: '/403',
      name: 'Forbidden',
      component: () => import('../views/403.vue'), // 无权限页面
    },
  ],
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 获取用户信息
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // 检查是否需要登录
  if (to.meta.requiresAuth && !user.token) {
    next({ path: '/login', query: { redirect: to.fullPath } }) // 未登录，跳转登录页
    return
  }

  // 检查角色权限——优先使用子路由自己的 roles，否则使用父路由的 roles
  const requiredRoles = to.meta.roles || to.matched[0]?.meta?.roles
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    next('/403') // 角色不匹配，跳转 403 页面
    return
  }

  next() // 放行
})

export default router
```

```vue
<!-- App.vue —— 带过渡动画的路由出口 -->
<template>
  <router-view v-slot="{ Component }">
    <!-- 使用 transition 包裹，实现淡入淡出效果 -->
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style>
/* 淡入淡出动画样式 */
.fade-enter-active,       /* 进入过程中的过渡效果 */
.fade-leave-active {
  /* 离开过程中的过渡效果 */
  transition: opacity 0.3s ease; /* 0.3 秒透明度过渡 */
}

.fade-enter-from,         /* 进入前：完全透明 */
.fade-leave-to {
  /* 离开后：完全透明 */
  opacity: 0;
}
</style>
```

```vue
<!-- admin/Layout.vue —— 后台布局组件 -->
<template>
  <div class="admin-layout">
    <!-- 侧边栏导航 -->
    <aside class="sidebar">
      <h3>后台管理</h3>
      <router-link to="/admin">概览</router-link>
      <!-- 后台首页 -->
      <router-link to="/admin/users">用户管理</router-link>
      <!-- 用户管理 -->
      <router-link to="/admin/orders">订单管理</router-link>
      <!-- 订单管理 -->
      <router-link to="/admin/settings">系统设置</router-link>
      <!-- 系统设置 -->
    </aside>

    <!-- 主内容区域——子路由组件渲染在这里 -->
    <main class="content">
      <router-view />
    </main>
  </div>
</template>
```

</details>

---

## 下一章预告

下一章我们会学习 **Pinia——Vue 3 的状态管理库**。当你的应用越来越大，组件之间的共享数据（比如用户信息、购物车）该怎么管理？Pinia 就是答案。你会学到如何创建 Store、如何在组件中读写状态、以及为什么 Pinia 比 Vuex 更简单好用。
