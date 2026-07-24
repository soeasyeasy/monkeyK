---
title: "第九章：类型断言与类型收窄"
description: "类型断言和类型收窄是 TypeScript 中连接类型系统与运行时行为的重要桥梁。"
---

# 第九章：类型断言与类型收窄

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是类型断言？什么时候用？
- `as` 和 `!` 有什么区别？
- 类型守卫是什么？有哪些类型守卫？
- `satisfies` 操作符有什么用？

这一章就是为了解答这些问题。我们会先搞清楚 **类型断言和类型收窄** 的核心概念，再动手实践。

---

## 9.1 为什么需要类型断言？

### 痛点分析

有时候我们比编译器更了解变量的类型：

```typescript
// TypeScript 不知道 DOM 元素的具体类型
const canvas = document.getElementById('canvas')
// canvas.getContext('2d')  // ❌ 报错！canvas 可能是 null
```

想象一下：你明明知道冰箱里有牛奶，但家人说"可能没有"——这就是编译器的问题。

### 解决方案

类型断言告诉编译器"相信我，我知道这个变量的类型"：

```typescript
// ✅ 告诉编译器 canvas 是 HTMLCanvasElement
const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')  // ✅
```

> **一句话总结**：类型断言就像给变量贴一个新标签，告诉编译器"这个变量是这个类型"。

---

## 9.2 核心原理

### 类型断言 vs 类型转换

| 特性 | 类型断言 | 类型转换 |
| --- | --- | --- |
| 时机 | 编译时 | 运行时 |
| 效果 | 告诉编译器类型 | 实际转换值 |
| 语法 | `value as Type` | `Number(value)` |
| 安全性 | 不安全（跳过检查） | 安全 |

打个比方：

> 类型断言就像给一个人换了个名字标签，虽然标签变了，但人还是那个人。
> 类型转换就像把一个苹果切成小块，东西本身变了。

---

## 9.3 类型断言详解

### 1. 类型断言 as

```typescript
// 基础用法
const someValue: unknown = 'hello world'
const strLength = (someValue as string).length
// strLength = 11

// DOM 元素断言
const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')

// 联合类型收窄
interface Cat { meow(): void }
interface Dog { bark(): void }
function getPet(): Cat | Dog {
  return { meow: () => console.log('喵') }
}
const cat = getPet() as Cat
cat.meow()  // ✅
```

### 2. 非空断言 !

```typescript
// 告诉编译器值一定不是 null/undefined
function getLength(str: string | null | undefined): number {
  return str!.length  // 非空断言
}

// 可选属性非空断言
interface User { 
  name: string; 
  email?: string 
}
const user: User = { name: 'Alice' }
// const len = user.email!.length  // ⚠️ 如果 email 确实是 undefined，运行时崩溃！

// 更好的做法：先检查
const len = user.email ? user.email.length : 0
```

### 3. typeof 类型守卫

```typescript
function formatValue(value: string | number | boolean): string {
  // typeof 检查，TypeScript 自动收窄类型
  if (typeof value === 'string') {
    return value.toUpperCase()  // TS 知道是 string
  }
  if (typeof value === 'number') {
    return value.toFixed(2)     // TS 知道是 number
  }
  return value ? 'Yes' : 'No'  // TS 知道是 boolean
}

formatValue('hello')   // "HELLO"
formatValue(3.14159)   // "3.14"
formatValue(true)      // "Yes"
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
    // TS 知道这里是 CustomError，可以访问 code
    return `Error [${err.code}]: ${err.message}`
  }
  return `Error: ${err.message}`
}

handleError(new CustomError('Not Found', 404))  
// "Error [404]: Not Found"

handleError(new Error('Generic'))  
// "Error: Generic"
```

### 5. in 操作符类型守卫

