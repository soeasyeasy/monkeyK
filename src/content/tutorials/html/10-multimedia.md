---
title: "第十章：多媒体元素"
description: "在网页中嵌入音频、视频和响应式图片"
---

# 第十章：多媒体元素

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何在网页中播放音乐和视频？
- 为什么有时候视频无法播放？
- 怎么让图片在不同设备上显示合适的大小？
- 如何添加字幕让视频更易访问？

这一章就是为了解答这些问题。我们会学习 ``、`<video>`、`<picture>` 等标签，让网页动起来。

---

## 10.1 为什么需要多媒体元素？

### 痛点分析

在 HTML5 之前，播放音视频需要借助 Flash 等第三方插件：

```html
<!-- 旧时代的做法 -->
<object type="application/x-shockwave-flash" data="player.swf">
  <param name="movie" value="player.swf">
  <param name="flashvars" value="file=movie.mp4">
</object>
```

这种做法有什么问题？

1. **需要安装插件**：用户必须安装 Flash Player 才能播放
2. **兼容性差**：不同浏览器对插件的支持不一致
3. **性能差**：插件占用大量资源，容易卡顿
4. **安全风险**：插件可能有漏洞，被恶意利用

> **一句话总结**：用插件就像必须戴特殊眼镜才能看电视，太麻烦了！

### 解决方案

HTML5 提供了原生的多媒体标签，不需要任何插件：

```html
<!-- HTML5 原生支持 -->
<video src="movie.mp4" controls></video>
```

打个比方：

> HTML5 多媒体标签就像自带播放器的电视机——买回来就能用，不需要额外安装机顶盒。

---

## 10.2 核心原理

### 概念解释

HTML5 多媒体元素的工作原理：

1. 浏览器内置了音视频解码器
2. 通过 `<source>` 标签提供多种格式备选
3. 浏览器自动选择支持的格式播放
4. 提供原生的播放控制界面

### 支持的格式对比

| 类型 | 格式 | 浏览器支持 | 特点 |
| --- | --- | --- | --- |
| **音频** | MP3 | 所有现代浏览器 | 压缩率高，音质好 |
| | WAV | 所有现代浏览器 | 无损格式，文件大 |
| | OGG | Chrome、Firefox | 开源格式，质量好 |
| | AAC | Safari、Chrome | Apple 推荐格式 |
| **视频** | MP4 | 所有现代浏览器 | H.264 编码，兼容性最好 |
| | WebM | Chrome、Firefox | 开源格式，质量好 |
| | OGG | Chrome、Firefox | 开源格式，文件小 |

> **推荐策略**：MP4 + WebM 组合，覆盖所有主流浏览器。

---

## 10.3 基础用法

### 音频播放

```html
<!-- 最简单的音频播放器 -->
<!-- src：音频文件路径 -->
<!-- controls：显示播放控制按钮 -->
<audio src="music.mp3" controls>
  <!-- 浏览器不支持时显示的 fallback 内容 -->
  您的浏览器不支持音频播放。
</audio>
```

```html
<!-- 多格式备选，提高兼容性 -->
<audio controls>
  <!-- 浏览器按顺序尝试，选择第一个支持的格式 -->
  <source src="music.mp3" type="audio/mpeg">
  <source src="music.ogg" type="audio/ogg">
  <source src="music.wav" type="audio/wav">
  您的浏览器不支持音频播放。
</audio>
```

### 音频常用属性

```html
<audio
  src="music.mp3"
  controls    <!-- 显示播放控制 -->
  autoplay    <!-- 自动播放（注意：大部分浏览器禁止自动播放） -->
  loop        <!-- 循环播放 -->
  muted       <!-- 默认静音 -->
  preload="auto"  <!-- 预加载方式：auto=自动预加载，none=不预加载，metadata=只加载元数据 -->
>
</audio>
```

### 视频播放

```html
<!-- 最简单的视频播放器 -->
<video src="movie.mp4" controls>
  您的浏览器不支持视频播放。
</video>
```

```html
<!-- 带尺寸和多格式的视频播放器 -->
<video 
  controls
  width="640"   <!-- 宽度 -->
  height="360"  <!-- 高度 -->
  poster="cover.jpg"  <!-- 视频封面图 -->
>
  <source src="movie.mp4" type="video/mp4">
  <source src="movie.webm" type="video/webm">
  <source src="movie.ogg" type="video/ogg">
  您的浏览器不支持视频播放。
</video>
```

### 视频常用属性

