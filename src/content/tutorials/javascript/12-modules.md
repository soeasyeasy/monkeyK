---
title: "第十二章：模块化开发"
description: "export/import、模块加载、代码组织，写出可维护的代码"
---

# 第十二章：模块化开发

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是模块化？为什么需要模块化？
- ES6 模块是什么？怎么使用？
- `export` 和 `import` 有哪些方式？
- 模块的加载方式有哪些？
- 模块和脚本有什么区别？
- 如何组织项目的模块结构？

这一章就是为了解答这些问题。我们会学习 JavaScript 的模块化开发，让你的代码更加清晰、可维护。

---

## 1 为什么需要模块化？

### 痛点分析

想象一下，如果所有代码都写在一个文件里：

```javascript
// ❌ 不好：所有代码都在一个文件里，难以维护
const PI = 3.14159

function calculateArea(radius) {
  return PI * radius * radius
}

function calculateCircumference(radius) {
  return 2 * PI * radius
}

function formatName(firstName, lastName) {
  return `${lastName} ${firstName}`
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ... 还有更多函数 ...
```

问题：
- 文件越来越大，难以查找和修改
- 变量和函数可能命名冲突
- 无法按需加载，影响性能
- 难以复用代码

### 解决方案

用模块化组织代码：

```javascript
// ✅ 好：按功能分成多个模块
// math.js
export const PI = 3.14159
export function calculateArea(radius) { /* ... */ }

// string.js
export function formatName(firstName, lastName) { /* ... */ }

// validation.js
export function validateEmail(email) { /* ... */ }
```

> **一句话总结**：模块化就像把图书馆的书按类别分类摆放，方便查找和管理。

---

## 2 核心原理

### 模块的本质

模块是一个**独立的文件**，拥有自己的作用域，对外暴露特定的接口。

打个比方：

> 想象你去餐厅吃饭：
> - 模块就像餐厅的各个部门（厨房、服务员、收银台）
> - 每个部门有自己的职责和内部流程
> - 部门之间通过特定的接口协作（厨房把菜交给服务员）
> - 外部只能通过接口与模块交互

### 模块的特点

| 特点 | 说明 |
| --- | --- |
| **独立作用域** | 模块内的变量和函数不会污染全局作用域 |
| **按需导出** | 可以选择暴露哪些内容给外部 |
| **按需导入** | 可以只导入需要的部分 |
| **依赖管理** | 通过 import 声明依赖关系 |
| **静态分析** | import/export 必须在文件顶部，可以被静态分析 |

---

## 3 ES6 模块语法

### 导出（export）

#### 命名导出

```javascript
// math.js

// 方式一：导出单个变量
export const PI = 3.14159

// 方式二：导出单个函数
export function calculateArea(radius) {
  return PI * radius * radius
}

// 方式三：导出类
export class Circle {
  constructor(radius) {
    this.radius = radius
  }
  
  getArea() {
    return PI * this.radius * this.radius
  }
}

// 方式四：先定义再导出
const MAX_VALUE = 100
function helper() { /* ... */ }

export { MAX_VALUE, helper }

// 方式五：重命名导出
export { helper as calculateHelper }
```

#### 默认导出

```javascript
// utils.js

// 默认导出（每个模块只能有一个默认导出）
export default function formatDate(date) {
  return date.toLocaleDateString('zh-CN')
}

// 也可以导出对象
export default {
  name: '工具库',
  version: '1.0.0'
}
```

### 导入（import）

#### 导入命名导出

```javascript
// app.js

// 方式一：导入多个
import { PI, calculateArea } from './math.js'

// 方式二：重命名导入
import { PI as PI_VALUE, calculateArea as area } from './math.js'

// 方式三：导入所有（命名空间导入）
import * as math from './math.js'
console.log(math.PI)
console.log(math.calculateArea(5))
```

#### 导入默认导出

```javascript
// app.js

// 方式一：直接导入（可以自定义名称）
import formatDate from './utils.js'

// 方式二：同时导入默认和命名
import formatDate, { PI } from './utils.js'

// 方式三：使用命名空间导入（默认导出在 default 属性中）
import * as utils from './utils.js'
console.log(utils.default) // 默认导出
console.log(utils.PI) // 命名导出
```

