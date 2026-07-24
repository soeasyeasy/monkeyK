---
title: "第六章：数组"
description: "数组方法、解构、展开运算符，掌握批量数据处理"
---

# 第六章：数组

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是数组？为什么需要数组？
- `push`、`pop`、`shift`、`unshift` 有什么区别？
- `map`、`filter`、`reduce` 到底怎么用？
- 数组是引用类型，那复制数组时要注意什么？

这一章就是为了解答这些问题。我们会学习如何高效地处理批量数据。

---

## 6.1 为什么需要数组？

### 痛点分析

想象一下，如果没有数组，你要存储多个用户信息：

```javascript
// ❌ 没有数组：每个数据都要单独声明变量，难以管理
const user1Name = '张三'
const user1Age = 25
const user2Name = '李四'
const user2Age = 30
const user3Name = '王五'
const user3Age = 28
```

如果有 100 个用户，就要声明 200 个变量！太不现实了！

### 解决方案

用数组存储多个数据：

```javascript
// ✅ 使用数组：一个变量存储多个数据
const users = [
  { name: '张三', age: 25 },
  { name: '李四', age: 30 },
  { name: '王五', age: 28 }
]

// 遍历数组，统一处理
users.forEach(user => {
  console.log(`${user.name}，${user.age}岁`)
})
```

> **一句话总结**：数组就像一个收纳盒，可以把多个相关的数据放在一起，方便管理和操作。

---

## 6.2 核心原理

### 数组的本质

数组是一个 **有序的数据列表**，每个元素都有一个索引（从 0 开始）。

打个比方：

> 想象你去超市购物，把东西放进购物车。
> - `const cart = ['苹果', '香蕉', '橙子']` 就像购物车
> - `cart[0]` 就像购物车第一层的苹果
> - `cart[1]` 就像购物车第二层的香蕉
> - `cart.length` 就像购物车有多少件商品

### 数组是引用类型

数组是引用类型，变量存储的是指向数组的地址：

```javascript
const arr1 = [1, 2, 3]
const arr2 = arr1 // 复制的是地址，不是值

arr2.push(4)
console.log(arr1) // [1, 2, 3, 4] ❗ arr1 也被修改了
```

---

## 6.3 创建数组

```javascript
// 字面量（最常用）
const arr1 = [1, 2, 3]

// 构造函数
const arr2 = new Array(1, 2, 3) // [1, 2, 3]

// ❌ 注意：单个数字参数表示数组长度
const arr3 = new Array(3) // [empty × 3]，长度为3的空数组

// Array.from：从类数组对象创建数组
const arr4 = Array.from('hello') // ['h', 'e', 'l', 'l', 'o']

// Array.of：创建数组（避免 new Array 的歧义）
const arr5 = Array.of(3) // [3]，不是长度为3的数组
const arr6 = Array.of(1, 2, 3) // [1, 2, 3]

// 创建填充数组
const arr7 = Array(5).fill(0) // [0, 0, 0, 0, 0]
```

---

## 6.4 访问元素

```javascript
const fruits = ['苹果', '香蕉', '橙子']

// 通过索引访问（索引从0开始）
console.log(fruits[0])  // '苹果'
console.log(fruits[1])  // '香蕉'
console.log(fruits[2])  // '橙子'

// 访问不存在的索引，返回 undefined
console.log(fruits[10]) // undefined

// 使用 at() 方法（支持负数索引）
console.log(fruits.at(-1)) // '橙子'（最后一个元素）
console.log(fruits.at(-2)) // '香蕉'（倒数第二个元素）

// 获取数组长度
console.log(fruits.length) // 3
```

---

## 6.5 修改数组

### 添加元素

```javascript
const arr = [1, 2, 3]

// push：末尾添加，返回新长度
const newLength = arr.push(4)
console.log(arr)         // [1, 2, 3, 4]
console.log(newLength)   // 4

// unshift：开头添加，返回新长度
arr.unshift(0)
console.log(arr)         // [0, 1, 2, 3, 4]

// 直接赋值（如果索引超出范围，中间会有空位）
arr[5] = 5
console.log(arr)         // [0, 1, 2, 3, 4, 5]
```

### 删除元素

```javascript
const arr = [0, 1, 2, 3, 4]

// pop：删除末尾元素，返回被删除的元素
const last = arr.pop()
console.log(arr)   // [0, 1, 2, 3]
console.log(last)  // 4

// shift：删除开头元素，返回被删除的元素
const first = arr.shift()
console.log(arr)   // [1, 2, 3]
console.log(first) // 0

// splice：删除/插入元素
// splice(起始索引, 删除数量, 插入的元素...)
const arr2 = [1, 2, 3, 4, 5]
const removed = arr2.splice(1, 2) // 从索引1删除2个元素
console.log(arr2)     // [1, 4, 5]
console.log(removed)  // [2, 3]

// 插入元素（删除数量为0）
arr2.splice(1, 0, 2, 3)
console.log(arr2)     // [1, 2, 3, 4, 5]
```

