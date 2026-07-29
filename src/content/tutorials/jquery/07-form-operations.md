---
title: "第七章：表单操作"
description: "用 jQuery 处理表单数据、验证输入、序列化表单"
---

# 第七章：表单操作

## 本章导读

在学这一章之前，你可能会有这些疑问：

- jQuery 怎么获取表单元素的值？
- 怎么做表单验证？
- 怎么把表单数据序列化后发送给服务器？

这一章就是为了解答这些问题。表单是用户输入数据的主要方式，掌握表单操作是前端开发的基本功。

---

## 1 为什么需要表单操作？

### 痛点分析

几乎每个网站都有表单——登录、注册、搜索、评论...

处理表单数据时经常需要：
- 获取用户输入的值
- 验证输入是否合法（邮箱格式、密码长度等）
- 把表单数据打包发送给服务器

### jQuery 的方案

```javascript
// 获取输入框的值
var username = $('#username').val()

// 验证是否为空
if (username === '') {
  alert('用户名不能为空')
}

// 序列化表单数据
var data = $('form').serialize()
// 输出：username=张三&password=123&gender=male
```

> **一句话总结**：jQuery 提供了便捷的方法来获取、验证和序列化表单数据。

---

## 2 核心原理

### 表单操作的分类

1. **获取值**：val() 方法获取表单元素的值
2. **设置值**：val() 方法设置表单元素的值
3. **验证**：判断输入是否满足条件
4. **序列化**：将表单数据转为 URL 参数字符串或对象

打个比方：

> 表单就像一个"数据采集器"，jQuery 帮你把采集到的数据整理好，方便你检查和发送。

---

## 3 基础用法 + 逐行注释

### 获取和设置表单值

```javascript
// ===== 文本输入框 =====
var text = $('#username').val()       // 获取值
$('#username').val('新值')             // 设置值
$('#username').val('')                 // 清空值

// ===== 下拉选择框 =====
var selected = $('#city').val()       // 获取选中的值
$('#city').val('shanghai')            // 设置选中项

// ===== 单选按钮 =====
// 获取被选中的单选按钮的值
var gender = $('input[name="gender"]:checked').val()

// ===== 复选框 =====
// 获取所有被选中的复选框的值
var hobbies = []
$('input[name="hobby"]:checked').each(function() {
  hobbies.push($(this).val())
})
console.log(hobbies)  // 输出：["read", "music"]
```

### 表单验证

```javascript
// ===== 基本验证 =====
// 提交表单时验证
$('#myForm').submit(function(event) {
  // 阻止默认提交
  event.preventDefault()

  // 获取输入值
  var username = $('#username').val().trim()
  var email = $('#email').val().trim()
  var password = $('#password').val()

  // 验证用户名
  if (username === '') {
    $('#username').css('border-color', 'red')
    $('#username').next('.error').text('用户名不能为空')
    return  // 终止提交
  }

  // 验证邮箱格式（正则表达式）
  var emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailReg.test(email)) {
    $('#email').css('border-color', 'red')
    $('#email').next('.error').text('邮箱格式不正确')
    return
  }

  // 验证密码长度
  if (password.length < 6) {
    $('#password').css('border-color', 'red')
    $('#password').next('.error').text('密码至少 6 位')
    return
  }

  // 验证通过，提交表单
  alert('验证通过！')
  // 这里可以用 Ajax 提交数据...
})
```

### 表单序列化

```javascript
// ===== serialize() =====
// 将表单数据序列化为 URL 参数字符串
var data = $('#myForm').serialize()
// 输出：username=张三&email=test%40qq.com&gender=male

// 可以直接用于 Ajax 请求
$.post('/api/register', $('#myForm').serialize(), function(res) {
  console.log(res)
})

// ===== serializeArray() =====
// 将表单数据序列化为数组（每项包含 name 和 value）
var arr = $('#myForm').serializeArray()
// 输出：
// [
//   { name: "username", value: "张三" },
//   { name: "email", value: "test@qq.com" },
//   { name: "gender", value: "male" }
// ]

// 可以方便地转为对象
var obj = {}
$.each(arr, function(i, field) {
  obj[field.name] = field.value
})
console.log(obj)  // { username: "张三", email: "test@qq.com", gender: "male" }
```

### 表单事件

