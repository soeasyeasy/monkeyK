---
title: "第二章：CSS 选择器"
description: "如何精确选中要加样式的元素"
---

# 第二章：CSS 选择器

## 本章导读

在学这一章之前，你可能会有这些疑问：

- CSS 选择器是什么？为什么要学这么多种选择器？
- 类选择器和 ID 选择器有什么区别？什么时候用哪个？
- 后代选择器和子选择器听起来差不多，到底哪里不一样？
- 什么是选择器优先级？样式冲突了怎么办？

这一章就是为了解答这些问题。我们会先搞清楚 **选择器的本质**，再逐个学习各种选择器的用法，最后掌握优先级规则。

---

## 1 为什么需要选择器？

### 痛点分析

想象一下，如果 CSS 没有选择器，会是什么样子？

- 你想给某个按钮加样式，得给每个按钮都写行内 style，累死人
- 想让所有段落文字都变成灰色，得一个一个标签去改
- 想让文章里的链接和导航栏的链接样式不一样，根本做不到
- 样式改起来超级麻烦，改一个颜色要找遍整个页面

打个比方：

> 如果把 CSS 样式比作"快递包裹"，那选择器就是"快递地址"。没有地址，你都不知道包裹要送给谁。选择器越精确，快递就越能准确送到对的人手上。

### 解决方案

CSS 选择器就是用来**精确选中你想要加样式的元素**的工具。有了选择器，你可以：

- 按标签名批量选中元素（比如所有段落）
- 按类名选中特定元素（比如所有按钮）
- 按层级关系选中元素（比如导航栏里的链接）
- 按状态选中元素（比如鼠标悬停的按钮）
- 灵活组合各种条件，想选谁就选谁

> **一句话总结**：选择器是 CSS 的"导航系统"，帮你精确找到要加样式的元素。

---

## 2 核心原理

### 概念解释

选择器的核心思想是**匹配**：根据一定的规则，找到符合条件的 HTML 元素，然后把样式应用上去。

就像在教室里点名：

- **元素选择器**："所有同学站起来"——按身份批量选
- **类选择器**："穿红色衣服的同学站起来"——按特征选
- **ID 选择器**："张三同学站起来"——按名字精准选
- **后代选择器**："第一组的所有同学站起来"——按范围选
- **伪类选择器**："举手的同学站起来"——按状态选

### 选择器分类对比

| 选择器类型 | 作用 | 比喻 | 常见程度 |
| --- | --- | --- | --- |
| 基础选择器 | 按标签、类、ID 选 | 按身份/特征/名字找人 | ⭐⭐⭐⭐⭐ |
| 组合选择器 | 按层级关系选 | 按家庭/班级找人 | ⭐⭐⭐⭐ |
| 属性选择器 | 按属性选 | 按戴不戴眼镜找人 | ⭐⭐⭐ |
| 伪类选择器 | 按状态选 | 按举不举手找人 | ⭐⭐⭐⭐ |
| 伪元素选择器 | 选元素的一部分 | 选人的左手/右手 | ⭐⭐⭐ |

---

## 3 基础选择器

基础选择器是最常用、最简单的选择器，一定要熟练掌握。

### 1. 元素选择器（标签选择器）

直接用 HTML 标签名作为选择器，选中所有该类型的元素。

```css
/* 选中所有 p 标签，把文字设为蓝色 */
p {
  color: blue;
}

/* 选中所有 h1 标签，字号设为24像素 */
h1 {
  font-size: 24px;
}
```

**特点**：选中范围广，一选就是一大片。

> ⚠️ **注意**：元素选择器会影响页面上所有该类型的元素，适合做全局基础样式，不适合做差异化样式。

### 2. 类选择器 ✅ 最常用

用 `.` 加类名，选中所有有这个类名的元素。

**CSS 代码：**
```css
/* 选中所有有 highlight 类的元素，加黄色背景 */
.highlight {
  background-color: yellow;
}

/* 选中所有有 btn 类的元素，设置按钮样式 */
.btn {
  padding: 10px 20px;      /* 上下内边距10px，左右20px */
  border: none;            /* 去掉边框 */
  border-radius: 4px;      /* 圆角4像素 */
  cursor: pointer;         /* 鼠标移上去变成小手 */
}
```

