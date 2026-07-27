---
title: "第五章：分支管理"
description: "掌握分支创建、切换、删除等核心操作"
---

# 第五章：分支管理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 分支到底是什么？为什么 Git 要设计分支？
- 创建分支和切换分支有什么区别？为什么要分两步？
- `checkout` 和 `switch` 都能切换分支，该用哪个？
- 删除分支时 `-d` 和 `-D` 有什么区别？删错了怎么办？

这一章会解答这些问题。我们会先搞清楚**分支的本质**，再动手实践创建、切换、删除分支的操作。学完后你就能自如地用分支来管理不同的开发任务了。

---

## 1 为什么需要分支？

### 痛点分析

想象一下这个场景：

你正在开发一个电商网站，突然老板说："明天要上线一个促销活动页面，很紧急！"

如果没有分支，你会怎么做？

- 在当前代码上直接改？万一改出问题，原本的功能也挂了
- 先把代码复制一份备份？改完后还要手动合并，容易遗漏
- 先提交当前的半成品代码？代码还没测试通过，提交上去会污染历史记录

这些做法都很痛苦，就像**在一本书的中间插入新章节，结果把后面的页码全打乱了**。

### 生活化类比

分支就像**游戏里的存档点**：

- 你在玩一个角色扮演游戏，即将进入一个危险副本
- 你会先存个档（创建分支），然后进去尝试
- 如果打不过或者走错路，可以读档回来（切换分支）
- 如果成功通关，这个存档就保留（合并分支）
- 如果彻底搞砸了，删掉这个存档就行（删除分支）

### 解决方案

Git 的分支让你可以：

- **并行开发**：同时开发多个功能，互不干扰
- **安全实验**：在新分支上尝试新想法，失败了也不影响主代码
- **版本管理**：不同分支代表不同的开发方向，清晰可控

打个比方：

> 分支就像**平行宇宙**。你可以在一个宇宙里尝试新功能，如果失败了，回到原来的宇宙继续开发，完全不会影响原来的世界。

---

## 2 什么是分支

分支是 Git 最强大的特性。本质上，**分支只是一个指向某个提交的可移动指针**。

```
main:     A ── B ── E ── F
                   \
feature:            C ── D
```

在这个图中：

- `main` 分支指向提交 F
- `feature` 分支指向提交 D
- 两个分支从提交 B 分叉，各自独立发展

### HEAD 指针

除了分支指针，Git 还有一个特殊的 `HEAD` 指针，**指向你当前所在的分支**。

```
当前在 main 分支：

HEAD ──> main ──> F
```

当你切换到 `feature` 分支时：

```
HEAD ──> feature ──> D
```

打个比方：

> `HEAD` 就像**你站的位置**。分支是不同的道路，`HEAD` 告诉你现在站在哪条路上。

---

## 3 分支的底层原理

### 分支的本质

分支在 Git 中只是一个 **41 字节的文件**（40 字符 SHA-1 哈希 + 换行符）。这就是为什么创建和切换分支如此快速。

```bash
# 查看 main 分支指向的提交
cat .git/refs/heads/main
# 输出：a1b2c3d4e5f6...（40个字符的哈希值）
```

### 通俗理解

打个比方：

> 如果把 Git 仓库比作一本书：
> - **提交**是书的每一页
> - **分支**是书签
> - 创建分支就是加一个书签
> - 切换分支就是翻到对应书签的页面
> - 删除分支就是拿走一个书签
>
> 书签本身很轻量（只是一个标记），所以创建和切换都很快。

### 分支 vs 提交

| 概念 | 本质 | 大小 | 作用 |
| --- | --- | --- | --- |
| 提交 | 快照数据 | 几 KB 到几 MB | 保存代码的某个版本 |
| 分支 | 指针文件 | 41 字节 | 指向某个提交 |

这就是为什么 Git 的分支比其他版本控制系统（如 SVN）轻量得多——它只是在操作一个小文件，而不是复制整个代码库。

---

## 4 查看分支

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

### 参数说明

| 参数 | 作用 | 使用场景 |
| --- | --- | --- |
| 无参数 | 列出本地分支 | 查看自己有哪些分支 |
| `-a` | 列出所有分支（含远程） | 查看团队所有人的分支 |
| `--merged` | 列出已合并的分支 | 找出可以安全删除的分支 |
| `--no-merged` | 列出未合并的分支 | 找出还没合并的重要分支 |
| `-v` | 显示详细信息 | 查看每个分支的最后一次提交 |

---

## 5 创建分支

```bash
# 创建分支（不切换）
git branch feature/login

# 创建并切换（推荐）
git checkout -b feature/login

# 或者使用新命令（Git 2.23+）
git switch -c feature/login
```

