---
title: "第五章：事件处理基础"
description: "掌握 jQuery 事件绑定、事件对象、事件冒泡与事件委托"
---

# 第五章：事件处理基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- jQuery 中怎么绑定事件？和原生 JS 有什么区别？
- 什么是事件对象？它有什么用？
- 事件冒泡和事件委托是什么？为什么需要它们？

这一章就是为了解答这些问题。事件是网页交互的核心，鼠标点击、键盘输入、窗口滚动... 这些都是事件。掌握了事件处理，你的网页才能真正"活"起来。

---

## 1 为什么需要事件处理？

### 痛点分析

网页如果没有事件处理，就是一张"死"的静态图片。用户的任何操作都不会有响应：

- 点击按钮没反应
- 输入框无法验证
- 滚动页面没有效果
- 键盘操作无法响应

所有交互行为都依赖**事件机制**。

### 生活化类比

> 事件机制就像餐厅的呼叫铃。
> 顾客按下呼叫铃（触发事件），服务员听到铃声过来服务（执行事件处理函数）。
> 不同的铃对应不同的服务——点餐铃、结账铃、加水铃（不同类型的事件）。

### jQuery 的方案

jQuery 提供了统一的事件处理接口，不用管浏览器兼容问题，一个 `.on()` 方法搞定所有事件。

---

## 2 核心原理

### 事件的三要素

每个事件都有三个核心要素：

1. **事件源**：谁触发了事件（比如哪个按钮被点击了）
2. **事件类型**：发生了什么事件（click、keydown、scroll...）
3. **事件处理函数**：事件触发后要做什么

打个比方：

> 事件三要素就像报警电话：
> - 事件源 = 报警人（谁打的电话）
> - 事件类型 = 警情类型（火灾、盗窃、交通事故）
> - 事件处理函数 = 出警方案（派消防车还是警车）

### 事件执行流程

```
用户操作 → 触发事件 → 浏览器生成事件对象 → 执行事件处理函数
```

---

## 3 基础用法 + 逐行注释

### 事件绑定方式

```javascript
// ===== 方式一：on() 方法（推荐，最通用） =====
// 语法：$(选择器).on('事件名', 处理函数)
$('#btn').on('click', function() {
  // 当按钮被点击时，执行这里的代码
  console.log('按钮被点击了')
})

// 可以同时绑定多个事件，用空格分隔
$('#btn').on('click mouseenter', function() {
  // 点击或鼠标进入时都会执行
  console.log('触发了事件')
})

// 也可以用对象形式一次绑定多个不同事件
$('#btn').on({
  click: function() {
    // 点击事件的处理
    console.log('点击了')
  },
  mouseenter: function() {
    // 鼠标进入事件的处理
    console.log('鼠标进入了')
  },
  mouseleave: function() {
    // 鼠标离开事件的处理
    console.log('鼠标离开了')
  }
})

// ===== 方式二：快捷方法 =====
// jQuery 为常用事件提供了快捷方法
$('#btn').click(function() {
  // 等同于 on('click', fn)
  console.log('点击了')
})

$('#input').keyup(function() {
  // 键盘按键抬起时触发
  console.log('按键抬起')
})

$(window).scroll(function() {
  // 页面滚动时触发
  console.log('页面滚动了')
})

// ===== 方式三：bind() 方法（已废弃，了解即可） =====
// ❌ 不推荐：jQuery 3.0 后已废弃
$('#btn').bind('click', function() {
  console.log('点击了')
})
```

### 事件对象 event

```javascript
// 事件处理函数会自动接收一个 event 参数
// 这个参数包含了事件的所有信息
$('#btn').on('click', function(event) {
  // event.type：事件类型
  console.log(event.type)  // 输出："click"

  // event.target：触发事件的原始 DOM 元素
  console.log(event.target)  // 输出：被点击的 DOM 元素

  // event.currentTarget：绑定事件的元素（等于 this）
  console.log(event.currentTarget)

  // event.pageX / event.pageY：鼠标相对于文档的坐标
  console.log(event.pageX)  // 鼠标距离文档左边的像素数
  console.log(event.pageY)  // 鼠标距离文档顶部的像素数

  // event.preventDefault()：阻止默认行为
  // 比如阻止链接跳转、表单提交、右键菜单等
  event.preventDefault()

  // event.stopPropagation()：阻止事件冒泡
  // 后面会详细解释什么是事件冒泡
  event.stopPropagation()
})

// 键盘事件中的按键信息
$('#input').on('keydown', function(event) {
  // event.which：按键的 keyCode
  console.log(event.which)  // 输出：按键对应的数字编码

  // 判断是否按下了特定键
  if (event.which === 13) {
    // 13 是 Enter 键的编码
    console.log('按下了回车键')
  }
  if (event.which === 27) {
    // 27 是 Esc 键的编码
    console.log('按下了 Esc 键')
  }
})
```

