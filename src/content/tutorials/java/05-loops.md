---
title: '第五章：循环'
description: 'for、while、do-while、增强 for'
---

# 第五章：循环

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 循环有哪几种？它们之间有什么区别？
- 什么时候用 `for`，什么时候用 `while`？
- `break` 和 `continue` 到底怎么用？有什么区别？
- 什么是"死循环"？怎么避免？

这一章就是为了解答这些问题。我们会先搞清楚 **四种循环的适用场景**，再通过大量实例帮你掌握循环的写法。学完这章，你就能让程序自动重复执行任务了。

---

## 5.1 为什么需要循环？

### 痛点分析

想象你要打印 100 份试卷，你会怎么做？一份一份复印 100 次？当然不会，你会用复印机的"连续复印"功能。循环就是程序的"连续复印"功能——让某段代码自动重复执行。

**生活类比**：循环就像洗衣机的工作流程。"加水→洗涤→排水→脱水"这个流程会重复多次，直到衣服洗干净。程序中的循环也是让一段代码重复执行，直到满足某个条件。

### 代码对比

```java
// ❌ 没有循环：手动写 5 次
System.out.println("第 1 次");
System.out.println("第 2 次");
System.out.println("第 3 次");
System.out.println("第 4 次");
System.out.println("第 5 次");

// ✅ 有循环：一行代码搞定
for (int i = 1; i <= 5; i++) {
    System.out.println("第 " + i + " 次");
}
```

> **一句话总结**：循环让程序能自动重复执行任务，避免写重复代码。

---

## 5.2 核心原理

### 概念解释

循环的本质是**重复执行**。程序在执行时遇到循环，就像进入一个"跑步圈"：

- `for` 循环：像计时跑步，知道要跑几圈（已知循环次数）
- `while` 循环：像条件跑步，跑到满足条件为止（未知次数）
- `do-while` 循环：像试吃，至少尝一口再决定是否继续（至少执行一次）
- 增强 `for` 循环：像点名，逐个叫名字（遍历集合）

打个比方：

> 循环就像工厂的流水线。`for` 循环是定量生产线，生产固定数量的产品；`while` 循环是质检线，检查到合格为止；`do-while` 循环是试吃线，至少尝一次；增强 `for` 是包装线，逐个包装产品。

### 对比分析

| 循环类型 | 适用场景             | 特点               | 执行顺序              |
| -------- | -------------------- | ------------------ | --------------------- |
| for      | 已知循环次数         | 结构清晰，最常用   | 初始化→判断→执行→更新 |
| while    | 未知次数，按条件循环 | 先判断后执行       | 判断→执行→更新        |
| do-while | 至少执行一次         | 先执行后判断       | 执行→判断→更新        |
| 增强 for | 遍历数组/集合        | 语法简洁，无需索引 | 自动遍历              |

---

## 运行结果

| 循环类型 | 适用场景             | 特点               |
| -------- | -------------------- | ------------------ |
| for      | 已知循环次数         | 结构清晰，最常用   |
| while    | 未知次数，按条件循环 | 先判断后执行       |
| do-while | 至少执行一次         | 先执行后判断       |
| 增强 for | 遍历数组/集合        | 语法简洁，无需索引 |

## for 循环

### 基本语法

```java
// 语法：for (初始化; 条件; 更新) { 循环体 }

for (int i = 0; i < 5; i++) {
    System.out.println("第 " + (i + 1) + " 次循环");
}
// 输出：
// 第 1 次循环
// 第 2 次循环
// 第 3 次循环
// 第 4 次循环
// 第 5 次循环
```

### for 循环执行流程

```
初始化 (int i = 0)
    ↓
判断条件 (i < 5) → false → 结束
    ↓ true
执行循环体
    ↓
更新 (i++)
    ↓
回到判断条件
```

### 实际案例：求和

```java
// 计算 1 到 100 的和
int sum = 0;
for (int i = 1; i <= 100; i++) {
    sum += i;
}
System.out.println("1+2+...+100 = " + sum);  // 5050
```

### 嵌套循环

```java
// 九九乘法表
for (int i = 1; i <= 9; i++) {
    for (int j = 1; j <= i; j++) {
        System.out.print(j + "×" + i + "=" + (i * j) + "\t");
    }
    System.out.println();  // 换行
}
// 输出：
// 1×1=1
// 1×2=2  2×2=4
// 1×3=3  2×3=6  3×3=9
// ...
```

### 打印图形

