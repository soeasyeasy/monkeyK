---
title: "第六章：表单输入绑定"
description: "学习 Vue 2 中使用 v-model 实现表单元素的双向数据绑定。"
---

# 第六章：表单输入绑定

## 本章导读

在开始学习之前，你可能会有这些疑问：

1. **v-model 到底是什么？** 它和之前学的 `v-bind` 有什么区别？为什么表单元素要用 `v-model`？
2. **v-model 能用在哪些表单元素上？** 输入框、复选框、单选框、下拉框的用法都一样吗？
3. **怎么控制数据同步的时机？** 比如想等用户输入完再同步，而不是每敲一个字就同步？
4. **怎么让自定义组件也支持 v-model？** 自己写的组件能用 `v-model` 吗？

本章会帮你彻底搞懂 `v-model`，让你轻松处理各种表单场景。

## 为什么需要这个技术

### 没有 v-model 时的痛点

想象一下，你要实现一个输入框，输入内容后实时显示在页面上：

```javascript
// ❌ 原生 JavaScript 方式
const input = document.querySelector('#myInput')
const display = document.querySelector('#display')

input.addEventListener('input', function() {
  display.textContent = input.value // 手动同步数据到页面
})
```

**问题在哪里？**
- 你需要手动监听 `input` 事件
- 你需要手动把输入值同步到页面
- 如果页面有多处要显示这个值，每处都要手动更新
- 数据流很混乱：DOM → 变量 → DOM

### 生活化类比

把 `v-model` 想象成**镜子和你的倒影**：

- **没有 v-model**：你站在镜子前，需要手动拿笔画出镜子里的倒影（手动同步）
- **有 v-model**：你动一下，镜子里的倒影自动跟着动（自动双向同步）

`v-model` 就是 Vue 帮你打造的一面"智能镜子"，数据变了页面自动更新，页面变了数据也自动更新。

### 有了 Vue 之后的对比

```vue
<!-- ✅ Vue 方式 -->
<template>
  <div>
    <!-- 一行代码搞定双向绑定 -->
    <input v-model="message" placeholder="输入内容" />
    <!-- 数据变了，这里自动更新 -->
    <p>你输入了：{{ message }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: '' // 数据变化，页面自动更新
    }
  }
}
</script>
```

**差异对比：**

| 对比项 | 原生 JavaScript | Vue v-model |
|--------|----------------|-------------|
| 代码量 | 需要获取 DOM、监听事件、手动更新 | 只需一个 `v-model` |
| 数据流向 | 手动管理 DOM → 变量 → DOM | 自动双向同步 |
| 多处显示 | 每处都要手动更新 | 改一个地方，所有地方自动更新 |
| 表单元素 | 每种元素写法不同 | 统一用 `v-model`，Vue 自动处理差异 |

## 核心原理讲解

### v-model 的底层原理

`v-model` 其实是一个**语法糖**，它根据表单元素类型自动选择正确的绑定方式：

1. **文本输入框（input/textarea）**：等价于 `:value` + `@input`
2. **复选框（checkbox）**：等价于 `:checked` + `@change`
3. **单选框（radio）**：等价于 `:checked` + `@change`
4. **下拉框（select）**：等价于 `:value` + `@change`

### 通俗类比

把 `v-model` 想象成**万能翻译官**：

- 你说中文（Vue 数据），翻译官自动翻译成英文（DOM 属性）
- 别人说英文（用户输入），翻译官自动翻译成中文（Vue 数据）
- 你不需要关心翻译细节，翻译官帮你搞定一切

### v-bind vs v-model 对比

| 特性 | v-bind（单向绑定） | v-model（双向绑定） |
|------|-------------------|-------------------|
| 数据流向 | 数据 → 视图 | 数据 ↔ 视图 |
| 用户输入 | 不会更新数据 | 自动更新数据 |
| 适用场景 | 显示数据 | 表单输入 |
| 底层实现 | 只设置属性 | 设置属性 + 监听事件 |

## 基础用法 + 逐行注释

### 1. 文本输入

