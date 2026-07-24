---
title: "第四章：条件渲染与列表渲染"
description: "掌握 v-if、v-show、v-for 等渲染指令的使用"
---

# 第四章：条件渲染与列表渲染

## 运行结果

| 指令 | 用途 | 特点 |
| --- | --- | --- |
| `v-if` | 条件渲染 | 真正的销毁/创建，惰性渲染 |
| `v-else-if` | 多条件分支 | 必须紧跟 v-if |
| `v-else` | 默认分支 | 必须紧跟 v-if/v-else-if |
| `v-show` | 条件显示 | CSS display 切换，始终渲染 |
| `v-for` | 列表渲染 | 需要 key，支持多种数据源 |

## 代码示例

### 1. v-if 条件渲染

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isVisible = ref(true)
const score = ref(85)
</script>

<template>
  <!-- 基础 v-if -->
  <p v-if="isVisible">这段文字可见</p>

  <!-- v-if / v-else -->
  <p v-if="score >= 60">及格</p>
  <p v-else>不及格</p>

  <!-- v-if / v-else-if / v-else -->
  <p v-if="score >= 90">优秀</p>
  <p v-else-if="score >= 80">良好</p>
  <p v-else-if="score >= 60">及格</p>
  <p v-else>不及格</p>

  <!-- 在 template 上使用 -->
  <template v-if="isVisible">
    <h1>标题</h1>
    <p>内容</p>
  </template>
</template>
```

### 2. v-show

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isVisible = ref(true)
</script>

<template>
  <!-- v-show 通过 CSS display 控制 -->
  <p v-show="isVisible">使用 v-show 控制显示</p>

  <!-- v-show 不支持 template -->
  <!-- v-show 不支持 v-else -->
</template>
```

### 3. v-if vs v-show

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isLoading = ref(true)
const isActive = ref(true)
</script>

<template>
  <!-- v-if：适合切换频率低的场景 -->
  <div v-if="isLoading">加载中...</div>

  <!-- v-show：适合切换频率高的场景 -->
  <div v-show="isActive">频繁切换的内容</div>
</template>
```

### 4. v-for 列表渲染

```vue
<script setup lang="ts">
import { ref } from 'vue'

const items = ref([
  { id: 1, name: '苹果' },
  { id: 2, name: '香蕉' },
  { id: 3, name: '橘子' }
])

const numbers = ref([1, 2, 3, 4, 5])

const user = ref({
  name: '张三',
  age: 25,
  city: '北京'
})
</script>

<template>
  <!-- 对象数组 -->
  <ul>
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </ul>

  <!-- 带索引 -->
  <ul>
    <li v-for="(item, index) in items" :key="item.id">
      {{ index + 1 }}. {{ item.name }}
    </li>
  </ul>

  <!-- 数字范围 -->
  <span v-for="n in 10" :key="n">{{ n }} </span>

  <!-- 对象遍历 -->
  <ul>
    <li v-for="(value, key) in user" :key="key">
      {{ key }}: {{ value }}
    </li>
  </ul>
</template>
```

### 5. v-for 与 computed 结合

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const todos = ref([
  { id: 1, text: '学习 Vue', done: true },
  { id: 2, text: '学习 TypeScript', done: false },
  { id: 3, text: '写项目', done: false }
])

const activeTodos = computed(() =>
  todos.value.filter(t => !t.done)
)
</script>

<template>
  <ul>
    <li v-for="todo in activeTodos" :key="todo.id">
      {{ todo.text }}
    </li>
  </ul>
</template>
```

### 6. key 的重要性

```vue
<script setup lang="ts">
import { ref } from 'vue'

const items = ref([
  { id: 1, name: '苹果' },
  { id: 2, name: '香蕉' },
  { id: 3, name: '橘子' }
])
</script>

<template>
  <!-- ✅ 使用唯一 id 作为 key -->
  <div v-for="item in items" :key="item.id">
    {{ item.name }}
  </div>

  <!-- ❌ 避免使用 index 作为 key（当列表会排序/删除时） -->
  <div v-for="(item, index) in items" :key="index">
    {{ item.name }}
  </div>
</template>
```

## 核心知识点

1. **v-if 是"真正的"条件渲染**：切换时会销毁/重建 DOM 元素
2. **v-show 始终渲染**：只切换 CSS `display`，适合频繁切换
3. **v-for 需要 key**：帮助 Vue 追踪每个节点的身份，提高 diff 效率
4. **v-for 优先于 v-if**：同一元素上 v-for 优先级更高
5. **避免 v-for 和 v-if 同时使用**：用 computed 过滤数据更好
