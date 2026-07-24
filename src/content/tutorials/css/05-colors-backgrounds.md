---
title: "第五章：颜色与背景"
description: "颜色值、渐变、背景图片"
---

# 第五章：颜色与背景

## 本章导读

在学这一章之前，你可能会有这些疑问：

- CSS 里表示颜色的方式这么多，到底用哪种好？
- 为什么有的颜色有透明度，有的没有？
- 渐变的效果是怎么做出来的？
- 背景图片的的那些属性都是干嘛的？

这一章就是为了解答这些问题。我们会先搞清楚 **颜色和背景的核心概念**，再动手实践各种效果。

---

## 5.1 为什么需要颜色和背景？

### 痛点分析

想象一下，如果网页只有黑白两色的，会是什么样子？

- 就像看老电影一样，灰蒙蒙的，没有生气
- 重要信息和普通信息的区分不开，用户找不到重点
- 品牌没有辨识度，用户记不住你的网站
- 没有层次感，页面看起来 flat flat 的
- 想表达情绪（警告、成功、错误）的，没有颜色的辅助根本不行

打个比方：

> 颜色和背景就像是给网页穿衣服、化妆。合适的颜色搭配能让网页看起来专业、美观，就像一个人穿着得体、妆容精致，给人的第一印象就好。颜色的还是无声的语言——红色代表警告，绿色代表成功，蓝色代表信任，这些都是用户潜意识里就能理解的。

### 解决方案

CSS 提供了丰富的颜色和背景的属性的，让你可以：

- 使用多种颜色表示法的（关键字、HEX、RGB、HSL）
- 控制透明度，创建半透明效果
- 使用渐变的（线性、径向、锥形）
- 设置背景图片、控制重复、位置、大小
- 多重背景叠加，创建复杂视觉效果

> **一句话总结**：颜色和背景是网页的"化妆师"，负责营造视觉氛围、突出重点、传递情绪。

---

## 5.2 核心原理

### 颜色的本质

颜色的本质的是光的波长的，不同波长的光的进入眼睛的，我们就能看到不同的的颜色的。在计算机里的，颜色的通常用的**三原色模型**的来表示：

- **RGB 模型**：红（Red）、绿（Green）、蓝（Blue），三种光的的混合的的的
- 每种颜色的的的强度的的的的从的 0 到 255 的，共 256 级
- 三种颜色的的的混合的能产生的的的 1677 万种的颜色的

打个比方：

> 就像画画的调色盘，红、黄、蓝三种颜料的能调出的的的无数种颜色的。RGB 就是的光的的"调色盘的"，红、绿、蓝三种光的的混合的能调出的的所有的颜色的。

### 颜色表示法对比

| 表示法 | 格式示例 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- | --- |
| 颜色关键字 | `red`、`blue` | 好记、直观 | 颜色数量有限 | 快速原型、教学演示 |
| HEX | `#ff0000` | 常用、简洁 | 不够直观 | 设计稿还原、日常开发 |
| RGB/RGBA | `rgb(255,0,0)` | 直观、支持透明度 | 写法稍长 | 需要透明度的场景 |
| HSL/HSLA | `hsl(0,100%,50%)` | 最符合人类感知、便于调色 | 相对陌生 | 创建颜色主题、动态调色 |

---

## 5.3 颜色值的基础用法

### 1. 颜色关键字

使用预定义的颜色名称的，简单好记的。

```css
/* 设置文字颜色为红色 */
.red-text {
  color: red;
}

/* 设置背景色为蓝色 */
.blue-bg {
  background-color: blue;
}

/* 透明色 */
.transparent-box {
  background-color: transparent;
}
```

> ⚠️ **注意**：颜色关键字的数量有限（大约 140 多个），只能表示一些基础颜色的，复杂的颜色的还是的要用其他表示法的。

### 2. HEX（十六进制）

最常用的颜色表示法的，用的 `#` 加 6 位十六进制的数字的表示的。

