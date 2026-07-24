---
title: "第三章：CSS 盒模型"
description: "content、padding、border、margin 的关系"
---

# 第三章：CSS 盒模型

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是盒模型？为什么说它是 CSS 布局的基础？
- padding 和 margin 都是间距，有什么区别？
- 为什么我设置了 width: 200px，实际元素看起来更宽？
- margin 合并是什么意思？为什么两个 margin 加起来不是 50px 而是 30px？

这一章就是为了解答这些问题。我们会先搞清楚 **盒模型的本质**，再逐个学习四个组成部分，最后掌握两种盒模型的区别和 margin 合并的原理。

---

## 3.1 为什么需要盒模型？

### 痛点分析

想象一下，如果没有盒模型的概念，会是什么样子？

- 你设置了元素宽度 200px，加了 padding 后元素变宽了，布局全乱了
- 不知道间距该用 padding 还是 margin，全靠瞎试
- 两个元素上下放，间距和你想的不一样，怎么调都不对
- 每个元素的尺寸算不清楚，布局全凭感觉

打个比方：

> 如果把 HTML 元素比作"快递包裹"，那盒模型就是包裹的"包装结构"。一个完整的包裹 = 里面的商品（content）+ 泡沫填充物（padding）+ 纸箱（border）+ 包裹之间的距离（margin）。搞懂了盒模型，你就能精确控制每个包裹的大小和摆放位置。

### 解决方案

CSS 盒模型就是用来描述**元素的尺寸和空间结构**的。每个 HTML 元素都可以看作一个矩形盒子，由四个部分组成：

- **content（内容）**：盒子里装的东西，文字、图片等
- **padding（内边距）**：内容和边框之间的填充物
- **border（边框）**：盒子的外壳
- **margin（外边距）**：盒子和其他盒子之间的距离

有了盒模型，你就能：

- 精确计算元素的实际尺寸
- 合理控制元素之间的间距
- 做出整齐、美观的页面布局
- 调试布局问题时能快速定位原因

> **一句话总结**：盒模型是 CSS 布局的"量尺"，帮你精准控制元素的大小和间距。

---

## 3.2 核心原理

### 概念解释

每个 HTML 元素都是一个"盒子"，这个盒子从内到外有四层结构：

```
┌─────────────────────────────────────┐
│              margin                 │  ← 外边距（盒子外面的距离）
│  ┌─────────────────────────────┐    │
│  │         border              │    │  ← 边框（盒子的壳）
│  │  ┌─────────────────────┐    │    │
│  │  │      padding        │    │    │  ← 内边距（填充物）
│  │  │  ┌─────────────┐    │    │    │
│  │  │  │   content   │    │    │    │  ← 内容（真正装的东西）
│  │  │  │             │    │    │    │
│  │  │  └─────────────┘    │    │    │
│  │  └─────────────────────┘    │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

打个比方：

就像你买了一台手机：
- **content（内容）** = 手机本身
- **padding（内边距）** = 手机壳和手机之间的泡沫
- **border（边框）** = 手机包装盒
- **margin（外边距）** = 两个快递包裹之间的距离

### 两种盒模型对比

| 特性 | 标准盒模型（content-box） | 替代盒模型（border-box） |
| --- | --- | --- |
| width 包含 | 只有 content | content + padding + border |
| 加 padding 后 | 元素会变宽 | 元素宽度不变，content 缩小 |
| 直观程度 | 反直觉，容易算错 | 符合直觉，说多宽就多宽 |
| 推荐度 | ❌ 不推荐 | ✅ 强烈推荐 |

---

## 3.3 盒模型四大组成部分

### 1. Content（内容区域）

content 是盒子的核心，用来显示文本、图片等实际内容。`width` 和 `height` 属性就是用来设置 content 区域的大小。

```css
.box {
  width: 200px;    /* 内容区域宽度 200px */
  height: 100px;   /* 内容区域高度 100px */
}
```

> ⚠️ **注意**：在标准盒模型下，`width` 和 `height` 只设置 content 区域，不包括 padding 和 border。

### 2. Padding（内边距）

padding 是 content 和 border 之间的空间。**背景色会延伸到 padding 区域**。

#### 四种写法

```css
.box {
  /* 写法一：四个方向相同 */
  padding: 20px;           /* 上右下左都是 20px */
}

