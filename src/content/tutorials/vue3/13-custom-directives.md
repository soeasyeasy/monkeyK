---
title: '第十三章：自定义指令'
description: '掌握 Vue 3 自定义指令的创建与使用，扩展 HTML 元素的行为'
---

# 第十三章：自定义指令

## 本章导读

在前面章节中，我们学习了 `v-if`、`v-for`、`v-model` 等内置指令。但有时我们需要对底层 DOM 元素进行精细控制，比如：
- 如何让输入框自动获得焦点？
- 如何实现图片懒加载？
- 如何添加点击外部关闭的功能？

这些需求用普通组件很难实现，而**自定义指令**就是解决这类问题的利器。学完本章你会掌握：
- 自定义指令的创建与生命周期钩子
- 全局指令与局部指令的区别
- 实战应用：自动聚焦、懒加载、点击外部关闭

---

## 1 为什么需要自定义指令？

### 痛点分析

假设你需要让一个输入框在页面加载时自动获得焦点。用组件的方式实现：

```vue
<script setup>
import { ref, onMounted } from 'vue'

const inputRef = ref(null)

onMounted(() => {
  inputRef.value?.focus()
})
</script>

<template>
  <input ref="inputRef" type="text" />
</template>
```

问题很明显：
- 每个需要自动聚焦的输入框都要写一遍 `ref` + `onMounted` + `focus()`
- 逻辑重复，无法复用

### 自定义指令的解决方案

```vue
<script setup>
// 定义自定义指令
const vFocus = {
  mounted(el) {
    el.focus()
  }
}
</script>

<template>
  <!-- 使用指令，就像使用 v-if 一样简单 -->
  <input v-focus type="text" />
</template>
```

> **一句话总结**：自定义指令让你可以像 `v-if`、`v-model` 一样，给 HTML 元素添加自定义行为。

---

## 2 核心原理

### 指令的生命周期钩子

自定义指令有一组生命周期钩子，与组件的生命周期类似：

```javascript
const myDirective = {
  // 在元素被插入到 DOM 前调用
  beforeMount(el, binding, vnode) {},
  
  // 在元素被插入到 DOM 后调用
  mounted(el, binding, vnode) {},
  
  // 在父组件的 VNode 更新前调用
  beforeUpdate(el, binding, vnode) {},
  
  // 在父组件及子组件的 VNode 都更新后调用
  updated(el, binding, vnode) {},
  
  // 在元素被卸载前调用
  beforeUnmount(el, binding, vnode) {},
  
  // 在元素被卸载后调用
  unmounted(el, binding, vnode) {}
}
```

### 钩子函数参数说明

| 参数 | 说明 |
|------|------|
| `el` | 指令绑定的 DOM 元素 |
| `binding` | 包含指令相关信息的对象 |
| `vnode` | Vue 生成的虚拟节点 |

### binding 对象详解

```javascript
const binding = {
  value: '指令的值',      // v-my-directive="value" 中的 value
  oldValue: '旧值',       // 更新前的值
  arg: '参数',            // v-my-directive:arg 中的 arg
  modifiers: {}           // v-my-directive.modifier 中的修饰符
}
```

---

## 3 基础用法

### 局部指令（推荐）

在 `<script setup>` 中，以 `v` 开头命名的变量就是局部指令：

```vue
<script setup>
// 自动聚焦指令
const vFocus = {
  mounted(el) {
    el.focus()
  }
}

// 带颜色的文字指令
const vColor = {
  mounted(el, binding) {
    el.style.color = binding.value
  }
}
</script>

<template>
  <!-- 使用局部指令 -->
  <input v-focus type="text" placeholder="自动聚焦" />
  <p v-color="'red'">这段文字是红色的</p>
</template>
```

### 全局指令

在 `main.ts` 中注册全局指令：

```typescript
// main.ts
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

// 注册全局指令
app.directive('focus', {
  mounted(el) {
    el.focus()
  }
})

// 带参数的全局指令
app.directive('color', {
  mounted(el, binding) {
    el.style.color = binding.value
  }
})

app.mount('#app')
```

```vue
<!-- 任意组件中使用 -->
<template>
  <input v-focus type="text" />
  <p v-color="'blue'">蓝色文字</p>
</template>
```

### 简写形式

如果只需要在 `mounted` 和 `updated` 时执行相同逻辑，可以用简写：

```vue
<script setup>
// 简写形式
const vColor = (el, binding) => {
  el.style.color = binding.value
}
</script>

<template>
  <p v-color="'green'">绿色文字</p>
</template>
```

---

## 4 进阶用法

### 带参数的指令

```vue
<script setup>
// 支持参数：v-position:top="100"
const vPosition = {
  mounted(el, binding) {
    el.style.position = 'absolute'
    el.style[binding.arg] = binding.value + 'px'
  }
}
</script>

<template>
  <div v-position:top="100" v-position:left="50">定位元素</div>
</template>
```

### 带修饰符的指令

```vue
<script setup>
// 支持修饰符：v-color.red / v-color.blue
const vColor = {
  mounted(el, binding) {
    // 检查修饰符
    if (binding.modifiers.red) {
      el.style.color = 'red'
    } else if (binding.modifiers.blue) {
      el.style.color = 'blue'
    } else {
      el.style.color = binding.value
    }
  }
}
</script>

<template>
  <p v-color.red>红色文字</p>
  <p v-color.blue>蓝色文字</p>
  <p v-color="'purple'">紫色文字</p>
</template>
```

### 实战：图片懒加载指令

