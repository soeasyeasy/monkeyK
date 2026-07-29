---
title: "第七章：Ajax 操作"
description: "掌握 jQuery Ajax 方法，实现与服务器数据交互"
---

# 第七章：Ajax 操作

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Ajax 是什么？和普通的页面跳转有什么区别？
- jQuery 中怎么发送 Ajax 请求？
- 怎么处理服务器返回的数据？

这一章就是为了解答这些问题。Ajax 是现代 Web 应用的核心技术，它让网页能够在不刷新页面的情况下与服务器交换数据。掌握了 Ajax，你的网页就能从"静态展示"变成"动态应用"。

---

## 1 为什么需要 Ajax？

### 痛点分析

传统的 Web 应用中，每次获取数据都要刷新整个页面：

- 用户点击"加载更多"，整个页面重新加载
- 提交表单后，页面跳转才能看到结果
- 搜索时需要等待页面刷新才能看到结果
- 用户体验差，操作卡顿

### 生活化类比

> 传统 Web 就像去餐厅吃饭：
> 每次点菜都要等服务员把整个菜单重新拿一遍（刷新页面），即使你只想加一道菜。
> 
> Ajax 就像打电话点外卖：
> 你只需要打电话说要什么（发送请求），餐厅做好送过来（返回数据），你在家就能收到，不需要亲自去餐厅（不刷新页面）。

### jQuery 的方案

jQuery 封装了 Ajax 操作，提供了简洁的 API，不用关心浏览器兼容问题（尤其是 IE 的 XMLHttpRequest 差异），几行代码就能完成数据交互。

---

## 2 核心原理

### 什么是 Ajax？

Ajax（Asynchronous JavaScript and XML）= 异步 JavaScript 和 XML。

现在虽然更多用 JSON 而不是 XML，但名字保留了下来。

**核心思想**：在浏览器后台向服务器发送请求，获取数据后更新页面局部，不需要刷新整个页面。

### Ajax 工作流程

```
1. 用户操作（点击按钮、输入内容等）
   ↓
2. JavaScript 创建 XMLHttpRequest 对象
   ↓
3. 向服务器发送请求（GET/POST 等）
   ↓
4. 服务器处理请求，返回数据（通常是 JSON）
   ↓
5. JavaScript 接收数据
   ↓
6. 用 DOM 操作更新页面局部内容
```

打个比方：

> Ajax 流程就像网购：
> 1. 你下单（发送请求）
> 2. 商家处理订单（服务器处理）
> 3. 快递送货（返回数据）
> 4. 你收到货后使用（更新页面）
> 整个过程你不需要去实体店（不刷新页面）。

### 同步 vs 异步

```javascript
// 同步请求：代码阻塞，必须等请求完成才能继续
// ❌ 不推荐：会卡住页面
$.ajax({
  url: '/api/data',
  async: false  // 同步请求
})
console.log('这行代码要等请求完成后才执行')

// 异步请求：代码不阻塞，请求在后台执行
// ✅ 推荐：页面不会被卡住
$.ajax({
  url: '/api/data',
  async: true  // 异步请求（默认值）
})
console.log('这行代码立即执行，不等请求完成')
```

---

## 3 基础用法 + 逐行注释

### $.get() 发送 GET 请求

```javascript
// ===== 基本语法 =====
// $.get(url, data, callback, dataType)

// 示例 1：最简单的 GET 请求
$.get('/api/users', function(response) {
  // 请求成功后执行的回调函数
  // response 是服务器返回的数据
  console.log(response)
})

// 示例 2：带参数的 GET 请求
$.get('/api/users', { page: 1, limit: 10 }, function(response) {
  // 等同于请求 /api/users?page=1&limit=10
  console.log(response)
})

// 示例 3：指定返回数据类型
$.get('/api/users', function(response) {
  console.log(response)
}, 'json')  // 明确指定返回 JSON 格式

// 示例 4：使用 Promise 方式（推荐）
$.get('/api/users')
  .done(function(response) {
    // 请求成功
    console.log('成功：', response)
  })
  .fail(function(xhr, status, error) {
    // 请求失败
    console.log('失败：', error)
  })
  .always(function() {
    // 无论成功失败都会执行
    console.log('请求完成')
  })
```

