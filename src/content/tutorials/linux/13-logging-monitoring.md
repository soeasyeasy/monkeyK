---
title: "第十三章：日志管理与系统监控"
description: "掌握 Linux 系统的日志管理和监控技术，包括日志查看、分析、系统资源监控以及自动化告警"
---

# 第十三章：日志管理与系统监控

## 本章导读

在开始学习日志管理和系统监控之前，你可能会有这些疑问：

1. **系统日志到底是什么？为什么要看日志？** 日志就像系统的"日记本"，记录了系统运行过程中发生的一切。出了问题，第一反应就是看日志。
2. **日志文件那么多，我该看哪个？** `/var/log` 目录下有几十个文件，每个文件记录不同类型的信息，初学者很容易迷失。
3. **系统监控有什么用？怎么看 CPU、内存使用情况？** 系统卡顿时，你需要知道是哪个进程占用了资源，这就需要监控工具。
4. **怎么自动化监控和告警？** 手动看日志太累了，能不能让系统自动发现问题并通知我？

本章会系统讲解 Linux 的日志管理和监控技术。学完之后，你就能快速定位问题、监控系统状态，甚至搭建自动化监控告警系统。

## 为什么需要日志管理与系统监控

### 没有日志和监控会怎样

想象一下，你运营着一个电商网站，突然有一天用户反馈说"页面打不开了"。如果没有日志和监控，你会：

- 不知道问题出在哪里（数据库？网络？应用？）
- 不知道问题是什么时候开始的
- 不知道影响了多少用户
- 只能盲目猜测，逐个排查

这就像医生看病没有病历、没有检查仪器，只能靠猜，效率极低。

### 生活化类比：医院的病历系统

把日志管理想象成医院的病历系统：

- **日志文件**：病人的病历本，记录了每次就诊的情况
- **日志级别**：病情的严重程度（感冒、骨折、心脏病）
- **日志轮转**：病历本满了就换新的，旧的存档
- **监控工具**：护士站的监护仪，实时显示病人的心跳、血压
- **告警系统**：当指标异常时，护士会立刻通知医生

有了病历和监护仪，医生才能快速诊断病情。同样，有了日志和监控，运维人员才能快速定位和解决问题。

### 日志与监控的核心作用

| 作用 | 说明 | 类比 |
|------|------|------|
| 问题定位 | 快速找到问题根源 | 医生看病历找病因 |
| 性能分析 | 发现系统瓶颈 | 体检发现健康隐患 |
| 安全审计 | 追踪异常行为 | 监控摄像头抓小偷 |
| 容量规划 | 预测资源需求 | 根据客流预测备货量 |
| 合规要求 | 满足法规要求 | 财务账本必须保存 N 年 |

## 核心原理讲解

### Linux 日志系统的工作原理

Linux 日志系统就像一个大公司的档案管理系统：

- **应用程序**：各部门产生的文件（日志消息的来源）
- **日志库（syslog/journald）**：档案管理员，负责收集、分类、存档
- **日志文件**：档案柜里的文件夹，按类型分门别类
- **日志轮转**：档案柜满了，旧档案搬到仓库，腾出空间放新档案

当一个程序想要记录日志时，它会调用 syslog 接口发送消息。日志守护进程（syslog 或 journald）收到消息后，根据消息的类型和级别，决定把它存到哪个文件里。

### 日志级别体系

Linux 日志系统使用 8 个级别来表示消息的严重程度：

```
级别 0: EMERG   - 系统不可用（最严重）
级别 1: ALERT   - 必须立即处理
级别 2: CRIT    - 严重错误
级别 3: ERR     - 一般错误
级别 4: WARNING - 警告信息
级别 5: NOTICE  - 正常但值得注意
级别 6: INFO    - 信息消息（默认级别）
级别 7: DEBUG   - 调试信息（最详细）
```

生产环境通常只记录 WARNING（4）及以上级别，避免日志量过大。