```css
/* 6位完整格式：#RRGGBB */
/* 前两位红色，中间两位绿色，最后两位蓝色 */
.red {
  color: #ff0000;      /* 红色：红满，绿0，蓝0 */
}
.green {
  color: #00ff00;      /* 绿色：红0，绿满，蓝0 */
}
.blue {
  color: #0000ff;      /* 蓝色：红0，绿0，蓝满 */
}
.gray {
  color: #808080;      /* 灰色：三个通道一样就是灰色 */
}

/* 3位简写格式（两位相同的可以简写） */
/* #f00 等同于 #ff0000 */
.short-red {
  color: #f00;         /* ✅ 简写，等价于 #ff0000 */
}

/* 8位格式（最后两位表示透明度） */
/* #ff000080 表示红色，50%透明度 */
.half-red {
  color: #ff000080;    /* 红色，半透明 */
}
```

> 💡 **小技巧**：十六进制的 00 表示 0 的，ff 表示 255 的。数字的越大的的颜色的越亮的。

### 3. RGB / RGBA

用红、绿、蓝的的三个通道的的数值的的表示颜色的，最直观的的的的。

```css
/* RGB 格式：rgb(红, 绿, 蓝) */
/* 每个值的范围：0-255 */
.red {
  color: rgb(255, 0, 0);    /* 红色 */
}
.green {
  color: rgb(0, 255, 0);    /* 绿色 */
}
.white {
  color: rgb(255, 255, 255);/* 白色 */
}
.black {
  color: rgb(0, 0, 0);      /* 黑色 */
}

/* RGBA 格式：rgba(红, 绿, 蓝, 透明度) */
/* 透明度的范围：0（完全透明）到 1（完全不透明） */
.half-red {
  color: rgba(255, 0, 0, 0.5);  /* 红色，50%透明 */
}
.mostly-black {
  color: rgba(0, 0, 0, 0.8);    /* 黑色，80%不透明 */
}
.see-through {
  color: rgba(0, 0, 0, 0);      /* 完全透明，看不见 */
}
```

> ✅ **推荐场景**：需要透明度的时候的，用 RGBA 最方便的。

### 4. HSL / HSLA

用色相、饱和度、亮度的的三个维度的表示颜色的，最符合人类的感知的。

```css
/* HSL 格式：hsl(色相, 饱和度%, 亮度%) */
/* 色相：0-360度（色轮角度，0=红，120=绿，240=蓝） */
/* 饱和度：0%-100%（0%是灰色，100%是最鲜艳） */
/* 亮度：0%-100%（0%是黑，100%是白，50%是正常） */
.red {
  color: hsl(0, 100%, 50%);     /* 红色：色相0，满饱和，正常亮度 */
}
.green {
  color: hsl(120, 100%, 50%);   /* 绿色：色相120度 */
}
.blue {
  color: hsl(240, 100%, 50%);   /* 蓝色：色相240度 */
}
.light-red {
  color: hsl(0, 100%, 70%);     /* 浅红色：亮度调高 */
}
.dark-red {
  color: hsl(0, 100%, 30%);     /* 暗红色：亮度调低 */
}
.dull-red {
  color: hsl(0, 50%, 50%);      /* 灰红色：饱和度调低 */
}

/* HSLA：带透明度的HSL */
.half-red {
  color: hsla(0, 100%, 50%, 0.5);  /* 红色，50%透明 */
}
```

> 💡 **HSL 的优势**：想调亮/调暗的的的，直接的改 L 值的；想让颜色的更艳/更灰的的，改 S 值的；想换颜色的的的的，改 H 值的，特别方便的！

### 正确与错误写法对比

```css
/* ✅ 正确：各种颜色表示法都是合法的 */
.good {
  color: red;
  color: #ff0000;
  color: rgb(255, 0, 0);
  color: hsl(0, 100%, 50%);
}

/* ❌ 错误：这些写法都不对 */
.bad {
  color: #ff000;        /* ❌ HEX 必须是 3 位或 6 位（或带透明度的4位8位） */
  color: rgb(256, 0, 0); /* ❌ RGB 值不能超过 255 */
  color: rgb(100%, 0, 0);/* ❌ 要么全用数值，要么全用百分比，不能混 */
  color: hsl(361, 100%, 50%); /* ❌ 色相超过360了（虽然部分浏览器支持，但不规范） */
}
```

