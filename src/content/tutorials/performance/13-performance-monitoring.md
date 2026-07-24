---
title: "第十三章：性能监控与分析"
description: "建立性能监控体系，使用 Lighthouse 和性能分析工具"
---

# 第十三章：性能监控与分析

## 性能监控体系

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

## Lighthouse

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

## Chrome DevTools

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

## 性能分析工具

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

## 性能预算

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

## 核心知识点

1. **监控体系**：建立完整的性能指标采集和上报机制
2. **Lighthouse**：定期审计，自动化集成到 CI/CD
3. **DevTools**：Performance 分析帧率，Memory 查找泄漏
4. **性能预算**：设定上限，防止性能退化
5. **RUM vs 合成**：真实用户监控 + 合成监控结合
