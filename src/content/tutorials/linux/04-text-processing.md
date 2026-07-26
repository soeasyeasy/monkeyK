---
title: "第四章：文件查看与文本处理"
description: "掌握文件查看命令和文本处理工具，高效处理文本数据"
---

# 第四章：文件查看与文本处理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 怎么查看文件内容？cat 和 less 有什么区别？
- 怎么在文件里搜索关键词？
- 怎么提取文件的某几行？
- 怎么批量替换文件里的内容？

这一章就是为了解答这些问题。我们会先掌握 **文件查看命令**，再学习 **文本搜索和处理工具**，最后了解一些实用的文本处理技巧。

---

## 4.1 为什么需要文本处理？

### 痛点分析

想象一下这样的场景：

你有一个 10 万行的日志文件，想找出所有错误信息：
- 用编辑器打开，卡死了
- 手动搜索，找到天亮也找不到
- 想提取特定格式的数据，不知道怎么弄

更糟糕的是，你想批量修改配置文件：
- 100 个配置文件都要改同一个参数
- 手动改？改到怀疑人生
- 写脚本？不会写

这就是不会文本处理时的日常：**看文件靠眼、找内容靠猜、改文件靠手**。

### 解决方案

掌握文本处理工具，你能做到：

- 快速查看大文件，不会卡死
- 精准搜索关键词，秒级定位
- 批量处理文本，自动化操作

打个比方：

> 文本处理工具就像一套精密的工具箱：
> - `cat` 是放大镜——快速查看文件内容
> - `less` 是望远镜——分页查看大文件
> - `grep` 是探测器——精准搜索关键词
> - `awk` 是手术刀——提取和处理特定列
> - `sed` 是替换器——批量修改文本内容

### 前后对比

```
不会文本处理：
# 查看 10 万行日志
vim app.log  # 编辑器卡死

# 搜索错误信息
# 手动翻找，眼睛都看花了

# 批量修改配置
# 一个一个文件手动改，改到崩溃

会文本处理：
# 查看日志
tail -f app.log  # 实时查看最新日志

# 搜索错误
grep "ERROR" app.log  # 一秒找出所有错误

# 批量修改
sed -i 's/old/new/g' *.conf  # 一秒改完所有配置
```

> **一句话总结**：掌握文本处理，让你从"手动操作"升级到"自动化处理"。

---

## 4.2 文件查看命令

### cat 命令

```bash
# ❶ 查看文件内容（显示全部）
cat file.txt  # 一次性显示 file.txt 的全部内容

# ❷ 显示行号
cat -n file.txt  # 每行前面加上行号

# ❸ 合并多个文件
cat file1.txt file2.txt > merged.txt  # 将两个文件合并为一个

# ❹ 创建文件（配合重定向）
cat > newfile.txt << EOF
第一行内容
第二行内容
第三行内容
EOF

# ✅ 适用场景
# 查看小文件（几百行以内）
cat /etc/hosts

# ❌ 不适用场景
# 查看大文件（会一次性加载到内存）
cat large.log  # 如果文件很大，终端会卡住
```

### less 命令

```bash
# ❶ 分页查看文件
less file.txt  # 分页显示，可以上下翻页

# ❷ 搜索关键词
less file.txt  # 打开后输入 /keyword 搜索

# ❸ 跳转到指定行
less file.txt  # 打开后输入 :100 跳转到第 100 行

# less 操作快捷键：
# 空格键：向下翻一页
# b 键：向上翻一页
# / 键：向下搜索
# ? 键：向上搜索
# n 键：下一个搜索结果
# N 键：上一个搜索结果
# q 键：退出 less
# g 键：跳转到第一行
# G 键：跳转到最后一行

# ✅ 适用场景
# 查看大文件（不会一次性加载）
less /var/log/syslog

# ✅ 推荐用法
less -N file.txt  # 显示行号
less +G file.txt  # 直接跳到文件末尾
```

### head 和 tail 命令

