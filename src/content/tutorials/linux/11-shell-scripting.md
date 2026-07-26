---
title: "第十一章：Shell 脚本编程"
description: "掌握 Shell 脚本编程的核心技能，包括变量、条件语句、循环、函数以及实战脚本示例"
---

# 第十一章：Shell 脚本编程

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Shell 脚本和命令行有什么区别？为什么要学脚本编程？
- 脚本里的变量、条件、循环这些概念难不难？和编程语言的语法一样吗？
- 怎么写一个实用的自动化脚本？比如批量重命名、系统监控、日志分析？
- 脚本调试太难了，出错了怎么排查？

这一章就是为了解答这些问题。我们会从最基础的语法讲起，一步步带你掌握 Shell 脚本的核心技能。学完之后，你就能写出实用的自动化脚本，解放你的双手。

---

## 11.1 为什么需要 Shell 脚本编程？

### 痛点分析

想象一下这个场景：你是一家公司的运维工程师，每天需要：

- 检查 50 台服务器的磁盘空间
- 备份数据库并上传到云存储
- 清理超过 7 天的日志文件
- 监控服务状态，异常时自动重启

如果没有脚本，你每天都要手动执行这些操作，重复几百次。这不仅浪费时间，还容易出错。

具体痛点包括：

- **重复劳动**：同样的命令每天要敲几十遍
- **容易出错**：手动操作容易漏掉步骤或输错命令
- **效率低下**：无法批量处理，只能一台一台操作
- **难以维护**：没有记录，过段时间就忘了怎么操作

### 生活化类比

把 Shell 脚本想象成一份详细的菜谱：

> - **变量**：食材（比如"鸡蛋 2 个"）
> - **条件语句**：判断（比如"如果鸡蛋坏了就换新的"）
> - **循环**：重复操作（比如"搅拌 10 次"）
> - **函数**：可复用的步骤（比如"打鸡蛋"这个动作可以在多个菜里用）

你按照菜谱一步步做，就能做出一道菜。同样，Shell 按照脚本一步步执行，就能完成一个任务。

---

## 11.2 核心原理讲解

### 什么是 Shell 脚本

Shell 脚本是一个包含一系列命令的文本文件，由 Shell 解释执行。它可以自动化日常任务，提高系统管理效率。

**Shell 类型对比**：

| Shell | 说明 | 特点 |
| --- | --- | --- |
| bash | Bourne Again Shell | Linux 默认，功能强大 |
| sh | Bourne Shell | 最原始的 Unix Shell |
| zsh | Z Shell | macOS 默认，功能丰富 |
| fish | Friendly Interactive Shell | 用户友好，自动补全 |

### 脚本执行流程

```
1. 编写脚本文件（.sh 后缀）
2. 添加执行权限（chmod +x）
3. 执行脚本（./script.sh）
```

打个比方：

> 写脚本就像写清单。你把要做的事情一条条写下来，然后按照清单一件件执行。Shell 就是那个帮你执行清单的"机器人"。

---

## 11.3 基础用法

### 第一个 Shell 脚本

```bash
#!/bin/bash
# 这是一个简单的 Shell 脚本示例
# 第一行 #!/bin/bash 叫做 Shebang，指定用哪个解释器

# 输出信息到终端
echo "Hello, World!"                    # 打印欢迎信息
echo "当前时间：$(date)"                # 打印当前时间
echo "当前用户：$(whoami)"              # 打印当前用户名
echo "当前目录：$(pwd)"                 # 打印当前工作目录
```

### 脚本执行方式

```bash
# 方式一：赋予执行权限（推荐）
chmod +x script.sh                      # 添加执行权限
./script.sh                             # 执行脚本

# 方式二：使用解释器执行
bash script.sh                          # 用 bash 执行
sh script.sh                            # 用 sh 执行

# 方式三：使用 source 执行（在当前 Shell 中）
source script.sh                        # 在当前 Shell 中执行
. script.sh                             # 同上，简写形式

# ✅ 推荐：使用 chmod +x 赋予权限后执行
chmod +x script.sh
./script.sh

# ❌ 错误：直接执行没有权限的脚本
./script.sh                             # 报错：Permission denied
```

