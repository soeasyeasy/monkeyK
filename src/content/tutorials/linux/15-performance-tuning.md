---
title: "第十五章：性能调优与故障排查"
description: "掌握 Linux 系统性能调优技术，包括 CPU、内存、磁盘、网络优化，以及常见故障的诊断和解决方法"
---

# 第十五章：性能调优与故障排查

## 本章导读

在开始学习性能调优之前，你可能会有这些疑问：

1. **系统变慢了，怎么找出瓶颈在哪里？** 是 CPU 不够用？内存不足？还是磁盘太慢？没有监控数据，只能靠猜。
2. **性能调优是不是很复杂？需要改很多内核参数吗？** 其实大部分性能问题可以通过简单的配置优化解决，不需要深入内核。
3. **系统突然崩溃了，怎么排查原因？** 没有日志、没有监控，只能重启，但问题可能再次发生。
4. **怎么预防性能问题？** 与其等问题发生再救火，不如提前优化和监控。

本章会系统讲解 Linux 性能调优和故障排查的核心技术。学完之后，你就能快速定位性能瓶颈、优化系统配置、排查常见故障。

## 为什么需要性能调优

### 不做性能调优会怎样

想象一下，你开了一家餐厅：

- 厨房太小，厨师施展不开（CPU 瓶颈）
- 餐桌太少，客人排队等位（内存不足）
- 上菜通道太窄，服务员挤在一起（磁盘 IO 慢）
- 门口太窄，客人进不来（网络带宽不足）

结果就是：客人等得不耐烦，差评越来越多，生意越来越差。系统性能问题也是同样的道理。

### 生活化类比：交通拥堵治理

把性能调优想象成治理交通拥堵：

- **监控工具**：交通摄像头，实时查看哪里堵车
- **CPU 优化**：增加车道，让车跑得更快
- **内存优化**：扩大停车场，减少找车位的时间
- **磁盘优化**：拓宽道路，加快物流速度
- **网络优化**：修建高速公路，提高传输速度
- **故障排查**：交警现场指挥，快速处理事故

### 性能调优的核心原则

| 原则 | 说明 | 类比 |
|------|------|------|
| 先监控后优化 | 用数据说话，不要盲目优化 | 先体检再治病 |
| 找到瓶颈 | 优化最慢的环节 | 木桶原理 |
| 逐步优化 | 每次只改一个变量 | 控制变量法 |
| 持续监控 | 优化后验证效果 | 复查疗效 |
| 预防优先 | 提前发现和预防问题 | 定期体检 |

## 核心原理讲解

### 性能分析的 USE 方法

性能分析的核心方法是 **USE 方法**，就像医生检查身体一样系统：

- **U（Utilization）利用率**：资源被使用了多少？（CPU 使用率 80%）
- **S（Saturation）饱和度**：资源排队等了多久？（CPU 等待队列长度 10）
- **E（Errors）错误数**：出了多少错？（网络丢包率 5%）

对每个系统资源（CPU、内存、磁盘、网络），都要检查这三个指标。哪个指标异常，就从哪个方向深入分析。

### Linux 性能模型

Linux 的性能模型可以用一个工厂来类比：

```
┌──────────────────────────────────────────┐
│            应用程序（工人）                 │  ← 干活的
├──────────────────────────────────────────┤
│            CPU（工人的大脑）               │  ← 思考和计算
├──────────────────────────────────────────┤
│            内存（工人的工作台）             │  ← 临时放东西
├──────────────────────────────────────────┤
│            磁盘（仓库）                   │  ← 长期存储
├──────────────────────────────────────────┤
│            网络（运输通道）                │  ← 进出货物
└──────────────────────────────────────────┘
```

性能瓶颈可能出现在任何一层。就像工厂里，如果仓库（磁盘）出货太慢，工人（CPU）就只能干等着，整个工厂的效率就下降了。

### 性能问题分类

