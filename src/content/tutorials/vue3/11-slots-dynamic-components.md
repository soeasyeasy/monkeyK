---
title: '第十一章：插槽与动态组件'
description: '掌握 Vue 3 插槽的高级用法和动态组件的使用'
---

# 第十一章：插槽与动态组件

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 组件里的 `<slot>` 到底是什么？和 props 有什么区别？
- 子组件怎么把数据"传回"给父组件的插槽？作用域插槽看着好晕怎么办？
- `<component :is="...">` 动态组件到底什么时候用？和 `v-if` 切换有什么区别？
- `<keep-alive>` 缓存组件的原理是什么？`include` 和 `exclude` 怎么配？

这一章就是为了解答这些问题。我们会先搞清楚 **插槽的本质**，再学会 **动态组件 + keep-alive** 的组合拳，最后动手写几个实用组件。

---

## 1 为什么需要插槽和动态组件？

### 痛点分析：没有插槽时会怎样？

想象你要做一个按钮组件 `MyButton`。如果没有插槽，你可能这样写：

```vue
<!-- ❌ 没有插槽的写法：把文本写死在组件里 -->
<script setup lang="ts">
// 只能通过 props 传文本
defineProps<{ text: string }>()
</script>

<template>
  <button class="btn">{{ text }}</button>
</template>
```

```vue
<!-- 父组件：想放个图标都不行 -->
<MyButton text="点击我" />
<!-- ❌ 想加个图标？没办法，组件内部写死了 -->
```

**问题很明显**：组件的内容完全由子组件控制，父组件只能传字符串，想自定义内部结构根本做不到。

### 生活化类比：插槽 = 占位符

打个比方：

> 插槽就像**相框里的空位**。相框（子组件）决定了大小、边框样式，但里面放什么照片（内容），由你来决定（父组件）。

### 解决方案

有了插槽，父组件可以往子组件的"坑位"里塞任意内容：

```vue
<!-- ✅ 有了插槽：父组件可以塞任意内容 -->
<MyButton>
  <img src="icon.png" /> 点击我
</MyButton>
```

> **一句话总结**：插槽让组件变成了"可定制的容器"，父组件可以控制子组件内部长什么样。

---

## 2 核心原理

### 概念解释

**插槽的本质**：子组件在模板里挖一个"坑"（`<slot />`），父组件往这个坑里填内容。填进去的内容在**父组件的作用域**里编译，所以父组件的变量都能用。

打个比方：

> 插槽就像**餐厅的套餐**。餐厅（子组件）提供了盘子（插槽位置），但每个盘子里装什么菜（内容），由顾客（父组件）自己选。

**作用域插槽**则反过来——子组件把数据"递"出来，让父组件在填内容时能用子组件的数据。

> 就像**自助餐厅**：餐厅告诉你"这是牛排（数据）"，但你怎么切、怎么摆盘（模板），由你自己决定。

### 动态组件原理

`<component :is="xxx">` 就是一个"万能容器"，`is` 绑定谁就渲染谁。

> 就像**电视遥控器**：你按哪个频道键（切换组件），屏幕就显示哪个台的内容。

### 对比分析

| 特性     | Props                | 插槽               | 作用域插槽                         |
| -------- | -------------------- | ------------------ | ---------------------------------- |
| 数据流向 | 父 → 子              | 父 → 子（内容）    | 子 → 父（数据）+ 父 → 子（模板）   |
| 传什么   | 字符串/对象等数据    | 任意模板内容       | 子组件先给数据，父组件决定怎么渲染 |
| 典型场景 | 传配置、传文本       | 自定义组件内部结构 | 列表项自定义渲染                   |
| 类比     | 给相框指定照片文件名 | 直接往相框里塞照片 | 相框告诉你照片尺寸，你再决定怎么放 |

---

## 3 基础用法 + 逐行注释

### 11.3.1 默认插槽

