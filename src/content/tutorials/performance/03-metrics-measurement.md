---
title: "第三章：性能指标与测量"
description: "掌握核心性能指标体系，学会使用工具测量性能"
---

# 第三章：性能指标与测量

## 本章导读

在学这一章之前，你可能会有这些疑问：

- LCP、FCP、CLS 这些指标到底是什么意思？
- 多少算好？多少算差？标准是什么？
- 用什么工具来测量这些指标？
- 怎么在自己的项目里持续监控性能？

这一章就是为了解答这些问题。我们会从 **核心指标** 讲起，再教你 **怎么用工具测量**，最后帮你建立 **性能监控体系**。

---

## 1 为什么需要性能指标？

### 痛点分析

你可能遇到过这些问题：

- "页面感觉有点慢"——但到底多慢？慢在哪里？
- "优化了一下"——但怎么证明优化有效？
- "用户说卡"——但卡的是什么操作？

打个比方：

> 没有指标的性能优化，就像没有秤的减肥——你说瘦了，但到底瘦了多少？用数据说话，才知道方向对不对、效果好不好。

### 解决方案

| 有了指标后 | 你能做到 |
| --- | --- |
| 量化性能 | 用数字描述页面快慢 |
| 定位问题 | 找到具体慢在哪里 |
| 验证效果 | 对比优化前后数据 |
| 持续监控 | 发现性能退化及时报警 |

> **一句话总结**：没有测量就没有优化，指标是性能优化的指南针。

---

## 2 Core Web Vitals（核心网页指标）

Google 定义了三组核心指标，直接影响搜索排名。

### LCP - 最大内容绘制

Largest Contentful Paint，衡量 **加载性能**——页面主要内容多久能显示出来。

打个比方：

> LCP 就像去餐厅吃饭，从坐下到主菜端上来的时间。等太久你会不耐烦。

| 评级 | 时间 | 说明 |
| --- | --- | --- |
| 良好 | <= 2.5s | 用户感觉流畅 |
| 需改进 | 2.5s - 4.0s | 用户开始不耐烦 |
| 差 | > 4.0s | 用户可能离开 |

```javascript
// 使用 PerformanceObserver 测量 LCP
// LCP 通常是最大的图片或文本块
new PerformanceObserver((entryList) => {
  // 获取所有 LCP 条目
  const entries = entryList.getEntries();
  // 最后一个就是 LCP（最大的内容）
  const lastEntry = entries[entries.length - 1];
  // 输出 LCP 时间
  console.log('LCP:', lastEntry.startTime);
}).observe({ type: 'largest-contentful-paint', buffered: true });
```

### INP - 交互到下一帧绘制

Interaction to Next Paint，衡量 **交互响应性**——用户操作后多久页面有反馈。

> 旧版指标 FID（First Input Delay）已被 INP 取代。

打个比方：

> INP 就像按电梯按钮后，指示灯多久亮。等太久你会怀疑按钮是不是坏了。

| 评级 | INP 时间 | 说明 |
| --- | --- | --- |
| 良好 | <= 200ms | 感觉即时响应 |
| 需改进 | 200ms - 500ms | 能感知到延迟 |
| 差 | > 500ms | 感觉卡住了 |

```javascript
// 测量 INP
new PerformanceObserver((entryList) => {
  const entries = entryList.getEntries();
  entries.forEach((entry) => {
    // 只关注有交互 ID 的条目
    if (entry.interactionId) {
      // 交互延迟 = 开始处理时间 - 事件触发时间
      const delay = entry.processingStart - entry.startTime;
      console.log('交互延迟:', delay);
    }
  });
}).observe({ type: 'event', buffered: true, durationThreshold: 16 });
```

### CLS - 累积布局偏移

Cumulative Layout Shift，衡量 **视觉稳定性**——页面元素是否意外跳动。

打个比方：

> CLS 就像看报纸，如果文字和图片一直跳来跳去，你根本没法阅读。

| 评级 | CLS 值 | 说明 |
| --- | --- | --- |
| 良好 | <= 0.1 | 几乎不跳动 |
| 需改进 | 0.1 - 0.25 | 偶尔跳动 |
| 差 | > 0.25 | 频繁跳动，影响阅读 |

```javascript
// 测量 CLS
let clsValue = 0; // 累计偏移值
new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    // 排除用户主动操作导致的偏移
    if (!entry.hadRecentInput) {
      clsValue += entry.value; // 累加每次偏移
      console.log('当前 CLS:', clsValue);
    }
  }
}).observe({ type: 'layout-shift', buffered: true });
```

---

## 3 其他重要指标

| 指标 | 全称 | 衡量什么 | 良好标准 |
| --- | --- | --- | --- |
| FCP | First Contentful Paint | 首次绘制任何内容 | <= 1.8s |
| TTFB | Time to First Byte | 服务器响应速度 | <= 800ms |
| TTI | Time to Interactive | 页面可交互时间 | <= 3.8s |
| SI | Speed Index | 页面填充速度 | <= 3.4s |

