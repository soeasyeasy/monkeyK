---
title: "第四章：文件状态与忽略"
description: "理解文件跟踪状态，掌握 .gitignore 配置"
---

# 第四章：文件状态与忽略

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Git 中的文件到底有哪几种状态？
- 为什么 `node_modules` 会被 Git 跟踪？怎么让它忽略？
- `.gitignore` 写了为什么没生效？
- 已经跟踪的文件怎么取消跟踪？

这一章会解答这些问题。你会学会文件的跟踪状态、`.gitignore` 的配置规则，以及如何处理"已经跟踪但想忽略"的文件。

---

## 4.1 为什么需要理解文件状态？

### 痛点分析

新手常遇到这些困惑：

- 执行 `git status` 看到一堆文件，不知道哪些该提交、哪些该忽略
- `node_modules`、`.env` 等文件被提交到仓库，导致仓库臃肿或泄露敏感信息
- 写了 `.gitignore` 但文件还是被跟踪了

### 解决方案

理解文件的生命周期和忽略规则，你就能：

- 清楚知道每个文件的状态
- 自动忽略不需要跟踪的文件
- 正确处理已跟踪文件的忽略问题

打个比方：

> Git 的文件管理就像**图书馆的图书管理**：
>
> - **已跟踪** = 图书馆里的藏书，每本都有记录
> - **未跟踪** = 有人放在图书馆的私人物品，图书馆不管
> - **`.gitignore`** = 图书馆的"不收"清单——比如不收自出版书籍、杂志等

---

## 4.2 文件生命周期

Git 中的文件有两种基本状态：

| 状态 | 说明 | 类比 |
| --- | --- | --- |
| Tracked（已跟踪） | Git 已纳入版本控制的文件 | 图书馆的藏书 |
| Untracked（未跟踪） | 存在于工作区但 Git 未跟踪的文件 | 放在图书馆的私人物品 |

已跟踪的文件又分为三种子状态：

```
未修改（Unmodified）→ 已修改（Modified）→ 已暂存（Staged）→ 提交后回到未修改
```

### 完整生命周期图

```
                    ┌─────────────────────────────────────┐
                    │                                     │
                    ▼                                     │
Untracked ──git add──> Tracked (Unmodified) ──编辑──> Modified
                                                   │
                                              git add
                                                   │
                                                   ▼
                                              Staged ──git commit──> Unmodified
```

### 状态速查

| 状态 | 含义 | 你该做什么 |
| --- | --- | --- |
| Untracked | 新文件，Git 不认识 | 想跟踪就 `git add`，不想就加到 `.gitignore` |
| Unmodified | 已跟踪，无修改 | 继续工作 |
| Modified | 已修改，未暂存 | `git add` 暂存或 `git restore` 丢弃 |
| Staged | 已暂存，等待提交 | `git commit` 提交 |

---

## 4.3 .gitignore 配置

通过 `.gitignore` 文件告诉 Git 忽略哪些文件，这些文件不会被跟踪。

### 创建 .gitignore

```bash
# 在项目根目录创建
touch .gitignore
```

### 常见忽略规则

```gitignore
# 依赖目录（不需要提交，每个人本地 npm install）
node_modules/
vendor/

# 构建输出（可以重新生成）
dist/
build/
*.min.js
*.min.css

# 环境变量（包含敏感信息，如 API key、密码）
.env
.env.local
.env.*.local

# 编辑器配置（个人偏好，不共享）
.vscode/
.idea/
*.swp
*.swo

# 操作系统文件
.DS_Store
Thumbs.db

# 日志文件
*.log
npm-debug.log*

# 临时文件
*.tmp
*.temp
```

### 规则语法

```gitignore
# 注释以 # 开头

# 忽略所有 .log 文件
*.log

# 不忽略 important.log（例外规则）
!important.log

# 忽略根目录下的 temp 文件（不包括子目录）
/temp*

# 忽略所有目录下的 build 目录
**/build/

# 忽略 doc 目录下所有 .txt 文件
doc/*.txt

# 忽略所有 .js 文件
*.js

# 忽略所有目录下的 .env 文件
**/.env
```

