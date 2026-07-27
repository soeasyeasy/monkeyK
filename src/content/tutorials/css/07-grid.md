---
title: "第七章：Grid 布局"
description: "网格容器、行列定义、区域划分"
---

# 第七章：Grid 布局

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Grid 布局和 Flexbox 有什么区别？什么时候用 Grid？
- Grid 的那些网格线、网格轨道都是啥？听起来好复杂？
- `grid-template-areas` 是干嘛的？真的能画布局图吗？
- 响应式网格怎么实现？需要写媒体查询吗？

这一章就是为了解答这些问题。我们会先搞清楚 **Grid 布局的核心概念**，再动手实践各种二维布局效果。

---

## 1 为什么需要 Grid 布局？

### 痛点分析

虽然 Flexbox 很好用，但它也有局限：

- Flexbox 是**一维**的，只能处理一行或者一列
- 想做二维布局（既有行又有列），得嵌套好几层 Flexbox
- 想实现复杂的页面布局（比如仪表盘、相册画廊），Flexbox 写起来很麻烦
- 行列的大小不好同时控制
- 想让某个元素跨几行几列，Flexbox 做起来很别扭

打个比方：

> 如果说 Flexbox 是"一维的乐高积木"，只能沿着一条线拼，那 Grid 就是"二维的棋盘格子"，可以同时在横向和纵向上布局。Flexbox 适合做组件级的布局（比如导航栏、卡片内部），而 Grid 适合做页面级的整体布局。

### 解决方案

CSS Grid 是一个强大的**二维布局系统**，可以同时控制行和列。有了它，你可以轻松实现：

- 复杂的二维页面布局
- 响应式网格（不用写一堆媒体查询）
- 元素跨行跨列
- 用命名区域直观地定义布局
- 各种精美的图片画廊、仪表盘

> **一句话总结**：Grid 是布局的"棋盘大师"，二维布局的终极武器。

---

## 2 核心原理

### 基本概念

Grid 布局由两部分组成：**容器（Container）**和**项目（Item）**。

- **Grid 容器**：设置了 `display: grid` 的元素
- **Grid 项目**：容器的直接子元素

```html
<!-- Grid 容器 -->
<div class="container">
  <!-- Grid 项目 -->
  <div class="item">1</div>
  <div class="item">2</div>
  <div class="item">3</div>
</div>
```

```css
.container {
  display: grid;  /* 变成 Grid 容器 */
}
```

### 核心术语

让我们来认识一下 Grid 里的几个重要概念：

| 术语 | 说明 | 比喻 |
| --- | --- | --- |
| **网格线（Grid Line）** | 划分网格的线，编号从 1 开始 | 棋盘上的格子线 |
| **网格轨道（Grid Track）** | 两条网格线之间的空间（行或列） | 棋盘上的行和列 |
| **网格单元格（Grid Cell）** | 最小的网格单位 | 棋盘上的一个格子 |
| **网格区域（Grid Area）** | 由一个或多个单元格组成的矩形区域 | 棋盘上的一块矩形区域 |

```
列网格线 →   1      2      3      4
           ┌──────┬──────┬──────┐
    行1  │  单元格  │  单元格  │  单元格  │  ← 行网格线
           ├──────┼──────┼──────┤
    行2  │  单元格  │  单元格  │  单元格  │
           ├──────┼──────┼──────┤
    行3  │  单元格  │  单元格  │  单元格  │
           └──────┴──────┴──────┘
           
↑ 3行 × 3列的网格，有4条水平线和4条垂直线
```

打个比方：

> Grid 布局就像是一个**围棋棋盘**，有横纵交错的线，把棋盘分成一个个小格子。你可以把棋子（项目）放在任意一个格子里，也可以让一颗棋子占据好几个格子的位置。

### fr 单位

Grid 里有一个特殊的单位叫 **fr**（fraction 的缩写，意思是"份数"）。

- `1fr` 表示"剩余空间的 1 份"
- `2fr` 表示"剩余空间的 2 份"
- 如果有 `1fr 2fr 1fr`，就是把剩余空间分成 4 份，分别占 1、2、1 份

打个比方：就像分蛋糕，`1fr 2fr 1fr` 就是把蛋糕切成4份，三个人分别拿1份、2份、1份。

### Grid vs Flexbox 对比

