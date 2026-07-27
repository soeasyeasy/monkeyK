---
title: "第十三章：性能监控与分析"
description: "掌握性能监控体系、Lighthouse 审计、DevTools 分析，用数据驱动优化"
---

# 第十三章：性能监控与分析

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 怎么知道页面到底慢不慢？慢在哪里？
- Lighthouse 分数低，怎么一步步优化？
- 怎么在真实用户环境中监控性能？
- 怎么防止优化后的代码又变慢？

这一章就是为了解答这些问题。性能监控是性能优化的"眼睛"——没有监控，优化就是盲人摸象；没有持续监控，优化成果就无法保持。

---

## 1 为什么需要性能监控？

### 痛点分析

你可能遇到过这些问题：

- 本地测试很快，用户反馈却很慢
- 优化了一波，过段时间又变慢了
- 不知道性能瓶颈在哪里，无从下手
- 老板问"页面性能怎么样"，答不上来

打个比方：

> 性能监控就像体检：
> - 没有监控 = 从不体检，生病了也不知道
> - 定期监控 = 每年体检，早发现早治疗
> - 实时监控 = 智能手表，心率异常立刻报警
> - 性能预算 = 健康指标，超标就要调整生活方式

### 监控目标

```
性能监控目标：
├── 发现问题 → 知道哪里慢
├── 定位瓶颈 → 找到根本原因
├── 量化优化 → 用数据说话
└── 防止退化 → 持续保持性能
```

---

## 2 性能监控体系

### 监控维度

| 维度 | 指标 | 工具 |
| --- | --- | --- |
| 加载性能 | LCP, FCP, TTFB | Navigation Timing |
| 交互性能 | INP, FID | Event Timing |
| 视觉稳定性 | CLS | Layout Shift |
| 资源加载 | 资源大小、时间 | Resource Timing |
| 运行时 | 长任务、帧率 | Long Task API |

### 监控数据采集

```javascript
// 性能指标采集
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.init();
  }

  init() {
    // LCP
    new PerformanceObserver((entries) => {
      const last = entries.getEntries().pop();
      this.metrics.lcp = last.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // FID / INP
    new PerformanceObserver((entries) => {
      entries.getEntries().forEach(entry => {
        if (entry.interactionId) {
          const duration = entry.processingStart - entry.startTime;
          this.metrics.inp = Math.max(this.metrics.inp || 0, duration);
        }
      });
    }).observe({ type: 'event', buffered: true, durationThreshold: 16 });

    // CLS
    let clsValue = 0;
    new PerformanceObserver((entries) => {
      entries.getEntries().forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.metrics.cls = clsValue;
        }
      });
    }).observe({ type: 'layout-shift', buffered: true });

    // 页面卸载时上报
    window.addEventListener('pagehide', () => this.report());
  }

  report() {
    navigator.sendBeacon('/api/metrics', JSON.stringify({
      url: location.href,
      ...this.metrics,
      timestamp: Date.now()
    }));
  }
}

new PerformanceMonitor();
```

### 真实用户监控 (RUM)

```javascript
// 采样上报
function shouldReport() {
  // 10% 采样率
  return Math.random() < 0.1;
}

// 分批上报
function reportMetrics(metrics) {
  const data = {
    url: location.href,
    userAgent: navigator.userAgent,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    connection: navigator.connection?.effectiveType,
    ...metrics
  };

  // 使用 sendBeacon 保证页面卸载时发送
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/metrics', JSON.stringify(data));
  } else {
    fetch('/api/metrics', {
      method: 'POST',
      body: JSON.stringify(data),
      keepalive: true
    });
  }
}
```

---

## 3 Lighthouse 性能审计

### 使用方式

```
1. Chrome DevTools
   - 打开 DevTools → Lighthouse
   - 选择审计类别
   - 生成报告

2. CLI
   npm install -g lighthouse
   lighthouse https://example.com

3. PageSpeed Insights
   https://pagespeed.web.dev/
```

### 报告解读

```
Performance 得分：
- 90-100：良好
- 50-89：需改进
- 0-49：差

核心指标：
- FCP：首次内容绘制
- LCP：最大内容绘制
- TBT：总阻塞时间
- CLS：累积布局偏移
- Speed Index：速度指数
```

### 自动化审计

```javascript
// lighthouse-ci
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/'],
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['error', { maxLength: 2500 }]
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-reports'
    }
  }
};
```

---

## 4 Chrome DevTools 性能分析

### Performance 面板

```
使用步骤：
1. 打开 Performance 面板
2. 点击录制按钮
3. 执行要分析的操作
4. 停止录制

分析要点：
- Main 线程：查看长任务
- Frames：帧率是否稳定 60fps
- Network：资源加载瀑布图
```

### 性能时间线

```javascript
// 使用 Performance.mark 和 measure
performance.mark('start-fetch');

fetch('/api/data')
  .then(response => response.json())
  .then(data => {
    performance.mark('end-fetch');
    performance.measure('fetch-data', 'start-fetch', 'end-fetch');

    const measure = performance.getEntriesByName('fetch-data')[0];
    console.log('获取数据耗时:', measure.duration);
  });
```

### Memory 面板

```
堆快照分析：
1. 拍摄堆快照
2. 执行操作
3. 再拍摄快照
4. 对比快照，查找泄漏

关注：
- Detached DOM 节点
- 闭包引用
- 事件监听器
```

---

## 5 性能分析工具

### Web Vitals 扩展

```javascript
// 安装 web-vitals
npm install web-vitals

// 使用
import { onLCP, onFID, onCLS } from 'web-vitals';

onLCP(console.log);
onFID(console.log);
onCLS(console.log);
```

### SpeedCurve

```
功能：
- 真实用户监控
- 合成监控
- 性能预算
- 竞争对比
```

### Calibre

```
功能：
- 多地点测试
- 设备模拟
- 性能趋势
- 团队协作
```

---

## 6 性能预算

### 设定预算

```json
{
  "performanceBudget": {
    "maxAssetSize": {
      "js": 200000,
      "css": 100000,
      "image": 150000,
      "font": 100000
    },
    "maxPageWeight": 1500000,
    "maxRequests": {
      "js": 5,
      "css": 2,
      "image": 20
    },
    "metrics": {
      "LCP": 2500,
      "FID": 100,
      "CLS": 0.1
    }
  }
}
```

### 预算检查

```javascript
// 构建时检查
import { defineConfig } from 'vite';
import { performanceBudget } from 'vite-plugin-budget';

export default defineConfig({
  plugins: [
    performanceBudget({
      maxAssetSize: 250000,
      maxTotalSize: 1500000
    })
  ]
});
```

---

## 7 核心知识点

1. **监控体系**：建立完整的性能指标采集和上报机制
2. **Lighthouse**：定期审计，自动化集成到 CI/CD
3. **DevTools**：Performance 分析帧率，Memory 查找泄漏
4. **性能预算**：设定上限，防止性能退化
5. **RUM vs 合成**：真实用户监控 + 合成监控结合

---

## 下一章预告

下一章我们会学习 **移动端性能优化**——针对手机、平板等移动设备的特殊优化策略。

你会学到：

- 移动端网络优化（弱网、离线）
- 触摸交互优化
- 移动端渲染优化
- PWA 离线支持

移动端是用户访问的主要入口，优化好移动端性能至关重要。
