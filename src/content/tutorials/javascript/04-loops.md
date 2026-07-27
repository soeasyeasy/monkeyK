---
title: "第四章：循环"
description: "for、while、do-while、for...of，让程序高效重复执行"
---

# 第四章：循环

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是循环？为什么需要循环？
- `for`、`while`、`do...while` 有什么区别？该用哪个？
- `for...of` 和 `for...in` 有什么不同？
- `break` 和 `continue` 有什么作用？

这一章就是为了解答这些问题。我们会学习如何让程序高效地重复执行一段代码。

---

## 1 为什么需要循环？

### 痛点分析

想象一下，如果没有循环，你要输出 1 到 10：

```javascript
// ❌ 没有循环：重复写 10 次，非常麻烦
console.log(1)
console.log(2)
console.log(3)
console.log(4)
console.log(5)
console.log(6)
console.log(7)
console.log(8)
console.log(9)
console.log(10)
```

如果要输出 1 到 1000，难道要写 1000 行吗？太不现实了！

### 解决方案

用循环让程序自动重复执行：

```javascript
// ✅ 使用循环：一行代码搞定，无论多少次
for (let i = 1; i <= 10; i++) {
  console.log(i)
}

// 输出 1 到 1000 也很简单
for (let i = 1; i <= 1000; i++) {
  console.log(i)
}
```

> **一句话总结**：循环就像工厂里的流水线，重复执行相同的操作，直到达到目标。

---

## 2 核心原理

### 循环的本质

循环的本质是 **"当满足某个条件时，重复执行一段代码"**。

打个比方：

> 想象你在数数。
> - `for (let i = 1; i <= 10; i++)` 就像"从 1 开始数，数到 10 为止，每次加 1"
> - `while (count < 5)` 就像"只要 count 小于 5，就继续数"

### 循环三要素

一个完整的循环通常包含三个要素：

1. **初始化**：设置循环的起始状态（如 `let i = 0`）
2. **条件**：判断是否继续循环（如 `i < 5`）
3. **更新**：改变循环状态，避免无限循环（如 `i++`）

---

## 3 for 循环

`for` 循环是最常用的循环方式，结构清晰，适合已知循环次数的场景。

```javascript
// for 循环的结构：for (初始化; 条件; 更新) { 循环体 }
for (let i = 0; i < 5; i++) {
  console.log(i) // 输出：0, 1, 2, 3, 4
}
```

### 执行流程

```
1. 初始化：let i = 0
2. 判断条件：i < 5 → true，执行循环体
3. 更新：i++ → i = 1
4. 判断条件：i < 5 → true，执行循环体
5. 更新：i++ → i = 2
...
6. 当 i = 5 时，判断条件：5 < 5 → false，退出循环
```

### 常见用法

```javascript
// 遍历数组（最常见的用法）
const fruits = ['苹果', '香蕉', '橙子']
for (let i = 0; i < fruits.length; i++) {
  console.log(fruits[i]) // '苹果', '香蕉', '橙子'
}

// 倒序遍历
for (let i = fruits.length - 1; i >= 0; i--) {
  console.log(fruits[i]) // '橙子', '香蕉', '苹果'
}

// 跳过某些元素
for (let i = 0; i < 10; i++) {
  if (i % 2 === 0) continue // 跳过偶数
  console.log(i) // 1, 3, 5, 7, 9
}
```

---

## 4 while 循环

`while` 循环适合不知道循环次数，但知道循环条件的场景。

```javascript
let count = 0

// while 循环：当条件为 true 时，重复执行循环体
while (count < 5) {
  console.log(count) // 0, 1, 2, 3, 4
  count++ // 必须更新，否则会无限循环
}
```

### 执行流程

```
1. 判断条件：count < 5 → true（count = 0）
2. 执行循环体：console.log(0)
3. 更新：count++ → count = 1
4. 判断条件：count < 5 → true
5. 执行循环体：console.log(1)
...
6. 当 count = 5 时，判断条件：5 < 5 → false，退出循环
```

