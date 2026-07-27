---
title: "第十五章：过渡与动画"
description: "学习 Vue 2 中的过渡和动画系统，掌握 transition、transition-group、JavaScript 钩子的使用。"
---

# 第十五章：过渡与动画

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 如何让元素的出现和消失不那么突兀？
- 列表项的添加和删除能不能有动画效果？
- CSS 动画和 JavaScript 动画该怎么选？
- 路由切换时能不能有过渡效果？

这一章就是为了解答这些问题。我们会从最简单的单元素过渡开始，逐步学习列表过渡、JavaScript 钩子、状态过渡等高级用法。学完这一章，你就能为应用添加流畅的动画效果，提升用户体验。

---

## 1 为什么需要过渡与动画？

### 痛点分析

想象一下这个场景：你做了一个弹窗组件。

```vue
<!-- 没有动画的弹窗 -->
<template>
  <div v-if="showModal" class="modal">
    <p>这是一个弹窗</p>
    <button @click="showModal = false">关闭</button>
  </div>
</template>
```

**问题：**
- 弹窗突然出现，用户会被吓一跳
- 关闭时直接消失，感觉很不自然
- 整个界面看起来很生硬，没有流畅感

### 解决方案

添加过渡动画，让元素的出现和消失变得平滑。

打个比方：

> 过渡动画就像电影里的转场效果。没有转场，场景切换会很突兀；有了转场，观众就能自然地跟随剧情。Vue 的过渡系统就是帮你轻松实现这些"转场效果"。

```vue
<!-- 有动画的弹窗 -->
<template>
  <transition name="fade">
    <div v-if="showModal" class="modal">
      <p>这是一个弹窗</p>
      <button @click="showModal = false">关闭</button>
    </div>
  </transition>
</template>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
```

> **一句话总结**：过渡动画让界面交互更自然、更流畅，提升用户体验。

---

## 2 核心原理

### 过渡的本质

Vue 的过渡系统基于一个核心思想：**在元素插入/移除时，自动添加/移除 CSS 类名**。

打个比方：

> 把 Vue 的过渡系统想象成一个"自动换装助手"。当元素要出现时，助手会自动给它穿上"进入"的衣服（CSS 类名）；当元素要消失时，助手会自动给它换上"离开"的衣服。你只需要设计好这些衣服（CSS 样式），助手会帮你自动切换。

### 6 个过渡类名

Vue 提供了 6 个 CSS 类名来控制过渡的各个阶段：

| 类名 | 时机 | 作用 |
|------|------|------|
| `v-enter` | 进入前 | 定义进入的起始状态 |
| `v-enter-active` | 进入中 | 定义进入的活跃状态（过渡曲线） |
| `v-enter-to` | 进入后 | 定义进入的结束状态 |
| `v-leave` | 离开前 | 定义离开的起始状态 |
| `v-leave-active` | 离开中 | 定义离开的活跃状态（过渡曲线） |
| `v-leave-to` | 离开后 | 定义离开的结束状态 |

**注意**：`v-` 是默认前缀，如果你给 `<transition>` 设置了 `name="fade"`，前缀就变成了 `fade-`。

### 过渡流程图

```
元素插入
  ↓
添加 v-enter 类（起始状态）
  ↓
下一帧：移除 v-enter，添加 v-enter-to
  ↓
过渡进行中（v-enter-active 生效）
  ↓
过渡结束：移除 v-enter-to 和 v-enter-active
```

```
元素移除
  ↓
添加 v-leave 类（起始状态）
  ↓
下一帧：移除 v-leave，添加 v-leave-to
  ↓
过渡进行中（v-leave-active 生效）
  ↓
过渡结束：移除元素，移除 v-leave-to 和 v-leave-active
```

---

## 3 基础用法

### 单元素过渡

```vue
<template>
  <div>
    <!-- 切换按钮 -->
    <button @click="show = !show">
      切换显示
    </button>
    
    <!-- 使用 transition 包裹需要过渡的元素 -->
    <transition name="fade">
      <!-- v-if 控制元素显示/隐藏 -->
      <p v-if="show">Hello Vue!</p>
    </transition>
  </div>
</template>

<script>
export default {
  data() {
    return {
      show: true // 控制元素显示/隐藏
    }
  }
}
</script>

<style>
/* 进入和离开的过渡效果 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s; /* 过渡时间 0.5 秒 */
}

/* 进入的起始状态和离开的结束状态 */
.fade-enter, .fade-leave-to {
  opacity: 0; /* 透明度为 0（完全透明） */
}
</style>
```

