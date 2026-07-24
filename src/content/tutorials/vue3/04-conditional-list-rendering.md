---
title: '第四章：条件渲染与列表渲染'
description: '深入掌握 v-if、v-show、v-for 的原理与最佳实践'
---

# 第四章：条件渲染与列表渲染

## 本章导读

前两章我们学会了怎么显示数据，但真实页面往往需要：

- **根据条件显示不同内容**（比如登录/未登录显示不同菜单）
- **循环渲染一组数据**（比如商品列表、评论列表）

你可能会问：

- 用 JS 的 if/for 不行吗？为什么需要专门的指令？
- v-if 和 v-show 有什么区别？该用哪个？
- v-for 为什么要加 key？不加会怎样？

这一章我们会彻底搞懂这些渲染指令的原理和最佳实践。

---

## 4.1 为什么需要条件渲染和列表渲染？

### 痛点分析

假设你要做一个"用户信息"页面，根据登录状态显示不同内容。

用原生 JS 写起来是这样的：

```javascript
// 手动操作 DOM
const container = document.getElementById('user-info')

if (isLoggedIn) {
  container.innerHTML = `
    <h1>欢迎，${user.name}</h1>
    <button>退出登录</button>
  `
} else {
  container.innerHTML = `
    <h1>请先登录</h1>
    <button>登录</button>
  `
}
```

问题很明显：

- **代码里全是 DOM 操作**，业务逻辑不清晰
- **状态变化时要手动更新 DOM**，容易遗漏
- **列表渲染更麻烦**，要手动创建、插入、删除 DOM 节点

### Vue 的解决方案：声明式渲染

Vue 提供了专门的指令来处理这些场景：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isLoggedIn = ref(false)
const user = ref({ name: '张三' })
</script>

<template>
  <!-- 条件渲染：根据状态自动切换 -->
  <div v-if="isLoggedIn">
    <h1>欢迎，{{ user.name }}</h1>
    <button>退出登录</button>
  </div>
  <div v-else>
    <h1>请先登录</h1>
    <button>登录</button>
  </div>
</template>
```

> **一句话总结**：Vue 的条件/列表渲染让你只关心"数据是什么"，不用管"怎么操作 DOM"。

---

## 4.2 核心原理

### v-if vs v-show 的底层差异

#### v-if：真正的条件渲染

`v-if` 是"真正的"条件渲染——当条件为 false 时，元素会被**完全从 DOM 中移除**。

```vue
<template>
  <p v-if="isVisible">这段文字</p>
</template>
```

当 `isVisible` 为 false 时，这个 `<p>` 元素根本不存在于 DOM 中。

> **类比**：v-if 像"把书从书架上拿走"——书不在书架上了。

#### v-show：只是切换显示

`v-show` 始终会渲染元素，只是通过 CSS 的 `display` 属性控制显示/隐藏。

```vue
<template>
  <p v-show="isVisible">这段文字</p>
</template>
```

当 `isVisible` 为 false 时，元素还在 DOM 中，只是 `display: none`。

> **类比**：v-show 像"把书藏到抽屉里"——书还在，只是看不到了。

### key 的作用：帮助 Vue 识别元素

`v-for` 渲染列表时，Vue 需要知道每个元素对应哪个数据。`key` 就是元素的"身份证"。

> **类比**：想象你在管理一个班级，每个学生都有学号（key）。当学生换座位时，你通过学号知道谁换了位置，而不是靠"第几排第几个"来识别。

**为什么不用 index 作为 key？**

当列表顺序变化时（比如插入、删除、排序），index 会变化，导致 Vue 错误地认为"这个位置的元素变了"，从而错误地更新 DOM。

---

## 4.3 基础用法

### v-if 条件渲染

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 创建响应式布尔值
const isVisible = ref(true)

// 创建响应式数字
const score = ref(85)
</script>

<template>
  <!-- 基础 v-if：条件为 true 时显示 -->
  <p v-if="isVisible">这段文字可见</p>

  <!-- v-if / v-else：二选一 -->
  <p v-if="score >= 60">及格</p>
  <p v-else>不及格</p>

  <!-- v-if / v-else-if / v-else：多条件分支 -->
  <p v-if="score >= 90">优秀</p>
  <p v-else-if="score >= 80">良好</p>
  <p v-else-if="score >= 60">及格</p>
  <p v-else>不及格</p>
</template>
```

> **注意**：`v-else-if` 和 `v-else` 必须紧跟在 `v-if` 或另一个 `v-else-if` 后面，否则不会生效。

### 在 template 上使用 v-if

如果你想对多个元素应用同一个条件，可以用 `<template>` 包裹：

```vue
<template>
  <!-- template 不会渲染成真实 DOM 元素 -->
  <template v-if="isVisible">
    <h1>标题</h1>
    <p>内容</p>
    <button>按钮</button>
  </template>
</template>
```

