---
title: "第十一章：Fetch API"
description: "发送网络请求、处理响应、与服务器交互"
---

# 第十一章：Fetch API

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Fetch API？为什么需要它？
- 怎么发送 GET 请求获取数据？
- 怎么发送 POST 请求提交数据？
- 如何处理 JSON 响应？
- 如何处理网络错误？
- 如何中断正在进行的请求？

这一章就是为了解答这些问题。我们会学习如何使用 Fetch API 与服务器进行数据交互。

---

## 11.1 为什么需要 Fetch API？

### 痛点分析

想象一下，如果没有网络请求，网页就是一座**孤岛**：

```javascript
// ❌ 只能使用本地数据，无法获取服务器最新数据
const users = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' }
]
```

数据永远是固定的，无法更新！

### 解决方案

用 Fetch API 与服务器通信：

```javascript
// ✅ 从服务器获取最新数据
async function getUsers() {
  const response = await fetch('https://api.example.com/users')
  const users = await response.json()
  console.log('服务器返回的用户:', users)
}

getUsers()
```

> **一句话总结**：Fetch API 就像一座桥梁，连接网页和服务器，让数据能够双向流动。

---

## 11.2 核心原理

### HTTP 请求/响应模型

网络请求遵循 **HTTP 协议**，分为请求和响应两部分：

**请求**：客户端（浏览器）发送给服务器的消息
- 方法（GET、POST、PUT、DELETE）
- URL
- 请求头（Headers）
- 请求体（Body）

**响应**：服务器返回给客户端的消息
- 状态码（200 表示成功，404 表示未找到，500 表示服务器错误）
- 响应头（Headers）
- 响应体（Body）

打个比方：

> 想象你去餐厅点餐：
> - 请求就像你告诉服务员："请给我来一份宫保鸡丁"（方法+内容）
> - 响应就像服务员端来菜："好的，这是您的宫保鸡丁"（状态+内容）
> - 状态码就像服务员的反馈："没问题"（200）、"没有这道菜"（404）、"厨房出问题了"（500）

---

## 11.3 发送 GET 请求

### 基本用法

```javascript
async function fetchData() {
  // 发送 GET 请求
  const response = await fetch('https://api.example.com/data')
  
  // 检查响应状态
  if (!response.ok) {
    throw new Error(`HTTP 错误！状态码: ${response.status}`)
  }
  
  // 解析 JSON 响应
  const data = await response.json()
  console.log('获取的数据:', data)
}

fetchData()
```

### 带查询参数

```javascript
async function searchUsers(query) {
  // 使用 URLSearchParams 构建查询参数
  const params = new URLSearchParams({
    q: query,
    limit: 10,
    page: 1
  })
  
  // 拼接 URL
  const url = `https://api.example.com/users?${params}`
  
  const response = await fetch(url)
  const users = await response.json()
  return users
}

searchUsers('张三')
```

---

## 11.4 发送 POST 请求

### 基本用法

```javascript
async function createUser(userData) {
  const response = await fetch('https://api.example.com/users', {
    method: 'POST', // 指定请求方法
    headers: {
      'Content-Type': 'application/json' // 指定内容类型
    },
    body: JSON.stringify(userData) // 将对象转为 JSON 字符串
  })
  
  if (!response.ok) {
    throw new Error('创建用户失败')
  }
  
  const newUser = await response.json()
  return newUser
}

// 使用
createUser({ name: '张三', age: 25, email: 'zhangsan@example.com' })
```

### 表单数据

```javascript
async function submitForm(formData) {
  const response = await fetch('https://api.example.com/submit', {
    method: 'POST',
    body: formData // 直接传递 FormData 对象
  })
  
  const result = await response.json()
  return result
}

// 使用
const form = document.querySelector('form')
form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const formData = new FormData(form)
  await submitForm(formData)
})
```

---

## 11.5 请求配置选项

### 完整的请求配置

```javascript
const options = {
  method: 'POST', // 请求方法：GET, POST, PUT, DELETE, PATCH
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  },
  body: JSON.stringify(data), // 请求体
  mode: 'cors', // 模式：cors, no-cors, same-origin
  cache: 'default', // 缓存策略：default, no-cache, reload, force-cache
  credentials: 'include', // 凭据：include, same-origin, omit
  redirect: 'follow', // 重定向：follow, manual, error
  referrer: 'no-referrer', // 来源
  integrity: '' // 子资源完整性
}