### 常见用法

```javascript
// 用户输入验证
let input
while (!input) {
  input = prompt('请输入用户名')
}
console.log(`你好，${input}`)

// 处理队列
const queue = [1, 2, 3, 4, 5]
while (queue.length > 0) {
  const item = queue.shift()
  console.log(item) // 1, 2, 3, 4, 5
}
```

---

## 5 do...while 循环

`do...while` 循环与 `while` 类似，但**至少执行一次**循环体。

```javascript
let num = 0

// do...while：先执行循环体，再判断条件
do {
  console.log(num) // 0
  num++
} while (num < 5) // 然后继续：1, 2, 3, 4
```

### do...while vs while

```javascript
// while：条件不满足，一次都不执行
let a = 5
while (a < 5) {
  console.log('while 执行') // 不会执行
}

// do...while：条件不满足，也会执行一次
let b = 5
do {
  console.log('do...while 执行') // 会执行一次
} while (b < 5)
```

### 常见用法

```javascript
// 游戏菜单：至少显示一次菜单
let choice
do {
  choice = prompt('请选择：1.开始游戏 2.设置 3.退出')
  switch (choice) {
    case '1':
      console.log('开始游戏')
      break
    case '2':
      console.log('设置')
      break
    case '3':
      console.log('退出')
      break
    default:
      console.log('无效选择，请重新选择')
  }
} while (choice !== '3')
```

---

## 6 for...of 循环

`for...of` 循环用于遍历**可迭代对象**（数组、字符串、Map、Set 等）。

```javascript
const fruits = ['苹果', '香蕉', '橙子']

// for...of：直接获取每个元素的值
for (const fruit of fruits) {
  console.log(fruit) // '苹果', '香蕉', '橙子'
}

// 遍历字符串
const str = 'hello'
for (const char of str) {
  console.log(char) // 'h', 'e', 'l', 'l', 'o'
}

// 获取索引（使用 Array.prototype.entries()）
for (const [index, fruit] of fruits.entries()) {
  console.log(`${index}: ${fruit}`) // '0: 苹果', '1: 香蕉', '2: 橙子'
}
```

---

## 7 for...in 循环

`for...in` 循环用于遍历**对象的可枚举属性**。

```javascript
const person = { name: '张三', age: 25, city: '北京' }

// for...in：获取对象的每个键
for (const key in person) {
  console.log(`${key}: ${person[key]}`)
  // 'name: 张三', 'age: 25', 'city: 北京'
}
```

### for...in vs for...of

| 特性 | for...in | for...of |
| --- | --- | --- |
| 遍历对象 | ✅ 适合 | ❌ 不适合 |
| 遍历数组 | ✅ 不推荐（会遍历原型链） | ✅ 推荐 |
| 获取内容 | 获取键（索引/属性名） | 获取值 |
| 顺序 | 不确定 | 按顺序 |

```javascript
// ❌ 不推荐用 for...in 遍历数组
const arr = ['a', 'b', 'c']
Array.prototype.extra = '额外属性'

for (const key in arr) {
  console.log(key) // '0', '1', '2', 'extra' ❗ 遍历到了原型链上的属性
}

// ✅ 推荐用 for...of 遍历数组
for (const value of arr) {
  console.log(value) // 'a', 'b', 'c' ✅ 只遍历数组元素
}
```

---

## 8 数组方法（函数式遍历）

现代 JavaScript 提供了更优雅的数组遍历方法。

### forEach

`forEach` 对数组的每个元素执行一次回调函数：

```javascript
const numbers = [1, 2, 3, 4, 5]

numbers.forEach((num, index) => {
  console.log(`${index}: ${num}`) // '0: 1', '1: 2', '2: 3', '3: 4', '4: 5'
})
```

### map

`map` 返回一个新数组，每个元素是回调函数的返回值：

```javascript
const numbers = [1, 2, 3]
const doubled = numbers.map(num => num * 2)
console.log(doubled) // [2, 4, 6]
```

### filter

