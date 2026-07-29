---
title: "第五章：事件处理基础"
description: "掌握 jQuery 事件绑定、事件对象、事件冒泡与事件委托"
---

# 第五章：事件处理基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- jQuery 中怎么绑定事件？和原生 JS 有什么区别？
- 什么是事件冒泡？怎么阻止它？
- 事件委托是什么？为什么要用它？

这一章就是为了解答这些问题。事件是用户和网页交互的桥梁，掌握了事件处理，你的网页就能"响应"用户的操作了。

---

## 1 为什么需要事件处理？

### 痛点分析

网页要"活"起来，就必须响应用户的操作：

- 用户点击按钮 → 弹出对话框
- 用户输入文字 → 实时搜索
- 用户滚动页面 → 显示回到顶部按钮

这些"用户做了某个动作，页面做出响应"的机制，就是**事件处理**。

### jQuery 的方案

```javascript
// ❌ 原生 JS 绑定事件（不同浏览器写法不同）
element.onclick = function() {}        // 只能绑定一个
element.addEventListener('click', fn)  // 标准写法
element.attachEvent('onclick', fn)     // IE8 以下

// ✅ jQuery：统一写法，兼容所有浏览器
$('#btn').click(function() {})
$('#btn').on('click', function() {})
```

> **一句话总结**：jQuery 屏蔽了浏览器差异，让你用统一的语法绑定事件。

---

## 2 核心原理

### 什么是事件？

事件就是"发生在页面上的事情"——点击、键盘输入、鼠标移动、窗口大小改变等。

打个比方：

> 事件就像门铃。有人按门铃（触发事件），你听到铃声去开门（执行事件处理函数）。
> jQuery 帮你安装了一个"万能门铃系统"，不管什么牌子的门铃都能用。

### 事件处理的三要素

1. **事件源**：谁触发了事件（哪个元素）
2. **事件类型**：什么事件（click、mouseover、keydown...）
3. **事件处理函数**：触发后要做什么

---

## 3 基础用法 + 逐行注释

### 常用事件方法

```javascript
// ===== 鼠标事件 =====
$('#btn').click(function() {})       // 单击
$('#btn').dblclick(function() {})    // 双击
$('#btn').mousedown(function() {})   // 鼠标按下
$('#btn').mouseup(function() {})     // 鼠标松开
$('#btn').mouseover(function() {})   // 鼠标移入（会冒泡）
$('#btn').mouseout(function() {})    // 鼠标移出（会冒泡）
$('#btn').mouseenter(function() {})  // 鼠标移入（不冒泡）
$('#btn').mouseleave(function() {})  // 鼠标移出（不冒泡）

// ===== 键盘事件 =====
$('input').keydown(function() {})    // 键盘按下
$('input').keyup(function() {})      // 键盘松开
$('input').keypress(function() {})   // 键盘按下并释放（已废弃）

// ===== 表单事件 =====
$('form').submit(function() {})      // 表单提交
$('input').focus(function() {})      // 获得焦点
$('input').blur(function() {})       // 失去焦点
$('input').change(function() {})     // 值改变

// ===== 文档/窗口事件 =====
$(window).resize(function() {})      // 窗口大小改变
$(document).scroll(function() {})    // 页面滚动
```

### on() 方法（推荐）

```javascript
// ===== on() 是 jQuery 最通用的事件绑定方法 =====
// 可以绑定所有类型的事件

// 基本用法
$('#btn').on('click', function() {
  console.log('按钮被点击了')
})

// 绑定多个事件（用对象形式）
$('#btn').on({
  click: function() {
    console.log('点击')
  },
  mouseover: function() {
    console.log('鼠标移入')
  },
  mouseout: function() {
    console.log('鼠标移出')
  }
})

// 同时给多个元素绑定同一事件
$('button').on('click', function() {
  console.log($(this).text() + ' 被点击了')
})

// 给一个元素绑定多个处理函数
$('#btn').on('click', handler1)
$('#btn').on('click', handler2)
// 点击时会依次执行 handler1 和 handler2
```

### 事件对象