---

## 5.4 背景属性详解

### background-color（背景颜色）

设置元素的背景颜色的。

```css
/* 设置 div 的背景色为浅灰色 */
.box {
  background-color: #f5f5f5;  /* 浅灰色背景 */
}

/* 半透明白色背景，常用于毛玻璃效果 */
.glass-card {
  background-color: rgba(255, 255, 255, 0.9);  /* 白色，90%不透明 */
}
```

### background-image（背景图片）

给元素加背景图片的。

```css
/* 设置背景图片 */
.box {
  background-image: url('bg.jpg');  /* 引入一张图片作为背景 */
}

/* 多张背景图片（先写的在上面） */
.multi-bg {
  background-image: 
    url('top-layer.png'),    /* 第一层（最上面） */
    url('middle-layer.png'), /* 第二层 */
    url('bottom-layer.jpg'); /* 第三层（最下面） */
}
```

> 💡 **注意**：多重背景的的，先写的的在上面的的，后写的的在下面的，就像叠图层一样的。

### background-repeat（背景重复）

控制背景图片的的是否平铺的的。

```css
.no-repeat {
  background-repeat: no-repeat;  /* 不重复，只显示一次 */
}

.repeat-x {
  background-repeat: repeat-x;   /* 只在水平方向重复 */
}

.repeat-y {
  background-repeat: repeat-y;   /* 只在垂直方向重复 */
}

.repeat-all {
  background-repeat: repeat;     /* 默认：两个方向都重复（平铺） */
}
```

### background-position（背景位置）

控制背景图片的的位置的。

```css
/* 关键字定位 */
.top-left {
  background-position: top left;   /* 左上角 */
}
.center {
  background-position: center;     /* 居中（水平垂直都居中） */
}
.bottom-right {
  background-position: bottom right; /* 右下角 */
}

/* 百分比定位 */
.percent {
  background-position: 50% 50%;    /* 水平50%，垂直50%，也就是居中 */
}

/* 具体数值定位 */
.px-position {
  background-position: 20px 30px;  /* 距左边20px，距上边30px */
}
```

### background-size（背景大小）

控制背景图片的的大小的。

```css
/* cover：覆盖整个容器，图片可能被裁剪 */
.cover {
  background-size: cover;  /* 等比缩放，填满容器，可能裁掉一部分 */
}

/* contain：完整显示图片，可能留白 */
.contain {
  background-size: contain; /* 等比缩放，完整显示，可能有空隙 */
}

/* 具体数值 */
.fixed-size {
  background-size: 100px 200px;  /* 宽100px，高200px */
}

/* 百分比 */
.percent-size {
  background-size: 50% auto;      /* 宽度50%，高度自动（保持比例） */
}
```

> 🤔 **cover 和 contain 的区别？**
> 
> 打个比方：你有一个相框，还有一张照片。
> - `cover`：把照片放大到把相框完全遮住，多余的部分剪掉——保证相框满满的，但照片可能不完整
> - `contain`：把照片缩小到能完整放进相框里——保证照片完整，但相框可能有空白

### background（简写属性）

把多个背景属性的写在一起的，更简洁的。

```css
/* 完整写法 */
.box {
  background: #f5f5f5 url('bg.jpg') no-repeat center center / cover;
  /*          颜色        图片         重复     位置      /  大小 */
}

/* 等同于分开写： */
.box-equivalent {
  background-color: #f5f5f5;
  background-image: url('bg.jpg');
  background-repeat: no-repeat;
  background-position: center center;
  background-size: cover;
}
```

> 💡 **简写顺序**：`颜色 图片 重复 位置 / 大小`
> 注意：位置和大小的之间的要用的 `/` 隔开的，不然浏览器会分不清的！

---

## 5.5 渐变效果

渐变的是一种的特殊的背景图片的的，不需要的用的图片的的，用 CSS 的就能做出的的颜色过渡的效果的。

