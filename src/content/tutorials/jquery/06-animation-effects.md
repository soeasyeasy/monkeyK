---
title: "第六章：动画效果"
description: "掌握 jQuery 动画方法，让页面元素动起来"
---

# 第六章：动画效果

## 本章导读

在学这一章之前，你可能会有这些疑问：

- jQuery 中怎么做动画效果？
- 为什么我的动画看起来生硬不自然？
- 怎么控制动画的速度和回调？

这一章就是为了解答这些问题。动画能让网页更生动、交互更友好。jQuery 提供了丰富的动画方法，让你轻松实现各种视觉效果。

---

## 1 为什么需要动画效果？

### 痛点分析

没有动画的网页就像没有表情的脸，虽然能表达内容，但缺乏生命力：

- 元素突然出现/消失，用户感觉突兀
- 页面切换没有过渡，体验生硬
- 操作反馈不及时，用户不知道发生了什么
- 视觉层次不清晰，重点不突出

### 生活化类比

> 动画就像电影里的转场效果。
> 没有转场，场景直接切换会让观众懵圈；
> 有了淡入淡出、推拉摇移，观众就能自然理解"哦，场景变了"。
> 网页动画也是同样的道理——引导用户注意力，让交互更流畅。

### jQuery 的方案

jQuery 内置了常用的动画方法，不需要写复杂的 CSS 或 JavaScript 定时器，一行代码就能实现动画效果。

---

## 2 核心原理

### 动画的本质

所有动画的本质都是**在一段时间内连续改变元素的某个属性值**。

打个比方：

> 动画就像翻书。
> 每一页画面略有不同，快速翻动时就看起来"动"了。
> jQuery 的动画方法就是帮你自动"翻页"——它会在指定时间内，把属性值从起始值逐渐变化到目标值。

### 动画三要素

1. **要改变的属性**：比如高度、透明度、位置
2. **动画时长**：变化过程持续多久
3. **缓动效果**：变化的速度曲线（匀速、先快后慢等）

```javascript
// 动画的基本公式
$(元素).animate({ 属性: 目标值 }, 时长, 缓动函数, 回调函数)
```

---

## 3 基础用法 + 逐行注释

### 显示/隐藏动画

```javascript
// ===== show() / hide() =====
// 同时改变宽度、高度、透明度，实现显示/隐藏效果
$('#box').show()        // 显示元素（默认无动画，直接显示）
$('#box').show(500)     // 500 毫秒内动画显示
$('#box').show('slow')  // 慢速显示（600 毫秒）
$('#box').show('fast')  // 快速显示（200 毫秒）

$('#box').hide()        // 隐藏元素（默认无动画）
$('#box').hide(500)     // 500 毫秒内动画隐藏
$('#box').hide('slow')  // 慢速隐藏

// ===== toggle() =====
// 切换显示/隐藏状态
$('#box').toggle()      // 如果显示就隐藏，如果隐藏就显示
$('#box').toggle(500)   // 带动画的切换

// 生活化理解：
// show() 就像拉开窗帘，让光线进来
// hide() 就像拉上窗帘，把光线挡住
// toggle() 就像窗帘开关，按一下切换状态
```

### 淡入/淡出动画

```javascript
// ===== fadeIn() / fadeOut() =====
// 只改变透明度，实现淡入淡出效果
$('#box').fadeIn()        // 淡入显示（从透明到不透明）
$('#box').fadeIn(500)     // 500 毫秒淡入
$('#box').fadeIn('slow')  // 慢速淡入

$('#box').fadeOut()       // 淡出隐藏（从不透明到透明）
$('#box').fadeOut(500)    // 500 毫秒淡出

// ===== fadeToggle() =====
// 切换淡入/淡出状态
$('#box').fadeToggle()    // 如果显示就淡出，如果隐藏就淡入
$('#box').fadeToggle(500) // 带时长的切换

// ===== fadeTo() =====
// 淡到指定的透明度（不完全显示或隐藏）
$('#box').fadeTo(500, 0.5)  // 500 毫秒内淡到 50% 透明度
$('#box').fadeTo('slow', 0.3) // 慢速淡到 30% 透明度

// 生活化理解：
// fadeIn 就像天亮了，光线慢慢变强
// fadeOut 就像天黑了，光线慢慢变弱
// fadeTo 就像调光台灯，可以调到任意亮度
```

### 滑动动画

