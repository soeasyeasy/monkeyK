---
title: "第七章：表单基础"
description: "input、textarea、button、label"
---

# 第七章：表单基础

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是表单？为什么网页需要表单？
- `<input>` 标签有哪些类型？它们各自有什么用途？
- `<label>` 标签是什么？为什么必须使用？
- 按钮有哪些类型？它们有什么区别？

这一章就是为了解答这些问题。我们会学习如何用 HTML 创建表单，收集用户输入，实现与用户的交互。

---

## 7.1 为什么需要表单？

### 痛点分析

想象一下，如果没有表单，我们要收集用户信息：

- 用户只能通过邮件发送信息，流程繁琐
- 无法验证用户输入的格式是否正确
- 无法提供即时反馈
- 无法实现登录、注册、搜索等功能

### 解决方案

表单是网页与用户交互的核心，让用户可以输入和提交数据。

> **一句话总结**：表单是网页的"申请表"，让用户可以填写和提交信息。

打个比方：

> HTML 表单就像你去银行开户时填写的申请表。表单上有各种字段（姓名、身份证号、地址等），你填写后提交，银行就能获取你的信息。网页表单也是一样的道理。

---

## 7.2 核心原理

### 概念解释

HTML 表单由以下核心元素组成：

1. **`<form>`**：表单容器，定义表单的提交目标和方式
2. **`<input>`**：输入控件，根据 `type` 属性呈现不同的输入方式
3. **`<textarea>`**：多行文本输入
4. **`<button>`**：按钮，用于提交或执行操作
5. **`<label>`**：标签，关联表单控件，提高可访问性
6. **`<select>`**：下拉选择框
7. **`<option>`**：下拉选项

浏览器会根据表单控件的类型渲染相应的输入界面，用户填写后点击提交按钮，数据会发送到服务器。

### 对比分析

| 元素 | 用途 | 特点 |
| --- | --- | --- |
| `<form>` | 表单容器 | 定义提交目标和方法 |
| `<input>` | 单行输入 | 根据 type 呈现不同样式 |
| `<textarea>` | 多行输入 | 可调整大小 |
| `<button>` | 按钮 | 可包含文本或图标 |
| `<label>` | 标签 | 关联输入控件 |
| `<select>` | 下拉选择 | 从选项中选择 |

---

## 7.3 基础用法

### 基本表单

```html
<!-- 基本表单结构 -->
<form action="/submit" method="post">
  <!-- 用户名输入 -->
  <label for="username">用户名：</label>
  <input type="text" id="username" name="username">
  
  <!-- 密码输入 -->
  <label for="password">密码：</label>
  <input type="password" id="password" name="password">
  
  <!-- 提交按钮 -->
  <button type="submit">提交</button>
</form>
```

> **原理**：`<form>` 定义表单的提交目标（`action`）和方法（`method`），`<input>` 定义输入字段，`<label>` 关联输入框，`<button>` 触发表单提交。

### input 类型

```html
<!-- 文本输入 -->
<input type="text" placeholder="请输入文本">

<!-- 密码输入（内容隐藏） -->
<input type="password" placeholder="请输入密码">

<!-- 邮箱输入（自动验证格式） -->
<input type="email" placeholder="请输入邮箱">

<!-- 数字输入（只允许数字） -->
<input type="number" min="0" max="100" step="1">

<!-- 日期选择 -->
<input type="date">

<!-- 时间选择 -->
<input type="time">

<!-- 颜色选择器 -->
<input type="color">

<!-- 文件上传 -->
<input type="file" multiple accept="image/*">

<!-- 隐藏字段（不显示，用于传递数据） -->
<input type="hidden" name="token" value="abc123">

<!-- 搜索输入 -->
<input type="search" placeholder="搜索...">

<!-- 电话输入 -->
<input type="tel" placeholder="请输入电话号码">

<!-- URL 输入 -->
<input type="url" placeholder="请输入网址">
```

**input 类型总结**：