| 问题类型 | 表现 | 类比 |
|----------|------|------|
| CPU 瓶颈 | 负载高、响应慢 | 工人太少，活干不完 |
| 内存不足 | OOM、swap 频繁 | 工作台太小，东西放不下 |
| 磁盘 IO 慢 | IO 等待高、读写慢 | 仓库门太窄，出货慢 |
| 网络问题 | 延迟高、丢包 | 运输通道太窄或路况差 |
| 文件描述符耗尽 | Too many open files | 工人的手不够用，拿不了更多东西 |

### 性能调优的核心流程

```
监控采集 → 数据分析 → 定位瓶颈 → 实施优化 → 验证效果
   ↑                                              │
   └──────────── 持续循环 ←────────────────────────┘
```

这就像看病的过程：先做检查（监控），再看报告（分析），找到病因（定位），开药治疗（优化），最后复查（验证）。而且需要定期复查，不能一劳永逸。

## 基础用法

### 系统负载查看

```bash
# ✅ 正确：用 uptime 快速查看系统负载
uptime
# 输出：load average: 0.50, 0.45, 0.40
# 三个值分别是 1 分钟、5 分钟、15 分钟的平均负载
# 如果负载值 > CPU 核心数，说明系统过载

# ❌ 错误：只看一个时间点的负载（应该看趋势）
# 看到 load average: 2.0 就慌了（如果是 8 核 CPU，2.0 其实很正常）

# ✅ 正确：用 top 实时查看 CPU 和内存使用
top
# 关注：us（用户）、sy（系统）、wa（IO 等待）、id（空闲）

# ❌ 错误：只看 CPU 使用率，忽视 IO 等待
# CPU 使用率 50%，但 wa 占 40%，说明瓶颈在磁盘
```

### 内存分析

```bash
# ✅ 正确：用 free -h 查看内存概况
free -h
# 关注 available 列（实际可用内存），而不是 free 列
# Linux 会尽量使用内存做缓存，free 低不代表内存不足

# ❌ 错误：看到 free 很低就认为内存不足
# free 只有 100MB 就慌了（实际上 cached 有 3GB，随时可以释放）

# ✅ 正确：查看占用内存最多的进程
ps aux --sort=-%mem | head -10

# ❌ 错误：手动清理缓存来"释放内存"
sync; echo 3 | sudo tee /proc/sys/vm/drop_caches
# 这会清除所有缓存，导致后续文件访问变慢
```

### 磁盘 IO 分析

```bash
# ✅ 正确：用 iostat 分析磁盘 IO
iostat -x 1 5
# 关注：%util（磁盘使用率）、await（等待时间）
# %util > 90% 说明磁盘饱和，await > 10ms 说明 IO 慢

# ❌ 错误：只看 df -h 就判断磁盘性能
# df 只显示空间使用情况，不反映 IO 性能

# ✅ 正确：用 iotop 找出 IO 密集的进程
sudo iotop

# ❌ 错误：不分析就盲目升级硬件
# 可能是某个进程的 bug 导致 IO 异常，修复代码比换 SSD 更有效
```

### 网络性能分析

```bash
# ✅ 正确：用 ss 查看网络连接状态
ss -tlnp                        # 查看监听端口
ss -s                           # 查看连接统计

# ❌ 错误：用 netstat 而不是 ss
netstat -tlnp                   # netstat 已过时，性能不如 ss

# ✅ 正确：启用 BBR 拥塞控制算法提升网络性能
sudo sysctl -w net.ipv4.tcp_congestion_control=bbr
sudo modprobe tcp_bbr

# ❌ 错误：盲目修改大量内核参数
# 一次改十几个参数，出了问题不知道是哪个导致的
```

### 文件描述符管理

```bash
# ✅ 正确：查看并调整文件描述符限制
ulimit -n                       # 查看当前限制
sudo vim /etc/security/limits.conf
# * soft nofile 65535
# * hard nofile 65535

# ❌ 错误：遇到 "Too many open files" 就重启服务
# 应该找出文件描述符泄漏的根因

# ✅ 正确：用 lsof 查看进程打开的文件
lsof -p PID

# ❌ 错误：不检查就无限增大文件描述符限制
ulimit -n 999999999             # 过大的值可能掩盖程序 bug
```

