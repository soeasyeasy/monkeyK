---
title: "第十二章：Git 工作流"
description: "掌握常见的 Git 工作流模式，选择适合团队的协作方式"
---

# 第十二章：Git 工作流

## 什么是 Git 工作流

Git 工作流是一套关于如何使用 Git 组织和管理代码开发的规范和流程。不同的工作流适合不同规模和协作方式的团队。

## 集中式工作流

最简单的模式，所有人直接推送到主分支。

```
开发者 A ──> main <── 开发者 B
```

**适用场景**：个人项目或极小团队

**缺点**：容易冲突，没有代码审查

## 功能分支工作流（Feature Branch）

每个新功能在独立分支上开发，完成后合并到主分支。

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

# 4. 创建 Pull Request 合并到 main
```

**优点**：
- 功能隔离，互不干扰
- 支持代码审查
- 易于回滚

## Git Flow

经典的分支模型，包含多种类型的分支。

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
| main | 生产环境代码 | 永久 |
| develop | 开发主线 | 永久 |
| feature/* | 新功能开发 | 临时 |
| release/* | 发布准备 | 临时 |
| hotfix/* | 紧急修复 | 临时 |

**工作流程**：

```bash
# 1. 创建功能分支
git checkout -b feature/login develop

# 2. 开发完成后合并回 develop
git checkout develop
git merge --no-ff feature/login
git branch -d feature/login

# 3. 准备发布
git checkout -b release/1.0 develop
# 修复 bug、更新版本号
git commit -m "chore: bump version to 1.0"

# 4. 发布到 main 和 develop
git checkout main
git merge --no-ff release/1.0
git tag -a v1.0.0

git checkout develop
git merge --no-ff release/1.0
```

**适用场景**：版本发布周期较长的项目

## GitHub Flow

简化的工作流，只有主分支和功能分支。

```
main:    A ── B ────────── E ── F
              \            /
feature:       C ── D ──┘
```

**核心规则**：

1. main 分支始终可部署
2. 从 main 创建功能分支
3. 本地提交并推送到远程
4. 创建 Pull Request
5. 审查讨论后合并到 main
6. 立即部署

**适用场景**：持续部署的项目、小型团队

## GitLab Flow

结合 Git Flow 和环境部署的模型。

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
- 适合多环境部署

## 选择工作流

| 工作流 | 团队规模 | 发布周期 | 复杂度 |
| --- | --- | --- | --- |
| 集中式 | 1-2 人 | 随时 | 低 |
| Feature Branch | 3-10 人 | 频繁 | 中 |
| GitHub Flow | 小团队 | 持续部署 | 低 |
| Git Flow | 中大型 | 定期发布 | 高 |
| GitLab Flow | 中大型 | 多环境 | 中 |

## 本章小结

- 功能分支工作流适合大多数团队
- Git Flow 适合版本发布周期长的项目
- GitHub Flow 简单直接，适合持续部署
- 根据团队规模和发布频率选择合适的工作流
