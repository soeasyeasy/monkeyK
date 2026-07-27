---
title: "第九章：插槽"
description: "深入理解 Vue 2 插槽机制，掌握默认插槽、具名插槽、作用域插槽的使用，学会设计可复用的组件模板。"
---

# 第九章：插槽

## 1. 本章导读

在开始学习之前，你可能会有这些疑问：

- **疑问 1**：什么是插槽？为什么需要插槽这种机制？
- **疑问 2**：默认插槽、具名插槽、作用域插槽有什么区别？什么时候用哪个？
- **疑问 3**：子组件的数据怎么传递给父组件的插槽内容？
- **疑问 4**：插槽的后备内容是什么意思？怎么用？

本章会帮你解决这些问题，让你掌握 Vue 中最强大的内容分发机制，学会设计真正可复用的组件。

## 2. 为什么需要这个技术

### 生活化类比

想象你买了一套 **乐高积木**：
- **子组件** 就像乐高积木的底板，它定义了形状和结构
- **插槽** 就是底板上的凸起，可以插入不同的积木块
- **父组件** 可以在这些凸起上插入自己想要的积木（内容）

再比如 **手机壳**：
- 手机壳（子组件）预留了摄像头孔、充电孔（插槽）
- 你可以插入不同的装饰（父组件的内容）
- 但手机壳的整体结构是固定的

### 没有插槽时的痛点

```vue
<!-- ❌ 没有插槽：子组件内容写死 -->
<template>
  <div class="card">
    <h2>固定标题</h2>
    <p>固定内容</p>
    <button>固定按钮</button>
  </div>
</template>

<!-- 问题：这个卡片组件无法复用，内容都是固定的 -->
```

**问题**：
- ❌ 组件内容写死，无法自定义
- ❌ 每个不同的地方都要创建新组件
- ❌ 代码重复，难以维护

### 使用插槽后

```vue
<!-- ✅ 使用插槽：子组件定义结构，父组件填充内容 -->
<!-- 子组件 Card.vue -->
<template>
  <div class="card">
    <div class="card-header">
      <slot name="header">默认标题</slot>
    </div>
    <div class="card-body">
      <slot>默认内容</slot>
    </div>
    <div class="card-footer">
      <slot name="footer">默认按钮</slot>
    </div>
  </div>
</template>
```

```vue
<!-- 父组件使用 -->
<template>
  <card>
    <template #header>
      <h2>自定义标题</h2>
    </template>
    
    <p>自定义内容</p>
    
    <template #footer>
      <button>自定义按钮</button>
    </template>
  </card>
</template>
```

**优势**：
- ✅ 组件结构固定，内容可自定义
- ✅ 一个组件可以复用多次，每次内容不同
- ✅ 代码更简洁，易于维护

## 3. 核心原理讲解

### 插槽的核心思想

Vue 的插槽机制遵循 **内容分发** 原则：
- 子组件定义模板结构和插槽位置
- 父组件决定插槽里放什么内容
- 这样实现了 **结构复用，内容定制**

### 三种插槽类型

| 插槽类型 | 用途 | 使用场景 |
|---------|------|---------|
| **默认插槽** | 单个内容分发点 | 组件只有一个插入位置 |
| **具名插槽** | 多个内容分发点 | 组件有多个插入位置（header、footer 等） |
| **作用域插槽** | 子组件数据传给父组件 | 父组件需要根据子组件数据定制渲染 |

### 生活化理解

把插槽想象成 **相框**：
- **默认插槽**：相框只有一个位置，可以放一张照片
- **具名插槽**：相框有多个位置，分别标记"照片1"、"照片2"、"装饰"
- **作用域插槽**：相框不仅提供位置，还告诉你照片的尺寸、颜色等信息，你根据这些信息决定怎么放

## 4. 基础用法 + 逐行注释

### 4.1 默认插槽

