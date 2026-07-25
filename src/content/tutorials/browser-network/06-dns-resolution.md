---
title: "第六章：DNS 解析过程"
description: "域名系统、递归查询、DNS 缓存、DNS 记录类型"
---

# 第六章：DNS 解析过程

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 我在浏览器输入 `www.baidu.com` 之后，浏览器怎么知道这台服务器在哪里？
- 域名和 IP 地址到底是什么关系？为什么需要 DNS 这个"翻译官"？
- DNS 解析到底要经过多少步？为什么有时候网页加载特别慢？
- DNS 缓存是什么？为什么改了域名解析之后不是立刻生效？

这一章就是为了解答这些问题。我们会从 DNS 的基本概念讲起，搞清楚域名到 IP 地址的完整转换过程，了解 DNS 缓存的层级结构，最后学习如何在实际开发中优化 DNS 解析。学完这章，你就能理解"域名解析"这件事的来龙去脉了。

---

## 6.1 为什么需要 DNS？

### 没有 DNS 的时候有多痛苦

想象一下，你要给朋友打电话。如果你不记得朋友的电话号码，你只能翻通讯录找到名字对应的号码。如果没有通讯录，你就得记住每个人的号码——这几乎不可能。

互联网也是这样。计算机之间通信用的是 IP 地址（比如 `142.250.10.99`），但人类根本记不住这些数字。DNS（Domain Name System，域名系统）就是互联网的"通讯录"，它把人类能记住的域名（比如 `www.google.com`）转换成计算机能理解的 IP 地址。

打个比方：

> DNS 就像手机里的通讯录：
> - 你记得朋友叫"小明"（域名）
> - 但打电话需要他的号码 `138xxxx1234`（IP 地址）
> - 通讯录帮你把"小明"翻译成号码（DNS 解析）
> - 而且通讯录有缓存功能，最近联系过的人不用每次都查（DNS 缓存）

没有 DNS，你每次上网都得记住一堆 IP 地址，就像没有通讯录你得背下所有朋友的电话号码一样。

---

## 6.2 核心原理

### 6.2.1 DNS 的基本概念

DNS 是一个分布式数据库系统，它的主要工作就是：

**域名 → IP 地址**（正向解析）
**IP 地址 → 域名**（反向解析）

我们平时说的"DNS 解析"一般指正向解析。

| 概念 | 说明 | 生活类比 |
| --- | --- | --- |
| 域名 | 人类可读的网站地址 | 朋友的名字"小明" |
| IP 地址 | 计算机可读的数字地址 | 电话号码 `138xxxx1234` |
| DNS 服务器 | 提供域名到 IP 转换服务的服务器 | 通讯录/电话簿 |
| DNS 解析 | 查询域名对应 IP 的过程 | 在通讯录里查号码 |

### 6.2.2 DNS 解析的完整流程

当你在浏览器输入 `www.example.com` 之后，DNS 解析会按照以下顺序进行：

```
第1步：浏览器缓存
   ↓（没找到）
第2步：操作系统缓存
   ↓（没找到）
第3步：本地 hosts 文件
   ↓（没找到）
第4步：本地 DNS 服务器（你的网络运营商提供）
   ↓（没找到）
第5步：根域名服务器
   ↓（返回 .com 顶级域名服务器地址）
第6步：顶级域名服务器（.com）
   ↓（返回 example.com 权威域名服务器地址）
第7步：权威域名服务器
   ↓（返回 www.example.com 的 IP 地址）
第8步：返回给浏览器，浏览器缓存结果
```

打个比方：

> 你想知道"张三"住在哪：
> 1. 先问自己记不记得（浏览器缓存）
> 2. 不记得就问家人（操作系统缓存）
> 3. 家人也不记得就翻家里的通讯录（hosts 文件）
> 4. 通讯录也没有就打 114 查询台（本地 DNS 服务器）
> 5. 114 说"我先帮你查一下姓张的住在哪个区"（根域名服务器）
> 6. 区里说"张三住在幸福小区"（顶级域名服务器）
> 7. 幸福小区物业说"张三住3号楼502"（权威域名服务器）
> 8. 你把地址记下来，下次就不用再问了（DNS 缓存）

### 6.2.3 域名的层级结构

域名是从右往左分层的，每一层都有自己的服务器：

