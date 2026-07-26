---
title: '第五章：用户与权限管理'
description: 'Linux 用户管理、文件权限机制与权限控制'
---

# 第五章：用户与权限管理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Linux 为什么要有"用户"的概念？一个人用一台电脑，直接给最高权限不就行了？
- 文件权限那一串 `rwxr-xr--` 到底是什么意思？看着像天书。
- `sudo` 和 `root` 有什么区别？为什么不能一直用 root？
- 为什么我执行一个命令总是提示 "Permission denied"？

这一章就是为了解答这些问题。我们会先搞清楚 Linux 的多用户模型，再彻底搞懂文件权限的含义，最后学会常用的权限管理命令。学完之后，你再也不会被权限问题搞得头大了。

---

## 5.1 为什么需要用户与权限管理？

### 痛点分析

想象一下这样的场景：

你和室友共用一台电脑。你把重要文件放在桌面上，室友一不小心给删了。你想装个软件，室友把系统配置改坏了，整个电脑都开不了机。更过分的是，你打开室友的文件夹，发现里面全是乱七八糟的东西，还占了你好几个 G 的空间。

这就是没有用户隔离和权限控制时的日常：**谁都能干任何事，出了问题互相背锅**。

### 解决方案

Linux 的用户和权限系统就像一栋公寓的管理规则：

- 每个住户（用户）有自己的房间（家目录），别人不能随便进
- 公共区域（共享目录）大家都能用，但有使用规则
- 公寓管理员（root）可以管理一切，但普通住户不能乱动公共设施
- 每个房间都有门锁（权限），决定谁能进、谁能看、谁能改

打个比方：

> Linux 的权限系统就像公司的门禁卡。普通员工只能进自己的工位和公共会议室，不能进机房和财务室。管理员有万能卡，能进所有地方。但不是每个人都该拿万能卡——万一刷错门，后果很严重。

### 前后对比

```
没有用户权限管理：
  任何人 → 删除任何文件 → 修改系统配置 → 系统崩溃 → 无法追责

有用户权限管理：
  普通用户 → 只能操作自己的文件
  管理员 → 管理系统，操作有记录
  权限不足 → 自动拒绝，保护系统安全
```

> 一句话总结：用户与权限管理让系统更安全、更有秩序、出问题可追溯。

---

## 5.2 Linux 用户模型

### 核心概念

Linux 是一个多用户多任务的操作系统。即使只有你一个人在用，系统内部也有大量的用户和用户在后台运行。

| 概念 | 说明 | 类比 |
| --- | --- | --- |
| 用户（User） | 系统中的使用者账号 | 公寓的住户 |
| 用户组（Group） | 一组用户的集合，方便批量管理权限 | 公寓里的"住户群" |
| UID | 用户 ID，系统用数字识别用户 | 住户的门牌号 |
| GID | 用户组 ID | 群组的编号 |
| root | 超级管理员，UID 为 0 | 公寓的管理员，有万能钥匙 |

### 用户类型

```
root（超级管理员）
  ├── UID = 0
  ├── 拥有系统最高权限
  └── 可以做任何事情（包括搞坏系统）

普通用户
  ├── UID >= 1000（CentOS >= 500）
  ├── 权限受限，只能操作自己的文件
  └── 需要管理员授权才能做某些操作

系统用户（虚拟用户）
  ├── UID 1-999
  ├── 不能登录系统
  └── 用于运行后台服务（如 nginx、mysql）
```

### 关键文件

Linux 的用户信息存储在几个关键文件中：

```bash
# 查看用户信息文件
cat /etc/passwd
# 格式：用户名:密码占位:UID:GID:描述信息:家目录:登录Shell
# 示例：
# root:x:0:0:root:/root:/bin/bash
# alice:x:1000:1000:Alice:/home/alice:/bin/bash

# 查看用户组信息文件
cat /etc/group
# 格式：组名:密码占位:GID:组成员列表
# 示例：
# developers:x:1001:alice,bob

# 查看用户密码（加密后）
sudo cat /etc/shadow
# 只有 root 能读这个文件，存放加密后的密码
```

> 打个比方：`/etc/passwd` 就像公寓的住户登记表，记录每个人住哪、什么身份。`/etc/shadow` 就像保险柜里的密码本，只有管理员能看。

---

## 5.3 用户管理命令

### 创建和删除用户

