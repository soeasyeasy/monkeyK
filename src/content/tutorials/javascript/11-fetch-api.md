---
title: "第十一章：Fetch API"
description: "网络请求、响应处理、错误处理"
---

# 第十一章：Fetch API

## 基本用法

```javascript
// GET 请求
fetch('https://api.example.com/data')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('错误:', error))
```

## async/await 语法

```javascript
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data')
    const data = await response.json()
    console.log(data)
  } catch (error) {
    console.error('错误:', error)
  }
}
```

## 响应对象

```javascript
async function checkResponse() {
  const response = await fetch('https://api.example.com/data')
  
  console.log(response.ok)          // true/false
  console.log(response.status)      // 200, 404, 500 等
  console.log(response.statusText)  // 'OK', 'Not Found' 等
  console.log(response.headers)     // Headers 对象
  
  // 解析响应
  const data = await response.json()
  // 或
  const text = await response.text()
  // 或
  const blob = await response.blob()
}
```

## POST 请求

```javascript
async function postData() {
  const data = { name: '张三', age: 25 }
  
  try {
    const response = await fetch('https://api.example.com/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP 错误: ${response.status}`)
    }
    
    const result = await response.json()
    console.log(result)
  } catch (error) {
    console.error('错误:', error)
  }
}
```

## 请求配置

```javascript
const options = {
  method: 'POST',      // GET, POST, PUT, DELETE, PATCH
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  },
  body: JSON.stringify(data),
  mode: 'cors',        // cors, no-cors, same-origin
  cache: 'no-cache',   // default, no-cache, reload, force-cache
  credentials: 'same-origin', // include, same-origin, omit
  redirect: 'follow',  // follow, error, manual
  referrerPolicy: 'no-referrer'
}

fetch(url, options)
```

## PUT 和 DELETE

```javascript
// PUT 更新
async function updateUser(id, data) {
  const response = await fetch(`https://api.example.com/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return response.json()
}

// DELETE 删除
async function deleteUser(id) {
  const response = await fetch(`https://api.example.com/users/${id}`, {
    method: 'DELETE'
  })
  return response.ok
}
```

## 错误处理

```javascript
async function fetchWithErrorHandling() {
  try {
    const response = await fetch('https://api.example.com/data')
    
    // 检查 HTTP 状态
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('请求被取消')
    } else if (error.name === 'TypeError') {
      console.error('网络错误')
    } else {
      console.error('其他错误:', error)
    }
    throw error
  }
}
```

## 请求取消

```javascript
const controller = new AbortController()
const signal = controller.signal

// 发起请求
const fetchPromise = fetch('https://api.example.com/data', { signal })

// 取消请求
controller.abort()

// 带超时的取消
function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  return fetch(url, { signal: controller.signal })
    .finally(() => clearTimeout(timeoutId))
}
```

## 封装请求

```javascript
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }
    
    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API 错误:', error)
      throw error
    }
  }
  
  get(endpoint) {
    return this.request(endpoint)
  }
  
  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }
  
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }
}

// 使用
const api = new ApiClient('https://api.example.com')
const users = await api.get('/users')
```

## 总结

Fetch API 是现代浏览器内置的网络请求方法。推荐使用 async/await 语法，并封装统一的请求处理。
