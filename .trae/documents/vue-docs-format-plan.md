# 改造为 Vue 官网文档格式 — 实施计划

## 概述
将当前 TypeScript 教程页面改造为 Vue.js 官网文档风格的三栏布局：
- **顶部导航栏**：固定顶部，含 Logo、导航链接
- **左侧边栏**：章节导航列表，高亮当前章节
- **中间内容区**：教程正文内容
- **右侧边栏**：当前页面的目录锚点（On This Page）
- **底部**：上一章 / 下一章导航

## 当前状态分析

### 现有文件结构
- `src/App.vue` — 使用 Vue 脚手架默认布局（header + RouterView），不适合文档格式
- `src/router/index.ts` — 14 条路由（home, about, tutorials, tutorials/01~12）
- `src/views/TutorialIndex.vue` — 教程目录页，卡片式展示所有章节
- `src/views/tutorials/Tut01~12.vue` — 12 个教程组件，每个都是独立全页
- `src/assets/main.css` / `base.css` — 全局样式，含 CSS 变量

### 现有问题
- App.vue 的 header 布局是脚手架默认样式，不适合文档阅读
- 每个教程页面重复了大量样式代码
- 没有侧边栏导航和页面内目录
- 没有上一章/下一章导航

## 改造方案

### Step 1: 创建文档布局组件 `TutorialLayout.vue`
**文件**: `src/layouts/TutorialLayout.vue`（新建）

三栏文档布局组件，包含：
- 顶部固定导航栏（TS 蓝色主题 #3178c6）
- 左侧边栏（240px 宽）：章节列表，当前章节高亮
- 右侧边栏（200px 宽）：当前页面的 h2/h3 目录锚点
- 中间内容区：`<slot>` 渲染教程内容
- 底部：上一章/下一章按钮

布局结构：
```
┌─────────────────────────────────────────────┐
│  顶部导航栏 (fixed, 56px)                     │
├──────────┬──────────────────────┬───────────┤
│          │                      │           │
│ 左侧边栏  │     中间内容区         │ 右侧目录栏  │
│ (240px)  │     (flex: 1)        │  (200px)  │
│          │                      │           │
│ 章节列表  │   <slot />           │  页面锚点   │
│          │                      │           │
├──────────┴──────────────────────┴───────────
│  上一章 ←                    → 下一章         │
└─────────────────────────────────────────────┘
```

### Step 2: 创建侧边栏数据配置
**文件**: `src/data/tutorials.ts`（新建）

提取章节配置数据（从 TutorialIndex.vue 中抽离），供布局组件和路由共用：
```ts
export interface TutorialChapter {
  number: string
  title: string
  description: string
  path: string
  category: '基础篇' | '进阶篇' | '实战篇'
}

export const tutorialChapters: TutorialChapter[] = [...]
export const categories = ['基础篇', '进阶篇', '实战篇'] as const
```

### Step 3: 修改 App.vue 路由布局
**文件**: `src/App.vue`（修改）

- 普通页面（Home, About）保持原布局
- 教程页面（/tutorials/*）使用 TutorialLayout 包裹
- 使用 Vue Router 的 `<RouterView>` 嵌套或条件渲染

方案：在 App.vue 中根据路由判断是否使用文档布局：
```vue
<template>
  <TutorialLayout v-if="isTutorialRoute">
    <RouterView />
  </TutorialLayout>
  <div v-else>
    <!-- 原有布局 -->
  </div>
</template>
```

### Step 4: 创建侧边栏组件
**文件**: `src/components/TutorialSidebar.vue`（新建）

- 按分类（基础篇/进阶篇/实战篇）分组显示章节
- 当前路由对应的章节高亮
- 点击跳转到对应章节
- 移动端可折叠

### Step 5: 创建右侧目录组件
**文件**: `src/components/TableOfContents.vue`（新建）

- 自动扫描当前页面内容中的 h2/h3 标题
- 生成锚点链接
- 滚动时高亮当前章节
- 使用 IntersectionObserver 实现滚动监听

### Step 6: 创建底部导航组件
**文件**: `src/components/TutorialNavFooter.vue`（新建）

- 显示上一章和下一章链接
- 根据当前路由自动计算前后章节
- 第一章不显示"上一章"，最后一章不显示"下一章"

### Step 7: 改造教程内容组件
**文件**: `src/views/tutorials/Tut01~12.vue`（全部修改）

每个教程组件需要：
- 移除重复的 `.tutorial` 外层容器样式（由布局组件提供）
- 移除顶部的 `<h1>` 标题（由布局组件的侧边栏已展示）
- 保留 `.section`、`.code-block`、`pre` 等内容样式
- 为每个 h2 添加 `id` 属性，供右侧目录锚点使用
- 移除每个组件中的 `.tutorial` 样式块，改为使用全局文档样式

### Step 8: 更新 TutorialIndex.vue
**文件**: `src/views/TutorialIndex.vue`（修改）

- 使用 TutorialLayout 包裹
- 简化为纯内容展示（章节卡片列表）
- 数据源改为从 `src/data/tutorials.ts` 导入

### Step 9: 创建全局文档样式
**文件**: `src/assets/doc-styles.css`（新建）

提取所有教程组件共用的样式为全局样式：
- `.section`、`.code-block`、`pre`、`code` 样式
- `.compare-table` 表格样式
- `.demo-card`、`.result-card` 卡片样式
- `.demo-area` 交互演示区域样式
- 响应式断点（隐藏右侧目录栏、左侧边栏折叠等）

### Step 10: 更新路由配置
**文件**: `src/router/index.ts`（修改）

- 为教程路由添加 `meta` 信息（标题、分类），供布局组件使用
- 教程路由使用嵌套路由结构

## 响应式设计
- **>= 1280px**: 三栏布局（侧边栏 + 内容 + 目录）
- **960px ~ 1279px**: 双栏布局（侧边栏 + 内容，隐藏右侧目录）
- **< 960px**: 单栏布局（隐藏侧边栏，提供汉堡菜单按钮）

## 涉及文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/layouts/TutorialLayout.vue` | 新建 | 文档三栏布局 |
| `src/data/tutorials.ts` | 新建 | 章节配置数据 |
| `src/components/TutorialSidebar.vue` | 新建 | 左侧章节导航 |
| `src/components/TableOfContents.vue` | 新建 | 右侧页面目录 |
| `src/components/TutorialNavFooter.vue` | 新建 | 底部上下章导航 |
| `src/assets/doc-styles.css` | 新建 | 全局文档样式 |
| `src/App.vue` | 修改 | 添加布局判断逻辑 |
| `src/router/index.ts` | 修改 | 添加路由 meta |
| `src/views/TutorialIndex.vue` | 修改 | 适配新布局 |
| `src/views/tutorials/Tut01~12.vue` | 修改 | 移除重复样式，适配布局 |

## 验证步骤
1. `npm run build` — 确保 TypeScript 类型检查通过
2. `npm run dev` — 启动开发服务器
3. 访问 `/tutorials` 验证目录页布局
4. 访问 `/tutorials/01` 验证文档三栏布局
5. 验证左侧边栏高亮、右侧目录锚点、底部导航
6. 验证响应式布局（缩小窗口测试）
