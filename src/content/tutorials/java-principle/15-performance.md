---
title: "第十五章：性能优化原理"
description: "深入理解 JIT 编译、逃逸分析、锁优化、内存模型优化等 JVM 性能优化技术"
---

# 第十五章：性能优化原理

## 本章导读

在前面几章我们学习了类加载和字节码原理。但你有没有想过：

- Java 代码编译成字节码后，JVM 是怎么让它跑得更快的？
- 为什么有时候 Java 程序"越跑越快"？这背后有什么黑科技？
- 什么是逃逸分析？它能让对象不在堆上分配吗？
- synchronized 看起来那么重，JVM 是怎么优化它的？
- 为什么字符串拼接用 StringBuilder 比 + 快？底层原理是什么？

这一章我们就来揭开 JVM 性能优化的神秘面纱。理解了这些优化原理，你就能写出对 JVM 更友好的代码，让程序跑得更快、更省内存。

学完本章，你将能够：
- 理解 JIT 编译器的工作原理（C1/C2、分层编译）
- 掌握热点代码探测机制（方法调用计数、回边计数）
- 理解逃逸分析的三种优化（标量替换、栈上分配、锁消除）
- 掌握锁优化技术（锁粗化、锁消除、偏向锁）
- 了解内存分配优化（TLAB）
- 理解字符串优化原理（常量池、String.intern）
- 掌握对象创建的完整过程

---

## 1 为什么需要性能优化？

### 生活化类比

想象你开了一家餐厅：

**没有优化的餐厅**：
- 每道菜都现做（解释执行字节码）
- 客人点菜后，厨师从头开始准备（每次调用都重新编译）
- 所有食材都放在一个大仓库，每次取都要走很远（堆内存分配慢）

**优化后的餐厅**：
- 热门菜品提前准备好半成品（JIT 编译热点代码）
- 常用食材放在厨房手边（栈上分配、TLAB）
- 厨师根据经验优化做菜流程（C2 编译器优化）

### 痛点分析

如果没有性能优化，Java 会面临这些问题：

```java
// 1. 解释执行太慢
// 字节码指令需要逐条解释执行，比机器码慢 10-100 倍
// 一个循环执行 100 万次，每次都解释，性能灾难

// 2. 内存分配慢
// 所有对象都在堆上分配，需要线程同步，竞争激烈
// 高并发场景下，对象创建成为瓶颈

// 3. 锁开销大
// synchronized 需要操作系统介入，上下文切换成本高
// 即使没有竞争，也要付出锁的代价

// 4. 字符串操作慢
// 每次字符串拼接都创建新对象
// 大量拼接时产生大量垃圾，GC 压力大
```

### 解决方案：JVM 性能优化

JVM 通过以下技术解决性能问题：
- **JIT 编译**：热点代码编译为机器码，接近 C/C++ 性能
- **逃逸分析**：优化对象分配和锁
- **锁优化**：减少锁的开销
- **内存优化**：TLAB、栈上分配
- **字符串优化**：常量池、intern

---

## 2 核心原理

### 15.2.1 JIT 编译器原理

JIT（Just-In-Time）编译器是 JVM 的核心优化组件，负责将热点代码编译为机器码。

#### JIT 编译流程

```
┌─────────────────────────────────────────────────────────┐
│  Java 源码 (.java)                                       │
└─────────────────────────────────────────────────────────┘
                          ↓ javac
┌─────────────────────────────────────────────────────────┐
│  字节码 (.class)                                         │
└─────────────────────────────────────────────────────────┘
                          ↓ 类加载器
┌─────────────────────────────────────────────────────────┐
│  JVM 解释执行                                            │
│  - 字节码解释器（Interpreter）                            │
│  - 热点代码探测器                                         │
└─────────────────────────────────────────────────────────┘
                          ↓ 热点代码
┌─────────────────────────────────────────────────────────┐
│  JIT 编译器                                              │
│  - C1 编译器（客户端编译器）：快速编译，简单优化            │
│  - C2 编译器（服务器编译器）：慢速编译，深度优化            │
└─────────────────────────────────────────────────────────┘
                          ↓ 机器码
┌─────────────────────────────────────────────────────────┐
│  CPU 直接执行机器码                                       │
└─────────────────────────────────────────────────────────┘
```

#### C1 vs C2 编译器

| 特性 | C1 编译器 | C2 编译器 |
|------|----------|----------|
| 别名 | Client Compiler | Server Compiler |
| 编译速度 | 快 | 慢 |
| 优化程度 | 简单优化 | 深度优化 |
| 适用场景 | 启动阶段、简单方法 | 热点代码、复杂方法 |
| 内存占用 | 小 | 大 |
| 优化技术 | 方法内联、常量传播 | 逃逸分析、循环展开、向量化 |

