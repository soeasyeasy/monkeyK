---
title: "第八章：撤销与回退"
description: "学习撤销修改、回退提交、恢复文件的方法"
---

# 第八章：撤销与回退

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 代码改错了还没提交，怎么撤销这些修改？
- 已经 `git add` 暂存了，怎么把文件从暂存区撤回来？
- 已经提交了，怎么回退到之前的版本？
- `git reset` 和 `git revert` 都能撤销提交，到底该用哪个？

这一章就是为了解答这些问题。我们会从最简单的"撤销工作区修改"开始，一步步讲到"回退已提交的内容"，帮你彻底搞清楚 Git 的撤销体系。

---

## 8.1 为什么需要撤销与回退？

### 痛点分析

想象一下这些场景：

1. 你改了半天代码，发现改错了方向，想回到修改前的状态
2. 你不小心 `git add` 了一个包含密码的配置文件
3. 你提交了一个功能，但发现这个功能有严重 bug，需要紧急撤销
4. 你在公共分支上提交了错误的代码，但其他人已经基于你的代码在开发了

如果没有撤销机制，你只能手动把代码一行行改回去——这简直是噩梦。

### 生活化类比

把 Git 的撤销操作想象成"写论文"：

- **撤销工作区修改** = 用橡皮擦掉刚写的错字（还没交稿，随便改）
- **取消暂存** = 把已经放进信封的稿子拿出来再改改（装好了但还没寄出）
- **git reset** = 把已经寄出的稿子强行收回来，假装没寄过（改变历史，但有风险）
- **git revert** = 再写一份"更正声明"附在后面（承认之前写错了，但不改原文）

> **一句话总结**：Git 提供了从"橡皮擦"到"更正声明"的一整套撤销方案，不同场景用不同的工具。

---

## 8.2 撤销工作区修改

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

### 原理解释

`git restore file.txt` 做的事情很简单：把暂存区（或最近提交）中 `file.txt` 的内容，覆盖回工作区。你在 `file.txt` 里做的那些修改，就这样被"洗掉"了。

打个比方：这就像你把文档恢复到了上次保存的版本，中间没保存的所有改动全部丢失。

---

## 8.3 取消暂存

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

### 原理解释

取消暂存只是把文件从"暂存区"移回"工作区"，文件内容本身不会变。你之前做的修改还在，只是 Git 不再把它当作"下次提交的一部分"了。

打个比方：你已经把作业放进了"已提交"的文件袋里，现在你把它从文件袋里拿出来，作业还在你手上，只是还没交上去。

---

## 8.4 git reset — 重置提交

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

### 三种模式的核心区别

用"退货"来类比这三种模式：

| 模式 | 类比 | HEAD 移动 | 暂存区 | 工作区 |
| --- | --- | --- | --- | --- |
| `--soft` | 退货但东西还在购物车 | 回退 | 保留修改 | 保留修改 |
| `--mixed` | 退货并把东西放回货架 | 回退 | 清空 | 保留修改 |
| `--hard` | 退货并直接扔掉 | 回退 | 清空 | 清空 |

**什么时候用哪种？**

- `--soft`：你提交后发现 commit message 写错了，想重新提交
- `--mixed`：你提交后发现还想再改改代码，不想直接提交
- `--hard`：你提交的内容完全是垃圾，想彻底重来（慎用！）

---

## 8.5 git revert — 反转提交

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

### 原理解释

`git revert` 不会删除原来的提交，而是分析那个提交做了什么修改，然后"反着来"，生成一个新的提交。

打个比方：你在作业本第 5 页写了一道题的答案，后来发现写错了。`revert` 的做法不是撕掉第 5 页，而是在第 6 页写上"第 5 页的答案作废，正确答案是..."。这样老师翻作业本的时候，能看到你完整的思考过程。

---

## 8.6 对比 reset 和 revert

