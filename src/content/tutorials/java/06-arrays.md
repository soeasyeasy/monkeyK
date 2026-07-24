---
title: '第六章：数组'
description: '一维数组、多维数组、Arrays 工具类'
---

# 第六章：数组

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么要用数组？直接用多个变量不行吗？
- 数组的索引为什么从 0 开始而不是从 1 开始？
- 数组创建后长度为什么不能改变？想动态长度怎么办？
- `Arrays` 工具类有哪些实用方法？

这一章就是为了解答这些问题。我们会先搞清楚 **数组的本质和使用场景**，再通过大量实例帮你掌握数组的操作。学完这章，你就能高效地管理批量数据了。

---

## 6.1 为什么需要数组？

### 痛点分析

想象你要记录全班 50 个学生的成绩，你会怎么做？定义 50 个变量？`score1, score2, score3...score50`？这太疯狂了！而且如果要处理 1000 个数据呢？

**生活类比**：数组就像一排储物柜。每个柜子有编号（索引），可以存放物品（数据）。你不需要为每个物品单独找个地方，只要把它们放进同一排柜子里，通过编号就能快速找到。

### 代码对比

```java
// ❌ 没有数组：定义 5 个变量
int score1 = 90;
int score2 = 85;
int score3 = 78;
int score4 = 92;
int score5 = 88;

// 求和需要写 5 行
int sum = score1 + score2 + score3 + score4 + score5;

// ✅ 有数组：一个变量搞定
int[] scores = {90, 85, 78, 92, 88};

// 求和用循环
int sum = 0;
for (int score : scores) {
    sum += score;
}
```

> **一句话总结**：数组让程序能高效地管理和处理批量数据。

---

## 6.2 核心原理

### 概念解释

数组的本质是**连续的内存空间**。你可以把它想象成：

- **一排储物柜**：每个柜子大小相同，按顺序排列，通过编号（索引）访问
- **电梯楼层**：从 0 层开始，每层住一户人家（存储一个数据）
- **电影院座位**：一排座位，每个座位有编号，对号入座

打个比方：

> 数组就像火车的车厢。每节车厢类型相同（数据类型一致），按顺序连接（连续内存），通过车厢号（索引）访问。火车长度固定（数组长度不可变），不能随意加挂或拆除车厢。

### 对比分析

| 特性     | 数组           | 多个独立变量 |
| -------- | -------------- | ------------ |
| 声明方式 | 一个变量名     | 多个变量名   |
| 访问方式 | 通过索引       | 通过变量名   |
| 遍历方式 | 可用循环       | 只能逐个访问 |
| 内存分配 | 连续空间       | 分散空间     |
| 适用场景 | 批量同类型数据 | 少量独立数据 |

---

## 运行结果

| 特性     | 说明                             |
| -------- | -------------------------------- |
| 固定长度 | 创建后长度不可变                 |
| 类型一致 | 所有元素类型相同                 |
| 索引访问 | 从 0 开始，支持随机访问          |
| 默认值   | 数值 0，对象 null，boolean false |

## 一维数组

### 声明与初始化

```java
// 静态初始化 — 直接指定元素
int[] nums = {1, 2, 3, 4, 5};
String[] names = {"张三", "李四", "王五"};

// 动态初始化 — 指定长度，元素为默认值
int[] arr = new int[5];    // [0, 0, 0, 0, 0]
String[] strs = new String[3];  // [null, null, null]

// 先声明后初始化
int[] data;
data = new int[]{10, 20, 30};

// 另一种声明方式（不推荐）
int nums2[] = {1, 2, 3};  // C/C++ 风格，Java 不推荐
```

### 访问与修改

```java
int[] scores = {90, 85, 78, 92, 88};

// 访问元素（索引从 0 开始）
System.out.println(scores[0]);     // 90（第一个元素）
System.out.println(scores[4]);     // 88（最后一个元素）
System.out.println(scores.length); // 5（数组长度）

// 修改元素
scores[2] = 80;    // 修改第三个元素
System.out.println(scores[2]);  // 80
```

### 遍历数组

```java
int[] nums = {1, 2, 3, 4, 5};

// 方式一：传统 for 循环（可获取索引）
for (int i = 0; i < nums.length; i++) {
    System.out.println("索引 " + i + ": " + nums[i]);
}

// 方式二：增强 for 循环（简洁，无索引）
for (int num : nums) {
    System.out.println(num);
}

// 方式三：Java 8+ Stream
Arrays.stream(nums).forEach(System.out::println);
```

### 数组拷贝

