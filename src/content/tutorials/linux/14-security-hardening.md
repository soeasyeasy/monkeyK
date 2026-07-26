---
title: "第十四章：安全加固与防火墙"
description: "掌握 Linux 系统安全加固技术，包括用户权限管理、防火墙配置、SSH 安全加固以及系统安全审计"
---

# 第十四章：安全加固与防火墙

## 本章导读

在开始学习安全加固之前，你可能会有这些疑问：

1. **我的 Linux 服务器真的需要加固吗？** 只要连了网，就有被攻击的风险。每天都有自动化脚本在扫描互联网上的服务器，尝试暴力破解密码、寻找漏洞。
2. **防火墙到底能防什么？** 防火墙就像大楼的门卫，可以控制谁能进来、谁不能进来，但它不是万能的。
3. **SSH 有什么安全风险？** SSH 是远程管理服务器的主要方式，如果配置不当，黑客可以轻松入侵你的系统。
4. **安全加固会不会影响正常使用？** 加固过度确实会影响使用体验，关键是在安全和便利之间找到平衡。

本章会系统讲解 Linux 安全加固的核心技术。学完之后，你就能配置防火墙、加固 SSH、管理用户权限，构建一个安全的 Linux 系统。

## 为什么需要安全加固

### 不做安全加固会怎样

想象一下，你开了一家商店，但是：

- 大门没锁（没有防火墙）
- 钥匙放在门口脚垫下面（弱密码）
- 任何人都能进仓库（权限过大）
- 没有监控摄像头（没有审计日志）

结果就是：小偷可以轻松进入，拿走贵重物品，甚至破坏整个商店。在网络安全世界，这样的事情每天都在发生。

### 生活化类比：家庭安防系统

把 Linux 安全加固想象成家庭安防：

- **防火墙**：小区门禁系统，控制谁能进入小区
- **SSH 加固**：防盗门 + 智能锁，只让家人进入
- **用户权限**：每个房间有不同的锁，卧室只有主人能进
- **SELinux/AppArmor**：保险箱，即使小偷进了房间也打不开
- **安全审计**：监控摄像头，记录所有进出行为
- **系统更新**：定期更换锁芯，修补安全漏洞

### 安全加固的核心原则

| 原则 | 说明 | 类比 |
|------|------|------|
| 最小权限 | 只给必要的权限 | 只给员工开他们需要的门锁 |
| 纵深防御 | 多层安全措施 | 门禁 + 监控 + 保险箱 |
| 默认拒绝 | 不明确的都禁止 | 不认识的人一律不放行 |
| 定期审计 | 持续检查安全状况 | 定期巡检安防设备 |
| 及时更新 | 修补已知漏洞 | 发现锁有问题立即换 |

## 核心原理讲解

### Linux 安全体系的分层模型

Linux 的安全体系就像洋葱一样，有多层防护：

- **第一层（网络层）**：防火墙 -- 控制谁能访问你的服务器，就像小区门禁
- **第二层（主机层）**：SSH 加固 + 认证 -- 确保远程访问安全，就像防盗门
- **第三层（系统层）**：用户权限管理 -- 限制每个用户能做什么，就像房间钥匙
- **第四层（内核层）**：SELinux/AppArmor -- 即使程序被攻破，也限制其破坏范围，就像保险箱

每一层都有自己的职责，即使某一层被突破，还有其他层保护。这就是"纵深防御"的思想。

### 权限模型原理

Linux 的权限模型基于 **UGO + rwx** 体系：

```
文件权限：-rwxr-xr--
  │  │││││││││
  │  ─┬─┘└┬┘└┬┘
  │   │   │  └── 其他人(o)：只读
  │   │   └───── 组(g)：读+执行
  │   └───────── 所有者(u)：读+写+执行
  └───────────── 文件类型（- 普通文件，d 目录）
```

特殊权限：
- **SUID（4000）**：执行时以文件所有者身份运行（如 passwd 命令）
- **SGID（2000）**：执行时以文件所属组身份运行
- **Sticky Bit（1000）**：目录中只有文件所有者能删除自己的文件（如 /tmp）

