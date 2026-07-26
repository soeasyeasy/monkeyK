---
title: "第二章：文件系统与目录结构"
description: "理解 Linux 文件系统层次结构，掌握路径操作"
---

# 第二章：文件系统与目录结构

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Linux 的目录结构为什么和 Windows 不一样？
- /bin、/etc、/home 这些目录都是干嘛的？
- 绝对路径和相对路径有什么区别？
- 为什么有时候 cd 进不去某些目录？

这一章就是为了解答这些问题。我们会先搞清楚 **Linux 文件系统的组织方式**，再理解每个重要目录的作用，最后掌握路径操作的技巧。

---

## 2.1 为什么需要理解文件系统？

### 痛点分析

想象一下这样的场景：

你刚装好 Linux，想找个配置文件改一改，结果：
- 不知道配置文件在哪
- 网上教程说"编辑 /etc/xxx.conf"，你连 /etc 是什么都不知道
- 好不容易找到文件，结果没有权限修改

更糟糕的是，你想删除一个"没用的文件"，结果把系统搞崩了。

这就是不懂文件系统时的日常：**找不到文件、看不懂路径、改错文件**。

### 解决方案

理解 Linux 文件系统，你能做到：

- 快速定位任何文件和目录
- 知道哪些文件能改，哪些不能动
- 避免误删系统文件导致崩溃

打个比方：

> Windows 的文件系统像一个杂乱无章的仓库——所有东西都堆在一起，找东西靠运气。
>
> Linux 的文件系统像一个**分类清晰的图书馆**——每本书都有固定的位置，只要你知道分类规则，就能快速找到任何一本书。

### 前后对比

```
不懂文件系统：
# 想找 nginx 配置文件
find / -name "nginx.conf"  # 全盘搜索，慢得要死
# 找到一堆 nginx.conf，不知道哪个是对的

懂文件系统：
# 直接去 /etc/nginx/ 目录
cd /etc/nginx/
ls  # 配置文件就在这里，一目了然
```

> **一句话总结**：理解文件系统，让你在 Linux 里"不迷路"。

---

## 2.2 Linux 文件系统原理

### 概念解释

Linux 文件系统是一个**树状结构**，从根目录 `/` 开始，向下分支出各种目录。

打个比方：

> 文件系统像一棵倒过来的树：
> - 树根是 `/`（根目录）
> - 树枝是各种子目录（/bin、/etc、/home 等）
> - 树叶是具体的文件

### 文件系统层次图

```
/                    # 根目录，一切的起点
├── bin              # 基础命令（binary）
├── boot             # 启动文件（bootloader）
├── dev              # 设备文件（devices）
├── etc              # 配置文件（etcetera）
├── home             # 普通用户的家目录
│   ├── user1        # 用户 user1 的家目录
│   └── user2        # 用户 user2 的家目录
├── root             # root 用户的家目录
├── var              # 可变数据（variable）
│   ├── log          # 日志文件
│   └── www          # Web 服务器数据
├── usr              # 用户程序（Unix Software Resource）
│   ├── bin          # 用户命令
│   ├── lib          # 库文件
│   └── local        # 本地安装的软件
├── tmp              # 临时文件
├── opt              # 可选软件（optional）
├── proc             # 进程信息（虚拟文件系统）
├── sys              # 系统信息（虚拟文件系统）
└── mnt              # 临时挂载点
```

### 核心目录详解

| 目录 | 作用 | 类比 | 能否删除 |
| --- | --- | --- | --- |
| `/` | 根目录，一切的起点 | 图书馆大门 | 绝对不能 |
| `/bin` | 基础命令（ls、cp、mv 等） | 常用工具柜 | 绝对不能 |
| `/boot` | 启动文件（内核、引导程序） | 汽车点火开关 | 绝对不能 |
| `/dev` | 设备文件（硬盘、键盘等） | 硬件的"快捷方式" | 绝对不能 |
| `/etc` | 系统配置文件 | 图书馆的管理规则 | 谨慎修改 |
| `/home` | 普通用户的家目录 | 员工的办公桌 | 谨慎删除 |
| `/root` | root 用户的家目录 | 老板的办公室 | 谨慎修改 |
| `/var` | 可变数据（日志、缓存等） | 图书馆的日志本 | 谨慎清理 |
| `/usr` | 用户程序和库文件 | 图书馆的藏书区 | 绝对不能 |
| `/tmp` | 临时文件 | 图书馆的便签纸 | 可以清理 |
| `/proc` | 进程信息（虚拟文件系统） | 实时监控屏幕 | 不能操作 |
| `/sys` | 系统信息（虚拟文件系统） | 硬件状态显示屏 | 不能操作 |

