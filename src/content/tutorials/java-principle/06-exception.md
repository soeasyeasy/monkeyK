---
title: "第六章：异常处理原理"
description: "异常体系、异常链、异常性能优化、try-with-resources 实现"
---

# 第六章：异常处理原理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Java 的异常体系到底是怎么设计的？Error 和 Exception 有什么区别？
- 为什么有些异常必须捕获（checked），有些却不用（unchecked）？
- 异常是怎么被抛出的？栈追踪信息是怎么生成的？
- try-catch-finally 在字节码层面是怎么实现的？
- try-with-resources 是怎么自动关闭资源的？
- 为什么都说异常很慢？到底有多慢？怎么优化？

这一章就是为了解答这些问题。我们会从异常的体系结构出发，搞清楚 **异常的底层实现原理**，理解编译器在背后做了哪些工作，最后学会如何优化异常处理的性能。

学完本章，你将能够：
- 清楚说出 Java 异常体系的完整结构
- 理解 checked 和 unchecked 异常的设计哲学
- 掌握异常的底层实现（栈追踪生成、字节码异常表）
- 理解 try-with-resources 的编译器糖原理
- 知道异常的性能问题及优化方法

---

## 6.1 为什么需要异常处理？

### 痛点分析

想象一下这个场景：

你写了一个读取文件的方法，如果没有异常机制，你可能需要这样做：

```java
// 没有异常时的做法 - 用返回值表示错误
public String readFile(String path) {
    if (path == null) {
        return null;  // 参数错误
    }
    
    File file = new File(path);
    if (!file.exists()) {
        return null;  // 文件不存在
    }
    
    if (!file.canRead()) {
        return null;  // 没有权限
    }
    
    // 真正读取文件的逻辑...
    // 如果读取过程中出错，也只能返回 null
    return null;  // 读取失败
}

// 调用方
String content = readFile("/path/to/file");
if (content == null) {
    // 到底是哪种错误？参数错误？文件不存在？没权限？读取失败？
    // 完全不知道！
}
```

**问题很明显**：
- 返回值无法区分不同的错误类型
- 正常返回值和错误返回值混淆
- 错误信息丢失，难以定位问题
- 调用方必须检查返回值，否则容易忽略错误

### 解决方案：异常机制

有了异常机制，错误处理变得清晰：

```java
// 使用异常后的做法
public String readFile(String path) throws IOException {
    if (path == null) {
        throw new IllegalArgumentException("文件路径不能为 null");  // 明确的错误类型
    }
    
    File file = new File(path);
    if (!file.exists()) {
        throw new FileNotFoundException("文件不存在: " + path);  // 具体的异常
    }
    
    // 读取文件...
    try (FileInputStream fis = new FileInputStream(file)) {
        byte[] data = new byte[(int) file.length()];
        fis.read(data);
        return new String(data);
    }
    // 如果读取失败，会自动抛出 IOException
}

// 调用方
try {
    String content = readFile("/path/to/file");
} catch (FileNotFoundException e) {
    System.out.println("文件不存在: " + e.getMessage());
} catch (IOException e) {
    System.out.println("读取文件失败: " + e.getMessage());
} catch (IllegalArgumentException e) {
    System.out.println("参数错误: " + e.getMessage());
}
```

> **一句话总结**：异常机制将错误处理从正常流程中分离出来，让代码更清晰，错误信息更丰富。

---

## 6.2 核心原理：异常体系结构

### 异常的继承体系

```
Throwable（根类）
├── Error（严重错误，程序无法处理）
│   ├── OutOfMemoryError（内存溢出）
│   ├── StackOverflowError（栈溢出）
│   ├── VirtualMachineError（虚拟机错误）
│   └── ...
│
└── Exception（异常，程序可以处理）
    ├── RuntimeException（运行时异常，unchecked）
    │   ├── NullPointerException（空指针）
    │   ├── ArrayIndexOutOfBoundsException（数组越界）
    │   ├── ClassCastException（类型转换错误）
    │   ├── IllegalArgumentException（非法参数）
    │   └── ...
    │
    └── 其他异常（checked，必须捕获）
        ├── IOException（IO 异常）
        ├── SQLException（数据库异常）
        ├── ClassNotFoundException（类未找到）
        └── ...
```