```javascript
// ===== focus / blur =====
// 获得焦点和失去焦点
$('#username').focus(function() {
  // 获得焦点时，清除错误提示
  $(this).css('border-color', '')
  $(this).next('.error').text('')
})

$('#username').blur(function() {
  // 失去焦点时，验证输入
  var val = $(this).val().trim()
  if (val === '') {
    $(this).css('border-color', 'red')
    $(this).next('.error').text('不能为空')
  }
})

// ===== change =====
// 值改变时触发（下拉框、复选框等）
$('#city').change(function() {
  console.log('选择了：' + $(this).val())
})

// ===== input（实时监听） =====
// 每次输入都会触发
$('#search').on('input', function() {
  var keyword = $(this).val()
  // 实时搜索...
  console.log('搜索：' + keyword)
})
```

---

## 4 对比表格

| 方法 | 说明 | 返回值 |
| --- | --- | --- |
| `val()` | 获取/设置表单值 | 字符串 |
| `serialize()` | 序列化为 URL 参数 | 字符串 |
| `serializeArray()` | 序列化为数组 | 数组对象 |
| `submit()` | 触发/监听提交 | jQuery 对象 |
| `focus()/blur()` | 焦点事件 | jQuery 对象 |

---

## 5 新手常见误区

### 误区 1："val() 可以获取所有元素的值"

**不对！** `val()` 只对表单元素（input、select、textarea）有效。

```javascript
// ✅ 正确：用于表单元素
$('#username').val()    // 获取输入框的值
$('#city').val()        // 获取下拉框选中的值

// ❌ 错误：用于普通元素
$('#box').val()         // 返回 undefined
$('#box').text()        // 应该用 text() 或 html()
```

### 误区 2："serialize() 会序列化所有表单元素"

**不是！** 只有有 `name` 属性的元素才会被序列化。

```html
<!-- 有 name 属性，会被序列化 -->
<input name="username" value="张三">

<!-- 没有 name 属性，不会被序列化 -->
<input value="李四">
```

### 误区 3："表单验证只需要在前端做"

**不够！** 前端验证只是为了用户体验，后端验证才是安全保障。

```javascript
// 前端验证：提升用户体验
if (username === '') {
  showError('用户名不能为空')
  return
}

// 后端验证：安全保障（必须有！）
// 即使前端验证通过，后端也要再次验证
```

---

## 6 动手练习

### 练习 1：基础练习

创建一个登录表单（用户名、密码），点击提交按钮时验证：用户名不为空，密码长度至少 6 位。验证失败时显示错误提示。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    .error { color: red; font-size: 12px; }
    input.error-border { border: 1px solid red; }
  </style>
