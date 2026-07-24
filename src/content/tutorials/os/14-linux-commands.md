---
title: '第十四章：Linux 基础命令'
description: '掌握 Linux 系统的基本命令，包括文件操作、目录管理、权限控制以及常用工具命令'
---

# 第十四章：Linux 基础命令

## 本章导读

在开始学习 Linux 命令之前，你可能会有这些疑问：

1. **Linux 命令那么多，我需要全部记住吗？** 当然不是，常用的也就几十个，关键是理解命令的规律。
2. **命令的选项和参数到底是什么意思？** 为什么有的命令加 `-l`，有的加 `--help`，看起来乱七八糟。
3. **权限控制有什么用？** 为什么我的文件别人访问不了，我又怎么控制谁能访问？
4. **管道和重定向是什么？** 听说可以把一个命令的输出接到另一个命令，这到底怎么实现？

本章会带你从零开始，系统学习 Linux 最常用的命令。学完之后，你就能在终端里自如地操作文件、管理目录、控制权限，还能用管道和重定向把多个命令组合起来完成复杂任务。

## 为什么需要 Linux 命令

### 没有命令行会怎样

想象一下，你有一台 Linux 服务器，上面跑着网站、数据库、各种服务。如果出了问题，你需要：

- 查看某个日志文件里有没有错误
- 找到占用磁盘空间最大的文件
- 批量修改一批文件的权限
- 监控系统当前的运行状态

如果没有命令行，你只能干瞪眼。图形界面在服务器上几乎不存在，命令行才是 Linux 世界的通用语言。

### 生活化类比：命令行就像自动售货机

把 Linux 命令行想象成一台自动售货机：

- **命令**：你按的按钮（比如"可乐"）
- **选项**：你选的规格（比如"大杯"、"加冰"）
- **参数**：你选的具体商品（比如"330ml 罐装"）

你按下"可乐 + 大杯 + 加冰"，售货机就给你一杯加了冰的大杯可乐。同样，你输入 `ls -la /home`，系统就给你列出 `/home` 目录下所有文件的详细信息。

### 命令行的核心优势

| 优势 | 说明 | 类比 |
|------|------|------|
| 精确控制 | 可以精确指定要做什么 | 像写菜谱一样精确 |
| 批量操作 | 一条命令处理成百上千个文件 | 像流水线一样高效 |
| 自动化 | 可以写成脚本自动执行 | 像定时闹钟一样自动 |
| 远程管理 | 通过网络远程操作服务器 | 像远程遥控器一样方便 |

## Linux 命令基础

### 命令格式

Linux 命令的一般格式：

```bash
命令 [选项] [参数]

示例：
ls -la /home
```

**组成部分**：

- **命令**：要执行的操作（如 `ls`、`cd`）
- **选项**：修改命令的行为（如 `-l`、`-a`）
- **参数**：命令作用的对象（如文件路径）

### 获取帮助

```bash
# 查看命令手册
man ls

# 查看命令简要说明
ls --help

# 查看命令位置
which ls

# 查看命令类型
type ls
```

::: tip
`man` 命令是学习 Linux 命令的最佳工具，它提供了命令的详细使用说明。
:::

## 文件操作命令

### 查看文件内容

**cat**：显示文件全部内容

```bash
# 显示文件内容
cat file.txt

# 显示行号
cat -n file.txt

# 合并多个文件
cat file1.txt file2.txt > combined.txt

# 创建文件（输入内容后按 Ctrl+D）
cat > newfile.txt
```

**more**：分页显示文件内容

```bash
# 分页显示
more file.txt

# 操作：
# 空格：下一页
# Enter：下一行
# q：退出
```

**less**：更强大的分页工具

```bash
# 分页显示（支持前后翻页）
less file.txt

# 操作：
# 空格：下一页
# b：上一页
# /：向下搜索
# ?：向上搜索
# q：退出
```