```java
// 打印直角三角形
int rows = 5;
for (int i = 1; i <= rows; i++) {
    for (int j = 1; j <= i; j++) {
        System.out.print("* ");
    }
    System.out.println();
}
// 输出：
// *
// * *
// * * *
// * * * *
// * * * * *
```

## while 循环

### 基本语法

```java
// 语法：while (条件) { 循环体 }

int count = 0;
while (count < 5) {
    System.out.println("count = " + count);
    count++;
}
// 输出：count = 0, 1, 2, 3, 4
```

### 实际案例：猜数字游戏

```java
import java.util.Scanner;
import java.util.Random;

int target = new Random().nextInt(100) + 1;  // 1-100 的随机数
int guess = 0;
int attempts = 0;

Scanner scanner = new Scanner(System.in);

while (guess != target) {
    System.out.print("猜一个 1-100 的数字：");
    guess = scanner.nextInt();
    attempts++;

    if (guess > target) {
        System.out.println("太大了！");
    } else if (guess < target) {
        System.out.println("太小了！");
    } else {
        System.out.println("恭喜！猜对了，用了 " + attempts + " 次");
    }
}
```

### 死循环

```java
// ⚠️ 条件永远为 true，会无限循环
// while (true) {
//     System.out.println("无限循环");
// }

// 实际使用：服务器监听、事件循环
while (true) {
    // 处理请求
    // if (需要退出) break;
}
```

## do-while 循环

### 基本语法

```java
// 语法：do { 循环体 } while (条件);
// 特点：至少执行一次循环体

int num = 10;
do {
    System.out.println("num = " + num);
    num++;
} while (num < 5);
// 输出：num = 10（条件不满足，但已执行一次）
```

### while vs do-while

```java
// while：先判断后执行
int x = 10;
while (x < 5) {
    System.out.println("while: " + x);  // 不执行
}

// do-while：先执行后判断
int y = 10;
do {
    System.out.println("do-while: " + y);  // 输出：do-while: 10
    y++;
} while (y < 5);
```

### 实际案例：菜单系统

```java
import java.util.Scanner;

Scanner scanner = new Scanner(System.in);
int choice;

do {
    System.out.println("\n===== 菜单 =====");
    System.out.println("1. 添加");
    System.out.println("2. 删除");
    System.out.println("3. 查看");
    System.out.println("0. 退出");
    System.out.print("请选择：");
    choice = scanner.nextInt();

    switch (choice) {
        case 1 -> System.out.println("执行添加操作");
        case 2 -> System.out.println("执行删除操作");
        case 3 -> System.out.println("执行查看操作");
        case 0 -> System.out.println("退出系统");
        default -> System.out.println("无效选择");
    }
} while (choice != 0);
```

## 增强 for 循环

### 遍历数组

```java
int[] numbers = {10, 20, 30, 40, 50};

// 增强 for（for-each）
for (int num : numbers) {
    System.out.println(num);
}

// 等价于传统 for
for (int i = 0; i < numbers.length; i++) {
    System.out.println(numbers[i]);
}
```

### 遍历字符串

```java
String name = "Java";

// 遍历每个字符
for (char c : name.toCharArray()) {
    System.out.println(c);
}
// 输出：J, a, v, a
```

### 增强 for 的局限

```java
int[] arr = {1, 2, 3, 4, 5};

// ❌ 无法获取索引
for (int num : arr) {
    // 不知道当前是第几个元素
}

// ❌ 无法修改数组元素
for (int num : arr) {
    num = num * 2;  // 修改的是副本，不影响原数组
}

// ✅ 需要索引或修改时，用传统 for
for (int i = 0; i < arr.length; i++) {
    arr[i] = arr[i] * 2;
    System.out.println("索引 " + i + ": " + arr[i]);
}
```

## break 与 continue

### break — 跳出整个循环

```java
// 找到第一个能被 7 整除的数就停止
for (int i = 1; i <= 100; i++) {
    if (i % 7 == 0) {
        System.out.println("找到了：" + i);
        break;
    }
}
// 输出：找到了：7
```

### continue — 跳过本次循环

```java
// 只打印奇数
for (int i = 1; i <= 10; i++) {
    if (i % 2 == 0) {
        continue;    // 跳过偶数
    }
    System.out.println(i);
}
// 输出：1, 3, 5, 7, 9
```

### break vs continue