```javascript
// ===== slideDown() / slideUp() =====
// 改变高度，实现滑动效果
$('#box').slideDown()      // 向下滑出（高度从 0 到原始高度）
$('#box').slideDown(500)   // 500 毫秒滑出
$('#box').slideDown('slow') // 慢速滑出

$('#box').slideUp()        // 向上滑入（高度从原始高度到 0）
$('#box').slideUp(500)     // 500 毫秒滑入

// ===== slideToggle() =====
// 切换滑动状态
$('#box').slideToggle()    // 如果显示就滑入，如果隐藏就滑出
$('#box').slideToggle(500) // 带时长的切换

// 生活化理解：
// slideDown 就像卷帘门慢慢放下
// slideUp 就像卷帘门慢慢升起
// slideToggle 就像卷帘门开关
```

### 自定义动画 animate()

```javascript
// ===== animate() 方法 =====
// 可以自定义任意 CSS 属性的动画
// 语法：$(元素).animate({ 属性: 目标值 }, 时长, 缓动函数, 回调)

// 示例 1：移动元素位置
$('#box').animate({
  left: '200px',    // 向左移动 200px（需要元素有 position: relative/absolute）
  top: '100px'      // 向下移动 100px
}, 1000)             // 动画时长 1000 毫秒（1 秒）

// 示例 2：改变尺寸
$('#box').animate({
  width: '300px',   // 宽度变为 300px
  height: '200px',  // 高度变为 200px
  opacity: 0.5      // 透明度变为 50%
}, 500)              // 500 毫秒完成

// 示例 3：链式调用多个动画（会按顺序执行）
$('#box')
  .animate({ left: '200px' }, 500)   // 先向右移动
  .animate({ top: '100px' }, 500)    // 再向下移动
  .animate({ opacity: 0.5 }, 500)    // 最后变透明

// 示例 4：使用回调函数
$('#box').animate({
  left: '200px'
}, 500, function() {
  // 动画完成后执行的代码
  console.log('动画完成了！')
  // 可以在这里触发下一个动画或其他操作
})

// 示例 5：缓动函数
// 'swing'：先慢后快再慢（默认）
// 'linear'：匀速
$('#box').animate({ left: '200px' }, 500, 'swing')   // 默认缓动
$('#box').animate({ left: '200px' }, 500, 'linear')  // 匀速
```

### 停止动画和延迟

```javascript
// ===== stop() 方法 =====
// 停止当前正在执行的动画
$('#box').stop()           // 停止当前动画，跳到终点
$('#box').stop(true)       // 清除动画队列，停止当前动画
$('#box').stop(true, true) // 清除队列，跳到当前动画终点

// ===== delay() 方法 =====
// 在动画队列中插入延迟
$('#box')
  .delay(500)              // 延迟 500 毫秒
  .fadeIn(500)             // 然后淡入

// 链式调用中的延迟
$('#box')
  .slideDown(500)          // 先滑出
  .delay(1000)             // 等待 1 秒
  .fadeOut(500)            // 再淡入

// ===== finish() 方法 =====
// 立即完成所有动画（jQuery 1.9+）
$('#box').finish()         // 跳到所有动画的终点
```

### 全局设置

```javascript
// ===== $.fx 全局配置 =====
// 关闭所有动画效果（适合调试或性能敏感场景）
$.fx.off = true   // 所有动画立即完成，没有过渡效果

// 恢复动画效果
$.fx.off = false

// 修改默认动画时长
$.fx.speeds.slow = 800    // 慢速改为 800ms（默认 600ms）
$.fx.speeds.fast = 100    // 快速改为 100ms（默认 200ms）
$.fx.speeds._default = 400 // 默认时长改为 400ms（默认 400ms）
```

---

## 4 对比表格

### 常用动画方法对比

| 方法 | 效果 | 改变的属性 | 适用场景 |
| --- | --- | --- | --- |
| `show()` / `hide()` | 显示/隐藏 | 宽度、高度、透明度 | 元素整体出现/消失 |
| `fadeIn()` / `fadeOut()` | 淡入/淡出 | 仅透明度 | 柔和的显示/隐藏 |
| `slideDown()` / `slideUp()` | 滑动 | 高度 | 下拉菜单、折叠面板 |
| `animate()` | 自定义 | 任意数值型 CSS 属性 | 复杂动画、位移、旋转 |
| `fadeTo()` | 淡到指定透明度 | 透明度 | 半透明效果 |
| `toggle()` | 切换显示/隐藏 | 同 show/hide | 开关效果 |

### 动画时长参数

