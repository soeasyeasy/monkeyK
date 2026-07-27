---
title: '第四章：Java 内存模型'
description: 'JMM 规范、happens-before 原则、volatile、内存可见性'
---

# 第四章：Java 内存模型

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Java 内存模型（JMM）？它和 JVM 运行时数据区有什么区别？
- 为什么多线程环境下会出现内存可见性问题？
- 什么是 happens-before 原则？它有什么作用？
- volatile 关键字是如何保证可见性的？

这一章就是为了解答这些问题。我们会先搞清楚 **JMM 的核心概念**，再深入理解内存可见性和 happens-before 原则，最后掌握 volatile 关键字的使用。

---

## 1 为什么需要 Java 内存模型？

### 痛点分析

想象一下这个场景：

你写了一个多线程程序，线程 A 修改了一个变量的值，但线程 B 却看不到这个修改。程序的行为变得不可预测，难以调试。

这就是**内存可见性问题**——不同线程看到的内存数据可能不一致。

### JMM 的解决方案

Java 内存模型（Java Memory Model，简称 JMM）是 JVM 规范的一部分，它定义了**多线程环境下内存的访问规则**。

打个比方：

> 就像多个员工同时修改同一个文档，如果没有同步机制，每个人看到的内容可能不一样。JMM 就是一套规则，确保大家看到的内容是一致的。

### JMM 与 JVM 运行时数据区的区别

| 特性 | JVM 运行时数据区 | JMM |
| --- | --- | --- |
| 定义 | JVM 如何管理内存 | 多线程如何访问内存 |
| 关注点 | 内存分配和回收 | 内存可见性和顺序性 |
| 层面 | 物理内存 | 逻辑内存 |

---

## 2 JMM 的核心概念

### 主内存与工作内存

JMM 将内存分为两个层次：

```
┌─────────────────────────────┐
│         主内存（Main Memory）│
│  ├─ 所有线程共享的变量       │
│  └─ 存储对象的实例变量       │
├─────────────────────────────┤
│  工作内存（Working Memory）  │
│  ├─ 线程私有的变量副本       │
│  └─ 缓存主内存中的变量       │
└─────────────────────────────┘
```

### 内存交互规则

线程对变量的所有操作都必须在**工作内存**中进行，不能直接操作主内存。

```
线程 A 修改变量 → 工作内存
    ↓
刷新到主内存
    ↓
线程 B 从主内存读取
```

### 内存可见性问题

```java
// 示例：内存可见性问题
public class VisibilityDemo {
    // 普通变量
    private boolean flag = false;
    
    public void writer() {
        // 线程 A 修改 flag
        flag = true;
    }
    
    public void reader() {
        // 线程 B 读取 flag
        while (!flag) {
            // 可能永远看不到 flag 的修改
            // 因为线程 B 的工作内存中 flag 还是 false
        }
        System.out.println("flag 被修改了");
    }
}
```

---

## 3 happens-before 原则

### 什么是 happens-before

happens-before 是 JMM 的核心概念，它定义了**操作之间的可见性关系**。如果操作 A happens-before 操作 B，那么操作 A 的结果对操作 B 可见。

### happens-before 规则

| 规则 | 说明 |
| --- | --- |
| 程序顺序规则 | 同一个线程内，前面的操作 happens-before 后面的操作 |
| 锁规则 | 解锁 happens-before 加锁 |
| volatile 规则 | volatile 写 happens-before volatile 读 |
| 传递规则 | A happens-before B，B happens-before C，则 A happens-before C |
| 线程启动规则 | 线程启动 happens-before 线程内的任何操作 |
| 线程终止规则 | 线程内的任何操作 happens-before 线程终止 |

### happens-before 示例

```java
// 示例：happens-before 规则
public class HappensBeforeDemo {
    private int x = 0;
    private volatile boolean flag = false;
    
    public void writer() {
        x = 42; // 操作 A
        flag = true; // 操作 B（volatile 写）
    }
    
    public void reader() {
        if (flag) { // 操作 C（volatile 读）
            System.out.println(x); // 操作 D
            // 操作 B happens-before 操作 C
            // 操作 A happens-before 操作 B（程序顺序）
            // 所以操作 A happens-before 操作 C（传递规则）
            // 因此操作 C 能看到操作 A 的结果（x = 42）
        }
    }
}
```

---

