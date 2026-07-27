---
title: "第八章：组件通信"
description: "深入理解 Vue 2 组件间的各种通信方式，包括 Props/Emit、provide/inject、EventBus 等，掌握不同场景下的最佳选择。"
---

# 第八章：组件通信

## 本章导读

在开始学习之前，你可能会有这些疑问：

- **疑问 1**：子组件怎么把数据传给父组件？为什么不能直接修改 props？
- **疑问 2**：爷爷组件想传数据给孙子组件，难道要一层一层传吗？
- **疑问 3**：两个没有父子关系的组件怎么互相通信？
- **疑问 4**：这么多通信方式（Props、Emit、provide/inject、EventBus...），我到底该用哪个？

本章会帮你解决这些问题，让你清楚知道每种通信方式的适用场景和优缺点。

## 为什么需要这个技术

### 生活化类比

想象一个公司：
- **老板（父组件）** 要给 **员工（子组件）** 分配任务 → 这就是 **Props 向下传递**
- **员工完成工作后** 要向 **老板汇报** → 这就是 **$emit 向上通知**
- **CEO（祖先组件）** 想直接通知 **基层员工（后代组件）**，不想通过层层经理 → 这就是 **provide/inject**
- **两个平级部门的员工** 要协作 → 这就是 **EventBus 兄弟通信**

### 没有组件通信时的痛点

```vue
<!-- ❌ 错误做法：子组件直接修改父组件数据 -->
<template>
  <div>
    <button @click="parentData = '被修改了'">修改父组件</button>
  </div>
</template>

<script>
export default {
  // 这样会报错！Vue 不允许子组件直接修改父组件数据
  data() {
    return {
      parentData: this.$parent.someData // 破坏组件独立性
    }
  }
}
</script>
```

**问题**：
- ❌ 组件之间耦合度太高
- ❌ 数据流向混乱，难以追踪
- ❌ 组件无法复用

### 使用组件通信后

```vue
<!-- ✅ 正确做法：通过 Props 和 $emit -->
<!-- 父组件 -->
<template>
  <child :title="title" @update="handleUpdate"></child>
</template>

<!-- 子组件 -->
<template>
  <button @click="$emit('update', '新数据')">修改</button>
</template>

<script>
export default {
  props: ['title'] // 明确声明接收的数据
}
</script>
```

**优势**：
- ✅ 数据流向清晰：父 → 子用 Props，子 → 父用 $emit
- ✅ 组件独立性强，可以复用
- ✅ 易于维护和调试

## 核心原理讲解

### Vue 组件通信的核心思想

Vue 的组件通信遵循 **单向数据流** 原则：
- 数据从父组件流向子组件（通过 Props）
- 子组件通过事件通知父组件（通过 $emit）
- 这样保证了数据流向的可预测性

### 各种通信方式对比

| 通信方式 | 适用场景 | 数据流向 | 响应式 |
|---------|---------|---------|--------|
| Props / $emit | 父子组件 | 单向/事件 | ✅ 是 |
| v-model | 表单组件 | 双向绑定 | ✅ 是 |
| .sync | 属性同步 | 双向绑定 | ✅ 是 |
| provide / inject | 跨级组件 | 祖先→后代 | ⚠️ 部分 |
| EventBus | 兄弟组件 | 任意 | ✅ 是 |
| $parent / $children | 直接访问 | 双向 | ✅ 是 |
| $attrs / $listeners | 透传属性 | 跨级 | ✅ 是 |
| Vuex | 全局状态 | 集中管理 | ✅ 是 |

### 生活化理解

把组件通信想象成 **快递系统**：
- **Props**：爸爸给孩子寄包裹（向下传递）
- **$emit**：孩子给爸爸打电话（向上通知）
- **provide/inject**：爷爷直接给孙子零花钱，跳过中间的父母
- **EventBus**：微信群，谁都可以发消息，谁都可以接收
- **$refs**：直接跑到对方面前面说话（不推荐，太直接了）

## 基础用法 + 逐行注释

### 4.1 Props 向下传递（父 → 子）

