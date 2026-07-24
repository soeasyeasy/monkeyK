---
title: "第三章：对象与接口"
description: "接口（interface）是 TypeScript 中定义对象形状的核心工具，支持可选属性、只读属性、继承等特性。"
---

# 第三章：对象与接口

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何定义对象的类型？
- 什么是接口？为什么需要接口？
- 可选属性和只读属性有什么区别？
- 接口如何继承？

这一章就是为了解答这些问题。我们会先搞清楚 **接口的核心概念**，再动手实践。

---

## 3.1 为什么需要接口？

### 痛点分析

在 JavaScript 中，对象的属性是自由的：

```javascript
// JavaScript - 对象可以随意添加属性
const user = { name: 'Alice', age: 25 }
user.email = 'alice@test.com'  // 可以
user.isAdmin = true            // 也可以
// 不知道对象到底有哪些属性
```

想象一下：你去酒店登记入住，前台说"你想填什么信息就填什么"，结果有人填了身高体重，有人填了星座血型——这样酒店根本没法管理。

### 解决方案

TypeScript 的接口定义了对象的"形状"：

```typescript
// TypeScript - 接口定义对象必须有哪些属性
interface User {
  name: string
  age: number
  email: string
}

const user: User = {
  name: 'Alice',
  age: 25,
  email: 'alice@test.com'
  // 如果遗漏任何属性，编译错误！
}
```

> **一句话总结**：接口就像一份登记表，明确告诉对象"你必须有这些字段，不能多也不能少"。

---

## 3.2 核心原理

### 接口的作用

接口是一种**类型契约**，它定义了对象必须遵守的规则：

1. **属性必须存在**（除非标记为可选）
2. **属性类型必须匹配**
3. **不能有额外的属性**（除非使用索引签名）

打个比方：

> 接口就像一份合同，签合同的人必须履行合同中的条款。如果不遵守，编译器就会"起诉"你。

### 接口 vs 类型别名

| 特性 | interface | type |
| --- | --- | --- |
| 扩展方式 | extends | &（交叉类型） |
| 同名合并 | ✅ 自动合并 | ❌ 报错 |
| 描述对象 | ✅ 推荐 | ✅ |
| 联合/基本类型 | ❌ | ✅ |
| 计算属性 | ❌ | ✅ |

---

## 3.3 接口详解

### 1. 基本接口

```typescript
// 定义用户接口
interface User {
  name: string    // 字符串类型
  age: number     // 数字类型
  email: string   // 字符串类型
}

// 创建符合接口的对象
const user: User = {
  name: 'Alice',
  age: 25,
  email: 'alice@example.com'
}
```

### 2. 可选属性（? 修饰）

```typescript
// 配置接口，timeout 和 debug 是可选的
interface Config {
  host: string      // 必选
  port: number      // 必选
  timeout?: number  // 可选
  debug?: boolean   // 可选
}

// 只提供必选属性
const config1: Config = { host: 'localhost', port: 3000 }

// 提供所有属性
const config2: Config = { 
  host: 'production.com', 
  port: 8080, 
  timeout: 5000, 
  debug: true 
}
```

### 3. 只读属性（readonly）

```typescript
// 点坐标接口，x 和 y 只读
interface Point {
  readonly x: number
  readonly y: number
}

const point: Point = { x: 10, y: 20 }
// point.x = 30  // ❌ 编译错误！不能修改只读属性

// 数组也可以是只读的
interface ReadonlyArray<T> {
  readonly [index: number]: T
}
```

### 4. 接口继承（extends）

```typescript
// 基础动物接口
interface Animal {
  name: string
  sound: string
}

// Dog 继承 Animal，添加额外属性
interface Dog extends Animal {
  breed: string
  isTrained: boolean
}

const dog: Dog = {
  name: 'Buddy',
  sound: 'Woof!',
  breed: 'Golden Retriever',
  isTrained: true
}
```

### 5. 多继承

```typescript
// 主人接口
interface HasOwner {
  owner: string
  chipId: string
}

// PetDog 同时继承 Dog 和 HasOwner
interface PetDog extends Dog, HasOwner {
  vaccinations: string[]
}

const petDog: PetDog = {
  name: 'Max',
  sound: 'Bark!',
  breed: 'Labrador',
  isTrained: false,
  owner: 'Bob',
  chipId: 'CHIP-001',
  vaccinations: ['狂犬疫苗', '犬瘟热']
}
```

### 6. 索引签名

```typescript
// 字典接口，任意字符串键，值为 string
interface Dictionary {
  [key: string]: string
}

const dict: Dictionary = {
  hello: '你好',
  world: '世界',
  typescript: '类型安全'
}

// 可以添加任意属性
dict.javascript = '脚本语言'
```

### 7. 接口描述函数

```typescript
// 数学函数接口
interface MathFunc {
  (a: number, b: number): number
}

const add: MathFunc = (a, b) => a + b
const subtract: MathFunc = (a, b) => a - b

add(3, 5)    // 8
subtract(10, 4)  // 6
```

---

## 3.4 interface vs type 对比

| 特性 | interface | type |
| --- | --- | --- |
| 扩展方式 | extends | &（交叉类型） |
| 同名合并 | ✅ 自动合并 | ❌ 报错 |
| 描述对象 | ✅ 推荐 | ✅ |
| 联合/基本类型 | ❌ | ✅ |
| 计算属性 | ❌ | ✅ |
| 映射类型 | ❌ | ✅ |
| 声明合并 | ✅ | ❌ |

