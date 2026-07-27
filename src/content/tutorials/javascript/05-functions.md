---
title: "第五章：函数"
description: "函数声明、箭头函数、参数、闭包，掌握代码复用的核心"
---

# 第五章：函数

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是函数？为什么需要函数？
- 函数声明和箭头函数有什么区别？
- `this` 到底指向哪里？为什么有时候会变？
- 什么是闭包？闭包有什么用？

这一章就是为了解答这些问题。我们会学习如何把代码打包成可复用的模块。

---

## 1 为什么需要函数？

### 痛点分析

想象一下，如果没有函数，你要计算圆的面积，每次都要写一遍公式：

```javascript
// ❌ 没有函数：重复写相同的代码
const radius1 = 5
const area1 = 3.14159 * radius1 * radius1
console.log(area1)

const radius2 = 10
const area2 = 3.14159 * radius2 * radius2
console.log(area2)

const radius3 = 7
const area3 = 3.14159 * radius3 * radius3
console.log(area3)
```

如果要修改圆周率，你得把所有地方都改一遍！

### 解决方案

用函数封装重复的逻辑：

```javascript
// ✅ 使用函数：一次定义，多次调用
function calculateCircleArea(radius) {
  return 3.14159 * radius * radius
}

console.log(calculateCircleArea(5))  // 78.53975
console.log(calculateCircleArea(10)) // 314.159
console.log(calculateCircleArea(7))  // 153.93791
```

> **一句话总结**：函数就像一个工具箱里的工具，一次制作，随时使用。

---

## 2 核心原理

### 函数的本质

函数是一段 **可复用的代码块**，可以接收输入（参数），处理后返回输出（返回值）。

打个比方：

> 想象你去咖啡店点咖啡。
> - `function makeCoffee(type)` 就像"制作咖啡的机器"
> - `type` 参数就像你点的咖啡类型（拿铁、美式）
> - `return coffee` 就像机器给你的咖啡
> - `makeCoffee('拿铁')` 就像你告诉机器"来杯拿铁"

### 函数的生命周期

1. **定义**：声明函数，告诉 JavaScript "这个函数叫什么，做什么"
2. **调用**：执行函数，告诉 JavaScript "现在执行这个函数"
3. **执行**：函数内部的代码一行行运行
4. **返回**：函数结束，把结果返回给调用者

---

## 3 函数声明

函数声明是最传统的定义方式。

```javascript
// function 关键字 + 函数名 + 参数 + 函数体
function greet(name) {
  // 函数体：要执行的代码
  return `你好，${name}！`
}

// 调用函数：函数名 + 括号 + 参数
console.log(greet('张三')) // '你好，张三！'
console.log(greet('李四')) // '你好，李四！'
```

### 函数提升

函数声明会被提升到作用域顶部，可以在定义之前调用：

```javascript
// ✅ 可以在定义之前调用
console.log(sum(1, 2)) // 3

function sum(a, b) {
  return a + b
}
```

---

## 4 函数表达式

函数表达式是把函数赋值给一个变量。

```javascript
// 匿名函数表达式
const greet = function(name) {
  return `你好，${name}！`
}

console.log(greet('张三')) // '你好，张三！'

// 命名函数表达式（函数名只能在函数内部使用）
const factorial = function fact(n) {
  if (n <= 1) return 1
  return n * fact(n - 1) // 可以递归调用
}

console.log(factorial(5)) // 120
```

### 函数表达式 vs 函数声明

| 特性 | 函数声明 | 函数表达式 |
| --- | --- | --- |
| 提升 | 会被提升到顶部 | 不会被提升 |
| 调用时机 | 可以在定义前调用 | 只能在定义后调用 |
| 命名 | 必须有名字 | 可以匿名 |
| 使用场景 | 通用函数 | 临时使用、回调函数 |

---

## 5 箭头函数

箭头函数是 ES6 引入的简写形式，语法更简洁。

```javascript
// 完整形式
const add = (a, b) => {
  return a + b
}

// 简写（单行返回，省略 return 和大括号）
const add2 = (a, b) => a + b

// 单参数（可省略括号）
const double = x => x * 2

// 无参数（必须写括号）
const sayHi = () => console.log('你好')

// 返回对象（需要用括号包裹）
const createUser = (name, age) => ({ name, age })
```

### 箭头函数的特点

| 特性 | 普通函数 | 箭头函数 |
| --- | --- | --- |
| `this` 指向 | 调用时确定 | 定义时确定（继承外层作用域） |
| `arguments` | 有 | 没有 |
| `prototype` | 有 | 没有 |
| `new` | 可以作为构造函数 | 不可以 |
| 用途 | 通用 | 回调函数、简洁逻辑 |

---

## 6 参数

### 默认参数

```javascript
// 参数可以设置默认值
function greet(name = '访客') {
  return `你好，${name}！`
}

console.log(greet())      // '你好，访客！'
console.log(greet('张三')) // '你好，张三！'
```

### 剩余参数