### Error vs Exception

| 特性 | Error | Exception |
|------|-------|-----------|
| 性质 | 系统级错误 | 程序级错误 |
| 可恢复性 | 不可恢复 | 可以恢复 |
| 是否需要捕获 | 不需要 | checked 必须捕获 |
| 示例 | OutOfMemoryError | IOException |
| 处理策略 | 让程序崩溃 | try-catch 或 throws |

### Checked vs Unchecked 异常

```java
// Checked 异常 - 编译器强制处理
public void readFile() throws IOException {  // 必须声明或捕获
    FileInputStream fis = new FileInputStream("file.txt");  // 抛出 IOException
}

// Unchecked 异常 - 编译器不强制处理
public void divide(int a, int b) {
    int result = a / b;  // 可能抛出 ArithmeticException，但不需要声明
}
```

**设计哲学**：

| 类型 | 设计意图 | 使用场景 |
|------|----------|----------|
| Checked | 可恢复的错误 | 文件不存在、网络超时 |
| Unchecked | 编程错误（Bug） | 空指针、数组越界 |

---

## 6.3 异常的底层实现

### 异常对象的创建过程

当抛出异常时，JVM 会创建异常对象，这个过程包括：

```java
// 抛出异常
throw new RuntimeException("出错了");

// 底层发生了什么？
// 1. 创建 RuntimeException 对象
// 2. 调用 fillInStackTrace() 方法 - 这是关键！
// 3. 记录当前线程的调用栈信息
// 4. 保存异常消息
```

### fillInStackTrace() 方法

这个方法是异常性能开销的核心：

```java
public class Throwable {
    
    // 栈追踪信息
    private StackTraceElement[] stackTrace;
    
    // 构造函数中调用
    public Throwable() {
        fillInStackTrace();  // 记录调用栈
    }
    
    // 填充栈追踪信息
    public synchronized Throwable fillInStackTrace() {
        // 遍历当前线程的调用栈
        // 为每一帧创建 StackTraceElement 对象
        // 记录类名、方法名、文件名、行号
        this.stackTrace = getStackTraceElements();
        return this;
    }
    
    // 获取栈追踪
    public StackTraceElement[] getStackTrace() {
        return stackTrace.clone();
    }
    
    // 打印栈追踪
    public void printStackTrace() {
        for (StackTraceElement element : stackTrace) {
            System.err.println("\tat " + element);
        }
    }
}
```

### 栈追踪的生成过程

```java
public class StackTraceDemo {
    
    public static void main(String[] args) {
        method1();
    }
    
    static void method1() {
        method2();
    }
    
    static void method2() {
        method3();
    }
    
    static void method3() {
        // 在这里抛出异常
        RuntimeException e = new RuntimeException("出错了");
        
        // 查看栈追踪
        e.printStackTrace();
        // 输出：
        // java.lang.RuntimeException: 出错了
        //     at StackTraceDemo.method3(StackTraceDemo.java:20)
        //     at StackTraceDemo.method2(StackTraceDemo.java:15)
        //     at StackTraceDemo.method1(StackTraceDemo.java:10)
        //     at StackTraceDemo.main(StackTraceDemo.java:5)
    }
}
```

> **生活化类比**：
> 栈追踪就像"面包屑路径"：
> - 记录了从 main() 到当前方法的完整调用链
> - 每一层调用都留下"面包屑"（类名、方法名、行号）
> - 出错时可以沿着面包屑找到问题根源

---

## 6.4 try-catch-finally 的字节码实现

