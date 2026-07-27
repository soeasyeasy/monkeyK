---
title: "第九章：暂存与清理"
description: "使用 git stash 临时保存工作，使用 git clean 清理文件"
---

# 第九章：暂存与清理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 正在开发一个功能，突然要切分支修 bug，但代码还没写完不想提交，怎么办？
- 切回来之后，之前暂存的修改还能找回来吗？会不会冲突？
- 工作区里一堆乱七八糟的临时文件，怎么批量清理掉？
- `git stash` 和 `git commit` 都能"保存"工作，到底该用哪个？

这一章就是为了解答这些问题。我们会先搞清楚 `git stash` 的底层原理，再学会用 `git clean` 安全地清理文件。

---

## 1 为什么需要暂存与清理？

### 痛点分析

想象一下这些场景：

1. 你正在开发登录功能，代码写了一半，突然产品经理说线上有个紧急 bug 要修
2. 你想切到 main 分支拉取最新代码，但当前分支有未提交的修改，Git 不让你切
3. 你做了很多实验性的改动，不确定要不要保留，想先"冻结"起来看看效果
4. 项目目录里堆满了调试用的临时文件、编译产物，看着就烦

如果没有暂存机制，你要么硬着头皮提交一个半成品，要么手动把改动备份到别的地方——两种都很痛苦。

### 生活化类比

把 `git stash` 想象成你书桌上的"临时抽屉"：

- 你正在写作业（开发功能），突然妈妈让你去做饭（修 bug）
- 你把作业本、笔、草稿纸一股脑塞进临时抽屉（git stash）
- 做完饭回来，打开抽屉，所有东西原封不动拿出来（git stash pop）
- 你可以继续写作业，就像什么都没发生过

而 `git clean` 更像是"扔垃圾"——把桌上那些你随手写的草稿纸、用完的笔芯等没用的东西清理掉。

> **一句话总结**：`git stash` 是你的临时抽屉，帮你保存未完成的工作；`git clean` 是垃圾桶，帮你清理不需要的文件。

---

## 2 核心原理

### git stash 做了什么？

当你执行 `git stash` 时，Git 会做三件事：

1. 把工作区中"已跟踪文件的修改"打包保存到一个特殊的存储区域（stash 栈）
2. 把暂存区的内容也一并保存
3. 把工作区和暂存区恢复到和最近一次提交一样的状态

打个比方：这就像给你的工作现场拍了一张照片，然后把现场恢复原状。等你需要的时候，再根据照片把现场还原回来。

### stash 的工作原理图

```
执行 stash 之前：
工作区：  [已修改的文件 A、B]
暂存区：  [已 add 的文件 C]
提交历史：── 最新提交 ──>

执行 git stash 之后：
工作区：  [干净，和最新提交一致]
暂存区：  [干净]
stash 栈：[stash@{0}: 保存了 A、B 的修改 + C 的暂存内容]

执行 git stash pop 之后：
工作区：  [恢复了 A、B 的修改]
暂存区：  [恢复了 C]
stash 栈：[空，stash@{0} 已被删除]
```

### 关键细节

默认情况下，`git stash` **只保存已跟踪文件的修改**。什么是已跟踪文件？就是之前已经被 `git add` 过、存在于 Git 版本控制中的文件。那些从未被 Git 管理的新文件（未跟踪文件），stash 不会管它们。

---

## 3 基础用法

### 暂存工作

```bash
# 保存当前工作（包括已跟踪文件的修改和暂存区内容）
git stash

# 添加备注，方便以后知道这次 stash 是干什么的
git stash save "正在开发登录功能，还没写完"

# 查看 stash 列表（越新的排在越上面）
git stash list
# 输出示例：
# stash@{0}: WIP on main: a1b2c3d feat: 添加搜索功能
# stash@{1}: On feature: 正在开发登录功能，还没写完

# 恢复最近一次 stash（恢复后 stash 会被删除）
git stash pop

# 恢复指定 stash
git stash pop stash@{1}

# 恢复但不删除 stash（可以多次恢复同一个 stash）
git stash apply
git stash apply stash@{1}

# 删除指定 stash
git stash drop stash@{0}

# 清空所有 stash
git stash clear
```

