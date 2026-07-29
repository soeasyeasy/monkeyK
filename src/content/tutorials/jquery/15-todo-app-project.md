---
title: "第十五章：实战项目 - 待办事项应用"
description: "用 jQuery 开发完整的待办事项应用，掌握实际开发技巧"
---

# 第十五章：实战项目 - 待办事项应用

## 本章导读

在学这一章之前，你可能会有这些疑问：

- jQuery 能开发完整的项目吗？
- 如何组织一个 jQuery 项目的代码结构？
- 实际开发中会遇到哪些问题？

这一章就是为了解答这些问题。我们会从零开始，开发一个功能完整的待办事项应用，涵盖需求分析、代码组织、功能实现、性能优化等完整流程。

---

## 1 项目需求分析

### 功能需求

我们要开发的待办事项应用包含以下功能：

**基础功能**：
- 添加待办事项
- 标记完成/未完成
- 删除待办事项
- 清空已完成事项

**进阶功能**：
- 本地存储（刷新不丢失）
- 筛选功能（全部/未完成/已完成）
- 统计待办数量
- 双击编辑待办内容

**用户体验**：
- 回车键快速添加
- 动画效果（添加/删除）
- 空状态提示
- 响应式布局

### 技术选型

| 技术 | 用途 | 版本 |
| --- | --- | --- |
| jQuery | DOM 操作和事件处理 | 3.7.1 |
| HTML5 | 页面结构 | - |
| CSS3 | 样式和动画 | - |
| localStorage | 数据持久化 | - |

---

## 2 项目结构

### 文件组织

```
todo-app/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   ├── app.js          # 主应用逻辑
│   ├── storage.js      # 本地存储模块
│   └── utils.js        # 工具函数
└── README.md           # 项目说明
```

### 代码组织原则

```javascript
// ✅ 模块化组织代码
// storage.js - 负责数据存储
var Storage = {
  get: function(key) {
    // 从 localStorage 获取数据
  },
  set: function(key, value) {
    // 保存到 localStorage
  }
}

// utils.js - 工具函数
var Utils = {
  generateId: function() {
    // 生成唯一 ID
  },
  formatDate: function(date) {
    // 格式化日期
  }
}

// app.js - 主应用逻辑
var App = {
  init: function() {
    // 初始化应用
  },
  bindEvents: function() {
    // 绑定事件
  },
  render: function() {
    // 渲染界面
  }
}
```

---

## 3 HTML 结构

### 完整 HTML

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>待办事项应用</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div class="container">
    <!-- 标题区域 -->
    <header class="header">
      <h1>我的待办事项</h1>
      <p class="subtitle">高效管理你的每一天</p>
    </header>

    <!-- 输入区域 -->
    <div class="input-section">
      <input 
        type="text" 
        id="todoInput" 
        class="todo-input" 
        placeholder="输入待办事项，按回车添加..."
        autocomplete="off"
      >
      <button id="addBtn" class="add-btn">添加</button>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <div class="filter-buttons">
        <button class="filter-btn active" data-filter="all">全部</button>
        <button class="filter-btn" data-filter="active">未完成</button>
        <button class="filter-btn" data-filter="completed">已完成</button>
      </div>
      <div class="stats">
        <span id="todoCount">0</span> 项待办
      </div>
    </div>

    <!-- 待办列表 -->
    <ul id="todoList" class="todo-list">
      <!-- 待办项会通过 JavaScript 动态添加 -->
    </ul>

    <!-- 空状态 -->
    <div id="emptyState" class="empty-state">
      <p>暂无待办事项</p>
      <p class="empty-hint">添加一个待办开始吧！</p>
    </div>

    <!-- 操作按钮 -->
    <div class="actions">
      <button id="clearCompletedBtn" class="clear-btn">清空已完成</button>
    </div>
  </div>

  <!-- 引入 jQuery -->
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <!-- 引入应用脚本 -->
  <script src="js/storage.js"></script>
  <script src="js/utils.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

---

## 4 CSS 样式

### 完整样式

