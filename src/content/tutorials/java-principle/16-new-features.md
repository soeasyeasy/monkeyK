---
title: "第十六章：Java 新特性原理"
description: "深入理解 Lambda、Stream、模块化、密封类、Record、虚拟线程等现代 Java 特性的底层实现"
---

# 第十六章：Java 新特性原理

## 本章导读

Java 从 JDK 8 开始进入快速迭代期，引入了大量现代语言特性。但你有没有想过：

- Lambda 表达式看起来很简洁，但它在字节码层面是怎么实现的？
- Stream API 为什么能支持并行处理？底层用了什么黑科技？
- 模块化系统（JPMS）到底解决了什么问题？为什么 Java 9 要引入它？
- 密封类（sealed class）和 Record 类在编译器层面做了什么？
- 虚拟线程（Java 21）和传统线程有什么区别？为什么能支持百万级并发？
- 模式匹配的底层原理是什么？

这一章我们就来揭开这些新特性的神秘面纱。理解了底层原理，你就能更好地使用它们，写出更现代、更高效的 Java 代码。

学完本章，你将能够：
- 理解 Lambda 表达式的 invokedynamic 实现机制
- 掌握 Stream API 的惰性求值和短路操作原理
- 理解模块化系统的设计思想和实现方式
- 掌握密封类和 Record 类的编译器实现
- 理解虚拟线程的工作原理和性能优势
- 掌握模式匹配的底层机制
- 获得后续学习的清晰路径

---

## 16.1 为什么需要这些新特性？

### 生活化类比

想象 Java 是一辆汽车：

**Java 8 之前（老款汽车）**：
- 手动挡（匿名内部类）：操作复杂，代码冗长
- 没有导航（没有 Stream）：数据处理需要手动循环
- 所有零件混在一起（没有模块化）：依赖混乱，难以维护
- 只有手动模式（只有平台线程）：并发性能有限

**Java 8+（现代汽车）**：
- 自动挡（Lambda）：操作简单，代码简洁
- 智能导航（Stream）：自动优化数据处理路径
- 模块化设计（JPMS）：零件独立，易于升级
- 自动驾驶（虚拟线程）：轻松应对复杂路况

### 痛点分析

如果没有这些新特性，Java 会面临这些问题：

```java
// 1. 代码冗长（没有 Lambda）
// 传统写法：匿名内部类
button.addActionListener(new ActionListener() {
    @Override
    public void actionPerformed(ActionEvent e) {
        System.out.println("点击了按钮");
    }
});

// Lambda 写法：简洁清晰
button.addActionListener(e -> System.out.println("点击了按钮"));

// 2. 数据处理复杂（没有 Stream）
// 传统写法：多层循环
List<String> result = new ArrayList<>();
for (String s : list) {
    if (s.startsWith("A")) {
        result.add(s.toUpperCase());
    }
}

// Stream 写法：链式调用
List<String> result = list.stream()
    .filter(s -> s.startsWith("A"))
    .map(String::toUpperCase)
    .collect(Collectors.toList());

// 3. 依赖混乱（没有模块化）
// 所有类都在 classpath 下，容易冲突
// 无法控制包的可见性
// 难以构建大型应用

// 4. 并发性能有限（只有平台线程）
// 一个线程对应一个操作系统线程
// 线程创建和切换开销大
// 难以支持百万级并发
```

### 解决方案：现代 Java 特性

Java 通过以下特性解决这些问题：
- **Lambda 表达式**：简化函数式编程
- **Stream API**：声明式数据处理
- **模块化系统**：更好的代码组织
- **密封类/Record**：更安全的数据建模
- **虚拟线程**：轻量级并发

---

## 16.2 核心原理

### 16.2.1 Lambda 表达式底层实现

Lambda 表达式在字节码层面通过 `invokedynamic` 指令实现。

#### 编译过程

```java
// Java 源码
public class LambdaDemo {
    public static void main(String[] args) {
        Runnable r = () -> System.out.println("Hello");
        r.run();
    }
}

// 编译后的字节码（简化）：
/*
public static void main(java.lang.String[]);
  Code:
     0: invokedynamic #7, 0  // 调用 LambdaMetafactory
     5: astore_1              // 存储到局部变量
     6: aload_1               // 加载 Lambda 对象
     7: invokeinterface #8    // 调用 run() 方法
    12: return
*/
```

#### invokedynamic 指令

`invokedynamic` 是 Java 7 引入的字节码指令，用于支持动态类型语言。

```java
// invokedynamic 的工作流程：
// 1. 调用引导方法（Bootstrap Method）
// 2. 引导方法返回 CallSite（调用点）
// 3. CallSite 指向实际的方法实现
// 4. 后续调用直接通过 CallSite

// Lambda 表达式的引导方法是 LambdaMetafactory.metafactory()
```

#### LambdaMetafactory

```java
// LambdaMetafactory 是 Lambda 表达式的核心实现类
// 它负责在运行时生成 Lambda 的实现类

// 三种实现策略：
// 1. 方法引用：直接引用已有方法（性能最好）
// 2. 静态方法：生成静态方法（无捕获变量）
// 3. 实例方法：生成实例方法（有捕获变量）

public class LambdaImplementationDemo {
    public static void main(String[] args) {
        // 策略 1：方法引用（最优）
        Runnable r1 = System.out::println;
        // 字节码：invokedynamic -> MethodHandle -> 直接调用

        // 策略 2：静态方法（无捕获）
        Runnable r2 = () -> staticMethod();
        // 字节码：invokedynamic -> 生成静态方法

        // 策略 3：实例方法（有捕获）
        String prefix = "Hello";
        Runnable r3 = () -> System.out.println(prefix + " World");
        // 字节码：invokedynamic -> 生成实例方法，捕获 prefix
    }

    public static void staticMethod() {
        System.out.println("Static method");
    }
}
```