### FCP - 首次内容绘制

浏览器首次绘制任何内容（文字、图片、canvas）的时间。

```
FCP 和 LCP 的区别：
├── FCP：第一个内容出现（可能是 loading 动画）
└── LCP：主要内容出现（通常是 hero 图片或标题）
```

### TTFB - 首字节时间

从发起请求到收到第一个字节的时间，反映服务器响应速度。

```
TTFB 组成：
├── DNS 查询
├── TCP 连接
├── TLS 协商
└── 服务器处理时间
```

---

## 4 测量工具

### Chrome DevTools - Performance 面板

```
使用步骤：
1. 打开 DevTools（F12）→ Performance
2. 点击录制按钮（圆形图标）
3. 执行要测量的操作（如点击按钮、滚动页面）
4. 停止录制，分析结果

关注指标：
├── Scripting：JavaScript 执行时间（紫色）
├── Rendering：样式计算、布局时间（绿色）
├── Painting：绘制时间（青色）
└── FPS：帧率（绿色条形，越高越好）
```

### Chrome DevTools - Lighthouse

```
使用步骤：
1. 打开 DevTools（F12）→ Lighthouse
2. 选择要审计的类别（Performance、SEO 等）
3. 点击"生成报告"

报告内容：
├── Performance 得分（0-100）
├── Core Web Vitals
├── 具体优化建议
└── 通过/未通过的审计项
```

### WebPageTest

在线性能测试工具，提供更详细的分析。

```
功能特点：
├── 多地点测试（全球节点）
├── 真实设备测试
├── 视频录制页面加载过程
├── 详细的瀑布图
└── 竞品对比
```

### Performance API

浏览器原生 API，可以自定义测量。

```javascript
// 标记起点
performance.mark('start-fetch');

// 执行操作（如请求数据）
fetch('/api/data')
  .then(response => response.json())
  .then(data => {
    // 标记终点
    performance.mark('end-fetch');
    // 测量两点之间的耗时
    performance.measure('fetch-data', 'start-fetch', 'end-fetch');

    // 获取测量结果
    const measure = performance.getEntriesByName('fetch-data')[0];
    console.log('获取数据耗时:', measure.duration, 'ms');
  });
```

### Navigation Timing API

获取页面加载各阶段的耗时。

```javascript
// 获取页面导航的计时信息
const timing = performance.getEntriesByType('navigation')[0];

// DNS 查询耗时
console.log('DNS 查询:', timing.domainLookupEnd - timing.domainLookupStart, 'ms');
// TCP 连接耗时
console.log('TCP 连接:', timing.connectEnd - timing.connectStart, 'ms');
// 首字节时间
console.log('TTFB:', timing.responseStart - timing.requestStart, 'ms');
// DOM 解析耗时
console.log('DOM 解析:', timing.domComplete - timing.domInteractive, 'ms');
```

### Resource Timing API

获取每个资源的加载详情。

```javascript
// 获取所有资源的计时信息
const resources = performance.getEntriesByType('resource');

resources.forEach((resource) => {
  console.log('资源:', resource.name);          // 资源 URL
  console.log('加载耗时:', resource.duration);   // 总耗时
  console.log('传输大小:', resource.transferSize); // 字节数
});
```

---

## 5 使用 web-vitals 库

Google 提供的官方库，简化指标测量。

```javascript
// 安装：npm install web-vitals
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

// 测量 LCP
onLCP((metric) => {
  console.log('LCP:', metric.value, 'ms');
});

// 测量 INP
onINP((metric) => {
  console.log('INP:', metric.value, 'ms');
});

// 测量 CLS
onCLS((metric) => {
  console.log('CLS:', metric.value);
});

// 测量 FCP
onFCP((metric) => {
  console.log('FCP:', metric.value, 'ms');
});

// 测量 TTFB
onTTFB((metric) => {
  console.log('TTFB:', metric.value, 'ms');
});
```

---

## 6 建立性能监控

### 客户端埋点

```javascript
// 性能数据上报
function reportMetrics(metrics) {
  const data = {
    url: location.href,                          // 页面 URL
    userAgent: navigator.userAgent,              // 设备信息
    connection: navigator.connection?.effectiveType, // 网络类型
    ...metrics,                                  // 性能指标
    timestamp: Date.now()                        // 时间戳
  };

  // 使用 sendBeacon 保证页面卸载时也能发送
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/metrics', JSON.stringify(data));
  } else {
    // 降级方案：使用 fetch keepalive
    fetch('/api/metrics', {
      method: 'POST',
      body: JSON.stringify(data),
      keepalive: true  // 页面关闭后继续发送
    });
  }
}
```

### 性能预算检查

