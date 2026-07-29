---
title: "第十三章：jQuery 性能优化"
description: "掌握 jQuery 性能优化技巧，写出高效的 jQuery 代码"
---

# 第十三章：jQuery 性能优化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- jQuery 代码会有性能问题吗？
- 怎么优化 jQuery 代码的性能？
- 有哪些常见的性能陷阱？

这一章就是为了解答这些问题。虽然 jQuery 简化了开发，但不当使用会导致性能问题。掌握优化技巧，让你的代码跑得更快。

---

## 1 为什么需要性能优化？

### 痛点分析

jQuery 代码的性能问题通常表现为：

- 页面操作卡顿，用户交互不流畅
- 大量 DOM 操作导致页面响应慢
- 动画效果掉帧，看起来一卡一卡的
- 内存泄漏，页面越用越慢
- 选择器效率低，查找元素耗时

### 生活化类比

> 把 jQuery 代码想象成在图书馆找书：
> 
> ❌ 低效做法：每次找书都从第一排书架开始，一本本翻过去
> ✅ 高效做法：先查目录（缓存选择器），直接走到对应书架拿书
> 
> 性能优化就是让你从"一本本翻"变成"查目录直接拿"。

---

## 2 核心原理

### jQuery 性能瓶颈在哪里？

jQuery 的性能问题主要来自三个方面：

1. **DOM 操作**：每次操作 DOM 都会触发浏览器重排/重绘
2. **选择器查询**：每次 `$()` 都要遍历 DOM 树查找元素
3. **事件绑定**：大量事件监听器占用内存

打个比方：

> DOM 操作就像装修房子，每次改动都要重新刷墙（重排重绘）；
> 选择器查询就像找人，每次都要挨个房间找；
> 事件绑定就像装监控，装太多会占用资源。

### 优化核心思想

1. **减少 DOM 操作次数**：批量操作，避免频繁修改
2. **缓存 jQuery 对象**：避免重复查询
3. **使用高效选择器**：ID > class > 标签 > 属性
4. **事件委托**：用少量事件处理器管理大量元素

---

## 3 基础用法 + 逐行注释

### 缓存 jQuery 对象

```javascript
// ❌ 错误：重复查询同一个元素
// 每次调用 $('#box') 都会重新查询 DOM
$('#box').css('color', 'red')
$('#box').css('font-size', '16px')
$('#box').text('Hello')
$('#box').addClass('active')
// 查询了 4 次 DOM，效率低

// ✅ 正确：缓存 jQuery 对象
// 只查询一次，后续直接使用缓存的变量
var $box = $('#box')  // 查询一次并缓存
$box.css('color', 'red')       // 使用缓存
$box.css('font-size', '16px')  // 使用缓存
$box.text('Hello')             // 使用缓存
$box.addClass('active')        // 使用缓存
// 只查询了 1 次，效率高

// ✅ 链式调用（推荐的简写方式）
$('#box')
  .css('color', 'red')
  .css('font-size', '16px')
  .text('Hello')
  .addClass('active')
// 链式调用内部也是缓存了对象，只查询一次
```

### 选择器优化

```javascript
// ===== 选择器效率对比（从高到低） =====

// ✅ 最快：ID 选择器（直接调用 getElementById）
$('#box')  // 推荐

// ✅ 较快：class 选择器（现代浏览器优化过）
$('.item')  // 可用

// ⚠️ 一般：标签选择器
$('div')  // 可用，但范围太广时慢

// ❌ 慢：属性选择器
$('[data-type="active"]')  // 避免在大量元素上使用

// ❌ 最慢：伪类选择器
$(':visible')  // 避免使用
$(':first')    // 避免使用

// ===== 选择器组合优化 =====

// ❌ 错误：过长的选择器链
$('#container .list .item .link')  // 查询慢

// ✅ 正确：从 ID 开始，缩短路径
$('#container').find('.link')  // 更快

// ✅ 更好：直接缓存常用选择器
var $links = $('#container').find('.link')  // 缓存后复用
$links.css('color', 'red')
$links.on('click', handler)

// ===== 避免万能选择器 =====

// ❌ 错误：$('*') 会选择页面所有元素
$('*').css('color', 'red')  // 极慢，避免使用

// ✅ 正确：明确指定范围
$('.item').css('color', 'red')  // 只选择特定元素
```