### 事件冒泡

```javascript
// 事件冒泡：事件会从最内层元素向外层元素依次触发
// 就像往水里扔石头，波纹会从中心向外扩散

// HTML 结构：
// <div id="outer">
//   <div id="inner">
//     <button id="btn">点击我</button>
//   </div>
// </div>

$('#btn').on('click', function() {
  // 点击按钮时触发
  console.log('按钮被点击')
})

$('#inner').on('click', function() {
  // 点击按钮时也会触发（因为冒泡）
  console.log('inner 被点击')
})

$('#outer').on('click', function() {
  // 点击按钮时也会触发（继续冒泡）
  console.log('outer 被点击')
})

// 点击按钮后，控制台输出顺序：
// 1. "按钮被点击"
// 2. "inner 被点击"
// 3. "outer 被点击"

// 阻止冒泡：在事件处理函数中调用 stopPropagation()
$('#btn').on('click', function(event) {
  console.log('按钮被点击')
  // 阻止事件继续向外层冒泡
  event.stopPropagation()
  // 这样点击按钮只会输出"按钮被点击"
})
```

### 事件委托

```javascript
// 事件委托：把子元素的事件绑定到父元素上
// 利用事件冒泡原理，通过 event.target 判断是谁触发的

// ❌ 不推荐：给每个 li 单独绑定事件
// 问题：如果后面新增 li，新 li 没有事件
$('li').on('click', function() {
  console.log($(this).text())
})

// ✅ 推荐：使用事件委托，把事件绑定到父元素 ul 上
$('ul').on('click', 'li', function() {
  // 第二个参数 'li' 表示：只有点击 li 时才触发
  // 这里的 this 指向被点击的 li 元素
  console.log($(this).text())
})

// 事件委托的好处：
// 1. 新增的 li 自动就有事件（不需要重新绑定）
// 2. 只绑定一次事件，性能更好
// 3. 代码更简洁
```

### 事件解绑

```javascript
// ===== off() 方法：移除事件 =====
// 移除所有 click 事件
$('#btn').off('click')

// 移除所有事件
$('#btn').off()

// 移除特定的事件处理函数
function myHandler() {
  console.log('特定处理函数')
}
$('#btn').on('click', myHandler)  // 先绑定
$('#btn').off('click', myHandler) // 再移除指定的处理函数

// ===== one() 方法：只执行一次的事件 =====
// 事件处理函数只会执行一次，执行完自动移除
$('#btn').one('click', function() {
  console.log('我只会执行一次')
})
// 第一次点击：输出"我只会执行一次"
// 第二次及以后点击：不再执行
```

---

## 4 对比表格

### 事件绑定方式对比

| 方法 | 说明 | 是否推荐 | 备注 |
| --- | --- | --- | --- |
| `on()` | 统一的事件绑定方法 | ✅ 强烈推荐 | 支持所有事件类型 |
| `click()` 等快捷方法 | 特定事件的快捷方式 | ✅ 可用 | 代码更简洁 |
| `bind()` | 旧版绑定方法 | ❌ 已废弃 | jQuery 3.0 后不推荐 |
| `delegate()` | 旧版事件委托 | ❌ 已废弃 | 被 `on()` 取代 |
| `live()` | 旧版动态绑定 | ❌ 已移除 | jQuery 1.9 后移除 |

### 常用事件类型

| 事件类型 | 触发时机 | 常见用途 |
| --- | --- | --- |
| `click` | 鼠标点击 | 按钮点击、选项切换 |
| `dblclick` | 鼠标双击 | 编辑、放大 |
| `mouseenter` | 鼠标进入元素 | 下拉菜单、提示框 |
| `mouseleave` | 鼠标离开元素 | 隐藏提示框 |
| `mousemove` | 鼠标在元素上移动 | 拖拽、跟随效果 |
| `keydown` | 键盘按键按下 | 快捷键、输入验证 |
| `keyup` | 键盘按键抬起 | 实时搜索 |
| `focus` | 获得焦点 | 输入框提示 |
| `blur` | 失去焦点 | 表单验证 |
| `submit` | 表单提交 | 表单验证、Ajax 提交 |
| `change` | 值改变 | 联动选择、实时计算 |
| `scroll` | 滚动 | 回到顶部、懒加载 |
| `resize` | 窗口大小改变 | 响应式布局调整 |

