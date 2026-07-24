---
title: "第六章：类与面向对象"
description: "TypeScript 增强了 JavaScript 的 class，提供了访问修饰符、抽象类、接口实现等面向对象特性。"
---

# 第六章：类与面向对象

## 本章导读

在学这一章之前，你可能会有这些疑问：

- TypeScript 的类和 JavaScript 的类有什么区别？
- public、private、protected 有什么区别？
- 什么是抽象类？什么时候用？
- 接口和类是什么关系？

这一章就是为了解答这些问题。我们会先搞清楚 **类的核心概念**，再动手实践。

---

## 6.1 为什么需要类？

### 痛点分析

在 JavaScript 中，用函数创建对象不够结构化：

```javascript
// JavaScript - 用构造函数创建对象
function Person(name, age) {
  this.name = name
  this.age = age
}
Person.prototype.introduce = function() {
  return `我是${this.name}，今年${this.age}岁`
}

const person = new Person('张三', 25)
```

想象一下：你用一张纸记录每个人的信息，每个人都要单独写一遍——这就是 JavaScript 的问题。

### 解决方案

TypeScript 的类提供了结构化的对象创建方式：

```typescript
// TypeScript - 使用类创建对象
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

const person = new Person('张三', 25)
```

> **一句话总结**：类就像一个模具，用它可以批量生产相同结构的对象。

---

## 6.2 核心原理

### 类的三大特性

1. **封装**：将数据和方法封装在一起，控制访问权限
2. **继承**：子类继承父类的属性和方法
3. **多态**：不同对象可以用相同的接口调用不同的实现

打个比方：

> 类就像一个汽车工厂，封装了汽车的制造过程（属性和方法）。
> 继承就像不同品牌的汽车都基于同一个基础车型。
> 多态就像不同品牌的汽车都有"驾驶"方法，但实现方式不同。

### 访问修饰符对比

| 修饰符 | 本类 | 子类 | 外部 |
| --- | --- | --- | --- |
| public | ✅ | ✅ | ✅ |
| protected | ✅ | ✅ | ❌ |
| private | ✅ | ❌ | ❌ |
| readonly | 只读 | 只读 | 只读 |

---

## 6.3 类详解

### 1. 基本类

```typescript
class Person {
  // 属性声明
  name: string
  age: number

  // 构造函数：初始化对象
  constructor(name: string, age: number) {
    this.name = name
    this.age = age
  }

  // 方法
  introduce(): string {
    return `我是${this.name}，今年${this.age}岁`
  }
}

// 创建实例
const person = new Person('张三', 25)
console.log(person.introduce())  // "我是张三，今年25岁"
```

### 2. 访问修饰符

```typescript
class BankAccount {
  // public：公开，任何地方都能访问
  public readonly bankName: string
  
  // protected：受保护，本类和子类可以访问
  protected balance: number
  
  // private：私有，只有本类可以访问
  private _accountNo: string

  constructor(bankName: string, balance: number, accountNo: string) {
    this.bankName = bankName
    this.balance = balance
    this._accountNo = accountNo
  }

  // public 方法
  public deposit(amount: number): void {
    this.balance += amount
  }

  // getter：获取私有属性
  public get accountInfo(): string {
    return `${this.bankName} | 余额: ¥${this.balance}`
  }
}

const account = new BankAccount('工商银行', 13000, '1234567890')
account.bankName     // ✅ public，外部可访问
// account.balance      // ❌ protected，外部不可访问
// account._accountNo   // ❌ private，外部不可访问
```

### 3. 继承

```typescript
// 子类继承父类
class SavingsAccount extends BankAccount {
  private interestRate: number

  constructor(bankName: string, balance: number,
              accountNo: string, rate: number) {
    // 调用父类构造函数
    super(bankName, balance, accountNo)
    this.interestRate = rate
  }

  // 子类可以访问 protected 的 balance
  public addInterest(): void {
    const interest = this.balance * this.interestRate
    this.deposit(interest)
  }
}

const savings = new SavingsAccount('建设银行', 50000, '0987654321', 0.03)
savings.addInterest()  // 余额变成 51500
```

