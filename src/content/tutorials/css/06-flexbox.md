---
title: "第六章：Flexbox 布局"
description: "弹性盒子、主轴、交叉轴"
---

# 第六章：Flexbox 布局

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 为什么垂直居中这么难？有没有简单的方法？
- Flexbox 到底是什么？为什么大家都在用？
- 主轴和交叉轴是什么？老是搞混怎么办？
- Flexbox 有哪些常用属性？记不住啊？

这一章就是为了解答这些问题。我们会先搞清楚 **Flexbox 的核心概念**，再动手实践各种布局效果。

---

## 6.1 为什么需要 Flexbox？

### 痛点分析

在 Flexbox 出现之前，我们做布局有多痛苦？

- 想让一个元素**垂直居中**，得用各种奇技淫巧（比如 `position + transform`、`display: table-cell`）
- 想让几个元素**水平排列**，得用 `float`，但浮动又会导致高度塌陷，还得清浮动
- 想让元素**自动填满剩余空间**，得用 JS 算，或者用各种 hack
- 想让元素**自动换行**，实现响应式布局，特别麻烦
- 各种布局问题层出不穷，前端工程师的头发就是这么掉的

打个比方：

> 在 Flexbox 出现之前，做 CSS 布局就像是用积木搭房子——你得小心翼翼地调整每一块的位置，稍微动一下就全塌了。而 Flexbox 就像是给你了一套"乐高积木"，每块积木都有弹性，能自动适应空间，搭起来又快又稳。

### 解决方案

Flexbox（弹性盒子布局）是 CSS3 推出的一维布局模型，专门用来解决元素排列和对齐的问题。有了它，你可以轻松实现：

- 水平居中、垂直居中、水平垂直居中
- 元素自动分配空间
- 元素的排列顺序灵活调整
- 响应式的自动换行
- 各种复杂的组件级布局

> **一句话总结**：Flexbox 是布局的"瑞士军刀"，让各种对齐和分布变得简单又优雅。

---

## 6.2 核心原理

### 基本概念

Flexbox 由两部分组成：**容器（Container）**和**项目（Item）**。

- **Flex 容器**：设置了 `display: flex` 的元素，是"盒子"本身
- **Flex 项目**：容器的直接子元素，是盒子里装的"东西"

```html
<!-- 这个 div 就是 flex 容器 -->
<div class="container">
  <!-- 这三个 div 就是 flex 项目 -->
  <div class="item">1</div>
  <div class="item">2</div>
  <div class="item">3</div>
</div>
```

```css
.container {
  display: flex;  /* 把这个元素变成 flex 容器 */
}
```

打个比方：

> Flex 容器就像是一个**弹性收纳盒**，里面的项目就是收纳盒里的物品。收纳盒有弹性，可以根据空间自动调整物品的位置和大小，让物品排列得整整齐齐。

### 两根轴：主轴和交叉轴

Flexbox 有两根轴，这是理解 Flexbox 的关键：

- **主轴（Main Axis）**：项目排列的方向，默认是水平方向（从左到右）
- **交叉轴（Cross Axis）**：垂直于主轴的方向，默认是垂直方向（从上到下）

```
              主轴 →
交叉轴  ┌─────────────────────────┐
  ↓     │  [1]  [2]  [3]  [4]    │
        └─────────────────────────┘
```

> 💡 **记不住怎么办？**
> 
> 记住：主轴就是"主要排列方向"，交叉轴就是"交叉的另一个方向"。主轴方向变了，交叉轴也跟着变。
> 
> 比如：如果主轴是垂直的（从上到下），那交叉轴就是水平的（从左到右）。

### Flexbox vs 传统布局对比

| 特性 | 传统布局（float/position） | Flexbox |
| --- | --- | --- |
| 垂直居中 | 很难，需要各种 hack | 很简单，一行代码搞定 |
| 元素排列 | 用 float，容易出问题 | 原生支持，稳定可靠 |
| 空间分配 | 需要手动计算或 JS | 自动分配，弹性灵活 |
| 排列顺序 | 依赖 HTML 顺序 | 用 CSS 就能改顺序 |
| 学习难度 | 坑多，需要积累经验 | 逻辑清晰，容易理解 |
| 浏览器支持 | 全部支持 | 现代浏览器都支持 |

---

## 6.3 容器属性详解

