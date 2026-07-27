---
title: "第 3 章：计算属性与侦听器"
description: "掌握 Vue 2 中的 computed 计算属性和 watch 侦听器，实现高效的数据处理。"
---

# 第 3 章：计算属性与侦听器

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么需要计算属性？直接用方法不行吗？
- 计算属性和方法有什么区别？
- 什么时候用计算属性，什么时候用侦听器？
- 怎么侦听对象或数组的变化？

这一章就是为了解答这些问题。我们会学习 **计算属性（computed）** 和 **侦听器（watch）**，搞清楚它们的使用场景和区别。学完之后，你就能高效地处理数据变化了。

---

## 1 为什么需要计算属性和侦听器？

### 痛点分析

想象一下，你要做一个购物车页面：

**没有计算属性的方式**：
```vue
<template>
  <div>
    <!-- 每次渲染都会重新计算总价 -->
    <p>总价：¥{{ getTotalPrice() }}</p>
    
    <!-- 每次渲染都会重新计算数量 -->
    <p>数量：{{ getCartCount() }}</p>
    
    <!-- 每次渲染都会重新格式化 -->
    <p>折扣：{{ formatDiscount() }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [
        { id: 1, name: 'iPhone', price: 5999, quantity: 1 },
        { id: 2, name: 'AirPods', price: 1299, quantity: 2 }
      ]
    }
  },
  methods: {
    getTotalPrice() {
      console.log('计算总价')  // 每次渲染都会打印
      return this.items.reduce((sum, item) => 
        sum + item.price * item.quantity, 0
      )
    },
    getCartCount() {
      console.log('计算数量')  // 每次渲染都会打印
      return this.items.reduce((sum, item) => sum + item.quantity, 0)
    },
    formatDiscount() {
      console.log('格式化折扣')  // 每次渲染都会打印
      return (0.8 * 100).toFixed(0) + '%'
    }
  }
}
</script>
```

**问题**：
- 每次数据变化，所有方法都会重新执行
- 即使数据没变，也会重复计算
- 性能浪费严重

### Vue 的解决方案

**使用计算属性**：
```vue
<template>
  <div>
    <!-- 只有 items 变化时才重新计算 -->
    <p>总价：¥{{ totalPrice }}</p>
    
    <!-- 只有 items 变化时才重新计算 -->
    <p>数量：{{ cartCount }}</p>
    
    <!-- 有缓存，不会重复计算 -->
    <p>折扣：{{ discount }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [
        { id: 1, name: 'iPhone', price: 5999, quantity: 1 },
        { id: 2, name: 'AirPods', price: 1299, quantity: 2 }
      ]
    }
  },
  computed: {
    // 计算属性：有缓存，依赖不变则不重新计算
    totalPrice() {
      console.log('计算总价')  // 只有 items 变化时才打印
      return this.items.reduce((sum, item) => 
        sum + item.price * item.quantity, 0
      )
    },
    cartCount() {
      console.log('计算数量')  // 只有 items 变化时才打印
      return this.items.reduce((sum, item) => sum + item.quantity, 0)
    },
    discount() {
      console.log('格式化折扣')  // 只计算一次
      return (0.8 * 100).toFixed(0) + '%'
    }
  }
}
</script>
```

**优势**：
- ✅ 有缓存，性能更好
- ✅ 代码更简洁
- ✅ 依赖追踪，自动更新

> **一句话总结**：计算属性让你声明式地描述数据之间的关系，Vue 帮你处理缓存和更新。

---

## 2 核心原理讲解

### 概念解释

Vue 提供了三种处理数据的方式：

1. **计算属性（computed）**：基于响应式依赖进行缓存，依赖变化时才重新计算
2. **方法（methods）**：每次渲染都会调用，没有缓存
3. **侦听器（watch）**：侦听数据变化，执行副作用（如 API 调用）

打个比方：

> **计算属性** 像智能计算器：
> - 你输入公式：`总价 = 单价 × 数量`
> - 数据不变时，直接显示上次的结果
> - 数据变化时，自动重新计算

