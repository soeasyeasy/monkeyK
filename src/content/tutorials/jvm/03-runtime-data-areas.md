---
title: '第三章：运行时数据区'
description: '堆、栈、方法区、程序计数器、本地方法栈'
---

# 第三章：运行时数据区

## 本章导读

在学这一章之前，你可能会有这些疑问：

- JVM 在运行程序时如何管理内存？
- 什么是堆？什么是栈？它们有什么区别？
- 方法区存储什么？和堆有什么区别？
- 程序计数器和本地方法栈的作用是什么？

这一章就是为了解答这些问题。我们会先搞清楚 **JVM 运行时数据区的整体结构**，再深入理解每个内存区域的作用和特点。学完这章，你就能理解 Java 程序在内存中是如何存储和管理的。

---

## 3.1 为什么需要运行时数据区？

### 痛点分析

想象一下这个场景：

你写了一个 Java 程序，里面有很多变量、对象、方法。如果没有统一的内存管理机制，这些数据的存储和访问会变得非常混乱，容易出现内存泄漏、数据冲突等问题。

这就是**运行时数据区的必要性**——JVM 需要一套规范的内存管理方案。

### 运行时数据区的解决方案

JVM 将内存划分为多个区域，每个区域有不同的职责：

```
┌─────────────────────────────────────┐
│        JVM 运行时数据区              │
├─────────────────────────────────────┤
│  线程私有区域                        │
│  ├─ 程序计数器（PC Register）        │
│  ├─ 虚拟机栈（VM Stack）             │
│  └─ 本地方法栈（Native Method Stack）│
├─────────────────────────────────────┤
│  线程共享区域                        │
│  ├─ 堆（Heap）                       │
│  └─ 方法区（Method Area）            │
└─────────────────────────────────────┘
```

打个比方：

> 就像公司的办公区域，有个人工位（线程私有）和公共会议室（线程共享），每个人在自己的工位上工作，会议室大家共用。

---

## 3.2 程序计数器

### 什么是程序计数器

程序计数器（Program Counter Register）是一块较小的内存空间，用于记录**当前线程正在执行的字节码指令的地址**。

### 程序计数器的作用

| 作用 | 说明 |
| --- | --- |
| 记录执行位置 | 记录当前执行到哪条字节码指令 |
| 线程切换恢复 | 线程切换后能恢复到正确的执行位置 |
| 分支跳转 | 支持循环、条件分支等控制流 |

### 程序计数器的特点

```java
// 示例：程序计数器的工作方式
public class CounterDemo {
    public static void main(String[] args) {
        // 字节码指令地址
        // 0: aload_0          // 加载 this
        // 1: invokespecial #1 // 调用父类构造方法
        // 4: return           // 返回
        
        // 程序计数器会依次指向 0、1、4
        // 每执行一条指令，计数器就增加
    }
}
```

**特点**：

- 线程私有：每个线程都有自己的程序计数器
- 不会溢出：如果执行的是 Java 方法，记录字节码地址；如果是本地方法，值为 undefined
- 唯一不会发生 OutOfMemoryError 的区域

---

## 3.3 虚拟机栈

### 什么是虚拟机栈

虚拟机栈（VM Stack）是线程私有的内存区域，用于存储**方法执行的局部变量、操作数栈、动态链接、方法出口**等信息。

### 栈帧结构

每个方法执行时，都会在虚拟机栈中创建一个**栈帧**（Stack Frame）：

```
┌─────────────────────────────┐
│  局部变量表（Local Variables）│
│  ├─ 方法参数                 │
│  └─ 局部变量                 │
├─────────────────────────────┤
│  操作数栈（Operand Stack）   │
│  └─ 用于字节码指令操作       │
├─────────────────────────────┤
│  动态链接（Dynamic Linking） │
│  └─ 指向运行时常量池的引用   │
├─────────────────────────────┤
│  方法出口（Return Address）  │
│  └─ 方法返回后恢复执行位置   │
└─────────────────────────────┘
```

### 虚拟机栈的工作过程

