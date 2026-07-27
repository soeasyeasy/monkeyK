---
title: "第十一章：混入与自定义指令"
description: "学习 Vue 2 中的混入（mixins）和自定义指令，实现代码复用和 DOM 操作扩展。"
---

# 第十一章：混入与自定义指令

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 多个组件有相同的逻辑，难道要复制粘贴代码吗？
- Vue 内置的指令（v-if、v-for）不够用，能自己创建指令吗？
- 混入和组件继承有什么区别？什么时候用混入？
- 自定义指令的钩子函数什么时候执行？怎么选择？

这一章就是为了解答这些问题。我们会先搞清楚 **混入和自定义指令的核心概念**，再动手实践。学完这章，你就能：
- 用混入提取组件公共逻辑，避免代码重复
- 创建自定义指令，直接操作 DOM
- 理解混入的合并策略，避免命名冲突

---

## 11.1 为什么需要混入和自定义指令？

### 痛点分析

想象一下这个场景：你有 10 个表单组件，每个都需要：
- 表单加载状态
- 错误提示
- 提交逻辑

❌ **没有混入时的写法**：
```javascript
// 组件 A
export default {
  data() {
    return {
      formLoading: false,
      formError: null
    }
  },
  methods: {
    async submitForm(callback) {
      this.formLoading = true
      this.formError = null
      try {
        await callback()
      } catch (error) {
        this.formError = error.message
      } finally {
        this.formLoading = false
      }
    }
  }
}

// 组件 B - 重复的代码！
export default {
  data() {
    return {
      formLoading: false,  // 又要写一遍
      formError: null      // 又要写一遍
    }
  },
  methods: {
    async submitForm(callback) {  // 又要写一遍
      this.formLoading = true
      this.formError = null
      try {
        await callback()
      } catch (error) {
        this.formError = error.message
      } finally {
        this.formLoading = false
      }
    }
  }
}
```

❌ **没有自定义指令时**：
```javascript
// 想让输入框自动聚焦，要在每个组件的 mounted 里写
export default {
  mounted() {
    this.$refs.input.focus()  // 每个组件都要写
  }
}
```

### 解决方案

✅ **使用混入**：
```javascript
// formMixin.js - 提取公共逻辑
export const formMixin = {
  data() {
    return {
      formLoading: false,
      formError: null
    }
  },
  methods: {
    async submitForm(callback) {
      this.formLoading = true
      this.formError = null
      try {
        await callback()
      } catch (error) {
        this.formError = error.message
      } finally {
        this.formLoading = false
      }
    }
  }
}

// 组件 A - 使用混入
import { formMixin } from './formMixin.js'
export default {
  mixins: [formMixin],  // 一行搞定
  data() {
    return { username: '' }  // 只需要写自己的数据
  }
}

// 组件 B - 同样使用混入
import { formMixin } from './formMixin.js'
export default {
  mixins: [formMixin],  // 一行搞定
  data() {
    return { email: '' }  // 只需要写自己的数据
  }
}
```

✅ **使用自定义指令**：
```javascript
// 注册一次，到处使用
Vue.directive('focus', {
  inserted(el) {
    el.focus()
  }
})

// 组件中直接使用
<template>
  <input v-focus />  <!-- 自动聚焦，不用写 mounted -->
</template>
```

> **一句话总结**：混入让你复用组件逻辑，自定义指令让你扩展 Vue 的模板语法。

---

## 11.2 核心原理

### 混入的原理

打个比方：

> 混入就像"配方"。你有一个蛋糕配方（混入），可以加到不同的蛋糕（组件）里。每个蛋糕都自动拥有了配方的味道，但还可以加自己的特色装饰。

**底层原理**：
1. 混入是一个包含组件选项的对象
2. 当组件使用混入时，混入的所有选项会被"混入"到组件的选项中
3. 如果选项冲突，Vue 有特定的合并策略

### 自定义指令的原理

打个比方：

> 自定义指令就像"DOM 操作的小工具"。Vue 内置的 v-if、v-for 是官方提供的工具，自定义指令是你自己打造的工具。

**底层原理**：
1. 指令本质上是一组钩子函数
2. Vue 在渲染和更新 DOM 时，会调用对应的钩子
3. 钩子函数接收 DOM 元素和相关数据，你可以直接操作

### 对比分析