```css
/* style.css */

/* 重置样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

/* 容器 */
.container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

/* 标题区域 */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  text-align: center;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  opacity: 0.9;
}

/* 输入区域 */
.input-section {
  display: flex;
  padding: 20px;
  gap: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.todo-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.todo-input:focus {
  outline: none;
  border-color: #667eea;
}

.add-btn {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.add-btn:hover {
  background: #5568d3;
}

/* 筛选区域 */
.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.filter-buttons {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 6px 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-btn:hover {
  background: #f0f0f0;
}

.filter-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.stats {
  font-size: 14px;
  color: #666;
}

/* 待办列表 */
.todo-list {
  list-style: none;
  max-height: 400px;
  overflow-y: auto;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.todo-item:hover {
  background: #f8f9fa;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: #999;
}

/* 复选框 */
.todo-checkbox {
  width: 20px;
  height: 20px;
  margin-right: 12px;
  cursor: pointer;
}

/* 待办文本 */
.todo-text {
  flex: 1;
  font-size: 16px;
  color: #333;
}

/* 编辑输入框 */
.todo-edit-input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #667eea;
  border-radius: 6px;
  font-size: 16px;
}

/* 删除按钮 */
.delete-btn {
  padding: 6px 12px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.todo-item:hover .delete-btn {
  opacity: 1;
}

/* 空状态 */
.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #999;
  display: none;
}

.empty-state.show {
  display: block;
}

.empty-hint {
  font-size: 14px;
  margin-top: 8px;
  color: #bbb;
}

/* 操作按钮 */
.actions {
  padding: 20px;
  text-align: center;
  border-top: 1px solid #e0e0e0;
}

.clear-btn {
  padding: 10px 20px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.clear-btn:hover {
  background: #ee5a6f;
}

/* 响应式 */
@media (max-width: 600px) {
  .container {
    border-radius: 0;
  }
  
  .input-section {
    flex-direction: column;
  }
  
  .filter-section {
    flex-direction: column;
    gap: 10px;
  }
}
```

---

## 5 JavaScript 实现

### storage.js - 本地存储模块

```javascript
// storage.js

var Storage = (function() {
  // 存储键名
  var STORAGE_KEY = 'todo_app_data'
  
  // 获取数据
  function getTodos() {
    // 从 localStorage 获取数据
    var data = localStorage.getItem(STORAGE_KEY)
    
    // 如果有数据，解析并返回；否则返回空数组
    return data ? JSON.parse(data) : []
  }
  
  // 保存数据
  function saveTodos(todos) {
    // 将数据转换为 JSON 字符串并保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }
  
  // 返回公共接口
  return {
    get: getTodos,
    set: saveTodos
  }
})()
```

### utils.js - 工具函数

```javascript
// utils.js

var Utils = (function() {
  // 生成唯一 ID
  function generateId() {
    // 使用时间戳 + 随机数生成唯一 ID
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
  
  // 格式化日期
  function formatDate(timestamp) {
    var date = new Date(timestamp)
    var year = date.getFullYear()
    var month = String(date.getMonth() + 1).padStart(2, '0')
    var day = String(date.getDate()).padStart(2, '0')
    var hours = String(date.getHours()).padStart(2, '0')
    var minutes = String(date.getMinutes()).padStart(2, '0')
    
    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes
  }
  
  // 转义 HTML（防止 XSS）
  function escapeHtml(text) {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    
    return text.replace(/[&<>"']/g, function(m) { return map[m] })
  }
  
  // 返回公共接口
  return {
    generateId: generateId,
    formatDate: formatDate,
    escapeHtml: escapeHtml
  }
})()
```

### app.js - 主应用逻辑

