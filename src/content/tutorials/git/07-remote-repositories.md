---
title: "第七章：远程仓库"
description: "掌握远程仓库的配置与同步操作"
---

# 第七章：远程仓库

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 远程仓库到底是什么？为什么不能只用本地仓库？
- `git fetch` 和 `git pull` 有什么区别？该用哪个？
- 推送代码时报错 "rejected" 是怎么回事？
- 远程跟踪分支（`origin/main`）是什么？为什么不能直接修改它？

这一章就是为了解答这些问题。我们会先搞清楚 **为什么需要远程仓库**，再逐一掌握 `fetch`、`pull`、`push` 三大核心命令，最后理解远程跟踪分支的工作原理。

---

## 7.1 为什么需要远程仓库

### 痛点分析

在前面几章中，你学会了用 Git 管理本地版本历史。但现实开发中，你一定会遇到这些场景：

- 你在公司电脑上写了一半代码，回家想用家里的电脑继续——但代码在公司电脑上
- 你和同事同时在开发一个项目，怎么把各自的代码合并到一起？
- 你的电脑硬盘坏了，本地仓库全丢了怎么办？

这些问题的共同点是：**本地仓库只存在一台电脑上，无法共享，也无法备份**。

### 生活化类比

> 把远程仓库想象成一个**公共白板**：
>
> - 每个团队成员都可以把自己的成果贴到白板上（push）
> - 每个人也可以随时看看白板上有没有新内容（fetch / pull）
> - 白板挂在墙上，不会因为某个人电脑坏了就消失
>
> 远程仓库就是团队共享的"代码白板"，它放在 GitHub、GitLab 这样的服务器上，所有人都能访问。

### 解决方案

远程仓库（Remote Repository）就是托管在服务器上的 Git 仓库。它解决了三个核心问题：

| 问题 | 远程仓库如何解决 |
| --- | --- |
| 多台电脑同步 | 代码存在服务器上，任何电脑都能拉取 |
| 团队协作 | 每个人推送自己的代码，拉取别人的代码 |
| 备份 | 代码不在你一个人电脑上，硬盘坏了也不怕 |

---

## 7.2 查看远程仓库

```bash
# 查看远程仓库地址
git remote -v

# 输出示例：
# origin  https://github.com/user/repo.git (fetch)
# origin  https://github.com/user/repo.git (push)
```

`-v` 表示 verbose（详细），会同时显示 fetch 和 push 两个地址。如果你只想看远程仓库的名称列表：

```bash
# 只看名称
git remote

# 输出示例：
# origin
```

`origin` 是 Git 默认的远程仓库名称。当你用 `git clone` 克隆仓库时，Git 会自动把远程仓库命名为 `origin`。

---

## 7.3 添加远程仓库

```bash
# 添加远程仓库（HTTPS 协议）
git remote add origin https://github.com/user/repo.git

# 使用 SSH 协议
git remote add origin git@github.com:user/repo.git

# 添加多个远程仓库（比如上游仓库）
git remote add upstream https://github.com/original/repo.git
```

常见的远程仓库命名惯例：

| 名称 | 含义 |
| --- | --- |
| `origin` | 你 fork 或克隆来源的仓库（默认名称） |
| `upstream` | 原始项目的主仓库（你 fork 之前的那个） |

---

## 7.4 修改远程仓库

```bash
# 修改远程仓库地址
git remote set-url origin https://github.com/user/new-repo.git

# 重命名远程仓库
git remote rename old-name new-name

# 删除远程仓库
git remote remove origin
```

---

## 7.5 核心原理：fetch、pull、push 的工作流程

这是本章最重要的部分。先理解整体流程，再逐个学习命令。

### 整体流程图

```
本地仓库                          远程仓库
┌──────────┐                    ┌──────────┐
│  main    │                    │  main    │
│ (你的)   │                    │ (服务器) │
└──────────┘                    └──────────┘
     │                                │
     │  git push ──────────────────>  │  把本地提交推送到远程
     │                                │
     │  <────────────────── git fetch │  把远程更新下载到本地（不合并）
     │                                │
     │  <────────────────── git pull  │  把远程更新下载并合并到本地
```

### 远程跟踪分支的概念

当你执行 `git fetch` 时，Git 不会直接修改你的本地分支（比如 `main`），而是更新一个叫做"远程跟踪分支"的东西。

打个比方：

