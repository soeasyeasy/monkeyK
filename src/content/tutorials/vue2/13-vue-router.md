---
title: "第十三章：Vue Router"
description: "学习 Vue 2 中的路由管理，包括路由配置、嵌套路由、导航守卫等核心功能。"
---

# 第十三章：Vue Router

## 运行结果

- **路由导航**
  - 点击链接切换不同页面
  - URL 变化触发组件切换
  - 支持动态路由参数
- **嵌套路由**
  - 父路由包含子路由
  - 子路由渲染在父组件的 router-view 中
- **导航守卫**
  - 路由跳转前进行权限验证
  - 页面离开时提示保存

## 代码详解

### 1. 安装与配置

```bash
npm install vue-router@3
```

```javascript
// router/index.js
import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'

Vue.use(VueRouter)

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

const router = new VueRouter({
  mode: 'history', // 使用 HTML5 History 模式
  base: process.env.BASE_URL,
  routes
})

export default router
```

```javascript
// main.js
import Vue from 'vue'
import App from './App.vue'
import router from './router'

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
```

### 2. 路由链接

```vue
<template>
  <div>
    <!-- 基础用法 -->
    <router-link to="/">首页</router-link>
    <router-link to="/about">关于</router-link>
    
    <!-- 使用 name -->
    <router-link :to="{ name: 'Home' }">首页</router-link>
    
    <!-- 带参数 -->
    <router-link :to="{ path: '/user', query: { id: 123 } }">
      用户
    </router-link>
    
    <!-- 替换当前历史记录 -->
    <router-link to="/" replace>首页</router-link>
    
    <!-- 渲染为其他标签 -->
    <router-link to="/" tag="li">首页</router-link>
    
    <!-- 活跃链接 class -->
    <router-link to="/" active-class="active">首页</router-link>
    <router-link to="/" exact-active-class="exact-active">首页</router-link>
  </div>
</template>
```

### 3. 路由出口

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <nav>
      <router-link to="/">首页</router-link>
      <router-link to="/about">关于</router-link>
    </nav>
    
    <!-- 路由匹配组件渲染在这里 -->
    <router-view></router-view>
  </div>
</template>
```

### 4. 动态路由

```javascript
const routes = [
  {
    path: '/user/:id',
    name: 'User',
    component: User
  },
  {
    path: '/post/:postId',
    name: 'Post',
    component: Post
  }
]
```

```vue
<!-- User.vue -->
<script>
export default {
  created() {
    // 获取路由参数
    console.log(this.$route.params.id)
  },
  watch: {
    // 监听路由参数变化
    '$route'(to, from) {
      console.log('路由变化：', to.params.id)
    }
  }
}
</script>
```

### 5. 嵌套路由

```javascript
const routes = [
  {
    path: '/user',
    component: User,
    children: [
      {
        path: '',
        name: 'UserProfile',
        component: UserProfile
      },
      {
        path: 'posts',
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
<!-- User.vue -->
<template>
  <div>
    <h1>用户中心</h1>
    <nav>
      <router-link to="/user">个人资料</router-link>
      <router-link to="/user/posts">文章</router-link>
      <router-link to="/user/settings">设置</router-link>
    </nav>
    
    <!-- 子路由渲染在这里 -->
    <router-view></router-view>
  </div>
</template>
```

### 6. 编程式导航

```vue
<script>
export default {
  methods: {
    navigate() {
      // 字符串路径
      this.$router.push('/about')
      
      // 对象路径
      this.$router.push({ path: '/user/123' })
      
      // 命名路由
      this.$router.push({ name: 'User', params: { id: 123 } })
      
      // 带 query 参数
      this.$router.push({ path: '/search', query: { keyword: 'vue' } })
      // 结果：/search?keyword=vue
      
      // 替换当前历史记录
      this.$router.replace('/about')
      
      // 前进/后退
      this.$router.go(-1) // 后退一步
      this.$router.go(1)  // 前进一步
    }
  }
}
</script>
```

### 7. 导航守卫

#### 全局守卫

```javascript
const router = new VueRouter({ ... })

// 全局前置守卫
router.beforeEach((to, from, next) => {
  console.log('导航到：', to.path)
  
  // 检查登录状态
  const isLoggedIn = checkLoginStatus()
  
  if (to.meta.requiresAuth && !isLoggedIn) {
    // 需要登录但未登录，跳转到登录页
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
  document.title = to.meta.title || '默认标题'
})
```

#### 路由独享守卫

```javascript
const routes = [
  {
    path: '/admin',
    component: Admin,
    beforeEnter: (to, from, next) => {
      // 检查管理员权限
      if (isAdmin()) {
        next()
      } else {
        next('/403')
      }
    }
  }
]
```

#### 组件内守卫

```vue
<script>
export default {
  // 进入路由前
  beforeRouteEnter(to, from, next) {
    // 不能访问 this
    next()
  },
  
  // 路由更新时
  beforeRouteUpdate(to, from, next) {
    // 可以访问 this
    console.log('路由更新：', to.params.id)
    next()
  },
  
  // 离开路由前
  beforeRouteLeave(to, from, next) {
    // 可以访问 this
    if (this.hasUnsavedChanges) {
      const answer = window.confirm('有未保存的更改，确定要离开吗？')
      if (answer) {
        next()
      } else {
        next(false)
      }
    } else {
      next()
    }
  }
}
</script>
```

### 8. 路由元信息

```javascript
const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    meta: {
      requiresAuth: true,
      title: '控制台',
      roles: ['admin', 'user']
    }
  }
]
```

```javascript
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    // 需要登录
  }
  
  if (to.meta.roles) {
    // 检查角色权限
  }
  
  next()
})
```

### 9. 路由懒加载

```javascript
const routes = [
  {
    path: '/',
    name: 'Home',
    // 路由懒加载
    component: () => import(/* webpackChunkName: "home" */ '../views/Home.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  }
]
```

### 10. 完整示例

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
    path: '/user',
    component: () => import('../views/User.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'UserProfile',
        component: () => import('../views/user/Profile.vue')
      },
      {
        path: 'posts',
        name: 'UserPosts',
        component: () => import('../views/user/Posts.vue')
      }
    ]
  },
  {
    path: '/user/:id',
    name: 'UserDetail',
    component: () => import('../views/UserDetail.vue')
  },
  {
    path: '*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title || 'Vue App'
  
  // 检查登录状态
  const isLoggedIn = localStorage.getItem('token')
  
  if (to.meta.requiresAuth && !isLoggedIn) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else {
    next()
  }
})

export default router
```

## 最佳实践

::: info
- 使用路由懒加载优化性能
- 合理使用嵌套路由组织页面结构
- 使用导航守卫进行权限控制
- 路由元信息存储页面配置
- 使用命名路由提高可维护性
- 注意路由参数的响应式监听
:::
