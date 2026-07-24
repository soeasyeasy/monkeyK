---
title: 选择器
description: 元素、类、ID、属性选择器
---

# CSS 选择器

选择器是 CSS 的核心，它决定了样式规则应用到哪些 HTML 元素上。掌握选择器是编写高效 CSS 的基础。

## 基础选择器

### 1. 元素选择器

直接使用 HTML 标签名作为选择器，作用于所有该类型的元素。

```css
p {
  color: blue;
}

h1 {
  font-size: 24px;
}
```

### 2. 类选择器

使用 `.` 加类名，作用于所有具有该类名的元素。

```css
.highlight {
  background-color: yellow;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
}
```

HTML 中使用：

```html
<p class="highlight">这段文字有黄色背景</p>
<button class="btn">按钮</button>
```

一个元素可以有多个类名，用空格分隔：

```html
<button class="btn primary">主要按钮</button>
```

### 3. ID 选择器

使用 `#` 加 ID 名，作用于具有该 ID 的唯一元素。

```css
#header {
  background-color: #333;
  color: white;
}

#main-content {
  padding: 20px;
}
```

HTML 中使用：

```html
<div id="header">页面头部</div>
<div id="main-content">主要内容</div>
```

**注意**：ID 在页面中应该是唯一的，不能重复使用。

### 4. 通用选择器

使用 `*` 选择所有元素。

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
```

常用于全局重置样式。

## 组合选择器

### 1. 后代选择器

使用空格分隔，选择指定元素的所有后代元素。

```css
article p {
  line-height: 1.6;
}
```

```html
<article>
  <p>这段文字会被选中</p>
  <div>
    <p>这段文字也会被选中（孙子元素）</p>
  </div>
</article>
<p>这段文字不会被选中</p>
```

### 2. 子选择器

使用 `>` 分隔，只选择直接子元素。

```css
ul > li {
  list-style: none;
}
```

```html
<ul>
  <li>直接子元素，会被选中</li>
  <li>
    <ul>
      <li>孙子元素，不会被选中</li>
    </ul>
  </li>
