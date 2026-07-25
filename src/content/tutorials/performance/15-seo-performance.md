---
title: "第十五章：SEO 与性能"
description: "掌握性能优化如何影响搜索引擎排名，以及 SEO 与性能的协同优化策略"
---

# 第十五章：SEO 与性能

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 性能优化和 SEO 有什么关系？
- 页面加载速度真的会影响搜索排名吗？
- SPA 单页应用是不是对 SEO 很不友好？
- 怎么同时做好性能和 SEO？

这一章就是为了解答这些问题。性能不仅是用户体验问题，也是搜索引擎排名的重要因素。Google 已经把 Core Web Vitals 作为排名信号——性能好的页面，排名更靠前。

---

## 15.1 为什么需要关注 SEO 与性能？

### 痛点分析

你可能遇到过这些问题：

- 网站内容很好，但搜索排名很低，没人看得到
- 做了 SPA 单页应用，搜索引擎根本抓不到内容
- 页面加载慢，用户搜到了也马上关掉
- 移动端体验差，Google 排名被降权

打个比方：

> SEO 与性能的关系就像餐厅的选址和装修：
> - SEO = 餐厅选址（让顾客能找到你）
> - 性能 = 餐厅装修（让顾客愿意留下来）
> - 内容 = 菜品质量（让顾客满意并回头）
> - 三者缺一不可：找不到你、体验差、菜难吃，顾客都不会来

### 搜索引擎工作原理

```
搜索引擎工作流程：
├── 1. 爬虫抓取 → 访问网页，下载 HTML
├── 2. 索引建立 → 分析内容，建立索引数据库
├── 3. 排名计算 → 根据数百个因素计算排名
└── 4. 结果展示 → 按排名高低展示搜索结果

排名因素（简化）：
├── 内容质量（最重要）→ 原创、有价值、匹配搜索意图
├── 页面性能（重要）  → 加载速度、交互响应、视觉稳定
├── 用户体验（重要）  → 移动端友好、安全（HTTPS）、易用
└── 技术优化（基础）  → 结构化数据、语义化 HTML、元数据
```

### Core Web Vitals 与排名

Google 从 2021 年开始将 Core Web Vitals 作为排名因素：

| 指标 | 良好 | 需改进 | 差 | 对 SEO 的影响 |
| --- | --- | --- | --- | --- |
| LCP | ≤ 2.5s | 2.5-4s | > 4s | 页面加载速度，直接影响排名 |
| INP | ≤ 200ms | 200-500ms | > 500ms | 交互响应速度，影响用户体验评分 |
| CLS | ≤ 0.1 | 0.1-0.25 | > 0.25 | 视觉稳定性，影响用户留存 |

**说明**：三项指标都达标，才能在 Google Search Console 中显示"良好的页面体验"徽章。

---

## 15.2 性能对 SEO 的影响

### 加载速度与跳出率

页面加载速度直接影响用户行为，而用户行为又影响搜索排名。

```
页面加载时间 vs 跳出率（Google 数据）：
├── 1-3秒：跳出率增加 32%
├── 1-5秒：跳出率增加 90%
├── 5-10秒：跳出率持续上升
└── 超过 10秒：大部分用户已经离开

连锁反应：
加载慢 → 用户跳出 → 搜索引擎认为"这个页面不相关" → 排名下降 → 更少用户点击
```

打个比方：

> 加载速度就像餐厅的等位时间：
> - 等 1 分钟 → 可以接受
> - 等 5 分钟 → 开始不耐烦
> - 等 10 分钟 → 直接走人
> - 走的人多了 → 大众点评评分下降 → 更少人来

### 移动端优先索引

Google 从 2019 年开始使用 **移动端优先索引**（Mobile-First Indexing），也就是用移动端版本来评估排名。

