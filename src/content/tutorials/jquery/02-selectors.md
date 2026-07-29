---
title: "第二章：jQuery 选择器"
description: "掌握 jQuery 选择器，精准找到页面中任何你想要的元素"
---

# 第二章：jQuery 选择器

## 本章导读

在学这一章之前，你可能会有这些疑问：

- jQuery 选择器和 CSS 选择器有什么区别？
- jQuery 有哪些特殊的选择器是 CSS 没有的？
- 怎么高效地选中我想要的元素？

这一章就是为了解答这些问题。选择器是 jQuery 的基础，**所有操作都从"选中元素"开始**。掌握了选择器，你就等于拿到了页面的"遥控器"。

---

## 1 为什么需要这么多选择器？

### 痛点分析

想象一下，你面前有一排快递柜，有 100 个格子。你需要取出特定的几个：

- 取出第 3 号柜子的快递 → 就像 **ID 选择器**，精确定位
- 取出所有红色柜子的快递 → 就像 **class 选择器**，按特征筛选
- 取出第 1 排的所有柜子 → 就像 **层级选择器**，按位置筛选
- 取出第 5 号到第 10 号柜子 → 就像 **过滤选择器**，按范围筛选

jQuery 提供了丰富的选择器，让你在任何场景下都能精准找到目标元素。

### 对比：原生 JS vs jQuery 选择器

```javascript
// ===== 原生 JS 的选择器 =====
// 只能通过这些方式获取元素
document.getElementById('box')           // 通过 ID
document.getElementsByClassName('item')  // 通过 class（返回集合）
document.getElementsByTagName('p')       // 通过标签（返回集合）
document.querySelector('.box')           // CSS 选择器（返回第一个）
document.querySelectorAll('.item')       // CSS 选择器（返回所有）

// ===== jQuery 的选择器 =====
// 统一用 $() 语法，支持所有 CSS 选择器 + 自己的扩展
$('#box')          // ID 选择器
$('.item')         // class 选择器
$('p')             // 标签选择器
$('div p')         // 后代选择器
$('div > p')       // 子选择器
$('div + p')       // 相邻兄弟选择器
$('div ~ p')       // 通用兄弟选择器
```

---

## 2 核心原理

### jQuery 选择器的原理

jQuery 选择器的底层原理是这样的：

1. 接收一个字符串参数（选择器表达式）
2. 内部使用浏览器的 `querySelectorAll` 等方法查找元素
3. 将找到的元素包装成 **jQuery 对象** 返回
4. 对于 CSS 不支持的选择器，jQuery 用 JavaScript 手动筛选

打个比方：

> jQuery 选择器就像一个智能搜索引擎，你输入关键词（选择器），它帮你找到所有匹配的元素，并打包成一个"结果包裹"（jQuery 对象）。

---

## 3 基础用法 + 逐行注释

### 基础选择器

```javascript
// ===== ID 选择器 =====
// 通过元素的 id 属性选择，返回唯一元素
// 相当于 document.getElementById()
$('#myId')

// ===== class 选择器 =====
// 通过元素的 class 属性选择，返回所有匹配的元素
$('.myClass')

// ===== 标签选择器 =====
// 选择所有指定标签的元素
$('p')           // 选择所有 <p> 元素
$('div')         // 选择所有 <div> 元素

// ===== 通配符选择器 =====
// 选择所有元素
$('*')

// ===== 群组选择器 =====
// 同时选择多个条件的元素，用逗号分隔
$('div, p, .box')  // 选择所有 div、p 和 class 为 box 的元素
```

### 层级选择器

```javascript
// ===== 后代选择器（空格） =====
// 选择 div 内部的所有 span（包括嵌套的）
// 就像"找某个人的所有子孙后代"
$('div span')

// ===== 子选择器（>） =====
// 只选择 div 的直接子元素 span
// 就像"只找某个人的直接子女，不包括孙辈"
$('div > span')

// ===== 相邻兄弟选择器（+） =====
// 选择紧跟在 h1 后面的第一个 p 元素
// 就像"找某个人的亲弟弟/亲妹妹"
$('h1 + p')

// ===== 通用兄弟选择器（~） =====
// 选择 h1 后面的所有 p 元素（不一定是紧跟的）
// 就像"找某个人的所有弟弟妹妹"
$('h1 ~ p')
```

### 属性选择器

