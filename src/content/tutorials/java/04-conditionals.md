---
title: '第四章：条件语句'
description: 'if-else、switch、三元表达式'
---

# 第四章：条件语句

## 本章导读

在学这一章之前，你可能会有这些疑问：

- `if-else` 和 `switch` 到底该用哪个？
- 为什么 `switch` 里必须写 `break`？忘了会怎样？
- 三元表达式看起来很简洁，但什么时候该用、什么时候不该用？
- Java 14+ 的增强 `switch` 和传统 `switch` 有什么区别？

这一章就是为了解答这些问题。我们会先搞清楚 **三种条件语句的适用场景**，再通过大量实例帮你掌握条件判断的写法。学完这章，你就能让程序根据不同情况做出不同的响应了。

---

## 1 为什么需要条件语句？

### 痛点分析

想象你去餐厅吃饭，服务员问你："要米饭还是面条？"你根据回答做不同的事。如果程序没有条件语句，它就像一个只会做一件事的机器人——不管你输入什么，它都执行同样的代码。

**生活类比**：条件语句就像你每天做的决策。"如果下雨，就带伞；否则，戴墨镜。"程序也需要这种能力来根据不同输入做出不同响应。

### 代码对比

```java
// ❌ 没有条件语句：不管成绩如何，都输出"及格"
int score = 30;
System.out.println("及格");  // 30分也输出及格，显然不对

// ✅ 有条件语句：根据成绩判断
if (score >= 60) {
    System.out.println("及格");
} else {
    System.out.println("不及格");  // 30分 → 不及格 ✅
}
```

> **一句话总结**：条件语句让程序有了"判断力"，能根据不同情况执行不同代码。

---

## 2 核心原理

### 概念解释

条件语句的本质是**分支选择**。程序在执行时遇到条件判断，就像走到一个岔路口：

- `if-else`：像一个检查站，根据条件决定走哪条路
- `switch`：像一个多岔路口，根据值选择对应的方向
- 三元表达式：像一个简易开关，二选一的快捷方式

打个比方：

> 条件语句就像自动售货机。你按不同的按钮（条件），机器就给你不同的饮料（执行不同的代码）。`if-else` 是万能售货机，什么判断都能做；`switch` 是专用售货机，只能按固定按钮选饮料；三元表达式是迷你售货机，只能二选一。

### 对比分析

| 特性     | if-else            | switch           | 三元表达式       |
| -------- | ------------------ | ---------------- | ---------------- |
| 适用场景 | 范围判断、复杂条件 | 固定值等值匹配   | 简单的二选一     |
| 条件类型 | boolean 表达式     | 单个值的等值比较 | boolean 表达式   |
| 分支数量 | 任意多个           | 任意多个         | 只能两个         |
| 可读性   | 条件多时可读性下降 | 分支多时结构清晰 | 简洁，但嵌套后差 |
| 性能     | 逐个判断           | 跳转表（更快）   | 与 if-else 相同  |

---

## 运行结果

| 语句类型    | 适用场景               | 特点                     |
| ----------- | ---------------------- | ------------------------ |
| if-else     | 范围判断、复杂条件     | 最灵活，支持任意条件     |
| switch      | 等值判断、多分支       | 结构清晰，适合固定值匹配 |
| 三元        | 简单二选一             | 简洁，适合赋值           |
| 增强 switch | 表达式赋值（Java 14+） | 无需 break，可返回值     |

## if 语句

### 基本形式

```java
int score = 85;

if (score >= 90) {
    System.out.println("优秀");
} else if (score >= 80) {
    System.out.println("良好");    // ← 输出这行
} else if (score >= 60) {
    System.out.println("及格");
} else {
    System.out.println("不及格");
}
```

### if 执行流程

```
条件1 → true → 执行代码块1 → 结束
  ↓ false
条件2 → true → 执行代码块2 → 结束
  ↓ false
条件3 → true → 执行代码块3 → 结束
  ↓ false
执行 else 代码块 → 结束
```

### 单分支

```java
int temperature = 35;

if (temperature > 30) {
    System.out.println("天气炎热，注意防暑");
}
```

### 双分支

```java
int age = 20;

if (age >= 18) {
    System.out.println("成年人");
} else {
    System.out.println("未成年人");
}
```

### 多分支

```java
int score = 85;

if (score >= 90) {
    System.out.println("A");
} else if (score >= 80) {
    System.out.println("B");    // ← 输出
} else if (score >= 70) {
    System.out.println("C");
} else if (score >= 60) {
    System.out.println("D");
} else {
    System.out.println("F");
}
```

::: tip
`if-else if-else` 链中，一旦某个条件为 `true`，后续条件不再判断。因此要注意条件的**顺序**，通常把范围更小的放前面。
:::