### 系统调优配置

```bash
# ✅ 正确：逐步调整内核参数，每次只改一个
sudo sysctl -w vm.swappiness=10    # 先改这一个
# 观察效果，确认没有副作用后再改下一个

# ❌ 错误：从网上复制一大段优化配置直接粘贴
# 不知道每个参数的含义，出了问题无法排查

# ✅ 正确：修改前备份配置
sudo cp /etc/sysctl.conf /etc/sysctl.conf.bak

# ❌ 错误：直接修改不备份
sudo vim /etc/sysctl.conf          # 改坏了无法恢复
```

## 性能监控与分析

### CPU 性能分析

**查看 CPU 使用情况**：

```bash
# 查看 CPU 整体使用情况
top

# 查看每个 CPU 核心的使用情况
mpstat -P ALL 1

# 查看 CPU 使用率历史
sar -u 1 5

# 查看 CPU 负载平均值
uptime
# 输出示例：10:30:00 up 10 days,  2:30,  1 user,  load average: 0.50, 0.45, 0.40
# load average: 1分钟、5分钟、15分钟的平均负载

# 查看 CPU 信息
lscpu
cat /proc/cpuinfo
```

**分析 CPU 瓶颈**：

```bash
# 查看占用 CPU 最高的进程
ps aux --sort=-%cpu | head -10

# 查看进程 CPU 使用情况
pidstat -u 1 5

# 查看 CPU 上下文切换
vmstat 1 10
# cs 列表示上下文切换次数，数值过高说明进程切换频繁

# 查看 CPU 中断
cat /proc/interrupts
```

**CPU 性能优化**：

```bash
# 调整 CPU 调度策略
# 查看当前调度器
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor

# 设置为性能模式（提高频率）
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# 绑定进程到特定 CPU 核心（减少上下文切换）
taskset -c 0,1 command    # 在 CPU 0 和 1 上运行
taskset -p 0x3 PID        # 修改进程的 CPU 亲和性
```

### 内存性能分析

**查看内存使用情况**：

```bash
# 查看内存使用情况
free -h

# 查看内存详细信息
cat /proc/meminfo

# 查看进程内存使用
ps aux --sort=-%mem | head -10

# 查看内存使用历史
sar -r 1 5

# 查看 swap 使用情况
swapon --show
cat /proc/swaps
```

**分析内存泄漏**：

```bash
# 查看进程内存详情
pidstat -r 1 5

# 查看 slab 分配器（内核内存）
slabtop

# 查看内存映射
pmap -x PID

# 使用 valgrind 检测内存泄漏（需要安装）
valgrind --leak-check=full ./program
```

**内存优化**：

```bash
# 清理缓存（谨慎使用）
sync; echo 3 | sudo tee /proc/sys/vm/drop_caches
# 1: 清理页面缓存
# 2: 清理目录项和 inode
# 3: 清理所有

# 调整 swappiness（控制 swap 使用倾向）
cat /proc/sys/vm/swappiness
# 0: 尽量避免使用 swap
# 60: 默认值
# 100: 积极使用 swap

# 临时修改
sudo sysctl vm.swappiness=10

# 永久修改
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf

# 调整 OOM 评分（控制 OOM Killer 行为）
cat /proc/PID/oom_score
echo -1000 | sudo tee /proc/PID/oom_score_adj  # 防止被 OOM Killer 杀死
```

### 磁盘 IO 分析

**查看磁盘 IO 情况**：

