---
title: "第六章：表单输入绑定"
description: "学习 Vue 2 中使用 v-model 实现表单元素的双向数据绑定。"
---

# 第六章：表单输入绑定

## 运行结果

- **文本输入**
  - 输入框内容实时同步到 `message`
  - 显示：Message: Hello Vue
- **多行文本**
  - textarea 内容绑定到 `text`
- **复选框**
  - 单个复选框绑定布尔值
  - 多个复选框绑定数组
- **单选框**
  - 选中项的值绑定到 `picked`
- **下拉选择**
  - 选中选项绑定到 `selected`

## 代码详解

### 1. 文本输入

```vue
<template>
  <div>
    <input v-model="message" placeholder="编辑我" />
    <p>Message: {{ message }}</p>
    
    <!-- 多行文本 -->
    <textarea v-model="text" placeholder="多行文本"></textarea>
    <p style="white-space: pre-wrap;">{{ text }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: '',
      text: ''
    }
  }
}
</script>
```

::: warning
在 textarea 中使用插值表达式 `<textarea>{{ text }}</textarea>` 不会生效，必须使用 `v-model`。
:::

### 2. 复选框

```vue
<template>
  <div>
    <!-- 单个复选框：布尔值 -->
    <input type="checkbox" id="checkbox" v-model="checked" />
    <label for="checkbox">{{ checked }}</label>
    
    <!-- 多个复选框：数组 -->
    <div>
      <input type="checkbox" id="jack" value="Jack" v-model="checkedNames" />
      <label for="jack">Jack</label>
      
      <input type="checkbox" id="john" value="John" v-model="checkedNames" />
      <label for="john">John</label>
      
      <input type="checkbox" id="mike" value="Mike" v-model="checkedNames" />
      <label for="mike">Mike</label>
    </div>
    <p>Checked names: {{ checkedNames }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      checked: false,
      checkedNames: []
    }
  }
}
</script>
```

### 3. 单选框

```vue
<template>
  <div>
    <input type="radio" id="one" value="One" v-model="picked" />
    <label for="one">One</label>
    
    <input type="radio" id="two" value="Two" v-model="picked" />
    <label for="two">Two</label>
    
    <p>Picked: {{ picked }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      picked: ''
    }
  }
}
</script>
```

### 4. 下拉选择框

```vue
<template>
  <div>
    <!-- 单选 -->
    <select v-model="selected">
      <option disabled value="">请选择</option>
      <option>A</option>
      <option>B</option>
      <option>C</option>
    </select>
    <p>Selected: {{ selected }}</p>
    
    <!-- 多选 -->
    <select v-model="multiSelected" multiple>
      <option>A</option>
      <option>B</option>
      <option>C</option>
    </select>
    <p>Selected: {{ multiSelected }}</p>
    
    <!-- 动态选项 -->
    <select v-model="dynamicSelected">
      <option v-for="option in options" :value="option.value">
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
      selected: '',
      multiSelected: [],
      dynamicSelected: '',
      options: [
        { text: '选项一', value: 'A' },
        { text: '选项二', value: 'B' },
        { text: '选项三', value: 'C' }
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
    <!-- .lazy：在 change 事件后同步 -->
    <input v-model.lazy="lazyMessage" />
    <p>{{ lazyMessage }}</p>
    
    <!-- .number：自动转换为数字 -->
    <input v-model.number="age" type="number" />
    <p>{{ age }} (type: {{ typeof age }})</p>
    
    <!-- .trim：自动去除首尾空格 -->
    <input v-model.trim="trimmedMessage" />
    <p>{{ trimmedMessage }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      lazyMessage: '',
      age: null,
      trimmedMessage: ''
    }
  }
}
</script>
```

### 6. 绑定 value

```vue
<template>
  <div>
    <!-- 复选框绑定动态值 -->
    <input type="checkbox" v-model="toggle" true-value="yes" false-value="no" />
    <p>{{ toggle }}</p>
    
    <!-- 单选框绑定动态值 -->
    <input type="radio" v-model="pick" value="a" />
    <input type="radio" v-model="pick" value="b" />
    <p>{{ pick }}</p>
    
    <!-- 下拉选项绑定对象 -->
    <select v-model="selectedOption">
      <option :value="{ number: 123 }">123</option>
    </select>
    <p>{{ selectedOption }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      toggle: 'no',
      pick: '',
      selectedOption: null
    }
  }
}
</script>
```

### 7. 在组件上使用 v-model

```vue
<!-- 自定义输入组件 -->
<!-- CustomInput.vue -->
<template>
  <input
    :value="value"
    @input="$emit('input', $event.target.value)"
  />
</template>

<script>
export default {
  props: ['value']
}
</script>
```

```vue
<!-- 父组件 -->
<template>
  <custom-input v-model="message" />
</template>

<script>
import CustomInput from './CustomInput.vue'

export default {
  components: {
    CustomInput
  },
  data() {
    return {
      message: ''
    }
  }
}
</script>
```

### 8. 表单验证示例

```vue
<template>
  <form @submit.prevent="onSubmit">
    <div>
      <label>用户名：</label>
      <input
        v-model.trim="form.username"
        @blur="validateUsername"
      />
      <span v-if="errors.username">{{ errors.username }}</span>
    </div>
    
    <div>
      <label>邮箱：</label>
      <input
        v-model.trim="form.email"
        type="email"
        @blur="validateEmail"
      />
      <span v-if="errors.email">{{ errors.email }}</span>
    </div>
    
    <div>
      <label>密码：</label>
      <input
        v-model="form.password"
        type="password"
        @blur="validatePassword"
      />
      <span v-if="errors.password">{{ errors.password }}</span>
    </div>
    
    <button type="submit" :disabled="!isValid">提交</button>
  </form>
</template>

<script>
export default {
  data() {
    return {
      form: {
        username: '',
        email: '',
        password: ''
      },
      errors: {
        username: '',
        email: '',
        password: ''
      }
    }
  },
  computed: {
    isValid() {
      return (
        this.form.username &&
        this.form.email &&
        this.form.password &&
        !this.errors.username &&
        !this.errors.email &&
        !this.errors.password
      )
    }
  },
  methods: {
    validateUsername() {
      if (!this.form.username) {
        this.errors.username = '用户名不能为空'
      } else if (this.form.username.length < 3) {
        this.errors.username = '用户名至少 3 个字符'
      } else {
        this.errors.username = ''
      }
    },
    validateEmail() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!this.form.email) {
        this.errors.email = '邮箱不能为空'
      } else if (!emailRegex.test(this.form.email)) {
        this.errors.email = '邮箱格式不正确'
      } else {
        this.errors.email = ''
      }
    },
    validatePassword() {
      if (!this.form.password) {
        this.errors.password = '密码不能为空'
      } else if (this.form.password.length < 6) {
        this.errors.password = '密码至少 6 个字符'
      } else {
        this.errors.password = ''
      }
    },
    onSubmit() {
      this.validateUsername()
      this.validateEmail()
      this.validatePassword()
      
      if (this.isValid) {
        console.log('提交表单：', this.form)
      }
    }
  }
}
</script>
```

## 最佳实践

::: info
- 使用 `v-model` 实现表单双向绑定
- 合理使用修饰符：`.lazy`、`.number`、`.trim`
- 表单验证使用 `@blur` 事件触发
- 复杂表单使用对象管理数据
- 自定义组件实现 `v-model` 需要 `value` prop 和 `input` 事件
- 注意 textarea 必须使用 `v-model` 而非插值
:::
