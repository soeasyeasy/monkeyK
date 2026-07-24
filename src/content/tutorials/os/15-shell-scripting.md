---
title: "第十五章：Shell 脚本编程"
description: "掌握 Shell 脚本编程的核心技能，包括变量、条件语句、循环、函数以及实战脚本示例"
---

# 第十五章：Shell 脚本编程

## 本章导读

在开始学习 Shell 脚本编程之前，你可能会有这些疑问：

1. **Shell 脚本和命令行有什么区别？** 命令行是输入一条执行一条，脚本是把很多命令写到一个文件里批量执行。
2. **为什么要学 Shell 脚本？** 手动操作太麻烦了，比如你要备份 100 台服务器的数据，难道要一台一台手动操作吗？
3. **Shell 脚本难不难？** 如果你已经掌握了上一章的 Linux 命令，那脚本编程就很简单，只是把命令组合起来而已。
4. **Shell 脚本能做什么？** 系统管理、文件处理、自动化任务、服务监控，几乎所有你能想到的重复性工作。

本章会带你从零开始，学习 Shell 脚本的核心语法。学完之后，你就能写出实用的自动化脚本，解放你的双手。

## 为什么需要 Shell 脚本

### 没有脚本会怎样

想象一下，你是一家公司的运维工程师，每天需要：

- 检查 50 台服务器的磁盘空间
- 备份数据库并上传到云存储
- 清理超过 7 天的日志文件
- 监控服务状态，异常时自动重启

如果没有脚本，你每天都要手动执行这些操作，重复几百次。这不仅浪费时间，还容易出错。

### 生活化类比：Shell 脚本就像菜谱

把 Shell 脚本想象成一份详细的菜谱：

- **变量**：食材（比如"鸡蛋 2 个"）
- **条件语句**：判断（比如"如果鸡蛋坏了就换新的"）
- **循环**：重复操作（比如"搅拌 10 次"）
- **函数**：可复用的步骤（比如"打鸡蛋"这个动作可以在多个菜里用）

你按照菜谱一步步做，就能做出一道菜。同样，Shell 按照脚本一步步执行，就能完成一个任务。

### 脚本的核心优势

| 优势 | 说明 | 类比 |
|------|------|------|
| 自动化 | 一次编写，重复执行 | 像洗衣机一样自动 |
| 可复用 | 写一次，到处用 | 像菜谱可以反复用 |
| 可维护 | 修改脚本就能改变行为 | 像改菜谱就能改菜品 |
| 可分享 | 可以把脚本分享给别人 | 像分享菜谱一样简单 |

## Shell 脚本基础

### 什么是 Shell 脚本

Shell 脚本是一个包含一系列命令的文本文件，由 Shell 解释执行。它可以自动化日常任务，提高系统管理效率。

**Shell 类型**：
| Shell | 说明 | 特点 |
| --- | --- | --- |
| bash | Bourne Again Shell | Linux 默认，功能强大 |
| sh | Bourne Shell | 最原始的 Unix Shell |
| zsh | Z Shell | macOS 默认，功能丰富 |
| ksh | Korn Shell | 兼容 bash，企业级应用 |
| fish | Friendly Interactive Shell | 用户友好，自动补全 |

### 第一个 Shell 脚本

```bash
#!/bin/bash
# 这是一个简单的 Shell 脚本示例

echo "Hello, World!"
echo "当前时间：$(date)"
echo "当前用户：$(whoami)"
echo "当前目录：$(pwd)"
```

**脚本说明**：
- `#!/bin/bash`：Shebang 行，指定使用 bash 解释器
- `#`：注释行
- `echo`：输出命令

### 脚本执行方式

**方式一：赋予执行权限**

```bash
# 赋予执行权限
chmod +x script.sh

# 执行脚本
./script.sh
```

**方式二：使用解释器执行**

```bash
# 使用 bash 执行
bash script.sh

# 使用 sh 执行
sh script.sh
```

