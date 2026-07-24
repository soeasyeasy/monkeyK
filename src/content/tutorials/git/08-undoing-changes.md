---
title: "第八章：撤销与回退"
description: "学习撤销修改、回退提交、恢复文件的方法"
---

# 第八章：撤销与回退

## 撤销工作区修改

丢弃工作区的修改，恢复到最近一次提交或暂存的状态。

```bash
# 撤销单个文件的修改
git checkout -- file.txt

# 或者使用新命令（Git 2.23+）
git restore file.txt

# 撤销所有文件的修改
git checkout -- .
git restore .
```

::: warning
这会永久丢弃未暂存的修改，操作前请确认。
:::

## 取消暂存

将文件从暂存区移回工作区。

```bash
# 取消暂存单个文件
git reset HEAD file.txt

# 或者使用新命令
git restore --staged file.txt

# 取消所有暂存
git reset HEAD .
git restore --staged .
```

## git reset — 重置提交

移动当前分支的指针，改变提交历史。

```bash
# 软重置：移动 HEAD，保留暂存区和工作区
git reset --soft HEAD~1

# 混合重置（默认）：移动 HEAD 和暂存区，保留工作区
git reset --mixed HEAD~1
git reset HEAD~1

# 硬重置：移动 HEAD、暂存区和工作区（危险！）
git reset --hard HEAD~1
```

### 重置范围说明

```
提交历史：A ── B ── C ── D (HEAD)

git reset --soft HEAD~1：
提交历史：A ── B ── C (HEAD)
暂存区：保留 D 的修改
工作区：保留 D 的修改

git reset --mixed HEAD~1：
提交历史：A ── B ── C (HEAD)
暂存区：清空
工作区：保留 D 的修改

git reset --hard HEAD~1：
提交历史：A ── B ── C (HEAD)
暂存区：清空
工作区：清空（D 的修改永久丢失）
```

## git revert — 反转提交

创建一个新的提交来撤销指定提交的修改。

```bash
# 反转最近的提交
git revert HEAD

# 反转指定提交
git revert a1b2c3d

# 反转多个提交
git revert HEAD~3..HEAD
```

::: tip
`git revert` 是安全的操作，不会改变已有的提交历史，而是创建新的提交。适合在公共分支上使用。
:::

## 对比 reset 和 revert

| 特性 | reset | revert |
| --- | --- | --- |
| 修改历史 | 改变提交历史 | 保留历史，新增提交 |
| 安全性 | 危险（可能丢失数据） | 安全 |
| 适用场景 | 本地分支、未推送的提交 | 公共分支、已推送的提交 |

## 恢复删除的文件

```bash
# 从最近提交恢复
git checkout HEAD -- file.txt
git restore --source=HEAD file.txt

# 从指定提交恢复
git checkout a1b2c3d -- file.txt
```

## 本章小结

- `git restore` 撤销工作区修改
- `git restore --staged` 取消暂存
- `git reset` 回退提交（改变历史）
- `git revert` 反转提交（保留历史）
- 公共分支优先使用 `revert`
