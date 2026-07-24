---
title: "第十二章：无障碍访问"
description: "让网页对所有用户友好，包括视障、听障等特殊群体"
---

# 第十二章：无障碍访问

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 无障碍访问（a11y）到底是什么？为什么重要？
- ARIA 属性是什么？什么时候需要用？
- 怎么确保键盘用户能正常使用我的网站？
- 颜色和字体对无障碍有什么影响？

这一章就是为了解答这些问题。我们会学习如何让网页对所有人都友好，包括视障、听障、运动障碍等特殊群体。

---

## 12.1 为什么需要无障碍访问？

### 痛点分析

想象一下，如果你是视障用户，使用屏幕阅读器访问一个没有无障碍支持的网站：

```html
<!-- 没有无障碍支持的页面 -->
<div>登录</div>
<div>用户名</div>
<input>
<div>密码</div>
<input type="password">
<div>提交</div>
```

这种页面会有什么问题？

1. **屏幕阅读器不知道这是什么**：它只会读出"登录"、"用户名"、"密码"，但不知道哪个是按钮，哪个是输入框
2. **键盘用户无法操作**：不能用 Tab 键聚焦到元素，不能用 Enter 键提交
3. **颜色对比度不够**：低视力用户看不清文字
4. **没有跳过导航**：每次访问都要听完整个导航才能到达内容

> **一句话总结**：没有无障碍支持的网页就像没有楼梯的高楼，轮椅用户根本无法进入。

### 解决方案

通过无障碍设计让所有用户都能使用：

```html
<!-- 有无障碍支持的页面 -->
<form>
  <button>登录</button>
  <label for="username">用户名：</label>
  <input type="text" id="username">
  <label for="password">密码：</label>
  <input type="password" id="password">
  <button type="submit">提交</button>
</form>
```

打个比方：

> 无障碍设计就像给建筑物安装电梯和无障碍通道——不仅方便了残障人士，对所有人都有好处（比如搬重物的人、推婴儿车的人）。

### 无障碍访问的好处

| 好处 | 说明 |
| --- | --- |
| **道德责任** | 每个人都有权利使用互联网 |
| **法律要求** | 许多国家有相关法规（如美国 ADA、欧盟 EN 301 549） |
| **更好的 SEO** | 语义化的代码对搜索引擎更友好 |
| **更多用户** | 据估计，全球约 15% 的人口有某种形式的障碍 |
| **更好的用户体验** | 无障碍设计通常让所有人都受益 |

---

## 12.2 核心原理

### 概念解释

**无障碍访问（Accessibility，简称 a11y）** = 让所有用户都能感知、理解、导航和与网页交互的设计理念

### 四大核心原则

根据 WCAG（Web Content Accessibility Guidelines），无障碍设计需要遵循四大原则：

| 原则 | 含义 | 示例 |
| --- | --- | --- |
| **可感知** | 信息和界面组件必须以可感知的方式呈现 | 图片要有替代文本，视频要有字幕 |
| **可操作** | 界面组件和导航必须可操作 | 所有功能都能通过键盘访问 |
| **可理解** | 信息和操作必须可理解 | 清晰的导航结构，一致的设计 |
| **健壮** | 内容必须足够健壮，能被各种用户代理（浏览器、屏幕阅读器）解释 | 使用标准 HTML，避免依赖特定技术 |

---

## 12.3 基础用法

### 使用语义化标签

这是无障碍访问的基础。语义化标签本身就具有良好的无障碍特性。

```html
<!-- ❌ 不好：使用无意义的 div -->
<div onclick="submitForm()">提交</div>
<div class="navigation">...</div>

<!-- ✅ 好：使用语义化标签 -->
<button onclick="submitForm()">提交</button>
<nav>...</nav>
```

### 图片替代文本

```html
<!-- 装饰性图片：不需要替代文本 -->
<img src="decoration.png" alt="">

<!-- 有意义的图片：必须提供描述性的替代文本 -->
<img src="chart.png" alt="2024年度销售数据图表，显示同比增长30%">

<!-- 链接中的图片：替代文本应该描述链接的目的 -->
<a href="/download">
  <img src="download.png" alt="下载报告">
</a>
```

> **原则**：`alt` 属性应该描述图片的"目的"，而不是"外观"。

### 表单标签关联

```html
<!-- ✅ 好：使用 label 标签关联 -->
<label for="username">用户名：</label>
<input type="text" id="username" name="username">

<!-- ✅ 好：label 包裹 input -->
<label>
  <input type="checkbox" name="newsletter">
  订阅新闻邮件
</label>

<!-- ✅ 好：使用 aria-label -->
<input type="text" aria-label="搜索关键词" placeholder="搜索...">

<!-- ✅ 好：使用 aria-describedby 添加帮助文本 -->
<label for="email">邮箱：</label>
<input type="email" id="email" aria-describedby="email-help">
<p id="email-help">请输入您的工作邮箱地址</p>
```