**代码解释：**
1. `<transition>` 组件包裹需要过渡的元素
2. `name="fade"` 设置过渡名称，CSS 类名前缀变为 `fade-`
3. `.fade-enter-active` 和 `.fade-leave-active` 定义过渡曲线
4. `.fade-enter` 和 `.fade-leave-to` 定义起始/结束状态

### 使用 CSS animation

```vue
<template>
  <transition name="bounce">
    <p v-if="show">弹跳效果</p>
  </transition>
</template>

<style>
/* 进入动画 */
.bounce-enter-active {
  animation: bounce-in 0.5s; /* 使用 bounce-in 动画 */
}

/* 离开动画 */
.bounce-leave-active {
  animation: bounce-out 0.5s; /* 使用 bounce-out 动画 */
}

/* 定义弹入动画 */
@keyframes bounce-in {
  0% {
    transform: scale(0); /* 初始缩放为 0 */
  }
  50% {
    transform: scale(1.2); /* 中间放大到 1.2 倍 */
  }
  100% {
    transform: scale(1); /* 最终缩放到正常大小 */
  }
}

/* 定义弹出动画 */
@keyframes bounce-out {
  0% {
    transform: scale(1); /* 从正常大小开始 */
  }
  100% {
    transform: scale(0); /* 缩小到 0 */
  }
}
</style>
```

**对比：**
- `transition`：适合简单的状态切换（如 opacity、transform）
- `animation`：适合复杂的多步骤动画（如弹跳效果）

### 自定义过渡类名

如果你使用第三方动画库（如 Animate.css），可以自定义类名。

```vue
<template>
  <transition
    enter-active-class="animated fadeIn"
    leave-active-class="animated fadeOut"
  >
    <p v-if="show">使用 Animate.css</p>
  </transition>
</template>
```

**解释：**
- `enter-active-class`：进入时使用的 CSS 类名
- `leave-active-class`：离开时使用的 CSS 类名
- 这样就不需要写 `.v-enter-active` 等类名了

---

## 4 进阶用法

### 多个元素的过渡

当你在同一个元素上切换时，需要使用 `mode` 属性控制过渡顺序。

```vue
<template>
  <transition name="fade" mode="out-in">
    <!-- v-if 和 v-else 切换 -->
    <button v-if="isEdit" key="save" @click="isEdit = false">
      保存
    </button>
    <button v-else key="edit" @click="isEdit = true">
      编辑
    </button>
  </transition>
</template>

<script>
export default {
  data() {
    return {
      isEdit: false // 控制显示哪个按钮
    }
  }
}
</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
```

**mode 属性：**
- `in-out`：新元素先进入，完成后当前元素再离开
- `out-in`：当前元素先离开，完成后新元素再进入（推荐）

**注意**：多个元素必须使用 `key` 属性区分，即使有 `v-if/v-else`。

### JavaScript 钩子

如果你需要更精细的控制，可以使用 JavaScript 钩子。

```vue
<template>
  <transition
    @before-enter="beforeEnter"
    @enter="enter"
    @after-enter="afterEnter"
    @before-leave="beforeLeave"
    @leave="leave"
    @after-leave="afterLeave"
  >
    <p v-if="show">JavaScript 控制动画</p>
  </transition>
</template>

<script>
export default {
  data() {
    return {
      show: false
    }
  },
  methods: {
    // 进入前：设置初始状态
    beforeEnter(el) {
      el.style.opacity = 0 // 初始透明度为 0
      el.style.transform = 'translateY(-30px)' // 初始位置向上偏移 30px
    },
    
    // 进入中：执行动画
    enter(el, done) {
      // 触发重排，确保初始状态生效
      el.offsetHeight
      
      // 设置过渡效果
      el.style.transition = 'all 0.5s ease'
      el.style.opacity = 1 // 最终透明度为 1
      el.style.transform = 'translateY(0)' // 最终位置恢复正常
      
      // 动画完成后调用 done
      setTimeout(done, 500) // 500ms 后调用 done
    },
    
    // 进入完成后
    afterEnter(el) {
      console.log('进入动画完成')
    },
    
    // 离开前：设置初始状态
    beforeLeave(el) {
      el.style.opacity = 1 // 初始透明度为 1
    },
    
    // 离开中：执行动画
    leave(el, done) {
      el.style.transition = 'all 0.5s ease'
      el.style.opacity = 0 // 最终透明度为 0
      el.style.transform = 'translateY(30px)' // 最终位置向下偏移 30px
      
      setTimeout(done, 500) // 500ms 后调用 done
    },
    
    // 离开完成后
    afterLeave(el) {
      console.log('离开动画完成')
    }
  }
}
</script>
```