---

## 2.3 路径操作

### 绝对路径 vs 相对路径

| 类型 | 定义 | 示例 | 特点 |
| --- | --- | --- | --- |
| 绝对路径 | 从根目录 `/` 开始的完整路径 | `/home/user/file.txt` | 总是以 `/` 开头 |
| 相对路径 | 相对于当前目录的路径 | `./file.txt` 或 `../file.txt` | 不以 `/` 开头 |

### 特殊路径符号

| 符号 | 含义 | 示例 |
| --- | --- | --- |
| `/` | 根目录 | `cd /` |
| `~` | 当前用户的家目录 | `cd ~` 或 `cd ~/Documents` |
| `.` | 当前目录 | `./script.sh` |
| `..` | 上一级目录 | `cd ..` |
| `-` | 上一次所在的目录 | `cd -` |

### 基础用法

```bash
# ❶ 查看当前所在目录（绝对路径）
pwd  # 输出类似：/home/user

# ❷ 使用绝对路径切换目录
cd /etc/nginx  # 从任何位置都能切换到 /etc/nginx

# ❸ 使用相对路径切换目录
cd ../Documents  # 从当前目录的上一级的 Documents 目录

# ❹ 切换到家目录
cd ~  # 等同于 cd /home/用户名

# ❺ 切换到上一级目录
cd ..  # 注意：两个点之间没有空格

# ❻ 切换回上一次所在的目录
cd -  # 在两个目录间快速切换

# ✅ 正确示例
cd /home/user/Documents  # 绝对路径
cd ./Documents  # 相对路径，当前目录下的 Documents
cd ../Downloads  # 相对路径，上一级目录的 Downloads

# ❌ 错误示例
cd /home/user/Document  # 拼写错误，应该是 Documents
cd ../ Downloads  # 路径中有空格，应该用引号或转义
cd ...  # 三个点没有意义，只有 . 和 .. 有特殊含义
```

### 路径操作实战

```bash
# 假设当前在 /home/user 目录

# ❶ 查看当前目录
pwd  # 输出：/home/user

# ❷ 进入 /etc 目录
cd /etc  # 使用绝对路径

# ❸ 查看当前位置
pwd  # 输出：/etc

# ❹ 进入 /etc/nginx 目录
cd nginx  # 使用相对路径（相对于 /etc）

# ❺ 查看当前位置
pwd  # 输出：/etc/nginx

# ❻ 返回上一级目录
cd ..  # 回到 /etc

# ❼ 返回家目录
cd ~  # 回到 /home/user

# ❽ 切换回上一次目录
cd -  # 回到 /etc
```

---

## 2.4 文件和目录操作基础

### 查看目录内容

```bash
# ❶ 列出当前目录下的文件和目录
ls  # 最基本的用法

# ❷ 显示详细信息（权限、大小、修改时间等）
ls -l  # 长格式显示

# ❸ 显示隐藏文件（以 . 开头的文件）
ls -a  # 包括 . 和 .. 以及 .config 等隐藏文件

# ❹ 组合使用多个选项
ls -la  # 显示详细信息 + 隐藏文件
ls -lh  # 显示详细信息 + 人类可读的文件大小
ls -lht  # 按修改时间排序（最新的在前）

# ✅ 常用组合
ls -lah  # 最常用：详细信息 + 隐藏文件 + 人类可读大小

# ❌ 错误示例
ls -l a  # 这是列出两个目录：-l 和 a
ls -la /etc/nginx  # 这是正确的，但要注意路径拼写
```

