---
title: '第四章：类型别名与联合类型'
description: 'type 关键字可以创建类型别名，联合类型和交叉类型让类型组合更加灵活。'
---

# 第四章：类型别名与联合类型

## 本章导读

在学这一章之前，你可能会有这些疑问：

- `type` 和 `interface` 有什么区别？
- 什么是联合类型？什么时候用？
- 交叉类型和联合类型有什么不同？
- 类型守卫是什么？怎么用？

这一章就是为了解答这些问题。我们会先搞清楚 **类型别名和类型组合**，再动手实践。

---

## 4.1 为什么需要类型别名？

### 痛点分析

在没有类型别名时，复杂类型需要重复书写：

```typescript
// ❌ 重复书写复杂类型
function processUser(user: { name: string; age: number; email: string }) {}
function updateUser(user: { name: string; age: number; email: string }) {}
function deleteUser(user: { name: string; age: number; email: string }) {}
```

想象一下：你每次写地址都要把"北京市朝阳区某某街道"完整写一遍，非常麻烦。如果给这个地址起个名字，以后只用写名字就好了。

### 解决方案

类型别名给复杂类型起了一个名字：

```typescript
// ✅ 使用类型别名
type User = { name: string; age: number; email: string }

function processUser(user: User) {}
function updateUser(user: User) {}
function deleteUser(user: User) {}
```

> **一句话总结**：类型别名就像给复杂类型起了一个绰号，以后只用叫绰号就行。

---

## 4.2 核心原理

### 类型别名 vs 接口

| 特性 | type | interface |
| --- | --- | --- |
| 扩展方式 | &（交叉类型） | extends |
| 同名合并 | ❌ 报错 | ✅ 自动合并 |
| 联合类型 | ✅ | ❌ |
| 字面量类型 | ✅ | ❌ |
| 映射类型 | ✅ | ❌ |

打个比方：

> `type` 就像给一个概念起别名，比如把"中华人民共和国"简称为"中国"。
> `interface` 就像定义一份合同，所有签约方都必须遵守。

### 联合类型 vs 交叉类型

| 特性 | 联合类型（\|） | 交叉类型（&） |
| --- | --- | --- |
| 含义 | "或"的关系 | "与"的关系 |
| 示例 | `string \| number` | `A & B` |
| 取值 | 可以是其中一种 | 必须同时满足所有 |
| 类比 | 茶或咖啡 | 既会开车又会游泳 |

---

## 4.3 类型别名详解

### 1. 基本类型别名

```typescript
// 为基本类型起别名
type Username = string
type Age = number
type Callback = (data: string) => void

// 为联合类型起别名
type ID = number | string
type Status = 'active' | 'inactive' | 'pending'

// 使用别名
const userId1: ID = 123
const userId2: ID = 'user-abc'
```

### 2. 对象类型别名

```typescript
// 对象类型别名
type Point = {
  x: number
  y: number
}

type User = {
  id: number
  name: string
  email: string
}

const point: Point = { x: 10, y: 20 }
const user: User = { id: 1, name: 'Alice', email: 'alice@test.com' }
```

---

## 4.4 联合类型详解

### 基本联合类型

```typescript
// 值可以是 string 或 number
type StringOrNumber = string | number
const value1: StringOrNumber = 'hello'
const value2: StringOrNumber = 42

// 值只能是这三个字符串之一（字面量联合类型）
type Status = 'active' | 'inactive' | 'pending'
const status: Status = 'active'
```

### 类型守卫（typeof）

```typescript
// 函数接受 string 或 number，需要根据类型处理
function padLeft(value: string, padding: string | number): string {
  // typeof 检查，TypeScript 会自动收窄类型
  if (typeof padding === 'number') {
    return ' '.repeat(padding) + value  // padding 是 number
  }
  return padding + value  // padding 是 string
}

padLeft('hello', 4)   // "    hello"
padLeft('hello', '>>') // ">>hello"
```

### 类型守卫（in）

