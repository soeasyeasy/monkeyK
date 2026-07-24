---
title: "第十三章：Vue Router"
description: "掌握 Vue Router 4 的路由配置、导航守卫和动态路由"
---

# 第十三章：Vue Router

## 运行结果

| 特性 | 用途 | 示例 |
| --- | --- | --- |
| 路由配置 | 定义页面路径 | `createRouter` |
| 动态路由 | 参数化路径 | `/user/:id` |
| 嵌套路由 | 子页面布局 | `children` |
| 导航守卫 | 路由拦截 | `beforeEach` |
| 路由元信息 | 附加数据 | `meta` |
| 路由懒加载 | 代码分割 | `() => import()` |

## 代码示例

### 1. 基础路由配置

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: About
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
```

```typescript
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')
```

```vue
<!-- App.vue -->
<template>
  <div>
    <nav>
      <router-link to="/">首页</router-link>
      <router-link to="/about">关于</router-link>
    </nav>
    <router-view />
  </div>
</template>
```

### 2. 动态路由

```typescript
// router/index.ts
const routes = [
  {
    path: '/user/:id',
    name: 'User',
    component: () => import('../views/User.vue')
  },
  {
    path: '/post/:postId/comment/:commentId',
    name: 'PostComment',
    component: () => import('../views/PostComment.vue')
  }
]
```

```vue
<!-- User.vue -->
<script setup lang="ts">
import { useRoute } from 'vue-router'
import { watch } from 'vue'

const route = useRoute()

// 监听路由参数变化
watch(
  () => route.params.id,
  (newId) => {
    console.log('用户 ID 变化：', newId)
    // 重新获取用户数据
  }
)
</script>

<template>
  <div>
    <h2>用户 {{ route.params.id }}</h2>
  </div>
</template>
```

### 3. 嵌套路由

```typescript
// router/index.ts
const routes = [
  {
    path: '/dashboard',
    component: () => import('../views/Dashboard.vue'),
    children: [
      {
        path: '',
        name: 'DashboardHome',
        component: () => import('../views/dashboard/Home.vue')
      },
      {
        path: 'settings',
        name: 'DashboardSettings',
        component: () => import('../views/dashboard/Settings.vue')
      },
      {
        path: 'profile',
        name: 'DashboardProfile',
        component: () => import('../views/dashboard/Profile.vue')
      }
    ]
  }
]
```

```vue
<!-- Dashboard.vue -->
<template>
  <div>
    <aside>
      <router-link to="/dashboard">概览</router-link>
      <router-link to="/dashboard/settings">设置</router-link>
      <router-link to="/dashboard/profile">个人资料</router-link>
    </aside>
    <main>
      <router-view />
    </main>
  </div>
</template>
```

### 4. 路由懒加载

```typescript
// router/index.ts
const routes = [
  {
    path: '/',
    name: 'Home',
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
```

### 5. 导航守卫 - 全局前置守卫

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: []
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  console.log('从', from.path, '到', to.path)

  // 检查是否需要登录
  const isLoggedIn = localStorage.getItem('token')

  if (to.meta.requiresAuth && !isLoggedIn) {
    // 重定向到登录页
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else {
    next()
  }
})

// 全局后置钩子
router.afterEach((to, from) => {
  // 修改页面标题
  document.title = `${to.meta.title || '未命名'} - 我的应用`
})

export default router
```

### 6. 路由元信息

```typescript
// router/index.ts
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: {
      title: '首页',
      requiresAuth: false,
      keepAlive: true
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: {
      title: '控制台',
      requiresAuth: true,
      roles: ['admin', 'user']
    }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue'),
    meta: {
      title: '管理员',
      requiresAuth: true,
      roles: ['admin']
    }
  }
]

// 权限检查
router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  if (to.meta.requiresAuth) {
    if (!user.token) {
      next('/login')
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
```

### 7. 路由组件内守卫

```vue
<script setup lang="ts">
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'

// 离开当前路由前
onBeforeRouteLeave((to, from, next) => {
  const hasUnsavedChanges = true // 检查是否有未保存的更改

  if (hasUnsavedChanges) {
    const answer = window.confirm('确定要离开吗？未保存的更改将丢失')
    if (!answer) {
      next(false) // 取消导航
      return
    }
  }

  next()
})

// 路由参数更新时
onBeforeRouteUpdate((to, from, next) => {
  console.log('路由参数更新：', to.params)
  // 重新获取数据
  next()
})
</script>

<template>
  <div>表单页面</div>
</template>
```

### 8. 编程式导航

```vue
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 字符串路径
const goToHome = () => {
  router.push('/')
}

// 带参数的对象
const goToUser = (id: number) => {
  router.push({
    path: `/user/${id}`
  })
}

// 命名路由
const goToPost = (postId: number, commentId: number) => {
  router.push({
    name: 'PostComment',
    params: { postId, commentId }
  })
}

// 带查询参数
const goToSearch = (keyword: string) => {
  router.push({
    path: '/search',
    query: { keyword }
  })
}

// 替换当前历史记录
const replacePage = () => {
  router.replace('/login')
}

// 前进/后退
const goBack = () => {
  router.go(-1)
}

const goForward = () => {
  router.go(1)
}
</script>

<template>
  <div>
    <button @click="goToHome">首页</button>
    <button @click="goToUser(1)">用户 1</button>
    <button @click="goToSearch('Vue')">搜索 Vue</button>
    <button @click="goBack">返回</button>
  </div>
</template>
```

### 9. 路由过渡动画

```vue
<!-- App.vue -->
<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

### 10. 滚动行为

```typescript
// router/index.ts
const router = createRouter({
  history: createWebHistory(),
  routes: [],
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的位置（前进/后退）
    if (savedPosition) {
      return savedPosition
    }

    // 如果路由有锚点
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    }

    // 默认滚动到顶部
    return { top: 0, behavior: 'smooth' }
  }
})
```

## 核心知识点

1. **路由配置**：使用 `createRouter` 和 `createWebHistory` 创建路由实例
2. **动态路由**：通过 `:param` 定义参数，使用 `route.params` 访问
3. **嵌套路由**：使用 `children` 配置子路由，配合 `<router-view />` 渲染
4. **导航守卫**：全局守卫、路由独享守卫、组件内守卫
5. **路由元信息**：通过 `meta` 附加路由信息（权限、标题等）
6. **编程式导航**：`router.push`、`router.replace`、`router.go`
7. **路由懒加载**：`() => import()` 实现代码分割
8. **滚动行为**：`scrollBehavior` 控制页面滚动位置