```javascript
// 设定性能预算
const BUDGET = {
  maxLCP: 2500,         // LCP 不超过 2.5s
  maxCLS: 0.1,          // CLS 不超过 0.1
  maxJS: 200 * 1024     // JS 总大小不超过 200KB
};

// 检查 JS 体积是否超标
function checkBudget() {
  // 获取所有 JS 资源
  const jsResources = performance.getEntriesByType('resource')
    .filter(r => r.name.endsWith('.js'));

  // 计算 JS 总体积
  const jsSize = jsResources.reduce((sum, r) => sum + r.transferSize, 0);

  // 检查是否超出预算
  if (jsSize > BUDGET.maxJS) {
    console.warn('JS 体积超出预算:', (jsSize / 1024).toFixed(1) + 'KB');
  }
}
```

---

## 7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| Core Web Vitals | LCP（加载）、INP（交互）、CLS（稳定） |
| 其他指标 | FCP、TTFB、TTI、SI |
| DevTools | Performance 面板分析帧率，Lighthouse 审计 |
| Performance API | 自定义测量，精确到毫秒 |
| web-vitals | Google 官方库，简化指标测量 |
| 性能监控 | 埋点上报、预算检查、持续跟踪 |

---

## 8 新手常见误区

### 误区 1："Lighthouse 得分高就代表性能好"

**错！** Lighthouse 是合成测试（实验室环境），不能完全反映真实用户的体验。

**正确做法**：

1. Lighthouse 作为参考，但不是唯一标准
2. 结合真实用户监控（RUM）数据
3. 在不同设备和网络条件下测试

### 误区 2："只看平均值"

**错！** 平均值会掩盖极端情况。P75（第 75 百分位）更有参考价值。

**正确做法**：

1. 关注 P75 而非平均值
2. 分析不同设备、网络的分布
3. 关注长尾用户的体验

### 误区 3："CLS 只和图片有关"

**错！** 字体加载、动态广告、延迟注入的内容都可能导致 CLS。

**正确做法**：

1. 图片/视频设置明确的宽高
2. 字体使用 `font-display: swap`
3. 避免动态插入内容到视口内

### 误区 4："性能指标只需要看一次"

**错！** 每次发版都可能引入性能退化，需要持续监控。

**正确做法**：

1. 将性能测试集成到 CI/CD
2. 设定性能预算，超标时报警
3. 定期回顾性能趋势

---

## 9 动手练习

### 练习 1：基础练习 - Lighthouse 审计

**题目**：打开 Chrome DevTools，对任意网站进行 Lighthouse 审计，记录 Performance 得分和 Core Web Vitals。

<details>
<summary>点击查看答案</summary>

**操作步骤**：

1. 打开 Chrome，访问目标网站
2. 按 F12 打开 DevTools
3. 切换到 Lighthouse 面板
4. 勾选 "Performance"
5. 点击 "Analyze page load"

**记录模板**：

```
网站：example.com
Performance 得分：72
├── FCP：1.8s（良好）
├── LCP：3.2s（需改进）
├── TBT：350ms（需改进）
├── CLS：0.15（需改进）
└── SI：3.1s（需改进）
```

</details>

### 练习 2：进阶练习 - Performance API 测量

**题目**：使用 Performance API 测量一个 API 请求的耗时。

<details>
<summary>点击查看答案</summary>

```javascript
// 标记起点
performance.mark('api-start');

// 发起请求
fetch('https://jsonplaceholder.typicode.com/posts/1')
  .then(response => response.json())
  .then(data => {
    // 标记终点
    performance.mark('api-end');

    // 测量耗时
    performance.measure('api-request', 'api-start', 'api-end');

    // 获取结果
    const measure = performance.getEntriesByName('api-request')[0];
    console.log('API 请求耗时:', measure.duration.toFixed(2), 'ms');
    console.log('返回数据:', data);
  });
```

</details>

### 练习 3（挑战）：综合练习 - 性能监控脚本

**题目**：编写一个完整的性能监控脚本，采集 LCP、CLS、FID 并上报。

<details>
<summary>点击查看答案</summary>

```javascript
// 性能监控类
class PerformanceMonitor {
  constructor() {
    // 存储指标数据
    this.metrics = {};
    // 初始化监控
    this.init();
  }

  init() {
    // 监控 LCP
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // 监控 CLS
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.metrics.cls = clsValue;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });

    // 监控 FID（兼容旧指标）
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        this.metrics.fid = entry.processingStart - entry.startTime;
      });
    }).observe({ type: 'first-input', buffered: true });

    // 页面卸载时上报数据
    window.addEventListener('pagehide', () => this.report());
  }

  report() {
    // 组装上报数据
    const data = {
      url: location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      ...this.metrics
    };

    console.log('性能数据:', data);

    // 使用 sendBeacon 上报
    navigator.sendBeacon('/api/metrics', JSON.stringify(data));
  }
}

// 启动监控
new PerformanceMonitor();
```

</details>

---

## 下一章预告

下一章我们会学习 **资源加载优化**——也就是如何让资源在正确的时间、以正确的顺序加载。

你会学到：

- preload、prefetch、preconnect 的区别和用法
- 资源优先级控制（fetchpriority）
- 图片懒加载的实现
- 代码分割的策略
