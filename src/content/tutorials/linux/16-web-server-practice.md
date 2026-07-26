---
title: "第十六章：综合实战 - 搭建 Web 服务器"
description: "综合运用前面学到的知识，从零搭建一个生产级别的 Web 服务器环境，包括 Nginx、PHP、MySQL 的完整配置"
---

# 第十六章：综合实战 - 搭建 Web 服务器

## 本章导读

在开始实战之前，你可能会有这些疑问：

1. **前面学了很多零散的知识，怎么把它们串起来？** 日志管理、安全加固、性能调优，这些知识单独学的时候感觉很有用，但实际搭建服务器时怎么综合运用？
2. **搭建一个 Web 服务器到底需要哪些组件？** Nginx、PHP、MySQL，还有什么？它们之间怎么配合工作？
3. **怎么保证搭建的服务器既安全又高效？** 默认配置往往不够安全，也不够高效，需要怎么调整？
4. **搭建完成后怎么验证和测试？** 怎么确认所有组件都正常工作？怎么测试性能？

本章是 Linux 教程的收官之作，会带你从零开始，一步步搭建一个生产级别的 Web 服务器。学完之后，你就能独立完成服务器的搭建、配置、优化和维护。

## 为什么需要综合实战

### 没有实战会怎样

想象一下，你学了很多武术招式：

- 学会了出拳（日志管理）
- 学会了防守（安全加固）
- 学会了步法（性能调优）

但是，如果你从来不打实战，上了擂台还是会手忙脚乱。知识也是一样，只有通过实战才能真正掌握。

### 生活化类比：装修房子

把搭建 Web 服务器想象成装修房子：

- **系统安装**：打地基、建框架
- **Nginx 配置**：装修客厅，接待客人
- **PHP 配置**：安装厨房，处理业务逻辑
- **MySQL 配置**：建造仓库，存储数据
- **安全加固**：安装门锁、监控
- **性能优化**：优化动线、提升舒适度
- **日志监控**：安装摄像头、报警器

每个环节都很重要，缺一不可。只有综合运用各种知识，才能打造出一个安全、高效、稳定的 Web 服务器。

### 实战的核心目标

| 目标 | 说明 | 类比 |
|------|------|------|
| 功能完整 | 所有组件正常工作 | 房子能住人 |
| 安全可靠 | 防止被攻击 | 门锁牢固 |
| 性能优良 | 响应速度快 | 住得舒适 |
| 易于维护 | 方便后续管理 | 装修合理 |
| 可扩展 | 能应对流量增长 | 预留扩展空间 |

## 核心原理讲解

### LNMP 架构原理

搭建 Web 服务器的核心是理解 LNMP 各组件的协作关系。把它想象成一家餐厅：

- **Nginx（前台接待）**：接待客人（HTTP 请求），决定谁来处理。静态文件直接端上去，动态请求转给后厨
- **PHP-FPM（厨师团队）**：接收 Nginx 转来的请求，执行业务逻辑，生成动态内容
- **MySQL（仓库管理员）**：管理数据存储，响应 PHP 的查询请求
- **Linux（餐厅建筑）**：提供运行环境，管理硬件资源

每个组件各司其职，通过明确的接口通信。Nginx 通过 FastCGI 协议与 PHP-FPM 通信，PHP 通过 SQL 协议与 MySQL 通信。

### 请求处理流程

```
客户端 → Nginx（80/443 端口）
            │
            ├─ 静态文件（.html/.css/.js）→ 直接返回文件内容
            │
            └─ 动态请求（.php）→ FastCGI → PHP-FPM
                                            │
                                            ├─ 执行业务逻辑
                                            │
                                            └─ 查询数据 → MySQL
                                                          │
                                                          └─ 返回数据
                                            │
                                            └─ 生成 HTML 响应
            │
            └─ 返回给客户端
```

理解这个流程非常重要。当网站出问题时，你可以根据流程逐步排查：Nginx 是否正常 → PHP-FPM 是否正常 → MySQL 是否正常。

### 安全加固原理

Web 服务器的安全加固遵循 **最小暴露原则**：

- **网络层**：只开放必要端口（80、443），关闭其他端口
- **应用层**：隐藏版本信息，禁止目录浏览
- **文件层**：Web 目录只给 www-data 用户读写权限
- **数据库层**：只允许 localhost 连接，使用独立用户

### 性能优化原理