---

## 6.6 查找元素

```javascript
const numbers = [1, 2, 3, 4, 5]

// indexOf：查找元素的索引，找不到返回-1
console.log(numbers.indexOf(3))  // 2
console.log(numbers.indexOf(10)) // -1

// lastIndexOf：从后面开始查找
const arr = [1, 2, 3, 2, 1]
console.log(arr.lastIndexOf(2)) // 3

// includes：判断元素是否存在，返回布尔值
console.log(numbers.includes(3)) // true
console.log(numbers.includes(10)) // false

// find：查找第一个满足条件的元素，找不到返回undefined
const found = numbers.find(n => n > 3)
console.log(found) // 4

// findIndex：查找第一个满足条件的元素的索引
const index = numbers.findIndex(n => n > 3)
console.log(index) // 3
```

---

## 6.7 转换方法

```javascript
const arr = [1, 2, 3]

// join：数组转字符串
console.log(arr.join('-'))   // '1-2-3'
console.log(arr.join(', '))  // '1, 2, 3'
console.log(arr.join(''))    // '123'

// toString：数组转字符串（默认用逗号分隔）
console.log(arr.toString())  // '1,2,3'

// toLocaleString：本地化转换
const dates = [new Date(), new Date(Date.now() + 86400000)]
console.log(dates.toLocaleString()) // '2024/1/1 12:00:00, 2024/1/2 12:00:00'
```

---

## 6.8 数组方法

### forEach

`forEach` 对每个元素执行回调，无返回值：

```javascript
const fruits = ['苹果', '香蕉', '橙子']
fruits.forEach((fruit, index) => {
  console.log(`${index}: ${fruit}`)
})
// 0: 苹果
// 1: 香蕉
// 2: 橙子
```

### map

`map` 返回新数组，每个元素是回调的返回值：

```javascript
const numbers = [1, 2, 3]
const doubled = numbers.map(n => n * 2)
console.log(doubled) // [2, 4, 6]

// 实际应用：提取对象属性
const users = [
  { name: '张三', age: 25 },
  { name: '李四', age: 30 }
]
const names = users.map(user => user.name)
console.log(names) // ['张三', '李四']
```

### filter

`filter` 返回新数组，包含满足条件的元素：

```javascript
const numbers = [1, 2, 3, 4, 5]
const evens = numbers.filter(n => n % 2 === 0)
console.log(evens) // [2, 4]

// 实际应用：过滤数据
const users = [
  { name: '张三', age: 25, active: true },
  { name: '李四', age: 30, active: false }
]
const activeUsers = users.filter(user => user.active)
console.log(activeUsers) // [{ name: '张三', age: 25, active: true }]
```

### reduce

`reduce` 将数组累积为一个值：

```javascript
const numbers = [1, 2, 3, 4]

// 求和
const sum = numbers.reduce((acc, n) => acc + n, 0)
console.log(sum) // 10

// 求乘积
const product = numbers.reduce((acc, n) => acc * n, 1)
console.log(product) // 24

// 统计出现次数
const words = ['apple', 'banana', 'apple', 'orange']
const count = words.reduce((acc, word) => {
  acc[word] = (acc[word] || 0) + 1
  return acc
}, {})
console.log(count) // { apple: 2, banana: 1, orange: 1 }
```

### some 和 every

```javascript
const numbers = [1, 2, 3, 4, 5]

// some：至少一个满足条件
console.log(numbers.some(n => n > 3))  // true

// every：全部满足条件
console.log(numbers.every(n => n > 0)) // true
console.log(numbers.every(n => n > 3)) // false
```

### flat 和 flatMap

```javascript
// flat：扁平化数组
const nested = [1, [2, 3], [4, [5]]]
console.log(nested.flat())    // [1, 2, 3, 4, [5]]（默认深度1）
console.log(nested.flat(2))   // [1, 2, 3, 4, 5]（深度2）
console.log(nested.flat(Infinity)) // [1, 2, 3, 4, 5]（无限深度）

// flatMap：先 map 再 flat（深度1）
const arr = [1, 2, 3]
const result = arr.flatMap(n => [n, n * 2])
console.log(result) // [1, 2, 2, 4, 3, 6]
```

