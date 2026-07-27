---
title: "第十章：生命周期"
description: "深入理解 Vue 2 组件的生命周期机制，掌握从创建到销毁的完整过程，学会在合适的时机执行代码。"
---

# 第十章：生命周期

## 1. 本章导读

在开始学习之前，你可能会有这些疑问：

- **疑问 1**：什么是生命周期？为什么组件还有"生命周期"这种说法？
- **疑问 2**：created 和 mounted 有什么区别？数据请求应该放在哪个钩子里？
- **疑问 3**：为什么我在 created 里访问不到 DOM 元素？
- **疑问 4**：组件销毁时为什么要清理定时器？不清理会怎样？

本章会帮你解决这些问题，让你理解组件从"出生"到"死亡"的完整过程，学会在正确的时机做正确的事。

## 2. 为什么需要这个技术

### 生活化类比

想象一个人的生命周期：
- **出生前（beforeCreate）**：还在妈妈肚子里，什么都还没准备好
- **出生后（created）**：刚出生，有了基本的生命特征，但还不能独立生活
- **长大成人（mounted）**：可以独立生活了，可以开始工作、社交
- **日常生活（updated）**：每天吃饭、睡觉、工作，不断变化
- **临终前（beforeDestroy）**：临终前，要处理遗产、告别亲人
- **去世后（destroyed）**：生命结束，一切归于平静

再比如**开店营业**：
- **装修阶段（beforeCreate/created）**：准备店铺，但还没开门
- **开业（mounted）**：正式营业，可以接待顾客
- **日常运营（updated）**：每天进货、卖货、盘点
- **关店（beforeDestroy/destroyed）**：清理库存、退还租金、关门大吉

### 没有生命周期时的痛点

```javascript
// ❌ 没有生命周期：不知道什么时候执行代码
export default {
  data() {
    return {
      users: []
    }
  },
  // 问题：这段代码什么时候执行？
  // 组件创建时？挂载时？每次更新时？
  fetchUsers() {
    fetch('/api/users').then(res => {
      this.users = res.json()
    })
  }
}
```

**问题**：
- ❌ 不知道何时初始化数据
- ❌ 不知道何时可以访问 DOM
- ❌ 不知道何时清理资源
- ❌ 代码执行时机混乱，容易出 bug

### 使用生命周期后

```javascript
// ✅ 使用生命周期：明确的执行时机
export default {
  data() {
    return {
      users: []
    }
  },
  // ✅ 组件创建时获取数据
  created() {
    this.fetchUsers()
  },
  // ✅ 组件挂载后操作 DOM
  mounted() {
    this.$refs.input.focus()
  },
  // ✅ 组件销毁前清理资源
  beforeDestroy() {
    clearInterval(this.timer)
  },
  methods: {
    fetchUsers() {
      fetch('/api/users').then(res => {
        this.users = res.json()
      })
    }
  }
}
```

**优势**：
- ✅ 代码执行时机明确
- ✅ 资源管理清晰
- ✅ 避免内存泄漏
- ✅ 代码更易维护

## 3. 核心原理讲解

### Vue 生命周期的核心思想

Vue 组件的生命周期遵循 **创建 → 挂载 → 更新 → 销毁** 的过程：
- 每个阶段都有对应的钩子函数
- 你可以在这些钩子里执行特定代码
- 这样实现了对组件生命过程的精确控制

### 生命周期完整图示

