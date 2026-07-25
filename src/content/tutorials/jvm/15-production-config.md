---
title: '第十五章：生产环境 JVM 配置'
description: '容器化部署、云原生配置、最佳实践、性能基准'
---

# 第十五章：生产环境 JVM 配置

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 在 Docker 容器中运行 Java 应用有什么特殊要求？
- 云原生环境下如何配置 JVM 参数？
- 容器资源限制与 JVM 参数如何协调？
- 生产环境的最佳实践是什么？

这一章就是为了解答这些问题。我们会先搞清楚 **容器化部署的 JVM 配置要点**，再深入理解云原生环境的特殊要求，最后掌握生产环境的最佳实践和性能基准测试方法。学完这章，你就能在生产环境中正确配置和部署 Java 应用。

---

## 15.1 为什么需要特殊的容器配置？

### 痛点分析

想象一下这个场景：

你把 Java 应用打包成 Docker 镜像，设置了 `-Xmx4G`。但在容器中运行时，应用频繁被 OOM Killer 杀死。你发现容器限制了 2G 内存，但 JVM 却尝试使用 4G。

这就是**容器环境下的常见问题**——JVM 无法感知容器的资源限制。

### 容器环境的特殊性

容器与传统虚拟机不同：

| 特性 | 传统虚拟机 | 容器 |
| --- | --- | --- |
| 资源隔离 | 完全隔离 | 共享内核，cgroups 限制 |
| 资源可见性 | JVM 可以看到全部资源 | JVM 可能看到宿主机资源 |
| OOM 处理 | JVM 处理 OOM | 容器 OOM Killer 直接杀死进程 |

打个比方：

> 就像你在一个限制容量的房间里（容器），但你以为自己在整个大楼里（宿主机）。你按照大楼的容量搬家具（JVM 分配内存），结果房间装不下，管理员（OOM Killer）把你赶出去了。

### 容器配置的解决方案

JVM 需要特殊配置来适配容器环境：

1. **感知容器限制**：让 JVM 知道容器的资源限制
2. **调整内存分配**：根据容器限制调整堆大小
3. **优化 GC 行为**：适应容器的资源约束
4. **监控和诊断**：容器环境下的监控方法

---

## 15.2 JVM 容器感知

### JDK 8u191+ 容器支持

从 JDK 8u191 开始，JVM 支持感知 cgroups 限制：

```bash
# 启用容器感知（JDK 8u191+ 默认启用）
-XX:+UseContainerSupport

# 查看是否启用
java -XX:+PrintFlagsFinal -version | grep UseContainerSupport
```

### 容器感知的效果

```java
// 示例：检查 JVM 是否感知容器限制
public class ContainerAwareDemo {
    public static void main(String[] args) {
        // 获取运行时内存信息
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory();
        long totalMemory = runtime.totalMemory();
        
        System.out.println("最大内存: " + (maxMemory / 1024 / 1024) + " MB");
        System.out.println("总内存: " + (totalMemory / 1024 / 1024) + " MB");
        
        // 获取处理器数量
        int availableProcessors = runtime.availableProcessors();
        System.out.println("可用处理器: " + availableProcessors);
    }
}
```

**容器限制 2G 内存时的输出**：

```
最大内存: 491 MB  # 约为容器限制的 25%
总内存: 245 MB
可用处理器: 2     # 容器限制的 CPU 数量
```

### 容器感知的原理

JVM 通过读取 cgroups 信息获取容器限制：

```bash
# 查看 cgroups 内存限制
cat /sys/fs/cgroup/memory/memory.limit_in_bytes

# 查看 cgroups CPU 限制
cat /sys/fs/cgroup/cpu/cpu.cfs_quota_us
cat /sys/fs/cgroup/cpu/cpu.cfs_period_us
```

---

## 15.3 容器内存配置

### 堆内存配置策略

在容器中，堆内存应该根据容器限制合理配置：