**方式三：使用 source 执行（在当前 Shell 中）**

```bash
# 在当前 Shell 中执行
source script.sh

# 或者
. script.sh
```

::: tip
使用 `source` 执行脚本时，脚本中的变量和函数会在当前 Shell 环境中生效。
:::

## Shell 变量

### 变量定义和使用

```bash
#!/bin/bash

# 定义变量（不需要声明类型）
name="张三"
age=25
height=1.75

# 使用变量（使用 $ 或 ${}）
echo "姓名：$name"
echo "年龄：${age}"
echo "身高：$height"

# 变量赋值（等号两边不能有空格）
name="李四"  # 正确
# name = "李四"  # 错误
```

### 变量类型

**局部变量**：只在当前 Shell 中有效

```bash
#!/bin/bash

local_var="局部变量"
echo "$local_var"
```

**环境变量**：对所有进程有效

```bash
#!/bin/bash

# 设置环境变量
export MY_VAR="环境变量"
echo "$MY_VAR"

# 查看环境变量
env
printenv

# 查看特定环境变量
echo "$PATH"
echo "$HOME"
echo "$USER"
```

**位置参数变量**：命令行参数

```bash
#!/bin/bash

# 脚本执行：./script.sh arg1 arg2 arg3

echo "第 1 个参数：$1"
echo "第 2 个参数：$2"
echo "第 3 个参数：$3"
echo "所有参数：$*"
echo "参数个数：$#"
echo "脚本名称：$0"
```

**特殊变量**：

```bash
#!/bin/bash

echo "当前进程 ID：$$"
echo "上一个命令退出状态：$?"
echo "后台最后一个进程 ID：$!"
```

### 只读变量

```bash
#!/bin/bash

# 定义只读变量
readonly PI=3.14159

# 尝试修改会报错
# PI=3.14  # 错误：bash: PI: readonly variable

echo "PI = $PI"
```

### 删除变量

```bash
#!/bin/bash

var="测试变量"
echo "$var"

# 删除变量
unset var

# 变量已不存在
echo "$var"  # 输出空行
```

### 字符串操作

```bash
#!/bin/bash

str="Hello, World!"

# 字符串长度
echo "长度：${#str}"

# 子字符串（从索引 7 开始，取 5 个字符）
echo "子串：${str:7:5}"

# 字符串替换
echo "替换：${str/World/Bash}"

# 字符串删除（删除最短匹配）
file="document.tar.gz"
echo "删除后缀：${file%.*}"  # 输出：document.tar

# 字符串删除（删除最长匹配）
echo "删除后缀：${file%%.*}"  # 输出：document

# 字符串删除（删除前缀）
echo "删除前缀：${file#*.}"  # 输出：tar.gz

# 字符串删除（删除最长前缀）
echo "删除前缀：${file##*.}"  # 输出：gz
```

### 数组

**定义数组**：

```bash
#!/bin/bash

# 定义数组
fruits=("apple" "banana" "orange" "grape")

# 或者逐个定义
fruits[0]="apple"
fruits[1]="banana"
fruits[2]="orange"
fruits[3]="grape"
```

**访问数组元素**：

```bash
#!/bin/bash

fruits=("apple" "banana" "orange" "grape")

# 访问单个元素
echo "第一个水果：${fruits[0]}"
echo "第二个水果：${fruits[1]}"

# 访问所有元素
echo "所有水果：${fruits[*]}"
echo "所有水果：${fruits[@]}"

# 数组长度
echo "数组长度：${#fruits[@]}"

# 遍历数组
for fruit in "${fruits[@]}"; do
    echo "水果：$fruit"
done
```

## 条件语句

### if 语句

**基本格式**：