### 编译器糖

Java 的 try-catch-finally 是编译器糖，底层通过**异常表**实现：

```java
// Java 源码
public void test() {
    try {
        System.out.println("try");
    } catch (Exception e) {
        System.out.println("catch");
    } finally {
        System.out.println("finally");
    }
}
```

### 字节码实现

```
// 字节码（简化版）
public void test();
  Code:
     0: getstatic     #2    // Field java/lang/System.out
     3: ldc           #3    // String try
     5: invokevirtual #4    // Method java/io/PrintStream.println
     8: getstatic     #2    // Field java/lang/System.out
    11: ldc           #5    // String finally
    13: invokevirtual #4    // Method java/io/PrintStream.println
    16: goto          40    // 跳转到结束
    
    19: astore_1            // catch 块开始
    20: getstatic     #2
    23: ldc           #6    // String catch
    25: invokevirtual #4
    28: getstatic     #2    // finally 块
    31: ldc           #5
    33: invokevirtual #4
    36: goto          40
    
    39: astore_2            // 异常处理
    40: getstatic     #2    // finally 块
    43: ldc           #5
    45: invokevirtual #4
    48: aload_2
    49: athrow              // 重新抛出异常
    
  Exception table:          // 异常表 - 关键！
     from    to  target type
         0     8    19   Class java/lang/Exception
         0     8    39   any
         8    16    39   any
        19    28    39   any
```

### 异常表的结构

| 字段 | 说明 |
|------|------|
| from | try 块开始位置 |
| to | try 块结束位置 |
| target | catch 块开始位置 |
| type | 捕获的异常类型 |

> **生活化类比**：
> 异常表就像"应急预案表"：
> - 记录了代码的哪些位置可能出错
> - 出错后跳转到哪里处理
> - 处理哪种类型的错误

---

## 6.5 try-with-resources 原理

### 传统方式的问题

```java
// 传统方式 - 需要手动关闭资源
public void readFile() {
    FileInputStream fis = null;
    try {
        fis = new FileInputStream("file.txt");
        // 读取文件...
    } catch (IOException e) {
        e.printStackTrace();
    } finally {
        if (fis != null) {
            try {
                fis.close();  // 必须手动关闭
            } catch (IOException e) {
                e.printStackTrace();  // 关闭时也可能出错
            }
        }
    }
}
```

**问题**：
- 代码冗长，容易出错
- 忘记关闭资源会导致内存泄漏
- 多个资源时需要嵌套多个 finally

### try-with-resources 的解决方案

```java
// 使用 try-with-resources
public void readFile() {
    try (FileInputStream fis = new FileInputStream("file.txt")) {
        // 读取文件...
    } catch (IOException e) {
        e.printStackTrace();
    }
    // 自动关闭，不需要 finally
}

// 多个资源
public void copyFile() {
    try (FileInputStream fis = new FileInputStream("source.txt");
         FileOutputStream fos = new FileOutputStream("target.txt")) {
        // 复制文件...
    } catch (IOException e) {
        e.printStackTrace();
    }
    // 自动按相反顺序关闭所有资源
}
```

### AutoCloseable 接口

try-with-resources 要求资源实现 `AutoCloseable` 接口：

```java
// AutoCloseable 接口
public interface AutoCloseable {
    void close() throws Exception;  // 关闭资源
}

// FileInputStream 实现了 AutoCloseable
public class FileInputStream implements Closeable {
    @Override
    public void close() throws IOException {
        // 关闭文件流
    }
}

// Closeable 继承自 AutoCloseable
public interface Closeable extends AutoCloseable {
    void close() throws IOException;
}
```

### 编译器糖的实现

