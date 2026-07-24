---
title: "第八章：CSS 定位"
description: "static、relative、absolute、fixed、sticky 五种定位方式详解"
---

# 第八章：CSS 定位

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 CSS 定位？它和普通的布局有什么区别？
- 为什么有时候元素会"飘"起来，不占位置了？
- relative、absolute、fixed 这些定位方式到底有什么不同？
- 怎么让一个元素固定在页面某个位置，滚动时也不动？

这一章就是为了解答这些问题。我们会先搞清楚 **定位的本质**，再逐个学习五种定位方式，最后动手实践。

---

## 8.1 为什么需要定位？

### 痛点分析

想象一下，如果只能用正常的文档流布局，我们会遇到什么问题？

- 想做一个固定在顶部的导航栏，滚动页面时它也跟着跑了
- 想在图片右上角加一个"热门"标签，不知道怎么放上去
- 想做一个弹窗居中显示，用普通布局根本实现不了
- 想让侧边栏滚动到一定位置就固定住，完全做不到

打个比方：

> 普通的文档流就像是坐火车，每个人都有自己的座位（位置），你只能坐在自己的位置上，不能随便乱跑。而定位就像是给了你一张"通行证"，你可以离开自己的座位，走到车厢的任何地方，甚至站在别人头顶上。

### 解决方案

CSS 的 `position` 属性就是用来解决这些问题的。它让你可以：

- 把元素从正常文档流中"拿"出来，放到任意位置
- 让元素固定在视口的某个位置，滚动时也不动
- 让元素相对于另一个元素定位（比如角标、提示框）
- 让元素在滚动时自动切换定位状态（粘性定位）

> **一句话总结**：定位就是元素的"自由通行证"，让你可以精确控制元素在页面中的位置，不受正常文档流的限制。

---

## 8.2 核心原理

### 概念解释

在讲定位之前，我们先搞清楚一个概念：**文档流**。

文档流就是浏览器默认的布局方式：块级元素从上到下排列，行内元素从左到右排列。每个元素都占据自己的位置，谁也不能重叠。

而定位的核心思想就是：**让元素脱离正常的文档流，按照指定的参考点来定位**。

打个比方：

> 文档流就像是排队买奶茶，大家一个接一个排好队，每个人都站在自己的位置上。定位就像是有人插队或者跑到队伍旁边，他不再按照排队顺序站，而是按照自己的想法站到某个位置。

### 五种定位方式对比

| 定位方式 | 是否脱离文档流 | 定位参考点 | 常见使用场景 |
| --- | --- | --- | --- |
| `static` | ❌ 不脱离 | 正常文档流 | 默认值，几乎不用 |
| `relative` | ❌ 不脱离 | 元素自身原来的位置 | 作为 absolute 的参考点、微调位置 |
| `absolute` | ✅ 脱离 | 最近的非 static 祖先元素 | 弹窗、角标、下拉菜单 |
| `fixed` | ✅ 脱离 | 浏览器视口 | 固定导航栏、返回顶部按钮 |
| `sticky` | ❌ 不脱离 | 先相对自身，后相对视口 | 粘性导航栏、表头固定 |

---

## 8.3 基础用法

### 1. static（静态定位）

这是所有元素的默认值，元素按照正常文档流排列。

```css
/* 设置静态定位（其实不写也是这个效果） */
.box {
  position: static;   /* 静态定位，默认值 */
  top: 20px;          /* ❌ 对 static 无效！ */
  left: 30px;         /* ❌ 对 static 无效！ */
}
```

> 💡 **小提示**：`static` 是默认值，一般不用写。而且 `top`、`right`、`bottom`、`left` 这些偏移属性对 `static` 定位的元素完全无效。

---

### 2. relative（相对定位）