```java
int[] original = {1, 2, 3, 4, 5};

// 方式一：Arrays.copyOf()
int[] copy1 = Arrays.copyOf(original, original.length);

// 方式二：System.arraycopy()
int[] copy2 = new int[original.length];
System.arraycopy(original, 0, copy2, 0, original.length);

// 方式三：clone()
int[] copy3 = original.clone();

// ⚠️ 直接赋值只是引用，不是拷贝
int[] ref = original;  // ref 和 original 指向同一个数组
ref[0] = 100;          // original[0] 也变成 100
```

## 多维数组

### 二维数组

```java
// 静态初始化
int[][] matrix = {
    {1, 2, 3},
    {4, 5, 6},
    {7, 8, 9}
};

// 动态初始化
int[][] grid = new int[3][4];    // 3 行 4 列

// 访问元素
System.out.println(matrix[0][0]);  // 1（第一行第一列）
System.out.println(matrix[1][2]);  // 6（第二行第三列）

// 修改元素
matrix[2][1] = 88;
```

### 遍历二维数组

```java
int[][] matrix = {
    {1, 2, 3},
    {4, 5, 6}
};

// 方式一：传统 for
for (int i = 0; i < matrix.length; i++) {
    for (int j = 0; j < matrix[i].length; j++) {
        System.out.print(matrix[i][j] + " ");
    }
    System.out.println();
}

// 方式二：增强 for
for (int[] row : matrix) {
    for (int num : row) {
        System.out.print(num + " ");
    }
    System.out.println();
}
```

### 不规则数组

```java
// Java 支持不规则数组（每行长度可以不同）
int[][] irregular = new int[3][];
irregular[0] = new int[2];  // 第一行 2 个元素
irregular[1] = new int[3];  // 第二行 3 个元素
irregular[2] = new int[1];  // 第三行 1 个元素

// 初始化
irregular[0] = new int[]{1, 2};
irregular[1] = new int[]{3, 4, 5};
irregular[2] = new int[]{6};
```

## Arrays 工具类

`java.util.Arrays` 提供常用数组操作。

### 排序

```java
import java.util.Arrays;

int[] arr = {5, 3, 8, 1, 9, 2};

// 升序排序
Arrays.sort(arr);
System.out.println(Arrays.toString(arr));  // [1, 2, 3, 5, 8, 9]

// 降序排序（需要包装类）
Integer[] arr2 = {5, 3, 8, 1, 9, 2};
Arrays.sort(arr2, Collections.reverseOrder());
System.out.println(Arrays.toString(arr2));  // [9, 8, 5, 3, 2, 1]

// 部分排序（索引 1 到 4）
int[] arr3 = {5, 3, 8, 1, 9, 2};
Arrays.sort(arr3, 1, 4);  // 排序索引 1-3
System.out.println(Arrays.toString(arr3));  // [5, 1, 3, 8, 9, 2]
```

### 查找

```java
int[] arr = {1, 2, 3, 5, 8, 9};  // 已排序

// 二分查找（数组必须已排序）
int index = Arrays.binarySearch(arr, 5);
System.out.println(index);  // 3

// 查找不存在的元素
int notFound = Arrays.binarySearch(arr, 4);
System.out.println(notFound);  // 负数（插入点的负值减一）
```

### 填充

```java
// 填充整个数组
int[] filled = new int[5];
Arrays.fill(filled, 10);
System.out.println(Arrays.toString(filled));  // [10, 10, 10, 10, 10]

// 部分填充
int[] arr = {1, 2, 3, 4, 5};
Arrays.fill(arr, 1, 4, 0);  // 索引 1-3 填充为 0
System.out.println(Arrays.toString(arr));  // [1, 0, 0, 0, 5]
```

### 复制

```java
int[] arr = {1, 2, 3, 4, 5};

// 复制到指定长度
int[] copy1 = Arrays.copyOf(arr, 3);
System.out.println(Arrays.toString(copy1));  // [1, 2, 3]

// 复制并扩展（多出的位置填默认值）
int[] copy2 = Arrays.copyOf(arr, 8);
System.out.println(Arrays.toString(copy2));  // [1, 2, 3, 4, 5, 0, 0, 0]

// 复制指定范围
int[] range = Arrays.copyOfRange(arr, 1, 4);
System.out.println(Arrays.toString(range));  // [2, 3, 4]
```

### 比较

```java
int[] a = {1, 2, 3};
int[] b = {1, 2, 3};
int[] c = {1, 2, 4};

System.out.println(Arrays.equals(a, b));  // true
System.out.println(Arrays.equals(a, c));  // false
```

