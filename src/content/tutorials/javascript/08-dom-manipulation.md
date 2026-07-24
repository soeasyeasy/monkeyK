---
title: "第八章：DOM 操作"
description: "选择元素、修改内容、创建节点，掌握网页交互"
---

# 第八章：DOM 操作

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 DOM？为什么需要 DOM 操作？
- 怎么在 JavaScript 中选择 HTML 元素？
- 如何修改元素的内容和样式？
- 创建和删除元素有哪些方法？

这一章就是为了解答这些问题。我们会学习如何用 JavaScript 与网页进行交互。

---

## 8.1 为什么需要 DOM 操作？

### 痛点分析

想象一下，如果没有 DOM 操作，网页就是静态的：

```html
<!-- ❌ 静态网页：内容固定，无法动态变化 -->
<html>
<body>
  <h1>欢迎来到我的网站</h1>
  <p>当前时间：2024年1月1日</p>
</body>
</html>
```

时间永远显示"2024年1月1日"，用户点击按钮也不会有任何反应！

### 解决方案

用 DOM 操作让网页动态起来：

```javascript
// ✅ 动态更新时间
function updateTime() {
  const now = new Date()
  document.querySelector('p').textContent = `当前时间：${now.toLocaleString()}`
}

// 每秒更新一次
setInterval(updateTime, 1000)
```

> **一句话总结**：DOM 操作就像一把手术刀，可以精确地修改网页的任何部分。

---

## 8.2 核心原理

### DOM 的本质

DOM（Document Object Model）是浏览器把 HTML 文档解析成的**树形结构**。

打个比方：

> 想象你去参观一栋房子。
> - HTML 文档就像房子的蓝图
> - DOM 树就像实际盖好的房子
> - `document.querySelector('div')` 就像找到房子里的某个房间
> - 修改 DOM 就像装修房间（换家具、刷墙）

### DOM 树结构

```html
<html>
  <head>
    <title>我的网页</title>
  </head>
  <body>
    <h1>标题</h1>
    <p>段落</p>
  </body>
</html>
```

对应的 DOM 树：
```
document
└── html
    ├── head
    │   └── title
    └── body
        ├── h1
        └── p
```

---

## 8.3 选择元素

### querySelector（推荐）

`querySelector` 返回第一个匹配的元素：

```javascript
// 通过 CSS 选择器选择元素
const header = document.querySelector('#header')      // ID 选择器
const firstItem = document.querySelector('.item')    // 类选择器
const paragraph = document.querySelector('p')       // 标签选择器
const input = document.querySelector('input[type="text"]') // 属性选择器
```

### querySelectorAll

`querySelectorAll` 返回所有匹配的元素（NodeList）：

```javascript
// 获取所有类名为 item 的元素
const items = document.querySelectorAll('.item')

// 遍历 NodeList
items.forEach(item => {
  console.log(item.textContent)
})
```

### 其他选择方法

```javascript
// 通过 ID（返回单个元素）
const element = document.getElementById('myId')

// 通过类名（返回 HTMLCollection，不是数组）
const elements = document.getElementsByClassName('myClass')

// 通过标签名（返回 HTMLCollection）
const paragraphs = document.getElementsByTagName('p')
```

### 选择方法对比

| 方法 | 返回值 | 是否实时更新 | 推荐度 |
| --- | --- | --- | --- |
| `querySelector()` | 单个元素 | 否 | ✅ 推荐 |
| `querySelectorAll()` | NodeList | 否 | ✅ 推荐 |
| `getElementById()` | 单个元素 | 否 | ✅ 常用 |
| `getElementsByClassName()` | HTMLCollection | 是 | ❌ 不推荐 |
| `getElementsByTagName()` | HTMLCollection | 是 | ❌ 不推荐 |

---

## 8.4 修改内容

### textContent

`textContent` 设置或获取元素的纯文本内容：

```javascript
const element = document.querySelector('#title')

// 获取文本内容
console.log(element.textContent) // '原标题'

// 设置文本内容（会替换所有子元素）
element.textContent = '新标题'
```

### innerHTML

`innerHTML` 设置或获取元素的 HTML 内容：

```javascript
const element = document.querySelector('#content')

// 获取 HTML 内容
console.log(element.innerHTML) // '<p>段落</p>'

// 设置 HTML 内容（会解析 HTML 标签）
element.innerHTML = '<strong>加粗内容</strong>'
```

