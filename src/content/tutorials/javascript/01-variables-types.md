---
title: "第一章：变量与数据类型"
description: "let、const、var 与基本数据类型"
---

# 第一章：变量与数据类型

## 变量声明

### let

```javascript
let name = '张三'
name = '李四' // 可以重新赋值
```

### const

```javascript
const PI = 3.14159
// PI = 3 // 报错：不能重新赋值
```

### var（不推荐）

```javascript
var age = 25
var age = 30 // 可以重复声明
```

## 对比

| 特性 | var | let | const |
| --- | --- | --- | --- |
| 作用域 | 函数作用域 | 块级作用域 | 块级作用域 |
| 变量提升 | 是 | 否 | 否 |
| 重复声明 | 可以 | 不可以 | 不可以 |
| 重新赋值 | 可以 | 可以 | 不可以 |

## 数据类型

### 基本类型

```javascript
// 字符串
const str = 'hello'
const str2 = "world"
const str3 = `hello ${str2}` // 模板字符串

// 数字
const num = 42
const float = 3.14
const neg = -10

// 布尔值
const isTrue = true
const isFalse = false

// null
const empty = null

// undefined
let notDefined
console.log(notDefined) // undefined

// Symbol
const sym = Symbol('description')

// BigInt
const big = 9007199254740991n
```

### 引用类型

```javascript
// 对象
const person = { name: '张三', age: 25 }

// 数组
const colors = ['红', '绿', '蓝']

// 函数
const greet = function() { console.log('你好') }
```

## 类型检测

```javascript
typeof 'hello'    // 'string'
typeof 42         // 'number'
typeof true       // 'boolean'
typeof undefined  // 'undefined'
typeof null       // 'object' (历史遗留bug)
typeof {}         // 'object'
typeof []         // 'object'
typeof function(){} // 'function'
```

## 类型转换

```javascript
// 转字符串
String(123)       // '123'
(123).toString()  // '123'

// 转数字
Number('123')     // 123
parseInt('123px') // 123
parseFloat('3.14em') // 3.14

// 转布尔值
Boolean(0)        // false
Boolean('')       // false
Boolean(null)     // false
Boolean(undefined) // false
Boolean('hello')  // true
Boolean(42)       // true
```

## 总结

JavaScript 有 7 种基本数据类型和 1 种引用类型。推荐使用 let 和 const 声明变量。