## 嵌套 if

```java
int age = 25;
boolean hasTicket = true;

if (age >= 18) {
    if (hasTicket) {
        System.out.println("可以入场");    // ← 输出
    } else {
        System.out.println("请购票");
    }
} else {
    System.out.println("未成年人需家长陪同");
}
```

### 实际案例：BMI 计算

```java
double height = 1.75;  // 身高（米）
double weight = 70;    // 体重（公斤）

double bmi = weight / (height * height);
System.out.println("BMI: " + String.format("%.1f", bmi));

if (bmi < 18.5) {
    System.out.println("偏瘦");
} else if (bmi < 24) {
    System.out.println("正常");
} else if (bmi < 28) {
    System.out.println("偏胖");
} else {
    System.out.println("肥胖");
}
// BMI: 22.9
// 正常
```

## switch 语句

### 传统 switch

```java
int day = 3;

switch (day) {
    case 1:
        System.out.println("星期一");
        break;
    case 2:
        System.out.println("星期二");
        break;
    case 3:
        System.out.println("星期三");    // ← 输出
        break;
    case 4:
        System.out.println("星期四");
        break;
    case 5:
        System.out.println("星期五");
        break;
    default:
        System.out.println("周末");
        break;
}
```

::: warning 不要忘记 break
如果忘记写 `break`，程序会**穿透**到下一个 case 继续执行，这通常是 bug。

```java
int x = 1;
switch (x) {
    case 1:
        System.out.println("一");    // ← 输出
        // 忘记 break，穿透！
    case 2:
        System.out.println("二");    // ← 也会输出
    case 3:
        System.out.println("三");    // ← 也会输出
        break;
}
// 输出：一 二 三
```

:::

### 穿透特性的巧妙利用

```java
// 利用穿透实现多值匹配
int month = 2;

switch (month) {
    case 12: case 1: case 2:
        System.out.println("冬季");    // ← 输出
        break;
    case 3: case 4: case 5:
        System.out.println("春季");
        break;
    case 6: case 7: case 8:
        System.out.println("夏季");
        break;
    case 9: case 10: case 11:
        System.out.println("秋季");
        break;
    default:
        System.out.println("无效月份");
}
```

### switch 支持的类型

| Java 版本 | 支持的类型             |
| --------- | ---------------------- |
| Java 1.0  | byte、short、int、char |
| Java 5    | 枚举（enum）           |
| Java 7    | String                 |

```java
// String 匹配
String fruit = "apple";

switch (fruit) {
    case "apple":
        System.out.println("苹果 🍎");
        break;
    case "banana":
        System.out.println("香蕉 🍌");
        break;
    case "orange":
        System.out.println("橙子 🍊");
        break;
    default:
        System.out.println("未知水果");
}

// ⚠️ switch 不支持 long、float、double、boolean
```

::: warning String switch 注意 null

```java
String s = null;
// switch (s) { ... }  // ❌ NullPointerException！
// 建议先判空
if (s != null) {
    switch (s) { ... }
}
```

:::

### 增强 switch（Java 14+）

```java
int day = 3;

// 使用箭头语法，无需 break
switch (day) {
    case 1, 2, 3, 4, 5 -> System.out.println("工作日");
    case 6, 7           -> System.out.println("周末");
    default             -> System.out.println("未知");
}
// 输出：工作日
```

### 增强 switch 作为表达式

```java
int day = 3;

// switch 表达式可以返回值
String type = switch (day) {
    case 1, 2, 3, 4, 5 -> "工作日";
    case 6, 7           -> "周末";
    default             -> "未知";
};
System.out.println(type);  // 工作日

// 使用 yield 返回值（用于代码块形式）
int numLetters = switch (type) {
    case "工作日" -> {
        int len = type.length();
        yield len;    // yield 返回值
    }
    case "周末" -> 2;
    default -> 0;
};
```

## 三元表达式

三元运算符是 `if-else` 的简写形式。

```java
// 语法：条件 ? 值1 : 值2

int a = 10, b = 20;
int max = (a > b) ? a : b;
// max = 20

// 等价于
int max2;
if (a > b) {
    max2 = a;
} else {
    max2 = b;
}

// 实际应用场景
int age = 20;
String status = (age >= 18) ? "成年" : "未成年";

// 输出格式化
int score = 85;
String result = (score >= 60) ? "及格(" + score + "分)" : "不及格(" + score + "分)";
System.out.println(result);  // 及格(85分)
```

::: warning
嵌套三元表达式可读性很差，建议超过一层嵌套就改用 `if-else`。

```java
// ❌ 不推荐
String level = (score >= 90) ? "A" : (score >= 80) ? "B" : (score >= 60) ? "C" : "D";

// ✅ 推荐
String level;
if (score >= 90) level = "A";
else if (score >= 80) level = "B";
else if (score >= 60) level = "C";
else level = "D";
```

