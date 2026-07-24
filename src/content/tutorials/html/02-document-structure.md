---
title: "第二章：文档结构"
description: "DOCTYPE、html、head、body"
---

# 第二章：文档结构

## HTML 文档基本结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>页面标题</title>
</head>
<body>
  <!-- 页面内容 -->
</body>
</html>
```

## 各部分说明

### DOCTYPE 声明

```html
<!DOCTYPE html>
```

告诉浏览器使用 HTML5 标准解析页面。

### html 根元素

```html
<html lang="zh-CN">
```

- `lang` 属性指定页面语言
- 有利于搜索引擎和屏幕阅读器

### head 头部

包含页面的元数据：

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>页面标题</title>
  <link rel="stylesheet" href="style.css">
  <script src="script.js"></script>
</head>
```

### body 主体

包含页面的可见内容：

```html
<body>
  <h1>标题</h1>
  <p>内容</p>
</body>
```

## 总结

每个 HTML 文档都包含 DOCTYPE、html、head 和 body 四个基本部分。
