---
title: "第六章：表格"
description: "表格结构、表头、合并单元格"
---

# 第六章：表格

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何用 HTML 创建表格？表格的基本结构是什么？
- 表头、表体、表脚分别用什么标签？
- 如何合并单元格？colspan 和 rowspan 有什么区别？
- 表格应该什么时候用？什么时候不该用？

这一章就是为了解答这些问题。我们会学习如何用 HTML 表格展示结构化数据，让数据更加清晰易读。

---

## 1 为什么需要表格？

### 痛点分析

想象一下，如果没有表格，我们要展示结构化数据：

- 使用 `<p>` 和 `<br>` 手动对齐，格式混乱
- 数据列不对齐，难以阅读
- 无法区分表头和数据
- 无法展示复杂的关联数据

### 解决方案

表格是展示结构化数据的最佳方式，可以清晰地展示行和列的关系。

> **一句话总结**：表格让结构化数据变得整齐有序、一目了然。

打个比方：

> HTML 表格就像 Excel 表格一样，用行和列来组织数据。表头告诉我们每列是什么，数据行展示具体内容，让复杂的数据变得清晰易懂。

---

## 2 核心原理

### 概念解释

HTML 表格由以下核心标签组成：

1. **`<table>`**：表格容器
2. **`<tr>`**：表格行（table row）
3. **`<th>`**：表头单元格（table header）
4. **`<td>`**：数据单元格（table data）
5. **`<thead>`**：表头区域（可选）
6. **`<tbody>`**：表体区域（可选）
7. **`<tfoot>`**：表脚区域（可选）
8. **`<caption>`**：表格标题

浏览器会按照 `<tr>`、`<th>`、`<td>` 的结构渲染表格，自动对齐列。

### 对比分析

| 标签 | 语义 | 说明 |
| --- | --- | --- |
| `<table>` | 表格容器 | 包含所有表格内容 |
| `<tr>` | 表格行 | 定义一行单元格 |
| `<th>` | 表头单元格 | 定义表头，默认加粗居中 |
| `<td>` | 数据单元格 | 定义数据，默认左对齐 |
| `<thead>` | 表头区域 | 包裹表头行，便于样式控制 |
| `<tbody>` | 表体区域 | 包裹数据行 |
| `<tfoot>` | 表脚区域 | 包裹表脚行，如总计 |

---

## 3 基础用法

### 基本表格

```html
<!-- 最简单的表格 -->
<table>
  <!-- 第一行：表头 -->
  <tr>
    <th>姓名</th>
    <th>年龄</th>
    <th>城市</th>
  </tr>
  <!-- 第二行：数据 -->
  <tr>
    <td>张三</td>
    <td>25</td>
    <td>北京</td>
  </tr>
  <!-- 第三行：数据 -->
  <tr>
    <td>李四</td>
    <td>30</td>
    <td>上海</td>
  </tr>
</table>
```

> **原理**：`<tr>` 定义行，每行包含多个 `<th>`（表头）或 `<td>`（数据）。

### 完整的表格结构

```html
<!-- 使用 thead、tbody、tfoot 的完整表格 -->
<table>
  <!-- 表格标题 -->
  <caption>员工信息表</caption>
  
  <!-- 表头区域 -->
  <thead>
    <tr>
      <th>姓名</th>
      <th>年龄</th>
      <th>职位</th>
    </tr>
  </thead>
  
  <!-- 表体区域 -->
  <tbody>
    <tr>
      <td>张三</td>
      <td>25</td>
      <td>前端工程师</td>
    </tr>
    <tr>
      <td>李四</td>
      <td>30</td>
      <td>后端工程师</td>
    </tr>
    <tr>
      <td>王五</td>
      <td>28</td>
      <td>产品经理</td>
    </tr>
  </tbody>
  
  <!-- 表脚区域 -->
  <tfoot>
    <tr>
      <td>总计</td>
      <td colspan="2">3 人</td>
    </tr>
  </tfoot>
</table>
```

### 合并单元格

#### 跨列合并（colspan）

```html
<!-- 合并多列 -->
<table>
  <tr>
    <th colspan="2">基本信息</th>
    <th>联系方式</th>
  </tr>
  <tr>
    <td>姓名</td>
    <td>张三</td>
    <td>13800138000</td>
  </tr>
</table>
```

> **原理**：`colspan="2"` 表示这个单元格跨越 2 列。

#### 跨行合并（rowspan）

```html
<!-- 合并多行 -->
<table>
  <tr>
    <td rowspan="2">技术部</td>
    <td>张三</td>
    <td>前端工程师</td>
  </tr>
  <tr>
    <td>李四</td>
    <td>后端工程师</td>
  </tr>
</table>
```