**关键点：**
1. `done` 回调必须调用，否则动画不会结束
2. 使用 `el.offsetHeight` 触发重排，确保初始状态生效
3. 适合需要复杂逻辑的动画（如配合 GreenSock 等动画库）

### 初始渲染过渡

如果你想让元素在页面首次加载时就有动画效果，使用 `appear` 属性。

```vue
<template>
  <!-- 添加 appear 属性 -->
  <transition appear>
    <p>页面加载时就有动画</p>
  </transition>
</template>

<style>
.v-enter-active {
  animation: fade-in 0.5s;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
```

**解释**：`appear` 属性让过渡在初始渲染时也会生效。

---

## 5 列表过渡

### transition-group

`<transition-group>` 用于给列表添加过渡效果。

```vue
<template>
  <div>
    <button @click="add">添加</button>
    <button @click="remove">删除</button>
    
    <!-- 使用 transition-group 包裹列表 -->
    <transition-group name="list" tag="ul">
      <!-- 每个列表项必须有唯一的 key -->
      <li v-for="item in items" :key="item">
        {{ item }}
      </li>
    </transition-group>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [1, 2, 3, 4, 5], // 列表数据
      nextNum: 6 // 下一个数字
    }
  },
  methods: {
    add() {
      // 在随机位置插入新项
      const index = Math.floor(Math.random() * (this.items.length + 1))
      this.items.splice(index, 0, this.nextNum++)
    },
    remove() {
      // 删除随机位置的项
      const index = Math.floor(Math.random() * this.items.length)
      this.items.splice(index, 1)
    }
  }
}
</script>

<style>
/* 进入和离开的过渡 */
.list-enter-active, .list-leave-active {
  transition: all 0.5s ease;
}

/* 进入的起始状态和离开的结束状态 */
.list-enter, .list-leave-to {
  opacity: 0;
  transform: translateX(30px); /* 从右侧滑入 */
}

/* 移动动画（其他项的位置变化） */
.list-move {
  transition: transform 0.5s ease;
}
</style>
```

**关键点：**
1. `<transition-group>` 会渲染为真实元素（默认是 `<span>`），可以用 `tag` 属性指定
2. 每个列表项必须有唯一的 `key`
3. `.list-move` 类用于其他项的位置变化动画
4. 离开动画期间，元素会脱离文档流，需要特殊处理

### 列表的交错动画

让列表项按顺序依次出现，产生"波浪"效果。

```vue
<template>
  <transition-group
    tag="ul"
    :css="false"
    @before-enter="beforeEnter"
    @enter="enter"
  >
    <li v-for="(item, index) in items" :key="item" :data-index="index">
      {{ item }}
    </li>
  </transition-group>
</template>

<script>
export default {
  data() {
    return {
      items: ['苹果', '香蕉', '橙子', '葡萄', '西瓜']
    }
  },
  methods: {
    // 设置初始状态
    beforeEnter(el) {
      el.style.opacity = 0 // 初始透明
      el.style.transform = 'translateY(20px)' // 初始向下偏移
    },
    
    // 执行动画（带延迟）
    enter(el, done) {
      // 获取 data-index 属性
      const delay = el.dataset.index * 150 // 每项延迟 150ms
      
      setTimeout(() => {
        el.style.transition = 'all 0.4s ease'
        el.style.opacity = 1
        el.style.transform = 'translateY(0)'
        
        setTimeout(done, 400) // 400ms 后调用 done
      }, delay)
    }
  }
}
</script>
```