| 特性 | Flexbox | Grid |
| --- | --- | --- |
| 维度 | 一维（行或列） | 二维（行和列） |
| 适用场景 | 组件级布局、导航栏、卡片内部 | 页面级布局、整体框架、图片画廊 |
| 内容驱动 | 是（内容决定大小） | 否（先定义网格，再放内容） |
| 跨行跨列 | 困难 | 原生支持，非常简单 |
| 布局方式 | 从内容出发 | 从布局出发 |
| 学习曲线 | 相对简单 | 概念稍多，但学会了很强大 |

> 💡 **怎么选？**
> 
> - 一维布局（一条线上排东西）→ Flexbox
> - 二维布局（有行有列的网格）→ Grid
> - 两者可以嵌套使用，配合效果最佳！

---

## 3 容器属性详解

### 1. grid-template-columns（定义列）

定义有多少列，每列多宽。

```css
/* 3 列，每列 200px */
.fixed {
  grid-template-columns: 200px 200px 200px;
}

/* 3 列，用 fr 单位，自动分配 */
.flexible {
  grid-template-columns: 1fr 2fr 1fr;  /* 中间列是两边的两倍宽 */
}

/* 混合单位 */
.mixed {
  grid-template-columns: 200px 1fr 1fr;  /* 第一列固定200px，剩下的两等分 */
}

/* 百分比 */
.percent {
  grid-template-columns: 30% 40% 30%;
}
```

### 2. grid-template-rows（定义行）

定义有多少行，每行多高。

```css
/* 3 行，高度分别是 100px、auto、100px */
.rows {
  grid-template-rows: 100px auto 100px;
}

/* 也可以用 fr */
.rows-fr {
  grid-template-rows: 1fr 2fr;
}
```

### 3. repeat() 函数

重复定义，简化代码。

```css
/* 写 6 个 1fr，不用一个个写 */
.repeat {
  grid-template-columns: repeat(6, 1fr);
  /* 等同于 1fr 1fr 1fr 1fr 1fr 1fr */
}

/* 重复模式 */
.pattern {
  grid-template-columns: repeat(3, 100px 200px);
  /* 等同于 100px 200px 100px 200px 100px 200px */
}
```

### 4. minmax() 函数

设置最小和最大尺寸，非常灵活。

```css
/* 每列最小 200px，最大 1fr（自动放大） */
.minmax {
  grid-template-columns: repeat(3, minmax(200px, 1fr));
}
```

### 5. auto-fill 和 auto-fit（响应式神器！）

配合 `repeat()` 和 `minmax()`，可以**不用媒体查询**就实现响应式网格！

```css
/* auto-fill：能放多少列就放多少列，放不下就换行 */
.auto-fill {
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}

/* auto-fit：和 auto-fill 类似，但空列会被折叠 */
.auto-fit {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}
```

> 🤔 **auto-fill vs auto-fit 有什么区别？**
> 
> - `auto-fill`：尽量多填列，即使是空的列也占着位置
> - `auto-fit`：空列会被折叠，内容会撑开
> 
> 简单说：做响应式卡片网格的，用 `auto-fit` 就对了！

### 6. gap（间距）

设置网格项目之间的间距。

```css
/* 行间距和列间距都是 20px */
.gap-20 {
  gap: 20px;
}

/* 行间距 10px，列间距 20px */
.gap-different {
  gap: 10px 20px;
}

/* 分开写也行 */
.separate {
  row-gap: 10px;
  column-gap: 20px;
}
```

> 💡 注意：`gap` 只在项目之间有，容器边缘没有。

### 7. justify-items / align-items（单元格内对齐）

控制项目在**单元格内部**的对齐方式。

```css
/* 水平方向：拉伸填满（默认） */
.justify-stretch {
  justify-items: stretch;
}

/* 水平方向：居中 */
.justify-center {
  justify-items: center;
}

/* 垂直方向：居中 */
.align-center {
  align-items: center;
}

/* 两个都居中的简写 */
.place-center {
  place-items: center;  /* 等同于 justify-items + align-items */
}
```

| 值 | 说明 |
| --- | --- |
| `stretch` | 拉伸填满（默认） |
| `start` | 起始位置 |
| `end` | 结束位置 |
| `center` | 居中 |

### 8. justify-content / align-content（网格整体对齐）

当网格的总大小**小于**容器的时候，控制整个网格在容器里的对齐方式。

