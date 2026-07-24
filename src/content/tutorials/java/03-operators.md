---
title: '第三章：运算符'
description: '算术、比较、逻辑、位运算符'
---

# 第三章：运算符

## 本章导读

在学这一章之前,你可能会有这些疑问:

- 运算符这么多,我该怎么记住它们?
- 为什么 7 除以 2 等于 3 而不是 3.5?
- `==` 和 `equals()` 有什么区别?为什么字符串比较不能用 `==`?
- 什么是短路?为什么逻辑运算符还要"短路"?

这一章就是为了解答这些问题。我们会先搞清楚 **运算符的分类和用法**,再通过大量代码示例帮你理解每个运算符的实际应用场景。学完这章,你就能熟练运用各种运算符编写 Java 程序了。

---

## 3.1 为什么需要运算符?

### 痛点分析

想象一下,如果没有运算符,你要计算两个数的和该怎么办?可能需要调用复杂的数学库,或者自己写一堆底层代码。这就像你想用计算器算账,却要先学会制造计算器一样荒谬。

**生活类比**:运算符就像数学课上学到的加减乘除符号。没有这些符号,你只能写"把 5 和 3 加起来",但有了"+",你直接写"5+3"就行了。运算符让程序能像数学公式一样简洁地表达计算逻辑。

### 代码对比

```java
// ❌ 没有运算符的世界(伪代码)
calculate("add", 5, 3)  // 需要调用函数,繁琐

// ✅ 有运算符的世界
5 + 3  // 简洁直观
```

> **一句话总结**:运算符是编程语言的基础工具,让代码更简洁、更易读。

---

## 3.2 核心原理

### 概念解释

运算符是告诉编译器或解释器执行特定数学或逻辑操作的符号。你可以把它们想象成**指令标签**:

- **算术运算符**(+、-、\*、/):像计算器,执行数学运算
- **比较运算符**(==、>、<):像裁判,比较两个值的大小关系
- **逻辑运算符**(&&、||、!):像决策者,组合多个条件做判断
- **位运算符**(&、|、^):像显微镜,直接操作二进制位(底层操作)

打个比方:

> 运算符就像厨房里的工具。算术运算符是菜刀(切菜),比较运算符是秤(称重量),逻辑运算符是过滤器(筛选食材),位运算符是分子料理工具(精细操作)。每种工具都有特定用途,组合使用就能做出各种菜肴。

### 运算符分类对比

| 运算符类型 | 作用       | 生活类比 | 常用场景           |
| ---------- | ---------- | -------- | ------------------ |
| 算术运算符 | 数学计算   | 计算器   | 求和、求差、取余   |
| 比较运算符 | 比较大小   | 裁判     | 判断条件、循环控制 |
| 逻辑运算符 | 组合条件   | 决策者   | 复杂条件判断       |
| 赋值运算符 | 赋值操作   | 贴标签   | 简化赋值代码       |
| 三元运算符 | 条件选择   | 选择题   | 简单的 if-else     |
| 位运算符   | 二进制操作 | 显微镜   | 底层优化、权限控制 |

---

## 运行结果

| 运算符类型 | 运算符            | 示例                        |
| ---------- | ----------------- | --------------------------- |
| 算术       | + - \* / % ++ --  | `10 / 3 = 3`（整数除法）    |
| 比较       | == != > < >= <=   | `5 > 3 → true`              |
| 逻辑       | && \|\| !         | `true && false → false`     |
| 赋值       | = += -= \*= /= %= | `a += 5` 等价于 `a = a + 5` |
| 三元       | ?:                | `x > 0 ? "正" : "非正"`     |
| 位运算     | & \| ^ ~ << >>    | `5 & 3 = 1`                 |

## 算术运算符

```java
int a = 10, b = 3;

System.out.println(a + b);   // 13    加法
System.out.println(a - b);   // 7     减法
System.out.println(a * b);   // 30    乘法
System.out.println(a / b);   // 3     除法（整数除法，截断小数）
System.out.println(a % b);   // 1     取余（模运算）

// 浮点除法
double x = 10.0;
System.out.println(x / b);   // 3.3333333333333335
System.out.println(x % b);   // 1.0
```

::: warning 整数除法陷阱

```java
// 两个整数相除，结果还是整数（截断小数）
System.out.println(7 / 2);       // 3（不是 3.5）
System.out.println(1 / 3);       // 0（不是 0.333...）

// 解决方案：至少一个操作数转为浮点数
System.out.println(7.0 / 2);     // 3.5
System.out.println(7 / 2.0);     // 3.5
System.out.println((double) 7 / 2);  // 3.5
```

:::

### 取余运算