```
www.example.com
  ↑       ↑    ↑
  |       |    └── 顶级域名（TLD）：.com
  |       └─────── 二级域名：example
  └─────────────── 主机名：www
```

| 层级 | 示例 | 说明 | 服务器数量 |
| --- | --- | --- | --- |
| 根域名 | .（通常省略） | 最顶层，管理所有顶级域名 | 全球 13 组（逻辑上） |
| 顶级域名 | .com / .org / .cn | 管理某个类别或国家的域名 | 几百个 |
| 二级域名 | example.com | 具体的组织或个人注册的域名 | 几亿个 |
| 主机名 | www.example.com | 域名下的具体主机 | 无数个 |

### 6.2.4 递归查询 vs 迭代查询

DNS 查询有两种方式，搞清楚这个很重要：

| 查询方式 | 谁负责查 | 过程 | 生活类比 |
| --- | --- | --- | --- |
| 递归查询 | 本地 DNS 服务器负责到底 | 客户端问一次，本地 DNS 帮你问到底，最后直接给你答案 | 你问前台"张三住哪"，前台帮你查清楚后直接告诉你 |
| 迭代查询 | 本地 DNS 服务器自己一级一级问 | 每次只告诉你"下一步去问谁"，本地 DNS 自己跑腿 | 你问前台，前台说"你去问A部门"，A部门说"你去问B部门"，最后B部门告诉你答案 |

实际过程中，客户端到本地 DNS 是递归查询，本地 DNS 到根/顶级/权威服务器是迭代查询。

### 6.2.5 DNS 记录类型

DNS 服务器上存储着各种类型的记录，不同的记录有不同的用途：

| 记录类型 | 做什么用 | 示例 | 生活类比 |
| --- | --- | --- | --- |
| A 记录 | 域名 → IPv4 地址 | example.com → 93.184.216.34 | 名字对应手机号 |
| AAAA 记录 | 域名 → IPv6 地址 | example.com → 2606:2800:220:1:248:1893:25c8:1946 | 名字对应新式长号码 |
| CNAME 记录 | 域名 → 另一个域名（别名） | www.example.com → example.com | 小名对应大名 |
| MX 记录 | 指定邮件服务器 | example.com → mail.example.com | 指定收信地址 |
| TXT 记录 | 存储文本信息（常用于验证） | "google-site-verification=xxx" | 贴在门上的便签 |
| NS 记录 | 指定哪个 DNS 服务器管理这个域名 | example.com → ns1.example.com | 指定哪个物业管这个小区 |

### 6.2.6 DNS 缓存和 TTL

DNS 缓存是加速解析的关键，但缓存不能永久保存，需要 TTL（Time To Live，生存时间）来控制过期时间。

| 缓存层级 | 位置 | 速度 | 容量 | TTL 范围 |
| --- | --- | --- | --- | --- |
| 浏览器缓存 | 内存 | 最快 | 较小 | 几分钟到几小时 |
| 操作系统缓存 | 内存 | 快 | 中等 | 几分钟到几小时 |
| 本地 DNS 缓存 | 磁盘/内存 | 中等 | 大 | 几小时到几天 |
| 根/顶级 DNS | 分布式集群 | 慢 | 超大 | 几天到几周 |

TTL 的作用：

- TTL = 3600 表示这条记录可以缓存 3600 秒（1 小时）
- 超过 TTL 后，缓存失效，需要重新查询
- TTL 越短，解析越及时，但查询次数越多，速度越慢
- TTL 越长，速度越快，但域名变更后生效越慢

---

## 6.3 基础用法 + 逐行注释

### 6.3.1 在浏览器中查看 DNS 解析时间

```javascript
// 使用 Performance API 查看 DNS 解析耗时
// 这可以帮助你了解 DNS 解析对页面加载速度的影响

// 获取页面加载的性能数据
const timing = performance.getEntriesByType('navigation')[0]

// 查看 DNS 解析耗时（单位：毫秒）
// domainLookupStart：DNS 查询开始时间
// domainLookupEnd：DNS 查询结束时间
const dnsTime = timing.domainLookupEnd - timing.domainLookupStart
console.log(`DNS 解析耗时: ${dnsTime} 毫秒`)

// 查看完整的加载时间线
console.log(`重定向耗时: ${timing.redirectEnd - timing.redirectStart} 毫秒`)
console.log(`DNS 查询耗时: ${timing.domainLookupEnd - timing.domainLookupStart} 毫秒`)
console.log(`TCP 连接耗时: ${timing.connectEnd - timing.connectStart} 毫秒`)
console.log(`请求响应耗时: ${timing.responseEnd - timing.requestStart} 毫秒`)
console.log(`DOM 解析耗时: ${timing.domComplete - timing.domInteractive} 毫秒`)
console.log(`总加载耗时: ${timing.loadEventEnd - timing.startTime} 毫秒`)
```