### 防火墙工作原理

防火墙通过 **规则链** 工作，就像安检流程：

```
网络包进入 → INPUT 链 → 逐条匹配规则 → 匹配成功则执行动作
                                          ├─ ACCEPT（放行）
                                          ├─ DROP（丢弃，不回复）
                                          └─ REJECT（拒绝，回复错误）
                       → 无匹配 → 执行默认策略
```

规则匹配是从上到下的，一旦匹配就停止。所以规则的顺序非常重要：具体的规则放前面，通用的规则放后面。

### 安全加固的核心流程

```
评估风险 → 制定策略 → 实施加固 → 验证效果 → 持续监控
```

这就像装修房子的安防系统：先评估风险（住在哪里、周围治安如何），再制定方案（需要什么安防设备），然后安装调试，最后定期检查维护。

## 基础用法

### 用户权限管理

```bash
# ✅ 正确：创建普通用户并加入 sudo 组，用 sudo 管理
sudo useradd -m -G sudo admin
sudo passwd admin

# ❌ 错误：直接使用 root 账户进行日常操作
su - root

# ✅ 正确：设置强密码策略（至少 12 位，包含大小写、数字、特殊字符）
sudo vim /etc/security/pwquality.conf
# minlen = 12
# dcredit = -1
# ucredit = -1

# ❌ 错误：使用简单密码或空密码
sudo passwd admin    # 设置 "123456"
```

### 文件权限设置

```bash
# ✅ 正确：关键系统文件设置正确权限
sudo chmod 644 /etc/passwd       # 所有人可读，只有 root 可写
sudo chmod 640 /etc/shadow       # 只有 root 和 shadow 组可读
sudo chmod 440 /etc/sudoers      # 只读，不可写

# ❌ 错误：给系统文件过大权限
sudo chmod 777 /etc/passwd       # 所有人可读写执行（极其危险）
sudo chmod 666 /etc/shadow       # 所有人可读写（密码泄露风险）

# ✅ 正确：网站目录设置合理权限
sudo chown -R www-data:www-data /var/www/html
sudo find /var/www/html -type d -exec chmod 755 {} \;
sudo find /var/www/html -type f -exec chmod 644 {} \;

# ❌ 错误：网站目录设置为 777
sudo chmod -R 777 /var/www/html  # 任何人都可以修改网站文件
```

### SSH 安全配置

```bash
# ✅ 正确：生成 Ed25519 密钥（当前最推荐的算法）
ssh-keygen -t ed25519 -C "your_email@example.com"

# ❌ 错误：使用 RSA 1024 位密钥（已被认为不安全）
ssh-keygen -t rsa -b 1024

# ✅ 正确：SSH 配置禁用密码登录和 root 登录
sudo vim /etc/ssh/sshd_config
# PasswordAuthentication no
# PermitRootLogin no
# PubkeyAuthentication yes

# ❌ 错误：允许 root 密码登录（最容易被暴力破解的组合）
# PasswordAuthentication yes
# PermitRootLogin yes

# ✅ 正确：修改配置前先测试语法
sudo sshd -t

# ❌ 错误：直接重启 SSH 服务（配置错误会导致无法远程登录）
sudo systemctl restart sshd
```

### 防火墙配置

```bash
# ✅ 正确：UFW 默认拒绝入站，允许出站
sudo ufw default deny incoming
sudo ufw default allow outgoing

# ❌ 错误：不设置默认策略就直接添加规则
sudo ufw allow ssh               # 如果默认策略是 allow，其他端口也全开

# ✅ 正确：先允许 SSH，再启用防火墙（防止把自己锁在外面）
sudo ufw allow 2222/tcp
sudo ufw enable

# ❌ 错误：先启用防火墙，再允许 SSH（可能立即断开连接）
sudo ufw enable
sudo ufw allow 2222/tcp

# ✅ 正确：限制 SSH 连接频率防暴力破解
sudo ufw limit ssh

# ❌ 错误：不限制 SSH 连接频率
sudo ufw allow ssh
```