const response = await fetch('https://api.example.com/data', options)
```

### 常用配置说明

| 配置项 | 说明 |
| --- | --- |
| `method` | HTTP 方法，默认 GET |
| `headers` | 请求头对象 |
| `body` | 请求体，GET 请求不能有 body |
| `mode` | 跨域模式，默认 cors |
| `credentials` | 是否发送 Cookie，默认 same-origin |
| `cache` | 缓存策略 |

---

## 11.6 处理响应

### 解析响应体

```javascript
const response = await fetch('https://api.example.com/data')

// 解析为 JSON
const jsonData = await response.json()

// 解析为文本
const textData = await response.text()

// 解析为 Blob（二进制数据，如图片）
const blobData = await response.blob()

// 解析为 FormData
const formData = await response.formData()

// 解析为 ArrayBuffer（原始二进制数据）
const arrayBuffer = await response.arrayBuffer()
```

### 响应状态码

```javascript
const response = await fetch('https://api.example.com/data')

console.log(response.status)      // 状态码：200, 404, 500
console.log(response.statusText) // 状态文本：OK, Not Found
console.log(response.ok)         // 是否成功（status >= 200 && status < 300）
```

### 响应头

```javascript
const response = await fetch('https://api.example.com/data')

// 获取所有响应头
console.log(response.headers)

// 获取特定响应头
const contentType = response.headers.get('Content-Type')
console.log('Content-Type:', contentType)
```

---

## 11.7 错误处理

### 网络错误

```javascript
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data')
    
    if (!response.ok) {
      // HTTP 错误（状态码不是 2xx）
      throw new Error(`请求失败：${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    // 网络错误或 HTTP 错误
    console.error('获取数据失败:', error.message)
    throw error
  }
}
```

### 超时处理

```javascript
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort() // 超时后中断请求
  }, timeout)
  
  try {
    const response = await fetch(url, {
      signal: controller.signal // 关联信号
    })
    
    clearTimeout(timeoutId) // 请求成功，清除定时器
    
    if (!response.ok) {
      throw new Error(`HTTP 错误：${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('请求超时')
    }
    throw error
  }
}

// 使用
fetchWithTimeout('https://api.example.com/data', 5000)
```

---

## 11.8 中断请求

### 使用 AbortController

```javascript
const controller = new AbortController()

// 发起请求
const fetchPromise = fetch('https://api.example.com/data', {
  signal: controller.signal
})

// 在某个时刻中断请求
setTimeout(() => {
  controller.abort() // 中断请求
}, 3000)

// 处理中断
fetchPromise
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => {
    if (error.name === 'AbortError') {
      console.log('请求已被中断')
    } else {
      console.error('请求失败:', error)
    }
  })
```

### 在 React/Vue 中使用

```javascript
// 在组件卸载时中断请求
useEffect(() => {
  const controller = new AbortController()
  
  async function fetchData() {
    const response = await fetch(url, { signal: controller.signal })
    const data = await response.json()
    setData(data)
  }
  
  fetchData()
  
  // 清理函数：组件卸载时中断请求
  return () => {
    controller.abort()
  }
}, [url])
```

---

## 11.9 设置请求头

### 基本示例

```javascript
async function fetchWithAuth(url) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getToken(),
      'Accept': 'application/json'
    }
  })
  
  return await response.json()
}
```

### 常见请求头

| 请求头 | 说明 |
| --- | --- |
| `Content-Type` | 请求体的类型（application/json, application/x-www-form-urlencoded） |
| `Authorization` | 认证信息（Bearer token, Basic auth） |
| `Accept` | 期望的响应类型 |
| `Cache-Control` | 缓存控制 |
| `Origin` | 请求来源（自动设置） |

---

## 11.10 发送其他类型的请求

### PUT 请求（更新资源）

```javascript
async function updateUser(userId, data) {
  const response = await fetch(`https://api.example.com/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error('更新用户失败')
  }
  
  return await response.json()
}

updateUser(1, { name: '李四', age: 30 })
```

### DELETE 请求（删除资源）

```javascript
async function deleteUser(userId) {
  const response = await fetch(`https://api.example.com/users/${userId}`, {
    method: 'DELETE'
  })
  
  if (!response.ok) {
    throw new Error('删除用户失败')
  }
  
  return await response.json()
}