容器属性是加在 **flex 容器**上的，用来控制里面项目的排列方式。

### 1. flex-direction（主轴方向）

决定主轴的方向，也就是项目往哪个方向排列。

```css
/* 默认：从左到右（行方向） */
.row {
  flex-direction: row;
}

/* 从右到左（行反向） */
.row-reverse {
  flex-direction: row-reverse;
}

/* 从上到下（列方向） */
.column {
  flex-direction: column;
}

/* 从下到上（列反向） */
.column-reverse {
  flex-direction: column-reverse;
}
```

> 💡 **小提示**：改了 `flex-direction`，主轴和交叉轴都会跟着变！

### 2. flex-wrap（换行）

决定项目排不下的时候，要不要换行。

```css
/* 默认：不换行，挤一挤都在一行 */
.nowrap {
  flex-wrap: nowrap;
}

/* 换行，排不下就另起一行 */
.wrap {
  flex-wrap: wrap;
}

/* 反向换行，新行在上面 */
.wrap-reverse {
  flex-wrap: wrap-reverse;
}
```

### 3. justify-content（主轴对齐）

控制项目在**主轴**上的对齐方式。

```css
/* 默认：从主轴起点开始排列 */
.flex-start {
  justify-content: flex-start;
}

/* 从主轴末尾开始排列 */
.flex-end {
  justify-content: flex-end;
}

/* 居中对齐 */
.center {
  justify-content: center;
}

/* 两端对齐，项目之间间距相等 */
.space-between {
  justify-content: space-between;
}

/* 每个项目两侧的间距相等 */
.space-around {
  justify-content: space-around;
}

/* 所有间距都相等（包括两端） */
.space-evenly {
  justify-content: space-evenly;
}
```

**三种 space 的区别**：

```
space-between: [1]     [2]     [3]     （两端没有间距）
space-around:   [1]    [2]    [3]     （两侧间距是中间的一半）
space-evenly:   [1]   [2]   [3]      （所有间距都一样）
```

### 4. align-items（交叉轴对齐）

控制项目在**交叉轴**上的对齐方式。

```css
/* 默认：拉伸填满整个交叉轴 */
.stretch {
  align-items: stretch;
}

/* 交叉轴起点对齐 */
.flex-start {
  align-items: flex-start;
}

/* 交叉轴末尾对齐 */
.flex-end {
  align-items: flex-end;
}

/* 交叉轴居中对齐 */
.center {
  align-items: center;
}

/* 文字基线对齐 */
.baseline {
  align-items: baseline;
}
```

> ✅ **经典技巧**：`justify-content: center` + `align-items: center` = 水平垂直居中！

### 5. align-content（多行交叉轴对齐）

当有多行项目的时候，控制**行与行之间**在交叉轴上的对齐方式。

> ⚠️ **注意**：只有一行的时候，这个属性不生效！必须设置了 `flex-wrap: wrap` 并且有多行才有用。

```css
/* 默认：拉伸填满 */
.stretch {
  align-content: stretch;
}

/* 从交叉轴起点开始 */
.flex-start {
  align-content: flex-start;
}

/* 从交叉轴末尾开始 */
.flex-end {
  align-content: flex-end;
}

/* 居中 */
.center {
  align-content: center;
}

/* 两端对齐 */
.space-between {
  align-content: space-between;
}

/* 每行两侧间距相等 */
.space-around {
  align-content: space-around;
}
```

### 6. gap（项目间距）

设置项目之间的间距，比用 margin 方便多了！

```css
/* 水平和垂直间距都是 16px */
.gap-16 {
  gap: 16px;
}

/* 行间距 10px，列间距 20px */
.gap-different {
  gap: 10px 20px;
}

/* 也可以分开写 */
.separate {
  row-gap: 10px;     /* 行间距 */
  column-gap: 20px;  /* 列间距 */
}
```

> 💡 **gap vs margin**：
> 
> 用 `gap` 的好处是：它只作用于项目之间，不会在容器边缘也加间距。不像 margin，还得处理第一个和最后一个元素的边距问题。

### 正确与错误写法对比

```html
<!-- ✅ 正确：直接子元素才是 flex 项目 -->
<div class="container">
  <div class="item">1</div>   <!-- 是 flex 项目 -->
  <div class="item">2</div>   <!-- 是 flex 项目 -->
</div>

<!-- ❌ 错误：孙子元素不是 flex 项目 -->
<div class="container">
  <div class="wrapper">
    <div class="item">1</div> <!-- 不是 flex 项目！ -->
  </div>
</div>
```

