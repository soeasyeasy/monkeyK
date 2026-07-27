---
title: '第十一章：工具类型实战'
description: '掌握 TypeScript 内置工具类型，包括 Partial、Required、Pick、Omit、Record、ReturnType 等。'
---

# 第十一章：工具类型实战

## 本章导读

在学这一章之前，你可能会有这些疑问：

- TypeScript 有哪些内置工具类型？
- `Partial` 和 `Required` 有什么区别？
- `Pick` 和 `Omit` 什么时候用？
- `Record` 和 `Map` 有什么不同？
- 如何自定义工具类型？

这一章就是为了解答这些问题。我们会先搞清楚 **工具类型的核心概念**，再动手实践。

---

## 1 为什么需要工具类型？

### 痛点分析

在没有工具类型时，我们需要手动实现很多常用的类型变换：

```typescript
// ❌ 手动实现可选类型
interface User {
  id: number
  name: string
  email: string
}

interface PartialUser {
  id?: number
  name?: string
  email?: string
}

// ❌ 手动实现只读类型
interface ReadonlyUser {
  readonly id: number
  readonly name: string
  readonly email: string
}
```

想象一下：每次需要复印一份文件，都要重新排版——这就是没有工具类型的问题。

### 解决方案

TypeScript 内置了大量工具类型，可以直接使用：

```typescript
// ✅ 使用内置工具类型
interface User {
  id: number
  name: string
  email: string
}

type PartialUser = Partial<User>
type ReadonlyUser = Readonly<User>
```

> **一句话总结**：工具类型就像一个工具箱，里面有各种现成的工具，直接拿起来用就行。

---

## 2 核心原理

### 工具类型的工作原理

工具类型本质上是**基于高级类型实现的泛型类型别名**：

```typescript
// Partial 的实现原理
type Partial<T> = {
  [K in keyof T]?: T[K]
}

// Required 的实现原理
type Required<T> = {
  [K in keyof T]-?: T[K]
}

// Pick 的实现原理
type Pick<T, K extends keyof T> = {
  [P in K]: T[P]
}
```

打个比方：

> 工具类型就像厨房里的厨具——刀、锅、碗、瓢，每种都有特定用途，直接用就行，不用自己造。

---

## 3 常用工具类型详解

### 1. Partial<T>

将所有属性变为可选：

```typescript
interface User {
  id: number
  name: string
  email: string
}

type PartialUser = Partial<User>
// { id?: number; name?: string; email?: string }

// 场景：更新用户信息时，允许只传部分字段
function updateUser(user: User, updates: PartialUser): User {
  return { ...user, ...updates }
}

const user = { id: 1, name: 'Alice', email: 'alice@test.com' }
updateUser(user, { name: 'Bob' })  // ✅ 只更新名字
```

### 2. Required<T>

将所有属性变为必选：

```typescript
interface PartialConfig {
  host?: string
  port?: number
  timeout?: number
}

type RequiredConfig = Required<PartialConfig>
// { host: string; port: number; timeout: number }

// 场景：确保配置完整性
function createServer(config: RequiredConfig) {
  console.log(`Server started at ${config.host}:${config.port}`)
}
```

### 3. Readonly<T>

将所有属性变为只读：

```typescript
interface Config {
  apiKey: string
  timeout: number
}

type ImmutableConfig = Readonly<Config>
// { readonly apiKey: string; readonly timeout: number }

const config: ImmutableConfig = { apiKey: 'secret', timeout: 5000 }
// config.apiKey = 'new'  // ❌ 编译错误！
```

### 4. Pick<T, K>

从类型中选取指定属性：

```typescript
interface User {
  id: number
  name: string
  email: string
  password: string
}

// 只选取 id 和 name
type UserSummary = Pick<User, 'id' | 'name'>
// { id: number; name: string }

// 场景：返回用户摘要（不包含敏感信息）
function getUserSummary(user: User): UserSummary {
  return { id: user.id, name: user.name }
}
```

### 5. Omit<T, K>

从类型中排除指定属性：

