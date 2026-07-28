---
title: "第十五章：性能优化最佳实践"
description: "DOM 优化、内存管理、懒加载，让代码跑得更快"
---

# 第十五章：性能优化最佳实践

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么我的网页加载很慢？
- 如何优化 DOM 操作？
- 什么是内存泄漏？如何避免？
- 什么是懒加载？怎么实现？
- 如何减少重绘和回流？
- 如何优化 JavaScript 代码？
- 有哪些性能优化的工具？

这一章就是为了解答这些问题。我们会学习各种性能优化技巧，让你的应用运行更快、更流畅。

---

## 1 为什么需要性能优化？

### 痛点分析

想象一下，如果网页性能很差：

```javascript
// ❌ 糟糕的性能：页面卡顿
for (let i = 0; i < 10000; i++) {
  const div = document.createElement('div')
  div.textContent = `项目 ${i}`
  document.body.appendChild(div) // 每次循环都操作 DOM
}

// 用户看到页面卡住 3 秒
// 滚动时掉帧
// 点击无响应
```

问题：
- 用户体验差，可能直接离开
- 搜索引擎排名下降
- 移动端耗电快

### 解决方案

用性能优化技巧：

```javascript
// ✅ 优化后：流畅加载
const fragment = document.createDocumentFragment()
for (let i = 0; i < 10000; i++) {
  const div = document.createElement('div')
  div.textContent = `项目 ${i}`
  fragment.appendChild(div) // 先添加到文档片段
}
document.body.appendChild(fragment) // 一次性添加到 DOM

// 页面瞬间加载完成
// 滚动流畅
// 响应迅速
```

> **一句话总结**：性能优化就像给汽车换发动机，同样的外观，但跑得快得多。

---

## 2 核心原理

### 浏览器渲染流程

浏览器渲染页面需要经过以下步骤：

| 步骤 | 说明 |
| --- | --- |
| **解析 HTML** | 构建 DOM 树 |
| **解析 CSS** | 构建 CSSOM 树 |
| **合并渲染树** | DOM + CSSOM = Render Tree |
| **布局（Layout）** | 计算元素位置和大小 |
| **绘制（Paint）** | 绘制像素到屏幕 |
| **合成（Composite）** | 分层合成最终画面 |

### 重绘和回流

- **回流（Reflow）**：元素的尺寸、位置发生变化，需要重新计算布局
- **重绘（Repaint）**：元素的外观发生变化，但不影响布局

```javascript
// 触发回流的操作
element.style.width = '100px'
element.style.height = '100px'
element.style.margin = '10px'

// 触发重绘的操作
element.style.color = 'red'
element.style.backgroundColor = 'blue'
element.style.visibility = 'hidden'
```

---

## 3 DOM 优化

### 减少 DOM 操作

```javascript
// ❌ 不好：多次操作 DOM
for (let i = 0; i < 1000; i++) {
  document.body.innerHTML += `<div>项目 ${i}</div>` // 每次都解析 HTML
}

// ✅ 好：使用 DocumentFragment
const fragment = document.createDocumentFragment()
for (let i = 0; i < 1000; i++) {
  const div = document.createElement('div')
  div.textContent = `项目 ${i}`
  fragment.appendChild(div)
}
document.body.appendChild(fragment)

// ✅ 更好：使用 innerHTML 一次性插入
let html = ''
for (let i = 0; i < 1000; i++) {
  html += `<div>项目 ${i}</div>`
}
document.body.innerHTML = html
```

### 批量修改样式

```javascript
// ❌ 不好：多次触发回流
element.style.width = '100px'
element.style.height = '100px'
element.style.margin = '10px'
element.style.padding = '20px'

// ✅ 好：使用 cssText 一次性修改
element.style.cssText += ';width:100px;height:100px;margin:10px;padding:20px;'

// ✅ 更好：使用 class
element.classList.add('large-box')
```

### 使用 requestAnimationFrame

