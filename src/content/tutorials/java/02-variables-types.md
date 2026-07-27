---
title: '第二章：变量与数据类型'
description: '基本数据类型、变量声明、类型转换'
---

# 第二章：变量与数据类型

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Java 有哪些数据类型？和 Python、JavaScript 有什么不同？
- 为什么 Java 声明变量时必须指定类型？
- int 和 long 有什么区别？什么时候用哪个？
- 浮点数计算为什么会有精度问题？
- 字符串比较为什么不能用 ==？

这一章就是为了解答这些问题。我们会先理解 **Java 的 8 种基本数据类型**，再学习变量声明、类型转换，最后搞懂字符串比较的正确姿势。

---

## 1 为什么需要数据类型？

### 痛点分析

想象一下你要开一个餐厅：

- 你需要区分**食材**（蔬菜、肉类、调料）
- 不同的食材需要**不同的存储方式**（冷藏、常温、密封）
- 如果你把所有东西都堆在一起，找东西会很麻烦

编程也是一样。你需要告诉计算机：

- 这个数据是**整数**还是**小数**？
- 这个数据是**单个字符**还是**一串文字**？
- 这个数据是**真/假**还是**数字**？

### Java 的解决方案

Java 是**强类型语言**，每个变量都必须有明确的类型。这样做的好处是：

1. **类型安全**：编译器会检查类型错误，避免运行时出问题
2. **性能优化**：知道类型后，计算机可以分配最合适的内存
3. **代码清晰**：一看类型就知道这个变量存什么

打个比方：

> 就像快递分类——文件、易碎品、液体要分开包装。Java 的数据类型就是给数据"分类包装"，让程序运行更稳定、更高效。

### 对比其他语言

| 语言       | 类型系统   | 特点                                  |
| ---------- | ---------- | ------------------------------------- |
| Python     | 动态类型   | 变量不需要声明类型，灵活但容易出错    |
| JavaScript | 动态类型   | 同上，`let x = 10; x = "hello";` 合法 |
| Java       | 静态强类型 | 必须声明类型，编译时检查，更安全      |

```java
// Python：灵活但可能出错
x = 10      // x 是整数
x = "hello" // 现在 x 变成字符串了，没问题

// Java：严格但安全
int x = 10;      // x 必须是整数
// x = "hello";  // ❌ 编译错误！类型不匹配
```

> **一句话总结**：Java 的强类型系统让错误在编译时就暴露出来，而不是等到运行时才崩溃。

---

## 2 Java 的 8 种基本数据类型

Java 有 **8 种基本数据类型**，分为四大类：

### 整数类型（4 种）

用来存整数（没有小数点的数字）。

| 类型  | 大小   | 范围               | 使用场景                 |
| ----- | ------ | ------------------ | ------------------------ |
| byte  | 1 字节 | -128 ~ 127         | 节省内存，大数组         |
| short | 2 字节 | -32768 ~ 32767     | 较少使用                 |
| int   | 4 字节 | -21亿 ~ 21亿       | **最常用**，默认整数类型 |
| long  | 8 字节 | -922亿亿 ~ 922亿亿 | 超大整数，时间戳         |

```java
// byte — 1 字节，范围 -128 ~ 127
byte maxByte = 127;     // 最大值
byte minByte = -128;    // 最小值
// byte overflow = 128; // ❌ 编译错误：超出范围

// short — 2 字节，范围 -32768 ~ 32767
short maxShort = 32767;

// int — 4 字节，最常用（默认整数类型）
int count = 100;              // 普通整数
int negative = -50;           // 负数
int maxInt = 2147483647;      // 2^31 - 1（约21亿）

// long — 8 字节，必须加 L 或 l 后缀
long population = 7800000000L;  // 全球人口（超过int范围）
long timestamp = System.currentTimeMillis();  // 时间戳
long bigNum = 100_000_000L;     // 可以用下划线分隔（Java 7+），更易读
```

::: warning 新手注意

- `long` 类型字面量建议用大写 `L`，小写 `l` 容易和数字 `1` 混淆
- 整数字面量默认是 `int` 类型，超出范围必须用 `long`

:::

### 浮点类型（2 种）

用来存小数。

| 类型   | 大小   | 精度           | 使用场景                 |
| ------ | ------ | -------------- | ------------------------ |
| float  | 4 字节 | 约7位有效数字  | 节省内存，科学计算       |
| double | 8 字节 | 约15位有效数字 | **最常用**，默认浮点类型 |

```java
// float — 4 字节，必须加 f 或 F 后缀
float rate = 0.618f;       // 黄金比例
float pi = 3.14F;          // 圆周率（精度较低）

// double — 8 字节，默认浮点类型（推荐）
double price = 99.99;      // 价格
double gravity = 9.8;      // 重力加速度
double precise = 3.141592653589793;  // 高精度圆周率
```

::: warning 浮点数精度问题

浮点数有精度问题，不适合用于精确计算（如金额）。

