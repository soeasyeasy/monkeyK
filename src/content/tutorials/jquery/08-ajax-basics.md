---
title: "第八章：Ajax 基础"
description: "用 jQuery 发送 Ajax 请求，实现页面无刷新数据交互"
---

# 第八章：Ajax 基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 Ajax？它解决了什么问题？
- jQuery 中怎么发送 Ajax 请求？
- $.ajax()、$.get()、$.post() 有什么区别？

这一章就是为了解答这些问题。Ajax 让网页可以在不刷新的情况下和服务器交换数据，是现代 Web 应用的基础。

---

## 1 为什么需要 Ajax？

### 痛点分析

没有 Ajax 的时代，网页交互是这样的：

1. 用户提交表单 → 整个页面刷新
2. 服务器返回新页面 → 浏览器重新渲染
3. 用户再操作 → 又刷新...

**问题**：
- 每次操作都要刷新页面，体验差
- 服务器要渲染整个页面，浪费资源
- 页面闪烁，用户操作被打断

### Ajax 的解决方案

Ajax（Asynchronous JavaScript and XML）让网页可以**在后台悄悄和服务器通信**，只更新需要变化的部分，不需要刷新整个页面。

打个比方：

> 传统方式像"去餐厅点餐"——每次点菜都要重新看菜单、下单、等菜，整个过程都要你亲自在场。
> Ajax 像"微信点餐"——你用手机点菜，厨房做好后服务员直接端上来，你不用离开座位。

### 对比

| 特性 | 传统方式 | Ajax 方式 |
| --- | --- | --- |
| 页面刷新 | 每次操作都刷新 | 不刷新 |
| 数据传输 | 整个页面 | 只传需要的数据 |
| 用户体验 | 页面闪烁 | 流畅无感知 |
| 服务器压力 | 大（渲染整页） | 小（只返回数据） |

---

## 2 核心原理

### Ajax 的工作流程

1. 用户触发操作（点击按钮等）
2. JavaScript 创建 XMLHttpRequest 对象
3. 向服务器发送请求
4. 服务器处理请求，返回数据（通常是 JSON）
5. JavaScript 接收数据，更新页面局部内容

jQuery 封装了 XMLHttpRequest，让 Ajax 调用变得简单。

---

## 3 基础用法 + 逐行注释

### $.get() - GET 请求

```javascript
// ===== 基本语法 =====
// $.get(url, data, callback, dataType)

// 最简单的 GET 请求
$.get('/api/users', function(data) {
  // data 是服务器返回的数据
  console.log(data)
})

// 带参数的 GET 请求
$.get('/api/users', { page: 1, size: 10 }, function(data) {
  // 请求的 URL 会自动拼接参数
  // 实际请求：/api/users?page=1&size=10
  console.log(data)
})

// 指定返回数据类型为 JSON
$.get('/api/users', function(data) {
  // data 已经是解析好的 JSON 对象
  console.log(data.name)
}, 'json')
```

### $.post() - POST 请求

```javascript
// ===== 基本语法 =====
// $.post(url, data, callback, dataType)

// 发送 POST 请求
$.post('/api/login', {
  username: '张三',
  password: '123456'
}, function(data) {
  // 处理服务器返回的数据
  if (data.success) {
    alert('登录成功')
    // 跳转到首页
    window.location.href = '/home'
  } else {
    alert('登录失败：' + data.message)
  }
}, 'json')
```

### $.ajax() - 通用方法

```javascript
// ===== $.ajax() 是最底层、最灵活的方法 =====
// $.get() 和 $.post() 内部都是调用 $.ajax()

$.ajax({
  // 请求地址
  url: '/api/users',

  // 请求方法（GET、POST、PUT、DELETE 等）
  type: 'GET',

  // 请求参数（会自动拼接到 URL 或请求体）
  data: {
    page: 1,
    size: 10
  },

  // 期望的返回数据类型
  dataType: 'json',

  // 请求成功时的回调函数
  success: function(data) {
    // data 是解析后的数据
    console.log('请求成功', data)
    // 渲染页面...
  },

  // 请求失败时的回调函数
  error: function(xhr, status, error) {
    console.log('请求失败', error)
    alert('网络错误，请稍后重试')
  },

  // 请求完成时的回调（无论成功失败）
  complete: function() {
    console.log('请求完成')
    // 通常用来隐藏 loading 动画
  },

  // 超时时间（毫秒）
  timeout: 5000
})
```

