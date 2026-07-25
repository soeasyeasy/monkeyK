---
title: '第十章：JVM 调优基础'
description: 'JVM 参数分类、堆内存设置、GC 参数、日志配置'
---

# 第十章：JVM 调优基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- JVM 有哪些参数？如何分类？
- 如何设置堆内存大小？
- 如何选择合适的垃圾收集器？
- 如何配置 GC 日志？

这一章就是为了解答这些问题。我们会先搞清楚 **JVM 参数的分类**，再深入理解堆内存设置、GC 参数配置和日志分析。学完这章，你就能根据应用特点配置合适的 JVM 参数。

---

## 10.1 为什么需要 JVM 调优？

### 痛点分析

想象一下这个场景：

你的 Java 应用运行缓慢，经常出现 Full GC，甚至 OOM（OutOfMemoryError）。默认 JVM 参数可能不适合你的应用场景，需要手动调优。

这就是**JVM 调优的必要性**——根据应用特点配置合适的参数，提升性能。

### JVM 调优的解决方案

通过配置 JVM 参数，可以：

1. **控制内存分配**：设置堆大小、新生代比例等
2. **选择垃圾收集器**：根据应用特点选择合适的 GC
3. **优化 GC 行为**：调整 GC 频率、停顿时间等
4. **记录运行信息**：配置 GC 日志，分析问题

打个比方：

> 就像汽车的调校，需要根据路况（应用场景）调整悬挂（内存）、发动机（GC）、刹车（停顿时间）等参数，才能发挥最佳性能。

---

## 10.2 JVM 参数分类

### 标准参数

标准参数以 `-` 开头，所有 JVM 实现都支持。

```bash
# 示例：标准参数
-version          # 打印 JVM 版本
-help             # 打印帮助信息
-Xint             # 只使用解释执行
-Xcomp            # 只使用编译执行
-Xmixed           # 混合执行（默认）
```

### -X 参数

`-X` 参数是非标准参数，不同 JVM 实现可能不同。

```bash
# 示例：-X 参数
-Xms              # 设置初始堆大小
-Xmx              # 设置最大堆大小
-Xss              # 设置线程栈大小
-Xmn              # 设置新生代大小
-Xloggc           # 设置 GC 日志路径
```

### -XX 参数

`-XX` 参数是实验性参数，用于高级调优。

```bash
# 示例：-XX 参数
-XX:+UseG1GC                    # 使用 G1 垃圾收集器
-XX:MaxGCPauseMillis=200        # 设置最大 GC 停顿时间
-XX:+PrintGCDetails             # 打印 GC 详细信息
-XX:+HeapDumpOnOutOfMemoryError # OOM 时生成堆转储
```

### 参数类型对比

| 参数类型 | 前缀 | 说明 | 示例 |
| --- | --- | --- | --- |
| 标准参数 | `-` | 所有 JVM 支持 | `-version`, `-help` |
| -X 参数 | `-X` | 非标准参数 | `-Xms`, `-Xmx`, `-Xss` |
| -XX 参数 | `-XX` | 实验性参数 | `-XX:+UseG1GC` |

---

## 10.3 堆内存设置

### 堆大小配置

```bash
# 设置初始堆大小和最大堆大小
-Xms2G -Xmx2G

# 建议：将初始堆和最大堆设置为相同值
# 避免堆动态扩展带来的性能开销
```

### 新生代大小配置

```bash
# 设置新生代大小
-Xmn1G

# 或者设置新生代占堆的比例
-XX:NewRatio=2  # 老年代:新生代 = 2:1

# 设置 Eden 区和 Survivor 区的比例
-XX:SurvivorRatio=8  # Eden:S0:S1 = 8:1:1
```

### 线程栈大小配置

```bash
# 设置线程栈大小（默认 1MB）
-Xss256K

# 注意：栈大小影响最大线程数
# 最大线程数 ≈ 物理内存 / 栈大小
```

### 堆内存配置示例

```bash
# 典型的服务端应用配置
java -Xms4G -Xmx4G -Xmn2G -Xss256K -jar app.jar

# 解释：
# -Xms4G：初始堆 4GB
# -Xmx4G：最大堆 4GB
# -Xmn2G：新生代 2GB
# -Xss256K：线程栈 256KB
```

---

## 10.4 垃圾收集器配置

### Serial 收集器

```bash
# 启用 Serial 收集器
-XX:+UseSerialGC

# 适用场景：小型应用、客户端应用
```

### Parallel 收集器

