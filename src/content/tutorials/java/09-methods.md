---
title: '第九章：方法与参数'
description: '方法定义、重载、可变参数'
---

# 第九章：方法与参数

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么要用方法？直接把代码写在 main 方法里不行吗？
- 方法重载到底有什么用？为什么要定义多个同名方法？
- 什么是"值传递"？为什么说 Java 只有值传递？
- 可变参数 `...` 是什么意思？怎么用？

这一章就是为了解答这些问题。我们会先搞清楚 **方法的作用和使用场景**，再通过大量实例帮你掌握方法的定义和调用。学完这章，你就能写出模块化、可复用的代码了。

---

## 1 为什么需要方法？

### 痛点分析

想象你要做 10 道菜，每道菜都需要"切菜→炒菜→装盘"。你会怎么做？每次都重新写一遍流程？当然不会，你会把这个流程定义成一个"做菜方法"，需要时直接调用。

**生活类比**：方法就像菜谱。你不需要每次做菜都重新想步骤，只要按照菜谱（方法）操作就行。而且菜谱可以重复使用（复用），不同人用同一份菜谱做出来的菜味道一致（一致性）。

### 代码对比

```java
// ❌ 没有方法：重复代码
public static void main(String[] args) {
    // 计算第一个圆的面积
    double r1 = 5;
    double area1 = 3.14 * r1 * r1;
    System.out.println("面积：" + area1);

    // 计算第二个圆的面积（重复代码）
    double r2 = 10;
    double area2 = 3.14 * r2 * r2;
    System.out.println("面积：" + area2);
}

// ✅ 有方法：代码复用
public static double calculateArea(double radius) {
    return 3.14 * radius * radius;
}

public static void main(String[] args) {
    double area1 = calculateArea(5);
    System.out.println("面积：" + area1);

    double area2 = calculateArea(10);
    System.out.println("面积：" + area2);
}
```

> **一句话总结**：方法让代码更模块化、可复用、易维护。

---

## 2 核心原理

### 概念解释

方法的本质是**代码封装**。你可以把它想象成：

- **自动售货机**：投入硬币（参数），按下按钮（调用方法），得到饮料（返回值）
- **工厂流水线**：原材料进去（参数），加工处理（方法体），产品出来（返回值）
- **函数计算器**：输入数字（参数），执行计算（方法体），输出结果（返回值）

打个比方：

> 方法就像厨房的菜谱。菜谱名是方法名，食材是参数，做菜步骤是方法体，做好的菜是返回值。你不需要知道具体怎么做（封装），只要按菜谱操作就能得到结果（抽象）。

### 对比分析

| 特性            | 无返回值方法 (void) | 有返回值方法               |
| --------------- | ------------------- | -------------------------- |
| 返回类型        | void                | 具体类型（int、String 等） |
| 是否需要 return | 可以省略            | 必须有 return              |
| 使用场景        | 执行操作、打印输出  | 计算结果、获取数据         |
| 示例            | `printHello()`      | `int add(int a, int b)`    |

---

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

---

## 新手常见误区

### 误区 1："方法重载可以只看返回类型"

**错！** 方法重载只看参数列表（参数类型、个数、顺序），不看返回类型。

```java
// ❌ 错误：仅返回类型不同，不是重载
public static int add(int a, int b) {
    return a + b;
}

public static double add(int a, int b) {  // 编译错误！
    return a + b;
}

// ✅ 正确：参数列表不同才是重载
public static int add(int a, int b) {
    return a + b;
}

public static double add(double a, double b) {  // ✅ 参数类型不同
    return a + b;
}

public static int add(int a, int b, int c) {  // ✅ 参数个数不同
    return a + b + c;
}
```

### 误区 2："引用类型传递可以改变原变量的指向"

**错！** 引用类型传递的是地址的副本，可以修改对象内容，但不能让原变量指向新对象。

```java
public static void reassign(int[] arr) {
    arr = new int[]{10, 20, 30};  // 让 arr 指向新数组
}

int[] data = {1, 2, 3};
reassign(data);
System.out.println(data[0]);  // 1（未改变！）

// ✅ 可以修改对象内容
public static void modify(int[] arr) {
    arr[0] = 100;  // 修改的是同一个对象的内容
}

int[] data2 = {1, 2, 3};
modify(data2);
System.out.println(data2[0]);  // 100（已改变）
```

### 误区 3："可变参数可以放在参数列表任意位置"

**错！** 可变参数必须放在参数列表最后，且一个方法只能有一个可变参数。

```java
// ❌ 错误：可变参数在中间
public static void print(int... numbers, String prefix) {  // 编译错误！
}

// ❌ 错误：多个可变参数
public static void print(int... a, String... b) {  // 编译错误！
}

// ✅ 正确：可变参数在最后
public static void print(String prefix, int... numbers) {
    System.out.println(prefix + ": " + Arrays.toString(numbers));
}

print("数据", 1, 2, 3);  // 数据: [1, 2, 3]
```

### 误区 4："递归不会有问题"

**错！** 递归必须有终止条件，否则会无限递归导致栈溢出。而且递归性能不如循环。

