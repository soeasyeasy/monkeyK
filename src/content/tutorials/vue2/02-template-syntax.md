---
title: "第 2 章：模板语法"
description: "学习 Vue 2 的模板语法，包括插值、指令和过滤器。"
---

# 第 2 章：模板语法

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Vue 是怎么把数据显示到页面上的？
- 怎么给 HTML 标签绑定动态属性？
- 怎么监听用户点击、输入这些操作？
- 怎么实现表单数据的双向同步？

这一章就是为了解答这些问题。我们会学习 **Vue 的模板语法**，包括插值、各种指令（v-bind、v-on、v-model、v-if、v-show、v-for）和过滤器。学完之后，你就能把数据灵活地展示在页面上了。

---

## 2.1 为什么需要模板语法？

### 痛点分析

想象一下，你要做一个商品展示页面：

**传统方式（原生 JavaScript）**：
```javascript
// 1. 获取数据
const product = { name: 'iPhone', price: 5999, image: 'iphone.jpg' }

// 2. 手动创建 DOM 元素
const img = document.createElement('img')
img.src = product.image
img.alt = product.name

const title = document.createElement('h2')
title.textContent = product.name

const price = document.createElement('p')
price.textContent = '价格：¥' + product.price

// 3. 手动插入到页面
const container = document.getElementById('app')
container.appendChild(img)
container.appendChild(title)
container.appendChild(price)

// 4. 如果数据变了，还要手动更新 DOM
product.price = 4999
price.textContent = '价格：¥' + product.price  // 又要写一遍
```

**问题**：
- 代码冗长，操作 DOM 很麻烦
- 数据和视图分离，容易不同步
- 维护成本高，改一处要改多处

### Vue 的解决方案

**Vue 方式**：
```vue
<template>
  <div>
    <!-- 数据直接写在模板里 -->
    <img :src="product.image" :alt="product.name" />
    <h2>{{ product.name }}</h2>
    <p>价格：¥{{ product.price }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      product: {
        name: 'iPhone',
        price: 5999,
        image: 'iphone.jpg'
      }
    }
  }
}
</script>
```

**优势**：
- ✅ 代码简洁，只关心数据
- ✅ 数据变化，视图自动更新
- ✅ 声明式语法，一目了然

> **一句话总结**：模板语法让你用"声明式"的方式写 HTML，你只需要告诉 Vue"我要什么"，不用关心"怎么做"。

---

## 2.2 核心原理讲解

### 概念解释

Vue 的模板语法基于两个核心概念：

1. **插值（Interpolation）**：把数据插入到 HTML 中
2. **指令（Directives）**：带有 `v-` 前缀的特殊属性，告诉 Vue 如何处理 DOM

打个比方：

> **插值** 像填空题：
> - 模板是题目：`<p>{{  }}</p>`
> - 数据是答案：`message: 'Hello'`
> - Vue 帮你把答案填到题目里

> **指令** 像给 HTML 贴标签：
> - `v-bind:src="url"` 告诉 Vue："这个 src 属性要用 url 变量的值"
> - `v-on:click="handle"` 告诉 Vue："点击时执行 handle 方法"
> - `v-model="text"` 告诉 Vue："这个输入框和 text 变量双向绑定"

### 插值的底层原理

Vue 使用 `{{ }}` 作为文本插值的占位符。编译时，Vue 会：
1. 解析模板中的 `{{ }}`
2. 创建渲染函数
3. 当数据变化时，自动重新渲染

### 指令的底层原理

指令是 Vue 自定义的特殊属性。当 Vue 编译模板时：
1. 识别 `v-` 前缀的属性
2. 根据指令类型执行对应操作
3. 建立数据与 DOM 的响应式联系

---

## 2.3 基础用法 + 逐行注释

### 1. 文本插值

```vue
<template>
  <div>
    <!-- 基础插值：显示 message 变量的值 -->
    <p>{{ message }}</p>
    
    <!-- 支持 JavaScript 表达式 -->
    <p>{{ count + 1 }}</p>                    <!-- 数学运算 -->
    <p>{{ ok ? '是' : '否' }}</p>             <!-- 三元表达式 -->
    <p>{{ message.split('').reverse().join('') }}</p>  <!-- 字符串操作 -->
    
    <!-- ❌ 错误：不能使用语句 -->
    <!-- <p>{{ if (ok) { return 'yes' } }}</p> -->
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello Vue 2!',  // 消息文本
      count: 0,                 // 计数器
      ok: true                  // 布尔值
    }
  }
}
</script>
```

