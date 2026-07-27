---
title: '第六章：表单输入绑定'
description: '深入掌握 v-model 在各类表单元素中的双向绑定原理与实战'
---

# 第六章：表单输入绑定

## 本章导读

前两章我们学会了事件处理和条件/列表渲染。现在我们要学习 Vue 最强大的功能之一——`v-model` 双向绑定。

你可能会问：

- 什么是"双向绑定"？和之前的 `:value` 有什么区别？
- `v-model` 是怎么做到数据自动同步的？
- 复选框、单选框、下拉框怎么用 `v-model`？
- 怎么在自定义组件上使用 `v-model`？

这一章我们会彻底搞懂 `v-model` 的原理和各种用法，让你轻松处理各种表单场景。

---

## 1 为什么需要 v-model？

### 痛点分析

假设你要做一个"实时显示输入内容"的功能，用之前的知识写起来是这样的：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const message = ref('')

// 手动监听 input 事件，手动更新数据
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  message.value = target.value
}
</script>

<template>
  <!-- 手动绑定 value 和 input 事件 -->
  <input :value="message" @input="handleInput" />
  <p>输入内容：{{ message }}</p>
</template>
```

问题很明显：

- **代码冗余**：每次都要写 `:value` + `@input`
- **容易出错**：忘记绑定事件或写错处理函数
- **不够直观**：逻辑分散在模板和脚本中

### Vue 的解决方案：v-model

Vue 提供了 `v-model` 指令，一行代码搞定双向绑定：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const message = ref('')
</script>

<template>
  <!-- 一行代码搞定双向绑定 -->
  <input v-model="message" />
  <p>输入内容：{{ message }}</p>
</template>
```

> **一句话总结**：`v-model` 是 `:value` + `@input` 的语法糖，让表单输入和数据自动同步。

---

## 2 核心原理

### v-model 的本质

`v-model` 其实是语法糖，它做了两件事：

1. **绑定 `:value`**：把数据显示在输入框里（数据 → 视图）
2. **监听 `@input`**：输入时自动更新数据（视图 → 数据）

```vue
<!-- 这两种写法完全等价 -->

<!-- 方式 1：v-model -->
<input v-model="message" />

<!-- 方式 2：手动绑定 -->
<input :value="message" @input="message = $event.target.value" />
```

> **类比**：`v-model` 像一个"自动同步器"——你输入内容时，它自动更新数据；数据变化时，它自动更新输入框。

### 双向绑定的流程

```
用户输入 → 触发 input 事件 → v-model 更新数据 → 数据变化触发视图更新 → 输入框显示新值
```

> **原理**：Vue 的响应式系统会监听数据变化，当数据变化时，自动更新所有依赖这个数据的地方（包括输入框）。

---

## 3 基础用法

### 文本输入

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 单行文本
const message = ref('')

// 多行文本
const multiline = ref('')
</script>

<template>
  <!-- 单行文本输入 -->
  <input v-model="message" placeholder="请输入..." />
  <p>输入内容：{{ message }}</p>

  <!-- 多行文本输入 -->
  <textarea v-model="multiline" placeholder="多行输入..."></textarea>
  <p>{{ multiline }}</p>
</template>
```

> **注意**：`<textarea>` 要用 `v-model`，不要用插值表达式 `{{ }}` 在标签中间插入内容。

### v-model 修饰符

Vue 提供了三个常用修饰符来自动处理输入值：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const age = ref(0)
const name = ref('')
const lazyText = ref('')
</script>

<template>
  <!-- .number：自动转换为数字 -->
  <input v-model.number="age" type="number" />
  <p>类型：{{ typeof age }}，值：{{ age }}</p>

  <!-- .trim：自动去除首尾空格 -->
  <input v-model.trim="name" placeholder="输入名字" />
  <p>名字：'{{ name }}'</p>

  <!-- .lazy：在 change 事件后同步（失焦时），而非 input 事件 -->
  <input v-model.lazy="lazyText" placeholder="失焦后同步" />
  <p>{{ lazyText }}</p>
</template>
```

> **原理**：
>
> - `.number` 会自动调用 `parseFloat()` 转换输入值
> - `.trim` 会自动调用 `.trim()` 去除首尾空格
> - `.lazy` 会把同步时机从 `input` 改为 `change`（失焦时触发）

---

## 4 进阶用法

### 复选框

#### 单个复选框：绑定布尔值

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 单个复选框绑定布尔值
const isChecked = ref(false)
</script>

<template>
  <label>
    <input type="checkbox" v-model="isChecked" />
    同意协议
  </label>
  <p>状态：{{ isChecked }}</p>