### 变量定义和使用

```bash
#!/bin/bash

# 定义变量（不需要声明类型）
name="张三"                             # 字符串变量
age=25                                  # 整数变量
height=1.75                             # 浮点数变量

# 使用变量（使用 $ 或 ${}）
echo "姓名：$name"                      # 输出：姓名：张三
echo "年龄：${age}"                     # 输出：年龄：25
echo "身高：$height"                    # 输出：身高：1.75

# ✅ 正确：等号两边不能有空格
name="张三"                             # 正确

# ❌ 错误：等号两边有空格
name = "张三"                           # 错误！Shell 会把 name 当成命令
```

### 变量类型

```bash
#!/bin/bash

# === 局部变量 ===
local_var="局部变量"                    # 只在当前 Shell 中有效
echo "$local_var"

# === 环境变量 ===
export MY_VAR="环境变量"                # 对所有子进程有效
echo "$MY_VAR"
env                                   # 查看所有环境变量
printenv                              # 查看所有环境变量

# === 位置参数变量 ===
# 脚本执行：./script.sh arg1 arg2 arg3
echo "第 1 个参数：$1"                  # 第一个参数
echo "第 2 个参数：$2"                  # 第二个参数
echo "第 3 个参数：$3"                  # 第三个参数
echo "所有参数：$*"                     # 所有参数
echo "参数个数：$#"                     # 参数个数
echo "脚本名称：$0"                     # 脚本名称

# === 特殊变量 ===
echo "当前进程 ID：$$"                  # 当前进程 ID
echo "上一个命令退出状态：$?"           # 上一个命令的退出状态（0 表示成功）
echo "后台最后一个进程 ID：$!"          # 后台最后一个进程的 ID
```

### 字符串操作

```bash
#!/bin/bash

str="Hello, World!"

# 字符串长度
echo "长度：${#str}"                    # 输出：13

# 子字符串（从索引 7 开始，取 5 个字符）
echo "子串：${str:7:5}"                 # 输出：World

# 字符串替换
echo "替换：${str/World/Bash}"          # 输出：Hello, Bash!

# 字符串删除
file="document.tar.gz"
echo "删除后缀：${file%.*}"             # 输出：document.tar（删除最短匹配）
echo "删除后缀：${file%%.*}"            # 输出：document（删除最长匹配）
echo "删除前缀：${file#*.}"             # 输出：tar.gz（删除前缀）
echo "删除前缀：${file##*.}"            # 输出：gz（删除最长前缀）
```

### 数组

```bash
#!/bin/bash

# 定义数组
fruits=("apple" "banana" "orange" "grape")

# 访问单个元素
echo "第一个水果：${fruits[0]}"          # 输出：apple
echo "第二个水果：${fruits[1]}"          # 输出：banana

# 访问所有元素
echo "所有水果：${fruits[*]}"            # 输出所有元素
echo "所有水果：${fruits[@]}"            # 输出所有元素

# 数组长度
echo "数组长度：${#fruits[@]}"           # 输出：4

# 遍历数组
for fruit in "${fruits[@]}"; do          # 遍历每个元素
    echo "水果：$fruit"                  # 输出每个水果
done
```

### 条件语句

