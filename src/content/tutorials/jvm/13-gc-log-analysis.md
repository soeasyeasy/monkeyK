---
title: '第十三章：GC 日志分析'
description: 'GC 日志格式、关键指标、性能分析、调优策略'
---

# 第十三章：GC 日志分析

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何开启和配置 GC 日志？
- GC 日志中的各个字段代表什么含义？
- 如何从 GC 日志中分析性能问题？
- 根据 GC 日志如何制定调优策略？

这一章就是为了解答这些问题。我们会先搞清楚 **GC 日志的配置和格式**，再深入理解关键指标和性能分析方法，最后掌握基于日志的调优策略。学完这章，你就能通过 GC 日志诊断和优化 JVM 性能。

---

## 13.1 为什么需要 GC 日志分析？

### 痛点分析

想象一下这个场景：

你的应用运行缓慢，经常出现 Full GC，但你不知道原因。你调整了 JVM 参数，但不知道效果如何。你需要一种方式来观察 GC 的行为，分析性能瓶颈。

这就是**GC 日志分析的必要性**——它是 JVM 性能调优的"黑匣子"。

### GC 日志的作用

GC 日志记录了：

1. **GC 事件**：每次 GC 的时间、类型、回收的内存量
2. **内存使用**：各内存区域的使用情况
3. **停顿时间**：GC 导致的暂停时间
4. **GC 原因**：触发 GC 的原因

打个比方：

> 就像飞机的黑匣子，记录了飞行过程中的所有关键数据。当出现问题时，通过分析黑匣子数据，可以找到问题根源。

---

## 13.2 GC 日志配置

### JDK 8 及之前版本

```bash
# 启用 GC 日志
-XX:+PrintGC              # 打印简单 GC 信息
-XX:+PrintGCDetails       # 打印详细 GC 信息
-XX:+PrintGCDateStamps    # 打印 GC 时间戳
-XX:+PrintGCTimeStamps    # 打印 GC 相对时间

# 输出到文件
-Xloggc:/path/to/gc.log

# 追加模式（不覆盖）
-XX:+UseGCLogFileRotation
-XX:NumberOfGCLogFiles=5
-XX:GCLogFileSize=10M
```

### JDK 9+ 统一日志框架

```bash
# 基本配置
-Xlog:gc*:file=gc.log:time,tags:filecount=5,filesize=10M

# 详细配置
-Xlog:gc*=info:file=gc.log:time,uptime,level,tags:filecount=5,filesize=10M

# 包含更多细节
-Xlog:gc+phases=debug,gc+heap=trace:file=gc.log
```

### 配置参数对比

| 参数 | 说明 | 适用版本 |
| --- | --- | --- |
| -XX:+PrintGCDetails | 打印详细 GC 信息 | JDK 8- |
| -Xloggc | 指定日志文件路径 | JDK 8- |
| -Xlog:gc* | 统一日志配置 | JDK 9+ |
| filecount | 日志文件轮转数量 | JDK 9+ |
| filesize | 单个日志文件大小 | JDK 9+ |

---

## 13.3 GC 日志格式详解

### JDK 8 GC 日志示例

```
2024-01-15T10:30:45.123+0800: [GC (Allocation Failure) [PSYoungGen: 65536K->10752K(76288K)] 65536K->15360K(251392K), 0.0234567 secs] [Times: user=0.05 sys=0.01, real=0.02 secs]
```

**字段解析**：

| 字段 | 含义 | 示例值 |
| --- | --- | --- |
| 时间戳 | GC 发生的时间 | 2024-01-15T10:30:45.123+0800 |
| GC 原因 | 触发 GC 的原因 | Allocation Failure |
| 收集器 | 使用的垃圾收集器 | PSYoungGen（Parallel Scavenge） |
| 回收前大小 | 回收前的内存使用 | 65536K |
| 回收后大小 | 回收后的内存使用 | 10752K |
| 总大小 | 该区域的总容量 | 76288K |
| 停顿时间 | GC 导致的暂停时间 | 0.0234567 secs |
| CPU 时间 | 用户态和内核态时间 | user=0.05 sys=0.01 |

### 完整日志结构

