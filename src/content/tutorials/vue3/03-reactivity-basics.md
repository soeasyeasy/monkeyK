---
title: '第三章：响应式基础'
description: '深入理解 Vue 3 响应式系统，掌握 ref、reactive、computed 的原理与使用'
---

# 第三章：响应式基础

## 本章导读

前两章我们学会了用 `ref` 创建响应式数据，也知道了数据变了页面会自动更新。但你有没有想过：

- **为什么数据变了，页面会自动更新？** 这背后是怎么实现的？
- **ref 和 reactive 有什么区别？** 什么时候用哪个？
- **computed 是怎么做到"缓存"的？** 和普通函数有什么区别？

这一章我们会揭开响应式系统的面纱。理解原理后，你会更清楚什么时候该用什么 API，也能避免很多新手坑。

---

## 1 响应式原理：数据变了，页面怎么知道的？

### 核心概念：依赖收集与触发更新

Vue 的响应式系统基于两个核心步骤：

1. **依赖收集**：当组件渲染时，Vue 会记录"这个组件用到了哪些数据"
2. **触发更新**：当数据变化时，Vue 会通知"用到这个数据的组件"重新渲染

打个比方：

> 想象你是一个快递员（Vue），每次送快递（渲染页面）时，你都会记下"这个小区张三收了快递"。下次张三的快递到了，你就直接去通知他，而不是挨家挨户问。

### Proxy：Vue 3 的响应式核心

Vue 3 使用 `Proxy` 来监听数据变化。`Proxy` 是 ES6 的新特性，可以拦截对象的操作。

```javascript
// 原生 Proxy 示例
const handler = {
  // 拦截"读取"操作
  get(target, key) {
    console.log(`读取了 ${key}`)
    return target[key]
  },
  // 拦截"设置"操作
  set(target, key, value) {
    console.log(`设置了 ${key} = ${value}`)
    target[key] = value
    // 这里可以触发更新通知
    return true
  },
}

const obj = { count: 0 }
const proxy = new Proxy(obj, handler)

proxy.count // 输出：读取了 count
proxy.count = 1 // 输出：设置了 count = 1
```

> **原理**：`Proxy` 像给对象套了一层"代理"，所有对这个对象的操作都会先经过代理。Vue 在 `get` 时收集依赖，在 `set` 时触发更新。

### Vue 2 vs Vue 3 的响应式差异

| 特性     | Vue 2 (Object.defineProperty)  | Vue 3 (Proxy)          |
| -------- | ------------------------------ | ---------------------- |
| 监听方式 | 遍历对象所有属性，逐个定义监听 | 代理整个对象，按需拦截 |
| 新增属性 | 无法检测，需要用 `Vue.set`     | 自动检测               |
| 删除属性 | 无法检测，需要用 `Vue.delete`  | 自动检测               |
| 数组     | 需要重写数组方法               | 原生支持               |
| 性能     | 初始化时全量遍历，慢           | 访问时才拦截，快       |

> **一句话总结**：Vue 3 的 Proxy 更强大、更高效，解决了 Vue 2 的很多限制。

---

## 2 ref：基本类型的响应式

### 基础用法

`ref` 用于创建基本类型（数字、字符串、布尔值）的响应式数据：

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 创建一个响应式的数字
const count = ref(0)

// 创建一个响应式的字符串
const message = ref('Hello Vue!')

// 创建一个响应式的布尔值
const isVisible = ref(true)
</script>
```

> **原理**：`ref(0)` 返回一个 `Ref` 对象，结构大致是这样的：
>
> ```javascript
> {
>   _value: 0,  // 实际值存在这里
>   get value() {
>     // 收集依赖
>     return this._value
>   },
>   set value(newValue) {
>     this._value = newValue
>     // 触发更新
>   }
> }
> ```

### 访问和修改 ref

在 `<script>` 中，需要通过 `.value` 访问和修改：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

// ✅ 正确：通过 .value 访问
console.log(count.value) // 输出：0

// ✅ 正确：通过 .value 修改
count.value++
console.log(count.value) // 输出：1

// ❌ 错误：直接访问 count 得到的是 Ref 对象
console.log(count) // 输出：RefImpl {_value: 0, ...}
</script>
```

