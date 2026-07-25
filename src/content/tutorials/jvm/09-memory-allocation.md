---
title: '第九章：内存分配与回收策略'
description: '对象分配、TLAB、内存分配担保、 Minor/Major GC'
---

# 第九章：内存分配与回收策略

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 对象在内存中是如何分配的？
- 什么是 TLAB？它有什么作用？
- 什么时候会触发 Minor GC 和 Major GC？
- 什么是内存分配担保机制？

这一章就是为了解答这些问题。我们会先搞清楚 **对象内存分配的规则**，再深入理解 TLAB、GC 触发条件和内存分配担保机制。学完这章，你就能理解 JVM 如何管理内存分配和回收。

---

## 9.1 为什么需要内存分配策略？

### 痛点分析

想象一下这个场景：

你的程序不断创建新对象，如果没有统一的内存分配策略，可能会导致内存碎片、分配效率低、频繁 GC 等问题。

这就是**内存分配策略的必要性**——JVM 需要一套高效的内存管理方案。

### 内存分配策略的解决方案

JVM 采用**分代分配**策略，根据对象的生命周期特点，将堆分为新生代和老年代，采用不同的分配和回收策略。

打个比方：

> 就像公司的办公区域，新员工（新对象）先在开放工位（新生代）工作，表现好的老员工（长期存活的对象）才搬到独立办公室（老年代）。

---

## 9.2 对象分配规则

### 优先在 Eden 区分配

大多数对象都在**新生代的 Eden 区**分配。

```java
// 示例：对象在 Eden 区分配
public class AllocationDemo {
    public static void main(String[] args) {
        // 这些对象都会在 Eden 区分配
        Object obj1 = new Object();
        Object obj2 = new Object();
        Object obj3 = new Object();
    }
}
```

**原因**：

- 对象朝生夕死，大部分对象在新生代就被回收
- Eden 区采用复制算法，分配效率高

### 大对象直接进入老年代

大对象（如长字符串、大数组）会**直接进入老年代**，避免在新生代频繁复制。

```java
// 示例：大对象直接进入老年代
public class LargeObjectDemo {
    public static void main(String[] args) {
        // 大对象直接进入老年代
        byte[] largeArray = new byte[1024 * 1024]; // 1MB
    }
}
```

**配置参数**：

```bash
# 设置大对象阈值（默认 0，表示不限制）
-XX:PretenureSizeThreshold=1048576

# 注意：此参数仅对 Serial 和 Parallel 收集器有效
```

### 长期存活的对象进入老年代

对象在新生代中每经历一次 GC，年龄就增加 1 岁。当年龄超过阈值时，会进入老年代。

```java
// 示例：对象年龄增长
public class ObjectAgeDemo {
    public static void main(String[] args) {
        // 这个对象会一直存活，最终进入老年代
        List<Object> list = new ArrayList<>();
        list.add(new Object()); // 对象年龄逐渐增长
    }
}
```

**配置参数**：

```bash
# 设置对象进入老年代的年龄阈值（默认 15）
-XX:MaxTenuringThreshold=15
```

### 动态年龄判断

如果 Survivor 区中**相同年龄的对象总大小超过 Survivor 空间的一半**，那么年龄大于或等于该年龄的对象会直接进入老年代。

```
假设：
- Survivor 区大小：1MB
- 年龄 1 的对象：300KB
- 年龄 2 的对象：300KB
- 年龄 3 的对象：200KB

年龄 1 + 年龄 2 = 600KB > 500KB（Survivor 的一半）
所以年龄 >= 2 的对象直接进入老年代
```

---

## 9.3 TLAB（Thread Local Allocation Buffer）

### 什么是 TLAB

TLAB 是**线程私有的内存缓冲区**，每个线程在 Eden 区都有自己的 TLAB。

### 为什么需要 TLAB

对象分配是线程的基本操作，如果多个线程同时分配内存，需要加锁保证线程安全。加锁会影响性能。

TLAB 的解决方案：

- 每个线程有自己的 TLAB
- 线程在自己的 TLAB 中分配内存，不需要加锁
- 只有 TLAB 用完时，才需要申请新的 TLAB

打个比方：

> 就像每个人都有自己的工具箱，需要工具时直接从自己的工具箱里拿，不需要去公共仓库排队。

### TLAB 的工作原理

```
线程 1 的 TLAB：[已分配][已分配][空闲]
线程 2 的 TLAB：[已分配][空闲][空闲]
线程 3 的 TLAB：[已分配][已分配][已分配]

每个线程在自己的 TLAB 中分配，互不干扰
```

