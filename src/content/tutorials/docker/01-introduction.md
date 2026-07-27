---
title: "第1章：Docker 简介与环境搭建"
description: "什么是容器，Docker 发展史，安装与配置"
---

# 第1章：Docker 简介与环境搭建

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Docker？它和虚拟机有什么区别？
- 为什么现在几乎所有公司都在用 Docker？
- 安装 Docker 复杂吗？需要什么环境？
- 学 Docker 对我找工作有帮助吗？

这一章就是为了解答这些问题。我们会先搞清楚 **Docker 是什么、为什么需要它**，再动手把环境搭好，为后面的学习打下基础。

---

## 1 为什么需要 Docker？

### 痛点分析

想象一下这个场景：你在自己电脑上开发了一个项目，运行得好好的，结果部署到服务器上就报错了。你排查了半天，发现是服务器上的 Node.js 版本和你本地不一样。

这就是经典的 **"在我电脑上是好的"** 问题。

没有 Docker 之前，我们面临这些痛点：

- **环境不一致**：开发、测试、生产环境配置不同，部署时容易出问题
- **依赖冲突**：不同项目需要不同版本的运行环境，互相干扰
- **部署复杂**：每次部署都要手动安装依赖、配置环境，费时费力
- **资源浪费**：用虚拟机的话，每个应用都要跑一个完整的操作系统，占用大量内存和 CPU

### 解决方案

Docker 的出现就是为了解决这些问题。它把你的应用和所有依赖（运行环境、配置文件、库文件等）打包成一个 **容器**，在任何机器上都能一模一样地运行。

打个比方：

> 传统部署就像搬家：你要把家具一件件搬过去，到新家还要重新组装，可能还会发现门太小家具进不去。
>
> Docker 就像把整个房间连墙带家具一起打包，搬到哪里打开就是一模一样的房间。

### 代码对比

没有 Docker 时部署一个 Node.js 应用：

```bash
# ❶ 手动安装 Node.js（不同系统命令还不一样）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# ❷ 手动安装依赖
npm install

# ❸ 手动配置环境变量
export DATABASE_URL=xxx
export REDIS_URL=xxx

# ❹ 启动应用
node app.js

# ❌ 问题：换一台机器，以上步骤要全部重来
```

使用 Docker 部署：

```bash
# ✅ 一条命令搞定，任何机器都一样
docker run -d -p 3000:3000 my-node-app

# 就这么简单！环境、依赖、配置全都打包在镜像里了
```

> **一句话总结**：Docker 让你告别"在我电脑上是好的"，实现一次构建，到处运行。

---

## 2 Docker 是什么？

### 概念解释

Docker 是一个开源的 **容器化平台**，它能把应用及其依赖打包到一个轻量级、可移植的容器中。

打个比方：

> 集装箱运输 revolutionized 全球物流——不管你是运手机还是运香蕉，都装进标准集装箱，用同样的吊车和卡车运输。
>
> Docker 对软件做了同样的事情——不管你的应用是 Java 还是 Python，都装进标准容器，用同样的方式运行和部署。

### Docker 发展简史

| 年份 | 里程碑 |
| --- | --- |
| 2013 | Docker 由 dotCloud 公司（后改名 Docker, Inc.）首次发布 |
| 2014 | Docker 1.0 发布，标志着生产就绪 |
| 2016 | Docker 引入 Swarm 模式，支持原生集群 |
| 2017 | Docker 分为 CE（社区版）和 EE（企业版） |
| 2019 | Docker 企业版卖给 Mirantis，社区继续由 Docker Inc. 维护 |
| 2020 | Apple Silicon（M1/M2）支持，Docker Desktop 适配 ARM |
| 至今 | Docker 已成为云原生生态的基石，被全球数百万开发者使用 |

### Docker vs 虚拟机

| 特性 | Docker 容器 | 虚拟机 |
| --- | --- | --- |
| 启动速度 | 秒级（毫秒级） | 分钟级 |
| 资源占用 | 极小（MB 级） | 很大（GB 级） |
| 性能 | 接近原生 | 有损耗 |
| 隔离性 | 进程级隔离 | 完全隔离 |
| 镜像大小 | 通常几十 MB | 通常几 GB |
| 运行密度 | 一台机器可跑几十个容器 | 一台机器只能跑几个虚拟机 |
| 操作系统 | 共享宿主机内核 | 每个 VM 需要完整 OS |

