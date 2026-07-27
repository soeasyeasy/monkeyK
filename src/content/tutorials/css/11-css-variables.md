---
title: "第十一章：CSS 变量"
description: "自定义属性、作用域、动态主题切换"
---

# 第十一章：CSS 变量

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 什么是 CSS 变量？它有什么用？
- 为什么不直接写固定的颜色值，非要用变量？
- CSS 变量能实现深色/浅色主题切换吗？
- CSS 变量和 JavaScript 怎么配合使用？

这一章就是为了解答这些问题。我们会先搞清楚 **CSS 变量的本质**，再动手实现主题切换功能。

---

## 1 为什么需要 CSS 变量？

### 痛点分析

想象一下，你在写一个大型网站的样式：

- 主色调用的是 `#007bff`，结果产品经理说"把主色调改成绿色"，你得全局搜索替换，万一有地方漏了就尴尬了
- 按钮有大中小三种尺寸，间距都是 8px 的倍数，每个地方都要手动算一遍
- 想做深色主题切换？难如登天，每个颜色都要写两套样式
- 同样的颜色值写了几十上百遍，代码又冗余又难维护

打个比方：

> 这就像你开了一家奶茶店，配方里写"加 10ml 糖浆、加 20ml 牛奶、加 5ml 茶底"，每次调整甜度都要把所有配方改一遍。如果有个"甜度变量"，改一次所有配方就都跟着变了，那该多方便！

### 解决方案

CSS 变量（也叫自定义属性）就是 CSS 里的"变量"——你可以把常用的值存起来，给它起个名字，然后到处引用。

有了 CSS 变量，你可以：

- 改一处，全站生效，维护起来超简单
- 给变量起有意义的名字，代码可读性更高
- 轻松实现深色/浅色主题切换
- 和 JavaScript 配合，实现动态样式
- 结合 `calc()` 函数，做灵活的计算

> **一句话总结**：CSS 变量就像是样式里的"全局配置项"，改一个地方，所有用到的地方都自动更新。

---

## 2 核心原理

### 概念解释

CSS 变量的核心思想是**定义一次，多处引用**。

- **定义变量**：给一个值起个名字，存在某个选择器里
- **使用变量**：用 `var()` 函数引用这个名字，浏览器会自动替换成对应的值
- **作用域**：变量在哪里定义，就在哪里及其后代元素中生效

打个比方：

> CSS 变量就像是你家里的"收纳盒"。你把常用的工具放在盒子里（定义变量），需要用的时候直接去盒子里拿（使用变量），不用每次都到处找。放在客厅的收纳盒（全局变量）全家都能用，放在卧室的收纳盒（局部变量）只有卧室里能用。

### 变量继承规则

CSS 变量是可以继承的，子元素会自动继承父元素的变量。如果子元素重新定义了同名变量，就会覆盖父元素的——这和 CSS 的继承机制是一样的。

### 对比分析

| 特性 | 硬编码值 | CSS 变量 |
| --- | --- | --- |
| 维护性 | 改一个值要找遍所有地方 | 改一处，全站生效 |
| 可读性 | `#007bff` 不知道是什么 | `--primary-color` 一看就懂 |
| 主题切换 | 很难，要写两套样式 | 轻松，修改变量值就行 |
| 动态修改 | 基本不可能 | 配合 JS 轻松实现 |
| 代码复用 | 重复写很多遍 | 定义一次，到处引用 |

---

## 3 基础用法

### 定义变量

变量名必须以 `--` 开头，这是 CSS 规定的，用来区分普通属性和自定义属性。

```css
/* 在 :root 中定义全局变量 */
/* :root 相当于 html 标签，但优先级更高 */
:root {
  --primary-color: #007bff;      /* 主色调：蓝色 */
  --success-color: #28a745;      /* 成功色：绿色 */
  --danger-color: #dc3545;       /* 危险色：红色 */
  --font-size-base: 16px;        /* 基础字号 */
  --spacing-unit: 8px;           /* 间距单位 */
}
```

> 💡 **为什么用 :root？** 因为 `:root` 选择器选中的是文档根元素，在这里定义的变量可以在整个页面中使用，相当于"全局变量"。

### 使用变量

用 `var()` 函数来引用变量。