```
┌─────────────────────────────────────────────────────────┐
│                    创建阶段                               │
├─────────────────────────────────────────────────────────┤
│  beforeCreate  →  created                               │
│  (实例初始化)     (数据观测、事件配置完成)                  │
│  - data 未初始化  - data 已初始化                         │
│  - methods 未就绪 - methods 已就绪                       │
│  - $el 未定义     - $el 未定义                           │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    挂载阶段                               │
├─────────────────────────────────────────────────────────┤
│  beforeMount  →  mounted                                │
│  (挂载前)         (挂载完成)                              │
│  - 模板已编译      - DOM 已生成                           │
│  - $el 未定义      - $el 已定义                          │
│  - 不能访问 DOM    - 可以访问 DOM                         │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    更新阶段                               │
├─────────────────────────────────────────────────────────┤
│  beforeUpdate  →  updated                               │
│  (更新前)          (更新后)                               │
│  - 数据已变化      - DOM 已更新                           │
│  - DOM 未更新      - 可以访问新 DOM                       │
│  - 可以修改数据    - ❌ 不要修改数据（会死循环）            │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    销毁阶段                               │
├─────────────────────────────────────────────────────────┤
│  beforeDestroy  →  destroyed                            │
│  (销毁前)           (销毁后)                              │
│  - 实例还可用       - 实例已销毁                          │
│  - 可以清理资源     - 所有绑定已解除                       │
│  - 定时器、监听器   - 事件监听已移除                       │
└─────────────────────────────────────────────────────────┘
```

### 各钩子函数详解

| 钩子函数 | 触发时机 | 可以访问 | 典型用途 |
|---------|---------|---------|---------|
| **beforeCreate** | 实例初始化后，数据观测之前 | 无 | 几乎不用 |
| **created** | 实例创建完成 | data, methods, computed | 初始化数据、发起 API 请求 |
| **beforeMount** | 挂载前，模板编译完成 | data, methods | 几乎不用 |
| **mounted** | 挂载完成，DOM 已生成 | data, methods, $el, $refs | 操作 DOM、启动定时器、添加事件监听 |
| **beforeUpdate** | 数据更新前 | data, methods, 旧 DOM | 访问更新前的 DOM 状态 |
| **updated** | 数据更新后 | data, methods, 新 DOM | 操作更新后的 DOM（谨慎使用） |
| **beforeDestroy** | 销毁前 | data, methods, $el | 清理定时器、取消事件监听、取消订阅 |
| **destroyed** | 销毁后 | 无 | 几乎不用 |

### 生活化理解

把组件生命周期想象成**一天的工作**：
- **beforeCreate/created**：早上起床，准备今天的工作
- **beforeMount/mounted**：到公司，打开电脑，开始工作
- **beforeUpdate/updated**：工作中不断处理任务、更新进度
- **beforeDestroy/destroyed**：下班，保存工作、关闭电脑、离开公司

## 4. 基础用法 + 逐行注释

### 4.1 完整的生命周期示例