**HTML 中使用：**
```html
<!-- 给段落加 highlight 类 -->
<p class="highlight">这段文字有黄色背景</p>

<!-- 给按钮加 btn 类 -->
<button class="btn">点击我</button>
```

**一个元素可以有多个类名，用空格分隔：**
```html
<!-- 同时有 btn 和 primary 两个类 -->
<button class="btn primary">主要按钮</button>
```

> ✅ **推荐**：类选择器是日常开发中用得最多的，因为它灵活、可复用、优先级适中。

### 3. ID 选择器

用 `#` 加 ID 名，选中有这个 ID 的元素（ID 在页面中必须唯一）。

**CSS 代码：**
```css
/* 选中 ID 为 header 的元素 */
#header {
  background-color: #333;  /* 深灰色背景 */
  color: white;            /* 白色文字 */
}

/* 选中 ID 为 main-content 的元素 */
#main-content {
  padding: 20px;           /* 内边距20像素 */
}
```

**HTML 中使用：**
```html
<div id="header">页面头部</div>
<div id="main-content">主要内容</div>
```

> ❌ **不推荐用来加样式**：ID 选择器优先级太高，后期想覆盖样式很麻烦。ID 更适合用来做 JavaScript 锚点或钩子。

### 4. 通用选择器

用 `*` 选中页面上所有元素。

```css
/* 选中所有元素，清除默认外边距和内边距 */
* {
  margin: 0;               /* 清除外边距 */
  padding: 0;              /* 清除内边距 */
  box-sizing: border-box;  /* 盒模型设为 border-box */
}
```

**特点**：选中范围最广，所有元素都不放过。

> ⚠️ **适用场景**：通常用来做全局样式重置，清除浏览器的默认样式。

### 基础选择器对比表

| 选择器 | 语法 | 选中范围 | 优先级 | 推荐度 |
| --- | --- | --- | --- | --- |
| 元素选择器 | `p {}` | 所有该标签元素 | 1 | ⭐⭐⭐ |
| 类选择器 | `.btn {}` | 所有该类元素 | 10 | ⭐⭐⭐⭐⭐ |
| ID 选择器 | `#header {}` | 唯一元素 | 100 | ⭐⭐ |
| 通用选择器 | `* {}` | 所有元素 | 最低 | ⭐⭐ |

---

## 4 组合选择器

组合选择器就是把多个选择器组合起来，按元素之间的关系来选择。

### 1. 后代选择器（空格分隔）

选中某个元素的**所有后代**（包括儿子、孙子、曾孙子...）。

```css
/* 选中 article 里面的所有 p 标签 */
article p {
  line-height: 1.6;        /* 行高1.6倍 */
}
```

```html
<article>
  <p>这段会被选中（儿子）</p>
  <div>
    <p>这段也会被选中（孙子）</p>
  </div>
</article>
<p>这段不会被选中（在 article 外面）</p>
```

打个比方：后代选择器就像"张家所有人"，包括儿子、孙子、孙女，只要是张家的都算。

### 2. 子选择器（`>` 分隔）

只选中某个元素的**直接子元素**（儿子辈，不包括孙子）。

```css
/* 只选中 ul 的直接子元素 li */
ul > li {
  list-style: none;        /* 去掉列表符号 */
}
```

```html
<ul>
  <li>会被选中（直接子元素）</li>
  <li>
    <ul>
      <li>不会被选中（孙子元素）</li>
    </ul>
  </li>
</ul>
```

打个比方：子选择器就像"张家长子"，只算亲儿子，不算孙子。

### 3. 相邻兄弟选择器（`+` 分隔）

选中**紧接在**某个元素后面的第一个兄弟元素。

```css
/* 选中紧接在 h1 后面的第一个 p 标签 */
h1 + p {
  font-size: 18px;         /* 字号18像素 */
  color: #666;             /* 中灰色文字 */
}
```

```html
<h1>标题</h1>
<p>这段会被选中（紧接在 h1 后面）</p>
<p>这段不会被选中</p>
```