### 事件对象常用属性

| 属性/方法 | 说明 | 示例 |
| --- | --- | --- |
| `event.type` | 事件类型 | "click"、"keydown" |
| `event.target` | 触发事件的原始元素 | 被点击的按钮 |
| `event.currentTarget` | 绑定事件的元素 | 等于 this |
| `event.pageX / pageY` | 鼠标相对文档的坐标 | 用于拖拽定位 |
| `event.which` | 按键编码 | 13=回车，27=Esc |
| `event.preventDefault()` | 阻止默认行为 | 阻止链接跳转 |
| `event.stopPropagation()` | 阻止事件冒泡 | 防止触发父元素事件 |

---

## 5 新手常见误区

### 误区 1："绑定事件后忘记阻止默认行为"

最典型的例子就是表单提交和链接跳转。

```javascript
// ❌ 错误：点击链接后页面会跳转，Ajax 请求可能来不及发送
$('#link').on('click', function() {
  $.get('/api/data', function(res) {
    console.log(res)
  })
})

// ✅ 正确：先阻止默认行为，再执行 Ajax
$('#link').on('click', function(event) {
  // 阻止链接的默认跳转行为
  event.preventDefault()
  // 然后再执行 Ajax 请求
  $.get('/api/data', function(res) {
    console.log(res)
  })
})
```

### 误区 2："this 和 event.target 是一回事"

**不一样！** 在事件委托中，它们指向不同的元素。

```javascript
// 假设 HTML：
// <ul id="list">
//   <li>苹果 <span>（打折）</span></li>
// </ul>

// 事件委托中：
$('#list').on('click', 'li', function(event) {
  // this（或 event.currentTarget）：绑定事件的元素，即 li
  console.log($(this).text())  // 输出："苹果 （打折）"

  // event.target：实际被点击的元素
  // 如果点击的是 span，event.target 就是 span
  console.log($(event.target).text())  // 可能输出："（打折）"
})
```

### 误区 3："事件冒泡都是坏事"

**不是！** 事件冒泡是事件委托的基础。没有冒泡，事件委托就无法工作。

```javascript
// ❌ 错误理解：一看到冒泡就阻止
$('#inner').on('click', function(event) {
  event.stopPropagation()  // 不一定需要阻止
})

// ✅ 正确理解：只在确实不需要父元素响应时才阻止
// 比如弹窗里的关闭按钮，不希望点击关闭时触发弹窗本身的点击事件
$('#closeBtn').on('click', function(event) {
  $('#dialog').hide()
  // 这里需要阻止冒泡，否则外层 dialog 的点击事件也会触发
  event.stopPropagation()
})
```

### 误区 4："给动态创建的元素绑定事件要重新绑定"

不需要！使用事件委托就能自动处理动态创建的元素。

```javascript
// ❌ 错误：先创建元素，再绑定事件，新元素没有事件
var $newLi = $('<li>新元素</li>')
$('#list').append($newLi)
$newLi.on('click', function() {  // 每次创建都要绑定，很麻烦
  console.log('点击了')
})

// ✅ 正确：使用事件委托，一劳永逸
$('#list').on('click', 'li', function() {
  // 不管是原有的还是后来新增的 li，都能响应点击
  console.log('点击了：' + $(this).text())
})
// 之后再新增 li，不需要额外绑定事件
$('#list').append('<li>新元素</li>')
```

### 误区 5："on() 的第二个参数可以随便传"

**注意！** 第二个参数是选择器字符串，不是 jQuery 对象。

```javascript
// ❌ 错误：传入了 jQuery 对象
var $li = $('li')
$('#list').on('click', $li, function() {  // 不会生效
  console.log('点击了')
})

// ✅ 正确：传入选择器字符串
$('#list').on('click', 'li', function() {
  console.log('点击了')
})
```

---

## 6 动手练习

### 练习 1：基础练习 - 点击按钮显示隐藏

