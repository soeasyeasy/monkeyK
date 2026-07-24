---
title: '第八章：面向对象基础'
description: '类与对象、封装、构造器'
---

# 第八章：面向对象基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是面向对象？和面向过程有什么区别？
- 为什么要用类？直接写代码不行吗？
- `private` 和 `public` 有什么用？为什么要隐藏数据？
- `static` 到底是什么？为什么有时候要用它？

这一章就是为了解答这些问题。我们会先搞清楚 **面向对象的核心思想**，再通过大量实例帮你理解类、对象、封装的概念。学完这章，你就能用面向对象的思维方式写代码了。

---

## 8.1 为什么需要面向对象？

### 痛点分析

想象你要管理一个图书馆的图书信息。用面向过程的方式，你会定义一堆变量：书名、作者、ISBN、库存数量...如果有 1000 本书，就要定义 4000 个变量！而且每本书的操作（借书、还书）都要写一堆函数，代码混乱不堪。

**生活类比**：面向对象就像现实世界。现实中有各种"对象"——人、车、手机。每个对象都有自己的属性（颜色、大小）和行为（跑、打电话）。面向对象编程就是模拟现实世界，把数据和操作数据的方法打包在一起。

### 代码对比

```java
// ❌ 面向过程：数据和操作分离
String book1Title = "Java编程思想";
String book1Author = "Bruce Eckel";
int book1Stock = 5;

String book2Title = "Head First Java";
String book2Author = "Kathy Sierra";
int book2Stock = 3;

// 借书操作要写很多参数
public static void borrowBook(String title, int[] stock) {
    if (stock[0] > 0) {
        stock[0]--;
        System.out.println("借出：" + title);
    }
}

// ✅ 面向对象：数据和操作封装在一起
public class Book {
    String title;
    String author;
    int stock;

    public void borrow() {
        if (stock > 0) {
            stock--;
            System.out.println("借出：" + title);
        }
    }
}

Book book1 = new Book();
book1.title = "Java编程思想";
book1.author = "Bruce Eckel";
book1.stock = 5;
book1.borrow();  // 直接调用，简单清晰
```

> **一句话总结**：面向对象让代码更贴近现实世界，更易理解和维护。

---

## 8.2 核心原理

### 概念解释

面向对象的核心是**封装**——把数据（属性）和操作数据的方法（行为）打包在一起。你可以把它想象成：

- **手机**：外观（属性：颜色、品牌）+ 功能（行为：打电话、拍照）
- **汽车**：外观（属性：颜色、型号）+ 功能（行为：启动、加速、刹车）
- **银行账户**：信息（属性：户主、余额）+ 操作（行为：存款、取款）

打个比方：

> 类就像模具，对象就像用模具做出来的产品。类定义了一类事物共有的属性和行为，对象是具体的实例。就像"人"是一个类，"张三"是一个对象。

### 对比分析

| 概念       | 面向过程     | 面向对象          |
| ---------- | ------------ | ----------------- |
| 核心思想   | 以函数为中心 | 以对象为中心      |
| 数据与操作 | 分离         | 封装在一起        |
| 代码复用   | 通过函数     | 通过类和继承      |
| 适用场景   | 简单脚本     | 大型项目          |
| 典型语言   | C、Pascal    | Java、C++、Python |

---

## 运行结果

| 概念   | 说明                       |
| ------ | -------------------------- |
| 类     | 对象的模板，定义属性和方法 |
| 对象   | 类的实例，具有状态和行为   |
| 封装   | 隐藏内部实现，暴露公共接口 |
| 构造器 | 初始化对象，与类名相同     |

## 类与对象

### 定义类

```java
public class Person {
    // 属性（字段）
    String name;
    int age;

    // 方法
    public void introduce() {
        System.out.println("我叫" + name + "，今年" + age + "岁");
    }
}
```

### 创建对象

```java
// 创建对象
Person p = new Person();
p.name = "张三";
p.age = 25;
p.introduce();  // 我叫张三，今年25岁
```