```
时间戳: [GC 级别 (GC 原因) [内存区域: 回收前->回收后(总大小)] 堆总使用: 回收前->回收后(总大小), 停顿时间 secs] [CPU 时间]
```

### 常见 GC 原因

| 原因 | 说明 |
| --- | --- |
| Allocation Failure | 分配失败，新生代空间不足 |
| System.gc() | 手动调用 System.gc() |
| Metadata GC Threshold | 元空间达到阈值 |
| Ergonomics | JVM 自适应调整 |
| G1 Evacuation Pause | G1 回收器疏散暂停 |
| G1 Humongous Allocation | G1 大对象分配 |

---

## 13.4 关键指标分析

### 1. GC 频率

**指标**：单位时间内 GC 发生的次数

**分析方法**：

```bash
# 统计 Minor GC 次数
grep "GC (Allocation Failure)" gc.log | wc -l

# 统计 Full GC 次数
grep "Full GC" gc.log | wc -l

# 计算 GC 频率（次/分钟）
# 假设日志时间跨度为 60 分钟，Minor GC 100 次
# 频率 = 100 / 60 = 1.67 次/分钟
```

**判断标准**：

| GC 类型 | 正常范围 | 异常范围 |
| --- | --- | --- |
| Minor GC | < 10 次/分钟 | > 50 次/分钟 |
| Full GC | < 1 次/小时 | > 1 次/10 分钟 |

### 2. GC 停顿时间

**指标**：每次 GC 导致的暂停时间

**分析方法**：

```bash
# 提取停顿时间
grep "GC" gc.log | grep -oP '\d+\.\d+ secs' | awk '{print $1}'

# 计算平均停顿时间
grep "GC" gc.log | grep -oP '\d+\.\d+ secs' | awk '{sum+=$1; count++} END {print sum/count}'

# 找出最大停顿时间
grep "GC" gc.log | grep -oP '\d+\.\d+ secs' | awk 'BEGIN {max=0} {if($1>max) max=$1} END {print max}'
```

**判断标准**：

| GC 类型 | 正常范围 | 异常范围 |
| --- | --- | --- |
| Minor GC | < 100ms | > 500ms |
| Full GC | < 1s | > 5s |

### 3. 内存回收效率

**指标**：回收的内存量占总使用量的比例

**计算方法**：

```
回收效率 = (回收前大小 - 回收后大小) / 回收前大小 * 100%
```

**示例**：

```
[PSYoungGen: 65536K->10752K(76288K)]
回收效率 = (65536 - 10752) / 65536 * 100% = 83.6%
```

**判断标准**：

| 效率范围 | 说明 |
| --- | --- |
| > 80% | 优秀 |
| 50%-80% | 正常 |
| < 50% | 异常，可能存在内存泄漏 |

### 4. GC 开销比

**指标**：GC 时间占总运行时间的比例

**计算方法**：

```
GC 开销比 = GC 总时间 / 应用总运行时间 * 100%
```

**示例**：

```bash
# 统计 GC 总时间
grep "GC" gc.log | grep -oP '\d+\.\d+ secs' | awk '{sum+=$1} END {print sum}'
# 假设输出：120.5 秒

# 计算日志时间跨度
# 假设从第一条到最后一条日志相差 3600 秒（1 小时）

# GC 开销比 = 120.5 / 3600 * 100% = 3.35%
```

**判断标准**：

| 开销比 | 说明 |
| --- | --- |
| < 5% | 优秀 |
| 5%-10% | 正常 |
| > 10% | 异常，需要优化 |

---

## 13.5 性能分析方法

### 1. 时间序列分析

**方法**：绘制 GC 频率和停顿时间的时间序列图

**工具**：

- **GCViewer**：可视化 GC 日志
- **GCEasy**：在线分析工具
- **自定义脚本**：使用 Python 或 Shell 分析

**示例脚本**：