Web 服务器性能优化的核心是 **减少等待**：

- **Nginx 优化**：使用 epoll 事件模型，一个进程处理 thousands 个连接
- **PHP-FPM 优化**：合理配置进程数，避免过多或过少
- **MySQL 优化**：把常用数据放在内存中（buffer pool），减少磁盘 IO
- **缓存**：把计算结果缓存起来，避免重复计算

## 基础用法

### Nginx 虚拟主机配置

```bash
# ✅ 正确：创建独立的虚拟主机配置文件
sudo vim /etc/nginx/sites-available/example.com
# server {
#     listen 80;
#     server_name example.com www.example.com;
#     root /var/www/example.com/html;
#     index index.html;
#     location / {
#         try_files $uri $uri/ =404;
#     }
# }

# ❌ 错误：把所有站点配置写在 nginx.conf 主配置文件中
# 主配置文件会变得混乱，难以维护

# ✅ 正确：用 sites-available 和 sites-enabled 管理站点
sudo ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/

# ❌ 错误：直接编辑 sites-enabled 中的文件
# 应该编辑 sites-available，通过软链接启用

# ✅ 正确：修改配置后先测试再重载
sudo nginx -t && sudo systemctl reload nginx

# ❌ 错误：不测试直接重载（配置错误可能导致服务中断）
sudo systemctl reload nginx
```

### PHP-FPM 配置

```bash
# ✅ 正确：使用 Unix Socket 通信（性能更好）
listen = /run/php/php8.2-fpm.sock

# ❌ 错误：使用 TCP Socket（多了一层网络协议开销）
listen = 127.0.0.1:9000
# 除非 Nginx 和 PHP-FPM 不在同一台机器上，否则用 Unix Socket

# ✅ 正确：根据服务器内存合理配置进程数
pm = dynamic
pm.max_children = 50            # 约等于 可用内存(MB) / 50
pm.start_servers = 10
pm.min_spare_servers = 5
pm.max_spare_servers = 20

# ❌ 错误：max_children 设置过大（内存不足导致 OOM）
pm.max_children = 500            # 每个 PHP 进程约 20-50MB，500 个需要 10-25GB
```

### MySQL 安全配置

```bash
# ✅ 正确：为每个应用创建独立的数据库和用户
CREATE DATABASE app_db;
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'StrongPass123!';
GRANT ALL PRIVILEGES ON app_db.* TO 'app_user'@'localhost';

# ❌ 错误：所有应用共用 root 账户
# 直接在代码中使用 root 连接数据库（一旦泄露，所有数据都危险）

# ✅ 正确：运行安全向导初始化 MySQL
sudo mysql_secure_installation

# ❌ 错误：安装后直接使用默认配置
# 默认配置有匿名账户、测试数据库等安全隐患

# ✅ 正确：配置慢查询日志找出性能问题
slow_query_log = 1
long_query_time = 2

# ❌ 错误：不记录慢查询（性能问题无法定位）
```

### 防火墙配置

```bash
# ✅ 正确：只开放必要端口
sudo ufw allow 2222/tcp          # SSH（已改端口）
sudo ufw allow http              # HTTP
sudo ufw allow https             # HTTPS
sudo ufw default deny incoming   # 默认拒绝其他

# ❌ 错误：开放过多端口
sudo ufw allow 1:65535/tcp       # 开放所有端口（等于没有防火墙）

# ✅ 正确：限制 SSH 连接频率
sudo ufw limit 2222/tcp

# ❌ 错误：不限制 SSH 连接频率
sudo ufw allow 2222/tcp          # 容易被暴力破解
```

### 网站目录权限

```bash
# ✅ 正确：网站文件归属 www-data 用户
sudo chown -R www-data:www-data /var/www/example.com
sudo find /var/www/example.com -type d -exec chmod 755 {} \;
sudo find /var/www/example.com -type f -exec chmod 644 {} \;

# ❌ 错误：网站目录设置为 777
sudo chmod -R 777 /var/www/example.com    # 任何人都可以修改文件

# ✅ 正确：禁止上传目录执行 PHP
# 在 Nginx 配置中添加：
# location ~* /uploads/ {
#     location ~ \.php$ { deny all; }
# }

# ❌ 错误：允许上传目录执行 PHP（上传的恶意脚本会被执行）
```

### 服务监控