### 减少 DOM 操作

```javascript
// ❌ 错误：循环中频繁操作 DOM
// 每次循环都会触发重排/重绘
for (var i = 0; i < 100; i++) {
  $('#list').append('<li>Item ' + i + '</li>')
}
// 操作了 100 次 DOM，性能差

// ✅ 正确：先构建 HTML 字符串，最后一次性插入
var html = ''
for (var i = 0; i < 100; i++) {
  html += '<li>Item ' + i + '</li>'
}
$('#list').html(html)
// 只操作了 1 次 DOM，性能好

// ✅ 更好：使用 DocumentFragment（原生方法，但原理相同）
var fragment = document.createDocumentFragment()
for (var i = 0; i < 100; i++) {
  var li = document.createElement('li')
  li.textContent = 'Item ' + i
  fragment.appendChild(li)
}
$('#list')[0].appendChild(fragment)
// 也是只操作 1 次 DOM

// ===== 批量修改样式 =====

// ❌ 错误：多次调用 css()
$('#box').css('color', 'red')
$('#box').css('font-size', '16px')
$('#box').css('background', 'blue')
// 触发了 3 次重排

// ✅ 正确：一次性传入对象
$('#box').css({
  'color': 'red',
  'font-size': '16px',
  'background': 'blue'
})
// 只触发 1 次重排

// ✅ 更好：使用 class 切换
$('#box').addClass('highlight')
// 样式在 CSS 中定义，JS 只负责切换 class
```

### 事件委托优化

```javascript
// ❌ 错误：给每个元素单独绑定事件
// 如果有 100 个 li，就绑定了 100 个事件处理器
$('li').on('click', function() {
  console.log($(this).text())
})
// 占用内存大，新增元素需要重新绑定

// ✅ 正确：使用事件委托
// 只在父元素上绑定 1 个事件处理器
$('#list').on('click', 'li', function() {
  console.log($(this).text())
})
// 只占用 1 个事件处理器的内存，新增元素自动生效

// ===== 事件委托的性能优势 =====
// 假设有 1000 个按钮需要绑定点击事件

// ❌ 错误方式：
$('.btn').on('click', handler)
// 创建了 1000 个事件监听器

// ✅ 正确方式：
$('#container').on('click', '.btn', handler)
// 只创建了 1 个事件监听器
```

### 避免不必要的操作

```javascript
// ===== 检查元素是否存在 =====

// ❌ 错误：直接操作可能不存在的元素
$('#maybe-not-exist').text('Hello')
// 如果元素不存在，jQuery 不会报错，但浪费了查询时间

// ✅ 正确：先检查是否存在
var $elem = $('#maybe-not-exist')
if ($elem.length > 0) {
  // 元素存在才操作
  $elem.text('Hello')
}

// ===== 避免重复操作 =====

// ❌ 错误：重复获取相同的值
$('#input').on('input', function() {
  var value = $('#input').val()  // 每次都查询
  console.log(value)
  $('#preview').text(value)      // 又查询了一次
})

// ✅ 正确：缓存值
$('#input').on('input', function() {
  var $this = $(this)
  var value = $this.val()  // 只查询一次
  console.log(value)
  $('#preview').text(value)  // 使用缓存的值
})

// ===== 使用原生方法处理大量数据 =====

// 当需要处理大量数据时，原生 JS 可能更快
var data = [/* 10000 条数据 */]

// ❌ jQuery 方式（慢）
$.each(data, function(index, item) {
  $('#list').append('<li>' + item + '</li>')
})

// ✅ 原生方式（快）
var html = ''
for (var i = 0; i < data.length; i++) {
  html += '<li>' + data[i] + '</li>'
}
$('#list')[0].innerHTML = html  // 直接操作原生 DOM
```

### 动画性能优化

