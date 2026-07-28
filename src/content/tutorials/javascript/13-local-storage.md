---
title: "第十三章：本地存储与数据持久化"
description: "localStorage、sessionStorage、IndexedDB，让数据在浏览器中保存"
---

# 第十三章：本地存储与数据持久化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是本地存储？为什么需要它？
- localStorage 和 sessionStorage 有什么区别？
- 如何存储和读取数据？
- 存储的数据会过期吗？
- 如何存储复杂的数据（对象、数组）？
- localStorage 有什么限制？
- IndexedDB 是什么？什么时候用？

这一章就是为了解答这些问题。我们会学习浏览器提供的本地存储方案，让你的应用能够记住用户的数据。

---

## 1 为什么需要本地存储？

### 痛点分析

想象一下，如果没有本地存储：

```javascript
// ❌ 没有本地存储：刷新页面数据就丢失
let todos = []

function addTodo(text) {
  todos.push({ id: Date.now(), text, done: false })
}

addTodo('学习 JavaScript')
console.log(todos) // 有数据

// 用户刷新页面后...
console.log(todos) // [] 数据没了！
```

问题：
- 用户数据无法保存
- 每次刷新都要重新加载
- 用户体验极差

### 解决方案

用本地存储保存数据：

```javascript
// ✅ 使用 localStorage：刷新后数据还在
let todos = JSON.parse(localStorage.getItem('todos') || '[]')

function addTodo(text) {
  todos.push({ id: Date.now(), text, done: false })
  localStorage.setItem('todos', JSON.stringify(todos))
}

addTodo('学习 JavaScript')
console.log(todos) // 有数据

// 用户刷新页面后...
todos = JSON.parse(localStorage.getItem('todos') || '[]')
console.log(todos) // 数据还在！
```

> **一句话总结**：本地存储就像浏览器的"小本本"，帮你记住用户的数据，即使关闭浏览器也不会丢失。

---

## 2 核心原理

### Web Storage API

浏览器提供了两种 Web Storage：

| 特性 | localStorage | sessionStorage |
| --- | --- | --- |
| **生命周期** | 永久（除非手动清除） | 会话级别（关闭标签页就清除） |
| **作用域** | 同源的所有标签页共享 | 仅当前标签页 |
| **存储大小** | 约 5-10MB | 约 5-10MB |
| **使用场景** | 长期保存的数据（用户偏好、主题设置） | 临时数据（表单数据、购物车） |

打个比方：

> - **localStorage** 像你的日记本，一直保存，随时可以翻看
> - **sessionStorage** 像便签纸，用完就扔，关闭浏览器就消失

### 存储限制

- **大小限制**：约 5-10MB（不同浏览器略有差异）
- **数据类型**：只能存储字符串
- **同步操作**：存储操作是同步的，大量数据可能影响性能

---

## 3 localStorage 基础用法

### 存储数据

```javascript
// 存储字符串
localStorage.setItem('username', '张三')

// 存储数字（会自动转为字符串）
localStorage.setItem('age', '25')

// 存储布尔值（会自动转为字符串）
localStorage.setItem('isLoggedIn', 'true')

// 存储对象（需要先转为 JSON 字符串）
const user = { name: '张三', age: 25 }
localStorage.setItem('user', JSON.stringify(user))

// 存储数组
const todos = ['学习', '工作', '运动']
localStorage.setItem('todos', JSON.stringify(todos))
```

### 读取数据

```javascript
// 读取字符串
const username = localStorage.getItem('username')
console.log(username) // '张三'

// 读取数字（需要转换）
const age = Number(localStorage.getItem('age'))
console.log(age) // 25

// 读取布尔值（需要转换）
const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
console.log(isLoggedIn) // true

// 读取对象（需要解析 JSON）
const user = JSON.parse(localStorage.getItem('user'))
console.log(user.name) // '张三'

// 读取数组（需要解析 JSON）
const todos = JSON.parse(localStorage.getItem('todos'))
console.log(todos[0]) // '学习'
```