```java
// 示例：方法调用与栈帧
public class StackDemo {
    public static void main(String[] args) {
        // 创建 main 方法的栈帧
        int a = 10; // 局部变量 a
        int b = 20; // 局部变量 b
        int c = add(a, b); // 调用 add 方法
        System.out.println(c);
    }
    
    public static int add(int x, int y) {
        // 创建 add 方法的栈帧
        int sum = x + y; // 局部变量 sum
        return sum; // 返回结果，栈帧出栈
    }
}
```

**执行过程**：

1. 执行 `main` 方法，创建 `main` 的栈帧
2. 调用 `add` 方法，创建 `add` 的栈帧（入栈）
3. `add` 方法执行完毕，栈帧出栈
4. 回到 `main` 方法继续执行

### 虚拟机栈的异常

| 异常 | 原因 |
| --- | --- |
| StackOverflowError | 栈深度超过限制（如递归过深） |
| OutOfMemoryError | 动态扩展时无法申请到足够内存 |

```java
// 示例：StackOverflowError
public class StackOverflowDemo {
    public static void main(String[] args) {
        // 无限递归，导致栈溢出
        recursive();
    }
    
    public static void recursive() {
        recursive(); // 每次调用都会创建新的栈帧
    }
}
```

---

## 3.4 本地方法栈

### 什么是本地方法栈

本地方法栈（Native Method Stack）与虚拟机栈类似，但它用于**本地方法（Native Method）**的执行。

### 本地方法的特点

| 特点 | 说明 |
| --- | --- |
| 非 Java 语言 | 使用 C/C++ 等语言编写 |
| 与操作系统交互 | 用于调用底层系统功能 |
| JNI 调用 | 通过 Java Native Interface 调用 |

### 本地方法的使用场景

```java
// 示例：使用本地方法
public class NativeDemo {
    
    // 声明本地方法
    public native void nativeMethod();
    
    // 加载本地库
    static {
        System.loadLibrary("nativeLib");
    }
    
    public static void main(String[] args) {
        NativeDemo demo = new NativeDemo();
        demo.nativeMethod(); // 调用本地方法
    }
}
```

**常见场景**：

- 硬件操作
- 系统级功能调用
- 性能敏感的代码
- 与遗留代码集成

---

## 3.5 堆

### 什么是堆

堆（Heap）是 JVM 中**最大**的内存区域，用于存储**对象实例**。几乎所有对象都在堆上分配。

### 堆的特点

| 特点 | 说明 |
| --- | --- |
| 线程共享 | 所有线程共享同一个堆 |
| 垃圾回收 | 堆是垃圾回收的主要区域 |
| 动态分配 | 对象在运行时动态创建 |

### 堆的内存结构

```
┌─────────────────────────────────────┐
│              堆（Heap）              │
├─────────────────────────────────────┤
│  新生代（Young Generation）          │
│  ├─ Eden 区                         │
│  ├─ Survivor 0 区                   │
│  └─ Survivor 1 区                   │
├─────────────────────────────────────┤
│  老年代（Old Generation）            │
│  └─ 长期存活的对象                   │
└─────────────────────────────────────┘
```

### 对象在堆中的分配

```java
// 示例：对象在堆中的分配
public class HeapDemo {
    public static void main(String[] args) {
        // 对象在堆中创建
        Person p1 = new Person("张三", 25); // 对象在堆中
        Person p2 = new Person("李四", 30); // 对象在堆中
        
        // 引用在栈中，对象在堆中
        // p1 → 堆中的 Person 对象
        // p2 → 堆中的 Person 对象
    }
}

class Person {
    String name; // 对象引用，在堆中
    int age;     // 基本类型，在对象内部
    
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
}
```

### 堆的异常

| 异常 | 原因 |
| --- | --- |
| OutOfMemoryError | 堆内存不足，无法创建新对象 |

```java
// 示例：OutOfMemoryError
public class OOMDemo {
    public static void main(String[] args) {
        // 不断创建对象，最终导致堆溢出
        List<byte[]> list = new ArrayList<>();
        while (true) {
            list.add(new byte[1024 * 1024]); // 每次分配 1MB
        }
    }
}
```

---

## 3.6 方法区

### 什么是方法区

方法区（Method Area）用于存储**已被加载的类信息、常量、静态变量、即时编译器编译后的代码**等数据。

### 方法区的特点

