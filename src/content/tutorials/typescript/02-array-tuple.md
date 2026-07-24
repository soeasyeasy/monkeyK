---
title: "第二章：数组与元组"
description: "TypeScript 为数组提供了更精确的类型定义，元组则允许我们表达固定长度和类型的数组。"
---

# 第二章：数组与元组

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 数组的类型怎么定义？
- `number[]` 和 `Array<number>` 有什么区别？
- 什么是元组？什么时候需要用元组？
- 只读数组有什么用？

这一章就是为了解答这些问题。我们会先搞清楚 **数组和元组的类型系统**，再动手实践。

---

## 2.1 为什么需要数组类型？

### 痛点分析

在 JavaScript 中，数组可以混合存储任何类型的值：

```javascript
// JavaScript - 数组可以装任何东西
const mixed = [1, 'hello', true, { name: 'Alice' }]
console.log(mixed[0].toUpperCase())  // ❌ 运行时崩溃！数字没有 toUpperCase
```

想象一下：你把苹果、香蕉、鞋子、书本都放进同一个购物袋里，结账时收银员根本不知道该怎么处理——这就是 JavaScript 数组的问题。

### 解决方案

TypeScript 的数组类型确保数组中只能存储相同类型的值：

```typescript
// TypeScript - 数组只能装指定类型
const numbers: number[] = [1, 2, 3, 4, 5]
// numbers.push('hello')  // ❌ 编译错误！不能添加字符串
console.log(numbers[0].toFixed(2))  // ✅ 安全！
```

> **一句话总结**：数组类型就像给购物袋贴上标签"只装水果"，确保里面的东西都是同一类。

---

## 2.2 核心原理

### 数组类型 vs 元组类型

| 特性 | 数组 | 元组 |
| --- | --- | --- |
| 长度 | 可变 | 固定 |
| 类型 | 所有元素相同 | 每个元素独立类型 |
| 用途 | 存储同类数据集合 | 存储不同类型的相关数据 |
| 示例 | `[1, 2, 3]` | `['Alice', 25, true]` |

打个比方：

> 数组就像一个鞋盒，里面装的都是鞋子，数量可以增减。
> 元组就像一个档案袋，里面装着特定的文件：第一页是姓名，第二页是年龄，第三页是照片，顺序和数量都固定。

---

## 2.3 数组类型详解

### 方式一：类型 + 方括号

```typescript
// 数字数组
const numbers: number[] = [1, 2, 3, 4, 5]
// 字符串数组
const fruits: string[] = ['apple', 'banana', 'cherry']
// 布尔数组
const flags: boolean[] = [true, false, true]
```

### 方式二：Array<类型> 泛型写法

```typescript
// 泛型写法，和 number[] 等价
const booleans: Array<boolean> = [true, false, true]
const strings: Array<string> = ['a', 'b', 'c']
```

> **提示**：两种写法完全等价，推荐使用 `number[]` 这种简洁的写法。

### 只读数组（不可修改）

```typescript
// readonly 数组不能添加、删除、修改元素
const readonlyNums: readonly number[] = [1, 2, 3]
// readonlyNums.push(4)  // ❌ 报错！不能添加
// readonlyNums[0] = 10  // ❌ 报错！不能修改

// 也可以用 ReadonlyArray
const readonlyFruits: ReadonlyArray<string> = ['a', 'b', 'c']
```

> **场景**：当你需要保护数据不被意外修改时使用只读数组。

### 数组方法的类型安全

```typescript
const nums = [1, 2, 3, 4, 5]

// map：类型明确的回调，返回新数组
const doubled: number[] = nums.map((n: number): number => n * 2)
// doubled = [2, 4, 6, 8, 10]

// filter：过滤符合条件的元素
const evens: number[] = nums.filter((n: number): boolean => n % 2 === 0)
// evens = [2, 4]

// reduce：累加计算
const sum: number = nums.reduce(
  (acc: number, n: number): number => acc + n, 0
)
// sum = 15
```

---

## 2.4 元组类型详解

### 基本元组

```typescript
// 固定长度和类型的数组
const pair: [string, number] = ['age', 25]
const rgb: [number, number, number] = [255, 128, 0]  // RGB 颜色值

// 访问元素时，TypeScript 知道每个位置的类型
pair[0].toUpperCase()  // ✅ string 类型
pair[1].toFixed(2)    // ✅ number 类型
```

### 可选元组元素

```typescript
// 第二个元素可选（? 标记）
const optionalTuple: [string, number?] = ['hello']
const optionalTuple2: [string, number?] = ['world', 42]  // 也可以提供第二个元素
```

### 带标签的元组（更可读）

```typescript
// 给每个元素起个名字，增强可读性
const namedTuple: [name: string, age: number, active: boolean]
  = ['Alice', 30, true]

// 解构时可以使用标签名
const { name, age, active } = namedTuple
```

### 只读元组

```typescript
// 只读元组，不可修改
const readonlyTuple: readonly [string, number] = ['fixed', 100]
// readonlyTuple[0] = 'changed'  // ❌ 报错！
```