### 跳过导航链接

```html
<!-- 允许键盘用户跳过重复的导航内容 -->
<a href="#main-content" class="skip-link">跳到主要内容</a>

<header>
  <nav>
    <!-- 导航链接 -->
  </nav>
</header>

<main id="main-content">
  <!-- 主要内容 -->
</main>
```

```css
/* 隐藏跳过链接，聚焦时显示 */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #0066cc;
  color: white;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

---

## 12.4 ARIA 属性

### 什么是 ARIA？

ARIA（Accessible Rich Internet Applications）是一套属性，用于增强网页的无障碍性，特别是动态内容和复杂组件。

### ARIA 的使用原则

**优先使用原生 HTML 元素，只有在原生元素不够用的时候才使用 ARIA。**

```html
<!-- ❌ 不好：使用 div + ARIA 替代原生 button -->
<div role="button" tabindex="0" onclick="handleClick()">按钮</div>

<!-- ✅ 好：直接使用 button -->
<button onclick="handleClick()">按钮</button>
```

### 常用 ARIA 角色

```html
<!-- 按钮角色 -->
<div role="button">按钮</div>

<!-- 导航角色 -->
<div role="navigation">导航</div>

<!-- 警告角色（屏幕阅读器会自动朗读） -->
<div role="alert">操作成功！</div>

<!-- 进度条角色 -->
<div role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">50%</div>

<!-- 对话框角色 -->
<div role="dialog" aria-modal="true">
  <h2>确认对话框</h2>
  <p>确定要删除吗？</p>
</div>
```

### 常用 ARIA 状态和属性

```html
<!-- 按钮状态：按下/未按下 -->
<button aria-pressed="true">已选中</button>

<!-- 输入框状态：是否必填、是否有错误 -->
<input aria-required="true" aria-invalid="false">

<!-- 隐藏内容：对屏幕阅读器隐藏 -->
<div aria-hidden="true">纯装饰性内容</div>

<!-- 动态内容区域：屏幕阅读器会自动朗读变化 -->
<div aria-live="polite">购物车已更新</div>

<!-- 描述关系：关联帮助文本 -->
<input aria-describedby="help-text">
<p id="help-text">帮助文本</p>
```

### aria-live 模式对比

| 值 | 行为 | 适用场景 |
| --- | --- | --- |
| `polite` | 等待用户空闲时朗读 | 非紧急通知（如购物车更新） |
| `assertive` | 立即打断用户朗读 | 紧急通知（如错误信息） |
| `off` | 默认值，不自动朗读 | 不需要自动朗读的内容 |

---

## 12.5 键盘可访问性

### 焦点管理

确保所有可交互元素都能通过键盘聚焦和操作。

```html
<!-- 默认可聚焦元素 -->
<button>按钮</button>
<a href="#">链接</a>
<input type="text">

<!-- 使用 tabindex 控制聚焦顺序 -->
<button tabindex="0">正常顺序</button>
<button tabindex="1">优先聚焦</button>
<button tabindex="-1">不可聚焦（除非编程控制）</button>
```

### 焦点样式

不要移除焦点样式，否则键盘用户无法知道当前聚焦在哪里。

```css
/* ❌ 不好：移除焦点样式 */
button:focus {
  outline: none;
}

/* ✅ 好：自定义焦点样式 */
button:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* ✅ 好：为所有可聚焦元素添加焦点样式 */
:focus {
  outline: 2px solid #0066cc;
}
```

### 键盘操作模式

确保所有功能都能通过键盘完成：

| 操作 | 键盘快捷键 | 说明 |
| --- | --- | --- |
| 移动焦点 | `Tab` | 向前移动 |
| | `Shift + Tab` | 向后移动 |
| 激活元素 | `Enter` | 激活按钮、链接等 |
| | `Space` | 激活按钮 |
| 关闭模态框 | `Escape` | 关闭对话框、菜单等 |
| 导航列表 | `Arrow Keys` | 在下拉菜单、列表中导航 |

---

## 12.6 颜色和字体

### 颜色对比度

确保文本与背景有足够的对比度：

| 文本类型 | 最小对比度 | 示例 |
| --- | --- | --- |
| 普通文本（< 18pt） | 4.5:1 | 黑色文字在白色背景上 |
| 大文本（≥ 18pt 或 ≥ 14pt 加粗） | 3:1 | 深灰色文字在浅灰色背景上 |

```html
<!-- ❌ 不好：对比度不够（蓝色在白色上约 2:1） -->
<p style="color: #6699ff; background: white;">文字对比度不够</p>