```bash
# ❌ 错误：固定堆大小，不考虑容器限制
-Xmx4G

# ✅ 正确：根据容器限制配置
# 假设容器限制 2G 内存
-Xms1536M -Xmx1536M  # 堆占容器内存的 75%

# ✅ 更好：使用百分比配置（JDK 10+）
-XX:MaxRAMPercentage=75.0
-XX:InitialRAMPercentage=75.0
```

### 内存分配建议

| 容器内存 | 堆大小 | 非堆内存 | 说明 |
| --- | --- | --- | --- |
| 512M | 384M | 128M | 小型应用 |
| 1G | 768M | 256M | 中型应用 |
| 2G | 1536M | 512M | 大型应用 |
| 4G | 3072M | 1024M | 超大应用 |

### 非堆内存考虑

非堆内存包括：

- **元空间**（Metaspace）：类元数据
- **线程栈**：每个线程的栈空间
- **直接内存**：NIO 直接内存
- **代码缓存**：JIT 编译的代码

```bash
# 配置非堆内存
-XX:MaxMetaspaceSize=256M      # 元空间上限
-Xss512k                       # 线程栈大小
-XX:MaxDirectMemorySize=256M   # 直接内存上限
-XX:ReservedCodeCacheSize=128M # 代码缓存大小
```

### 完整容器配置示例

```bash
# Dockerfile
FROM openjdk:17-jdk-slim

# 设置 JVM 参数
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 \
               -XX:InitialRAMPercentage=75.0 \
               -XX:MaxMetaspaceSize=256M \
               -Xss512k \
               -XX:MaxDirectMemorySize=256M \
               -XX:+UseG1GC \
               -XX:MaxGCPauseMillis=200 \
               -XX:+HeapDumpOnOutOfMemoryError \
               -XX:HeapDumpPath=/tmp/heapdump.hprof"

# 启动应用
CMD ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
```

**Docker 运行命令**：

```bash
# 限制容器资源
docker run -d \
  --name myapp \
  --memory=2g \
  --cpus=2 \
  myapp:latest
```

---

## 15.4 容器 CPU 配置

### CPU 感知配置

JVM 会根据容器的 CPU 限制调整线程池大小：

```java
// 示例：检查 JVM 的 CPU 感知
public class CPUAwareDemo {
    public static void main(String[] args) {
        Runtime runtime = Runtime.getRuntime();
        
        // 可用处理器数量（受容器限制）
        int availableProcessors = runtime.availableProcessors();
        System.out.println("可用处理器: " + availableProcessors);
        
        // 线程池大小应该基于可用处理器
        int corePoolSize = availableProcessors;
        int maxPoolSize = availableProcessors * 2;
        
        System.out.println("建议线程池大小: " + corePoolSize + " - " + maxPoolSize);
    }
}
```

### GC 线程配置

```bash
# 并行 GC 线程数（默认等于 CPU 数量）
-XX:ParallelGCThreads=2

# 并发 GC 线程数（默认等于 CPU 数量的 1/4）
-XX:ConcGCThreads=1

# 注意：在容器中，这些值会自动适配容器 CPU 限制
```

### 线程池配置建议

```java
// 示例：根据容器 CPU 配置线程池
import java.util.concurrent.*;

public class ThreadPoolConfig {
    
    public static ExecutorService createThreadPool() {
        int cpuCount = Runtime.getRuntime().availableProcessors();
        
        // CPU 密集型任务
        int corePoolSize = cpuCount;
        int maxPoolSize = cpuCount;
        
        // IO 密集型任务
        // int corePoolSize = cpuCount * 2;
        // int maxPoolSize = cpuCount * 4;
        
        return new ThreadPoolExecutor(
            corePoolSize,
            maxPoolSize,
            60L,
            TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(1000),
            new ThreadFactoryBuilder()
                .setNameFormat("app-pool-%d")
                .build(),
            new ThreadPoolExecutor.CallerRunsPolicy()
        );
    }
}
```

---

## 15.5 Kubernetes 环境配置

### Pod 资源配置

