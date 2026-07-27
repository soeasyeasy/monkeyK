---
title: "第十二章：Git 工作流"
description: "掌握常见的 Git 工作流模式，选择适合团队的协作方式"
---

# 第十二章：Git 工作流

## 本章导读

学完前面的章节，你已经掌握了 Git 的基本操作。但在实际团队协作中，光会用 Git 命令还不够，还需要一套"规则"来规范大家的协作方式。这就是 Git 工作流。

在开始之前，先思考这几个问题：

1. 团队里每个人都直接往 main 分支推代码，会有什么问题？
2. 为什么大公司要用那么多分支（develop、release、hotfix）？小团队也这样吗？
3. GitHub Flow 和 Git Flow 听起来差不多，到底有什么区别？
4. 我们团队应该选哪种工作流？怎么选？

这一章会带你了解几种主流的 Git 工作流，帮你找到最适合团队的那一个。

## 1 为什么需要 Git 工作流

### 痛点分析

想象一下这个场景：你们团队有 5 个开发者，大家都直接往 main 分支推代码。

- 小张正在开发登录功能，推了一半的代码上去，结果整个项目跑不起来了
- 小李直接 push 了一个有 bug 的代码，线上环境直接崩了
- 小王想回滚某个功能，结果把其他人的代码也回滚了
- 大家互相覆盖代码，每天都在"谁动了我的代码"的争吵中度过

没有工作流的团队协作，就像没有交通规则的十字路口，迟早会堵成一团。

### 生活化类比

Git 工作流就像是"公司的规章制度"。

一家公司如果没有考勤制度、审批流程、部门划分，员工想干什么就干什么，公司迟早乱套。Git 工作流就是给团队协作定下的"规矩"：谁负责什么、代码怎么合并、什么时候发布、出了问题怎么回滚。

不同的公司规模需要不同的管理制度：

- 2-3 人的小公司：大家吼一声就知道，不需要复杂的流程
- 10-50 人的中型公司：需要部门划分、审批流程
- 100 人以上的大公司：需要完整的组织架构、多层审批

Git 工作流也是一样，团队规模不同，适合的工作流也不同。

## 2 核心原理讲解

### 12.2.1 集中式工作流

最简单的模式，所有人直接推送到主分支。

```
开发者 A ──> main <── 开发者 B
```

**工作流程**：

```bash
# 1. 克隆远程仓库
git clone https://github.com/team/project.git

# 2. 开发功能
git add .
git commit -m "feat: 添加新功能"

# 3. 拉取最新代码（防止冲突）
git pull origin main

# 4. 推送到远程
git push origin main
```

**适用场景**：个人项目或极小团队（1-2 人）

**缺点**：

- 容易冲突，一个人推了有 bug 的代码，所有人都受影响
- 没有代码审查，代码质量无法保证
- 无法并行开发多个功能

### 12.2.2 功能分支工作流（Feature Branch）

每个新功能在独立分支上开发，完成后合并到主分支。这是目前最流行的工作流。

```
main:        A ── B ────────── E ── F
                  \            /
feature/login:     C ── D ──┘
```

**基本流程**：

```bash
# 1. 从 main 创建功能分支
git checkout -b feature/login main

# 2. 开发功能
git add .
git commit -m "feat: 完成登录功能"

# 3. 推送到远程
git push -u origin feature/login

# 4. 在 GitHub/GitLab 上创建 Pull Request（PR）

# 5. 同事审查代码，提出修改意见

# 6. 修改完成后，合并到 main 分支

# 7. 删除功能分支
git branch -d feature/login
```

**优点**：

- 功能隔离，互不干扰
- 支持代码审查（Code Review）
- 易于回滚（直接删除分支或反向合并）
- 可以并行开发多个功能

**适用场景**：3-10 人的团队，大多数项目都适合

### 12.2.3 Git Flow

经典的分支模型，由 Vincent Driessen 在 2010 年提出。包含多种类型的分支，适合版本发布周期较长的项目。

```
main:        A ────────────────────── B (v1.0.0)
                  \                  /
develop:          C ── D ── E ── F ─┘
                       \         /
feature/login:          G ── H ─┘
                              \
release/1.0:                   I ── J
```

**分支类型**：

