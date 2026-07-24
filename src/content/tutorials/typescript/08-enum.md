---
title: '第八章：枚举'
description: '枚举（enum）用于定义命名常量，让代码更具可读性和可维护性。'
---

# 第八章：枚举

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是枚举？为什么需要枚举？
- 数字枚举和字符串枚举有什么区别？
- 什么是常量枚举？什么时候用？
- 枚举和联合类型哪个更好？

这一章就是为了解答这些问题。我们会先搞清楚 **枚举的核心概念**，再动手实践。

---

## 8.1 为什么需要枚举？

### 痛点分析

在没有枚举时，我们用魔法数字或字符串表示状态：

```typescript
// ❌ 魔法数字：不知道 0、1、2、3 代表什么
const DIRECTION_UP = 0
const DIRECTION_DOWN = 1
const DIRECTION_LEFT = 2
const DIRECTION_RIGHT = 3

// ❌ 字符串常量：容易拼错
const STATUS_ACTIVE = 'active'
const STATUS_INACTIVE = 'inactive'
const STATUS_PENDING = 'pending'
```

想象一下：你在代码里看到数字 404，不知道它代表什么——这就是魔法数字的问题。

### 解决方案

枚举给常量起了有意义的名字：

```typescript
// ✅ 枚举：一目了然
enum Direction {
  Up = 0,
  Down = 1,
  Left = 2,
  Right = 3,
}

enum Status {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
}
```

> **一句话总结**：枚举就像给常量贴标签，让代码更容易理解。

---

## 8.2 核心原理

### 枚举的工作原理

枚举在编译时会生成一个对象，包含正向映射和反向映射（数字枚举）：

```typescript
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right, // 3
}

// 编译后生成的对象
// {
//   0: 'Up', 1: 'Down', 2: 'Left', 3: 'Right',
//   Up: 0, Down: 1, Left: 2, Right: 3
// }
```

打个比方：

> 枚举就像一本字典，你可以通过名字查编号（正向映射），也可以通过编号查名字（反向映射）。

---

## 8.3 枚举详解

### 1. 数字枚举

```typescript
// 默认从 0 开始递增
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right, // 3
}

// 自定义起始值
enum StatusCode {
  Success = 200,
  NotFound = 404,
  ServerError = 500,
}

// 使用枚举
Direction.Up           // 0
StatusCode.Success     // 200
```

### 2. 字符串枚举

```typescript
// 字符串枚举必须手动赋值
enum Theme {
  Light = 'light',
  Dark = 'dark',
  System = 'system',
}

enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

// 字符串枚举更直观，调试时输出有意义的值
Theme.Light  // 'light'
HttpMethod.GET  // 'GET'
```

### 3. 常量枚举（const enum）

```typescript
// 常量枚举：编译时完全内联，不会产生额外的对象
const enum Season {
  Spring = '春',
  Summer = '夏',
  Autumn = '秋',
  Winter = '冬',
}

// 编译后直接使用 '春'，没有 Season 对象
// 性能更好，但无反向映射
const currentSeason = Season.Spring  // 编译后: '春'
```

### 4. 反向映射（仅数字枚举）

```typescript
enum Direction {
  Up,
  Down,
  Left,
  Right,
}

// 正向映射：名字 -> 值
Direction.Up   // 0

// 反向映射：值 -> 名字
Direction[0]  // 'Up'

// 字符串枚举没有反向映射！
enum Theme {
  Light = 'light',
}
// Theme['light']  // ❌ 不存在
```

### 5. 枚举实际应用：日志系统

```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

function createLogMessage(level: LogLevel, message: string): string {
  // 反向映射获取名称
  const prefix = LogLevel[level]
  return `[${prefix}] ${message}`
}

createLogMessage(LogLevel.INFO, '服务器启动')
// "[INFO] 服务器启动"

createLogMessage(LogLevel.ERROR, '数据库连接失败')
// "[ERROR] 数据库连接失败"
```

---

## 8.4 枚举 vs 联合类型

| 特性 | enum | 联合类型 (type) |
| --- | --- | --- |
| 运行时存在 | ✅ 生成对象 | ❌ 仅编译时 |
| 反向映射 | ✅（数字枚举） | ❌ |
| 代码体积 | 较大 | 零开销 |
| 遍历 | ✅ | ❌ |
| 推荐场景 | 需要运行时值 | 纯类型约束 |

> **现代 TypeScript 推荐**：优先使用 `as const` + 联合类型替代 enum，减少运行时开销。

```typescript
// ✅ 推荐：使用联合类型
const Direction = {
  Up: 0,
  Down: 1,
  Left: 2,
  Right: 3,
} as const

type Direction = typeof Direction[keyof typeof Direction]
// 0 | 1 | 2 | 3
```

---

## 8.5 新手常见误区

### 误区 1："字符串枚举可以反向映射"

**错！** 只有数字枚举才有反向映射。

```typescript
enum Theme {
  Light = 'light',
  Dark = 'dark',
}

// ❌ 错误做法
// Theme['light']  // undefined

// ✅ 正确做法
Theme.Light  // 'light'
```

### 误区 2："枚举可以动态添加值"

**错！** 枚举在编译时确定，不能运行时动态修改。

```typescript
enum Direction {
  Up,
  Down,
}

// ❌ 错误做法
// Direction.Left = 2  // 编译错误！

// ✅ 正确做法：修改枚举定义
enum Direction {
  Up,
  Down,
  Left,
  Right,
}
```

