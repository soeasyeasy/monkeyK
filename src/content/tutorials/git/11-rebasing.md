---
title: "第十一章：变基与重写历史"
description: "使用 rebase 改变提交历史，使用 amend 修改最近提交"
---

# 第十一章：变基与重写历史

## 本章导读

在开始学习之前，先想想这几个问题：

1. 为什么我的 Git 历史记录看起来乱糟糟的，像一团乱麻？
2. 听说 rebase 可以让提交历史变干净，但它和 merge 到底有什么区别？
3. 提交信息写错了，或者漏了文件，能不能改？会不会影响别人？
4. 为什么说 rebase 很危险？到底什么情况下不能用？

如果你对这些疑问感到困惑，别担心，这一章就是专门来解决这些问题的。

## 11.1 为什么需要变基

### 痛点分析

想象一下这个场景：你和同事小王同时在开发项目。你在 `feature/login` 分支上写登录功能，小王在 `feature/cart` 分支上写购物车功能。

你开发的时候，main 分支又新增了好几个提交（小王合并了他的代码、修复了几个 bug）。等你开发完准备合并时，发现你的分支和 main 分支已经"分叉"了：

```
main:    A ── B ── E ── F ── G（小王的提交）
                \
feature/login:   C ── D（你的提交）
```

如果用普通的 merge 合并，会生成一个"合并提交"，历史记录会变成一个"Y"字形。如果经常这样干，你的提交历史就会变成一团蜘蛛网，想找一个具体的改动都费劲。

### 生活化类比

变基就像是"搬家后重新排队"。

假设你在排队买奶茶（你的分支），但你排队的时候，前面又来了几个人（main 分支的新提交）。变基就是让你先离开队伍，等那几个人排好之后，你再重新排到队伍最后面。这样从外面看，队伍始终是笔直的一条线，没有人插队，也没有分叉。

## 11.2 核心原理讲解

### 11.2.1 什么是变基（rebase）

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

注意：C' 和 D' 是"新的提交"，它们的内容和 C、D 一样，但提交的"父节点"变了。也就是说，rebase 实际上是"删除旧提交，创建新提交"。

### 11.2.2 git rebase 基本用法

```bash
# 第一步：切换到你的功能分支
git checkout feature/login

# 第二步：将 feature/login 的提交"重新播放"到 main 分支的最新位置
git rebase main
```

执行后，feature 分支的提交会被"移植"到 main 分支的最新提交之后。

### 11.2.3 变基 vs 合并：底层区别

| 特性 | rebase | merge |
| --- | --- | --- |
| 历史记录 | 线性、清晰 | 保留分支结构 |
| 提交数量 | 不变 | 新增合并提交 |
| 安全性 | 改变历史（需谨慎） | 保留历史（安全） |
| 是否生成新提交 | 生成新的提交（SHA 值变了） | 生成一个合并提交 |
| 适用场景 | 个人分支、本地整理 | 公共分支、团队协作 |
| 冲突处理 | 每个提交单独处理冲突 | 一次性处理所有冲突 |

### 11.2.4 交互式变基

交互式变基（interactive rebase）是 rebase 的"高级玩法"，可以修改、合并、重排提交。

```bash
# 对最近 3 次提交进行交互式变基
git rebase -i HEAD~3

# 对某个提交之后的所有提交进行变基
git rebase -i a1b2c3d
```

执行后会打开编辑器，显示类似内容：

```
pick a1b2c3d feat: 添加登录表单
pick e4f5g6h fix: 修复样式问题
pick i7j8k9l feat: 添加验证逻辑
```

可用的操作：

```
p, pick    保留提交（什么都不改）
r, reword  保留提交但修改提交信息
e, edit    暂停以修改提交（可以添加/删除文件）
s, squash  合并到前一个提交（保留提交信息让你编辑）
f, fixup   类似 squash 但丢弃当前提交信息
d, drop    删除提交（彻底不要这个提交）
```

### 11.2.5 修改最近提交（amend）

有时候你刚提交完，发现漏了文件，或者提交信息写错了，这时候不需要重新提交，用 `--amend` 就行。

```bash
# 修改提交信息（会打开编辑器）
git commit --amend

# 添加遗漏的文件，并修改最近提交
git add forgotten-file.txt
git commit --amend

# 添加遗漏的文件，但不修改提交信息
git commit --amend --no-edit
```

## 11.3 对比表格：什么时候用 rebase，什么时候用 merge

| 场景 | 推荐操作 | 原因 |
| --- | --- | --- |
| 本地整理自己的提交历史 | rebase | 让历史更清晰 |
| 合并功能分支到 main | merge | 保留完整的分支历史 |
| 拉取远程最新代码 | rebase（个人分支）或 merge（公共分支） | 个人分支用 rebase 保持线性，公共分支用 merge 保证安全 |
| 修改最近一次提交 | amend | 最简单的方式 |
| 合并多个小提交 | rebase -i + squash | 让历史更干净 |