### 多个对象

```java
Person p1 = new Person();
p1.name = "张三";
p1.age = 25;

Person p2 = new Person();
p2.name = "李四";
p2.age = 30;

p1.introduce();  // 我叫张三，今年25岁
p2.introduce();  // 我叫李四，今年30岁
```

## 构造器

构造器用于初始化对象，与类名相同，没有返回类型。

### 无参构造器

```java
public class Person {
    String name;
    int age;

    // 无参构造器
    public Person() {
        name = "未知";
        age = 0;
    }
}

Person p = new Person();
System.out.println(p.name);  // 未知
```

### 有参构造器

```java
public class Person {
    String name;
    int age;

    // 有参构造器
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public void introduce() {
        System.out.println("我叫" + name + "，今年" + age + "岁");
    }
}

Person p = new Person("李四", 30);
p.introduce();  // 我叫李四，今年30岁
```

### 构造器重载

```java
public class Person {
    String name;
    int age;

    // 无参构造器
    public Person() {
        this("未知", 0);  // 调用另一个构造器
    }

    // 有参构造器
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // 只有名字的构造器
    public Person(String name) {
        this(name, 0);  // 调用两个参数的构造器
    }
}

Person p1 = new Person();              // 调用无参构造器
Person p2 = new Person("张三", 25);    // 调用两个参数构造器
Person p3 = new Person("李四");        // 调用一个参数构造器
```

::: warning 构造器注意事项

1. 构造器名必须与类名相同
2. 构造器没有返回类型（连 void 都没有）
3. 如果未定义任何构造器，编译器会自动添加无参构造器
4. 一旦定义了有参构造器，编译器不再自动添加无参构造器
   :::

## this 关键字

`this` 指向当前对象。

### 区分成员变量和局部变量

```java
public class Person {
    String name;

    public Person(String name) {
        this.name = name;    // this.name 指成员变量，name 指参数
    }

    public void printName() {
        System.out.println(this.name);
    }
}
```

### 调用其他构造器

```java
public class Person {
    String name;
    int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public Person(String name) {
        this(name, 0);  // 调用两个参数的构造器，必须是第一行
    }
}
```

::: warning
`this()` 调用其他构造器时，必须放在构造器的第一行。
:::

## 封装

封装是面向对象的三大特性之一（封装、继承、多态）。

### 访问修饰符

| 修饰符    | 同类 | 同包 | 子类 | 不同包 |
| --------- | ---- | ---- | ---- | ------ |
| private   | ✅   | ❌   | ❌   | ❌     |
| default   | ✅   | ✅   | ❌   | ❌     |
| protected | ✅   | ✅   | ✅   | ❌     |
| public    | ✅   | ✅   | ✅   | ✅     |

### 封装示例

```java
public class BankAccount {
    private String owner;
    private double balance;

    public BankAccount(String owner, double balance) {
        this.owner = owner;
        this.balance = balance;
    }

    // getter
    public String getOwner() {
        return owner;
    }

    public double getBalance() {
        return balance;
    }

    // setter（可选，根据需要决定是否提供）
    // public void setBalance(double balance) {
    //     this.balance = balance;  // ❌ 不安全，不应该直接设置余额
    // }

    // 存款
    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
            System.out.println("存入 " + amount + "，余额 " + balance);
        } else {
            System.out.println("存款金额必须大于 0");
        }
    }

    // 取款
    public void withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
            System.out.println("取出 " + amount + "，余额 " + balance);
        } else {
            System.out.println("余额不足或取款金额无效");
        }
    }
}

BankAccount account = new BankAccount("张三", 1000);
account.deposit(500);     // 存入 500，余额 1500
account.withdraw(200);    // 取出 200，余额 1300
// account.balance = 0;   // ❌ 编译错误：private 不能直接访问
```

### Getter 和 Setter