```java
// 取余（模运算）：返回除法的余数
System.out.println(10 % 3);    // 1
System.out.println(10 % 5);    // 0
System.out.println(7 % 2);     // 1

// 负数取余（结果的符号与被除数相同）
System.out.println(-10 % 3);   // -1
System.out.println(10 % -3);   // 1

// 常见用途：判断奇偶、整除
int n = 7;
if (n % 2 == 0) {
    System.out.println("偶数");
} else {
    System.out.println("奇数");    // 输出：奇数
}
```

### 自增与自减

```java
int i = 5;
i++;    // i = 6（等价于 i = i + 1）
i--;    // i = 5（等价于 i = i - 1）

// 前缀 vs 后缀 — 重要区别
int j = 5;

// 后缀 ++：先用后加
int a1 = j++;   // a1 = 5（先用 j 的值），然后 j = 6

// 前缀 ++：先加后用
int a2 = ++j;   // 先 j = 7，然后 a2 = 7（用 j 的新值）

System.out.println("a1 = " + a1);  // 5
System.out.println("a2 = " + a2);  // 7
System.out.println("j = " + j);    // 7
```

::: tip
前缀和后缀的区别在单独使用时没有意义，但在表达式中赋值时非常关键。建议避免在复杂表达式中使用 `++` 和 `--`，单独一行使用更清晰。
:::

## 比较运算符

比较结果为 `boolean` 类型（`true` 或 `false`）。

```java
int x = 10, y = 20;

System.out.println(x == y);   // false   等于
System.out.println(x != y);   // true    不等于
System.out.println(x > y);    // false   大于
System.out.println(x < y);    // true    小于
System.out.println(x >= y);   // false   大于等于
System.out.println(x <= y);   // true    小于等于
```

::: warning == 与 equals 的区别

```java
// == 比较基本类型时比较值，比较引用类型时比较地址
int a = 10, b = 10;
System.out.println(a == b);           // true（值相同）

String s1 = new String("Hello");
String s2 = new String("Hello");
System.out.println(s1 == s2);         // false（不同对象）
System.out.println(s1.equals(s2));    // true（内容相同）
```

:::

## 逻辑运算符

```java
boolean a = true, b = false;

System.out.println(a && b);   // false   短路与（AND）
System.out.println(a || b);   // true    短路或（OR）
System.out.println(!a);       // false   非（NOT）

// 真值表
// A     B     A && B   A || B   !A
// true  true  true     true     false
// true  false false    true     false
// false true  false    true     true
// false false false    false    true
```

### 短路特性

`&&` 和 `||` 具有**短路特性**：如果左边已经能确定结果，右边不会执行。

```java
// && 短路：左边为 false 时，右边不执行
int x = 5;
boolean result = (x > 10) && (x++ > 5);
// 左边 x > 10 为 false，短路，x++ 不执行
// result = false, x 仍为 5
System.out.println("x = " + x);       // 5
System.out.println("result = " + result);  // false

// || 短路：左边为 true 时，右边不执行
int y = 5;
boolean result2 = (y < 10) || (y++ > 5);
// 左边 y < 10 为 true，短路，y++ 不执行
// result2 = true, y 仍为 5
System.out.println("y = " + y);       // 5
System.out.println("result2 = " + result2);  // true
```

### 短路的实际应用

```java
String name = null;

// 利用短路避免 NullPointerException
if (name != null && name.length() > 0) {
    System.out.println(name);
}
// name != null 为 false，短路，不会执行 name.length()

// 如果不短路会怎样？
// if (name != null & name.length() > 0) {  // & 不短路
//     // ❌ NullPointerException
// }
```

::: tip
`&` 和 `|` 也可以做逻辑运算，但**不短路**（两边都会执行）。实际开发中几乎总是使用 `&&` 和 `||`。
:::

## 赋值运算符

```java
int a = 10;
a += 5;    // a = a + 5  → 15
a -= 3;    // a = a - 3  → 12
a *= 2;    // a = a * 2  → 24
a /= 4;    // a = a / 4  → 6
a %= 4;    // a = a % 4  → 2

// 复合赋值运算符包含隐式类型转换
byte b = 10;
// b = b + 1;    // ❌ 编译错误：b + 1 是 int，不能赋给 byte
b += 1;          // ✅ 等价于 b = (byte)(b + 1)
```

## 三元运算符

三元运算符是 `if-else` 的简写形式。

```java
// 语法：条件 ? 值1 : 值2
int age = 20;
String status = (age >= 18) ? "成年" : "未成年";
// status = "成年"

// 求最大值
int a = 10, b = 20;
int max = (a > b) ? a : b;
// max = 20

// 嵌套三元（不推荐，可读性差）
int score = 85;
String level = (score >= 90) ? "A" :
               (score >= 80) ? "B" :
               (score >= 60) ? "C" : "D";
// level = "B"
```

## 位运算符

位运算直接操作二进制位，在实际业务开发中较少使用，但在底层开发和算法中很重要。

