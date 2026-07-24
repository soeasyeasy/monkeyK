---
title: "第六章：类与面向对象"
description: "TypeScript 增强了 JavaScript 的 class，提供了访问修饰符、抽象类、接口实现等面向对象特性。"
---

# 第六章：类与面向对象

## 运行结果

- **基本类**
  - `我是张三，今年25岁`
- **访问修饰符**
  - `工商银行 | 余额: ¥13000 | 账号: ****7890`
  - `工商银行余额: ¥13000`
- **继承 + protected**
  - `建设银行余额(含利息): ¥51500.00`
- **抽象类**
  - `圆形的面积是78.54`
  - `正方形的面积是16.00`
- **静态成员**
  - `MathUtils.PI = 3.14159265358979`
  - `MathUtils.add(3, 5) = 8`
  - `MathUtils.clamp(150, 0, 100) = 100`
- **接口实现**
  - `[打印] TypeScript 教程`
  - `serialize: {"content":"TypeScript 教程"}`

## 代码详解

### 1. 基本类

```typescript
class Person {
  name: string
  age: number

  constructor(name: string, age: number) {
    this.name = name
    this.age = age
  }

  introduce(): string {
    return `我是${this.name}，今年${this.age}岁`
  }
}
```

### 2. 访问修饰符

```typescript
class BankAccount {
  public readonly bankName: string    // 公开只读
  protected balance: number           // 受保护（子类可访问）
  private _accountNo: string          // 私有（仅本类可访问）

  constructor(bankName: string, balance: number, accountNo: string) {
    this.bankName = bankName
    this.balance = balance
    this._accountNo = accountNo
  }

  public deposit(amount: number): void {
    this.balance += amount
  }

  public get accountInfo(): string {
    return `${this.bankName} | 余额: ¥${this.balance}`
  }
}

// account.bankName     // ✅ public
// account.balance      // ❌ protected
// account._accountNo   // ❌ private
```

### 3. 继承

```typescript
class SavingsAccount extends BankAccount {
  private interestRate: number

  constructor(bankName: string, balance: number,
              accountNo: string, rate: number) {
    super(bankName, balance, accountNo)
    this.interestRate = rate
  }

  public addInterest(): void {
    // 子类可以访问 protected 的 balance
    const interest = this.getBalance() * this.interestRate
    this.deposit(interest)
  }
}
```

### 4. 抽象类

```typescript
abstract class Shape {
  abstract getName(): string     // 抽象方法，必须被子类实现
  abstract getArea(): number

  describe(): string {           // 普通方法
    return `${this.getName()}的面积是${this.getArea().toFixed(2)}`
  }
}

class Circle extends Shape {
  private radius: number
  constructor(radius: number) {
    super()
    this.radius = radius
  }
  getName(): string { return '圆形' }
  getArea(): number { return Math.PI * this.radius ** 2 }
}
```

### 5. 静态成员

```typescript
class MathUtils {
  static PI = 3.14159265358979

  static add(a: number, b: number): number {
    return a + b
  }

  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
  }
}

// 直接通过类名调用，不需要实例化
MathUtils.PI           // 3.14159...
MathUtils.add(3, 5)    // 8
MathUtils.clamp(150, 0, 100)  // 100
```

### 6. 接口实现（implements）

```typescript
interface Printable {
  print(): string
}

interface Serializable {
  serialize(): string
}

class Document implements Printable, Serializable {
  private content: string

  constructor(content: string) {
    this.content = content
  }

  print(): string {
    return `[打印] ${this.content}`
  }

  serialize(): string {
    return JSON.stringify({ content: this.content })
  }
}
```

## 访问修饰符总结

| 修饰符 | 本类 | 子类 | 外部 |
| --- | --- | --- | --- |
| public | ✅ | ✅ | ✅ |
| protected | ✅ | ✅ | ❌ |
| private | ✅ | ❌ | ❌ |
| readonly | 只读 | 只读 | 只读 |