```bash
# ✅ 正确：创建自动监控脚本，定期检查服务状态
# 检查 Nginx、PHP-FPM、MySQL 是否运行，异常时自动重启
sudo vim /usr/local/bin/webserver_monitor.sh

# ❌ 错误：等服务挂了用户反馈才知道
# 不设置任何监控

# ✅ 正确：配置 cron 定时执行监控
crontab -e
# */5 * * * * /usr/local/bin/webserver_monitor.sh

# ❌ 错误：手动检查服务状态
# 每天登录服务器看一眼（容易遗漏）
```

## 实战环境准备

### 系统选择

**推荐系统**：

```bash
# Ubuntu Server 22.04 LTS（长期支持版）
# 优点：
# - 社区活跃，文档丰富
# - 软件包较新
# - 适合新手

# CentOS Stream 9 / Rocky Linux 9
# 优点：
# - 企业级稳定性
# - 长期支持
# - 适合生产环境
```

**最低配置要求**：

```bash
# CPU: 1 核
# 内存: 1GB（推荐 2GB）
# 磁盘: 20GB
# 网络: 100Mbps
```

### 系统更新

**更新系统**：

```bash
# Ubuntu/Debian
sudo apt update              # 更新软件包列表
sudo apt upgrade -y          # 升级所有软件包
sudo apt dist-upgrade -y     # 升级系统（如有必要）
sudo apt autoremove -y       # 清理不需要的软件包

# CentOS/RHEL
sudo yum update -y           # 更新所有软件包
sudo yum upgrade -y          # 升级系统（如有必要）
```

### 设置时区和主机名

```bash
# 设置时区
sudo timedatectl set-timezone Asia/Shanghai

# 验证时区
timedatectl

# 设置主机名
sudo hostnamectl set-hostname webserver

# 验证主机名
hostnamectl
```

## 安装和配置 Nginx

### 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx -y

# CentOS/RHEL
sudo yum install epel-release -y
sudo yum install nginx -y

# 验证安装
nginx -v

# 启动 Nginx
sudo systemctl start nginx

# 设置开机启动
sudo systemctl enable nginx

# 查看状态
sudo systemctl status nginx
```

### 配置防火墙

```bash
# UFW（Ubuntu）
sudo ufw allow 'Nginx Full'
sudo ufw status

# firewalld（CentOS）
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 测试 Nginx

```bash
# 在浏览器访问
# http://server_ip

# 或命令行测试
curl http://localhost
```

### Nginx 目录结构

```bash
# 主配置文件
/etc/nginx/nginx.conf

# 站点配置目录
/etc/nginx/sites-available/     # 可用站点
/etc/nginx/sites-enabled/       # 启用站点

# 日志目录
/var/log/nginx/access.log       # 访问日志
/var/log/nginx/error.log        # 错误日志

# 网站根目录
/var/www/html                   # 默认网站目录
```

### 配置虚拟主机

**创建网站目录**：

```bash
# 创建网站目录
sudo mkdir -p /var/www/example.com/html

# 设置权限
sudo chown -R www-data:www-data /var/www/example.com
sudo chmod -R 755 /var/www/example.com

# 创建测试页面
sudo vim /var/www/example.com/html/index.html
```

**测试页面内容**：

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to example.com</title>
</head>
<body>
    <h1>Success! The example.com virtual host is working.</h1>
</body>
</html>
```

**创建虚拟主机配置**：

```bash
sudo vim /etc/nginx/sites-available/example.com
```

**配置文件内容**：

```nginx
server {
    listen 80;                              # 监听 80 端口
    listen [::]:80;                         # 监听 IPv6 80 端口

    root /var/www/example.com/html;         # 网站根目录
    index index.html index.htm;             # 默认首页

    server_name example.com www.example.com; # 域名

    # 访问日志
    access_log /var/log/nginx/example.com.access.log;
    error_log /var/log/nginx/example.com.error.log;

    location / {
        try_files $uri $uri/ =404;          # 尝试文件，不存在返回 404
    }
}
```

**启用虚拟主机**：

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

### Nginx 性能优化

**编辑主配置文件**：

```bash
sudo vim /etc/nginx/nginx.conf
```

**优化配置**：

```nginx
# 工作进程数（自动匹配 CPU 核心数）
worker_processes auto;

# 最大文件描述符
worker_rlimit_nofile 65535;

events {
    # 每个进程的最大连接数
    worker_connections 4096;

    # 使用 epoll 事件模型（Linux 推荐）
    use epoll;

    # 一次接受多个连接
    multi_accept on;
}

