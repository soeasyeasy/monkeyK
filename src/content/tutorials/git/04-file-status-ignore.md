---
title: "第四章：文件状态与忽略"
description: "理解文件跟踪状态，掌握 .gitignore 配置"
---

# 第四章：文件状态与忽略

## 文件生命周期

Git 中的文件有两种状态：

| 状态 | 说明 |
| --- | --- |
| Tracked（已跟踪） | Git 已纳入版本控制的文件 |
| Untracked（未跟踪） | 存在于工作区但 Git 未跟踪的文件 |

已跟踪的文件又分为三种子状态：

```
未修改（Unmodified）→ 已修改（Modified）→ 已暂存（Staged）→ 提交
```

## .gitignore 配置

通过 `.gitignore` 文件告诉 Git 忽略哪些文件，这些文件不会被跟踪。

### 创建 .gitignore

```bash
# 在项目根目录创建
touch .gitignore
```

### 常见忽略规则

```gitignore
# 依赖目录
node_modules/
vendor/

# 构建输出
dist/
build/
*.min.js
*.min.css

# 环境变量（包含敏感信息）
.env
.env.local
.env.*.local

# 编辑器配置
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

# 不忽略 important.log
!important.log

# 忽略根目录下的 temp 文件（不包括子目录）
/temp*

# 忽略所有目录下的 build 目录
**/build/

# 忽略 doc 目录下所有 .txt 文件
doc/*.txt
```

### 规则优先级

1. 已在 Git 中跟踪的文件，`.gitignore` 不会生效
2. 如果要取消跟踪已跟踪的文件，需要先从 Git 中移除

```bash
# 从 Git 中移除但保留本地文件
git rm --cached config.json

# 然后添加到 .gitignore
echo "config.json" >> .gitignore
```

## 全局 gitignore

有些文件（如编辑器配置）在所有项目中都应该被忽略，可以设置全局忽略文件：

```bash
# 设置全局 gitignore
git config --global core.excludesFile ~/.gitignore_global
```

在 `~/.gitignore_global` 中写入通用规则：

```gitignore
.DS_Store
.idea/
.vscode/
*.swp
```

## 查看文件状态详解

```bash
# 查看简短状态
git status -s

# 输出示例：
# M  file1.txt    ← 已修改且已暂存
#  M file2.txt    ← 已修改未暂存
# A  file3.txt    ← 新文件已暂存
# ?? file4.txt    ← 未跟踪
# D  file5.txt    ← 已删除并暂存
```

## 本章小结

- 文件分为已跟踪和未跟踪两种状态
- `.gitignore` 用于忽略不需要跟踪的文件
- 已跟踪的文件不受 `.gitignore` 影响
- 可以用 `git rm --cached` 取消跟踪
