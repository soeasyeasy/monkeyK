---
title: "第十章：CSS 过渡与动画"
description: "transition 过渡、animation 动画、@keyframes 关键帧详解"
---

# 第十章：CSS 过渡与动画

## 本章导读

在学这一章之前，你可能会有这些疑问：

- CSS 也能做动画？不是要用 JavaScript 吗？
- transition 和 animation 有什么区别？分别什么时候用？
- @keyframes 是什么？怎么写关键帧动画？
- 做动画会不会让页面变卡？怎么优化性能？

这一章就是为了解答这些问题。我们会先搞清楚 **CSS 动画的本质**，再学习 transition 和 animation 两种动画方式，最后动手实践。

---

## 10.1 为什么需要 CSS 动画？

### 痛点分析

想象一下，如果网页没有任何动画，会是什么感觉？

- 按钮点下去没反应，不知道点到了没有
- 页面切换很突兀，"唰"一下就变了
- 交互反馈不及时，用户体验冷冰冰
- 整个页面像一张静态图片，没有生气

以前做动画只能用 JavaScript，但是：

- 写起来麻烦，代码量大
- 性能不好控制，容易卡顿
- 简单的效果也要写一堆 JS 代码

打个比方：

> 没有动画的网页就像是一部默片，人物动起来很生硬。而 CSS 动画就像是给网页加上了"流畅的动作"，让交互变得自然、有温度。

### 解决方案

CSS 提供了两种动画方式：

1. **transition（过渡）**：元素从一个状态平滑过渡到另一个状态
2. **animation（动画）**：通过关键帧定义更复杂的动画效果

有了 CSS 动画，你可以：

- 让按钮悬停时颜色渐变，更有质感
- 让卡片悬浮时轻轻上浮，增加层次感
- 让页面加载时有淡入效果，体验更好
- 做各种加载动画、弹窗动画，提升品质感
- 不用写 JS，纯 CSS 就能实现，性能还更好

> **一句话总结**：CSS 动画就是网页的"润滑剂"，让状态变化变得平滑自然，让页面更有生命力。

---

## 10.2 核心原理

### 概念解释

#### 什么是过渡（Transition）？

过渡就是**当元素的某个属性发生变化时，不是瞬间变过去，而是平滑地过渡过去**。

就像日出日落——天不是突然亮或突然黑的，而是慢慢变亮、慢慢变暗，这个"慢慢变化"的过程就是过渡。

#### 什么是动画（Animation）？

动画就是**通过定义一系列关键帧（keyframes），让元素按照设定的步骤自动播放**。

就像是动画片——画好了每一帧的画面，然后按顺序播放，就动起来了。

打个比方：

> - **Transition** 就像是电梯门——你按一下按钮，门从"关"的状态平滑过渡到"开"的状态。它需要一个触发条件（比如按按钮、鼠标悬停）。
> - **Animation** 就像是旋转木马——它自己会一圈一圈转，不需要你每次去推。它可以自动播放、循环播放。

### 过渡 vs 动画对比

| 特性 | transition 过渡 | animation 动画 |
| --- | --- | --- |
| 触发方式 | 需要触发（hover、click 等） | 自动播放，或触发后播放 |
| 关键帧 | 只有开始和结束两帧 | 可以定义任意多关键帧 |
| 循环播放 | ❌ 不能循环 | ✅ 可以循环（infinite） |
| 控制力度 | 简单，只有开始和结束 | 强大，每一帧都能控制 |
| 代码量 | 少，简单 | 多，复杂 |
| 使用场景 | 状态变化（hover、focus 等） | 复杂动画、加载动画、特效 |

---

## 10.3 基础用法：过渡（Transition）

### transition 基本语法

```css
.element {
  /* transition: 属性名 持续时间 速度曲线 延迟时间 */
  transition: all 0.3s ease 0s;
}
```

