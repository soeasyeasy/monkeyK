---
title: "第十四章：错误处理与调试技巧"
description: "try-catch、调试工具、性能分析，写出健壮的代码"
---

# 第十四章：错误处理与调试技巧

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 代码出错了怎么办？如何优雅地处理错误？
- try-catch 怎么用？有哪些最佳实践？
- 如何自定义错误类型？
- 浏览器开发者工具怎么用？
- 如何调试异步代码？
- 如何分析代码性能？
- 如何避免常见错误？

这一章就是为了解答这些问题。我们会学习错误处理的最佳实践、调试工具的使用技巧，让你的代码更加健壮。

---

## 1 为什么需要错误处理？

### 痛点分析

想象一下，如果没有错误处理：

```javascript
// ❌ 没有错误处理：程序直接崩溃
function divide(a, b) {
  return a / b
}

const result = divide(10, 0)
console.log(result) // Infinity（不是预期的错误）

const data = JSON.parse('invalid json') // SyntaxError，程序崩溃
console.log('这行不会执行')
```

问题：
- 程序直接崩溃，用户体验差
- 难以定位问题根源
- 无法恢复或降级处理

### 解决方案

用错误处理机制：

```javascript
// ✅ 有错误处理：程序不会崩溃
function divide(a, b) {
  if (b === 0) {
    throw new Error('除数不能为零')
  }
  return a / b
}

try {
  const result = divide(10, 0)
  console.log(result)
} catch (error) {
  console.error('计算失败:', error.message)
  // 可以显示友好的错误提示
}

try {
  const data = JSON.parse('invalid json')
} catch (error) {
  console.error('JSON 解析失败:', error.message)
  // 使用默认值或降级处理
}

console.log('程序继续执行')
```

> **一句话总结**：错误处理就像汽车的安全气囊，平时不显眼，但关键时刻能保护程序不崩溃。

---

## 2 核心原理

### 错误类型

JavaScript 有多种内置错误类型：

| 错误类型 | 说明 | 示例 |
| --- | --- | --- |
| **SyntaxError** | 语法错误 | `JSON.parse('invalid')` |
| **ReferenceError** | 引用未声明的变量 | `console.log(undeclaredVar)` |
| **TypeError** | 类型错误 | `null.toString()` |
| **RangeError** | 超出范围 | `new Array(-1)` |
| **URIError** | URI 处理错误 | `decodeURIComponent('%')` |

### 错误传播

错误会沿着调用栈向上传播，直到被捕获或导致程序崩溃：

```javascript
function func1() {
  func2() // 调用 func2
}

function func2() {
  func3() // 调用 func3
}

function func3() {
  throw new Error('出错了') // 错误从这里抛出
}

// 错误传播：func3 -> func2 -> func1 -> 全局
// 如果没有 try-catch，程序崩溃
```

---

## 3 try-catch 基础用法

### 基本语法

```javascript
try {
  // 可能出错的代码
  const data = JSON.parse('{"name": "张三"}')
  console.log(data.name)
} catch (error) {
  // 错误处理
  console.error('解析失败:', error.message)
} finally {
  // 无论成功失败都会执行
  console.log('清理工作')
}
```

### 实际应用场景

```javascript
// 场景 1：网络请求
async function fetchData(url) {
  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP 错误：${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('请求失败:', error.message)
    // 返回默认值或重新抛出
    return null
  }
}

// 场景 2：本地存储
function loadUserSettings() {
  try {
    const stored = localStorage.getItem('settings')
    if (!stored) return getDefaultSettings()
    
    return JSON.parse(stored)
  } catch (error) {
    console.error('加载设置失败:', error.message)
    return getDefaultSettings()
  }
}

// 场景 3：DOM 操作
function updateElement(id, content) {
  try {
    const element = document.getElementById(id)
    if (!element) {
      throw new Error(`元素 ${id} 不存在`)
    }
    element.textContent = content
  } catch (error) {
    console.error('更新失败:', error.message)
    // 可以显示错误提示
  }
}
```

---

## 4 自定义错误

### 创建自定义错误类