### 6.3.2 使用 dns-prefetch 预解析 DNS

```html
<!-- 在 HTML 头部添加 DNS 预解析提示 -->
<!-- 这会让浏览器提前解析指定域名的 DNS，加快后续资源加载 -->

<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  
  <!-- 预解析 Google Fonts 的 DNS -->
  <!-- 浏览器会在空闲时提前查询 fonts.googleapis.com 的 IP -->
  <link rel="dns-prefetch" href="//fonts.googleapis.com">
  
  <!-- 预解析 CDN 的 DNS -->
  <!-- 提前解析 CDN 域名，加快静态资源加载 -->
  <link rel="dns-prefetch" href="//cdn.example.com">
  
  <!-- 预解析第三方 API 的 DNS -->
  <!-- 如果页面会调用第三方 API，提前解析可以节省时间 -->
  <link rel="dns-prefetch" href="//api.example.com">
  
  <title>DNS 预解析示例</title>
</head>
<body>
  <h1>DNS 预解析示例</h1>
  
  <!-- 使用预解析过的字体 -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto">
  
  <!-- 使用预解析过的 CDN 资源 -->
  <script src="https://cdn.example.com/lib.js"></script>
</body>
</html>
```

### 6.3.3 使用 preconnect 建立完整连接

```html
<!-- preconnect 比 dns-prefetch 更激进 -->
<!-- 它不仅预解析 DNS，还会建立 TCP 连接和 TLS 握手 -->

<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  
  <!-- 预连接 Google Fonts（包含 DNS + TCP + TLS） -->
  <!-- 这会建立完整的连接，后续加载资源时直接复用 -->
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
  
  <!-- 预连接 CDN（包含 DNS + TCP + TLS） -->
  <!-- crossorigin 属性表示会进行 CORS 预检 -->
  <link rel="preconnect" href="https://cdn.example.com" crossorigin>
  
  <title>预连接示例</title>
</head>
<body>
  <h1>预连接示例</h1>
  
  <!-- 这些资源会复用之前建立的连接，加载更快 -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto">
  <script src="https://cdn.example.com/lib.js"></script>
</body>
</html>
```

### 6.3.4 在 Node.js 中使用 DNS 查询

```javascript
// Node.js 提供了 dns 模块，可以进行 DNS 查询

// 引入 dns 模块
const dns = require('dns')

// ========== dns.lookup ==========
// 解析域名到 IP 地址（会使用系统缓存）
dns.lookup('www.example.com', (err, address, family) => {
  // 如果出错，打印错误信息
  if (err) {
    console.error(`解析失败: ${err.message}`)
    return
  }
  
  // address 是 IP 地址
  // family 是 IP 版本（4 或 6）
  console.log(`IP 地址: ${address}`)
  console.log(`IP 版本: IPv${family}`)
})

// ========== dns.resolve4 ==========
// 直接查询 DNS 服务器，不使用系统缓存
// 只查询 A 记录（IPv4）
dns.resolve4('www.example.com', (err, addresses) => {
  if (err) {
    console.error(`查询失败: ${err.message}`)
    return
  }
  
  // addresses 是一个数组，因为一个域名可能有多个 IP
  console.log(`IPv4 地址列表:`)
  addresses.forEach(addr => {
    console.log(`  - ${addr}`)
  })
})

// ========== dns.resolveMx ==========
// 查询 MX 记录（邮件服务器）
dns.resolveMx('example.com', (err, addresses) => {
  if (err) {
    console.error(`查询失败: ${err.message}`)
    return
  }
  
  console.log(`邮件服务器:`)
  addresses.forEach(record => {
    // priority 是优先级，数字越小优先级越高
    // exchange 是邮件服务器域名
    console.log(`  - ${record.exchange} (优先级: ${record.priority})`)
  })
})

// ========== dns.resolveTxt ==========
// 查询 TXT 记录（常用于域名验证）
dns.resolveTxt('example.com', (err, records) => {
  if (err) {
    console.error(`查询失败: ${err.message}`)
    return
  }
  
  console.log(`TXT 记录:`)
  records.forEach(record => {
    // 每条 TXT 记录是一个字符串数组
    console.log(`  - ${record.join('')}`)
  })
})
```