> 简单来说：容器是"轻量级的虚拟机"，它不需要模拟整个操作系统，而是直接复用宿主机的内核，所以又快又省资源。

---

## 3 安装 Docker

### Windows 安装

#### 方式一：Docker Desktop（推荐）

1. 前往 [Docker 官网](https://www.docker.com/products/docker-desktop/) 下载安装包
2. 运行安装程序，按提示完成安装
3. 安装完成后启动 Docker Desktop
4. 打开 PowerShell，验证安装：

```bash
# 查看 Docker 版本，确认安装成功
docker --version
# 输出类似：Docker version 24.x.x, build xxxxxxx
```

#### 系统要求

- Windows 10/11 64 位（Pro、Enterprise 或 Education 版本）
- 启用 WSL 2（Windows Subsystem for Linux 2）
- 在 BIOS 中启用虚拟化（VT-x / AMD-V）

#### 方式二：WSL 2 内安装（适合开发者）

```bash
# ❶ 安装 WSL 2
wsl --install

# ❷ 在 WSL 2 的 Ubuntu 中安装 Docker
sudo apt-get update
sudo apt-get install -y docker.io

# ❸ 启动 Docker 服务
sudo service docker start

# ❹ 将当前用户加入 docker 组（免 sudo）
sudo usermod -aG docker $USER
```

### macOS 安装

```bash
# ❶ 方式一：下载 Docker Desktop for Mac
# 前往 https://www.docker.com/products/docker-desktop/ 下载

# ❷ 方式二：使用 Homebrew 安装
brew install --cask docker

# ❸ 安装完成后打开 Docker Desktop 应用
# ❹ 验证安装
docker --version
```

### Linux 安装（Ubuntu/Debian）

```bash
# ❶ 更新包索引
sudo apt-get update

# ❷ 安装必要的依赖
sudo apt-get install -y ca-certificates curl gnupg

# ❸ 添加 Docker 官方 GPG 密钥
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# ❹ 设置仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# ❺ 安装 Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# ❻ 验证安装
sudo docker run hello-world
```

---

## 4 验证安装与基础配置

### 运行第一个容器

```bash
# ❶ 运行 hello-world 容器（验证安装是否成功）
docker run hello-world

# 输出类似：
# Hello from Docker!
# This message shows that your installation appears to be working correctly.
```

这条命令做了什么？

1. Docker 在本地找 `hello-world` 镜像 → 没找到
2. 自动从 Docker Hub 下载镜像
3. 用这个镜像创建并运行一个容器
4. 容器输出一段欢迎信息后退出

### 配置镜像加速（国内用户）

由于 Docker Hub 在国内访问较慢，建议配置镜像加速器：

```json
// Docker Desktop 设置 -> Docker Engine，添加：
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.mirrors.ustc.edu.cn"
  ]
}
```

配置完成后重启 Docker Desktop 即可生效。

### 常用命令速查

```bash
# 查看 Docker 版本
docker --version

# 查看 Docker 系统信息
docker info

# 查看正在运行的容器
docker ps

# 查看所有容器（包括已停止的）
docker ps -a
```

---

## 5 Docker 架构概览

Docker 采用客户端-服务端（C/S）架构：

```
┌──────────────────────────────────────────────────┐
│                 Docker Host                       │
│                                                   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐   │
│  │  容器 A   │    │  容器 B   │    │  容器 C   │   │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘   │
│       │               │               │          │
│  ┌────┴───────────────┴───────────────┴────┐     │
│  │            Docker Engine (daemon)        │     │
│  └─────────────────┬───────────────────────┘     │
│                    │                              │
└────────────────────┼──────────────────────────────┘
                     │
              ┌──────┴──────┐
              │  Docker CLI  │  ← 你输入命令的地方
              └─────────────┘
```

| 组件 | 作用 |
| --- | --- |
| Docker Daemon | 后台守护进程，负责管理镜像、容器、网络等 |
| Docker CLI | 命令行工具，用户通过它和 Daemon 交互 |
| Docker Image | 只读模板，包含运行应用所需的一切 |
| Docker Container | 镜像的运行实例，像一个轻量级虚拟机 |
| Docker Registry | 存储和分发镜像的仓库（Docker Hub 是默认的公共仓库） |

打个比方：

> Docker Daemon 就像餐厅的厨房，负责做菜（创建容器）。Docker CLI 就像服务员，你通过它下单（输入命令），厨房根据你的订单做菜。镜像就是菜谱，容器就是做出来的菜。

---

## 6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| Docker 是什么 | 一个容器化平台，把应用和依赖打包在一起 |
| 容器的优势 | 环境一致、部署简单、资源占用少、启动快 |
| Docker vs 虚拟机 | 容器共享宿主机内核，更轻量更快 |
| Docker 架构 | CLI → Daemon → 容器/镜像 |
| 安装方式 | Windows/macOS 用 Docker Desktop，Linux 用包管理器 |
| 镜像加速 | 国内用户建议配置镜像加速器 |

---

## 7 新手常见误区

### 误区 1："Docker 就是虚拟机"

**错！** 虽然容器和虚拟机很像，但本质不同。虚拟机通过 Hypervisor 模拟了完整的硬件和操作系统，而容器直接共享宿主机的内核，只是对进程做了隔离。所以容器比虚拟机轻量得多。

### 误区 2："装了 Docker 就不用学编程了"

不是的。Docker 是部署和运维工具，它解决的是"怎么运行"的问题，而不是"怎么写代码"。你仍然需要会写应用，Docker 帮你把它打包和部署。

### 误区 3："Docker 只能在 Linux 上用"

不是的。Docker Desktop 支持 Windows、macOS 和 Linux。在 Windows 和 macOS 上，Docker 会在后台运行一个轻量级的 Linux 虚拟机来提供容器环境，但对你来说是透明的。

### 误区 4："容器会永久运行，像虚拟机一样"

容器的设计哲学是"用完即走"。一个容器通常运行一个任务后就退出了。如果你需要持久运行的服务，可以用 `-d` 参数让它在后台运行，但容器本质上是短暂的。

---

## 8 动手练习

### 练习 1：安装验证

安装 Docker 后，运行 `docker run hello-world`，确认输出正常。然后运行 `docker info`，查看你的 Docker 系统信息。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 验证安装
docker run hello-world

# ❷ 查看系统信息
docker info

# ❸ 查看 Docker 版本
docker version
```

如果 `hello-world` 正常输出，说明安装成功。`docker info` 会显示容器数量、镜像数量、存储驱动等详细信息。

</details>

### 练习 2：运行一个 Web 服务器

尝试用 Docker 运行一个 Nginx Web 服务器，并在浏览器中访问它。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 拉取并运行 Nginx 容器
# -d：后台运行
# -p 8080:80：把宿主机的 8080 端口映射到容器的 80 端口
# --name：给容器起个名字
docker run -d -p 8080:80 --name my-nginx nginx

# ❷ 打开浏览器访问 http://localhost:8080
# 你应该能看到 Nginx 的欢迎页面

# ❸ 查看正在运行的容器
docker ps

# ❹ 停止容器
docker stop my-nginx

# ❺ 删除容器
docker rm my-nginx
```

</details>

### 练习 3（挑战）：探索容器内部

运行一个 Ubuntu 容器，进入容器的命令行，查看容器内的系统信息。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 以交互模式运行 Ubuntu 容器
# -i：保持标准输入打开
# -t：分配一个伪终端
docker run -it ubuntu bash

# ❷ 现在你已经在容器内部了！试试这些命令：

# 查看系统版本
cat /etc/os-release

# 查看当前用户
whoami
# 输出：root（容器内默认是 root）

# 查看进程列表
ps aux
# 你会发现进程很少，因为容器只运行了你指定的命令

# 查看网络信息
ip addr

# 退出容器
exit
```

注意：退出后容器就停止了。容器停止后，里面的修改都会丢失（除非用了数据卷，后面会学）。

</details>

---

## 下一章预告

下一章我们会深入学习 Docker 的 **核心概念**——镜像、容器和仓库。你会理解它们之间的关系，以及 Docker 是怎么利用这些概念来工作的。搞懂这些，后面的操作就融会贯通了。