```bash
# 查看磁盘 IO 统计
iostat -x 1 5

# 输出说明：
# %util: 磁盘使用率（接近 100% 表示饱和）
# await: IO 请求平均等待时间（毫秒）
# svctm: IO 请求平均服务时间（毫秒）
# r/s: 每秒读请求数
# w/s: 每秒写请求数
# rMB/s: 每秒读取 MB 数
# wMB/s: 每秒写入 MB 数

# 查看磁盘使用情况
df -h

# 查看目录大小
du -sh /var/log
du -sh /* | sort -hr | head -10

# 查看大文件
find / -type f -size +100M 2>/dev/null
```

**分析磁盘瓶颈**：

```bash
# 查看 IO 等待的进程
iotop

# 查看进程 IO 统计
pidstat -d 1 5

# 查看文件打开情况
lsof | grep /path/to/mount

# 测试磁盘读写速度
dd if=/dev/zero of=testfile bs=1G count=1 oflag=direct
dd if=testfile of=/dev/null bs=1G count=1 iflag=direct
```

**磁盘 IO 优化**：

```bash
# 调整 IO 调度器
cat /sys/block/sda/queue/scheduler
# 可选：noop, deadline, cfq, bfq

# 设置为 deadline（适合数据库）
echo deadline | sudo tee /sys/block/sda/queue/scheduler

# 调整预读缓冲区
blockdev --setra 8192 /dev/sda    # 设置预读为 8192 扇区

# 挂载选项优化
# noatime: 不更新访问时间
# nodiratime: 不更新目录访问时间
# barrier=0: 禁用写屏障（有电池保护的 RAID）
mount -o remount,noatime,nodiratime /mount/point
```

### 网络性能分析

**查看网络流量**：

```bash
# 查看网络接口统计
cat /proc/net/dev

# 实时监控网络流量
iftop -i eth0

# 查看网络连接状态
ss -s

# 查看 TCP 连接统计
netstat -an | awk '/^tcp/ {++S[$NF]} END {for(a in S) print a, S[a]}'

# 查看网络错误
netstat -i
```

**分析网络瓶颈**：

```bash
# 查看网络延迟
ping -c 10 example.com

# 查看路由路径
traceroute example.com

# 查看 TCP 重传统计
netstat -s | grep -i retrans

# 查看网络带宽使用
sar -n DEV 1 5
```

**网络优化**：

```bash
# 调整 TCP 缓冲区
sudo sysctl -w net.core.rmem_max=16777216
sudo sysctl -w net.core.wmem_max=16777216
sudo sysctl -w net.ipv4.tcp_rmem='4096 87380 16777216'
sudo sysctl -w net.ipv4.tcp_wmem='4096 16384 16777216'

# 启用 TCP 快速打开
sudo sysctl -w net.ipv4.tcp_fastopen=3

# 调整连接队列
sudo sysctl -w net.core.somaxconn=65535
sudo sysctl -w net.ipv4.tcp_max_syn_backlog=65535

# 启用 BBR 拥塞控制算法
sudo sysctl -w net.ipv4.tcp_congestion_control=bbr
sudo modprobe tcp_bbr
```

## 系统调优实战

### 内核参数优化

**sysctl 配置**：

```bash
# 查看当前配置
sysctl -a

# 查看特定参数
sysctl vm.swappiness
sysctl net.ipv4.ip_forward

# 临时修改
sudo sysctl -w vm.swappiness=10

# 永久修改
sudo vim /etc/sysctl.conf

# 常见优化配置：
# 虚拟内存
vm.swappiness=10
vm.dirty_ratio=15
vm.dirty_background_ratio=5

# 文件系统
fs.file-max=2097152
fs.inotify.max_user_watches=524288

# 网络
net.core.somaxconn=65535
net.core.netdev_max_backlog=65535
net.ipv4.tcp_max_syn_backlog=65535
net.ipv4.tcp_fin_timeout=30
net.ipv4.tcp_keepalive_time=1200
net.ipv4.tcp_tw_reuse=1
net.ipv4.ip_local_port_range=1024 65535

# 应用配置
sudo sysctl -p
```

### 文件描述符优化

**查看当前限制**：

