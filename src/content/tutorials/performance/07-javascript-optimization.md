---
title: "第七章：JavaScript 性能优化"
description: "掌握 JavaScript 加载优化、执行优化、内存管理"
---

# 第七章：JavaScript 性能优化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- defer 和 async 到底有什么区别？
- 页面卡顿（掉帧）是什么原因？怎么排查？
- 防抖和节流什么时候用？
- 什么是长任务？怎么避免？

这一章就是为了解答这些问题。JavaScript 是性能优化的重灾区，优化好了能显著提升页面流畅度。

---

## 1 为什么需要 JavaScript 性能优化？

### 痛点分析

你可能遇到过这些问题：

- 页面加载白屏，JS 加载太慢
- 滚动、点击时页面卡顿
- 内存越用越大，最后浏览器崩溃
- 打包体积太大，用户等不及

打个比方：

> JS 优化就像管理厨房：
> - 加载优化 = 食材采购，分批进货不要一次堆满
> - 执行优化 = 做菜流程，合理安排先后顺序
> - 内存管理 = 厨房清洁，用完及时清理
> - 代码分割 = 菜谱分类，按需取用

---

## 2 JavaScript 加载优化

### defer vs async

```html
<!-- ❌ 默认：阻塞 DOM 解析 -->
<script src="app.js"></script>

<!-- ✅ defer：DOM 解析完后按顺序执行 -->
<script defer src="app.js"></script>

<!-- ✅ async：加载完立即执行，不保证顺序 -->
<script async src="analytics.js"></script>
```

| 属性 | 下载 | 执行时机 | 执行顺序 | 适用场景 |
| --- | --- | --- | --- | --- |
| 无 | 阻塞 | 立即 | 按顺序 | 不推荐 |
| defer | 异步 | DOM 解析完后 | 按顺序 | 依赖 DOM 的脚本 |
| async | 异步 | 下载完立即执行 | 不保证 | 独立脚本（统计） |

### 动态创建 script

```javascript
// ✅ 动态加载脚本，不阻塞页面
function loadScript(url) {
  // 创建 script 元素
  const script = document.createElement('script');
  // 设置 src
  script.src = url;
  // 异步加载
  script.async = true;
  // 插入到 head
  document.head.appendChild(script);
}

// 使用
loadScript('https://cdn.example.com/lib.js');
```

---

## 3 代码分割与懒加载

### 动态 import

```javascript
// ✅ 按需加载模块
button.addEventListener('click', async () => {
  // 用户点击时才加载
  const { openModal } = await import('./modal.js');
  openModal();
});
```

### 路由级分割

```javascript
// Vue Router
const routes = [
  {
    path: '/dashboard',
    // 访问时才加载 Dashboard 组件
    component: () => import('./views/Dashboard.vue')
  },
  {
    path: '/settings',
    component: () => import('./views/Settings.vue')
  }
];
```

### 组件级分割

```javascript
// Vue 异步组件
import { defineAsyncComponent } from 'vue';

// 只在需要时才加载
const HeavyChart = defineAsyncComponent(() =>
  import('./components/HeavyChart.vue')
);
```

---

## 4 防抖与节流

### 防抖（Debounce）

用户停止操作后才执行。

```javascript
// 防抖函数
function debounce(fn, delay = 300) {
  // 定时器变量
  let timer = null;

  // 返回包装后的函数
  return function (...args) {
    // 清除之前的定时器
    if (timer) clearTimeout(timer);
    // 设置新的定时器
    timer = setTimeout(() => {
      // 延迟后执行原函数
      fn.apply(this, args);
    }, delay);
  };
}

// 使用：搜索框输入
const searchInput = document.getElementById('search');
searchInput.addEventListener('input', debounce((e) => {
  console.log('搜索:', e.target.value);
  // 发起搜索请求
}, 500));
```

打个比方：

> 防抖就像电梯关门：有人进来就重新计时，等没人了才关门。

### 节流（Throttle）

固定时间间隔执行一次。

```javascript
// 节流函数
function throttle(fn, interval = 300) {
  // 上次执行时间
  let lastTime = 0;

  // 返回包装后的函数
  return function (...args) {
    // 当前时间
    const now = Date.now();
    // 判断是否超过间隔时间
    if (now - lastTime >= interval) {
      // 更新上次执行时间
      lastTime = now;
      // 执行原函数
      fn.apply(this, args);
    }
  };
}

// 使用：滚动事件
window.addEventListener('scroll', throttle(() => {
  console.log('滚动位置:', window.scrollY);
  // 更新 UI
}, 200));
```

打个比方：

> 节流就像水龙头：不管你怎么拧，水只能一滴一滴按固定速度流。

### 对比

| 特性 | 防抖 | 节流 |
| --- | --- | --- |
| 执行时机 | 停止操作后 | 固定间隔 |
| 适用场景 | 搜索输入、窗口调整 | 滚动监听、按钮点击 |
| 执行频率 | 很低 | 固定 |

