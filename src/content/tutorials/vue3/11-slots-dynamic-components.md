---
title: "第十一章：插槽与动态组件"
description: "掌握 Vue 3 插槽的高级用法和动态组件的使用"
---

# 第十一章：插槽与动态组件

## 运行结果

| 特性 | 用途 | 示例 |
| --- | --- | --- |
| 默认插槽 | 组件内容分发 | `<slot />` |
| 具名插槽 | 多个插槽位置 | `<slot name="header" />` |
| 作用域插槽 | 子组件向插槽传递数据 | `<slot :user="user" />` |
| `<component :is="...">` | 动态组件 | 切换不同组件 |
| `<keep-alive>` | 组件缓存 | 保持组件状态 |

## 代码示例

### 1. 默认插槽

```vue
<!-- MyButton.vue -->
<script setup lang="ts">
// 子组件不需要特殊处理
</script>

<template>
  <button class="btn">
    <!-- 默认插槽 -->
    <slot>默认按钮文本</slot>
  </button>
</template>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
import MyButton from './MyButton.vue'
</script>

<template>
  <!-- 使用插槽 -->
  <MyButton>点击我</MyButton>

  <!-- 使用默认内容 -->
  <MyButton />
</template>
```

### 2. 具名插槽

```vue
<!-- Card.vue -->
<script setup lang="ts">
</script>

<template>
  <div class="card">
    <div class="card-header">
      <slot name="header">默认标题</slot>
    </div>
    <div class="card-body">
      <slot>默认内容</slot>
    </div>
    <div class="card-footer">
      <slot name="footer">默认底部</slot>
    </div>
  </div>
</template>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
import Card from './Card.vue'
</script>

<template>
  <Card>
    <template #header>
      <h3>卡片标题</h3>
    </template>

    <template #default>
      <p>卡片内容</p>
    </template>

    <template #footer>
      <button>操作按钮</button>
    </template>
  </Card>
</template>
```

### 3. 作用域插槽

```vue
<!-- UserList.vue -->
<script setup lang="ts">
const users = [
  { id: 1, name: '张三', age: 25 },
  { id: 2, name: '李四', age: 30 },
  { id: 3, name: '王五', age: 28 }
]
</script>

<template>
  <ul>
    <li v-for="user in users" :key="user.id">
      <!-- 向插槽传递数据 -->
      <slot :user="user" :index="user.id">
        {{ user.name }}
      </slot>
    </li>
  </ul>
</template>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
import UserList from './UserList.vue'
</script>

<template>
  <UserList>
    <template #default="{ user, index }">
      <span>{{ index }}. {{ user.name }} ({{ user.age }}岁)</span>
    </template>
  </UserList>
</template>
```

### 4. 动态组件

```vue
<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import Home from './Home.vue'
import About from './About.vue'
import Contact from './Contact.vue'

const currentComponent = shallowRef(Home)

const components = {
  home: Home,
  about: About,
  contact: Contact
}

const switchComponent = (name: keyof typeof components) => {
  currentComponent.value = components[name]
}
</script>

<template>
  <div>
    <button @click="switchComponent('home')">首页</button>
    <button @click="switchComponent('about')">关于</button>
    <button @click="switchComponent('contact')">联系</button>

    <component :is="currentComponent" />
  </div>
</template>
```

### 5. keep-alive 缓存组件

```vue
<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import TabA from './TabA.vue'
import TabB from './TabB.vue'

const currentTab = shallowRef(TabA)

const tabs = {
  a: TabA,
  b: TabB
}
</script>

<template>
  <div>
    <button @click="currentTab = tabs.a">标签 A</button>
    <button @click="currentTab = tabs.b">标签 B</button>

    <!-- 使用 keep-alive 缓存组件状态 -->
    <keep-alive>
      <component :is="currentTab" />
    </keep-alive>
  </div>
</template>
```

### 6. keep-alive 条件缓存

