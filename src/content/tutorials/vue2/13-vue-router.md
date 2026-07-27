---
title: "第十三章：Vue Router"
description: "学习 Vue 2 中的路由管理，包括路由配置、嵌套路由、导航守卫等核心功能。"
---

# 第十三章：Vue Router

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 单页应用（SPA）是怎么实现"页面切换"的？
- URL 变了但页面不刷新，这到底是怎么做到的？
- 怎么控制"谁能访问哪个页面"？
- 路由参数和 query 有什么区别？

这一章就是为了解答这些问题。我们会从零开始，搞懂 **Vue Router 的核心用法**。学完这章，你就能：
- 配置路由，实现页面切换
- 用嵌套路由组织复杂页面
- 用导航守卫做权限控制
- 用路由懒加载优化性能

---

## 13.1 为什么需要 Vue Router？

### 痛点分析

想象一下：你做了一个电商网站，有首页、商品列表、商品详情、购物车、个人中心。

❌ **不用路由的写法（传统多页应用）**：
```
每个页面是一个独立的 HTML 文件
点击链接 → 浏览器发请求 → 服务器返回新 HTML → 整个页面刷新
```

问题很明显：
- 每次切换页面都要重新加载整个页面
- 用户体验差（白屏闪烁）
- 前后端耦合严重

### 解决方案

✅ **使用 Vue Router（单页应用）**：
```
一个 HTML 文件，多个 Vue 组件
点击链接 → 路由匹配 → 切换组件 → 不刷新页面
```

打个比方：

> 传统多页应用像"翻书"——每次翻到新的一页都要重新打开。单页应用像"投影仪"——同一块屏幕，切换不同的幻灯片。

```javascript
// 定义路由规则
const routes = [
  { path: '/', component: Home },        // 首页
  { path: '/products', component: Products }, // 商品列表
  { path: '/cart', component: Cart }     // 购物车
]

// URL 变化时，Vue 自动切换对应的组件
// / → 显示 Home 组件
// /products → 显示 Products 组件
// /cart → 显示 Cart 组件
```

> **一句话总结**：Vue Router 让你在一个 HTML 页面里，通过 URL 切换不同的组件，实现"无刷新"的页面切换。

---

## 13.2 核心原理

### 路由的本质

打个比方：

> 路由就像"前台接待员"。客人（URL）来了，接待员看看地址，把客人带到对应的房间（组件）。

**底层原理**：
1. 监听 URL 变化（hash 模式或 history 模式）
2. 根据 URL 匹配路由规则
3. 渲染对应的组件

### 两种路由模式

| 模式 | URL 格式 | 原理 | 特点 |
| --- | --- | --- | --- |
| hash | `example.com/#/home` | `location.hash` + `hashchange` 事件 | 兼容性好，不需要服务器配置 |
| history | `example.com/home` | `history.pushState` + `popstate` 事件 | URL 更美观，需要服务器配置 |

### 对比分析

| 特性 | hash 模式 | history 模式 |
| --- | --- | --- |
| URL 格式 | `/#/path` | `/path` |
| 美观度 | 一般（有 #） | 好（像普通 URL） |
| 兼容性 | 好（IE8+） | 一般（IE10+） |
| 服务器配置 | 不需要 | 需要（否则刷新 404） |
| SEO | 一般 | 好 |

---

## 13.3 安装与基础配置

### 安装

```bash
# 安装 Vue Router 3（对应 Vue 2）
npm install vue-router@3
```

### 基础配置

