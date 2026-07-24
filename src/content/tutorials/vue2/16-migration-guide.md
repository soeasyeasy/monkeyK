---
title: "第十六章：Vue 2 到 Vue 3 迁移指南"
description: "了解 Vue 2 到 Vue 3 的破坏性变更和迁移策略，帮助项目平滑升级。"
---

# 第十六章：Vue 2 到 Vue 3 迁移指南

## 运行结果

- **迁移工具**
  - 使用迁移构建版本检测不兼容代码
  - 逐步修复兼容性问题
- **新特性**
  - Composition API
  - Teleport
  - Suspense
  - 更好的 TypeScript 支持

## 代码详解

### 1. 全局 API 变更

#### Vue 2

```javascript
import Vue from 'vue'

// 全局配置
Vue.config.productionTip = false

// 全局组件
Vue.component('my-component', {
  // ...
})

// 全局指令
Vue.directive('focus', {
  // ...
})

// 全局混入
Vue.mixin({
  // ...
})

// 扩展构造函数
const MyComponent = Vue.extend({
  // ...
})

// 创建实例
new Vue({
  render: h => h(App)
}).$mount('#app')
```

#### Vue 3

```javascript
import { createApp } from 'vue'

const app = createApp(App)

// 全局配置
app.config.productionTip = false

// 全局组件
app.component('my-component', {
  // ...
})

// 全局指令
app.directive('focus', {
  // ...
})

// 全局混入
app.mixin({
  // ...
})

// 挂载
app.mount('#app')
```

### 2. 移除的特性

#### Filters（过滤器）

```vue
<!-- Vue 2 -->
<template>
  <p>{{ message | capitalize }}</p>
</template>

<script>
export default {
  filters: {
    capitalize(value) {
      return value.toUpperCase()
    }
  }
}
</script>
```

```vue
<!-- Vue 3：使用 computed 或方法 -->
<template>
  <p>{{ capitalizedMessage }}</p>
</template>

<script>
import { computed } from 'vue'

export default {
  setup() {
    const message = ref('hello')
    
    const capitalizedMessage = computed(() => {
      return message.value.toUpperCase()
    })
    
    return { capitalizedMessage }
  }
}
</script>
```

#### .sync 修饰符

```vue
<!-- Vue 2 -->
<template>
  <child :title.sync="pageTitle" />
</template>

<script>
// 子组件
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
<!-- Vue 3：使用 v-model -->
<template>
  <child v-model:title="pageTitle" />
</template>

<script>
// 子组件
import { defineProps, defineEmits } from 'vue'

const props = defineProps(['title'])
const emit = defineEmits(['update:title'])

function updateTitle() {
  emit('update:title', '新标题')
}
</script>
```

#### $on、$off、$once

```javascript
// Vue 2：EventBus
const EventBus = new Vue()

EventBus.$on('event', handler)
EventBus.$emit('event', data)
EventBus.$off('event', handler)
```

```javascript
// Vue 3：使用 mitt 或 tiny-emitter
import mitt from 'mitt'

const emitter = mitt()

emitter.on('event', handler)
emitter.emit('event', data)
emitter.off('event', handler)
```

### 3. v-model 变更

```vue
<!-- Vue 2 -->
<template>
  <child v-model="value" />
  <!-- 等价于 -->
  <child :value="value" @input="value = $event" />
</template>
```

```vue
<!-- Vue 3 -->
<template>
  <child v-model="value" />
  <!-- 等价于 -->
  <child :modelValue="value" @update:modelValue="value = $event" />
  
  <!-- 多个 v-model -->
  <child v-model:title="pageTitle" v-model:content="pageContent" />
</template>

<script>
// 子组件
export default {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    function updateValue(newValue) {
      emit('update:modelValue', newValue)
    }
  }
}
</script>
```

### 4. 移除的特性列表

| 特性 | Vue 2 | Vue 3 |
|------|-------|-------|
| Filters | ✅ | ❌ 使用 computed/methods |
| .sync | ✅ | ❌ 使用 v-model:prop |
| $on/$off/$once | ✅ | ❌ 使用 mitt |
| $children | ✅ | ❌ 使用 refs |
| $listeners | ✅ | ❌ 合并到 $attrs |
| $destroy | ✅ | ❌ 手动管理 |
| functional 选项 | ✅ | ❌ 使用函数式组件 |
| render 函数参数 | h 参数 | 导入 h |

### 5. 新增特性

#### Teleport

