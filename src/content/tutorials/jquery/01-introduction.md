---
title: "第一章：jQuery 简介与环境搭建"
description: "认识 jQuery，理解它解决了什么问题，搭建你的第一个 jQuery 项目"
---

# 第一章：jQuery 简介与环境搭建

## 本章导读

在学这一章之前，你可能会有这些疑问：

- jQuery 是什么？和 JavaScript 有什么关系？
- 现在都 2026 年了，为什么还要学 jQuery？
- jQuery 和 Vue、React 这些现代框架有什么区别？

这一章就是为了解答这些问题。我们会先搞清楚 **jQuery 到底解决了什么痛点**，再动手搭建环境，让你 5 分钟内写出第一个 jQuery 程序。

---

## 1 为什么需要 jQuery？

### 原生 JS 的痛点

在 jQuery 出现之前（2006 年），操作 DOM 是一件非常痛苦的事情。

假设你要让一个 div 元素在点击后变色，用原生 JS 需要这样写：

```javascript
// 原生 JavaScript 写法
// 获取元素
var box = document.getElementById('box')

// 绑定事件
box.addEventListener('click', function() {
  // 修改样式
  box.style.backgroundColor = 'red'
  box.style.color = 'white'
  box.style.padding = '20px'

  // 修改内容
  box.innerHTML = '我被点击了！'
})
```

看起来还行？再看看这个需求：找到页面中所有 class 为 item 的 li 元素，给它们加上点击事件。

```javascript
// 原生 JS：给所有 item 类元素绑定事件
// 1. 先获取所有元素
var items = document.getElementsByClassName('item')

// 2. 遍历每个元素
for (var i = 0; i < items.length; i++) {
  // 3. 逐个绑定事件
  items[i].addEventListener('click', function() {
    this.style.color = 'blue'
  })
}
```

**痛点总结**：
- 获取元素的方法太多太乱（getElementById、getElementsByClassName、querySelector...）
- 不同浏览器的 API 不一样（尤其是 IE 和其他浏览器的差异）
- 操作 DOM 的代码冗长，写起来费劲
- 做动画效果更是噩梦

### jQuery 的解决方案

jQuery 的口号是 **"Write Less, Do More"**（写得更少，做得更多）。

同样的功能，用 jQuery 来写：

```javascript
// jQuery 写法：一行搞定
$('#box').click(function() {
  $(this).css({
    'background-color': 'red',
    'color': 'white',
    'padding': '20px'
  }).html('我被点击了！')
})

// 给所有 item 类元素绑定事件，也是一行
$('.item').click(function() {
  $(this).css('color', 'blue')
})
```

> **一句话总结**：jQuery 把复杂的 DOM 操作变得简单优雅，让你专注于"做什么"而不是"怎么做"。

---

## 2 核心原理

### 什么是 jQuery？

jQuery 是一个 **JavaScript 函数库**，它封装了常用的 DOM 操作、事件处理、动画效果和 Ajax 请求，让你用更少的代码完成更多的事情。

打个比方：

> 如果说原生 JavaScript 是手动挡汽车，需要你自己踩离合、换挡、给油；
> 那 jQuery 就是自动挡汽车，你只需要踩油门和刹车就能上路。

### jQuery 的核心思想

jQuery 的核心就两件事：

1. **选择元素**：用类似 CSS 选择器的方式找到页面元素
2. **操作元素**：对找到的元素进行修改、绑定事件等

```javascript
// 第一步：选择元素（用 $() 包裹选择器）
var box = $('#box')        // 通过 ID 选择
var items = $('.item')     // 通过 class 选择
var paras = $('p')         // 通过标签选择

// 第二步：操作元素（调用 jQuery 方法）
box.hide()                 // 隐藏元素
box.show()                 // 显示元素
box.html('新内容')          // 修改内容
box.css('color', 'red')    // 修改样式
box.click(function() {})   // 绑定事件
```

### jQuery vs 原生 JS vs Vue/React

| 特性 | 原生 JavaScript | jQuery | Vue/React |
| --- | --- | --- | --- |
| 出现时间 | 1995 年 | 2006 年 | 2013/2013 年 |
| 编程范式 | 命令式 | 命令式（简化版） | 声明式 |
| DOM 操作 | 手动操作 | 链式调用简化 | 数据驱动，自动更新 |
| 浏览器兼容 | 需手动处理 | 内部已处理 | 需配合构建工具 |
| 学习曲线 | 中等 | 低 | 中等 |
| 包体积 | 0 KB | ~90 KB（压缩后） | ~30-40 KB |
| 适用场景 | 任何场景 | 传统多页应用、维护老项目 | 现代单页应用 |

### jQuery 的现状

你可能会问：现在都 2026 年了，还要不要学 jQuery？

**需要学的情况**：
- 你进入的公司有大量 jQuery 老项目需要维护
- 你接的外包项目客户要求用 jQuery
- 你想快速理解"前端是怎么一步步演进的"

