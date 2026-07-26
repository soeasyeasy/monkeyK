---
title: '第七章：Vim 编辑器'
description: 'Vim 编辑器基础、模式切换与高效文本编辑'
---

# 第七章：Vim 编辑器

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Vim 是什么？为什么不用 nano 或者其他编辑器？
- Vim 的模式切换太复杂了，按了 ESC 之后该干嘛？
- 为什么程序员都说 Vim 效率高，但我连保存退出都不会？
- Vim 的配置看起来好复杂，.vimrc 里那些设置都是什么意思？

这一章就是为了解答这些问题。我们会先搞清楚 Vim 的核心概念和模式切换，再学会常用的编辑操作，最后了解如何配置 Vim 让它更好用。学完之后，你就能在 Linux 上高效地编辑文本文件了。

---

## 7.1 为什么需要 Vim？

### 痛点分析

想象一下这样的场景：

你登录到一台远程 Linux 服务器，想修改一个配置文件。服务器上没装图形界面，也没装 VS Code，只有一个黑乎乎的终端。你习惯性地想打开编辑器，却发现只能用命令行工具。

你试着用 `nano` 编辑，但发现功能太简单，没有语法高亮、没有多光标、没有快速跳转。你想用 `emacs`，但发现命令太复杂记不住。最后你只能用 `cat` 查看文件，用 `echo` 追加内容——效率低得令人发指。

这就是不会 Vim 时的日常：**在服务器上编辑文件像用算盘做微积分，累死还容易出错**。

### 解决方案

Vim 是 Linux 上最强大的文本编辑器，几乎所有 Linux 发行版都预装了它（或者它的简化版 vi）。Vim 的特点：

- 纯键盘操作，双手不用离开主键盘区
- 模式切换，不同模式下按键含义不同
- 强大的文本操作能力，可以快速移动、复制、删除、搜索替换
- 可高度定制，通过配置文件可以改变几乎所有行为

打个比方：

> Vim 就像一把瑞士军刀。刚开始你可能觉得它比普通的刀（nano）难用，但一旦你掌握了技巧，你会发现它能做几乎所有事情，而且效率极高。就像盲打键盘，刚开始很慢，但熟练之后比用鼠标点快得多。

### 前后对比

```
不会 Vim：
  登录服务器 → 想改配置 → 找不到编辑器 → 用 echo 追加 → 改错一行 → 整个文件毁了

会 Vim：
  登录服务器 → vim config.conf → 快速定位 → 精准修改 → 保存退出 → 搞定
```

> 一句话总结：Vim 是 Linux 运维和开发的必备技能，学会之后效率翻倍。

---

## 7.2 Vim 的核心概念：模式切换

### 为什么 Vim 要有模式？

Vim 的设计哲学是：**编辑文本和输入文本应该分开**。

在普通编辑器里，你按 `a` 就输入 `a`，想移动光标要用方向键。但在 Vim 里，命令模式下的 `a` 是"在光标后插入"，只有进入插入模式后 `a` 才是输入字符。

打个比方：

> Vim 的模式就像汽车挡位。停车挡（命令模式）用来控制车辆（移动光标、删除文本），前进挡（插入模式）用来开车（输入文本）。你不能一边踩油门一边换挡，同样也不应该一边输入文本一边执行命令。

### 三种基本模式

```
命令模式（Normal Mode）
    │
    │  i / a / o 等
    ▼
插入模式（Insert Mode）
    │
    │  ESC
    ▼
命令模式
    │
    │  : 
    ▼
底行模式（Command-line Mode）
```

| 模式 | 作用 | 如何进入 | 如何退出 |
| --- | --- | --- | --- |
| 命令模式 | 移动光标、删除、复制、粘贴 | 默认模式，或按 ESC | 按 i/a/o 等进入插入模式 |
| 插入模式 | 输入文本 | 按 i/a/o/I/A/O 等 | 按 ESC 回到命令模式 |
| 底行模式 | 保存、退出、搜索、替换 | 在命令模式下按 : | 按 Enter 执行命令，或按 ESC 取消 |

### 进入和退出 Vim

```bash
# 打开或创建文件
vim filename.txt
# 如果文件存在则打开，不存在则创建新文件

# 打开文件并跳到第 10 行
vim +10 filename.txt

# 打开文件并跳到文件末尾
vim + filename.txt

# 以只读模式打开文件
vim -R filename.txt
# 可以查看但不能修改

# 同时打开多个文件
vim file1.txt file2.txt
# 用 :n 切换到下一个文件，:N 切换到上一个文件
```

