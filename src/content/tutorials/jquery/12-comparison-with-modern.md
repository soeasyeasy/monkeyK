---
title: "第十二章：jQuery 与 Vue/React 对比"
description: "理解命令式与声明式编程的区别，认识现代前端框架的优势"
---

# 第十二章：jQuery 与 Vue/React 对比

## 本章导读

在学这一章之前，你可能会有这些疑问：

- jQuery 和 Vue/React 有什么本质区别？
- 为什么现在都说"jQuery 已死"？
- 学了 Vue/React 还需要学 jQuery 吗？

这一章就是为了解答这些问题。理解 jQuery 和现代框架的差异，能帮你更好地理解前端技术的发展脉络。

---

## 1 为什么需要对比？

### 痛点分析

很多新手会困惑：

- 既然有了 Vue/React，为什么还有 jQuery 项目？
- 面试时该重点准备哪个？
- 老项目要不要迁移到新框架？

### 对比的价值

了解两者的差异，能帮你：

- 做出合理的技术选型
- 理解前端演进的历史
- 更好地维护老项目

---

## 2 核心原理

### 编程范式的区别

jQuery 和 Vue/React 最根本的区别是**编程范式**不同：

- **jQuery：命令式编程** —— 你告诉计算机"怎么做"
- **Vue/React：声明式编程** —— 你告诉计算机"做什么"

打个比方：

> 命令式像"自己开车"——你要控制方向盘、油门、刹车，每一步都要亲自操作。
> 声明式像"打车"——你只需要告诉司机"去机场"，具体怎么开你不用管。

---

## 3 基础用法 + 逐行注释

### DOM 操作方式对比

```javascript
// ===== 需求：点击按钮，显示一条消息 =====

// ----- jQuery（命令式） -----
// 你需要手动操作 DOM
$('#addBtn').click(function() {
  // 1. 创建 DOM 元素
  var $msg = $('<div class="message">新消息</div>')
  // 2. 插入到页面
  $('#messageList').append($msg)
  // 3. 添加动画
  $msg.hide().fadeIn()
})

// ----- Vue（声明式） -----
// 你只需要描述数据状态，框架自动更新 DOM
<template>
  <button @click="addMessage">添加消息</button>
  <div v-for="msg in messages" class="message">{{ msg }}</div>
</template>

<script setup>
import { ref } from 'vue'

// 定义数据
const messages = ref([])

// 修改数据（框架自动更新 DOM）
function addMessage() {
  messages.value.push('新消息')
}
</script>
```

### 数据与视图的关系

```javascript
// ===== jQuery：数据和视图是分离的 =====
// 数据存在变量里，视图存在 DOM 里
// 数据变化后，你要手动更新视图

var items = ['苹果', '香蕉']  // 数据

function render() {
  // 手动渲染视图
  var html = ''
  items.forEach(function(item) {
    html += '<li>' + item + '</li>'
  })
  $('#list').html(html)
}

// 数据变化时，要手动调用 render
$('#addBtn').click(function() {
  items.push('橘子')  // 修改数据
  render()             // 手动更新视图（容易忘记！）
})


// ===== Vue：数据驱动视图 =====
// 数据变化后，视图自动更新

<template>
  <button @click="addItem">添加</button>
  <ul>
    <li v-for="item in items">{{ item }}</li>
  </ul>
</template>

<script setup>
import { ref } from 'vue'

const items = ref(['苹果', '香蕉'])

function addItem() {
  // 只需要修改数据，视图自动更新
  items.value.push('橘子')
}
</script>
```

### 组件化对比

```javascript
// ===== jQuery：组件化靠手动封装 =====
// 没有统一的组件规范，全靠开发者自己组织

// 定义一个"用户卡片"组件
function UserCard(name, email) {
  this.name = name
  this.email = email
}

UserCard.prototype.render = function() {
  return '<div class="user-card">' +
    '<h3>' + this.name + '</h3>' +
    '<p>' + this.email + '</p>' +
    '</div>'
}

// 使用
var card = new UserCard('张三', 'zhangsan@qq.com')
$('#container').html(card.render())


// ===== Vue：统一的组件规范 =====
// 每个组件是一个 .vue 文件，包含模板、逻辑、样式

// UserCard.vue
<template>
  <div class="user-card">
    <h3>{{ name }}</h3>
    <p>{{ email }}</p>
  </div>
</template>

<script setup>
defineProps({
  name: String,
  email: String
})
</script>

// 使用
// <UserCard name="张三" email="zhangsan@qq.com" />
```

### 事件处理对比