deleteUser(1)
```

### PATCH 请求（部分更新）

```javascript
async function partialUpdateUser(userId, data) {
  const response = await fetch(`https://api.example.com/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  
  return await response.json()
}

partialUpdateUser(1, { age: 26 }) // 只更新年龄
```

---

## 11.11 实战：封装 API 调用

### 创建 API 服务

```javascript
class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl
    this.headers = {
      'Content-Type': 'application/json'
    }
  }
  
  async request(url, options = {}) {
    const fullUrl = `${this.baseUrl}${url}`
    
    const response = await fetch(fullUrl, {
      headers: { ...this.headers, ...options.headers },
      ...options
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `请求失败：${response.status}`)
    }
    
    // 如果响应体为空，返回 null
    if (response.status === 204) {
      return null
    }
    
    return await response.json()
  }
  
  // GET 请求
  async get(url, params = {}) {
    const query = new URLSearchParams(params).toString()
    const fullUrl = query ? `${url}?${query}` : url
    return this.request(fullUrl, { method: 'GET' })
  }
  
  // POST 请求
  async post(url, data = {}) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  // PUT 请求
  async put(url, data = {}) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }
  
  // DELETE 请求
  async delete(url) {
    return this.request(url, { method: 'DELETE' })
  }
  
  // 设置认证 token
  setToken(token) {
    this.headers.Authorization = `Bearer ${token}`
  }
  
  // 清除认证 token
  clearToken() {
    delete this.headers.Authorization
  }
}

// 使用
const api = new ApiService('https://api.example.com')

// 获取用户列表
api.get('/users', { page: 1, limit: 10 })
  .then(users => console.log(users))
  .catch(error => console.error(error))

// 创建用户
api.post('/users', { name: '张三', age: 25 })
  .then(user => console.log('创建的用户:', user))
  .catch(error => console.error(error))

// 设置 token
api.setToken('my-token')
```

---

## 11.12 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| `fetch()` | 发送网络请求，返回 Promise |
| `response.json()` | 解析 JSON 响应 |
| `response.text()` | 解析文本响应 |
| `response.blob()` | 解析二进制响应 |
| `response.ok` | 检查是否成功（2xx） |
| `response.status` | HTTP 状态码 |
| `method: 'POST'` | 指定请求方法 |
| `headers` | 设置请求头 |
| `body` | 设置请求体 |
| `AbortController` | 中断请求 |
| `URLSearchParams` | 构建查询参数 |

---

## 11.13 新手常见误区

### 误区 1：fetch 返回 Promise 就意味着请求成功

**错！** `fetch` 只在**网络错误**时才会 reject，HTTP 错误（如 404、500）会 resolve。

```javascript
// ❌ 错误：没有检查 response.ok
fetch('https://api.example.com/nonexistent')
  .then(response => response.json())
  .then(data => console.log(data)) // 会报错，因为响应不是有效的 JSON
  .catch(error => console.error(error)) // 不会捕获到 HTTP 404

// ✅ 正确：检查 response.ok
fetch('https://api.example.com/nonexistent')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP 错误：${response.status}`)
    }
    return response.json()
  })
  .then(data => console.log(data))
  .catch(error => console.error('请求失败:', error)) // 会捕获到错误
```

### 误区 2：GET 请求可以有 body

**错！** HTTP 规范不允许 GET 请求有 body。

```javascript
// ❌ 错误：GET 请求不能有 body
fetch('https://api.example.com/data', {
  method: 'GET',
  body: JSON.stringify({ id: 1 }) // 无效！
})

// ✅ 正确：使用查询参数
fetch('https://api.example.com/data?id=1')
```

### 误区 3：不需要设置 Content-Type

**错！** 发送 JSON 数据时必须设置 Content-Type。

```javascript
// ❌ 错误：服务器不知道 body 是什么格式
fetch('https://api.example.com/users', {
  method: 'POST',
  body: JSON.stringify({ name: '张三' }) // 服务器可能无法解析
})

// ✅ 正确：设置 Content-Type
fetch('https://api.example.com/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: '张三' })
})
```

### 误区 4：response.json() 可以调用多次

**错！** 响应体只能被读取一次。

```javascript
const response = await fetch('https://api.example.com/data')

