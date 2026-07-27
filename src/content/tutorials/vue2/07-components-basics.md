---
title: "第七章：组件基础"
description: "学习 Vue 2 组件系统的核心概念，包括组件注册、Props 和自定义事件。"
---

# 第七章：组件基础

## 本章导读

在开始学习之前，你可能会有这些疑问：

1. **组件到底是什么？** 为什么大家都说 Vue 的核心是组件？组件和普通 HTML 标签有什么区别？
2. **怎么创建和使用组件？** 全局注册和局部注册有什么区别？什么时候用哪种？
3. **父子组件之间怎么传递数据？** Props 怎么用？子组件怎么把数据传回父组件？
4. **怎么动态切换组件？** 比如 Tab 切换、页面路由，怎么让组件按需显示和缓存？

本章会带你从零开始理解 Vue 的组件系统，掌握组件化开发的核心技能。

## 为什么需要这个技术

### 没有组件时的痛点

想象一下，你要开发一个电商网站，页面上有导航栏、商品列表、购物车、页脚……

```html
<!-- ❌ 没有组件：所有代码写在一个巨大的 HTML 文件里 -->
<body>
  <!-- 导航栏：200 行代码 -->
  <nav>...</nav>
  
  <!-- 商品列表：500 行代码 -->
  <div class="product-list">...</div>
  
  <!-- 购物车：300 行代码 -->
  <div class="shopping-cart">...</div>
  
  <!-- 页脚：100 行代码 -->
  <footer>...</footer>
  
  <!-- 总共 1100 行代码混在一起，难以维护 -->
</body>
```

**问题在哪里？**
- 代码全部堆在一起，找一个功能要翻几百行
- 导航栏在多个页面重复出现，改一处要改所有页面
- 多人协作时容易冲突
- 无法复用，每次新页面都要重新写

### 生活化类比

把组件想象成**乐高积木**：

- **没有组件**：每次都要从一团泥巴开始捏，捏出房子、车子、飞机……每次都是全新的
- **有组件**：你已经有了各种乐高积木（轮子、墙壁、窗户），需要时直接拼装就行

组件就是 Vue 帮你造好的"积木块"，造一次就能到处用。

### 有了组件之后的对比

```vue
<!-- ✅ 有组件：像搭积木一样组装页面 -->
<template>
  <div>
    <nav-bar />          <!-- 导航栏组件 -->
    <product-list />     <!-- 商品列表组件 -->
    <shopping-cart />    <!-- 购物车组件 -->
    <footer-bar />       <!-- 页脚组件 -->
  </div>
</template>
```

**差异对比：**

| 对比项 | 没有组件 | 有组件 |
|--------|----------|--------|
| 代码组织 | 全部堆在一个文件 | 拆分成独立文件，各司其职 |
| 复用性 | 复制粘贴，改一处改所有 | 造一次，到处用 |
| 维护性 | 牵一发动全身 | 每个组件独立维护 |
| 协作 | 多人改同一文件，冲突不断 | 每人负责不同组件 |
| 可读性 | 上千行代码难以理解 | 组件名就是功能说明 |

## 核心原理讲解

### 组件的本质

组件本质上是一个**带有模板和逻辑的 Vue 实例**：

```javascript
// 组件 = 模板 + 数据 + 方法
{
  template: '<div>{{ message }}</div>', // 模板：长什么样
  data() {                              // 数据：有什么内容
    return { message: 'Hello' }
  },
  methods: {                            // 方法：能做什么
    handleClick() { /* ... */ }
  }
}
```

### 通俗类比

把组件系统想象成**公司组织架构**：

- **全局组件**：公司的公共部门（如行政部），所有分公司都能用
- **局部组件**：某个分公司的专属部门（如北京分公司的法务部），只有这个分公司能用
- **Props**：上级给下级下达的指令（父组件传给子组件的数据）
- **自定义事件**：下级向上级汇报工作（子组件通知父组件）
- **动态组件**：灵活用工，根据需要在不同岗位之间切换

### 组件通信方式对比

| 通信方式 | 方向 | 适用场景 | 生活类比 |
|----------|------|----------|----------|
| Props | 父 → 子 | 父组件给子组件传数据 | 老板给员工分配任务 |
| $emit | 子 → 父 | 子组件通知父组件 | 员工向老板汇报工作 |
| v-model | 父 ↔ 子 | 双向绑定 | 老板和员工协商任务 |
| .sync | 父 ↔ 子 | prop 双向绑定 | 老板随时更新员工任务 |