```yaml
# kubernetes-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: java-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: java-app
  template:
    metadata:
      labels:
        app: java-app
    spec:
      containers:
      - name: java-app
        image: myapp:latest
        resources:
          requests:
            memory: "2Gi"
            cpu: "2"
          limits:
            memory: "2Gi"
            cpu: "2"
        env:
        - name: JAVA_OPTS
          value: "-XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=75.0"
```

### 资源请求与限制

| 配置项 | 说明 | 建议 |
| --- | --- | --- |
| requests.memory | 容器请求的内存 | 与 limits 相同 |
| limits.memory | 容器最大内存 | 根据应用需求设置 |
| requests.cpu | 容器请求的 CPU | 与 limits 相同 |
| limits.cpu | 容器最大 CPU | 根据应用需求设置 |

### 健康检查配置

```yaml
# 健康检查
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

### JVM 参数与环境变量

```yaml
# 使用 ConfigMap 管理 JVM 参数
apiVersion: v1
kind: ConfigMap
metadata:
  name: jvm-config
data:
  JAVA_OPTS: |
    -XX:MaxRAMPercentage=75.0
    -XX:InitialRAMPercentage=75.0
    -XX:MaxMetaspaceSize=256M
    -Xss512k
    -XX:+UseG1GC
    -XX:MaxGCPauseMillis=200
    -XX:+HeapDumpOnOutOfMemoryError
    -XX:HeapDumpPath=/tmp/heapdump.hprof
    -XX:+PrintGCDetails
    -XX:+PrintGCDateStamps
    -Xloggc:/var/log/gc.log
```

---

## 15.6 生产环境最佳实践

### 1. 内存配置最佳实践

```bash
# ✅ 推荐配置
-XX:MaxRAMPercentage=75.0        # 堆占容器内存的 75%
-XX:InitialRAMPercentage=75.0    # 初始堆与最大堆相同
-XX:MaxMetaspaceSize=256M        # 限制元空间大小
-Xss512k                         # 线程栈大小
-XX:MaxDirectMemorySize=256M     # 限制直接内存

# ❌ 避免配置
-Xmx4G                           # 固定堆大小，不考虑容器限制
-XX:MaxMetaspaceSize=unlimited   # 不限制元空间
```

### 2. GC 配置最佳实践

```bash
# ✅ 推荐配置（JDK 11+）
-XX:+UseG1GC                     # 使用 G1 垃圾收集器
-XX:MaxGCPauseMillis=200         # 最大停顿时间 200ms
-XX:G1HeapRegionSize=8M          # G1 区域大小
-XX:InitiatingHeapOccupancyPercent=45  # 老年代占用阈值

# ✅ 超低延迟配置（JDK 17+）
-XX:+UseZGC                      # 使用 ZGC
-XX:ZCollectionInterval=120      # 定期 GC 间隔
```

### 3. 日志配置最佳实践

```bash
# ✅ 推荐配置（JDK 11+）
-Xlog:gc*=info:file=/var/log/gc.log:time,uptime,level,tags:filecount=5,filesize=10M

# ✅ OOM 诊断配置
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/tmp/heapdump.hprof
-XX:OnOutOfMemoryError="kill -3 %p"
```

### 4. 监控配置最佳实践

```bash
# ✅ JMX 远程监控
-Dcom.sun.management.jmxremote
-Dcom.sun.management.jmxremote.port=9010
-Dcom.sun.management.jmxremote.authenticate=false
-Dcom.sun.management.jmxremote.ssl=false

# ✅ Prometheus 监控（使用 Micrometer）
# 添加依赖：io.micrometer:micrometer-registry-prometheus
# 暴露 /actuator/prometheus 端点
```

### 5. 安全配置最佳实践

```bash
# ✅ 启用安全管理器
-Djava.security.manager
-Djava.security.policy=/path/to/policy.txt

# ✅ 禁用不需要的功能
-Djava.rmi.server.hostname=127.0.0.1
-Dcom.sun.management.jmxremote.local.only=true
```

---

## 15.7 性能基准测试

### 基准测试工具

#### 1. JMH（Java Microbenchmark Harness）

```java
// 示例：JMH 基准测试
import org.openjdk.jmh.annotations.*;
import java.util.concurrent.TimeUnit;

