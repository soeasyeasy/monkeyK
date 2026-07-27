---
title: "第 4 章：条件渲染与列表渲染"
description: "掌握 Vue 2 中的条件渲染和列表渲染指令，实现动态页面展示。"
---

# 第 4 章：条件渲染与列表渲染

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 怎么根据条件显示或隐藏元素？
- v-if 和 v-show 有什么区别？应该用哪个？
- 怎么循环渲染列表数据？
- 为什么 v-for 需要 key？key 有什么作用？
- 怎么更新数组和对象的数据？

这一章就是为了解答这些问题。我们会学习 **条件渲染（v-if、v-show）** 和 **列表渲染（v-for）**，搞清楚它们的使用场景和注意事项。学完之后，你就能动态地展示页面内容了。

---

## 1 为什么需要条件渲染和列表渲染？

### 痛点分析

想象一下，你要做一个用户管理页面：

**没有条件渲染和列表渲染的方式**：
```javascript
// 1. 手动创建用户列表
const users = [
  { id: 1, name: '张三', age: 25 },
  { id: 2, name: '李四', age: 30 },
  { id: 3, name: '王五', age: 28 }
]

// 2. 手动创建 DOM 元素
const ul = document.createElement('ul')
users.forEach(user => {
  const li = document.createElement('li')
  li.textContent = `${user.name} - ${user.age}岁`
  ul.appendChild(li)
})
document.getElementById('app').appendChild(ul)

// 3. 如果要添加条件判断（如只显示成年用户）
const adultUsers = users.filter(user => user.age >= 18)
const ul2 = document.createElement('ul')
adultUsers.forEach(user => {
  const li = document.createElement('li')
  li.textContent = `${user.name} - ${user.age}岁`
  ul2.appendChild(li)
})

// 4. 如果数据变了，还要手动更新 DOM
users.push({ id: 4, name: '赵六', age: 22 })
// 又要重新创建 DOM...
```

**问题**：
- 代码冗长，操作 DOM 很麻烦
- 数据和视图分离，容易不同步
- 条件判断逻辑复杂
- 维护成本高

### Vue 的解决方案

**使用条件渲染和列表渲染**：
```vue
<template>
  <div>
    <!-- 条件渲染：只显示成年用户提示 -->
    <p v-if="adultUsers.length > 0">有 {{ adultUsers.length }} 位成年用户</p>
    <p v-else>没有成年用户</p>
    
    <!-- 列表渲染：循环渲染用户列表 -->
    <ul>
      <li v-for="user in adultUsers" :key="user.id">
        {{ user.name }} - {{ user.age }}岁
      </li>
    </ul>
    
    <!-- 添加用户按钮 -->
    <button @click="addUser">添加用户</button>
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
      ]
    }
  },
  computed: {
    adultUsers() {
      return this.users.filter(user => user.age >= 18)
    }
  },
  methods: {
    addUser() {
      this.users.push({
        id: Date.now(),
        name: '新用户',
        age: 20
      })
    }
  }
}
</script>
```

**优势**：
- ✅ 代码简洁，声明式语法
- ✅ 数据变化，视图自动更新
- ✅ 条件判断清晰易懂
- ✅ 列表渲染自动处理

> **一句话总结**：条件渲染和列表渲染让你用声明式的方式控制页面展示，不用手动操作 DOM。

---

## 2 核心原理讲解

### 概念解释

Vue 提供了两类渲染指令：

1. **条件渲染**：根据条件决定是否渲染元素
   - `v-if`：真正的条件渲染，不满足条件时不渲染
   - `v-show`：通过 CSS display 控制显示/隐藏

2. **列表渲染**：循环渲染数据
   - `v-for`：遍历数组或对象，生成多个元素

打个比方：

> **v-if** 像开关灯：
> - 条件满足时，开灯（渲染元素）
> - 条件不满足时，关灯（移除元素）
> - 切换时有开销（需要创建/销毁 DOM）

> **v-show** 像拉窗帘：
> - 条件满足时，拉开窗帘（显示元素）
> - 条件不满足时，拉上窗帘（隐藏元素）
> - 元素始终存在，只是看不见

> **v-for** 像复印机：
> - 你提供一个模板（如 `<li>{{ user.name }}</li>`）
> - 数据有多少项，就复印多少份
> - 每份自动填入对应的数据

### v-if vs v-show 的底层原理

**v-if 的工作原理**：
1. 编译时，Vue 会解析 v-if 指令
2. 运行时，根据条件决定是否创建 DOM 元素
3. 条件为 false 时，元素完全不存在于 DOM 中
4. 条件变化时，会销毁旧元素、创建新元素

