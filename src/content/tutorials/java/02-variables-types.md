---
title: '第二章：变量与数据类型'
description: '基本数据类型、变量声明、类型转换'
---

# 第二章：变量与数据类型

## 运行结果

| 类型    | 大小   | 默认值   | 范围           |
| ------- | ------ | -------- | -------------- |
| byte    | 1 字节 | 0        | -128 ~ 127     |
| short   | 2 字节 | 0        | -32768 ~ 32767 |
| int     | 4 字节 | 0        | -2^31 ~ 2^31-1 |
| long    | 8 字节 | 0L       | -2^63 ~ 2^63-1 |
| float   | 4 字节 | 0.0f     | 约 ±3.4E38     |
| double  | 8 字节 | 0.0d     | 约 ±1.8E308    |
| char    | 2 字节 | '\u0000' | 0 ~ 65535      |
| boolean | —      | false    | true / false   |

## 变量声明

Java 是**强类型语言**，变量必须先声明类型再使用。每个变量都有明确的类型，编译器会进行严格的类型检查。

### 基本语法

```java
// 语法：类型 变量名 = 值;
int age = 25;
String name = "张三";
double price = 9.99;
boolean isActive = true;
```

### 声明与赋值分离

```java
int age;          // 声明变量
age = 25;         // 赋值

double salary;    // 声明
salary = 15000.0; // 赋值
```

### 同时声明多个同类型变量

```java
int a = 1, b = 2, c = 3;
double x = 1.1, y = 2.2;
```

### 局部变量类型推断（Java 10+）

```java
// 使用 var 关键字，编译器自动推断类型
var age = 25;          // 推断为 int
var name = "张三";     // 推断为 String
var price = 9.99;      // 推断为 double
var list = new ArrayList<String>();  // 推断为 ArrayList<String>

// ⚠️ var 只能用于局部变量，不能用于：
// - 类字段
// - 方法参数
// - 方法返回值
// - 没有初始化的变量
// var x;  // ❌ 编译错误
```

::: tip
var 虽然方便，但建议初学者先使用显式类型声明，等熟悉 Java 类型系统后再使用 var，这样有助于理解类型。
:::

## 基本数据类型

Java 有 **8 种基本数据类型**，分为四大类：

### 整数类型

```java
// byte — 1 字节，范围 -128 ~ 127
byte maxByte = 127;
byte minByte = -128;

// short — 2 字节，范围 -32768 ~ 32767
short maxShort = 32767;

// int — 4 字节，最常用（默认整数类型）
int count = 100;
int negative = -50;
int maxInt = 2147483647;       // 2^31 - 1

// long — 8 字节，必须加 L 或 l 后缀
long population = 7800000000L;  // 全球人口
long bigNum = 100_000_000L;     // 可以用下划线分隔（Java 7+）
```

::: warning

- `long` 类型字面量建议用大写 `L`，小写 `l` 容易和数字 `1` 混淆
- 整数字面量默认是 `int` 类型，超出范围必须用 `long`
  :::

### 浮点类型

```java
// float — 4 字节，必须加 f 或 F 后缀
float rate = 0.618f;
float pi = 3.14F;

// double — 8 字节，默认浮点类型（推荐）
double price = 99.99;
double gravity = 9.8;
double precise = 3.141592653589793;
```

::: warning
浮点数有精度问题，不适合用于精确计算（如金额）。精确计算请使用 `BigDecimal`。

```java
System.out.println(0.1 + 0.2);         // 0.30000000000000004
System.out.println(0.1 + 0.2 == 0.3);  // false
```

:::

### 字符类型

```java
// char — 2 字节，使用 Unicode 编码
char letter = 'A';            // 单个字符，用单引号
char chinese = '中';          // 支持中文
char number = '0';            // 字符 '0' 不等于数字 0
char escape = '\n';           // 转义字符
char unicode = '\u0041';      // Unicode 编码，表示 'A'

// char 本质上是整数，可以参与运算
char c = 'A';
System.out.println(c + 1);    // 66（'B' 的 Unicode 值）
System.out.println((char)(c + 1));  // 'B'
```

**常用转义字符：**

| 转义字符 | 含义          |
| -------- | ------------- |
| `\n`     | 换行          |
| `\t`     | 制表符（Tab） |
| `\\`     | 反斜杠 `\`    |
| `\'`     | 单引号 `'`    |
| `\"`     | 双引号 `"`    |
| `\r`     | 回车          |

### 布尔类型

```java
// boolean — 只有 true 和 false 两个值
boolean isJavaFun = true;
boolean isEmpty = false;

// 不能将整数当作布尔值（和 C/C++ 不同）
// boolean b = 1;  // ❌ 编译错误
```

## 引用类型

除 8 种基本类型外，其他都是引用类型。

```java
// String — 字符串（最常用的引用类型）
String message = "Hello Java";
String empty = "";
String nullStr = null;        // null 表示"没有对象"

// 数组
int[] numbers = {1, 2, 3};
String[] names = {"张三", "李四", "王五"};

