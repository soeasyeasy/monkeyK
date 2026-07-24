---
title: "第十章：异步编程"
description: "回调函数、Promise、async/await，掌握异步操作"
---

# 第十章：异步编程

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是异步？为什么需要异步编程？
- 回调函数是什么？回调地狱是什么？
- Promise 是什么？怎么用 Promise 解决回调地狱？
- async/await 是什么？怎么让异步代码看起来像同步？
- async/await 和 Promise 是什么关系？

这一章就是为了解答这些问题。我们会学习 JavaScript 中处理异步操作的各种方式。

---

## 10.1 为什么需要异步编程？

### 痛点分析

想象一下，如果所有代码都是同步执行的：

```javascript
// ❌ 同步代码：执行时间长的操作会阻塞后续代码
console.log('开始')

// 模拟一个耗时操作（比如请求服务器数据）
function fetchData() {
  let result = null
  // 假设这里需要 3 秒才能拿到数据
  setTimeout(() => {
    result = '服务器返回的数据'
  }, 3000)
  return result
}

const data = fetchData()
console.log('数据:', data) // undefined！因为还没拿到数据
console.log('结束')

// 输出顺序：开始 → undefined → 结束
```

### 解决方案

用异步编程让代码不阻塞：

```javascript
// ✅ 异步代码：不会阻塞后续代码
console.log('开始')

function fetchData(callback) {
  setTimeout(() => {
    const data = '服务器返回的数据'
    callback(data) // 数据准备好了，调用回调函数
  }, 3000)
}

fetchData((data) => {
  console.log('数据:', data) // 3秒后输出
})

console.log('结束')

// 输出顺序：开始 → 结束 → 数据: 服务器返回的数据
```

> **一句话总结**：异步编程就像点外卖，你不用一直在门口等，可以继续做其他事，外卖到了会有人通知你。

---

## 10.2 核心原理

### 同步 vs 异步

| 类型 | 特点 | 例子 |
| --- | --- | --- |
| 同步 | 代码按顺序执行，前一个完成才能执行下一个 | `console.log()`、数学运算 |
| 异步 | 代码不按顺序执行，会在未来某个时间点执行 | `setTimeout`、网络请求、事件监听 |

### JavaScript 运行机制

JavaScript 是**单线程**的，但它有一个强大的异步机制：

1. **调用栈**：执行同步代码
2. **任务队列**：存放异步任务（宏任务和微任务）
3. **事件循环**：不断检查队列，把任务放到调用栈执行

打个比方：

> 想象你在餐厅点餐：
> - 调用栈就像你正在吃的菜
> - 任务队列就像你点的其他菜（还在厨房做）
> - 事件循环就像服务员，做好一道菜就端给你

---

## 10.3 回调函数

### 什么是回调函数

回调函数是作为参数传递给另一个函数的函数，在异步操作完成后被调用：

```javascript
function doSomething(callback) {
  setTimeout(() => {
    console.log('做了一些事')
    callback() // 完成后调用回调
  }, 1000)
}

doSomething(() => {
  console.log('回调函数被调用了')
})
```

### 回调函数的问题：回调地狱

当有多个异步操作需要按顺序执行时，代码会变得非常嵌套：

```javascript
// ❌ 回调地狱：嵌套太深，难以维护
fetchUser(userId, (user) => {
  fetchOrders(user.id, (orders) => {
    fetchProducts(orders[0].productId, (product) => {
      fetchReviews(product.id, (reviews) => {
        console.log('最终数据:', reviews)
      })
    })
  })
})
```

这种代码被称为"回调地狱"（Callback Hell），存在以下问题：
- 代码难以阅读和维护
- 错误处理困难
- 难以复用代码

---

## 10.4 Promise

### 什么是 Promise

Promise 是 JavaScript 中处理异步操作的**对象**，代表一个异步操作的最终结果：

```javascript
// 创建一个 Promise
const promise = new Promise((resolve, reject) => {
  // 异步操作
  setTimeout(() => {
    const success = true
    if (success) {
      resolve('操作成功！') // 成功时调用 resolve
    } else {
      reject(new Error('操作失败！')) // 失败时调用 reject
    }
  }, 1000)
})

// 使用 Promise
promise
  .then(result => {
    console.log(result) // '操作成功！'
  })
  .catch(error => {
    console.error(error) // 捕获错误
  })
```

### Promise 的三种状态