```bash
# 创建新用户 alice
sudo useradd alice
# 在系统中添加用户 alice，自动创建家目录 /home/alice

# 创建用户并指定用户组
sudo useradd -g developers alice
# 将 alice 加入 developers 组（组必须已存在）

# 创建用户并指定 UID
sudo useradd -u 1050 alice
# 指定 alice 的 UID 为 1050

# 创建用户并指定 Shell
sudo useradd -s /bin/zsh alice
# 让 alice 登录后使用 zsh 而不是默认的 bash

# 设置用户密码
sudo passwd alice
# 系统会提示你输入两次密码

# 删除用户（保留家目录）
sudo userdel alice

# 删除用户并删除家目录
sudo userdel -r alice
# 推荐加 -r，否则家目录会残留
```

### 修改用户信息

```bash
# 修改用户的默认 Shell
sudo usermod -s /bin/zsh alice

# 将用户添加到附加组
sudo usermod -aG docker alice
# -a 表示追加（append），不加 -a 会把用户从其他组移除
# -G 表示附加组

# 锁定用户（禁止登录）
sudo usermod -L alice

# 解锁用户
sudo usermod -U alice

# 查看当前登录的用户
who
# 输出类似：alice pts/0  2024-01-15 10:30

# 查看用户 ID 信息
id alice
# 输出类似：uid=1000(alice) gid=1000(alice) groups=1000(alice),999(docker)
```

### 切换用户

```bash
# 切换到 root 用户（保留当前环境变量）
su root

# 切换到 root 用户（完全切换，加载 root 的环境）
su - root
# 推荐加 -，否则环境变量还是原来用户的

# 切换回原来的用户
exit
# 或者按 Ctrl + D

# 以其他用户身份执行单条命令
sudo -u alice ls /home/alice
# 以 alice 的身份执行 ls 命令
```

### sudo 提权

```bash
# 以管理员权限执行命令
sudo apt update
# 临时获取 root 权限执行一条命令

# 查看当前用户是否有 sudo 权限
groups
# 如果输出中包含 sudo 或 wheel 组，就有 sudo 权限

# 将用户添加到 sudo 组（Debian/Ubuntu）
sudo usermod -aG sudo alice

# 将用户添加到 wheel 组（CentOS/RHEL）
sudo usermod -aG wheel alice
```

> 打个比方：`su` 就像你直接跑到管理员办公室，用他的电脑操作。`sudo` 就像你拿着管理员的授权章，在自己的工位上盖个章就能办管理员才能办的事。

---

## 5.4 文件权限详解

### 权限字符串解读

执行 `ls -l` 时，每行开头都有一串字符，这就是权限信息：

```bash
ls -l
# 输出示例：
# -rw-r--r-- 1 alice developers 1024 Jan 15 10:30 hello.txt
# drwxr-xr-x 2 bob   developers 4096 Jan 15 11:00 mydir/
```

拆解这串字符：

```
-  rwx  r-x  r--
|  |    |    |
|  |    |    └── 其他人（others）的权限：r--（只读）
|  |    └── 所属组（group）的权限：r-x（读+执行）
|  └── 所有者（owner）的权限：rwx（读+写+执行）
└── 文件类型：- 普通文件，d 目录，l 链接
```

### 三种基本权限

| 权限 | 字母 | 数字 | 对文件的含义 | 对目录的含义 | 类比 |
| --- | --- | --- | --- | --- | --- |
| 读（read） | r | 4 | 可以查看文件内容 | 可以列出目录中的文件（ls） | 能看菜单 |
| 写（write） | w | 2 | 可以修改文件内容 | 可以在目录中创建/删除文件 | 能改菜单 |
| 执行（execute） | x | 1 | 可以运行这个文件 | 可以进入这个目录（cd） | 能进厨房做菜 |

### 常见文件类型

| 类型标识 | 含义 | 示例 |
| --- | --- | --- |
| `-` | 普通文件 | 文本文件、二进制文件等 |
| `d` | 目录 | 文件夹 |
| `l` | 符号链接 | 快捷方式 |
| `c` | 字符设备 | 终端、键盘 |
| `b` | 块设备 | 硬盘、U 盘 |

### 权限数字表示法

权限可以用数字表示，更方便：

```
r = 4, w = 2, x = 1

rwx = 4+2+1 = 7
r-x = 4+0+1 = 5
rw- = 4+2+0 = 6
r-- = 4+0+0 = 4
--- = 0+0+0 = 0
```

所以 `-rw-r--r--` 用数字表示就是 `644`：

