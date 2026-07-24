---
title: "第十六章：系统性能调优"
description: "学习系统性能监控工具、CPU 调优、内存优化以及 I/O 优化技术"
---

# 第十六章：系统性能调优

## 本章导读

在开始学习系统性能调优之前，你可能会有这些疑问：

1. **为什么要做性能调优？** 系统跑得慢，用户抱怨，服务器扛不住，这些问题怎么解决？
2. **怎么发现性能瓶颈？** CPU 满了？内存不够？磁盘太慢？网络拥堵？怎么知道问题出在哪里？
3. **性能调优难不难？** 听起来很复杂，需要改内核代码吗？其实很多优化只需要调整参数。
4. **有哪些常用的监控工具？** top、vmstat、iostat 这些工具怎么用？怎么看懂它们输出的数据？

本章会带你系统学习性能调优的方法。从监控工具到调优技巧，从 CPU 到内存到 I/O，你会学会如何发现性能问题并解决它们。这是运维工程师的核心技能，也是高级开发者的必备能力。

## 为什么需要性能调优

### 不做调优会怎样

想象一下，你负责一个电商网站，双十一来了：

- 用户打开页面要等 10 秒
- 下单时系统卡住不动
- 数据库查询慢得像蜗牛
- 服务器 CPU 100%，内存快满了

如果不做调优，用户流失、订单丢失、口碑崩坏，公司可能因此损失数百万。

### 生活化类比：性能调优就像给汽车保养

把系统性能调优想象成给汽车做保养：

- **监控工具**：仪表盘（显示速度、油量、温度）
- **CPU 调优**：调整发动机（让动力输出更顺畅）
- **内存优化**：清理后备箱（腾出更多空间装东西）
- **I/O 优化**：升级轮胎和刹车（让加速和减速更快）

你不保养汽车，它就会出问题。同样，你不做系统调优，性能就会越来越差。

### 调优的核心目标

| 目标 | 说明 | 类比 |
|------|------|------|
| 提高响应速度 | 让用户等待时间更短 | 汽车加速更快 |
| 提高吞吐量 | 单位时间处理更多请求 | 汽车跑得更快 |
| 降低资源消耗 | 用更少的 CPU、内存完成任务 | 汽车更省油 |
| 提高稳定性 | 系统不容易崩溃 | 汽车不容易抛锚 |

## 性能监控工具

### 系统监控概述

性能监控是系统调优的基础，通过监控工具可以了解系统的运行状态，发现性能瓶颈。

**监控指标**：
| 指标 | 说明 | 工具 |
| --- | --- | --- |
| CPU 使用率 | CPU 繁忙程度 | top, htop, vmstat |
| 内存使用 | 内存占用情况 | free, vmstat |
| 磁盘 I/O | 磁盘读写性能 | iostat, iotop |
| 网络流量 | 网络带宽使用 | iftop, nethogs |
| 进程状态 | 进程运行情况 | ps, top |

### vmstat：虚拟内存统计

```bash
# 查看系统状态
vmstat

# 输出示例：
# procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
#  r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
#  1  0      0 1234567  23456 789012    0    0    10    20  100  200 10  5 85  0  0

# 每 2 秒刷新一次，共 5 次
vmstat 2 5

# 显示磁盘统计
vmstat -d

# 显示分区统计
vmstat -p /dev/sda1
```

**字段说明**：
- **r**：运行队列中的进程数
- **b**：阻塞等待 I/O 的进程数
- **swpd**：使用的交换空间
- **free**：空闲内存
- **buff**：缓冲区
- **cache**：缓存
- **si**：从交换区读入
- **so**：写入交换区
- **us**：用户 CPU 时间
- **sy**：系统 CPU 时间
- **id**：空闲 CPU 时间
- **wa**：等待 I/O 的 CPU 时间

::: tip
如果 wa（等待 I/O）值很高，说明系统存在 I/O 瓶颈。
:::

### mpstat：多处理器统计

```bash
# 查看所有 CPU 的使用情况
mpstat

# 每 2 秒刷新一次
mpstat 2

# 查看每个 CPU 的情况
mpstat -P ALL

# 输出示例：
# Linux 5.4.0-42-generic (hostname) 	07/24/2026 	_x86_64_	(4 CPU)
# 
# 02:30:00 PM  CPU    %usr   %nice    %sys %iowait    %irq   %soft  %steal  %guest   %idle
# 02:30:02 PM  all   10.00    0.00    5.00    2.00    0.00    1.00    0.00    0.00   82.00
# 02:30:02 PM    0   12.00    0.00    6.00    3.00    0.00    1.00    0.00    0.00   78.00
```