```java
// ❌ 浮点数精度问题
System.out.println(0.1 + 0.2);         // 0.30000000000000004
System.out.println(0.1 + 0.2 == 0.3);  // false

// ✅ 精确计算用 BigDecimal
import java.math.BigDecimal;
BigDecimal a = new BigDecimal("0.1");
BigDecimal b = new BigDecimal("0.2");
System.out.println(a.add(b));  // 0.3
```

:::

### 字符类型（1 种）

用来存单个字符。

```java
// char — 2 字节，使用 Unicode 编码
char letter = 'A';            // 单个字符，用单引号
char chinese = '中';          // 支持中文
char number = '0';            // 字符 '0' 不等于数字 0
char escape = '\n';           // 转义字符（换行）
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

### 布尔类型（1 种）

只有 `true` 和 `false` 两个值。

```java
// boolean — 只有 true 和 false 两个值
boolean isJavaFun = true;     // Java 有趣吗？
boolean isEmpty = false;      // 是空的吗？

// 不能将整数当作布尔值（和 C/C++ 不同）
// boolean b = 1;  // ❌ 编译错误
// boolean b = 0;  // ❌ 编译错误

// 只能使用 true 或 false
boolean isValid = (age >= 18);  // 条件表达式的结果是 boolean
```

---

## 3 引用类型

除 8 种基本类型外，其他都是引用类型。

### String（字符串）

```java
// String — 字符串（最常用的引用类型）
String message = "Hello Java";    // 用双引号
String empty = "";                // 空字符串
String nullStr = null;            // null 表示"没有对象"
```

### 数组

```java
// 数组 — 存储多个同类型的元素
int[] numbers = {1, 2, 3};              // 整数数组
String[] names = {"张三", "李四", "王五"};  // 字符串数组
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

::: warning 重要区别

- **基本类型**：`==` 比较的是**值**
- **引用类型**：`==` 比较的是**内存地址**，`.equals()` 比较的是**内容**

:::

---

## 4 变量声明

Java 是**强类型语言**，变量必须先声明类型再使用。

### 基本语法

```java
// 语法：类型 变量名 = 值;
int age = 25;              // 声明一个整数变量 age，赋值为 25
String name = "张三";       // 声明一个字符串变量 name
double price = 9.99;       // 声明一个双精度浮点变量
boolean isActive = true;   // 声明一个布尔变量
```

### 声明与赋值分离

```java
int age;          // 先声明变量
age = 25;         // 再赋值

double salary;    // 声明
salary = 15000.0; // 赋值
```

### 同时声明多个同类型变量

```java
int a = 1, b = 2, c = 3;        // 一行声明三个 int 变量
double x = 1.1, y = 2.2;        // 一行声明两个 double 变量
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
// var x;  // ❌ 编译错误：没有初始值，无法推断类型
```

::: tip 新手建议

var 虽然方便，但建议初学者先使用显式类型声明，等熟悉 Java 类型系统后再使用 var，这样有助于理解类型。

:::

---

## 5 类型转换

### 自动类型转换（小 → 大）

也称为"隐式转换"或"拓宽转换"，不会丢失数据。

```java
int intValue = 100;

// int → long（自动）
long longValue = intValue;      // 100

// int → double（自动）
double doubleValue = intValue;  // 100.0

// int → float（自动）
float floatValue = intValue;    // 100.0f

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
// int bad = Integer.parseInt("abc");    // ❌ 异常：字符串不是数字
```

---

## 6 常量

使用 `final` 关键字声明常量，一旦赋值不可修改。

```java
// 常量命名规范：全大写，单词间用下划线分隔
final double PI = 3.14159265358979;    // 圆周率
final int MAX_SIZE = 100;              // 最大尺寸
final String APP_NAME = "MyApp";       // 应用名称

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
System.out.println(Constants.PI);        // 3.14159265358979
System.out.println(Constants.MAX_RETRY); // 3
```

---

## 7 变量作用域

```java
public class ScopeDemo {
    static int classVar = 100;    // 类变量（静态变量），整个类共享

    int instanceVar = 200;        // 实例变量（成员变量），每个对象独有

    public void method() {
        int localVar = 300;       // 局部变量，只在方法内有效

        if (true) {
            int blockVar = 400;   // 块级变量，只在代码块内有效
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

---

## 8 新手常见误区

### 误区 1：整数除法得到小数

**错！** 两个整数相除，结果还是整数。

```java
// ❌ 错误认知
System.out.println(7 / 2);       // 输出 3，不是 3.5

// ✅ 正确做法：至少一个操作数转为浮点数
System.out.println(7.0 / 2);     // 3.5
System.out.println(7 / 2.0);     // 3.5
System.out.println((double) 7 / 2);  // 3.5
```

### 误区 2：用 == 比较字符串

**错！** `==` 比较的是内存地址，不是内容。

```java
String s1 = new String("Hello");
String s2 = new String("Hello");

// ❌ 错误
if (s1 == s2) {  // false，因为地址不同
    System.out.println("相等");
}

