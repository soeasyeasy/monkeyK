---
title: "第十五章：过渡与动画"
description: "学习 Vue 2 中的过渡和动画系统，实现流畅的页面交互效果。"
---

# 第十五章：过渡与动画

## 运行结果

- **单元素过渡**
  - 元素进入/离开时应用动画
  - 支持 CSS 和 JavaScript 钩子
- **列表过渡**
  - 列表项添加/删除/排序时动画
  - 支持移动动画
- **状态过渡**
  - 数字渐变动画
  - SVG 路径动画

## 代码详解

### 1. 单元素过渡

```vue
<template>
  <div>
    <button @click="show = !show">
      切换
    </button>
    
    <transition name="fade">
      <p v-if="show">Hello</p>
    </transition>
  </div>
</template>

<script>
export default {
  data() {
    return {
      show: true
    }
  }
}
</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
```

### 2. 过渡类名

```vue
<template>
  <transition
    name="custom"
    enter-active-class="animated fadeIn"
    leave-active-class="animated fadeOut"
  >
    <p v-if="show">Hello</p>
  </transition>
</template>
```

**Vue 提供的 6 个类名：**

- `v-enter`：进入开始状态
- `v-enter-active`：进入活跃状态
- `v-enter-to`：进入结束状态
- `v-leave`：离开开始状态
- `v-leave-active`：离开活跃状态
- `v-leave-to`：离开结束状态

### 3. CSS 动画

```vue
<style>
/* 进入动画 */
.fade-enter-active {
  animation: fade-in 0.5s;
}

/* 离开动画 */
.fade-leave-active {
  animation: fade-out 0.5s;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(20px);
  }
}
</style>
```

### 4. JavaScript 钩子

```vue
<template>
  <transition
    @before-enter="beforeEnter"
    @enter="enter"
    @after-enter="afterEnter"
    @enter-cancelled="enterCancelled"
    @before-leave="beforeLeave"
    @leave="leave"
    @after-leave="afterLeave"
    @leave-cancelled="leaveCancelled"
  >
    <p v-if="show">Hello</p>
  </transition>
</template>

<script>
export default {
  data() {
    return {
      show: true
    }
  },
  methods: {
    beforeEnter(el) {
      el.style.opacity = 0
      el.style.transform = 'translateY(-30px)'
    },
    enter(el, done) {
      // 触发重排
      el.offsetHeight
      
      el.style.transition = 'all 0.5s'
      el.style.opacity = 1
      el.style.transform = 'translateY(0)'
      
      // 调用 done 表示动画结束
      setTimeout(done, 500)
    },
    afterEnter(el) {
      console.log('进入完成')
    },
    enterCancelled(el) {
      console.log('进入取消')
    },
    beforeLeave(el) {
      el.style.opacity = 1
    },
    leave(el, done) {
      el.style.transition = 'all 0.5s'
      el.style.opacity = 0
      el.style.transform = 'translateY(30px)'
      
      setTimeout(done, 500)
    },
    afterLeave(el) {
      console.log('离开完成')
    },
    leaveCancelled(el) {
      console.log('离开取消')
    }
  }
}
</script>
```

### 5. 初始渲染过渡

```vue
<template>
  <transition appear>
    <p>页面加载时动画</p>
  </transition>
</template>

<style>
.v-enter-active {
  animation: fade-in 0.5s;
}
</style>
```

### 6. 多个元素过渡

```vue
<template>
  <transition mode="out-in">
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
      isEdit: false
    }
  }
}
</script>
```

### 7. 列表过渡

