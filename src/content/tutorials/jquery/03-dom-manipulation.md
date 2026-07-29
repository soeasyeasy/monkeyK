---
title: "第三章：DOM 操作基础"
description: "学会用 jQuery 获取和设置内容、操作属性、创建和删除节点"
---

# 第三章：DOM 操作基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- jQuery 中获取元素内容有哪些方法？
- html()、text()、val() 有什么区别？
- 怎么用 jQuery 创建、插入和删除元素？

这一章就是为了解答这些问题。DOM 操作是 jQuery 最核心的功能，掌握了它，你就能动态地修改页面的一切。

---

## 1 为什么需要 DOM 操作？

### 痛点分析

网页不是静态的，用户需要和页面交互。比如：

- 用户点击"加载更多"，列表要动态添加新内容
- 用户点击"删除"，对应的条目要从页面消失
- 用户输入信息后，页面要实时显示反馈

这些都需要**动态操作 DOM**——修改内容、改变属性、增删节点。

### jQuery 的优势

```javascript
// ❌ 原生 JS：创建并添加一个元素需要多步
var div = document.createElement('div')  // 创建元素
div.className = 'box'                     // 设置 class
div.innerHTML = '新内容'                   // 设置内容
document.body.appendChild(div)            // 添加到页面

// ✅ jQuery：链式调用，一气呵成
$('<div class="box">新内容</div>').appendTo('body')
```

> **一句话总结**：jQuery 把创建、修改、删除元素的操作简化成了链式调用，代码更少更清晰。

---

## 2 核心原理

### jQuery DOM 操作的分类

jQuery 的 DOM 操作可以分为四大类：

1. **内容操作**：获取/设置元素的文本、HTML、值
2. **属性操作**：获取/设置元素的属性
3. **节点操作**：创建、插入、删除元素
4. **遍历操作**：在 DOM 树中导航

打个比方：

> 把 DOM 想象成一棵大树，jQuery 就是你手中的园艺工具：
> - 内容操作 = 给树枝换叶子
> - 属性操作 = 给树枝贴标签
> - 节点操作 = 嫁接新枝或剪掉旧枝
> - 遍历操作 = 在树枝间攀爬移动

---

## 3 基础用法 + 逐行注释

### 内容操作：html()、text()、val()

```javascript
// ===== html() =====
// 获取或设置元素的 innerHTML（包含 HTML 标签）
// 类似于原生 JS 的 innerHTML

// 获取 #box 的 HTML 内容（包含标签）
var content = $('#box').html()
console.log(content)  // 输出：<span>Hello</span>

// 设置 #box 的 HTML 内容
$('#box').html('<strong>新内容</strong>')
// 结果：<div id="box"><strong>新内容</strong></div>


// ===== text() =====
// 获取或设置元素的纯文本内容（不包含 HTML 标签）
// 类似于原生 JS 的 textContent

// 获取 #box 的纯文本内容（去掉标签）
var text = $('#box').text()
console.log(text)  // 输出：Hello（没有 span 标签）

// 设置 #box 的文本内容（会被当作纯文本，不会解析 HTML）
$('#box').text('<strong>新内容</strong>')
// 结果：<div id="box">&lt;strong&gt;新内容&lt;/strong&gt;</div>
// 注意：HTML 标签被转义了，显示为文本


// ===== val() =====
// 获取或设置表单元素的 value 值
// 类似于原生 JS 的 value

// 获取输入框的值
var value = $('#username').val()
console.log(value)  // 输出：输入框中的文字

// 设置输入框的值
$('#username').val('新值')
```

### 对比表格

| 方法 | 用途 | 是否解析 HTML | 适用元素 |
| --- | --- | --- | --- |
| `html()` | 获取/设置 HTML 内容 | 是 | 所有元素 |
| `text()` | 获取/设置纯文本 | 否 | 所有元素 |
| `val()` | 获取/设置 value | - | 表单元素 |

### 属性操作

