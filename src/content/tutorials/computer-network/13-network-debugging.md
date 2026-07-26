---
title: "第13章：网络调试与分析"
description: "掌握 Wireshark 抓包、tcpdump 与网络协议分析"
---

# 第13章：网络调试与分析

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 网络出问题了，怎么快速定位原因？
- Wireshark 是什么？怎么用它抓包？
- tcpdump 和 Wireshark 有什么区别？
- 如何分析网络协议的具体内容？

这一章就是为了解答这些问题。我们会先搞清楚**网络调试的基本思路**，再学习**Wireshark 和 tcpdump 的使用方法**，最后理解**如何分析网络协议**。

---

## 13.1 为什么需要网络调试？

### 痛点分析

网络问题的常见表现：

- 网页打不开，但能 ping 通
- 接口请求超时，不知道是哪里的问题
- 数据传输慢，不知道瓶颈在哪里
- 安全审计，需要分析网络流量
- 就像**医生看病**，需要检查、诊断、治疗

### 解决方案

网络调试工具帮助我们：

| 工具 | 作用 | 使用场景 |
|------|------|----------|
| ping | 测试连通性 | 基础网络检查 |
| traceroute | 追踪路由路径 | 定位网络节点问题 |
| nslookup | DNS 查询 | DNS 问题排查 |
| tcpdump | 命令行抓包 | 服务器环境 |
| Wireshark | 图形化抓包分析 | 详细协议分析 |
| netstat | 查看网络连接 | 端口和连接检查 |

---

## 13.2 基础网络诊断命令

### ping 命令

**作用**：测试网络连通性和延迟

**基本用法**：

```bash
# 测试连通性
ping www.baidu.com

# 指定次数
ping -c 4 www.baidu.com  # Linux/Mac
ping -n 4 www.baidu.com  # Windows

# 指定包大小
ping -s 1000 www.baidu.com  # 1000 字节

# 持续 ping（Ctrl+C 停止）
ping www.baidu.com
```

**输出分析**：

```
PING www.baidu.com (180.101.49.11) 56(84) bytes of data.
64 bytes from 180.101.49.11: icmp_seq=1 ttl=52 time=10.5 ms
64 bytes from 180.101.49.11: icmp_seq=2 ttl=52 time=10.3 ms

# 统计信息
--- www.baidu.com ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3005ms
rtt min/avg/max/mdev = 10.2/10.4/10.5/0.1 ms
```

**关键指标**：
- **ttl**：Time To Live，经过的路由器数量
- **time**：往返延迟（RTT）
- **packet loss**：丢包率

### traceroute 命令

**作用**：追踪数据包经过的路由路径

**基本用法**：

```bash
# Linux/Mac
traceroute www.baidu.com

# Windows
tracert www.baidu.com

# 指定最大跳数
traceroute -m 30 www.baidu.com

# 使用 TCP 而不是 ICMP
traceroute -T www.baidu.com
```

**输出分析**：

```
traceroute to www.baidu.com (180.101.49.11), 30 hops max
 1  192.168.1.1      1.234 ms  1.123 ms  1.098 ms
 2  10.0.0.1         5.678 ms  5.456 ms  5.321 ms
 3  222.186.15.1     10.5 ms   10.3 ms   10.2 ms
 4  180.101.49.11    15.8 ms   15.6 ms   15.5 ms
```

**分析要点**：
- 每一跳的 IP 和延迟
- 如果某一跳延迟突然增加，可能是瓶颈
- 如果某一跳超时（* * *），可能是该节点禁 ping

### nslookup 命令

**作用**：查询 DNS 记录

**基本用法**：

```bash
# 查询 A 记录
nslookup www.baidu.com

# 指定 DNS 服务器
nslookup www.baidu.com 8.8.8.8

# 查询其他类型记录
nslookup -type=mx baidu.com
nslookup -type=ns baidu.com
nslookup -type=txt baidu.com
```

**输出分析**：

```
Server:		8.8.8.8
Address:	8.8.8.8#53

Non-authoritative answer:
Name:	www.baidu.com
Address: 180.101.49.11
Name:	www.baidu.com
Address: 180.101.49.12
```

### netstat 命令

**作用**：查看网络连接、路由表、接口统计

**基本用法**：

```bash
# 查看所有连接
netstat -a

# 查看监听端口
netstat -l

# 显示数字地址和端口
netstat -n

# 显示进程 ID
netstat -p

# 查看 TCP 连接
netstat -at

# 查看 UDP 连接
netstat -au

# 查看路由表
netstat -r

# 查看统计信息
netstat -s
```

**常用组合**：

```bash
# 查看 80 端口的监听情况
netstat -tlnp | grep 80

# 查看某个端口的连接
netstat -an | grep 80

# 查看连接状态统计
netstat -n | awk '/^tcp/ {++S[$NF]} END {for(a in S) print a, S[a]}'
```

---

## 13.3 tcpdump 抓包

### 什么是 tcpdump？

