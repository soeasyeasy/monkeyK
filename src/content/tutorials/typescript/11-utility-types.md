---
title: "第十一章：工具类型实战"
description: "TypeScript 内置了丰富的工具类型，可以方便地对类型进行转换和组合。"
---

# 第十一章：工具类型实战

## 运行结果

- **Partial&lt;T&gt;**
  - `updateUser = {"name":"Bob"}`
  - `所有属性变为可选`
- **Required&lt;T&gt;**
  - `completeUser = {"id":1,"name":"Alice","email":"alice@test.com","a...`
  - `所有属性变为必选`
- **Pick&lt;T, K&gt;**
  - `preview = {"id":1,"name":"Alice"}`
  - `选取部分属性`
- **Omit&lt;T, K&gt;**
  - `userNoAddr = {"id":1,"name":"Bob","email":"bob@test.com","age":30}`
  - `排除部分属性`
- **Record&lt;K, T&gt;**
  - `permissions.admin = [read, write, delete, manage]`
  - `permissions.editor = [read, write]`
  - `permissions.viewer = [read]`
- **Exclude & Extract**
  - `ActiveStatus = 'active' | 'pending'`
  - `status = "active"`
  - `OnlyStrings = string`
- **ReturnType**
  - `ReturnType<typeof createUser> = User6`
  - `ReturnType<typeof asyncFn> = Promise<string>`
- **Parameters**
  - `Parameters<typeof add> = [number, number]`

## 代码详解

### 1. `Partial<T>` - 所有属性变可选

```typescript
interface User {
  id: number
  name: string
  email: string
  age: number
}

type PartialUser = Partial<User>
// 等价于: { id?: number; name?: string; ... }

const updateUser: PartialUser = { name: 'Bob' }
// 只需要部分属性即可
```

### 2. `Required<T>` - 所有属性变必选

```typescript
interface User {
  id: number
  name: string
  address?: string  // 可选
}

type RequiredUser = Required<User>
// 等价于: { id: number; name: string; address: string }

const user: RequiredUser = {
  id: 1, name: 'Alice', address: '北京'
  // address 现在是必选的
}
```

### 3. `Pick<T, K>` - 选取属性

```typescript
interface User {
  id: number
  name: string
  email: string
  age: number
}

type UserPreview = Pick<User, 'id' | 'name'>
// 等价于: { id: number; name: string }

const preview: UserPreview = { id: 1, name: 'Alice' }
```

### 4. `Omit<T, K>` - 排除属性

```typescript
interface User {
  id: number
  name: string
  email: string
  password: string
}

type PublicUser = Omit<User, 'password'>
// 等价于: { id: number; name: string; email: string }

const user: PublicUser = {
  id: 1, name: 'Alice', email: 'alice@test.com'
}
```

### 5. `Record<K, T>` - 键值对类型

```typescript
type UserRole = 'admin' | 'editor' | 'viewer'
type RolePermissions = Record<UserRole, string[]>

const permissions: RolePermissions = {
  admin: ['read', 'write', 'delete'],
  editor: ['read', 'write'],
  viewer: ['read'],
}

// 也常用于字典类型
type Dictionary = Record<string, number>
const scores: Dictionary = { math: 95, english: 88 }
```

### 6. Exclude & Extract

```typescript
type Status = 'active' | 'inactive' | 'pending' | 'deleted'

// 排除某些类型
type ActiveStatus = Exclude<Status, 'deleted' | 'inactive'>
// 'active' | 'pending'

// 提取某些类型
type Mixed = string | number | boolean
type OnlyStrings = Extract<Mixed, string>
// string
```

### 7. `NonNullable<T>`

```typescript
type MaybeString = string | null | undefined
type DefinitelyString = NonNullable<MaybeString>
// string

const value: DefinitelyString = 'hello'
// value = null  // ❌ 不允许
```

### 8. `ReturnType<T>`

```typescript
function createUser(): { id: number; name: string } {
  return { id: 1, name: 'Alice' }
}

type UserReturn = ReturnType<typeof createUser>
// { id: number; name: string }

const asyncFn = async () => 'hello'
type AsyncReturn = ReturnType<typeof asyncFn>
// Promise<string>
```

### 9. `Parameters<T>`

```typescript
function add(a: number, b: number): number {
  return a + b
}

type AddParams = Parameters<typeof add>
// [a: number, b: number]

// 可以用于创建类型安全的函数包装器
type FirstParam = Parameters<typeof add>[0]  // number
```

### 10. 实际应用：DTO 类型

```typescript
interface Product {
  id: number
  title: string
  price: number
  description: string
  stock: number
}

// 创建商品（不需要 id）
type CreateProductDTO = Omit<Product, 'id'>

// 更新商品（所有字段可选）
type UpdateProductDTO = Partial<Omit<Product, 'id'>>

// 商品列表项（只显示部分信息）
type ProductListItem = Pick<Product, 'id' | 'title' | 'price'>

// 按类别分组
type ProductsByCategory = Record<string, Product[]>
```

## 工具类型速查表

| 工具类型 | 作用 | 示例 |
| --- | --- | --- |
| `Partial<T>` | 所有属性变可选 | 更新操作 |
| `Required<T>` | 所有属性变必选 | 严格校验 |
| `Pick<T, K>` | 选取部分属性 | 视图模型 |
| `Omit<T, K>` | 排除部分属性 | DTO 类型 |
| `Record<K, T>` | 键值对类型 | 字典、映射 |
| `Exclude<T, U>` | 联合类型排除 | 状态过滤 |
| `Extract<T, U>` | 联合类型提取 | 类型筛选 |
| `NonNullable<T>` | 排除 null/undefined | 非空保证 |
| `ReturnType<T>` | 函数返回类型 | 类型推导 |
| `Parameters<T>` | 函数参数类型 | 类型推导 |
