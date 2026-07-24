---
title: "第一章：变量与数据类型"
description: "let、const、var 与基本数据类型，掌握 JavaScript 的基础语法"
---

# 第一章：变量与数据类型

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是变量？为什么需要变量？
- `let`、`const`、`var` 有什么区别？该用哪个？
- JavaScript 有哪些数据类型？怎么判断？
- 为什么 `typeof null` 会返回 `'object'`？

这一章就是为了解答这些问题。我们会先搞清楚 **变量的本质** 和 **数据类型的分类**，再动手实践。

---

## 1.1 为什么需要变量？

### 痛点分析

想象一下，如果没有变量，你要写一个计算圆面积的程序：

```javascript
// ❌ 没有变量：每次计算都要重复写数字，容易出错
console.log(3.14159 * 5 * 5)  // 计算半径为5的圆面积
console.log(3.14159 * 10 * 10) // 计算半径为10的圆面积
```

如果需要修改圆周率，你得把所有地方的 `3.14159` 都改成新的值，非常麻烦！

### 解决方案

用变量来存储数据，就像给数据起个名字：

```javascript
// ✅ 使用变量：代码更清晰，修改更方便
const PI = 3.14159
const radius1 = 5
const radius2 = 10

console.log(PI * radius1 * radius1)  // 78.53975
console.log(PI * radius2 * radius2)  // 314.159
```

> **一句话总结**：变量就像一个带标签的盒子，把数据放进去，以后用名字就能找到它。

---

## 1.2 核心原理

### 变量声明的本质

变量声明就是在内存中 **划出一块空间**，并给这个空间起个名字。

打个比方：

> 想象你去图书馆借书。`const book = 'JavaScript'` 就像是：
> 1. 找一个书架格子（内存空间）
> 2. 把书放进去（存储数据）
> 3. 在格子上贴个标签写着 "book"（变量名）
> 以后想看书，直接找标签 "book" 就行，不用记格子位置。

### 块级作用域 vs 函数作用域

| 特性 | var（函数作用域） | let/const（块级作用域） |
| --- | --- | --- |
| 作用范围 | 整个函数内 | 大括号 `{}` 内 |
| 变量提升 | 是，会被提到函数顶部 | 是，但处于"暂时性死区" |
| 重复声明 | 可以，不会报错 | 不可以，会报错 |

---

## 1.3 变量声明方式

### let：可重新赋值的变量

```javascript
// 使用 let 声明变量，可以随时改变它的值
let userName = '张三'
console.log(userName) // '张三'

// 重新赋值，把盒子里的内容换掉
userName = '李四'
console.log(userName) // '李四'
```

### const：不可重新赋值的常量

```javascript
// 使用 const 声明常量，一旦赋值就不能改变
const PI = 3.14159
console.log(PI) // 3.14159

// ❌ 错误！const 不能重新赋值
// PI = 3.14
// Uncaught TypeError: Assignment to constant variable
```

> **注意**：const 声明的对象/数组内部可以修改，只是不能重新赋值整个变量。

### var（不推荐使用）

```javascript
// var 是旧版 JavaScript 的声明方式，有很多问题
var age = 25
var age = 30 // ✅ 可以重复声明，不会报错（但这是坑！）

function test() {
  var x = 10
}
console.log(x) // ❌ 报错，x 在函数外部访问不到
```

### 推荐做法

| 场景 | 推荐使用 |
| --- | --- |
| 不需要改变的值（如配置、常量） | `const` |
| 需要改变的值（如计数器、状态） | `let` |
| 任何情况 | **不要用 `var`** |

---

## 1.4 数据类型

### 基本类型（值类型）

基本类型的值直接存储在变量指向的内存位置。

```javascript
// 字符串 - 用于存储文本
const str = 'hello'
const str2 = "world"
// 模板字符串 - 可以嵌入变量，用反引号包裹
const str3 = `hello ${str2}` // 'hello world'

// 数字 - 整数和小数都用数字类型
const num = 42
const float = 3.14
const neg = -10
const zero = 0

// 布尔值 - 只有 true（真）和 false（假）
const isTrue = true
const isFalse = false

// null - 表示"空"，是一个具体的值
const empty = null

// undefined - 表示"未定义"，变量声明了但没赋值
let notDefined
console.log(notDefined) // undefined

// Symbol - 唯一的标识符，不会重复
const sym = Symbol('description')

// BigInt - 用于表示超大整数
const big = 9007199254740991n
```

### 引用类型

引用类型的值存储在内存的某个位置，变量只存储指向这个位置的"地址"。

```javascript
// 对象 - 键值对的集合，像一个小字典
const person = { name: '张三', age: 25 }

// 数组 - 有序的数据列表
const colors = ['红', '绿', '蓝']

// 函数 - 可执行的代码块
const greet = function() { console.log('你好') }
```

---

## 1.5 类型检测

```javascript
// typeof 运算符：检测数据类型
typeof 'hello'    // 'string' ✅
typeof 42         // 'number' ✅
typeof true       // 'boolean' ✅
typeof undefined  // 'undefined' ✅
typeof null       // 'object' ❌ 这是历史遗留的 bug！
typeof {}         // 'object' ✅
typeof []         // 'object' ✅
typeof function(){} // 'function' ✅
```

### 如何正确检测类型

```javascript
// 检测 null（特殊处理）
function isNull(value) {
  return value === null
}

// 检测数组（三种方法）
Array.isArray([])           // true ✅
[].constructor === Array    // true ✅
[].instanceof Array         // true ✅

// 检测对象（排除数组和 null）
function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
```

---

## 1.6 类型转换

### 显式转换（手动转换）

