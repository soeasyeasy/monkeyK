---
title: "第九章：Ajax 进阶"
description: "掌握 Ajax 高级技巧：Promise、全局事件、跨域请求、文件上传"
---

# 第九章：Ajax 进阶

## 本章导读

在学这一章之前，你可能会有这些疑问：

- jQuery Ajax 怎么使用 Promise 处理异步？
- 什么是 Ajax 全局事件？有什么用？
- 怎么解决跨域问题？
- 怎么用 Ajax 上传文件？

这一章就是为了解答这些问题。这些进阶技巧能让你更灵活地使用 Ajax。

---

## 1 为什么需要 Ajax 进阶？

### 痛点分析

基础 Ajax 能处理简单场景，但实际开发中经常遇到：

- 多个请求需要按顺序执行（请求 A 完成后再请求 B）
- 需要在所有请求期间显示 loading
- 跨域请求被浏览器拦截
- 需要上传文件到服务器

这些问题都需要进阶技巧来解决。

---

## 2 核心原理

### Promise 处理

jQuery 1.5+ 的 Ajax 方法返回一个 jqXHR 对象，它实现了 Promise 接口，可以用链式调用处理异步。

打个比方：

> Promise 就像"快递取件码"——你下单后（发送请求），拿到一个取件码（Promise 对象），等快递到了（请求完成），用取件码去取件（处理结果）。

---

## 3 基础用法 + 逐行注释

### Promise 链式调用

```javascript
// ===== done() / fail() / always() =====
// jQuery Ajax 返回 Promise 对象，可以用链式调用

$.get('/api/users')
  .done(function(data) {
    // 请求成功时执行
    console.log('获取用户成功', data)
  })
  .fail(function(xhr, status, error) {
    // 请求失败时执行
    console.log('请求失败', error)
  })
  .always(function() {
    // 无论成功失败都执行
    console.log('请求完成')
  })


// ===== then() =====
// then() 可以链式处理多个步骤
$.get('/api/users')
  .then(function(data) {
    // 第一步：获取用户列表
    console.log('用户列表', data)
    // 返回一个新的 Promise（获取第一个用户的详情）
    return $.get('/api/users/' + data[0].id)
  })
  .then(function(user) {
    // 第二步：获取用户详情
    console.log('用户详情', user)
  })
  .catch(function(error) {
    // 任何一步出错都会到这里
    console.log('出错了', error)
  })


// ===== $.when() 并行请求 =====
// 同时发送多个请求，全部完成后执行回调
$.when(
  $.get('/api/users'),
  $.get('/api/posts'),
  $.get('/api/comments')
).done(function(usersRes, postsRes, commentsRes) {
  // 三个请求都成功后执行
  // 每个参数是一个数组：[data, statusText, jqXHR]
  var users = usersRes[0]
  var posts = postsRes[0]
  var comments = commentsRes[0]

  console.log('所有数据加载完成')
}).fail(function() {
  // 任意一个请求失败时执行
  console.log('有请求失败了')
})
```

### Ajax 全局事件

```javascript
// ===== 全局事件 =====
// 当页面上任何 Ajax 请求发生时，都会触发这些事件

// 请求开始时触发
$(document).ajaxStart(function() {
  // 显示 loading 动画
  $('#loading').show()
})

// 请求完成时触发（无论成功失败）
$(document).ajaxComplete(function() {
  // 隐藏 loading 动画
  $('#loading').hide()
})

// 请求成功时触发
$(document).ajaxSuccess(function(event, xhr, settings) {
  console.log('请求成功', settings.url)
})

// 请求失败时触发
$(document).ajaxError(function(event, xhr, settings, error) {
  console.log('请求失败', settings.url, error)
})

// 所有请求都完成时触发
$(document).ajaxStop(function() {
  console.log('所有请求完成')
})


// ===== 全局事件的实际应用 =====
// 统一处理 loading 状态
$(document).ajaxStart(function() {
  // 任何 Ajax 请求开始时，显示全局 loading
  $('#globalLoading').fadeIn(200)
})

$(document).ajaxStop(function() {
  // 所有 Ajax 请求完成时，隐藏 loading
  $('#globalLoading').fadeOut(200)
})

// 如果某个请求不想触发全局事件，设置 global: false
$.ajax({
  url: '/api/data',
  global: false  // 不触发全局事件
})
```

### 跨域请求