### 两种创建方式对比

| 命令 | 作用 | 是否切换分支 |
| --- | --- | --- |
| `git branch <name>` | 只创建分支 | 否，留在原分支 |
| `git checkout -b <name>` | 创建并切换 | 是 |
| `git switch -c <name>` | 创建并切换 | 是（新命令，更语义化） |

::: tip
推荐使用 `git switch -c` 或 `git checkout -b`，因为创建分支后通常都要切换过去开发。
:::

---

## 6 切换分支

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

### 切换失败的情况

如果你在分支 A 上有未提交的修改，切换到分支 B 时可能会冲突：

```bash
# 修改了文件但没提交
git switch feature/other
# error: Your local changes to the following files would be overwritten by checkout
```

解决方法：

```bash
# 方法1：先提交修改
git commit -m "保存当前工作"
git switch feature/other

# 方法2：暂存修改（后续章节会学）
git stash
git switch feature/other

# 方法3：放弃修改（危险！会丢失修改）
git checkout -- .
git switch feature/other
```

---

## 7 删除分支

```bash
# 删除已合并的分支
git branch -d feature/login

# 强制删除未合并的分支
git branch -D feature/login

# 删除远程分支
git push origin --delete feature/login
```

### 删除参数对比

| 参数 | 全称 | 安全性 | 使用场景 |
| --- | --- | --- | --- |
| `-d` | `--delete` | 安全 | 删除已合并的分支，防止丢失代码 |
| `-D` | `--delete --force` | 危险 | 强制删除未合并的分支，会丢失代码 |

::: warning
使用 `-D` 前一定要确认：这个分支的代码确实不需要了，或者已经手动合并到其他分支。
:::

---

## 8 分支命名规范

推荐的分支命名方式：

```
feature/user-login      # 新功能
fix/cart-total          # 修复 bug
hotfix/payment-error    # 紧急修复
refactor/api-layer      # 重构
docs/update-readme      # 文档更新
```

### 命名建议

| 前缀 | 用途 | 示例 |
| --- | --- | --- |
| `feature/` | 新功能开发 | `feature/user-login` |
| `fix/` | 修复 bug | `fix/cart-total` |
| `hotfix/` | 紧急修复线上问题 | `hotfix/payment-error` |
| `refactor/` | 代码重构 | `refactor/api-layer` |
| `docs/` | 文档更新 | `docs/update-readme` |
| `test/` | 添加测试 | `test/user-auth` |

好的分支命名能让团队成员一眼就知道这个分支是做什么的。

---

## 9 命令对比

### checkout vs switch

Git 2.23+ 引入了 `switch` 命令来替代 `checkout` 的分支切换功能。

| 功能 | checkout | switch | 推荐 |
| --- | --- | --- | --- |
| 切换分支 | `git checkout <branch>` | `git switch <branch>` | switch（语义更清晰） |
| 创建并切换 | `git checkout -b <branch>` | `git switch -c <branch>` | switch |
| 切换到上一个分支 | `git checkout -` | `git switch -` | 都可以 |
| 查看文件历史 | `git checkout -- <file>` | 不支持 | checkout（switch 只做分支） |

::: tip
`switch` 只负责分支操作，`checkout` 还能做其他事情。如果你只用 Git 2.23+，推荐用 `switch`，语义更清晰。
:::

### -d vs -D 删除分支

| 参数 | 全称 | 检查合并状态 | 丢失代码风险 | 使用建议 |
| --- | --- | --- | --- | --- |
| `-d` | `--delete` | 是 | 无 | 优先使用 |
| `-D` | `--delete --force` | 否 | 有 | 确认不需要后再用 |

---

## 10 核心知识点总结

| 知识点 | 说明 | 命令示例 |
| --- | --- | --- |
| 分支本质 | 指向提交的可移动指针 | 41字节的文件 |
| 查看分支 | 列出本地或所有分支 | `git branch` / `git branch -a` |
| 创建分支 | 创建新指针 | `git branch <name>` |
| 创建并切换 | 创建新分支并切换过去 | `git switch -c <name>` |
| 切换分支 | 移动 HEAD 指针 | `git switch <name>` |
| 删除分支 | 移除分支指针 | `git branch -d <name>` |
| HEAD 指针 | 指向当前所在分支 | 自动管理 |
| 分支命名 | 使用有意义的前缀 | `feature/xxx`、`fix/xxx` |

---

## 11 新手常见误区

### 误区 1："创建分支后会自动切换过去"

**错！** `git branch <name>` 只会创建分支，不会切换。你还停留在原来的分支上。

正确做法：

```bash
# 创建并切换（一步到位）
git switch -c feature/login

# 或者分两步
git branch feature/login
git switch feature/login
```

