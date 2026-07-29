---
title: "第十一章：jQuery UI 组件库"
description: "使用 jQuery UI 提供的交互组件和小部件，快速构建丰富界面"
---

# 第十一章：jQuery UI 组件库

## 本章导读

在学这一章之前，你可能会有这些疑问：

- jQuery UI 是什么？和 jQuery 有什么关系？
- jQuery UI 提供了哪些组件？
- 怎么使用这些组件？

这一章就是为了解答这些问题。jQuery UI 是 jQuery 的官方 UI 组件库，提供了丰富的交互组件。

---

## 1 为什么需要 jQuery UI？

### 痛点分析

实现复杂的 UI 交互很费时：

- 拖拽排序：要处理鼠标事件、位置计算、DOM 移动
- 日期选择器：要处理日历逻辑、日期计算
- 自动补全：要处理键盘事件、数据匹配、下拉展示

### jQuery UI 的方案

jQuery UI 把这些常用交互封装成了开箱即用的组件。

```javascript
// 一行代码实现拖拽
$('#box').draggable()

// 一行代码实现日期选择
$('#date').datepicker()

// 一行代码实现自动补全
$('#search').autocomplete({ source: ['Apple', 'Banana', 'Orange'] })
```

> **一句话总结**：jQuery UI 让你用最少的时间实现最复杂的交互。

---

## 2 核心原理

### jQuery UI 的组成

jQuery UI 包含三部分：

1. **交互组件（Interactions）**：拖拽、放置、缩放、选择、排序
2. **小部件（Widgets）**：日期选择器、自动补全、对话框、手风琴等
3. **效果库（Effects）**：高级动画效果、颜色动画、class 过渡

---

## 3 基础用法 + 逐行注释

### 引入 jQuery UI

```html
<!-- 引入 jQuery -->
<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>

<!-- 引入 jQuery UI JS -->
<script src="https://cdn.jsdelivr.net/npm/jquery-ui@1.13.2/dist/jquery-ui.min.js"></script>

<!-- 引入 jQuery UI CSS（主题样式） -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jquery-ui@1.13.2/themes/base/jquery-ui.min.css">
```

### 交互组件

```javascript
// ===== draggable() 拖拽 =====
// 让元素可以被拖拽
$('#box').draggable({
  axis: 'x',           // 只能水平拖（也可以 'y' 垂直）
  containment: 'parent', // 限制在父元素内
  revert: true,        // 松开后回到原位
  opacity: 0.7         // 拖拽时透明度
})

// ===== droppable() 放置 =====
// 定义可放置区域
$('#target').droppable({
  accept: '.draggable',  // 只接受 class 为 draggable 的元素
  drop: function(event, ui) {
    // 放置时的回调
    // ui.draggable 是被拖拽的元素
    ui.draggable.appendTo(this)
    console.log('放置成功')
  }
})

// ===== sortable() 排序 =====
// 让列表项可以拖拽排序
$('#sortable').sortable({
  update: function(event, ui) {
    // 排序改变时的回调
    var order = $(this).sortable('toArray')
    console.log('新顺序：', order)
  }
})

// ===== selectable() 选择 =====
// 让元素可以被框选
$('#selectable').selectable({
  selected: function(event, ui) {
    // 选中时的回调
    $(ui.selected).addClass('ui-selected')
  }
})

// ===== resizable() 缩放 =====
// 让元素可以拖拽改变大小
$('#box').resizable({
  minWidth: 100,
  minHeight: 100,
  maxWidth: 500,
  maxHeight: 500
})
```

### 小部件