### fail2ban 配置

```bash
# ✅ 正确：配置 fail2ban 防护 SSH
sudo vim /etc/fail2ban/jail.local
# [sshd]
# enabled = true
# maxretry = 3
# bantime = 3600
# findtime = 600

# ❌ 错误：不安装 fail2ban，让服务器暴露在暴力破解攻击下
# 什么都不做

# ✅ 正确：定期检查 fail2ban 状态
sudo fail2ban-client status sshd

# ❌ 错误：安装后就不管了（可能配置有误或不生效）
```

## 用户与权限安全

### 用户管理安全

**禁止 root 直接登录**：

```bash
# 创建普通管理员用户
sudo useradd -m -G sudo admin    # Ubuntu/Debian
sudo useradd -m -G wheel admin   # CentOS/RHEL

# 设置密码
sudo passwd admin

# 测试新用户能否正常 sudo
su - admin
sudo whoami
```

**锁定不需要的用户账户**：

```bash
# 查看系统中的用户
cat /etc/passwd

# 锁定用户（禁止登录）
sudo usermod -L username

# 解锁用户
sudo usermod -U username

# 设置用户 shell 为 nologin（禁止登录但保留账户）
sudo usermod -s /usr/sbin/nologin username
```

**密码策略配置**：

```bash
# 安装密码质量模块
sudo apt install libpam-pwquality    # Ubuntu/Debian
sudo yum install pam_pwquality       # CentOS/RHEL

# 编辑 PAM 配置
sudo vim /etc/security/pwquality.conf

# 配置内容：
# minlen = 12       - 最小密码长度 12 位
# dcredit = -1      - 至少包含 1 个数字
# ucredit = -1      - 至少包含 1 个大写字母
# lcredit = -1      - 至少包含 1 个小写字母
# ocredit = -1      - 至少包含 1 个特殊字符
# maxrepeat = 3     - 最多允许 3 个连续相同字符
```

**密码过期策略**：

```bash
# 编辑登录配置
sudo vim /etc/login.defs

# 配置内容：
# PASS_MAX_DAYS   90    - 密码最长使用 90 天
# PASS_MIN_DAYS   7     - 密码修改后至少 7 天才能再改
# PASS_WARN_AGE   14    - 密码过期前 14 天开始警告

# 对已有用户设置密码过期
sudo chage -M 90 username        # 设置最大使用天数
sudo chage -W 14 username        # 设置警告天数
sudo chage -l username           # 查看用户密码策略
```

### 文件权限安全

**关键系统文件权限检查**：

```bash
# 检查 /etc/passwd 权限（应该是 644）
ls -la /etc/passwd
# ✅ 正确：-rw-r--r--
# ❌ 错误：-rw-rw-rw-（所有人可写）

# 检查 /etc/shadow 权限（应该是 640 或 600）
ls -la /etc/shadow
# ✅ 正确：-rw-r----- root:shadow
# ❌ 错误：-rw-r--r--（所有人可读）

# 检查 /etc/sudoers 权限（应该是 440）
ls -la /etc/sudoers
# ✅ 正确：-r--r----- root:root
# ❌ 错误：-rw-r--r--（可写）

# 修复权限
sudo chmod 644 /etc/passwd
sudo chmod 640 /etc/shadow
sudo chown root:shadow /etc/shadow
sudo chmod 440 /etc/sudoers
```

**查找权限异常的文件**：

```bash
# 查找全局可写的文件（危险）
find / -perm -o+w -type f 2>/dev/null

# 查找 SUID 文件（可能被利用提权）
find / -perm -4000 -type f 2>/dev/null

# 查找 SGID 文件
find / -perm -2000 -type f 2>/dev/null

# 查找没有所有者的文件
find / -nouser -o -nogroup 2>/dev/null
```

**限制 su 命令的使用**：

