---
title: '第十三章：继承与多态'
description: 'extends、override、抽象类、interface'
---

# 第十三章：继承与多态

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是继承？为什么要让一个类"继承"另一个类？
- Java 为什么只支持单继承？不能多继承吗？
- 多态到底是什么？听起来很抽象，能通俗解释吗？
- 抽象类和接口有什么区别？什么时候用哪个？

这一章就是为了解答这些问题。我们会先搞清楚 **继承和多态的核心思想**，再通过大量实例帮你理解抽象类和接口的使用场景。学完这章，你就能写出高复用、易扩展的面向对象代码了。

---

## 1 为什么需要继承？

### 痛点分析

想象你要开发一个动物园管理系统，需要定义各种动物：

```java
// ❌ 没有继承：每个类都要重复定义相同属性和方法
class Dog {
    String name;
    int age;
    public void eat() { System.out.println(name + "在吃东西"); }
    public void sleep() { System.out.println(name + "在睡觉"); }
    public void bark() { System.out.println(name + "汪汪叫"); }
}

class Cat {
    String name;
    int age;
    public void eat() { System.out.println(name + "在吃东西"); }
    public void sleep() { System.out.println(name + "在睡觉"); }
    public void meow() { System.out.println(name + "喵喵叫"); }
}

class Bird {
    String name;
    int age;
    public void eat() { System.out.println(name + "在吃东西"); }
    public void sleep() { System.out.println(name + "在睡觉"); }
    public void fly() { System.out.println(name + "在飞"); }
}
```

看到问题了吗？`name`、`age`、`eat()`、`sleep()` 这三个类都有，完全重复！如果以后要加 10 种动物，就要重复写 10 遍。

### 解决方案

继承就是**提取公共部分**，让子类自动拥有父类的属性和方法。

```java
// ✅ 有继承：公共部分提取到父类
class Animal {
    String name;
    int age;
    public void eat() { System.out.println(name + "在吃东西"); }
    public void sleep() { System.out.println(name + "在睡觉"); }
}

class Dog extends Animal {
    public void bark() { System.out.println(name + "汪汪叫"); }
}

class Cat extends Animal {
    public void meow() { System.out.println(name + "喵喵叫"); }
}

class Bird extends Animal {
    public void fly() { System.out.println(name + "在飞"); }
}
```

> **一句话总结**：继承让子类自动拥有父类的属性和方法，避免代码重复。

### 生活类比

打个比方：

> 继承就像"遗传"。你从父母那里继承了身高、肤色等特征，不需要重新"定义"自己。子类从父类那里继承属性和方法，不需要重新写一遍。

---

## 2 核心原理

### 继承的本质

继承的本质是**代码复用**和**类型层次**。

| 特性     | 说明                                         |
| -------- | -------------------------------------------- |
| 代码复用 | 子类自动拥有父类的属性和方法                 |
| 类型层次 | 子类是一种特殊的父类（Dog 是一种 Animal）    |
| 扩展性   | 子类可以在父类基础上添加新方法或重写已有方法 |

### Java 的单继承

Java 只支持**单继承**（一个类只能有一个直接父类），不支持多继承。

```java
// ✅ 单继承：合法
class Dog extends Animal { }

// ❌ 多继承：编译错误
// class Dog extends Animal, Pet { }  // Java 不支持
```

**为什么不支持多继承？**

因为多继承会导致"菱形问题"——两个父类有同名方法时，子类不知道该用哪个。

```
     Animal
    /      \
  Pet    GuardDog
    \      /
     SuperDog  ← 该用哪个 eat() 方法？
```

**解决方案**：Java 用**接口**实现多继承的效果（后面会讲）。

---

## 3 继承的用法

### extends 关键字

使用 `extends` 关键字实现继承。