---

## 5 避免长任务

### 什么是长任务？

超过 50ms 的 JavaScript 执行任务会阻塞主线程，导致页面卡顿。

```
主线程时间线：
├── 用户点击（等待 JS 执行完才能响应）
├── JS 执行 200ms（长任务，阻塞）
├── 样式计算
├── 布局
└── 绘制
```

### 任务拆分

```javascript
// ❌ 差：一次性处理 10000 条数据
function processData(data) {
  for (let i = 0; i < data.length; i++) {
    // 耗时操作
    heavyComputation(data[i]);
  }
}

// ✅ 好：分批处理，让出主线程
async function processData(data) {
  const chunkSize = 100; // 每批处理 100 条

  for (let i = 0; i < data.length; i += chunkSize) {
    // 处理一批
    const chunk = data.slice(i, i + chunkSize);
    chunk.forEach(item => heavyComputation(item));

    // 让出主线程，让浏览器处理其他任务
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

### 使用 requestIdleCallback

```javascript
// ✅ 在浏览器空闲时执行非紧急任务
function scheduleWork(callback) {
  if ('requestIdleCallback' in window) {
    // 浏览器空闲时执行
    requestIdleCallback((deadline) => {
      // deadline.timeRemaining() 返回剩余空闲时间
      while (deadline.timeRemaining() > 0 && tasks.length > 0) {
        processTask(tasks.shift());
      }
      // 还有任务就继续调度
      if (tasks.length > 0) scheduleWork(callback);
    });
  } else {
    // 降级方案
    setTimeout(callback, 1);
  }
}
```

---

## 6 Web Workers

### 基本用法

```javascript
// ✅ 将耗时计算放到 Worker 线程

// 主线程
const worker = new Worker('worker.js');

// 发送数据给 Worker
worker.postMessage({ numbers: [1, 2, 3, 4, 5] });

// 接收 Worker 的结果
worker.onmessage = (event) => {
  console.log('计算结果:', event.data.sum);
};

// worker.js（独立文件）
self.onmessage = (event) => {
  const { numbers } = event.data;
  // 耗时计算
  const sum = numbers.reduce((a, b) => a + b, 0);
  // 返回结果
  self.postMessage({ sum });
};
```

### 使用场景

```
适合放到 Worker 的任务：
├── 大数据排序/过滤
├── 图片处理（Canvas）
├── JSON 解析大文件
├── 加密/解密
└── 复杂数学计算
```

---

## 7 内存管理

### 常见内存泄漏

```javascript
// ❌ 1. 未清理的定时器
setInterval(() => {
  updateUI();
}, 1000);
// 组件销毁后定时器还在跑

// ✅ 修复：保存定时器 ID，及时清理
const timerId = setInterval(() => {
  updateUI();
}, 1000);
clearInterval(timerId);

// ❌ 2. 未移除的事件监听器
window.addEventListener('resize', handleResize);
// 组件销毁后监听器还在

// ✅ 修复：销毁时移除
window.addEventListener('resize', handleResize);
window.removeEventListener('resize', handleResize);

// ❌ 3. 闭包引用大对象
function createHandler() {
  const bigData = new Array(1000000); // 大数组
  return () => {
    // 闭包引用了 bigData，无法回收
    console.log(bigData.length);
  };
}

// ✅ 修复：释放不需要的引用
function createHandler() {
  let bigData = new Array(1000000);
  const result = bigData.length; // 只保留需要的数据
  bigData = null; // 释放引用
  return () => {
    console.log(result);
  };
}
```

### 使用 WeakMap / WeakRef

```javascript
// ✅ 使用 WeakMap 避免内存泄漏
const elementData = new WeakMap();

function initElement(el) {
  // 关联数据，el 被删除后数据自动回收
  elementData.set(el, { count: 0 });
}