### 转字符串

```java
int[] arr = {1, 2, 3, 4, 5};

// 直接打印会输出地址
System.out.println(arr);  // [I@1b6d3586

// 使用 Arrays.toString()
System.out.println(Arrays.toString(arr));  // [1, 2, 3, 4, 5]

// 二维数组用 Arrays.deepToString()
int[][] matrix = {{1, 2}, {3, 4}};
System.out.println(Arrays.deepToString(matrix));  // [[1, 2], [3, 4]]
```

## 数组常见问题

### 数组越界

```java
int[] arr = {1, 2, 3};

// ❌ ArrayIndexOutOfBoundsException
// System.out.println(arr[3]);   // 最大索引是 2
// System.out.println(arr[-1]);  // 索引不能为负
```

### 空指针异常

```java
int[] arr = null;

// ❌ NullPointerException
// System.out.println(arr.length);
// System.out.println(arr[0]);
```

### 数组作为方法参数

```java
public static int sum(int[] numbers) {
    int total = 0;
    for (int num : numbers) {
        total += num;
    }
    return total;
}

public static void printArray(int[] arr) {
    System.out.println(Arrays.toString(arr));
}

int[] data = {10, 20, 30};
System.out.println(sum(data));  // 60
printArray(data);               // [10, 20, 30]
```

### 数组作为返回值

```java
public static int[] getMinMax(int[] arr) {
    int min = arr[0], max = arr[0];
    for (int num : arr) {
        if (num < min) min = num;
        if (num > max) max = num;
    }
    return new int[]{min, max};
}

int[] data = {3, 1, 4, 1, 5, 9};
int[] result = getMinMax(data);
System.out.println("最小值: " + result[0]);  // 1
System.out.println("最大值: " + result[1]);  // 9
```

## 核心知识点

1. **数组长度固定**：创建后不能改变，需要动态大小用 `ArrayList`
2. **索引从 0 开始**：最大索引是 `length - 1`
3. **默认值**：数值类型为 0，对象为 null，boolean 为 false
4. **Arrays 工具类**：提供排序、查找、填充、复制等便捷方法
5. **数组越界**：访问不存在的索引会抛出 `ArrayIndexOutOfBoundsException`

---

## 新手常见误区

### 误区 1："数组可以直接用 == 比较内容"

**错！** 数组是引用类型，`==` 比较的是地址，不是内容。

```java
int[] a = {1, 2, 3};
int[] b = {1, 2, 3};

// ❌ 错误写法
System.out.println(a == b);  // false（地址不同）

// ✅ 正确写法
System.out.println(Arrays.equals(a, b));  // true（内容相同）
```

### 误区 2："数组可以直接打印输出内容"

**错！** 直接打印数组会输出内存地址，需要用 `Arrays.toString()`。

```java
int[] arr = {1, 2, 3, 4, 5};

// ❌ 错误写法
System.out.println(arr);  // 输出：[I@1b6d3586（内存地址）

// ✅ 正确写法
System.out.println(Arrays.toString(arr));  // 输出：[1, 2, 3, 4, 5]

// 二维数组用 deepToString
int[][] matrix = {{1, 2}, {3, 4}};
System.out.println(Arrays.deepToString(matrix));  // [[1, 2], [3, 4]]
```

### 误区 3："数组赋值就是拷贝"

**错！** 直接赋值只是复制引用，两个变量指向同一个数组。

```java
int[] original = {1, 2, 3, 4, 5};

// ❌ 错误理解：以为创建了副本
int[] copy = original;  // 只是复制了引用，不是拷贝

copy[0] = 100;  // 修改 copy 会影响 original
System.out.println(original[0]);  // 100（被修改了）

// ✅ 正确拷贝方式
int[] realCopy = Arrays.copyOf(original, original.length);
realCopy[0] = 200;
System.out.println(original[0]);  // 100（未受影响）
```

### 误区 4："数组索引可以从 1 开始"

**错！** Java 数组索引从 0 开始，最大索引是 `length - 1`。

```java
int[] arr = {10, 20, 30};

// ❌ 错误理解：以为索引从 1 开始
System.out.println(arr[1]);  // 20（第二个元素，不是第一个）
System.out.println(arr[3]);  // ArrayIndexOutOfBoundsException（越界）

// ✅ 正确理解：索引从 0 开始
System.out.println(arr[0]);  // 10（第一个元素）
System.out.println(arr[2]);  // 30（最后一个元素，索引是 length-1）
```

