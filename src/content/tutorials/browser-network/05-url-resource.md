---
title: "第五章：URL 与资源定位"
description: "URL 结构、URI 规范、资源寻址机制、URL 编码与 JavaScript 操作"
---

# 第五章：URL 与资源定位

## 本章导读

在学这一章之前，你可能会有这些疑问：

- URL 到底由哪些部分组成？为什么有时候网址后面跟着一大串参数？
- URL、URI、URN 这三个概念老是搞混，它们到底有什么区别？
- 为什么 URL 里有中文就会变成一堆 `%E4%BD` 这样的乱码？
- 相对路径和绝对路径到底该怎么选？什么时候用哪个？

这一章就是为了解答这些问题。我们会从 URL 的基本结构讲起，搞清楚 URI 家族的三个概念，然后学习 URL 编码的规则，最后用 JavaScript 来实际操作 URL。学完这章，你就能完全看懂任何一个网址的含义了。

---

## 1 为什么需要 URL？

### 没有 URL 的时候有多麻烦

想象一下，你要给朋友寄一封信。如果没有地址，你只能大喊："把那封信给张三！"——全国可能有几百个张三，邮局根本不知道送给谁。

互联网也是一样。全世界有几十亿台设备连在网上，如果没有一个统一的"地址系统"，浏览器根本不知道该去哪里获取你要看的网页。

### URL 就是互联网上的"门牌号"

URL（Uniform Resource Locator，统一资源定位符）就是互联网资源的"门牌号"。它精确地告诉浏览器：

- 用什么方式去拿资源（协议）
- 去哪里拿（主机地址）
- 资源在哪个位置（路径）
- 有没有什么附加要求（查询参数）

打个比方：

> URL 就像外卖订单上的地址信息：
> - "美团配送"（协议）
> - "北京市朝阳区"（主机）
> - "幸福小区3号楼502"（路径）
> - "备注：多加辣"（查询参数）
> - "到了打门口电话"（片段定位）

没有 URL，浏览器就像一个没有地址的外卖员，根本找不到你要的东西。

---

## 2 核心原理

### 5.2.1 URL 的完整结构

一个完整的 URL 长这样：

```
协议://用户名:密码@主机:端口/路径?查询参数#片段
```

听起来很复杂，其实大部分时候你只会见到简化版：

```
https://www.example.com/path/to/page?id=123#section2
```

我们一段一段拆开来看：

| 部分 | 说明 | 示例中的值 | 是否必须 |
| --- | --- | --- | --- |
| 协议 | 用什么方式访问资源 | https | 是 |
| 用户名:密码 | 登录凭据（现在很少用） | 省略 | 否 |
| 主机 | 服务器的域名或 IP 地址 | www.example.com | 是 |
| 端口 | 服务器上哪个"门"在提供服务 | 省略（默认 443） | 否 |
| 路径 | 资源在服务器上的位置 | /path/to/page | 否 |
| 查询参数 | 传给服务器的额外信息 | id=123 | 否 |
| 片段 | 页面内的锚点位置 | section2 | 否 |

打个比方：

> 把 URL 想象成去酒店找房间：
> - 协议 = 你选择走路还是坐电梯（访问方式）
> - 主机 = 哪家酒店（服务器地址）
> - 端口 = 酒店哪个门进去（默认正门，一般不用管）
> - 路径 = 几楼几号房（资源位置）
> - 查询参数 = 前台备注信息（额外要求）
> - 片段 = 这个房间的哪个区域（页面内定位）

### 5.2.2 URI、URL、URN 三者的关系

这三个缩写经常让人搞混，其实它们的包含关系很简单：

```
URI（统一资源标识符）
├── URL（统一资源定位符）—— 能定位到资源
└── URN（统一资源名称）—— 只给资源起个名字
```

| 概念 | 全称 | 做什么用 | 举个例子 | 类比 |
| --- | --- | --- | --- | --- |
| URI | 统一资源标识符 | 给资源一个唯一身份 | 下面两个都是 URI | 身份证号 |
| URL | 统一资源定位符 | 告诉你资源在哪里、怎么找到它 | https://example.com/page | "北京市朝阳区XX路XX号" |
| URN | 统一资源名称 | 给资源一个永久不变的名字 | urn:isbn:978-7-111-12345-6 | "张三"这个名字 |