```bash
# 查看系统级限制
cat /proc/sys/fs/file-max

# 查看用户级限制
ulimit -n

# 查看所有 ulimit 设置
ulimit -a
```

**修改文件描述符限制**：

```bash
# 临时修改（当前会话）
ulimit -n 65535

# 永久修改用户级限制
sudo vim /etc/security/limits.conf

# 添加以下内容：
* soft nofile 65535
* hard nofile 65535
root soft nofile 65535
root hard nofile 65535

# 修改系统级限制
sudo vim /etc/sysctl.conf
# 添加：fs.file-max=2097152

# 应用配置
sudo sysctl -p

# 验证修改
ulimit -n
```

### 服务性能优化

**Nginx 优化**：

```nginx
# /etc/nginx/nginx.conf

# 工作进程数（通常等于 CPU 核心数）
worker_processes auto;

# 每个进程的最大连接数
events {
    worker_connections 4096;
    use epoll;                    # 使用 epoll 事件模型
    multi_accept on;              # 一次接受多个连接
}

http {
    # 开启高效文件传输
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;

    # 连接超时
    keepalive_timeout 65;
    client_body_timeout 10;
    client_header_timeout 10;

    # 缓冲区
    client_body_buffer_size 10K;
    client_header_buffer_size 1k;
    client_max_body_size 8m;
    large_client_header_buffers 2 1k;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript;
}
```

**MySQL 优化**：

```ini
# /etc/mysql/my.cnf

[mysqld]
# 连接数
max_connections = 500
max_connect_errors = 100000

# 缓冲区
innodb_buffer_pool_size = 2G      # 物理内存的 50-70%
innodb_log_buffer_size = 16M
query_cache_size = 0              # MySQL 8.0 已移除

# 日志
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2  # 性能优先（1 最安全，2 性能更好）

# 线程
innodb_thread_concurrency = 0
thread_cache_size = 8

# 临时表
tmp_table_size = 64M
max_heap_table_size = 64M
```

**Redis 优化**：

```conf
# /etc/redis/redis.conf

# 内存
maxmemory 2gb
maxmemory-policy allkeys-lru      # 内存满时淘汰策略

# 持久化
save ""                           # 禁用 RDB
appendonly yes                    # 启用 AOF
appendfsync everysec              # 每秒同步

# 网络
tcp-backlog 511
timeout 0
tcp-keepalive 300

# 性能
hz 100                            # 事件循环频率
```

## 故障排查实战

### 系统无法启动

**排查步骤**：

```bash
# 1. 查看启动日志
journalctl -xb

# 2. 进入救援模式
# 启动时按 Shift 进入 GRUB
# 选择 rescue mode 或 single user mode

# 3. 检查文件系统
fsck /dev/sda1

# 4. 查看失败的服务
systemctl --failed

# 5. 查看特定服务日志
journalctl -u nginx.service
```

### 磁盘空间满

**排查步骤**：

```bash
# 1. 查看磁盘使用情况
df -h

# 2. 找出占用空间最大的目录
du -sh /* | sort -hr | head -10

# 3. 找出大文件
find / -type f -size +100M -exec ls -lh {} \;

# 4. 查找已删除但未释放的文件（进程仍持有）
lsof | grep deleted

# 5. 清理日志文件
sudo truncate -s 0 /var/log/syslog

# 6. 清理旧内核（Ubuntu）
sudo apt autoremove --purge

# 7. 清理 journal 日志
sudo journalctl --vacuum-size=100M
```

### 内存不足（OOM）

**排查步骤**：

```bash
# 1. 查看 OOM Killer 日志
dmesg | grep -i oom
journalctl -k | grep -i oom

# 2. 查看被杀死的进程
dmesg | grep "Killed process"

# 3. 查看当前内存使用
free -h

# 4. 查看占用内存最多的进程
ps aux --sort=-%mem | head -20

# 5. 查看内存详情
cat /proc/meminfo

# 6. 检查是否有内存泄漏
# 持续监控某个进程的内存增长
watch -n 1 "ps -p PID -o rss,vsz"
```