### $.post() 发送 POST 请求

```javascript
// ===== 基本语法 =====
// $.post(url, data, callback, dataType)

// 示例 1：发送 POST 请求
$.post('/api/users', {
  name: '张三',
  age: 25,
  email: 'zhangsan@example.com'
}, function(response) {
  // 请求成功后的回调
  console.log('创建成功：', response)
})

// 示例 2：使用 Promise 方式（推荐）
$.post('/api/users', {
  name: '张三',
  age: 25
})
.done(function(response) {
  console.log('成功：', response)
})
.fail(function(xhr, status, error) {
  console.log('失败：', error)
})

// 示例 3：提交表单数据
$('#form').on('submit', function(event) {
  // 阻止表单默认提交行为
  event.preventDefault()
  
  // 序列化表单数据
  var formData = $(this).serialize()
  // formData 格式：name=张三&age=25&email=zhangsan@example.com
  
  // 发送 POST 请求
  $.post('/api/users', formData, function(response) {
    console.log('提交成功：', response)
  })
})
```

### $.ajax() 通用方法

```javascript
// ===== 最灵活的 Ajax 方法 =====
// 可以配置所有参数

$.ajax({
  // 请求地址
  url: '/api/users',
  
  // 请求方法：GET、POST、PUT、DELETE 等
  type: 'GET',  // 或 method: 'GET'
  
  // 请求数据（会拼接到 URL 或作为请求体）
  data: {
    page: 1,
    limit: 10
  },
  
  // 期望的返回数据类型：json、xml、html、text、script
  dataType: 'json',
  
  // 请求头
  headers: {
    'Authorization': 'Bearer token123',
    'Content-Type': 'application/json'
  },
  
  // 是否异步（默认 true）
  async: true,
  
  // 超时时间（毫秒）
  timeout: 5000,
  
  // 请求成功回调
  success: function(response, status, xhr) {
    console.log('成功：', response)
  },
  
  // 请求失败回调
  error: function(xhr, status, error) {
    console.log('失败：', error)
  },
  
  // 请求完成回调（无论成功失败）
  complete: function(xhr, status) {
    console.log('请求完成')
  }
})

// 示例：发送 JSON 数据
$.ajax({
  url: '/api/users',
  type: 'POST',
  contentType: 'application/json',  // 告诉服务器发送的是 JSON
  data: JSON.stringify({            // 把对象转为 JSON 字符串
    name: '张三',
    age: 25
  }),
  success: function(response) {
    console.log(response)
  }
})
```

### 处理返回数据

```javascript
// ===== 服务器返回 JSON 数据 =====
// 假设服务器返回：{ "users": [{ "id": 1, "name": "张三" }, { "id": 2, "name": "李四" }] }

$.get('/api/users', function(response) {
  // response 已经是 JavaScript 对象（jQuery 自动解析）
  console.log(response.users)  // 输出用户数组
  
  // 遍历用户数据
  response.users.forEach(function(user) {
    console.log(user.id, user.name)
  })
  
  // 动态生成 HTML
  var html = ''
  response.users.forEach(function(user) {
    html += '<li>' + user.name + '</li>'
  })
  $('#userList').html(html)
})

// ===== 处理错误 =====
$.get('/api/users')
  .done(function(response) {
    // 请求成功
    console.log(response)
  })
  .fail(function(xhr, status, error) {
    // 请求失败
    console.log('状态码：', xhr.status)      // 404、500 等
    console.log('错误信息：', xhr.responseText) // 服务器返回的错误详情
    console.log('错误类型：', error)          // 错误描述
    
    // 根据状态码显示不同提示
    if (xhr.status === 404) {
      alert('资源不存在')
    } else if (xhr.status === 500) {
      alert('服务器错误')
    } else if (xhr.status === 0) {
      alert('网络错误')
    }
  })
```

