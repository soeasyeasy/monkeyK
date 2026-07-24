---
title: "第二章：初始化仓库"
description: "学习 git init 和 git clone，理解仓库的创建方式"
---

# 第二章：初始化仓库

## 方式一：git init

在已有目录中初始化一个全新的 Git 仓库。

```bash
# 进入项目目录
cd my-project

# 初始化 Git 仓库
git init
```

执行后会在当前目录创建 `.git` 子目录，这是仓库的核心，包含了所有版本历史。

```
my-project/
├── .git/           # Git 仓库数据
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

此时仓库是空的，还没有任何提交。

## 方式二：git clone

从远程仓库克隆一份到本地。

```bash
# 克隆 GitHub 仓库
git clone https://github.com/user/repo.git

# 克隆到指定目录
git clone https://github.com/user/repo.git my-folder

# 使用 SSH 协议克隆
git clone git@github.com:user/repo.git
```

克隆操作会：
1. 下载仓库的完整历史
2. 创建 `.git` 目录
3. 检出最新版本的文件到工作区
4. 自动设置远程仓库地址（名为 `origin`）

## .git 目录结构

```
.git/
├── HEAD            # 当前所在分支
├── config          # 仓库级配置
├── objects/        # 所有数据对象（提交、文件、目录）
├── refs/           # 分支和标签的引用
├── index           # 暂存区信息
└── hooks/          # Git 钩子脚本
```

::: warning
不要手动修改 `.git` 目录中的文件，这可能导致仓库损坏。所有操作都应通过 Git 命令完成。
:::

## 设置默认分支名

Git 新版本默认分支名为 `main`。如果需要自定义：

```bash
# 设置全局默认分支名
git config --global init.defaultBranch main
```

## 重新初始化

如果在一个已有 Git 仓库的目录再次执行 `git init`，不会覆盖现有数据，只会补充缺失的模板文件。这是安全的操作。

## 本章小结

- `git init` 在本地创建新仓库
- `git clone` 从远程复制仓库到本地
- `.git` 目录包含仓库的全部数据