### 2. 原始 HTML 插值

```vue
<template>
  <div>
    <!-- 使用 v-html 渲染 HTML 字符串 -->
    <p v-html="rawHtml"></p>
    
    <!-- ❌ 错误：不能用 {{ }} 渲染 HTML -->
    <!-- <p>{{ rawHtml }}</p> -->  <!-- 会显示原始文本 -->
  </div>
</template>

<script>
export default {
  data() {
    return {
      rawHtml: '<strong style="color: red;">加粗红色文本</strong>'
    }
  }
}
</script>
```

::: warning
⚠️ 安全警告：动态渲染 HTML 可能导致 XSS 攻击，只对可信内容使用 v-html，永远不要用于用户输入。
:::

### 3. 属性绑定（v-bind）

```vue
<template>
  <div>
    <!-- 完整语法：v-bind:属性名="变量名" -->
    <img v-bind:src="imageUrl" />
    
    <!-- ✅ 推荐：缩写形式，用冒号代替 v-bind: -->
    <img :src="imageUrl" />
    
    <!-- 动态属性名：属性名也可以是变量 -->
    <button :[attributeName]="value">按钮</button>
    
    <!-- 布尔属性：disabled、checked 等 -->
    <button :disabled="isDisabled">按钮</button>
    
    <!-- ✅ 对象语法：动态绑定 class -->
    <div :class="{ active: isActive, 'text-danger': hasError }"></div>
    
    <!-- ✅ 数组语法：动态绑定 class -->
    <div :class="[baseClass, isActive ? activeClass : '']"></div>
    
    <!-- ✅ 样式绑定：动态设置 style -->
    <div :style="{ color: activeColor, fontSize: fontSize + 'px' }"></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      imageUrl: 'https://example.com/image.jpg',  // 图片地址
      attributeName: 'title',                      // 动态属性名
      value: '提示文本',                           // 属性值
      isDisabled: false,                           // 是否禁用
      isActive: true,                              // 是否激活
      hasError: false,                             // 是否有错误
      baseClass: 'container',                      // 基础类名
      activeClass: 'active',                       // 激活类名
      activeColor: 'red',                          // 文字颜色
      fontSize: 16                                 // 字体大小
    }
  }
}
</script>
```

### 4. 事件绑定（v-on）

```vue
<template>
  <div>
    <!-- 完整语法：v-on:事件名="方法名" -->
    <button v-on:click="handleClick">点击</button>
    
    <!-- ✅ 推荐：缩写形式，用 @ 代替 v-on: -->
    <button @click="handleClick">点击（缩写）</button>
    
    <!-- 传递参数 -->
    <button @click="greet('张三')">打招呼</button>
    
    <!-- 事件修饰符：阻止默认行为 -->
    <form @submit.prevent="onSubmit">
      <button type="submit">提交</button>
    </form>
    
    <!-- 事件修饰符：只触发一次 -->
    <button @click.once="onlyOnce">只触发一次</button>
    
    <!-- 按键修饰符：按回车键触发 -->
    <input @keyup.enter="submit" />
    
    <!-- 按键修饰符：按 Esc 键触发 -->
    <input @keyup.esc="cancel" />
  </div>
</template>

<script>
export default {
  methods: {
    handleClick() {
      alert('按钮被点击')
    },
    greet(name) {
      alert('你好，' + name)
    },
    onSubmit() {
      console.log('表单提交')
    },
    onlyOnce() {
      alert('只会弹出一次')
    },
    submit() {
      console.log('回车提交')
    },
    cancel() {
      console.log('Esc 取消')
    }
  }
}
</script>
```

### 5. 双向绑定（v-model）