**v-show 的工作原理**：
1. 元素始终会被渲染到 DOM 中
2. 通过 CSS 的 `display: none` 控制显示/隐藏
3. 条件变化时，只切换 CSS 属性，不创建/销毁 DOM

### v-for 的 key 原理

**为什么需要 key？**
- Vue 使用虚拟 DOM 来优化渲染
- 当列表数据变化时，Vue 需要对比新旧虚拟 DOM
- key 是每个元素的唯一标识，帮助 Vue 快速定位变化

**没有 key 的问题**：
- Vue 只能按顺序对比，效率低
- 可能导致状态混乱（如输入框内容错位）

**有 key 的优势**：
- Vue 可以快速定位哪些元素变了
- 只更新变化的部分，性能更好
- 保持组件状态正确

---

## 3 基础用法 + 逐行注释

### 1. v-if 条件渲染

```vue
<template>
  <div>
    <!-- 基础用法：条件为 true 时渲染 -->
    <h1 v-if="awesome">Vue 太棒了！</h1>
    
    <!-- v-if、v-else-if、v-else 链式使用 -->
    <p v-if="type === 'A'">优秀</p>
    <p v-else-if="type === 'B'">良好</p>
    <p v-else-if="type === 'C'">一般</p>
    <p v-else>不及格</p>
    
    <!-- 在 template 上使用：包裹多个元素 -->
    <template v-if="show">
      <h1>标题</h1>
      <p>段落一</p>
      <p>段落二</p>
    </template>
    
    <!-- ❌ 错误：v-else 必须紧跟 v-if 或 v-else-if -->
    <!-- <p v-if="ok">显示</p> -->
    <!-- <div>中间元素</div> -->
    <!-- <p v-else>隐藏</p> -->  <!-- 会报错 -->
  </div>
</template>

<script>
export default {
  data() {
    return {
      awesome: true,   // 是否棒
      type: 'B',       // 等级
      show: true,      // 是否显示
      ok: true         // 布尔值
    }
  }
}
</script>
```

### 2. v-show 显示/隐藏

```vue
<template>
  <div>
    <!-- v-show：通过 CSS display 控制显示 -->
    <h1 v-show="ok">Hello!</h1>
    
    <!-- ✅ 正确：频繁切换使用 v-show -->
    <p v-show="isVisible">这段文字会切换显示</p>
    
    <!-- ❌ 错误：v-show 不支持 template -->
    <!-- <template v-show="isVisible"> -->
    <!--   <h1>标题</h1> -->
    <!-- </template> -->
    
    <!-- ❌ 错误：v-show 不支持 v-else -->
    <!-- <p v-show="ok">显示</p> -->
    <!-- <p v-show="!ok">隐藏</p> -->  <!-- 应该用 v-if/v-else -->
  </div>
</template>

<script>
export default {
  data() {
    return {
      ok: true,          // 是否显示
      isVisible: true    // 是否可见
    }
  }
}
</script>
```

### 3. v-if vs v-show 对比

```vue
<template>
  <div>
    <!-- v-if：真正的条件渲染，切换开销大 -->
    <p v-if="seen">现在你看到我了（v-if）</p>
    
    <!-- v-show：CSS 切换，初始渲染开销大 -->
    <p v-show="seen">现在你看到我了（v-show）</p>
    
    <!-- ✅ 推荐：条件很少改变时使用 v-if -->
    <div v-if="userRole === 'admin'">
      <h2>管理员面板</h2>
      <p>这里只有管理员能看到</p>
    </div>
    
    <!-- ✅ 推荐：频繁切换时使用 v-show -->
    <div v-show="isMenuOpen">
      <ul>
        <li>菜单项 1</li>
        <li>菜单项 2</li>
        <li>菜单项 3</li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      seen: true,           // 是否显示
      userRole: 'admin',    // 用户角色
      isMenuOpen: true      // 菜单是否打开
    }
  }
}
</script>
```

::: tip
💡 提示：
- **v-if** 有更高的切换开销，适合运行时条件很少改变的情况
- **v-show** 有更高的初始渲染开销，适合需要频繁切换的场景
:::

### 4. v-for 列表渲染

