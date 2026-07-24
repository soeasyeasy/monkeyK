---
title: '第八章：面向对象基础'
description: '类与对象、封装、构造器'
---

# 第八章：面向对象基础

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

## 本章小结

类是对象的模板，对象是类的实例。构造器用于初始化对象。封装通过访问修饰符隐藏内部实现，只暴露必要的接口。static 修饰的成员属于类，不属于某个对象。接下来我们将学习继承与多态。