### 创建目录

```bash
# ❶ 创建单个目录
mkdir test  # 在当前目录创建 test 目录

# ❷ 创建多级目录（递归创建）
mkdir -p a/b/c  # 创建 a 目录，然后在 a 里创建 b，再在 b 里创建 c

# ❸ 创建目录并设置权限
mkdir -m 755 mydir  # 创建目录并设置权限为 rwxr-xr-x

# ✅ 正确示例
mkdir -p /home/user/projects/web  # 递归创建多级目录

# ❌ 错误示例
mkdir a/b/c  # 如果 a 或 a/b 不存在，会报错
mkdir -p /root/test  # 如果没有 root 权限，会权限拒绝
```

### 创建文件

```bash
# ❶ 使用 touch 创建空文件
touch file.txt  # 创建空文件 file.txt

# ❷ 同时创建多个文件
touch file1.txt file2.txt file3.txt  # 创建三个空文件

# ❸ 使用重定向创建并写入内容
echo "Hello" > file.txt  # 创建文件并写入 Hello（覆盖）
echo "World" >> file.txt  # 追加内容到文件末尾

# ❹ 使用 cat 创建文件
cat > file.txt << EOF
第一行内容
第二行内容
第三行内容
EOF

# ✅ 推荐用法
touch file.txt  # 创建空文件
echo "内容" > file.txt  # 创建并写入内容

# ❌ 错误示例
touch /root/file.txt  # 没有 root 权限，无法创建
touch file1 file2  # 这是正确的，但要注意文件名不要有特殊字符
```

---

## 2.5 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 文件系统结构 | 树状结构，从根目录 `/` 开始 |
| 核心目录 | /bin（命令）、/etc（配置）、/home（用户）、/var（数据）、/usr（程序） |
| 绝对路径 | 从 `/` 开始的完整路径，如 `/home/user/file.txt` |
| 相对路径 | 相对于当前目录的路径，如 `./file.txt` 或 `../file.txt` |
| 特殊符号 | `~`（家目录）、`.`（当前目录）、`..`（上级目录）、`-`（上次目录） |
| 常用命令 | pwd（查看当前目录）、ls（列出文件）、cd（切换目录）、mkdir（创建目录）、touch（创建文件） |

---

## 2.6 新手常见误区

### 误区 1："Linux 也有 C 盘、D 盘"

**错！** Linux 没有盘符的概念。Windows 用 C:、D: 来区分不同的分区，而 Linux 把所有分区都**挂载**到统一的目录树中。

```bash
# Windows 风格（错误理解）
C:\Users\user\Documents
D:\Projects

# Linux 风格（正确理解）
/home/user/Documents  # 可能在同一个分区
/mnt/data/Projects    # 可能挂载了另一个分区
```

### 误区 2："所有目录都能随便删除"

**大错特错！** 有些目录删除后会导致系统崩溃：

```bash
# ❌ 危险操作，绝对不要做
rm -rf /bin  # 删除所有基础命令，系统立即瘫痪
rm -rf /etc  # 删除所有配置文件，系统无法启动
rm -rf /usr  # 删除所有用户程序，系统基本废了

# ✅ 安全操作
rm -rf ~/Downloads/*  # 只清理自己家目录下的下载文件夹
```

### 误区 3："隐藏文件是系统文件"

**不完全对。** Linux 中隐藏文件只是以 `.` 开头的文件，不一定是系统文件：

```bash
# 这些是隐藏文件
.config      # 用户配置文件
.bashrc      # bash 配置文件
.gitignore   # git 忽略配置文件

# 它们只是普通文件，只是默认不显示而已
ls -a  # 加上 -a 参数就能看到隐藏文件
```

### 误区 4："相对路径总是比绝对路径短"

**不一定。** 有时候相对路径反而更长：

```bash
# 假设当前在 /home/user/projects/web/src/components

# 要去 /etc/nginx 目录
cd /etc/nginx  # 绝对路径：12 个字符
cd ../../../../../../etc/nginx  # 相对路径：26 个字符

# 这种情况下，绝对路径更简洁
```