### 误区 3："常量枚举可以使用反向映射"

**错！** 常量枚举编译时被内联，没有反向映射。

```typescript
const enum Direction {
  Up,
  Down,
}

// ✅ 正向映射可以用
Direction.Up  // 0

// ❌ 反向映射不可用
// Direction[0]  // 编译错误！
```

### 误区 4："枚举值只能是整数"

**错！** 数字枚举可以是任意数字。

```typescript
enum Size {
  Small = 10.5,
  Medium = 20.5,
  Large = 30.5,
}

Size.Small  // 10.5

// 也可以是负数
enum Temperature {
  Cold = -10,
  Warm = 20,
  Hot = 30,
}
```

---

## 8.6 动手练习

### 练习 1：基础练习

定义一个枚举表示一周的天数。

<details>
<summary>点击查看答案</summary>

```typescript
// 数字枚举：一周的天数
enum Weekday {
  Monday = 1,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
  Sunday,
}

// 获取枚举值
console.log(Weekday.Monday)    // 1
console.log(Weekday.Friday)     // 5
console.log(Weekday.Sunday)     // 7

// 反向映射
console.log(Weekday[1])         // "Monday"
console.log(Weekday[7])         // "Sunday"

// 判断今天是工作日还是周末
function isWeekend(day: Weekday): boolean {
  return day === Weekday.Saturday || day === Weekday.Sunday
}

console.log(isWeekend(Weekday.Monday))  // false
console.log(isWeekend(Weekday.Saturday))  // true
```

</details>

### 练习 2：进阶练习

实现一个状态机，使用枚举表示状态。

<details>
<summary>点击查看答案</summary>

```typescript
// 订单状态枚举
enum OrderStatus {
  Created = 'created',
  Paid = 'paid',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
}

// 状态转换规则
type StatusTransition = {
  from: OrderStatus
  to: OrderStatus
}

const validTransitions: StatusTransition[] = [
  { from: OrderStatus.Created, to: OrderStatus.Paid },
  { from: OrderStatus.Paid, to: OrderStatus.Shipped },
  { from: OrderStatus.Shipped, to: OrderStatus.Delivered },
  { from: OrderStatus.Created, to: OrderStatus.Cancelled },
  { from: OrderStatus.Paid, to: OrderStatus.Cancelled },
]

// 状态机类
class OrderStateMachine {
  private currentStatus: OrderStatus

  constructor(initialStatus: OrderStatus = OrderStatus.Created) {
    this.currentStatus = initialStatus
  }

  get status(): OrderStatus {
    return this.currentStatus
  }

  transitionTo(newStatus: OrderStatus): boolean {
    const isValid = validTransitions.some(
      t => t.from === this.currentStatus && t.to === newStatus
    )
    if (isValid) {
      this.currentStatus = newStatus
      return true
    }
    return false
  }
}

// 使用
const order = new OrderStateMachine()
console.log(order.status)  // "created"

order.transitionTo(OrderStatus.Paid)     // true
console.log(order.status)  // "paid"

order.transitionTo(OrderStatus.Shipped)  // true
console.log(order.status)  // "shipped"

order.transitionTo(OrderStatus.Delivered)  // true
console.log(order.status)  // "delivered"

order.transitionTo(OrderStatus.Cancelled)  // false（已发货不能取消）
```

</details>

### 练习 3（挑战）：综合练习

实现一个权限系统，使用枚举定义权限级别。

<details>
<summary>点击查看答案</summary>

```typescript
// 权限级别枚举
enum PermissionLevel {
  None = 0,
  Read = 1,
  Write = 2,
  Delete = 4,
  Admin = 8,
}

// 用户角色枚举
enum UserRole {
  Guest = PermissionLevel.Read,
  Editor = PermissionLevel.Read | PermissionLevel.Write,
  Moderator = PermissionLevel.Read | PermissionLevel.Write | PermissionLevel.Delete,
  Administrator = PermissionLevel.Admin,
}

// 检查权限
function hasPermission(role: UserRole, permission: PermissionLevel): boolean {
  return (role & permission) !== 0
}

// 用户类
class User {
  constructor(public name: string, public role: UserRole) {}

  canRead(): boolean {
    return hasPermission(this.role, PermissionLevel.Read)
  }

  canWrite(): boolean {
    return hasPermission(this.role, PermissionLevel.Write)
  }

  canDelete(): boolean {
    return hasPermission(this.role, PermissionLevel.Delete)
  }

  isAdmin(): boolean {
    return hasPermission(this.role, PermissionLevel.Admin)
  }
}

// 创建用户
const guest = new User('访客', UserRole.Guest)
const editor = new User('编辑', UserRole.Editor)
const moderator = new User('版主', UserRole.Moderator)
const admin = new User('管理员', UserRole.Administrator)

console.log(guest.canRead())      // true
console.log(guest.canWrite())     // false

console.log(editor.canRead())     // true
console.log(editor.canWrite())    // true
console.log(editor.canDelete())   // false

console.log(moderator.canRead())  // true
console.log(moderator.canWrite()) // true
console.log(moderator.canDelete()) // true

console.log(admin.isAdmin())      // true
```

</details>

---

## 下一章预告

下一章我们会学习 **类型断言与类型收窄**——也就是如何告诉编译器变量的具体类型。你会学到类型断言、非空断言、typeof 守卫、instanceof 守卫、in 守卫和自定义类型守卫等核心特性。