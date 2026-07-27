---
title: "第十二章：框架性能优化"
description: "掌握 Vue/React 框架层面的性能优化技巧，让组件更快更流畅"
---

# 第十二章：框架性能优化

## 本章导读

在学这一章之前，你可能会有这些疑问：

- Vue 的 shallowRef 和 ref 有什么区别？什么时候用？
- React 的 memo、useMemo、useCallback 分别解决什么问题？
- 组件渲染慢，怎么排查和优化？
- 状态管理怎么做才能减少不必要的重渲染？

这一章就是为了解答这些问题。框架优化是日常开发中最常接触的优化手段——不需要改架构、不需要加基础设施，只需要调整组件写法，就能获得显著的性能提升。

---

## 1 为什么需要框架性能优化？

### 痛点分析

你可能遇到过这些问题：

- 列表渲染几千条数据，滚动时明显卡顿
- 点击一个按钮，页面要等几百毫秒才有反应
- 修改了一个小状态，整个页面都在重新渲染
- 组件越来越多，页面越来越慢，但不知道慢在哪

打个比方：

> 框架优化就像优化厨房流程：
> - shallowRef = 大锅菜不逐个品尝（减少不必要的响应式追踪）
> - memo = 做好的菜不用重做（缓存组件渲染结果）
> - 虚拟列表 = 只摆当前桌的菜，不做 1000 道菜摆着
> - 状态拆分 = 各厨师负责自己的菜，互不干扰

### 优化目标

```
框架优化目标：
├── 减少渲染次数 → memo、computed 缓存
├── 减少渲染范围 → 状态拆分、精准更新
├── 减少渲染成本 → 虚拟列表、时间切片
└── 减少初始化时间 → 异步组件、代码分割
```

---

## 2 Vue 性能优化

### 响应式优化

Vue 3 的响应式系统默认是"深层响应"——对象内部的每一层属性都会被追踪。对于大型数据，这个开销很大。

```vue
<script setup>
import { ref, reactive, shallowRef, shallowReactive } from 'vue';

// ❌ 问题：大型数组用 ref，每个元素都会被深层代理
const largeList = ref([
  { id: 1, name: 'A', data: { /* 大量嵌套数据 */ } },
  { id: 2, name: 'B', data: { /* 大量嵌套数据 */ } },
  // ... 10000 条数据
]);

// ✅ 优化：shallowRef 只追踪 .value 的变化，不追踪内部属性
const largeList = shallowRef([
  { id: 1, name: 'A', data: { /* 大量嵌套数据 */ } },
  { id: 2, name: 'B', data: { /* 大量嵌套数据 */ } },
  // ... 10000 条数据
]);

// 注意：修改 shallowRef 需要替换整个值（不能修改内部属性触发更新）
// ❌ 这样不会触发更新
largeList.value[0].name = 'Updated';

// ✅ 替换整个数组触发更新
largeList.value = [...largeList.value];
// 或者使用 triggerRef()
import { triggerRef } from 'vue';
largeList.value[0].name = 'Updated';
triggerRef(largeList);  // 手动触发更新
</script>
```

**对比**：

| API | 追踪深度 | 适用场景 | 性能 |
| --- | --- | --- | --- |
| ref | 深层 | 小型数据、表单数据 | 开销大 |
| shallowRef | 浅层（只追踪 .value） | 大型列表、第三方库实例 | 开销小 |
| reactive | 深层 | 小型对象 | 开销大 |
| shallowReactive | 浅层 | 大型配置对象、状态树根节点 | 开销小 |

**原理**：

> shallowRef 就像一个快递箱：
> - ref = 箱子里每件东西都贴了追踪器，动一个就知道
> - shallowRef = 只有箱子本身有追踪器，箱子里的东西动了不管
> - 所以 shallowRef 适合"整体替换"的场景

### 组件优化