打个比方：相邻兄弟选择器就像"张三旁边的那个人"，必须紧挨着才算。

### 4. 通用兄弟选择器（`~` 分隔）

选中某个元素**后面的所有**兄弟元素。

```css
/* 选中 h1 后面所有的 p 标签 */
h1 ~ p {
  color: #666;             /* 中灰色文字 */
}
```

```html
<h1>标题</h1>
<p>会被选中</p>
<div>其他元素</div>
<p>也会被选中</p>
```

打个比方：通用兄弟选择器就像"张三后面的所有人"，只要在后面都算。

### 组合选择器对比表

| 选择器 | 语法 | 选中范围 | 记忆口诀 |
| --- | --- | --- | --- |
| 后代选择器 | `父 子 {}` | 所有后代 | 空格分隔，子孙后代都算 |
| 子选择器 | `父 > 子 {}` | 直接子元素 | 大于号，只选亲儿子 |
| 相邻兄弟 | `兄 + 弟 {}` | 下一个兄弟 | 加号，紧挨着的下一个 |
| 通用兄弟 | `兄 ~ 弟 {}` | 后面所有兄弟 | 波浪号，后面全选 |

---

## 5 属性选择器

根据元素的 HTML 属性来选择元素。

### 常用属性选择器

| 语法 | 含义 | 示例 |
| --- | --- | --- |
| `[attr]` | 有这个属性就行 | `[disabled]` 选中所有禁用的元素 |
| `[attr=value]` | 属性值完全等于 | `input[type="text"]` 选中文本输入框 |
| `[attr^=value]` | 属性值以...开头 | `a[href^="https"]` 选中 https 开头的链接 |
| `[attr$=value]` | 属性值以...结尾 | `a[href$=".pdf"]` 选中 pdf 链接 |
| `[attr*=value]` | 属性值包含... | `a[href*="baidu"]` 选中包含 baidu 的链接 |

### 示例代码

```css
/* 选中所有有 disabled 属性的元素 */
[disabled] {
  opacity: 0.5;            /* 半透明 */
  cursor: not-allowed;     /* 禁止光标 */
}

/* 选中 type 为 text 的 input */
input[type="text"] {
  border: 1px solid #ccc;  /* 灰色边框 */
  padding: 8px;            /* 内边距8像素 */
}

/* 选中 href 以 https 开头的链接 */
a[href^="https"] {
  color: green;            /* 绿色文字 */
}

/* 选中 href 以 .pdf 结尾的链接 */
a[href$=".pdf"] {
  color: red;              /* 红色文字 */
}
```

---

## 6 伪类选择器

伪类用来选择处于**特定状态**的元素，比如鼠标悬停、被点击、第一个子元素等。

### 1. 链接伪类（LVHA 顺序）

```css
/* 未访问过的链接 */
a:link {
  color: blue;
}

/* 已访问过的链接 */
a:visited {
  color: purple;
}

/* 鼠标悬停时 */
a:hover {
  color: red;
}

/* 鼠标点击按住时 */
a:active {
  color: orange;
}
```

> ⚠️ **重要**：这四个伪类的顺序很重要，必须按 **LVHA** 的顺序写（Link → Visited → Hover → Active），否则可能不生效。

### 2. 常用动态伪类

```css
/* 输入框获得焦点时 */
input:focus {
  outline: 2px solid blue; /* 蓝色外边框 */
}

/* 按钮鼠标悬停时 */
button:hover {
  background-color: #0056b3; /* 深蓝色背景 */
}
```

### 3. 结构伪类（非常实用！）

```css
/* 选中第一个子元素 */
li:first-child {
  font-weight: bold;       /* 加粗 */
}

/* 选中最后一个子元素 */
li:last-child {
  border-bottom: none;     /* 去掉底部边框 */
}

/* 选中第 n 个子元素（n 从1开始） */
li:nth-child(2) {
  color: red;              /* 红色文字 */
}

/* 选中奇数行（1、3、5...） */
li:nth-child(odd) {
  background-color: #f5f5f5; /* 浅灰背景 */
}

/* 选中偶数行（2、4、6...） */
li:nth-child(even) {
  background-color: #fff;  /* 白色背景 */
}

/* 选中第 3、6、9... 个（3的倍数） */
li:nth-child(3n) {
  color: blue;             /* 蓝色文字 */
}
```