## 基础用法 + 逐行注释

### 1. 全局组件注册

```javascript
// main.js - 入口文件
import Vue from 'vue'
import App from './App.vue'

// ✅ 全局注册组件
Vue.component('my-component', {
  // 第一个参数：组件名（使用时写成 <my-component>）
  // 第二个参数：组件配置对象
  
  template: '<div>这是一个全局组件</div>'
  // template：定义组件的 HTML 结构
})

// 创建 Vue 根实例并挂载
new Vue({
  render: h => h(App)
}).$mount('#app')
```

```vue
<!-- App.vue - 根组件 -->
<template>
  <div>
    <!-- ✅ 全局组件可以在任意位置使用 -->
    <my-component></my-component>
    <!-- 使用第一次 -->
    
    <my-component></my-component>
    <!-- 使用第二次，可以重复使用 -->
    
    <my-component></my-component>
    <!-- 使用第三次 -->
  </div>
</template>
```

::: tip
全局组件适合那些**到处都要用**的组件，比如按钮、图标、输入框等基础组件。但全局注册会让最终打包体积变大，因为所有全局组件都会被打包进去。
:::

### 2. 局部组件注册

```vue
<template>
  <div>
    <!-- ✅ 局部组件只能在注册它的组件中使用 -->
    <local-component></local-component>
  </div>
</template>

<script>
// ✅ 定义组件（对象形式）
const LocalComponent = {
  template: '<div>这是一个局部组件</div>'
  // 组件的模板
}

export default {
  components: {
    LocalComponent
    // 注册局部组件，注册后才能在 template 中使用 <local-component>
    // 键名就是组件名，值是组件配置对象
  }
}
</script>
```

### 3. 单文件组件（SFC）

```vue
<!-- MyComponent.vue - 一个完整的单文件组件 -->
<!-- ✅ 单文件组件 = template + script + style 三合一 -->

<template>
  <!-- 模板区域：定义组件长什么样 -->
  <div class="my-component">
    <!-- class 用于样式控制 -->
    <h2>{{ title }}</h2>
    <!-- 插值表达式显示 title 数据 -->
    <p>{{ message }}</p>
    <!-- 插值表达式显示 message 数据 -->
    <button @click="handleClick">点击我</button>
    <!-- 绑定点击事件 -->
  </div>
</template>

<script>
// 逻辑区域：定义组件的数据和方法
export default {
  name: 'MyComponent',
  // name：组件名，方便调试和递归调用
  
  data() {
    // data 必须是函数，返回组件的数据对象
    return {
      message: 'Hello from component'
      // 组件内部数据
    }
  },
  
  methods: {
    handleClick() {
      // 点击事件处理函数
      console.log('Button clicked')
    }
  }
}
</script>

<style scoped>
/* 样式区域：scoped 表示样式只对当前组件生效 */
.my-component {
  padding: 20px;
  border: 1px solid #ddd;
}
</style>
```

```vue
<!-- 使用单文件组件 -->
<template>
  <div>
    <my-component></my-component>
    <!-- 使用导入的单文件组件 -->
  </div>
</template>

<script>
import MyComponent from './MyComponent.vue'
// ✅ 导入单文件组件（.vue 文件）

export default {
  components: {
    MyComponent
    // 注册为局部组件
  }
}
</script>
```

### 4. Props 基础

```vue
<!-- ChildComponent.vue - 子组件 -->
<template>
  <div>
    <h3>{{ title }}</h3>
    <!-- 显示父组件传来的 title -->
    <p>计数：{{ count }}</p>
    <!-- 显示父组件传来的 count -->
    <p>消息：{{ message }}</p>
    <!-- 显示父组件传来的 message -->
  </div>
</template>

<script>
export default {
  props: {
    // ✅ props 用于接收父组件传递的数据
    
    title: {
      type: String,
      // type：指定数据类型，传错类型会报警告
      required: true
      // required：必须传递这个 prop
    },
    
    count: {
      type: Number,
      default: 0
      // default：如果不传，使用默认值 0
    },
    
    message: {
      type: String,
      default: '默认消息'
      // 默认值为 '默认消息'
    }
  }
}
</script>
```

```vue
<!-- 父组件 -->
<template>
  <div>
    <child-component
      title="组件标题"
      <!-- 传递字符串，直接写值（不加冒号） -->
      :count="10"
      <!-- 传递数字，加冒号表示 JavaScript 表达式 -->
      message="自定义消息"
      <!-- 传递字符串 -->
    ></child-component>
  </div>
</template>

<script>
import ChildComponent from './ChildComponent.vue'

export default {
  components: {
    ChildComponent
    // 注册子组件
  }
}
</script>
```

