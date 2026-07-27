---
title: "第十四章：移动端性能优化"
description: "掌握移动端触摸优化、电量优化、弱网适配等移动 Web 性能技术"
---

# 第十四章：移动端性能优化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 移动端和桌面端性能优化有什么区别？
- 触摸事件怎么优化才能更流畅？
- 移动端电量消耗太快怎么解决？
- 弱网环境下怎么保证用户体验？

这一章就是为了解答这些问题。移动端已成为用户访问的主要入口，但移动设备有独特的限制：CPU 性能较弱、内存有限、网络不稳定、电池续航敏感。针对这些特点，我们需要专门的优化策略。

---

## 1 为什么需要移动端优化？

### 痛点分析

你可能遇到过这些问题：

- 桌面端跑得飞快的页面，手机上卡成 PPT
- 用户反馈点击按钮没反应，要等半天
- 手机发烫、耗电快，用户直接卸载
- 地铁里信号差，页面完全打不开

打个比方：

> 移动端优化就像野外生存：
> - 资源有限（CPU/内存）→ 精打细算
> - 天气多变（网络不稳定）→ 准备应急预案
> - 电量宝贵 → 省电模式
> - 手指操作 → 大按钮、大间距

### 移动端特性对比

| 特性 | 移动端 | 桌面端 | 优化策略 |
| --- | --- | --- | --- |
| CPU | 低功耗 ARM | 高性能 x86 | 减少复杂计算 |
| 内存 | 1-8GB | 8-64GB | 控制内存占用 |
| 网络 | 不稳定（4G/5G/WiFi切换） | 稳定（有线/WiFi） | 离线支持、网络感知 |
| 电池 | 有限 | 持续供电 | 减少后台活动 |
| 交互 | 手指触摸（不精确） | 鼠标（精确） | 优化触摸目标 |

### 移动网络环境

```
移动网络类型与延迟：
├── 4G：50-100ms RTT（往返延迟）
├── 5G：10-20ms RTT
└── WiFi：变化大（10-200ms）

移动网络特点：
├── 延迟波动大 → 需要请求重试机制
├── 带宽不稳定 → 需要网络感知加载
└── 频繁切换网络 → 需要连接迁移支持
```

---

## 2 触摸优化

### 触摸目标尺寸

移动端用户用手指操作，触摸目标必须足够大，否则容易误触。

```css
/* 最小触摸目标 44x44px（Apple HIG 推荐） */
.button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 24px;
}

/* 触摸反馈：给用户即时响应 */
.button:active {
  transform: scale(0.95);
  background-color: var(--active-color);
}

/* 按钮间距：避免误触 */
.button-group {
  display: flex;
  gap: 12px;  /* 按钮之间至少 12px 间距 */
}
```

**说明**：

- Apple HIG 推荐最小触摸目标 44x44px
- Material Design 推荐 48x48dp
- 按钮间距至少 8px，避免误触

### 触摸事件优化

```javascript
// 使用 touch 事件替代 click（更快响应）
// passive: true 告诉浏览器不会调用 preventDefault
// 浏览器可以立即滚动，不等待 JS 执行
element.addEventListener('touchstart', handleTouch, { passive: true });

// 解决 300ms 点击延迟
// 方法1：viewport meta（推荐）
// <meta name="viewport" content="width=device-width, initial-scale=1">

// 方法2：touch-action CSS
// touch-action: manipulation 告诉浏览器不需要等待双击
```

```css
/* 消除 300ms 点击延迟 */
.button {
  touch-action: manipulation;
}
```

**原理**：

> 300ms 延迟的由来：
> - 早期移动端页面没有缩放，浏览器需要等 300ms 判断是否是双击
> - 设置了 `width=device-width` 或 `touch-action: manipulation` 后，浏览器知道不需要等双击
> - 点击延迟从 300ms 降为 0ms

### 手势处理

```javascript
// 需要阻止默认行为时（如拖拽）
// passive: false 才能调用 preventDefault
element.addEventListener('touchmove', (e) => {
  if (isDragging) {
    e.preventDefault();  // 阻止页面滚动
  }
}, { passive: false });

// 使用 Pointer Events 统一处理触摸和鼠标
element.addEventListener('pointerdown', handlePointerDown);
element.addEventListener('pointermove', handlePointerMove);
element.addEventListener('pointerup', handlePointerUp);
```