#### 字节码分析

```bash
# 查看 Lambda 表达式的字节码
javac LambdaDemo.java
javap -v -p LambdaDemo
```

```
# 输出（关键部分）：
BootstrapMethods:
  0: #16 invokeStatic java/lang/invoke/LambdaMetafactory.metafactory
    Method arguments:
      #17 ()Ljava/lang/Runnable;  // 函数式接口类型
      #18 lambda$main$0           // 实现方法名
      #19 ()V                     // 方法签名

# 生成的合成方法：
private static void lambda$main$0();
  Code:
     0: getstatic #7 // Field java/lang/System.out
     3: ldc #13 // String Hello
     5: invokevirtual #15 // Method java/io/PrintStream.println
     8: return
```

### 16.2.2 Stream API 原理

Stream API 基于 Spliterator 实现，支持惰性求值和并行处理。

#### Spliterator（可拆分迭代器）

```java
// Spliterator 是 Stream 的核心数据结构
// 它可以拆分为多个子 Spliterator，支持并行处理

// Spliterator 的三大功能：
// 1. 遍历元素（tryAdvance）
// 2. 批量遍历（forEachRemaining）
// 3. 拆分（trySplit）

public class SpliteratorDemo {
    public static void main(String[] args) {
        List<Integer> list = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8);

        // 获取 Spliterator
        Spliterator<Integer> spliterator = list.spliterator();

        // 遍历元素
        spliterator.tryAdvance(System.out::println); // 输出：1

        // 批量遍历
        spliterator.forEachRemaining(System.out::println); // 输出：2-8

        // 拆分（用于并行处理）
        Spliterator<Integer> part1 = list.spliterator();
        Spliterator<Integer> part2 = part1.trySplit(); // 拆分为两半
        // part1: [1,2,3,4]
        // part2: [5,6,7,8]
    }
}
```

#### 惰性求值（Lazy Evaluation）

```java
// Stream 的操作分为两类：
// 1. 中间操作（Intermediate）：返回 Stream，惰性执行
// 2. 终端操作（Terminal）：触发执行，返回结果

// 惰性求值：中间操作不会立即执行，而是记录操作链
// 终端操作：遍历整个操作链，一次性执行

public class LazyEvaluationDemo {
    public static void main(String[] args) {
        List<Integer> list = Arrays.asList(1, 2, 3, 4, 5);

        // 中间操作：不会立即执行
        Stream<Integer> stream = list.stream()
            .filter(x -> {
                System.out.println("filter: " + x);
                return x > 2;
            })
            .map(x -> {
                System.out.println("map: " + x);
                return x * 2;
            });

        // 此时没有任何输出！

        // 终端操作：触发执行
        List<Integer> result = stream.collect(Collectors.toList());
        // 输出：
        // filter: 1
        // filter: 2
        // filter: 3
        // map: 3
        // filter: 4
        // map: 4
        // filter: 5
        // map: 5

        // 注意：filter 和 map 是交替执行的（流水线优化）
    }
}
```

#### 短路操作（Short-circuiting）

```java
// 短路操作：不需要处理所有元素就能返回结果
// 常见的短路操作：findFirst、findAny、anyMatch、limit

public class ShortCircuitDemo {
    public static void main(String[] args) {
        List<Integer> list = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        // findFirst：找到第一个就停止
        Optional<Integer> first = list.stream()
            .filter(x -> {
                System.out.println("filter: " + x);
                return x > 5;
            })
            .findFirst();
        // 输出：
        // filter: 1
        // filter: 2
        // filter: 3
        // filter: 4
        // filter: 5
        // filter: 6  // 找到 6 就停止了，不再处理 7-10

        // limit：限制元素个数
        List<Integer> limited = list.stream()
            .filter(x -> {
                System.out.println("filter: " + x);
                return x > 3;
            })
            .limit(2)
            .collect(Collectors.toList());
        // 输出：
        // filter: 1
        // filter: 2
        // filter: 3
        // filter: 4  // 第一个符合条件的
        // filter: 5  // 第二个符合条件的，达到 limit(2)，停止
    }
}
```

#### 并行 Stream

```java
// 并行 Stream 利用多核 CPU 加速处理
// 底层使用 ForkJoinPool 实现

public class ParallelStreamDemo {
    public static void main(String[] args) {
        List<Integer> list = IntStream.range(0, 1_000_000)
            .boxed()
            .collect(Collectors.toList());

        // 串行处理
        long start = System.currentTimeMillis();
        long sum1 = list.stream()
            .filter(x -> x % 2 == 0)
            .mapToLong(x -> x)
            .sum();
        long time1 = System.currentTimeMillis() - start;
        System.out.println("串行: " + time1 + "ms, 结果: " + sum1);

        // 并行处理
        start = System.currentTimeMillis();
        long sum2 = list.parallelStream()
            .filter(x -> x % 2 == 0)
            .mapToLong(x -> x)
            .sum();
        long time2 = System.currentTimeMillis() - start;
        System.out.println("并行: " + time2 + "ms, 结果: " + sum2);

        // 并行通常快 2-4 倍（取决于 CPU 核心数）
    }
}
```

### 16.2.3 模块化系统（JPMS）

Java 9 引入了模块化系统（Java Platform Module System），解决大型项目的代码组织问题。

#### 为什么需要模块化？

