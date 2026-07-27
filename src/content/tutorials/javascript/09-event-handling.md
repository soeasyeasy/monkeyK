---
title: "第九章：事件处理"
description: "响应鼠标点击、键盘输入、表单提交，让网页动起来"
---

# 第九章：事件处理

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是事件？为什么需要事件处理？
- 怎么让按钮点击后执行代码？
- 事件对象包含哪些信息？
- 什么是事件冒泡和事件捕获？
- 事件委托是什么？为什么要用它？

这一章就是为了解答这些问题。我们会学习如何让网页响应用户的各种操作。

---

## 1 为什么需要事件处理？

### 痛点分析

想象一下，如果没有事件处理，网页就是"哑巴"：

```html
<!-- ❌ 静态按钮：点击没有任何反应 -->
<button>点击我</button>
<input type="text" placeholder="输入内容...">
```

用户点击按钮、输入文字、提交表单，网页都不会有任何响应！

### 解决方案

用事件处理让网页"活"起来：

```javascript
// ✅ 点击按钮弹出提示
const btn = document.querySelector('button')
btn.addEventListener('click', () => {
  alert('你点击了按钮！')
})

// ✅ 输入时实时显示内容
const input = document.querySelector('input')
input.addEventListener('input', (e) => {
  console.log('你输入了：', e.target.value)
})
```

> **一句话总结**：事件处理就像给网页装上"传感器"，能感知用户的每一个操作。

---

## 2 核心原理

### 事件的本质

事件是浏览器发出的**信号**，告诉 JavaScript："用户做了某事！"

打个比方：

> 想象你去餐厅吃饭。
> - 事件就像服务员过来告诉你："菜好了"、"账单来了"
> - 事件处理程序就像你的反应："上菜吧"、"买单"
> - `addEventListener` 就像告诉服务员："有情况随时通知我"

### 事件类型

常见的事件类型：

| 类别 | 事件名 | 说明 |
| --- | --- | --- |
| 鼠标 | `click` | 点击 |
| 鼠标 | `dblclick` | 双击 |
| 鼠标 | `mouseenter` | 鼠标进入 |
| 鼠标 | `mouseleave` | 鼠标离开 |
| 鼠标 | `mousemove` | 鼠标移动 |
| 键盘 | `keydown` | 按键按下 |
| 键盘 | `keyup` | 按键释放 |
| 键盘 | `keypress` | 按键（已废弃） |
| 表单 | `input` | 输入变化 |
| 表单 | `change` | 值改变（失焦后） |
| 表单 | `submit` | 表单提交 |
| 表单 | `focus` | 获取焦点 |
| 表单 | `blur` | 失去焦点 |
| 窗口 | `load` | 页面加载完成 |
| 窗口 | `resize` | 窗口大小改变 |
| 窗口 | `scroll` | 滚动 |

---

## 3 绑定事件的三种方式

### 方式一：HTML 属性（不推荐）

```html
<!-- ❌ 不推荐：HTML 和 JavaScript 耦合在一起 -->
<button onclick="alert('点击了')">点击我</button>
```

### 方式二：DOM 属性（简单场景可用）

```javascript
// ⚠️ 简单场景可用，但不能绑定多个事件处理程序
const btn = document.querySelector('button')
btn.onclick = () => {
  alert('点击了')
}

// 后面的会覆盖前面的
btn.onclick = () => {
  console.log('又点击了') // 只有这个生效
}
```

### 方式三：addEventListener（推荐）

```javascript
// ✅ 推荐：可以绑定多个事件处理程序
const btn = document.querySelector('button')

btn.addEventListener('click', () => {
  alert('第一次点击')
})

btn.addEventListener('click', () => {
  console.log('第二次点击')
})

// 两个都会执行！
```

---

## 4 事件对象

事件处理函数会接收一个**事件对象**，包含事件的详细信息：

```javascript
const btn = document.querySelector('button')

btn.addEventListener('click', (event) => {
  console.log('事件类型:', event.type)        // 'click'
  console.log('目标元素:', event.target)       // 被点击的元素
  console.log('当前元素:', event.currentTarget) // 绑定事件的元素
  console.log('点击位置:', event.clientX, event.clientY)
})
```

### 常用的事件对象属性

