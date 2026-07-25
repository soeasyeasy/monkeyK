---
title: '第十二章：故障诊断与排查'
description: 'OOM 分析、CPU 飙高、死锁检测、内存泄漏'
---

# 第十二章：故障诊断与排查

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 OOM（OutOfMemoryError）？如何分析和解决？
- CPU 飙高是什么原因？如何定位问题？
- 什么是死锁？如何检测和避免？
- 内存泄漏是什么？如何排查和修复？

这一章就是为了解答这些问题。我们会先搞清楚 **常见 JVM 故障的类型和原因**，再深入理解诊断方法和解决技巧。学完这章，你就能独立排查和解决生产环境中的 JVM 问题。

---

## 12.1 为什么需要故障诊断能力？

### 痛点分析

想象一下这个场景：

你的应用突然崩溃了，日志显示 `java.lang.OutOfMemoryError`。你不知道是内存不够、内存泄漏、还是其他原因。你也不知道如何分析堆转储、如何定位问题代码。

这就是**故障诊断的必要性**——生产环境中的问题需要快速定位和解决。

### 故障诊断的解决方案

掌握故障诊断方法，可以：

1. **快速定位问题**：知道从哪里入手分析
2. **分析根本原因**：找到问题的本质
3. **制定解决方案**：针对性地修复问题
4. **预防未来问题**：避免类似问题再次发生

打个比方：

> 就像医生看病，需要通过望闻问切（监控工具）、化验（转储分析）、诊断（根因分析）来找到病因，然后对症下药。

---

## 12.2 OOM 分析

### 什么是 OOM

OOM（OutOfMemoryError）是 JVM 无法分配足够内存时抛出的错误。

### OOM 的类型

| 类型 | 说明 | 原因 |
| --- | --- | --- |
| Java heap space | 堆内存不足 | 对象过多、堆太小 |
| GC overhead limit exceeded | GC 开销超限 | GC 时间过长，回收内存过少 |
| PermGen space（JDK 7-） | 永久代不足 | 类过多、字符串常量过多 |
| Metaspace（JDK 8+） | 元空间不足 | 类过多 |
| unable to create new native thread | 无法创建线程 | 线程数过多、栈太大 |
| Direct buffer memory | 直接内存不足 | NIO 直接内存使用过多 |

### OOM 分析步骤

#### 步骤 1：获取堆转储

```bash
# 方法 1：JVM 参数自动转储
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/path/to/dump.hprof

# 方法 2：手动转储
jmap -dump:format=b,file=heap.hprof <pid>
jcmd <pid> GC.heap_dump file=heap.hprof
```

#### 步骤 2：分析堆转储

使用工具分析堆转储：

- **Eclipse MAT**：Memory Analyzer Tool
- **VisualVM**：可视化分析
- **JProfiler**：商业工具

```bash
# 使用 MAT 分析
# 1. 打开 MAT
# 2. 加载 heap.hprof
# 3. 查看 "Leak Suspects" 报告
# 4. 查看 "Dominator Tree" 找出大对象
```

#### 步骤 3：定位问题代码

```java
// 示例：内存泄漏代码
public class MemoryLeakDemo {
    // 静态集合持有对象引用，导致无法回收
    private static final List<Object> cache = new ArrayList<>();
    
    public void addCache(Object obj) {
        cache.add(obj); // 对象永远不会被释放
    }
    
    public void process() {
        for (int i = 0; i < 1000000; i++) {
            addCache(new byte[1024]); // 不断添加对象
        }
    }
}
```

**分析结果**：

- 在堆转储中发现 `cache` 列表占用大量内存
- 定位到 `MemoryLeakDemo.addCache` 方法
- 修复方案：使用弱引用或定期清理缓存

### OOM 解决方案

| 问题 | 解决方案 |
| --- | --- |
| 堆内存不足 | 增大堆内存（-Xmx） |
| 内存泄漏 | 修复代码，释放对象引用 |
| 大对象过多 | 优化对象生命周期，使用流式处理 |
| 缓存过大 | 使用 LRU 缓存，限制大小 |

---

## 12.3 CPU 飙高分析

### 什么是 CPU 飙高