| 分支 | 用途 | 生命周期 |
| --- | --- | --- |
| main | 生产环境代码，每个提交都是一个版本 | 永久 |
| develop | 开发主线，包含下一个版本的代码 | 永久 |
| feature/* | 新功能开发，从 develop 创建，完成后合并回 develop | 临时 |
| release/* | 发布准备，修复 bug、更新版本号，完成后合并到 main 和 develop | 临时 |
| hotfix/* | 紧急修复生产环境 bug，从 main 创建，完成后合并到 main 和 develop | 临时 |

**工作流程**：

```bash
# 1. 创建功能分支（从 develop 创建）
git checkout -b feature/login develop

# 2. 开发完成后合并回 develop
git checkout develop
git merge --no-ff feature/login
git branch -d feature/login

# 3. 准备发布（从 develop 创建 release 分支）
git checkout -b release/1.0 develop

# 4. 在 release 分支上修复 bug、更新版本号
git commit -m "chore: bump version to 1.0"

# 5. 发布到 main（打标签）
git checkout main
git merge --no-ff release/1.0
git tag -a v1.0.0 -m "Release version 1.0.0"

# 6. 同步回 develop（确保 release 阶段的修复也在 develop 中）
git checkout develop
git merge --no-ff release/1.0

# 7. 紧急修复（hotfix）
git checkout -b hotfix/fix-login-bug main
# 修复 bug
git commit -m "fix: 修复登录 bug"
# 合并到 main 和 develop
git checkout main
git merge --no-ff hotfix/fix-login-bug
git tag -a v1.0.1
git checkout develop
git merge --no-ff hotfix/fix-login-bug
```

**适用场景**：

- 版本发布周期较长（比如每月发布一次）
- 需要维护多个版本
- 中大型团队

**缺点**：

- 分支太多，管理复杂
- 不适合持续部署的项目

### 12.2.4 GitHub Flow

GitHub 提出的简化工作流，只有主分支和功能分支，适合持续部署的项目。

```
main:    A ── B ────────── E ── F
              \            /
feature:       C ── D ──┘
```

**核心规则**：

1. main 分支始终可部署（任何时候都能发布到生产环境）
2. 从 main 创建功能分支
3. 本地提交并推送到远程
4. 创建 Pull Request
5. 审查讨论后合并到 main
6. 立即部署

**工作流程**：

```bash
# 1. 从 main 创建功能分支
git checkout -b feature/login main

# 2. 开发并提交
git add .
git commit -m "feat: 添加登录功能"
git push -u origin feature/login

# 3. 在 GitHub 上创建 Pull Request

# 4. 同事审查代码，提出修改意见

# 5. 修改后推送到功能分支
git add .
git commit -m "fix: 根据审查意见修改"
git push

# 6. 审查通过后，合并到 main

# 7. 自动部署到生产环境（通过 CI/CD）
```

**适用场景**：

- 持续部署的项目（每天发布多次）
- 小型团队
- 使用 GitHub 的项目

**优点**：

- 简单直接，容易上手
- 适合快速迭代
- 强调代码审查

### 12.2.5 GitLab Flow

GitLab 提出的工作流，结合了 Git Flow 和环境部署的模型，适合多环境部署的项目。

```
main:        A ── B ── C
              |    |    |
pre-prod:     D    E    F
              |    |    |
production:   G    H    I
```

**特点**：

- 环境分支（如 pre-production、production）
- 上游优先（上游分支的修改自动合并到下游）
- 代码先在 main 分支开发，然后逐步合并到预发布环境、生产环境

**工作流程**：

```bash
# 1. 在 main 分支开发功能
git checkout -b feature/login main
# 开发完成后合并回 main

# 2. 合并到预发布环境
git checkout pre-production
git merge main

# 3. 在预发布环境测试通过后，合并到生产环境
git checkout production
git merge main
```

**适用场景**：

- 多环境部署的项目（开发、测试、预发布、生产）
- 中大型团队
- 需要严格控制发布流程的项目

## 3 对比表格：选择合适的工作流

| 工作流 | 团队规模 | 发布周期 | 复杂度 | 分支数量 | 适用场景 |
| --- | --- | --- | --- | --- | --- |
| 集中式 | 1-2 人 | 随时 | 低 | 1 个（main） | 个人项目、极小团队 |
| Feature Branch | 3-10 人 | 频繁 | 中 | 2 个（main + feature） | 大多数团队 |
| GitHub Flow | 小团队 | 持续部署 | 低 | 2 个（main + feature） | 持续部署、快速迭代 |
| Git Flow | 中大型 | 定期发布 | 高 | 5 个（main、develop、feature、release、hotfix） | 版本发布周期长 |
| GitLab Flow | 中大型 | 多环境 | 中 | 多个（main + 环境分支） | 多环境部署 |

## 4 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 集中式工作流 | 所有人直接推送到 main，适合个人项目 |
| 功能分支工作流 | 每个功能在独立分支开发，完成后合并到 main |
| Git Flow | 包含 main、develop、feature、release、hotfix 五种分支 |
| GitHub Flow | 只有 main 和 feature 分支，强调持续部署 |
| GitLab Flow | 结合环境分支，适合多环境部署 |
| Pull Request | 代码审查机制，合并前需要同事审查 |
| --no-ff | 合并时强制创建合并提交，保留分支历史 |
| 上游优先 | 上游分支的修改自动合并到下游分支 |

## 5 新手常见误区

### 误区一：小团队也用 Git Flow

Git Flow 有 5 种分支，管理起来很复杂。如果你的团队只有 3-5 人，发布周期也不固定，用 Git Flow 只会增加不必要的复杂度。这时候功能分支工作流或 GitHub Flow 更合适。

记住：工作流不是越复杂越好，适合团队的才是最好的。

### 误区二：所有人都能直接推送到 main

即使是小团队，也不应该让所有人直接往 main 分支推代码。这样很容易把有 bug 的代码推上去，导致线上环境出问题。

正确的做法是：

- 所有代码都通过 Pull Request 合并
- 至少需要一个人审查代码
- 合并前必须通过 CI 测试

### 误区三：功能分支开发很久才合并

功能分支应该尽量小，开发周期不要超过一周。如果一个功能分支开发了半个月才合并，合并时冲突会非常多，审查也很困难。

正确做法：

- 大功能拆分成多个小功能
- 每个小功能单独一个分支
- 尽快合并，减少冲突

### 误区四：合并后不删除功能分支

功能分支合并到 main 后，应该及时删除。如果不删除，仓库里会堆积大量无用分支，管理起来很麻烦。

```bash
# 删除本地分支
git branch -d feature/login

# 删除远程分支
git push origin --delete feature/login
```

### 误区五：不看审查意见直接合并

Pull Request 的核心是代码审查，不是走形式。如果同事提出了修改意见，一定要认真修改，不要直接合并。

代码审查的好处：

- 发现潜在 bug
- 提高代码质量
- 团队成员互相学习
- 保证代码可维护性

## 6 动手练习

### 练习一（基础）：功能分支工作流

**题目**：模拟一个完整的功能分支工作流。创建一个功能分支，开发功能，创建 Pull Request，合并到 main。

<details>
<summary>点击查看答案</summary>

```bash
# 第一步：确保 main 分支是最新的
git checkout main
git pull origin main

# 第二步：创建功能分支
git checkout -b feature/user-profile

# 第三步：开发功能
echo "user profile page" > profile.html
git add profile.html
git commit -m "feat: 添加用户资料页面"

# 第四步：推送到远程
git push -u origin feature/user-profile

# 第五步：在 GitHub/GitLab 上创建 Pull Request

# 第六步：等待审查通过后，合并到 main（在网页上操作）

# 第七步：删除功能分支
git checkout main
git pull origin main
git branch -d feature/user-profile
git push origin --delete feature/user-profile
```

</details>

### 练习二（进阶）：Git Flow 完整流程

**题目**：模拟 Git Flow 的完整流程。从 develop 创建功能分支，开发完成后合并回 develop，然后创建 release 分支准备发布。

<details>
<summary>点击查看答案</summary>

```bash
# 第一步：创建 develop 分支（如果还没有）
git checkout -b develop main

# 第二步：从 develop 创建功能分支
git checkout -b feature/shopping-cart develop

# 第三步：开发功能
echo "shopping cart" > cart.js
git add cart.js
git commit -m "feat: 添加购物车功能"

# 第四步：合并回 develop
git checkout develop
git merge --no-ff feature/shopping-cart -m "Merge feature/shopping-cart into develop"
git branch -d feature/shopping-cart

# 第五步：创建 release 分支
git checkout -b release/1.0 develop

# 第六步：在 release 分支上修复 bug、更新版本号
echo "1.0.0" > VERSION
git add VERSION
git commit -m "chore: bump version to 1.0.0"

# 第七步：发布到 main
git checkout main
git merge --no-ff release/1.0 -m "Merge release/1.0 into main"
git tag -a v1.0.0 -m "Release version 1.0.0"

# 第八步：同步回 develop
git checkout develop
git merge --no-ff release/1.0 -m "Merge release/1.0 into develop"

# 第九步：删除 release 分支
git branch -d release/1.0
```

</details>

### 练习三（挑战）：hotfix 紧急修复

**题目**：生产环境发现一个严重 bug，需要紧急修复。模拟 hotfix 流程：从 main 创建 hotfix 分支，修复 bug，合并到 main 和 develop。

<details>
<summary>点击查看答案</summary>

```bash
# 第一步：从 main 创建 hotfix 分支
git checkout main
git checkout -b hotfix/fix-login-bug

# 第二步：修复 bug
# 假设 login.js 中有一个 bug，需要修复
echo "fixed login bug" >> login.js
git add login.js
git commit -m "fix: 修复登录时密码验证错误"

# 第三步：合并到 main
git checkout main
git merge --no-ff hotfix/fix-login-bug -m "Merge hotfix/fix-login-bug into main"
git tag -a v1.0.1 -m "Hotfix version 1.0.1"

# 第四步：同步到 develop（确保 develop 也有这个修复）
git checkout develop
git merge --no-ff hotfix/fix-login-bug -m "Merge hotfix/fix-login-bug into develop"

# 第五步：删除 hotfix 分支
git branch -d hotfix/fix-login-bug

# 第六步：推送到远程
git push origin main
git push origin develop
git push origin v1.0.1
```

</details>

## 7 下一章预告

学完了 Git 工作流，你已经掌握了团队协作的核心技能。接下来我们会学习 Git 的高级技巧，包括子模块（submodule）、钩子（hook）、以及如何使用 Git 管理大型项目。这些技巧会让你在实际工作中更加得心应手。