::: warning
❌ 注意：`title="组件标题"` 传递的是字符串，`:count="10"` 传递的是数字 10。不加冒号 `:` 传递的都是字符串！
:::

### 5. Props 验证

```vue
<script>
export default {
  props: {
    // ✅ 基础类型检查
    propA: Number,
    // 只接受 Number 类型
    
    // ✅ 多种类型
    propB: [String, Number],
    // 接受 String 或 Number 类型
    
    // ✅ 必填 + 类型
    propC: {
      type: String,
      required: true
      // 必须传递，否则控制台报警告
    },
    
    // ✅ 带默认值
    propD: {
      type: Number,
      default: 100
      // 不传时默认为 100
    },
    
    // ✅ 对象默认值（必须用函数返回）
    propE: {
      type: Object,
      default() {
        return { message: '默认对象' }
        // 对象和数组的默认值必须用工厂函数返回
        // 避免多个组件实例共享同一个引用
      }
    },
    
    // ✅ 自定义验证函数
    propF: {
      validator(value) {
        // 返回 true 表示验证通过，false 表示失败
        return ['success', 'warning', 'danger'].includes(value)
        // 只接受 'success'、'warning'、'danger' 三个值
      }
    }
  }
}
</script>
```

### 6. Props 类型

```vue
<script>
export default {
  props: {
    // ✅ 基本类型
    stringProp: String,
    // 字符串类型
    
    numberProp: Number,
    // 数字类型
    
    booleanProp: Boolean,
    // 布尔类型
    
    arrayProp: Array,
    // 数组类型
    
    objectProp: Object,
    // 对象类型
    
    functionProp: Function,
    // 函数类型
    
    // ✅ 构造函数类型
    dateProp: Date,
    // Date 对象类型
    
    // ✅ 自定义构造函数
    customProp: {
      type: Person,
      // Person 是自定义的构造函数/类
      required: true
    }
  }
}
</script>
```

### 7. 自定义事件

```vue
<!-- ChildComponent.vue - 子组件 -->
<template>
  <button @click="handleClick">
    点击触发事件
  </button>
</template>

<script>
export default {
  methods: {
    handleClick() {
      // ✅ 触发自定义事件
      this.$emit('custom-event', {
        // $emit：触发自定义事件
        // 第一个参数：事件名
        // 第二个参数：要传递的数据（可选）
        message: 'Hello from child',
        // 传递消息文本
        timestamp: Date.now()
        // 传递当前时间戳
      })
    }
  }
}
</script>
```

```vue
<!-- 父组件 -->
<template>
  <div>
    <child-component @custom-event="handleEvent"></child-component>
    <!-- @custom-event：监听子组件触发的 custom-event 事件 -->
    
    <p v-if="eventData">
      收到消息：{{ eventData.message }}
      <!-- 显示子组件传递的消息 -->
    </p>
  </div>
</template>

<script>
import ChildComponent from './ChildComponent.vue'

export default {
  components: {
    ChildComponent
  },
  data() {
    return {
      eventData: null
      // 存储子组件传递的数据
    }
  },
  methods: {
    handleEvent(data) {
      // 处理子组件触发的事件
      this.eventData = data
      // 把子组件传来的数据保存到 eventData
      console.log('收到子组件事件：', data)
    }
  }
}
</script>
```

### 8. 事件修饰符（组件上）

```vue
<template>
  <div>
    <!-- ✅ .once：事件只触发一次 -->
    <child-component @custom-event.once="handleOnce"></child-component>
    <!-- 子组件多次触发 custom-event，handleOnce 只会执行一次 -->
    
    <!-- ✅ .native：监听组件根元素的原生事件 -->
    <child-component @click.native="handleNativeClick"></child-component>
    <!-- .native 让事件监听的是组件根元素的原生 click 事件 -->
    <!-- 而不是自定义事件 -->
  </div>
</template>
```

### 9. 动态组件

