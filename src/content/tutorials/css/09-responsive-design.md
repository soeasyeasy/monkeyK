---
title: "第九章：响应式设计"
description: "媒体查询、移动优先、断点设计，让网页适配各种设备"
---

# 第九章：响应式设计

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是响应式设计？为什么现在都要做响应式？
- 怎么让网页在手机上也能正常显示？
- 媒体查询是什么？和普通 CSS 有什么区别？
- 移动优先和桌面优先有什么不同？该选哪个？

这一章就是为了解答这些问题。我们会先搞清楚 **响应式设计的本质**，再学习媒体查询、响应式单位等核心技术，最后动手实践。

---

## 1 为什么需要响应式设计？

### 痛点分析

想象一下，如果网页只能在电脑上看，会有什么问题？

- 手机上打开网页，字小得像蚂蚁，得放大才能看
- 按钮太小，手指根本点不到
- 布局横向溢出，得左右划着看
- 用户体验极差，打开就关掉了

以前的解决方案是做两个网站：一个电脑版，一个手机版。但这样问题更多：

- 维护两套代码，改个东西要改两遍
- 用户用平板访问，不知道该给哪个版本
- 搜索引擎收录混乱，SEO 受影响

打个比方：

> 以前的网页就像是只有固定尺码的衣服，胖的人穿不下，瘦的人穿着晃荡。而响应式设计就像是"弹性衣服"，能根据穿的人的身材自动调整大小，谁穿都合适。

### 解决方案

响应式设计（Responsive Web Design）就是让**一套代码，适配所有设备**的设计方法。

它的核心是：**根据屏幕尺寸，自动调整布局和样式**。

有了响应式设计，你可以：

- 写一套代码，手机、平板、电脑都能用
- 用户体验好，不管用什么设备都舒服
- 维护成本低，改一次就全站生效
- SEO 友好，搜索引擎更喜欢

> **一句话总结**：响应式设计就是网页的"自动伸缩衣"，让网页在任何设备上都好看好用。

---

## 2 核心原理

### 概念解释

响应式设计有三大核心支柱：

1. **流式布局**：用相对单位（百分比、弹性盒）代替固定像素
2. **弹性图片**：图片会根据容器大小自动缩放
3. **媒体查询**：根据屏幕特征应用不同的样式

打个比方：

> 响应式设计就像是盖房子——
> - 流式布局 = 可伸缩的房间，能大能小
> - 弹性图片 = 可缩放的家具，跟着房间变
> - 媒体查询 = 智能管家，根据客人数量调整房间布局

### 响应式 vs 自适应 vs 移动端

| 方案 | 代码套数 | 适配方式 | 灵活性 | 维护成本 |
| --- | --- | --- | --- | --- |
| 响应式 | 1 套 | 自动适应所有尺寸 | ⭐⭐⭐⭐⭐ | 低 |
| 自适应 | 多套 | 针对几个固定尺寸 | ⭐⭐⭐ | 中 |
| 独立移动端 | 2 套以上 | 完全独立的网站 | ⭐⭐ | 高 |

---

## 3 基础用法

### 第一步：设置视口（Viewport）

在写响应式之前，一定要先在 HTML 的 `<head>` 里加上视口设置：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <!-- ✅ 必须加！设置视口，让移动端按设备宽度渲染 -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>响应式页面</title>
</head>
<body>
  页面内容
</body>
</html>
```

逐行解释：
- `width=device-width` → 页面宽度等于设备宽度
- `initial-scale=1.0` → 初始缩放比例为 1（不缩放）

> 💡 **小提示**：这行代码是响应式的"入场券"，没有它，媒体查询在手机上可能不生效！

---

### 第二步：用相对单位

响应式的核心就是"弹性"，所以尽量少用固定的 `px`。

#### 百分比（%）

```css
.container {
  width: 90%;          /* 宽度是父元素的90% */
  max-width: 1200px;   /* 最大宽度1200px，再大就不放大了 */
  margin: 0 auto;      /* 水平居中 */
}
```

#### rem（根字号倍数）

```css
/* 根元素设置基础字号 */
html {
  font-size: 16px;     /* 默认16px */
}