### 删除数据

```javascript
// 删除单个键值对
localStorage.removeItem('username')

// 清除所有数据
localStorage.clear()
```

### 其他操作

```javascript
// 获取存储的键名数量
console.log(localStorage.length) // 3

// 获取指定索引的键名
const key = localStorage.key(0)
console.log(key) // 'age'

// 检查某个键是否存在
const hasUsername = localStorage.getItem('username') !== null
console.log(hasUsername) // true
```

---

## 4 sessionStorage 用法

### 基本用法

```javascript
// 存储数据
sessionStorage.setItem('tempData', '临时数据')

// 读取数据
const tempData = sessionStorage.getItem('tempData')
console.log(tempData) // '临时数据'

// 删除数据
sessionStorage.removeItem('tempData')

// 清除所有数据
sessionStorage.clear()
```

### 与 localStorage 的区别

```javascript
// localStorage：所有标签页共享
localStorage.setItem('shared', '共享数据')
// 在其他标签页也能读取到

// sessionStorage：仅当前标签页
sessionStorage.setItem('private', '私有数据')
// 在其他标签页读取不到
```

---

## 5 封装存储工具

### 创建存储类

```javascript
class Storage {
  constructor(prefix = '') {
    this.prefix = prefix // 添加前缀，避免冲突
  }
  
  // 生成完整的键名
  _getKey(key) {
    return this.prefix ? `${this.prefix}_${key}` : key
  }
  
  // 存储数据
  set(key, value) {
    const fullKey = this._getKey(key)
    const stringValue = JSON.stringify(value)
    localStorage.setItem(fullKey, stringValue)
  }
  
  // 读取数据
  get(key, defaultValue = null) {
    const fullKey = this._getKey(key)
    const stringValue = localStorage.getItem(fullKey)
    
    if (stringValue === null) {
      return defaultValue
    }
    
    try {
      return JSON.parse(stringValue)
    } catch (error) {
      console.error('解析存储数据失败:', error)
      return defaultValue
    }
  }
  
  // 删除数据
  remove(key) {
    const fullKey = this._getKey(key)
    localStorage.removeItem(fullKey)
  }
  
  // 清除所有数据（带前缀的）
  clear() {
    if (!this.prefix) {
      localStorage.clear()
      return
    }
    
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(`${this.prefix}_`)) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }
  
  // 检查键是否存在
  has(key) {
    const fullKey = this._getKey(key)
    return localStorage.getItem(fullKey) !== null
  }
}

// 使用
const userStorage = new Storage('user')

// 存储用户信息
userStorage.set('profile', { name: '张三', age: 25 })
userStorage.set('settings', { theme: 'dark', language: 'zh-CN' })

// 读取用户信息
const profile = userStorage.get('profile')
console.log(profile.name) // '张三'

// 删除用户信息
userStorage.remove('profile')

// 清除所有用户数据
userStorage.clear()
```

---

## 6 带过期时间的存储

### 实现过期机制

```javascript
class ExpiringStorage {
  set(key, value, ttl = 3600000) {
    // ttl: 过期时间（毫秒），默认 1 小时
    const item = {
      value: value,
      expiry: Date.now() + ttl
    }
    localStorage.setItem(key, JSON.stringify(item))
  }
  
  get(key) {
    const itemStr = localStorage.getItem(key)
    
    if (!itemStr) {
      return null
    }
    
    const item = JSON.parse(itemStr)
    const now = Date.now()
    
    // 检查是否过期
    if (now > item.expiry) {
      localStorage.removeItem(key)
      return null
    }
    
    return item.value
  }
}

// 使用
const storage = new ExpiringStorage()

// 存储数据，1 小时后过期
storage.set('token', 'abc123', 3600000)

// 1 小时内读取
console.log(storage.get('token')) // 'abc123'

// 1 小时后读取
console.log(storage.get('token')) // null（已过期）
```

---

## 7 监听存储变化

### storage 事件

