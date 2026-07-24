---
title: CSS 变量
description: 自定义属性、作用域、动态主题
---

# CSS 变量

CSS 变量（也称为自定义属性）让你可以在 CSS 中存储和复用值，使样式维护更加简单。

## 基本语法

### 定义变量

变量名必须以 `--` 开头。

```css
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --font-size-base: 16px;
  --spacing-unit: 8px;
}
```

### 使用变量

使用 `var()` 函数引用变量。

```css
.btn {
  background-color: var(--primary-color);
  font-size: var(--font-size-base);
  padding: calc(var(--spacing-unit) * 2);
}
```

## 作用域

### 全局变量

在 `:root` 中定义的变量可以在整个文档中使用。

```css
:root {
  --primary: #007bff;
}

.btn {
  color: var(--primary);
}

.link {
  color: var(--primary);
}
```

### 局部变量

在特定选择器中定义的变量只在该元素及其后代中可用。

```css
.theme-dark {
  --bg-color: #1a1a1a;
  --text-color: #ffffff;
}

.theme-light {
  --bg-color: #ffffff;
  --text-color: #333333;
}

body {
  background-color: var(--bg-color);
  color: var(--text-color);
}
```

### 作用域优先级

```css
:root {
  --color: blue;
}

.card {
  --color: red;
}

.text {
  color: var(--color); /* 如果在 .card 内，则为 red；否则为 blue */
}
```

## 默认值

`var()` 函数可以接受第二个参数作为默认值。

```css
.btn {
  background-color: var(--btn-bg, #007bff);
  color: var(--btn-color, white);
}
```

如果变量未定义，则使用默认值。

## 动态主题

### 主题切换示例

```css
:root {
  /* 默认主题（浅色） */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #333333;
  --text-secondary: #666666;
  --accent: #007bff;
  --border: #e0e0e0;
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --accent: #4dabf7;
  --border: #404040;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border);
  color: var(--text-primary);
}

.btn-primary {
  background-color: var(--accent);
  color: white;
}
```

### JavaScript 切换主题

```javascript
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// 初始化主题
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
```

## 变量与 calc()

CSS 变量可以与 `calc()` 函数结合使用。

```css
:root {
  --spacing-unit: 8px;
  --columns: 3;
}

.grid {
  gap: calc(var(--spacing-unit) * 2);
}

.column {
  width: calc(100% / var(--columns) - var(--spacing-unit));
}
```

## JavaScript 操作变量

### 读取变量

```javascript
const styles = getComputedStyle(document.documentElement);
const primaryColor = styles.getPropertyValue('--primary-color').trim();
console.log(primaryColor); // #007bff
```

### 设置变量

```javascript
// 全局设置
document.documentElement.style.setProperty('--primary-color', '#ff0000');

// 局部设置
const card = document.querySelector('.card');
card.style.setProperty('--card-bg', '#f0f0f0');
```

### 删除变量

```javascript
document.documentElement.style.removeProperty('--primary-color');
```

## 实际示例

### 设计系统

```css
:root {
  /* 颜色 */
  --color-primary: #007bff;
  --color-primary-hover: #0056b3;
  --color-secondary: #6c757d;
  --color-success: #28a745;
  --color-danger: #dc3545;
  --color-warning: #ffc107;
  
  /* 中性色 */
  --color-white: #ffffff;
  --color-gray-100: #f8f9fa;
  --color-gray-200: #e9ecef;
  --color-gray-300: #dee2e6;
  --color-gray-500: #adb5bd;
  --color-gray-700: #495057;
  --color-gray-900: #212529;
  --color-black: #000000;
  
  /* 字体 */
  --font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
  --font-size-2xl: 32px;
  
  /* 间距 */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 24px;
  --spacing-6: 32px;
  --spacing-8: 48px;
  
  /* 圆角 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
  
  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  
  /* 过渡 */
  --transition-fast: 0.15s;
  --transition-base: 0.3s;
  --transition-slow: 0.5s;
}

/* 使用示例 */
.btn {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
}

.card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-5);
  box-shadow: var(--shadow-md);
}
```

### 响应式变量

```css
:root {
  --font-size-base: 14px;
}

@media (min-width: 768px) {
  :root {
    --font-size-base: 16px;
  }
}

@media (min-width: 1024px) {
  :root {
    --font-size-base: 18px;
  }
}

body {
  font-size: var(--font-size-base);
}
```

## 浏览器兼容性

CSS 变量在现代浏览器中支持良好，但 IE 不支持。

| 浏览器 | 支持版本 |
|--------|----------|
| Chrome | 49+ |
| Firefox | 31+ |
| Safari | 9.1+ |
| Edge | 15+ |
| IE | 不支持 |

## 最佳实践

1. **使用 `:root` 定义全局变量**：便于全局管理
2. **命名规范**：使用有意义的名称，如 `--color-primary` 而非 `--c1`
3. **分组组织**：按类型分组（颜色、字体、间距等）
4. **使用默认值**：`var(--color, fallback)` 提高健壮性
5. **避免过度使用**：只在需要动态变化或复用时使用
6. **结合主题系统**：使用变量实现主题切换

## 小结

- CSS 变量以 `--` 开头，使用 `var()` 引用
- `:root` 中定义的变量全局可用
- 变量具有作用域，子元素可以继承
- 支持默认值：`var(--name, fallback)`
- 可以通过 JavaScript 动态修改
- 适合构建设计系统和主题切换

下一章我们将学习现代 CSS 特性。
