---
title: "第七章：组件基础"
description: "学习 Vue 2 组件系统的核心概念，包括组件注册、Props 和自定义事件。"
---

# 第七章：组件基础

## 运行结果

- **组件注册**
  - 全局组件可在任意位置使用
  - 局部组件仅在注册处可用
- **Props 传递**
  - 父组件向子组件传递数据
  - 支持类型验证和默认值
- **自定义事件**
  - 子组件通过 $emit 触发事件
  - 父组件监听并处理事件

## 代码详解

### 1. 组件注册

#### 全局组件

```javascript
// main.js
import Vue from 'vue'
import App from './App.vue'

// 全局注册组件
Vue.component('my-component', {
  template: '<div>这是一个全局组件</div>'
})

new Vue({
  render: h => h(App)
}).$mount('#app')
```

```vue
<!-- App.vue -->
<template>
  <div>
    <my-component></my-component>
    <my-component></my-component>
  </div>
</template>
```

#### 局部组件

```vue
<template>
  <div>
    <local-component></local-component>
  </div>
</template>

<script>
// 定义组件
const LocalComponent = {
  template: '<div>这是一个局部组件</div>'
}

export default {
  components: {
    LocalComponent
  }
}
</script>
```

### 2. 单文件组件（SFC）

```vue
<!-- MyComponent.vue -->
<template>
  <div class="my-component">
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>
    <button @click="handleClick">点击我</button>
  </div>
</template>

<script>
export default {
  name: 'MyComponent',
  data() {
    return {
      message: 'Hello from component'
    }
  },
  methods: {
    handleClick() {
      console.log('Button clicked')
    }
  }
}
</script>

<style scoped>
.my-component {
  padding: 20px;
  border: 1px solid #ddd;
}
</style>
```

```vue
<!-- 使用组件 -->
<template>
  <div>
    <my-component></my-component>
  </div>
</template>

<script>
import MyComponent from './MyComponent.vue'

export default {
  components: {
    MyComponent
  }
}
</script>
```

### 3. Props 基础

```vue
<!-- ChildComponent.vue -->
<template>
  <div>
    <h3>{{ title }}</h3>
    <p>计数：{{ count }}</p>
    <p>消息：{{ message }}</p>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      default: 0
    },
    message: {
      type: String,
      default: '默认消息'
    }
  }
}
</script>
```

```vue
<!-- 父组件 -->
<template>
  <div>
    <child-component
      title="组件标题"
      :count="10"
      message="自定义消息"
    ></child-component>
  </div>
</template>

<script>
import ChildComponent from './ChildComponent.vue'

export default {
  components: {
    ChildComponent
  }
}
</script>
```

### 4. Props 验证

```vue
<script>
export default {
  props: {
    // 基础类型检查
    propA: Number,
    
    // 多种类型
    propB: [String, Number],
    
    // 必填 + 类型
    propC: {
      type: String,
      required: true
    },
    
    // 带默认值
    propD: {
      type: Number,
      default: 100
    },
    
    // 对象默认值
    propE: {
      type: Object,
      default() {
        return { message: '默认对象' }
      }
    },
    
    // 自定义验证函数
    propF: {
      validator(value) {
        return ['success', 'warning', 'danger'].includes(value)
      }
    }
  }
}
</script>
```

### 5. Props 类型

```vue
<script>
export default {
  props: {
    // 基本类型
    stringProp: String,
    numberProp: Number,
    booleanProp: Boolean,
    arrayProp: Array,
    objectProp: Object,
    functionProp: Function,
    
    // 构造函数
    dateProp: Date,
    
    // 自定义类
    customProp: {
      type: Person, // 自定义构造函数
      required: true
    }
  }
}
</script>
```

### 6. 自定义事件

```vue
<!-- ChildComponent.vue -->
<template>
  <button @click="handleClick">
    点击触发事件
  </button>
</template>

<script>
export default {
  methods: {
    handleClick() {
      // 触发事件，传递数据
      this.$emit('custom-event', {
        message: 'Hello from child',
        timestamp: Date.now()
      })
    }
  }
}
</script>
```

```vue
<!-- 父组件 -->
<template>
  <div>
    <child-component @custom-event="handleEvent"></child-component>
    <p v-if="eventData">
      收到消息：{{ eventData.message }}
    </p>
  </div>
</template>

<script>
import ChildComponent from './ChildComponent.vue'

export default {
  components: {
    ChildComponent
  },
  data() {
    return {
      eventData: null
    }
  },
  methods: {
    handleEvent(data) {
      this.eventData = data
      console.log('收到子组件事件：', data)
    }
  }
}
</script>
```

### 7. 事件修饰符

```vue
<template>
  <div>
    <!-- 只触发一次 -->
    <child-component @custom-event.once="handleOnce"></child-component>
    
    <!-- 阻止冒泡 -->
    <child-component @custom-event.stop="handleStop"></child-component>
  </div>
</template>
```

### 8. 组件通信模式

```vue
<!-- 父传子：Props -->
<template>
  <child :message="parentMessage"></child>
</template>

<!-- 子传父：Events -->
<template>
  <child @update="handleUpdate"></child>
</template>

<!-- 双向绑定 -->
<template>
  <child v-model="value"></child>
</template>

<script>
// 子组件实现 v-model
export default {
  props: ['value'],
  methods: {
    updateValue(newValue) {
      this.$emit('input', newValue)
    }
  }
}
</script>
```

### 9. 动态组件

```vue
<template>
  <div>
    <button @click="currentTab = 'home'">首页</button>
    <button @click="currentTab = 'about'">关于</button>
    <button @click="currentTab = 'contact'">联系</button>
    
    <component :is="currentTab"></component>
  </div>
</template>

<script>
import Home from './Home.vue'
import About from './About.vue'
import Contact from './Contact.vue'

export default {
  components: {
    Home,
    About,
    Contact
  },
  data() {
    return {
      currentTab: 'home'
    }
  }
}
</script>
```

### 10. keep-alive 缓存

```vue
<template>
  <keep-alive>
    <component :is="currentView">
      <!-- 被缓存的组件不会重新创建 -->
    </component>
  </keep-alive>
</template>

<script>
export default {
  data() {
    return {
      currentView: 'home'
    }
  }
}
</script>
```

## 最佳实践

::: info
- 组件名使用 PascalCase 或 kebab-case
- Props 使用驼峰命名，HTML 中使用短横线命名
- 始终为 Props 指定类型和默认值
- 事件名使用 kebab-case
- 合理使用全局/局部组件注册
- 使用 keep-alive 缓存不活跃的组件实例
:::