### 4. 抽象类

```typescript
// 抽象类：不能直接实例化，只能被继承
abstract class Shape {
  // 抽象方法：只有声明，没有实现，必须被子类实现
  abstract getName(): string
  abstract getArea(): number

  // 普通方法：可以有实现
  describe(): string {
    return `${this.getName()}的面积是${this.getArea().toFixed(2)}`
  }
}

// 圆形类
class Circle extends Shape {
  private radius: number
  
  constructor(radius: number) {
    super()
    this.radius = radius
  }
  
  getName(): string { return '圆形' }
  getArea(): number { return Math.PI * this.radius ** 2 }
}

// 正方形类
class Square extends Shape {
  private side: number
  
  constructor(side: number) {
    super()
    this.side = side
  }
  
  getName(): string { return '正方形' }
  getArea(): number { return this.side ** 2 }
}

const circle = new Circle(5)
console.log(circle.describe())  // "圆形的面积是78.54"
```

### 5. 静态成员

```typescript
// 静态成员：属于类本身，不属于实例
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
// 定义接口
interface Printable {
  print(): string
}

interface Serializable {
  serialize(): string
}

// 类实现接口，必须实现所有方法
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

const doc = new Document('TypeScript 教程')
console.log(doc.print())      // "[打印] TypeScript 教程"
console.log(doc.serialize())  // '{"content":"TypeScript 教程"}'
```

---

## 6.4 访问修饰符总结

| 修饰符 | 本类 | 子类 | 外部 | 说明 |
| --- | --- | --- | --- | --- |
| public | ✅ | ✅ | ✅ | 默认修饰符，公开访问 |
| protected | ✅ | ✅ | ❌ | 受保护，子类可访问 |
| private | ✅ | ❌ | ❌ | 私有，仅本类可访问 |
| readonly | ✅ | ✅ | ✅ | 只读，不可修改 |

---

## 6.5 新手常见误区

### 误区 1："类的所有属性都必须在构造函数中初始化"

**不完全对！** 属性可以有默认值，或者使用参数属性语法。

```typescript
// ✅ 属性有默认值
class Person {
  name: string = 'Unknown'
  age: number = 0
}

// ✅ 参数属性语法：直接在构造函数参数上声明属性
class Person2 {
  constructor(
    public name: string,
    public age: number = 0
  ) {}
}
```

### 误区 2："private 在运行时也会生效"

**错！** private 只是编译时检查，运行时没有限制。

```typescript
class User {
  private password: string = '123456'
}

const user = new User()
// user.password  // ❌ 编译错误

// ⚠️ 但在运行时可以访问（不推荐）
// (user as any).password  // "123456"
```

### 误区 3："抽象类可以实例化"

**错！** 抽象类不能直接实例化，只能被继承。

```typescript
abstract class Shape {
  abstract getArea(): number
}

// ❌ 错误做法
// const shape = new Shape()  // 编译错误！

// ✅ 正确做法：继承抽象类
class Circle extends Shape {
  getArea(): number { return 3.14 }
}
const circle = new Circle()
```

### 误区 4："接口实现可以只实现部分方法"

**错！** 类实现接口必须实现所有方法。

```typescript
interface Flyable {
  fly(): void
  land(): void
}

// ❌ 错误做法：只实现了 fly
// class Bird implements Flyable {
//   fly(): void {}
// }

// ✅ 正确做法：实现所有方法
class Bird implements Flyable {
  fly(): void { console.log('飞翔') }
  land(): void { console.log('降落') }
}
```

---

## 6.6 动手练习

### 练习 1：基础练习

定义一个 `Car` 类，包含品牌、型号、颜色等属性和方法。

<details>
<summary>点击查看答案</summary>