```vue
<!-- 子组件 AlertBox.vue -->
<template>
  <div class="alert">
    <!-- ✅ 使用 <slot> 标签定义插槽位置 -->
    <!-- 插槽标签内的内容是后备内容，当父组件没提供内容时显示 -->
    <slot>
      这是默认的提示内容，如果父组件不提供内容，就显示这段话
    </slot>
  </div>
</template>

<style scoped>
.alert {
  padding: 15px;
  background-color: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 4px;
}
</style>
```

```vue
<!-- 父组件使用 -->
<template>
  <div>
    <!-- ✅ 提供自定义内容 -->
    <alert-box>
      <strong>警告：</strong> 这是一个自定义的提示消息！
    </alert-box>
    
    <!-- ✅ 不提供内容，显示后备内容 -->
    <alert-box></alert-box>
  </div>
</template>

<script>
import AlertBox from './AlertBox.vue'

export default {
  components: { AlertBox }
}
</script>
```

### 4.2 具名插槽

```vue
<!-- 子组件 Layout.vue -->
<template>
  <div class="layout">
    <!-- ✅ 使用 name 属性定义具名插槽 -->
    <header class="header">
      <slot name="header">
        <!-- 后备内容 -->
        <h1>默认页面标题</h1>
      </slot>
    </header>
    
    <main class="main">
      <!-- ✅ 没有 name 的是默认插槽 -->
      <slot>
        默认主要内容
      </slot>
    </main>
    
    <footer class="footer">
      <slot name="footer">
        <p>默认页脚</p>
      </slot>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.header {
  background: #3b82f6;
  color: white;
  padding: 20px;
}
.main {
  flex: 1;
  padding: 20px;
}
.footer {
  background: #e5e7eb;
  padding: 20px;
}
</style>
```

```vue
<!-- 父组件使用 -->
<template>
  <layout>
    <!-- ✅ 使用 v-slot:名称 或 #名称 指定具名插槽 -->
    <template #header>
      <h1>我的网站标题</h1>
      <nav>
        <a href="/">首页</a>
        <a href="/about">关于</a>
      </nav>
    </template>
    
    <!-- ✅ 默认插槽可以直接写内容，不用 template 包裹 -->
    <h2>主要内容</h2>
    <p>这里是页面的主要内容区域。</p>
    
    <!-- ✅ 使用具名插槽 -->
    <template #footer>
      <p>&copy; 2024 我的网站</p>
      <p>联系方式：example@email.com</p>
    </template>
  </layout>
</template>

<script>
import Layout from './Layout.vue'

export default {
  components: { Layout }
}
</script>
```

### 4.3 作用域插槽

```vue
<!-- 子组件 UserList.vue -->
<template>
  <ul class="user-list">
    <li v-for="user in users" :key="user.id">
      <!-- ✅ 通过 v-bind 向插槽传递数据 -->
      <!-- 这里把 user 对象和 index 索引传递给父组件 -->
      <slot :user="user" :index="index">
        <!-- 后备内容 -->
        {{ user.name }}
      </slot>
    </li>
  </ul>
</template>

<script>
export default {
  data() {
    return {
      users: [
        { id: 1, name: '张三', age: 25, avatar: '👨' },
        { id: 2, name: '李四', age: 30, avatar: '👩' },
        { id: 3, name: '王五', age: 28, avatar: '👨' }
      ]
    }
  },
  computed: {
    index() {
      return 0
    }
  }
}
</script>
```