```java
// 没有模块化的问题：
// 1. JAR 包地狱：依赖混乱，版本冲突
// 2. 封装性差：所有 public 类都可以被访问
// 3. 启动慢：需要扫描整个 classpath
// 4. 难以裁剪：无法只使用 JDK 的一部分

// 模块化的解决方案：
// 1. 明确的依赖关系：模块之间通过 requires 声明依赖
// 2. 强封装：模块可以控制哪些包对外可见
// 3. 启动优化：只加载需要的模块
// 4. 可裁剪：可以构建自定义的 JDK
```

#### module-info.java

```java
// 模块描述文件：module-info.java
// 定义模块的名称、依赖、导出的包

module com.example.mymodule {
    // 声明依赖的其他模块
    requires java.sql;           // 依赖 java.sql 模块
    requires transitive java.logging; // 传递依赖（使用此模块的模块也能用）

    // 导出包（对外可见）
    exports com.example.api;     // 只导出 api 包
    exports com.example.service to com.example.client; // 只对特定模块导出

    // 提供服务
    provides com.example.spi.MyService with com.example.impl.MyServiceImpl;

    // 使用服务
    uses com.example.spi.MyService;
}
```

#### exports 和 requires

```java
// exports：控制哪些包对外可见
module com.example.api {
    exports com.example.api; // 只有这个包的类可以被其他模块使用
    // com.example.internal 包对外不可见
}

// requires：声明依赖的其他模块
module com.example.app {
    requires com.example.api; // 依赖 api 模块
    // 可以使用 api 模块导出的包
}

// 如果 api 模块使用了 requires transitive：
module com.example.api {
    requires transitive java.sql; // 传递依赖
}

module com.example.app {
    requires com.example.api;
    // 可以直接使用 java.sql，不需要显式 requires
}
```

#### 模块化的编译和运行

```bash
# 编译模块
javac -d mods/com.example.api src/com.example.api/module-info.java src/com.example.api/com/example/api/*.java

# 运行模块
java --module-path mods -m com.example.api/com.example.api.Main

# 参数说明：
# --module-path：指定模块路径
# -m：指定模块和主类
```

### 16.2.4 密封类（Sealed Class）

Java 15 引入密封类，限制哪些类可以继承或实现它。

#### sealed 和 permits

```java
// 密封类：限制子类
public sealed class Shape permits Circle, Rectangle, Triangle {
    // 只有 Circle、Rectangle、Triangle 可以继承 Shape
    // 其他类不能继承
}

// 子类必须是 final、sealed 或 non-sealed
public final class Circle extends Shape {
    // final：不能再被继承
}

public sealed class Rectangle extends Shape permits Square {
    // sealed：继续限制子类
}

public non-sealed class Triangle extends Shape {
    // non-sealed：开放继承，任何类都可以继承
}
```

#### 编译器实现

```java
// 密封类在编译时进行严格检查
// 1. 检查所有子类是否在 permits 列表中
// 2. 检查子类是否是 final/sealed/non-sealed
// 3. 检查 switch 表达式的穷举性

// 字节码层面：
// 密封类会添加 PermittedSubclasses 属性
// JVM 在加载类时检查继承关系

// 示例：
public sealed class Shape permits Circle, Rectangle {
}

// 编译后的字节码：
/*
public sealed class Shape permits Circle, Rectangle {
  // ...
  PermittedSubclasses:
    Circle
    Rectangle
}
*/
```

#### 模式匹配与密封类

```java
// 密封类与模式匹配结合，实现类型安全的分支处理
public sealed interface Expr permits Num, Add, Mul {
}

public record Num(int value) implements Expr {
}

public record Add(Expr left, Expr right) implements Expr {
}

public record Mul(Expr left, Expr right) implements Expr {
}

// 使用模式匹配处理
public int eval(Expr expr) {
    return switch (expr) {
        case Num n -> n.value(); // 自动类型转换
        case Add a -> eval(a.left()) + eval(a.right());
        case Mul m -> eval(m.left()) * eval(m.right());
        // 编译器知道所有可能的子类，不需要 default 分支
    };
}
```

### 16.2.5 Record 类

Java 14 引入 Record 类，用于创建不可变数据载体。

#### Record 的语法

```java
// Record 类：简洁的不可变数据类
public record Point(int x, int y) {
    // 编译器自动生成：
    // 1. 私有 final 字段（x, y）
    // 2. 全参构造方法
    // 3. getter 方法（x(), y()，不是 getX(), getY()）
    // 4. equals()
    // 5. hashCode()
    // 6. toString()
}

// 使用
Point p = new Point(10, 20);
System.out.println(p.x()); // 10（不是 p.getX()）
System.out.println(p); // Point[x=10, y=20]
```

#### 编译器自动生成

```java
// Record 类的源码：
public record Point(int x, int y) {
}

// 编译器生成的等价代码：
public final class Point extends java.lang.Record {
    private final int x;
    private final int y;

    // 全参构造方法
    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    // getter 方法（注意：不是 getX()）
    public int x() {
        return x;
    }

    public int y() {
        return y;
    }

    // equals()
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof Point other)) return false;
        return this.x == other.x && this.y == other.y;
    }

    // hashCode()
    @Override
    public int hashCode() {
        return Objects.hash(x, y);
    }

    // toString()
    @Override
    public String toString() {
        return "Point[x=" + x + ", y=" + y + "]";
    }
}
```

#### Record 的限制

```java
// Record 类的限制：
// 1. 不能继承其他类（隐式继承 java.lang.Record）
// 2. 字段必须是 final 的
// 3. 不能声明实例字段（只能有记录组件）
// 4. 不能是 abstract 的

public record Person(String name, int age) {
    // 可以添加静态字段
    public static final String TYPE = "Person";

    // 可以添加静态方法
    public static Person create(String name, int age) {
        return new Person(name, age);
    }

    // 可以添加实例方法
    public boolean isAdult() {
        return age >= 18;
    }

    // 可以添加构造方法（必须是紧凑构造方法或全参构造方法）
    public Person {
        // 紧凑构造方法：可以添加验证逻辑
        if (age < 0) {
            throw new IllegalArgumentException("Age cannot be negative");
        }
    }
}
```