```css
/* ✅ 正确：属性加在容器上 */
.container {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* ❌ 错误：把容器属性加在项目上 */
.item {
  justify-content: center;  /* 没用！这个属性是给容器的 */
  align-items: center;      /* 没用！ */
}
```

---

## 6.4 项目属性详解

项目属性是加在 **flex 项目**上的，用来控制单个项目的行为。

### 1. order（排列顺序）

控制项目的排列顺序，数值越小越靠前。默认是 0。

```css
.item1 {
  order: 2;    /* 排第3（默认0的排前面） */
}
.item2 {
  order: 0;    /* 排第1（默认值） */
}
.item3 {
  order: 1;    /* 排第2 */
}
/* 显示顺序：item2, item3, item1 */
```

> 💡 **小技巧**：可以用负数，比 0 还小的会排到最前面。

### 2. flex-grow（放大比例）

当容器有**剩余空间**的时候，项目会不会放大，以及按什么比例放大。

```css
.item {
  flex-grow: 0;  /* 默认：不放大，有剩余空间也不抢 */
}

.grow-1 {
  flex-grow: 1;  /* 有剩余空间就分一份 */
}

.grow-2 {
  flex-grow: 2;  /* 分两份，比 grow-1 多一倍 */
}
```

**举个例子**：

容器宽度 600px，三个项目各占 100px，总共用了 300px，还剩 300px。

- 如果三个项目的 `flex-grow` 都是 1：每个项目分 100px（300 ÷ 3），最终每个 200px
- 如果项目1是 2，项目2是 1，项目3是 1：总共 4 份，每份 75px。项目1分 150px（最终 250px），其他各分 75px（最终 175px）

### 3. flex-shrink（缩小比例）

当容器空间**不够**的时候，项目会不会缩小，以及按什么比例缩小。

```css
.item {
  flex-shrink: 1;  /* 默认：空间不够就缩小 */
}

.no-shrink {
  flex-shrink: 0;  /* 不缩小，死撑着 */
}

.shrink-more {
  flex-shrink: 2;  /* 缩得更多 */
}
```

### 4. flex-basis（初始大小）

项目在分配空间之前的初始大小，默认是 `auto`（根据内容决定）。

```css
.item {
  flex-basis: 200px;   /* 初始宽度 200px */
}

.item-percent {
  flex-basis: 50%;     /* 初始宽度 50% */
}

.item-auto {
  flex-basis: auto;    /* 默认：内容撑开多少就是多少 */
}
```

### 5. flex（简写属性）

`flex-grow` + `flex-shrink` + `flex-basis` 的简写，**强烈推荐用这个！**

```css
/* 常用写法 */
.flex-1 {
  flex: 1;  /* 等同于 flex: 1 1 0% */
  /* 放大比例1，缩小比例1，初始大小0 */
  /* 效果：自动填满剩余空间 */
}

.flex-auto {
  flex: auto;  /* 等同于 flex: 1 1 auto */
  /* 放大比例1，缩小比例1，初始大小auto */
}

.flex-none {
  flex: none;  /* 等同于 flex: 0 0 auto */
  /* 不放大，不缩小，大小由内容决定 */
}

/* 完整写法 */
.flex-full {
  flex: 2 0 200px;
  /* 放大比例2，不缩小，初始大小200px */
}
```

> ✅ **最佳实践**：尽量用 `flex` 简写，不要分开写三个属性。简写会智能地设置默认值，避免各种奇怪的问题。

### 6. align-self（单独对齐）

让某个项目自己的交叉轴对齐方式不一样，覆盖容器的 `align-items` 设置。

```css
.item {
  align-self: flex-start;  /* 这个项目自己在交叉轴起点对齐 */
}

.item-center {
  align-self: center;      /* 这个自己居中 */
}

.item-end {
  align-self: flex-end;    /* 这个自己在末尾 */
}

.item-stretch {
  align-self: stretch;     /* 这个自己拉伸 */
}
```

---

## 6.5 常见布局模式

### 1. 水平垂直居中（最经典！）

