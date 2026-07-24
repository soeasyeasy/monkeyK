---
title: "第七章：JavaScript 性能优化"
description: "优化 JavaScript 执行效率、内存管理和事件循环"
---

# 第七章：JavaScript 性能优化

## JavaScript 执行流程

```
解析 → 编译 → 执行 → 垃圾回收

V8 引擎优化：
- 即时编译（JIT）
- 内联缓存
- 隐藏类
```

## 减少主线程阻塞

### 长任务拆分

```javascript
// 低效：阻塞主线程
function processData(items) {
  items.forEach(item => {
    // 耗时操作
    heavyComputation(item);
  });
}

// 高效：使用 setTimeout 拆分
function processDataAsync(items) {
  let index = 0;

  function processNext() {
    const batch = items.slice(index, index + 10);
    batch.forEach(item => heavyComputation(item));
    index += 10;

    if (index < items.length) {
      setTimeout(processNext, 0);
    }
  }

  processNext();
}
```

### 使用 requestIdleCallback

```javascript
// 在浏览器空闲时执行非紧急任务
requestIdleCallback((deadline) => {
  while (deadline.timeRemaining() > 0 && tasks.length > 0) {
    processTask(tasks.pop());
  }

  if (tasks.length > 0) {
    requestIdleCallback(processRemaining);
  }
});
```

## 内存管理

### 内存泄漏常见场景

```javascript
// 1. 意外的全局变量
function foo() {
  leaked = 'I am global'; // 忘记声明
}

// 2. 未清理的定时器
const id = setInterval(() => {
  // 永远不会停止
}, 1000);

// 3. 闭包引用
function createHandler() {
  const largeData = new Array(10000);
  return () => {
    // largeData 永远不会被释放
    console.log(largeData.length);
  };
}

// 4. DOM 引用
const element = document.getElementById('app');
// 即使 DOM 被移除，引用仍然存在
```

### 避免内存泄漏

```javascript
// 及时清理定时器
const id = setInterval(update, 1000);
clearInterval(id); // 不再需要时清理

// 使用 WeakMap / WeakSet
const cache = new WeakMap();
function process(obj) {
  if (cache.has(obj)) return cache.get(obj);
  const result = /* 计算 */;
  cache.set(obj, result);
  return result;
}
// obj 被垃圾回收时，缓存自动清理

// 事件监听器清理
class Component {
  constructor() {
    this.handler = this.handleClick.bind(this);
    button.addEventListener('click', this.handler);
  }

  destroy() {
    button.removeEventListener('click', this.handler);
  }
}
```

## 事件循环优化

### 理解事件循环

```
执行栈 → 微任务 → 宏任务 → 渲染

微任务：Promise.then, queueMicrotask, MutationObserver
宏任务：setTimeout, setInterval, I/O, UI 渲染
```

### 微任务 vs 宏任务

```javascript
// 微任务优先级高于宏任务
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('promise'));
// 输出：promise → timeout

// 使用微任务处理高优先级更新
queueMicrotask(() => {
  // 在下一次渲染前执行
  updateUI();
});
```

### 避免长微任务

```javascript
// 低效：微任务阻塞渲染
Promise.resolve().then(() => {
  // 大量同步操作
  for (let i = 0; i < 1000000; i++) {
    process(i);
  }
});

// 高效：让出主线程
async function processInChunks(items) {
  for (let i = 0; i < items.length; i++) {
    process(items[i]);
    if (i % 100 === 0) {
      await new Promise(r => setTimeout(r, 0));
    }
  }
}
```

## 数据结构优化

### 选择合适的数据结构

```javascript
// 查找操作：Map vs Object
const map = new Map();
map.set('key', value);
map.get('key'); // O(1)

const obj = {};
obj['key'] = value;
obj['key']; // O(1)，但原型链查找

// 频繁插入删除：Map 优于 Object
// 有序遍历：Map 保持插入顺序

// 集合操作：Set
const unique = new Set([1, 1, 2, 2, 3]); // [1, 2, 3]
```

### 数组优化

```javascript
// 预分配数组长度
const arr = new Array(1000);
for (let i = 0; i < 1000; i++) {
  arr[i] = i;
}

// 避免稀疏数组
const sparse = [];
sparse[1000] = 'value'; // 不推荐

// 使用 TypedArray 处理数值
const buffer = new ArrayBuffer(1024);
const int32View = new Int32Array(buffer);
```

## 函数优化

### 减少函数调用

```javascript
// 低效：循环内函数调用
for (let i = 0; i < 1000; i++) {
  element.style.color = getColor(i);
}

// 高效：缓存函数引用
const getColor = (i) => colors[i % colors.length];
const setColor = (color) => element.style.color = color;
for (let i = 0; i < 1000; i++) {
  setColor(getColor(i));
}
```

### 防抖与节流

```javascript
// 防抖：停止触发后执行
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 节流：固定间隔执行
function throttle(fn, interval) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

// 使用场景
window.addEventListener('resize', debounce(handleResize, 200));
window.addEventListener('scroll', throttle(handleScroll, 100));
```

## Web Workers

### 基本使用

```javascript
// main.js
const worker = new Worker('worker.js');

worker.postMessage({ type: 'START', data: largeDataset });

worker.onmessage = (event) => {
  console.log('结果:', event.data);
};

// worker.js
self.onmessage = (event) => {
  if (event.data.type === 'START') {
    const result = heavyComputation(event.data.data);
    self.postMessage(result);
  }
};
```

### 适用场景

```
适合 Web Worker 的任务：
- 大量数据计算
- 图片/视频处理
- 加密/解密
- 数据排序/搜索
- JSON 解析大文件

不适合的场景：
- DOM 操作
- 需要频繁与主线程通信
- 简单计算
```

## 核心知识点

1. **主线程保护**：长任务拆分，避免阻塞渲染
2. **内存管理**：及时清理定时器、事件监听器，使用 WeakMap
3. **事件循环**：理解微任务/宏任务，合理使用 queueMicrotask
4. **数据结构**：选择合适的数据结构，预分配数组
5. **Web Workers**：将计算密集型任务移出主线程
