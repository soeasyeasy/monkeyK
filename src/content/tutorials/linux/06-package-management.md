---
title: '第六章：软件包管理'
description: 'Linux 软件安装、更新与卸载，apt/yum/dnf 详解'
---

# 第六章：软件包管理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Linux 上装软件怎么这么麻烦？为什么不像 Windows 那样下载个 exe 双击安装？
- `apt`、`yum`、`dnf` 这些命令有什么区别？我该用哪个？
- 什么是"软件源"？为什么总说要"换源"？
- 从源码编译安装是什么意思？什么时候需要这么做？

这一章就是为了解答这些问题。我们会先搞清楚 Linux 软件管理的核心概念，再学会主流发行版的包管理工具，最后了解软件源配置和源码编译安装。学完之后，你就能在 Linux 上自如地安装各种软件了。

---

## 6.1 为什么需要软件包管理？

### 痛点分析

想象一下这样的场景：

你想在 Linux 上装个 Python。你下载了 Python 的源码，编译安装后发现缺少依赖库。你去找依赖库，发现依赖库又依赖其他库。你一层层装下去，装了十几个库，最后 Python 终于装好了。

过了几天，你想升级 Python，发现新版本又需要不同版本的依赖库。你不敢升级，怕把原来的环境搞坏了。更糟糕的是，你装的其他软件也开始出问题，因为它们依赖的库版本冲突了。

这就是没有包管理系统时的日常：**装软件像拆炸弹，一不小心就依赖冲突、环境崩溃**。

### 解决方案

Linux 的包管理系统就像一个**应用商店**：

- 所有软件都打包好了，一条命令就能安装
- 自动处理依赖关系，不用你手动找依赖
- 统一管理，升级、卸载都很方便
- 有官方仓库，软件经过验证，相对安全

打个比方：

> 包管理系统就像手机上的应用商店。你想装微信，直接搜"微信"点安装，商店会自动帮你下载微信和它需要的所有依赖。你不需要自己去网上找 APK、手动安装、担心病毒。Linux 的包管理就是这个原理，只不过是用命令行操作。

### 前后对比

```
没有包管理：
  下载源码 → 手动编译 → 找依赖 → 编译依赖 → 版本冲突 → 放弃

有包管理：
  apt install python3 → 自动下载 → 自动安装依赖 → 完成
```

> 一句话总结：包管理让软件安装从"手动挡"变成"自动挡"。

---

## 6.2 包管理核心概念

### 软件包是什么？

软件包就是把软件的可执行文件、配置文件、依赖信息打包在一起的一个文件。不同的发行版用不同格式的包：

| 发行版系列 | 包格式 | 包管理工具 | 典型代表 |
| --- | --- | --- | --- |
| Debian/Ubuntu | `.deb` | apt, dpkg | Ubuntu, Debian, Linux Mint |
| RHEL/CentOS/Fedora | `.rpm` | yum, dnf, rpm | CentOS, Fedora, RHEL |
| Arch Linux | 自定义格式 | pacman | Arch, Manjaro |
| 通用 | 源码包 | make, cmake | 所有发行版 |

### 软件源是什么？

软件源（Repository）就是存放软件包的服务器。包管理工具从这里下载软件。

打个比方：

> 软件源就像应用商店的服务器。你的手机从应用商店的服务器下载 App，Linux 从软件源下载软件。不同的软件源就像不同的应用商店，里面的软件可能不一样。

```
你的 Linux 系统
    │
    │  apt install nginx
    ▼
软件源服务器（如 mirrors.aliyun.com）
    │
    │  下载 nginx.deb 及其依赖
    ▼
安装到你的系统
```

### 为什么要换源？

默认的官方源通常在国外，下载速度慢。国内有很多镜像源（如阿里云、腾讯云、清华），把官方源的内容同步到国内服务器，下载速度快很多。