```javascript
// ===== 有某属性的元素 =====
// 选择所有有 title 属性的元素
$('[title]')

// ===== 属性等于某值 =====
// 选择 type 属性等于 "text" 的元素
$('[type="text"]')

// ===== 属性以某值开头 =====
// 选择 href 属性以 "https" 开头的元素
$('[href^="https"]')

// ===== 属性以某值结尾 =====
// 选择文件名以 ".jpg" 结尾的 img 元素
$('img[src$=".jpg"]')

// ===== 属性包含某值 =====
// 选择 class 属性包含 "active" 的元素
$('[class~="active"]')

// ===== 组合属性选择器 =====
// 选择 type 为 "text" 且 name 为 "username" 的 input
$('input[type="text"][name="username"]')
```

### 过滤选择器（jQuery 独有）

```javascript
// ===== 基本过滤 =====
$('li:first')        // 选择第一个 li
$('li:last')         // 选择最后一个 li
$('li:eq(2)')        // 选择索引等于 2 的 li（第 3 个）
$('li:gt(2)')        // 选择索引大于 2 的 li（第 4 个及之后）
$('li:lt(2)')        // 选择索引小于 2 的 li（前 2 个）
$('li:even')         // 选择索引为偶数的 li（第 1、3、5...个）
$('li:odd')          // 选择索引为奇数的 li（第 2、4、6...个）
$('li:not(.active)') // 选择 class 不是 active 的 li

// ===== 内容过滤 =====
$('div:contains("hello")')  // 选择内容包含 "hello" 的 div
$('div:has(p)')             // 选择包含 p 子元素的 div
$('div:empty')              // 选择内容为空的 div
$('div:parent')             // 选择有子元素的 div

// ===== 可见性过滤 =====
$('div:hidden')      // 选择所有隐藏的 div
$('div:visible')     // 选择所有可见的 div

// ===== 表单过滤 =====
$(':input')          // 选择所有表单元素（input、select、textarea、button）
$(':text')           // 选择所有文本输入框
$(':password')       // 选择所有密码输入框
$(':radio')          // 选择所有单选按钮
$(':checkbox')       // 选择所有复选框
$(':checked')        // 选择所有被选中的元素
$(':disabled')       // 选择所有被禁用的元素
$(':enabled')        // 选择所有可用的元素
```

### 表单选择器实战

```html
<!-- HTML 结构 -->
<form id="myForm">
  <input type="text" name="username" value="张三">
  <input type="password" name="pwd" value="123">
  <input type="radio" name="gender" value="male" checked> 男
  <input type="radio" name="gender" value="female"> 女
  <input type="checkbox" name="hobby" value="read" checked> 阅读
  <input type="checkbox" name="hobby" value="music" checked> 音乐
  <select name="city">
    <option value="beijing">北京</option>
    <option value="shanghai" selected>上海</option>
  </select>
</form>
```

```javascript
// 获取所有文本输入框
$(':text')  // 返回 name="username" 的 input

// 获取被选中的单选按钮
$(':radio:checked')  // 返回 value="male" 的 radio

// 获取所有被选中的复选框
$(':checkbox:checked')  // 返回"阅读"和"音乐"

// 获取被选中的下拉选项
$('select option:selected')  // 返回"上海"
```

---

## 4 对比表格

| 选择器类型 | 语法 | 说明 | 示例 |
| --- | --- | --- | --- |
| ID 选择器 | `#id` | 选中唯一元素 | `$('#box')` |
| class 选择器 | `.class` | 选中一组元素 | `$('.item')` |
| 标签选择器 | `tag` | 选中所有该标签 | `$('p')` |
| 后代选择器 | `A B` | A 内所有 B | `$('div p')` |
| 子选择器 | `A > B` | A 的直接子 B | `$('div > p')` |
| 属性选择器 | `[attr=val]` | 按属性筛选 | `$('[type="text"]')` |
| 过滤选择器 | `:first` | jQuery 扩展 | `$('li:first')` |
| 表单选择器 | `:text` | 按表单类型 | `$(':password')` |

---

## 5 新手常见误区

### 误区 1："ID 选择器和 class 选择器效果一样"

**错！** ID 选择器返回唯一元素（因为 ID 在页面中应该是唯一的），class 选择器返回所有匹配的元素集合。

```javascript
// ID 选择器：只返回一个元素
$('#box').css('color', 'red')  // 只修改一个元素

// class 选择器：返回所有匹配元素
$('.item').css('color', 'red')  // 修改所有 class 为 item 的元素
```

### 误区 2："$('div') 和 document.getElementsByTagName('div') 返回一样的东西"

**不一样！**

