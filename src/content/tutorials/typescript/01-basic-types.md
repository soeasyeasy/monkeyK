---
title: "第一章：基础类型"
description: "TypeScript 提供了丰富的基础类型系统，帮助我们在编译时捕获错误。"
---

# 第一章：基础类型

## 本章导读

在学这一章之前，你可能会有这些疑问：

- TypeScript 和 JavaScript 的类型有什么区别？
- 为什么需要给变量标注类型？
- `any` 和 `unknown` 到底有什么不同？
- `never` 类型什么时候会用到？

这一章就是为了解答这些问题。我们会先搞清楚 **TypeScript 的基础类型系统**，再动手实践。

---

## 1 为什么需要类型？

### 痛点分析

在纯 JavaScript 中，变量的类型是动态的：

```javascript
// JavaScript - 动态类型，运行时才能发现错误
let username = 'Alice'
username = 25  // 可以随意赋值
console.log(username.toUpperCase())  // ❌ 运行时崩溃！数字没有 toUpperCase 方法
```

想象一下：你在超市买东西，结账时收银员告诉你"这袋牛奶是个数字"，你肯定一脸懵。这就是 JavaScript 的问题——变量可以随意变身，导致错误往往在运行时才暴露。

### 解决方案

TypeScript 在编译时就检查类型：

```typescript
// TypeScript - 静态类型，编译时就能发现错误
let username: string = 'Alice'
// username = 25  // ❌ 编译错误！不能把数字赋给 string 类型
console.log(username.toUpperCase())  // ✅ 编译通过
```

> **一句话总结**：类型就像给变量贴标签，告诉编译器"这个变量只能装什么东西"，从而在代码运行前就发现错误。

---

## 2 核心原理

### 静态类型 vs 动态类型

| 特性 | JavaScript（动态） | TypeScript（静态） |
| --- | --- | --- |
| 类型检查时机 | 运行时 | 编译时 |
| 错误发现 | 程序运行后 | 写代码时 |
| 变量类型 | 随时可变 | 声明后固定 |
| 代码提示 | 基本没有 | 智能补全 |

打个比方：

> JavaScript 就像一个没有安检的车站，任何人都能上车，问题只有开车后才发现。
> TypeScript 就像一个有安检的车站，上车前就检查每个人的车票，确保不会坐错车。

### 类型标注语法

```typescript
// 语法：变量名: 类型 = 值
let name: string = 'TypeScript'  // 字符串类型
let age: number = 25             // 数字类型
let isActive: boolean = true     // 布尔类型
```

---

## 3 基础类型详解

### 1. string 字符串

```typescript
// 普通字符串
const name: string = 'TypeScript'
// 模板字符串（支持插值）
const greeting: string = `Hello, ${name}!`
```

### 2. number 数字

```typescript
// 整数
const age: number = 25
// 小数
const price: number = 99.9
// 十六进制（0x 开头）
const hex: number = 0xff       // 等于 255
// 二进制（0b 开头）
const binary: number = 0b1010  // 等于 10
// 八进制（0o 开头）
const octal: number = 0o744    // 等于 484
```

### 3. boolean 布尔值

```typescript
// 布尔值只有两个值：true 和 false
const isActive: boolean = true
const isComplete: boolean = false
```

### 4. null 和 undefined

```typescript
// null 表示"空值"
const nullValue: null = null
// undefined 表示"未定义"
const undefinedValue: undefined = undefined

// 联合类型表示可选值（可以是 string，也可以是 null）
const maybeName: string | null = 'Hello'
const maybeAge: number | undefined = undefined
```

### 5. void 空值

```typescript
// void 表示函数没有返回值
function logMessage(msg: string): void {
  console.log(msg) // 没有 return 语句
}

// 也可以显式返回 undefined
function doNothing(): void {
  return undefined
}
```

### 6. any 任意类型

```typescript
// any 允许变量接受任意类型的值
let notSure: any = 4
notSure = 'maybe a string'  // ✅ 可以
notSure = false             // ✅ 可以
// ⚠️ 警告：尽量避免使用 any，它绕过了类型检查，失去了 TS 的意义
```

### 7. unknown 未知类型

```typescript
// unknown 也可以接受任意类型，但更安全
let unknownValue: unknown = 'hello'
// unknownValue.toFixed(2)  // ❌ 报错！不能直接使用，必须先收窄类型

// 需要先进行类型检查（类型收窄）
if (typeof unknownValue === 'string') {
  unknownValue.toUpperCase() // ✅ 收窄后可以安全使用
}
```

### 8. never 永不返回