`filter` 返回一个新数组，包含满足条件的元素：

```javascript
const numbers = [1, 2, 3, 4, 5]
const evens = numbers.filter(num => num % 2 === 0)
console.log(evens) // [2, 4]
```

### reduce

`reduce` 将数组累积为一个值：

```javascript
const numbers = [1, 2, 3, 4]
const sum = numbers.reduce((acc, num) => acc + num, 0)
console.log(sum) // 10
```

### some 和 every

```javascript
const numbers = [1, 2, 3, 4, 5]

// some：至少一个满足条件
console.log(numbers.some(n => n > 3)) // true

// every：全部满足条件
console.log(numbers.every(n => n > 0)) // true
```

---

## 9 break 和 continue

### break：跳出循环

```javascript
// 找到目标后立即退出循环
for (let i = 0; i < 10; i++) {
  if (i === 5) break
  console.log(i) // 0, 1, 2, 3, 4
}
```

### continue：跳过本次循环

```javascript
// 跳过某些元素，继续下一次循环
for (let i = 0; i < 5; i++) {
  if (i === 2) continue
  console.log(i) // 0, 1, 3, 4
}
```

---

## 10 嵌套循环

循环可以嵌套，用于处理多维数据。

```javascript
// 打印乘法口诀表
for (let i = 1; i <= 3; i++) {
  for (let j = 1; j <= 3; j++) {
    console.log(`${i} x ${j} = ${i * j}`)
  }
}

// 输出：
// 1 x 1 = 1
// 1 x 2 = 2
// 1 x 3 = 3
// 2 x 1 = 2
// 2 x 2 = 4
// 2 x 3 = 6
// 3 x 1 = 3
// 3 x 2 = 6
// 3 x 3 = 9
```

### 跳转到外层循环

```javascript
// 使用标签跳转到外层循环
outer: for (let i = 1; i <= 3; i++) {
  for (let j = 1; j <= 3; j++) {
    if (i * j === 4) {
      console.log(`找到 4：${i} x ${j}`)
      break outer // 跳出外层循环
    }
    console.log(`${i} x ${j} = ${i * j}`)
  }
}
```

---

## 11 无限循环

### 危险的无限循环

```javascript
// ❌ 危险！永远不会退出，浏览器会卡死
// while (true) {
//   console.log('永远运行')
// }
```

### 安全的无限循环（带 break）

```javascript
// ✅ 安全：有退出条件
while (true) {
  const input = prompt('输入 quit 退出')
  if (input === 'quit') break
  console.log(`你输入了：${input}`)
}
```

---

## 12 性能优化

### 缓存数组长度

```javascript
const arr = [1, 2, 3, 4, 5]

// ❌ 每次循环都计算 length
for (let i = 0; i < arr.length; i++) {
  console.log(arr[i])
}

// ✅ 缓存 length，性能更好
for (let i = 0, len = arr.length; i < len; i++) {
  console.log(arr[i])
}
```

### 选择合适的循环方式

| 场景 | 推荐方式 |
| --- | --- |
| 已知循环次数 | `for` |
| 不确定次数但有条件 | `while` |
| 至少执行一次 | `do...while` |
| 遍历数组元素 | `for...of` 或 `forEach` |
| 遍历对象属性 | `for...in` |
| 需要返回新数组 | `map` |
| 需要过滤元素 | `filter` |
| 需要累积值 | `reduce` |

---

## 13 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| for 循环 | 已知循环次数，结构清晰 |
| while 循环 | 不确定次数，条件满足时执行 |
| do...while | 至少执行一次，再判断条件 |
| for...of | 遍历可迭代对象，获取值 |
| for...in | 遍历对象属性，获取键 |
| forEach/map/filter | 函数式遍历，代码更简洁 |
| break | 跳出循环 |
| continue | 跳过本次循环 |

---

## 14 新手常见误区

### 误区 1：for...in 可以安全遍历数组

**错！** `for...in` 会遍历原型链上的属性。