### 加载远程 HTML

```javascript
// ===== load() 方法 =====
// 直接加载远程 HTML 到元素中

// 示例 1：加载整个页面
$('#content').load('/pages/about.html')

// 示例 2：加载页面的指定部分（使用选择器）
$('#content').load('/pages/about.html #main')
// 只加载 about.html 中 id="main" 的部分

// 示例 3：带回调函数
$('#content').load('/pages/about.html', function(response, status, xhr) {
  if (status === 'success') {
    console.log('加载成功')
  } else {
    console.log('加载失败：', error)
  }
})

// 示例 4：带参数（会自动转为 POST 请求）
$('#content').load('/api/user-info', { userId: 123 }, function() {
  console.log('加载完成')
})
```

### 全局 Ajax 设置

```javascript
// ===== $.ajaxSetup() =====
// 设置全局默认参数，所有 Ajax 请求都会应用

$.ajaxSetup({
  // 默认请求头
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  
  // 默认超时时间
  timeout: 10000,
  
  // 全局成功回调
  success: function(response) {
    // 所有请求成功后都会执行
    console.log('请求成功')
  },
  
  // 全局失败回调
  error: function(xhr, status, error) {
    // 所有请求失败后都会执行
    if (xhr.status === 401) {
      // 未授权，跳转到登录页
      window.location.href = '/login'
    }
  }
})

// ===== 全局事件 =====
// 监听所有 Ajax 请求的生命周期

// 请求开始时触发
$(document).on('ajaxStart', function() {
  // 显示加载动画
  $('#loading').show()
})

// 请求完成时触发（无论成功失败）
$(document).on('ajaxComplete', function() {
  // 隐藏加载动画
  $('#loading').hide()
})

// 请求成功时触发
$(document).on('ajaxSuccess', function(event, xhr, settings) {
  console.log('请求成功：', settings.url)
})

// 请求失败时触发
$(document).on('ajaxError', function(event, xhr, settings, error) {
  console.log('请求失败：', settings.url, error)
})
```

### JSONP 跨域请求

```javascript
// ===== 什么是 JSONP？ =====
// JSONP 是一种跨域解决方案（现在推荐用 CORS）
// 利用 <script> 标签不受同源策略限制的原理

$.ajax({
  url: 'http://api.example.com/data',
  dataType: 'jsonp',  // 指定 JSONP
  jsonp: 'callback',  // 回调函数参数名
  jsonpCallback: 'myCallback',  // 回调函数名（可省略，jQuery 自动生成）
  success: function(response) {
    console.log(response)
  }
})

// 或使用 $.getJSON()
$.getJSON('http://api.example.com/data?callback=?', function(response) {
  console.log(response)
})
// URL 中的 callback=? 表示使用 JSONP
```

---

## 4 对比表格

### Ajax 方法对比

| 方法 | 说明 | 适用场景 | 复杂度 |
| --- | --- | --- | --- |
| `$.get()` | GET 请求 | 获取数据 | 简单 |
| `$.post()` | POST 请求 | 提交数据 | 简单 |
| `$.ajax()` | 通用请求 | 复杂场景（自定义头、超时等） | 灵活 |
| `load()` | 加载 HTML | 直接更新 DOM 内容 | 最简单 |
| `$.getJSON()` | 获取 JSON | 跨域获取 JSON（JSONP） | 简单 |

### HTTP 请求方法对比

| 方法 | 用途 | 参数位置 | 缓存 | 安全性 |
| --- | --- | --- | --- | --- |
| GET | 获取数据 | URL 中（?key=value） | 可缓存 | 较低（参数可见） |
| POST | 提交数据 | 请求体中 | 不缓存 | 较高（参数不可见） |
| PUT | 更新数据 | 请求体中 | 不缓存 | 较高 |
| DELETE | 删除数据 | URL 或请求体 | 不缓存 | 较高 |

### Ajax 配置参数对比