### pop 和 apply 的区别

| 操作 | 恢复内容 | 删除 stash | 使用场景 |
| --- | --- | --- | --- |
| `git stash pop` | 恢复到工作区 | 是 | 只需要恢复一次 |
| `git stash apply` | 恢复到工作区 | 否 | 需要在多个分支上应用同一个 stash |

打个比方：`pop` 就像从抽屉里拿出作业继续写，拿出来之后抽屉里就没了；`apply` 更像是复印一份拿出来写，原件还在抽屉里，下次还能再复印。

### stash 包含未跟踪文件

默认情况下，`git stash` 只保存已跟踪文件的修改。如果你想把新创建的、还没被 Git 管理的文件也一起保存：

```bash
# 保存所有文件（包括未跟踪的新文件）
git stash -u
git stash --include-untracked

# 保存所有文件（包括被 .gitignore 忽略的文件，非常危险，慎用）
git stash -a
git stash --all
```

::: warning
`-a` 会把 `.gitignore` 中忽略的文件也一起保存（比如 `node_modules`），通常你不需要这样做，慎用。
:::

---

## 4 典型使用场景

### 场景 1：紧急切换分支修 bug

```bash
# 1. 你正在 feature/login 分支开发登录功能
# 2. 突然接到通知：main 分支有紧急 bug 需要修复
# 3. 但你的登录功能还没写完，不想提交半成品

# 先暂存当前工作
git stash

# 切到 main 分支
git checkout main

# 拉取最新代码
git pull

# 修复 bug...
# 提交修复
git commit -m "fix: 修复用户登录异常的问题"

# 切回原来的分支
git checkout feature/login

# 恢复之前暂存的工作
git stash pop

# 继续开发登录功能
```

### 场景 2：合并 stash 时遇到冲突

```bash
# 恢复 stash 时，如果 stash 中的修改和当前代码有冲突
git stash pop

# Git 会提示冲突，就像 merge 冲突一样
# 你需要手动解决冲突文件中的冲突标记

# 解决冲突后，标记为已解决
git add conflict-file.txt

# 注意：pop 遇到冲突时，stash 不会被自动删除
# 需要手动删除
git stash drop stash@{0}
```

### 场景 3：查看 stash 中保存了什么

```bash
# 查看最近一次 stash 的修改内容
git stash show

# 查看详细的差异（和 git diff 一样的输出）
git stash show -p

# 查看指定 stash 的内容
git stash show -p stash@{1}
```

---

## 5 git clean — 清理未跟踪文件

`git clean` 用于删除工作区中未跟踪的文件和目录。这些文件是 Git 完全不管的，比如编译产物、临时调试文件等。

```bash
# 查看会被删除的文件（干运行，不会真的删除，只是预览）
git clean -n
# 输出示例：
# Would remove temp.log
# Would remove debug/

# 删除未跟踪的文件
git clean -f

# 删除未跟踪的文件和目录
git clean -fd

# 删除未跟踪的文件、目录和被 .gitignore 忽略的文件
git clean -fdx

# 交互式清理（逐个确认是否删除）
git clean -i
```

### clean 参数对比

| 参数 | 作用 | 使用场景 |
| --- | --- | --- |
| `-n` | 预览模式，只显示会被删除的文件 | 删除前必做 |
| `-f` | 强制删除未跟踪的文件 | 清理临时文件 |
| `-fd` | 删除未跟踪的文件和目录 | 清理临时目录 |
| `-fdx` | 删除所有未跟踪的内容，包括被忽略的文件 | 彻底清理（如删除 node_modules） |
| `-i` | 交互式，逐个确认 | 不确定删什么的时候 |

::: danger
`git clean` 会**永久删除**文件，这些文件不会进入 Git 的任何记录，删了就真的没了。操作前**一定**要先用 `-n` 预览。
:::

---

## 6 组合使用

### 恢复到最近提交的干净状态

```bash
# 丢弃所有已跟踪文件的修改（工作区 + 暂存区全部清空）
git reset --hard

# 再删除所有未跟踪的文件和目录
git clean -fd

# 现在你的工作区和最近一次提交完全一致，干干净净
```