@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@State(Scope.Thread)
public class BenchmarkDemo {
    
    @Benchmark
    public void testStringConcatenation() {
        String result = "Hello" + " " + "World";
    }
    
    @Benchmark
    public void testStringBuilder() {
        StringBuilder sb = new StringBuilder();
        sb.append("Hello");
        sb.append(" ");
        sb.append("World");
        String result = sb.toString();
    }
    
    public static void main(String[] args) throws Exception {
        org.openjdk.jmh.Main.main(args);
    }
}
```

#### 2. wrk（HTTP 基准测试）

```bash
# 安装 wrk
# Ubuntu: sudo apt-get install wrk
# CentOS: sudo yum install wrk

# 运行基准测试
wrk -t12 -c400 -d30s http://localhost:8080/api/test

# 输出示例：
# Running 30s test @ http://localhost:8080/api/test
#   12 threads and 400 connections
#   Thread Stats   Avg      Stdev     Max   +/- Stdev
#     Latency    50.12ms   20.45ms 200.34ms   75.12%
#     Req/Sec     1.23k   150.23     2.50k    68.45%
#   442837 requests in 30.10s, 50.12MB read
# Requests/sec:  14712.34
# Transfer/sec:      1.66MB
```

### 基准测试流程

```bash
#!/bin/bash

# 基准测试脚本

APP_NAME="myapp"
CONTAINER_MEMORY="2g"
CONTAINER_CPU="2"

echo "=== 开始基准测试 ==="

# 1. 启动应用
echo "1. 启动应用..."
docker run -d \
  --name $APP_NAME \
  --memory=$CONTAINER_MEMORY \
  --cpus=$CONTAINER_CPU \
  -e JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC" \
  $APP_NAME:latest

# 等待应用启动
echo "2. 等待应用启动..."
sleep 30

# 2. 预热
echo "3. 预热应用..."
for i in {1..100}; do
  curl -s http://localhost:8080/api/test > /dev/null
done

# 3. 运行基准测试
echo "4. 运行基准测试..."
wrk -t12 -c400 -d60s http://localhost:8080/api/test > benchmark_result.txt

# 4. 收集 GC 日志
echo "5. 收集 GC 日志..."
docker cp $APP_NAME:/var/log/gc.log ./gc.log

# 5. 停止应用
echo "6. 停止应用..."
docker stop $APP_NAME
docker rm $APP_NAME