```vue
<!-- 父组件 Parent.vue -->
<template>
  <div>
    <!-- ✅ 正确：通过 v-bind（简写 :）传递数据 -->
    <child-component 
      :title="parentTitle" 
      :count="parentCount"
      :user-info="userInfo"
    ></child-component>
  </div>
</template>

<script>
import ChildComponent from './ChildComponent.vue'

export default {
  components: { ChildComponent }, // 注册子组件
  data() {
    return {
      parentTitle: '这是父组件的标题', // 要传递给子组件的数据
      parentCount: 10, // 数字类型
      userInfo: { // 对象类型
        name: '张三',
        age: 25
      }
    }
  }
}
</script>
```

```vue
<!-- 子组件 ChildComponent.vue -->
<template>
  <div>
    <!-- 使用父组件传递的数据 -->
    <h2>{{ title }}</h2>
    <p>计数：{{ count }}</p>
    <p>用户：{{ userInfo.name }}，{{ userInfo.age }}岁</p>
    
    <!-- ❌ 错误：直接修改 props -->
    <!-- <button @click="title = '新标题'">修改标题</button> -->
    <!-- 这样会报错！props 是只读的 -->
    
    <!-- ✅ 正确：通过 $emit 通知父组件修改 -->
    <button @click="updateTitle">修改标题</button>
  </div>
</template>

<script>
export default {
  // ✅ 正确：声明 props，指定类型
  props: {
    title: {
      type: String, // 类型是字符串
      required: true // 必填项
    },
    count: {
      type: Number, // 类型是数字
      default: 0 // 默认值
    },
    userInfo: {
      type: Object, // 类型是对象
      default: () => ({ name: '默认用户', age: 0 }) // 对象默认值要用函数
    }
  },
  methods: {
    updateTitle() {
      // ✅ 正确：通过 $emit 触发事件，让父组件自己修改数据
      this.$emit('update-title', '新的标题')
    }
  }
}
</script>
```

### 4.2 $emit 向上通知（子 → 父）

```vue
<!-- 子组件 Child.vue -->
<template>
  <div>
    <button @click="sendDataToParent">
      向父组件发送数据
    </button>
  </div>
</template>

<script>
export default {
  methods: {
    sendDataToParent() {
      // ✅ 正确：使用 $emit 触发自定义事件
      // 第一个参数：事件名
      // 第二个参数及以后：要传递的数据
      this.$emit('custom-event', { 
        message: '来自子组件的数据',
        timestamp: Date.now()
      })
    }
  }
}
</script>
```

```vue
<!-- 父组件 Parent.vue -->
<template>
  <div>
    <!-- ✅ 正确：监听子组件的自定义事件 -->
    <child @custom-event="handleCustomEvent"></child>
    
    <p v-if="receivedData">
      收到数据：{{ receivedData.message }}
    </p>
  </div>
</template>

<script>
import Child from './Child.vue'

export default {
  components: { Child },
  data() {
    return {
      receivedData: null
    }
  },
  methods: {
    handleCustomEvent(data) {
      // 处理子组件传来的数据
      console.log('收到子组件数据：', data)
      this.receivedData = data
    }
  }
}
</script>
```

### 4.3 v-model 双向绑定

```vue
<!-- 子组件 CustomInput.vue -->
<template>
  <input 
    :value="value" 
    @input="$emit('input', $event.target.value)"
  />
</template>

<script>
export default {
  props: {
    value: String // v-model 默认绑定的 prop
  }
}
</script>
```

```vue
<!-- 父组件 -->
<template>
  <div>
    <!-- ✅ 使用 v-model 实现双向绑定 -->
    <custom-input v-model="message"></custom-input>
    
    <!-- 上面这行等价于： -->
    <!-- <custom-input :value="message" @input="message = $event"></custom-input> -->
    
    <p>输入的内容：{{ message }}</p>
  </div>
</template>

<script>
import CustomInput from './CustomInput.vue'

export default {
  components: { CustomInput },
  data() {
    return {
      message: '' // 双向绑定的数据
    }
  }
}
</script>
```

### 4.4 .sync 修饰符

```vue
<!-- 子组件 Child.vue -->
<template>
  <div>
    <p>标题：{{ title }}</p>
    <button @click="updateTitle">修改标题</button>
  </div>
</template>

<script>
export default {
  props: ['title'],
  methods: {
    updateTitle() {
      // ✅ 正确：触发 update:属性名 事件
      this.$emit('update:title', '新的标题')
    }
  }
}
</script>
```

