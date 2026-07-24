---
title: "第十章：私有包与组织"
description: "学习 npm Organizations、私有包发布与访问控制"
---

# 第十章：私有包与组织

## 什么是 npm Organizations

npm Organizations（组织）允许团队协作管理私有包和公共包。

| 功能 | 说明 |
| --- | --- |
| 私有包发布 | 仅组织成员可访问 |
| 团队管理 | 细粒度的权限控制 |
| 计费管理 | 统一管理订阅费用 |
| 审计日志 | 追踪包操作记录 |

## 创建组织

1. 访问 [npm 官网](https://www.npmjs.com/)
2. 点击 "Organizations" → "Create Organization"
3. 填写组织信息
4. 选择订阅计划

### 订阅计划

| 计划 | 价格 | 功能 |
| --- | --- | --- |
| Free | $0 | 仅公共包 |
| Teams | $7/用户/月 | 私有包 + 团队管理 |
| Enterprise | 联系销售 | 高级功能 |

## 发布私有包

### 配置 package.json

```json
{
  "name": "@myorg/my-private-lib",
  "version": "1.0.0",
  "publishConfig": {
    "access": "restricted"
  }
}
```

### 发布

```bash
# 登录组织账号
npm login

# 发布私有包
npm publish
```

## 使用私有包

### 认证

```bash
# 方法 1：登录
npm login

# 方法 2：使用 token
npm set //registry.npmjs.org/:_authToken=<token>
```

### 安装

```bash
npm install @myorg/my-private-lib
```

### .npmrc 配置

```ini
# .npmrc
@myorg:registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=<token>
```

## 团队管理

### 创建团队

1. 进入组织设置
2. 点击 "Teams" → "Create Team"
3. 设置团队名称和权限

### 权限级别

| 权限 | 说明 |
| --- | --- |
| Read-only | 只能安装和使用包 |
| Read & Write | 可以发布和更新包 |
| Admin | 完全管理权限 |

### 添加成员

```bash
# 邀请成员（网页操作）
# Organizations → Members → Invite

# 添加成员到团队
# Teams → Team Name → Add Member
```

## 访问控制

### 包级别权限

```bash
# 授予团队访问权限
npm access grant read-only @myorg:developers @myorg/my-private-lib
npm access grant read-write @myorg:core-team @myorg/my-private-lib

# 撤销权限
npm access revoke @myorg:developers @myorg/my-private-lib

# 查看权限
npm access ls-packages @myorg:developers
```

### 组织级别权限

| 角色 | 说明 |
| --- | --- |
| Owner | 组织所有者，可管理计费和成员 |
| Admin | 可管理包和团队 |
| Member | 可访问被授权的包 |

## 私有包最佳实践

### 1. 使用 .npmrc 管理认证

```ini
# 项目根目录 .npmrc
@myorg:registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

### 2. 环境变量存储 token

```bash
# .env（不要提交到 Git）
NPM_TOKEN=npm_xxxxxxxxxxxx

# CI/CD 环境变量
# GitHub Actions: Settings → Secrets → NPM_TOKEN
```

### 3. CI/CD 配置

```yaml
# .github/workflows/publish.yml
name: Publish
on:
  release:
    types: [created]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 私有包 vs 公共包

| 特性 | 公共包 | 私有包 |
| --- | --- | --- |
| 可见性 | 所有人 | 仅组织成员 |
| 费用 | 免费 | 付费计划 |
| 命名 | `package-name` | `@org/package-name` |
| 适用场景 | 开源库 | 企业内部包 |

## 迁移到私有包

```bash
# 1. 修改 package.json 的 name
{
  "name": "@myorg/old-public-lib"
}

# 2. 发布私有版本
npm publish

# 3. 废弃公共版本
npm deprecate old-public-lib "已迁移到 @myorg/old-public-lib"
```

## 常见问题

### 402 Payment Required

```bash
# 组织订阅过期或未设置支付方式
# 访问 https://www.npmjs.com/settings/<org>/billing
```

### 404 Not Found

```bash
# 未登录或无权限
npm login
# 或检查 token 是否有效
```

## 下一步

下一章我们将学习 npm workspaces 与 Monorepo 管理。