```javascript
// ❌ 不好：使用 setTimeout 做动画
function animate() {
  element.style.left = parseInt(element.style.left) + 1 + 'px'
  setTimeout(animate, 16) // 约 60fps
}

// ✅ 好：使用 requestAnimationFrame
function animate() {
  element.style.left = parseInt(element.style.left) + 1 + 'px'
  requestAnimationFrame(animate)
}

// requestAnimationFrame 会在浏览器下次重绘前执行
// 自动匹配屏幕刷新率
// 页面不可见时暂停，节省资源
```

---

## 4 内存管理

### 避免内存泄漏

```javascript
// ❌ 内存泄漏：全局变量
function createLeak() {
  leak = new Array(1000000) // 忘记声明，成为全局变量
}

// ✅ 正确：使用局部变量
function noLeak() {
  const data = new Array(1000000)
  // 函数结束后，data 会被回收
}

// ❌ 内存泄漏：未清除的定时器
function startTimer() {
  setInterval(() => {
    console.log('每秒执行')
  }, 1000)
}

// ✅ 正确：保存定时器 ID 并清除
let timerId
function startTimer() {
  timerId = setInterval(() => {
    console.log('每秒执行')
  }, 1000)
}

function stopTimer() {
  clearInterval(timerId)
}

// ❌ 内存泄漏：未移除的事件监听器
function addListener() {
  const handler = () => console.log('点击')
  document.addEventListener('click', handler)
  // 组件销毁后，监听器还在
}

// ✅ 正确：移除事件监听器
function addListener() {
  const handler = () => console.log('点击')
  document.addEventListener('click', handler)
  
  return () => {
    document.removeEventListener('click', handler)
  }
}
```

### 使用 WeakMap 和 WeakSet

```javascript
// WeakMap：键是弱引用
const weakMap = new WeakMap()

let obj = { data: '重要数据' }
weakMap.set(obj, '元数据')

console.log(weakMap.get(obj)) // '元数据'

obj = null // 解除引用
// weakMap 中的条目会被自动回收

// WeakSet：值是弱引用
const weakSet = new WeakSet()

let obj1 = { id: 1 }
let obj2 = { id: 2 }

weakSet.add(obj1)
weakSet.add(obj2)

console.log(weakSet.has(obj1)) // true

obj1 = null // 解除引用
// weakSet 中的 obj1 会被自动回收
```

### 对象池模式

```javascript
// 对象池：复用对象，减少创建和销毁
class ObjectPool {
  constructor(factory, reset) {
    this.factory = factory
    this.reset = reset
    this.pool = []
  }
  
  acquire() {
    if (this.pool.length > 0) {
      return this.pool.pop()
    }
    return this.factory()
  }
  
  release(obj) {
    this.reset(obj)
    this.pool.push(obj)
  }
}

// 使用
const vectorPool = new ObjectPool(
  () => ({ x: 0, y: 0 }), // 工厂函数
  (vec) => { vec.x = 0; vec.y = 0 } // 重置函数
)

// 获取对象
const vec1 = vectorPool.acquire()
vec1.x = 10
vec1.y = 20

// 使用完毕后归还
vectorPool.release(vec1)

// 下次获取时复用
const vec2 = vectorPool.acquire() // 复用了 vec1
console.log(vec2.x, vec2.y) // 0, 0（已被重置）
```

---

## 5 懒加载

### 图片懒加载

```javascript
// 使用 Intersection Observer
function lazyLoadImages() {
  const images = document.querySelectorAll('img[data-src]')
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target
        img.src = img.dataset.src // 加载真实图片
        img.removeAttribute('data-src')
        observer.unobserve(img) // 停止观察
      }
    })
  })
  
  images.forEach(img => observer.observe(img))
}

// HTML
// <img data-src="large-image.jpg" src="placeholder.jpg" alt="懒加载图片">

// 调用
lazyLoadImages()
```

### 组件懒加载