```javascript
// 事件处理函数会自动接收一个事件对象 event
$('#btn').click(function(event) {
  // event 包含了事件的详细信息

  // 获取鼠标位置
  console.log(event.pageX)  // 鼠标相对于文档的 X 坐标
  console.log(event.pageY)  // 鼠标相对于文档的 Y 坐标

  // 获取按键信息
  console.log(event.which)  // 按键的 keyCode

  // 获取触发事件的原始 DOM 元素
  console.log(event.target) // 原生 DOM 元素
  console.log($(event.target)) // 转为 jQuery 对象

  // 阻止默认行为
  event.preventDefault()

  // 阻止事件冒泡
  event.stopPropagation()
})

// ===== 实际常用写法 =====
// 阻止表单的默认提交行为
$('form').submit(function(event) {
  event.preventDefault()  // 阻止表单提交刷新页面
  // 用 Ajax 提交数据...
})

// 阻止链接的默认跳转
$('a').click(function(event) {
  event.preventDefault()  // 阻止链接跳转
  // 做其他事情...
})
```

### 事件冒泡

```javascript
// 事件冒泡：事件从最内层元素向外层元素传播
// 就像往水里扔石头，水波从中心向外扩散

// HTML 结构
// <div id="outer">
//   <div id="inner">
//     <button id="btn">点击</button>
//   </div>
// </div>

$('#outer').click(function() {
  console.log('outer 被点击')
})

$('#inner').click(function() {
  console.log('inner 被点击')
})

$('#btn').click(function() {
  console.log('btn 被点击')
})

// 点击 btn 后，控制台输出：
// btn 被点击
// inner 被点击
// outer 被点击
// 事件从 btn 冒泡到 inner，再冒泡到 outer


// ===== 阻止冒泡 =====
$('#btn').click(function(event) {
  console.log('btn 被点击')
  event.stopPropagation()  // 阻止事件继续冒泡
  // 这样 inner 和 outer 的点击事件就不会被触发
})
```

### 事件委托

```javascript
// 事件委托：把子元素的事件绑定到父元素上
// 利用事件冒泡的原理，在父元素上监听子元素的事件

// ❌ 不推荐：给每个 li 单独绑定事件
$('li').click(function() {
  console.log($(this).text())
})
// 问题：如果后续动态添加新的 li，新 li 没有事件

// ✅ 推荐：用事件委托
$('ul').on('click', 'li', function() {
  // 第二个参数 'li' 指定了事件的实际触发者
  // $(this) 指向被点击的 li 元素
  console.log($(this).text())
})
// 好处：
// 1. 动态添加的 li 也能响应事件
// 2. 只需要绑定一次，性能更好

// ===== 事件委托实战 =====
// 动态添加列表项，也能响应点击
$('#addBtn').click(function() {
  $('ul').append('<li>新项</li>')  // 动态添加
})

// 用事件委托处理所有 li 的点击
$('ul').on('click', 'li', function() {
  $(this).css('color', 'red')
})
```

---

## 4 对比表格

| 方法 | 说明 | 适用场景 |
| --- | --- | --- |
| `click(fn)` | 快捷绑定 click 事件 | 简单事件绑定 |
| `on('click', fn)` | 通用事件绑定 | 推荐使用，功能最全 |
| `on('click', 'sel', fn)` | 事件委托 | 动态元素、性能优化 |
| `off('click')` | 解绑事件 | 移除事件处理 |
| `one('click', fn)` | 只执行一次的事件 | 防止重复提交 |
| `trigger('click')` | 手动触发事件 | 模拟用户操作 |

---

## 5 新手常见误区

### 误区 1："mouseover 和 mouseenter 是一样的"

**不一样！** 主要区别在于是否冒泡。

```javascript
// mouseover：鼠标移入子元素时也会触发（会冒泡）
// mouseenter：只有鼠标真正进入元素时才触发（不冒泡）

// 如果元素内部有子元素：
// mouseover 会在进入子元素时触发（因为冒泡）
// mouseenter 不会，只有真正进入目标元素才触发

// ✅ 推荐：大多数场景用 mouseenter/mouseleave
$('#box').mouseenter(function() {
  // 鼠标真正进入 #box 时触发
})
```

