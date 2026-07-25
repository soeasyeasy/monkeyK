---
title: "第五章：图片与媒体优化"
description: "掌握图片、视频、字体等媒体资源的优化技术"
---

# 第五章：图片与媒体优化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 图片占网页体积的 50% 以上，怎么优化？
- WebP、AVIF 这些新格式到底好在哪？
- 响应式图片怎么做？不同设备加载不同尺寸？
- 视频和 GIF 怎么优化？

这一章就是为了解答这些问题。媒体资源通常是网页体积的大头，优化好了效果立竿见影。

---

## 5.1 为什么需要图片优化？

### 痛点分析

你可能遇到过这些问题：

- 页面加载慢，一查发现图片占了 80% 体积
- 图片模糊或者变形
- 移动端加载了桌面端的大图，浪费流量
- GIF 动图太大，页面卡死

打个比方：

> 图片优化就像寄快递：
> - 原图 = 一个大箱子装满空气
> - 压缩后 = 真空包装，体积缩小 70%
> - 响应式 = 根据收件地址选择合适大小的箱子

### 优化策略

```
策略层次：
1. 选择正确格式 → WebP、AVIF
2. 压缩图片 → 无损/有损压缩
3. 响应式图片 → 不同设备不同尺寸
4. 懒加载 → 视口外不加载
5. 预加载 → 首屏关键图片
```

---

## 5.2 现代图片格式

### 格式对比

| 格式 | 压缩率 | 透明度 | 动画 | 兼容性 |
| --- | --- | --- | --- | --- |
| JPEG | 中等 | 不支持 | 不支持 | 全支持 |
| PNG | 较差 | 支持 | 不支持 | 全支持 |
| WebP | 优秀 | 支持 | 支持 | 95%+ |
| AVIF | 最佳 | 支持 | 支持 | 90%+ |

### WebP 格式

```html
<!-- 使用 picture 元素提供回退 -->
<picture>
  <!-- 现代浏览器使用 WebP -->
  <source srcset="image.webp" type="image/webp">
  <!-- 旧浏览器回退到 JPEG -->
  <img src="image.jpg" alt="描述">
</picture>
```

### AVIF 格式

```html
<!-- 优先使用 AVIF -->
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="描述">
</picture>
```

**压缩效果**：

- AVIF 比 JPEG 小 50%
- WebP 比 JPEG 小 30%
- 质量几乎无损

---

## 5.3 图片压缩

### 压缩工具

```
在线工具：
├── TinyPNG（PNG/JPEG）
├── Squoosh（多格式）
└── ImageOptim（Mac）

构建工具：
├── imagemin（Node.js）
├── sharp（Node.js）
└── webpack-image-loader
```

### 压缩质量

```
JPEG 压缩质量：
├── 90-100%：高质量，体积大
├── 70-85%：平衡点（推荐）
├── 50-70%：低质量，体积小
└── < 50%：明显失真

PNG 压缩：
├── 无损压缩
├── 使用 TinyPNG 可减少 50-80%
└── 考虑使用 WebP 替代
```

---

## 5.4 响应式图片

### srcset 和 sizes

```html
<!-- 根据设备像素比选择 -->
<img 
  srcset="image-320w.jpg 320w,
          image-640w.jpg 640w,
          image-1280w.jpg 1280w"
  sizes="(max-width: 640px) 100vw,
         (max-width: 1280px) 50vw,
         1280px"
  src="image-640w.jpg"
  alt="响应式图片">
```

**说明**：

- `srcset`：提供不同宽度的图片
- `sizes`：告诉浏览器图片显示尺寸
- 浏览器自动选择最合适的图片

### art direction

```html
<!-- 不同设备使用不同图片 -->
<picture>
  <!-- 移动端：裁剪版本 -->
  <source 
    media="(max-width: 640px)" 
    srcset="mobile.jpg">
  <!-- 平板：中等版本 -->
  <source 
    media="(max-width: 1024px)" 
    srcset="tablet.jpg">
  <!-- 桌面端：完整版本 -->
  <img src="desktop.jpg" alt="响应式图片">
</picture>
```

---

## 5.5 图片懒加载

### 原生懒加载

```html
<!-- 浏览器原生支持 -->
<img src="image.webp" loading="lazy" alt="描述" width="800" height="600">
```

**注意事项**：

- 必须设置 width 和 height，避免布局偏移
- 首屏图片不要用 lazy
- 视口内的图片会立即加载

### JavaScript 懒加载

