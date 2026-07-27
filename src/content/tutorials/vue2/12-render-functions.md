---
title: "第十二章：渲染函数"
description: "学习 Vue 2 中的渲染函数和 JSX，实现更灵活的组件渲染逻辑。"
---

# 第十二章：渲染函数

## 本章导读

在学这一章之前，你可能会有这些疑问：

- 我写的 `<template>` 到底是怎么变成页面的？
- 什么时候需要自己写渲染函数？template 不够用吗？
- 什么是虚拟 DOM（VNode）？为什么 Vue 要用它？
- JSX 是什么？和 template 有什么区别？

这一章就是为了解答这些问题。我们会先搞清楚 **Vue 渲染的底层原理**，再动手写渲染函数。学完这章，你就能：
- 理解 template 和 render 函数的关系
- 用 render 函数创建动态组件
- 用 JSX 写出更灵活的渲染逻辑
- 知道什么时候该用 render 函数，什么时候用 template

---

## 1 为什么需要渲染函数？

### 痛点分析

想象一下这个场景：你要创建一个"标题组件"，根据传入的 level（1-6），渲染对应的 `<h1>` 到 `<h6>` 标签。

❌ **只用 template 的写法**：
```vue
<template>
  <div>
    <!-- 要写 6 个条件判断 -->
    <h1 v-if="level === 1"><slot /></h1>
    <h2 v-else-if="level === 2"><slot /></h2>
    <h3 v-else-if="level === 3"><slot /></h3>
    <h4 v-else-if="level === 4"><slot /></h4>
    <h5 v-else-if="level === 5"><slot /></h5>
    <h6 v-else-if="level === 6"><slot /></h6>
  </div>
</template>

<script>
export default {
  props: {
    level: { type: Number, required: true }
  }
}
</script>
```

问题很明显：
- 代码重复 6 次
- 新增一个 level 就要加一个判断
- template 的表达能力有限

### 解决方案

✅ **使用渲染函数**：
```vue
<script>
export default {
  props: {
    level: { type: Number, required: true }  // 接收 level 属性
  },
  render(h) {
    // 动态创建标签名：'h1'、'h2'、'h3'...
    return h(
      'h' + this.level,  // 第一个参数：标签名
      {},                 // 第二个参数：属性对象
      this.$slots.default // 第三个参数：子节点
    )
  }
}
</script>
```

3 行代码搞定，不管 level 是几都能正确渲染。

> **一句话总结**：template 适合静态结构，render 函数适合需要动态生成 DOM 结构的场景。

---

## 2 核心原理

### template 到 DOM的过程

打个比方：

> 你写 template 就像写"菜谱"，Vue 会把菜谱翻译成"烹饪步骤"（render 函数），然后按照步骤做出"菜"（真实 DOM）。

**完整流程**：
```
template → 编译 → render 函数 → 执行 → VNode（虚拟 DOM） → 渲染 → 真实 DOM
```

1. **template 编译**：Vue 把 template 编译成 render 函数
2. **render 函数执行**：返回 VNode（虚拟 DOM 节点）
3. **VNode 渲染**：VNode 被渲染成真实 DOM

### 什么是虚拟 DOM（VNode）？

打个比方：

> 虚拟 DOM 就像"建筑蓝图"。你不用每次都去工地（操作真实 DOM），先在蓝图上改（操作 VNode），改好了再一次性施工（渲染到真实 DOM）。

**VNode 的本质**：就是一个普通的 JavaScript 对象，描述了 DOM 节点的结构。

```javascript
// 一个 VNode 大概长这样
{
  tag: 'div',           // 标签名
  data: { class: 'box' }, // 属性
  children: [           // 子节点
    { text: 'Hello' }
  ]
}
```

### 对比分析

| 特性 | template | render 函数 | JSX |
| --- | --- | --- | --- |
| 可读性 | 高（像 HTML） | 低（纯 JS） | 中（像 HTML 的 JS） |
| 灵活性 | 低 | 高 | 高 |
| 编译步骤 | 需要编译 | 不需要 | 需要编译 |
| 学习曲线 | 低 | 高 | 中 |
| 适用场景 | 大部分场景 | 高度动态场景 | 高度动态场景 |

---

## 3 render 函数基础

### h 函数（createElement）

`h` 是 `createElement` 的简写，是 render 函数的核心。