#### 分层编译（JDK 8+）

JDK 8 引入了分层编译，结合 C1 和 C2 的优势：

```
层级 0：解释执行（字节码解释器）
    ↓ 方法调用计数达到阈值
层级 1：C1 编译（简单优化，生成机器码）
    ↓ 执行次数继续增加
层级 2：C1 编译 + 轻量级 C2 优化
    ↓ 执行次数继续增加
层级 3：C1 编译 + 更多 C2 优化
    ↓ 执行次数继续增加
层级 4：C2 编译（深度优化，性能最高）
```

```java
// 演示 JIT 编译的效果
public class JITDemo {
    public static void main(String[] args) {
        // 启动时：解释执行，较慢
        long start = System.currentTimeMillis();
        for (int i = 0; i < 1_000_000; i++) {
            testMethod();
        }
        long time1 = System.currentTimeMillis() - start;
        System.out.println("前 100 万次: " + time1 + "ms");

        // 继续执行：JIT 编译后，较快
        start = System.currentTimeMillis();
        for (int i = 0; i < 1_000_000; i++) {
            testMethod();
        }
        long time2 = System.currentTimeMillis() - start;
        System.out.println("后 100 万次: " + time2 + "ms");

        // 输出示例：
        // 前 100 万次: 50ms（解释执行）
        // 后 100 万次: 5ms（JIT 编译后）
        // 性能提升 10 倍！
    }

    public static void testMethod() {
        // 简单方法，会被 JIT 编译
        int x = 10;
        int y = 20;
        int z = x + y;
    }
}
```

### 15.2.2 热点代码探测

JVM 通过两种计数器探测热点代码：

#### 方法调用计数

```java
// 每次调用方法时，计数器 +1
// 达到阈值后，触发 JIT 编译

// 阈值设置（JDK 8 默认）：
// -client 模式：1500 次
// -server 模式：10000 次

// 可以通过 JVM 参数调整：
// -XX:CompileThreshold=10000  // 设置阈值

public class InvocationCountDemo {
    public static void main(String[] args) {
        // hotMethod 会被调用 20000 次
        // 达到阈值后，JIT 会编译它
        for (int i = 0; i < 20000; i++) {
            hotMethod();
        }
    }

    public static void hotMethod() {
        // 热点方法
        int sum = 0;
        for (int i = 0; i < 100; i++) {
            sum += i;
        }
    }
}
```

#### 回边计数

```java
// 回边：循环跳转指令
// 每次执行回边指令，计数器 +1
// 达到阈值后，触发 JIT 编译

public class BackEdgeDemo {
    public static void main(String[] args) {
        // 循环 100000 次
        // 每次循环都会触发回边计数
        for (int i = 0; i < 100000; i++) {
            // 循环体
        }
    }
}

// 字节码层面：
/*
public static void main(java.lang.String[]);
  Code:
     0: iconst_0
     1: istore_1
     2: iload_1
     3: ldc #2        // int 100000
     5: if_icmpge 14  // 如果 i >= 100000，跳转到第 14 行（循环结束）
     8: ...            // 循环体
    11: iinc 1, 1      // i++
    14: goto 2         // 回边指令：跳转回第 2 行（循环条件判断）
    17: return
*/
```

### 15.2.3 逃逸分析

逃逸分析是 C2 编译器的重要优化技术，分析对象的作用域。

#### 什么是"逃逸"？

```java
// 对象"逃逸"：对象的作用域超出了方法
public void method1() {
    Object obj = new Object(); // 创建对象
    // obj 只在方法内使用，没有逃逸
}

public void method2() {
    Object obj = new Object();
    globalVar = obj; // obj 赋值给全局变量，逃逸了！
}

public void method3() {
    Object obj = new Object();
    return obj; // obj 作为返回值，逃逸了！
}
```

#### 逃逸分析的三种优化

**1. 标量替换（Scalar Replacement）**

```java
// 如果对象没有逃逸，JVM 可以把它拆解为基本类型
public void test() {
    Point p = new Point(10, 20); // 创建对象
    int x = p.x; // 使用 x
    int y = p.y; // 使用 y
    // p 没有逃逸，只在方法内使用
}

// 优化后（标量替换）：
public void test() {
    int x = 10; // 直接使用基本类型
    int y = 20;
    // 不需要创建 Point 对象！
}

// Point 类定义
class Point {
    int x, y;
    Point(int x, int y) {
        this.x = x;
        this.y = y;
    }
}
```

**2. 栈上分配（Stack Allocation）**