```java
// break：完全退出循环
for (int i = 0; i < 5; i++) {
    if (i == 3) break;
    System.out.println(i);
}
// 输出：0, 1, 2

// continue：跳过当前迭代，继续下一次
for (int i = 0; i < 5; i++) {
    if (i == 3) continue;
    System.out.println(i);
}
// 输出：0, 1, 2, 4
```

## 标签跳转

Java 支持标签（label），可以跳出多层嵌套循环。

```java
outer:
for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
        if (i == 1 && j == 1) {
            break outer;    // 跳出外层循环
        }
        System.out.println("i=" + i + ", j=" + j);
    }
}
// 输出：
// i=0, j=0
// i=0, j=1
// i=0, j=2
// i=1, j=0
```

### continue with label

```java
outer:
for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
        if (j == 1) {
            continue outer;    // 跳到外层循环的下一次迭代
        }
        System.out.println("i=" + i + ", j=" + j);
    }
}
// 输出：
// i=0, j=0
// i=1, j=0
// i=2, j=0
```

::: tip
标签跳转虽然强大，但过度使用会降低代码可读性。建议优先使用方法提取来替代复杂的标签跳转。
:::

## 循环对比

| 特性         | for      | while    | do-while | 增强 for |
| ------------ | -------- | -------- | -------- | -------- |
| 初始化       | ✅       | 手动     | 手动     | 自动     |
| 条件判断     | ✅       | ✅       | ✅       | 自动     |
| 更新         | ✅       | 手动     | 手动     | 自动     |
| 至少执行一次 | 否       | 否       | ✅       | 否       |
| 获取索引     | ✅       | ✅       | ✅       | ❌       |
| 适用场景     | 已知次数 | 未知次数 | 至少一次 | 遍历集合 |

## 核心知识点

1. **for 循环**：最常用，适合已知循环次数的场景
2. **while 循环**：适合未知次数，按条件循环的场景
3. **do-while**：至少执行一次，适合菜单、输入验证等场景
4. **增强 for**：语法简洁，适合遍历数组和集合，但无法获取索引
5. **break**：完全退出循环
6. **continue**：跳过本次迭代，继续下一次
7. **标签跳转**：可以跳出多层循环，但慎用

---

## 新手常见误区

### 误区 1："while(true) 就是死循环"

**不一定！** `while(true)` 确实是无限循环，但可以通过 `break` 退出。

```java
// ❌ 真正的死循环：永远无法退出
while (true) {
    System.out.println("无限循环");  // 会一直输出
}

// ✅ 正确的无限循环：有退出条件
while (true) {
    System.out.println("请输入数字（0退出）：");
    int num = scanner.nextInt();

    if (num == 0) {
        break;  // 满足条件时退出循环
    }
    System.out.println("你输入了：" + num);
}
```

### 误区 2："for 循环的变量可以在外部使用"

**错！** `for` 循环的初始化变量（如 `int i`）作用域仅在循环内部。

```java
// ❌ 错误写法
for (int i = 0; i < 5; i++) {
    System.out.println(i);
}
System.out.println(i);  // 编译错误：i 不在作用域内

// ✅ 正确写法：在外部声明变量
int j;
for (j = 0; j < 5; j++) {
    System.out.println(j);
}
System.out.println("最终 j = " + j);  // 输出 5
```

### 误区 3："增强 for 可以修改数组元素"

**错！** 增强 `for` 循环中的变量是副本，修改它不会影响原数组。

```java
int[] arr = {1, 2, 3, 4, 5};

// ❌ 错误写法：修改的是副本
for (int num : arr) {
    num = num * 2;  // 修改的是局部变量 num，不影响 arr
}
System.out.println(Arrays.toString(arr));  // [1, 2, 3, 4, 5]（没变）

// ✅ 正确写法：需要修改时用传统 for
for (int i = 0; i < arr.length; i++) {
    arr[i] = arr[i] * 2;  // 通过索引修改原数组
}
System.out.println(Arrays.toString(arr));  // [2, 4, 6, 8, 10]
```

### 误区 4："break 和 continue 效果一样"

**错！** 它们的作用完全不同。

```java
// break：完全退出循环
for (int i = 0; i < 5; i++) {
    if (i == 3) break;
    System.out.println(i);
}
// 输出：0, 1, 2（遇到 3 就完全退出）

// continue：跳过本次，继续下一次
for (int i = 0; i < 5; i++) {
    if (i == 3) continue;
    System.out.println(i);
}
// 输出：0, 1, 2, 4（跳过 3，继续执行 4）
```

### 误区 5："循环条件写 >= 而不是 >"

**常见 bug！** 边界条件容易搞混，导致多执行一次或少执行一次。