```css
/* 整个网格在容器中水平居中 */
.justify-content-center {
  justify-content: center;
}

/* 整个网格在容器中垂直居中 */
.align-content-center {
  align-content: center;
}

/* 简写 */
.place-content-center {
  place-content: center;
}
```

### 9. grid-template-areas（命名区域，超级直观！）

用文字"画"出布局图，然后给项目指定放在哪个区域。

```css
.container {
  display: grid;
  grid-template-columns: 200px 1fr 200px;  /* 3列 */
  grid-template-rows: auto 1fr auto;        /* 3行 */
  /* 用文字画出布局图 */
  grid-template-areas:
    "header header header"
    "sidebar main rightbar"
    "footer footer footer";
}

/* 给每个项目指定区域 */
.header {
  grid-area: header;    /* 放在 header 区域 */
}
.sidebar {
  grid-area: sidebar;   /* 放在 sidebar 区域 */
}
.main {
  grid-area: main;      /* 放在 main 区域 */
}
.rightbar {
  grid-area: rightbar;  /* 放在 rightbar 区域 */
}
.footer {
  grid-area: footer;    /* 放在 footer 区域 */
}
```

> 🎉 **太直观了！** 看看 `grid-template-areas` 里的文字，就知道布局长啥样了。用 `.` 可以表示空的单元格。

---

## 4 项目属性详解

### 1. grid-column / grid-row（指定位置）

指定项目从哪条网格线开始，到哪条网格线结束。

```css
/* 从第 1 条列线开始，到第 3 条列线结束（占2列） */
.item {
  grid-column: 1 / 3;
}

/* 从第 1 条行线开始，到第 2 条行线结束（占1行） */
.item {
  grid-row: 1 / 2;
}
```

**关键字 `span`**：表示"跨越几格"，比写行号方便。

```css
/* 跨越 2 列 */
.span-2 {
  grid-column: span 2;
}

/* 跨越 3 行 */
.span-3-row {
  grid-row: span 3;
}
```

**负数表示从后往前数**：

```css
/* 从第 1 条线到最后一条线（占满整行） */
.full-width {
  grid-column: 1 / -1;
}
```

### 2. grid-area（指定命名区域）

配合 `grid-template-areas` 使用，指定项目放在哪个区域。

```css
/* 放在名为 header 的区域 */
.header {
  grid-area: header;
}
```

`grid-area` 也可以作为 `grid-row` 和 `grid-column` 的简写：

```css
/* 等同于 grid-row: 1 / 2; grid-column: 1 / 3; */
.item {
  grid-area: 1 / 1 / 2 / 3;
  /* 顺序：row-start / column-start / row-end / column-end */
}
```

### 3. justify-self / align-self（单独对齐）

让单个项目在单元格里的对齐方式和其他不一样。

```css
/* 这个项目自己水平居中 */
.item {
  justify-self: center;
}

/* 这个项目自己垂直居中 */
.item {
  align-self: center;
}

/* 简写 */
.item {
  place-self: center;
}
```

### 正确与错误写法对比

```css
/* ✅ 正确：fr 只能用在 Grid 的轨道大小上 */
.grid {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
}

/* ❌ 错误：fr 不能用在普通的 width 上 */
.box {
  width: 1fr;  /* 没用！fr 只能在 Grid 里用 */
}
```

```css
/* ✅ 正确：直接子元素才是 grid 项目 */
<div class="grid">
  <div class="item">1</div>  <!-- 是 grid 项目 -->
  <div class="item">2</div>  <!-- 是 grid 项目 -->
</div>

/* ❌ 错误：孙子元素不是 grid 项目 */
<div class="grid">
  <div class="wrapper">
    <div class="item">1</div>  <!-- 不是！ -->
  </div>
</div>
```

---

## 5 常见布局模式

### 1. 响应式卡片网格（最常用！）

不用写媒体查询，自动适应宽度。

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}
```

> ✨ **就这一行！** 实现了响应式网格：
> - 屏幕大的，自动多放几列
> - 屏幕小的，自动减少列数
> - 每列最少 300px，有空间就放大

### 2. 圣杯布局（经典页面结构）

```css
.layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "left   main   right"
    "footer footer footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

.header { grid-area: header; }
.left-sidebar { grid-area: left; }
.main { grid-area: main; }
.right-sidebar { grid-area: right; }
.footer { grid-area: footer; }
```

### 3. 12 列网格系统

```css
.grid-12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
}

/* 占 6 列（一半） */
.col-6 {
  grid-column: span 6;
}