四个参数：
1. **transition-property**：要过渡的属性（all 表示所有属性）
2. **transition-duration**：过渡持续时间（单位 s 或 ms）
3. **transition-timing-function**：速度曲线（ease、linear 等）
4. **transition-delay**：延迟多久开始（可选，默认 0）

---

### 最简单的例子：按钮悬停变色

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>过渡动画示例</title>
  <style>
    body {
      padding: 40px;
      font-family: Arial, sans-serif;
    }

    .btn {
      /* 按钮基础样式 */
      padding: 12px 32px;               /* 内边距 */
      background-color: #007bff;        /* 蓝色背景 */
      color: white;                     /* 白色文字 */
      border: none;                     /* 去掉边框 */
      border-radius: 8px;               /* 圆角 */
      font-size: 16px;                  /* 字号 */
      cursor: pointer;                  /* 鼠标变手型 */
      
      /* ✅ 关键：设置过渡效果 */
      /* 背景色变化时，用0.3秒平滑过渡 */
      transition: background-color 0.3s ease;
    }

    /* 鼠标悬停时的状态 */
    .btn:hover {
      background-color: #0056b3;        /* 深蓝色 */
    }
  </style>
</head>
<body>
  <button class="btn">悬停看看效果</button>
</body>
</html>
```

> **原理**：当鼠标悬停时，`background-color` 从 `#007bff` 变成 `#0056b3`。因为设置了 transition，浏览器会自动在 0.3 秒内平滑地从前者过渡到后者，而不是瞬间变色。

✅ **正确写法**：把 transition 写在元素的**基础样式**里（而不是 hover 里），这样鼠标移入和移出都有过渡效果。

❌ **错误写法**：把 transition 只写在 hover 里——鼠标移入有过渡，移出就瞬间变回去，很突兀。

---

### 多个属性同时过渡

```css
.card {
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transform: translateY(0);
  
  /* 多个属性用逗号分隔 */
  transition: 
    transform 0.3s ease,       /* 位移变化：0.3秒 */
    box-shadow 0.3s ease;      /* 阴影变化：0.3秒 */
}

.card:hover {
  transform: translateY(-4px);    /* 向上移动4px */
  box-shadow: 0 8px 16px rgba(0,0,0,0.15);  /* 阴影变大变深 */
}
```

> 💡 **小提示**：也可以用 `all` 表示所有属性都过渡，但不推荐——性能不好，而且有些属性不需要过渡。最好明确指定要过渡的属性。

---

### 速度曲线（timing-function）

速度曲线决定了动画的"节奏"——是匀速，还是先快后慢，还是先慢后快？

| 值 | 效果 | 描述 | 适用场景 |
| --- | --- | --- | --- |
| `ease` | 慢-快-慢 | 默认值，最自然 | 大多数场景 |
| `linear` | 匀速 | 从头到尾速度一样 | 旋转、加载进度条 |
| `ease-in` | 慢入 | 开始慢，越来越快 | 物体移出屏幕 |
| `ease-out` | 慢出 | 开始快，越来越慢 | 物体进入屏幕、弹窗出现 |
| `ease-in-out` | 慢入慢出 | 开始和结束都慢，中间快 | 更柔和的效果 |
| `cubic-bezier()` | 自定义 | 自定义贝塞尔曲线 | 特殊效果 |

```css
/* 各种速度曲线对比 */
.box1 { transition: transform 1s linear; }       /* 匀速 */
.box2 { transition: transform 1s ease; }         /* 慢-快-慢（默认） */
.box3 { transition: transform 1s ease-in; }      /* 慢入 */
.box4 { transition: transform 1s ease-out; }     /* 慢出 */
.box5 { transition: transform 1s ease-in-out; }  /* 慢入慢出 */
```

> **生活化类比**：
> - `ease` 就像是坐电梯——起步慢，中间快，到站慢
> - `linear` 就像是传送带——一直匀速前进
> - `ease-in` 就像是汽车起步——慢慢加速
> - `ease-out` 就像是汽车刹车——慢慢减速