```bash
# 编辑 PAM 配置
sudo vim /etc/pam.d/su

# 添加以下行，只允许 wheel 组用户使用 su
auth required pam_wheel.so group=wheel

# 将需要的用户加入 wheel 组
sudo usermod -aG wheel username
```

## SSH 安全加固

### 修改 SSH 配置

**备份原始配置**：

```bash
# 备份 SSH 配置
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
```

**编辑 SSH 配置**：

```bash
sudo vim /etc/ssh/sshd_config
```

**关键配置项**：

```bash
# 修改默认端口（减少扫描攻击）
Port 2222                        # ✅ 改为非标准端口
# ❌ Port 22                     # 默认端口，容易被扫描

# 禁止 root 直接登录
PermitRootLogin no               # ✅ 禁止 root 登录
# ❌ PermitRootLogin yes         # 允许 root 登录，极其危险

# 禁用密码认证（使用密钥登录）
PasswordAuthentication no        # ✅ 只允许密钥登录
# ❌ PasswordAuthentication yes  # 允许密码登录，容易被暴力破解

# 启用公钥认证
PubkeyAuthentication yes         # ✅ 启用密钥认证

# 限制登录用户
AllowUsers admin deploy          # ✅ 只允许指定用户登录
# ❌ 不设置则允许所有用户

# 限制登录用户组
AllowGroups sshusers             # ✅ 只允许指定组登录

# 禁用空密码
PermitEmptyPasswords no          # ✅ 禁止空密码

# 设置登录超时
LoginGraceTime 60                # ✅ 60 秒内未完成登录则断开

# 限制最大认证次数
MaxAuthTries 3                   # ✅ 最多尝试 3 次

# 禁用 X11 转发（除非需要）
X11Forwarding no                 # ✅ 禁用 X11 转发

# 禁用 TCP 转发（除非需要）
AllowTcpForwarding no            # ✅ 禁用 TCP 转发

# 设置空闲超时
ClientAliveInterval 300          # ✅ 每 300 秒检查一次
ClientAliveCountMax 2            # ✅ 2 次无响应则断开
```

**重启 SSH 服务**：

```bash
# 重启前务必确认配置正确（防止把自己锁在外面）
sudo sshd -t                     # 测试配置文件语法

# 重启 SSH 服务
sudo systemctl restart sshd      # Ubuntu/Debian
sudo systemctl restart ssh       # CentOS/RHEL
```

### SSH 密钥管理

**生成 SSH 密钥对**：

```bash
# 生成 Ed25519 密钥（推荐）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 生成 RSA 4096 密钥（兼容性好）
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 指定文件名
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_server -C "server key"
```

**部署公钥到服务器**：

```bash
# 方法 1：使用 ssh-copy-id（最简单）
ssh-copy-id -i ~/.ssh/id_ed25519.pub admin@server_ip

# 方法 2：手动复制
cat ~/.ssh/id_ed25519.pub | ssh admin@server_ip "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

# 设置正确权限
ssh admin@server_ip "chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
```

**SSH 密钥安全**：

```bash
# 本地 .ssh 目录权限
chmod 700 ~/.ssh

# 私钥权限（必须严格）
chmod 600 ~/.ssh/id_ed25519
# ✅ -rw-------（只有所有者可读写）
# ❌ -rw-r--r--（其他人可读，密钥泄露）

# 公钥权限
chmod 644 ~/.ssh/id_ed25519.pub

# authorized_keys 权限
chmod 600 ~/.ssh/authorized_keys
```

### 使用 fail2ban 防暴力破解

**安装 fail2ban**：

```bash
# Ubuntu/Debian
sudo apt install fail2ban

# CentOS/RHEL
sudo yum install epel-release
sudo yum install fail2ban
```

**配置 fail2ban**：

```bash
# 复制默认配置
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# 编辑本地配置
sudo vim /etc/fail2ban/jail.local
```

**SSH 防护配置**：

