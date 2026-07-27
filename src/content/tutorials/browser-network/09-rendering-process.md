---
title: "第九章：浏览器渲染流程"
description: "从 HTML 到屏幕：浏览器渲染的完整过程"
---

# 第九章：浏览器渲染流程

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 浏览器是怎么把我写的 HTML 变成页面上的内容的？
- 为什么有时候页面加载很慢，是哪里出了问题？
- 什么是重排和重绘？为什么会影响性能？
- 怎么优化才能让页面渲染更快？

这一章就是为了解答这些问题。我们会先搞清楚浏览器渲染的完整流程，再学习如何优化渲染性能。学完之后，你就能理解页面加载慢的原因，并知道怎么优化。

---

## 1 为什么需要了解渲染流程？

### 痛点分析

想象一下这个场景：你写了一个网页，代码看起来没问题，但打开浏览器一看，页面加载特别慢，用户等了好几秒才看到内容。你开始排查问题：

- 是网络太慢？
- 是代码写错了？
- 是图片太大？
- 还是浏览器的问题？

如果你不了解浏览器的渲染流程，就只能盲目猜测，到处优化，但不知道哪里才是瓶颈。

### 解决方案

了解渲染流程后，你就能像医生看病一样，精准定位问题：

- 如果是 HTML 解析慢，可能是 HTML 文件太大
- 如果是 CSS 阻塞渲染，可能是 CSS 文件太多
- 如果是 JavaScript 阻塞解析，可能是 JS 文件放错了位置
- 如果是重排太多，可能是频繁修改 DOM

打个比方：

> 浏览器渲染就像做菜。HTML 是食材清单，CSS 是菜谱，JavaScript 是厨师的操作。你需要先准备好食材（解析 HTML），再按照菜谱调味（应用 CSS），最后厨师开始炒菜（执行 JavaScript）。如果某个环节慢了，整道菜就慢了。

---

## 2 核心原理：渲染流程六步曲

浏览器把 HTML、CSS 和 JavaScript 转换成你看到的页面，需要经过 6 个步骤：

```
第一步：解析 HTML，构建 DOM 树
第二步：解析 CSS，构建 CSSOM 树
第三步：合并 DOM 和 CSSOM，构建渲染树
第四步：布局（Layout）：计算每个元素的位置和大小
第五步：绘制（Paint）：绘制元素的像素
第六步：合成（Composite）：把各层合成为最终画面
```

### 9.2.1 DOM 构建：解析 HTML

浏览器收到 HTML 后，会把它转换成 DOM 树。这个过程就像把一份清单转换成树形结构：

```html
<!-- 原始 HTML -->
<html>
  <head>
    <title>我的网页</title>
  </head>
  <body>
    <h1>标题</h1>
    <p>内容</p>
  </body>
</html>
```

转换成 DOM 树后：

```
html
├── head
│   └── title
└── body
    ├── h1
    └── p
```

**解析特点：**

- 增量解析：边接收边解析，不用等全部下载完
- 容错处理：自动修正错误标签（比如忘写闭合标签）
- 阻塞特性：遇到 `<script>` 标签会暂停解析，先执行 JavaScript

### 9.2.2 CSSOM 构建：解析 CSS

浏览器解析 CSS 文件，构建 CSSOM 树。CSSOM 记录了每个元素的样式规则：

```css
/* 原始 CSS */
h1 {
  color: red;
  font-size: 20px;
}

p {
  color: blue;
}
```

转换成 CSSOM 树后，浏览器就知道 h1 是红色、20px，p 是蓝色。

**重要特点：**

- 阻塞渲染：必须等 CSSOM 构建完成才能渲染页面
- 级联规则：多个样式规则会按优先级合并
- 继承机制：子元素会继承父元素的某些样式（比如字体颜色）

### 9.2.3 渲染树构建：合并 DOM 和 CSSOM

渲染树只包含需要显示的元素。DOM 树中的隐藏元素不会加入渲染树：

| 特性 | DOM 树 | 渲染树 |
| --- | --- | --- |
| 包含元素 | 所有元素 | 仅可见元素 |
| 隐藏元素 | 包含 | 不包含（display: none） |
| 样式信息 | 无 | 包含计算后的样式 |
| 用途 | 表示文档结构 | 用于渲染页面 |

**构建规则：**

- `display: none` 的元素不加入渲染树（完全隐藏）
- `visibility: hidden` 的元素会加入渲染树（占位但不可见）
- 伪元素（如 `::before`、`::after`）会加入渲染树

### 9.2.4 布局（Layout）：计算位置和大小

布局阶段会计算每个元素在页面中的确切位置和大小。就像装修房子时，需要确定每件家具的摆放位置：

**计算内容：**