```bash
# 启用 Parallel 收集器（JDK 8 默认）
-XX:+UseParallelGC

# 设置 GC 线程数
-XX:ParallelGCThreads=4

# 适用场景：批处理应用、后台任务
```

### CMS 收集器

```bash
# 启用 CMS 收集器
-XX:+UseConcMarkSweepGC

# 设置并发 GC 线程数
-XX:ConcGCThreads=4

# 设置老年代触发 CMS 的阈值
-XX:CMSInitiatingOccupancyFraction=75

# 适用场景：Web 服务、低延迟应用
```

### G1 收集器

```bash
# 启用 G1 收集器（JDK 9+ 默认）
-XX:+UseG1GC

# 设置最大停顿时间目标
-XX:MaxGCPauseMillis=200

# 设置 Region 大小
-XX:G1HeapRegionSize=4M

# 设置老年代触发 G1 的阈值
-XX:InitiatingHeapOccupancyPercent=45

# 适用场景：服务端应用、大内存应用
```

### ZGC 收集器

```bash
# 启用 ZGC 收集器（JDK 15+ 生产可用）
-XX:+UseZGC

# 设置堆大小
-Xmx4G

# 适用场景：超低延迟应用、大内存应用
```

### 垃圾收集器选择指南

| 场景 | 推荐收集器 | 配置参数 |
| --- | --- | --- |
| 小型应用 | Serial | `-XX:+UseSerialGC` |
| 批处理应用 | Parallel | `-XX:+UseParallelGC` |
| Web 服务 | G1 | `-XX:+UseG1GC` |
| 低延迟应用 | ZGC | `-XX:+UseZGC` |

---

## 10.5 GC 参数配置

### GC 日志配置

```bash
# 打印 GC 基本信息
-XX:+PrintGC

# 打印 GC 详细信息
-XX:+PrintGCDetails

# 打印 GC 时间戳
-XX:+PrintGCDateStamps

# 设置 GC 日志文件路径
-Xloggc:/path/to/gc.log

# JDK 9+ 统一日志框架
-Xlog:gc*:file=gc.log:time,tags:filecount=5,filesize=10M
```

### OOM 诊断配置

```bash
# OOM 时生成堆转储
-XX:+HeapDumpOnOutOfMemoryError

# 设置堆转储文件路径
-XX:HeapDumpPath=/path/to/dump.hprof

# 设置 GC 开销报告
-XX:GCTimeRatio=19  # GC 时间占比不超过 5%
```

### 性能调优参数

```bash
# 设置自适应调节策略
-XX:+UseAdaptiveSizePolicy

# 设置最大 GC 停顿时间
-XX:MaxGCPauseMillis=200

# 设置 GC 线程数
-XX:ParallelGCThreads=4

# 设置并发 GC 线程数
-XX:ConcGCThreads=4
```

---

## 10.6 完整配置示例

### 小型应用配置

```bash
java -Xms512M -Xmx512M \
     -XX:+UseSerialGC \
     -XX:+PrintGC \
     -jar app.jar
```

### 中型 Web 服务配置

```bash
java -Xms2G -Xmx2G -Xmn1G \
     -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=200 \
     -XX:+PrintGCDetails \
     -XX:+PrintGCDateStamps \
     -Xloggc:/var/log/gc.log \
     -XX:+HeapDumpOnOutOfMemoryError \
     -XX:HeapDumpPath=/var/log/dump.hprof \
     -jar app.jar
```

### 大型低延迟应用配置

```bash
java -Xms8G -Xmx8G \
     -XX:+UseZGC \
     -XX:+PrintGCDetails \
     -XX:+PrintGCDateStamps \
     -Xloggc:/var/log/gc.log \
     -XX:+HeapDumpOnOutOfMemoryError \
     -XX:HeapDumpPath=/var/log/dump.hprof \
     -jar app.jar
```

---

## 10.7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| JVM 参数分类 | 标准参数（-）、-X 参数、-XX 参数 |
| 堆内存设置 | -Xms、-Xmx、-Xmn、-Xss |
| 垃圾收集器配置 | -XX:+UseSerialGC、-XX:+UseG1GC 等 |
| GC 日志配置 | -XX:+PrintGCDetails、-Xloggc |
| OOM 诊断 | -XX:+HeapDumpOnOutOfMemoryError |

---

## 10.8 新手常见误区

### 误区 1："堆内存越大越好"