```javascript
// 自定义错误类
class ValidationError extends Error {
  constructor(message, field) {
    super(message)
    this.name = 'ValidationError'
    this.field = field // 添加自定义属性
  }
}

class NetworkError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.name = 'NetworkError'
    this.statusCode = statusCode
  }
}

// 使用自定义错误
function validateUser(user) {
  if (!user.name) {
    throw new ValidationError('用户名不能为空', 'name')
  }
  if (!user.email) {
    throw new ValidationError('邮箱不能为空', 'email')
  }
}

// 捕获特定类型的错误
try {
  validateUser({ name: '', email: 'test@example.com' })
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`验证失败：${error.field} - ${error.message}`)
  } else {
    console.error('未知错误:', error)
  }
}
```

### 错误层级

```javascript
// 基础 API 错误
class ApiError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

// 继承基础错误
class AuthenticationError extends ApiError {
  constructor(message) {
    super(message, 401)
    this.name = 'AuthenticationError'
  }
}

class NotFoundError extends ApiError {
  constructor(message) {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

// 使用
async function fetchUser(id) {
  const response = await fetch(`/api/users/${id}`)
  
  if (response.status === 401) {
    throw new AuthenticationError('未授权')
  }
  if (response.status === 404) {
    throw new NotFoundError('用户不存在')
  }
  if (!response.ok) {
    throw new ApiError('请求失败', response.status)
  }
  
  return response.json()
}

// 处理不同错误
try {
  const user = await fetchUser(1)
} catch (error) {
  if (error instanceof AuthenticationError) {
    // 跳转到登录页
    window.location.href = '/login'
  } else if (error instanceof NotFoundError) {
    // 显示 404 页面
    show404Page()
  } else if (error instanceof ApiError) {
    // 显示通用错误提示
    showErrorToast(error.message)
  } else {
    // 未知错误
    console.error('未知错误:', error)
  }
}
```

---

## 5 异步错误处理

### Promise 错误处理

```javascript
// 使用 catch
fetchData()
  .then(data => console.log(data))
  .catch(error => {
    console.error('请求失败:', error)
    // 可以返回默认值
    return null
  })

// 使用 Promise.allSettled（不会因一个失败而全部失败）
Promise.allSettled([
  fetchUser(1),
  fetchUser(2),
  fetchUser(3)
]).then(results => {
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`用户 ${index + 1}:`, result.value)
    } else {
      console.error(`用户 ${index + 1} 失败:`, result.reason)
    }
  })
})
```

### async/await 错误处理

```javascript
// 方式 1：try-catch
async function loadUserData() {
  try {
    const user = await fetchUser(1)
    const posts = await fetchPosts(user.id)
    return { user, posts }
  } catch (error) {
    console.error('加载失败:', error)
    return null
  }
}

// 方式 2：封装错误处理函数
async function safeAsync(asyncFn) {
  try {
    const data = await asyncFn()
    return [null, data]
  } catch (error) {
    return [error, null]
  }
}

// 使用
async function loadUserData() {
  const [error, user] = await safeAsync(() => fetchUser(1))
  if (error) {
    console.error('获取用户失败:', error)
    return null
  }
  
  const [postsError, posts] = await safeAsync(() => fetchPosts(user.id))
  if (postsError) {
    console.error('获取文章失败:', postsError)
    return { user, posts: [] }
  }
  
  return { user, posts }
}
```

---

## 6 全局错误处理

### 未捕获的错误

```javascript
// 捕获未处理的错误
window.addEventListener('error', (event) => {
  console.error('未捕获的错误:', event.error)
  
  // 可以上报错误日志
  reportError({
    message: event.error.message,
    stack: event.error.stack,
    url: window.location.href,
    timestamp: Date.now()
  })
})

// 捕获未处理的 Promise 拒绝
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的 Promise 拒绝:', event.reason)
  
  // 阻止默认行为（控制台报错）
  event.preventDefault()
  
  // 上报错误
  reportError({
    message: event.reason.message || 'Promise 拒绝',
    stack: event.reason.stack,
    url: window.location.href,
    timestamp: Date.now()
  })
})
```

### 错误上报

