---
title: "第 1 章：Vue 2 简介与环境搭建"
description: "了解 Vue 2 的核心特性，学习如何搭建开发环境并创建第一个 Vue 项目。"
---

# 第 1 章：Vue 2 简介与环境搭建

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Vue 是什么？为什么需要学习 Vue？
- Vue 2 和 Vue 3 有什么区别？我应该学哪个？
- 如何搭建 Vue 开发环境？
- 第一个 Vue 项目应该怎么创建？

这一章就是为了解答这些问题。我们会先搞清楚 **Vue 的核心概念**，再动手搭建环境，最后创建你的第一个 Vue 项目。

---

## 1.1 为什么需要 Vue？

### 痛点分析

想象一下，你要做一个待办事项列表：

**传统方式（jQuery）**：
```javascript
// 添加待办
$('#addBtn').click(function() {
  const todo = $('#input').val()
  $('#list').append('<li>' + todo + '</li>')
})

// 删除待办
$('#list').on('click', 'li', function() {
  $(this).remove()
})

// 更新待办...
// 同步状态...
// 处理各种 DOM 操作...
```

**问题**：
- 手动操作 DOM，代码复杂
- 数据和视图不同步
- 难以维护大型项目

### Vue 的解决方案

**Vue 方式**：
```vue
<template>
  <div>
    <input v-model="newTodo" @keyup.enter="addTodo" />
    <ul>
      <li v-for="todo in todos" :key="todo.id" @click="removeTodo(todo.id)">
        {{ todo.text }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  data() {
    return {
      newTodo: '',
      todos: [
        { id: 1, text: '学习 Vue' },
        { id: 2, text: '做项目' }
      ]
    }
  },
  methods: {
    addTodo() {
      this.todos.push({
        id: Date.now(),
        text: this.newTodo
      })
      this.newTodo = ''
    },
    removeTodo(id) {
      this.todos = this.todos.filter(todo => todo.id !== id)
    }
  }
}
</script>
```

**优势**：
- ✅ 只关注数据，不用操作 DOM
- ✅ 数据变化，视图自动更新
- ✅ 代码简洁，易于维护

> **一句话总结**：Vue 帮你管理 DOM，你只需要关心数据。

---

## 1.2 Vue 核心原理

### 概念解释

Vue 的核心是 **响应式系统** 和 **组件化开发**。

打个比方：

> **响应式系统** 像服务员帮你下单：
> - 你（数据）告诉服务员（Vue）要什么
> - 服务员通知厨房（DOM）做菜
> - 菜做好了自动端上来（视图更新）
> - 你不用自己跑厨房

> **组件化开发** 像搭积木：
> - 每个组件是一块积木
> - 可以独立开发、测试
> - 组合在一起形成完整应用

### Vue 2 vs Vue 3

| 特性 | Vue 2 | Vue 3 |
| --- | --- | --- |
| 响应式实现 | Object.defineProperty | Proxy |
| API 风格 | 选项式 API | 组合式 API + 选项式 |
| TypeScript 支持 | 较弱 | 原生支持 |
| 性能 | 良好 | 更优 |
| 体积 | 较大 | 更小（Tree-shaking） |
| 学习曲线 | 平缓 | 稍陡 |

**建议**：
- 新手入门：先学 Vue 2，理解基础概念
- 新项目：推荐 Vue 3
- 维护老项目：必须掌握 Vue 2

---

## 1.3 环境搭建

### 前置要求

- Node.js >= 12.0.0
- npm 或 yarn

检查版本：
```bash
node -v  # 查看 Node.js 版本
npm -v   # 查看 npm 版本
```

### 安装 Vue CLI

```bash
# 全局安装 Vue CLI
npm install -g @vue/cli

# 验证安装
vue --version
```

### 创建项目

```bash
# 创建新项目
vue create my-vue-app

# 选择预设（推荐手动选择）
# ? Please pick a preset:
# > Manually select features (手动选择特性)

# 选择需要的特性
# ? Check the features needed for your project:
# (*) Babel       - 转译 ES6+
# (*) Router      - 单页应用路由
# (*) Vuex        - 状态管理
# ( ) CSS Pre-processors - CSS 预处理器
# (*) Linter / Formatter - 代码检查

# 选择 Vue 版本
# ? Choose a version of Vue.js that you want to start the project with
# > 2.x (推荐，本章学习 Vue 2)
#   3.x

# 是否使用 history 模式路由
# ? Use history mode for router? (Requires proper server setup for production build)
# > Yes (推荐)
#   No

# 选择配置格式
# ? Where do you prefer placing config for Babel, ESLint, etc.?
# > In dedicated config files (独立配置文件)
#   In package.json (在 package.json 中)

# 是否保存预设
# ? Save this as a preset for future projects?
# > No
#   Yes

# 进入项目目录
cd my-vue-app

# 启动开发服务器
npm run serve
```