**错！** 堆内存过大会导致 GC 时间变长，反而影响性能。应该根据应用实际需求设置合适的堆大小。

正确做法：根据应用内存使用情况，设置合理的堆大小。

### 误区 2："G1 收集器适合所有场景"

不是的。不同的垃圾收集器有不同的适用场景。小型应用使用 Serial 可能更合适，批处理应用使用 Parallel 可能更好。

### 误区 3："JVM 参数配置后就不需要调整了"

实际上，JVM 参数需要根据应用运行情况进行调整。应该定期监控 GC 日志，根据实际表现优化参数。

### 误区 4："线程栈大小设置得越小越好"

不对。线程栈过小可能导致 StackOverflowError。应该根据应用的方法调用深度设置合适的栈大小。

---

## 10.9 动手练习

### 练习 1：基础题

请回答以下问题：

1. JVM 参数有哪些分类？
2. 如何设置堆内存大小？
3. 如何选择合适的垃圾收集器？

<details>
<summary>点击查看答案</summary>

1. JVM 参数分类：
   - **标准参数**：以 `-` 开头，所有 JVM 实现都支持，如 `-version`、`-help`
   - **-X 参数**：非标准参数，如 `-Xms`、`-Xmx`、`-Xss`
   - **-XX 参数**：实验性参数，如 `-XX:+UseG1GC`

2. 堆内存设置：
   ```bash
   -Xms4G  # 初始堆大小
   -Xmx4G  # 最大堆大小
   -Xmn2G  # 新生代大小
   -Xss256K  # 线程栈大小
   ```

3. 垃圾收集器选择：
   - **小型应用**：Serial（`-XX:+UseSerialGC`）
   - **批处理应用**：Parallel（`-XX:+UseParallelGC`）
   - **Web 服务**：G1（`-XX:+UseG1GC`）
   - **低延迟应用**：ZGC（`-XX:+UseZGC`）

</details>

### 练习 2：进阶题

请为一个中型 Web 服务应用配置 JVM 参数，并解释每个参数的作用。

<details>
<summary>点击查看答案</summary>

**配置示例**：

```bash
java -Xms2G -Xmx2G -Xmn1G \
     -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=200 \
     -XX:+PrintGCDetails \
     -XX:+PrintGCDateStamps \
     -Xloggc:/var/log/gc.log \
     -XX:+HeapDumpOnOutOfMemoryError \
     -XX:HeapDumpPath=/var/log/dump.hprof \
     -jar app.jar
```

**参数解释**：

- `-Xms2G`：初始堆大小 2GB
- `-Xmx2G`：最大堆大小 2GB（与初始堆相同，避免动态扩展）
- `-Xmn1G`：新生代大小 1GB
- `-XX:+UseG1GC`：使用 G1 垃圾收集器
- `-XX:MaxGCPauseMillis=200`：设置最大 GC 停顿时间 200ms
- `-XX:+PrintGCDetails`：打印 GC 详细信息
- `-XX:+PrintGCDateStamps`：打印 GC 时间戳
- `-Xloggc:/var/log/gc.log`：GC 日志文件路径
- `-XX:+HeapDumpOnOutOfMemoryError`：OOM 时生成堆转储
- `-XX:HeapDumpPath=/var/log/dump.hprof`：堆转储文件路径

</details>

### 练习 3（挑战）：综合题

请解释为什么建议将初始堆和最大堆设置为相同值？

<details>
<summary>点击查看答案</summary>

**原因**：

1. **避免堆动态扩展**：
   - 如果初始堆小于最大堆，JVM 会在需要时动态扩展堆
   - 堆扩展需要向操作系统申请内存，会影响性能

2. **减少 GC 开销**：
   - 堆扩展后，JVM 需要重新调整 GC 参数
   - 可能导致额外的 GC 开销

3. **提高性能可预测性**：
   - 固定堆大小可以让 GC 行为更稳定
   - 便于性能调优和问题排查

**配置示例**：

```bash
# ✅ 推荐：初始堆和最大堆相同
-Xms4G -Xmx4G

# ❌ 不推荐：初始堆小于最大堆
-Xms1G -Xmx4G
```

**注意事项**：

- 堆大小应该根据应用实际需求设置
- 过大的堆会导致 GC 时间变长
- 过小的堆会导致频繁 GC

</details>

---

## 下一章预告

下一章我们会学习 **性能监控工具**——也就是如何使用 jps、jstat、jmap、jstack 等工具监控 JVM 运行状态。你会学到这些工具的使用方法和应用场景。
