---
title: "第八章：表单进阶"
description: "表单验证、fieldset、datalist"
---

# 第八章：表单进阶

## 表单验证

### 必填字段

```html
<input type="text" required placeholder="必填">
```

### 长度限制

```html
<input type="text" minlength="3" maxlength="20">
```

### 模式匹配

```html
<input type="text" pattern="[0-9]{4}" placeholder="4位数字">
```

### 数值范围

```html
<input type="number" min="0" max="100" step="5">
```

## fieldset 和 legend

```html
<form>
  <fieldset>
    <legend>个人信息</legend>
    
    <label>
      姓名：
      <input type="text" name="name">
    </label>
    
    <label>
      邮箱：
      <input type="email" name="email">
    </label>
  </fieldset>
  
  <fieldset>
    <legend>账户信息</legend>
    
    <label>
      用户名：
      <input type="text" name="username">
    </label>
    
    <label>
      密码：
      <input type="password" name="password">
    </label>
  </fieldset>
</form>
```

## datalist 自动完成

```html
<label>
  选择浏览器：
  <input type="text" list="browsers">
</label>

<datalist id="browsers">
  <option value="Chrome">
  <option value="Firefox">
  <option value="Safari">
  <option value="Edge">
</datalist>
```

## output 元素

```html
<form oninput="result.value = parseInt(a.value) + parseInt(b.value)">
  <input type="number" id="a" value="0"> +
  <input type="number" id="b" value="0"> =
  <output name="result" for="a b">0</output>
</form>
```

## progress 和 meter

```html
<!-- 进度条 -->
<progress value="70" max="100">70%</progress>

<!-- 度量器 -->
<meter value="0.6">60%</meter>
<meter min="0" max="100" low="40" high="90" optimum="80" value="65">65</meter>
```

## 表单属性

```html
<form action="/submit" method="post" novalidate>
  <!-- novalidate: 禁用浏览器验证 -->
  
  <input type="text" name="field1" autocomplete="off">
  <!-- autocomplete: 自动完成 -->
  
  <input type="text" name="field2" autofocus>
  <!-- autofocus: 自动聚焦 -->
  
  <input type="text" name="field3" disabled>
  <!-- disabled: 禁用 -->
  
  <input type="text" name="field4" readonly>
  <!-- readonly: 只读 -->
</form>
```

## 总结

HTML5 提供了丰富的表单验证和功能，可以减少 JavaScript 的使用。
