---
title: '第十四章：异常处理'
description: 'try-catch-finally、自定义异常、checked 与 unchecked'
---

# 第十四章：异常处理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 程序报错了就崩溃退出，有没有办法"抓住"错误并优雅处理？
- try-catch-finally 到底怎么用的？finally 什么时候不执行？
- checked 异常和 unchecked 异常有什么区别？为什么有的必须处理，有的不用？
- 怎么自定义异常？什么时候需要自定义？

这一章就是为了解答这些问题。我们会先搞清楚 **异常体系的核心概念**，再动手实践 try-catch 和自定义异常。学完这章，你就能写出"不轻易崩溃"的健壮代码了。

---

## 10.1 为什么需要异常处理？

### 痛点分析

想象你写了一个除法计算器，用户可能输入 0 作为除数：

```java
// ❌ 没有异常处理：程序直接崩溃
public static void main(String[] args) {
    int a = 10;
    int b = 0;
    int result = a / b;  // 程序在这里崩溃，后面的代码全都不执行
    System.out.println("计算完成");  // 永远不会执行
    System.out.println("结果: " + result);  // 永远不会执行
}
// 输出：Exception in thread "main" java.lang.ArithmeticException: / by zero
```

程序一遇到错误就"死了"——用户体验极差，数据可能丢失，后续逻辑全部中断。

### 解决方案

```java
// ✅ 有异常处理：程序能优雅地处理错误
public static void main(String[] args) {
    try {
        int a = 10;
        int b = 0;
        int result = a / b;
        System.out.println("结果: " + result);
    } catch (ArithmeticException e) {
        // 捕获异常，给出友好提示
        System.out.println("出错了：除数不能为 0");
    }
    System.out.println("程序继续运行");  // ✅ 这行会执行
}
// 输出：
// 出错了：除数不能为 0
// 程序继续运行
```

> **一句话总结**：异常处理让程序遇到错误时不会崩溃，而是能"兜住"问题并继续运行。

### 生活类比

打个比方：

> 异常处理就像走路时踩到香蕉皮。没有异常处理 = 直接摔个狗吃屎，趴地上起不来。有异常处理 = 你提前穿了防滑鞋（try），踩到香蕉皮时稳住了（catch），然后继续走路（finally）。

---

## 10.2 核心原理

### 异常体系

Java 的异常是一棵"家族树"：

```
Throwable（所有异常和错误的"老祖宗"）
├── Error（严重错误，程序无力回天）
│   ├── OutOfMemoryError      ← 内存爆了
│   └── StackOverflowError    ← 递归太深，栈爆了
└── Exception（异常，程序可以处理）
    ├── RuntimeException（运行时异常，unchecked）
    │   ├── NullPointerException         ← 空指针
    │   ├── ArrayIndexOutOfBoundsException ← 数组越界
    │   ├── ClassCastException           ← 类型转换错误
    │   └── ArithmeticException          ← 算术错误（如除以 0）
    └── 其他异常（checked，编译时检查）
        ├── IOException           ← 文件读写错误
        ├── SQLException          ← 数据库错误
        └── FileNotFoundException ← 文件不存在
```

打个比方：

> - **Error** 就像地震、海啸——天灾，你个人无能为力，只能跑。
> - **Exception** 就像生病、车祸——可以预防和治疗。
> - **RuntimeException** 就像感冒——常见但通常不致命，编译器不强制你处理。
> - **Checked 异常** 就像需要做核酸检测才能上飞机——编译器强制你必须处理。

### checked vs unchecked 对比

| 特性     | checked 异常                             | unchecked 异常                                  |
| -------- | ---------------------------------------- | ----------------------------------------------- |
| 继承     | Exception（非 RuntimeException）         | RuntimeException                                |
| 编译检查 | 必须处理（否则编译报错）                 | 不强制处理                                      |
| 典型代表 | IOException、SQLException                | NullPointerException、IndexOutOfBoundsException |
| 适用场景 | 可恢复的外部错误（文件不存在、网络断开） | 程序逻辑错误（空指针、越界）                    |
| 处理方式 | try-catch 或 throws 声明                 | 应该通过代码逻辑避免                            |

---

## 10.3 基础用法

### try-catch-finally