```typescript
interface Admin { 
  role: 'admin' 
  permissions: string[] 
}
interface RegularUser { 
  role: 'user' 
  lastLogin: string 
}

function getUserInfo(user: Admin | RegularUser): string {
  if ('permissions' in user) {
    // TS 知道是 Admin
    return `管理员，权限: ${user.permissions.join(', ')}`
  }
  // TS 知道是 RegularUser
  return `普通用户，上次登录: ${user.lastLogin}`
}

const admin: Admin = { role: 'admin', permissions: ['read', 'write', 'delete'] }
const user: RegularUser = { role: 'user', lastLogin: '2024-01-15' }

getUserInfo(admin)   // "管理员，权限: read, write, delete"
getUserInfo(user)    // "普通用户，上次登录: 2024-01-15"
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
  return animal.bark()    // TS 知道是 Dog
}

const cat: Cat = { meow: () => '喵~' }
const dog: Dog = { bark: () => '汪!' }

animalSound(cat)  // "喵~"
animalSound(dog)  // "汪!"
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
console.log(palette.red[0])  // ✅ 可以访问数组元素

// palette.yellow  // ❌ 报错，不满足约束
```

---

## 9.4 类型守卫对比

| 守卫类型 | 语法 | 适用场景 |
| --- | --- | --- |
| typeof | `typeof x === 'string'` | 基础类型 |
| instanceof | `x instanceof Class` | 类实例 |
| in | `'prop' in x` | 对象属性 |
| 自定义 | `x is Type` | 复杂类型 |
| satisfies | `x satisfies Type` | 验证类型不改变推导 |

---

## 9.5 新手常见误区

### 误区 1："类型断言可以改变运行时行为"

**错！** 类型断言只是告诉编译器类型，不会改变实际值。

```typescript
const num: number = 42
const str = num as string  // 编译通过，但 str 还是数字 42
// str.toUpperCase()  // ❌ 运行时崩溃！
```

### 误区 2："非空断言永远安全"

**错！** 非空断言只是跳过检查，如果值确实是 null/undefined，运行时会崩溃。

```typescript
interface User { name: string; email?: string }
const user: User = { name: 'Alice' }

// ❌ 危险！email 是 undefined
// const len = user.email!.length  // 运行时崩溃

// ✅ 安全做法：先检查
const len = user.email?.length ?? 0
```

### 误区 3："类型守卫只能用 if"

**错！** 类型守卫可以用在 switch、三元表达式等任何条件语句中。

```typescript
function format(value: string | number): string {
  // switch 语句
  switch (typeof value) {
    case 'string': return value.toUpperCase()
    case 'number': return value.toFixed(2)
    default: return String(value)
  }
}

// 三元表达式
const result = typeof value === 'string' ? value.length : value.toFixed(2)
```

### 误区 4："satisfies 和类型注解一样"

**不对！** satisfies 验证类型但不改变推导类型，类型注解会改变推导。

```typescript
// satisfies：验证类型，推导类型不变
const palette = {
  red: [255, 0, 0],
} satisfies Record<string, string | number[]>
// palette.red 推导为 number[]

// 类型注解：改变推导类型
const palette2: Record<string, string | number[]> = {
  red: [255, 0, 0],
}
// palette2.red 推导为 string | number[]
```

---

## 9.6 动手练习

### 练习 1：基础练习

编写一个函数，使用 typeof 守卫处理不同类型的输入。

<details>
<summary>点击查看答案</summary>

```typescript
function processInput(input: string | number | boolean | null): string {
  if (input === null) {
    return '输入为空'
  }
  
  switch (typeof input) {
    case 'string':
      return `字符串: "${input}" (长度: ${input.length})`
    case 'number':
      return `数字: ${input} (是否整数: ${Number.isInteger(input)})`
    case 'boolean':
      return `布尔值: ${input ? '真' : '假'}`
    default:
      return '未知类型'
  }
}

console.log(processInput('hello'))   // '字符串: "hello" (长度: 5)'
console.log(processInput(42))        // '数字: 42 (是否整数: true)'
console.log(processInput(true))      // '布尔值: 真'
console.log(processInput(null))      // '输入为空'
```

</details>

### 练习 2：进阶练习

实现自定义类型守卫，区分不同类型的动物。

<details>
<summary>点击查看答案</summary>