### 日志系统架构图

```
┌──────────────────────────────────────────┐
│            应用程序（Nginx、MySQL 等）      │  ← 产生日志
├──────────────────────────────────────────┤
│            日志库（syslog API）             │  ← 发送日志消息
├──────────────────────────────────────────┤
│            日志守护进程（journald/syslog）   │  ← 收集、分类、存储
├──────────────────────────────────────────┤
│            日志文件（/var/log/）            │  ← 持久化存储
│  syslog  auth.log  kern.log  nginx/      │
├──────────────────────────────────────────┤
│            日志轮转（logrotate）            │  ← 定期清理、压缩
└──────────────────────────────────────────┘
```

### 监控的核心原理

系统监控的核心是 **采集 → 分析 → 告警** 循环：

1. **采集**：通过 /proc、/sys 等虚拟文件系统获取系统指标
2. **分析**：对比阈值或历史数据，判断是否异常
3. **告警**：异常时通知管理员，及时处理

这就像体检 → 看报告 → 治病的过程。先做检查（采集数据），再分析结果（对比阈值），最后对症下药（处理问题）。

## 基础用法

### 日志查看快速参考

```bash
# ✅ 正确：实时跟踪系统日志，排查问题
tail -f /var/log/syslog

# ❌ 错误：用 cat 查看巨大的日志文件（会卡住终端）
cat /var/log/syslog

# ✅ 正确：用 grep 搜索特定错误
grep "error" /var/log/syslog

# ❌ 错误：不带任何筛选条件直接看日志（信息太多找不到重点）
less /var/log/syslog

# ✅ 正确：按时间范围查看 journald 日志
journalctl --since "1 hour ago" --until "now"

# ❌ 错误：不加时间范围查看全部日志（可能有好几天的数据）
journalctl
```

### 日志搜索与分析

```bash
# ✅ 正确：统计失败登录的 IP，找出攻击来源
grep "Failed password" /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -nr

# ❌ 错误：逐行翻看认证日志找异常（效率极低）
cat /var/log/auth.log

# ✅ 正确：组合多个条件精确搜索
grep -E "error|critical" /var/log/syslog | grep "2024-01-15"

# ❌ 错误：只用一个关键词搜索（可能漏掉重要信息）
grep "error" /var/log/syslog
```

### 日志轮转配置

```bash
# ✅ 正确：为自定义应用配置日志轮转
sudo vim /etc/logrotate.d/myapp
# /var/log/myapp/*.log {
#     daily           # 每天轮转
#     rotate 7        # 保留 7 天
#     compress        # 压缩旧日志
#     missingok       # 文件不存在不报错
#     notifempty      # 空文件不轮转
# }

# ❌ 错误：不配置日志轮转（日志会无限增长，最终占满磁盘）
# 什么都不做，放任日志增长
```

### 监控命令速查

```bash
# ✅ 正确：用 top 快速查看系统整体状况
top

# ✅ 正确：用 vmstat 查看 CPU 和内存概况
vmstat 1 5

# ✅ 正确：用 iostat 查看磁盘 IO 状况
iostat -x 1 5

# ✅ 正确：用 ss 查看网络连接（比 netstat 更快）
ss -tlnp

# ❌ 错误：用 netstat 而不是 ss（netstat 已过时，性能较差）
netstat -tlnp
```

### 自动化监控

```bash
# ✅ 正确：用 cron 定时执行监控脚本
crontab -e
# */5 * * * * /path/to/monitor.sh

# ✅ 正确：用 systemd timer 管理服务监控
sudo systemctl enable monitor.timer
sudo systemctl start monitor.timer

# ❌ 错误：手动执行监控命令（无法持续监控，容易遗漏）
# 每天手动运行 top 看一眼
```

## 日志管理基础

### Linux 日志目录结构

Linux 系统的日志文件主要存放在 `/var/log/` 目录下：