```javascript
// 监听 localStorage 变化（仅在其他标签页修改时触发）
window.addEventListener('storage', (event) => {
  console.log('键名:', event.key)
  console.log('旧值:', event.oldValue)
  console.log('新值:', event.newValue)
  console.log('URL:', event.url)
})

// 在其他标签页修改数据
localStorage.setItem('username', '李四')
// 当前标签页会触发 storage 事件
```

### 注意事项

- `storage` 事件**不会**在修改数据的标签页触发
- 只在**同源**的其他标签页触发
- 可以用来实现多标签页数据同步

---

## 8 IndexedDB 简介

### 什么是 IndexedDB

IndexedDB 是浏览器提供的**本地数据库**，适合存储大量结构化数据：

| 特性 | Web Storage | IndexedDB |
| --- | --- | --- |
| **存储大小** | 5-10MB | 几百MB甚至GB |
| **数据类型** | 字符串 | 任意类型（对象、数组、文件） |
| **查询方式** | 键值对 | 索引、游标、事务 |
| **异步操作** | 同步 | 异步 |
| **使用复杂度** | 简单 | 复杂 |

### 基本用法

```javascript
// 打开数据库
const request = indexedDB.open('MyDatabase', 1)

// 数据库升级（创建或更新结构）
request.onupgradeneeded = (event) => {
  const db = event.target.result
  
  // 创建对象存储（类似表）
  if (!db.objectStoreNames.contains('users')) {
    const store = db.createObjectStore('users', { keyPath: 'id' })
    
    // 创建索引
    store.createIndex('name', 'name', { unique: false })
    store.createIndex('email', 'email', { unique: true })
  }
}

// 打开成功
request.onsuccess = (event) => {
  const db = event.target.result
  
  // 添加数据
  const transaction = db.transaction(['users'], 'readwrite')
  const store = transaction.objectStore('users')
  
  store.add({ id: 1, name: '张三', email: 'zhangsan@example.com' })
  
  transaction.oncomplete = () => {
    console.log('数据添加成功')
  }
  
  transaction.onerror = (event) => {
    console.error('添加失败:', event.target.error)
  }
}

// 打开失败
request.onerror = (event) => {
  console.error('数据库打开失败:', event.target.error)
}
```

### 使用场景

- 需要存储大量数据（> 5MB）
- 需要复杂查询（索引、范围查询）
- 需要存储文件（Blob、ArrayBuffer）
- 需要离线应用支持

---

## 9 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| `localStorage` | 永久存储，同源共享 |
| `sessionStorage` | 会话存储，仅当前标签页 |
| `setItem()` | 存储数据 |
| `getItem()` | 读取数据 |
| `removeItem()` | 删除数据 |
| `clear()` | 清除所有数据 |
| `JSON.stringify()` | 对象转字符串 |
| `JSON.parse()` | 字符串转对象 |
| `storage` 事件 | 监听存储变化 |
| IndexedDB | 本地数据库，适合大量数据 |

---

## 10 新手常见误区

### 误区 1：可以直接存储对象

**错！** localStorage 只能存储字符串。

```javascript
// ❌ 错误：直接存储对象
const user = { name: '张三', age: 25 }
localStorage.setItem('user', user)
console.log(localStorage.getItem('user')) // '[object Object]'

// ✅ 正确：先转为 JSON 字符串
const user = { name: '张三', age: 25 }
localStorage.setItem('user', JSON.stringify(user))
const stored = JSON.parse(localStorage.getItem('user'))
console.log(stored.name) // '张三'
```

### 误区 2：存储的数字可以直接使用

**错！** 读取出来是字符串，需要转换。

```javascript
// 存储数字
localStorage.setItem('count', 100)

// ❌ 错误：直接使用
const count = localStorage.getItem('count')
console.log(count + 1) // '1001'（字符串拼接）

// ✅ 正确：转换为数字
const count = Number(localStorage.getItem('count'))
console.log(count + 1) // 101
```

### 误区 3：localStorage 会过期

**错！** localStorage 是永久的，除非手动清除。