相对于元素**自己原来的位置**进行偏移，**不脱离文档流**。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>相对定位示例</title>
  <style>
    /* 父容器样式 */
    .container {
      border: 2px solid #ccc;    /* 灰色边框，方便看边界 */
      padding: 20px;              /* 内边距 */
    }

    /* 普通盒子 */
    .box {
      width: 100px;               /* 宽度100px */
      height: 100px;              /* 高度100px */
      background: #007bff;        /* 蓝色背景 */
      color: white;               /* 白色文字 */
      display: flex;              /* flex布局 */
      justify-content: center;    /* 水平居中 */
      align-items: center;        /* 垂直居中 */
      margin-bottom: 10px;        /* 下边距10px */
    }

    /* 相对定位的盒子 */
    .box-relative {
      position: relative;         /* ✅ 设置相对定位 */
      top: 20px;                  /* 向下偏移20px（相对于自己原来的位置） */
      left: 30px;                 /* 向右偏移30px（相对于自己原来的位置） */
      background: #28a745;        /* 绿色背景，方便区分 */
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="box">盒子1</div>
    <div class="box box-relative">盒子2（相对定位）</div>
    <div class="box">盒子3</div>
  </div>
</body>
</html>
```

> **原理**：相对定位的元素，虽然位置偏移了，但它原来的"坑位"还留着，其他元素不会往上挤。就好像你虽然站起来走到旁边了，但座位还在，别人不会坐你的位置。

✅ **正确用法**：
- 作为 `absolute` 定位元素的"参考父元素"
- 微调元素位置，比如往上挪一点、往左挪一点

❌ **错误用法**：
- 用 relative 来做整体布局（应该用 flex 或 grid）
- 偏移量设得很大，把元素移到很远的地方

---

### 3. absolute（绝对定位）

相对于最近的**非 static 定位的祖先元素**进行定位，**脱离文档流**。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>绝对定位示例</title>
  <style>
    /* 父容器 - 必须设置非static定位，作为参考点 */
    .parent {
      position: relative;         /* ✅ 相对定位，作为子元素的参考点 */
      width: 300px;               /* 宽度300px */
      height: 200px;              /* 高度200px */
      border: 2px solid #ccc;     /* 灰色边框 */
      margin: 50px auto;          /* 水平居中 */
    }

    /* 绝对定位的子元素 */
    .child {
      position: absolute;         /* ✅ 设置绝对定位 */
      top: 20px;                  /* 距离父元素顶部20px */
      right: 20px;                /* 距离父元素右侧20px */
      width: 80px;                /* 宽度80px */
      height: 80px;               /* 高度80px */
      background: #dc3545;        /* 红色背景 */
      color: white;               /* 白色文字 */
      display: flex;              /* flex布局 */
      justify-content: center;    /* 水平居中 */
      align-items: center;        /* 垂直居中 */
      border-radius: 8px;         /* 圆角 */
    }

    /* 普通内容，用来观察文档流 */
    .normal-content {
      background: #f0f0f0;        /* 浅灰背景 */
      padding: 10px;              /* 内边距 */
    }
  </style>
</head>
<body>
  <div class="parent">
    父元素内容
    <div class="child">角标</div>
    <div class="normal-content">普通内容，不会被绝对定位元素挤开</div>
  </div>
</body>
</html>
```

> **原理**：绝对定位的元素会完全脱离文档流，就像"悬浮"在页面上一样，不占据任何空间。其他元素会当它不存在，继续正常排列。

✅ **重点注意**：
- 绝对定位的参考点是"最近的非 static 祖先"
- 如果所有祖先都是 static，就相对于 `<html>` 定位
- 记得给父元素加 `position: relative`，不然会跑偏！

---

### 4. fixed（固定定位）

相对于**浏览器视口**进行定位，**脱离文档流**，滚动页面时位置不变。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>固定定位示例</title>
  <style>
    /* 固定在顶部的导航栏 */
    .navbar {
      position: fixed;            /* ✅ 设置固定定位 */
      top: 0;                     /* 距离视口顶部0 */
      left: 0;                    /* 距离视口左侧0 */
      right: 0;                   /* 距离视口右侧0 */
      height: 60px;               /* 高度60px */
      background: #333;           /* 深色背景 */
      color: white;               /* 白色文字 */
      display: flex;              /* flex布局 */
      align-items: center;        /* 垂直居中 */
      padding: 0 24px;            /* 左右内边距 */
      z-index: 100;               /* 层级设高一点，不被其他元素盖住 */
    }

    /* 页面内容，要给顶部留出导航栏的高度 */
    .content {
      margin-top: 60px;           /* 顶部留出60px，避免被导航栏遮挡 */
      padding: 20px;              /* 内边距 */
      height: 2000px;             /* 设置很高的高度，方便滚动测试 */
      background: #f5f5f5;        /* 浅灰背景 */
    }

    /* 返回顶部按钮 - 固定在右下角 */
    .back-to-top {
      position: fixed;            /* ✅ 固定定位 */
      bottom: 30px;               /* 距离视口底部30px */
      right: 30px;                /* 距离视口右侧30px */
      width: 50px;                /* 宽度50px */
      height: 50px;               /* 高度50px */
      background: #007bff;        /* 蓝色背景 */
      color: white;               /* 白色文字 */
      border: none;               /* 去掉边框 */
      border-radius: 50%;         /* 圆形 */
      cursor: pointer;            /* 鼠标悬停变手型 */
      font-size: 20px;            /* 字号 */
      z-index: 100;               /* 层级 */
    }
  </style>
</head>
<body>
  <nav class="navbar">固定导航栏 - 滚动试试看</nav>
  
  <div class="content">
    <h1>页面内容</h1>
    <p>往下滚动页面，导航栏会一直固定在顶部~</p>
    <p>右下角的返回顶部按钮也会一直跟着你~</p>
  </div>

  <button class="back-to-top">↑</button>
</body>
</html>
```

> **原理**：固定定位的参考点是浏览器的"可视窗口"（视口），所以不管页面怎么滚动，它都固定在那个位置。就像你手机屏幕上的悬浮球，怎么划屏幕它都在那儿。

---

### 5. sticky（粘性定位）

在滚动过程中，在相对定位和固定定位之间自动切换。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>粘性定位示例</title>
  <style>
    /* 页面整体布局 */
    .page {
      max-width: 800px;           /* 最大宽度800px */
      margin: 0 auto;             /* 水平居中 */
      padding: 20px;              /* 内边距 */
    }

    /* 粘性定位的标题 */
    .sticky-title {
      position: sticky;           /* ✅ 设置粘性定位 */
      top: 0;                     /* 滚动到距离顶部0时"粘住" */
      background: #007bff;        /* 蓝色背景 */
      color: white;               /* 白色文字 */
      padding: 10px 20px;         /* 内边距 */
      z-index: 10;                /* 层级 */
      border-radius: 4px;         /* 圆角 */
    }

    /* 内容区域 */
    .section {
      margin-bottom: 40px;        /* 下边距 */
      background: white;          /* 白色背景 */
      padding: 20px;              /* 内边距 */
      border-radius: 8px;         /* 圆角 */
      box-shadow: 0 2px 4px rgba(0,0,0,0.1); /* 阴影 */
    }

    /* 占位内容，让页面可以滚动 */
    .placeholder {
      height: 300px;              /* 高度300px */
      line-height: 300px;         /* 行高等于高度，文字垂直居中 */
      text-align: center;         /* 水平居中 */
      color: #999;                /* 灰色文字 */
    }
  </style>
</head>
<body>
  <div class="page">
    <h1>粘性定位演示</h1>
    <p>往下滚动页面，看看标题是怎么"粘"在顶部的~</p>

    <div class="section">
      <h2 class="sticky-title">第一部分：基础入门</h2>
      <div class="placeholder">第一部分内容</div>
    </div>

    <div class="section">
      <h2 class="sticky-title">第二部分：进阶技巧</h2>
      <div class="placeholder">第二部分内容</div>
    </div>

    <div class="section">
      <h2 class="sticky-title">第三部分：实战项目</h2>
      <div class="placeholder">第三部分内容</div>
    </div>
  </div>
</body>
</html>
```

> **原理**：粘性定位就像一个"变色龙"——在没滚到指定位置之前，它老老实实待在文档流里（相对定位）；一旦滚动到指定位置，它就"粘"在视口上不动了（固定定位）。

✅ **常见应用场景**：
- 文章列表的分类标题（滚到顶部就固定）
- 表格的表头（滚动时表头固定）
- 侧边栏的目录（滚动时跟着走）

---

### z-index（层叠顺序）

当多个定位元素重叠时，用 `z-index` 控制谁在上谁在下。

```css
/* 弹窗遮罩层 */
.overlay {
  position: fixed;
  z-index: 1000;        /* 层级1000 */
}

/* 弹窗内容 - 要比遮罩层高 */
.modal {
  position: fixed;
  z-index: 1001;        /* 层级1001，比遮罩层高，所以显示在上面 */
}
```

> 💡 **注意**：
> - `z-index` 只对**定位元素**（非 static）生效
> - 值越大，越在上面
> - 可以是负数，会放在普通元素下面
> - 要在同一个"层叠上下文"中比较才有效

---

## 8.4 五种定位方式对比表

| 特性 | static | relative | absolute | fixed | sticky |
| --- | --- | --- | --- | --- | --- |
| 是否脱离文档流 | ❌ 不脱离 | ❌ 不脱离 | ✅ 完全脱离 | ✅ 完全脱离 | ❌ 不脱离 |
| 定位参考点 | 正常文档流 | 自身原位置 | 最近非static祖先 | 浏览器视口 | 先自身后视口 |
| 是否占据空间 | ✅ 占据 | ✅ 占据 | ❌ 不占据 | ❌ 不占据 | ✅ 占据 |
| `top/left` 生效 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 滚动时是否移动 | ✅ 跟随滚动 | ✅ 跟随滚动 | ✅ 跟随祖先滚动 | ❌ 固定不动 | 到阈值后固定 |
| 使用频率 | 几乎不用 | 常用 | 非常常用 | 常用 | 越来越常用 |

---

## 8.5 新手常见误区

### 误区 1："absolute 是相对于 body 定位的"

**错！** 很多新手以为绝对定位是相对于 body 或者父元素定位的，其实不是。

正确的规则是：**相对于最近的、非 static 定位的祖先元素定位**。

- 如果父元素是 `relative` → 相对于父元素
- 如果父元素是 `static`，爷爷是 `relative` → 相对于爷爷
- 如果所有祖先都是 `static` → 相对于 `<html>`（整个文档）

**正确做法**：用 absolute 之前，先想想"我要相对于谁定位？"，然后给那个元素加上 `position: relative`。

---

### 误区 2："用 relative 来做布局"

**不对！** relative 只是微调位置用的，不是用来做整体布局的。

如果你发现自己写了很多 `position: relative` + 各种偏移量来布局，那说明你用错了。

**正确做法**：
- 整体布局 → 用 Flex 或 Grid
- 垂直水平居中 → 用 Flex 或 Grid
- 只有需要"脱离文档流"或者"作为 absolute 参考点"时，才用定位

---

### 误区 3："z-index 设得越大越好"

**错！** 很多新手一遇到元素被盖住，就疯狂加 z-index，从 999 加到 99999，最后代码里到处都是魔幻数字。

这样会导致：
- 层级混乱，谁在上谁在下完全搞不清
- 后期想加新的浮层，不知道 z-index 该设多少
- 不同组件的 z-index 冲突

**正确做法**：
- 给 z-index 分级，比如：弹窗 1000+，提示框 900+，导航栏 100+
- 用 CSS 变量统一管理，比如 `--z-modal: 1000`
- 能不用 z-index 就不用，思考一下是不是布局方式有问题

---

### 误区 4："sticky 不生效肯定是浏览器不支持"

**不一定！** sticky 不生效，90% 的情况不是浏览器的问题，而是你用错了。

常见原因：
1. 没设置 `top`（或者 `bottom`、`left`、`right`）→ sticky 必须有阈值
2. 父元素设置了 `overflow: hidden` → 会导致 sticky 失效
3. 父元素高度不够 → sticky 只能在父元素范围内"粘"

**正确做法**：
- 一定要设置 `top` 等偏移属性
- 检查父元素的 overflow 设置
- 确保父元素有足够的滚动空间

---

## 8.6 动手练习

### 练习 1：基础练习

创建一个产品卡片，使用相对定位和绝对定位实现右上角的"NEW"角标效果：

- 卡片有白色背景、圆角、阴影
- 右上角有一个红色的"NEW"角标
- 角标使用绝对定位

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习1：产品角标</title>
  <style>
    body {
      margin: 0;
      padding: 40px;
      background: #f5f5f5;
      font-family: Arial, sans-serif;
    }

    /* 产品卡片 - 父元素设置 relative */
    .product-card {
      position: relative;
      width: 250px;
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    /* NEW 角标 - 绝对定位 */
    .badge {
      position: absolute;
      top: -10px;
      right: -10px;
      background: #ff4757;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }

    .product-card h3 {
      margin: 0 0 8px 0;
      color: #333;
    }

    .product-card p {
      margin: 0 0 16px 0;
      color: #666;
      font-size: 14px;
    }

    .price {
      color: #ff4757;
      font-size: 20px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="product-card">
    <span class="badge">NEW</span>
    <h3>无线蓝牙耳机</h3>
    <p>主动降噪，超长续航</p>
    <div class="price">¥299</div>
  </div>
</body>
</html>
```

</details>

---

### 练习 2：进阶练习

实现一个固定在底部的操作栏，页面内容很多可以滚动：

- 顶部有正常的页面内容（高度足够滚动）
- 底部有一个固定的操作栏（"加入购物车"和"立即购买"按钮）
- 操作栏固定在视口底部，不随滚动移动
- 内容底部要留出操作栏的高度，避免被遮挡

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习2：固定底部操作栏</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
    }

    /* 商品详情内容 */
    .product-detail {
      padding-bottom: 70px; /* 底部留出操作栏的高度 */
    }

    .product-image {
      width: 100%;
      height: 300px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      font-size: 24px;
    }

    .product-info {
      padding: 20px;
      background: white;
    }

    .product-title {
      font-size: 18px;
      color: #333;
      margin-bottom: 8px;
    }

    .product-price {
      font-size: 24px;
      color: #ff4757;
      font-weight: bold;
      margin-bottom: 16px;
    }

    .product-desc {
      color: #666;
      font-size: 14px;
      line-height: 1.6;
    }

    .section {
      margin-top: 10px;
      padding: 20px;
      background: white;
    }

    .section h3 {
      font-size: 16px;
      margin-bottom: 12px;
    }

    /* 固定底部操作栏 */
    .bottom-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: white;
      display: flex;
      border-top: 1px solid #eee;
      z-index: 100;
    }

    .btn-cart {
      flex: 1;
      background: #ffa502;
      color: white;
      border: none;
      font-size: 16px;
      cursor: pointer;
    }

    .btn-buy {
      flex: 1;
      background: #ff4757;
      color: white;
      border: none;
      font-size: 16px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="product-detail">
    <div class="product-image">商品图片</div>
    
    <div class="product-info">
      <h1 class="product-title">超好用的无线蓝牙耳机 主动降噪 超长续航</h1>
      <div class="product-price">¥299</div>
      <p class="product-desc">
        采用最新降噪技术，续航长达30小时，佩戴舒适，音质出色。
        支持蓝牙5.0，连接稳定，延迟低。IPX5级防水，运动无忧。
      </p>
    </div>

    <div class="section">
      <h3>商品详情</h3>
      <p class="product-desc">
        这里是详细的商品介绍...（省略很多字）
      </p>
      <p style="height: 800px; background: #f9f9f9; display: flex; justify-content: center; align-items: center; color: #999;">
        更多内容，往下滚动~
      </p>
    </div>
  </div>

  <!-- 固定底部操作栏 -->
  <div class="bottom-bar">
    <button class="btn-cart">加入购物车</button>
    <button class="btn-buy">立即购买</button>
  </div>
</body>
</html>
```

</details>

---

### 练习 3（挑战）：综合练习

实现一个带有模态框（弹窗）的页面：

- 页面上有一个"打开弹窗"按钮
- 点击按钮弹出模态框（用 CSS 模拟，不用 JS）
- 模态框有半透明黑色遮罩
- 模态框内容居中显示
- 模态框右上角有关闭按钮
- 使用定位实现各种效果

提示：可以用 `:target` 伪类来模拟弹窗的显示/隐藏。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习3：模态框</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 40px;
    }

    .page-content {
      max-width: 600px;
      margin: 0 auto;
      text-align: center;
    }

    .open-btn {
      padding: 12px 32px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
    }

    .open-btn:hover {
      background: #0056b3;
    }

    /* ===== 模态框遮罩层 ===== */
    /* 默认隐藏 */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0; /* 等同于 top:0; right:0; bottom:0; left:0; */
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      justify-content: center;
      align-items: center;
    }

    /* 当URL锚点为modal时显示 */
    .modal-overlay:target {
      display: flex;
    }

    /* ===== 模态框内容 ===== */
    .modal {
      position: relative; /* 作为关闭按钮的参考点 */
      background: white;
      width: 90%;
      max-width: 500px;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    /* 关闭按钮 - 绝对定位在右上角 */
    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 32px;
      height: 32px;
      border: none;
      background: #f0f0f0;
      border-radius: 50%;
      cursor: pointer;
      font-size: 20px;
      color: #666;
      display: flex;
      justify-content: center;
      align-items: center;
      text-decoration: none;
    }

    .close-btn:hover {
      background: #e0e0e0;
    }

    .modal h2 {
      margin-bottom: 16px;
      color: #333;
    }

    .modal p {
      color: #666;
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .modal-footer {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn-cancel,
    .btn-confirm {
      padding: 10px 24px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
    }

    .btn-cancel {
      background: #f0f0f0;
      color: #333;
    }

    .btn-confirm {
      background: #007bff;
      color: white;
    }

    .btn-confirm:hover {
      background: #0056b3;
    }
  </style>
</head>
<body>
  <div class="page-content">
    <h1>模态框演示</h1>
    <p>点击下方按钮打开弹窗</p>
    <br>
    <a href="#modal" class="open-btn">打开弹窗</a>
  </div>

  <!-- 模态框 -->
  <div id="modal" class="modal-overlay">
    <div class="modal">
      <a href="#" class="close-btn">×</a>
      <h2>确认操作</h2>
      <p>你确定要执行这个操作吗？此操作不可撤销，请谨慎操作。</p>
      <div class="modal-footer">
        <a href="#" class="btn-cancel">取消</a>
        <a href="#" class="btn-confirm">确定</a>
      </div>
    </div>
  </div>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **响应式设计**——也就是让网页在手机、平板、电脑上都能好看的技术。你会学到媒体查询、移动优先、响应式单位等知识，掌握了响应式设计，你的网页就能适配各种设备了！