```vue
<template>
  <div>
    <!-- ✅ 单行文本输入 -->
    <input v-model="message" placeholder="编辑我" />
    <!-- v-model 把输入框的值和 message 双向绑定 -->
    <!-- 输入内容变化 → message 自动更新 -->
    <!-- message 变化 → 输入框显示自动更新 -->
    
    <!-- 显示当前 message 的值 -->
    <p>Message: {{ message }}</p>
    
    <!-- ✅ 多行文本输入 -->
    <textarea v-model="text" placeholder="多行文本"></textarea>
    <!-- textarea 也必须用 v-model，不能用插值表达式 -->
    <p style="white-space: pre-wrap;">{{ text }}</p>
    <!-- white-space: pre-wrap 保留换行符 -->
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: '', // 单行文本，初始为空字符串
      text: '' // 多行文本，初始为空字符串
    }
  }
}
</script>
```

::: warning
❌ 在 textarea 中使用插值表达式 `<textarea>{{ text }}</textarea>` 不会生效！必须使用 `v-model`。
:::

### 2. 复选框

```vue
<template>
  <div>
    <!-- ✅ 单个复选框：绑定布尔值 -->
    <input type="checkbox" id="checkbox" v-model="checked" />
    <!-- 勾选时 checked = true，取消勾选时 checked = false -->
    <label for="checkbox">{{ checked }}</label>
    <!-- 显示 true 或 false -->
    
    <!-- ✅ 多个复选框：绑定数组 -->
    <div>
      <input type="checkbox" id="jack" value="Jack" v-model="checkedNames" />
      <!-- 勾选时，"Jack" 会被添加到 checkedNames 数组中 -->
      <label for="jack">Jack</label>
      
      <input type="checkbox" id="john" value="John" v-model="checkedNames" />
      <!-- 勾选时，"John" 会被添加到 checkedNames 数组中 -->
      <label for="john">John</label>
      
      <input type="checkbox" id="mike" value="Mike" v-model="checkedNames" />
      <!-- 勾选时，"Mike" 会被添加到 checkedNames 数组中 -->
      <label for="mike">Mike</label>
    </div>
    <!-- 显示选中的名字数组 -->
    <p>Checked names: {{ checkedNames }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      checked: false, // 单个复选框：布尔值，初始未勾选
      checkedNames: [] // 多个复选框：数组，初始为空（没选中任何人）
    }
  }
}
</script>
```

### 3. 单选框

```vue
<template>
  <div>
    <!-- ✅ 单选框：绑定到同一个变量 -->
    <input type="radio" id="one" value="One" v-model="picked" />
    <!-- 选中时 picked = "One" -->
    <label for="one">One</label>
    
    <input type="radio" id="two" value="Two" v-model="picked" />
    <!-- 选中时 picked = "Two" -->
    <label for="two">Two</label>
    
    <!-- 显示当前选中的值 -->
    <p>Picked: {{ picked }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      picked: '' // 初始没有选中任何一项
    }
  }
}
</script>
```

### 4. 下拉选择框

```vue
<template>
  <div>
    <!-- ✅ 单选下拉框 -->
    <select v-model="selected">
      <!-- v-model 绑定到 selected 变量 -->
      <option disabled value="">请选择</option>
      <!-- 禁用第一项作为占位提示，value 为空字符串 -->
      <option>A</option>
      <!-- 选项文本就是绑定的值 -->
      <option>B</option>
      <option>C</option>
    </select>
    <p>Selected: {{ selected }}</p>
    
    <!-- ✅ 多选下拉框（按住 Ctrl 可多选） -->
    <select v-model="multiSelected" multiple>
      <!-- multiple 属性允许多选，绑定值变成数组 -->
      <option>A</option>
      <option>B</option>
      <option>C</option>
    </select>
    <p>Selected: {{ multiSelected }}</p>
    
    <!-- ✅ 动态选项（用 v-for 渲染） -->
    <select v-model="dynamicSelected">
      <!-- 遍历 options 数组生成选项 -->
      <option v-for="option in options" :key="option.value" :value="option.value">
        <!-- :value 绑定动态值，显示 option.text -->
        {{ option.text }}
      </option>
    </select>
    <p>Selected: {{ dynamicSelected }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selected: '', // 单选下拉框：字符串
      multiSelected: [], // 多选下拉框：数组
      dynamicSelected: '', // 动态选项：字符串
      options: [
        { text: '选项一', value: 'A' }, // 显示"选项一"，值为 'A'
        { text: '选项二', value: 'B' }, // 显示"选项二"，值为 'B'
        { text: '选项三', value: 'C' } // 显示"选项三"，值为 'C'
      ]
    }
  }
}
</script>
```