/* 占 4 列（三分之一） */
.col-4 {
  grid-column: span 4;
}

/* 占 3 列（四分之一） */
.col-3 {
  grid-column: span 3;
}
```

### 4. 水平垂直居中

```css
/* 只用两行就搞定 */
.container {
  display: grid;
  place-items: center;  /* 水平垂直都居中 */
  min-height: 100vh;
}
```

### 5. 图片画廊（瀑布流风格）

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  grid-auto-rows: 200px;  /* 自动行高 */
  gap: 12px;
}

/* 大图占 2x2 */
.featured {
  grid-column: span 2;
  grid-row: span 2;
}
```

---

## 6 核心知识点总结

### 容器属性

| 属性 | 作用 | 常用值/写法 |
| --- | --- | --- |
| `grid-template-columns` | 定义列 | `1fr 2fr`、`repeat(3, 1fr)` |
| `grid-template-rows` | 定义行 | `auto 1fr auto` |
| `gap` | 网格间距 | `20px`、`10px 20px` |
| `grid-template-areas` | 命名区域 | 用文字画布局图 |
| `justify-items` | 单元格水平对齐 | `center`、`stretch` |
| `align-items` | 单元格垂直对齐 | `center`、`stretch` |
| `place-items` | 上面两个的简写 | `center` |
| `justify-content` | 网格整体水平对齐 | `center` |
| `align-content` | 网格整体垂直对齐 | `center` |
| `place-content` | 上面两个的简写 | `center` |

### 项目属性

| 属性 | 作用 | 常用值/写法 |
| --- | --- | --- |
| `grid-column` | 列的位置 | `1 / 3`、`span 2`、`1 / -1` |
| `grid-row` | 行的位置 | `1 / 2`、`span 3` |
| `grid-area` | 命名区域 / 简写 | `header`、`1 / 1 / 2 / 3` |
| `justify-self` | 单个项目水平对齐 | `center` |
| `align-self` | 单个项目垂直对齐 | `center` |
| `place-self` | 上面两个的简写 | `center` |

### 实用函数

| 函数 | 作用 | 示例 |
| --- | --- | --- |
| `repeat()` | 重复定义 | `repeat(3, 1fr)` |
| `minmax()` | 最小最大尺寸 | `minmax(200px, 1fr)` |
| `auto-fit` | 自适应填充（响应式） | `repeat(auto-fit, minmax(...))` |
| `auto-fill` | 自动填充 | `repeat(auto-fill, minmax(...))` |

---

## 7 新手常见误区

### 误区 1："Grid 比 Flexbox 厉害，以后都用 Grid"

**不对！** Grid 和 Flexbox 各有各的适用场景，不是谁取代谁：

- 一维布局（一条线）→ Flexbox 更简单
- 二维布局（有行有列）→ Grid 更合适
- 实际项目中，两者经常嵌套使用

打个比方：
- Flexbox 就像是"一字螺丝刀"
- Grid 就像是"十字螺丝刀"
- 不是谁更好，而是要看场景

正确做法：根据场景选择，灵活搭配。

### 误区 2："grid-template-areas 里的文字随便写都行"

**有规则的！** 使用 `grid-template-areas` 时要注意：

- 每个区域名出现的次数要一致（比如 header 出现 3 次，就得有 3 列）
- 必须形成矩形区域，不能是 L 形的
- 同名区域必须连在一起

```css
/* ✅ 正确：都是矩形 */
grid-template-areas:
  "header header header"
  "sidebar main main"
  "footer footer footer";

/* ❌ 错误：L 形不行 */
grid-template-areas:
  "header header header"
  "sidebar main header"  /* 不行，header 断开了 */
  "footer footer footer";
```

### 误区 3："auto-fill 和 auto-fit 是一样的"

**不一样！** 虽然它们长得像，效果在很多时候也一样，但有区别：

- `auto-fill`：尽量多塞列，空列也占着位置
- `auto-fit`：空列会被折叠，内容会撑开

大多数场景下用 `auto-fit` 效果更好，特别是做卡片网格的时候。

### 误区 4："fr 单位可以用在任何地方"

**错！** `fr` 单位只能用在 Grid 的 `grid-template-columns` 和 `grid-template-rows` 里，不能用在普通的 `width`、`height` 上。

```css
/* ❌ 错误：width 不能用 fr */
.box {
  width: 1fr;
}

/* ✅ 正确：fr 只能在 Grid 里用 */
.grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
}
```