> **方法** 像普通计算器：
> - 每次都要重新输入公式
> - 没有记忆功能
> - 即使数据没变，也要重新计算

> **侦听器** 像监控摄像头：
> - 24小时监控某个数据
> - 数据一有变化，立即执行操作
> - 适合做异步操作（如 API 调用）

### 计算属性的缓存机制

计算属性基于响应式依赖进行缓存：
1. 首次访问时，执行计算函数
2. 将结果缓存起来
3. 只有当依赖的响应式数据变化时，才重新计算
4. 如果依赖没变，直接返回缓存值

### 侦听器的工作原理

侦听器侦听响应式数据的变化：
1. 当被侦听的数据变化时
2. 触发侦听器回调
3. 可以执行副作用（如 API 调用、操作其他数据）

---

## 3 基础用法 + 逐行注释

### 1. 计算属性基础

```vue
<template>
  <div>
    <!-- 使用计算属性：像访问 data 一样访问 -->
    <p>姓名：{{ fullName }}</p>
    <p>反转消息：{{ reversedMessage }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      firstName: '张',      // 姓
      lastName: '三',       // 名
      message: 'Hello'      // 消息
    }
  },
  computed: {
    // 计算属性：依赖 firstName 和 lastName
    fullName() {
      // 当 firstName 或 lastName 变化时，自动重新计算
      return this.firstName + ' ' + this.lastName
    },
    // 计算属性：依赖 message
    reversedMessage() {
      // 当 message 变化时，自动重新计算
      return this.message.split('').reverse().join('')
    }
  }
}
</script>
```

### 2. 计算属性 vs 方法

```vue
<template>
  <div>
    <!-- ✅ 计算属性：有缓存，依赖不变则不重新计算 -->
    <p>{{ reversedMessage }}</p>
    
    <!-- ❌ 方法：每次渲染都会调用 -->
    <p>{{ reverseMessage() }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello'
    }
  },
  computed: {
    // ✅ 推荐：计算属性
    reversedMessage() {
      console.log('计算属性执行')  // 只有 message 变化时才执行
      return this.message.split('').reverse().join('')
    }
  },
  methods: {
    // ❌ 不推荐：方法（对于纯数据转换）
    reverseMessage() {
      console.log('方法执行')  // 每次渲染都会执行
      return this.message.split('').reverse().join('')
    }
  }
}
</script>
```

::: tip
💡 提示：计算属性基于响应式依赖进行缓存，只有在依赖变化时才重新计算。如果不需要缓存，使用方法即可。
:::

### 3. 计算属性的 setter

```vue
<template>
  <div>
    <!-- 使用 v-model 绑定计算属性 -->
    <input v-model="fullName" />
    <p>姓：{{ firstName }}，名：{{ lastName }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      firstName: '张',
      lastName: '三'
    }
  },
  computed: {
    fullName: {
      // getter：读取时调用
      get() {
        return this.firstName + ' ' + this.lastName
      },
      // setter：赋值时调用
      set(newValue) {
        // 当 fullName 被赋值时，拆分到 firstName 和 lastName
        const names = newValue.split(' ')
        this.firstName = names[0]
        this.lastName = names[names.length - 1] || ''
      }
    }
  }
}
</script>
```

### 4. 侦听器基础

```vue
<template>
  <div>
    <input v-model="question" placeholder="输入问题" />
    <p>{{ answer }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      question: '',              // 用户输入的问题
      answer: '等待输入...'      // 答案
    }
  },
  watch: {
    // 侦听 question 变化
    question(newQuestion, oldQuestion) {
      // 当 question 变化时，执行这个函数
      if (newQuestion.indexOf('?') >= 0) {
        this.getAnswer()
      }
    }
  },
  methods: {
    getAnswer() {
      this.answer = '思考中...'
      // 模拟 API 调用
      setTimeout(() => {
        this.answer = '这是答案'
      }, 1000)
    }
  }
}
</script>
```

### 5. 深度侦听