### sar：系统活动报告

```bash
# 查看 CPU 使用情况
sar -u 2 5

# 查看内存使用情况
sar -r 2 5

# 查看 I/O 情况
sar -b 2 5

# 查看网络情况
sar -n DEV 2 5

# 查看历史数据（需要安装 sysstat）
sar -f /var/log/sa/sa24
```

### 进程监控

**top**：实时进程监控

```bash
# 启动 top
top

# 常用操作：
# P：按 CPU 使用率排序
# M：按内存使用率排序
# T：按时间排序
# k：杀死进程
# q：退出
# 1：显示每个 CPU 的情况
```

**htop**：增强版 top

```bash
# 启动 htop（需要安装）
htop

# 特点：
# - 彩色显示
# - 支持鼠标操作
# - 树形显示进程
# - 更友好的界面
```

**ps**：进程快照

```bash
# 查看所有进程
ps aux

# 查看进程树
ps -ejH

# 查看特定进程
ps aux | grep nginx

# 按 CPU 使用率排序
ps aux --sort=-%cpu | head

# 按内存使用率排序
ps aux --sort=-%mem | head

# 查看进程详细信息
ps -p 1234 -f
```

## CPU 调优

### CPU 调度策略

Linux 支持多种 CPU 调度策略：

**完全公平调度器（CFS）**：
- 默认调度策略
- 保证所有进程公平使用 CPU
- 适合大多数场景

**实时调度策略**：
```bash
# 查看进程的调度策略
chrt -p 1234

# 设置实时调度策略
chrt -f -p 50 1234  # FIFO
chrt -r -p 50 1234  # Round Robin

# 优先级范围：0-99（数字越大优先级越高）
```

### CPU 亲和性

将进程绑定到特定的 CPU 核心，减少上下文切换。

```bash
# 查看进程的 CPU 亲和性
taskset -p 1234

# 设置进程只在 CPU 0 和 1 上运行
taskset -p 0x3 1234  # 0x3 = 0011（CPU 0 和 1）

# 启动进程并设置亲和性
taskset -c 0,1 ./program

# 查看 CPU 核心数
nproc
lscpu
```

### 进程优先级

```bash
# 查看进程优先级
ps -l

# nice 值范围：-20 到 19（-20 最高，19 最低）

# 降低进程优先级
nice -n 10 ./program

# 提高进程优先级（需要 root）
nice -n -5 ./program

# 修改运行中进程的优先级
renice -n 5 -p 1234

# 提高优先级（需要 root）
renice -n -5 -p 1234
```

### CPU 频率调节

```bash
# 查看 CPU 频率调节策略
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor

# 可用的策略
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_available_governors

# 设置策略（需要 root）
echo performance | sudo tee /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor

# 常用策略：
# performance：最高性能
# powersave：节能模式
# ondemand：按需调节（默认）
# conservative：保守调节
```

::: info
对于服务器，建议使用 performance 策略以获得最佳性能。对于笔记本电脑，建议使用 ondemand 或 powersave 以延长电池寿命。
:::

## 内存优化

### 内存使用情况分析

```bash
# 查看内存使用情况
free -h

# 输出示例：
#               total        used        free      shared  buff/cache   available
# Mem:           15Gi       8.2Gi       2.1Gi       512Mi       5.2Gi       6.5Gi
# Swap:         2.0Gi       128Mi       1.9Gi

# 详细内存信息
cat /proc/meminfo

# 查看进程内存使用
ps aux --sort=-%mem | head

# 查看特定进程内存
pmap 1234
```

### 内存分配策略

**overcommit 策略**：
```bash
# 查看当前策略
cat /proc/sys/vm/overcommit_memory

# 策略说明：
# 0：启发式 overcommit（默认）
# 1：总是 overcommit
# 2：严格 overcommit

# 设置策略
echo 1 | sudo tee /proc/sys/vm/overcommit_memory

# 查看 overcommit 限制
cat /proc/sys/vm/overcommit_ratio
```

### 页面缓存管理