```
移动端优先索引意味着：
├── Google 用移动端版本来索引和排名（不是桌面端）
├── 移动端体验差 → 排名下降（即使桌面端很好）
└── 必须确保移动端和桌面端内容一致

移动端优化要点：
├── 响应式设计 → 适配各种屏幕尺寸
├── 移动端性能 → 加载速度、交互流畅
├── 触摸友好 → 按钮够大、间距合理
└── 内容一致 → 移动端和桌面端内容相同
```

### 性能与 SEO 的关系总结

| 性能因素 | SEO 影响 | 优化方向 |
| --- | --- | --- |
| 加载速度（LCP） | 直接影响排名 | 图片优化、CDN、缓存 |
| 交互响应（INP） | 影响用户体验评分 | 减少长任务、代码分割 |
| 视觉稳定（CLS） | 影响用户留存 | 预留空间、字体优化 |
| 移动端适配 | 移动端优先索引 | 响应式设计、触摸优化 |
| HTTPS | 排名加分项 | SSL 证书 |
| 页面可访问性 | 影响用户体验 | 语义化 HTML、Aria |

---

## 15.3 技术 SEO 优化

### 元数据优化

元数据是搜索引擎理解页面内容的重要依据。

```html
<!-- ✅ 基础元数据 -->
<!-- title 标签：最重要的 SEO 因素之一，50-60 字符最佳 -->
<title>前端性能优化实战教程 - 从零到精通 | 我的博客</title>

<!-- description：搜索结果显示的摘要，50-160 字符 -->
<meta name="description" content="系统学习前端性能优化，涵盖浏览器渲染、资源加载、代码分割、缓存策略等 16 个章节，助你打造极速网页体验。">

<!-- keywords：现代搜索引擎已不太重视，但可以加上 -->
<meta name="keywords" content="前端性能优化,Web性能,Core Web Vitals,Lighthouse">

<!-- ✅ Open Graph（社交媒体分享） -->
<!-- 控制页面在微信、微博、Facebook 等平台分享时的展示效果 -->
<meta property="og:title" content="前端性能优化实战教程">
<meta property="og:description" content="从零到精通的前端性能优化完整指南">
<meta property="og:image" content="https://example.com/og-image.jpg">
<meta property="og:url" content="https://example.com/performance-tutorial">
<meta property="og:type" content="article">

<!-- ✅ Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="前端性能优化实战教程">
<meta name="twitter:description" content="从零到精通的前端性能优化完整指南">
<meta name="twitter:image" content="https://example.com/twitter-image.jpg">
```

**说明**：

- `title` 是搜索引擎最看重的元数据，必须包含核心关键词
- `description` 会显示在搜索结果中，影响用户是否点击
- Open Graph 和 Twitter Card 不影响排名，但影响社交分享的展示效果

### 结构化数据

结构化数据帮助搜索引擎理解页面内容的类型和含义。

```html
<!-- JSON-LD 结构化数据（Google 推荐格式） -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "前端性能优化实战教程",
  "description": "从零到精通的前端性能优化完整指南",
  "image": "https://example.com/cover.jpg",
  "author": {
    "@type": "Person",
    "name": "作者名称",
    "url": "https://example.com"
  },
  "publisher": {
    "@type": "Organization",
    "name": "我的博客",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  },
  "datePublished": "2024-01-01",
  "dateModified": "2024-06-15",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.com/performance-tutorial"
  }
}
</script>
```

**原理**：

> 结构化数据就像给搜索引擎发了一张"名片"：
> - 普通 HTML → 搜索引擎要自己猜"这是什么内容"
> - 结构化数据 → 直接告诉搜索引擎"这是文章、作者是谁、发布日期是什么时候"
> - 搜索结果可以展示富摘要（如评分、价格、FAQ），点击率更高

### 常见结构化数据类型

