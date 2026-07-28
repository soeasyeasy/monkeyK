---
title: "第十章：异步编程"
description: "回调、Promise、async/await，掌握 JavaScript 异步编程核心"
---

# 第十章：异步编程

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是异步？和同步有什么区别？
- 为什么需要异步编程？
- 回调函数是什么？回调地狱是什么？
- Promise 是什么？怎么用？
- async/await 是什么？和 Promise 有什么关系？
- 如何处理异步中的错误？

这一章就是为了解答这些问题。我们会从同步与异步的区别开始，逐步学习回调函数、Promise、async/await，最终掌握现代 JavaScript 异步编程的核心技术。

---

## 1 为什么需要异步编程？

### 痛点分析

想象一下，如果没有异步，所有操作都要排队等待：

```javascript
// ❌ 同步方式：必须等一个操作完成才能进行下一个
console.log('1. 开始加载用户数据')
const user = loadUserFromServer() // 假设需要 3 秒
console.log('2. 用户数据:', user) // 3 秒后才能执行
console.log('3. 开始加载订单')
const orders = loadOrdersFromServer() // 又需要 3 秒
console.log('4. 订单数据:', orders) // 又等 3 秒
console.log('5. 完成') // 总共需要 6 秒
```

问题：
- 页面会卡住，用户无法操作
- 用户体验极差
- 浪费时间

### 解决方案

用异步方式处理耗时操作：

```javascript
// ✅ 异步方式：不阻塞主线程
console.log('1. 开始加载用户数据')
loadUserFromServerAsync((user) => {
  console.log('2. 用户数据:', user)
})
console.log('3. 继续执行其他代码') // 不用等，立即执行
console.log('4. 页面可以响应用户操作')
// 3 秒后，回调函数执行
// 输出：1, 3, 4, 2
```

> **一句话总结**：异步就像餐厅服务员，点完菜后不用站在厨房等，可以先服务其他客人，菜好了再端上来。

---

## 2 核心原理

### 同步 vs 异步

**同步**：代码按顺序执行，前一行执行完才能执行下一行

```javascript
// 同步：像排队买票，必须等前面的人买完
console.log('1')
console.log('2')
console.log('3')
// 输出：1, 2, 3（按顺序）
```

**异步**：代码可以跳过耗时操作，先执行后面的代码

```javascript
// 异步：像餐厅点餐，点完可以先做其他事
console.log('1')
setTimeout(() => console.log('2'), 1000) // 1 秒后执行
console.log('3')
// 输出：1, 3, 2（2 被跳过了）
```

打个比方：

> 想象你去银行办业务：
> - **同步**：排队等前面的人办完，你才能开始办
> - **异步**：取个号，然后可以去逛商场，叫到你的号再回来办

### JavaScript 的执行机制

JavaScript 是**单线程**的，同一时间只能做一件事。通过**事件循环**（Event Loop）实现异步：

| 组成部分 | 作用 |
| --- | --- |
| **调用栈** | 执行同步代码 |
| **Web APIs** | 处理异步操作（定时器、网络请求等） |
| **任务队列** | 存放待执行的回调函数 |
| **事件循环** | 检查调用栈是否为空，空了就把任务队列的回调放入调用栈 |

---

## 3 回调函数

### 基本用法

回调函数是异步的最基础形式：

```javascript
// 定义一个异步函数，接受回调参数
function fetchData(callback) {
  // 模拟网络请求，1 秒后返回数据
  setTimeout(() => {
    const data = { name: '张三', age: 25 }
    callback(data) // 数据准备好后，调用回调函数
  }, 1000)
}

// 使用：传入回调函数
fetchData((data) => {
  console.log('数据获取成功:', data)
})

console.log('请求已发送，等待中...') // 这行会先执行
```

### 回调地狱

当多个异步操作有依赖关系时，会出现嵌套过深的问题：