> **原理**：`rowspan="2"` 表示这个单元格跨越 2 行。

#### 复杂合并示例

```html
<!-- 综合使用 colspan 和 rowspan -->
<table>
  <tr>
    <th rowspan="2">部门</th>
    <th colspan="2">员工</th>
  </tr>
  <tr>
    <th>姓名</th>
    <th>职位</th>
  </tr>
  <tr>
    <td rowspan="2">技术部</td>
    <td>张三</td>
    <td>前端</td>
  </tr>
  <tr>
    <td>李四</td>
    <td>后端</td>
  </tr>
  <tr>
    <td>产品部</td>
    <td>王五</td>
    <td>产品经理</td>
  </tr>
</table>
```

### 表格标题

```html
<!-- 添加表格标题 -->
<table>
  <caption>2024 年销售数据</caption>
  <tr>
    <th>月份</th>
    <th>销售额</th>
  </tr>
  <tr>
    <td>1月</td>
    <td>¥10,000</td>
  </tr>
</table>
```

---

## 4 表格样式

```html
<!-- 添加基本样式的表格 -->
<style>
table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

caption {
  font-weight: bold;
  margin-bottom: 8px;
}
</style>

<table>
  <caption>学生成绩表</caption>
  <tr>
    <th>姓名</th>
    <th>语文</th>
    <th>数学</th>
    <th>英语</th>
  </tr>
  <tr>
    <td>张三</td>
    <td>90</td>
    <td>85</td>
    <td>92</td>
  </tr>
  <tr>
    <td>李四</td>
    <td>88</td>
    <td>95</td>
    <td>80</td>
  </tr>
</table>
```

---

## 5 核心知识点总结

| 标签 | 语义 | 说明 |
| --- | --- | --- |
| `<table>` | 表格容器 | 包含所有表格内容 |
| `<tr>` | 表格行 | 定义一行 |
| `<th>` | 表头单元格 | 表头，默认加粗居中 |
| `<td>` | 数据单元格 | 数据内容 |
| `<thead>` | 表头区域 | 包裹表头行 |
| `<tbody>` | 表体区域 | 包裹数据行 |
| `<tfoot>` | 表脚区域 | 包裹表脚行 |
| `<caption>` | 表格标题 | 表格的标题 |
| `colspan` | 跨列合并 | 单元格跨越的列数 |
| `rowspan` | 跨行合并 | 单元格跨越的行数 |

---

## 6 新手常见误区

### 误区 1："表格可以用来布局"

**错！** 表格是用来展示数据的，不是用来布局页面的。使用表格布局会导致：
- 代码结构混乱
- 难以维护
- 响应式设计困难

**错误写法 ❌**：
```html
<!-- 不要用表格布局页面 -->
<table>
  <tr>
    <td>导航栏</td>
  </tr>
  <tr>
    <td>内容区域</td>
  </tr>
</table>
```

**正确写法 ✅**：
```html
<!-- 用语义化标签布局 -->
<header>导航栏</header>
<main>内容区域</main>
```

### 误区 2："`<th>` 和 `<td>` 可以混用"

**错！** `<th>` 用于表头，`<td>` 用于数据，它们的语义不同。

**错误写法 ❌**：
```html
<tr>
  <td>姓名</td>  <!-- 应该用 th -->
  <td>年龄</td>  <!-- 应该用 th -->
</tr>
```

**正确写法 ✅**：
```html
<tr>
  <th>姓名</th>
  <th>年龄</th>
</tr>
```

### 误区 3："合并单元格时忘记减少单元格数量"

**错！** 使用 colspan 或 rowspan 后，同一行/列的其他单元格数量要相应减少。

**错误写法 ❌**：
```html
<tr>
  <th colspan="2">基本信息</th>
  <th>年龄</th>  <!-- 错误！已经合并了2列，这里多了一个 -->
</tr>
```

**正确写法 ✅**：
```html
<tr>
  <th colspan="2">基本信息</th>
</tr>
```

### 误区 4："每个表格都需要 thead、tbody、tfoot"

不是的。简单表格可以省略这些标签，直接用 `<table>`、`<tr>`、`<th>`、`<td>`。

**错误写法 ❌**：
```html
<!-- 简单表格不需要强行使用 thead/tbody/tfoot -->
<table>
  <thead>
    <tr><th>标题</th></tr>
  </thead>
  <tbody>
    <tr><td>内容</td></tr>
  </tbody>
</table>
```

**正确写法 ✅**：
```html
<table>
  <tr><th>标题</th></tr>
  <tr><td>内容</td></tr>
</table>
```