http {
    # 基础配置
    sendfile on;                            # 高效文件传输
    tcp_nopush on;                          # 优化 TCP 传输
    tcp_nodelay on;                         # 禁用 Nagle 算法
    keepalive_timeout 65;                   # 长连接超时
    types_hash_max_size 2048;

    # 缓冲区
    client_body_buffer_size 10K;
    client_header_buffer_size 1k;
    client_max_body_size 8m;
    large_client_header_buffers 2 1k;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent"';

    access_log /var/log/nginx/access.log main;

    # 包含站点配置
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

**验证并重载**：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 安装和配置 PHP

### 安装 PHP

```bash
# Ubuntu/Debian
sudo apt install php-fpm php-mysql php-cli php-common -y

# 安装常用扩展
sudo apt install php-curl php-gd php-mbstring php-xml php-zip -y

# CentOS/RHEL
sudo yum install epel-release -y
sudo yum install https://rpms.remirepo.net/enterprise/remi-release-9.rpm -y
sudo yum module enable php:remi-8.2 -y
sudo yum install php-fpm php-mysqlnd php-cli php-common -y
sudo yum install php-curl php-gd php-mbstring php-xml php-zip -y

# 验证安装
php -v
```

### 配置 PHP-FPM

**编辑配置文件**：

```bash
# Ubuntu/Debian
sudo vim /etc/php/8.2/fpm/pool.d/www.conf

# CentOS/RHEL
sudo vim /etc/php-fpm.d/www.conf
```

**关键配置**：

```ini
[www]
; 用户和组
user = www-data
group = www-data

; 监听方式
listen = /run/php/php8.2-fpm.sock          # Unix socket（推荐）
; listen = 127.0.0.1:9000                  # TCP socket

; 权限
listen.owner = www-data
listen.group = www-data
listen.mode = 0660

; 进程管理
pm = dynamic                                # 动态管理进程
pm.max_children = 50                        # 最大子进程数
pm.start_servers = 10                       # 启动时进程数
pm.min_spare_servers = 5                    # 最小空闲进程
pm.max_spare_servers = 20                   # 最大空闲进程
pm.max_requests = 500                       # 每个进程处理的最大请求数
```

**重启 PHP-FPM**：

```bash
sudo systemctl restart php8.2-fpm          # Ubuntu/Debian
sudo systemctl restart php-fpm             # CentOS/RHEL
sudo systemctl enable php8.2-fpm
```

### 配置 Nginx 支持 PHP

**编辑虚拟主机配置**：

```bash
sudo vim /etc/nginx/sites-available/example.com
```

**添加 PHP 支持**：

```nginx
server {
    listen 80;
    listen [::]:80;

    root /var/www/example.com/html;
    index index.php index.html index.htm;

    server_name example.com www.example.com;

    access_log /var/log/nginx/example.com.access.log;
    error_log /var/log/nginx/example.com.error.log;

    location / {
        try_files $uri $uri/ =404;
    }

    # PHP 处理
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;

        # 性能优化
        fastcgi_buffer_size 128k;
        fastcgi_buffers 256 16k;
        fastcgi_busy_buffers_size 256k;
    }

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

**测试 PHP**：

```bash
# 创建测试文件
sudo vim /var/www/example.com/html/info.php
```

**测试文件内容**：

```php
<?php
phpinfo();
?>
```

**访问测试**：

```bash
# 浏览器访问
# http://example.com/info.php

# 测试完成后删除（安全考虑）
sudo rm /var/www/example.com/html/info.php
```

## 安装和配置 MySQL

### 安装 MySQL

```bash
# Ubuntu/Debian
sudo apt install mysql-server mysql-client -y

# CentOS/RHEL
sudo yum install mysql-server mysql-client -y

# 启动 MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 查看状态
sudo systemctl status mysql
```

### 初始安全配置

**运行安全向导**：

```bash
sudo mysql_secure_installation
```

**配置选项**：

```bash
# 1. 设置 root 密码
# 选择 Y，设置强密码

# 2. 移除匿名账户
# 选择 Y

# 3. 禁止 root 远程登录
# 选择 Y（推荐）

# 4. 移除测试数据库
# 选择 Y

# 5. 重新加载权限表
# 选择 Y
```

### 创建数据库和用户

**登录 MySQL**：

```bash
sudo mysql
```

**SQL 命令**：

```sql
-- 创建数据库
CREATE DATABASE example_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'example_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';

-- 授权
GRANT ALL PRIVILEGES ON example_db.* TO 'example_user'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 退出
EXIT;
```

### MySQL 性能优化

**编辑配置文件**：

```bash
sudo vim /etc/mysql/mysql.conf.d/mysqld.cnf    # Ubuntu/Debian
sudo vim /etc/my.cnf                            # CentOS/RHEL
```

**优化配置**：

```ini
[mysqld]
# 基础配置
user = mysql
pid-file = /var/run/mysqld/mysqld.pid
socket = /var/run/mysqld/mysqld.sock
basedir = /usr
datadir = /var/lib/mysql
tmpdir = /tmp

# 连接数
max_connections = 500
max_connect_errors = 100000

# InnoDB 配置
innodb_buffer_pool_size = 1G                    # 物理内存的 50-70%
innodb_log_buffer_size = 16M
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2              # 性能优先
innodb_file_per_table = 1

# 查询缓存（MySQL 8.0 已移除）
# query_cache_size = 0

# 线程
innodb_thread_concurrency = 0
thread_cache_size = 8

# 临时表
tmp_table_size = 64M
max_heap_table_size = 64M

# 日志
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# 字符集
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
```

**重启 MySQL**：

```bash
sudo systemctl restart mysql
```

## 安全加固

### SSH 安全配置

```bash
# 备份配置
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# 编辑配置
sudo vim /etc/ssh/sshd_config
```

**安全配置**：

```bash
# 修改端口
Port 2222

# 禁止 root 登录
PermitRootLogin no

# 禁用密码认证
PasswordAuthentication no

# 启用密钥认证
PubkeyAuthentication yes

# 限制登录用户
AllowUsers admin deploy

# 登录超时
LoginGraceTime 60

# 最大认证次数
MaxAuthTries 3

# 禁用 X11 转发
X11Forwarding no

# 空闲超时
ClientAliveInterval 300
ClientAliveCountMax 2
```

**重启 SSH**：

```bash
sudo sshd -t
sudo systemctl restart sshd
```

### 配置防火墙

```bash
# UFW（Ubuntu）
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw limit 2222/tcp
sudo ufw allow http
sudo ufw allow https
sudo ufw --force enable

# 查看状态
sudo ufw status verbose
```

### 安装 fail2ban

```bash
# 安装
sudo apt install fail2ban -y

# 配置
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo vim /etc/fail2ban/jail.local
```

**SSH 防护配置**：

```ini
[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
```

**启动 fail2ban**：

```bash
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
sudo fail2ban-client status
```

### 文件权限安全

```bash
# 网站目录权限
sudo chown -R www-data:www-data /var/www/example.com
sudo find /var/www/example.com -type d -exec chmod 755 {} \;
sudo find /var/www/example.com -type f -exec chmod 644 {} \;

# 配置文件权限
sudo chmod 640 /etc/nginx/sites-available/*
sudo chmod 640 /etc/php/*/fpm/pool.d/*

# 禁止执行上传目录
sudo vim /etc/nginx/sites-available/example.com
```

**添加配置**：

```nginx
location ~* /uploads/ {
    location ~ \.php$ {
        deny all;
    }
}
```

## 性能优化

### 系统级优化

```bash
# 内核参数
sudo vim /etc/sysctl.conf
```

**添加配置**：

```ini
# 文件描述符
fs.file-max = 2097152

# 网络
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 1024 65535

# 虚拟内存
vm.swappiness = 10
```

**应用配置**：

```bash
sudo sysctl -p
```

### 文件描述符限制

```bash
sudo vim /etc/security/limits.conf
```

**添加配置**：

```ini
* soft nofile 65535
* hard nofile 65535
root soft nofile 65535
root hard nofile 65535
```

### Nginx 缓存配置

```bash
sudo vim /etc/nginx/conf.d/cache.conf
```

**缓存配置**：

```nginx
# 缓存路径和参数
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m use_temp_path=off;

# 在 server 块中使用
location / {
    proxy_cache my_cache;
    proxy_cache_valid 200 60m;
    proxy_cache_valid 404 1m;
    add_header X-Cache-Status $upstream_cache_status;
}
```

## 监控和日志

### 配置日志轮转

```bash
sudo vim /etc/logrotate.d/nginx
```

**轮转配置**：

```bash
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

### 安装监控工具

```bash
# 安装 htop
sudo apt install htop -y

# 安装 iotop
sudo apt install iotop -y

# 安装 iftop
sudo apt install iftop -y

# 安装 sysstat（包含 sar、iostat）
sudo apt install sysstat -y
```

### 创建监控脚本

```bash
sudo vim /usr/local/bin/webserver_monitor.sh
```

**监控脚本**：

```bash
#!/bin/bash
# webserver_monitor.sh - Web 服务器监控

LOG="/var/log/webserver_monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# 检查 Nginx
if ! systemctl is-active --quiet nginx; then
    echo "[$DATE] Nginx is down!" >> "$LOG"
    sudo systemctl start nginx
fi

# 检查 PHP-FPM
if ! systemctl is-active --quiet php8.2-fpm; then
    echo "[$DATE] PHP-FPM is down!" >> "$LOG"
    sudo systemctl start php8.2-fpm
fi

# 检查 MySQL
if ! systemctl is-active --quiet mysql; then
    echo "[$DATE] MySQL is down!" >> "$LOG"
    sudo systemctl start mysql
fi

# 检查磁盘空间
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "[$DATE] Disk usage is ${DISK_USAGE}%" >> "$LOG"
fi

# 检查内存
MEM_USAGE=$(free | grep Mem | awk '{print $3/$2 * 100.0}')
if [ $(echo "$MEM_USAGE > 90" | bc) -eq 1 ]; then
    echo "[$DATE] Memory usage is ${MEM_USAGE}%" >> "$LOG"
fi
```

**设置权限和定时任务**：

```bash
sudo chmod +x /usr/local/bin/webserver_monitor.sh

# 添加定时任务
crontab -e
# 每 5 分钟执行一次
*/5 * * * * /usr/local/bin/webserver_monitor.sh
```

## 对比表格

### Web 服务器组件对比

| 组件 | 作用 | 替代方案 | 选择建议 |
|------|------|----------|----------|
| Nginx | Web 服务器 | Apache, LiteSpeed | 高性能、低资源 |
| PHP-FPM | PHP 处理器 | mod_php, HHVM | 生产环境首选 |
| MySQL | 数据库 | MariaDB, PostgreSQL | 最流行的关系型数据库 |
| Redis | 缓存 | Memcached | 高性能键值存储 |

### 安全加固措施对比

| 措施 | 防护目标 | 复杂度 | 影响 |
|------|----------|--------|------|
| SSH 密钥认证 | 防暴力破解 | 中 | 低 |
| 防火墙 | 防未授权访问 | 中 | 中 |
| fail2ban | 防暴力破解 | 低 | 低 |
| 文件权限 | 防未授权修改 | 低 | 低 |
| HTTPS | 防数据泄露 | 中 | 低 |

## 新手常见误区

### 误区 1：使用默认配置上线

很多新手安装完 Nginx、PHP、MySQL 就直接上线，使用默认配置。默认配置往往不够安全，也不够高效。正确的做法是：

- 根据实际需求调整配置
- 进行安全加固
- 进行性能优化
- 测试后再上线

### 误区 2：忽视日志管理

日志文件会不断增长，如果不加管理，会占满磁盘空间。正确的做法是：

- 配置日志轮转
- 定期清理旧日志
- 使用日志分析工具

### 误区 3：不备份数据

数据是最重要的资产，一旦丢失可能无法恢复。正确的做法是：

- 定期备份数据库
- 备份网站文件
- 备份配置文件
- 测试恢复流程

### 误区 4：过度优化

有些新手看到优化教程就照搬，结果导致系统不稳定。正确的做法是：

- 先监控，找出瓶颈
- 针对性优化
- 优化后验证效果
- 逐步调整，不要一次改太多

### 误区 5：忽视安全更新

系统和软件的安全更新会修复已知漏洞，不及时更新会增加被攻击的风险。正确的做法是：

- 定期检查更新
- 及时安装安全补丁
- 使用自动更新（谨慎配置）

## 动手练习

### 练习 1：基础 - 搭建静态网站

**任务**：搭建一个简单的静态网站，包括首页、关于页面、联系页面。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建网站目录
sudo mkdir -p /var/www/mysite/html

# 2. 创建页面文件
sudo vim /var/www/mysite/html/index.html
```

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>My Website</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <nav>
        <a href="index.html">Home</a>
        <a href="about.html">About</a>
        <a href="contact.html">Contact</a>
    </nav>
    <h1>Welcome to My Website</h1>
    <p>This is the home page.</p>
</body>
</html>
```

```bash
# 3. 创建其他页面
sudo vim /var/www/mysite/html/about.html
sudo vim /var/www/mysite/html/contact.html

# 4. 创建 CSS
sudo vim /var/www/mysite/html/style.css
```

```css
body { font-family: Arial, sans-serif; margin: 20px; }
nav a { margin-right: 10px; }
```

```bash
# 5. 设置权限
sudo chown -R www-data:www-data /var/www/mysite
sudo chmod -R 755 /var/www/mysite

# 6. 配置 Nginx
sudo vim /etc/nginx/sites-available/mysite
```

```nginx
server {
    listen 80;
    root /var/www/mysite/html;
    index index.html;
    server_name mysite.local;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

```bash
# 7. 启用站点
sudo ln -s /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

</details>

### 练习 2：进阶 - 搭建 WordPress

**任务**：搭建一个 WordPress 博客系统。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 安装依赖
sudo apt install php-gd php-xml php-xmlrpc php-soap php-intl php-mbstring -y

# 2. 下载 WordPress
cd /tmp
wget https://wordpress.org/latest.tar.gz
tar xzf latest.tar.gz

# 3. 移动到网站目录
sudo mv wordpress /var/www/blog
sudo chown -R www-data:www-data /var/www/blog

# 4. 创建数据库
sudo mysql -e "CREATE DATABASE wordpress; CREATE USER 'wp_user'@'localhost' IDENTIFIED BY 'password'; GRANT ALL ON wordpress.* TO 'wp_user'@'localhost'; FLUSH PRIVILEGES;"

# 5. 配置 WordPress
cd /var/www/blog
sudo cp wp-config-sample.php wp-config.php
sudo vim wp-config.php
# 修改数据库配置

# 6. 配置 Nginx
sudo vim /etc/nginx/sites-available/blog
```

```nginx
server {
    listen 80;
    root /var/www/blog;
    index index.php;
    server_name blog.local;

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

```bash
# 7. 启用站点
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

</details>

### 练习 3：挑战 - 搭建 LNMP 环境并部署应用

**任务**：搭建完整的 LNMP（Linux + Nginx + MySQL + PHP）环境，部署一个自定义 PHP 应用，包括：
- 用户登录功能
- 数据库操作
- 文件上传功能
- 安全防护

<details>
<summary>点击查看答案</summary>

```bash
#!/bin/bash
# setup_lnmp.sh - LNMP 环境搭建脚本

# 1. 系统更新
apt update && apt upgrade -y

# 2. 安装 Nginx
apt install nginx -y
systemctl enable nginx

# 3. 安装 MySQL
apt install mysql-server -y
systemctl enable mysql

# 4. 安装 PHP
apt install php-fpm php-mysql php-cli php-common php-curl php-gd php-mbstring php-xml php-zip -y
systemctl enable php8.2-fpm

# 5. 创建应用目录
mkdir -p /var/www/app
chown -R www-data:www-data /var/www/app

# 6. 创建数据库
mysql -e "CREATE DATABASE app_db; CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'AppPass123!'; GRANT ALL ON app_db.* TO 'app_user'@'localhost';"

# 7. 配置 Nginx
cat > /etc/nginx/sites-available/app << 'EOF'
server {
    listen 80;
    root /var/www/app;
    index index.php;
    server_name app.local;

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\. {
        deny all;
    }
}
EOF

ln -s /etc/nginx/sites-available/app /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# 8. 安全加固
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd

# 9. 防火墙
ufw allow 2222/tcp
ufw allow http
ufw allow https
ufw --force enable

echo "LNMP 环境搭建完成！"
```

</details>

## 总结

恭喜你完成了 Linux 教程的全部章节！通过这 16 章的学习，你已经掌握了：

- Linux 基础概念和命令
- 文件系统管理
- 用户和权限管理
- 软件包管理
- 进程和服务管理
- 网络配置
- 日志管理和监控
- 安全加固
- 性能调优
- 综合实战

这些知识足以让你胜任日常的 Linux 运维工作。记住，学习是一个持续的过程，要保持好奇心，多动手实践，遇到问题多查阅文档和社区。

祝你在 Linux 的世界里越走越远！