| 类型 | 适用场景 | 富摘要效果 |
| --- | --- | --- |
| Article | 文章、博客 | 显示作者、发布日期 |
| Product | 商品页 | 显示价格、评分、库存 |
| FAQPage | FAQ 页面 | 直接展示问答列表 |
| BreadcrumbList | 面包屑导航 | 显示导航路径 |
| LocalBusiness | 本地商家 | 显示地址、电话、营业时间 |
| VideoObject | 视频页 | 显示视频缩略图、时长 |

### 语义化 HTML

语义化标签帮助搜索引擎理解页面结构。

```html
<!-- ✅ 正确的语义化结构 -->
<header>
  <!-- 页面头部 -->
  <nav>
    <!-- 导航栏 -->
    <a href="/">首页</a>
    <a href="/about">关于</a>
  </nav>
</header>

<main>
  <!-- 页面主要内容（每页只有一个 main） -->
  <article>
    <!-- 独立的内容单元（文章、帖子） -->
    <h1>文章标题</h1>
    <section>
      <!-- 主题相关的内容分组 -->
      <h2>章节标题</h2>
      <p>正文内容</p>
    </section>
  </article>
</main>

<aside>
  <!-- 侧边栏、辅助内容 -->
  <h2>相关文章</h2>
</aside>

<footer>
  <!-- 页面底部 -->
  <p>版权信息</p>
</footer>
```

```html
<!-- ❌ 错误：全部用 div，搜索引擎不知道哪里是标题、哪里是导航 -->
<div class="header">
  <div class="nav">
    <div class="link">首页</div>
  </div>
</div>
<div class="content">
  <div class="title">文章标题</div>
  <div class="text">正文内容</div>
</div>
```

**说明**：

- `<h1>` 到 `<h6>` 构成标题层级，每页只有一个 `<h1>`
- `<nav>` 告诉搜索引擎"这是导航"
- `<article>` 告诉搜索引擎"这是独立内容"
- `<main>` 告诉搜索引擎"这是主要内容"

---

## 15.4 性能与 SEO 协同优化

### 预渲染 / SSR

SPA 单页应用的内容是通过 JavaScript 动态生成的，搜索引擎爬虫可能抓不到内容。解决方案有三种：

```
SPA 的问题：
├── 服务器返回的 HTML 是空的 <div id="app"></div>
├── 内容需要 JS 执行后才渲染出来
├── 搜索引擎爬虫可能不执行 JS（或执行不完整）
└── 结果：搜索引擎看不到页面内容

解决方案对比：
├── SSR（服务端渲染）→ 每次请求都在服务器渲染 HTML
├── SSG（静态站点生成）→ 构建时生成静态 HTML
└── 预渲染 → 构建时为指定页面生成静态 HTML
```

```javascript
// ✅ Vue SSR 示例
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';

// 创建 SSR 应用实例
const app = createSSRApp(App);

// 渲染为 HTML 字符串
const html = await renderToString(app);

// 返回完整的 HTML（搜索引擎可以直接抓取）
res.send(`
  <!DOCTYPE html>
  <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <title>SEO 友好的页面标题</title>
      <meta name="description" content="SEO 友好的页面描述">
    </head>
    <body>
      <!-- 服务端渲染的完整 HTML -->
      <div id="app">${html}</div>
      <!-- 客户端激活（hydration）：让静态 HTML 变为可交互 -->
      <script type="module" src="/client.js"></script>
    </body>
  </html>
`);
```

**原理**：

> SSR 就像餐厅的预制菜：
> - SPA = 顾客点单后现做（JS 执行后才渲染）
> - SSR = 提前做好端上来（服务器直接返回完整 HTML）
> - 搜索引擎来了直接看到完整的菜（内容），不用等厨房做

### SSR vs SSG vs 预渲染

| 方案 | 生成时机 | 适用场景 | 优点 | 缺点 |
| --- | --- | --- | --- | --- |
| SSR | 每次请求时 | 内容频繁变化的页面 | 内容实时、SEO 友好 | 服务器压力大 |
| SSG | 构建时 | 博客、文档 | 速度最快、CDN 友好 | 内容更新需重新构建 |
| 预渲染 | 构建时 | 少量静态页面 | 简单、无需服务器 | 只适合少量页面 |