```javascript
// app.js

var App = (function($) {
  // 应用状态
  var state = {
    todos: [],           // 所有待办事项
    currentFilter: 'all' // 当前筛选条件
  }
  
  // 初始化应用
  function init() {
    // 从本地存储加载数据
    state.todos = Storage.get()
    
    // 绑定事件
    bindEvents()
    
    // 渲染界面
    render()
    
    // 聚焦输入框
    $('#todoInput').focus()
  }
  
  // 绑定事件
  function bindEvents() {
    // 添加待办（点击按钮）
    $('#addBtn').on('click', function() {
      addTodo()
    })
    
    // 添加待办（回车键）
    $('#todoInput').on('keypress', function(e) {
      if (e.which === 13) {
        addTodo()
      }
    })
    
    // 筛选按钮
    $('.filter-btn').on('click', function() {
      var filter = $(this).data('filter')
      setFilter(filter)
    })
    
    // 清空已完成
    $('#clearCompletedBtn').on('click', function() {
      clearCompleted()
    })
    
    // 待办列表事件委托
    $('#todoList').on('click', '.todo-checkbox', function() {
      var id = $(this).closest('.todo-item').data('id')
      toggleTodo(id)
    })
    
    $('#todoList').on('click', '.delete-btn', function() {
      var id = $(this).closest('.todo-item').data('id')
      deleteTodo(id)
    })
    
    // 双击编辑
    $('#todoList').on('dblclick', '.todo-text', function() {
      var $item = $(this).closest('.todo-item')
      var id = $item.data('id')
      startEdit(id)
    })
    
    // 编辑完成（回车或失焦）
    $('#todoList').on('keypress blur', '.todo-edit-input', function(e) {
      if (e.type === 'keypress' && e.which !== 13) return
      
      var $item = $(this).closest('.todo-item')
      var id = $item.data('id')
      var newText = $(this).val().trim()
      
      finishEdit(id, newText)
    })
  }
  
  // 添加待办
  function addTodo() {
    var $input = $('#todoInput')
    var text = $input.val().trim()
    
    // 验证输入
    if (!text) {
      $input.focus()
      return
    }
    
    // 创建新的待办对象
    var todo = {
      id: Utils.generateId(),
      text: text,
      completed: false,
      createdAt: Date.now()
    }
    
    // 添加到数组开头
    state.todos.unshift(todo)
    
    // 保存到本地存储
    Storage.set(state.todos)
    
    // 清空输入框
    $input.val('')
    
    // 重新渲染
    render()
    
    // 聚焦输入框
    $input.focus()
  }
  
  // 切换完成状态
  function toggleTodo(id) {
    // 找到对应的待办
    var todo = state.todos.find(function(t) { return t.id === id })
    
    if (todo) {
      // 切换完成状态
      todo.completed = !todo.completed
      
      // 保存
      Storage.set(state.todos)
      
      // 重新渲染
      render()
    }
  }
  
  // 删除待办
  function deleteTodo(id) {
    // 添加删除动画
    var $item = $('.todo-item[data-id="' + id + '"]')
    
    $item.slideUp(300, function() {
      // 动画完成后，从数组中移除
      state.todos = state.todos.filter(function(t) { return t.id !== id })
      
      // 保存
      Storage.set(state.todos)
      
      // 重新渲染
      render()
    })
  }
  
  // 开始编辑
  function startEdit(id) {
    var $item = $('.todo-item[data-id="' + id + '"]')
    var todo = state.todos.find(function(t) { return t.id === id })
    
    if (!todo) return
    
    // 替换文本为输入框
    var $input = $('<input type="text" class="todo-edit-input">')
    $input.val(todo.text)
    
    $item.find('.todo-text').replaceWith($input)
    $input.focus().select()
  }
  
  // 完成编辑
  function finishEdit(id, newText) {
    if (!newText) {
      // 如果为空，恢复原文
      render()
      return
    }
    
    // 更新待办文本
    var todo = state.todos.find(function(t) { return t.id === id })
    
    if (todo && todo.text !== newText) {
      todo.text = newText
      
      // 保存
      Storage.set(state.todos)
    }
    
    // 重新渲染
    render()
  }
  
  // 设置筛选条件
  function setFilter(filter) {
    state.currentFilter = filter
    
    // 更新按钮状态
    $('.filter-btn').removeClass('active')
    $('.filter-btn[data-filter="' + filter + '"]').addClass('active')
    
    // 重新渲染
    render()
  }
  
  // 清空已完成
  function clearCompleted() {
    // 过滤出未完成的待办
    state.todos = state.todos.filter(function(t) { return !t.completed })
    
    // 保存
    Storage.set(state.todos)
    
    // 重新渲染
    render()
  }
  
  // 渲染界面
  function render() {
    // 根据筛选条件过滤待办
    var filteredTodos
    
    if (state.currentFilter === 'active') {
      filteredTodos = state.todos.filter(function(t) { return !t.completed })
    } else if (state.currentFilter === 'completed') {
      filteredTodos = state.todos.filter(function(t) { return t.completed })
    } else {
      filteredTodos = state.todos
    }
    
    // 渲染列表
    var $list = $('#todoList')
    $list.empty()
    
    if (filteredTodos.length === 0) {
      // 显示空状态
      $('#emptyState').addClass('show')
      $list.hide()
    } else {
      // 隐藏空状态
      $('#emptyState').removeClass('show')
      $list.show()
      
      // 渲染每个待办
      filteredTodos.forEach(function(todo) {
        var $item = createTodoItem(todo)
        $list.append($item)
      })
    }
    
    // 更新统计
    var activeCount = state.todos.filter(function(t) { return !t.completed }).length
    $('#todoCount').text(activeCount)
    
    // 更新清空按钮状态
    var hasCompleted = state.todos.some(function(t) { return t.completed })
    $('#clearCompletedBtn').prop('disabled', !hasCompleted)
  }
  
  // 创建待办项 DOM
  function createTodoItem(todo) {
    var $item = $('<li class="todo-item"></li>')
    $item.attr('data-id', todo.id)
    
    if (todo.completed) {
      $item.addClass('completed')
    }
    
    // 复选框
    var $checkbox = $('<input type="checkbox" class="todo-checkbox">')
    $checkbox.prop('checked', todo.completed)
    
    // 文本
    var $text = $('<span class="todo-text"></span>')
    $text.text(todo.text)
    
    // 删除按钮
    var $deleteBtn = $('<button class="delete-btn">删除</button>')
    
    // 组装
    $item.append($checkbox, $text, $deleteBtn)
    
    return $item
  }
  
  // 返回公共接口
  return {
    init: init
  }
})(jQuery)

// 页面加载完成后初始化
$(function() {
  App.init()
})
```

