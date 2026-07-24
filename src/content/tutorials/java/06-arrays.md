---
title: '第六章：数组'
description: '一维数组、多维数组、Arrays 工具类'
---

# 第六章：数组

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

## 本章小结

本章学习了 Java 数组的声明、初始化、遍历和常用操作。数组是固定长度的同类型元素集合，使用 `Arrays` 工具类可以方便地进行排序、查找、复制等操作。接下来我们将学习方法。