### 16.2.6 虚拟线程（Virtual Threads）

Java 21 引入虚拟线程（Virtual Threads），实现轻量级并发。

#### 平台线程 vs 虚拟线程

```java
// 平台线程（Platform Thread）：
// - 一对一映射到操作系统线程
// - 创建和切换开销大（约 1MB 栈空间）
// - 难以支持百万级并发

// 虚拟线程（Virtual Thread）：
// - 多路复用到少量平台线程
// - 创建和切换开销小（约几 KB）
// - 轻松支持百万级并发

public class VirtualThreadDemo {
    public static void main(String[] args) throws InterruptedException {
        // 创建平台线程
        Thread platformThread = new Thread(() -> {
            System.out.println("Platform thread: " + Thread.currentThread());
        });
        platformThread.start();

        // 创建虚拟线程
        Thread virtualThread = Thread.ofVirtual().start(() -> {
            System.out.println("Virtual thread: " + Thread.currentThread());
        });

        virtualThread.join();
    }
}
```

#### 虚拟线程的工作原理

```java
// 虚拟线程的调度：
// 1. 虚拟线程在阻塞时（如 I/O、sleep）会卸载（unmount）
// 2. 平台线程可以继续执行其他虚拟线程
// 3. 阻塞结束后，虚拟线程重新调度到平台线程

// 示例：100 万个虚拟线程
public class MillionVirtualThreadsDemo {
    public static void main(String[] args) throws InterruptedException {
        int count = 1_000_000;
        CountDownLatch latch = new CountDownLatch(count);

        long start = System.currentTimeMillis();

        for (int i = 0; i < count; i++) {
            Thread.ofVirtual().start(() -> {
                try {
                    Thread.sleep(1000); // 模拟阻塞操作
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        long time = System.currentTimeMillis() - start;
        System.out.println("耗时: " + time + "ms");

        // 如果用平台线程，100 万个线程会耗尽内存
        // 虚拟线程可以轻松处理
    }
}
```

#### 结构化并发（Structured Concurrency）

```java
// Java 21 引入结构化并发（预览特性）
// 确保虚拟线程的生命周期管理

// 使用 StructuredTaskScope
public class StructuredConcurrencyDemo {
    public static void main(String[] args) {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            // 启动子任务
            Subtask<String> userTask = scope.fork(() -> fetchUser());
            Subtask<List<String>> ordersTask = scope.fork(() -> fetchOrders());

            // 等待所有任务完成
            scope.join();

            // 检查异常
            scope.throwIfFailed();

            // 获取结果
            String user = userTask.get();
            List<String> orders = ordersTask.get();

            System.out.println("User: " + user);
            System.out.println("Orders: " + orders);
        }
        // scope 关闭时，所有子任务自动取消
    }

    static String fetchUser() {
        Thread.sleep(1000);
        return "Alice";
    }

    static List<String> fetchOrders() {
        Thread.sleep(1000);
        return Arrays.asList("Order1", "Order2");
    }
}
```

### 16.2.7 模式匹配（Pattern Matching）

Java 16+ 引入模式匹配，简化类型检查和转换。

#### instanceof 模式匹配

```java
// 传统写法：
Object obj = "Hello";
if (obj instanceof String) {
    String s = (String) obj; // 需要显式转换
    System.out.println(s.length());
}

// 模式匹配写法：
Object obj = "Hello";
if (obj instanceof String s) { // 自动转换
    System.out.println(s.length()); // 直接使用 s
}
```

#### switch 模式匹配

```java
// Java 21 引入 switch 模式匹配（预览特性）

// 传统 switch：
Object obj = 10;
if (obj instanceof Integer) {
    System.out.println("Integer: " + obj);
} else if (obj instanceof String) {
    System.out.println("String: " + obj);
} else if (obj instanceof Long) {
    System.out.println("Long: " + obj);
} else {
    System.out.println("Unknown: " + obj);
}

// switch 模式匹配：
Object obj = 10;
String result = switch (obj) {
    case Integer i -> "Integer: " + i; // 自动转换
    case String s -> "String: " + s;
    case Long l -> "Long: " + l;
    default -> "Unknown: " + obj;
};
System.out.println(result);
```

#### 守卫模式（Guarded Patterns）

```java
// 守卫模式：添加额外条件
Object obj = 10;
String result = switch (obj) {
    case Integer i when i > 0 -> "Positive integer: " + i;
    case Integer i when i < 0 -> "Negative integer: " + i;
    case Integer i -> "Zero";
    case String s when s.isEmpty() -> "Empty string";
    case String s -> "String: " + s;
    default -> "Unknown";
};
```

#### 记录模式（Record Patterns）

```java
// Java 21 引入记录模式（预览特性）
// 可以解构 Record 类

public record Point(int x, int y) {
}

// 传统写法：
Object obj = new Point(10, 20);
if (obj instanceof Point p) {
    int x = p.x();
    int y = p.y();
    System.out.println("x=" + x + ", y=" + y);
}

// 记录模式：
Object obj = new Point(10, 20);
if (obj instanceof Point(int x, int y)) { // 直接解构
    System.out.println("x=" + x + ", y=" + y);
}

// switch 中使用：
String result = switch (obj) {
    case Point(int x, int y) when x == 0 && y == 0 -> "Origin";
    case Point(int x, int y) -> "Point(" + x + ", " + y + ")";
    default -> "Unknown";
};
```