/* 在小屏幕上缩小基础字号 */
@media (max-width: 768px) {
  html {
    font-size: 14px;   /* 手机上14px */
  }
}

/* 用 rem 定义大小 */
h1 {
  font-size: 2rem;     /* 桌面端 32px，手机端 28px，自动变！ */
}
```

#### vw / vh（视口单位）

```css
.hero {
  height: 100vh;       /* 高度等于视口高度，满屏效果 */
}

.title {
  font-size: 5vw;      /* 字号是视口宽度的5%，屏幕越大字越大 */
}
```

| 单位 | 含义 | 类比 |
| --- | --- | --- |
| `vw` | 视口宽度的 1% | 相对于屏幕宽度 |
| `vh` | 视口高度的 1% | 相对于屏幕高度 |
| `vmin` | vw 和 vh 中较小的 | 取短边，保证不溢出 |
| `vmax` | vw 和 vh 中较大的 | 取长边，铺满屏幕 |

#### clamp() 神器

```css
h1 {
  /* 最小 1.5rem，首选 4vw，最大 3rem */
  font-size: clamp(1.5rem, 4vw, 3rem);
}
```

> **原理**：`clamp(最小值, 首选值, 最大值)` 就像一个"自动调节范围"——首选值在最小值和最大值之间时用首选值，超出范围就被"卡住"。

---

### 第三步：媒体查询（Media Query）

媒体查询是响应式设计的"核心武器"，它让你可以**根据屏幕特征应用不同样式**。

#### 基本语法

```css
/* 当屏幕宽度 <= 768px 时，应用这里面的样式 */
@media (max-width: 768px) {
  /* 写在里面的样式，只有满足条件才生效 */
  .container {
    padding: 10px;
  }
}
```

#### 常用媒体特征

```css
/* 最大宽度（小于等于） */
@media (max-width: 768px) {
  /* 手机端样式 */
}

/* 最小宽度（大于等于） */
@media (min-width: 1024px) {
  /* 桌面端样式 */
}

/* 宽度范围 */
@media (min-width: 768px) and (max-width: 1024px) {
  /* 平板端样式 */
}

/* 横屏模式 */
@media (orientation: landscape) {
  /* 横屏时的样式 */
}

/* 深色模式偏好 */
@media (prefers-color-scheme: dark) {
  /* 用户喜欢深色模式时的样式 */
}

/* 支持悬停的设备（比如有鼠标的电脑） */
@media (hover: hover) {
  .btn:hover {
    background: blue;
  }
}
```

✅ **推荐写法**：移动端优先，用 `min-width` 从小到大加样式。

---

### 移动优先 vs 桌面优先

#### 移动优先（✅ 推荐）

先写移动端样式，再用 `min-width` 逐步增强：

```css
/* 基础样式：移动端默认 */
.grid {
  display: flex;
  flex-direction: column;   /* 手机上竖向排列 */
  gap: 16px;
}

/* 平板及以上（>= 768px） */
@media (min-width: 768px) {
  .grid {
    flex-direction: row;     /* 平板及以上横向排列 */
    flex-wrap: wrap;
  }
  .grid-item {
    width: 50%;              /* 一行2个 */
  }
}

/* 桌面及以上（>= 1024px） */
@media (min-width: 1024px) {
  .grid-item {
    width: 33.333%;          /* 一行3个 */
  }
}
```

#### 桌面优先

先写桌面端样式，再用 `max-width` 逐步降级：

```css
/* 基础样式：桌面端默认 */
.grid-item {
  width: 33.333%;            /* 一行3个 */
}

/* 平板及以下（<= 1024px） */
@media (max-width: 1024px) {
  .grid-item {
    width: 50%;              /* 一行2个 */
  }
}