```vue
<template>
  <div>
    <h1>{{ message }}</h1>
    <p>计数：{{ count }}</p>
    <button @click="changeMessage">改变消息</button>
    <button @click="increment">增加计数</button>
    <button @click="destroyComponent">销毁组件</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello Vue', // 初始消息
      count: 0, // 计数器
      timer: null // 定时器
    }
  },
  
  // ✅ 第一个生命周期钩子：实例初始化后
  beforeCreate() {
    console.log('=== beforeCreate ===')
    console.log('data:', this.message) // undefined - data 还未初始化
    console.log('methods:', this.changeMessage) // undefined - methods 还未初始化
    console.log('$el:', this.$el) // undefined - DOM 还未生成
  },
  
  // ✅ 第二个生命周期钩子：实例创建完成
  created() {
    console.log('=== created ===')
    console.log('data:', this.message) // Hello Vue - data 已初始化
    console.log('methods:', this.changeMessage) // ƒ changeMessage() - methods 已就绪
    console.log('$el:', this.$el) // undefined - DOM 还未生成
    
    // ✅ 常用场景：初始化数据、发起 API 请求
    this.fetchData()
  },
  
  // ✅ 第三个生命周期钩子：挂载前
  beforeMount() {
    console.log('=== beforeMount ===')
    console.log('$el:', this.$el) // undefined - DOM 还未生成
    // 模板已编译，但还未渲染到页面
  },
  
  // ✅ 第四个生命周期钩子：挂载完成
  mounted() {
    console.log('=== mounted ===')
    console.log('$el:', this.$el) // <div>...</div> - DOM 已生成
    console.log('$refs:', this.$refs) // 可以访问 ref 引用的元素
    
    // ✅ 常用场景：操作 DOM、启动定时器、添加事件监听
    this.startTimer()
    this.addEventListeners()
    
    // ✅ 自动聚焦输入框
    if (this.$refs.input) {
      this.$refs.input.focus()
    }
  },
  
  // ✅ 第五个生命周期钩子：数据更新前
  beforeUpdate() {
    console.log('=== beforeUpdate ===')
    console.log('message:', this.message) // 新值
    console.log('DOM 中的 message:', this.$el.querySelector('h1').textContent) // 旧值
    // DOM 还未更新，可以访问更新前的 DOM 状态
  },
  
  // ✅ 第六个生命周期钩子：数据更新后
  updated() {
    console.log('=== updated ===')
    console.log('message:', this.message) // 新值
    console.log('DOM 中的 message:', this.$el.querySelector('h1').textContent) // 新值
    // DOM 已更新，可以访问更新后的 DOM
    
    // ❌ 警告：不要在 updated 中修改数据，可能导致无限循环
    // this.message = '新值' // 会再次触发 updated，死循环！
  },
  
  // ✅ 第七个生命周期钩子：销毁前
  beforeDestroy() {
    console.log('=== beforeDestroy ===')
    console.log('实例还可用:', this.message) // 还可以访问数据
    
    // ✅ 常用场景：清理资源
    this.stopTimer()
    this.removeEventListeners()
    
    // 清理定时器
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },
  
  // ✅ 第八个生命周期钩子：销毁后
  destroyed() {
    console.log('=== destroyed ===')
    console.log('实例已销毁')
    // 所有的事件监听器已被移除
    // 所有的子组件已被销毁
  },
  
  methods: {
    changeMessage() {
      this.message = 'Hello World'
    },
    increment() {
      this.count++
    },
    destroyComponent() {
      this.$destroy() // 销毁当前组件实例
    },
    fetchData() {
      // 模拟 API 请求
      setTimeout(() => {
        console.log('数据获取完成')
      }, 1000)
    },
    startTimer() {
      this.timer = setInterval(() => {
        console.log('定时器执行')
      }, 1000)
    },
    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer)
      }
    },
    addEventListeners() {
      window.addEventListener('resize', this.handleResize)
    },
    removeEventListeners() {
      window.removeEventListener('resize', this.handleResize)
    },
    handleResize() {
      console.log('窗口大小改变')
    }
  }
}
</script>
```

### 4.2 常见应用场景

#### 场景 1：初始化数据

```vue
<template>
  <div>
    <div v-if="loading">加载中...</div>
    <ul v-else>
      <li v-for="user in users" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  data() {
    return {
      users: [], // 用户列表
      loading: false // 加载状态
    }
  },
  
  // ✅ 在 created 中获取数据
  created() {
    this.fetchUsers()
  },
  
  methods: {
    async fetchUsers() {
      this.loading = true
      try {
        // 发起 API 请求
        const response = await fetch('/api/users')
        this.users = await response.json()
      } catch (error) {
        console.error('获取用户失败：', error)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
```

#### 场景 2：操作 DOM

```vue
<template>
  <div>
    <input ref="searchInput" type="text" placeholder="搜索..." />
    <button @click="focusInput">聚焦输入框</button>
  </div>
</template>

<script>
export default {
  // ✅ 在 mounted 中操作 DOM
  mounted() {
    // 自动聚焦输入框
    this.$refs.searchInput.focus()
    
    // 获取元素尺寸
    const rect = this.$refs.searchInput.getBoundingClientRect()
    console.log('输入框位置：', rect)
  },
  
  methods: {
    focusInput() {
      this.$refs.searchInput.focus()
    }
  }
}
</script>
```