| 特性 | reset | revert |
| --- | --- | --- |
| 修改历史 | 改变提交历史 | 保留历史，新增提交 |
| 安全性 | 危险（可能丢失数据） | 安全 |
| 适用场景 | 本地分支、未推送的提交 | 公共分支、已推送的提交 |
| 对 HEAD 的影响 | 向后移动 | 向前移动（新增提交） |
| 对已推送提交 | 不推荐（需要 force push） | 推荐（直接 push） |

### 选择建议

- 提交还没推送到远程？用 `reset`，干净利落
- 提交已经推送到远程，别人可能已经拉取了？用 `revert`，安全稳妥
- 实在拿不准？用 `revert` 总没错

---

## 8.7 完整对比：四种撤销方式

| 命令 | 作用范围 | 做什么 | 危险程度 | 使用场景 |
| --- | --- | --- | --- | --- |
| `git restore file.txt` | 工作区 | 丢弃未暂存的修改 | 低 | 改错代码想重来 |
| `git restore --staged file.txt` | 暂存区 | 取消暂存，修改保留在工作区 | 低 | 不小心 add 了文件 |
| `git reset --hard HEAD~1` | 提交+暂存+工作区 | 回退提交，丢弃所有修改 | 高 | 本地提交完全做错了 |
| `git revert HEAD` | 提交 | 创建新提交来撤销旧提交 | 低 | 撤销已推送的提交 |

---

## 8.8 恢复删除的文件

```bash
# 从最近提交恢复
git checkout HEAD -- file.txt
git restore --source=HEAD file.txt

# 从指定提交恢复
git checkout a1b2c3d -- file.txt
```

---

## 8.9 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 工作区撤销 | `git restore file.txt` 丢弃未暂存的修改 |
| 取消暂存 | `git restore --staged file.txt` 把文件从暂存区移出 |
| 软重置 | `git reset --soft` 只移动 HEAD，修改保留在暂存区 |
| 混合重置 | `git reset --mixed` 移动 HEAD 并清空暂存区（默认模式） |
| 硬重置 | `git reset --hard` 移动 HEAD 并清空暂存区和工作区 |
| 反转提交 | `git revert` 创建新提交来撤销旧提交，不改变历史 |
| 选择原则 | 本地用 reset，公共用 revert |

---

## 8.10 新手常见误区

### 误区 1："git reset --hard 之后还能找回来"

**大部分情况下找不回来了。** `--hard` 会彻底丢弃工作区的修改，这些修改没有进入 Git 的任何记录。虽然 Git 内部有 `reflog` 可以找回已提交但被 reset 的内容，但工作区未暂存的修改是真的没了。

正确做法：在执行 `--hard` 之前，先用 `git stash` 保存一下，或者确认你真的不需要这些修改。

### 误区 2："在 main 分支上随便 reset"

**大错特错！** 如果 main 分支的提交已经推送到远程，你用 `reset` 回退后再 `push`，需要 `--force` 强制推送，这会覆盖远程的历史，影响所有协作者。

正确做法：公共分支上永远用 `revert`，只有自己的本地分支才用 `reset`。

### 误区 3："git restore 和 git checkout 完全一样"

**不完全对。** `git restore` 是 Git 2.23 引入的新命令，专门用于撤销工作区修改。`git checkout` 功能更多（还能切换分支），但在撤销修改这个场景下，两者效果一样。推荐使用 `git restore`，因为语义更清晰，不容易误操作。

### 误区 4："revert 之后原来的提交就消失了"

**不会消失。** `revert` 不会删除原来的提交，它只是新增了一个"反向提交"。你用 `git log` 依然能看到原来的提交和 revert 的提交。这正是它安全的原因——历史完整保留。

### 误区 5："取消暂存会丢失代码修改"

**不会丢失。** `git restore --staged file.txt` 只是把文件从暂存区移回工作区，你做的修改还在文件里，只是不再属于"下次提交"了。

---

## 8.11 动手练习

### 练习 1：基础练习 — 撤销工作区修改