---

## 7.3 命令模式操作

命令模式是 Vim 的核心，大部分操作都在这里完成。

### 移动光标

```vim
" 基本移动
h          " 左移一个字符
j          " 下移一行
k          " 上移一行
l          " 右移一个字符

" 单词级别移动
w          " 跳到下一个单词开头（word）
b          " 跳到上一个单词开头（back）
e          " 跳到当前单词结尾（end）

" 行级别移动
0          " 跳到行首（数字零）
^          " 跳到行首第一个非空字符
$          " 跳到行尾

" 文件级别移动
gg         " 跳到文件开头
G          " 跳到文件末尾
:10        " 跳到第 10 行（底行模式）
10G        " 跳到第 10 行（命令模式）

" 屏幕级别移动
H          " 跳到屏幕顶部（High）
M          " 跳到屏幕中间（Middle）
L          " 跳到屏幕底部（Low）
Ctrl+f     " 向下翻一页（forward）
Ctrl+b     " 向上翻一页（backward）
```

> 打个比方：Vim 的移动就像下棋。h/j/k/l 是基本步法，w/b 是跳步，gg/G 是瞬移。熟练之后你可以快速定位到任何位置。

### 删除操作

```vim
x          " 删除光标所在字符
X          " 删除光标前一个字符
dd         " 删除当前行（整行剪切）
3dd        " 删除当前行及下面 2 行（共 3 行）
dw         " 删除从光标到下一个单词开头
d$         " 删除从光标到行尾
d0         " 删除从光标到行首
dG         " 删除从当前行到文件末尾
dg         " 删除从文件开头到当前行
u          " 撤销上一步操作（undo）
Ctrl+r     " 重做（redo），撤销的撤销
```

### 复制和粘贴

```vim
yy         " 复制当前行（yank）
3yy        " 复制当前行及下面 2 行
yw         " 复制从光标到下一个单词开头
y$         " 复制从光标到行尾
p          " 粘贴到光标后/下方（paste）
P          " 粘贴到光标前/上方
```

### 修改操作

```vim
i          " 在光标前插入（insert）
a          " 在光标后插入（append）
o          " 在当前行下方新开一行（open）
I          " 在行首插入
A          " 在行尾插入
O          " 在当前行上方新开一行
cw         " 修改从光标到下一个单词（change word）
c$         " 修改从光标到行尾
cc         " 修改当前行（相当于 dd 然后 i）
r          " 替换当前字符（replace）
R          " 进入替换模式，连续替换多个字符
```

### 搜索和替换

```vim
/keyword       " 向下搜索 keyword（按 n 跳到下一个，N 跳到上一个）
?keyword       " 向上搜索 keyword
*              " 搜索光标所在的单词（向下）
#              " 搜索光标所在的单词（向上）
:s/old/new/    " 替换当前行的第一个 old 为 new
:s/old/new/g   " 替换当前行的所有 old 为 new
:%s/old/new/g  " 替换整个文件的所有 old 为 new
:%s/old/new/gc " 替换整个文件，每次替换前确认（confirm）
```

> 打个比方：Vim 的搜索就像 Ctrl+F，但更强大。你可以用正则表达式，可以全局替换，可以边替换边确认。

---

## 7.4 底行模式操作

底行模式用于执行命令，如保存、退出、搜索替换等。

### 保存和退出

```vim
:w             " 保存文件（write）
:wq            " 保存并退出（write and quit）
:x             " 保存并退出（和 :wq 类似，但只在有修改时才保存）
:q             " 退出（quit），如果有修改未保存会提示
:q!            " 强制退出，不保存
:w!            " 强制保存（对只读文件）
:wq!           " 强制保存并退出
:saveas newfile.txt  " 另存为新文件
```

### 文件操作

```vim
:e filename    " 打开另一个文件（edit）
:sp filename   " 水平分屏打开文件（split）
:vsp filename  " 垂直分屏打开文件（vertical split）
Ctrl+w w       " 在分屏窗口间切换
Ctrl+w h/j/k/l " 向左/下/上/右切换窗口
:bn            " 切换到下一个缓冲区（buffer next）
:bp            " 切换到上一个缓冲区
:bd            " 关闭当前缓冲区
:ls            " 列出所有缓冲区
```

### 设置选项