```java
public class Student {
    private String name;
    private int age;

    // Getter
    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }

    // Setter
    public void setName(String name) {
        this.name = name;
    }

    public void setAge(int age) {
        if (age > 0 && age < 150) {  // 可以添加验证逻辑
            this.age = age;
        } else {
            System.out.println("年龄无效");
        }
    }
}

Student s = new Student();
s.setName("张三");
s.setAge(20);
System.out.println(s.getName() + ", " + s.getAge());  // 张三, 20
```

## static 关键字

`static` 修饰的成员属于类，不属于某个对象。

### 静态变量

```java
public class Counter {
    private static int count = 0;    // 静态变量，所有对象共享

    public Counter() {
        count++;
    }

    public static int getCount() {
        return count;
    }
}

new Counter();
new Counter();
new Counter();
System.out.println(Counter.getCount());  // 3
```

### 静态方法

```java
public class MathUtils {
    // 静态方法可以直接通过类名调用
    public static int max(int a, int b) {
        return (a > b) ? a : b;
    }

    public static int min(int a, int b) {
        return (a < b) ? a : b;
    }
}

int m1 = MathUtils.max(10, 20);  // 20
int m2 = MathUtils.min(10, 20);  // 10
```

### 静态代码块

```java
public class Config {
    private static Properties props;

    // 静态代码块，类加载时执行一次
    static {
        props = new Properties();
        try {
            props.load(new FileInputStream("config.properties"));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static String getValue(String key) {
        return props.getProperty(key);
    }
}
```

::: warning 静态方法限制

1. 静态方法只能访问静态成员（变量和方法）
2. 静态方法不能使用 `this` 和 `super`
3. 静态方法不能被重写（可以隐藏）

```java
public class Test {
    int instanceVar = 10;
    static int staticVar = 20;

    public static void staticMethod() {
        // System.out.println(instanceVar);  // ❌ 不能访问实例变量
        System.out.println(staticVar);       // ✅ 可以访问静态变量
    }
}
```

:::

## 核心知识点

1. **类与对象**：类是模板，对象是实例
2. **构造器**：初始化对象，与类名相同，无返回类型
3. **this**：指向当前对象，可调用其他构造器（必须第一行）
4. **封装**：使用 private 隐藏实现，提供 public 接口
5. **static**：静态成员属于类，所有对象共享

---

## 新手常见误区

### 误区 1："所有属性都应该用 public"

**错！** 这违反了封装原则。应该尽量用 `private` 隐藏属性，通过 `public` 的 getter/setter 方法访问。

```java
// ❌ 错误：属性全部 public
public class Person {
    public String name;
    public int age;
}

Person p = new Person();
p.age = -5;  // 可以设置无效值！

// ✅ 正确：属性 private，提供 getter/setter
public class Person {
    private String name;
    private int age;

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        if (age > 0 && age < 150) {  // 添加验证
            this.age = age;
        } else {
            System.out.println("年龄无效");
        }
    }
}

Person p = new Person();
p.setAge(-5);  // 输出"年龄无效"，不会设置
```

### 误区 2："构造器可以有返回类型"

**错！** 构造器没有返回类型，连 `void` 都没有。如果有返回类型，那就不是构造器，而是普通方法。

```java
// ❌ 错误：构造器有返回类型
public class Person {
    public void Person() {  // 这是普通方法，不是构造器！
        System.out.println("构造器");
    }
}

// ✅ 正确：构造器没有返回类型
public class Person {
    public Person() {  // 这才是构造器
        System.out.println("构造器");
    }
}
```

### 误区 3："静态方法可以访问实例变量"

**错！** 静态方法属于类，不属于某个对象，所以不能访问实例变量（非静态变量）。

