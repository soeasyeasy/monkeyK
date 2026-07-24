---
title: "第十四章：移动端性能优化"
description: "移动端特性、触摸优化、电量优化等移动 Web 性能技术"
---

# 第十四章：移动端性能优化

## 移动端特性

### 硬件限制

| 特性 | 移动端 | 桌面端 |
| --- | --- | --- |
| CPU | 低功耗 ARM | 高性能 x86 |
| 内存 | 1-8GB | 8-64GB |
| 网络 | 不稳定 | 稳定 |
| 电池 | 有限 | 持续供电 |
| 触摸 | 手指操作 | 精确鼠标 |

### 网络环境

```
移动网络类型：
- 4G：50-100ms RTT
- 5G：10-20ms RTT
- WiFi：变化大

特点：
- 延迟波动大
- 带宽不稳定
- 频繁切换网络
```

## 触摸优化

### 触摸目标尺寸

```css
/* 最小触摸目标 44x44px */
.button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 24px;
}

/* 触摸反馈 */
.button:active {
  transform: scale(0.95);
  background-color: var(--active-color);
}
```

### 触摸事件优化

```javascript
// 使用 touch 事件替代 click（更快响应）
element.addEventListener('touchstart', handleTouch, { passive: true });

// passive 选项：告知不会调用 preventDefault
// 浏览器可以立即滚动，不等待 JS 执行

// 300ms 延迟解决
// 方法1：viewport meta
// <meta name="viewport" content="width=device-width, initial-scale=1">

// 方法2：touch-action CSS
.button {
  touch-action: manipulation;
}
```

### 手势处理

```javascript
// 防止默认行为
element.addEventListener('touchmove', (e) => {
  if (isDragging) {
    e.preventDefault();
  }
}, { passive: false });

// 使用 Pointer Events 统一处理
element.addEventListener('pointerdown', handlePointerDown);
element.addEventListener('pointermove', handlePointerMove);
element.addEventListener('pointerup', handlePointerUp);
```

## 电量优化

### 减少后台活动

```javascript
// 页面可见性 API
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // 页面不可见，暂停非必要任务
    pauseAnimations();
    stopPolling();
  } else {
    // 页面可见，恢复任务
    resumeAnimations();
    startPolling();
  }
});
```

### 减少动画

```javascript
// 检测电量状态
if ('getBattery' in navigator) {
  navigator.getBattery().then(battery => {
    if (battery.level < 0.2 && !battery.charging) {
      // 低电量模式
      enableBatterySaverMode();
    }

    battery.addEventListener('levelchange', () => {
      console.log('电量:', battery.level);
    });
  });
}

// 减少动画
function enableBatterySaverMode() {
  document.documentElement.classList.add('battery-saver');
}
```

```css
/* 低电量模式减少动画 */
.battery-saver * {
  animation-duration: 0s !important;
  transition-duration: 0s !important;
}
```

## 移动端渲染优化

### 视口优化

```html
<!-- 正确的 viewport 设置 -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">

<!-- 避免：
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
这会阻止用户缩放，影响可访问性
-->
```

### 安全区域适配

```css
/* 适配刘海屏 */
.container {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* HTML 中启用 */
<meta name="viewport" content="viewport-fit=cover">
```

### 移动端滚动优化

```css
/* 平滑滚动 */
html {
  scroll-behavior: smooth;
}

/* 惯性滚动 */
.scroll-container {
  -webkit-overflow-scrolling: touch;
  overflow-y: auto;
}

/* 固定定位优化 */
.fixed-header {
  position: fixed;
  top: 0;
  will-change: transform;
}
```

## 移动端网络优化

### 离线支持

```javascript
// Service Worker 离线缓存
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        // 离线时返回离线页面
        return caches.match('/offline.html');
      });
    })
  );
});
```

### 网络感知加载

```javascript
// 根据网络类型加载不同资源
const connection = navigator.connection;

if (connection.effectiveType === '4g') {
  loadFullExperience();
} else if (connection.effectiveType === '3g') {
  loadLiteExperience();
} else {
  loadMinimalExperience();
}

// 监听网络变化
connection.addEventListener('change', () => {
  console.log('网络变化:', connection.effectiveType);
  adjustExperience();
});
```

## 移动端图片优化

### 响应式图片

```html
<!-- 根据设备像素比选择 -->
<img srcset="image-1x.webp 1x,
             image-2x.webp 2x,
             image-3x.webp 3x"
     src="image-1x.webp"
     alt="描述">

<!-- 根据视口宽度选择 -->
<img srcset="image-small.webp 480w,
             image-medium.webp 800w,
             image-large.webp 1200w"
     sizes="(max-width: 600px) 100vw,
            (max-width: 1024px) 50vw,
            33vw"
     src="image-medium.webp"
     alt="描述">
```

### 图片懒加载

```html
<!-- 原生懒加载 -->
<img src="placeholder.webp"
     data-src="image.webp"
     loading="lazy"
     width="300"
     height="200"
     alt="描述">

<!-- 首屏图片不使用 lazy -->
<img src="hero.webp" alt="首屏大图">
```

## 移动端字体优化

### 字体加载策略

```css
/* 字体显示策略 */
@font-face {
  font-family: 'CustomFont';
  src: url('font.woff2') format('woff2');
  font-display: swap; /* 先显示后备字体，加载完替换 */
}

/* font-display 选项：
- auto：浏览器默认
- block：短暂阻塞，然后交换
- swap：立即交换，加载完替换
- fallback：短暂阻塞，然后失败
- optional：短暂阻塞，失败则不加载
*/
```

### 字体子集化

```javascript
// 只包含需要的字符
// 使用 fontmin 或 font-spider
import fontmin from 'fontmin';

const fontminInstance = new Fontmin()
  .src('fonts/*.ttf')
  .dest('build/fonts')
  .use(Fontmin.glyph({
    text: '你好世界HelloWorld'
  }));

fontminInstance.run((err, files) => {
  // 处理结果
});
```

## 核心知识点

1. **触摸优化**：44x44px 最小目标，passive 事件，touch-action
2. **电量优化**：页面可见性 API，低电量模式减少动画
3. **网络优化**：离线支持，网络感知加载
4. **图片优化**：响应式图片，懒加载，现代格式
5. **字体优化**：font-display 策略，字体子集化