**说明**：

- Pointer Events 统一了鼠标、触摸、手写笔事件
- 减少重复代码，一套逻辑处理所有输入设备
- 兼容性：所有现代浏览器都支持

---

## 3 电量优化

### 页面可见性控制

```javascript
// 页面可见性 API：页面不可见时暂停非必要任务
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // 页面不可见（切换到其他标签、最小化）
    pauseAnimations();   // 暂停动画
    stopPolling();       // 停止轮询
    pauseVideo();        // 暂停视频
  } else {
    // 页面重新可见
    resumeAnimations();
    startPolling();
    resumeVideo();
  }
});
```

**原理**：

> 页面可见性控制就像办公室节能：
> - 有人时（页面可见）→ 开灯、开空调
> - 没人时（页面不可见）→ 关灯、关空调
> - 节省资源，延长电池寿命

### 低电量检测

```javascript
// 检测电量状态
if ('getBattery' in navigator) {
  navigator.getBattery().then(battery => {
    // 电量低于 20% 且未充电
    if (battery.level < 0.2 && !battery.charging) {
      enableBatterySaverMode();
    }

    // 监听电量变化
    battery.addEventListener('levelchange', () => {
      console.log('当前电量:', battery.level * 100 + '%');
      if (battery.level < 0.2 && !battery.charging) {
        enableBatterySaverMode();
      }
    });
  });
}

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

.battery-saver .auto-play-video {
  display: none;
}
```

---

## 4 移动端渲染优化

### 视口设置

```html
<!-- 正确的 viewport 设置 -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">

<!-- 避免：阻止用户缩放 -->
<!-- <meta name="viewport" content="..., user-scalable=no"> -->
<!-- 这会阻止用户缩放，影响可访问性（视障用户需要放大） -->
```

### 安全区域适配

```html
<!-- HTML 中启用 viewport-fit=cover -->
<meta name="viewport" content="width=device-width, viewport-fit=cover">
```

```css
/* 适配刘海屏、底部横条 */
.container {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

**原理**：

> 安全区域适配就像相框：
> - 刘海屏的"刘海" = 相框遮挡的部分
> - `env(safe-area-inset-*)` = 自动计算被遮挡的边距
> - 内容不会被刘海、底部横条遮挡

### 移动端滚动优化

```css
/* 平滑滚动 */
html {
  scroll-behavior: smooth;
}

/* 惯性滚动（iOS） */
.scroll-container {
  -webkit-overflow-scrolling: touch;
  overflow-y: auto;
}

