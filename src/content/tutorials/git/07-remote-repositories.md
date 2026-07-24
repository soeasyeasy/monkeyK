---
title: "第七章：远程仓库"
description: "掌握远程仓库的配置与同步操作"
---

# 第七章：远程仓库

## 查看远程仓库

```bash
# 查看远程仓库地址
git remote -v

# 输出示例：
# origin  https://github.com/user/repo.git (fetch)
# origin  https://github.com/user/repo.git (push)
```

## 添加远程仓库

```bash
# 添加远程仓库
git remote add origin https://github.com/user/repo.git

# 使用 SSH 协议
git remote add origin git@github.com:user/repo.git

# 添加多个远程仓库
git remote add upstream https://github.com/original/repo.git
```

## 修改远程仓库

```bash
# 修改远程仓库地址
git remote set-url origin https://github.com/user/new-repo.git

# 重命名远程仓库
git remote rename old-name new-name

# 删除远程仓库
git remote remove origin
```

## git fetch — 获取远程更新

从远程仓库下载最新的提交和引用，但不合并到本地。

```bash
# 获取所有远程分支更新
git fetch origin

# 获取指定分支
git fetch origin main

# 获取所有远程仓库
git fetch --all
```

::: tip
`git fetch` 是安全的操作，不会修改本地工作区。它只是更新远程跟踪分支（如 `origin/main`）。
:::

## git pull — 拉取并合并

从远程仓库获取更新并自动合并到当前分支。

```bash
# 拉取当前分支的远程更新
git pull

# 拉取指定远程分支
git pull origin main

# 使用 rebase 方式拉取（推荐，保持线性历史）
git pull --rebase
```

`git pull` 实际上等于：

```bash
git fetch
git merge origin/main
```

## git push — 推送本地提交

将本地提交推送到远程仓库。

```bash
# 推送当前分支到远程
git push

# 首次推送新分支
git push -u origin feature/login

# 推送指定分支
git push origin feature/login

# 推送所有分支
git push --all
```

::: warning
不要强制推送到公共分支（如 `main`），这会覆盖他人的提交。`git push --force` 只在个人分支上使用。
:::

## 远程跟踪分支

当你执行 `git fetch` 或 `git pull` 时，Git 会更新远程跟踪分支。

```bash
# 查看所有分支（包括远程跟踪分支）
git branch -a

# 输出示例：
# * main
#   feature/login
#   remotes/origin/HEAD -> origin/main
#   remotes/origin/main
#   remotes/origin/feature/login
```

远程跟踪分支（如 `origin/main`）是只读的，不能直接切换或修改。

## 设置上游分支

```bash
# 推送时设置上游分支
git push -u origin main

# 之后可以直接使用 git push
git push
```

## 删除远程分支

```bash
# 删除远程分支
git push origin --delete feature/login

# 或者
git push origin :feature/login
```

## 本章小结

- `git remote` 管理远程仓库
- `git fetch` 获取远程更新（不合并）
- `git pull` 获取并合并远程更新
- `git push` 推送本地提交到远程
- 远程跟踪分支（如 `origin/main`）是只读的