| type 值 | 用途 | 特点 |
| --- | --- | --- |
| `text` | 普通文本 | 单行文本输入 |
| `password` | 密码 | 输入内容隐藏 |
| `email` | 邮箱 | 自动验证格式 |
| `number` | 数字 | 只允许数字输入 |
| `date` | 日期 | 日期选择器 |
| `time` | 时间 | 时间选择器 |
| `color` | 颜色 | 颜色选择器 |
| `file` | 文件 | 文件上传 |
| `hidden` | 隐藏字段 | 不显示，传递数据 |
| `search` | 搜索 | 搜索样式 |
| `tel` | 电话 | 电话格式 |
| `url` | 网址 | URL 格式验证 |

### 文本域

```html
<!-- 多行文本输入 -->
<textarea rows="4" cols="50" placeholder="请输入内容"></textarea>

<!-- 禁用调整大小 -->
<textarea rows="4" cols="50" style="resize: none;"></textarea>
```

> **原理**：`<textarea>` 用于多行文本输入，`rows` 和 `cols` 属性控制初始大小。

### 按钮

```html
<!-- 提交按钮（默认行为：提交表单） -->
<button type="submit">提交</button>

<!-- 重置按钮（清空表单内容） -->
<button type="reset">重置</button>

<!-- 普通按钮（无默认行为） -->
<button type="button">点击我</button>

<!-- 图片按钮 -->
<input type="image" src="submit.png" alt="提交">
```

### label 标签

```html
<!-- 方式一：使用 for 属性关联（推荐） -->
<label for="email">邮箱：</label>
<input type="email" id="email" name="email">

<!-- 方式二：包裹输入框 -->
<label>
  邮箱：
  <input type="email" name="email">
</label>

<!-- 复选框使用 label -->
<input type="checkbox" id="agree" name="agree">
<label for="agree">我同意服务条款</label>
```

> **原理**：`<label>` 关联输入控件后，点击标签文字也能激活输入框，提高可访问性和用户体验。

### 选择框

#### 下拉选择

```html
<!-- 基本下拉选择 -->
<select name="city">
  <option value="">请选择城市</option>
  <option value="beijing">北京</option>
  <option value="shanghai">上海</option>
  <option value="guangzhou">广州</option>
  <option value="shenzhen" selected>深圳</option>
</select>

<!-- 多选下拉 -->
<select name="hobbies" multiple>
  <option value="reading">阅读</option>
  <option value="sports">运动</option>
  <option value="music">音乐</option>
</select>
```

#### 分组下拉

```html
<!-- 带分组的下拉选择 -->
<select name="country">
  <optgroup label="亚洲">
    <option value="china">中国</option>
    <option value="japan">日本</option>
    <option value="korea">韩国</option>
  </optgroup>
  <optgroup label="欧洲">
    <option value="uk">英国</option>
    <option value="france">法国</option>
    <option value="germany">德国</option>
  </optgroup>
</select>
```

### 复选框和单选框

#### 复选框（可多选）

```html
<!-- 复选框组 -->
<fieldset>
  <legend>兴趣爱好</legend>
  
  <input type="checkbox" id="hobby1" name="hobbies" value="reading">
  <label for="hobby1">阅读</label>
  
  <input type="checkbox" id="hobby2" name="hobbies" value="sports">
  <label for="hobby2">运动</label>
  
  <input type="checkbox" id="hobby3" name="hobbies" value="music" checked>
  <label for="hobby3">音乐</label>
</fieldset>
```

#### 单选框（只能选一个）

```html
<!-- 单选框组（name 属性必须相同） -->
<fieldset>
  <legend>性别</legend>
  
  <input type="radio" id="male" name="gender" value="male">
  <label for="male">男</label>
  
  <input type="radio" id="female" name="gender" value="female">
  <label for="female">女</label>
</fieldset>
```

> **原理**：单选框的 `name` 属性必须相同，这样浏览器才知道它们是同一组，只能选择一个。

---

## 7.4 核心知识点总结