```javascript
// ===== datepicker() 日期选择器 =====
$('#date').datepicker({
  dateFormat: 'yy-mm-dd',  // 日期格式
  changeMonth: true,        // 可以切换月份
  changeYear: true,         // 可以切换年份
  minDate: '2024-01-01',    // 最小日期
  maxDate: '2025-12-31',    // 最大日期
  onSelect: function(dateText) {
    console.log('选择了：' + dateText)
  }
})

// ===== autocomplete() 自动补全 =====
$('#search').autocomplete({
  source: ['Apple', 'Banana', 'Cherry', 'Date', 'Grape'],
  minLength: 1,  // 最少输入 1 个字符触发
  select: function(event, ui) {
    console.log('选择了：' + ui.item.value)
  }
})

// 也可以从远程获取数据
$('#search').autocomplete({
  source: function(request, response) {
    // request.term 是用户输入的关键词
    $.get('/api/search', { keyword: request.term }, function(data) {
      // response 回调传入数据数组
      response(data)
    })
  }
})

// ===== dialog() 对话框 =====
$('#dialog').dialog({
  autoOpen: false,     // 不自动打开
  modal: true,         // 模态对话框（遮罩层）
  title: '提示',
  buttons: {
    '确定': function() {
      console.log('点击了确定')
      $(this).dialog('close')
    },
    '取消': function() {
      $(this).dialog('close')
    }
  }
})

// 打开对话框
$('#openBtn').click(function() {
  $('#dialog').dialog('open')
})

// ===== accordion() 手风琴 =====
$('#accordion').accordion({
  collapsible: true,   // 可以全部折叠
  active: 0,           // 默认展开第一个
  heightStyle: 'content'  // 高度由内容决定
})

// ===== tabs() 选项卡 =====
$('#tabs').tabs({
  active: 0,  // 默认激活第一个
  activate: function(event, ui) {
    console.log('切换到：' + ui.newTab.text())
  }
})

// ===== menu() 菜单 =====
$('#menu').menu()

// ===== progressbar() 进度条 =====
$('#progress').progressbar({
  value: 50  // 初始进度 50%
})

// 更新进度
$('#progress').progressbar('value', 80)

// ===== slider() 滑块 =====
$('#slider').slider({
  min: 0,
  max: 100,
  value: 50,
  slide: function(event, ui) {
    console.log('当前值：' + ui.value)
  }
})

// ===== spinner() 数字微调器 =====
$('#spinner').spinner({
  min: 0,
  max: 100,
  step: 1,
  spin: function(event, ui) {
    console.log('当前值：' + ui.value)
  }
})

// ===== tooltip() 提示 =====
$('#element').tooltip({
  content: '这是提示文字',
  position: {
    my: 'center bottom',
    at: 'center top'
  }
})
```

### 效果库

```javascript
// ===== 高级动画效果 =====
// 使用 effect() 方法应用效果

// 弹跳效果
$('#box').effect('bounce', { times: 3 }, 500)

// 抖动效果
$('#box').effect('shake', { times: 3 }, 300)

// 爆炸效果
$('#box').effect('explode', { pieces: 16 }, 500)

// 折叠效果
$('#box').effect('fold', { size: 30 }, 500)


// ===== toggleClass 动画 =====
// 切换 class 时带动画过渡
$('#box').toggleClass('highlight', 500)

// ===== switchClass =====
// 从一个 class 过渡到另一个
$('#box').switchClass('old-class', 'new-class', 500)
```

---

## 4 对比表格

| 组件 | 用途 | 常用配置 |
| --- | --- | --- |
| `draggable()` | 拖拽 | axis, containment |
| `droppable()` | 放置 | accept, drop 回调 |
| `sortable()` | 排序 | update 回调 |
| `datepicker()` | 日期选择 | dateFormat, minDate |
| `autocomplete()` | 自动补全 | source, minLength |
| `dialog()` | 对话框 | modal, buttons |
| `accordion()` | 手风琴 | collapsible |
| `tabs()` | 选项卡 | active |

---

## 5 新手常见误区

### 误区 1："jQuery UI 和 Bootstrap 冲突"

**可能冲突！** 两者都有 CSS 样式，可能互相覆盖。

```javascript
// 解决方案：
// 1. 只使用 jQuery UI 的 JS，不用它的 CSS
// 2. 使用 jQuery UI 的 CSS 子集构建工具，只打包需要的组件样式
// 3. 使用命名空间隔离
```

### 误区 2："jQuery UI 组件不需要初始化"

**需要！** 必须先调用初始化方法。

```javascript
// ❌ 错误：直接操作 DOM
$('#date').val('2024-01-01')  // 日期选择器不会更新

// ✅ 正确：用组件 API 操作
$('#date').datepicker('setDate', '2024-01-01')
```

### 误区 3："jQuery UI 已经过时了"

**看场景！** 新项目可能用 Vue/React 组件库更好，但维护老项目时 jQuery UI 仍然有用。

---

## 6 动手练习

### 练习 1：基础练习

