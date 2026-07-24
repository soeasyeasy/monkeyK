---
title: 文本与字体
description: font-family、text-align、line-height
---

# 文本与字体

文本样式是 CSS 中最常用的功能之一。通过合理设置字体、颜色、对齐方式等，可以提升网页的可读性和美观度。

## 字体属性

### 1. font-family（字体族）

指定文本使用的字体。

```css
body {
  font-family: Arial, sans-serif;
}

h1 {
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
}
```

#### 字体族类型

| 类型         | 描述       | 示例                     |
| ------------ | ---------- | ------------------------ |
| `serif`      | 衬线字体   | Times New Roman, Georgia |
| `sans-serif` | 无衬线字体 | Arial, Helvetica         |
| `monospace`  | 等宽字体   | Courier New, Consolas    |
| `cursive`    | 手写字体   | Comic Sans MS            |
| `fantasy`    | 装饰字体   | Papyrus                  |

#### 字体回退机制

浏览器会按顺序尝试使用字体，如果第一个字体不可用，则使用下一个。

```css
body {
  font-family: 'Helvetica Neue', Helvetica, Arial, 'Microsoft YaHei', sans-serif;
}
```

**建议**：

- 始终提供回退字体
- 最后一个使用通用字体族（如 `sans-serif`）
- 中文字体名称建议同时使用中英文

### 2. font-size（字体大小）

设置文本大小。

```css
h1 {
  font-size: 32px;
}

p {
  font-size: 16px;
}
```

#### 单位类型

| 单位  | 描述                 | 示例     |
| ----- | -------------------- | -------- |
| `px`  | 像素（绝对单位）     | `16px`   |
| `em`  | 相对于父元素字体大小 | `1.5em`  |
| `rem` | 相对于根元素字体大小 | `1.5rem` |
| `%`   | 相对于父元素字体大小 | `100%`   |
| `vw`  | 视口宽度的百分比     | `5vw`    |
| `vh`  | 视口高度的百分比     | `5vh`    |

```css
html {
  font-size: 16px; /* 根元素字体大小 */
}

.parent {
  font-size: 20px;
}

.child-em {
  font-size: 1.5em; /* 30px (20px * 1.5) */
}

.child-rem {
  font-size: 1.5rem; /* 24px (16px * 1.5) */
}
```

**建议**：

- 正文使用 `px` 或 `rem`
- 避免在嵌套元素中使用 `em`，会导致字体大小层层放大

### 3. font-weight（字体粗细）

设置文本粗细程度。

```css
.normal {
  font-weight: normal; /* 等同于 400 */
}

.bold {
  font-weight: bold; /* 等同于 700 */
}

.light {
  font-weight: 300;
}

.heavy {
  font-weight: 900;
}
```

#### 数值范围

| 值    | 描述                      |
| ----- | ------------------------- |
| `100` | Thin                      |
| `200` | Extra Light               |
| `300` | Light                     |
| `400` | Normal（等同于 `normal`） |
| `500` | Medium                    |
| `600` | Semi Bold                 |
| `700` | Bold（等同于 `bold`）     |
| `800` | Extra Bold                |
| `900` | Black                     |

**注意**：并非所有字体都支持所有粗细值，取决于字体文件。

### 4. font-style（字体样式）

设置文本是否为斜体。

```css
.normal {
  font-style: normal;
}

.italic {
  font-style: italic;
}

.oblique {
  font-style: oblique;
}
```

### 5. font（字体简写）

使用简写属性一次性设置多个字体属性。

```css
p {
  font:
    italic bold 16px/1.5 Arial,
    sans-serif;
}
```

语法顺序：`font-style font-weight font-size/line-height font-family`

**注意**：`font-size` 和 `font-family` 是必需的，其他属性可选。

## 文本属性

### 1. color（文本颜色）

设置文本颜色。

```css
h1 {
  color: #333;
}

p {
  color: rgb(100, 100, 100);
}

a {
  color: rgba(0, 123, 255, 0.8);
}
```

#### 颜色值格式

| 格式   | 描述                       | 示例                         |
| ------ | -------------------------- | ---------------------------- |
| 颜色名 | 预定义颜色                 | `red`, `blue`, `transparent` |
| HEX    | 十六进制                   | `#333`, `#007bff`            |
| RGB    | 红绿蓝                     | `rgb(255, 0, 0)`             |
| RGBA   | 红绿蓝 + 透明度            | `rgba(255, 0, 0, 0.5)`       |
| HSL    | 色相、饱和度、亮度         | `hsl(0, 100%, 50%)`          |
| HSLA   | 色相、饱和度、亮度、透明度 | `hsla(0, 100%, 50%, 0.5)`    |

### 2. text-align（文本对齐）

设置文本水平对齐方式。

```css
.left {
  text-align: left; /* 左对齐（默认） */
}

.center {
  text-align: center; /* 居中 */
}

.right {
  text-align: right; /* 右对齐 */
}

.justify {
  text-align: justify; /* 两端对齐 */
}
```

### 3. line-height（行高）

设置行与行之间的距离。

```css
p {
  line-height: 1.5; /* 无单位，推荐使用 */
}

h1 {
  line-height: 40px; /* 固定值 */
}
```

#### 行高类型

| 类型     | 描述                   | 示例          |
| -------- | ---------------------- | ------------- |
| 无单位   | 相对于字体大小的倍数   | `1.5`（推荐） |
| 数值     | 固定像素值             | `24px`        |
| 百分比   | 相对于字体大小的百分比 | `150%`        |
| `normal` | 浏览器默认值（约 1.2） | `normal`      |