| 参数 | 时长 | 说明 |
| --- | --- | --- |
| `'slow'` | 600ms | 慢速 |
| `'fast'` | 200ms | 快速 |
| `400` | 400ms | 默认时长（不传参数时） |
| `1000` | 1000ms | 自定义时长（单位毫秒） |

### 缓动函数对比

| 函数 | 速度曲线 | 视觉效果 |
| --- | --- | --- |
| `'swing'` | 先慢后快再慢 | 自然、柔和（默认） |
| `'linear'` | 匀速 | 机械、生硬 |

---

## 5 新手常见误区

### 误区 1："animate() 可以动画任意 CSS 属性"

**不是！** 只有数值型属性才能动画，颜色、字符串不行。

```javascript
// ✅ 正确：数值型属性可以动画
$('#box').animate({
  left: '200px',      // 可以
  width: '300px',     // 可以
  opacity: 0.5,       // 可以
  fontSize: '20px'    // 可以
}, 500)

// ❌ 错误：非数值型属性不能动画
$('#box').animate({
  backgroundColor: 'red',  // 不行！颜色不能直接动画
  display: 'block',        // 不行！display 不能动画
  margin: '10px 20px'      // 不行！多值属性不能动画
}, 500)

// ✅ 正确做法：颜色动画需要 jQuery UI 或 CSS 过渡
// 方法一：使用 CSS 过渡
$('#box').css({
  transition: 'background-color 0.5s',
  backgroundColor: 'red'
})

// 方法二：使用 jQuery UI（扩展了 animate 支持颜色）
$('#box').animate({
  backgroundColor: 'red'  // 需要引入 jQuery UI
}, 500)
```

### 误区 2："动画会阻塞代码执行"

**不会！** jQuery 动画是异步的，代码会继续执行。

```javascript
// ❌ 错误理解：以为动画会阻塞后续代码
$('#box').fadeIn(1000)  // 开始淡入动画
console.log('动画开始了') // 立即执行，不会等动画完成
$('#box').css('color', 'red') // 立即执行，不会等动画完成

// ✅ 正确理解：使用回调函数等待动画完成
$('#box').fadeIn(1000, function() {
  // 这个回调在动画完成后执行
  console.log('动画完成了')
  $('#box').css('color', 'red') // 动画完成后才变色
})

// 或者使用 Promise（jQuery 1.6+）
$('#box').fadeIn(1000).promise().done(function() {
  console.log('动画完成了')
})
```

### 误区 3："多次点击会导致动画队列堆积"

**会！** 如果不处理，动画会一个接一个执行，看起来很奇怪。

```javascript
// ❌ 错误：快速点击按钮，动画会堆积
$('#btn').on('click', function() {
  $('#box').slideToggle(500)
})
// 快速点击 5 次，会看到元素反复滑动 5 次

// ✅ 正确：在开始新动画前停止当前动画
$('#btn').on('click', function() {
  $('#box').stop().slideToggle(500)
})
// stop() 会清除动画队列，只执行最新的动画

// 或者使用 stop(true) 清除所有队列
$('#btn').on('click', function() {
  $('#box').stop(true).slideToggle(500)
})
```

### 误区 4："动画元素必须有 position 属性"

**注意！** 使用 `left`、`top`、`right`、`bottom` 做位移动画时，元素必须有定位。

```javascript
// ❌ 错误：元素没有 position，left/top 动画无效
$('#box').animate({
  left: '200px'  // 不会生效，因为 #box 默认 position: static
}, 500)

// ✅ 正确：先设置 position 为 relative/absolute/fixed
$('#box').css('position', 'relative')  // 或 absolute
$('#box').animate({
  left: '200px'  // 现在可以正常移动了
}, 500)

// 或者在 CSS 中提前设置
// #box { position: relative; }
```

### 误区 5："动画时长越长效果越好"

**不是！** 过长的动画会让用户觉得卡顿、不耐烦。

```javascript
// ❌ 错误：动画时间过长
$('#box').fadeIn(3000)  // 3 秒太慢了，用户会以为卡住了

// ✅ 正确：选择合适的时长
// 提示框、下拉菜单：200-300ms（快速响应）
$('#tooltip').fadeIn(200)

// 页面转场、模态框：300-500ms（中等速度）
$('#modal').fadeIn(400)

// 强调性动画、引导动画：500-1000ms（慢速吸引注意）
$('#feature').animate({ left: '200px' }, 800)
```

---

## 6 动手练习

### 练习 1：基础练习 - 淡入淡出图片

