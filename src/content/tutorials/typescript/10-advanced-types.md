---
title: '第十章：高级类型'
description: '掌握 keyof、typeof、infer、条件类型、映射类型和模板字面量类型等高级特性。'
---

# 第十章：高级类型

## 本章导读

在学这一章之前，你可能会有这些疑问：

- `keyof` 和 `typeof` 在类型层面怎么用？
- 条件类型是什么？怎么用？
- `infer` 关键字有什么神奇的能力？
- 映射类型和模板字面量类型怎么用？

这一章就是为了解答这些问题。我们会先搞清楚 **高级类型的核心概念**，再动手实践。

---

## 1 为什么需要高级类型？

### 痛点分析

在没有高级类型时，我们需要重复定义相似的类型：

```typescript
// ❌ 重复定义类型
interface User {
  id: number
  name: string
  email: string
}

interface UserPartial {
  id?: number
  name?: string
  email?: string
}

interface UserReadonly {
  readonly id: number
  readonly name: string
  readonly email: string
}
```

想象一下：你需要复印一份文件，每次都要重新排版——这就是没有高级类型的问题。

### 解决方案

高级类型让我们可以基于已有类型生成新类型：

```typescript
// ✅ 使用映射类型
interface User {
  id: number
  name: string
  email: string
}

type UserPartial = { [K in keyof User]?: User[K] }
type UserReadonly = { readonly [K in keyof User]: User[K] }
```

> **一句话总结**：高级类型就像一个复印机，可以基于现有类型快速生成新类型。

---

## 2 核心原理

### 高级类型的工作原理

高级类型在编译时对类型进行**变换和组合**：

```typescript
// keyof：获取对象的键名联合类型
type UserKeys = keyof User  // 'id' | 'name' | 'email'

// typeof：从值获取类型
const obj = { name: 'Alice', age: 25 }
type ObjType = typeof obj  // { name: string; age: number }

// 条件类型：根据条件选择类型
type IsString<T> = T extends string ? 'yes' : 'no'
```

打个比方：

> 高级类型就像一个类型加工厂，输入一个类型，经过各种加工（裁剪、组合、变换），输出一个新类型。

---

## 3 高级类型详解

### 1. keyof 操作符

```typescript
interface User {
  name: string
  age: number
  email: string
}

// 获取对象的所有键名
type UserKeys = keyof User  // 'name' | 'age' | 'email'

// 类型安全地获取对象属性
function getValue<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

const user = { name: 'Alice', age: 25 }
getValue(user, 'name')  // ✅ 返回 'Alice'
getValue(user, 'age')   // ✅ 返回 25
// getValue(user, 'xyz') // ❌ 编译错误
```

### 2. typeof（类型层面）

```typescript
// 从值获取类型
const point = { x: 10, y: 20 }
type PointType = typeof point  // { x: number; y: number }

// 从数组获取类型（使用 as const）
const colors = ['red', 'green', 'blue'] as const
type ColorType = typeof colors  // readonly ['red', 'green', 'blue']

// 从函数获取类型
function getUser() {
  return { id: 1, name: 'Alice' }
}
type UserReturnType = ReturnType<typeof getUser>
// { id: number; name: string }
```

### 3. 条件类型

```typescript
// 基本语法：T extends U ? X : Y
type IsString<T> = T extends string ? 'yes' : 'no'
type A = IsString<string>  // 'yes'
type B = IsString<number>  // 'no'

// 过滤：联合类型中每个成员单独判断
type ExtractStrings<T> = T extends string ? T : never
type Mixed = 'hello' | 42 | 'world' | true
type OnlyStrings = ExtractStrings<Mixed>  // 'hello' | 'world'

// 嵌套条件类型
type CheckType<T> = T extends string
  ? 'string'
  : T extends number
    ? 'number'
    : T extends boolean
      ? 'boolean'
      : 'other'
```

### 4. infer 关键字（类型推断）

```typescript
// 提取函数返回类型
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never

type Fn1 = MyReturnType<() => string>       // string
type Fn2 = MyReturnType<(x: number) => boolean>  // boolean

// 提取数组元素类型
type ElementType<T> = T extends (infer E)[] ? E : never
type E1 = ElementType<string[]>  // string
type E2 = ElementType<number[]>  // number

// 提取 Promise 内部类型
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T
type P1 = UnwrapPromise<Promise<string>>  // string
type P2 = UnwrapPromise<Promise<number>>  // number
```

