---
title: "第八章：渲染性能优化"
description: "掌握虚拟列表、时间切片、Web Workers 等高级渲染优化技术"
---

# 第八章：渲染性能优化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 页面渲染 10000 条数据就卡死，怎么优化？
- 动画掉帧、不流畅是什么原因？
- 什么是 60fps？怎么达到这个目标？
- 长任务阻塞主线程，怎么拆分？

这一章就是为了解答这些问题。渲染性能优化是前端性能的核心，直接决定用户能否流畅使用页面。

---

## 8.1 为什么需要渲染性能优化？

### 痛点分析

你可能遇到过这些问题：

- 列表渲染 10000 条数据，页面卡死
- 滚动时掉帧，动画不流畅
- 点击按钮没反应，页面"假死"
- 内存越用越大，最后浏览器崩溃

打个比方：

> 渲染性能就像餐厅服务：
> - 虚拟列表 = 只上客人点的菜，不做 1000 道菜摆着
> - 时间切片 = 厨师分批做菜，不一次性做完所有
> - Web Workers = 请帮厨分担工作，主厨不累
> - 60fps = 每秒上 60 道菜，客人感觉流畅

### 性能目标

```
渲染性能目标：
├── 60fps（帧率）
│   └── 每帧 16.6ms 内完成
├── 首屏渲染 < 1s
├── 交互响应 < 100ms
└── 动画流畅无掉帧
```

---

## 8.2 虚拟列表

### 核心原理

只渲染视口内的元素，大幅减少 DOM 节点数量。

```
10000 条数据：
├── 普通渲染：10000 个 DOM 节点（卡死）
└── 虚拟列表：约 20 个 DOM 节点（流畅）
```

打个比方：

> 虚拟列表就像看书：
> - 普通渲染 = 把 1000 页书全部摊开在桌上
> - 虚拟列表 = 只翻开当前看的这一页，其他收起来

### 简单实现

```javascript
// 虚拟列表类
class VirtualList {
  constructor(container, itemHeight, totalItems, renderItem) {
    // 保存参数
    this.container = container;
    this.itemHeight = itemHeight;
    this.totalItems = totalItems;
    this.renderItem = renderItem;

    // 计算可见数量（视口高度 / 每项高度 + 2 个缓冲）
    this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2;
    // 缓冲区（上下各 5 个）
    this.buffer = 5;

    // 设置容器样式
    this.container.style.overflow = 'auto';
    this.container.style.position = 'relative';

    // 创建占位元素（撑开滚动条）
    this.spacer = document.createElement('div');
    this.spacer.style.height = `${totalItems * itemHeight}px`;
    this.container.appendChild(this.spacer);

    // 创建内容容器（绝对定位）
    this.content = document.createElement('div');
    this.content.style.position = 'absolute';
    this.content.style.top = '0';
    this.content.style.left = '0';
    this.content.style.width = '100%';
    this.container.appendChild(this.content);

    // 监听滚动事件
    this.container.addEventListener('scroll', () => this.render());
    // 初始渲染
    this.render();
  }

  render() {
    // 获取滚动位置
    const scrollTop = this.container.scrollTop;
    // 计算起始索引（减去缓冲区）
    const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);
    // 计算结束索引（加上缓冲区）
    const endIndex = Math.min(this.totalItems, startIndex + this.visibleCount + this.buffer * 2);

    // 设置内容容器的偏移
    this.content.style.transform = `translateY(${startIndex * this.itemHeight}px)`;

    // 创建文档片段（批量操作 DOM）
    const fragment = document.createDocumentFragment();
    // 循环渲染可见项
    for (let i = startIndex; i < endIndex; i++) {
      fragment.appendChild(this.renderItem(i));
    }

    // 清空并追加新内容
    this.content.innerHTML = '';
    this.content.appendChild(fragment);
  }
}
```

### Vue 虚拟列表组件

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// 定义 props
const props = defineProps<{
  items: any[];        // 完整数据列表
  itemHeight: number;  // 每项固定高度
}>();

// 响应式数据
const container = ref<HTMLElement>();      // 容器引用
const scrollTop = ref(0);                  // 滚动位置
const containerHeight = ref(0);            // 容器高度