```java
// try 块：放可能出错的代码
// catch 块：出错后怎么处理
// finally 块：不管出不出错都执行（通常用来关闭资源）
try {
    int result = 10 / 0;  // 这行会抛出 ArithmeticException
} catch (ArithmeticException e) {
    // 捕获算术异常，e 就是异常对象
    System.out.println("算术异常: " + e.getMessage());  // 输出错误信息
} finally {
    // 无论是否发生异常，这里都会执行
    System.out.println("finally 块始终执行");
}
```

### 多个 catch

```java
try {
    int[] arr = {1, 2, 3};       // 定义一个长度为 3 的数组
    System.out.println(arr[5]);   // 访问索引 5，会抛出 ArrayIndexOutOfBoundsException
} catch (ArrayIndexOutOfBoundsException e) {
    // 精确捕获数组越界异常
    System.out.println("数组越界: " + e.getMessage());
} catch (Exception e) {
    // 兜底：捕获其他所有异常（必须放在最后一个 catch）
    System.out.println("其他异常: " + e.getMessage());
}
```

::: warning catch 的顺序

多个 catch 块必须**从小到大**排列——子类异常在前，父类异常在后。因为 catch 是按顺序匹配的，一旦匹配成功就不会继续往下走了。

:::

### 多重捕获（Java 7+）

```java
try {
    // 可能抛出多种异常的代码
    doSomething();
} catch (IOException | SQLException e) {
    // 用 | 分隔多种异常类型，共享同一个处理逻辑
    System.out.println("异常: " + e.getMessage());
}
```

### try-with-resources（Java 7+）

自动关闭实现了 `AutoCloseable` 接口的资源，不用再手动写 `close()` 了。

```java
// ✅ 现代写法：try-with-resources，自动关闭资源
try (FileReader reader = new FileReader("test.txt");   // 在 try 后面的括号里声明资源
     BufferedReader br = new BufferedReader(reader)) { // 可以声明多个资源
    String line;
    while ((line = br.readLine()) != null) {  // 逐行读取文件
        System.out.println(line);              // 打印每一行
    }
} catch (IOException e) {
    e.printStackTrace();  // 打印异常堆栈信息
}
// 出了 try 块后，reader 和 br 会自动调用 close() 方法
```

```java
// ❌ 传统写法：需要手动关闭，代码冗长且容易遗漏
BufferedReader br = null;
try {
    br = new BufferedReader(new FileReader("test.txt"));  // 创建读取器
    String line;
    while ((line = br.readLine()) != null) {  // 逐行读取
        System.out.println(line);
    }
} catch (IOException e) {
    e.printStackTrace();
} finally {
    // 必须在 finally 中关闭资源，还要嵌套 try-catch
    if (br != null) {
        try {
            br.close();  // 手动关闭
        } catch (IOException e) {
            // 关闭时的异常也要处理
        }
    }
}
```

### throw 抛出异常

```java
// throw 用于手动抛出一个异常对象
public static void checkAge(int age) {
    if (age < 0) {
        // 年龄不合法，主动抛出异常
        throw new IllegalArgumentException("年龄不能为负数");
    }
    if (age < 18) {
        System.out.println("未成年");
    } else {
        System.out.println("已成年");
    }
}

checkAge(-1);  // 抛出 IllegalArgumentException: 年龄不能为负数
```

### throws 声明异常

```java
// throws 用于在方法签名中声明"这个方法可能抛出某种异常"
// 告诉调用者：你得处理这个异常
public static void readFile(String path) throws IOException {
    FileReader reader = new FileReader(path);  // 可能抛出 FileNotFoundException
    int data = reader.read();                  // 可能抛出 IOException
    reader.close();                            // 可能抛出 IOException
}

// 调用者必须处理（try-catch 或者继续 throws）
try {
    readFile("test.txt");  // 调用可能抛出异常的方法
} catch (IOException e) {
    System.out.println("文件读取失败: " + e.getMessage());
}
```

### throw vs throws 对比

| 特性 | throw                     | throws                          |
| ---- | ------------------------- | ------------------------------- |
| 位置 | 方法体内                  | 方法签名上                      |
| 作用 | 抛出一个具体的异常对象    | 声明方法可能抛出的异常类型      |
| 数量 | 只能抛一个                | 可以声明多个                    |
| 示例 | `throw new IOException()` | `void foo() throws IOException` |

