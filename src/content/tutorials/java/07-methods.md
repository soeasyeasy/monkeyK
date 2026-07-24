---
title: '第七章：方法与参数'
description: '方法定义、重载、可变参数'
---

# 第七章：方法与参数

## 运行结果

| 特性     | 说明                                   |
| -------- | -------------------------------------- |
| 方法签名 | 方法名 + 参数列表（不含返回类型）      |
| 参数传递 | 值传递（基本类型传值，引用类型传地址） |
| 方法重载 | 同名方法，参数列表不同                 |
| 可变参数 | 使用 `...` 语法，可接受任意数量参数    |

## 方法定义

### 基本语法

```java
// 语法：修饰符 返回类型 方法名(参数列表) { 方法体 }

public static int add(int a, int b) {
    return a + b;
}

// 调用
int result = add(3, 5);  // result = 8
System.out.println(result);  // 8
```

### 方法的组成部分

```java
public static int add(int a, int b) {
    // ① public — 访问修饰符
    // ② static — 静态修饰符（可直接通过类名调用）
    // ③ int — 返回类型
    // ④ add — 方法名
    // ⑤ (int a, int b) — 参数列表
    // ⑥ return a + b — 方法体
    return a + b;
}
```

### 无返回值方法

```java
public static void greet(String name) {
    System.out.println("你好，" + name + "！");
}

greet("张三");  // 你好，张三！
// void 方法不需要 return 语句
```

### 无参数方法

```java
public static int getRandomNumber() {
    return (int)(Math.random() * 100);
}

int num = getRandomNumber();
System.out.println(num);  // 随机数 0-99
```

## 方法签名

方法签名由**方法名**和**参数列表**组成，不包含返回类型。

```java
// 以下两个方法签名相同，不能共存
int add(int a, int b)
double add(int a, int b)  // ❌ 编译错误：方法签名重复
```

## 参数传递

Java 中参数传递都是**值传递**（pass by value）。

### 基本类型传递

```java
public static void modify(int x) {
    x = 100;    // 只修改副本，不影响原变量
    System.out.println("方法内 x = " + x);  // 100
}

int num = 5;
modify(num);
System.out.println("方法外 num = " + num);  // 5（未改变）
```

### 引用类型传递

```java
public static void modify(int[] arr) {
    arr[0] = 100;    // 修改的是同一个对象的内容
    System.out.println("方法内 arr[0] = " + arr[0]);  // 100
}

int[] data = {1, 2, 3};
modify(data);
System.out.println("方法外 data[0] = " + data[0]);  // 100（已改变）
```

::: warning 重要概念

- **基本类型**：传递的是值的副本，方法内修改不影响原变量
- **引用类型**：传递的是地址的副本，方法内可以修改对象内容，但不能让原变量指向新对象

```java
public static void reassign(int[] arr) {
    arr = new int[]{10, 20, 30};  // 让 arr 指向新数组
    // 原变量不受影响
}

int[] data = {1, 2, 3};
reassign(data);
System.out.println(data[0]);  // 1（未改变）
```

:::

## 方法重载

同名方法，参数列表不同（类型、个数或顺序不同）。

```java
public static int add(int a, int b) {
    return a + b;
}

public static double add(double a, double b) {
    return a + b;
}

public static int add(int a, int b, int c) {
    return a + b + c;
}

// 调用
System.out.println(add(1, 2));        // 3（int）
System.out.println(add(1.5, 2.5));    // 4.0（double）
System.out.println(add(1, 2, 3));     // 6（三个参数）
```

### 重载规则

```java
// ✅ 参数个数不同
void print(String s)
void print(String s, int times)

// ✅ 参数类型不同
void print(int i)
void print(double d)

// ✅ 参数顺序不同
void print(String s, int i)
void print(int i, String s)

// ❌ 仅返回类型不同（不是重载）
int add(int a, int b)
double add(int a, int b)  // 编译错误
```

## 可变参数

```java
public static int sum(int... numbers) {
    int total = 0;
    for (int num : numbers) {
        total += num;
    }
    return total;
}

System.out.println(sum(1, 2, 3));       // 6
System.out.println(sum(1, 2, 3, 4, 5)); // 15
System.out.println(sum());              // 0（无参数也可以）
```

### 可变参数规则

```java
// ✅ 可变参数必须放在最后
public static void print(String prefix, int... numbers) {
    System.out.println(prefix + ": " + Arrays.toString(numbers));
}

print("数据", 1, 2, 3);  // 数据: [1, 2, 3]

// ❌ 可变参数不能在中间
// public static void print(int... numbers, String prefix)  // 编译错误

// ❌ 一个方法只能有一个可变参数
// public static void print(int... a, String... b)  // 编译错误
```

### 可变参数本质是数组

```java
public static void test(int... nums) {
    // nums 本质上是 int[]
    System.out.println(nums.length);
    System.out.println(nums[0]);
}

test(1, 2, 3);  // 等价于 test(new int[]{1, 2, 3})
```

## 递归

方法调用自身。

```java
public static int factorial(int n) {
    if (n <= 1) {
        return 1;    // 基线条件（终止条件）
    }
    return n * factorial(n - 1);  // 递归调用
}

System.out.println(factorial(5));  // 120（5! = 5×4×3×2×1 = 120）
```

### 递归执行过程

```
factorial(5)
  → 5 * factorial(4)
    → 4 * factorial(3)
      → 3 * factorial(2)
        → 2 * factorial(1)
          → 1（返回）
        → 2 * 1 = 2
      → 3 * 2 = 6
    → 4 * 6 = 24
  → 5 * 24 = 120
```

### 斐波那契数列

```java
public static int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// 0, 1, 1, 2, 3, 5, 8, 13, 21, 34...
System.out.println(fibonacci(10));  // 55
```

::: warning 递归注意事项

1. 必须有**基线条件**（终止条件），否则会无限递归导致 StackOverflowError
2. 递归调用必须向基线条件靠近
3. 递归虽然简洁，但性能不如循环，谨慎使用
   :::

## 方法返回多个值

Java 方法只能返回一个值，可通过数组或对象返回多个值。

```java
public static int[] minMax(int[] arr) {
    int min = arr[0], max = arr[0];
    for (int num : arr) {
        if (num < min) min = num;
        if (num > max) max = num;
    }
    return new int[]{min, max};
}

int[] data = {3, 1, 4, 1, 5, 9};
int[] result = minMax(data);
System.out.println("最小值: " + result[0]);  // 1
System.out.println("最大值: " + result[1]);  // 9
```

## 核心知识点

1. **方法签名**：方法名 + 参数列表，不包含返回类型
2. **值传递**：基本类型传值，引用类型传地址
3. **方法重载**：同名方法，参数列表不同（类型、个数、顺序）
4. **可变参数**：使用 `...` 语法，本质是数组，必须放在参数列表最后
5. **递归**：方法调用自身，必须有终止条件

## 本章小结

方法是组织代码的基本单元。Java 参数传递是值传递。方法重载通过不同参数列表实现多态。可变参数使用 `...` 语法，本质是数组。递归虽然简洁但要注意性能。接下来我们将学习面向对象编程。
