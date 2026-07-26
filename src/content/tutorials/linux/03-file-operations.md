---
title: "第三章：文件与目录操作"
description: "掌握文件复制、移动、删除、查找等核心操作"
---

# 第三章：文件与目录操作

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 怎么复制文件和目录？和 Windows 一样吗？
- 怎么移动或重命名文件？
- 怎么删除文件？删错了能恢复吗？
- 怎么快速找到某个文件？

这一章就是为了解答这些问题。我们会先掌握 **文件的复制、移动、删除操作**，再学习如何查找文件，最后了解一些批量操作的技巧。

---

## 3.1 为什么需要掌握文件操作？

### 痛点分析

想象一下这样的场景：

你想备份一个重要文件，结果：
- 不知道怎么用命令复制
- 复制了一堆文件，结果把系统文件也覆盖了
- 想删除临时文件，结果删错了重要文件

更糟糕的是，你想找一个配置文件，结果：
- 不知道文件在哪
- 用 find 命令搜了半天没找到
- 好不容易找到了，结果没有权限打开

这就是不会文件操作时的日常：**复制靠猜、删除靠运、查找靠命**。

### 解决方案

掌握文件操作命令，你能做到：

- 快速复制、移动、删除文件和目录
- 批量处理文件，提高效率
- 精准查找任何文件

打个比方：

> 文件操作就像整理房间：
> - `cp` 是复印机——把文件复制一份
> - `mv` 是搬运工——把文件搬到新位置，或者改个名字
> - `rm` 是垃圾桶——把不要的文件扔掉
> - `find` 是侦探——帮你找到任何文件

### 前后对比

```
不会文件操作：
# 想备份配置文件
cp /etc/nginx/nginx.conf  # 报错，不知道目标路径
cp /etc/nginx/nginx.conf /home/user/  # 复制了，但没备份时间戳
cp -r /etc/nginx /home/user/backup  # 复制了整个目录，但权限丢了

会文件操作：
cp -p /etc/nginx/nginx.conf /home/user/backup/nginx.conf.bak  # 保留权限和时间戳
```

> **一句话总结**：掌握文件操作，让你在 Linux 里"随心所欲"。

---

## 3.2 复制文件和目录

### cp 命令基础

```bash
# ❶ 复制单个文件
cp source.txt dest.txt  # 将 source.txt 复制为 dest.txt

# ❷ 复制文件到指定目录
cp file.txt /home/user/documents/  # 将 file.txt 复制到 documents 目录

# ❸ 复制多个文件到目录
cp file1.txt file2.txt file3.txt /backup/  # 将三个文件复制到 /backup 目录

# ❹ 复制目录（必须加 -r 参数）
cp -r source_dir dest_dir  # 递归复制整个目录及其内容

# ✅ 推荐用法
cp file.txt file.txt.bak  # 备份文件
cp -r /etc/nginx /backup/nginx-backup  # 备份目录

# ❌ 错误示例
cp source_dir dest_dir  # 缺少 -r 参数，无法复制目录
cp file.txt /root/  # 没有 root 权限，无法复制
```

### cp 命令常用选项

| 选项 | 作用 | 示例 |
| --- | --- | --- |
| `-r` | 递归复制目录 | `cp -r dir1 dir2` |
| `-p` | 保留文件属性（权限、时间戳） | `cp -p file.txt backup/` |
| `-i` | 覆盖前提示 | `cp -i file.txt dest/` |
| `-f` | 强制覆盖，不提示 | `cp -f file.txt dest/` |
| `-v` | 显示复制过程 | `cp -v file.txt dest/` |
| `-a` | 归档模式，保留所有属性 | `cp -a dir1 dir2` |

### 实战示例

```bash
# ❶ 备份配置文件
sudo cp -p /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak

# ❷ 复制目录并保留所有属性
cp -a /home/user/documents /backup/documents-backup

# ❸ 复制时显示进度
cp -rv /var/log /tmp/log-backup

# ❹ 覆盖前提示
cp -i important.txt /shared/
# 如果目标文件已存在，会提示：overwrite?

# ✅ 最佳实践
# 备份重要文件时，总是加上 -p 或 -a 参数保留属性
sudo cp -a /etc/passwd /etc/passwd.backup
```