---

## 6 功能演示

### 基础功能

1. **添加待办**：输入内容，点击"添加"按钮或按回车键
2. **标记完成**：点击复选框切换完成状态
3. **删除待办**：鼠标悬停时显示"删除"按钮，点击删除
4. **编辑待办**：双击待办文本进入编辑模式，按回车或失焦保存

### 进阶功能

1. **筛选**：点击"全部/未完成/已完成"切换视图
2. **清空已完成**：点击"清空已完成"按钮删除所有已完成项
3. **本地存储**：数据自动保存，刷新页面不丢失
4. **统计**：实时显示未完成待办数量

---

## 7 代码优化技巧

### 1. 使用事件委托

```javascript
// ✅ 推荐：事件委托
$('#todoList').on('click', '.delete-btn', function() {
  var id = $(this).closest('.todo-item').data('id')
  deleteTodo(id)
})

// ❌ 不推荐：直接绑定
$('.delete-btn').on('click', function() {
  // 新添加的元素不会生效
})
```

### 2. 批量 DOM 操作

```javascript
// ✅ 推荐：批量构建后插入
var $fragment = $('<div></div>')
todos.forEach(function(todo) {
  $fragment.append(createTodoItem(todo))
})
$list.html($fragment.html())

// ❌ 不推荐：循环中逐个插入
todos.forEach(function(todo) {
  $list.append(createTodoItem(todo))
})
```

### 3. 缓存 jQuery 对象

```javascript
// ✅ 推荐：缓存
var $input = $('#todoInput')
$input.val('')
$input.focus()

// ❌ 不推荐：重复查询
$('#todoInput').val('')
$('#todoInput').focus()
```

---

## 8 新手常见误区

### 误区 1："代码能跑就行，不需要模块化"

**错误！** 模块化让代码更易维护。

```javascript
// ❌ 错误：所有代码写在一起
$(function() {
  var todos = []
  
  $('#addBtn').click(function() {
    // 添加逻辑
  })
  
  // ... 几百行代码
})

// ✅ 正确：模块化组织
var Storage = { /* ... */ }
var Utils = { /* ... */ }
var App = { /* ... */ }
```