```vue
<!-- 父组件 -->
<template>
  <div>
    <!-- ✅ 使用 .sync 实现属性双向绑定 -->
    <child :title.sync="pageTitle"></child>
    
    <!-- 上面这行等价于： -->
    <!-- <child :title="pageTitle" @update:title="pageTitle = $event"></child> -->
  </div>
</template>

<script>
export default {
  data() {
    return {
      pageTitle: '初始标题'
    }
  }
}
</script>
```

### 4.5 provide / inject 跨级通信

```vue
<!-- 祖先组件 Ancestor.vue -->
<template>
  <div>
    <h1>祖先组件</h1>
    <parent-component></parent-component>
  </div>
</template>

<script>
import ParentComponent from './ParentComponent.vue'

export default {
  components: { ParentComponent },
  // ✅ 提供数据
  provide() {
    return {
      theme: 'dark', // 简单值
      user: { // 对象
        name: '张三',
        age: 25
      },
      // ✅ 提供响应式数据
      reactiveData: this.someData
    }
  },
  data() {
    return {
      someData: '响应式数据'
    }
  }
}
</script>
```

```vue
<!-- 后代组件 Descendant.vue（可以跳过中间层） -->
<template>
  <div>
    <p>主题：{{ theme }}</p>
    <p>用户：{{ user.name }}</p>
    <p>响应式数据：{{ reactiveData }}</p>
  </div>
</template>

<script>
export default {
  // ✅ 注入数据
  inject: ['theme', 'user', 'reactiveData']
}
</script>
```

### 4.6 EventBus 兄弟通信

```javascript
// event-bus.js
import Vue from 'vue'
// ✅ 创建一个空的 Vue 实例作为事件总线
export const EventBus = new Vue()
```

```vue
<!-- 组件 A（发送方） -->
<template>
  <button @click="sendMessage">
    发送消息给组件 B
  </button>
</template>

<script>
import { EventBus } from './event-bus.js'

export default {
  methods: {
    sendMessage() {
      // ✅ 发送事件
      EventBus.$emit('message-event', 'Hello from A')
    }
  }
}
</script>
```

```vue
<!-- 组件 B（接收方） -->
<template>
  <p>收到的消息：{{ message }}</p>
</template>

<script>
import { EventBus } from './event-bus.js'

export default {
  data() {
    return {
      message: ''
    }
  },
  mounted() {
    // ✅ 监听事件
    EventBus.$on('message-event', (data) => {
      this.message = data
    })
  },
  beforeDestroy() {
    // ✅ 重要：组件销毁时取消监听，避免内存泄漏
    EventBus.$off('message-event')
  }
}
</script>
```

### 4.7 $attrs 和 $listeners 透传

```vue
<!-- 父组件 -->
<template>
  <child-component 
    title="标题" 
    count="10"
    @click="handleClick"
    @update="handleUpdate"
  ></child-component>
</template>
```

```vue
<!-- 子组件 ChildComponent.vue -->
<template>
  <div>
    <p>接收到的 title：{{ title }}</p>
    <!-- ✅ 其他未声明的属性会通过 $attrs 传递 -->
    <p>$attrs：{{ $attrs }}</p>
    
    <!-- ✅ 将 $attrs 继续传递给孙子组件 -->
    <grand-child v-bind="$attrs" v-on="$listeners"></grand-child>
  </div>
</template>

<script>
export default {
  props: ['title'], // 只声明 title，其他属性会进入 $attrs
  inheritAttrs: false // 阻止属性绑定到根元素
}
</script>
```

## 对比表格

### 各种通信方式详细对比

| 通信方式 | 适用场景 | 优点 | 缺点 | 推荐度 |
|---------|---------|------|------|--------|
| **Props / $emit** | 父子组件 | 简单直观，易于理解 | 只能单向流动，跨级繁琐 | ⭐⭐⭐⭐⭐ |
| **v-model** | 表单组件 | 双向绑定，语法简洁 | 需要特定实现 | ⭐⭐⭐⭐ |
| **.sync** | 属性同步 | 语法简洁 | Vue 3 已移除 | ⭐⭐⭐ |
| **provide / inject** | 跨级组件 | 解耦组件关系 | 难以追踪数据来源 | ⭐⭐⭐⭐ |
| **EventBus** | 兄弟组件 | 灵活，任意组件通信 | 难以维护，容易混乱 | ⭐⭐ |
| **$parent / $children** | 直接访问 | 简单直接 | 破坏封装性，不推荐 | ⭐ |
| **$attrs / $listeners** | 透传属性 | 适合封装高阶组件 | 理解成本高 | ⭐⭐⭐ |
| **Vuex** | 全局状态 | 集中管理，可预测 | 代码量较大 | ⭐⭐⭐⭐⭐ |