**head**：显示文件开头部分

```bash
# 显示前 10 行（默认）
head file.txt

# 显示前 20 行
head -n 20 file.txt

# 显示前 100 字节
head -c 100 file.txt
```

**tail**：显示文件结尾部分

```bash
# 显示最后 10 行（默认）
tail file.txt

# 显示最后 20 行
tail -n 20 file.txt

# 实时跟踪文件变化（常用于查看日志）
tail -f /var/log/syslog
```

::: info
`tail -f` 是监控日志文件的常用命令，它会持续输出文件的新增内容。
:::

### 文件信息

**stat**：显示文件详细信息

```bash
# 显示文件详细信息
stat file.txt

# 输出示例：
# File: file.txt
# Size: 1024       Blocks: 8          IO Block: 4096   regular file
# Device: 801h/2049d      Inode: 1234567     Links: 1
# Access: (0644/-rw-r--r--)  Uid: ( 1000/  user)   Gid: ( 1000/  user)
# Access: 2024-01-15 10:30:00.000000000 +0800
# Modify: 2024-01-15 10:30:00.000000000 +0800
# Change: 2024-01-15 10:30:00.000000000 +0800
```

**wc**：统计文件信息

```bash
# 统计行数、单词数、字节数
wc file.txt

# 只统计行数
wc -l file.txt

# 只统计单词数
wc -w file.txt

# 只统计字节数
wc -c file.txt
```

**file**：识别文件类型

```bash
# 识别文件类型
file file.txt

# 输出示例：
# file.txt: ASCII text
# image.png: PNG image data, 1920 x 1080, 8-bit/color RGBA
# program: ELF 64-bit LSB executable
```

### 文件比较

**diff**：比较文件差异

```bash
# 比较两个文件
diff file1.txt file2.txt

# 统一格式输出
diff -u file1.txt file2.txt

# 输出示例：
# --- file1.txt    2024-01-15 10:30:00.000000000 +0800
# +++ file2.txt    2024-01-15 10:31:00.000000000 +0800
# @@ -1,3 +1,3 @@
#  line1
# -line2
# +line2 modified
#  line3
```

**cmp**：比较文件是否相同

```bash
# 比较文件
cmp file1.txt file2.txt

# 输出：
# file1.txt file2.txt differ: char 6, line 2
```

## 目录管理命令

### 目录浏览

**ls**：列出目录内容

```bash
# 列出当前目录
ls

# 长格式显示
ls -l

# 显示隐藏文件
ls -a

# 长格式 + 隐藏文件 + 人类可读大小
ls -lah

# 按时间排序
ls -lt

# 按大小排序
ls -lS

# 递归列出
ls -R
```

**pwd**：显示当前工作目录

```bash
# 显示当前目录
pwd

# 输出示例：
# /home/user/documents
```

**tree**：树形显示目录结构

```bash
# 显示目录树
tree

# 显示指定目录
tree /home/user

# 显示隐藏文件
tree -a

# 限制深度
tree -L 2
```

### 目录操作

**cd**：切换目录

```bash
# 切换到指定目录
cd /home/user/documents

# 切换到用户主目录
cd ~
cd

# 切换到上一级目录
cd ..

# 切换到前一个目录
cd -

# 切换到当前目录（无实际作用）
cd .
```

**mkdir**：创建目录

```bash
# 创建单个目录
mkdir mydir

# 创建多个目录
mkdir dir1 dir2 dir3

# 递归创建目录（创建父目录）
mkdir -p parent/child/grandchild

# 创建目录并设置权限
mkdir -m 755 mydir
```

**rmdir**：删除空目录

```bash
# 删除空目录
rmdir mydir

# 递归删除空目录
rmdir -p parent/child/grandchild
```

### 文件复制和移动

**cp**：复制文件或目录