---

## 10.4 自定义异常

当内置异常无法表达你的业务错误时，就需要自定义异常。

```java
// 自定义异常：继承 Exception（checked）或 RuntimeException（unchecked）
public class InsufficientBalanceException extends Exception {
    private double balance;   // 当前余额
    private double amount;    // 取款金额

    // 构造器：传入余额和取款金额
    public InsufficientBalanceException(double balance, double amount) {
        // 调用父类构造器，设置异常消息
        super("余额不足: 余额=" + balance + ", 取款=" + amount);
        this.balance = balance;
        this.amount = amount;
    }

    // getter 方法，让调用者能获取详细信息
    public double getBalance() {
        return balance;
    }

    public double getAmount() {
        return amount;
    }
}

// 使用自定义异常
public class BankAccount {
    private double balance;  // 账户余额

    public void withdraw(double amount) throws InsufficientBalanceException {
        if (amount > balance) {
            // 余额不足时，抛出自定义异常
            throw new InsufficientBalanceException(balance, amount);
        }
        balance -= amount;  // 扣除余额
    }
}
```

### 异常链

在捕获一个异常后抛出另一个异常时，保留原始异常信息。

```java
try {
    databaseOperation();  // 可能抛出 SQLException
} catch (SQLException e) {
    // 把底层异常包装为业务异常，同时保留原始异常（第二个参数 e）
    throw new BusinessException("数据库操作失败", e);
}

// 自定义业务异常
public class BusinessException extends Exception {
    public BusinessException(String message, Throwable cause) {
        super(message, cause);  // cause 参数保留原始异常，方便追踪根因
    }
}
```

---

## 10.5 新手常见误区

### 误区 1：catch (Exception e) 一把梭

**错！** 捕获过于宽泛的异常会掩盖真正的问题。

```java
// ❌ 不推荐：什么都 catch，出了问题根本不知道是哪里错了
try {
    doSomething();
} catch (Exception e) {
    e.printStackTrace();  // 只知道"出错了"，不知道是什么错
}

// ✅ 推荐：精确捕获具体异常，分别处理
try {
    doSomething();
} catch (IOException e) {
    System.err.println("文件操作失败: " + e.getMessage());
} catch (SQLException e) {
    System.err.println("数据库错误: " + e.getMessage());
}
```

### 误区 2：吞掉异常

```java
// ❌ 错误：catch 了但什么都不做，问题难以排查
try {
    readFile("test.txt");
} catch (IOException e) {
    // 什么都不做——出了问题完全不知道
}

// ✅ 正确：至少记录日志，或者重新抛出
try {
    readFile("test.txt");
} catch (IOException e) {
    logger.error("文件读取失败", e);  // 记录日志
    throw new RuntimeException("文件读取失败", e);  // 或者向上抛
}
```

### 误区 3：finally 中 return

```java
// ❌ 问题代码：finally 中的 return 会覆盖 try 中的 return
public static int test() {
    try {
        return 1;      // 你以为会返回 1？
    } finally {
        return 2;      // 实际上返回 2！finally 的 return 会覆盖 try 的
    }
}
System.out.println(test());  // 输出 2，而不是 1
```

### 误区 4：finally 永远不会执行

**不是的。** finally 几乎总会执行，只有一种情况例外——在 try 中调用了 `System.exit(0)`。

```java
try {
    System.exit(0);  // JVM 直接退出
} finally {
    // ❌ 这里不会执行！因为 JVM 已经退出了
    System.out.println("finally");
}
```

### 误区 5：所有异常都要 try-catch

**不是的。** RuntimeException（unchecked）应该通过代码逻辑来避免，而不是靠 try-catch。

```java
// ❌ 不推荐：用 try-catch 处理本可以避免的空指针
try {
    String str = getStr();
    System.out.println(str.length());
} catch (NullPointerException e) {
    System.out.println("空指针");
}

// ✅ 推荐：用 if 判断避免
String str = getStr();
if (str != null) {
    System.out.println(str.length());
}
```

---

## 10.6 动手练习

### 练习 1：基础练习 —— 安全除法

编写一个方法 `safeDivide(int a, int b)`，使用 try-catch 处理除数为 0 的情况，返回结果或 -1。

<details>
<summary>点击查看答案</summary>