```bash
# ❶ 查看文件开头
head file.txt  # 默认显示前 10 行
head -n 20 file.txt  # 显示前 20 行

# ❷ 查看文件末尾
tail file.txt  # 默认显示后 10 行
tail -n 20 file.txt  # 显示后 20 行

# ❸ 实时监控文件（查看日志必备）
tail -f app.log  # 实时显示新增内容

# ❹ 查看多个文件
head file1.txt file2.txt  # 分别显示两个文件的开头
tail -f log1.log log2.log  # 同时监控两个日志文件

# ✅ 常用场景
# 查看日志最新内容
tail -f /var/log/nginx/access.log

# 查看文件前几行
head -n 5 /etc/passwd  # 查看前 5 个用户信息

# ✅ 实用组合
tail -n 100 app.log | grep "ERROR"  # 查看最后 100 行中的错误
```

### wc 命令（统计工具）

```bash
# ❶ 统计行数
wc -l file.txt  # 统计文件有多少行

# ❷ 统计单词数
wc -w file.txt  # 统计文件有多少个单词

# ❸ 统计字节数
wc -c file.txt  # 统计文件有多少个字节

# ❹ 同时统计行、单词、字节
wc file.txt  # 输出：行数 单词数 字节数 文件名

# ✅ 实用示例
# 统计代码行数
find . -name "*.py" -type f -exec wc -l {} \; | awk '{sum+=$1} END {print sum}'

# 统计日志中错误数量
grep "ERROR" app.log | wc -l
```

---

## 4.3 文本搜索工具

### grep 命令基础

```bash
# ❶ 在文件中搜索关键词
grep "error" app.log  # 在 app.log 中搜索 "error"

# ❷ 忽略大小写
grep -i "error" app.log  # 不区分大小写

# ❸ 显示行号
grep -n "error" app.log  # 显示匹配行的行号

# ❹ 反向搜索（排除）
grep -v "info" app.log  # 显示不包含 "info" 的行

# ❺ 递归搜索目录
grep -r "TODO" .  # 在当前目录及子目录中搜索 "TODO"
grep -r "password" /etc  # 在 /etc 目录中搜索 "password"

# ✅ 常用组合
grep -rn "function" .  # 递归搜索并显示行号
grep -i "error" *.log  # 在所有 .log 文件中搜索（忽略大小写）
```

### grep 高级用法

```bash
# ❶ 统计匹配数量
grep -c "error" app.log  # 统计有多少行包含 "error"

# ❷ 只显示文件名
grep -l "error" *.log  # 只显示包含 "error" 的文件名

# ❸ 使用正则表达式
grep "^ERROR" app.log  # 搜索以 ERROR 开头的行
grep "error|warning" app.log  # 搜索包含 error 或 warning 的行
grep "[0-9]" file.txt  # 搜索包含数字的行

# ❹ 显示上下文
grep -A 3 "error" app.log  # 显示匹配行及后面 3 行
grep -B 3 "error" app.log  # 显示匹配行及前面 3 行
grep -C 3 "error" app.log  # 显示匹配行及前后各 3 行

# ✅ 实用示例
# 查找日志中的错误及上下文
grep -C 5 "ERROR" app.log

# 统计代码中 TODO 数量
grep -r "TODO" . | wc -l
```

### grep vs find vs locate

| 命令 | 作用 | 搜索对象 | 速度 |
| --- | --- | --- | --- |
| `grep` | 搜索文件内容 | 文件内部的文本 | 较慢（需要读取文件） |
| `find` | 查找文件 | 文件名、属性 | 较慢（遍历目录） |
| `locate` | 快速查找文件 | 文件名（基于数据库） | 很快（查数据库） |

```bash
# 搜索文件内容
grep "function" *.py  # 在 Python 文件中搜索 "function"

# 查找文件
find . -name "*.py"  # 查找所有 Python 文件

# 快速查找文件
locate nginx.conf  # 快速找到 nginx.conf 文件
```

---

## 4.4 文本处理工具

### awk 命令