```vue
<!-- 父组件使用 -->
<template>
  <div>
    <h2>用户列表 - 样式 A</h2>
    <!-- ✅ 使用 v-slot:default 接收插槽数据 -->
    <user-list>
      <template #default="{ user, index }">
        <!-- 现在可以使用子组件传来的 user 和 index -->
        <span class="avatar">{{ user.avatar }}</span>
        <span class="name">{{ index + 1 }}. {{ user.name }}</span>
        <span class="age">（{{ user.age }}岁）</span>
      </template>
    </user-list>
    
    <h2>用户列表 - 样式 B</h2>
    <!-- ✅ 同一个组件，不同的渲染方式 -->
    <user-list>
      <template #default="slotProps">
        <!-- 也可以使用完整的 slotProps 对象 -->
        <div class="card">
          <h3>{{ slotProps.user.name }}</h3>
          <p>年龄：{{ slotProps.user.age }}</p>
          <p>序号：{{ slotProps.index }}</p>
        </div>
      </template>
    </user-list>
  </div>
</template>

<script>
import UserList from './UserList.vue'

export default {
  components: { UserList }
}
</script>
```

### 4.4 插槽解构赋值

```vue
<!-- 子组件 DataTable.vue -->
<template>
  <table>
    <thead>
      <tr>
        <th v-for="col in columns" :key="col.key">
          {{ col.title }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in data" :key="row.id">
        <td v-for="col in columns" :key="col.key">
          <!-- ✅ 向插槽传递 row 和 value -->
          <slot 
            :name="col.key" 
            :row="row" 
            :value="row[col.key]"
          >
            {{ row[col.key] }}
          </slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
export default {
  props: {
    columns: {
      type: Array,
      required: true
    },
    data: {
      type: Array,
      required: true
    }
  }
}
</script>
```

```vue
<!-- 父组件使用 -->
<template>
  <data-table :columns="columns" :data="users">
    <!-- ✅ 解构插槽 props，直接获取需要的属性 -->
    <template #name="{ row }">
      <strong>{{ row.name }}</strong>
    </template>
    
    <template #age="{ value }">
      <!-- 根据值设置样式 -->
      <span :class="{ 'text-red': value > 30 }">
        {{ value }}岁
      </span>
    </template>
    
    <template #action="{ row }">
      <button @click="edit(row)">编辑</button>
      <button @click="del(row)">删除</button>
    </template>
  </data-table>
</template>

<script>
import DataTable from './DataTable.vue'

export default {
  data() {
    return {
      columns: [
        { key: 'name', title: '姓名' },
        { key: 'age', title: '年龄' },
        { key: 'action', title: '操作' }
      ],
      users: [
        { id: 1, name: '张三', age: 25 },
        { id: 2, name: '李四', age: 35 }
      ]
    }
  },
  methods: {
    edit(row) {
      console.log('编辑', row)
    },
    del(row) {
      console.log('删除', row)
    }
  }
}
</script>

<style scoped>
.text-red {
  color: red;
  font-weight: bold;
}
</style>
```

### 4.5 动态插槽名

```vue
<!-- 子组件 DynamicSlots.vue -->
<template>
  <div>
    <slot name="header">默认头部</slot>
    <slot name="content">默认内容</slot>
    <slot name="footer">默认底部</slot>
  </div>
</template>
```

```vue
<!-- 父组件使用 -->
<template>
  <dynamic-slots>
    <!-- ✅ 使用方括号 [] 定义动态插槽名 -->
    <template #[dynamicSlotName]>
      <p>这是动态插槽的内容</p>
    </template>
  </dynamic-slots>
</template>

<script>
import DynamicSlots from './DynamicSlots.vue'

export default {
  components: { DynamicSlots },
  data() {
    return {
      // ✅ 可以通过数据动态改变插槽名
      dynamicSlotName: 'header' // 可以是 'header'、'content' 或 'footer'
    }
  },
  methods: {
    changeSlot() {
      const slots = ['header', 'content', 'footer']
      const currentIndex = slots.indexOf(this.dynamicSlotName)
      this.dynamicSlotName = slots[(currentIndex + 1) % slots.length]
    }
  }
}
</script>
```

### 4.6 检测插槽

