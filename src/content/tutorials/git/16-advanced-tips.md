---
title: "第十六章：Git 高级技巧"
description: "掌握 cherry-pick、bisect、reflog 等高级功能，优化 Git 性能"
---

# 第十六章：Git 高级技巧

## git cherry-pick

选择特定的提交应用到当前分支。

```bash
# 应用单个提交
git cherry-pick a1b2c3d

# 应用多个提交
git cherry-pick a1b2c3d e4f5g6h

# 应用一个范围的提交（不包含起始提交）
git cherry-pick a1b2c3d..e4f5g6h

# 保留原提交的作者信息
git cherry-pick --keep-redundant-commits a1b2c3d

# 不自动提交，只暂存修改
git cherry-pick --no-commit a1b2c3d
git cherry-pick -n a1b2c3d
```

**使用场景**：
- 从其他分支挑选特定修复
- 将提交应用到多个版本分支
- 恢复误删的提交

## git bisect

二分查找定位引入 bug 的提交。

```bash
# 开始 bisect
git bisect start

# 标记当前版本为坏
git bisect bad

# 标记某个历史版本为好
git bisect good a1b2c3d

# Git 会自动检出中间的提交
# 测试后标记好或坏
git bisect good  # 或 git bisect bad

# 重复直到找到问题提交

# 结束 bisect
git bisect reset
```

### 自动化 bisect

```bash
# 使用脚本自动测试
git bisect start
git bisect bad
git bisect good a1b2c3d
git bisect run npm test
```

脚本返回 0 表示好，非 0 表示坏。

## git reflog

记录 HEAD 的所有变更，包括被删除的提交。

```bash
# 查看 reflog
git reflog

# 输出示例：
# a1b2c3d HEAD@{0}: commit: feat: 添加搜索
# e4f5g6h HEAD@{1}: reset: moving to HEAD~1
# i7j8k9l HEAD@{2}: commit: fix: 修复样式
# m0n1o2p HEAD@{3}: checkout: moving from main to feature
```

### 恢复丢失的提交

```bash
# 查看 reflog 找到丢失的提交
git reflog

# 恢复到指定提交
git checkout HEAD@{3}

# 或者创建新分支
git branch recovered-branch HEAD@{3}

# 重置到指定提交
git reset --hard HEAD@{2}
```

::: tip
reflog 默认保留 90 天。这是恢复误操作数据的最后手段。
:::

## git blame

查看文件每一行的最后修改者和提交。

```bash
# 查看文件的 blame 信息
git blame src/index.js

# 显示行号
git blame -n src/index.js

# 忽略空白变化
git blame -w src/index.js

# 查看特定行的历史
git blame -L 10,20 src/index.js
```

## git shortlog

生成提交统计。

```bash
# 按作者统计提交数
git shortlog -n

# 输出示例：
#   123  John Doe
#    45  Jane Smith
#    12  Bob Wilson

# 统计提交数和代码行数
git shortlog -sn --numbered

# 查看特定文件的统计
git shortlog -n -- src/
```

## 性能优化

### 清理仓库

```bash
# 清理不可达对象
git gc

# 更激进的清理
git gc --aggressive

# 清理并压缩
git gc --prune=now
```

### 查看仓库大小

```bash
# 查看 .git 目录大小
du -sh .git

# 查看大文件
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  sort -k3 -n -r | \
  head -10
```

### 浅克隆加速

```bash
# 对于 CI/CD，使用浅克隆
git clone --depth 1 --branch main https://github.com/user/repo.git
```

## 别名配置

简化常用命令。

```bash
# 配置别名
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --all"
git config --global alias.last "log -1 HEAD"
git config --global alias.unstage "reset HEAD --"

# 使用别名
git co main
git st
git lg
```

## 实用技巧

### 查找包含特定内容的提交

```bash
# 搜索提交信息
git log --grep="登录"

# 搜索代码变更
git log -S "functionName"

# 使用正则搜索
git log -G "regex.*pattern"
```

### 查看某个文件的修改历史

```bash
# 查看文件的提交历史
git log --follow -p src/index.js

# 查看某行的修改历史
git log -L 10,20:src/index.js
```

### 比较两个分支

```bash
# 查看 main 和 feature 的差异
git diff main..feature

# 查看哪些提交在 feature 但不在 main
git log main..feature

# 查看两个分支的共同祖先
git merge-base main feature
```

### 临时忽略文件修改

```bash
# 假设文件已修改但不想提交
git update-index --assume-unchanged config.json

# 恢复跟踪
git update-index --no-assume-unchanged config.json
```

## 本章小结

- `cherry-pick` 挑选特定提交
- `bisect` 二分查找定位 bug
- `reflog` 恢复丢失的提交
- `blame` 查看文件修改历史
- 配置别名简化命令
- 定期 `git gc` 优化性能
