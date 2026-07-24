---
title: '第十章：高级类型'
description: '掌握 keyof、typeof、infer、条件类型、映射类型和模板字面量类型等高级特性。'
---

# 第十章：高级类型

## 运行结果

- **keyof**
  - `getValue(user, 'name') = "Alice"`
  - `getValue(user, 'age') = 25`
- **typeof（类型层面）**
  - `typeof point2 => { x: number, y: number }`
  - `typeof colors => readonly ['red', 'green', 'blue']`
- **条件类型**
  - `IsString<string> = 'yes'`
  - `IsString<number> = 'no'`
  - `ExtractStrings<'hello' | 42 | 'world'> = 'hello' | 'world'`
- **infer 推断**
  - `MyReturnType<() => string> = string`
  - `ElementType<string[]> = string`
  - `UnwrapPromise<Promise<string>> = string`
- **模板字面量类型**
  - `EventHandler = 'onClick' | 'onFocus' | 'onBlur'`
  - `CSSWithDirection 包含 16 种组合`
  - `Lowercase<'HELLO'> = 'hello'`
  - `Capitalize<'hello'> = 'Hello'`

## 代码详解

### 1. keyof 操作符

```typescript
interface User {
  name: string
  age: number
  email: string
}

type UserKeys = keyof User // 'name' | 'age' | 'email'

// 类型安全地获取对象属性
function getValue<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

getValue(user, 'name') // 返回 string
getValue(user, 'age') // 返回 number
// getValue(user, 'xyz') // ❌ 编译错误
```

### 2. typeof（类型层面）

```typescript
const point = { x: 10, y: 20 }
type PointType = typeof point // { x: number; y: number }

const colors = ['red', 'green', 'blue'] as const
type ColorType = typeof colors // readonly ['red', 'green', 'blue']

// 从已有值反推类型，常用于复杂对象
```

### 3. 条件类型

```typescript
// 基本语法：T extends U ? X : Y
type IsString<T> = T extends string ? 'yes' : 'no'
type A = IsString<string> // 'yes'
type B = IsString<number> // 'no'

// 过滤：联合类型中每个成员单独判断
type ExtractStrings<T> = T extends string ? T : never
type Mixed = 'hello' | 42 | 'world' | true
type OnlyStrings = ExtractStrings<Mixed> // 'hello' | 'world'
```

### 4. infer 关键字（类型推断）

```typescript
// 提取函数返回类型
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never

type Fn1 = MyReturnType<() => string> // string
type Fn2 = MyReturnType<(x: number) => boolean> // boolean

// 提取数组元素类型
type ElementType<T> = T extends (infer E)[] ? E : never
type E1 = ElementType<string[]> // string

// 提取 Promise 内部类型
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T
type P1 = UnwrapPromise<Promise<string>> // string
```

### 5. 映射类型

```typescript
// 所有属性变可选
type Optional<T> = { [K in keyof T]?: T[K] }

// 所有属性变只读
type Readonly<T> = { readonly [K in keyof T]: T[K] }

// 移除 readonly
type Mutable<T> = { -readonly [K in keyof T]: T[K] }

// 移除可选（变必选）
type Required<T> = { [K in keyof T]-?: T[K] }

interface Config {
  host: string
  port: number
  timeout: number
}
type OptionalConfig = Optional<Config> // { host?: string; ... }
type ReadonlyConfig = Readonly<Config> // { readonly host: string; ... }
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
Lowercase<'HELLO'> // 'hello'
Uppercase<'hello'> // 'HELLO'
Capitalize<'hello'> // 'Hello'
Uncapitalize<'Hello'> // 'hello'
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
```