```bash
#!/bin/bash

# === if 语句基本格式 ===
if [ 条件 ]; then                        # 如果条件为真
    命令                                 # 执行这些命令
fi

# === if-else 语句 ===
if [ 条件 ]; then                        # 如果条件为真
    命令
else                                     # 否则
    命令
fi

# === if-elif-else 语句 ===
if [ 条件1 ]; then                       # 如果条件1为真
    命令
elif [ 条件2 ]; then                     # 如果条件2为真
    命令
else                                     # 否则
    命令
fi

# === 数值比较 ===
a=10
b=20

if [ "$a" -eq "$b" ]; then              # -eq：等于
    echo "a 等于 b"
elif [ "$a" -gt "$b" ]; then            # -gt：大于
    echo "a 大于 b"
else
    echo "a 小于 b"
fi

# === 字符串比较 ===
str1="hello"
str2="world"

if [ "$str1" = "$str2" ]; then          # =：等于
    echo "字符串相等"
elif [ -z "$str1" ]; then               # -z：字符串为空
    echo "str1 为空"
else
    echo "字符串不相等"
fi

# === 文件测试 ===
file="test.txt"

if [ -e "$file" ]; then                 # -e：文件存在
    echo "文件存在"
    
    if [ -f "$file" ]; then             # -f：是普通文件
        echo "是普通文件"
    fi
    
    if [ -d "$file" ]; then             # -d：是目录
        echo "是目录"
    fi
    
    if [ -r "$file" ]; then             # -r：文件可读
        echo "文件可读"
    fi
else
    echo "文件不存在"
fi

# ✅ 正确：方括号两边加空格，变量加引号
if [ "$a" -eq "$b" ]; then

# ❌ 错误：方括号两边不加空格，变量不加引号
if [$a -eq $b]; then
```

### case 语句

```bash
#!/bin/bash

echo "请输入一个数字（1-3）："
read num                                 # 读取用户输入

case "$num" in                           # 根据 num 的值匹配
    1)                                   # 如果是 1
        echo "你输入了 1"
        ;;                               # 结束这个分支
    2)                                   # 如果是 2
        echo "你输入了 2"
        ;;
    3)                                   # 如果是 3
        echo "你输入了 3"
        ;;
    *)                                   # 其他情况（默认）
        echo "输入无效"
        ;;
esac                                     # 结束 case

# === 匹配模式 ===
echo "请输入文件名："
read filename

case "$filename" in
    *.txt)                               # 匹配 .txt 结尾
        echo "这是文本文件"
        ;;
    *.jpg|*.png|*.gif)                   # 匹配图片格式
        echo "这是图片文件"
        ;;
    *.mp3|*.wav)                         # 匹配音频格式
        echo "这是音频文件"
        ;;
    *)                                   # 其他情况
        echo "未知文件类型"
        ;;
esac
```

### 循环语句

```bash
#!/bin/bash

# === for 循环（列表）===
for fruit in apple banana orange grape; do    # 遍历列表
    echo "水果：$fruit"                       # 输出每个水果
done

# === for 循环（C 风格）===
for ((i=1; i<=10; i++)); do                 # 循环 10 次
    echo "数字：$i"
done

# === 计算 1 到 100 的和 ===
sum=0
for ((i=1; i<=100; i++)); do
    sum=$((sum + i))                        # 累加
done
echo "1 到 100 的和：$sum"

# === while 循环 ===
count=1
while [ "$count" -le 10 ]; do               # 当 count 小于等于 10 时循环
    echo "计数：$count"
    count=$((count + 1))                    # count 加 1
done

# === until 循环（条件为假时执行）===
count=1
until [ "$count" -gt 10 ]; do               # 当 count 大于 10 时停止
    echo "计数：$count"
    count=$((count + 1))
done

# === 循环控制 ===
for i in {1..10}; do
    if [ "$i" -eq 5 ]; then
        break                               # 跳出循环
    fi
    echo "$i"
done
# 输出：1 2 3 4

for i in {1..10}; do
    if [ "$i" -eq 5 ]; then
        continue                            # 跳过当前迭代
    fi
    echo "$i"
done
# 输出：1 2 3 4 6 7 8 9 10
```

### 函数