#### 场景 3：添加和清理事件监听

```vue
<template>
  <div>
    <p>滚动位置：{{ scrollY }}</p>
    <p>鼠标位置：{{ mouseX }}, {{ mouseY }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      scrollY: 0, // 滚动位置
      mouseX: 0, // 鼠标 X 坐标
      mouseY: 0 // 鼠标 Y 坐标
    }
  },
  
  // ✅ 在 mounted 中添加事件监听
  mounted() {
    window.addEventListener('scroll', this.handleScroll)
    window.addEventListener('mousemove', this.handleMouseMove)
  },
  
  // ✅ 在 beforeDestroy 中清理事件监听
  beforeDestroy() {
    window.removeEventListener('scroll', this.handleScroll)
    window.removeEventListener('mousemove', this.handleMouseMove)
  },
  
  methods: {
    handleScroll() {
      this.scrollY = window.scrollY
    },
    handleMouseMove(event) {
      this.mouseX = event.clientX
      this.mouseY = event.clientY
    }
  }
}
</script>
```

#### 场景 4：定时器管理

```vue
<template>
  <div>
    <p>计时：{{ seconds }} 秒</p>
    <button @click="start">开始</button>
    <button @click="stop">停止</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      seconds: 0, // 秒数
      timer: null // 定时器引用
    }
  },
  
  // ✅ 在 beforeDestroy 中清理定时器
  beforeDestroy() {
    this.stop()
  },
  
  methods: {
    start() {
      if (this.timer) return // 避免重复启动
      
      this.timer = setInterval(() => {
        this.seconds++
      }, 1000)
    },
    stop() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    }
  }
}
</script>
```

### 4.3 父子组件生命周期执行顺序

```vue
<!-- 父组件 Parent.vue -->
<template>
  <div>
    <h1>父组件</h1>
    <child-component></child-component>
  </div>
</template>

<script>
import ChildComponent from './ChildComponent.vue'

export default {
  components: { ChildComponent },
  
  beforeCreate() {
    console.log('父 beforeCreate')
  },
  created() {
    console.log('父 created')
  },
  beforeMount() {
    console.log('父 beforeMount')
  },
  mounted() {
    console.log('父 mounted')
  },
  beforeUpdate() {
    console.log('父 beforeUpdate')
  },
  updated() {
    console.log('父 updated')
  },
  beforeDestroy() {
    console.log('父 beforeDestroy')
  },
  destroyed() {
    console.log('父 destroyed')
  }
}
</script>
```

```vue
<!-- 子组件 ChildComponent.vue -->
<template>
  <div>
    <h2>子组件</h2>
  </div>
</template>

<script>
export default {
  beforeCreate() {
    console.log('子 beforeCreate')
  },
  created() {
    console.log('子 created')
  },
  beforeMount() {
    console.log('子 beforeMount')
  },
  mounted() {
    console.log('子 mounted')
  },
  beforeUpdate() {
    console.log('子 beforeUpdate')
  },
  updated() {
    console.log('子 updated')
  },
  beforeDestroy() {
    console.log('子 beforeDestroy')
  },
  destroyed() {
    console.log('子 destroyed')
  }
}
</script>
```

**执行顺序**：

```
初始化阶段：
父 beforeCreate → 父 created → 父 beforeMount
→ 子 beforeCreate → 子 created → 子 beforeMount → 子 mounted
→ 父 mounted

更新阶段：
父 beforeUpdate → 子 beforeUpdate → 子 updated → 父 updated

销毁阶段：
父 beforeDestroy → 子 beforeDestroy → 子 destroyed → 父 destroyed
```

**理解要点**：
- ✅ 初始化时：父组件先创建，但子组件先挂载（因为父组件要等子组件挂载完成）
- ✅ 更新时：父组件先更新，子组件后更新（从外到内）
- ✅ 销毁时：父组件先销毁，子组件后销毁（从外到内）

### 4.4 路由组件的生命周期

