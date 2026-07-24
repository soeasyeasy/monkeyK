---
title: "第五章：分支管理"
description: "掌握分支创建、切换、删除等核心操作"
---

# 第五章：分支管理

## 什么是分支

分支是 Git 最强大的特性。本质上，分支只是一个指向某个提交的可移动指针。

```
main:     A ── B ── E ── F
                   \
feature:            C ── D
```

## 查看分支

```bash
# 查看本地分支
git branch

# 查看所有分支（包括远程分支）
git branch -a

# 查看已合并的分支
git branch --merged

# 查看未合并的分支
git branch --no-merged

# 查看分支详细信息（包含最后提交）
git branch -v
```

## 创建分支

```bash
# 创建分支（不切换）
git branch feature/login

# 创建并切换（推荐）
git checkout -b feature/login

# 或者使用新命令（Git 2.23+）
git switch -c feature/login
```

## 切换分支

```bash
# 切换到已有分支
git checkout feature/login

# 或者使用新命令
git switch feature/login

# 切换到上一个分支（类似 cd -）
git checkout -
git switch -
```

::: tip
切换分支时，Git 会自动更新工作区的文件。如果有未提交的修改导致冲突，Git 会阻止切换。
:::

## 删除分支

```bash
# 删除已合并的分支
git branch -d feature/login

# 强制删除未合并的分支
git branch -D feature/login

# 删除远程分支
git push origin --delete feature/login
```

## 分支命名规范

推荐的分支命名方式：

```
feature/user-login      # 新功能
fix/cart-total          # 修复 bug
hotfix/payment-error    # 紧急修复
refactor/api-layer      # 重构
docs/update-readme      # 文档更新
```

## 分支的本质

分支在 Git 中只是一个 41 字节的文件（40 字符 SHA-1 哈希 + 换行符）。这就是为什么创建和切换分支如此快速。

```bash
# 查看 main 分支指向的提交
cat .git/refs/heads/main
# 输出：a1b2c3d4e5f6...
```

## 本章小结

- `git branch` 查看和管理分支
- `git checkout -b` 或 `git switch -c` 创建并切换分支
- 分支只是指向提交的指针
- 删除分支用 `-d`（安全）或 `-D`（强制）
