---
title: "第十一章：变基与重写历史"
description: "使用 rebase 改变提交历史，使用 amend 修改最近提交"
---

# 第十一章：变基与重写历史

## 什么是变基

变基（rebase）可以将一个分支的提交"重新播放"到另一个分支之上，使提交历史变成线性。

```
变基前：
main:    A ── B ── E
                \
feature:         C ── D

变基后：
main:    A ── B ── E
                        \
feature:                 C' ── D'
```

## git rebase 基本用法

```bash
# 在 feature 分支上执行
git checkout feature/login
git rebase main
```

执行后，feature 分支的提交会被"移植"到 main 分支的最新提交之后。

## 变基 vs 合并

| 特性 | rebase | merge |
| --- | --- | --- |
| 历史记录 | 线性、清晰 | 保留分支结构 |
| 提交数量 | 不变 | 新增合并提交 |
| 安全性 | 改变历史（需谨慎） | 保留历史（安全） |
| 适用场景 | 个人分支、本地整理 | 公共分支、团队协作 |

::: warning
**黄金法则**：不要对已经推送到公共仓库的提交执行 rebase。这会导致其他人的历史混乱。
:::

## 交互式变基

可以修改、合并、重排提交。

```bash
# 对最近 3 次提交进行交互式变基
git rebase -i HEAD~3

# 对某个提交之后的所有提交进行变基
git rebase -i a1b2c3d
```

会打开编辑器，显示类似内容：

```
pick a1b2c3d feat: 添加登录表单
pick e4f5g6h fix: 修复样式问题
pick i7j8k9l feat: 添加验证逻辑
```

可用的操作：

```
p, pick    保留提交
r, reword  保留提交但修改提交信息
e, edit    暂停以修改提交
s, squash  合并到前一个提交
f, fixup   类似 squash 但丢弃提交信息
d, drop    删除提交
```

## 修改最近提交

### 修改提交信息

```bash
git commit --amend
```

会打开编辑器，可以修改最近一次提交的信息。

### 添加遗漏的文件

```bash
# 添加遗漏的文件
git add forgotten-file.txt

# 修改最近提交（包含新文件）
git commit --amend
```

### 不修改提交信息

```bash
git commit --amend --no-edit
```

## 重写历史的风险

```bash
# 如果已经推送到远程，需要强制推送
git push --force

# 或者更安全的方式（先 fetch 再推送）
git push --force-with-lease
```

::: danger
强制推送会覆盖远程分支的历史。只在个人分支上使用，绝不要对 main 等公共分支强制推送。
:::

## 本章小结

- `git rebase` 可以整理提交历史为线性
- 交互式 rebase 可以修改、合并、重排提交
- `git commit --amend` 修改最近一次提交
- 不要对公共分支执行 rebase 和强制推送