```bash
#!/bin/bash

# 基本 if 语句
if [ 条件 ]; then
    命令
fi

# if-else 语句
if [ 条件 ]; then
    命令
else
    命令
fi

# if-elif-else 语句
if [ 条件1 ]; then
    命令
elif [ 条件2 ]; then
    命令
else
    命令
fi
```

**数值比较**：

```bash
#!/bin/bash

a=10
b=20

# 数值比较运算符
# -eq：等于
# -ne：不等于
# -gt：大于
# -lt：小于
# -ge：大于等于
# -le：小于等于

if [ "$a" -eq "$b" ]; then
    echo "a 等于 b"
elif [ "$a" -gt "$b" ]; then
    echo "a 大于 b"
else
    echo "a 小于 b"
fi
```

**字符串比较**：

```bash
#!/bin/bash

str1="hello"
str2="world"

# 字符串比较运算符
# =：等于
# !=：不等于
# -z：字符串为空
# -n：字符串非空

if [ "$str1" = "$str2" ]; then
    echo "字符串相等"
elif [ -z "$str1" ]; then
    echo "str1 为空"
else
    echo "字符串不相等"
fi
```

**文件测试**：

```bash
#!/bin/bash

file="test.txt"

# 文件测试运算符
# -e：文件存在
# -f：文件是普通文件
# -d：文件是目录
# -r：文件可读
# -w：文件可写
# -x：文件可执行
# -s：文件非空

if [ -e "$file" ]; then
    echo "文件存在"
    
    if [ -f "$file" ]; then
        echo "是普通文件"
    fi
    
    if [ -d "$file" ]; then
        echo "是目录"
    fi
    
    if [ -r "$file" ]; then
        echo "文件可读"
    fi
    
    if [ -w "$file" ]; then
        echo "文件可写"
    fi
    
    if [ -x "$file" ]; then
        echo "文件可执行"
    fi
else
    echo "文件不存在"
fi
```

**逻辑运算符**：

```bash
#!/bin/bash

a=10
b=20

# 逻辑运算符
# -a：AND（与）
# -o：OR（或）
# !：NOT（非）

# 使用 -a 和 -o
if [ "$a" -gt 5 -a "$b" -lt 30 ]; then
    echo "条件满足"
fi

# 使用 [[ ]] 和 && ||
if [[ "$a" -gt 5 && "$b" -lt 30 ]]; then
    echo "条件满足"
fi

# 使用 !
if [ ! "$a" -eq "$b" ]; then
    echo "a 不等于 b"
fi
```

### case 语句

```bash
#!/bin/bash

echo "请输入一个数字（1-3）："
read num

case "$num" in
    1)
        echo "你输入了 1"
        ;;
    2)
        echo "你输入了 2"
        ;;
    3)
        echo "你输入了 3"
        ;;
    *)
        echo "输入无效"
        ;;
esac
```

**case 语句匹配模式**：

```bash
#!/bin/bash

echo "请输入文件名："
read filename

case "$filename" in
    *.txt)
        echo "这是文本文件"
        ;;
    *.jpg|*.png|*.gif)
        echo "这是图片文件"
        ;;
    *.mp3|*.wav)
        echo "这是音频文件"
        ;;
    *)
        echo "未知文件类型"
        ;;
esac
```

## 循环语句

### for 循环

**列表 for 循环**：

```bash
#!/bin/bash

# 遍历列表
for fruit in apple banana orange grape; do
    echo "水果：$fruit"
done

# 遍历数组
fruits=("apple" "banana" "orange" "grape")
for fruit in "${fruits[@]}"; do
    echo "水果：$fruit"
done

# 遍历文件
for file in *.txt; do
    echo "处理文件：$file"
done
```

**C 风格 for 循环**：

```bash
#!/bin/bash

# C 风格 for 循环
for ((i=1; i<=10; i++)); do
    echo "数字：$i"
done

# 计算 1 到 100 的和
sum=0
for ((i=1; i<=100; i++)); do
    sum=$((sum + i))
done
echo "1 到 100 的和：$sum"
```