/* 手机端（<= 768px） */
@media (max-width: 768px) {
  .grid-item {
    width: 100%;             /* 一行1个 */
  }
}
```

> **为什么推荐移动优先？**
> - 移动端样式更简单，从简到繁更容易
> - 移动端用户越来越多，优先保障移动端体验
> - 渐进增强比优雅降级更科学

---

## 4 响应式布局实战

### 响应式卡片网格

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <!-- 视口设置，必须加！ -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>响应式卡片网格</title>
  <style>
    /* ===== 全局重置 ===== */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;   /* 内边距和边框算在宽高里 */
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }

    /* ===== 容器 ===== */
    .container {
      width: 90%;               /* 宽度是父元素的90% */
      max-width: 1200px;        /* 最大宽度1200px */
      margin: 0 auto;           /* 水平居中 */
    }

    .page-title {
      text-align: center;
      margin-bottom: 30px;
      font-size: clamp(1.5rem, 4vw, 2.5rem);  /* 响应式字号 */
      color: #333;
    }

    /* ===== 卡片网格 ===== */
    .card-grid {
      display: grid;
      /* 核心：auto-fit + minmax，自动适配！ */
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    /* ===== 卡片样式 ===== */
    .card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s, box-shadow 0.3s;
    }

    /* 只在支持悬停的设备上加 hover 效果 */
    @media (hover: hover) {
      .card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      }
    }

    .card-image {
      width: 100%;
      aspect-ratio: 16 / 9;     /* 固定宽高比 */
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      font-size: 20px;
    }

    .card-body {
      padding: 20px;
    }

    .card-title {
      font-size: 18px;
      margin-bottom: 8px;
      color: #333;
    }

    .card-desc {
      font-size: 14px;
      color: #666;
      line-height: 1.5;
    }

    /* ===== 手机端特殊处理 ===== */
    @media (max-width: 576px) {
      body {
        padding: 12px;           /* 手机上padding小一点 */
      }
      
      .card-grid {
        gap: 12px;               /* 卡片间距小一点 */
      }
      
      .card-body {
        padding: 16px;           /* 卡片内边距小一点 */
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="page-title">响应式卡片网格</h1>
    
    <div class="card-grid">
      <div class="card">
        <div class="card-image">图片 1</div>
        <div class="card-body">
          <h3 class="card-title">卡片标题 1</h3>
          <p class="card-desc">这是卡片的描述文字，介绍卡片内容。</p>
        </div>
      </div>
      
      <div class="card">
        <div class="card-image">图片 2</div>
        <div class="card-body">
          <h3 class="card-title">卡片标题 2</h3>
          <p class="card-desc">这是卡片的描述文字，介绍卡片内容。</p>
        </div>
      </div>
      
      <div class="card">
        <div class="card-image">图片 3</div>
        <div class="card-body">
          <h3 class="card-title">卡片标题 3</h3>
          <p class="card-desc">这是卡片的描述文字，介绍卡片内容。</p>
        </div>
      </div>
      
      <div class="card">
        <div class="card-image">图片 4</div>
        <div class="card-body">
          <h3 class="card-title">卡片标题 4</h3>
          <p class="card-desc">这是卡片的描述文字，介绍卡片内容。</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

> **核心技巧**：`grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))` 这一行是响应式网格的神器——自动计算能放几列，放不下就换行，完全不用写媒体查询！

---

### 响应式导航栏

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>响应式导航栏</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* ===== 导航栏基础样式 ===== */
    .navbar {
      background: #333;
      padding: 16px 24px;
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      color: white;
      font-size: 20px;
      font-weight: bold;
    }

    .nav-links {
      display: flex;
      gap: 24px;
      list-style: none;
    }

    .nav-links a {
      color: white;
      text-decoration: none;
      font-size: 14px;
      transition: color 0.3s;
    }

    .nav-links a:hover {
      color: #007bff;
    }

    /* ===== 移动端样式 ===== */
    @media (max-width: 768px) {
      .nav-container {
        flex-direction: column;    /* 手机上竖向排列 */
        gap: 12px;
      }

      .nav-links {
        flex-direction: column;    /* 链接竖向排列 */
        gap: 8px;
        width: 100%;
        text-align: center;
      }

      .nav-links li {
        padding: 8px;
        border-radius: 4px;
      }

      .nav-links li:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    /* ===== 演示内容 ===== */
    .content {
      max-width: 1200px;
      margin: 40px auto;
      padding: 0 24px;
    }

    .content h1 {
      margin-bottom: 16px;
      color: #333;
    }

    .content p {
      color: #666;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <nav class="navbar">
    <div class="nav-container">
      <div class="logo">我的网站</div>
      <ul class="nav-links">
        <li><a href="#">首页</a></li>
        <li><a href="#">产品</a></li>
        <li><a href="#">关于</a></li>
        <li><a href="#">联系</a></li>
      </ul>
    </div>
  </nav>

  <div class="content">
    <h1>响应式导航栏演示</h1>
    <p>试着调整浏览器窗口大小，看看导航栏怎么变化~</p>
    <p>在宽屏幕上，Logo 和导航链接在同一行；在窄屏幕上，它们变成竖向排列。</p>
  </div>
</body>
</html>
```