| 标签 | 用途 | 核心属性 |
| --- | --- | --- |
| `<form>` | 表单容器 | `action`, `method` |
| `<input>` | 输入控件 | `type`, `name`, `id`, `value` |
| `<textarea>` | 多行文本 | `rows`, `cols`, `name` |
| `<button>` | 按钮 | `type` (submit/reset/button) |
| `<label>` | 标签 | `for` (关联 input) |
| `<select>` | 下拉选择 | `name`, `multiple` |
| `<option>` | 选项 | `value`, `selected` |
| `<fieldset>` | 字段分组 | - |
| `<legend>` | 字段组标题 | - |

---

## 7.5 新手常见误区

### 误区 1："忘记给表单控件添加 name 属性"

**错！** `name` 属性是表单提交时的键名，没有 `name` 的控件不会被提交。

**错误写法 ❌**：
```html
<input type="text" id="username">  <!-- 没有 name，数据不会提交 -->
```

**正确写法 ✅**：
```html
<input type="text" id="username" name="username">
```

### 误区 2："不使用 label 标签"

**错！** `<label>` 标签可以提高可访问性，点击标签就能激活输入框。

**错误写法 ❌**：
```html
<p>用户名：<input type="text" name="username"></p>
```

**正确写法 ✅**：
```html
<label for="username">用户名：</label>
<input type="text" id="username" name="username">
```

### 误区 3："单选框的 name 属性不相同"

**错！** 同一组单选框的 `name` 属性必须相同，否则可以多选。

**错误写法 ❌**：
```html
<input type="radio" name="gender1" value="male"> 男
<input type="radio" name="gender2" value="female"> 女  <!-- 可以同时选中 -->
```

**正确写法 ✅**：
```html
<input type="radio" name="gender" value="male"> 男
<input type="radio" name="gender" value="female"> 女
```

### 误区 4："表单没有 action 和 method"

**错！** 虽然浏览器会使用默认值，但显式设置 `action` 和 `method` 是良好的习惯。

**错误写法 ❌**：
```html
<form>  <!-- 没有指定提交目标 -->
```

**正确写法 ✅**：
```html
<form action="/submit" method="post">
```

### 误区 5："按钮的 type 属性可以省略"

**错！** `<button>` 的默认 `type` 是 `submit`，可能会意外提交表单。

**错误写法 ❌**：
```html
<button>点击我</button>  <!-- 会提交表单！ -->
```

**正确写法 ✅**：
```html
<button type="button">点击我</button>  <!-- 普通按钮 -->
```

---

## 7.6 动手练习

### 练习 1：基础练习

创建一个 HTML 页面，包含一个简单的登录表单，包含：
- 页面标题"用户登录"
- 用户名输入框
- 密码输入框
- 提交按钮

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>用户登录</title>
  <style>
    form { max-width: 400px; margin: 0 auto; }
    div { margin-bottom: 10px; }
    label { display: block; margin-bottom: 5px; }
    input { width: 100%; padding: 8px; box-sizing: border-box; }
    button { padding: 10px 20px; }
  </style>
</head>
<body>
  <h1>用户登录</h1>
  
  <form action="/login" method="post">
    <div>
      <label for="username">用户名：</label>
      <input type="text" id="username" name="username" placeholder="请输入用户名">
    </div>
    
    <div>
      <label for="password">密码：</label>
      <input type="password" id="password" name="password" placeholder="请输入密码">
    </div>
    
    <button type="submit">登录</button>
  </form>