| 状态 | 说明 |
| --- | --- |
| `pending` | 初始状态，正在进行中 |
| `fulfilled` | 操作成功完成 |
| `rejected` | 操作失败 |

> **重要**：Promise 的状态一旦改变就**不可逆**。

### 使用 Promise 解决回调地狱

```javascript
// ✅ 使用 Promise 链式调用，避免回调地狱
fetchUser(userId)
  .then(user => fetchOrders(user.id))
  .then(orders => fetchProducts(orders[0].productId))
  .then(product => fetchReviews(product.id))
  .then(reviews => {
    console.log('最终数据:', reviews)
  })
  .catch(error => {
    console.error('出错了:', error)
  })
```

---

## 10.5 Promise 的常用方法

### Promise.all

等待所有 Promise 都完成：

```javascript
const promise1 = fetchUser(userId)
const promise2 = fetchOrders(userId)
const promise3 = fetchProducts(userId)

// 等待所有 Promise 完成
Promise.all([promise1, promise2, promise3])
  .then(([user, orders, products]) => {
    console.log('用户:', user)
    console.log('订单:', orders)
    console.log('商品:', products)
  })
  .catch(error => {
    console.error('任意一个失败:', error)
  })
```

### Promise.race

等待第一个完成的 Promise：

```javascript
const promise1 = fetchDataFromServerA()
const promise2 = fetchDataFromServerB()

// 只取第一个完成的结果
Promise.race([promise1, promise2])
  .then(result => {
    console.log('最快的结果:', result)
  })
  .catch(error => {
    console.error('最快的失败了:', error)
  })
```

### Promise.allSettled

等待所有 Promise 完成（不管成功还是失败）：

```javascript
Promise.allSettled([promise1, promise2, promise3])
  .then(results => {
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Promise ${index + 1} 成功:`, result.value)
      } else {
        console.log(`Promise ${index + 1} 失败:`, result.reason)
      }
    })
  })
```

### Promise.resolve / Promise.reject

快速创建成功或失败的 Promise：

```javascript
// 快速创建成功的 Promise
Promise.resolve('成功').then(console.log)

// 快速创建失败的 Promise
Promise.reject(new Error('失败')).catch(console.error)
```

---

## 10.6 async/await

### 什么是 async/await

`async/await` 是基于 Promise 的**语法糖**，让异步代码看起来像同步代码：

```javascript
// 使用 Promise
fetchUser(userId)
  .then(user => {
    console.log('用户:', user)
  })
  .catch(error => {
    console.error(error)
  })

// 使用 async/await
async function getUser() {
  try {
    const user = await fetchUser(userId)
    console.log('用户:', user)
  } catch (error) {
    console.error(error)
  }
}

getUser()
```

### async 函数

`async` 关键字声明一个异步函数，返回值是一个 Promise：

```javascript
async function asyncFunction() {
  return 'Hello' // 相当于 Promise.resolve('Hello')
}

asyncFunction().then(console.log) // 'Hello'
```

### await 关键字

`await` 只能在 `async` 函数中使用，等待 Promise 完成：

```javascript
async function getData() {
  // 等待第一个请求完成
  const user = await fetchUser(userId)
  
  // 使用第一个结果发起第二个请求
  const orders = await fetchOrders(user.id)
  
  // 使用第二个结果发起第三个请求
  const products = await fetchProducts(orders[0].productId)
  
  return products
}

getData().then(console.log)
```

---

## 10.7 错误处理

### try/catch

在 `async/await` 中使用 `try/catch` 捕获错误：

```javascript
async function safeGetData() {
  try {
    const user = await fetchUser(userId)
    const orders = await fetchOrders(user.id)
    return orders
  } catch (error) {
    console.error('获取数据失败:', error)
    throw error // 重新抛出错误，让调用者处理
  }
}
```

### 捕获单个 await 的错误

```javascript
async function getDataWithFallback() {
  // 使用 try/catch 包裹单个 await
  const user = await fetchUser(userId).catch(error => {
    console.warn('获取用户失败，使用默认值:', error)
    return { id: 0, name: '匿名用户' }
  })
  
  const orders = await fetchOrders(user.id)
  return orders
}
```

---

## 10.8 并行执行

### 使用 Promise.all 并行执行

```javascript
// ❌ 串行执行：等待一个完成再执行下一个，总共需要 3 秒
async function fetchDataSequential() {
  const user = await fetchUser(userId)      // 1 秒
  const orders = await fetchOrders(userId)  // 1 秒
  const products = await fetchProducts()    // 1 秒
  return { user, orders, products }
}