```vue
<!-- 子组件 Card.vue -->
<template>
  <div class="card">
    <!-- ✅ 使用 $slots 检测插槽是否有内容 -->
    <div class="card-header" v-if="$slots.header">
      <slot name="header"></slot>
    </div>
    
    <div class="card-body">
      <slot>默认内容</slot>
    </div>
    
    <!-- ✅ 使用 $scopedSlots 检测作用域插槽 -->
    <div class="card-footer" v-if="$scopedSlots.footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style scoped>
.card {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}
.card-header {
  padding: 10px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}
.card-body {
  padding: 15px;
}
.card-footer {
  padding: 10px;
  background: #f5f5f5;
  border-top: 1px solid #ddd;
}
</style>
```

```vue
<!-- 父组件使用 -->
<template>
  <div>
    <!-- ✅ 提供 header 插槽 -->
    <card>
      <template #header>
        <h3>自定义标题</h3>
      </template>
      <p>卡片内容</p>
    </card>
    
    <!-- ✅ 不提供 header，不显示头部 -->
    <card>
      <p>只有内容的卡片</p>
    </card>
  </div>
</template>

<script>
import Card from './Card.vue'

export default {
  components: { Card }
}
</script>
```

## 5. 对比表格

### 三种插槽详细对比

| 特性 | 默认插槽 | 具名插槽 | 作用域插槽 |
|-----|---------|---------|-----------|
| **定义方式** | `<slot></slot>` | `<slot name="xxx"></slot>` | `<slot :prop="value"></slot>` |
| **使用方式** | 直接写内容 | `<template #xxx>` | `<template #default="slotProps">` |
| **数量限制** | 一个组件只能有一个 | 可以有多个 | 可以有多个 |
| **数据流向** | 父→子 | 父→子 | 子→父→子 |
| **适用场景** | 单个插入点 | 多个插入点 | 需要子组件数据 |
| **语法糖** | 无 | `#name` | `#default="{ prop }"` |
| **后备内容** | ✅ 支持 | ✅ 支持 | ✅ 支持 |

### 选择建议

```
场景判断：
├─ 组件只有一个插入位置？
│  ├─ 是 → 使用默认插槽
│  └─ 否 → 继续判断
├─ 组件有多个插入位置（如 header、footer）？
│  ├─ 是 → 使用具名插槽
│  └─ 否 → 继续判断
├─ 父组件需要根据子组件数据定制渲染？
│  ├─ 是 → 使用作用域插槽
│  └─ 否 → 使用默认或具名插槽
```

### 插槽语法版本对比

| Vue 版本 | 具名插槽语法 | 作用域插槽语法 |
|---------|-------------|---------------|
| Vue 2.6.0+ | `#name` 或 `v-slot:name` | `#default="slotProps"` |
| Vue 2.6.0 之前 | `slot="name"` | `slot-scope="slotProps"` |

```vue
<!-- ✅ Vue 2.6.0+ 推荐语法 -->
<template #header>
  <h1>标题</h1>
</template>

<template #default="{ user }">
  <p>{{ user.name }}</p>
</template>

<!-- ❌ Vue 2.6.0 之前旧语法（不推荐） -->
<template slot="header">
  <h1>标题</h1>
</template>

<template slot-scope="{ user }">
  <p>{{ user.name }}</p>
</template>
```

## 6. 新手常见误区

### 误区 1：在具名插槽外写内容，忘记用 template 包裹

```vue
<!-- ❌ 错误做法 -->
<layout>
  <template #header>
    <h1>标题</h1>
  </template>
  
  <!-- 这些内容会被当作默认插槽 -->
  <p>内容 1</p>
  <p>内容 2</p>
  
  <template #footer>
    <p>页脚</p>
  </template>
</layout>
```

**为什么错**：没有用 `<template>` 包裹的内容会被当作默认插槽，可能导致混乱