// 计算可见范围
const visibleRange = computed(() => {
  // 起始索引
  const start = Math.floor(scrollTop.value / props.itemHeight);
  // 可见数量（容器高度 / 每项高度 + 2 个缓冲）
  const visibleCount = Math.ceil(containerHeight.value / props.itemHeight) + 2;
  
  return {
    // 实际起始位置（减去 5 个上缓冲）
    start: Math.max(0, start - 5),
    // 实际结束位置（加上 5 个下缓冲）
    end: Math.min(props.items.length, start + visibleCount + 5)
  };
});

// 计算可见数据项
const visibleItems = computed(() => {
  const { start, end } = visibleRange.value;
  // 截取可见范围的数据，添加索引
  return props.items.slice(start, end).map((item, index) => ({
    ...item,
    index: start + index
  }));
});

// 计算总高度（用于滚动条）
const totalHeight = computed(() => props.items.length * props.itemHeight);

// 计算偏移量（用于定位可见项）
const offsetY = computed(() => visibleRange.value.start * props.itemHeight);

// 处理滚动事件
function handleScroll(e: Event) {
  scrollTop.value = (e.target as HTMLElement).scrollTop;
}

// 组件挂载后获取容器高度
onMounted(() => {
  containerHeight.value = container.value!.clientHeight;
});
</script>

<template>
  <!-- 虚拟列表容器 -->
  <div ref="container" class="virtual-list" @scroll="handleScroll">
    <!-- 占位元素：撑开滚动条 -->
    <div class="spacer" :style="{ height: totalHeight + 'px' }">
      <!-- 内容容器：通过 transform 定位 -->
      <div class="content" :style="{ transform: `translateY(${offsetY}px)` }">
        <!-- 只渲染可见项 -->
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
.spacer { 
  position: relative; 
}
.content { 
  position: absolute; 
  top: 0; 
  left: 0; 
  width: 100%; 
}
.item { 
  height: v-bind('props.itemHeight + "px"'); 
}
</style>
```

---

## 8.3 时间切片

### 核心原理

将长任务拆分为多个短任务，在帧之间执行，避免阻塞渲染。

```
长任务（200ms）：
├── 阻塞主线程
├── 无法响应用户输入
└── 页面卡顿

时间切片（每帧 10ms）：
├── 执行 10ms → 让出主线程
├── 浏览器渲染一帧
├── 继续执行 10ms → 让出主线程
└── 页面流畅
```

打个比方：

> 时间切片就像吃大餐：
> - 长任务 = 一口气吃完 10 碗饭（撑死）
> - 时间切片 = 每吃一口休息一会（舒服）

### 使用 requestIdleCallback

```javascript
// 时间切片处理大量数据
async function processWithTimeSlicing(items, processItem) {
  // 每帧处理的项数
  const chunkSize = 10;
  // 当前索引
  let index = 0;

  // 定义处理函数
  function processChunk(deadline) {
    // 在空闲时间内处理
    while ((deadline.timeRemaining() > 0 || deadline.didTimeout) && index < items.length) {
      // 处理当前项
      processItem(items[index]);
      // 索引递增
      index++;
    }

    // 如果还有数据，继续调度
    if (index < items.length) {
      requestIdleCallback(processChunk);
    }
  }

  // 开始调度，设置超时 1 秒
  requestIdleCallback(processChunk, { timeout: 1000 });
}
```

### 使用 setTimeout 切片

```javascript
// 使用 setTimeout 分批处理
function processInChunks(items, chunkSize = 10) {
  // 当前索引
  let index = 0;

  // 定义处理函数
  function processChunk() {
    // 计算结束位置
    const end = Math.min(index + chunkSize, items.length);

    // 处理当前批次
    for (let i = index; i < end; i++) {
      process(items[i]);
    }

    // 更新索引
    index = end;

    // 如果还有数据，继续调度
    if (index < items.length) {
      setTimeout(processChunk, 0);
    }
  }

  // 开始处理
  processChunk();
}
```

---

## 8.4 Web Workers 深入

### 基本通信

```javascript
// 主线程
const worker = new Worker('worker.js');
// 发送数据给 Worker
worker.postMessage({ data: 'hello' });
// 接收 Worker 的消息
worker.onmessage = (e) => console.log(e.data);