### 误区 5："数组长度可以动态改变"

**不是的。** Java 数组长度固定，创建后不能改变。需要动态长度用 `ArrayList`。

```java
int[] arr = new int[5];  // 长度固定为 5

// ❌ 无法改变长度
// arr.length = 10;  // 编译错误

// ✅ 需要动态长度用 ArrayList
ArrayList<Integer> list = new ArrayList<>();
list.add(1);
list.add(2);
list.add(3);  // 可以动态添加
```

---

## 动手练习

### 练习 1：基础练习 - 数组求和

编写程序，计算数组中所有元素的和。

要求：

- 定义一个整数数组 `{10, 20, 30, 40, 50}`
- 使用循环遍历数组
- 输出总和

<details>
<summary>点击查看答案</summary>

```java
import java.util.Arrays;

public class ArraySum {
    public static void main(String[] args) {
        // 定义数组
        int[] numbers = {10, 20, 30, 40, 50};

        // 初始化累加器
        int sum = 0;

        // 遍历数组累加
        for (int num : numbers) {
            sum += num;  // 累加每个元素
        }

        // 输出结果
        System.out.println("数组：" + Arrays.toString(numbers));
        System.out.println("总和：" + sum);  // 150
    }
}
```

**测试用例**：

- 数组 `{10, 20, 30, 40, 50}`，输出总和 150
- 数组 `{1, 2, 3, 4, 5}`，输出总和 15

</details>

### 练习 2：进阶练习 - 查找最大值和最小值

编写程序，找出数组中的最大值和最小值。

要求：

- 定义一个整数数组 `{3, 7, 1, 9, 4, 6, 2}`
- 不使用 `Arrays.sort()`
- 输出最大值和最小值

<details>
<summary>点击查看答案</summary>

```java
import java.util.Arrays;

public class FindMinMax {
    public static void main(String[] args) {
        // 定义数组
        int[] arr = {3, 7, 1, 9, 4, 6, 2};

        // 初始化最大值和最小值为第一个元素
        int max = arr[0];
        int min = arr[0];

        // 遍历数组查找
        for (int num : arr) {
            if (num > max) {
                max = num;  // 更新最大值
            }
            if (num < min) {
                min = num;  // 更新最小值
            }
        }

        // 输出结果
        System.out.println("数组：" + Arrays.toString(arr));
        System.out.println("最大值：" + max);  // 9
        System.out.println("最小值：" + min);  // 1
    }
}
```

**测试用例**：

- 数组 `{3, 7, 1, 9, 4, 6, 2}`，最大值 9，最小值 1
- 数组 `{10, 20, 30}`，最大值 30，最小值 10

</details>

### 练习 3（挑战）：综合练习 - 数组反转

编写程序，将数组中的元素反转（第一个变最后一个，第二个变倒数第二个）。

要求：

- 定义一个数组 `{1, 2, 3, 4, 5}`
- 在原数组上反转，不创建新数组
- 输出反转后的数组

<details>
<summary>点击查看答案</summary>

```java
import java.util.Arrays;

public class ReverseArray {
    public static void main(String[] args) {
        // 定义数组
        int[] arr = {1, 2, 3, 4, 5};

        System.out.println("原数组：" + Arrays.toString(arr));

        // 双指针法反转数组
        int left = 0;  // 左指针
        int right = arr.length - 1;  // 右指针

        while (left < right) {
            // 交换元素
            int temp = arr[left];
            arr[left] = arr[right];
            arr[right] = temp;

            // 移动指针
            left++;
            right--;
        }

        // 输出结果
        System.out.println("反转后：" + Arrays.toString(arr));  // [5, 4, 3, 2, 1]
    }
}
```

**测试用例**：

- 数组 `{1, 2, 3, 4, 5}`，反转后 `{5, 4, 3, 2, 1}`
- 数组 `{10, 20, 30, 40}`，反转后 `{40, 30, 20, 10}`

</details>

---

## 下一章预告

下一章我们会学习 **方法** ——也就是组织代码的基本单元。你会学到：

- 如何定义和调用方法
- 方法的参数传递机制（值传递）
- 方法重载的概念
- 可变参数的使用
- 递归的基本思想

方法是代码复用的基础，掌握它能让你的程序更模块化、更易维护。准备好了吗？让我们继续前进！

---

## 本章小结

本章学习了 Java 数组的声明、初始化、遍历和常用操作。数组是固定长度的同类型元素集合，使用 `Arrays` 工具类可以方便地进行排序、查找、复制等操作。接下来我们将学习方法。