### sort

```javascript
const numbers = [3, 1, 4, 1, 5]

// ❌ 默认按字符串排序，不是数字排序
console.log(numbers.sort()) // [1, 1, 3, 4, 5] ✅ 刚好正确
console.log([10, 2, 3].sort()) // [10, 2, 3] ❌ 按字符串排序了

// ✅ 数字排序（升序）
numbers.sort((a, b) => a - b)
console.log(numbers) // [1, 1, 3, 4, 5]

// ✅ 数字排序（降序）
numbers.sort((a, b) => b - a)
console.log(numbers) // [5, 4, 3, 1, 1]

// ✅ 按对象属性排序
const users = [
  { name: '张三', age: 25 },
  { name: '李四', age: 30 },
  { name: '王五', age: 20 }
]
users.sort((a, b) => a.age - b.age)
console.log(users) // 按年龄升序排列
```

### reverse

```javascript
const arr = [1, 2, 3]
arr.reverse()
console.log(arr) // [3, 2, 1]
```

---

## 6.9 解构赋值

```javascript
const [a, b, c] = [1, 2, 3]
console.log(a, b, c) // 1, 2, 3

// 跳过元素
const [first, , third] = [1, 2, 3]
console.log(first, third) // 1, 3

// 剩余元素
const [head, ...tail] = [1, 2, 3, 4]
console.log(head) // 1
console.log(tail) // [2, 3, 4]

// 默认值
const [x, y = 10] = [5]
console.log(x, y) // 5, 10

// 交换变量
let num1 = 1
let num2 = 2
[num1, num2] = [num2, num1]
console.log(num1, num2) // 2, 1
```

---

## 6.10 展开运算符

```javascript
const arr1 = [1, 2, 3]
const arr2 = [4, 5, 6]

// 合并数组
const merged = [...arr1, ...arr2]
console.log(merged) // [1, 2, 3, 4, 5, 6]

// 复制数组（浅拷贝）
const copy = [...arr1]
console.log(copy) // [1, 2, 3]

// 添加元素
const withNew = [...arr1, 4, 5]
console.log(withNew) // [1, 2, 3, 4, 5]

// 作为函数参数
function add(a, b, c) {
  return a + b + c
}
console.log(add(...arr1)) // 6

// 与解构结合
const [first, ...rest] = [1, 2, 3, 4]
console.log(first) // 1
console.log(rest)  // [2, 3, 4]
```

---

## 6.11 数组迭代器

```javascript
const arr = ['a', 'b', 'c']

// entries()：返回索引和值的迭代器
for (const [index, value] of arr.entries()) {
  console.log(`${index}: ${value}`)
}

// keys()：返回索引的迭代器
for (const key of arr.keys()) {
  console.log(key)
}

// values()：返回值的迭代器
for (const value of arr.values()) {
  console.log(value)
}
```

---

## 6.12 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 创建数组 | `[]`、`new Array()`、`Array.from()`、`Array.of()` |
| 访问元素 | `arr[index]`、`arr.at(index)` |
| 添加元素 | `push()`（末尾）、`unshift()`（开头） |
| 删除元素 | `pop()`（末尾）、`shift()`（开头）、`splice()` |
| 查找元素 | `indexOf()`、`includes()`、`find()`、`findIndex()` |
| 遍历方法 | `forEach()`、`map()`、`filter()`、`reduce()` |
| 排序方法 | `sort()`、`reverse()` |
| 扁平化 | `flat()`、`flatMap()` |
| 解构赋值 | `const [a, b] = arr` |
| 展开运算符 | `[...arr1, ...arr2]` |

---

## 6.13 新手常见误区

### 误区 1：`sort()` 会按数字大小排序

**错！** `sort()` 默认按字符串排序。

```javascript
// ❌ 默认按字符串排序
const numbers = [10, 2, 3, 1]
console.log(numbers.sort()) // [1, 10, 2, 3] ❌

// ✅ 必须提供比较函数
numbers.sort((a, b) => a - b)
console.log(numbers) // [1, 2, 3, 10] ✅
```

### 误区 2：数组赋值就是复制

**错！** 数组是引用类型，赋值复制的是地址。

```javascript
// ❌ 错误：只是复制了地址
const original = [1, 2, 3]
const copy = original

copy.push(4)
console.log(original) // [1, 2, 3, 4] ❗ 原数组被修改了

// ✅ 正确：使用展开运算符复制
const copy2 = [...original]
copy2.push(5)
console.log(original) // [1, 2, 3, 4] ✅ 原数组不变
```

### 误区 3：`forEach` 中可以使用 `return` 跳出