```vue
<script>
export default {
  // render 函数接收 h（createElement）作为参数
  render(h) {
    // h 函数有三个参数
    return h(
      'div',              // 1. 标签名或组件（必填）
      {                   // 2. 数据对象（可选）
        class: 'container',  // class 属性
        style: { color: 'red' }  // style 属性
      },
      [                   // 3. 子节点（可选）
        'Hello ',         // 文本节点
        h('strong', 'World')  // 嵌套元素
      ]
    )
  }
}
</script>
```

等价于 template：
```vue
<template>
  <div class="container" style="color: red">
    Hello <strong>World</strong>
  </div>
</template>
```

### 数据对象详解

```vue
<script>
export default {
  render(h) {
    return h('div', {
      // class 绑定 - 和 template 一样的语法
      class: ['foo', { bar: this.isActive }],  // 数组 + 对象语法

      // style 绑定 - 和 template 一样的语法
      style: {
        color: this.color,     // 动态颜色
        fontSize: '14px'       // 静态大小
      },

      // 普通 HTML 属性
      attrs: {
        id: 'foo',       // id 属性
        title: '提示'    // title 属性
      },

      // 组件 props（传给子组件的数据）
      props: {
        msg: 'hello'     // 传给子组件的 prop
      },

      // DOM 属性（直接设置 DOM 属性）
      domProps: {
        innerHTML: '<strong>bold</strong>'  // 设置 innerHTML
      },

      // 事件监听器（组件自定义事件）
      on: {
        click: this.handleClick  // 点击事件
      },

      // 原生事件监听器（组件根元素的原生事件）
      nativeOn: {
        click: this.handleNativeClick  // 原生点击事件
      },

      // 插槽
      slot: 'header',  // 具名插槽

      // ref 引用
      ref: 'myDiv',    // 可以通过 this.$refs.myDiv 访问

      // key 唯一标识
      key: 'myKey'     // 用于列表渲染
    })
  }
}
</script>
```

### ✅ ❌ 正确/错误写法

```javascript
// ✅ 正确：class 用对象语法
h('div', { class: { active: this.isActive } })

// ❌ 错误：不能直接写 class="active"
h('div', { class: 'active' })  // 这样也行，但不够灵活

// ✅ 正确：事件用 on
h('div', { on: { click: this.handleClick } })

// ❌ 错误：不能直接写 click
h('div', { click: this.handleClick })  // 无效
```

---

## 4 动态组件示例

### 动态标题组件

```vue
<script>
export default {
  props: {
    level: {
      type: Number,       // 类型：数字
      required: true      // 必填
    }
  },
  render(h) {
    // 动态拼接标签名：'h' + 1 = 'h1'
    return h(
      'h' + this.level,   // 标签名：h1/h2/h3...
      this.$slots.default  // 默认插槽内容
    )
  }
}
</script>
```

```vue
<!-- 使用动态标题组件 -->
<template>
  <div>
    <anchored-heading :level="1">
      一级标题  <!-- 渲染为 <h1>一级标题</h1> -->
    </anchored-heading>
    <anchored-heading :level="2">
      二级标题  <!-- 渲染为 <h2>二级标题</h2> -->
    </anchored-heading>
  </div>
</template>
```

> **原理**：`this.$slots.default` 获取默认插槽的内容，作为子节点传给 h 函数。

### 动态按钮组件

```vue
<script>
export default {
  props: {
    type: {
      type: String,
      default: 'button'  // 默认值
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  render(h) {
    return h(
      this.type,  // 动态标签：button/a/input...
      {
        attrs: {
          disabled: this.disabled  // 禁用属性
        },
        class: {
          'btn': true,  // 基础样式
          'btn-disabled': this.disabled  // 禁用样式
        },
        on: {
          click: this.handleClick  // 点击事件
        }
      },
      this.$slots.default  // 按钮内容
    )
  },
  methods: {
    handleClick(event) {
      if (!this.disabled) {
        this.$emit('click', event)  // 触发点击事件
      }
    }
  }
}
</script>
```

---

## 5 函数式组件

### 什么是函数式组件？

打个比方：

> 函数式组件就像"一次性纸杯"——轻量、没有自己的状态（data）、没有生命周期钩子，只用 props 和参数来渲染。

**特点**：
- 没有 `this` 上下文
- 没有响应式数据
- 没有生命周期钩子
- 渲染性能更好

### 基础用法

```javascript
// FunctionalComponent.js
export default {
  functional: true,  // 标记为函数式组件
  props: ['level'],  // 接收 props
  // render 函数接收 context 参数（不是 this）
  render(h, context) {
    return h(
      'h' + context.props.level,  // 通过 context.props 访问 props
      context.data,               // 透传所有属性（class、style、事件等）
      context.children            // 子节点
    )
  }
}
```