```css
/* 按钮样式 */
.btn {
  background-color: var(--primary-color);  /* 背景色用主色调 */
  color: white;                            /* 文字白色 */
  font-size: var(--font-size-base);        /* 字号用基础字号 */
  padding: var(--spacing-unit) calc(var(--spacing-unit) * 2);  /* 内边距用间距单位计算 */
  border: none;                            /* 去掉边框 */
  border-radius: 4px;                      /* 圆角4px */
  cursor: pointer;                         /* 鼠标手型 */
}

/* 成功按钮 */
.btn-success {
  background-color: var(--success-color);  /* 用成功色覆盖主色调 */
}
```

逐行解释：

```css
.btn {
  /* var(--primary-color) 会被替换成 #007bff */
  background-color: var(--primary-color);
  
  /* 变量可以和 calc() 结合做计算 */
  /* var(--spacing-unit) * 2 = 8px * 2 = 16px */
  padding: var(--spacing-unit) calc(var(--spacing-unit) * 2);
}
```

### ✅ 正确写法 vs ❌ 错误写法

```css
/* ✅ 正确：变量名以 -- 开头 */
:root {
  --main-color: #007bff;
}

/* ❌ 错误：变量名没有 -- 开头 */
:root {
  main-color: #007bff;
}

/* ✅ 正确：用 var() 引用变量 */
.btn {
  background: var(--main-color);
}

/* ❌ 错误：直接用变量名 */
.btn {
  background: --main-color;
}

/* ✅ 正确：变量值可以是任意 CSS 值 */
:root {
  --border: 1px solid #ddd;
  --shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

---

## 4 变量的作用域

CSS 变量也有作用域，和 JavaScript 的变量作用域很像。

### 全局变量

在 `:root` 中定义的变量是全局变量，整个页面都能用。

```css
/* 全局变量，所有元素都能使用 */
:root {
  --primary-color: #007bff;
}

.btn {
  color: var(--primary-color);  /* ✅ 可以用 */
}

.card {
  border-color: var(--primary-color);  /* ✅ 可以用 */
}
```

### 局部变量

在某个选择器中定义的变量，只能在该选择器及其后代元素中使用。

```css
/* 只在 .card 组件内有效的变量 */
.card {
  --card-bg: white;           /* 卡片背景色 */
  --card-padding: 20px;       /* 卡片内边距 */
  --card-radius: 8px;         /* 卡片圆角 */
  background-color: var(--card-bg);       /* ✅ 自己能用 */
  padding: var(--card-padding);           /* ✅ 自己能用 */
  border-radius: var(--card-radius);      /* ✅ 自己能用 */
}

.card .title {
  margin-bottom: var(--card-padding);     /* ✅ 后代元素也能用 */
}

.btn {
  background: var(--card-bg);  /* ❌ 不能用，不在 .card 里面 */
}
```

### 作用域优先级

如果同一个变量名在不同作用域中定义了，会优先使用最近的那个——这就是"就近原则"。

```css
/* 全局定义：蓝色 */
:root {
  --text-color: blue;
}

/* .card 中重新定义：红色 */
.card {
  --text-color: red;
}

.text {
  color: var(--text-color);
}
```

```html
<p class="text">我是蓝色的（全局作用域）</p>

<div class="card">
  <p class="text">我是红色的（card 作用域，就近原则）</p>