**seq 命令**：

```bash
#!/bin/bash

# 使用 seq 生成序列
for i in $(seq 1 10); do
    echo "$i"
done

# 指定步长
for i in $(seq 1 2 10); do
    echo "$i"  # 输出：1 3 5 7 9
done

# 倒序
for i in $(seq 10 -1 1); do
    echo "$i"
done
```

### while 循环

```bash
#!/bin/bash

# 基本 while 循环
count=1
while [ "$count" -le 10 ]; do
    echo "计数：$count"
    count=$((count + 1))
done

# 读取文件
while read line; do
    echo "行：$line"
done < file.txt

# 无限循环（按 Ctrl+C 退出）
while true; do
    echo "运行中..."
    sleep 1
done
```

### until 循环

```bash
#!/bin/bash

# until 循环（条件为假时执行）
count=1
until [ "$count" -gt 10 ]; do
    echo "计数：$count"
    count=$((count + 1))
done
```

### 循环控制

**break**：跳出循环

```bash
#!/bin/bash

for i in {1..10}; do
    if [ "$i" -eq 5 ]; then
        break  # 跳出循环
    fi
    echo "$i"
done
# 输出：1 2 3 4
```

**continue**：跳过当前迭代

```bash
#!/bin/bash

for i in {1..10}; do
    if [ "$i" -eq 5 ]; then
        continue  # 跳过 5
    fi
    echo "$i"
done
# 输出：1 2 3 4 6 7 8 9 10
```

## 函数

### 函数定义

```bash
#!/bin/bash

# 方式一：使用 function 关键字
function greet {
    echo "Hello, $1!"
}

# 方式二：使用函数名加括号
greet2() {
    echo "Hi, $1!"
}

# 调用函数
greet "张三"
greet2 "李四"
```

### 函数参数

```bash
#!/bin/bash

# 函数可以接收参数
add() {
    local result=$(($1 + $2))
    echo "$result"
}

# 调用函数并获取返回值
sum=$(add 10 20)
echo "和：$sum"

# 函数参数个数
show_args() {
    echo "参数个数：$#"
    echo "所有参数：$*"
    echo "第一个参数：$1"
    echo "第二个参数：$2"
}

show_args arg1 arg2 arg3
```

### 函数返回值

```bash
#!/bin/bash

# 方式一：使用 echo 返回字符串
get_greeting() {
    echo "Hello, $1!"
}

greeting=$(get_greeting "张三")
echo "$greeting"

# 方式二：使用 return 返回整数（0-255）
check_file() {
    if [ -f "$1" ]; then
        return 0  # 成功
    else
        return 1  # 失败
    fi
}

check_file "test.txt"
if [ $? -eq 0 ]; then
    echo "文件存在"
else
    echo "文件不存在"
fi
```

### 局部变量

```bash
#!/bin/bash

global_var="全局变量"

test_scope() {
    local local_var="局部变量"
    echo "函数内：$global_var"
    echo "函数内：$local_var"
}

test_scope

echo "函数外：$global_var"
# echo "函数外：$local_var"  # 错误：变量未定义
```

## 输入输出

### 读取输入

```bash
#!/bin/bash

# 基本读取
echo "请输入你的名字："
read name
echo "你好，$name！"

# 读取多个变量
echo "请输入姓名和年龄（用空格分隔）："
read name age
echo "姓名：$name，年龄：$age"

# 带提示读取
read -p "请输入密码：" -s password
echo
echo "密码已输入"

# 限时读取
echo "请在 5 秒内输入："
if read -t 5 input; then
    echo "你输入了：$input"
else
    echo "输入超时"
fi

# 读取指定字符数
echo "请输入一个字符："
read -n 1 char
echo "你输入了：$char"
```

### 输出格式化