```typescript
interface Bird {
  type: 'bird'
  fly(): string
  wingspan: number
}

interface Fish {
  type: 'fish'
  swim(): string
  fins: number
}

interface Dog {
  type: 'dog'
  bark(): string
  breed: string
}

type Animal = Bird | Fish | Dog

// 自定义类型守卫
function isBird(animal: Animal): animal is Bird {
  return animal.type === 'bird'
}

function isFish(animal: Animal): animal is Fish {
  return animal.type === 'fish'
}

function isDog(animal: Animal): animal is Dog {
  return animal.type === 'dog'
}

// 处理动物
function handleAnimal(animal: Animal): string {
  if (isBird(animal)) {
    return `🐦 ${animal.fly()}，翼展: ${animal.wingspan}cm`
  }
  if (isFish(animal)) {
    return `🐟 ${animal.swim()}，鱼鳍数量: ${animal.fins}`
  }
  if (isDog(animal)) {
    return `🐶 ${animal.bark()}，品种: ${animal.breed}`
  }
  return '未知动物'
}

const eagle: Bird = {
  type: 'bird',
  fly: () => '翱翔蓝天',
  wingspan: 200
}

const shark: Fish = {
  type: 'fish',
  swim: () => '畅游大海',
  fins: 5
}

const goldenRetriever: Dog = {
  type: 'dog',
  bark: () => '汪汪汪',
  breed: '金毛寻回犬'
}

console.log(handleAnimal(eagle))          // '🐦 翱翔蓝天，翼展: 200cm'
console.log(handleAnimal(shark))          // '🐟 畅游大海，鱼鳍数量: 5'
console.log(handleAnimal(goldenRetriever)) // '🐶 汪汪汪，品种: 金毛寻回犬'
```

</details>

### 练习 3（挑战）：综合练习

实现一个类型安全的表单验证函数。

<details>
<summary>点击查看答案</summary>

```typescript
interface StringField {
  type: 'string'
  value: string
  required?: boolean
  minLength?: number
  maxLength?: number
}

interface NumberField {
  type: 'number'
  value: number | null
  required?: boolean
  min?: number
  max?: number
}

interface EmailField {
  type: 'email'
  value: string
  required?: boolean
}

type FormField = StringField | NumberField | EmailField

// 自定义类型守卫
function isStringField(field: FormField): field is StringField {
  return field.type === 'string'
}

function isNumberField(field: FormField): field is NumberField {
  return field.type === 'number'
}

function isEmailField(field: FormField): field is EmailField {
  return field.type === 'email'
}

// 验证函数
function validateField(field: FormField): string[] {
  const errors: string[] = []
  
  // 必填检查
  if (field.required) {
    if (isNumberField(field) && field.value === null) {
      errors.push('此字段为必填')
    }
    if ((isStringField(field) || isEmailField(field)) && !field.value) {
      errors.push('此字段为必填')
    }
  }
  
  // 字符串字段验证
  if (isStringField(field) && field.value) {
    if (field.minLength && field.value.length < field.minLength) {
      errors.push(`最小长度为 ${field.minLength}`)
    }
    if (field.maxLength && field.value.length > field.maxLength) {
      errors.push(`最大长度为 ${field.maxLength}`)
    }
  }
  
  // 数字字段验证
  if (isNumberField(field) && field.value !== null) {
    if (field.min !== undefined && field.value < field.min) {
      errors.push(`最小值为 ${field.min}`)
    }
    if (field.max !== undefined && field.value > field.max) {
      errors.push(`最大值为 ${field.max}`)
    }
  }
  
  // 邮箱字段验证
  if (isEmailField(field) && field.value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(field.value)) {
      errors.push('请输入有效的邮箱地址')
    }
  }
  
  return errors
}

// 测试
const nameField: StringField = {
  type: 'string',
  value: 'Alice',
  required: true,
  minLength: 2,
  maxLength: 20
}

const ageField: NumberField = {
  type: 'number',
  value: 17,
  required: true,
  min: 18,
  max: 100
}

const emailField: EmailField = {
  type: 'email',
  value: 'invalid-email',
  required: true
}

console.log(validateField(nameField))   // [] (验证通过)
console.log(validateField(ageField))    // ['最小值为 18']
console.log(validateField(emailField))  // ['请输入有效的邮箱地址']
```

</details>

---

## 下一章预告

下一章我们会学习 **高级类型**——也就是如何使用 keyof、typeof、infer、条件类型、映射类型和模板字面量类型等高级特性。这些特性让你能够写出更强大、更灵活的类型代码。