```vue
<script setup>
const vLazy = {
  mounted(el, binding) {
    // 创建 IntersectionObserver 监听元素进入视口
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 元素进入视口，加载图片
          el.src = binding.value
          observer.unobserve(el)
        }
      })
    })
    
    observer.observe(el)
    
    // 保存 observer 引用，方便卸载时清理
    el._observer = observer
  },
  unmounted(el) {
    // 清理 observer
    el._observer?.disconnect()
  }
}
</script>

<template>
  <!-- 使用懒加载指令 -->
  <img v-lazy="'https://example.com/image1.jpg'" alt="图片1" />
  <img v-lazy="'https://example.com/image2.jpg'" alt="图片2" />
</template>
```

### 实战：点击外部关闭指令

```vue
<script setup>
import { ref } from 'vue'

const vClickOutside = {
  mounted(el, binding) {
    // 保存回调函数
    el._clickOutsideHandler = (event) => {
      // 判断点击是否在元素外部
      if (!el.contains(event.target)) {
        binding.value(event)
      }
    }
    
    // 添加全局点击监听
    document.addEventListener('click', el._clickOutsideHandler)
  },
  unmounted(el) {
    // 移除监听
    document.removeEventListener('click', el._clickOutsideHandler)
  }
}

const showModal = ref(true)

const close = () => {
  showModal.value = false
}
</script>

<template>
  <div v-if="showModal" class="modal" v-click-outside="close">
    <p>点击外部关闭我</p>
  </div>
</template>

<style scoped>
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 20px;
  background: white;
  border: 1px solid #ccc;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
</style>
```

---

## 5 核心知识点总结

| 知识点 | 说明 |
|--------|------|
| 自定义指令用途 | 对底层 DOM 元素进行精细控制 |
| 生命周期钩子 | `beforeMount`、`mounted`、`beforeUpdate`、`updated`、`beforeUnmount`、`unmounted` |
| 局部指令 | 在 `<script setup>` 中以 `v` 开头命名 |
| 全局指令 | 通过 `app.directive()` 注册 |
| 简写形式 | 只需 `mounted` 和 `updated` 时可用函数简写 |
| 参数支持 | 通过 `binding.arg` 获取 |
| 修饰符支持 | 通过 `binding.modifiers` 获取 |

---

## 6 新手常见误区

### 误区 1："自定义指令和组件是一样的"

**错！** 自定义指令用于操作底层 DOM 元素，适合处理与 DOM 相关的底层行为（如聚焦、懒加载）。组件是更高层次的抽象，包含模板、逻辑、样式。能用组件实现的，不要用指令。

### 误区 2："指令的钩子函数参数都一样"

**注意区分！** `el` 是 DOM 元素，`binding` 是指令信息对象，`vnode` 是虚拟节点。不同场景用不同参数：操作 DOM 用 `el`，获取指令值用 `binding.value`。

### 误区 3："全局指令比局部指令好"

**不一定！** 全局指令会污染全局命名空间，且不利于 Tree-shaking。推荐优先使用局部指令，只有真正需要在多个组件中复用时才用全局指令。

### 误区 4："指令不需要清理"

**需要清理！** 在 `mounted` 中添加的事件监听、定时器等，必须在 `unmounted` 中清理，否则会造成内存泄漏。

---

## 7 动手练习

### 练习 1：自动聚焦指令

创建一个 `v-focus` 指令，让输入框在挂载时自动获得焦点。

<details>
<summary>点击查看答案</summary>

```vue
<script setup>
const vFocus = {
  mounted(el) {
    el.focus()
  }
}
</script>

<template>
  <input v-focus type="text" placeholder="我会自动聚焦" />
</template>
```

</details>

### 练习 2：文字颜色指令

创建一个 `v-color` 指令，支持传入颜色值改变文字颜色。

<details>
<summary>点击查看答案</summary>

```vue
<script setup>
const vColor = {
  mounted(el, binding) {
    el.style.color = binding.value
  },
  updated(el, binding) {
    el.style.color = binding.value
  }
}

const currentColor = ref('red')
</script>

<template>
  <p v-color="currentColor">这段文字有颜色</p>
  <button @click="currentColor = 'blue'">变蓝</button>
  <button @click="currentColor = 'green'">变绿</button>
</template>
```

</details>

### 练习 3（挑战）：长按指令

创建一个 `v-longpress` 指令，长按元素 2 秒后触发回调。

<details>
<summary>点击查看答案</summary>

```vue
<script setup>
const vLongpress = {
  mounted(el, binding) {
    let pressTimer = null
    
    const start = () => {
      pressTimer = setTimeout(() => {
        binding.value()
      }, 2000)
    }
    
    const cancel = () => {
      if (pressTimer) {
        clearTimeout(pressTimer)
        pressTimer = null
      }
    }
    
    el.addEventListener('mousedown', start)
    el.addEventListener('mouseup', cancel)
    el.addEventListener('mouseleave', cancel)
    
    // 保存引用以便清理
    el._longpressStart = start
    el._longpressCancel = cancel
  },
  unmounted(el) {
    el.removeEventListener('mousedown', el._longpressStart)
    el.removeEventListener('mouseup', el._longpressCancel)
    el.removeEventListener('mouseleave', el._longpressCancel)
  }
}

const handleLongPress = () => {
  alert('长按成功！')
}
</script>

<template>
  <button v-longpress="handleLongPress">长按我 2 秒</button>
</template>
```

</details>

---

## 下一章预告

下一章我们会学习 Vue 的**过渡与动画**——也就是如何让元素在显示/隐藏时带有平滑的动画效果。你会学到 `<Transition>` 和 `<TransitionGroup>` 组件的使用，以及 CSS 动画和 JavaScript 钩子的结合方式。
