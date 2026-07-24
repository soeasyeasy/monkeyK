---
title: '第十章：异常处理'
description: 'try-catch-finally、自定义异常、checked 与 unchecked'
---

# 第十章：异常处理

## 异常体系

```
Throwable
├── Error（严重错误，程序无法处理）
│   ├── OutOfMemoryError
│   └── StackOverflowError
└── Exception（异常，程序可以处理）
    ├── RuntimeException（运行时异常，unchecked）
    │   ├── NullPointerException
    │   ├── ArrayIndexOutOfBoundsException
    │   ├── ClassCastException
    │   └── ArithmeticException
    └── 其他异常（checked，编译时检查）
        ├── IOException
        ├── SQLException
        └── FileNotFoundException
```

## try-catch-finally

```java
try {
    int result = 10 / 0;
} catch (ArithmeticException e) {
    System.out.println("算术异常: " + e.getMessage());
} finally {
    System.out.println("finally 块始终执行");
}
```

### 多个 catch

```java
try {
    int[] arr = {1, 2, 3};
    System.out.println(arr[5]);
} catch (ArrayIndexOutOfBoundsException e) {
    System.out.println("数组越界: " + e.getMessage());
} catch (Exception e) {
    System.out.println("其他异常: " + e.getMessage());
}
```

### 多重捕获（Java 7+）

```java
try {
    // 可能抛出多种异常的代码
} catch (IOException | SQLException e) {
    System.out.println("异常: " + e.getMessage());
}
```

## try-with-resources（Java 7+）

自动关闭实现了 `AutoCloseable` 接口的资源。

```java
try (FileReader reader = new FileReader("test.txt");
     BufferedReader br = new BufferedReader(reader)) {
    String line;
    while ((line = br.readLine()) != null) {
        System.out.println(line);
    }
} catch (IOException e) {
    e.printStackTrace();
}
// reader 和 br 会自动关闭
```

## throw 抛出异常

```java
public static void checkAge(int age) {
    if (age < 0) {
        throw new IllegalArgumentException("年龄不能为负数");
    }
    if (age < 18) {
        System.out.println("未成年");
    } else {
        System.out.println("已成年");
    }
}

checkAge(-1);  // 抛出 IllegalArgumentException
```

## throws 声明异常

checked 异常必须在方法签名中声明。

```java
public static void readFile(String path) throws IOException {
    FileReader reader = new FileReader(path);
    int data = reader.read();
    reader.close();
}

// 调用者必须处理
try {
    readFile("test.txt");
} catch (IOException e) {
    System.out.println("文件读取失败: " + e.getMessage());
}
```

## 自定义异常

```java
public class InsufficientBalanceException extends Exception {
    private double balance;
    private double amount;

    public InsufficientBalanceException(double balance, double amount) {
        super("余额不足: 余额=" + balance + ", 取款=" + amount);
        this.balance = balance;
        this.amount = amount;
    }

    public double getBalance() {
        return balance;
    }
}

public class BankAccount {
    private double balance;

    public void withdraw(double amount) throws InsufficientBalanceException {
        if (amount > balance) {
            throw new InsufficientBalanceException(balance, amount);
        }
        balance -= amount;
    }
}
```

## checked vs unchecked

| 特性     | checked 异常                     | unchecked 异常                                  |
| -------- | -------------------------------- | ----------------------------------------------- |
| 继承     | Exception（非 RuntimeException） | RuntimeException                                |
| 编译检查 | 必须处理                         | 不强制处理                                      |
| 典型     | IOException、SQLException        | NullPointerException、IndexOutOfBoundsException |
| 场景     | 可恢复的外部错误                 | 程序逻辑错误                                    |

## 异常链

在捕获一个异常后抛出另一个异常时，保留原始异常信息。

```java
try {
    // 可能抛出 SQLException
    databaseOperation();
} catch (SQLException e) {
    // 包装为业务异常，保留原始异常
    throw new BusinessException("数据库操作失败", e);
}

public class BusinessException extends Exception {
    public BusinessException(String message, Throwable cause) {
        super(message, cause);  // cause 参数保留原始异常
    }
}
```

## 异常处理最佳实践

### 1. 精确捕获

```java
// ❌ 不推荐：捕获过于宽泛
try {
    // ...
} catch (Exception e) {
    e.printStackTrace();
}

// ✅ 推荐：精确捕获具体异常
try {
    // ...
} catch (IOException e) {
    System.err.println("文件操作失败: " + e.getMessage());
} catch (SQLException e) {
    System.err.println("数据库错误: " + e.getMessage());
}
```

### 2. 不要吞掉异常

```java
// ❌ 错误：吞掉异常
try {
    // ...
} catch (IOException e) {
    // 什么都不做，问题难以排查
}

// ✅ 正确：至少记录日志
try {
    // ...
} catch (IOException e) {
    logger.error("文件读取失败", e);
    // 或者重新抛出
    throw new RuntimeException("文件读取失败", e);
}
```

### 3. finally 中不要 return

```java
// ❌ 问题代码
public static int test() {
    try {
        return 1;
    } finally {
        return 2;  // 会覆盖 try 中的 return
    }
}
System.out.println(test());  // 输出 2，而不是 1
```

### 4. 使用 try-with-resources

```java
// ❌ 传统方式：需要手动关闭
BufferedReader br = null;
try {
    br = new BufferedReader(new FileReader("test.txt"));
    // ...
} catch (IOException e) {
    // ...
} finally {
    if (br != null) {
        try {
            br.close();
        } catch (IOException e) {
            // 忽略
        }
    }
}

// ✅ 现代方式：自动关闭
try (BufferedReader br = new BufferedReader(new FileReader("test.txt"))) {
    // ...
} catch (IOException e) {
    // ...
}
// 资源自动关闭，代码更简洁
```

## 核心知识点

1. **异常体系**：Throwable → Error 和 Exception，Exception 分为 checked 和 unchecked
2. **try-catch-finally**：捕获处理异常，finally 块始终执行
3. **try-with-resources**：Java 7+ 自动关闭资源
4. **throw**：手动抛出异常
5. **throws**：方法签名声明异常
6. **自定义异常**：继承 Exception 或 RuntimeException
7. **异常链**：保留原始异常信息

## 本章小结

Java 异常分为 checked 和 unchecked。try-catch-finally 用于捕获处理异常，try-with-resources 自动关闭资源。自定义异常继承 Exception 或 RuntimeException。接下来我们将学习集合框架。