> **注意**：使用 `innerHTML` 时要小心 XSS 攻击，不要直接插入用户输入的内容。

### innerText

`innerText` 与 `textContent` 类似，但只获取可见文本：

```javascript
const element = document.querySelector('div')
element.innerHTML = '<span style="display:none">隐藏文本</span>可见文本'

console.log(element.textContent) // '隐藏文本可见文本'
console.log(element.innerText)   // '可见文本'
```

---

## 8.5 修改属性

### getAttribute / setAttribute

```javascript
const link = document.querySelector('a')

// 获取属性
const href = link.getAttribute('href')
console.log(href) // 'https://example.com'

// 设置属性
link.setAttribute('href', 'https://new-example.com')
link.setAttribute('target', '_blank')

// 移除属性
link.removeAttribute('target')
```

### 直接访问属性

```javascript
const link = document.querySelector('a')

// 直接访问标准属性
link.href = 'https://example.com'
link.id = 'main-link'
link.className = 'active'

// 获取 data-* 属性
const element = document.querySelector('[data-id]')
console.log(element.dataset.id) // 获取 data-id 属性值
```

---

## 8.6 修改样式

### 直接设置样式

```javascript
const element = document.querySelector('.box')

// 直接设置内联样式（使用驼峰命名）
element.style.backgroundColor = 'red'
element.style.color = 'white'
element.style.padding = '20px'
element.style.fontSize = '16px'

// 获取样式（只能获取内联样式）
console.log(element.style.backgroundColor) // 'red'
```

### classList

`classList` 用于管理 CSS 类：

```javascript
const element = document.querySelector('.box')

// 添加类
element.classList.add('active')

// 移除类
element.classList.remove('hidden')

// 切换类（存在则移除，不存在则添加）
element.classList.toggle('visible')

// 检查类是否存在
element.classList.contains('active') // true/false

// 替换类
element.classList.replace('old', 'new')
```

---

## 8.7 创建元素

```javascript
// 创建新元素
const div = document.createElement('div')

// 设置内容和属性
div.textContent = '新元素'
div.className = 'box'
div.id = 'new-box'

// 添加到页面（添加到 body 末尾）
document.body.appendChild(div)
```

---

## 8.8 插入元素

```javascript
const parent = document.querySelector('.container')
const child = document.querySelector('.item')

// 创建新元素
const newItem = document.createElement('div')
newItem.textContent = '新项目'

// append：末尾添加
parent.append(newItem)

// prepend：开头添加
parent.prepend(newItem)

// before：在指定元素之前添加
child.before(newItem)

// after：在指定元素之后添加
child.after(newItem)

// insertAdjacentHTML：直接插入 HTML 字符串
parent.insertAdjacentHTML('beforeend', '<div>新内容</div>')
```

### insertAdjacentHTML 的位置参数

| 参数 | 说明 |
| --- | --- |
| `'beforebegin'` | 元素之前 |
| `'afterbegin'` | 元素内部，第一个子元素之前 |
| `'beforeend'` | 元素内部，最后一个子元素之后 |
| `'afterend'` | 元素之后 |

---

## 8.9 删除元素

```javascript
const element = document.querySelector('.item')

// remove：直接删除（推荐）
element.remove()

// removeChild：通过父元素删除（旧方法）
const parent = element.parentNode
parent.removeChild(element)
```

---

## 8.10 遍历节点

```javascript
const parent = document.querySelector('.container')

// children：获取所有子元素（HTMLCollection）
for (const child of parent.children) {
  console.log(child)
}

// childNodes：获取所有子节点（包括文本节点和注释）
for (const node of parent.childNodes) {
  console.log(node)
}

// parentNode：获取父节点
const parentElement = element.parentNode

// nextElementSibling：获取下一个兄弟元素
const next = element.nextElementSibling

// previousElementSibling：获取上一个兄弟元素
const prev = element.previousElementSibling

// firstElementChild：获取第一个子元素
const first = parent.firstElementChild

// lastElementChild：获取最后一个子元素
const last = parent.lastElementChild
```

---

## 8.11 修改结构

### 克隆节点

```javascript
const parent = document.querySelector('.container')

// cloneNode(true)：深克隆（包含所有子元素）
const clone = parent.cloneNode(true)

// cloneNode(false)：浅克隆（只复制本身）
const shallowClone = parent.cloneNode(false)

// 添加克隆的元素到页面
document.body.appendChild(clone)
```

