---
title: "第十章：生命周期"
description: "深入理解 Vue 2 组件的生命周期钩子，掌握组件从创建到销毁的完整过程。"
---

# 第十章：生命周期

## 运行结果

- **生命周期钩子执行顺序**
  - beforeCreate → created → beforeMount → mounted
  - beforeUpdate → updated（数据变化时）
  - beforeDestroy → destroyed（组件销毁时）
- **典型应用场景**
  - created：初始化数据、发起 API 请求
  - mounted：操作 DOM、启动定时器
  - beforeDestroy：清理定时器、取消订阅

## 代码详解

### 1. 生命周期图示

```
创建阶段
  ↓
beforeCreate（实例创建前）
  ↓
created（实例创建后）
  ↓
beforeMount（挂载前）
  ↓
mounted（挂载完成）
  ↓
运行阶段
  ↓
beforeUpdate（更新前）
  ↓
updated（更新后）
  ↓
销毁阶段
  ↓
beforeDestroy（销毁前）
  ↓
destroyed（销毁后）
```

### 2. 基础生命周期钩子

```vue
<template>
  <div>
    <h1>{{ message }}</h1>
    <button @click="changeMessage">改变消息</button>
    <button @click="destroy">销毁组件</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello Vue'
    }
  },
  beforeCreate() {
    console.log('beforeCreate: 实例刚初始化')
    console.log('data:', this.message) // undefined
    console.log('methods:', this.changeMessage) // undefined
  },
  created() {
    console.log('created: 实例创建完成')
    console.log('data:', this.message) // Hello Vue
    console.log('methods:', this.changeMessage) // ƒ changeMessage()
    
    // 常用于：初始化数据、发起 API 请求
  },
  beforeMount() {
    console.log('beforeMount: 挂载前')
    console.log('el:', this.$el) // undefined
  },
  mounted() {
    console.log('mounted: 挂载完成')
    console.log('el:', this.$el) // <div>...</div>
    
    // 常用于：操作 DOM、启动定时器、添加事件监听
  },
  beforeUpdate() {
    console.log('beforeUpdate: 数据更新前')
    console.log('message:', this.message)
  },
  updated() {
    console.log('updated: 数据更新后')
    console.log('message:', this.message)
  },
  beforeDestroy() {
    console.log('beforeDestroy: 销毁前')
    
    // 常用于：清理定时器、取消事件监听、取消订阅
  },
  destroyed() {
    console.log('destroyed: 销毁完成')
  },
  methods: {
    changeMessage() {
      this.message = 'Hello World'
    },
    destroy() {
      this.$destroy()
    }
  }
}
</script>
```

### 3. 常见应用场景

#### 初始化数据

```vue
<script>
export default {
  data() {
    return {
      users: [],
      loading: false
    }
  },
  created() {
    // 组件创建时获取数据
    this.fetchUsers()
  },
  methods: {
    async fetchUsers() {
      this.loading = true
      try {
        const response = await fetch('/api/users')
        this.users = await response.json()
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
```

#### 操作 DOM

```vue
<template>
  <div>
    <input ref="inputRef" type="text" />
  </div>
</template>

<script>
export default {
  mounted() {
    // 组件挂载后自动聚焦输入框
    this.$refs.inputRef.focus()
  }
}
</script>
```

#### 添加事件监听

```vue
<script>
export default {
  data() {
    return {
      scrollY: 0
    }
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll)
  },
  beforeDestroy() {
    window.removeEventListener('scroll', this.handleScroll)
  },
  methods: {
    handleScroll() {
      this.scrollY = window.scrollY
    }
  }
}
</script>
```

#### 定时器管理

```vue
<script>
export default {
  data() {
    return {
      timer: null,
      count: 0
    }
  },
  mounted() {
    this.timer = setInterval(() => {
      this.count++
    }, 1000)
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  }
}
</script>
```

### 4. 父子组件生命周期顺序

