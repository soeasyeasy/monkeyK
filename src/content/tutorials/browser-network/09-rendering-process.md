---
title: "第九章：浏览器渲染流程"
description: "DOM 构建、CSSOM、渲染树、布局与绘制"
---

# 第九章：浏览器渲染流程

## 渲染流程概述

浏览器将 HTML、CSS 和 JavaScript 转换为用户可见的页面，经历以下关键步骤：

```
HTML → DOM 树
CSS → CSSOM 树
DOM + CSSOM → 渲染树
渲染树 → 布局（Layout）
布局 → 绘制（Paint）
绘制 → 合成（Composite）
```

## DOM 构建

### HTML 解析过程

1. 字节流 → 字符
2. 字符 → 标记（Token）
3. 标记 → 节点
4. 节点 → DOM 树

### 解析特点
- 增量解析：边接收边解析
- 容错处理：自动修正错误标签
- 阻塞特性：遇到 `<script>` 会暂停解析

## CSSOM 构建

### CSS 解析过程

1. 解析 CSS 文件
2. 构建 CSSOM 树
3. 处理继承和层叠

### CSSOM 特点
- 阻塞渲染：必须等待 CSSOM 构建完成
- 级联规则：根据优先级应用样式
- 继承机制：子元素继承父元素样式

## 渲染树构建

### 渲染树 vs DOM 树

| 特性 | DOM 树 | 渲染树 |
| --- | --- | --- |
| 包含元素 | 所有元素 | 仅可见元素 |
| 隐藏元素 | 包含 | 不包含 |
| 样式信息 | 无 | 包含计算样式 |

### 构建规则
- `display: none` 的元素不加入
- `visibility: hidden` 的元素加入但不显示
- 伪元素（如 `::before`）加入渲染树

## 布局（Layout）

### 布局计算内容

| 属性 | 说明 |
| --- | --- |
| 位置 | 元素在页面中的坐标 |
| 大小 | 元素的宽度和高度 |
| 盒模型 | content、padding、border、margin |

### 布局算法

1. **普通流布局**：块级元素垂直排列，行内元素水平排列
2. **浮动布局**：元素脱离文档流，向左或向右浮动
3. **定位布局**：根据定位属性计算位置
4. **Flexbox 布局**：弹性盒子，一维布局
5. **Grid 布局**：网格布局，二维布局

## 绘制（Paint）

### 绘制顺序

1. 背景
2. 边框
3. 内容
4. 轮廓
5. 阴影

### 层叠上下文
- 定位元素（z-index）
- 浮动元素
- 普通元素

## 合成（Composite）

### 分层合成

浏览器将页面分成多个层，独立绘制后合成：

| 层类型 | 触发条件 |
| --- | --- |
| 普通层 | 默认 |
| 提升层 | `will-change`、`transform` |
| 视频层 | `<video>` 元素 |
| Canvas 层 | `<canvas>` 元素 |

### 合成优势
- 避免重绘：移动层不需要重绘其他层
- 硬件加速：GPU 处理合成
- 动画优化：transform 和 opacity 动画高效

## 关键渲染路径

### 影响渲染的因素

| 资源 | 阻塞类型 | 优化方法 |
| --- | --- | --- |
| CSS | 阻塞渲染 | 内联关键 CSS、异步加载 |
| JavaScript | 阻塞解析 | 延迟加载、异步执行 |
| 图片 | 不阻塞 | 懒加载、响应式图片 |
| 字体 | 可能阻塞 | 字体预加载 |

### 优化策略

1. **减少关键资源数量**
2. **最小化关键路径长度**
3. **减少关键字节数**

## 重排与重绘

### 重排（Reflow）
布局发生变化，需要重新计算元素位置和大小：

| 触发条件 | 示例 |
| --- | --- |
| 几何属性变化 | width、height、margin |
| 内容变化 | 文本长度改变 |
| 窗口变化 | 浏览器大小调整 |
| 样式变化 | 字体大小改变 |

### 重绘（Repaint）
外观变化但布局不变：

| 触发条件 | 示例 |
| --- | --- |
| 颜色变化 | color、background |
| 可见性 | visibility、outline |

### 优化建议

```javascript
// 避免频繁触发重排
const element = document.getElementById('box');
element.style.width = '100px';
element.style.height = '100px';
element.style.margin = '10px';

// 批量修改样式
element.style.cssText += 'width: 100px; height: 100px; margin: 10px;';

// 使用 transform 代替位置变化
element.style.transform = 'translateX(100px)';
```

## 本章小结

浏览器渲染流程包括 DOM 构建、CSSOM 构建、渲染树构建、布局、绘制和合成。理解这些过程有助于优化页面性能，减少重排重绘，提升用户体验。