<!-- ✅ 好：对比度足够（深蓝色在白色上约 8:1） -->
<p style="color: #003366; background: white;">文字对比度足够</p>
```

### 字体大小和行高

```css
/* ✅ 好：使用相对单位，方便用户调整 */
body {
  font-size: 16px;      /* 基础字体大小 */
  line-height: 1.6;     /* 行高至少 1.5 */
}

/* ✅ 好：允许用户缩放文本 */
p {
  font-size: 1rem;      /* 使用 rem 单位 */
}
```

### 避免纯颜色提示

不要只用颜色来传达信息，确保有其他提示方式：

```html
<!-- ❌ 不好：只用红色表示错误 -->
<input type="text" style="border-color: red;">

<!-- ✅ 好：同时使用图标和文字 -->
<input type="text" aria-invalid="true">
<span aria-describedby="error-text">✗</span>
<span id="error-text">请填写此字段</span>
```

---

## 12.7 新手常见误区

### 误区 1："ARIA 越多越好"

**错！** 过度使用 ARIA 会导致混乱，应该优先使用原生 HTML。

```html
<!-- ❌ 不好：过度使用 ARIA -->
<div role="button" tabindex="0" aria-label="提交">提交</div>

<!-- ✅ 好：使用原生 button -->
<button>提交</button>
```

> **原理**：原生 HTML 元素已经内置了无障碍特性，额外添加 ARIA 可能会冲突或冗余。

### 误区 2："装饰性图片不需要 alt"

**错！** 装饰性图片需要 `alt=""`（空字符串），而不是省略 alt 属性。

```html
<!-- ❌ 不好：省略 alt 属性，屏幕阅读器会读出文件名 -->
<img src="decoration.png">

<!-- ✅ 好：使用空 alt 属性 -->
<img src="decoration.png" alt="">
```

> **原理**：省略 alt 属性，屏幕阅读器会尝试读出图片文件名，这会打扰用户。

### 误区 3："placeholder 可以替代 label"

**错！** placeholder 在输入后会消失，对无障碍不友好。

```html
<!-- ❌ 不好：只用 placeholder -->
<input type="text" placeholder="用户名">

<!-- ✅ 好：使用 label -->
<label for="username">用户名：</label>
<input type="text" id="username" placeholder="请输入用户名">
```

> **原理**：placeholder 不是为辅助技术设计的，屏幕阅读器可能无法正确识别。

### 误区 4："所有元素都需要 tabindex"

**错！** 默认可聚焦元素（button、a、input 等）不需要额外设置 tabindex。

```html
<!-- ❌ 不好：多余的 tabindex -->
<button tabindex="0">按钮</button>
<a href="#" tabindex="0">链接</a>

<!-- ✅ 好：移除多余的 tabindex -->
<button>按钮</button>
<a href="#">链接</a>
```

> **原理**：原生可聚焦元素默认就有 tabindex=0，不需要额外添加。

### 误区 5："可以移除焦点样式"

**错！** 焦点样式对键盘用户至关重要。

```css
/* ❌ 不好：移除焦点样式 */
*:focus {
  outline: none;
}

/* ✅ 好：自定义焦点样式 */
*:focus-visible {
  outline: 2px solid #0066cc;
}
```

> **原理**：移除焦点样式后，键盘用户无法知道当前聚焦在哪里，完全无法使用网站。

---

## 12.8 动手练习

### 练习 1：基础练习

修复以下表单的无障碍问题：

```html
<form>
  <div>用户名</div>
  <input type="text">
  <div>邮箱</div>
  <input type="email">
  <div>提交</div>
</form>
```

<details>
<summary>点击查看答案</summary>

```html
<form>
  <label for="username">用户名：</label>
  <input type="text" id="username" name="username">
  
  <label for="email">邮箱：</label>
  <input type="email" id="email" name="email" aria-describedby="email-help">
  <p id="email-help">请输入有效的邮箱地址</p>
  
  <button type="submit">提交</button>
</form>
```

</details>

### 练习 2：进阶练习

为一个模态框组件添加完整的无障碍支持，包括：
- ARIA 角色和状态
- 键盘关闭功能（Escape 键）
- 焦点管理（打开时聚焦，关闭时返回原焦点）

<details>
<summary>点击查看答案</summary>

```html
<!-- 触发按钮 -->
<button id="open-modal">打开对话框</button>

<!-- 模态框 -->
<div 
  id="modal" 
  role="dialog" 
  aria-modal="true" 
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
  hidden