```java
int a = 5;    // 二进制 0101
int b = 3;    // 二进制 0011

System.out.println(a & b);    // 1   (0001) 按位与：都为 1 才为 1
System.out.println(a | b);    // 7   (0111) 按位或：有 1 就为 1
System.out.println(a ^ b);    // 6   (0110) 按位异或：不同才为 1
System.out.println(~a);       // -6  (1010) 按位取反

// 位移运算
System.out.println(a << 1);   // 10  (1010) 左移 1 位（相当于 ×2）
System.out.println(a >> 1);   // 2   (0010) 右移 1 位（相当于 ÷2）
System.out.println(a << 2);   // 20  (10100) 左移 2 位（相当于 ×4）
```

### 位运算的实际应用

```java
// 判断奇偶（比 % 2 更高效）
int n = 7;
if ((n & 1) == 1) {
    System.out.println("奇数");    // 输出：奇数
}

// 交换两个数（不使用临时变量）
int x = 3, y = 5;
x = x ^ y;
y = x ^ y;
x = x ^ y;
System.out.println("x=" + x + ", y=" + y);  // x=5, y=3

// 获取某一位的值
int flags = 0b1010;  // 二进制
boolean bit2 = ((flags >> 1) & 1) == 1;  // 获取第 2 位
System.out.println(bit2);  // true
```

## 运算符优先级

| 优先级 | 运算符                 | 结合性 |
| ------ | ---------------------- | ------ |
| 1      | `()` 括号              | 左到右 |
| 2      | `!` `~` `++` `--` 一元 | 右到左 |
| 3      | `*` `/` `%` 乘除取余   | 左到右 |
| 4      | `+` `-` 加减           | 左到右 |
| 5      | `<<` `>>` 位移         | 左到右 |
| 6      | `<` `<=` `>` `>=` 比较 | 左到右 |
| 7      | `==` `!=` 相等         | 左到右 |
| 8      | `&` 按位与             | 左到右 |
| 9      | `^` 按位异或           | 左到右 |
| 10     | `\|` 按位或            | 左到右 |
| 11     | `&&` 逻辑与            | 左到右 |
| 12     | `\|\|` 逻辑或          | 左到右 |
| 13     | `?:` 三元              | 右到左 |
| 14     | `=` `+=` `-=` 赋值     | 右到左 |

::: tip
优先级记不住没关系，**使用括号明确优先级**是最好的实践。

```java
// 不推荐：依赖优先级
int result = a + b * c > d ? e : f;

// 推荐：使用括号明确
int result2 = ((a + (b * c)) > d) ? e : f;
```

:::

## 核心知识点

1. **整数除法截断**：`7 / 2 = 3`，不是 `3.5`
2. **前缀 vs 后缀**：`++i` 先加后用，`i++` 先用后加
3. **短路特性**：`&&` 和 `||` 左边能确定结果时右边不执行
4. **字符串比较**：用 `.equals()` 而不是 `==`
5. **位运算**：直接操作二进制位，`& 1` 判断奇偶，`<< 1` 乘以 2

---

## 新手常见误区

### 误区 1："整数除法会自动四舍五入"

**错！** 整数除法是**截断小数**，不是四舍五入。

```java
// ❌ 错误理解
System.out.println(7 / 2);  // 输出 3，不是 4（不会四舍五入）
System.out.println(9 / 10); // 输出 0，不是 1

// ✅ 正确做法：需要小数结果时，至少一个操作数转为浮点数
System.out.println(7.0 / 2);     // 3.5
System.out.println((double) 7 / 2);  // 3.5
```

### 误区 2："字符串可以用 == 比较内容"

**错！** `==` 比较引用类型时比较的是**对象地址**，不是内容。

```java
String s1 = new String("Hello");
String s2 = new String("Hello");

// ❌ 错误写法
System.out.println(s1 == s2);      // false（地址不同）

// ✅ 正确写法
System.out.println(s1.equals(s2)); // true（内容相同）
```

### 误区 3："i++ 和 ++i 没有区别"

**错！** 在赋值表达式中，它们的区别非常大。

```java
int a = 5;
int b = a++;  // b = 5（先用 a 的值），然后 a = 6

int c = 5;
int d = ++c;  // c 先变成 6，然后 d = 6（用 c 的新值）

// ✅ 建议：避免在复杂表达式中使用 ++，单独一行使用更清晰
int x = 5;
x++;  // 这样写更清楚
```

### 误区 4："&& 和 & 是一样的"

**错！** `&&` 有短路特性，`&` 没有。

```java
int x = 5;

// ✅ 使用 &&（短路）
boolean r1 = (x > 10) && (x++ > 5);
// x > 10 为 false，短路，x++ 不执行，x 仍为 5

// ❌ 使用 &（不短路）
boolean r2 = (x > 10) & (x++ > 5);
// 两边都会执行，x++ 会执行，x 变成 6

// ✅ 实际开发中几乎总是使用 && 和 ||
```