CPU 飙高是指应用的 CPU 使用率异常升高，导致性能下降。

### CPU 飙高的原因

| 原因 | 说明 |
| --- | --- |
| 死循环 | 代码中存在无限循环 |
| 频繁 GC | GC 频繁执行，占用 CPU |
| 正则表达式 | 复杂正则导致回溯 |
| 线程竞争 | 大量线程竞争锁 |
| 计算密集 | 复杂算法或大数据处理 |

### CPU 飙高分析步骤

#### 步骤 1：找到高 CPU 的进程

```bash
# Linux
top

# Windows
任务管理器
```

#### 步骤 2：找到高 CPU 的线程

```bash
# Linux：查看进程的线程 CPU 使用情况
top -Hp <pid>

# 记录高 CPU 的线程 ID（如 12345）
```

#### 步骤 3：转换线程 ID 为十六进制

```bash
# Linux
printf "%x\n" 12345
# 输出：3039

# Windows
# 使用计算器转换为十六进制
```

#### 步骤 4：生成线程转储

```bash
jstack <pid> > thread_dump.txt
```

#### 步骤 5：查找对应线程

```bash
# 在 thread_dump.txt 中搜索 nid=0x3039
# 查看该线程的堆栈信息
```

#### 步骤 6：分析堆栈

```java
// 示例：死循环代码
public class CPUSpikeDemo {
    public void process() {
        while (true) { // 死循环
            // 处理逻辑
        }
    }
}
```

**分析结果**：

- 线程状态为 RUNNABLE
- 堆栈显示在 `CPUSpikeDemo.process` 方法的 while 循环
- 修复方案：修复循环条件

### CPU 飙高解决方案

| 问题 | 解决方案 |
| --- | --- |
| 死循环 | 修复循环条件 |
| 频繁 GC | 优化内存使用，调整 GC 参数 |
| 正则回溯 | 优化正则表达式 |
| 线程竞争 | 减少锁粒度，使用并发集合 |
| 计算密集 | 优化算法，使用多线程 |

---

## 12.4 死锁检测

### 什么是死锁

死锁是指**两个或多个线程互相等待对方释放锁**，导致所有线程都无法继续执行。

### 死锁的示例

```java
public class DeadlockDemo {
    private static final Object lock1 = new Object();
    private static final Object lock2 = new Object();
    
    public static void main(String[] args) {
        Thread thread1 = new Thread(() -> {
            synchronized (lock1) {
                System.out.println("Thread 1: Holding lock 1...");
                try { Thread.sleep(100); } catch (InterruptedException e) {}
                System.out.println("Thread 1: Waiting for lock 2...");
                synchronized (lock2) {
                    System.out.println("Thread 1: Holding lock 1 & 2...");
                }
            }
        });
        
        Thread thread2 = new Thread(() -> {
            synchronized (lock2) {
                System.out.println("Thread 2: Holding lock 2...");
                try { Thread.sleep(100); } catch (InterruptedException e) {}
                System.out.println("Thread 2: Waiting for lock 1...");
                synchronized (lock1) {
                    System.out.println("Thread 2: Holding lock 2 & 1...");
                }
            }
        });
        
        thread1.start();
        thread2.start();
    }
}
```

### 死锁检测

#### 使用 jstack 检测

```bash
jstack <pid>

# 输出示例：
Found one Java-level deadlock:
=============================
"Thread-1":
  waiting to lock monitor 0x00007f8b4c003528 (object 0x00000000c0008000, a java.lang.Object),
  which is held by "Thread-0"
"Thread-0":
  waiting to lock monitor 0x00007f8b4c0060b8 (object 0x00000000c0008010, a java.lang.Object),
  which is held by "Thread-1"
```

#### 使用 jconsole 检测

```bash
# 启动 jconsole
jconsole

# 连接到目标进程
# 查看 "线程" 标签
# 如果有死锁，会显示 "检测死锁" 按钮
```

### 死锁避免策略

| 策略 | 说明 |
| --- | --- |
| 固定锁顺序 | 所有线程按相同顺序获取锁 |
| 超时放弃 | 使用 tryLock，超时后放弃 |
| 减少锁粒度 | 使用更细粒度的锁 |
| 使用并发工具 | 使用 ConcurrentHashMap 等 |

