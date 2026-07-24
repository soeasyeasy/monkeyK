---
title: "第十六章：系统性能调优"
description: "学习系统性能监控工具、CPU 调优、内存优化以及 I/O 优化技术"
---

# 第十六章：系统性能调优

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

## 本章小结

- 性能监控工具包括 vmstat、mpstat、sar、top、htop 等
- CPU 调优包括调度策略、亲和性、优先级和频率调节
- 内存优化包括 overcommit 策略、页面缓存管理和交换空间管理
- I/O 优化包括磁盘调度算法、预读优化和文件系统优化
- 性能分析工具包括 perf、strace 和 ltrace
- 实战优化包括 Web 服务器、数据库和系统监控