// ✅ 使用 WeakRef（现代浏览器）
const weakRef = new WeakRef(largeObject);
// 访问对象
if (weakRef.deref()) {
  weakRef.deref().doSomething();
}
```

---

## 8 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| defer | DOM 解析完后按顺序执行，适合依赖 DOM 的脚本 |
| async | 加载完立即执行，不保证顺序，适合独立脚本 |
| 代码分割 | 按路由、组件、交互分割，减少初始体积 |
| 防抖 | 停止操作后执行，适合搜索输入 |
| 节流 | 固定间隔执行，适合滚动监听 |
| 长任务 | 超过 50ms 的任务会阻塞主线程 |
| Web Workers | 将耗时计算放到独立线程 |
| 内存泄漏 | 及时清理定时器、事件监听器、闭包引用 |

---

## 9 新手常见误区

### 误区 1："async 和 defer 一样"

**错！** 两者执行时机和顺序保证完全不同。

**正确做法**：

1. `defer`：保证顺序，DOM 解析完后执行，适合有依赖的脚本
2. `async`：不保证顺序，下载完立即执行，适合独立脚本（统计、广告）

### 误区 2："防抖和节流一样"

**错！** 防抖是停止后执行，节流是固定间隔执行。

**正确做法**：

1. 搜索输入用防抖（停止输入后才搜索）
2. 滚动监听用节流（固定频率更新 UI）

### 误区 3："所有计算都放主线程"

**错！** 耗时计算会阻塞渲染，导致页面卡顿。

**正确做法**：

1. 大数据处理放到 Web Worker
2. 长任务拆分成多个短任务
3. 使用 requestIdleCallback 处理非紧急任务

### 误区 4："JavaScript 不需要管内存"

**错！** 内存泄漏会导致页面越来越慢，最终崩溃。

**正确做法**：

1. 组件销毁时清理定时器和事件监听器
2. 使用 WeakMap/WeakRef 管理关联数据
3. 用 DevTools Memory 面板定期检查

---

## 10 动手练习

### 练习 1：基础练习 - defer 和 async

**题目**：为以下脚本选择合适的加载方式。

```html
<!-- 场景 1：应用主逻辑，依赖 DOM -->
<script src="app.js"></script>

<!-- 场景 2：统计脚本，独立运行 -->
<script src="analytics.js"></script>

<!-- 场景 3：主题切换，依赖 app.js -->
<script src="theme.js"></script>
```

<details>
<summary>点击查看答案</summary>

```html
<!-- 场景 1：使用 defer（依赖 DOM，需要保证顺序） -->
<script defer src="app.js"></script>

<!-- 场景 2：使用 async（独立脚本，不需要保证顺序） -->
<script async src="analytics.js"></script>

<!-- 场景 3：使用 defer（依赖 app.js，defer 保证顺序） -->
<script defer src="theme.js"></script>
```

**说明**：

- `app.js` 和 `theme.js` 都用 `defer`，保证按顺序执行
- `analytics.js` 用 `async`，独立加载不阻塞

</details>

### 练习 2：进阶练习 - 实现防抖函数

**题目**：实现一个带立即执行选项的防抖函数。

<details>
<summary>点击查看答案</summary>

```javascript
// 支持立即执行的防抖函数
function debounce(fn, delay = 300, immediate = false) {
  let timer = null;

  return function (...args) {
    // 立即执行模式
    if (immediate && !timer) {
      fn.apply(this, args);
    }

    // 清除之前的定时器
    if (timer) clearTimeout(timer);

    // 设置新的定时器
    timer = setTimeout(() => {
      // 非立即执行模式，或第二次及以后的调用
      if (!immediate) {
        fn.apply(this, args);
      }
      // 重置定时器
      timer = null;
    }, delay);
  };
}

// 使用：搜索框，第一次立即执行，后续防抖
const search = debounce((value) => {
  console.log('搜索:', value);
}, 500, true);

search('第一次'); // 立即执行
search('第二次'); // 防抖
search('第三次'); // 防抖，500ms 后执行
```

</details>

### 练习 3（挑战）：综合练习 - 长任务拆分

**题目**：将以下长任务拆分为多个短任务。

```javascript
// 长任务：处理 10000 条数据
function processData(data) {
  const results = [];
  for (let i = 0; i < data.length; i++) {
    // 每条数据处理耗时 1ms
    results.push(heavyComputation(data[i]));
  }
  return results;
}
```

<details>
<summary>点击查看答案</summary>

```javascript
// ✅ 方案 1：使用 setTimeout 拆分
async function processData(data) {
  const results = [];
  const chunkSize = 50; // 每批 50 条

  for (let i = 0; i < data.length; i += chunkSize) {
    // 处理一批
    const chunk = data.slice(i, i + chunkSize);
    chunk.forEach(item => {
      results.push(heavyComputation(item));
    });

    // 让出主线程
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return results;
}

// ✅ 方案 2：使用 requestIdleCallback
function processDataIdle(data, callback) {
  const results = [];
  let index = 0;
  const chunkSize = 50;

  function work(deadline) {
    // 在空闲时间内处理
    while ((deadline?.timeRemaining() > 0 || !deadline) &&
           index < data.length) {
      const end = Math.min(index + chunkSize, data.length);
      for (let i = index; i < end; i++) {
        results.push(heavyComputation(data[i]));
      }
      index = end;
    }

    // 还有数据就继续
    if (index < data.length) {
      requestIdleCallback(work);
    } else {
      callback(results);
    }
  }

  requestIdleCallback(work);
}

// 使用
processDataIdle(hugeData, (results) => {
  console.log('处理完成:', results.length);
});
```

</details>

---

## 下一章预告

下一章我们会学习 **渲染性能优化**——也就是如何让页面动画流畅、减少卡顿。

你会学到：

- 60fps 的目标和实现
- 合成层和图层提升
- 虚拟列表的实现
- requestAnimationFrame 的用法