```javascript
// 转字符串
String(123)        // '123'
(123).toString()   // '123'

// 转数字
Number('123')      // 123
parseInt('123px')  // 123（只取整数部分）
parseFloat('3.14em') // 3.14

// 转布尔值
Boolean(0)         // false
Boolean('')        // false
Boolean(null)      // false
Boolean(undefined) // false
Boolean('hello')   // true
Boolean(42)        // true
```

### 隐式转换（自动转换）

```javascript
// 数字和字符串相加，数字会自动转字符串
1 + '2'    // '12' ❗注意不是 3

// 字符串和数字比较，字符串会自动转数字
'10' > 5   // true

// 布尔值在运算中会转数字：true=1，false=0
true + true   // 2
true * false  // 0
```

---

## 1.7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 变量声明 | 使用 `let`（可变）或 `const`（不可变），不要用 `var` |
| 基本类型 | 7种：string、number、boolean、null、undefined、Symbol、BigInt |
| 引用类型 | 对象、数组、函数等 |
| typeof | 检测类型，但 `typeof null` 返回 `'object'` 是 bug |
| 类型转换 | 显式转换用 `String()`/`Number()`/`Boolean()`，隐式转换要小心 |

---

## 1.8 新手常见误区

### 误区 1：`const` 声明的对象/数组完全不能修改

**错！** `const` 只是不能重新赋值整个变量，但对象/数组的内部属性是可以修改的。

```javascript
const person = { name: '张三' }

// ✅ 可以修改对象内部属性
person.name = '李四'
console.log(person.name) // '李四'

// ❌ 不能重新赋值整个变量
// person = { name: '王五' }
// Uncaught TypeError
```

### 误区 2：`typeof null === 'null'`

**错！** 这是 JavaScript 的历史遗留 bug，`typeof null` 返回 `'object'`。

```javascript
// ❌ 错误的判断方式
if (typeof value === 'null') { }

// ✅ 正确的判断方式
if (value === null) { }
```

### 误区 3：空数组 `[]` 和空对象 `{}` 是假值

**错！** 只有 6 个假值：`false`、`0`、`''`、`null`、`undefined`、`NaN`。

```javascript
if ([]) {
  console.log('空数组是真值') // 会执行！
}

if ({}) {
  console.log('空对象是真值') // 会执行！
}
```

### 误区 4：数字和字符串相加会得到数字

**错！** JavaScript 中 `+` 运算符遇到字符串会变成字符串拼接。

```javascript
// ❌ 以为会得到 3
console.log(1 + '2') // '12'

// ✅ 先转数字再相加
console.log(1 + Number('2')) // 3
```

---

## 1.9 动手练习

### 练习 1：基础练习

声明变量存储你的姓名、年龄、城市，然后用模板字符串输出一句自我介绍。

<details>
<summary>点击查看答案</summary>

```javascript
// 声明变量
const name = '张三'
const age = 25
const city = '北京'

// 使用模板字符串输出
const intro = `大家好，我是${name}，今年${age}岁，来自${city}。`
console.log(intro)
// 输出：大家好，我是张三，今年25岁，来自北京。
```

</details>

### 练习 2：进阶练习

写一个函数，接收一个参数，判断它的数据类型并返回描述字符串（如 "这是一个字符串"）。

<details>
<summary>点击查看答案</summary>

```javascript
function getType(value) {
  // 特殊处理 null
  if (value === null) {
    return '这是一个 null'
  }
  
  // 特殊处理数组
  if (Array.isArray(value)) {
    return '这是一个数组'
  }
  
  // 使用 typeof 检测其他类型
  const type = typeof value
  const typeMap = {
    string: '字符串',
    number: '数字',
    boolean: '布尔值',
    undefined: '未定义',
    function: '函数',
    object: '对象'
  }
  
  return `这是一个 ${typeMap[type] || type}`
}

// 测试
console.log(getType('hello'))     // '这是一个 字符串'
console.log(getType(42))          // '这是一个 数字'
console.log(getType(null))        // '这是一个 null'
console.log(getType([1, 2, 3]))   // '这是一个数组'
console.log(getType({}))          // '这是一个 对象'
```

</details>

### 练习 3（挑战）：综合练习

写一个温度转换函数，支持摄氏度和华氏度互转。函数接收两个参数：温度值和单位（'C' 或 'F'），返回转换后的温度和单位。

<details>
<summary>点击查看答案</summary>

```javascript
function convertTemperature(temp, unit) {
  // 摄氏度转华氏度：F = C × 9/5 + 32
  // 华氏度转摄氏度：C = (F - 32) × 5/9
  
  if (unit === 'C') {
    const fahrenheit = temp * 9 / 5 + 32
    return `${fahrenheit.toFixed(1)}F`
  } else if (unit === 'F') {
    const celsius = (temp - 32) * 5 / 9
    return `${celsius.toFixed(1)}C`
  } else {
    return '无效的单位，请使用 "C" 或 "F"'
  }
}

// 测试
console.log(convertTemperature(25, 'C'))   // '77.0F'
console.log(convertTemperature(77, 'F'))   // '25.0C'
console.log(convertTemperature(0, 'C'))    // '32.0F'
console.log(convertTemperature(32, 'F'))   // '0.0C'
console.log(convertTemperature(100, 'C'))  // '212.0F'
```

</details>

---

## 下一章预告

下一章我们会学习 **运算符**——也就是让数据进行计算和比较的工具。你会学到算术运算符、比较运算符、逻辑运算符，以及 JavaScript 特有的空值合并运算符和可选链。掌握这些，你就能写出更复杂的逻辑判断了！