> **原理**：`<template>` 是 Vue 的内置组件，它不会渲染成真实的 DOM 元素，只是作为一个"容器"来包裹其他元素。

### v-show

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isVisible = ref(true)
</script>

<template>
  <!-- v-show 通过 CSS display 控制显示 -->
  <p v-show="isVisible">使用 v-show 控制显示</p>
</template>
```

> **注意**：`v-show` 不支持 `<template>` 元素，也不支持 `v-else`。

---

## 4.4 进阶用法

### v-for 列表渲染

#### 遍历对象数组

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 创建响应式数组，每个对象有唯一 id
const items = ref([
  { id: 1, name: '苹果' },
  { id: 2, name: '香蕉' },
  { id: 3, name: '橘子' },
])
</script>

<template>
  <ul>
    <!-- 遍历数组，item 是当前元素 -->
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </ul>
</template>
```

#### 获取索引

```vue
<template>
  <ul>
    <!-- (item, index) 可以获取索引 -->
    <li v-for="(item, index) in items" :key="item.id">{{ index + 1 }}. {{ item.name }}</li>
  </ul>
</template>
```

#### 遍历数字范围

```vue
<template>
  <!-- 遍历 1-10 -->
  <span v-for="n in 10" :key="n">{{ n }} </span>
</template>
```

#### 遍历对象

```vue
<script setup lang="ts">
import { ref } from 'vue'

const user = ref({
  name: '张三',
  age: 25,
  city: '北京',
})
</script>

<template>
  <ul>
    <!-- (value, key) 遍历对象的键值对 -->
    <li v-for="(value, key) in user" :key="key">{{ key }}: {{ value }}</li>
  </ul>
</template>
```

### v-for 结合 computed

当需要过滤或排序列表时，用 `computed` 处理数据，而不是在模板里写复杂逻辑：

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// 待办事项列表
const todos = ref([
  { id: 1, text: '学习 Vue', done: true },
  { id: 2, text: '学习 TypeScript', done: false },
  { id: 3, text: '写项目', done: false },
])

// 计算属性：过滤出未完成的待办
const activeTodos = computed(() => todos.value.filter((t) => !t.done))
</script>

<template>
  <ul>
    <!-- 渲染过滤后的列表 -->
    <li v-for="todo in activeTodos" :key="todo.id">
      {{ todo.text }}
    </li>
  </ul>
</template>
```

> **原理**：`computed` 会缓存计算结果，只有 `todos` 变化时才重新计算。这比在模板里写 `todos.filter(...)` 性能更好。

---

## 4.5 核心知识点总结

| 指令        | 用途       | 特点                         | 适用场景     |
| ----------- | ---------- | ---------------------------- | ------------ |
| `v-if`      | 条件渲染   | 真正销毁/创建 DOM，惰性渲染  | 条件很少变化 |
| `v-else-if` | 多条件分支 | 必须紧跟 v-if                | 多个条件判断 |
| `v-else`    | 默认分支   | 必须紧跟 v-if/v-else-if      | 其他情况     |
| `v-show`    | 条件显示   | 只切换 CSS display，始终渲染 | 频繁切换显示 |
| `v-for`     | 列表渲染   | 需要 key，支持多种数据源     | 循环渲染列表 |

---

## 4.6 新手常见误区

### 误区 1："v-if 和 v-show 是一样的"

**错！**

- `v-if` 是真正添加/移除 DOM 元素，切换时有性能开销
- `v-show` 只是切换 CSS `display`，元素始终在 DOM 中

**选择建议**：

- 条件很少变化（如权限控制）→ 用 `v-if`
- 频繁切换显示（如展开/折叠）→ 用 `v-show`

### 误区 2："v-for 不需要 key"

**必须加 key！**

不加 key 时，Vue 会用"就地复用"策略——当列表顺序变化时，Vue 不会移动 DOM 元素，而是复用每个位置的元素并更新内容。这可能导致状态错乱（比如输入框的内容错位）。

**正确做法**：用唯一标识（如 id）作为 key，不要用 index。

### 误区 3："v-for 和 v-if 可以同时使用"

**不推荐！**

虽然可以同时使用，但 `v-for` 优先级高于 `v-if`，这意味着会先遍历所有元素，再判断条件。这会导致性能问题。

**正确做法**：用 `computed` 过滤数据，再渲染。

```vue
<!-- ❌ 不推荐 -->
<li v-for="item in items" v-if="item.active" :key="item.id">

<!-- ✅ 推荐 -->
<li v-for="item in activeItems" :key="item.id">
```

### 误区 4："v-else 可以随便放"

**错！**

`v-else-if` 和 `v-else` 必须紧跟在 `v-if` 或另一个 `v-else-if` 后面，中间不能有其他元素。

```vue
<!-- ❌ 错误：v-else 没有紧跟 v-if -->
<p v-if="condition">条件成立</p>
<p>其他内容</p>
<p v-else>条件不成立</p>

