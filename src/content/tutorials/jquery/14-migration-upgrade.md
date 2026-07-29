---
title: "第十四章：jQuery 迁移与升级"
description: "了解 jQuery 版本差异，掌握迁移技巧和现代替代方案"
---

# 第十四章：jQuery 迁移与升级

## 本章导读

在学这一章之前，你可能会有这些疑问：

- jQuery 有多个版本，该用哪个？
- 老项目中的 jQuery 代码如何升级？
- jQuery 还能用吗？要不要迁移到 Vue/React？

这一章就是为了解答这些问题。我们会了解 jQuery 的版本演进，学习如何迁移和升级现有代码，以及如何评估是否需要迁移到现代框架。

---

## 1 为什么需要了解迁移与升级？

### 痛点分析

很多老项目仍在使用 jQuery，但面临这些问题：

- 使用的是 jQuery 1.x 或 2.x，存在安全漏洞
- 代码中使用了已废弃的 API，升级后报错
- 项目维护困难，新开发者不熟悉 jQuery
- 性能不如现代框架，用户体验差

### 生活化类比

> 把 jQuery 项目迁移想象成搬家：
> 
> - 简单搬家：换个地方住，家具不变（jQuery 版本升级）
> - 装修升级：换新的家具，但房子不变（用现代语法重写 jQuery 代码）
> - 换房子：彻底搬到新环境（迁移到 Vue/React）
> 
> 不同的需求，选择不同的迁移策略。

---

## 2 jQuery 版本演进

### 主要版本对比

| 版本 | 发布时间 | 特点 | 适用场景 |
| --- | --- | --- | --- |
| jQuery 1.x | 2006-2014 | 支持 IE6-8，功能完整 | 需要兼容旧浏览器的老项目 |
| jQuery 2.x | 2013-2014 | 移除 IE6-8 支持，体积更小 | 不需要兼容 IE8 的项目 |
| jQuery 3.x | 2016-至今 | 进一步精简，修复问题，推荐版本 | 所有新项目和维护中的项目 |

### 版本选择建议

```javascript
// ✅ 推荐：使用 jQuery 3.x（最新稳定版）
// 引入方式
<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>

// ❌ 不推荐：使用 jQuery 1.x 或 2.x
// 除非项目必须兼容 IE8，否则不要用旧版本
<script src="https://cdn.jsdelivr.net/npm/jquery@1.12.4/dist/jquery.min.js"></script>
```

---

## 3 已废弃的 API

### 常见废弃 API 对照表

| 废弃 API | 替代方案 | 说明 |
| --- | --- | --- |
| `.bind()` | `.on()` | 事件绑定统一使用 `.on()` |
| `.live()` | `.on()` | 事件委托使用 `.on()` |
| `.delegate()` | `.on()` | 事件委托统一使用 `.on()` |
| `.size()` | `.length` | 获取元素数量用属性而非方法 |
| `.attr('value')` | `.val()` | 获取表单值用 `.val()` |
| `.removeAttr()` | `.prop()` | 移除属性用 `.prop()` |
| `$.browser` | 特性检测 | 用 Modernizr 或原生特性检测 |
| `.andSelf()` | `.addBack()` | 方法重命名 |
| `.context` | 避免使用 | 已移除，不要依赖 |

### 代码迁移示例

```javascript
// ===== 事件绑定迁移 =====

// ❌ 旧写法（jQuery 1.x）
$('#btn').bind('click', function() {
  console.log('点击了')
})

// ✅ 新写法（jQuery 3.x）
$('#btn').on('click', function() {
  console.log('点击了')
})

// ===== 事件委托迁移 =====

// ❌ 旧写法
$('li').live('click', function() {
  console.log($(this).text())
})

// ✅ 新写法
$(document).on('click', 'li', function() {
  console.log($(this).text())
})

// 或者指定具体的父元素（更优）
$('#list').on('click', 'li', function() {
  console.log($(this).text())
})

// ===== 获取元素数量 =====

// ❌ 旧写法
var count = $('li').size()

// ✅ 新写法
var count = $('li').length

// ===== 获取表单值 =====

// ❌ 旧写法
var value = $('#input').attr('value')

// ✅ 新写法
var value = $('#input').val()
```