:::

## 模式匹配（Java 16+）

```java
Object obj = "Hello, Java";

// instanceof 模式匹配
if (obj instanceof String s) {
    // 自动转型为 String，无需手动 (String) obj
    System.out.println(s.length());    // 12
    System.out.println(s.toUpperCase());  // HELLO, JAVA
}

// 在条件中使用
String result = (obj instanceof String s && s.length() > 5) ? s.substring(0, 5) : "too short";
System.out.println(result);  // Hello
```

## 核心知识点

1. **if-else**：最灵活的条件语句，支持范围判断和复杂条件
2. **switch**：适合固定值的等值匹配，结构清晰
3. **break 不能忘**：传统 switch 中每个 case 后都要 `break`
4. **增强 switch**：Java 14+ 引入箭头语法，无需 break，可以返回值
5. **三元表达式**：适合简单的二选一赋值场景
6. **模式匹配**：Java 16+ 的 `instanceof` 模式匹配简化类型转换

---

## 新手常见误区

### 误区 1："switch 里忘记写 break"

**这是最常见的 bug！** 忘记 `break` 会导致"穿透"，程序会继续执行下一个 case 的代码。

```java
int day = 1;

// ❌ 错误写法：忘记 break
switch (day) {
    case 1:
        System.out.println("星期一");  // 输出这行
        // 忘记 break，穿透！
    case 2:
        System.out.println("星期二");  // 也会输出
    case 3:
        System.out.println("星期三");  // 也会输出
        break;
}
// 输出：星期一 星期二 星期三（显然不对）

// ✅ 正确写法：每个 case 后都加 break
switch (day) {
    case 1:
        System.out.println("星期一");
        break;
    case 2:
        System.out.println("星期二");
        break;
    case 3:
        System.out.println("星期三");
        break;
}
```

### 误区 2："if-else if 的顺序不重要"

**错！** `if-else if` 的顺序非常重要。一旦某个条件为 true，后续条件不再判断。

```java
int score = 85;

// ❌ 错误写法：顺序不对
if (score >= 60) {
    System.out.println("及格");  // 输出这行
} else if (score >= 80) {
    System.out.println("良好");  // 不会执行
} else if (score >= 90) {
    System.out.println("优秀");  // 不会执行
}

// ✅ 正确写法：范围小的放前面
if (score >= 90) {
    System.out.println("优秀");
} else if (score >= 80) {
    System.out.println("良好");  // 输出这行 ✅
} else if (score >= 60) {
    System.out.println("及格");
}
```

### 误区 3："三元表达式可以替代所有 if-else"

**不是的。** 三元表达式只适合简单的二选一赋值场景，复杂逻辑还是用 `if-else`。

```java
// ✅ 适合三元表达式
int max = (a > b) ? a : b;

// ❌ 不适合三元表达式：嵌套太多，可读性差
String level = (score >= 90) ? "A" : (score >= 80) ? "B" : (score >= 60) ? "C" : "D";

// ✅ 复杂逻辑用 if-else
String level;
if (score >= 90) {
    level = "A";
} else if (score >= 80) {
    level = "B";
} else if (score >= 60) {
    level = "C";
} else {
    level = "D";
}
```

### 误区 4："switch 可以用任意类型"

**不是的。** `switch` 只支持特定的类型：byte、short、int、char、enum、String（Java 7+）。不支持 long、float、double、boolean。

```java
// ❌ 编译错误：switch 不支持 long
long num = 10;
switch (num) {  // 编译错误
    case 1: break;
}

// ❌ 编译错误：switch 不支持 String（Java 6 及以前）
// Java 7+ 才支持 String

// ✅ 正确：使用 int 或 String（Java 7+）
int day = 1;
switch (day) { ... }

String fruit = "apple";
switch (fruit) { ... }  // Java 7+ 支持
```

### 误区 5："String switch 不需要判空"

**错！** 如果 switch 的 String 变量为 null，会抛出 `NullPointerException`。

```java
String s = null;

// ❌ 危险写法
switch (s) {  // NullPointerException！
    case "hello": break;
}

// ✅ 安全写法：先判空
if (s != null) {
    switch (s) {
        case "hello": break;
    }
}
```

---

## 动手练习

### 练习 1：基础练习 - 成绩等级判断

编写程序，根据分数输出等级：

- 90-100：A（优秀）
- 80-89：B（良好）
- 70-79：C（中等）
- 60-69：D（及格）
- 0-59：F（不及格）

要求：

- 使用 `if-else if-else` 结构
- 注意条件的顺序

<details>
<summary>点击查看答案</summary>