```javascript
// ❌ 回调地狱：嵌套太深，难以维护
getUser((user) => {
  getOrders(user.id, (orders) => {
    getOrderDetails(orders[0].id, (details) => {
      getShippingInfo(details.shippingId, (shipping) => {
        console.log('物流信息:', shipping)
        // 还要继续嵌套...
      })
    })
  })
})
```

问题：
- 代码难以阅读和理解
- 难以添加错误处理
- 难以维护和扩展

---

## 4 Promise

### 什么是 Promise

Promise 是异步编程的解决方案，代表一个异步操作的最终完成（或失败）。

```javascript
// 创建 Promise
const promise = new Promise((resolve, reject) => {
  // resolve：成功时调用
  // reject：失败时调用
  
  setTimeout(() => {
    const success = true
    if (success) {
      resolve('数据获取成功') // 成功，传递结果
    } else {
      reject('获取失败') // 失败，传递错误
    }
  }, 1000)
})

// Promise 的三种状态
// - pending（进行中）
// - fulfilled（已成功）
// - rejected（已失败）
```

打个比方：

> Promise 就像外卖订单：
> - 下单后是 **pending**（等待中）
> - 商家接单送达是 **fulfilled**（成功）
> - 商家取消订单是 **rejected**（失败）

### 使用 Promise

```javascript
// 使用 then 处理成功，catch 处理失败
promise
  .then((data) => {
    console.log('成功:', data)
  })
  .catch((error) => {
    console.error('失败:', error)
  })
  .finally(() => {
    console.log('无论成功失败都会执行')
  })
```

### Promise 链式调用

解决回调地狱的问题：

```javascript
// 将回调函数改为返回 Promise
function getUser() {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ id: 1, name: '张三' }), 500)
  })
}

function getOrders(userId) {
  return new Promise((resolve) => {
    setTimeout(() => resolve([{ id: 101, userId }]), 500)
  })
}

function getOrderDetails(orderId) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ id: orderId, status: '已完成' }), 500)
  })
}

// ✅ 链式调用：扁平化，易读易维护
getUser()
  .then(user => {
    console.log('用户:', user)
    return getOrders(user.id)
  })
  .then(orders => {
    console.log('订单:', orders)
    return getOrderDetails(orders[0].id)
  })
  .then(details => {
    console.log('订单详情:', details)
  })
  .catch(error => {
    console.error('出错了:', error)
  })
```

### Promise 静态方法

```javascript
// Promise.all：全部成功才成功
const p1 = Promise.resolve(1)
const p2 = Promise.resolve(2)
const p3 = Promise.resolve(3)

Promise.all([p1, p2, p3])
  .then(values => console.log(values)) // [1, 2, 3]
  .catch(error => console.error(error))

// Promise.race：最快的那个（无论成功失败）
Promise.race([p1, p2, p3])
  .then(value => console.log(value)) // 1

// Promise.allSettled：全部完成（不管成功失败）
Promise.allSettled([p1, p2, Promise.reject('error')])
  .then(results => {
    console.log(results)
    // [
    //   { status: 'fulfilled', value: 1 },
    //   { status: 'fulfilled', value: 2 },
    //   { status: 'rejected', reason: 'error' }
    // ]
  })

// Promise.any：任一成功就成功
Promise.any([p1, p2, p3])
  .then(value => console.log(value)) // 1
```

| 方法 | 说明 | 使用场景 |
| --- | --- | --- |
| `Promise.all` | 全部成功才成功 | 并行请求多个数据 |
| `Promise.race` | 最快的那个 | 超时控制 |
| `Promise.allSettled` | 全部完成 | 需要知道每个结果 |
| `Promise.any` | 任一成功 | 多个源取数据 |

---

## 5 async/await

### 什么是 async/await

async/await 是 Promise 的语法糖，让异步代码看起来像同步代码：

```javascript
// async 函数返回 Promise
async function fetchData() {
  return '数据'
}

fetchData().then(data => console.log(data))

// await 等待 Promise 完成
async function getData() {
  const data = await fetchData() // 等待 fetchData 完成
  console.log(data) // '数据'
}

getData()
```