```vue
<template>
  <div>
    <button @click="user.name = '李四'">修改名字</button>
    <button @click="user.age++">修改年龄</button>
    <p>{{ user }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: {
        name: '张三',
        age: 25
      }
    }
  },
  watch: {
    // ✅ 深度侦听对象变化
    user: {
      handler(newVal, oldVal) {
        // 当 user 或其子属性变化时，执行这个函数
        console.log('用户变化：', newVal)
      },
      deep: true,      // 开启深度侦听，侦听对象内部属性
      immediate: true  // 立即执行（初始化时也执行一次）
    }
  }
}
</script>
```

::: warning
⚠️ 注意：深度侦听会影响性能，因为需要遍历对象的所有子属性。只在必要时使用。
:::

### 6. 侦听特定属性

```vue
<template>
  <div>
    <input v-model="user.name" />
    <input v-model="user.age" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: {
        name: '张三',
        age: 25
      }
    }
  },
  watch: {
    // ✅ 推荐：只侦听特定属性
    'user.name'(newVal, oldVal) {
      // 只有 user.name 变化时才执行
      console.log(`名字变化：${oldVal} -> ${newVal}`)
    },
    'user.age'(newVal, oldVal) {
      // 只有 user.age 变化时才执行
      console.log(`年龄变化：${oldVal} -> ${newVal}`)
    }
  }
}
</script>
```

### 7. 计算属性 vs 侦听器

```vue
<template>
  <div>
    <input v-model="firstName" />
    <input v-model="lastName" />
    
    <!-- ✅ 方式一：计算属性（推荐） -->
    <p>全名：{{ fullName }}</p>
    
    <!-- 方式二：侦听器（不推荐） -->
    <p>全名：{{ fullName2 }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      firstName: '张',
      lastName: '三',
      fullName2: '张三'
    }
  },
  computed: {
    // ✅ 推荐：简洁、有缓存
    fullName() {
      return this.firstName + ' ' + this.lastName
    }
  },
  watch: {
    // ❌ 不推荐：代码冗长，需要手动维护
    firstName(newVal) {
      this.fullName2 = newVal + ' ' + this.lastName
    },
    lastName(newVal) {
      this.fullName2 = this.firstName + ' ' + newVal
    }
  }
}
</script>
```

### 8. 侦听器选项

```javascript
export default {
  data() {
    return {
      question: '',
      items: []
    }
  },
  watch: {
    // 完整配置
    question: {
      handler(newVal, oldVal) {
        // 处理逻辑
        console.log('问题变化：', newVal)
      },
      deep: true,        // 深度侦听（侦听对象内部属性）
      immediate: true,   // 立即执行（初始化时也执行）
    },
    // 数组侦听
    items: {
      handler(newVal, oldVal) {
        console.log('数组变化')
      },
      deep: true  // 数组内部元素变化也能侦听
    }
  }
}
```

---

## 4 对比表格

### computed vs methods vs watch 对比

| 特性 | computed | methods | watch |
| --- | --- | --- | --- |
| 缓存 | ✅ 有缓存 | ❌ 无缓存 | ❌ 无缓存 |
| 执行时机 | 依赖变化时 | 每次渲染/调用时 | 数据变化时 |
| 用途 | 同步数据转换 | 事件处理、业务逻辑 | 异步操作、副作用 |
| 返回值 | ✅ 必须返回 | ✅ 可以返回 | ❌ 不返回 |
| 依赖追踪 | ✅ 自动 | ❌ 手动 | ❌ 手动 |
| 性能 | ⭐⭐⭐ 最优 | ⭐ 较差 | ⭐⭐ 一般 |

### 选择建议

| 场景 | 推荐方案 | 原因 |
| --- | --- | --- |
| 数据转换（如格式化、计算） | computed | 有缓存，性能最好 |
| 事件处理（如点击、输入） | methods | 需要手动调用 |
| 异步操作（如 API 调用） | watch | 需要执行副作用 |
| 侦听路由变化 | watch | 需要执行副作用 |
| 复杂的数据依赖 | computed | 自动追踪依赖 |
| 需要在初始化时执行 | watch + immediate | 可以设置立即执行 |