**不需要学的情况**：
- 你在开发全新的现代 Web 应用（用 Vue/React）
- 你只需要了解概念，不需要深入 API

> 不管怎样，了解 jQuery 的设计思想对理解前端发展史非常有帮助。

---

## 3 基础用法

### 引入 jQuery

jQuery 有三种引入方式：

```html
<!-- 方式一：CDN 引入（推荐新手使用） -->
<!-- 从 CDN 加载 jQuery，不需要安装任何东西 -->
<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>

<!-- 方式二：下载本地文件引入 -->
<!-- 把 jQuery 文件下载到项目中，然后引入 -->
<script src="./js/jquery-3.7.1.min.js"></script>

<!-- 方式三：npm 安装（适合工程化项目） -->
<!-- 通过 npm 安装到项目中 -->
<!-- npm install jquery -->
```

### 第一个 jQuery 程序

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>第一个 jQuery 程序</title>
  <!-- 引入 jQuery -->
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
</head>
<body>
  <h1 id="title">Hello jQuery!</h1>
  <button id="btn">点击我</button>

  <script>
    // ✅ 正确写法：等待 DOM 加载完成后再执行
    // $(document).ready() 是 jQuery 的入口函数
    $(document).ready(function() {
      // 当 DOM 准备就绪，绑定点击事件
      $('#btn').click(function() {
        // 点击按钮后，修改标题文字和颜色
        $('#title').text('jQuery 真好用！').css('color', 'red')
      })
    })

    // ✅ 简写形式（效果一样，更常用）
    // $() 传入 function 等同于 $(document).ready()
    $(function() {
      // 这里的代码也会在 DOM 加载完成后执行
      console.log('DOM 已就绪')
    })
  </script>
</body>
</html>
```

> **原理**：`$(document).ready()` 确保在 DOM 完全加载后才执行代码，避免"元素还没加载就操作"的问题。这比原生 JS 的 `window.onload` 更快，因为 `window.onload` 要等所有资源（包括图片）加载完。

### $ 符号的含义

```javascript
// $ 就是 jQuery 的简写，两者完全等价
$('#box')    // 等同于 jQuery('#box')
jQuery('#box') // 等同于 $('#box')

// $() 返回的是一个 jQuery 对象（类似数组的集合）
var $box = $('#box')  // 返回 jQuery 对象
console.log($box)      // 输出：jQuery.fn.init [div#box]

// ✅ 可以通过 .length 查看选中了多少个元素
console.log($('.item').length)  // 输出：选中的元素个数

// ✅ 可以通过 [索引] 获取原生 DOM 元素
console.log($('.item')[0])  // 输出：原生的 DOM 元素
```

### 对比：原生 JS vs jQuery

```javascript
// ===== 获取元素 =====
// ❌ 原生 JS
document.getElementById('box')
document.getElementsByClassName('item')
document.getElementsByTagName('p')
document.querySelector('.box')
document.querySelectorAll('.item')

// ✅ jQuery：统一用 $()
$('#box')       // ID 选择器
$('.item')      // class 选择器
$('p')          // 标签选择器
$('.box p')     // 后代选择器
$('.box > p')   // 子选择器

// ===== 修改内容 =====
// ❌ 原生 JS
document.getElementById('box').innerHTML = '新内容'
document.getElementById('box').textContent = '新内容'

// ✅ jQuery
$('#box').html('新内容')       // 设置 HTML 内容
$('#box').text('新内容')       // 设置纯文本内容

// ===== 修改样式 =====
// ❌ 原生 JS
document.getElementById('box').style.color = 'red'
document.getElementById('box').style.backgroundColor = 'blue'

// ✅ jQuery
$('#box').css('color', 'red')
$('#box').css('background-color', 'blue')
// 或者批量设置
$('#box').css({
  'color': 'red',
  'background-color': 'blue'
})
```

---

## 4 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| jQuery 是什么 | 一个 JavaScript 函数库，简化 DOM 操作 |
| 核心口号 | Write Less, Do More |
| 引入方式 | CDN、本地文件、npm 安装 |
| 入口函数 | `$(document).ready()` 或简写 `$()` |
| $ 符号 | jQuery 的别名，核心函数 |
| jQuery 对象 | `$()` 返回的对象，包含一组 DOM 元素 |
| 链式调用 | jQuery 方法大多返回 jQuery 对象，可以连续调用 |

---

## 5 新手常见误区

### 误区 1："jQuery 和 JavaScript 是两种不同的语言"

**错！** jQuery 是用 JavaScript 写的一个库，本质上就是一堆 JS 代码。你学 jQuery 其实还是在用 JavaScript，只是 jQuery 帮你封装了很多常用操作。

### 误区 2："$ 是 jQuery 独有的符号"

不是的。`$` 在 JavaScript 中只是一个合法的变量名。jQuery 恰好把自己的主函数命名为 `$`。你也可以定义 `var $ = function() {}`，但这样就覆盖了 jQuery 的 `$`。

### 误区 3："jQuery 对象和 DOM 对象可以混用"

**不行！** 这是新手最常犯的错误。

```javascript
// ❌ 错误：用 jQuery 对象调用原生方法
$('#box').innerHTML = '内容'  // 报错！$('#box') 是 jQuery 对象

