---
title: "第一章：Git 简介与安装"
description: "了解 Git 的核心概念，完成安装与基础配置"
---

# 第一章：Git 简介与安装

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Git 到底是什么？和 GitHub 有什么区别？
- 为什么每个开发者都要学 Git？
- 安装完 Git 之后要怎么配置？
- "工作区"、"暂存区"、"仓库"这些概念到底是什么意思？

这一章就是为了解答这些问题。我们会先搞清楚 **Git 是什么、为什么重要**，再动手完成安装和配置，最后理解 Git 的三个核心区域。

---

## 1.1 为什么需要 Git？

### 痛点分析

想象一下这样的场景：

你写了一个项目，改了一下午代码，突然发现改错了，想回到上午的版本——但是你之前手动复制了一份叫 `项目_备份.zip`，结果发现备份文件里也是错的。你只好凭记忆一行行改回去。

更糟糕的是，你和同事同时在改同一个文件，他把他的版本发给你，你把你的版本发给他，最后两个人花了一晚上手动合并代码。

这就是没有版本控制时的日常：**改错了回不去，多人协作乱成一团**。

### 解决方案

Git 就像一个**时间机器 + 协作管理器**：

- 每次修改都有记录，随时回到任意版本
- 多人可以同时工作，Git 帮你自动合并
- 你可以开一个"平行空间"（分支）做实验，不满意就丢弃

打个比方：

> Git 就像一个超级存档系统——打游戏时你会在关键节点存档，万一打输了可以读档重来。Git 做的就是代码的"存档"，而且比游戏存档更强大：你可以同时开多个存档线（分支），互不干扰。

### 前后对比

```
没有 Git：
项目/
├── 项目_最终版.zip
├── 项目_最终版2.zip
├── 项目_真的最终版.zip
└── 项目_打死不改版.zip

有 Git：
项目/
└── .git/    ← 所有历史记录都在这里，随时可以回到任意版本
```

> **一句话总结**：Git 让你告别"最终版_真的最终版_打死不改版"的噩梦。

---

## 1.2 Git 是什么

Git 是一个**分布式版本控制系统**，由 Linus Torvalds（Linux 之父）于 2005 年创建。它能记录文件的每一次修改，让你随时回到历史任意版本。

| 特性 | 说明 |
| --- | --- |
| 分布式 | 每个开发者本地都有完整仓库，断网也能工作 |
| 快照存储 | 以文件快照的方式保存历史，而非差异 |
| 分支高效 | 创建和切换分支几乎瞬间完成 |
| 数据完整 | 使用 SHA-1 哈希保证数据一致性 |

### Git vs GitHub

很多人分不清这两个概念：

| 概念 | 是什么 | 类比 |
| --- | --- | --- |
| Git | 版本控制工具（软件） | 像你电脑上的 Word |
| GitHub | 代码托管平台（网站） | 像 Google Docs（在线协作） |

Git 是本地工具，装在电脑上管理版本。GitHub 是基于 Git 的在线平台，用于团队协作和代码分享。类似的平台还有 GitLab、Gitee 等。

---

## 1.3 安装 Git

### Windows