---

## 5 断点设计对比表

### 常见断点参考

| 设备类型 | 宽度范围 | Bootstrap | Tailwind | 推荐 |
| --- | --- | --- | --- | --- |
| 手机（竖屏） | < 576px | xs（默认） | base（默认） | < 768px |
| 手机（横屏）/ 小平板 | 576px - 768px | sm | sm | - |
| 平板 | 768px - 1024px | md | md | 768px+ |
| 笔记本/小桌面 | 1024px - 1440px | lg | lg | 1024px+ |
| 大桌面 | 1440px + | xl / xxl | xl / 2xl | 1440px+ |

> 💡 **建议**：不用纠结精确的断点值，根据内容调整就好。一般项目设 3-4 个断点就够用了。

### 移动优先 vs 桌面优先对比

| 维度 | 移动优先（min-width） | 桌面优先（max-width） |
| --- | --- | --- |
| 开发顺序 | 手机 → 平板 → 桌面 | 桌面 → 平板 → 手机 |
| 代码特点 | 渐进增强，越写越多 | 优雅降级，越写越覆盖 |
| 移动端体验 | 优先保障，最好 | 可能被忽略 |
| 性能 | 移动端加载的 CSS 少 | 移动端加载的 CSS 多 |
| 推荐度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 6 新手常见误区

### 误区 1："响应式就是写很多媒体查询"

**错！** 很多新手以为响应式就是写一大堆媒体查询，其实不是。

最好的响应式是：**尽量不用媒体查询也能自适应**。

比如：
- 用 `flex-wrap` 让元素自动换行
- 用 `grid` 的 `auto-fit + minmax` 自动调整列数
- 用相对单位（%、rem、vw）代替固定 px

**正确做法**：先写弹性布局，实在不行再加媒体查询。媒体查询是"补充"，不是"主力"。

---

### 误区 2："px 完全不能用"

**不对！** 不是说响应式就完全不能用 px，而是**该用 px 的地方用 px，该用相对单位的地方用相对单位**。

比如：
- 边框 `border: 1px solid #ccc` → 用 px 没问题，1px 就是 1px
- 小间距 `gap: 4px` → 用 px 没问题
- 大布局宽度、字号、内边距 → 用相对单位更好

**正确做法**：小的、固定的尺寸用 px；大的、需要弹性的用相对单位。

---

### 误区 3："设置了 viewport 就万事大吉了"

**不够！** viewport 只是基础，还要注意很多细节：

- 图片要设 `max-width: 100%`，不然图片会溢出
- 不要设置固定宽度，比如 `width: 1200px`，要用 `max-width`
- 表格在手机上很容易横向溢出，要特殊处理
- 文字不要太小，手机上至少 14px

**正确做法**：设置 viewport 之后，还要检查图片、表格、字体等各种细节。

---

### 误区 4："只在电脑上测试，手机上应该差不多"

**大错特错！** 你在电脑上缩小窗口看着没问题，不代表在真实手机上没问题。

常见的坑：
- `hover` 效果在手机上没用（手机没有鼠标悬停）
- `100vh` 在手机浏览器上可能因为地址栏显示/隐藏导致跳动
- 字体渲染在不同设备上不一样
- 点击区域太小，手指点不到

**正确做法**：
- 用浏览器的设备模拟工具测试（F12 → 手机图标）
- 最好用真实手机测试
- 用 `@media (hover: hover)` 区分有没有鼠标

---