```vue
<!-- 使用函数式组件 -->
<template>
  <functional-component :level="2" class="title" @click="handleClick">
    标题  <!-- 子内容 -->
  </functional-component>
</template>
```

### context 对象详解

```javascript
render(h, context) {
  // context 包含以下属性：
  context.props      // props 对象
  context.children   // 子节点数组
  context.slots()    // 插槽函数
  context.data       // 数据对象（class、style、事件等）
  context.parent     // 父组件引用
  context.listeners  // 事件监听器
}
```

### 函数式组件 vs 普通组件

| 特性 | 函数式组件 | 普通组件 |
| --- | --- | --- |
| 状态 | 无 | 有（data） |
| 生命周期 | 无 | 有 |
| this | 无 | 有 |
| 性能 | 更好 | 一般 |
| 适用场景 | 纯展示 | 复杂交互 |

---

## 6 JSX 基础

### 什么是 JSX？

JSX 是 JavaScript 的语法扩展，让你用类似 HTML 的语法写 JavaScript。

```vue
<script>
export default {
  data() {
    return {
      message: 'Hello JSX'  // 数据
    }
  },
  render() {
    // 注意：JSX 中不需要 h 参数
    return (
      <div class="container">
        <h1>{this.message}</h1>  <!-- 用 {} 插入变量 -->
        <p>这是 JSX 语法</p>
      </div>
    )
  }
}
</script>
```

等价于 h 函数：
```javascript
render(h) {
  return h('div', { class: 'container' }, [
    h('h1', this.message),
    h('p', '这是 JSX 语法')
  ])
}
```

> **原理**：JSX 会被编译成 h 函数调用，所以本质上是一样的。

### JSX 属性绑定

```vue
<script>
export default {
  data() {
    return {
      isActive: true,   // 是否激活
      color: 'red',     // 颜色
      items: ['A', 'B', 'C']  // 列表数据
    }
  },
  render() {
    return (
      <div>
        {/* 类绑定 - 对象语法 */}
        <div class={{ active: this.isActive }}>
          类绑定  {/* 如果 isActive 为 true，添加 active 类 */}
        </div>

        {/* 样式绑定 */}
        <div style={{ color: this.color }}>
          样式绑定  {/* 文字颜色为 red */}
        </div>

        {/* 属性绑定 */}
        <input value={this.message} />  {/* 绑定 value 属性 */}

        {/* 事件绑定 - 注意 onClick 不是 @click */}
        <button onClick={this.handleClick}>
          点击  {/* 点击时调用 handleClick */}
        </button>

        {/* 列表渲染 - 用 map 代替 v-for */}
        <ul>
          {this.items.map(item => (
            <li key={item}>{item}</li>  {/* key 是必须的 */}
          ))}
        </ul>

        {/* 条件渲染 - 用三元表达式代替 v-if */}
        {this.isActive ? (
          <p>激活状态</p>  {/* isActive 为 true 时显示 */}
        ) : (
          <p>未激活</p>    {/* isActive 为 false 时显示 */}
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

### ✅ ❌ JSX 正确/错误写法

```javascript
// ✅ 正确：事件用 onClick
<button onClick={this.handleClick}>点击</button>

// ❌ 错误：不能用 @click
<button @click={this.handleClick}>点击</button>  // JSX 不支持 @

// ✅ 正确：类绑定用对象
<div class={{ active: true }}>内容</div>

// ❌ 错误：不能写 :class
<div :class={{ active: true }}>内容</div>  // JSX 不支持 :

// ✅ 正确：注释用 {/* */}
<div>
  {/* 这是注释 */}
  内容
</div>

// ❌ 错误：不能用 <!-- -->
<div>
  <!-- 这是注释 -->  // JSX 不支持 HTML 注释
  内容
</div>
```

---

## 7 JSX 插槽和组件

### JSX 中的插槽

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

### JSX 中使用组件

```vue
<script>
import ChildComponent from './ChildComponent.vue'  // 导入子组件

