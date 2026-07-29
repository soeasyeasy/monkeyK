---
title: "第四章：CSS 样式操作"
description: "用 jQuery 动态修改元素样式、操作 class、计算尺寸"
---

# 第四章：CSS 样式操作

## 本章导读

在学这一章之前，你可能会有这些疑问：

- jQuery 中怎么修改元素的样式？
- css() 方法和直接操作 style 有什么区别？
- addClass() 和直接设置 style 哪个更好？

这一章就是为了解答这些问题。动态修改样式是前端开发中最常见的需求之一，jQuery 提供了优雅的方式来处理这些操作。

---

## 1 为什么需要 CSS 样式操作？

### 痛点分析

网页交互中，经常需要根据用户操作改变样式：

- 鼠标悬停时按钮变色
- 点击 tab 切换内容区域
- 滚动时导航栏固定在顶部
- 表单验证失败时输入框变红

这些都需要**动态操作 CSS 样式**。

### jQuery 的方案

jQuery 提供了两种方式操作样式：

1. **操作 class**（推荐）：通过添加/移除 class 来改变样式
2. **操作 css 属性**：直接修改内联样式

> **最佳实践**：优先使用 class 操作，把样式写在 CSS 文件中，JS 只负责切换 class。这样样式和逻辑分离，代码更好维护。

---

## 2 核心原理

### 两种方式的本质区别

```javascript
// 方式一：操作 class（推荐）
// 本质：修改元素的 class 属性，样式由 CSS 文件控制
$('#box').addClass('active')

// 方式二：操作 css 属性
// 本质：直接修改元素的内联 style 属性
$('#box').css('color', 'red')
```

打个比方：

> 操作 class 就像"换衣服"——你有很多套衣服（CSS 类），换一套就行。
> 操作 css 属性就像"现场裁缝"——直接在衣服上缝缝补补。

---

## 3 基础用法 + 逐行注释

### class 操作

```javascript
// ===== addClass() =====
// 添加一个或多个 class
$('#box').addClass('active')           // 添加一个 class
$('#box').addClass('active highlight') // 同时添加多个 class（空格分隔）

// ===== removeClass() =====
// 移除一个或多个 class
$('#box').removeClass('active')        // 移除一个 class
$('#box').removeClass('active highlight') // 移除多个 class
$('#box').removeClass()                // 不传参数，移除所有 class

// ===== toggleClass() =====
// 切换 class：有则移除，无则添加
$('#box').toggleClass('active')
// 如果 #box 有 active class，就移除它
// 如果 #box 没有 active class，就添加它

// ===== hasClass() =====
// 判断是否包含某个 class，返回 true 或 false
if ($('#box').hasClass('active')) {
  console.log('有 active class')
} else {
  console.log('没有 active class')
}
```

### css() 方法

```javascript
// ===== 获取样式 =====
// 获取元素的计算后样式（只读）
var color = $('#box').css('color')          // 获取 color 值
var fontSize = $('#box').css('font-size')   // 获取 font-size 值
console.log(color)    // 输出：rgb(255, 0, 0)
console.log(fontSize) // 输出：16px

// ===== 设置单个样式 =====
$('#box').css('color', 'red')
$('#box').css('font-size', '20px')
$('#box').css('background-color', '#f0f0f0')

// ===== 批量设置样式 =====
// 传入对象，一次设置多个样式
$('#box').css({
  'color': 'red',
  'font-size': '20px',
  'background-color': '#f0f0f0',
  'padding': '10px',
  'border': '1px solid #ccc'
})
```

### 尺寸操作

```javascript
// ===== width() / height() =====
// 获取或设置元素的宽高（不包含 padding、border、margin）
var w = $('#box').width()     // 获取宽度（数值，不带单位）
var h = $('#box').height()    // 获取高度
$('#box').width(200)          // 设置宽度为 200px
$('#box').height(100)         // 设置高度为 100px

// ===== innerWidth() / innerHeight() =====
// 包含 padding（不包含 border 和 margin）
var iw = $('#box').innerWidth()

// ===== outerWidth() / outerHeight() =====
// 包含 padding + border（默认不包含 margin）
var ow = $('#box').outerWidth()
// 传入 true 则包含 margin
var ow2 = $('#box').outerWidth(true)
```

### 尺寸对比表格

| 方法 | 包含内容 | 说明 |
| --- | --- | --- |
| `width()` | 仅 content | 内容区域宽度 |
| `innerWidth()` | content + padding | 内宽度 |
| `outerWidth()` | content + padding + border | 外宽度 |
| `outerWidth(true)` | content + padding + border + margin | 完整宽度 |

### 位置操作

```javascript
// ===== offset() =====
// 获取元素相对于文档（document）的偏移
var offset = $('#box').offset()
console.log(offset.top)   // 距离文档顶部的距离
console.log(offset.left)  // 距离文档左侧的距离

// ===== position() =====
// 获取元素相对于定位父元素的偏移
var pos = $('#box').position()
console.log(pos.top)   // 距离定位父元素顶部的距离
console.log(pos.left)  // 距离定位父元素左侧的距离

// ===== scrollTop() / scrollLeft() =====
// 获取或设置元素的滚动距离
var scrollTop = $(window).scrollTop()   // 页面滚动条距顶部的距离
$(window).scrollTop(0)                  // 滚动到顶部
```

---

## 4 新手常见误区

