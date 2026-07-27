---
title: '第十一章：性能监控工具'
description: 'jps、jstat、jmap、jstack、jcmd、VisualVM'
---

# 第十一章：性能监控工具

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何查看当前运行的 Java 进程？
- 如何监控 GC 活动和内存使用情况？
- 如何生成堆转储和线程转储？
- 有哪些可视化的监控工具？

这一章就是为了解答这些问题。我们会先搞清楚 **JDK 自带的命令行监控工具**，再深入理解可视化工具的使用。学完这章，你就能监控和分析 JVM 的运行状态。

---

## 1 为什么需要性能监控工具？

### 痛点分析

想象一下这个场景：

你的 Java 应用运行缓慢，经常出现 Full GC，甚至 OOM。你不知道问题出在哪里，需要一套工具来诊断问题。

这就是**性能监控工具的必要性**——帮助你了解 JVM 的运行状态，定位性能瓶颈。

### 性能监控工具的解决方案

JDK 提供了多种监控工具：

1. **jps**：查看 Java 进程
2. **jstat**：监控 GC 和内存
3. **jmap**：生成堆转储
4. **jstack**：生成线程转储
5. **jcmd**：综合诊断工具
6. **VisualVM**：可视化监控

打个比方：

> 就像汽车的仪表盘，显示发动机状态（CPU）、油量（内存）、转速（GC）等信息，帮助司机了解车辆状况。

---

## 2 jps：查看 Java 进程

### 什么是 jps

jps（Java Process Status Tool）用于**查看当前运行的 Java 进程**。

### jps 的基本用法

```bash
# 查看所有 Java 进程
jps

# 输出示例：
# 12345 Main
# 12346 Jps
```

### jps 的常用参数

```bash
# 显示主类名
jps -l

# 显示传递给 main 方法的参数
jps -m

# 显示传递给 JVM 的参数
jps -v

# 显示完整信息
jps -lvm
```

### jps 的使用场景

| 场景 | 说明 |
| --- | --- |
| 查找进程 ID | 获取 Java 进程的 PID |
| 确认进程启动 | 检查应用是否正常启动 |
| 查看启动参数 | 确认 JVM 参数配置 |

---

## 3 jstat：监控 GC 和内存

### 什么是 jstat

jstat（Java Virtual Machine Statistics Monitoring Tool）用于**监控 JVM 的 GC 活动和内存使用情况**。

### jstat 的基本用法

```bash
# 监控 GC 情况
jstat -gc <pid>

# 每 1 秒输出一次，共 10 次
jstat -gc <pid> 1000 10
```

### jstat 的输出字段

```bash
# 输出示例：
 S0C    S1C    S0U    S1U      EC       EU        OC         OU       MC     MU    CCSC   CCSU   YGC     YGCT    FGC    FGCT    CGC    CGCT     GCT
10240  10240  5120   0       51200    25600     102400     51200    20480  10240  2048   1024   100     1.234   5      0.567   -      -       1.801
```

**字段说明**：

| 字段 | 说明 |
| --- | --- |
| S0C | Survivor 0 区容量（KB） |
| S1C | Survivor 1 区容量（KB） |
| S0U | Survivor 0 区使用量（KB） |
| S1U | Survivor 1 区使用量（KB） |
| EC | Eden 区容量（KB） |
| EU | Eden 区使用量（KB） |
| OC | 老年代容量（KB） |
| OU | 老年代使用量（KB） |
| MC | 方法区容量（KB） |
| MU | 方法区使用量（KB） |
| YGC | 新生代 GC 次数 |
| YGCT | 新生代 GC 时间（秒） |
| FGC | 老年代 GC 次数 |
| FGCT | 老年代 GC 时间（秒） |
| GCT | 总 GC 时间（秒） |

### jstat 的常用参数

```bash
# 查看 GC 统计
jstat -gc <pid>

# 查看 GC util 统计（百分比）
jstat -gcutil <pid>

# 查看类加载统计
jstat -class <pid>

# 查看编译器统计
jstat -compiler <pid>
```

### jstat 的使用场景

| 场景 | 说明 |
| --- | --- |
| 监控 GC 频率 | 判断是否需要调优 |
| 分析内存使用 | 定位内存泄漏 |
| 评估 GC 性能 | 优化 GC 参数 |

---

## 4 jmap：生成堆转储

### 什么是 jmap

jmap（Java Memory Map）用于**生成堆转储快照**，分析堆内存中的对象。

### jmap 的基本用法

```bash
# 生成堆转储
jmap -dump:format=b,file=heap.hprof <pid>

# 查看堆内存使用情况
jmap -heap <pid>

# 查看对象统计
jmap -histo <pid>
```

### jmap 的输出示例

```bash
# jmap -histo 输出示例：
 num     #instances         #bytes  class name
----------------------------------------------
   1:         10000         320000  [B
   2:          5000         160000  java.lang.String
   3:          3000          96000  java.util.HashMap$Node
```

**字段说明**：

| 字段 | 说明 |
| --- | --- |
| #instances | 对象实例数量 |
| #bytes | 对象占用字节数 |
| class name | 类名 |