---

## 16.3 基础用法

### Lambda 表达式基础

```java
// Lambda 表达式的基本语法：
// (参数列表) -> { 方法体 }

public class LambdaBasics {
    public static void main(String[] args) {
        // 1. 无参数
        Runnable r1 = () -> System.out.println("Hello");

        // 2. 单个参数（可以省略括号）
        Consumer<String> c1 = s -> System.out.println(s);

        // 3. 多个参数
        Comparator<Integer> c2 = (a, b) -> a - b;

        // 4. 多行方法体（需要大括号和 return）
        Comparator<Integer> c3 = (a, b) -> {
            System.out.println("Comparing " + a + " and " + b);
            return a - b;
        };

        // 5. 方法引用（Lambda 的简写）
        Consumer<String> c4 = System.out::println; // 等价于 s -> System.out.println(s)
    }
}
```

### Stream API 基础

```java
// Stream API 的常用操作

public class StreamBasics {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        // 1. filter：过滤
        List<Integer> evens = numbers.stream()
            .filter(n -> n % 2 == 0) // 保留偶数
            .collect(Collectors.toList());
        // 结果：[2, 4, 6, 8, 10]

        // 2. map：转换
        List<String> strings = numbers.stream()
            .map(n -> "Number: " + n) // 转换为字符串
            .collect(Collectors.toList());
        // 结果：["Number: 1", "Number: 2", ...]

        // 3. sorted：排序
        List<Integer> sorted = numbers.stream()
            .sorted((a, b) -> b - a) // 降序
            .collect(Collectors.toList());
        // 结果：[10, 9, 8, 7, 6, 5, 4, 3, 2, 1]

        // 4. reduce：聚合
        int sum = numbers.stream()
            .reduce(0, (a, b) -> a + b); // 求和
        // 结果：55

        // 5. collect：收集
        Map<Integer, List<Integer>> grouped = numbers.stream()
            .collect(Collectors.groupingBy(n -> n % 3)); // 按余数分组
        // 结果：{0=[3, 6, 9], 1=[1, 4, 7, 10], 2=[2, 5, 8]}
    }
}
```

### Record 类基础

```java
// Record 类的使用

public record Person(String name, int age) {
    // 可以添加验证逻辑
    public Person {
        if (age < 0) {
            throw new IllegalArgumentException("Age cannot be negative");
        }
    }

    // 可以添加实例方法
    public boolean isAdult() {
        return age >= 18;
    }
}

public class RecordDemo {
    public static void main(String[] args) {
        // 创建 Record 实例
        Person p = new Person("Alice", 25);

        // 访问字段（注意：是 x() 不是 getX()）
        System.out.println(p.name()); // Alice
        System.out.println(p.age());  // 25

        // 使用自动生成的方法
        System.out.println(p); // Person[name=Alice, age=25]

        Person p2 = new Person("Alice", 25);
        System.out.println(p.equals(p2)); // true

        // 解构（Java 21+）
        if (obj instanceof Person(String name, int age)) {
            System.out.println(name + " is " + age + " years old");
        }
    }
}
```

---

## 16.4 进阶用法

### Lambda 表达式的性能优化

```java
// Lambda 表达式的性能注意事项

public class LambdaPerformance {
    public static void main(String[] args) {
        // 1. 避免在循环中创建 Lambda
        // 错误：每次循环都创建新的 Lambda
        for (int i = 0; i < 1000; i++) {
            Runnable r = () -> System.out.println(i); // 每次创建新对象
        }

        // 正确：复用 Lambda
        Runnable r = () -> System.out.println("Hello");
        for (int i = 0; i < 1000; i++) {
            r.run(); // 复用同一个 Lambda
        }

        // 2. 优先使用方法引用
        // 较慢：Lambda
        list.forEach(x -> System.out.println(x));

        // 较快：方法引用
        list.forEach(System.out::println);

        // 3. 避免捕获变量
        // 捕获变量的 Lambda 会生成额外的类
        String prefix = "Hello";
        Runnable r1 = () -> System.out.println(prefix); // 捕获 prefix

        // 不捕获变量的 Lambda 更简单
        Runnable r2 = () -> System.out.println("Hello"); // 无捕获
    }
}
```

### Stream API 的并行优化

```java
// Stream API 的并行处理优化

public class StreamParallelOptimization {
    public static void main(String[] args) {
        List<Integer> list = IntStream.range(0, 10_000_000)
            .boxed()
            .collect(Collectors.toList());

        // 1. 串行处理
        long start = System.currentTimeMillis();
        long sum1 = list.stream()
            .filter(x -> x % 2 == 0)
            .mapToLong(x -> x)
            .sum();
        long time1 = System.currentTimeMillis() - start;
        System.out.println("串行: " + time1 + "ms");

        // 2. 并行处理
        start = System.currentTimeMillis();
        long sum2 = list.parallelStream()
            .filter(x -> x % 2 == 0)
            .mapToLong(x -> x)
            .sum();
        long time2 = System.currentTimeMillis() - start;
        System.out.println("并行: " + time2 + "ms");

        // 3. 自定义 ForkJoinPool
        ForkJoinPool customPool = new ForkJoinPool(4); // 4 个线程
        try {
            long sum3 = customPool.submit(() ->
                list.parallelStream()
                    .filter(x -> x % 2 == 0)
                    .mapToLong(x -> x)
                    .sum()
            ).get();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            customPool.shutdown();
        }

        // 4. 避免在并行 Stream 中使用有状态操作
        // 错误：共享可变状态
        List<Integer> result = new ArrayList<>();
        list.parallelStream()
            .filter(x -> x % 2 == 0)
            .forEach(result::add); // 线程不安全！

        // 正确：使用线程安全的数据结构
        List<Integer> safeResult = Collections.synchronizedList(new ArrayList<>());
        list.parallelStream()
            .filter(x -> x % 2 == 0)
            .forEach(safeResult::add);

        // 更好：使用 collect
        List<Integer> betterResult = list.parallelStream()
            .filter(x -> x % 2 == 0)
            .collect(Collectors.toList());
    }
}
```