```bash
#!/bin/bash

# printf 格式化输出
name="张三"
age=25
height=1.75

printf "姓名：%s\n" "$name"
printf "年龄：%d\n" "$age"
printf "身高：%.2f\n" "$height"

# 对齐输出
printf "%-10s %5d %8.2f\n" "张三" 25 1.75
printf "%-10s %5d %8.2f\n" "李四" 30 1.80

# 颜色输出
echo -e "\033[31m红色文本\033[0m"
echo -e "\033[32m绿色文本\033[0m"
echo -e "\033[33m黄色文本\033[0m"
echo -e "\033[34m蓝色文本\033[0m"

# 颜色代码
# 31: 红色
# 32: 绿色
# 33: 黄色
# 34: 蓝色
# 35: 紫色
# 36: 青色
# 37: 白色
```

## 脚本实战

### 示例一：系统信息收集脚本

```bash
#!/bin/bash

# 系统信息收集脚本

echo "===================="
echo "    系统信息报告"
echo "===================="
echo

# 主机名
echo "主机名：$(hostname)"

# 操作系统
echo "操作系统：$(uname -s)"
echo "内核版本：$(uname -r)"
echo "系统架构：$(uname -m)"

# 当前时间
echo "当前时间：$(date)"

# 运行时间
echo "运行时间：$(uptime -p 2>/dev/null || uptime)"

# 当前用户
echo "当前用户：$(whoami)"

# CPU 信息
echo
echo "CPU 信息："
grep "model name" /proc/cpuinfo | head -1 | cut -d ':' -f 2

# 内存信息
echo
echo "内存信息："
free -h | grep "Mem:" | awk '{print "总内存：" $2 "，已用：" $3 "，可用：" $7}'

# 磁盘信息
echo
echo "磁盘信息："
df -h | grep "^/dev" | awk '{print $1 ": 总容量 " $2 "，已用 " $3 "，可用 " $4}'

# 网络信息
echo
echo "网络信息："
ip addr show | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}'

echo
echo "===================="
echo "    报告结束"
echo "===================="
```

### 示例二：文件备份脚本

```bash
#!/bin/bash

# 文件备份脚本

# 配置
SOURCE_DIR="/home/user/documents"
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.tar.gz"

# 检查源目录
if [ ! -d "$SOURCE_DIR" ]; then
    echo "错误：源目录不存在"
    exit 1
fi

# 创建备份目录
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
fi

# 执行备份
echo "开始备份..."
tar -czf "$BACKUP_FILE" -C "$SOURCE_DIR" .

if [ $? -eq 0 ]; then
    echo "备份成功：$BACKUP_FILE"
    echo "备份大小：$(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo "备份失败"
    exit 1
fi

# 清理旧备份（保留最近 7 天）
echo "清理旧备份..."
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +7 -delete

echo "备份完成"
```

### 示例三：批量重命名脚本

```bash
#!/bin/bash

# 批量重命名脚本

# 检查参数
if [ $# -lt 2 ]; then
    echo "用法：$0 <目录> <新前缀>"
    exit 1
fi

DIR="$1"
PREFIX="$2"

# 检查目录
if [ ! -d "$DIR" ]; then
    echo "错误：目录不存在"
    exit 1
fi

# 批量重命名
count=0
for file in "$DIR"/*; do
    if [ -f "$file" ]; then
        ext="${file##*.}"
        new_name="${DIR}/${PREFIX}_${count}.${ext}"
        mv "$file" "$new_name"
        echo "重命名：$(basename "$file") -> $(basename "$new_name")"
        count=$((count + 1))
    fi
done

echo "共重命名 $count 个文件"
```

### 示例四：服务监控脚本

