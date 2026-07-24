---
title: '第四章：条件语句'
description: 'if-else、switch、三元表达式'
---

# 第四章：条件语句

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

## 本章小结

本章学习了 Java 的三种条件语句：if-else、switch 和三元表达式。if-else 最灵活，switch 适合多分支等值匹配，三元表达式适合简单赋值。Java 14+ 的增强 switch 语法更简洁安全。接下来我们将学习循环语句。