```javascript
// 原生方法返回的是 HTMLCollection（实时更新的集合）
var divs = document.getElementsByTagName('div')
// divs 是 HTMLCollection

// jQuery 返回的是 jQuery 对象（静态快照）
var $divs = $('div')
// $divs 是 jQuery 对象，可以使用 jQuery 方法
```

### 误区 3："选择器越复杂越好"

**不是的。** 过于复杂的选择器会降低性能，而且代码可读性差。

```javascript
// ❌ 不推荐：过于复杂的选择器
$('#main .content ul.list li.item a.link')

// ✅ 推荐：给元素加一个明确的 class
$('.list-link')
```

---

## 6 动手练习

### 练习 1：基础练习

有一个无序列表，包含 5 个 li。请用 jQuery 选择器完成：
1. 选中第一个 li，文字变红
2. 选中最后一个 li，文字变蓝
3. 选中索引为偶数的 li，加粗

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
</head>
<body>
  <ul id="myList">
    <li>第 1 项</li>
    <li>第 2 项</li>
    <li>第 3 项</li>
    <li>第 4 项</li>
    <li>第 5 项</li>
  </ul>

  <script>
    $(function() {
      // 选中第一个 li，文字变红
      $('#myList li:first').css('color', 'red')

      // 选中最后一个 li，文字变蓝
      $('#myList li:last').css('color', 'blue')

      // 选中索引为偶数的 li（第 1、3、5 项），加粗
      $('#myList li:even').css('font-weight', 'bold')
    })
  </script>
</body>
</html>
```

</details>

### 练习 2：进阶练习

有一个表单，包含用户名输入框、密码输入框、几个复选框。请用 jQuery 选择器：
1. 获取所有文本输入框的值
2. 获取所有被选中的复选框的值

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
</head>
<body>
  <form id="myForm">
    <!-- 文本输入框 -->
    <input type="text" name="username" value="张三"><br><br>
    <!-- 密码输入框 -->
    <input type="password" name="pwd" value="123456"><br><br>
    <!-- 复选框 -->
    <label><input type="checkbox" name="hobby" value="read" checked> 阅读</label>
    <label><input type="checkbox" name="hobby" value="music"> 音乐</label>
    <label><input type="checkbox" name="hobby" value="sports" checked> 运动</label>
    <br><br>
    <!-- 获取数据按钮 -->
    <button type="button" id="getBtn">获取数据</button>
  </form>

  <script>
    $(function() {
      $('#getBtn').click(function() {
        // 获取文本输入框的值
        // :text 选择所有 type="text" 的 input
        var username = $(':text').val()
        console.log('用户名：' + username)

        // 获取所有被选中的复选框的值
        // :checkbox:checked 选择所有被选中的复选框
        var hobbies = []
        $(':checkbox:checked').each(function() {
          // $(this).val() 获取当前复选框的值
          hobbies.push($(this).val())
        })
        console.log('爱好：' + hobbies.join(', '))
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习

实现一个"全选/全不选"功能：有一个全选复选框和多个商品复选框，点击全选时所有商品都被选中，再点击则全不选。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
</head>
<body>
  <!-- 全选复选框 -->
  <label>
    <input type="checkbox" id="checkAll"> 全选
  </label>
  <hr>
  <!-- 商品列表 -->
  <div>
    <label><input type="checkbox" class="item" value="apple"> 苹果</label><br>
    <label><input type="checkbox" class="item" value="banana"> 香蕉</label><br>
    <label><input type="checkbox" class="item" value="orange"> 橘子</label><br>
    <label><input type="checkbox" class="item" value="grape"> 葡萄</label>
  </div>

  <script>
    $(function() {
      // 全选复选框的点击事件
      $('#checkAll').click(function() {
        // $(this).prop('checked') 获取全选框是否被选中
        // .prop() 是 jQuery 获取/设置元素属性的方法
        var isChecked = $(this).prop('checked')

        // 将所有商品复选框的选中状态设为与全选框一致
        $('.item').prop('checked', isChecked)
      })

      // 商品复选框的点击事件（可选：联动全选框状态）
      $('.item').click(function() {
        // 获取所有商品复选框的数量
        var total = $('.item').length
        // 获取被选中的商品复选框数量
        var checked = $('.item:checked').length

        // 如果全部选中，全选框也选中；否则全选框不选中
        $('#checkAll').prop('checked', total === checked)
      })
    })
  </script>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **DOM 操作基础** —— 选中元素之后，怎么修改它们的内容、属性和结构。你会学到如何创建新元素、修改现有元素、删除元素等实用技能。这些操作是动态更新页面的核心能力。