```java
// 源码
try (MyResource resource = new MyResource()) {
    resource.doSomething();
} catch (Exception e) {
    e.printStackTrace();
}

// 编译器转换后（简化版）
MyResource resource = new MyResource();
Throwable primaryException = null;
try {
    resource.doSomething();
} catch (Throwable t) {
    primaryException = t;
    throw t;
} finally {
    if (resource != null) {
        if (primaryException != null) {
            try {
                resource.close();
            } catch (Throwable suppressed) {
                primaryException.addSuppressed(suppressed);  // 抑制异常
            }
        } else {
            resource.close();
        }
    }
}
```

### 抑制异常（Suppressed Exception）

```java
public class SuppressedExceptionDemo {
    
    public static void main(String[] args) {
        try {
            method();
        } catch (Exception e) {
            System.out.println("主异常: " + e.getMessage());
            
            // 获取被抑制的异常
            Throwable[] suppressed = e.getSuppressed();
            for (Throwable s : suppressed) {
                System.out.println("被抑制的异常: " + s.getMessage());
            }
        }
    }
    
    static void method() throws Exception {
        try (MyResource resource = new MyResource()) {
            throw new Exception("try 块中的异常");  // 主异常
        }
        // close() 方法也会抛出异常
    }
}

class MyResource implements AutoCloseable {
    @Override
    public void close() throws Exception {
        throw new Exception("close() 中的异常");  // 被抑制的异常
    }
}

// 输出：
// 主异常: try 块中的异常
// 被抑制的异常: close() 中的异常
```

---

## 6.6 异常链

### 什么是异常链

异常链是将原始异常信息传递给新异常的机制：

```java
// 不使用异常链 - 丢失原始异常
public void processData() throws BusinessException {
    try {
        // 数据库操作
        database.query();
    } catch (SQLException e) {
        // 错误：丢失了原始异常信息
        throw new BusinessException("业务处理失败");
    }
}

// 使用异常链 - 保留原始异常
public void processData() throws BusinessException {
    try {
        database.query();
    } catch (SQLException e) {
        // 正确：保留原始异常
        throw new BusinessException("业务处理失败", e);
    }
}
```

### 异常链的实现

```java
public class BusinessException extends Exception {
    
    // 构造函数 - 支持异常链
    public BusinessException(String message) {
        super(message);
    }
    
    public BusinessException(String message, Throwable cause) {
        super(message, cause);  // 将原始异常传递给父类
    }
    
    public BusinessException(Throwable cause) {
        super(cause);
    }
}

// 使用示例
public class ExceptionChainDemo {
    
    public static void main(String[] args) {
        try {
            method1();
        } catch (Exception e) {
            // 打印完整的异常链
            e.printStackTrace();
            
            // 遍历异常链
            Throwable current = e;
            while (current != null) {
                System.out.println("异常: " + current.getClass().getName());
                System.out.println("消息: " + current.getMessage());
                current = current.getCause();  // 获取下一个异常
            }
        }
    }
    
    static void method1() throws BusinessException {
        try {
            method2();
        } catch (SQLException e) {
            throw new BusinessException("业务层异常", e);
        }
    }
    
    static void method2() throws SQLException {
        throw new SQLException("数据库连接失败");
    }
}
```

---

## 6.7 异常的性能问题

### 为什么异常很慢？

创建异常对象时，`fillInStackTrace()` 会遍历整个调用栈，这是性能开销的主要来源：

```java
public class ExceptionPerformanceDemo {
    
    public static void main(String[] args) {
        int count = 100000;
        
        // 测试 1：使用异常控制流程
        long start1 = System.currentTimeMillis();
        for (int i = 0; i < count; i++) {
            try {
                throw new RuntimeException("test");
            } catch (RuntimeException e) {
                // 忽略
            }
        }
        long time1 = System.currentTimeMillis() - start1;
        System.out.println("使用异常: " + time1 + "ms");
        
        // 测试 2：使用条件判断
        long start2 = System.currentTimeMillis();
        for (int i = 0; i < count; i++) {
            if (shouldThrow(i)) {
                // 处理错误
            }
        }
        long time2 = System.currentTimeMillis() - start2;
        System.out.println("使用条件判断: " + time2 + "ms");
        
        // 结果：使用异常可能慢 10-100 倍
    }
    
    static boolean shouldThrow(int i) {
        return false;
    }
}
```