**定义**：命令行网络抓包工具，基于 libpcap 库

**特点**：
- 轻量级，适合服务器环境
- 支持复杂的过滤规则
- 可以保存为 pcap 文件

### 基本用法

```bash
# 抓取所有接口的所有数据包
sudo tcpdump -i any

# 抓取指定接口
sudo tcpdump -i eth0

# 抓取指定主机的数据包
sudo tcpdump -i eth0 host 192.168.1.100

# 抓取指定端口的数据包
sudo tcpdump -i eth0 port 80

# 抓取 TCP 数据包
sudo tcpdump -i eth0 tcp

# 抓取 UDP 数据包
sudo tcpdump -i eth0 udp

# 抓取 ICMP 数据包
sudo tcpdump -i eth0 icmp
```

### 高级过滤

```bash
# 源地址和目的地址
sudo tcpdump -i eth0 src 192.168.1.100 and dst 192.168.1.200

# 源端口或目的端口
sudo tcpdump -i eth0 src port 80 or dst port 80

# 网络范围
sudo tcpdump -i eth0 net 192.168.1.0/24

# 复杂过滤
sudo tcpdump -i eth0 'tcp port 80 and host 192.168.1.100'
```

### 保存和读取

```bash
# 保存到文件
sudo tcpdump -i eth0 -w capture.pcap

# 限制文件大小（MB）
sudo tcpdump -i eth0 -w capture.pcap -C 10

# 限制文件数量
sudo tcpdump -i eth0 -w capture.pcap -W 5

# 读取 pcap 文件
tcpdump -r capture.pcap

# 读取并显示详细信息
tcpdump -r capture.pcap -vvv
```

### 输出分析

```
10:15:23.456789 IP 192.168.1.100.50000 > 192.168.1.200.80: 
Flags [S], seq 1234567890, win 65535, options [mss 1460], length 0
```

**字段说明**：
- **时间戳**：10:15:23.456789
- **协议**：IP
- **源地址.端口**：192.168.1.100.50000
- **目的地址.端口**：192.168.1.200.80
- **标志位**：[S] SYN, [.] ACK, [F] FIN, [R] RST, [P] PSH
- **序列号**：seq 1234567890
- **窗口大小**：win 65535
- **长度**：length 0

---

## 13.4 Wireshark 抓包分析

### 什么是 Wireshark？

**定义**：图形化网络协议分析工具

**特点**：
- 图形界面，易于使用
- 支持数百种协议解析
- 强大的过滤和搜索功能
- 跨平台（Windows、Linux、Mac）

### 安装和启动

```bash
# Ubuntu/Debian
sudo apt install wireshark

# CentOS/RHEL
sudo yum install wireshark

# macOS
brew install wireshark

# Windows
从官网下载安装包：https://www.wireshark.org/
```

### 基本使用

**步骤**：

1. **选择接口**：启动 Wireshark，选择要抓包的网卡
2. **开始抓包**：点击"开始"按钮
3. **停止抓包**：点击"停止"按钮
4. **分析数据**：使用过滤器和分析工具

### 过滤器语法

**显示过滤器**（抓包后过滤）：

```
# IP 地址过滤
ip.addr == 192.168.1.100
ip.src == 192.168.1.100
ip.dst == 192.168.1.200

# 端口过滤
tcp.port == 80
tcp.srcport == 80
tcp.dstport == 80

# 协议过滤
tcp
udp
icmp
http
dns

# 组合过滤
tcp.port == 80 && ip.addr == 192.168.1.100
http.request.method == "GET"
http.response.code == 200

# 内容过滤
http contains "password"
tcp contains "error"
```

**捕获过滤器**（抓包时过滤）：

```
# 语法类似 tcpdump
host 192.168.1.100
port 80
tcp port 80 and host 192.168.1.100
```

### 界面介绍

**三个面板**：

1. **数据包列表**：显示所有捕获的数据包
   - 时间戳
   - 源地址
   - 目的地址
   - 协议
   - 长度
   - 信息

2. **数据包详情**：显示选中数据包的详细信息
   - 分层显示（物理层 → 应用层）
   - 每个字段的详细解释

3. **数据包字节**：显示原始十六进制数据
   - 十六进制和 ASCII 对照

### 常用分析功能

**跟随 TCP 流**：

右键点击数据包 → Follow → TCP Stream

可以看到完整的 TCP 会话内容。

**统计功能**：

- **Statistics → Summary**：抓包统计摘要
- **Statistics → Protocol Hierarchy**：协议层次统计
- **Statistics → Conversations**：会话统计
- **Statistics → Endpoints**：端点统计

**名称解析**：

- **View → Name Resolution → Resolve Network Addresses**：解析 IP 地址为域名
- **View → Name Resolution → Resolve Transport Names**：解析端口为服务名

---

## 13.5 常见网络问题分析

### 问题 1：网页打不开

**排查步骤**：