> 远程跟踪分支就像**远程仓库在你电脑上的"快照照片"**。
>
> - 每次 `git fetch`，就是拍一张新的照片，看看远程仓库现在长什么样
> - 这张照片（`origin/main`）只供你参考，你不能直接在上面画画
> - 你要想修改自己的代码，需要把照片里的内容"合并"到自己的分支上

```
本地分支：      main          ← 你可以自由修改
远程跟踪分支：  origin/main   ← 只读，自动更新，反映远程的状态
```

---

## 7.6 git fetch -- 获取远程更新

从远程仓库下载最新的提交和引用，但**不合并**到本地。

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

### fetch 之后做什么？

`git fetch` 完成后，你可以用 `git log` 查看远程比你多了哪些提交：

```bash
# 查看远程 main 分支比你本地多了什么
git log main..origin/main

# 确认没问题后，手动合并
git merge origin/main
```

这其实就是 `git pull` 做的事情——`git pull` = `git fetch` + `git merge`。

---

## 7.7 git pull -- 拉取并合并

从远程仓库获取更新并**自动合并**到当前分支。

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

### pull 的两种方式对比

| 方式 | 命令 | 行为 | 适用场景 |
| --- | --- | --- | --- |
| merge | `git pull` | 拉取后创建一个合并提交 | 默认方式，保留完整历史 |
| rebase | `git pull --rebase` | 拉取后把你的提交"接"到远程后面 | 保持提交历史整洁、线性 |

---

## 7.8 git push -- 推送本地提交

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

---

## 7.9 对比表格

### fetch vs pull vs push

| 命令 | 方向 | 是否修改本地工作区 | 是否自动合并 | 安全性 |
| --- | --- | --- | --- | --- |
| `git fetch` | 远程 → 本地（只更新跟踪分支） | 否 | 否 | 安全 |
| `git pull` | 远程 → 本地（合并到当前分支） | 是 | 是 | 可能产生冲突 |
| `git push` | 本地 → 远程 | 否 | 否 | 远程有新提交时会被拒绝 |

### HTTPS vs SSH 协议

| 特性 | HTTPS | SSH |
| --- | --- | --- |
| URL 格式 | `https://github.com/user/repo.git` | `git@github.com:user/repo.git` |
| 认证方式 | 用户名 + 密码 / Token | SSH 密钥 |
| 配置难度 | 简单，开箱即用 | 需要生成和配置密钥 |
| 推送体验 | 每次可能需要输入密码 | 免密码推送 |
| 推荐场景 | 快速上手、临时使用 | 日常开发（推荐） |

---

## 7.10 远程跟踪分支

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

### 远程跟踪分支的更新时机

| 操作 | 是否更新远程跟踪分支 |
| --- | --- |
| `git fetch` | 是 |
| `git pull` | 是（因为 pull 包含 fetch） |
| `git push` | 是（推送后也会更新） |
| `git commit` | 否（只影响本地分支） |

---

## 7.11 设置上游分支

```bash
# 推送时设置上游分支
git push -u origin main

# 之后可以直接使用 git push
git push
```

`-u`（即 `--set-upstream`）的作用是：告诉 Git "以后我在这个分支上执行 `git push` / `git pull` 时，默认对应远程的哪个分支"。设置一次之后，就不需要每次都写完整的 `git push origin main` 了。

---

## 7.12 删除远程分支

```bash
# 删除远程分支
git push origin --delete feature/login

# 或者
git push origin :feature/login
```

---

## 7.13 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 远程仓库 | 托管在服务器上的 Git 仓库，用于团队共享和备份 |
| `git remote` | 管理远程仓库的增删改查 |
| `git fetch` | 下载远程更新到远程跟踪分支，不合并 |
| `git pull` | 下载远程更新并自动合并到当前分支 |
| `git push` | 将本地提交推送到远程仓库 |
| 远程跟踪分支 | `origin/main` 这样的分支，是远程仓库在本地的只读快照 |
| 上游分支 | 通过 `-u` 设置本地分支与远程分支的对应关系 |
| HTTPS vs SSH | 两种远程仓库通信协议，SSH 日常开发更方便 |

---

## 7.14 新手常见误区

### 误区 1："git pull 和 git fetch 是一样的"

**不一样！** `git fetch` 只是下载远程更新，不会动你的本地代码，非常安全。`git pull` 除了下载之外还会自动合并，可能会产生冲突。建议新手先用 `git fetch` 看看远程有什么变化，确认没问题再手动合并。