| 特性 | 混入 | 自定义指令 | 组件 |
| --- | --- | --- | --- |
| 用途 | 复用逻辑 | 操作 DOM | 复用 UI |
| 影响范围 | 组件实例 | DOM 元素 | 独立组件 |
| 学习曲线 | 低 | 中 | 低 |
| 推荐使用 | 中 | 中 | 高 |

---

## 11.3 混入基础用法

### 示例代码

```javascript
// mixin.js - 创建混入
export const myMixin = {
  // 混入的数据
  data() {
    return {
      mixinMessage: '来自混入的数据'  // 这个数据会被混入到组件
    }
  },
  // 混入的生命周期钩子
  created() {
    console.log('混入的 created 钩子')  // 会在组件的 created 之前执行
    this.hello()  // 调用混入的方法
  },
  // 混入的方法
  methods: {
    hello() {
      console.log('hello from mixin')  // 组件可以直接调用这个方法
    },
    mixinMethod() {
      console.log('混入的方法')  // 组件可以直接调用这个方法
    }
  }
}
```

```vue
<!-- 使用混入的组件 -->
<template>
  <div>
    <p>{{ mixinMessage }}</p>  <!-- 可以使用混入的数据 -->
    <button @click="mixinMethod">调用混入方法</button>  <!-- 可以调用混入的方法 -->
  </div>
</template>

<script>
import { myMixin } from './mixin.js'  // 导入混入

export default {
  mixins: [myMixin],  // 使用混入（数组形式，可以混入多个）
  created() {
    console.log('组件的 created 钩子')  // 在混入的 created 之后执行
  },
  methods: {
    componentMethod() {
      console.log('组件的方法')  // 组件自己的方法
    }
  }
}
</script>
```

> **原理**：混入的选项会被合并到组件中，就像你自己写在组件里一样。

---

## 11.4 混入合并策略

### 合并规则详解

当混入和组件有相同名称的选项时，Vue 会按照特定规则合并：

```javascript
// mixin.js
export const myMixin = {
  data() {
    return {
      message: '混入数据',  // 组件也有 message
      shared: '混入的共享数据'  // 组件没有，保留
    }
  },
  methods: {
    hello() {
      console.log('混入的 hello')  // 组件也有 hello
    },
    sharedMethod() {
      console.log('混入的共享方法')  // 组件没有，保留
    }
  },
  created() {
    console.log('混入的 created')  // 生命周期钩子都会执行
  }
}
```

```vue
<script>
export default {
  mixins: [myMixin],
  data() {
    return {
      message: '组件数据',  // ✅ 覆盖混入的 message
      componentOnly: '组件独有'  // ✅ 保留
    }
  },
  methods: {
    hello() {
      console.log('组件的 hello')  // ✅ 覆盖混入的 hello
    }
  },
  created() {
    console.log('组件的 created')  // ✅ 在混入的 created 之后执行
  }
}
</script>
```

### 合并规则表格

| 选项类型 | 合并策略 | 说明 |
| --- | --- | --- |
| data | 组件优先 | 同名属性，组件覆盖混入 |
| methods | 组件优先 | 同名方法，组件覆盖混入 |
| computed | 组件优先 | 同名计算属性，组件覆盖混入 |
| 生命周期钩子 | 都执行 | 混入先执行，组件后执行 |
| 自定义选项 | 由策略决定 | 需要自定义合并策略 |

### 多个混入的合并顺序

```javascript
// mixin1.js
export const mixin1 = {
  created() {
    console.log('混入 1 的 created')
  }
}

// mixin2.js
export const mixin2 = {
  created() {
    console.log('混入 2 的 created')
  }
}
```

```vue
<script>
import { mixin1 } from './mixin1.js'
import { mixin2 } from './mixin2.js'

export default {
  mixins: [mixin1, mixin2],  // 按数组顺序合并
  created() {
    console.log('组件的 created')
  }
}
// 输出顺序：混入 1 → 混入 2 → 组件
</script>
```

---

## 11.5 全局混入

```javascript
// main.js
import Vue from 'vue'

// 注册全局混入
Vue.mixin({
  created() {
    console.log('全局混入的 created')  // 每个 Vue 实例创建时都会执行
  }
})

// 创建组件 A
new Vue({
  // 会自动执行全局混入的 created
})

// 创建组件 B
new Vue({
  // 也会自动执行全局混入的 created
})
```