>
  <h2 id="modal-title">确认操作</h2>
  <p id="modal-description">确定要执行此操作吗？此操作无法撤销。</p>
  <button id="confirm">确认</button>
  <button id="cancel">取消</button>
</div>

<script>
const openModalBtn = document.getElementById('open-modal');
const modal = document.getElementById('modal');
const confirmBtn = document.getElementById('confirm');
const cancelBtn = document.getElementById('cancel');
let previousFocus;

openModalBtn.addEventListener('click', () => {
  previousFocus = document.activeElement;
  modal.hidden = false;
  confirmBtn.focus();
});

function closeModal() {
  modal.hidden = true;
  previousFocus?.focus();
}

cancelBtn.addEventListener('click', closeModal);
confirmBtn.addEventListener('click', closeModal);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.hidden) {
    closeModal();
  }
});
</script>
```

</details>

### 练习 3（挑战）：综合练习

创建一个无障碍友好的导航菜单，包含：
- 语义化标签
- 键盘导航支持（上下箭头、Enter 键）
- ARIA 属性（角色、状态）
- 跳过导航链接
- 响应式设计（移动端汉堡菜单）

<details>
<summary>点击查看答案</summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>无障碍导航菜单</title>
  <style>
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: #0066cc;
      color: white;
      padding: 8px;
      z-index: 100;
    }
    .skip-link:focus {
      top: 0;
    }
    .nav-menu {
      display: flex;
      gap: 20px;
      list-style: none;
      padding: 0;
    }
    .nav-link {
      padding: 8px 16px;
      text-decoration: none;
      color: #333;
    }
    .nav-link:focus {
      outline: 2px solid #0066cc;
    }
    .mobile-menu-btn {
      display: none;
    }
    @media (max-width: 768px) {
      .nav-menu {
        display: none;
        flex-direction: column;
      }
      .mobile-menu-btn {
        display: block;
      }
      .nav-menu.open {
        display: flex;
      }
    }
  </style>
</head>
<body>
  <a href="#main-content" class="skip-link">跳到主要内容</a>
  
  <header>
    <button class="mobile-menu-btn" aria-label="切换菜单" aria-expanded="false">
      ☰
    </button>
    <nav role="navigation">
      <ul class="nav-menu" role="menubar" aria-label="主导航">
        <li role="none">
          <a href="/" class="nav-link" role="menuitem">首页</a>
        </li>
        <li role="none">
          <a href="/about" class="nav-link" role="menuitem">关于</a>
        </li>
        <li role="none">
          <a href="/products" class="nav-link" role="menuitem">产品</a>
        </li>
        <li role="none">
          <a href="/contact" class="nav-link" role="menuitem">联系</a>
        </li>
      </ul>
    </nav>
  </header>
  
  <main id="main-content">
    <h1>主要内容区域</h1>
    <p>这是页面的主要内容...</p>
  </main>

  <script>
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    mobileMenuBtn.addEventListener('click', () => {
      const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
      mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
      navMenu.classList.toggle('open');
    });
  </script>
</body>
</html>
```

</details>

---

## 教程总结

恭喜你！你已经完成了整个 HTML 教程的学习。让我们回顾一下学到的内容：

### 核心技能

1. **HTML 文档结构**：DOCTYPE、html、head、body、meta 标签
2. **文本标签**：标题、段落、强调、引用、代码等语义化文本元素
3. **链接与图片**：创建链接、添加图片、响应式图片
4. **列表与表格**：有序列表、无序列表、定义列表、表格结构
5. **表单**：各种输入类型、表单验证、高级表单元素
6. **语义化标签**：header、nav、main、article、section、footer
7. **多媒体**：音频、视频、字幕、响应式图片
8. **元数据与 SEO**：meta 标签、Open Graph、结构化数据
9. **无障碍访问**：ARIA 属性、键盘导航、颜色对比度

### 最佳实践

- 使用语义化标签，让代码有意义
- 为图片添加替代文本
- 确保表单有标签关联
- 提供跳过导航链接
- 保持良好的颜色对比度
- 不要移除焦点样式
- 测试键盘可访问性

### 下一步学习

现在你已经掌握了 HTML 的基础知识，可以继续学习：

1. **CSS**：美化网页，学习布局、样式、动画
2. **JavaScript**：让网页动起来，实现交互功能
3. **前端框架**：Vue、React、Angular 等现代框架
4. **响应式设计**：让网页在不同设备上都能良好显示
5. **性能优化**：提升网页加载速度和用户体验

感谢你跟随本教程学习！祝你在前端开发的道路上越走越远！