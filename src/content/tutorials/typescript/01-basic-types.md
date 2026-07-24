---
title: "第一章：基础类型"
description: "TypeScript 提供了丰富的基础类型系统，帮助我们在编译时捕获错误。"
---

# 第一章：基础类型

## 运行结果

| 类型 | 值 |
| --- | --- |
| string | Hello, TypeScript! |
| number | 25, 99.9, hex:255, bin:10, oct:484 |
| boolean | true, false |
| null | null |
| undefined | undefined |
| string \| null | Hello |
| void | 函数无返回值 |
| any | false |
| unknown | hello |
| never | 函数抛出异常，永不正常返回 |

## 代码示例

### 1. string 字符串

```typescript
const name: string = 'TypeScript'
const greeting: string = `Hello, ${name}!`
```

### 2. number 数字

```typescript
const age: number = 25
const price: number = 99.9
const hex: number = 0xff       // 十六进制
const binary: number = 0b1010  // 二进制
const octal: number = 0o744    // 八进制
```

### 3. boolean 布尔值

```typescript
const isActive: boolean = true
const isComplete: boolean = false
```

### 4. null 和 undefined

```typescript
const nullValue: null = null
const undefinedValue: undefined = undefined

// 联合类型表示可选值
const maybeName: string | null = 'Hello'
const maybeAge: number | undefined = undefined
```

### 5. void 空值

```typescript
function logMessage(msg: string): void {
  console.log(msg) // 没有返回值
}
```

### 6. any 任意类型

```typescript
let notSure: any = 4
notSure = 'maybe a string'  // OK
notSure = false             // OK
// ⚠️ 尽量避免使用 any，它绕过了类型检查
```

### 7. unknown 未知类型

```typescript
let unknownValue: unknown = 'hello'
// unknownValue.toFixed(2)  // ❌ 报错！不能直接使用

// 需要先进行类型收窄
if (typeof unknownValue === 'string') {
  unknownValue.toUpperCase() // ✅ 收窄后安全使用
}
```

### 8. never 永不返回

```typescript
function throwError(msg: string): never {
  throw new Error(msg) // 永远抛出异常，不会正常返回
}

// never 用于穷尽检查
type Direction = 'up' | 'down' | 'left' | 'right'
function handleDirection(dir: Direction) {
  switch (dir) {
    case 'up': break
    case 'down': break
    case 'left': break
    case 'right': break
    default:
      const _exhaustive: never = dir // 如果遗漏了某个类型，这里会报错
  }
}
```

## any vs unknown 对比

| 特性 | any | unknown |
| --- | --- | --- |
| 赋值任意类型 | ✅ | ✅ |
| 直接调用方法 | ✅（不安全） | ❌（需先收窄） |
| 类型安全 | ❌ | ✅ |
| 推荐程度 | 不推荐 | 推荐 |