---

## 4 模块加载方式

### 在浏览器中使用

需要在 HTML 中声明 `type="module"`：

```html
<!-- index.html -->
<script type="module" src="app.js"></script>
```

```javascript
// app.js
import { calculateArea } from './math.js'

console.log(calculateArea(5)) // 78.53975
```

### 在 Node.js 中使用

#### 方式一：使用 `.mjs` 扩展名

```javascript
// app.mjs
import { calculateArea } from './math.mjs'
```

#### 方式二：在 `package.json` 中设置 `"type": "module"`

```json
{
  "type": "module"
}
```

然后可以使用 `.js` 扩展名：

```javascript
// app.js
import { calculateArea } from './math.js'
```

### CommonJS 模块（Node.js 旧版）

```javascript
// 导出
module.exports = {
  PI: 3.14159,
  calculateArea: function(radius) { /* ... */ }
}

// 导入
const { PI, calculateArea } = require('./math.js')
```

### ES6 模块 vs CommonJS

| 特性 | ES6 模块 | CommonJS |
| --- | --- | --- |
| 加载方式 | 静态（编译时） | 动态（运行时） |
| 导入位置 | 必须在文件顶部 | 可以在任意位置 |
| 导出方式 | export/import | module.exports/require |
| 默认导出 | export default | module.exports |
| 浏览器支持 | 原生支持（需 type="module"） | 需要打包工具 |
| 异步加载 | 支持 | 不支持 |

---

## 5 模块模式

### IIFE 模式（立即执行函数表达式）

在 ES6 模块之前，使用 IIFE 创建私有作用域：

```javascript
// ❌ 旧方式：IIFE
const module = (function() {
  const privateVar = '私有变量'
  
  function privateMethod() {
    return privateVar
  }
  
  return {
    publicMethod: function() {
      return privateMethod()
    }
  }
})()

console.log(module.publicMethod()) // '私有变量'
console.log(module.privateVar) // undefined
```

### ES6 模块模式

```javascript
// ✅ ES6 模块方式
// my-module.js
const privateVar = '私有变量'

function privateMethod() {
  return privateVar
}

export function publicMethod() {
  return privateMethod()
}
```

### 单例模式

```javascript
// singleton.js
class App {
  constructor() {
    this.config = { /* ... */ }
  }
  
  init() {
    console.log('初始化')
  }
}

export default new App()

// 使用
import app from './singleton.js'
app.init()
```

---

## 6 循环依赖

### 什么是循环依赖

```javascript
// a.js
import { b } from './b.js'
export const a = 'a'

// b.js
import { a } from './a.js'
export const b = 'b'
```

### 如何处理循环依赖

```javascript
// a.js
let b // 延迟引用
export const a = 'a'

// 在使用前导入
import('./b.js').then(({ b: bModule }) => {
  b = bModule
})

// b.js
import { a } from './a.js'
export const b = 'b'
```

或者重新设计模块结构，避免循环依赖。

---

## 7 实战：项目结构组织

### 推荐的项目结构

```
src/
├── index.js          # 入口文件
├── main.js           # 主应用逻辑
├── api/              # API 模块
│   ├── index.js      # API 导出
│   ├── user.js       # 用户相关 API
│   └── product.js    # 商品相关 API
├── utils/            # 工具函数
│   ├── index.js
│   ├── format.js     # 格式化工具
│   └── validate.js   # 验证工具
├── components/       # UI 组件
│   ├── Header.js
│   ├── Footer.js
│   └── Button.js
└── constants/        # 常量
    └── index.js
```

### API 模块示例

```javascript
// src/api/user.js
export async function getUser(id) {
  const response = await fetch(`/api/users/${id}`)
  return response.json()
}

export async function createUser(data) {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return response.json()
}
```

```javascript
// src/api/index.js
export * from './user.js'
export * from './product.js'
```

### 工具模块示例

```javascript
// src/utils/format.js
export function formatDate(date) {
  return new Date(date).toLocaleDateString('zh-CN')
}

export function formatPrice(price) {
  return `¥${price.toFixed(2)}`
}
```

### 使用模块

