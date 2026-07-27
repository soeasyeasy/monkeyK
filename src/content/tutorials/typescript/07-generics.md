---
title: '第七章：泛型'
description: '泛型是 TypeScript 最强大的特性之一，它允许我们编写可复用的、类型安全的代码。'
---

# 第七章：泛型

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是泛型？为什么需要泛型？
- 泛型函数、泛型接口、泛型类有什么区别？
- 泛型约束是什么？怎么用？
- 泛型和 any 有什么不同？

这一章就是为了解答这些问题。我们会先搞清楚 **泛型的核心概念**，再动手实践。

---

## 1 为什么需要泛型？

### 痛点分析

在没有泛型时，为了支持多种类型，我们要么写重复代码，要么使用 any：

```typescript
// ❌ 重复代码：为每种类型写一个函数
function identityString(value: string): string { return value }
function identityNumber(value: number): number { return value }
function identityBoolean(value: boolean): boolean { return value }

// ❌ 使用 any：失去类型安全
function identityAny(value: any): any { return value }
```

想象一下：你去餐厅吃饭，服务员说"我们只有一种套餐，不管你想吃什么都吃这个"——这就是 any 的问题。

### 解决方案

泛型让一个函数可以处理多种类型，同时保持类型安全：

```typescript
// ✅ 泛型：一个函数处理所有类型
function identity<T>(value: T): T {
  return value
}

identity<string>('hello')  // 返回 string
identity<number>(42)       // 返回 number
identity('auto')           // 自动推导为 string
```

> **一句话总结**：泛型就像一个万能工具箱，里面的工具可以处理各种类型的东西。

---

## 2 核心原理

### 泛型的工作原理

泛型使用**类型参数**（如 `T`）来表示任意类型，在使用时指定具体类型：

```typescript
// T 是类型参数，调用时确定具体类型
function identity<T>(value: T): T {
  return value
}
```

打个比方：

> 泛型就像一个快递柜，`T` 是快递柜的格子。你可以往格子里放任何东西（string、number、object），取出来的时候还是原来的东西。

### 泛型 vs any

| 特性 | 泛型 | any |
| --- | --- | --- |
| 类型安全 | ✅ | ❌ |
| 类型推断 | ✅ | ❌ |
| 代码提示 | ✅ | ❌ |
| 返回值类型 | 与输入相同 | 任意类型 |

---

## 3 泛型详解

### 1. 泛型函数

```typescript
// T 是类型变量，调用时确定具体类型
function identity<T>(value: T): T {
  return value
}

// 显式指定类型
identity<string>('hello') // 返回 string
identity<number>(42)      // 返回 number

// TypeScript 自动推导类型
identity('auto')          // 自动推导为 string

// 多个类型参数
function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b]
}

pair('age', 25)           // 返回 [string, number]
pair(true, { name: 'Alice' })  // 返回 [boolean, { name: string }]
```

### 2. 泛型接口

```typescript
// 泛型接口：data 的类型由 T 决定
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 用户接口
interface User {
  id: number
  name: string
}

// 商品接口
interface Product {
  id: number
  title: string
  price: number
}

// 使用泛型接口
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
// 泛型类：Stack 可以存储任意类型的元素
class Stack<T> {
  private items: T[] = []

  // 入栈
  push(item: T): void {
    this.items.push(item)
  }
  
  // 出栈
  pop(): T | undefined {
    return this.items.pop()
  }
  
  // 查看栈顶
  peek(): T | undefined {
    return this.items[this.items.length - 1]
  }
  
  // 获取大小
  get size(): number {
    return this.items.length
  }
}

// 创建数字栈
const numStack = new Stack<number>()
numStack.push(1)
numStack.push(2)
numStack.peek()  // 2

// 创建字符串栈
const strStack = new Stack<string>()
strStack.push('hello')
strStack.push('world')
strStack.size    // 2
```

### 4. 泛型约束（extends）

```typescript
// 约束 T 必须有 length 属性
interface HasLength {
  length: number
}

// T 必须满足 HasLength 约束
function logLength<T extends HasLength>(value: T): string {
  return `长度: ${value.length}`
}

logLength('hello')     // ✅ 字符串有 length
logLength([1, 2, 3])   // ✅ 数组有 length
// logLength(42)        // ❌ 数字没有 length

// 约束 K 必须是 T 的键名
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

const user = { name: 'Alice', age: 25 }
getProperty(user, 'name')   // ✅ 返回 'Alice'
getProperty(user, 'age')    // ✅ 返回 25
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

// 使用
interface Todo {
  title: string
  description: string
  done: boolean
}

type PartialTodo = MyPartial<Todo>
// { title?: string; description?: string; done?: boolean }

type TodoPreview = MyPick<Todo, 'title' | 'done'>
// { title: string; done: boolean }
```

---

## 4 泛型使用场景

| 场景 | 示例 |
| --- | --- |
| 通用容器 | `Stack<T>`、`Queue<T>` |
| API 响应 | `ApiResponse<T>` |
| 工具函数 | `identity<T>`、`map<T>` |
| 状态管理 | `State<T>`、`Store<T>` |
| UI 组件 | `Select<T>`、`List<T>` |

---

## 5 新手常见误区

### 误区 1："泛型和 any 一样"

**错！** 泛型保持类型安全，any 完全放弃类型检查。

```typescript
// ❌ any：失去类型安全
function processAny(value: any): any {
  return value.toUpperCase()  // 如果 value 不是 string，运行时崩溃
}

// ✅ 泛型：保持类型安全
function processGeneric<T>(value: T): T {
  // value.toUpperCase()  // ❌ 编译错误！T 不一定有 toUpperCase
  return value
}
```

