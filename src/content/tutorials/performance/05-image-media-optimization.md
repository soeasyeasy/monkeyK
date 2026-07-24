---
title: "第五章：图片与媒体优化"
description: "掌握图片格式选择、响应式图片、视频优化等技术"
---

# 第五章：图片与媒体优化

## 图片格式选择

### 现代图片格式

| 格式 | 压缩 | 透明度 | 动画 | 兼容性 | 适用场景 |
| --- | --- | --- | --- | --- | --- |
| WebP | 有损/无损 | 支持 | 支持 | 现代浏览器 | 通用替代 |
| AVIF | 有损/无损 | 支持 | 支持 | 较新浏览器 | 极致压缩 |
| JPEG XL | 有损/无损 | 支持 | 支持 | 实验性 | 未来标准 |

### 格式选择策略

```
照片类：WebP / AVIF（有损压缩）
图标类：SVG（矢量无损）
截图类：PNG（无损）
动画类：WebP / 视频替代 GIF
```

### 使用 picture 元素提供多格式

```html
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="描述" width="800" height="600">
</picture>
```

## 响应式图片

### srcset 与 sizes

```html
<img
  src="image-800.jpg"
  srcset="
    image-400.jpg 400w,
    image-800.jpg 800w,
    image-1200.jpg 1200w,
    image-1600.jpg 1600w
  "
  sizes="(max-width: 600px) 100vw,
         (max-width: 1200px) 50vw,
         800px"
  alt="描述"
>
```

浏览器会根据视口宽度和设备像素比选择最合适的图片。

### art direction

不同视口使用不同裁剪的图片：

```html
<picture>
  <!-- 移动端使用竖向裁剪 -->
  <source media="(max-width: 600px)" srcset="hero-mobile.webp">
  <!-- 平板使用方形裁剪 -->
  <source media="(max-width: 1024px)" srcset="hero-tablet.webp">
  <!-- 桌面端使用完整图片 -->
  <img src="hero-desktop.webp" alt="描述">
</picture>
```

## 图片压缩

### 有损压缩

```
JPEG 压缩建议：
- 高质量：85-95（打印品质）
- 中等质量：70-85（网页推荐）
- 低质量：50-70（缩略图）
```

### 无损压缩

```
PNG 压缩工具：
- pngquant：有损压缩 PNG，大幅减小体积
- optipng：无损优化
- SVGO：SVG 优化
```

### 自动化压缩

```javascript
// Vite 图片压缩插件配置
import { defineConfig } from 'vite';
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    viteImagemin({
      gifsicle: { optimizationLevel: 3 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.65, 0.9] },
      svgo: {
        plugins: [
          { name: 'removeViewBox' },
          { name: 'removeEmptyAttrs', active: false }
        ]
      }
    })
  ]
});
```

## 图片懒加载优化

### 渐进式加载

```html
<!-- 先显示模糊缩略图，再加载完整图片 -->
<img
  src="thumbnail-blur.webp"
  data-src="full-image.webp"
  class="progressive"
  alt="描述"
>

<style>
.progressive {
  transition: filter 0.3s;
}
.progressive.loaded {
  filter: blur(0);
}
</style>
```

### 占位符策略

```html
<!-- 使用 CSS 渐变作为占位符 -->
<div class="image-placeholder" style="background: linear-gradient(45deg, #f0f0f0, #e0e0e0);">
  <img src="image.webp" loading="lazy" alt="描述"
       onload="this.parentElement.classList.remove('placeholder')">
</div>
```

## 视频优化

### 视频格式选择

| 格式 | 压缩率 | 兼容性 | 适用场景 |
| --- | --- | --- | --- |
| MP4 (H.264) | 中等 | 最佳 | 通用兼容 |
| WebM (VP9) | 高 | 良好 | 现代浏览器 |
| MP4 (H.265) | 最高 | 较差 | 高端设备 |

### 多格式提供

```html
<video controls width="800">
  <source src="video.webm" type="video/webm">
  <source src="video.mp4" type="video/mp4">
  您的浏览器不支持视频播放
</video>
```

### 视频懒加载

```html
<!-- 使用 preload 控制 -->
<video preload="none" poster="poster.webp" controls>
  <source src="video.webm" type="video/webm">
</video>
```

### 自动播放优化

```html
<!-- 静音自动播放（大多数浏览器允许） -->
<video autoplay muted loop playsinline>
  <source src="background.webm" type="video/webm">
</video>
```

## 替代 GIF 的方案

GIF 文件体积大，颜色有限，考虑以下替代方案：

### 使用视频替代

```html
<!-- 视频比 GIF 小 80% 以上 -->
<video autoplay loop muted playsinline>
  <source src="animation.webm" type="video/webm">
  <source src="animation.mp4" type="video/mp4">
</video>
```

### 使用 APNG / WebP 动画

```html
<!-- WebP 动画，体积更小 -->
<img src="animation.webp" alt="动画描述">
```

## SVG 优化

### SVG 内联 vs 外部

```html
<!-- 内联 SVG（可直接 CSS 控制） -->
<svg viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="currentColor"/>
</svg>

<!-- 外部 SVG（可缓存） -->
<img src="icon.svg" alt="图标">
```

### SVG 压缩

```xml
<!-- 优化前 -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- 多余的空格、注释、编辑器元数据 -->
</svg>

<!-- 优化后 -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 10a40 40 0 100 80 40 40 0 000-80z"/></svg>
```

使用 SVGO 或 SVGOMG 工具优化。

## 图片 CDN

### 动态图片转换

```html
<!-- 通过 URL 参数动态调整 -->
<img src="https://cdn.example.com/image.jpg?w=800&h=600&format=webp&q=80">
```

### srcset 配合 CDN

```html
<img
  srcset="
    https://cdn.example.com/img.jpg?w=400&format=webp 400w,
    https://cdn.example.com/img.jpg?w=800&format=webp 800w,
    https://cdn.example.com/img.jpg?w=1200&format=webp 1200w
  "
  sizes="(max-width: 600px) 100vw, 50vw"
  src="https://cdn.example.com/img.jpg?w=800"
  alt="描述"
>
```

## 核心知识点

1. **现代格式优先**：WebP / AVIF 比 JPEG/PNG 体积小 30-50%
2. **响应式图片**：srcset + sizes 让浏览器选择最优图片
3. **渐进式加载**：先显示缩略图，再加载完整图片
4. **视频替代 GIF**：体积减小 80% 以上
5. **SVG 优化**：使用工具压缩，减少不必要的信息