```javascript
// src/main.js
import { getUser, createUser } from './api/index.js'
import { formatDate, formatPrice } from './utils/index.js'

async function init() {
  const user = await getUser(1)
  console.log('用户创建时间:', formatDate(user.createdAt))
  console.log('余额:', formatPrice(user.balance))
}

init()
```

---

## 8 动态导入

### 基本用法

```javascript
// 动态导入（返回 Promise）
import('./math.js')
  .then(({ calculateArea }) => {
    console.log(calculateArea(5))
  })
  .catch(error => {
    console.error('加载模块失败:', error)
  })
```

### 在 async 函数中使用

```javascript
async function loadModule() {
  try {
    const { calculateArea } = await import('./math.js')
    console.log(calculateArea(5))
  } catch (error) {
    console.error('加载模块失败:', error)
  }
}

loadModule()
```

### 按需加载场景

```javascript
// 根据条件加载不同模块
async function loadFeature(featureName) {
  switch (featureName) {
    case 'chart':
      const { Chart } = await import('./chart.js')
      return new Chart()
    case 'table':
      const { Table } = await import('./table.js')
      return new Table()
    default:
      throw new Error('未知功能')
  }
}
```

---

## 9 模块的执行顺序

### 静态导入的执行顺序

```javascript
// a.js
console.log('a.js 开始')
export const a = 'a'
console.log('a.js 结束')

// b.js
console.log('b.js 开始')
import { a } from './a.js'
console.log('b.js 导入了:', a)
export const b = 'b'
console.log('b.js 结束')

// app.js
console.log('app.js 开始')
import { b } from './b.js'
console.log('app.js 导入了:', b)
console.log('app.js 结束')

// 输出顺序：
// a.js 开始
// a.js 结束
// b.js 开始
// b.js 导入了: a
// b.js 结束
// app.js 开始
// app.js 导入了: b
// app.js 结束
```

### 动态导入的执行顺序

```javascript
console.log('1. 开始')

import('./a.js').then(({ a }) => {
  console.log('2. 动态导入 a:', a)
})

console.log('3. 继续执行')

// 输出顺序：
// 1. 开始
// 3. 继续执行
// 2. 动态导入 a: a
```

---

## 10 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| `export` | 导出变量、函数、类 |
| `export default` | 默认导出（每个模块一个） |
| `import` | 导入模块 |
| `import * as name` | 命名空间导入 |
| `import { a as b }` | 重命名导入 |
| `type="module"` | 浏览器中启用 ES6 模块 |
| `"type": "module"` | Node.js 中启用 ES6 模块 |
| 动态导入 | `import()` 返回 Promise |
| 循环依赖 | 模块间相互依赖，需要小心处理 |

---

## 11 新手常见误区

### 误区 1：import 可以放在函数内部

**错！** ES6 模块的 `import` 必须在文件顶部。

```javascript
// ❌ 错误：import 不能放在函数内部
function load() {
  import { calculateArea } from './math.js' // SyntaxError
}

// ✅ 正确：import 在文件顶部
import { calculateArea } from './math.js'

function load() {
  calculateArea(5)
}

// ✅ 如果需要动态加载，使用 import()
async function load() {
  const { calculateArea } = await import('./math.js')
  calculateArea(5)
}
```

### 误区 2：默认导出和命名导出可以混合使用

**可以，但不推荐！** 保持一致性更好。

```javascript
// ❌ 不推荐：混合使用
export const PI = 3.14159
export default function calculateArea() { /* ... */ }

// ✅ 推荐：统一使用命名导出
export const PI = 3.14159
export function calculateArea() { /* ... */ }

// ✅ 或者统一使用默认导出（导出对象）
export default {
  PI: 3.14159,
  calculateArea: function() { /* ... */ }
}
```

### 误区 3：模块路径可以省略扩展名

**在浏览器中不可以！** 必须指定完整路径。

```javascript
// ❌ 错误：浏览器需要完整路径
import { calculateArea } from './math' // 找不到模块

// ✅ 正确：指定完整路径
import { calculateArea } from './math.js'

// ✅ 如果使用构建工具（Webpack、Vite），可以省略扩展名
import { calculateArea } from './math'
```

### 误区 4：模块中的变量可以被外部修改