// worker.js（独立文件）
self.onmessage = (e) => {
  // 接收主线程消息
  // 发送结果给主线程
  self.postMessage('received: ' + e.data.data);
};
```

### Transferable Objects（零拷贝）

```javascript
// 主线程
const buffer = new ArrayBuffer(1024);
// 转移 ArrayBuffer 给 Worker（零拷贝）
worker.postMessage({ data: buffer }, [buffer]);
// 注意：buffer 现在在主线程不可用（已转移）
```

**原理**：Transferable Objects 直接转移所有权，不需要复制，性能更好。

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
  // 原子操作（线程安全）
  Atomics.add(view, 0, 1);
};
```

**注意**：SharedArrayBuffer 需要设置安全头，防止 Spectre 攻击。

### Comlink 简化通信

```javascript
// 使用 Comlink 库（npm install comlink）
import { wrap } from 'comlink';

// 主线程
const worker = new Worker('worker.js');
// 包装 Worker
const api = wrap(worker);
// 像调用普通函数一样调用 Worker 方法
const result = await api.compute(data);

// worker.js
import { expose } from 'comlink';

// 暴露方法给主线程
expose({
  compute(data) {
    return heavyComputation(data);
  }
});
```

**优势**：Comlink 让 Worker 调用像普通函数一样简单，不需要手动处理消息传递。

---

## 8.5 动画优化

### CSS 动画（推荐）

```css
/* 高性能动画 */
.element {
  /* 使用 transform 和 opacity（合成层属性） */
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  /* 提示浏览器这个元素会变化 */
  will-change: transform;
}

.element:hover {
  /* 使用 transform 而不是 top/left */
  transform: translateY(-10px) scale(1.05);
}
```

**原理**：`transform` 和 `opacity` 在合成层运行，不触发重排重绘，性能最好。

### JavaScript 动画（Web Animations API）

```javascript
// 使用 Web Animations API
element.animate([
  // 起始状态
  { transform: 'translateY(0)', opacity: 1 },
  // 结束状态
  { transform: 'translateY(-10px)', opacity: 0.8 }
], {
  duration: 300,           // 动画时长
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',  // 缓动函数
  fill: 'forwards'         // 保持结束状态
});
```

### 避免布局抖动

```javascript
// ❌ 差：读写交替，强制同步布局
elements.forEach(el => {
  const height = el.offsetHeight;  // 读
  el.style.height = height * 2 + 'px';  // 写
});

// ✅ 好：读写分离
// 读阶段：批量读取
const heights = elements.map(el => el.offsetHeight);

// 写阶段：批量写入
elements.forEach((el, i) => {
  el.style.height = heights[i] * 2 + 'px';
});
```

**原理**：读写分离避免强制同步布局（Layout Thrashing），减少重排次数。

---

## 8.6 性能对比

| 优化技术 | 适用场景 | 效果 |
| --- | --- | --- |
| 虚拟列表 | 大数据列表 | DOM 节点减少 99% |
| 时间切片 | 长任务处理 | 避免阻塞主线程 |
| Web Workers | 计算密集型任务 | 不阻塞 UI 渲染 |
| CSS 动画 | 简单动画 | 合成层运行，60fps |
| 读写分离 | 批量 DOM 操作 | 减少重排次数 |

---

## 8.7 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 虚拟列表 | 只渲染视口内元素，大幅减少 DOM 节点 |
| 时间切片 | 长任务拆分，避免阻塞渲染帧 |
| Web Workers | 计算密集型任务移出主线程 |
| 动画优化 | 优先使用 transform/opacity，使用 CSS 动画 |
| 读写分离 | 避免强制同步布局 |

---

## 8.8 新手常见误区

### 误区 1："虚拟列表适用于所有列表"

**错！** 虚拟列表只适用于大量数据（>1000 条），小列表用虚拟列表反而增加复杂度。

**正确做法**：

1. 数据量 < 1000 条：直接渲染
2. 数据量 > 1000 条：使用虚拟列表
3. 考虑使用现成库（vue-virtual-scroller、react-virtualized）

### 误区 2："will-change 越多越好"

**错！** will-change 会创建合成层，消耗内存，滥用会适得其反。

**正确做法**：

1. 只在动画开始前添加
2. 动画结束后移除
3. 不要给所有元素添加

### 误区 3："Web Workers 可以操作 DOM"

**错！** Web Workers 运行在独立线程，无法访问 DOM。

**正确做法**：

1. Worker 只做计算密集型任务
2. 计算结果传回主线程
3. 主线程负责 DOM 操作

### 误区 4："setTimeout(fn, 0) 立即执行"