</body>
</html>
```

</details>

### 练习 2：进阶练习

创建一个 HTML 页面，包含一个注册表单，包含：
- 用户基本信息（姓名、邮箱、密码）
- 性别选择（单选框）
- 兴趣爱好（复选框）
- 所在城市（下拉选择）
- 个人简介（文本域）

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>用户注册</title>
  <style>
    form { max-width: 500px; margin: 0 auto; }
    div, fieldset { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; }
    input, select, textarea { width: 100%; padding: 8px; box-sizing: border-box; }
    button { padding: 10px 20px; }
    fieldset { padding: 15px; }
  </style>
</head>
<body>
  <h1>用户注册</h1>
  
  <form action="/register" method="post">
    <div>
      <label for="name">姓名：</label>
      <input type="text" id="name" name="name" placeholder="请输入姓名">
    </div>
    
    <div>
      <label for="email">邮箱：</label>
      <input type="email" id="email" name="email" placeholder="请输入邮箱">
    </div>
    
    <div>
      <label for="password">密码：</label>
      <input type="password" id="password" name="password" placeholder="请输入密码">
    </div>
    
    <fieldset>
      <legend>性别</legend>
      <input type="radio" id="male" name="gender" value="male">
      <label for="male">男</label>
      
      <input type="radio" id="female" name="gender" value="female">
      <label for="female">女</label>
    </fieldset>
    
    <fieldset>
      <legend>兴趣爱好</legend>
      <input type="checkbox" id="reading" name="hobbies" value="reading">
      <label for="reading">阅读</label>
      
      <input type="checkbox" id="sports" name="hobbies" value="sports">
      <label for="sports">运动</label>
      
      <input type="checkbox" id="music" name="hobbies" value="music">
      <label for="music">音乐</label>
    </fieldset>
    
    <div>
      <label for="city">所在城市：</label>
      <select id="city" name="city">
        <option value="">请选择城市</option>
        <option value="beijing">北京</option>
        <option value="shanghai">上海</option>
        <option value="guangzhou">广州</option>
        <option value="shenzhen">深圳</option>
      </select>
    </div>
    
    <div>
      <label for="bio">个人简介：</label>
      <textarea id="bio" name="bio" rows="4" placeholder="请介绍一下你自己"></textarea>
    </div>
    
    <button type="submit">注册</button>
  </form>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习

创建一个 HTML 页面，包含一个产品订单表单，包含：
- 产品选择（下拉选择）
- 数量选择（数字输入）
- 配送日期（日期选择）
- 配送方式（单选框）
- 备注（文本域）
- 提交和重置按钮

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>产品订单</title>
  <style>
    form { max-width: 500px; margin: 0 auto; }
    div, fieldset { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; }
    input, select, textarea { width: 100%; padding: 8px; box-sizing: border-box; }
    button { padding: 10px 20px; margin-right: 10px; }
    fieldset { padding: 15px; }
  </style>
</head>
<body>
  <h1>产品订单</h1>
  
  <form action="/order" method="post">
    <div>
      <label for="product">选择产品：</label>
      <select id="product" name="product">
        <option value="">请选择产品</option>
        <optgroup label="电子产品">
          <option value="phone">智能手机</option>
          <option value="laptop">笔记本电脑</option>
          <option value="tablet">平板电脑</option>
        </optgroup>
        <optgroup label="家居用品">
          <option value="lamp">台灯</option>
          <option value="chair">椅子</option>
          <option value="table">桌子</option>
        </optgroup>
      </select>
    </div>
    
    <div>
      <label for="quantity">数量：</label>
      <input type="number" id="quantity" name="quantity" min="1" max="10" value="1">
    </div>
    
    <div>
      <label for="delivery-date">配送日期：</label>
      <input type="date" id="delivery-date" name="delivery-date">
    </div>
    
    <fieldset>
      <legend>配送方式</legend>
      <input type="radio" id="standard" name="delivery" value="standard" checked>
      <label for="standard">标准配送（3-5天）</label>
      
      <input type="radio" id="express" name="delivery" value="express">
      <label for="express">加急配送（1-2天）</label>
      
      <input type="radio" id="same-day" name="delivery" value="same-day">
      <label for="same-day">当日达</label>
    </fieldset>
    
    <div>
      <label for="notes">备注：</label>
      <textarea id="notes" name="notes" rows="3" placeholder="如有特殊要求，请在此说明"></textarea>
    </div>
    
    <button type="submit">提交订单</button>
    <button type="reset">重置表单</button>
  </form>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **表单进阶**——也就是如何使用 HTML5 的表单验证功能，以及 datalist、output、progress 等高级表单元素，让你的表单更加强大易用。