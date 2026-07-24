---
title: "第六章：表单输入绑定"
description: "使用 v-model 在各类表单元素上实现双向数据绑定"
---

# 第六章：表单输入绑定

## 运行结果

| 元素 | v-model 绑定值 | 修饰符 |
| --- | --- | --- |
| `<input type="text">` | string | `.trim`, `.number`, `.lazy` |
| `<textarea>` | string | `.trim` |
| `<input type="checkbox">` | boolean / array | - |
| `<input type="radio">` | string | - |
| `<select>` | string / array | - |

## 代码示例

### 1. 文本输入

```vue
<script setup lang="ts">
import { ref } from 'vue'

const message = ref('')
const multiline = ref('')
</script>

<template>
  <!-- 单行文本 -->
  <input v-model="message" placeholder="请输入..." />
  <p>输入内容：{{ message }}</p>

  <!-- 多行文本 -->
  <textarea v-model="multiline" placeholder="多行输入..."></textarea>
  <p>{{ multiline }}</p>
</template>
```

### 2. v-model 修饰符

```vue
<script setup lang="ts">
import { ref } from 'vue'

const age = ref(0)
const name = ref('')
const lazyText = ref('')
</script>

<template>
  <!-- .number 自动转换为数字 -->
  <input v-model.number="age" type="number" />
  <p>类型：{{ typeof age }}，值：{{ age }}</p>

  <!-- .trim 自动去除首尾空格 -->
  <input v-model.trim="name" placeholder="输入名字" />
  <p>名字：'{{ name }}'</p>

  <!-- .lazy 在 change 事件后同步（而非 input） -->
  <input v-model.lazy="lazyText" placeholder="失焦后同步" />
  <p>{{ lazyText }}</p>
</template>
```

### 3. 复选框

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 单个复选框 - 绑定 boolean
const isChecked = ref(false)

// 多个复选框 - 绑定数组
const selectedFruits = ref<string[]>([])
</script>

<template>
  <!-- 单个复选框 -->
  <label>
    <input type="checkbox" v-model="isChecked" />
    同意协议
  </label>
  <p>状态：{{ isChecked }}</p>

  <!-- 多个复选框 -->
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

### 4. 单选框

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

### 5. 下拉选择

```vue
<script setup lang="ts">
import { ref } from 'vue'

const selected = ref('')
const multiSelected = ref<string[]>([])
</script>

<template>
  <!-- 单选 -->
  <select v-model="selected">
    <option value="" disabled>请选择</option>
    <option value="A">选项 A</option>
    <option value="B">选项 B</option>
    <option value="C">选项 C</option>
  </select>
  <p>选中：{{ selected }}</p>

  <!-- 多选（按住 Ctrl/Cmd） -->
  <select v-model="multiSelected" multiple>
    <option value="Vue">Vue</option>
    <option value="React">React</option>
    <option value="Angular">Angular</option>
  </select>
  <p>多选：{{ multiSelected }}</p>
</template>
```

### 6. 动态选项

```vue
<script setup lang="ts">
import { ref } from 'vue'

interface Option {
  label: string
  value: string
}

const options = ref<Option[]>([
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '广州', value: 'guangzhou' }
])

const selectedCity = ref('')
</script>

<template>
  <select v-model="selectedCity">
    <option value="" disabled>选择城市</option>
    <option v-for="opt in options" :key="opt.value" :value="opt.value">
      {{ opt.label }}
    </option>
  </select>
  <p>选中城市：{{ selectedCity }}</p>
</template>
```

### 7. 自定义 v-model

```vue
<!-- MyInput.vue -->
<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <input
    :value="props.modelValue"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
```

```vue
<!-- 使用 -->
<script setup lang="ts">
import { ref } from 'vue'
import MyInput from './MyInput.vue'

const text = ref('')
</script>

<template>
  <MyInput v-model="text" />
  <p>{{ text }}</p>
</template>
```

## 核心知识点

1. **v-model 本质**：是 `:value` + `@input` 的语法糖
2. **修饰符**：`.number`、`.trim`、`.lazy` 自动处理输入值
3. **复选框绑定数组**：多个复选框绑定同一个数组实现多选
4. **select 的 multiple**：添加 `multiple` 属性支持多选
5. **组件 v-model**：通过 `modelValue` prop 和 `update:modelValue` 事件实现