```html
<video
  src="movie.mp4"
  controls          <!-- 显示播放控制 -->
  autoplay          <!-- 自动播放 -->
  loop              <!-- 循环播放 -->
  muted             <!-- 默认静音 -->
  playsinline       <!-- 在 iOS Safari 中内联播放（不自动全屏） -->
  width="640"       <!-- 宽度 -->
  height="360"      <!-- 高度 -->
  poster="cover.jpg" <!-- 封面图 -->
>
</video>
```

### 添加字幕

```html
<video controls>
  <source src="movie.mp4" type="video/mp4">
  <!-- 添加字幕文件 -->
  <!-- kind="subtitles"：字幕；kind="captions"：隐藏式字幕（包含音效描述） -->
  <!-- srclang：字幕语言 -->
  <!-- label：字幕标签，显示在播放器的语言选择菜单中 -->
  <!-- default：设置为默认字幕 -->
  <track 
    src="subtitles.vtt" 
    kind="subtitles" 
    srclang="zh" 
    label="中文"
    default
  >
  <track 
    src="subtitles-en.vtt" 
    kind="subtitles" 
    srclang="en" 
    label="English"
  >
</video>
```

**VTT 字幕文件格式**（subtitles.vtt）：

```vtt
WEBVTT

00:00:00.000 --> 00:00:05.000
欢迎观看这个视频！

00:00:05.000 --> 00:00:10.000
这是一段示例字幕。
```

---

## 10.4 响应式图片

### 为什么需要响应式图片？

在大屏幕上用大图，在小屏幕上用小图，既能保证清晰度，又能减少加载时间。

### picture 元素

```html
<picture>
  <!-- 媒体查询：屏幕宽度 >= 1200px 时使用大图 -->
  <source media="(min-width: 1200px)" srcset="large.jpg">
  <!-- 媒体查询：屏幕宽度 >= 768px 时使用中图 -->
  <source media="(min-width: 768px)" srcset="medium.jpg">
  <!-- 默认使用小图 -->
  <source srcset="small.jpg">
  <!-- 浏览器不支持 picture 时的 fallback -->
  <img src="fallback.jpg" alt="响应式图片">
</picture>
```

### srcset 属性

```html
<!-- 根据设备像素比选择图片 -->
<img 
  src="image.jpg" 
  srcset="image-1x.jpg 1x, image-2x.jpg 2x, image-3x.jpg 3x"
  alt="高清图片"
>
```

```html
<!-- 根据视口宽度选择图片 -->
<img 
  src="small.jpg"
  srcset="small.jpg 480w, medium.jpg 768w, large.jpg 1200w"
  sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
  alt="响应式图片"
>
```

> **原理**：`srcset` 提供多个图片版本，`sizes` 指定不同屏幕尺寸下图片占据的宽度，浏览器根据实际情况选择最合适的图片。

---

## 10.5 iframe 嵌入

### 嵌入 YouTube 视频

```html
<iframe 
  width="560" 
  height="315" 
  src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
  title="YouTube 视频"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
></iframe>
```

### 嵌入地图

```html
<iframe 
  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.219389819287!2d-73.98566488468315!3d40.74881707932804!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a70d3588cb%3A0xd134e199a405a163!2sStatue%20of%20Liberty%20National%20Monument!5e0!3m2!1sen!2sus!4v1609459584813!5m2!1sen!2sus" 
  width="600" 
  height="450" 
  style="border:0;"
  allowfullscreen
  loading="lazy"  <!-- 懒加载 -->
></iframe>
```

---

## 10.6 新手常见误区

### 误区 1："autoplay 属性一定能自动播放"

**错！** 大多数现代浏览器禁止自动播放音频和视频。

```html
<!-- ❌ 这样写通常不会自动播放 -->
<video src="movie.mp4" autoplay></video>

<!-- ✅ 配合 muted 使用，静音状态下可以自动播放 -->
<video src="movie.mp4" autoplay muted></video>
```

> **原理**：浏览器为了防止自动播放打扰用户，要求视频必须是静音状态才能自动播放。

### 误区 2："视频只需要 MP4 格式就够了"

**错！** 为了兼容所有浏览器，应该提供多种格式。

```html
<!-- ❌ 只提供 MP4，Firefox 某些版本可能无法播放 -->
<video src="movie.mp4" controls></video>

<!-- ✅ 提供 MP4 和 WebM，覆盖所有浏览器 -->
<video controls>
  <source src="movie.mp4" type="video/mp4">
  <source src="movie.webm" type="video/webm">
</video>
```

### 误区 3："设置了 width/height 就不会变形"