```bash
#!/bin/bash

# === 函数定义 ===
function greet {                            # 方式一：使用 function 关键字
    echo "Hello, $1!"                       # $1 是第一个参数
}

greet2() {                                  # 方式二：使用函数名加括号
    echo "Hi, $1!"
}

# 调用函数
greet "张三"                                # 输出：Hello, 张三!
greet2 "李四"                               # 输出：Hi, 李四!

# === 函数参数 ===
add() {
    local result=$(($1 + $2))               # 计算两个参数的和
    echo "$result"                          # 输出结果
}

sum=$(add 10 20)                            # 调用函数并获取返回值
echo "和：$sum"                             # 输出：30

# === 函数返回值 ===
# 方式一：使用 echo 返回字符串
get_greeting() {
    echo "Hello, $1!"
}

greeting=$(get_greeting "张三")             # 用命令替换获取返回值
echo "$greeting"

# 方式二：使用 return 返回整数（0-255）
check_file() {
    if [ -f "$1" ]; then
        return 0                            # 成功返回 0
    else
        return 1                            # 失败返回 1
    fi
}

check_file "test.txt"
if [ $? -eq 0 ]; then                      # $? 是上一个命令的退出状态
    echo "文件存在"
else
    echo "文件不存在"
fi

# === 局部变量 ===
global_var="全局变量"

test_scope() {
    local local_var="局部变量"              # local 关键字声明局部变量
    echo "函数内：$global_var"              # 可以访问全局变量
    echo "函数内：$local_var"               # 可以访问局部变量
}

test_scope

echo "函数外：$global_var"                  # 可以访问
# echo "函数外：$local_var"                 # 错误：变量未定义

# ✅ 正确：函数内使用 local 声明局部变量
test_scope() {
    local temp=10
}

# ❌ 错误：函数内不使用 local（会污染全局命名空间）
test_scope() {
    temp=10                                 # 这是全局变量
}
```

### 输入输出

```bash
#!/bin/bash

# === 读取输入 ===
echo "请输入你的名字："
read name                                 # 读取用户输入
echo "你好，$name！"

# 读取多个变量
echo "请输入姓名和年龄（用空格分隔）："
read name age                             # 按空格分隔
echo "姓名：$name，年龄：$age"

# 带提示读取
read -p "请输入密码：" -s password         # -s：隐藏输入
echo
echo "密码已输入"

# 限时读取
echo "请在 5 秒内输入："
if read -t 5 input; then                  # -t 5：超时 5 秒
    echo "你输入了：$input"
else
    echo "输入超时"
fi

# === 输出格式化 ===
name="张三"
age=25
height=1.75

printf "姓名：%s\n" "$name"               # %s：字符串
printf "年龄：%d\n" "$age"                # %d：整数
printf "身高：%.2f\n" "$height"           # %.2f：浮点数，保留 2 位小数

# 对齐输出
printf "%-10s %5d %8.2f\n" "张三" 25 1.75  # 左对齐，宽度 10
printf "%-10s %5d %8.2f\n" "李四" 30 1.80

# 颜色输出
echo -e "\033[31m红色文本\033[0m"          # 红色
echo -e "\033[32m绿色文本\033[0m"          # 绿色
echo -e "\033[33m黄色文本\033[0m"          # 黄色
echo -e "\033[34m蓝色文本\033[0m"          # 蓝色
```

### 实战脚本示例