export default {
  render() {
    return (
      <div>
        {/* 使用组件 - 和 HTML 标签写法一样 */}
        <ChildComponent
          title="标题"           // 字符串 prop
          count={10}             // 数字 prop（注意用 {}）
          onCustomEvent={this.handleEvent}  // 自定义事件
        >
          子内容  {/* 默认插槽 */}
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

> **注意**：JSX 中组件名必须大写开头，否则会被当作 HTML 标签。

---

## 8 实际示例：动态表单

```vue
<script>
export default {
  props: ['fields'],  // 接收表单字段配置
  data() {
    return {
      formData: {}  // 表单数据
    }
  },
  render(h) {
    // 根据字段配置生成表单项
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
          return null  // 未知类型返回 null
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
      e.preventDefault()  // 阻止默认提交行为
      console.log('表单数据：', this.formData)
    }
  }
}
</script>
```

```vue
<!-- 使用动态表单 -->
<template>
  <dynamic-form :fields="formFields" />
</template>

<script>
export default {
  data() {
    return {
      formFields: [
        { type: 'input', name: 'username', label: '用户名' },
        { type: 'select', name: 'role', label: '角色', options: [
          { value: 'admin', label: '管理员' },
          { value: 'user', label: '普通用户' }
        ]},
        { type: 'checkbox', name: 'agree', label: '同意协议' }
      ]
    }
  }
}
</script>
```

> **优势**：用配置驱动表单生成，不需要为每种表单写 template。

---

## 9 render 函数 vs template 对比

| 特性 | 渲染函数 | 模板 |
|------|----------|------|
| 灵活性 | 高（完全控制） | 低（受限于指令） |
| 性能 | 略优（跳过编译） | 良好 |
| 可读性 | 较低（纯 JS） | 高（像 HTML） |
| 开发效率 | 较低（手写 VNode） | 高（声明式） |
| 类型检查 | 困难 | 支持（vue-tsc） |
| 学习曲线 | 陡峭 | 平缓 |
| 调试 | 容易（纯 JS） | 困难（编译后） |
| 适用场景 | 高度动态组件 | 大部分场景 |

### 选择建议

| 场景 | 推荐方案 | 原因 |
| --- | --- | --- |
| 普通页面组件 | template | 可读性好，开发快 |
| 动态标签组件 | render/JSX | template 无法动态标签名 |
| 高性能列表 | render | 跳过编译，性能略优 |
| 表单生成器 | render/JSX | 配置驱动，灵活度高 |
| 纯展示小组件 | 函数式组件 | 性能最好 |

---

## 10 核心知识点总结

| 知识点 | 说明 |
| --- | --- |
| render 函数 | 替代 template，直接创建 VNode |
| h 函数 | createElement，创建虚拟 DOM 节点 |
| VNode | 虚拟 DOM，JavaScript 对象描述真实 DOM |
| 函数式组件 | 无状态、无 this、性能更好 |
| JSX | 类 HTML 的 JS 语法，编译成 h 函数 |
| template vs render | template 编译成 render，本质一样 |

---

## 11 新手常见误区

### 误区 1："render 函数比 template 性能更好"

**不完全对。** 差别很小，大部分场景可以忽略。

❌ 错误理解：
```
render 函数比 template 快很多，应该都用 render
```

✅ 正确理解：
```
render 函数跳过了编译步骤，性能略优
但差别很小，template 的可读性和开发效率更重要
只在性能瓶颈时才考虑 render 函数
```

### 误区 2："JSX 中可以用 v-if 和 v-for"

**不行！** JSX 是 JavaScript，要用 JS 语法。

❌ 错误做法：
```jsx
render() {
  return (
    <div>
      <p v-if="this.isActive">激活</p>  {/* ❌ JSX 不支持 v-if */}
      <li v-for="item in items">{item}</li>  {/* ❌ JSX 不支持 v-for */}
    </div>
  )
}
```

✅ 正确做法：
```jsx
render() {
  return (
    <div>
      {this.isActive ? <p>激活</p> : null}  {/* ✅ 用三元表达式 */}
      {this.items.map(item => <li>{item}</li>)}  {/* ✅ 用 map */}
    </div>
  )
}
```

### 误区 3："函数式组件可以有 data 和 methods"

**不行！** 函数式组件没有实例。

❌ 错误做法：
```javascript
export default {
  functional: true,
  data() {  // ❌ 函数式组件没有 data
    return { count: 0 }
  },
  methods: {  // ❌ 函数式组件没有 methods
    increment() { this.count++ }
  }
}
```

✅ 正确做法：
```javascript
export default {
  functional: true,
  props: ['count'],  // 用 props 接收数据
  render(h, context) {
    // 通过 context.listeners 触发事件
    return h('button', {
      on: { click: () => context.listeners.increment() }
    }, context.props.count)
  }
}
```

### 误区 4："render 函数中可以用 this.$refs"

**不能在 render 函数中直接用，但可以在事件中用。**

❌ 错误做法：
```javascript
render(h) {
  this.$refs.input.focus()  // ❌ render 时 $refs 还没生成
  return h('input', { ref: 'input' })
}
```

✅ 正确做法：
```javascript
render(h) {
  return h('input', {
    ref: 'input',  // 设置 ref
    on: {
      focus: () => {
        this.$refs.input.blur()  // ✅ 在事件中可以用
      }
    }
  })
}
```

### 误区 5："JSX 中事件绑定和 template 一样"

**不一样！** JSX 用驼峰命名。

❌ 错误做法：
```jsx
<button on-click={this.handleClick}>点击</button>  {/* ❌ 这是 template 语法 */}
```

✅ 正确做法：
```jsx
<button onClick={this.handleClick}>点击</button>  {/* ✅ JSX 用驼峰 */}
```

---

## 12 动手练习

### 练习 1：基础练习 - 用 render 函数创建链接组件

创建一个组件，根据 `tag` prop 动态渲染 `<a>` 或 `<router-link>`。

<details>
<summary>点击查看答案</summary>

```vue
<script>
export default {
  props: {
    tag: {
      type: String,
      default: 'a'  // 默认用 a 标签
    },
    href: {
      type: String,
      required: true
    }
  },
  render(h) {
    // 根据 tag 决定渲染什么
    if (this.tag === 'router-link') {
      return h('router-link', {
        props: { to: this.href }  // router-link 需要 to prop
      }, this.$slots.default)
    } else {
      return h('a', {
        attrs: { href: this.href }  // a 标签需要 href 属性
      }, this.$slots.default)
    }
  }
}
</script>
```

```vue
<!-- 使用 -->
<template>
  <div>
    <smart-link href="/home">首页（a 标签）</smart-link>
    <smart-link tag="router-link" href="/about">关于（路由链接）</smart-link>
  </div>
</template>
```

</details>

### 练习 2：进阶练习 - 用 JSX 创建列表组件

用 JSX 创建一个列表组件，支持空状态提示和加载状态。

<details>
<summary>点击查看答案</summary>

```vue
<script>
export default {
  props: {
    items: {
      type: Array,
      default: () => []  // 默认空数组
    },
    loading: {
      type: Boolean,
      default: false
    },
    emptyText: {
      type: String,
      default: '暂无数据'
    }
  },
  render() {
    // 加载中状态
    if (this.loading) {
      return <div class="loading">加载中...</div>
    }

    // 空状态
    if (this.items.length === 0) {
      return <div class="empty">{this.emptyText}</div>
    }

    // 正常列表
    return (
      <ul class="list">
        {this.items.map((item, index) => (
          <li key={index} class="list-item">
            {item}
          </li>
        ))}
      </ul>
    )
  }
}
</script>
```

```vue
<!-- 使用 -->
<template>
  <smart-list :items="users" :loading="isLoading" empty-text="没有用户" />
</template>

<script>
export default {
  data() {
    return {
      users: ['Alice', 'Bob', 'Charlie'],
      isLoading: false
    }
  }
}
</script>
```

</details>

### 练习 3（挑战）：综合练习 - 用函数式组件创建图标组件

创建一个函数式图标组件，根据 `name` prop 渲染不同的 SVG 图标。

<details>
<summary>点击查看答案</summary>

```javascript
// Icon.js - 函数式图标组件
const iconPaths = {
  home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  search: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'
}

export default {
  functional: true,  // 函数式组件
  props: {
    name: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      default: 24
    },
    color: {
      type: String,
      default: 'currentColor'
    }
  },
  render(h, context) {
    const { name, size, color } = context.props
    const path = iconPaths[name] || ''  // 获取图标路径

    return h('svg', {
      attrs: {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        fill: color
      },
      style: {
        display: 'inline-block',
        verticalAlign: 'middle'
      }
    }, [
      h('path', { attrs: { d: path } })
    ])
  }
}
```

```vue
<!-- 使用 -->
<template>
  <div>
    <icon name="home" size="32" color="blue" />
    <icon name="search" />
    <icon name="close" color="red" />
  </div>
</template>

<script>
import Icon from './Icon.js'

export default {
  components: { Icon }
}
</script>
```

</details>

---

## 下一章预告

下一章我们会学习 **Vue Router**——Vue 的官方路由管理器。你会学到：
- 如何配置路由，实现页面切换
- router-link 和 router-view 的用法
- 嵌套路由和动态路由
- 导航守卫（路由拦截）
- 路由懒加载（性能优化）