```bash
#!/bin/bash

# 服务监控脚本

SERVICES=("nginx" "mysql" "redis")
LOG_FILE="/var/log/service_monitor.log"

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

check_service() {
    local service="$1"
    
    if systemctl is-active --quiet "$service"; then
        log_message "$service 运行正常"
    else
        log_message "$service 已停止，尝试重启..."
        systemctl restart "$service"
        
        if systemctl is-active --quiet "$service"; then
            log_message "$service 重启成功"
        else
            log_message "$service 重启失败"
        fi
    fi
}

# 检查所有服务
for service in "${SERVICES[@]}"; do
    check_service "$service"
done

echo "监控完成，日志：$LOG_FILE"
```

### 示例五：磁盘空间监控脚本

```bash
#!/bin/bash

# 磁盘空间监控脚本

THRESHOLD=80
EMAIL="admin@example.com"

# 获取磁盘使用率
df -h | grep "^/dev" | while read line; do
    usage=$(echo "$line" | awk '{print $5}' | sed 's/%//')
    mount=$(echo "$line" | awk '{print $6}')
    
    if [ "$usage" -gt "$THRESHOLD" ]; then
        message="警告：$mount 使用率 ${usage}%，超过阈值 ${THRESHOLD}%"
        echo "$message"
        
        # 发送邮件（需要配置 mail 命令）
        # echo "$message" | mail -s "磁盘空间警告" "$EMAIL"
    fi
done
```

## 脚本调试

### 调试选项

```bash
# 使用 -x 选项调试
bash -x script.sh

# 在脚本中添加调试
#!/bin/bash
set -x  # 开启调试
echo "调试信息"
set +x  # 关闭调试

# 使用 -n 检查语法
bash -n script.sh

# 使用 -v 显示执行过程
bash -v script.sh
```

### 常见错误

**语法错误**：
```bash
# 错误：缺少空格
if [$a -eq $b]; then  # 错误
if [ $a -eq $b ]; then  # 正确

# 错误：缺少 then
if [ $a -eq $b ]  # 错误
if [ $a -eq $b ]; then  # 正确
```

**变量错误**：
```bash
# 错误：等号两边有空格
name = "张三"  # 错误
name="张三"  # 正确

# 错误：未使用引号
if [ $name = "张三" ]; then  # 如果 name 为空会报错
if [ "$name" = "张三" ]; then  # 正确
```

## 对比表格

### 循环语句对比

| 循环类型 | 语法 | 适用场景 | 特点 |
|----------|------|----------|------|
| for（列表） | for item in list | 遍历已知列表 | 简单直观 |
| for（C风格） | for ((i=0; i<N; i++)) | 需要计数器 | 类似 C 语言 |
| while | while [ condition ] | 条件满足时执行 | 先判断后执行 |
| until | until [ condition ] | 条件满足时停止 | 先判断后执行，条件为假时循环 |

### 条件判断对比

| 判断类型 | 运算符 | 示例 | 说明 |
|----------|--------|------|------|
| 数值比较 | -eq, -ne, -gt, -lt, -ge, -le | [ "$a" -eq "$b" ] | 只能用于整数 |
| 字符串比较 | =, !=, -z, -n | [ "$s" = "hello" ] | 注意用引号包裹变量 |
| 文件测试 | -e, -f, -d, -r, -w, -x | [ -f "file.txt" ] | 检查文件属性 |
| 逻辑运算 | -a, -o, ! 或 &&, \|\| | [ "$a" -gt 0 -a "$b" -lt 10 ] | -a 是与，-o 是或 |

### 变量类型对比

| 变量类型 | 定义方式 | 作用域 | 示例 |
|----------|----------|--------|------|
| 局部变量 | name="value" | 当前 Shell | name="张三" |
| 环境变量 | export VAR="value" | 所有子进程 | export PATH="/usr/bin" |
| 位置参数 | 命令行传入 | 当前脚本 | $1, $2, $* |
| 特殊变量 | 系统定义 | 当前 Shell | $$, $?, $! |
| 局部变量（函数内） | local var="value" | 函数内部 | local temp=10 |

## 新手常见误区

### 误区一：变量赋值时等号两边加空格