```javascript
// 简单的错误上报函数
function reportError(errorInfo) {
  // 发送到错误监控服务
  fetch('/api/error-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...errorInfo,
      userAgent: navigator.userAgent,
      screen: `${window.screen.width}x${window.screen.height}`
    })
  }).catch(err => {
    // 上报失败也要处理
    console.error('错误上报失败:', err)
  })
}
```

---

## 7 调试工具使用

### 浏览器开发者工具

#### Console 面板

```javascript
// 基础输出
console.log('普通日志')
console.info('信息日志')
console.warn('警告日志')
console.error('错误日志')

// 格式化输出
console.log('用户名: %s, 年龄: %d', '张三', 25)

// 表格输出
const users = [
  { name: '张三', age: 25 },
  { name: '李四', age: 30 }
]
console.table(users)

// 分组输出
console.group('用户信息')
console.log('姓名: 张三')
console.log('年龄: 25')
console.groupEnd()

// 计时
console.time('操作耗时')
// ... 执行一些操作
console.timeEnd('操作耗时') // 输出: 操作耗时: 123.45ms

// 计数
for (let i = 0; i < 5; i++) {
  console.count('循环次数')
}
// 输出: 循环次数: 1, 循环次数: 2, ...
```

#### Debugger 语句

```javascript
function calculateTotal(items) {
  let total = 0
  
  for (const item of items) {
    debugger // 代码执行到这里会暂停
    total += item.price * item.quantity
  }
  
  return total
}

// 在开发者工具中可以：
// - 查看变量值
// - 单步执行
// - 查看调用栈
// - 监视表达式
```

#### 断点调试

```javascript
// 条件断点（在开发者工具中设置）
// 右键点击行号 -> Add conditional breakpoint
// 输入条件：user.id === 1

function processUser(user) {
  // 只有当 user.id === 1 时才暂停
  console.log('处理用户:', user.name)
  // ...
}

// DOM 断点
// 在 Elements 面板右键元素 -> Break on -> subtree modifications
// 当 DOM 被修改时会暂停
```

---

## 8 性能分析

### Console 性能分析

```javascript
// 标记性能分析的起点
console.profile('性能分析')

// 执行需要分析的代码
function heavyComputation() {
  const result = []
  for (let i = 0; i < 1000000; i++) {
    result.push(i * 2)
  }
  return result
}

heavyComputation()

// 标记性能分析的终点
console.profileEnd('性能分析')
// 在 Performance 面板查看结果
```

### Performance API

```javascript
// 测量代码执行时间
const start = performance.now()

// 执行代码
const data = processData(largeArray)

const end = performance.now()
const duration = end - start

console.log(`处理耗时: ${duration.toFixed(2)}ms`)

// 使用 Performance.mark
performance.mark('start-processing')
processData(largeArray)
performance.mark('end-processing')

performance.measure('processing-duration', 'start-processing', 'end-processing')

const measure = performance.getEntriesByName('processing-duration')[0]
console.log(`处理耗时: ${measure.duration.toFixed(2)}ms`)
```

### 内存分析

```javascript
// 查看内存使用
console.log(`JS 堆大小: ${performance.memory.usedJSHeapSize / 1024 / 1024}MB`)

// 检测内存泄漏
function createLeak() {
  const leakedData = []
  
  setInterval(() => {
    // 每次添加数据，但永远不会释放
    leakedData.push(new Array(1000).fill('leak'))
  }, 100)
}

// 在 Memory 面板可以查看内存快照
// 对比多个快照，找出增长的对象
```

---

## 9 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| `try-catch-finally` | 捕获和处理错误 |
| `throw` | 抛出错误 |
| `Error` | 错误对象 |
| 自定义错误 | 继承 Error 类 |
| `window.onerror` | 全局错误捕获 |
| `unhandledrejection` | Promise 拒绝捕获 |
| `console.log` | 日志输出 |
| `debugger` | 断点调试 |
| `performance.now()` | 性能测量 |

---

## 10 新手常见误区

### 误区 1：catch 块可以省略

**错！** catch 块必须存在，但可以省略 finally。

