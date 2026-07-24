---
title: "第四章：条件渲染与列表渲染"
description: "学习 Vue 2 中的条件渲染指令 v-if、v-show 和列表渲染指令 v-for。"
---

# 第四章：条件渲染与列表渲染

## 运行结果

- **条件渲染**
  - 根据 `isVisible` 显示/隐藏元素
  - 根据 `score` 显示不同等级
- **列表渲染**
  - 渲染用户列表
  - 渲染对象属性
  - 遍历数字范围

## 代码详解

### 1. v-if 条件渲染

```vue
<template>
  <div>
    <!-- 基础用法 -->
    <h1 v-if="awesome">Vue 太棒了！</h1>
    
    <!-- v-if、v-else-if、v-else -->
    <p v-if="type === 'A'">优秀</p>
    <p v-else-if="type === 'B'">良好</p>
    <p v-else-if="type === 'C'">一般</p>
    <p v-else>不及格</p>
    
    <!-- 在 template 上使用 -->
    <template v-if="show">
      <h1>标题</h1>
      <p>段落一</p>
      <p>段落二</p>
    </template>
  </div>
</template>

<script>
export default {
  data() {
    return {
      awesome: true,
      type: 'B',
      show: true
    }
  }
}
</script>
```

### 2. v-show

```vue
<template>
  <div>
    <!-- v-show：通过 CSS display 控制显示 -->
    <h1 v-show="ok">Hello!</h1>
    
    <!-- v-show 不支持 template -->
    <!-- v-show 不支持 v-else -->
  </div>
</template>

<script>
export default {
  data() {
    return {
      ok: true
    }
  }
}
</script>
```

### 3. v-if vs v-show

```vue
<template>
  <div>
    <!-- v-if：真正的条件渲染，切换开销大 -->
    <p v-if="seen">现在你看到我了（v-if）</p>
    
    <!-- v-show：CSS 切换，初始渲染开销大 -->
    <p v-show="seen">现在你看到我了（v-show）</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      seen: true
    }
  }
}
</script>
```

::: tip
- **v-if**：有更高的切换开销，适合运行时条件很少改变的情况
- **v-show**：有更高的初始渲染开销，适合需要频繁切换的场景
:::

### 4. v-for 列表渲染

```vue
<template>
  <div>
    <!-- 遍历数组 -->
    <ul>
      <li v-for="(user, index) in users" :key="user.id">
        {{ index + 1 }} - {{ user.name }} - {{ user.age }}岁
      </li>
    </ul>
    
    <!-- 遍历对象 -->
    <div v-for="(value, key, index) in userInfo" :key="key">
      {{ index }}: {{ key }} = {{ value }}
    </div>
    
    <!-- 遍历数字范围 -->
    <span v-for="n in 10" :key="n">{{ n }} </span>
  </div>
</template>

<script>
export default {
  data() {
    return {
      users: [
        { id: 1, name: '张三', age: 25 },
        { id: 2, name: '李四', age: 30 },
        { id: 3, name: '王五', age: 28 }
      ],
      userInfo: {
        name: '张三',
        age: 25,
        city: '北京'
      }
    }
  }
}
</script>
```

### 5. key 的重要性

```vue
<template>
  <div>
    <!-- 正确：使用唯一 key -->
    <ul>
      <li v-for="user in users" :key="user.id">
        {{ user.name }}
        <input type="text" />
      </li>
    </ul>
    
    <!-- 错误：使用 index 作为 key -->
    <ul>
      <li v-for="(user, index) in users" :key="index">
        {{ user.name }}
        <input type="text" />
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  data() {
    return {
      users: [
        { id: 1, name: '张三' },
        { id: 2, name: '李四' }
      ]
    }
  }
}
</script>
```

::: warning
使用 index 作为 key 在列表重排时会导致状态混乱，应该使用唯一的 id。
:::

### 6. 数组更新检测

```vue
<template>
  <div>
    <button @click="addItem">添加项目</button>
    <button @click="updateItem">更新项目</button>
    <ul>
      <li v-for="(item, index) in items" :key="index">
        {{ item }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: ['项目一', '项目二', '项目三']
    }
  },
  methods: {
    addItem() {
      // 变异方法（会触发视图更新）
      this.items.push('新项目')
      // 其他变异方法：pop、shift、unshift、splice、sort、reverse
    },
    updateItem() {
      // 方式一：Vue.set（推荐）
      this.$set(this.items, 0, '新项目一')
      
      // 方式二：splice
      this.items.splice(0, 1, '新项目一')
      
      // 方式三：整体替换
      this.items = ['新项目一', ...this.items.slice(1)]
      
      // ❌ 错误方式：直接通过索引修改不会触发更新
      // this.items[0] = '新项目一'
    }
  }
}
</script>
```

### 7. 对象更新检测

```vue
<template>
  <div>
    <button @click="addProperty">添加属性</button>
    <p>{{ userInfo }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      userInfo: {
        name: '张三',
        age: 25
      }
    }
  },
  methods: {
    addProperty() {
      // 方式一：Vue.set（推荐）
      this.$set(this.userInfo, 'city', '北京')
      
      // 方式二：Object.assign
      this.userInfo = Object.assign({}, this.userInfo, {
        city: '北京',
        gender: '男'
      })
      
      // ❌ 错误方式：直接添加属性不会触发更新
      // this.userInfo.city = '北京'
    }
  }
}
</script>
```

### 8. 显示过滤/排序后的列表

```vue
<template>
  <div>
    <input v-model="searchQuery" placeholder="搜索" />
    <ul>
      <li v-for="user in filteredUsers" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  data() {
    return {
      searchQuery: '',
      users: [
        { id: 1, name: '张三' },
        { id: 2, name: '李四' },
        { id: 3, name: '王五' }
      ]
    }
  },
  computed: {
    filteredUsers() {
      return this.users.filter(user =>
        user.name.includes(this.searchQuery)
      )
    }
  }
}
</script>
```

### 9. v-for 与 v-if 同时使用

```vue
<template>
  <div>
    <!-- 不推荐：v-for 优先级高于 v-if -->
    <li v-for="user in users" v-if="user.active" :key="user.id">
      {{ user.name }}
    </li>
    
    <!-- 推荐：使用 computed 过滤 -->
    <li v-for="user in activeUsers" :key="user.id">
      {{ user.name }}
    </li>
  </div>
</template>

<script>
export default {
  data() {
    return {
      users: [
        { id: 1, name: '张三', active: true },
        { id: 2, name: '李四', active: false },
        { id: 3, name: '王五', active: true }
      ]
    }
  },
  computed: {
    activeUsers() {
      return this.users.filter(user => user.active)
    }
  }
}
</script>
```

## 最佳实践

::: info
- 列表渲染必须提供唯一的 `key` 属性
- 频繁切换显示/隐藏使用 `v-show`，条件很少改变使用 `v-if`
- 避免在模板中使用复杂过滤逻辑，使用计算属性
- 使用 `Vue.set` 或 `this.$set` 添加响应式属性
- 不要使用 index 作为 key，除非列表不会重排
:::