echo "=== 基准测试完成 ==="
echo "结果保存在 benchmark_result.txt 和 gc.log"
```

### 性能指标分析

| 指标 | 说明 | 优秀范围 |
| --- | --- | --- |
| 吞吐量 | 每秒请求数 | > 10000 req/s |
| 延迟 | 平均响应时间 | < 100ms |
| P99 延迟 | 99% 请求的延迟 | < 500ms |
| GC 停顿 | 最大 GC 停顿时间 | < 200ms |
| GC 频率 | 每分钟 GC 次数 | < 10 次/分钟 |

---

## 15.8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 容器感知 | JVM 通过 cgroups 感知容器资源限制 |
| 内存配置 | 使用百分比配置（MaxRAMPercentage） |
| CPU 配置 | JVM 自动适配容器 CPU 限制 |
| Kubernetes | 合理设置资源请求和限制 |
| 最佳实践 | 内存、GC、日志、监控、安全配置 |
| 性能基准 | 使用 JMH、wrk 等工具测试性能 |

---

## 15.9 新手常见误区

### 误区 1："容器中的 JVM 会自动适配资源限制"

**错！** 虽然 JDK 8u191+ 支持容器感知，但默认配置可能不适合所有场景。需要显式配置 MaxRAMPercentage 等参数。

正确做法：根据容器资源限制，显式配置 JVM 参数。

### 误区 2："堆内存可以设置为容器内存的 100%"

不是的。JVM 还需要非堆内存（元空间、线程栈、直接内存等）。如果堆占满容器内存，会导致容器 OOM。

正确做法：堆内存占容器内存的 75%，预留 25% 给非堆内存。

### 误区 3："容器中的 GC 配置与虚拟机相同"

不对。容器资源有限，需要更保守的 GC 配置。例如，减少 GC 线程数，降低停顿时间目标。

正确做法：根据容器 CPU 和内存限制，调整 GC 参数。

### 误区 4："不需要监控容器中的 JVM"

实际上，容器环境更需要监控。因为资源有限，问题更容易暴露。需要监控内存使用、GC 情况、线程状态等。

正确做法：使用 Prometheus + Grafana 监控容器中的 JVM。

---

## 15.10 动手练习

### 练习 1：基础题

请回答以下问题：

1. 容器环境下的 JVM 有什么特殊性？
2. 如何配置容器的堆内存？
3. Kubernetes 中如何配置 JVM 参数？

<details>
<summary>点击查看答案</summary>

1. 容器环境下 JVM 的特殊性：
   - **资源隔离**：容器使用 cgroups 限制资源，JVM 可能看到宿主机资源
   - **OOM 处理**：容器 OOM Killer 直接杀死进程，JVM 无法处理
   - **CPU 感知**：JVM 需要感知容器的 CPU 限制
   - **内存感知**：JVM 需要感知容器的内存限制

2. 容器堆内存配置：
   ```bash
   # ✅ 推荐：使用百分比配置（JDK 10+）
   -XX:MaxRAMPercentage=75.0
   -XX:InitialRAMPercentage=75.0
   
   # ✅ 或者：固定大小（根据容器内存计算）
   # 容器 2G 内存，堆设置 1536M（75%）
   -Xms1536M -Xmx1536M
   ```

3. Kubernetes 中配置 JVM 参数：
   ```yaml
   # 使用环境变量
   env:
   - name: JAVA_OPTS
     value: "-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"
   
   # 或使用 ConfigMap
   envFrom:
   - configMapRef:
       name: jvm-config
   ```

</details>

### 练习 2：进阶题

请为一个 2G 内存、2 CPU 的容器配置完整的 JVM 参数，并解释每个参数的作用。

<details>
<summary>点击查看答案</summary>

**完整 JVM 配置**：

```bash
# 内存配置
-XX:MaxRAMPercentage=75.0           # 堆占容器内存的 75%（1536M）
-XX:InitialRAMPercentage=75.0       # 初始堆与最大堆相同
-XX:MaxMetaspaceSize=256M           # 元空间上限
-Xss512k                            # 线程栈大小
-XX:MaxDirectMemorySize=256M        # 直接内存上限

# GC 配置
-XX:+UseG1GC                        # 使用 G1 垃圾收集器
-XX:MaxGCPauseMillis=200            # 最大停顿时间 200ms
-XX:G1HeapRegionSize=8M             # G1 区域大小
-XX:InitiatingHeapOccupancyPercent=45  # 老年代占用阈值
-XX:ParallelGCThreads=2             # 并行 GC 线程数（等于 CPU 数）
-XX:ConcGCThreads=1                 # 并发 GC 线程数

# 日志配置
-Xlog:gc*=info:file=/var/log/gc.log:time,uptime,level,tags:filecount=5,filesize=10M

# 诊断配置
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/tmp/heapdump.hprof
-XX:OnOutOfMemoryError="kill -3 %p"