创建一个包含 3 张图片的画廊，点击缩略图时，对应的大图淡入显示，其他图片淡出隐藏。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    /* 缩略图容器 */
    .thumbnails {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
    /* 缩略图样式 */
    .thumbnails img {
      width: 100px;
      height: 100px;
      cursor: pointer;
      border: 2px solid transparent;
      object-fit: cover;
    }
    /* 当前选中的缩略图边框 */
    .thumbnails img.active {
      border-color: #007bff;
    }
    /* 大图容器 */
    .main-image {
      width: 400px;
      height: 400px;
      position: relative;
    }
    /* 大图样式 */
    .main-image img {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      display: none; /* 默认隐藏 */
      object-fit: cover;
    }
  </style>
</head>
<body>
  <!-- 缩略图列表 -->
  <div class="thumbnails">
    <img src="https://via.placeholder.com/100/ff0000/ffffff?text=1" data-index="0" class="active">
    <img src="https://via.placeholder.com/100/00ff00/ffffff?text=2" data-index="1">
    <img src="https://via.placeholder.com/100/0000ff/ffffff?text=3" data-index="2">
  </div>
  <!-- 大图展示区 -->
  <div class="main-image">
    <img src="https://via.placeholder.com/400/ff0000/ffffff?text=Image+1" data-index="0" style="display: block;">
    <img src="https://via.placeholder.com/400/00ff00/ffffff?text=Image+2" data-index="1">
    <img src="https://via.placeholder.com/400/0000ff/ffffff?text=Image+3" data-index="2">
  </div>

  <script>
    $(function() {
      // 给所有缩略图绑定点击事件
      $('.thumbnails img').on('click', function() {
        // 获取当前点击的缩略图索引
        var index = $(this).data('index')

        // 移除所有缩略图的 active class
        $('.thumbnails img').removeClass('active')
        // 给当前缩略图添加 active class
        $(this).addClass('active')

        // 淡出所有大图
        $('.main-image img').fadeOut(300)

        // 淡入对应索引的大图
        // .eq(index) 选择索引为 index 的元素
        $('.main-image img').eq(index).fadeIn(300)
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 2：进阶练习 - 手风琴菜单

实现一个手风琴菜单效果：有多个菜单项，点击某个菜单项时，它的内容区域滑出显示，其他菜单项的内容区域滑入隐藏。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    /* 菜单容器 */
    .accordion {
      width: 400px;
      border: 1px solid #ccc;
    }
    /* 菜单标题 */
    .accordion-header {
      padding: 15px;
      background-color: #f0f0f0;
      cursor: pointer;
      border-bottom: 1px solid #ccc;
      font-weight: bold;
    }
    /* 当前激活的菜单标题 */
    .accordion-header.active {
      background-color: #007bff;
      color: white;
    }
    /* 菜单内容区域 */
    .accordion-content {
      padding: 15px;
      display: none; /* 默认隐藏 */
      border-bottom: 1px solid #ccc;
    }
  </style>
</head>
<body>
  <!-- 手风琴菜单 -->
  <div class="accordion">
    <div class="accordion-header active">第一章：jQuery 简介</div>
    <div class="accordion-content" style="display: block;">
      jQuery 是一个快速、简洁的 JavaScript 库...
    </div>

    <div class="accordion-header">第二章：选择器</div>
    <div class="accordion-content">
      jQuery 选择器用于查找页面元素...
    </div>

    <div class="accordion-header">第三章：DOM 操作</div>
    <div class="accordion-content">
      jQuery 提供了丰富的 DOM 操作方法...
    </div>

    <div class="accordion-header">第四章：事件处理</div>
    <div class="accordion-content">
      事件是用户与网页交互的核心...
    </div>
  </div>

  <script>
    $(function() {
      // 给所有菜单标题绑定点击事件
      $('.accordion-header').on('click', function() {
        // 获取当前点击的标题索引
        var index = $(this).index()

        // 移除所有标题的 active class
        $('.accordion-header').removeClass('active')
        // 给当前标题添加 active class
        $(this).addClass('active')

        // 滑入所有内容区域
        $('.accordion-content').slideUp(300)

        // 滑出对应索引的内容区域
        $('.accordion-content').eq(index).slideDown(300)
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习 - 轮播图

实现一个自动轮播的图片轮播组件：图片每隔 3 秒自动切换，支持左右箭头手动切换，支持点击指示器跳转到指定图片。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    /* 轮播图容器 */
    .carousel {
      width: 600px;
      height: 400px;
      position: relative;
      overflow: hidden;
      margin: 0 auto;
    }
    /* 图片列表 */
    .carousel-images {
      width: 100%;
      height: 100%;
      position: relative;
    }
    /* 单张图片 */
    .carousel-images img {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      display: none;
      object-fit: cover;
    }
    /* 左右箭头 */
    .carousel-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 40px;
      height: 40px;
      background-color: rgba(0, 0, 0, 0.5);
      color: white;
      border: none;
      cursor: pointer;
      font-size: 20px;
      z-index: 10;
    }
    /* 左箭头位置 */
    .carousel-arrow.prev {
      left: 10px;
    }
    /* 右箭头位置 */
    .carousel-arrow.next {
      right: 10px;
    }
    /* 指示器容器 */
    .carousel-indicators {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      z-index: 10;
    }
    /* 单个指示器 */
    .carousel-indicators span {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.5);
      cursor: pointer;
    }
    /* 当前激活的指示器 */
    .carousel-indicators span.active {
      background-color: white;
    }
  </style>
</head>
<body>
  <!-- 轮播图结构 -->
  <div class="carousel">
    <!-- 图片列表 -->
    <div class="carousel-images">
      <img src="https://via.placeholder.com/600x400/ff0000/ffffff?text=Slide+1" style="display: block;">
      <img src="https://via.placeholder.com/600x400/00ff00/ffffff?text=Slide+2">
      <img src="https://via.placeholder.com/600x400/0000ff/ffffff?text=Slide+3">
      <img src="https://via.placeholder.com/600x400/ffff00/000000?text=Slide+4">
    </div>

    <!-- 左右箭头 -->
    <button class="carousel-arrow prev">&lt;</button>
    <button class="carousel-arrow next">&gt;</button>

    <!-- 指示器 -->
    <div class="carousel-indicators">
      <span class="active" data-index="0"></span>
      <span data-index="1"></span>
      <span data-index="2"></span>
      <span data-index="3"></span>
    </div>
  </div>

  <script>
    $(function() {
      // 当前显示的图片索引
      var currentIndex = 0
      // 图片总数
      var totalImages = $('.carousel-images img').length
      // 自动轮播定时器
      var autoPlayTimer

      // 切换到指定索引的图片
      function showImage(index) {
        // 淡出当前图片
        $('.carousel-images img').eq(currentIndex).fadeOut(500)
        // 淡入目标图片
        $('.carousel-images img').eq(index).fadeIn(500)

        // 更新指示器状态
        $('.carousel-indicators span').removeClass('active')
        $('.carousel-indicators span').eq(index).addClass('active')

        // 更新当前索引
        currentIndex = index
      }

      // 自动轮播函数
      function autoPlay() {
        // 计算下一张图片索引（循环）
        var nextIndex = (currentIndex + 1) % totalImages
        showImage(nextIndex)
      }

      // 启动自动轮播
      function startAutoPlay() {
        autoPlayTimer = setInterval(autoPlay, 3000) // 每 3 秒切换
      }

      // 停止自动轮播
      function stopAutoPlay() {
        clearInterval(autoPlayTimer)
      }

      // 右箭头点击：显示下一张
      $('.carousel-arrow.next').on('click', function() {
        var nextIndex = (currentIndex + 1) % totalImages
        showImage(nextIndex)
        // 重新开始自动轮播
        stopAutoPlay()
        startAutoPlay()
      })

      // 左箭头点击：显示上一张
      $('.carousel-arrow.prev').on('click', function() {
        // 计算上一张图片索引（循环）
        var prevIndex = (currentIndex - 1 + totalImages) % totalImages
        showImage(prevIndex)
        // 重新开始自动轮播
        stopAutoPlay()
        startAutoPlay()
      })

      // 指示器点击：跳转到指定图片
      $('.carousel-indicators span').on('click', function() {
        var index = $(this).data('index')
        showImage(index)
        // 重新开始自动轮播
        stopAutoPlay()
        startAutoPlay()
      })

      // 鼠标进入轮播图时停止自动轮播
      $('.carousel').on('mouseenter', function() {
        stopAutoPlay()
      })

      // 鼠标离开轮播图时启动自动轮播
      $('.carousel').on('mouseleave', function() {
        startAutoPlay()
      })

      // 页面加载后启动自动轮播
      startAutoPlay()
    })
  </script>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **jQuery Ajax 操作** —— 如何与服务器进行数据交互。你会学到如何用 `$.ajax()`、`$.get()`、`$.post()` 发送请求，如何处理返回的数据，以及如何实现无刷新更新页面内容。掌握了 Ajax，你的网页就能从服务器获取动态数据，变成真正的 Web 应用。