```vue
<template>
  <div>
    <!-- 文本输入框 -->
    <input v-model="inputValue" placeholder="请输入" />
    <p>输入的内容：{{ inputValue }}</p>
    
    <!-- 多行文本 -->
    <textarea v-model="message"></textarea>
    <p>消息：{{ message }}</p>
    
    <!-- 复选框（单个） -->
    <input type="checkbox" v-model="checked" />
    <p>是否选中：{{ checked }}</p>
    
    <!-- 复选框（多个） -->
    <input type="checkbox" v-model="hobbies" value="阅读" /> 阅读
    <input type="checkbox" v-model="hobbies" value="游泳" /> 游泳
    <input type="checkbox" v-model="hobbies" value="编程" /> 编程
    <p>爱好：{{ hobbies }}</p>
    
    <!-- 单选框 -->
    <input type="radio" v-model="gender" value="男" /> 男
    <input type="radio" v-model="gender" value="女" /> 女
    <p>性别：{{ gender }}</p>
    
    <!-- 下拉选择 -->
    <select v-model="selected">
      <option disabled value="">请选择</option>
      <option>北京</option>
      <option>上海</option>
      <option>广州</option>
    </select>
    <p>选择的城市：{{ selected }}</p>
    
    <!-- 修饰符：去除首尾空格 -->
    <input v-model.trim="trimmedText" />
    
    <!-- 修饰符：自动转换为数字 -->
    <input type="number" v-model.number="age" />
    
    <!-- 修饰符：失去焦点时才更新 -->
    <input v-model.lazy="lazyText" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      inputValue: '',          // 输入框内容
      message: '',             // 多行文本
      checked: false,          // 单个复选框
      hobbies: [],             // 多个复选框（数组）
      gender: '男',            // 单选框
      selected: '',            // 下拉选择
      trimmedText: '',         // 去空格文本
      age: 18,                 // 数字
      lazyText: ''             // 延迟更新文本
    }
  }
}
</script>
```

### 6. 条件渲染（v-if、v-show）

```vue
<template>
  <div>
    <!-- v-if：根据条件渲染或移除元素 -->
    <p v-if="type === 'A'">优秀</p>
    <p v-else-if="type === 'B'">良好</p>
    <p v-else-if="type === 'C'">一般</p>
    <p v-else>不及格</p>
    
    <!-- v-show：根据条件显示/隐藏元素（CSS display） -->
    <p v-show="isVisible">这段文字会切换显示</p>
    
    <!-- ❌ 错误：v-show 不支持 template -->
    <!-- <template v-show="isVisible">...</template> -->
    
    <!-- ❌ 错误：v-show 不支持 v-else -->
    <!-- <p v-show="ok">显示</p> -->
    <!-- <p v-show="!ok">隐藏</p> -->
  </div>
</template>

<script>
export default {
  data() {
    return {
      type: 'B',        // 等级
      isVisible: true,  // 是否可见
      ok: true          // 布尔值
    }
  }
}
</script>
```

### 7. 列表渲染（v-for）

```vue
<template>
  <div>
    <!-- 遍历数组：(item, index) in array -->
    <ul>
      <li v-for="(item, index) in items" :key="item.id">
        {{ index + 1 }} - {{ item.name }}
      </li>
    </ul>
    
    <!-- 遍历对象：(value, key, index) in object -->
    <div v-for="(value, key, index) in userInfo" :key="key">
      {{ index }}: {{ key }} = {{ value }}
    </div>
    
    <!-- 遍历数字范围 -->
    <span v-for="n in 10" :key="n">{{ n }} </span>
    
    <!-- ✅ 推荐：使用计算属性过滤列表 -->
    <ul>
      <li v-for="user in activeUsers" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
    
    <!-- ❌ 不推荐：v-for 和 v-if 同时使用 -->
    <!-- <li v-for="user in users" v-if="user.active" :key="user.id"> -->
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [
        { id: 1, name: '项目一' },
        { id: 2, name: '项目二' },
        { id: 3, name: '项目三' }
      ],
      userInfo: {
        name: '张三',
        age: 25,
        city: '北京'
      },
      users: [
        { id: 1, name: '张三', active: true },
        { id: 2, name: '李四', active: false },
        { id: 3, name: '王五', active: true }
      ]
    }
  },
  computed: {
    activeUsers() {
      return this.users.filter(user => user.active)
    }
  }
}
</script>
```

### 8. 过滤器

```vue
<template>
  <div>
    <!-- 使用过滤器：变量 | 过滤器名 -->
    <p>{{ price | currency }}</p>                    <!-- 显示：¥99.50 -->
    <p>{{ message | capitalize }}</p>                <!-- 显示：Hello world -->
    <p>{{ timestamp | formatDate('YYYY-MM-DD') }}</p>  <!-- 显示：2024-01-01 -->
    
    <!-- 链式调用多个过滤器 -->
    <p>{{ message | capitalize | uppercase }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      price: 99.5,
      message: 'hello world',
      timestamp: new Date()
    }
  },
  filters: {
    // 局部过滤器：格式化货币
    currency(value) {
      return '¥' + value.toFixed(2)
    },
    // 局部过滤器：首字母大写
    capitalize(value) {
      if (!value) return ''
      return value.charAt(0).toUpperCase() + value.slice(1)
    },
    // 局部过滤器：日期格式化
    formatDate(value, format) {
      const date = new Date(value)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    // 局部过滤器：转大写
    uppercase(value) {
      return value.toUpperCase()
    }
  }
}
</script>
```

