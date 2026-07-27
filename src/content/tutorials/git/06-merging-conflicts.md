---
title: "第六章：合并与冲突"
description: "学习分支合并策略与冲突解决方法"
---

# 第六章：合并与冲突

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 合并分支到底是怎么回事？为什么有时候很顺利，有时候却报错了？
- 冲突是怎么产生的？为什么 Git 不能自动帮我合并？
- merge 和 rebase 有什么区别？到底该用哪个？
- 遇到冲突时好慌，万一改错了怎么办？

这一章就是为了解答这些问题。我们会先搞清楚**合并的原理**，再学会**解决冲突的方法**，最后掌握**预防冲突的技巧**。学完之后，你面对合并冲突就不会再手忙脚乱了。

---

## 1 为什么需要合并与冲突处理？

### 痛点分析

想象一下这个场景：

你和同事小王同时在开发一个项目。你在 main 分支上修改了用户登录功能，小王在 feature 分支上开发了购物车功能。现在小王的功能做完了，要把代码合并到 main 分支。

如果没有合并机制，你们只能：
- 手动复制粘贴代码（容易出错）
- 用 U 盘拷来拷去（效率极低）
- 覆盖对方的代码（直接崩溃）

### 生活化类比

**合并就像两个人一起写作文**：

你和同桌各自写一篇文章的不同章节。你写第一章，同桌写第二章。最后要把两篇文章合并成一篇完整的文章。

- **顺利的情况**：你们写的是不同章节，直接拼接就行（这就是快进合并）
- **复杂的情况**：你们都在同一页写了修改意见，需要讨论保留谁的版本（这就是冲突）

**冲突处理就像编辑审稿**：

当两个人的修改有矛盾时，需要一个"编辑"来做决定。Git 就是那个编辑，但它遇到矛盾时会举手问你："这里你们俩写的不一样，保留哪个？"

> **一句话总结**：合并是把多条开发线路汇合成一条，冲突处理是解决"意见不统一"的情况。

---

## 2 合并分支

将一个分支的修改合并到当前分支。

```bash
# 确保在目标分支（要合并到哪个分支，就先切换到哪个分支）
git checkout main

# 合并 feature 分支（把 feature/login 的修改合并到 main）
git merge feature/login
```

### 合并类型

**快进合并（Fast-forward）**：目标分支没有新提交，直接移动指针。

```
合并前：
main:    A ── B
                \
feature:         C ── D

合并后（fast-forward）：
main:    A ── B ── C ── D
```

**三方合并（Three-way merge）**：两个分支都有新提交，创建合并提交。

```
合并前：
main:    A ── B ── E
                \
feature:         C ── D

合并后（three-way merge）：
main:    A ── B ── E ── M
                \       /
feature:         C ── D
```

---

## 3 核心原理讲解

### 快进合并的原理

**通俗理解**：

快进合并就像"直接往前走"。main 分支在 B 点停住了，feature 分支从 B 继续走到了 D。因为 main 没有新的提交，所以直接把 main 指针移动到 D 就行了，不需要创建新的提交。

**生活类比**：

就像你在看书，书签夹在第 50 页。你朋友从第 50 页继续看到了第 80 页。现在你想把书签移到最新的位置，直接把书签从 50 页挪到 80 页就行，不需要做任何标记。

### 三方合并的原理

**通俗理解**：

三方合并就像"两条路汇合"。main 分支从 B 走到了 E，feature 分支从 B 走到了 D。现在要把两条路合并，Git 需要：

1. 找到两个分支的"共同祖先"（B 点）
2. 对比 main 从 B 到 E 的修改
3. 对比 feature 从 B 到 D 的修改
4. 把两边的修改合并在一起，创建一个新的合并提交 M

**生活类比**：

就像你和朋友分别从家出发去不同的地方，最后约在餐厅见面。Git 会看看你从家出来后去了哪里，朋友去了哪里，然后把两条路线合并成一条完整的路线。

### 为什么会产生冲突？

**核心原因**：两个分支修改了同一个文件的同一部分。

打个比方：你和同桌都在同一道题上写了不同的答案。老师（Git）看到两个不同的答案，不知道保留哪个，只好问你们："你们自己决定保留哪个答案吧。"

```
main 分支修改了第 10 行：
- 原来：return 'Hello'
- 改成：return 'Hello from main'

feature 分支也修改了第 10 行：
- 原来：return 'Hello'
- 改成：return 'Hello from feature'
```

Git 看到两个不同的修改，不知道该保留哪个，就标记为冲突。

---

## 4 合并策略

```bash
# 默认合并（创建合并提交）
git merge feature/login

# 快进合并（不允许三方合并时失败）
git merge --ff-only feature/login

# 压缩合并（将分支所有提交压缩为一个）
git merge --squash feature/login

# 指定合并信息
git merge feature/login -m "合并登录功能"
```

