---
title: "第六章：动画与效果"
description: "用 jQuery 创建丰富的动画效果，让页面生动起来"
---

# 第六章：动画与效果

## 本章导读

在学这一章之前，你可能会有这些疑问：

- jQuery 内置了哪些动画方法？
- 怎么创建自定义动画？
- 多个动画怎么按顺序执行？

这一章就是为了解答这些问题。动画能让网页交互更加生动，jQuery 提供了从简单到复杂的全套动画方案。

---

## 1 为什么需要动画？

### 痛点分析

没有动画的页面是"僵硬"的——元素突然出现、突然消失，用户体验很差。

动画的价值：
- 让交互更自然（过渡而不是突变）
- 引导用户注意力（动起来的元素更吸引眼球）
- 提供反馈（操作后有视觉响应）

### jQuery 的方案

jQuery 内置了丰富的动画方法，不需要你手动写 CSS 动画或 JavaScript 定时器。

```javascript
// 一行代码实现淡入效果
$('#box').fadeIn()

// 一行代码实现滑动展开
$('#box').slideDown()

// 自定义动画
$('#box').animate({ left: 200, opacity: 0.5 }, 1000)
```

> **一句话总结**：jQuery 把复杂的动画逻辑封装成了简单的方法调用。

---

## 2 核心原理

### jQuery 动画的原理

jQuery 动画的底层原理是：

1. 使用 `setInterval` 或 `requestAnimationFrame` 定时执行
2. 每帧修改元素的 CSS 属性值
3. 从初始值逐步变化到目标值
4. 达到目标值后停止

打个比方：

> 就像翻页动画书——每一页画面稍有变化，快速翻页就看到了动画效果。
> jQuery 就是帮你自动"翻页"的机器。

---

## 3 基础用法 + 逐行注释

### 显示/隐藏动画

```javascript
// ===== show() / hide() =====
// 同时改变宽高和透明度
$('#box').hide()          // 隐藏（宽高变为 0，透明度变为 0）
$('#box').show()          // 显示（恢复到原来的大小）

// 可以传入速度参数
$('#box').hide(500)       // 500 毫秒内隐藏
$('#box').show('slow')    // 慢速显示（600ms）
$('#box').show('fast')    // 快速显示（200ms）

// 可以传入回调函数（动画完成后执行）
$('#box').hide(500, function() {
  console.log('隐藏完成')
})

// ===== toggle() =====
// 切换显示/隐藏状态
$('#box').toggle()
// 如果当前可见，就隐藏
// 如果当前隐藏，就显示
```

### 滑动动画

```javascript
// ===== slideDown() / slideUp() =====
// 从上往下展开 / 从下往上收起
$('#box').slideDown()     // 向下滑动展开
$('#box').slideUp()       // 向上滑动收起

// 带速度和回调
$('#box').slideDown(500, function() {
  console.log('展开完成')
})

// ===== slideToggle() =====
// 切换滑动状态
$('#box').slideToggle()
// 如果当前可见，就 slideUp
// 如果当前隐藏，就 slideDown
```

### 淡入淡出动画

```javascript
// ===== fadeIn() / fadeOut() =====
// 通过改变透明度实现显示/隐藏
$('#box').fadeIn()        // 淡入（透明度从 0 到 1）
$('#box').fadeOut()       // 淡出（透明度从 1 到 0）

// ===== fadeToggle() =====
// 切换淡入/淡出
$('#box').fadeToggle()

// ===== fadeTo() =====
// 淡到指定的透明度
$('#box').fadeTo(500, 0.5)  // 500ms 内淡到 50% 透明
```

### 自定义动画 animate()

```javascript
// ===== animate() 基础用法 =====
// 第一个参数：要变化的 CSS 属性和目标值（对象）
// 第二个参数：动画时长（毫秒或字符串）
// 第三个参数：缓动函数（swing 或 linear）
// 第四个参数：动画完成后的回调函数

$('#box').animate({
  left: '200px',      // 向右移动 200px
  top: '100px',       // 向下移动 100px
  width: '300px',     // 宽度变为 300px
  opacity: 0.5        // 透明度变为 0.5
}, 1000, 'swing', function() {
  console.log('动画完成')
})

// ===== 注意事项 =====
// ✅ 可以动画的属性：数值型属性（left、top、width、opacity...）
// ❌ 不能动画的属性：颜色（需要额外插件）、非数值属性

// ✅ 使用 += 或 -= 做相对变化
$('#box').animate({
  left: '+=100px'     // 在当前位置基础上向右移动 100px
}, 500)
```

### 动画队列

```javascript
// jQuery 会自动把同一元素的多个动画排成队列，按顺序执行
$('#box')
  .animate({ left: 200 }, 500)    // 第一步：向右移动
  .animate({ top: 100 }, 500)     // 第二步：向下移动
  .animate({ opacity: 0 }, 500)   // 第三步：淡出

// ===== 控制队列 =====
// stop()：停止当前动画
$('#box').stop()           // 停止当前动画，继续下一个
$('#box').stop(true)       // 停止当前动画，清除队列
$('#box').stop(true, true) // 停止当前动画并跳到终态，清除队列

// delay()：在队列中插入延迟
$('#box')
  .animate({ left: 200 }, 500)  // 向右移动
  .delay(1000)                    // 等待 1 秒
  .animate({ left: 0 }, 500)    // 回到原位

// finish()：立即完成所有动画
$('#box').finish()
```

---

## 4 对比表格