---

## 2.5 数组 vs 元组对比

| 特性 | 数组 | 元组 |
| --- | --- | --- |
| 长度 | 可变 | 固定 |
| 元素类型 | 统一 | 可以不同 |
| 类型标注 | `number[]` | `[string, number]` |
| 访问方式 | 通过索引 | 通过索引或标签 |
| 扩展能力 | 可以 push/pop | 不建议扩展 |
| 典型用途 | 列表数据 | 坐标、键值对、返回值 |

---

## 2.6 新手常见误区

### 误区 1："元组可以随意添加元素"

**错！** 虽然 JavaScript 运行时允许，但 TypeScript 会报错。

```typescript
const tuple: [string, number] = ['hello', 42]
// tuple.push('world')  // ⚠️ 虽然运行时能执行，但类型不安全

// ✅ 正确做法：如果需要可变长度，使用数组
const arr: (string | number)[] = ['hello', 42]
arr.push('world')  // ✅
```

### 误区 2："数组类型是 `Array`"

**不对！** `Array` 是构造函数，类型应该用 `number[]` 或 `Array<number>`。

```typescript
// ❌ 错误做法
const nums: Array = [1, 2, 3]  // 这是 any 类型，不安全

// ✅ 正确做法
const nums: number[] = [1, 2, 3]
const nums2: Array<number> = [1, 2, 3]
```

### 误区 3："元组只能有两个元素"

**不是的！** 元组可以有任意数量的元素。

```typescript
// 三维坐标
const position: [number, number, number] = [10, 20, 30]

// 用户信息
const user: [string, number, boolean, string] = ['Alice', 25, true, '北京']
```

### 误区 4："只读数组完全不能用"

**错！** 只读数组只是不能修改，但可以正常访问和遍历。

```typescript
const readonlyNums: readonly number[] = [1, 2, 3]

// ✅ 可以访问
console.log(readonlyNums[0])  // 1

// ✅ 可以遍历
readonlyNums.forEach(n => console.log(n))

// ✅ 可以使用不修改原数组的方法
const doubled = readonlyNums.map(n => n * 2)
```

---

## 2.7 动手练习

### 练习 1：基础练习

创建一个字符串数组，添加元素并使用数组方法处理。

<details>
<summary>点击查看答案</summary>

```typescript
// 创建字符串数组
const fruits: string[] = ['apple', 'banana', 'cherry']

// 添加元素
fruits.push('date')  // ✅

// 遍历数组
fruits.forEach(fruit => console.log(fruit))

// 转换为大写
const upperFruits: string[] = fruits.map(f => f.toUpperCase())
// ['APPLE', 'BANANA', 'CHERRY', 'DATE']

// 过滤长度大于5的水果
const longFruits: string[] = fruits.filter(f => f.length > 5)
// ['banana', 'cherry']
```

</details>

### 练习 2：进阶练习

定义一个元组类型表示用户信息（姓名、年龄、邮箱），编写函数处理元组数据。

<details>
<summary>点击查看答案</summary>

```typescript
// 定义用户元组类型
type UserTuple = [name: string, age: number, email: string]

// 创建用户
const user: UserTuple = ['Alice', 25, 'alice@example.com']

// 函数处理用户数据
function formatUser(user: UserTuple): string {
  const [name, age, email] = user
  return `姓名: ${name}, 年龄: ${age}, 邮箱: ${email}`
}

console.log(formatUser(user))
// "姓名: Alice, 年龄: 25, 邮箱: alice@example.com"

// 创建只读用户
const readonlyUser: readonly UserTuple = ['Bob', 30, 'bob@example.com']
```

</details>

### 练习 3（挑战）：综合练习

编写一个函数，接受多个元组（表示坐标点），计算两点之间的距离。

<details>
<summary>点击查看答案</summary>

```typescript
// 坐标点类型
type Point = [x: number, y: number]

// 计算两点距离
function distance(point1: Point, point2: Point): number {
  const [x1, y1] = point1
  const [x2, y2] = point2
  // 距离公式：√[(x2-x1)² + (y2-y1)²]
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

// 测试
const p1: Point = [0, 0]
const p2: Point = [3, 4]
console.log(distance(p1, p2))  // 5

// 三维坐标扩展
type Point3D = [x: number, y: number, z: number]
function distance3D(point1: Point3D, point2: Point3D): number {
  const [x1, y1, z1] = point1
  const [x2, y2, z2] = point2
  return Math.sqrt(
    Math.pow(x2 - x1, 2) + 
    Math.pow(y2 - y1, 2) + 
    Math.pow(z2 - z1, 2)
  )
}

const p3: Point3D = [1, 2, 3]
const p4: Point3D = [4, 6, 11]
console.log(distance3D(p3, p4))  // 10
```

</details>

---

## 下一章预告

下一章我们会学习 **对象与接口**——也就是如何定义复杂数据结构的形状。你会学到接口的基本用法、可选属性、只读属性、接口继承等核心特性。