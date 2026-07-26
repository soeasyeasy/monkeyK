---
title: "第九章：网络配置与管理"
description: "掌握 Linux 网络配置的核心技能，包括 IP 地址管理、网络接口配置、DNS 解析、防火墙设置以及常用网络诊断工具"
---

# 第九章：网络配置与管理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Linux 下怎么配置 IP 地址？为什么我的服务器连不上网？
- IP 地址、子网掩码、网关、DNS 这些概念到底是什么意思？
- 网络不通的时候怎么排查问题？ping 不通怎么办？
- 防火墙到底怎么配置？为什么我的端口访问不了？

这一章就是为了解答这些问题。我们会从网络的基本概念讲起，一步步带你掌握 Linux 下的网络配置、诊断和防火墙管理。学完之后，你就能独立处理大部分网络问题了。

---

## 9.1 为什么需要网络配置与管理？

### 痛点分析

想象一下这个场景：你刚装好一台 Linux 服务器，兴冲冲地想安装软件，结果发现上不了网。你试着 ping 百度，提示"网络不可达"。你一脸懵，不知道问题出在哪里。

这就是没有网络配置知识时的典型困境。在 Linux 世界里，网络问题是最常见的故障之一，具体痛点包括：

- **连不上网**：IP 地址没配对，或者网关没设置，导致无法访问外部网络
- **域名解析失败**：DNS 配置错误，能 ping 通 IP 但打不开网站
- **端口不通**：防火墙挡住了请求，服务明明在运行却访问不了
- **网络排查困难**：出了问题不知道从哪里入手，只能干着急

### 生活化类比

把 Linux 网络配置想象成"寄快递"：

> - **IP 地址**：你家的门牌号，快递要知道送到哪里
> - **子网掩码**：小区的范围，决定了哪些地址是"邻居"（同一网段）
> - **网关**：小区大门，要去外面的世界必须经过这里
> - **DNS**：电话簿，你要寄快递给"张三"，得先查到他的地址
> - **防火墙**：门卫，决定哪些快递能进小区，哪些要被拦下来

没有这些配置，你的数据包就像没有地址的快递，根本送不出去。

---

## 9.2 核心原理讲解

### 网络配置四要素

一台 Linux 机器要联网，至少需要配置四个东西：

| 配置项 | 作用 | 类比 |
| --- | --- | --- |
| IP 地址 | 标识自己在网络中的位置 | 你家的门牌号 |
| 子网掩码 | 划分网络号和主机号 | 确定哪些是"邻居" |
| 默认网关 | 访问外部网络的出口 | 小区大门 |
| DNS 服务器 | 把域名翻译成 IP 地址 | 电话簿 |

打个比方：

> 你要给朋友寄快递。首先你得有自己的地址（IP 地址），然后你要知道哪些人是同一个小区的（子网掩码），寄到外地的快递要送到小区门口让快递员取走（网关），最后你要查朋友的地址（DNS）。

### IP 地址基础

```
IPv4 地址格式：点分十进制
例如：192.168.1.100

由 4 组数字组成，每组范围 0-255
总共 32 位，分成 4 段，每段 8 位
```

**私有地址范围**（只能在局域网使用）：

| 地址段 | 范围 | 说明 |
| --- | --- | --- |
| A 类 | 10.0.0.0 - 10.255.255.255 | 大型网络 |
| B 类 | 172.16.0.0 - 172.31.255.255 | 中型网络 |
| C 类 | 192.168.0.0 - 192.168.255.255 | 小型网络（家庭/公司最常见） |

### 网络接口

Linux 中每个网络连接设备（网卡）都有一个名字，叫做"网络接口"。常见的接口名：

| 接口名 | 含义 |
| --- | --- |
| eth0 | 第一块以太网卡（有线网卡） |
| ens33 | 另一种以太网命名方式（新版 Linux） |
| wlan0 | 第一块无线网卡 |
| lo | 回环接口（固定为 127.0.0.1，就是"自己"） |

---

## 9.3 基础用法

### 查看网络信息