### 误区 2："泛型参数只能是一个字母"

**不对！** 虽然习惯用单个字母（T、U、V），但可以用任何名称。

```typescript
// ✅ 可以用描述性名称
function createUser<UserType>(user: UserType): UserType {
  return user
}

// ✅ 常用约定
// T: Type（类型）
// U, V: 第二个、第三个类型
// K: Key（键）
// V: Value（值）
// E: Element（元素）
```

### 误区 3："泛型只能用于函数"

**错！** 泛型可以用于函数、接口、类、类型别名。

```typescript
// 泛型函数
function identity<T>(value: T): T { return value }

// 泛型接口
interface Container<T> { value: T }

// 泛型类
class Box<T> { constructor(public value: T) {} }

// 泛型类型别名
type Maybe<T> = T | null
```

### 误区 4："泛型约束只能用 interface"

**错！** 泛型约束可以用任何类型，包括 type、class、字面量类型。

```typescript
// 使用 type
type StringOrNumber = string | number
function process<T extends StringOrNumber>(value: T): T {
  return value
}

// 使用 class
class Animal { name: string }
function feed<T extends Animal>(animal: T): void {
  console.log(`Feeding ${animal.name}`)
}

// 使用字面量类型
type Status = 'active' | 'inactive'
function updateStatus<T extends Status>(status: T): void {
  console.log(`Status: ${status}`)
}
```

---

## 6 动手练习

### 练习 1：基础练习

实现一个泛型函数，交换数组中的两个元素。

<details>
<summary>点击查看答案</summary>

```typescript
// 泛型函数：交换数组中的两个元素
function swap<T>(array: T[], index1: number, index2: number): T[] {
  // 创建副本，避免修改原数组
  const newArray = [...array]
  const temp = newArray[index1]
  newArray[index1] = newArray[index2]
  newArray[index2] = temp
  return newArray
}

// 测试数字数组
const numbers = [1, 2, 3, 4, 5]
console.log(swap(numbers, 0, 4))  // [5, 2, 3, 4, 1]

// 测试字符串数组
const fruits = ['apple', 'banana', 'cherry']
console.log(swap(fruits, 1, 2))   // ['apple', 'cherry', 'banana']

// 测试对象数组
const users = [{ id: 1 }, { id: 2 }, { id: 3 }]
console.log(swap(users, 0, 2))    // [{ id: 3 }, { id: 2 }, { id: 1 }]
```

</details>

### 练习 2：进阶练习

实现一个泛型缓存类，支持任意类型的数据缓存。

<details>
<summary>点击查看答案</summary>

```typescript
// 泛型缓存类
class Cache<T> {
  private storage: Map<string, T> = new Map()

  // 设置缓存
  set(key: string, value: T): void {
    this.storage.set(key, value)
  }

  // 获取缓存
  get(key: string): T | undefined {
    return this.storage.get(key)
  }

  // 删除缓存
  delete(key: string): boolean {
    return this.storage.delete(key)
  }

  // 检查缓存是否存在
  has(key: string): boolean {
    return this.storage.has(key)
  }

  // 清空缓存
  clear(): void {
    this.storage.clear()
  }

  // 获取缓存数量
  get size(): number {
    return this.storage.size
  }
}

// 使用字符串缓存
const stringCache = new Cache<string>()
stringCache.set('greeting', 'Hello')
console.log(stringCache.get('greeting'))  // "Hello"

// 使用数字缓存
const numberCache = new Cache<number>()
numberCache.set('count', 42)
console.log(numberCache.get('count'))     // 42

// 使用对象缓存
interface User { id: number; name: string }
const userCache = new Cache<User>()
userCache.set('user1', { id: 1, name: 'Alice' })
console.log(userCache.get('user1'))       // { id: 1, name: 'Alice' }
```

</details>

### 练习 3（挑战）：综合练习

实现一个泛型响应式状态管理类。

<details>
<summary>点击查看答案</summary>

```typescript
// 泛型状态管理类
class Store<T> {
  private state: T
  private listeners: Set<(state: T) => void> = new Set()

  constructor(initialState: T) {
    this.state = initialState
  }

  // 获取状态
  getState(): T {
    return { ...this.state } as T
  }

  // 更新状态
  setState(newState: Partial<T>): void {
    this.state = { ...this.state, ...newState }
    this.notifyListeners()
  }

  // 订阅状态变化
  subscribe(listener: (state: T) => void): () => void {
    this.listeners.add(listener)
    // 返回取消订阅函数
    return () => this.listeners.delete(listener)
  }

  // 通知所有订阅者
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getState()))
  }
}

// 使用
interface AppState {
  count: number
  message: string
  user: { name: string; age: number }
}

const initialState: AppState = {
  count: 0,
  message: 'Hello',
  user: { name: 'Alice', age: 25 }
}

const store = new Store<AppState>(initialState)

// 订阅状态变化
const unsubscribe = store.subscribe((state) => {
  console.log('State changed:', state)
})

// 更新状态
store.setState({ count: 1 })
// State changed: { count: 1, message: 'Hello', user: { name: 'Alice', age: 25 } }

store.setState({ message: 'Hi' })
// State changed: { count: 1, message: 'Hi', user: { name: 'Alice', age: 25 } }

store.setState({ user: { name: 'Bob', age: 30 } })
// State changed: { count: 1, message: 'Hi', user: { name: 'Bob', age: 30 } }

// 取消订阅
unsubscribe()
store.setState({ count: 2 })  // 不会触发订阅
```

</details>

---

## 下一章预告

下一章我们会学习 **枚举**——也就是如何定义命名常量。你会学到数字枚举、字符串枚举、常量枚举、反向映射等核心特性，以及枚举和联合类型的对比。