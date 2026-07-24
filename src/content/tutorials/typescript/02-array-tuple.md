---
title: "第二章：数组与元组"
description: "TypeScript 为数组提供了更精确的类型定义，元组则允许我们表达固定长度和类型的数组。"
---

# 第二章：数组与元组

## 数组类型

- **number[]** — 数字数组 — `[1,2,3,4,5]`
- **string[]** — 字符串数组 — `["apple","banana","cherry"]`
- **Array<boolean>** — 泛型写法 — `[true,false,true]`
- **readonly number[]** — 只读数组 — `[1,2,3]`

```typescript
// 方式一：类型 + 方括号
const numbers: number[] = [1, 2, 3, 4, 5]
const fruits: string[] = ['apple', 'banana', 'cherry']

// 方式二：Array<类型> 泛型写法
const booleans: Array<boolean> = [true, false, true]

// 只读数组（不可修改）
const readonlyNums: readonly number[] = [1, 2, 3]
// readonlyNums.push(4) // ❌ 报错！
```

## 元组类型

- **[string, number]** — 基本元组 — `["age",25]`
- **[number, number, number]** — RGB 颜色 — `[255,128,0]`
- **[string, number?]** — 可选元素元组 — `["hello"]`
- **命名元组** — 带标签的元组 — `["Alice",30,true]`

```typescript
// 基本元组：固定长度和类型
const pair: [string, number] = ['age', 25]
const rgb: [number, number, number] = [255, 128, 0]

// 可选元组元素
const optionalTuple: [string, number?] = ['hello']

// 带标签的元组（更可读）
const namedTuple: [name: string, age: number, active: boolean]
  = ['Alice', 30, true]

// 只读元组
const readonlyTuple: readonly [string, number] = ['fixed', 100]
```

## 数组方法的类型

- **map (×2)** — `[2,4,6,8,10]`
- **filter (偶数)** — `[2,4]`
- **reduce (求和)** — `15`

```typescript
const nums = [1, 2, 3, 4, 5]

// map：类型明确的回调
const doubled: number[] = nums.map((n: number): number => n * 2)

// filter
const evens: number[] = nums.filter((n: number): boolean => n % 2 === 0)

// reduce
const sum: number = nums.reduce(
  (acc: number, n: number): number => acc + n, 0
)
```
