---
title: "第五章：函数类型"
description: "TypeScript 为函数提供了完整的类型支持，包括参数类型、返回值、重载、this 类型等。"
---

# 第五章：函数类型

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何给函数的参数和返回值添加类型？
- 可选参数和默认参数有什么区别？
- 什么是函数重载？什么时候需要用？
- this 类型有什么用？

这一章就是为了解答这些问题。我们会先搞清楚 **函数的类型系统**，再动手实践。

---

## 1 为什么需要函数类型？

### 痛点分析

在 JavaScript 中，函数的参数和返回值没有类型约束：

```javascript
// JavaScript - 不知道参数是什么类型
function add(a, b) {
  return a + b
}

add(1, 2)        // 3 ✅
add('hello', 'world')  // "helloworld" ⚠️ 可能不是预期结果
add([1, 2], [3])  // "1,23" ❌ 意外的结果
```

想象一下：你去餐厅点餐，服务员不问你要什么就随便上菜——这就是 JavaScript 函数的问题。

### 解决方案

TypeScript 的函数类型确保参数和返回值符合预期：

```typescript
// TypeScript - 明确参数和返回值类型
function add(a: number, b: number): number {
  return a + b
}

add(1, 2)        // ✅
// add('hello', 'world')  // ❌ 编译错误！
```

> **一句话总结**：函数类型就像一份菜单，明确告诉函数"你需要什么食材，会做出什么菜"。

---

## 2 核心原理

### 函数类型标注

```typescript
// 语法：function 函数名(参数: 类型): 返回值类型 { ... }
function greet(name: string): string {
  return `Hello, ${name}!`
}
```

打个比方：

> 函数就像一个工厂，参数是原材料，返回值是产品。函数类型标注就像工厂的说明书，告诉人们需要什么原材料，会生产什么产品。

### 函数类型表达式

```typescript
// 语法：(参数: 类型) => 返回值类型
type GreetFunc = (name: string) => string
const greet: GreetFunc = (name) => `Hello, ${name}!`
```

---

## 3 函数类型详解

### 1. 基本函数类型

```typescript
// 普通函数
function add(a: number, b: number): number {
  return a + b
}

// 箭头函数
const multiply = (a: number, b: number): number => a * b

// 函数类型表达式
type BinaryOp = (a: number, b: number) => number
const divide: BinaryOp = (a, b) => a / b
```

### 2. 可选参数和默认参数

```typescript
// 可选参数（? 标记）
function greet(name: string, greeting?: string): string {
  // 使用 ?? 提供默认值
  return `${greeting ?? 'Hello'}, ${name}!`
}

greet('Alice')           // "Hello, Alice!"
greet('Bob', 'Hi')       // "Hi, Bob!"

// 默认参数
function createUrl(
  path: string,
  base: string = 'https://example.com'
): string {
  return `${base}/${path}`
}

createUrl('api')         // "https://example.com/api"
createUrl('api', 'https://test.com')  // "https://test.com/api"
```

### 3. 剩余参数（...rest）

```typescript
// 剩余参数收集所有额外参数
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0)
}

sum(1, 2, 3, 4, 5)          // 15

// 混合使用普通参数和剩余参数
function logAll(first: string, ...rest: string[]): string {
  return `${first} + ${rest.join(', ')}`
}

logAll('A', 'B', 'C')       // "A + B, C"
```

### 4. 函数重载

```typescript
// 重载签名：告诉 TypeScript 函数支持的调用方式
function format(value: string): string
function format(value: number): string
function format(value: boolean): string

// 实现签名：实际的函数实现
function format(value: string | number | boolean): string {
  if (typeof value === 'string') return `String: ${value}`
  if (typeof value === 'number') return `Number: ${value.toFixed(2)}`
  return `Boolean: ${value ? 'Yes' : 'No'}`
}

format('hello')  // "String: hello"
format(42)       // "Number: 42.00"
format(true)     // "Boolean: Yes"
```

### 5. this 参数类型

```typescript
// 接口中指定 this 的类型
interface User {
  name: string
  greet(this: User): string
}

const user: User = {
  name: 'Alice',
  greet(this: User) {
    return `Hi, I'm ${this.name}`
  }
}

user.greet()  // "Hi, I'm Alice"
```

### 6. 高阶函数（返回函数）

```typescript
// 函数返回另一个函数
function createMultiplier(factor: number): (num: number) => number {
  return (num: number) => num * factor
}

const double = createMultiplier(2)
const triple = createMultiplier(3)

double(5)   // 10
triple(5)   // 15