```vue
<script setup>
import { defineAsyncComponent, computed } from 'vue';

// ✅ 异步组件：只在需要时才加载
const HeavyChart = defineAsyncComponent(() =>
  import('./HeavyChart.vue')
);

// ✅ 计算属性缓存：依赖不变就不重新计算
const expensiveResult = computed(() => {
  // 这个计算可能很耗时
  return heavyComputation(props.data);
});
</script>

<template>
  <!-- ✅ v-once：静态内容只渲染一次 -->
  <div v-once>{{ staticContent }}</div>

  <!-- ✅ v-memo：依赖不变就跳过子树更新 -->
  <div v-memo="[selectedItem.id]">
    <p>{{ selectedItem.name }}</p>
    <p>{{ selectedItem.description }}</p>
  </div>

  <!-- ✅ Suspense + 异步组件：加载时展示 fallback -->
  <Suspense>
    <HeavyChart />
    <template #fallback>
      图表加载中...
    </template>
  </Suspense>
</template>
```

**v-memo 说明**：

`v-memo` 是 Vue 3.2 新增的指令，接收一个依赖数组。只有当数组中的值发生变化时，才会重新渲染子树。

```
v-memo 工作原理：
├── 第一次渲染：正常渲染，记录依赖值
├── 后续更新：对比依赖值
│   ├── 没变化 → 跳过渲染（直接复用上次结果）
│   └── 有变化 → 重新渲染子树
└── 适合：大型列表中的静态子树、复杂表单
```

### 列表渲染优化

```vue
<script setup>
import { ref, computed } from 'vue';

const items = ref([/* 10000 条数据 */]);
const scrollTop = ref(0);
const itemHeight = 50;        // 每项高度
const containerHeight = 600;  // 容器高度

// ✅ 虚拟列表：只渲染可见区域的数据
const visibleItems = computed(() => {
  // 计算起始索引
  const start = Math.floor(scrollTop.value / itemHeight);
  // 计算可见数量（容器高度 / 每项高度 + 上下各 5 个缓冲）
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 10;
  // 截取可见范围
  return items.value.slice(start, start + visibleCount);
});

// ✅ 偏移量（让可见项定位到正确位置）
const offsetY = computed(() => {
  const start = Math.floor(scrollTop.value / itemHeight);
  return start * itemHeight;
});
</script>

<template>
  <!-- ✅ 虚拟列表容器 -->
  <div
    class="virtual-list"
    style="height: 600px; overflow: auto;"
    @scroll="scrollTop = $event.target.scrollTop"
  >
    <!-- 占位元素：撑开滚动条 -->
    <div :style="{ height: items.length * itemHeight + 'px', position: 'relative' }">
      <!-- 可见项容器：通过 transform 定位 -->
      <div :style="{ transform: `translateY(${offsetY}px)` }">
        <!-- ✅ key 使用唯一 ID，不要用 index -->
        <div v-for="item in visibleItems" :key="item.id" :style="{ height: itemHeight + 'px' }">
          {{ item.name }}
        </div>
      </div>
    </div>
  </div>
</template>
```

**说明**：

- `key` 必须使用唯一且稳定的值（如 `item.id`），不要用 `index`
- 用 `index` 做 key 会导致排序/删除时大量 DOM 移动
- 虚拟列表的核心：只渲染可见区域，用 transform 定位

### 事件优化

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue';

// ✅ 事件委托：在父元素上监听，减少事件绑定数
function handleClick(event) {
  // 找到最近的带 data-action 属性的元素
  const target = event.target.closest('[data-action]');
  if (target) {
    handleAction(target.dataset.action);
  }
}

// ✅ 及时清理事件监听（避免内存泄漏）
onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  // 组件卸载时必须移除
  window.removeEventListener('resize', handleResize);
});

function handleResize() {
  // 处理窗口大小变化
}
</script>

<template>
  <!-- ✅ 事件委托：只在 ul 上绑定一次 -->
  <ul @click="handleClick">
    <li v-for="item in items" :key="item.id" :data-action="item.action">
      {{ item.name }}
    </li>
  </ul>

  <!-- ❌ 避免：每个 li 都绑定一个事件 -->
  <ul>
    <li v-for="item in items" :key="item.id" @click="handleAction(item.action)">
      {{ item.name }}
    </li>
  </ul>
