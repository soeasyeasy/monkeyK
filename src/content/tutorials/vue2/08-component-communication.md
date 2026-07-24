---
title: "第八章：组件通信"
description: "深入理解 Vue 2 组件间的各种通信方式，包括 Props/Emit、provide/inject 和 EventBus。"
---

# 第八章：组件通信

## 运行结果

- **父子通信**
  - 父组件通过 Props 向子组件传递数据
  - 子组件通过 $emit 向父组件发送事件
- **跨级通信**
  - 使用 provide/inject 实现祖先组件向后代组件传递数据
- **兄弟通信**
  - 通过 EventBus 实现兄弟组件间通信
- **状态管理**
  - 使用 Vuex 管理全局状态

## 代码详解

### 1. 父子组件通信

#### Props 向下传递

```vue
<!-- Parent.vue -->
<template>
  <div>
    <child :title="title" :count="count"></child>
  </div>
</template>

<script>
import Child from './Child.vue'

export default {
  components: { Child },
  data() {
    return {
      title: '父组件标题',
      count: 10
    }
  }
}
</script>
```

```vue
<!-- Child.vue -->
<template>
  <div>
    <h3>{{ title }}</h3>
    <p>计数：{{ count }}</p>
  </div>
</template>

<script>
export default {
  props: {
    title: String,
    count: Number
  }
}
</script>
```

#### $emit 向上传递

```vue
<!-- Child.vue -->
<template>
  <button @click="handleClick">
    通知父组件
  </button>
</template>

<script>
export default {
  methods: {
    handleClick() {
      this.$emit('update', { value: '子组件数据' })
    }
  }
}
</script>
```

```vue
<!-- Parent.vue -->
<template>
  <child @update="handleUpdate"></child>
</template>

<script>
export default {
  methods: {
    handleUpdate(data) {
      console.log('收到子组件数据：', data)
    }
  }
}
</script>
```

### 2. 双向绑定

```vue
<!-- Child.vue -->
<template>
  <input
    :value="value"
    @input="$emit('input', $event.target.value)"
  />
</template>

<script>
export default {
  props: ['value']
}
</script>
```

```vue
<!-- Parent.vue -->
<template>
  <child v-model="message"></child>
</template>

<script>
export default {
  data() {
    return {
      message: ''
    }
  }
}
</script>
```

### 3. .sync 修饰符

```vue
<!-- Child.vue -->
<template>
  <button @click="updateTitle">
    修改标题
  </button>
</template>

<script>
export default {
  props: ['title'],
  methods: {
    updateTitle() {
      this.$emit('update:title', '新标题')
    }
  }
}
</script>
```

```vue
<!-- Parent.vue -->
<template>
  <child :title.sync="pageTitle"></child>
</template>

<script>
export default {
  data() {
    return {
      pageTitle: '初始标题'
    }
  }
}
</script>
```

### 4. provide/inject 跨级通信

```vue
<!-- Ancestor.vue -->
<template>
  <div>
    <parent></parent>
  </div>
</template>

<script>
import Parent from './Parent.vue'

export default {
  components: { Parent },
  provide() {
    return {
      theme: 'dark',
      user: {
        name: '张三',
        age: 25
      }
    }
  }
}
</script>
```

```vue
<!-- Descendant.vue -->
<template>
  <div>
    <p>主题：{{ theme }}</p>
    <p>用户：{{ user.name }}</p>
  </div>
</template>

<script>
export default {
  inject: ['theme', 'user']
}
</script>
```

### 5. 响应式 provide/inject

```vue
<!-- Ancestor.vue -->
<script>
export default {
  data() {
    return {
      theme: 'light',
      user: { name: '张三' }
    }
  },
  provide() {
    return {
      theme: this.theme,
      user: this.user
    }
  }
}
</script>
```

```vue
<!-- Descendant.vue -->
<script>
export default {
  inject: {
    theme: {
      default: 'light'
    },
    user: {
      default: () => ({ name: '默认用户' })
    }
  }
}
</script>
```

### 6. EventBus 兄弟通信

```javascript
// event-bus.js
import Vue from 'vue'
export const EventBus = new Vue()
```

```vue
<!-- ComponentA.vue -->
<template>
  <button @click="sendEvent">
    发送事件
  </button>
</template>

<script>
import { EventBus } from './event-bus.js'

export default {
  methods: {
    sendEvent() {
      EventBus.$emit('custom-event', 'Hello from A')
    }
  }
}
</script>
```

```vue
<!-- ComponentB.vue -->
<template>
  <p>{{ message }}</p>
</template>

<script>
import { EventBus } from './event-bus.js'

export default {
  data() {
    return {
      message: ''
    }
  },
  mounted() {
    EventBus.$on('custom-event', (data) => {
      this.message = data
    })
  },
  beforeDestroy() {
    EventBus.$off('custom-event')
  }
}
</script>
```

### 7. $refs 访问组件

```vue
<template>
  <div>
    <child-component ref="child"></child-component>
    <button @click="callChildMethod">
      调用子组件方法
    </button>
  </div>
</template>

<script>
export default {
  methods: {
    callChildMethod() {
      this.$refs.child.childMethod()
    }
  }
}
</script>
```

```vue
<!-- ChildComponent.vue -->
<script>
export default {
  methods: {
    childMethod() {
      console.log('子组件方法被调用')
    }
  }
}
</script>
```

### 8. $parent 和 $children

```vue
<!-- Child.vue -->
<script>
export default {
  mounted() {
    // 访问父组件实例
    console.log(this.$parent)
    
    // 访问父组件数据
    console.log(this.$parent.parentData)
    
    // 调用父组件方法
    this.$parent.parentMethod()
  }
}
</script>
```

```vue
<!-- Parent.vue -->
<script>
export default {
  data() {
    return {
      parentData: '父组件数据'
    }
  },
  mounted() {
    // 访问子组件实例（不推荐）
    console.log(this.$children)
  },
  methods: {
    parentMethod() {
      console.log('父组件方法')
    }
  }
}
</script>
```

### 9. $root 访问根实例

```vue
<!-- AnyComponent.vue -->
<script>
export default {
  mounted() {
    // 访问根 Vue 实例
    console.log(this.$root)
    
    // 访问根实例数据
    console.log(this.$root.rootData)
  }
}
</script>
```

```javascript
// main.js
new Vue({
  data: {
    rootData: '根实例数据'
  },
  render: h => h(App)
}).$mount('#app')
```

### 10. 通信方式对比

| 方式 | 适用场景 | 优点 | 缺点 |
|------|----------|------|------|
| Props/Emit | 父子组件 | 简单直观 | 只能单向流动 |
| v-model | 表单组件 | 双向绑定 | 需要特定实现 |
| .sync | 属性同步 | 语法简洁 | Vue 3 已移除 |
| provide/inject | 跨级组件 | 解耦组件 | 难以追踪来源 |
| EventBus | 兄弟组件 | 灵活 | 难以维护 |
| Vuex | 全局状态 | 集中管理 | 代码量较大 |
| $refs | 直接访问 | 简单直接 | 破坏封装性 |

## 最佳实践

::: info
- 优先使用 Props/Emit 进行父子通信
- 跨级通信使用 provide/inject 或 Vuex
- 避免过度使用 EventBus
- 不要滥用 $parent/$children
- 复杂应用使用 Vuex 管理状态
- 保持组件的独立性和可复用性
:::
