---
title: "第七章：表单基础"
description: "input、textarea、button、label"
---

# 第七章：表单基础

## 基本表单

```html
<form action="/submit" method="post">
  <label for="username">用户名：</label>
  <input type="text" id="username" name="username">
  
  <label for="password">密码：</label>
  <input type="password" id="password" name="password">
  
  <button type="submit">提交</button>
</form>
```

## input 类型

```html
<!-- 文本输入 -->
<input type="text" placeholder="请输入文本">

<!-- 密码 -->
<input type="password" placeholder="请输入密码">

<!-- 邮箱 -->
<input type="email" placeholder="请输入邮箱">

<!-- 数字 -->
<input type="number" min="0" max="100">

<!-- 日期 -->
<input type="date">

<!-- 颜色 -->
<input type="color">

<!-- 文件 -->
<input type="file" multiple>

<!-- 隐藏字段 -->
<input type="hidden" name="token" value="abc123">
```

## 文本域

```html
<textarea rows="4" cols="50" placeholder="请输入内容"></textarea>
```

## 按钮

```html
<!-- 提交按钮 -->
<button type="submit">提交</button>

<!-- 重置按钮 -->
<button type="reset">重置</button>

<!-- 普通按钮 -->
<button type="button">点击我</button>

<!-- 图片按钮 -->
<input type="image" src="submit.png" alt="提交">
```

## label 标签

```html
<!-- 方式一：使用 for 属性 -->
<label for="email">邮箱：</label>
<input type="email" id="email">

<!-- 方式二：包裹输入框 -->
<label>
  邮箱：
  <input type="email">
</label>
```

## 选择框

### 下拉选择

```html
<select name="city">
  <option value="">请选择城市</option>
  <option value="beijing">北京</option>
  <option value="shanghai">上海</option>
  <option value="guangzhou">广州</option>
</select>
```

### 多选框

```html
<input type="checkbox" id="agree" name="agree">
<label for="agree">我同意条款</label>
```

### 单选框

```html
<input type="radio" id="male" name="gender" value="male">
<label for="male">男</label>

<input type="radio" id="female" name="gender" value="female">
<label for="female">女</label>
```

## 总结

表单是用户与网页交互的重要方式，合理使用表单元素可以提升用户体验。