**效果**：列表项会按顺序依次出现，产生波浪效果。

---

## 6 状态过渡

### 数字渐变

让数字变化时有平滑的过渡效果。

```vue
<template>
  <div>
    <p>当前计数：{{ animatedNumber }}</p>
    <button @click="number += 10">增加 10</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      number: 0, // 目标数字
      animatedNumber: 0 // 动画中的数字
    }
  },
  watch: {
    // 监听 number 变化
    number(newVal) {
      // 使用 requestAnimationFrame 实现平滑过渡
      const startVal = this.animatedNumber
      const diff = newVal - startVal
      const duration = 500 // 动画持续时间
      const startTime = performance.now()
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1) // 进度（0-1）
        
        // 使用缓动函数
        const easeProgress = progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress
        
        this.animatedNumber = Math.round(startVal + diff * easeProgress)
        
        if (progress < 1) {
          requestAnimationFrame(animate) // 继续动画
        }
      }
      
      requestAnimationFrame(animate) // 开始动画
    }
  }
}
</script>
```

**解释**：通过 `requestAnimationFrame` 逐帧更新数字，实现平滑的数字渐变效果。

---

## 7 核心知识点总结

| 组件/属性 | 作用 | 使用场景 |
|-----------|------|----------|
| `<transition>` | 单元素过渡 | v-if、v-show、动态组件 |
| `<transition-group>` | 列表过渡 | v-for 列表 |
| `name` | 设置过渡名称 | 自定义 CSS 类名前缀 |
| `mode` | 过渡模式 | `out-in` 或 `in-out` |
| `appear` | 初始渲染过渡 | 页面加载时的动画 |
| `tag` | 渲染的标签 | `<transition-group>` 的容器标签 |
| `@before-enter` 等 | JavaScript 钩子 | 需要精细控制的动画 |

### CSS 类名对比

| 类名 | 时机 | 用途 |
|------|------|------|
| `v-enter` | 进入前 | 定义起始状态 |
| `v-enter-active` | 进入中 | 定义过渡曲线 |
| `v-enter-to` | 进入后 | 定义结束状态 |
| `v-leave` | 离开前 | 定义起始状态 |
| `v-leave-active` | 离开中 | 定义过渡曲线 |
| `v-leave-to` | 离开后 | 定义结束状态 |

---

## 8 新手常见误区

### 误区 1：忘记添加 key 属性

```vue
<!-- ❌ 错误：多个元素没有 key -->
<transition mode="out-in">
  <button v-if="isEdit">保存</button>
  <button v-else>编辑</button>
</transition>

<!-- ✅ 正确：添加唯一的 key -->
<transition mode="out-in">
  <button v-if="isEdit" key="save">保存</button>
  <button v-else key="edit">编辑</button>
</transition>
```

**为什么错？** Vue 需要 `key` 来区分不同的元素，否则无法正确应用过渡效果。

### 误区 2：列表过渡忘记设置 move 类

```vue
<!-- ❌ 错误：没有 .list-move 类 -->
<style>
.list-enter-active, .list-leave-active {
  transition: all 0.5s;
}
.list-enter, .list-leave-to {
  opacity: 0;
}
</style>

<!-- ✅ 正确：添加 .list-move 类 -->
<style>
.list-enter-active, .list-leave-active {
  transition: all 0.5s;
}
.list-enter, .list-leave-to {
  opacity: 0;
}
.list-move {
  transition: transform 0.5s; /* 其他项的位置变化 */
}
</style>
```

**为什么错？** 没有 `.list-move` 类，其他项的位置变化不会有动画，看起来很突兀。

### 误区 3：JavaScript 钩子忘记调用 done

```javascript
// ❌ 错误：没有调用 done
enter(el) {
  el.style.transition = 'all 0.5s'
  el.style.opacity = 1
  // 忘记调用 done，动画不会结束
}

// ✅ 正确：调用 done 表示动画结束
enter(el, done) {
  el.style.transition = 'all 0.5s'
  el.style.opacity = 1
  setTimeout(done, 500) // 500ms 后调用 done
}
```

**为什么错？** 不调用 `done`，Vue 不知道动画何时结束，会导致后续操作无法执行。

### 误区 4：在 transition-group 中使用 v-if