### 性能优化建议

```java
// ❌ 错误：用异常控制流程
public User findUser(String id) {
    try {
        return userRepository.findById(id);
    } catch (UserNotFoundException e) {
        return null;  // 用异常表示"未找到"
    }
}

// ✅ 正确：用条件判断
public User findUser(String id) {
    if (id == null || !userRepository.existsById(id)) {
        return null;  // 用条件判断
    }
    return userRepository.findById(id);
}

// ❌ 错误：重复创建异常
public void process() {
    for (int i = 0; i < 1000; i++) {
        try {
            riskyOperation();
        } catch (Exception e) {
            // 每次都创建新的异常对象，性能差
            throw new BusinessException("处理失败", e);
        }
    }
}

// ✅ 正确：重用异常对象
public class BusinessException extends RuntimeException {
    // 预定义的异常实例
    public static final BusinessException INSTANCE = 
        new BusinessException("处理失败");
    
    // 禁用 fillInStackTrace
    @Override
    public synchronized Throwable fillInStackTrace() {
        return this;  // 不记录栈追踪
    }
}

// 使用
public void process() {
    for (int i = 0; i < 1000; i++) {
        try {
            riskyOperation();
        } catch (Exception e) {
            throw BusinessException.INSTANCE;  // 重用异常对象
        }
    }
}
```

### 性能对比

| 场景 | 耗时 | 说明 |
|------|------|------|
| 创建异常（有栈追踪） | ~1-10μs | 需要遍历调用栈 |
| 创建异常（无栈追踪） | ~10ns | 跳过 fillInStackTrace |
| 抛出异常 | ~1-5μs | 需要查找异常处理器 |
| 条件判断 | ~1ns | 几乎无开销 |

---

## 6.8 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 异常体系 | Throwable → Error/Exception → RuntimeException |
| Checked 异常 | 编译器强制处理，如 IOException |
| Unchecked 异常 | 运行时异常，如 NullPointerException |
| fillInStackTrace | 记录调用栈，是性能开销的主要来源 |
| 异常表 | 字节码中记录 try-catch 的映射关系 |
| try-with-resources | 编译器糖，自动调用 close() |
| 异常链 | 通过 cause 传递原始异常 |
| 性能优化 | 避免用异常控制流程，考虑重用异常 |

---

## 6.9 新手常见误区

### 误区 1："异常就是用来控制流程的"

**错！** 异常应该只用于真正的异常情况，不应该用于正常流程控制：

```java
// ❌ 错误：用异常控制正常流程
public boolean isValid(String str) {
    try {
        Integer.parseInt(str);
        return true;
    } catch (NumberFormatException e) {
        return false;  // 用异常表示"不是数字"
    }
}

// ✅ 正确：用条件判断
public boolean isValid(String str) {
    if (str == null || str.isEmpty()) {
        return false;
    }
    for (char c : str.toCharArray()) {
        if (!Character.isDigit(c)) {
            return false;
        }
    }
    return true;
}
```

### 误区 2："捕获异常后什么都不做"

**错！** 捕获异常后必须处理，否则等于没有捕获：

```java
// ❌ 错误：吞掉异常
try {
    riskyOperation();
} catch (Exception e) {
    // 什么都不做 - 错误被隐藏了！
}

// ❌ 错误：只打印堆栈
try {
    riskyOperation();
} catch (Exception e) {
    e.printStackTrace();  // 只是打印，没有真正处理
}

// ✅ 正确：记录日志并处理
try {
    riskyOperation();
} catch (Exception e) {
    logger.error("操作失败", e);  // 记录日志
    // 执行恢复逻辑或抛出业务异常
    throw new BusinessException("操作失败", e);
}
```

