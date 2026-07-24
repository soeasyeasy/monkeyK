---
title: "第十二章：框架性能优化"
description: "Vue/React 性能优化、组件优化、状态管理最佳实践"
---

# 第十二章：框架性能优化

## Vue 性能优化

### 响应式优化

```vue
<script setup>
import { ref, reactive, shallowRef, shallowReactive } from 'vue';

// 大型对象使用 shallowRef
const largeData = shallowRef({
  nested: { deep: 'value' },
  array: [1, 2, 3, /* 大量数据 */]
});

// 只替换整个对象触发更新
largeData.value = { ...largeData.value, newProp: 'value' };

// 不需要深层响应的数据
const config = shallowReactive({
  theme: 'dark',
  locale: 'zh-CN'
});
</script>
```

### 组件优化

```vue
<script setup>
import { defineAsyncComponent, computed } from 'vue';

// 异步组件
const HeavyComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
);

// 计算属性缓存
const expensiveResult = computed(() => {
  return heavyComputation(props.data);
});
</script>

<template>
  <!-- v-once 静态内容 -->
  <div v-once>{{ staticContent }}</div>

  <!-- v-memo 缓存子树 -->
  <div v-memo="[selectedItem.id]">
    <p>{{ selectedItem.name }}</p>
    <p>{{ selectedItem.description }}</p>
  </div>

  <!-- 异步组件 -->
  <Suspense>
    <HeavyComponent />
    <template #fallback>
      加载中...
    </template>
  </Suspense>
</template>
```

### 列表渲染优化

```vue
<script setup>
import { ref, computed } from 'vue';

const items = ref([/* 大量数据 */]);

// 虚拟列表实现
const visibleItems = computed(() => {
  const start = Math.floor(scrollTop.value / itemHeight);
  const end = start + visibleCount;
  return items.value.slice(start, end);
});
</script>

<template>
  <!-- 确保 key 唯一且稳定 -->
  <div v-for="item in visibleItems" :key="item.id">
    {{ item.name }}
  </div>

  <!-- 避免同时使用 v-if 和 v-for -->
  <template v-for="item in items" :key="item.id">
    <div v-if="item.visible">{{ item.name }}</div>
  </template>
</template>
```

### 事件优化

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue';

// 使用事件委托
function handleClick(event) {
  const target = event.target.closest('[data-action]');
  if (target) {
    handleAction(target.dataset.action);
  }
}

// 及时清理事件监听
onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <!-- 事件委托 -->
  <ul @click="handleClick">
    <li v-for="item in items" :key="item.id" :data-action="item.action">
      {{ item.name }}
    </li>
  </ul>
</template>
```

## React 性能优化

### 避免不必要的渲染

```jsx
import { memo, useMemo, useCallback } from 'react';

// 使用 memo 缓存组件
const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* 复杂渲染 */}</div>;
});

function Parent() {
  // useMemo 缓存计算结果
  const processedData = useMemo(() => {
    return heavyComputation(data);
  }, [data]);

  // useCallback 缓存函数
  const handleClick = useCallback(() => {
    doSomething(id);
  }, [id]);

  return (
    <ExpensiveComponent
      data={processedData}
      onClick={handleClick}
    />
  );
}
```

### 代码分割

```jsx
import { lazy, Suspense } from 'react';

// 路由级别分割
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

// 交互级别分割
function ModalButton() {
  const [showModal, setShowModal] = useState(false);

  const Modal = useMemo(() => {
    if (showModal) {
      return lazy(() => import('./Modal'));
    }
    return null;
  }, [showModal]);

  return (
    <>
      <button onClick={() => setShowModal(true)}>打开</button>
      {showModal && (
        <Suspense fallback={<Loading />}>
          <Modal onClose={() => setShowModal(false)} />
        </Suspense>
      )}
    </>
  );
}
```

### 状态管理优化

```jsx
// 状态拆分，减少重渲染范围
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider>
          <AppContent />
        </RouterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// 使用 useSyncExternalStore 优化外部状态
import { useSyncExternalStore } from 'react';

function useStore(store) {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot
  );
}

// 选择器模式，只订阅需要的部分
const userName = useStore(
  useCallback((state) => state.user.name, [])
);
```

## 通用优化策略

### 组件设计

```
原则：
- 单一职责：组件只做一件事
- 合理拆分：大组件拆分为小组件
- 状态提升：共享状态提升到共同祖先
- 状态下沉：局部状态保持在组件内部
```

### 渲染优化

```
策略：
- 避免内联对象/函数
- 使用 key 帮助 diff
- 条件渲染优化
- 列表渲染优化
```

### 依赖优化

```
策略：
- 按需导入
- 使用轻量替代库
- 移除未使用依赖
- 分析依赖体积
```

## 核心知识点

1. **Vue 优化**：shallowRef/shallowReactive、v-memo、异步组件
2. **React 优化**：memo、useMemo、useCallback、lazy
3. **列表优化**：虚拟列表、唯一 key、避免 v-if/v-for 同用
4. **状态管理**：状态拆分、选择器订阅、减少重渲染范围
5. **组件设计**：单一职责、合理拆分、状态提升/下沉