```java
// 如果对象没有逃逸，可以在栈上分配而不是堆上
public void test() {
    Point p = new Point(10, 20);
    // p 没有逃逸，可以在栈上分配
    // 方法结束后，p 自动销毁，不需要 GC
}

// 栈上分配的优势：
// 1. 分配速度快（栈指针移动即可）
// 2. 不需要 GC（方法结束自动回收）
// 3. 减少堆内存压力
```

**3. 锁消除（Lock Elimination）**

```java
// 如果对象没有逃逸，且使用了同步锁，可以消除锁
public void test() {
    StringBuffer sb = new StringBuffer();
    // sb 没有逃逸，只在方法内使用
    // StringBuffer 的方法都是 synchronized 的
    // 但因为没有其他线程访问 sb，锁是多余的
    sb.append("Hello");
    sb.append("World");
}

// 优化后（锁消除）：
public void test() {
    StringBuffer sb = new StringBuffer();
    // 去掉 synchronized，直接调用
    sb.appendUnsafe("Hello"); // 伪代码
    sb.appendUnsafe("World");
}
```

#### 验证逃逸分析

```java
// 通过 JVM 参数控制逃逸分析
// -XX:+DoEscapeAnalysis      // 开启逃逸分析（JDK 6u19+ 默认开启）
// -XX:-DoEscapeAnalysis      // 关闭逃逸分析

public class EscapeAnalysisDemo {
    public static void main(String[] args) {
        long start = System.currentTimeMillis();
        for (int i = 0; i < 1_000_000; i++) {
            createObject();
        }
        long time = System.currentTimeMillis() - start;
        System.out.println("耗时: " + time + "ms");

        // 开启逃逸分析：约 5ms（栈上分配，无 GC）
        // 关闭逃逸分析：约 50ms（堆上分配，触发 GC）
    }

    public static void createObject() {
        // 对象没有逃逸
        Object obj = new Object();
        // obj 只在方法内使用，方法结束就销毁
    }
}

// 运行命令：
// java -XX:+DoEscapeAnalysis EscapeAnalysisDemo  // 开启
// java -XX:-DoEscapeAnalysis EscapeAnalysisDemo  // 关闭
```

### 15.2.4 锁优化技术

#### 锁粗化（Lock Coarsening）

```java
// 锁粗化：把多个连续的锁合并为一个
public void test() {
    synchronized (this) { // 第一次加锁
        // 操作 1
    }
    synchronized (this) { // 第二次加锁
        // 操作 2
    }
    synchronized (this) { // 第三次加锁
        // 操作 3
    }
}

// 优化后（锁粗化）：
public void test() {
    synchronized (this) { // 只加一次锁
        // 操作 1
        // 操作 2
        // 操作 3
    }
}
```

#### 锁消除（Lock Elimination）

```java
// 锁消除：去掉不可能有竞争的锁
public void test() {
    StringBuffer sb = new StringBuffer();
    // sb 是局部变量，没有其他线程访问
    // 但 StringBuffer.append() 是 synchronized 的
    // JVM 会消除这些不必要的锁
    sb.append("Hello");
    sb.append("World");
}

// 优化后（锁消除）：
public void test() {
    StringBuffer sb = new StringBuffer();
    // 直接调用非同步版本
    sb.append("Hello");
    sb.append("World");
}
```

#### 偏向锁（Biased Locking）

```java
// 偏向锁：假设锁总是被同一个线程获取
// 适用于：只有一个线程访问同步块的场景

// 锁的升级过程：
// 无锁 → 偏向锁 → 轻量级锁 → 重量级锁

// 偏向锁的工作原理：
// 1. 第一次获取锁时，在对象头记录线程 ID
// 2. 后续获取锁时，检查线程 ID 是否匹配
// 3. 如果匹配，直接获取（无需 CAS 操作）
// 4. 如果不匹配，撤销偏向，升级为轻量级锁

// JVM 参数：
// -XX:+UseBiasedLocking      // 开启偏向锁（JDK 6+ 默认开启）
// -XX:-UseBiasedLocking      // 关闭偏向锁

public class BiasedLockDemo {
    private final Object lock = new Object();

    public void method() {
        // 假设只有一个线程调用这个方法
        synchronized (lock) {
            // 偏向锁生效，性能接近无锁
        }
    }
}
```

### 15.2.5 内存分配优化（TLAB）

TLAB（Thread Local Allocation Buffer）是 JVM 为每个线程分配的私有内存缓冲区。

#### 为什么需要 TLAB？