> 💡 **小技巧**：`nth-child` 做表格隔行变色、列表斑马纹超好用！

---

## 7 伪元素选择器

伪元素用来选择元素的**某一部分**，或者在元素前后插入内容。

### 常用伪元素

| 伪元素 | 作用 |
| --- | --- |
| `::before` | 在元素内容前面插入内容 |
| `::after` | 在元素内容后面插入内容 |
| `::first-letter` | 选中首字母 |
| `::first-line` | 选中首行 |
| `::selection` | 选中用户高亮的内容 |

### 示例代码

```css
/* 必填字段前面加红色星号 */
.required::before {
  content: "*";            /* 必须有 content 属性 */
  color: red;              /* 红色 */
  margin-right: 4px;       /* 右边距4像素 */
}

/* 段落首字母放大 */
p::first-letter {
  font-size: 24px;         /* 字号24像素 */
  font-weight: bold;       /* 加粗 */
  color: blue;             /* 蓝色 */
}

/* 用户选中文字时的样式 */
::selection {
  background-color: blue;  /* 蓝色背景 */
  color: white;            /* 白色文字 */
}
```

> ⚠️ **注意**：`::before` 和 `::after` 必须设置 `content` 属性才会生效，哪怕值是空字符串 `content: ""`。

---

## 8 选择器优先级

### 什么是优先级？

当多个选择器都选中同一个元素，并且设置了相同的属性时，浏览器用**优先级**来决定听谁的。

打个比方：就像公司里，经理说的话比组长管用，组长说的话比员工管用。优先级高的说了算。

### 优先级计算规则

| 选择器类型 | 优先级权重 | 比喻 |
| --- | --- | --- |
| 行内样式（style 属性） | 1000 | 老板 |
| ID 选择器 | 100 | 经理 |
| 类选择器、属性选择器、伪类 | 10 | 组长 |
| 元素选择器、伪元素 | 1 | 员工 |
| 通用选择器 `*` | 0 | 实习生 |

### 优先级示例

```css
/* 优先级：1（一个元素选择器） */
p {
  color: black;
}

/* 优先级：10（一个类选择器） */
.text {
  color: blue;
}

/* 优先级：100（一个ID选择器） */
#content {
  color: red;
}
```

```html
<!-- 行内样式优先级最高：1000 -->
<p id="content" class="text" style="color: green;">
  最终文字是绿色的，因为行内样式优先级最高
</p>
```

### `!important` 终极武器

使用 `!important` 可以覆盖所有优先级：

```css
.text {
  color: blue !important;  /* 谁都盖不住我 */
}
```

> ❌ **强烈不推荐**：`!important` 会破坏 CSS 的级联机制，让代码变得难以维护。除非万不得已，否则千万别用！

---

## 9 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 元素选择器 | 按标签名选，范围广 |
| 类选择器 | 用 `.`，最常用，推荐 ✅ |
| ID 选择器 | 用 `#`，优先级太高，不推荐加样式 |
| 通用选择器 | `*`，选所有元素，常用于重置 |
| 后代选择器 | 空格分隔，所有后代都算 |
| 子选择器 | `>`，只选直接子元素 |
| 相邻兄弟 | `+`，紧挨着的下一个 |
| 通用兄弟 | `~`，后面所有兄弟 |
| 伪类选择器 | `:hover`、`:nth-child()` 等，按状态选 |
| 伪元素选择器 | `::before`、`::after` 等，选元素的一部分 |
| 优先级 | 行内 > ID > 类 > 元素 |

---

## 10 新手常见误区

### 误区 1："ID 选择器和类选择器差不多，随便用哪个都行"

**错！** 它们区别大了：

- ID 在页面中必须唯一，类可以重复使用
- ID 选择器优先级（100）比类选择器（10）高 10 倍
- 用 ID 加样式，后期想覆盖都难，维护起来很麻烦

正确做法：**加样式优先用类选择器**，ID 留给 JavaScript 或锚点用。