```javascript
// 动态导入实现懒加载
async function loadComponent(name) {
  const module = await import(`./components/${name}.js`)
  return module.default
}

// 使用
async function showDashboard() {
  const loading = document.getElementById('loading')
  loading.style.display = 'block'
  
  try {
    const Dashboard = await loadComponent('Dashboard')
    const container = document.getElementById('container')
    container.innerHTML = ''
    container.appendChild(new Dashboard())
  } catch (error) {
    console.error('加载组件失败:', error)
  } finally {
    loading.style.display = 'none'
  }
}
```

### 数据懒加载

```javascript
// 滚动加载数据
class InfiniteScroll {
  constructor(container, fetchFunction) {
    this.container = container
    this.fetchFunction = fetchFunction
    this.page = 1
    this.loading = false
    this.hasMore = true
    
    this.setupObserver()
  }
  
  setupObserver() {
    // 创建哨兵元素
    this.sentinel = document.createElement('div')
    this.sentinel.style.height = '1px'
    this.container.appendChild(this.sentinel)
    
    // 观察哨兵元素
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.loading && this.hasMore) {
        this.loadMore()
      }
    })
    
    this.observer.observe(this.sentinel)
  }
  
  async loadMore() {
    this.loading = true
    
    try {
      const data = await this.fetchFunction(this.page)
      
      if (data.length === 0) {
        this.hasMore = false
        return
      }
      
      // 渲染新数据
      data.forEach(item => {
        const element = this.renderItem(item)
        this.container.insertBefore(element, this.sentinel)
      })
      
      this.page++
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      this.loading = false
    }
  }
  
  renderItem(item) {
    const div = document.createElement('div')
    div.textContent = item.name
    return div
  }
  
  destroy() {
    this.observer.disconnect()
  }
}

// 使用
async function fetchUsers(page) {
  const response = await fetch(`/api/users?page=${page}&limit=20`)
  return response.json()
}

const infiniteScroll = new InfiniteScroll(
  document.getElementById('user-list'),
  fetchUsers
)
```

---

## 6 防抖和节流

### 防抖（Debounce）

```javascript
// 防抖：停止触发后等待一段时间再执行
function debounce(fn, delay = 300) {
  let timer = null
  
  return function (...args) {
    // 清除之前的定时器
    if (timer) clearTimeout(timer)
    
    // 设置新的定时器
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

// 使用：搜索框输入
const searchInput = document.getElementById('search')
searchInput.addEventListener('input', debounce((e) => {
  const query = e.target.value
  // 发送搜索请求
  fetchSearchResults(query)
}, 500))

// 用户停止输入 500ms 后才会执行
```

### 节流（Throttle）

```javascript
// 节流：固定时间间隔内只执行一次
function throttle(fn, interval = 300) {
  let lastTime = 0
  
  return function (...args) {
    const now = Date.now()
    
    // 检查是否超过时间间隔
    if (now - lastTime >= interval) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}

// 使用：滚动事件
window.addEventListener('scroll', throttle(() => {
  const scrollTop = document.documentElement.scrollTop
  console.log('滚动位置:', scrollTop)
  // 更新 UI
}, 100))

// 每 100ms 最多执行一次
```

### 防抖 vs 节流

| 特性 | 防抖 | 节流 |
| --- | --- | --- |
| **执行时机** | 停止触发后执行 | 固定间隔执行 |
| **使用场景** | 搜索框输入、窗口调整 | 滚动事件、按钮点击 |
| **执行频率** | 只执行最后一次 | 固定频率执行 |

---

## 7 代码优化

### 避免不必要的计算