```vue
<template>
  <div>
    <!-- 遍历数组：(item, index) in array -->
    <ul>
      <li v-for="(user, index) in users" :key="user.id">
        {{ index + 1 }} - {{ user.name }} - {{ user.age }}岁
      </li>
    </ul>
    
    <!-- 遍历对象：(value, key, index) in object -->
    <div v-for="(value, key, index) in userInfo" :key="key">
      {{ index }}: {{ key }} = {{ value }}
    </div>
    
    <!-- 遍历数字范围：n in 10 -->
    <span v-for="n in 10" :key="n">{{ n }} </span>
    
    <!-- ✅ 推荐：使用计算属性过滤列表 -->
    <ul>
      <li v-for="user in activeUsers" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
    
    <!-- ❌ 不推荐：v-for 和 v-if 同时使用 -->
    <!-- <li v-for="user in users" v-if="user.active" :key="user.id"> -->
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
  },
  computed: {
    activeUsers() {
      return this.users.filter(user => user.age >= 18)
    }
  }
}
</script>
```

### 5. key 的重要性

```vue
<template>
  <div>
    <!-- ✅ 正确：使用唯一 id 作为 key -->
    <ul>
      <li v-for="user in users" :key="user.id">
        {{ user.name }}
        <input type="text" placeholder="备注" />
      </li>
    </ul>
    
    <!-- ❌ 错误：使用 index 作为 key -->
    <ul>
      <li v-for="(user, index) in users" :key="index">
        {{ user.name }}
        <input type="text" placeholder="备注" />
      </li>
    </ul>
    
    <!-- 演示问题：删除第一个用户 -->
    <button @click="removeFirstUser">删除第一个用户</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      users: [
        { id: 1, name: '张三' },
        { id: 2, name: '李四' },
        { id: 3, name: '王五' }
      ]
    }
  },
  methods: {
    removeFirstUser() {
      this.users.shift()  // 删除第一个用户
    }
  }
}
</script>
```

::: warning
⚠️ 警告：使用 index 作为 key 在列表重排时会导致状态混乱。例如，删除第一个用户后，原本第二个用户的输入框内容会跑到第一个用户那里。应该使用唯一的 id。
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
      // ✅ 变异方法（会触发视图更新）
      this.items.push('新项目')
      
      // 其他变异方法：
      // this.items.pop()           // 删除最后一个
      // this.items.shift()         // 删除第一个
      // this.items.unshift('新')   // 添加到开头
      // this.items.splice(1, 1)    // 删除索引 1 的元素
      // this.items.sort()          // 排序
      // this.items.reverse()       // 反转
    },
    updateItem() {
      // ✅ 方式一：Vue.set（推荐）
      this.$set(this.items, 0, '新项目一')
      
      // ✅ 方式二：splice
      this.items.splice(0, 1, '新项目一')
      
      // ✅ 方式三：整体替换
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
    <button @click="updateProperty">更新属性</button>
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
      // ✅ 方式一：Vue.set（推荐）
      this.$set(this.userInfo, 'city', '北京')
      
      // ✅ 方式二：Object.assign
      this.userInfo = Object.assign({}, this.userInfo, {
        city: '北京',
        gender: '男'
      })
      
      // ❌ 错误方式：直接添加属性不会触发更新
      // this.userInfo.city = '北京'
    },
    updateProperty() {
      // ✅ 直接修改已有属性会触发更新
      this.userInfo.name = '李四'
      this.userInfo.age = 30
    }
  }
}
</script>
```

### 8. 显示过滤/排序后的列表

```vue
<template>
  <div>
    <!-- 搜索输入框 -->
    <input v-model="searchQuery" placeholder="搜索用户" />
    
    <!-- 排序按钮 -->
    <button @click="toggleSort">
      {{ sortOrder === 'asc' ? '降序' : '升序' }}
    </button>
    
    <!-- 显示过滤和排序后的列表 -->
    <ul>
      <li v-for="user in filteredAndSortedUsers" :key="user.id">
        {{ user.name }} - {{ user.age }}岁
      </li>
    </ul>
    
    <!-- 统计信息 -->
    <p>共 {{ filteredAndSortedUsers.length }} 个结果</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      searchQuery: '',
      sortOrder: 'asc',
      users: [
        { id: 1, name: '张三', age: 25 },
        { id: 2, name: '李四', age: 30 },
        { id: 3, name: '王五', age: 28 }
      ]
    }
  },
  computed: {
    filteredAndSortedUsers() {
      // 1. 过滤
      let result = this.users.filter(user =>
        user.name.includes(this.searchQuery)
      )
      
      // 2. 排序
      result = result.sort((a, b) => {
        if (this.sortOrder === 'asc') {
          return a.age - b.age
        } else {
          return b.age - a.age
        }
      })
      
      return result
    }
  },
  methods: {
    toggleSort() {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
    }
  }
}
</script>
```

### 9. v-for 与 v-if 同时使用

```vue
<template>
  <div>
    <!-- ❌ 不推荐：v-for 优先级高于 v-if，每次渲染都会遍历所有用户 -->
    <li v-for="user in users" v-if="user.active" :key="user.id">
      {{ user.name }}
    </li>
    
    <!-- ✅ 推荐：使用 computed 过滤 -->
    <li v-for="user in activeUsers" :key="user.id">
      {{ user.name }}
    </li>
    
    <!-- ✅ 另一种方式：使用 template 包裹 -->
    <template v-for="user in users">
      <li v-if="user.active" :key="user.id">
        {{ user.name }}
      </li>
    </template>
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

