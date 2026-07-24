---
title: "第九章：事件处理"
description: "事件监听、事件冒泡、事件委托"
---

# 第九章：事件处理

## 添加事件监听

```javascript
const button = document.querySelector('button')

// addEventListener（推荐）
button.addEventListener('click', function(event) {
  console.log('按钮被点击了')
})

// 箭头函数
button.addEventListener('click', (event) => {
  console.log('按钮被点击了')
})
```

## 移除事件监听

```javascript
function handleClick(event) {
  console.log('点击了')
}

// 添加
button.addEventListener('click', handleClick)

// 移除（必须是同一个函数引用）
button.removeEventListener('click', handleClick)
```

## 事件对象

```javascript
button.addEventListener('click', (event) => {
  console.log(event.type)       // 'click'
  console.log(event.target)     // 触发事件的元素
  console.log(event.currentTarget) // 绑定事件的元素
  console.log(event.clientX)    // 鼠标 X 坐标
  console.log(event.clientY)    // 鼠标 Y 坐标
  console.log(event.timeStamp)  // 事件时间戳
})
```

## 阻止默认行为

```javascript
const link = document.querySelector('a')

link.addEventListener('click', (event) => {
  event.preventDefault() // 阻止跳转
  console.log('链接点击被阻止')
})

// 表单提交
const form = document.querySelector('form')
form.addEventListener('submit', (event) => {
  event.preventDefault() // 阻止提交
  console.log('表单提交被阻止')
})
```

## 事件冒泡

```javascript
// HTML
// <div class="outer">
//   <div class="inner">点击我</div>
// </div>

document.querySelector('.outer').addEventListener('click', () => {
  console.log('外层 div 被点击')
})

document.querySelector('.inner').addEventListener('click', () => {
  console.log('内层 div 被点击')
})

// 点击内层 div，会先触发内层，再触发外层（冒泡）
```

## 停止冒泡

```javascript
document.querySelector('.inner').addEventListener('click', (event) => {
  event.stopPropagation() // 阻止事件冒泡
  console.log('内层 div 被点击')
})
```

## 事件委托

```javascript
// HTML
// <ul id="list">
//   <li>项目 1</li>
//   <li>项目 2</li>
//   <li>项目 3</li>
// </ul>

// 不好：给每个 li 绑定事件
// const items = document.querySelectorAll('li')
// items.forEach(item => {
//   item.addEventListener('click', handleClick)
// })

// 好：事件委托
document.querySelector('#list').addEventListener('click', (event) => {
  if (event.target.tagName === 'LI') {
    console.log(event.target.textContent)
  }
})
```

## 常用事件

### 鼠标事件

```javascript
element.addEventListener('click', () => {})      // 点击
element.addEventListener('dblclick', () => {})   // 双击
element.addEventListener('mousedown', () => {})  // 按下
element.addEventListener('mouseup', () => {})    // 释放
element.addEventListener('mousemove', () => {})  // 移动
element.addEventListener('mouseover', () => {})  // 移入
element.addEventListener('mouseout', () => {})   // 移出
```

### 键盘事件

```javascript
document.addEventListener('keydown', (event) => {
  console.log(event.key)      // 按键值
  console.log(event.code)     // 按键代码
  console.log(event.ctrlKey)  // 是否按下 Ctrl
  console.log(event.shiftKey) // 是否按下 Shift
  console.log(event.altKey)   // 是否按下 Alt
})

document.addEventListener('keyup', (event) => {})
document.addEventListener('keypress', (event) => {}) // 已废弃
```

### 表单事件

```javascript
const input = document.querySelector('input')

input.addEventListener('input', (event) => {
  console.log(event.target.value) // 实时变化
})

input.addEventListener('change', (event) => {
  console.log(event.target.value) // 失去焦点时触发
})

input.addEventListener('focus', () => {})
input.addEventListener('blur', () => {})
```

### 窗口事件

```javascript
window.addEventListener('load', () => {
  console.log('页面加载完成')
})

window.addEventListener('resize', () => {
  console.log('窗口大小改变')
})

window.addEventListener('scroll', () => {
  console.log('页面滚动')
})
```

## 事件流

```javascript
// 捕获阶段
element.addEventListener('click', handler, true)

// 冒泡阶段（默认）
element.addEventListener('click', handler, false)
```

## 自定义事件

```javascript
// 创建事件
const event = new CustomEvent('myEvent', {
  detail: { message: '自定义事件数据' }
})

// 监听事件
element.addEventListener('myEvent', (event) => {
  console.log(event.detail.message)
})

// 触发事件
element.dispatchEvent(event)
```

## 总结

事件处理是用户交互的核心。推荐使用 addEventListener 绑定事件，使用事件委托优化性能。