---

## 10.4 基础用法：动画（Animation）

动画比过渡更强大，可以定义多个关键帧，实现更复杂的效果。

### @keyframes 定义关键帧

```css
/* 定义一个叫做 fadeIn 的动画 */
@keyframes fadeIn {
  /* 开始状态（0%） */
  from {
    opacity: 0;                 /* 完全透明 */
    transform: translateY(20px);/* 向下偏移20px */
  }
  /* 结束状态（100%） */
  to {
    opacity: 1;                 /* 完全不透明 */
    transform: translateY(0);   /* 回到原位 */
  }
}
```

也可以用百分比定义多个关键帧：

```css
@keyframes bounce {
  0% {
    transform: translateY(0);   /* 起始位置 */
  }
  50% {
    transform: translateY(-30px); /* 中间跳到最高 */
  }
  100% {
    transform: translateY(0);   /* 回到原位 */
  }
}
```

> **原理**：`@keyframes` 就像是动画的"剧本"——你定义好每个时间点（0%、50%、100%）元素应该是什么样子，浏览器会自动帮你补全中间的画面。

---

### 使用动画

定义好关键帧后，用 `animation` 属性应用到元素上：

```css
.element {
  /* animation: 名称 持续时间 速度曲线 延迟 播放次数 方向 填充模式 */
  animation: fadeIn 0.5s ease-out 0s 1 normal forwards;
}
```

各个属性详解：

| 属性 | 描述 | 示例 |
| --- | --- | --- |
| `animation-name` | 动画名称（@keyframes 的名字） | `fadeIn` |
| `animation-duration` | 动画持续时间 | `0.5s` |
| `animation-timing-function` | 速度曲线 | `ease-out` |
| `animation-delay` | 延迟多久开始 | `0.2s` |
| `animation-iteration-count` | 播放次数（infinite 为无限） | `1` 或 `infinite` |
| `animation-direction` | 播放方向 | `normal`、`reverse`、`alternate` |
| `animation-fill-mode` | 动画前后保持什么状态 | `none`、`forwards`、`backwards`、`both` |
| `animation-play-state` | 播放/暂停 | `running`、`paused` |

---

### 常用的 fill-mode（填充模式）

| 值 | 效果 | 说明 |
| --- | --- | --- |
| `none` | 默认，动画结束回到初始状态 | 播完就打回原形 |
| `forwards` | 保持最后一帧的状态 | ✅ 最常用，播完停在结束状态 |
| `backwards` | 延迟期间就应用第一帧 | 开始前就处于起始状态 |
| `both` | 同时应用 forwards 和 backwards | 两端都保持 |

> 💡 **新手常踩坑**：动画播完元素又回到初始状态了？加上 `animation-fill-mode: forwards` 就能让它停在最后一帧！

---