### 选择建议

```
场景判断：
├─ 父子组件通信？
│  ├─ 是 → 使用 Props / $emit
│  └─ 需要双向绑定？
│     ├─ 是 → 使用 v-model 或 .sync
│     └─ 否 → 使用 Props / $emit
├─ 跨级组件通信（祖先→后代）？
│  ├─ 是 → 使用 provide / inject
│  └─ 否 → 继续判断
├─ 兄弟组件通信？
│  ├─ 是 → 使用 EventBus 或 Vuex
│  └─ 否 → 继续判断
└─ 复杂应用，多个组件共享状态？
   ├─ 是 → 使用 Vuex
   └─ 否 → 使用上述方式
```

## 新手常见误区

### 误区 1：直接修改 Props

```vue
<!-- ❌ 错误做法 -->
<template>
  <button @click="title = '新标题'">修改</button>
</template>

<script>
export default {
  props: ['title'],
  // 这样会报错：Avoid mutating a prop directly
}
</script>
```

**为什么错**：Props 是只读的，直接修改会破坏单向数据流

**正确做法**：
```vue
<!-- ✅ 正确做法 -->
<template>
  <button @click="$emit('update:title', '新标题')">修改</button>
</template>

<script>
export default {
  props: ['title'],
  methods: {
    updateTitle() {
      this.$emit('update:title', '新标题')
    }
  }
}
</script>
```

### 误区 2：忘记取消 EventBus 监听

```javascript
// ❌ 错误做法
mounted() {
  EventBus.$on('event', this.handler)
}
// 忘记在组件销毁时取消监听，会导致内存泄漏
```

**为什么错**：组件销毁后，监听器还在，每次触发事件都会执行已销毁组件的方法

**正确做法**：
```javascript
// ✅ 正确做法
mounted() {
  EventBus.$on('event', this.handler)
},
beforeDestroy() {
  EventBus.$off('event', this.handler) // 取消监听
}
```

### 误区 3：provide 传递非响应式数据

```javascript
// ❌ 错误做法
provide() {
  return {
    theme: this.theme // 传递的是值，不是响应式的
  }
}
```

**为什么错**：当 this.theme 变化时，子组件不会更新

**正确做法**：
```javascript
// ✅ 正确做法
provide() {
  return {
    theme: this.theme, // 传递对象属性，保持响应式
    // 或者使用计算属性
    reactiveTheme: () => this.theme
  }
}
```

### 误区 4：滥用 $parent / $children

```javascript
// ❌ 错误做法
mounted() {
  this.$parent.someData = '修改父组件数据'
  this.$children[0].someMethod()
}
```

**为什么错**：
- 破坏了组件的封装性
- 组件之间强耦合，难以复用
- 代码难以维护

**正确做法**：使用 Props / $emit 或其他通信方式

### 误区 5：在 provide/inject 中传递复杂对象

```javascript
// ❌ 不推荐
provide() {
  return {
    config: {
      api: { url: '...', timeout: 5000 },
      theme: { color: 'red', size: 'large' }
    }
  }
}
```

**为什么错**：后代组件可能只用到其中一部分，但整个对象都被注入了

**正确做法**：
```javascript
// ✅ 推荐：提供具体的值或方法
provide() {
  return {
    apiUrl: this.config.api.url,
    themeColor: this.config.theme.color
  }
}
```

## 动手练习

### 练习 1：基础 - 父子组件通信

**题目**：创建一个父组件和一个子组件，父组件传递一个数字给子组件，子组件显示这个数字，并提供一个按钮，点击后通知父组件将数字加 1。

<details>
<summary>点击查看答案</summary>

```vue
<!-- 父组件 Parent.vue -->
<template>
  <div>
    <h2>父组件</h2>
    <p>当前数字：{{ count }}</p>
    <child-component 
      :count="count" 
      @increment="handleIncrement"
    ></child-component>
  </div>
</template>

<script>
import ChildComponent from './ChildComponent.vue'

export default {
  components: { ChildComponent },
  data() {
    return {
      count: 0
    }
  },
  methods: {
    handleIncrement() {
      this.count++
    }
  }
}
</script>
```