```vim
:set nu        " 显示行号（number）
:set nonu      " 隐藏行号
:set hlsearch  " 高亮搜索结果
:set nohlsearch " 取消搜索高亮
:set ic        " 搜索忽略大小写（ignore case）
:set noc ic    " 搜索区分大小写
:set paste     " 进入粘贴模式（防止自动缩进）
:set nopaste   " 退出粘贴模式
```

---

## 7.5 Vim 配置：.vimrc

Vim 的配置文件是 `~/.vimrc`，可以在里面设置各种选项让 Vim 更好用。

### 基础配置

```bash
# 创建或编辑 .vimrc 文件
vim ~/.vimrc
```

在 `.vimrc` 中添加以下配置：

```vim
" 显示行号
set number

" 显示相对行号（方便用数字命令移动）
set relativenumber

" 启用语法高亮
syntax on

" 显示光标所在行/列
set ruler

" 自动缩进
set autoindent

" 使用空格代替 Tab
set expandtab

" 缩进宽度为 4 个空格
set shiftwidth=4
set tabstop=4

" 搜索时高亮匹配
set hlsearch

" 搜索时忽略大小写
set ignorecase

" 智能大小写（有大写字母时区分大小写）
set smartcase

" 显示命令输入
set showcmd

" 显示模式（INSERT/REPLACE/VISUAL）
set showmode

" 启用文件类型检测
filetype on

" 启用文件类型缩进
filetype indent on

" 启用文件类型插件
filetype plugin on

" 设置编码
set encoding=utf-8
set fileencoding=utf-8

" 自动加载修改后的文件
set autoread

" 鼠标支持
set mouse=a

" 使用系统剪贴板
set clipboard=unnamedplus
```

### 推荐插件

Vim 的强大之处在于插件生态。以下是一些常用插件：

```vim
" 使用 vim-plug 管理插件
" 安装 vim-plug：
" curl -fLo ~/.vim/autoload/plug.vim --create-dirs \
"   https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim

" 在 .vimrc 中配置插件
call plug#begin('~/.vim/plugged')

" 文件浏览器
Plug 'preservim/nerdtree'

" 状态栏美化
Plug 'vim-airline/vim-airline'

" 代码自动补全
Plug 'ervandew/supertab'

" 语法检查
Plug 'vim-syntastic/syntastic'

" 模糊文件查找
Plug 'ctrlpvim/ctrlp.vim'

call plug#end()

" 安装插件：在 Vim 中执行 :PlugInstall
```

---

## 7.6 对比表格

### Vim vs Nano vs Emacs

| 对比项 | Vim | Nano | Emacs |
| --- | --- | --- | --- |
| 学习曲线 | 陡峭 | 平缓 | 非常陡峭 |
| 模式切换 | 有（命令/插入/底行） | 无 | 无（但快捷键复杂） |
| 键盘操作 | 纯键盘，效率极高 | 需要鼠标配合 | 纯键盘，但快捷键复杂 |
| 功能强大程度 | 非常强大 | 基础 | 极其强大（几乎是操作系统） |
| 预装情况 | 大多数系统预装 | 大多数系统预装 | 需要手动安装 |
| 适用场景 | 日常编辑、编程 | 简单编辑 | 重度用户、Lisp 开发者 |
| 推荐度 | 强烈推荐 | 新手友好 | 进阶用户 |

### Vim 移动命令速查表

| 命令 | 作用 | 记忆技巧 |
| --- | --- | --- |
| h/j/k/l | 左/下/上/右 | 基本方向键 |
| w/b/e | 下一个单词/上一个单词/单词结尾 | word/back/end |
| 0/^/$ | 行首/行首非空/行尾 | 0是起点，$是终点 |
| gg/G | 文件开头/文件末尾 | go/go end |
| H/M/L | 屏幕顶部/中间/底部 | High/Middle/Low |
| Ctrl+f/b | 下翻一页/上翻一页 | forward/backward |

---

## 7.7 新手常见误区

### 误区 1："Vim 太难了，我还是用 nano 吧"

Vim 确实有学习曲线，但一旦掌握，效率远超 nano。nano 只适合临时改个配置，日常编辑还是 Vim 更强大。建议花一周时间专门练习 Vim，之后就会离不开它。

### 误区 2："记不住 Vim 的命令"

Vim 的命令是有逻辑的，不是死记硬背。比如 `d` 是删除，`w` 是单词，`dw` 就是删除单词。`c` 是修改，`cw` 就是修改单词。理解了命令的含义，就能举一反三。