```bash
# 复制文件
cp file.txt backup.txt

# 复制文件到目录
cp file.txt /backup/

# 复制多个文件到目录
cp file1.txt file2.txt /backup/

# 复制目录（递归）
cp -r mydir backup_dir

# 保留属性复制
cp -p file.txt backup.txt

# 交互式覆盖
cp -i file.txt backup.txt

# 强制覆盖
cp -f file.txt backup.txt
```

**mv**：移动或重命名文件

```bash
# 重命名文件
mv oldname.txt newname.txt

# 移动文件到目录
mv file.txt /backup/

# 移动多个文件
mv file1.txt file2.txt /backup/

# 移动目录
mv mydir /backup/

# 交互式覆盖
mv -i file.txt /backup/

# 强制覆盖
mv -f file.txt /backup/
```

::: tip
`mv` 命令在同一文件系统内移动文件只是修改目录项，不复制数据，速度很快。
:::

### 文件删除

**rm**：删除文件或目录

```bash
# 删除文件
rm file.txt

# 删除多个文件
rm file1.txt file2.txt

# 删除目录（递归）
rm -r mydir

# 强制删除（不提示）
rm -rf mydir

# 交互式删除
rm -i file.txt

# 详细输出
rm -v file.txt
```

::: warning
`rm -rf` 是非常危险的命令，会无提示删除文件和目录。使用前务必确认路径正确！
:::

## 权限控制命令

### 文件权限说明

Linux 文件权限分为三类用户：

- **所有者（Owner）**：文件的创建者
- **所属组（Group）**：文件所属的用户组
- **其他用户（Others）**：其他所有用户

每类用户有三种权限：

- **读（r）**：查看文件内容或列出目录内容
- **写（w）**：修改文件内容或在目录中创建/删除文件
- **执行（x）**：运行文件或进入目录

```
权限表示：
-rwxr-xr-- 1 user group 1024 Jan 15 10:30 file.txt

解析：
- 第 1 位：文件类型（- 普通文件，d 目录，l 链接）
- 第 2-4 位：所有者权限（rwx = 读写执行）
- 第 5-7 位：所属组权限（r-x = 读执行）
- 第 8-10 位：其他用户权限（r-- = 只读）
```

### 权限数字表示

| 权限 | 二进制 | 十进制 |
| ---- | ------ | ------ |
| rwx  | 111    | 7      |
| rw-  | 110    | 6      |
| r-x  | 101    | 5      |
| r--  | 100    | 4      |
| -wx  | 011    | 3      |
| -w-  | 010    | 2      |
| --x  | 001    | 1      |
| ---  | 000    | 0      |

```bash
# 权限组合示例：
# 755 = rwxr-xr-x（所有者读写执行，组和其他读执行）
# 644 = rw-r--r--（所有者读写，组和其他只读）
# 700 = rwx------（只有所有者有全部权限）
```

### chmod：修改权限

**符号模式**：

```bash
# 格式：chmod [ugoa][+-=][rwx] 文件

# 给所有者添加执行权限
chmod u+x file.txt

# 给组和其他用户移除写权限
chmod go-w file.txt

# 设置所有者读写执行，组和其他读执行
chmod u=rwx,go=rx file.txt

# 给所有人添加读权限
chmod a+r file.txt

# 递归修改目录权限
chmod -R 755 mydir
```

**数字模式**：

```bash
# 格式：chmod [所有者][组][其他] 文件

# 设置权限为 755
chmod 755 file.txt

# 设置权限为 644
chmod 644 file.txt

# 递归修改目录权限
chmod -R 755 mydir
```

::: tip
数字模式更简洁，符号模式更灵活。实际使用中可以根据需要选择。
:::

### chown：修改所有者

```bash
# 修改文件所有者
chown user file.txt

# 修改文件所有者和组
chown user:group file.txt

# 只修改组
chown :group file.txt

# 递归修改目录
chown -R user:group mydir

# 参考其他文件的所有者
chown --reference=ref_file.txt file.txt
```