```javascript
// 使用 IntersectionObserver
const lazyImages = document.querySelectorAll('img[data-src]');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const img = entry.target;
      // 加载真实图片
      img.src = img.dataset.src;
      // 停止观察
      observer.unobserve(img);
    }
  });
}, {
  rootMargin: '50px 0px'  // 提前 50px 加载
});

lazyImages.forEach((img) => observer.observe(img));
```

---

## 5.6 视频优化

### 视频格式

```
推荐格式：
├── MP4（H.264）：兼容性最好
├── WebM（VP9）：体积更小
└── AV1：新一代，但兼容性差
```

### 视频标签优化

```html
<video 
  controls 
  preload="metadata" 
  poster="poster.webp"
  width="1280" 
  height="720">
  <!-- 优先使用 WebM -->
  <source src="video.webm" type="video/webm">
  <!-- 回退到 MP4 -->
  <source src="video.mp4" type="video/mp4">
  您的浏览器不支持视频标签
</video>
```

**说明**：

- `preload="metadata"`：只预加载元数据（时长、尺寸）
- `poster`：视频封面图
- 提供多种格式，浏览器选择支持的

### 自动播放优化

```html
<!-- 自动播放必须静音 -->
<video 
  autoplay 
  muted 
  loop 
  playsinline
  poster="poster.webp">
  <source src="video.webm" type="video/webm">
  <source src="video.mp4" type="video/mp4">
</video>
```

---

## 5.7 GIF 替代方案

### 问题

GIF 文件体积大，颜色有限（256色），性能差。

### 替代方案

```html
<!-- 方案 1：使用视频替代 GIF -->
<video autoplay muted loop playsinline>
  <source src="animation.webm" type="video/webm">
  <source src="animation.mp4" type="video/mp4">
</video>

<!-- 方案 2：使用 APNG（比 GIF 好） -->
<img src="animation.apng" alt="动画">

<!-- 方案 3：使用 Lottie（矢量动画） -->
<div id="lottie-animation"></div>
<script>
// 使用 lottie-web 库
lottie.loadAnimation({
  container: document.getElementById('lottie-animation'),
  path: 'animation.json',
  renderer: 'svg',
  loop: true,
  autoplay: true
});
</script>
```

**体积对比**：

- GIF：1MB
- WebM：100KB（减少 90%）
- Lottie：50KB（矢量，可缩放）

---

## 5.8 字体优化

### 字体加载策略

```css
/* 使用 font-display: swap */
@font-face {
  font-family: 'CustomFont';
  src: url('font.woff2') format('woff2');
  font-display: swap;  /* 先显示系统字体，字体加载后替换 */
}
```

**font-display 值**：

| 值 | 行为 |
| --- | --- |
| auto | 浏览器默认行为 |
| block | 阻塞文本显示，直到字体加载 |
| swap | 立即显示系统字体，加载后替换 |
| fallback | 短暂阻塞，然后回退 |
| optional | 如果字体已缓存则使用 |

### 字体子集化

```bash
# 使用 pyftsubset 工具
pyftsubset font.woff2 \
  --text="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" \
  --output-file=font-subset.woff2
```

**原理**：只包含页面实际用到的字符，减少字体体积。

### 预加载字体

```html
<!-- 预加载关键字体 -->
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>
```

---

## 5.9 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 现代格式 | WebP、AVIF 比 JPEG/PNG 体积更小 |
| 图片压缩 | JPEG 70-85% 质量，PNG 用工具压缩 |
| 响应式图片 | srcset + sizes，不同设备不同尺寸 |
| 懒加载 | loading="lazy"，首屏图片禁用 |
| 视频优化 | 使用 WebM/MP4，preload="metadata" |
| GIF 替代 | 使用视频或 Lottie，体积减少 90% |
| 字体优化 | font-display: swap，字体子集化 |

---

## 5.10 新手常见误区

### 误区 1："所有图片都用 WebP"

**错！** 需要考虑浏览器兼容性，提供回退方案。

**正确做法**：

1. 使用 `<picture>` 元素提供多格式
2. 优先 WebP/AVIF，回退 JPEG/PNG
3. 检查目标浏览器支持情况

### 误区 2："图片压缩越狠越好"

**错！** 压缩过度会导致画质严重下降。

**正确做法**：

1. JPEG 质量 70-85% 是平衡点
2. 在画质和体积之间找平衡
3. 使用现代格式（WebP/AVIF）

### 误区 3："首屏图片用 lazy"

**错！** 首屏图片应该立即加载，lazy 会延迟显示。