```javascript
// router/index.js - 路由配置文件
import Vue from 'vue'           // 导入 Vue
import VueRouter from 'vue-router' // 导入 Vue Router
import Home from '../views/Home.vue' // 导入首页组件
import About from '../views/About.vue' // 导入关于页组件

Vue.use(VueRouter) // 注册 Vue Router 插件

// 定义路由规则：URL → 组件的映射关系
const routes = [
  {
    path: '/',        // URL 路径
    name: 'Home',     // 路由名称（可选，用于命名导航）
    component: Home   // 对应的组件
  },
  {
    path: '/about',   // URL 路径
    name: 'About',    // 路由名称
    component: About  // 对应的组件
  }
]

// 创建路由实例
const router = new VueRouter({
  mode: 'history',              // 路由模式：history 或 hash
  base: process.env.BASE_URL,   // 基础路径
  routes                        // 路由规则
})

export default router // 导出路由实例
```

```javascript
// main.js - 入口文件
import Vue from 'vue'
import App from './App.vue'
import router from './router' // 导入路由

new Vue({
  router, // 注入路由到 Vue 实例
  render: h => h(App)
}).$mount('#app') // 挂载到 #app 元素
```

```vue
<!-- App.vue - 根组件 -->
<template>
  <div id="app">
    <!-- 导航链接 -->
    <nav>
      <router-link to="/">首页</router-link>    <!-- 点击跳转到 / -->
      <router-link to="/about">关于</router-link> <!-- 点击跳转到 /about -->
    </nav>

    <!-- 路由出口：匹配的组件会渲染在这里 -->
    <router-view></router-view>
  </div>
</template>
```

> **原理**：`<router-link>` 渲染成 `<a>` 标签，点击时阻止默认行为，用 `history.pushState` 改变 URL，然后 `<router-view>` 根据 URL 渲染对应组件。

---

## 13.4 router-link 详解

### 基础用法

```vue
<template>
  <div>
    <!-- 基础用法：字符串路径 -->
    <router-link to="/">首页</router-link>
    <router-link to="/about">关于</router-link>

    <!-- 使用 name 命名路由 -->
    <router-link :to="{ name: 'Home' }">首页</router-link>

    <!-- 带 query 参数 -->
    <router-link :to="{ path: '/user', query: { id: 123 } }">
      用户
    </router-link>
    <!-- 结果：/user?id=123 -->

    <!-- 带 params 参数（需要命名路由） -->
    <router-link :to="{ name: 'User', params: { id: 123 } }">
      用户
    </router-link>
    <!-- 结果：/user/123（需要路由配置 path: '/user/:id'） -->

    <!-- replace：不留下历史记录 -->
    <router-link to="/" replace>首页</router-link>

    <!-- tag：渲染为其他标签 -->
    <router-link to="/" tag="li">首页</router-link>
    <!-- 渲染为 <li> 而不是 <a> -->

    <!-- active-class：激活时的 class -->
    <router-link to="/" active-class="active">首页</router-link>
    <!-- 当 URL 是 / 时，添加 active 类 -->

    <!-- exact-active-class：精确匹配时的 class -->
    <router-link to="/" exact-active-class="exact-active">首页</router-link>
    <!-- 只有 URL 严格等于 / 时才添加 class -->
  </div>
</template>
```

### ✅ ❌ 正确/错误写法

```vue
<!-- ✅ 正确：to 前面加 : 绑定变量 -->
<router-link :to="{ name: 'Home' }">首页</router-link>

<!-- ❌ 错误：不加 : 会被当成字符串 -->
<router-link to="{ name: 'Home' }">首页</router-link>
<!-- 这样 to 的值就是字符串 "{ name: 'Home' }"，不是对象 -->

<!-- ✅ 正确：query 参数 -->
<router-link :to="{ path: '/search', query: { keyword: 'vue' } }">搜索</router-link>

<!-- ❌ 错误：params 不能和 path 一起用 -->
<router-link :to="{ path: '/user', params: { id: 123 } }">用户</router-link>
<!-- params 会被忽略！params 只能和 name 一起用 -->
```

---

## 13.5 动态路由

### 基础用法

```javascript
const routes = [
  {
    path: '/user/:id',    // :id 是动态参数
    name: 'User',
    component: User
  },
  {
    path: '/post/:postId', // :postId 是动态参数
    name: 'Post',
    component: Post
  }
]
```