::: warning ⚠️ 谨慎使用全局混入
全局混入会影响**所有** Vue 实例，包括第三方组件。这可能导致：
- 性能问题（每个组件都执行）
- 命名冲突（可能覆盖第三方组件的选项）
- 难以调试（不知道哪里来的逻辑）

只在必要时使用，比如插件开发。
:::

---

## 11.6 实际混入示例

### 表单提交混入

```javascript
// formMixin.js
export const formMixin = {
  data() {
    return {
      formLoading: false,  // 表单加载状态
      formError: null      // 表单错误信息
    }
  },
  methods: {
    async submitForm(callback) {
      this.formLoading = true  // 开始加载
      this.formError = null    // 清空错误
      
      try {
        await callback()  // 执行传入的回调函数
      } catch (error) {
        this.formError = error.message  // 捕获错误
      } finally {
        this.formLoading = false  // 结束加载
      }
    }
  }
}
```

```vue
<!-- 使用表单混入的组件 -->
<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="username" />  <!-- 双向绑定用户名 -->
    <button :disabled="formLoading">
      {{ formLoading ? '提交中...' : '提交' }}  <!-- 根据加载状态显示文字 -->
    </button>
    <p v-if="formError">{{ formError }}</p>  <!-- 显示错误信息 -->
  </form>
</template>

<script>
import { formMixin } from './formMixin.js'

export default {
  mixins: [formMixin],  // 使用混入
  data() {
    return {
      username: ''  // 只需要定义自己的数据
    }
  },
  methods: {
    async handleSubmit() {
      await this.submitForm(async () => {
        // 这里写具体的提交逻辑
        await fetch('/api/submit', {
          method: 'POST',
          body: JSON.stringify({ username: this.username })
        })
      })
    }
  }
}
</script>
```

> **优势**：所有表单组件都可以复用这个混入，不用重复写加载状态和错误处理。

---

## 11.7 自定义指令基础

### 注册全局指令

```javascript
// main.js
// 注册全局指令（所有组件都能用）
Vue.directive('focus', {
  // 当被绑定元素插入到 DOM 时调用
  inserted(el) {
    el.focus()  // 让输入框自动聚焦
  }
})
```

```vue
<!-- 使用指令 -->
<template>
  <input v-focus />  <!-- 页面加载后自动聚焦 -->
</template>
```

### 注册局部指令

```vue
<script>
export default {
  directives: {
    // 只在这个组件中可用
    focus: {
      inserted(el) {
        el.focus()
      }
    }
  }
}
</script>

<template>
  <input v-focus />  <!-- 自动聚焦 -->
</template>
```

> **原理**：指令的 `inserted` 钩子在元素插入父节点时执行，此时可以安全操作 DOM。

---

## 11.8 指令钩子函数

### 钩子函数详解

```javascript
Vue.directive('example', {
  // 1. bind - 只调用一次，指令第一次绑定到元素时
  bind(el, binding, vnode) {
    console.log('bind: 指令绑定到元素')
    // el: 指令所绑定的元素
    // binding: 包含指令的信息
    // vnode: Vue 的虚拟节点
  },
  
  // 2. inserted - 被绑定元素插入到父节点时调用
  inserted(el, binding, vnode) {
    console.log('inserted: 元素插入到 DOM')
    // 此时可以确保元素已经在 DOM 中
  },
  
  // 3. update - 所在组件的 VNode 更新时调用
  update(el, binding, vnode, oldVnode) {
    console.log('update: 组件更新')
    // 可能调用多次，即使值没变
  },
  
  // 4. componentUpdated - 指令所在组件的 VNode 及其子 VNode 全部更新后调用
  componentUpdated(el, binding, vnode, oldVnode) {
    console.log('componentUpdated: 组件及子组件都更新完成')
  },
  
  // 5. unbind - 只调用一次，指令与元素解绑时
  unbind(el, binding, vnode) {
    console.log('unbind: 指令与元素解绑')
    // 用于清理工作，比如移除事件监听
  }
})
```

### 钩子执行顺序

```
bind → inserted → (update → componentUpdated)* → unbind
```

### 钩子选择建议