</template>
```

> **原理**：单个复选框的 `v-model` 绑定布尔值，选中时为 `true`，未选中时为 `false`。

#### 多个复选框：绑定数组

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 多个复选框绑定数组
const selectedFruits = ref<string[]>([])
</script>

<template>
  <div>
    <label>
      <input type="checkbox" value="苹果" v-model="selectedFruits" />
      苹果
    </label>
    <label>
      <input type="checkbox" value="香蕉" v-model="selectedFruits" />
      香蕉
    </label>
    <label>
      <input type="checkbox" value="橘子" v-model="selectedFruits" />
      橘子
    </label>
  </div>
  <p>选中：{{ selectedFruits }}</p>
</template>
```

> **原理**：多个复选框绑定同一个数组时，选中时会把 `value` 添加到数组，取消选中时会从数组中移除。

### 单选框

```vue
<script setup lang="ts">
import { ref } from 'vue'

const gender = ref('male')
</script>

<template>
  <label>
    <input type="radio" value="male" v-model="gender" />
    男
  </label>
  <label>
    <input type="radio" value="female" v-model="gender" />
    女
  </label>
  <p>选择：{{ gender }}</p>
</template>
```

> **原理**：单选框的 `v-model` 绑定字符串，选中哪个就把哪个的 `value` 赋值给变量。

### 下拉选择

#### 单选

```vue
<script setup lang="ts">
import { ref } from 'vue'

const selected = ref('')
</script>

<template>
  <select v-model="selected">
    <option value="" disabled>请选择</option>
    <option value="A">选项 A</option>
    <option value="B">选项 B</option>
    <option value="C">选项 C</option>
  </select>
  <p>选中：{{ selected }}</p>
</template>
```

> **注意**：第一个 `<option>` 用 `disabled` 禁用，作为占位提示。

#### 多选

```vue
<script setup lang="ts">
import { ref } from 'vue'

const multiSelected = ref<string[]>([])
</script>

<template>
  <!-- 添加 multiple 属性支持多选 -->
  <select v-model="multiSelected" multiple>
    <option value="Vue">Vue</option>
    <option value="React">React</option>
    <option value="Angular">Angular</option>
  </select>
  <p>多选：{{ multiSelected }}</p>
</template>
```

> **原理**：添加 `multiple` 属性后，`v-model` 绑定数组，按住 Ctrl/Cmd 可以多选。

### 动态选项

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 选项数据
interface Option {
  label: string
  value: string
}

const options = ref<Option[]>([
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '广州', value: 'guangzhou' },
])

const selectedCity = ref('')
</script>

<template>
  <select v-model="selectedCity">
    <option value="" disabled>选择城市</option>
    <!-- 用 v-for 动态渲染选项 -->
    <option v-for="opt in options" :key="opt.value" :value="opt.value">
      {{ opt.label }}
    </option>
  </select>
  <p>选中城市：{{ selectedCity }}</p>
</template>
```

> **原理**：用 `v-for` 遍历数组生成 `<option>`，`:value` 绑定实际值，显示文本用插值表达式。

---

## 5 组件上的 v-model

`v-model` 不仅能用在原生表单元素上，还能用在自定义组件上。

### 实现自定义组件的 v-model

```vue
<!-- MyInput.vue -->
<script setup lang="ts">
// 定义 props：接收 modelValue
const props = defineProps<{
  modelValue: string
}>()

// 定义 emits：声明 update:modelValue 事件
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// 处理 input 事件
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  // 触发 update:modelValue 事件，传递新值
  emit('update:modelValue', target.value)
}
</script>

<template>
  <input :value="props.modelValue" @input="handleInput" />
</template>
```

### 使用自定义组件的 v-model

```vue
<!-- 父组件 -->
<script setup lang="ts">
import { ref } from 'vue'
import MyInput from './MyInput.vue'

const text = ref('')
</script>

<template>
  <!-- 在自定义组件上使用 v-model -->
  <MyInput v-model="text" />
  <p>{{ text }}</p>
</template>
```

> **原理**：组件上的 `v-model` 等价于：
>
> ```vue
> <MyInput :modelValue="text" @update:modelValue="text = $event" />
> ```

---

## 6 核心知识点总结

| 元素                      | v-model 绑定值  | 修饰符                                       |
| ------------------------- | --------------- | -------------------------------------------- |
| `<input type="text">`     | string          | `.trim`, `.number`, `.lazy`                  |
| `<textarea>`              | string          | `.trim`                                      |
| `<input type="checkbox">` | boolean / array | -                                            |
| `<input type="radio">`    | string          | -                                            |
| `<select>`                | string / array  | -                                            |
| 自定义组件                | 任意类型        | 通过 `modelValue` + `update:modelValue` 实现 |

---

## 7 新手常见误区

### 误区 1："v-model 只能用在 input 上"

**不是！**

`v-model` 可以用在任何表单元素上：`<input>`、`<textarea>`、`<select>`、`<checkbox>`、`<radio>`，甚至可以用在自定义组件上。

### 误区 2："v-model 和 :value 是一样的"

**不一样！**

- `:value` 是单向绑定（数据 → 视图）
- `v-model` 是双向绑定（数据 ↔ 视图）

```vue
<!-- ❌ 错误：这样输入框的内容不会更新到 message -->
<input :value="message" />