```vue
<script>
export default {
  // ✅ 路由进入时调用（组件内守卫）
  beforeRouteEnter(to, from, next) {
    console.log('即将进入路由：', to.path)
    // ❌ 注意：此时 this 不可用（组件还未创建）
    next() // 确认进入路由
  },
  
  // ✅ 路由改变但组件复用时调用
  beforeRouteUpdate(to, from, next) {
    console.log('路由更新：', to.path)
    // ✅ 此时 this 可用
    this.fetchData(to.params.id)
    next()
  },
  
  // ✅ 路由离开时调用
  beforeRouteLeave(to, from, next) {
    console.log('即将离开路由：', from.path)
    // ✅ 可以询问用户是否确认离开
    const answer = confirm('确定要离开吗？未保存的更改将丢失')
    if (answer) {
      next() // 确认离开
    } else {
      next(false) // 取消离开
    }
  }
}
</script>
```

### 4.5 keep-alive 组件的生命周期

```vue
<!-- 父组件 -->
<template>
  <keep-alive>
    <router-view></router-view>
  </keep-alive>
</template>
```

```vue
<!-- 被 keep-alive 缓存的组件 -->
<script>
export default {
  // ✅ 组件被激活时调用（进入页面）
  activated() {
    console.log('组件被激活')
    // 常用于：重新获取数据、恢复状态
    this.fetchData()
  },
  
  // ✅ 组件被停用时调用（离开页面）
  deactivated() {
    console.log('组件被停用')
    // 常用于：暂停定时器、保存状态
    this.pauseTimer()
  },
  
  // ❌ 注意：被 keep-alive 缓存的组件不会触发 beforeDestroy/destroyed
  // 因为组件只是被隐藏，并未真正销毁
}
</script>
```

### 4.6 错误处理钩子

```vue
<script>
export default {
  // ✅ 捕获子孙组件的错误
  errorCaptured(err, vm, info) {
    console.error('捕获到错误：', err)
    console.error('出错的组件：', vm)
    console.error('错误信息：', info)
    
    // ✅ 可以显示错误提示
    this.errorMessage = '子组件发生了错误'
    
    // ✅ 返回 false 阻止错误继续向上传播
    return false
  },
  
  data() {
    return {
      errorMessage: ''
    }
  }
}
</script>
```

## 5. 对比表格

### 生命周期钩子详细对比

| 钩子函数 | 触发时机 | this 可用 | $el 可用 | 典型用途 | 使用频率 |
|---------|---------|----------|---------|---------|---------|
| **beforeCreate** | 实例初始化后 | ❌ | ❌ | 几乎不用 | ⭐ |
| **created** | 实例创建完成 | ✅ | ❌ | 初始化数据、API 请求 | ⭐⭐⭐⭐⭐ |
| **beforeMount** | 挂载前 | ✅ | ❌ | 几乎不用 | ⭐ |
| **mounted** | 挂载完成 | ✅ | ✅ | 操作 DOM、启动定时器 | ⭐⭐⭐⭐⭐ |
| **beforeUpdate** | 更新前 | ✅ | ✅ | 访问更新前的 DOM | ⭐⭐ |
| **updated** | 更新后 | ✅ | ✅ | 操作更新后的 DOM | ⭐⭐ |
| **beforeDestroy** | 销毁前 | ✅ | ✅ | 清理资源 | ⭐⭐⭐⭐⭐ |
| **destroyed** | 销毁后 | ❌ | ❌ | 几乎不用 | ⭐ |

### created vs mounted 对比

| 特性 | created | mounted |
|-----|---------|---------|
| **触发时机** | 实例创建后 | DOM 挂载后 |
| **data 可用** | ✅ | ✅ |
| **methods 可用** | ✅ | ✅ |
| **$el 可用** | ❌ | ✅ |
| **$refs 可用** | ❌ | ✅ |
| **可以操作 DOM** | ❌ | ✅ |
| **适合 API 请求** | ✅ | ✅ |
| **执行顺序** | 先执行 | 后执行 |
| **使用场景** | 不需要 DOM 的初始化 | 需要 DOM 的操作 |