```javascript
// ❌ 错误：遍历到了原型链上的属性
const arr = ['a', 'b', 'c']
Array.prototype.test = 'test'

for (const key in arr) {
  console.log(key) // '0', '1', '2', 'test' ❗
}

// ✅ 正确：使用 for...of 或 for
for (const value of arr) {
  console.log(value) // 'a', 'b', 'c' ✅
}
```

### 误区 2：忘记更新循环变量

**错！** 会导致无限循环。

```javascript
// ❌ 错误：忘记 i++，无限循环
// for (let i = 0; i < 5; ) {
//   console.log(i)
// }

// ✅ 正确：记得更新循环变量
for (let i = 0; i < 5; i++) {
  console.log(i)
}
```

### 误区 3：forEach 中可以用 break/continue

**错！** `forEach` 不支持 `break` 和 `continue`。

```javascript
// ❌ 错误：forEach 中不能用 break
// const arr = [1, 2, 3, 4, 5]
// arr.forEach(num => {
//   if (num === 3) break // Uncaught SyntaxError
//   console.log(num)
// })

// ✅ 正确：用 for...of 替代
for (const num of [1, 2, 3, 4, 5]) {
  if (num === 3) break
  console.log(num) // 1, 2
}
```

### 误区 4：循环条件写错导致少执行一次

**错！** 注意边界条件。

```javascript
// ❌ 错误：i < 5 导致只循环 0-4，少了一次
for (let i = 0; i < 5; i++) {
  console.log(i) // 0, 1, 2, 3, 4
}

// ✅ 正确：如果要输出 1-5，应该是 i <= 5
for (let i = 1; i <= 5; i++) {
  console.log(i) // 1, 2, 3, 4, 5
}
```

---

## 15 动手练习

### 练习 1：基础练习

写一个函数，计算数组中所有数字的和。

<details>
<summary>点击查看答案</summary>

```javascript
function sumArray(arr) {
  let sum = 0
  
  // 使用 for 循环
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i]
  }
  
  return sum
}

// 使用 reduce（更简洁）
function sumArray2(arr) {
  return arr.reduce((acc, num) => acc + num, 0)
}

// 测试
console.log(sumArray([1, 2, 3, 4, 5])) // 15
console.log(sumArray2([10, 20, 30]))   // 60
```

</details>

### 练习 2：进阶练习

写一个函数，找出数组中的最大值和最小值。

<details>
<summary>点击查看答案</summary>

```javascript
function findMinMax(arr) {
  if (arr.length === 0) {
    return { min: undefined, max: undefined }
  }
  
  let min = arr[0]
  let max = arr[0]
  
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < min) {
      min = arr[i]
    }
    if (arr[i] > max) {
      max = arr[i]
    }
  }
  
  return { min, max }
}

// 测试
console.log(findMinMax([3, 1, 4, 1, 5, 9])) // { min: 1, max: 9 }
console.log(findMinMax([-5, -2, -8]))       // { min: -8, max: -2 }
console.log(findMinMax([]))                 // { min: undefined, max: undefined }
```

</details>

### 练习 3（挑战）：综合练习

写一个函数，生成斐波那契数列的前 n 项。斐波那契数列：1, 1, 2, 3, 5, 8, 13...

<details>
<summary>点击查看答案</summary>

```javascript
function fibonacci(n) {
  if (n <= 0) return []
  if (n === 1) return [1]
  
  const result = [1, 1]
  
  // 从第 3 项开始，每项等于前两项之和
  for (let i = 2; i < n; i++) {
    result[i] = result[i - 1] + result[i - 2]
  }
  
  return result
}

// 测试
console.log(fibonacci(5))  // [1, 1, 2, 3, 5]
console.log(fibonacci(10)) // [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
console.log(fibonacci(1))  // [1]
console.log(fibonacci(0))  // []
```

</details>

---

## 下一章预告

下一章我们会学习 **函数**——也就是把一段代码打包成一个可复用的模块。你会学到函数声明、箭头函数、参数、闭包等核心概念。掌握这些，你就能写出模块化、可复用的代码了！