### 替换节点

```javascript
const oldElement = document.querySelector('.old')

// 创建新元素
const newElement = document.createElement('div')
newElement.textContent = '新元素'

// replaceChild：替换节点
const parent = oldElement.parentNode
parent.replaceChild(newElement, oldElement)

// replaceWith（更简洁）
oldElement.replaceWith(newElement)
```

---

## 8.12 获取尺寸和位置

```javascript
const element = document.querySelector('.box')

// 尺寸（包含边框和内边距）
console.log(element.offsetWidth)   // 宽度
console.log(element.offsetHeight)  // 高度

// 尺寸（只包含内边距，不含边框）
console.log(element.clientWidth)   // 宽度
console.log(element.clientHeight)  // 高度

// 位置（相对于父元素）
console.log(element.offsetTop)     // 顶部距离
console.log(element.offsetLeft)    // 左侧距离

// getBoundingClientRect：获取相对于视口的位置和尺寸
const rect = element.getBoundingClientRect()
console.log(rect.top)     // 顶部距离视口顶部
console.log(rect.left)    // 左侧距离视口左侧
console.log(rect.width)   // 宽度
console.log(rect.height)  // 高度
```

---

## 8.13 性能优化

### 使用 DocumentFragment

```javascript
// ❌ 不好：每次 append 都会触发重排
const ul = document.querySelector('ul')
for (let i = 0; i < 100; i++) {
  const li = document.createElement('li')
  li.textContent = `项目 ${i}`
  ul.appendChild(li)
}

// ✅ 好：使用 DocumentFragment，只触发一次重排
const fragment = document.createDocumentFragment()
for (let i = 0; i < 100; i++) {
  const li = document.createElement('li')
  li.textContent = `项目 ${i}`
  fragment.appendChild(li)
}
document.querySelector('ul').appendChild(fragment)
```

### 批量操作

```javascript
// ✅ 使用 innerHTML 批量操作（适合大量元素）
const items = Array.from({ length: 100 }, (_, i) => `<li>项目 ${i}</li>`)
document.querySelector('ul').innerHTML = items.join('')
```

---

## 8.14 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 选择元素 | `querySelector()`、`querySelectorAll()` |
| 修改内容 | `textContent`（纯文本）、`innerHTML`（HTML） |
| 修改属性 | `getAttribute()`、`setAttribute()`、直接访问 |
| 修改样式 | `style`（内联）、`classList`（类名） |
| 创建元素 | `createElement()` |
| 插入元素 | `append()`、`prepend()`、`before()`、`after()` |
| 删除元素 | `remove()`、`removeChild()` |
| 遍历节点 | `children`、`parentNode`、`nextElementSibling` |
| 获取尺寸 | `offsetWidth`、`clientWidth`、`getBoundingClientRect()` |

---

## 8.15 新手常见误区

### 误区 1：`innerHTML` 可以安全使用

**错！** `innerHTML` 会解析 HTML，可能导致 XSS 攻击。

```javascript
const userInput = '<script>alert("攻击")</script>'

// ❌ 危险：直接插入用户输入
// element.innerHTML = userInput

// ✅ 安全：使用 textContent
element.textContent = userInput // 显示为纯文本
```

### 误区 2：`querySelectorAll` 返回的是数组

**错！** 返回的是 NodeList，不是数组，但支持 `forEach`。

```javascript
const items = document.querySelectorAll('.item')

// ✅ 可以使用 forEach
items.forEach(item => console.log(item))

// ❌ 不能使用数组方法
// items.map(item => item.textContent) // Uncaught TypeError

// ✅ 转为真正的数组
const arr = Array.from(items)
arr.map(item => item.textContent)
```

### 误区 3：获取不到元素是因为代码写错了

**可能是执行时机不对！** 如果脚本在元素之前执行，就找不到元素。

```html
<!-- ❌ 错误：脚本在元素之前，找不到 #myElement -->
<script>
  const element = document.querySelector('#myElement')
  console.log(element) // null
</script>
<div id="myElement">内容</div>

<!-- ✅ 正确：把脚本放在末尾 -->
<div id="myElement">内容</div>
<script>
  const element = document.querySelector('#myElement')
  console.log(element) // <div id="myElement">
</script>
```

