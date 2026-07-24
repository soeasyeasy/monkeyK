---
title: "第五章：列表"
description: "无序列表、有序列表、定义列表"
---

# 第五章：列表

## 无序列表

```html
<ul>
  <li>苹果</li>
  <li>香蕉</li>
  <li>橙子</li>
</ul>
```

## 有序列表

```html
<ol>
  <li>第一步：准备材料</li>
  <li>第二步：开始制作</li>
  <li>第三步：完成</li>
</ol>
```

### 有序列表属性

```html
<!-- 从 5 开始 -->
<ol start="5">
  <li>第五项</li>
  <li>第六项</li>
</ol>

<!-- 使用罗马数字 -->
<ol type="I">
  <li>第一项</li>
  <li>第二项</li>
</ol>
```

## 嵌套列表

```html
<ul>
  <li>
    水果
    <ul>
      <li>苹果</li>
      <li>香蕉</li>
    </ul>
  </li>
  <li>
    蔬菜
    <ul>
      <li>白菜</li>
      <li>萝卜</li>
    </ul>
  </li>
</ul>
```

## 定义列表

```html
<dl>
  <dt>HTML</dt>
  <dd>超文本标记语言</dd>
  
  <dt>CSS</dt>
  <dd>层叠样式表</dd>
  
  <dt>JavaScript</dt>
  <dd>编程语言</dd>
</dl>
```

## 列表样式

通过 CSS 可以修改列表样式：

```css
/* 移除列表标记 */
ul {
  list-style: none;
}

/* 使用自定义标记 */
ul {
  list-style-type: square;
}
```

## 总结

HTML 提供了三种列表类型：无序列表、有序列表和定义列表，用于组织不同类型的内容。