```vue
<template>
  <div>
    <button @click="add">添加</button>
    <button @click="remove">删除</button>
    <button @click="shuffle">洗牌</button>
    
    <transition-group name="list" tag="ul">
      <li v-for="item in items" :key="item">
        {{ item }}
      </li>
    </transition-group>
  </div>
</template>

<script>
import _ from 'lodash'

export default {
  data() {
    return {
      items: [1, 2, 3, 4, 5]
    }
  },
  methods: {
    add() {
      const randomIndex = Math.floor(Math.random() * (this.items.length + 1))
      this.items.splice(randomIndex, 0, this.items.length + 1)
    },
    remove() {
      const randomIndex = Math.floor(Math.random() * this.items.length)
      this.items.splice(randomIndex, 1)
    },
    shuffle() {
      this.items = _.shuffle(this.items)
    }
  }
}
</script>

<style>
.list-item {
  transition: all 0.8s ease;
}

.list-enter-active, .list-leave-active {
  transition: all 0.5s;
}

.list-enter, .list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 移动动画 */
.list-move {
  transition: transform 0.8s ease;
}
</style>
```

### 8. 列表过渡示例

```vue
<template>
  <div>
    <input v-model="query" />
    
    <transition-group
      name="staggered-fade"
      tag="ul"
      :css="false"
      @before-enter="beforeEnter"
      @enter="enter"
      @leave="leave"
    >
      <li
        v-for="(item, index) in computedList"
        :key="item"
        :data-index="index"
      >
        {{ item }}
      </li>
    </transition-group>
  </div>
</template>

<script>
import _ from 'lodash'

export default {
  data() {
    return {
      query: '',
      list: [
        'Bruce Lee',
        'Jackie Chan',
        'Chuck Norris',
        'Jet Li',
        'Jacky Cheung'
      ]
    }
  },
  computed: {
    computedList() {
      return _.filter(this.list, item => {
        return item.toLowerCase().includes(this.query.toLowerCase())
      })
    }
  },
  methods: {
    beforeEnter(el) {
      el.style.opacity = 0
      el.style.height = 0
    },
    enter(el, done) {
      const delay = el.dataset.index * 150
      setTimeout(() => {
        el.style.transition = 'all 0.4s'
        el.style.opacity = 1
        el.style.height = '1.5em'
        setTimeout(done, 400)
      }, delay)
    },
    leave(el, done) {
      const delay = el.dataset.index * 150
      setTimeout(() => {
        el.style.transition = 'all 0.4s'
        el.style.opacity = 0
        el.style.height = 0
        setTimeout(done, 400)
      }, delay)
    }
  }
}
</script>
```

### 9. 状态过渡

```vue
<template>
  <div>
    <input v-model.number="firstNumber" type="number" step="20" /> +
    <input v-model.number="secondNumber" type="number" step="20" /> =
    {{ result }}
    
    <p>
      <span :style="{ fontSize: animatedValue + 'px' }">
        {{ animatedValue }}
      </span>
    </p>
  </div>
</template>

<script>
import TWEEN from '@tweenjs/tween.js'

export default {
  data() {
    return {
      firstNumber: 20,
      secondNumber: 40,
      animatedValue: 0
    }
  },
  computed: {
    result() {
      return this.firstNumber + this.secondNumber
    }
  },
  watch: {
    result(newVal) {
      const vm = this
      
      new TWEEN.Tween({ value: vm.animatedValue })
        .to({ value: newVal }, 500)
        .onUpdate(function() {
          vm.animatedValue = Math.round(this.value)
        })
        .start()
    }
  },
  mounted() {
    function animate() {
      if (TWEEN.update()) {
        requestAnimationFrame(animate)
      }
    }
    animate()
  }
}
</script>
```

### 10. 路由过渡

```vue
<template>
  <transition :name="transitionName" mode="out-in">
    <router-view></router-view>
  </transition>
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

.slide-left-enter,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to,
.slide-right-enter {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
```

## 最佳实践

::: info
- 简单过渡使用 CSS transition
- 复杂动画使用 CSS animation
- 需要 JavaScript 控制时使用钩子函数
- 列表过渡必须使用唯一的 key
- 使用 mode 属性控制过渡顺序
- 路由过渡提升用户体验
:::