```bash
# 查看当前软件源配置（Ubuntu/Debian）
cat /etc/apt/sources.list

# 备份原始源列表
sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak

# 替换为阿里云镜像源（Ubuntu 22.04 示例）
sudo sed -i 's/archive.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list
sudo sed -i 's/security.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list

# 更新软件包列表
sudo apt update
```

> 打个比方：换源就像把下载链接从国外服务器换成国内镜像站，速度从 100KB/s 变成 10MB/s。

---

## 6.3 APT 包管理（Debian/Ubuntu）

APT（Advanced Package Tool）是 Debian 系发行版的包管理工具。

### 基础操作

```bash
# 更新软件包列表（从软件源获取最新信息）
sudo apt update
# 这一步不会安装任何软件，只是更新"有哪些软件可用"的列表

# 升级所有已安装的软件到最新版本
sudo apt upgrade
# 会列出要升级的软件，输入 y 确认

# 同时更新列表和升级软件
sudo apt update && sudo apt upgrade
# 推荐定期执行这个组合命令

# 安装软件
sudo apt install nginx
# 自动下载并安装 nginx 及其所有依赖

# 安装指定版本的软件
sudo apt install nginx=1.18.0-0ubuntu1
# 如果需要特定版本，可以指定版本号

# 卸载软件（保留配置文件）
sudo apt remove nginx

# 卸载软件（同时删除配置文件）
sudo apt purge nginx
# 推荐用 purge，彻底清理

# 删除不再需要的依赖
sudo apt autoremove
# 安装软件时自动装的依赖，卸载软件后可能不再需要

# 搜索软件
apt search nginx
# 在软件源中搜索包含 nginx 的软件包

# 查看软件信息
apt show nginx
# 显示 nginx 的版本、描述、依赖等信息

# 列出已安装的软件
apt list --installed
# 显示所有已安装的软件包

# 检查某个文件属于哪个包
dpkg -S /usr/bin/nginx
# 找出 nginx 命令是哪个包安装的
```

### APT 工作原理

```
apt install nginx
    │
    ▼
1. 从软件源查找 nginx 包
    │
    ▼
2. 计算依赖关系（nginx 需要 libssl、libpcre 等）
    │
    ▼
3. 下载所有需要的 .deb 包
    │
    ▼
4. 按顺序安装（先装依赖，再装 nginx）
    │
    ▼
5. 配置软件（运行 post-install 脚本）
    │
    ▼
6. 完成安装
```

### dpkg 底层工具

dpkg 是 APT 的底层工具，直接操作 `.deb` 包文件。

```bash
# 安装本地 .deb 包
sudo dpkg -i package.deb
# 如果缺少依赖，会报错

# 修复依赖关系
sudo apt --fix-broken install
# 自动安装 dpkg 缺少的依赖

# 查看已安装的包
dpkg -l
# 列出所有已安装的包

# 查看包的信息
dpkg -s nginx
# 显示 nginx 包的详细信息

# 列出包安装的文件
dpkg -L nginx
# 显示 nginx 包安装了哪些文件到哪些位置

# 解压 .deb 包（不安装）
dpkg-deb -x package.deb /tmp/extract/
# 把包内容解压到指定目录
```

---

## 6.4 YUM/DNF 包管理（RHEL/CentOS/Fedora）

YUM（Yellowdog Updater Modified）和 DNF 是 Red Hat 系发行版的包管理工具。DNF 是 YUM 的下一代版本，Fedora 和 RHEL 8+ 默认使用 DNF。

### 基础操作

```bash
# 更新软件包列表和升级所有软件
sudo yum update
# 或 sudo dnf update

# 安装软件
sudo yum install nginx
# 或 sudo dnf install nginx

# 卸载软件
sudo yum remove nginx
# 或 sudo dnf remove nginx

# 搜索软件
yum search nginx
# 或 dnf search nginx

# 查看软件信息
yum info nginx
# 或 dnf info nginx

# 列出已安装的软件
yum list installed
# 或 dnf list installed

# 查看软件依赖
yum deplist nginx
# 或 dnf deplist nginx

# 查看某个文件属于哪个包
yum provides /usr/sbin/nginx
# 或 dnf provides /usr/sbin/nginx

# 清理缓存
sudo yum clean all
# 或 sudo dnf clean all
```