| 方法 | 效果 | 参数 |
| --- | --- | --- |
| `show()/hide()` | 宽高+透明度变化 | speed, callback |
| `slideDown()/slideUp()` | 高度变化（滑动） | speed, callback |
| `fadeIn()/fadeOut()` | 透明度变化 | speed, callback |
| `fadeTo()` | 淡到指定透明度 | speed, opacity, callback |
| `animate()` | 自定义属性变化 | properties, speed, easing, callback |
| `stop()` | 停止动画 | clearQueue, jumpToEnd |

---

## 5 新手常见误区

### 误区 1："animate() 可以动画所有 CSS 属性"

**不行！** `animate()` 只能动画数值型属性。

```javascript
// ✅ 可以动画
$('#box').animate({ width: 200, opacity: 0.5, left: 100 })

// ❌ 不能动画（颜色不是数值）
$('#box').animate({ backgroundColor: 'red' })
// 需要 jQuery UI 或 jQuery Color 插件才能动画颜色
```

### 误区 2："多个 animate 会同时执行"

**不会！** 同一元素的多个 animate 会排队执行。

```javascript
// 这三个动画是按顺序执行的，不是同时
$('#box')
  .animate({ left: 200 }, 1000)   // 先执行
  .animate({ top: 100 }, 1000)    // 再执行
  .animate({ opacity: 0 }, 1000)  // 最后执行
```

### 误区 3："动画过程中不能中断"

**可以中断！** 用 `stop()` 方法。

```javascript
// 开始动画
$('#box').animate({ left: 500 }, 3000)

// 随时可以停止
$('#stopBtn').click(function() {
  $('#box').stop()  // 停在当前位置
})
```

---

## 6 动手练习

### 练习 1：基础练习

创建一个 div，三个按钮分别控制它"淡入"、"淡出"、"切换显示/隐藏"。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    #box { width: 200px; height: 200px; background: #007bff; }
  </style>
</head>
<body>
  <div id="box"></div>
  <button id="fadeInBtn">淡入</button>
  <button id="fadeOutBtn">淡出</button>
  <button id="toggleBtn">切换</button>

  <script>
    $(function() {
      // 淡入按钮
      $('#fadeInBtn').click(function() {
        $('#box').fadeIn(500)
      })

      // 淡出按钮
      $('#fadeOutBtn').click(function() {
        $('#box').fadeOut(500)
      })

      // 切换按钮
      $('#toggleBtn').click(function() {
        $('#box').fadeToggle(500)
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 2：进阶练习

实现一个"手风琴"效果：有多个标题和内容区域，点击标题时展开对应内容，同时收起其他内容。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    .accordion-title {
      background: #007bff; color: white; padding: 10px;
      cursor: pointer; margin: 2px 0;
    }
    .accordion-content {
      display: none; padding: 15px; border: 1px solid #ccc;
    }
  </style>
</head>
<body>
  <!-- 手风琴项 1 -->
  <div class="accordion-title">第一章：HTML 基础</div>
  <div class="accordion-content">HTML 是网页的结构...</div>

  <!-- 手风琴项 2 -->
  <div class="accordion-title">第二章：CSS 样式</div>
  <div class="accordion-content">CSS 控制网页的外观...</div>

  <!-- 手风琴项 3 -->
  <div class="accordion-title">第三章：JavaScript</div>
  <div class="accordion-content">JavaScript 实现网页交互...</div>

  <script>
    $(function() {
      // 给所有标题绑定点击事件
      $('.accordion-title').click(function() {
        // 获取当前标题对应的内容区域（下一个兄弟元素）
        var $content = $(this).next('.accordion-content')

        // 收起所有内容区域（排除当前项）
        $('.accordion-content').not($content).slideUp(300)

        // 展开/收起当前内容区域
        $content.slideToggle(300)
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习

实现一个"图片画廊"效果：有多张图片，鼠标悬停时图片放大并增加阴影，鼠标移开恢复原状。点击图片时，图片淡出后从页面移除。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    .gallery { display: flex; gap: 10px; flex-wrap: wrap; }
    .gallery img {
      width: 150px; height: 150px; object-fit: cover;
      cursor: pointer; transition: transform 0.3s, box-shadow 0.3s;
    }
  </style>
</head>
<body>
  <div class="gallery">
    <img src="https://via.placeholder.com/150?text=1" alt="图片1">
    <img src="https://via.placeholder.com/150?text=2" alt="图片2">
    <img src="https://via.placeholder.com/150?text=3" alt="图片3">
    <img src="https://via.placeholder.com/150?text=4" alt="图片4">
  </div>

  <script>
    $(function() {
      // 鼠标悬停时放大并添加阴影
      $('.gallery img').mouseenter(function() {
        // 使用 animate 做放大效果
        $(this).animate({
          width: '180px',
          height: '180px'
        }, 200)
        // 用 css 方法添加阴影（animate 不支持阴影）
        $(this).css('box-shadow', '0 5px 15px rgba(0,0,0,0.3)')
      })

      // 鼠标移开时恢复
      $('.gallery img').mouseleave(function() {
        $(this).animate({
          width: '150px',
          height: '150px'
        }, 200)
        $(this).css('box-shadow', 'none')
      })

      // 点击图片时淡出并移除
      $('.gallery img').click(function() {
        // 保存当前元素的引用
        var $img = $(this)
        // 淡出动画完成后移除元素
        $img.fadeOut(500, function() {
          $img.remove()
        })
      })
    })
  </script>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **表单操作** —— 用 jQuery 处理表单数据、验证用户输入、序列化表单等。表单是用户和网站交互的重要入口，掌握表单操作非常实用。