#### 全局过滤器

```javascript
// main.js
import Vue from 'vue'

// 注册全局过滤器
Vue.filter('currency', function (value) {
  return '¥' + value.toFixed(2)
})

Vue.filter('capitalize', function (value) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
})
```

### 9. 其他指令

```vue
<template>
  <div>
    <!-- v-text：更新文本内容（等同于 {{ }}） -->
    <p v-text="message"></p>
    
    <!-- v-once：只渲染一次，后续不再更新 -->
    <p v-once>{{ staticContent }}</p>
    
    <!-- v-pre：跳过编译，显示原始 {{ }} -->
    <p v-pre>{{ 这里不会编译 }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello',
      staticContent: '静态内容'
    }
  }
}
</script>
```

---

## 2.4 对比表格

### 常用指令对比

| 指令 | 用途 | 缩写 | 示例 | 说明 |
| --- | --- | --- | --- | --- |
| v-bind | 绑定属性 | : | `:src="url"` | 动态设置 HTML 属性 |
| v-on | 绑定事件 | @ | `@click="handle"` | 监听 DOM 事件 |
| v-model | 双向绑定 | 无 | `v-model="text"` | 表单输入与应用状态同步 |
| v-if | 条件渲染 | 无 | `v-if="show"` | 根据条件添加/移除元素 |
| v-show | 显示/隐藏 | 无 | `v-show="visible"` | 通过 CSS display 控制 |
| v-for | 列表渲染 | 无 | `v-for="item in items"` | 遍历数组或对象 |
| v-html | 渲染 HTML | 无 | `v-html="html"` | 插入原始 HTML |
| v-text | 更新文本 | 无 | `v-text="msg"` | 等同于 `{{ msg }}` |
| v-once | 只渲染一次 | 无 | `v-once` | 后续不再更新 |
| v-pre | 跳过编译 | 无 | `v-pre` | 显示原始 {{ }} |

### v-if vs v-show 对比

| 特性 | v-if | v-show |
| --- | --- | --- |
| 渲染方式 | 真正的条件渲染，不满足条件时不渲染 | 总是渲染，通过 CSS display 控制 |
| 切换开销 | 高（需要添加/移除 DOM） | 低（只切换 CSS） |
| 初始渲染开销 | 低（不渲染不满足条件的） | 高（所有元素都会渲染） |
| 支持 template | ✅ 支持 | ❌ 不支持 |
| 支持 v-else | ✅ 支持 | ❌ 不支持 |
| 使用场景 | 条件很少改变 | 频繁切换显示/隐藏 |

### 事件修饰符对比

| 修饰符 | 用途 | 示例 |
| --- | --- | --- |
| .stop | 阻止事件冒泡 | `@click.stop="handle"` |
| .prevent | 阻止默认行为 | `@submit.prevent="handle"` |
| .capture | 使用事件捕获模式 | `@click.capture="handle"` |
| .self | 只当事件从元素本身触发 | `@click.self="handle"` |
| .once | 只触发一次 | `@click.once="handle"` |
| .passive |  passive 事件监听 | `@scroll.passive="handle"` |

---

## 2.5 新手常见误区

### 误区 1："{{ }} 里可以写任何 JavaScript 代码"

**错！** `{{ }}` 里只能写表达式，不能写语句：

```vue
<!-- ✅ 正确：表达式 -->
<p>{{ count + 1 }}</p>
<p>{{ ok ? '是' : '否' }}</p>

<!-- ❌ 错误：语句 -->
<!-- <p>{{ if (ok) { return 'yes' } }}</p> -->
<!-- <p>{{ var a = 1 }}</p> -->
```

### 误区 2："v-bind 和 v-on 的缩写可以混用"

**不推荐！** 保持代码风格一致：

```vue
<!-- ✅ 推荐：统一使用缩写 -->
<img :src="url" @click="handle" />

<!-- ✅ 推荐：统一使用完整语法 -->
<img v-bind:src="url" v-on:click="handle" />

<!-- ❌ 不推荐：混用 -->
<img :src="url" v-on:click="handle" />
```