/* 固定定位优化：使用 transform 提升为合成层 */
.fixed-header {
  position: fixed;
  top: 0;
  will-change: transform;
}
```

---

## 5 移动端网络优化

### 离线支持

```javascript
// Service Worker 离线缓存（sw.js）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // 缓存命中：直接返回
      // 缓存未命中：发网络请求
      // 网络也失败：返回离线页面
      return response || fetch(event.request).catch(() => {
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
  // 4G/WiFi：完整体验
  loadFullExperience();
} else if (connection.effectiveType === '3g') {
  // 3G：精简体验
  loadLiteExperience();
} else {
  // 2G/慢网络：极简体验
  loadMinimalExperience();
}

// 监听网络变化（WiFi 切 4G 等）
connection.addEventListener('change', () => {
  console.log('网络切换为:', connection.effectiveType);
  adjustExperience();
});
```

---

## 6 移动端图片优化

### 响应式图片

```html
<!-- 根据设备像素比选择（Retina 屏幕用 2x） -->
<img srcset="image-1x.webp 1x,
             image-2x.webp 2x,
             image-3x.webp 3x"
     src="image-1x.webp"
     alt="描述">

<!-- 根据视口宽度选择（手机用小图，桌面用大图） -->
<img srcset="image-small.webp 480w,
             image-medium.webp 800w,
             image-large.webp 1200w"
     sizes="(max-width: 600px) 100vw,
            (max-width: 1024px) 50vw,
            33vw"
     src="image-medium.webp"
     alt="描述">
```

**原理**：

> 响应式图片就像快递包装：
> - 小物品用小盒子（手机用小图）
> - 大物品用大盒子（桌面用大图）
> - 不用每个物品都用最大盒子（浪费流量）

### 图片懒加载

```html
<!-- 原生懒加载（浏览器支持） -->
<img src="placeholder.webp"
     data-src="image.webp"
     loading="lazy"
     width="300"
     height="200"
     alt="描述">

<!-- 首屏图片不要使用 lazy（会延迟加载，影响 LCP） -->
<img src="hero.webp" alt="首屏大图">
```

**说明**：

- `loading="lazy"` 是浏览器原生懒加载
- 首屏图片不要用 lazy，否则影响 LCP 指标
- 设置 `width` 和 `height` 避免布局偏移（CLS）

---

## 7 移动端字体优化

### 字体加载策略

```css
@font-face {
  font-family: 'CustomFont';
  src: url('font.woff2') format('woff2');
  /* font-display 控制字体加载时的显示行为 */
  font-display: swap;
}

/* font-display 选项对比：
├── auto：浏览器默认行为（通常是 block）
├── block：短暂阻塞（3s），文字不可见，然后交换
├── swap：立即显示后备字体，加载完替换（推荐）
├── fallback：短暂阻塞（100ms），失败则不加载
└── optional：短暂阻塞（100ms），失败则不加载，且不使用缓存
*/
```

**推荐**：正文内容用 `swap`（先用系统字体，加载完替换），标题用 `optional`（加载慢就不加载）。

### 字体子集化

```javascript
// 中文字体文件很大（5-10MB），只保留用到的字符
// 使用 fontmin 或 font-spider
import fontmin from 'fontmin';

const fontminInstance = new Fontmin()
  .src('fonts/*.ttf')
  .dest('build/fonts')
  .use(Fontmin.glyph({
    text: '你好世界HelloWorld'  // 只保留这些字符
  }));

fontminInstance.run((err, files) => {
  // 处理后字体可能只有几十 KB
});
```

---

## 8 新手常见误区

### 误区 1："阻止用户缩放可以防止布局错乱"

**错！** 阻止缩放严重影响可访问性，视障用户需要放大页面。

**正确做法**：

1. 使用响应式设计，适配各种屏幕
2. 不要设置 `user-scalable=no` 或 `maximum-scale=1`
3. 允许用户自由缩放

### 误区 2："移动端用 click 事件就够了"

**不完全对！** click 事件在移动端有 300ms 延迟（虽然现代浏览器已大幅改善）。

**正确做法**：

1. 设置正确的 viewport meta
2. 使用 `touch-action: manipulation` 消除延迟
3. 需要更快响应时用 `touchstart`（加 `passive: true`）
4. 需要拖拽时用 Pointer Events

### 误区 3："所有图片都用 lazy loading"

**错！** 首屏关键图片不应该用 lazy loading。

**正确做法**：

1. 首屏大图（hero image）不要 lazy
2. 首屏以下的图片用 lazy
3. 首屏图片用 `preload` 预加载

### 误区 4："中文字体可以直接用"

**错！** 中文字体文件通常 5-10MB，直接加载会严重影响性能。

**正确做法**：

1. 使用字体子集化，只保留用到的字符
2. 使用 `font-display: swap` 避免 FOIT
3. 优先使用 woff2 格式（压缩率最高）

---

## 9 动手练习

### 练习 1：基础练习 - 触摸优化

**题目**：优化以下按钮，使其适合移动端使用。

```css
.btn {
  padding: 4px 8px;
  font-size: 12px;
}
```

<details>
<summary>点击查看答案</summary>

```css
.btn {
  /* 最小触摸目标 44x44px */
  min-width: 44px;
  min-height: 44px;
  padding: 12px 24px;
  font-size: 16px;  /* 至少 16px，防止 iOS 自动缩放 */

  /* 消除 300ms 延迟 */
  touch-action: manipulation;

  /* 触摸反馈 */
  -webkit-tap-highlight-color: transparent;
}

.btn:active {
  transform: scale(0.95);
  opacity: 0.8;
}
```

**优化点**：

1. 最小触摸目标 44x44px
2. 字体至少 16px（防止 iOS 输入框自动缩放）
3. `touch-action: manipulation` 消除延迟
4. 添加触摸反馈

</details>

### 练习 2：进阶练习 - 电量感知

**题目**：实现一个电量感知的动画控制功能。

<details>
<summary>点击查看答案</summary>

```javascript
class BatteryAwareAnimations {
  constructor() {
    this.isLowBattery = false;
    this.init();
  }

  async init() {
    // 检测电量 API 是否可用
    if (!('getBattery' in navigator)) {
      console.log('Battery API 不可用');
      return;
    }

    const battery = await navigator.getBattery();
    this.updateBatteryState(battery);

    // 监听电量变化
    battery.addEventListener('levelchange', () => {
      this.updateBatteryState(battery);
    });

    // 监听充电状态变化
    battery.addEventListener('chargingchange', () => {
      this.updateBatteryState(battery);
    });
  }

  updateBatteryState(battery) {
    // 电量低于 20% 且未充电
    this.isLowBattery = battery.level < 0.2 && !battery.charging;

    if (this.isLowBattery) {
      document.documentElement.classList.add('battery-saver');
      console.log('低电量模式：减少动画');
    } else {
      document.documentElement.classList.remove('battery-saver');
      console.log('正常模式：完整动画');
    }
  }
}

// 使用
new BatteryAwareAnimations();
```

```css
/* 低电量模式减少动画 */
.battery-saver * {
  animation-duration: 0s !important;
  transition-duration: 0s !important;
}
```

**要点**：

1. 检测 Battery API 可用性
2. 监听电量和充电状态变化
3. 通过 CSS class 控制动画

</details>

### 练习 3（挑战）：综合练习 - 网络感知加载

**题目**：实现一个根据网络状态动态调整页面内容的组件。

<details>
<summary>点击查看答案</summary>

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const networkQuality = ref('good');  // 'good' | 'medium' | 'poor'
const isOffline = ref(false);

function updateNetworkStatus() {
  if (!navigator.onLine) {
    isOffline.value = true;
    networkQuality.value = 'poor';
    return;
  }

  isOffline.value = false;
  const conn = navigator.connection;
  if (!conn) {
    networkQuality.value = 'good';
    return;
  }

  if (conn.effectiveType === '4g' && conn.downlink >= 2) {
    networkQuality.value = 'good';
  } else if (conn.effectiveType === '3g' || conn.effectiveType === '4g') {
    networkQuality.value = 'medium';
  } else {
    networkQuality.value = 'poor';
  }
}

onMounted(() => {
  updateNetworkStatus();
  navigator.connection?.addEventListener('change', updateNetworkStatus);
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
});

onUnmounted(() => {
  navigator.connection?.removeEventListener('change', updateNetworkStatus);
  window.removeEventListener('online', updateNetworkStatus);
  window.removeEventListener('offline', updateNetworkStatus);
});
</script>

<template>
  <div class="app">
    <!-- 离线提示 -->
    <div v-if="isOffline" class="offline-banner">
      当前处于离线状态，部分内容不可用
    </div>

    <!-- 根据网络质量加载不同内容 -->
    <template v-if="networkQuality === 'good'">
      <!-- 高质量：加载视频、高清图片 -->
      <video src="intro.mp4" autoplay />
      <img src="hero-hd.webp" alt="高清大图" />
    </template>

    <template v-else-if="networkQuality === 'medium'">
      <!-- 中等质量：只加载图片 -->
      <img src="hero-medium.webp" alt="中等质量图片" />
    </template>

    <template v-else>
      <!-- 弱网：只显示文字 -->
      <div class="text-only">
        <h1>欢迎</h1>
        <p>当前网络较慢，仅显示文字内容</p>
      </div>
    </template>
  </div>
</template>
```

**要点**：

1. 综合使用 `navigator.connection`、`navigator.onLine`
2. 监听网络变化和在线/离线事件
3. 根据网络质量动态调整内容
4. 组件卸载时清理事件监听

</details>

---

## 下一章预告

下一章我们会学习 **SEO 与性能**——也就是性能优化如何影响搜索引擎排名。

你会学到：

- Core Web Vitals 与搜索排名的关系
- 技术 SEO 优化（元数据、结构化数据）
- SSR/预渲染对 SEO 的影响
- 图片 SEO 最佳实践

性能不仅是用户体验问题，也是搜索引擎排名的重要因素。
