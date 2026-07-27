---
title: "第三章：基本操作"
description: "掌握 git add、git status、git commit、git log 等核心命令"
---

# 第三章：基本操作

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 我修改了代码，怎么告诉 Git 要记录这些修改？
- `git add` 和 `git commit` 为什么要分两步？
- 怎么查看我改了什么、历史提交记录？
- 提交信息应该怎么写才规范？

这一章会解答这些问题。你会学会 Git 最常用的 5 个命令：`git status`、`git add`、`git commit`、`git log`、`git diff`。掌握它们，你就能顺畅地管理日常代码版本了。

---

## 1 为什么需要这些基本操作？

### 痛点分析

上一章我们初始化了仓库，但 Git 不会自动帮你记录修改。你必须明确告诉它：

- 哪些修改要记录（`git add`）
- 什么时候正式存档（`git commit`）
- 怎么查看改了什么（`git diff`）
- 怎么查看历史记录（`git log`）

这就像你写日记——你得先决定今天写什么（暂存），然后正式写到本子上（提交），之后才能翻阅（查看历史）。

### 解决方案

Git 提供了一套完整的工作流命令：

| 命令 | 作用 | 类比 |
| --- | --- | --- |
| `git status` | 查看当前状态 | 看看书桌上有什么要整理的 |
| `git add` | 暂存修改 | 把要整理的东西放进打包箱 |
| `git commit` | 提交到仓库 | 封好打包箱，贴上标签存档 |
| `git log` | 查看历史 | 翻阅过去的存档记录 |
| `git diff` | 查看差异 | 对比两版内容的具体差别 |

打个比方：

> 把 Git 工作流想象成**寄快递**：
>
> 1. `git status` —— 看看桌上有哪些东西要寄
> 2. `git add` —— 把要寄的东西放进快递箱
> 3. `git commit` —— 封箱、贴单、发出
> 4. `git log` —— 查看寄件记录
> 5. `git diff` —— 对比两次寄件内容的差异

---

## 2 git status — 查看状态

查看工作区和暂存区的文件状态。这是你最常用的命令之一，随时了解"现在什么情况"。

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

### 状态说明

| 状态 | 含义 | 下一步 |
| --- | --- | --- |
| Untracked | 文件未被 Git 跟踪（新文件） | `git add` 开始跟踪 |
| Modified | 文件已修改但未暂存 | `git add` 暂存修改 |
| Staged | 修改已暂存，等待提交 | `git commit` 提交 |
| Up to date | 文件无变化 | 无需操作 |

### 简洁模式

```bash
git status -s
# 输出示例：
# M  src/index.js       ← 已修改且已暂存（绿色）
#  M src/style.css      ← 已修改未暂存（红色）
# A  src/new-file.js    ← 新文件已暂存（绿色）
# ?? src/unknown.js     ← 未跟踪文件（红色）
```

简洁模式用两列显示状态：
- 第一列表示暂存区状态
- 第二列表示工作区状态
- `??` 表示未跟踪

---

## 3 git add — 暂存文件

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

# 交互式暂存（逐个选择修改，适合精细控制）
git add -p
```

### 典型工作流

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

::: tip
`git add .` 会暂存所有变更，包括可能不想提交的文件（如 `.env`）。建议先用 `git status` 确认，或使用 `git add -p` 逐块选择。
:::

---

## 4 git commit — 提交

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
<type>(<scope>): <subject>

<body>

<footer>
```

| 类型 | 说明 | 示例 |
| --- | --- | --- |
| feat | 新功能 | `feat: 添加用户登录` |
| fix | 修复 bug | `fix: 修复购物车计算` |
| docs | 文档变更 | `docs: 更新 README` |
| style | 代码格式（不影响功能） | `style: 格式化代码` |
| refactor | 重构 | `refactor: 重构 API 层` |
| test | 测试相关 | `test: 添加单元测试` |
| chore | 构建/工具变更 | `chore: 更新依赖` |

### 好的提交信息 vs 坏的提交信息

```
❌ 坏的提交信息：
"update"
"fix bug"
"修改"
"111"

✅ 好的提交信息：
"feat(auth): 添加用户名密码登录"
"fix(cart): 修复总价计算精度问题"
"docs(readme): 补充安装步骤说明"
```

打个比方：

> 提交信息就像**书的章节标题**——好的标题让你一眼知道这章讲什么，坏的标题让你翻半天找不到内容。

---

## 5 git log — 查看历史

```bash
# 完整日志
git log

# 简洁模式（单行显示，推荐）
git log --oneline

# 显示最近 N 条
git log -5

# 图形化显示分支（适合查看分支合并）
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

### 常用 log 选项

| 选项 | 作用 |
| --- | --- |
| `--oneline` | 单行显示，简洁 |
| `--graph` | 图形化显示分支 |
| `--all` | 显示所有分支 |
| `-N` | 显示最近 N 条 |
| `--stat` | 显示文件变更统计 |
| `-p` | 显示每次提交的具体差异 |
| `--author="xxx"` | 按作者筛选 |
| `--grep="xxx"` | 按提交信息筛选 |

---

## 6 git diff — 查看差异

```bash
# 工作区 vs 暂存区（未暂存的修改）
git diff