### 修复死锁示例

```java
public class DeadlockFixedDemo {
    private static final Object lock1 = new Object();
    private static final Object lock2 = new Object();
    
    public static void main(String[] args) {
        Thread thread1 = new Thread(() -> {
            // 修复：按相同顺序获取锁
            synchronized (lock1) {
                System.out.println("Thread 1: Holding lock 1...");
                try { Thread.sleep(100); } catch (InterruptedException e) {}
                System.out.println("Thread 1: Waiting for lock 2...");
                synchronized (lock2) {
                    System.out.println("Thread 1: Holding lock 1 & 2...");
                }
            }
        });
        
        Thread thread2 = new Thread(() -> {
            // 修复：按相同顺序获取锁
            synchronized (lock1) {
                System.out.println("Thread 2: Holding lock 1...");
                try { Thread.sleep(100); } catch (InterruptedException e) {}
                System.out.println("Thread 2: Waiting for lock 2...");
                synchronized (lock2) {
                    System.out.println("Thread 2: Holding lock 1 & 2...");
                }
            }
        });
        
        thread1.start();
        thread2.start();
    }
}
```

---

## 12.5 内存泄漏排查

### 什么是内存泄漏

内存泄漏是指**对象不再被使用，但仍然被引用，导致无法被 GC 回收**。

### 内存泄漏的常见原因

| 原因 | 说明 |
| --- | --- |
| 静态集合 | 静态变量持有对象引用 |
| 未关闭资源 | 流、连接等未关闭 |
| 监听器未移除 | 注册监听器后未移除 |
| ThreadLocal 未清理 | 线程池中使用 ThreadLocal 未清理 |

### 内存泄漏示例

```java
// 示例 1：静态集合导致内存泄漏
public class StaticCollectionLeak {
    private static final List<Object> list = new ArrayList<>();
    
    public void add(Object obj) {
        list.add(obj); // 对象永远不会被释放
    }
}

// 示例 2：未关闭资源导致内存泄漏
public class ResourceLeak {
    public void process() throws IOException {
        InputStream is = new FileInputStream("file.txt");
        // 忘记关闭流
        // is.close();
    }
}

// 示例 3：监听器未移除导致内存泄漏
public class ListenerLeak {
    private static final List<Listener> listeners = new ArrayList<>();
    
    public void register(Listener listener) {
        listeners.add(listener); // 注册后未移除
    }
    
    public void unregister(Listener listener) {
        listeners.remove(listener); // 应该调用此方法
    }
}

// 示例 4：ThreadLocal 未清理导致内存泄漏
public class ThreadLocalLeak {
    private static final ThreadLocal<Object> threadLocal = new ThreadLocal<>();
    
    public void process() {
        threadLocal.set(new Object()); // 设置值
        // 忘记清理
        // threadLocal.remove();
    }
}
```

### 内存泄漏排查步骤

#### 步骤 1：监控内存使用

```bash
# 使用 jstat 监控内存
jstat -gcutil <pid> 1000

# 观察老年代使用量（OU）是否持续增长
```

#### 步骤 2：生成堆转储

```bash
# 在内存使用高时生成堆转储
jmap -dump:format=b,file=heap1.hprof <pid>

# 等待一段时间后再次生成
jmap -dump:format=b,file=heap2.hprof <pid>
```

#### 步骤 3：对比分析

使用 MAT 或 VisualVM 对比两个堆转储，找出增长的对象。

#### 步骤 4：定位问题代码

根据对象类型和引用链，定位到创建对象的代码。

### 内存泄漏解决方案

| 问题 | 解决方案 |
| --- | --- |
| 静态集合 | 使用弱引用（WeakReference） |
| 未关闭资源 | 使用 try-with-resources |
| 监听器未移除 | 及时移除监听器 |
| ThreadLocal 未清理 | 使用 try-finally 清理 |

### 修复内存泄漏示例