```bash
# 查看所有网络接口的 IP 地址
ip addr
# 输出类似：
# 1: lo: <LOOPBACK,UP> mtu 65536
#     inet 127.0.0.1/8 scope host lo    # 回环地址，永远是 127.0.0.1
# 2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
#     inet 192.168.1.100/24 brd 192.168.1.255 scope global eth0  # 你的 IP 地址

# ✅ 推荐：使用 ip 命令（现代 Linux 标准工具）
ip addr show              # 显示所有网络接口
ip addr show eth0         # 只显示 eth0 的信息
ip route                  # 查看路由表（网关在这里看）
ip neigh                  # 查看 ARP 缓存（局域网邻居列表）

# ❌ 过时：ifconfig 命令（老系统用，新系统可能没装）
ifconfig                  # 功能类似 ip addr，但不推荐使用
```

### 配置 IP 地址

```bash
# 临时设置 IP 地址（重启后失效）
sudo ip addr add 192.168.1.200/24 dev eth0
# 含义：给 eth0 网卡添加 IP 192.168.1.200，子网掩码 24 位（即 255.255.255.0）

# 删除 IP 地址
sudo ip addr del 192.168.1.200/24 dev eth0

# 启用/禁用网卡
sudo ip link set eth0 up     # 启用网卡
sudo ip link set eth0 down   # 禁用网卡

# ✅ 正确：临时配置用 ip 命令
sudo ip addr add 192.168.1.200/24 dev eth0

# ❌ 错误：直接修改配置文件但不重启网络服务（不会生效）
```

### 配置网关和路由

```bash
# 查看当前路由
ip route
# 输出类似：
# default via 192.168.1.1 dev eth0       # 默认网关
# 192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.100  # 本地网段

# 添加默认网关
sudo ip route add default via 192.168.1.1
# 含义：所有不在本地网段的流量，都发给 192.168.1.1（路由器）

# 添加静态路由（让特定网段走特定路径）
sudo ip route add 10.0.0.0/8 via 192.168.1.254
# 含义：访问 10.x.x.x 的流量，发给 192.168.1.254

# 删除路由
sudo ip route del default
```

### 配置 DNS

```bash
# 查看当前 DNS 配置
cat /etc/resolv.conf
# 输出类似：
# nameserver 8.8.8.8        # 主 DNS 服务器
# nameserver 114.114.114.114 # 备用 DNS 服务器

# 临时修改 DNS
sudo bash -c 'echo "nameserver 8.8.8.8" > /etc/resolv.conf'
sudo bash -c 'echo "nameserver 114.114.114.114" >> /etc/resolv.conf'

# ✅ 正确：临时测试用 resolv.conf
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf

# ❌ 错误：在 systemd-resolved 系统上直接改 resolv.conf（会被覆盖）
# 如果系统使用 systemd-resolved，应该用以下方式：
sudo resolvectl dns eth0 8.8.8.8 114.114.114.114
```

### 永久配置网络（Netplan，Ubuntu 18.04+）

```yaml
# 编辑 Netplan 配置文件
sudo vim /etc/netplan/01-netcfg.yaml

# 静态 IP 配置示例：
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      addresses:
        - 192.168.1.100/24          # IP 地址和子网掩码
      gateway4: 192.168.1.1         # 默认网关
      nameservers:
        addresses:
          - 8.8.8.8                 # DNS 服务器
          - 114.114.114.114         # 备用 DNS

# DHCP 自动获取 IP 配置示例：
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      dhcp4: true                   # 开启 DHCP 自动获取

# 应用配置
sudo netplan apply
```

### 永久配置网络（NetworkManager，CentOS/RHEL）

```bash
# 使用 nmcli 配置静态 IP
sudo nmcli connection modify eth0 \
  ipv4.addresses 192.168.1.100/24 \     # IP 地址
  ipv4.gateway 192.168.1.1 \            # 网关
  ipv4.dns "8.8.8.8 114.114.114.114" \  # DNS
  ipv4.method manual                     # 手动配置（非 DHCP）

# 重启连接使配置生效
sudo nmcli connection up eth0

# 使用 nmcli 配置 DHCP
sudo nmcli connection modify eth0 ipv4.method auto
sudo nmcli connection up eth0
```

### 网络诊断工具

