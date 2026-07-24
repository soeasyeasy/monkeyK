---
title: "第八章：DOM 操作"
description: "选择元素、修改内容、创建节点"
---

# 第八章：DOM 操作

## 选择元素

```javascript
// 通过 ID
const header = document.getElementById('header')

// 通过类名
const items = document.getElementsByClassName('item')

// 通过标签名
const paragraphs = document.getElementsByTagName('p')

// querySelector（推荐）
const first = document.querySelector('.item')
const all = document.querySelectorAll('.item')
```

## 修改内容

```javascript
const element = document.querySelector('#title')

// textContent（纯文本）
element.textContent = '新标题'

// innerHTML（HTML 内容）
element.innerHTML = '<strong>加粗标题</strong>'

// innerText（可见文本）
element.innerText = '可见文本'
```

## 修改属性

```javascript
const link = document.querySelector('a')

// 获取属性
const href = link.getAttribute('href')

// 设置属性
link.setAttribute('href', 'https://example.com')
link.setAttribute('target', '_blank')

// 移除属性
link.removeAttribute('target')

// 直接访问
link.href = 'https://example.com'
link.id = 'main-link'
```

## 修改样式

```javascript
const element = document.querySelector('.box')

// 直接设置
element.style.backgroundColor = 'red'
element.style.color = 'white'
element.style.padding = '20px'

// classList
element.classList.add('active')
element.classList.remove('hidden')
element.classList.toggle('visible')
element.classList.contains('active') // true/false
```

## 创建元素

```javascript
// 创建元素
const div = document.createElement('div')

// 设置内容
div.textContent = '新元素'
div.className = 'box'

// 添加到页面
document.body.appendChild(div)
```

## 插入元素

```javascript
const parent = document.querySelector('.container')
const child = document.querySelector('.item')

// 创建新元素
const newItem = document.createElement('div')
newItem.textContent = '新项目'

// append（末尾添加）
parent.append(newItem)

// prepend（开头添加）
parent.prepend(newItem)

// before（之前添加）
child.before(newItem)

// after（之后添加）
child.after(newItem)

// insertAdjacentHTML
parent.insertAdjacentHTML('beforeend', '<div>新内容</div>')
```

## 删除元素

```javascript
const element = document.querySelector('.item')

// remove（推荐）
element.remove()

// removeChild
const parent = element.parentNode
parent.removeChild(element)
```

## 遍历节点

```javascript
const parent = document.querySelector('.container')

// children（子元素）
for (const child of parent.children) {
  console.log(child)
}

// parentNode（父节点）
const parent = element.parentNode

// nextElementSibling（下一个兄弟）
const next = element.nextElementSibling

// previousElementSibling（上一个兄弟）
const prev = element.previousElementSibling
```

## 修改结构

```javascript
const parent = document.querySelector('.container')

// 克隆节点
const clone = parent.cloneNode(true) // true 表示深克隆

// 替换节点
const newElement = document.createElement('div')
parent.replaceChild(newElement, oldElement)

// 插入到指定位置
parent.insertBefore(newElement, referenceElement)
```

## 获取尺寸和位置

```javascript
const element = document.querySelector('.box')

// 尺寸
console.log(element.offsetWidth)   // 包含边框和内边距
console.log(element.offsetHeight)
console.log(element.clientWidth)   // 包含内边距
console.log(element.clientHeight)

// 位置
console.log(element.offsetTop)    // 相对于父元素的顶部距离
console.log(element.offsetLeft)

// getBoundingClientRect
const rect = element.getBoundingClientRect()
console.log(rect.top, rect.left, rect.width, rect.height)
```

## 性能优化

```javascript
// 使用 DocumentFragment
const fragment = document.createDocumentFragment()
for (let i = 0; i < 100; i++) {
  const li = document.createElement('li')
  li.textContent = `项目 ${i}`
  fragment.appendChild(li)
}
document.querySelector('ul').appendChild(fragment)

// 使用 innerHTML（批量操作）
const items = Array.from({ length: 100 }, (_, i) => `<li>项目 ${i}</li>`)
document.querySelector('ul').innerHTML = items.join('')
```

## 总结

DOM 操作是 JavaScript 与网页交互的基础。推荐使用 querySelector/querySelectorAll 选择元素，使用 classList 管理样式。