**错误做法**：
```bash
name = "张三"    # 错误！Shell 会把 name 当成命令
```

**正确做法**：
```bash
name="张三"      # 正确，等号两边不能有空格
```

**为什么错**：在 Shell 中，空格是命令和参数的分隔符。`name = "张三"` 会被解释为"执行 name 命令，参数是 = 和张三"，而不是赋值。这是新手最常犯的错误。

### 误区二：if 语句中方括号不加空格

**错误做法**：
```bash
if [$a -eq $b]; then    # 错误！缺少空格
```

**正确做法**：
```bash
if [ "$a" -eq "$b" ]; then    # 正确，方括号两边要加空格
```

**为什么错**：`[` 实际上是一个命令（等同于 `test`），它需要和参数之间用空格分隔。不加空格的话，Shell 会把 `[$a` 当成一个整体，找不到这个命令。

### 误区三：变量引用不加引号

**错误做法**：
```bash
name="张 三"
if [ $name = "李四" ]; then    # 如果 name 包含空格，会报错
```

**正确做法**：
```bash
name="张 三"
if [ "$name" = "李四" ]; then    # 正确，用引号包裹变量
```

**为什么错**：如果变量值包含空格，不加引号会导致 Shell 把它拆分成多个参数。`$name` 会展开成 `张 三`，条件判断就变成了 `[ 张 三 = "李四" ]`，参数数量不对，直接报错。

### 误区四：混淆 source 执行和直接执行的区别

**错误理解**：`bash script.sh` 和 `source script.sh` 是一样的。

**正确理解**：
```bash
# 直接执行：在子 Shell 中运行，脚本中的变量不会影响当前 Shell
bash script.sh

# source 执行：在当前 Shell 中运行，脚本中的变量会影响当前 Shell
source script.sh
```

**区别**：直接执行时，脚本在一个新的子进程中运行，脚本里设置的变量、函数在脚本结束后就消失了。source 执行时，脚本在当前进程中运行，变量和函数会保留在当前环境中。

### 误区五：函数返回值用 return 返回字符串

**错误做法**：
```bash
get_name() {
    return "张三"    # 错误！return 只能返回 0-255 的整数
}
```

**正确做法**：
```bash
# 方式一：用 echo 输出，调用时用命令替换获取
get_name() {
    echo "张三"
}
name=$(get_name)

# 方式二：用 return 返回状态码（0-255）
check_status() {
    if [ -f "$1" ]; then
        return 0    # 成功返回 0
    else
        return 1    # 失败返回 1
    fi
}
```

**为什么错**：Shell 函数的 return 只能返回 0-255 的整数，用来表示退出状态。如果要返回字符串，需要用 echo 输出，然后在调用处用 `$()` 命令替换来获取。

## 动手练习

### 练习一：基础题 - 编写判断脚本

**题目**：编写一个脚本，接收一个文件名作为参数，判断该文件是否存在、是否为普通文件、是否可读。

<details>
<summary>点击查看答案</summary>

```bash
#!/bin/bash

# 检查是否传入了参数
if [ $# -lt 1 ]; then
    echo "用法：$0 <文件名>"
    exit 1
fi

file="$1"

# 判断文件是否存在
if [ -e "$file" ]; then
    echo "文件存在：$file"
else
    echo "文件不存在：$file"
    exit 1
fi

# 判断是否为普通文件
if [ -f "$file" ]; then
    echo "是普通文件"
else
    echo "不是普通文件"
fi

# 判断是否可读
if [ -r "$file" ]; then
    echo "文件可读"
else
    echo "文件不可读"
fi
```

</details>

### 练习二：进阶题 - 编写统计脚本

**题目**：编写一个脚本，统计指定目录下各种类型文件的数量。比如 `.txt` 文件有多少个，`.jpg` 文件有多少个，等等。

<details>
<summary>点击查看答案</summary>