```javascript
// ===== 什么是跨域？ =====
// 浏览器的同源策略：协议、域名、端口都要相同
// http://localhost:5173 请求 http://api.example.com 就是跨域

// ===== JSONP（只支持 GET） =====
// 利用 script 标签不受同源策略限制的特性
$.ajax({
  url: 'http://api.example.com/data',
  dataType: 'jsonp',  // 指定 JSONP
  jsonp: 'callback',  // 回调函数参数名
  success: function(data) {
    console.log(data)
  }
})

// ===== CORS（推荐） =====
// 需要后端配置响应头：Access-Control-Allow-Origin
// 前端代码不需要特殊处理，正常发 Ajax 即可
$.get('http://api.example.com/data', function(data) {
  // 如果后端配置了 CORS，这里能正常接收数据
  console.log(data)
})

// ===== 代理方案 =====
// 开发环境中，配置开发服务器代理
// Vite 配置示例：
// server: {
//   proxy: {
//     '/api': 'http://backend.com'
//   }
// }
// 前端请求 /api/users，实际会被代理到 http://backend.com/api/users
```

### 文件上传

```javascript
// ===== FormData 上传文件 =====
// HTML 结构
// <input type="file" id="fileInput">
// <button id="uploadBtn">上传</button>

$('#uploadBtn').click(function() {
  // 获取用户选择的文件
  var file = $('#fileInput')[0].files[0]

  // 创建 FormData 对象
  var formData = new FormData()
  // 添加文件到 FormData
  formData.append('file', file)
  // 可以添加其他字段
  formData.append('description', '文件描述')

  // 发送 Ajax 请求上传文件
  $.ajax({
    url: '/api/upload',
    type: 'POST',
    data: formData,
    // 告诉 jQuery 不要处理数据
    processData: false,
    // 告诉 jQuery 不要设置 Content-Type
    contentType: false,
    success: function(res) {
      console.log('上传成功', res)
    },
    error: function() {
      console.log('上传失败')
    },
    // 上传进度监听
    xhr: function() {
      var xhr = new XMLHttpRequest()
      // 监听上传进度
      xhr.upload.addEventListener('progress', function(e) {
        // 计算上传百分比
        var percent = Math.round(e.loaded / e.total * 100)
        console.log('上传进度：' + percent + '%')
        // 更新进度条
        $('#progressBar').css('width', percent + '%')
      })
      return xhr
    }
  })
})
```

### Ajax 全局设置

```javascript
// ===== $.ajaxSetup() =====
// 设置所有 Ajax 请求的默认配置

$.ajaxSetup({
  // 设置请求头（常用于携带 token）
  beforeSend: function(xhr) {
    // 从 localStorage 获取 token
    var token = localStorage.getItem('token')
    if (token) {
      // 添加到请求头
      xhr.setRequestHeader('Authorization', 'Bearer ' + token)
    }
  },

  // 全局错误处理
  error: function(xhr, status, error) {
    // 401 未授权，跳转到登录页
    if (xhr.status === 401) {
      window.location.href = '/login'
    }
    // 500 服务器错误
    if (xhr.status === 500) {
      alert('服务器错误，请稍后重试')
    }
  },

  // 默认超时时间
  timeout: 10000,

  // 默认数据类型
  dataType: 'json'
})

// 设置后，所有 Ajax 请求都会自动携带 token
$.get('/api/users')  // 自动携带 Authorization 头
```

---

## 4 对比表格

| 特性 | 说明 | 用法 |
| --- | --- | --- |
| `done()/fail()` | Promise 回调 | 链式调用处理结果 |
| `$.when()` | 并行请求 | 多个请求全部完成后处理 |
| 全局事件 | 统一监听 Ajax 状态 | loading、错误提示 |
| JSONP | 跨域方案 | 只支持 GET，老旧方案 |
| CORS | 跨域方案 | 后端配置，推荐 |
| FormData | 文件上传 | processData: false |

---

## 5 新手常见误区

### 误区 1："Promise 和回调函数不能混用"

**可以混用！** 但推荐统一用 Promise。

```javascript
// 方式一：回调函数
$.get('/api/users', function(data) {
  console.log(data)
})

// 方式二：Promise
$.get('/api/users').done(function(data) {
  console.log(data)
})

// 方式三：混合（不推荐，代码风格不统一）
$.get('/api/users', function(data) {
  console.log(data)
}).done(function(data) {
  // 也会执行，但容易混乱
})
```

### 误区 2："跨域问题只能前端解决"

**主要靠后端！** 前端方案有限。

```javascript
// 前端方案：
// 1. JSONP（只支持 GET）
// 2. 开发环境代理（生产环境需要 Nginx 配置）

// 后端方案（推荐）：
// 后端设置响应头：
// Access-Control-Allow-Origin: *
// Access-Control-Allow-Methods: GET, POST, PUT, DELETE
// Access-Control-Allow-Headers: Content-Type, Authorization
```