```vue
<!-- MyButton.vue - 子组件 -->
<script setup lang="ts">
// 子组件不需要为插槽做任何特殊处理
// 插槽是模板层面的事，和逻辑无关
</script>

<template>
  <button class="btn">
    <!-- <slot> 定义了一个"坑位" -->
    <!-- 如果父组件没填内容，就显示"默认按钮文本" -->
    <slot>默认按钮文本</slot>
  </button>
</template>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
// 导入子组件
import MyButton from './MyButton.vue'
</script>

<template>
  <!-- ✅ 正确：往插槽里塞了"点击我"这段内容 -->
  <MyButton>点击我</MyButton>

  <!-- ✅ 正确：不填内容，会显示默认的"默认按钮文本" -->
  <MyButton />
</template>
```

> **原理**：`<slot>` 标签就是告诉 Vue"这里可以放东西"。父组件写在 `<MyButton>` 标签内部的内容，会被"分发"到 `<slot>` 的位置。

---

### 11.3.2 具名插槽

当一个组件需要多个"坑位"时，就要给插槽起名字：

```vue
<!-- Card.vue - 子组件 -->
<script setup lang="ts">
// 不需要任何逻辑，纯模板的事
</script>

<template>
  <div class="card">
    <!-- name="header" 给这个插槽起名叫 header -->
    <div class="card-header">
      <slot name="header">默认标题</slot>
    </div>
    <!-- 没有 name 的就是默认插槽，name 值是 "default" -->
    <div class="card-body">
      <slot>默认内容</slot>
    </div>
    <!-- 又一个具名插槽 -->
    <div class="card-footer">
      <slot name="footer">默认底部</slot>
    </div>
  </div>
</template>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
// 导入卡片组件
import Card from './Card.vue'
</script>

<template>
  <Card>
    <!-- ✅ #header 是 v-slot:header 的简写 -->
    <!-- 用 <template> 包裹，告诉 Vue "这段内容放到 header 插槽" -->
    <template #header>
      <h3>卡片标题</h3>
    </template>

    <!-- #default 对应默认插槽（可以省略不写） -->
    <template #default>
      <p>卡片内容</p>
    </template>

    <!-- #footer 对应 footer 插槽 -->
    <template #footer>
      <button>操作按钮</button>
    </template>
  </Card>
</template>
```

> **注意**：`#header` 是 `v-slot:header` 的简写。`<template>` 只是一个"包装器"，不会渲染成真实 DOM。

---

### 11.3.3 作用域插槽

这是最难理解的部分，但别怕——本质就是"子组件给数据，父组件出模板"。

```vue
<!-- UserList.vue - 子组件 -->
<script setup lang="ts">
// 定义用户数据
const users = [
  { id: 1, name: '张三', age: 25 }, // 第一个用户
  { id: 2, name: '李四', age: 30 }, // 第二个用户
  { id: 3, name: '王五', age: 28 }, // 第三个用户
]
</script>

<template>
  <ul>
    <!-- 遍历用户列表 -->
    <li v-for="user in users" :key="user.id">
      <!-- :user="user" 把当前用户数据"递"给父组件 -->
      <!-- :index="user.id" 同时递出索引 -->
      <!-- 父组件拿到这些数据后，自己决定怎么渲染 -->
      <slot :user="user" :index="user.id">
        <!-- 如果父组件没自定义，就用这个默认渲染 -->
        {{ user.name }}
      </slot>
    </li>
  </ul>
</template>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
// 导入列表组件
import UserList from './UserList.vue'
</script>

<template>
  <UserList>
    <!-- ✅ #default="{ user, index }" 解构拿到子组件递出来的数据 -->
    <!-- 这里的 user 和 index 就是子组件通过 :user 和 :index 传过来的 -->
    <template #default="{ user, index }">
      <!-- 现在我们可以用子组件的数据，按自己的方式渲染 -->
      <span>{{ index }}. {{ user.name }} ({{ user.age }}岁)</span>
    </template>
  </UserList>
</template>
```

> **原理**：子组件的 `<slot :user="user">` 相当于在说"这是数据，你拿去用"。父组件的 `<template #default="{ user }">` 相当于在说"好的，我收到数据了，按我的方式渲染"。

---

### 11.3.4 动态组件

