---
title: "第十一章：混入与自定义指令"
description: "学习 Vue 2 中的混入（mixins）和自定义指令，实现代码复用和 DOM 操作扩展。"
---

# 第十一章：混入与自定义指令

## 运行结果

- **混入**
  - 多个组件共享相同的逻辑
  - 生命周期钩子合并执行
  - 方法冲突时组件优先
- **自定义指令**
  - v-focus：自动聚焦输入框
  - v-color：动态设置文字颜色
  - v-debounce：按钮防抖

## 代码详解

### 1. 混入基础

```javascript
// mixin.js
export const myMixin = {
  data() {
    return {
      mixinMessage: '来自混入的数据'
    }
  },
  created() {
    console.log('混入的 created 钩子')
    this.hello()
  },
  methods: {
    hello() {
      console.log('hello from mixin')
    },
    mixinMethod() {
      console.log('混入的方法')
    }
  }
}
```

```vue
<!-- 使用混入 -->
<script>
import { myMixin } from './mixin.js'

export default {
  mixins: [myMixin],
  created() {
    console.log('组件的 created 钩子')
  },
  methods: {
    componentMethod() {
      console.log('组件的方法')
    }
  }
}
</script>
```

### 2. 混入合并策略

```javascript
// mixin.js
export const myMixin = {
  data() {
    return {
      message: '混入数据',
      shared: '混入的共享数据'
    }
  },
  methods: {
    hello() {
      console.log('混入的 hello')
    },
    sharedMethod() {
      console.log('混入的共享方法')
    }
  },
  created() {
    console.log('混入的 created')
  }
}
```

```vue
<script>
export default {
  mixins: [myMixin],
  data() {
    return {
      message: '组件数据', // 覆盖混入数据
      componentOnly: '组件独有'
    }
  },
  methods: {
    hello() {
      console.log('组件的 hello') // 覆盖混入方法
    }
  },
  created() {
    console.log('组件的 created')
  }
}
</script>
```

**合并规则：**
- data：组件数据优先
- methods：组件方法优先
- 生命周期钩子：都执行，混入先执行
- 自定义选项：由合并策略决定

### 3. 全局混入

```javascript
// main.js
import Vue from 'vue'

Vue.mixin({
  created() {
    console.log('全局混入的 created')
  }
})
```

::: warning
全局混入会影响所有 Vue 实例，包括第三方组件，谨慎使用。
:::

### 4. 实际混入示例

```javascript
// formMixin.js
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
```

```vue
<!-- 使用表单混入 -->
<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="username" />
    <button :disabled="formLoading">
      {{ formLoading ? '提交中...' : '提交' }}
    </button>
    <p v-if="formError">{{ formError }}</p>
  </form>
</template>

<script>
import { formMixin } from './formMixin.js'

export default {
  mixins: [formMixin],
  data() {
    return {
      username: ''
    }
  },
  methods: {
    async handleSubmit() {
      await this.submitForm(async () => {
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

### 5. 自定义指令基础

```javascript
// 注册全局指令
Vue.directive('focus', {
  // 当被绑定元素插入到 DOM 时调用
  inserted(el) {
    el.focus()
  }
})
```

```vue
<!-- 使用指令 -->
<template>
  <input v-focus />
</template>
```

### 6. 指令钩子函数

```javascript
Vue.directive('example', {
  // 只调用一次，指令第一次绑定到元素时调用
  bind(el, binding, vnode) {
    console.log('bind')
  },
  
  // 被绑定元素插入到父节点时调用
  inserted(el, binding, vnode) {
    console.log('inserted')
  },
  
  // 所在组件的 VNode 更新时调用
  update(el, binding, vnode, oldVnode) {
    console.log('update')
  },
  
  // 指令所在组件的 VNode 及其子 VNode 全部更新后调用
  componentUpdated(el, binding, vnode, oldVnode) {
    console.log('componentUpdated')
  },
  
  // 只调用一次，指令与元素解绑时调用
  unbind(el, binding, vnode) {
    console.log('unbind')
  }
})
```

### 7. 指令参数

```javascript
Vue.directive('color', {
  bind(el, binding) {
    el.style.color = binding.value
  },
  update(el, binding) {
    el.style.color = binding.value
  }
})
```

```vue
<template>
  <p v-color="textColor">这段文字有颜色</p>
</template>

<script>
export default {
  data() {
    return {
      textColor: 'red'
    }
  }
}
</script>
```

### 8. 带参数的指令

```javascript
Vue.directive('demo', {
  bind(el, binding) {
    console.log(binding.arg) // foo
    console.log(binding.value) // 'bar'
  }
})
```

```vue
<template>
  <div v-demo:foo="'bar'"></div>
</template>
```

### 9. 实际自定义指令示例

#### 防抖指令

```javascript
Vue.directive('debounce', {
  bind(el, binding) {
    let timer = null
    const delay = binding.value || 300
    
    el.addEventListener('click', () => {
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => {
        binding.value()
      }, delay)
    })
  },
  unbind(el) {
    // 清理工作
  }
})
```

```vue
<template>
  <button v-debounce="handleSubmit">
    提交
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

#### 复制指令

```javascript
Vue.directive('copy', {
  bind(el, binding) {
    el.addEventListener('click', () => {
      const text = binding.value
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
    点击复制
  </button>
</template>
```

#### 权限指令

```javascript
Vue.directive('permission', {
  inserted(el, binding) {
    const permission = binding.value
    const userPermissions = getUserPermissions()
    
    if (!userPermissions.includes(permission)) {
      el.parentNode.removeChild(el)
    }
  }
})
```

```vue
<template>
  <button v-permission="'delete'">
    删除
  </button>
</template>
```

### 10. 函数简写

```javascript
// 只在 bind 和 update 时触发相同行为
Vue.directive('color-swatch', function(el, binding) {
  el.style.backgroundColor = binding.value
})
```

### 11. 对象字面量

```javascript
Vue.directive('demo', {
  bind(el, binding) {
    console.log(binding.value.color) // 'red'
    console.log(binding.value.text) // 'hello'
  }
})
```

```vue
<template>
  <div v-demo="{ color: 'red', text: 'hello' }"></div>
</template>
```

## 最佳实践

::: info
- 混入用于提取组件公共逻辑
- 避免过度使用混入，保持组件独立性
- 自定义指令用于直接操作 DOM
- 指令名称使用 kebab-case
- 合理使用指令钩子函数
- 注意指令的性能影响
:::
