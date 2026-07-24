---
title: 颜色与背景
description: 颜色值、渐变、背景图片
---

# 颜色与背景

颜色和背景是 CSS 中最视觉化的部分。通过合理运用颜色和背景，可以创建美观且富有层次感的网页设计。

## 颜色值

CSS 支持多种颜色值格式，每种都有其特定的使用场景。

### 1. 颜色关键字

使用预定义的颜色名称。

```css
.red {
  color: red;
}
.blue {
  color: blue;
}
.transparent {
  color: transparent;
}
```

**常用颜色关键字**：

- `black`, `white`, `red`, `green`, `blue`
- `yellow`, `cyan`, `magenta`, `gray`, `orange`
- `transparent`（透明）, `currentColor`（继承当前文本颜色）

### 2. HEX（十六进制）

使用 `#` 加十六进制数值表示。

```css
/* 6位格式 */
.color1 {
  color: #ff0000;
} /* 红色 */
.color2 {
  color: #00ff00;
} /* 绿色 */
.color3 {
  color: #0000ff;
} /* 蓝色 */

/* 3位简写（等同于6位） */
.color4 {
  color: #f00;
} /* 等同于 #ff0000 */
.color5 {
  color: #0f0;
} /* 等同于 #00ff00 */

/* 8位格式（带透明度） */
.color6 {
  color: #ff000080;
} /* 红色，50% 透明度 */
```

### 3. RGB / RGBA

使用红、绿、蓝三原色值。

```css
/* RGB */
.color1 {
  color: rgb(255, 0, 0);
} /* 红色 */
.color2 {
  color: rgb(0, 255, 0);
} /* 绿色 */

/* RGBA（带透明度） */
.color3 {
  color: rgba(255, 0, 0, 0.5);
} /* 红色，50% 透明度 */
.color4 {
  color: rgba(0, 0, 0, 0.8);
} /* 黑色，80% 透明度 */
```

**取值范围**：

- R、G、B：0-255
- A（Alpha）：0-1（0 完全透明，1 完全不透明）

### 4. HSL / HSLA

使用色相、饱和度、亮度表示。

```css
/* HSL */
.color1 {
  color: hsl(0, 100%, 50%);
} /* 红色 */
.color2 {
  color: hsl(120, 100%, 50%);
} /* 绿色 */
.color3 {
  color: hsl(240, 100%, 50%);
} /* 蓝色 */

/* HSLA（带透明度） */
.color4 {
  color: hsla(0, 100%, 50%, 0.5);
} /* 红色，50% 透明度 */
```

**取值范围**：

- H（Hue，色相）：0-360（色轮角度）
- S（Saturation，饱和度）：0%-100%
- L（Lightness，亮度）：0%-100%
- A（Alpha）：0-1

**HSL 优势**：

- 更直观，符合人类对颜色的感知
- 便于创建颜色主题（调整色相即可）
- 便于生成颜色变体（调整饱和度和亮度）

### 5. 现代颜色函数

#### `rgb()` 新语法

```css
/* 空格分隔，更简洁 */
.color {
  color: rgb(255 0 0 / 50%);
}
```

#### `hsl()` 新语法

```css
.color {
  color: hsl(0 100% 50% / 50%);
}
```

#### `color()` 函数

```css
/* Display P3 色域 */
.color {
  color: color(display-p3 1 0 0);
}
```

## 背景属性

### 1. background-color（背景颜色）

设置元素的背景颜色。

```css
.box {
  background-color: #f5f5f5;
}

.card {
  background-color: rgba(255, 255, 255, 0.9);
}
```

### 2. background-image（背景图片）

设置元素的背景图片。

```css
.box {
  background-image: url('image.jpg');
}

/* 多个背景图片 */
.box {
  background-image: url('overlay.png'), url('pattern.png'), url('background.jpg');
}
```

### 3. background-repeat（背景重复）

控制背景图片的重复方式。