```bash
# 查看日志目录内容
ls -la /var/log/

# 常见日志文件说明：
# /var/log/syslog      - 系统日志（Debian/Ubuntu）
# /var/log/messages    - 系统消息（CentOS/RHEL）
# /var/log/auth.log    - 认证日志（登录、sudo 等）
# /var/log/kern.log    - 内核日志
# /var/log/dmesg       - 启动日志
# /var/log/boot.log    - 启动过程日志
# /var/log/apt/        - 软件包管理日志
```

### 查看日志的命令

**tail**：查看日志末尾内容（最常用）

```bash
# 查看最后 10 行
tail /var/log/syslog

# 查看最后 50 行
tail -n 50 /var/log/syslog

# 实时跟踪日志（-f 表示 follow）
tail -f /var/log/syslog

# 实时跟踪多个文件
tail -f /var/log/syslog /var/log/auth.log
```

**head**：查看日志开头内容

```bash
# 查看前 10 行
head /var/log/syslog

# 查看前 20 行
head -n 20 /var/log/syslog
```

**cat**：查看整个文件（小文件适用）

```bash
# 显示全部内容
cat /var/log/boot.log

# 显示行号
cat -n /var/log/boot.log
```

**less**：分页查看（大文件适用）

```bash
# 分页查看，支持上下翻页
less /var/log/syslog

# 在 less 中搜索关键词（按 / 然后输入关键词）
# /error
# 按 n 查找下一个，按 N 查找上一个
```

**grep**：搜索日志内容

```bash
# 搜索包含 "error" 的行
grep "error" /var/log/syslog

# 忽略大小写
grep -i "error" /var/log/syslog

# 显示行号
grep -n "error" /var/log/syslog

# 搜索多个关键词（OR 关系）
grep -E "error|warning|critical" /var/log/syslog

# 反向搜索（不包含关键词的行）
grep -v "info" /var/log/syslog

# 递归搜索目录下所有日志
grep -r "error" /var/log/
```

### 日志轮转（logrotate）

日志文件会不断增长，如果不加管理，会占满磁盘空间。logrotate 工具可以自动轮转、压缩、删除旧日志。

**logrotate 配置文件**：`/etc/logrotate.conf`

```bash
# 查看 logrotate 主配置
cat /etc/logrotate.conf

# 典型配置内容：
# weekly          - 每周轮转一次
# rotate 4        - 保留 4 个历史文件
# compress        - 压缩旧日志
# delaycompress   - 延迟一次压缩
# missingok       - 文件不存在不报错
# notifempty      - 空文件不轮转
```

**自定义日志轮转配置**：

```bash
# 创建自定义配置
sudo vim /etc/logrotate.d/myapp

# 配置内容示例：
/var/log/myapp/*.log {
    daily           # 每天轮转
    rotate 7        # 保留 7 天
    compress        # 压缩
    delaycompress   # 延迟压缩
    missingok       # 文件不存在不报错
    notifempty      # 空文件不轮转
    create 0640 www-data www-data  # 新文件权限和所有者
    sharedscripts   # 所有文件轮转后只执行一次脚本
    postrotate      # 轮转后执行的脚本
        /usr/bin/systemctl reload myapp > /dev/null 2>&1 || true
    endscript
}
```

**手动测试 logrotate**：

```bash
# 调试模式（不实际执行）
sudo logrotate -d /etc/logrotate.d/myapp

# 强制执行（不管是否到期）
sudo logrotate -f /etc/logrotate.d/myapp
```

## journald 与现代日志管理

### systemd-journald 简介

现代 Linux 发行版（使用 systemd）使用 `journald` 守护进程收集和管理日志。所有日志以二进制格式存储在 `/var/log/journal/` 目录下。

**journalctl**：查看 journald 日志的核心命令