```javascript
// ===== 使用 CSS3 动画代替 jQuery 动画 =====

// ❌ jQuery 动画（JavaScript 驱动，性能一般）
$('#box').animate({ left: '200px' }, 500)

// ✅ CSS3 动画（GPU 加速，性能更好）
$('#box').css({
  'transition': 'left 0.5s ease',
  'left': '200px'
})

// 或者使用 class 切换
$('#box').addClass('animate-left')
// CSS 中定义：
// .animate-left {
//   transition: left 0.5s ease;
//   left: 200px;
// }

// ===== 简化动画 =====

// ❌ 错误：复杂动画链
$('#box')
  .animate({ left: '100px' }, 200)
  .animate({ top: '100px' }, 200)
  .animate({ opacity: 0.5 }, 200)
// 多个动画依次执行，总耗时 600ms

// ✅ 正确：同时执行多个属性动画
$('#box').animate({
  left: '100px',
  top: '100px',
  opacity: 0.5
}, 200)
// 所有属性同时变化，总耗时 200ms

// ===== 停止不必要的动画 =====

// 在快速连续触发时，停止之前的动画
$('#btn').on('mouseenter', function() {
  $('#box').stop(true, true).fadeIn()
})
$('#btn').on('mouseleave', function() {
  $('#box').stop(true, true).fadeOut()
})
```

### 延迟加载和节流

```javascript
// ===== 滚动事件优化（节流） =====

// ❌ 错误：滚动事件触发频率极高
$(window).on('scroll', function() {
  // 滚动时可能触发几百次
  console.log('滚动了')
  updatePosition()
})

// ✅ 正确：使用节流，限制执行频率
var scrollTimer = null
$(window).on('scroll', function() {
  if (scrollTimer) return  // 如果定时器存在，直接返回
  
  scrollTimer = setTimeout(function() {
    updatePosition()
    scrollTimer = null  // 执行完后清空
  }, 100)  // 每 100ms 最多执行一次
})

// ===== 输入框优化（防抖） =====

// ❌ 错误：每次按键都发送请求
$('#search').on('keyup', function() {
  var keyword = $(this).val()
  $.get('/api/search', { q: keyword })  // 每次按键都请求
})

// ✅ 正确：使用防抖，停止输入后才请求
var inputTimer = null
$('#search').on('keyup', function() {
  var keyword = $(this).val()
  
  // 清除之前的定时器
  clearTimeout(inputTimer)
  
  // 设置新的定时器
  inputTimer = setTimeout(function() {
    $.get('/api/search', { q: keyword })
  }, 500)  // 停止输入 500ms 后才请求
})
```

---

## 4 对比表格

### 选择器效率对比

| 选择器类型 | 效率 | 示例 | 说明 |
| --- | --- | --- | --- |
| ID 选择器 | ⭐⭐⭐⭐⭐ | `$('#box')` | 最快，直接定位 |
| class 选择器 | ⭐⭐⭐⭐ | `$('.item')` | 较快，现代浏览器优化 |
| 标签选择器 | ⭐⭐⭐ | `$('div')` | 一般，范围可能很大 |
| 属性选择器 | ⭐⭐ | `('[data-type]')` | 较慢，需要遍历 |
| 伪类选择器 | ⭐ | `(':visible')` | 最慢，避免使用 |
| 组合选择器 | ⭐⭐ | `$('#box .item')` | 取决于具体写法 |

### DOM 操作方式对比

| 方式 | 性能 | 适用场景 | 示例 |
| --- | --- | --- | --- |
| 批量 HTML 字符串 | ⭐⭐⭐⭐⭐ | 大量元素插入 | `$('#list').html(htmlStr)` |
| DocumentFragment | ⭐⭐⭐⭐⭐ | 复杂 DOM 结构 | `fragment.appendChild()` |
| 链式调用 | ⭐⭐⭐⭐ | 单个元素多操作 | `$box.css().text()` |
| 逐个操作 | ⭐⭐ | 少量元素 | `$('#box').text()` 多次 |
| 循环中操作 | ⭐ | 大量元素 | 循环中 `append()` |

### 事件绑定方式对比

| 方式 | 内存占用 | 性能 | 适用场景 |
| --- | --- | --- | --- |
| 事件委托 | 低 | ⭐⭐⭐⭐⭐ | 大量子元素、动态元素 |
| 直接绑定 | 高 | ⭐⭐⭐ | 少量固定元素 |
| 内联事件 | 高 | ⭐⭐ | 不推荐 |

### 动画方式对比