<!-- ✅ 正确：v-model 会自动同步 -->
<input v-model="message" />
```

### 误区 3："多个复选框绑定数组时，不需要 value"

**需要 value！**

多个复选框必须设置 `value` 属性，否则无法正确添加到数组中：

```vue
<!-- ❌ 错误：没有 value -->
<input type="checkbox" v-model="selectedFruits" />

<!-- ✅ 正确：有 value -->
<input type="checkbox" value="苹果" v-model="selectedFruits" />
```

### 误区 4："v-model.number 会一直返回数字"

**不一定！**

如果输入框为空或输入的不是有效数字，`v-model.number` 会返回原始字符串：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const age = ref(0)
</script>

<template>
  <input v-model.number="age" type="number" />
  <!-- 如果清空输入框，age 会是空字符串 ""，不是 0 -->
</template>
```

### 误区 5："textarea 可以用插值表达式插入内容"

**不行！**

`<textarea>` 要用 `v-model`，不要在标签中间写 `{{ }}`：

```vue
<!-- ❌ 错误 -->
<textarea>{{ message }}</textarea>

<!-- ✅ 正确 -->
<textarea v-model="message"></textarea>
```

---

## 8 动手练习

### 练习 1：用户信息表单

实现一个用户信息表单，包含姓名、年龄、性别、城市选择。

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 表单数据
const name = ref('')
const age = ref(0)
const gender = ref('male')
const city = ref('')
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <!-- 姓名 -->
    <div>
      <label>姓名：</label>
      <input v-model.trim="name" type="text" required />
    </div>

    <!-- 年龄 -->
    <div>
      <label>年龄：</label>
      <input v-model.number="age" type="number" min="0" max="150" required />
    </div>

    <!-- 性别 -->
    <div>
      <label>性别：</label>
      <label>
        <input type="radio" value="male" v-model="gender" />
        男
      </label>
      <label>
        <input type="radio" value="female" v-model="gender" />
        女
      </label>
    </div>

    <!-- 城市 -->
    <div>
      <label>城市：</label>
      <select v-model="city" required>
        <option value="" disabled>请选择</option>
        <option value="beijing">北京</option>
        <option value="shanghai">上海</option>
        <option value="guangzhou">广州</option>
      </select>
    </div>

    <button type="submit">提交</button>
  </form>
</template>
```

</details>

### 练习 2：多选标签

实现一个多选标签功能，用户可以选择多个兴趣标签。

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 所有标签
const allTags = ['Vue', 'React', 'Angular', 'Node.js', 'TypeScript']

// 选中的标签
const selectedTags = ref<string[]>([])
</script>

<template>
  <div>
    <h3>选择你感兴趣的技术：</h3>
    <div>
      <label v-for="tag in allTags" :key="tag">
        <input type="checkbox" :value="tag" v-model="selectedTags" />
        {{ tag }}
      </label>
    </div>
    <p>已选择：{{ selectedTags.join('、') || '无' }}</p>
  </div>
</template>
```

</details>

### 练习 3（挑战）：动态表单

实现一个动态表单：

- 可以添加多个"技能"输入框
- 每个技能输入框可以删除
- 实时显示所有技能列表

<details>
<summary>点击查看答案</summary>

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 技能列表
interface Skill {
  id: number
  name: string
}

const skills = ref<Skill[]>([])
let nextId = 1

// 添加技能
const addSkill = () => {
  skills.value.push({
    id: nextId++,
    name: '',
  })
}

// 删除技能
const removeSkill = (id: number) => {
  skills.value = skills.value.filter((s) => s.id !== id)
}
</script>

<template>
  <div>
    <h3>技能列表</h3>

    <!-- 技能输入框 -->
    <div v-for="skill in skills" :key="skill.id">
      <input v-model="skill.name" placeholder="输入技能名称" />
      <button @click="removeSkill(skill.id)">删除</button>
    </div>

    <button @click="addSkill">添加技能</button>

    <!-- 实时显示 -->
    <div v-if="skills.length > 0">
      <h4>已添加的技能：</h4>
      <ul>
        <li v-for="skill in skills" :key="skill.id">
          {{ skill.name || '未命名' }}
        </li>
      </ul>
    </div>
    <p v-else>暂无技能</p>
  </div>
</template>
```

</details>

---

## 下一章预告

下一章我们会学习 Vue 的**组合式 API**——也就是 `<script setup>` 语法糖背后的原理。你会学到怎么组织代码、怎么封装可复用的逻辑，以及组合式 API 相比选项式 API 的优势。
