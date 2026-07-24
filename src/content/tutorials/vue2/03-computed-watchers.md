---
title: "第三章：计算属性与侦听器"
description: "掌握 Vue 2 中的 computed 计算属性和 watch 侦听器，实现高效的数据处理。"
---

# 第三章：计算属性与侦听器

## 运行结果

- **计算属性**
  - `firstName = "张"`, `lastName = "三"`
  - `fullName = "张三"`
  - `message = "Hello"`
  - `reversedMessage = "olleH"`
- **侦听器**
  - 修改 `question` 时触发 API 调用
  - 显示答案结果
- **深度侦听**
  - 对象属性变化也能被检测到

## 代码详解

### 1. 计算属性基础

```vue
<template>
  <div>
    <p>姓名：{{ fullName }}</p>
    <p>反转消息：{{ reversedMessage }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      firstName: '张',
      lastName: '三',
      message: 'Hello'
    }
  },
  computed: {
    // 计算属性：依赖变化时自动更新
    fullName() {
      return this.firstName + ' ' + this.lastName
    },
    reversedMessage() {
      return this.message.split('').reverse().join('')
    }
  }
}
</script>
```

### 2. 计算属性 vs 方法

```vue
<template>
  <div>
    <!-- 计算属性：有缓存，依赖不变则不重新计算 -->
    <p>{{ reversedMessage }}</p>
    
    <!-- 方法：每次渲染都会调用 -->
    <p>{{ reverseMessage() }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello'
    }
  },
  computed: {
    reversedMessage() {
      console.log('计算属性执行')
      return this.message.split('').reverse().join('')
    }
  },
  methods: {
    reverseMessage() {
      console.log('方法执行')
      return this.message.split('').reverse().join('')
    }
  }
}
</script>
```

::: tip
计算属性基于响应式依赖进行缓存，只有在依赖变化时才重新计算。如果不需要缓存，使用方法即可。
:::

### 3. 计算属性的 setter

```vue
<template>
  <div>
    <input v-model="fullName" />
    <p>姓：{{ firstName }}，名：{{ lastName }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      firstName: '张',
      lastName: '三'
    }
  },
  computed: {
    fullName: {
      // getter
      get() {
        return this.firstName + ' ' + this.lastName
      },
      // setter
      set(newValue) {
        const names = newValue.split(' ')
        this.firstName = names[0]
        this.lastName = names[names.length - 1] || ''
      }
    }
  }
}
</script>
```

### 4. 侦听器基础

```vue
<template>
  <div>
    <input v-model="question" placeholder="输入问题" />
    <p>{{ answer }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      question: '',
      answer: '等待输入...'
    }
  },
  watch: {
    // 侦听 question 变化
    question(newQuestion, oldQuestion) {
      if (newQuestion.indexOf('?') >= 0) {
        this.getAnswer()
      }
    }
  },
  methods: {
    getAnswer() {
      this.answer = '思考中...'
      // 模拟 API 调用
      setTimeout(() => {
        this.answer = '这是答案'
      }, 1000)
    }
  }
}
</script>
```

### 5. 深度侦听

```vue
<template>
  <div>
    <button @click="user.name = '李四'">修改名字</button>
    <button @click="user.age++">修改年龄</button>
    <p>{{ user }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: {
        name: '张三',
        age: 25
      }
    }
  },
  watch: {
    // 深度侦听对象变化
    user: {
      handler(newVal, oldVal) {
        console.log('用户变化：', newVal)
      },
      deep: true,  // 开启深度侦听
      immediate: true  // 立即执行
    }
  }
}
</script>
```

### 6. 侦听特定属性

```vue
<template>
  <div>
    <input v-model="user.name" />
    <input v-model="user.age" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: {
        name: '张三',
        age: 25
      }
    }
  },
  watch: {
    // 侦听对象的特定属性
    'user.name'(newVal, oldVal) {
      console.log(`名字变化：${oldVal} -> ${newVal}`)
    },
    'user.age'(newVal, oldVal) {
      console.log(`年龄变化：${oldVal} -> ${newVal}`)
    }
  }
}
</script>
```

### 7. 计算属性 vs 侦听器

```vue
<template>
  <div>
    <input v-model="firstName" />
    <input v-model="lastName" />
    
    <!-- 方式一：计算属性（推荐） -->
    <p>全名：{{ fullName }}</p>
    
    <!-- 方式二：侦听器 -->
    <p>全名：{{ fullName2 }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      firstName: '张',
      lastName: '三',
      fullName2: '张三'
    }
  },
  computed: {
    // 推荐：简洁、有缓存
    fullName() {
      return this.firstName + ' ' + this.lastName
    }
  },
  watch: {
    // 不推荐：代码冗长
    firstName(newVal) {
      this.fullName2 = newVal + ' ' + this.lastName
    },
    lastName(newVal) {
      this.fullName2 = this.firstName + ' ' + newVal
    }
  }
}
</script>
```

### 8. 侦听器选项

```javascript
export default {
  data() {
    return {
      question: '',
      items: []
    }
  },
  watch: {
    question: {
      handler(newVal, oldVal) {
        // 处理逻辑
      },
      deep: true,        // 深度侦听
      immediate: true,   // 立即执行
    },
    items: {
      handler(newVal, oldVal) {
        console.log('数组变化')
      },
      deep: true
    }
  }
}
```

## 最佳实践

::: info
- 优先使用计算属性处理同步的数据转换
- 需要执行异步操作或副作用时使用侦听器
- 避免在模板中使用复杂表达式，提取为计算属性
- 深度侦听会影响性能，谨慎使用
- 计算属性的 getter 应该是纯函数，没有副作用
:::