| 属性 | 说明 |
| --- | --- |
| `event.type` | 事件类型（如 'click'） |
| `event.target` | 触发事件的原始元素 |
| `event.currentTarget` | 当前处理事件的元素 |
| `event.clientX/Y` | 鼠标相对于视口的位置 |
| `event.pageX/Y` | 鼠标相对于文档的位置 |
| `event.key` | 按下的键名 |
| `event.keyCode` | 按键的 ASCII 码（已废弃） |
| `event.preventDefault()` | 阻止默认行为 |
| `event.stopPropagation()` | 阻止事件冒泡 |

---

## 5 阻止默认行为

有些元素有默认行为，比如链接跳转、表单提交等：

```javascript
// 阻止链接跳转
const link = document.querySelector('a')
link.addEventListener('click', (e) => {
  e.preventDefault()
  console.log('链接被点击，但没有跳转')
})

// 阻止表单提交
const form = document.querySelector('form')
form.addEventListener('submit', (e) => {
  e.preventDefault()
  console.log('表单被提交，但没有刷新页面')
})
```

---

## 6 事件冒泡和事件捕获

### 事件冒泡（默认）

事件从目标元素**向上冒泡**到父元素：

```html
<div class="grandparent">
  <div class="parent">
    <div class="child">点击我</div>
  </div>
</div>
```

```javascript
document.querySelector('.grandparent').addEventListener('click', () => {
  console.log('grandparent')
})

document.querySelector('.parent').addEventListener('click', () => {
  console.log('parent')
})

document.querySelector('.child').addEventListener('click', () => {
  console.log('child')
})

// 点击 child，输出顺序：child → parent → grandparent
```

### 事件捕获

事件从父元素**向下捕获**到目标元素：

```javascript
document.querySelector('.grandparent').addEventListener('click', () => {
  console.log('grandparent')
}, true) // 第三个参数为 true，启用捕获

document.querySelector('.parent').addEventListener('click', () => {
  console.log('parent')
}, true)

document.querySelector('.child').addEventListener('click', () => {
  console.log('child')
}, true)

// 点击 child，输出顺序：grandparent → parent → child
```

### 阻止冒泡

```javascript
document.querySelector('.child').addEventListener('click', (e) => {
  console.log('child')
  e.stopPropagation() // 阻止继续冒泡
})

// 点击 child，只输出：child
```

---

## 7 事件委托

事件委托是一种**优化技术**，利用事件冒泡只绑定一个事件处理程序：

### 问题场景

```javascript
// ❌ 不好：每个列表项都绑定事件，性能差
const items = document.querySelectorAll('li')
items.forEach(item => {
  item.addEventListener('click', () => {
    console.log('点击了:', item.textContent)
  })
})

// 如果动态添加新的 li，需要重新绑定事件！
```

### 解决方案

```javascript
// ✅ 好：事件委托，只绑定一次
const ul = document.querySelector('ul')

ul.addEventListener('click', (e) => {
  // 检查点击的是否是 li
  if (e.target.tagName === 'LI') {
    console.log('点击了:', e.target.textContent)
  }
})

// 动态添加的 li 也能触发事件！
```

> **一句话总结**：事件委托就像在公司前台放一个接待员，所有访客都由他处理，而不是每个人都配一个接待员。

---

## 8 移除事件

```javascript
// 定义事件处理函数
function handleClick() {
  console.log('点击了')
}

const btn = document.querySelector('button')

// 添加事件
btn.addEventListener('click', handleClick)

// 移除事件（必须用同一个函数引用）
btn.removeEventListener('click', handleClick)
```

> **注意**：匿名函数无法移除，因为无法引用同一个函数。

---

## 9 事件触发时机对比

### input vs change

```javascript
const input = document.querySelector('input')

// input：每次输入都会触发
input.addEventListener('input', (e) => {
  console.log('input:', e.target.value)
})

// change：值改变且失焦后触发
input.addEventListener('change', (e) => {
  console.log('change:', e.target.value)
})
```

### mouseenter vs mouseover

```javascript
const box = document.querySelector('.box')

// mouseenter：鼠标进入元素时触发（不冒泡）
box.addEventListener('mouseenter', () => {
  console.log('mouseenter')
})

// mouseover：鼠标进入元素或其子元素时触发（会冒泡）
box.addEventListener('mouseover', () => {
  console.log('mouseover')
})
```

---

## 10 键盘事件

```javascript
const input = document.querySelector('input')

input.addEventListener('keydown', (e) => {
  console.log('按下:', e.key)
  console.log('键码:', e.keyCode)
  
  // 判断特定按键
  if (e.key === 'Enter') {
    console.log('按了回车键')
  }
  
  // 组合键
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    console.log('Ctrl+S 保存')
  }
})
```