```ini
[sshd]
enabled = true                          # 启用 SSH 防护
port = 2222                             # SSH 端口
filter = sshd                           # 使用 sshd 过滤器
logpath = /var/log/auth.log             # 日志路径
maxretry = 3                            # 最大失败次数
bantime = 3600                          # 封禁时间（秒）
findtime = 600                          # 检测时间窗口（秒）
banaction = iptables-multiport          # 封禁动作
```

**管理 fail2ban**：

```bash
# 启动 fail2ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# 查看状态
sudo fail2ban-client status

# 查看 SSH 防护状态
sudo fail2ban-client status sshd

# 手动解封 IP
sudo fail2ban-client set sshd unbanip 192.168.1.100

# 手动封禁 IP
sudo fail2ban-client set sshd banip 192.168.1.100

# 重新加载配置
sudo fail2ban-client reload
```

## 防火墙配置

### UFW 防火墙（Ubuntu/Debian 推荐）

**UFW 基础操作**：

```bash
# 查看 UFW 状态
sudo ufw status

# 查看详细信息
sudo ufw status verbose

# 查看编号（用于删除规则）
sudo ufw status numbered

# 启用 UFW
sudo ufw enable

# 禁用 UFW
sudo ufw disable

# 重置所有规则
sudo ufw reset
```

**配置默认策略**：

```bash
# 默认拒绝所有入站连接
sudo ufw default deny incoming

# 默认允许所有出站连接
sudo ufw default allow outgoing
```

**允许 SSH 连接**：

```bash
# 允许 SSH（默认 22 端口）
sudo ufw allow ssh

# 如果修改了 SSH 端口
sudo ufw allow 2222/tcp

# 限制 SSH 连接频率（防暴力破解）
sudo ufw limit ssh
```

**允许 Web 服务**：

```bash
# 允许 HTTP
sudo ufw allow http
sudo ufw allow 80/tcp

# 允许 HTTPS
sudo ufw allow https
sudo ufw allow 443/tcp

# 允许 Nginx Full（HTTP + HTTPS）
sudo ufw allow 'Nginx Full'

# 允许 Nginx HTTP
sudo ufw allow 'Nginx HTTP'
```

**允许特定 IP 访问**：

```bash
# 允许特定 IP 访问所有端口
sudo ufw allow from 192.168.1.100

# 允许特定 IP 访问特定端口
sudo ufw allow from 192.168.1.100 to any port 22

# 允许子网访问
sudo ufw allow from 192.168.1.0/24

# 拒绝特定 IP
sudo ufw deny from 10.0.0.100
```

**删除规则**：

```bash
# 按编号删除
sudo ufw status numbered
sudo ufw delete 3

# 按规则删除
sudo ufw delete allow http
sudo ufw delete allow 80/tcp
```

### iptables 防火墙

**iptables 基础概念**：

```bash
# 查看当前规则
sudo iptables -L -n -v

# 查看 NAT 表规则
sudo iptables -t nat -L -n -v

# 查看规则（带行号）
sudo iptables -L -n --line-numbers
```

**配置 iptables 规则**：

```bash
# 清除所有规则（谨慎操作）
sudo iptables -F              # 清除 filter 表
sudo iptables -X              # 清除自定义链
sudo iptables -t nat -F       # 清除 NAT 表

# 设置默认策略
sudo iptables -P INPUT DROP        # 默认拒绝入站
sudo iptables -P FORWARD DROP      # 默认拒绝转发
sudo iptables -P OUTPUT ACCEPT     # 默认允许出站

# 允许本地回环
sudo iptables -A INPUT -i lo -j ACCEPT

# 允许已建立的连接
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# 允许 SSH
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# 允许 HTTP/HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# 允许 ICMP（ping）
sudo iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT

# 丢弃无效包
sudo iptables -A INPUT -m state --state INVALID -j DROP
```

**保存 iptables 规则**：

```bash
# Ubuntu/Debian
sudo apt install iptables-persistent
sudo netfilter-persistent save

# CentOS/RHEL
sudo iptables-save > /etc/sysconfig/iptables
sudo systemctl enable iptables
```