---

## 3.3 移动和重命名文件

### mv 命令基础

```bash
# ❶ 移动文件
mv file.txt /new/location/  # 将 file.txt 移动到 /new/location/ 目录

# ❷ 移动多个文件
mv file1.txt file2.txt /backup/  # 将两个文件移动到 /backup 目录

# ❸ 移动目录
mv dir1 /new/location/  # 将 dir1 目录移动到 /new/location/

# ❹ 重命名文件
mv oldname.txt newname.txt  # 将 oldname.txt 重命名为 newname.txt

# ❺ 重命名目录
mv olddir newdir  # 将 olddir 目录重命名为 newdir

# ✅ 推荐用法
mv file.txt /backup/  # 移动文件
mv old.txt new.txt  # 重命名文件

# ❌ 错误示例
mv file.txt /root/  # 没有 root 权限，无法移动
mv dir1 dir2  # 如果 dir2 已存在，会将 dir1 移动到 dir2 内部
```

### mv 命令常用选项

| 选项 | 作用 | 示例 |
| --- | --- | --- |
| `-i` | 覆盖前提示 | `mv -i file.txt dest/` |
| `-f` | 强制覆盖，不提示 | `mv -f file.txt dest/` |
| `-v` | 显示移动过程 | `mv -v file.txt dest/` |
| `-n` | 不覆盖已存在的文件 | `mv -n file.txt dest/` |

### 批量重命名

```bash
# ❶ 使用通配符批量重命名
for file in *.txt; do
    mv "$file" "${file%.txt}.md"  # 将所有 .txt 文件改为 .md
done

# ❷ 使用 rename 命令（如果已安装）
rename 's/\.txt$/.md/' *.txt  # 将所有 .txt 文件改为 .md

# ❸ 批量添加前缀
for file in *.jpg; do
    mv "$file" "backup_$file"  # 给所有 .jpg 文件添加 backup_ 前缀
done

# ✅ 实用示例
# 给所有文件添加日期前缀
for file in *.log; do
    mv "$file" "2024-01-01_$file"
done
```

---

## 3.4 删除文件和目录

### rm 命令基础

```bash
# ❶ 删除单个文件
rm file.txt  # 删除 file.txt

# ❷ 删除多个文件
rm file1.txt file2.txt file3.txt  # 删除三个文件

# ❸ 删除目录（必须加 -r 参数）
rm -r dir1  # 递归删除 dir1 目录及其内容

# ❹ 强制删除（不提示）
rm -f file.txt  # 强制删除 file.txt
rm -rf dir1  # 强制递归删除 dir1 目录

# ✅ 推荐用法
rm file.txt  # 删除文件
rm -i file.txt  # 删除前提示确认
rm -r dir1  # 删除目录

# ❌ 危险操作，绝对不要做
rm -rf /  # 删除整个系统！
rm -rf ~  # 删除家目录！
rm -rf *  # 删除当前目录所有文件！
```

### rm 命令常用选项

| 选项 | 作用 | 示例 |
| --- | --- | --- |
| `-r` | 递归删除目录 | `rm -r dir1` |
| `-f` | 强制删除，不提示 | `rm -f file.txt` |
| `-i` | 删除前提示 | `rm -i file.txt` |
| `-v` | 显示删除过程 | `rm -v file.txt` |

### 安全删除技巧

```bash
# ❶ 删除前提示确认
rm -i file.txt  # 会提示：remove regular file 'file.txt'?

# ❷ 使用别名增加安全性
alias rm='rm -i'  # 在 .bashrc 中添加，每次删除都会提示

# ❸ 先查看要删除的文件
ls *.log  # 先看看有哪些 .log 文件
rm *.log  # 确认后再删除

# ❹ 使用 trash-cli 替代 rm（可恢复）
sudo apt install trash-cli  # 安装 trash-cli
trash file.txt  # 将文件移动到回收站
trash-list  # 查看回收站
trash-empty  # 清空回收站

# ✅ 最佳实践
# 删除重要文件前，总是先备份
cp important.txt important.txt.bak
rm important.txt

# 删除大量文件前，先用 ls 查看
ls *.tmp
rm *.tmp
```