### POST 请求示例

```javascript
$.ajax({
  url: '/api/register',
  type: 'POST',
  data: {
    username: '张三',
    email: 'zhangsan@qq.com',
    password: '123456'
  },
  dataType: 'json',
  success: function(data) {
    if (data.code === 200) {
      alert('注册成功')
    } else {
      alert('注册失败：' + data.message)
    }
  },
  error: function(xhr) {
    // xhr.status 是 HTTP 状态码
    if (xhr.status === 404) {
      alert('接口不存在')
    } else if (xhr.status === 500) {
      alert('服务器错误')
    }
  }
})
```

### 处理 JSON 数据

```javascript
// 假设服务器返回的 JSON 数据：
// {
//   "code": 200,
//   "data": {
//     "users": [
//       { "id": 1, "name": "张三", "age": 25 },
//       { "id": 2, "name": "李四", "age": 30 }
//     ]
//   }
// }

$.get('/api/users', function(res) {
  // 判断请求是否成功
  if (res.code === 200) {
    // 获取用户列表
    var users = res.data.users

    // 清空列表容器
    $('#userList').empty()

    // 遍历用户数据，生成 HTML
    $.each(users, function(index, user) {
      // 创建 li 元素并追加到列表中
      var $li = $('<li>' + user.name + '（' + user.age + '岁）</li>')
      $('#userList').append($li)
    })
  }
}, 'json')
```

---

## 4 对比表格

| 方法 | 请求类型 | 适用场景 | 复杂度 |
| --- | --- | --- | --- |
| `$.get()` | GET | 获取数据 | 简单 |
| `$.post()` | POST | 提交数据 | 简单 |
| `$.ajax()` | 任意 | 需要精细控制 | 灵活 |
| `$.getJSON()` | GET | 获取 JSON 数据 | 简单 |

---

## 5 新手常见误区

### 误区 1："GET 和 POST 只是写法不同"

**不是！** 两者有本质区别。

```javascript
// GET：用于获取数据
// - 参数拼在 URL 后面
// - 有长度限制（约 2KB）
// - 可以被缓存、收藏
// - 幂等（多次请求结果一样）

// POST：用于提交数据
// - 参数放在请求体中
// - 没有长度限制
// - 不会被缓存
// - 非幂等（多次请求可能有副作用）
```

### 误区 2："Ajax 请求可以跨域"

**默认不行！** 受同源策略限制。

```javascript
// 同源策略：协议、域名、端口都要相同
// http://localhost:5173 可以请求 http://localhost:5173/api
// 不能请求 http://api.example.com/data（跨域）

// 解决跨域的方案：
// 1. 后端配置 CORS 响应头
// 2. 使用 JSONP（只支持 GET）
// 3. 使用代理服务器
```

### 误区 3："Ajax 返回的数据直接就能用"

**需要判断！** 服务器可能返回错误。

```javascript
// ❌ 不推荐：直接用数据
$.get('/api/users', function(data) {
  console.log(data.name)  // 如果请求失败，data 可能不是预期的格式
})

// ✅ 推荐：先判断状态
$.ajax({
  url: '/api/users',
  success: function(data) {
    if (data.code === 200) {
      // 请求成功，使用数据
      console.log(data.data)
    } else {
      // 业务错误
      alert(data.message)
    }
  },
  error: function() {
    // 网络错误
    alert('网络异常')
  }
})
```

---

## 6 动手练习

### 练习 1：基础练习

