---
title: "第五章：函数"
description: "函数声明、箭头函数、参数"
---

# 第五章：函数

## 函数声明

```javascript
function greet(name) {
  return `你好，${name}！`
}

console.log(greet('张三')) // '你好，张三！'
```

## 函数表达式

```javascript
const greet = function(name) {
  return `你好，${name}！`
}

console.log(greet('李四')) // '你好，李四！'
```

## 箭头函数

```javascript
// 完整形式
const add = (a, b) => {
  return a + b
}

// 简写（单行返回）
const add2 = (a, b) => a + b

// 单参数（可省略括号）
const double = x => x * 2

// 无参数
const sayHi = () => console.log('你好')
```

## 参数

### 默认参数

```javascript
function greet(name = '访客') {
  return `你好，${name}！`
}

console.log(greet())      // '你好，访客！'
console.log(greet('张三')) // '你好，张三！'
```

### 剩余参数

```javascript
function sum(...numbers) {
  return numbers.reduce((total, num) => total + num, 0)
}

console.log(sum(1, 2, 3))    // 6
console.log(sum(1, 2, 3, 4)) // 10
```

### 解构参数

```javascript
function display({ name, age }) {
  console.log(`${name}，${age}岁`)
}

const person = { name: '张三', age: 25 }
display(person) // '张三，25岁'
```

## 返回值

```javascript
// 单返回值
function square(x) {
  return x * x
}

// 多返回值（对象）
function getMinMax(arr) {
  return {
    min: Math.min(...arr),
    max: Math.max(...arr)
  }
}

const { min, max } = getMinMax([3, 1, 4, 1, 5])
console.log(min, max) // 1, 5
```

## 回调函数

```javascript
function processData(data, callback) {
  const result = data.toUpperCase()
  callback(result)
}

processData('hello', console.log) // 'HELLO'
```

## 立即执行函数（IIFE）

```javascript
;(function() {
  const message = '立即执行'
  console.log(message)
})()

// 箭头函数形式
;(() => {
  console.log('立即执行')
})()
```

## 高阶函数

```javascript
// 返回函数
function multiplier(factor) {
  return (number) => number * factor
}

const double = multiplier(2)
const triple = multiplier(3)

console.log(double(5))  // 10
console.log(triple(5))  // 15
```

## 闭包

```javascript
function counter() {
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
```

## this 关键字

```javascript
// 普通函数
const obj = {
  name: '张三',
  greet: function() {
    console.log(`你好，我是${this.name}`)
  }
}
obj.greet() // '你好，我是张三'

// 箭头函数（没有自己的 this）
const obj2 = {
  name: '李四',
  greet: () => {
    console.log(`你好，我是${this.name}`) // this 指向全局
  }
}
```

## 总结

函数是 JavaScript 的核心。箭头函数语法简洁，但没有自己的 this。闭包和高阶函数是强大的编程工具。