```typescript
// 两个不同的接口
interface Fish {
  swim(): string
}
interface Bird {
  fly(): string
}

// 使用 in 检查属性是否存在
function move(animal: Fish | Bird): string {
  if ('swim' in animal) {
    return animal.swim()  // TS 知道这是 Fish
  }
  return animal.fly()  // TS 知道这是 Bird
}

const fish: Fish = { swim: () => '🐟 游泳中...' }
const bird: Bird = { fly: () => '🐦 飞翔中...' }

move(fish)  // "🐟 游泳中..."
move(bird)  // "🐦 飞翔中..."
```

### 可辨识联合（最强大的模式）

```typescript
// 每种形状都有一个 kind 属性，用于区分
interface Circle {
  kind: 'circle'
  radius: number
}
interface Rectangle {
  kind: 'rectangle'
  width: number
  height: number
}
interface Triangle {
  kind: 'triangle'
  base: number
  height: number
}

// 联合类型
type Shape = Circle | Rectangle | Triangle

// 根据 kind 自动收窄类型
function getArea(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2  // TS 知道是 Circle
    case 'rectangle':
      return shape.width * shape.height   // TS 知道是 Rectangle
    case 'triangle':
      return (shape.base * shape.height) / 2  // TS 知道是 Triangle
  }
}
```

---

## 4.5 交叉类型详解

### 基本交叉类型

```typescript
// 两个接口
interface HasName {
  name: string
}
interface HasAge {
  age: number
}

// 交叉类型：同时拥有 name 和 age
type Person = HasName & HasAge

const person: Person = { name: 'Alice', age: 25 }
```

### 多个类型交叉

```typescript
interface HasEmail {
  email: string
}
interface HasAddress {
  address: string
}

// 三个类型交叉
type Contact = HasName & HasAge & HasEmail & HasAddress

const contact: Contact = {
  name: 'Bob',
  age: 30,
  email: 'bob@test.com',
  address: '北京市朝阳区'
}
```

---

## 4.6 字面量类型

### 字符串字面量类型

```typescript
// 值只能是这四个方向之一
type Direction = 'up' | 'down' | 'left' | 'right'
const dir: Direction = 'up'

// 值只能是这六个数字之一
type DiceValue = 1 | 2 | 3 | 4 | 5 | 6
const dice: DiceValue = 3

// 值只能是这三个对齐方式之一
type Align = 'left' | 'center' | 'right'
const align: Align = 'center'
```

---

## 4.7 类型组合对比

| 类型 | 语法 | 含义 | 示例 |
| --- | --- | --- | --- |
| 联合类型 | `A \| B` | 或 | `string \| number` |
| 交叉类型 | `A & B` | 与 | `HasName & HasAge` |
| 类型别名 | `type X = ...` | 别名 | `type ID = number \| string` |
| 字面量类型 | `'value'` | 具体值 | `'active' \| 'inactive'` |

---

## 4.8 新手常见误区

### 误区 1："联合类型可以访问所有类型的方法"

**错！** 联合类型只能访问所有类型共有的方法。

```typescript
function processValue(value: string | number): void {
  // value.toUpperCase()  // ❌ 报错！number 没有 toUpperCase
  // value.toFixed(2)     // ❌ 报错！string 没有 toFixed
  
  // ✅ 只能访问共有方法
  console.log(value.toString())  // ✅ 两个类型都有 toString
}
```

### 误区 2："交叉类型是合并两个类型的属性"

**不完全对！** 如果两个类型有相同属性但类型不同，会变成 `never`。

```typescript
interface A { id: string }
interface B { id: number }

type C = A & B
// C 的 id 属性是 string & number = never

// ❌ 无法创建实例
// const c: C = { id: 123 }  // 报错！
```

### 误区 3："类型别名只能用一次"

**错！** 类型别名可以多次使用，就像变量一样。

```typescript
type ID = number | string

const userId: ID = 123
const productId: ID = 'prod-abc'
const orderId: ID = 456
```

### 误区 4："字面量类型没什么用"

**错！** 字面量类型非常有用，可以限制取值范围。