```vue
<script setup lang="ts">
// 导入 ref 和 shallowRef
import { ref, shallowRef } from 'vue'
// 导入三个页面组件
import Home from './Home.vue'
import About from './About.vue'
import Contact from './Contact.vue'

// ✅ 用 shallowRef 存组件对象（不需要深度响应式，性能更好）
const currentComponent = shallowRef(Home)

// 组件映射表：名字 → 组件
const components = {
  home: Home, // 首页组件
  about: About, // 关于页组件
  contact: Contact, // 联系页组件
}

// 切换组件的函数
const switchComponent = (name: keyof typeof components) => {
  // 修改 currentComponent 的值，<component :is> 会自动切换
  currentComponent.value = components[name]
}
</script>

<template>
  <div>
    <!-- 三个切换按钮 -->
    <button @click="switchComponent('home')">首页</button>
    <button @click="switchComponent('about')">关于</button>
    <button @click="switchComponent('contact')">联系</button>

    <!-- ✅ :is 绑定谁就渲染谁 -->
    <!-- currentComponent 是 Home 就渲染 Home，是 About 就渲染 About -->
    <component :is="currentComponent" />
  </div>
</template>
```

> **为什么用 `shallowRef` 而不是 `ref`？** 因为组件对象不需要深度响应式。`ref` 会递归把对象变成响应式，浪费性能；`shallowRef` 只监听 `.value` 的变化，够用了。

---

### 11.3.5 keep-alive 缓存组件

```vue
<script setup lang="ts">
// 导入需要的 API
import { ref, shallowRef } from 'vue'
// 导入两个标签页组件
import TabA from './TabA.vue'
import TabB from './TabB.vue'

// 当前显示的组件，默认是 TabA
const currentTab = shallowRef(TabA)

// 组件映射表
const tabs = {
  a: TabA, // 标签 A
  b: TabB, // 标签 B
}
</script>

<template>
  <div>
    <!-- 切换按钮 -->
    <button @click="currentTab = tabs.a">标签 A</button>
    <button @click="currentTab = tabs.b">标签 B</button>

    <!-- ✅ <keep-alive> 包裹动态组件，切换时保留组件状态 -->
    <!-- 比如 TabA 里有个输入框打了几个字，切到 TabB 再切回来，字还在 -->
    <keep-alive>
      <component :is="currentTab" />
    </keep-alive>
  </div>
</template>
```

**keep-alive 的条件缓存**：

```vue
<script setup lang="ts">
// 导入 Vue
import { ref } from 'vue'
// 导入组件
import ComponentA from './ComponentA.vue'
import ComponentB from './ComponentB.vue'

// 定义要缓存的组件名列表
const includeList = ['ComponentA', 'ComponentB']
</script>

<template>
  <!-- ✅ include：只缓存指定的组件（用逗号分隔组件名） -->
  <keep-alive include="ComponentA,ComponentB">
    <component :is="currentComponent" />
  </keep-alive>

  <!-- ✅ exclude：排除指定组件，其余都缓存 -->
  <keep-alive exclude="ComponentC">
    <component :is="currentComponent" />
  </keep-alive>

  <!-- ✅ max：最多缓存 10 个，超出的按 LRU 策略淘汰 -->
  <keep-alive :max="10">
    <component :is="currentComponent" />
  </keep-alive>
</template>
```

> **注意**：`include` 和 `exclude` 匹配的是组件的 **name**，不是文件名。在 `<script setup>` 中，组件名默认就是文件名（如 `ComponentA.vue` → `ComponentA`）。

---

### 11.3.6 异步组件

```vue
<script setup lang="ts">
// 导入 defineAsyncComponent API
import { defineAsyncComponent } from 'vue'

// ✅ 基础用法：按需加载，打包时会分成独立的 JS 文件
const AsyncComponent = defineAsyncComponent(
  () =>
    // 返回一个动态 import，浏览器用到时才下载
    import('./HeavyComponent.vue'),
)

// ✅ 高级用法：配置加载状态、错误状态等
const AsyncWithOptions = defineAsyncComponent({
  // loader：加载组件的函数
  loader: () => import('./HeavyComponent.vue'),
  // loadingComponent：加载中时显示的组件
  loadingComponent: () => import('./Loading.vue'),
  // errorComponent：加载失败时显示的组件
  errorComponent: () => import('./Error.vue'),
  // delay：延迟 200ms 才显示 loading（避免闪烁）
  delay: 200,
  // timeout：超过 3000ms 没加载完就报错
  timeout: 3000,
})
</script>

<template>
  <!-- 像普通组件一样使用 -->
  <AsyncComponent />
  <AsyncWithOptions />
</template>
```