**错！** `forEach` 中的 `return` 只是跳过当前元素，不能跳出循环。

```javascript
// ❌ 错误：return 不能跳出 forEach
const arr = [1, 2, 3, 4, 5]
arr.forEach(num => {
  if (num === 3) return // 只是跳过，不会停止
  console.log(num) // 1, 2, 4, 5
})

// ✅ 正确：使用 for...of 或 for 循环
for (const num of arr) {
  if (num === 3) break
  console.log(num) // 1, 2
}
```

### 误区 4：`splice()` 和 `slice()` 一样

**错！** `splice()` 修改原数组，`slice()` 返回新数组。

```javascript
const arr = [1, 2, 3, 4, 5]

// splice：修改原数组
const removed = arr.splice(1, 2)
console.log(arr)      // [1, 4, 5] ❗ 原数组被修改
console.log(removed)  // [2, 3]

// slice：返回新数组，不修改原数组
const arr2 = [1, 2, 3, 4, 5]
const sliced = arr2.slice(1, 3) // 从索引1开始，到索引3结束（不包含3）
console.log(arr2)     // [1, 2, 3, 4, 5] ✅ 原数组不变
console.log(sliced)   // [2, 3]
```

---

## 6.14 动手练习

### 练习 1：基础练习

写一个函数，计算数组中所有偶数的和。

<details>
<summary>点击查看答案</summary>

```javascript
function sumEvens(arr) {
  // 方法一：使用 filter + reduce
  return arr
    .filter(n => n % 2 === 0)
    .reduce((acc, n) => acc + n, 0)
  
  // 方法二：使用 forEach
  // let sum = 0
  // arr.forEach(n => {
  //   if (n % 2 === 0) sum += n
  // })
  // return sum
}

// 测试
console.log(sumEvens([1, 2, 3, 4, 5, 6])) // 12
console.log(sumEvens([-2, -4, 0]))         // -6
console.log(sumEvens([1, 3, 5]))           // 0
```

</details>

### 练习 2：进阶练习

写一个函数，从数组中去除重复元素。

<details>
<summary>点击查看答案</summary>

```javascript
function unique(arr) {
  // 方法一：使用 Set
  return [...new Set(arr)]
  
  // 方法二：使用 filter
  // return arr.filter((item, index) => arr.indexOf(item) === index)
  
  // 方法三：使用 reduce
  // return arr.reduce((acc, item) => {
  //   if (!acc.includes(item)) {
  //     acc.push(item)
  //   }
  //   return acc
  // }, [])
}

// 测试
console.log(unique([1, 2, 2, 3, 3, 3]))           // [1, 2, 3]
console.log(unique(['a', 'b', 'a', 'c', 'b']))     // ['a', 'b', 'c']
console.log(unique([1, '1', 2, '2']))              // [1, '1', 2, '2']
```

</details>

### 练习 3（挑战）：综合练习

写一个函数，对数组进行分组，按照指定的属性值分组。

<details>
<summary>点击查看答案</summary>

```javascript
function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    // 获取当前元素的分组键
    const groupKey = item[key]
    
    // 如果该组不存在，创建一个新数组
    if (!acc[groupKey]) {
      acc[groupKey] = []
    }
    
    // 将当前元素添加到对应组中
    acc[groupKey].push(item)
    
    return acc
  }, {})
}

// 测试
const users = [
  { name: '张三', age: 25, gender: '男' },
  { name: '李四', age: 30, gender: '女' },
  { name: '王五', age: 28, gender: '男' },
  { name: '赵六', age: 22, gender: '女' }
]

// 按性别分组
const groupedByGender = groupBy(users, 'gender')
console.log(groupedByGender)
// {
//   男: [{ name: '张三', age: 25, gender: '男' }, { name: '王五', age: 28, gender: '男' }],
//   女: [{ name: '李四', age: 30, gender: '女' }, { name: '赵六', age: 22, gender: '女' }]
// }

// 按年龄段分组
const groupedByAge = groupBy(users, (user) => user.age > 25 ? '青年' : '少年')
console.log(groupedByAge)
// {
//   少年: [{ name: '张三', age: 25, gender: '男' }, { name: '赵六', age: 22, gender: '女' }],
//   青年: [{ name: '李四', age: 30, gender: '女' }, { name: '王五', age: 28, gender: '男' }]
// }
```

</details>

---

## 下一章预告

下一章我们会学习 **对象**——JavaScript 中最重要的数据结构。你会学到对象的创建、访问、修改，以及 `this` 的指向、解构赋值、展开运算符等。掌握这些，你就能组织更复杂的数据了！