```javascript
// ===== jQuery：手动绑定事件 =====
// 事件和 DOM 元素绑定，分散在各个地方

// 页面加载完成后绑定事件
$(function() {
  // 按钮点击事件
  $('#submitBtn').click(function() {
    // 处理提交逻辑...
  })

  // 输入框变化事件
  $('#username').on('input', function() {
    // 实时验证...
  })

  // 列表项点击事件
  $('#list').on('click', 'li', function() {
    // 处理点击...
  })
})


// ===== Vue：事件绑定在模板中 =====
// 事件和组件绑定，结构清晰

<template>
  <button @click="handleSubmit">提交</button>
  <input @input="handleInput" v-model="username">
  <ul>
    <li v-for="item in items" @click="handleClick(item)">
      {{ item.name }}
    </li>
  </ul>
</template>

<script setup>
function handleSubmit() { /* ... */ }
function handleInput(e) { /* ... */ }
function handleClick(item) { /* ... */ }
</script>
```

---

## 4 对比表格

| 特性 | jQuery | Vue/React |
| --- | --- | --- |
| 编程范式 | 命令式 | 声明式 |
| DOM 操作 | 手动操作 | 数据驱动，自动更新 |
| 组件化 | 无统一规范 | 统一组件规范 |
| 状态管理 | 手动同步 | 自动响应 |
| 学习曲线 | 低 | 中等 |
| 包体积 | ~90 KB | ~30-40 KB |
| 适用场景 | 传统多页应用、老项目维护 | 现代单页应用 |
| 开发效率 | 低（代码多） | 高（代码少） |
| 可维护性 | 低（逻辑分散） | 高（组件化） |

---

## 5 新手常见误区

### 误区 1："jQuery 已经完全过时了"

**不完全对！** jQuery 在很多场景仍然有用。

```javascript
// jQuery 仍然适用的场景：
// 1. 维护老项目（大量 jQuery 代码）
// 2. 简单的静态页面（不需要复杂框架）
// 3. WordPress 等 CMS 系统（默认集成 jQuery）
// 4. 快速原型开发

// Vue/React 更适合的场景：
// 1. 复杂的单页应用
// 2. 需要组件化开发
// 3. 团队协作的大型项目
// 4. 需要状态管理的应用
```

### 误区 2："学了 Vue 就不需要学 jQuery"

**看情况！** 如果你的工作涉及老项目，jQuery 还是要学的。

```javascript
// 现实情况：
// - 很多公司仍有大量 jQuery 老项目
// - 外包项目经常要求用 jQuery
// - 面试题可能涉及 jQuery

// 建议：
// - 新项目优先用 Vue/React
// - 了解 jQuery 的基本用法和原理
// - 能看懂和修改 jQuery 代码
```

### 误区 3："jQuery 代码不能迁移到 Vue"

**可以迁移！** 但需要重构思路。

```javascript
// jQuery 代码迁移到 Vue 的步骤：
// 1. 分析功能：jQuery 代码做了什么
// 2. 提取数据：哪些是数据状态
// 3. 重构视图：用 Vue 模板重写
// 4. 迁移逻辑：把 DOM 操作改为数据操作

// 例如：
// jQuery：$('#box').text('hello')  // 直接操作 DOM
// Vue：this.message = 'hello'       // 修改数据，视图自动更新
```

---

## 6 动手练习

### 练习 1：基础练习

分别用 jQuery 和 Vue 实现"计数器"功能：一个数字显示和一个"+"按钮，点击按钮数字加 1。

<details>
<summary>点击查看答案</summary>

```html
<!-- jQuery 实现 -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
</head>
<body>
  <span id="count">0</span>
  <button id="addBtn">+</button>

  <script>
    $(function() {
      // 定义计数器变量
      var count = 0

      // 按钮点击事件
      $('#addBtn').click(function() {
        // 计数器加 1
        count++
        // 手动更新视图
        $('#count').text(count)
      })
    })
  </script>
</body>
</html>

<!-- Vue 实现 -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.js"></script>
</head>
<body>
  <div id="app">
    <span>{{ count }}</span>
    <button @click="count++">+</button>
  </div>

  <script>
    Vue.createApp({
      data() {
        return {
          count: 0  // 数据
        }
      }
      // 修改 count，视图自动更新
    }).mount('#app')
  </script>
</body>
</html>
```

</details>

### 练习 2：进阶练习

对比 jQuery 和 Vue 实现"待办事项"功能的代码量差异。

<details>
<summary>点击查看答案</summary>