### 误区 5："Grid 很难学，概念太多了"

其实 Grid 的核心概念就那几个，搞懂了就很简单：

1. 先定义网格（几行几列）
2. 再把项目放到网格里（占几格）

而且 Grid 的属性虽然多，但很多都是成对的（justify/align），规律很明显。多写几次就熟练了。

---

## 8 动手练习

### 练习 1：基础练习

创建一个 HTML 页面，用 Grid 实现：

- 一个 3 列 × 2 行的网格
- 每列等宽（1fr）
- 每个格子 100px 高
- 格子之间有 16px 间距
- 每个格子里有数字（1-6）
- 格子有背景色和圆角，文字居中

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习1：Grid 基础网格</title>
  <style>
    body {
      margin: 0;
      padding: 40px;
      background-color: #f5f5f5;
      font-family: Arial, sans-serif;
    }

    /* Grid 容器 */
    .grid-container {
      max-width: 600px;
      margin: 0 auto;
      display: grid;                           /* 启用 Grid */
      grid-template-columns: repeat(3, 1fr);   /* 3 列，等分 */
      grid-template-rows: repeat(2, 100px);    /* 2 行，每行 100px */
      gap: 16px;                               /* 间距 16px */
    }

    /* Grid 项目 */
    .grid-item {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-radius: 8px;
      font-size: 24px;
      font-weight: bold;
      /* 文字居中 */
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <div class="grid-container">
    <div class="grid-item">1</div>
    <div class="grid-item">2</div>
    <div class="grid-item">3</div>
    <div class="grid-item">4</div>
    <div class="grid-item">5</div>
    <div class="grid-item">6</div>
  </div>
</body>
</html>
```

</details>

### 练习 2：进阶练习

创建一个简单的页面布局，用 `grid-template-areas` 实现：

- 顶部：头部（Header）
- 左侧：侧边栏（Sidebar），宽度 200px
- 右侧：主内容区（Main），占剩余空间
- 底部：页脚（Footer）
- 整体占满视口高度
- 各区域有不同的背景色区分

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习2：Grid 页面布局</title>
  <style>
    /* 全局重置 */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      color: #333;
    }

    /* 页面布局容器 */
    .layout {
      display: grid;
      /* 用文字画布局图 */
      grid-template-areas:
        "header header"
        "sidebar main"
        "footer footer";
      /* 两列：左侧 200px，右侧占剩余 */
      grid-template-columns: 200px 1fr;
      /* 三行：头和尾自动高，中间占满 */
      grid-template-rows: auto 1fr auto;
      min-height: 100vh;    /* 占满视口高度 */
    }

    /* 头部 */
    .header {
      grid-area: header;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 20px 24px;
    }

    .header h1 {
      font-size: 20px;
    }

    /* 侧边栏 */
    .sidebar {
      grid-area: sidebar;
      background-color: #f0f0f0;
      padding: 20px;
      border-right: 1px solid #e0e0e0;
    }

    .sidebar h3 {
      margin-bottom: 12px;
      color: #667eea;
    }

    .sidebar ul {
      list-style: none;
    }

    .sidebar li {
      padding: 8px 12px;
      margin-bottom: 4px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .sidebar li:hover {
      background-color: #e0e0ff;
    }

    /* 主内容区 */
    .main {
      grid-area: main;
      padding: 24px;
      background-color: #fafafa;
    }

    .main h2 {
      margin-bottom: 16px;
      color: #1a1a1a;
    }

    .main p {
      line-height: 1.8;
      color: #555;
      margin-bottom: 16px;
    }

    /* 页脚 */
    .footer {
      grid-area: footer;
      background-color: #333;
      color: #999;
      text-align: center;
      padding: 16px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="layout">
    <!-- 头部 -->
    <header class="header">
      <h1>我的网站</h1>
    </header>

    <!-- 侧边栏 -->
    <aside class="sidebar">
      <h3>导航菜单</h3>
      <ul>
        <li>🏠 首页</li>
        <li>📄 文章</li>
        <li>🖼️ 相册</li>
        <li>👤 关于</li>
        <li>📧 联系</li>
      </ul>
    </aside>

    <!-- 主内容区 -->
    <main class="main">
      <h2>欢迎来到我的网站</h2>
      <p>这是一个使用 CSS Grid 布局的页面示例。通过 grid-template-areas，我们可以用非常直观的方式定义页面布局。</p>
      <p>Grid 布局是 CSS 的二维布局系统，可以同时控制行和列，非常适合做页面级的整体布局。</p>
      <p>你可以看到，头部在最上面横跨整个页面，侧边栏在左边，主内容在右边，页脚在最下面。整个结构清晰明了。</p>
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      © 2024 我的网站. All rights reserved.
    </footer>
  </div>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习

创建一个响应式图片画廊页面，要求：

- 页面标题（居中）
- 使用 Grid 布局的响应式网格
- 每列最少 200px，自动适应屏幕宽度
- 每个图片格子是正方形（1:1 比例）
- 第一张图是"特色图"，占 2x2 的位置
- 格子之间有 12px 间距
- 有悬停效果（缩放、阴影）
- 整体居中，最大宽度 1000px
- 用渐变色代替实际图片

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习3：响应式图片画廊</title>
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
    .gallery-page {
      max-width: 1000px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    /* 页面标题 */
    .page-title {
      text-align: center;
      font-size: 32px;
      margin-bottom: 8px;
    }

    .page-subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 32px;
    }

    /* 图片画廊 Grid 容器 */
    .gallery {
      display: grid;
      /* 响应式：每列最小200px，自动适应 */
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      grid-auto-rows: 1fr;          /* 自动行高，和列宽一致（正方形） */
      gap: 12px;                    /* 间距 */
    }

    /* 让网格项保持正方形（通过 padding-top 技巧） */
    .gallery-item {
      position: relative;
      overflow: hidden;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    /* 用伪元素撑开高度，实现 1:1 正方形 */
    .gallery-item::before {
      content: "";
      display: block;
      padding-top: 100%;  /* 1:1 比例 */
    }

    /* 悬停效果 */
    .gallery-item:hover {
      transform: scale(1.02);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    /* 图片内容（居中的 emoji 和文字） */
    .gallery-item .content {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 48px;
    }

    .gallery-item .label {
      font-size: 14px;
      margin-top: 8px;
      opacity: 0.9;
    }

    /* 特色图：占 2x2 */
    .featured {
      grid-column: span 2;   /* 跨 2 列 */
      grid-row: span 2;      /* 跨 2 行 */
    }

    .featured .content {
      font-size: 72px;       /* 特色图的图标大一点 */
    }

    .featured .label {
      font-size: 18px;
    }

    /* 给每个格子不同的渐变色 */
    .item-1 { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .item-2 { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    .item-3 { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
    .item-4 { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
    .item-5 { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
    .item-6 { background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%); }
    .item-7 { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); }
    .item-8 { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); }
    .item-9 { background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%); }
  </style>
</head>
<body>
  <div class="gallery-page">
    <h1 class="page-title">精选画廊</h1>
    <p class="page-subtitle">用 CSS Grid 打造的响应式图片画廊</p>

    <!-- 画廊网格 -->
    <div class="gallery">
      <!-- 特色图（2x2） -->
      <div class="gallery-item featured item-1">
        <div class="content">
          🏔️
          <span class="label">风景精选</span>
        </div>
      </div>

      <!-- 普通图 -->
      <div class="gallery-item item-2">
        <div class="content">
          🌸
          <span class="label">春天</span>
        </div>
      </div>

      <div class="gallery-item item-3">
        <div class="content">
          🌊
          <span class="label">海洋</span>
        </div>
      </div>

      <div class="gallery-item item-4">
        <div class="content">
          🌲
          <span class="label">森林</span>
        </div>
      </div>

      <div class="gallery-item item-5">
        <div class="content">
          🌅
          <span class="label">日落</span>
        </div>
      </div>

      <div class="gallery-item item-6">
        <div class="content">
          ❄️
          <span class="label">冬日</span>
        </div>
      </div>

      <div class="gallery-item item-7">
        <div class="content">
          🍂
          <span class="label">秋天</span>
        </div>
      </div>

      <div class="gallery-item item-8">
        <div class="content">
          🌺
          <span class="label">花朵</span>
        </div>
      </div>

      <div class="gallery-item item-9">
        <div class="content">
          🏙️
          <span class="label">城市</span>
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

下一章我们会学习 **CSS 定位**——也就是 `position` 属性和各种定位方式。你会学到如何让元素"跳出"正常的文档流，实现悬浮按钮、固定导航栏、弹窗等效果。
