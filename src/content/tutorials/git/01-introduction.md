---
title: "第一章：Git 简介与安装"
description: "了解 Git 的核心概念，完成安装与基础配置"
---

# 第一章：Git 简介与安装

## 什么是 Git

Git 是一个**分布式版本控制系统**，由 Linus Torvalds 于 2005 年创建。它能记录文件的每一次修改，让你随时回到历史任意版本。

| 特性 | 说明 |
| --- | --- |
| 分布式 | 每个开发者本地都有完整仓库 |
| 快照存储 | 以文件快照的方式保存历史 |
| 分支高效 | 创建和切换分支几乎瞬间完成 |
| 数据完整 | 使用 SHA-1 哈希保证数据一致性 |

## 安装 Git

### Windows

从 [git-scm.com](https://git-scm.com/download/win) 下载安装包，运行安装程序即可。安装时建议勾选 **Git Bash** 和 **Git from the command line**。

### macOS

```bash
# 方式一：使用 Homebrew
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
git --version
# 输出类似：git version 2.43.0
```

## 基础配置

安装完成后，需要配置用户信息。这些信息会附加到每一次提交中。

```bash
# 配置用户名
git config --global user.name "你的名字"

# 配置邮箱
git config --global user.email "your@email.com"

# 配置默认编辑器
git config --global core.editor "code --wait"

# 查看当前配置
git config --list
```

::: tip
`--global` 表示全局配置，对当前用户的所有仓库生效。如果需要在某个仓库使用不同的配置，可以在该仓库目录下省略 `--global` 进行局部配置。
:::

## 核心概念

### 工作区（Working Directory）

就是你电脑里能看到的目录，也就是你实际编辑文件的地方。

### 暂存区（Staging Area）

一个准备提交的缓冲区。通过 `git add` 将修改放入暂存区，再通过 `git commit` 提交到仓库。

### 本地仓库（Repository）

Git 保存项目数据和历史的数据库，存储在 `.git` 目录中。

```
工作区  ──git add──>  暂存区  ──git commit──>  本地仓库
```

::: info
理解这三个区域是掌握 Git 的关键。后续章节会详细讲解每个区域的操作。
:::

## 本章小结

- Git 是分布式版本控制系统
- 安装后需要配置用户名和邮箱
- 三个核心区域：工作区、暂存区、本地仓库