### jmap 的使用场景

| 场景 | 说明 |
| --- | --- |
| 分析内存泄漏 | 查看堆中对象分布 |
| 定位大对象 | 找出占用内存最多的对象 |
| 诊断 OOM | 分析 OOM 时的堆状态 |

### jmap 注意事项

```bash
# 生成堆转储会暂停应用（STW）
# 建议在低峰期执行

# 对于大堆，转储文件可能很大
# 确保有足够的磁盘空间

# 可以使用 -F 参数强制生成（当 jmap 无响应时）
jmap -F -dump:format=b,file=heap.hprof <pid>
```

---

## 5 jstack：生成线程转储

### 什么是 jstack

jstack（Java Stack Trace）用于**生成线程转储快照**，分析线程状态和死锁。

### jstack 的基本用法

```bash
# 生成线程转储
jstack <pid>

# 输出到文件
jstack <pid> > thread_dump.txt

# 强制生成（当线程无响应时）
jstack -F <pid>
```

### jstack 的输出示例

```bash
# 输出示例：
"main" #1 prio=5 os_prio=0 tid=0x00007f8b4c009800 nid=0x1234 waiting on condition [0x00007f8b53b7e000]
   java.lang.Thread.State: TIMED_WAITING (parking)
        at sun.misc.Unsafe.park(Native Method)
        - parking to wait for  <0x00000000c0008000> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)
        at java.util.concurrent.locks.LockSupport.parkNanos(LockSupport.java:215)
```

**线程状态**：

| 状态 | 说明 |
| --- | --- |
| NEW | 新创建的线程 |
| RUNNABLE | 运行中或等待 CPU |
| BLOCKED | 等待获取锁 |
| WAITING | 无限期等待 |
| TIMED_WAITING | 限期等待 |
| TERMINATED | 已终止 |

### jstack 的使用场景

| 场景 | 说明 |
| --- | --- |
| 分析死锁 | 查看线程等待关系 |
| 定位阻塞 | 找出阻塞的线程 |
| 分析 CPU 飙高 | 查看线程执行状态 |

### 死锁检测

```bash
# jstack 会自动检测死锁
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

---

## 6 jcmd：综合诊断工具

### 什么是 jcmd

jcmd（Java Command）是 JDK 8+ 提供的**综合诊断工具**，可以替代 jps、jmap、jstack。

### jcmd 的基本用法

```bash
# 列出所有 Java 进程
jcmd

# 查看 JVM 参数
jcmd <pid> VM.flags

# 查看系统属性
jcmd <pid> VM.system_properties

# 生成堆转储
jcmd <pid> GC.heap_dump file=heap.hprof

# 生成线程转储
jcmd <pid> Thread.print

# 查看 GC 统计
jcmd <pid> GC.heap_info
```

### jcmd 的常用命令

```bash
# 查看可用的命令
jcmd <pid> help

# 常用命令：
VM.flags              # 查看 JVM 参数
VM.system_properties  # 查看系统属性
VM.uptime             # 查看 JVM 运行时间
GC.heap_dump          # 生成堆转储
GC.heap_info          # 查看堆信息
GC.class_histogram    # 查看类统计
Thread.print          # 生成线程转储
Compiler.codecache    # 查看代码缓存
```

### jcmd 的使用场景

| 场景 | 说明 |
| --- | --- |
| 综合诊断 | 替代多个工具 |
| 动态调整参数 | 运行时修改 JVM 参数 |
| 生成转储 | 堆转储、线程转储 |

---

## 7 VisualVM：可视化监控

### 什么是 VisualVM

VisualVM 是**可视化的 JVM 监控工具**，集成了多个命令行工具的功能。

### VisualVM 的功能

| 功能 | 说明 |
| --- | --- |
| 监控 JVM 状态 | CPU、内存、线程、类加载 |
| 生成转储 | 堆转储、线程转储 |
| 分析性能 | CPU 采样、内存分析 |
| 插件扩展 | 支持插件扩展功能 |

### VisualVM 的使用

```bash
# 启动 VisualVM
# 在 JDK 的 bin 目录下
jvisualvm