打个比方：`git reset --hard` 把你改过的文件全部恢复原状，`git clean -fd` 把你新加的文件全部扔掉。两步下来，你的工作区就像刚克隆下来一样干净。

### 完整清理（包括 node_modules 等）

```bash
# 彻底清理，包括 .gitignore 中的文件
git reset --hard
git clean -fdx

# 注意：这会删除 node_modules、dist 等目录
# 之后需要重新 npm install
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| `git stash` | 临时保存未完成的工作，恢复到干净的提交状态 |
| `git stash -u` | 保存时包含未跟踪的新文件 |
| `git stash list` | 查看所有暂存记录 |
| `git stash pop` | 恢复最近一次 stash，并删除该记录 |
| `git stash apply` | 恢复指定 stash，但不删除记录 |
| `git stash drop` | 删除指定的 stash 记录 |
| `git stash show -p` | 查看 stash 中的详细修改内容 |
| `git clean -n` | 预览会被删除的文件（干运行） |
| `git clean -fd` | 删除未跟踪的文件和目录 |
| `git clean -fdx` | 彻底清理，包括被 .gitignore 忽略的文件 |

---

## 8 新手常见误区

### 误区 1："git stash 之后我的修改就安全了，可以放心丢弃"

**不对。** stash 虽然保存了你的修改，但它本质上只是存在本地 `.git` 目录里的一个引用。如果你执行了 `git stash clear`，或者不小心删除了 stash 记录，那些修改就很难找回来了。stash 不是万能的备份方案，它只是临时中转站。

正确做法：重要的修改及时提交到分支上，不要长期依赖 stash 保存。

### 误区 2："stash 之后可以随便切分支，不会有问题"

**不一定。** 如果你 stash 的内容和目标分支的代码有冲突，`git stash pop` 的时候就会报冲突。虽然不会丢数据，但你需要手动解决冲突，有时候还挺麻烦的。

正确做法：stash 之前想清楚目标分支的代码和你的修改是否兼容。如果不确定，可以先在 stash 之前把修改提交到一个临时分支。

### 误区 3："git clean -f 很安全，随便用"

**很危险。** `git clean` 删除的文件不会进入 Git 的任何记录，删了就永远没了。如果你不小心删了重要的未跟踪文件（比如配置文件、本地数据），是找不回来的。

正确做法：每次执行 `git clean` 之前，**一定**先用 `git clean -n` 预览一下，确认要删除的文件列表。

### 误区 4："git stash 和 git commit 是一回事"

**完全不是一回事。** `git commit` 会创建一个正式的提交，进入分支的提交历史；`git stash` 只是把修改临时保存到一个独立的栈里，不会出现在提交历史中。commit 是"永久存档"，stash 是"临时便签"。

正确做法：如果修改已经完成或者需要长期保留，用 `git commit`；如果只是临时中转，用 `git stash`。

### 误区 5："pop 之后 stash 就彻底没了，无法恢复"

**有办法恢复。** 虽然 `git stash pop` 会删除 stash 列表中的记录，但 Git 内部会通过 `reflog` 记录这个操作。如果你 pop 之后发现恢复的内容有问题，可以用 `git reflog` 找到之前 stash 的引用，再用 `git stash apply` 恢复。

```bash
# 查看 reflog 中的 stash 记录
git reflog show stash

# 找到对应的引用后，重新 apply
git stash apply stash@{0}
```

---

## 9 动手练习

### 练习 1：基础练习 — 暂存与恢复

1. 在你的仓库中，修改 `readme.txt` 文件，随便加点内容
2. 用 `git stash` 暂存当前修改
3. 用 `git stash list` 查看暂存列表，确认有一条记录
4. 用 `git stash pop` 恢复修改
5. 用 `git status` 确认修改已恢复

<details>
<summary>点击查看答案</summary>

```bash
# 1. 修改文件
echo "测试暂存功能" >> readme.txt

# 2. 查看状态，确认文件已修改
git status
# 输出应该显示：modified: readme.txt

# 3. 暂存当前修改
git stash
# 输出：Saved working directory and index state WIP on ...

