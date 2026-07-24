---
title: "第十二章：渲染函数"
description: "学习 Vue 2 中的渲染函数和 JSX，实现更灵活的组件渲染逻辑。"
---

# 第十二章：渲染函数

## 运行结果

- **渲染函数**
  - 使用 render 函数替代模板
  - 动态创建虚拟 DOM
  - 更灵活的渲染逻辑
- **JSX**
  - 使用 JSX 语法创建组件
  - 更接近 HTML 的写法
  - 支持所有 JavaScript 表达式

## 代码详解

### 1. 渲染函数基础

```vue
<script>
export default {
  // 使用 render 函数替代 template
  render(h) {
    return h(
      'div',           // 标签名或组件
      {                // 数据对象（可选）
        class: 'container',
        style: { color: 'red' }
      },
      [                // 子节点（可选）
        'Hello ',
        h('strong', 'World')
      ]
    )
  }
}
</script>
```

### 2. 数据对象详解

```vue
<script>
export default {
  render(h) {
    return h('div', {
      // 与 template 中相同的绑定方式
      class: ['foo', { bar: this.isActive }],
      style: {
        color: this.color,
        fontSize: '14px'
      },
      // 普通 HTML 属性
      attrs: {
        id: 'foo',
        title: '提示'
      },
      // 组件 props
      props: {
        msg: 'hello'
      },
      // DOM 属性
      domProps: {
        innerHTML: '<strong>bold</strong>'
      },
      // 事件监听器
      on: {
        click: this.handleClick
      },
      // 原生事件
      nativeOn: {
        click: this.handleNativeClick
      },
      // 插槽
      slot: 'header',
      scopedSlots: {
        default: props => h('span', props.text)
      },
      // ref
      ref: 'myDiv',
      // key
      key: 'myKey'
    })
  }
}
</script>
```

### 3. 动态组件

```vue
<script>
export default {
  props: {
    level: {
      type: Number,
      required: true
    }
  },
  render(h) {
    // 动态创建标题标签
    return h(
      'h' + this.level,
      this.$slots.default
    )
  }
}
</script>
```

```vue
<!-- 使用 -->
<template>
  <anchored-heading :level="1">
    标题内容
  </anchored-heading>
</template>
```

### 4. 函数式组件

```javascript
// FunctionalComponent.js
export default {
  functional: true, // 标记为函数式组件
  props: ['level'],
  // render 函数接收 context 参数
  render(h, context) {
    return h(
      'h' + context.props.level,
      context.data, // 透传所有属性
      context.children // 子节点
    )
  }
}
```

```vue
<!-- 使用 -->
<template>
  <functional-component :level="2">
    标题
  </functional-component>
</template>
```

### 5. JSX 基础

```vue
<script>
export default {
  data() {
    return {
      message: 'Hello JSX'
    }
  },
  render() {
    return (
      <div class="container">
        <h1>{this.message}</h1>
        <p>这是 JSX 语法</p>
      </div>
    )
  }
}
</script>
```

### 6. JSX 属性绑定

```vue
<script>
export default {
  data() {
    return {
      isActive: true,
      color: 'red',
      items: ['A', 'B', 'C']
    }
  },
  render() {
    return (
      <div>
        {/* 类绑定 */}
        <div class={{ active: this.isActive }}>
          类绑定
        </div>
        
        {/* 样式绑定 */}
        <div style={{ color: this.color }}>
          样式绑定
        </div>
        
        {/* 属性绑定 */}
        <input value={this.message} />
        
        {/* 事件绑定 */}
        <button onClick={this.handleClick}>
          点击
        </button>
        
        {/* 列表渲染 */}
        <ul>
          {this.items.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        
        {/* 条件渲染 */}
        {this.isActive ? (
          <p>激活状态</p>
        ) : (
          <p>未激活</p>
        )}
      </div>
    )
  },
  methods: {
    handleClick() {
      console.log('clicked')
    }
  }
}
</script>
```

### 7. JSX 插槽

```vue
<script>
export default {
  render() {
    return (
      <div>
        {/* 默认插槽 */}
        {this.$slots.default}
        
        {/* 具名插槽 */}
        {this.$slots.header}
        {this.$slots.footer}
        
        {/* 作用域插槽 */}
        {this.$scopedSlots.default({ text: 'hello' })}
      </div>
    )
  }
}
</script>
```

### 8. JSX 组件

```vue
<script>
import ChildComponent from './ChildComponent.vue'

export default {
  render() {
    return (
      <div>
        {/* 使用组件 */}
        <ChildComponent
          title="标题"
          count={10}
          onCustomEvent={this.handleEvent}
        >
          子内容
        </ChildComponent>
      </div>
    )
  },
  methods: {
    handleEvent(data) {
      console.log('收到事件：', data)
    }
  }
}
</script>
```

### 9. 实际示例：动态表单

```vue
<script>
export default {
  props: ['fields'],
  data() {
    return {
      formData: {}
    }
  },
  render(h) {
    const children = this.fields.map(field => {
      switch (field.type) {
        case 'input':
          return (
            <div class="form-field">
              <label>{field.label}</label>
              <input
                type="text"
                value={this.formData[field.name]}
                onInput={e => {
                  this.formData[field.name] = e.target.value
                }}
              />
            </div>
          )
        case 'select':
          return (
            <div class="form-field">
              <label>{field.label}</label>
              <select
                value={this.formData[field.name]}
                onChange={e => {
                  this.formData[field.name] = e.target.value
                }}
              >
                {field.options.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )
        case 'checkbox':
          return (
            <div class="form-field">
              <label>
                <input
                  type="checkbox"
                  checked={this.formData[field.name]}
                  onChange={e => {
                    this.formData[field.name] = e.target.checked
                  }}
                />
                {field.label}
              </label>
            </div>
          )
        default:
          return null
      }
    })
    
    return (
      <form onSubmit={this.handleSubmit}>
        {children}
        <button type="submit">提交</button>
      </form>
    )
  },
  methods: {
    handleSubmit(e) {
      e.preventDefault()
      console.log('表单数据：', this.formData)
    }
  }
}
</script>
```

### 10. 渲染函数 vs 模板

| 特性 | 渲染函数 | 模板 |
|------|----------|------|
| 灵活性 | 高 | 低 |
| 性能 | 略优 | 良好 |
| 可读性 | 较低 | 高 |
| 开发效率 | 较低 | 高 |
| 类型检查 | 困难 | 支持 |
| 学习曲线 | 陡峭 | 平缓 |

## 最佳实践

::: info
- 优先使用模板，复杂场景使用渲染函数
- JSX 提供更接近 HTML 的语法
- 函数式组件适合纯展示组件
- 渲染函数中注意性能优化
- 合理使用 h 函数创建虚拟 DOM
- 保持组件的可维护性
:::