**正确做法**：
```vue
<!-- ✅ 正确做法 -->
<layout>
  <template #header>
    <h1>标题</h1>
  </template>
  
  <!-- ✅ 默认插槽可以用 template 包裹，也可以直接写 -->
  <template #default>
    <p>内容 1</p>
    <p>内容 2</p>
  </template>
  
  <template #footer>
    <p>页脚</p>
  </template>
</layout>
```

### 误区 2：作用域插槽的数据访问错误

```vue
<!-- ❌ 错误做法 -->
<user-list>
  <template #default>
    <!-- 这样访问不到 user，因为没有接收插槽数据 -->
    <p>{{ user.name }}</p>
  </template>
</user-list>
```

**为什么错**：作用域插槽的数据需要通过参数接收

**正确做法**：
```vue
<!-- ✅ 正确做法 -->
<user-list>
  <!-- 通过解构赋值接收数据 -->
  <template #default="{ user }">
    <p>{{ user.name }}</p>
  </template>
</user-list>

<!-- 或者 -->
<user-list>
  <!-- 通过 slotProps 接收 -->
  <template #default="slotProps">
    <p>{{ slotProps.user.name }}</p>
  </template>
</user-list>
```

### 误区 3：混淆插槽后备内容和默认值

```vue
<!-- ❌ 错误理解 -->
<template>
  <slot>
    <!-- 这不是默认值，而是后备内容 -->
    <!-- 只有当父组件不提供内容时才显示 -->
    后备内容
  </slot>
</template>
```

**正确理解**：
```vue
<!-- ✅ 正确理解 -->
<template>
  <!-- 如果父组件提供了内容，后备内容就不会显示 -->
  <slot>
    只有父组件没提供内容时，我才显示
  </slot>
</template>
```

### 误区 4：在作用域插槽中修改子组件数据

```vue
<!-- ❌ 错误做法 -->
<user-list>
  <template #default="{ user }">
    <button @click="user.name = '新名字'">
      修改名字
    </button>
  </template>
</user-list>
```

**为什么错**：父组件不应该直接修改子组件的数据

**正确做法**：
```vue
<!-- ✅ 正确做法：通过事件通知子组件 -->
<user-list>
  <template #default="{ user }">
    <button @click="$emit('update-user', user.id, '新名字')">
      修改名字
    </button>
  </template>
</user-list>
```

### 误区 5：忘记插槽的后备内容

```vue
<!-- ❌ 不推荐 -->
<template>
  <slot></slot>
  <!-- 如果父组件不提供内容，这里就是空的 -->
</template>
```

**为什么错**：没有后备内容，组件的可用性降低

**正确做法**：
```vue
<!-- ✅ 推荐：提供有意义的后备内容 -->
<template>
  <slot>
    <p>暂无内容</p>
  </slot>
</template>
```

## 7. 动手练习

### 练习 1：基础 - 创建一个可复用的卡片组件

**题目**：创建一个卡片组件，包含 header、body、footer 三个插槽，可以自定义每个部分的内容。如果某个插槽没有提供内容，显示默认内容。

<details>
<summary>点击查看答案</summary>

```vue
<!-- Card.vue -->
<template>
  <div class="card">
    <div class="card-header" v-if="$slots.header">
      <slot name="header">
        <h3>默认标题</h3>
      </slot>
    </div>
    
    <div class="card-body">
      <slot>
        <p>这是卡片的默认内容</p>
      </slot>
    </div>
    
    <div class="card-footer" v-if="$slots.footer">
      <slot name="footer">
        <button>默认按钮</button>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  margin: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.card-header {
  padding: 15px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}
.card-body {
  padding: 15px;
}
.card-footer {
  padding: 15px;
  background: #f5f5f5;
  border-top: 1px solid #ddd;
  text-align: right;
}
</style>
```