# 或者在命令行执行
visualvm
```

### VisualVM 的主要界面

1. **概述**：显示 JVM 基本信息
2. **监控**：实时显示 CPU、内存、线程、类加载
3. **线程**：显示线程状态和转储
4. **采样器**：CPU 和内存采样分析
5. **类**：显示加载的类信息

### VisualVM 的使用场景

| 场景 | 说明 |
| --- | --- |
| 实时监控 | 图形化查看 JVM 状态 |
| 性能分析 | CPU 和内存采样 |
| 问题诊断 | 生成和分析转储 |

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| jps | 查看 Java 进程 |
| jstat | 监控 GC 和内存 |
| jmap | 生成堆转储 |
| jstack | 生成线程转储 |
| jcmd | 综合诊断工具 |
| VisualVM | 可视化监控 |

---

## 9 新手常见误区

### 误区 1："jmap 可以随意执行"

**错！** jmap 生成堆转储时会暂停应用（STW），对于大堆应用，暂停时间可能很长。应该在低峰期执行。

正确做法：在低峰期执行，或使用 jcmd 替代。

### 误区 2："jstack 只能分析死锁"

不是的。jstack 可以分析所有线程问题，包括阻塞、等待、CPU 飙高等。

### 误区 3："VisualVM 可以监控远程 JVM"

实际上，VisualVM 默认只能监控本地 JVM。要监控远程 JVM，需要配置 JMX 连接。

### 误区 4："这些工具会影响应用性能"

实际上，这些工具的开销很小，但生成转储时会有 STW 暂停。应该合理使用。

---

## 10 动手练习

### 练习 1：基础题

请回答以下问题：

1. 如何查看当前运行的 Java 进程？
2. 如何监控 GC 活动？
3. 如何生成堆转储和线程转储？

<details>
<summary>点击查看答案</summary>

1. 查看 Java 进程：
   ```bash
   jps              # 查看所有 Java 进程
   jps -l           # 显示主类名
   jps -v           # 显示 JVM 参数
   ```

2. 监控 GC 活动：
   ```bash
   jstat -gc <pid>           # 查看 GC 统计
   jstat -gcutil <pid>       # 查看 GC 百分比
   jstat -gc <pid> 1000 10   # 每秒输出一次，共 10 次
   ```

3. 生成转储：
   ```bash
   # 堆转储
   jmap -dump:format=b,file=heap.hprof <pid>
   jcmd <pid> GC.heap_dump file=heap.hprof
   
   # 线程转储
   jstack <pid> > thread_dump.txt
   jcmd <pid> Thread.print
   ```

</details>

### 练习 2：进阶题

请解释如何使用 jstat 分析 GC 性能。

<details>
<summary>点击查看答案</summary>

**使用 jstat 分析 GC 性能**：

1. **监控 GC 频率**：
   ```bash
   jstat -gc <pid> 1000
   ```
   观察 YGC 和 FGC 的增长速度，判断 GC 频率是否过高。

2. **分析 GC 时间**：
   ```bash
   jstat -gcutil <pid> 1000
   ```
   观察 YGCT 和 FGCT 的增长速度，判断 GC 时间是否过长。

3. **评估内存使用**：
   观察 EU（Eden 使用量）、OU（老年代使用量）的变化趋势，判断是否存在内存泄漏。

4. **判断是否需要调优**：
   - YGC 频率过高（如每秒多次）：可能需要增大新生代
   - FGC 频率过高：可能需要增大老年代或优化对象生命周期
   - GC 时间过长：可能需要更换垃圾收集器

**示例分析**：

```bash
# 输出示例：
 S0C    S1C    S0U    S1U      EC       EU        OC         OU       YGC     YGCT    FGC    FGCT    GCT
10240  10240  5120   0       51200    25600     102400     51200    100     1.234   5      0.567   1.801

# 分析：
# - 新生代 GC 100 次，时间 1.234 秒
# - 老年代 GC 5 次，时间 0.567 秒
# - 总 GC 时间 1.801 秒
# - 如果应用运行了 1 小时，GC 时间占比约 0.05%，性能良好
```

</details>

### 练习 3（挑战）：综合题

请解释如何使用 jstack 分析 CPU 飙高问题。

<details>
<summary>点击查看答案</summary>

**使用 jstack 分析 CPU 飙高**：

1. **找到高 CPU 的线程**：
   ```bash
   # 查看进程的线程 CPU 使用情况
   top -Hp <pid>
   
   # 记录高 CPU 的线程 ID（如 12345）
   ```

2. **转换线程 ID 为十六进制**：
   ```bash
   # Linux
   printf "%x\n" 12345
   # 输出：3039
   
   # Windows
   # 使用计算器转换为十六进制
   ```

3. **生成线程转储**：
   ```bash
   jstack <pid> > thread_dump.txt
   ```

4. **查找对应线程**：
   ```bash
   # 在 thread_dump.txt 中搜索 nid=0x3039
   # 查看该线程的堆栈信息
   ```

5. **分析堆栈**：
   - 如果线程状态是 RUNNABLE，查看正在执行的方法
   - 如果是业务代码，检查是否有死循环或复杂计算
   - 如果是 GC 线程，检查 GC 频率和内存使用情况

**示例分析**：

```bash
# 线程转储示例：
"Thread-1" #2 daemon prio=5 os_prio=0 tid=0x00007f8b4c009800 nid=0x3039 runnable [0x00007f8b53b7e000]
   java.lang.Thread.State: RUNNABLE
        at com.example.MyClass.processData(MyClass.java:100)
        at com.example.MyClass.run(MyClass.java:50)

# 分析：
# - 线程 ID 为 0x3039（十进制 12345）
# - 状态为 RUNNABLE
# - 正在执行 MyClass.processData 方法
# - 检查该方法是否有死循环或复杂计算
```

**解决方案**：

- 如果是死循环，修复循环条件
- 如果是复杂计算，优化算法
- 如果是 GC 问题，优化内存使用

</details>

---

## 下一章预告

下一章我们会学习 **故障诊断与排查**——也就是如何分析 OOM、CPU 飙高、死锁等常见问题。你会学到故障诊断的方法论和实战技巧。
