# TypeScript 可运行教程 — 实施计划

## 概述

在现有 Vue 3 + TypeScript 项目中，以 **可运行的 Vue 组件** 形式创建一套从零到精通的 TypeScript 教程。每个教程对应一个 Vue 页面，通过路由导航访问，用户可以在浏览器中直接看到代码效果。

## 当前项目状态

- Vue 3 + TypeScript + Vite 项目，已配置 vue-router 和 pinia
- 现有路由：`/`（Home）和 `/about`（About）
- 使用 `<script setup lang="ts">` 语法

## 教程章节规划（每个为一个 Vue 组件 + 路由）

### 基础篇

1. **基础类型** (`Tut01BasicTypes.vue`) — `string`, `number`, `boolean`, `null`, `undefined`, `void`, `any`, `unknown`
2. **数组与元组** (`Tut02ArrayTuple.vue`) — 数组类型、元组、只读元组
3. **对象与接口** (`Tut03ObjectInterface.vue`) — `interface` 定义、可选属性、只读属性、继承
4. **类型别名与联合类型** (`Tut04TypeAliasUnion.vue`) — `type`、联合类型、交叉类型、类型守卫
5. **函数类型** (`Tut05Function.vue`) — 参数类型、返回值、重载、this 参数

### 进阶篇

6. **类与面向对象** (`Tut06Class.vue`) — class、访问修饰符、抽象类、装饰器
7. **泛型** (`Tut07Generics.vue`) — 泛型函数、泛型接口、泛型约束、泛型工具类型
8. **枚举** (`Tut08Enum.vue`) — 数字枚举、字符串枚举、常量枚举
9. **类型断言与类型收窄** (`Tut09TypeAssertion.vue`) — `as`、`!`、`in`、`typeof`、`instanceof`
10. **高级类型** (`Tut10AdvancedTypes.vue`) — `keyof`、`typeof`、`infer`、条件类型、映射类型、模板字面量类型

### 实战篇

11. **工具类型实战** (`Tut11UtilityTypes.vue`) — `Partial`、`Required`、`Pick`、`Omit`、`Record`、`Exclude`、`ReturnType` 等
12. **Vue 中的 TypeScript** (`Tut12VueWithTS.vue`) — `defineProps<T>`、`defineEmits<T>`、`ref<T>`、`computed` 类型推导、组件类型

## 实施步骤

### Step 1: 创建教程目录和组件

- 在 `src/views/tutorials/` 下创建 12 个 Vue 组件
- 每个组件包含：标题、知识点说明文字、可交互的代码演示（使用响应式数据展示效果）

### Step 2: 创建教程导航页面

- 创建 `src/views/TutorialIndex.vue` 作为教程目录页
- 列出所有章节，带链接跳转到对应教程

### Step 3: 配置路由

- 修改 `src/router/index.ts`，添加教程相关路由：
  - `/tutorials` → 教程目录页
  - `/tutorials/01` ~ `/tutorials/12` → 各教程页面

### Step 4: 更新 App.vue 导航

- 在顶部导航栏添加 "TypeScript 教程" 链接

## 每个教程组件的结构

```vue
<script setup lang="ts">
// 教程的 TypeScript 代码演示
// 使用 ref/reactive 展示变量值
// 使用 computed 展示类型推导结果
</script>

<template>
  <div class="tutorial">
    <h1>章节标题</h1>
    <section>
      <h2>知识点说明</h2>
      <p>文字讲解</p>
      <div class="demo">
        <!-- 展示运行结果 -->
      </div>
      <pre class="code"><!-- 展示代码示例 --></pre>
    </section>
  </div>
</template>
```

## 注意事项

- 每个组件必须使用 `<script setup lang="ts">` 并充分展示 TS 类型
- 代码示例要能在浏览器中运行并展示结果
- 使用项目现有的样式变量保持一致风格
- 不引入额外依赖