### YUM 与 DNF 对比

| 对比项 | YUM | DNF |
| --- | --- | --- |
| 全称 | Yellowdog Updater Modified | Dandified YUM |
| 使用版本 | CentOS 7 及更早 | Fedora 22+, RHEL 8+ |
| 依赖解析 | 较慢 | 更快（使用 libsolv） |
| 内存占用 | 较高 | 较低 |
| 命令语法 | 基本兼容 | 基本兼容 |
| 推荐度 | 老系统继续使用 | 新系统推荐使用 |

### RPM 底层工具

RPM（Red Hat Package Manager）是 YUM/DNF 的底层工具，直接操作 `.rpm` 包文件。

```bash
# 安装本地 .rpm 包
sudo rpm -ivh package.rpm
# -i 安装，-v 显示详细信息，-h 显示进度条

# 升级 .rpm 包
sudo rpm -Uvh package.rpm
# -U 升级，如果包未安装则安装

# 卸载包
sudo rpm -e package
# -e 卸载（erase）

# 查询已安装的包
rpm -qa
# 列出所有已安装的包

# 查询包信息
rpm -qi nginx
# 显示 nginx 包的详细信息

# 查询包安装的文件
rpm -ql nginx
# 列出 nginx 包安装的所有文件

# 查询文件属于哪个包
rpm -qf /usr/sbin/nginx
```

---

## 6.5 Pacman 包管理（Arch Linux）

Pacman 是 Arch Linux 的包管理工具，语法简洁高效。

### 基础操作

```bash
# 同步软件源并升级所有软件
sudo pacman -Syu
# -S 同步，-y 刷新数据库，-u 升级

# 安装软件
sudo pacman -S nginx
# -S 安装指定包

# 卸载软件
sudo pacman -R nginx
# -R 卸载（保留配置文件）

# 卸载软件及不需要的依赖
sudo pacman -Rns nginx
# -n 删除配置文件，-s 删除不需要的依赖

# 搜索软件
pacman -Ss nginx
# -Ss 搜索软件源

# 查看软件信息
pacman -Qi nginx
# -Q 查询本地，-i 显示信息

# 列出已安装的软件
pacman -Q
# 列出所有已安装的包

# 查看文件属于哪个包
pacman -Qo /usr/bin/nginx

# 清理缓存
sudo pacman -Sc
# 删除未安装的包的缓存

sudo pacman -Scc
# 删除所有缓存
```

---

## 6.6 源码编译安装

当软件源里没有你需要的版本，或者需要自定义编译选项时，可以从源码编译安装。

### 编译安装三步骤

```bash
# 1. 配置（configure）
./configure --prefix=/usr/local/nginx
# 检查依赖，生成 Makefile
# --prefix 指定安装路径

# 2. 编译（make）
make
# 根据 Makefile 编译源码，生成可执行文件

# 3. 安装（make install）
sudo make install
# 把编译好的文件复制到指定路径
```

### 完整示例：从源码安装 Nginx

```bash
# 1. 安装编译依赖
sudo apt install build-essential libpcre3 libpcre3-dev zlib1g zlib1g-dev libssl-dev

# 2. 下载源码
wget http://nginx.org/download/nginx-1.24.0.tar.gz
# 下载 nginx 源码包

# 3. 解压
tar -xzf nginx-1.24.0.tar.gz
# 解压源码包

# 4. 进入源码目录
cd nginx-1.24.0

# 5. 配置
./configure --prefix=/usr/local/nginx --with-http_ssl_module
# 指定安装路径，启用 SSL 模块

# 6. 编译
make
# 编译源码（可能需要几分钟）

# 7. 安装
sudo make install
# 安装到 /usr/local/nginx

# 8. 验证
/usr/local/nginx/sbin/nginx -v
# 查看 nginx 版本
```