### 动态渲染

```javascript
// 动态渲染：根据 User-Agent 判断返回什么内容
// 注意：必须保证内容一致性，否则会被搜索引擎惩罚

app.get('*', (req, res) => {
  const userAgent = req.headers['user-agent'];
  const isBot = /googlebot|bingbot|baiduspider/i.test(userAgent);

  if (isBot) {
    // 搜索引擎爬虫：返回预渲染的完整 HTML
    const prerenderedHtml = getPrerenderedHtml(req.path);
    res.send(prerenderedHtml);
  } else {
    // 普通用户：返回 SPA（轻量、交互好）
    res.sendFile('index.html');
  }
});
```

**说明**：

- 动态渲染是 SSR 和 SPA 的折中方案
- 必须保证爬虫和用户看到的内容一致，否则会被认为是"cloaking"（欺骗），会被搜索引擎惩罚
- 现代方案更推荐 SSR 或 SSG，而不是动态渲染

### 图片 SEO

```html
<!-- ✅ 优化图片 alt 文本 -->
<!-- alt 文本帮助搜索引擎理解图片内容 -->
<img src="product.webp" alt="红色运动鞋 男款 透气 轻便跑步鞋">

<!-- ❌ 错误的 alt 文本 -->
<img src="product.webp" alt="图片1">        <!-- 没有描述性 -->
<img src="product.webp" alt="img_2024">     <!-- 文件名没有意义 -->
<img src="product.webp">                    <!-- 缺少 alt 属性 -->

<!-- ✅ 使用 picture 元素提供多格式（性能 + SEO） -->
<picture>
  <!-- 支持 AVIF 的浏览器用 AVIF（最小体积） -->
  <source srcset="image.avif" type="image/avif">
  <!-- 支持 WebP 的浏览器用 WebP -->
  <source srcset="image.webp" type="image/webp">
  <!-- 兜底方案：JPEG -->
  <img src="image.jpg" alt="描述性文本" loading="lazy" width="800" height="600">
</picture>
```

**图片 SEO 要点**：

| 优化项 | 说明 |
| --- | --- |
| alt 文本 | 描述图片内容，包含关键词（但不要堆砌） |
| 文件名 | 使用描述性文件名（如 `red-shoes.jpg`，不是 `IMG001.jpg`） |
| 图片格式 | 使用现代格式（WebP/AVIF），减小体积 |
| 图片尺寸 | 设置 `width/height`，避免布局偏移 |
| 懒加载 | 非首屏图片使用 `loading="lazy"` |

### 链接优化

```html
<!-- ✅ 内部链接：使用描述性锚文本 -->
<a href="/seo-guide">SEO 优化完全指南</a>
<!-- ❌ 避免：点击这里、更多、阅读全文 -->
<a href="/seo-guide">点击这里</a>

<!-- ✅ 外部链接：添加 rel 属性 -->
<a href="https://external.com" rel="nofollow noopener" target="_blank">
  外部链接
</a>
<!-- rel="nofollow" → 告诉搜索引擎不要传递权重 -->
<!-- rel="noopener" → 安全考虑，防止新页面访问 window.opener -->

<!-- ✅ 规范链接：避免重复内容 -->
<link rel="canonical" href="https://example.com/original-page">
```

---

## 15.5 页面速度优化清单

### 加载性能

```
加载性能检查清单：
├── □ 启用 Gzip/Brotli 压缩
├── □ 优化图片格式和大小（WebP/AVIF）
├── □ 使用 CDN 加速
├── □ 启用浏览器缓存（Cache-Control）
├── □ 减少 HTTP 请求（合并、内联）
├── □ 内联关键 CSS（首屏样式）
├── □ 延迟加载非关键 JS（defer/async）
└── □ 预加载关键资源（preload）
```