### 项目结构

```
my-vue-app/
├── public/              # 静态资源（不会被编译）
│   └── index.html       # HTML 模板
├── src/                 # 源代码（主要开发目录）
│   ├── assets/          # 资源文件（图片、字体等）
│   ├── components/      # 公共组件
│   ├── views/           # 页面组件
│   ├── router/          # 路由配置
│   ├── store/           # Vuex 状态管理
│   ├── App.vue          # 根组件
│   └── main.js          # 入口文件
├── package.json         # 依赖配置
├── vue.config.js        # Vue CLI 配置
└── .eslintrc.js         # ESLint 配置
```

---

## 1.4 第一个 Vue 实例

### 入口文件

```javascript
// main.js - 应用入口
import Vue from 'vue'           // 引入 Vue 核心库
import App from './App.vue'     // 引入根组件

Vue.config.productionTip = false  // 关闭生产提示

// 创建 Vue 实例
new Vue({
  render: h => h(App)           // 渲染根组件
}).$mount('#app')               // 挂载到 #app 元素
```

### 根组件

```vue
<!-- App.vue - 根组件 -->
<template>
  <div id="app">
    <!-- 文本插值：显示 message 的值 -->
    <h1>{{ message }}</h1>
    
    <!-- 显示计数器 -->
    <p>计数器：{{ count }}</p>
    
    <!-- 按钮点击事件 -->
    <button @click="increment">增加</button>
  </div>
</template>

<script>
export default {
  name: 'App',                    // 组件名称
  
  // 数据选项
  data() {
    return {
      message: 'Hello Vue 2!',    // 消息文本
      count: 0                    // 计数器初始值
    }
  },
  
  // 方法选项
  methods: {
    increment() {
      this.count++                // 点击时 count 加 1
    }
  }
}
</script>

<style>
/* 样式 */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
```

### 运行效果

1. 页面显示标题：Hello Vue 2!
2. 显示计数器：0
3. 点击"增加"按钮，计数器数字增加

---

## 1.5 Vue 实例选项

### 常用选项

```javascript
new Vue({
  // 1. data - 响应式数据
  data() {
    return {
      message: 'Hello'
    }
  },
  
  // 2. methods - 方法
  methods: {
    greet() {
      return this.message        // 通过 this 访问 data
    }
  },
  
  // 3. computed - 计算属性（有缓存）
  computed: {
    upperMessage() {
      return this.message.toUpperCase()
    }
  },
  
  // 4. watch - 侦听器
  watch: {
    message(newVal, oldVal) {
      console.log(`变化：${oldVal} -> ${newVal}`)
    }
  },
  
  // 5. 生命周期钩子
  created() {
    console.log('实例已创建')     // 数据观测完成
  },
  mounted() {
    console.log('DOM 已挂载')     // 组件挂载到 DOM
  },
  updated() {
    console.log('视图已更新')     // 数据变化导致视图更新
  },
  destroyed() {
    console.log('实例已销毁')     // 组件销毁前
  }
})
```

### 选项对比

| 选项 | 用途 | 是否有缓存 | 执行时机 |
| --- | --- | --- | --- |
| data | 存储响应式数据 | - | 初始化时 |
| methods | 定义方法 | ❌ | 调用时 |
| computed | 计算属性 | ✅ | 依赖变化时 |
| watch | 侦听数据变化 | - | 数据变化时 |
| 生命周期 | 在特定阶段执行逻辑 | - | 对应阶段 |

---

## 1.6 模板语法预览

```vue
<template>
  <div>
    <!-- 1. 文本插值 -->
    <p>{{ message }}</p>
    
    <!-- 2. 属性绑定 -->
    <img :src="imageUrl" />
    
    <!-- 3. 事件绑定 -->
    <button @click="handleClick">点击</button>
    
    <!-- 4. 双向绑定 -->
    <input v-model="inputValue" />
    
    <!-- 5. 条件渲染 -->
    <p v-if="isVisible">可见</p>
    
    <!-- 6. 列表渲染 -->
    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello Vue',
      imageUrl: 'https://example.com/image.jpg',
      inputValue: '',
      isVisible: true,
      items: [
        { id: 1, name: '项目一' },
        { id: 2, name: '项目二' }
      ]
    }
  },
  methods: {
    handleClick() {
      alert('按钮被点击')
    }
  }
}
</script>
```

---

## 1.7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| Vue 是什么 | 渐进式 JavaScript 框架，专注于视图层 |
| 响应式系统 | 数据变化自动更新视图，基于 Object.defineProperty |
| 组件化开发 | 将 UI 拆分为独立、可复用的组件 |
| Vue CLI | 官方提供的脚手架工具，快速创建项目 |
| 单文件组件 | .vue 文件包含 template、script、style 三部分 |
| Vue 实例 | 通过 new Vue() 创建，是应用的核心 |