```java
import java.util.Scanner;

public class GradeChecker {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        // 输入成绩
        System.out.print("请输入成绩（0-100）：");
        int score = scanner.nextInt();

        // 判断成绩是否有效
        if (score < 0 || score > 100) {
            System.out.println("成绩无效，请输入 0-100 之间的数字");
        } else {
            // 判断等级（注意顺序：从高到低）
            String grade;
            if (score >= 90) {
                grade = "A（优秀）";
            } else if (score >= 80) {
                grade = "B（良好）";
            } else if (score >= 70) {
                grade = "C（中等）";
            } else if (score >= 60) {
                grade = "D（及格）";
            } else {
                grade = "F（不及格）";
            }

            System.out.println("成绩：" + score + "，等级：" + grade);
        }

        scanner.close();
    }
}
```

**测试用例**：

- 输入 95，输出"等级：A（优秀）"
- 输入 85，输出"等级：B（良好）"
- 输入 75，输出"等级：C（中等）"
- 输入 65，输出"等级：D（及格）"
- 输入 55，输出"等级：F（不及格）"
- 输入 105，输出"成绩无效"

</details>

### 练习 2：进阶练习 - 季节判断

编写程序，根据月份判断季节：

- 3-5月：春季
- 6-8月：夏季
- 9-11月：秋季
- 12-2月：冬季

要求：

- 使用 `switch` 语句
- 利用穿透特性简化代码

<details>
<summary>点击查看答案</summary>

```java
import java.util.Scanner;

public class SeasonChecker {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        // 输入月份
        System.out.print("请输入月份（1-12）：");
        int month = scanner.nextInt();

        // 判断月份是否有效
        if (month < 1 || month > 12) {
            System.out.println("月份无效，请输入 1-12 之间的数字");
        } else {
            // 使用 switch 判断季节
            String season;
            switch (month) {
                case 3: case 4: case 5:
                    season = "春季";
                    break;
                case 6: case 7: case 8:
                    season = "夏季";
                    break;
                case 9: case 10: case 11:
                    season = "秋季";
                    break;
                case 12: case 1: case 2:
                    season = "冬季";
                    break;
                default:
                    season = "未知";
            }

            System.out.println(month + "月是" + season);
        }

        scanner.close();
    }
}
```

**测试用例**：

- 输入 3，输出"3月是春季"
- 输入 7，输出"7月是夏季"
- 输入 10，输出"10月是秋季"
- 输入 12，输出"12月是冬季"
- 输入 1，输出"1月是冬季"

</details>

### 练习 3（挑战）：综合练习 - 简易日历系统

编写一个程序，根据输入的年份和月份，输出该月的天数。

要求：

- 考虑闰年（2月有29天）
- 使用嵌套的条件语句
- 闰年规则：能被4整除但不能被100整除，或者能被400整除

<details>
<summary>点击查看答案</summary>

```java
import java.util.Scanner;

public class DaysInMonth {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        // 输入年份和月份
        System.out.print("请输入年份：");
        int year = scanner.nextInt();
        System.out.print("请输入月份（1-12）：");
        int month = scanner.nextInt();

        // 判断月份是否有效
        if (month < 1 || month > 12) {
            System.out.println("月份无效");
        } else {
            int days;

            // 判断天数
            switch (month) {
                case 1: case 3: case 5: case 7: case 8: case 10: case 12:
                    days = 31;  // 大月
                    break;
                case 4: case 6: case 9: case 11:
                    days = 30;  // 小月
                    break;
                case 2:
                    // 2月需要判断闰年
                    boolean isLeap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
                    days = isLeap ? 29 : 28;
                    break;
                default:
                    days = 0;
            }

            System.out.println(year + "年" + month + "月有" + days + "天");
        }

        scanner.close();
    }
}
```

**测试用例**：

- 2024年2月：29天（2024是闰年）
- 2023年2月：28天（2023是平年）
- 2000年2月：29天（2000是闰年，能被400整除）
- 1900年2月：28天（1900是平年，能被100整除但不能被400整除）
- 2024年1月：31天
- 2024年4月：30天

</details>

---

## 下一章预告

下一章我们会学习 **循环语句** ——也就是让程序重复执行某段代码的控制结构。你会学到：

- 如何使用 `for` 循环已知次数的重复
- 如何使用 `while` 循环按条件重复
- 如何使用 `do-while` 至少执行一次
- 如何使用 `break` 和 `continue` 控制循环流程

循环是编程中非常重要的概念，掌握它能让你的程序处理大量数据。准备好了吗？让我们继续前进！

---

## 本章小结

本章学习了 Java 的三种条件语句：if-else、switch 和三元表达式。if-else 最灵活，switch 适合多分支等值匹配，三元表达式适合简单赋值。Java 14+ 的增强 switch 语法更简洁安全。接下来我们将学习循环语句。