```java
public class SafeDivide {
    // 安全除法方法
    public static int safeDivide(int a, int b) {
        try {
            // 尝试执行除法运算
            int result = a / b;
            return result;  // 正常返回结果
        } catch (ArithmeticException e) {
            // 捕获除数为 0 的异常
            System.out.println("错误：除数不能为 0");
            return -1;  // 返回 -1 表示出错
        }
    }

    public static void main(String[] args) {
        System.out.println(safeDivide(10, 2));   // 输出：5
        System.out.println(safeDivide(10, 0));   // 输出：错误：除数不能为 0，然后返回 -1
        System.out.println(safeDivide(20, 4));   // 输出：5
    }
}
```

</details>

### 练习 2：进阶练习 —— 年龄验证器

编写一个方法 `validateAge(int age)`，当年龄小于 0 或大于 150 时抛出自定义异常 `InvalidAgeException`。

<details>
<summary>点击查看答案</summary>

```java
// 自定义异常类
class InvalidAgeException extends Exception {
    private int age;  // 非法的年龄值

    public InvalidAgeException(int age) {
        super("非法年龄: " + age + "，年龄必须在 0-150 之间");  // 设置异常消息
        this.age = age;
    }

    public int getAge() {
        return age;  // 返回非法年龄
    }
}

public class AgeValidator {
    // 验证年龄的方法
    public static void validateAge(int age) throws InvalidAgeException {
        if (age < 0 || age > 150) {
            // 年龄不合法，抛出自定义异常
            throw new InvalidAgeException(age);
        }
        System.out.println("年龄合法: " + age);
    }

    public static void main(String[] args) {
        try {
            validateAge(25);    // 正常
            validateAge(-5);    // 抛出异常
            validateAge(200);   // 抛出异常
        } catch (InvalidAgeException e) {
            // 捕获并处理自定义异常
            System.out.println(e.getMessage());
            System.out.println("非法年龄值是: " + e.getAge());
        }
    }
}
```

</details>

### 练习 3（挑战）：综合练习 —— 文件读取器

使用 try-with-resources 读取一个文本文件，逐行打印内容。分别处理"文件不存在"和"读取错误"两种异常。

<details>
<summary>点击查看答案</summary>

```java
import java.io.*;

public class FileReader {
    // 读取文件并逐行打印
    public static void readFile(String path) {
        // 使用 try-with-resources 自动关闭资源
        try (BufferedReader br = new BufferedReader(new java.io.FileReader(path))) {
            String line;  // 存储每一行的内容
            int lineCount = 0;  // 行号计数器
            while ((line = br.readLine()) != null) {
                // readLine() 返回 null 表示文件读完
                lineCount++;  // 行号加 1
                System.out.println(lineCount + ": " + line);  // 打印行号和内容
            }
            System.out.println("文件读取完成，共 " + lineCount + " 行");
        } catch (FileNotFoundException e) {
            // 精确处理文件不存在的异常
            System.out.println("文件不存在: " + path);
        } catch (IOException e) {
            // 处理其他 IO 异常（如读取错误）
            System.out.println("文件读取失败: " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        readFile("test.txt");       // 读取存在的文件
        readFile("not_exist.txt");  // 读取不存在的文件
    }
}
```

</details>

---

## 10.7 核心知识点

| 知识点             | 说明                                                                |
| ------------------ | ------------------------------------------------------------------- |
| 异常体系           | Throwable → Error 和 Exception，Exception 分为 checked 和 unchecked |
| try-catch-finally  | 捕获处理异常，finally 块始终执行（除非 System.exit）                |
| try-with-resources | Java 7+ 自动关闭实现了 AutoCloseable 的资源                         |
| throw              | 手动抛出一个具体的异常对象                                          |
| throws             | 在方法签名中声明可能抛出的异常类型                                  |
| 自定义异常         | 继承 Exception（checked）或 RuntimeException（unchecked）           |
| 异常链             | 包装异常时保留原始异常，方便追踪根因                                |

---

## 下一章预告

下一章我们会学习 **集合框架**——Java 的"数据容器"。你会学到 List、Set、Map 三大集合的区别和用法，以及 ArrayList、LinkedList、HashMap 等常用实现类。集合是日常开发中用得最多的数据结构，学完这章你就能灵活管理一组数据了。