### 虚拟线程的最佳实践

```java
// 虚拟线程的使用建议

public class VirtualThreadBestPractices {
    public static void main(String[] args) throws InterruptedException {
        // 1. 使用 ExecutorService 管理虚拟线程
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 100; i++) {
                executor.submit(() -> {
                    Thread.sleep(1000);
                    System.out.println("Task completed");
                });
            }
        } // 自动关闭

        // 2. 避免在虚拟线程中使用 synchronized
        // 错误：synchronized 会导致虚拟线程固定（pin）到平台线程
        Object lock = new Object();
        Thread.ofVirtual().start(() -> {
            synchronized (lock) { // 会固定到平台线程
                Thread.sleep(1000);
            }
        });

        // 正确：使用 ReentrantLock
        ReentrantLock reentrantLock = new ReentrantLock();
        Thread.ofVirtual().start(() -> {
            reentrantLock.lock();
            try {
                Thread.sleep(1000);
            } finally {
                reentrantLock.unlock();
            }
        });

        // 3. 避免长时间运行的任务
        // 虚拟线程适合 I/O 密集型任务，不适合 CPU 密集型
        Thread.ofVirtual().start(() -> {
            // I/O 密集型：适合虚拟线程
            try {
                URL url = new URL("https://example.com");
                url.openStream(); // 阻塞 I/O
            } catch (IOException e) {
                e.printStackTrace();
            }
        });

        // 4. 使用 Thread.ofVirtual() 工厂方法
        Thread v1 = Thread.ofVirtual().start(() -> System.out.println("Virtual"));
        Thread v2 = Thread.ofVirtual().name("my-thread").start(() -> System.out.println("Named"));
        Thread v3 = Thread.ofVirtual().unstarted(() -> System.out.println("Unstarted"));
        v3.start(); // 手动启动
    }
}
```

---

## 16.5 核心知识点总结

### 对比表格

| 特性 | 引入版本 | 核心原理 | 适用场景 | 性能影响 |
|------|---------|---------|---------|---------|
| Lambda | Java 8 | invokedynamic + LambdaMetafactory | 函数式编程、简化代码 | 轻微开销 |
| Stream | Java 8 | Spliterator + 惰性求值 | 数据处理、并行计算 | 并行时显著提升 |
| 模块化 | Java 9 | module-info.java + exports/requires | 大型项目、JDK 裁剪 | 启动优化 |
| 密封类 | Java 15 | sealed + permits | 类型安全、模式匹配 | 编译时检查 |
| Record | Java 14 | 编译器自动生成 | 不可变数据 | 无额外开销 |
| 虚拟线程 | Java 21 | 多路复用 + 结构化并发 | I/O 密集型、高并发 | 显著提升 |
| 模式匹配 | Java 16+ | instanceof + switch 模式 | 类型检查、解构 | 无额外开销 |

### 关键公式

```
Lambda = invokedynamic + LambdaMetafactory + 合成方法

Stream = Spliterator + 惰性求值 + 短路操作

虚拟线程 = 多路复用 + 卸载/挂载 + 结构化并发
```

---

## 16.6 新手常见误区

### 误区 1："Lambda 表达式会创建新对象，性能差"

**错！** Lambda 表达式的实现经过优化，大部分情况不会创建新对象：

```java
// 错误理解：每次使用 Lambda 都会创建新对象
// 正确理解：Lambda 的实现经过优化

// 三种实现策略：
// 1. 方法引用：直接引用已有方法，不创建对象
Runnable r1 = System.out::println; // 无对象创建

// 2. 无捕获 Lambda：生成静态方法，只创建一次
Runnable r2 = () -> System.out.println("Hello"); // 只创建一次

// 3. 有捕获 Lambda：每次创建新对象（应该避免）
String prefix = "Hello";
Runnable r3 = () -> System.out.println(prefix); // 每次创建新对象

// 建议：优先使用方法引用或无捕获 Lambda
```

### 误区 2："并行 Stream 总是比串行快"

**错！** 并行 Stream 有额外开销，小数据集可能更慢：

```java
// 错误理解：并行总是更快
// 正确理解：并行有开销，需要权衡

// 并行的开销：
// 1. 拆分数据（Spliterator.trySplit）
// 2. 任务调度（ForkJoinPool）
// 3. 结果合并

// 适合并行的场景：
// 1. 数据量大（> 10000 个元素）
// 2. 计算密集型操作
// 3. 无状态操作（避免共享可变状态）

// 不适合并行的场景：
// 1. 数据量小
// 2. I/O 密集型操作
// 3. 有状态操作（如 forEach 中修改外部集合）

// 建议：先测试，再决定是否使用并行
```

### 误区 3："虚拟线程可以完全替代平台线程"

**错！** 虚拟线程和平台线程各有适用场景：

```java
// 错误理解：虚拟线程可以替代所有平台线程
// 正确理解：虚拟线程和平台线程各有优势

// 虚拟线程适合：
// 1. I/O 密集型任务（网络请求、文件读写）
// 2. 高并发场景（百万级并发）
// 3. 短生命周期任务

// 平台线程适合：
// 1. CPU 密集型任务（计算、加密）
// 2. 需要精确控制线程数量的场景
// 3. 长时间运行的任务

// 建议：
// - I/O 密集型 → 虚拟线程
// - CPU 密集型 → 平台线程
// - 混合场景 → 混合使用
```