### 选择建议

```
场景判断：
├─ 需要获取数据？
│  ├─ 是 → 使用 created（更早执行）
│  └─ 否 → 继续判断
├─ 需要操作 DOM？
│  ├─ 是 → 使用 mounted
│  └─ 否 → 继续判断
├─ 需要添加事件监听？
│  ├─ 是 → 使用 mounted
│  └─ 否 → 继续判断
├─ 需要启动定时器？
│  ├─ 是 → 使用 mounted
│  └─ 否 → 使用 created
└─ 需要清理资源？
   ├─ 是 → 使用 beforeDestroy
   └─ 否 → 不需要生命周期钩子
```

## 6. 新手常见误区

### 误区 1：在 created 中访问 DOM

```javascript
// ❌ 错误做法
created() {
  // 这样会报错！DOM 还未生成
  console.log(this.$el) // undefined
  this.$refs.input.focus() // 报错：Cannot read property 'focus' of undefined
}
```

**为什么错**：created 钩子执行时，组件还未挂载到 DOM，$el 和 $refs 都不可用

**正确做法**：
```javascript
// ✅ 正确做法
mounted() {
  // DOM 已生成，可以安全访问
  console.log(this.$el) // <div>...</div>
  this.$refs.input.focus() // 正常工作
}
```

### 误区 2：在 updated 中修改数据导致死循环

```javascript
// ❌ 错误做法
updated() {
  // 这样会导致死循环！
  this.message = '新值' // 修改数据 → 触发更新 → 再次执行 updated → 再次修改数据 → ...
}
```

**为什么错**：在 updated 中修改数据会再次触发更新，形成无限循环

**正确做法**：
```javascript
// ✅ 正确做法
updated() {
  // 只读取 DOM，不修改数据
  console.log('DOM 已更新：', this.$el.textContent)
  
  // 如果必须修改数据，要加条件判断
  if (this.shouldUpdate && this.someCondition) {
    this.someData = '新值'
    this.shouldUpdate = false // 避免再次触发
  }
}
```

### 误区 3：忘记在 beforeDestroy 中清理资源

```javascript
// ❌ 错误做法
mounted() {
  // 添加了事件监听
  window.addEventListener('resize', this.handleResize)
  // 启动了定时器
  this.timer = setInterval(() => {
    this.count++
  }, 1000)
}
// 忘记清理，组件销毁后这些监听器和定时器还在运行！
```

**为什么错**：组件销毁后，事件监听器和定时器还在运行，会导致内存泄漏

**正确做法**：
```javascript
// ✅ 正确做法
mounted() {
  window.addEventListener('resize', this.handleResize)
  this.timer = setInterval(() => {
    this.count++
  }, 1000)
},
beforeDestroy() {
  // 清理事件监听
  window.removeEventListener('resize', this.handleResize)
  // 清理定时器
  if (this.timer) {
    clearInterval(this.timer)
  }
}
```

### 误区 4：混淆路由守卫和生命周期钩子

```javascript
// ❌ 错误理解
export default {
  // 这不是生命周期钩子，是路由守卫
  beforeRouteEnter(to, from, next) {
    // 此时 this 不可用！
    this.fetchData() // 报错
  }
}
```

**为什么错**：beforeRouteEnter 在组件创建之前调用，this 还不可用

**正确做法**：
```javascript
// ✅ 正确做法
export default {
  beforeRouteEnter(to, from, next) {
    // 通过回调访问 this
    next(vm => {
      vm.fetchData()
    })
  },
  
  // 或者使用 created 钩子
  created() {
    this.fetchData()
  }
}
```

### 误区 5：在 keep-alive 组件中使用 beforeDestroy