```java
// 父类（基类）
public class Animal {
    String name;
    int age;

    public void eat() {
        System.out.println(name + "在吃东西");
    }
}

// 子类（派生类）
public class Dog extends Animal {
    String breed;  // 子类特有属性

    public void bark() {
        System.out.println(name + "在汪汪叫");
    }
}

// 使用
Dog dog = new Dog();
dog.name = "旺财";    // 继承自 Animal
dog.breed = "金毛";   // 子类特有
dog.eat();           // 继承自 Animal
dog.bark();          // 子类特有
```

### super 关键字

`super` 用于调用父类的构造器或方法。

```java
public class Animal {
    String name;

    public Animal(String name) {
        this.name = name;
    }
}

public class Dog extends Animal {
    String breed;

    public Dog(String name, String breed) {
        super(name);        // 调用父类构造器，必须在第一行
        this.breed = breed;
    }

    @Override
    public void eat() {
        super.eat();        // 调用父类方法
        System.out.println("吃骨头");
    }
}
```

::: warning 重要规则

- `super()` 调用父类构造器时，**必须放在子类构造器的第一行**
- 如果父类没有无参构造器，子类必须显式调用 `super(参数)`

:::

---

## 4 方法重写（Override）

子类可以重新定义父类的方法。

```java
public class Animal {
    public void makeSound() {
        System.out.println("动物发出声音");
    }
}

public class Cat extends Animal {
    @Override
    public void makeSound() {
        System.out.println("喵喵喵");
    }
}

public class Dog extends Animal {
    @Override
    public void makeSound() {
        System.out.println("汪汪汪");
    }
}
```

::: tip @Override 注解

`@Override` 不是必须的，但**强烈建议加上**。它的作用是：

1. 让编译器检查你是否真的在重写父类方法
2. 如果方法签名写错了，编译器会报错

:::

---

## 5 多态

### 什么是多态？

多态就是**同一个方法，不同对象有不同的行为**。

```java
Animal cat = new Cat();
Animal dog = new Dog();

cat.makeSound();  // 喵喵喵
dog.makeSound();  // 汪汪汪
```

虽然变量类型都是 `Animal`，但实际调用的是子类的方法。这就是多态——**运行时动态绑定**。

### 生活类比

打个比方：

> 多态就像"播放音乐"这个动作。你按同一个"播放"按钮，MP3 播放器播放的是音乐，视频播放器播放的是电影，游戏机播放的是游戏。同一个动作，不同设备有不同的行为。

### instanceof 判断

```java
Animal animal = new Cat();

// 判断对象是否是某个类的实例
if (animal instanceof Cat) {
    Cat cat = (Cat) animal;    // 向下转型
    cat.makeSound();
}

// Java 16+ 模式匹配（更简洁）
if (animal instanceof Cat cat) {
    cat.makeSound();    // 自动转型
}
```

---

## 6 抽象类

### 什么是抽象类？

抽象类是**不能实例化的类**，用于定义子类的公共结构。

```java
// 抽象类
public abstract class Shape {
    String color;

    // 抽象方法：没有方法体，子类必须实现
    public abstract double area();

    // 普通方法：子类可以直接使用
    public void display() {
        System.out.println("颜色: " + color + ", 面积: " + area());
    }
}

// 子类必须实现抽象方法
public class Circle extends Shape {
    double radius;

    public Circle(String color, double radius) {
        this.color = color;
        this.radius = radius;
    }

    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}

// 使用
Shape circle = new Circle("红色", 5);
circle.display();
```

### 抽象类 vs 普通类

| 特性     | 抽象类        | 普通类        |
| -------- | ------------- | ------------- |
| 实例化   | ❌ 不能 `new` | ✅ 可以 `new` |
| 抽象方法 | 可以有        | 不能有        |
| 普通方法 | 可以有        | 可以有        |
| 用途     | 定义规范      | 直接使用      |

---

## 7 接口

### 什么是接口？

接口是**纯规范**，只定义方法签名，不包含实现（Java 8+ 可以有默认方法）。