### 误区 5："表格不需要边框"

不是的。默认情况下表格没有边框，数据难以区分。应该使用 CSS 添加边框。

**错误写法 ❌**：
```html
<!-- 没有边框，数据难以区分 -->
<table>
  <tr><th>姓名</th><th>年龄</th></tr>
  <tr><td>张三</td><td>25</td></tr>
</table>
```

**正确写法 ✅**：
```html
<style>
  table, th, td { border: 1px solid #ddd; }
</style>
<table>
  <tr><th>姓名</th><th>年龄</th></tr>
  <tr><td>张三</td><td>25</td></tr>
</table>
```

---

## 7 动手练习

### 练习 1：基础练习

创建一个 HTML 页面，包含一个简单的学生成绩表，包含：
- 页面标题"学生成绩表"
- 表格标题"2024 年期中考试成绩"
- 表头：姓名、语文、数学、英语
- 两行数据

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>学生成绩表</title>
  <style>
    table, th, td { border: 1px solid #ddd; border-collapse: collapse; padding: 8px; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>学生成绩表</h1>
  
  <table>
    <caption>2024 年期中考试成绩</caption>
    <tr>
      <th>姓名</th>
      <th>语文</th>
      <th>数学</th>
      <th>英语</th>
    </tr>
    <tr>
      <td>张三</td>
      <td>90</td>
      <td>85</td>
      <td>92</td>
    </tr>
    <tr>
      <td>李四</td>
      <td>88</td>
      <td>95</td>
      <td>80</td>
    </tr>
  </table>
</body>
</html>
```

</details>

### 练习 2：进阶练习

创建一个 HTML 页面，包含一个部门员工表，包含：
- 使用 thead、tbody、tfoot
- 合并单元格展示部门信息
- 添加表格样式

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>部门员工表</title>
  <style>
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    caption { font-weight: bold; margin-bottom: 8px; }
  </style>
</head>
<body>
  <h1>部门员工表</h1>
  
  <table>
    <caption>公司组织架构</caption>
    <thead>
      <tr>
        <th>部门</th>
        <th>姓名</th>
        <th>职位</th>
        <th>入职时间</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td rowspan="3">技术部</td>
        <td>张三</td>
        <td>前端工程师</td>
        <td>2022-01</td>
      </tr>
      <tr>
        <td>李四</td>
        <td>后端工程师</td>
        <td>2022-03</td>
      </tr>
      <tr>
        <td>王五</td>
        <td>测试工程师</td>
        <td>2023-01</td>
      </tr>
      <tr>
        <td rowspan="2">产品部</td>
        <td>赵六</td>
        <td>产品经理</td>
        <td>2021-06</td>
      </tr>
      <tr>
        <td>钱七</td>
        <td>UI 设计师</td>
        <td>2022-08</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td>总计</td>
        <td colspan="3">5 人</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习

创建一个 HTML 页面，包含一个复杂的销售报表，包含：
- 季度销售数据
- 合并单元格展示季度和月份
- 包含总计行
- 完整的表格结构和样式

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>销售报表</title>
  <style>
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: center; }
    th { background-color: #4CAF50; color: white; }
    caption { font-weight: bold; font-size: 1.2em; margin-bottom: 10px; }
    tfoot { background-color: #f2f2f2; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9f9f9; }
  </style>
</head>
<body>
  <h1>销售报表</h1>
  
  <table>
    <caption>2024 年度销售数据</caption>
    <thead>
      <tr>
        <th rowspan="2">季度</th>
        <th rowspan="2">月份</th>
        <th colspan="2">销售额（万元）</th>
      </tr>
      <tr>
        <th>产品 A</th>
        <th>产品 B</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td rowspan="3">第一季度</td>
        <td>1月</td>
        <td>50</td>
        <td>30</td>
      </tr>
      <tr>
        <td>2月</td>
        <td>60</td>
        <td>35</td>
      </tr>
      <tr>
        <td>3月</td>
        <td>55</td>
        <td>40</td>
      </tr>
      <tr>
        <td rowspan="3">第二季度</td>
        <td>4月</td>
        <td>70</td>
        <td>45</td>
      </tr>
      <tr>
        <td>5月</td>
        <td>75</td>
        <td>50</td>
      </tr>
      <tr>
        <td>6月</td>
        <td>80</td>
        <td>55</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2">上半年总计</td>
        <td>390</td>
        <td>255</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **表单基础**——也就是如何用 HTML 创建表单，收集用户输入。你会学到 input、textarea、button、label 等表单元素，以及如何让用户与网页进行交互。