### 误区 2："选择器写得越长越好，越精确越好"

**不是的。** 选择器写得太长有很多问题：

- 优先级太高，后期不好覆盖
- 性能差（虽然影响很小）
- 代码冗余，不好维护
- 依赖 HTML 结构，结构一变样式就挂了

正确做法：**保持选择器简洁**，尽量不超过 3 层嵌套。优先使用类选择器，让样式更独立。

### 误区 3："`:hover` 只对链接有用"

**错！** `:hover` 对几乎所有元素都有用：

```css
/* 鼠标悬停在 div 上也能有效果 */
.card:hover {
  transform: translateY(-2px);  /* 向上移动2像素 */
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);  /* 阴影加深 */
}
```

按钮、卡片、图片、列表项...都可以用 `:hover` 做交互效果。

### 误区 4："伪类和伪元素是一回事，冒号写一个两个都行"

**不一样！** 它们是两个完全不同的概念：

- **伪类**（一个冒号 `:`）：选中处于某种状态的元素，比如 `:hover`、`:active`、`:nth-child()`
- **伪元素**（两个冒号 `::`）：选中元素的一部分，比如 `::before`、`::after`、`::first-letter`

虽然浏览器为了兼容，写一个冒号也可能生效，但规范上是有区别的。

正确做法：伪类用一个冒号，伪元素用两个冒号，区分清楚。

### 误区 5："样式不生效就加 `!important`"

**大错特错！** 这是新手最容易犯的毛病。`!important` 就像"耍赖皮"，虽然能暂时解决问题，但后患无穷：

- 以后想覆盖这个样式，得用更高级的 `!important`
- 代码越来越乱，最后谁都不敢改
- 破坏了 CSS 的级联机制，违背了设计初衷

正确做法：先搞清楚为什么样式不生效，是不是选择器优先级不够？是不是写错了？是不是被其他样式覆盖了？找到根本原因再解决。

---

## 11 动手练习

### 练习 1：基础练习

创建一个 HTML 页面，使用内部样式表实现：

- 所有段落文字颜色为深灰色（`#333`），字号 16px
- 有 `.highlight` 类的段落背景为黄色
- ID 为 `title` 的标题文字居中、蓝色
- 链接鼠标悬停时变成红色，去掉下划线

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习1：基础选择器</title>
  <style>
    /* 所有段落样式 */
    p {
      color: #333;
      font-size: 16px;
    }

    /* highlight 类样式 */
    .highlight {
      background-color: yellow;
    }

    /* title ID 样式 */
    #title {
      text-align: center;
      color: blue;
    }

    /* 链接样式 */
    a {
      text-decoration: none;
      color: blue;
    }

    /* 鼠标悬停 */
    a:hover {
      color: red;
    }
  </style>
</head>
<body>
  <h1 id="title">CSS 选择器练习</h1>
  
  <p>这是第一个普通段落。</p>
  <p class="highlight">这是有 highlight 类的段落，背景是黄色的。</p>
  <p>这是第三个普通段落。</p>
  
  <p>学习更多，请访问 <a href="#">CSS 教程网站</a>。</p>