```css
/* 父容器设置这三个，子元素就居中了 */
.container {
  display: flex;
  justify-content: center;  /* 主轴居中 */
  align-items: center;      /* 交叉轴居中 */
  min-height: 100vh;        /* 给个高度，不然看不出效果 */
}
```

> 🎉 **就这么简单！** 以前要写十几行代码的垂直居中，现在 Flexbox 三行搞定。

### 2. 两端对齐的导航栏

```css
.navbar {
  display: flex;
  justify-content: space-between;  /* 两端对齐 */
  align-items: center;             /* 垂直居中 */
  padding: 16px 24px;
}
```

### 3. 等分布局

```css
.container {
  display: flex;
  gap: 16px;
}

.item {
  flex: 1;  /* 每个项目都占一份，自动等分 */
}
```

### 4. 自适应卡片网格

```css
.card-grid {
  display: flex;
  flex-wrap: wrap;       /* 换行 */
  gap: 20px;             /* 间距 */
}

.card {
  flex: 1 1 300px;       /* 最小300px，能放大就放大 */
}
```

### 5. 圣杯布局（侧边栏+主内容）

```css
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  flex: 0 0 250px;   /* 不放大不缩小，固定250px */
}

.main {
  flex: 1;            /* 剩下的空间都归我 */
}
```

### 6. 粘性页脚（footer 固定在底部）

```css
.page {
  display: flex;
  flex-direction: column;  /* 主轴改成垂直方向 */
  min-height: 100vh;       /* 至少占满整个视口高度 */
}

.header {
  /* 高度由内容决定 */
}

.content {
  flex: 1;  /* 内容区自动填满剩余空间，把 footer 挤到底部 */
}

.footer {
  /* 高度由内容决定 */
}
```

---

## 6.6 核心知识点总结

### 容器属性

| 属性 | 作用 | 常用值 |
| --- | --- | --- |
| `flex-direction` | 主轴方向 | `row`、`column` |
| `flex-wrap` | 是否换行 | `nowrap`、`wrap` |
| `justify-content` | 主轴对齐 | `center`、`space-between`、`flex-start` |
| `align-items` | 交叉轴对齐 | `center`、`stretch`、`flex-start` |
| `align-content` | 多行交叉轴对齐 | `center`、`space-between` |
| `gap` | 项目间距 | 任意长度值 |

### 项目属性

| 属性 | 作用 | 常用值 |
| --- | --- | --- |
| `order` | 排列顺序 | 数字，默认0 |
| `flex-grow` | 放大比例 | 数字，默认0 |
| `flex-shrink` | 缩小比例 | 数字，默认1 |
| `flex-basis` | 初始大小 | 长度值，默认auto |
| `flex` | 简写（推荐） | `1`、`auto`、`none` |
| `align-self` | 单独交叉轴对齐 | `center`、`flex-start` |

---

## 6.7 新手常见误区

### 误区 1："给子元素加 display: flex 就能用 flex 属性了"

**错！** `display: flex` 是加在**父容器**上的，父元素变成 flex 容器，它的直接子元素才会变成 flex 项目。

打个比方：你得先有一个"弹性收纳盒"（容器设为 flex），盒子里的东西（直接子元素）才会有弹性。不是给东西本身加弹性。

正确做法：给父元素加 `display: flex`。

### 误区 2："justify-content 和 align-items 老是搞混"

记不住的时候，这样想：

- **justify-content**："justify"（调整）主轴（main axis）的内容 → 主轴对齐
- **align-items**："align"（对齐）交叉轴（cross axis）的项目 → 交叉轴对齐

还有一个简单记法：**主 just，交 align**。多写几次就记住了。

### 误区 3："flex: 1 和 flex: auto 是一样的"

**不一样！** 区别在于 `flex-basis`：

- `flex: 1` = `flex: 1 1 0%` → 初始大小是 0，所有剩余空间都按比例分配
- `flex: auto` = `flex: 1 1 auto` → 初始大小是 auto（内容撑开的大小），剩余空间再按比例分配

简单说：`flex: 1` 是"先平均分配，再考虑内容"；`flex: auto` 是"先给内容留出空间，剩下的再分"。

### 误区 4："align-content 和 align-items 是一回事"

**不一样！**

- `align-items`：控制**每一行**里的项目在交叉轴上怎么对齐
- `align-content`：控制**行与行之间**在交叉轴上怎么对齐（只有一行时不生效）