```bash
# ping：测试网络连通性
ping baidu.com               # 持续 ping，按 Ctrl+C 停止
ping -c 4 baidu.com          # 只 ping 4 次
# 输出类似：
# PING baidu.com (39.156.66.18) 56(84) bytes of data.
# 64 bytes from 39.156.66.18: icmp_seq=1 ttl=52 time=10.5 ms  # 延迟 10.5 毫秒

# traceroute：追踪数据包经过的路径
traceroute baidu.com         # 显示经过的每一跳路由器
# 输出类似：
#  1  192.168.1.1     1.234 ms        # 第一跳：你的路由器
#  2  10.0.0.1        5.678 ms        # 第二跳：运营商路由器
#  3  * * *                          # 第三跳：被防火墙拦截

# ✅ 推荐：使用 tracepath（不需要 root 权限）
tracepath baidu.com

# telnet/nc：测试端口是否开放
nc -zv 192.168.1.100 80      # 测试 80 端口
# 输出：Connection to 192.168.1.100 80 port [tcp/http] succeeded!

# curl：测试 HTTP 请求
curl -I http://baidu.com      # 只获取响应头

# dig/nslookup：DNS 查询
dig baidu.com                 # 查询域名对应的 IP
nslookup baidu.com            # 功能类似 dig，更简单

# ss/netstat：查看网络连接和端口
ss -tlnp                      # 查看正在监听的 TCP 端口及对应进程
# 输出类似：
# LISTEN  0  128  0.0.0.0:22  0.0.0.0:*  users:(("sshd",pid=1234,fd=3))

# ❌ 过时：netstat（新系统可能没装）
netstat -tlnp                 # 功能类似 ss -tlnp
```

### 防火墙管理（firewalld）

```bash
# 查看防火墙状态
sudo firewall-cmd --state

# 查看当前所有规则
sudo firewall-cmd --list-all

# 开放端口
sudo firewall-cmd --permanent --add-port=80/tcp     # 永久开放 80 端口
sudo firewall-cmd --permanent --add-port=443/tcp    # 永久开放 443 端口
sudo firewall-cmd --reload                           # 重新加载使规则生效

# 关闭端口
sudo firewall-cmd --permanent --remove-port=80/tcp
sudo firewall-cmd --reload

# 开放服务
sudo firewall-cmd --permanent --add-service=http     # 开放 HTTP 服务
sudo firewall-cmd --permanent --add-service=https    # 开放 HTTPS 服务
sudo firewall-cmd --reload

# ✅ 正确：先加 --permanent 再 reload
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload

# ❌ 错误：不加 --permanent（重启后规则丢失）
sudo firewall-cmd --add-port=8080/tcp   # 临时生效，重启后失效
```

### 防火墙管理（iptables）

```bash
# 查看当前规则
sudo iptables -L -n -v

# 允许已建立的连接
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# 允许 SSH 端口
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# 允许 HTTP 端口
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT

# 拒绝其他所有入站连接
sudo iptables -P INPUT DROP

# 保存规则（Ubuntu）
sudo apt install iptables-persistent
sudo netfilter-persistent save

# 保存规则（CentOS）
sudo service iptables save
```

---

## 9.4 对比表格

### 网络配置工具对比

| 工具 | 适用系统 | 特点 | 推荐程度 |
| --- | --- | --- | --- |
| ip 命令 | 所有现代 Linux | 功能全面，即时生效，临时配置 | 推荐用于临时测试 |
| Netplan | Ubuntu 18.04+ | YAML 格式，易于阅读和维护 | Ubuntu 系统推荐 |
| nmcli | CentOS/RHEL 7+ | NetworkManager 命令行工具 | CentOS/RHEL 推荐 |
| ifcfg 文件 | CentOS/RHEL 6 | 传统配置文件 | 老系统使用 |
| ifconfig | 老系统 | 已过时，功能有限 | 不推荐 |

### 网络诊断命令对比

| 命令 | 作用 | 使用场景 |
| --- | --- | --- |
| ping | 测试连通性和延迟 | 最基本的网络测试 |
| traceroute | 追踪数据包路径 | 排查网络在哪里断掉 |
| dig/nslookup | DNS 查询 | 排查域名解析问题 |
| ss/netstat | 查看端口和连接 | 排查服务是否正常监听 |
| curl/wget | HTTP 请求测试 | 测试 Web 服务是否正常 |
| nc | 端口连通性测试 | 测试特定端口是否可达 |
| tcpdump | 抓包分析 | 深度排查网络问题 |