### 误区 2："事件委托和直接绑定效果一样"

**效果类似，但原理不同！** 事件委托更适合动态元素。

```javascript
// 直接绑定：只对当前存在的元素有效
$('.item').click(function() {})
// 后续动态添加的 .item 不会响应

// 事件委托：对现在和未来的元素都有效
$('#list').on('click', '.item', function() {})
// 后续动态添加的 .item 也能响应
```

### 误区 3："return false 和 preventDefault 是一样的"

**不完全一样！** `return false` 在 jQuery 中同时做了两件事。

```javascript
// 在 jQuery 事件处理函数中：
// return false 等同于同时调用：
// event.preventDefault()  +  event.stopPropagation()

// 阻止默认行为
$('a').click(function() {
  event.preventDefault()     // 只阻止默认行为
  // return false            // 阻止默认行为 + 阻止冒泡
})
```

---

## 6 动手练习

### 练习 1：基础练习

创建一个按钮，点击后在控制台输出"按钮被点击了"，同时阻止按钮的默认行为（如果它是 submit 类型）。

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
  <form>
    <button type="submit" id="myBtn">提交按钮</button>
  </form>

  <script>
    $(function() {
      // 绑定点击事件
      $('#myBtn').click(function(event) {
        // 阻止表单的默认提交行为
        event.preventDefault()
        // 输出日志
        console.log('按钮被点击了')
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 2：进阶练习

实现一个"密码显示/隐藏"功能：有一个密码输入框和一个按钮，点击按钮切换密码的显示/隐藏状态。

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
  <!-- 密码输入框 -->
  <input type="password" id="pwd" value="123456">
  <!-- 切换按钮 -->
  <button id="toggleBtn">显示密码</button>

  <script>
    $(function() {
      // 按钮点击事件
      $('#toggleBtn').click(function() {
        // 获取当前输入框的 type 属性
        var type = $('#pwd').attr('type')

        // 判断当前是密码模式还是文本模式
        if (type === 'password') {
          // 切换为文本模式（显示密码）
          $('#pwd').attr('type', 'text')
          // 修改按钮文字
          $(this).text('隐藏密码')
        } else {
          // 切换为密码模式（隐藏密码）
          $('#pwd').attr('type', 'password')
          // 修改按钮文字
          $(this).text('显示密码')
        }
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习

用事件委托实现一个"待办事项"列表：可以添加新项，点击任意项（包括动态添加的）可以切换完成状态（加删除线），点击项旁边的"删除"按钮可以删除该项。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    .done { text-decoration: line-through; color: gray; }
    .del-btn { margin-left: 10px; color: red; cursor: pointer; }
  </style>
</head>
<body>
  <input type="text" id="todoInput" placeholder="输入待办事项">
  <button id="addBtn">添加</button>
  <ul id="todoList"></ul>

  <script>
    $(function() {
      // 添加待办事项
      $('#addBtn').click(function() {
        // 获取输入内容
        var text = $('#todoInput').val().trim()
        // 如果内容为空，不添加
        if (text === '') return

        // 创建新的 li 元素，包含文字和删除按钮
        var $li = $('<li>' + text + ' <span class="del-btn">[删除]</span></li>')
        // 追加到列表中
        $('#todoList').append($li)
        // 清空输入框
        $('#todoInput').val('')
      })

      // 事件委托：点击 li 切换完成状态
      // 但排除删除按钮（因为删除按钮有自己的事件）
      $('#todoList').on('click', 'li', function(event) {
        // 判断点击的是否是删除按钮
        if ($(event.target).hasClass('del-btn')) return
        // 切换完成状态（toggle 切换 class）
        $(this).toggleClass('done')
      })

      // 事件委托：点击删除按钮删除该项
      $('#todoList').on('click', '.del-btn', function() {
        // $(this).parent() 获取 li 元素
        // .remove() 删除 li
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

下一章我们会学习 **动画与效果** —— 让元素动起来！你会学到 show/hide、slideUp/fadeIn 等内置动画，以及用 animate() 创建自定义动画。动画能让网页交互更加生动有趣。