**建议**：正文使用 `1.5` 到 `1.8` 的行高，提升可读性。

### 4. letter-spacing（字间距）

设置字符之间的间距。

```css
h1 {
  letter-spacing: 2px;
}

.spaced {
  letter-spacing: 0.1em;
}
```

### 5. word-spacing（词间距）

设置单词之间的间距（对中文无效）。

```css
p {
  word-spacing: 5px;
}
```

### 6. text-decoration（文本装饰）

设置文本的装饰线。

```css
.none {
  text-decoration: none; /* 无装饰 */
}

.underline {
  text-decoration: underline; /* 下划线 */
}

.overline {
  text-decoration: overline; /* 上划线 */
}

.line-through {
  text-decoration: line-through; /* 删除线 */
}

/* 组合使用 */
.custom {
  text-decoration: underline wavy red;
}
```

常用于移除链接的下划线：

```css
a {
  text-decoration: none;
}
```

### 7. text-transform（文本转换）

转换文本大小写。

```css
.uppercase {
  text-transform: uppercase; /* 全部大写 */
}

.lowercase {
  text-transform: lowercase; /* 全部小写 */
}

.capitalize {
  text-transform: capitalize; /* 首字母大写 */
}
```

### 8. text-indent（文本缩进）

设置文本首行缩进。

```css
p {
  text-indent: 2em; /* 缩进两个字符 */
}
```

### 9. white-space（空白处理）

控制元素内空白的处理方式。

```css
.nowrap {
  white-space: nowrap; /* 不换行 */
}

.pre {
  white-space: pre; /* 保留所有空白，类似 <pre> */
}

.pre-wrap {
  white-space: pre-wrap; /* 保留空白，允许换行 */
}

.pre-line {
  white-space: pre-line; /* 合并空白，保留换行 */
}
```

### 10. word-break（单词换行）

控制单词内的换行行为。

```css
.break-all {
  word-break: break-all; /* 允许在任意字符间换行 */
}

.keep-all {
  word-break: keep-all; /* 不在单词内换行 */
}
```

### 11. overflow-wrap（溢出换行）

控制长单词或 URL 的换行。

```css
.wrap {
  overflow-wrap: break-word; /* 在长单词内换行 */
}
```

## 文本阴影

使用 `text-shadow` 为文本添加阴影效果。

```css
h1 {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}
```

语法：`text-shadow: offset-x offset-y blur-radius color;`

```css
/* 多个阴影 */
.text {
  text-shadow:
    1px 1px 2px black,
    0 0 10px blue,
    0 0 20px white;
}
```

## 实际示例

### 文章排版

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>文本样式示例</title>
    <style>
      body {
        font-family:
          -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 16px;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 40px 20px;
      }

      h1 {
        font-size: 36px;
        font-weight: 700;
        color: #1a1a1a;
        margin-bottom: 24px;
        letter-spacing: -0.5px;
      }

      h2 {
        font-size: 24px;
        font-weight: 600;
        color: #333;
        margin-top: 32px;
        margin-bottom: 16px;
      }

      p {
        margin-bottom: 16px;
        color: #555;
      }

      .lead {
        font-size: 18px;
        color: #666;
        line-height: 1.7;
      }

      .highlight {
        background-color: #fff3cd;
        padding: 2px 6px;
        border-radius: 3px;
      }

      .quote {
        font-style: italic;
        color: #666;
        border-left: 4px solid #007bff;
        padding-left: 16px;
        margin: 24px 0;
      }

      a {
        color: #007bff;
        text-decoration: none;
        transition: color 0.2s;
      }

      a:hover {
        color: #0056b3;
        text-decoration: underline;
      }

      code {
        font-family: 'Courier New', Consolas, monospace;
        background-color: #f5f5f5;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <h1>CSS 文本与字体指南</h1>

    <p class="lead">
      文本样式是网页设计的基础。通过合理设置字体、颜色、间距等属性，可以显著提升网页的可读性和美观度。
    </p>

    <h2>字体选择</h2>
    <p>
      选择合适的字体对用户体验至关重要。推荐使用系统字体栈，如 <code>-apple-system</code>、
      <code>BlinkMacSystemFont</code> 等，确保在不同设备上都有良好的显示效果。
    </p>

    <p class="quote">"好的排版是看不见的。它只有在做得不好时才引人注目。" —— Oliver Reichenstein</p>

    <h2>文本颜色</h2>
    <p>
      文本颜色应该与背景形成足够的对比度，确保可读性。避免使用纯黑色（<span class="highlight"
        >#000</span
      >）， 推荐使用深灰色（如 <span class="highlight">#333</span>），看起来更柔和。
    </p>

    <p>了解更多关于 <a href="#">CSS 颜色</a> 的知识。</p>
  </body>
</html>
```

## 最佳实践

1. **使用系统字体栈**：提升加载性能，保持原生体验
2. **合理设置行高**：正文使用 `1.5` 到 `1.8` 的行高
3. **控制行宽**：每行 50-75 个字符最佳，使用 `max-width` 限制
4. **使用 rem 单位**：便于全局调整字体大小
5. **注意对比度**：确保文本与背景有足够的对比度
6. **避免过多字体**：一个页面使用 2-3 种字体即可

## 小结

- `font-family` 设置字体族，提供回退字体
- `font-size` 设置字体大小，推荐使用 `rem` 单位
- `font-weight` 设置字体粗细，数值范围 100-900
- `line-height` 设置行高，推荐使用无单位数值
- `text-align` 设置文本水平对齐
- `color` 设置文本颜色，支持多种格式
- 使用 `text-shadow` 添加文本阴影效果

下一章我们将学习颜色与背景的设置方法。