## 4 volatile 关键字

### volatile 的作用

volatile 关键字有两个主要作用：

1. **保证可见性**：volatile 变量的修改对所有线程立即可见
2. **禁止指令重排序**：volatile 变量的读写不会被重排序

### volatile 保证可见性

```java
// 示例：volatile 保证可见性
public class VolatileDemo {
    // volatile 变量
    private volatile boolean flag = false;
    
    public void writer() {
        flag = true; // 修改 flag
        // 修改会立即刷新到主内存
    }
    
    public void reader() {
        while (!flag) {
            // 每次都会从主内存读取 flag
            // 所以能看到 writer 线程的修改
        }
        System.out.println("flag 被修改了");
    }
}
```

### volatile 禁止重排序

```java
// 示例：volatile 禁止重排序
public class ReorderDemo {
    private int x = 0;
    private volatile boolean flag = false;
    
    public void write() {
        x = 42; // 操作 A
        flag = true; // 操作 B（volatile 写）
        // 操作 A 和 B 不会被重排序
        // 保证 x = 42 先执行，再执行 flag = true
    }
    
    public void read() {
        if (flag) { // 操作 C（volatile 读）
            System.out.println(x); // 操作 D
            // 操作 C 和 D 不会被重排序
            // 保证先判断 flag，再读取 x
        }
    }
}
```

### volatile 的使用场景

| 场景 | 说明 |
| --- | --- |
| 状态标志 | 用于线程间传递状态 |
| 双重检查锁定 | 单例模式中使用 |
| 一次性安全发布 | 发布不可变对象 |

### volatile 的局限性

| 局限性 | 说明 |
| --- | --- |
| 不保证原子性 | volatile 不能保证复合操作的原子性 |
| 不适用于复合操作 | 如 i++ 这样的操作不安全 |

```java
// 示例：volatile 不保证原子性
public class AtomicityDemo {
    private volatile int count = 0;
    
    public void increment() {
        count++; // ❌ 不安全！
        // count++ 是复合操作：读取、加 1、写回
        // volatile 不能保证这个复合操作的原子性
    }
    
    public void safeIncrement() {
        // ✅ 使用 AtomicInteger 保证原子性
        // 或者使用 synchronized
    }
}
```

---

## 5 synchronized 与 JMM

### synchronized 的内存语义

synchronized 不仅保证原子性，还保证**可见性**：

1. **加锁时**：清空工作内存，从主内存读取最新值
2. **解锁时**：将工作内存的修改刷新到主内存

### synchronized 示例

```java
// 示例：synchronized 保证可见性
public class SynchronizedDemo {
    private int count = 0;
    
    public synchronized void increment() {
        count++; // ✅ 安全
        // 加锁：清空工作内存
        // 执行：count++
        // 解锁：刷新到主内存
    }
    
    public synchronized int getCount() {
        return count; // ✅ 安全
        // 加锁：从主内存读取
    }
}
```

### synchronized 与 volatile 的对比

| 特性 | volatile | synchronized |
| --- | --- | --- |
| 可见性 | ✅ 保证 | ✅ 保证 |
| 原子性 | ❌ 不保证 | ✅ 保证 |
| 指令重排序 | ❌ 禁止 | ✅ 禁止 |
| 性能 | 高 | 较低 |
| 适用场景 | 简单状态标志 | 复杂复合操作 |

---

## 6 内存屏障

### 什么是内存屏障

内存屏障（Memory Barrier）是 CPU 指令，用于**控制内存访问顺序**。JMM 通过内存屏障来实现 happens-before 规则。

### 内存屏障的类型

| 屏障类型 | 作用 |
| --- | --- |
| LoadLoad | 保证前面的 Load 先于后面的 Load |
| StoreStore | 保证前面的 Store 先于后面的 Store |
| LoadStore | 保证前面的 Load 先于后面的 Store |
| StoreLoad | 保证前面的 Store 先于后面的 Load |

### volatile 与内存屏障