// ❌ 错误：用 DOM 对象调用 jQuery 方法
var box = document.getElementById('box')
box.html('内容')  // 报错！box 是原生 DOM 对象

// ✅ 正确：jQuery 对象转 DOM 对象
$('#box')[0].innerHTML = '内容'
// 或者
$('#box').get(0).innerHTML = '内容'

// ✅ 正确：DOM 对象转 jQuery 对象
var box = document.getElementById('box')
$(box).html('内容')
```

### 误区 4："script 标签随便放哪都行"

**注意！** jQuery 的 script 标签要放在 `<head>` 中（或者使用 `$(document).ready()`），而你的业务代码要放在 `</body>` 前面或 `$(document).ready()` 里面。如果 jQuery 还没加载完，你就用 `$()`，会报错 `$ is not defined`。

---

## 6 动手练习

### 练习 1：基础练习 - 用 jQuery 修改页面内容

创建一个 HTML 页面，包含一个标题和一个按钮。点击按钮后，标题文字变成"Hello jQuery!"，颜色变成蓝色。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习1</title>
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
</head>
<body>
  <h1 id="title">原始标题</h1>
  <button id="btn">修改标题</button>

  <script>
    // 等待 DOM 加载完成
    $(function() {
      // 绑定按钮点击事件
      $('#btn').click(function() {
        // 修改标题文字和颜色
        $('#title').text('Hello jQuery!').css('color', 'blue')
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 2：进阶练习 - 列表项点击变色

创建一个包含 5 个 li 的列表，点击任意一个 li，它的文字变成红色，其他 li 恢复黑色。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习2</title>
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
</head>
<body>
  <ul id="list">
    <li>苹果</li>
    <li>香蕉</li>
    <li>橘子</li>
    <li>葡萄</li>
    <li>西瓜</li>
  </ul>

  <script>
    $(function() {
      // 给所有 li 绑定点击事件
      $('#list li').click(function() {
        // 先把所有 li 颜色恢复为黑色
        $('#list li').css('color', 'black')
        // 再把当前点击的 li 颜色设为红色
        // $(this) 表示当前被点击的元素
        $(this).css('color', 'red')
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习 - 简易计算器

用 jQuery 实现一个简易计算器，包含两个输入框、四个按钮（加减乘除），点击按钮后在页面显示计算结果。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习3 - 简易计算器</title>
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    input { width: 80px; padding: 5px; margin: 5px; }
    button { padding: 5px 15px; margin: 5px; cursor: pointer; }
    #result { font-size: 24px; color: green; margin-top: 10px; }
  </style>
</head>
<body>
  <h2>简易计算器</h2>
  <!-- 第一个数字输入框 -->
  <input type="number" id="num1" placeholder="数字1">
  <!-- 第二个数字输入框 -->
  <input type="number" id="num2" placeholder="数字2">
  <br>
  <!-- 四个运算按钮 -->
  <button id="add">加</button>
  <button id="sub">减</button>
  <button id="mul">乘</button>
  <button id="div">除</button>
  <!-- 显示结果 -->
  <p>结果：<span id="result">-</span></p>

  <script>
    $(function() {
      // 加法按钮点击事件
      $('#add').click(function() {
        // 获取两个输入框的值，转为浮点数
        var a = parseFloat($('#num1').val())
        var b = parseFloat($('#num2').val())
        // 计算并显示结果
        $('#result').text(a + b)
      })

      // 减法按钮点击事件
      $('#sub').click(function() {
        var a = parseFloat($('#num1').val())
        var b = parseFloat($('#num2').val())
        $('#result').text(a - b)
      })

      // 乘法按钮点击事件
      $('#mul').click(function() {
        var a = parseFloat($('#num1').val())
        var b = parseFloat($('#num2').val())
        $('#result').text(a * b)
      })

      // 除法按钮点击事件
      $('#div').click(function() {
        var a = parseFloat($('#num1').val())
        var b = parseFloat($('#num2').val())
        // 判断除数是否为 0
        if (b === 0) {
          $('#result').text('除数不能为0').css('color', 'red')
        } else {
          $('#result').text(a / b).css('color', 'green')
        }
      })
    })
  </script>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **jQuery 选择器** —— 这是 jQuery 最强大的功能之一。你会学到如何用各种方式精准地找到页面中的元素，就像在超市里快速找到你要的商品一样。选择器是 jQuery 一切操作的基础，掌握了它，后面的内容就水到渠成了。