### 线性渐变（linear-gradient）

沿着一条直线的的渐变的。

```css
/* 基本语法：linear-gradient(方向, 颜色1, 颜色2, ...) */

/* 从左到右，红变蓝 */
.left-to-right {
  background: linear-gradient(to right, red, blue);
}

/* 从上到下（默认方向），红变蓝 */
.top-to-bottom {
  background: linear-gradient(to bottom, red, blue);
}

/* 45度角渐变 */
.angle-gradient {
  background: linear-gradient(45deg, red, blue);
}

/* 多个颜色的渐变 */
.rainbow {
  background: linear-gradient(to right, red, orange, yellow, green, blue, purple);
}

/* 指定颜色的位置的 */
.positioned {
  background: linear-gradient(to right, red 0%, yellow 30%, green 100%);
  /* 红色从0%开始，到30%的位置的变成黄色的，到100%变成绿色的 */
}

/* 硬边效果（两个颜色各占一半，没有过渡） */
.hard-edge {
  background: linear-gradient(to right, red 50%, blue 50%);
  /* 红色占50%，蓝色从50%开始，中间没有过渡 */
}
```

### 径向渐变（radial-gradient）

从中心点向外辐射的渐变的。

```css
/* 基本语法：radial-gradient(形状 大小 at 位置, 颜色1, 颜色2, ...) */

/* 默认：椭圆形，从中心向外 */
.basic {
  background: radial-gradient(red, blue);
}

/* 圆形渐变 */
.circle {
  background: radial-gradient(circle, red, blue);
}

/* 指定位置 */
.positioned {
  background: radial-gradient(circle at top left, red, blue);
  /* 圆形渐变，圆心在左上角 */
}

/* 指定大小 */
.size {
  background: radial-gradient(circle 100px at center, red, blue);
  /* 圆的半径100px */
}
```

### 重复渐变

用 `repeating-` 前缀的，可以创建重复的渐变的条纹的。

```css
/* 重复线性渐变：斜条纹 */
.stripes {
  background: repeating-linear-gradient(
    45deg,           /* 45度角 */
    red,             /* 红色开始 */
    red 10px,        /* 到10px还是红色 */
    white 10px,      /* 10px处变成白色 */
    white 20px       /* 到20px还是白色，然后循环 */
  );
}
```

---

## 5.6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 颜色关键字 | `red`、`blue` 等，好记但选择少 |
| HEX | `#ff0000`，最常用的表示法 |
| RGB/RGBA | `rgb(255,0,0)`，直观，支持透明度 |
| HSL/HSLA | `hsl(0,100%,50%)`，最符合人类感知，便于调色 |
| background-color | 背景颜色 |
| background-image | 背景图片，支持多重背景 |
| background-repeat | 背景重复方式 |
| background-position | 背景位置 |
| background-size | 背景大小（cover/contain） |
| linear-gradient | 线性渐变 |
| radial-gradient | 径向渐变 |
| background 简写 | 简写属性，更简洁 |

---

## 5.7 新手常见误区

### 误区 1："颜色的写的的的的的 #RGB 的就的够了的，不用学其他的"

**错！** 不同的颜色表示法的有不同的适用场景的：

- 需要透明度的的，用 RGBA 或 HSLA
- 需要动态调整颜色的的，用 HSL 最方便
- 设计稿给的 HEX 值的，就用 HEX

正确做法：根据场景选择合适的颜色表示法，不要只会一种。

### 误区 2："background-size: cover 和 contain 差不多"

**不一样！** 这俩的区别的大了去了：

- `cover`：保证容器被填满的，图片的可能的被裁剪
- `contain`：保证图片完整的的，容器的可能的留白

打个比方：你有一张壁纸，要贴在墙上
- `cover`：把壁纸拉大到把墙完全盖住，多出的部分裁掉——墙是满的，但壁纸不完整
- `contain`：把壁纸缩小到整张都能贴在墙上——壁纸完整，但墙可能有空的地方

正确做法：根据需求选择，想填满容器用 cover，想完整显示图片用 contain。