### 渲染性能

```
渲染性能检查清单：
├── □ 优化关键渲染路径
├── □ 减少阻塞资源
├── □ 使用 async/defer 加载脚本
├── □ 优化 CSS 选择器（避免深层嵌套）
├── □ 避免布局抖动（设置图片/广告尺寸）
├── □ 使用 transform/opacity 做动画
└── □ 实现虚拟列表（大数据场景）
```

### 移动端优化

```
移动端优化检查清单：
├── □ 响应式设计（适配各种屏幕）
├── □ 触摸目标尺寸（最小 44x44px）
├── □ 移动端图片优化（响应式图片）
├── □ 字体加载策略（font-display: swap）
├── □ 离线支持（Service Worker）
└── □ 网络感知加载（根据网络状态调整）
```

---

## 15.6 监控与测试

### Lighthouse SEO 审计

```
Lighthouse SEO 检查项目：
├── meta 标签 → title、description 是否存在且合理
├── 结构化数据 → 是否包含有效的结构化数据
├── 移动端友好 → 是否使用 viewport、字体是否可读
├── HTTPS → 是否使用安全连接
├── 规范链接 → 是否有 canonical 链接
├── 语言声明 → 是否声明了页面语言
└── 链接文本 → 是否有描述性的链接文本

使用方式：
├── Chrome DevTools → Lighthouse → 勾选 SEO → 生成报告
├── CLI → lighthouse https://example.com --categories=seo
└── PageSpeed Insights → https://pagespeed.web.dev/
```

### 搜索引擎工具

```
Google Search Console：
├── 索引状态 → 查看哪些页面被索引了
├── 搜索表现 → 查看关键词排名、点击率
├── Core Web Vitals → 查看页面性能指标
├── 移动可用性 → 查看移动端问题
└── 结构化数据 → 查看结构化数据是否正常

Bing Webmaster Tools：
├── 类似功能
└── Bing 特定优化
```

---

## 15.7 新手常见误区

### 误区 1："SPA 对 SEO 完全不友好"

**不完全对！** 现代搜索引擎（Google）已经能执行 JavaScript，但执行不完整、有延迟。

**正确做法**：

1. 重要内容页面使用 SSR 或 SSG
2. 不需要 SEO 的页面（如后台管理）可以用 SPA
3. 如果必须用 SPA，考虑预渲染关键页面
4. 确保 `<title>` 和 `<meta>` 在 HTML 中就存在

### 误区 2："只要内容好，性能不重要"

**错！** 内容好是基础，但性能差会导致用户根本看不到你的内容。

**正确做法**：

1. 内容质量和性能同样重要
2. 先保证性能达标（LCP ≤ 2.5s），再优化内容
3. 性能差的页面 → 跳出率高 → 排名下降 → 内容再好也没人看

### 误区 3："alt 属性随便写写就行"

**错！** alt 文本是搜索引擎理解图片内容的重要依据。

**正确做法**：

1. alt 文本要描述图片内容，包含关键词
2. 不要堆砌关键词（如"红色鞋子 蓝色鞋子 黑色鞋子"）
3. 装饰性图片用空 alt（`alt=""`），搜索引擎会忽略
4. 不要省略 alt 属性

### 误区 4："结构化数据越复杂越好"

**错！** 结构化数据要准确反映页面内容，不要添加虚假信息。

**正确做法**：

1. 只添加与页面内容一致的结构化数据
2. 从简单的类型开始（Article、BreadcrumbList）
3. 使用 Google 富媒体搜索测试工具验证
4. 不要为了富摘要而添加虚假结构化数据（会被惩罚）

### 误区 5："移动端和桌面端内容可以不一样"

**错！** Google 使用移动端优先索引，如果移动端内容比桌面端少，排名会受影响。

