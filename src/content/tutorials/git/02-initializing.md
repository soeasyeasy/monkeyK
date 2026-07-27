---
title: "第二章：初始化仓库"
description: "学习 git init 和 git clone，理解仓库的创建方式"
---

# 第二章：初始化仓库

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 我已经有项目代码了，怎么把它变成 Git 仓库？
- 别人的项目怎么下载到我的电脑上？
- `git init` 和 `git clone` 有什么区别？
- `.git` 目录里面到底是什么东西？

这一章会解答这些问题。你会学会两种创建仓库的方式：**本地新建**和**远程克隆**，并了解 `.git` 目录的核心结构。

---

## 1 为什么需要"初始化仓库"？

### 痛点分析

上一章我们安装了 Git，但 Git 不会自动帮你管理项目。你必须明确告诉 Git："这个目录我要开始管了！"

这就像你买了一本新笔记本——本子本身不会自动记录内容，你得先翻开第一页，开始写东西。

### 解决方案

Git 提供两种方式"开始记录"：

| 方式 | 命令 | 适用场景 |
| --- | --- | --- |
| 本地新建 | `git init` | 你已经有代码，想让 Git 开始管理 |
| 远程克隆 | `git clone` | 别人的项目已经用 Git 管理，你想下载一份 |

打个比方：

> - `git init` 像**买空白笔记本**——你自己从头开始写。
> - `git clone` 像**复印别人的笔记本**——你拿到一份完整的副本，连历史记录都有。

---

## 2 方式一：git init

在已有目录中初始化一个全新的 Git 仓库。

```bash
# 进入项目目录
cd my-project

# 初始化 Git 仓库
git init
# 输出：Initialized empty Git repository in /path/to/my-project/.git/
```

执行后会在当前目录创建 `.git` 子目录，这是仓库的核心，包含了所有版本历史。

```
my-project/
├── .git/           # Git 仓库数据（隐藏目录）
├── src/
├── package.json
└── ...
```

### 初始化后的状态

```bash
git status
# On branch main
# No commits yet
# nothing to commit (create/copy files and use "git add" to track)
```

此时仓库是空的，还没有任何提交。你需要添加文件并做第一次提交：

```bash
# 添加所有文件到暂存区
git add .

# 做第一次提交
git commit -m "Initial commit"
```

### 原理：git init 做了什么？

`git init` 本质上只是在你的项目里创建了一个 `.git` 目录。这个目录就是 Git 的"大脑"，所有的版本历史、配置、分支信息都存在这里面。

如果你删除 `.git` 目录，项目就变回普通文件夹，所有 Git 记录都会丢失。

---

## 3 方式二：git clone

从远程仓库克隆一份到本地。

```bash
# 克隆 GitHub 仓库（会在当前目录创建 repo 文件夹）
git clone https://github.com/user/repo.git

# 克隆到指定目录名
git clone https://github.com/user/repo.git my-folder

# 使用 SSH 协议克隆（需要先配置 SSH key）
git clone git@github.com:user/repo.git
```

克隆操作会：
1. 下载仓库的完整历史
2. 创建 `.git` 目录
3. 检出最新版本的文件到工作区
4. 自动设置远程仓库地址（名为 `origin`）

### 原理：克隆后你得到了什么？

```
my-folder/
├── .git/           # 完整的仓库历史（和远程一模一样）
├── src/
├── README.md
└── ...
```

克隆后，你的本地仓库和远程仓库是**完全对等**的——你有完整的历史，可以离线工作，也可以推送修改回远程。

这就是"分布式"的含义：每个人手里都有一份完整的仓库副本。

---

## 4 .git 目录结构

`.git` 目录是 Git 的核心，了解它的结构有助于理解 Git 的工作原理。

```
.git/
├── HEAD            # 当前所在分支（内容如：ref: refs/heads/main）
├── config          # 仓库级配置（user、remote 等）
├── objects/        # 所有数据对象（提交、文件、目录）
│   ├── xx/         # 按 SHA-1 哈希前两位分组
│   │   └── ...     # 每个文件是一个压缩的数据对象
│   └── ...
├── refs/           # 分支和标签的引用（指向提交的指针）
│   ├── heads/      # 本地分支（如 refs/heads/main）
│   └── tags/       # 标签
├── index           # 暂存区信息（记录下次提交的内容）
└── hooks/          # Git 钩子脚本（第14章会讲）
```

打个比方：

> 把 `.git` 想象成一个**图书馆**：
>
> - `objects/` 是书库，存放所有版本的图书（文件快照）和图书目录（提交记录）
> - `refs/heads/` 是书架标签，每个标签（分支）指向某本书（提交）
> - `HEAD` 是你当前正在看的书架
> - `index` 是你准备借走的书的清单（暂存区）
> - `config` 是图书馆的规章制度

::: warning
不要手动修改 `.git` 目录中的文件，这可能导致仓库损坏。所有操作都应通过 Git 命令完成。
:::

---

## 5 设置默认分支名

Git 新版本默认分支名为 `main`。如果需要自定义：