```vue
<!-- User.vue -->
<template>
  <div>
    <p>用户 ID：{{ $route.params.id }}</p>  <!-- 获取路由参数 -->
  </div>
</template>

<script>
export default {
  created() {
    // 获取路由参数
    console.log(this.$route.params.id)  // 例如：/user/123 → '123'
  },
  watch: {
    // 监听路由参数变化
    // 当从 /user/123 跳到 /user/456 时，组件不会重新创建
    // 需要 watch 来监听参数变化
    '$route'(to, from) {
      console.log('路由变化：', to.params.id)  // 新的参数
      this.fetchUserData(to.params.id)  // 重新获取数据
    }
  },
  methods: {
    fetchUserData(id) {
      // 根据 id 获取用户数据
    }
  }
}
</script>
```

### params vs query 对比

| 特性 | params | query |
| --- | --- | --- |
| URL 格式 | `/user/123` | `/user?id=123` |
| 配置要求 | 路由 path 要写 `:id` | 不需要特殊配置 |
| 获取方式 | `$route.params.id` | `$route.query.id` |
| 适用场景 | 资源标识（ID） | 搜索条件、筛选参数 |
| 刷新保持 | ✅ 保持 | ✅ 保持 |

---

## 13.6 嵌套路由

### 什么是嵌套路由？

打个比方：

> 嵌套路由就像"俄罗斯套娃"。大套娃是父路由（用户中心），里面有小套娃（个人资料、文章列表、设置）。

### 基础用法

```javascript
const routes = [
  {
    path: '/user',          // 父路由路径
    component: User,        // 父组件
    children: [             // 子路由
      {
        path: '',           // 默认子路由（访问 /user 时显示）
        name: 'UserProfile',
        component: UserProfile
      },
      {
        path: 'posts',      // 子路由路径（不需要 /）
        name: 'UserPosts',
        component: UserPosts
      },
      {
        path: 'settings',
        name: 'UserSettings',
        component: UserSettings
      }
    ]
  }
]
```

```vue
<!-- User.vue - 父组件 -->
<template>
  <div>
    <h1>用户中心</h1>
    <!-- 父组件的导航 -->
    <nav>
      <router-link to="/user">个人资料</router-link>
      <router-link to="/user/posts">文章</router-link>
      <router-link to="/user/settings">设置</router-link>
    </nav>

    <!-- 子路由的组件会渲染在这里 -->
    <router-view></router-view>
  </div>
</template>
```

> **原理**：父组件的 `<router-view>` 是子路由的"出口"。URL 是 `/user/posts` 时，先渲染 User 组件，再在 User 组件的 `<router-view>` 里渲染 UserPosts 组件。

---

## 13.7 编程式导航

### 用代码跳转路由

```vue
<script>
export default {
  methods: {
    navigate() {
      // 1. 字符串路径
      this.$router.push('/about')  // 跳转到 /about

      // 2. 对象路径
      this.$router.push({ path: '/user/123' })  // 跳转到 /user/123

      // 3. 命名路由
      this.$router.push({ name: 'User', params: { id: 123 } })
      // 跳转到 /user/123

      // 4. 带 query 参数
      this.$router.push({ path: '/search', query: { keyword: 'vue' } })
      // 跳转到 /search?keyword=vue

      // 5. replace：不留下历史记录
      this.$router.replace('/about')  // 替换当前历史记录

      // 6. go：前进/后退
      this.$router.go(-1)  // 后退一步（相当于浏览器的"后退"按钮）
      this.$router.go(1)   // 前进一步（相当于浏览器的"前进"按钮）
      this.$router.go(-3)  // 后退三步
    }
  }
}
</script>
```

### push vs replace 对比

| 方法 | 效果 | 适用场景 |
| --- | --- | --- |
| push | 添加新历史记录 | 普通跳转 |
| replace | 替换当前历史记录 | 登录成功后跳转（不能回退到登录页） |