```bash
# 查看所有日志
journalctl

# 查看本次启动的日志
journalctl -b

# 查看上次启动的日志
journalctl -b -1

# 实时跟踪日志（类似 tail -f）
journalctl -f

# 按时间筛选
journalctl --since "2024-01-01 10:00:00" --until "2024-01-01 11:00:00"

# 按时间范围（相对时间）
journalctl --since "1 hour ago"
journalctl --since "yesterday"
journalctl --since "today"

# 按服务筛选
journalctl -u nginx.service
journalctl -u ssh.service

# 按优先级筛选（0-7，0 最严重）
# 0: emerg, 1: alert, 2: crit, 3: err, 4: warning, 5: notice, 6: info, 7: debug
journalctl -p err
journalctl -p warning..err

# 按进程 ID 筛选
journalctl _PID=1234

# 按用户筛选
journalctl _UID=1000

# 查看磁盘占用
journalctl --disk-usage

# 清理旧日志（保留 7 天）
sudo journalctl --vacuum-time=7d

# 清理日志（限制大小 500M）
sudo journalctl --vacuum-size=500M
```

### journald 配置

**配置文件**：`/etc/systemd/journald.conf`

```bash
# 查看配置
sudo vim /etc/systemd/journald.conf

# 常见配置项：
[Journal]
Storage=persistent          # 持久化存储（volatile 仅内存）
Compress=yes                # 压缩日志
SystemMaxUse=1G             # 最大占用空间
SystemKeepFree=100M         # 至少保留可用空间
SystemMaxFileSize=100M      # 单个文件最大大小
MaxRetentionSec=7day        # 最大保留时间
ForwardToSyslog=no          # 是否转发到 syslog
```

**重启 journald 使配置生效**：

```bash
sudo systemctl restart systemd-journald
```

## 系统监控工具

### 实时监控系统资源

**top**：动态显示系统资源使用情况

```bash
# 启动 top
top

# top 界面说明：
# 第 1 行：系统时间、运行时间、负载平均值
# 第 2 行：进程总数、运行中、休眠、停止、僵尸进程数
# 第 3 行：CPU 使用情况（us 用户, sy 系统, ni nice, id 空闲, wa IO 等待）
# 第 4 行：内存使用情况
# 第 5 行：交换空间使用情况
# 下方：进程列表

# top 交互命令（在 top 运行时按）：
# q - 退出
# h - 帮助
# M - 按内存排序
# P - 按 CPU 排序
# k - 杀死进程（输入 PID）
# r - 修改进程优先级（输入 PID 和 nice 值）
# 1 - 显示每个 CPU 核心的使用情况
```

**htop**：top 的增强版（需要安装）

```bash
# 安装 htop（Ubuntu/Debian）
sudo apt install htop

# 安装 htop（CentOS/RHEL）
sudo yum install htop

# 启动 htop
htop

# htop 优势：
# - 彩色显示
# - 支持鼠标操作
# - 可以横向滚动
# - 树状显示进程
# - 更直观的界面
```

**vmstat**：查看虚拟内存统计

```bash
# 查看一次
vmstat

# 每秒刷新一次，共 10 次
vmstat 1 10

# 输出说明：
# r: 运行队列中的进程数
# b: 阻塞的进程数（等待 IO）
# swpd: 使用的交换空间
# free: 空闲内存
# buff: 缓冲区
# cache: 缓存
# si: 从交换区读入
# so: 写入交换区
# bi: 从块设备读入
# bo: 写入块设备
# in: 中断次数
# cs: 上下文切换次数
# us: 用户 CPU 时间
# sy: 系统 CPU 时间
# id: 空闲时间
# wa: IO 等待时间
```

**iostat**：查看 CPU 和磁盘 IO 统计

```bash
# 安装 sysstat 包（包含 iostat）
sudo apt install sysstat

# 查看 CPU 和磁盘统计
iostat

# 每秒刷新一次
iostat 1

# 只显示 CPU 统计
iostat -c

# 只显示磁盘统计
iostat -d

# 显示详细统计
iostat -x

# 显示设备名称（而不是 dm-X）
iostat -N
```