```java
// 没有 TLAB 的问题：
// 所有线程共享堆内存，分配对象时需要线程同步
// 高并发场景下，锁竞争成为瓶颈

// 有 TLAB 的优化：
// 每个线程有自己的私有缓冲区
// 分配对象时不需要锁，直接移动指针
// 只有 TLAB 用完时，才需要同步分配新的 TLAB
```

#### TLAB 工作原理

```
┌─────────────────────────────────────────────────────────┐
│  堆内存（Heap）                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ TLAB 线程 1  │ │ TLAB 线程 2  │ │ TLAB 线程 3  │ ...   │
│  │ [已用][空闲] │ │ [已用][空闲] │ │ [已用][空闲] │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────┘

// 线程 1 分配对象：
// 1. 检查 TLAB 是否有足够空间
// 2. 如果有，直接移动指针（无锁）
// 3. 如果没有，申请新的 TLAB（需要锁）
```

```java
// TLAB 相关 JVM 参数
// -XX:+UseTLAB                  // 开启 TLAB（默认开启）
// -XX:-UseTLAB                  // 关闭 TLAB
// -XX:TLABRefillWasteFraction   // TLAB 浪费比例（默认 10）

public class TLABDemo {
    public static void main(String[] args) {
        // 高并发创建对象，测试 TLAB 性能
        int threadCount = 10;
        Thread[] threads = new Thread[threadCount];

        long start = System.currentTimeMillis();

        for (int i = 0; i < threadCount; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 100_000; j++) {
                    Object obj = new Object();
                }
            });
            threads[i].start();
        }

        for (Thread t : threads) {
            try {
                t.join();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }

        long time = System.currentTimeMillis() - start;
        System.out.println("耗时: " + time + "ms");

        // 开启 TLAB：约 50ms
        // 关闭 TLAB：约 200ms
    }
}

// 运行命令：
// java -XX:+UseTLAB TLABDemo   // 开启 TLAB
// java -XX:-UseTLAB TLABDemo   // 关闭 TLAB
```

### 15.2.6 字符串优化

#### 字符串常量池

```java
// 字符串常量池：JVM 维护的字符串缓存
// 目的：避免重复创建相同的字符串对象

public class StringPoolDemo {
    public static void main(String[] args) {
        // 方式一：字面量（使用常量池）
        String s1 = "Hello"; // 在常量池中查找，没有则创建
        String s2 = "Hello"; // 直接返回常量池中的引用
        System.out.println(s1 == s2); // true（同一个对象）

        // 方式二：new 对象（不使用常量池）
        String s3 = new String("Hello"); // 在堆上创建新对象
        String s4 = new String("Hello"); // 又创建一个新对象
        System.out.println(s3 == s4); // false（不同对象）
        System.out.println(s3.equals(s4)); // true（内容相同）

        // 方式三：intern() 方法
        String s5 = new String("World"); // 堆上创建
        String s6 = s5.intern(); // 返回常量池中的引用
        String s7 = "World"; // 常量池中的引用
        System.out.println(s6 == s7); // true（都是常量池引用）
    }
}
```

#### String.intern() 原理

```java
// intern() 方法：
// 1. 检查常量池中是否存在相同内容的字符串
// 2. 如果存在，返回常量池中的引用
// 3. 如果不存在，将字符串加入常量池，返回引用

// JDK 6 vs JDK 7+ 的区别：
// JDK 6：常量池在方法区，intern() 会复制字符串到方法区
// JDK 7+：常量池在堆中，intern() 只记录引用，不复制

public class InternDemo {
    public static void main(String[] args) {
        // 测试 intern() 的性能优化
        String[] strings = new String[100_000];
        
        // 不使用 intern
        long start = System.currentTimeMillis();
        for (int i = 0; i < 100_000; i++) {
            strings[i] = new String("String" + i);
        }
        long time1 = System.currentTimeMillis() - start;

        // 使用 intern
        start = System.currentTimeMillis();
        for (int i = 0; i < 100_000; i++) {
            strings[i] = new String("String" + i).intern();
        }
        long time2 = System.currentTimeMillis() - start;

        System.out.println("不使用 intern: " + time1 + "ms");
        System.out.println("使用 intern: " + time2 + "ms");
    }
}
```

### 15.2.7 对象创建过程

当执行 `new Object()` 时，JVM 会执行以下步骤：

```java
// Java 代码
Object obj = new Object();

// 底层执行步骤：
// 1. 类加载检查：检查 Object 类是否已加载、解析、初始化
// 2. 内存分配：为对象分配内存空间
//    - 指针碰撞（堆内存规整时）
//    - 空闲列表（堆内存不规整时）
//    - TLAB 分配（线程私有缓冲区）
// 3. 初始化零值：将内存空间初始化为零值（int=0, boolean=false, 引用=null）
// 4. 设置对象头：设置 Mark Word、Klass Pointer 等元数据
// 5. 执行构造方法：调用 <init> 方法初始化对象
```