// ✅ 正确
if (s1.equals(s2)) {  // true，内容相同
    System.out.println("相等");
}
```

### 误区 3：浮点数精确计算

**错！** 浮点数有精度问题，不能用于精确计算。

```java
// ❌ 错误
double total = 0.1 + 0.2;  // 0.30000000000000004
if (total == 0.3) {  // false！
    System.out.println("相等");
}

// ✅ 正确：使用 BigDecimal
import java.math.BigDecimal;
BigDecimal a = new BigDecimal("0.1");
BigDecimal b = new BigDecimal("0.2");
BigDecimal total = a.add(b);  // 精确的 0.3
```

### 误区 4：long 类型不加 L

**错！** long 类型的字面量必须加 `L` 后缀。

```java
// ❌ 错误
long population = 7800000000;  // 编译错误：数字超出 int 范围

// ✅ 正确
long population = 7800000000L;  // 加上 L 后缀
```

### 误区 5：char 和 String 混用

**错！** `char` 是单个字符，用单引号；`String` 是字符串，用双引号。

```java
// ❌ 错误
char c = "A";      // 编译错误：双引号是 String
String s = 'Hello'; // 编译错误：单引号是 char

// ✅ 正确
char c = 'A';      // 单个字符
String s = "Hello"; // 字符串
```

---

## 9 动手练习

### 练习 1：基础练习 —— 数据类型判断

编写程序，声明以下变量并输出它们的值和类型：

- 你的年龄（整数）
- 你的身高（小数，单位米）
- 你的姓名（字符串）
- 是否是学生（布尔值）

<details>
<summary>点击查看答案</summary>

```java
// DataTypeDemo.java
public class DataTypeDemo {
    public static void main(String[] args) {
        // 声明变量
        int age = 25;                    // 年龄
        double height = 1.75;            // 身高（米）
        String name = "张三";             // 姓名
        boolean isStudent = true;        // 是否学生

        // 输出信息
        System.out.println("姓名：" + name);
        System.out.println("年龄：" + age + " 岁");
        System.out.println("身高：" + height + " 米");
        System.out.println("是否学生：" + isStudent);
    }
}
```

</details>

### 练习 2：进阶练习 —— 温度转换

编写程序，将摄氏温度转换为华氏温度。公式：F = C × 9/5 + 32

<details>
<summary>点击查看答案</summary>

```java
// TemperatureConverter.java
public class TemperatureConverter {
    public static void main(String[] args) {
        // 摄氏温度
        double celsius = 25.0;

        // 转换为华氏温度
        double fahrenheit = celsius * 9.0 / 5.0 + 32;

        // 输出结果
        System.out.println("摄氏温度：" + celsius + "°C");
        System.out.println("华氏温度：" + fahrenheit + "°F");
    }
}
```

</details>

### 练习 3（挑战）：综合练习 —— 购物车计算

编写程序，计算购物车中商品的总价。假设有以下商品：

- 苹果：5.5 元/斤，买了 3 斤
- 牛奶：12.0 元/盒，买了 2 盒
- 面包：8.5 元/个，买了 1 个

输出每种商品的金额和总价。

<details>
<summary>点击查看答案</summary>

```java
// ShoppingCart.java
public class ShoppingCart {
    public static void main(String[] args) {
        // 商品价格和数量
        double applePrice = 5.5;
        int appleQuantity = 3;

        double milkPrice = 12.0;
        int milkQuantity = 2;

        double breadPrice = 8.5;
        int breadQuantity = 1;

        // 计算每种商品的金额
        double appleTotal = applePrice * appleQuantity;
        double milkTotal = milkPrice * milkQuantity;
        double breadTotal = breadPrice * breadQuantity;

        // 计算总价
        double grandTotal = appleTotal + milkTotal + breadTotal;

        // 输出结果
        System.out.println("苹果：" + applePrice + " × " + appleQuantity + " = " + appleTotal + " 元");
        System.out.println("牛奶：" + milkPrice + " × " + milkQuantity + " = " + milkTotal + " 元");
        System.out.println("面包：" + breadPrice + " × " + breadQuantity + " = " + breadTotal + " 元");
        System.out.println("====================");
        System.out.println("总价：" + grandTotal + " 元");
    }
}
```

</details>

---

## 10 核心知识点

| 知识点       | 说明                                                 |
| ------------ | ---------------------------------------------------- |
| 8 种基本类型 | byte、short、int、long、float、double、char、boolean |
| 强类型语言   | 变量必须先声明类型，编译器严格检查                   |
| 类型转换     | 小 → 大自动转换，大 → 小需要强制转换                 |
| 浮点精度     | 浮点数不适合精确计算，使用 `BigDecimal`              |
| 字符串比较   | 用 `.equals()` 而不是 `==`                           |
| 常量         | 使用 `final` 声明，命名全大写                        |

---

## 下一章预告

下一章我们会学习 **运算符**——Java 的各种操作符。你会学到算术运算符、比较运算符、逻辑运算符、位运算符等，以及它们的优先级和短路特性。这些是编写表达式的基础。

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
