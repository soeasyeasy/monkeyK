---
title: "第十三章：团队协作实践"
description: "学习 Pull Request、代码审查、分支保护等团队协作最佳实践"
---

# 第十三章：团队协作实践

## Pull Request（PR）

Pull Request 是团队协作的核心，用于提议合并一个分支的修改到另一个分支。

### 创建 PR 的流程

```bash
# 1. 创建功能分支
git checkout -b feature/user-auth main

# 2. 开发并提交
git add .
git commit -m "feat: 添加用户认证"

# 3. 推送到远程
git push -u origin feature/user-auth

# 4. 在 GitHub/GitLab 创建 Pull Request
```

### PR 的最佳实践

**标题规范**：

```
feat: 添加用户登录功能
fix: 修复购物车计算错误
docs: 更新 API 文档
```

**描述模板**：

```markdown
## 变更内容
- 添加用户登录表单
- 实现 JWT 认证
- 添加登录状态管理

## 测试情况
- [x] 单元测试通过
- [x] 手动测试登录流程
- [x] 边界情况处理

## 截图
（如果是 UI 变更）

## 相关问题
Closes #123
```

**PR 大小**：
- 小而专注，一次解决一个问题
- 避免超过 400 行代码变更
- 复杂功能拆分为多个 PR

## 代码审查（Code Review）

### 审查者职责

1. **理解上下文**：阅读 PR 描述和相关 issue
2. **检查代码质量**：
   - 代码是否清晰易读
   - 是否有明显的 bug
   - 是否遵循项目规范
   - 是否有安全隐患
3. **提供建设性反馈**：
   - 指出问题同时给出建议
   - 区分"必须修改"和"建议优化"
   - 认可优秀的实现

### 审查评论示例

```
💡 建议：这里可以使用 map 方法简化代码

❌ 问题：这个变量名不够清晰，建议改为 userData

✅ 优秀：这个错误处理很完善，考虑了边界情况
```

### 审查工具

```bash
# GitHub CLI 查看 PR
gh pr view 123

# 本地检出 PR 进行审查
gh pr checkout 123

# 批准 PR
gh pr approve 123

# 请求修改
gh pr request-changes 123 -m "需要添加单元测试"
```

## 分支保护

保护重要分支（如 main、develop）免受不当修改。

### GitHub 分支保护规则

```yaml
# 在 Settings > Branches 中配置
Branch protection rules:
  - Branch name pattern: main
  
  # 要求 Pull Request
  Require pull requests before merging:
    - Required approvals: 2          # 至少 2 人批准
    - Dismiss stale reviews: true    # 新提交时取消之前的批准
    - Require review from Code Owners: true
  
  # 要求状态检查
  Require status checks to pass:
    - CI/CD 测试必须通过
    - 代码质量检查通过
  
  # 其他保护
  - Require branches to be up to date: true
  - Include administrators: true
  - Allow force pushes: false        # 禁止强制推送
  - Allow deletions: false           # 禁止删除分支
```

### 保护效果

- 不能直接推送到受保护分支
- 必须通过 PR 合并
- 必须通过指定的审查和检查
- 不能强制推送或删除

## 合并策略

### Squash and Merge

将 PR 的所有提交压缩为一个提交。

```
PR 中的提交：A ── B ── C
合并后：        D (squash)
```

**优点**：
- 保持主分支历史清晰
- 每个功能只有一个提交

**适用场景**：功能分支、小改动

### Rebase and Merge

将 PR 的提交变基到目标分支。

```
合并前：
main:    X ── Y
              \
feature:       A ── B ── C

合并后：
main:    X ── Y ── A' ── B' ── C'
```

**优点**：
- 保持线性历史
- 保留每个提交

**适用场景**：提交历史清晰的功能分支

### Merge Commit

创建合并提交，保留完整的分支历史。

```
合并前：
main:    X ── Y
              \
feature:       A ── B ── C

合并后：
main:    X ── Y ──────── M
              \          /
feature:       A ── B ── C
```

**优点**：
- 保留完整的开发历史
- 可以看到功能的完整上下文

**适用场景**：大型功能、需要保留历史的场景

## 团队协作规范

### 提交信息规范

使用 Conventional Commits：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型**：
- feat: 新功能
- fix: 修复 bug
- docs: 文档变更
- style: 代码格式
- refactor: 重构
- test: 测试
- chore: 构建/工具

**示例**：

```
feat(auth): 添加用户登录功能

- 实现用户名密码登录
- 添加 JWT token 验证
- 集成登录状态管理

Closes #123
```

### 代码所有权

使用 `CODEOWNERS` 文件定义代码所有者：

```
# .github/CODEOWNERS

# 全局默认所有者
* @team-leads

# 前端代码
/src/components/ @frontend-team
/src/styles/ @frontend-team

# 后端 API
/api/ @backend-team

# 数据库
/migrations/ @db-team @team-leads
```

PR 涉及这些文件时，会自动请求对应团队审查。

## 本章小结

- Pull Request 是团队协作的核心
- 代码审查要保证质量和建设性
- 分支保护防止不当修改
- 选择合适的合并策略
- 遵循提交信息规范和代码所有权