#### 字节码层面

```java
public class ObjectCreationDemo {
    public static void main(String[] args) {
        Object obj = new Object();
    }
}

// 字节码：
/*
public static void main(java.lang.String[]);
  Code:
     0: new #2          // 创建 Object 对象（步骤 1-4）
     3: dup             // 复制引用（用于后续初始化）
     4: invokespecial #1 // 调用 <init> 方法（步骤 5）
     7: astore_1        // 存储到局部变量表
     8: return
*/
```

---

## 3 基础用法

### 验证 JIT 编译效果

```java
public class JITVerification {
    public static void main(String[] args) {
        // 预热：让 JIT 编译热点代码
        for (int i = 0; i < 100_000; i++) {
            hotMethod();
        }

        // 测试性能
        long start = System.nanoTime();
        for (int i = 0; i < 1_000_000; i++) {
            hotMethod();
        }
        long time = System.nanoTime() - start;
        System.out.println("JIT 编译后: " + time + "ns");

        // 输出示例：
        // JIT 编译后: 2000000ns（约 2ms）
    }

    public static void hotMethod() {
        // 热点方法：简单的数学运算
        int sum = 0;
        for (int i = 0; i < 100; i++) {
            sum += i;
        }
    }
}
```

### 查看 JIT 编译日志

```bash
# 查看 JIT 编译信息
java -XX:+PrintCompilation YourClass

# 输出示例：
/*
  123   1       java.lang.String::hashCode (64 bytes)
  145   2       java.lang.String::equals (81 bytes)
  234   3       com.example.YourClass::hotMethod (15 bytes)
*/

# 参数说明：
// 123：编译时的时间戳
// 1：编译级别（1=C1, 4=C2）
// java.lang.String::hashCode：方法名
// (64 bytes)：字节码大小
```

### 验证逃逸分析

```java
public class EscapeAnalysisVerification {
    public static void main(String[] args) {
        // 测试 1：对象没有逃逸
        long start = System.currentTimeMillis();
        for (int i = 0; i < 1_000_000; i++) {
            noEscape();
        }
        long time1 = System.currentTimeMillis() - start;

        // 测试 2：对象逃逸
        start = System.currentTimeMillis();
        for (int i = 0; i < 1_000_000; i++) {
            escape();
        }
        long time2 = System.currentTimeMillis() - start;

        System.out.println("对象没有逃逸: " + time1 + "ms");
        System.out.println("对象逃逸: " + time2 + "ms");

        // 开启逃逸分析：
        // 对象没有逃逸: 5ms（栈上分配，无 GC）
        // 对象逃逸: 50ms（堆上分配，触发 GC）
    }

    // 对象没有逃逸
    public static void noEscape() {
        Object obj = new Object();
        // obj 只在方法内使用
    }

    // 对象逃逸
    public static Object globalObj;
    public static void escape() {
        Object obj = new Object();
        globalObj = obj; // 赋值给全局变量，逃逸了
    }
}

// 运行命令：
// java -XX:+DoEscapeAnalysis EscapeAnalysisVerification
// java -XX:-DoEscapeAnalysis EscapeAnalysisVerification
```

---

## 4 进阶用法

### 使用 JMH 进行性能测试

```java
import org.openjdk.jmh.annotations.*;
import java.util.concurrent.TimeUnit;

// JMH（Java Microbenchmark Harness）是官方推荐的基准测试工具

@BenchmarkMode(Mode.AverageTime) // 测量平均时间
@OutputTimeUnit(TimeUnit.NANOSECONDS) // 输出单位：纳秒
@Warmup(iterations = 5, time = 1) // 预热 5 轮，每轮 1 秒
@Measurement(iterations = 5, time = 1) // 测量 5 轮，每轮 1 秒
@Fork(1) // 启动 1 个 JVM 进程
@State(Scope.Thread) // 每个线程一个实例
public class JMHDemo {

    private int value = 0;

    @Benchmark
    public void testNoEscape() {
        // 对象没有逃逸
        Object obj = new Object();
        value++;
    }

    @Benchmark
    public void testEscape() {
        // 对象逃逸
        Object obj = new Object();
        globalObj = obj;
        value++;
    }

    private Object globalObj;

    public static void main(String[] args) throws Exception {
        org.openjdk.jmh.runner.Runner.main(args);
    }
}

// 运行结果示例：
/*
Benchmark                    Mode  Cnt   Score   Error  Units
JMHDemo.testEscape           avgt    5  15.234 ± 0.123  ns/op
JMHDemo.testNoEscape         avgt    5   2.345 ± 0.045  ns/op
*/
// testNoEscape 比 testEscape 快约 6 倍（逃逸分析优化）
```