::: warning
⚠️ 注意：在 Vue 2 中，v-for 的优先级高于 v-if，所以同时使用时会遍历所有元素再过滤，性能较差。推荐使用计算属性先过滤再渲染。
:::

---

## 4 对比表格

### v-if vs v-show 对比

| 特性 | v-if | v-show |
| --- | --- | --- |
| 渲染方式 | 真正的条件渲染，不满足条件时不渲染 | 总是渲染，通过 CSS display 控制 |
| DOM 存在 | 条件为 false 时不存在 | 始终存在于 DOM 中 |
| 切换开销 | 高（需要创建/销毁 DOM） | 低（只切换 CSS） |
| 初始渲染开销 | 低（不渲染不满足条件的） | 高（所有元素都会渲染） |
| 支持 template | ✅ 支持 | ❌ 不支持 |
| 支持 v-else | ✅ 支持 | ❌ 不支持 |
| 支持 v-else-if | ✅ 支持 | ❌ 不支持 |
| CSS 过渡 | ✅ 支持 | ✅ 支持 |
| 使用场景 | 条件很少改变 | 频繁切换显示/隐藏 |

### v-for 遍历对比

| 遍历对象 | 语法 | 参数说明 | 示例 |
| --- | --- | --- | --- |
| 数组 | `v-for="(item, index) in items"` | item: 当前项, index: 索引 | `<li v-for="(user, i) in users">` |
| 对象 | `v-for="(value, key, index) in obj"` | value: 值, key: 键, index: 索引 | `<div v-for="(val, key) in obj">` |
| 数字 | `v-for="n in 10"` | n: 从 1 到 10 的数字 | `<span v-for="n in 10">{{ n }}</span>` |

### 数组更新方法对比

| 方法 | 用途 | 是否触发更新 | 示例 |
| --- | --- | --- | --- |
| push() | 添加到末尾 | ✅ | `items.push('新项')` |
| pop() | 删除末尾 | ✅ | `items.pop()` |
| shift() | 删除开头 | ✅ | `items.shift()` |
| unshift() | 添加到开头 | ✅ | `items.unshift('新项')` |
| splice() | 删除/插入/替换 | ✅ | `items.splice(1, 1, '新项')` |
| sort() | 排序 | ✅ | `items.sort()` |
| reverse() | 反转 | ✅ | `items.reverse()` |
| 索引赋值 | 修改指定索引 | ❌ | `items[0] = '新项'` |
| 修改长度 | 改变数组长度 | ❌ | `items.length = 0` |

### 对象更新方法对比

| 方法 | 用途 | 是否触发更新 | 示例 |
| --- | --- | --- | --- |
| 修改已有属性 | 更新属性值 | ✅ | `obj.name = '新值'` |
| Vue.set() | 添加新属性 | ✅ | `this.$set(obj, 'newKey', value)` |
| Object.assign() | 合并对象 | ✅ | `obj = Object.assign({}, obj, { newKey: value })` |
| 直接添加属性 | 添加新属性 | ❌ | `obj.newKey = value` |

---

## 5 新手常见误区

### 误区 1："v-if 和 v-show 可以随便用"

**错！** 它们有不同的使用场景：

```vue
<!-- ❌ 错误：频繁切换使用 v-if -->
<button @click="toggle">切换</button>
<div v-if="isVisible">内容</div>  <!-- 每次切换都要创建/销毁 DOM -->

<!-- ✅ 正确：频繁切换使用 v-show -->
<button @click="toggle">切换</button>
<div v-show="isVisible">内容</div>  <!-- 只切换 CSS，性能好 -->

<!-- ❌ 错误：条件很少改变使用 v-show -->
<div v-show="userRole === 'admin'">管理员面板</div>  <!-- 始终渲染，浪费资源 -->

<!-- ✅ 正确：条件很少改变使用 v-if -->
<div v-if="userRole === 'admin'">管理员面板</div>  <!-- 不满足条件时不渲染 -->
```

### 误区 2："v-for 可以不用 key"

**错！** v-for 必须提供唯一的 key：