```javascript
// localStorage 不会自动过期
localStorage.setItem('data', '永久数据')

// 关闭浏览器后，数据还在
// 重启浏览器后，数据还在
// 只有手动清除或代码删除才会消失

// sessionStorage 会在关闭标签页后清除
sessionStorage.setItem('temp', '临时数据')
// 关闭标签页后，数据消失
```

### 误区 4：所有标签页的 sessionStorage 共享

**错！** sessionStorage 仅当前标签页可用。

```javascript
// 标签页 A
sessionStorage.setItem('data', '数据')

// 标签页 B（即使是同源）
console.log(sessionStorage.getItem('data')) // null

// localStorage 才是共享的
localStorage.setItem('shared', '共享数据')
// 标签页 B 可以读取到
```

### 误区 5：存储大量数据不会影响性能

**错！** 大量同步存储操作会阻塞主线程。

```javascript
// ❌ 不好：大量同步操作
for (let i = 0; i < 10000; i++) {
  localStorage.setItem(`key_${i}`, `value_${i}`) // 可能卡顿
}

// ✅ 好：分批处理或使用 IndexedDB
// 或者使用 requestIdleCallback 在空闲时执行
function saveData(data) {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      localStorage.setItem('data', JSON.stringify(data))
    })
  } else {
    setTimeout(() => {
      localStorage.setItem('data', JSON.stringify(data))
    }, 0)
  }
}
```

---

## 11 动手练习

### 练习 1：基础练习

实现一个简单的待办事项应用，使用 localStorage 保存数据。

<details>
<summary>点击查看答案</summary>

```javascript
class TodoApp {
  constructor() {
    this.todos = this.loadTodos()
  }
  
  // 从 localStorage 加载待办
  loadTodos() {
    const stored = localStorage.getItem('todos')
    return stored ? JSON.parse(stored) : []
  }
  
  // 保存到 localStorage
  saveTodos() {
    localStorage.setItem('todos', JSON.stringify(this.todos))
  }
  
  // 添加待办
  addTodo(text) {
    const todo = {
      id: Date.now(),
      text: text,
      done: false,
      createdAt: new Date().toISOString()
    }
    
    this.todos.push(todo)
    this.saveTodos()
    return todo
  }
  
  // 切换完成状态
  toggleTodo(id) {
    const todo = this.todos.find(t => t.id === id)
    if (todo) {
      todo.done = !todo.done
      this.saveTodos()
    }
    return todo
  }
  
  // 删除待办
  deleteTodo(id) {
    this.todos = this.todos.filter(t => t.id !== id)
    this.saveTodos()
  }
  
  // 获取所有待办
  getAllTodos() {
    return this.todos
  }
  
  // 获取未完成的待办数量
  getPendingCount() {
    return this.todos.filter(t => !t.done).length
  }
}

// 使用
const app = new TodoApp()

// 添加待办
app.addTodo('学习 JavaScript')
app.addTodo('学习 localStorage')
app.addTodo('完成练习')

// 查看所有待办
console.log(app.getAllTodos())

// 切换完成状态
app.toggleTodo(app.todos[0].id)

// 查看未完成数量
console.log('未完成:', app.getPendingCount())

// 删除待办
app.deleteTodo(app.todos[1].id)

// 刷新页面后，数据还在
console.log('刷新后:', app.getAllTodos())
```

</details>

### 练习 2：进阶练习

实现一个带过期时间的存储工具。

<details>
<summary>点击查看答案</summary>