```css
.no-repeat {
  background-repeat: no-repeat;
}

.repeat-x {
  background-repeat: repeat-x; /* 水平重复 */
}

.repeat-y {
  background-repeat: repeat-y; /* 垂直重复 */
}

.round {
  background-repeat: round; /* 自动缩放以完整显示 */
}

.space {
  background-repeat: space; /* 自动调整间距 */
}
```

### 4. background-position（背景位置）

设置背景图片的位置。

```css
/* 关键字 */
.top-left {
  background-position: top left;
}
.center {
  background-position: center;
}
.bottom-right {
  background-position: bottom right;
}

/* 百分比 */
.percent {
  background-position: 50% 50%;
}

/* 具体数值 */
.px {
  background-position: 20px 30px;
}

/* 混合使用 */
.mixed {
  background-position: center top;
}
```

### 5. background-size（背景大小）

设置背景图片的大小。

```css
/* 关键字 */
.cover {
  background-size: cover;
} /* 覆盖整个容器，可能裁剪 */
.contain {
  background-size: contain;
} /* 完整显示，可能留白 */

/* 具体数值 */
.px {
  background-size: 100px 200px;
} /* 宽度 100px，高度 200px */
.percent {
  background-size: 50% auto;
} /* 宽度 50%，高度自动 */
```

### 6. background-attachment（背景附着）

控制背景图片是否随页面滚动。

```css
.scroll {
  background-attachment: scroll; /* 随页面滚动（默认） */
}

.fixed {
  background-attachment: fixed; /* 固定在视口 */
}

.local {
  background-attachment: local; /* 随元素内容滚动 */
}
```

### 7. background（背景简写）

使用简写属性一次性设置多个背景属性。

```css
.box {
  background: #f5f5f5 url('image.jpg') no-repeat center center / cover;
}
```

语法顺序：`background-color background-image background-repeat background-position / background-size background-attachment`

## 渐变

渐变是一种特殊的背景图片，可以创建平滑的颜色过渡效果。

### 1. 线性渐变（linear-gradient）

沿直线方向的颜色过渡。

```css
/* 基本语法 */
.linear {
  background: linear-gradient(to right, red, blue);
}

/* 指定角度 */
.angle {
  background: linear-gradient(45deg, red, blue);
}

/* 多个颜色停止点 */
.multi {
  background: linear-gradient(to right, red, yellow, green);
}

/* 指定颜色停止点位置 */
.position {
  background: linear-gradient(to right, red 0%, yellow 50%, green 100%);
}

/* 硬边效果 */
.hard {
  background: linear-gradient(to right, red 50%, blue 50%);
}
```

#### 方向关键字

| 值               | 描述             |
| ---------------- | ---------------- |
| `to top`         | 从下到上         |
| `to bottom`      | 从上到下（默认） |
| `to left`        | 从右到左         |
| `to right`       | 从左到右         |
| `to top right`   | 从左下到右上     |
| `to bottom left` | 从右上到左下     |

### 2. 径向渐变（radial-gradient）

从中心点向外辐射的颜色过渡。

```css
/* 基本语法 */
.radial {
  background: radial-gradient(red, blue);
}

/* 指定形状 */
.circle {
  background: radial-gradient(circle, red, blue);
}

.ellipse {
  background: radial-gradient(ellipse, red, blue);
}

/* 指定大小 */
.size {
  background: radial-gradient(circle 100px at center, red, blue);
}

/* 指定位置 */
.position {
  background: radial-gradient(circle at top left, red, blue);
}

/* 多个颜色停止点 */
.multi {
  background: radial-gradient(red, yellow, green, blue);
}
```

#### 形状关键字

| 值        | 描述           |
| --------- | -------------- |
| `circle`  | 圆形           |
| `ellipse` | 椭圆形（默认） |

#### 大小关键字

| 值                | 描述                   |
| ----------------- | ---------------------- |
| `closest-side`    | 到最近边的距离         |
| `closest-corner`  | 到最近角的距离         |
| `farthest-side`   | 到最远边的距离         |
| `farthest-corner` | 到最远角的距离（默认） |

### 3. 锥形渐变（conic-gradient）

