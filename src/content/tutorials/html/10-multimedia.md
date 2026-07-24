---
title: "第十章：多媒体"
description: "audio、video、picture、source"
---

# 第十章：多媒体

## 音频

### 基本音频

```html
<audio src="music.mp3" controls></audio>
```

### 音频属性

```html
<audio controls autoplay loop muted>
  <source src="music.mp3" type="audio/mpeg">
  <source src="music.ogg" type="audio/ogg">
  您的浏览器不支持音频元素。
</audio>
```

## 视频

### 基本视频

```html
<video src="movie.mp4" controls width="640" height="360"></video>
```

### 视频属性

```html
<video controls autoplay loop muted poster="poster.jpg">
  <source src="movie.mp4" type="video/mp4">
  <source src="movie.webm" type="video/webm">
  您的浏览器不支持视频元素。
</video>
```

### 字幕

```html
<video controls>
  <source src="movie.mp4" type="video/mp4">
  <track src="subtitles.vtt" kind="subtitles" srclang="zh" label="中文">
</video>
```

## picture 元素

```html
<picture>
  <source media="(min-width: 1200px)" srcset="large.jpg">
  <source media="(min-width: 768px)" srcset="medium.jpg">
  <source srcset="small.jpg">
  <img src="fallback.jpg" alt="响应式图片">
</picture>
```

## 支持的格式

### 音频格式

| 格式 | 浏览器支持 |
| --- | --- |
| MP3 | 广泛支持 |
| WAV | 广泛支持 |
| OGG | Firefox、Chrome |
| AAC | Safari、Chrome |

### 视频格式

| 格式 | 浏览器支持 |
| --- | --- |
| MP4 | 广泛支持 |
| WebM | Firefox、Chrome |
| OGG | Firefox、Chrome |

## iframe 嵌入

```html
<!-- 嵌入 YouTube 视频 -->
<iframe 
  width="560" 
  height="315" 
  src="https://www.youtube.com/embed/VIDEO_ID" 
  frameborder="0" 
  allowfullscreen>
</iframe>

<!-- 嵌入地图 -->
<iframe 
  src="https://www.google.com/maps/embed?..." 
  width="600" 
  height="450" 
  style="border:0">
</iframe>
```

## 总结

HTML5 提供了原生的多媒体支持，无需插件即可播放音视频。