```bash
# ❶ 按列提取数据
awk '{print $1}' file.txt  # 打印每行的第一列
awk '{print $1, $3}' file.txt  # 打印第一列和第三列

# ❷ 指定分隔符
awk -F: '{print $1}' /etc/passwd  # 以 : 为分隔符，打印第一列（用户名）

# ❸ 条件过滤
awk '$3 > 100 {print $0}' file.txt  # 打印第三列大于 100 的行
awk '/error/ {print $0}' app.log  # 打印包含 error 的行

# ❹ 统计和计算
awk '{sum += $1} END {print sum}' file.txt  # 计算第一列的总和
awk 'END {print NR}' file.txt  # 统计总行数

# ✅ 实用示例
# 查看系统所有用户
awk -F: '{print $1}' /etc/passwd

# 统计日志中每个 IP 的访问次数
awk '{print $1}' access.log | sort | uniq -c

# 计算文件总大小
ls -l | awk '{sum += $5} END {print sum/1024/1024 " MB"}'
```

### sed 命令

```bash
# ❶ 替换文本
sed 's/old/new/' file.txt  # 将每行第一个 old 替换为 new
sed 's/old/new/g' file.txt  # 将每行所有 old 替换为 new

# ❷ 直接修改文件
sed -i 's/old/new/g' file.txt  # 直接修改文件内容

# ❸ 删除行
sed '1d' file.txt  # 删除第一行
sed '/error/d' file.txt  # 删除包含 error 的行
sed '1,5d' file.txt  # 删除第 1 到 5 行

# ❹ 插入和追加
sed '1i\新内容' file.txt  # 在第一行前插入
sed '$a\新内容' file.txt  # 在最后一行后追加

# ✅ 实用示例
# 批量修改配置文件
sed -i 's/port=8080/port=9090/g' *.conf

# 删除空行
sed '/^$/d' file.txt

# 删除注释行
sed '/^#/d' file.txt

# 批量添加前缀
sed -i 's/^/# /' file.txt  # 给每行添加 # 前缀
```

### sort 和 uniq 命令

```bash
# ❶ 排序
sort file.txt  # 按字母顺序排序
sort -n file.txt  # 按数字顺序排序
sort -r file.txt  # 逆序排序
sort -k 2 file.txt  # 按第二列排序

# ❷ 去重
uniq file.txt  # 去除相邻的重复行（需要先排序）
sort file.txt | uniq  # 排序后去重
sort -u file.txt  # 排序并去重

# ❸ 统计重复次数
sort file.txt | uniq -c  # 统计每行出现的次数
sort file.txt | uniq -c | sort -nr  # 按次数排序

# ✅ 实用示例
# 统计日志中访问最多的 IP
awk '{print $1}' access.log | sort | uniq -c | sort -nr | head -10

# 查看系统中占用端口最多的程序
netstat -an | awk '{print $4}' | cut -d: -f2 | sort | uniq -c | sort -nr
```

---

## 4.5 管道和重定向

### 重定向

```bash
# ❶ 输出重定向
echo "Hello" > file.txt  # 覆盖写入
echo "World" >> file.txt  # 追加写入

# ❷ 错误重定向
command 2> error.log  # 将错误输出重定向到文件
command > output.log 2>&1  # 将标准输出和错误都重定向到文件

# ❸ 输入重定向
command < file.txt  # 从文件读取输入

# ✅ 实用示例
# 保存命令输出
ls -l > filelist.txt

# 追加日志
echo "$(date): Backup completed" >> backup.log

# 丢弃错误输出
find / -name "*.txt" 2>/dev/null
```

### 管道

```bash
# ❶ 管道的基本用法
command1 | command2  # 将 command1 的输出作为 command2 的输入

# ❷ 多个管道串联
cat file.txt | grep "error" | wc -l  # 查看文件 -> 搜索错误 -> 统计行数

# ❸ 实用组合
ls -l | grep "^d"  # 列出所有目录
ps aux | grep nginx  # 查找 nginx 进程
cat access.log | awk '{print $1}' | sort | uniq -c | sort -nr  # 统计访问 IP

# ✅ 实用示例
# 查看占用内存最多的进程
ps aux | sort -k 4 -nr | head -10

# 统计代码行数
find . -name "*.py" | xargs wc -l | tail -1

# 查找并删除大文件
find /var/log -size +100M | xargs rm -f
```

---

## 4.6 核心知识点总结