---

## 4 jQuery 3.x 的重要变化

### 1. 移除的方法

```javascript
// ===== 已移除的方法 =====

// ❌ 这些方法在 jQuery 3.x 中已移除
// $.parseJSON() → 使用 JSON.parse()
// $.isArray() → 使用 Array.isArray()
// $.isFunction() → 使用 typeof fn === 'function'
// $.isNumeric() → 使用 Number.isFinite()
// $.type() → 使用 typeof 或 Object.prototype.toString

// ✅ 使用原生方法替代
var obj = JSON.parse('{"name": "Tom"}')  // 替代 $.parseJSON()
var isArr = Array.isArray([1, 2, 3])     // 替代 $.isArray()
var isFn = typeof callback === 'function' // 替代 $.isFunction()
```

### 2. 行为变化

```javascript
// ===== .css() 方法 =====

// jQuery 2.x：返回带单位的字符串
$('#box').css('width')  // 返回 "100px"

// jQuery 3.x：返回数值（如果可能）
$('#box').css('width')  // 返回 100（数字）

// 如果需要字符串，手动拼接
var width = $('#box').css('width') + 'px'

// ===== .show() 和 .hide() 方法 =====

// jQuery 2.x：简单切换 display 属性
$('#box').hide()  // 设置 display: none

// jQuery 3.x：更智能，记住原始 display 值
$('#box').hide()  // 记住原始 display 值
$('#box').show()  // 恢复原始 display 值（如 block、inline 等）

// ===== 选择器引擎 =====

// jQuery 3.x 使用 Sizzle 引擎的优化版本
// 对复杂选择器的处理更高效
$('#container').find('.item:visible')  // 性能更好
```

---

## 5 渐进式迁移策略

### 策略一：jQuery 版本升级（最简单）

```javascript
// 步骤 1：备份项目
// 步骤 2：替换 jQuery 文件为最新版本
<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>

// 步骤 3：测试所有功能
// 步骤 4：修复报错（通常是废弃 API）

// 使用 jQuery Migrate 插件辅助迁移
// 这个插件会输出警告信息，告诉你哪些 API 已废弃
<script src="https://code.jquery.com/jquery-3.7.1.js"></script>
<script src="https://code.jquery.com/jquery-migrate-3.4.0.js"></script>

// 打开浏览器控制台，会看到类似警告：
// JQMIGRATE: jQuery.fn.size() is deprecated; use .length
```

### 策略二：逐步替换废弃 API

```javascript
// 使用全局搜索替换

// 1. 搜索 .bind( 替换为 .on(
// 2. 搜索 .live( 替换为 .on(
// 3. 搜索 .size() 替换为 .length
// 4. 搜索 $.parseJSON 替换为 JSON.parse
// 5. 搜索 $.isArray 替换为 Array.isArray

// 批量替换后，全面测试功能
```

### 策略三：混合使用现代框架（推荐）

```javascript
// 在新项目中，可以 jQuery 和 Vue/React 共存

// 方式一：jQuery 负责旧模块，Vue 负责新模块
<div id="old-module">
  <!-- jQuery 控制的旧模块 -->
</div>

<div id="new-module">
  <!-- Vue 控制的新模块 -->
</div>

<script>
// jQuery 控制旧模块
$('#old-module').on('click', '.btn', function() {
  // jQuery 代码
})

// Vue 控制新模块
const app = Vue.createApp({
  // Vue 代码
})
app.mount('#new-module')
</script>

// 方式二：逐步迁移
// 1. 新功能用 Vue/React 开发
// 2. 旧功能维护时用 jQuery
// 3. 有时间时逐步将旧功能迁移到 Vue/React
```

---

## 6 迁移到原生 JavaScript

### 常见 jQuery 代码的原生替代