```typescript
interface User {
  id: number
  name: string
  email: string
  password: string
}

// 排除 password
type SafeUser = Omit<User, 'password'>
// { id: number; name: string; email: string }

// 场景：返回安全的用户数据（不包含密码）
function getSafeUser(user: User): SafeUser {
  const { password, ...rest } = user
  return rest
}
```

### 6. Record<K, T>

创建一个对象类型，键为 K，值为 T：

```typescript
// 创建一个字典
type StringDictionary = Record<string, string>
const dict: StringDictionary = {
  'en': 'Hello',
  'zh': '你好',
  'ja': 'こんにちは'
}

// 创建一个用户映射
interface User {
  id: number
  name: string
}

type UserMap = Record<number, User>
const users: UserMap = {
  1: { id: 1, name: 'Alice' },
  2: { id: 2, name: 'Bob' }
}

// Record vs Map
// Record：编译时类型检查，适合固定键名
// Map：运行时动态键，适合不确定键名的场景
```

### 7. ReturnType<T>

获取函数的返回类型：

```typescript
function getUser() {
  return { id: 1, name: 'Alice', email: 'alice@test.com' }
}

type User = ReturnType<typeof getUser>
// { id: number; name: string; email: string }

// 场景：从 API 响应中提取类型
async function fetchUsers() {
  const response = await fetch('/api/users')
  return response.json() as { users: User[]; total: number }
}

type FetchUsersResult = ReturnType<typeof fetchUsers>
// Promise<{ users: User[]; total: number }>
```

### 8. Parameters<T>

获取函数的参数类型：

```typescript
function greet(name: string, age: number): string {
  return `Hello ${name}, you are ${age} years old`
}

type GreetParams = Parameters<typeof greet>
// [string, number]

// 使用元组解构
const params: GreetParams = ['Alice', 25]
greet(...params)  // ✅

// 获取单个参数类型
type FirstParam = GreetParams[0]  // string
type SecondParam = GreetParams[1]  // number
```

### 9. ConstructorParameters<T>

获取类构造函数的参数类型：

```typescript
class User {
  constructor(public id: number, public name: string) {}
}

type UserConstructorParams = ConstructorParameters<typeof User>
// [number, string]

// 使用元组创建实例
const params: UserConstructorParams = [1, 'Alice']
const user = new User(...params)  // ✅
```

### 10. InstanceType<T>

获取类的实例类型：

```typescript
class User {
  id: number
  name: string
  constructor(id: number, name: string) {
    this.id = id
    this.name = name
  }
}

type UserInstance = InstanceType<typeof User>
// User

const user: UserInstance = new User(1, 'Alice')  // ✅
```

### 11. Exclude<T, U>

从联合类型中排除指定类型：

```typescript
type AllTypes = string | number | boolean | null | undefined

// 排除 null 和 undefined
type NonNullableTypes = Exclude<AllTypes, null | undefined>
// string | number | boolean

// 排除数字类型
type NonNumberTypes = Exclude<AllTypes, number>
// string | boolean | null | undefined
```

### 12. Extract<T, U>

从联合类型中提取指定类型：

```typescript
type AllTypes = string | number | boolean | null | undefined

// 提取字符串和数字
type PrimitiveTypes = Extract<AllTypes, string | number>
// string | number

// 提取 null 和 undefined
type NullishTypes = Extract<AllTypes, null | undefined>
// null | undefined
```

### 13. NonNullable<T>

从类型中排除 null 和 undefined：

```typescript
type MaybeString = string | null | undefined

type DefinitelyString = NonNullable<MaybeString>
// string

// 场景：确保值不为空
function processString(value: MaybeString): DefinitelyString {
  if (value === null || value === undefined) {
    throw new Error('Value cannot be null or undefined')
  }
  return value
}
```

### 14. Awaited<T>

获取 Promise 的内部类型（TypeScript 4.5+）：

```typescript
type PromiseString = Promise<string>
type Unwrapped = Awaited<PromiseString>
// string

type NestedPromise = Promise<Promise<number>>
type UnwrappedNested = Awaited<NestedPromise>
// number

// 场景：从异步函数返回类型中提取
async function fetchData(): Promise<{ data: string[] }> {
  return { data: ['a', 'b', 'c'] }
}

type DataResult = Awaited<ReturnType<typeof fetchData>>
// { data: string[] }
```

