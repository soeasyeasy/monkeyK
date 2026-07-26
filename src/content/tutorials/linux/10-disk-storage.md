---
title: "第十章：磁盘与存储管理"
description: "掌握 Linux 磁盘管理的核心技能，包括磁盘分区、文件系统格式化、挂载与卸载、LVM 逻辑卷管理以及磁盘空间监控"
---

# 第十章：磁盘与存储管理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Linux 下怎么查看磁盘使用情况？为什么我的磁盘满了？
- 什么是分区？为什么要分区？怎么给新硬盘分区？
- 挂载是什么意思？为什么我插了 U 盘却访问不了？
- LVM 是什么？听说可以动态调整磁盘大小，怎么做到的？

这一章就是为了解答这些问题。我们会从磁盘的基本概念讲起，一步步带你掌握 Linux 下的磁盘分区、文件系统管理、挂载操作以及 LVM 逻辑卷管理。学完之后，你就能独立处理磁盘空间不足、新硬盘挂载等问题了。

---

## 10.1 为什么需要磁盘与存储管理？

### 痛点分析

想象一下这个场景：你的服务器突然报警，说磁盘空间不足。你登录上去一看，发现 `/var/log` 目录占了几十个 G，系统快要崩溃了。你急着清理空间，但不知道哪些文件最大，也不知道怎么扩容。

这就是没有磁盘管理知识时的典型困境。在 Linux 运维中，存储问题是最常见的故障之一，具体痛点包括：

- **磁盘满了**：日志文件、临时文件占用大量空间，系统无法正常运行
- **新硬盘不会用**：买了新硬盘插上去，却不知道如何分区、格式化、挂载
- **空间分配不合理**：某个分区满了，另一个分区还空着，却无法调配
- **数据丢失风险**：误操作导致数据丢失，没有备份和恢复机制

### 生活化类比

把 Linux 磁盘管理想象成"管理仓库"：

> - **硬盘**：仓库大楼，存放所有货物的地方
> - **分区**：把大楼分成多个房间，每个房间存放不同类型的货物
> - **文件系统**：房间的装修方式，决定了货物怎么摆放、怎么查找
> - **挂载**：把房间的门打开，让你能进去取货
> - **LVM**：可移动的隔墙，可以根据需要调整房间大小

没有这些管理，你的数据就像堆在仓库门口的货物，乱七八糟，找都找不到。

---

## 10.2 核心原理讲解

### 磁盘设备命名

Linux 中每个硬盘都有一个设备名，存放在 `/dev` 目录下：

| 设备名 | 含义 |
| --- | --- |
| /dev/sda | 第一块 SCSI/SATA 硬盘 |
| /dev/sdb | 第二块 SCSI/SATA 硬盘 |
| /dev/nvme0n1 | 第一块 NVMe 固态硬盘 |
| /dev/vda | 第一块虚拟硬盘（虚拟机常见） |

**分区命名规则**：

```
/dev/sda1    # 第一块硬盘的第 1 个分区
/dev/sda2    # 第一块硬盘的第 2 个分区
/dev/sdb3    # 第二块硬盘的第 3 个分区
```

### 分区表类型

| 类型 | 最大支持 | 特点 |
| --- | --- | --- |
| MBR | 2TB，最多 4 个主分区 | 老式分区表，兼容性好 |
| GPT | 18EB，支持无限分区 | 现代分区表，推荐使用 |

### 文件系统类型

| 文件系统 | 特点 | 适用场景 |
| --- | --- | --- |
| ext4 | Linux 默认，稳定可靠 | 一般用途 |
| xfs | 高性能，支持大文件 | 大文件存储、数据库 |
| btrfs | 支持快照、压缩 | 需要高级功能的场景 |
| swap | 交换分区 | 内存不足时的虚拟内存 |

打个比方：

> 文件系统就像仓库的货架布局方式。ext4 是标准的货架，xfs 是重型货架（适合大货物），btrfs 是智能货架（能自动记录货物变化）。

---

## 10.3 基础用法

### 查看磁盘信息