### 误区 4：`style` 属性可以获取所有样式

**错！** `style` 只能获取内联样式，不能获取 CSS 类的样式。

```javascript
// CSS: .box { color: red; }
const element = document.querySelector('.box')

// ❌ 内联样式为空
console.log(element.style.color) // ''

// ✅ 使用 getComputedStyle 获取计算后的样式
const computedStyle = window.getComputedStyle(element)
console.log(computedStyle.color) // 'rgb(255, 0, 0)'
```

---

## 8.16 动手练习

### 练习 1：基础练习

写一个函数，创建一个带有标题和内容的卡片元素。

<details>
<summary>点击查看答案</summary>

```javascript
function createCard(title, content) {
  // 创建卡片容器
  const card = document.createElement('div')
  card.className = 'card'
  
  // 创建标题
  const h3 = document.createElement('h3')
  h3.textContent = title
  
  // 创建内容
  const p = document.createElement('p')
  p.textContent = content
  
  // 组合元素
  card.appendChild(h3)
  card.appendChild(p)
  
  return card
}

// 使用
const card = createCard('欢迎', '这是一张卡片')
document.body.appendChild(card)

// CSS 样式
/*
.card {
  border: 1px solid #ccc;
  padding: 20px;
  margin: 10px;
  border-radius: 5px;
}
*/
```

</details>

### 练习 2：进阶练习

写一个函数，根据数组数据动态创建列表。

<details>
<summary>点击查看答案</summary>

```javascript
function createList(items) {
  // 创建列表
  const ul = document.createElement('ul')
  ul.className = 'list'
  
  // 使用 DocumentFragment 优化性能
  const fragment = document.createDocumentFragment()
  
  items.forEach(item => {
    const li = document.createElement('li')
    li.textContent = item
    fragment.appendChild(li)
  })
  
  ul.appendChild(fragment)
  return ul
}

// 使用
const fruits = ['苹果', '香蕉', '橙子', '葡萄']
const list = createList(fruits)
document.body.appendChild(list)

// CSS 样式
/*
.list {
  list-style: none;
  padding: 0;
}
.list li {
  padding: 5px 10px;
  border-bottom: 1px solid #eee;
}
*/
```

</details>

### 练习 3（挑战）：综合练习

写一个待办事项列表，支持添加和删除功能。

<details>
<summary>点击查看答案</summary>

```javascript
function TodoList() {
  // 创建容器
  const container = document.createElement('div')
  
  // 创建输入框
  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = '添加待办事项...'
  
  // 创建添加按钮
  const addBtn = document.createElement('button')
  addBtn.textContent = '添加'
  
  // 创建列表
  const ul = document.createElement('ul')
  
  // 添加事项
  function addTodo() {
    const text = input.value.trim()
    if (!text) return
    
    const li = document.createElement('li')
    
    // 创建文本节点
    const span = document.createElement('span')
    span.textContent = text
    
    // 创建删除按钮
    const deleteBtn = document.createElement('button')
    deleteBtn.textContent = '删除'
    deleteBtn.onclick = () => li.remove()
    
    // 组合元素
    li.appendChild(span)
    li.appendChild(deleteBtn)
    ul.appendChild(li)
    
    // 清空输入
    input.value = ''
  }
  
  // 绑定事件
  addBtn.onclick = addTodo
  input.onkeydown = (e) => {
    if (e.key === 'Enter') addTodo()
  }
  
  // 组合容器
  container.appendChild(input)
  container.appendChild(addBtn)
  container.appendChild(ul)
  
  return container
}

// 使用
const todoList = TodoList()
document.body.appendChild(todoList)

// CSS 样式
/*
div {
  margin: 20px;
}
input {
  padding: 5px 10px;
  width: 200px;
}
button {
  margin-left: 10px;
  padding: 5px 10px;
}
ul {
  list-style: none;
  padding: 0;
  margin-top: 10px;
}
li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  border-bottom: 1px solid #eee;
}
li button {
  margin-left: auto;
  background: #ff4444;
  color: white;
  border: none;
  padding: 3px 8px;
  cursor: pointer;
}
*/
```

</details>

---

## 下一章预告

下一章我们会学习 **事件处理**——也就是让网页响应用户操作的能力。你会学到如何绑定事件、处理事件对象、事件冒泡和事件委托等。掌握这些，你就能写出交互丰富的网页了！