### 误区 5："位运算很常用"

**不是的。** 位运算在**业务开发中较少使用**，主要在底层开发、算法优化、权限控制等场景使用。新手先掌握算术、比较、逻辑运算符就够用了。

---

## 动手练习

### 练习 1：基础练习 - 温度转换

编写程序，将摄氏温度转换为华氏温度。公式：F = C × 9/5 + 32

要求：

- 输入摄氏温度（整数）
- 输出华氏温度（保留一位小数）
- 注意整数除法陷阱

<details>
<summary>点击查看答案</summary>

```java
import java.util.Scanner;

public class TemperatureConverter {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        // 输入摄氏温度
        System.out.print("请输入摄氏温度：");
        int celsius = scanner.nextInt();

        // 转换为华氏温度（注意：9/5 是整数除法，结果为 1）
        // 需要至少一个操作数转为浮点数
        double fahrenheit = celsius * 9.0 / 5 + 32;

        // 输出结果，保留一位小数
        System.out.printf("华氏温度：%.1f\n", fahrenheit);

        scanner.close();
    }
}
```

**测试用例**：

- 输入 0，输出 32.0
- 输入 100，输出 212.0
- 输入 37，输出 98.6

</details>

### 练习 2：进阶练习 - 判断闰年

编写程序，判断给定年份是否为闰年。

闰年规则：

- 能被 4 整除但不能被 100 整除
- 或者能被 400 整除

要求：

- 使用逻辑运算符组合条件
- 利用短路特性优化代码

<details>
<summary>点击查看答案</summary>

```java
import java.util.Scanner;

public class LeapYearChecker {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        System.out.print("请输入年份：");
        int year = scanner.nextInt();

        // 判断闰年
        // 规则1：能被 4 整除但不能被 100 整除
        // 规则2：或者能被 400 整除
        boolean isLeap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);

        // 输出结果
        if (isLeap) {
            System.out.println(year + " 年是闰年");
        } else {
            System.out.println(year + " 年是平年");
        }

        scanner.close();
    }
}
```

**测试用例**：

- 2000 年：闰年（能被 400 整除）
- 1900 年：平年（能被 100 整除但不能被 400 整除）
- 2024 年：闰年（能被 4 整除但不能被 100 整除）
- 2023 年：平年（不能被 4 整除）

</details>

### 练习 3（挑战）：综合练习 - 简易计算器

编写一个简易计算器程序，支持加减乘除四种运算。

要求：

- 输入两个操作数和一个运算符（+、-、\*、/）
- 使用 switch 或三元运算符处理不同运算
- 处理除数为 0 的情况
- 输出计算结果

<details>
<summary>点击查看答案</summary>

```java
import java.util.Scanner;

public class SimpleCalculator {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        // 输入操作数
        System.out.print("请输入第一个数：");
        double num1 = scanner.nextDouble();

        System.out.print("请输入运算符（+、-、*、/）：");
        char operator = scanner.next().charAt(0);

        System.out.print("请输入第二个数：");
        double num2 = scanner.nextDouble();

        // 计算结果
        double result;
        boolean isValid = true;

        switch (operator) {
            case '+':
                result = num1 + num2;
                break;
            case '-':
                result = num1 - num2;
                break;
            case '*':
                result = num1 * num2;
                break;
            case '/':
                // 处理除数为 0 的情况
                if (num2 == 0) {
                    System.out.println("错误：除数不能为 0");
                    isValid = false;
                    result = 0;
                } else {
                    result = num1 / num2;
                }
                break;
            default:
                System.out.println("错误：不支持的运算符");
                isValid = false;
                result = 0;
        }

        // 输出结果
        if (isValid) {
            System.out.println(num1 + " " + operator + " " + num2 + " = " + result);
        }

        scanner.close();
    }
}
```

**测试用例**：

- 输入 10 + 5，输出 15.0
- 输入 10 / 0，输出"错误：除数不能为 0"
- 输入 10 \* 3，输出 30.0
- 输入 10 % 3，输出"错误：不支持的运算符"

</details>

---

## 下一章预告

下一章我们会学习 **条件语句** ——也就是让程序根据不同情况做不同事情的控制结构。你会学到：

- 如何使用 `if-else` 做条件判断
- 如何使用 `switch` 处理多分支选择
- 如何使用三元表达式简化代码
- Java 14+ 的增强 switch 语法

这些知识将帮助你编写更智能、更灵活的程序。准备好了吗？让我们继续前进！

---

## 本章小结

本章学习了 Java 的各种运算符。特别注意整数除法的截断行为、逻辑运算符的短路特性，以及 `==` 和 `.equals()` 的区别。接下来我们将学习条件语句。
