---
title: "第三章：文本标签"
description: "标题、段落、强调、引用"
---

# 第三章：文本标签

## 标题标签

HTML 提供 6 级标题：

```html
<h1>一级标题</h1>
<h2>二级标题</h2>
<h3>三级标题</h3>
<h4>四级标题</h4>
<h5>五级标题</h5>
<h6>六级标题</h6>
```

## 段落和换行

```html
<p>这是一个段落。</p>
<p>这是另一个段落。<br>这里换行了。</p>
```

## 文本格式化

```html
<strong>加粗文本</strong>
<em>斜体文本</em>
<mark>高亮文本</mark>
<del>删除线文本</del>
<ins>下划线文本</ins>
<sub>下标</sub>
<sup>上标</sup>
```

## 引用

```html
<!-- 块级引用 -->
<blockquote>
  这是一段引用文字。
</blockquote>

<!-- 行内引用 -->
<p>他说：<q>你好</q></p>

<!-- 引用来源 -->
<p>
  <cite>《HTML 入门》</cite> - 一本好书
</p>
```

## 代码

```html
<!-- 行内代码 -->
<p>使用 <code>console.log()</code> 输出调试信息。</p>

<!-- 代码块 -->
<pre>
<code>
function hello() {
  console.log("Hello!");
}
</code>
</pre>
```

## 总结

HTML 提供了丰富的文本标签来组织和格式化内容。