```javascript
// ===== 选择器 =====

// jQuery
var elem = $('#box')
var items = $('.item')

// 原生
var elem = document.getElementById('box')
var items = document.querySelectorAll('.item')

// ===== DOM 操作 =====

// jQuery
$('#box').text('Hello')
$('#box').html('<p>Hello</p>')
$('#box').addClass('active')

// 原生
document.getElementById('box').textContent = 'Hello'
document.getElementById('box').innerHTML = '<p>Hello</p>'
document.getElementById('box').classList.add('active')

// ===== 事件处理 =====

// jQuery
$('#btn').on('click', function() {
  console.log('点击了')
})

// 原生
document.getElementById('btn').addEventListener('click', function() {
  console.log('点击了')
})

// ===== Ajax =====

// jQuery
$.get('/api/data', function(data) {
  console.log(data)
})

// 原生（使用 Fetch API）
fetch('/api/data')
  .then(response => response.json())
  .then(data => console.log(data))

// 或者使用 async/await
async function getData() {
  const response = await fetch('/api/data')
  const data = await response.json()
  console.log(data)
}
```

---

## 7 是否应该迁移到 Vue/React？

### 评估标准

| 场景 | 建议 | 原因 |
| --- | --- | --- |
| 小型项目（< 5 个页面） | 继续用 jQuery | 迁移成本高，收益低 |
| 中型项目（5-20 个页面） | 混合使用 | 新功能用 Vue，旧功能维护 |
| 大型项目（> 20 个页面） | 考虑迁移 | 长期维护成本高，Vue/React 更优 |
| 新项目 | 直接用 Vue/React | 开发效率高，生态更好 |
| 需要复杂状态管理 | 用 Vue/React | jQuery 不适合复杂状态管理 |
| 团队熟悉 jQuery | 继续用 jQuery | 学习成本也是成本 |

### 迁移决策流程

```
1. 项目是否需要长期维护？
   ├─ 否 → 继续用 jQuery
   └─ 是 → 继续评估
   
2. 团队是否熟悉 Vue/React？
   ├─ 是 → 考虑迁移
   └─ 否 → 评估学习成本
   
3. 项目复杂度如何？
   ├─ 简单（< 5 页面）→ 继续用 jQuery
   ├─ 中等（5-20 页面）→ 混合使用
   └─ 复杂（> 20 页面）→ 考虑迁移
   
4. 迁移成本 vs 收益？
   ├─ 成本高，收益低 → 继续用 jQuery
   └─ 成本高，收益高 → 制定迁移计划
```

---

## 8 新手常见误区

### 误区 1："jQuery 已经过时了，必须迁移"

**不一定！** jQuery 仍然是一个优秀的库，适合小型项目和快速开发。

```javascript
// 这些场景用 jQuery 完全没问题：
// 1. 简单的交互效果
$('#btn').on('click', function() {
  $('#box').toggle()
})

// 2. 表单验证
$('#form').on('submit', function() {
  if ($('#email').val() === '') {
    alert('邮箱不能为空')
    return false
  }
})

// 3. 简单的 Ajax 请求
$.get('/api/data', function(data) {
  $('#list').html(data)
})

// 只有当项目变复杂时，才需要考虑迁移
```

### 误区 2："迁移到 Vue/React 很容易"

**不是！** 迁移需要时间和成本，不是简单的代码转换。

```javascript
// ❌ 错误想法：直接把 jQuery 代码改成 Vue
// jQuery 代码
$('#btn').on('click', function() {
  $('#box').text('Hello')
})

// 以为改成这样就行：
// Vue 代码
<button @click="box = 'Hello'">按钮</button>
<p>{{ box }}</p>

// 但实际上，需要重新设计数据结构、组件划分、状态管理
// 这不是简单的语法转换，而是架构重构
```

### 误区 3："用 jQuery Migrate 就万事大吉"

**不是！** jQuery Migrate 只是辅助工具，不能解决所有问题。

```javascript
// jQuery Migrate 的作用：
// 1. 输出废弃 API 的警告
// 2. 提供部分废弃 API 的兼容实现

// 但它不能：
// 1. 自动修复所有废弃代码
// 2. 保证性能最优
// 3. 替代人工审查

// ✅ 正确做法：
// 1. 使用 jQuery Migrate 发现问题
// 2. 手动修复废弃代码
// 3. 测试所有功能
// 4. 移除 jQuery Migrate（生产环境不要带）
```