---

## 13.8 导航守卫

### 什么是导航守卫？

打个比方：

> 导航守卫就像"门卫"。每次你要去一个新的地方（路由跳转），门卫都会检查你的"通行证"（登录状态、权限等），通过了才放行。

### 全局前置守卫

```javascript
const router = new VueRouter({ routes: [...] })

// 全局前置守卫：每次路由跳转前都会执行
router.beforeEach((to, from, next) => {
  // to: 要去哪里（目标路由对象）
  // from: 从哪里来（来源路由对象）
  // next: 放行函数

  console.log('导航到：', to.path)  // 打印目标路径

  // 检查登录状态
  const isLoggedIn = localStorage.getItem('token')

  if (to.meta.requiresAuth && !isLoggedIn) {
    // 需要登录但未登录 → 跳转到登录页
    next({
      path: '/login',
      query: { redirect: to.fullPath }  // 记住原来要去的地方
    })
  } else {
    // 已登录或不需要登录 → 放行
    next()
  }
})

// 全局后置钩子：路由跳转后执行（不能调用 next）
router.afterEach((to, from) => {
  // 修改页面标题
  document.title = to.meta.title || '默认标题'
})
```

### 路由独享守卫

```javascript
const routes = [
  {
    path: '/admin',
    component: Admin,
    beforeEnter: (to, from, next) => {
      // 只对这个路由生效
      if (isAdmin()) {
        next()  // 是管理员，放行
      } else {
        next('/403')  // 不是管理员，跳转到 403 页面
      }
    }
  }
]
```

### 组件内守卫

```vue
<script>
export default {
  // 进入路由前（组件还没创建，不能访问 this）
  beforeRouteEnter(to, from, next) {
    // 不能访问 this
    next()  // 放行
  },

  // 路由更新时（组件复用时调用，可以访问 this）
  beforeRouteUpdate(to, from, next) {
    // 可以访问 this
    console.log('路由更新：', to.params.id)
    next()  // 放行
  },

  // 离开路由前（可以访问 this）
  beforeRouteLeave(to, from, next) {
    // 可以访问 this
    if (this.hasUnsavedChanges) {
      const answer = window.confirm('有未保存的更改，确定要离开吗？')
      if (answer) {
        next()  // 确认离开
      } else {
        next(false)  // 取消离开
      }
    } else {
      next()  // 没有未保存的更改，直接放行
    }
  }
}
</script>
```

### 三种守卫对比

| 守卫类型 | 作用范围 | 能否访问 this | 适用场景 |
| --- | --- | --- | --- |
| 全局守卫 | 所有路由 | 不能 | 登录验证、页面标题 |
| 路由独享 | 单个路由 | 不能 | 特定页面的权限控制 |
| 组件内守卫 | 当前组件 | 看具体钩子 | 离开前确认、数据预加载 |

### next 函数详解

| 用法 | 效果 |
| --- | --- |
| `next()` | 放行，进入下一个守卫或完成导航 |
| `next(false)` | 中断导航，留在当前页面 |
| `next('/')` | 中断当前导航，跳转到指定路径 |
| `next({ path: '/' })` | 中断当前导航，跳转到指定路由对象 |
| `next(error)` | 传入 Error 对象，触发错误处理 |

---

## 13.9 路由元信息

### 什么是 meta？

打个比方：

> meta 就像路由的"标签"。你可以给每个路由贴上标签（需要登录、页面标题、权限要求等），然后在守卫里读取这些标签来做判断。

### 基础用法

```javascript
const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    meta: {
      requiresAuth: true,      // 需要登录
      title: '控制台',          // 页面标题
      roles: ['admin', 'user'] // 允许的角色
    }
  },
  {
    path: '/admin',
    component: Admin,
    meta: {
      requiresAuth: true,
      title: '管理后台',
      roles: ['admin']  // 只有管理员能访问
    }
  }
]
```