> **什么时候用异步组件？** 当组件很大（如图表库、富文本编辑器）且不是首屏必须时，异步加载可以减小首屏 JS 体积。

---

### 11.3.7 递归组件

```vue
<!-- TreeNode.vue - 树节点组件 -->
<script setup lang="ts">
// 定义树节点的数据结构
interface TreeNode {
  id: number // 节点唯一 ID
  name: string // 节点名称
  children?: TreeNode[] // 子节点列表（可选）
}

// 接收 node prop
defineProps<{
  node: TreeNode // 当前节点数据
}>()
</script>

<template>
  <li>
    <!-- 显示当前节点名称 -->
    <span>{{ node.name }}</span>
    <!-- 如果有子节点，递归渲染 -->
    <ul v-if="node.children && node.children.length > 0">
      <!-- ✅ 递归调用自身：tree-node 就是当前组件本身 -->
      <!-- 遍历子节点，每个子节点再用 TreeNode 组件渲染 -->
      <tree-node v-for="child in node.children" :key="child.id" :node="child" />
    </ul>
  </li>
</template>
```

```vue
<!-- 父组件 -->
<script setup lang="ts">
// 导入递归组件
import TreeNode from './TreeNode.vue'

// 树形数据
const treeData = {
  id: 1,
  name: '根节点',
  children: [
    {
      id: 2,
      name: '子节点 1',
      children: [
        { id: 4, name: '孙节点 1-1' }, // 叶子节点
        { id: 5, name: '孙节点 1-2' }, // 叶子节点
      ],
    },
    {
      id: 3,
      name: '子节点 2',
      children: [
        { id: 6, name: '孙节点 2-1' }, // 叶子节点
      ],
    },
  ],
}
</script>

<template>
  <ul>
    <!-- 传入根节点，组件内部会递归渲染所有子节点 -->
    <TreeNode :node="treeData" />
  </ul>
</template>
```

> **注意**：递归组件一定要有**终止条件**（这里是 `v-if="node.children && node.children.length > 0"`），否则会无限递归导致栈溢出。

---

### 11.3.8 实战：可定制列表组件

```vue
<!-- CustomList.vue - 可定制列表组件 -->
<script setup lang="ts">
// 定义列表项的数据结构
interface Item {
  id: number // 唯一标识
  title: string // 标题
  description: string // 描述
  tags: string[] // 标签数组
}

// 接收 items prop
defineProps<{
  items: Item[] // 列表数据
}>()
</script>

<template>
  <ul class="custom-list">
    <!-- 遍历列表项 -->
    <li v-for="item in items" :key="item.id" class="list-item">
      <!-- ✅ 提供 header 插槽，并把当前 item 数据递出去 -->
      <slot name="header" :item="item">
        <!-- 默认渲染：如果父组件没自定义，就显示标题 -->
        <h3>{{ item.title }}</h3>
      </slot>

      <!-- ✅ 提供 body 插槽 -->
      <slot name="body" :item="item">
        <!-- 默认渲染：显示描述 -->
        <p>{{ item.description }}</p>
      </slot>

      <!-- ✅ 提供 footer 插槽 -->
      <slot name="footer" :item="item">
        <!-- 默认渲染：显示标签 -->
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
// 导入可定制列表组件
import CustomList from './CustomList.vue'

// 列表数据
const items = [
  {
    id: 1,
    title: 'Vue 3',
    description: '渐进式 JavaScript 框架',
    tags: ['前端', '框架'],
  },
  {
    id: 2,
    title: 'TypeScript',
    description: 'JavaScript 的超集',
    tags: ['语言', '类型系统'],
  },
]
</script>

<template>
  <CustomList :items="items">
    <!-- ✅ 自定义 header 插槽：用蓝色大标题 -->
    <template #header="{ item }">
      <h2 style="color: blue">{{ item.title }}</h2>
    </template>

    <!-- body 插槽不自定义，使用默认的 -->

    <!-- ✅ 自定义 footer 插槽：用 # 前缀显示标签 -->
    <template #footer="{ item }">
      <div style="margin-top: 10px">
        <strong>标签：</strong>
        <span v-for="tag in item.tags" :key="tag" style="margin-right: 5px"> #{{ tag }} </span>
      </div>
    </template>
  </CustomList>
</template>
```