> **为什么需要 .value？** 因为基本类型（如数字）是"值传递"，无法被 Proxy 代理。Vue 把它包装成对象，通过 `.value` 来访问和修改。

### 在模板中自动解包

在 `<template>` 中使用 `ref` 时，Vue 会自动解包，不需要写 `.value`：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <!-- ✅ 模板中自动解包，不需要 .value -->
  <p>{{ count }}</p>

  <!-- ✅ 事件处理中也不需要 .value -->
  <button @click="count++">+1</button>
</template>
```

> **原理**：模板编译时，Vue 会自动处理 `ref` 的解包。这是为了让你写起来更简洁。

### ref 也可以包装对象

`ref` 不仅能包装基本类型，也能包装对象：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const user = ref({ name: '张三', age: 25 })

// 修改对象属性
user.value.name = '李四'

// 替换整个对象
user.value = { name: '王五', age: 30 }
</script>
```

> **原理**：当 `ref` 包装对象时，内部会调用 `reactive`，所以对象的属性也是响应式的。

---

## 3 reactive：对象的响应式

### 基础用法

`reactive` 用于创建对象的响应式版本：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  count: 0,
  user: {
    name: '张三',
    age: 25,
  },
  items: ['苹果', '香蕉'],
})
</script>
```

> **原理**：`reactive` 返回原对象的 `Proxy` 代理，所有属性的访问和修改都会被拦截，从而实现响应式。

### 直接访问，不需要 .value

与 `ref` 不同，`reactive` 对象的属性可以直接访问：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({ count: 0 })

// ✅ 直接访问
console.log(state.count) // 输出：0

// ✅ 直接修改
state.count++
console.log(state.count) // 输出：1
</script>
```

> **为什么不需要 .value？** 因为 `reactive` 代理的是对象本身，属性的访问和修改都会被拦截，所以可以直接操作。

### 深层响应式

`reactive` 是深层响应式——嵌套对象的属性变化也会被检测到：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  user: {
    name: '张三',
    address: {
      city: '北京',
    },
  },
})

// ✅ 深层属性变化也会被检测
state.user.address.city = '上海'
</script>
```

> **原理**：`reactive` 的 `get` 拦截器会递归地将嵌套对象也转换为响应式，所以无论多深的属性变化都能被检测到。

### reactive 的限制

`reactive` 有一个重要限制：**不能重新赋值整个对象**。

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({ count: 0 })

// ❌ 错误：重新赋值会丢失响应式
state = { count: 1 } // 这会报错，因为 state 是 const

// ✅ 正确：修改属性
state.count = 1
</script>
```

> **原理**：`reactive` 返回的是原对象的代理，重新赋值会改变变量指向，代理就失效了。如果需要重新赋值，用 `ref`。

### 解构会丢失响应式

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({ count: 0, name: '张三' })

// ❌ 解构后，count 和 name 不再是响应式
const { count, name } = state

// ✅ 使用 toRefs 保持响应式
import { toRefs } from 'vue'
const { count, name } = toRefs(state)
</script>
```

> **原理**：解构是"值拷贝"，拷贝出来的变量和原对象失去了联系。`toRefs` 会把每个属性转换成 `ref`，从而保持响应式。

---

## 4 ref vs reactive：怎么选？

### 对比表

| 特性     | ref            | reactive      |
| -------- | -------------- | ------------- |
| 适用类型 | 基本类型、对象 | 仅对象        |
| 访问方式 | `.value`       | 直接访问      |
| 重新赋值 | ✅ 可以        | ❌ 不行       |
| 解构     | ✅ 保持响应式  | ❌ 丢失响应式 |
| 模板中   | 自动解包       | 直接访问      |

### 选择建议

| 场景                             | 推荐                           |
| -------------------------------- | ------------------------------ |
| 基本类型（数字、字符串、布尔值） | `ref`                          |
| 对象、数组                       | `ref` 或 `reactive` 都可以     |
| 需要重新赋值整个对象             | `ref`                          |
| 需要解构                         | `ref` 或 `reactive` + `toRefs` |
| 表单状态、复杂对象               | `reactive`（代码更简洁）       |

> **新手建议**：统一用 `ref`，简单粗暴不容易出错。等熟悉了再用 `reactive` 优化代码。

---

## 5 computed：计算属性

### 基础用法

`computed` 用于声明计算属性——基于响应式数据计算出的新值：

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const firstName = ref('张')
const lastName = ref('三')

// 计算属性：全名
const fullName = computed(() => {
  return firstName.value + lastName.value
})
</script>

<template>
  <p>{{ fullName }}</p>
</template>
```