```vue
<!-- ❌ 错误：没有 key -->
<!-- <li v-for="user in users">{{ user.name }}</li> -->

<!-- ❌ 不推荐：使用 index 作为 key -->
<!-- <li v-for="(user, index) in users" :key="index">{{ user.name }}</li> -->

<!-- ✅ 正确：使用唯一 id -->
<li v-for="user in users" :key="user.id">{{ user.name }}</li>
```

**为什么不能用 index？**
- 当列表重排时，index 也会变化
- Vue 无法正确追踪元素，导致状态混乱
- 例如：删除第一个用户后，输入框内容会错位

### 误区 3："可以直接通过索引修改数组"

**错！** Vue 2 无法检测通过索引修改数组的变化：

```javascript
// ❌ 错误：不会触发视图更新
this.items[0] = '新项目'

// ✅ 正确：使用 Vue.set
this.$set(this.items, 0, '新项目')

// ✅ 正确：使用 splice
this.items.splice(0, 1, '新项目')

// ✅ 正确：整体替换
this.items = ['新项目', ...this.items.slice(1)]
```

### 误区 4："可以直接给对象添加新属性"

**错！** Vue 2 无法检测对象属性的添加：

```javascript
// ❌ 错误：不会触发视图更新
this.userInfo.newProperty = '值'

// ✅ 正确：使用 Vue.set
this.$set(this.userInfo, 'newProperty', '值')

// ✅ 正确：使用 Object.assign
this.userInfo = Object.assign({}, this.userInfo, {
  newProperty: '值'
})
```

### 误区 5："v-for 和 v-if 可以同时使用"

**不推荐！** v-for 优先级高于 v-if，会导致性能问题：

```vue
<!-- ❌ 不推荐：每次渲染都会遍历所有用户 -->
<li v-for="user in users" v-if="user.active" :key="user.id">
  {{ user.name }}
</li>

<!-- ✅ 推荐：使用计算属性过滤 -->
<li v-for="user in activeUsers" :key="user.id">
  {{ user.name }}
</li>

<script>
computed: {
  activeUsers() {
    return this.users.filter(user => user.active)
  }
}
</script>
```

---

## 6 动手练习

### 练习 1：基础练习 - 用户等级显示

创建一个用户等级显示页面：
- 定义用户数据（包含姓名和等级：A/B/C/D）
- 使用 v-if/v-else-if/v-else 显示不同等级的提示
- 使用 v-show 切换显示详细信息
- 使用 v-for 渲染用户列表

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div class="user-level">
    <h2>用户等级</h2>
    
    <!-- 用户列表 -->
    <ul class="user-list">
      <li v-for="user in users" :key="user.id" class="user-item">
        <!-- 用户基本信息 -->
        <div class="user-info">
          <span class="name">{{ user.name }}</span>
          
          <!-- 等级显示 -->
          <span class="level" :class="getLevelClass(user.level)">
            {{ user.level }}
          </span>
        </div>
        
        <!-- 等级提示 -->
        <div class="level-tip">
          <p v-if="user.level === 'A'">优秀！继续保持</p>
          <p v-else-if="user.level === 'B'">良好，还有进步空间</p>
          <p v-else-if="user.level === 'C'">一般，需要加油</p>
          <p v-else>不及格，请努力</p>
        </div>
        
        <!-- 详细信息切换 -->
        <button @click="toggleDetail(user.id)">
          {{ expandedUsers.includes(user.id) ? '收起' : '展开' }}
        </button>
        
        <!-- 详细信息 -->
        <div v-show="expandedUsers.includes(user.id)" class="detail">
          <p>年龄：{{ user.age }}岁</p>
          <p>城市：{{ user.city }}</p>
          <p>得分：{{ user.score }}分</p>
        </div>
      </li>
    </ul>
    
    <!-- 统计信息 -->
    <div class="stats">
      <p>总人数：{{ users.length }}</p>
      <p>优秀人数：{{ excellentCount }}</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      users: [
        { id: 1, name: '张三', level: 'A', age: 25, city: '北京', score: 95 },
        { id: 2, name: '李四', level: 'B', age: 30, city: '上海', score: 85 },
        { id: 3, name: '王五', level: 'C', age: 28, city: '广州', score: 70 },
        { id: 4, name: '赵六', level: 'D', age: 22, city: '深圳', score: 55 }
      ],
      expandedUsers: []  // 展开详情的用户 ID
    }
  },
  computed: {
    excellentCount() {
      return this.users.filter(user => user.level === 'A').length
    }
  },
  methods: {
    toggleDetail(userId) {
      const index = this.expandedUsers.indexOf(userId)
      if (index > -1) {
        this.expandedUsers.splice(index, 1)
      } else {
        this.expandedUsers.push(userId)
      }
    },
    getLevelClass(level) {
      return {
        'A': 'level-a',
        'B': 'level-b',
        'C': 'level-c',
        'D': 'level-d'
      }[level]
    }
  }
}
</script>