| 场景 | 推荐钩子 | 原因 |
| --- | --- | --- |
| 初始化样式 | bind | 只需执行一次 |
| 操作 DOM（如聚焦） | inserted | 确保元素在 DOM 中 |
| 响应数据变化 | update | 数据变化时执行 |
| 清理工作 | unbind | 元素移除时执行 |

---

## 11.9 指令参数

### binding 对象

```javascript
Vue.directive('demo', {
  bind(el, binding) {
    console.log(binding.name)     // 'demo' - 指令名称
    console.log(binding.value)    // 'bar' - 指令的值
    console.log(binding.oldValue) // undefined - 旧值（update 时有值）
    console.log(binding.arg)      // 'foo' - 参数
    console.log(binding.modifiers) // {} - 修饰符对象
  }
})
```

```vue
<template>
  <!-- v-demo:foo="bar" -->
  <div v-demo:foo="'bar'"></div>
  <!-- name: 'demo' -->
  <!-- arg: 'foo' -->
  <!-- value: 'bar' -->
</template>
```

### 带参数的指令示例

```javascript
// 动态设置颜色
Vue.directive('color', {
  bind(el, binding) {
    el.style.color = binding.value  // 使用指令的值设置颜色
  },
  update(el, binding) {
    el.style.color = binding.value  // 值变化时更新颜色
  }
})
```

```vue
<template>
  <p v-color="textColor">这段文字有颜色</p>  <!-- 颜色随 textColor 变化 -->
</template>

<script>
export default {
  data() {
    return {
      textColor: 'red'  // 初始颜色
    }
  }
}
</script>
```

### 带参数的指令

```javascript
Vue.directive('demo', {
  bind(el, binding) {
    console.log(binding.arg)   // 'foo' - 参数名
    console.log(binding.value) // 'bar' - 指令的值
  }
})
```

```vue
<template>
  <div v-demo:foo="'bar'"></div>  <!-- arg: 'foo', value: 'bar' -->
</template>
```

---

## 11.10 实际自定义指令示例

### 防抖指令

```javascript
Vue.directive('debounce', {
  bind(el, binding) {
    let timer = null  // 定时器变量
    const delay = binding.value || 300  // 延迟时间，默认 300ms
    
    el.addEventListener('click', () => {
      // 每次点击都清除之前的定时器
      if (timer) {
        clearTimeout(timer)
      }
      // 设置新的定时器
      timer = setTimeout(() => {
        binding.value()  // 执行传入的函数
      }, delay)
    })
  },
  unbind(el) {
    // 清理工作（虽然这个例子不需要）
  }
})
```

```vue
<template>
  <button v-debounce="handleSubmit">
    提交  <!-- 点击后 300ms 内再次点击不会触发 -->
  </button>
</template>

<script>
export default {
  methods: {
    handleSubmit() {
      console.log('按钮被点击')
    }
  }
}
</script>
```

### 复制指令

```javascript
Vue.directive('copy', {
  bind(el, binding) {
    el.addEventListener('click', () => {
      const text = binding.value  // 要复制的文本
      navigator.clipboard.writeText(text).then(() => {
        console.log('复制成功')
      })
    })
  }
})
```

```vue
<template>
  <button v-copy="'要复制的文本'">
    点击复制  <!-- 点击后复制文本到剪贴板 -->
  </button>
</template>
```

### 权限指令

```javascript
Vue.directive('permission', {
  inserted(el, binding) {
    const permission = binding.value  // 需要的权限
    const userPermissions = getUserPermissions()  // 获取用户权限
    
    if (!userPermissions.includes(permission)) {
      // 如果用户没有权限，移除元素
      el.parentNode.removeChild(el)
    }
  }
})
```

```vue
<template>
  <button v-permission="'delete'">
    删除  <!-- 只有 delete 权限的用户能看到 -->
  </button>
</template>
```

---

## 11.11 函数简写

```javascript
// 如果只在 bind 和 update 时执行相同逻辑，可以简写
Vue.directive('color-swatch', function(el, binding) {
  el.style.backgroundColor = binding.value  // 设置背景色
})
```

```vue
<template>
  <div v-color-swatch="'red'"></div>  <!-- 背景色为红色 -->
</template>
```

> **原理**：这个函数会在 bind 和 update 时都被调用，相当于同时实现了 bind 和 update 钩子。

---

## 11.12 对象字面量