```typescript
// ❌ 不好的做法：使用 string，无法限制取值
type HttpMethod = string
const method: HttpMethod = 'GET'  // 可以，但也能赋值 'INVALID'

// ✅ 好的做法：使用字面量类型
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
const method: HttpMethod = 'GET'  // 只能是这四个值之一
```

---

## 4.9 动手练习

### 练习 1：基础练习

定义一个联合类型表示不同的消息类型。

<details>
<summary>点击查看答案</summary>

```typescript
// 定义消息类型
type MessageType = 'success' | 'error' | 'warning' | 'info'

// 消息接口
interface Message {
  type: MessageType
  content: string
  timestamp: Date
}

// 创建消息
const successMsg: Message = {
  type: 'success',
  content: '操作成功！',
  timestamp: new Date()
}

const errorMsg: Message = {
  type: 'error',
  content: '操作失败！',
  timestamp: new Date()
}

function getMessageStyle(msg: Message): string {
  switch (msg.type) {
    case 'success': return 'green'
    case 'error': return 'red'
    case 'warning': return 'yellow'
    case 'info': return 'blue'
  }
}

console.log(getMessageStyle(successMsg))  // "green"
```

</details>

### 练习 2：进阶练习

编写一个函数，处理不同类型的输入，使用类型守卫。

<details>
<summary>点击查看答案</summary>

```typescript
// 处理不同类型的输入
function formatInput(input: string | number | boolean): string {
  if (typeof input === 'string') {
    return `字符串: "${input}"`
  }
  if (typeof input === 'number') {
    return `数字: ${input.toFixed(2)}`
  }
  return `布尔值: ${input ? '是' : '否'}`
}

console.log(formatInput('hello'))   // '字符串: "hello"'
console.log(formatInput(3.14159))   // '数字: 3.14'
console.log(formatInput(true))      // '布尔值: 是'

// 对象类型的类型守卫
interface Car {
  drive(): string
}
interface Bike {
  ride(): string
}

function travel(vehicle: Car | Bike): string {
  if ('drive' in vehicle) {
    return vehicle.drive()
  }
  return vehicle.ride()
}

const car: Car = { drive: () => '🚗 开车中...' }
const bike: Bike = { ride: () => '🚲 骑车中...' }

console.log(travel(car))   // '🚗 开车中...'
console.log(travel(bike))  // '🚲 骑车中...'
```

</details>

### 练习 3（挑战）：综合练习

实现一个计算器，支持不同的运算类型。

<details>
<summary>点击查看答案</summary>

```typescript
// 运算类型
type Operation = 'add' | 'subtract' | 'multiply' | 'divide'

// 运算接口（可辨识联合）
interface AddOperation {
  kind: 'add'
  a: number
  b: number
}
interface SubtractOperation {
  kind: 'subtract'
  a: number
  b: number
}
interface MultiplyOperation {
  kind: 'multiply'
  a: number
  b: number
}
interface DivideOperation {
  kind: 'divide'
  a: number
  b: number
}

type Calculation = AddOperation | SubtractOperation | MultiplyOperation | DivideOperation

// 计算函数
function calculate(op: Calculation): number {
  switch (op.kind) {
    case 'add':
      return op.a + op.b
    case 'subtract':
      return op.a - op.b
    case 'multiply':
      return op.a * op.b
    case 'divide':
      if (op.b === 0) {
        throw new Error('除数不能为零')
      }
      return op.a / op.b
  }
}

// 测试
const add: AddOperation = { kind: 'add', a: 10, b: 5 }
const subtract: SubtractOperation = { kind: 'subtract', a: 10, b: 5 }
const multiply: MultiplyOperation = { kind: 'multiply', a: 10, b: 5 }
const divide: DivideOperation = { kind: 'divide', a: 10, b: 5 }

console.log(calculate(add))      // 15
console.log(calculate(subtract)) // 5
console.log(calculate(multiply)) // 50
console.log(calculate(divide))   // 2
```

</details>

---

## 下一章预告

下一章我们会学习 **函数类型**——也就是如何给函数添加类型标注。你会学到参数类型、返回值类型、可选参数、剩余参数、函数重载等核心特性。