```javascript
// ===== attr() =====
// 获取或设置元素的属性（自定义属性也可以）

// 获取属性值
var src = $('img').attr('src')        // 获取图片的 src
var href = $('a').attr('href')        // 获取链接的 href

// 设置属性值
$('img').attr('src', 'new.jpg')       // 设置图片路径
$('img').attr('alt', '描述文字')       // 设置 alt 属性

// 同时设置多个属性
$('img').attr({
  'src': 'new.jpg',
  'alt': '描述文字',
  'title': '提示文字'
})


// ===== prop() =====
// 获取或设置元素的固有属性（DOM 属性）
// 主要用于布尔值属性：checked、selected、disabled 等

// 获取复选框是否被选中
var isChecked = $('#checkbox').prop('checked')
console.log(isChecked)  // 输出：true 或 false

// 设置复选框为选中状态
$('#checkbox').prop('checked', true)

// 禁用输入框
$('#input').prop('disabled', true)

// 启用输入框
$('#input').prop('disabled', false)
```

### attr() vs prop() 对比

| 特性 | attr() | prop() |
| --- | --- | --- |
| 操作对象 | HTML 属性（标签上的） | DOM 属性（对象上的） |
| 适用场景 | 自定义属性、href、src 等 | checked、selected、disabled |
| 返回值类型 | 字符串 | 对应类型（布尔值等） |
| 示例 | `attr('class')` | `prop('checked')` |

### 节点操作

```javascript
// ===== 创建元素 =====
// 用 $() 传入 HTML 字符串即可创建新元素
var $newDiv = $('<div>新创建的 div</div>')
var $newLi = $('<li>新列表项</li>')


// ===== 插入元素 =====
// 内部插入（成为子元素）
$('#box').append($newDiv)      // 在 #box 内部的末尾添加
$newDiv.appendTo('#box')       // 同上，写法不同
$('#box').prepend($newDiv)     // 在 #box 内部的开头添加
$newDiv.prependTo('#box')      // 同上

// 外部插入（成为兄弟元素）
$('#box').after($newDiv)       // 在 #box 的后面添加
$newDiv.insertAfter('#box')    // 同上
$('#box').before($newDiv)      // 在 #box 的前面添加
$newDiv.insertBefore('#box')   // 同上


// ===== 删除元素 =====
// 删除匹配的元素及其所有内容
$('.item').remove()            // 删除所有 class 为 item 的元素

// 清空元素的内容（删除子节点，但保留元素本身）
$('#box').empty()              // 清空 #box 的所有子内容


// ===== 替换元素 =====
// 用新元素替换旧元素
$('.old').replaceWith('<div class="new">新的</div>')
```

### 遍历 DOM

```javascript
// ===== children() =====
// 获取直接子元素（不包括孙辈）
$('#box').children()           // 获取 #box 的所有直接子元素
$('#box').children('.item')    // 只获取 class 为 item 的子元素

// ===== find() =====
// 获取所有后代元素（包括子元素的子元素...）
$('#box').find('p')            // 获取 #box 内所有的 p 元素

// ===== parent() =====
// 获取直接父元素
$('.item').parent()            // 获取 .item 的父元素
$('.item').parent('.box')      // 获取 class 为 box 的父元素

// ===== parents() =====
// 获取所有祖先元素（一直向上到 html）
$('.item').parents()           // 获取所有祖先
$('.item').parents('div')      // 获取所有 div 祖先

// ===== siblings() =====
// 获取所有兄弟元素（不包括自己）
$('.item').siblings()          // 获取 .item 的所有兄弟
$('.item').siblings('.active') // 只获取 class 为 active 的兄弟

// ===== next() / prev() =====
// 获取下一个/上一个兄弟元素
$('.item').next()              // 获取下一个兄弟
$('.item').prev()              // 获取上一个兄弟

// ===== each() 遍历 =====
// 遍历 jQuery 对象集合中的每个元素
$('li').each(function(index, element) {
  // index 是当前元素的索引（从 0 开始）
  // element 是原生 DOM 元素（不是 jQuery 对象）
  // $(element) 或 $(this) 可以转为 jQuery 对象
  console.log(index + ': ' + $(this).text())
})
```

---

## 4 新手常见误区

### 误区 1："html() 和 text() 用法一样"

**不一样！** `html()` 会解析 HTML 标签，`text()` 只处理纯文本。

```javascript
// ❌ 错误：用 text() 设置 HTML，标签会被转义
$('#box').text('<b>加粗</b>')
// 页面显示：<b>加粗</b>（标签被当成文字显示了）

// ✅ 正确：用 html() 设置 HTML 内容
$('#box').html('<b>加粗</b>')
// 页面显示：加粗（加粗效果）
```