```javascript
// ❌ 错误做法
export default {
  beforeDestroy() {
    // 这个钩子可能永远不会执行！
    console.log('组件销毁')
  }
}
```

**为什么错**：被 keep-alive 缓存的组件只是被隐藏，不会真正销毁，所以 beforeDestroy 不会触发

**正确做法**：
```javascript
// ✅ 正确做法
export default {
  activated() {
    // 组件被激活时执行
    console.log('组件激活')
    this.fetchData()
  },
  deactivated() {
    // 组件被停用时执行
    console.log('组件停用')
    this.pauseTimer()
  }
}
```

## 7. 动手练习

### 练习 1：基础 - 观察生命周期执行顺序

**题目**：创建一个组件，在所有生命周期钩子中添加 console.log，观察它们的执行顺序。然后添加一个按钮，点击后修改数据，观察 beforeUpdate 和 updated 的执行。

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div>
    <h1>{{ message }}</h1>
    <p>计数：{{ count }}</p>
    <button @click="changeMessage">改变消息</button>
    <button @click="increment">增加计数</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: '初始消息',
      count: 0
    }
  },
  
  beforeCreate() {
    console.log('1. beforeCreate - 实例初始化')
  },
  created() {
    console.log('2. created - 实例创建完成')
  },
  beforeMount() {
    console.log('3. beforeMount - 挂载前')
  },
  mounted() {
    console.log('4. mounted - 挂载完成')
  },
  beforeUpdate() {
    console.log('5. beforeUpdate - 更新前')
    console.log('   DOM 中的消息：', document.querySelector('h1').textContent)
  },
  updated() {
    console.log('6. updated - 更新后')
    console.log('   DOM 中的消息：', document.querySelector('h1').textContent)
  },
  
  methods: {
    changeMessage() {
      this.message = '消息已改变 ' + Date.now()
    },
    increment() {
      this.count++
    }
  }
}
</script>
```

**观察要点**：
1. 页面加载时，按顺序执行 beforeCreate → created → beforeMount → mounted
2. 点击按钮后，执行 beforeUpdate → updated
3. 在 beforeUpdate 中，DOM 还是旧值
4. 在 updated 中，DOM 已更新为新值

</details>

### 练习 2：进阶 - 实现一个自动刷新的数据列表

**题目**：创建一个组件，在 created 中获取初始数据，在 mounted 中启动定时器每 5 秒自动刷新数据，在 beforeDestroy 中清理定时器。要求显示加载状态和错误处理。

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div>
    <h2>用户列表（自动刷新）</h2>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      加载中...
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error">
      <p>加载失败：{{ error }}</p>
      <button @click="fetchUsers">重试</button>
    </div>
    
    <!-- 数据列表 -->
    <ul v-else>
      <li v-for="user in users" :key="user.id">
        {{ user.name }} - {{ user.email }}
      </li>
    </ul>
    
    <!-- 刷新状态 -->
    <p class="status">
      上次刷新：{{ lastUpdate }}
      <span v-if="timer">（自动刷新中）</span>
    </p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      users: [], // 用户列表
      loading: false, // 加载状态
      error: null, // 错误信息
      timer: null, // 定时器引用
      lastUpdate: null // 上次更新时间
    }
  },
  
  // ✅ 在 created 中获取初始数据
  created() {
    this.fetchUsers()
  },
  
  // ✅ 在 mounted 中启动定时器
  mounted() {
    this.startAutoRefresh()
  },
  
  // ✅ 在 beforeDestroy 中清理定时器
  beforeDestroy() {
    this.stopAutoRefresh()
  },
  
  methods: {
    // 获取用户数据
    async fetchUsers() {
      this.loading = true
      this.error = null
      
      try {
        // 模拟 API 请求
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 模拟随机数据
        this.users = [
          { id: 1, name: '张三', email: 'zhang@example.com' },
          { id: 2, name: '李四', email: 'li@example.com' },
          { id: 3, name: '王五', email: 'wang@example.com' }
        ]
        
        this.lastUpdate = new Date().toLocaleTimeString()
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },
    
    // 启动自动刷新
    startAutoRefresh() {
      // 每 5 秒刷新一次
      this.timer = setInterval(() => {
        this.fetchUsers()
      }, 5000)
    },
    
    // 停止自动刷新
    stopAutoRefresh() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    }
  }
}
</script>

<style scoped>
.loading {
  color: #666;
  padding: 20px;
  text-align: center;
}
.error {
  color: red;
  padding: 20px;
  background: #fee;
  border: 1px solid red;
}
.status {
  color: #999;
  font-size: 12px;
  margin-top: 20px;
}
</style>
```