# 4. 查看状态，工作区应该是干净的
git status
# 输出应该显示：working tree clean

# 5. 查看暂存列表
git stash list
# 输出：stash@{0}: WIP on main: ...

# 6. 恢复暂存的修改
git stash pop
# 输出：Dropped refs/stash@{0}

# 7. 确认修改已恢复
git status
# 输出应该显示：modified: readme.txt
```

</details>

### 练习 2：进阶练习 — 模拟紧急切换场景

模拟以下完整流程：

1. 在 `feature` 分支上开发功能，修改了 `app.js`
2. 功能还没写完，需要紧急切到 `main` 分支修 bug
3. 暂存当前工作，添加备注说明
4. 切到 `main` 分支，修改 `config.js` 并提交
5. 切回 `feature` 分支，恢复之前暂存的工作
6. 确认 `app.js` 的修改还在

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建并切到 feature 分支
git checkout -b feature

# 2. 修改 app.js（模拟开发中的功能）
echo "// 正在开发的功能" >> app.js

# 3. 暂存工作，添加备注
git stash save "feature 开发中，登录功能写了一半"

# 4. 切到 main 分支
git checkout main

# 5. 修改 config.js 并提交（模拟修 bug）
echo "// 修复配置问题" >> config.js
git add config.js
git commit -m "fix: 修复配置文件的问题"

# 6. 切回 feature 分支
git checkout feature

# 7. 恢复暂存的工作
git stash pop

# 8. 确认 app.js 的修改还在
git status
# 输出应该显示：modified: app.js

# 9. 查看文件内容，确认修改完整
cat app.js
# 应该能看到 "// 正在开发的功能"
```

</details>

### 练习 3（挑战）：综合练习 — stash 与 clean 的组合使用

完成以下任务：

1. 修改一个已跟踪的文件 `index.js`
2. 创建一个新文件 `temp.log`（未跟踪）
3. 创建一个新目录 `debug/`，里面放一个文件 `debug/info.txt`（未跟踪）
4. 用 `git stash -u` 一次性保存所有修改（包括未跟踪的文件）
5. 确认工作区干净
6. 恢复 stash，确认所有修改和文件都回来了
7. 最后用 `git clean -fd` 清理掉恢复后不需要的未跟踪文件

<details>
<summary>点击查看答案</summary>

```bash
# 1. 修改已跟踪的文件
echo "// 修改已跟踪文件" >> index.js

# 2. 创建未跟踪的新文件
echo "临时日志" > temp.log

# 3. 创建未跟踪的目录和文件
mkdir debug
echo "调试信息" > debug/info.txt

# 4. 查看当前状态
git status
# 应该看到：modified: index.js, untracked: temp.log, untracked: debug/

# 5. 用 -u 保存所有修改（包括未跟踪文件）
git stash -u
# 输出：Saved working directory and index state WIP on ...

# 6. 确认工作区干净
git status
# 输出应该显示：working tree clean

# 7. 查看 stash 列表
git stash list
# 应该有一条记录

# 8. 恢复 stash
git stash pop

# 9. 确认所有修改和文件都回来了
git status
# 应该看到：modified: index.js, untracked: temp.log, untracked: debug/

# 10. 如果不需要 temp.log 和 debug 目录，清理掉
git clean -fd
# 输出：Removing temp.log, Removing debug/

# 11. 确认清理结果
git status
# 现在只剩下 modified: index.js
```

</details>

---

## 10 本章小结

- `git stash` 临时保存未完成的工作，让你能干净地切换分支
- `git stash pop` 恢复并删除 stash，`git stash apply` 恢复但保留
- `git stash -u` 可以包含未跟踪的新文件
- `git clean` 删除未跟踪的文件和目录
- 清理前**一定**先用 `git clean -n` 预览
- `git reset --hard && git clean -fd` 可以恢复到完全干净的状态

---

## 下一章预告

下一章我们会学习 **标签管理** —— 也就是 `git tag`。当你发布一个版本（比如 v1.0.0）时，你需要给那个提交打上一个"标签"，方便以后快速找到。标签就像书签，帮你标记重要的里程碑。我们会学习如何创建、查看、推送和删除标签。