.box {
  /* 写法二：上下 左右 */
  padding: 10px 20px;      /* 上下10px，左右20px */
}

.box {
  /* 写法三：上 左右 下 */
  padding: 10px 20px 30px; /* 上10px，左右20px，下30px */
}

.box {
  /* 写法四：上 右 下 左（顺时针方向） */
  padding: 10px 20px 30px 40px; /* 上10，右20，下30，左40 */
}
```

#### 单独设置某个方向

```css
.box {
  padding-top: 10px;       /* 上内边距 */
  padding-right: 20px;     /* 右内边距 */
  padding-bottom: 30px;    /* 下内边距 */
  padding-left: 40px;      /* 左内边距 */
}
```

> 💡 **记忆口诀**：顺时针方向——上、右、下、左，就像时钟从12点开始转一圈。

### 3. Border（边框）

border 是围绕 content 和 padding 的边框。

#### 简写方式

```css
.box {
  /* 宽度 样式 颜色 */
  border: 1px solid black;
}
```

#### 分开设置

```css
.box {
  border-width: 2px;       /* 边框宽度 */
  border-style: solid;     /* 边框样式 */
  border-color: #333;      /* 边框颜色 */
}
```

#### 边框样式

| 样式值 | 效果 | 使用场景 |
| --- | --- | --- |
| `none` | 无边框 | 去掉默认边框 |
| `solid` | 实线 | 最常用 ✅ |
| `dashed` | 虚线 | 提示框、分割线 |
| `dotted` | 点线 | 装饰性边框 |
| `double` | 双线 | 强调效果 |

#### 单独设置某个方向

```css
.box {
  border-top: 2px solid red;     /* 上边框：红色实线 */
  border-right: 1px dashed blue; /* 右边框：蓝色虚线 */
  border-bottom: 3px double green; /* 下边框：绿色双线 */
  border-left: 1px dotted gray;  /* 左边框：灰色点线 */
}
```

#### 圆角边框（border-radius）

```css
.box {
  /* 四个角相同 */
  border-radius: 8px;
}

.circle {
  width: 100px;
  height: 100px;
  border-radius: 50%; /* 正圆形 ✨ */
}
```

> ✅ **小技巧**：`border-radius: 50%` 可以把正方形变成圆形，做头像、圆形按钮超好用！

### 4. Margin（外边距）

margin 是盒子与其他盒子之间的距离。**margin 区域是透明的**，不会显示背景色。

#### 四种写法（和 padding 一样）

```css
.box {
  margin: 20px;            /* 四个方向都是 20px */
  margin: 10px 20px;       /* 上下10，左右20 */
  margin: 10px 20px 30px;  /* 上10，左右20，下30 */
  margin: 10px 20px 30px 40px; /* 顺时针 */
}
```

#### 单独设置某个方向

```css
.box {
  margin-top: 10px;
  margin-right: 20px;
  margin-bottom: 30px;
  margin-left: 40px;
}
```

#### 水平居中技巧

```css
.center-box {
  width: 200px;            /* 必须有宽度 */
  margin: 0 auto;          /* 上下0，左右自动 → 水平居中 */
}
```

> ✅ **经典技巧**：`margin: 0 auto` 是块级元素水平居中的最常用方法，前提是元素要有明确的宽度。

---

## 3.4 两种盒模型详解

### 标准盒模型（content-box）❌

这是浏览器的默认值。`width` 和 `height` 只包含 content 区域。

```
元素实际宽度 = width + padding-left + padding-right + border-left + border-right
元素实际高度 = height + padding-top + padding-bottom + border-top + border-bottom
```

**示例：**
```css
.box {
  width: 200px;            /* 你以为宽度是 200px？ */
  padding: 20px;           /* 左右各加 20px */
  border: 1px solid #ccc;  /* 左右各加 1px */
}
/* 实际宽度 = 200 + 20*2 + 1*2 = 242px！比你想的宽多了 */
```

这就很反直觉了——我明明设置了宽度 200px，结果实际是 242px，布局能不乱吗？

### 替代盒模型（border-box）✅

使用 `box-sizing: border-box` 后，`width` 和 `height` 包含了 content、padding 和 border。

```
元素实际宽度 = width（padding 和 border 都在里面）
```

**示例：**
```css
.box {
  box-sizing: border-box;   /* 关键！ */
  width: 200px;             /* 实际宽度就是 200px */
  padding: 20px;            /* content 自动缩小为 158px */
  border: 1px solid #ccc;
}
/* 实际宽度 = 200px，和你设置的一模一样！ */
```

这就符合直觉了——我说多宽就多宽，padding 和 border 都在里面挤。

### 全局设置 border-box（推荐）

```css
/* 全局所有元素都用 border-box */
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