**错！** 如果只设置一个维度，视频会按比例缩放；如果两个都设置但比例不对，会变形。

```html
<!-- ❌ 宽高比不对，视频会变形 -->
<video src="movie.mp4" controls width="640" height="480"></video>

<!-- ✅ 保持正确的宽高比（16:9） -->
<video src="movie.mp4" controls width="640" height="360"></video>

<!-- ✅ 只设置一个维度，浏览器自动计算 -->
<video src="movie.mp4" controls width="100%"></video>
```

### 误区 4："不用添加 fallback 内容"

**错！** 虽然现代浏览器都支持，但应该为旧浏览器提供备选方案。

```html
<!-- ❌ 没有 fallback -->
<video src="movie.mp4" controls></video>

<!-- ✅ 有 fallback -->
<video src="movie.mp4" controls>
  您的浏览器不支持视频播放。
  <a href="movie.mp4">点击下载视频</a>
</video>
```

### 误区 5："poster 属性没用"

**错！** poster 可以让用户在点击播放前看到视频封面。

```html
<!-- ❌ 没有封面，显示黑屏或第一帧 -->
<video src="movie.mp4" controls></video>

<!-- ✅ 设置封面图，提升用户体验 -->
<video src="movie.mp4" controls poster="cover.jpg"></video>
```

---

## 10.7 动手练习

### 练习 1：基础练习

创建一个音频播放器，包含：多格式支持、播放控制、循环播放、默认静音。

<details>
<summary>点击查看答案</summary>

```html
<audio controls loop muted>
  <source src="music.mp3" type="audio/mpeg">
  <source src="music.ogg" type="audio/ogg">
  <source src="music.wav" type="audio/wav">
  您的浏览器不支持音频播放。
</audio>
```

</details>

### 练习 2：进阶练习

创建一个视频播放器，包含：多格式支持、播放控制、封面图、中文和英文双语字幕。

<details>
<summary>点击查看答案</summary>

```html
<video controls width="640" height="360" poster="video-cover.jpg">
  <source src="video.mp4" type="video/mp4">
  <source src="video.webm" type="video/webm">
  <track src="subtitles-zh.vtt" kind="subtitles" srclang="zh" label="中文" default>
  <track src="subtitles-en.vtt" kind="subtitles" srclang="en" label="English">
  您的浏览器不支持视频播放。
</video>
```

</details>

### 练习 3（挑战）：综合练习

创建一个响应式图片画廊页面，包含：
- 顶部标题和简介
- 响应式图片网格（使用 picture 元素）
- 底部音频播放器（背景音乐）
- 嵌入一个 YouTube 视频作为介绍

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>响应式画廊</title>
  <style>
    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    .gallery-item {
      width: 100%;
    }
  </style>
</head>
<body>
  <header>
    <h1>我的摄影画廊</h1>
    <p>展示世界各地的美丽风景</p>
  </header>

  <main>
    <section class="gallery">
      <div class="gallery-item">
        <picture>
          <source media="(min-width: 768px)" srcset="mountain-large.jpg">
          <source srcset="mountain-small.jpg">
          <img src="mountain-fallback.jpg" alt="山脉风景">
        </picture>
      </div>
      <div class="gallery-item">
        <picture>
          <source media="(min-width: 768px)" srcset="ocean-large.jpg">
          <source srcset="ocean-small.jpg">
          <img src="ocean-fallback.jpg" alt="海洋风景">
        </picture>
      </div>
      <div class="gallery-item">
        <picture>
          <source media="(min-width: 768px)" srcset="forest-large.jpg">
          <source srcset="forest-small.jpg">
          <img src="forest-fallback.jpg" alt="森林风景">
        </picture>
      </div>
    </section>

    <section class="video-intro">
      <h2>画廊介绍视频</h2>
      <iframe 
        width="100%" 
        max-width="560" 
        height="315" 
        src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
        title="画廊介绍"
        allowfullscreen
      ></iframe>
    </section>
  </main>

  <footer>
    <h3>背景音乐</h3>
    <audio controls loop>
      <source src="background.mp3" type="audio/mpeg">
      <source src="background.ogg" type="audio/ogg">
    </audio>
    <p>© 2024 我的摄影画廊</p>
  </footer>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **元数据与 SEO**——也就是如何让搜索引擎更好地理解你的网页。你会学到：

- `<meta>` 标签的各种用法
- 如何优化页面标题和描述
- Open Graph 和 Twitter Cards
- 结构化数据（Schema）的基础

准备好了吗？让我们继续探索！