```javascript
// ❌ 错误：缺少 catch 块
try {
  doSomething()
} finally {
  cleanup()
}
// SyntaxError: Missing catch or finally after try

// ✅ 正确：必须有 catch
try {
  doSomething()
} catch (error) {
  handleError(error)
}
```

### 误区 2：catch 的参数可以省略

**在旧版本中不可以！** 新版本可以省略。

```javascript
// ❌ 旧版本错误：必须提供参数
try {
  doSomething()
} catch {
  // ES2019 之前必须 catch (error)
}

// ✅ 新版本可以省略（ES2019+）
try {
  doSomething()
} catch {
  console.error('出错了')
}
```

### 误区 3：try 中的 return 不会被执行

**错！** try 中的 return 会执行，但 finally 中的代码会先执行。

```javascript
function test() {
  try {
    console.log('try')
    return 'from try'
  } finally {
    console.log('finally')
  }
}

const result = test()
// 输出顺序：try, finally
console.log(result) // 'from try'
```

### 误区 4：异步错误可以用 try-catch 捕获

**错！** 异步错误需要特殊处理。

```javascript
// ❌ 错误：无法捕获异步错误
try {
  setTimeout(() => {
    throw new Error('异步错误')
  }, 100)
} catch (error) {
  console.error('捕获不到') // 不会执行
}

// ✅ 正确：在异步代码内部捕获
setTimeout(() => {
  try {
    throw new Error('异步错误')
  } catch (error) {
    console.error('捕获到了:', error.message)
  }
}, 100)

// ✅ 正确：使用 Promise
async function asyncFunc() {
  try {
    await someAsyncOperation()
  } catch (error) {
    console.error('捕获到了:', error.message)
  }
}
```

### 误区 5：错误处理会影响性能

**对，但影响很小！** 只有在抛出错误时才有性能开销。

```javascript
// ✅ 好：只在必要时抛出错误
function divide(a, b) {
  if (b === 0) {
    throw new Error('除数不能为零') // 只在 b=0 时有开销
  }
  return a / b
}

// ❌ 不好：用错误处理控制流程
function process(data) {
  try {
    return data.value.nested.property
  } catch {
    return defaultValue // 用错误处理代替条件判断，性能差
  }
}

// ✅ 好：用条件判断
function process(data) {
  if (data?.value?.nested?.property) {
    return data.value.nested.property
  }
  return defaultValue
}
```

---

## 11 动手练习

### 练习 1：基础练习

实现一个安全的 JSON 解析函数，处理各种异常情况。

<details>
<summary>点击查看答案</summary>

```javascript
function safeJsonParse(jsonString, defaultValue = null) {
  try {
    // 检查输入是否为字符串
    if (typeof jsonString !== 'string') {
      throw new TypeError('输入必须是字符串')
    }
    
    // 检查是否为空字符串
    if (jsonString.trim() === '') {
      throw new Error('JSON 字符串不能为空')
    }
    
    // 尝试解析
    const parsed = JSON.parse(jsonString)
    return parsed
  } catch (error) {
    // 记录错误
    console.error('JSON 解析失败:', error.message)
    
    // 返回默认值
    return defaultValue
  }
}

// 测试
console.log(safeJsonParse('{"name": "张三"}')) // { name: '张三' }
console.log(safeJsonParse('invalid json')) // null
console.log(safeJsonParse('')) // null
console.log(safeJsonParse(null)) // null
console.log(safeJsonParse('invalid', { default: true })) // { default: true }
```

</details>

### 练习 2：进阶练习

实现一个带重试机制的异步请求函数。