### 5. v-model 修饰符

```vue
<template>
  <div>
    <!-- ✅ .lazy：在 change 事件后同步（失去焦点或按回车时） -->
    <!-- 生活类比：等你写完信再寄出去，而不是每写一个字就寄 -->
    <input v-model.lazy="lazyMessage" />
    <!-- 默认 v-model 在 input 事件中同步（每敲一个字就同步） -->
    <!-- .lazy 改成在 change 事件中同步（失去焦点或按回车时才同步） -->
    <p>{{ lazyMessage }}</p>
    
    <!-- ✅ .number：自动转换为数字类型 -->
    <!-- 生活类比：自动把"123"这个数字字符串变成数字 123 -->
    <input v-model.number="age" type="number" />
    <!-- 不加 .number 时，输入框返回的永远是字符串 -->
    <!-- 加了 .number 后，Vue 自动调用 parseFloat() 转换 -->
    <p>{{ age }} (type: {{ typeof age }})</p>
    
    <!-- ✅ .trim：自动去除首尾空格 -->
    <!-- 生活类比：自动帮你修剪指甲的边角 -->
    <input v-model.trim="trimmedMessage" />
    <!-- 输入 " hello " 会自动变成 "hello" -->
    <p>{{ trimmedMessage }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      lazyMessage: '', // 延迟同步的消息
      age: null, // 年龄（数字类型）
      trimmedMessage: '' // 去空格后的消息
    }
  }
}
</script>
```

### 6. 绑定 value

```vue
<template>
  <div>
    <!-- ✅ 复选框绑定自定义值 -->
    <input
      type="checkbox"
      v-model="toggle"
      true-value="yes"
      false-value="no"
    />
    <!-- true-value：勾选时的值 -->
    <!-- false-value：取消勾选时的值 -->
    <!-- 不再绑定 true/false，而是绑定自定义的 "yes"/"no" -->
    <p>{{ toggle }}</p>
    
    <!-- ✅ 单选框绑定动态值 -->
    <input type="radio" v-model="pick" :value="a" />
    <!-- :value 绑定 JavaScript 表达式的值 -->
    <input type="radio" v-model="pick" :value="b" />
    <p>{{ pick }}</p>
    
    <!-- ✅ 下拉选项绑定对象 -->
    <select v-model="selectedOption">
      <!-- :value 可以绑定对象，选中后整个对象都会被绑定 -->
      <option :value="{ number: 123 }">123</option>
    </select>
    <p>{{ selectedOption }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      toggle: 'no', // 复选框初始值
      pick: '', // 单选框初始值
      selectedOption: null // 下拉框初始值
    }
  }
}
</script>
```

### 7. 在组件上使用 v-model

```vue
<!-- CustomInput.vue - 自定义输入组件 -->
<template>
  <input
    :value="value"
    <!-- 接收父组件传来的值 -->
    @input="$emit('input', $event.target.value)"
    <!-- 输入时触发 input 事件，把新值传给父组件 -->
  />
</template>

<script>
export default {
  props: ['value']
  // 声明 value prop 来接收父组件的数据
}
</script>
```

```vue
<!-- 父组件 -->
<template>
  <custom-input v-model="message" />
  <!-- v-model 在组件上等价于： -->
  <!-- <custom-input :value="message" @input="message = $event" /> -->
</template>

<script>
import CustomInput from './CustomInput.vue'

export default {
  components: {
    CustomInput // 注册自定义组件
  },
  data() {
    return {
      message: '' // 父组件的数据
    }
  }
}
</script>
```

### 8. 表单验证示例

