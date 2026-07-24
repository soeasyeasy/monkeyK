---
title: '第四章：类型别名与联合类型'
description: 'type 关键字可以创建类型别名，联合类型和交叉类型让类型组合更加灵活。'
---

# 第四章：类型别名与联合类型

## 运行结果

- **类型别名 ID**
  - `userId1 = 123`
  - `userId2 = user-abc`
- **联合类型**
  - `value1 = hello`
  - `value2 = 42`
  - `status = active`
- **交叉类型 Person**
  - `person = {"name":"Alice","age":25}`
- **字面量类型**
  - `dir = up`
  - `dice = 3`
  - `align = center`
- **类型守卫 (typeof)**
  - `padLeft('hello', 4) = "    hello"`
  - `padLeft('hello', '>>') = ">>hello"`
- **类型守卫 (in)**
  - `move(fish) = "🐟 游泳中..."`
  - `move(bird) = "🐦 飞翔中..."`
- **可辨识联合**
  - `circle area = 78.54`
  - `rectangle area = 50`
  - `triangle area = 24`

## 代码详解

### 1. 类型别名（type）

```typescript
type ID = number | string
type Username = string
type Callback = (data: string) => void

const userId1: ID = 123
const userId2: ID = 'user-abc'
```

### 2. 联合类型（|）

```typescript
type StringOrNumber = string | number
type Status = 'active' | 'inactive' | 'pending'

const value: StringOrNumber = 'hello' // 或 42
const status: Status = 'active' // 只能是这三个值之一
```

### 3. 交叉类型（&）

```typescript
interface HasName {
  name: string
}
interface HasAge {
  age: number
}
type Person = HasName & HasAge // 同时拥有 name 和 age

const person: Person = { name: 'Alice', age: 25 }
```

### 4. 字面量类型

```typescript
type Direction = 'up' | 'down' | 'left' | 'right'
type DiceValue = 1 | 2 | 3 | 4 | 5 | 6

const dir: Direction = 'up'
const dice: DiceValue = 3
```

### 5. 类型守卫

```typescript
// typeof 守卫
function padLeft(value: string, padding: string | number): string {
  if (typeof padding === 'number') {
    return ' '.repeat(padding) + value
  }
  return padding + value
}

// in 守卫
interface Fish {
  swim(): string
}
interface Bird {
  fly(): string
}

function move(animal: Fish | Bird): string {
  if ('swim' in animal) {
    return animal.swim() // TS 知道这是 Fish
  }
  return animal.fly() // TS 知道这是 Bird
}
```

### 6. 可辨识联合（最强大的模式）

```typescript
interface Circle {
  kind: 'circle'
  radius: number
}
interface Rectangle {
  kind: 'rectangle'
  width: number
  height: number
}
type Shape = Circle | Rectangle

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2
    case 'rectangle':
      return shape.width * shape.height
  }
}
// kind 属性让 TS 自动推断每个分支中的类型！
```
