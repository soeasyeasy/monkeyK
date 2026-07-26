---
title: '第八章：进程管理'
description: 'Linux 进程查看、控制与终止'
---

# 第八章：进程管理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是进程？进程和程序有什么区别？
- 系统变卡了，怎么查看是哪个程序在占用资源？
- 程序卡死了，怎么强制关闭它？
- 怎么让程序在后台运行，不占用终端？

这一章就是为了解答这些问题。我们会先搞清楚进程的基本概念，再学会查看和管理进程，最后掌握前台后台切换和定时任务。学完之后，你就能完全掌控系统中运行的所有程序了。

---

## 8.1 为什么需要进程管理？

### 痛点分析

想象一下这样的场景：

你的 Linux 服务器突然变得很慢，SSH 连接都卡卡的。你想知道是哪个程序在搞鬼，但不知道怎么看。你试着关闭一些窗口，但程序还是在后台运行。你想强制结束一个卡死的程序，但不知道它的进程号，也不知道用什么命令。

更糟糕的是，你想让一个脚本在后台持续运行，但一关闭终端它就停了。你折腾了半天也没搞定。

这就是不会进程管理时的日常：**系统卡了不知道原因，程序卡死了关不掉，后台运行搞不定**。

### 解决方案

Linux 的进程管理工具让你可以：

- 查看所有正在运行的程序，知道谁在占用 CPU 和内存
- 强制终止卡死的程序，不管它多顽固
- 让程序在后台运行，关闭终端也不停
- 设置定时任务，让程序自动执行

打个比方：

> 进程管理就像交通管理。进程就是路上跑的车，你需要交警（进程管理工具）来监控交通状况、处理违章车辆、指挥交通流。没有交警，路上堵成一团你也不知道怎么办。

### 前后对比

```
不会进程管理：
  系统变卡 → 不知道原因 → 重启解决 → 问题反复出现

会进程管理：
  系统变卡 → top 查看 → 找到占用资源的进程 → kill 终止 → 问题解决
```

> 一句话总结：进程管理让你掌控系统中运行的所有程序，不再被动等待。

---

## 8.2 进程的基本概念

### 什么是进程？

进程（Process）是正在运行的程序的实例。程序是静态的代码文件，进程是动态的运行实例。

打个比方：

> 程序就像菜谱，是静态的文本。进程就像厨师按照菜谱做菜的过程，是动态的执行。同一份菜谱（程序）可以同时被多个厨师执行（多个进程）。

### 进程的属性

每个进程都有以下属性：

| 属性 | 说明 | 类比 |
| --- | --- | --- |
| PID | 进程 ID，唯一标识 | 身份证号 |
| PPID | 父进程 ID | 父母 |
| UID | 所属用户 ID | 户主 |
| 状态 | 运行/睡眠/停止/僵尸 | 工作状态 |
| 优先级 | 调度优先级 | VIP 等级 |
| 内存占用 | 使用的内存大小 | 占用的资源 |
| CPU 时间 | 使用 CPU 的时长 | 工作时间 |

### 进程状态

Linux 进程有以下几种状态：

```
R (Running)      - 正在运行或在运行队列中等待
S (Sleeping)     - 休眠中，等待某个事件或资源
D (Disk Sleep)   - 不可中断的休眠，通常在等待 I/O
T (Stopped)      - 已停止，被信号暂停
Z (Zombie)       - 僵尸进程，已终止但父进程未回收
```

打个比方：

> - R：正在干活或排队等活
> - S：休息中，等电话叫它干活
> - D：深度睡眠，叫不醒（在等硬盘读写）
> - T：被暂停了，老板说先停一下
> - Z：已经死了，但还没办后事（父进程没回收）

### 进程的生命周期

```
创建进程（fork）
    │
    ▼
执行进程（exec）
    │
    ▼
运行中（Running）
    │
    ├──→ 等待事件（Sleeping）──→ 被唤醒 ──→ 继续运行
    │
    ▼
终止进程（exit）
    │
    ▼
父进程回收（wait）
```

---

## 8.3 查看进程

### ps 命令 -- 查看进程快照