```
rw- = 6（所有者：可读可写）
r-- = 4（所属组：只读）
r-- = 4（其他人：只读）
```

`-rwxr-xr-x` 用数字表示就是 `755`：

```
rwx = 7（所有者：可读可写可执行）
r-x = 5（所属组：可读可执行）
r-x = 5（其他人：可读可执行）
```

---

## 5.5 权限管理命令

### chmod -- 修改权限

```bash
# 使用数字方式修改权限
chmod 755 script.sh
# 所有者 rwx(7)，组 r-x(5)，其他人 r-x(5)

chmod 644 config.txt
# 所有者 rw-(6)，组 r--(4)，其他人 r--(4)

# 使用符号方式修改权限
chmod u+x script.sh
# 给所有者添加执行权限

chmod g+w file.txt
# 给所属组添加写权限

chmod o-r file.txt
# 移除其他人的读权限

chmod a+x script.sh
# 给所有人添加执行权限（a = all）

# 递归修改目录及其内容的权限
chmod -R 755 mydir/
# 把 mydir 目录和里面所有文件/子目录的权限都改成 755
```

### chown -- 修改所有者

```bash
# 修改文件的所有者
sudo chown bob file.txt
# 把 file.txt 的所有者改为 bob

# 修改文件的所有者和所属组
sudo chown bob:developers file.txt
# 同时改所有者和组

# 只修改所属组
sudo chown :developers file.txt

# 递归修改目录的所有者
sudo chown -R bob:developers mydir/
# 把 mydir 及其所有内容的拥有者改为 bob，组改为 developers
```

### chgrp -- 修改所属组

```bash
# 修改文件所属组
sudo chgrp developers file.txt
# 把 file.txt 的所属组改为 developers

# 递归修改
sudo chgrp -R developers mydir/
```

### 默认权限 -- umask

```bash
# 查看当前 umask 值
umask
# 输出类似：0022

# umask 决定新建文件/目录的默认权限
# 新建文件默认权限 = 666 - umask
# 新建目录默认权限 = 777 - umask

# 当 umask = 022 时：
# 新建文件：666 - 022 = 644（rw-r--r--）
# 新建目录：777 - 022 = 755（rwxr-xr-x）

# 临时修改 umask
umask 0077
# 新建文件：600（rw-------），新建目录：700（rwx------）
```

> 打个比方：umask 就像"默认屏蔽掉的权限"。你开了个新房间，umask 决定默认锁上哪些门。

---

## 5.6 对比表格

### su 与 sudo 对比

| 对比项 | su | sudo |
| --- | --- | --- |
| 全称 | switch user | super user do |
| 作用 | 切换到另一个用户 | 以另一个用户身份执行命令 |
| 是否需要密码 | 需要目标用户的密码 | 需要当前用户的密码 |
| 执行方式 | 进入目标用户的 Shell | 执行完一条命令后回到当前用户 |
| 安全性 | 需要共享密码，不推荐 | 有日志记录，更安全 |
| 推荐度 | 不推荐日常使用 | 推荐使用 |

### 权限数字速查表

| 数字 | 权限 | 含义 | 常见场景 |
| --- | --- | --- | --- |
| 777 | rwxrwxrwx | 所有人可读写执行 | 几乎不用，太危险 |
| 755 | rwxr-xr-x | 所有者全权限，其他人读+执行 | 目录、可执行脚本 |
| 700 | rwx------ | 仅所有者可读写执行 | 私有目录 |
| 644 | rw-r--r-- | 所有者可读写，其他人只读 | 普通文件 |
| 600 | rw------- | 仅所有者可读写 | 配置文件、密钥文件 |
| 400 | r-------- | 仅所有者可读 | 只读密钥文件 |

---

## 5.7 新手常见误区

### 误区 1："chmod 777 最省事，所有文件都设成 777"

大错特错。777 意味着所有人都能读、写、执行这个文件。如果这是一个脚本，任何人都能修改它加入恶意代码。如果这是一个配置文件，任何人都能篡改。正确做法是按最小权限原则，只给必要的权限。

### 误区 2："chown 和 chmod 搞不清楚"

`chown`（change owner）改的是"这个文件归谁所有"，`chmod`（change mode）改的是"这个文件有什么权限"。一个是换主人，一个是换门锁。别搞混了。

### 误区 3："一直用 root 用户操作"