### 误区 4："原生 JS 比 jQuery 快，所以应该用原生"

**不一定！** 性能差异通常可以忽略，开发效率更重要。

```javascript
// 性能对比（差异很小）：
// jQuery: $('#box').text('Hello') → 约 0.01ms
// 原生: document.getElementById('box').textContent = 'Hello' → 约 0.005ms

// 差异只有 0.005ms，用户感知不到

// 但如果代码量很大（如 10000 次操作），差异才会明显
// 此时可以考虑混合使用：
// 关键路径用原生，其他用 jQuery

// ✅ 建议：
// 1. 不要为了性能放弃开发效率
// 2. 性能瓶颈通常不在 jQuery，而在 DOM 操作
// 3. 优化 DOM 操作比替换 jQuery 更有效
```

---

## 9 动手练习

### 练习 1：基础练习 - 替换废弃 API

将以下代码中的废弃 API 替换为新 API。

```javascript
// 原始代码（使用废弃 API）
$('#btn').bind('click', function() {
  var count = $('li').size()
  console.log('共有 ' + count + ' 项')
})

$('#input').live('keyup', function() {
  var value = $(this).attr('value')
  console.log(value)
})
```

<details>
<summary>点击查看答案</summary>

```javascript
// ✅ 替换后（使用新 API）
$('#btn').on('click', function() {
  var count = $('li').length  // size() → length
  console.log('共有 ' + count + ' 项')
})

$('#input').on('keyup', function() {
  var value = $(this).val()  // attr('value') → val()
  console.log(value)
})
```

</details>

### 练习 2：进阶练习 - jQuery 转原生 JS

将以下 jQuery 代码转换为原生 JavaScript。

```javascript
// jQuery 代码
$(function() {
  $('#btn').on('click', function() {
    var text = $('#input').val()
    $('#list').append('<li>' + text + '</li>')
    $('#input').val('')
  })
})
```

<details>
<summary>点击查看答案</summary>

```javascript
// ✅ 原生 JavaScript 代码
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('btn').addEventListener('click', function() {
    var input = document.getElementById('input')
    var text = input.value
    var li = document.createElement('li')
    li.textContent = text
    document.getElementById('list').appendChild(li)
    input.value = ''
  })
})
```

</details>

### 练习 3（挑战）：综合练习 - 制定迁移计划

假设你有一个使用 jQuery 1.x 的项目，包含 10 个页面，使用了大量 `.bind()` 和 `.live()`。制定一个迁移计划，将其升级到 jQuery 3.x。

<details>
<summary>点击查看答案</summary>

```markdown
# jQuery 迁移计划

## 第一阶段：准备工作（1-2 天）
1. 备份项目代码
2. 引入 jQuery Migrate 插件
3. 打开浏览器控制台，记录所有警告信息
4. 统计废弃 API 的使用情况

## 第二阶段：版本升级（2-3 天）
1. 替换 jQuery 文件为 3.x 版本
2. 保留 jQuery Migrate 插件
3. 逐个页面测试功能
4. 记录报错和异常

## 第三阶段：代码修复（3-5 天）
1. 全局搜索替换 .bind( → .on(
2. 全局搜索替换 .live( → .on(
3. 全局搜索替换 .size() → .length
4. 修复其他废弃 API
5. 移除 jQuery Migrate 插件

## 第四阶段：测试验证（2-3 天）
1. 功能测试：所有页面功能正常
2. 兼容性测试：主流浏览器测试
3. 性能测试：对比升级前后性能
4. 回归测试：确保没有引入新问题

## 第五阶段：优化改进（可选）
1. 评估是否迁移到 Vue/React
2. 优化性能瓶颈
3. 重构复杂代码

## 风险评估
- 风险等级：中等
- 可能问题：部分插件不兼容 jQuery 3.x
- 解决方案：查找插件的更新版本或替代方案

## 时间估算
- 总时间：8-13 天
- 人力：1-2 人
```

</details>

---

## 下一章预告

下一章我们会学习 **实战项目：待办事项应用** —— 用 jQuery 开发一个完整的待办事项应用。你会学到需求分析、功能实现、代码优化，以及如何处理实际开发中的问题。