| 参数 | 说明 | 默认值 | 常用值 |
| --- | --- | --- | --- |
| `url` | 请求地址 | 无 | '/api/users' |
| `type`/`method` | 请求方法 | 'GET' | 'POST'、'PUT'、'DELETE' |
| `data` | 请求数据 | 无 | `{ id: 1 }` |
| `dataType` | 期望返回类型 | 自动判断 | 'json'、'html'、'text' |
| `contentType` | 发送数据类型 | 'application/x-www-form-urlencoded' | 'application/json' |
| `headers` | 请求头 | 无 | `{ 'Authorization': 'Bearer xxx' }` |
| `async` | 是否异步 | true | true、false |
| `timeout` | 超时时间（毫秒） | 无 | 5000、10000 |
| `success` | 成功回调 | 无 | function(response) {} |
| `error` | 失败回调 | 无 | function(xhr, status, error) {} |
| `complete` | 完成回调 | 无 | function(xhr, status) {} |

---

## 5 新手常见误区

### 误区 1："Ajax 请求失败但没有错误提示"

**原因：** 没有处理错误回调，或者跨域问题导致请求被浏览器拦截。

```javascript
// ❌ 错误：只写了成功回调，失败时没有任何提示
$.get('/api/users', function(response) {
  console.log(response)
})
// 如果请求失败（404、500、跨域等），什么都不会发生

// ✅ 正确：始终处理错误情况
$.get('/api/users')
  .done(function(response) {
    console.log('成功：', response)
  })
  .fail(function(xhr, status, error) {
    // 显示错误信息
    console.error('请求失败：', error)
    alert('加载失败，请稍后重试')
  })

// ✅ 检查跨域问题
// 如果控制台报错 "CORS policy"，说明是跨域问题
// 解决方案：
// 1. 后端配置 CORS 允许跨域
// 2. 使用代理服务器
// 3. 开发环境配置 proxy
```

### 误区 2："Ajax 是同步的，代码会等待请求完成"

**错误！** Ajax 默认是异步的，代码不会等待。

```javascript
// ❌ 错误理解：以为代码会等待
var userData
$.get('/api/user', function(response) {
  userData = response
})
console.log(userData)  // 输出：undefined（请求还没完成）

// ✅ 正确理解：在回调中使用数据
$.get('/api/user', function(response) {
  // 数据在这里才可用
  console.log(response)
  // 需要用到数据的代码都要写在这里
  $('#userName').text(response.name)
  $('#userAge').text(response.age)
})

// ✅ 使用 Promise 方式
$.get('/api/user')
  .then(function(response) {
    console.log(response)
    return response
  })
  .then(function(userData) {
    // 可以链式调用
    $('#userName').text(userData.name)
  })
```

### 误区 3："POST 请求比 GET 更安全"

**不完全对！** 安全性不取决于请求方法，而在于是否使用 HTTPS 和正确的认证。

```javascript
// ❌ 错误理解：以为 POST 就安全了
$.post('/api/login', {
  username: 'admin',
  password: '123456'  // 密码明文传输，不安全！
})

// ✅ 正确做法：
// 1. 使用 HTTPS 加密传输
// 2. 密码要加密后再传输
// 3. 使用 Token 认证

$.ajax({
  url: 'https://api.example.com/login',  // 使用 HTTPS
  type: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token  // 使用 Token 认证
  },
  data: JSON.stringify({
    username: 'admin',
    password: encryptedPassword  // 加密后的密码
  }),
  contentType: 'application/json'
})
```

### 误区 4："Ajax 请求可以跨域直接调用"

**不行！** 浏览器有同源策略限制，跨域请求会被拦截。

```javascript
// ❌ 错误：直接请求其他域名的 API
$.get('http://api.other-domain.com/data', function(response) {
  console.log(response)
})
// 控制台报错：CORS policy blocked

// ✅ 解决方案一：后端配置 CORS
// 后端添加响应头：Access-Control-Allow-Origin: *

// ✅ 解决方案二：使用代理（开发环境）
// webpack.config.js 或 vue.config.js 中配置 proxy
proxy: {
  '/api': {
    target: 'http://api.other-domain.com',
    changeOrigin: true
  }
}
// 然后请求本地代理
$.get('/api/data', function(response) {
  console.log(response)
})

// ✅ 解决方案三：JSONP（仅支持 GET）
$.getJSON('http://api.other-domain.com/data?callback=?', function(response) {
  console.log(response)
})
```