### 误区 3："FormData 上传文件需要设置 Content-Type"

**不能设置！** 让浏览器自动设置。

```javascript
// ❌ 错误：手动设置 Content-Type
$.ajax({
  data: formData,
  contentType: 'multipart/form-data'  // 不要手动设置！
})

// ✅ 正确：让浏览器自动设置（包含 boundary）
$.ajax({
  data: formData,
  processData: false,  // 不处理数据
  contentType: false   // 不设置 Content-Type
})
```

---

## 6 动手练习

### 练习 1：基础练习

用 `$.when()` 同时请求用户列表和文章列表，全部成功后在页面上展示。

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
  <button id="loadBtn">加载数据</button>
  <h3>用户列表</h3>
  <ul id="userList"></ul>
  <h3>文章列表</h3>
  <ul id="postList"></ul>

  <script>
    $(function() {
      $('#loadBtn').click(function() {
        // 同时发送两个请求
        $.when(
          $.get('https://jsonplaceholder.typicode.com/users'),
          $.get('https://jsonplaceholder.typicode.com/posts')
        ).done(function(usersRes, postsRes) {
          // 获取数据（每个参数是数组 [data, status, xhr]）
          var users = usersRes[0]
          var posts = postsRes[0]

          // 渲染用户列表
          $('#userList').empty()
          $.each(users.slice(0, 5), function(i, user) {
            $('#userList').append('<li>' + user.name + '</li>')
          })

          // 渲染文章列表
          $('#postList').empty()
          $.each(posts.slice(0, 5), function(i, post) {
            $('#postList').append('<li>' + post.title + '</li>')
          })
        }).fail(function() {
          alert('数据加载失败')
        })
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 2：进阶练习

使用全局事件实现一个全局 loading：任何 Ajax 请求开始时显示 loading，完成时隐藏。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    #loading {
      display: none;
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 20px 40px;
      border-radius: 5px;
      z-index: 9999;
    }
  </style>
</head>
<body>
  <div id="loading">加载中...</div>
  <button id="testBtn">测试请求</button>

  <script>
    $(function() {
      // 全局 Ajax 开始事件
      $(document).ajaxStart(function() {
        $('#loading').fadeIn(200)
      })

      // 全局 Ajax 停止事件
      $(document).ajaxStop(function() {
        $('#loading').fadeOut(200)
      })

      // 测试按钮
      $('#testBtn').click(function() {
        // 模拟一个慢请求
        $.get('https://jsonplaceholder.typicode.com/users', function() {
          console.log('请求完成')
        })
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习

用 `$.ajaxSetup()` 设置全局配置：自动携带 token（从 localStorage 获取），统一处理 401 跳转登录页，统一处理 500 错误提示。

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
  <button id="loginBtn">模拟登录</button>
  <button id="requestBtn">发送请求</button>

  <script>
    $(function() {
      // 全局 Ajax 设置
      $.ajaxSetup({
        // 请求发送前执行
        beforeSend: function(xhr) {
          // 从 localStorage 获取 token
          var token = localStorage.getItem('token')
          if (token) {
            // 添加到请求头
            xhr.setRequestHeader('Authorization', 'Bearer ' + token)
            console.log('已携带 token')
          }
        },

        // 全局错误处理
        error: function(xhr, status, error) {
          // 401 未授权
          if (xhr.status === 401) {
            alert('登录已过期，请重新登录')
            // 清除本地 token
            localStorage.removeItem('token')
            // 跳转到登录页（这里用 alert 模拟）
            // window.location.href = '/login'
          }
          // 500 服务器错误
          if (xhr.status === 500) {
            alert('服务器开小差了，请稍后重试')
          }
          // 404 接口不存在
          if (xhr.status === 404) {
            console.log('接口不存在：' + this.url)
          }
        },

        // 默认超时 10 秒
        timeout: 10000,

        // 默认期望 JSON 格式
        dataType: 'json'
      })

      // 模拟登录（保存 token）
      $('#loginBtn').click(function() {
        localStorage.setItem('token', 'my-secret-token-123')
        alert('登录成功，token 已保存')
      })

      // 发送请求（会自动携带 token）
      $('#requestBtn').click(function() {
        $.get('https://jsonplaceholder.typicode.com/users', function(data) {
          alert('请求成功，获取到 ' + data.length + ' 个用户')
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

下一章我们会学习 **jQuery 插件开发** —— 如何封装可复用的 jQuery 插件，以及了解常用的第三方插件。插件是 jQuery 生态的重要组成部分。