### 误区 2："attr() 和 prop() 可以互换"

**不能！** 对于布尔值属性（checked、selected、disabled），必须用 `prop()`。

```javascript
// ❌ 错误：用 attr() 判断复选框是否选中
if ($('#cb').attr('checked')) {  // 可能返回 "checked" 或 undefined
  // 这个判断不可靠
}

// ✅ 正确：用 prop() 判断
if ($('#cb').prop('checked')) {  // 返回 true 或 false
  // 可靠
}
```

### 误区 3："append() 和 appendTo() 是一样的"

**效果一样，但语法不同！** 注意调用对象和参数的位置。

```javascript
// 这两种写法效果相同
$('#box').append($newDiv)    // 在 #box 里追加 $newDiv
$newDiv.appendTo('#box')     // 把 $newDiv 追加到 #box 里

// 区别在于：
// A.append(B) → 在 A 里面追加 B
// B.appendTo(A) → 把 B 追加到 A 里面
```

---

## 5 动手练习

### 练习 1：基础练习

创建一个按钮，点击后在一个 div 中追加一个新的 p 元素，内容为"第 N 条消息"（N 从 1 开始递增）。

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
  <button id="addBtn">添加消息</button>
  <div id="messageBox"></div>

  <script>
    $(function() {
      // 定义计数器变量
      var count = 0

      // 按钮点击事件
      $('#addBtn').click(function() {
        // 计数器加 1
        count++
        // 创建新的 p 元素并追加到 messageBox 中
        $('#messageBox').append('<p>第 ' + count + ' 条消息</p>')
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 2：进阶练习

有一个商品列表（ul > li），每个 li 里有一个"删除"按钮。点击删除按钮后，删除对应的 li。

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
  <ul id="productList">
    <li>苹果 <button class="delBtn">删除</button></li>
    <li>香蕉 <button class="delBtn">删除</button></li>
    <li>橘子 <button class="delBtn">删除</button></li>
    <li>葡萄 <button class="delBtn">删除</button></li>
  </ul>

  <script>
    $(function() {
      // 使用事件委托绑定删除按钮的点击事件
      // 因为后续可能动态添加 li，直接绑定会失效
      $('#productList').on('click', '.delBtn', function() {
        // $(this) 是当前点击的删除按钮
        // .parent() 获取按钮的父元素（即 li）
        // .remove() 删除该 li
        $(this).parent().remove()
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习

实现一个简单的"动态表单"：页面上有一个"添加字段"按钮，每次点击后在表单中添加一个新的输入框（名称为"字段1"、"字段2"...），每个输入框旁边有一个"删除"按钮可以删除该字段。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    .field { margin: 5px 0; }
    .field input { margin-right: 10px; padding: 5px; }
    .field button { padding: 3px 10px; }
  </style>
</head>
<body>
  <h2>动态表单</h2>
  <!-- 添加字段按钮 -->
  <button id="addField">添加字段</button>
  <hr>
  <!-- 表单容器 -->
  <div id="formContainer"></div>

  <script>
    $(function() {
      // 字段计数器
      var fieldCount = 0

      // 添加字段按钮点击事件
      $('#addField').click(function() {
        // 计数器加 1
        fieldCount++

        // 创建新的字段 HTML
        // 包含标签、输入框和删除按钮
        var fieldHtml = '<div class="field">' +
          '<label>字段' + fieldCount + '：</label>' +
          '<input type="text" placeholder="请输入内容">' +
          '<button class="removeField">删除</button>' +
          '</div>'

        // 将新字段追加到表单容器中
        $('#formContainer').append(fieldHtml)
      })

      // 使用事件委托处理删除按钮点击
      // 因为删除按钮是动态创建的，不能直接绑定事件
      $('#formContainer').on('click', '.removeField', function() {
        // $(this).parent() 获取字段容器 div
        // .remove() 删除整个字段
        $(this).parent().remove()
      })
    })
  </script>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **CSS 样式操作** —— 用 jQuery 动态地修改元素的样式。你会学到如何添加/删除 class、修改 CSS 属性、获取元素尺寸等。这些技能在做交互效果时非常常用。