> **选择建议**：
> - 描述对象结构时，优先使用 `interface`
> - 需要联合类型、字面量类型、映射类型时，使用 `type`

---

## 3.5 新手常见误区

### 误区 1："接口可以有实现代码"

**错！** 接口只定义结构，不包含实现。

```typescript
// ❌ 错误做法
interface User {
  name: string
  sayHello() {  // ❌ 接口不能有实现
    console.log('Hello')
  }
}

// ✅ 正确做法
interface User {
  name: string
  sayHello(): string
}

class Person implements User {
  name: string
  constructor(name: string) { this.name = name }
  sayHello(): string {
    return `Hello, ${this.name}`
  }
}
```

### 误区 2："可选属性就是 undefined"

**不完全对！** 可选属性可以是 `undefined`，也可以完全不存在。

```typescript
interface User {
  name: string
  email?: string
}

const user1: User = { name: 'Alice' }  // ✅ email 不存在
const user2: User = { name: 'Bob', email: undefined }  // ✅ email 是 undefined
const user3: User = { name: 'Charlie', email: 'charlie@test.com' }  // ✅
```

### 误区 3："接口继承只能继承一个"

**错！** 接口可以继承多个接口。

```typescript
interface A { a: string }
interface B { b: number }
interface C { c: boolean }

// 继承多个接口
interface D extends A, B, C {
  d: string
}

const d: D = { a: 'hello', b: 42, c: true, d: 'world' }
```

### 误区 4："接口可以实例化"

**错！** 接口是类型，不是值，不能用 `new` 创建实例。

```typescript
interface User {
  name: string
  age: number
}

// ❌ 错误做法
const user = new User()  // 接口不能被实例化

// ✅ 正确做法
const user: User = { name: 'Alice', age: 25 }
```

---

## 3.6 动手练习

### 练习 1：基础练习

定义一个 `Product` 接口，包含商品的基本信息。

<details>
<summary>点击查看答案</summary>

```typescript
// 定义商品接口
interface Product {
  id: number
  name: string
  price: number
  description: string
  stock: number
}

// 创建商品对象
const product: Product = {
  id: 1,
  name: 'TypeScript 教程',
  price: 99.9,
  description: '从零开始学习 TypeScript',
  stock: 100
}

console.log(product.name)  // "TypeScript 教程"
console.log(product.price.toFixed(2))  // "99.90"
```

</details>

### 练习 2：进阶练习

定义接口继承关系，创建用户和管理员类型。

<details>
<summary>点击查看答案</summary>

```typescript
// 基础用户接口
interface BaseUser {
  id: number
  name: string
  email: string
}

// 普通用户
interface RegularUser extends BaseUser {
  role: 'user'
  lastLogin: string
}

// 管理员
interface AdminUser extends BaseUser {
  role: 'admin'
  permissions: string[]
}

// 创建用户
const regularUser: RegularUser = {
  id: 1,
  name: 'Alice',
  email: 'alice@test.com',
  role: 'user',
  lastLogin: '2024-01-15'
}

const adminUser: AdminUser = {
  id: 2,
  name: 'Bob',
  email: 'bob@test.com',
  role: 'admin',
  permissions: ['read', 'write', 'delete']
}

function getUserRole(user: RegularUser | AdminUser): string {
  return user.role === 'admin' ? '管理员' : '普通用户'
}

console.log(getUserRole(regularUser))  // "普通用户"
console.log(getUserRole(adminUser))    // "管理员"
```

</details>

### 练习 3（挑战）：综合练习

定义一个复杂的接口体系，包含博客文章、作者、评论等。

<details>
<summary>点击查看答案</summary>

```typescript
// 作者接口
interface Author {
  id: number
  name: string
  bio: string
}

// 评论接口
interface Comment {
  id: number
  author: string
  content: string
  createdAt: string
  likes: number
}

// 博客文章接口
interface BlogPost {
  id: number
  title: string
  content: string
  author: Author
  tags: string[]
  publishedAt: string
  comments: Comment[]
  views: number
}

// 创建博客文章
const post: BlogPost = {
  id: 1,
  title: 'TypeScript 入门指南',
  content: 'TypeScript 是 JavaScript 的超集...',
  author: {
    id: 100,
    name: '张三',
    bio: '前端工程师，热爱 TypeScript'
  },
  tags: ['TypeScript', '前端', '教程'],
  publishedAt: '2024-01-15',
  comments: [
    {
      id: 1,
      author: '李四',
      content: '写得太好了！',
      createdAt: '2024-01-15',
      likes: 25
    },
    {
      id: 2,
      author: '王五',
      content: '期待后续章节',
      createdAt: '2024-01-16',
      likes: 12
    }
  ],
  views: 1500
}

// 统计信息
function getPostStats(post: BlogPost): string {
  const commentCount = post.comments.length
  const totalLikes = post.comments.reduce((sum, c) => sum + c.likes, 0)
  return `文章: ${post.title}\n作者: ${post.author.name}\n评论数: ${commentCount}\n总点赞: ${totalLikes}\n阅读量: ${post.views}`
}

console.log(getPostStats(post))
```

</details>

---

## 下一章预告

下一章我们会学习 **类型别名与联合类型**——也就是如何用 `type` 关键字创建自定义类型，以及如何组合多种类型。你会学到联合类型、交叉类型、字面量类型和类型守卫等核心特性。