```python
#!/usr/bin/env python3
import re
from datetime import datetime

# 解析 GC 日志
def parse_gc_log(log_file):
    gc_events = []
    
    with open(log_file, 'r') as f:
        for line in f:
            # 匹配时间戳和停顿时间
            match = re.search(r'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+).*?(\d+\.\d+) secs', line)
            if match:
                timestamp = datetime.strptime(match.group(1)[:23], '%Y-%m-%dT%H:%M:%S.%f')
                pause_time = float(match.group(2))
                gc_events.append({
                    'timestamp': timestamp,
                    'pause_time': pause_time
                })
    
    return gc_events

# 分析 GC 频率
def analyze_frequency(gc_events):
    if len(gc_events) < 2:
        return 0
    
    time_span = (gc_events[-1]['timestamp'] - gc_events[0]['timestamp']).total_seconds()
    frequency = len(gc_events) / (time_span / 60)  # 次/分钟
    return frequency

# 分析平均停顿时间
def analyze_avg_pause(gc_events):
    if not gc_events:
        return 0
    return sum(e['pause_time'] for e in gc_events) / len(gc_events)

# 主函数
if __name__ == '__main__':
    gc_events = parse_gc_log('gc.log')
    frequency = analyze_frequency(gc_events)
    avg_pause = analyze_avg_pause(gc_events)
    
    print(f"GC 频率: {frequency:.2f} 次/分钟")
    print(f"平均停顿时间: {avg_pause:.3f} 秒")
```

### 2. 内存趋势分析

**方法**：分析各内存区域的使用趋势

**关注点**：

- **老年代使用量**：持续增长可能存在内存泄漏
- **元空间使用量**：持续增长可能加载了过多类
- **堆使用率**：长期高于 80% 需要扩容

**示例分析**：

```bash
# 提取老年代使用量
grep "ParOldGen" gc.log | grep -oP '\d+K->\d+K' | awk -F'->' '{print $2}'

# 观察趋势
# 如果使用量持续增长，可能存在内存泄漏
```

### 3. GC 原因分析

**方法**：统计各种 GC 原因的出现频率

**示例**：

```bash
# 统计 GC 原因
grep "GC (" gc.log | grep -oP 'GC \(\K[^)]+' | sort | uniq -c | sort -rn

# 输出示例：
#  150 Allocation Failure
#   20 System.gc()
#    5 Metadata GC Threshold
```

**分析**：

- **Allocation Failure**：正常，说明新生代空间不足
- **System.gc()**：异常，说明代码中调用了 System.gc()
- **Metadata GC Threshold**：元空间不足，可能需要增加元空间大小

---

## 13.6 调优策略

### 1. Minor GC 频繁

**现象**：Minor GC 频率 > 10 次/分钟

**原因**：

- 新生代空间过小
- 对象创建过快
- 对象生命周期短

**调优策略**：

```bash
# 增大新生代
-Xmn2G  # 从 1G 增加到 2G

# 或者调整新生代比例
-XX:NewRatio=1  # 新生代:老年代 = 1:1
```

### 2. Full GC 频繁

**现象**：Full GC 频率 > 1 次/小时

**原因**：

- 老年代空间过小
- 内存泄漏
- 大对象过多
- 元空间不足

**调优策略**：

```bash
# 增大老年代
-Xmx4G -Xmn1G  # 老年代 = 4G - 1G = 3G

# 增大元空间（JDK 8+）
-XX:MaxMetaspaceSize=512M

# 检查内存泄漏
# 使用 jmap 生成堆转储，使用 MAT 分析
```

### 3. GC 停顿时间过长

**现象**：Minor GC > 500ms，Full GC > 5s

**原因**：

- 堆空间过大
- 垃圾收集器不合适
- 对象过多

**调优策略**：

```bash
# 更换垃圾收集器
-XX:+UseG1GC  # 使用 G1 收集器

# 设置最大停顿时间
-XX:MaxGCPauseMillis=200

# 或者使用 ZGC（JDK 15+）
-XX:+UseZGC
```

### 4. GC 开销比过高

**现象**：GC 开销比 > 10%

**原因**：

- 内存使用率过高
- GC 效率低

**调优策略**：

```bash
# 增大堆内存
-Xmx8G

# 优化 GC 参数
-XX:MaxGCPauseMillis=200
-XX:G1HeapRegionSize=8M

# 检查内存泄漏
# 使用 jstat 监控内存使用趋势
```

---

## 13.7 GC 日志分析工具

### 1. GCViewer

**简介**：开源的 GC 日志可视化工具

