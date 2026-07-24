---
title: '第七章：泛型'
description: '泛型是 TypeScript 最强大的特性之一，它允许我们编写可复用的、类型安全的代码。'
---

# 第七章：泛型

## 运行结果

- **泛型函数**
  - `identity<string>('hello') = "hello"`
  - `identity<number>(42) = 42`
  - `firstElement([1,2,3]) = 1`
  - `pair('age', 25) = ["age",25]`
- **泛型接口**
  - `userResponse.data.name = "Alice"`
  - `productResponse.data.title = "TypeScript 实战"`
- **泛型类 (Stack)**
  - `numStack: [1, 2, 3], size=3`
  - `strStack: [hello, world], size=2`
  - `numStack.peek() = 3`
- **泛型约束**
  - `logLength('hello') = "长度: 5"`
  - `logLength([1,2,3]) = "长度: 3"`
  - `getProperty(user, 'name') = "Alice"`

## 代码详解

### 1. 泛型函数

```typescript
// T 是类型变量，调用时确定具体类型
function identity<T>(value: T): T {
  return value
}

identity<string>('hello') // 类型: string
identity<number>(42) // 类型: number
identity('auto') // 自动推导: string

// 多个类型参数
function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b]
}

pair('age', 25) // [string, number]
```

### 2. 泛型接口

```typescript
interface ApiResponse<T> {
  code: number
  message: string
  data: T // data 的类型由 T 决定
}

interface User {
  id: number
  name: string
}
interface Product {
  id: number
  title: string
  price: number
}

const userResp: ApiResponse<User> = {
  code: 200,
  message: 'ok',
  data: { id: 1, name: 'Alice' },
}

const prodResp: ApiResponse<Product> = {
  code: 200,
  message: 'ok',
  data: { id: 1, title: 'TS Book', price: 99 },
}
```

### 3. 泛型类

```typescript
class Stack<T> {
  private items: T[] = []

  push(item: T): void {
    this.items.push(item)
  }
  pop(): T | undefined {
    return this.items.pop()
  }
  peek(): T | undefined {
    return this.items[this.items.length - 1]
  }
  get size(): number {
    return this.items.length
  }
}

const numStack = new Stack<number>()
numStack.push(1)
numStack.push(2)
numStack.peek() // 2

const strStack = new Stack<string>()
strStack.push('hello')
```

### 4. 泛型约束（extends）

```typescript
// 约束 T 必须有 length 属性
interface HasLength {
  length: number
}

function logLength<T extends HasLength>(value: T): string {
  return `长度: ${value.length}`
}

logLength('hello') // ✅ 字符串有 length
logLength([1, 2, 3]) // ✅ 数组有 length
// logLength(42)       // ❌ 数字没有 length

// 约束 K 必须是 T 的键名
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

const user = { name: 'Alice', age: 25 }
getProperty(user, 'name') // ✅ 'Alice'
// getProperty(user, 'xyz') // ❌ 'xyz' 不是 user 的键
```

### 5. 自定义工具类型（映射类型）

```typescript
// 实现 Partial：将所有属性变为可选
type MyPartial<T> = {
  [K in keyof T]?: T[K]
}

// 实现 Required：将所有属性变为必选
type MyRequired<T> = {
  [K in keyof T]-?: T[K]
}

// 实现 Pick：选取部分属性
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P]
}

// 实现 Readonly：将所有属性变为只读
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K]
}

interface Todo {
  title: string
  description: string
  done: boolean
}
type PartialTodo = MyPartial<Todo> // { title?: string; ... }
type TodoPreview = MyPick<Todo, 'title' | 'done'> // { title: string; done: boolean }
```