### 优化 synchronized 性能

```java
public class SynchronizedOptimization {
    
    // 优化前：多次加锁解锁
    public void method1() {
        synchronized (this) { // 第一次加锁
            // 操作 1
        }
        synchronized (this) { // 第二次加锁
            // 操作 2
        }
        synchronized (this) { // 第三次加锁
            // 操作 3
        }
    }

    // 优化后：锁粗化
    public void method2() {
        synchronized (this) { // 只加一次锁
            // 操作 1
            // 操作 2
            // 操作 3
        }
    }

    // 优化前：不必要的锁
    public void method3() {
        StringBuffer sb = new StringBuffer();
        sb.append("Hello"); // synchronized 方法
        sb.append("World"); // synchronized 方法
        // sb 是局部变量，没有其他线程访问
    }

    // 优化后：锁消除
    public void method4() {
        StringBuffer sb = new StringBuffer();
        // JVM 会消除 synchronized，直接调用非同步版本
        sb.append("Hello");
        sb.append("World");
    }
}
```

### 使用 String.intern() 优化内存

```java
import java.util.HashMap;
import java.util.Map;

public class StringInternOptimization {
    
    // 场景：大量重复字符串
    public static void main(String[] args) {
        // 不使用 intern
        Map<String, Object> map1 = new HashMap<>();
        long start = System.currentTimeMillis();
        for (int i = 0; i < 1_000_000; i++) {
            String key = new String("key" + (i % 100)); // 重复创建
            map1.put(key, new Object());
        }
        long time1 = System.currentTimeMillis() - start;

        // 使用 intern
        Map<String, Object> map2 = new HashMap<>();
        start = System.currentTimeMillis();
        for (int i = 0; i < 1_000_000; i++) {
            String key = new String("key" + (i % 100)).intern(); // 使用常量池
            map2.put(key, new Object());
        }
        long time2 = System.currentTimeMillis() - start;

        System.out.println("不使用 intern: " + time1 + "ms");
        System.out.println("使用 intern: " + time2 + "ms");

        // 使用 intern 后：
        // 1. 内存占用减少（重复字符串共享同一个引用）
        // 2. HashMap 查找更快（引用比较 vs 内容比较）
    }
}
```

---

## 5 核心知识点总结

### 对比表格

| 优化技术 | 原理 | 适用场景 | 性能提升 |
|---------|------|---------|---------|
| JIT 编译 | 热点代码编译为机器码 | 频繁调用的方法 | 10-100 倍 |
| 逃逸分析 | 分析对象作用域 | 局部对象、同步块 | 2-10 倍 |
| 标量替换 | 对象拆解为基本类型 | 小对象、未逃逸 | 显著 |
| 栈上分配 | 对象在栈上分配 | 未逃逸对象 | 显著 |
| 锁消除 | 去掉不必要的锁 | 局部变量同步 | 2-5 倍 |
| 锁粗化 | 合并连续的锁 | 连续同步块 | 10-30% |
| 偏向锁 | 假设单线程访问 | 单线程同步 | 接近无锁 |
| TLAB | 线程私有缓冲区 | 高并发对象创建 | 2-5 倍 |
| 字符串常量池 | 缓存字符串 | 重复字符串 | 显著 |

### 关键公式

```
JIT 编译 = 方法调用计数 + 回边计数 → 热点代码 → C1/C2 编译 → 机器码

逃逸分析 = 对象未逃逸 → 标量替换 / 栈上分配 / 锁消除

对象创建 = 类加载检查 + 内存分配（TLAB） + 初始化零值 + 设置对象头 + 执行构造方法
```

---

## 6 新手常见误区

### 误区 1："JIT 编译会让所有代码都变快"

**错！** JIT 只编译热点代码，冷代码仍然解释执行：

```java
// 错误理解：所有代码都会被 JIT 编译
// 正确理解：只有热点代码才会被 JIT 编译

// 热点代码的判断标准：
// 1. 方法调用计数达到阈值（默认 10000 次）
// 2. 循环回边计数达到阈值

// 冷代码（很少执行的方法）不会被 JIT 编译
// 因为编译本身有开销，不值得
```

### 误区 2："逃逸分析可以让所有对象都在栈上分配"

**错！** 逃逸分析有严格限制：