```vue
<template>
  <!-- 阻止表单默认提交行为 -->
  <form @submit.prevent="onSubmit">
    <!-- 用户名 -->
    <div>
      <label>用户名：</label>
      <input
        v-model.trim="form.username"
        <!-- .trim 自动去除首尾空格 -->
        @blur="validateUsername"
        <!-- 失去焦点时触发验证 -->
      />
      <!-- 显示错误信息 -->
      <span v-if="errors.username" style="color: red;">{{ errors.username }}</span>
    </div>
    
    <!-- 邮箱 -->
    <div>
      <label>邮箱：</label>
      <input
        v-model.trim="form.email"
        type="email"
        <!-- type="email" 提供浏览器原生邮箱输入优化 -->
        @blur="validateEmail"
      />
      <span v-if="errors.email" style="color: red;">{{ errors.email }}</span>
    </div>
    
    <!-- 密码 -->
    <div>
      <label>密码：</label>
      <input
        v-model="form.password"
        type="password"
        <!-- type="password" 隐藏输入内容 -->
        @blur="validatePassword"
      />
      <span v-if="errors.password" style="color: red;">{{ errors.password }}</span>
    </div>
    
    <!-- 提交按钮：验证不通过时禁用 -->
    <button type="submit" :disabled="!isValid">提交</button>
  </form>
</template>

<script>
export default {
  data() {
    return {
      form: {
        username: '', // 用户名
        email: '', // 邮箱
        password: '' // 密码
      },
      errors: {
        username: '', // 用户名错误信息
        email: '', // 邮箱错误信息
        password: '' // 密码错误信息
      }
    }
  },
  computed: {
    isValid() {
      // 计算属性：判断表单是否全部验证通过
      return (
        this.form.username && // 用户名不为空
        this.form.email && // 邮箱不为空
        this.form.password && // 密码不为空
        !this.errors.username && // 用户名无错误
        !this.errors.email && // 邮箱无错误
        !this.errors.password // 密码无错误
      )
    }
  },
  methods: {
    validateUsername() {
      // 验证用户名
      if (!this.form.username) {
        this.errors.username = '用户名不能为空'
      } else if (this.form.username.length < 3) {
        this.errors.username = '用户名至少 3 个字符'
      } else {
        this.errors.username = '' // 验证通过，清空错误
      }
    },
    validateEmail() {
      // 验证邮箱
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!this.form.email) {
        this.errors.email = '邮箱不能为空'
      } else if (!emailRegex.test(this.form.email)) {
        this.errors.email = '邮箱格式不正确'
      } else {
        this.errors.email = '' // 验证通过
      }
    },
    validatePassword() {
      // 验证密码
      if (!this.form.password) {
        this.errors.password = '密码不能为空'
      } else if (this.form.password.length < 6) {
        this.errors.password = '密码至少 6 个字符'
      } else {
        this.errors.password = '' // 验证通过
      }
    },
    onSubmit() {
      // 提交前再次验证所有字段
      this.validateUsername()
      this.validateEmail()
      this.validatePassword()
      
      if (this.isValid) {
        // 验证通过，提交表单
        console.log('提交表单：', this.form)
      }
    }
  }
}
</script>
```

## 对比表格

### v-model 在不同表单元素中的行为

| 表单元素 | 绑定属性 | 监听事件 | 绑定值类型 | 说明 |
|----------|----------|----------|------------|------|
| `<input type="text">` | `:value` | `@input` | 字符串 | 最常用 |
| `<textarea>` | `:value` | `@input` | 字符串 | 不能用插值 |
| `<input type="checkbox">` | `:checked` | `@change` | 布尔值/数组 | 单个为布尔，多个为数组 |
| `<input type="radio">` | `:checked` | `@change` | 字符串 | 同组绑定同一变量 |
| `<select>` | `:value` | `@change` | 字符串/数组 | 多选时为数组 |

### v-model 修饰符对比

| 修饰符 | 作用 | 同步时机 | 生活类比 | 适用场景 |
|--------|------|----------|----------|----------|
| `.lazy` | 延迟同步 | 失去焦点或按回车 | 写完信再寄 | 搜索框、非实时校验 |
| `.number` | 转数字 | 同默认 | 自动翻译数字 | 年龄、价格等数字输入 |
| `.trim` | 去空格 | 同默认 | 修剪边角 | 用户名、邮箱等 |

### 选择建议