### TLAB 的配置

```bash
# 启用 TLAB（默认启用）
-XX:+UseTLAB

# 设置 TLAB 占 Eden 区的比例（默认 1%）
-XX:TLABSize=1M

# 当 TLAB 剩余空间不足 1% 时，重新分配 TLAB
-XX:TLABRefillWasteFraction=100
```

### TLAB 的优势

| 优势 | 说明 |
| --- | --- |
| 无锁分配 | 线程在自己的 TLAB 中分配，不需要加锁 |
| 分配效率高 | 只需要移动指针，速度极快 |
| 减少竞争 | 多个线程可以同时分配内存 |

---

## 9.4 Minor GC、Major GC、Full GC

### Minor GC（新生代 GC）

Minor GC 是指**新生代的垃圾回收**。

**触发条件**：

- Eden 区满
- Survivor 区满（较少见）

**特点**：

- 频率高：对象朝生夕死，Minor GC 频繁触发
- 速度快：新生代对象存活率低，回收效率高
- 影响范围小：只回收新生代

```java
// 示例：触发 Minor GC
public class MinorGCDemo {
    public static void main(String[] args) {
        // 不断创建对象，填满 Eden 区
        List<byte[]> list = new ArrayList<>();
        for (int i = 0; i < 10000; i++) {
            list.add(new byte[4096]); // 每次分配 4KB
        }
        // 当 Eden 区满时，触发 Minor GC
    }
}
```

### Major GC（老年代 GC）

Major GC 是指**老年代的垃圾回收**。

**触发条件**：

- 老年代空间不足
- 方法区空间不足（JDK 8 之前的永久代）

**特点**：

- 频率低：老年代对象长期存活
- 速度慢：老年代对象存活率高，回收效率低
- 影响范围大：只回收老年代

### Full GC（整堆 GC）

Full GC 是指**整个堆和方法区的垃圾回收**。

**触发条件**：

- 老年代空间不足
- 方法区空间不足
- 调用 `System.gc()`（建议执行，不保证）
- Minor GC 后进入老年代的对象大于老年代剩余空间

**特点**：

- 频率最低：影响整个堆
- 速度最慢：需要回收整个堆
- 停顿时间最长：影响所有线程

### GC 类型对比

| GC 类型 | 回收区域 | 触发条件 | 频率 | 速度 |
| --- | --- | --- | --- | --- |
| Minor GC | 新生代 | Eden 区满 | 高 | 快 |
| Major GC | 老年代 | 老年代空间不足 | 低 | 慢 |
| Full GC | 整个堆 | 老年代或方法区不足 | 最低 | 最慢 |

---

## 9.5 内存分配担保机制

### 什么是内存分配担保

内存分配担保是指**在 Minor GC 之前，JVM 会检查老年代剩余空间是否足够容纳新生代所有对象**。如果不够，会触发 Full GC。

### 担保机制的工作原理

```
Minor GC 前：
1. 检查老年代剩余空间
2. 如果 < 新生代所有对象大小，触发 Full GC
3. 如果 >= 新生代所有对象大小，执行 Minor GC
```

### 担保机制的配置

```bash
# 启用动态年龄判断（默认启用）
-XX:+HandlePromotionFailure

# 禁用动态年龄判断
-XX:-HandlePromotionFailure
```

### 担保机制的示例

```java
// 示例：内存分配担保
public class PromotionDemo {
    public static void main(String[] args) {
        // 创建大量长期存活的对象
        List<Object> list = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            list.add(new Object()); // 对象年龄逐渐增长
        }
        
        // 当 Minor GC 发生时
        // 如果老年代空间不足，会触发 Full GC
    }
}
```

---

## 9.6 空间分配担保

### 什么是空间分配担保

空间分配担保是指**在 Minor GC 时，JVM 会检查老年代剩余空间是否大于新生代所有对象的总大小**。

### 担保流程

```
Minor GC 前：
1. 计算新生代所有对象大小
2. 检查老年代剩余空间
3. 如果老年代 < 新生代对象大小，触发 Full GC
4. 如果老年代 >= 新生代对象大小，执行 Minor GC
```

### 担保机制的意义

- **避免 Minor GC 后对象无法进入老年代**
- **保证内存分配的稳定性**
- **减少 Full GC 的频率**

---