| 命令 | 作用 | 常用选项 |
| --- | --- | --- |
| `cat` | 查看文件内容（小文件） | `-n`（显示行号） |
| `less` | 分页查看文件（大文件） | `/`（搜索）、`q`（退出） |
| `head` | 查看文件开头 | `-n`（指定行数） |
| `tail` | 查看文件末尾 | `-f`（实时监控）、`-n`（指定行数） |
| `wc` | 统计行、单词、字节 | `-l`（行数）、`-w`（单词数）、`-c`（字节数） |
| `grep` | 搜索文件内容 | `-i`（忽略大小写）、`-n`（显示行号）、`-r`（递归）、`-v`（反向） |
| `awk` | 按列处理文本 | `-F`（分隔符）、`{print $1}`（打印列） |
| `sed` | 流编辑器（替换、删除） | `-i`（直接修改）、`s`（替换）、`d`（删除） |
| `sort` | 排序 | `-n`（数字排序）、`-r`（逆序）、`-k`（按列） |
| `uniq` | 去重 | `-c`（统计次数） |

---

## 4.7 新手常见误区

### 误区 1："cat 可以查看任何文件"

**错！** `cat` 只适合查看**小文件**。如果文件很大（比如几个 GB 的日志文件），`cat` 会一次性加载到内存，导致终端卡死。

```bash
# ❌ 错误做法
cat large.log  # 文件很大时，终端会卡住

# ✅ 正确做法
less large.log  # 分页查看，不会卡
tail -n 100 large.log  # 只看最后 100 行
```

### 误区 2："grep 只能搜索文件"

**错！** `grep` 可以搜索任何**标准输入**，包括管道传递的内容：

```bash
# 搜索文件
grep "error" app.log

# 搜索命令输出
ps aux | grep "nginx"  # 在进程列表中搜索 nginx
echo "Hello World" | grep "World"  # 在字符串中搜索
```

### 误区 3："sed -i 可以直接修改文件，不需要备份"

**危险！** `sed -i` 会直接修改文件，如果写错了正则表达式，可能会把文件改坏。

```bash
# ❌ 危险做法
sed -i 's/old/new/g' important.conf  # 如果正则写错，文件就坏了

# ✅ 安全做法
cp important.conf important.conf.bak  # 先备份
sed -i 's/old/new/g' important.conf

# 或者让 sed 自动备份
sed -i.bak 's/old/new/g' important.conf  # 会自动创建 important.conf.bak
```

### 误区 4："管道会创建临时文件"

**错！** 管道是**内存中的数据传输**，不会创建临时文件：

```bash
# 管道操作在内存中完成，不创建文件
cat file.txt | grep "error" | wc -l

# 等价于：
# 1. cat 读取 file.txt，输出到内存
# 2. grep 从内存读取，过滤后输出到内存
# 3. wc 从内存读取，统计结果
```

### 误区 5："awk 只能处理表格数据"

**错！** `awk` 可以处理任何**按行组织的文本**，不限于表格：

```bash
# 处理日志文件
awk '/ERROR/ {print $0}' app.log  # 打印包含 ERROR 的行

# 处理配置文件
awk -F= '{print $1}' config.ini  # 以 = 为分隔符，打印键名

# 统计代码
awk 'BEGIN {count=0} /function/ {count++} END {print count}' code.py
```

---

## 4.8 动手练习

### 练习 1：基础练习 - 文件查看

**题目**：练习查看文件内容的不同方式。

要求：
1. 使用 cat 查看 /etc/passwd 文件
2. 使用 less 分页查看 /var/log/syslog（如果存在）
3. 使用 head 查看 /etc/passwd 的前 5 行
4. 使用 tail 查看 /etc/passwd 的后 3 行
5. 统计 /etc/passwd 的行数

<details>
<summary>点击查看答案</summary>

```bash
# 1. 使用 cat 查看 /etc/passwd
cat /etc/passwd

# 2. 使用 less 分页查看（按 q 退出）
less /var/log/syslog
# 或者查看其他日志文件
less /var/log/auth.log

# 3. 使用 head 查看前 5 行
head -n 5 /etc/passwd

# 4. 使用 tail 查看后 3 行
tail -n 3 /etc/passwd

# 5. 统计行数
wc -l /etc/passwd

# 验证：head 和 tail 的结果应该一致
```