```java
// volatile 写会插入以下内存屏障
StoreStore
volatile 写
StoreLoad

// volatile 读会插入以下内存屏障
LoadLoad
volatile 读
LoadStore
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| JMM | Java 内存模型，定义多线程内存访问规则 |
| 主内存与工作内存 | 主内存存储共享变量，工作内存存储线程私有副本 |
| happens-before | 定义操作之间的可见性关系 |
| volatile | 保证可见性和禁止重排序，不保证原子性 |
| synchronized | 保证可见性、原子性、禁止重排序 |
| 内存屏障 | CPU 指令，控制内存访问顺序 |

---

## 8 新手常见误区

### 误区 1："volatile 能保证原子性"

**错！** volatile 只能保证可见性和禁止重排序，不能保证原子性。对于复合操作（如 i++），需要使用 synchronized 或 AtomicInteger。

正确做法：理解 volatile 的局限性，复合操作使用原子类或锁。

### 误区 2："synchronized 只保证原子性"

不是的。synchronized 不仅保证原子性，还保证可见性和禁止重排序。

### 误区 3："JMM 就是 JVM 运行时数据区"

不对。JMM 是逻辑层面的内存模型，定义多线程访问规则；JVM 运行时数据区是物理层面的内存结构，定义内存分配和回收。

### 误区 4："volatile 变量读写没有性能开销"

实际上，volatile 变量的读写需要插入内存屏障，会带来一定的性能开销。在高频场景下，需要考虑性能影响。

---

## 9 动手练习

### 练习 1：基础题

请回答以下问题：

1. JMM 的核心概念是什么？
2. happens-before 原则有哪些规则？
3. volatile 关键字的作用是什么？

<details>
<summary>点击查看答案</summary>

1. JMM 的核心概念：
   - 主内存与工作内存的划分
   - 内存可见性规则
   - happens-before 原则

2. happens-before 规则：
   - 程序顺序规则：同一线程内，前面的操作 happens-before 后面的操作
   - 锁规则：解锁 happens-before 加锁
   - volatile 规则：volatile 写 happens-before volatile 读
   - 传递规则：A happens-before B，B happens-before C，则 A happens-before C
   - 线程启动规则：线程启动 happens-before 线程内的任何操作
   - 线程终止规则：线程内的任何操作 happens-before 线程终止

3. volatile 关键字的作用：
   - 保证可见性：volatile 变量的修改对所有线程立即可见
   - 禁止指令重排序：volatile 变量的读写不会被重排序

</details>

### 练习 2：进阶题

请编写一个使用 volatile 的正确示例，并解释为什么这样使用是安全的。

<details>
<summary>点击查看答案</summary>

```java
public class VolatileCorrectDemo {
    // volatile 用于状态标志
    private volatile boolean running = true;
    
    public void start() {
        running = true;
        new Thread(() -> {
            while (running) {
                // 执行任务
                doWork();
            }
        }).start();
    }
    
    public void stop() {
        running = false; // 修改状态
        // 由于 running 是 volatile，修改会立即对所有线程可见
    }
    
    private void doWork() {
        // 模拟工作
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

**为什么安全**：

- `running` 是 volatile 变量，保证可见性
- 只有简单的读写操作，不涉及复合操作
- 适合用于状态标志的场景

</details>

### 练习 3（挑战）：综合题

请解释以下代码的问题，并提供修复方案。

```java
public class BrokenDemo {
    private int count = 0;
    
    public void increment() {
        count++;
    }
    
    public int getCount() {
        return count;
    }
}
```

<details>
<summary>点击查看答案</summary>

**问题分析**：

1. `count` 不是 volatile 变量，多线程环境下可能看不到最新值
2. `count++` 是复合操作，不是原子操作，可能导致数据不一致

**修复方案 1：使用 synchronized**

```java
public class FixedSynchronizedDemo {
    private int count = 0;
    
    public synchronized void increment() {
        count++;
    }
    
    public synchronized int getCount() {
        return count;
    }
}
```

**修复方案 2：使用 AtomicInteger**

```java
import java.util.concurrent.atomic.AtomicInteger;

public class FixedAtomicDemo {
    private AtomicInteger count = new AtomicInteger(0);
    
    public void increment() {
        count.incrementAndGet(); // 原子操作
    }
    
    public int getCount() {
        return count.get();
    }
}
```

**推荐使用方案 2**，因为 AtomicInteger 性能更好，且代码更简洁。

</details>

---

## 下一章预告

下一章我们会学习 **垃圾回收基础**——也就是 JVM 如何自动回收不再使用的内存。你会学到 GC 算法、引用计数、可达性分析、GC Roots 等核心概念。这是理解 JVM 性能优化的重要一步。