---

## 11 表单事件

```javascript
const form = document.querySelector('form')

// focus：获取焦点
form.addEventListener('focus', (e) => {
  e.target.style.borderColor = '#4CAF50'
}, true)

// blur：失去焦点
form.addEventListener('blur', (e) => {
  e.target.style.borderColor = '#ccc'
}, true)

// submit：表单提交
form.addEventListener('submit', (e) => {
  e.preventDefault()
  
  // 获取表单数据
  const formData = new FormData(form)
  const data = Object.fromEntries(formData)
  console.log('表单数据:', data)
})
```

---

## 12 窗口事件

```javascript
// load：页面完全加载（包括图片）
window.addEventListener('load', () => {
  console.log('页面加载完成')
})

// DOMContentLoaded：DOM 加载完成（不等待图片）
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM 加载完成')
})

// resize：窗口大小改变
window.addEventListener('resize', () => {
  console.log('窗口宽度:', window.innerWidth)
  console.log('窗口高度:', window.innerHeight)
})

// scroll：滚动
window.addEventListener('scroll', () => {
  console.log('滚动位置:', window.scrollY)
})
```

---

## 13 事件性能优化

### 防抖（Debounce）

```javascript
function debounce(fn, delay = 300) {
  let timer = null
  return (...args) => {
    // 清除之前的定时器
    clearTimeout(timer)
    // 重新设置定时器
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 使用：只在停止输入 300ms 后执行
const input = document.querySelector('input')
input.addEventListener('input', debounce((e) => {
  console.log('搜索:', e.target.value)
}, 300))
```

### 节流（Throttle）

```javascript
function throttle(fn, delay = 300) {
  let lastTime = 0
  return (...args) => {
    const now = Date.now()
    // 只有超过指定时间才执行
    if (now - lastTime >= delay) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

// 使用：每 300ms 最多执行一次
window.addEventListener('scroll', throttle(() => {
  console.log('滚动了')
}, 300))
```

### 防抖 vs 节流对比

| 场景 | 使用防抖 | 使用节流 |
| --- | --- | --- |
| 搜索输入 | ✅ 推荐 | ❌ |
| 窗口 resize | ✅ 推荐 | ❌ |
| 滚动加载 | ❌ | ✅ 推荐 |
| 按钮点击 | ✅ 推荐 | ❌ |

---

## 14 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 绑定事件 | `addEventListener(event, handler)` |
| 事件对象 | `event.target`、`event.currentTarget`、`event.type` |
| 阻止默认行为 | `event.preventDefault()` |
| 事件冒泡 | 事件从子元素向上传播 |
| 事件捕获 | 事件从父元素向下传播（第三个参数为 true） |
| 阻止冒泡 | `event.stopPropagation()` |
| 事件委托 | 利用冒泡在父元素上统一处理子元素事件 |
| 移除事件 | `removeEventListener(event, handler)` |
| 防抖 | 停止操作后延迟执行 |
| 节流 | 固定时间间隔内只执行一次 |

---

## 15 新手常见误区

### 误区 1：事件处理函数中的 `this` 指向问题

**在箭头函数中，`this` 不指向触发事件的元素！**

```javascript
const btn = document.querySelector('button')

// ❌ 箭头函数中的 this 不指向 btn
btn.addEventListener('click', () => {
  console.log(this) // window（全局对象）
})

// ✅ 使用普通函数
btn.addEventListener('click', function() {
  console.log(this) // btn 元素
})

// ✅ 或者使用 event.currentTarget
btn.addEventListener('click', (e) => {
  console.log(e.currentTarget) // btn 元素
})
```

### 误区 2：匿名函数可以移除

**错！** 匿名函数无法移除，因为无法引用。

```javascript
const btn = document.querySelector('button')

// ❌ 无法移除，因为函数没有引用
btn.addEventListener('click', () => {
  console.log('点击了')
})

// btn.removeEventListener('click', ???) // 不知道要移除哪个函数

// ✅ 正确做法：使用命名函数
function handler() {
  console.log('点击了')
}
btn.addEventListener('click', handler)
btn.removeEventListener('click', handler)
```

### 误区 3：事件委托不需要判断目标元素

**错！** 需要检查事件目标是否是预期的元素。