---

## 1.8 新手常见误区

### 误区 1："Vue 2 和 Vue 3 语法完全不同"

**不是的**。Vue 2 和 Vue 3 的选项式 API 基本相同，Vue 3 只是新增了组合式 API。学会 Vue 2，迁移到 Vue 3 很容易。

### 误区 2："必须用 Vue CLI 创建项目"

**错！** Vue CLI 只是工具之一，你也可以：
- 使用 Vite（推荐，更快）
- 直接引入 CDN
- 使用其他构建工具

### 误区 3："data 可以直接赋值对象"

**错！** data 必须是函数，返回数据对象：

```javascript
// ❌ 错误
data: {
  message: 'Hello'
}

// ✅ 正确
data() {
  return {
    message: 'Hello'
  }
}
```

### 误区 4："模板中可以直接写复杂逻辑"

**不推荐**。模板应该保持简洁，复杂逻辑应该提取到 methods 或 computed：

```vue
<!-- ❌ 不推荐 -->
<p>{{ message.split('').reverse().join('') }}</p>

<!-- ✅ 推荐 -->
<p>{{ reversedMessage }}</p>

<script>
computed: {
  reversedMessage() {
    return this.message.split('').reverse().join('')
  }
}
</script>
```

---

## 1.9 动手练习

### 练习 1：基础练习 - 创建计数器

创建一个计数器应用，包含：
- 显示当前计数值
- "增加"按钮，点击后计数加 1
- "减少"按钮，点击后计数减 1
- "重置"按钮，点击后计数归零

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div>
    <h2>计数器：{{ count }}</h2>
    <button @click="increment">增加</button>
    <button @click="decrement">减少</button>
    <button @click="reset">重置</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      count: 0
    }
  },
  methods: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    },
    reset() {
      this.count = 0
    }
  }
}
</script>
```

</details>

### 练习 2：进阶练习 - 待办事项列表

创建一个简单的待办事项应用：
- 输入框输入待办内容
- 点击"添加"按钮或按回车添加待办
- 显示待办列表
- 点击待办项可以删除

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div>
    <h2>待办事项</h2>
    
    <!-- 输入区域 -->
    <div>
      <input 
        v-model="newTodo" 
        @keyup.enter="addTodo"
        placeholder="输入待办事项"
      />
      <button @click="addTodo">添加</button>
    </div>
    
    <!-- 列表区域 -->
    <ul>
      <li 
        v-for="todo in todos" 
        :key="todo.id"
        @click="removeTodo(todo.id)"
      >
        {{ todo.text }}
      </li>
    </ul>
    
    <!-- 统计信息 -->
    <p>共 {{ todos.length }} 项待办</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      newTodo: '',
      todos: []
    }
  },
  methods: {
    addTodo() {
      if (this.newTodo.trim()) {
        this.todos.push({
          id: Date.now(),
          text: this.newTodo
        })
        this.newTodo = ''
      }
    },
    removeTodo(id) {
      this.todos = this.todos.filter(todo => todo.id !== id)
    }
  }
}
</script>
```

</details>

### 练习 3（挑战）：综合练习 - 用户信息卡片

创建一个用户信息展示应用：
- 定义用户数据（姓名、年龄、邮箱、爱好数组）
- 显示用户基本信息
- 显示用户爱好列表
- 可以添加新爱好
- 可以删除爱好

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div class="user-card">
    <h2>{{ user.name }} 的信息</h2>
    
    <!-- 基本信息 -->
    <div class="info">
      <p>年龄：{{ user.age }} 岁</p>
      <p>邮箱：{{ user.email }}</p>
    </div>
    
    <!-- 爱好列表 -->
    <div class="hobbies">
      <h3>爱好</h3>
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
      <div>
        <input 
          v-model="newHobby" 
          @keyup.enter="addHobby"
          placeholder="输入新爱好"
        />
        <button @click="addHobby">添加</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: {
        name: '张三',
        age: 25,
        email: 'zhangsan@example.com',
        hobbies: ['阅读', '游泳', '编程']
      },
      newHobby: ''
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
}

.info {
  margin: 20px 0;
}

.hobbies ul {
  list-style: none;
  padding: 0;
}

.hobbies li {
  margin: 10px 0;
}

button {
  margin-left: 10px;
}
</style>
```

</details>

---

## 下一章预告

下一章我们会学习 **模板语法**——也就是 Vue 如何在 HTML 中显示数据。你会学到：
- 文本插值和 HTML 插值
- 属性绑定和事件绑定
- 各种指令的用法
- 过滤器的使用