## 11.4 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| git rebase | 将一个分支的提交"重新播放"到另一个分支之上 |
| git rebase -i | 交互式变基，可以修改、合并、重排提交 |
| git commit --amend | 修改最近一次提交（信息或文件） |
| 黄金法则 | 不要对已经推送到公共仓库的提交执行 rebase |
| 强制推送 | rebase 后如果已经 push 过，需要 `git push --force-with-lease` |
| pick | 保留提交 |
| reword | 修改提交信息 |
| squash | 合并到前一个提交 |
| drop | 删除提交 |

## 11.5 新手常见误区

### 误区一：对公共分支执行 rebase

这是最危险的错误！如果你对 main 分支或者别人正在使用的分支执行 rebase，会导致所有人的提交历史混乱，甚至丢失代码。

```bash
# 绝对不要这样做！
git checkout main
git rebase feature/login
```

记住：rebase 只用于整理自己的个人分支。

### 误区二：rebase 后直接 git push

rebase 会改变提交的 SHA 值，如果你已经 push 过这个分支，rebase 后再 push 会被拒绝。这时候需要用强制推送，但一定要用更安全的方式：

```bash
# 不推荐：简单粗暴，可能覆盖别人的提交
git push --force

# 推荐：先检查远程有没有别人的新提交，有就拒绝
git push --force-with-lease
```

### 误区三：amend 已经 push 的提交

`--amend` 本质上也是"重写历史"，如果这个提交已经 push 到远程，amend 后也需要强制推送，同样有风险。

### 误区四：rebase 可以解决所有历史问题

rebase 不是万能的。如果你的分支已经和别人的分支合并过了，再 rebase 可能会导致重复提交或者冲突。rebase 更适合"整理还没合并的提交"。

### 误区五：交互式 rebase 时随便删除提交

交互式 rebase 时，如果你把某个提交标记为 `drop`，这个提交就彻底消失了。如果你删除的是别人需要的提交，可能会导致代码丢失。一定要确认删除的提交确实不需要了。

## 11.6 动手练习

### 练习一（基础）：使用 amend 修改提交

**题目**：你刚提交了一个文件，但发现提交信息写错了，而且漏了一个文件。请完成以下操作：

1. 创建一个文件 `test.txt`，提交，信息为"添加测试文件"
2. 发现提交信息写错了，改成"feat: 添加测试文件"
3. 发现漏了 `test2.txt`，把它也加进去

<details>
<summary>点击查看答案</summary>

```bash
# 第一步：创建并提交第一个文件
echo "hello" > test.txt
git add test.txt
git commit -m "添加测试文件"

# 第二步：修改提交信息
git commit --amend -m "feat: 添加测试文件"

# 第三步：创建第二个文件并添加到提交中
echo "world" > test2.txt
git add test2.txt
git commit --amend --no-edit
```

</details>

### 练习二（进阶）：使用 rebase 整理提交历史

**题目**：你在 `feature/login` 分支上有 3 个提交，分别是"添加登录表单"、"修复样式"、"添加验证"。现在你想把这 3 个提交合并成 1 个提交，让历史更干净。

<details>
<summary>点击查看答案</summary>

```bash
# 第一步：切换到功能分支
git checkout feature/login

# 第二步：启动交互式 rebase，对最近 3 个提交操作
git rebase -i HEAD~3

# 第三步：在编辑器中，将后两个提交的 pick 改为 squash（或 s）
# 修改后应该像这样：
# pick a1b2c3d feat: 添加登录表单
# squash e4f5g6h fix: 修复样式
# squash i7j8k9l feat: 添加验证

# 第四步：保存退出后，会打开一个新的编辑器让你编辑合并后的提交信息
# 修改成一个统一的信息，比如：
# feat: 完成登录功能（包含表单、样式、验证）

# 第五步：保存退出，完成合并
```

</details>

### 练习三（挑战）：rebase 到最新的 main 分支

**题目**：你的 `feature/login` 分支是基于 main 分支的 A 提交创建的，但现在 main 分支已经更新到了 G 提交。请把你的 feature 分支 rebase 到最新的 main 分支上，并解决可能出现的冲突。

<details>
<summary>点击查看答案</summary>

```bash
# 第一步：确保 main 分支是最新的
git checkout main
git pull origin main

# 第二步：切换到你的功能分支
git checkout feature/login

# 第三步：执行 rebase
git rebase main

# 第四步：如果出现冲突，Git 会暂停并提示你解决冲突
# 打开冲突的文件，找到 <<<<<<< HEAD 和 >>>>>>> 标记
# 手动修改成你想要的代码，然后：
git add <冲突的文件>
git rebase --continue

# 第五步：如果想放弃 rebase，回到 rebase 之前的状态
git rebase --abort

# 第六步：rebase 完成后，如果需要推送到远程
git push --force-with-lease
```

</details>

## 11.7 下一章预告

学会了如何整理提交历史，接下来我们要学习的是"如何和团队协作"。第十二章会介绍几种常见的 Git 工作流，包括功能分支工作流、Git Flow、GitHub Flow 等。不同的工作流适合不同规模的团队，选对了工作流，团队协作会事半功倍。