# 监控配置
-Dcom.sun.management.jmxremote
-Dcom.sun.management.jmxremote.port=9010
-Dcom.sun.management.jmxremote.authenticate=false
-Dcom.sun.management.jmxremote.ssl=false
```

**参数解释**：

1. **内存配置**：
   - `MaxRAMPercentage=75.0`：堆占容器内存的 75%，预留 25% 给非堆内存
   - `MaxMetaspaceSize=256M`：限制元空间大小，防止无限增长
   - `Xss512k`：线程栈大小，影响最大线程数
   - `MaxDirectMemorySize=256M`：限制直接内存，防止 NIO 内存泄漏

2. **GC 配置**：
   - `UseG1GC`：G1 适合服务端应用，平衡吞吐和延迟
   - `MaxGCPauseMillis=200`：控制 GC 停顿时间
   - `ParallelGCThreads=2`：等于容器 CPU 数
   - `ConcGCThreads=1`：CPU 数的 1/4

3. **日志配置**：
   - `Xlog:gc*`：统一日志框架，记录 GC 信息
   - `filecount=5,filesize=10M`：日志轮转，防止磁盘满

4. **诊断配置**：
   - `HeapDumpOnOutOfMemoryError`：OOM 时自动生成堆转储
   - `OnOutOfMemoryError`：OOM 时执行命令

5. **监控配置**：
   - `jmxremote`：启用 JMX 远程监控

</details>

### 练习 3（挑战）：综合题

请编写一个完整的 Dockerfile 和 Kubernetes Deployment 配置，部署一个 Java 应用到生产环境。

<details>
<summary>点击查看答案</summary>

**Dockerfile**：

```dockerfile
# 使用轻量级 JDK 镜像
FROM openjdk:17-jdk-slim

# 设置工作目录
WORKDIR /app

# 创建日志目录
RUN mkdir -p /var/log

# 复制应用 JAR
COPY target/myapp-1.0.0.jar app.jar

# 设置 JVM 参数
ENV JAVA_OPTS="\
-XX:MaxRAMPercentage=75.0 \
-XX:InitialRAMPercentage=75.0 \
-XX:MaxMetaspaceSize=256M \
-Xss512k \
-XX:MaxDirectMemorySize=256M \
-XX:+UseG1GC \
-XX:MaxGCPauseMillis=200 \
-XX:G1HeapRegionSize=8M \
-XX:InitiatingHeapOccupancyPercent=45 \
-XX:+HeapDumpOnOutOfMemoryError \
-XX:HeapDumpPath=/tmp/heapdump.hprof \
-XX:OnOutOfMemoryError='kill -3 %p' \
-Xlog:gc*=info:file=/var/log/gc.log:time,uptime,level,tags:filecount=5,filesize=10M \
-Dcom.sun.management.jmxremote \
-Dcom.sun.management.jmxremote.port=9010 \
-Dcom.sun.management.jmxremote.authenticate=false \
-Dcom.sun.management.jmxremote.ssl=false \
-Djava.rmi.server.hostname=0.0.0.0"

# 暴露端口
EXPOSE 8080 9010

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# 启动应用
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

**Kubernetes Deployment**：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/actuator/prometheus"
    spec:
      containers:
      - name: myapp
        image: myapp:1.0.0
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 9010
          name: jmx
        resources:
          requests:
            memory: "2Gi"
            cpu: "2"
          limits:
            memory: "2Gi"
            cpu: "2"
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        - name: JAVA_OPTS
          value: "-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        volumeMounts:
        - name: logs
          mountPath: /var/log
        - name: tmp
          mountPath: /tmp
      volumes:
      - name: logs
        emptyDir: {}
      - name: tmp
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
  ports:
  - name: http
    port: 80
    targetPort: 8080
  - name: jmx
    port: 9010
    targetPort: 9010
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**配置说明**：

1. **Dockerfile**：
   - 使用轻量级 JDK 镜像
   - 配置完整的 JVM 参数
   - 添加健康检查
   - 暴露应用端口和 JMX 端口

2. **Deployment**：
   - 3 个副本，保证高可用
   - 资源请求和限制设置为 2G 内存、2 CPU
   - 配置存活和就绪探针
   - 挂载日志和临时目录

3. **Service**：
   - 暴露 HTTP 和 JMX 端口
   - 使用 ClusterIP 类型

4. **HPA**：
   - 自动扩缩容
   - CPU 使用率 > 70% 或内存使用率 > 80% 时扩容
   - 最小 3 个副本，最大 10 个副本

</details>

---

## 下一章预告

下一章我们会学习 **JVM 性能调优实战**——也就是真实案例解析、调优方法论、性能优化清单。你会学到如何系统性地分析和解决 JVM 性能问题，掌握从诊断到优化的完整流程。这是 JVM 教程的最后一章，会综合应用前面学到的所有知识。