```javascript
Vue.directive('demo', {
  bind(el, binding) {
    console.log(binding.value.color) // 'red' - 对象属性
    console.log(binding.value.text)  // 'hello' - 对象属性
  }
})
```

```vue
<template>
  <div v-demo="{ color: 'red', text: 'hello' }"></div>  <!-- 传入对象 -->
</template>
```

> **优势**：可以传入多个值，更灵活。

---

## 11.13 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| 混入用途 | 提取组件公共逻辑，避免代码重复 |
| 混入合并策略 | data/methods/computed 组件优先，生命周期都执行 |
| 全局混入 | 影响所有实例，谨慎使用 |
| 自定义指令 | 扩展 Vue 模板语法，直接操作 DOM |
| 指令钩子 | bind、inserted、update、componentUpdated、unbind |
| 指令参数 | binding.arg、binding.value、binding.modifiers |

---

## 11.14 新手常见误区

### 误区 1："混入会覆盖组件的数据"

**错！** 混入不会覆盖，而是组件优先。

❌ 错误理解：
```javascript
// mixin.js
export const myMixin = {
  data() {
    return { message: '混入数据' }
  }
}

// 组件
export default {
  mixins: [myMixin],
  data() {
    return { message: '组件数据' }
  }
}
// 以为 message 是 '混入数据'
```

✅ 正确理解：
```javascript
// 实际 message 是 '组件数据'
// 组件的 data 会覆盖混入的同名 data
```

### 误区 2："自定义指令的 inserted 和 bind 没区别"

**不是的。** 它们的执行时机不同。

❌ 错误做法：
```javascript
Vue.directive('focus', {
  bind(el) {
    el.focus()  // ❌ 此时元素可能还没插入 DOM
  }
})
```

✅ 正确做法：
```javascript
Vue.directive('focus', {
  inserted(el) {
    el.focus()  // ✅ 确保元素已经在 DOM 中
  }
})
```

### 误区 3："全局混入很方便，应该多用"

**谨慎使用！** 全局混入会影响所有实例。

❌ 错误做法：
```javascript
// 滥用全局混入
Vue.mixin({
  created() {
    console.log('每个组件都会执行')  // 包括第三方组件
  }
})
```

✅ 正确做法：
```javascript
// 只在必要时使用，比如插件开发
// 普通项目用局部混入
export default {
  mixins: [myMixin]  // 明确指定使用
}
```

### 误区 4："自定义指令可以替代组件"

**不是的。** 指令和组件用途不同。

❌ 错误理解：
```javascript
// 用指令实现复杂 UI
Vue.directive('modal', {
  // 复杂的 DOM 操作
})
```

✅ 正确理解：
```javascript
// 指令适合简单的 DOM 操作
Vue.directive('focus', {
  inserted(el) { el.focus() }
})

// 复杂 UI 用组件
<ModalComponent />
```

### 误区 5："混入的命名冲突无所谓"

**有影响！** 命名冲突会导致覆盖。

❌ 错误做法：
```javascript
// mixin1.js
export const mixin1 = {
  methods: {
    hello() { console.log('混入 1') }
  }
}

// mixin2.js
export const mixin2 = {
  methods: {
    hello() { console.log('混入 2') }
  }
}

// 组件
export default {
  mixins: [mixin1, mixin2],  // ❌ hello 方法冲突
}
```

✅ 正确做法：
```javascript
// 使用有前缀的命名
export const formMixin = {
  methods: {
    formMixinHello() { console.log('表单混入') }
  }
}
```

---

## 11.15 动手练习

### 练习 1：基础练习 - 创建时间格式化混入

创建一个混入，包含 `formatTime` 方法，将时间戳格式化为 `YYYY-MM-DD` 格式。

<details>
<summary>点击查看答案</summary>

```javascript
// timeMixin.js
export const timeMixin = {
  methods: {
    formatTime(timestamp) {
      const date = new Date(timestamp)  // 创建 Date 对象
      const year = date.getFullYear()  // 获取年份
      const month = String(date.getMonth() + 1).padStart(2, '0')  // 获取月份，补零
      const day = String(date.getDate()).padStart(2, '0')  // 获取日期，补零
      return `${year}-${month}-${day}`  // 返回格式化字符串
    }
  }
}
```

