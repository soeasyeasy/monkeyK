---
title: "第十五章：SEO 与性能"
description: "SEO 基础、性能对 SEO 的影响、优化协同策略"
---

# 第十五章：SEO 与性能

## SEO 基础

### 搜索引擎工作原理

```
爬虫抓取 → 索引建立 → 排名计算

关键因素：
- 内容质量
- 页面性能
- 用户体验
- 技术优化
```

### Core Web Vitals 与排名

Google 将核心网页指标作为排名因素：

| 指标 | 良好阈值 | 影响 |
| --- | --- | --- |
| LCP | ≤ 2.5s | 加载性能 |
| INP | ≤ 200ms | 交互响应 |
| CLS | ≤ 0.1 | 视觉稳定性 |

## 性能对 SEO 的影响

### 加载速度与跳出率

```
页面加载时间 vs 跳出率：
1-3秒：32%
1-5秒：90%
超过 5秒：跳出率显著增加

Google 数据：
- 加载时间从 1s 到 3s，跳出率增加 32%
- 加载时间从 1s 到 5s，跳出率增加 90%
```

### 移动端优先索引

```
Google 使用移动端版本进行索引和排名

移动端优化要点：
- 响应式设计
- 移动端性能
- 触摸友好
- 移动优先 CSS
```

## 技术 SEO 优化

### 元数据优化

```html
<!-- 基础元数据 -->
<title>页面标题 - 品牌名称</title>
<meta name="description" content="页面描述，50-160 字符">

<!-- Open Graph -->
<meta property="og:title" content="分享标题">
<meta property="og:description" content="分享描述">
<meta property="og:image" content="分享图片 URL">
<meta property="og:url" content="页面 URL">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Twitter 标题">
<meta name="twitter:description" content="Twitter 描述">
<meta name="twitter:image" content="Twitter 图片">
```

### 结构化数据

```html
<!-- JSON-LD 结构化数据 -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "文章标题",
  "description": "文章描述",
  "image": "封面图片 URL",
  "author": {
    "@type": "Person",
    "name": "作者名称"
  },
  "datePublished": "2024-01-01",
  "dateModified": "2024-01-15"
}
</script>
```

### 语义化 HTML

```html
<!-- 使用语义化标签 -->
<header>
  <nav>导航</nav>
</header>

<main>
  <article>
    <h1>文章标题</h1>
    <section>
      <h2>章节标题</h2>
      <p>内容</p>
    </section>
  </article>
</main>

<aside>侧边栏</aside>

<footer>页脚</footer>
```

## 性能与 SEO 协同优化

### 预渲染 / SSR

```javascript
// Vue SSR 示例
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';

const app = createSSRApp(App);
const html = await renderToString(app);

// 搜索引擎可以直接抓取完整 HTML
res.send(`
  <!DOCTYPE html>
  <html>
    <head>
      <title>SEO 友好标题</title>
      <meta name="description" content="SEO 友好描述">
    </head>
    <body>
      <div id="app">${html}</div>
    </body>
  </html>
`);
```

### 动态渲染

```
根据 User-Agent 判断：
- 搜索引擎爬虫：返回预渲染 HTML
- 普通用户：返回 SPA

注意：
- 需要保持一致性
- 避免 cloaking（欺骗）
- 符合搜索引擎指南
```

### 图片 SEO

```html
<!-- 优化图片 alt 文本 -->
<img src="product.webp" alt="红色运动鞋 男款 透气">

<!-- 使用 picture 元素提供多格式 -->
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="描述性文本" loading="lazy">
</picture>
```

### 链接优化

```html
<!-- 内部链接优化 -->
<a href="/related-article" title="相关文章标题">相关文章</a>

<!-- 外部链接添加 nofollow -->
<a href="https://external.com" rel="nofollow noopener" target="_blank">
  外部链接
</a>

<!-- 锚文本优化 -->
<a href="/seo-guide">SEO 优化完全指南</a>
<!-- 避免：点击这里 -->
```

## 页面速度优化清单

### 加载性能

```
□ 启用 Gzip/Brotli 压缩
□ 优化图片格式和大小
□ 使用 CDN 加速
□ 启用浏览器缓存
□ 减少 HTTP 请求
□ 内联关键 CSS
□ 延迟加载非关键 JS
□ 预加载关键资源
```

### 渲染性能

```
□ 优化关键渲染路径
□ 减少阻塞资源
□ 使用 async/defer 加载脚本
□ 优化 CSS 选择器
□ 避免布局抖动
□ 使用 will-change 优化动画
□ 实现虚拟列表
```

### 移动端优化

```
□ 响应式设计
□ 触摸目标尺寸
□ 移动端图片优化
□ 字体加载策略
□ 离线支持
□ 网络感知加载
```

## 监控与测试

### Lighthouse SEO 审计

```
检查项目：
- meta 标签
- 结构化数据
- 移动端友好
- HTTPS
- 规范链接
- 语言声明
```

### 搜索引擎工具

```
Google Search Console：
- 索引状态
- 搜索表现
- Core Web Vitals
- 移动可用性

Bing Webmaster Tools：
- 类似功能
- Bing 特定优化
```

## 核心知识点

1. **Core Web Vitals**：LCP、INP、CLS 直接影响搜索排名
2. **技术 SEO**：元数据、结构化数据、语义化 HTML
3. **预渲染/SSR**：确保搜索引擎可抓取完整内容
4. **图片 SEO**：优化 alt 文本，使用现代格式
5. **性能清单**：系统化检查和优化页面性能