# 暂存区 vs 最新提交（已暂存的修改）
git diff --staged

# 两个提交之间的差异
git diff a1b2c3d e4f5g6h

# 两个分支之间的差异
git diff main..feature
```

### diff 输出解读

```diff
diff --git a/src/index.js b/src/index.js
index 1234567..abcdefg 100644
--- a/src/index.js
+++ b/src/index.js
@@ -10,6 +10,8 @@ function init() {
   console.log('start')
+  // 新增的代码
+  loadConfig()
   return true
 }
```

- `---` 和 `+++` 表示原文件和新文件
- `@@` 表示变更位置
- `+` 表示新增行
- `-` 表示删除行
- 空格开头的行是上下文（未修改）

---

## 7 核心知识点总结

| 命令 | 作用 | 常用选项 |
| --- | --- | --- |
| `git status` | 查看文件状态 | `-s` 简洁模式 |
| `git add` | 暂存文件 | `-p` 交互式暂存 |
| `git commit` | 提交到仓库 | `-m` 指定信息，`-am` 跳过 add |
| `git log` | 查看历史 | `--oneline` `--graph` `--all` |
| `git diff` | 查看差异 | `--staged` 查看已暂存 |

---

## 8 新手常见误区

### 误区 1："git add . 然后 git commit 就行了"

**不推荐！** `git add .` 会暂存所有变更，包括可能不想提交的文件（如 `.env`、`node_modules`）。正确做法是：

```bash
# 先查看状态
git status

# 有选择性地暂存
git add src/login.vue src/auth.js

# 确认暂存内容
git diff --staged

# 再提交
git commit -m "feat: 添加登录功能"
```

### 误区 2："提交信息随便写就行"

**错！** 提交信息是给别人（也是给未来的自己）看的。写 "update" 或 "fix bug" 完全看不出改了什么。遵循 Conventional Commits 规范，写清楚"做了什么"和"为什么做"。

### 误区 3："git commit -am 最方便，以后都用它"

**谨慎使用！** `git commit -am` 会跳过 `git add`，直接提交所有**已跟踪**文件的修改。但它不会跟踪新文件（Untracked files）。而且它让你失去了"选择性暂存"的机会，容易把不相关的修改混在一起。

### 误区 4："git diff 和 git diff --staged 是一样的"

**不一样！** 
- `git diff` 显示工作区 vs 暂存区的差异（未暂存的修改）
- `git diff --staged` 显示暂存区 vs 最新提交的差异（已暂存的修改）

提交前一定要用 `git diff --staged` 确认暂存区的内容，避免提交错误的代码。

### 误区 5："提交越频繁越好"

**不是！** 提交频率应该适中：
- 太频繁（每改一行就提交）——历史碎片化，难以理解
- 太少（一周提交一次）——一次提交太多内容，难以回滚

推荐：**一个功能或一个 bug 修复完成后提交一次**。

---

## 9 动手练习

### 练习 1：基础工作流

创建一个新文件，修改它，然后暂存并提交。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建新文件
echo "console.log('hello')" > test.js

# 2. 查看状态（应该看到 Untracked）
git status

# 3. 暂存文件
git add test.js

# 4. 查看状态（应该看到 Staged）
git status

# 5. 提交
git commit -m "feat: 添加测试文件"

# 6. 查看历史
git log --oneline
```

</details>

### 练习 2：查看差异

修改一个文件，用 `git diff` 查看未暂存的修改，再用 `git diff --staged` 查看已暂存的修改。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 假设已有文件 src/index.js
echo "console.log('old')" > src/index.js
git add src/index.js
git commit -m "init"

# 2. 修改文件
echo "console.log('new')" > src/index.js

# 3. 查看未暂存的修改
git diff
# 会看到 -old +new 的差异

# 4. 暂存修改
git add src/index.js

# 5. 查看已暂存的修改
git diff --staged
# 会看到同样的差异，但这是暂存区 vs 最新提交

# 6. 此时 git diff（不带 --staged）没有输出
# 因为工作区和暂存区一致
```

</details>

### 练习 3（挑战）：选择性暂存

你同时修改了三个文件：`login.vue`（新功能）、`style.css`（样式调整）、`bug.js`（修复 bug）。请分三次提交，每次提交只包含相关的修改。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 修改三个文件...
# login.vue, style.css, bug.js

# 2. 第一次提交：登录功能
git add src/login.vue
git commit -m "feat: 添加登录表单"

# 3. 第二次提交：样式调整
git add src/style.css
git commit -m "style: 调整按钮样式"

# 4. 第三次提交：修复 bug
git add src/bug.js
git commit -m "fix: 修复计算错误"

# 5. 查看历史
git log --oneline
# 应该看到三次独立的提交
```

这样每次提交都是独立的、清晰的，方便后续回滚和理解。

</details>

---

## 下一章预告

下一章我们会学习 **文件状态与忽略**——理解文件的跟踪状态，掌握 `.gitignore` 配置。你会学会如何让 Git 自动忽略 `node_modules`、`.env` 等不需要跟踪的文件。