```vue
<!-- 使用混入的组件 -->
<template>
  <div>
    <p>创建时间：{{ formatTime(createTime) }}</p>
  </div>
</template>

<script>
import { timeMixin } from './timeMixin.js'

export default {
  mixins: [timeMixin],
  data() {
    return {
      createTime: Date.now()
    }
  }
}
</script>
```

</details>

### 练习 2：进阶练习 - 创建长按指令

创建一个 `v-longpress` 指令，长按 2 秒后触发回调。

<details>
<summary>点击查看答案</summary>

```javascript
Vue.directive('longpress', {
  bind(el, binding) {
    let pressTimer = null  // 定时器变量
    
    // 鼠标按下时开始计时
    const startPress = () => {
      pressTimer = setTimeout(() => {
        binding.value()  // 2 秒后执行回调
      }, 2000)
    }
    
    // 鼠标松开时清除定时器
    const cancelPress = () => {
      if (pressTimer) {
        clearTimeout(pressTimer)
        pressTimer = null
      }
    }
    
    // 添加事件监听
    el.addEventListener('mousedown', startPress)
    el.addEventListener('mouseup', cancelPress)
    el.addEventListener('mouseleave', cancelPress)
  },
  unbind(el) {
    // 清理事件监听（防止内存泄漏）
    el.removeEventListener('mousedown', () => {})
    el.removeEventListener('mouseup', () => {})
    el.removeEventListener('mouseleave', () => {})
  }
})
```

```vue
<template>
  <button v-longpress="handleLongPress">
    长按 2 秒
  </button>
</template>

<script>
export default {
  methods: {
    handleLongPress() {
      console.log('长按触发！')
    }
  }
}
</script>
```

</details>

### 练习 3（挑战）：综合练习 - 创建表单验证混入和指令

创建一个混入实现表单验证逻辑，创建一个指令实现输入框高亮（验证失败时边框变红）。

<details>
<summary>点击查看答案</summary>

```javascript
// validationMixin.js
export const validationMixin = {
  data() {
    return {
      validationErrors: {}  // 存储验证错误
    }
  },
  methods: {
    validate(rules) {
      this.validationErrors = {}  // 清空错误
      let isValid = true  // 是否通过验证
      
      for (const [field, rule] of Object.entries(rules)) {
        const value = this[field]  // 获取字段值
        
        if (rule.required && !value) {
          this.validationErrors[field] = `${field} 是必填项`
          isValid = false
        }
        
        if (rule.minLength && value.length < rule.minLength) {
          this.validationErrors[field] = `${field} 至少 ${rule.minLength} 个字符`
          isValid = false
        }
        
        if (rule.pattern && !rule.pattern.test(value)) {
          this.validationErrors[field] = `${field} 格式不正确`
          isValid = false
        }
      }
      
      return isValid
    }
  }
}
```

```javascript
// 高亮指令
Vue.directive('highlight-error', {
  bind(el, binding) {
    if (binding.value) {
      el.style.borderColor = 'red'  // 有错误时边框变红
    }
  },
  update(el, binding) {
    if (binding.value) {
      el.style.borderColor = 'red'  // 有错误时边框变红
    } else {
      el.style.borderColor = ''  // 无错误时恢复
    }
  }
})
```

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <input
      v-model="username"
      v-highlight-error="validationErrors.username"
      placeholder="用户名"
    />
    <p v-if="validationErrors.username">{{ validationErrors.username }}</p>
    
    <input
      v-model="email"
      v-highlight-error="validationErrors.email"
      placeholder="邮箱"
    />
    <p v-if="validationErrors.email">{{ validationErrors.email }}</p>
    
    <button type="submit">提交</button>
  </form>
</template>

<script>
import { validationMixin } from './validationMixin.js'

export default {
  mixins: [validationMixin],
  data() {
    return {
      username: '',
      email: ''
    }
  },
  methods: {
    handleSubmit() {
      const isValid = this.validate({
        username: { required: true, minLength: 3 },
        email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
      })
      
      if (isValid) {
        console.log('验证通过，提交表单')
      }
    }
  }
}
</script>
```

</details>

---

## 下一章预告

下一章我们会学习 **渲染函数**——Vue 的底层渲染机制。你会发现 template 其实会被编译成渲染函数，而渲染函数让你直接控制渲染过程。你会学到：
- render 函数和 h 函数的用法
- 虚拟 DOM（VNode）的概念
- JSX 语法的基础
- 函数式组件的创建