### firewalld 防火墙（CentOS/RHEL 推荐）

**firewalld 基础操作**：

```bash
# 查看状态
sudo firewall-cmd --state

# 启动/停止
sudo systemctl start firewalld
sudo systemctl stop firewalld

# 设置开机启动
sudo systemctl enable firewalld

# 查看默认区域
sudo firewall-cmd --get-default-zone

# 查看活动区域
sudo firewall-cmd --get-active-zones
```

**配置 firewalld 规则**：

```bash
# 允许 SSH
sudo firewall-cmd --permanent --add-service=ssh

# 允许 HTTP/HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# 允许特定端口
sudo firewall-cmd --permanent --add-port=8080/tcp

# 允许 IP 范围
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="192.168.1.0/24" accept'

# 拒绝特定 IP
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="10.0.0.100" reject'

# 重新加载（使永久规则生效）
sudo firewall-cmd --reload

# 查看当前规则
sudo firewall-cmd --list-all
```

## SELinux 与 AppArmor

### SELinux（CentOS/RHEL）

**查看 SELinux 状态**：

```bash
# 查看当前状态
getenforce

# 查看详细状态
sestatus

# 查看 SELinux 模式
# Enforcing: 强制模式（正常保护）
# Permissive: 宽容模式（只记录不阻止）
# Disabled: 禁用
```

**管理 SELinux**：

```bash
# 临时设置为宽容模式（重启失效）
sudo setenforce 0

# 临时设置为强制模式
sudo setenforce 1

# 永久修改
sudo vim /etc/selinux/config
# SELINUX=enforcing    # 强制模式
# SELINUX=permissive   # 宽容模式
# SELINUX=disabled     # 禁用
```

**SELinux 常见问题处理**：

```bash
# 查看 SELinux 拒绝的操作
sudo grep denied /var/log/audit/audit.log

# 查看最近的拒绝
sudo ausearch -m AVC -ts recent

# 修复文件上下文
sudo restorecon -Rv /var/www/html

# 允许 Web 服务器访问网络
sudo setsebool -P httpd_can_network_connect 1
```

### AppArmor（Ubuntu/Debian）

**查看 AppArmor 状态**：

```bash
# 查看状态
sudo aa-status

# 查看已加载的配置
sudo apparmor_status
```

**管理 AppArmor**：

```bash
# 查看某个程序的配置
sudo aa-complain /usr/sbin/nginx       # 设置为投诉模式
sudo aa-enforce /usr/sbin/nginx        # 设置为强制模式

# 查看日志中的拒绝
sudo grep DENIED /var/log/kern.log | grep apparmor

# 禁用某个配置
sudo ln -s /etc/apparmor.d/usr.sbin.nginx /etc/apparmor.d/disable/
sudo apparmor_parser -R /etc/apparmor.d/usr.sbin.nginx
```

## 系统安全审计

### 安全审计工具

**lynis**：系统安全审计工具

```bash
# 安装 lynis
sudo apt install lynis          # Ubuntu/Debian
sudo yum install lynis          # CentOS/RHEL

# 运行审计
sudo lynis audit system

# 查看审计报告
cat /var/log/lynis.log

# 只运行特定测试
sudo lynis audit system --tests-from-group networking,storage
```

**chkrootkit**：检查 Rootkit

```bash
# 安装
sudo apt install chkrootkit

# 运行检查
sudo chkrootkit

# 检查特定项目
sudo chkrootkit -r /
```

**rkhunter**：检查 Rootkit 和后门

```bash
# 安装
sudo apt install rkhunter

# 更新数据库
sudo rkhunter --update

# 运行检查
sudo rkhunter --check

# 查看报告
sudo rkhunter --check --report-warnings-only
```

### 系统完整性检查

**AIDE（高级入侵检测环境）**：

