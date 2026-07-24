---
title: "第四章：版本控制与语义化版本"
description: "理解语义化版本规范，掌握版本范围表示法"
---

# 第四章：版本控制与语义化版本

## 语义化版本（SemVer）

npm 使用语义化版本规范：`MAJOR.MINOR.PATCH`（主版本.次版本.补丁版本）

### 版本号含义

| 部分 | 何时更新 | 示例 |
| --- | --- | --- |
| MAJOR | 不兼容的 API 变更 | 2.0.0 |
| MINOR | 向下兼容的功能性新增 | 1.1.0 |
| PATCH | 向下兼容的问题修正 | 1.0.1 |

### 预发布版本

```
1.0.0-alpha.1    # 内部测试版
1.0.0-beta.1     # 公开测试版
1.0.0-rc.1       # 候选发布版
```

### 构建元信息

```
1.0.0+build.123  # 构建信息不影响版本优先级
```

## 版本范围表示法

### 精确版本

```json
{
  "vue": "3.4.0"
}
```

只安装 3.4.0 版本。

### 版本范围符号

| 符号 | 含义 | 示例 | 匹配范围 |
| --- | --- | --- | --- |
| `^` | 兼容版本（主版本不变） | `^3.4.0` | >=3.4.0 <4.0.0 |
| `~` | 近似版本（次版本不变） | `~3.4.0` | >=3.4.0 <3.5.0 |
| `>=` | 大于等于 | `>=3.4.0` | >=3.4.0 |
| `>` | 大于 | `>3.4.0` | >3.4.0 |
| `<=` | 小于等于 | `<=3.4.0` | <=3.4.0 |
| `<` | 小于 | `<4.0.0` | <4.0.0 |
| `*` 或 `x` | 通配符 | `3.x` | >=3.0.0 <4.0.0 |
| `-` | 范围 | `3.4.0 - 3.5.0` | >=3.4.0 <=3.5.0 |

### 实际示例

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "lodash": "~4.17.0",
    "axios": ">=1.0.0",
    "react": "18.x"
  }
}
```

### 默认行为

```bash
# npm install 默认添加 ^ 前缀
npm install vue
# package.json 中为: "vue": "^3.4.0"

# 使用 -E 精确安装
npm install -E vue@3.4.0
# package.json 中为: "vue": "3.4.0"
```

## 版本锁定

### package-lock.json

npm 会自动生成 `package-lock.json` 锁定实际安装的版本。

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "packages": {
    "": {
      "name": "my-project",
      "version": "1.0.0",
      "dependencies": {
        "vue": "^3.4.0"
      }
    },
    "node_modules/vue": {
      "version": "3.4.15",
      "resolved": "https://registry.npmjs.org/vue/-/vue-3.4.15.tgz",
      "integrity": "sha512-..."
    }
  }
}
```

### 为什么需要锁定？

1. **确保团队一致性**：所有人使用完全相同的依赖版本
2. **可重复构建**：CI/CD 环境能复现本地构建
3. **避免意外更新**：防止自动安装不兼容的新版本

## 版本更新策略

### npm update

```bash
# 更新到符合版本范围的最新版本
npm update

# 更新指定包
npm update vue
```

更新规则：
- `^3.4.0` → 可能更新到 `3.4.15`、`3.5.0`，但不会到 `4.0.0`
- `~3.4.0` → 可能更新到 `3.4.15`，但不会到 `3.5.0`

### 查看可更新版本

```bash
# 查看所有过期依赖
npm outdated

# 输出示例：
# Package  Current  Wanted  Latest
# vue      3.4.0    3.4.15  3.4.15
# lodash   4.17.0   4.17.21 4.17.21
```

### 强制更新到特定版本

```bash
npm install vue@3.5.0
```

## 版本冲突解决

### peerDependencies 冲突

```bash
# 错误示例
npm ERR! Could not resolve dependency:
npm ERR! peer vue@"^2.0.0" from some-old-lib@1.0.0

# 解决方案 1：使用 --legacy-peer-deps
npm install --legacy-peer-deps

# 解决方案 2：使用 overrides（npm 8.3+）
```

### overrides 字段

在 `package.json` 中强制指定子依赖版本：

```json
{
  "overrides": {
    "lodash": "4.17.21",
    "minimist": "^1.2.8"
  }
}
```

## 版本标签（Tags）

npm 支持为版本打标签：

```bash
# 发布时指定标签
npm publish --tag beta

# 安装指定标签版本
npm install vue@beta

# 查看包的所有标签
npm dist-tags vue

# 添加标签
npm dist-tags add vue@3.4.0 next

# 移除标签
npm dist-tags rm vue next
```

常用标签：
- `latest`：默认标签，稳定版
- `beta`：测试版
- `next`：下一个大版本预览

## 最佳实践

1. **始终提交 package-lock.json**：确保团队和 CI 环境一致
2. **使用 `^` 而非 `~`**：允许次版本更新以获取新功能和修复
3. **定期运行 `npm outdated`**：及时了解依赖更新情况
4. **谨慎使用 `*`**：可能导致安装不兼容的新版本
5. **使用 overrides 解决冲突**：避免 `--legacy-peer-deps` 的潜在风险

## 下一步

下一章我们将学习如何使用 npm scripts 自动化任务。