### 网络不通

**排查步骤**：

```bash
# 1. 检查网络接口状态
ip addr show
ip link show

# 2. 检查 IP 配置
ip route show

# 3. 测试本地网络
ping 127.0.0.1

# 4. 测试网关
ping gateway_ip

# 5. 测试 DNS
ping 8.8.8.8
nslookup example.com

# 6. 测试远程连接
traceroute example.com

# 7. 检查防火墙规则
sudo iptables -L -n
sudo ufw status

# 8. 检查 DNS 配置
cat /etc/resolv.conf
```

### 服务异常

**排查步骤**：

```bash
# 1. 查看服务状态
systemctl status nginx

# 2. 查看服务日志
journalctl -u nginx -f

# 3. 检查端口监听
ss -tlnp | grep 80
netstat -tlnp | grep 80

# 4. 检查进程是否存在
ps aux | grep nginx

# 5. 检查配置文件语法
nginx -t

# 6. 检查文件权限
namei -l /var/www/html

# 7. 重启服务
sudo systemctl restart nginx
```

### CPU 负载过高

**排查步骤**：

```bash
# 1. 查看负载
uptime
w

# 2. 查看占用 CPU 最高的进程
top
# 按 P 排序

# 3. 查看进程详情
ps aux --sort=-%cpu | head -20

# 4. 查看进程树
ps auxf

# 5. 查看进程在做什么
strace -p PID

# 6. 查看进程的线程
top -H -p PID

# 7. 如果是 D 状态（不可中断睡眠）进程过多
# 通常是 IO 等待，检查磁盘
iostat -x 1
```

## 对比表格

### 性能监控工具对比

| 工具 | 监控对象 | 实时性 | 特点 | 适用场景 |
|------|----------|--------|------|----------|
| top | CPU、内存、进程 | 实时 | 系统自带 | 日常监控 |
| htop | CPU、内存、进程 | 实时 | 界面友好 | 日常监控 |
| vmstat | CPU、内存、IO | 定时 | 简洁 | 快速诊断 |
| iostat | CPU、磁盘 IO | 定时 | 磁盘专用 | IO 分析 |
| sar | 全面 | 历史 | 历史记录 | 趋势分析 |
| pidstat | 进程级 | 定时 | 进程详情 | 进程分析 |
| dstat | 全面 | 实时 | 多功能合一 | 综合分析 |

### 常见性能瓶颈与解决方案

| 瓶颈 | 症状 | 诊断工具 | 解决方案 |
|------|------|----------|----------|
| CPU | 负载高、响应慢 | top, mpstat | 优化代码、增加核心、绑定 CPU |
| 内存 | OOM、swap 频繁 | free, vmstat | 增加内存、优化内存使用 |
| 磁盘 IO | IO 等待高、读写慢 | iostat, iotop | 换 SSD、调整调度器、优化 IO |
| 网络 | 延迟高、丢包 | ping, traceroute | 增加带宽、优化 TCP 参数 |
| 文件描述符 | Too many open files | ulimit, lsof | 增大限制、修复 FD 泄漏 |

## 新手常见误区

### 误区 1：盲目优化，没有数据支撑

很多新手看到"优化教程"就照搬，不知道自己系统的瓶颈在哪里。结果优化了半天，性能没提升。正确的做法是：

- 先用监控工具找出瓶颈
- 针对瓶颈进行优化
- 优化后再测量，验证效果

### 误区 2：过度优化内核参数

内核参数默认值已经经过大量测试，适合大多数场景。盲目修改可能导致系统不稳定。正确的做法是：

- 只在有明确问题时调整参数
- 每次只改一个参数
- 记录修改内容，方便回滚

### 误区 3：忽视 IO 等待

CPU 使用率不高，但系统响应很慢，可能是 IO 等待导致的。进程在等待磁盘读写时，CPU 是空闲的，但系统整体性能很差。正确的做法是：