```bash
# 查看缓存使用情况
cat /proc/sys/vm/vfs_cache_pressure

# 调整缓存压力（默认 100）
# 值越大，越倾向于回收缓存
echo 50 | sudo tee /proc/sys/vm/vfs_cache_pressure

# 手动清理缓存
echo 1 | sudo tee /proc/sys/vm/drop_caches  # 清理页面缓存
echo 2 | sudo tee /proc/sys/vm/drop_caches  # 清理目录项和 inode
echo 3 | sudo tee /proc/sys/vm/drop_caches  # 清理所有
```

::: warning
清理缓存会影响系统性能，因为系统需要重新从磁盘读取数据。只在必要时使用。
:::

### 交换空间管理

```bash
# 查看交换空间
swapon --show

# 查看交换空间使用情况
cat /proc/swaps

# 调整 swappiness（0-100）
cat /proc/sys/vm/swappiness

# swappiness 说明：
# 0：尽量避免使用交换空间
# 60：默认值
# 100：积极使用交换空间

# 设置 swappiness
echo 10 | sudo tee /proc/sys/vm/swappiness

# 永久设置（编辑 /etc/sysctl.conf）
# vm.swappiness=10
```

### 内存映射优化

```bash
# 查看内存映射
cat /proc/1234/maps

# 调整最小保留内存
cat /proc/sys/vm/min_free_kbytes
echo 65536 | sudo tee /proc/sys/vm/min_free_kbytes

# 调整脏页比例
cat /proc/sys/vm/dirty_ratio
echo 10 | sudo tee /proc/sys/vm/dirty_ratio

cat /proc/sys/vm/dirty_background_ratio
echo 5 | sudo tee /proc/sys/vm/dirty_background_ratio
```

## I/O 优化

### 磁盘 I/O 监控

```bash
# 查看磁盘 I/O 统计
iostat

# 每 2 秒刷新一次
iostat 2

# 查看扩展统计
iostat -x

# 输出示例：
# Device            r/s     w/s     rkB/s     wkB/s   rrqm/s   wrqm/s  %util
# sda              10.00   20.00    400.00    800.00    0.00     5.00   15.00

# 字段说明：
# r/s：每秒读请求数
# w/s：每秒写请求数
# rkB/s：每秒读取 KB 数
# wkB/s：每秒写入 KB 数
# %util：设备利用率
```

### I/O 调度算法

```bash
# 查看当前 I/O 调度算法
cat /sys/block/sda/queue/scheduler

# 输出示例：
# [mq-deadline] kyber bfq none

# 设置 I/O 调度算法（需要 root）
echo bfq | sudo tee /sys/block/sda/queue/scheduler

# 常用算法：
# mq-deadline：适合数据库
# bfq：适合桌面系统
# kyber：适合 SSD
# none：无调度（NVMe SSD）
```

### 预读优化

```bash
# 查看预读设置
blockdev --getra /dev/sda

# 设置预读值（扇区数）
sudo blockdev --setra 8192 /dev/sda

# 预读值说明：
# 机械硬盘：建议 8192-16384（4-8MB）
# SSD：建议 2048-4096（1-2MB）
```

### 文件系统优化

**挂载选项优化**：
```bash
# 查看挂载选项
mount | grep sda1

# 优化挂载选项
sudo mount -o remount,noatime,nodiratime /dev/sda1 /mnt

# 常用优化选项：
# noatime：不更新访问时间
# nodiratime：不更新目录访问时间
# data=writeback：写回模式（提高性能）
# barrier=0：禁用屏障（提高性能，降低安全性）
```

**ext4 文件系统优化**：
```bash
# 查看文件系统信息
tune2fs -l /dev/sda1

# 启用 dir_index（目录索引）
tune2fs -O dir_index /dev/sda1

# 调整预留块比例（默认 5%）
tune2fs -m 1 /dev/sda1

# 启用 discard（SSD 优化）
tune2fs -o discard /dev/sda1
```

### 网络 I/O 优化

```bash
# 查看网络缓冲区大小
cat /proc/sys/net/core/rmem_max
cat /proc/sys/net/core/wmem_max

# 调整网络缓冲区
echo 16777216 | sudo tee /proc/sys/net/core/rmem_max
echo 16777216 | sudo tee /proc/sys/net/core/wmem_max

# 调整 TCP 缓冲区
echo 4096 87380 16777216 | sudo tee /proc/sys/net/ipv4/tcp_rmem
echo 4096 65536 16777216 | sudo tee /proc/sys/net/ipv4/tcp_wmem

# 启用 TCP 快速打开
echo 3 | sudo tee /proc/sys/net/ipv4/tcp_fastopen
```