### 误区 3："finally 块中不应该有 return"

**对！** finally 中的 return 会覆盖 try/catch 中的 return：

```java
// ❌ 错误：finally 中的 return 会覆盖前面的 return
public int test() {
    try {
        return 1;  // 这个返回值会被覆盖
    } finally {
        return 2;  // 最终返回 2
    }
}

// ✅ 正确：finally 只用于清理资源
public int test() {
    try {
        return 1;
    } finally {
        cleanup();  // 只做清理，不要 return
    }
}
```

### 误区 4："所有异常都应该捕获"

**错！** 有些异常不应该捕获，而应该让它传播：

```java
// ❌ 错误：捕获所有异常
public void process() {
    try {
        doSomething();
    } catch (Throwable t) {  // 捕获所有异常，包括 Error
        // 这样会隐藏严重的系统错误
    }
}

// ✅ 正确：只捕获能处理的异常
public void process() throws BusinessException {
    try {
        doSomething();
    } catch (SQLException e) {  // 只捕获特定的异常
        throw new BusinessException("数据库操作失败", e);
    }
    // NullPointerException 等编程错误应该让它传播
}
```

### 误区 5："自定义异常必须继承 Exception"

**错！** 大多数情况下应该继承 RuntimeException：

```java
// ❌ 不推荐：继承 Exception（变成 checked 异常）
public class BusinessException extends Exception {
    // 所有调用方都必须捕获或声明
}

// ✅ 推荐：继承 RuntimeException（unchecked 异常）
public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
    
    public BusinessException(String message, Throwable cause) {
        super(message, cause);
    }
}

// 使用更灵活
public void process() {
    // 不需要 throws 声明
    if (error) {
        throw new BusinessException("业务错误");
    }
}
```

---

## 6.10 动手练习

### 练习 1：基础题

请回答以下问题：

1. Error 和 Exception 有什么区别？
2. Checked 异常和 Unchecked 异常的区别是什么？
3. try-with-resources 是怎么自动关闭资源的？

<details>
<summary>点击查看答案</summary>

1. **Error 和 Exception 的区别**：
   - Error 是系统级错误（如 OutOfMemoryError），程序无法处理，应该让程序崩溃
   - Exception 是程序级错误，可以被捕获和处理

2. **Checked 和 Unchecked 异常的区别**：
   - Checked 异常（如 IOException）：编译器强制要求处理，必须 try-catch 或 throws
   - Unchecked 异常（如 RuntimeException）：编译器不强制处理

3. **try-with-resources 的原理**：
   - 要求资源实现 AutoCloseable 接口
   - 编译器自动在 finally 块中调用 close() 方法
   - 如果 try 块和 close() 都抛出异常，close() 的异常会被抑制（suppressed）

</details>

### 练习 2：进阶题

请编写一个自定义异常类 `ValidationException`，支持异常链，并演示如何使用。

<details>
<summary>点击查看答案</summary>

```java
// 自定义异常类
public class ValidationException extends RuntimeException {
    
    private final String fieldName;
    
    public ValidationException(String fieldName, String message) {
        super(message);
        this.fieldName = fieldName;
    }
    
    public ValidationException(String fieldName, String message, Throwable cause) {
        super(message, cause);
        this.fieldName = fieldName;
    }
    
    public String getFieldName() {
        return fieldName;
    }
    
    @Override
    public String toString() {
        return String.format("ValidationException[field=%s, message=%s]", 
            fieldName, getMessage());
    }
}

// 使用示例
public class ValidationDemo {
    
    public static void main(String[] args) {
        try {
            validateUser(null, "123");
        } catch (ValidationException e) {
            System.out.println("验证失败: " + e);
            System.out.println("字段: " + e.getFieldName());
            System.out.println("消息: " + e.getMessage());
            
            // 查看异常链
            if (e.getCause() != null) {
                System.out.println("原因: " + e.getCause());
            }
        }
    }
    
    public static void validateUser(String username, String password) {
        try {
            if (username == null) {
                throw new NullPointerException("username is null");
            }
            if (username.length() < 3) {
                throw new ValidationException("username", "用户名长度不能小于3");
            }
            if (password == null || password.length() < 6) {
                throw new ValidationException("password", "密码长度不能小于6");
            }
        } catch (NullPointerException e) {
            // 包装为业务异常，保留异常链
            throw new ValidationException("username", "用户名不能为空", e);
        }
    }
}
```