```javascript
class CacheStorage {
  constructor(prefix = 'cache') {
    this.prefix = prefix
  }
  
  // 生成键名
  _getKey(key) {
    return `${this.prefix}_${key}`
  }
  
  // 设置缓存
  set(key, value, ttl = 3600000) {
    const fullKey = this._getKey(key)
    const item = {
      value: value,
      expiry: Date.now() + ttl,
      createdAt: Date.now()
    }
    localStorage.setItem(fullKey, JSON.stringify(item))
  }
  
  // 获取缓存
  get(key) {
    const fullKey = this._getKey(key)
    const itemStr = localStorage.getItem(fullKey)
    
    if (!itemStr) {
      return null
    }
    
    try {
      const item = JSON.parse(itemStr)
      
      // 检查是否过期
      if (Date.now() > item.expiry) {
        this.remove(key)
        return null
      }
      
      return item.value
    } catch (error) {
      console.error('解析缓存失败:', error)
      return null
    }
  }
  
  // 删除缓存
  remove(key) {
    const fullKey = this._getKey(key)
    localStorage.removeItem(fullKey)
  }
  
  // 检查缓存是否存在且有效
  has(key) {
    return this.get(key) !== null
  }
  
  // 清除所有缓存
  clear() {
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(`${this.prefix}_`)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }
  
  // 清理过期缓存
  cleanup() {
    const now = Date.now()
    const keysToRemove = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(`${this.prefix}_`)) {
        try {
          const itemStr = localStorage.getItem(key)
          const item = JSON.parse(itemStr)
          if (now > item.expiry) {
            keysToRemove.push(key)
          }
        } catch (error) {
          keysToRemove.push(key)
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    return keysToRemove.length
  }
}

// 使用
const cache = new CacheStorage('api')

// 缓存用户数据，5 分钟后过期
cache.set('user', { name: '张三', age: 25 }, 300000)

// 5 分钟内读取
console.log(cache.get('user')) // { name: '张三', age: 25 }

// 5 分钟后读取
console.log(cache.get('user')) // null（已过期）

// 清理所有过期缓存
const cleaned = cache.cleanup()
console.log(`清理了 ${cleaned} 个过期缓存`)
```

</details>

### 练习 3（挑战）：综合练习

实现一个多标签页同步的待办事项应用。

<details>
<summary>点击查看答案</summary>

```javascript
class SyncedTodoApp {
  constructor() {
    this.todos = this.loadTodos()
    this.setupSync()
  }
  
  // 加载待办
  loadTodos() {
    const stored = localStorage.getItem('synced_todos')
    return stored ? JSON.parse(stored) : []
  }
  
  // 保存待办
  saveTodos() {
    localStorage.setItem('synced_todos', JSON.stringify(this.todos))
  }
  
  // 设置多标签页同步
  setupSync() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'synced_todos') {
        // 其他标签页修改了数据，同步更新
        this.todos = event.newValue ? JSON.parse(event.newValue) : []
        this.render()
      }
    })
  }
  
  // 添加待办
  addTodo(text) {
    const todo = {
      id: Date.now(),
      text: text,
      done: false,
      createdAt: new Date().toISOString()
    }
    
    this.todos.push(todo)
    this.saveTodos()
    this.render()
    return todo
  }
  
  // 切换完成状态
  toggleTodo(id) {
    const todo = this.todos.find(t => t.id === id)
    if (todo) {
      todo.done = !todo.done
      this.saveTodos()
      this.render()
    }
  }
  
  // 删除待办
  deleteTodo(id) {
    this.todos = this.todos.filter(t => t.id !== id)
    this.saveTodos()
    this.render()
  }
  
  // 渲染（简化版）
  render() {
    console.log('=== 待办列表 ===')
    this.todos.forEach(todo => {
      const status = todo.done ? '✓' : '○'
      console.log(`${status} ${todo.text}`)
    })
    console.log(`总计: ${this.todos.length} 个待办`)
  }
}

// 使用
const app = new SyncedTodoApp()

// 在标签页 A 中添加待办
app.addTodo('学习多标签页同步')
app.addTodo('完成练习')

// 在标签页 B 中，会自动显示这些待办
// 在标签页 B 中修改，标签页 A 也会自动更新

// 测试：打开两个标签页，在一个中添加/删除待办，观察另一个的变化
```

</details>

---

## 下一章预告

下一章我们会学习 **错误处理与调试技巧**——让你的代码更加健壮。你会学到 try-catch 的使用、调试工具的技巧、性能分析方法等。掌握这些，你就能快速定位和解决问题了！