```vue
<!-- 父组件 -->
<script>
export default {
  beforeCreate() { console.log('父 beforeCreate') },
  created() { console.log('父 created') },
  beforeMount() { console.log('父 beforeMount') },
  mounted() { console.log('父 mounted') },
  beforeUpdate() { console.log('父 beforeUpdate') },
  updated() { console.log('父 updated') },
  beforeDestroy() { console.log('父 beforeDestroy') },
  destroyed() { console.log('父 destroyed') }
}
</script>
```

```vue
<!-- 子组件 -->
<script>
export default {
  beforeCreate() { console.log('子 beforeCreate') },
  created() { console.log('子 created') },
  beforeMount() { console.log('子 beforeMount') },
  mounted() { console.log('子 mounted') },
  beforeUpdate() { console.log('子 beforeUpdate') },
  updated() { console.log('子 updated') },
  beforeDestroy() { console.log('子 beforeDestroy') },
  destroyed() { console.log('子 destroyed') }
}
</script>
```

**初始化顺序：**
```
父 beforeCreate → 父 created → 父 beforeMount
→ 子 beforeCreate → 子 created → 子 beforeMount → 子 mounted
→ 父 mounted
```

**更新顺序：**
```
父 beforeUpdate → 子 beforeUpdate → 子 updated → 父 updated
```

**销毁顺序：**
```
父 beforeDestroy → 子 beforeDestroy → 子 destroyed → 父 destroyed
```

### 5. 路由组件生命周期

```vue
<script>
export default {
  // 路由进入时调用
  beforeRouteEnter(to, from, next) {
    // 不能访问 this
    next()
  },
  
  // 路由改变时调用
  beforeRouteUpdate(to, from, next) {
    // 可以访问 this
    next()
  },
  
  // 路由离开时调用
  beforeRouteLeave(to, from, next) {
    // 可以访问 this
    next()
  }
}
</script>
```

### 6. 错误处理钩子

```vue
<script>
export default {
  // 捕获子孙组件错误
  errorCaptured(err, vm, info) {
    console.error('捕获到错误：', err)
    console.error('组件实例：', vm)
    console.error('错误信息：', info)
    
    // 返回 false 阻止错误继续传播
    return false
  }
}
</script>
```

### 7. 生命周期与 keep-alive

```vue
<template>
  <keep-alive>
    <router-view></router-view>
  </keep-alive>
</template>
```

```vue
<script>
export default {
  // 被 keep-alive 激活时调用
  activated() {
    console.log('组件被激活')
  },
  
  // 被 keep-alive 停用时调用
  deactivated() {
    console.log('组件被停用')
  }
}
</script>
```

### 8. 完整示例

```vue
<template>
  <div>
    <h1>{{ title }}</h1>
    <p>用户列表：</p>
    <ul>
      <li v-for="user in users" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
    <button @click="refresh">刷新</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      title: '用户管理',
      users: [],
      loading: false,
      timer: null
    }
  },
  created() {
    console.log('created: 初始化数据')
    this.fetchUsers()
  },
  mounted() {
    console.log('mounted: 启动定时刷新')
    this.timer = setInterval(() => {
      this.fetchUsers()
    }, 30000)
  },
  beforeDestroy() {
    console.log('beforeDestroy: 清理定时器')
    if (this.timer) {
      clearInterval(this.timer)
    }
  },
  methods: {
    async fetchUsers() {
      this.loading = true
      try {
        const response = await fetch('/api/users')
        this.users = await response.json()
      } catch (error) {
        console.error('获取用户失败：', error)
      } finally {
        this.loading = false
      }
    },
    refresh() {
      this.fetchUsers()
    }
  }
}
</script>
```

## 最佳实践

::: info
- created：初始化数据、发起 API 请求
- mounted：操作 DOM、启动定时器、添加事件监听
- beforeDestroy：清理定时器、取消事件监听、取消订阅
- 避免在 updated 中修改数据，可能导致无限循环
- 使用路由守卫管理路由组件的生命周期
- keep-alive 组件使用 activated/deactivated
:::