### 网络监控

**netstat**：查看网络连接、路由表、接口统计

```bash
# 查看所有网络连接
netstat -a

# 查看监听端口
netstat -l

# 查看 TCP 连接
netstat -t

# 查看 UDP 连接
netstat -u

# 显示数字地址（不解析域名）
netstat -n

# 显示进程信息
netstat -p

# 查看路由表
netstat -r

# 查看接口统计
netstat -i

# 常用组合：查看所有 TCP 监听端口及进程
netstat -lntp
```

**ss**：netstat 的现代替代品（更快）

```bash
# 查看所有 TCP 连接
ss -t -a

# 查看所有 UDP 连接
ss -u -a

# 查看监听端口
ss -l

# 显示进程信息
ss -p

# 查看 socket 统计
ss -s

# 按状态筛选
ss state established

# 按端口筛选
ss dport = :22
ss sport = :80
```

**iftop**：实时监控网络流量（按连接）

```bash
# 安装 iftop
sudo apt install iftop

# 监控默认网卡
sudo iftop

# 监控指定网卡
sudo iftop -i eth0

# 不显示 DNS 解析
sudo iftop -n

# 不显示端口服务名
sudo iftop -N
```

### 进程监控

**ps**：查看进程快照

```bash
# 查看所有进程（BSD 风格）
ps aux

# 输出说明：
# USER: 进程所有者
# PID: 进程 ID
# %CPU: CPU 使用率
# %MEM: 内存使用率
# VSZ: 虚拟内存大小
# RSS: 实际内存大小
# TTY: 终端
# STAT: 状态（R 运行, S 休眠, Z 僵尸, T 停止）
# START: 启动时间
# TIME: 累计 CPU 时间
# COMMAND: 命令

# 查看所有进程（System V 风格）
ps -ef

# 查看指定用户的进程
ps -u username

# 查看指定 PID 的进程
ps -p 1234

# 按 CPU 使用率排序
ps aux --sort=-%cpu

# 按内存使用率排序
ps aux --sort=-%mem

# 树状显示进程
ps auxf
```

**pgrep**：按名称查找进程

```bash
# 查找 nginx 进程
pgrep nginx

# 显示详细信息
pgrep -a nginx

# 查找指定用户的进程
pgrep -u username nginx

# 查找父进程 ID
pgrep -P 1 nginx
```

**lsof**：列出打开的文件和进程

```bash
# 查看所有打开的文件
lsof

# 查看指定进程打开的文件
lsof -p 1234

# 查看指定用户打开的文件
lsof -u username

# 查看谁在使用某个文件
lsof /var/log/syslog

# 查看监听端口的进程
lsof -i :80
lsof -i :443

# 查看所有网络连接
lsof -i

# 查看指定协议的连接
lsof -i TCP
lsof -i UDP
```

## 日志分析实战

### 分析认证日志（安全审计）

```bash
# 查看失败的登录尝试
grep "Failed password" /var/log/auth.log

# 统计失败登录的 IP 地址
grep "Failed password" /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -nr

# 查看成功的登录
grep "Accepted password" /var/log/auth.log

# 查看 sudo 使用情况
grep "sudo:" /var/log/auth.log

# 查看 SSH 登录尝试
grep "sshd" /var/log/auth.log
```

### 分析系统日志

```bash
# 查看系统错误
grep -i "error" /var/log/syslog

# 查看内核错误
grep -i "error" /var/log/kern.log

# 查看硬件相关问题
grep -i "hardware" /var/log/syslog

# 查看 OOM（内存不足）事件
grep -i "oom" /var/log/kern.log

# 查看磁盘相关问题
grep -i "disk\|sda\|sdb" /var/log/syslog
```

### 分析 Web 服务器日志