### 误区 1："css() 获取的值和设置值的格式一样"

**不一样！** 获取时返回带单位的字符串，设置时可以传数字或字符串。

```javascript
// 设置时可以传数字（自动加 px）
$('#box').css('width', 200)  // 等同于 200px

// 获取时返回字符串
var w = $('#box').css('width')
console.log(w)  // 输出："200px"（字符串）

// 如果需要做数学运算，要先转为数字
var numW = parseInt($('#box').css('width'))
console.log(numW + 50)  // 250
```

### 误区 2："addClass() 会覆盖原来的 class"

**不会！** `addClass()` 是追加，不是替换。

```javascript
// 假设 #box 原来有 class="box"
$('#box').addClass('active')
// 结果：class="box active"（追加了 active）

// ❌ 错误理解：以为会变成 class="active"
```

### 误区 3："toggleClass() 只能传一个 class"

**可以传多个！** 用空格分隔。

```javascript
// ✅ 正确：同时切换多个 class
$('#box').toggleClass('active highlight big')
```

---

## 5 动手练习

### 练习 1：基础练习

创建一个 div 和三个按钮，分别点击按钮时：添加 class "red"（红色背景）、添加 class "big"（大字体）、切换 class "border"（边框）。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    /* 定义三个样式类 */
    .red { background-color: red; color: white; }
    .big { font-size: 30px; }
    .border { border: 3px solid blue; }
    #box { width: 200px; height: 100px; margin: 10px; transition: all 0.3s; }
  </style>
</head>
<body>
  <div id="box">样式盒子</div>
  <!-- 三个控制按钮 -->
  <button id="btnRed">变红</button>
  <button id="btnBig">变大</button>
  <button id="btnBorder">切换边框</button>

  <script>
    $(function() {
      // 点击"变红"按钮，添加 red class
      $('#btnRed').click(function() {
        $('#box').addClass('red')
      })

      // 点击"变大"按钮，添加 big class
      $('#btnBig').click(function() {
        $('#box').addClass('big')
      })

      // 点击"切换边框"按钮，切换 border class
      $('#btnBorder').click(function() {
        $('#box').toggleClass('border')
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 2：进阶练习

实现一个 Tab 切换效果：有三个 tab 按钮和三个内容区域，点击 tab 按钮时，对应的内容区域显示，其他隐藏，同时当前 tab 按钮高亮。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    /* tab 按钮样式 */
    .tab-btn { padding: 10px 20px; cursor: pointer; border: 1px solid #ccc; }
    /* 当前激活的 tab 按钮样式 */
    .tab-btn.active { background-color: #007bff; color: white; }
    /* 内容区域样式 */
    .tab-content { display: none; padding: 20px; border: 1px solid #ccc; }
    /* 当前显示的内容区域 */
    .tab-content.active { display: block; }
  </style>
</head>
<body>
  <!-- tab 按钮组 -->
  <div>
    <button class="tab-btn active" data-index="0">Tab 1</button>
    <button class="tab-btn" data-index="1">Tab 2</button>
    <button class="tab-btn" data-index="2">Tab 3</button>
  </div>
  <!-- 内容区域 -->
  <div class="tab-content active">内容 1</div>
  <div class="tab-content">内容 2</div>
  <div class="tab-content">内容 3</div>

  <script>
    $(function() {
      // 给所有 tab 按钮绑定点击事件
      $('.tab-btn').click(function() {
        // 获取当前按钮的 data-index 属性值
        var index = $(this).data('index')

        // 移除所有按钮的 active class
        $('.tab-btn').removeClass('active')
        // 给当前按钮添加 active class
        $(this).addClass('active')

        // 隐藏所有内容区域
        $('.tab-content').removeClass('active')
        // 显示对应索引的内容区域
        // .eq(index) 选择索引为 index 的元素
        $('.tab-content').eq(index).addClass('active')
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习

实现一个"回到顶部"按钮：页面滚动超过 300px 时显示按钮，点击按钮平滑滚动回顶部。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    body { height: 3000px; } /* 让页面足够长以产生滚动 */
    /* 回到顶部按钮样式 */
    #backTop {
      position: fixed;
      bottom: 50px;
      right: 50px;
      width: 50px;
      height: 50px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: none; /* 默认隐藏 */
      font-size: 14px;
    }
  </style>
</head>
<body>
  <h1>向下滚动页面...</h1>
  <!-- 回到顶部按钮 -->
  <button id="backTop">顶部</button>

  <script>
    $(function() {
      // 监听窗口滚动事件
      $(window).scroll(function() {
        // 获取当前滚动距离
        var scrollTop = $(window).scrollTop()

        // 如果滚动距离超过 300px，显示按钮；否则隐藏
        if (scrollTop > 300) {
          $('#backTop').fadeIn()   // 淡入显示
        } else {
          $('#backTop').fadeOut()  // 淡出隐藏
        }
      })

      // 点击回到顶部按钮
      $('#backTop').click(function() {
        // 使用 animate 方法实现平滑滚动
        // 将 body 和 html 的 scrollTop 动画到 0
        $('html, body').animate({
          scrollTop: 0  // 滚动到顶部
        }, 500)          // 动画时长 500 毫秒
      })
    })
  </script>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **事件处理基础** —— jQuery 中如何绑定事件、处理事件对象、利用事件冒泡和事件委托。事件是交互的核心，掌握了事件处理，你的网页就能"动"起来了。