```typescript
// never 表示函数永远不会正常返回
function throwError(msg: string): never {
  throw new Error(msg) // 永远抛出异常，不会执行到 return
}

// never 用于穷尽检查（确保所有情况都被处理）
type Direction = 'up' | 'down' | 'left' | 'right'
function handleDirection(dir: Direction) {
  switch (dir) {
    case 'up': break
    case 'down': break
    case 'left': break
    case 'right': break
    default:
      // 如果遗漏了某个分支，这里会报错
      const _exhaustive: never = dir
  }
}
```

---

## 4 any vs unknown 对比

| 特性 | any | unknown |
| --- | --- | --- |
| 赋值任意类型 | ✅ | ✅ |
| 直接调用方法 | ✅（不安全） | ❌（需先收窄） |
| 类型安全 | ❌ | ✅ |
| 推荐程度 | 不推荐 | 推荐 |
| 使用场景 | 迁移 JS 代码时临时使用 | 需要处理未知类型时 |

---

## 5 新手常见误区

### 误区 1："用 any 最方便，不用管类型"

**错！** 使用 `any` 相当于放弃了 TypeScript 的类型检查。虽然写代码时方便，但运行时可能出问题。

```typescript
// ❌ 错误做法
let data: any = fetchData()
data.toUpperCase()  // 如果 data 不是字符串，运行时会崩溃

// ✅ 正确做法
let data: unknown = fetchData()
if (typeof data === 'string') {
  data.toUpperCase()  // 安全！
}
```

### 误区 2："boolean 可以是 0 或 1"

**不是的！** TypeScript 的 `boolean` 只能是 `true` 或 `false`，不能是数字。

```typescript
// ❌ 错误做法
let isDone: boolean = 0  // 编译错误！

// ✅ 正确做法
let isDone: boolean = false
```

### 误区 3："null 和 undefined 是一样的"

**不完全一样！** `null` 表示"有意为之的空值"，`undefined` 表示"未初始化的值"。

```typescript
// null：主动设置为空
const user: string | null = null  // 明确表示没有用户

// undefined：未定义
const config: { host?: string } = {}  // host 属性不存在，值为 undefined
```

### 误区 4："never 没什么用"

**错！** `never` 非常有用，它可以帮你发现遗漏的分支。

```typescript
type Color = 'red' | 'green' | 'blue'
function getColorName(color: Color): string {
  switch (color) {
    case 'red': return '红色'
    case 'green': return '绿色'
    // ❌ 如果忘了处理 'blue'，default 分支会报错
    default:
      const _: never = color  // 如果 color 可能是 'blue'，这里会编译错误
  }
}
```

---

## 6 动手练习

### 练习 1：基础练习

创建一个变量，分别尝试赋值不同类型的值，观察 TypeScript 的报错。

<details>
<summary>点击查看答案</summary>

```typescript
// 声明一个字符串类型变量
let message: string = 'Hello'

// 尝试赋值其他类型（会报错）
// message = 123        // ❌ 不能赋值数字
// message = true       // ❌ 不能赋值布尔值
// message = null       // ❌ 不能赋值 null

// 正确赋值
message = 'TypeScript'  // ✅
```

</details>

### 练习 2：进阶练习

编写一个函数，接受 `unknown` 类型的参数，根据参数类型返回不同的结果。

<details>
<summary>点击查看答案</summary>

```typescript
function processValue(value: unknown): string {
  if (typeof value === 'string') {
    return `字符串: ${value.toUpperCase()}`
  }
  if (typeof value === 'number') {
    return `数字: ${value.toFixed(2)}`
  }
  if (typeof value === 'boolean') {
    return `布尔值: ${value ? '是' : '否'}`
  }
  return `未知类型: ${typeof value}`
}

console.log(processValue('hello'))   // "字符串: HELLO"
console.log(processValue(3.14))      // "数字: 3.14"
console.log(processValue(true))      // "布尔值: 是"
console.log(processValue(null))      // "未知类型: object"
```

</details>

### 练习 3（挑战）：综合练习

定义一个 `Status` 类型（'pending' | 'active' | 'completed'），编写函数处理所有状态，确保没有遗漏。

<details>
<summary>点击查看答案</summary>

```typescript
type Status = 'pending' | 'active' | 'completed'

function getStatusText(status: Status): string {
  switch (status) {
    case 'pending':
      return '待处理'
    case 'active':
      return '进行中'
    case 'completed':
      return '已完成'
    default:
      // 如果新增了状态，这里会报错，提醒你处理新状态
      const _exhaustive: never = status
      throw new Error(`未知状态: ${status}`)
  }
}

console.log(getStatusText('pending'))    // "待处理"
console.log(getStatusText('active'))     // "进行中"
console.log(getStatusText('completed'))  // "已完成"
```

</details>

---

## 下一章预告

下一章我们会学习 **数组与元组**——也就是如何在 TypeScript 中定义和使用有序集合。你会学到数组类型标注、元组的固定长度特性，以及数组方法的类型安全使用。