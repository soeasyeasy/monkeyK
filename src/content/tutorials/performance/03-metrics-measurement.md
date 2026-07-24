---
title: "第三章：性能指标与测量"
description: "掌握核心性能指标体系，学会使用工具测量性能"
---

# 第三章：性能指标与测量

## Core Web Vitals

Google 定义的核心网页指标，直接影响搜索排名。

### LCP - 最大内容绘制

 Largest Contentful Paint，衡量加载性能。

| 评级 | 时间 |
| --- | --- |
| 良好 | ≤ 2.5s |
| 需改进 | 2.5s - 4.0s |
| 差 | > 4.0s |

```javascript
// 使用 PerformanceObserver 测量 LCP
new PerformanceObserver((entryList) => {
  const entries = entryList.getEntries();
  const lastEntry = entries[entries.length - 1];
  console.log('LCP:', lastEntry.startTime);
}).observe({ type: 'largest-contentful-paint', buffered: true });
```

### FID / INP - 交互延迟

First Input Delay / Interaction to Next Paint，衡量交互响应性。

| 评级 | INP 时间 |
| --- | --- |
| 良好 | ≤ 200ms |
| 需改进 | 200ms - 500ms |
| 差 | > 500ms |

```javascript
// 测量 INP
new PerformanceObserver((entryList) => {
  const entries = entryList.getEntries();
  entries.forEach((entry) => {
    if (entry.interactionId) {
      console.log('交互延迟:', entry.processingStart - entry.startTime);
    }
  });
}).observe({ type: 'event', buffered: true, durationThreshold: 16 });
```

### CLS - 累积布局偏移

Cumulative Layout Shift，衡量视觉稳定性。

| 评级 | CLS 值 |
| --- | --- |
| 良好 | ≤ 0.1 |
| 需改进 | 0.1 - 0.25 |
| 差 | > 0.25 |

```javascript
// 测量 CLS
let clsValue = 0;
new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    if (!entry.hadRecentInput) {
      clsValue += entry.value;
      console.log('当前 CLS:', clsValue);
    }
  }
}).observe({ type: 'layout-shift', buffered: true });
```

## 其他重要指标

### FCP - 首次内容绘制

First Contentful Paint，浏览器首次绘制内容的时间。

| 评级 | 时间 |
| --- | --- |
| 良好 | ≤ 1.8s |
| 需改进 | 1.8s - 3.0s |
| 差 | > 3.0s |

### TTFB - 首字节时间

Time to First Byte，从请求到收到第一个字节的时间。

| 评级 | 时间 |
| --- | --- |
| 良好 | ≤ 800ms |
| 需改进 | 800ms - 1800ms |
| 差 | > 1800ms |

### TTI - 可交互时间

Time to Interactive，页面变为可交互的时间。

## 测量工具

### Chrome DevTools

#### Performance 面板

```
使用步骤：
1. 打开 DevTools → Performance
2. 点击录制按钮
3. 执行要测量的操作
4. 停止录制，分析结果

关注指标：
- Scripting：JavaScript 执行时间
- Rendering：样式计算、布局时间
- Painting：绘制时间
- FPS：帧率
```

#### Lighthouse

```
使用步骤：
1. 打开 DevTools → Lighthouse
2. 选择要审计的类别
3. 点击"生成报告"

报告内容：
- Performance 得分
- Core Web Vitals
- 优化建议
```

### WebPageTest

在线性能测试工具，提供详细的瀑布图和指标。

```
功能特点：
- 多地点测试
- 真实设备测试
- 视频录制页面加载
- 详细的瀑布图
```

### Performance API

```javascript
// 测量自定义时间
performance.mark('start');
// 执行操作
performance.mark('end');
performance.measure('操作耗时', 'start', 'end');

const measure = performance.getEntriesByName('操作耗时')[0];
console.log('耗时:', measure.duration);
```

### Navigation Timing API

```javascript
// 获取页面加载各阶段时间
const timing = performance.getEntriesByType('navigation')[0];

console.log('DNS 查询:', timing.domainLookupEnd - timing.domainLookupStart);
console.log('TCP 连接:', timing.connectEnd - timing.connectStart);
console.log('TTFB:', timing.responseStart - timing.requestStart);
console.log('DOM 解析:', timing.domComplete - timing.domInteractive);
```

### Resource Timing API

```javascript
// 获取资源加载详情
const resources = performance.getEntriesByType('resource');

resources.forEach((resource) => {
  console.log('资源:', resource.name);
  console.log('加载耗时:', resource.duration);
  console.log('大小:', resource.transferSize);
});
```

## 建立性能监控

### 客户端埋点

```javascript
// 上报性能数据
function reportMetrics() {
  const metrics = {
    url: location.href,
    lcp: getLCP(),
    fid: getFID(),
    cls: getCLS(),
    timestamp: Date.now()
  };

  navigator.sendBeacon('/api/metrics', JSON.stringify(metrics));
}

// 页面卸载时上报
window.addEventListener('pagehide', reportMetrics);
```

### 性能预算监控

```javascript
// 检查是否超出性能预算
const BUDGET = {
  maxLCP: 2500,
  maxCLS: 0.1,
  maxJS: 200 * 1024 // 200KB
};

function checkBudget() {
  const jsSize = performance.getEntriesByType('resource')
    .filter(r => r.name.endsWith('.js'))
    .reduce((sum, r) => sum + r.transferSize, 0);

  if (jsSize > BUDGET.maxJS) {
    console.warn('JS 体积超出预算:', jsSize);
  }
}
```

## 核心知识点

1. **Core Web Vitals**：LCP、INP、CLS 是核心指标，直接影响搜索排名
2. **测量先行**：优化前先测量，用数据指导优化方向
3. **工具组合**：DevTools 用于开发调试，Lighthouse 用于审计，RUM 用于真实用户监控
4. **Performance API**：浏览器原生 API，可自定义测量和监控
5. **性能预算**：为关键指标设定上限，防止性能退化