### chgrp：修改所属组

```bash
# 修改文件所属组
chgrp group file.txt

# 递归修改目录
chgrp -R group mydir
```

### umask：设置默认权限

```bash
# 查看当前 umask
umask

# 输出示例：0022

# 设置 umask
umask 022

# umask 与默认权限的关系：
# 文件默认权限：666 - umask = 644
# 目录默认权限：777 - umask = 755
```

## 常用工具命令

### 查找命令

**find**：在目录树中查找文件

```bash
# 按名称查找
find /home -name "*.txt"

# 按类型查找（f 文件，d 目录）
find /home -type f

# 按大小查找
find /home -size +100M    # 大于 100MB
find /home -size -1k      # 小于 1KB

# 按时间查找
find /home -mtime -7      # 7 天内修改过
find /home -atime +30     # 30 天前访问过

# 按权限查找
find /home -perm 755

# 执行命令
find /home -name "*.log" -exec rm {} \;

# 查找并删除 7 天前的日志
find /var/log -name "*.log" -mtime +7 -delete
```

**locate**：快速查找文件（基于数据库）

```bash
# 查找文件
locate file.txt

# 更新数据库
sudo updatedb

# 忽略大小写
locate -i file.txt
```

**which**：查找命令位置

```bash
# 查找命令位置
which ls

# 输出：/bin/ls

# 显示所有匹配
which -a python
```

**whereis**：查找命令的二进制、源码和手册位置

```bash
# 查找命令相关文件
whereis python

# 输出：
# python: /usr/bin/python3.8 /usr/lib/python3.8 /usr/include/python3.8 ...
```

### 文本处理命令

**grep**：文本搜索

```bash
# 在文件中搜索
grep "pattern" file.txt

# 忽略大小写
grep -i "pattern" file.txt

# 显示行号
grep -n "pattern" file.txt

# 递归搜索目录
grep -r "pattern" /home/

# 显示匹配行数
grep -c "pattern" file.txt

# 反向匹配（显示不匹配的行）
grep -v "pattern" file.txt

# 使用正则表达式
grep -E "pattern1|pattern2" file.txt
```

**sort**：排序

```bash
# 按字母排序
sort file.txt

# 按数字排序
sort -n file.txt

# 逆序排序
sort -r file.txt

# 按指定列排序（第 2 列）
sort -k 2 file.txt

# 去重
sort -u file.txt
```

**uniq**：去除重复行

```bash
# 去除相邻重复行（通常先排序）
sort file.txt | uniq

# 显示重复次数
sort file.txt | uniq -c

# 只显示重复行
sort file.txt | uniq -d

# 只显示唯一行
sort file.txt | uniq -u
```

**cut**：提取字段

```bash
# 按字符提取（第 1-5 个字符）
cut -c 1-5 file.txt

# 按分隔符提取（第 2 列）
cut -d ':' -f 2 file.txt

# 提取 /etc/passwd 中的用户名
cut -d ':' -f 1 /etc/passwd
```

**awk**：强大的文本处理工具

```bash
# 打印第 1 列和第 3 列
awk '{print $1, $3}' file.txt

# 按分隔符处理
awk -F ':' '{print $1}' /etc/passwd

# 条件过滤
awk '$3 > 100 {print $0}' file.txt

# 统计行数
awk 'END {print NR}' file.txt

# 求和
awk '{sum += $1} END {print sum}' file.txt
```

**sed**：流编辑器

```bash
# 替换文本
sed 's/old/new/g' file.txt

# 删除空行
sed '/^$/d' file.txt

# 删除第 1-5 行
sed '1,5d' file.txt

# 在第 3 行后插入文本
sed '3a\new line' file.txt

# 直接修改文件
sed -i 's/old/new/g' file.txt
```

### 压缩和解压

**gzip/gunzip**：压缩单个文件

