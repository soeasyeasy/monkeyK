---
title: "第十五章：Shell 脚本编程"
description: "掌握 Shell 脚本编程的核心技能，包括变量、条件语句、循环、函数以及实战脚本示例"
---

# 第十五章：Shell 脚本编程

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

## 本章小结

- Shell 脚本是自动化任务的重要工具
- 变量分为局部变量、环境变量、位置参数和特殊变量
- 条件语句包括 if 和 case
- 循环语句包括 for、while 和 until
- 函数可以封装代码，提高复用性
- 脚本实战包括系统信息收集、文件备份、批量重命名等