### 6.3.5 使用 Promise 封装 DNS 查询

```javascript
// 将 dns.lookup 封装成 Promise 版本，方便使用 async/await
const dns = require('dns')
const { promisify } = require('util')

// 使用 util.promisify 将回调函数风格的 API 转成 Promise
const lookupAsync = promisify(dns.lookup)
const resolve4Async = promisify(dns.resolve4)

// 定义异步函数
async function checkDomain(domain) {
  try {
    // 等待 DNS 查询完成
    const { address, family } = await lookupAsync(domain)
    console.log(`${domain} 的 IP 地址: ${address} (IPv${family})`)
    
    // 查询所有 IPv4 地址
    const addresses = await resolve4Async(domain)
    console.log(`${domain} 的所有 IPv4 地址:`)
    addresses.forEach(addr => {
      console.log(`  - ${addr}`)
    })
    
    // 返回解析结果
    return { domain, address, family, addresses }
  } catch (error) {
    // 捕获并处理错误
    console.error(`解析 ${domain} 失败: ${error.message}`)
    return null
  }
}

// 调用函数
checkDomain('www.google.com')
// 输出类似:
// www.google.com 的 IP 地址: 142.250.10.99 (IPv4)
// www.google.com 的所有 IPv4 地址:
//   - 142.250.10.99
```

---

## 6.4 对比表格

### dns-prefetch vs preconnect

| 对比项 | dns-prefetch | preconnect |
| --- | --- | --- |
| 做什么 | 只预解析 DNS | 预解析 DNS + 建立 TCP 连接 + TLS 握手 |
| 速度提升 | 较小（只省 DNS 查询时间） | 较大（省了 DNS + TCP + TLS 的时间） |
| 资源消耗 | 很低 | 中等（会占用连接资源） |
| 使用场景 | 第三方资源、不确定是否一定会用 | 确定会用的重要资源（字体、CDN） |
| 浏览器支持 | 所有现代浏览器 | 所有现代浏览器 |

### 各种 DNS 记录类型对比

| 记录类型 | 指向 | 典型用途 | 示例 |
| --- | --- | --- | --- |
| A | IPv4 地址 | 网站主记录 | example.com → 93.184.216.34 |
| AAAA | IPv6 地址 | 支持 IPv6 的网站 | example.com → 2606:2800:... |
| CNAME | 另一个域名 | 别名、CDN 接入 | www.example.com → example.com |
| MX | 邮件服务器域名 | 指定邮件接收服务器 | example.com → mail.example.com |
| TXT | 文本 | 域名验证、SPF、DKIM | "v=spf1 include:_spf.google.com ~all" |
| NS | DNS 服务器域名 | 指定域名由哪个 DNS 服务器管理 | example.com → ns1.example.com |

---

## 6.5 新手常见误区

### 误区 1："改了 DNS 记录后立刻生效"

**不对。** DNS 有缓存机制，修改 DNS 记录后，需要等待 TTL 过期才能生效。如果你把 TTL 设置为 1 小时，那么修改后最多需要 1 小时才能全球生效。而且不同的 DNS 服务器、不同的用户本地缓存都可能延迟生效。

```javascript
// 错误做法：修改 DNS 后立即测试
// ❌ 修改了 example.com 的 A 记录
// ❌ 立刻访问 example.com 发现还是旧 IP
// ❌ 以为修改没生效

// 正确做法：
// ✅ 修改前先检查当前 TTL 值
// ✅ 如果需要立即生效，先把 TTL 改小（比如 300 秒）
// ✅ 等待 TTL 过期后再修改记录
// ✅ 修改后再等待 TTL 过期才能确认全球生效
```

### 误区 2："DNS 解析越快越好，TTL 设置得越短越好"

**不一定。** TTL 越短，DNS 记录更新越快，但也会导致：
- 用户每次访问都要重新查询 DNS，增加延迟
- DNS 服务器负载增加
- 如果 DNS 服务器挂了，缓存过期后用户就无法访问

