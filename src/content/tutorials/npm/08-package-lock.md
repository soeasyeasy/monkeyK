---
title: "第八章：package-lock.json"
description: "理解锁定文件的作用、生成机制与团队协作最佳实践"
---

# 第八章：package-lock.json

## 什么是 package-lock.json

`package-lock.json` 是 npm 自动生成的文件，记录了依赖树的精确版本信息。

## 为什么需要它

假设 `package.json` 中：

```json
{
  "dependencies": {
    "vue": "^3.4.0"
  }
}
```

| 场景 | 没有 lock 文件 | 有 lock 文件 |
| --- | --- | --- |
| 今天安装 | vue@3.4.15 | vue@3.4.15 |
| 下周安装 | vue@3.4.20（可能引入 bug） | vue@3.4.15（锁定） |
| 同事安装 | 版本可能不同 | 完全一致 |

## 文件结构

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "my-project",
      "version": "1.0.0",
      "dependencies": {
        "vue": "^3.4.0"
      },
      "devDependencies": {
        "vite": "^5.0.0"
      }
    },
    "node_modules/vue": {
      "version": "3.4.15",
      "resolved": "https://registry.npmjs.org/vue/-/vue-3.4.15.tgz",
      "integrity": "sha512-abc...",
      "dependencies": {
        "@vue/compiler-dom": "3.4.15",
        "@vue/runtime-dom": "3.4.15"
      }
    },
    "node_modules/@vue/compiler-dom": {
      "version": "3.4.15",
      "resolved": "https://registry.npmjs.org/@vue/compiler-dom/-/compiler-dom-3.4.15.tgz",
      "integrity": "sha512-xyz..."
    }
  }
}
```

### 关键字段

| 字段 | 说明 |
| --- | --- |
| `lockfileVersion` | 锁定文件格式版本（npm 7+ 为 3） |
| `packages` | 所有包的详细信息 |
| `version` | 精确安装的版本号 |
| `resolved` | 包的下载地址 |
| `integrity` | 包的完整性校验（SHA512） |
| `dependencies` | 该包的子依赖 |

## 何时更新

### 会更新 lock 文件

```bash
# 安装新包
npm install vue

# 更新包
npm update vue

# 不带参数安装
npm install
```

### 不会更新 lock 文件

```bash
# CI 环境安装（严格模式）
npm ci
```

## npm install vs npm ci

| 特性 | npm install | npm ci |
| --- | --- | --- |
| 要求 lock 文件 | 否 | 是 |
| 更新 lock 文件 | 是 | 否 |
| 速度 | 较慢 | 更快 |
| 一致性 | 可能不同 | 完全一致 |
| 适用场景 | 开发环境 | CI/CD |

### 使用 npm ci

```bash
# CI/CD 环境推荐
npm ci

# 等同于
rm -rf node_modules
npm install
```

## 团队协作

### 必须提交 lock 文件

```bash
# .gitignore 中不要包含
# package-lock.json  ← 不要加这行

# 应该提交
git add package-lock.json
git commit -m "chore: update lock file"
```

### 解决冲突

当多人同时修改依赖时可能产生冲突：

```bash
# 方法 1：接受任一方的 lock 文件，然后重新安装
git checkout --theirs package-lock.json
npm install

# 方法 2：删除后重新生成
rm package-lock.json
npm install
```

## 完整性校验

`integrity` 字段确保包的完整性：

```json
{
  "integrity": "sha512-abc123..."
}
```

npm 安装时会校验下载包的哈希值，防止篡改。

## 锁定文件版本

| npm 版本 | lockfileVersion |
| --- | --- |
| npm 5-6 | 1 |
| npm 7+ | 2 |
| npm 9+ | 3 |

## 最佳实践

1. **始终提交 package-lock.json**
2. **CI/CD 使用 npm ci**
3. **不要手动编辑 lock 文件**
4. **冲突时删除重装**
5. **定期更新依赖并重新生成 lock 文件**

## 下一步

下一章我们将学习如何发布自己的 npm 包。