**功能**：

- 可视化 GC 事件
- 分析 GC 频率和停顿时间
- 生成性能报告

**使用方法**：

```bash
# 下载 GCViewer
# https://github.com/chewiebug/GCViewer

# 运行 GCViewer
java -jar gcviewer-1.36.jar gc.log
```

### 2. GCEasy

**简介**：在线 GC 日志分析工具

**网址**：http://gceasy.io

**功能**：

- 上传 GC 日志自动分析
- 生成详细的性能报告
- 提供调优建议

### 3. 自定义脚本

**Shell 脚本示例**：

```bash
#!/bin/bash

# 分析 GC 日志
LOG_FILE=$1

echo "=== GC 日志分析报告 ==="
echo

# 统计 Minor GC 次数
MINOR_GC=$(grep "GC (Allocation Failure)" $LOG_FILE | wc -l)
echo "Minor GC 次数: $MINOR_GC"

# 统计 Full GC 次数
FULL_GC=$(grep "Full GC" $LOG_FILE | wc -l)
echo "Full GC 次数: $FULL_GC"

# 计算平均停顿时间
AVG_PAUSE=$(grep "GC" $LOG_FILE | grep -oP '\d+\.\d+ secs' | awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print 0}')
echo "平均停顿时间: ${AVG_PAUSE} 秒"

# 找出最大停顿时间
MAX_PAUSE=$(grep "GC" $LOG_FILE | grep -oP '\d+\.\d+ secs' | awk 'BEGIN {max=0} {if($1>max) max=$1} END {print max}')
echo "最大停顿时间: ${MAX_PAUSE} 秒"

echo
echo "=== 报告结束 ==="
```

**使用方法**：

```bash
chmod +x analyze_gc.sh
./analyze_gc.sh gc.log
```

---

## 13.8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| GC 日志配置 | JDK 8 使用 -XX:+PrintGCDetails，JDK 9+ 使用 -Xlog:gc* |
| 日志格式 | 时间戳、GC 原因、内存区域、停顿时间 |
| 关键指标 | GC 频率、停顿时间、回收效率、GC 开销比 |
| 性能分析 | 时间序列分析、内存趋势分析、GC 原因分析 |
| 调优策略 | 根据问题调整内存、GC 收集器、停顿时间目标 |

---

## 13.9 新手常见误区

### 误区 1："GC 日志越详细越好"

**错！** 详细的日志会占用更多磁盘空间，影响性能。生产环境应该使用适中的日志级别。

正确做法：根据诊断需求选择合适的日志级别，问题排查后再调整回正常级别。

### 误区 2："Minor GC 越少越好"

不是的。Minor GC 频繁说明新生代空间不足，但 Minor GC 停顿时间短。如果为了减少 Minor GC 而增大新生代，可能导致老年代空间不足，反而增加 Full GC。

### 误区 3："Full GC 是可以完全避免的"

不对。Full GC 在某些场景下是必要的，如元空间回收、系统.gc() 调用等。目标是减少 Full GC 频率，而不是完全避免。

### 误区 4："GC 停顿时间越短越好"

实际上，追求过短的停顿时间可能导致 GC 频率增加，总体性能下降。应该在停顿时间和 GC 频率之间找到平衡。

---

## 13.10 动手练习

### 练习 1：基础题

请回答以下问题：

1. 如何配置 GC 日志？JDK 8 和 JDK 9+ 有什么区别？
2. GC 日志中的关键字段有哪些？
3. 如何计算 GC 开销比？

<details>
<summary>点击查看答案</summary>

1. GC 日志配置：
   - **JDK 8 及之前**：
     ```bash
     -XX:+PrintGCDetails
     -XX:+PrintGCDateStamps
     -Xloggc:/path/to/gc.log
     ```
   - **JDK 9+**：
     ```bash
     -Xlog:gc*=info:file=gc.log:time,uptime,level,tags:filecount=5,filesize=10M
     ```

2. GC 日志关键字段：
   - **时间戳**：GC 发生的时间
   - **GC 原因**：触发 GC 的原因（如 Allocation Failure）
   - **内存区域**：回收前后的内存使用（如 65536K->10752K）
   - **停顿时间**：GC 导致的暂停时间（如 0.0234567 secs）
   - **CPU 时间**：用户态和内核态时间