## 性能分析工具

### perf：性能分析工具

```bash
# 安装 perf
sudo apt install linux-tools-common

# 统计系统性能事件
perf stat -a sleep 10

# 分析特定进程
perf stat -p 1234

# 记录性能数据
perf record -g -p 1234

# 查看报告
perf report

# 查看热点函数
perf top
```

### strace：系统调用跟踪

```bash
# 跟踪进程的系统调用
strace -p 1234

# 跟踪程序的启动
strace ./program

# 统计系统调用
strace -c -p 1234

# 跟踪特定系统调用
strace -e trace=read,write -p 1234

# 跟踪文件操作
strace -e trace=file ./program
```

### ltrace：库函数跟踪

```bash
# 跟踪库函数调用
ltrace ./program

# 跟踪特定进程
ltrace -p 1234

# 统计库函数调用
ltrace -c ./program
```

## 性能调优实战

### 示例一：Web 服务器优化

```bash
#!/bin/bash

# Web 服务器性能优化脚本

echo "开始优化 Web 服务器性能..."

# 1. 调整文件描述符限制
echo "* soft nofile 65535" >> /etc/security/limits.conf
echo "* hard nofile 65535" >> /etc/security/limits.conf

# 2. 调整内核参数
cat >> /etc/sysctl.conf << EOF
# 网络优化
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 30

# 内存优化
vm.swappiness = 10
vm.vfs_cache_pressure = 50

# 文件系统优化
fs.file-max = 655350
EOF

# 应用内核参数
sysctl -p

# 3. 优化 Nginx 配置
cat > /etc/nginx/nginx.conf << EOF
worker_processes auto;
worker_connections 65535;
use epoll;
multi_accept on;
sendfile on;
tcp_nopush on;
tcp_nodelay on;
keepalive_timeout 65;
EOF

# 4. 重启 Nginx
systemctl restart nginx

echo "优化完成"
```

### 示例二：数据库性能优化

```bash
#!/bin/bash

# MySQL 性能优化脚本

echo "开始优化 MySQL 性能..."

# 1. 调整内核参数
cat >> /etc/sysctl.conf << EOF
# MySQL 优化
vm.swappiness = 1
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF

sysctl -p

# 2. 优化 MySQL 配置
cat > /etc/mysql/mysql.conf.d/mysqld.cnf << EOF
[mysqld]
# 连接优化
max_connections = 1000
max_connect_errors = 100000

# 缓存优化
innodb_buffer_pool_size = 4G
innodb_log_file_size = 1G
innodb_flush_log_at_trx_commit = 2

# I/O 优化
innodb_io_capacity = 2000
innodb_read_io_threads = 8
innodb_write_io_threads = 8

# 查询优化
query_cache_size = 0
query_cache_type = 0
EOF

# 3. 重启 MySQL
systemctl restart mysql

echo "优化完成"
```

### 示例三：系统性能监控脚本

```bash
#!/bin/bash

# 系统性能监控脚本

LOG_FILE="/var/log/performance_monitor.log"
INTERVAL=60

log_performance() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # CPU 使用率
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}')
    
    # 内存使用率
    local mem_info=$(free | grep Mem)
    local mem_total=$(echo $mem_info | awk '{print $2}')
    local mem_used=$(echo $mem_info | awk '{print $3}')
    local mem_usage=$(echo "scale=2; $mem_used * 100 / $mem_total" | bc)
    
    # 磁盘 I/O
    local io_info=$(iostat | grep sda)
    local io_read=$(echo $io_info | awk '{print $3}')
    local io_write=$(echo $io_info | awk '{print $4}')
    
    # 记录日志
    echo "$timestamp | CPU: ${cpu_usage}% | Memory: ${mem_usage}% | Disk R: ${io_read} KB/s W: ${io_write} KB/s" >> "$LOG_FILE"
    
    # 告警
    if (( $(echo "$cpu_usage > 90" | bc -l) )); then
        echo "警告：CPU 使用率过高！" >> "$LOG_FILE"
    fi
    
    if (( $(echo "$mem_usage > 90" | bc -l) )); then
        echo "警告：内存使用率过高！" >> "$LOG_FILE"
    fi
}

# 持续监控
while true; do
    log_performance
    sleep $INTERVAL
done
```