### 误区 3："Vim 不需要配置"

默认的 Vim 功能很基础，必须配置才能发挥威力。至少应该开启行号、语法高亮、自动缩进。推荐找一个现成的 `.vimrc` 模板，根据自己的需求调整。

### 误区 4："在插入模式下用方向键移动光标"

在插入模式下频繁按方向键会破坏 Vim 的模态设计。正确做法是回到命令模式（按 ESC），用 h/j/k/l 或 w/b 移动，然后再进入插入模式。这样才能保持双手在主键盘区。

### 误区 5："Vim 不能做 IDE 的事"

Vim 配合插件可以变成强大的 IDE。你可以安装语法检查、代码补全、文件树、Git 集成、调试器等插件。很多人用 Vim 写代码，体验不输 VS Code，而且启动速度快、资源占用少。

---

## 7.8 动手练习

### 练习 1：基础练习

使用 Vim 创建一个文件 `hello.txt`，输入以下内容，然后保存退出：

```
Hello, Vim!
This is my first Vim file.
I love Linux.
```

<details>
<summary>点击查看答案</summary>

```bash
# 1. 打开 Vim 创建文件
vim hello.txt

# 2. 按 i 进入插入模式

# 3. 输入以下内容
Hello, Vim!
This is my first Vim file.
I love Linux.

# 4. 按 ESC 回到命令模式

# 5. 输入 :wq 保存并退出
:wq
```

完整操作流程：

```
vim hello.txt    → 打开文件
按 i             → 进入插入模式
输入文本         → 输入三行内容
按 ESC           → 回到命令模式
输入 :wq         → 保存并退出
```

</details>

### 练习 2：进阶练习

打开一个文件，使用 Vim 命令完成以下操作：
1. 跳到文件第 10 行
2. 复制第 10 行，粘贴到文件末尾
3. 搜索文件中所有的 "error"，替换为 "ERROR"
4. 显示行号

<details>
<summary>点击查看答案</summary>

```vim
" 1. 打开文件
vim filename.txt

" 2. 跳到第 10 行
:10
" 或者在命令模式下输入 10G

" 3. 复制第 10 行
yy
" 复制当前行

" 4. 跳到文件末尾
G

" 5. 粘贴
p
" 粘贴到当前行下方

" 6. 替换所有 error 为 ERROR
:%s/error/ERROR/g
" 全局替换，不区分大小写可以用 :%s/error/ERROR/gi

" 7. 显示行号
:set nu
" 或者 :set number

" 8. 保存
:w
```

</details>

### 练习 3（挑战）：综合练习

配置 Vim，使其满足以下要求：
- 显示行号和相对行号
- 启用语法高亮
- 搜索时高亮匹配且忽略大小写
- 使用 4 个空格代替 Tab
- 安装 NERDTree 插件

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建或编辑 .vimrc 文件
vim ~/.vimrc

# 2. 添加以下配置
```

```vim
" 显示行号
set number

" 显示相对行号
set relativenumber

" 启用语法高亮
syntax on

" 搜索高亮
set hlsearch

" 搜索忽略大小写
set ignorecase

" 智能大小写
set smartcase

" 使用空格代替 Tab
set expandtab

" 缩进宽度
set shiftwidth=4
set tabstop=4

" 自动缩进
set autoindent

" 显示模式
set showmode

" 显示命令
set showcmd

" 鼠标支持
set mouse=a

" 安装 vim-plug（如果没有）
" 在终端执行：
" curl -fLo ~/.vim/autoload/plug.vim --create-dirs \
"   https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim

" 配置插件
call plug#begin('~/.vim/plugged')

" NERDTree 文件浏览器
Plug 'preservim/nerdtree'

call plug#end()

" NERDTree 快捷键
map <C-n> :NERDTreeToggle<CR>
```

```bash
# 3. 保存 .vimrc 后，在 Vim 中安装插件
:PlugInstall

# 4. 使用 NERDTree
# 按 Ctrl+n 打开/关闭文件树
# 或者输入 :NERDTree
```

</details>

---

## 下一章预告

下一章我们会学习 **Linux 进程管理**，也就是如何查看、控制、终止系统中运行的程序。你会了解到：

- 什么是进程？进程和程序有什么区别？
- 如何查看系统中正在运行的所有进程？
- 如何终止一个卡死的程序？
- 如何让程序在后台运行？

学会进程管理，你就能掌控系统中运行的所有程序，不再被卡死的程序搞得手足无措。
