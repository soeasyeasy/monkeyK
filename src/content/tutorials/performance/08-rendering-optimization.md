---
title: "第八章：渲染性能优化"
description: "虚拟列表、时间切片、Web Workers 等高级渲染优化技术"
---

# 第八章：渲染性能优化

## 渲染性能挑战

当页面需要处理大量 DOM 元素或复杂动画时，容易出现：

| 问题 | 表现 |
| --- | --- |
| 卡顿 | 帧率低于 60fps |
| 掉帧 | 动画不流畅 |
| 输入延迟 | 用户操作响应慢 |

## 虚拟列表

### 原理

只渲染视口内的元素，大幅减少 DOM 节点数量。

```
10000 条数据：
- 普通渲染：10000 个 DOM 节点
- 虚拟列表：约 20 个 DOM 节点（视口内 + 缓冲区）
```

### 简单实现

```javascript
class VirtualList {
  constructor(container, itemHeight, totalItems, renderItem) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.totalItems = totalItems;
    this.renderItem = renderItem;

    this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2;
    this.buffer = 5;

    this.container.style.overflow = 'auto';
    this.container.style.position = 'relative';

    // 占位元素
    this.spacer = document.createElement('div');
    this.spacer.style.height = `${totalItems * itemHeight}px`;
    this.container.appendChild(this.spacer);

    // 内容容器
    this.content = document.createElement('div');
    this.content.style.position = 'absolute';
    this.content.style.top = '0';
    this.content.style.left = '0';
    this.content.style.width = '100%';
    this.container.appendChild(this.content);

    this.container.addEventListener('scroll', () => this.render());
    this.render();
  }

  render() {
    const scrollTop = this.container.scrollTop;
    const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);
    const endIndex = Math.min(this.totalItems, startIndex + this.visibleCount + this.buffer * 2);

    this.content.style.transform = `translateY(${startIndex * this.itemHeight}px)`;

    const fragment = document.createDocumentFragment();
    for (let i = startIndex; i < endIndex; i++) {
      fragment.appendChild(this.renderItem(i));
    }

    this.content.innerHTML = '';
    this.content.appendChild(fragment);
  }
}
```

### Vue 虚拟列表组件

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const props = defineProps<{
  items: any[];
  itemHeight: number;
}>();

const container = ref<HTMLElement>();
const scrollTop = ref(0);
const containerHeight = ref(0);

const visibleRange = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight);
  const visibleCount = Math.ceil(containerHeight.value / props.itemHeight) + 2;
  return {
    start: Math.max(0, start - 5),
    end: Math.min(props.items.length, start + visibleCount + 5)
  };
});

const visibleItems = computed(() => {
  const { start, end } = visibleRange.value;
  return props.items.slice(start, end).map((item, index) => ({
    ...item,
    index: start + index
  }));
});

const totalHeight = computed(() => props.items.length * props.itemHeight);
const offsetY = computed(() => visibleRange.value.start * props.itemHeight);

function handleScroll(e: Event) {
  scrollTop.value = (e.target as HTMLElement).scrollTop;
}

onMounted(() => {
  containerHeight.value = container.value!.clientHeight;
});
</script>

<template>
  <div ref="container" class="virtual-list" @scroll="handleScroll">
    <div class="spacer" :style="{ height: totalHeight + 'px' }">
      <div class="content" :style="{ transform: `translateY(${offsetY}px)` }">
        <div v-for="item in visibleItems" :key="item.index" class="item">
          <slot :item="item" :index="item.index" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.virtual-list {
  overflow: auto;
  height: 100%;
  position: relative;
}
.spacer { position: relative; }
.content { position: absolute; top: 0; left: 0; width: 100%; }
.item { height: v-bind('props.itemHeight + "px"'); }
</style>
```

## 时间切片

### 原理

将长任务拆分为多个短任务，在帧之间执行，避免阻塞渲染。

```javascript
// 时间切片处理大量数据
async function processWithTimeSlicing(items, processItem) {
  const chunkSize = 10; // 每帧处理的项数
  let index = 0;

  function processChunk(deadline) {
    while ((deadline.timeRemaining() > 0 || deadline.didTimeout) && index < items.length) {
      processItem(items[index]);
      index++;
    }

    if (index < items.length) {
      requestIdleCallback(processChunk);
    }
  }

  requestIdleCallback(processChunk, { timeout: 1000 });
}
```

### 使用 setTimeout 切片

```javascript
function processInChunks(items, chunkSize = 10) {
  let index = 0;

  function processChunk() {
    const end = Math.min(index + chunkSize, items.length);

    for (let i = index; i < end; i++) {
      process(items[i]);
    }

    index = end;

    if (index < items.length) {
      setTimeout(processChunk, 0);
    }
  }

  processChunk();
}
```

## Web Workers 深入

### 通信方式

```javascript
// 基础消息传递
// main.js
const worker = new Worker('worker.js');
worker.postMessage({ data: 'hello' });
worker.onmessage = (e) => console.log(e.data);

// worker.js
self.onmessage = (e) => {
  self.postMessage('received: ' + e.data.data);
};

// Transferable Objects（零拷贝）
const buffer = new ArrayBuffer(1024);
worker.postMessage({ data: buffer }, [buffer]);
// buffer 现在在主线程不可用
```

### SharedArrayBuffer

```javascript
// 共享内存（需要设置 COOP/COEP 头）
const sharedBuffer = new SharedArrayBuffer(1024);
const sharedView = new Int32Array(sharedBuffer);

// 主线程和 Worker 都可以访问
worker.postMessage({ buffer: sharedBuffer });

// Worker 中
self.onmessage = (e) => {
  const view = new Int32Array(e.data.buffer);
  Atomics.add(view, 0, 1); // 原子操作
};
```

### Comlink 简化通信

```javascript
// 使用 Comlink 库
import { wrap } from 'comlink';

// main.js
const worker = new Worker('worker.js');
const api = wrap(worker);
const result = await api.compute(data);

// worker.js
import { expose } from 'comlink';

expose({
  compute(data) {
    return heavyComputation(data);
  }
});
```

## 动画优化

### 使用 CSS 动画

```css
/* 高性能动画 */
.element {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.element:hover {
  transform: translateY(-10px) scale(1.05);
}
```

### JavaScript 动画优化

```javascript
// 使用 Web Animations API
element.animate([
  { transform: 'translateY(0)', opacity: 1 },
  { transform: 'translateY(-10px)', opacity: 0.8 }
], {
  duration: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  fill: 'forwards'
});
```

### 避免布局抖动

```javascript
// 读写分离
// 读阶段
const heights = elements.map(el => el.offsetHeight);

// 写阶段
elements.forEach((el, i) => {
  el.style.height = heights[i] * 2 + 'px';
});
```

## 核心知识点

1. **虚拟列表**：只渲染视口内元素，大幅减少 DOM 节点
2. **时间切片**：长任务拆分，避免阻塞渲染帧
3. **Web Workers**：计算密集型任务移出主线程
4. **动画优化**：优先使用 transform/opacity，使用 CSS 动画
5. **读写分离**：避免强制同步布局
