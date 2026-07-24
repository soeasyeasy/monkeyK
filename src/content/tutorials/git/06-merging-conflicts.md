---
title: "第六章：合并与冲突"
description: "学习分支合并策略与冲突解决方法"
---

# 第六章：合并与冲突

## 合并分支

将一个分支的修改合并到当前分支。

```bash
# 确保在目标分支
git checkout main

# 合并 feature 分支
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

## 合并策略

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

## 冲突产生

当两个分支修改了同一文件的同一区域时，Git 无法自动合并，产生冲突。

```bash
git merge feature/login
# CONFLICT (content): Merge conflict in src/index.js
# Automatic merge failed; fix conflicts and then commit the result.
```

## 解决冲突

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

## 冲突预防

```bash
# 合并前先查看差异
git diff main..feature/login

# 使用 rebase 代替 merge（保持线性历史）
git checkout feature/login
git rebase main

# 频繁同步（减少冲突范围）
git pull --rebase
```

## 放弃合并

```bash
# 合并冲突时放弃
git merge --abort
```

## 本章小结

- `git merge` 将分支修改合并到当前分支
- 快进合并和三方合并是两种基本合并类型
- 冲突时手动编辑文件，删除标记后提交
- 频繁同步和合理分支策略可以减少冲突
