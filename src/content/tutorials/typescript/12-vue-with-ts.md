---
title: "第十二章：Vue 中的 TypeScript"
description: "在 Vue 3 中使用 TypeScript，充分利用类型系统提升开发体验。"
---

# 第十二章：Vue 中的 TypeScript

## 运行结果

- **ref&lt;T&gt;**
  - `count = 0`
  - `message = "Hello TypeScript"`
  - `user = {"name":"Alice","age":25}`
- **reactive&lt;T&gt;**
  - `state.count = 0`
  - `state.message = "Hello"`
  - `state.items = [item1, item2]`
- **computed 类型推导**
  - `doubleCount = 0`
  - `upperMessage = "HELLO TYPESCRIPT"`
  - `greeting = "Hi, Alice!"`
- **Todo 列表**
  - `总数: 2`
  - `已完成: 1`
  - `待完成: 1`

## 交互演示

- 按钮：`count++ (0)`、`count += 5`
- 输入框（v-model 绑定 message），显示 `大写: HELLO TYPESCRIPT`
- Todo 列表：
  - 学习 TypeScript — ○（待完成）
  - 学习 Vue 3 — ✓（已完成）
- 按钮：`添加任务`

## 代码详解

### 1. `ref<T>` 类型标注

```typescript
import { ref } from 'vue'

// 基本类型
const count = ref<number>(0)
const message = ref<string>('Hello')

// 对象类型
const user = ref<{ name: string; age: number }>({
  name: 'Alice',
  age: 25
})

// ref 会自动解包，访问时需要 .value
count.value++  // 1
console.log(user.value.name)  // 'Alice'
```

### 2. `reactive<T>` 类型标注

```typescript
import { reactive } from 'vue'

interface State {
  count: number
  message: string
  items: string[]
}

const state = reactive<State>({
  count: 0,
  message: 'Hello',
  items: ['item1', 'item2'],
})

// reactive 不需要 .value
state.count++
state.items.push('item3')
```

### 3. computed 类型推导

```typescript
import { computed } from 'vue'

const count = ref(0)
const message = ref('hello')

// 自动推导返回类型
const doubleCount = computed(() => count.value * 2)  // number
const upperMessage = computed(() => message.value.toUpperCase())  // string

// 显式指定类型
const greeting = computed<string>(() => {
  return `Hello!`
})
```

### 4. 事件处理函数类型

```typescript
// 鼠标事件
function handleClick(event: MouseEvent): void {
  console.log('Clicked at:', event.clientX, event.clientY)
}

// 输入事件
function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement
  const value = target.value
}

// 键盘事件
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    console.log('Enter pressed')
  }
}
```

### 5. defineProps 类型（子组件）

```typescript
<script setup lang="ts">
// 方式一：运行时声明
const props = defineProps({
  title: String,
  count: { type: Number, default: 0 },
  items: { type: Array as PropType<string[]>, required: true }
})

// 方式二：基于类型的声明（推荐）
interface Props {
  title: string
  count?: number
  items: string[]
}

const props = defineProps<Props>()

// 带默认值
const props = withDefaults(defineProps<Props>(), {
  count: 0,
})
</script>
```

### 6. defineEmits 类型

```typescript
<script setup lang="ts">
// 方式一：运行时声明
const emit = defineEmits(['change', 'update'])

// 方式二：基于类型的声明（推荐）
const emit = defineEmits<{
  change: [value: string]
  update: [id: number, payload: object]
}>()

// 使用
emit('change', 'new value')
emit('update', 1, { name: 'Alice' })
</script>
```

### 7. API 请求类型

```typescript
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

interface UserInfo {
  id: number
  username: string
  avatar: string
}

async function fetchUser(): Promise<ApiResponse<UserInfo>> {
  const res = await fetch('/api/user')
  return res.json()
}

const userInfo = ref<UserInfo | null>(null)
const loading = ref(false)

async function loadUser() {
  loading.value = true
  try {
    const res = await fetchUser()
    if (res.code === 200) {
      userInfo.value = res.data
    }
  } finally {
    loading.value = false
  }
}
```

### 8. 泛型组件

```typescript
<!-- Select.vue -->
<script setup lang="ts" generic="T">
interface Option<T> {
  label: string
  value: T
}

const props = defineProps<{
  options: Option<T>[]
  modelValue: T | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: T]
}>()
</script>

<!-- 使用 -->
<Select
  :options="[{ label: '选项一', value: 1 }]"
  v-model="selectedValue"
/>
```

## Vue 3 + TypeScript 最佳实践

::: info
- 使用 `<script setup lang="ts">` 语法
- 优先使用基于类型的 `defineProps` 和 `defineEmits`
- 为复杂状态定义 interface
- 使用 `ref<T>` 显式标注复杂类型
- 利用 computed 的自动类型推导
- 为 API 响应定义统一的类型结构
- 使用泛型组件提高复用性
:::