```java
// 错误理解：所有对象都可以在栈上分配
// 正确理解：只有未逃逸的小对象才能栈上分配

// 不能栈上分配的情况：
// 1. 对象逃逸了（赋值给全局变量、作为返回值）
// 2. 对象太大（栈空间有限）
// 3. 对象类型复杂（包含引用类型字段）

// 逃逸分析的优化是"尽力而为"，不保证一定优化
```

### 误区 3："偏向锁总是比轻量级锁快"

**错！** 偏向锁有适用场景：

```java
// 错误理解：偏向锁总是最快
// 正确理解：偏向锁只在单线程场景下最快

// 偏向锁的适用场景：
// 1. 只有一个线程访问同步块
// 2. 锁竞争很少

// 偏向锁的劣势：
// 1. 多线程竞争时，需要撤销偏向，开销大
// 2. 撤销偏向需要等待全局安全点（Safe Point）

// 如果锁竞争激烈，偏向锁反而更慢
// 可以通过 -XX:-UseBiasedLocking 关闭偏向锁
```

### 误区 4："String.intern() 总是能优化性能"

**错！** intern() 有开销，需要谨慎使用：

```java
// 错误理解：所有字符串都应该用 intern()
// 正确理解：只有大量重复字符串才适合 intern()

// intern() 的开销：
// 1. 需要检查常量池（哈希查找）
// 2. 可能需要将字符串加入常量池
// 3. JDK 7+ 常量池在堆中，可能触发 GC

// 适合使用 intern() 的场景：
// 1. 大量重复字符串（如 SQL 语句、XML 标签）
// 2. 字符串比较频繁（引用比较 vs 内容比较）

// 不适合使用 intern() 的场景：
// 1. 字符串几乎不重复
// 2. 字符串生命周期短
```

### 误区 5："TLAB 可以完全消除锁竞争"

**错！** TLAB 只能减少锁竞争，不能完全消除：

```java
// 错误理解：TLAB 完全不需要锁
// 正确理解：TLAB 减少锁竞争，但不能完全消除

// TLAB 的锁竞争场景：
// 1. TLAB 用完时，需要申请新的 TLAB（需要锁）
// 2. 大对象直接分配在堆上（需要锁）
// 3. TLAB 空间不足时（需要锁）

// TLAB 的优势：
// 大部分对象分配不需要锁（TLAB 内部分配）
// 只有少数情况需要锁（TLAB  refill）
```

---

## 7 动手练习

### 练习 1：验证 JIT 编译效果

编写代码验证 JIT 编译对性能的影响：
1. 创建一个热点方法
2. 测量预热前后的执行时间
3. 使用 `-XX:+PrintCompilation` 查看 JIT 编译日志

<details>
<summary>点击查看答案</summary>

```java
public class Exercise1 {
    public static void main(String[] args) {
        // 测试 1：预热前（解释执行）
        long start = System.nanoTime();
        for (int i = 0; i < 1000; i++) {
            hotMethod();
        }
        long time1 = System.nanoTime() - start;
        System.out.println("预热前: " + time1 + "ns");

        // 预热：让 JIT 编译
        for (int i = 0; i < 100_000; i++) {
            hotMethod();
        }

        // 测试 2：预热后（JIT 编译）
        start = System.nanoTime();
        for (int i = 0; i < 1000; i++) {
            hotMethod();
        }
        long time2 = System.nanoTime() - start;
        System.out.println("预热后: " + time2 + "ns");

        System.out.println("性能提升: " + (time1 / (double) time2) + "倍");

        // 运行命令：
        // java -XX:+PrintCompilation Exercise1
        // 观察 JIT 编译日志
    }

    public static void hotMethod() {
        // 热点方法：数学运算
        int sum = 0;
        for (int i = 0; i < 100; i++) {
            sum += i;
        }
    }
}

// 输出示例：
/*
预热前: 5000000ns
预热后: 500000ns
性能提升: 10.0倍
*/

// JIT 编译日志：
/*
  123   1       Exercise1::hotMethod (15 bytes)
*/
```

</details>

### 练习 2：验证逃逸分析

编写代码验证逃逸分析对性能的影响：
1. 创建两个方法：一个对象未逃逸，一个对象逃逸
2. 测量两种情况的执行时间
3. 使用 `-XX:+/-DoEscapeAnalysis` 控制逃逸分析开关

<details>
<summary>点击查看答案</summary>

