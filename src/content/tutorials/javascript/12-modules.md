---
title: "第十二章：模块化开发"
description: "ES Modules、import、export"
---

# 第十二章：模块化开发

## 为什么需要模块化

- 代码复用
- 避免命名冲突
- 便于维护
- 依赖管理

## export 导出

### 命名导出

```javascript
// math.js
export const PI = 3.14159
export const E = 2.71828

export function add(a, b) {
  return a + b
}

export function multiply(a, b) {
  return a * b
}

// 或者统一导出
const PI = 3.14159
function add(a, b) {
  return a + b
}

export { PI, add }
```

### 默认导出

```javascript
// Calculator.js
export default class Calculator {
  add(a, b) {
    return a + b
  }
}

// 或者
class Calculator {
  add(a, b) {
    return a + b
  }
}

export default Calculator
```

## import 导入

### 命名导入

```javascript
// main.js
import { PI, add } from './math.js'

console.log(PI)        // 3.14159
console.log(add(1, 2)) // 3
```

### 默认导入

```javascript
import Calculator from './Calculator.js'

const calc = new Calculator()
console.log(calc.add(1, 2)) // 3
```

### 重命名导入

```javascript
import { add as sum, multiply as mul } from './math.js'

console.log(sum(1, 2))   // 3
console.log(mul(2, 3))   // 6
```

### 导入全部

```javascript
import * as math from './math.js'

console.log(math.PI)        // 3.14159
console.log(math.add(1, 2)) // 3
```

## 混合导出

```javascript
// utils.js
export const VERSION = '1.0.0'

export default function main() {
  console.log('主函数')
}

// main.js
import main, { VERSION } from './utils.js'

main()
console.log(VERSION)
```

## 动态导入

```javascript
// 按需加载
button.addEventListener('click', async () => {
  const module = await import('./heavy-module.js')
  module.doSomething()
})

// 条件加载
if (condition) {
  const { feature } = await import('./feature.js')
  feature()
}
```

## 模块特性

### 严格模式

```javascript
// 模块自动启用严格模式
'use strict' // 不需要，默认启用
```

### 顶层 this

```javascript
// 模块中 this 是 undefined
console.log(this) // undefined
```

### 单例模式

```javascript
// counter.js
let count = 0
export function increment() {
  count++
}
export function getCount() {
  return count
}

// main.js
import { increment, getCount } from './counter.js'
increment()
console.log(getCount()) // 1
// 模块只会被执行一次
```

## 实际项目结构

```
src/
├── modules/
│   ├── api.js
│   ├── utils.js
│   └── constants.js
├── components/
│   ├── header.js
│   └── footer.js
└── main.js
```

### api.js

```javascript
const API_BASE = 'https://api.example.com'

export async function fetchUsers() {
  const response = await fetch(`${API_BASE}/users`)
  return response.json()
}

export async function createUser(data) {
  const response = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return response.json()
}
```

### utils.js

```javascript
export function formatDate(date) {
  return new Intl.DateTimeFormat('zh-CN').format(date)
}

export function debounce(fn, delay = 300) {
  let timer
  return function(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}
```

### main.js

```javascript
import { fetchUsers, createUser } from './modules/api.js'
import { formatDate, debounce } from './modules/utils.js'

async function init() {
  const users = await fetchUsers()
  console.log(users)
  
  const newUser = await createUser({
    name: '张三',
    email: 'zhangsan@example.com'
  })
  console.log(newUser)
}

init()
```

## 在 HTML 中使用

```html
<!-- 传统方式 -->
<script type="module" src="./main.js"></script>

<!-- 内联模块 -->
<script type="module">
  import { greet } from './utils.js'
  greet()
</script>
```

## 浏览器兼容性

```javascript
// 特性检测
if ('noModule' in HTMLScriptElement.prototype) {
  // 支持模块
} else {
  // 不支持模块，使用回退方案
}
```

```html
<script type="module" src="main.js"></script>
<script nomodule src="legacy.js"></script>
```

## 总结

ES Modules 是 JavaScript 的官方模块标准。使用 import/export 可以实现代码的模块化管理，提高代码的可维护性和复用性。