```bash
#!/bin/bash

# 检查参数
if [ $# -lt 1 ]; then
    echo "用法：$0 <目录>"
    exit 1
fi

dir="$1"

# 检查目录是否存在
if [ ! -d "$dir" ]; then
    echo "错误：目录不存在"
    exit 1
fi

echo "统计目录：$dir"
echo "===================="

# 统计总文件数
total=$(find "$dir" -type f | wc -l)
echo "总文件数：$total"
echo

# 统计各类型文件
echo "文件类型统计："
find "$dir" -type f | awk -F. '{print $NF}' | sort | uniq -c | sort -rn | while read count ext; do
    printf "  .%-10s %d 个\n" "$ext" "$count"
done

echo
echo "===================="
echo "统计完成"
```

</details>

### 练习三：挑战题 - 编写自动备份脚本

**题目**：编写一个自动备份脚本，要求：
1. 接收两个参数：源目录和目标目录
2. 创建带时间戳的压缩包备份
3. 保留最近 5 个备份，删除旧的
4. 输出备份结果（成功/失败、文件大小）

<details>
<summary>点击查看答案</summary>

```bash
#!/bin/bash

# 自动备份脚本

# 检查参数
if [ $# -lt 2 ]; then
    echo "用法：$0 <源目录> <备份目录>"
    exit 1
fi

SOURCE="$1"
BACKUP_DIR="$2"
MAX_BACKUPS=5

# 检查源目录
if [ ! -d "$SOURCE" ]; then
    echo "错误：源目录不存在：$SOURCE"
    exit 1
fi

# 创建备份目录
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    echo "创建备份目录：$BACKUP_DIR"
fi

# 生成备份文件名（带时间戳）
timestamp=$(date +%Y%m%d_%H%M%S)
source_name=$(basename "$SOURCE")
backup_file="${BACKUP_DIR}/${source_name}_${timestamp}.tar.gz"

# 执行备份
echo "开始备份..."
echo "源目录：$SOURCE"
echo "备份文件：$backup_file"

tar -czf "$backup_file" -C "$(dirname "$SOURCE")" "$source_name" 2>/dev/null

if [ $? -eq 0 ]; then
    file_size=$(du -h "$backup_file" | cut -f1)
    echo "备份成功！文件大小：$file_size"
else
    echo "备份失败！"
    rm -f "$backup_file"
    exit 1
fi

# 清理旧备份（保留最近 MAX_BACKUPS 个）
backup_count=$(ls -1 "${BACKUP_DIR}/${source_name}_"*.tar.gz 2>/dev/null | wc -l)

if [ "$backup_count" -gt "$MAX_BACKUPS" ]; then
    delete_count=$((backup_count - MAX_BACKUPS))
    echo "清理旧备份（删除 $delete_count 个）..."
    ls -1t "${BACKUP_DIR}/${source_name}_"*.tar.gz | tail -n "$delete_count" | xargs rm -f
    echo "清理完成"
fi

# 显示当前所有备份
echo
echo "当前备份列表："
ls -lh "${BACKUP_DIR}/${source_name}_"*.tar.gz 2>/dev/null
echo
echo "备份任务完成"
```

</details>

## 下一章预告

恭喜你完成了 Shell 脚本编程的学习！现在你已经能写出实用的自动化脚本了。在下一章（也是最后一章）中，我们将学习系统性能调优，包括如何使用监控工具发现性能瓶颈、如何优化 CPU 和内存使用、如何提升 I/O 性能。这是运维工程师的核心技能，学完之后你就能让系统跑得更快更稳。让我们为这个操作系统教程画上一个圆满的句号吧！

## 本章小结

- Shell 脚本是自动化任务的重要工具
- 变量分为局部变量、环境变量、位置参数和特殊变量
- 条件语句包括 if 和 case
- 循环语句包括 for、while 和 until
- 函数可以封装代码，提高复用性
- 脚本实战包括系统信息收集、文件备份、批量重命名等