```bash
# 查看所有磁盘和分区
lsblk
# 输出类似：
# NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
# sda      8:0    0  100G  0 disk
# ├─sda1   8:1    0   50G  0 part /          # 根分区
# └─sda2   8:2    0   50G  0 part /home      # home 分区
# sdb      8:16   0  500G  0 disk             # 第二块硬盘（未分区）

# 查看磁盘详细信息
sudo fdisk -l
# 输出类似：
# Disk /dev/sda: 100 GiB, 107374182400 bytes
# Device     Boot Start     End   Sectors  Size Id Type
# /dev/sda1        2048 104857599 104855552   50G 83 Linux
# /dev/sda2   104857600 209715199 104857600   50G 83 Linux

# 查看磁盘使用情况（人类可读格式）
df -h
# 输出类似：
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/sda1        50G   20G   28G  42% /           # 根分区
# /dev/sda2        50G   10G   38G  21% /home       # home 分区

# 查看某个目录的磁盘占用
du -sh /var/log
# 输出：2.3G    /var/log

# 查看目录下的文件大小排序
du -sh /var/log/* | sort -rh | head -10
# 输出最大的 10 个文件/目录
```

### 磁盘分区

```bash
# 使用 fdisk 分区（MBR 分区表）
sudo fdisk /dev/sdb
# 进入交互模式后：
# n - 新建分区
# p - 选择主分区
# 1 - 分区号
# 回车 - 默认起始扇区
# +100G - 分区大小
# w - 写入并退出

# 使用 parted 分区（支持 GPT，推荐）
sudo parted /dev/sdb
# 进入交互模式后：
(parted) mklabel gpt                    # 创建 GPT 分区表
(parted) mkpart primary ext4 0% 50%     # 创建第一个分区（占 50%）
(parted) mkpart primary ext4 50% 100%   # 创建第二个分区（占剩余空间）
(parted) print                          # 查看分区
(parted) quit                           # 退出

# ✅ 推荐：使用 parted（支持 GPT，功能更强）
sudo parted /dev/sdb mklabel gpt
sudo parted /dev/sdb mkpart primary ext4 0% 100%

# ❌ 错误：对大于 2TB 的硬盘使用 fdisk（fdisk 不支持 GPT）
```

### 格式化文件系统

```bash
# 格式化为 ext4
sudo mkfs.ext4 /dev/sdb1
# 输出类似：
# mke2fs 1.45.5 (07-Jan-2020)
# Creating filesystem with 26214400 4k blocks and 6553600 inodes
# ...

# 格式化为 xfs
sudo mkfs.xfs /dev/sdb1

# 创建 swap 分区
sudo mkswap /dev/sdb2
sudo swapon /dev/sdb2     # 启用 swap

# ✅ 正确：格式化前确认设备名，避免格式化错误的磁盘
sudo mkfs.ext4 /dev/sdb1

# ❌ 错误：不确认设备名就格式化（可能格式化系统盘）
sudo mkfs.ext4 /dev/sda1   # 危险！可能是系统盘
```

### 挂载与卸载

```bash
# 创建挂载点
sudo mkdir -p /data

# 临时挂载
sudo mount /dev/sdb1 /data
# 含义：把 /dev/sdb1 分区挂载到 /data 目录

# 查看挂载情况
df -h
# 或者
mount | grep sdb1

# 卸载
sudo umount /data

# 查看 UUID（推荐用 UUID 挂载，更稳定）
sudo blkid
# 输出类似：
# /dev/sda1: UUID="abc123..." TYPE="ext4"
# /dev/sdb1: UUID="def456..." TYPE="ext4"

# 永久挂载（编辑 /etc/fstab）
sudo vim /etc/fstab
# 添加一行：
# UUID=def456...  /data  ext4  defaults  0  2
# 格式：UUID  挂载点  文件系统类型  选项  备份标记  检查顺序

# 测试 fstab 配置（不重启）
sudo mount -a

# ✅ 正确：使用 UUID 挂载（设备名可能变化）
UUID=def456...  /data  ext4  defaults  0  2

# ❌ 错误：使用设备名挂载（重启后设备名可能改变）
/dev/sdb1  /data  ext4  defaults  0  2
```