```java
public class Test {
    int instanceVar = 10;  // 实例变量
    static int staticVar = 20;  // 静态变量

    // ❌ 错误：静态方法访问实例变量
    public static void staticMethod() {
        System.out.println(instanceVar);  // 编译错误！
    }

    // ✅ 正确：静态方法只能访问静态变量
    public static void staticMethod2() {
        System.out.println(staticVar);  // 可以访问
    }

    // ✅ 正确：实例方法可以访问所有变量
    public void instanceMethod() {
        System.out.println(instanceVar);  // 可以访问
        System.out.println(staticVar);  // 也可以访问
    }
}
```

### 误区 4："this() 可以放在构造器任意位置"

**错！** `this()` 调用其他构造器时，必须放在构造器的第一行。

```java
public class Person {
    String name;
    int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // ❌ 错误：this() 不是第一行
    public Person(String name) {
        System.out.println("初始化");  // 这行在前面
        this(name, 0);  // 编译错误！
    }

    // ✅ 正确：this() 必须是第一行
    public Person(String name) {
        this(name, 0);  // 必须是第一行
        System.out.println("初始化");  // 可以放在后面
    }
}
```

### 误区 5："定义了有参构造器，还有默认无参构造器"

**错！** 一旦定义了有参构造器，编译器不再自动添加无参构造器。

```java
public class Person {
    String name;
    int age;

    // 只定义了有参构造器
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

// ❌ 错误：调用不存在的无参构造器
Person p = new Person();  // 编译错误！

// ✅ 正确：需要无参构造器时，必须显式定义
public class Person {
    String name;
    int age;

    // 显式定义无参构造器
    public Person() {
        this("未知", 0);
    }

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

Person p = new Person();  // 现在可以了
```

---

## 动手练习

### 练习 1：基础练习 - 定义一个简单的类

定义一个 `Student` 类，包含以下属性和方法：

- 属性：姓名（name）、年龄（age）、学号（studentId）
- 方法：显示学生信息（displayInfo）

要求：

- 使用封装（属性 private，提供 getter/setter）
- 定义构造器初始化对象
- 创建对象并调用方法

<details>
<summary>点击查看答案</summary>

```java
public class Student {
    // 私有属性
    private String name;
    private int age;
    private String studentId;

    // 构造器
    public Student(String name, int age, String studentId) {
        this.name = name;
        this.age = age;
        this.studentId = studentId;
    }

    // Getter 和 Setter
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        if (age > 0 && age < 150) {
            this.age = age;
        } else {
            System.out.println("年龄无效");
        }
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    // 显示学生信息
    public void displayInfo() {
        System.out.println("姓名：" + name + "，年龄：" + age + "，学号：" + studentId);
    }

    public static void main(String[] args) {
        // 创建学生对象
        Student s1 = new Student("张三", 20, "2023001");
        Student s2 = new Student("李四", 21, "2023002");

        // 显示信息
        s1.displayInfo();  // 姓名：张三，年龄：20，学号：2023001
        s2.displayInfo();  // 姓名：李四，年龄：21，学号：2023002

        // 修改属性
        s1.setAge(21);
        s1.displayInfo();  // 姓名：张三，年龄：21，学号：2023001
    }
}
```

</details>

### 练习 2：进阶练习 - 银行账户类

定义一个 `BankAccount` 类，实现银行账户功能：

- 属性：账户名（owner）、余额（balance）
- 方法：存款（deposit）、取款（withdraw）、查询余额（getBalance）

要求：

- 余额必须用 private 隐藏
- 存款和取款要添加验证逻辑
- 取款时检查余额是否充足

<details>
<summary>点击查看答案</summary>