</details>

### 练习 3（挑战）：综合题

请实现一个自定义的资源类 `MyResource`，实现 AutoCloseable 接口，并演示 try-with-resources 的使用，包括抑制异常的处理。

<details>
<summary>点击查看答案</summary>

```java
// 自定义资源类
public class MyResource implements AutoCloseable {
    
    private String name;
    private boolean closed = false;
    
    public MyResource(String name) {
        this.name = name;
        System.out.println("打开资源: " + name);
    }
    
    public void doWork() throws Exception {
        if (closed) {
            throw new IllegalStateException("资源已关闭");
        }
        System.out.println("使用资源: " + name);
        // 模拟工作时的异常
        // throw new Exception("工作中的异常");
    }
    
    @Override
    public void close() throws Exception {
        if (closed) {
            return;
        }
        closed = true;
        System.out.println("关闭资源: " + name);
        // 模拟关闭时的异常
        // throw new Exception("关闭时的异常");
    }
}

// 测试类
public class TryWithResourcesDemo {
    
    public static void main(String[] args) {
        // 测试 1：正常情况
        System.out.println("=== 测试 1：正常情况 ===");
        try (MyResource resource = new MyResource("资源1")) {
            resource.doWork();
        } catch (Exception e) {
            System.out.println("捕获异常: " + e.getMessage());
        }
        
        // 测试 2：try 块抛出异常
        System.out.println("\n=== 测试 2：try 块抛出异常 ===");
        try (MyResource resource = new MyResource("资源2")) {
            resource.doWork();
            throw new Exception("try 块中的异常");
        } catch (Exception e) {
            System.out.println("捕获异常: " + e.getMessage());
        }
        
        // 测试 3：close() 抛出异常
        System.out.println("\n=== 测试 3：close() 抛出异常 ===");
        try (MyResource resource = new MyResource("资源3") {
            @Override
            public void close() throws Exception {
                super.close();
                throw new Exception("close() 中的异常");
            }
        }) {
            resource.doWork();
        } catch (Exception e) {
            System.out.println("捕获异常: " + e.getMessage());
        }
        
        // 测试 4：try 和 close() 都抛出异常（抑制异常）
        System.out.println("\n=== 测试 4：抑制异常 ===");
        try (MyResource resource = new MyResource("资源4") {
            @Override
            public void doWork() throws Exception {
                throw new Exception("doWork() 中的异常");
            }
            
            @Override
            public void close() throws Exception {
                super.close();
                throw new Exception("close() 中的异常");
            }
        }) {
            resource.doWork();
        } catch (Exception e) {
            System.out.println("主异常: " + e.getMessage());
            
            // 获取被抑制的异常
            Throwable[] suppressed = e.getSuppressed();
            for (Throwable s : suppressed) {
                System.out.println("被抑制的异常: " + s.getMessage());
            }
        }
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **集合框架底层原理**——也就是 Java 集合的完整体系和核心实现。你会学到：

- 集合框架的整体架构（Collection/Map 两大体系）
- ArrayList 和 LinkedList 的底层实现原理
- HashMap 的数组+链表+红黑树结构
- ConcurrentHashMap 的并发实现原理
- 各种集合类的性能特点和适用场景

这些知识将帮助你理解 Java 集合的底层机制，以及如何选择合适的集合类。