**正确做法**：

1. 确保移动端和桌面端内容完全一致
2. 不要在移动端隐藏重要内容
3. 使用响应式设计，同一套 HTML，不同 CSS 布局

---

## 15.8 动手练习

### 练习 1：基础练习 - 元数据优化

**题目**：为以下页面添加完整的 SEO 元数据。

```html
<!-- 优化前：几乎没有元数据 -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>我的文章</title>
</head>
<body>
  <h1>前端性能优化指南</h1>
  <p>本文介绍了前端性能优化的各种技术...</p>
</body>
</html>
```

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- 基础 SEO 元数据 -->
  <title>前端性能优化实战指南 - 从 LCP 到 CLS 全面提升 | 技术博客</title>
  <meta name="description" content="系统学习前端性能优化技术，涵盖 Core Web Vitals、资源加载、代码分割、缓存策略等 16 个章节，助你打造极速网页体验。">
  <meta name="keywords" content="前端性能优化,Core Web Vitals,LCP,CLS,Web性能">

  <!-- Open Graph（社交分享） -->
  <meta property="og:title" content="前端性能优化实战指南">
  <meta property="og:description" content="系统学习前端性能优化，16 个章节从入门到精通">
  <meta property="og:image" content="https://example.com/og-performance.jpg">
  <meta property="og:url" content="https://example.com/performance-guide">
  <meta property="og:type" content="article">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="前端性能优化实战指南">
  <meta name="twitter:description" content="系统学习前端性能优化，16 个章节从入门到精通">
  <meta name="twitter:image" content="https://example.com/twitter-performance.jpg">

  <!-- 规范链接 -->
  <link rel="canonical" href="https://example.com/performance-guide">
</head>
<body>
  <h1>前端性能优化指南</h1>
  <p>本文介绍了前端性能优化的各种技术...</p>
</body>
</html>
```

**优化点**：

1. 添加 `lang="zh-CN"` 声明语言
2. 添加 `viewport` meta 适配移动端
3. `title` 包含关键词，50-60 字符
4. `description` 描述页面内容，50-160 字符
5. 添加 Open Graph 和 Twitter Card
6. 添加 `canonical` 链接

</details>

### 练习 2：进阶练习 - 结构化数据

**题目**：为一个产品页面添加结构化数据。

```html
<!-- 产品页面 -->
<div class="product">
  <h1>无线蓝牙耳机 Pro</h1>
  <img src="earphones.webp" alt="无线蓝牙耳机 Pro 黑色">
  <p class="price">¥599</p>
  <p class="rating">4.5 星（128 条评价）</p>
  <p class="description">高品质无线蓝牙耳机，支持主动降噪，续航 30 小时。</p>
  <button>加入购物车</button>
</div>
```

<details>
<summary>点击查看答案</summary>

```html
<div class="product">
  <h1>无线蓝牙耳机 Pro</h1>
  <img src="earphones.webp" alt="无线蓝牙耳机 Pro 黑色" width="600" height="600">
  <p class="price">¥599</p>
  <p class="rating">4.5 星（128 条评价）</p>
  <p class="description">高品质无线蓝牙耳机，支持主动降噪，续航 30 小时。</p>
  <button>加入购物车</button>
</div>

<!-- 结构化数据 -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "无线蓝牙耳机 Pro",
  "image": "https://example.com/earphones.webp",
  "description": "高品质无线蓝牙耳机，支持主动降噪，续航 30 小时。",
  "brand": {
    "@type": "Brand",
    "name": "品牌名称"
  },
  "offers": {
    "@type": "Offer",
    "price": "599",
    "priceCurrency": "CNY",
    "availability": "https://schema.org/InStock",
    "url": "https://example.com/product/earphones-pro"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "128"
  }
}
</script>
```

**要点**：

1. 使用 `Product` 类型描述商品
2. `offers` 包含价格、货币、库存状态
3. `aggregateRating` 包含评分和评价数
4. 搜索结果可以展示价格、评分等富摘要

</details>

### 练习 3（挑战）：综合练习 - SEO 友好的 Vue 组件

**题目**：创建一个 SEO 友好的 Vue 文章组件，动态设置 `<title>` 和 `<meta>`。

<details>
<summary>点击查看答案</summary>

```vue
<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