### 错误处理

```javascript
async function fetchUser() {
  try {
    // 等待获取用户
    const user = await getUser()
    // 等待获取订单
    const orders = await getOrders(user.id)
    // 等待获取订单详情
    const details = await getOrderDetails(orders[0].id)
    
    console.log('订单详情:', details)
  } catch (error) {
    // 任何一个 await 失败都会进入 catch
    console.error('出错了:', error)
  } finally {
    // 无论成功失败都会执行
    console.log('完成')
  }
}

fetchUser()
```

### 并行执行

```javascript
async function parallel() {
  // ❌ 串行：慢，需要 2 秒
  const a = await task1() // 1 秒
  const b = await task2() // 1 秒
  
  // ✅ 并行：快，只需要 1 秒
  const [x, y] = await Promise.all([
    task1(), // 同时开始
    task2()  // 同时开始
  ])
}
```

---

## 6 实际应用

### 加载用户数据

```javascript
async function loadUserData(userId) {
  try {
    // 并行请求多个数据
    const [user, posts, comments] = await Promise.all([
      fetch(`/api/users/${userId}`).then(r => r.json()),
      fetch(`/api/users/${userId}/posts`).then(r => r.json()),
      fetch(`/api/users/${userId}/comments`).then(r => r.json())
    ])
    
    return { user, posts, comments }
  } catch (error) {
    console.error('加载失败:', error)
    throw error
  }
}

// 使用
loadUserData(1)
  .then(data => {
    console.log('用户:', data.user)
    console.log('文章:', data.posts)
    console.log('评论:', data.comments)
  })
  .catch(error => {
    console.error('加载用户数据失败:', error)
  })
```

### 封装 API 请求

```javascript
// 封装通用的请求函数
async function request(url, options = {}) {
  try {
    const response = await fetch(url, options)
    
    if (!response.ok) {
      throw new Error(`HTTP 错误：${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('请求失败:', error)
    throw error
  }
}

// 使用
async function getUser(id) {
  return request(`/api/users/${id}`)
}