---

## 4 核心知识点总结

| 知识点     | 语法                                      | 用途                 | 使用场景                                      |
| ---------- | ----------------------------------------- | -------------------- | --------------------------------------------- |
| 默认插槽   | `<slot />`                                | 定义一个内容分发位置 | 组件需要父组件自定义内容                      |
| 具名插槽   | `<slot name="xxx" />`                     | 定义多个分发位置     | 组件有多个自定义区域（如 header/body/footer） |
| 作用域插槽 | `<slot :data="xxx" />`                    | 子组件向插槽传递数据 | 列表组件让父组件自定义每项的渲染方式          |
| 动态组件   | `<component :is="xxx" />`                 | 动态切换渲染的组件   | Tab 切换、页面路由替代                        |
| keep-alive | `<keep-alive>`                            | 缓存组件状态         | 切换 Tab 时保留输入状态、滚动位置等           |
| 异步组件   | `defineAsyncComponent(() => import(...))` | 按需加载组件代码     | 大组件懒加载、代码分割                        |
| 递归组件   | 组件内调用自身                            | 渲染树形/嵌套结构    | 树形菜单、评论嵌套、文件夹目录                |

---

## 5 新手常见误区

### 误区 1："插槽里的内容在子组件的作用域里编译"

**❌ 错！** 插槽内容在**父组件**的作用域里编译。

```vue
<!-- ❌ 错误理解：以为插槽里能用子组件的变量 -->
<!-- 子组件 -->
<script setup>
const msg = 'hello' // 子组件的变量
</script>
<template>
  <slot></slot>
  <!-- 父组件填的内容在这里编译 -->
</template>

<!-- 父组件 -->
<MyComponent>
  {{ msg }}  <!-- ❌ 报错！msg 是子组件的变量，父组件访问不到 -->
</MyComponent>
```

✅ **正确做法**：如果需要在插槽里用子组件的数据，用**作用域插槽**：

```vue
<!-- 子组件 -->
<template>
  <slot :msg="msg"></slot>
  <!-- 把 msg 递出去 -->
</template>

<!-- 父组件 -->
<MyComponent>
  <template #default="{ msg }">  <!-- ✅ 通过解构拿到 -->
    {{ msg }}
  </template>
</MyComponent>
```

---

### 误区 2："具名插槽的 # 语法可以直接写在组件标签上"

**❌ 错！** `#` 语法（`v-slot`）只能用在 `<template>` 上。

```vue
<!-- ❌ 错误写法 -->
<Card #header>
  <h3>标题</h3>
</Card>

<!-- ✅ 正确写法 -->
<Card>
  <template #header>
    <h3>标题</h3>
  </template>
</Card>
```

> 唯一的例外：如果你只用默认插槽，可以直接写在标签上（因为默认插槽不需要 `<template>` 包裹）。

---

### 误区 3："动态组件用 ref 就行了"

**❌ 不推荐！** 用 `ref` 存组件对象会做无意义的深度响应式转换。

```vue
<!-- ❌ 不推荐 -->
<script setup>
import { ref } from 'vue'
import Home from './Home.vue'
const comp = ref(Home) // ref 会递归把组件对象变响应式，浪费性能
</script>

<!-- ✅ 推荐 -->
<script setup>
import { shallowRef } from 'vue'
import Home from './Home.vue'
const comp = shallowRef(Home) // shallowRef 只监听 .value 变化，够用且高效
</script>
```

---

### 误区 4："keep-alive 缓存了所有组件，越多越好"

**❌ 错！** 缓存太多组件会占用大量内存。