</details>

### 练习 3：挑战 - 实现一个带生命周期日志的组件

**题目**：创建一个高阶组件，能够自动记录所有生命周期钩子的执行日志，包括执行时间、组件名称、参数等信息。这个组件可以作为 mixin 被其他组件使用。

<details>
<summary>点击查看答案</summary>

```javascript
// lifecycle-logger.js
export const LifecycleLogger = {
  // 在所有生命周期钩子中添加日志
  beforeCreate() {
    this.$log('beforeCreate', '实例初始化')
  },
  created() {
    this.$log('created', '实例创建完成')
  },
  beforeMount() {
    this.$log('beforeMount', '挂载前')
  },
  mounted() {
    this.$log('mounted', '挂载完成')
  },
  beforeUpdate() {
    this.$log('beforeUpdate', '更新前')
  },
  updated() {
    this.$log('updated', '更新后')
  },
  beforeDestroy() {
    this.$log('beforeDestroy', '销毁前')
  },
  destroyed() {
    this.$log('destroyed', '销毁后')
  },
  
  // 提供日志方法
  beforeCreate() {
    this.$log = (hook, message) => {
      const timestamp = new Date().toISOString()
      const componentName = this.$options.name || 'Anonymous'
      
      console.group(`🔔 ${componentName} - ${hook}`)
      console.log('时间：', timestamp)
      console.log('信息：', message)
      console.log('数据：', { ...this.$data })
      console.groupEnd()
    }
  }
}
```

```vue
<!-- 使用示例 -->
<template>
  <div>
    <h1>{{ title }}</h1>
    <button @click="changeTitle">改变标题</button>
  </div>
</template>

<script>
import { LifecycleLogger } from './lifecycle-logger.js'

export default {
  name: 'MyComponent', // 组件名称，用于日志显示
  mixins: [LifecycleLogger], // 混入生命周期日志
  
  data() {
    return {
      title: '初始标题'
    }
  },
  
  methods: {
    changeTitle() {
      this.title = '新标题 ' + Date.now()
    }
  }
}
</script>
```

**日志输出示例**：
```
🔔 MyComponent - created
  时间：2024-01-01T12:00:00.000Z
  信息：实例创建完成
  数据：{ title: '初始标题' }

🔔 MyComponent - mounted
  时间：2024-01-01T12:00:00.100Z
  信息：挂载完成
  数据：{ title: '初始标题' }

🔔 MyComponent - beforeUpdate
  时间：2024-01-01T12:00:05.000Z
  信息：更新前
  数据：{ title: '新标题 1704110405000' }
```

</details>

## 8. 下一章预告

恭喜你完成了生命周期的学习！现在你已经理解了组件从创建到销毁的完整过程，可以在合适的时机执行代码了。

这是 Vue 2 基础部分的最后一章。接下来你将进入 **进阶部分**，学习更强大的功能：
- **Vue Router**：实现单页面应用的路由导航
- **Vuex**：全局状态管理，解决复杂应用的状态管理问题
- **Vue 3 新特性**：了解 Vue 3 的 Composition API 等重要改进

生命周期是 Vue 组件的核心概念，掌握它对于理解 Vue 的运行机制至关重要。继续加油，你已经完成了 Vue 2 基础部分的学习！