用 $.get() 请求一个公开 API（如 https://jsonplaceholder.typicode.com/users），将返回的用户列表渲染到页面上。

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
  <h2>用户列表</h2>
  <button id="loadBtn">加载用户</button>
  <ul id="userList"></ul>

  <script>
    $(function() {
      // 点击加载按钮
      $('#loadBtn').click(function() {
        // 发送 GET 请求获取用户数据
        $.get('https://jsonplaceholder.typicode.com/users', function(data) {
          // 清空列表
          $('#userList').empty()

          // 遍历用户数据
          $.each(data, function(index, user) {
            // 创建 li 元素并追加到列表
            var $li = $('<li>' + user.name + ' - ' + user.email + '</li>')
            $('#userList').append($li)
          })
        })
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 2：进阶练习

实现一个"搜索建议"功能：输入框输入关键字时，发送请求搜索（可以用 https://jsonplaceholder.typicode.com/posts?title=关键词），将结果展示在下方。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    #suggestions { border: 1px solid #ccc; max-height: 200px; overflow-y: auto; display: none; }
    .suggestion-item { padding: 8px; cursor: pointer; }
    .suggestion-item:hover { background: #f0f0f0; }
  </style>
</head>
<body>
  <input type="text" id="searchInput" placeholder="搜索文章..." style="width: 300px; padding: 5px;">
  <div id="suggestions"></div>

  <script>
    $(function() {
      // 定义定时器变量（用于防抖）
      var timer = null

      // 监听输入事件
      $('#searchInput').on('input', function() {
        // 获取输入的关键字
        var keyword = $(this).val().trim()

        // 清除之前的定时器（防抖）
        clearTimeout(timer)

        // 如果关键字为空，隐藏建议列表
        if (keyword === '') {
          $('#suggestions').hide().empty()
          return
        }

        // 设置定时器，300ms 后发送请求（防抖）
        timer = setTimeout(function() {
          // 发送 GET 请求搜索文章
          $.get('https://jsonplaceholder.typicode.com/posts', { title: keyword }, function(data) {
            // 清空建议列表
            $('#suggestions').empty()

            // 取前 10 条结果
            var results = data.slice(0, 10)

            // 遍历结果，生成建议项
            $.each(results, function(index, post) {
              var $item = $('<div class="suggestion-item">' + post.title + '</div>')
              $('#suggestions').append($item)
            })

            // 显示建议列表
            if (results.length > 0) {
              $('#suggestions').show()
            } else {
              $('#suggestions').hide()
            }
          })
        }, 300)
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习

实现一个"用户管理系统"：页面加载时获取用户列表，支持"添加用户"（POST 请求）和"删除用户"（DELETE 请求），使用 https://jsonplaceholder.typicode.com/users 接口。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    .del-btn { color: red; cursor: pointer; }
    #addForm { margin: 15px 0; }
    #addForm input { padding: 5px; margin-right: 10px; }
    #addForm button { padding: 5px 15px; }
  </style>
</head>
<body>
  <h2>用户管理系统</h2>

  <!-- 添加用户表单 -->
  <div id="addForm">
    <input type="text" id="newName" placeholder="姓名">
    <input type="email" id="newEmail" placeholder="邮箱">
    <button id="addBtn">添加用户</button>
  </div>

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
    <tbody id="userTable"></tbody>
  </table>

  <script>
    $(function() {
      // 页面加载时获取用户列表
      loadUsers()

      // 加载用户列表函数
      function loadUsers() {
        $.get('https://jsonplaceholder.typicode.com/users', function(data) {
          // 清空表格
          $('#userTable').empty()

          // 遍历用户数据，生成表格行
          $.each(data, function(index, user) {
            var row = '<tr>' +
              '<td>' + user.id + '</td>' +
              '<td>' + user.name + '</td>' +
              '<td>' + user.email + '</td>' +
              '<td><span class="del-btn" data-id="' + user.id + '">删除</span></td>' +
              '</tr>'
            $('#userTable').append(row)
          })
        })
      }

      // 添加用户
      $('#addBtn').click(function() {
        // 获取输入值
        var name = $('#newName').val().trim()
        var email = $('#newEmail').val().trim()

        // 简单验证
        if (name === '' || email === '') {
          alert('请填写完整信息')
          return
        }

        // 发送 POST 请求添加用户
        $.post('https://jsonplaceholder.typicode.com/users', {
          name: name,
          email: email
        }, function(data) {
          // 提示成功（注意：jsonplaceholder 是模拟接口，实际不会保存）
          alert('添加成功')
          // 清空输入框
          $('#newName').val('')
          $('#newEmail').val('')
          // 重新加载列表
          loadUsers()
        })
      })

      // 删除用户（事件委托）
      $('#userTable').on('click', '.del-btn', function() {
        // 获取用户 ID
        var id = $(this).data('id')

        // 确认删除
        if (!confirm('确定要删除该用户吗？')) return

        // 发送 DELETE 请求
        $.ajax({
          url: 'https://jsonplaceholder.typicode.com/users/' + id,
          type: 'DELETE',
          success: function() {
            alert('删除成功')
            // 重新加载列表
            loadUsers()
          }
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

下一章我们会学习 **Ajax 进阶** —— Promise 处理、全局事件、跨域请求、文件上传等高级话题。掌握了这些，你就能应对更复杂的 Ajax 场景了。