合理的做法：
- 稳定不变的记录（如主域名）：TTL 设置为几天
- 可能变化的记录（如 CDN 域名）：TTL 设置为几分钟到几小时
- 需要快速切换的记录（如故障转移）：TTL 设置为 300 秒（5 分钟）

### 误区 3："一个域名只能对应一个 IP 地址"

**错。** 一个域名可以对应多个 IP 地址，这叫 DNS 轮询（Round Robin）。当用户查询域名时，DNS 服务器会返回多个 IP，浏览器会随机选择一个使用。这样可以实现简单的负载均衡。

```javascript
// 一个域名可以有多个 A 记录
// example.com → 93.184.216.34
// example.com → 93.184.216.35
// example.com → 93.184.216.36

// DNS 查询时会返回所有 IP
dns.resolve4('example.com', (err, addresses) => {
  console.log(addresses)
  // 输出: ['93.184.216.34', '93.184.216.35', '93.184.216.36']
})
```

### 误区 4："CNAME 记录可以指向任何域名"

**不完全对。** CNAME 记录只能指向另一个域名，不能指向 IP 地址。而且 CNAME 记录不能和其他记录（如 MX、TXT）共存于同一个域名。如果你想让 `www.example.com` 指向 `example.com`，应该用 CNAME；但如果想让 `example.com` 指向 IP，应该用 A 记录。

```javascript
// 正确用法：
// www.example.com  CNAME  example.com  （别名指向）
// example.com      A      93.184.216.34 （指向 IP）

// 错误用法：
// ❌ www.example.com  CNAME  93.184.216.34  （CNAME 不能指向 IP）
// ❌ example.com      CNAME  www.example.com （根域名不建议用 CNAME）
```

### 误区 5："DNS 解析只在第一次访问时发生"

**不对。** DNS 解析会在以下情况重新发生：
- DNS 缓存过期（超过 TTL）
- 浏览器重启（浏览器缓存清空）
- 手动清除 DNS 缓存
- 切换网络（新的网络环境没有旧缓存）

所以即使你访问过某个网站，下次访问时如果缓存过期了，还是会重新进行 DNS 解析。

---

## 6.6 动手练习

### 练习 1（基础）：DNS 解析顺序

请按顺序列出 DNS 解析的 8 个步骤，并说明每一步的作用。

<details>
<summary>点击查看答案</summary>

```
DNS 解析的完整流程：

第1步：浏览器缓存
- 浏览器会缓存最近访问过的域名解析结果
- 如果找到，直接返回 IP，解析结束
- 缓存时间较短（几分钟）

第2步：操作系统缓存
- 浏览器缓存没找到，查询系统缓存
- Windows: ipconfig /displaydns
- Mac/Linux: 查看系统 DNS 缓存
- 如果找到，返回 IP，解析结束

第3步：本地 hosts 文件
- 检查本地的 hosts 文件
- Windows: C:\Windows\System32\drivers\etc\hosts
- Mac/Linux: /etc/hosts
- 如果找到映射，返回 IP，解析结束

第4步：本地 DNS 服务器
- 向你的网络运营商（ISP）提供的 DNS 服务器查询
- 通常是自动分配的，也可以手动设置（如 8.8.8.8）
- 如果找到，返回 IP，解析结束

第5步：根域名服务器
- 本地 DNS 服务器向根域名服务器查询
- 根服务器不直接返回 IP，而是返回顶级域名服务器的地址
- 例如：查询 www.example.com，根服务器返回 .com 顶级域名服务器地址

第6步：顶级域名服务器
- 向 .com 顶级域名服务器查询
- 返回 example.com 权威域名服务器的地址

第7步：权威域名服务器
- 向 example.com 的权威域名服务器查询
- 返回 www.example.com 的真实 IP 地址

第8步：返回并缓存
- 将 IP 地址返回给浏览器
- 浏览器、操作系统、本地 DNS 都会缓存这个结果
- 缓存时间由 TTL 决定
```

</details>

### 练习 2（进阶）：DNS 记录类型判断

给定以下场景，判断应该使用哪种 DNS 记录类型：