> ✅ **强烈推荐**：项目一开始就全局设置 `box-sizing: border-box`，从此再也不用纠结尺寸计算问题！

### 两种盒模型对比表

| 对比项 | content-box（标准） | border-box（替代） |
| --- | --- | --- |
| width 包含 | 只有 content | content + padding + border |
| 加 padding 后 | 元素变宽 | 元素宽度不变 |
| 直观程度 | 反直觉，容易踩坑 | 符合直觉，说多宽就多宽 |
| 计算难度 | 每次都要加一遍 | 不用算，设置多少就是多少 |
| 推荐度 | ❌ 不推荐 | ✅ 强烈推荐 |

---

## 3.5 Margin 合并（外边距塌陷）

### 什么是 margin 合并？

垂直方向上，两个相邻的 margin 会**合并成一个**，取较大的那个值，而不是相加。

打个比方：就像两个人各有一堵墙，两堵墙挨在一起时，它们之间的距离不是两堵墙的厚度相加，而是取较厚的那堵墙的厚度。

### 情况一：相邻兄弟元素

```css
.box1 {
  margin-bottom: 20px;     /* 下外边距 20px */
}

.box2 {
  margin-top: 30px;        /* 上外边距 30px */
}
```

```html
<div class="box1">盒子1</div>
<div class="box2">盒子2</div>
```

**实际间距是多少？**
- ❌ 不是 20 + 30 = 50px
- ✅ 而是 30px（取较大值）

### 情况二：父子元素

如果父元素没有 border 或 padding 隔开，子元素的 margin-top 会"跑出去"和父元素的 margin-top 合并。

```html
<div class="parent">
  <div class="child">内容</div>
</div>
```

```css
.parent {
  margin-top: 20px;
}

.child {
  margin-top: 30px;
}
```

**结果**：父元素的实际 margin-top 是 30px（取较大值），子元素的 margin-top 就像"消失"了一样。

### 如何解决 margin 合并？

1. **加 border 或 padding**：给父元素加 1px 的 border 或 padding 隔开
2. **用 overflow: hidden**：给父元素加 `overflow: hidden`
3. **用 Flexbox 或 Grid 布局**：Flex 子项不会发生 margin 合并
4. **统一只用一个方向的 margin**：比如都用 margin-bottom，就不会有上下合并的问题

> 💡 **最佳实践**：布局中尽量统一使用 margin-bottom 来设置间距，避免上下 margin 合并的问题。

### 情况三：空元素

如果一个元素没有内容，也没有 border 和 padding，它的 margin-top 和 margin-bottom 会合并。

```css
.empty {
  margin-top: 20px;
  margin-bottom: 30px;
}
/* 实际占据高度 = 30px，不是 50px */
```

---

## 3.6 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| content | 内容区域，`width`/`height` 设置的地方 |
| padding | 内边距，背景色会延伸 |
| border | 边框，盒子的外壳 |
| margin | 外边距，盒子之间的距离，透明的 |
| 标准盒模型 | `width` 只包含 content，不推荐 ❌ |
| 替代盒模型 | `width` 包含 content+padding+border，推荐 ✅ |
| `box-sizing: border-box` | 切换为替代盒模型，建议全局设置 |
| margin 合并 | 垂直方向相邻 margin 取较大值 |
| 水平居中 | `margin: 0 auto`（前提是有宽度） |

---

## 3.7 新手常见误区

### 误区 1："padding 和 margin 都是间距，随便用哪个都行"

**错！** 它们区别很大：

- **padding**：在 border 里面，背景色会延伸，用来撑开元素内部空间
- **margin**：在 border 外面，是透明的，用来控制元素之间的距离

怎么选？
- 想要元素内部空间变大 → 用 padding
- 想要元素和其他元素离远点 → 用 margin