```bash
# 设置全局默认分支名
git config --global init.defaultBranch main
```

### 为什么是 main 而不是 master？

| 名称 | 历史 | 现状 |
| --- | --- | --- |
| master | 传统默认名，有"主人"的含义 | 逐渐被弃用 |
| main | 2020 年后 GitHub 等平台推荐的默认名 | 当前主流 |

两者在技术上没有任何区别，只是命名习惯的变化。

---

## 6 重新初始化

如果在一个已有 Git 仓库的目录再次执行 `git init`，不会覆盖现有数据，只会补充缺失的模板文件。这是安全的操作。

```bash
# 第一次初始化
git init

# 再次执行，不会丢失数据
git init
# 输出：Reinitialized existing Git repository in /path/to/my-project/.git/
```

---

## 7 init vs clone 对比

| 特性 | git init | git clone |
| --- | --- | --- |
| 适用场景 | 本地已有代码，开始版本控制 | 下载远程已有的仓库 |
| 历史记录 | 空仓库，从零开始 | 包含完整历史 |
| 远程配置 | 无，需手动添加 | 自动配置 origin |
| 典型用法 | 新项目、已有项目接入 Git | 参与已有项目、下载开源项目 |

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| `git init` | 在本地创建新仓库 |
| `git clone` | 从远程复制仓库到本地 |
| `.git` 目录 | 包含仓库的全部数据 |
| `HEAD` | 指向当前所在分支 |
| `objects/` | 存储所有数据对象（提交、文件） |
| `refs/` | 分支和标签的引用 |
| `index` | 暂存区 |

---

## 9 新手常见误区

### 误区 1："git init 会把我现有代码删掉"

**不会！** `git init` 只是在当前目录创建 `.git` 子目录，你的文件完全不受影响。Git 只是开始"观察"这些文件，但不会动它们，直到你执行 `git add` 和 `git commit`。

### 误区 2："clone 下来的项目不能改"

不是的。克隆下来的项目和本地 init 的项目完全一样，你可以随意修改、提交、推送（如果有权限）。你拥有完整的仓库副本。

### 误区 3："`.git` 目录可以删了节省空间"

**绝对不行！** 删了 `.git`，所有版本历史、分支、提交记录全部丢失，项目变回普通文件夹。如果嫌 `.git` 太大，可以用 `git gc` 清理，但不能直接删除。

### 误区 4："clone 的时候必须指定分支"

不需要。`git clone` 默认会克隆所有分支的历史，但只检出默认分支（通常是 main 或 master）到工作区。其他分支可以通过 `git checkout` 或 `git switch` 切换。

---

## 10 动手练习

### 练习 1：本地初始化

你有一个现成的项目目录 `my-app`，里面有一些文件。请把它变成 Git 仓库，并做第一次提交。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 进入项目目录
cd my-app

# 2. 初始化 Git 仓库
git init

# 3. 查看状态（会看到所有文件都是 Untracked）
git status

# 4. 添加所有文件到暂存区
git add .

# 5. 做第一次提交
git commit -m "Initial commit"

# 6. 再次查看状态
git status
# 应该显示 "nothing to commit, working tree clean"
```

</details>

### 练习 2：克隆远程仓库

从 GitHub 克隆一个开源项目到本地，并查看它的分支。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 克隆仓库（以 vuejs/core 为例）
git clone https://github.com/vuejs/core.git

# 2. 进入项目目录
cd core

# 3. 查看本地分支（默认只有 main）
git branch

# 4. 查看所有分支（包括远程分支）
git branch -a
# 会看到 remotes/origin/xxx 等远程分支

# 5. 切换到某个远程分支
git switch main
```

</details>

### 练习 3（挑战）：理解 .git 目录

克隆一个仓库后，查看 `.git` 目录的内容，并解释以下文件/目录的作用：

1. `.git/HEAD`
2. `.git/config`
3. `.git/refs/heads/`
4. `.git/objects/`

<details>
<summary>点击查看答案</summary>

```bash
# 1. 查看 HEAD 文件（当前所在分支）
cat .git/HEAD
# 输出：ref: refs/heads/main（表示当前在 main 分支）

# 2. 查看 config（仓库配置）
cat .git/config
# 输出包含 user、remote "origin" 等配置

# 3. 查看 refs/heads/（本地分支引用）
ls .git/refs/heads/
# 输出：main（表示有一个 main 分支）

# 4. 查看 objects/（数据对象）
ls .git/objects/
# 输出：info/  pack/  以及若干两位十六进制目录
# 每个目录存放以 SHA-1 哈希命名的压缩对象
```

解释：
- `HEAD` 是一个指针，指向你当前所在的分支
- `config` 存储仓库级配置（如远程仓库地址）
- `refs/heads/` 存放本地分支的引用（每个文件指向一个提交）
- `objects/` 存储所有数据对象（提交、文件快照、目录树）

</details>

---

## 下一章预告

下一章我们会学习 **Git 的基本操作**——`git add`、`git status`、`git commit`、`git log`、`git diff`。这是你每天都会用到的命令，掌握了它们，你就能顺畅地管理代码版本了。