### 侦听器选项对比

| 选项 | 用途 | 默认值 | 示例 |
| --- | --- | --- | --- |
| handler | 回调函数 | 必填 | `handler(newVal, oldVal) {}` |
| deep | 深度侦听 | false | `deep: true` |
| immediate | 立即执行 | false | `immediate: true` |

---

## 5 新手常见误区

### 误区 1："计算属性可以修改依赖的数据"

**错！** 计算属性应该是纯函数，不能修改依赖的数据：

```javascript
// ❌ 错误：在计算属性中修改依赖
computed: {
  fullName() {
    this.firstName = '李'  // ❌ 不要这样做
    return this.firstName + ' ' + this.lastName
  }
}

// ✅ 正确：使用 setter
computed: {
  fullName: {
    get() {
      return this.firstName + ' ' + this.lastName
    },
    set(newValue) {
      const names = newValue.split(' ')
      this.firstName = names[0]
      this.lastName = names[1]
    }
  }
}
```

### 误区 2："所有数据处理都应该用 methods"

**错！** 对于纯数据转换，应该用 computed：

```vue
<!-- ❌ 不推荐：每次渲染都会调用 -->
<p>{{ formatPrice(price) }}</p>

<!-- ✅ 推荐：有缓存，性能更好 -->
<p>{{ formattedPrice }}</p>

<script>
export default {
  computed: {
    formattedPrice() {
      return '¥' + this.price.toFixed(2)
    }
  }
}
</script>
```

### 误区 3："watch 可以侦听所有数据变化"

**不完全对！** 默认情况下，watch 不能侦听对象内部属性的变化：

```javascript
// ❌ 错误：无法侦听 user.name 的变化
watch: {
  user(newVal) {
    console.log('用户变化')  // user.name 变化时不会触发
  }
}

// ✅ 正确：开启深度侦听
watch: {
  user: {
    handler(newVal) {
      console.log('用户变化')  // user.name 变化时也会触发
    },
    deep: true
  }
}

// ✅ 更好：只侦听特定属性
watch: {
  'user.name'(newVal) {
    console.log('名字变化')
  }
}
```

### 误区 4："computed 和 watch 可以互相替代"

**不推荐！** 它们有不同的使用场景：

```javascript
// ❌ 不推荐：用 watch 实现计算属性
watch: {
  firstName() {
    this.fullName = this.firstName + ' ' + this.lastName
  },
  lastName() {
    this.fullName = this.firstName + ' ' + this.lastName
  }
}

// ✅ 推荐：用 computed
computed: {
  fullName() {
    return this.firstName + ' ' + this.lastName
  }
}
```

### 误区 5："深度侦听不会影响性能"

**错！** 深度侦听会遍历对象的所有子属性，影响性能：

```javascript
// ❌ 不推荐：对整个大对象深度侦听
watch: {
  bigObject: {
    handler() {},
    deep: true  // 会遍历所有子属性，性能差
  }
}

// ✅ 推荐：只侦听需要的属性
watch: {
  'bigObject.importantProp'() {
    // 只侦听重要属性
  }
}
```

---

## 6 动手练习

### 练习 1：基础练习 - 购物车计算