### 误区 5："/proc 和 /sys 里的文件是真实文件"

**错！** 这两个目录是**虚拟文件系统**，它们不占用磁盘空间，而是动态生成的：

```bash
# /proc 包含进程信息
cat /proc/cpuinfo  # 查看 CPU 信息
cat /proc/meminfo  # 查看内存信息

# /sys 包含设备信息
cat /sys/class/net/eth0/address  # 查看网卡 MAC 地址

# 这些"文件"实际上是内核提供的接口，不是真正的磁盘文件
```

---

## 2.7 动手练习

### 练习 1：基础练习 - 目录导航

**题目**：在文件系统中导航，熟悉路径操作。

要求：
1. 查看当前所在目录
2. 切换到 /etc 目录
3. 查看 /etc 目录下的内容
4. 切换回自己的家目录
5. 查看家目录下的隐藏文件

<details>
<summary>点击查看答案</summary>

```bash
# 1. 查看当前所在目录
pwd

# 2. 切换到 /etc 目录
cd /etc

# 3. 查看 /etc 目录下的内容
ls
ls -la  # 查看详细信息和隐藏文件

# 4. 切换回自己的家目录
cd ~
# 或者
cd

# 5. 查看家目录下的隐藏文件
ls -a
ls -la  # 查看详细信息
```

</details>

### 练习 2：进阶练习 - 目录结构探索

**题目**：探索 Linux 目录结构，理解各目录的作用。

要求：
1. 查看 /bin 目录下有哪些命令
2. 查看 /etc 目录下有哪些配置文件
3. 查看 /var/log 目录下有哪些日志文件
4. 查看 /proc/cpuinfo 文件内容
5. 查看 /sys/class/net 目录下有哪些网络接口

<details>
<summary>点击查看答案</summary>

```bash
# 1. 查看 /bin 目录下的命令
ls /bin | head -20  # 只显示前 20 个

# 2. 查看 /etc 目录下的配置文件
ls /etc | grep ".conf"  # 过滤出配置文件

# 3. 查看 /var/log 目录下的日志文件
ls -lh /var/log  # 显示详细信息和文件大小

# 4. 查看 CPU 信息
cat /proc/cpuinfo | head -30  # 只显示前 30 行

# 5. 查看网络接口
ls /sys/class/net
# 通常会看到 lo（回环）和 eth0 或 ens33 等网卡
```

</details>

### 练习 3（挑战）：综合练习 - 创建项目结构

**题目**：创建一个完整的项目目录结构。

要求：
1. 在家目录下创建 projects/web 目录
2. 在 web 目录下创建 src、dist、config 子目录
3. 在 src 目录下创建 index.html、style.css、script.js 文件
4. 在 config 目录下创建 nginx.conf 配置文件
5. 使用绝对路径和相对路径分别访问这些文件

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建项目目录结构
cd ~
mkdir -p projects/web/{src,dist,config}

# 2. 进入 web 目录
cd projects/web

# 3. 创建文件
touch src/index.html src/style.css src/script.js
touch config/nginx.conf

# 4. 写入一些内容
echo "<h1>Hello Linux</h1>" > src/index.html
echo "body { margin: 0; }" > src/style.css
echo "console.log('Hello');" > src/script.js
echo "server { listen 80; }" > config/nginx.conf

# 5. 使用绝对路径访问
cat /home/user/projects/web/src/index.html

# 6. 使用相对路径访问
cat ./src/index.html
cat ../web/src/style.css  # 从 config 目录访问 src

# 7. 查看完整目录结构
ls -R  # 递归显示所有子目录
```

</details>

---

## 下一章预告

下一章我们会学习 **文件与目录操作**——也就是如何在 Linux 里复制、移动、删除文件和目录。你会学到：

- cp、mv、rm 这些命令怎么用
- 如何批量重命名文件
- 如何查找文件（find、locate）
- 如何查看文件内容（cat、less、head、tail）

这些是日常使用最频繁的操作，学会了就能在 Linux 里"自由行动"了。