### 误区 4："Record 类可以替代所有数据类"

**错！** Record 类有限制，不能替代所有数据类：

```java
// 错误理解：Record 可以替代所有 POJO
// 正确理解：Record 有严格限制

// Record 的限制：
// 1. 不能继承其他类（隐式继承 java.lang.Record）
// 2. 字段必须是 final 的（不可变）
// 3. 不能声明实例字段
// 4. 不能是 abstract 的

// 适合使用 Record 的场景：
// 1. 不可变数据（DTO、VO）
// 2. 配置类
// 3. 返回值对象

// 不适合使用 Record 的场景：
// 1. 需要继承的类
// 2. 需要可变字段的类
// 3. 需要复杂业务逻辑的实体类

// 建议：
// - 不可变数据 → Record
// - 可变实体 → 传统类
```

### 误区 5："模式匹配可以替代 instanceof 检查"

**不完全对！** 模式匹配有适用场景，不能滥用：

```java
// 错误理解：所有 instanceof 都应该用模式匹配
// 正确理解：模式匹配有最佳实践

// 适合使用模式匹配的场景：
// 1. 需要立即使用转换后的变量
if (obj instanceof String s) {
    System.out.println(s.length()); // 立即使用 s
}

// 2. switch 表达式中处理多种类型
String result = switch (obj) {
    case Integer i -> "Integer: " + i;
    case String s -> "String: " + s;
    default -> "Unknown";
};

// 不适合使用模式匹配的场景：
// 1. 只需要检查类型，不需要转换
if (obj instanceof String) { // 不需要模式匹配
    System.out.println("It's a string");
}

// 2. 变量作用域需要扩大
if (obj instanceof String s) {
    // s 的作用域只在 if 块内
}
// System.out.println(s); // 编译错误！

// 建议：
// - 需要立即使用 → 模式匹配
// - 只需要检查 → 传统 instanceof
```

---

## 16.7 动手练习

### 练习 1：Lambda 表达式转换

将以下匿名内部类转换为 Lambda 表达式和方法引用：

```java
public class Exercise1 {
    public static void main(String[] args) {
        // 1. 匿名内部类
        Runnable r1 = new Runnable() {
            @Override
            public void run() {
                System.out.println("Hello");
            }
        };

        // 2. 匿名内部类（有参数）
        Comparator<String> c1 = new Comparator<String>() {
            @Override
            public int compare(String s1, String s2) {
                return s1.length() - s2.length();
            }
        };

        // 3. 匿名内部类（多行）
        Consumer<String> c2 = new Consumer<String>() {
            @Override
            public void accept(String s) {
                System.out.println("Processing: " + s);
                // 更多处理逻辑
            }
        };
    }
}
```

<details>
<summary>点击查看答案</summary>

```java
public class Exercise1Solution {
    public static void main(String[] args) {
        // 1. Lambda 表达式
        Runnable r1 = () -> System.out.println("Hello");

        // 方法引用（如果有的话）
        // Runnable r1 = Main::printHello; // 如果有对应方法

        // 2. Lambda 表达式
        Comparator<String> c1 = (s1, s2) -> s1.length() - s2.length();

        // 方法引用（不适用，因为有复杂逻辑）

        // 3. Lambda 表达式
        Consumer<String> c2 = s -> {
            System.out.println("Processing: " + s);
            // 更多处理逻辑
        };

        // 方法引用（如果有的话）
        // Consumer<String> c2 = Main::processString; // 如果有对应方法
    }

    // 对应的方法引用
    public static void printHello() {
        System.out.println("Hello");
    }

    public static void processString(String s) {
        System.out.println("Processing: " + s);
        // 更多处理逻辑
    }
}
```

</details>

### 练习 2：Stream API 数据处理

使用 Stream API 完成以下任务：

```java
public class Exercise2 {
    public static void main(String[] args) {
        List<Person> people = Arrays.asList(
            new Person("Alice", 25, "New York"),
            new Person("Bob", 30, "London"),
            new Person("Charlie", 35, "New York"),
            new Person("David", 28, "Paris"),
            new Person("Eve", 22, "London")
        );

        // 任务 1：找出所有 25 岁以上的人
        // 任务 2：按城市分组
        // 任务 3：计算平均年龄
        // 任务 4：找出年龄最大的人
    }
}

class Person {
    String name;
    int age;
    String city;

    Person(String name, int age, String city) {
        this.name = name;
        this.age = age;
        this.city = city;
    }

    // getter 方法
    public String getName() { return name; }
    public int getAge() { return age; }
    public String getCity() { return city; }
}
```

<details>
<summary>点击查看答案</summary>