```vue
<template>
  <div>
    <!-- Tab 切换按钮 -->
    <button @click="currentTab = 'home'">首页</button>
    <!-- 点击时把 currentTab 设为 'home' -->
    <button @click="currentTab = 'about'">关于</button>
    <!-- 点击时把 currentTab 设为 'about' -->
    <button @click="currentTab = 'contact'">联系</button>
    <!-- 点击时把 currentTab 设为 'contact' -->
    
    <!-- ✅ 动态组件：根据 currentTab 的值渲染不同组件 -->
    <component :is="currentTab"></component>
    <!-- :is 绑定组件名，currentTab 是什么就渲染什么组件 -->
    <!-- currentTab = 'home' → 渲染 Home 组件 -->
    <!-- currentTab = 'about' → 渲染 About 组件 -->
  </div>
</template>

<script>
import Home from './Home.vue'
// 导入首页组件
import About from './About.vue'
// 导入关于组件
import Contact from './Contact.vue'
// 导入联系组件

export default {
  components: {
    Home,
    About,
    Contact
    // 注册所有可能用到的组件
  },
  data() {
    return {
      currentTab: 'home'
      // 当前显示的组件名，默认 'home'
    }
  }
}
</script>
```

### 10. keep-alive 缓存

```vue
<template>
  <div>
    <!-- 切换按钮 -->
    <button @click="currentView = 'home'">首页</button>
    <button @click="currentView = 'settings'">设置</button>
    
    <!-- ✅ keep-alive：缓存被切换的组件，不重新创建 -->
    <keep-alive>
      <!-- 被 keep-alive 包裹的组件切换时不会被销毁 -->
      <!-- 而是被缓存起来，下次切换回来时直接复用 -->
      <component :is="currentView">
        <!-- 被缓存的组件不会重新创建 -->
      </component>
    </keep-alive>
    
    <!-- 生活类比： -->
    <!-- 没有 keep-alive：每次换台，之前的节目就停了，回来要重新开始 -->
    <!-- 有 keep-alive：每次换台，之前的节目暂停了，回来可以继续看 -->
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentView: 'home'
      // 当前视图
    }
  }
}
</script>
```

::: tip
`keep-alive` 适合缓存不经常变化的组件，比如 Tab 页签。但它会占用额外内存，不要滥用。
:::

## 对比表格

### 全局注册 vs 局部注册

| 特性 | 全局注册 | 局部注册 |
|------|----------|----------|
| 注册方式 | `Vue.component()` | `components: {}` |
| 可用范围 | 所有组件中都能用 | 只在注册它的组件中能用 |
| 打包体积 | 所有全局组件都会打包 | 按需打包，未使用的不打包 |
| 适用场景 | 基础组件（按钮、图标等） | 业务组件（页面级组件） |
| 生活类比 | 公司公共部门 | 分公司专属部门 |

### Props 验证选项

| 选项 | 作用 | 示例 |
|------|------|------|
| `type` | 类型检查 | `type: String` |
| `required` | 是否必填 | `required: true` |
| `default` | 默认值 | `default: 0` |
| `validator` | 自定义验证 | `validator: v => v > 0` |

### 组件通信方式选择

| 场景 | 推荐方式 | 原因 |
|------|----------|------|
| 父传子（单向） | Props | Vue 标准方式，清晰明了 |
| 子传父 | `$emit` + 事件监听 | 符合单向数据流原则 |
| 父子双向绑定 | `v-model` | 语法糖，简化代码 |
| 跨层级通信 | 事件总线 / Vuex | 避免 props 层层传递 |

## 新手常见误区

### 误区 1：直接修改 Props

❌ **错误写法：**
```vue
<script>
export default {
  props: ['count'],
  methods: {
    increment() {
      this.count++ // ❌ 错误：直接修改 prop，Vue 会报警告
    }
  }
}
</script>
```

✅ **正确写法：**
```vue
<script>
export default {
  props: ['count'],
  data() {
    return {
      localCount: this.count
      // ✅ 用 data 接收 prop 的值，然后修改本地数据
    }
  },
  methods: {
    increment() {
      this.localCount++ // ✅ 修改本地数据
    }
  }
}
</script>
```

**为什么错？** Vue 的单向数据流原则规定：子组件不能直接修改父组件传来的 prop。这会让数据流向变得混乱，难以追踪数据来源。

### 误区 2：组件的 data 不是函数

❌ **错误写法：**
```javascript
export default {
  data: {
    message: 'Hello'
    // ❌ 错误：data 必须是函数
  }
}
```

✅ **正确写法：**
```javascript
export default {
  data() {
    return {
      message: 'Hello'
      // ✅ 正确：data 是函数，返回数据对象
    }
  }
}
```

**为什么错？** 组件可能被多次使用（创建多个实例）。如果 data 是对象，所有实例会共享同一份数据。用函数返回新对象，每个实例都有自己独立的数据。

