---
title: "第九章：暂存与清理"
description: "使用 git stash 临时保存工作，使用 git clean 清理文件"
---

# 第九章：暂存与清理

## git stash — 暂存工作

当你需要切换分支或拉取代码，但当前工作还没完成时，可以使用 stash 临时保存。

```bash
# 保存当前工作（包括已跟踪文件的修改和暂存）
git stash

# 添加备注
git stash save "正在开发登录功能"

# 查看 stash 列表
git stash list
# 输出示例：
# stash@{0}: WIP on main: a1b2c3d feat: 添加搜索
# stash@{1}: On feature: 正在开发登录功能

# 恢复最近一次 stash
git stash pop

# 恢复指定 stash
git stash pop stash@{1}

# 恢复但不删除 stash
git stash apply
git stash apply stash@{1}

# 删除指定 stash
git stash drop stash@{0}

# 清空所有 stash
git stash clear
```

### stash 包含未跟踪文件

默认情况下，`git stash` 只保存已跟踪文件的修改。要包含未跟踪文件：

```bash
# 保存所有文件（包括未跟踪）
git stash -u
git stash --include-untracked
```

## 典型使用场景

```bash
# 1. 正在开发 feature 分支
# 2. 需要紧急修复 main 分支的 bug
# 3. 暂存当前工作
git stash

# 4. 切换到 main 分支修复
git checkout main
# ... 修复 bug ...
git commit -m "fix: 紧急修复"

# 5. 切回 feature 分支继续工作
git checkout feature/login
git stash pop
```

## git clean — 清理未跟踪文件

删除工作区中未跟踪的文件和目录。

```bash
# 查看会被删除的文件（干运行）
git clean -n

# 删除未跟踪的文件
git clean -f

# 删除未跟踪的文件和目录
git clean -fd

# 删除未跟踪的文件、目录和忽略的文件
git clean -fdx

# 交互式清理
git clean -i
```

::: warning
`git clean` 会永久删除文件，操作前先用 `-n` 查看会被删除的内容。
:::

## 组合使用

```bash
# 恢复到最近提交的状态（丢弃所有本地修改）
git reset --hard
git clean -fd
```

## 本章小结

- `git stash` 临时保存未完成的工作
- `git stash pop` 恢复并删除 stash
- `git stash apply` 恢复但保留 stash
- `git clean` 删除未跟踪的文件
- 清理前先用 `-n` 预览
