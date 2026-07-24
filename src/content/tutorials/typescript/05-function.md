---
title: "第五章：函数类型"
description: "TypeScript 为函数提供了完整的类型支持，包括参数类型、返回值、重载、this 类型等。"
---

# 第五章：函数类型

## 运行结果

- **基本函数**
  - `add(3, 5) = 8`
  - `multiply(4, 6) = 24`
  - `divide(10, 3) = 3.33`
- **可选/默认参数**
  - `greet('Alice') = "Hello, Alice!"`
  - `greet('Bob', 'Hi') = "Hi, Bob!"`
  - `createUrl('api') = "https://example.com/api"`
- **剩余参数**
  - `sum(1,2,3,4,5) = 15`
  - `logAll('A','B','C') = "A + B, C"`
- **函数重载**
  - `format('hello') = "String: hello"`
  - `format(42) = "Number: 42.00"`
  - `format(true) = "Boolean: Yes"`
- **this 参数**
  - `user.greet() = "Hi, I'm Alice"`
- **高阶函数**
  - `double(5) = 10`
  - `triple(5) = 15`
  - `createMultiplier(10)(3) = 30`

## 代码详解

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
  return `${greeting ?? 'Hello'}, ${name}!`
}

// 默认参数
function createUrl(
  path: string,
  base: string = 'https://example.com'
): string {
  return `${base}/${path}`
}

greet('Alice')           // "Hello, Alice!"
greet('Bob', 'Hi')       // "Hi, Bob!"
createUrl('api')         // "https://example.com/api"
```

### 3. 剩余参数（...rest）

```typescript
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0)
}

function logAll(first: string, ...rest: string[]): string {
  return `${first} + ${rest.join(', ')}`
}

sum(1, 2, 3, 4, 5)          // 15
logAll('A', 'B', 'C')       // "A + B, C"
```

### 4. 函数重载

```typescript
// 重载签名
function format(value: string): string
function format(value: number): string
function format(value: boolean): string
// 实现签名
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
interface User {
  name: string
  greet(this: User): string  // this 的类型
}

const user: User = {
  name: 'Alice',
  greet(this: User) {
    return `Hi, I'm ${this.name}`
  }
}
```

### 6. 高阶函数（返回函数）

```typescript
function createMultiplier(factor: number): (num: number) => number {
  return (num: number) => num * factor
}

const double = createMultiplier(2)
const triple = createMultiplier(3)

double(5)   // 10
triple(5)   // 15
```