### 5. 映射类型

```typescript
interface Config {
  host: string
  port: number
  timeout: number
}

// 所有属性变可选
type Optional<T> = { [K in keyof T]?: T[K] }
type OptionalConfig = Optional<Config>

// 所有属性变只读
type Readonly<T> = { readonly [K in keyof T]: T[K] }
type ReadonlyConfig = Readonly<Config>

// 移除 readonly
type Mutable<T> = { -readonly [K in keyof T]: T[K] }

// 移除可选（变必选）
type Required<T> = { [K in keyof T]-?: T[K] }

// 变换属性类型
type Stringify<T> = { [K in keyof T]: string }
type StringifiedConfig = Stringify<Config>
// { host: string; port: string; timeout: string }
```

### 6. 模板字面量类型

```typescript
// 字符串拼接类型
type EventName = 'click' | 'focus' | 'blur'
type EventHandler = `on${Capitalize<EventName>}`
// 'onClick' | 'onFocus' | 'onBlur'

type CSSProperty = 'margin' | 'padding'
type CSSDirection = 'top' | 'right' | 'bottom' | 'left'
type CSSWithDirection = `${CSSProperty}-${CSSDirection}`
// 16 种组合: 'margin-top' | 'margin-right' | ...

// 内置字符串操作类型
Lowercase<'HELLO'>       // 'hello'
Uppercase<'hello'>       // 'HELLO'
Capitalize<'hello'>      // 'Hello'
Uncapitalize<'Hello'>    // 'hello'
```

### 7. 递归类型

```typescript
// 深度只读：递归处理嵌套对象
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K] // 函数不处理
      : DeepReadonly<T[K]> // 递归
    : T[K]
}

interface NestedConfig {
  db: {
    host: string
    credentials: { user: string; password: string }
  }
}

type Frozen = DeepReadonly<NestedConfig>
// 所有层级的属性都变为 readonly

// 深度部分：递归处理嵌套对象
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepPartial<T[K]>
    : T[K]
}
```

---

## 4 高级类型对比

| 类型特性 | 语法 | 作用 | 示例 |
| --- | --- | --- | --- |
| keyof | `keyof T` | 获取对象键名 | `keyof User` |
| typeof | `typeof value` | 从值获取类型 | `typeof obj` |
| 条件类型 | `T extends U ? X : Y` | 根据条件选择类型 | `IsString<T>` |
| infer | `infer R` | 推断类型参数 | `ReturnType<T>` |
| 映射类型 | `{ [K in keyof T]: ... }` | 遍历并变换类型 | `Partial<T>` |
| 模板字面量 | `` `prefix${T}` `` | 字符串类型拼接 | `` `on${Event}` `` |

---

## 5 新手常见误区

### 误区 1："typeof 只能用于值"

**错！** typeof 在类型层面和值层面都可以用。

```typescript
// 值层面：获取运行时类型
const value = 'hello'
typeof value  // "string"（运行时）

// 类型层面：获取编译时类型
type ValueType = typeof value  // string（编译时）
```

### 误区 2："条件类型只支持一层"

**错！** 条件类型可以嵌套，实现复杂的类型逻辑。

```typescript
type CheckType<T> = T extends string
  ? 'string'
  : T extends number
    ? 'number'
    : T extends boolean
      ? 'boolean'
      : 'other'

type A = CheckType<string>  // 'string'
type B = CheckType<number>  // 'number'
type C = CheckType<boolean> // 'boolean'
type D = CheckType<object>  // 'other'
```

### 误区 3："infer 只能用在条件类型中"

**对！** infer 只能在条件类型的 extends 子句中使用。

```typescript
// ✅ 正确做法
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never

// ❌ 错误做法
// type BadInfer<T> = infer R
```

### 误区 4："映射类型只能遍历对象"

**错！** 映射类型可以遍历任何可索引类型。