| 方式 | 性能 | 兼容性 | 适用场景 |
| --- | --- | --- | --- |
| CSS3 动画 | ⭐⭐⭐⭐⭐ | 现代浏览器 | 简单过渡、位移 |
| jQuery animate() | ⭐⭐⭐ | 所有浏览器 | 复杂动画、兼容旧浏览器 |
| requestAnimationFrame | ⭐⭐⭐⭐⭐ | 现代浏览器 | 高性能动画、游戏 |

---

## 5 新手常见误区

### 误区 1："$() 查询很快，不需要缓存"

**错误！** 每次 `$()` 都会重新查询 DOM，如果查询复杂选择器，开销很大。

```javascript
// ❌ 错误：重复查询
$('.container .item').css('color', 'red')
$('.container .item').text('Hello')
$('.container .item').on('click', handler)
// 查询了 3 次，每次都要遍历 DOM

// ✅ 正确：缓存查询结果
var $items = $('.container .item')
$items.css('color', 'red')
$items.text('Hello')
$items.on('click', handler)
// 只查询 1 次

// ✅ 更好：使用 ID 快速定位
var $container = $('#container')
var $items = $container.find('.item')
// 先从 ID 定位，再在范围内查找
```

### 误区 2："链式调用越长越好"

**不一定！** 过长的链式调用难以调试，且中间某步出错会影响后续。

```javascript
// ❌ 错误：过长的链式调用
$('#box')
  .css('color', 'red')
  .css('font-size', '16px')
  .text('Hello')
  .addClass('active')
  .fadeIn()
  .slideDown()
  .on('click', handler)
// 如果中间某步出错，很难定位

// ✅ 正确：适当拆分
var $box = $('#box')
$box.css({
  'color': 'red',
  'font-size': '16px'
})
$box.text('Hello').addClass('active')
$box.fadeIn().slideDown()
$box.on('click', handler)
// 逻辑清晰，便于调试
```

### 误区 3："事件委托可以替代所有事件绑定"

**不是！** 事件委托适合大量子元素，少量固定元素直接绑定更高效。

```javascript
// ❌ 错误：所有情况都用事件委托
// 只有 3 个按钮，没必要用事件委托
$('#container').on('click', '#btn1', handler1)
$('#container').on('click', '#btn2', handler2)
$('#container').on('click', '#btn3', handler3)
// 增加了选择器匹配的开销

// ✅ 正确：少量元素直接绑定
$('#btn1').on('click', handler1)
$('#btn2').on('click', handler2)
$('#btn3').on('click', handler3)
// 直接绑定，没有额外的选择器开销

// ✅ 事件委托适用场景
// 列表有 100 个 li，或者 li 会动态增加
$('#list').on('click', 'li', handler)
```

### 误区 4："jQuery 动画性能很好"

**不一定！** jQuery 动画是 JavaScript 驱动的，性能不如 CSS3 动画。

```javascript
// ❌ 错误：复杂动画用 jQuery
$('#box').animate({
  left: '200px',
  top: '100px',
  opacity: 0.5,
  width: '300px'
}, 500)
// JavaScript 驱动，可能掉帧

// ✅ 正确：优先使用 CSS3 动画
$('#box').css({
  'transition': 'all 0.5s ease',
  'left': '200px',
  'top': '100px',
  'opacity': '0.5',
  'width': '300px'
})
// CSS3 动画由浏览器优化，GPU 加速

// ✅ jQuery 动画适用场景
// 需要精确控制动画过程、兼容旧浏览器
$('#box').animate({ left: '200px' }, {
  duration: 500,
  step: function(now, fx) {
    // 每一步可以执行自定义逻辑
    console.log('当前值：', now)
  }
})
```

### 误区 5："代码能跑就行，不需要优化"

**错误！** 性能问题在小数据量时不明显，数据量大时会暴露。

```javascript
// ❌ 错误：不优化，觉得"能跑就行"
// 列表只有 10 项时没问题
for (var i = 0; i < 10; i++) {
  $('#list').append('<li>Item ' + i + '</li>')
}

// 但列表变成 1000 项时就卡了
for (var i = 0; i < 1000; i++) {
  $('#list').append('<li>Item ' + i + '</li>')
}
// 操作了 1000 次 DOM，页面卡顿

// ✅ 正确：从一开始就养成优化习惯
var html = ''
for (var i = 0; i < 1000; i++) {
  html += '<li>Item ' + i + '</li>'
}
$('#list').html(html)
// 无论数据量大小，性能都好
```