### 误区 3：Props 的默认值是对象/数组时直接写

❌ **错误写法：**
```javascript
props: {
  userInfo: {
    type: Object,
    default: { name: '默认' }
    // ❌ 错误：对象默认值不能直接写
  }
}
```

✅ **正确写法：**
```javascript
props: {
  userInfo: {
    type: Object,
    default() {
      return { name: '默认' }
      // ✅ 正确：用工厂函数返回新对象
    }
  }
}
```

**为什么错？** 直接写对象会导致所有组件实例共享同一个引用。一个实例修改了默认值，其他实例也会受影响。工厂函数每次调用都返回新对象，避免共享问题。

### 误区 4：动态组件切换时丢失状态

❌ **错误写法：**
```vue
<!-- 切换组件时，之前的组件状态会丢失 -->
<component :is="currentTab"></component>
```

✅ **正确写法：**
```vue
<!-- 用 keep-alive 包裹，缓存组件状态 -->
<keep-alive>
  <component :is="currentTab"></component>
</keep-alive>
```

**为什么错？** 默认情况下，动态组件切换时会销毁旧组件、创建新组件。如果旧组件有用户输入的数据或滚动位置，都会丢失。用 `keep-alive` 可以缓存组件状态。

### 误区 5：组件名和 HTML 元素冲突

❌ **错误写法：**
```javascript
Vue.component('div', { /* ... */ })
// ❌ 错误：组件名不能和 HTML 元素同名
Vue.component('MyComponent', { /* ... */ })
// ⚠️ 在 DOM 模板中，驼峰命名可能不工作
```

✅ **正确写法：**
```javascript
Vue.component('my-component', { /* ... */ })
// ✅ 正确：使用 kebab-case（短横线命名）
```

**为什么错？** HTML 标签名对大小写不敏感。在 DOM 模板中（非 `.vue` 文件），`MyComponent` 会被浏览器解析成 `mycomponent`，导致找不到组件。建议始终使用 kebab-case。

## 动手练习

### 练习 1：基础组件（基础）

**题目**：创建一个用户卡片组件 `UserCard`，接收 `name`（必填）、`age`（默认 18）、`avatar`（默认空字符串）三个 Props，显示用户信息。

<details>
<summary>点击查看答案</summary>

**子组件 UserCard.vue：**

```vue
<template>
  <div class="user-card">
    <!-- 用户头像 -->
    <img v-if="avatar" :src="avatar" :alt="name" width="80" />
    <!-- 如果有头像就显示，没有就不显示 -->
    <img v-else src="default-avatar.png" :alt="name" width="80" />
    <!-- 没有头像时显示默认图片 -->
    
    <!-- 用户名字 -->
    <h3>{{ name }}</h3>
    
    <!-- 用户年龄 -->
    <p>年龄：{{ age }} 岁</p>
  </div>
</template>

<script>
export default {
  name: 'UserCard',
  props: {
    name: {
      type: String,
      required: true
      // 名字是必填的
    },
    age: {
      type: Number,
      default: 18
      // 年龄默认 18 岁
    },
    avatar: {
      type: String,
      default: ''
      // 头像默认为空
    }
  }
}
</script>

<style scoped>
.user-card {
  border: 1px solid #ddd;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}
</style>
```

**父组件：**

```vue
<template>
  <div>
    <user-card name="张三" :age="25" avatar="zhangsan.jpg" />
    <!-- 传递所有 props -->
    <user-card name="李四" />
    <!-- 只传必填的 name，其他用默认值 -->
    <user-card name="王五" :age="30" />
    <!-- 传 name 和 age -->
  </div>
</template>

<script>
import UserCard from './UserCard.vue'

export default {
  components: {
    UserCard
  }
}
</script>
```

</details>

### 练习 2：父子组件通信（进阶）

**题目**：创建一个计数器子组件 `Counter`，包含增加和减少按钮。点击按钮时通过自定义事件通知父组件当前计数值，父组件显示所有子组件的计数总和。

<details>
<summary>点击查看答案</summary>

**子组件 Counter.vue：**

```vue
<template>
  <div class="counter">
    <!-- 减少按钮 -->
    <button @click="decrement">-</button>
    <!-- 显示当前计数值 -->
    <span>{{ count }}</span>
    <!-- 增加按钮 -->
    <button @click="increment">+</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      count: 0
      // 组件内部的计数
    }
  },
  methods: {
    increment() {
      this.count++
      // 计数加 1
      this.notifyParent()
      // 通知父组件
    },
    decrement() {
      this.count--
      // 计数减 1
      this.notifyParent()
      // 通知父组件
    },
    notifyParent() {
      // 触发自定义事件，把当前计数值传给父组件
      this.$emit('count-changed', this.count)
    }
  }
}
</script>
```