## 7 动手练习

### 练习 1：基础练习

创建一个响应式图片画廊：

- 图片网格布局，自动换行
- 大屏幕一行 4 个，平板一行 2 个，手机一行 1 个
- 图片有圆角和间距
- 图片宽度自适应，高度保持比例

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>练习1：响应式图片画廊</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background: #f5f5f5;
    }

    h1 {
      text-align: center;
      margin-bottom: 30px;
      color: #333;
    }

    /* 图片网格 */
    .gallery {
      display: grid;
      grid-template-columns: repeat(4, 1fr);  /* 默认一行4个 */
      gap: 16px;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* 图片项 */
    .gallery-item {
      border-radius: 8px;
      overflow: hidden;
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .gallery-item img {
      width: 100%;
      height: 180px;
      object-fit: cover;
      display: block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .gallery-caption {
      padding: 12px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }

    /* 平板：一行2个 */
    @media (max-width: 1024px) {
      .gallery {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* 手机：一行1个 */
    @media (max-width: 576px) {
      .gallery {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      
      body {
        padding: 12px;
      }
    }
  </style>
</head>
<body>
  <h1>响应式图片画廊</h1>
  
  <div class="gallery">
    <div class="gallery-item">
      <img src="" alt="图片1">
      <div class="gallery-caption">风景 1</div>
    </div>
    <div class="gallery-item">
      <img src="" alt="图片2">
      <div class="gallery-caption">风景 2</div>
    </div>
    <div class="gallery-item">
      <img src="" alt="图片3">
      <div class="gallery-caption">风景 3</div>
    </div>
    <div class="gallery-item">
      <img src="" alt="图片4">
      <div class="gallery-caption">风景 4</div>
    </div>
    <div class="gallery-item">
      <img src="" alt="图片5">
      <div class="gallery-caption">风景 5</div>
    </div>
    <div class="gallery-item">
      <img src="" alt="图片6">
      <div class="gallery-caption">风景 6</div>
    </div>
    <div class="gallery-item">
      <img src="" alt="图片7">
      <div class="gallery-caption">风景 7</div>
    </div>
    <div class="gallery-item">
      <img src="" alt="图片8">
      <div class="gallery-caption">风景 8</div>
    </div>
  </div>
</body>
</html>
```

</details>

---

### 练习 2：进阶练习

实现一个响应式文章页面：

- 顶部导航栏（手机上变成竖向排列）
- 文章内容区域，宽度自适应
- 侧边栏（大屏幕在右边，手机上藏到下面）
- 适当的字体大小和行高，阅读舒适

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>练习2：响应式文章页面</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8f9fa;
      color: #333;
      line-height: 1.6;
    }

    /* ===== 导航栏 ===== */
    .navbar {
      background: #222;
      color: white;
      padding: 16px 24px;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 18px;
      font-weight: bold;
    }

    .nav-links {
      display: flex;
      gap: 20px;
      list-style: none;
    }

    .nav-links a {
      color: #ccc;
      text-decoration: none;
      font-size: 14px;
      transition: color 0.3s;
    }

    .nav-links a:hover {
      color: white;
    }

    /* ===== 主体布局 ===== */
    .layout {
      max-width: 1200px;
      margin: 30px auto;
      padding: 0 24px;
      display: grid;
      grid-template-columns: 1fr 300px;  /* 内容 + 侧边栏 */
      gap: 30px;
    }

    /* ===== 文章内容 ===== */
    .article {
      background: white;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .article-title {
      font-size: clamp(1.5rem, 3vw, 2rem);
      margin-bottom: 12px;
      line-height: 1.3;
    }

    .article-meta {
      color: #999;
      font-size: 14px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #eee;
    }

    .article-content p {
      margin-bottom: 16px;
      font-size: 16px;
      color: #444;
    }

    .article-content h2 {
      margin-top: 32px;
      margin-bottom: 16px;
      font-size: 1.5rem;
    }

    /* ===== 侧边栏 ===== */
    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .sidebar-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .sidebar-card h3 {
      font-size: 16px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #007bff;
    }

    .sidebar-card ul {
      list-style: none;
    }

    .sidebar-card li {
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .sidebar-card li:last-child {
      border-bottom: none;
    }

    .sidebar-card a {
      color: #666;
      text-decoration: none;
      font-size: 14px;
      transition: color 0.3s;
    }

    .sidebar-card a:hover {
      color: #007bff;
    }

    /* ===== 平板样式 ===== */
    @media (max-width: 1024px) {
      .layout {
        grid-template-columns: 1fr;  /* 变成单列 */
      }
      
      .sidebar {
        order: -1;  /* 侧边栏放到上面？不，还是下面吧，手机上也是下面 */
      }
    }

    /* ===== 手机样式 ===== */
    @media (max-width: 768px) {
      .nav-container {
        flex-direction: column;
        gap: 12px;
      }
      
      .nav-links {
        gap: 12px;
      }
      
      .layout {
        padding: 0 16px;
        margin: 20px auto;
        gap: 20px;
      }
      
      .article {
        padding: 24px;
      }
      
      .article-content p {
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <!-- 导航栏 -->
  <nav class="navbar">
    <div class="nav-container">
      <div class="logo">我的博客</div>
      <ul class="nav-links">
        <li><a href="#">首页</a></li>
        <li><a href="#">归档</a></li>
        <li><a href="#">关于</a></li>
      </ul>
    </div>
  </nav>

  <!-- 主体内容 -->
  <div class="layout">
    <!-- 文章 -->
    <article class="article">
      <h1 class="article-title">学习响应式设计的心得体会</h1>
      <div class="article-meta">发布于 2024年1月1日 · 阅读时间 5 分钟</div>
      
      <div class="article-content">
        <p>响应式设计是现代前端开发的必备技能。以前我们需要为不同设备写不同的代码，现在一套代码就够了。</p>
        
        <h2>什么是响应式设计</h2>
        <p>响应式设计就是让网页能够根据屏幕尺寸自动调整布局和样式，在任何设备上都有良好的显示效果。</p>
        
        <p>它的核心技术包括：流式布局、弹性图片和媒体查询。这三者结合，就能打造出体验优秀的响应式网站。</p>
        
        <h2>为什么要做响应式</h2>
        <p>现在移动设备越来越多，很多网站的移动端流量已经超过了 PC 端。如果你的网站在手机上没法看，就会流失大量用户。</p>
        
        <p>而且响应式设计只需要维护一套代码，成本更低，用户体验也更好。</p>
        
        <h2>如何开始</h2>
        <p>首先设置 viewport 标签，然后用相对单位代替固定像素，再用媒体查询调整不同尺寸的布局。</p>
        
        <p>建议采用移动优先的开发策略，先保证移动端的体验，再逐步增强桌面端的效果。</p>
      </div>
    </article>

    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-card">
        <h3>热门文章</h3>
        <ul>
          <li><a href="#">CSS Flexbox 完全指南</a></li>
          <li><a href="#">Grid 布局实战技巧</a></li>
          <li><a href="#">CSS 变量的妙用</a></li>
          <li><a href="#">前端性能优化要点</a></li>
        </ul>
      </div>
      
      <div class="sidebar-card">
        <h3>分类目录</h3>
        <ul>
          <li><a href="#">HTML / CSS</a></li>
          <li><a href="#">JavaScript</a></li>
          <li><a href="#">Vue.js</a></li>
          <li><a href="#">工具推荐</a></li>
        </ul>
      </div>
    </aside>
  </div>
</body>
</html>
```

</details>

---

### 练习 3（挑战）：综合练习

实现一个响应式登录页面：

- 页面居中，左边是配图/介绍，右边是登录表单
- 大屏幕左右布局，手机上上下布局
- 表单有输入框和按钮，样式简洁美观
- 适配深色模式偏好（`prefers-color-scheme: dark`）
- 整体风格现代、简洁

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>练习3：响应式登录页面</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f0f2f5;
      color: #333;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    /* ===== 登录容器 ===== */
    .login-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      max-width: 900px;
      width: 100%;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }

    /* ===== 左侧介绍区 ===== */
    .login-left {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 60px 40px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .login-left h1 {
      font-size: 2rem;
      margin-bottom: 16px;
    }

    .login-left p {
      opacity: 0.9;
      line-height: 1.6;
      font-size: 15px;
    }

    .features {
      margin-top: 32px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
    }

    .feature-icon {
      width: 24px;
      height: 24px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }

    /* ===== 右侧表单区 ===== */
    .login-right {
      padding: 60px 48px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .login-right h2 {
      font-size: 1.75rem;
      margin-bottom: 8px;
    }

    .login-subtitle {
      color: #888;
      margin-bottom: 32px;
      font-size: 14px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #555;
    }

    .form-group input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 15px;
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
    }

    .form-group input:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      font-size: 13px;
    }

    .remember-me {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #666;
      cursor: pointer;
    }

    .forgot-password {
      color: #667eea;
      text-decoration: none;
    }

    .forgot-password:hover {
      text-decoration: underline;
    }

    .btn-login {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn-login:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-login:active {
      transform: translateY(0);
    }

    .signup-link {
      text-align: center;
      margin-top: 24px;
      font-size: 14px;
      color: #666;
    }

    .signup-link a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }

    .signup-link a:hover {
      text-decoration: underline;
    }

    /* ===== 平板及以下 ===== */
    @media (max-width: 768px) {
      body {
        padding: 0;
        background: white;
        display: block;
      }
      
      .login-container {
        grid-template-columns: 1fr;
        border-radius: 0;
        box-shadow: none;
        min-height: 100vh;
      }
      
      .login-left {
        padding: 40px 24px;
        text-align: center;
      }
      
      .login-left h1 {
        font-size: 1.5rem;
      }
      
      .features {
        display: none;  /* 手机上隐藏特性列表，节省空间 */
      }
      
      .login-right {
        padding: 32px 24px;
      }
      
      .login-right h2 {
        font-size: 1.5rem;
      }
    }

    /* ===== 深色模式 ===== */
    @media (prefers-color-scheme: dark) {
      body {
        background: #1a1a2e;
        color: #e0e0e0;
      }
      
      .login-container {
        background: #16213e;
      }
      
      .login-right h2 {
        color: #fff;
      }
      
      .login-subtitle {
        color: #999;
      }
      
      .form-group label {
        color: #aaa;
      }
      
      .form-group input {
        background: #0f3460;
        border-color: #1a1a2e;
        color: #e0e0e0;
      }
      
      .form-group input:focus {
        border-color: #667eea;
      }
      
      .remember-me {
        color: #aaa;
      }
      
      .signup-link {
        color: #999;
      }
    }

    /* ===== 深色模式 + 手机 ===== */
    @media (prefers-color-scheme: dark) and (max-width: 768px) {
      body {
        background: #16213e;
      }
    }
  </style>
</head>
<body>
  <div class="login-container">
    <!-- 左侧介绍 -->
    <div class="login-left">
      <h1>欢迎回来</h1>
      <p>登录你的账户，探索更多精彩内容。我们致力于为你提供最好的服务体验。</p>
      
      <div class="features">
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          <span>安全可靠的数据保护</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          <span>7×24 小时客户支持</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          <span>极速响应体验</span>
        </div>
      </div>
    </div>

    <!-- 右侧表单 -->
    <div class="login-right">
      <h2>登录</h2>
      <p class="login-subtitle">请输入你的账户信息</p>
      
      <form>
        <div class="form-group">
          <label for="email">邮箱</label>
          <input type="email" id="email" placeholder="请输入邮箱" required>
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input type="password" id="password" placeholder="请输入密码" required>
        </div>
        
        <div class="form-options">
          <label class="remember-me">
            <input type="checkbox"> 记住我
          </label>
          <a href="#" class="forgot-password">忘记密码？</a>
        </div>
        
        <button type="submit" class="btn-login">登录</button>
      </form>
      
      <p class="signup-link">
        还没有账户？<a href="#">立即注册</a>
      </p>
    </div>
  </div>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **CSS 过渡与动画**——也就是让网页元素动起来的技术。你会学到 transition 过渡、animation 动画、@keyframes 关键帧等知识，掌握了动画，你的网页就能更加生动有趣了！