打个比方：padding 就像你穿的棉衣，让你自己变胖；margin 就像你和别人之间的距离，你俩都没变，只是离得远了。

### 误区 2："我设置了 width: 300px，元素宽度就一定是 300px"

**不一定！** 要看用的是哪种盒模型：

- 标准盒模型（默认）：实际宽度 = width + padding + border
- 替代盒模型（border-box）：实际宽度 = width

新手最容易在这里踩坑——明明设置了宽度，加了 padding 后布局就乱了。

正确做法：全局设置 `box-sizing: border-box`，从此告别尺寸计算烦恼。

### 误区 3："两个元素上下间距应该是两个 margin 相加"

**错！** 垂直方向的 margin 会合并，取较大值。

比如上面元素 margin-bottom: 20px，下面元素 margin-top: 30px，实际间距是 30px，不是 50px。

正确做法：
- 理解 margin 合并的规则
- 尽量统一用一个方向的 margin（比如都用 margin-bottom）
- 或者用 padding 代替部分 margin

### 误区 4："margin: 0 auto 能让所有元素居中"

**不是的。** `margin: 0 auto` 只对**块级元素**有效，而且有前提：

1. 必须是块级元素（如 div、p、h1 等）
2. 元素必须有明确的宽度（width）
3. 只对水平方向有效，垂直方向不行

行内元素（如 span、a）用 `margin: 0 auto` 是没用的，它们本来就不能设置宽高。

### 误区 5："border-radius 只能做圆角"

**不只是！** `border-radius` 玩法很多：

```css
/* 圆形 */
border-radius: 50%;

/* 胶囊形状 */
border-radius: 999px;

/* 只给左上角加圆角 */
border-top-left-radius: 10px;

/* 四个角不一样 */
border-radius: 10px 20px 30px 40px;
```

按钮、头像、卡片...都离不开 `border-radius`。

---

## 3.8 动手练习

### 练习 1：基础练习

创建一个 HTML 页面，实现以下效果：