</template>
```

---

## 3 React 性能优化

### 避免不必要的渲染

React 的默认行为是：父组件重新渲染，子组件也会重新渲染，即使 props 没变。

```jsx
import { memo, useMemo, useCallback, useState } from 'react';

// ✅ memo：缓存组件，props 不变就不重新渲染
const ExpensiveList = memo(({ items, onSelect }) => {
  console.log('ExpensiveList 渲染');
  return (
    <ul>
      {items.map(item => (
        <li key={item.id} onClick={() => onSelect(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
});

function App() {
  const [count, setCount] = useState(0);
  const [items] = useState([
    { id: 1, name: 'A' },
    { id: 2, name: 'B' }
  ]);

  // ✅ useMemo：缓存计算结果，依赖不变就不重新计算
  const processedItems = useMemo(() => {
    console.log('处理数据...');
    return items.filter(item => item.name !== 'B');
  }, [items]);  // 只有 items 变化才重新计算

  // ✅ useCallback：缓存函数引用，避免子组件因 props 变化而重渲染
  const handleSelect = useCallback((id) => {
    console.log('选中:', id);
  }, []);  // 空依赖，函数引用永远不变

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        计数: {count}
      </button>
      {/* count 变化时，ExpensiveList 不会重渲染（因为 props 没变） */}
      <ExpensiveList items={processedItems} onSelect={handleSelect} />
    </div>
  );
}
```

**对比**：

| API | 作用 | 缓存什么 | 适用场景 |
| --- | --- | --- | --- |
| memo | 缓存组件 | 渲染结果 | 纯展示组件、渲染开销大的组件 |
| useMemo | 缓存值 | 计算结果 | 复杂计算、过滤/排序 |
| useCallback | 缓存函数 | 函数引用 | 传给子组件的回调函数 |

**原理**：

> React 缓存就像复印机：
> - memo = 复印件没变就不用重新复印
> - useMemo = 计算结果存起来，下次直接用
> - useCallback = 函数模板存起来，不用每次重新打印

### 代码分割

```jsx
import { lazy, Suspense, useState } from 'react';

// ✅ 路由级别分割：每个路由独立 chunk
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}

// ✅ 交互级别分割：用户点击时才加载
function ModalButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>打开弹窗</button>
      {showModal && (
        <Suspense fallback={<Loading />}>
          {/* 点击时才加载 Modal 组件 */}
          <ModalComponent onClose={() => setShowModal(false)} />
        </Suspense>
      )}
    </>
  );
}

// ✅ 懒加载的 Modal 组件
const ModalComponent = lazy(() => import('./Modal'));
```

### 状态管理优化

```jsx
// ✅ 状态拆分：减少重渲染范围
function App() {
  return (
    // 每个 Context 独立，修改一个不影响其他
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider>
          <AppContent />
        </RouterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// ✅ 选择器模式：只订阅需要的部分
import { useSyncExternalStore } from 'react';

function useStore(getSnapshot, subscribe) {
  return useSyncExternalStore(subscribe, getSnapshot);
}

// 只订阅 user.name，其他状态变化不会触发重渲染
const userName = useStore(
  () => store.getState().user.name,   // 只取 name
  (callback) => store.subscribe(callback)
);
```

---

## 4 通用优化策略

### 组件设计原则

```
好的组件设计 = 性能优化的基础：

├── 单一职责 → 组件只做一件事，容易缓存和优化
├── 合理拆分 → 大组件拆小组件，减少重渲染范围
├── 状态提升 → 共享状态提升到共同祖先
├── 状态下沉 → 局部状态保持在组件内部
└── 避免透传 → 不要把不需要的 props 传给子组件
```

打个比方：

> 组件设计就像公司组织架构：
> - 单一职责 = 每个人只负责一件事
> - 合理拆分 = 大部门拆小团队，管理更高效
> - 状态提升 = 跨部门的事交给上级协调
> - 状态下沉 = 部门内部的事自己决定，不用上报

### 渲染优化

```
渲染优化策略：
├── 避免内联对象/函数 → 每次渲染都创建新引用，破坏 memo
├── 使用 key 帮助 diff → 唯一稳定的 key 让 diff 更高效
├── 条件渲染优化 → 频繁切换用 CSS 隐藏，不频繁用 v-if
└── 列表渲染优化 → 虚拟列表 + 唯一 key
```

```jsx
// ❌ 避免：内联对象每次渲染都是新引用
<ExpensiveComponent style={{ color: 'red' }} />

// ✅ 推荐：提取到外部常量
const redStyle = { color: 'red' };
<ExpensiveComponent style={redStyle} />
```

### 依赖优化

```
依赖优化策略：
├── 按需导入 → import debounce from 'lodash/debounce'
├── 使用轻量替代库 → dayjs 替代 moment，esbuild 替代 babel
├── 移除未使用依赖 → 定期清理 package.json
└── 分析依赖体积 → 使用 bundlephobia.com 查看包体积
```

---

## 5 新手常见误区

### 误区 1："所有 ref 都换成 shallowRef 就好了"

**错！** shallowRef 只适合大型数据集或第三方库实例。

**正确做法**：

1. 小型数据（表单、计数器）用 `ref`
2. 大型列表（1000+ 条）用 `shallowRef`
3. 需要深层监听的嵌套对象用 `reactive`
4. 大型配置对象用 `shallowReactive`

### 误区 2："React 所有组件都要加 memo"

**错！** memo 本身也有开销（对比 props 的浅比较），不是所有组件都适合。

**正确做法**：

1. 纯展示组件、渲染开销大的组件用 `memo`
2. 简单组件（只渲染几个标签）不需要 `memo`
3. 先测量，找到真正慢的组件，再针对性优化

### 误区 3："useCallback 用得越多越好"

**错！** useCallback 也有开销（创建闭包、维护依赖数组），滥用反而更慢。

**正确做法**：

1. 传给 memo 子组件的回调用 `useCallback`
2. 作为其他 Hook 依赖的函数用 `useCallback`
3. 普通事件处理函数不需要 `useCallback`

### 误区 4："列表的 key 用 index 就行了"

**错！** 用 index 做 key 在排序、删除、插入时会导致错误的 DOM 复用。

**正确做法**：

1. 始终使用数据中的唯一标识（如 `item.id`）
2. 没有唯一标识时，考虑给数据生成唯一 ID
3. 只有列表完全静态（不会排序/删除/插入）时才能用 index

---

## 6 动手练习

### 练习 1：基础练习 - Vue 响应式优化

**题目**：优化以下代码，减少不必要的响应式开销。

```vue
<script setup>
import { ref } from 'vue';

// 问题：10000 条数据，每条都有深层嵌套
const tableData = ref([]);

// 从 API 获取数据
async function fetchData() {
  const res = await api.getData();
  tableData.value = res.data;  // 10000 条深层嵌套数据
}

// 修改某条数据
function updateItem(id, newData) {
  const item = tableData.value.find(i => i.id === id);
  item.data = newData;  // 深层修改
}
</script>
```

<details>
<summary>点击查看答案</summary>

```vue
<script setup>
import { shallowRef, triggerRef } from 'vue';

// ✅ 使用 shallowRef，不追踪深层属性
const tableData = shallowRef([]);

async function fetchData() {
  const res = await api.getData();
  tableData.value = res.data;
}

// ✅ 修改后手动触发更新
function updateItem(id, newData) {
  const item = tableData.value.find(i => i.id === id);
  item.data = newData;
  triggerRef(tableData);  // 手动触发
}
</script>
```

**优化点**：

1. `shallowRef` 避免 10000 条数据的深层代理
2. 修改数据后用 `triggerRef` 手动触发更新
3. 性能提升：初始化速度可以提升数倍

</details>

### 练习 2：进阶练习 - React memo 优化

**题目**：以下组件在父组件 state 变化时会不必要地重渲染，请优化。

```jsx
function Parent() {
  const [count, setCount] = useState(0);
  const [items] = useState([/* 大量数据 */]);

  function handleSelect(id) {
    console.log('选中:', id);
  }

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <ExpensiveList items={items} onSelect={handleSelect} />
    </div>
  );
}

function ExpensiveList({ items, onSelect }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id} onClick={() => onSelect(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}
```

<details>
<summary>点击查看答案</summary>

```jsx
import { memo, useCallback } from 'react';

function Parent() {
  const [count, setCount] = useState(0);
  const [items] = useState([/* 大量数据 */]);

  // ✅ useCallback 缓存函数引用
  const handleSelect = useCallback((id) => {
    console.log('选中:', id);
  }, []);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      {/* count 变化时，ExpensiveList 不会重渲染 */}
      <ExpensiveList items={items} onSelect={handleSelect} />
    </div>
  );
}

// ✅ memo 缓存组件
const ExpensiveList = memo(({ items, onSelect }) => {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id} onClick={() => onSelect(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
});
```

**优化点**：

1. `memo` 包裹 ExpensiveList，props 不变就不重渲染
2. `useCallback` 缓存 handleSelect，避免引用变化破坏 memo
3. count 变化时 ExpensiveList 不再重渲染

</details>

### 练习 3（挑战）：综合练习 - Vue 虚拟列表

**题目**：实现一个支持 100000 条数据的虚拟列表组件。

<details>
<summary>点击查看答案</summary>

```vue
<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  items: { type: Array, required: true },
  itemHeight: { type: Number, default: 40 },
  buffer: { type: Number, default: 5 }
});

const containerRef = ref(null);
const scrollTop = ref(0);
const containerHeight = ref(0);

// 可见范围计算
const visibleRange = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight);
  const visibleCount = Math.ceil(containerHeight.value / props.itemHeight);
  return {
    start: Math.max(0, start - props.buffer),
    end: Math.min(props.items.length, start + visibleCount + props.buffer * 2)
  };
});

