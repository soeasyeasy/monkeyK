---
title: "第九章：类型断言与类型收窄"
description: "类型断言和类型收窄是 TypeScript 中连接类型系统与运行时行为的重要桥梁。"
---

# 第九章：类型断言与类型收窄

## 运行结果

- **类型断言 as**
  - `someValue = "hello world"`
  - `(someValue as string).length = 11`
- **非空断言 !**
  - `getLength('hello') = 5`
  - `email 存在时: (示例：当 email 存在时返回其长度)`
- **typeof 守卫**
  - `formatValue('hello') = "HELLO"`
  - `formatValue(3.14159) = "3.14"`
  - `formatValue(true) = "Yes"`
- **instanceof 守卫**
  - `handleError(new CustomError('Not Found', 404)) = "Error [404]: Not Found"`
  - `handleError(new Error('Generic')) = "Error: Generic"`
  - `formatDate(new Date2(2024, 1, 15)) = "2024-01-15"`
- **in 操作符守卫**
  - `getUserInfo(admin) = "管理员，权限: read, write, delete"`
  - `getUserInfo(user) = "普通用户，上次登录: 2024-01-15"`
- **自定义类型守卫**
  - `animalSound(cat) = "喵~"`
  - `animalSound(dog) = "汪!"`
- **satisfies**
  - `palette.red = [255, 0, 0] (类型: number[])`
  - `palette.green = "#00ff00" (类型: string)`

## 代码详解

### 1. 类型断言 as

```typescript
const someValue: unknown = 'hello world'
const strLength = (someValue as string).length

// 用于 DOM 元素
const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')
```

### 2. 非空断言 !

```typescript
function getLength(str: string | null | undefined): number {
  return str!.length  // 告诉编译器：值一定不是 null/undefined
}

interface User { name: string; email?: string }
const user: User = { name: 'Alice' }
const len = user.email!.length  // 非空断言
```

### 3. typeof 类型守卫

```typescript
function formatValue(value: string | number | boolean): string {
  if (typeof value === 'string') {
    return value.toUpperCase()  // TS 推导为 string
  }
  if (typeof value === 'number') {
    return value.toFixed(2)     // TS 推导为 number
  }
  return value ? 'Yes' : 'No'  // TS 推导为 boolean
}
```

### 4. instanceof 类型守卫

```typescript
class CustomError extends Error {
  code: number
  constructor(message: string, code: number) {
    super(message)
    this.code = code
  }
}

function handleError(err: Error): string {
  if (err instanceof CustomError) {
    return `Error [${err.code}]: ${err.message}`
    // TS 知道这里是 CustomError，可以访问 code
  }
  return `Error: ${err.message}`
}
```

### 5. in 操作符类型守卫

```typescript
interface Admin { role: 'admin'; permissions: string[] }
interface RegularUser { role: 'user'; lastLogin: string }

function getUserInfo(user: Admin | RegularUser): string {
  if ('permissions' in user) {
    return `管理员，权限: ${user.permissions.join(', ')}`
  }
  return `普通用户，上次登录: ${user.lastLogin}`
}
```

### 6. 自定义类型守卫（is 关键字）

```typescript
interface Cat { meow(): string }
interface Dog { bark(): string }

// 返回值类型 animal is Cat 就是自定义类型守卫
function isCat(animal: Cat | Dog): animal is Cat {
  return 'meow' in animal
}

function animalSound(animal: Cat | Dog): string {
  if (isCat(animal)) {
    return animal.meow()  // TS 知道是 Cat
  }
  return animal.bark()
}
```

### 7. satisfies 操作符（TS 4.9+）

```typescript
// satisfies 验证类型但不改变推导类型
const palette = {
  red: [255, 0, 0],
  green: '#00ff00',
  blue: [0, 0, 255],
} satisfies Record<string, string | number[]>

// palette.red 推导为 number[]（而非 string | number[]）
// palette.yellow  // ❌ 报错，不满足约束
```