| 场景 | 推荐方案 | 原因 |
|------|----------|------|
| 普通文本输入 | `v-model` | 实时同步，体验好 |
| 搜索框 | `v-model.lazy` | 减少请求次数 |
| 数字输入 | `v-model.number` | 自动转数字，省去手动 `parseInt` |
| 用户名/邮箱 | `v-model.trim` | 避免首尾空格导致验证失败 |
| 多个复选框 | `v-model` + 数组 | 自动管理选中项 |
| 自定义组件 | `v-model` = `:value` + `@input` | Vue 标准约定 |

## 新手常见误区

### 误区 1：在 textarea 中使用插值表达式

❌ **错误写法：**
```vue
<textarea>{{ text }}</textarea>
<!-- ❌ 错误：插值表达式在 textarea 中不会生效 -->
```

✅ **正确写法：**
```vue
<textarea v-model="text"></textarea>
<!-- ✅ 正确：textarea 必须用 v-model 绑定值 -->
```

**为什么错？** Vue 中 `<textarea>` 的插值表达式会被当作纯文本显示，不会进行数据绑定。这是 HTML 本身的限制，`<textarea>` 的内容只能是其 `value` 属性。

### 误区 2：多个复选框绑定到字符串而非数组

❌ **错误写法：**
```javascript
data() {
  return {
    checkedNames: '' // ❌ 错误：多个复选框应该绑定到数组
  }
}
```

✅ **正确写法：**
```javascript
data() {
  return {
    checkedNames: [] // ✅ 正确：多个复选框绑定到数组
  }
}
```

**为什么错？** 多个复选框绑定到同一个变量时，Vue 会自动把选中的值添加到数组中。如果初始值是字符串，Vue 无法正确管理选中状态。

### 误区 3：select 的初始值与 option 的 value 类型不匹配

❌ **错误写法：**
```vue
<select v-model="selected">
  <option :value="1">选项一</option>
  <option :value="2">选项二</option>
</select>
```
```javascript
data() {
  return {
    selected: '1' // ❌ 错误：字符串 '1' 不等于数字 1
  }
}
```

✅ **正确写法：**
```javascript
data() {
  return {
    selected: 1 // ✅ 正确：类型要和 option 的 value 一致
  }
}
```

**为什么错？** Vue 使用严格相等（`===`）来判断 select 的选中状态。字符串 `'1'` 和数字 `1` 不相等，所以不会正确选中。

### 误区 4：忘记 v-model.number 仍然得到字符串

❌ **错误写法：**
```vue
<input v-model.number="age" />
<!-- 输入 "abc" 时，age 仍然是字符串 "abc" -->
```

✅ **正确理解：**
```vue
<input v-model.number="age" type="number" />
<!-- .number 只在输入值能被 parseFloat() 解析时才转换 -->
<!-- 输入 "123" → age = 123（数字） -->
<!-- 输入 "abc" → age = "abc"（仍然是字符串） -->
```

**为什么错？** `.number` 修饰符不是万能的，它只在值能被解析为数字时才转换。对于无法解析的值，仍然返回字符串。

### 误区 5：自定义组件的 v-model 忘记声明 prop

❌ **错误写法：**
```vue
<!-- CustomInput.vue -->
<template>
  <input :value="value" @input="$emit('input', $event.target.value)" />
</template>
<script>
export default {
  // ❌ 忘记声明 value prop
}
</script>
```

✅ **正确写法：**
```vue
<!-- CustomInput.vue -->
<template>
  <input :value="value" @input="$emit('input', $event.target.value)" />
</template>
<script>
export default {
  props: ['value'] // ✅ 必须声明 value prop
}
</script>
```

**为什么错？** 组件的 `v-model` 默认绑定到 `value` prop 和 `input` 事件。如果不声明 `value` prop，组件无法接收父组件传来的数据。

## 动手练习

### 练习 1：基础表单绑定（基础）