// 可见数据
const visibleItems = computed(() => {
  const { start, end } = visibleRange.value;
  return props.items.slice(start, end).map((item, i) => ({
    ...item,
    _index: start + i
  }));
});

// 总高度（撑开滚动条）
const totalHeight = computed(() => props.items.length * props.itemHeight);

// 偏移量（定位可见项）
const offsetY = computed(() => visibleRange.value.start * props.itemHeight);

function handleScroll(e) {
  scrollTop.value = e.target.scrollTop;
}

onMounted(() => {
  containerHeight.value = containerRef.value.clientHeight;
});
</script>

<template>
  <div ref="containerRef" @scroll="handleScroll"
       style="overflow: auto; height: 100%; position: relative;">
    <div :style="{ height: totalHeight + 'px', position: 'relative' }">
      <div :style="{ transform: `translateY(${offsetY}px)` }">
        <div v-for="item in visibleItems" :key="item._index"
             :style="{ height: itemHeight + 'px' }">
          <slot :item="item" :index="item._index" />
        </div>
      </div>
    </div>
  </div>
</template>
```

**使用方式**：

```vue
<VirtualList :items="hugeList" :item-height="40">
  <template #default="{ item }">
    <div class="list-item">{{ item.name }}</div>
  </template>
</VirtualList>
```

**要点**：

1. 只渲染可见区域 + 缓冲区
2. 用 transform 定位可见项
3. 占位元素撑开滚动条
4. 100000 条数据只渲染约 30 个 DOM 节点

</details>

---

## 下一章预告

下一章我们会学习 **性能监控与分析**——也就是如何发现性能问题、定位瓶颈。

你会学到：

- Chrome DevTools Performance 面板的使用
- Lighthouse 性能审计
- 运行时性能监控
- 性能 budgets 的设定

优化之前先要量化——不知道慢在哪，优化就是盲人摸象。
