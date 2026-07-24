---
title: "第六章：表格"
description: "表格结构、表头、合并单元格"
---

# 第六章：表格

## 基本表格

```html
<table>
  <tr>
    <th>姓名</th>
    <th>年龄</th>
    <th>城市</th>
  </tr>
  <tr>
    <td>张三</td>
    <td>25</td>
    <td>北京</td>
  </tr>
  <tr>
    <td>李四</td>
    <td>30</td>
    <td>上海</td>
  </tr>
</table>
```

## 表格结构标签

```html
<table>
  <thead>
    <tr>
      <th>姓名</th>
      <th>年龄</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>张三</td>
      <td>25</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td>总计</td>
      <td>1 人</td>
    </tr>
  </tfoot>
</table>
```

## 合并单元格

### 跨列合并

```html
<table>
  <tr>
    <th colspan="2">基本信息</th>
  </tr>
  <tr>
    <td>姓名</td>
    <td>张三</td>
  </tr>
</table>
```

### 跨行合并

```html
<table>
  <tr>
    <td rowspan="2">多行内容</td>
    <td>第一行</td>
  </tr>
  <tr>
    <td>第二行</td>
  </tr>
</table>
```

## 表格标题

```html
<table>
  <caption>员工信息表</caption>
  <tr>
    <th>姓名</th>
    <th>职位</th>
  </tr>
  <tr>
    <td>张三</td>
    <td>工程师</td>
  </tr>
</table>
```

## 表格样式

```css
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
```

## 总结

表格用于展示结构化数据，合理使用表格标签可以让数据更清晰易读。