### 实际例子：加载中旋转动画

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>加载动画示例</title>
  <style>
    body {
      padding: 40px;
      font-family: Arial, sans-serif;
    }

    /* 1. 定义旋转动画 */
    @keyframes spin {
      from {
        transform: rotate(0deg);    /* 从0度开始 */
      }
      to {
        transform: rotate(360deg);  /* 转到360度（一圈） */
      }
    }

    /* 2. 应用动画 */
    .spinner {
      width: 50px;                    /* 宽度 */
      height: 50px;                   /* 高度 */
      border: 4px solid #f0f0f0;      /* 浅灰色边框（背景圈） */
      border-top-color: #007bff;      /* 顶部蓝色（前景圈） */
      border-radius: 50%;             /* 圆形 */
      
      /* 应用动画：名称 持续时间 匀速 无限循环 */
      animation: spin 1s linear infinite;
    }

    .loading-text {
      margin-top: 16px;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <p class="loading-text">加载中...</p>
</body>
</html>
```

> **原理**：通过 `border` 做一个圆环，只让顶部有颜色，然后用 `spin` 动画让它无限旋转，就形成了加载动画的效果。

---

## 10.5 对比表格

### transition vs animation 对比

| 维度 | transition 过渡 | animation 动画 |
| --- | --- | --- |
| 定义方式 | 直接写在属性里 | 用 @keyframes 定义 |
| 关键帧数量 | 2 帧（开始和结束） | 任意多帧 |
| 是否需要触发 | ✅ 需要（hover、class 变化等） | ❌ 自动播放（也可以触发） |
| 能否循环 | ❌ 不能 | ✅ 能（infinite） |
| 能否暂停 | 间接可以（移除触发） | ✅ 可以（animation-play-state） |
| 控制精度 | 低 | 高 |
| 代码复杂度 | 简单 | 稍复杂 |
| 性能 | 较好 | 较好（合理使用的话） |
| 使用场景 | 状态切换、交互反馈 | 复杂动画、加载动画、特效 |

### 性能对比：哪些属性适合做动画

| 属性 | 性能 | 原因 | 建议 |
| --- | --- | --- | --- |
| `transform` | ⭐⭐⭐⭐⭐ | GPU 加速，不触发重排重绘 | ✅ 优先使用 |
| `opacity` | ⭐⭐⭐⭐⭐ | GPU 加速，不触发重排重绘 | ✅ 优先使用 |
| `color` | ⭐⭐⭐ | 触发重绘 | 可以用，但别用太多 |
| `background` | ⭐⭐⭐ | 触发重绘 | 可以用，但别用太多 |
| `width` / `height` | ⭐ | 触发重排，非常影响性能 | ❌ 尽量用 transform 代替 |
| `margin` / `padding` | ⭐ | 触发重排，非常影响性能 | ❌ 尽量用 transform 代替 |
| `top` / `left` | ⭐⭐ | 触发重排（如果是 absolute/fixed 会好一些） | ❌ 优先用 transform |

> **一句话原则**：做动画优先用 `transform` 和 `opacity`，性能最好！

---

## 10.6 新手常见误区

### 误区 1："什么属性都能过渡"

**错！** 不是所有 CSS 属性都能过渡。

能过渡的属性需要满足"有中间值"的条件：
- ✅ 可以过渡：`opacity`、`transform`、`color`、`width`、`background-color` 等
- ❌ 不能过渡：`display`、`position`、`font-family` 等

比如 `display: none` 到 `display: block` 就没有中间状态，没法过渡。

**正确做法**：
- 显示/隐藏用 `opacity` + `visibility` 代替 `display`
- 位移用 `transform` 代替 `top/left`
- 先想想这个属性有没有"中间状态"

---

### 误区 2："动画时间越长越好"

**不对！** 动画不是越长越炫，而是要恰到好处。

动画时间太长会导致：
- 页面感觉拖沓、不跟手
- 用户等得不耐烦
- 整体体验变慢

参考时间：
- 按钮 hover 效果：`0.15s ~ 0.3s`
- 页面元素淡入：`0.3s ~ 0.5s`
- 弹窗出现：`0.3s ~ 0.4s`
- 加载动画旋转一圈：`0.8s ~ 1.2s`

**正确做法**：动画贵在"恰到好处"，快而流畅才是好体验。一般 0.3s 左右是比较舒服的速度。

---

### 误区 3："用 width/height 做动画效果一样"

**不一样！性能差很多！**

用 `width` 做动画，浏览器每帧都要重新计算布局（重排），非常消耗性能，低端设备上会卡顿。

用 `transform: scale()` 做动画，GPU 直接帮忙渲染，流畅得很。

✅ **推荐写法**：
```css
/* 用 transform，性能好 */
.box {
  transition: transform 0.3s;
}
.box:hover {
  transform: scale(1.1);  /* 放大1.1倍 */
}
```

❌ **不推荐写法**：
```css
/* 用 width/height，性能差 */
.box {
  width: 100px;
  height: 100px;
  transition: width 0.3s, height 0.3s;
}
.box:hover {
  width: 110px;
  height: 110px;
}
```

---

### 误区 4："动画越多越酷炫"

**大错特错！** 滥用动画是新手最常见的问题。

到处都是动画会导致：
- 页面杂乱，用户不知道看哪里
- 分散注意力，影响主要内容
- 有些人会觉得头晕（特别是晕动症患者）
- 性能下降，页面卡顿

**正确做法**：
- 动画要"克制"，只为重要的交互服务
- 遵循"少即是多"原则
- 尊重用户偏好，用 `prefers-reduced-motion` 适配减少动画的用户
- 核心内容不要用动画干扰

---

## 10.7 动手练习

### 练习 1：基础练习

创建一个有悬停效果的按钮，实现以下过渡动画：

- 鼠标悬停时背景色变深
- 鼠标悬停时按钮向上浮起一点（transform）
- 鼠标悬停时阴影变大
- 所有变化都有平滑过渡（transition）

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习1：悬停动画按钮</title>
  <style>
    body {
      margin: 0;
      padding: 60px;
      background: #f5f5f5;
      font-family: Arial, sans-serif;
    }

    .btn {
      /* 基础样式 */
      padding: 14px 40px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      
      /* 过渡效果：多个属性同时过渡 */
      transition: 
        background-color 0.2s ease,    /* 背景色：0.2秒 */
        transform 0.2s ease,           /* 位移：0.2秒 */
        box-shadow 0.2s ease;          /* 阴影：0.2秒 */
    }

    /* 鼠标悬停状态 */
    .btn:hover {
      background-color: #0056b3;      /* 背景变深 */
      transform: translateY(-2px);    /* 向上移动2px */
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);  /* 阴影变大 */
    }

    /* 鼠标按下状态 */
    .btn:active {
      transform: translateY(0);       /* 按下去的时候回到原位 */
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);  /* 阴影恢复 */
    }
  </style>
</head>
<body>
  <button class="btn">点击我试试看</button>
</body>
</html>
```

</details>

---

### 练习 2：进阶练习

创建一个卡片组件，实现丰富的悬停效果：

- 卡片有图片、标题、描述
- 鼠标悬停时卡片上浮，阴影变深
- 图片有缩放效果（从正常放大一点）
- 所有变化都有平滑过渡
- 整体效果高级、自然

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习2：卡片悬停效果</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      padding: 60px;
      background: #f5f5f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .card {
      width: 320px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      
      /* 卡片整体的过渡 */
      transition: 
        transform 0.3s ease,
        box-shadow 0.3s ease;
    }

    .card:hover {
      transform: translateY(-8px);     /* 向上浮动8px */
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);  /* 阴影变大 */
    }

    /* 图片容器，用来裁剪溢出的部分 */
    .card-image {
      width: 100%;
      height: 200px;
      overflow: hidden;                /* 超出部分隐藏 */
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
    }

    /* 图片的缩放效果 */
    .card-image .placeholder {
      transition: transform 0.5s ease; /* 0.5秒的缩放过渡 */
    }

    .card:hover .card-image .placeholder {
      transform: scale(1.1);           /* 放大1.1倍 */
    }

    .card-body {
      padding: 24px;
    }

    .card-title {
      font-size: 20px;
      color: #333;
      margin-bottom: 12px;
      transition: color 0.3s ease;
    }

    .card:hover .card-title {
      color: #667eea;                  /* 悬停时标题变色 */
    }

    .card-desc {
      font-size: 14px;
      color: #666;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-image">
      <span class="placeholder">📷 图片</span>
    </div>
    <div class="card-body">
      <h3 class="card-title">卡片标题</h3>
      <p class="card-desc">这是卡片的描述文字，鼠标悬停看看效果吧~ 卡片会上浮，图片会放大，标题会变色。</p>
    </div>
  </div>
</body>
</html>
```

</details>

---

### 练习 3（挑战）：综合练习

创建一个纯 CSS 的动画效果页面，包含多个动画：

- 一个跳动的爱心（无限循环）
- 一个淡入的标题（页面加载时淡入）
- 一个脉冲效果的按钮（无限脉冲）
- 一个打字机效果的文字
- 所有动画都用 CSS 实现，不用 JS

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习3：CSS动画合集</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8f9fa;
      padding: 60px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 40px;
    }

    /* ========== 1. 跳动的爱心 ========== */
    @keyframes heartBeat {
      0%, 100% {
        transform: scale(1);           /* 正常大小 */
      }
      15% {
        transform: scale(1.3);         /* 放大 */
      }
      30% {
        transform: scale(1);           /* 回到正常 */
      }
      45% {
        transform: scale(1.2);         /* 再放大一点 */
      }
      60% {
        transform: scale(1);           /* 回到正常 */
      }
    }

    .heart {
      font-size: 80px;
      animation: heartBeat 1.2s ease-in-out infinite;
    }

    /* ========== 2. 淡入的标题 ========== */
    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .title {
      font-size: 32px;
      color: #333;
      opacity: 0;  /* 初始透明，动画开始前看不见 */
      animation: fadeInDown 0.8s ease-out forwards;
      /* forwards 让动画结束后保持最后一帧（不消失） */
    }

    /* ========== 3. 脉冲按钮 ========== */
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
      }
      50% {
        transform: scale(1.05);
        box-shadow: 0 0 0 15px rgba(102, 126, 234, 0);
        /* 阴影向外扩散，同时变透明 */
      }
    }

    .pulse-btn {
      padding: 16px 48px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 50px;
      font-size: 18px;
      cursor: pointer;
      animation: pulse 2s ease-in-out infinite;
    }

    /* ========== 4. 打字机效果 ========== */
    @keyframes typing {
      from {
        width: 0;
      }
      to {
        width: 100%;
      }
    }

    @keyframes blink {
      50% {
        border-color: transparent;
      }
    }

    .typewriter {
      font-size: 20px;
      color: #555;
      overflow: hidden;           /* 超出的文字隐藏 */
      white-space: nowrap;        /* 不换行 */
      border-right: 3px solid #333;  /* 光标 */
      width: 0;                   /* 初始宽度为0 */
      animation: 
        typing 3s steps(20) forwards,       /* 打字效果：3秒，20步 */
        blink 0.75s step-end infinite;      /* 光标闪烁：无限循环 */
    }

    /* ========== 5. 旋转加载圈 ========== */
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e0e0e0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    /* ========== 页面布局 ========== */
    .demo-section {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      text-align: center;
      width: 100%;
      max-width: 500px;
    }

    .demo-label {
      font-size: 14px;
      color: #888;
      margin-bottom: 16px;
    }

    /* ========== 尊重减少动画偏好 ========== */
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  </style>
</head>
<body>
  <h1 class="title">CSS 动画演示</h1>

  <div class="demo-section">
    <div class="demo-label">1. 跳动的爱心</div>
    <div class="heart">❤️</div>
  </div>

  <div class="demo-section">
    <div class="demo-label">2. 脉冲按钮</div>
    <button class="pulse-btn">点击开始</button>
  </div>

  <div class="demo-section">
    <div class="demo-label">3. 打字机效果</div>
    <div class="typewriter">Hello, CSS Animation!</div>
  </div>

  <div class="demo-section">
    <div class="demo-label">4. 加载动画</div>
    <div style="display: flex; justify-content: center;">
      <div class="spinner"></div>
    </div>
  </div>
</body>
</html>
```

</details>

---

## 下一章预告

下一章我们会学习 **CSS 变量**——也就是自定义属性，它可以让你的 CSS 代码更灵活、更好维护。你会学到如何定义和使用变量，以及如何用变量打造主题切换等高级功能。