```bash
# 查看当前终端的进程
ps
# 只显示当前 Shell 启动的进程

# 查看所有进程（完整信息）
ps aux
# a: 显示所有用户的进程
# u: 以用户友好的格式显示
# x: 显示没有控制终端的进程

# 查看所有进程（另一种格式）
ps -ef
# -e: 显示所有进程
# -f: 全格式显示

# 查看特定用户的进程
ps -u alice
# 只显示 alice 用户的进程

# 按 PID 查看进程
ps -p 1234
# 查看 PID 为 1234 的进程

# 按名称查看进程
ps -C nginx
# 查看名为 nginx 的进程

# 自定义输出格式
ps -eo pid,ppid,user,%cpu,%mem,comm
# 只显示 PID、父PID、用户、CPU占用、内存占用、命令名

# 按 CPU 占用排序
ps aux --sort=-%cpu
# - 表示降序（从大到小），去掉 - 表示升序

# 按内存占用排序
ps aux --sort=-%mem

# 查看进程树
ps axjf
# 以树形结构显示进程父子关系
```

### top 命令 -- 实时监控进程

```bash
# 启动 top
top
# 实时显示进程状态，每 3 秒刷新一次

# top 界面说明：
# 第 1 行：系统时间、运行时间、登录用户数、负载
# 第 2 行：进程总数、运行中、睡眠、停止、僵尸
# 第 3 行：CPU 使用情况（us用户, sy系统, ninice, id空闲, wa等待I/O）
# 第 4 行：内存使用情况
# 第 5 行：交换空间使用情况
# 下面：进程列表

# top 交互命令（在 top 运行时按）
# q        - 退出 top
# M        - 按内存占用排序
# P        - 按 CPU 占用排序
# T        - 按时间排序
# k        - 终止一个进程（会提示输入 PID）
# r        - 修改进程优先级（会提示输入 PID 和新优先级）
# h        - 显示帮助
# 空格     - 立即刷新

# 指定刷新间隔
top -d 1
# 每 1 秒刷新一次（默认 3 秒）

# 只显示特定用户的进程
top -u alice

# 批处理模式（不进入交互界面）
top -b -n 1
# -b: 批处理模式，-n 1: 只刷新一次
# 适合在脚本中使用
```

### htop -- 更好用的 top

```bash
# 安装 htop（Ubuntu/Debian）
sudo apt install htop

# 安装 htop（CentOS/RHEL）
sudo yum install htop

# 启动 htop
htop
# 比 top 更直观，支持鼠标，彩色显示

# htop 交互操作：
# F1       - 帮助
# F2       - 设置
# F3       - 搜索进程
# F4       - 过滤进程
# F5       - 显示树形结构
# F6       - 排序方式
# F9       - 终止进程
# F10      - 退出
# 方向键   - 选择进程
# 空格     - 标记/取消标记进程
```

### pgrep 和 pidof -- 查找进程

```bash
# 按名称查找进程
pgrep nginx
# 返回 nginx 进程的 PID

# 查找特定用户的进程
pgrep -u alice nginx
# 查找 alice 用户的 nginx 进程

# 显示详细信息
pgrep -l nginx
# 同时显示 PID 和进程名

# 查找进程（另一种方式）
pidof nginx
# 返回 nginx 的所有 PID（可能有多个）

# 查找父进程
pgrep -P 1
# 查找 PPID 为 1 的所有进程
```

---

## 8.4 终止进程

### kill 命令 -- 发送信号

```bash
# 终止进程（发送 SIGTERM 信号）
kill 1234
# 默认发送 SIGTERM（15），允许进程优雅退出

# 强制终止进程
kill -9 1234
# 发送 SIGKILL（9），强制终止，进程无法捕获或忽略

# 发送其他信号
kill -1 1234    # SIGHUP，重新加载配置
kill -15 1234   # SIGTERM，正常终止
kill -19 1234   # SIGSTOP，暂停进程
kill -18 1234   # SIGCONT，继续被暂停的进程

# 查看所有信号
kill -l
# 列出所有可用的信号名称和编号
```

### killall 和 pkill -- 按名称终止

```bash
# 按名称终止所有匹配进程
killall nginx
# 终止所有名为 nginx 的进程

# 强制终止
killall -9 nginx

# 终止特定用户的进程
killall -u alice nginx

# 按名称终止（支持正则）
pkill nginx
# 终止所有名称包含 nginx 的进程

# 按用户终止
pkill -u alice
# 终止 alice 的所有进程

# 按父进程终止
pkill -P 1
# 终止所有父进程为 1 的进程

# 先查看会匹配哪些进程（不实际终止）
pkill -l nginx
# 或 killall -l nginx
```