root 拥有最高权限，一个 `rm -rf /` 就能毁掉整个系统。日常操作应该用普通用户，只在需要管理员权限时用 `sudo`。这就像你不会每天都拿着公司大门的万能钥匙到处走，只在需要时才用。

### 误区 4："usermod -G 是添加组"

`usermod -G` 是"替换"附加组，不是"添加"。如果不加 `-a`（append），用户会从其他附加组中被移除。正确添加组的写法是 `usermod -aG 组名 用户名`。

### 误区 5："目录的读权限就够了，不需要执行权限"

目录的执行权限（x）含义和文件不同。对目录来说，x 代表"能否 cd 进入这个目录"。如果目录只有 r 没有 x，你能用 `ls` 看到里面有什么文件，但不能 `cd` 进去，也不能访问里面的文件。

---

## 5.8 动手练习

### 练习 1：基础练习

创建一个用户 `testuser`，设置密码，然后切换到该用户，在其家目录下创建一个文件 `hello.txt`，设置权限为 644。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建用户 testuser
sudo useradd testuser

# 2. 设置密码
sudo passwd testuser
# 输入两次密码

# 3. 切换到 testuser
su - testuser

# 4. 创建文件
echo "hello world" > hello.txt

# 5. 设置权限为 644
chmod 644 hello.txt

# 6. 验证权限
ls -l hello.txt
# 应该输出：-rw-r--r-- 1 testuser testuser ... hello.txt

# 7. 切换回原来的用户
exit
```

</details>

### 练习 2：进阶练习

创建一个用户组 `devteam`，将用户 `alice` 和 `bob` 加入该组。然后创建一个目录 `/shared`，要求：
- `devteam` 组的成员可以读写该目录中的文件
- 其他人不能访问该目录

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建用户组
sudo groupadd devteam

# 2. 将 alice 和 bob 加入 devteam 组
sudo usermod -aG devteam alice
sudo usermod -aG devteam bob

# 3. 创建共享目录
sudo mkdir /shared

# 4. 修改目录所属组为 devteam
sudo chown root:devteam /shared

# 5. 设置权限：所有者和组可读写执行，其他人无权限
sudo chmod 770 /shared

# 6. 验证
ls -ld /shared
# 应该输出：drwxrwx--- 2 root devteam ... /shared/

# 7. 测试：切换到 alice 用户
su - alice
cd /shared
touch test.txt  # 应该成功

# 8. 测试：切换到其他用户（非 devteam 组）
su - charlie
cd /shared  # 应该提示 Permission denied
```

</details>

### 练习 3（挑战）：综合练习

解释以下场景并给出解决方案：

用户 `alice` 创建了一个脚本 `deploy.sh`，权限为 `644`。她尝试执行 `./deploy.sh`，系统提示 "Permission denied"。为什么？如何解决？

另外，`bob` 想修改这个脚本，但提示没有权限。如何让 `bob` 能修改但不给其他人修改权限？

<details>
<summary>点击查看答案</summary>

**问题 1：alice 为什么不能执行自己的脚本？**

权限 `644` 表示 `rw-r--r--`，所有人（包括所有者）都没有执行权限（x）。所以 alice 虽然能读写这个文件，但不能执行它。

解决方法：

```bash
# 给所有者添加执行权限
chmod u+x deploy.sh
# 或者用数字方式
chmod 744 deploy.sh
```

**问题 2：如何让 bob 能修改但不给其他人修改权限？**

方案一：把 bob 和 alice 放到同一个组，然后给组添加写权限

```bash
# 创建一个开发组
sudo groupadd devteam
sudo usermod -aG devteam alice
sudo usermod -aG devteam bob

# 修改文件所属组
sudo chown alice:devteam deploy.sh

# 给组添加写权限
chmod 664 deploy.sh
# 现在 alice 和 bob（同组）都能读写，其他人只能读
```

方案二：使用 ACL（访问控制列表）精确控制

```bash
# 给 bob 单独设置读写权限
setfacl -m u:bob:rw deploy.sh

# 验证 ACL
getfacl deploy.sh
```

</details>

---

## 下一章预告

下一章我们会学习 **Linux 软件包管理**，也就是怎么在 Linux 上安装、更新、卸载软件。你会了解到：

- `apt`、`yum`、`dnf` 这些命令到底怎么用
- 软件源是什么？为什么要换源？
- 怎么从源码编译安装软件？
- `snap` 和 `flatpak` 这些新型包管理又是什么？

学会软件包管理，你就能在 Linux 上自如地安装各种开发工具和运行环境了。