创建一个购物车页面：
- 定义商品列表（包含名称、价格、数量）
- 使用计算属性计算总价
- 使用计算属性计算总数量
- 使用计算属性计算折扣价（8折）

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div class="cart">
    <h2>购物车</h2>
    
    <!-- 商品列表 -->
    <ul class="items">
      <li v-for="item in items" :key="item.id" class="item">
        <span>{{ item.name }}</span>
        <span>¥{{ item.price }} × {{ item.quantity }}</span>
        <span>小计：¥{{ item.price * item.quantity }}</span>
      </li>
    </ul>
    
    <!-- 统计信息 -->
    <div class="summary">
      <p>总数量：{{ totalCount }} 件</p>
      <p>总价：¥{{ totalPrice }}</p>
      <p>折扣价（8折）：¥{{ discountPrice }}</p>
    </div>
    
    <!-- 操作按钮 -->
    <div class="actions">
      <button @click="addItem">添加商品</button>
      <button @click="clearCart">清空购物车</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [
        { id: 1, name: 'iPhone', price: 5999, quantity: 1 },
        { id: 2, name: 'AirPods', price: 1299, quantity: 2 },
        { id: 3, name: 'iPad', price: 3999, quantity: 1 }
      ]
    }
  },
  computed: {
    // 计算总数量
    totalCount() {
      return this.items.reduce((sum, item) => sum + item.quantity, 0)
    },
    // 计算总价
    totalPrice() {
      return this.items.reduce((sum, item) => 
        sum + item.price * item.quantity, 0
      )
    },
    // 计算折扣价
    discountPrice() {
      return (this.totalPrice * 0.8).toFixed(2)
    }
  },
  methods: {
    addItem() {
      const id = Date.now()
      this.items.push({
        id,
        name: '新商品',
        price: 99,
        quantity: 1
      })
    },
    clearCart() {
      this.items = []
    }
  }
}
</script>

<style scoped>
.cart {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.items {
  list-style: none;
  padding: 0;
}

.item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border: 1px solid #ddd;
  margin-bottom: 10px;
  border-radius: 4px;
}

.summary {
  margin: 20px 0;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
}

.summary p {
  margin: 5px 0;
  font-size: 16px;
}

.actions {
  display: flex;
  gap: 10px;
}

.actions button {
  flex: 1;
  padding: 10px;
  cursor: pointer;
}
</style>
```

</details>

### 练习 2：进阶练习 - 搜索建议

创建一个搜索建议功能：
- 输入框输入关键词
- 使用侦听器监听输入变化
- 模拟 API 调用（使用 setTimeout）
- 显示搜索建议列表
- 支持防抖（输入停止 500ms 后才调用）

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div class="search">
    <h2>搜索</h2>
    
    <!-- 搜索输入框 -->
    <input 
      v-model="keyword" 
      placeholder="输入关键词"
      class="search-input"
    />
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      搜索中...
    </div>
    
    <!-- 搜索建议列表 -->
    <ul v-else-if="suggestions.length > 0" class="suggestions">
      <li 
        v-for="(suggestion, index) in suggestions" 
        :key="index"
        @click="selectSuggestion(suggestion)"
      >
        {{ suggestion }}
      </li>
    </ul>
    
    <!-- 无结果 -->
    <div v-else-if="keyword && !loading" class="no-result">
      无搜索结果
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      keyword: '',
      suggestions: [],
      loading: false,
      timer: null  // 防抖定时器
    }
  },
  watch: {
    // 侦听关键词变化
    keyword(newKeyword) {
      // 清空之前的定时器
      if (this.timer) {
        clearTimeout(this.timer)
      }
      
      // 如果关键词为空，清空建议
      if (!newKeyword.trim()) {
        this.suggestions = []
        return
      }
      
      // 设置防抖：500ms 后才执行
      this.timer = setTimeout(() => {
        this.fetchSuggestions(newKeyword)
      }, 500)
    }
  },
  methods: {
    // 模拟 API 调用
    fetchSuggestions(keyword) {
      this.loading = true
      
      // 模拟网络延迟
      setTimeout(() => {
        // 模拟搜索结果
        const allSuggestions = [
          'Vue 教程',
          'Vue 3',
          'Vue 2',
          'Vue Router',
          'Vuex',
          'React 教程',
          'Angular 教程'
        ]
        
        // 过滤匹配的建议
        this.suggestions = allSuggestions.filter(s => 
          s.toLowerCase().includes(keyword.toLowerCase())
        )
        
        this.loading = false
      }, 300)
    },
    // 选择建议
    selectSuggestion(suggestion) {
      this.keyword = suggestion
      this.suggestions = []
      alert('选择了：' + suggestion)
    }
  }
}
</script>

<style scoped>
.search {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.search-input {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.loading {
  padding: 10px;
  color: #999;
}

.suggestions {
  list-style: none;
  padding: 0;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.suggestions li {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.suggestions li:last-child {
  border-bottom: none;
}

.suggestions li:hover {
  background: #f5f5f5;
}

.no-result {
  padding: 10px;
  color: #999;
}
</style>
```