### 规则说明

| 模式 | 含义 | 示例 |
| --- | --- | --- |
| `*` | 匹配任意字符 | `*.log` 匹配所有 `.log` 文件 |
| `?` | 匹配单个字符 | `file?.txt` 匹配 `file1.txt` |
| `**` | 匹配任意目录 | `**/build/` 匹配所有层级的 `build` |
| `/` | 目录分隔符 | `/temp*` 只匹配根目录 |
| `!` | 例外（不忽略） | `!important.log` 不忽略此文件 |
| 结尾 `/` | 只匹配目录 | `node_modules/` 只匹配目录 |

---

## 4.4 规则优先级

### 重要原则

1. **已在 Git 中跟踪的文件，`.gitignore` 不会生效**
2. 如果要取消跟踪已跟踪的文件，需要先从 Git 中移除

### 常见错误场景

```bash
# 错误做法：先提交了 node_modules，再写 .gitignore
git add .
git commit -m "init"
echo "node_modules/" >> .gitignore
# 此时 node_modules 仍然被跟踪！
```

```bash
# 正确做法：先写 .gitignore，再提交
echo "node_modules/" >> .gitignore
git add .
git commit -m "init"
```

### 取消跟踪已跟踪的文件

```bash
# 从 Git 中移除但保留本地文件
git rm --cached config.json

# 然后添加到 .gitignore
echo "config.json" >> .gitignore

# 提交变更
git add .gitignore
git commit -m "chore: 忽略配置文件"
```

### 批量取消跟踪

```bash
# 取消跟踪整个 node_modules
git rm -r --cached node_modules

# 添加到 .gitignore
echo "node_modules/" >> .gitignore

# 提交
git add .gitignore
git commit -m "chore: 忽略 node_modules"
```

---

## 4.5 全局 gitignore

有些文件（如编辑器配置）在所有项目中都应该被忽略，可以设置全局忽略文件：

```bash
# 设置全局 gitignore
git config --global core.excludesFile ~/.gitignore_global
```

在 `~/.gitignore_global` 中写入通用规则：

```gitignore
# 操作系统文件
.DS_Store
Thumbs.db

# 编辑器配置
.idea/
.vscode/
*.swp
*.swo

# 个人笔记
TODO.md
notes.txt
```

### 全局 vs 局部 .gitignore

| 类型 | 作用范围 | 适用场景 |
| --- | --- | --- |
| 项目 `.gitignore` | 当前仓库 | 项目特定的忽略（node_modules、dist） |
| 全局 `~/.gitignore_global` | 所有仓库 | 个人偏好（编辑器配置、系统文件） |

---

## 4.6 查看文件状态详解

```bash
# 查看简短状态
git status -s

# 输出示例：
# M  file1.txt    ← 已修改且已暂存（第一列 M）
#  M file2.txt    ← 已修改未暂存（第二列 M）
# A  file3.txt    ← 新文件已暂存（第一列 A）
# ?? file4.txt    ← 未跟踪
# D  file5.txt    ← 已删除并暂存（第一列 D）
#  D file6.txt    ← 已删除未暂存（第二列 D）
# R  file7.txt    ← 已重命名（第一列 R）
```

### 状态字母含义

| 字母 | 含义 |
| --- | --- |
| `??` | 未跟踪 |
| `A` | 新增（已暂存） |
| `M` | 修改 |
| `D` | 删除 |
| `R` | 重命名 |
| `C` | 复制 |

---

## 4.7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 文件状态 | Untracked / Unmodified / Modified / Staged |
| `.gitignore` | 告诉 Git 忽略哪些文件 |
| 规则语法 | `*` `?` `**` `/` `!` 结尾 `/` |
| 优先级 | 已跟踪的文件不受 `.gitignore` 影响 |
| 取消跟踪 | `git rm --cached` 从 Git 移除但保留本地 |
| 全局忽略 | `~/.gitignore_global` 对所有仓库生效 |