```typescript
class Car {
  brand: string
  model: string
  color: string
  speed: number = 0

  constructor(brand: string, model: string, color: string) {
    this.brand = brand
    this.model = model
    this.color = color
  }

  accelerate(amount: number): void {
    this.speed += amount
  }

  brake(amount: number): void {
    this.speed = Math.max(0, this.speed - amount)
  }

  getInfo(): string {
    return `${this.color}的${this.brand}${this.model}，当前速度: ${this.speed}km/h`
  }
}

const car = new Car('Tesla', 'Model 3', '红色')
car.accelerate(50)
console.log(car.getInfo())  // "红色的TeslaModel 3，当前速度: 50km/h"
car.brake(20)
console.log(car.getInfo())  // "红色的TeslaModel 3，当前速度: 30km/h"
```

</details>

### 练习 2：进阶练习

实现一个员工管理系统，包含普通员工和经理。

<details>
<summary>点击查看答案</summary>

```typescript
// 基础员工类
class Employee {
  protected name: string
  protected salary: number

  constructor(name: string, salary: number) {
    this.name = name
    this.salary = salary
  }

  getAnnualSalary(): number {
    return this.salary * 12
  }

  getInfo(): string {
    return `${this.name}，月薪: ¥${this.salary}`
  }
}

// 经理类（继承员工）
class Manager extends Employee {
  private bonus: number

  constructor(name: string, salary: number, bonus: number) {
    super(name, salary)
    this.bonus = bonus
  }

  // 重写父类方法
  getAnnualSalary(): number {
    return super.getAnnualSalary() + this.bonus
  }

  getInfo(): string {
    return `[经理] ${this.name}，月薪: ¥${this.salary}，年终奖: ¥${this.bonus}`
  }
}

// 创建员工
const employee = new Employee('张三', 8000)
const manager = new Manager('李四', 15000, 50000)

console.log(employee.getInfo())  // "张三，月薪: ¥8000"
console.log(employee.getAnnualSalary())  // 96000

console.log(manager.getInfo())  // "[经理] 李四，月薪: ¥15000，年终奖: ¥50000"
console.log(manager.getAnnualSalary())  // 230000
```

</details>

### 练习 3（挑战）：综合练习

实现一个图形计算器，支持多种图形类型。

<details>
<summary>点击查看答案</summary>

```typescript
// 抽象图形类
abstract class Shape {
  abstract getName(): string
  abstract getArea(): number
  abstract getPerimeter(): number
}

// 圆形
class Circle extends Shape {
  constructor(private radius: number) { super() }
  
  getName(): string { return '圆形' }
  getArea(): number { return Math.PI * this.radius ** 2 }
  getPerimeter(): number { return 2 * Math.PI * this.radius }
}

// 矩形
class Rectangle extends Shape {
  constructor(private width: number, private height: number) { super() }
  
  getName(): string { return '矩形' }
  getArea(): number { return this.width * this.height }
  getPerimeter(): number { return 2 * (this.width + this.height) }
}

// 三角形
class Triangle extends Shape {
  constructor(
    private a: number,
    private b: number,
    private c: number
  ) { super() }
  
  getName(): string { return '三角形' }
  getArea(): number {
    const s = (this.a + this.b + this.c) / 2
    return Math.sqrt(s * (s - this.a) * (s - this.b) * (s - this.c))
  }
  getPerimeter(): number { return this.a + this.b + this.c }
}

// 计算器
class ShapeCalculator {
  static calculateAll(shapes: Shape[]): void {
    shapes.forEach(shape => {
      console.log(`${shape.getName()}:`)
      console.log(`  面积: ${shape.getArea().toFixed(2)}`)
      console.log(`  周长: ${shape.getPerimeter().toFixed(2)}`)
      console.log('---')
    })
  }
}

// 使用
const shapes: Shape[] = [
  new Circle(5),
  new Rectangle(4, 5),
  new Triangle(3, 4, 5)
]

ShapeCalculator.calculateAll(shapes)
// 圆形:
//   面积: 78.54
//   周长: 31.42
// ---
// 矩形:
//   面积: 20.00
//   周长: 18.00
// ---
// 三角形:
//   面积: 6.00
//   周长: 12.00
```

</details>

---

## 下一章预告

下一章我们会学习 **泛型**——也就是如何编写可复用的类型安全代码。你会学到泛型函数、泛型接口、泛型类、泛型约束等核心特性。