</details>

### 练习 2：进阶练习 - 文本搜索

**题目**：在日志文件中搜索和分析错误信息。

要求：
1. 在 /var/log 目录下搜索包含 "error" 的日志文件
2. 统计 /var/log/auth.log 中包含 "Failed" 的行数
3. 查找 /etc 目录下所有包含 "root" 的配置文件
4. 查看 /var/log/syslog 最后 50 行中的错误信息

<details>
<summary>点击查看答案</summary>

```bash
# 1. 搜索包含 "error" 的日志文件
grep -l "error" /var/log/*.log 2>/dev/null

# 2. 统计 "Failed" 出现次数
grep -c "Failed" /var/log/auth.log 2>/dev/null
# 或者
grep "Failed" /var/log/auth.log 2>/dev/null | wc -l

# 3. 查找包含 "root" 的配置文件
grep -r "root" /etc --include="*.conf" 2>/dev/null

# 4. 查看最后 50 行中的错误
tail -n 50 /var/log/syslog 2>/dev/null | grep -i "error"

# 如果某些文件不存在，可以用其他日志文件替代
# 比如 /var/log/messages、/var/log/dmesg 等
```

</details>

### 练习 3（挑战）：综合练习 - 日志分析

**题目**：分析访问日志，统计访问数据。

假设有一个 access.log 文件，格式如下：
```
192.168.1.1 - - [01/Jan/2024:10:00:00] "GET /index.html" 200 1234
192.168.1.2 - - [01/Jan/2024:10:00:01] "POST /api/login" 200 567
192.168.1.1 - - [01/Jan/2024:10:00:02] "GET /style.css" 200 890
```

要求：
1. 统计访问次数最多的前 5 个 IP
2. 统计各种 HTTP 状态码的数量
3. 统计访问最多的前 3 个 URL
4. 计算总流量（最后一列的总和）

<details>
<summary>点击查看答案</summary>

```bash
# 首先创建示例日志文件
cat > access.log << EOF
192.168.1.1 - - [01/Jan/2024:10:00:00] "GET /index.html" 200 1234
192.168.1.2 - - [01/Jan/2024:10:00:01] "POST /api/login" 200 567
192.168.1.1 - - [01/Jan/2024:10:00:02] "GET /style.css" 200 890
192.168.1.3 - - [01/Jan/2024:10:00:03] "GET /index.html" 404 234
192.168.1.2 - - [01/Jan/2024:10:00:04] "GET /api/data" 200 1567
192.168.1.1 - - [01/Jan/2024:10:00:05] "GET /index.html" 200 1234
EOF

# 1. 统计访问次数最多的前 5 个 IP
awk '{print $1}' access.log | sort | uniq -c | sort -nr | head -5

# 2. 统计各种 HTTP 状态码的数量
awk '{print $9}' access.log | sort | uniq -c | sort -nr

# 3. 统计访问最多的前 3 个 URL
awk '{print $7}' access.log | sort | uniq -c | sort -nr | head -3

# 4. 计算总流量（最后一列的总和）
awk '{sum += $10} END {print "总流量: " sum " 字节"}' access.log

# 或者转换为 MB
awk '{sum += $10} END {print "总流量: " sum/1024/1024 " MB"}' access.log

# 进阶：组合统计
echo "=== 访问统计 ==="
echo "总访问次数: $(wc -l < access.log)"
echo "独立 IP 数: $(awk '{print $1}' access.log | sort -u | wc -l)"
echo "404 错误数: $(awk '$9 == 404' access.log | wc -l)"
echo "总流量: $(awk '{sum += $10} END {print sum/1024 " KB"}' access.log)"
```

</details>

---

## 下一章预告

下一章我们会学习 **用户与权限管理**——也就是如何管理 Linux 系统中的用户和文件权限。你会学到：

- 如何创建和管理用户
- 用户组的概念和使用
- chmod、chown 这些命令怎么用
- sudo 权限如何配置

这些知识对于系统安全至关重要，学会了就能保护你的系统不被未授权访问了。
