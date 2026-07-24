---
title: "第九章：插槽"
description: "学习 Vue 2 插槽的使用，包括默认插槽、具名插槽和作用域插槽。"
---

# 第九章：插槽

## 运行结果

- **默认插槽**
  - 父组件内容插入到子组件中
  - 支持后备内容
- **具名插槽**
  - 多个插槽分发到不同位置
  - 支持默认内容
- **作用域插槽**
  - 子组件数据传递给父组件
  - 父组件自定义渲染逻辑

## 代码详解

### 1. 默认插槽

```vue
<!-- ChildComponent.vue -->
<template>
  <div class="container">
    <slot>
      <!-- 后备内容 -->
      <p>默认内容</p>
    </slot>
  </div>
</template>
```

```vue
<!-- ParentComponent.vue -->
<template>
  <child-component>
    <h1>父组件标题</h1>
    <p>父组件内容</p>
  </child-component>
</template>
```

### 2. 具名插槽

```vue
<!-- Layout.vue -->
<template>
  <div class="layout">
    <header>
      <slot name="header"></slot>
    </header>
    <main>
      <slot></slot>
    </main>
    <footer>
      <slot name="footer"></slot>
    </footer>
  </div>
</template>
```

```vue
<!-- 使用具名插槽 -->
<template>
  <layout>
    <template v-slot:header>
      <h1>页面标题</h1>
    </template>
    
    <p>主要内容</p>
    <p>更多内容</p>
    
    <template v-slot:footer>
      <p>页脚信息</p>
    </template>
  </layout>
</template>
```

### 3. 插槽缩写

```vue
<!-- Vue 2.6.0+ 缩写语法 -->
<template>
  <layout>
    <template #header>
      <h1>页面标题</h1>
    </template>
    
    <p>主要内容</p>
    
    <template #footer>
      <p>页脚信息</p>
    </template>
  </layout>
</template>
```

### 4. 作用域插槽

```vue
<!-- UserList.vue -->
<template>
  <ul>
    <li v-for="user in users" :key="user.id">
      <slot :user="user" :index="user.id">
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
        { id: 1, name: '张三', age: 25 },
        { id: 2, name: '李四', age: 30 }
      ]
    }
  }
}
</script>
```

```vue
<!-- 使用作用域插槽 -->
<template>
  <user-list>
    <template v-slot:default="slotProps">
      <span>{{ slotProps.user.name }}</span>
      <span>({{ slotProps.user.age }}岁)</span>
    </template>
  </user-list>
</template>
```

### 5. 解构插槽 Props

```vue
<template>
  <user-list>
    <template #default="{ user, index }">
      <span>{{ index }}. {{ user.name }}</span>
    </template>
  </user-list>
</template>
```

### 6. 动态插槽名

```vue
<template>
  <layout>
    <template #[dynamicSlotName]>
      <p>动态插槽内容</p>
    </template>
  </layout>
</template>

<script>
export default {
  data() {
    return {
      dynamicSlotName: 'header'
    }
  }
}
</script>
```

### 7. 其他属性

```vue
<!-- 插槽可以接收其他属性 -->
<template>
  <my-component>
    <template #header="slotProps">
      <h1 :class="slotProps.theme">
        {{ slotProps.title }}
      </h1>
    </template>
  </my-component>
</template>
```

### 8. 无渲染组件

```vue
<!-- MouseTracker.vue -->
<template>
  <slot :x="x" :y="y"></slot>
</template>

<script>
export default {
  data() {
    return {
      x: 0,
      y: 0
    }
  },
  methods: {
    update(event) {
      this.x = event.pageX
      this.y = event.pageY
    }
  },
  mounted() {
    window.addEventListener('mousemove', this.update)
  },
  beforeDestroy() {
    window.removeEventListener('mousemove', this.update)
  }
}
</script>
```

```vue
<!-- 使用无渲染组件 -->
<template>
  <mouse-tracker>
    <template #default="{ x, y }">
      <p>鼠标位置：{{ x }}, {{ y }}</p>
    </template>
  </mouse-tracker>
</template>
```

### 9. 插槽实际应用

```vue
<!-- DataTable.vue -->
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
          <slot :name="col.key" :row="row" :value="row[col.key]">
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
    columns: Array,
    data: Array
  }
}
</script>
```

```vue
<!-- 使用 DataTable -->
<template>
  <data-table :columns="columns" :data="users">
    <template #name="{ row }">
      <strong>{{ row.name }}</strong>
    </template>
    
    <template #age="{ value }">
      <span :class="{ 'text-red': value > 30 }">
        {{ value }}岁
      </span>
    </template>
    
    <template #action="{ row }">
      <button @click="edit(row)">编辑</button>
      <button @click="delete(row)">删除</button>
    </template>
  </data-table>
</template>

<script>
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
    delete(row) {
      console.log('删除', row)
    }
  }
}
</script>
```

### 10. 插槽最佳实践

```vue
<!-- 组件设计示例 -->
<template>
  <div class="card">
    <!-- 头部插槽 -->
    <div class="card-header" v-if="$slots.header">
      <slot name="header"></slot>
    </div>
    
    <!-- 默认插槽 -->
    <div class="card-body">
      <slot></slot>
    </div>
    
    <!-- 底部插槽 -->
    <div class="card-footer" v-if="$slots.footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style scoped>
.card {
  border: 1px solid #ddd;
  border-radius: 4px;
}
.card-header {
  padding: 10px;
  background: #f5f5f5;
}
.card-body {
  padding: 10px;
}
.card-footer {
  padding: 10px;
  background: #f5f5f5;
}
</style>
```

## 最佳实践

::: info
- 默认插槽用于主要内容
- 具名插槽用于多个分发位置
- 作用域插槽用于自定义渲染逻辑
- 使用 `<template>` 标签包装插槽内容
- Vue 2.6.0+ 使用 `#` 缩写语法
- 合理使用后备内容
:::