用 jQuery UI 实现一个日期选择器，选择日期后在下方显示"你选择了：YYYY年MM月DD日"。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/jquery-ui@1.13.2/dist/jquery-ui.min.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jquery-ui@1.13.2/themes/base/jquery-ui.min.css">
</head>
<body>
  <label>选择日期：</label>
  <input type="text" id="datepicker">
  <p id="result"></p>

  <script>
    $(function() {
      // 初始化日期选择器
      $('#datepicker').datepicker({
        dateFormat: 'yy-mm-dd',
        changeMonth: true,
        changeYear: true,
        // 选择日期后的回调
        onSelect: function(dateText) {
          // 解析日期
          var parts = dateText.split('-')
          var year = parts[0]
          var month = parts[1]
          var day = parts[2]
          // 显示格式化后的日期
          $('#result').text('你选择了：' + year + '年' + month + '月' + day + '日')
        }
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 2：进阶练习

用 jQuery UI 实现一个可拖拽排序的列表，排序完成后输出新的顺序。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/jquery-ui@1.13.2/dist/jquery-ui.min.js"></script>
  <style>
    #sortable { list-style: none; padding: 0; width: 300px; }
    #sortable li { margin: 3px; padding: 10px; background: #007bff; color: white; cursor: move; }
    #sortable li.ui-sortable-helper { opacity: 0.8; }
  </style>
</head>
<body>
  <ul id="sortable">
    <li data-id="1">项目 1</li>
    <li data-id="2">项目 2</li>
    <li data-id="3">项目 3</li>
    <li data-id="4">项目 4</li>
    <li data-id="5">项目 5</li>
  </ul>
  <p id="order"></p>

  <script>
    $(function() {
      // 初始化排序组件
      $('#sortable').sortable({
        // 排序更新时的回调
        update: function() {
          // 获取新的顺序
          var order = []
          $('#sortable li').each(function() {
            order.push($(this).data('id'))
          })
          // 显示顺序
          $('#order').text('当前顺序：' + order.join(', '))
        }
      })
      // 禁止文本选中（优化拖拽体验）
      $('#sortable').disableSelection()
    })
  </script>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习

用 jQuery UI 实现一个"任务管理面板"：包含选项卡（待办/已完成）、可排序的待办列表、对话框确认删除。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/jquery-ui@1.13.2/dist/jquery-ui.min.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jquery-ui@1.13.2/themes/base/jquery-ui.min.css">
  <style>
    .task-list { list-style: none; padding: 0; min-height: 100px; }
    .task-list li { padding: 10px; margin: 5px 0; background: #f0f0f0; cursor: move; }
    .task-list li .del-btn { float: right; color: red; cursor: pointer; }
    .done-list li { text-decoration: line-through; color: gray; }
  </style>
</head>
<body>
  <div id="tabs">
    <ul>
      <li><a href="#tab-todo">待办</a></li>
      <li><a href="#tab-done">已完成</a></li>
    </ul>
    <div id="tab-todo">
      <ul class="task-list" id="todoList">
        <li data-id="1">任务 1 <span class="del-btn">删除</span> <span class="done-btn">完成</span></li>
        <li data-id="2">任务 2 <span class="del-btn">删除</span> <span class="done-btn">完成</span></li>
        <li data-id="3">任务 3 <span class="del-btn">删除</span> <span class="done-btn">完成</span></li>
      </ul>
    </div>
    <div id="tab-done">
      <ul class="task-list done-list" id="doneList"></ul>
    </div>
  </div>

  <!-- 确认对话框 -->
  <div id="confirmDialog" title="确认删除">
    <p>确定要删除这个任务吗？</p>
  </div>

  <script>
    $(function() {
      // 初始化选项卡
      $('#tabs').tabs()

      // 初始化排序
      $('#todoList, #doneList').sortable({
        connectWith: '.task-list'  // 可以在两个列表间拖拽
      })

      // 初始化对话框
      $('#confirmDialog').dialog({
        autoOpen: false,
        modal: true,
        buttons: {
          '确定': function() {
            // 获取要删除的元素
            var $task = $(this).data('task')
            $task.remove()
            $(this).dialog('close')
          },
          '取消': function() {
            $(this).dialog('close')
          }
        }
      })

      // 删除按钮（事件委托）
      $('#todoList').on('click', '.del-btn', function() {
        var $task = $(this).parent()
        // 将任务元素存储到对话框
        $('#confirmDialog').data('task', $task)
        // 打开确认对话框
        $('#confirmDialog').dialog('open')
      })

      // 完成按钮
      $('#todoList').on('click', '.done-btn', function() {
        var $task = $(this).parent()
        // 移动到已完成列表
        $task.appendTo('#doneList')
      })
    })
  </script>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **jQuery 与 Vue/React 对比** —— 理解命令式和声明式编程的区别，以及为什么现代前端框架逐渐取代了 jQuery。
