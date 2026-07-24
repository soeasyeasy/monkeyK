---
title: "第三章：基本操作"
description: "掌握 git add、git status、git commit、git log 等核心命令"
---

# 第三章：基本操作

## git status — 查看状态

查看工作区和暂存区的文件状态。

```bash
git status
```

常见输出：

```
On branch main
Changes not staged for commit:
  modified:   src/index.js

Untracked files:
  src/new-file.js
```

| 状态 | 含义 |
| --- | --- |
| Untracked | 文件未被 Git 跟踪 |
| Modified | 文件已修改但未暂存 |
| Staged | 修改已暂存，等待提交 |
| Up to date | 文件无变化 |

### 简洁模式

```bash
git status -s
# M  src/index.js       ← 已修改未暂存
# A  src/new-file.js    ← 已暂存的新文件
# ?? src/unknown.js     ← 未跟踪文件
```

## git add — 暂存文件

将文件修改添加到暂存区。

```bash
# 暂存指定文件
git add src/index.js

# 暂存多个文件
git add file1.js file2.js file3.js

# 暂存所有修改（包括新文件和修改）
git add .

# 暂存指定目录
git add src/

# 交互式暂存（逐个选择修改）
git add -p
```

::: tip
`git add .` 会暂存所有变更，包括可能不想提交的文件（如 `.env`）。建议先用 `git status` 确认，或使用 `git add -p` 逐块选择。
:::

## git commit — 提交

将暂存区的修改保存到仓库。

```bash
# 提交并写提交信息
git commit -m "feat: 添加用户登录功能"

# 提交所有已跟踪文件的修改（跳过 git add）
git commit -am "fix: 修复样式问题"

# 打开编辑器写多行提交信息
git commit
```

### 提交信息规范

推荐使用 **Conventional Commits** 规范：

```
feat: 新功能
fix: 修复 bug
docs: 文档变更
style: 代码格式（不影响功能）
refactor: 重构
test: 测试相关
chore: 构建/工具变更
```

## git log — 查看历史

```bash
# 完整日志
git log

# 简洁模式（单行显示）
git log --oneline

# 显示最近 N 条
git log -5

# 图形化显示分支
git log --oneline --graph --all

# 显示文件变更统计
git log --stat
```

输出示例：

```
a1b2c3d (HEAD -> main) feat: 添加搜索功能
e4f5g6h fix: 修复登录跳转
i7j8k9l docs: 更新 README
```

## git diff — 查看差异

```bash
# 工作区 vs 暂存区（未暂存的修改）
git diff

# 暂存区 vs 最新提交（已暂存的修改）
git diff --staged

# 两个提交之间的差异
git diff a1b2c3d e4f5g6h
```

## 典型工作流

```bash
# 1. 查看当前状态
git status

# 2. 编辑文件...

# 3. 查看修改内容
git diff

# 4. 暂存修改
git add src/index.js

# 5. 再次确认暂存内容
git status
git diff --staged

# 6. 提交
git commit -m "feat: 添加用户搜索"
```

## 本章小结

- `git status` 查看文件状态
- `git add` 将修改放入暂存区
- `git commit` 将暂存区提交到仓库
- `git log` 查看提交历史
- `git diff` 查看具体修改内容