## 对比表格

| 对比项 | vmstat | mpstat | sar | iostat | top/htop |
|--------|--------|--------|-----|--------|----------|
| 监控对象 | 整体系统 | CPU 各核心 | 历史数据 | 磁盘 I/O | 进程 |
| 实时性 | 实时 | 实时 | 可查历史 | 实时 | 实时 |
| 输出内容 | CPU/内存/IO综合 | CPU 使用率 | 多种报告 | 磁盘读写 | 进程资源占用 |
| 适用场景 | 快速概览 | CPU 瓶颈定位 | 事后分析 | 磁盘瓶颈 | 进程级排查 |
| 是否需安装 | 通常预装 | sysstat 包 | sysstat 包 | sysstat 包 | 通常预装 |

## 新手常见误区

### 误区一：看到 free 内存少就认为内存不足

**错误判断**：
```bash
free -h
# 看到 free 列很小，就认为内存不够用
```

**正确理解**：
```bash
free -h
# 应该看 available 列，而不是 free 列
# available 包含了可以被回收的缓存/缓冲区
```

**为什么错**：Linux 会积极利用空闲内存做缓存（buff/cache），这些内存在需要时可以立即释放。所以 free 列小不代表内存不足，available 才是真正的可用内存指标。

### 误区二：认为 swappiness 设为 0 就完全不用交换空间

**错误做法**：
```bash
echo 0 | sudo tee /proc/sys/vm/swappiness
# 认为这样就不会使用 swap 了
```

**正确理解**：
```bash
# swappiness=0 在内核 3.5+ 表示"尽量避免使用 swap"
# 但在极端情况下（物理内存真的不够），内核仍然会使用 swap
# 如果要完全禁用 swap，应该用 swapoff
sudo swapoff -a
```

**为什么错**：swappiness=0 并不是完全禁用 swap，只是告诉内核尽量不用。在内存压力很大的时候，内核为了保护系统仍然可能使用 swap。

### 误区三：认为清理缓存能提升性能

**错误做法**：
```bash
echo 3 | sudo tee /proc/sys/vm/drop_caches
# 经常清理缓存，认为这样系统会更快
```

**正确理解**：
```bash
# 清理缓存只在特定测试场景下有意义
# 日常运行中，缓存是为了加速数据访问
# 清理缓存反而会降低性能，因为系统需要重新从磁盘读取数据
```

**为什么错**：缓存的存在就是为了加速。你辛辛苦苦缓存了数据，一清理，下次访问又要从慢速磁盘读取，性能反而下降。清理缓存通常只在性能测试时需要，确保测试不受缓存影响。

### 误区四：认为 CPU 使用率高就是性能问题

**错误判断**：
```bash
top
# 看到 CPU 使用率 90%，就认为系统有问题
```

**正确理解**：
```bash
# 需要区分 CPU 使用率的构成：
# us（用户态）高：说明应用在忙，可能是正常的
# sy（内核态）高：说明系统调用多，可能有性能问题
# wa（I/O等待）高：说明 I/O 是瓶颈
# id（空闲）低不代表有问题，说明 CPU 在充分利用
```

**为什么错**：CPU 使用率高不一定有问题。如果大部分是 us（用户态），说明你的应用在认真工作，这是好事。只有当 wa（I/O 等待）很高，或者系统响应明显变慢时，才说明有性能问题。

### 误区五：认为 I/O 调度算法越新越好

**错误做法**：
```bash
# 盲目更换 I/O 调度算法，认为最新的算法一定最好
echo bfq | sudo tee /sys/block/sda/queue/scheduler
```

**正确理解**：
```bash
# 不同设备适合不同的调度算法：
# 机械硬盘：mq-deadline 或 bfq
# SSD：kyber 或 none
# NVMe SSD：none（不需要调度）
# 数据库服务器：mq-deadline（延迟更可控）
```

**为什么错**：不同的硬件和工作负载适合不同的调度算法。盲目更换可能适得其反。比如 NVMe SSD 用 none 最好，因为它本身就能并行处理大量请求，额外的调度反而是负担。

## 动手练习

### 练习一：基础题 - 系统状态分析

**题目**：使用 vmstat 命令观察系统状态，回答以下问题：
1. 当前 CPU 空闲率是多少？
2. 是否有进程在等待 I/O？
3. 是否有内存交换（swap）活动？
4. 根据观察结果，判断系统是否存在性能瓶颈。

