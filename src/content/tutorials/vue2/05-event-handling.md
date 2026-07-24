---
title: "第五章：事件处理"
description: "学习 Vue 2 中的事件处理机制，包括事件绑定、修饰符和自定义事件。"
---

# 第五章：事件处理

## 运行结果

- **基础事件**
  - 点击按钮计数器增加
  - 显示当前计数值
- **事件修饰符**
  - 阻止默认行为
  - 阻止事件冒泡
  - 只触发一次
- **按键修饰符**
  - 回车键提交表单
  - Esc 键取消操作

## 代码详解

### 1. 基础事件绑定

```vue
<template>
  <div>
    <!-- 完整语法 -->
    <button v-on:click="counter++">点击次数：{{ counter }}</button>
    
    <!-- 缩写 -->
    <button @click="counter++">点击次数：{{ counter }}</button>
    
    <!-- 调用方法 -->
    <button @click="increment">增加</button>
    
    <!-- 传递参数 -->
    <button @click="greet('Hello')">打招呼</button>
    
    <!-- 访问原生事件对象 -->
    <button @click="showEvent">显示事件</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      counter: 0,
      name: 'Vue'
    }
  },
  methods: {
    increment() {
      this.counter++
    },
    greet(message) {
      alert(message + ' ' + this.name)
    },
    showEvent(event) {
      alert(`事件类型：${event.type}\n目标元素：${event.target.tagName}`)
    }
  }
}
</script>
```

### 2. 事件修饰符

```vue
<template>
  <div>
    <!-- .stop：阻止事件冒泡 -->
    <div @click="outerClick">
      <button @click.stop="innerClick">内部按钮</button>
    </div>
    
    <!-- .prevent：阻止默认行为 -->
    <form @submit.prevent="onSubmit">
      <button type="submit">提交</button>
    </form>
    
    <!-- .capture：使用捕获模式 -->
    <div @click.capture="onCapture">
      <button>按钮</button>
    </div>
    
    <!-- .self：只当事件从元素本身触发 -->
    <div @click.self="onSelfClick">
      <button>按钮</button>
    </div>
    
    <!-- .once：只触发一次 -->
    <button @click.once="onOnceClick">只触发一次</button>
    
    <!-- .passive：被动监听（优化滚动性能） -->
    <div @scroll.passive="onScroll">
      <!-- 内容 -->
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    outerClick() {
      console.log('外层点击')
    },
    innerClick() {
      console.log('内层点击')
    },
    onSubmit() {
      console.log('表单提交')
    },
    onCapture() {
      console.log('捕获阶段')
    },
    onSelfClick() {
      console.log('自身点击')
    },
    onOnceClick() {
      console.log('只会执行一次')
    },
    onScroll() {
      console.log('滚动')
    }
  }
}
</script>
```

### 3. 按键修饰符

```vue
<template>
  <div>
    <!-- 按键别名 -->
    <input @keyup.enter="submit" placeholder="回车提交" />
    <input @keyup.tab="nextField" />
    <input @keyup.delete="clearInput" />
    <input @keyup.esc="cancel" />
    <input @keyup.space="toggle" />
    <input @keyup.up="moveUp" />
    <input @keyup.down="moveDown" />
    <input @keyup.left="moveLeft" />
    <input @keyup.right="moveRight" />
    
    <!-- 自定义按键别名 -->
    <input @keyup.f1="showHelp" />
    
    <!-- 系统修饰键 -->
    <button @click.ctrl="onClick">Ctrl + 点击</button>
    <button @click.alt="onClick">Alt + 点击</button>
    <button @click.shift="onClick">Shift + 点击</button>
    <button @click.meta="onClick">Meta + 点击</button>
    
    <!-- 精确修饰符（Vue 2.5.0+） -->
    <button @click.ctrl.exact="onCtrlClick">仅 Ctrl</button>
  </div>
</template>

<script>
export default {
  methods: {
    submit() {
      console.log('回车提交')
    },
    nextField() {
      console.log('Tab 切换')
    },
    clearInput() {
      console.log('清空输入')
    },
    cancel() {
      console.log('取消操作')
    },
    toggle() {
      console.log('切换状态')
    },
    moveUp() {
      console.log('向上移动')
    },
    moveDown() {
      console.log('向下移动')
    },
    moveLeft() {
      console.log('向左移动')
    },
    moveRight() {
      console.log('向右移动')
    },
    showHelp() {
      console.log('显示帮助')
    },
    onClick() {
      console.log('组合键点击')
    },
    onCtrlClick() {
      console.log('仅 Ctrl 点击')
    }
  }
}
</script>
```

### 4. 自定义按键修饰符

```javascript
// main.js
import Vue from 'vue'

// 全局配置
Vue.config.keyCodes.f1 = 112
Vue.config.keyCodes.pageDown = 34

// 使用
// <input @keyup.f1="showHelp" />
// <input @keyup.pageDown="nextPage" />
```

### 5. 鼠标按钮修饰符

```vue
<template>
  <div>
    <button @click.left="leftClick">左键点击</button>
    <button @click.right="rightClick">右键点击</button>
    <button @click.middle="middleClick">中键点击</button>
  </div>
</template>

<script>
export default {
  methods: {
    leftClick() {
      console.log('左键点击')
    },
    rightClick() {
      console.log('右键点击')
    },
    middleClick() {
      console.log('中键点击')
    }
  }
}
</script>
```

### 6. 事件处理中的 $event

```vue
<template>
  <div>
    <!-- 访问原生事件对象 -->
    <button @click="handleClick($event, '参数')">按钮</button>
    
    <!-- 在组件中使用 -->
    <custom-component @custom-event="handleCustom($event)" />
  </div>
</template>

<script>
export default {
  methods: {
    handleClick(event, param) {
      console.log('事件对象：', event)
      console.log('参数：', param)
      console.log('目标元素：', event.target)
    },
    handleCustom(payload) {
      console.log('自定义事件数据：', payload)
    }
  }
}
</script>
```

### 7. 组件中的事件

```vue
<!-- ChildComponent.vue -->
<template>
  <button @click="onClick">子组件按钮</button>
</template>

<script>
export default {
  methods: {
    onClick() {
      // 触发自定义事件
      this.$emit('custom-event', { message: 'Hello from child' })
    }
  }
}
</script>
```

```vue
<!-- ParentComponent.vue -->
<template>
  <child-component @custom-event="handleEvent" />
</template>

<script>
import ChildComponent from './ChildComponent.vue'

export default {
  components: {
    ChildComponent
  },
  methods: {
    handleEvent(payload) {
      console.log('收到子组件事件：', payload.message)
    }
  }
}
</script>
```

### 8. .sync 修饰符（Vue 2.3.0+）

```vue
<!-- 父组件 -->
<template>
  <child-component :title.sync="pageTitle" />
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

```vue
<!-- 子组件 -->
<template>
  <div>
    <h1>{{ title }}</h1>
    <button @click="updateTitle">修改标题</button>
  </div>
</template>

<script>
export default {
  props: ['title'],
  methods: {
    updateTitle() {
      // 触发 update:title 事件
      this.$emit('update:title', '新标题')
    }
  }
}
</script>
```

## 最佳实践

::: info
- 优先使用 `@click` 缩写语法
- 合理使用事件修饰符简化代码
- 避免在模板中写复杂的事件处理逻辑
- 组件通信使用自定义事件 `$emit`
- 使用 `.sync` 修饰符实现双向绑定
- 注意事件冒泡和默认行为的处理
:::