### 误区 2："删除分支会丢失所有代码"

**不完全对。** 只有删除**未合并**的分支才会丢失代码。如果分支已经合并到主分支，删除它不会丢失任何东西。

正确做法：

```bash
# 先检查分支是否已合并
git branch --merged

# 删除已合并的分支（安全）
git branch -d feature/login

# 如果要删除未合并的分支，先确认代码是否真的不需要
git branch -D feature/login
```

### 误区 3："分支名可以随便起"

**不推荐。** 虽然 Git 允许你用任何名字，但混乱的命名会让团队协作变得困难。

正确做法：

```bash
# 不好的命名
git branch -b test1
git branch -b my-work
git branch -b fix-bug

# 好的命名
git branch -b feature/user-login
git branch -b fix/cart-total
git branch -b hotfix/payment-error
```

### 误区 4："切换分支前不需要提交修改"

**危险！** 如果工作区有未提交的修改，切换分支可能导致冲突或代码丢失。

正确做法：

```bash
# 切换前先检查状态
git status

# 如果有修改，先提交或暂存
git commit -m "保存当前工作"
# 或者
git stash

# 然后再切换
git switch feature/other
```

### 误区 5："checkout 和 switch 完全一样"

**不对。** `switch` 是 Git 2.23+ 引入的新命令，只负责分支操作。`checkout` 功能更多，还能恢复文件、查看历史等。

正确做法：

```bash
# 切换分支：推荐用 switch（语义清晰）
git switch feature/login

# 恢复文件：必须用 checkout
git checkout -- src/index.js

# 如果 Git 版本 >= 2.23，优先用 switch
# 如果需要兼容老版本，用 checkout
```

---

## 12 动手练习

### 练习 1：基础练习 - 创建和切换分支

创建一个名为 `feature/header` 的分支，切换到该分支，查看当前所有分支，然后切换回 `main` 分支。

<details>
<summary>点击查看答案</summary>

```bash
# 创建并切换到新分支
git switch -c feature/header

# 查看当前分支（应该看到 * feature/header）
git branch

# 切换回 main 分支
git switch main

# 确认已经切换成功
git branch
```

</details>

### 练习 2：进阶练习 - 分支工作流

模拟真实的开发流程：

1. 从 `main` 分支创建 `feature/footer` 分支
2. 在该分支上创建一个 `footer.html` 文件，写入任意内容
3. 提交修改
4. 切换回 `main` 分支，确认 `footer.html` 不存在
5. 切换回 `feature/footer` 分支，确认 `footer.html` 又出现了

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建并切换到新分支
git switch -c feature/footer

# 2. 创建文件
echo "<footer>Copyright 2024</footer>" > footer.html

# 3. 提交修改
git add footer.html
git commit -m "添加页脚组件"

# 4. 切换回 main 分支
git switch main
ls  # 确认 footer.html 不存在

# 5. 切换回 feature/footer 分支
git switch feature/footer
ls  # 确认 footer.html 又出现了
```

这个练习展示了分支的隔离性：不同分支的文件是独立的，切换分支时工作区会自动更新。

</details>

### 练习 3（挑战）：综合练习 - 多分支管理

完成以下任务：

1. 创建三个分支：`feature/login`、`feature/register`、`fix/typo`
2. 查看所有分支，确认创建成功
3. 删除 `fix/typo` 分支（它还没有任何提交）
4. 尝试用 `-d` 删除 `feature/login`，观察会发生什么
5. 用 `-D` 强制删除 `feature/login`

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建三个分支
git switch -c feature/login
git switch main
git switch -c feature/register
git switch main
git switch -c fix/typo
git switch main

# 2. 查看所有分支
git branch

# 3. 删除 fix/typo（没有任何提交，可以安全删除）
git branch -d fix/typo

# 4. 尝试用 -d 删除 feature/login
git branch -d feature/login
# 会报错：error: The branch 'feature/login' is not fully merged.
# 这是因为 feature/login 还没有合并到 main

# 5. 用 -D 强制删除
git branch -D feature/login
# 成功删除，但要注意：这个分支上的所有修改都会丢失！
```

这个练习让你理解 `-d` 和 `-D` 的区别：`-d` 会检查分支是否已合并，保护你的代码；`-D` 会强制删除，可能丢失代码。

</details>

---

## 下一章预告

下一章我们会学习**分支合并与冲突解决**——也就是如何把不同分支的代码合并到一起。你会学到：

- 如何合并两个分支
- 什么是合并冲突，为什么会发生
- 如何解决冲突
- 不同的合并策略有什么区别

分支合并是团队协作的核心技能，掌握它你就能和他人并行开发而不互相干扰了。