关键区别：

- URL 是"地址"——换了地方，URL 就变了
- URN 是"名字"——不管资源在哪，名字永远不变
- URI 是"总称"——URL 和 URN 都是 URI

### 5.2.3 常见协议和默认端口

| 协议 | 做什么用 | 默认端口 | 生活类比 |
| --- | --- | --- | --- |
| http | 普通网页传输 | 80 | 寄明信片（谁都能看到内容） |
| https | 加密网页传输 | 443 | 寄密封信（只有收件人能看） |
| ftp | 文件上传下载 | 21 | 快递寄包裹 |
| ssh | 远程登录服务器 | 22 | 远程遥控器 |
| file | 访问本地文件 | 无 | 在自己家翻东西 |
| mailto | 打开邮件客户端 | 无 | 点击写信按钮 |

### 5.2.4 绝对路径 vs 相对路径

| 类型 | 写法 | 特点 | 什么时候用 |
| --- | --- | --- | --- |
| 绝对路径 | https://example.com/img/logo.png | 完整地址，永远有效 | 引用外部资源、跨站引用 |
| 相对路径 | ./img/logo.png 或 ../img/logo.png | 相对于当前页面，简洁 | 站内引用，项目内部资源 |
| 协议相对 | //cdn.example.com/lib.js | 自动匹配当前协议 | CDN 引用，http/https 都兼容 |
| 根路径 | /css/style.css | 从网站根目录开始 | 网站内部统一引用 |

打个比方：

> - 绝对路径 = "北京市朝阳区XX路XX号"（完整地址，不管你在哪都能找到）
> - 相对路径 = "隔壁那栋楼"（得知道你现在在哪才有意义）
> - 根路径 = "从市中心广场往北走第三条街"（从一个固定起点出发）

### 5.2.5 URL 编码

URL 只能使用 ASCII 字符集里的安全字符。如果你要在 URL 里用中文、空格或者其他特殊字符，就必须进行编码。

编码规则很简单：

- 每个特殊字符变成 `%` 加上两位十六进制数
- 空格编码成 `%20`（在查询参数中也可以编码成 `+`）
- 中文先转成 UTF-8 字节，每个字节再加 `%`

举个例子：

```
原始 URL：https://example.com/search?q=你好 世界
编码后：  https://example.com/search?q=%E4%BD%A0%E5%A5%BD%20%E4%B8%96%E7%95%8C
```

"你" 的 UTF-8 编码是 `E4 BD A0`（三个字节），所以变成了 `%E4%BD%A0`。

---

## 3 基础用法 + 逐行注释

### 5.3.1 用 JavaScript 解析 URL

```javascript
// 创建一个 URL 对象，传入一个完整的网址
const url = new URL('https://www.example.com:8080/path/to/page?id=123&name=test#section2')

// 获取协议部分（包含冒号和双斜杠）
console.log(url.protocol)   // 输出: "https:"

// 获取主机名（域名部分）
console.log(url.hostname)   // 输出: "www.example.com"

// 获取端口号（如果没写端口，返回空字符串）
console.log(url.port)       // 输出: "8080"

// 获取完整的路径部分
console.log(url.pathname)   // 输出: "/path/to/page"

// 获取查询参数部分（包含问号）
console.log(url.search)     // 输出: "?id=123&name=test"

// 获取片段部分（包含井号）
console.log(url.hash)       // 输出: "#section2"

// 获取 origin（协议 + 主机 + 端口）
console.log(url.origin)     // 输出: "https://www.example.com:8080"
```

### 5.3.2 用 URLSearchParams 操作查询参数