```java
// 修复 1：使用弱引用
public class StaticCollectionFixed {
    private static final List<WeakReference<Object>> list = new ArrayList<>();
    
    public void add(Object obj) {
        list.add(new WeakReference<>(obj)); // 使用弱引用
    }
}

// 修复 2：使用 try-with-resources
public class ResourceFixed {
    public void process() throws IOException {
        try (InputStream is = new FileInputStream("file.txt")) {
            // 自动关闭流
        }
    }
}

// 修复 3：及时移除监听器
public class ListenerFixed {
    private static final List<Listener> listeners = new ArrayList<>();
    
    public void register(Listener listener) {
        listeners.add(listener);
    }
    
    public void unregister(Listener listener) {
        listeners.remove(listener); // 及时移除
    }
}

// 修复 4：使用 try-finally 清理 ThreadLocal
public class ThreadLocalFixed {
    private static final ThreadLocal<Object> threadLocal = new ThreadLocal<>();
    
    public void process() {
        try {
            threadLocal.set(new Object());
            // 处理逻辑
        } finally {
            threadLocal.remove(); // 清理 ThreadLocal
        }
    }
}
```

---

## 12.6 故障诊断工具对比

| 工具 | 用途 | 优点 | 缺点 |
| --- | --- | --- | --- |
| jstat | 监控 GC 和内存 | 实时、轻量 | 功能单一 |
| jmap | 生成堆转储 | 分析内存 | STW 暂停 |
| jstack | 生成线程转储 | 分析线程问题 | STW 暂停 |
| jcmd | 综合诊断 | 功能全面 | 需要 JDK 8+ |
| VisualVM | 可视化监控 | 图形界面 | 性能开销 |
| MAT | 分析堆转储 | 功能强大 | 学习成本高 |

---

## 12.7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| OOM 分析 | 获取堆转储，分析内存使用，定位问题代码 |
| CPU 飙高 | 找到高 CPU 线程，分析线程堆栈 |
| 死锁检测 | 使用 jstack 或 jconsole 检测死锁 |
| 内存泄漏 | 监控内存增长，对比堆转储，定位泄漏代码 |

---

## 12.8 新手常见误区

### 误区 1："OOM 就是内存不够"

**错！** OOM 可能是内存泄漏、大对象过多、堆设置过小等多种原因。需要分析堆转储才能确定根本原因。

正确做法：获取堆转储，使用 MAT 等工具分析，找到问题根源。

### 误区 2："CPU 飙高一定是代码问题"

不是的。CPU 飙高可能是频繁 GC、线程竞争、正则回溯等多种原因。需要分析线程堆栈和 GC 日志。

### 误区 3："死锁很容易避免"

实际上，死锁在复杂的多线程环境中很容易出现。需要遵循固定的锁顺序、使用超时机制、减少锁粒度等策略。

### 误区 4："内存泄漏很容易发现"

不对。内存泄漏可能很隐蔽，需要通过监控内存增长、对比堆转储、分析对象引用链来定位。

---

## 12.9 动手练习

### 练习 1：基础题

请回答以下问题：

1. OOM 有哪些类型？如何分析 OOM？
2. CPU 飙高的原因有哪些？如何定位？
3. 什么是死锁？如何检测和避免？

<details>
<summary>点击查看答案</summary>

1. OOM 类型和分析方法：
   - **类型**：Java heap space、GC overhead limit exceeded、Metaspace、unable to create new native thread、Direct buffer memory
   - **分析步骤**：
     1. 获取堆转储（-XX:+HeapDumpOnOutOfMemoryError）
     2. 使用 MAT 或 VisualVM 分析堆转储
     3. 查看 "Leak Suspects" 报告
     4. 定位问题代码

2. CPU 飙高的原因和定位：
   - **原因**：死循环、频繁 GC、正则回溯、线程竞争、计算密集
   - **定位步骤**：
     1. 使用 top 找到高 CPU 进程
     2. 使用 top -Hp 找到高 CPU 线程
     3. 转换线程 ID 为十六进制
     4. 使用 jstack 生成线程转储
     5. 查找对应线程的堆栈

3. 死锁检测和避免：
   - **检测**：使用 jstack 或 jconsole 检测死锁
   - **避免策略**：
     - 固定锁顺序
     - 超时放弃（tryLock）
     - 减少锁粒度
     - 使用并发工具

</details>

### 练习 2：进阶题