> **原理**：`computed` 返回一个 `ComputedRef` 对象，它会：
>
> 1. 在首次访问时执行计算函数，并记录依赖（`firstName` 和 `lastName`）
> 2. 缓存计算结果
> 3. 当依赖变化时，标记为"需要重新计算"
> 4. 下次访问时，如果标记为"需要重新计算"，才重新执行计算函数

### computed 的缓存特性

`computed` 会缓存计算结果，只有依赖变化时才重新计算：

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const count = ref(0)

// 计算属性
const doubleCount = computed(() => {
  console.log('计算中...')
  return count.value * 2
})

// 多次访问，只会计算一次
console.log(doubleCount.value)  // 输出：计算中... 0
console.log(doubleCount.value)  // 输出：0（没有"计算中..."）
console.log(doubleCount.value)  // 输出：0（没有"计算中..."）

// 依赖变化后，才会重新计算
count.value = 1
console.log(doubleCount.value)  // 输出：计算中... 2
```

> **对比普通函数**：普通函数每次调用都会执行，`computed` 只在依赖变化时才重新计算。对于复杂计算，`computed` 性能更好。

### computed vs 方法

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const items = ref([1, 2, 3, 4, 5])

// ✅ 推荐：用 computed
const evenItems = computed(() => items.value.filter((i) => i % 2 === 0))

// ❌ 不推荐：用方法
const getEvenItems = () => items.value.filter((i) => i % 2 === 0)
</script>

<template>
  <!-- computed：只在 items 变化时重新计算 -->
  <p>{{ evenItems }}</p>

  <!-- 方法：每次渲染都会执行 -->
  <p>{{ getEvenItems() }}</p>
</template>
```

> **选择建议**：需要缓存用 `computed`，不需要缓存用方法。

### 可写计算属性

`computed` 默认是只读的，但也可以定义 `set` 方法让它可写：

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const firstName = ref('张')
const lastName = ref('三')

const fullName = computed({
  // 读取时
  get: () => firstName.value + lastName.value,
  // 写入时
  set: (newValue: string) => {
    firstName.value = newValue[0]
    lastName.value = newValue.slice(1)
  },
})

// 读取
console.log(fullName.value) // 输出：张三

// 写入
fullName.value = '李四'
console.log(firstName.value) // 输出：李
console.log(lastName.value) // 输出：四
</script>
```

> **原理**：可写计算属性在 `set` 时，会更新它依赖的响应式数据，从而触发相关计算属性和视图更新。

---

## 6 readonly：只读响应式

### 基础用法

`readonly` 用于创建只读的响应式副本：

```vue
<script setup lang="ts">
import { reactive, readonly } from 'vue'

const original = reactive({ count: 0 })
const copy = readonly(original)

// ✅ 可以修改原始对象
original.count++

// ❌ 不能修改只读副本
copy.count++ // 控制台会警告
</script>
```

> **原理**：`readonly` 返回一个 `Proxy`，拦截所有 `set` 操作并抛出警告。但它是"深层只读"——嵌套对象也是只读的。

### 使用场景

`readonly` 常用于：

1. **跨组件传递状态**：父组件创建状态，子组件只能读取不能修改
2. **保护关键数据**：防止意外修改

```vue
<!-- 父组件 -->
<script setup lang="ts">
import { reactive, readonly } from 'vue'