```bash
# 查看 Nginx 访问日志
tail -f /var/log/nginx/access.log

# 统计访问最多的 IP
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr

# 统计 HTTP 状态码
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -nr

# 查看 404 错误
awk '$9 == 404' /var/log/nginx/access.log

# 查看 500 错误
awk '$9 == 500' /var/log/nginx/access.log

# 统计请求最多的 URL
awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -20

# 查看特定时间段的访问
awk '$4 > "[01/Jan/2024:10:00:00" && $4 < "[01/Jan/2024:11:00:00"' /var/log/nginx/access.log
```

## 自动化监控与告警

### 使用 Shell 脚本监控

**CPU 使用率监控脚本**：

```bash
#!/bin/bash
# cpu_monitor.sh - CPU 使用率监控

# 设置阈值
THRESHOLD=80

# 获取 CPU 使用率（空闲率的补数）
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print 100 - $8}')

# 转换为整数
CPU_USAGE_INT=${CPU_USAGE%.*}

# 检查是否超过阈值
if [ "$CPU_USAGE_INT" -gt "$THRESHOLD" ]; then
    echo "警告: CPU 使用率过高 - ${CPU_USAGE}%"
    echo "时间: $(date)"
    echo "主机: $(hostname)"
    
    # 发送告警邮件（需要配置 mail 命令）
    echo "CPU 使用率过高: ${CPU_USAGE}%" | mail -s "CPU 告警" admin@example.com
    
    # 记录到日志
    echo "$(date) - CPU 使用率过高: ${CPU_USAGE}%" >> /var/log/cpu_monitor.log
fi
```

**内存使用率监控脚本**：

```bash
#!/bin/bash
# memory_monitor.sh - 内存使用率监控

# 设置阈值
THRESHOLD=90

# 获取内存使用情况
MEM_INFO=$(free | grep Mem)
TOTAL=$(echo $MEM_INFO | awk '{print $2}')
USED=$(echo $MEM_INFO | awk '{print $3}')

# 计算使用率
USAGE_PERCENT=$((USED * 100 / TOTAL))

# 检查是否超过阈值
if [ "$USAGE_PERCENT" -gt "$THRESHOLD" ]; then
    echo "警告: 内存使用率过高 - ${USAGE_PERCENT}%"
    echo "时间: $(date)"
    echo "主机: $(hostname)"
    
    # 显示内存使用前 10 的进程
    echo "内存使用前 10 的进程:"
    ps aux --sort=-%mem | head -11
    
    # 发送告警
    echo "内存使用率过高: ${USAGE_PERCENT}%" | mail -s "内存告警" admin@example.com
fi
```

**磁盘空间监控脚本**：

```bash
#!/bin/bash
# disk_monitor.sh - 磁盘空间监控

# 设置阈值
THRESHOLD=90

# 获取所有挂载点的使用率
df -h | awk 'NR>1 {print $5 " " $6}' | while read usage mount; do
    # 去掉百分号
    percent=${usage%\%}
    
    # 检查是否超过阈值
    if [ "$percent" -gt "$THRESHOLD" ]; then
        echo "警告: 磁盘空间不足 - $mount 使用率 ${usage}"
        echo "时间: $(date)"
        echo "主机: $(hostname)"
        
        # 发送告警
        echo "磁盘空间不足: $mount 使用率 ${usage}" | mail -s "磁盘告警" admin@example.com
    fi
done
```

### 使用 cron 定时执行监控

```bash
# 编辑 crontab
crontab -e

# 添加定时任务
# 每 5 分钟检查一次 CPU
*/5 * * * * /path/to/cpu_monitor.sh

# 每 10 分钟检查一次内存
*/10 * * * * /path/to/memory_monitor.sh

# 每小时检查一次磁盘
0 * * * * /path/to/disk_monitor.sh

# 每天凌晨 2 点生成日报
0 2 * * * /path/to/daily_report.sh
```