```bash
# 安装 AIDE
sudo apt install aide

# 初始化数据库
sudo aideinit

# 复制初始数据库
sudo cp /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# 运行检查
sudo aide --check

# 更新数据库（在确认系统正常后）
sudo aide --update
sudo cp /var/lib/aide/aide.db.new /var/lib/aide/aide.db
```

### 定期安全扫描脚本

```bash
#!/bin/bash
# security_scan.sh - 定期安全扫描

REPORT="/tmp/security_scan_$(date +%Y%m%d).txt"

echo "=== 安全扫描报告 ===" > "$REPORT"
echo "时间: $(date)" >> "$REPORT"
echo "" >> "$REPORT"

# 1. 检查全局可写文件
echo "--- 全局可写文件 ---" >> "$REPORT"
find / -perm -o+w -type f 2>/dev/null | head -20 >> "$REPORT"
echo "" >> "$REPORT"

# 2. 检查 SUID 文件
echo "--- SUID 文件 ---" >> "$REPORT"
find / -perm -4000 -type f 2>/dev/null >> "$REPORT"
echo "" >> "$REPORT"

# 3. 检查空密码用户
echo "--- 空密码用户 ---" >> "$REPORT"
awk -F: '($2 == "") {print $1}' /etc/shadow >> "$REPORT" 2>/dev/null
echo "" >> "$REPORT"

# 4. 检查异常监听端口
echo "--- 监听端口 ---" >> "$REPORT"
ss -tlnp >> "$REPORT"
echo "" >> "$REPORT"

# 5. 检查最近登录
echo "--- 最近登录 ---" >> "$REPORT"
last -10 >> "$REPORT"
echo "" >> "$REPORT"

# 6. 检查失败登录
echo "--- 失败登录 ---" >> "$REPORT"
lastb -10 >> "$REPORT" 2>/dev/null
echo "" >> "$REPORT"

echo "扫描完成，报告: $REPORT"
```

## 对比表格

### 防火墙工具对比

| 工具 | 适用系统 | 易用性 | 功能 | 推荐场景 |
|------|----------|--------|------|----------|
| UFW | Ubuntu/Debian | 简单 | 基础 | 单机服务器 |
| iptables | 所有 Linux | 复杂 | 强大 | 高级用户 |
| firewalld | CentOS/RHEL | 中等 | 强大 | 企业服务器 |
| nftables | 新内核 | 中等 | 最强 | 未来趋势 |

### 安全加固措施对比

| 措施 | 防护目标 | 复杂度 | 影响 |
|------|----------|--------|------|
| 禁用 root 登录 | 防提权 | 低 | 低 |
| 使用密钥认证 | 防暴力破解 | 中 | 低 |
| 配置防火墙 | 防未授权访问 | 中 | 中 |
| 启用 fail2ban | 防暴力破解 | 低 | 低 |
| SELinux/AppArmor | 防漏洞利用 | 高 | 高 |
| 定期更新 | 修补漏洞 | 低 | 低 |

## 新手常见误区

### 误区 1：只靠防火墙就安全了

防火墙只是第一道防线，不能防止所有攻击。如果应用本身有漏洞（如 SQL 注入），防火墙也挡不住。正确的做法是：

- 多层防御（防火墙 + 应用安全 + 系统加固）
- 定期更新系统和应用
- 监控异常行为

### 误区 2：修改 SSH 端口就万事大吉

修改 SSH 端口只能减少被扫描的次数，不能阻止有目的的攻击。正确的做法是：

- 使用密钥认证（最重要）
- 禁用密码登录
- 使用 fail2ban
- 限制登录用户

### 误区 3：权限设置越严格越好

过度严格的权限会导致服务无法正常运行。例如，Web 服务器需要读取网站文件，如果权限太严格，网站就打不开。正确的做法是：

- 遵循最小权限原则
- 了解每个服务需要的权限
- 测试后再上线

### 误区 4：禁用了 SELinux 就没事了

SELinux 确实会带来一些麻烦，但它是重要的安全层。禁用 SELinux 等于拆掉了保险箱的门。正确的做法是：