```bash
#!/bin/bash

# === 示例一：系统信息收集脚本 ===

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

echo
echo "===================="
echo "    报告结束"
echo "===================="


# === 示例二：文件备份脚本 ===

# 配置
SOURCE_DIR="/home/user/documents"          # 源目录
BACKUP_DIR="/backup"                       # 备份目录
DATE=$(date +%Y%m%d_%H%M%S)               # 当前时间戳
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.tar.gz"  # 备份文件名

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
tar -czf "$BACKUP_FILE" -C "$SOURCE_DIR" .  # 打包压缩

if [ $? -eq 0 ]; then                      # 检查上一条命令是否成功
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

---

## 11.4 对比表格

### 循环语句对比

| 循环类型 | 语法 | 适用场景 | 特点 |
| --- | --- | --- | --- |
| for（列表） | for item in list | 遍历已知列表 | 简单直观 |
| for（C风格） | for ((i=0; i<N; i++)) | 需要计数器 | 类似 C 语言 |
| while | while [ condition ] | 条件满足时执行 | 先判断后执行 |
| until | until [ condition ] | 条件满足时停止 | 条件为假时循环 |

### 条件判断对比

| 判断类型 | 运算符 | 示例 | 说明 |
| --- | --- | --- | --- |
| 数值比较 | -eq, -ne, -gt, -lt, -ge, -le | [ "$a" -eq "$b" ] | 只能用于整数 |
| 字符串比较 | =, !=, -z, -n | [ "$s" = "hello" ] | 注意用引号包裹变量 |
| 文件测试 | -e, -f, -d, -r, -w, -x | [ -f "file.txt" ] | 检查文件属性 |
| 逻辑运算 | -a, -o, ! 或 &&, \|\| | [ "$a" -gt 0 -a "$b" -lt 10 ] | -a 是与，-o 是或 |

### 变量类型对比

| 变量类型 | 定义方式 | 作用域 | 示例 |
| --- | --- | --- | --- |
| 局部变量 | name="value" | 当前 Shell | name="张三" |
| 环境变量 | export VAR="value" | 所有子进程 | export PATH="/usr/bin" |
| 位置参数 | 命令行传入 | 当前脚本 | $1, $2, $* |
| 特殊变量 | 系统定义 | 当前 Shell | $$, $?, $! |
| 局部变量（函数内） | local var="value" | 函数内部 | local temp=10 |

---

## 11.5 新手常见误区

### 误区 1："变量赋值时等号两边加空格"

**错误做法**：
```bash
name = "张三"    # 错误！Shell 会把 name 当成命令
```

**正确做法**：
```bash
name="张三"      # 正确，等号两边不能有空格
```

**为什么错**：在 Shell 中，空格是命令和参数的分隔符。`name = "张三"` 会被解释为"执行 name 命令，参数是 = 和张三"，而不是赋值。这是新手最常犯的错误。

### 误区 2："if 语句中方括号不加空格"

**错误做法**：
```bash
if [$a -eq $b]; then    # 错误！缺少空格
```

**正确做法**：
```bash
if [ "$a" -eq "$b" ]; then    # 正确，方括号两边要加空格
```

**为什么错**：`[` 实际上是一个命令（等同于 `test`），它需要和参数之间用空格分隔。不加空格的话，Shell 会把 `[$a` 当成一个整体，找不到这个命令。

### 误区 3："变量引用不加引号"

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

### 误区 4："混淆 source 执行和直接执行的区别"

**错误理解**：`bash script.sh` 和 `source script.sh` 是一样的。

**正确理解**：
```bash
# 直接执行：在子 Shell 中运行，脚本中的变量不会影响当前 Shell
bash script.sh

# source 执行：在当前 Shell 中运行，脚本中的变量会影响当前 Shell
source script.sh
```

**区别**：直接执行时，脚本在一个新的子进程中运行，脚本里设置的变量、函数在脚本结束后就消失了。source 执行时，脚本在当前进程中运行，变量和函数会保留在当前环境中。

### 误区 5："函数返回值用 return 返回字符串"

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

---

## 11.6 动手练习

### 练习 1（基础）：编写判断脚本

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

### 练习 2（进阶）：编写统计脚本

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

### 练习 3（挑战）：编写自动备份脚本

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

---

## 下一章预告

下一章我们会学习 Linux 的 **服务管理与 Systemd**。你会了解到什么是守护进程、如何使用 systemctl 管理服务的启动/停止/重启、如何查看服务状态和日志，以及如何创建自定义的 systemd 服务。这些知识对于管理 Linux 服务器上的各种服务至关重要，学完之后你就能轻松掌控系统上的所有服务了。