---

## 4.8 新手常见误区

### 误区 1：".gitignore 写了但没生效"

**最常见原因**：文件已经被跟踪了。`.gitignore` 只对未跟踪的文件生效。

正确做法：

```bash
# 1. 先从 Git 中移除
git rm --cached file-to-ignore.txt

# 2. 再添加到 .gitignore
echo "file-to-ignore.txt" >> .gitignore

# 3. 提交
git add .gitignore
git commit -m "chore: 忽略文件"
```

### 误区 2："node_modules 被提交了，现在加 .gitignore 就行"

**不行！** 必须先从 Git 中移除：

```bash
# 错误做法
echo "node_modules/" >> .gitignore
# node_modules 仍然被跟踪

# 正确做法
git rm -r --cached node_modules
echo "node_modules/" >> .gitignore
git add .gitignore
git commit -m "chore: 忽略 node_modules"
```

### 误区 3：".gitignore 只能放在根目录"

**错！** `.gitignore` 可以放在任何目录中，规则只对该目录及其子目录生效。但通常只在根目录放一个，便于管理。

### 误区 4："全局 .gitignore 可以替代项目 .gitignore"

**不能！** 全局忽略适合个人偏好（如编辑器配置），项目特定的忽略（如 `node_modules`、`dist`）应该放在项目的 `.gitignore` 中，这样团队其他成员也能受益。

---

## 4.9 动手练习

### 练习 1：创建 .gitignore

为一个 Node.js 项目创建 `.gitignore`，忽略 `node_modules`、`dist`、`.env` 文件。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 创建 .gitignore 文件
touch .gitignore

# 2. 写入忽略规则
cat > .gitignore << 'EOF'
# 依赖
node_modules/

# 构建输出
dist/
build/

# 环境变量
.env
.env.local
.env.*.local

# 日志
*.log
npm-debug.log*

# 编辑器
.vscode/
.idea/
*.swp

# 系统文件
.DS_Store
Thumbs.db
EOF

# 3. 查看状态
git status
# .gitignore 本身应该被跟踪
```

</details>

### 练习 2：取消跟踪已跟踪的文件

你的仓库不小心提交了 `config.json`（包含敏感信息），请取消跟踪并添加到 `.gitignore`。

<details>
<summary>点击查看答案</summary>

```bash
# 1. 从 Git 中移除但保留本地文件
git rm --cached config.json

# 2. 添加到 .gitignore
echo "config.json" >> .gitignore

# 3. 提交变更
git add .gitignore
git commit -m "fix: 取消跟踪配置文件并添加到忽略列表"

# 4. 验证
git status
# config.json 应该不再显示
```

</details>

### 练习 3（挑战）：理解状态

根据以下 `git status -s` 的输出，解释每个文件的状态：

```
M  file1.txt
 M file2.txt
A  file3.txt
?? file4.txt
D  file5.txt
```

<details>
<summary>点击查看答案</summary>

```
M  file1.txt   ← 第一列 M：已修改且已暂存（等待提交）
 M file2.txt   ← 第二列 M：已修改但未暂存（需要 git add）
A  file3.txt   ← 第一列 A：新文件已暂存（等待提交）
?? file4.txt   ← 未跟踪文件（需要 git add 或加入 .gitignore）
D  file5.txt   ← 第一列 D：已删除且已暂存（等待提交删除）
```

解释：
- 第一列表示暂存区状态（相对上次提交）
- 第二列表示工作区状态（相对暂存区）
- `??` 表示未跟踪

</details>

---

## 下一章预告

下一章我们会学习 **分支管理**——Git 最强大的功能之一。你会学会如何创建、切换、删除分支，以及分支的本质是什么。分支让你可以在"平行空间"里做实验，不影响主线代码。