```java
// ❌ 错误：想执行 5 次，结果执行了 6 次
for (int i = 0; i <= 5; i++) {
    System.out.println(i);  // 输出 0, 1, 2, 3, 4, 5（6次）
}

// ✅ 正确：执行 5 次
for (int i = 0; i < 5; i++) {
    System.out.println(i);  // 输出 0, 1, 2, 3, 4（5次）
}

// ✅ 或者从 1 开始
for (int i = 1; i <= 5; i++) {
    System.out.println(i);  // 输出 1, 2, 3, 4, 5（5次）
}
```

---

## 动手练习

### 练习 1：基础练习 - 求和

编写程序，计算 1 到 100 的和。

要求：

- 使用 `for` 循环
- 输出最终结果

<details>
<summary>点击查看答案</summary>

```java
public class SumCalculator {
    public static void main(String[] args) {
        // 初始化累加器
        int sum = 0;

        // 使用 for 循环累加 1 到 100
        for (int i = 1; i <= 100; i++) {
            sum += i;  // 等价于 sum = sum + i
        }

        // 输出结果
        System.out.println("1+2+...+100 = " + sum);  // 5050
    }
}
```

**测试用例**：

- 1 到 100 的和：5050
- 1 到 10 的和：55
- 1 到 50 的和：1275

</details>

### 练习 2：进阶练习 - 猜数字游戏

编写一个猜数字游戏程序。

要求：

- 程序随机生成 1-100 的数字
- 用户输入猜测的数字
- 提示"太大"或"太小"
- 猜对后输出猜测次数
- 使用 `while` 循环

<details>
<summary>点击查看答案</summary>

```java
import java.util.Random;
import java.util.Scanner;

public class GuessNumber {
    public static void main(String[] args) {
        // 生成随机数
        Random random = new Random();
        int target = random.nextInt(100) + 1;  // 1-100

        Scanner scanner = new Scanner(System.in);
        int guess = 0;
        int attempts = 0;

        System.out.println("猜数字游戏开始！我想了一个 1-100 的数字。");

        // 使用 while 循环，直到猜对为止
        while (guess != target) {
            System.out.print("请猜一个数字：");
            guess = scanner.nextInt();
            attempts++;

            // 判断大小
            if (guess > target) {
                System.out.println("太大了！");
            } else if (guess < target) {
                System.out.println("太小了！");
            } else {
                System.out.println("恭喜！猜对了，用了 " + attempts + " 次");
            }
        }

        scanner.close();
    }
}
```

**测试用例**：

- 随机数是 50，用户依次输入 70、30、50，输出"恭喜！猜对了，用了 3 次"
- 随机数是 1，用户输入 1，输出"恭喜！猜对了，用了 1 次"

</details>

### 练习 3（挑战）：综合练习 - 打印九九乘法表

编写程序，打印九九乘法表。

要求：

- 使用嵌套 `for` 循环
- 格式对齐，使用 `\t` 制表符
- 输出完整的 9×9 乘法表

<details>
<summary>点击查看答案</summary>

```java
public class MultiplicationTable {
    public static void main(String[] args) {
        // 外层循环控制行数（1-9）
        for (int i = 1; i <= 9; i++) {
            // 内层循环控制每行的列数（1-i）
            for (int j = 1; j <= i; j++) {
                // 打印乘法表达式，使用 \t 对齐
                System.out.print(j + "×" + i + "=" + (i * j) + "\t");
            }
            // 每行结束后换行
            System.out.println();
        }
    }
}
```

**输出结果**：

```
1×1=1
1×2=2	2×2=4
1×3=3	2×3=6	3×3=9
1×4=4	2×4=8	3×4=12	4×4=16
...
1×9=9	2×9=18	3×9=27	...	9×9=81
```

</details>

---

## 下一章预告

下一章我们会学习 **数组** ——也就是存储多个相同类型数据的数据结构。你会学到：

- 如何声明和初始化数组
- 如何通过索引访问和修改数组元素
- 如何遍历数组
- `Arrays` 工具类的常用方法（排序、查找、填充）
- 二维数组的使用

数组是编程中非常重要的数据结构，掌握它能让你的程序处理批量数据。准备好了吗？让我们继续前进！

---

## 本章小结

本章学习了 Java 的四种循环方式和流程控制语句。for 循环最常用，while 适合条件循环，do-while 至少执行一次，增强 for 简化遍历。break 和 continue 控制循环流程。接下来我们将学习数组。