3. GC 开销比计算：
   ```
   GC 开销比 = GC 总时间 / 应用总运行时间 * 100%
   
   示例：
   - GC 总时间：120.5 秒
   - 应用运行时间：3600 秒（1 小时）
   - GC 开销比 = 120.5 / 3600 * 100% = 3.35%
   ```

</details>

### 练习 2：进阶题

请分析以下 GC 日志，判断是否存在性能问题，并给出调优建议。

```
2024-01-15T10:30:45.123+0800: [GC (Allocation Failure) [PSYoungGen: 65536K->10752K(76288K)] 65536K->15360K(251392K), 0.0234567 secs]
2024-01-15T10:30:50.456+0800: [GC (Allocation Failure) [PSYoungGen: 76288K->12800K(76288K)] 76288K->18432K(251392K), 0.0345678 secs]
2024-01-15T10:30:55.789+0800: [GC (Allocation Failure) [PSYoungGen: 76288K->15360K(76288K)] 76288K->20480K(251392K), 0.0456789 secs]
2024-01-15T10:31:00.012+0800: [Full GC (Ergonomics) [PSYoungGen: 15360K->0K(76288K)] [ParOldGen: 179200K->179200K(175104K)] 194560K->179200K(251392K), [Metaspace: 10240K->10240K(1058816K)], 2.3456789 secs]
```

<details>
<summary>点击查看答案</summary>

**日志分析**：

1. **Minor GC 分析**：
   - 发生了 3 次 Minor GC，间隔约 5 秒
   - 停顿时间：23ms、34ms、45ms，平均 34ms
   - 回收效率：83.6%、83.2%、79.9%，平均 82.2%
   - **判断**：Minor GC 频率较高（约 12 次/分钟），但停顿时间和回收效率正常

2. **Full GC 分析**：
   - 发生了 1 次 Full GC
   - 停顿时间：2.3 秒
   - 老年代回收：179200K->179200K，**没有回收任何内存**
   - **判断**：Full GC 失败，老年代空间已满，可能存在内存泄漏

3. **问题诊断**：
   - Minor GC 频繁：新生代空间可能过小
   - Full GC 无法回收老年代：可能存在内存泄漏或大对象过多

**调优建议**：

```bash
# 1. 增大新生代
-Xmn2G  # 从 1G 增加到 2G

# 2. 增大老年代
-Xmx6G  # 从 4G 增加到 6G

# 3. 检查内存泄漏
# 使用 jmap 生成堆转储
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/path/to/dump.hprof

# 4. 使用 MAT 分析堆转储
# 查看哪些对象占用大量内存
```

**进一步分析**：

- 监控老年代使用趋势，如果持续增长，确认存在内存泄漏
- 检查代码中是否有静态集合持有对象引用
- 使用 jstat 持续监控内存使用情况

</details>

### 练习 3（挑战）：综合题

请编写一个 Shell 脚本，分析 GC 日志并生成性能报告。

<details>
<summary>点击查看答案</summary>