// ✅ 并行执行：同时发起请求，总共只需要 1 秒
async function fetchDataParallel() {
  const [user, orders, products] = await Promise.all([
    fetchUser(userId),
    fetchOrders(userId),
    fetchProducts()
  ])
  return { user, orders, products }
}
```

---

## 10.9 Promise 链 vs async/await

### Promise 链写法

```javascript
function fetchUserData(userId) {
  return fetchUser(userId)
    .then(user => fetchOrders(user.id))
    .then(orders => ({
      user: userId,
      orderCount: orders.length
    }))
}
```

### async/await 写法

```javascript
async function fetchUserData(userId) {
  const user = await fetchUser(userId)
  const orders = await fetchOrders(user.id)
  return {
    user: userId,
    orderCount: orders.length
  }
}
```

### 对比

| 维度 | Promise 链 | async/await |
| --- | --- | --- |
| 可读性 | 一般 | ✅ 更好 |
| 错误处理 | `.catch()` | `try/catch` |
| 调试 | 相对困难 | ✅ 更容易 |
| 适用场景 | 简单链式操作 | 复杂逻辑、条件分支 |

---

## 10.10 微任务和宏任务

### 任务分类

JavaScript 的异步任务分为两类：

| 类型 | 包含 |
| --- | --- |
| **宏任务** | `setTimeout`、`setInterval`、`requestAnimationFrame`、I/O 操作 |
| **微任务** | `Promise.then()`、`Promise.catch()`、`Promise.finally()`、`queueMicrotask()` |

### 执行顺序

```javascript
console.log('1. 同步代码')

setTimeout(() => {
  console.log('2. 宏任务 - setTimeout')
}, 0)

Promise.resolve().then(() => {
  console.log('3. 微任务 - Promise.then')
})

console.log('4. 同步代码')

// 输出顺序：
// 1. 同步代码
// 4. 同步代码
// 3. 微任务 - Promise.then
// 2. 宏任务 - setTimeout
```

> **一句话总结**：同步代码先执行 → 微任务队列清空 → 宏任务队列清空

---

## 10.11 实战：封装异步操作

### 封装 setTimeout

```javascript
function delay(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

// 使用
async function testDelay() {
  console.log('开始')
  await delay(1000)
  console.log('1秒后')
  await delay(2000)
  console.log('又过了2秒')
}

testDelay()
```

### 封装读取文件

```javascript
const fs = require('fs')

function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

// 使用
async function readFiles() {
  const file1 = await readFile('file1.txt')
  const file2 = await readFile('file2.txt')
  console.log(file1, file2)
}

readFiles()
```

---

## 10.12 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 回调函数 | 作为参数传递，异步完成后调用 |
| Promise | 处理异步操作的对象，有三种状态 |
| `.then()` | 处理成功结果 |
| `.catch()` | 处理错误 |
| `.finally()` | 无论成功失败都执行 |
| `Promise.all()` | 等待所有 Promise 完成 |
| `Promise.race()` | 等待第一个完成的 Promise |
| `async` | 声明异步函数，返回 Promise |
| `await` | 等待 Promise 完成，只能在 async 函数中使用 |
| 微任务 | `Promise.then()` 等，优先级高于宏任务 |
| 宏任务 | `setTimeout` 等，优先级低于微任务 |

---

## 10.13 新手常见误区

### 误区 1：await 可以在普通函数中使用

**错！** `await` 只能在 `async` 函数中使用。

```javascript
// ❌ 错误：await 不能在普通函数中使用
function getData() {
  const data = await fetchData() // Uncaught SyntaxError
  return data
}

// ✅ 正确：使用 async 函数
async function getData() {
  const data = await fetchData()
  return data
}
```

### 误区 2：async 函数返回的值不是 Promise

**错！** `async` 函数的返回值会被自动包装成 Promise。

```javascript
async function getValue() {
  return 'Hello' // 相当于 Promise.resolve('Hello')
}

console.log(getValue()) // Promise { 'Hello' }

getValue().then(console.log) // 'Hello'
```

### 误区 3：Promise.all 会等待所有 Promise 完成，不管是否失败

**错！** 只要有一个 Promise 失败，`Promise.all` 就会立即失败。

```javascript
Promise.all([
  Promise.resolve('成功'),
  Promise.reject(new Error('失败')),
  Promise.resolve('成功')
])
  .then(console.log) // 不会执行
  .catch(error => {
    console.error(error) // Error: 失败
  })
```

如果需要等待所有 Promise 完成（不管成功失败），使用 `Promise.allSettled`。

### 误区 4：await 会阻塞整个程序

**错！** `await` 只会暂停当前 `async` 函数的执行，不会阻塞其他代码。

```javascript
console.log('1. 开始')

async function asyncTask() {
  console.log('2. 进入异步任务')
  await delay(1000)
  console.log('3. 异步任务完成')
}

asyncTask()

console.log('4. 继续执行')

// 输出顺序：
// 1. 开始
// 2. 进入异步任务
// 4. 继续执行
// 3. 异步任务完成
```

---

## 10.14 动手练习

### 练习 1：基础练习

使用 Promise 封装一个函数，模拟获取用户数据。

<details>
<summary>点击查看答案</summary>

```javascript
function fetchUser(userId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = {
        1: { id: 1, name: '张三', age: 25 },
        2: { id: 2, name: '李四', age: 30 },
        3: { id: 3, name: '王五', age: 35 }
      }
      
      if (users[userId]) {
        resolve(users[userId])
      } else {
        reject(new Error(`用户 ${userId} 不存在`))
      }
    }, 500)
  })
}