## 9.7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 对象分配规则 | 优先 Eden 区，大对象直接老年代，长期存活进老年代 |
| TLAB | 线程私有的内存缓冲区，无锁分配 |
| Minor GC | 新生代 GC，频率高，速度快 |
| Major GC | 老年代 GC，频率低，速度慢 |
| Full GC | 整堆 GC，频率最低，速度最慢 |
| 内存分配担保 | Minor GC 前检查老年代空间 |

---

## 9.8 新手常见误区

### 误区 1："所有对象都在 Eden 区分配"

**错！** 大对象会直接进入老年代，避免在新生代频繁复制。

正确做法：理解不同对象的分配策略，大对象直接老年代。

### 误区 2："Minor GC 一定会触发 Major GC"

不是的。Minor GC 只回收新生代，只有当老年代空间不足时才会触发 Major GC 或 Full GC。

### 误区 3："TLAB 可以完全消除锁竞争"

实际上，TLAB 只能减少锁竞争。当 TLAB 用完时，仍然需要申请新的 TLAB，这时可能需要加锁。

### 误区 4："对象年龄达到阈值就一定会进入老年代"

不对。如果 Survivor 区空间不足，对象可能会提前进入老年代。此外，动态年龄判断也可能让对象提前进入老年代。

---

## 9.9 动手练习

### 练习 1：基础题

请回答以下问题：

1. 对象在内存中是如何分配的？
2. 什么是 TLAB？它有什么作用？
3. Minor GC 和 Major GC 有什么区别？

<details>
<summary>点击查看答案</summary>

1. 对象分配规则：
   - **优先在 Eden 区分配**：大多数对象都在新生代的 Eden 区分配
   - **大对象直接进入老年代**：避免在新生代频繁复制
   - **长期存活的对象进入老年代**：对象年龄超过阈值（默认 15）进入老年代
   - **动态年龄判断**：相同年龄对象总大小超过 Survivor 一半，直接进入老年代

2. TLAB（Thread Local Allocation Buffer）是线程私有的内存缓冲区。每个线程在 Eden 区都有自己的 TLAB，线程在自己的 TLAB 中分配内存，不需要加锁，提高分配效率。

3. Minor GC 和 Major GC 的区别：
   - **Minor GC**：新生代 GC，触发条件为 Eden 区满，频率高，速度快
   - **Major GC**：老年代 GC，触发条件为老年代空间不足，频率低，速度慢

</details>

### 练习 2：进阶题

请解释内存分配担保机制的工作原理。

<details>
<summary>点击查看答案</summary>

**内存分配担保机制**：

内存分配担保是指在 Minor GC 之前，JVM 会检查老年代剩余空间是否足够容纳新生代所有对象。

**工作流程**：

1. Minor GC 前，计算新生代所有对象的总大小
2. 检查老年代剩余空间
3. 如果老年代剩余空间 < 新生代对象总大小，触发 Full GC
4. 如果老年代剩余空间 >= 新生代对象总大小，执行 Minor GC

**意义**：

- 避免 Minor GC 后对象无法进入老年代
- 保证内存分配的稳定性
- 减少 Full GC 的频率

**配置参数**：

```bash
# 启用动态年龄判断（默认启用）
-XX:+HandlePromotionFailure
```

</details>

### 练习 3（挑战）：综合题

请解释为什么大对象要直接进入老年代，而不是在新生代分配？

<details>
<summary>点击查看答案</summary>

**原因**：

1. **避免频繁复制**：
   - 新生代采用复制算法，Minor GC 时需要将存活对象从 Eden 复制到 Survivor
   - 大对象复制开销大，会显著降低 GC 效率

2. **提高 GC 效率**：
   - 大对象在老年代，不会参与 Minor GC
   - 减少 Minor GC 的时间

3. **符合对象生命周期**：
   - 大对象通常是长期存活的（如缓存、配置）
   - 直接进入老年代符合其生命周期特点

**配置参数**：

```bash
# 设置大对象阈值（默认 0，表示不限制）
-XX:PretenureSizeThreshold=1048576

# 注意：此参数仅对 Serial 和 Parallel 收集器有效
```

**示例**：

```java
public class LargeObjectAllocation {
    public static void main(String[] args) {
        // 大对象直接进入老年代
        byte[] largeArray = new byte[1024 * 1024]; // 1MB
    }
}
```

</details>

---

## 下一章预告

下一章我们会学习 **JVM 调优基础**——也就是 JVM 参数的分类、堆内存设置、GC 参数、日志配置等核心概念。你会学到如何配置 JVM 参数，优化程序性能。