1. 在你的仓库中，修改 `readme.txt` 文件，随便加点内容
2. 用 `git status` 确认文件处于"已修改但未暂存"状态
3. 用一条命令撤销这个修改，让文件恢复到提交时的状态
4. 用 `git status` 确认修改已被撤销

<details>
<summary>点击查看答案</summary>

```bash
# 1. 修改文件
echo "随便写点东西" >> readme.txt

# 2. 查看状态，确认文件已修改
git status
# 输出应该显示：modified: readme.txt

# 3. 撤销修改
git restore readme.txt
# 或者用旧命令：git checkout -- readme.txt

# 4. 确认修改已撤销
git status
# 输出应该显示：working tree clean（没有其他修改的话）
```

</details>

### 练习 2：进阶练习 — 取消暂存与重新提交

1. 修改两个文件 `a.txt` 和 `b.txt`
2. 把两个文件都 `git add` 暂存
3. 发现 `b.txt` 的修改还不对，需要继续改，把它从暂存区撤回来
4. 只提交 `a.txt`
5. 继续修改 `b.txt`，完成后再提交

<details>
<summary>点击查看答案</summary>

```bash
# 1. 修改两个文件
echo "修改a" >> a.txt
echo "修改b" >> b.txt

# 2. 暂存两个文件
git add a.txt b.txt

# 3. 把 b.txt 从暂存区撤回来（修改还在工作区）
git restore --staged b.txt
# 或者：git reset HEAD b.txt

# 4. 只提交 a.txt
git commit -m "feat: 更新a文件"

# 5. 继续修改 b.txt
echo "继续修改b" >> b.txt

# 6. 完成后再提交
git add b.txt
git commit -m "feat: 更新b文件"
```

</details>

### 练习 3（挑战）：综合练习 — reset 与 revert 的抉择

你的仓库有以下提交历史：

```
A ── B ── C ── D (HEAD)
```

完成以下任务：

1. 用 `--soft` 回退到 C，保留 D 的修改在暂存区，然后重新提交 D（换个 commit message）
2. 重新提交后，用 `--mixed` 回退到 B，观察暂存区和工作区的状态
3. 重新提交 C、D 的内容，然后假设这些提交已经推送到远程，用 `revert` 安全地撤销最近一次提交

<details>
<summary>点击查看答案</summary>

```bash
# === 任务 1：soft 重置，重写提交 ===

# 软重置到上一个提交（D 的修改保留在暂存区）
git reset --soft HEAD~1

# 重新提交，换个 message
git commit -m "refactor: 重新组织D的修改"

# === 任务 2：mixed 重置 ===

# 混合重置回退两个提交
git reset --mixed HEAD~2

# 此时暂存区是空的，但工作区保留了修改
# 用 git status 可以观察到文件处于"未暂存"的修改状态
git status

# === 任务 3：revert 撤销 ===

# 先重新提交所有修改
git add .
git commit -m "feat: 重新提交C"
git add .  # 如果还有文件
git commit -m "feat: 重新提交D"

# 假设已推送到远程，用 revert 安全撤销最近一次提交
git revert HEAD
# 会打开编辑器让你写 commit message，默认是 "Revert ..."
# 保存退出即可

# 验证：查看提交历史，原来的提交还在，多了一个 revert 提交
git log --oneline -5
```

</details>

---

## 8.12 本章小结

- `git restore` 撤销工作区修改
- `git restore --staged` 取消暂存
- `git reset` 回退提交（改变历史）
- `git revert` 反转提交（保留历史）
- 公共分支优先使用 `revert`

---

## 下一章预告

下一章我们会学习 **暂存与清理** —— 也就是 `git stash` 和 `git clean`。当你正在开发一个功能，突然需要切换分支修 bug，但手头的代码还没写完不想提交，这时候 `git stash` 就能帮你临时"藏起来"。而 `git clean` 则帮你清理那些不需要的未跟踪文件。