---

## 5 冲突产生

当两个分支修改了同一文件的同一区域时，Git 无法自动合并，产生冲突。

```bash
git merge feature/login
# CONFLICT (content): Merge conflict in src/index.js
# Automatic merge failed; fix conflicts and then commit the result.
```

---

## 6 解决冲突

冲突文件中，Git 会标记冲突区域：

```javascript
function greet() {
<<<<<<< HEAD
  return 'Hello from main'
=======
  return 'Hello from feature'
>>>>>>> feature/login
}
```

解决步骤：

1. 打开冲突文件
2. 找到冲突标记 `<<<<<<<`、`=======`、`>>>>>>>`
3. 手动编辑，保留想要的代码
4. 删除所有冲突标记
5. 暂存文件并提交

```bash
# 编辑文件解决冲突后
git add src/index.js
git commit -m "merge: 解决登录功能合并冲突"
```

### 解决后的结果

```javascript
function greet() {
  return 'Hello from feature'  // 选择了 feature 的版本
}
```

---

## 7 冲突预防

```bash
# 合并前先查看差异
git diff main..feature/login

# 使用 rebase 代替 merge（保持线性历史）
git checkout feature/login
git rebase main

# 频繁同步（减少冲突范围）
git pull --rebase
```

---

## 8 放弃合并

```bash
# 合并冲突时放弃
git merge --abort
```

---

## 9 对比表格

### merge vs rebase

| 特性 | merge | rebase |
|------|-------|--------|
| **历史记录** | 保留完整的分支历史，有分叉和合并 | 线性历史，看起来更干净 |
| **提交记录** | 会创建一个合并提交 | 不创建合并提交，重写提交历史 |
| **安全性** | 安全，不修改已有提交 | 危险，会修改提交哈希 |
| **适用场景** | 公共分支（如 main） | 本地分支、未推送的分支 |
| **冲突处理** | 一次性解决所有冲突 | 可能多次解决冲突（每个提交一次） |
| **团队协作** | 推荐用于团队 | 仅限个人分支使用 |

**什么时候用哪个？**

- **用 merge**：合并功能分支到 main，保留完整的开发历史
- **用 rebase**：在推送前整理自己的提交，让历史更清晰

### --squash vs 普通 merge

| 特性 | 普通 merge | --squash |
|------|-----------|----------|
| **提交数量** | 保留所有提交 | 压缩成一个提交 |
| **历史记录** | 完整的分支历史 | 扁平化的历史 |
| **合并提交** | 创建合并提交 | 不创建合并提交 |
| **适用场景** | 需要保留详细开发过程 | 功能分支提交太乱，想清理 |
| **提交信息** | 自动合并信息 | 需要手动写提交信息 |

**什么时候用哪个？**

- **用普通 merge**：功能分支的提交都很有意义，想保留
- **用 --squash**：功能分支有很多"修复小 bug"、"调整格式"的提交，想压缩成一个干净的提交

---

## 10 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| **快进合并** | 目标分支没有新提交，直接移动指针，不创建新提交 |
| **三方合并** | 两个分支都有新提交，找到共同祖先，合并修改，创建合并提交 |
| **冲突产生** | 两个分支修改了同一文件的同一区域 |
| **冲突标记** | `<<<<<<<`、`=======`、`>>>>>>>` 标记冲突区域 |
| **解决冲突** | 手动编辑文件，保留想要的代码，删除标记，暂存并提交 |
| **放弃合并** | `git merge --abort` 回到合并前的状态 |
| **预防冲突** | 频繁同步、使用 rebase、合并前查看差异 |

---

## 11 新手常见误区

### 误区 1："冲突很危险，要尽量避免"

**错！** 冲突不是错误，是正常现象。

冲突只是 Git 在告诉你："这里有两个不同的修改，需要你决定保留哪个。" 频繁冲突说明团队协作不够紧密，应该：
- 更频繁地同步代码
- 合理分配任务，避免多人修改同一文件
- 使用 rebase 减少冲突范围

### 误区 2："解决冲突时，把两边的代码都保留就行了"

**不一定！** 要看具体情况。

有时候两边的代码不能同时存在。比如：
- main 把函数名从 `getUser` 改成 `fetchUser`
- feature 还在用 `getUser`

如果你保留两份代码，会导致逻辑混乱。解决冲突时要理解两边的意图，选择正确的实现方式。

### 误区 3："rebase 比 merge 好，应该总是用 rebase"

**错！** 两者各有用途。

rebase 会修改提交历史，在公共分支（如 main）上使用 rebase 会导致其他人的代码混乱。正确的做法：
- **个人分支**：用 rebase 整理提交
- **公共分支**：用 merge 合并，保留历史

### 误区 4："冲突解决完了，直接 push 就行"

**不完整！** 解决冲突后还需要：