从 [git-scm.com](https://git-scm.com/download/win) 下载安装包，运行安装程序即可。安装时建议勾选 **Git Bash** 和 **Git from the command line**。

### macOS

```bash
# 方式一：使用 Homebrew（推荐）
brew install git

# 方式二：使用 Xcode Command Line Tools
xcode-select --install
```

### Linux

```bash
# Debian / Ubuntu
sudo apt-get install git

# CentOS / Fedora
sudo yum install git
```

### 验证安装

```bash
# 查看 Git 版本，能输出版本号说明安装成功
git --version
# 输出类似：git version 2.43.0
```

---

## 1.4 基础配置

安装完成后，需要配置用户信息。这些信息会附加到每一次提交中，相当于告诉 Git "这次修改是谁做的"。

```bash
# 配置用户名（会显示在提交记录中）
git config --global user.name "你的名字"

# 配置邮箱（用于标识身份，建议和 GitHub 邮箱一致）
git config --global user.email "your@email.com"

# 配置默认编辑器（commit 时用来写提交信息的编辑器）
git config --global core.editor "code --wait"

# 查看当前所有配置
git config --list
```

`--global` 表示全局配置，对当前用户的所有仓库生效。如果需要在某个仓库使用不同的配置（比如公司仓库用公司邮箱），可以在该仓库目录下省略 `--global` 进行局部配置。

---

## 1.5 核心原理：三个区域

理解这三个区域是掌握 Git 的关键。

### 概念解释

Git 的工作流程围绕三个区域展开：

```
工作区（Working Directory）
    │
    │  git add
    ▼
暂存区（Staging Area）
    │
    │  git commit
    ▼
本地仓库（Repository）
```

打个比方：

> 把 Git 想象成一个**快递发货流程**：
>
> - **工作区** = 你的书桌。你在这里写东西、改东西，乱七八糟没关系。
> - **暂存区** = 快递打包箱。你把改好的东西放进箱子，准备发货。
> - **本地仓库** = 已发出的快递。一旦发出（提交），就有了永久记录。
>
> `git add` 就是把东西从书桌放进打包箱。
> `git commit` 就是把打包箱封好发出去。

### 各区域详解

| 区域 | 是什么 | 你能做什么 |
| --- | --- | --- |
| 工作区 | 你电脑里能看到的目录 | 编辑文件、创建文件、删除文件 |
| 暂存区 | 一个准备提交的缓冲区（`.git/index` 文件） | 通过 `git add` 放入修改，通过 `git commit` 提交 |
| 本地仓库 | Git 保存项目数据和历史的数据库（`.git` 目录） | 查看历史、回退版本、创建分支 |

### 为什么要分三个区域？

你可能会问：直接编辑完就提交不行吗？为什么要多一个"暂存区"？

假设你同时改了三个功能：登录页面、搜索功能、修复了一个 bug。你不想把它们混在一个提交里，而是想分开提交：

```bash
# 先暂存登录页面的修改
git add src/login.vue

# 提交登录功能
git commit -m "feat: 添加登录页面"

# 再暂存搜索功能
git add src/search.vue

# 提交搜索功能
git commit -m "feat: 添加搜索功能"
```

暂存区让你可以**精确控制每次提交包含哪些修改**，保持提交历史的清晰。

---

## 1.6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| Git | 分布式版本控制系统，记录文件每次修改 |
| GitHub | 基于 Git 的在线代码托管平台 |
| 工作区 | 你编辑文件的地方 |
| 暂存区 | 准备提交的缓冲区 |
| 本地仓库 | 保存所有版本历史的数据库 |
| `git config` | 配置用户信息 |

---

## 1.7 新手常见误区

### 误区 1："Git 和 GitHub 是一样的东西"

**错！** Git 是本地安装的版本控制工具，GitHub 是基于 Git 的在线平台。你完全可以只用 Git 不用 GitHub，本地就能管理版本。GitHub 只是让协作和分享更方便。

### 误区 2："安装完 Git 就能直接用了"

不是的。安装后必须先配置 `user.name` 和 `user.email`，否则 Git 不知道每次提交是谁做的，会拒绝让你提交。

正确做法：

```bash
git config --global user.name "你的名字"
git config --global user.email "your@email.com"
```

### 误区 3："`.git` 目录可以随便删"

**绝对不行！** `.git` 目录包含仓库的全部历史数据。删了它，所有版本记录都没了，项目就变成普通文件夹了。如果需要重新初始化，先备份 `.git` 目录。

### 误区 4："工作区的修改直接就在仓库里了"

不是的。工作区的修改要经过两步才能进入仓库：

```
工作区 → git add → 暂存区 → git commit → 仓库
```

漏掉任何一步，修改都不会被记录到版本历史中。

---

## 1.8 动手练习

### 练习 1：安装验证

安装 Git 后，验证安装是否成功，并配置你的用户名和邮箱。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 验证安装
git --version
# 应该输出版本号，如 git version 2.43.0

# 2. 配置用户信息
git config --global user.name "你的名字"
git config --global user.email "your@email.com"

# 3. 验证配置
git config --list
# 应该能看到 user.name 和 user.email 的输出
```

</details>

### 练习 2：理解三个区域

请根据下面的场景，判断文件处于哪个区域：

1. 你刚在 `index.js` 里写了一段新代码，还没执行任何 git 命令
2. 你执行了 `git add index.js`
3. 你执行了 `git commit -m "update"`

<details>
<summary>点击查看答案</summary>

```
1. 工作区 —— 文件已修改但还没放入暂存区
2. 暂存区 —— git add 把修改放入了暂存区，等待提交
3. 本地仓库 —— git commit 把暂存区的内容提交到了仓库
```

</details>

### 练习 3（挑战）：局部配置

你在公司项目和個人項目中使用不同的邮箱。公司项目邮箱是 `work@company.com`，个人邮箱是 `me@gmail.com`。如何配置？

<details>
<summary>点击查看答案</summary>

```bash
# 1. 设置全局配置（个人项目默认使用）
git config --global user.email "me@gmail.com"

# 2. 进入公司项目目录
cd /path/to/company-project

# 3. 设置局部配置（只对这个仓库生效）
git config user.email "work@company.com"

# 4. 验证：在公司项目目录下
git config user.email
# 输出：work@company.com

# 5. 在其他目录下
git config user.email
# 输出：me@gmail.com
```

局部配置不加 `--global`，优先级高于全局配置。

</details>

---

## 下一章预告

下一章我们会学习 **如何初始化一个 Git 仓库**——也就是 `git init` 和 `git clone` 两个命令。你会了解 `.git` 目录里面到底有什么，以及"从远程克隆"和"本地新建"有什么区别。