### LVM 逻辑卷管理

```bash
# === LVM 基本概念 ===
# PV（物理卷）：实际的硬盘或分区
# VG（卷组）：多个 PV 组成的"存储池"
# LV（逻辑卷）：从 VG 中划分出来的"虚拟分区"

# === 创建 LVM ===

# ❶ 创建物理卷（PV）
sudo pvcreate /dev/sdb1
# 含义：把 /dev/sdb1 初始化为 LVM 物理卷

# ❷ 创建卷组（VG）
sudo vgcreate mydata /dev/sdb1
# 含义：创建名为 mydata 的卷组，使用 /dev/sdb1

# ❸ 创建逻辑卷（LV）
sudo lvcreate -L 50G -n lv_data mydata
# 含义：从 mydata 卷组中创建 50G 的逻辑卷，名为 lv_data

# ❹ 格式化逻辑卷
sudo mkfs.ext4 /dev/mydata/lv_data

# ❺ 挂载逻辑卷
sudo mount /dev/mydata/lv_data /data

# === 扩展逻辑卷 ===

# ❶ 查看卷组剩余空间
vgdisplay mydata
# 看 "Free PE / Size" 这一行

# ❷ 扩展逻辑卷（增加 20G）
sudo lvextend -L +20G /dev/mydata/lv_data

# ❸ 扩展文件系统（让系统识别新空间）
sudo resize2fs /dev/mydata/lv_data
# 如果是 xfs 文件系统：
# sudo xfs_growfs /data

# ✅ 推荐：使用 lvextend 的 -r 参数（自动扩展文件系统）
sudo lvextend -L +20G -r /dev/mydata/lv_data

# === 缩减逻辑卷（仅 ext4 支持，xfs 不支持缩减）===

# ❶ 卸载
sudo umount /data

# ❷ 检查文件系统
sudo e2fsck -f /dev/mydata/lv_data

# ❸ 缩减文件系统
sudo resize2fs /dev/mydata/lv_data 30G

# ❹ 缩减逻辑卷
sudo lvreduce -L 30G /dev/mydata/lv_data

# ❺ 重新挂载
sudo mount /dev/mydata/lv_data /data
```

### 磁盘空间监控

```bash
# 查看整体使用情况
df -h

# 查看指定目录大小
du -sh /var/log
du -sh /home/*

# 找出最大的 10 个文件
sudo find / -type f -exec du -h {} + 2>/dev/null | sort -rh | head -10

# 找出大于 100M 的文件
sudo find / -type f -size +100M 2>/dev/null

# 监控磁盘 IO
iostat -x 1 5
# 输出类似：
# Device  r/s   w/s  rkB/s  wkB/s  %util
# sda    10.5  20.3  420.0  812.0  15.2

# ✅ 推荐：定期清理日志文件
sudo journalctl --vacuum-size=100M    # 限制日志大小为 100M
sudo find /var/log -name "*.log" -mtime +30 -delete  # 删除 30 天前的日志

# ❌ 错误：直接删除正在写入的日志文件
sudo rm /var/log/syslog   # 错误！应该用 truncate
sudo truncate -s 0 /var/log/syslog   # 正确：清空文件但不删除
```

---

## 10.4 对比表格

### 分区工具对比

| 工具 | 支持分区表 | 特点 | 推荐程度 |
| --- | --- | --- | --- |
| fdisk | MBR | 经典工具，交互简单 | 小硬盘（<2TB） |
| parted | MBR/GPT | 支持 GPT，功能全面 | 推荐 |
| gdisk | GPT | 专为 GPT 设计 | GPT 分区推荐 |
| sfdisk | MBR/GPT | 命令行脚本化 | 自动化脚本 |

### 文件系统对比