```vue
<script setup lang="ts">
import { ref } from 'vue'
import ComponentA from './ComponentA.vue'
import ComponentB from './ComponentB.vue'

const includeList = ['ComponentA', 'ComponentB']
</script>

<template>
  <!-- 只缓存指定组件 -->
  <keep-alive include="ComponentA,ComponentB">
    <component :is="currentComponent" />
  </keep-alive>

  <!-- 排除某些组件 -->
  <keep-alive exclude="ComponentC">
    <component :is="currentComponent" />
  </keep-alive>

  <!-- 最多缓存 10 个组件 -->
  <keep-alive :max="10">
    <component :is="currentComponent" />
  </keep-alive>
</template>
```

### 7. 异步组件

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// 基础用法
const AsyncComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)

// 带加载状态
const AsyncWithOptions = defineAsyncComponent({
  loader: () => import('./HeavyComponent.vue'),
  loadingComponent: () => import('./Loading.vue'),
  errorComponent: () => import('./Error.vue'),
  delay: 200,        // 延迟显示 loading
  timeout: 3000      // 超时时间
})
</script>

<template>
  <AsyncComponent />
  <AsyncWithOptions />
</template>
```

### 8. 递归组件

```vue
<!-- TreeNode.vue -->
<script setup lang="ts">
interface TreeNode {
  id: number
  name: string
  children?: TreeNode[]
}

defineProps<{
  node: TreeNode
}>()
</script>

<template>
  <li>
    <span>{{ node.name }}</span>
    <ul v-if="node.children && node.children.length > 0">
      <!-- 递归调用自身 -->
      <tree-node
        v-for="child in node.children"
        :key="child.id"
        :node="child"
      />
    </ul>
  </li>
</template>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
import TreeNode from './TreeNode.vue'

const treeData = {
  id: 1,
  name: '根节点',
  children: [
    {
      id: 2,
      name: '子节点 1',
      children: [
        { id: 4, name: '孙节点 1-1' },
        { id: 5, name: '孙节点 1-2' }
      ]
    },
    {
      id: 3,
      name: '子节点 2',
      children: [
        { id: 6, name: '孙节点 2-1' }
      ]
    }
  ]
}
</script>

<template>
  <ul>
    <TreeNode :node="treeData" />
  </ul>
</template>
```

### 9. 实战：可定制列表组件

```vue
<!-- CustomList.vue -->
<script setup lang="ts">
interface Item {
  id: number
  title: string
  description: string
  tags: string[]
}

defineProps<{
  items: Item[]
}>()
</script>

<template>
  <ul class="custom-list">
    <li v-for="item in items" :key="item.id" class="list-item">
      <!-- 提供多个插槽位置 -->
      <slot name="header" :item="item">
        <h3>{{ item.title }}</h3>
      </slot>

      <slot name="body" :item="item">
        <p>{{ item.description }}</p>
      </slot>

      <slot name="footer" :item="item">
        <div class="tags">
          <span v-for="tag in item.tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>
      </slot>
    </li>
  </ul>
</template>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
import CustomList from './CustomList.vue'

const items = [
  {
    id: 1,
    title: 'Vue 3',
    description: '渐进式 JavaScript 框架',
    tags: ['前端', '框架']
  },
  {
    id: 2,
    title: 'TypeScript',
    description: 'JavaScript 的超集',
    tags: ['语言', '类型系统']
  }
]
</script>

<template>
  <CustomList :items="items">
    <!-- 自定义 header 插槽 -->
    <template #header="{ item }">
      <h2 style="color: blue">{{ item.title }}</h2>
    </template>

    <!-- 使用默认 body 插槽 -->

    <!-- 自定义 footer 插槽 -->
    <template #footer="{ item }">
      <div style="margin-top: 10px">
        <strong>标签：</strong>
        <span v-for="tag in item.tags" :key="tag" style="margin-right: 5px">
          #{{ tag }}
        </span>
      </div>
    </template>
  </CustomList>
</template>
```

## 核心知识点

1. **默认插槽**：`<slot />` 定义内容分发位置
2. **具名插槽**：`<slot name="xxx" />` 支持多个插槽位置
3. **作用域插槽**：子组件通过 `<slot :data="xxx" />` 向父组件传递数据
4. **动态组件**：`<component :is="xxx" />` 动态切换组件
5. **keep-alive**：缓存组件状态，避免重复渲染
6. **异步组件**：`defineAsyncComponent` 实现代码分割和懒加载
7. **递归组件**：组件调用自身，适用于树形结构
