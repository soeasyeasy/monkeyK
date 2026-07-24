---
title: "第三章：对象与接口"
description: "接口（interface）是 TypeScript 中定义对象形状的核心工具，支持可选属性、只读属性、继承等特性。"
---

# 第三章：对象与接口

## 运行结果

- **基本接口**
  ```json
  {
    "name": "Alice",
    "age": 25,
    "email": "alice@example.com"
  }
  ```
- **可选属性 (config1)**
  ```json
  {
    "host": "localhost",
    "port": 3000
  }
  ```
- **可选属性 (config2)**
  ```json
  {
    "host": "production.com",
    "port": 8080,
    "timeout": 5000,
    "debug": true
  }
  ```
- **只读属性** — `Point { x: 10, y: 20 }`
- **接口继承 (Dog)**
  ```json
  {
    "name": "Buddy",
    "sound": "Woof!",
    "breed": "Golden Retriever",
    "isTrained": true
  }
  ```
- **多继承 (PetDog)**
  ```json
  {
    "name": "Max",
    "sound": "Bark!",
    "breed": "Labrador",
    "isTrained": false,
    "owner": "Bob",
    "chipId": "CHIP-001"
  }
  ```
- **索引签名**
  ```json
  {
    "hello": "你好",
    "world": "世界",
    "typescript": "类型安全"
  }
  ```
- **函数接口** — `add(3,5)=8, subtract(10,4)=6`

## 代码详解

### 1. 基本接口

```typescript
interface User {
  name: string
  age: number
  email: string
}

const user: User = {
  name: 'Alice',
  age: 25,
  email: 'alice@example.com'
}
```

### 2. 可选属性（? 修饰）

```typescript
interface Config {
  host: string
  port: number
  timeout?: number   // 可选
  debug?: boolean    // 可选
}

const config: Config = { host: 'localhost', port: 3000 }
// timeout 和 debug 可以省略
```

### 3. 只读属性（readonly）

```typescript
interface Point {
  readonly x: number
  readonly y: number
}

const point: Point = { x: 10, y: 20 }
// point.x = 30  // ❌ 编译错误！
```

### 4. 接口继承（extends）

```typescript
interface Animal {
  name: string
  sound: string
}

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

### 5. 索引签名

```typescript
interface Dictionary {
  [key: string]: string  // 任意字符串键，值为 string
}

const dict: Dictionary = {
  hello: '你好',
  world: '世界',
}
```

### 6. 接口描述函数

```typescript
interface MathFunc {
  (a: number, b: number): number
}

const add: MathFunc = (a, b) => a + b
const subtract: MathFunc = (a, b) => a - b
```

## interface vs type 对比

| 特性 | interface | type |
| --- | --- | --- |
| 扩展方式 | extends | &（交叉类型） |
| 同名合并 | ✅ 自动合并 | ❌ 报错 |
| 描述对象 | ✅ 推荐 | ✅ |
| 联合/基本类型 | ❌ | ✅ |
| 计算属性 | ❌ | ✅ |