### 防火墙工具对比

| 工具 | 适用系统 | 特点 | 推荐程度 |
| --- | --- | --- | --- |
| firewalld | CentOS 7+/RHEL 7+ | 动态管理，支持区域概念 | CentOS/RHEL 推荐 |
| ufw | Ubuntu/Debian | 简单易用，命令直观 | Ubuntu 推荐 |
| iptables | 所有 Linux | 功能强大，规则复杂 | 高级用户 |
| nftables | 新版 Linux | iptables 的替代品 | 未来趋势 |

---

## 9.5 新手常见误区

### 误区 1："ping 不通就是网络没配好"

**错！** ping 不通有很多原因，不一定是配置问题。可能是：
- 对方机器防火墙禁用了 ICMP（比如 Windows 默认防火墙）
- 中间路由器禁用了 ICMP
- 网卡驱动有问题
- 网线没插好（物理层问题）

排查思路应该是：先检查自己的 IP 配置，再 ping 网关，再 ping 外网，逐步缩小范围。

### 误区 2："改了配置文件就立即生效"

**错！** 修改网络配置文件后，必须重启网络服务或重新加载配置才能生效。

```bash
# ❌ 错误：改完配置不重启服务
sudo vim /etc/netplan/01-netcfg.yaml
# 改完就以为生效了

# ✅ 正确：改完后应用配置
sudo netplan apply
# 或者
sudo systemctl restart NetworkManager
```

### 误区 3："防火墙关了就能访问了"

**不完全对！** 端口不通的原因可能有多个：
- 防火墙确实挡住了（需要开放端口）
- 服务没有启动或没有监听该端口
- 服务只监听了 127.0.0.1（本地回环），没有监听外部地址
- 云服务器还有安全组规则（云平台层面的防火墙）

### 误区 4："DNS 只能配一个"

**错！** 可以配置多个 DNS 服务器，系统会按顺序尝试。建议至少配两个，一个主 DNS，一个备用 DNS，防止主 DNS 挂了导致无法解析域名。

```bash
# ✅ 推荐：配置多个 DNS
nameserver 8.8.8.8         # 主 DNS（Google）
nameserver 114.114.114.114 # 备用 DNS（国内）
```

### 误区 5："临时配置和永久配置是一回事"

**错！** `ip addr` 命令配置的 IP 是临时的，重启后消失。要永久生效，必须写入配置文件（Netplan、nmcli 等）。很多新手配了 IP 重启后发现没了，就是因为只做了临时配置。

---

## 9.6 动手练习

### 练习 1（基础）：查看并配置网络信息

**题目**：查看当前系统的 IP 地址、网关、DNS 配置。然后临时修改 IP 地址为 192.168.1.200，验证修改是否生效。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 查看当前 IP 地址
ip addr show
# 找到你的网卡名（如 eth0）和当前 IP

# ❷ 查看当前网关
ip route
# 找到 default via 后面的 IP，就是你的网关

# ❸ 查看 DNS 配置
cat /etc/resolv.conf
# 查看 nameserver 后面的 IP

# ❹ 临时修改 IP 地址（假设网卡是 eth0）
sudo ip addr add 192.168.1.200/24 dev eth0

# ❺ 验证修改
ip addr show eth0
# 应该能看到新添加的 IP 地址

# ❻ 测试网络连通性
ping -c 4 baidu.com
# 如果能 ping 通，说明网络正常

# ❼ 恢复原来的 IP（可选）
sudo ip addr del 192.168.1.200/24 dev eth0
```

注意：临时修改的 IP 重启后会消失。如果要永久生效，需要修改 Netplan 或 NetworkManager 配置。

</details>

### 练习 2（进阶）：配置静态 IP 并开放防火墙端口

**题目**：在你的 Linux 系统上配置静态 IP 地址（192.168.1.100/24），网关为 192.168.1.1，DNS 为 8.8.8.8。然后开放防火墙的 8080 端口，使外部可以访问。

<details>
<summary>点击查看答案</summary>

```bash
# === 方式一：Ubuntu 系统（使用 Netplan）===