创建一个按钮和一个 div，点击按钮时切换 div 的显示/隐藏状态。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    #box {
      width: 200px;
      height: 100px;
      background-color: #007bff;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <!-- 切换按钮 -->
  <button id="toggleBtn">显示/隐藏</button>
  <!-- 要切换显示/隐藏的 div -->
  <div id="box">我是内容区域</div>

  <script>
    $(function() {
      // 给按钮绑定点击事件
      $('#toggleBtn').on('click', function() {
        // toggle() 方法可以切换元素的显示/隐藏状态
        $('#box').toggle()
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 2：进阶练习 - 事件委托实现列表操作

创建一个 ul 列表，包含 5 个 li。点击 li 时高亮显示（背景变蓝），点击 li 上的删除按钮可以删除该项。然后通过按钮可以新增 li，新增的 li 也要有同样的功能。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    li {
      padding: 10px;
      margin: 5px 0;
      background-color: #f0f0f0;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    /* 高亮样式 */
    li.active {
      background-color: #007bff;
      color: white;
    }
    /* 删除按钮样式 */
    .del-btn {
      background-color: red;
      color: white;
      border: none;
      padding: 2px 8px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <!-- 列表容器 -->
  <ul id="list">
    <li>苹果 <button class="del-btn">删除</button></li>
    <li>香蕉 <button class="del-btn">删除</button></li>
    <li>橘子 <button class="del-btn">删除</button></li>
    <li>葡萄 <button class="del-btn">删除</button></li>
    <li>西瓜 <button class="del-btn">删除</button></li>
  </ul>
  <!-- 添加按钮和输入框 -->
  <input type="text" id="newItem" placeholder="输入新内容">
  <button id="addBtn">添加</button>

  <script>
    $(function() {
      // 使用事件委托：点击 li 时高亮
      // 注意：用 on 的第二个参数指定 li，这样动态添加的 li 也能响应
      $('#list').on('click', 'li', function() {
        // 先移除所有 li 的高亮
        $('#list li').removeClass('active')
        // 给当前点击的 li 添加高亮
        $(this).addClass('active')
      })

      // 使用事件委托：点击删除按钮时删除对应的 li
      // 阻止事件冒泡到 li，避免同时触发高亮
      $('#list').on('click', '.del-btn', function(event) {
        // 阻止冒泡，防止触发 li 的点击事件
        event.stopPropagation()
        // 找到删除按钮所在的 li 并移除
        $(this).parent('li').remove()
      })

      // 添加新项
      $('#addBtn').on('click', function() {
        // 获取输入框的值
        var text = $('#newItem').val()
        // 如果输入为空，不添加
        if (text === '') return
        // 创建新的 li 元素，包含删除按钮
        var $newLi = $('<li></li>').text(text + ' ')
          .append('<button class="del-btn">删除</button>')
        // 添加到列表中
        $('#list').append($newLi)
        // 清空输入框
        $('#newItem').val('')
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习 - 双击编辑功能

创建一个列表，单击 li 时高亮，双击 li 时变成可编辑的输入框，按回车或失去焦点时保存修改。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    li {
      padding: 10px;
      margin: 5px 0;
      background-color: #f0f0f0;
      cursor: pointer;
      list-style: none;
    }
    /* 高亮样式 */
    li.active {
      background-color: #007bff;
      color: white;
    }
    /* 编辑状态的输入框样式 */
    li input {
      width: 90%;
      padding: 5px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <h3>双击编辑，单击高亮</h3>
  <ul id="list">
    <li>苹果</li>
    <li>香蕉</li>
    <li>橘子</li>
  </ul>

  <script>
    $(function() {
      // 单击高亮：使用事件委托
      $('#list').on('click', 'li', function() {
        // 移除所有 li 的高亮
        $('#list li').removeClass('active')
        // 当前 li 高亮
        $(this).addClass('active')
      })

      // 双击编辑：使用事件委托
      $('#list').on('dblclick', 'li', function() {
        // 获取当前 li 的文字内容
        var originalText = $(this).text()
        // 创建输入框，值为当前文字
        var $input = $('<input type="text">').val(originalText)
        // 清空 li 内容，放入输入框
        $(this).html($input)
        // 让输入框自动获得焦点
        $input.focus()
        // 选中输入框中的文字，方便编辑
        $input.select()

        // 按回车键保存
        $input.on('keydown', function(event) {
          if (event.which === 13) {
            // 13 是回车键
            // 获取输入框的新值
            var newText = $(this).val()
            // 把 li 的内容改回文字
            $(this).parent().text(newText)
          }
        })

        // 失去焦点时也保存
        $input.on('blur', function() {
          var newText = $(this).val()
          $(this).parent().text(newText)
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

下一章我们会学习 **jQuery 动画效果** —— 让页面元素"动"起来。你会学到如何用 show/hide 做显隐动画、用 fadeIn/fadeOut 做淡入淡出、用 slideUp/slideDown 做滑动效果，还能用 animate() 自定义动画。掌握了动画，你的网页就能告别生硬，变得生动有趣。