```typescript
// 遍历数组索引
type ArrayKeys<T extends any[]> = { [K in keyof T]: K }
type Keys = ArrayKeys<[string, number, boolean]>
// { 0: '0'; 1: '1'; 2: '2'; length: 'length'; ... }

// 遍历联合类型
type UpperCaseUnion<T extends string> = { [K in T]: UpperCase<K> }
type Upper = UpperCaseUnion<'a' | 'b'>
// { a: 'A'; b: 'B' }
```

---

## 6 动手练习

### 练习 1：基础练习

实现一个类型，提取对象的所有键名。

<details>
<summary>点击查看答案</summary>

```typescript
interface User {
  id: number
  name: string
  email: string
  age: number
}

// 获取对象所有键名
type Keys<T> = keyof T
type UserKeys = Keys<User>  // 'id' | 'name' | 'email' | 'age'

// 获取对象所有值类型
type Values<T> = T[keyof T]
type UserValues = Values<User>  // string | number

// 获取对象的部分属性类型
type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K]
}

type StringFields = PickByType<User, string>
// { name: string; email: string }

type NumberFields = PickByType<User, number>
// { id: number; age: number }
```

</details>

### 练习 2：进阶练习

实现一个深度可选类型和深度只读类型。

<details>
<summary>点击查看答案</summary>

```typescript
// 深度可选类型
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepPartial<T[K]>
    : T[K]
}

// 深度只读类型
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepReadonly<T[K]>
    : T[K]
}

// 测试接口
interface User {
  id: number
  name: string
  address: {
    city: string
    street: string
    coordinates: {
      lat: number
      lng: number
    }
  }
}

// 使用深度可选
type PartialUser = DeepPartial<User>
const partialUser: PartialUser = {
  name: 'Alice',
  address: {
    city: '北京'
    // street 和 coordinates 可以省略
  }
}

// 使用深度只读
type ReadonlyUser = DeepReadonly<User>
const readonlyUser: ReadonlyUser = {
  id: 1,
  name: 'Bob',
  address: {
    city: '上海',
    street: '南京路',
    coordinates: {
      lat: 31.23,
      lng: 121.47
    }
  }
}

// readonlyUser.address.city = '广州'  // ❌ 编译错误！
```

</details>

### 练习 3（挑战）：综合练习

实现一个类型安全的状态更新函数。

<details>
<summary>点击查看答案</summary>

```typescript
// 状态接口
interface AppState {
  user: {
    id: number
    name: string
    email: string
  }
  settings: {
    theme: 'light' | 'dark'
    notifications: boolean
    language: string
  }
  data: {
    items: string[]
    loading: boolean
  }
}

// 路径类型：支持嵌套路径
type Path<T> = T extends object
  ? { [K in keyof T]: K extends string
    ? `${K}` | `${K}.${Path<T[K]>}`
    : never
  }[keyof T]
  : never

// 获取路径对应的类型
type PathValue<T, P extends Path<T>> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends Path<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never

// 更新状态函数
function updateState<T>(
  state: T,
  path: Path<T>,
  value: PathValue<T, typeof path>
): T {
  const keys = path.split('.') as (keyof T)[]
  
  // 创建状态副本
  const newState = { ...state }
  let current = newState as any
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    current[key] = { ...current[key] }
    current = current[key]
  }
  
  current[keys[keys.length - 1]] = value
  return newState
}

// 初始状态
const state: AppState = {
  user: { id: 1, name: 'Alice', email: 'alice@test.com' },
  settings: { theme: 'light', notifications: true, language: 'zh-CN' },
  data: { items: [], loading: false }
}

// 更新状态
const newState = updateState(state, 'user.name', 'Bob')
console.log(newState.user.name)  // 'Bob'

const newState2 = updateState(state, 'settings.theme', 'dark')
console.log(newState2.settings.theme)  // 'dark'

const newState3 = updateState(state, 'data.items', ['item1', 'item2'])
console.log(newState3.data.items)  // ['item1', 'item2']
```

</details>

---

## 下一章预告

下一章我们会学习 **工具类型实战**——也就是如何使用 TypeScript 内置的工具类型。你会学到 Partial、Required、Pick、Omit、Record、ReturnType 等常用工具类型的用法和实际应用场景。