<details>
<summary>点击查看答案</summary>

```bash
# 执行 vmstat，每 2 秒刷新，共 5 次
vmstat 2 5

# 输出示例：
# procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
#  r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
#  1  0      0 1234567  23456 789012    0    0    10    20  100  200 10  5 85  0  0

# 分析：
# 1. CPU 空闲率：id 列 = 85%，空闲率较高
# 2. I/O 等待：b 列 = 0，wa 列 = 0，没有进程在等待 I/O
# 3. 交换活动：si = 0, so = 0，没有 swap 活动
# 4. 结论：系统当前没有明显的性能瓶颈，CPU 和 I/O 都比较空闲
```

**判断标准**：
- r 列 > CPU 核心数：CPU 可能过载
- b 列 > 0：有 I/O 等待
- wa > 20%：I/O 瓶颈
- si/so > 0：内存不足，在使用 swap
- us + sy > 80%：CPU 繁忙

</details>

### 练习二：进阶题 - 进程性能分析

**题目**：使用 ps 和 top 命令找出系统中 CPU 和内存占用最高的 5 个进程，并分析是否存在异常。

<details>
<summary>点击查看答案</summary>

```bash
# 找出 CPU 占用最高的 5 个进程
ps aux --sort=-%cpu | head -6
# 输出示例：
# USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
# root         1  5.2  1.3 169344 13568 ?        Ss   Jul23  12:34 /sbin/init
# mysql     1234  3.8 15.2 1234567 156789 ?      Sl   Jul23   8:45 /usr/sbin/mysqld
# nginx     5678  2.1  0.5  45678  5678 ?        S    Jul23   5:23 nginx: worker process
# ...

# 找出内存占用最高的 5 个进程
ps aux --sort=-%mem | head -6
# 输出示例：
# USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
# mysql     1234  3.8 15.2 1234567 156789 ?      Sl   Jul23   8:45 /usr/sbin/mysqld
# java      2345  1.5 12.3 2345678 123456 ?      Sl   Jul23   4:56 java -jar app.jar
# ...

# 使用 top 实时监控（按 P 按 CPU 排序，按 M 按内存排序）
top

# 分析是否存在异常：
# 1. 某个进程 CPU 占用持续 > 80%：可能死循环或计算密集型任务
# 2. 某个进程内存持续增长：可能存在内存泄漏
# 3. 大量僵尸进程（状态为 Z）：父进程没有正确回收子进程
```

</details>

### 练习三：挑战题 - 编写性能监控脚本

**题目**：编写一个性能监控脚本，要求：
1. 每 30 秒采集一次系统状态
2. 记录 CPU 使用率、内存使用率、磁盘 I/O
3. 当 CPU 使用率超过 80% 或内存使用率超过 90% 时，输出告警信息
4. 将数据记录到日志文件中

<details>
<summary>点击查看答案</summary>

```bash
#!/bin/bash

# 系统性能监控脚本

LOG_FILE="/var/log/perf_monitor.log"
INTERVAL=30
CPU_THRESHOLD=80
MEM_THRESHOLD=90

# 日志函数
log_msg() {
    local msg="$(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo "$msg"
    echo "$msg" >> "$LOG_FILE"
}

# 采集并分析性能数据
collect_metrics() {
    # CPU 使用率（取 idle 的补数）
    local cpu_idle=$(vmstat 1 2 | tail -1 | awk '{print $15}')
    local cpu_usage=$((100 - cpu_idle))

    # 内存使用率
    local mem_total=$(free | awk '/Mem:/{print $2}')
    local mem_used=$(free | awk '/Mem:/{print $3}')
    local mem_usage=$((mem_used * 100 / mem_total))

    # 磁盘 I/O（取 sda 的读写速率）
    local io_info=$(iostat -d sda 1 2 | tail -1)
    local io_read=$(echo "$io_info" | awk '{print $3}')
    local io_write=$(echo "$io_info" | awk '{print $4}')

    # 记录数据
    log_msg "CPU: ${cpu_usage}% | Memory: ${mem_usage}% | Disk R: ${io_read} KB/s W: ${io_write} KB/s"

    # 告警检查
    if [ "$cpu_usage" -gt "$CPU_THRESHOLD" ]; then
        log_msg "[告警] CPU 使用率 ${cpu_usage}% 超过阈值 ${CPU_THRESHOLD}%"
        # 记录 CPU 最高的进程
        log_msg "  最高进程：$(ps aux --sort=-%cpu | head -2 | tail -1 | awk '{print $11, $3"%"}')"
    fi

    if [ "$mem_usage" -gt "$MEM_THRESHOLD" ]; then
        log_msg "[告警] 内存使用率 ${mem_usage}% 超过阈值 ${MEM_THRESHOLD}%"
        # 记录内存最高的进程
        log_msg "  最高进程：$(ps aux --sort=-%mem | head -2 | tail -1 | awk '{print $11, $4"%"}')"
    fi
}

# 主循环
log_msg "===== 性能监控启动 ====="
log_msg "采集间隔：${INTERVAL}秒"
log_msg "CPU 告警阈值：${CPU_THRESHOLD}%"
log_msg "内存告警阈值：${MEM_THRESHOLD}%"

while true; do
    collect_metrics
    sleep "$INTERVAL"
done
```

