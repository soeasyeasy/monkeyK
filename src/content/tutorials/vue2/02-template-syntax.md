---
title: "第二章：模板语法"
description: "学习 Vue 2 的模板语法，包括插值、指令和过滤器。"
---

# 第二章：模板语法

## 运行结果

- **文本插值**
  - `message = "Hello Vue 2!"`
  - 页面显示：Hello Vue 2!
- **HTML 插值**
  - `rawHtml = "<strong>加粗文本</strong>"`
  - 显示为加粗的"加粗文本"
- **属性绑定**
  - `imageUrl = "https://example.com/image.jpg"`
  - img 标签的 src 属性被正确设置
- **过滤器**
  - `price = 99.5`
  - 显示：¥99.50

## 代码详解

### 1. 文本插值

```vue
<template>
  <div>
    <!-- 双大括号插值 -->
    <p>{{ message }}</p>
    
    <!-- 表达式 -->
    <p>{{ count + 1 }}</p>
    <p>{{ ok ? 'YES' : 'NO' }}</p>
    <p>{{ message.split('').reverse().join('') }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello Vue 2!',
      count: 0,
      ok: true
    }
  }
}
</script>
```

### 2. 原始 HTML

```vue
<template>
  <div>
    <!-- 使用 v-html 指令渲染 HTML -->
    <p v-html="rawHtml"></p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      rawHtml: '<strong style="color: red;">加粗红色文本</strong>'
    }
  }
}
</script>
```

::: warning
注意：动态渲染 HTML 可能导致 XSS 攻击，只对可信内容使用 v-html，永远不要用于用户输入。
:::

### 3. 属性绑定

```vue
<template>
  <div>
    <!-- 完整语法 -->
    <img v-bind:src="imageUrl" />
    
    <!-- 缩写 -->
    <img :src="imageUrl" />
    
    <!-- 动态属性名 -->
    <button :[attributeName]="value">按钮</button>
    
    <!-- 布尔属性 -->
    <button :disabled="isDisabled">按钮</button>
    
    <!-- 多个类名 -->
    <div :class="{ active: isActive, 'text-danger': hasError }"></div>
    
    <!-- 数组语法 -->
    <div :class="[baseClass, isActive ? activeClass : '']"></div>
    
    <!-- 样式绑定 -->
    <div :style="{ color: activeColor, fontSize: fontSize + 'px' }"></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      imageUrl: 'https://example.com/image.jpg',
      attributeName: 'title',
      value: '提示文本',
      isDisabled: false,
      isActive: true,
      hasError: false,
      baseClass: 'container',
      activeClass: 'active',
      activeColor: 'red',
      fontSize: 16
    }
  }
}
</script>
```

### 4. 过滤器

```vue
<template>
  <div>
    <!-- 使用过滤器 -->
    <p>{{ price | currency }}</p>
    <p>{{ message | capitalize }}</p>
    <p>{{ timestamp | formatDate('YYYY-MM-DD') }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      price: 99.5,
      message: 'hello world',
      timestamp: new Date()
    }
  },
  filters: {
    // 局部过滤器
    currency(value) {
      return '¥' + value.toFixed(2)
    },
    capitalize(value) {
      if (!value) return ''
      return value.charAt(0).toUpperCase() + value.slice(1)
    },
    formatDate(value, format) {
      // 简单的日期格式化示例
      const date = new Date(value)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }
}
</script>
```

#### 全局过滤器

```javascript
// main.js
import Vue from 'vue'

// 注册全局过滤器
Vue.filter('currency', function (value) {
  return '¥' + value.toFixed(2)
})

Vue.filter('capitalize', function (value) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
})
```

### 5. 指令

```vue
<template>
  <div>
    <!-- v-if: 条件渲染 -->
    <p v-if="type === 'A''>优秀</p>
    <p v-else-if="type === 'B'">良好</p>
    <p v-else>一般</p>
    
    <!-- v-show: 显示/隐藏 -->
    <p v-show="isVisible">这段文字会切换显示</p>
    
    <!-- v-for: 列表渲染 -->
    <ul>
      <li v-for="(item, index) in items" :key="item.id">
        {{ index + 1 }} - {{ item.name }}
      </li>
    </ul>
    
    <!-- v-on: 事件绑定 -->
    <button v-on:click="handleClick">点击</button>
    <button @click="handleClick">点击（缩写）</button>
    
    <!-- 事件修饰符 -->
    <form @submit.prevent="onSubmit">
      <button type="submit">提交</button>
    </form>
    
    <!-- 按键修饰符 -->
    <input @keyup.enter="submit" />
    
    <!-- v-model: 双向绑定 -->
    <input v-model="inputValue" />
    
    <!-- v-text: 更新文本内容 -->
    <p v-text="message"></p>
    
    <!-- v-once: 只渲染一次 -->
    <p v-once>{{ staticContent }}</p>
    
    <!-- v-pre: 跳过编译 -->
    <p v-pre>{{ 这里不会编译 }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      type: 'A',
      isVisible: true,
      items: [
        { id: 1, name: '项目一' },
        { id: 2, name: '项目二' },
        { id: 3, name: '项目三' }
      ],
      inputValue: '',
      message: 'Hello',
      staticContent: '静态内容'
    }
  },
  methods: {
    handleClick() {
      alert('按钮被点击')
    },
    onSubmit() {
      console.log('表单提交')
    },
    submit() {
      console.log('回车提交')
    }
  }
}
</script>
```

### 6. 指令动态参数

```vue
<template>
  <div>
    <!-- 动态属性名 -->
    <a :[attributeName]="url">链接</a>
    <button @[eventName]="handleEvent">按钮</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      attributeName: 'href',
      url: 'https://vuejs.org',
      eventName: 'click'
    }
  },
  methods: {
    handleEvent() {
      console.log('事件触发')
    }
  }
}
</script>
```

## 模板语法最佳实践

::: info
- 优先使用 `v-if` 进行条件渲染，频繁切换使用 `v-show`
- 列表渲染必须提供唯一的 `key` 属性
- 避免在模板中使用复杂的表达式，提取为计算属性
- 使用过滤器处理文本格式化
- 合理使用事件修饰符简化代码
- 注意 v-html 的安全风险
:::