```javascript
// 在全局守卫中使用 meta
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title || 'Vue App'

  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    const isLoggedIn = localStorage.getItem('token')
    if (!isLoggedIn) {
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }
  }

  // 检查角色权限
  if (to.meta.roles) {
    const userRole = getUserRole()  // 获取当前用户角色
    if (!to.meta.roles.includes(userRole)) {
      next('/403')  // 没有权限，跳转到 403 页面
      return
    }
  }

  next()  // 全部通过，放行
})
```

---

## 13.10 路由懒加载

### 什么是路由懒加载？

打个比方：

> 路由懒加载就像"自助餐"。不是把所有菜（组件）一次性端上来，而是你点了哪道菜（访问哪个路由），厨房才做哪道菜。

### 基础用法

```javascript
// ❌ 不用懒加载：所有组件打包在一个文件
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import User from '../views/User.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/user', component: User }
]
```

```javascript
// ✅ 使用懒加载：每个组件单独打包
const routes = [
  {
    path: '/',
    name: 'Home',
    // 箭头函数 + import() → 懒加载
    component: () => import('../views/Home.vue')
    // 访问 / 时才加载 Home.vue
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue')
    // 访问 /about 时才加载 About.vue
  },
  {
    path: '/user',
    name: 'User',
    component: () => import('../views/User.vue')
    // 访问 /user 时才加载 User.vue
  }
]
```

```javascript
// 使用 webpackChunkName 自定义文件名
const routes = [
  {
    path: '/',
    component: () => import(/* webpackChunkName: "home" */ '../views/Home.vue')
    // 打包后文件名包含 "home"
  },
  {
    path: '/about',
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
    // 打包后文件名包含 "about"
  }
]
```

### 懒加载对比

| 方式 | 打包结果 | 首屏加载 | 后续切换 |
| --- | --- | --- | --- |
| 不用懒加载 | 一个大文件 | 慢（全部加载） | 快（已加载） |
| 使用懒加载 | 多个小文件 | 快（只加载当前页） | 稍慢（按需加载） |

---

## 13.11 完整示例

```javascript
// router/index.js - 完整路由配置
import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),  // 懒加载
    meta: { title: '首页' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/user',
    component: () => import('../views/User.vue'),
    meta: { requiresAuth: true },  // 需要登录
    children: [
      {
        path: '',
        name: 'UserProfile',
        component: () => import('../views/user/Profile.vue'),
        meta: { title: '个人资料' }
      },
      {
        path: 'posts',
        name: 'UserPosts',
        component: () => import('../views/user/Posts.vue'),
        meta: { title: '我的文章' }
      }
    ]
  },
  {
    path: '/user/:id',
    name: 'UserDetail',
    component: () => import('../views/UserDetail.vue'),
    meta: { title: '用户详情' }
  },
  {
    path: '*',  // 匹配所有未定义的路径（404）
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title || 'Vue App'

  // 检查登录状态
  const isLoggedIn = localStorage.getItem('token')

  if (to.meta.requiresAuth && !isLoggedIn) {
    // 需要登录但未登录 → 跳转到登录页
    next({
      path: '/login',
      query: { redirect: to.fullPath }  // 记住目标路径
    })
  } else {
    next()  // 放行
  }
})

export default router
```

---

## 13.12 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 路由配置 | path + component 定义 URL 和组件的映射 |
| router-link | 声明式导航，渲染成 `<a>` 标签 |
| router-view | 路由出口，渲染匹配的组件 |
| 动态路由 | `:id` 捕获 URL 参数 |
| 嵌套路由 | children 定义子路由 |
| 编程式导航 | `this.$router.push/replace/go` |
| 导航守卫 | beforeEach、beforeEnter、beforeRouteLeave |
| 路由元信息 | meta 存储路由配置（权限、标题等） |
| 路由懒加载 | `() => import()` 按需加载组件 |