| 属性 | 说明 | 示例 |
| --- | --- | --- |
| 位置 | 元素的坐标（x, y） | 距离左边 100px，距离顶部 50px |
| 大小 | 元素的宽度和高度 | 宽 200px，高 100px |
| 盒模型 | content、padding、border、margin | 内容区 200px，内边距 10px，边框 1px |

**布局算法：**

1. 普通流布局：块级元素垂直排列，行内元素水平排列
2. 浮动布局：元素脱离文档流，向左或向右浮动
3. 定位布局：根据 position 属性计算位置
4. Flexbox 布局：弹性盒子，一维布局
5. Grid 布局：网格布局，二维布局

### 9.2.5 绘制（Paint）：绘制像素

布局完成后，浏览器开始绘制元素的视觉内容。就像画家在画布上画画，按照一定顺序绘制：

**绘制顺序：**

1. 背景（background）
2. 边框（border）
3. 内容（content）
4. 轮廓（outline）
5. 阴影（shadow）

**层叠上下文：**

如果元素有 z-index 属性，会按照层叠顺序绘制：

- 底层：背景和边框
- 中层：浮动元素
- 顶层：定位元素（z-index 值大的在上面）

### 9.2.6 合成（Composite）：合并图层

现代浏览器会把页面分成多个图层，独立绘制后再合成。就像做 PPT，每一页是一个图层，最后合在一起播放：

| 层类型 | 触发条件 | 示例 |
| --- | --- | --- |
| 普通层 | 默认 | 普通 div |
| 提升层 | will-change、transform | 动画元素 |
| 视频层 | video 元素 | 视频播放器 |
| Canvas 层 | canvas 元素 | 画布 |

**合成优势：**

- 避免重绘：移动一个图层时，不需要重绘其他图层
- 硬件加速：GPU 处理合成，速度更快
- 动画优化：transform 和 opacity 动画只触发合成，不触发重排重绘

---

## 3 基础用法：优化渲染性能

了解了渲染流程后，我们来看看如何优化。

### 9.3.1 减少重排（Reflow）

重排是指布局发生变化，需要重新计算元素位置和大小。重排的成本很高，应该尽量避免：

```javascript
// 获取元素
const element = document.getElementById('box');

// 错误写法：频繁触发重排
element.style.width = '100px';      // 触发一次重排
element.style.height = '100px';     // 又触发一次重排
element.style.margin = '10px';      // 再触发一次重排

// 正确写法：批量修改样式
element.style.cssText += 'width: 100px; height: 100px; margin: 10px;';  // 只触发一次重排

// 更好的写法：使用 CSS 类
element.classList.add('new-style');  // 只触发一次重排

// 最佳写法：使用 transform（不触发重排）
element.style.transform = 'translateX(100px)';  // 只触发合成，性能最好
```

**触发重排的操作：**

| 操作类型 | 示例 |
| --- | --- |
| 几何属性变化 | width、height、margin、padding |
| 内容变化 | 文本长度改变、图片大小改变 |
| 窗口变化 | 浏览器大小调整、滚动 |
| 样式变化 | font-size、border |
| 读取几何属性 | offsetTop、clientWidth、scrollTop |

### 9.3.2 减少重绘（Repaint）

重绘是指外观变化但布局不变。重绘的成本比重排低，但也应该尽量避免：

```javascript
// 触发重绘的操作
element.style.color = 'red';           // 只触发重绘
element.style.background = 'blue';     // 只触发重绘
element.style.visibility = 'hidden';   // 只触发重绘

// 不触发重排重绘的操作（只触发合成）
element.style.transform = 'translateX(100px)';  // 只触发合成
element.style.opacity = 0.5;                     // 只触发合成
```

**触发重绘的操作：**

| 操作类型 | 示例 |
| --- | --- |
| 颜色变化 | color、background、border-color |
| 可见性 | visibility、outline |
| 文本装饰 | text-decoration |

### 9.3.3 优化动画性能

动画性能优化的关键是尽量只触发合成，避免重排重绘：

```javascript
// 错误写法：使用 left/top 做动画（触发重排）
element.style.left = '100px';  // 触发重排
element.style.top = '50px';    // 触发重排

// 正确写法：使用 transform 做动画（只触发合成）
element.style.transform = 'translate(100px, 50px)';  // 只触发合成

// 使用 will-change 提示浏览器优化
element.style.willChange = 'transform';  // 提示浏览器这个元素要变化
```

---

## 4 核心知识点总结

| 阶段 | 作用 | 阻塞特性 | 优化方法 |
| --- | --- | --- | --- |
| DOM 构建 | 解析 HTML | 被 script 阻塞 | 把 script 放底部，用 defer/async |
| CSSOM 构建 | 解析 CSS | 阻塞渲染 | 内联关键 CSS，异步加载非关键 CSS |
| 渲染树构建 | 合并 DOM 和 CSSOM | - | 减少 DOM 节点数量 |
| 布局 | 计算位置和大小 | - | 避免频繁触发重排 |
| 绘制 | 绘制像素 | - | 避免频繁触发重绘 |
| 合成 | 合并图层 | - | 使用 transform 和 opacity |