### 使用 systemd 服务监控

**创建监控服务**：

```bash
# 创建服务文件
sudo vim /etc/systemd/system/monitor.service

# 服务配置
[Unit]
Description=System Monitor Service
After=network.target

[Service]
Type=simple
ExecStart=/path/to/monitor.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**创建定时器**：

```bash
# 创建定时器文件
sudo vim /etc/systemd/system/monitor.timer

# 定时器配置
[Unit]
Description=Run Monitor every 5 minutes

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
```

**启用定时器**：

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启用并启动定时器
sudo systemctl enable monitor.timer
sudo systemctl start monitor.timer

# 查看定时器状态
sudo systemctl list-timers
```

## 对比表格

### 日志查看命令对比

| 命令 | 适用场景 | 优点 | 缺点 |
|------|----------|------|------|
| tail | 查看日志末尾 | 简单快速，支持实时跟踪 | 只能看末尾 |
| head | 查看日志开头 | 简单快速 | 只能看开头 |
| cat | 查看整个文件 | 显示完整内容 | 大文件会卡 |
| less | 分页查看 | 支持搜索、翻页 | 需要交互 |
| grep | 搜索内容 | 强大的搜索能力 | 需要知道关键词 |
| journalctl | 查看 journald 日志 | 功能强大，支持多种筛选 | 仅适用于 systemd |

### 系统监控工具对比

| 工具 | 监控对象 | 实时性 | 交互性 | 适用场景 |
|------|----------|--------|--------|----------|
| top | CPU、内存、进程 | 实时 | 强 | 日常监控 |
| htop | CPU、内存、进程 | 实时 | 强 | top 的增强版 |
| vmstat | 内存、CPU、IO | 定时刷新 | 弱 | 性能分析 |
| iostat | CPU、磁盘 IO | 定时刷新 | 弱 | 磁盘性能分析 |
| netstat | 网络连接 | 快照 | 弱 | 网络诊断 |
| ss | 网络连接 | 快照 | 弱 | netstat 替代品 |
| ps | 进程 | 快照 | 弱 | 进程查看 |

## 新手常见误区

### 误区 1：只看日志不分析

很多新手遇到问题就翻日志，但只是机械地看，不做分析。正确的做法是：

- 明确问题发生的时间点
- 搜索该时间段前后的日志
- 关注 ERROR、WARNING 等级别的日志
- 结合多个日志文件交叉分析

### 误区 2：日志文件越大越好

有些新手认为日志越详细越好，结果日志文件迅速膨胀，占满磁盘。正确的做法是：

- 生产环境只记录 INFO 及以上级别
- 配置日志轮转，定期清理
- 使用日志聚合工具（如 ELK）集中管理

### 误区 3：监控只看平均值

平均值会掩盖峰值问题。例如，CPU 平均使用率 50%，但可能有时段达到 100%。正确的做法是：

- 关注 P95、P99 等百分位指标
- 设置合理的告警阈值
- 使用 Grafana 等工具可视化趋势

### 误区 4：告警太多导致麻木

告警太多会导致"告警疲劳"，真正的问题被忽略。正确的做法是：

- 只告警真正需要处理的问题
- 分级告警（警告、严重、紧急）
- 定期回顾和调整告警规则

### 误区 5：忽视日志安全

日志中可能包含敏感信息（密码、密钥等）。正确的做法是：

- 过滤敏感信息
- 限制日志文件权限
- 加密传输日志
- 定期审计日志访问记录

## 动手练习

### 练习 1：基础 - 查看和分析系统日志

**任务**：查看系统认证日志，找出最近 24 小时内失败的登录尝试。

<details>
<summary>点击查看答案</summary>