```javascript
// ... 收集所有剩余参数为一个数组
function sum(...numbers) {
  return numbers.reduce((total, num) => total + num, 0)
}

console.log(sum(1, 2, 3))    // 6
console.log(sum(1, 2, 3, 4)) // 10
```

### 解构参数

```javascript
// 直接从对象中解构参数
function display({ name, age }) {
  console.log(`${name}，${age}岁`)
}

const person = { name: '张三', age: 25 }
display(person) // '张三，25岁'

// 设置默认值
function displayUser({ name = '匿名', age = 0 }) {
  console.log(`${name}，${age}岁`)
}

displayUser({}) // '匿名，0岁'
```

### 展开参数

```javascript
// 使用 ... 展开数组作为参数
const numbers = [1, 2, 3]

function add(a, b, c) {
  return a + b + c
}

console.log(add(...numbers)) // 6
```

---

## 7 返回值

```javascript
// 单返回值
function square(x) {
  return x * x
}

console.log(square(5)) // 25

// 多返回值（通过对象）
function getMinMax(arr) {
  return {
    min: Math.min(...arr),
    max: Math.max(...arr)
  }
}

const { min, max } = getMinMax([3, 1, 4, 1, 5])
console.log(min, max) // 1, 5

// 无返回值（默认返回 undefined）
function sayHello() {
  console.log('你好')
}

console.log(sayHello()) // undefined
```

---

## 8 回调函数

回调函数是作为参数传递给另一个函数的函数。

```javascript
function processData(data, callback) {
  // 处理数据
  const result = data.toUpperCase()
  // 调用回调函数，把结果传给它
  callback(result)
}

processData('hello', console.log) // 'HELLO'

// 更复杂的例子
function fetchUser(id, onSuccess, onError) {
  setTimeout(() => {
    const user = { id, name: '张三' }
    onSuccess(user)
  }, 1000)
}

fetchUser(1, 
  (user) => console.log('成功:', user),
  (error) => console.error('失败:', error)
)
```

---

## 9 立即执行函数（IIFE）

IIFE 是定义后立即执行的函数，用于创建私有作用域。

```javascript
// 传统写法
;(function() {
  const message = '立即执行'
  console.log(message) // '立即执行'
})()

// 箭头函数形式
;(() => {
  console.log('立即执行')
})()

// 带参数的 IIFE
;(function(name) {
  console.log(`你好，${name}`)
})('张三') // '你好，张三'
```

> **注意**：开头的 `;` 是为了防止前面的代码没有分号导致错误。

---

## 10 高阶函数

高阶函数是接收函数作为参数或返回函数的函数。

```javascript
// 返回函数的函数
function multiplier(factor) {
  return (number) => number * factor
}

const double = multiplier(2)
const triple = multiplier(3)

console.log(double(5))  // 10
console.log(triple(5))  // 15

// 接收函数作为参数的函数
function applyOperation(arr, operation) {
  return arr.map(operation)
}

const numbers = [1, 2, 3]
const squared = applyOperation(numbers, x => x * x)
console.log(squared) // [1, 4, 9]
```

---

## 11 闭包

闭包是函数能够记住并访问其词法作用域的能力。

```javascript
function counter() {
  // 私有变量：外部无法直接访问
  let count = 0
  
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count
  }
}

const counter1 = counter()
console.log(counter1.increment()) // 1
console.log(counter1.increment()) // 2
console.log(counter1.getCount())  // 2
console.log(counter1.decrement()) // 1

// 每个闭包有独立的作用域
const counter2 = counter()
console.log(counter2.getCount())  // 0
```

### 闭包的用途

| 用途 | 说明 |
| --- | --- |
| 数据封装 | 创建私有变量，防止外部修改 |
| 函数工厂 | 根据参数创建不同功能的函数 |
| 回调函数 | 在异步操作中保持状态 |
| 模块化 | 模拟私有方法 |

---

## 12 this 关键字

`this` 指向函数的**调用者**，但在不同场景下指向不同。

### 普通函数中的 this

```javascript
const obj = {
  name: '张三',
  greet: function() {
    console.log(`你好，我是${this.name}`)
  }
}

obj.greet() // '你好，我是张三'（this 指向 obj）

const greet = obj.greet
greet() // '你好，我是undefined'（this 指向全局对象）
```

### 箭头函数中的 this

箭头函数没有自己的 `this`，它继承外层作用域的 `this`：

```javascript
const obj = {
  name: '张三',
  greet: () => {
    console.log(`你好，我是${this.name}`) // this 指向全局对象
  },
  sayHi() {
    // 箭头函数继承外层的 this（sayHi 的 this）
    setTimeout(() => {
      console.log(`你好，我是${this.name}`) // '你好，我是张三'
    }, 1000)
  }
}
```

### 改变 this 指向

```javascript
function greet(greeting) {
  console.log(`${greeting}，我是${this.name}`)
}

const person = { name: '张三' }

// call：立即执行，参数逐个传递
greet.call(person, '你好')  // '你好，我是张三'

// apply：立即执行，参数放在数组中
greet.apply(person, ['你好']) // '你好，我是张三'

// bind：返回新函数，不立即执行
const boundGreet = greet.bind(person)
boundGreet('你好')  // '你好，我是张三'
```

