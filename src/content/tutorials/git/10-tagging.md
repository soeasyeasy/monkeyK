---
title: "第十章：标签管理"
description: "使用标签标记版本发布点"
---

# 第十章：标签管理

## 什么是标签

标签是指向特定提交的引用，通常用于标记版本发布点（如 v1.0.0、v2.0.0）。

与分支不同，标签不能移动，一旦创建就固定在某个提交上。

## 查看标签

```bash
# 列出所有标签
git tag

# 按模式搜索标签
git tag -l "v1.*"
git tag -l "*beta*"
```

## 创建标签

### 轻量标签

只是一个指针，没有额外信息。

```bash
# 创建轻量标签
git tag v1.0.0

# 给历史提交打标签
git tag v0.9.0 a1b2c3d
```

### 附注标签（推荐）

包含标签名、注释、创建者信息，存储在 Git 数据库中。

```bash
# 创建附注标签
git tag -a v1.0.0 -m "Release version 1.0.0"

# 给历史提交打附注标签
git tag -a v0.9.0 -m "Beta release" a1b2c3d
```

## 查看标签详情

```bash
# 查看附注标签信息
git show v1.0.0

# 输出示例：
# tag v1.0.0
# Tagger: Your Name <your@email.com>
# Date:   Mon Jan 1 12:00:00 2024 +0800
#
# Release version 1.0.0
#
# commit a1b2c3d...
```

## 推送标签

标签不会自动随 `git push` 推送，需要显式推送。

```bash
# 推送单个标签
git push origin v1.0.0

# 推送所有标签
git push origin --tags
```

## 删除标签

```bash
# 删除本地标签
git tag -d v1.0.0

# 删除远程标签
git push origin --delete v1.0.0
git push origin :refs/tags/v1.0.0
```

## 检出标签

标签指向特定的提交，可以检出查看当时的代码。

```bash
# 检出标签（进入 detached HEAD 状态）
git checkout v1.0.0

# 或者基于标签创建新分支
git checkout -b hotfix v1.0.0
```

::: warning
检出标签后会进入 "detached HEAD" 状态，此时的提交不会关联到任何分支。如果需要修改，应该创建新分支。
:::

## 标签命名规范

推荐使用语义化版本号：

```
v1.0.0        # 主版本.次版本.补丁版本
v1.2.3-beta   # 预发布版本
v2.0.0-rc.1   # 候选发布版本
```

## 本章小结

- 标签用于标记版本发布点
- 推荐使用附注标签（`-a` 和 `-m`）
- 标签需要显式推送（`git push --tags`）
- 标签是只读的，不能移动