| 特点 | 说明 |
| --- | --- |
| 线程共享 | 所有线程共享同一个方法区 |
| 永久代/元空间 | JDK 8 之前叫永久代，JDK 8 之后叫元空间 |
| 存储类信息 | 类的结构、方法、字段等 |

### 方法区的演变

| JDK 版本 | 方法区实现 | 说明 |
| --- | --- | --- |
| JDK 7 及之前 | 永久代（PermGen） | 使用 JVM 自己的内存 |
| JDK 8 及之后 | 元空间（Metaspace） | 使用本地内存（Native Memory） |

### 方法区存储的内容

```java
// 示例：方法区存储的内容
public class MethodAreaDemo {
    // 静态变量存储在方法区
    public static int count = 100;
    
    // 常量存储在方法区
    public static final String NAME = "Test";
    
    // 方法代码存储在方法区
    public static void test() {
        System.out.println("方法区存储方法代码");
    }
}
```

**存储内容**：

- 类的全限定名
- 父类信息
- 接口信息
- 字段名和类型
- 方法名和签名
- 字节码指令
- 常量池

---

## 3.7 运行时常量池

### 什么是运行时常量池

运行时常量池（Runtime Constant Pool）是方法区的一部分，用于存储**编译期生成的各种字面量和符号引用**。

### 常量池的作用

| 作用 | 说明 |
| --- | --- |
| 字符串常量池 | 缓存字符串常量，避免重复创建 |
| 符号引用 | 存储类、方法、字段的符号引用 |
| 动态链接 | 支持运行时的方法调用 |

### 字符串常量池

```java
// 示例：字符串常量池
public class StringPoolDemo {
    public static void main(String[] args) {
        // 字符串字面量在常量池中
        String s1 = "hello"; // 常量池中的 "hello"
        String s2 = "hello"; // 复用常量池中的 "hello"
        
        // s1 和 s2 指向同一个对象
        System.out.println(s1 == s2); // true
        
        // new 创建的字符串在堆中
        String s3 = new String("hello"); // 堆中的新对象
        String s4 = new String("hello"); // 堆中的新对象
        
        // s3 和 s4 指向不同的对象
        System.out.println(s3 == s4); // false
        System.out.println(s3.equals(s4)); // true
    }
}
```

---

## 3.8 直接内存

### 什么是直接内存

直接内存（Direct Memory）不是 JVM 运行时数据区的一部分，但也被频繁使用。它通过 `ByteBuffer.allocateDirect()` 分配，直接使用操作系统内存。

### 直接内存的特点

| 特点 | 说明 |
| --- | --- |
| 不受 JVM 管理 | 不受垃圾回收器控制 |
| 性能更高 | 避免 Java 堆和 Native 堆之间的数据复制 |
| 需要手动释放 | 需要显式释放内存 |

### 直接内存的使用

```java
// 示例：直接内存的使用
import java.nio.ByteBuffer;

public class DirectMemoryDemo {
    public static void main(String[] args) {
        // 分配直接内存
        ByteBuffer directBuffer = ByteBuffer.allocateDirect(1024);
        
        // 写入数据
        directBuffer.put("hello".getBytes());
        
        // 读取数据
        directBuffer.flip();
        byte[] bytes = new byte[directBuffer.remaining()];
        directBuffer.get(bytes);
        System.out.println(new String(bytes));
        
        // 直接内存不受 GC 控制
        // 但可以通过 System.gc() 触发清理
    }
}
```

---

## 3.9 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 程序计数器 | 记录当前线程执行的字节码地址，线程私有 |
| 虚拟机栈 | 存储方法执行的栈帧，线程私有 |
| 本地方法栈 | 存储本地方法执行的栈帧，线程私有 |
| 堆 | 存储对象实例，线程共享，GC 主要区域 |
| 方法区 | 存储类信息、常量、静态变量，线程共享 |
| 运行时常量池 | 方法区的一部分，存储字面量和符号引用 |
| 直接内存 | 使用操作系统内存，不受 JVM 管理 |

---

## 3.10 新手常见误区

### 误区 1："栈是线程共享的"

**错！** 虚拟机栈是**线程私有**的，每个线程都有自己的栈。堆才是线程共享的。