</div>
```

> **原理**：浏览器查找变量值的时候，会先看当前元素有没有定义，没有就往上找父元素，一直找到根元素。这和 CSS 的继承机制是一样的。

---

## 5 变量的默认值

`var()` 函数可以接受第二个参数，作为"默认值"。如果变量不存在，就会用默认值。

```css
.btn {
  /* 如果 --btn-bg 不存在，就用 #007bff */
  background-color: var(--btn-bg, #007bff);
  /* 如果 --btn-color 不存在，就用 white */
  color: var(--btn-color, white);
}
```

默认值也可以嵌套使用：

```css
.btn {
  /* 先找 --btn-bg，没有就找 --primary，再没有就用 #007bff */
  background-color: var(--btn-bg, var(--primary, #007bff));
}
```

---

## 6 动态主题切换

CSS 变量最酷的用途之一就是实现主题切换。原理很简单：定义两套变量值，切换的时候修改变量就行。

### 主题变量定义

```css
/* 默认主题：浅色模式 */
:root {
  --bg-primary: #ffffff;        /* 主背景色：白色 */
  --bg-secondary: #f5f5f5;      /* 次背景色：浅灰 */
  --text-primary: #333333;      /* 主文字色：深灰 */
  --text-secondary: #666666;    /* 次文字色：中灰 */
  --accent-color: #007bff;      /* 强调色：蓝色 */
  --border-color: #e0e0e0;      /* 边框色：浅灰 */
}

/* 深色主题 */
[data-theme="dark"] {
  --bg-primary: #1a1a1a;        /* 主背景色：深灰 */
  --bg-secondary: #2d2d2d;      /* 次背景色：稍浅的灰 */
  --text-primary: #ffffff;      /* 主文字色：白色 */
  --text-secondary: #b0b0b0;    /* 次文字色：浅灰 */
  --accent-color: #4dabf7;      /* 强调色：亮蓝 */
  --border-color: #404040;      /* 边框色：深灰 */
}
```

### 使用主题变量

```css
body {
  background-color: var(--bg-primary);  /* 背景色跟着主题变 */
  color: var(--text-primary);           /* 文字色跟着主题变 */
  transition: background-color 0.3s, color 0.3s;  /* 加个过渡动画，更丝滑 */
}

.card {
  background-color: var(--bg-secondary);  /* 卡片背景 */
  border: 1px solid var(--border-color);  /* 边框 */
  color: var(--text-primary);             /* 文字颜色 */
  padding: 20px;
  border-radius: 8px;
  transition: background-color 0.3s, border-color 0.3s, color 0.3s;
}

.btn-primary {
  background-color: var(--accent-color);  /* 按钮颜色 */
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}
```

### JavaScript 切换主题

```javascript
// 切换主题函数
function toggleTheme() {
  // 获取当前主题
  const currentTheme = document.documentElement.getAttribute('data-theme');
  // 计算新主题：如果是 dark 就改成 light，否则改成 dark
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  // 设置新主题
  document.documentElement.setAttribute('data-theme', newTheme);
  // 保存到本地存储，刷新页面后还能记住
  localStorage.setItem('theme', newTheme);
}

// 页面加载时，读取保存的主题
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
```

完整的示例页面：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>主题切换示例</title>
  <style>
    /* 默认主题：浅色模式 */
    :root {
      --bg-primary: #ffffff;
      --bg-secondary: #f5f5f5;
      --text-primary: #333333;
      --text-secondary: #666666;
      --accent-color: #007bff;
      --border-color: #e0e0e0;
    }

    /* 深色主题 */
    [data-theme="dark"] {
      --bg-primary: #1a1a1a;
      --bg-secondary: #2d2d2d;
      --text-primary: #ffffff;
      --text-secondary: #b0b0b0;
      --accent-color: #4dabf7;
      --border-color: #404040;
    }

    /* 页面基础样式 */
    body {
      margin: 0;
      padding: 40px;
      font-family: Arial, sans-serif;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      transition: background-color 0.3s, color 0.3s;
    }

    /* 卡片样式 */
    .card {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 24px;
      border-radius: 8px;
      max-width: 500px;
      margin: 20px auto;
      transition: background-color 0.3s, border-color 0.3s, color 0.3s;
    }

    .card h2 {
      color: var(--accent-color);
      margin-top: 0;
    }

    .card p {
      color: var(--text-secondary);
      line-height: 1.6;
    }

    /* 按钮样式 */
    .theme-btn {
      display: block;
      margin: 0 auto;
      padding: 12px 24px;
      background-color: var(--accent-color);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.3s;
    }

    .theme-btn:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <button class="theme-btn" onclick="toggleTheme()">切换主题</button>
  
  <div class="card">
    <h2>主题切换演示</h2>
    <p>点击上面的按钮，看看深色和浅色主题的切换效果。所有颜色都是通过 CSS 变量控制的，只需要改变量的值，整个页面的颜色就会跟着变。</p>
  </div>

  <script>
    function toggleTheme() {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  </script>
</body>
</html>
```

---

## 7 JavaScript 操作变量

CSS 变量可以通过 JavaScript 动态读取和修改，这让样式的灵活性大大提升。

### 读取变量值

```javascript
// 获取 :root 上的 CSS 变量
const styles = getComputedStyle(document.documentElement);
const primaryColor = styles.getPropertyValue('--primary-color').trim();
console.log(primaryColor);  // 输出：#007bff
```

### 设置变量值

```javascript
// 全局设置（修改 :root 上的变量）
document.documentElement.style.setProperty('--primary-color', '#ff0000');

// 局部设置（修改某个元素上的变量）
const card = document.querySelector('.card');
card.style.setProperty('--card-bg', '#f0f0f0');
```

### 删除变量

```javascript
// 删除全局变量
document.documentElement.style.removeProperty('--primary-color');
```

> **小技巧**：用 JS 动态修改变量，可以实现很多有趣的效果，比如根据用户操作实时改变颜色、根据滚动位置调整透明度等等。

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| CSS 变量 | 也叫自定义属性，用 `--` 开头定义 |
| 定义变量 | `--变量名: 值;` |
| 使用变量 | `var(--变量名)` 或 `var(--变量名, 默认值)` |
| :root | 定义全局变量的地方 |
| 作用域 | 在哪里定义，就在哪里及后代中生效 |
| 就近原则 | 同名变量，优先使用最近作用域的 |
| 主题切换 | 修改变量值，轻松实现深色/浅色主题 |
| JS 操作 | `getPropertyValue` 和 `setProperty` |

---

## 9 新手常见误区

### 误区 1："变量名不用 -- 开头也能用"

**错！** CSS 规定自定义属性必须以 `--` 开头，这是为了和普通 CSS 属性区分开，避免和未来新增的 CSS 属性冲突。

正确做法：变量名一定要以 `--` 开头，比如 `--primary-color`。

### 误区 2："变量只能存颜色值"

不是的。CSS 变量可以存**任何 CSS 值**：

- 颜色值：`#007bff`、`rgb(...)`、`hsl(...)`
- 尺寸值：`16px`、`2rem`、`50%`
- 复合值：`1px solid #ddd`、`0 2px 4px rgba(0,0,0,0.1)`
- 字符串：`"Helvetica"`（虽然用得少）
- 甚至可以存数字，配合 `calc()` 使用

正确做法：大胆用，什么类型的值都能存。

### 误区 3："变量在哪里定义都一样，反正都能用"

**错！** CSS 变量是有作用域的。在 `.card` 里定义的变量，在 `.btn` 里就用不了。

正确做法：
- 全站通用的变量，放在 `:root` 里
- 组件专用的变量，放在组件的选择器里
- 遵循"就近原则"，需要的时候再提升作用域

### 误区 4："CSS 变量就是 Sass 变量，没什么区别"

不一样！它们有几个关键区别：

- **Sass 变量**：编译时替换，编译后就变成固定值了，不能动态修改
- **CSS 变量**：浏览器运行时解析，可以用 JS 动态修改，可以有作用域，可以继承

正确做法：根据需求选择。如果只是想复用值，Sass 变量足够；如果需要动态修改、主题切换，就得用 CSS 变量。

### 误区 5："默认值就是变量的初始值"

不对。`var()` 的第二个参数是"**回退值**"——只有当变量**不存在**的时候才会用。如果变量存在但值是错的（比如颜色值写错了），默认值不会生效。

```css
:root {
  --color: oops;  /* 这是个无效的颜色值 */
}

.btn {
  color: var(--color, red);  /* 不会变成 red，因为变量存在，只是值无效 */
}
```

正确做法：默认值只是用来兜底"变量不存在"的情况，不是用来处理无效值的。

---

## 10 动手练习

### 练习 1：基础练习

创建一个 HTML 页面，使用 CSS 变量实现：

- 定义 3 个颜色变量：主色调、背景色、文字色
- 定义 2 个尺寸变量：基础字号、间距单位
- 用这些变量写一个卡片和一个按钮
- 试着改变变量值，看看页面会不会跟着变

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习1：CSS变量基础</title>
  <style>
    /* 定义全局变量 */
    :root {
      --primary-color: #007bff;       /* 主色调：蓝色 */
      --bg-color: #f5f5f5;            /* 背景色：浅灰 */
      --text-color: #333;             /* 文字色：深灰 */
      --font-size-base: 16px;         /* 基础字号 */
      --spacing-unit: 8px;            /* 间距单位 */
    }

    body {
      margin: 0;
      padding: calc(var(--spacing-unit) * 5);
      font-family: Arial, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-color);
      font-size: var(--font-size-base);
    }

    /* 卡片样式 */
    .card {
      background: white;
      padding: calc(var(--spacing-unit) * 3);
      border-radius: calc(var(--spacing-unit));
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      max-width: 400px;
      margin: 0 auto calc(var(--spacing-unit) * 3);
    }

    .card h2 {
      color: var(--primary-color);
      margin-top: 0;
      margin-bottom: calc(var(--spacing-unit) * 2);
    }

    .card p {
      line-height: 1.6;
      margin: 0 0 calc(var(--spacing-unit) * 2);
    }

    /* 按钮样式 */
    .btn {
      display: inline-block;
      padding: var(--spacing-unit) calc(var(--spacing-unit) * 2);
      background-color: var(--primary-color);
      color: white;
      text-decoration: none;
      border-radius: calc(var(--spacing-unit) / 2);
      font-size: var(--font-size-base);
      border: none;
      cursor: pointer;
    }

    .btn:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2>CSS 变量真方便</h2>
    <p>通过 CSS 变量，我们可以轻松管理颜色、字号、间距等样式。改一处，全站生效！</p>
    <button class="btn">了解更多</button>
  </div>
</body>
</html>
```

</details>

### 练习 2：进阶练习

实现一个"组件级变量"的效果：

- 创建一个 `.alert` 提示框组件
- 定义默认的变量（蓝色提示）
- 再创建 `.alert-success`（绿色）和 `.alert-danger`（红色），通过覆盖变量来实现不同颜色
- 体会"修改变量值，而不是重写样式"的好处

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习2：组件级变量</title>
  <style>
    body {
      margin: 0;
      padding: 40px;
      font-family: Arial, sans-serif;
      background-color: #f5f5f5;
    }

    /* 基础提示框：定义组件变量 */
    .alert {
      --alert-bg: #cce5ff;         /* 背景色变量 */
      --alert-border: #b8daff;     /* 边框色变量 */
      --alert-text: #004085;       /* 文字色变量 */
      
      background-color: var(--alert-bg);
      border: 1px solid var(--alert-border);
      color: var(--alert-text);
      padding: 16px 20px;
      border-radius: 4px;
      margin-bottom: 16px;
    }

    /* 成功提示：只需要修改变量值 */
    .alert-success {
      --alert-bg: #d4edda;
      --alert-border: #c3e6cb;
      --alert-text: #155724;
    }

    /* 危险提示：只需要修改变量值 */
    .alert-danger {
      --alert-bg: #f8d7da;
      --alert-border: #f5c6cb;
      --alert-text: #721c24;
    }

    /* 警告提示：只需要修改变量值 */
    .alert-warning {
      --alert-bg: #fff3cd;
      --alert-border: #ffeeba;
      --alert-text: #856404;
    }
  </style>
</head>
<body>
  <div class="alert">
    这是一条普通提示信息。
  </div>

  <div class="alert alert-success">
    操作成功！你的数据已经保存。
  </div>

  <div class="alert alert-danger">
    出错了！请检查你的输入。
  </div>

  <div class="alert alert-warning">
    警告：你的会员即将到期。
  </div>
</body>
</html>
```

</details>

### 练习 3（挑战）：综合练习

实现一个完整的主题切换功能：

- 定义浅色和深色两套主题变量
- 包含背景色、文字色、卡片色、按钮色等
- 有一个切换按钮，点击可以切换主题
- 主题状态保存在 localStorage 中，刷新页面不丢失
- 颜色切换时有平滑的过渡动画

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>练习3：主题切换</title>
  <style>
    /* ===== 定义主题变量 ===== */
    
    /* 默认：浅色主题 */
    :root {
      --bg-color: #f0f2f5;           /* 页面背景 */
      --card-bg: #ffffff;            /* 卡片背景 */
      --text-primary: #1a1a1a;       /* 主要文字 */
      --text-secondary: #666666;     /* 次要文字 */
      --accent-color: #1677ff;       /* 主题色 */
      --accent-hover: #4096ff;       /* 主题色悬浮 */
      --border-color: #e8e8e8;       /* 边框色 */
      --shadow: 0 2px 8px rgba(0, 0, 0, 0.08);  /* 阴影 */
    }

    /* 深色主题 */
    [data-theme="dark"] {
      --bg-color: #141414;
      --card-bg: #1f1f1f;
      --text-primary: #ffffff;
      --text-secondary: #a0a0a0;
      --accent-color: #4096ff;
      --accent-hover: #69b1ff;
      --border-color: #333333;
      --shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    /* ===== 基础样式 ===== */
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-primary);
      min-height: 100vh;
      padding: 40px 20px;
      transition: background-color 0.3s ease, color 0.3s ease;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
    }

    /* ===== 顶部操作栏 ===== */
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .header h1 {
      font-size: 24px;
      color: var(--text-primary);
    }

    .theme-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      color: var(--text-primary);
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .theme-toggle:hover {
      border-color: var(--accent-color);
    }

    /* ===== 卡片样式 ===== */
    
    .card {
      background: var(--card-bg);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: var(--shadow);
      transition: background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
      border: 1px solid var(--border-color);
    }

    .card h2 {
      color: var(--accent-color);
      margin-bottom: 12px;
      font-size: 18px;
    }

    .card p {
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 16px;
    }

    /* ===== 按钮样式 ===== */
    
    .btn-group {
      display: flex;
      gap: 12px;
    }

    .btn {
      padding: 8px 20px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: var(--accent-color);
      color: white;
    }

    .btn-primary:hover {
      background: var(--accent-hover);
    }

    .btn-outline {
      background: transparent;
      color: var(--accent-color);
      border: 1px solid var(--accent-color);
    }

    .btn-outline:hover {
      background: var(--accent-color);
      color: white;
    }

    /* ===== 列表样式 ===== */
    
    .feature-list {
      list-style: none;
    }

    .feature-list li {
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-secondary);
      transition: border-color 0.3s ease;
    }

    .feature-list li:last-child {
      border-bottom: none;
    }

    .feature-list li::before {
      content: "✓";
      color: var(--accent-color);
      margin-right: 8px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 顶部 -->
    <div class="header">
      <h1>🌙 主题切换演示</h1>
      <button class="theme-toggle" onclick="toggleTheme()">
        <span id="theme-icon">🌙</span>
        <span id="theme-text">深色模式</span>
      </button>
    </div>

    <!-- 介绍卡片 -->
    <div class="card">
      <h2>什么是 CSS 变量？</h2>
      <p>CSS 变量（自定义属性）让我们可以定义可复用的样式值。通过修改变量，我们可以轻松实现主题切换，而不用重写大量 CSS 代码。</p>
      <div class="btn-group">
        <button class="btn btn-primary">了解更多</button>
        <button class="btn btn-outline">开始使用</button>
      </div>
    </div>

    <!-- 功能列表 -->
    <div class="card">
      <h2>核心特性</h2>
      <ul class="feature-list">
        <li>一处定义，多处引用</li>
        <li>支持作用域和继承</li>
        <li>轻松实现主题切换</li>
        <li>JavaScript 可动态修改</li>
        <li>配合 calc() 灵活计算</li>
      </ul>
    </div>
  </div>

  <script>
    // 切换主题函数
    function toggleTheme() {
      const html = document.documentElement;
      const currentTheme = html.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeButton(newTheme);
    }

    // 更新按钮文字和图标
    function updateThemeButton(theme) {
      const icon = document.getElementById('theme-icon');
      const text = document.getElementById('theme-text');
      if (theme === 'dark') {
        icon.textContent = '☀️';
        text.textContent = '浅色模式';
      } else {
        icon.textContent = '🌙';
        text.textContent = '深色模式';
      }
    }

    // 页面加载时读取保存的主题
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
  </script>
</body>
</html>
```

</details>

---

## 下一章预告

下一章是我们 CSS 教程的**收官之作**——**现代 CSS 特性**。我们会学习容器查询、层叠层、嵌套规则、`:has()` 选择器等一系列强大的新特性，它们会让你的 CSS 代码更加简洁、灵活、高效。准备好迎接现代 CSS 的洗礼吧！