const state = reactive({ count: 0 })
const readonlyState = readonly(state)

// 传递给子组件
</script>

<template>
  <ChildComponent :state="readonlyState" />
</template>
```

---

## 7 核心知识点总结

| API        | 用途           | 适用类型       | 访问方式 | 特点                             |
| ---------- | -------------- | -------------- | -------- | -------------------------------- |
| `ref`      | 创建响应式数据 | 基本类型、对象 | `.value` | 可重新赋值，模板自动解包         |
| `reactive` | 创建对象响应式 | 对象、数组     | 直接访问 | 深层响应式，不能重新赋值         |
| `computed` | 声明计算属性   | 派生状态       | `.value` | 缓存计算结果，依赖不变不重新计算 |
| `readonly` | 创建只读副本   | 对象           | 直接访问 | 防止意外修改                     |

---

## 8 新手常见误区

### 误区 1："ref 只能用于基本类型"

不是的。`ref` 也可以包装对象，内部会自动调用 `reactive`。但基本类型只能用 `ref`。

### 误区 2："reactive 可以重新赋值"

**不行！** `reactive` 返回的是代理对象，重新赋值会丢失响应式。需要重新赋值时用 `ref`。

### 误区 3："computed 和普通函数没区别"

区别很大。`computed` 会缓存结果，只有依赖变化时才重新计算；普通函数每次调用都会执行。对于复杂计算，`computed` 性能更好。

### 误区 4："解构 reactive 对象后还是响应式"

**错！** 解构是值拷贝，会丢失响应式。需要用 `toRefs` 转换。

### 误区 5："模板中访问 ref 需要 .value"

**不需要！** 模板中 `ref` 会自动解包，直接写变量名就行。

---

## 9 动手练习

### 练习 1：购物车总价

实现一个简单的购物车：商品列表 + 总价计算。

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const items = ref([
  { name: '苹果', price: 5, quantity: 2 },
  { name: '香蕉', price: 3, quantity: 3 },
  { name: '橘子', price: 4, quantity: 1 },
])

// 计算总价
const totalPrice = computed(() => {
  return items.value.reduce((sum, item) => {
    return sum + item.price * item.quantity
  }, 0)
})
</script>

<template>
  <ul>
    <li v-for="item in items">{{ item.name }} - ¥{{ item.price }} x {{ item.quantity }}</li>
  </ul>
  <p>总价：¥{{ totalPrice }}</p>
</template>
```

</details>

### 练习 2：计数器（进阶）

实现一个计数器，支持 +1、-1、重置，并显示"奇数/偶数"。

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const count = ref(0)

const isEven = computed(() => count.value % 2 === 0)

const increment = () => count.value++
const decrement = () => count.value--
const reset = () => (count.value = 0)
</script>

<template>
  <p>当前计数：{{ count }}（{{ isEven ? '偶数' : '奇数' }}）</p>
  <button @click="increment">+1</button>
  <button @click="decrement">-1</button>
  <button @click="reset">重置</button>
</template>
```

</details>

### 练习 3（挑战）：用户信息编辑

实现一个用户信息表单，支持编辑姓名和年龄，并显示"是否已修改"。

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { reactive, computed } from 'vue'

const originalUser = { name: '张三', age: 25 }
const user = reactive({ ...originalUser })

const isModified = computed(() => {
  return user.name !== originalUser.name || user.age !== originalUser.age
})
</script>

<template>
  <div>
    <input v-model="user.name" placeholder="姓名" />
    <input v-model.number="user.age" type="number" placeholder="年龄" />

    <p v-if="isModified">信息已修改</p>
    <p v-else>信息未修改</p>
  </div>
</template>
```

</details>

---

## 下一章预告

下一章我们会学习 Vue 的**条件渲染和列表渲染**——也就是 `v-if`、`v-show`、`v-for` 这些指令的进阶用法。你会学到 `key` 的重要性、`v-if` 和 `v-show` 的选择策略，以及列表渲染的最佳实践。