```java
// ❌ 错误：没有终止条件
public static int factorial(int n) {
    return n * factorial(n - 1);  // 无限递归，StackOverflowError
}

// ✅ 正确：有终止条件
public static int factorial(int n) {
    if (n <= 1) {
        return 1;  // 基线条件（终止条件）
    }
    return n * factorial(n - 1);
}

// ✅ 性能更好：用循环代替递归
public static int factorialLoop(int n) {
    int result = 1;
    for (int i = 1; i <= n; i++) {
        result *= i;
    }
    return result;
}
```

### 误区 5："方法参数可以影响基本类型变量"

**错！** 基本类型传递的是值的副本，方法内修改不影响原变量。

```java
public static void modify(int x) {
    x = 100;  // 只修改副本
}

int num = 5;
modify(num);
System.out.println(num);  // 5（未改变）

// ✅ 需要修改原变量，用引用类型或返回值
public static int[] modifyArray(int[] arr) {
    arr[0] = 100;  // 可以修改数组内容
    return arr;
}
```

---

## 动手练习

### 练习 1：基础练习 - 计算阶乘

编写一个方法，计算给定数字的阶乘。

要求：

- 定义方法 `public static int factorial(int n)`
- 使用循环实现（不用递归）
- 测试 5! = 120

<details>
<summary>点击查看答案</summary>

```java
public class FactorialCalculator {
    // 计算阶乘的方法
    public static int factorial(int n) {
        // 初始化结果为 1
        int result = 1;

        // 循环累乘 1 到 n
        for (int i = 1; i <= n; i++) {
            result *= i;  // 等价于 result = result * i
        }

        // 返回结果
        return result;
    }

    public static void main(String[] args) {
        // 测试 5!
        int result = factorial(5);
        System.out.println("5! = " + result);  // 120

        // 测试其他值
        System.out.println("3! = " + factorial(3));  // 6
        System.out.println("10! = " + factorial(10));  // 3628800
    }
}
```

**测试用例**：

- 输入 5，输出 120
- 输入 3，输出 6
- 输入 10，输出 3628800

</details>

### 练习 2：进阶练习 - 方法重载实现加法

编写多个同名方法 `add`，实现不同类型数据的加法。

要求：

- 实现两个整数相加
- 实现两个浮点数相加
- 实现三个整数相加
- 测试不同调用

<details>
<summary>点击查看答案</summary>

```java
public class AddOverload {
    // 两个整数相加
    public static int add(int a, int b) {
        return a + b;
    }

    // 两个浮点数相加
    public static double add(double a, double b) {
        return a + b;
    }

    // 三个整数相加
    public static int add(int a, int b, int c) {
        return a + b + c;
    }

    public static void main(String[] args) {
        // 测试两个整数相加
        System.out.println("add(3, 5) = " + add(3, 5));  // 8

        // 测试两个浮点数相加
        System.out.println("add(1.5, 2.5) = " + add(1.5, 2.5));  // 4.0

        // 测试三个整数相加
        System.out.println("add(1, 2, 3) = " + add(1, 2, 3));  // 6
    }
}
```

**测试用例**：

- `add(3, 5)` 输出 8
- `add(1.5, 2.5)` 输出 4.0
- `add(1, 2, 3)` 输出 6

</details>

### 练习 3（挑战）：综合练习 - 可变参数求平均值

编写一个方法，使用可变参数计算任意数量数字的平均值。

要求：

- 定义方法 `public static double average(double... numbers)`
- 处理无参数的情况（返回 0）
- 测试不同数量的参数

<details>
<summary>点击查看答案</summary>

```java
public class AverageCalculator {
    // 计算平均值的方法
    public static double average(double... numbers) {
        // 处理无参数的情况
        if (numbers.length == 0) {
            return 0;
        }

        // 累加所有数字
        double sum = 0;
        for (double num : numbers) {
            sum += num;
        }

        // 计算平均值
        return sum / numbers.length;
    }

    public static void main(String[] args) {
        // 测试不同数量的参数
        System.out.println("average(10, 20, 30) = " + average(10, 20, 30));  // 20.0
        System.out.println("average(1, 2, 3, 4, 5) = " + average(1, 2, 3, 4, 5));  // 3.0
        System.out.println("average(100) = " + average(100));  // 100.0
        System.out.println("average() = " + average());  // 0.0
    }
}
```

**测试用例**：

- `average(10, 20, 30)` 输出 20.0
- `average(1, 2, 3, 4, 5)` 输出 3.0
- `average(100)` 输出 100.0
- `average()` 输出 0.0

</details>

---

## 下一章预告

下一章我们会学习 **日期时间 API**——Java 8+ 的日期时间处理。你会学到 LocalDate、LocalTime、LocalDateTime 的使用、DateTimeFormatter 格式化、Duration 和 Period 计算时间间隔、时区处理。

---

## 本章小结

方法是组织代码的基本单元。Java 参数传递是值传递。方法重载通过不同参数列表实现多态。可变参数使用 `...` 语法，本质是数组。递归虽然简洁但要注意性能。接下来我们将学习日期时间 API。