```java
// 定义接口
public interface Flyable {
    void fly();    // 默认是 public abstract

    // Java 8+ 默认方法（可以有实现）
    default void land() {
        System.out.println("降落");
    }
}

public interface Swimmable {
    void swim();
}

// 一个类可以实现多个接口
public class Duck extends Animal implements Flyable, Swimmable {
    @Override
    public void fly() {
        System.out.println("鸭子在飞");
    }

    @Override
    public void swim() {
        System.out.println("鸭子在游泳");
    }
}
```

### 接口 vs 抽象类

| 特性     | 抽象类         | 接口                              |
| -------- | -------------- | --------------------------------- |
| 继承     | 单继承         | 多实现                            |
| 构造器   | 有             | 无                                |
| 成员变量 | 可以有各种类型 | 只能有常量（public static final） |
| 方法     | 可以有具体方法 | Java 8+ 可以有 default 方法       |
| 使用场景 | 有共同特征的类 | 定义行为规范                      |

### 什么时候用哪个？

| 场景               | 推荐          | 原因         |
| ------------------ | ------------- | ------------ |
| 有共同属性和方法   | 抽象类        | 可以复用代码 |
| 定义行为规范       | 接口          | 支持多实现   |
| 既要复用又要多实现 | 抽象类 + 接口 | 组合使用     |

---

## 8 新手常见误区

### 误区 1：子类可以访问父类的 private 成员

**错！** `private` 成员对子类不可见。

```java
class Animal {
    private String name;  // private
}

class Dog extends Animal {
    public void printName() {
        // System.out.println(name);  // ❌ 编译错误：name 是 private
    }
}

// ✅ 正确做法：用 protected 或提供 getter
class Animal {
    protected String name;  // protected：子类可以访问
}
```

### 误区 2：重写方法可以改变返回类型

**错！** 重写方法的签名必须和父类方法一致。

```java
class Animal {
    public String getName() { return "Animal"; }
}

class Dog extends Animal {
    // @Override
    // public int getName() { return 1; }  // ❌ 编译错误：返回类型不同

    @Override
    public String getName() { return "Dog"; }  // ✅ 正确
}
```

### 误区 3：接口可以有构造器

**错！** 接口不能有构造器。

```java
interface Flyable {
    // public Flyable() { }  // ❌ 编译错误：接口不能有构造器
    void fly();
}
```

### 误区 4：抽象类必须包含抽象方法

**不是的。** 抽象类可以没有抽象方法。

```java
// ✅ 合法：抽象类没有抽象方法
public abstract class BaseClass {
    public void doSomething() {
        System.out.println("普通方法");
    }
}
```

### 误区 5：多态就是方法重载

**错！** 多态和方法重载是两回事。

| 特性     | 多态                                   | 方法重载                                 |
| -------- | -------------------------------------- | ---------------------------------------- |
| 发生时机 | 运行时                                 | 编译时                                   |
| 实现方式 | 继承 + 重写                            | 同名方法，不同参数                       |
| 示例     | `Animal a = new Dog(); a.makeSound();` | `add(int, int)` 和 `add(double, double)` |

---

## 9 动手练习

### 练习 1：基础练习 —— 图形面积计算

定义一个抽象类 `Shape`，包含抽象方法 `area()`。创建 `Circle` 和 `Rectangle` 两个子类，分别实现面积计算。

<details>
<summary>点击查看答案</summary>

```java
// 抽象类
abstract class Shape {
    String color;

    public Shape(String color) {
        this.color = color;
    }

    public abstract double area();

    public void display() {
        System.out.println(color + "图形，面积: " + area());
    }
}

// 圆形
class Circle extends Shape {
    double radius;

    public Circle(String color, double radius) {
        super(color);
        this.radius = radius;
    }

    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}

// 矩形
class Rectangle extends Shape {
    double width, height;

    public Rectangle(String color, double width, double height) {
        super(color);
        this.width = width;
        this.height = height;
    }

    @Override
    public double area() {
        return width * height;
    }
}

// 使用
public class Main {
    public static void main(String[] args) {
        Shape circle = new Circle("红色", 5);
        Shape rectangle = new Rectangle("蓝色", 4, 6);

        circle.display();      // 红色图形，面积: 78.54
        rectangle.display();   // 蓝色图形，面积: 24.0
    }
}
```