async function createUser(data) {
  return request('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 同步 vs 异步 | 同步阻塞，异步不阻塞 |
| 回调函数 | 异步的最基础形式，容易形成回调地狱 |
| Promise | 异步操作的最终完成或失败 |
| Promise 状态 | pending、fulfilled、rejected |
| then/catch/finally | 处理 Promise 的结果 |
| Promise.all | 并行执行，全部成功才成功 |
| Promise.race | 并行执行，最快的那个 |
| async/await | Promise 的语法糖，代码更清晰 |
| try/catch | async/await 的错误处理 |

---

## 8 新手常见误区

### 误区 1：await 可以在任何地方使用

**错！** `await` 只能在 `async` 函数内部使用。

```javascript
// ❌ 错误：顶层作用域不能直接用 await（旧版本）
const data = await fetchData() // SyntaxError

// ✅ 正确：在 async 函数内使用
async function getData() {
  const data = await fetchData()
  return data
}

// ✅ 正确：现代浏览器支持顶层 await（type="module"）
// 在模块中可以直接使用
```

### 误区 2：async 函数返回的是普通值

**错！** `async` 函数总是返回 Promise。

```javascript
async function getData() {
  return '数据'
}

// ❌ 错误：不能直接获取返回值
const result = getData() // Promise { '数据' }
console.log(result) // Promise 对象

// ✅ 正确：使用 then 或 await
getData().then(data => console.log(data))

async function main() {
  const data = await getData()
  console.log(data) // '数据'
}
```

### 误区 3：Promise 一旦创建就会执行

**对！** Promise 创建时就会执行执行器函数。

```javascript
// Promise 创建时就会执行
const promise = new Promise((resolve) => {
  console.log('执行器执行') // 立即输出
  resolve('完成')
})

// ✅ 如果需要延迟执行，用函数包装
function createPromise() {
  return new Promise((resolve) => {
    console.log('执行器执行')
    resolve('完成')
  })
}

// 调用时才会执行
const p = createPromise()
```

### 误区 4：then 的回调是同步执行的

**错！** `then` 的回调是微任务，会在当前代码执行完后才执行。

```javascript
console.log('1. 开始')

Promise.resolve().then(() => {
  console.log('2. Promise 回调')
})

console.log('3. 结束')

// 输出顺序：1, 3, 2
// Promise 回调在同步代码执行完后才执行
```

### 误区 5：catch 只能捕获最近的错误

**对！** `catch` 会捕获前面所有 `then` 中的错误。

```javascript
Promise.resolve()
  .then(() => {
    throw new Error('错误1')
  })
  .then(() => {
    console.log('不会执行') // 跳过
  })
  .catch((error) => {
    console.error('捕获错误:', error.message) // '错误1'
  })
```

---

## 9 动手练习

### 练习 1：基础练习

使用 Promise 封装一个延时函数。

<details>
<summary>点击查看答案</summary>

```javascript
// 封装延时函数
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`延时 ${ms}ms 完成`)
    }, ms)
  })
}

// 使用
async function main() {
  console.log('开始')
  
  const result1 = await delay(1000)
  console.log(result1) // 1 秒后输出
  
  const result2 = await delay(2000)
  console.log(result2) // 又 2 秒后输出
  
  console.log('完成')
}

main()
```

</details>

### 练习 2：进阶练习

实现一个函数，可以并行请求多个用户数据，并处理成功和失败的情况。

<details>
<summary>点击查看答案</summary>

```javascript
// 模拟获取用户数据的函数
function fetchUser(userId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (userId > 0 && userId <= 3) {
        resolve({ id: userId, name: `用户${userId}` })
      } else {
        reject(new Error(`用户 ${userId} 不存在`))
      }
    }, 500)
  })
}

// 并行获取多个用户
async function fetchUsers(userIds) {
  try {
    // 创建所有请求的 Promise
    const promises = userIds.map(id => fetchUser(id))
    
    // 等待所有请求完成
    const users = await Promise.all(promises)
    
    console.log('获取成功:', users)
    return users
  } catch (error) {
    console.error('获取失败:', error.message)
    throw error
  }
}

// 使用
fetchUsers([1, 2, 3])
  .then(users => console.log('所有用户:', users))
  .catch(error => console.error('错误:', error))

// 测试失败情况
fetchUsers([1, 2, 99]) // 99 不存在
  .then(users => console.log('所有用户:', users))
  .catch(error => console.error('错误:', error.message))
```

</details>

### 练习 3（挑战）：综合练习

实现一个带超时控制的请求函数。

<details>
<summary>点击查看答案</summary>

```javascript
// 带超时的请求函数
async function fetchWithTimeout(url, timeout = 5000) {
  // 创建超时 Promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('请求超时'))
    }, timeout)
  })
  
  // 创建请求 Promise
  const fetchPromise = fetch(url).then(response => {
    if (!response.ok) {
      throw new Error(`HTTP 错误：${response.status}`)
    }
    return response.json()
  })
  
  // 使用 Promise.race 竞争
  try {
    const result = await Promise.race([fetchPromise, timeoutPromise])
    return result
  } catch (error) {
    console.error('请求失败:', error.message)
    throw error
  }
}

// 使用
async function main() {
  try {
    // 正常请求
    const data = await fetchWithTimeout(
      'https://jsonplaceholder.typicode.com/posts/1',
      3000
    )
    console.log('获取成功:', data)
  } catch (error) {
    console.error('错误:', error.message)
  }
}

main()

// 扩展：支持取消请求
async function fetchWithAbort(url, timeout = 5000) {
  const controller = new AbortController()
  
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeout)
  
  try {
    const response = await fetch(url, {
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
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
```

</details>

---

## 下一章预告

下一章我们会学习 **Fetch API**——浏览器提供的网络请求接口。你会学到如何发送 GET/POST 请求、处理响应数据、错误处理等。这是与服务器交互的核心技术，掌握它就能让网页真正"活"起来！