```java
import java.util.*;
import java.util.stream.*;

public class Exercise2Solution {
    public static void main(String[] args) {
        List<Person> people = Arrays.asList(
            new Person("Alice", 25, "New York"),
            new Person("Bob", 30, "London"),
            new Person("Charlie", 35, "New York"),
            new Person("David", 28, "Paris"),
            new Person("Eve", 22, "London")
        );

        // 任务 1：找出所有 25 岁以上的人
        List<Person> over25 = people.stream()
            .filter(p -> p.getAge() > 25) // 过滤年龄 > 25
            .collect(Collectors.toList()); // 收集为 List
        System.out.println("25 岁以上: " + over25);

        // 任务 2：按城市分组
        Map<String, List<Person>> byCity = people.stream()
            .collect(Collectors.groupingBy(Person::getCity)); // 按城市分组
        System.out.println("按城市分组: " + byCity);

        // 任务 3：计算平均年龄
        double avgAge = people.stream()
            .mapToInt(Person::getAge) // 转换为 IntStream
            .average() // 计算平均值
            .orElse(0); // 默认值
        System.out.println("平均年龄: " + avgAge);

        // 任务 4：找出年龄最大的人
        Optional<Person> oldest = people.stream()
            .max(Comparator.comparingInt(Person::getAge)); // 按年龄比较
        oldest.ifPresent(p -> System.out.println("年龄最大: " + p.getName()));
    }
}

class Person {
    String name;
    int age;
    String city;

    Person(String name, int age, String city) {
        this.name = name;
        this.age = age;
        this.city = city;
    }

    public String getName() { return name; }
    public int getAge() { return age; }
    public String getCity() { return city; }

    @Override
    public String toString() {
        return name + "(" + age + ")";
    }
}
```

</details>

### 练习 3（挑战）：虚拟线程并发任务

使用虚拟线程实现以下并发任务：

```java
public class Exercise3 {
    public static void main(String[] args) throws InterruptedException {
        // 任务：模拟 1000 个并发 HTTP 请求
        // 要求：
        // 1. 使用虚拟线程
        // 2. 每个请求模拟 100ms 延迟
        // 3. 统计总耗时
        // 4. 对比平台线程的实现
    }
}
```

<details>
<summary>点击查看答案</summary>

```java
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class Exercise3Solution {
    public static void main(String[] args) throws InterruptedException {
        int taskCount = 1000;
        CountDownLatch latch = new CountDownLatch(taskCount);
        AtomicInteger successCount = new AtomicInteger(0);

        // 1. 虚拟线程实现
        long start = System.currentTimeMillis();

        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < taskCount; i++) {
                executor.submit(() -> {
                    try {
                        // 模拟 HTTP 请求
                        Thread.sleep(100);
                        successCount.incrementAndGet();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    } finally {
                        latch.countDown();
                    }
                });
            }
        }

        latch.await();
        long virtualTime = System.currentTimeMillis() - start;
        System.out.println("虚拟线程: " + virtualTime + "ms, 成功: " + successCount.get());

        // 2. 平台线程实现（对比）
        latch = new CountDownLatch(taskCount);
        successCount = new AtomicInteger(0);
        start = System.currentTimeMillis();

        // 使用固定大小的线程池（模拟平台线程限制）
        ExecutorService platformExecutor = Executors.newFixedThreadPool(100);
        for (int i = 0; i < taskCount; i++) {
            platformExecutor.submit(() -> {
                try {
                    Thread.sleep(100);
                    successCount.incrementAndGet();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        platformExecutor.shutdown();
        long platformTime = System.currentTimeMillis() - start;
        System.out.println("平台线程: " + platformTime + "ms, 成功: " + successCount.get());

        // 输出示例：
        // 虚拟线程: 200ms, 成功: 1000
        // 平台线程: 1100ms, 成功: 1000
        // 虚拟线程快 5 倍以上！
    }
}
```

</details>

---

## 教程总结与后续学习建议

恭喜你完成了整个 Java 原理教程！在这 16 章中，我们从 JVM 内存结构开始，一路深入到现代 Java 特性的底层实现。

### 知识回顾

我们学习了：
1. **JVM 基础**：内存模型、运行时数据区、类加载机制
2. **字节码原理**：.class 文件结构、字节码指令、字节码增强
3. **性能优化**：JIT 编译、逃逸分析、锁优化、内存优化
4. **新特性原理**：Lambda、Stream、模块化、虚拟线程

### 后续学习建议

#### 1. 深入源码

- 阅读 OpenJDK 源码：https://github.com/openjdk/jdk
- 重点关注：java.lang.invoke、java.util.stream、java.lang.reflect

#### 2. 实践项目

- 实现一个简单的 JVM（参考《自己动手写 Java 虚拟机》）
- 使用 ASM/ByteBuddy 实现一个 AOP 框架
- 使用虚拟线程重构现有的并发应用

#### 3. 进阶方向

- **JVM 调优**：GC 调优、内存调优、线程调优
- **字节码工程**：热修复、动态代理、代码生成
- **并发编程**：锁机制、并发容器、异步编程
- **新特性跟踪**：关注 Java 版本更新，学习新特性

#### 4. 推荐资源

- **书籍**：
  - 《深入理解 Java 虚拟机》（周志明）
  - 《Java 并发编程的艺术》
  - 《Java 字节码原理与实战》

- **在线资源**：
  - Oracle 官方文档：https://docs.oracle.com/en/java/
  - Baeldung：https://www.baeldung.com/
  - Java 杂志：https://www.oracle.com/technical-resources/articles/

#### 5. 社区参与

- 参与开源项目（OpenJDK、Spring、Hibernate）
- 参加技术会议（JVM Language Summit、Devoxx）
- 分享学习笔记（博客、演讲）

### 最后的建议

Java 原理的学习是一个持续的过程。不要期望一次就能完全理解所有内容，而是应该：

1. **循序渐进**：从基础开始，逐步深入
2. **动手实践**：写代码验证理论
3. **持续学习**：Java 在不断发展，保持学习的热情
4. **分享交流**：与他人分享，加深理解

祝你在 Java 的学习道路上一路顺风！

---

## 下一章预告

本教程到此结束。但这只是 Java 学习的起点，接下来你可以：

- 深入学习 Spring 框架原理
- 探索微服务架构设计
- 研究分布式系统原理
- 学习云原生技术栈

Java 的世界广阔无垠，愿你保持好奇，不断探索！