</details>

### 练习 2：进阶练习 —— 员工管理系统

定义一个 `Employee` 类，包含 `name` 和 `salary`。创建 `Manager` 和 `Developer` 两个子类，分别重写 `getBonus()` 方法。

<details>
<summary>点击查看答案</summary>

```java
// 父类
class Employee {
    String name;
    double salary;

    public Employee(String name, double salary) {
        this.name = name;
        this.salary = salary;
    }

    public double getBonus() {
        return 0;
    }

    public void display() {
        System.out.println(name + "，工资: " + salary + "，奖金: " + getBonus());
    }
}

// 经理
class Manager extends Employee {
    int teamSize;

    public Manager(String name, double salary, int teamSize) {
        super(name, salary);
        this.teamSize = teamSize;
    }

    @Override
    public double getBonus() {
        return salary * 0.3;  // 经理奖金是工资的 30%
    }
}

// 开发者
class Developer extends Employee {
    String language;

    public Developer(String name, double salary, String language) {
        super(name, salary);
        this.language = language;
    }

    @Override
    public double getBonus() {
        return salary * 0.1;  // 开发者奖金是工资的 10%
    }
}

// 使用
public class Main {
    public static void main(String[] args) {
        Employee manager = new Manager("张三", 20000, 5);
        Employee developer = new Developer("李四", 15000, "Java");

        manager.display();    // 张三，工资: 20000，奖金: 6000
        developer.display();  // 李四，工资: 15000，奖金: 1500
    }
}
```

</details>

### 练习 3（挑战）：综合练习 —— 支付系统

定义一个 `Payment` 接口，包含 `pay(double amount)` 方法。实现 `Alipay`、`WechatPay`、`CreditCard` 三个类，分别实现不同的支付逻辑。

<details>
<summary>点击查看答案</summary>

```java
// 支付接口
interface Payment {
    void pay(double amount);
}

// 支付宝
class Alipay implements Payment {
    private String account;

    public Alipay(String account) {
        this.account = account;
    }

    @Override
    public void pay(double amount) {
        System.out.println("使用支付宝支付 " + amount + " 元，账号: " + account);
    }
}

// 微信支付
class WechatPay implements Payment {
    private String openid;

    public WechatPay(String openid) {
        this.openid = openid;
    }

    @Override
    public void pay(double amount) {
        System.out.println("使用微信支付 " + amount + " 元，OpenID: " + openid);
    }
}

// 信用卡
class CreditCard implements Payment {
    private String cardNumber;

    public CreditCard(String cardNumber) {
        this.cardNumber = cardNumber;
    }

    @Override
    public void pay(double amount) {
        System.out.println("使用信用卡支付 " + amount + " 元，卡号: ****" + cardNumber.substring(cardNumber.length() - 4));
    }
}

// 使用
public class Main {
    public static void main(String[] args) {
        Payment alipay = new Alipay("user@example.com");
        Payment wechat = new WechatPay("wx_123456");
        Payment card = new CreditCard("1234567890123456");

        alipay.pay(100);    // 使用支付宝支付 100 元
        wechat.pay(200);    // 使用微信支付 200 元
        card.pay(300);      // 使用信用卡支付 300 元
    }
}
```

</details>

---

## 10 核心知识点

| 知识点   | 说明                                                           |
| -------- | -------------------------------------------------------------- |
| 继承     | 使用 `extends` 实现代码复用，Java 只支持单继承                 |
| super    | 调用父类构造器（必须第一行）或父类方法                         |
| 方法重写 | 使用 `@Override` 注解，子类重新定义父类方法                    |
| 多态     | 父类引用指向子类对象，运行时动态绑定                           |
| 抽象类   | 使用 `abstract` 修饰，包含抽象方法和具体方法                   |
| 接口     | 使用 `interface` 定义，支持多实现，Java 8+ 可以有 default 方法 |