- 关注 iostat 中的 %util 和 await
- 使用 iotop 找出 IO 密集的进程
- 考虑升级存储设备（HDD 换 SSD）

### 误区 4：清理缓存能提升性能

经常看到"清理 Linux 缓存提升性能"的教程。实际上 Linux 的缓存机制是智能的，缓存能加速文件访问。手动清理缓存反而会导致性能下降。正确的做法是：

- 不要手动清理缓存，除非磁盘空间不足
- 理解 Linux 的缓存机制
- 关注实际可用内存，而不是空闲内存

### 误区 5：swappiness 设为 0 就完全不用 swap

swappiness=0 在大多数内核版本中并不意味着完全不用 swap，只是尽可能少用。在某些情况下，系统仍然会使用 swap。正确的做法是：

- 设置为较低的值（如 10）减少 swap 使用
- 如果内存充足，可以考虑关闭 swap
- 监控 swap 使用情况，分析原因

## 动手练习

### 练习 1：基础 - 性能快照收集

**任务**：编写一个脚本，收集系统性能快照，包括 CPU、内存、磁盘、网络使用情况，并保存到文件。

<details>
<summary>点击查看答案</summary>

```bash
#!/bin/bash
# perf_snapshot.sh - 性能快照收集

REPORT="/tmp/perf_snapshot_$(date +%Y%m%d_%H%M%S).txt"

echo "=== 系统性能快照 ===" > "$REPORT"
echo "时间: $(date)" >> "$REPORT"
echo "主机: $(hostname)" >> "$REPORT"
echo "" >> "$REPORT"

# CPU 信息
echo "--- CPU 使用率 ---" >> "$REPORT"
top -bn1 | head -5 >> "$REPORT"
echo "" >> "$REPORT"

# 内存信息
echo "--- 内存使用 ---" >> "$REPORT"
free -h >> "$REPORT"
echo "" >> "$REPORT"

# 磁盘使用
echo "--- 磁盘使用 ---" >> "$REPORT"
df -h >> "$REPORT"
echo "" >> "$REPORT"

# 磁盘 IO
echo "--- 磁盘 IO ---" >> "$REPORT"
iostat -x 1 1 >> "$REPORT" 2>/dev/null || echo "iostat 未安装" >> "$REPORT"
echo "" >> "$REPORT"

# 网络接口
echo "--- 网络接口 ---" >> "$REPORT"
cat /proc/net/dev >> "$REPORT"
echo "" >> "$REPORT"

# 负载
echo "--- 系统负载 ---" >> "$REPORT"
uptime >> "$REPORT"
echo "" >> "$REPORT"

# 占用 CPU 最高的进程
echo "--- CPU 占用 TOP 5 ---" >> "$REPORT"
ps aux --sort=-%cpu | head -6 >> "$REPORT"
echo "" >> "$REPORT"

# 占用内存最高的进程
echo "--- 内存占用 TOP 5 ---" >> "$REPORT"
ps aux --sort=-%mem | head -6 >> "$REPORT"

echo "性能快照已保存到: $REPORT"
```

</details>

### 练习 2：进阶 - 系统调优配置

**任务**：为一台 Web 服务器进行系统调优，包括：
- 优化内核参数（网络、文件描述符）
- 修改文件描述符限制
- 配置 TCP 参数

<details>
<summary>点击查看答案</summary>

```bash
#!/bin/bash
# tune_webserver.sh - Web 服务器调优

# 备份原始配置
cp /etc/sysctl.conf /etc/sysctl.conf.bak

# 内核参数优化
cat >> /etc/sysctl.conf << 'EOF'

# === Web 服务器优化 ===

# 文件描述符
fs.file-max = 2097152

# 网络核心
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 65535
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216

# TCP 优化
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 16384 16777216

# 虚拟内存
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF

# 应用配置
sysctl -p

# 文件描述符限制
cat >> /etc/security/limits.conf << 'EOF'

# Web 服务器优化
* soft nofile 65535
* hard nofile 65535
EOF

echo "调优完成，建议重启系统使所有配置生效"
```