### 源码安装的优缺点

| 优点 | 缺点 |
| --- | --- |
| 可以安装最新版本 | 需要手动处理依赖 |
| 可以自定义编译选项 | 编译过程可能出错 |
| 不依赖软件源 | 升级麻烦，需要重新编译 |
| 可以优化性能（如指定 CPU 架构） | 卸载麻烦，需要手动删除文件 |

> 打个比方：包管理安装就像去餐厅点菜，菜单上有什么就点什么。源码编译就像自己买菜做饭，想加什么调料都行，但得自己准备食材、自己收拾厨房。

---

## 6.7 新型包管理：Snap 和 Flatpak

Snap 和 Flatpak 是跨发行版的包管理方案，解决"不同发行版软件不兼容"的问题。

### Snap

Snap 由 Canonical（Ubuntu 母公司）开发，Ubuntu 默认支持。

```bash
# 安装 snap 包
sudo snap install code
# 安装 VS Code

# 列出已安装的 snap
snap list

# 更新 snap 包
sudo snap refresh code

# 卸载 snap 包
sudo snap remove code

# 搜索 snap 包
snap find nginx
```

### Flatpak

Flatpak 是社区驱动的跨发行版方案，很多发行版可以安装。

```bash
# 安装 flatpak（Ubuntu）
sudo apt install flatpak

# 添加 Flathub 仓库
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo

# 安装 flatpak 应用
flatpak install flathub org.gimp.GIMP
# 安装 GIMP 图像编辑器

# 运行 flatpak 应用
flatpak run org.gimp.GIMP

# 列出已安装的 flatpak
flatpak list

# 卸载 flatpak 应用
flatpak uninstall org.gimp.GIMP
```

### 包管理方案对比

| 方案 | 适用发行版 | 优点 | 缺点 |
| --- | --- | --- | --- |
| apt | Debian/Ubuntu | 稳定、依赖处理好 | 软件版本可能较旧 |
| yum/dnf | RHEL/CentOS/Fedora | 企业级稳定 | 软件版本可能较旧 |
| pacman | Arch Linux | 软件最新、滚动更新 | 稳定性可能不如 LTS |
| snap | 跨发行版 | 沙箱隔离、自动更新 | 启动慢、占用空间大 |
| flatpak | 跨发行版 | 沙箱隔离、桌面应用友好 | 需要额外配置 |
| 源码编译 | 所有 Linux | 最灵活、可定制 | 最麻烦、依赖难处理 |

---

## 6.8 新手常见误区

### 误区 1："apt update 和 apt upgrade 是一回事"

不是。`apt update` 只是更新软件包列表（从软件源获取最新信息），不会安装任何软件。`apt upgrade` 才是真正升级软件。正确流程是先 `update` 再 `upgrade`。

### 误区 2："卸载软件用 remove 就够了"

`apt remove` 只删除软件本身，配置文件会保留。如果你想彻底清理，应该用 `apt purge`。否则下次安装同名软件时，旧的配置文件可能会造成问题。

### 误区 3："源码编译安装一定比包管理好"

不一定。源码编译虽然可以安装最新版本、自定义选项，但失去了包管理的依赖管理、自动更新、卸载方便等优势。除非有特殊需求，否则优先使用包管理工具。

### 误区 4："换源后不需要 apt update"

换源只是修改了下载链接，本地的软件包列表还是旧的。换源后必须执行 `apt update` 或 `yum makecache` 更新列表，否则还是从旧源下载。

### 误区 5："sudo apt install 和 sudo snap install 可以混用"

可以混用，但不推荐。同一个软件用两种方式安装可能会冲突。建议优先使用系统原生的包管理工具（apt/yum/dnf），只有在软件源里没有时才考虑 snap 或 flatpak。