</head>
<body>
  <form id="loginForm">
    <div>
      <label>用户名：</label>
      <input type="text" id="username">
      <span class="error"></span>
    </div>
    <div>
      <label>密码：</label>
      <input type="password" id="password">
      <span class="error"></span>
    </div>
    <button type="submit">登录</button>
  </form>

  <script>
    $(function() {
      // 表单提交事件
      $('#loginForm').submit(function(event) {
        // 阻止默认提交
        event.preventDefault()

        // 清除之前的错误状态
        $('.error').text('')
        $('input').removeClass('error-border')

        // 获取输入值
        var username = $('#username').val().trim()
        var password = $('#password').val()

        // 验证用户名
        if (username === '') {
          $('#username').addClass('error-border')
          $('#username').next('.error').text('用户名不能为空')
          return
        }

        // 验证密码长度
        if (password.length < 6) {
          $('#password').addClass('error-border')
          $('#password').next('.error').text('密码至少 6 位')
          return
        }

        // 验证通过
        alert('登录成功！')
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 2：进阶练习

实现一个"实时字数统计"功能：文本输入框下方显示"已输入 X/100 字"，超过 100 字时禁止继续输入并提示。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    .counter { color: gray; font-size: 12px; }
    .counter.over { color: red; }
  </style>
</head>
<body>
  <textarea id="content" rows="5" cols="40" placeholder="请输入内容..."></textarea>
  <div class="counter">已输入 <span id="count">0</span>/100 字</div>

  <script>
    $(function() {
      // 监听输入事件（实时触发）
      $('#content').on('input', function() {
        // 获取当前输入的内容
        var text = $(this).val()
        // 计算字数
        var len = text.length

        // 判断是否超过 100 字
        if (len > 100) {
          // 超过 100 字，截断为 100 字
          $(this).val(text.substring(0, 100))
          len = 100
          // 添加超限样式
          $('.counter').addClass('over')
        } else {
          // 移除超限样式
          $('.counter').removeClass('over')
        }

        // 更新字数显示
        $('#count').text(len)
      })
    })
  </script>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习

实现一个完整的注册表单：包含用户名、邮箱、密码、确认密码、性别（单选）、爱好（多选）。提交时验证所有字段，验证通过后用 Ajax 发送数据（模拟即可）。

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    .form-group { margin: 10px 0; }
    .error { color: red; font-size: 12px; display: none; }
    input.invalid, select.invalid { border: 1px solid red; }
  </style>
</head>
<body>
  <form id="registerForm">
    <!-- 用户名 -->
    <div class="form-group">
      <label>用户名：</label>
      <input type="text" name="username" id="username">
      <span class="error">用户名 3-10 个字符</span>
    </div>

    <!-- 邮箱 -->
    <div class="form-group">
      <label>邮箱：</label>
      <input type="text" name="email" id="email">
      <span class="error">请输入正确的邮箱</span>
    </div>

    <!-- 密码 -->
    <div class="form-group">
      <label>密码：</label>
      <input type="password" name="password" id="password">
      <span class="error">密码至少 6 位</span>
    </div>

    <!-- 确认密码 -->
    <div class="form-group">
      <label>确认密码：</label>
      <input type="password" name="confirmPwd" id="confirmPwd">
      <span class="error">两次密码不一致</span>
    </div>

    <!-- 性别（单选） -->
    <div class="form-group">
      <label>性别：</label>
      <label><input type="radio" name="gender" value="male"> 男</label>
      <label><input type="radio" name="gender" value="female"> 女</label>
      <span class="error">请选择性别</span>
    </div>

    <!-- 爱好（多选） -->
    <div class="form-group">
      <label>爱好：</label>
      <label><input type="checkbox" name="hobby" value="read"> 阅读</label>
      <label><input type="checkbox" name="hobby" value="music"> 音乐</label>
      <label><input type="checkbox" name="hobby" value="sports"> 运动</label>
      <span class="error">至少选择一项</span>
    </div>

    <button type="submit">注册</button>
  </form>

  <script>
    $(function() {
      // 表单提交事件
      $('#registerForm').submit(function(event) {
        // 阻止默认提交
        event.preventDefault()

        // 清除所有错误状态
        $('.error').hide()
        $('input, select').removeClass('invalid')

        // 标记是否验证通过
        var isValid = true

        // 验证用户名（3-10 个字符）
        var username = $('#username').val().trim()
        if (username.length < 3 || username.length > 10) {
          $('#username').addClass('invalid')
          $('#username').next('.error').show()
          isValid = false
        }

        // 验证邮箱格式
        var email = $('#email').val().trim()
        var emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailReg.test(email)) {
          $('#email').addClass('invalid')
          $('#email').next('.error').show()
          isValid = false
        }

        // 验证密码长度
        var password = $('#password').val()
        if (password.length < 6) {
          $('#password').addClass('invalid')
          $('#password').next('.error').show()
          isValid = false
        }

        // 验证确认密码
        var confirmPwd = $('#confirmPwd').val()
        if (password !== confirmPwd) {
          $('#confirmPwd').addClass('invalid')
          $('#confirmPwd').next('.error').show()
          isValid = false
        }

        // 验证性别
        if ($('input[name="gender"]:checked').length === 0) {
          $('input[name="gender"]').first().next('.error').show()
          isValid = false
        }

        // 验证爱好
        if ($('input[name="hobby"]:checked').length === 0) {
          $('input[name="hobby"]').first().parent().next('.error').show()
          isValid = false
        }

        // 如果验证通过
        if (isValid) {
          // 序列化表单数据
          var formData = $(this).serialize()
          console.log('提交数据：' + formData)

          // 模拟 Ajax 提交（实际项目中取消注释）
          // $.post('/api/register', formData, function(res) {
          //   console.log('注册成功', res)
          // })

          alert('注册成功！')
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

下一章我们会学习 **Ajax 基础** —— 用 jQuery 发送网络请求，实现页面无刷新数据交互。Ajax 是现代 Web 应用的核心技术，掌握了它，你的网页就能和服务器"对话"了。