```bash
# 1. 暂存解决完冲突的文件
git add <文件名>

# 2. 提交合并结果
git commit -m "merge: 解决合并冲突"

# 3. 然后才能推送
git push
```

如果忘记提交就直接 push，会报错。

### 误区 5："合并后发现问题，可以随便撤销"

**危险！** 合并后的撤销要看情况：

- **还没推送**：可以用 `git reset --hard HEAD~1` 撤销合并
- **已经推送**：撤销会影响其他人，应该用 `git revert` 创建一个新的提交来撤销修改

推送前确认合并结果，避免后续麻烦。

---

## 12 动手练习

### 练习 1：基础练习 - 快进合并

**题目**：创建一个 feature 分支，添加一个文件，然后合并到 main 分支（实现快进合并）。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 确保在 main 分支
git checkout main

# 2. 创建并切换到 feature 分支
git checkout -b feature/test

# 3. 创建一个新文件
echo "测试内容" > test.txt

# 4. 暂存并提交
git add test.txt
git commit -m "feat: 添加测试文件"

# 5. 切换回 main 分支
git checkout main

# 6. 合并 feature 分支（此时会快进合并）
git merge feature/test

# 7. 查看提交历史，确认是线性历史
git log --oneline --graph
```

**说明**：因为 main 分支没有新提交，所以 Git 会直接移动指针，实现快进合并。

</details>

### 练习 2：进阶练习 - 三方合并

**题目**：在 main 和 feature 分支都有新提交的情况下，实现三方合并。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 确保在 main 分支，有一个初始提交
git checkout main
echo "初始内容" > readme.txt
git add readme.txt
git commit -m "init: 初始化文件"

# 2. 创建 feature 分支
git checkout -b feature/update

# 3. 在 feature 分支修改文件
echo "feature 分支的修改" >> readme.txt
git add readme.txt
git commit -m "feat: feature 分支的修改"

# 4. 切换回 main 分支
git checkout main

# 5. 在 main 分支也修改文件（不同的行）
echo "main 分支的修改" >> readme.txt
git add readme.txt
git commit -m "feat: main 分支的修改"

# 6. 合并 feature 分支（此时会三方合并）
git merge feature/update

# 7. 查看提交历史，确认有合并提交
git log --oneline --graph
```

**说明**：因为 main 和 feature 都有新提交，Git 会创建一个合并提交 M，把两边的修改合并在一起。

</details>

### 练习 3（挑战）：综合练习 - 解决冲突

**题目**：模拟一个真实的冲突场景，手动解决冲突并完成合并。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 初始化项目
git checkout main
echo "function greet() { return 'Hello' }" > index.js
git add index.js
git commit -m "init: 初始化函数"

# 2. 创建 feature 分支
git checkout -b feature/greeting

# 3. 在 feature 分支修改同一行
# 使用编辑器或 echo 命令修改 index.js 为：
# function greet() { return 'Hello from feature' }
echo "function greet() { return 'Hello from feature' }" > index.js
git add index.js
git commit -m "feat: 修改问候语"

# 4. 切换回 main 分支
git checkout main

# 5. 在 main 分支也修改同一行（不同的内容）
# 修改 index.js 为：
# function greet() { return 'Hello from main' }
echo "function greet() { return 'Hello from main' }" > index.js
git add index.js
git commit -m "feat: 修改问候语"

# 6. 尝试合并（会产生冲突）
git merge feature/greeting
# 输出：CONFLICT (content): Merge conflict in index.js

# 7. 打开 index.js，你会看到冲突标记：
# function greet() {
# <<<<<<< HEAD
#   return 'Hello from main'
# =======
#   return 'Hello from feature'
# >>>>>>> feature/greeting
# }

# 8. 手动编辑文件，选择保留 feature 的版本
# 修改为：
# function greet() { return 'Hello from feature' }
echo "function greet() { return 'Hello from feature' }" > index.js

# 9. 暂存文件
git add index.js

# 10. 提交合并结果
git commit -m "merge: 解决问候语冲突，选择 feature 版本"

# 11. 查看结果
git log --oneline --graph
cat index.js
```

**说明**：冲突解决的关键是理解两边的修改意图，选择正确的版本。在这个例子中，我们选择了 feature 分支的版本。

</details>

---

## 本章小结

- `git merge` 将分支修改合并到当前分支
- 快进合并和三方合并是两种基本合并类型
- 冲突时手动编辑文件，删除标记后提交
- 频繁同步和合理分支策略可以减少冲突
- merge 和 rebase 各有用途，要根据场景选择
- 解决冲突时要理解代码意图，不是简单保留两边

---

## 下一章预告

下一章我们会学习 **远程仓库**——也就是如何把本地代码推送到 GitHub、GitLab 等远程平台。你会学到如何配置远程仓库、推送和拉取代码、与团队协作开发。这是从"单机开发"走向"团队协作"的关键一步。