正确做法：理解线程私有和线程共享的区别。

### 误区 2："方法区就是堆的一部分"

不是的。方法区是独立的内存区域，JDK 8 之后使用本地内存（元空间），不再使用 JVM 堆内存。

### 误区 3："所有对象都在堆中分配"

实际上，基本类型的数组也在堆中分配，但基本类型的局部变量在栈中分配。此外，JIT 编译器可能会进行逃逸分析，将某些对象优化到栈上分配。

### 误区 4："方法区不会发生 OutOfMemoryError"

方法区也可能发生 OutOfMemoryError，当加载的类过多或常量过多时，可能导致方法区溢出。

---

## 3.11 动手练习

### 练习 1：基础题

请回答以下问题：

1. JVM 运行时数据区包括哪些部分？
2. 堆和栈有什么区别？
3. 方法区存储什么内容？

<details>
<summary>点击查看答案</summary>

1. JVM 运行时数据区包括：
   - 程序计数器（线程私有）
   - 虚拟机栈（线程私有）
   - 本地方法栈（线程私有）
   - 堆（线程共享）
   - 方法区（线程共享）

2. 堆和栈的区别：
   - **堆**：存储对象实例，线程共享，是垃圾回收的主要区域
   - **栈**：存储方法执行的局部变量和栈帧，线程私有，用于方法调用

3. 方法区存储的内容：
   - 已被加载的类信息
   - 常量（字面量和符号引用）
   - 静态变量
   - 即时编译器编译后的代码

</details>

### 练习 2：进阶题

请编写代码验证字符串常量池的存在，并解释结果。

<details>
<summary>点击查看答案</summary>

```java
public class StringPoolTest {
    public static void main(String[] args) {
        // 测试字符串常量池
        String s1 = "hello";
        String s2 = "hello";
        String s3 = new String("hello");
        
        // s1 和 s2 指向常量池中的同一个对象
        System.out.println("s1 == s2: " + (s1 == s2)); // true
        System.out.println("s1 == s3: " + (s1 == s3)); // false
        
        // s3 在堆中创建了新对象
        // s1 在常量池中
        
        // 使用 intern() 方法将字符串放入常量池
        String s4 = s3.intern();
        System.out.println("s1 == s4: " + (s1 == s4)); // true
        
        // intern() 会检查常量池中是否有该字符串
        // 如果有，返回常量池中的引用
        // 如果没有，将字符串放入常量池并返回引用
    }
}
```

**结果解释**：

- `s1 == s2` 为 true，因为它们都指向常量池中的同一个 "hello" 对象
- `s1 == s3` 为 false，因为 s3 是在堆中创建的新对象
- `s1 == s4` 为 true，因为 `intern()` 返回了常量池中的引用

</details>

### 练习 3（挑战）：综合题

请解释为什么会出现 StackOverflowError？如何避免？

<details>
<summary>点击查看答案</summary>

**StackOverflowError 的原因**：

StackOverflowError 是因为虚拟机栈的深度超过了限制。每次方法调用都会创建一个栈帧，如果栈帧数量过多（如递归过深），就会导致栈溢出。

**示例代码**：

```java
public class StackOverflowTest {
    public static void main(String[] args) {
        // 无限递归，导致栈溢出
        recursive();
    }
    
    public static void recursive() {
        recursive(); // 每次调用都创建新的栈帧
    }
}
```

**避免方法**：

1. **设置递归终止条件**：确保递归有明确的结束条件
2. **使用迭代替代递归**：将递归算法改为迭代算法
3. **增加栈大小**：通过 JVM 参数 `-Xss` 增加栈大小（不推荐）
4. **尾递归优化**：某些语言支持尾递归优化（Java 不支持）

**正确示例**：

```java
public class CorrectRecursive {
    public static void main(String[] args) {
        // 正确的递归，有终止条件
        System.out.println(factorial(5)); // 120
    }
    
    public static int factorial(int n) {
        if (n <= 1) { // 终止条件
            return 1;
        }
        return n * factorial(n - 1);
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **Java 内存模型（JMM）**——也就是 JVM 如何保证多线程环境下的内存可见性和原子性。你会学到 happens-before 原则、volatile 关键字、以及内存可见性问题。