// 更简洁的写法
const createMultiplier2 = (factor: number) => (num: number) => num * factor
const quadruple = createMultiplier2(4)
quadruple(5)  // 20
```

---

## 4 函数参数类型对比

| 参数类型 | 语法 | 说明 | 示例 |
| --- | --- | --- | --- |
| 必填参数 | `name: string` | 必须提供 | `greet('Alice')` |
| 可选参数 | `name?: string` | 可以省略 | `greet()` |
| 默认参数 | `name: string = 'Guest'` | 省略时使用默认值 | `greet()` |
| 剩余参数 | `...names: string[]` | 收集所有额外参数 | `sum(1, 2, 3)` |

---

## 5 新手常见误区

### 误区 1："可选参数可以放在必填参数前面"

**错！** 可选参数必须放在必填参数后面。

```typescript
// ❌ 错误做法
function greet(greeting?: string, name: string): string {
  return `${greeting}, ${name}!`
}

// ✅ 正确做法
function greet(name: string, greeting?: string): string {
  return `${greeting ?? 'Hello'}, ${name}!`
}
```

### 误区 2："函数重载签名和实现签名必须一致"

**不完全对！** 实现签名的参数类型必须是重载签名的超集。

```typescript
// ✅ 正确做法：实现签名的参数是联合类型
function format(value: string): string
function format(value: number): string
function format(value: string | number): string {
  // 实现
}

// ❌ 错误做法：实现签名的参数类型太窄
function format(value: string): string
function format(value: number): string
// function format(value: string): string {  // ❌ 只能处理 string
// }
```

### 误区 3："返回值类型可以省略"

**不推荐！** 虽然 TypeScript 可以自动推断，但显式标注更清晰。

```typescript
// ❌ 不推荐：依赖自动推断
function add(a: number, b: number) {
  return a + b  // TypeScript 推断返回 number
}

// ✅ 推荐：显式标注返回值类型
function add(a: number, b: number): number {
  return a + b
}
```

### 误区 4："剩余参数只能有一个"

**对！** 剩余参数必须是函数的最后一个参数，且只能有一个。

```typescript
// ❌ 错误做法
function process(first: string, ...middle: string[], last: string) {}

// ✅ 正确做法
function process(first: string, ...rest: string[]) {}
```

---

## 6 动手练习

### 练习 1：基础练习

编写一个函数，计算两个数的加减乘除。

<details>
<summary>点击查看答案</summary>

```typescript
// 计算函数
function calculate(
  a: number,
  b: number,
  operation: 'add' | 'subtract' | 'multiply' | 'divide'
): number {
  switch (operation) {
    case 'add': return a + b
    case 'subtract': return a - b
    case 'multiply': return a * b
    case 'divide': 
      if (b === 0) throw new Error('除数不能为零')
      return a / b
    default:
      throw new Error('未知操作')
  }
}

console.log(calculate(10, 5, 'add'))      // 15
console.log(calculate(10, 5, 'subtract')) // 5
console.log(calculate(10, 5, 'multiply')) // 50
console.log(calculate(10, 5, 'divide'))   // 2
```

</details>

### 练习 2：进阶练习

编写一个高阶函数，实现函数缓存。

<details>
<summary>点击查看答案</summary>

```typescript
// 函数缓存：相同参数直接返回缓存结果
function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>()
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)!
    }
    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

// 测试：计算斐波那契数列
function fibonacci(n: number): number {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

// 使用缓存
const memoizedFib = memoize(fibonacci)

console.log(memoizedFib(10))  // 55（第一次计算）
console.log(memoizedFib(10))  // 55（直接返回缓存）
console.log(memoizedFib(20))  // 6765（第一次计算）
console.log(memoizedFib(20))  // 6765（直接返回缓存）
```

</details>

### 练习 3（挑战）：综合练习

实现一个函数重载，支持不同类型的输入。

<details>
<summary>点击查看答案</summary>

```typescript
// 重载签名
function processInput(input: string): string
function processInput(input: number): string
function processInput(input: boolean): string
function processInput(input: string[]): string
function processInput(input: number[]): string

// 实现签名
function processInput(
  input: string | number | boolean | string[] | number[]
): string {
  if (typeof input === 'string') {
    return `字符串: "${input}" (长度: ${input.length})`
  }
  if (typeof input === 'number') {
    return `数字: ${input} (整数: ${Number.isInteger(input)})`
  }
  if (typeof input === 'boolean') {
    return `布尔值: ${input ? '真' : '假'}`
  }
  if (Array.isArray(input)) {
    if (typeof input[0] === 'string') {
      return `字符串数组: [${input.join(', ')}]`
    }
    return `数字数组: [${input.join(', ')}] (总和: ${input.reduce((a, b) => a + b, 0)})`
  }
  return '未知类型'
}

console.log(processInput('hello'))      // '字符串: "hello" (长度: 5)'
console.log(processInput(42))           // '数字: 42 (整数: true)'
console.log(processInput(true))         // '布尔值: 真'
console.log(processInput(['a', 'b']))   // '字符串数组: [a, b]'
console.log(processInput([1, 2, 3]))    // '数字数组: [1, 2, 3] (总和: 6)'
```

</details>

---

## 下一章预告

下一章我们会学习 **类与面向对象**——也就是如何在 TypeScript 中使用类。你会学到访问修饰符、继承、抽象类、静态成员、接口实现等核心特性。