```javascript
// 创建一个 URL 对象
const url = new URL('https://example.com/search?keyword=vue&page=1')

// 用 searchParams 属性获取参数操作对象
const params = url.searchParams

// 获取某个参数的值
console.log(params.get('keyword'))  // 输出: "vue"
console.log(params.get('page'))     // 输出: "1"

// 获取一个不存在的参数，返回 null
console.log(params.get('sort'))     // 输出: null

// 添加一个新参数
params.set('sort', 'latest')        // URL 变成 ?keyword=vue&page=1&sort=latest

// 修改已有参数的值
params.set('page', '2')             // page 从 1 变成 2

// 删除某个参数
params.delete('sort')               // sort 参数被删除

// 检查是否包含某个参数
console.log(params.has('keyword'))  // 输出: true
console.log(params.has('sort'))     // 输出: false（刚才已经删了）

// 遍历所有参数
for (const [key, value] of params) {
  // 依次输出每个键值对
  console.log(`${key} = ${value}`)
}
// 输出:
// keyword = vue
// page = 2
```

### 5.3.3 URL 编码和解码

```javascript
// ========== encodeURI ==========
// 编码整个 URL，但不会编码 URL 中的特殊字符（如 : / ? # 等）
const url1 = 'https://example.com/search?q=你好 世界'
const encoded1 = encodeURI(url1)
// 结果: "https://example.com/search?q=%E4%BD%A0%E5%A5%BD%20%E4%B8%96%E7%95%8C"
// 注意: : / ? = 这些字符没有被编码，只有中文和空格被编码了
console.log(encoded1)

// 解码回去
const decoded1 = decodeURI(encoded1)
// 结果: "https://example.com/search?q=你好 世界"
console.log(decoded1)

// ========== encodeURIComponent ==========
// 编码单个参数值，会编码所有特殊字符
const param = '你好&世界=测试'
const encoded2 = encodeURIComponent(param)
// 结果: "%E4%BD%A0%E5%A5%BD%26%E4%B8%96%E7%95%8C%3D%E6%B5%8B%E8%AF%95"
// 注意: & 和 = 也被编码了，因为它们作为参数值时不应该有特殊含义
console.log(encoded2)

// 解码回去
const decoded2 = decodeURIComponent(encoded2)
// 结果: "你好&世界=测试"
console.log(decoded2)

// ========== 什么时候用哪个？ ==========

// 编码整个 URL 用 encodeURI
// 正确写法：
const fullUrl = encodeURI('https://example.com/路径/页面.html')
console.log(fullUrl)
// 输出: "https://example.com/%E8%B7%AF%E5%BE%84/%E9%A1%B5%E9%9D%A2.html"

// 错误写法：对整个 URL 用 encodeURIComponent
// ❌ const wrong = encodeURIComponent('https://example.com/路径')
// 结果会把 : / 也编码掉，URL 就废了

// 编码单个参数值用 encodeURIComponent
// 正确写法：
const keyword = 'Vue 教程'
const safeKeyword = encodeURIComponent(keyword)
const searchUrl = `https://example.com/search?q=${safeKeyword}`
console.log(searchUrl)
// 输出: "https://example.com/search?q=Vue%20%E6%95%99%E7%A8%8B"

// 错误写法：对参数值用 encodeURI
// ❌ const badUrl = `https://example.com/search?q=${encodeURI('a=1&b=2')}`
// 结果: "https://example.com/search?q=a=1&b=2"
// 这里 & 和 = 没有被编码，会被当成两个参数，而不是一个参数的值
```

### 5.3.4 构造 URL 对象

```javascript
// 方式一：直接传入完整 URL
const url1 = new URL('https://example.com/path')

// 方式二：传入相对路径 + 基础 URL
const url2 = new URL('/images/logo.png', 'https://example.com')
console.log(url2.href)
// 输出: "https://example.com/images/logo.png"

// 方式三：基于当前页面 URL 解析相对路径（在浏览器中）
// const url3 = new URL('../about.html', window.location.href)
// 假设当前页面是 https://example.com/docs/page.html
// 结果: "https://example.com/about.html"