**可以，但不推荐！** 应该保持模块的不可变性。

```javascript
// ❌ 不好：导出可变变量
export let count = 0

// 使用方可以直接修改
import { count } from './module.js'
count = 1 // 不推荐！

// ✅ 好：导出常量或函数
export const MAX_COUNT = 100
export let _count = 0

export function increment() {
  _count++
}

export function getCount() {
  return _count
}
```

---

## 12 动手练习

### 练习 1：基础练习

创建一个工具模块，导出格式化日期和价格的函数。

<details>
<summary>点击查看答案</summary>

```javascript
// utils.js
export function formatDate(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatPrice(price) {
  return `¥${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

export function formatTime(date) {
  const d = new Date(date)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}
```

```javascript
// app.js
import { formatDate, formatPrice, formatTime } from './utils.js'

console.log(formatDate(new Date())) // '2024-01-15'
console.log(formatPrice(12345.67)) // '¥12,345.67'
console.log(formatTime(new Date())) // '14:30'
```

</details>

### 练习 2：进阶练习

创建一个计算器模块，包含基本的数学运算。

<details>
<summary>点击查看答案</summary>

```javascript
// calculator.js
const PI = 3.14159

function add(a, b) {
  return a + b
}

function subtract(a, b) {
  return a - b
}

function multiply(a, b) {
  return a * b
}

function divide(a, b) {
  if (b === 0) {
    throw new Error('除数不能为零')
  }
  return a / b
}

function power(base, exponent) {
  return Math.pow(base, exponent)
}

function squareRoot(num) {
  if (num < 0) {
    throw new Error('不能对负数开平方')
  }
  return Math.sqrt(num)
}

export default {
  add,
  subtract,
  multiply,
  divide,
  power,
  squareRoot,
  PI
}
```

```javascript
// app.js
import calc from './calculator.js'

console.log(calc.add(10, 5)) // 15
console.log(calc.multiply(4, 3)) // 12
console.log(calc.power(2, 10)) // 1024
console.log(calc.PI) // 3.14159
```

</details>

### 练习 3（挑战）：综合练习

创建一个完整的项目结构，包含 API 模块、工具模块和主应用。

<details>
<summary>点击查看答案</summary>

```javascript
// src/api/users.js
export async function fetchUsers() {
  const response = await fetch('https://jsonplaceholder.typicode.com/users')
  if (!response.ok) throw new Error('获取用户失败')
  return response.json()
}

export async function fetchUser(userId) {
  const response = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`)
  if (!response.ok) throw new Error('获取用户失败')
  return response.json()
}
```

```javascript
// src/api/posts.js
export async function fetchPosts(userId) {
  const params = new URLSearchParams({ userId })
  const response = await fetch(`https://jsonplaceholder.typicode.com/posts?${params}`)
  if (!response.ok) throw new Error('获取帖子失败')
  return response.json()
}
```

```javascript
// src/api/index.js
export * from './users.js'
export * from './posts.js'
```

```javascript
// src/utils/format.js
export function formatUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    company: user.company.name,
    address: `${user.address.city}, ${user.address.street}`
  }
}

export function formatPost(post) {
  return {
    id: post.id,
    title: post.title,
    excerpt: post.body.slice(0, 50) + '...'
  }
}
```

```javascript
// src/main.js
import { fetchUsers, fetchPosts } from './api/index.js'
import { formatUser, formatPost } from './utils/format.js'

async function main() {
  try {
    console.log('=== 获取用户列表 ===')
    const users = await fetchUsers()
    const formattedUsers = users.slice(0, 3).map(formatUser)
    console.log(formattedUsers)
    
    console.log('\n=== 获取用户帖子 ===')
    const posts = await fetchPosts(1)
    const formattedPosts = posts.slice(0, 3).map(formatPost)
    console.log(formattedPosts)
  } catch (error) {
    console.error('出错了:', error.message)
  }
}

main()
```

</details>

---

## 下一章预告

下一章我们会学习 **本地存储与数据持久化**——让数据在浏览器中保存下来。你会学到 localStorage、sessionStorage 的使用场景和区别，以及更强大的 IndexedDB 数据库。掌握这些技术，你的应用就能像原生 App 一样记住用户的数据了！