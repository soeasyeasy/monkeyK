---
title: '第十五章：子模块与大型项目'
description: '使用子模块管理依赖项目，掌握大型仓库的管理技巧'
---

# 第十五章：子模块与大型项目

## 什么是子模块

子模块允许在一个 Git 仓库中嵌套另一个独立的 Git 仓库。适合管理共享库、第三方依赖等。

```
main-project/
├── .git/
├── src/
├── libs/
│   └── shared-lib/    ← 子模块（独立仓库）
│       ├── .git/
│       └── ...
└── ...
```

## 添加子模块

```bash
# 添加子模块
git submodule add https://github.com/user/shared-lib.git libs/shared-lib

# 指定分支
git submodule add -b main https://github.com/user/shared-lib.git libs/shared-lib
```

这会：

1. 克隆子模块到指定目录
2. 创建 `.gitmodules` 文件记录子模块配置
3. 记录子模块当前指向的提交

### .gitmodules 文件

```ini
[submodule "libs/shared-lib"]
    path = libs/shared-lib
    url = https://github.com/user/shared-lib.git
    branch = main
```

## 克隆包含子模块的仓库

```bash
# 方式一：递归克隆（推荐）
git clone --recurse-submodules https://github.com/user/main-project.git

# 方式二：克隆后初始化
git clone https://github.com/user/main-project.git
cd main-project
git submodule init
git submodule update

# 或者一步完成
git submodule update --init --recursive
```

## 更新子模块

子模块默认不会随主项目自动更新。

```bash
# 拉取子模块的最新更改
git submodule update --remote

# 或者进入子模块目录手动拉取
cd libs/shared-lib
git pull origin main
cd ../..

# 提交子模块的更新
git add libs/shared-lib
git commit -m "chore: 更新 shared-lib 到最新版本"
```

### 批量更新所有子模块

```bash
# 更新所有子模块到远程最新
git submodule update --remote --recursive

# 或者
git submodule foreach 'git pull origin main'
```

## 子模块工作流

### 修改子模块

```bash
# 1. 进入子模块目录
cd libs/shared-lib

# 2. 创建分支并修改
git checkout -b feature/improvement
# ... 修改代码 ...
git commit -m "feat: 添加新功能"

# 3. 推送子模块的修改
git push -u origin feature/improvement

# 4. 在主项目中更新子模块引用
cd ../..
git add libs/shared-lib
git commit -m "chore: 更新 shared-lib 引用"
```

### 切换到特定提交

```bash
# 进入子模块
cd libs/shared-lib

# 切换到特定提交或标签
git checkout v1.2.0

# 回到主项目提交
cd ../..
git add libs/shared-lib
git commit -m "chore: 锁定 shared-lib 到 v1.2.0"
```

## 删除子模块

```bash
# 1. 从 .gitmodules 中删除配置
git submodule deinit -f libs/shared-lib

# 2. 删除子模块目录
rm -rf libs/shared-lib

# 3. 删除 .git/modules 中的缓存
rm -rf .git/modules/libs/shared-lib

# 4. 提交更改
git add .
git commit -m "chore: 移除 shared-lib 子模块"
```

## 大型仓库管理

### Sparse Checkout（稀疏检出）

只检出仓库的部分目录，适合大型单仓库（monorepo）。

```bash
# 启用稀疏检出
git config core.sparseCheckout true

# 指定要检出的目录
echo "src/frontend" >> .git/info/sparse-checkout
echo "shared/libs" >> .git/info/sparse-checkout

# 应用配置
git read-tree -mu HEAD
```

### Shallow Clone（浅克隆）

只克隆最近的提交历史，减少克隆时间。

```bash
# 只克隆最近 1 次提交
git clone --depth 1 https://github.com/user/repo.git

# 只克隆特定分支
git clone --depth 1 --branch main https://github.com/user/repo.git

# 后续需要完整历史时
git fetch --unshallow
```

### Partial Clone（部分克隆）

克隆时不下载所有文件对象，按需获取。

```bash
# 部分克隆（不下载所有 blob）
git clone --filter=blob:none https://github.com/user/repo.git

# 克隆时排除大文件
git clone --filter=blob:limit=1m https://github.com/user/repo.git
```

## Git LFS（Large File Storage）

管理大文件（如图片、视频、二进制文件）。

```bash
# 安装 Git LFS
git lfs install

# 跟踪大文件类型
git lfs track "*.psd"
git lfs track "*.mp4"

# 提交 .gitattributes
git add .gitattributes

# 正常添加和提交大文件
git add large-file.psd
git commit -m "feat: 添加设计文件"
git push
```

## 本章小结

- 子模块用于嵌套独立仓库
- 克隆时需要 `--recurse-submodules`
- 子模块需要手动更新和提交引用
- 大型仓库可使用稀疏检出、浅克隆优化
- Git LFS 管理大文件