---

## 6.9 动手练习

### 练习 1：基础练习

在你的 Linux 系统上安装 Nginx Web 服务器，验证安装成功，然后卸载。

<details>
<summary>点击查看答案</summary>

```bash
# Ubuntu/Debian 系统
# 1. 更新软件包列表
sudo apt update

# 2. 安装 nginx
sudo apt install nginx

# 3. 验证安装
nginx -v
# 应该输出 nginx 版本信息

# 4. 启动 nginx 服务
sudo systemctl start nginx

# 5. 验证服务运行
curl http://localhost
# 应该看到 nginx 默认欢迎页面的 HTML

# 6. 卸载 nginx
sudo apt purge nginx nginx-common
# purge 彻底删除，包括配置文件

# 7. 清理不需要的依赖
sudo apt autoremove
```

</details>

### 练习 2：进阶练习

将你的 Ubuntu 系统的软件源替换为阿里云镜像源，并更新软件包列表。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 备份原始源列表
sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak

# 2. 查看当前源
cat /etc/apt/sources.list

# 3. 替换为阿里云镜像源（Ubuntu 22.04 jammy）
sudo sed -i 's/archive.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list
sudo sed -i 's/security.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list

# 4. 验证修改
cat /etc/apt/sources.list
# 应该看到 mirrors.aliyun.com 而不是 archive.ubuntu.com

# 5. 更新软件包列表
sudo apt update
# 应该看到从 mirrors.aliyun.com 下载的速度快了很多

# 6. 测试安装一个软件
sudo apt install htop
# htop 是一个系统监控工具，安装后运行 htop 查看系统状态
```

</details>

### 练习 3（挑战）：综合练习

从源码编译安装 Redis 6.2.0，配置为系统服务，验证安装成功。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 安装编译依赖
sudo apt install build-essential tcl

# 2. 下载 Redis 源码
wget http://download.redis.io/releases/redis-6.2.0.tar.gz

# 3. 解压源码
tar -xzf redis-6.2.0.tar.gz

# 4. 进入源码目录
cd redis-6.2.0

# 5. 编译
make
# Redis 不需要 configure 步骤，直接 make

# 6. 安装到 /usr/local/redis
sudo make PREFIX=/usr/local/redis install

# 7. 验证安装
/usr/local/redis/bin/redis-server --version
# 应该输出 Redis server v=6.2.0

# 8. 创建配置文件目录
sudo mkdir /etc/redis

# 9. 复制默认配置文件
sudo cp redis.conf /etc/redis/redis.conf

# 10. 修改配置文件（后台运行）
sudo sed -i 's/daemonize no/daemonize yes/' /etc/redis/redis.conf

# 11. 创建 systemd 服务文件
sudo tee /etc/systemd/system/redis.service > /dev/null <<'EOF'
[Unit]
Description=Redis In-Memory Data Store
After=network.target

[Service]
Type=forking
ExecStart=/usr/local/redis/bin/redis-server /etc/redis/redis.conf
ExecStop=/usr/local/redis/bin/redis-cli shutdown
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 12. 启动 Redis 服务
sudo systemctl daemon-reload
sudo systemctl start redis
sudo systemctl enable redis

# 13. 验证服务状态
sudo systemctl status redis
# 应该看到 active (running)

# 14. 测试连接
/usr/local/redis/bin/redis-cli ping
# 应该输出 PONG
```

</details>

---

## 下一章预告

下一章我们会学习 **Vim 编辑器**，Linux 上最强大的文本编辑器。你会了解到：

- Vim 的几种模式（命令模式、插入模式、底行模式）有什么区别
- 为什么程序员都说 Vim 比图形编辑器好用？
- 如何在 Vim 中快速移动、复制、删除、搜索？
- 怎么配置 Vim 让它更好用？

Vim 是 Linux 运维和开发必备技能，学会之后你会发现在服务器上编辑文件效率翻倍。