</details>

### 练习 3：挑战 - 性能问题诊断

**任务**：编写一个综合诊断脚本，自动检测以下性能问题并给出建议：
- CPU 负载过高
- 内存不足
- 磁盘空间不足
- 磁盘 IO 瓶颈
- 僵尸进程

<details>
<summary>点击查看答案</summary>

```bash
#!/bin/bash
# perf_diagnose.sh - 性能问题自动诊断

echo "=== 性能问题诊断 ==="
echo "时间: $(date)"
echo ""

ISSUES=0

# 1. 检查 CPU 负载
LOAD_1=$(cat /proc/loadavg | awk '{print $1}')
CPU_NUM=$(nproc)
LOAD_THRESHOLD=$(echo "$CPU_NUM * 2" | bc)

if [ $(echo "$LOAD_1 > $LOAD_THRESHOLD" | bc) -eq 1 ]; then
    echo "[警告] CPU 负载过高: $LOAD_1 (阈值: $LOAD_THRESHOLD)"
    echo "  建议: 检查占用 CPU 最高的进程"
    ps aux --sort=-%cpu | head -6
    ISSUES=$((ISSUES + 1))
else
    echo "[正常] CPU 负载: $LOAD_1"
fi
echo ""

# 2. 检查内存使用
MEM_TOTAL=$(free | grep Mem | awk '{print $2}')
MEM_USED=$(free | grep Mem | awk '{print $3}')
MEM_PERCENT=$((MEM_USED * 100 / MEM_TOTAL))

if [ "$MEM_PERCENT" -gt 90 ]; then
    echo "[警告] 内存使用率过高: ${MEM_PERCENT}%"
    echo "  建议: 检查占用内存最高的进程，考虑增加内存"
    ps aux --sort=-%mem | head -6
    ISSUES=$((ISSUES + 1))
else
    echo "[正常] 内存使用率: ${MEM_PERCENT}%"
fi
echo ""

# 3. 检查磁盘空间
df -h | awk 'NR>1 {print $5 " " $6}' | while read usage mount; do
    percent=${usage%\%}
    if [ "$percent" -gt 85 ]; then
        echo "[警告] 磁盘空间不足: $mount 使用率 ${usage}"
        echo "  建议: 清理大文件或扩容"
        ISSUES=$((ISSUES + 1))
    fi
done
echo ""

# 4. 检查僵尸进程
ZOMBIE=$(ps aux | awk '$8 ~ /Z/ {count++} END {print count+0}')
if [ "$ZOMBIE" -gt 0 ]; then
    echo "[警告] 存在 $ZOMBIE 个僵尸进程"
    echo "  建议: 找到父进程并处理"
    ps aux | awk '$8 ~ /Z/'
    ISSUES=$((ISSUES + 1))
else
    echo "[正常] 无僵尸进程"
fi
echo ""

# 5. 检查 IO 等待
IO_WAIT=$(vmstat 1 2 | tail -1 | awk '{print $16}')
if [ "$IO_WAIT" -gt 20 ]; then
    echo "[警告] IO 等待过高: ${IO_WAIT}%"
    echo "  建议: 检查磁盘 IO 情况，考虑升级存储"
    ISSUES=$((ISSUES + 1))
else
    echo "[正常] IO 等待: ${IO_WAIT}%"
fi
echo ""

# 总结
echo "=== 诊断完成 ==="
if [ "$ISSUES" -eq 0 ]; then
    echo "系统状态良好，未发现明显性能问题"
else
    echo "发现 $ISSUES 个潜在问题，请根据建议处理"
fi
```

</details>

## 下一章预告

下一章我们将进入 **综合实战：搭建 Web 服务器**。把前面学到的日志管理、安全加固、性能调优知识综合运用，从零搭建一个生产级别的 Web 服务器环境，包括 Nginx、PHP、MySQL 的完整配置。