```javascript
const ul = document.querySelector('ul')

ul.addEventListener('click', (e) => {
  // ❌ 没有判断，点击 ul 的空白区域也会执行
  // console.log(e.target.textContent)
  
  // ✅ 判断点击的是 li
  if (e.target.tagName === 'LI') {
    console.log('点击了:', e.target.textContent)
  }
})
```

### 误区 4：`event.target` 和 `event.currentTarget` 一样

**不一定！** 在事件冒泡中，它们可能指向不同的元素。

```html
<div class="parent">
  <div class="child">点击我</div>
</div>
```

```javascript
document.querySelector('.parent').addEventListener('click', (e) => {
  console.log('target:', e.target)       // child（实际点击的元素）
  console.log('currentTarget:', e.currentTarget) // parent（绑定事件的元素）
})
```

---

## 16 动手练习

### 练习 1：基础练习

写一个按钮，点击后切换元素的显示/隐藏状态。

<details>
<summary>点击查看答案</summary>

```javascript
function toggleVisibility() {
  const btn = document.createElement('button')
  btn.textContent = '切换显示'
  
  const content = document.createElement('div')
  content.textContent = '这是可切换的内容'
  content.style.display = 'none'
  
  btn.addEventListener('click', () => {
    content.style.display = content.style.display === 'none' ? 'block' : 'none'
  })
  
  document.body.appendChild(btn)
  document.body.appendChild(content)
}

toggleVisibility()
```

</details>

### 练习 2：进阶练习

写一个键盘导航，按上/下键切换选中状态。

<details>
<summary>点击查看答案</summary>

```javascript
function keyboardNav(items) {
  const ul = document.createElement('ul')
  
  items.forEach((item, index) => {
    const li = document.createElement('li')
    li.textContent = item
    li.dataset.index = index
    if (index === 0) {
      li.style.backgroundColor = '#4CAF50'
      li.style.color = 'white'
    }
    ul.appendChild(li)
  })
  
  let currentIndex = 0
  
  document.addEventListener('keydown', (e) => {
    const listItems = ul.querySelectorAll('li')
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      currentIndex = (currentIndex + 1) % listItems.length
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      currentIndex = (currentIndex - 1 + listItems.length) % listItems.length
    }
    
    listItems.forEach((li, index) => {
      if (index === currentIndex) {
        li.style.backgroundColor = '#4CAF50'
        li.style.color = 'white'
      } else {
        li.style.backgroundColor = ''
        li.style.color = ''
      }
    })
  })
  
  document.body.appendChild(ul)
}

keyboardNav(['项目 1', '项目 2', '项目 3', '项目 4'])
```

</details>

### 练习 3（挑战）：综合练习

写一个简易的计算器，支持加减乘除。

<details>
<summary>点击查看答案</summary>

```javascript
function Calculator() {
  const container = document.createElement('div')
  container.style.margin = '20px'
  
  // 显示屏幕
  const display = document.createElement('input')
  display.type = 'text'
  display.readOnly = true
  display.style.width = '220px'
  display.style.height = '40px'
  display.style.fontSize = '20px'
  display.style.textAlign = 'right'
  display.style.marginBottom = '10px'
  
  // 按钮布局
  const buttons = [
    ['7', '8', '9', '/'],
    ['4', '5', '6', '*'],
    ['1', '2', '3', '-'],
    ['0', 'C', '=', '+']
  ]
  
  buttons.forEach(row => {
    const rowDiv = document.createElement('div')
    row.forEach(btnText => {
      const btn = document.createElement('button')
      btn.textContent = btnText
      btn.style.width = '50px'
      btn.style.height = '50px'
      btn.style.fontSize = '18px'
      btn.style.margin = '2px'
      
      btn.addEventListener('click', () => {
        if (btnText === 'C') {
          display.value = ''
        } else if (btnText === '=') {
          try {
            display.value = eval(display.value)
          } catch {
            display.value = '错误'
          }
        } else {
          display.value += btnText
        }
      })
      
      rowDiv.appendChild(btn)
    })
    container.appendChild(rowDiv)
  })
  
  container.appendChild(display)
  document.body.appendChild(container)
}

Calculator()
```

</details>

---

## 下一章预告

下一章我们会学习 **异步编程**——这是 JavaScript 最重要的特性之一。你会学到回调函数、Promise、async/await 等概念，掌握如何处理异步操作（如网络请求、文件读取等）。这是成为高级前端工程师的必经之路！