# ❶ 编辑 Netplan 配置文件
sudo vim /etc/netplan/01-netcfg.yaml

# ❷ 写入以下内容（注意缩进用空格，不能用 Tab）：
# network:
#   version: 2
#   renderer: networkd
#   ethernets:
#     eth0:
#       addresses:
#         - 192.168.1.100/24
#       gateway4: 192.168.1.1
#       nameservers:
#         addresses:
#           - 8.8.8.8
#           - 114.114.114.114

# ❸ 应用配置
sudo netplan apply

# ❹ 验证配置
ip addr show eth0
ip route
cat /etc/resolv.conf

# ❺ 开放防火墙 8080 端口
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload

# ❻ 验证防火墙规则
sudo firewall-cmd --list-all


# === 方式二：CentOS 系统（使用 nmcli）===

# ❶ 使用 nmcli 配置静态 IP
sudo nmcli connection modify eth0 \
  ipv4.addresses 192.168.1.100/24 \
  ipv4.gateway 192.168.1.1 \
  ipv4.dns "8.8.8.8 114.114.114.114" \
  ipv4.method manual

# ❷ 重启连接使配置生效
sudo nmcli connection up eth0

# ❸ 验证配置
ip addr show eth0

# ❹ 开放防火墙端口
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

</details>

### 练习 3（挑战）：网络故障排查

**题目**：假设你的 Linux 服务器无法访问外网（ping 不通 baidu.com）。请按照系统化的排查思路，找出问题所在并修复。

<details>
<summary>点击查看答案</summary>

```bash
# === 系统化排查思路 ===

# ❶ 第一步：检查 IP 配置
ip addr show
# 检查：网卡是否 UP？IP 地址是否正确？
# 如果网卡是 DOWN 状态：
sudo ip link set eth0 up

# ❷ 第二步：检查网关配置
ip route
# 检查：是否有 default via 这一行？网关 IP 是否正确？
# 如果没有默认网关：
sudo ip route add default via 192.168.1.1

# ❸ 第三步：测试网关连通性
ping -c 4 192.168.1.1
# 如果 ping 不通网关，说明本地网络有问题
# 可能原因：IP 地址配错了、网线没插好、交换机故障

# ❹ 第四步：检查 DNS 配置
cat /etc/resolv.conf
# 检查：是否有 nameserver？DNS 地址是否正确？
# 如果 DNS 配置正确但还是解析不了，试试直接 ping IP：
ping -c 4 8.8.8.8
# 如果能 ping 通 8.8.8.8 但 ping 不通 baidu.com，说明是 DNS 问题
# 临时修复：
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf

# ❺ 第五步：检查防火墙
sudo iptables -L -n
# 或
sudo firewall-cmd --list-all
# 检查：是否有 DROP 规则阻止了出站流量？

# ❻ 第六步：检查路由
ip route
# 检查：是否有正确的路由规则？
# 可以用 traceroute 看数据包在哪里断掉：
traceroute baidu.com

# ❼ 第七步：检查云服务安全组（如果是云服务器）
# 登录云控制台，检查安全组规则是否放行了出站流量

# === 常见问题速查表 ===
# 症状：ping 网关不通 → 本地网络问题（IP 配错/网线/交换机）
# 症状：ping 网关通，ping 外网 IP 不通 → 网关/路由器问题
# 症状：ping 外网 IP 通，ping 域名不通 → DNS 问题
# 症状：都通但浏览器打不开 → 可能是代理配置问题
```

排查网络问题的关键是"分段测试"：从自己开始，一段一段往外测，哪一段不通就是哪一段的问题。

</details>

---

## 下一章预告

下一章我们会学习 Linux 的 **磁盘与存储管理**。你会了解到如何查看磁盘使用情况、如何分区和格式化硬盘、如何挂载文件系统，以及如何使用 LVM 灵活管理磁盘空间。这些知识对于管理服务器存储至关重要，学完之后你就能轻松应对磁盘空间不足、新硬盘挂载等问题了。
