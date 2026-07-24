---
title: '第八章：枚举'
description: '枚举（enum）用于定义命名常量，让代码更具可读性和可维护性。'
---

# 第八章：枚举

## 运行结果

- **数字枚举**
  - `Direction.Up = 0`
  - `Direction.Down = 1`
  - `Direction.Left = 2`
  - `Direction.Right = 3`
  - `反向映射: Direction[0] = "Up"`
- **自定义数字枚举**
  - `StatusCode.Success = 200`
  - `StatusCode.NotFound = 404`
  - `StatusCode.ServerError = 500`
- **字符串枚举**
  - `Theme.Light = "light"`
  - `Theme.Dark = "dark"`
  - `HttpMethod.GET = "GET"`
- **枚举联合 + 可辨识**
  - `getStatusText(200) = "请求成功"`
  - `getStatusText(404) = "资源未找到"`
  - `getStatusText(500) = "服务器错误"`
- **日志系统**
  - `[DEBUG] 变量初始化完成`
  - `[INFO] 服务器启动在 3000 端口`
  - `[WARN] 内存使用率超过 80%`
  - `[ERROR] 数据库连接失败`

## 代码详解

### 1. 数字枚举

```typescript
// 默认从 0 开始递增
enum Direction {
  Up, // 0
  Down, // 1
  Left, // 2
  Right, // 3
}

// 自定义起始值
enum StatusCode {
  Success = 200,
  NotFound = 404,
  ServerError = 500,
}

Direction.Up // 0
StatusCode.Success // 200
```

### 2. 字符串枚举

```typescript
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
Theme.Light // 'light'
```

### 3. 常量枚举（const enum）

```typescript
// 编译时完全内联，不会产生额外的对象
const enum Season {
  Spring = '春',
  Summer = '夏',
  Autumn = '秋',
  Winter = '冬',
}

// 编译后直接使用 '春'，没有 Season 对象
// 性能更好，但无反向映射
```

### 4. 反向映射（仅数字枚举）

```typescript
enum Direction {
  Up,
  Down,
  Left,
  Right,
}

Direction[0] // 'Up' （反向映射）
Direction['Up'] // 0

// 字符串枚举没有反向映射！
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
  const prefix = LogLevel[level] // 反向映射获取名称
  return `[${prefix}] ${message}`
}

createLogMessage(LogLevel.INFO, '服务器启动')
// "[INFO] 服务器启动"
```

## 枚举 vs 联合类型

| 特性       | enum           | 联合类型 (type) |
| ---------- | -------------- | --------------- |
| 运行时存在 | ✅ 生成对象    | ❌ 仅编译时     |
| 反向映射   | ✅（数字枚举） | ❌              |
| 代码体积   | 较大           | 零开销          |
| 遍历       | ✅             | ❌              |
| 推荐场景   | 需要运行时值   | 纯类型约束      |

::: tip
💡 现代 TypeScript 推荐：优先使用 `as const` + 联合类型替代 enum，减少运行时开销。
:::