- 学习 SELinux 的基本使用
- 遇到问题先尝试修复上下文，而不是禁用
- 使用宽容模式调试，生产环境用强制模式

### 误区 5：安全加固是一次性的工作

安全加固不是一次配置就完事了。新的漏洞每天都在被发现，攻击手段也在不断进化。正确的做法是：

- 定期更新系统
- 定期审计安全配置
- 关注安全公告
- 持续监控异常行为

## 动手练习

### 练习 1：基础 - SSH 安全加固

**任务**：修改 SSH 配置，实现以下安全要求：
- 修改 SSH 端口为 2222
- 禁止 root 登录
- 只允许 admin 用户登录
- 设置登录超时为 60 秒

<details>
<summary>点击查看答案</summary>

```bash
# 1. 备份配置
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# 2. 编辑配置
sudo vim /etc/ssh/sshd_config

# 修改以下内容：
Port 2222
PermitRootLogin no
AllowUsers admin
LoginGraceTime 60

# 3. 测试配置
sudo sshd -t

# 4. 重启服务
sudo systemctl restart sshd

# 5. 测试新配置（不要关闭当前连接）
ssh -p 2222 admin@server_ip
```

</details>

### 练习 2：进阶 - 配置 UFW 防火墙

**任务**：配置 UFW 防火墙，实现以下规则：
- 默认拒绝所有入站
- 允许 SSH（2222 端口）
- 允许 HTTP/HTTPS
- 允许特定 IP（192.168.1.100）访问所有端口
- 限制 SSH 连接频率

<details>
<summary>点击查看答案</summary>

```bash
# 1. 重置规则
sudo ufw reset

# 2. 设置默认策略
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 3. 允许 SSH（限制频率）
sudo ufw limit 2222/tcp

# 4. 允许 HTTP/HTTPS
sudo ufw allow http
sudo ufw allow https

# 5. 允许特定 IP
sudo ufw allow from 192.168.1.100

# 6. 启用防火墙
sudo ufw enable

# 7. 查看规则
sudo ufw status verbose
```

</details>

### 练习 3：挑战 - 搭建完整安全加固方案

**任务**：为一台新的 Linux 服务器搭建完整的安全加固方案，包括：
- 用户权限管理
- SSH 安全配置
- 防火墙配置
- fail2ban 安装配置
- 定期安全扫描

<details>
<summary>点击查看答案</summary>

```bash
#!/bin/bash
# security_hardening.sh - 完整安全加固脚本

# 1. 创建管理员用户
useradd -m -G sudo admin
passwd admin

# 2. SSH 安全配置
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
cat > /tmp/sshd_config << 'EOF'
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers admin
LoginGraceTime 60
MaxAuthTries 3
X11Forwarding no
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
mv /tmp/sshd_config /etc/ssh/sshd_config
sshd -t && systemctl restart sshd

# 3. 防火墙配置
ufw reset
ufw default deny incoming
ufw default allow outgoing
ufw limit 2222/tcp
ufw allow http
ufw allow https
ufw --force enable

# 4. 安装 fail2ban
apt install -y fail2ban
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
systemctl enable fail2ban
systemctl start fail2ban

# 5. 安装安全工具
apt install -y lynis rkhunter chkrootkit

# 6. 创建安全扫描脚本
cat > /usr/local/bin/security_scan.sh << 'SCRIPT'
#!/bin/bash
find / -perm -o+w -type f 2>/dev/null | head -20
find / -perm -4000 -type f 2>/dev/null
ss -tlnp
last -10
SCRIPT
chmod +x /usr/local/bin/security_scan.sh

# 7. 添加定时任务
echo "0 2 * * * /usr/local/bin/security_scan.sh > /tmp/security_scan.log 2>&1" | crontab -

echo "安全加固完成！"
```

</details>

## 下一章预告

下一章我们将学习 **性能调优与故障排查**。安全加固让系统更可靠，而性能调优让系统更快。我们会学习如何监控系统性能、分析瓶颈、优化配置，以及排查常见的系统故障。