```bash
# 1. 测试连通性
ping www.example.com

# 2. 测试 DNS
nslookup www.example.com

# 3. 测试端口
telnet www.example.com 80
# 或
nc -zv www.example.com 80

# 4. 追踪路由
traceroute www.example.com

# 5. 抓包分析
sudo tcpdump -i any port 80
```

**可能原因**：
- DNS 解析失败
- 防火墙阻止
- 服务器宕机
- 网络路由问题

### 问题 2：网络慢

**排查步骤**：

```bash
# 1. 测试延迟
ping -c 100 www.example.com

# 2. 测试带宽
iperf3 -c server_ip

# 3. 查看连接
netstat -s

# 4. 抓包分析
sudo tcpdump -i any -w slow.pcap
# 用 Wireshark 分析
```

**可能原因**：
- 带宽不足
- 网络拥塞
- 服务器响应慢
- 丢包严重

### 问题 3：连接超时

**排查步骤**：

```bash
# 1. 检查本地端口
netstat -tlnp | grep 80

# 2. 检查防火墙
sudo iptables -L -n

# 3. 抓包分析
sudo tcpdump -i any port 80 -vvv
```

**可能原因**：
- 端口未监听
- 防火墙阻止
- 连接数达到上限
- 超时设置太短

---

## 13.6 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| ping | 测试连通性和延迟 |
| traceroute | 追踪路由路径 |
| nslookup | DNS 查询 |
| netstat | 查看网络连接和端口 |
| tcpdump | 命令行抓包 |
| Wireshark | 图形化抓包分析 |
| 过滤器 | 精确筛选数据包 |

---

## 13.7 新手常见误区

### 误区 1："能 ping 通就代表网络正常"

**错！** ping 通只说明 ICMP 协议正常，不代表 TCP/UDP 正常。很多服务器禁 ping，但服务是正常的。

### 误区 2："抓包会泄露隐私"

不准确。抓包只是查看网络流量，不会主动发送数据。但在公共网络抓包可能涉及他人隐私，需要谨慎。

### 误区 3："Wireshark 只能抓包，不能分析"

不对。Wireshark 不仅能抓包，还能分析协议、统计流量、跟随会话、导出数据等。是网络分析的神器。

### 误区 4："过滤器语法很复杂，很难学"

其实过滤器语法有规律，常用的就那么几个。多练习几次就熟练了。Wireshark 还提供自动补全功能。

---

## 13.8 动手练习

### 练习 1：基础诊断

你的电脑无法访问 www.baidu.com，请写出排查步骤。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 测试网络连通性
ping www.baidu.com
# 如果不通，检查网络连接

# 2. 测试 DNS 解析
nslookup www.baidu.com
# 如果解析失败，检查 DNS 配置

# 3. 测试端口连通性
telnet www.baidu.com 80
# 或
curl -I http://www.baidu.com
# 如果连接失败，可能是防火墙或服务器问题

# 4. 追踪路由
traceroute www.baidu.com
# 查看在哪一跳出现问题

# 5. 检查本地网络配置
ifconfig  # Linux/Mac
ipconfig  # Windows

# 6. 检查路由表
route -n  # Linux
netstat -rn  # Windows/Mac
```

</details>

### 练习 2：tcpdump 抓包

请使用 tcpdump 抓取访问 www.baidu.com 时的 HTTP 请求，并保存到文件。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 开始抓包
sudo tcpdump -i any -w baidu_http.pcap 'tcp port 80'

# 2. 在浏览器访问 www.baidu.com

# 3. 停止抓包（Ctrl+C）

# 4. 查看抓包内容
tcpdump -r baidu_http.pcap

# 5. 查看详细 HTTP 内容
tcpdump -r baidu_http.pcap -A -s 0 'tcp port 80'

# 6. 或者用 Wireshark 打开分析
wireshark baidu_http.pcap
```

</details>

### 练习 3（挑战）：Wireshark 分析

请使用 Wireshark 分析一次完整的 TCP 三次握手过程。

<details>
<summary>点击查看答案</summary>

```
操作步骤：

1. 启动 Wireshark，选择网卡开始抓包

2. 在浏览器访问 http://www.example.com

3. 停止抓包

4. 在过滤器输入：tcp.port == 80

5. 找到前三个数据包：
   - 第一个包：Flags [S]（SYN）
     - 客户端 → 服务器
     - Seq=0，相对序列号
   - 第二个包：Flags [S, ACK]（SYN+ACK）
     - 服务器 → 客户端
     - Seq=0，Ack=1
   - 第三个包：Flags [.]（ACK）
     - 客户端 → 服务器
     - Seq=1，Ack=1

6. 右键点击第一个包 → Follow → TCP Stream
   可以看到完整的 HTTP 请求和响应

7. 分析每个包的详细信息：
   - TCP 头部字段
   - 选项（MSS、Window Scale 等）
   - 时间戳
```

</details>

---

## 下一章预告

下一章我们会学习**网络故障排查**——也就是常见问题诊断、ping/traceroute/nslookup 工具的使用。你会学到如何快速定位网络问题，以及常用的排查方法和技巧。