<!-- ✅ 正确 -->
<p v-if="condition">条件成立</p>
<p v-else>条件不成立</p>
```

### 误区 5："用 index 作为 key 没问题"

**有问题！**

当列表会排序、删除、插入时，用 index 作为 key 会导致 Vue 错误地更新 DOM。

**正确做法**：用数据的唯一标识（如 id）作为 key。

---

## 4.7 动手练习

### 练习 1：成绩评级

输入一个分数（0-100），根据分数显示等级：

- 90-100：优秀
- 80-89：良好
- 60-79：及格
- 0-59：不及格

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 创建响应式分数
const score = ref(85)
</script>

<template>
  <div>
    <input v-model.number="score" type="number" min="0" max="100" />

    <!-- 多条件分支 -->
    <p v-if="score >= 90 && score <= 100">优秀</p>
    <p v-else-if="score >= 80">良好</p>
    <p v-else-if="score >= 60">及格</p>
    <p v-else-if="score >= 0">不及格</p>
    <p v-else>请输入有效分数</p>
  </div>
</template>
```

</details>

### 练习 2：待办事项列表

实现一个待办事项列表：

- 输入框 + 添加按钮
- 显示所有待办事项
- 显示"已完成"和"未完成"的数量

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// 输入框内容
const inputText = ref('')

// 待办事项列表
const todos = ref<{ id: number; text: string; done: boolean }[]>([])

// 下一个 id
let nextId = 1

// 添加待办
const addTodo = () => {
  if (inputText.value.trim()) {
    todos.value.push({
      id: nextId++,
      text: inputText.value,
      done: false,
    })
    inputText.value = ''
  }
}

// 切换完成状态
const toggleTodo = (id: number) => {
  const todo = todos.value.find((t) => t.id === id)
  if (todo) {
    todo.done = !todo.done
  }
}

// 计算已完成数量
const doneCount = computed(() => todos.value.filter((t) => t.done).length)

// 计算未完成数量
const activeCount = computed(() => todos.value.filter((t) => !t.done).length)
</script>

<template>
  <div>
    <input v-model="inputText" @keyup.enter="addTodo" placeholder="输入待办" />
    <button @click="addTodo">添加</button>

    <ul>
      <li v-for="todo in todos" :key="todo.id">
        <input type="checkbox" :checked="todo.done" @change="toggleTodo(todo.id)" />
        <span :style="{ textDecoration: todo.done ? 'line-through' : 'none' }">
          {{ todo.text }}
        </span>
      </li>
    </ul>

    <p v-if="todos.length > 0">已完成：{{ doneCount }}，未完成：{{ activeCount }}</p>
    <p v-else>暂无待办事项</p>
  </div>
</template>
```

</details>

### 练习 3（挑战）：商品列表筛选

实现一个商品列表：

- 显示所有商品
- 根据分类筛选商品
- 显示每个分类的商品数量

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// 商品列表
const products = ref([
  { id: 1, name: 'iPhone', category: '手机', price: 5999 },
  { id: 2, name: 'iPad', category: '平板', price: 3999 },
  { id: 3, name: 'MacBook', category: '电脑', price: 9999 },
  { id: 4, name: '小米', category: '手机', price: 2999 },
  { id: 5, name: 'Surface', category: '电脑', price: 7999 },
])

// 当前选中的分类
const selectedCategory = ref('全部')

// 所有分类
const categories = computed(() => {
  const cats = ['全部', ...new Set(products.value.map((p) => p.category))]
  return cats
})

// 过滤后的商品
const filteredProducts = computed(() => {
  if (selectedCategory.value === '全部') {
    return products.value
  }
  return products.value.filter((p) => p.category === selectedCategory.value)
})

// 每个分类的数量
const categoryCounts = computed(() => {
  const counts: Record<string, number> = { 全部: products.value.length }
  products.value.forEach((p) => {
    counts[p.category] = (counts[p.category] || 0) + 1
  })
  return counts
})
</script>

<template>
  <div>
    <!-- 分类筛选 -->
    <div>
      <button
        v-for="cat in categories"
        :key="cat"
        @click="selectedCategory = cat"
        :style="{ fontWeight: selectedCategory === cat ? 'bold' : 'normal' }"
      >
        {{ cat }} ({{ categoryCounts[cat] }})
      </button>
    </div>

    <!-- 商品列表 -->
    <ul>
      <li v-for="product in filteredProducts" :key="product.id">
        {{ product.name }} - {{ product.category }} - ¥{{ product.price }}
      </li>
    </ul>

    <p v-if="filteredProducts.length === 0">该分类暂无商品</p>
  </div>
</template>
```

</details>

---

## 下一章预告

下一章我们会学习 Vue 的**事件处理**——也就是怎么响应用户的操作（点击、输入、键盘等）。你会学到事件绑定、事件修饰符、按键修饰符等实用技巧。
