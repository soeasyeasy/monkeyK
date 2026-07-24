---
title: "第九章：发布自己的包"
description: "学习如何准备、发布和更新 npm 包"
---

# 第九章：发布自己的包

## 发布前准备

### 1. 注册 npm 账号

```bash
# 注册账号
npm adduser

# 或访问 https://www.npmjs.com/signup

# 登录
npm login

# 验证登录状态
npm whoami
```

### 2. 配置 package.json

```json
{
  "name": "my-awesome-lib",
  "version": "1.0.0",
  "description": "一个有用的工具库",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "keywords": ["utility", "tools"],
  "author": "Your Name <email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/user/my-awesome-lib"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 3. 准备发布内容

```javascript
// src/index.js
export function add(a, b) {
  return a + b
}

export function multiply(a, b) {
  return a * b
}
```

### 4. 构建

```bash
# 使用 TypeScript 编译
npx tsc

# 或使用构建工具
npx vite build
```

## 发布流程

### 首次发布

```bash
# 发布到 npm
npm publish

# 如果是 scoped 包（@scope/package）
npm publish --access public
```

### 检查发布内容

```bash
# 预览将发布的文件
npm pack --dry-run

# 输出示例：
# npm notice 📦 my-awesome-lib@1.0.0
# npm notice === Tarball Contents ===
# npm notice 1.2kB dist/index.js
# npm notice 0.8kB dist/index.mjs
# npm notice 0.5kB package.json
```

## 版本更新

### 自动更新版本号

```bash
# 补丁版本：1.0.0 → 1.0.1
npm version patch

# 次版本：1.0.0 → 1.1.0
npm version minor

# 主版本：1.0.0 → 2.0.0
npm version major

# 预发布版本
npm version prerelease        # 1.0.0 → 1.0.1-0
npm version preminor          # 1.0.0 → 1.1.0-0
npm version premajor          # 1.0.0 → 2.0.0-0

# 指定版本
npm version 2.0.0-beta.1
```

### 发布更新

```bash
# 更新版本号
npm version patch

# 发布
npm publish

# 推送标签到 Git
git push && git push --tags
```

## 发布标签

```bash
# 发布为 beta 版本
npm publish --tag beta

# 发布为 next 版本
npm publish --tag next

# 安装指定标签
npm install my-awesome-lib@beta
```

## 取消发布

```bash
# 72 小时内可取消
npm unpublish my-awesome-lib@1.0.0

# 取消整个包（72 小时内）
npm unpublish my-awesome-lib --force
```

## 废弃版本

```bash
# 标记版本为废弃
npm deprecate my-awesome-lib@1.0.0 "此版本有安全问题，请升级到 1.0.1"

# 废弃所有版本
npm deprecate my-awesome-lib "此包已废弃，请使用 new-package"
```

## Scoped 包

```json
{
  "name": "@myorg/my-lib"
}
```

```bash
# 发布 scoped 包需要指定 public
npm publish --access public

# 安装
npm install @myorg/my-lib
```

## 发布检查清单

- [ ] `name` 未被占用
- [ ] `version` 已更新
- [ ] `files` 字段正确配置
- [ ] `main`/`module`/`types` 指向正确文件
- [ ] `README.md` 包含使用说明
- [ ] `LICENSE` 文件存在
- [ ] 测试通过
- [ ] 构建产物已生成

## 最佳实践

1. **使用 files 字段**：只发布必要文件
2. **编写清晰的 README**：包含安装、使用、API 文档
3. **遵循语义化版本**：正确使用 patch/minor/major
4. **添加 CHANGELOG**：记录每个版本的变更
5. **使用 CI/CD 自动发布**：避免手动操作失误

## 下一步

下一章我们将学习私有包与组织管理。