// 文章数据
const article = ref(null);
const loading = ref(true);
const route = useRoute();

// 获取文章数据
async function fetchArticle(id) {
  loading.value = true;
  try {
    const response = await fetch(`/api/articles/${id}`);
    article.value = await response.json();

    // 动态更新页面元数据
    updateMeta(article.value);
  } catch (error) {
    console.error('获取文章失败:', error);
  } finally {
    loading.value = false;
  }
}

// 更新页面元数据（SEO 关键）
function updateMeta(data) {
  if (!data) return;

  // 更新 title
  document.title = `${data.title} - 我的博客`;

  // 更新 description
  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) {
    descMeta.setAttribute('content', data.summary || '');
  }

  // 更新 Open Graph
  updateOG('og:title', data.title);
  updateOG('og:description', data.summary);
  updateOG('og:image', data.coverImage);
  updateOG('og:url', window.location.href);

  // 更新结构化数据
  updateStructuredData(data);
}

// 更新 Open Graph 标签
function updateOG(property, content) {
  const meta = document.querySelector(`meta[property="${property}"]`);
  if (meta && content) {
    meta.setAttribute('content', content);
  }
}

// 更新 JSON-LD 结构化数据
function updateStructuredData(data) {
  const script = document.getElementById('article-jsonld');
  if (script) {
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': data.title,
      'description': data.summary,
      'image': data.coverImage,
      'author': {
        '@type': 'Person',
        'name': data.author
      },
      'datePublished': data.publishedAt,
      'dateModified': data.updatedAt
    });
  }
}

// 路由变化时重新获取
watch(() => route.params.id, (newId) => {
  if (newId) fetchArticle(newId);
});

onMounted(() => {
  fetchArticle(route.params.id);
});
</script>

<template>
  <article v-if="article" class="article-page">
    <!-- 语义化结构 -->
    <header>
      <h1>{{ article.title }}</h1>
      <div class="meta">
        <time :datetime="article.publishedAt">
          {{ new Date(article.publishedAt).toLocaleDateString() }}
        </time>
        <span class="author">{{ article.author }}</span>
      </div>
    </header>

    <!-- 封面图片：设置宽高避免 CLS -->
    <img
      v-if="article.coverImage"
      :src="article.coverImage"
      :alt="article.title"
      width="1200"
      height="630"
      fetchpriority="high"
    >

    <!-- 文章正文 -->
    <div class="content" v-html="article.content"></div>

    <!-- 结构化数据脚本 -->
    <script id="article-jsonld" type="application/ld+json"></script>
  </article>

  <div v-else-if="loading" class="loading">加载中...</div>
</template>
```

**要点**：

1. 动态更新 `document.title` 和 `meta` 标签
2. 更新 Open Graph 标签（社交分享）
3. 动态更新 JSON-LD 结构化数据
4. 使用语义化 HTML（`<article>`、`<header>`、`<time>`）
5. 封面图片设置 `width/height` 和 `fetchpriority`
6. 路由变化时自动更新元数据

</details>

---

## 下一章预告

下一章我们会学习 **性能优化实战案例**——通过三个真实项目案例，走完诊断、优化、验证的完整流程。

你会学到：

- 电商首页优化（图片、关键 CSS、JS 延迟）
- SaaS 应用优化（代码分割、虚拟列表、内存泄漏修复）
- 内容网站优化（图片懒加载、广告脚本延迟）
- 性能优化检查清单

学完这 16 章，你就掌握了前端性能优化的完整知识体系。