### 误区 5："忘记处理加载状态"

**问题：** 用户点击按钮后没有反馈，不知道请求是否在进行。

```javascript
// ❌ 错误：没有加载状态
$('#submitBtn').on('click', function() {
  $.post('/api/submit', { data: 'xxx' }, function(response) {
    alert('提交成功')
  })
})
// 用户点击后不知道发生了什么，可能会重复点击

// ✅ 正确：显示加载状态
$('#submitBtn').on('click', function() {
  var $btn = $(this)
  
  // 禁用按钮，防止重复点击
  $btn.prop('disabled', true).text('提交中...')
  
  $.post('/api/submit', { data: 'xxx' })
    .done(function(response) {
      alert('提交成功')
    })
    .fail(function() {
      alert('提交失败')
    })
    .always(function() {
      // 恢复按钮状态
      $btn.prop('disabled', false).text('提交')
    })
})
```

---

## 6 动手练习

### 练习 1：基础练习 - 加载用户列表

创建一个页面，包含一个"加载用户"按钮。点击按钮后，从 API 获取用户列表并显示在页面上。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    #userList {
      list-style: none;
      padding: 0;
    }
    #userList li {
      padding: 10px;
      margin: 5px 0;
      background-color: #f0f0f0;
      border-radius: 4px;
    }
    #loading {
      display: none;
      color: #007bff;
    }
  </style>
