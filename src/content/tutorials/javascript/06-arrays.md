---
title: "第六章：数组"
description: "数组方法、解构、展开运算符"
---

# 第六章：数组

## 创建数组

```javascript
// 字面量
const arr1 = [1, 2, 3]

// 构造函数
const arr2 = new Array(1, 2, 3)

// Array.from
const arr3 = Array.from('hello') // ['h', 'e', 'l', 'l', 'o']

// Array.of
const arr4 = Array.of(1, 2, 3) // [1, 2, 3]
```

## 访问元素

```javascript
const fruits = ['苹果', '香蕉', '橙子']

console.log(fruits[0])  // '苹果'
console.log(fruits[1])  // '香蕉'
console.log(fruits.at(-1)) // '橙子'（负数索引）
```

## 修改数组

```javascript
const arr = [1, 2, 3]

// 添加
arr.push(4)       // [1, 2, 3, 4] 末尾添加
arr.unshift(0)    // [0, 1, 2, 3, 4] 开头添加

// 删除
arr.pop()         // [0, 1, 2, 3] 删除末尾
arr.shift()       // [1, 2, 3] 删除开头

//  splice
arr.splice(1, 1)  // [1, 3] 从索引1删除1个
arr.splice(1, 0, 2) // [1, 2, 3] 在索引1插入2
```

## 查找元素

```javascript
const numbers = [1, 2, 3, 4, 5]

// indexOf
console.log(numbers.indexOf(3))  // 2

// includes
console.log(numbers.includes(3)) // true

// find
const found = numbers.find(n => n > 3)
console.log(found) // 4

// findIndex
const index = numbers.findIndex(n => n > 3)
console.log(index) // 3
```

## 转换方法

```javascript
const arr = [1, 2, 3]

// join
console.log(arr.join('-'))   // '1-2-3'
console.log(arr.join(', '))  // '1, 2, 3'

// toString
console.log(arr.toString())  // '1,2,3'
```

## 数组方法

### map

```javascript
const numbers = [1, 2, 3]
const doubled = numbers.map(n => n * 2)
console.log(doubled) // [2, 4, 6]
```

### filter

```javascript
const numbers = [1, 2, 3, 4, 5]
const evens = numbers.filter(n => n % 2 === 0)
console.log(evens) // [2, 4]
```

### reduce

```javascript
const numbers = [1, 2, 3, 4]
const sum = numbers.reduce((acc, n) => acc + n, 0)
console.log(sum) // 10
```

### forEach

```javascript
const fruits = ['苹果', '香蕉', '橙子']
fruits.forEach((fruit, index) => {
  console.log(`${index}: ${fruit}`)
})
```

### some 和 every

```javascript
const numbers = [1, 2, 3, 4, 5]

// some：至少一个满足
console.log(numbers.some(n => n > 3))  // true

// every：全部满足
console.log(numbers.every(n => n > 0)) // true
```

### flat 和 flatMap

```javascript
const nested = [1, [2, 3], [4, [5]]]
console.log(nested.flat())    // [1, 2, 3, 4, [5]]
console.log(nested.flat(2))   // [1, 2, 3, 4, 5]

const arr = [1, 2, 3]
const result = arr.flatMap(n => [n, n * 2])
console.log(result) // [1, 2, 2, 4, 3, 6]
```

## 解构赋值

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
```

## 展开运算符

```javascript
const arr1 = [1, 2, 3]
const arr2 = [4, 5, 6]

// 合并数组
const merged = [...arr1, ...arr2]
console.log(merged) // [1, 2, 3, 4, 5, 6]

// 复制数组
const copy = [...arr1]

// 添加元素
const withNew = [...arr1, 4, 5]
```

## 排序

```javascript
const numbers = [3, 1, 4, 1, 5]

// 升序
numbers.sort((a, b) => a - b)
console.log(numbers) // [1, 1, 3, 4, 5]

// 降序
numbers.sort((a, b) => b - a)
console.log(numbers) // [5, 4, 3, 1, 1]

// 反转
numbers.reverse()
console.log(numbers) // [1, 1, 3, 4, 5]
```

## 总结

数组是 JavaScript 中最常用的数据结构。掌握数组方法可以让代码更简洁高效。