```javascript
// ❌ 不好：循环中重复计算
for (let i = 0; i < items.length; i++) {
  const result = items[i] * Math.PI * Math.PI // 每次都计算 PI * PI
}

// ✅ 好：提取到循环外
const PI_SQUARED = Math.PI * Math.PI
for (let i = 0; i < items.length; i++) {
  const result = items[i] * PI_SQUARED
}

// ❌ 不好：重复查询 DOM
function updateUI() {
  document.getElementById('name').textContent = user.name
  document.getElementById('age').textContent = user.age
  document.getElementById('email').textContent = user.email
}

// ✅ 好：缓存 DOM 引用
const nameEl = document.getElementById('name')
const ageEl = document.getElementById('age')
const emailEl = document.getElementById('email')

function updateUI() {
  nameEl.textContent = user.name
  ageEl.textContent = user.age
  emailEl.textContent = user.email
}
```

### 使用高效的数据结构

```javascript
// ❌ 不好：数组查找 O(n)
const users = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  // ... 大量数据
]

function findUser(id) {
  return users.find(u => u.id === id) // 需要遍历
}

// ✅ 好：Map 查找 O(1)
const userMap = new Map()
users.forEach(user => userMap.set(user.id, user))

function findUser(id) {
  return userMap.get(id) // 直接查找
}
```

### 使用 Web Worker

```javascript
// 主线程
const worker = new Worker('worker.js')

worker.postMessage({ type: 'heavy-calculation', data: largeArray })

worker.onmessage = (event) => {
  console.log('计算结果:', event.data)
}

// worker.js
self.onmessage = (event) => {
  if (event.data.type === 'heavy-calculation') {
    const result = event.data.data.reduce((sum, num) => sum + num, 0)
    self.postMessage(result)
  }
}
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| DocumentFragment | 批量 DOM 操作 |
| requestAnimationFrame | 流畅动画 |
| 重绘和回流 | 减少布局计算 |
| 内存泄漏 | 及时清理资源 |
| WeakMap/WeakSet | 弱引用，自动回收 |
| 懒加载 | 按需加载资源 |
| Intersection Observer | 元素可见性检测 |
| 防抖 | 停止触发后执行 |
| 节流 | 固定间隔执行 |
| Web Worker | 后台线程计算 |

---

## 9 新手常见误区

### 误区 1：innerHTML 比 DOM 操作快

**不一定！** 取决于使用场景。

```javascript
// 少量元素：DOM 操作更快
const div = document.createElement('div')
div.textContent = 'Hello'
document.body.appendChild(div)

// 大量元素：innerHTML 更快
let html = ''
for (let i = 0; i < 1000; i++) {
  html += `<div>项目 ${i}</div>`
}
document.body.innerHTML = html

// 最佳实践：DocumentFragment
const fragment = document.createDocumentFragment()
for (let i = 0; i < 1000; i++) {
  const div = document.createElement('div')
  div.textContent = `项目 ${i}`
  fragment.appendChild(div)
}
document.body.appendChild(fragment)
```

### 误区 2：缓存所有东西都能提升性能

**错！** 过度缓存会占用内存。

```javascript
// ❌ 不好：缓存大量不常用的数据
const cache = {}
function getData(id) {
  if (!cache[id]) {
    cache[id] = fetchFromServer(id) // 永远不会释放
  }
  return cache[id]
}

// ✅ 好：使用 LRU 缓存
class LRUCache {
  constructor(maxSize) {
    this.maxSize = maxSize
    this.cache = new Map()
  }
  
  get(key) {
    const value = this.cache.get(key)
    if (value !== undefined) {
      // 移到最前面
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }
  
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.maxSize) {
      // 删除最久未使用的
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }
}

const cache = new LRUCache(100) // 最多缓存 100 项
```

### 误区 3：微优化很重要

**错！** 先保证代码正确，再考虑优化。

```javascript
// ❌ 不好：过度优化
// 使用位运算代替乘法（可读性差）
const result = x << 2 // 而不是 x * 4

// ✅ 好：先写清晰的代码
const result = x * 4

// 只在性能瓶颈处优化
// 使用性能分析工具找出真正的瓶颈
```

### 误区 4：异步操作不会阻塞主线程

**错！** 异步操作的回调仍在主线程执行。

```javascript
// ❌ 不好：大量同步计算在回调中
fetchData().then(data => {
  // 这里仍然是同步执行，会阻塞 UI
  const result = heavyComputation(data) // 耗时操作
  updateUI(result)
})