### 误区 3："v-for 可以不用 key"

**错！** v-for 必须提供唯一的 key：

```vue
<!-- ✅ 正确：使用唯一 id -->
<li v-for="user in users" :key="user.id">

<!-- ❌ 错误：没有 key -->
<!-- <li v-for="user in users"> -->

<!-- ❌ 不推荐：使用 index 作为 key -->
<!-- <li v-for="(user, index) in users" :key="index"> -->
```

### 误区 4："v-if 和 v-for 可以同时使用"

**不推荐！** v-for 优先级高于 v-if，会导致性能问题：

```vue
<!-- ❌ 不推荐：每次渲染都会遍历所有用户 -->
<li v-for="user in users" v-if="user.active" :key="user.id">

<!-- ✅ 推荐：使用计算属性过滤 -->
<li v-for="user in activeUsers" :key="user.id">

<script>
computed: {
  activeUsers() {
    return this.users.filter(user => user.active)
  }
}
</script>
```

### 误区 5："v-html 可以用于用户输入"

**绝对不行！** v-html 会导致 XSS 攻击：

```vue
<!-- ❌ 危险：用户输入可能包含恶意脚本 -->
<div v-html="userInput"></div>

<!-- ✅ 安全：使用文本插值 -->
<div>{{ userInput }}</div>
```

---

## 2.6 动手练习

### 练习 1：基础练习 - 商品信息展示

创建一个商品信息展示页面：
- 定义商品数据（名称、价格、图片、描述）
- 使用文本插值显示商品信息
- 使用 v-bind 绑定图片 src 和 alt 属性
- 使用过滤器格式化价格（显示为 ¥xxx.xx）

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div class="product">
    <!-- 使用 v-bind 绑定图片属性 -->
    <img :src="product.image" :alt="product.name" />
    
    <!-- 使用文本插值显示信息 -->
    <h2>{{ product.name }}</h2>
    <p class="description">{{ product.description }}</p>
    
    <!-- 使用过滤器格式化价格 -->
    <p class="price">价格：{{ product.price | currency }}</p>
    
    <!-- 使用 v-bind 绑定 class -->
    <div :class="{ 'in-stock': product.stock > 0 }">
      库存：{{ product.stock }} 件
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      product: {
        name: 'iPhone 15 Pro',
        price: 7999,
        image: 'https://example.com/iphone.jpg',
        description: '钛金属设计，A17 Pro 芯片',
        stock: 50
      }
    }
  },
  filters: {
    // 货币过滤器
    currency(value) {
      return '¥' + value.toFixed(2)
    }
  }
}
</script>

<style scoped>
.product {
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 8px;
  max-width: 400px;
}

.product img {
  width: 100%;
  border-radius: 4px;
}

.price {
  color: #e74c3c;
  font-size: 20px;
  font-weight: bold;
}

.in-stock {
  color: #27ae60;
}
</style>
```

</details>

### 练习 2：进阶练习 - 待办事项列表

创建一个待办事项应用：
- 输入框输入待办内容
- 点击"添加"按钮或按回车添加待办
- 显示待办列表，每项有删除按钮
- 点击待办项可以切换完成状态
- 显示已完成和未完成的数量

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div class="todo-app">
    <h2>待办事项</h2>
    
    <!-- 输入区域 -->
    <div class="input-area">
      <input 
        v-model="newTodo" 
        @keyup.enter="addTodo"
        placeholder="输入待办事项"
      />
      <button @click="addTodo">添加</button>
    </div>
    
    <!-- 列表区域 -->
    <ul class="todo-list">
      <li 
        v-for="todo in todos" 
        :key="todo.id"
        :class="{ completed: todo.completed }"
      >
        <!-- 点击切换完成状态 -->
        <span @click="toggleTodo(todo.id)">{{ todo.text }}</span>
        
        <!-- 删除按钮 -->
        <button @click="removeTodo(todo.id)">删除</button>
      </li>
    </ul>
    
    <!-- 统计信息 -->
    <div class="stats">
      <p>总计：{{ todos.length }} 项</p>
      <p>已完成：{{ completedCount }} 项</p>
      <p>未完成：{{ todos.length - completedCount }} 项</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      newTodo: '',
      todos: [
        { id: 1, text: '学习 Vue', completed: true },
        { id: 2, text: '做项目', completed: false }
      ]
    }
  },
  computed: {
    // 计算已完成数量
    completedCount() {
      return this.todos.filter(todo => todo.completed).length
    }
  },
  methods: {
    addTodo() {
      if (this.newTodo.trim()) {
        this.todos.push({
          id: Date.now(),
          text: this.newTodo,
          completed: false
        })
        this.newTodo = ''
      }
    },
    removeTodo(id) {
      this.todos = this.todos.filter(todo => todo.id !== id)
    },
    toggleTodo(id) {
      const todo = this.todos.find(todo => todo.id === id)
      if (todo) {
        todo.completed = !todo.completed
      }
    }
  }
}
</script>

<style scoped>
.todo-app {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.input-area {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.input-area input {
  flex: 1;
  padding: 8px;
}

.todo-list {
  list-style: none;
  padding: 0;
}

.todo-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border: 1px solid #ddd;
  margin-bottom: 5px;
  border-radius: 4px;
}

.todo-list li.completed span {
  text-decoration: line-through;
  color: #999;
}

.todo-list li span {
  cursor: pointer;
  flex: 1;
}

.stats {
  margin-top: 20px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}
</style>
```