1. 将 `example.com` 指向 IP 地址 `93.184.216.34`
2. 将 `www.example.com` 设置为 `example.com` 的别名
3. 指定 `example.com` 的邮件服务器为 `mail.example.com`
4. 添加 Google 网站验证的 TXT 记录
5. 指定 `example.com` 由 `ns1.dns.com` 管理

<details>
<summary>点击查看答案</summary>

```
1. 将 example.com 指向 IP 地址 93.184.216.34
   答案：A 记录
   原因：域名指向 IPv4 地址，使用 A 记录
   配置：example.com  A  93.184.216.34

2. 将 www.example.com 设置为 example.com 的别名
   答案：CNAME 记录
   原因：一个域名指向另一个域名，使用 CNAME 记录
   配置：www.example.com  CNAME  example.com

3. 指定 example.com 的邮件服务器为 mail.example.com
   答案：MX 记录
   原因：指定邮件服务器，使用 MX 记录
   配置：example.com  MX  10  mail.example.com
   （10 是优先级，数字越小优先级越高）

4. 添加 Google 网站验证的 TXT 记录
   答案：TXT 记录
   原因：存储验证文本，使用 TXT 记录
   配置：example.com  TXT  "google-site-verification=xxxxx"

5. 指定 example.com 由 ns1.dns.com 管理
   答案：NS 记录
   原因：指定域名服务器，使用 NS 记录
   配置：example.com  NS  ns1.dns.com
```

</details>

### 练习 3（挑战）：DNS 性能优化

写一段 HTML 代码，为以下资源进行 DNS 优化：

- Google Fonts（`fonts.googleapis.com`）：确定会用，需要最快加载
- Google Analytics（`www.google-analytics.com`）：可能会用
- 第三方 CDN（`cdn.example.com`）：确定会用，需要最快加载
- 第三方 API（`api.thirdparty.com`）：不确定是否会用

要求：
- 对确定会用的资源使用 preconnect
- 对可能会用的资源使用 dns-prefetch
- 添加适当的 crossorigin 属性

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>DNS 优化示例</title>
  
  <!-- Google Fonts：确定会用，使用 preconnect -->
  <!-- crossorigin 属性表示会进行 CORS 预检 -->
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
  
  <!-- Google Analytics：可能会用，使用 dns-prefetch -->
  <!-- 只预解析 DNS，不建立完整连接，节省资源 -->
  <link rel="dns-prefetch" href="//www.google-analytics.com">
  
  <!-- 第三方 CDN：确定会用，使用 preconnect -->
  <!-- crossorigin 属性表示会进行 CORS 预检 -->
  <link rel="preconnect" href="https://cdn.example.com" crossorigin>
  
  <!-- 第三方 API：不确定是否会用，使用 dns-prefetch -->
  <!-- 只预解析 DNS，不占用连接资源 -->
  <link rel="dns-prefetch" href="//api.thirdparty.com">
  
</head>
<body>
  <h1>DNS 优化示例</h1>
  
  <!-- 使用预连接过的 Google Fonts -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto">
  
  <!-- 使用预连接过的 CDN 资源 -->
  <script src="https://cdn.example.com/lib.js"></script>
  
  <!-- 可能会使用的 Google Analytics -->
  <script async src="https://www.google-analytics.com/analytics.js"></script>
</body>
</html>
```

**优化策略说明：**

1. **Google Fonts**：使用 `preconnect`，因为字体文件是页面渲染必需的，确定会加载。`preconnect` 会建立完整的 TCP + TLS 连接，后续加载字体时直接复用，速度最快。

2. **Google Analytics**：使用 `dns-prefetch`，因为统计脚本不是关键资源，可能不会立即加载。只预解析 DNS 可以节省资源，等真正需要时再建立连接。

3. **第三方 CDN**：使用 `preconnect`，因为 CDN 资源（如 JavaScript 库）通常是页面功能必需的，确定会加载。建立完整连接可以最大化加载速度。

4. **第三方 API**：使用 `dns-prefetch`，因为不确定页面是否会调用这个 API。只预解析 DNS 是最保守的策略，不会浪费连接资源。

</details>

---

## 下一章预告

下一章我们会学习 **TCP/IP 协议栈**——当浏览器拿到服务器的 IP 地址之后，它是怎么和服务器建立连接的？数据在网络中是怎么传输的？为什么有时候数据传输会丢失、重复或者乱序？我们会深入了解 TCP 的三次握手、四次挥手，以及可靠传输的机制。