// 方式四：逐步构建 URL
const url4 = new URL('https://example.com')
url4.pathname = '/api/users'       // 设置路径
url4.searchParams.set('page', '1') // 添加查询参数
url4.searchParams.set('size', '10')
url4.hash = 'top'                  // 设置片段
console.log(url4.href)
// 输出: "https://example.com/api/users?page=1&size=10#top"
```

---

## 4 对比表格

### encodeURI vs encodeURIComponent

| 对比项 | encodeURI | encodeURIComponent |
| --- | --- | --- |
| 编码范围 | 只编码非 ASCII 字符和空格 | 编码所有特殊字符 |
| 保留的字符 | `; , / ? : @ & = + $ #` 不编码 | 只保留字母、数字和 `! * ' ( ) - . _ ~` |
| 使用场景 | 编码完整的 URL | 编码 URL 中的单个参数值 |
| 典型错误 | 用它编码参数值，导致 `&` `=` 不被编码 | 用它编码完整 URL，导致 `://` 被破坏 |

### 绝对路径 vs 相对路径

| 对比项 | 绝对路径 | 相对路径 |
| --- | --- | --- |
| 写法 | `https://example.com/img/logo.png` | `./img/logo.png` |
| 是否依赖当前页面 | 不依赖，永远有效 | 依赖，当前页面变了路径就变了 |
| 长度 | 较长 | 较短 |
| 适用场景 | 外部资源、CDN、跨站引用 | 项目内部资源引用 |
| 迁移性 | 换了域名要全部修改 | 只要内部结构不变就不需要改 |

---

## 5 新手常见误区

### 误区 1："URL 和 URI 是一回事"

**不完全对。** URL 是 URI 的一种，但 URI 还包括 URN。你可以这样理解：URI 是"身份证"这个大类，URL 是"地址"，URN 是"姓名"。在日常开发中，我们说的基本都是 URL，但规范文档里可能会用 URI 这个更广义的词。

### 误区 2："端口号必须写在 URL 里"

**不对。** 每个协议都有默认端口（HTTP 是 80，HTTPS 是 443），浏览器会自动使用默认端口，所以你不需要写出来。只有当服务器用了非默认端口（比如 8080）时，才需要在 URL 里显式写出。

```javascript
// 这两种写法是等价的，浏览器访问的是同一个地方
// https://example.com       （自动使用 443 端口）
// https://example.com:443   （显式写了 443 端口）
```

### 误区 3："用 encodeURI 编码参数值就够了"

**错！** 这是新手最常犯的错误。`encodeURI` 不会编码 `&` 和 `=`，如果参数值里包含这些字符，就会破坏 URL 结构。编码参数值一定要用 `encodeURIComponent`。

```javascript
// 错误写法：
// ❌ const url = `https://example.com/search?q=${encodeURI('a=1&b=2')}`
// 结果: https://example.com/search?q=a=1&b=2
// 服务器会认为有两个参数: q=a=1 和 b=2

// 正确写法：
// ✅ const url = `https://example.com/search?q=${encodeURIComponent('a=1&b=2')}`
// 结果: https://example.com/search?q=a%3D1%26b%3D2
// 服务器正确收到一个参数: q 的值是 "a=1&b=2"
```

### 误区 4："相对路径 `../` 和 `./` 随便写"

**不能随便写。** `./` 表示当前目录，`../` 表示上级目录。如果当前页面在 `/a/b/c.html`，那么 `../d.html` 指向的是 `/a/d.html`，而不是 `/d.html`。搞错层级关系会导致资源 404。

### 误区 5："URL 中的 `#` 后面的内容会发送给服务器"

**不会。** `#` 后面的片段（hash）只在浏览器端使用，用来定位页面内的锚点。它不会被包含在 HTTP 请求中发送给服务器。这个特性经常被用来做前端路由。

---

## 6 动手练习

### 练习 1（基础）：解析 URL

给定以下 URL，请写出每个部分的值：

```
https://www.google.com:443/search?q=javascript&hl=zh-CN#results
```

请分别写出 protocol、hostname、port、pathname、search、hash 的值。

<details>
<summary>点击查看答案</summary>

```javascript
const url = new URL('https://www.google.com:443/search?q=javascript&hl=zh-CN#results')

// protocol: "https:"（注意包含冒号）
console.log(url.protocol)

// hostname: "www.google.com"
console.log(url.hostname)

// port: ""（空字符串！因为 443 是 https 的默认端口，URL 对象会自动省略）
console.log(url.port)

// pathname: "/search"
console.log(url.pathname)

// search: "?q=javascript&hl=zh-CN"（注意包含问号）
console.log(url.search)

// hash: "#results"（注意包含井号）
console.log(url.hash)
```

