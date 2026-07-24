---
title: "第十三章：安全审计与漏洞修复"
description: "使用 npm audit 检测漏洞，学习安全最佳实践"
---

# 第十三章：安全审计与漏洞修复

## npm audit

`npm audit` 会扫描项目依赖树，检查已知安全漏洞。

```bash
# 运行安全审计
npm audit

# 输出示例：
# === npm audit security report ===
# 
# ┌───────────────┬──────────────────────┐
# │ moderate      │ Regular Expression   │
# │               │ Denial of Service    │
# ├───────────────┼──────────────────────┤
# │ Package       │ minimatch            │
# ├───────────────┼──────────────────────┤
# │ Dependency of │ gulp [dev]           │
# ├───────────────┼──────────────────────┤
# │ Path          │ gulp > minimatch     │
# ├───────────────┼──────────────────────┤
# │ More info     │ https://npmjs.com/   │
# │               │ advisories/12345     │
# └───────────────┴──────────────────────┘
# 
# found 1 moderate severity vulnerability
```

## 审计级别

| 级别 | 说明 |
| --- | --- |
| `info` | 信息，不影响安全 |
| `low` | 低风险漏洞 |
| `moderate` | 中等风险漏洞 |
| `high` | 高风险漏洞 |
| `critical` | 严重漏洞 |

```bash
# 只显示高危及以上
npm audit --audit-level=high

# 以 JSON 格式输出
npm audit --json
```

## 自动修复

```bash
# 自动修复漏洞（可能升级版本）
npm audit fix

# 更激进的修复（可能包含破坏性变更）
npm audit fix --force

# 预览修复内容（不实际执行）
npm audit fix --dry-run
```

## 手动处理

当自动修复无法解决时：

### 1. 升级依赖

```bash
# 查看过期依赖
npm outdated

# 升级指定包
npm install vulnerable-package@latest
```

### 2. 使用 overrides

```json
{
  "overrides": {
    "minimatch": "^5.0.0"
  }
}
```

### 3. 替换包

如果包长期不维护，考虑替换：

```bash
# 查找替代包
npm search alternative-package
```

## 忽略特定漏洞

```json
{
  "overrides": {
    "vulnerable-package": {
      "sub-dependency": "$sub-dependency"
    }
  }
}
```

## .npmrc 安全配置

```ini
# .npmrc
audit=true
audit-level=moderate
```

## CI/CD 集成

```yaml
# GitHub Actions
- name: Security Audit
  run: npm audit --audit-level=high
```

## 最佳实践

1. **定期运行 npm audit**：至少每周一次
2. **CI/CD 集成审计**：阻止有高危漏洞的代码合并
3. **及时更新依赖**：保持依赖最新
4. **使用 overrides**：强制修复子依赖漏洞
5. **关注安全公告**：订阅 npm 安全邮件

## 下一步

下一章我们将学习常见命令与实用技巧。