```bash
# 压缩文件
gzip file.txt

# 解压文件
gunzip file.txt.gz

# 保持原文件压缩
gzip -k file.txt

# 查看压缩信息
gzip -l file.txt.gz
```

**tar**：打包和归档

```bash
# 创建 tar 包
tar -cvf archive.tar file1 file2

# 创建 gzip 压缩包
tar -czvf archive.tar.gz directory/

# 创建 bzip2 压缩包
tar -cjvf archive.tar.bz2 directory/

# 解压 tar 包
tar -xvf archive.tar

# 解压 tar.gz 包
tar -xzvf archive.tar.gz

# 查看 tar 包内容
tar -tvf archive.tar
```

**zip/unzip**：跨平台压缩

```bash
# 压缩文件
zip archive.zip file1 file2

# 压缩目录
zip -r archive.zip directory/

# 解压
unzip archive.zip

# 查看内容
unzip -l archive.zip
```

### 系统信息命令

**uname**：显示系统信息

```bash
# 显示所有信息
uname -a

# 显示内核版本
uname -r

# 显示系统架构
uname -m
```

**df**：显示磁盘使用情况

```bash
# 显示磁盘使用情况
df

# 人类可读格式
df -h

# 显示指定文件系统
df -h /home

# 显示 inode 使用情况
df -i
```

**du**：显示目录大小

```bash
# 显示目录大小
du

# 人类可读格式
du -h

# 显示总大小
du -sh directory/

# 显示目录树大小
du -h --max-depth=1 /home
```

**free**：显示内存使用情况

```bash
# 显示内存使用
free

# 人类可读格式
free -h

# 持续监控
free -h -s 2
```

**top/htop**：进程监控

```bash
# 启动 top
top

# 启动 htop（更友好）
htop

# 操作：
# q：退出
# P：按 CPU 排序
# M：按内存排序
# k：杀死进程
```

### 网络命令

**ping**：测试网络连通性

```bash
# ping 主机
ping google.com

# 指定次数
ping -c 4 google.com

# 快速 ping
ping -f google.com
```

**ifconfig/ip**：网络接口配置

```bash
# 显示网络接口（旧版）
ifconfig

# 显示网络接口（新版）
ip addr

# 显示路由表
ip route

# 启用/禁用接口
sudo ip link set eth0 up
sudo ip link set eth0 down
```

**netstat/ss**：网络连接状态

```bash
# 显示所有连接（旧版）
netstat -a

# 显示监听端口
netstat -tlnp

# 显示所有连接（新版）
ss -a

# 显示监听端口
ss -tlnp

# 显示统计信息
ss -s
```

**curl/wget**：下载文件

```bash
# 下载文件
curl -O http://example.com/file.txt

# 显示进度
curl -# -O http://example.com/file.txt

# 下载文件
wget http://example.com/file.txt

# 断点续传
wget -c http://example.com/file.txt

# 递归下载
wget -r http://example.com/
```

## 命令组合技巧

### 管道

```bash
# 将前一个命令的输出作为后一个命令的输入
ls -l | grep ".txt"

# 多级管道
cat file.txt | sort | uniq -c | sort -nr

# 统计当前目录下的文件数
ls -l | grep "^-" | wc -l
```

### 重定向

```bash
# 标准输出重定向到文件
ls > filelist.txt

# 追加到文件
echo "new line" >> file.txt

# 标准错误重定向
ls /nonexistent 2> error.log

# 标准输出和错误都重定向
ls /nonexistent > output.log 2>&1

# 丢弃输出
ls /nonexistent > /dev/null 2>&1

# 标准输入重定向
sort < file.txt
```

### 命令替换

```bash
# 使用反引号
echo "Today is `date`"

# 使用 $()（推荐）
echo "Today is $(date)"

# 在命令中使用
ls -l $(which python)
```

### 逻辑运算符