<details>
<summary>点击查看答案</summary>

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`尝试第 ${attempt} 次请求...`)
      
      const response = await fetch(url, options)
      
      if (!response.ok) {
        throw new Error(`HTTP 错误：${response.status}`)
      }
      
      const data = await response.json()
      console.log('请求成功')
      return data
    } catch (error) {
      lastError = error
      console.error(`第 ${attempt} 次请求失败:`, error.message)
      
      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxRetries) {
        const delay = attempt * 1000 // 递增延迟
        console.log(`等待 ${delay}ms 后重试...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  // 所有重试都失败
  throw new Error(`请求失败（已重试 ${maxRetries} 次）: ${lastError.message}`)
}

// 使用
async function loadUserData() {
  try {
    const data = await fetchWithRetry(
      'https://api.example.com/users/1',
      {},
      3
    )
    console.log('用户数据:', data)
  } catch (error) {
    console.error('最终失败:', error.message)
    // 显示错误提示或使用默认数据
  }
}

loadUserData()
```

</details>

### 练习 3（挑战）：综合练习

实现一个完整的错误监控系统。

<details>
<summary>点击查看答案</summary>

```javascript
class ErrorMonitor {
  constructor(options = {}) {
    this.reportUrl = options.reportUrl || '/api/errors'
    this.enableConsole = options.enableConsole !== false
    this.maxErrors = options.maxErrors || 10
    this.errorQueue = []
    
    this.setupGlobalHandlers()
  }
  
  // 设置全局错误处理
  setupGlobalHandlers() {
    // 捕获同步错误
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'error',
        message: event.error?.message || event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        url: window.location.href,
        timestamp: Date.now()
      })
    })
    
    // 捕获 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'unhandledrejection',
        message: event.reason?.message || 'Promise 拒绝',
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: Date.now()
      })
      
      event.preventDefault()
    })
  }
  
  // 处理错误
  handleError(errorInfo) {
    // 控制台输出
    if (this.enableConsole) {
      console.error('错误监控:', errorInfo)
    }
    
    // 加入队列
    this.errorQueue.push(errorInfo)
    
    // 限制队列大小
    if (this.errorQueue.length > this.maxErrors) {
      this.errorQueue.shift()
    }
    
    // 上报错误
    this.reportError(errorInfo)
  }
  
  // 上报错误
  async reportError(errorInfo) {
    try {
      await fetch(this.reportUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...errorInfo,
          userAgent: navigator.userAgent,
          screen: `${window.screen.width}x${window.screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`
        })
      })
    } catch (err) {
      // 上报失败，保存到本地存储
      this.saveToLocal(errorInfo)
    }
  }
  
  // 保存到本地存储
  saveToLocal(errorInfo) {
    try {
      const stored = localStorage.getItem('error_queue') || '[]'
      const queue = JSON.parse(stored)
      queue.push(errorInfo)
      
      // 限制存储大小
      if (queue.length > 100) {
        queue.shift()
      }
      
      localStorage.setItem('error_queue', JSON.stringify(queue))
    } catch (e) {
      console.error('保存错误到本地失败:', e)
    }
  }
  
  // 手动上报本地存储的错误
  async flushLocalErrors() {
    try {
      const stored = localStorage.getItem('error_queue') || '[]'
      const queue = JSON.parse(stored)
      
      if (queue.length === 0) return
      
      for (const error of queue) {
        await this.reportError(error)
      }
      
      localStorage.removeItem('error_queue')
      console.log(`已上报 ${queue.length} 个本地错误`)
    } catch (error) {
      console.error('上报本地错误失败:', error)
    }
  }
  
  // 获取错误统计
  getStats() {
    return {
      totalErrors: this.errorQueue.length,
      errors: this.errorQueue,
      lastError: this.errorQueue[this.errorQueue.length - 1]
    }
  }
}

// 使用
const errorMonitor = new ErrorMonitor({
  reportUrl: 'https://api.example.com/error-report',
  enableConsole: true,
  maxErrors: 20
})

// 页面加载时上报本地存储的错误
window.addEventListener('load', () => {
  errorMonitor.flushLocalErrors()
})

// 测试错误捕获
setTimeout(() => {
  throw new Error('测试同步错误')
}, 1000)

Promise.reject(new Error('测试 Promise 错误'))

// 查看错误统计
setTimeout(() => {
  console.log('错误统计:', errorMonitor.getStats())
}, 2000)
```

</details>

---

## 下一章预告

下一章我们会学习 **性能优化最佳实践**——让你的代码跑得更快。你会学到 DOM 优化、内存管理、懒加载等技术。掌握这些，你的应用就能流畅运行，用户体验大幅提升！