</head>
<body>
  <h2>用户列表</h2>
  <!-- 加载按钮 -->
  <button id="loadBtn">加载用户</button>
  <!-- 加载提示 -->
  <p id="loading">加载中...</p>
  <!-- 用户列表容器 -->
  <ul id="userList"></ul>

  <script>
    $(function() {
      // 点击加载按钮
      $('#loadBtn').on('click', function() {
        var $btn = $(this)
        var $list = $('#userList')
        var $loading = $('#loading')
        
        // 清空列表，显示加载提示
        $list.empty()
        $loading.show()
        // 禁用按钮
        $btn.prop('disabled', true)
        
        // 发送 GET 请求获取用户数据
        // 使用模拟 API：https://jsonplaceholder.typicode.com/users
        $.get('https://jsonplaceholder.typicode.com/users')
          .done(function(response) {
            // 请求成功，遍历用户数据
            response.forEach(function(user) {
              // 创建 li 元素并添加到列表
              $list.append(
                '<li>' + 
                '<strong>' + user.name + '</strong>' +
                ' - ' + user.email +
                '</li>'
              )
            })
          })
          .fail(function(xhr, status, error) {
            // 请求失败，显示错误提示
            alert('加载失败：' + error)
          })
          .always(function() {
            // 无论成功失败，隐藏加载提示，恢复按钮
            $loading.hide()
            $btn.prop('disabled', false)
          })
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 2：进阶练习 - 搜索建议

实现一个搜索框，用户输入时自动发送请求获取搜索建议，并显示在下拉列表中。要求：输入停止 500ms 后才发送请求（防抖）。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    .search-container {
      position: relative;
      width: 400px;
      margin: 20px auto;
    }
    #searchInput {
      width: 100%;
      padding: 10px;
      font-size: 16px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    #suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #ccc;
      border-top: none;
      display: none;
      max-height: 300px;
      overflow-y: auto;
    }
    #suggestions li {
      padding: 10px;
      cursor: pointer;
      list-style: none;
    }
    #suggestions li:hover {
      background-color: #f0f0f0;
    }
  </style>
</head>
<body>
  <div class="search-container">
    <!-- 搜索输入框 -->
    <input type="text" id="searchInput" placeholder="输入搜索关键词...">
    <!-- 搜索建议列表 -->
    <ul id="suggestions"></ul>
  </div>

  <script>
    $(function() {
      // 防抖定时器
      var debounceTimer
      
      // 监听输入框的 keyup 事件
      $('#searchInput').on('keyup', function() {
        var keyword = $(this).val().trim()
        var $suggestions = $('#suggestions')
        
        // 如果输入为空，隐藏建议列表
        if (keyword === '') {
          $suggestions.hide().empty()
          return
        }
        
        // 清除之前的定时器（防抖）
        clearTimeout(debounceTimer)
        
        // 设置新的定时器，500ms 后才发送请求
        debounceTimer = setTimeout(function() {
          // 发送请求获取搜索建议
          // 使用模拟 API：https://jsonplaceholder.typicode.com/posts?title_like=keyword
          $.get('https://jsonplaceholder.typicode.com/posts', { title_like: keyword })
            .done(function(response) {
              // 清空建议列表
              $suggestions.empty()
              
              // 如果返回数据为空，隐藏列表
              if (response.length === 0) {
                $suggestions.hide()
                return
              }
              
              // 遍历结果，生成建议项
              response.slice(0, 5).forEach(function(item) {
                // 只显示前 5 条
                $suggestions.append(
                  '<li data-id="' + item.id + '">' + item.title + '</li>'
                )
              })
              
              // 显示建议列表
              $suggestions.show()
            })
            .fail(function() {
              console.error('搜索失败')
            })
        }, 500)  // 500ms 防抖
      })
      
      // 点击建议项
      $('#suggestions').on('click', 'li', function() {
        // 获取建议项的文字
        var text = $(this).text()
        // 填入输入框
        $('#searchInput').val(text)
        // 隐藏建议列表
        $('#suggestions').hide()
      })
      
      // 点击页面其他地方时隐藏建议列表
      $(document).on('click', function(event) {
        if (!$(event.target).closest('.search-container').length) {
          $('#suggestions').hide()
        }
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习 - 用户管理 CRUD

实现一个简单的用户管理系统，包含增删改查功能：
1. 页面加载时获取用户列表
2. 点击"添加用户"按钮，弹出表单填写信息并提交
3. 点击"编辑"按钮，弹出表单修改用户信息
4. 点击"删除"按钮，确认后删除用户

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 10px;
      text-align: left;
    }
    th {
      background-color: #f0f0f0;
    }
    .btn {
      padding: 5px 10px;
      margin: 0 2px;
      cursor: pointer;
    }
    .btn-add {
      background-color: #28a745;
      color: white;
      border: none;
      padding: 8px 16px;
      margin-bottom: 10px;
    }
    .btn-edit {
      background-color: #007bff;
      color: white;
    }
    .btn-delete {
      background-color: #dc3545;
      color: white;
    }
    /* 模态框样式 */
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
    }
    .modal-content {
      background-color: white;
      width: 400px;
      margin: 100px auto;
      padding: 20px;
      border-radius: 8px;
    }
    .modal-content h3 {
      margin-top: 0;
    }
    .form-group {
      margin-bottom: 15px;
    }
    .form-group label {
      display: block;
      margin-bottom: 5px;
    }
    .form-group input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    .modal-footer {
      text-align: right;
      margin-top: 20px;
    }
    .modal-footer button {
      margin-left: 10px;
    }
  </style>
</head>
<body>
  <h2>用户管理系统</h2>
  
  <!-- 添加用户按钮 -->
  <button class="btn-add" id="addBtn">添加用户</button>
  
  <!-- 用户列表表格 -->
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>姓名</th>
        <th>邮箱</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody id="userTable">
      <!-- 动态生成 -->
    </tbody>
  </table>
  
  <!-- 模态框 -->
  <div class="modal" id="userModal">
    <div class="modal-content">
      <h3 id="modalTitle">添加用户</h3>
      <form id="userForm">
        <!-- 隐藏字段，存储用户 ID（编辑时使用） -->
        <input type="hidden" id="userId">
        <div class="form-group">
          <label>姓名：</label>
          <input type="text" id="userName" required>
        </div>
        <div class="form-group">
          <label>邮箱：</label>
          <input type="email" id="userEmail" required>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn" id="cancelBtn">取消</button>
          <button type="submit" class="btn btn-edit">保存</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    $(function() {
      // API 基础地址（使用 JSONPlaceholder 模拟）
      var API_BASE = 'https://jsonplaceholder.typicode.com'
      
      // 加载用户列表
      function loadUsers() {
        $.get(API_BASE + '/users')
          .done(function(response) {
            var $table = $('#userTable')
            $table.empty()
            
            // 遍历用户数据，生成表格行
            response.forEach(function(user) {
              $table.append(
                '<tr>' +
                '<td>' + user.id + '</td>' +
                '<td>' + user.name + '</td>' +
                '<td>' + user.email + '</td>' +
                '<td>' +
                '<button class="btn btn-edit" data-id="' + user.id + '" data-name="' + user.name + '" data-email="' + user.email + '">编辑</button>' +
                '<button class="btn btn-delete" data-id="' + user.id + '">删除</button>' +
                '</td>' +
                '</tr>'
              )
            })
          })
          .fail(function() {
            alert('加载用户列表失败')
          })
      }
      
      // 页面加载时获取用户列表
      loadUsers()
      
      // 点击添加按钮
      $('#addBtn').on('click', function() {
        // 清空表单
        $('#userForm')[0].reset()
        $('#userId').val('')
        $('#modalTitle').text('添加用户')
        // 显示模态框
        $('#userModal').show()
      })
      
      // 点击编辑按钮
      $('#userTable').on('click', '.btn-edit', function() {
        // 获取用户信息
        var id = $(this).data('id')
        var name = $(this).data('name')
        var email = $(this).data('email')
        
        // 填充表单
        $('#userId').val(id)
        $('#userName').val(name)
        $('#userEmail').val(email)
        $('#modalTitle').text('编辑用户')
        
        // 显示模态框
        $('#userModal').show()
      })
      
      // 点击删除按钮
      $('#userTable').on('click', '.btn-delete', function() {
        var id = $(this).data('id')
        
        // 确认删除
        if (!confirm('确定要删除这个用户吗？')) {
          return
        }
        
        // 发送删除请求
        $.ajax({
          url: API_BASE + '/users/' + id,
          type: 'DELETE',
          success: function() {
            alert('删除成功')
            // 重新加载列表
            loadUsers()
          },
          error: function() {
            alert('删除失败')
          }
        })
      })
      
      // 提交表单（添加或编辑）
      $('#userForm').on('submit', function(event) {
        // 阻止默认提交
        event.preventDefault()
        
        // 获取表单数据
        var id = $('#userId').val()
        var data = {
          name: $('#userName').val(),
          email: $('#userEmail').val()
        }
        
        // 判断是添加还是编辑
        if (id === '') {
          // 添加用户
          $.post(API_BASE + '/users', data)
            .done(function() {
              alert('添加成功')
              // 关闭模态框
              $('#userModal').hide()
              // 重新加载列表
              loadUsers()
            })
            .fail(function() {
              alert('添加失败')
            })
        } else {
          // 编辑用户
          $.ajax({
            url: API_BASE + '/users/' + id,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function() {
              alert('编辑成功')
              $('#userModal').hide()
              loadUsers()
            },
            error: function() {
              alert('编辑失败')
            }
          })
        }
      })
      
      // 点击取消按钮
      $('#cancelBtn').on('click', function() {
        $('#userModal').hide()
      })
      
      // 点击模态框背景关闭
      $('#userModal').on('click', function(event) {
        if ($(event.target).hasClass('modal')) {
          $(this).hide()
        }
      })
    })
  </script>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **jQuery 插件开发** —— 如何封装可复用的 jQuery 组件。你会学到如何创建自己的插件、插件的最佳实践、以及如何发布插件供他人使用。掌握了插件开发，你就能把常用的功能封装起来，提高代码复用性，甚至为开源社区做贡献。