</details>

### 练习 3（挑战）：综合练习 - 用户信息卡片

创建一个用户信息展示应用：
- 定义用户数据（姓名、年龄、邮箱、爱好数组）
- 显示用户基本信息
- 显示用户爱好列表
- 可以添加新爱好
- 可以删除爱好
- 使用过滤器格式化显示（如年龄后加"岁"）

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div class="user-card">
    <h2>{{ user.name | formatName }} 的信息</h2>
    
    <!-- 基本信息 -->
    <div class="info">
      <p>年龄：{{ user.age | formatAge }}</p>
      <p>邮箱：{{ user.email }}</p>
      <p>
        状态：
        <span :class="{ active: user.isActive }">
          {{ user.isActive ? '在线' : '离线' }}
        </span>
      </p>
    </div>
    
    <!-- 爱好列表 -->
    <div class="hobbies">
      <h3>爱好（{{ user.hobbies.length }} 项）</h3>
      <ul>
        <li 
          v-for="(hobby, index) in user.hobbies" 
          :key="index"
        >
          {{ hobby }}
          <button @click="removeHobby(index)">删除</button>
        </li>
      </ul>
      
      <!-- 添加爱好 -->
      <div class="add-hobby">
        <input 
          v-model="newHobby" 
          @keyup.enter="addHobby"
          placeholder="输入新爱好"
        />
        <button @click="addHobby">添加</button>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="actions">
      <button @click="toggleStatus">切换状态</button>
      <button @click="resetHobbies">重置爱好</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: {
        name: 'zhang san',
        age: 25,
        email: 'zhangsan@example.com',
        isActive: true,
        hobbies: ['阅读', '游泳', '编程']
      },
      newHobby: '',
      defaultHobbies: ['阅读', '游泳', '编程']
    }
  },
  filters: {
    // 格式化姓名：首字母大写
    formatName(value) {
      if (!value) return ''
      return value.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    },
    // 格式化年龄：添加"岁"
    formatAge(value) {
      return value + ' 岁'
    }
  },
  methods: {
    addHobby() {
      if (this.newHobby.trim()) {
        this.user.hobbies.push(this.newHobby)
        this.newHobby = ''
      }
    },
    removeHobby(index) {
      this.user.hobbies.splice(index, 1)
    },
    toggleStatus() {
      this.user.isActive = !this.user.isActive
    },
    resetHobbies() {
      this.user.hobbies = [...this.defaultHobbies]
    }
  }
}
</script>

<style scoped>
.user-card {
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 8px;
  max-width: 400px;
  margin: 0 auto;
}

.info {
  margin: 20px 0;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
}

.active {
  color: #27ae60;
  font-weight: bold;
}

.hobbies {
  margin: 20px 0;
}

.hobbies ul {
  list-style: none;
  padding: 0;
}

.hobbies li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  margin: 5px 0;
  background: #f5f5f5;
  border-radius: 4px;
}

.add-hobby {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.add-hobby input {
  flex: 1;
  padding: 8px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.actions button {
  flex: 1;
}

button {
  padding: 6px 12px;
  cursor: pointer;
}
</style>
```

</details>

---

## 下一章预告

下一章我们会学习 **计算属性与侦听器**——Vue 中处理数据的核心工具。你会学到：
- 计算属性（computed）的用法和缓存机制
- 侦听器（watch）的使用场景
- 深度侦听和侦听特定属性
- computed vs methods vs watch 的区别和选择