<style scoped>
.user-level {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.user-list {
  list-style: none;
  padding: 0;
}

.user-item {
  border: 1px solid #ddd;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 4px;
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.name {
  font-size: 18px;
  font-weight: bold;
}

.level {
  padding: 5px 10px;
  border-radius: 4px;
  font-weight: bold;
}

.level-a {
  background: #27ae60;
  color: white;
}

.level-b {
  background: #3498db;
  color: white;
}

.level-c {
  background: #f39c12;
  color: white;
}

.level-d {
  background: #e74c3c;
  color: white;
}

.level-tip {
  margin: 10px 0;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
}

.detail {
  margin-top: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.stats {
  margin-top: 20px;
  padding: 15px;
  background: #ecf0f1;
  border-radius: 4px;
}

button {
  padding: 6px 12px;
  cursor: pointer;
}
</style>
```

</details>

### 练习 2：进阶练习 - 商品筛选排序

创建一个商品列表页面：
- 定义商品数据（包含名称、价格、分类、库存）
- 使用输入框搜索商品名称
- 使用下拉框选择分类筛选
- 使用按钮切换价格排序（升序/降序）
- 使用 v-for 渲染筛选和排序后的商品列表

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div class="product-list">
    <h2>商品列表</h2>
    
    <!-- 搜索和筛选 -->
    <div class="filters">
      <input 
        v-model="searchQuery" 
        placeholder="搜索商品名称"
        class="search-input"
      />
      
      <select v-model="selectedCategory" class="category-select">
        <option value="">全部分类</option>
        <option v-for="cat in categories" :key="cat" :value="cat">
          {{ cat }}
        </option>
      </select>
      
      <button @click="toggleSort" class="sort-btn">
        价格 {{ sortOrder === 'asc' ? '↑' : '↓' }}
      </button>
    </div>
    
    <!-- 商品列表 -->
    <div class="products">
      <div 
        v-for="product in filteredProducts" 
        :key="product.id"
        class="product-card"
      >
        <h3>{{ product.name }}</h3>
        <p class="category">分类：{{ product.category }}</p>
        <p class="price">¥{{ product.price }}</p>
        <p class="stock" :class="{ 'out-of-stock': product.stock === 0 }">
          库存：{{ product.stock }}
        </p>
        <button 
          :disabled="product.stock === 0"
          class="buy-btn"
        >
          {{ product.stock === 0 ? '售罄' : '购买' }}
        </button>
      </div>
    </div>
    
    <!-- 无结果提示 -->
    <div v-if="filteredProducts.length === 0" class="no-result">
      没有找到匹配的商品
    </div>
    
    <!-- 统计信息 -->
    <div class="stats">
      <p>共 {{ filteredProducts.length }} 个商品</p>
      <p>总价：¥{{ totalPrice }}</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      searchQuery: '',
      selectedCategory: '',
      sortOrder: 'asc',
      products: [
        { id: 1, name: 'iPhone 15', price: 5999, category: '手机', stock: 10 },
        { id: 2, name: 'iPad Pro', price: 6999, category: '平板', stock: 5 },
        { id: 3, name: 'MacBook Pro', price: 12999, category: '电脑', stock: 3 },
        { id: 4, name: 'AirPods', price: 1299, category: '耳机', stock: 20 },
        { id: 5, name: 'Apple Watch', price: 2999, category: '手表', stock: 0 },
        { id: 6, name: 'iPhone 14', price: 4999, category: '手机', stock: 15 }
      ]
    }
  },
  computed: {
    categories() {
      return [...new Set(this.products.map(p => p.category))]
    },
    filteredProducts() {
      let result = [...this.products]
      
      // 1. 搜索过滤
      if (this.searchQuery) {
        result = result.filter(p =>
          p.name.toLowerCase().includes(this.searchQuery.toLowerCase())
        )
      }
      
      // 2. 分类过滤
      if (this.selectedCategory) {
        result = result.filter(p => p.category === this.selectedCategory)
      }
      
      // 3. 价格排序
      result.sort((a, b) => {
        if (this.sortOrder === 'asc') {
          return a.price - b.price
        } else {
          return b.price - a.price
        }
      })
      
      return result
    },
    totalPrice() {
      return this.filteredProducts
        .reduce((sum, p) => sum + p.price, 0)
        .toFixed(2)
    }
  },
  methods: {
    toggleSort() {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
    }
  }
}
</script>

<style scoped>
.product-list {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.category-select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.sort-btn {
  padding: 8px 16px;
  cursor: pointer;
}

.products {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.product-card {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 4px;
}

.product-card h3 {
  margin: 0 0 10px 0;
}

.category {
  color: #666;
  font-size: 14px;
}

.price {
  color: #e74c3c;
  font-size: 20px;
  font-weight: bold;
  margin: 10px 0;
}

.stock {
  color: #27ae60;
  margin: 10px 0;
}

.out-of-stock {
  color: #999;
}

.buy-btn {
  width: 100%;
  padding: 8px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.buy-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.no-result {
  text-align: center;
  padding: 40px;
  color: #999;
}

.stats {
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
}
</style>
```

</details>

### 练习 3（挑战）：综合练习 - 待办事项管理

创建一个完整的待办事项管理应用：
- 定义待办数据（包含内容、完成状态、优先级、创建时间）
- 使用 v-if/v-show 控制不同状态的显示
- 使用 v-for 渲染待办列表
- 支持添加、删除、修改、标记完成
- 支持按状态筛选（全部/未完成/已完成）
- 支持按优先级排序
- 使用计算属性统计信息

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div class="todo-app">
    <h2>待办事项管理</h2>
    
    <!-- 添加待办 -->
    <div class="add-todo">
      <input 
        v-model="newTodo" 
        @keyup.enter="addTodo"
        placeholder="输入待办事项"
        class="todo-input"
      />
      <select v-model="newPriority" class="priority-select">
        <option value="low">低优先级</option>
        <option value="medium">中优先级</option>
        <option value="high">高优先级</option>
      </select>
      <button @click="addTodo" class="add-btn">添加</button>
    </div>
    
    <!-- 筛选 -->
    <div class="filters">
      <button 
        v-for="filter in filters" 
        :key="filter.value"
        @click="currentFilter = filter.value"
        :class="{ active: currentFilter === filter.value }"
        class="filter-btn"
      >
        {{ filter.label }}
      </button>
      
      <button @click="toggleSort" class="sort-btn">
        优先级 {{ sortOrder === 'asc' ? '↑' : '↓' }}
      </button>
    </div>
    
    <!-- 待办列表 -->
    <ul class="todo-list">
      <li 
        v-for="todo in filteredTodos" 
        :key="todo.id"
        :class="['todo-item', `priority-${todo.priority}`, { completed: todo.completed }]"
      >
        <!-- 复选框 -->
        <input 
          type="checkbox" 
          v-model="todo.completed"
          @change="toggleTodo(todo.id)"
        />
        
        <!-- 待办内容 -->
        <div class="todo-content">
          <span class="todo-text">{{ todo.text }}</span>
          <div class="todo-meta">
            <span class="priority-badge">
              {{ getPriorityLabel(todo.priority) }}
            </span>
            <span class="create-time">
              {{ formatTime(todo.createdAt) }}
            </span>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="todo-actions">
          <button @click="editTodo(todo)" class="edit-btn">编辑</button>
          <button @click="deleteTodo(todo.id)" class="delete-btn">删除</button>
        </div>
      </li>
    </ul>
    
    <!-- 无结果提示 -->
    <div v-if="filteredTodos.length === 0" class="no-result">
      {{ currentFilter === 'all' ? '暂无待办事项' : '没有匹配的待办事项' }}
    </div>
    
    <!-- 编辑对话框 -->
    <div v-if="editingTodo" class="edit-dialog">
      <div class="dialog-content">
        <h3>编辑待办</h3>
        <input v-model="editingTodo.text" class="edit-input" />
        <select v-model="editingTodo.priority">
          <option value="low">低优先级</option>
          <option value="medium">中优先级</option>
          <option value="high">高优先级</option>
        </select>
        <div class="dialog-actions">
          <button @click="saveEdit" class="save-btn">保存</button>
          <button @click="cancelEdit" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>
    
    <!-- 统计信息 -->
    <div class="stats">
      <p>总计：{{ todos.length }} 项</p>
      <p>已完成：{{ completedCount }} 项</p>
      <p>未完成：{{ todos.length - completedCount }} 项</p>
      <p>完成率：{{ completionRate }}%</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      newTodo: '',
      newPriority: 'medium',
      todos: [
        { id: 1, text: '学习 Vue', completed: true, priority: 'high', createdAt: Date.now() - 86400000 },
        { id: 2, text: '做项目', completed: false, priority: 'high', createdAt: Date.now() - 43200000 },
        { id: 3, text: '写文档', completed: false, priority: 'medium', createdAt: Date.now() }
      ],
      currentFilter: 'all',
      sortOrder: 'desc',
      editingTodo: null,
      filters: [
        { label: '全部', value: 'all' },
        { label: '未完成', value: 'active' },
        { label: '已完成', value: 'completed' }
      ]
    }
  },
  computed: {
    filteredTodos() {
      let result = [...this.todos]
      
      // 1. 状态过滤
      if (this.currentFilter === 'active') {
        result = result.filter(todo => !todo.completed)
      } else if (this.currentFilter === 'completed') {
        result = result.filter(todo => todo.completed)
      }
      
      // 2. 优先级排序
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      result.sort((a, b) => {
        const diff = priorityOrder[a.priority] - priorityOrder[b.priority]
        return this.sortOrder === 'desc' ? -diff : diff
      })
      
      return result
    },
    completedCount() {
      return this.todos.filter(todo => todo.completed).length
    },
    completionRate() {
      if (this.todos.length === 0) return 0
      return ((this.completedCount / this.todos.length) * 100).toFixed(1)
    }
  },
  methods: {
    addTodo() {
      if (this.newTodo.trim()) {
        this.todos.push({
          id: Date.now(),
          text: this.newTodo,
          completed: false,
          priority: this.newPriority,
          createdAt: Date.now()
        })
        this.newTodo = ''
        this.newPriority = 'medium'
      }
    },
    deleteTodo(id) {
      this.todos = this.todos.filter(todo => todo.id !== id)
    },
    toggleTodo(id) {
      const todo = this.todos.find(todo => todo.id === id)
      if (todo) {
        todo.completed = !todo.completed
      }
    },
    editTodo(todo) {
      this.editingTodo = { ...todo }
    },
    saveEdit() {
      const index = this.todos.findIndex(todo => todo.id === this.editingTodo.id)
      if (index > -1) {
        this.todos[index] = { ...this.editingTodo }
      }
      this.editingTodo = null
    },
    cancelEdit() {
      this.editingTodo = null
    },
    toggleSort() {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
    },
    getPriorityLabel(priority) {
      return {
        high: '高优先级',
        medium: '中优先级',
        low: '低优先级'
      }[priority]
    },
    formatTime(timestamp) {
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now - date
      
      if (diff < 3600000) {
        return Math.floor(diff / 60000) + '分钟前'
      } else if (diff < 86400000) {
        return Math.floor(diff / 3600000) + '小时前'
      } else {
        return Math.floor(diff / 86400000) + '天前'
      }
    }
  }
}
</script>