```vue
<!-- 子组件 ChildComponent.vue -->
<template>
  <div>
    <h3>子组件</h3>
    <p>接收到的数字：{{ count }}</p>
    <button @click="$emit('increment')">
      加 1
    </button>
  </div>
</template>

<script>
export default {
  props: {
    count: {
      type: Number,
      default: 0
    }
  }
}
</script>
```

</details>

### 练习 2：进阶 - 使用 provide/inject 实现主题切换

**题目**：创建一个祖先组件，通过 provide 提供主题颜色，创建两个后代组件（可以跳过中间层），一个显示背景色，一个显示文字颜色，都能响应主题变化。

<details>
<summary>点击查看答案</summary>

```vue
<!-- 祖先组件 Ancestor.vue -->
<template>
  <div>
    <h2>祖先组件</h2>
    <button @click="toggleTheme">切换主题</button>
    <parent-component></parent-component>
  </div>
</template>

<script>
import ParentComponent from './ParentComponent.vue'

export default {
  components: { ParentComponent },
  provide() {
    return {
      theme: this.theme
    }
  },
  data() {
    return {
      theme: {
        bgColor: '#fff',
        textColor: '#000'
      }
    }
  },
  methods: {
    toggleTheme() {
      if (this.theme.bgColor === '#fff') {
        this.theme.bgColor = '#333'
        this.theme.textColor = '#fff'
      } else {
        this.theme.bgColor = '#fff'
        this.theme.textColor = '#000'
      }
    }
  }
}
</script>
```

```vue
<!-- 后代组件 A - 背景色组件 -->
<template>
  <div :style="{ backgroundColor: theme.bgColor }">
    <p>背景色组件</p>
  </div>
</template>

<script>
export default {
  inject: ['theme']
}
</script>
```

```vue
<!-- 后代组件 B - 文字颜色组件 -->
<template>
  <div :style="{ color: theme.textColor }">
    <p>文字颜色组件</p>
  </div>
</template>

<script>
export default {
  inject: ['theme']
}
</script>
```

</details>

### 练习 3：挑战 - 实现一个简单的 EventBus

**题目**：不使用 Vue 实例，自己实现一个简单的 EventBus 类，支持 $on、$off、$emit 方法，然后用它实现兄弟组件通信。

<details>
<summary>点击查看答案</summary>

```javascript
// my-event-bus.js
export class MyEventBus {
  constructor() {
    this.events = {} // 存储事件和对应的回调
  }
  
  $on(eventName, callback) {
    // 如果事件不存在，创建数组
    if (!this.events[eventName]) {
      this.events[eventName] = []
    }
    // 添加回调
    this.events[eventName].push(callback)
  }
  
  $off(eventName, callback) {
    if (!this.events[eventName]) return
    
    if (callback) {
      // 移除指定的回调
      this.events[eventName] = this.events[eventName]
        .filter(cb => cb !== callback)
    } else {
      // 移除所有回调
      delete this.events[eventName]
    }
  }
  
  $emit(eventName, data) {
    if (!this.events[eventName]) return
    
    // 执行所有回调
    this.events[eventName].forEach(callback => {
      callback(data)
    })
  }
}

// 导出单例
export const myEventBus = new MyEventBus()
```

```vue
<!-- 组件 A -->
<template>
  <button @click="sendMessage">发送消息</button>
</template>

<script>
import { myEventBus } from './my-event-bus.js'

export default {
  methods: {
    sendMessage() {
      myEventBus.$emit('message', 'Hello from A')
    }
  }
}
</script>
```

```vue
<!-- 组件 B -->
<template>
  <p>收到：{{ message }}</p>
</template>

<script>
import { myEventBus } from './my-event-bus.js'

export default {
  data() {
    return {
      message: ''
    }
  },
  mounted() {
    myEventBus.$on('message', (data) => {
      this.message = data
    })
  },
  beforeDestroy() {
    myEventBus.$off('message')
  }
}
</script>
```

</details>

## 下一章预告

恭喜你完成了组件通信的学习！现在你已经掌握了如何让组件之间互相传递数据。

下一章我们将学习 **插槽（Slots）**，这是 Vue 中非常强大的内容分发机制。你会学到：
- 如何让父组件向子组件插入内容
- 默认插槽、具名插槽、作用域插槽的区别和用法
- 如何设计可复用的组件模板

插槽是构建可复用组件的关键技术，让我们继续前进吧！