- 一个 300px 宽、200px 高的盒子
- 背景色浅蓝色，边框 2px 实线深蓝色
- 内边距 20px
- 使用 border-box 盒模型
- 盒子水平居中
- 盒子里有一段文字，文字和边框之间有明显距离

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习1：基础盒模型</title>
  <style>
    /* 全局设置 border-box */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      padding: 40px;
      background-color: #f5f5f5;
      font-family: Arial, sans-serif;
    }

    .box {
      width: 300px;               /* 宽度300px */
      height: 200px;              /* 高度200px */
      background-color: #e3f2fd;  /* 浅蓝色背景 */
      border: 2px solid #1976d2;  /* 深蓝色边框 */
      padding: 20px;              /* 内边距20px */
      margin: 0 auto;             /* 水平居中 */
    }

    .box p {
      color: #333;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="box">
    <p>这是一个使用盒模型的盒子。通过设置 width、padding、border，我们可以精确控制元素的外观。</p>
  </div>
</body>
</html>
```

</details>

### 练习 2：进阶练习

创建一个卡片组件列表，包含 3 张卡片：

- 每张卡片宽度 300px，有白色背景、圆角、阴影
- 卡片内有图片区域（200px 高，灰色背景）、标题、描述
- 卡片内边距 20px，图片和文字之间有间距
- 卡片之间垂直间距 20px
- 整体水平居中
- 鼠标悬停在卡片上时，阴影加深，向上微微移动

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习2：卡片列表</title>
  <style>
    /* 全局重置 */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      padding: 40px;
      background-color: #f5f5f5;
      font-family: Arial, sans-serif;
    }

    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 30px;
    }

    /* 卡片容器 */
    .card-list {
      max-width: 340px;
      margin: 0 auto;
    }

    /* 卡片样式 */
    .card {
      width: 300px;
      margin: 0 auto 20px;        /* 水平居中，底部间距20px */
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.3s;       /* 过渡动画 */
      cursor: pointer;
    }

    /* 最后一张卡片去掉底部间距 */
    .card:last-child {
      margin-bottom: 0;
    }

    /* 鼠标悬停效果 */
    .card:hover {
      transform: translateY(-4px); /* 向上移动4px */
      box-shadow: 0 8px 20px rgba(0,0,0,0.15); /* 阴影加深 */
    }

    /* 卡片图片区域 */
    .card-image {
      height: 200px;
      background-color: #e0e0e0;
      border-radius: 4px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 14px;
    }

    /* 卡片标题 */
    .card-title {
      font-size: 18px;
      color: #333;
      margin-bottom: 8px;
    }

    /* 卡片描述 */
    .card-desc {
      font-size: 14px;
      color: #666;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <h1>精选卡片</h1>
  
  <div class="card-list">
    <div class="card">
      <div class="card-image">图片占位</div>
      <h3 class="card-title">卡片标题一</h3>
      <p class="card-desc">这是第一张卡片的描述文字，介绍卡片的主要内容和特点。</p>
    </div>

    <div class="card">
      <div class="card-image">图片占位</div>
      <h3 class="card-title">卡片标题二</h3>
      <p class="card-desc">这是第二张卡片的描述文字，介绍卡片的主要内容和特点。</p>
    </div>

    <div class="card">
      <div class="card-image">图片占位</div>
      <h3 class="card-title">卡片标题三</h3>
      <p class="card-desc">这是第三张卡片的描述文字，介绍卡片的主要内容和特点。</p>
    </div>
  </div>
</body>
</html>
```

</details>

### 练习 3（挑战）：个人信息卡片

创建一个精美的个人信息卡片：

- 圆形头像（用 div 模拟，100px 直径）
- 头像和卡片顶部重叠一部分（往上移动一点）
- 姓名、职业、个人简介
- 有三个数据统计（关注、粉丝、获赞）横向排列
- 底部有一个"关注"按钮，圆角胶囊形状
- 整体设计美观，间距合理
- 使用 border-box 盒模型

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习3：个人信息卡片</title>
  <style>
    /* 全局重置 */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      padding: 60px 20px;
      background-color: #f0f2f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* 卡片容器 */
    .profile-card {
      width: 320px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      padding: 0 24px 24px;
      text-align: center;
      position: relative;
    }

    /* 顶部封面区域 */
    .cover {
      height: 80px;
      margin: 0 -24px 0;
      border-radius: 12px 12px 0 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    /* 头像 */
    .avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background-color: #ddd;
      border: 4px solid white;
      margin: -50px auto 16px; /* 负margin让头像上移 */
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      font-weight: bold;
    }

    /* 姓名 */
    .name {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }

    /* 职业 */
    .job {
      font-size: 14px;
      color: #888;
      margin-bottom: 16px;
    }

    /* 个人简介 */
    .bio {
      font-size: 14px;
      color: #666;
      line-height: 1.6;
      margin-bottom: 20px;
      padding: 0 10px;
    }

    /* 数据统计区 */
    .stats {
      display: flex;
      justify-content: space-around;
      padding: 16px 0;
      margin-bottom: 20px;
      border-top: 1px solid #f0f0f0;
      border-bottom: 1px solid #f0f0f0;
    }

    .stat-item {
      flex: 1;
    }

    .stat-number {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      color: #999;
    }

    /* 关注按钮 */
    .follow-btn {
      width: 100%;
      padding: 12px 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 999px;  /* 胶囊形状 */
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
    }

    .follow-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  </style>
</head>
<body>
  <div class="profile-card">
    <!-- 顶部封面 -->
    <div class="cover"></div>
    
    <!-- 头像 -->
    <div class="avatar">张</div>
    
    <!-- 姓名 -->
    <h2 class="name">张三</h2>
    
    <!-- 职业 -->
    <p class="job">前端工程师 / 技术博主</p>
    
    <!-- 简介 -->
    <p class="bio">热爱编程，分享前端技术。专注 Vue、React 等框架，致力于写出优雅的代码。</p>
    
    <!-- 数据统计 -->
    <div class="stats">
      <div class="stat-item">
        <div class="stat-number">128</div>
        <div class="stat-label">关注</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">2.3k</div>
        <div class="stat-label">粉丝</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">890</div>
        <div class="stat-label">获赞</div>
      </div>
    </div>
    
    <!-- 关注按钮 -->
    <button class="follow-btn">+ 关注</button>
  </div>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **CSS 文本与字体**——也就是如何让文字变得好看又好读。你会学到字体选择、字号设置、行高调整、文本对齐等技巧，掌握了文本样式，才能让你的网页内容赏心悦目。