```vue
<!-- ❌ 错误：transition-group 不能使用 v-if -->
<transition-group tag="ul" v-if="show">
  <li v-for="item in items" :key="item">{{ item }}</li>
</transition-group>

<!-- ✅ 正确：用 transition 包裹 transition-group -->
<transition>
  <transition-group v-if="show" tag="ul">
    <li v-for="item in items" :key="item">{{ item }}</li>
  </transition-group>
</transition>
```

**为什么错？** `<transition-group>` 不支持 `v-if`，需要用 `<transition>` 包裹。

### 误区 5：过渡时间不匹配

```css
/* ❌ 错误：进入和离开时间不一致 */
.fade-enter-active {
  transition: opacity 0.3s;
}
.fade-leave-active {
  transition: opacity 0.8s; /* 时间差异太大 */
}

/* ✅ 正确：保持一致或使用合理的差异 */
.fade-enter-active {
  transition: opacity 0.3s;
}
.fade-leave-active {
  transition: opacity 0.3s; /* 保持一致 */
}
```

**为什么错？** 时间差异太大会让用户感觉不协调，影响体验。

---

## 9 动手练习

### 练习 1：基础练习 - 淡入淡出

实现一个淡入淡出的提示框，点击按钮显示/隐藏。

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div>
    <button @click="show = !show">显示提示</button>
    
    <transition name="fade">
      <div v-if="show" class="alert">
        这是一个提示信息！
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  data() {
    return {
      show: false
    }
  }
}
</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

.alert {
  padding: 10px;
  background-color: #4CAF50;
  color: white;
  margin-top: 10px;
}
</style>
```

</details>

### 练习 2：进阶练习 - 列表动画

实现一个待办事项列表，添加和删除时有动画效果。

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div>
    <input v-model="newTodo" @keyup.enter="addTodo" placeholder="添加待办事项" />
    
    <transition-group name="todo" tag="ul">
      <li v-for="todo in todos" :key="todo.id">
        {{ todo.text }}
        <button @click="removeTodo(todo.id)">删除</button>
      </li>
    </transition-group>
  </div>
</template>

<script>
export default {
  data() {
    return {
      newTodo: '',
      todos: [
        { id: 1, text: '学习 Vue' },
        { id: 2, text: '学习过渡动画' }
      ],
      nextId: 3
    }
  },
  methods: {
    addTodo() {
      if (this.newTodo.trim()) {
        this.todos.push({
          id: this.nextId++,
          text: this.newTodo
        })
        this.newTodo = ''
      }
    },
    removeTodo(id) {
      this.todos = this.todos.filter(todo => todo.id !== id)
    }
  }
}
</script>

<style>
.todo-enter-active, .todo-leave-active {
  transition: all 0.5s ease;
}

.todo-enter, .todo-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.todo-move {
  transition: transform 0.5s ease;
}
</style>
```

</details>

### 练习 3（挑战）：路由过渡

实现路由切换时的滑动过渡效果。

<details>
<summary>点击查看答案</summary>

```vue
<!-- App.vue -->
<template>
  <div>
    <nav>
      <router-link to="/">首页</router-link>
      <router-link to="/about">关于</router-link>
      <router-link to="/contact">联系</router-link>
    </nav>
    
    <transition :name="transitionName" mode="out-in">
      <router-view></router-view>
    </transition>
  </div>
</template>

<script>
export default {
  data() {
    return {
      transitionName: 'slide-left'
    }
  },
  watch: {
    '$route'(to, from) {
      // 根据路由深度决定滑动方向
      const toDepth = to.path.split('/').length
      const fromDepth = from.path.split('/').length
      
      this.transitionName = toDepth < fromDepth ? 'slide-right' : 'slide-left'
    }
  }
}
</script>

<style>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
```

</details>

---

## 下一章预告

恭喜你完成了过渡与动画的学习！现在你已经掌握了如何为 Vue 应用添加流畅的动画效果。

下一章是 Vue 2 教程的最后一章：**Vue 2 到 Vue 3 迁移指南**。我们会学习 Vue 3 的新特性、破坏性变更、以及如何将现有的 Vue 2 项目迁移到 Vue 3。这是 Vue 2 系列的收官之作，帮助你顺利过渡到 Vue 3 时代。