---

## 5 新手常见误区

### 误区 1："display: none 和 visibility: hidden 是一样的"

**错！** 它们有本质区别：

- `display: none`：元素完全不渲染，不占位，不在渲染树中
- `visibility: hidden`：元素不可见，但占位，在渲染树中

修改 `display` 会触发重排，修改 `visibility` 只触发重绘。

### 误区 2："频繁修改样式没问题"

**错！** 每次修改样式都可能触发重排或重绘。应该批量修改：

```javascript
// 错误写法
element.style.width = '100px';
element.style.height = '100px';

// 正确写法
element.style.cssText += 'width: 100px; height: 100px;';
// 或者
element.classList.add('my-class');
```

### 误区 3："transform 和 left/top 做动画效果一样"

**错！** 虽然视觉效果一样，但性能差别很大：

- `left/top`：触发重排，性能差
- `transform`：只触发合成，性能好，还能硬件加速

做动画时应该优先使用 transform。

### 误区 4："CSS 放在 head 或 body 都可以"

**错！** CSS 应该放在 head 中，因为：

- CSS 阻塞渲染，放在 head 可以尽早开始解析
- 放在 body 会导致页面闪烁（先显示无样式内容）

### 误区 5："JavaScript 放在 head 中没问题"

**错！** JavaScript 会阻塞 HTML 解析，应该：

- 把 script 标签放在 body 底部
- 或者使用 defer 属性（延迟执行）
- 或者使用 async 属性（异步执行）

---

## 6 动手练习

### 练习 1：基础练习

观察以下代码，判断哪些操作会触发重排，哪些会触发重绘：

```javascript
const box = document.getElementById('box');

// 操作 1
box.style.width = '200px';

// 操作 2
box.style.color = 'red';

// 操作 3
box.style.margin = '10px';

// 操作 4
box.style.background = 'blue';

// 操作 5
box.style.transform = 'translateX(100px)';
```

<details>
<summary>点击查看答案</summary>

- 操作 1：触发重排（修改了 width）
- 操作 2：触发重绘（修改了 color）
- 操作 3：触发重排（修改了 margin）
- 操作 4：触发重绘（修改了 background）
- 操作 5：只触发合成（transform 不触发重排重绘）

</details>

### 练习 2：进阶练习

优化以下代码，减少重排次数：

```javascript
const element = document.getElementById('myElement');

// 原始代码：触发 4 次重排
element.style.width = '100px';
element.style.height = '50px';
element.style.padding = '10px';
element.style.margin = '5px';
```

<details>
<summary>点击查看答案</summary>

```javascript
const element = document.getElementById('myElement');

// 优化方案 1：使用 cssText 批量修改（只触发 1 次重排）
element.style.cssText += 'width: 100px; height: 50px; padding: 10px; margin: 5px;';

// 优化方案 2：使用 CSS 类（推荐，只触发 1 次重排）
element.classList.add('optimized-style');

// 对应的 CSS
// .optimized-style {
//   width: 100px;
//   height: 50px;
//   padding: 10px;
//   margin: 5px;
// }
```

</details>

### 练习 3（挑战）：综合练习

有一个列表，点击按钮后需要给所有列表项添加动画效果。请优化以下代码，避免性能问题：

```javascript
// 原始代码：性能差
const items = document.querySelectorAll('.list-item');

items.forEach(item => {
  // 每个元素都触发重排
  item.style.left = '100px';
});
```

<details>
<summary>点击查看答案</summary>

```javascript
// 优化方案：使用 transform 和 will-change
const items = document.querySelectorAll('.list-item');

// 先提示浏览器这些元素要变化
items.forEach(item => {
  item.style.willChange = 'transform';
});

// 使用 transform 做动画（只触发合成）
items.forEach(item => {
  item.style.transform = 'translateX(100px)';
});

// 动画结束后移除 will-change
setTimeout(() => {
  items.forEach(item => {
    item.style.willChange = 'auto';
  });
}, 1000);

// 更好的方案：使用 CSS 类
items.forEach(item => {
  item.classList.add('animate');
});

// 对应的 CSS
// .list-item {
//   transition: transform 0.3s ease;
// }
// .list-item.animate {
//   transform: translateX(100px);
// }
```

</details>

---

## 下一章预告

下一章我们会学习 **HTTP/2 与 HTTP/3**——也就是现代 Web 的传输协议。你会学到 HTTP/1.1 的性能瓶颈，HTTP/2 的多路复用和头部压缩，以及 HTTP/3 基于 QUIC 协议的革命性改进。这些协议能让你的网站加载更快、性能更好。