```java
public class Exercise2 {
    private static Object globalObj;

    public static void main(String[] args) {
        // 测试 1：对象未逃逸
        long start = System.currentTimeMillis();
        for (int i = 0; i < 1_000_000; i++) {
            noEscape();
        }
        long time1 = System.currentTimeMillis() - start;

        // 测试 2：对象逃逸
        start = System.currentTimeMillis();
        for (int i = 0; i < 1_000_000; i++) {
            escape();
        }
        long time2 = System.currentTimeMillis() - start;

        System.out.println("对象未逃逸: " + time1 + "ms");
        System.out.println("对象逃逸: " + time2 + "ms");
        System.out.println("性能差异: " + (time2 / (double) time1) + "倍");

        // 运行命令：
        // java -XX:+DoEscapeAnalysis Exercise2  // 开启逃逸分析
        // java -XX:-DoEscapeAnalysis Exercise2  // 关闭逃逸分析

        // 开启逃逸分析时：
        // 对象未逃逸: 5ms（栈上分配，无 GC）
        // 对象逃逸: 50ms（堆上分配，触发 GC）
        // 性能差异: 10倍
    }

    // 对象未逃逸
    public static void noEscape() {
        Object obj = new Object();
        // obj 只在方法内使用
    }

    // 对象逃逸
    public static void escape() {
        Object obj = new Object();
        globalObj = obj; // 赋值给全局变量，逃逸了
    }
}
```

</details>

### 练习 3（挑战）：优化 synchronized 性能

编写代码验证锁优化效果：
1. 测试锁粗化前后的性能差异
2. 测试锁消除前后的性能差异
3. 使用 `-XX:+PrintEliminateLocks` 查看锁消除日志

<details>
<summary>点击查看答案</summary>

```java
public class Exercise3 {
    private final Object lock = new Object();

    // 测试 1：锁粗化前
    public void beforeCoarsening() {
        synchronized (lock) { // 第一次加锁
            int x = 1;
        }
        synchronized (lock) { // 第二次加锁
            int y = 2;
        }
        synchronized (lock) { // 第三次加锁
            int z = 3;
        }
    }

    // 测试 2：锁粗化后
    public void afterCoarsening() {
        synchronized (lock) { // 只加一次锁
            int x = 1;
            int y = 2;
            int z = 3;
        }
    }

    // 测试 3：锁消除前（使用 StringBuilder）
    public void beforeElimination() {
        StringBuilder sb = new StringBuilder();
        sb.append("Hello"); // synchronized
        sb.append("World"); // synchronized
        sb.append("!");     // synchronized
    }

    // 测试 4：锁消除后（使用 StringBuffer）
    public void afterElimination() {
        StringBuffer sb = new StringBuffer();
        sb.append("Hello"); // JVM 会消除 synchronized
        sb.append("World");
        sb.append("!");
    }

    public static void main(String[] args) {
        Exercise3 demo = new Exercise3();

        // 测试锁粗化
        long start = System.nanoTime();
        for (int i = 0; i < 1_000_000; i++) {
            demo.beforeCoarsening();
        }
        long time1 = System.nanoTime() - start;

        start = System.nanoTime();
        for (int i = 0; i < 1_000_000; i++) {
            demo.afterCoarsening();
        }
        long time2 = System.nanoTime() - start;

        System.out.println("锁粗化前: " + time1 + "ns");
        System.out.println("锁粗化后: " + time2 + "ns");
        System.out.println("性能提升: " + (time1 / (double) time2) + "倍");

        // 测试锁消除
        start = System.nanoTime();
        for (int i = 0; i < 1_000_000; i++) {
            demo.beforeElimination();
        }
        time1 = System.nanoTime() - start;

        start = System.nanoTime();
        for (int i = 0; i < 1_000_000; i++) {
            demo.afterElimination();
        }
        time2 = System.nanoTime() - start;

        System.out.println("锁消除前（StringBuilder）: " + time1 + "ns");
        System.out.println("锁消除后（StringBuffer）: " + time2 + "ns");
        System.out.println("性能提升: " + (time1 / (double) time2) + "倍");

        // 运行命令：
        // java -XX:+PrintEliminateLocks Exercise3
        // 观察锁消除日志
    }
}

// 输出示例：
/*
锁粗化前: 50000000ns
锁粗化后: 30000000ns
性能提升: 1.67倍
锁消除前（StringBuilder）: 80000000ns
锁消除后（StringBuffer）: 40000000ns
性能提升: 2.0倍
*/
```

</details>

---

## 下一章预告

下一章我们会学习 **Java 新特性原理**——从 Lambda 表达式到虚拟线程。你会学到：

- Lambda 表达式的底层实现（invokedynamic 指令）
- Stream API 的工作原理（Spliterator、惰性求值）
- 模块化系统（JPMS）的设计原理
- 密封类、Record 类的编译器实现
- 虚拟线程的原理（Java 21）
- 模式匹配的底层机制

理解了这些新特性的实现原理，你就能更好地使用它们，写出更现代、更高效的 Java 代码。