// 对象（后续章节会详细讲解）
// Date now = new Date();
```

### 基本类型 vs 引用类型

| 特性     | 基本类型             | 引用类型                            |
| -------- | -------------------- | ----------------------------------- |
| 存储位置 | 栈（Stack）          | 堆（Heap）+ 栈中存引用              |
| 默认值   | 0 / false / '\u0000' | null                                |
| 比较方式 | `==` 比较值          | `==` 比较引用，`.equals()` 比较内容 |
| 种类     | 8 种                 | 无数种（类、接口、数组）            |

```java
// 基本类型比较
int a = 10, b = 10;
System.out.println(a == b);  // true（值相同）

// 引用类型比较
String s1 = new String("Hello");
String s2 = new String("Hello");
System.out.println(s1 == s2);       // false（不同对象，引用不同）
System.out.println(s1.equals(s2));  // true（内容相同）
```

## 类型转换

### 自动类型转换（小 → 大）

也称为"隐式转换"或"拓宽转换"，不会丢失数据。

```java
int intValue = 100;

// int → long（自动）
long longValue = intValue;

// int → double（自动）
double doubleValue = intValue;    // 100.0

// int → float（自动）
float floatValue = intValue;      // 100.0f

// 转换链：byte → short → int → long → float → double
byte b = 10;
short s = b;      // byte → short
int i = s;        // short → int
long l = i;       // int → long
float f = l;      // long → float
double d = f;     // float → double
```

### 强制类型转换（大 → 小）

也称为"显式转换"或"窄化转换"，可能丢失精度。

```java
// double → int（截断小数部分）
double pi = 3.14;
int intPi = (int) pi;     // 3（不是四舍五入，是直接截断）

double neg = -3.9;
int intNeg = (int) neg;   // -3（截断，不是 -4）

// long → int（可能溢出）
long bigNum = 3_000_000_000L;
int smallNum = (int) bigNum;   // 溢出！结果不是 30 亿

// double → float（精度丢失）
double precise = 3.141592653589793;
float rough = (float) precise;  // 3.1415927（精度丢失）
```

### 自动装箱与拆箱

```java
// 装箱：基本类型 → 包装类
Integer obj = 100;           // int → Integer（自动装箱）

// 拆箱：包装类 → 基本类型
int value = obj;             // Integer → int（自动拆箱）

// 等价于
Integer obj2 = Integer.valueOf(100);  // 手动装箱
int value2 = obj2.intValue();         // 手动拆箱
```

### 字符串与其他类型转换

```java
// ===== 数字 → 字符串 =====
// 方式一：String.valueOf()
String s1 = String.valueOf(123);       // "123"
String s2 = String.valueOf(3.14);      // "3.14"

// 方式二：Integer.toString()
String s3 = Integer.toString(456);     // "456"

// 方式三：字符串拼接（简单但不推荐用于复杂场景）
String s4 = 123 + "";                  // "123"

// ===== 字符串 → 数字 =====
int num1 = Integer.parseInt("123");      // 123
double num2 = Double.parseDouble("3.14"); // 3.14
long num3 = Long.parseLong("100");       // 100L

// ⚠️ 格式错误会抛出 NumberFormatException
// int bad = Integer.parseInt("abc");    // ❌ 异常
```

## 常量

使用 `final` 关键字声明常量，一旦赋值不可修改。

```java
// 常量命名规范：全大写，单词间用下划线分隔
final double PI = 3.14159265358979;
final int MAX_SIZE = 100;
final String APP_NAME = "MyApp";

// PI = 3.14;  // ❌ 编译错误：不能修改 final 变量

// final 必须在声明时或构造器中赋值
final int x;
x = 10;       // ✅ 延迟赋值（只能赋值一次）
// x = 20;    // ❌ 编译错误：已经赋值过了
```

### 编译时常量

```java
// 使用 static final 定义类级别的常量
public class Constants {
    public static final double PI = 3.14159265358979;
    public static final int MAX_RETRY = 3;
    public static final String VERSION = "1.0.0";
}

// 使用
System.out.println(Constants.PI);
System.out.println(Constants.MAX_RETRY);
```

## 变量作用域

```java
public class ScopeDemo {
    static int classVar = 100;    // 类变量（静态变量）

    int instanceVar = 200;        // 实例变量（成员变量）

    public void method() {
        int localVar = 300;       // 局部变量

        if (true) {
            int blockVar = 400;   // 块级变量
            System.out.println(blockVar);
        }
        // System.out.println(blockVar);  // ❌ 超出作用域
    }
}
```

| 变量类型 | 位置          | 生命周期       | 默认值                 |
| -------- | ------------- | -------------- | ---------------------- |
| 类变量   | `static` 修饰 | 类加载到卸载   | 有                     |
| 实例变量 | 类中、方法外  | 对象创建到销毁 | 有                     |
| 局部变量 | 方法内        | 方法执行期间   | **无（必须手动赋值）** |

## 核心知识点

1. **8 种基本类型**：byte、short、int、long、float、double、char、boolean
2. **强类型语言**：变量必须先声明类型，编译器严格检查
3. **类型转换**：小 → 大自动转换，大 → 小需要强制转换
4. **浮点精度**：浮点数不适合精确计算，使用 `BigDecimal`
5. **字符串比较**：用 `.equals()` 而不是 `==`
6. **常量**：使用 `final` 声明，命名全大写

## 本章小结

本章学习了 Java 的 8 种基本数据类型和引用类型，掌握了变量声明、类型转换和常量的使用。Java 作为强类型语言，类型安全是其重要特性。接下来我们将学习 Java 的运算符。