请分析以下代码是否存在内存泄漏，并给出修复方案。

```java
public class CacheDemo {
    private static final Map<String, Object> cache = new HashMap<>();
    
    public static void put(String key, Object value) {
        cache.put(key, value);
    }
    
    public static Object get(String key) {
        return cache.get(key);
    }
}
```

<details>
<summary>点击查看答案</summary>

**问题分析**：

这段代码存在内存泄漏。`cache` 是静态变量，持有所有添加的对象的引用。即使对象不再使用，也无法被 GC 回收。

**修复方案 1：使用 WeakHashMap**

```java
public class CacheFixed {
    private static final Map<String, Object> cache = new WeakHashMap<>();
    
    public static void put(String key, Object value) {
        cache.put(key, value);
    }
    
    public static Object get(String key) {
        return cache.get(key);
    }
}
```

**修复方案 2：使用 LRU 缓存**

```java
import java.util.LinkedHashMap;
import java.util.Map;

public class LRUCacheFixed {
    private static final int MAX_SIZE = 100;
    
    private static final Map<String, Object> cache = new LinkedHashMap<String, Object>(MAX_SIZE, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, Object> eldest) {
            return size() > MAX_SIZE;
        }
    };
    
    public static synchronized void put(String key, Object value) {
        cache.put(key, value);
    }
    
    public static synchronized Object get(String key) {
        return cache.get(key);
    }
}
```

**修复方案 3：定期清理**

```java
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class CacheWithCleanup {
    private static final Map<String, Object> cache = new HashMap<>();
    private static final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    
    static {
        // 每小时清理一次缓存
        scheduler.scheduleAtFixedRate(() -> {
            cache.clear();
        }, 1, 1, TimeUnit.HOURS);
    }
    
    public static void put(String key, Object value) {
        cache.put(key, value);
    }
    
    public static Object get(String key) {
        return cache.get(key);
    }
}
```

</details>

### 练习 3（挑战）：综合题

请解释如何使用 jstack 分析 CPU 飙高问题，并给出完整的排查步骤。

<details>
<summary>点击查看答案</summary>

**使用 jstack 分析 CPU 飙高的完整步骤**：

1. **找到高 CPU 的进程**：
   ```bash
   # Linux
   top
   
   # 记录 Java 进程的 PID（如 12345）
   ```

2. **找到高 CPU 的线程**：
   ```bash
   # Linux：查看进程的线程 CPU 使用情况
   top -Hp 12345
   
   # 记录高 CPU 的线程 ID（如 12367）
   ```

3. **转换线程 ID 为十六进制**：
   ```bash
   # Linux
   printf "%x\n" 12367
   # 输出：304f
   
   # Windows：使用计算器转换
   ```

4. **生成线程转储**：
   ```bash
   jstack 12345 > thread_dump.txt
   ```

5. **查找对应线程**：
   ```bash
   # 在 thread_dump.txt 中搜索 nid=0x304f
   # 查看该线程的堆栈信息
   ```

6. **分析堆栈**：
   ```bash
   # 示例输出：
   "Thread-1" #2 daemon prio=5 os_prio=0 tid=0x00007f8b4c009800 nid=0x304f runnable [0x00007f8b53b7e000]
      java.lang.Thread.State: RUNNABLE
           at com.example.MyClass.processData(MyClass.java:100)
           at com.example.MyClass.run(MyClass.java:50)
   ```

7. **定位问题代码**：
   - 查看 `MyClass.java:100` 行的代码
   - 检查是否有死循环、复杂计算等问题

8. **修复问题**：
   - 如果是死循环，修复循环条件
   - 如果是复杂计算，优化算法
   - 如果是 GC 问题，优化内存使用

9. **验证修复**：
   ```bash
   # 重新部署应用
   # 使用 top 监控 CPU 使用率
   # 确认问题已解决
   ```

**注意事项**：

- 生成线程转储时会有短暂的 STW 暂停
- 建议在低峰期执行
- 可以多次生成转储，对比分析

</details>

---

## 下一章预告

下一章我们会学习 **GC 日志分析**——也就是如何解读 GC 日志，分析 GC 性能。你会学到 GC 日志的格式、关键指标、性能分析方法和调优策略。