```vue
<template>
  <button @click="modalOpen = true">
    打开模态框
  </button>
  
  <teleport to="body">
    <div v-if="modalOpen" class="modal">
      <p>这是模态框内容</p>
      <button @click="modalOpen = false">关闭</button>
    </div>
  </teleport>
</template>
```

#### Suspense

```vue
<template>
  <suspense>
    <template #default>
      <async-component />
    </template>
    <template #fallback>
      <div>加载中...</div>
    </template>
  </suspense>
</template>

<script>
import { defineAsyncComponent } from 'vue'

const AsyncComponent = defineAsyncComponent(() =>
  import('./AsyncComponent.vue')
)
</script>
```

#### 多 v-model

```vue
<template>
  <user-form
    v-model:firstName="firstName"
    v-model:lastName="lastName"
  />
</template>

<script>
// 子组件
export default {
  props: ['firstName', 'lastName'],
  emits: ['update:firstName', 'update:lastName'],
  setup(props, { emit }) {
    function updateFirstName(value) {
      emit('update:firstName', value)
    }
    
    function updateLastName(value) {
      emit('update:lastName', value)
    }
  }
}
</script>
```

### 6. 生命周期变更

```javascript
// Vue 2
export default {
  beforeCreate() {},
  created() {},
  beforeMount() {},
  mounted() {},
  beforeUpdate() {},
  updated() {},
  beforeDestroy() {},
  destroyed() {}
}
```

```javascript
// Vue 3
import { onBeforeMount, onMounted, onBeforeUpdate, onUpdated, onBeforeUnmount, onUnmounted } from 'vue'

export default {
  setup() {
    onBeforeMount(() => {})
    onMounted(() => {})
    onBeforeUpdate(() => {})
    onUpdated(() => {})
    onBeforeUnmount(() => {})
    onUnmounted(() => {}
  }
}
```

**变更说明：**
- `beforeDestroy` → `onBeforeUnmount`
- `destroyed` → `onUnmounted`

### 7. 迁移步骤

#### 1. 使用迁移构建版本

```bash
npm install @vue/compat
```

```javascript
// vue.config.js
module.exports = {
  chainWebpack: config => {
    config.resolve.alias.set('vue', '@vue/compat')
  }
}
```

```javascript
// main.js
import Vue from 'vue'

Vue.configureCompat({
  MODE: 2,
  GLOBAL_MOUNT: false,
  FILTERS: false
})
```

#### 2. 逐步迁移

```bash
# 1. 运行迁移构建版本，查看警告
npm run serve

# 2. 根据警告逐步修复
# 3. 关闭已修复的特性
Vue.configureCompat({
  FEATURE_NAME: false
})

# 4. 所有特性关闭后，切换到 Vue 3
```

#### 3. 迁移工具

```bash
# 安装迁移工具
npm install -g @vue/compat-migration

# 运行迁移工具
vue-compat-migrate ./src
```

### 8. 完整迁移示例

#### Vue 2 版本

```vue
<template>
  <div>
    <p>{{ message | uppercase }}</p>
    <child :value.sync="count" />
    <button @click="show = !show">切换</button>
    <transition>
      <p v-if="show">Hello</p>
    </transition>
  </div>
</template>

<script>
export default {
  filters: {
    uppercase(value) {
      return value.toUpperCase()
    }
  },
  data() {
    return {
      message: 'hello',
      count: 0,
      show: true
    }
  }
}
</script>
```

#### Vue 3 版本

```vue
<template>
  <div>
    <p>{{ uppercaseMessage }}</p>
    <child v-model="count" />
    <button @click="show = !show">切换</button>
    <transition>
      <p v-if="show">Hello</p>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Child from './Child.vue'

const message = ref('hello')
const count = ref(0)
const show = ref(true)

const uppercaseMessage = computed(() => {
  return message.value.toUpperCase()
})
</script>
```

### 9. 迁移检查清单

- [ ] 全局 API 调用改为 createApp
- [ ] 移除 Filters
- [ ] .sync 改为 v-model:prop
- [ ] EventBus 改为 mitt
- [ ] v-model 更新为新的 API
- [ ] 生命周期钩子更名
- [ ] 移除 $children
- [ ] render 函数更新
- [ ] 移除 functional 选项
- [ ] 更新路由和状态管理库版本

## 最佳实践

::: info
- 使用迁移构建版本逐步迁移
- 优先处理破坏性变更
- 充分利用新特性改进代码
- 使用 Composition API 重构组件
- 更新所有依赖到兼容版本
- 充分测试后再上线
:::