---

## 下一章预告

下一章我们会学习 **异常处理**——Java 的错误处理机制。你会学到 try-catch-finally、自定义异常、checked 与 unchecked 异常的区别。这些是编写健壮代码的必备技能。

```java
public class Animal {
    String name;
    int age;

    public void eat() {
        System.out.println(name + "在吃东西");
    }
}

public class Dog extends Animal {
    String breed;

    public void bark() {
        System.out.println(name + "在汪汪叫");
    }
}

Dog dog = new Dog();
dog.name = "旺财";    // 继承自 Animal
dog.breed = "金毛";
dog.eat();           // 继承自 Animal
dog.bark();
```

### super 关键字

```java
public class Animal {
    String name;

    public Animal(String name) {
        this.name = name;
    }
}

public class Dog extends Animal {
    String breed;

    public Dog(String name, String breed) {
        super(name);        // 调用父类构造器，必须在第一行
        this.breed = breed;
    }

    @Override
    public void eat() {
        super.eat();        // 调用父类方法
        System.out.println("吃骨头");
    }
}
```

## 方法重写（Override）

```java
public class Animal {
    public void makeSound() {
        System.out.println("动物发出声音");
    }
}

public class Cat extends Animal {
    @Override
    public void makeSound() {
        System.out.println("喵喵喵");
    }
}

public class Dog extends Animal {
    @Override
    public void makeSound() {
        System.out.println("汪汪汪");
    }
}
```

## 多态

```java
Animal cat = new Cat();
Animal dog = new Dog();

cat.makeSound();  // 喵喵喵
dog.makeSound();  // 汪汪汪
```

### instanceof 判断

```java
Animal animal = new Cat();

if (animal instanceof Cat) {
    Cat cat = (Cat) animal;    // 向下转型
    cat.makeSound();
}

// Java 16+ 模式匹配
if (animal instanceof Cat cat) {
    cat.makeSound();    // 自动转型
}
```

## 抽象类

```java
public abstract class Shape {
    String color;

    public abstract double area();    // 抽象方法，无方法体

    public void display() {
        System.out.println("颜色: " + color + ", 面积: " + area());
    }
}

public class Circle extends Shape {
    double radius;

    public Circle(String color, double radius) {
        this.color = color;
        this.radius = radius;
    }

    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}

Shape circle = new Circle("红色", 5);
circle.display();
```

## 接口

```java
public interface Flyable {
    void fly();    // 默认是 public abstract

    // Java 8+ 默认方法
    default void land() {
        System.out.println("降落");
    }
}

public interface Swimmable {
    void swim();
}

// 一个类可以实现多个接口
public class Duck extends Animal implements Flyable, Swimmable {
    @Override
    public void fly() {
        System.out.println("鸭子在飞");
    }

    @Override
    public void swim() {
        System.out.println("鸭子在游泳");
    }
}
```

## 抽象类 vs 接口

| 特性     | 抽象类         | 接口                              |
| -------- | -------------- | --------------------------------- |
| 继承     | 单继承         | 多实现                            |
| 构造器   | 有             | 无                                |
| 成员变量 | 可以有各种类型 | 只能有常量（public static final） |
| 方法     | 可以有具体方法 | Java 8+ 可以有 default 方法       |
| 使用场景 | 有共同特征的类 | 定义行为规范                      |

## 核心知识点

1. **继承**：使用 `extends` 实现代码复用，Java 只支持单继承
2. **super**：调用父类构造器（必须第一行）或父类方法
3. **方法重写**：使用 `@Override` 注解，子类重新定义父类方法
4. **多态**：父类引用指向子类对象，运行时动态绑定
5. **抽象类**：使用 `abstract` 修饰，包含抽象方法和具体方法
6. **接口**：使用 `interface` 定义，支持多实现，Java 8+ 可以有 default 方法

## 本章小结

继承实现代码复用，多态让同一方法有不同行为。抽象类和接口用于定义规范，接口支持多实现。接下来我们将学习异常处理。