```bash
# 方法 1：使用 grep 搜索失败登录
grep "Failed password" /var/log/auth.log | grep "$(date -d '1 day ago' '+%b %d')"

# 方法 2：使用 journalctl
journalctl -u ssh --since "24 hours ago" | grep "Failed password"

# 方法 3：统计失败次数最多的 IP
grep "Failed password" /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -nr | head -10
```

</details>

### 练习 2：进阶 - 编写磁盘监控脚本

**任务**：编写一个脚本，监控所有挂载点的使用率，当超过 85% 时输出告警信息。

<details>
<summary>点击查看答案</summary>

```bash
#!/bin/bash
# disk_alert.sh

THRESHOLD=85

echo "=== 磁盘空间监控 ==="
echo "时间: $(date)"
echo "阈值: ${THRESHOLD}%"
echo ""

# 获取所有挂载点
df -h | awk 'NR>1 {print $5 " " $6}' | while read usage mount; do
    percent=${usage%\%}
    
    if [ "$percent" -gt "$THRESHOLD" ]; then
        echo "[告警] $mount 使用率 ${usage} - 超过阈值!"
    else
        echo "[正常] $mount 使用率 ${usage}"
    fi
done
```

</details>

### 练习 3：挑战 - 搭建简单的监控系统

**任务**：编写一个综合监控脚本，同时监控 CPU、内存、磁盘，并将结果输出到 HTML 报告。

<details>
<summary>点击查看答案</summary>

```bash
#!/bin/bash
# system_report.sh - 生成系统监控 HTML 报告

REPORT_FILE="/tmp/system_report_$(date +%Y%m%d_%H%M%S).html"

# 生成 HTML 头部
cat > "$REPORT_FILE" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>系统监控报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .warning { background-color: #fff3cd; }
        .danger { background-color: #f8d7da; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
    </style>
</head>
<body>
EOF

# 添加报告标题
echo "<h1>系统监控报告</h1>" >> "$REPORT_FILE"
echo "<p>生成时间: $(date)</p>" >> "$REPORT_FILE"
echo "<p>主机名: $(hostname)</p>" >> "$REPORT_FILE"

# CPU 信息
echo "<div class='section'>" >> "$REPORT_FILE"
echo "<h2>CPU 使用情况</h2>" >> "$REPORT_FILE"
echo "<pre>" >> "$REPORT_FILE"
top -bn1 | head -5 >> "$REPORT_FILE"
echo "</pre>" >> "$REPORT_FILE"
echo "</div>" >> "$REPORT_FILE"

# 内存信息
echo "<div class='section'>" >> "$REPORT_FILE"
echo "<h2>内存使用情况</h2>" >> "$REPORT_FILE"
echo "<pre>" >> "$REPORT_FILE"
free -h >> "$REPORT_FILE"
echo "</pre>" >> "$REPORT_FILE"
echo "</div>" >> "$REPORT_FILE"

# 磁盘信息
echo "<div class='section'>" >> "$REPORT_FILE"
echo "<h2>磁盘使用情况</h2>" >> "$REPORT_FILE"
echo "<table>" >> "$REPORT_FILE"
echo "<tr><th>文件系统</th><th>大小</th><th>已用</th><th>可用</th><th>使用率</th><th>挂载点</th></tr>" >> "$REPORT_FILE"
df -h | awk 'NR>1 {print "<tr><td>"$1"</td><td>"$2"</td><td>"$3"</td><td>"$4"</td><td>"$5"</td><td>"$6"</td></tr>"}' >> "$REPORT_FILE"
echo "</table>" >> "$REPORT_FILE"
echo "</div>" >> "$REPORT_FILE"

# 生成 HTML 尾部
echo "</body></html>" >> "$REPORT_FILE"

echo "报告已生成: $REPORT_FILE"
```

</details>

## 下一章预告

下一章我们将学习 **安全加固与防火墙**。系统监控让我们能够发现问题，而安全加固则是防止问题发生。我们会学习如何配置防火墙、加固 SSH、管理系统权限，让你的 Linux 系统更加安全。
