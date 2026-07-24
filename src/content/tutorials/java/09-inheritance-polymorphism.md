---
title: '第九章：继承与多态'
description: 'extends、override、抽象类、interface'
---

# 第九章：继承与多态

## 继承

使用 `extends` 关键字实现继承。Java 只支持单继承。

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