**错！** setTimeout 有最小延迟（4ms），不是真正的立即执行。

**正确做法**：

1. 需要立即执行用 `requestAnimationFrame`
2. 需要空闲时执行用 `requestIdleCallback`
3. setTimeout 适合简单的任务拆分

---

## 8.9 动手练习

### 练习 1：基础练习 - 虚拟列表

**题目**：实现一个简单的虚拟列表，渲染 10000 条数据。

<details>
<summary>点击查看答案</summary>

```vue
<script setup>
import { ref, computed } from 'vue';

// 生成 10000 条数据
const items = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  text: `Item ${i}`
}));

// 配置
const itemHeight = 40;        // 每项高度
const containerHeight = 400;  // 容器高度
const buffer = 5;             // 缓冲区

// 滚动位置
const scrollTop = ref(0);

// 可见范围
const visibleRange = computed(() => {
  const start = Math.floor(scrollTop.value / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  
  return {
    start: Math.max(0, start - buffer),
    end: Math.min(items.length, start + visibleCount + buffer)
  };
});

// 可见数据
const visibleItems = computed(() => {
  const { start, end } = visibleRange.value;
  return items.slice(start, end);
});

// 总高度
const totalHeight = computed(() => items.length * itemHeight);

// 偏移量
const offsetY = computed(() => visibleRange.value.start * itemHeight);
</script>

<template>
  <div 
    class="virtual-list" 
    style="height: 400px; overflow: auto;"
    @scroll="scrollTop = $event.target.scrollTop">
    
    <!-- 占位元素 -->
    <div :style="{ height: totalHeight + 'px', position: 'relative' }">
      <!-- 内容容器 -->
      <div :style="{ transform: `translateY(${offsetY}px)` }">
        <div 
          v-for="item in visibleItems" 
          :key="item.id"
          :style="{ height: itemHeight + 'px' }">
          {{ item.text }}
        </div>
      </div>
    </div>
  </div>
</template>
```

**关键点**：

1. 只渲染视口内的元素（约 10-20 条）
2. 使用 `transform` 定位，性能更好
3. 添加缓冲区避免快速滚动时出现空白
4. 占位元素撑开滚动条

</details>

### 练习 2：进阶练习 - 时间切片

**题目**：使用时间切片处理 10000 条数据，避免阻塞主线程。

<details>
<summary>点击查看答案</summary>

```javascript
// 时间切片处理大量数据
async function processLargeData(data) {
  const results = [];
  const chunkSize = 100;  // 每批处理 100 条

  for (let i = 0; i < data.length; i += chunkSize) {
    // 处理当前批次
    const chunk = data.slice(i, i + chunkSize);
    chunk.forEach(item => {
      results.push(heavyComputation(item));
    });

    // 让出主线程，让浏览器渲染一帧
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return results;
}

// 使用
const data = Array.from({ length: 10000 }, (_, i) => i);
processLargeData(data).then(results => {
  console.log('处理完成:', results.length);
});
```

**关键点**：

1. 每批处理 100 条数据
2. 使用 `setTimeout(fn, 0)` 让出主线程
3. 浏览器可以在批次之间渲染一帧
4. 页面保持流畅

</details>

### 练习 3（挑战）：综合练习 - Web Worker

**题目**：使用 Web Worker 处理计算密集型任务。

<details>
<summary>点击查看答案</summary>

```javascript
// 主线程
const worker = new Worker('worker.js');

// 发送数据给 Worker
const data = Array.from({ length: 1000000 }, (_, i) => i);
worker.postMessage({ data });

// 接收结果
worker.onmessage = (event) => {
  console.log('计算结果:', event.data.sum);
};

// worker.js（独立文件）
self.onmessage = (event) => {
  const { data } = event.data;
  
  // 计算密集型任务
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  
  // 返回结果
  self.postMessage({ sum });
};
```

**关键点**：

1. Worker 运行在独立线程，不阻塞 UI
2. 使用 `postMessage` 通信
3. 适合计算密集型任务（大数据排序、图像处理）
4. 无法访问 DOM

</details>

---

## 下一章预告

下一章我们会学习 **构建工具优化**——也就是如何优化 Webpack、Vite 等构建工具的配置。

你会学到：

- Tree Shaking 的原理和配置
- 代码分割策略
- 资源压缩和预压缩
- 构建性能优化

构建工具优化可以显著减少打包体积和构建时间。