### 误区 3："背景图片的会把背景颜色盖住的的，写了背景图片的就不用写背景颜色的了"

**不对！** 背景图片加载失败的时候的，背景颜色的就能派上用场了的。而且如果的背景图片的的是透明的的 PNG 的，背景颜色的会透出来的。

正确做法：设置背景图片的的，最好的同时的设置一个的相近的背景颜色的的作为兜底的。

### 误区 4："渐变的的的是图片吗？为什么要写在 background 上的？"

是的，渐变的的是一种的特殊的背景图片的的（CSS 生成的的，不用加载的）。所以它的要用的 `background-image` 或者 `background` 简写的来设置的。

### 误区 5："所有颜色的的用 HEX 的就的好了的，HSL 什么的没用"

**错！** HSL 在创建颜色主题的时候的的超级方便的的。比如你想做一个按钮的 hover 效果的——颜色变浅一点的，用 HSL 直接把 L 值调大就行的，用 HEX 的你得自己算半天的。

正确做法：掌握多种颜色表示法，按需使用。

---

## 5.8 动手练习

### 练习 1：基础练习

创建一个 HTML 页面，实现以下效果：

- 页面背景色的的的的浅蓝的（`lightblue` 或 `#add8e6`）
- 有一个的 300px × 200px 的的盒子的
- 盒子背景色为半透明白色（`rgba(255,255,255,0.8)`）
- 盒子有 8px 圆角
- 盒子水平居中

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习1：颜色与背景基础</title>
  <style>
    /* 页面整体样式 */
    body {
      background-color: lightblue;  /* 浅蓝色背景 */
      margin: 0;
      padding: 40px;
      font-family: Arial, sans-serif;
    }

    /* 盒子样式 */
    .box {
      width: 300px;                          /* 宽度300px */
      height: 200px;                         /* 高度200px */
      background-color: rgba(255, 255, 255, 0.8);  /* 半透明白色背景 */
      border-radius: 8px;                    /* 圆角8px */
      margin: 0 auto;                        /* 水平居中 */
      padding: 20px;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div class="box">
    <h3>你好，世界！</h3>
    <p>这是一个半透明的盒子。</p>
  </div>
</body>
</html>
```

</details>

### 练习 2：进阶练习

创建一个渐变色的按钮卡片页面，实现：

- 一个渐变背景的卡片的（紫色到蓝色的的 135 度渐变的）
- 卡片内有标题和描述文字
- 一个渐变按钮的（左到右的渐变），鼠标悬停时的稍微上移的
- 整体美观，有层次感

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习2：渐变卡片</title>
  <style>
    /* 页面基础样式 */
    body {
      margin: 0;
      padding: 40px;
      background-color: #f0f0f0;
      font-family: Arial, sans-serif;
    }

    /* 渐变卡片 */
    .gradient-card {
      max-width: 400px;
      margin: 0 auto;
      padding: 40px;
      border-radius: 16px;
      /* 135度角，从紫色到蓝色的渐变 */
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }

    /* 卡片标题 */
    .gradient-card h2 {
      margin: 0 0 16px 0;
      font-size: 28px;
    }

    /* 卡片描述 */
    .gradient-card p {
      margin: 0 0 24px 0;
      opacity: 0.9;
      line-height: 1.6;
    }

    /* 渐变按钮 */
    .btn-gradient {
      display: inline-block;
      padding: 12px 32px;
      /* 从左到右的渐变 */
      background: linear-gradient(to right, #ff6b6b, #ffa502);
      color: white;
      text-decoration: none;
      border-radius: 30px;
      font-weight: bold;
      /* 过渡动画：鼠标移上去更自然 */
      transition: transform 0.3s, box-shadow 0.3s;
    }

    /* 鼠标悬停效果 */
    .btn-gradient:hover {
      transform: translateY(-3px);       /* 向上移动3px */
      box-shadow: 0 5px 20px rgba(255, 107, 107, 0.5);  /* 阴影变大 */
    }
  </style>
</head>
<body>
  <div class="gradient-card">
    <h2>欢迎学习 CSS</h2>
    <p>颜色和背景的是 CSS 的的基础技能的的，掌握了它们的，你就能做出各种漂亮的的效果了！</p>
    <a href="#" class="btn-gradient">开始学习</a>
  </div>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习

创建一个个人资料页面，包含以下元素：

- 顶部有一个的封面的区域的的（用渐变背景的）
- 头像的的的圆形的的，叠在封面底部的的的
- 个人信息区（姓名、简介）
- 三个数据统计的的的卡片的（粉丝、关注、获赞的）的并排的
- 使用背景、渐变、圆角、阴影等技巧
- 整体美观协调

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习3：个人资料页面</title>
  <style>
    /* 全局重置 */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f5f5f5;
      color: #333;
    }

    /* 页面容器 */
    .profile-page {
      max-width: 600px;
      margin: 0 auto;
      padding-bottom: 40px;
    }

    /* 封面区域 */
    .cover {
      height: 200px;
      /* 漂亮的渐变背景 */
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
    }

    /* 头像 */
    .avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;              /* 圆形 */
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      border: 4px solid white;         /* 白色边框 */
      position: absolute;
      bottom: -60px;                   /* 向上偏移，叠在封面底部 */
      left: 50%;
      transform: translateX(-50%);     /* 水平居中 */
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 48px;
      font-weight: bold;
    }

    /* 个人信息区 */
    .profile-info {
      text-align: center;
      padding: 80px 20px 30px;
      background: white;
    }

    .profile-info h1 {
      font-size: 28px;
      margin-bottom: 8px;
    }

    .profile-info .bio {
      color: #666;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    /* 数据统计区 */
    .stats {
      display: flex;
      justify-content: space-around;
      background: white;
      padding: 20px;
      border-top: 1px solid #eee;
    }

    .stat-item {
      text-align: center;
    }

    .stat-item .number {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
    }

    .stat-item .label {
      font-size: 14px;
      color: #999;
      margin-top: 4px;
    }

    /* 个人简介卡片 */
    .about-card {
      margin: 20px;
      padding: 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .about-card h3 {
      margin-bottom: 12px;
      color: #333;
    }

    .about-card p {
      color: #666;
      line-height: 1.8;
    }

    /* 按钮组 */
    .btn-group {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 24px;
    }

    .btn-follow {
      padding: 12px 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 30px;
      font-size: 16px;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .btn-follow:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-message {
      padding: 12px 40px;
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
      border-radius: 30px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-message:hover {
      background-color: #f0f3ff;
    }
  </style>
</head>
<body>
  <div class="profile-page">
    <!-- 封面区域 -->
    <div class="cover">
      <!-- 头像 -->
      <div class="avatar">D</div>
    </div>

    <!-- 个人信息 -->
    <div class="profile-info">
      <h1>David Zhang</h1>
      <p class="bio">前端工程师 | 技术博主 | 开源爱好者<br>分享前端技术，记录成长之路</p>
      
      <div class="btn-group">
        <button class="btn-follow">+ 关注</button>
        <button class="btn-message">私信</button>
      </div>
    </div>

    <!-- 数据统计 -->
    <div class="stats">
      <div class="stat-item">
        <div class="number">128</div>
        <div class="label">文章</div>
      </div>
      <div class="stat-item">
        <div class="number">2.5k</div>
        <div class="label">粉丝</div>
      </div>
      <div class="stat-item">
        <div class="number">5.6k</div>
        <div class="label">获赞</div>
      </div>
    </div>

    <!-- 个人简介 -->
    <div class="about-card">
      <h3>关于我</h3>
      <p>一名热爱编程的前端工程师，专注于 Vue、React 等前端框架。喜欢分享技术，相信持续学习的力量。业余时间喜欢摄影、旅行和阅读。</p>
    </div>
  </div>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **Flexbox 布局**——也就是 CSS 的弹性盒子布局。你会学到如何用 Flexbox 轻松实现水平居中、垂直居中、两端对齐等各种布局效果，从此告别布局的烦恼。