</details>

### 练习 3（挑战）：综合练习 - 用户信息表单

创建一个用户信息表单：
- 定义用户数据（姓名、邮箱、年龄、密码）
- 使用计算属性验证表单（姓名不为空、邮箱格式正确、年龄大于 18）
- 使用侦听器监听密码变化，实时显示密码强度
- 使用计算属性判断表单是否可以提交
- 提交时显示成功提示

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div class="form">
    <h2>用户注册</h2>
    
    <!-- 姓名 -->
    <div class="form-item">
      <label>姓名：</label>
      <input v-model="user.name" placeholder="请输入姓名" />
      <span v-if="!isNameValid" class="error">姓名不能为空</span>
    </div>
    
    <!-- 邮箱 -->
    <div class="form-item">
      <label>邮箱：</label>
      <input v-model="user.email" type="email" placeholder="请输入邮箱" />
      <span v-if="!isEmailValid" class="error">邮箱格式不正确</span>
    </div>
    
    <!-- 年龄 -->
    <div class="form-item">
      <label>年龄：</label>
      <input v-model.number="user.age" type="number" placeholder="请输入年龄" />
      <span v-if="!isAgeValid" class="error">年龄必须大于 18 岁</span>
    </div>
    
    <!-- 密码 -->
    <div class="form-item">
      <label>密码：</label>
      <input v-model="user.password" type="password" placeholder="请输入密码" />
      <div v-if="user.password" class="password-strength">
        密码强度：
        <span :class="passwordStrengthClass">{{ passwordStrength }}</span>
      </div>
    </div>
    
    <!-- 提交按钮 -->
    <button 
      @click="submitForm" 
      :disabled="!isFormValid"
      class="submit-btn"
    >
      注册
    </button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: {
        name: '',
        email: '',
        age: 18,
        password: ''
      }
    }
  },
  computed: {
    // 验证姓名
    isNameValid() {
      return this.user.name.trim().length > 0
    },
    // 验证邮箱
    isEmailValid() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(this.user.email)
    },
    // 验证年龄
    isAgeValid() {
      return this.user.age > 18
    },
    // 密码强度
    passwordStrength() {
      const pwd = this.user.password
      if (pwd.length < 6) return '弱'
      if (pwd.length < 10) return '中'
      return '强'
    },
    // 密码强度样式类
    passwordStrengthClass() {
      const strength = this.passwordStrength
      if (strength === '弱') return 'strength-weak'
      if (strength === '中') return 'strength-medium'
      return 'strength-strong'
    },
    // 表单是否可以提交
    isFormValid() {
      return this.isNameValid && 
             this.isEmailValid && 
             this.isAgeValid && 
             this.user.password.length >= 6
    }
  },
  methods: {
    submitForm() {
      if (this.isFormValid) {
        alert('注册成功！')
        console.log('用户信息：', this.user)
      }
    }
  }
}
</script>

<style scoped>
.form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-item input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.error {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
  display: block;
}

.password-strength {
  margin-top: 5px;
  font-size: 14px;
}

.strength-weak {
  color: #e74c3c;
}

.strength-medium {
  color: #f39c12;
}

.strength-strong {
  color: #27ae60;
}

.submit-btn {
  width: 100%;
  padding: 10px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.submit-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.submit-btn:hover:not(:disabled) {
  background: #2980b9;
}
</style>
```

</details>

---

## 下一章预告

下一章我们会学习 **条件渲染与列表渲染**——Vue 中控制元素显示和列表循环的核心指令。你会学到：
- v-if 和 v-show 的区别和使用场景
- v-for 的用法和 key 的重要性
- 数组和对象的更新检测
- 显示过滤/排序后的列表