```java
public class BankAccount {
    // 私有属性
    private String owner;
    private double balance;

    // 构造器
    public BankAccount(String owner, double initialBalance) {
        this.owner = owner;
        if (initialBalance >= 0) {
            this.balance = initialBalance;
        } else {
            this.balance = 0;
            System.out.println("初始余额不能为负数，已设置为 0");
        }
    }

    // 存款
    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
            System.out.println("存入 " + amount + " 元，当前余额 " + balance + " 元");
        } else {
            System.out.println("存款金额必须大于 0");
        }
    }

    // 取款
    public void withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
            System.out.println("取出 " + amount + " 元，当前余额 " + balance + " 元");
        } else if (amount > balance) {
            System.out.println("余额不足，当前余额 " + balance + " 元");
        } else {
            System.out.println("取款金额必须大于 0");
        }
    }

    // 查询余额
    public double getBalance() {
        return balance;
    }

    // 获取账户名
    public String getOwner() {
        return owner;
    }

    public static void main(String[] args) {
        // 创建账户
        BankAccount account = new BankAccount("张三", 1000);

        // 存款
        account.deposit(500);  // 存入 500 元，当前余额 1500 元

        // 取款
        account.withdraw(200);  // 取出 200 元，当前余额 1300 元

        // 余额不足
        account.withdraw(2000);  // 余额不足，当前余额 1300 元

        // 查询余额
        System.out.println("当前余额：" + account.getBalance() + " 元");  // 1300
    }
}
```

</details>

### 练习 3（挑战）：综合练习 - 计数器类

定义一个 `Counter` 类，实现计数器功能：

- 使用静态变量记录创建的对象数量
- 每个对象有自己的计数值
- 提供增加、减少、重置、获取当前值的方法

要求：

- 静态变量记录对象总数
- 实例变量记录每个对象的计数
- 提供静态方法获取对象总数

<details>
<summary>点击查看答案</summary>

```java
public class Counter {
    // 静态变量：记录创建的对象总数
    private static int totalCount = 0;

    // 实例变量：每个对象自己的计数值
    private int count;

    // 构造器
    public Counter() {
        this.count = 0;
        totalCount++;  // 每创建一个对象，总数加 1
        System.out.println("创建第 " + totalCount + " 个计数器");
    }

    // 增加计数
    public void increment() {
        count++;
    }

    // 减少计数
    public void decrement() {
        if (count > 0) {
            count--;
        } else {
            System.out.println("计数已经为 0，不能减少");
        }
    }

    // 重置计数
    public void reset() {
        count = 0;
    }

    // 获取当前计数
    public int getCount() {
        return count;
    }

    // 静态方法：获取对象总数
    public static int getTotalCount() {
        return totalCount;
    }

    public static void main(String[] args) {
        // 创建计数器对象
        Counter c1 = new Counter();  // 创建第 1 个计数器
        Counter c2 = new Counter();  // 创建第 2 个计数器
        Counter c3 = new Counter();  // 创建第 3 个计数器

        // 操作计数器
        c1.increment();
        c1.increment();
        c1.increment();
        System.out.println("c1 的计数：" + c1.getCount());  // 3

        c2.increment();
        c2.increment();
        System.out.println("c2 的计数：" + c2.getCount());  // 2

        c3.increment();
        c3.increment();
        c3.increment();
        c3.increment();
        System.out.println("c3 的计数：" + c3.getCount());  // 4

        // 减少计数
        c1.decrement();
        System.out.println("c1 减少后：" + c1.getCount());  // 2

        // 重置计数
        c2.reset();
        System.out.println("c2 重置后：" + c2.getCount());  // 0

        // 获取对象总数
        System.out.println("总共创建了 " + Counter.getTotalCount() + " 个计数器");  // 3
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **继承与多态** ——面向对象的另外两个重要特性。你会学到：

- 什么是继承？如何让子类复用父类的代码？
- 什么是方法重写？子类如何覆盖父类的方法？
- 什么是多态？同一个方法为什么能有不同的行为？
- `super` 关键字怎么用？
- 什么是抽象类和接口？

继承和多态是面向对象的核心概念，掌握它们能让你的代码更灵活、更易扩展。准备好了吗？让我们继续深入面向对象的世界！

---

## 本章小结

类是对象的模板，对象是类的实例。构造器用于初始化对象。封装通过访问修饰符隐藏内部实现，只暴露必要的接口。static 修饰的成员属于类，不属于某个对象。接下来我们将学习继承与多态。