### 常用信号说明

| 信号名 | 编号 | 说明 | 能否被捕获 |
| --- | --- | --- | --- |
| SIGHUP | 1 | 挂起，通常用于重新加载配置 | 能 |
| SIGINT | 2 | 中断，相当于 Ctrl+C | 能 |
| SIGQUIT | 3 | 退出，相当于 Ctrl+\ | 能 |
| SIGKILL | 9 | 强制终止，无法被捕获 | 不能 |
| SIGTERM | 15 | 正常终止，默认信号 | 能 |
| SIGSTOP | 19 | 暂停进程，无法被捕获 | 不能 |
| SIGCONT | 18 | 继续被暂停的进程 | 能 |

> 打个比方：SIGTERM 就像礼貌地请人离开，对方可以拒绝或延迟。SIGKILL 就像保安强行把人拖走，无法抗拒。

---

## 8.5 前台与后台

### 后台运行命令

```bash
# 在后台运行命令
command &
# 在命令末尾加 &，让它在后台运行

# 示例：后台运行 Python 脚本
python3 script.py &
# 输出类似：[1] 12345
# [1] 是作业号，12345 是 PID

# 查看后台作业
jobs
# 显示当前终端的后台作业

# 将后台作业切换到前台
fg %1
# %1 是作业号，把作业 1 切换到前台

# 将前台作业暂停并放到后台
# 先按 Ctrl+Z 暂停当前前台作业
# 然后用 bg 让它在后台继续
bg %1
# 让作业 1 在后台继续运行
```

### nohup -- 不受终端关闭影响

```bash
# 普通后台运行（关闭终端会停止）
python3 script.py &

# 使用 nohup（关闭终端不会停止）
nohup python3 script.py &
# nohup 让进程忽略 SIGHUP 信号，终端关闭也不会停

# 输出重定向到文件
nohup python3 script.py > output.log 2>&1 &
# > output.log: 标准输出重定向到文件
# 2>&1: 标准错误也重定向到同一个文件
# &: 后台运行

# 查看 nohup 输出
tail -f output.log
# 实时查看输出内容
```

### screen 和 tmux -- 终端复用器

```bash
# 安装 screen
sudo apt install screen

# 创建新的 screen 会话
screen -S mysession
# 进入一个新的虚拟终端

# 在 screen 中运行程序
python3 script.py
# 程序在这个虚拟终端中运行

# 分离会话（保持程序运行）
# 按 Ctrl+A 然后按 D
# 回到原来的终端，程序继续在后台运行

# 重新连接会话
screen -r mysession
# 回到之前的虚拟终端

# 查看所有 screen 会话
screen -ls

# 安装 tmux（更现代的替代方案）
sudo apt install tmux

# 创建 tmux 会话
tmux new -s mysession

# 分离 tmux 会话
# 按 Ctrl+B 然后按 D

# 重新连接
tmux attach -t mysession
```

> 打个比方：screen/tmux 就像虚拟桌面。你可以在里面开多个终端，跑多个程序，然后"最小化"它们，程序继续在后台运行。需要的时候再"恢复"窗口。

---

## 8.6 定时任务

### crontab -- 定时执行任务

```bash
# 编辑当前用户的 crontab
crontab -e
# 会打开编辑器，添加定时任务

# 查看当前用户的 crontab
crontab -l

# 删除当前用户的 crontab
crontab -r

# crontab 格式：
# 分 时 日 月 周 命令
# *  *  *  *  *  command

# 示例：
# 每天凌晨 2 点执行
0 2 * * * /path/to/script.sh

# 每小时执行一次
0 * * * * /path/to/script.sh

# 每 5 分钟执行一次
*/5 * * * * /path/to/script.sh

# 每周一上午 9 点执行
0 9 * * 1 /path/to/script.sh

# 每月 1 号凌晨 3 点执行
0 3 1 * * /path/to/script.sh

# 每天 8:00、12:00、18:00 执行
0 8,12,18 * * * /path/to/script.sh

# 每天 8:00-18:00 每小时执行
0 8-18 * * * /path/to/script.sh
```

### crontab 时间字段说明