关键点：端口 443 是 HTTPS 的默认端口，所以 `url.port` 返回空字符串，而不是 `"443"`。

</details>

### 练习 2（进阶）：构建搜索 URL

写一个函数 `buildSearchUrl`，接收基础域名、搜索关键词和页码，返回一个正确编码的搜索 URL。

要求：
- 关键词需要正确编码（可能包含中文和特殊字符）
- 页码作为第二个参数
- 格式：`https://example.com/search?q=关键词&page=页码`

<details>
<summary>点击查看答案</summary>

```javascript
// 定义构建搜索 URL 的函数
function buildSearchUrl(domain, keyword, page) {
  // 用 URL 对象构建基础 URL
  const url = new URL(`https://${domain}/search`)

  // 用 searchParams.set 设置参数，自动处理编码
  url.searchParams.set('q', keyword)

  // 设置页码参数
  url.searchParams.set('page', page)

  // 返回完整的 URL 字符串
  return url.href
}

// 测试：普通关键词
console.log(buildSearchUrl('example.com', 'javascript', 1))
// 输出: "https://example.com/search?q=javascript&page=1"

// 测试：包含中文的关键词
console.log(buildSearchUrl('example.com', '前端教程', 2))
// 输出: "https://example.com/search?q=%E5%89%8D%E7%AB%AF%E6%95%99%E7%A8%8B&page=2"

// 测试：包含特殊字符的关键词
console.log(buildSearchUrl('example.com', 'a=1&b=2', 1))
// 输出: "https://example.com/search?q=a%3D1%26b%3D2&page=1"
// 注意 & 和 = 被正确编码了，不会破坏 URL 结构
```

</details>

### 练习 3（挑战）：URL 参数解析器

写一个函数 `parseQueryParams`，接收一个 URL 字符串，返回一个普通对象，包含所有查询参数的键值对。

要求：
- 如果同一个参数出现多次，值应该是数组
- 如果参数只出现一次，值是字符串
- 需要正确解码参数值

示例：
```
输入: "https://example.com?a=1&b=hello&a=2"
输出: { a: ["1", "2"], b: "hello" }
```

<details>
<summary>点击查看答案</summary>

```javascript
// 定义 URL 参数解析函数
function parseQueryParams(urlString) {
  // 创建 URL 对象来解析传入的 URL
  const url = new URL(urlString)

  // 获取 searchParams 对象
  const params = url.searchParams

  // 创建结果对象
  const result = {}

  // 遍历所有参数
  for (const [key, value] of params) {
    // 检查这个 key 是否已经存在于结果中
    if (key in result) {
      // 如果已经存在，检查当前值是否已经是数组
      if (Array.isArray(result[key])) {
        // 是数组，直接追加新值
        result[key].push(value)
      } else {
        // 不是数组，转成数组并追加新值
        result[key] = [result[key], value]
      }
    } else {
      // 第一次出现，直接赋值为字符串
      result[key] = value
    }
  }

  // 返回解析结果
  return result
}

// 测试：普通参数
console.log(parseQueryParams('https://example.com?a=1&b=hello'))
// 输出: { a: "1", b: "hello" }

// 测试：重复参数
console.log(parseQueryParams('https://example.com?a=1&b=hello&a=2'))
// 输出: { a: ["1", "2"], b: "hello" }

// 测试：编码的参数
console.log(parseQueryParams('https://example.com?name=%E4%BD%A0%E5%A5%BD&tag=vue&tag=js'))
// 输出: { name: "你好", tag: ["vue", "js"] }
// 注意: URLSearchParams 会自动解码 %E4%BD%A0%E5%A5%BD 为 "你好"
```

</details>

---

## 下一章预告

下一章我们会学习 **DNS 解析过程**——当你在浏览器输入一个域名（比如 `www.google.com`）之后，浏览器是怎么找到这台服务器的？DNS 就像一个巨大的"电话簿"，把人类能记住的名字转换成计算机能理解的 IP 地址。我们会深入了解这个转换过程的每一步。