---

## 3.5 查找文件

### find 命令基础

```bash
# ❶ 按文件名查找
find /etc -name "nginx.conf"  # 在 /etc 目录下查找 nginx.conf

# ❷ 按文件名模糊查找
find /home -name "*.txt"  # 查找所有 .txt 文件
find /var -name "*.log"  # 查找所有 .log 文件

# ❸ 按类型查找
find /home -type f  # 只查找文件
find /home -type d  # 只查找目录

# ❹ 按大小查找
find /var -size +100M  # 查找大于 100MB 的文件
find /var -size -1k  # 查找小于 1KB 的文件

# ❺ 按时间查找
find /tmp -mtime +7  # 查找 7 天前修改的文件
find /home -mmin -60  # 查找 60 分钟内修改的文件

# ✅ 常用组合
find /etc -name "*.conf" -type f  # 查找所有配置文件
find /var/log -size +10M -type f  # 查找大于 10MB 的日志文件
```

### find 命令高级用法

```bash
# ❶ 执行命令
find /home -name "*.tmp" -exec rm {} \;  # 查找并删除所有 .tmp 文件
find /var/log -name "*.log" -exec ls -lh {} \;  # 查找并显示详细信息

# ❷ 组合条件
find /home -name "*.txt" -size +1M  # 查找大于 1MB 的 .txt 文件
find /etc -name "*.conf" -type f -mtime -7  # 查找 7 天内修改的配置文件

# ❸ 排除目录
find /home -path "/home/user/.cache" -prune -o -name "*.txt" -print
# 查找 .txt 文件，但排除 .cache 目录

# ✅ 实用示例
# 查找并删除 7 天前的日志文件
find /var/log -name "*.log" -mtime +7 -exec rm {} \;

# 查找大于 100MB 的文件
find / -size +100M -type f 2>/dev/null
```

### locate 命令

```bash
# ❶ 快速查找文件（基于数据库）
locate nginx.conf  # 快速查找 nginx.conf 文件

# ❷ 更新数据库
sudo updatedb  # 更新 locate 的数据库

# ❸ 限制结果数量
locate -n 10 "*.txt"  # 只显示前 10 个结果

# ✅ 适用场景
# locate 比 find 快得多，但需要数据库支持
# 适合查找已知文件名的文件
locate passwd  # 快速找到所有 passwd 文件
```

---

## 3.6 核心知识点总结

| 命令 | 作用 | 常用选项 |
| --- | --- | --- |
| `cp` | 复制文件或目录 | `-r`（递归）、`-p`（保留属性）、`-a`（归档） |
| `mv` | 移动或重命名文件/目录 | `-i`（提示）、`-f`（强制）、`-v`（显示过程） |
| `rm` | 删除文件或目录 | `-r`（递归）、`-f`（强制）、`-i`（提示） |
| `find` | 查找文件 | `-name`（按名）、`-type`（按类型）、`-size`（按大小）、`-mtime`（按时间） |
| `locate` | 快速查找文件 | `-n`（限制数量） |

---

## 3.7 新手常见误区

### 误区 1："rm -rf / 只是删除系统文件"

**大错特错！** `rm -rf /` 会**删除整个系统**，包括：
- 所有用户数据
- 所有系统文件
- 所有配置文件

执行后系统立即崩溃，无法恢复。

```bash
# ❌ 绝对不要执行
rm -rf /
rm -rf /*
rm -rf ~

# ✅ 安全做法
rm -i file.txt  # 删除前提示
```

### 误区 2："cp 命令会自动覆盖"

**不一定。** 默认情况下，`cp` 会直接覆盖目标文件，但：
- 有些系统配置了别名，会提示确认
- 使用 `-i` 参数会提示确认
- 使用 `-n` 参数不会覆盖

```bash
cp file.txt dest.txt  # 默认直接覆盖
cp -i file.txt dest.txt  # 会提示确认
cp -n file.txt dest.txt  # 不覆盖已存在的文件
```