**父组件：**

```vue
<template>
  <div>
    <!-- 两个计数器组件 -->
    <counter @count-changed="updateTotal(0, $event)" />
    <counter @count-changed="updateTotal(1, $event)" />
    
    <!-- 显示总和 -->
    <p>计数总和：{{ total }}</p>
  </div>
</template>

<script>
import Counter from './Counter.vue'

export default {
  components: {
    Counter
  },
  data() {
    return {
      counts: [0, 0]
      // 存储每个计数器的值
    }
  },
  computed: {
    total() {
      // 计算总和
      return this.counts.reduce((sum, val) => sum + val, 0)
    }
  },
  methods: {
    updateTotal(index, value) {
      // 更新指定计数器的值
      // index：第几个计数器
      // value：新的计数值
      this.counts.splice(index, 1, value)
      // 用 splice 确保响应式更新
    }
  }
}
</script>
```

</details>

### 练习 3：动态组件 + keep-alive（挑战）

**题目**：实现一个 Tab 切换功能，包含"首页"、"消息"、"我的"三个 Tab。每个 Tab 有独立的内容，切换时用 `keep-alive` 缓存组件状态。

<details>
<summary>点击查看答案</summary>

**首页组件 HomeTab.vue：**

```vue
<template>
  <div>
    <h2>首页</h2>
    <p>欢迎来到首页！</p>
    <input v-model="searchText" placeholder="搜索..." />
    <!-- 输入内容会被 keep-alive 缓存 -->
    <p>你搜索了：{{ searchText }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      searchText: ''
      // 搜索文本，切换 Tab 后不会丢失
    }
  }
}
</script>
```

**消息组件 MessageTab.vue：**

```vue
<template>
  <div>
    <h2>消息</h2>
    <p>你有 3 条未读消息</p>
    <input v-model="replyText" placeholder="回复消息..." />
    <p>正在回复：{{ replyText }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      replyText: ''
      // 回复文本，切换 Tab 后不会丢失
    }
  }
}
</script>
```

**我的组件 ProfileTab.vue：**

```vue
<template>
  <div>
    <h2>我的</h2>
    <p>用户名：小明</p>
    <input v-model="signature" placeholder="编辑个性签名..." />
    <p>个性签名：{{ signature }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      signature: ''
      // 个性签名，切换 Tab 后不会丢失
    }
  }
}
</script>
```

**父组件（Tab 容器）：**

```vue
<template>
  <div>
    <!-- Tab 按钮 -->
    <div class="tab-bar">
      <button
        @click="activeTab = 'home-tab'"
        :class="{ active: activeTab === 'home-tab' }"
      >
        首页
      </button>
      <button
        @click="activeTab = 'message-tab'"
        :class="{ active: activeTab === 'message-tab' }"
      >
        消息
      </button>
      <button
        @click="activeTab = 'profile-tab'"
        :class="{ active: activeTab === 'profile-tab' }"
      >
        我的
      </button>
    </div>
    
    <!-- ✅ 动态组件 + keep-alive -->
    <keep-alive>
      <!-- 缓存所有切换的组件 -->
      <component :is="activeTab"></component>
    </keep-alive>
  </div>
</template>

<script>
import HomeTab from './HomeTab.vue'
import MessageTab from './MessageTab.vue'
import ProfileTab from './ProfileTab.vue'

export default {
  components: {
    HomeTab,
    MessageTab,
    ProfileTab
  },
  data() {
    return {
      activeTab: 'home-tab'
      // 当前激活的 Tab，默认首页
    }
  }
}
</script>

<style scoped>
.tab-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.tab-bar button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  cursor: pointer;
}
.tab-bar button.active {
  background: #42b983;
  color: white;
}
</style>
```

</details>

## 下一章预告

恭喜你完成了组件基础的学习！现在你已经掌握了 Vue 最核心的组件化开发能力，能够把页面拆分成独立的、可复用的组件了。

接下来，我们将深入学习**组件通信**。你会学习到更多高级的通信方式，比如 provide/inject 跨层级通信、事件总线、以及 Vuex 状态管理。这些知识会让你在处理复杂的组件关系时游刃有余。