**正确做法**：

1. 首屏图片用 `loading="eager"` 或不设置
2. 配合 `fetchpriority="high"`
3. 可以 preload 首屏关键图片

### 误区 4："GIF 没法优化"

**错！** GIF 可以用视频替代，体积减少 90%。

**正确做法**：

1. 短动画用 `<video>` 替代 GIF
2. 矢量动画用 Lottie
3. 必须用 GIF 时，使用工具压缩

---

## 5.11 动手练习

### 练习 1：基础练习 - 图片格式转换

**题目**：将以下图片标签改为使用 WebP 格式，并提供回退。

```html
<img src="banner.jpg" alt="横幅">
```

<details>
<summary>点击查看答案</summary>

```html
<picture>
  <!-- 优先使用 WebP -->
  <source srcset="banner.webp" type="image/webp">
  <!-- 回退到 JPEG -->
  <img src="banner.jpg" alt="横幅" width="1200" height="400">
</picture>
```

**优化点**：

1. 使用 `<picture>` 提供多格式
2. 设置 width/height 避免布局偏移
3. WebP 体积比 JPEG 小 30%

</details>

### 练习 2：进阶练习 - 响应式图片

**题目**：为以下图片实现响应式加载，移动端加载小图，桌面端加载大图。

```html
<img src="hero.jpg" alt="首屏大图">
```

<details>
<summary>点击查看答案</summary>

```html
<img 
  srcset="hero-320w.jpg 320w,
          hero-640w.jpg 640w,
          hero-1280w.jpg 1280w,
          hero-1920w.jpg 1920w"
  sizes="(max-width: 640px) 100vw,
         (max-width: 1280px) 50vw,
         1280px"
  src="hero-1280w.jpg"
  alt="首屏大图"
  width="1920"
  height="600"
  fetchpriority="high">
```

**优化点**：

1. 提供多种尺寸（320w、640w、1280w、1920w）
2. sizes 告诉浏览器显示尺寸
3. 首屏图片使用 fetchpriority="high"
4. 设置 width/height 避免布局偏移

</details>

### 练习 3（挑战）：综合练习 - 媒体优化方案

**题目**：优化以下页面中的图片和视频。

```html
<!DOCTYPE html>
<html>
<head>
  <title>我的页面</title>
</head>
<body>
  <img src="hero.jpg">
  <img src="gallery1.jpg">
  <img src="gallery2.jpg">
  <img src="animation.gif">
  <video src="intro.mp4" controls></video>
</body>
</html>
```

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html>
<head>
  <title>我的页面</title>
  <!-- 预加载首屏图片 -->
  <link rel="preload" href="hero.webp" as="image">
</head>
<body>
  <!-- 首屏大图：WebP 格式，高优先级 -->
  <picture>
    <source srcset="hero.avif" type="image/avif">
    <source srcset="hero.webp" type="image/webp">
    <img src="hero.jpg" alt="首屏大图"
         width="1920" height="600"
         fetchpriority="high">
  </picture>

  <!-- 非首屏图片：懒加载 -->
  <picture>
    <source srcset="gallery1.webp" type="image/webp">
    <img src="gallery1.jpg" alt="图片1"
         loading="lazy" width="800" height="600">
  </picture>

  <picture>
    <source srcset="gallery2.webp" type="image/webp">
    <img src="gallery2.jpg" alt="图片2"
         loading="lazy" width="800" height="600">
  </picture>

  <!-- GIF 替换为视频 -->
  <video autoplay muted loop playsinline width="400" height="300">
    <source src="animation.webm" type="video/webm">
    <source src="animation.mp4" type="video/mp4">
  </video>

  <!-- 视频优化 -->
  <video controls preload="metadata" poster="video-poster.webp"
         width="1280" height="720">
    <source src="intro.webm" type="video/webm">
    <source src="intro.mp4" type="video/mp4">
  </video>
</body>
</html>
```

**优化点**：

1. 首屏图片使用 AVIF/WebP，preload 预加载
2. 非首屏图片使用 loading="lazy"
3. GIF 替换为 video，体积减少 90%
4. 视频使用 preload="metadata" 和 poster
5. 所有媒体设置 width/height 避免布局偏移

</details>

---

## 下一章预告

下一章我们会学习 **CSS 性能优化**——也就是如何优化 CSS 加载和渲染性能。

你会学到：

- 关键 CSS 内联
- CSS 选择器优化
- 减少重排重绘
- 使用 transform 和 opacity 做动画