### 误区 3："find 命令只能按文件名查找"

**错！** `find` 命令可以按多种条件查找：
- 按文件名：`-name`
- 按类型：`-type`
- 按大小：`-size`
- 按时间：`-mtime`、`-mmin`
- 按权限：`-perm`
- 按用户：`-user`

```bash
find /home -name "*.txt"  # 按文件名
find /var -type f -size +100M  # 按类型和大小
find /tmp -mtime +7 -user root  # 按时间和用户
```

### 误区 4："mv 命令只能重命名文件"

**不完全对。** `mv` 命令有两个作用：
1. 移动文件到新位置
2. 重命名文件（如果目标路径相同）

```bash
mv file.txt /new/location/  # 移动文件
mv old.txt new.txt  # 重命名文件
mv dir1 /new/location/  # 移动目录
```

### 误区 5："删除的文件无法恢复"

**不一定。** 删除的文件能否恢复取决于：
- 是否使用了 `rm` 命令（直接删除，难恢复）
- 是否使用了 `trash-cli`（移动到回收站，可恢复）
- 是否已经覆盖了磁盘空间

```bash
# 使用 trash-cli 可以恢复
trash file.txt  # 移动到回收站
trash-list  # 查看回收站
trash-restore  # 恢复文件
```

---

## 3.8 动手练习

### 练习 1：基础练习 - 文件复制

**题目**：练习复制文件和目录。

要求：
1. 创建一个 test 目录
2. 在 test 目录下创建 file1.txt、file2.txt
3. 将 test 目录复制为 test-backup
4. 将 file1.txt 复制为 file1.txt.bak

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建 test 目录
mkdir test

# 2. 创建文件
touch test/file1.txt test/file2.txt

# 3. 复制目录
cp -r test test-backup

# 4. 复制文件并重命名
cp test/file1.txt test/file1.txt.bak

# 验证结果
ls -R test test-backup
```

</details>

### 练习 2：进阶练习 - 批量操作

**题目**：批量重命名和移动文件。

要求：
1. 创建 10 个 .txt 文件（file1.txt 到 file10.txt）
2. 将所有 .txt 文件重命名为 .md 文件
3. 创建一个 backup 目录
4. 将所有 .md 文件移动到 backup 目录

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建 10 个 .txt 文件
for i in {1..10}; do
    touch "file$i.txt"
done

# 2. 批量重命名为 .md
for file in *.txt; do
    mv "$file" "${file%.txt}.md"
done

# 3. 创建 backup 目录
mkdir backup

# 4. 移动所有 .md 文件到 backup
mv *.md backup/

# 验证结果
ls backup/
```

</details>

### 练习 3（挑战）：综合练习 - 文件查找与清理

**题目**：查找并清理系统中的临时文件。

要求：
1. 查找 /tmp 目录下 7 天前的文件
2. 查找大于 10MB 的日志文件
3. 查找所有 .tmp 文件并删除
4. 查找所有 .log 文件并统计总大小

<details>
<summary>点击查看答案</summary>

```bash
# 1. 查找 /tmp 目录下 7 天前的文件
find /tmp -type f -mtime +7

# 2. 查找大于 10MB 的日志文件
find /var/log -type f -name "*.log" -size +10M

# 3. 查找所有 .tmp 文件并删除
find /home -name "*.tmp" -type f -exec rm {} \;

# 4. 查找所有 .log 文件并统计总大小
find /var/log -name "*.log" -type f -exec ls -lh {} \; | awk '{print $5}' | du -ch

# 或者更简单的方式
find /var/log -name "*.log" -type f -print0 | du -ch --files0-from=-
```

</details>

---

## 下一章预告

下一章我们会学习 **文件查看与文本处理**——也就是如何查看文件内容和处理文本数据。你会学到：

- cat、less、head、tail 这些命令怎么用
- 如何用 grep 搜索文件内容
- 如何用 awk 和 sed 处理文本
- 如何统计文件行数、单词数

这些是日常使用最频繁的操作，学会了就能高效处理文本数据了。