```vue
<!-- ❌ 不推荐：无限制缓存 -->
<keep-alive>
  <component :is="currentComponent" />
</keep-alive>

<!-- ✅ 推荐：限制缓存数量或指定缓存范围 -->
<keep-alive :max="10">
  <component :is="currentComponent" />
</keep-alive>

<!-- ✅ 或者只缓存需要保留状态的 -->
<keep-alive include="TabA,TabB">
  <component :is="currentComponent" />
</keep-alive>
```

---

### 误区 5："递归组件不需要终止条件"

**❌ 大错特错！** 没有终止条件会导致无限递归，浏览器直接卡死。

```vue
<!-- ❌ 错误：没有终止条件，会无限渲染 -->
<template>
  <tree-node />
  <!-- 永远渲染自己，停不下来 -->
</template>

<!-- ✅ 正确：用 v-if 做终止条件 -->
<template>
  <tree-node v-if="node.children && node.children.length > 0" />
</template>
```

---

## 6 动手练习

### 练习 1（基础）：创建一个带头像的按钮组件

创建一个 `AvatarButton` 组件，要求：

- 左侧显示头像（通过默认插槽传入）
- 右侧显示按钮文字（通过默认插槽传入）
- 如果没传内容，显示默认文字"按钮"

<details>
<summary>点击查看答案</summary>

```vue
<!-- AvatarButton.vue -->
<script setup lang="ts">
// 这个组件不需要任何逻辑
// 插槽是纯模板层面的功能
</script>

<template>
  <button class="avatar-btn">
    <!-- 默认插槽：父组件可以传任意内容 -->
    <!-- 如果父组件没传，显示默认文字 -->
    <slot>按钮</slot>
  </button>
</template>

<style scoped>
.avatar-btn {
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  gap: 8px; /* 图片和文字间距 */
  padding: 8px 16px; /* 内边距 */
  border-radius: 8px; /* 圆角 */
  cursor: pointer; /* 鼠标变手型 */
}
</style>
```

```vue
<!-- 父组件使用 -->
<script setup lang="ts">
// 导入头像按钮组件
import AvatarButton from './AvatarButton.vue'
</script>

<template>
  <!-- 传入头像和文字 -->
  <AvatarButton> <img src="avatar.png" width="24" height="24" /> 头像按钮 </AvatarButton>

  <!-- 不传内容，显示默认文字 -->
  <AvatarButton />
</template>
```

</details>

---

### 练习 2（进阶）：实现一个带作用域插槽的数据表格

创建一个 `DataTable` 组件，要求：

- 接收 `columns`（列定义）和 `data`（数据数组）props
- 提供默认作用域插槽，把每行数据 `{ row, column }` 递给父组件
- 父组件可以自定义每列的渲染方式

<details>
<summary>点击查看答案</summary>

```vue
<!-- DataTable.vue -->
<script setup lang="ts">
// 定义列的类型
interface Column {
  key: string // 数据字段名
  title: string // 列标题
}

// 定义行的类型（通用对象）
type Row = Record<string, any>

// 接收 props
defineProps<{
  columns: Column[] // 列定义数组
  data: Row[] // 数据数组
}>()
</script>

<template>
  <table border="1">
    <!-- 表头 -->
    <thead>
      <tr>
        <!-- 遍历列定义，显示列标题 -->
        <th v-for="col in columns" :key="col.key">{{ col.title }}</th>
      </tr>
    </thead>
    <!-- 表体 -->
    <tbody>
      <!-- 遍历每一行数据 -->
      <tr v-for="row in data" :key="row.id">
        <!-- 遍历每一列 -->
        <td v-for="col in columns" :key="col.key">
          <!-- ✅ 作用域插槽：把 row 和 column 递给父组件 -->
          <!-- 父组件可以自定义每个单元格的渲染方式 -->
          <slot :row="row" :column="col">
            <!-- 默认渲染：直接显示对应字段的值 -->
            {{ row[col.key] }}
          </slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>
```