**使用方法**：
```bash
# 赋予执行权限
chmod +x perf_monitor.sh

# 后台运行
sudo ./perf_monitor.sh &

# 查看日志
tail -f /var/log/perf_monitor.log
```

</details>

## 教程总结与学习建议

恭喜你完成了整个操作系统教程的学习！这是最后一章，让我们来回顾一下你学到了什么，以及接下来可以怎么做。

### 知识体系回顾

```
操作系统知识体系：
┌─────────────────────────────────────────┐
│  基础概念（第1-2章）                      │
│  操作系统概述、结构与运行环境              │
├─────────────────────────────────────────┤
│  进程管理（第3-6章）                      │
│  进程、线程、同步、调度                    │
├─────────────────────────────────────────┤
│  内存管理（第7-10章）                     │
│  死锁、同步问题、内存管理、虚拟内存        │
├─────────────────────────────────────────┤
│  文件系统（第11-13章）                    │
│  文件系统基础、实现、I/O 系统             │
├─────────────────────────────────────────┤
│  实践技能（第14-16章）                    │
│  Linux 命令、Shell 脚本、性能调优         │
└─────────────────────────────────────────┘
```

### 学习建议

**1. 动手实践比死记硬背更重要**

操作系统是一门实践性很强的学科。不要只是看书，要动手操作：

- 在 Linux 虚拟机或 WSL 中练习命令
- 编写 Shell 脚本解决实际问题
- 使用监控工具观察系统运行状态

**2. 重点掌握核心概念**

以下概念在面试和实际工作中都很重要：

- 进程与线程的区别
- 死锁的四个必要条件
- 虚拟内存和页面置换算法
- I/O 控制方式（DMA、中断）
- 文件系统的基本原理

**3. 推荐进阶方向**

| 方向 | 推荐内容 | 适合人群 |
|------|----------|----------|
| 内核开发 | 阅读 Linux 内核源码 | 想深入理解 OS 的人 |
| 系统编程 | Linux 系统编程（APUE） | 想写高性能程序的人 |
| 运维开发 | Docker、Kubernetes | 想做 DevOps 的人 |
| 嵌入式 | RTOS、嵌入式 Linux | 想做嵌入式开发的人 |

**4. 推荐学习资源**

- 《现代操作系统》（Tanenbaum）：经典教材，理论扎实
- 《操作系统导论》（OSTEP）：免费在线教材，通俗易懂
- 《鸟哥的 Linux 私房菜》：Linux 实践的最佳参考
- 《UNIX 环境高级编程》（APUE）：系统编程的圣经

### 结语

操作系统是计算机科学的基石。理解了操作系统，你就能理解程序是怎么运行的，资源是怎么管理的，性能是怎么优化的。这些知识不会过时，因为它们是所有上层技术的基础。

希望这个教程能帮你建立起操作系统的知识框架。学习是一个持续的过程，保持好奇心，多动手实践，你一定能成为更优秀的开发者。

## 本章小结

- 性能监控工具包括 vmstat、mpstat、sar、top、htop 等
- CPU 调优包括调度策略、亲和性、优先级和频率调节
- 内存优化包括 overcommit 策略、页面缓存管理和交换空间管理
- I/O 优化包括磁盘调度算法、预读优化和文件系统优化
- 性能分析工具包括 perf、strace 和 ltrace
- 实战优化包括 Web 服务器、数据库和系统监控