```bash
# 前一个命令成功才执行后一个
cd /home && ls

# 前一个命令失败才执行后一个
cd /nonexistent || echo "Directory not found"

# 组合使用
cd /home && ls || echo "Failed"
```

## 对比表格

### 常用文件查看命令对比

| 命令 | 功能 | 适用场景 | 特点 |
|------|------|----------|------|
| cat | 显示全部内容 | 小文件 | 一次性输出，支持合并 |
| more | 分页显示（只能向下） | 中等文件 | 空格翻页，Enter 下一行 |
| less | 分页显示（可上下） | 大文件 | 支持搜索、前后翻页 |
| head | 显示开头部分 | 快速预览 | 默认 10 行 |
| tail | 显示结尾部分 | 查看日志 | -f 实时跟踪 |

### 文件操作命令对比

| 命令 | 功能 | 常用选项 | 注意事项 |
|------|------|----------|----------|
| cp | 复制 | -r 递归, -p 保留属性, -i 交互 | 复制目录必须加 -r |
| mv | 移动/重命名 | -i 交互, -f 强制 | 同文件系统内移动不复制数据 |
| rm | 删除 | -r 递归, -f 强制, -i 交互 | rm -rf 非常危险，慎用 |
| find | 查找 | -name, -type, -size, -mtime | 搜索范围大时较慢 |
| chmod | 修改权限 | 数字模式或符号模式 | 递归修改加 -R |

### 管道和重定向对比

| 符号 | 功能 | 示例 | 说明 |
|------|------|------|------|
| > | 输出重定向（覆盖） | ls > file.txt | 清空文件后写入 |
| >> | 输出重定向（追加） | echo "hi" >> file.txt | 在文件末尾追加 |
| < | 输入重定向 | sort < file.txt | 从文件读取输入 |
| 2> | 错误重定向 | ls /no 2> err.log | 只重定向错误信息 |
| \| | 管道 | ls \| grep ".txt" | 前者输出作为后者输入 |
| 2>&1 | 合并输出 | cmd > out.log 2>&1 | 标准输出和错误都写入 |

## 新手常见误区

### 误区一：认为 rm -rf 可以随便用

**错误做法**：
```bash
rm -rf /home/user/*
```

**正确做法**：
```bash
# 先查看要删除什么
ls -la /home/user/*

# 确认无误后再删除，最好加上 -i 交互确认
rm -ri /home/user/*
```

**为什么错**：`rm -rf` 会无提示删除文件和目录，一旦误删很难恢复。特别是使用通配符时，一定要先确认匹配的文件。

### 误区二：认为 chmod 777 是万能解决方案

**错误做法**：
```bash
chmod 777 myscript.sh
```

**正确做法**：
```bash
# 只给需要执行的用户添加执行权限
chmod +x myscript.sh

# 或者更精确地设置权限
chmod 755 myscript.sh  # 所有者可读写执行，其他人可读执行
```

**为什么错**：777 权限意味着所有人都可以读写执行，这会带来严重的安全风险。应该遵循最小权限原则，只给必要的权限。

### 误区三：认为 cd 和 ls 是外部命令

**错误理解**：cd 和 ls 是独立的可执行程序。

**正确理解**：cd 是 Shell 内置命令，ls 是外部命令（通常是 `/bin/ls`）。内置命令执行更快，因为不需要创建新进程。

```bash
# 查看命令类型
type cd  # 输出：cd is a shell builtin
type ls  # 输出：ls is /bin/ls
```

### 误区四：认为管道可以传递所有信息

**错误理解**：管道可以传递任何数据，包括错误信息。

**正确理解**：管道只传递标准输出（stdout），不传递标准错误（stderr）。如果需要同时传递错误信息，需要重定向。

```bash
# 错误：只传递标准输出
ls /nonexistent | grep "error"  # 不会匹配到错误信息

# 正确：同时重定向标准错误
ls /nonexistent 2>&1 | grep "error"
```

### 误区五：认为 find 命令的 -exec 后面可以直接跟多个命令