</ul>
```

### 3. 相邻兄弟选择器

使用 `+` 分隔，选择紧接在指定元素后的兄弟元素。

```css
h1 + p {
  font-size: 18px;
  color: #666;
}
```

```html
<h1>标题</h1>
<p>紧接在 h1 后的段落，会被选中</p>
<p>其他段落不会被选中</p>
```

### 4. 通用兄弟选择器

使用 `~` 分隔，选择指定元素之后的所有兄弟元素。

```css
h1 ~ p {
  color: #666;
}
```

```html
<h1>标题</h1>
<p>第一个兄弟段落，会被选中</p>
<div>其他元素</div>
<p>第二个兄弟段落，也会被选中</p>
```

## 属性选择器

根据元素的属性来选择元素。

### 1. `[attr]` - 具有指定属性

```css
[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### 2. `[attr=value]` - 属性等于指定值

```css
input[type="text"] {
  border: 1px solid #ccc;
}
```

### 3. `[attr~=value]` - 属性值包含指定单词

```css
[class~="warning"] {
  color: red;
}
```

```html
<p class="text warning">这段文字是红色的</p>
```

### 4. `[attr|=value]` - 属性值以指定值开头（后跟连字符或完全相等）

```css
[lang|="en"] {
  font-style: italic;
}
```

```html
<p lang="en-US">English text</p>
<p lang="en">English text</p>
```

### 5. `[attr^=value]` - 属性值以指定值开头

```css
a[href^="https"] {
  color: green;
}
```

### 6. `[attr$=value]` - 属性值以指定值结尾

```css
a[href$=".pdf"] {
  background: url(pdf-icon.png) no-repeat right center;
  padding-right: 20px;
}
```

### 7. `[attr*=value]` - 属性值包含指定字符串

```css
a[href*="example"] {
  color: purple;
}
```

## 伪类选择器

伪类用于选择处于特定状态的元素。

### 1. 链接伪类

```css
a:link {
  color: blue; /* 未访问的链接 */
}

a:visited {
  color: purple; /* 已访问的链接 */
}

a:hover {
  color: red; /* 鼠标悬停 */
}

a:active {
  color: orange; /* 激活状态（点击时） */
}
```

**注意**：伪类的顺序很重要，建议按 LVHA 顺序（Link、Visited、Hover、Active）。

### 2. 动态伪类

```css
input:focus {
  outline: 2px solid blue;
}

button:hover {
  background-color: #0056b3;
}
```

### 3. 结构伪类

```css
/* 第一个子元素 */
li:first-child {
  font-weight: bold;
}

/* 最后一个子元素 */
li:last-child {
  border-bottom: none;
}

/* 第 n 个子元素 */
li:nth-child(2) {
  color: red;
}

li:nth-child(odd) {
  background-color: #f5f5f5;
}

li:nth-child(even) {
  background-color: #fff;
}

li:nth-child(3n) {
  color: blue;
}

/* 第一个OfType */
p:first-of-type {
  font-size: 18px;
}

/* 最后一个OfType */
p:last-of-type {
  margin-bottom: 0;
}

/* 唯一子元素 */
div:only-child {
  text-align: center;
}

/* 第 n 个OfType */
p:nth-of-type(2) {
  color: green;
}
```

### 4. 其他伪类

```css
/* 禁用状态 */
input:disabled {
  background-color: #eee;
}

/* 启用状态 */
input:enabled {
  background-color: white;
}

/* 选中状态 */
input:checked {
  accent-color: blue;
}

/* 占位符 */
input::placeholder {
  color: #999;
}

/* 未匹配 */
input:invalid {
  border-color: red;
}

/* 匹配 */
input:valid {
  border-color: green;
}

/* 超出范围 */
input:out-of-range {
  border-color: orange;
}

/* 在范围内 */
input:in-range {
  border-color: green;
}

/* 必填 */
input:required {
  border-left: 3px solid red;
}

/* 可选 */
input:optional {
  border-left: 3px solid #ccc;
}

/* 只读 */
input:read-only {
  background-color: #f5f5f5;
}

/* 可读写 */
input:read-write {
  background-color: white;
}
```

## 伪元素选择器

伪元素用于选择元素的特定部分。

### 1. `::before` 和 `::after`

在元素内容前后插入生成内容。

```css
.required::before {
  content: "*";
  color: red;
  margin-right: 4px;
}

.quote::after {
  content: """;
  font-size: 24px;
  color: #999;
}
```

### 2. `::first-letter`

选择块级元素首字母。

```css
p::first-letter {
  font-size: 24px;
  font-weight: bold;
  color: blue;
}
```

### 3. `::first-line`

选择块级元素首行。

```css
p::first-line {
  font-weight: bold;
  color: #333;
}
```

### 4. `::selection`

选择用户选中的内容。

```css
::selection {
  background-color: blue;
  color: white;
}
```

## 选择器优先级

当多个规则作用于同一元素时，CSS 使用优先级来决定应用哪个规则。

### 优先级计算

| 选择器类型 | 优先级 |
|-----------|--------|
| 行内样式 | 1000 |
| ID 选择器 | 100 |
| 类选择器、属性选择器、伪类 | 10 |
| 元素选择器、伪元素 | 1 |

### 优先级示例

```css
/* 优先级：1 */
p { color: black; }

/* 优先级：10 */
.text { color: blue; }

/* 优先级：100 */
#content { color: red; }

/* 优先级：1000 */
<p style="color: green;">文字</p>
```

### `!important`

使用 `!important` 可以覆盖所有优先级规则：

```css
.text {
  color: blue !important;
}
```

**注意**：尽量避免使用 `!important`，它会破坏 CSS 的级联机制，使调试困难。

## 选择器最佳实践

1. **使用类选择器**：类选择器复用性好，优先级适中
2. **避免过度嵌套**：嵌套层级不超过 3 层
3. **避免使用 ID 选择器**：ID 优先级过高，不利于样式覆盖
4. **使用语义化类名**：类名应该描述用途而非外观
5. **保持选择器简洁**：优先使用简单选择器

## 小结

- 基础选择器：元素、类、ID、通用选择器
- 组合选择器：后代、子、相邻兄弟、通用兄弟选择器
- 属性选择器：根据属性值选择元素
- 伪类选择器：选择特定状态的元素
- 伪元素选择器：选择元素的特定部分
- 优先级：行内样式 > ID > 类 > 元素

下一章我们将学习盒模型，这是 CSS 布局的基础概念。