---

## 4 工具类型对比

| 工具类型 | 语法 | 作用 | 示例 |
| --- | --- | --- | --- |
| Partial | `Partial<T>` | 所有属性变可选 | `Partial<User>` |
| Required | `Required<T>` | 所有属性变必选 | `Required<User>` |
| Readonly | `Readonly<T>` | 所有属性变只读 | `Readonly<User>` |
| Pick | `Pick<T, K>` | 选取指定属性 | `Pick<User, 'id' | 'name'>` |
| Omit | `Omit<T, K>` | 排除指定属性 | `Omit<User, 'password'>` |
| Record | `Record<K, T>` | 创建对象类型 | `Record<string, User>` |
| ReturnType | `ReturnType<T>` | 获取返回类型 | `ReturnType<typeof fn>` |
| Parameters | `Parameters<T>` | 获取参数类型 | `Parameters<typeof fn>` |
| Exclude | `Exclude<T, U>` | 排除类型 | `Exclude<string \| number, number>` |
| Extract | `Extract<T, U>` | 提取类型 | `Extract<string \| number, string>` |
| NonNullable | `NonNullable<T>` | 排除 null/undefined | `NonNullable<string \| null>` |
| Awaited | `Awaited<T>` | 解包 Promise | `Awaited<Promise<string>>` |

---

## 5 自定义工具类型

### 示例 1：提取对象的方法名

```typescript
type MethodNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never
}[keyof T]

interface User {
  id: number
  name: string
  getName(): string
  updateName(name: string): void
}

type UserMethods = MethodNames<User>
// 'getName' | 'updateName'
```

### 示例 2：提取对象的非方法属性

```typescript
type PropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K
}[keyof T]

type UserProperties = PropertyNames<User>
// 'id' | 'name'
```

### 示例 3：深度可选

```typescript
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepPartial<T[K]>
    : T[K]
}

interface NestedUser {
  id: number
  profile: {
    name: string
    address: {
      city: string
      street: string
    }
  }
}

type PartialNestedUser = DeepPartial<NestedUser>
const partial: PartialNestedUser = {
  profile: {
    address: { city: '北京' }
    // name 和 street 可以省略
  }
}
```

---

## 6 新手常见误区

### 误区 1："Partial 和 Omit 可以互相替代"

**错！** Partial 让所有属性可选，Omit 移除指定属性。

```typescript
interface User {
  id: number
  name: string
  email: string
}

type PartialUser = Partial<User>
// { id?: number; name?: string; email?: string }  // 所有属性保留，变可选

type OmitUser = Omit<User, 'email'>
// { id: number; name: string }  // email 属性被移除
```

### 误区 2："Record 就是 Map"

**错！** Record 是类型层面的，Map 是运行时数据结构。

```typescript
// Record：编译时类型检查
type UserMap = Record<number, User>
const users: UserMap = { 1: { id: 1, name: 'Alice' } }

// Map：运行时动态数据结构
const userMap = new Map<number, User>()
userMap.set(1, { id: 1, name: 'Alice' })

// 使用场景：
// Record：键名固定或已知时使用
// Map：键名不确定或需要动态添加时使用
```

### 误区 3："ReturnType 可以获取异步函数的返回值"

**错！** ReturnType 获取的是 Promise 类型，需要用 Awaited 解包。

```typescript
async function fetchUser(): Promise<User> {
  return { id: 1, name: 'Alice' }
}

type WrongType = ReturnType<typeof fetchUser>
// Promise<User> ❌ 不是 User

type CorrectType = Awaited<ReturnType<typeof fetchUser>>
// User ✅ 正确
```

### 误区 4："工具类型只能用于对象"

**错！** 有些工具类型可以用于函数、联合类型等。

```typescript
// 用于函数
type Fn = (a: number, b: string) => boolean
type Params = Parameters<Fn>  // [number, string]
type Result = ReturnType<Fn>  // boolean

// 用于联合类型
type Union = string | number | boolean
type Extracted = Extract<Union, string | number>  // string | number
type Excluded = Exclude<Union, boolean>  // string | number
```

---

## 7 动手练习

### 练习 1：基础练习