打个比方：
- `align-items` 像是"每行内部的对齐方式"
- `align-content` 像是"行和行怎么排列"

### 误区 5："flex-direction 改成 column 之后，justify-content 还是水平的"

**错！** 主轴变了，`justify-content` 的方向也跟着变！

- `flex-direction: row` 时，主轴是水平的 → `justify-content` 控制水平对齐
- `flex-direction: column` 时，主轴是垂直的 → `justify-content` 控制垂直对齐

`align-items` 也一样，主轴变了，它管的方向也变了。记住：**justify 永远管主轴，align 永远管交叉轴**。

---

## 6.8 动手练习

### 练习 1：基础练习

创建一个 HTML 页面，用 Flexbox 实现：

- 一个 400px × 300px 的容器
- 容器里有 3 个盒子（100px × 100px）
- 3 个盒子**水平垂直居中**在容器里
- 盒子之间有 20px 间距

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习1：Flexbox 居中</title>
  <style>
    /* 容器样式 */
    .container {
      width: 400px;
      height: 300px;
      background-color: #f0f0f0;
      border-radius: 8px;
      margin: 40px auto;
      /* Flexbox 核心代码 */
      display: flex;                    /* 变成 flex 容器 */
      justify-content: center;          /* 主轴（水平）居中 */
      align-items: center;              /* 交叉轴（垂直）居中 */
      gap: 20px;                        /* 项目间距 20px */
    }

    /* 盒子样式 */
    .box {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="box"></div>
    <div class="box"></div>
    <div class="box"></div>
  </div>
</body>
</html>
```

</details>

### 练习 2：进阶练习

创建一个导航栏组件，实现：

- 左侧是 Logo（文字或图标）
- 中间是导航链接（首页、关于、服务、联系）
- 右侧是一个按钮（登录）
- 整体垂直居中
- 导航链接之间有 24px 间距
- 美观的样式（深色背景、白色文字）

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习2：Flexbox 导航栏</title>
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

    /* 导航栏容器 */
    .navbar {
      background-color: #333;
      color: white;
      padding: 0 24px;
      height: 60px;
      /* Flexbox 布局 */
      display: flex;
      justify-content: space-between;  /* 两端对齐：左中右分开 */
      align-items: center;             /* 垂直居中 */
    }

    /* Logo 样式 */
    .logo {
      font-size: 20px;
      font-weight: bold;
    }

    /* 导航链接容器 */
    .nav-links {
      display: flex;          /* 链接也用 flex 排列 */
      gap: 24px;              /* 链接间距 */
      list-style: none;       /* 去掉列表圆点 */
    }

    /* 导航链接样式 */
    .nav-links a {
      color: white;
      text-decoration: none;   /* 去掉下划线 */
      font-size: 14px;
      transition: color 0.3s;
    }

    .nav-links a:hover {
      color: #667eea;          /* 鼠标悬停变色 */
    }

    /* 登录按钮 */
    .btn-login {
      padding: 8px 20px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
      transition: transform 0.2s;
    }

    .btn-login:hover {
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
  <nav class="navbar">
    <!-- 左侧 Logo -->
    <div class="logo">MyApp</div>

    <!-- 中间导航链接 -->
    <ul class="nav-links">
      <li><a href="#">首页</a></li>
      <li><a href="#">关于</a></li>
      <li><a href="#">服务</a></li>
      <li><a href="#">联系</a></li>
    </ul>

    <!-- 右侧登录按钮 -->
    <button class="btn-login">登录</button>
  </nav>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习

创建一个完整的卡片列表页面，包含：

- 页面标题（居中）
- 一个卡片网格（自适应换行）
- 每个卡片有：图片占位区、标题、描述、按钮
- 卡片最少 280px 宽，自动适应容器宽度
- 卡片之间有 24px 间距
- 整体居中，最大宽度 1200px
- 样式美观，有阴影、圆角、悬停效果

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习3：Flexbox 卡片列表</title>
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
      line-height: 1.6;
    }

    /* 页面容器 */
    .page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    /* 页面标题 */
    .page-title {
      text-align: center;
      font-size: 32px;
      margin-bottom: 12px;
    }

    .page-subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 40px;
    }

    /* 卡片网格容器 */
    .card-grid {
      display: flex;           /* Flexbox 布局 */
      flex-wrap: wrap;         /* 换行 */
      gap: 24px;               /* 卡片间距 */
    }

    /* 单个卡片 */
    .card {
      flex: 1 1 280px;         /* 最小280px，能放大就放大 */
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: transform 0.3s, box-shadow 0.3s;
      /* 卡片内部也用 flex，让按钮靠底 */
      display: flex;
      flex-direction: column;
    }

    /* 鼠标悬停效果 */
    .card:hover {
      transform: translateY(-4px);      /* 向上飘 */
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    /* 卡片图片区 */
    .card-image {
      height: 160px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      /* 图片占位文字居中 */
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 48px;
    }

    /* 第2、3张卡片换个颜色，增加变化 */
    .card:nth-child(2) .card-image {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    .card:nth-child(3) .card-image {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
    .card:nth-child(4) .card-image {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    }
    .card:nth-child(5) .card-image {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    }
    .card:nth-child(6) .card-image {
      background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
    }

    /* 卡片内容区 */
    .card-content {
      padding: 20px;
      flex: 1;  /* 内容区自动撑开，让按钮靠底 */
      display: flex;
      flex-direction: column;
    }

    /* 卡片标题 */
    .card-title {
      font-size: 18px;
      margin-bottom: 8px;
      color: #1a1a1a;
    }

    /* 卡片描述 */
    .card-desc {
      font-size: 14px;
      color: #666;
      margin-bottom: 16px;
      flex: 1;  /* 描述撑开剩余空间，按钮靠底 */
    }

    /* 卡片按钮 */
    .card-btn {
      align-self: flex-start;   /* 按钮不要拉伸 */
      padding: 8px 20px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 20px;
      font-size: 14px;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .card-btn:hover {
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  <div class="page">
    <h1 class="page-title">精选课程</h1>
    <p class="page-subtitle">发现适合你的优质课程，开启学习之旅</p>

    <!-- 卡片网格 -->
    <div class="card-grid">
      <!-- 卡片 1 -->
      <div class="card">
        <div class="card-image">🎨</div>
        <div class="card-content">
          <h3 class="card-title">CSS 进阶实战</h3>
          <p class="card-desc">深入学习 CSS 高级技巧，包括动画、响应式布局、性能优化等内容。</p>
          <button class="card-btn">立即学习</button>
        </div>
      </div>

      <!-- 卡片 2 -->
      <div class="card">
        <div class="card-image">💻</div>
        <div class="card-content">
          <h3 class="card-title">JavaScript 入门</h3>
          <p class="card-desc">从零开始学习 JavaScript，掌握基础语法和常用 DOM 操作。</p>
          <button class="card-btn">立即学习</button>
        </div>
      </div>

      <!-- 卡片 3 -->
      <div class="card">
        <div class="card-image">🚀</div>
        <div class="card-content">
          <h3 class="card-title">Vue3 全家桶</h3>
          <p class="card-desc">系统学习 Vue3 组合式 API、Vue Router、Pinia 等全家桶技术。</p>
          <button class="card-btn">立即学习</button>
        </div>
      </div>

      <!-- 卡片 4 -->
      <div class="card">
        <div class="card-image">📱</div>
        <div class="card-content">
          <h3 class="card-title">响应式设计</h3>
          <p class="card-desc">学习如何让网页在各种设备上都有良好的显示效果。</p>
          <button class="card-btn">立即学习</button>
        </div>
      </div>

      <!-- 卡片 5 -->
      <div class="card">
        <div class="card-image">⚡</div>
        <div class="card-content">
          <h3 class="card-title">性能优化</h3>
          <p class="card-desc">学习前端性能优化的各种手段，让你的网站飞起来。</p>
          <button class="card-btn">立即学习</button>
        </div>
      </div>

      <!-- 卡片 6 -->
      <div class="card">
        <div class="card-image">🎯</div>
        <div class="card-content">
          <h3 class="card-title">面试题精讲</h3>
          <p class="card-desc">精选前端面试题，深入讲解原理，助你轻松拿下 offer。</p>
          <button class="card-btn">立即学习</button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **Grid 布局**——也就是 CSS 的二维网格布局系统。如果说 Flexbox 是一维的"乐高积木"，那 Grid 就是二维的"棋盘格子"，能轻松实现更复杂的页面级布局。