围绕中心点旋转的颜色过渡。

```css
/* 基本语法 */
.conic {
  background: conic-gradient(red, blue);
}

/* 指定起始角度 */
.angle {
  background: conic-gradient(from 45deg, red, blue);
}

/* 指定位置 */
.position {
  background: conic-gradient(at top left, red, blue);
}

/* 饼图效果 */
.pie {
  background: conic-gradient(
    red 0deg 90deg,
    yellow 90deg 180deg,
    green 180deg 270deg,
    blue 270deg 360deg
  );
}
```

### 4. 重复渐变

使用 `repeating-` 前缀创建重复的渐变效果。

```css
/* 重复线性渐变 */
.stripes {
  background: repeating-linear-gradient(45deg, red, red 10px, white 10px, white 20px);
}

/* 重复径向渐变 */
.rings {
  background: repeating-radial-gradient(circle, red, red 10px, white 10px, white 20px);
}
```

## 背景高级技巧

### 1. 多重背景

一个元素可以使用多个背景图片。

```css
.box {
  background:
    url('overlay.png') center center / cover no-repeat,
    url('pattern.png') left top / auto repeat,
    linear-gradient(to bottom, rgba(0, 0, 0, 0.3), transparent);
}
```

**注意**：先声明的背景在上层，后声明的在下层。

### 2. 背景裁剪

使用 `background-clip` 控制背景的显示区域。

```css
.border-box {
  background-clip: border-box; /* 默认，延伸到边框外 */
}

.padding-box {
  background-clip: padding-box; /* 裁剪到内边距区域 */
}

.content-box {
  background-clip: content-box; /* 裁剪到内容区域 */
}

.text {
  background-clip: text; /* 裁剪到文本区域 */
  -webkit-background-clip: text;
  color: transparent;
  background-image: linear-gradient(to right, red, blue);
}
```

### 3. 背景原点

使用 `background-origin` 控制背景图片的定位原点。

```css
.padding-box {
  background-origin: padding-box; /* 默认，从内边距区域开始 */
}

.border-box {
  background-origin: border-box; /* 从边框区域开始 */
}

.content-box {
  background-origin: content-box; /* 从内容区域开始 */
}
```

## 实际示例

### 渐变按钮

```html
<style>
  .btn-gradient {
    display: inline-block;
    padding: 12px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
  }

  .btn-gradient:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
</style>

<button class="btn-gradient">渐变按钮</button>
```

### 卡片背景

```html
<style>
  .card {
    background:
      linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 74, 158, 0.1)), url('pattern.png');
    background-size: cover;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
</style>

<div class="card">
  <h3>卡片标题</h3>
  <p>卡片内容</p>
</div>
```

### 条纹背景

```html
<style>
  .stripes {
    background: repeating-linear-gradient(45deg, #f5f5f5, #f5f5f5 10px, #fff 10px, #fff 20px);
    padding: 20px;
  }
</style>

<div class="stripes">条纹背景内容</div>
```

### 文字渐变

```html
<style>
  .gradient-text {
    font-size: 48px;
    font-weight: bold;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
</style>

<h1 class="gradient-text">渐变文字</h1>
```

## 最佳实践

1. **使用 HSL 颜色**：更直观，便于创建颜色主题
2. **合理使用透明度**：使用 `rgba` 或 `hsla` 创建半透明效果
3. **渐变要克制**：避免使用过于复杂的渐变
4. **注意性能**：多重背景会影响性能
5. **使用 CSS 变量**：便于全局管理颜色
6. **考虑可访问性**：确保文本与背景有足够的对比度

## 小结

- CSS 支持多种颜色格式：HEX、RGB、HSL 等
- 背景属性包括颜色、图片、重复、位置、大小等
- 渐变包括线性渐变、径向渐变、锥形渐变
- 使用 `background` 简写属性提高代码效率
- 多重背景可以创建复杂的视觉效果
- 使用 `background-clip: text` 创建渐变文字

下一章我们将学习 Flexbox 布局，这是现代 CSS 布局的核心技术。