<style scoped>
.todo-app {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.add-todo {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.todo-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.priority-select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.add-btn {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.filter-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}

.filter-btn.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.sort-btn {
  padding: 6px 12px;
  cursor: pointer;
}

.todo-list {
  list-style: none;
  padding: 0;
  margin-bottom: 20px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  border: 1px solid #ddd;
  margin-bottom: 10px;
  border-radius: 4px;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: #999;
}

.priority-high {
  border-left: 4px solid #e74c3c;
}

.priority-medium {
  border-left: 4px solid #f39c12;
}

.priority-low {
  border-left: 4px solid #27ae60;
}

.todo-content {
  flex: 1;
}

.todo-text {
  font-size: 16px;
  margin-bottom: 5px;
}

.todo-meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #666;
}

.priority-badge {
  padding: 2px 6px;
  background: #ecf0f1;
  border-radius: 3px;
}

.todo-actions {
  display: flex;
  gap: 5px;
}

.edit-btn, .delete-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.edit-btn {
  background: #3498db;
  color: white;
}

.delete-btn {
  background: #e74c3c;
  color: white;
}

.no-result {
  text-align: center;
  padding: 40px;
  color: #999;
}

.edit-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  min-width: 300px;
}

.dialog-content h3 {
  margin: 0 0 15px 0;
}

.edit-input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.dialog-content select {
  width: 100%;
  padding: 8px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.dialog-actions {
  display: flex;
  gap: 10px;
}

.save-btn, .cancel-btn {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn {
  background: #27ae60;
  color: white;
}

.cancel-btn {
  background: #95a5a6;
  color: white;
}

.stats {
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
}

.stats p {
  margin: 5px 0;
}
</style>
```

</details>

---

## 下一章预告

下一章我们会学习 **事件处理**——Vue 中处理用户交互的核心机制。你会学到：
- 事件绑定的多种方式
- 事件修饰符的使用
- 按键修饰符的使用
- 事件对象的使用
- 自定义事件
