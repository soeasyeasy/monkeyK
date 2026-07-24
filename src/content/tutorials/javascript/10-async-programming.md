---
title: "第十章：异步编程"
description: "回调、Promise、async/await"
---

# 第十章：异步编程

## 同步与异步

```javascript
// 同步
console.log('1')
console.log('2')
console.log('3')
// 输出：1, 2, 3

// 异步
console.log('1')
setTimeout(() => console.log('2'), 1000)
console.log('3')
// 输出：1, 3, 2
```

## 回调函数

```javascript
function fetchData(callback) {
  setTimeout(() => {
    const data = { name: '张三', age: 25 }
    callback(data)
  }, 1000)
}

fetchData((data) => {
  console.log(data)
})
```

### 回调地狱

```javascript
// 不推荐：嵌套过深
getUser((user) => {
  getOrders(user.id, (orders) => {
    getOrderDetails(orders[0].id, (details) => {
      console.log(details)
    })
  })
})
```

## Promise

```javascript
// 创建 Promise
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    const success = true
    if (success) {
      resolve('数据获取成功')
    } else {
      reject('获取失败')
    }
  }, 1000)
})

// 使用 Promise
promise
  .then((data) => console.log(data))
  .catch((error) => console.error(error))
  .finally(() => console.log('完成'))
```

### Promise 链式调用

```javascript
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

// 链式调用
getUser()
  .then(user => getOrders(user.id))
  .then(orders => getOrderDetails(orders[0].id))
  .then(details => console.log(details))
  .catch(error => console.error(error))
```

### Promise 静态方法

```javascript
// Promise.all（全部成功）
const p1 = Promise.resolve(1)
const p2 = Promise.resolve(2)
const p3 = Promise.resolve(3)

Promise.all([p1, p2, p3])
  .then(values => console.log(values)) // [1, 2, 3]

// Promise.race（最快）
Promise.race([p1, p2, p3])
  .then(value => console.log(value)) // 1

// Promise.allSettled（全部完成）
Promise.allSettled([p1, p2, Promise.reject('error')])
  .then(results => console.log(results))

// Promise.any（任一成功）
Promise.any([p1, p2, p3])
  .then(value => console.log(value)) // 1
```

## async/await

```javascript
// async 函数返回 Promise
async function fetchData() {
  return '数据'
}

fetchData().then(data => console.log(data))

// await 等待 Promise
async function getData() {
  const data = await fetchData()
  console.log(data)
}
```

### 错误处理

```javascript
async function fetchUser() {
  try {
    const user = await getUser()
    const orders = await getOrders(user.id)
    const details = await getOrderDetails(orders[0].id)
    console.log(details)
  } catch (error) {
    console.error('出错了:', error)
  } finally {
    console.log('完成')
  }
}
```

### 并行执行

```javascript
async function parallel() {
  // 串行（慢）
  const a = await task1()
  const b = await task2()
  
  // 并行（快）
  const [x, y] = await Promise.all([task1(), task2()])
}
```

## 实际应用

```javascript
async function loadUserData(userId) {
  try {
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
```

## 总结

异步编程是 JavaScript 的核心特性。推荐使用 async/await 语法，代码更清晰易读。