| 字段 | 取值范围 | 说明 |
| --- | --- | --- |
| 分钟 | 0-59 | 第几分钟执行 |
| 小时 | 0-23 | 第几小时执行 |
| 日 | 1-31 | 每月第几天执行 |
| 月 | 1-12 | 第几个月执行 |
| 周 | 0-7 | 星期几执行（0和7都是周日） |

特殊字符：

| 字符 | 说明 | 示例 |
| --- | --- | --- |
| * | 任意值 | * 表示每个 |
| , | 列表 | 1,3,5 表示 1、3、5 |
| - | 范围 | 1-5 表示 1 到 5 |
| / | 步长 | */5 表示每 5 个 |

### 示例：定时备份

```bash
# 编辑 crontab
crontab -e

# 添加以下行：每天凌晨 3 点备份 /home 目录到 /backup
0 3 * * * tar -czf /backup/home-$(date +\%Y\%m\%d).tar.gz /home

# 注意：crontab 中 % 需要转义为 \%

# 保存退出后，查看任务
crontab -l
# 应该看到刚添加的定时任务
```

---

## 8.7 对比表格

### 进程查看命令对比

| 命令 | 作用 | 输出方式 | 适用场景 |
| --- | --- | --- | --- |
| ps | 查看进程快照 | 一次性输出 | 查看当前进程状态 |
| top | 实时监控 | 持续刷新 | 监控系统负载 |
| htop | 增强版 top | 持续刷新，彩色 | 更直观的监控 |
| pgrep | 查找进程 | 只输出 PID | 脚本中查找进程 |
| pidof | 查找进程 | 只输出 PID | 快速查找进程号 |

### 进程终止命令对比

| 命令 | 作用 | 参数 | 适用场景 |
| --- | --- | --- | --- |
| kill | 按 PID 终止 | PID | 知道进程号时 |
| killall | 按名称终止 | 进程名 | 知道进程名时 |
| pkill | 按模式终止 | 正则表达式 | 复杂匹配时 |

### 后台运行方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- |
| command & | 简单 | 关闭终端会停止 | 临时后台任务 |
| nohup | 关闭终端不会停止 | 输出管理麻烦 | 长期后台任务 |
| screen/tmux | 可切换、可恢复 | 需要安装 | 需要交互的长期任务 |
| systemd | 系统级管理、自动重启 | 配置复杂 | 服务类程序 |

---

## 8.8 新手常见误区

### 误区 1："kill -9 是万能的"

不是。`kill -9` 强制终止进程，可能导致数据丢失或文件损坏。应该先用默认的 `kill`（SIGTERM），给进程机会优雅退出。只有进程无响应时才用 `kill -9`。

### 误区 2："ps aux 和 ps -ef 是一样的"

输出格式不同。`ps aux` 是 BSD 风格，显示 CPU、内存占用百分比。`ps -ef` 是 System V 风格，显示父进程 ID。两者都能查看所有进程，但格式和字段略有不同。

### 误区 3："后台运行用 & 就够了"

`&` 只是让命令在后台运行，但关闭终端时进程会收到 SIGHUP 信号而停止。如果想让进程在终端关闭后继续运行，应该用 `nohup` 或 `screen/tmux`。

### 误区 4："top 里按 Ctrl+C 可以终止进程"

不行。在 top 中按 Ctrl+C 会退出 top 本身。要终止进程，应该在 top 中按 `k`，然后输入 PID 和信号。或者退出 top 后用 `kill` 命令。

### 误区 5："僵尸进程会一直占用资源"

僵尸进程已经终止，不占用 CPU 和内存，只在进程表中占一个位置。大量僵尸进程可能耗尽进程表，但通常不会。僵尸进程的父进程应该用 `wait()` 回收它们。

---

## 8.9 动手练习

### 练习 1：基础练习

查看系统中所有正在运行的进程，找出占用 CPU 最多的前 5 个进程。

<details>
<summary>点击查看答案</summary>

```bash
# 方法 1：使用 ps 命令
ps aux --sort=-%cpu | head -6
# --sort=-%cpu: 按 CPU 占用降序排序
# head -6: 显示前 6 行（1 行标题 + 5 个进程）

# 方法 2：使用 top 命令
top
# 启动后按 P 键按 CPU 排序（默认就是按 CPU 排序）
# 查看前 5 个进程

# 方法 3：使用 htop（如果已安装）
htop
# 默认按 CPU 排序，更直观
```