// ❌ 错误：第二次调用会失败
const data1 = await response.json()
const data2 = await response.json() // TypeError: body stream already read

// ✅ 正确：只调用一次
const data = await response.json()
console.log(data)
```

---

## 11.14 动手练习

### 练习 1：基础练习

使用 Fetch API 获取 GitHub 用户信息。

<details>
<summary>点击查看答案</summary>

```javascript
async function getGitHubUser(username) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`)
    
    if (!response.ok) {
      throw new Error(`获取用户失败：${response.status}`)
    }
    
    const user = await response.json()
    
    console.log('用户名:', user.login)
    console.log('姓名:', user.name)
    console.log('仓库数:', user.public_repos)
    console.log('关注者:', user.followers)
    console.log('头像:', user.avatar_url)
    
    return user
  } catch (error) {
    console.error('错误:', error.message)
    throw error
  }
}

// 使用
getGitHubUser('octocat')
```

</details>

### 练习 2：进阶练习

实现一个函数，发送 POST 请求创建用户，并处理成功和失败的情况。

<details>
<summary>点击查看答案</summary>

```javascript
async function createUser(userData) {
  const url = 'https://jsonplaceholder.typicode.com/users'
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })
    
    if (!response.ok) {
      const errorInfo = await response.json().catch(() => ({}))
      throw new Error(errorInfo.message || `创建失败：${response.status}`)
    }
    
    const newUser = await response.json()
    console.log('用户创建成功:', newUser)
    return newUser
  } catch (error) {
    console.error('创建用户失败:', error.message)
    
    // 返回错误信息给调用者
    return {
      success: false,
      error: error.message
    }
  }
}

// 使用
const userData = {
  name: '张三',
  username: 'zhangsan',
  email: 'zhangsan@example.com',
  phone: '13800138000'
}

createUser(userData).then(result => {
  if (result.success === false) {
    console.log('需要处理错误:', result.error)
  }
})
```

</details>

### 练习 3（挑战）：综合练习

实现一个待办事项应用，使用 Fetch API 与服务器交互。

<details>
<summary>点击查看答案</summary>

```javascript
class TodoApp {
  constructor(apiUrl) {
    this.apiUrl = apiUrl
    this.todos = []
  }
  
  async fetchTodos() {
    const response = await fetch(`${this.apiUrl}/todos`)
    if (!response.ok) throw new Error('获取待办失败')
    this.todos = await response.json()
    return this.todos
  }
  
  async addTodo(title) {
    const response = await fetch(`${this.apiUrl}/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        completed: false,
        userId: 1
      })
    })
    
    if (!response.ok) throw new Error('添加待办失败')
    const newTodo = await response.json()
    this.todos.push(newTodo)
    return newTodo
  }
  
  async toggleTodo(todoId) {
    const todo = this.todos.find(t => t.id === todoId)
    if (!todo) throw new Error('待办不存在')
    
    const response = await fetch(`${this.apiUrl}/todos/${todoId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        completed: !todo.completed
      })
    })
    
    if (!response.ok) throw new Error('更新待办失败')
    const updatedTodo = await response.json()
    todo.completed = updatedTodo.completed
    return updatedTodo
  }
  
  async deleteTodo(todoId) {
    const response = await fetch(`${this.apiUrl}/todos/${todoId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) throw new Error('删除待办失败')
    this.todos = this.todos.filter(t => t.id !== todoId)
    return true
  }
}

// 使用（使用 JSONPlaceholder 作为测试 API）
const todoApp = new TodoApp('https://jsonplaceholder.typicode.com')

// 获取待办列表
todoApp.fetchTodos().then(todos => {
  console.log('待办列表:', todos.slice(0, 5))
})

// 添加待办
todoApp.addTodo('学习 JavaScript').then(todo => {
  console.log('添加的待办:', todo)
})

// 切换状态
todoApp.toggleTodo(1).then(todo => {
  console.log('更新后的待办:', todo)
})

// 删除待办
todoApp.deleteTodo(2).then(() => {
  console.log('删除成功')
})
```

</details>

---

## 下一章预告

下一章我们会学习 **模块化开发**——这是现代 JavaScript 开发的核心技术。你会学到 ES6 模块的基本语法、导出和导入、模块加载方式等。掌握这些，你就能写出结构清晰、可维护的代码了！