// ✅ 好：使用 Web Worker
const worker = new Worker('worker.js')
fetchData().then(data => {
  worker.postMessage(data)
})

worker.onmessage = (event) => {
  updateUI(event.data) // 只在主线程更新 UI
}
```

### 误区 5：防抖和节流可以随便用

**错！** 要根据场景选择合适的策略。

```javascript
// 搜索框：用防抖
// 用户停止输入后才发送请求
searchInput.addEventListener('input', debounce(search, 500))

// 滚动事件：用节流
// 固定频率更新 UI
window.addEventListener('scroll', throttle(updatePosition, 16))

// 按钮点击：用节流（防止重复提交）
submitButton.addEventListener('click', throttle(submit, 1000))

// 窗口调整：用防抖
// 停止调整后才重新计算布局
window.addEventListener('resize', debounce(handleResize, 300))
```

---

## 10 动手练习

### 练习 1：基础练习

实现一个图片懒加载功能。

<details>
<summary>点击查看答案</summary>

```javascript
class LazyImageLoader {
  constructor(options = {}) {
    this.threshold = options.threshold || 100
    this.placeholder = options.placeholder || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E'
    
    this.observer = null
    this.init()
  }
  
  init() {
    // 创建 Intersection Observer
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target)
          this.observer.unobserve(entry.target)
        }
      })
    }, {
      rootMargin: `${this.threshold}px`
    })
    
    // 观察所有懒加载图片
    this.observeAll()
  }
  
  observeAll() {
    const images = document.querySelectorAll('img[data-src]')
    images.forEach(img => {
      // 设置占位图
      if (!img.src) {
        img.src = this.placeholder
      }
      this.observer.observe(img)
    })
  }
  
  loadImage(img) {
    const src = img.dataset.src
    if (!src) return
    
    // 创建新图片预加载
    const tempImg = new Image()
    tempImg.onload = () => {
      img.src = src
      img.classList.add('loaded')
      img.removeAttribute('data-src')
    }
    tempImg.onerror = () => {
      console.error('图片加载失败:', src)
      img.classList.add('error')
    }
    tempImg.src = src
  }
  
  destroy() {
    if (this.observer) {
      this.observer.disconnect()
    }
  }
}

// 使用
const lazyLoader = new LazyImageLoader({
  threshold: 200,
  placeholder: 'placeholder.jpg'
})

// HTML 示例
// <img data-src="image1.jpg" alt="图片1">
// <img data-src="image2.jpg" alt="图片2">
// <img data-src="image3.jpg" alt="图片3">
```

</details>

### 练习 2：进阶练习

实现一个防抖和节流函数，并支持立即执行选项。

<details>
<summary>点击查看答案</summary>

```javascript
// 高级防抖函数
function debounce(fn, delay = 300, options = {}) {
  let timer = null
  const immediate = options.immediate || false
  
  const debounced = function (...args) {
    // 立即执行模式
    if (immediate && !timer) {
      fn.apply(this, args)
    }
    
    // 清除之前的定时器
    if (timer) clearTimeout(timer)
    
    // 设置新的定时器
    timer = setTimeout(() => {
      if (!immediate) {
        fn.apply(this, args)
      }
      timer = null
    }, delay)
  }
  
  // 取消功能
  debounced.cancel = function () {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
  
  return debounced
}

// 高级节流函数
function throttle(fn, interval = 300, options = {}) {
  let lastTime = 0
  let timer = null
  const { leading = true, trailing = true } = options
  
  const throttled = function (...args) {
    const now = Date.now()
    
    // 首次执行
    if (!lastTime && !leading) {
      lastTime = now
    }
    
    const remaining = interval - (now - lastTime)
    
    // 超过间隔时间
    if (remaining <= 0 || remaining > interval) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      lastTime = now
      if (leading || lastTime) {
        fn.apply(this, args)
      }
    } else if (!timer && trailing) {
      // 在间隔末尾执行
      timer = setTimeout(() => {
        lastTime = leading ? Date.now() : 0
        timer = null
        fn.apply(this, args)
      }, remaining)
    }
  }
  
  // 取消功能
  throttled.cancel = function () {
    clearTimeout(timer)
    timer = null
    lastTime = 0
  }
  
  return throttled
}