```vue
<!-- 使用示例 -->
<template>
  <div>
    <card>
      <template #header>
        <h3>用户信息</h3>
      </template>
      
      <p><strong>姓名：</strong>张三</p>
      <p><strong>年龄：</strong>25岁</p>
      
      <template #footer>
        <button @click="edit">编辑</button>
        <button @click="del">删除</button>
      </template>
    </card>
  </div>
</template>

<script>
import Card from './Card.vue'

export default {
  components: { Card },
  methods: {
    edit() {
      console.log('编辑用户')
    },
    del() {
      console.log('删除用户')
    }
  }
}
</script>
```

</details>

### 练习 2：进阶 - 使用作用域插槽创建自定义列表

**题目**：创建一个列表组件，使用作用域插槽向父组件传递每个列表项的数据，父组件可以根据数据自定义渲染方式。要求支持高亮特定项、显示图标等功能。

<details>
<summary>点击查看答案</summary>

```vue
<!-- CustomList.vue -->
<template>
  <ul class="custom-list">
    <li 
      v-for="(item, index) in items" 
      :key="index"
      :class="{ highlighted: item.highlight }"
    >
      <!-- ✅ 向插槽传递 item、index、toggleHighlight 方法 -->
      <slot 
        :item="item" 
        :index="index"
        :toggle-highlight="() => toggleHighlight(index)"
      >
        {{ item.text }}
      </slot>
    </li>
  </ul>
</template>

<script>
export default {
  props: {
    items: {
      type: Array,
      required: true
    }
  },
  methods: {
    toggleHighlight(index) {
      // ✅ 修改数据，触发响应式更新
      this.items[index].highlight = !this.items[index].highlight
    }
  }
}
</script>

<style scoped>
.custom-list {
  list-style: none;
  padding: 0;
}
.custom-list li {
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}
.custom-list li:hover {
  background: #f5f5f5;
}
.highlighted {
  background: #fef3c7 !important;
  font-weight: bold;
}
</style>
```

```vue
<!-- 使用示例 -->
<template>
  <div>
    <h2>待办事项列表</h2>
    
    <custom-list :items="todos">
      <template #default="{ item, index, toggleHighlight }">
        <!-- ✅ 自定义渲染逻辑 -->
        <div class="todo-item">
          <input 
            type="checkbox" 
            :checked="item.done"
            @change="toggleDone(index)"
          />
          
          <span :class="{ done: item.done }">
            {{ item.icon }} {{ item.text }}
          </span>
          
          <button @click="toggleHighlight">
            {{ item.highlight ? '取消高亮' : '高亮' }}
          </button>
        </div>
      </template>
    </custom-list>
  </div>
</template>

<script>
import CustomList from './CustomList.vue'

export default {
  components: { CustomList },
  data() {
    return {
      todos: [
        { text: '学习 Vue', icon: '📚', done: false, highlight: false },
        { text: '写代码', icon: '💻', done: true, highlight: false },
        { text: '休息', icon: '☕', done: false, highlight: true }
      ]
    }
  },
  methods: {
    toggleDone(index) {
      this.todos[index].done = !this.todos[index].done
    }
  }
}
</script>

<style scoped>
.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.done {
  text-decoration: line-through;
  color: #999;
}
button {
  margin-left: auto;
}
</style>
```

</details>

### 练习 3：挑战 - 实现一个数据表格组件

**题目**：实现一个可复用的数据表格组件，支持：
1. 通过 props 传入列定义和数据
2. 使用具名插槽自定义每列的渲染方式
3. 支持排序功能
4. 使用作用域插槽向父组件传递行数据

<details>
<summary>点击查看答案</summary>