// 使用
fetchUser(1)
  .then(user => console.log('用户:', user))
  .catch(error => console.error('错误:', error))
```

</details>

### 练习 2：进阶练习

使用 async/await 实现一个函数，按顺序获取用户、订单、商品数据。

<details>
<summary>点击查看答案</summary>

```javascript
// 模拟 API
function fetchUser(id) {
  return new Promise(resolve => setTimeout(() => resolve({ id, name: '张三' }), 500))
}

function fetchOrders(userId) {
  return new Promise(resolve => setTimeout(() => resolve([{ id: 101, productId: 1 }]), 500))
}

function fetchProduct(productId) {
  return new Promise(resolve => setTimeout(() => resolve({ id: 1, name: '商品A', price: 100 }), 500))
}

// 使用 async/await
async function getFullOrderData(userId) {
  try {
    const user = await fetchUser(userId)
    console.log('获取用户:', user)
    
    const orders = await fetchOrders(user.id)
    console.log('获取订单:', orders)
    
    const product = await fetchProduct(orders[0].productId)
    console.log('获取商品:', product)
    
    return { user, orders, product }
  } catch (error) {
    console.error('获取数据失败:', error)
    throw error
  }
}

// 使用
getFullOrderData(1).then(data => console.log('完整数据:', data))
```

</details>

### 练习 3（挑战）：综合练习

实现一个函数，并行获取多个用户的数据，然后合并结果。

<details>
<summary>点击查看答案</summary>

```javascript
function fetchUser(id) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        id,
        name: `用户${id}`,
        age: 20 + id
      })
    }, 500 + Math.random() * 500)
  })
}

async function fetchUsersParallel(userIds) {
  try {
    console.log('开始并行获取用户数据...')
    
    // 并行发起所有请求
    const promises = userIds.map(id => fetchUser(id))
    const users = await Promise.all(promises)
    
    console.log('所有用户数据获取完成')
    
    // 合并结果：按 ID 排序
    const sortedUsers = users.sort((a, b) => a.id - b.id)
    
    return {
      total: sortedUsers.length,
      users: sortedUsers
    }
  } catch (error) {
    console.error('获取用户数据失败:', error)
    throw error
  }
}

// 使用
fetchUsersParallel([3, 1, 4, 2])
  .then(result => {
    console.log('结果:', JSON.stringify(result, null, 2))
  })
  .catch(error => {
    console.error('最终错误:', error)
  })

/* 输出：
开始并行获取用户数据...
所有用户数据获取完成
结果: {
  "total": 4,
  "users": [
    {"id":1,"name":"用户1","age":21},
    {"id":2,"name":"用户2","age":22},
    {"id":3,"name":"用户3","age":23},
    {"id":4,"name":"用户4","age":24}
  ]
}
*/
```

</details>

---

## 下一章预告

下一章我们会学习 **Fetch API**——这是浏览器提供的用于发起网络请求的 API。你会学到如何使用 Fetch 发送 GET/POST 请求、处理响应、设置请求头、处理错误等。掌握这些，你就能让网页与服务器进行数据交互了！