实现一个工具类型，提取对象的所有可选属性名。

<details>
<summary>点击查看答案</summary>

```typescript
interface User {
  id: number
  name: string
  email?: string
  age?: number
}

type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never
}[keyof T]

type UserOptionalKeys = OptionalKeys<User>
// 'email' | 'age'

// 解释：
// {} extends Pick<T, K> 检查属性是否可选
// 如果可选，Pick<T, K> 可以赋值给 {}
```

</details>

### 练习 2：进阶练习

实现一个工具类型，将对象的所有方法变为异步方法。

<details>
<summary>点击查看答案</summary>

```typescript
interface UserService {
  getUser(id: number): User
  createUser(user: Partial<User>): User
  updateUser(id: number, updates: Partial<User>): void
}

type Promisify<T> = {
  [K in keyof T]: T[K] extends (...args: infer Args) => infer Result
    ? (...args: Args) => Promise<Result>
    : T[K]
}

type AsyncUserService = Promisify<UserService>
// {
//   getUser(id: number): Promise<User>
//   createUser(user: Partial<User>): Promise<User>
//   updateUser(id: number, updates: Partial<User>): Promise<void>
// }

// 使用
const asyncService: AsyncUserService = {
  async getUser(id) { return { id, name: 'Alice' } },
  async createUser(user) { return { id: 2, ...user } as User },
  async updateUser(id, updates) { console.log('updated') }
}
```

</details>

### 练习 3（挑战）：综合练习

实现一个类型安全的 API 客户端，支持请求参数和响应类型的自动推断。

<details>
<summary>点击查看答案</summary>

```typescript
// API 定义
interface ApiDefinition {
  '/users': {
    GET: {
      params: { page: number; limit: number }
      response: { users: User[]; total: number }
    }
    POST: {
      body: Partial<User>
      response: User
    }
  }
  '/users/:id': {
    GET: {
      params: { id: number }
      response: User
    }
    PUT: {
      params: { id: number }
      body: Partial<User>
      response: User
    }
    DELETE: {
      params: { id: number }
      response: { success: boolean }
    }
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

type Endpoint = keyof ApiDefinition
type Method<E extends Endpoint> = keyof ApiDefinition[E]

type RequestParams<E extends Endpoint, M extends Method<E>> = 
  ApiDefinition[E][M] extends { params: infer P } ? P : {}

type RequestBody<E extends Endpoint, M extends Method<E>> = 
  ApiDefinition[E][M] extends { body: infer B } ? B : never

type Response<E extends Endpoint, M extends Method<E>> = 
  ApiDefinition[E][M]['response']

// API 客户端
class ApiClient {
  async request<
    E extends Endpoint,
    M extends Method<E>
  >(
    endpoint: E,
    method: M,
    options?: {
      params?: RequestParams<E, M>
      body?: RequestBody<E, M>
    }
  ): Promise<Response<E, M>> {
    const url = endpoint
    const params = options?.params ? new URLSearchParams(options.params as any).toString() : ''
    const fullUrl = params ? `${url}?${params}` : url
    
    const response = await fetch(fullUrl, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: options?.body ? JSON.stringify(options.body) : undefined
    })
    
    return response.json()
  }
}

// 使用示例
const api = new ApiClient()

// GET 请求：自动推断 params 和 response 类型
const users = await api.request('/users', 'GET', {
  params: { page: 1, limit: 10 }
})
// users: { users: User[]; total: number }

// POST 请求：自动推断 body 和 response 类型
const newUser = await api.request('/users', 'POST', {
  body: { name: 'Alice', email: 'alice@test.com' }
})
// newUser: User

// GET 用户详情
const user = await api.request('/users/:id', 'GET', {
  params: { id: 1 }
})
// user: User

// DELETE 用户
const result = await api.request('/users/:id', 'DELETE', {
  params: { id: 1 }
})
// result: { success: boolean }
```

</details>

---

## 下一章预告

下一章我们会学习 **Vue 中的 TypeScript**——这是本教程的最后一章，也是最实用的一章。你会学到如何在 Vue 3 中使用 TypeScript，包括组件类型、组合式 API、Props 类型、事件类型等。