```vue
<!-- DataTable.vue -->
<template>
  <table class="data-table">
    <thead>
      <tr>
        <th 
          v-for="col in columns" 
          :key="col.key"
          @click="col.sortable && sortBy(col.key)"
          :class="{ sortable: col.sortable }"
        >
          {{ col.title }}
          <span v-if="col.sortable">
            {{ sortKey === col.key ? (sortOrder === 'asc' ? '↑' : '↓') : '↕' }}
          </span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, index) in sortedData" :key="row.id || index">
        <td v-for="col in columns" :key="col.key">
          <!-- ✅ 使用作用域插槽，传递 row、value、index -->
          <slot 
            :name="col.key" 
            :row="row" 
            :value="row[col.key]"
            :index="index"
          >
            {{ row[col.key] }}
          </slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
export default {
  props: {
    columns: {
      type: Array,
      required: true
    },
    data: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      sortKey: '',
      sortOrder: 'asc'
    }
  },
  computed: {
    sortedData() {
      if (!this.sortKey) return this.data
      
      return [...this.data].sort((a, b) => {
        const aVal = a[this.sortKey]
        const bVal = b[this.sortKey]
        
        if (aVal === bVal) return 0
        
        const compare = aVal > bVal ? 1 : -1
        return this.sortOrder === 'asc' ? compare : -compare
      })
    }
  },
  methods: {
    sortBy(key) {
      if (this.sortKey === key) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortKey = key
        this.sortOrder = 'asc'
      }
    }
  }
}
</script>

<style scoped>
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
}
.data-table th {
  background: #f5f5f5;
  font-weight: bold;
}
.sortable {
  cursor: pointer;
  user-select: none;
}
.sortable:hover {
  background: #e5e7eb;
}
</style>
```

```vue
<!-- 使用示例 -->
<template>
  <div>
    <h2>用户管理表格</h2>
    
    <data-table :columns="columns" :data="users">
      <!-- ✅ 自定义姓名列渲染 -->
      <template #name="{ value }">
        <strong>{{ value }}</strong>
      </template>
      
      <!-- ✅ 自定义年龄列渲染 -->
      <template #age="{ value }">
        <span :class="{ 'text-red': value > 30 }">
          {{ value }}岁
        </span>
      </template>
      
      <!-- ✅ 自定义状态列渲染 -->
      <template #status="{ value }">
        <span :class="value ? 'active' : 'inactive'">
          {{ value ? '活跃' : '离线' }}
        </span>
      </template>
      
      <!-- ✅ 自定义操作列渲染 -->
      <template #action="{ row, index }">
        <button @click="edit(row, index)">编辑</button>
        <button @click="del(row, index)">删除</button>
      </template>
    </data-table>
  </div>
</template>

<script>
import DataTable from './DataTable.vue'

export default {
  components: { DataTable },
  data() {
    return {
      columns: [
        { key: 'name', title: '姓名', sortable: true },
        { key: 'age', title: '年龄', sortable: true },
        { key: 'email', title: '邮箱', sortable: false },
        { key: 'status', title: '状态', sortable: true },
        { key: 'action', title: '操作', sortable: false }
      ],
      users: [
        { id: 1, name: '张三', age: 25, email: 'zhang@example.com', status: true },
        { id: 2, name: '李四', age: 35, email: 'li@example.com', status: false },
        { id: 3, name: '王五', age: 28, email: 'wang@example.com', status: true }
      ]
    }
  },
  methods: {
    edit(row, index) {
      console.log('编辑', row, index)
    },
    del(row, index) {
      console.log('删除', row, index)
    }
  }
}
</script>

<style scoped>
.text-red {
  color: red;
  font-weight: bold;
}
.active {
  color: green;
}
.inactive {
  color: gray;
}
button {
  margin-right: 5px;
}
</style>
```

</details>

## 8. 下一章预告

太棒了！你已经掌握了 Vue 插槽的精髓。现在你可以设计出真正可复用的组件了！

下一章我们将学习 **生命周期**，这是理解 Vue 组件运行机制的关键。你会学到：
- 组件从创建到销毁的完整过程
- 各个生命周期钩子的触发时机和用途
- 如何在合适的时机执行初始化、DOM 操作、数据获取等操作

生命周期是 Vue 组件的核心概念，掌握它能让你写出更高效的代码。继续加油！