**错误做法**：
```bash
find . -name "*.txt" -exec ls -l {} \; -exec rm {} \;
```

**正确做法**：
```bash
# 使用分号分隔每个 -exec
find . -name "*.txt" -exec ls -l {} \; -exec rm {} \;

# 或者使用 xargs
find . -name "*.txt" | xargs -I {} sh -c 'ls -l "{}" && rm "{}"'
```

**为什么错**：每个 `-exec` 都需要独立的 `\;` 结束符，不能省略。

## 动手练习

### 练习一：基础题 - 文件操作

**题目**：请完成以下操作：
1. 在当前目录创建一个名为 `test` 的目录
2. 进入 `test` 目录，创建三个空文件：`file1.txt`、`file2.txt`、`file3.txt`
3. 查看这三个文件的详细信息
4. 将 `file1.txt` 重命名为 `backup.txt`
5. 删除 `file2.txt`

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建目录
mkdir test

# 2. 进入目录并创建文件
cd test
touch file1.txt file2.txt file3.txt

# 3. 查看详细信息
ls -l

# 4. 重命名文件
mv file1.txt backup.txt

# 5. 删除文件
rm file2.txt

# 验证结果
ls -l
```

</details>

### 练习二：进阶题 - 权限控制

**题目**：请完成以下权限操作：
1. 创建一个脚本文件 `myscript.sh`
2. 设置权限为：所有者可读写执行，所属组可读执行，其他人无权限
3. 修改文件所有者为 `user1`，所属组为 `developers`
4. 查看文件的权限信息

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建脚本文件
touch myscript.sh

# 2. 设置权限（750 = rwxr-x---）
chmod 750 myscript.sh

# 3. 修改所有者和组（需要 root 权限）
sudo chown user1:developers myscript.sh

# 4. 查看权限信息
ls -l myscript.sh

# 输出示例：
# -rwxr-x--- 1 user1 developers 0 Jul 24 10:30 myscript.sh
```

</details>

### 练习三：挑战题 - 命令组合

**题目**：请写出一条命令，完成以下任务：
1. 在 `/var/log` 目录下查找所有 `.log` 文件
2. 统计这些文件的总大小
3. 将结果保存到 `/tmp/log_size.txt` 文件中

<details>
<summary>点击查看答案</summary>

```bash
# 方法一：使用 find 和 du
find /var/log -name "*.log" -exec du -ch {} + | grep total | awk '{print $1}' > /tmp/log_size.txt

# 方法二：使用 find 和 xargs
find /var/log -name "*.log" | xargs du -ch | tail -1 | awk '{print $1}' > /tmp/log_size.txt

# 方法三：更简洁的方式
find /var/log -name "*.log" -print0 | xargs -0 du -ch | tail -1 > /tmp/log_size.txt

# 查看结果
cat /tmp/log_size.txt
```

**说明**：
- `-print0` 和 `-0` 处理文件名中包含空格的情况
- `du -ch` 显示每个文件的大小，并给出总计
- `tail -1` 取最后一行（总计行）
- `> /tmp/log_size.txt` 将结果重定向到文件

</details>

## 下一章预告

太棒了！你已经掌握了 Linux 基础命令。在下一章中，我们将学习 Shell 脚本编程，把多个命令组合成自动化脚本。你会学会如何编写变量、使用条件语句和循环、定义函数，还能写出实用的自动化脚本，比如系统监控、文件备份、批量处理等。准备好了吗？让我们进入 Shell 脚本的世界吧！

## 本章小结

- Linux 命令由命令、选项和参数组成
- 文件操作命令包括查看、复制、移动、删除等
- 目录管理命令包括浏览、创建、切换等
- 权限控制通过 chmod、chown、chgrp 实现
- 常用工具命令包括查找、文本处理、压缩解压等
- 命令可以通过管道、重定向和逻辑运算符灵活组合