</details>

### 练习 2：进阶练习

编写一个脚本，让它在后台持续运行（每秒输出当前时间到日志文件），使用 nohup 确保关闭终端后也不会停止。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建脚本
vim background_task.sh

# 2. 添加以下内容
#!/bin/bash
# 每秒输出当前时间到日志文件
while true; do
    echo "$(date '+%Y-%m-%d %H:%M:%S')" >> /tmp/background_task.log
    sleep 1
done

# 3. 给脚本添加执行权限
chmod +x background_task.sh

# 4. 使用 nohup 在后台运行
nohup ./background_task.sh > /dev/null 2>&1 &
# > /dev/null: 标准输出丢弃
# 2>&1: 标准错误也丢弃
# &: 后台运行

# 5. 查看进程
ps aux | grep background_task.sh
# 应该看到脚本在运行

# 6. 查看日志
tail -f /tmp/background_task.log
# 应该每秒看到一行时间输出

# 7. 关闭终端后重新登录，验证进程还在运行
ps aux | grep background_task.sh

# 8. 停止任务
pkill -f background_task.sh
```

</details>

### 练习 3（挑战）：综合练习

编写一个监控脚本，实现以下功能：
1. 每 5 秒检查一次系统负载
2. 如果 CPU 占用超过 80%，输出警告并记录到日志
3. 如果某个进程占用内存超过 50%，自动终止它
4. 使用 crontab 让脚本在系统启动时自动运行

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建监控脚本
vim monitor.sh

# 2. 添加以下内容
#!/bin/bash

LOG_FILE="/tmp/monitor.log"

# 获取系统负载（1分钟平均负载）
load=$(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $1}' | tr -d ' ')

# 获取 CPU 核心数
cpu_cores=$(nproc)

# 计算 CPU 使用率（负载/核心数 * 100）
cpu_usage=$(echo "scale=2; $load / $cpu_cores * 100" | bc)

# 检查 CPU 使用率
if (( $(echo "$cpu_usage > 80" | bc -l) )); then
    echo "$(date '+%Y-%m-%d %H:%M:%S') WARNING: CPU usage is ${cpu_usage}%" >> $LOG_FILE
fi

# 检查内存占用超过 50% 的进程
ps aux --sort=-%mem | while read line; do
    mem=$(echo $line | awk '{print $4}')
    pid=$(echo $line | awk '{print $2}')
    cmd=$(echo $line | awk '{print $11}')
    
    # 跳过标题行
    if [ "$mem" = "%MEM" ]; then
        continue
    fi
    
    # 如果内存占用超过 50%
    if (( $(echo "$mem > 50" | bc -l) )); then
        echo "$(date '+%Y-%m-%d %H:%M:%S') KILLING: PID=$pid CMD=$cmd MEM=${mem}%" >> $LOG_FILE
        kill -9 $pid
    fi
done

# 3. 给脚本添加执行权限
chmod +x monitor.sh

# 4. 测试脚本
./monitor.sh

# 5. 查看日志
cat /tmp/monitor.log

# 6. 设置 crontab 每 5 分钟执行一次
crontab -e

# 添加以下行
*/5 * * * * /path/to/monitor.sh

# 7. 如果要开机自动运行，创建 systemd 服务
sudo tee /etc/systemd/system/monitor.service > /dev/null <<'EOF'
[Unit]
Description=System Monitor
After=network.target

[Service]
Type=simple
ExecStart=/path/to/monitor.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 8. 启用服务
sudo systemctl daemon-reload
sudo systemctl enable monitor
sudo systemctl start monitor
```

</details>

---

## 下一章预告

恭喜你完成了 Linux 基础教程的学习！通过这 8 章，你已经掌握了：

- Linux 系统的基本概念和目录结构
- 常用的文件操作命令
- Shell 的基础知识
- 用户与权限管理
- 软件包管理
- Vim 编辑器
- 进程管理

这些是 Linux 的基础技能，无论你以后做开发、运维还是运维开发，都用得上。接下来建议你：

- 多动手实践，把命令用熟
- 尝试在 Linux 上搭建开发环境
- 学习 Shell 脚本编程，自动化日常任务
- 了解网络基础知识，为服务器管理打基础

Linux 的世界很大，这 8 章只是入门。保持好奇心，遇到问题多查文档、多实践，你会越来越强的。