```bash
#!/bin/bash

# GC 日志分析脚本
# 用法: ./analyze_gc.sh <gc_log_file>

LOG_FILE=$1

if [ -z "$LOG_FILE" ]; then
    echo "用法: $0 <gc_log_file>"
    exit 1
fi

if [ ! -f "$LOG_FILE" ]; then
    echo "文件不存在: $LOG_FILE"
    exit 1
fi

echo "=========================================="
echo "       GC 日志性能分析报告"
echo "=========================================="
echo "日志文件: $LOG_FILE"
echo "分析时间: $(date)"
echo

# 1. 统计 GC 次数
echo "--- GC 次数统计 ---"
MINOR_GC=$(grep "GC (Allocation Failure)" $LOG_FILE | wc -l)
FULL_GC=$(grep "Full GC" $LOG_FILE | wc -l)
TOTAL_GC=$((MINOR_GC + FULL_GC))

echo "Minor GC 次数: $MINOR_GC"
echo "Full GC 次数: $FULL_GC"
echo "总 GC 次数: $TOTAL_GC"
echo

# 2. 计算停顿时间
echo "--- 停顿时间分析 ---"
AVG_PAUSE=$(grep "GC" $LOG_FILE | grep -oP '\d+\.\d+ secs' | awk '{sum+=$1; count++} END {if(count>0) printf "%.3f", sum/count; else print 0}')
MAX_PAUSE=$(grep "GC" $LOG_FILE | grep -oP '\d+\.\d+ secs' | awk 'BEGIN {max=0} {if($1>max) max=$1} END {print max}')
TOTAL_PAUSE=$(grep "GC" $LOG_FILE | grep -oP '\d+\.\d+ secs' | awk '{sum+=$1} END {print sum}')

echo "平均停顿时间: ${AVG_PAUSE} 秒"
echo "最大停顿时间: ${MAX_PAUSE} 秒"
echo "总停顿时间: ${TOTAL_PAUSE} 秒"
echo

# 3. 计算 GC 开销比
echo "--- GC 开销分析 ---"
FIRST_TIME=$(head -1 $LOG_FILE | grep -oP '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}' | head -1)
LAST_TIME=$(tail -1 $LOG_FILE | grep -oP '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}' | head -1)

if [ -n "$FIRST_TIME" ] && [ -n "$LAST_TIME" ]; then
    FIRST_TS=$(date -d "$FIRST_TIME" +%s 2>/dev/null || echo 0)
    LAST_TS=$(date -d "$LAST_TIME" +%s 2>/dev/null || echo 0)
    
    if [ $FIRST_TS -gt 0 ] && [ $LAST_TS -gt 0 ]; then
        TIME_SPAN=$((LAST_TS - FIRST_TS))
        if [ $TIME_SPAN -gt 0 ]; then
            GC_RATIO=$(echo "scale=2; $TOTAL_PAUSE * 100 / $TIME_SPAN" | bc)
            echo "日志时间跨度: ${TIME_SPAN} 秒"
            echo "GC 开销比: ${GC_RATIO}%"
        fi
    fi
fi
echo

# 4. GC 原因统计
echo "--- GC 原因统计 ---"
grep "GC (" $LOG_FILE | grep -oP 'GC \(\K[^)]+' | sort | uniq -c | sort -rn
echo

# 5. 性能评估
echo "--- 性能评估 ---"
if [ $MINOR_GC -gt 600 ]; then
    echo "⚠️  Minor GC 频率过高（> 10 次/分钟）"
else
    echo "✓ Minor GC 频率正常"
fi

if [ $FULL_GC -gt 6 ]; then
    echo "⚠️  Full GC 频率过高（> 1 次/小时）"
else
    echo "✓ Full GC 频率正常"
fi

if (( $(echo "$AVG_PAUSE > 0.5" | bc -l) )); then
    echo "⚠️  平均停顿时间过长（> 500ms）"
else
    echo "✓ 平均停顿时间正常"
fi

echo
echo "=========================================="
echo "          报告生成完成"
echo "=========================================="
```

**使用方法**：

```bash
chmod +x analyze_gc.sh
./analyze_gc.sh gc.log
```

**输出示例**：

```
==========================================
       GC 日志性能分析报告
==========================================
日志文件: gc.log
分析时间: Mon Jan 15 10:35:00 CST 2024

--- GC 次数统计 ---
Minor GC 次数: 150
Full GC 次数: 3
总 GC 次数: 153

--- 停顿时间分析 ---
平均停顿时间: 0.034 秒
最大停顿时间: 2.345 秒
总停顿时间: 5.203 秒

--- GC 开销分析 ---
日志时间跨度: 3600 秒
GC 开销比: .14%

--- GC 原因统计 ---
    150 Allocation Failure
      3 Ergonomics

--- 性能评估 ---
✓ Minor GC 频率正常
✓ Full GC 频率正常
✓ 平均停顿时间正常

==========================================
          报告生成完成
==========================================
```

</details>

---

## 下一章预告

下一章我们会学习 **JVM 沙箱与安全**——也就是 JVM 的安全管理机制。你会学到安全管理器、权限控制、代码签名、沙箱机制等核心概念，了解如何保护 JVM 免受恶意代码攻击。