```html
<!-- jQuery 实现（约 30 行） -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
</head>
<body>
  <input type="text" id="todoInput">
  <button id="addBtn">添加</button>
  <ul id="todoList"></ul>

  <script>
    $(function() {
      var items = []  // 数据

      // 渲染函数
      function render() {
        var html = ''
        items.forEach(function(item, index) {
          html += '<li>' + item +
            ' <button class="del-btn" data-index="' + index + '">删除</button></li>'
        })
        $('#todoList').html(html)
      }

      // 添加
      $('#addBtn').click(function() {
        var text = $('#todoInput').val().trim()
        if (text) {
          items.push(text)
          $('#todoInput').val('')
          render()  // 手动更新视图
        }
      })

      // 删除（事件委托）
      $('#todoList').on('click', '.del-btn', function() {
        var index = $(this).data('index')
        items.splice(index, 1)
        render()  // 手动更新视图
      })
    })
  </script>
</body>
</html>

<!-- Vue 实现（约 20 行） -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.js"></script>
</head>
<body>
  <div id="app">
    <input v-model="newTodo" @keyup.enter="addTodo">
    <button @click="addTodo">添加</button>
    <ul>
      <li v-for="(todo, index) in todos" :key="index">
        {{ todo }}
        <button @click="removeTodo(index)">删除</button>
      </li>
    </ul>
  </div>

  <script>
    Vue.createApp({
      data() {
        return {
          newTodo: '',
          todos: []
        }
      },
      methods: {
        addTodo() {
          if (this.newTodo.trim()) {
            this.todos.push(this.newTodo.trim())
            this.newTodo = ''
          }
        },
        removeTodo(index) {
          this.todos.splice(index, 1)
        }
      }
    }).mount('#app')
  </script>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习

分析一个 jQuery 项目代码，指出可以迁移到 Vue 的部分，以及迁移思路。

<details>
<summary>点击查看答案</summary>

```javascript
// jQuery 代码示例
$(function() {
  var currentUser = null
  var messages = []

  // 登录
  $('#loginBtn').click(function() {
    var username = $('#username').val()
    $.post('/api/login', { username: username }, function(res) {
      currentUser = res.user
      $('#userInfo').text('欢迎，' + currentUser.name)
      loadMessages()
    })
  })

  // 加载消息
  function loadMessages() {
    $.get('/api/messages', function(data) {
      messages = data
      var html = ''
      data.forEach(function(msg) {
        html += '<div class="message">' + msg.content + '</div>'
      })
      $('#messageList').html(html)
    })
  }

  // 发送消息
  $('#sendBtn').click(function() {
    var content = $('#messageInput').val()
    $.post('/api/messages', { content: content }, function() {
      messages.push({ content: content })
      $('#messageInput').val('')
      // 手动更新视图
      var html = ''
      messages.forEach(function(msg) {
        html += '<div class="message">' + msg.content + '</div>'
      })
      $('#messageList').html(html)
    })
  })
})


// ===== 迁移到 Vue 的思路 =====
// 1. 提取数据状态
//    - currentUser: 当前用户
//    - messages: 消息列表
//    - newMessage: 新消息输入

// 2. 提取方法
//    - login(): 登录
//    - loadMessages(): 加载消息
//    - sendMessage(): 发送消息

// 3. 重构视图
//    - 用户信息显示
//    - 消息列表渲染
//    - 输入框和发送按钮

// Vue 版本
<template>
  <div>
    <!-- 用户信息 -->
    <div v-if="currentUser">
      欢迎，{{ currentUser.name }}
    </div>
    <div v-else>
      <input v-model="username">
      <button @click="login">登录</button>
    </div>

    <!-- 消息列表 -->
    <div class="message-list">
      <div v-for="msg in messages" class="message">
        {{ msg.content }}
      </div>
    </div>

    <!-- 发送消息 -->
    <div v-if="currentUser">
      <input v-model="newMessage" @keyup.enter="sendMessage">
      <button @click="sendMessage">发送</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const currentUser = ref(null)
const messages = ref([])
const username = ref('')
const newMessage = ref('')

function login() {
  // Ajax 请求...
  currentUser.value = { name: username.value }
  loadMessages()
}

function loadMessages() {
  // Ajax 请求...
  // messages.value = data
}

function sendMessage() {
  // Ajax 请求...
  messages.value.push({ content: newMessage.value })
  newMessage.value = ''
}
</script>
```

</details>

---

## 下一章预告

下一章我们会学习 **jQuery 性能优化** —— 如何写出高效的 jQuery 代码，避免常见的性能陷阱。