---

## 13.13 新手常见误区

### 误区 1："params 可以和 path 一起用"

**不行！** params 只能和 name 一起用。

❌ 错误做法：
```javascript
this.$router.push({ path: '/user', params: { id: 123 } })
// params 会被忽略！URL 还是 /user
```

✅ 正确做法：
```javascript
// 方式一：用 name + params
this.$router.push({ name: 'User', params: { id: 123 } })
// 结果：/user/123

// 方式二：用 path + query
this.$router.push({ path: '/user', query: { id: 123 } })
// 结果：/user?id=123
```

### 误区 2："路由参数变化时组件会重新创建"

**不会！** 同一个组件不同参数，组件会被复用。

❌ 错误理解：
```
从 /user/123 跳到 /user/456，组件会重新创建，created 会重新执行
```

✅ 正确理解：
```
从 /user/123 跳到 /user/456，组件被复用，created 不会重新执行
需要 watch $route 来获取新参数
```

```javascript
// ✅ 正确做法：监听路由变化
watch: {
  '$route'(to, from) {
    // 路由参数变化时执行
    this.fetchData(to.params.id)
  }
}

// 或者用 key 强制重新创建
// <router-view :key="$route.fullPath"></router-view>
```

### 误区 3："导航守卫里忘了调用 next()"

**会导致页面卡住！** next() 必须调用。

❌ 错误做法：
```javascript
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    // 检查登录状态...
    // 忘了调用 next()！
  }
  // ❌ 导航永远不会完成
})
```

✅ 正确做法：
```javascript
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    if (!isLoggedIn()) {
      next('/login')  // 未登录，跳转登录页
      return  // 记得 return，防止继续执行
    }
  }
  next()  // ✅ 放行
})
```

### 误区 4："history 模式不需要服务器配置"

**需要！** 否则刷新页面会 404。

❌ 错误理解：
```
用了 history 模式，直接部署就行了
```

✅ 正确理解：
```
history 模式下，刷新 /user/123 时，浏览器会向服务器请求 /user/123
如果服务器没有配置，会返回 404

需要在服务器上配置：所有路径都返回 index.html
```

```nginx
# nginx 配置示例
location / {
  try_files $uri $uri/ /index.html;
}
```

### 误区 5："beforeRouteEnter 里可以用 this"

**不能！** 因为组件还没创建。

❌ 错误做法：
```javascript
export default {
  beforeRouteEnter(to, from, next) {
    this.loading = true  // ❌ this 是 undefined
    next()
  }
}
```

✅ 正确做法：
```javascript
export default {
  beforeRouteEnter(to, from, next) {
    // 不能访问 this
    next(vm => {
      // 通过回调访问组件实例
      vm.loading = true  // ✅ 在回调中可以访问
    })
  }
}
```

---

## 13.14 动手练习

### 练习 1：基础练习 - 配置基础路由

配置 3 个路由：首页、关于、联系，使用路由懒加载。

<details>
<summary>点击查看答案</summary>

```javascript
// router/index.js
import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),  // 懒加载首页
    meta: { title: '首页' }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue'),  // 懒加载关于页
    meta: { title: '关于我们' }
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('../views/Contact.vue'),  // 懒加载联系页
    meta: { title: '联系我们' }
  }
]

const router = new VueRouter({
  mode: 'history',
  routes
})

// 全局后置守卫：设置页面标题
router.afterEach((to) => {
  document.title = to.meta.title || '我的网站'
})

export default router
```

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <nav>
      <router-link to="/">首页</router-link>
      <router-link to="/about">关于</router-link>
      <router-link to="/contact">联系</router-link>
    </nav>
    <router-view></router-view>
  </div>