**题目**：创建一个注册表单，包含用户名输入框、密码输入框、性别单选框（男/女）、爱好复选框（阅读/运动/音乐），实时显示用户填写的信息。

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div>
    <!-- 用户名 -->
    <div>
      <label>用户名：</label>
      <input v-model="form.username" placeholder="请输入用户名" />
    </div>
    
    <!-- 密码 -->
    <div>
      <label>密码：</label>
      <input v-model="form.password" type="password" placeholder="请输入密码" />
    </div>
    
    <!-- 性别单选 -->
    <div>
      <label>性别：</label>
      <input type="radio" id="male" value="男" v-model="form.gender" />
      <label for="male">男</label>
      <input type="radio" id="female" value="女" v-model="form.gender" />
      <label for="female">女</label>
    </div>
    
    <!-- 爱好复选 -->
    <div>
      <label>爱好：</label>
      <input type="checkbox" id="reading" value="阅读" v-model="form.hobbies" />
      <label for="reading">阅读</label>
      <input type="checkbox" id="sports" value="运动" v-model="form.hobbies" />
      <label for="sports">运动</label>
      <input type="checkbox" id="music" value="音乐" v-model="form.hobbies" />
      <label for="music">音乐</label>
    </div>
    
    <!-- 实时显示 -->
    <hr />
    <h3>填写的信息：</h3>
    <p>用户名：{{ form.username }}</p>
    <p>密码：{{ form.password }}</p>
    <p>性别：{{ form.gender }}</p>
    <p>爱好：{{ form.hobbies.join('、') }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        username: '', // 用户名
        password: '', // 密码
        gender: '', // 性别
        hobbies: [] // 爱好（数组）
      }
    }
  }
}
</script>
```

</details>

### 练习 2：修饰符应用（进阶）

**题目**：创建一个搜索框，要求：1）输入完按回车才同步（减少搜索次数）；2）自动去除首尾空格；3）下方显示搜索关键词和关键词长度。

<details>
<summary>点击查看答案</summary>

```vue
<template>
  <div>
    <!-- 搜索框 -->
    <input
      v-model.lazy.trim="keyword"
      <!-- .lazy：按回车或失去焦点时才同步 -->
      <!-- .trim：自动去除首尾空格 -->
      placeholder="输入关键词，按回车搜索"
    />
    
    <!-- 显示搜索关键词 -->
    <p>搜索关键词：「{{ keyword }}」</p>
    <!-- 显示关键词长度 -->
    <p>关键词长度：{{ keyword.length }} 个字符</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      keyword: '' // 搜索关键词
    }
  }
}
</script>
```

</details>

### 练习 3：自定义 v-model 组件（挑战）

**题目**：创建一个星级评分组件，支持 `v-model`。组件显示 5 颗星，点击星星可以设置评分（1-5）。父组件通过 `v-model` 获取和设置评分。

<details>
<summary>点击查看答案</summary>

**子组件 StarRating.vue：**

```vue
<template>
  <div class="star-rating">
    <!-- 遍历 5 颗星 -->
    <span
      v-for="star in 5"
      :key="star"
      @click="setRating(star)"
      <!-- 点击时设置评分 -->
      :class="{ filled: star <= value }"
      <!-- 当前星星小于等于评分时，显示为实心 -->
      style="cursor: pointer; font-size: 24px;"
    >
      {{ star <= value ? '★' : '☆' }}
      <!-- 实心星或空心星 -->
    </span>
  </div>
</template>

<script>
export default {
  props: ['value'],
  // 接收父组件通过 v-model 传来的值
  methods: {
    setRating(star) {
      // 触发 input 事件，把新评分传给父组件
      this.$emit('input', star)
    }
  }
}
</script>
```

**父组件：**

```vue
<template>
  <div>
    <h3>请为本次服务打分：</h3>
    <!-- 使用 v-model 绑定评分组件 -->
    <star-rating v-model="rating" />
    <!-- 显示当前评分 -->
    <p>你的评分：{{ rating }} 分</p>
  </div>
</template>

<script>
import StarRating from './StarRating.vue'

export default {
  components: {
    StarRating // 注册评分组件
  },
  data() {
    return {
      rating: 0 // 初始评分为 0
    }
  }
}
</script>
```

</details>

## 下一章预告

太棒了！你现在已经掌握了 `v-model` 的各种用法，能轻松处理各种表单场景了。

接下来，我们将进入 Vue 最核心的部分——**组件基础**。你会学习到如何把页面拆分成独立的、可复用的组件，理解 Props 和自定义事件如何实现组件间通信，以及动态组件和 `keep-alive` 的妙用。组件是 Vue 的灵魂，掌握了组件，你就真正入门了 Vue！