---

## 6 动手练习

### 练习 1：基础练习 - 缓存选择器

优化以下代码，将重复的选择器查询改为缓存变量。

```javascript
// 原始代码（未优化）
$('#header .nav').addClass('active')
$('#header .nav').css('color', 'red')
$('#header .nav').text('导航菜单')
$('#header .nav').on('click', function() {
  console.log('点击了导航')
})
```

<details>
<summary>点击查看答案</summary>

```javascript
// ✅ 优化后：缓存选择器
var $nav = $('#header .nav')

// 使用缓存的变量
$nav.addClass('active')
$nav.css('color', 'red')
$nav.text('导航菜单')
$nav.on('click', function() {
  console.log('点击了导航')
})

// 或者使用链式调用
$('#header .nav')
  .addClass('active')
  .css('color', 'red')
  .text('导航菜单')
  .on('click', function() {
    console.log('点击了导航')
  })
```

</details>

### 练习 2：进阶练习 - 批量 DOM 操作

优化以下代码，将循环中的 DOM 操作改为批量操作。

```javascript
// 原始代码（未优化）
// 假设有 100 条数据
var data = ['苹果', '香蕉', '橘子', /* ... 共 100 条 */]

for (var i = 0; i < data.length; i++) {
  $('#fruitList').append('<li>' + data[i] + '</li>')
}
```

<details>
<summary>点击查看答案</summary>

```javascript
// ✅ 优化后：批量操作
var data = ['苹果', '香蕉', '橘子', /* ... 共 100 条 */]

// 方式一：构建 HTML 字符串
var html = ''
for (var i = 0; i < data.length; i++) {
  html += '<li>' + data[i] + '</li>'
}
$('#fruitList').html(html)

// 方式二：使用数组 join（更快）
var items = []
for (var i = 0; i < data.length; i++) {
  items.push('<li>' + data[i] + '</li>')
}
$('#fruitList').html(items.join(''))

// 方式三：使用 map（更简洁）
var html = data.map(function(item) {
  return '<li>' + item + '</li>'
}).join('')
$('#fruitList').html(html)
```

</details>

### 练习 3（挑战）：综合练习 - 滚动性能优化

实现一个"回到顶部"按钮，要求：
1. 页面滚动超过 300px 时显示按钮
2. 滚动事件要使用节流优化
3. 点击按钮平滑滚动到顶部

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    body { height: 3000px; }
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
      display: none;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <h1>向下滚动页面...</h1>
  <button id="backTop">顶部</button>

  <script>
    $(function() {
      // 节流定时器变量
      var scrollTimer = null
      
      // 缓存选择器
      var $backTop = $('#backTop')
      var $window = $(window)
      
      // 滚动事件（使用节流优化）
      $window.on('scroll', function() {
        // 如果定时器存在，说明上次执行还没到时间，直接返回
        if (scrollTimer) return
        
        // 设置定时器，100ms 后执行
        scrollTimer = setTimeout(function() {
          // 获取滚动距离
          var scrollTop = $window.scrollTop()
          
          // 判断是否超过 300px
          if (scrollTop > 300) {
            $backTop.fadeIn(200)
          } else {
            $backTop.fadeOut(200)
          }
          
          // 清空定时器，允许下次执行
          scrollTimer = null
        }, 100)  // 每 100ms 最多执行一次
      })
      
      // 点击回到顶部按钮
      $backTop.on('click', function() {
        // 使用 CSS3 平滑滚动（现代浏览器）
        $('html, body').css({
          'scroll-behavior': 'smooth'
        })
        
        // 滚动到顶部
        $window.scrollTop(0)
        
        // 或者使用 jQuery 动画（兼容旧浏览器）
        // $('html, body').animate({ scrollTop: 0 }, 500)
      })
    })
  </script>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **jQuery 与现代框架的对比** —— 了解 jQuery 和 Vue、React 等现代框架的区别，以及什么时候该用 jQuery，什么时候该用现代框架。你会学到如何评估技术选型，以及 jQuery 在 2026 年的定位。