// 测试防抖
const debouncedSearch = debounce((query) => {
  console.log('搜索:', query)
}, 500, { immediate: true })

// 测试节流
const throttledScroll = throttle(() => {
  console.log('滚动位置:', window.scrollY)
}, 100, { leading: true, trailing: true })

window.addEventListener('scroll', throttledScroll)
```

</details>

### 练习 3（挑战）：综合练习

实现一个性能监控工具，记录页面性能指标。

<details>
<summary>点击查看答案</summary>

```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = {}
    this.observer = null
    this.init()
  }
  
  init() {
    // 监听性能条目
    this.observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.recordMetric(entry)
      })
    })
    
    // 观察不同类型的性能条目
    this.observer.observe({ entryTypes: ['measure', 'resource', 'navigation'] })
    
    // 记录页面加载时间
    this.recordPageLoad()
    
    // 记录内存使用
    this.recordMemory()
  }
  
  recordPageLoad() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = performance.timing
        const loadTime = timing.loadEventEnd - timing.navigationStart
        
        this.metrics.pageLoad = {
          value: loadTime,
          unit: 'ms',
          timestamp: Date.now()
        }
        
        console.log('页面加载时间:', loadTime, 'ms')
      }, 0)
    })
  }
  
  recordMemory() {
    if (performance.memory) {
      const memory = performance.memory
      this.metrics.memory = {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        unit: 'MB',
        timestamp: Date.now()
      }
      
      console.log('内存使用:', this.metrics.memory.used, 'MB')
    }
  }
  
  recordMetric(entry) {
    const name = entry.name
    const duration = entry.duration
    
    if (!this.metrics[name]) {
      this.metrics[name] = []
    }
    
    this.metrics[name].push({
      value: duration,
      unit: 'ms',
      timestamp: Date.now()
    })
  }
  
  // 开始测量
  startMeasure(name) {
    performance.mark(`${name}-start`)
  }
  
  // 结束测量
  endMeasure(name) {
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
    
    const measure = performance.getEntriesByName(name)[0]
    console.log(`${name} 耗时:`, measure.duration.toFixed(2), 'ms')
    
    return measure.duration
  }
  
  // 获取所有指标
  getMetrics() {
    return this.metrics
  }
  
  // 获取性能报告
  getReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      summary: {}
    }
    
    // 计算平均值
    Object.keys(this.metrics).forEach(key => {
      const data = this.metrics[key]
      if (Array.isArray(data) && data.length > 0) {
        const values = data.map(d => d.value)
        report.summary[key] = {
          count: values.length,
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values)
        }
      }
    })
    
    return report
  }
  
  // 上报性能数据
  async report(url) {
    const report = this.getReport()
    
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      })
      console.log('性能数据已上报')
    } catch (error) {
      console.error('上报失败:', error)
    }
  }
  
  destroy() {
    if (this.observer) {
      this.observer.disconnect()
    }
  }
}

// 使用
const monitor = new PerformanceMonitor()

// 测量代码性能
monitor.startMeasure('data-processing')
// ... 执行一些操作
const duration = monitor.endMeasure('data-processing')

// 查看性能报告
console.log('性能报告:', monitor.getReport())

// 上报到服务器
// monitor.report('/api/performance')
```

</details>

---

## 下一章预告

下一章我们会学习 **综合实战项目**——将前面学到的知识应用到实际项目中。我们会开发一个完整的待办事项应用和一个天气查询应用。这是检验学习成果的最好方式！
