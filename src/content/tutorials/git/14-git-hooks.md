---
title: "第十四章：Git Hooks"
description: "使用 Git 钩子实现自动化检查和流程控制"
---

# 第十四章：Git Hooks

## 什么是 Git Hooks

Git Hooks 是 Git 在特定事件（如提交、推送）时自动执行的脚本。可以用来强制执行代码规范、运行测试等。

## 钩子类型

### 客户端钩子

| 钩子 | 触发时机 | 用途 |
| --- | --- | --- |
| pre-commit | 提交前 | 代码格式化、lint 检查 |
| prepare-commit-msg | 编辑提交信息前 | 自动生成提交信息模板 |
| commit-msg | 提交信息编辑后 | 验证提交信息格式 |
| post-commit | 提交后 | 通知、日志记录 |
| pre-push | 推送前 | 运行测试 |

### 服务端钩子

| 钩子 | 触发时机 | 用途 |
| --- | --- | --- |
| pre-receive | 接收推送前 | 权限检查、分支保护 |
| update | 每个分支更新前 | 细粒度控制 |
| post-receive | 接收推送后 | 部署、通知 |

## 使用本地钩子

钩子脚本存放在 `.git/hooks/` 目录中。

```bash
# 查看可用的钩子模板
ls .git/hooks/

# 输出示例：
# applypatch-msg.sample
# commit-msg.sample
# pre-commit.sample
# ...
```

### 创建 pre-commit 钩子

```bash
# 复制模板
cp .git/hooks/pre-commit.sample .git/hooks/pre-commit

# 编辑钩子脚本
```

示例 `.git/hooks/pre-commit`：

```bash
#!/bin/sh

# 运行 ESLint
echo "Running ESLint..."
npm run lint

if [ $? -ne 0 ]; then
  echo "ESLint failed. Commit aborted."
  exit 1
fi

# 运行测试
echo "Running tests..."
npm test

if [ $? -ne 0 ]; then
  echo "Tests failed. Commit aborted."
  exit 1
fi
```

### 创建 commit-msg 钩子

验证提交信息格式：

```bash
#!/bin/sh

commit_msg=$(cat "$1")

# 检查是否符合 Conventional Commits 格式
if ! echo "$commit_msg" | grep -qE "^(feat|fix|docs|style|refactor|test|chore)(\(.*\))?: .+"; then
  echo "提交信息格式不符合规范"
  echo "格式：<type>(<scope>): <subject>"
  echo "示例：feat(auth): 添加登录功能"
  exit 1
fi
```

## 使用 Husky（推荐）

Husky 是一个流行的 Git Hooks 管理工具，简化钩子配置。

### 安装和配置

```bash
# 安装 Husky
npm install husky --save-dev

# 初始化 Husky
npx husky init
```

这会创建 `.husky/` 目录。

### 添加 pre-commit 钩子

```bash
# 创建 pre-commit 钩子
npx husky add .husky/pre-commit "npm run lint"
```

生成的 `.husky/pre-commit` 文件：

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint
```

### 添加 commit-msg 钩子

```bash
npx husky add .husky/commit-msg "npx --no-install commitlint --edit"
```

### 配合 lint-staged

只对本次暂存的文件运行检查：

```bash
npm install lint-staged --save-dev
```

配置 `package.json`：

```json
{
  "lint-staged": {
    "*.{js,ts,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss}": [
      "stylelint --fix"
    ]
  }
}
```

修改 `.husky/pre-commit`：

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

## 使用 commitlint

验证提交信息格式。

```bash
# 安装
npm install @commitlint/cli @commitlint/config-conventional --save-dev
```

创建 `commitlint.config.js`：

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
    ],
    'subject-case': [0],
  },
}
```

## 共享钩子配置

### 使用 lefthook

```bash
npm install lefthook --save-dev
```

创建 `lefthook.yml`：

```yaml
pre-commit:
  parallel: true
  commands:
    eslint:
      glob: "*.{js,ts,vue}"
      run: npx eslint {staged_files}
    prettier:
      glob: "*.{js,ts,vue,json,css}"
      run: npx prettier --write {staged_files}
      stage_fixed: true

commit-msg:
  commands:
    commitlint:
      run: npx commitlint --edit
```

### 使用 simple-git-hooks

```bash
npm install simple-git-hooks --save-dev
```

配置 `package.json`：

```json
{
  "simple-git-hooks": {
    "pre-commit": "npm run lint",
    "commit-msg": "npx commitlint --edit"
  },
  "scripts": {
    "postinstall": "npx simple-git-hooks"
  }
}
```

## 禁用钩子

临时跳过钩子（不推荐）：

```bash
# 跳过 pre-commit
git commit --no-verify -m "紧急提交"

# 或者
git commit -n -m "紧急提交"
```

## 本章小结

- Git Hooks 在特定事件时自动执行
- pre-commit 用于代码检查，commit-msg 用于验证提交信息
- Husky 简化钩子管理，lint-staged 只检查暂存文件
- commitlint 强制提交信息规范
- 团队应共享钩子配置，保证代码质量