---

## 13 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 函数声明 | `function name() {}`，会被提升 |
| 函数表达式 | `const name = function() {}`，不会被提升 |
| 箭头函数 | `const name = () => {}`，语法简洁，没有自己的 this |
| 默认参数 | 参数可以设置默认值 |
| 剩余参数 | `...args` 收集所有参数为数组 |
| 解构参数 | 从对象/数组中提取参数 |
| 回调函数 | 作为参数传递的函数 |
| 高阶函数 | 接收或返回函数的函数 |
| 闭包 | 函数记住并访问词法作用域 |
| this | 指向调用者，箭头函数继承外层 this |

---

## 14 新手常见误区

### 误区 1：箭头函数和普通函数完全一样

**错！** 箭头函数没有自己的 `this`、`arguments` 和 `prototype`。

```javascript
const obj = {
  count: 0,
  // ❌ 错误：箭头函数的 this 不指向 obj
  increment: () => {
    this.count++ // this 指向全局对象
  },
  // ✅ 正确：普通函数的 this 指向 obj
  increment2() {
    this.count++
  }
}

obj.increment2()
console.log(obj.count) // 1
```

### 误区 2：闭包会导致内存泄漏

**不完全对！** 闭包本身不会导致内存泄漏，不合理的使用才会。

```javascript
// ❌ 不好：全局变量引用闭包，导致闭包无法被垃圾回收
let globalCounter
function createCounter() {
  let count = 0
  globalCounter = () => ++count
}

createCounter()

// ✅ 好：使用完后释放引用
function useCounter() {
  let counter = createCounter()
  counter()
  counter = null // 释放引用
}
```

### 误区 3：`arguments` 是数组

**错！** `arguments` 是类数组对象，不是真正的数组。

```javascript
function sum() {
  // ❌ arguments 不是数组，没有 map 方法
  // arguments.map(x => x * 2) // Uncaught TypeError
  
  // ✅ 转为真正的数组
  const args = Array.from(arguments)
  return args.reduce((acc, num) => acc + num, 0)
}

// ✅ 更好：使用剩余参数
function sumBetter(...numbers) {
  return numbers.reduce((acc, num) => acc + num, 0)
}
```

### 误区 4：函数表达式可以在定义前调用

**错！** 函数表达式不会被提升。

```javascript
// ❌ 错误：函数表达式不会被提升
// console.log(add(1, 2)) // Uncaught ReferenceError

const add = function(a, b) {
  return a + b
}

console.log(add(1, 2)) // 3 ✅
```

---

## 15 动手练习

### 练习 1：基础练习

写一个函数，接收两个数字，返回较大的那个。

<details>
<summary>点击查看答案</summary>

```javascript
function max(a, b) {
  // 方法一：使用三元运算符
  return a > b ? a : b
  
  // 方法二：使用 Math.max
  // return Math.max(a, b)
}

// 测试
console.log(max(5, 10))  // 10
console.log(max(-3, -1)) // -1
console.log(max(0, 0))   // 0
```

</details>

### 练习 2：进阶练习

写一个防抖函数（debounce），用于限制函数的执行频率。

<details>
<summary>点击查看答案</summary>

```javascript
function debounce(fn, delay = 300) {
  let timer = null
  
  return function(...args) {
    // 如果之前有定时器，先清除
    if (timer) {
      clearTimeout(timer)
    }
    
    // 创建新的定时器
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 测试
const debouncedLog = debounce((msg) => {
  console.log('执行:', msg)
}, 500)

// 连续调用，只有最后一次会执行
debouncedLog('第一次')
debouncedLog('第二次')
debouncedLog('第三次')
// 500ms 后输出：'执行: 第三次'
```

</details>

### 练习 3（挑战）：综合练习

写一个柯里化函数（curry），把多参数函数转换成单参数函数的链式调用。

<details>
<summary>点击查看答案</summary>

```javascript
function curry(fn) {
  return function curried(...args) {
    // 如果参数足够，直接执行原函数
    if (args.length >= fn.length) {
      return fn(...args)
    }
    
    // 如果参数不够，返回一个新函数，等待接收剩余参数
    return function(...nextArgs) {
      return curried(...args, ...nextArgs)
    }
  }
}

// 测试
function add(a, b, c) {
  return a + b + c
}

const curriedAdd = curry(add)

// 可以一次传入所有参数
console.log(curriedAdd(1, 2, 3)) // 6

// 也可以分多次传入
console.log(curriedAdd(1)(2)(3)) // 6
console.log(curriedAdd(1, 2)(3)) // 6
console.log(curriedAdd(1)(2, 3)) // 6
```

</details>

---

## 下一章预告

下一章我们会学习 **数组**——JavaScript 中最常用的数据结构。你会学到数组的创建、访问、修改，以及强大的数组方法（map、filter、reduce 等）。掌握这些，你就能高效处理批量数据了！