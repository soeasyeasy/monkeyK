---
title: '第五章：循环'
description: 'for、while、do-while、增强 for'
---

# 第五章：循环

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

## 本章小结

本章学习了 Java 的四种循环方式和流程控制语句。for 循环最常用，while 适合条件循环，do-while 至少执行一次，增强 for 简化遍历。break 和 continue 控制循环流程。接下来我们将学习数组。