| 文件系统 | 最大文件 | 最大分区 | 特点 | 适用场景 |
| --- | --- | --- | --- | --- |
| ext4 | 16TB | 1EB | 稳定可靠，Linux 默认 | 一般用途 |
| xfs | 8EB | 8EB | 高性能，并行 IO | 大文件、数据库 |
| btrfs | 16EB | 16EB | 快照、压缩、校验 | 需要高级功能 |
| swap | - | - | 交换分区 | 虚拟内存 |

### 挂载选项对比

| 选项 | 含义 | 使用场景 |
| --- | --- | --- |
| defaults | 默认选项（rw,suid,dev,exec,auto,nouser,async） | 一般用途 |
| ro | 只读挂载 | 保护数据 |
| rw | 读写挂载 | 正常读写 |
| noexec | 禁止执行二进制文件 | 安全考虑 |
| nosuid | 忽略 SUID 位 | 安全考虑 |
| noatime | 不更新访问时间 | 提升性能 |

### LVM 概念对比

| 概念 | 缩写 | 作用 | 类比 |
| --- | --- | --- | --- |
| 物理卷 | PV | 实际的硬盘或分区 | 仓库的地基 |
| 卷组 | VG | 多个 PV 组成的存储池 | 仓库大楼 |
| 逻辑卷 | LV | 从 VG 划分的虚拟分区 | 仓库的房间 |

---

## 10.5 新手常见误区

### 误区 1："分区越多越好"

**错！** 分区太多会导致空间浪费（每个分区都可能剩下未使用的空间）。对于普通服务器，通常只需要：
- `/`（根分区）：系统文件
- `/home`：用户数据
- `/var`：日志和可变数据
- `swap`：交换分区

如果是数据服务器，可以把大部分空间分给 `/data`。

### 误区 2："格式化会丢失数据"

**不完全对！** 格式化只是重建文件系统，数据本身还在磁盘上，只是系统"找不到"了。如果误格式化，立即停止写入，用数据恢复工具（如 testdisk、photorec）有可能找回数据。但恢复成功率不是 100%，所以一定要定期备份。

### 误区 3："LVM 可以随意扩展和缩减"

**不完全对！** LVM 扩展很容易，但缩减有限制：
- xfs 文件系统不支持缩减
- ext4 支持缩减，但必须先卸载
- 缩减操作有风险，可能导致数据丢失

所以建议：创建 LV 时预留足够空间，避免后续缩减。

### 误区 4："磁盘满了就加硬盘"

**错！** 磁盘满了可能是以下原因：
- 日志文件过大（应该清理或轮转）
- 临时文件未删除（应该定期清理）
- 数据库binlog未清理（应该配置自动清理）
- 确实空间不足（才需要加硬盘或扩容）

先排查原因，再决定是否需要加硬盘。

### 误区 5："挂载点必须是空目录"

**错！** 挂载点可以是任何目录，甚至是已有内容的目录。挂载后，原目录的内容会被"隐藏"，直到卸载后才恢复。但建议挂载点使用空目录，避免混淆。

```bash
# 挂载到非空目录
mkdir -p /data/test
echo "original" > /data/test/file.txt
mount /dev/sdb1 /data/test
# 现在 /data/test 下的内容是 sdb1 的内容，原 file.txt 被隐藏
umount /data/test
# 原 file.txt 又出现了
```

---

## 10.6 动手练习

### 练习 1（基础）：查看磁盘信息并清理空间

**题目**：查看当前系统的磁盘使用情况，找出 `/var/log` 目录下最大的 5 个文件，并清理超过 30 天的旧日志。

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 查看整体磁盘使用情况
df -h
# 看 Use% 列，找出使用率高的分区

# ❷ 查看 /var/log 目录大小
du -sh /var/log
# 如果很大，继续排查

# ❸ 找出 /var/log 下最大的 5 个文件
sudo du -ah /var/log | sort -rh | head -5
# 或者
sudo find /var/log -type f -exec du -h {} + | sort -rh | head -5

# ❹ 查看超过 30 天的日志文件
sudo find /var/log -type f -name "*.log" -mtime +30
# -mtime +30 表示修改时间超过 30 天