</body>
</html>
```

</details>

### 练习 2：进阶练习

创建一个产品列表页面，实现以下效果：

- 使用无序列表展示 5 个产品
- 每个产品有名称和价格
- 第一个产品名称加粗
- 奇数行产品有浅灰色背景
- 鼠标悬停在产品上时，背景变成浅蓝色
- 价格文字是红色的，使用类选择器

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习2：产品列表</title>
  <style>
    /* 全局重置 */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      background-color: #f5f5f5;
    }

    h1 {
      text-align: center;
      margin-bottom: 30px;
      color: #333;
    }

    /* 产品列表容器 */
    .product-list {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    /* 产品项 */
    .product-item {
      list-style: none;
      padding: 16px 20px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background-color 0.3s;
    }

    /* 去掉最后一个的边框 */
    .product-item:last-child {
      border-bottom: none;
    }

    /* 奇数行浅灰背景 */
    .product-item:nth-child(odd) {
      background-color: #fafafa;
    }

    /* 鼠标悬停变浅蓝 */
    .product-item:hover {
      background-color: #e3f2fd;
    }

    /* 第一个产品名称加粗 */
    .product-item:first-child .product-name {
      font-weight: bold;
    }

    /* 产品名称 */
    .product-name {
      color: #333;
      font-size: 16px;
    }

    /* 价格 */
    .price {
      color: #ff4444;
      font-weight: bold;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <h1>热门产品</h1>
  
  <ul class="product-list">
    <li class="product-item">
      <span class="product-name">产品一：机械键盘</span>
      <span class="price">¥299</span>
    </li>
    <li class="product-item">
      <span class="product-name">产品二：无线鼠标</span>
      <span class="price">¥99</span>
    </li>
    <li class="product-item">
      <span class="product-name">产品三：显示器支架</span>
      <span class="price">¥199</span>
    </li>
    <li class="product-item">
      <span class="product-name">产品四：笔记本电脑</span>
      <span class="price">¥5999</span>
    </li>
    <li class="product-item">
      <span class="product-name">产品五：USB 集线器</span>
      <span class="price">¥59</span>
    </li>
  </ul>
</body>
</html>
```

</details>

### 练习 3（挑战）：导航菜单

创建一个带有下拉菜单的导航栏：

- 顶部导航栏，深色背景，白色文字
- 有 4 个主菜单项，水平排列
- 鼠标悬停在主菜单上时，背景变亮
- 第二个菜单项有下拉菜单，默认隐藏
- 鼠标悬停在主菜单上时，显示下拉菜单
- 下拉菜单有 3 个子菜单项
- 使用伪元素 `::after` 给有下拉菜单的项加一个小箭头

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习3：导航菜单</title>
  <style>
    /* 全局重置 */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
    }

    /* 导航栏 */
    .navbar {
      background-color: #333;
      padding: 0 40px;
    }

    /* 清除列表样式 */
    .nav-list {
      list-style: none;
      display: flex;
    }

    /* 主菜单项 */
    .nav-item {
      position: relative;
    }

    /* 主菜单链接 */
    .nav-item > a {
      display: block;
      padding: 16px 24px;
      color: white;
      text-decoration: none;
      transition: background-color 0.3s;
    }

    /* 鼠标悬停主菜单 */
    .nav-item > a:hover {
      background-color: #555;
    }

    /* 有下拉菜单的项后面加箭头 */
    .has-dropdown > a::after {
      content: "▼";
      font-size: 10px;
      margin-left: 6px;
    }

    /* 下拉菜单（默认隐藏） */
    .dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      list-style: none;
      background-color: #444;
      min-width: 160px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.3s;
    }

    /* 鼠标悬停时显示下拉菜单 */
    .has-dropdown:hover .dropdown {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    /* 下拉菜单项 */
    .dropdown li a {
      display: block;
      padding: 12px 20px;
      color: white;
      text-decoration: none;
      transition: background-color 0.3s;
    }

    /* 下拉菜单鼠标悬停 */
    .dropdown li a:hover {
      background-color: #555;
    }

    /* 页面内容区 */
    .content {
      padding: 40px;
      text-align: center;
      color: #666;
    }
  </style>
</head>
<body>
  <nav class="navbar">
    <ul class="nav-list">
      <li class="nav-item">
        <a href="#">首页</a>
      </li>
      <li class="nav-item has-dropdown">
        <a href="#">产品</a>
        <ul class="dropdown">
          <li><a href="#">产品介绍</a></li>
          <li><a href="#">功能特性</a></li>
          <li><a href="#">价格方案</a></li>
        </ul>
      </li>
      <li class="nav-item">
        <a href="#">关于我们</a>
      </li>
      <li class="nav-item">
        <a href="#">联系我们</a>
      </li>
    </ul>
  </nav>

  <div class="content">
    <h2>欢迎来到我们的网站</h2>
    <p>把鼠标移到"产品"菜单上，看看下拉效果吧！</p>
  </div>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **CSS 盒模型**——也就是每个 HTML 元素的"盒子结构"。你会学到 content、padding、border、margin 这四个组成部分，以及标准盒模型和替代盒模型的区别。掌握了盒模型，才能精准控制元素的尺寸和间距。