### 误区 2："不需要处理 XSS"

**错误！** 用户输入可能包含恶意代码。

```javascript
// ❌ 错误：直接插入用户输入
$list.html('<li>' + userInput + '</li>')

// ✅ 正确：转义 HTML
$list.html('<li>' + Utils.escapeHtml(userInput) + '</li>')
```

### 误区 3："本地存储不需要错误处理"

**不是！** localStorage 可能不可用。

```javascript
// ✅ 推荐：添加错误处理
function saveTodos(todos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  } catch (e) {
    console.error('保存失败：', e)
    alert('存储空间不足，请清理浏览器数据')
  }
}
```

---

## 9 动手练习

### 练习 1：基础练习 - 添加优先级

为待办事项添加优先级功能：
1. 添加优先级选择（高/中/低）
2. 不同优先级显示不同颜色
3. 可以按优先级排序

<details>
<summary>点击查看答案</summary>

```javascript
// 修改 todo 对象结构
var todo = {
  id: Utils.generateId(),
  text: text,
  priority: $('#prioritySelect').val(), // 高/中/低
  completed: false,
  createdAt: Date.now()
}

// CSS 添加优先级样式
.todo-item.priority-high { border-left: 4px solid #ff4757; }
.todo-item.priority-medium { border-left: 4px solid #ffa502; }
.todo-item.priority-low { border-left: 4px solid #2ed573; }

// 排序功能
function sortByPriority() {
  var priorityOrder = { high: 1, medium: 2, low: 3 }
  state.todos.sort(function(a, b) {
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}
```

</details>

### 练习 2：进阶练习 - 添加到期时间

为待办事项添加到期时间功能：
1. 添加日期选择器
2. 显示剩余时间
3. 过期提醒（红色标记）

<details>
<summary>点击查看答案</summary>

```javascript
// HTML 添加日期输入
<input type="date" id="dueDateInput" class="due-date-input">

// 修改 todo 对象
var todo = {
  id: Utils.generateId(),
  text: text,
  dueDate: $('#dueDateInput').val(), // 到期时间
  completed: false,
  createdAt: Date.now()
}

// 显示剩余时间
function getRemainingTime(dueDate) {
  var now = new Date()
  var due = new Date(dueDate)
  var diff = due - now
  
  if (diff < 0) return '已过期'
  
  var days = Math.floor(diff / (1000 * 60 * 60 * 24))
  return days + '天后到期'
}

// CSS 过期样式
.todo-item.overdue { background-color: #ffe0e0; }
```

</details>

### 练习 3（挑战）：综合练习 - 添加拖拽排序

实现拖拽排序功能，让用户可以拖动调整待办顺序。

<details>
<summary>点击查看答案</summary>

```javascript
// 使用 HTML5 Drag and Drop API
var draggedItem = null

$('#todoList').on('dragstart', '.todo-item', function(e) {
  draggedItem = this
  $(this).addClass('dragging')
})

$('#todoList').on('dragover', '.todo-item', function(e) {
  e.preventDefault()
  
  var $this = $(this)
  var targetPos = $this.offset().top + $this.outerHeight() / 2
  
  if (e.pageY < targetPos) {
    $(draggedItem).insertBefore(this)
  } else {
    $(draggedItem).insertAfter(this)
  }
})

$('#todoList').on('dragend', '.todo-item', function() {
  $(this).removeClass('dragging')
  
  // 更新 state.todos 顺序
  var newOrder = []
  $('.todo-item').each(function() {
    var id = $(this).data('id')
    var todo = state.todos.find(function(t) { return t.id === id })
    if (todo) newOrder.push(todo)
  })
  
  state.todos = newOrder
  Storage.set(state.todos)
})

// HTML 添加 draggable 属性
<li class="todo-item" draggable="true">
```

</details>

---

## 下一章预告

下一章我们会学习 **实战项目：图片轮播组件** —— 用 jQuery 封装一个可复用的图片轮播组件。你会学到组件化开发思想、动画控制、响应式设计等实用技巧。