# ❺ 删除超过 30 天的旧日志
sudo find /var/log -type f -name "*.log" -mtime +30 -delete

# ❻ 清空正在写入的大日志文件（不删除文件本身）
sudo truncate -s 0 /var/log/syslog
sudo truncate -s 0 /var/log/kern.log

# ❼ 验证清理效果
df -h
du -sh /var/log
```

注意：删除日志前，确认这些日志不再需要。重要日志建议先备份。

</details>

### 练习 2（进阶）：添加新硬盘并配置 LVM

**题目**：假设你添加了一块新硬盘 `/dev/sdc`（100G），请完成以下操作：
1. 创建 GPT 分区表，创建一个占满整个硬盘的分区
2. 将分区初始化为 LVM 物理卷
3. 创建名为 `data_vg` 的卷组
4. 创建 50G 的逻辑卷 `data_lv`，格式化为 ext4
5. 挂载到 `/data` 目录，并配置开机自动挂载

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 创建 GPT 分区表
sudo parted /dev/sdc mklabel gpt

# ❷ 创建分区（占满整个硬盘）
sudo parted /dev/sdc mkpart primary ext4 0% 100%

# ❸ 创建物理卷
sudo pvcreate /dev/sdc1

# ❹ 创建卷组
sudo vgcreate data_vg /dev/sdc1

# ❺ 创建逻辑卷（50G）
sudo lvcreate -L 50G -n data_lv data_vg

# ❻ 格式化为 ext4
sudo mkfs.ext4 /dev/data_vg/data_lv

# ❼ 创建挂载点并挂载
sudo mkdir -p /data
sudo mount /dev/data_vg/data_lv /data

# ❽ 获取 UUID
sudo blkid /dev/data_vg/data_lv
# 输出类似：/dev/data_vg/data_lv: UUID="abc123..."

# ❾ 配置开机自动挂载
sudo vim /etc/fstab
# 添加一行：
# UUID=abc123...  /data  ext4  defaults  0  2

# ❿ 测试 fstab 配置
sudo mount -a
# 如果没有报错，说明配置正确

# ⓫ 验证
df -h /data
lsblk
```

</details>

### 练习 3（挑战）：在线扩展逻辑卷

**题目**：假设 `/data` 分区（使用 LVM）空间不足，需要在线扩展 20G。要求：
1. 不卸载文件系统
2. 扩展后立即可用
3. 验证扩展成功

<details>
<summary>点击查看答案</summary>

```bash
# ❶ 查看当前状态
df -h /data
# 假设当前是 50G

# ❷ 查看卷组剩余空间
vgdisplay data_vg
# 看 "Free PE / Size" 这一行，确认有至少 20G 剩余

# ❸ 如果没有剩余空间，需要先添加新硬盘
# 假设新硬盘是 /dev/sdd
sudo pvcreate /dev/sdd1
sudo vgextend data_vg /dev/sdd1

# ❹ 扩展逻辑卷（-r 参数自动扩展文件系统）
sudo lvextend -L +20G -r /dev/data_vg/data_lv
# -r 参数会自动调用 resize2fs 扩展文件系统

# ❺ 验证扩展成功
df -h /data
# 应该显示 70G（50G + 20G）

# ❻ 查看 LVM 状态
lvs
pvs
vgs

# === 如果是 xfs 文件系统 ===
# sudo lvextend -L +20G /dev/data_vg/data_lv
# sudo xfs_growfs /data

# === 扩展完成 ===
echo "扩展完成，当前 /data 分区大小："
df -h /data
```

注意：
- ext4 支持在线扩展（不需要卸载）
- xfs 只支持扩展，不支持缩减
- 扩展操作不会丢失数据，但建议提前备份

</details>

---

## 下一章预告

下一章我们会学习 Linux 的 **Shell 脚本编程**。你会了解到如何编写自动化脚本，包括变量、条件判断、循环、函数等核心语法。学完之后，你就能把日常重复性的工作写成脚本，让系统自动执行，大大提高工作效率。
