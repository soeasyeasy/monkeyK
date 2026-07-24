---
title: '第三章：运算符'
description: '算术、比较、逻辑、位运算符'
---

# 第三章：运算符

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

## 本章小结

本章学习了 Java 的各种运算符。特别注意整数除法的截断行为、逻辑运算符的短路特性，以及 `==` 和 `.equals()` 的区别。接下来我们将学习条件语句。