### 误区 2："push 被拒绝了就是 Git 出 bug 了"

推送被拒绝（rejected）通常是因为远程有你本地没有的新提交。正确做法是先 `git pull`（或 `git fetch` + `git merge`）把远程更新拉下来，解决可能的冲突后再 push。

### 误区 3："可以直接修改 origin/main"

`origin/main` 是远程跟踪分支，是只读的。它只是告诉你"远程的 main 分支现在在哪个提交"。你要修改代码，应该在自己的本地分支（如 `main`）上操作。

### 误区 4："每次 push 都可以用 --force"

**绝对不行！** `git push --force` 会覆盖远程的历史，如果别人已经基于远程的提交做了开发，他们的代码就会出问题。`--force` 只应该用在你自己的个人特性分支上，永远不要用在 `main` 等公共分支上。

### 误区 5："origin 这个名字不能改"

`origin` 只是一个约定俗成的默认名称，完全可以改成别的。你也可以添加多个远程仓库，比如 `origin` 指向自己的 fork，`upstream` 指向原始项目。

---

## 7.15 动手练习

### 练习 1（基础）：模拟远程协作流程

你在本地有一个仓库，现在想把它推送到 GitHub 上的新仓库，并设置好上游分支。请写出完整的操作步骤。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 在 GitHub 上创建一个新仓库（网页操作），得到地址如：
# https://github.com/yourname/my-project.git

# 2. 在本地仓库中添加远程仓库
git remote add origin https://github.com/yourname/my-project.git

# 3. 首次推送并设置上游分支
git push -u origin main

# 4. 验证远程仓库配置
git remote -v
# 应该看到 origin 的地址

# 5. 之后日常开发中，推送只需要
git push

# 拉取也只需要
git pull
```

</details>

### 练习 2（进阶）：fetch 和 pull 的区别

你的本地 `main` 分支有 3 个提交（A、B、C），远程 `origin/main` 有 2 个新提交（D、E）。请分别说明执行 `git fetch` 和 `git pull` 后，本地发生了什么变化。

<details>
<summary>点击查看答案</summary>

```
执行 git fetch 之后：
- 远程跟踪分支 origin/main 更新到 E
- 本地 main 仍然指向 C（没有变化）
- 你需要手动执行 git merge origin/main 才能把 D、E 合并进来

执行 git pull 之后：
- 相当于执行了 git fetch + git merge origin/main
- 远程跟踪分支 origin/main 更新到 E
- 本地 main 自动合并了 D 和 E，指向最新的合并提交
- 如果没有冲突，会自动完成合并
```

简单记：`fetch` 只看不改，`pull` 看了还帮你改。

</details>

### 练习 3（挑战）：多人协作场景

你和同事同时在开发。你在本地 `main` 分支提交了修改 F，同时同事也推送了修改 G 到远程 `main`。现在你想推送你的代码，请写出完整的操作步骤，并说明可能遇到的情况。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 先拉取远程最新代码
git pull --rebase

# 2. 如果没有冲突，你的 F 会被"接"到 G 后面，历史变成：
# A - B - C - G - F
# 直接推送即可
git push

# 3. 如果有冲突（你和同事改了同一个文件的同一区域）：
#    a. 打开冲突文件，解决冲突标记
#    b. 暂存解决后的文件
git add .
#    c. 继续 rebase
git rebase --continue
#    d. 推送
git push
```

可能遇到的情况：
- 无冲突：rebase 顺利完成，直接 push
- 有冲突：需要手动解决冲突后继续 rebase
- 如果你不用 `--rebase`，用普通的 `git pull` 也可以，只是会多一个合并提交

</details>

---

## 本章小结

- `git remote` 管理远程仓库
- `git fetch` 获取远程更新（不合并）
- `git pull` 获取并合并远程更新
- `git push` 推送本地提交到远程
- 远程跟踪分支（如 `origin/main`）是只读的
- `fetch` 安全无副作用，`pull` 会自动合并
- 永远不要对公共分支使用 `--force`

---

## 下一章预告

下一章我们会学习 **撤销与回退**——写错了提交怎么办？想回到之前的版本怎么做？`git reset`、`git revert`、`git restore` 这几个命令各有什么用处？掌握了这些，你就再也不用怕"改错代码"了。