</template>
```

</details>

### 练习 2：进阶练习 - 实现登录权限控制

实现一个需要登录才能访问的"个人中心"页面，未登录跳转到登录页。

<details>
<summary>点击查看答案</summary>

```javascript
// router/index.js
import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: {
      title: '个人中心',
      requiresAuth: true  // 标记需要登录
    }
  }
]

const router = new VueRouter({
  mode: 'history',
  routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '我的网站'

  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token')
    if (!token) {
      // 未登录，跳转到登录页，并记住目标路径
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
  }

  next()  // 放行
})

export default router
```

```vue
<!-- Login.vue -->
<template>
  <div>
    <h1>登录</h1>
    <input v-model="username" placeholder="用户名" />
    <input v-model="password" type="password" placeholder="密码" />
    <button @click="handleLogin">登录</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: '',
      password: ''
    }
  },
  methods: {
    handleLogin() {
      // 模拟登录
      localStorage.setItem('token', 'fake-token')

      // 跳转到原来的页面，或者首页
      const redirect = this.$route.query.redirect || '/'
      this.$router.push(redirect)
    }
  }
}
</script>
```

```vue
<!-- Profile.vue -->
<template>
  <div>
    <h1>个人中心</h1>
    <p>欢迎来到个人中心！</p>
    <button @click="handleLogout">退出登录</button>
  </div>
</template>

<script>
export default {
  methods: {
    handleLogout() {
      localStorage.removeItem('token')  // 清除 token
      this.$router.push('/login')  // 跳转到登录页
    }
  }
}
</script>
```

</details>

### 练习 3（挑战）：综合练习 - 完整的路由系统

创建一个包含嵌套路由、动态路由、权限控制、路由懒加载的完整路由系统。

<details>
<summary>点击查看答案</summary>

```javascript
// router/index.js
import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/admin',
    component: () => import('../views/Admin.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('../views/admin/Dashboard.vue'),
        meta: { title: '管理后台' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../views/admin/Users.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'users/:id',
        name: 'AdminUserDetail',
        component: () => import('../views/admin/UserDetail.vue'),
        meta: { title: '用户详情' }
      }
    ]
  },
  {
    path: '*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: { title: '404' }
  }
]

const router = new VueRouter({
  mode: 'history',
  routes
})

// 模拟获取用户信息
function getUser() {
  const token = localStorage.getItem('token')
  if (!token) return null
  return { role: 'admin' }  // 模拟管理员
}

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '管理系统'

  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    const user = getUser()
    if (!user) {
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }

    // 检查角色权限
    if (to.meta.roles && !to.meta.roles.includes(user.role)) {
      next('/403')
      return
    }
  }

  next()
})

export default router
```

```vue
<!-- Admin.vue - 管理后台父组件 -->
<template>
  <div class="admin">
    <aside>
      <h2>管理后台</h2>
      <nav>
        <router-link to="/admin">仪表盘</router-link>
        <router-link to="/admin/users">用户管理</router-link>
      </nav>
      <button @click="logout">退出</button>
    </aside>
    <main>
      <router-view></router-view>
    </main>
  </div>
</template>

<script>
export default {
  methods: {
    logout() {
      localStorage.removeItem('token')
      this.$router.push('/login')
    }
  }
}
</script>
```

```vue
<!-- admin/UserDetail.vue - 用户详情页 -->
<template>
  <div>
    <h2>用户详情</h2>
    <p>用户 ID：{{ $route.params.id }}</p>
    <button @click="goBack">返回</button>
  </div>
</template>

<script>
export default {
  methods: {
    goBack() {
      this.$router.push('/admin/users')
    }
  }
}
</script>
```

</details>

---

## 下一章预告

下一章我们会学习 **Vuex**——Vue 的官方状态管理库。当你的应用越来越复杂，组件之间的数据共享会变得困难。Vuex 就是为了解决这个问题。你会学到：
- state、getters、mutations、actions 四大核心概念
- 如何在组件中使用 Vuex
- 模块化开发（modules）
- 什么时候需要 Vuex，什么时候不需要