```vue
<!-- 父组件使用 -->
<script setup lang="ts">
// 导入数据表格组件
import DataTable from './DataTable.vue'

// 定义列
const columns = [
  { key: 'name', title: '姓名' }, // 姓名列
  { key: 'age', title: '年龄' }, // 年龄列
  { key: 'action', title: '操作' }, // 操作列
]

// 定义数据
const data = [
  { id: 1, name: '张三', age: 25 }, // 第一行
  { id: 2, name: '李四', age: 30 }, // 第二行
]
</script>

<template>
  <DataTable :columns="columns" :data="data">
    <!-- ✅ 自定义操作列的渲染 -->
    <template #default="{ row, column }">
      <!-- 如果是操作列，显示按钮 -->
      <button v-if="column.key === 'action'" @click="alert('编辑 ' + row.name)">编辑</button>
      <!-- 其他列用默认渲染 -->
    </template>
  </DataTable>
</template>
```

</details>

---

### 练习 3（挑战）：实现一个带缓存的 Tab 切换组件

创建一个 `TabSwitcher` 组件，要求：

- 接收 `tabs` prop（包含 name 和 label）
- 使用具名插槽让父组件定义每个 Tab 的内容
- 使用 `<keep-alive>` 缓存已访问的 Tab 内容
- 切换时不丢失已输入的内容

<details>
<summary>点击查看答案</summary>

```vue
<!-- TabPanel.vue - 单个 Tab 面板包装器 -->
<script setup lang="ts">
// 定义组件名（keep-alive 的 include 需要匹配名字）
defineOptions({
  name: 'TabPanel', // 组件名，用于 keep-alive 的 include/exclude
})

// 接收 label prop
defineProps<{
  label: string // Tab 标签文字
}>()
</script>

<template>
  <!-- 直接渲染插槽内容 -->
  <div class="tab-panel">
    <slot />
  </div>
</template>
```

```vue
<!-- TabSwitcher.vue - Tab 切换组件 -->
<script setup lang="ts">
// 导入 Vue API
import { ref, computed } from 'vue'

// 定义 Tab 的类型
interface Tab {
  name: string // Tab 标识符
  label: string // Tab 显示文字
}

// 接收 props
defineProps<{
  tabs: Tab[] // Tab 配置数组
}>()

// 当前激活的 Tab 名
const activeTab = ref('') // 默认为空，第一次点击时设置

// 切换 Tab 的方法
const switchTab = (name: string) => {
  activeTab.value = name // 更新激活状态
}
</script>

<template>
  <div class="tab-switcher">
    <!-- Tab 标签栏 -->
    <div class="tab-header">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        :class="{ active: activeTab === tab.name }"
        @click="switchTab(tab.name)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ✅ Tab 内容区：用 keep-alive 缓存 -->
    <keep-alive>
      <!-- 遍历所有 Tab，只显示激活的那个 -->
      <div v-for="tab in tabs" :key="tab.name" v-show="activeTab === tab.name">
        <!-- ✅ 具名插槽：每个 Tab 有自己的插槽位置 -->
        <slot :name="tab.name" />
      </div>
    </keep-alive>
  </div>
</template>
```

```vue
<!-- 父组件使用 -->
<script setup lang="ts">
// 导入 Tab 切换组件
import TabSwitcher from './TabSwitcher.vue'
// 导入表单组件
import FormA from './FormA.vue'
import FormB from './FormB.vue'

// Tab 配置
const tabs = [
  { name: 'formA', label: '表单 A' }, // 第一个 Tab
  { name: 'formB', label: '表单 B' }, // 第二个 Tab
]
</script>

<template>
  <TabSwitcher :tabs="tabs">
    <!-- ✅ 通过具名插槽定义每个 Tab 的内容 -->
    <template #formA>
      <FormA />
      <!-- 表单 A 的内容，切换时会被缓存 -->
    </template>

    <template #formB>
      <FormB />
      <!-- 表单 B 的内容，切换时会被缓存 -->
    </template>
  </TabSwitcher>
</template>
```

</details>

---

## 下一章预告

下一章我们会学习 **Composition API 进阶**——也就是 `provide/inject`、`template refs`、以及自定义组合式函数（Composables）。你会学到如何跨层级传递数据、如何在组件里直接操作 DOM 元素、以及如何把逻辑抽成可复用的函数。这些是写出优雅、可维护的 Vue 3 代码的关键技能，继续加油！
