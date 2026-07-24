---
title: 过渡与动画
description: transition、animation、keyframes
---

# CSS 过渡与动画

CSS 过渡和动画可以让元素的状态变化更加平滑，提升用户体验。

## 过渡（Transition）

过渡用于在属性值变化时添加平滑效果。

### transition 属性

```css
.box {
  transition: property duration timing-function delay;
}
```

### 单独设置

```css
.box {
  transition-property: all; /* 变化的属性 */
  transition-duration: 0.3s; /* 持续时间 */
  transition-timing-function: ease; /* 速度曲线 */
  transition-delay: 0s; /* 延迟时间 */
}
```

### 简写

```css
.box {
  transition: all 0.3s ease 0s;
}
```

### 多属性过渡

```css
.box {
  transition:
    background-color 0.3s ease,
    transform 0.5s ease-in-out,
    opacity 0.2s linear;
}
```

### 速度曲线（timing-function）

| 值               | 描述             |
| ---------------- | ---------------- |
| `ease`           | 默认，慢-快-慢   |
| `linear`         | 匀速             |
| `ease-in`        | 慢入             |
| `ease-out`       | 慢出             |
| `ease-in-out`    | 慢入慢出         |
| `cubic-bezier()` | 自定义贝塞尔曲线 |

### 实际示例

#### 按钮悬停效果

```css
.btn {
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
}

.btn:hover {
  background: #0056b3;
}

.btn:active {
  transform: scale(0.98);
}
```

#### 卡片悬停效果

```css
.card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.3s,
    box-shadow 0.3s;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}
```

#### 输入框聚焦效果

```css
.input {
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  outline: none;
}
```

## 动画（Animation）

动画使用 `@keyframes` 定义关键帧，可以创建更复杂的动画效果。

### @keyframes 定义

```css
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

或使用百分比：

```css
@keyframes bounce {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
  100% {
    transform: translateY(0);
  }
}
```

### animation 属性

```css
.box {
  animation: name duration timing-function delay iteration-count direction fill-mode;
}
```

### 单独设置

```css
.box {
  animation-name: slideIn;
  animation-duration: 0.5s;
  animation-timing-function: ease-out;
  animation-delay: 0.2s;
  animation-iteration-count: 1;
  animation-direction: normal;
  animation-fill-mode: forwards;
}
```

### 简写

```css
.box {
  animation: slideIn 0.5s ease-out 0.2s 1 normal forwards;
}
```

### 动画属性详解

| 属性                        | 描述                           |
| --------------------------- | ------------------------------ |
| `animation-name`            | 动画名称（@keyframes 名称）    |
| `animation-duration`        | 动画持续时间                   |
| `animation-timing-function` | 速度曲线                       |
| `animation-delay`           | 延迟时间                       |
| `animation-iteration-count` | 播放次数（`infinite` 为无限）  |
| `animation-direction`       | 播放方向                       |
| `animation-fill-mode`       | 动画前后状态                   |
| `animation-play-state`      | 播放状态（`running`/`paused`） |

### animation-direction

| 值                  | 描述                           |
| ------------------- | ------------------------------ |
| `normal`            | 正向播放                       |
| `reverse`           | 反向播放                       |
| `alternate`         | 交替（奇数次正向，偶数次反向） |
| `alternate-reverse` | 反向交替                       |

### animation-fill-mode

| 值          | 描述                              |
| ----------- | --------------------------------- |
| `none`      | 默认，动画结束后回到初始状态      |
| `forwards`  | 保持最后一帧状态                  |
| `backwards` | 应用第一帧状态（包括 delay 期间） |
| `both`      | 同时应用 forwards 和 backwards    |

### 实际示例

#### 加载动画

```css
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
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

#### 淡入动画

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}
```

#### 弹跳动画

```css
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.bounce {
  animation: bounce 0.6s ease-in-out infinite;
}
```

#### 脉冲动画

```css
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.pulse {
  animation: pulse 2s ease-in-out infinite;
}
```

#### 打字机效果

```css
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
  overflow: hidden;
  white-space: nowrap;
  border-right: 2px solid #333;
  animation:
    typing 3s steps(20) forwards,
    blink 0.75s step-end infinite;
}
```

## 多动画组合

```css
.box {
  animation:
    fadeIn 0.5s ease-out forwards,
    slideUp 0.5s ease-out forwards,
    pulse 2s ease-in-out 0.5s infinite;
}
```

## 性能优化

### 使用 transform 和 opacity

`transform` 和 `opacity` 的动画性能最好，因为它们可以由 GPU 加速。

```css
/* 推荐 */
.box {
  transition:
    transform 0.3s,
    opacity 0.3s;
}

.box:hover {
  transform: translateY(-4px);
  opacity: 0.8;
}

/* 避免 */
.box {
  transition:
    width 0.3s,
    height 0.3s,
    margin 0.3s;
}
```

### will-change

提示浏览器元素即将发生变化。

```css
.box {
  will-change: transform;
}
```

**注意**：不要滥用 `will-change`，只在必要时使用。

## 减少动画（可访问性）

尊重用户的减少动画偏好。

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 实际示例

### 页面加载动画

```html
<style>
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .content {
    animation: fadeInUp 0.6s ease-out forwards;
  }

  .delay-1 {
    animation-delay: 0.1s;
    opacity: 0;
  }
  .delay-2 {
    animation-delay: 0.2s;
    opacity: 0;
  }
  .delay-3 {
    animation-delay: 0.3s;
    opacity: 0;
  }
</style>

<div class="content delay-1">标题</div>
<div class="content delay-2">内容</div>
<div class="content delay-3">底部</div>
```

### 通知弹窗

```html
<style>
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: #28a745;
    color: white;
    border-radius: 8px;
    animation: slideInRight 0.3s ease-out forwards;
  }

  .notification.hide {
    animation: slideOutRight 0.3s ease-in forwards;
  }
</style>

<div class="notification">操作成功！</div>
```

## 小结

- `transition` 用于属性值变化的平滑过渡
- `animation` 使用 `@keyframes` 创建复杂动画
- 优先使用 `transform` 和 `opacity` 提升性能
- 使用 `will-change` 提示浏览器优化
- 尊重用户的减少动画偏好
- 合理使用动画提升用户体验

下一章我们将学习 CSS 变量。
