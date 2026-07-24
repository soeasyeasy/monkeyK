# 全栈教程门户 + Markdown 教程模板 + 多主题系统

## 需求总结
1. **门户式首页**：支持前端、后端、操作系统、网络、运维全栈教程 + 个人生活记录 + 待办功能
2. **Markdown 教程模板**：用 .md 文件编写教程，通用渲染组件显示，方便后期发布新教程
3. **7 种主题配色**：浅色、深色、海洋蓝、森林绿、紫罗兰、暮光橙、玫瑰粉

## 当前状态分析

### 教程数据结构（src/data/tutorials.ts）
- 硬编码 12 个 TypeScript 章节
- category 固定为 '基础篇' | '进阶篇' | '实战篇'
- 不支持多个教程系列

### 路由（src/router/index.ts）
- 每个教程章节手动配置路由（tutorial-01 ~ tutorial-12）
- 新增教程需修改路由文件
- 无动态路由

### 教程组件（src/views/tutorials/Tut01~12.vue）
- 每个教程是独立 .vue 文件，含可运行 Vue 代码
- 结构相似但手写，维护成本高

### 首页（src/views/HomePage.vue）
- 硬编码为 TypeScript 教程首页
- 无多模块入口

### 主题系统（src/assets/themes.css + src/composables/useTheme.ts）
- 仅 2 个主题（浅色、深色）

### 其他相关文件
- `src/components/TutorialSidebar.vue` - 侧边栏，按分类显示
- `src/components/TableOfContents.vue` - 目录
- `src/components/TutorialNavFooter.vue` - 上下章导航
- `src/layouts/TutorialLayout.vue` - 三栏布局
- `src/assets/doc-styles.css` - 文档样式
- `src/views/TutorialIndex.vue` - 教程索引页

## 设计方案

### 1. 教程系列数据结构

**文件：`src/data/tutorial-series.ts`**

```typescript
export type TutorialCategory = 'frontend' | 'backend' | 'system' | 'network' | 'devops'

export interface TutorialSeries {
  id: string                    // 'typescript', 'vue', 'nodejs'
  title: string                 // 'TypeScript 从零到精通'
  description: string
  icon: string                  // emoji 或图标
  category: TutorialCategory
  basePath: string             // '/tutorials/typescript'
  chapters: ChapterMeta[]
}

export interface ChapterMeta {
  number: string               // '01'
  title: string
  description: string
  section: string               // 系列内分类 '基础篇'
  slug: string                 // 'basic-types'（markdown 文件名）
}

export interface TutorialCategoryInfo {
  id: TutorialCategory
  label: string                // '前端'
  icon: string
  description: string
}
```

### 2. Markdown 教程系统

**目录结构：**
```
src/
  content/                     # 教程内容目录
    tutorials/
      typescript/
        01-basic-types.md
        02-array-tuple.md
        ...
      vue/
        01-intro.md
        ...
  components/
    MarkdownRenderer.vue       # 通用 Markdown 渲染组件
  utils/
    markdown.ts                # Markdown 解析工具
```

**Markdown 文件格式：**
- 标准 Markdown 语法
- 支持 frontmatter（YAML 头部）存元数据
- 代码块支持 ```typescript、```vue 等语言标记
- 支持自定义容器：::: tip、::: warning

**MarkdownRenderer.vue：**
- 使用 markdown-it 解析 Markdown
- 支持代码高亮（highlight.js）
- 自动生成目录锚点
- 应用 doc-styles.css 的样式

### 3. 动态路由

**文件：`src/router/index.ts`**

```typescript
routes: [
  { path: '/', component: HomePage },
  { path: '/tutorials', component: TutorialIndex },
  { path: '/tutorials/:seriesId', component: SeriesIndex },
  { path: '/tutorials/:seriesId/:chapterSlug', component: ChapterView },
  { path: '/life', component: LifeIndex },        // 个人生活记录
  { path: '/todo', component: TodoIndex },        // 待办事项
]
```

**ChapterView.vue：**
- 根据 :seriesId 和 :chapterSlug 动态加载对应 .md 文件
- 使用 Vite 的 `import.meta.glob` 懒加载 markdown 文件
- 渲染到 MarkdownRenderer 组件

### 4. 首页设计

**文件：`src/views/HomePage.vue`**

**页面结构：**
1. **Hero 区域** - 个人品牌 + 简介
2. **全栈教程入口** - 5 个分类卡片（前端、后端、操作系统、网络、运维）
3. **其他功能入口** - 个人生活记录、待办事项
4. **最近更新** - 展示最新教程
5. **页脚**

### 5. 7 种主题系统

**文件：`src/assets/themes.css`**

主题列表：
1. **浅色（light）** - Apple 风格，白底蓝强调
2. **深色（dark）** - Apple 深色，黑底亮蓝
3. **海洋蓝（ocean）** - 深蓝背景，青色强调
4. **森林绿（forest）** - 深绿背景，翠绿强调
5. **紫罗兰（violet）** - 深紫背景，紫色强调
6. **暮光橙（sunset）** - 暖色调，橙色强调
7. **玫瑰粉（rose）** - 粉色调，玫瑰强调

每个主题保持 Apple 设计语言：大圆角、多层阴影、毛玻璃效果。

## 实施步骤

### Phase 1: 依赖安装
- 安装 `markdown-it`、`@types/markdown-it`
- 安装 `highlight.js` 用于代码高亮
- 安装 `gray-matter` 用于解析 frontmatter

### Phase 2: 主题系统扩展
1. 重写 `src/assets/themes.css`
   - 添加 7 个主题的 CSS 变量
2. 更新 `src/composables/useTheme.ts`
   - 扩展 ThemeName 类型
   - 扩展 themes 列表

### Phase 3: Markdown 教程系统
1. 创建 `src/utils/markdown.ts`
   - 配置 markdown-it 实例
   - 配置代码高亮
   - 添加自定义容器语法
2. 创建 `src/components/MarkdownRenderer.vue`
   - 接收 markdown 内容
   - 解析并渲染
   - 自动生成目录
3. 创建 `src/content/tutorials/` 目录结构

### Phase 4: 教程数据重构
1. 创建 `src/data/tutorial-series.ts`
   - 定义教程系列接口
   - 创建分类信息
   - 迁移 TypeScript 教程数据
2. 创建 `src/data/life.ts`、`src/data/todo.ts`（占位）

### Phase 5: 迁移现有 TypeScript 教程到 Markdown
1. 将 12 个 Tut*.vue 的内容转为 .md 文件
   - 保留代码示例（改为代码块）
   - 保留运行结果（作为文本展示）
   - 使用 frontmatter 存元数据
2. 文件位置：`src/content/tutorials/typescript/01-basic-types.md` 等

### Phase 6: 视图组件开发
1. 重写 `src/views/HomePage.vue` - 门户首页
2. 重写 `src/views/TutorialIndex.vue` - 教程总索引（按分类显示系列）
3. 新建 `src/views/SeriesIndex.vue` - 单个系列索引
4. 新建 `src/views/ChapterView.vue` - 章节内容页（动态加载 markdown）

### Phase 7: 布局与导航重构
1. 更新 `src/layouts/TutorialLayout.vue` - 适配动态路由
2. 更新 `src/components/TutorialSidebar.vue` - 支持多系列导航
3. 更新 `src/components/TableOfContents.vue` - 从 markdown 标题提取
4. 更新 `src/components/TutorialNavFooter.vue` - 适配新数据结构
5. 更新 `src/components/TutorialNavFooter.vue` - 使用主题变量

### Phase 8: 路由更新
1. 重写 `src/router/index.ts` - 动态路由配置

### Phase 9: 样式与个人模块
1. 更新 `src/assets/doc-styles.css` - 添加 markdown 渲染样式
2. 创建 `src/views/LifeIndex.vue` - 个人生活记录页（占位）
3. 创建 `src/views/TodoIndex.vue` - 待办事项页（基础实现）

### Phase 10: 清理与验证
1. 删除旧的 `src/views/tutorials/Tut01~12.vue`
2. 删除旧的 `src/views/HomeView.vue`、`src/views/AboutView.vue`
3. 删除 `src/components/HelloWorld.vue`
4. 构建验证
5. 浏览器测试

## 文件变更清单

### 新增文件
- `src/utils/markdown.ts` - Markdown 解析工具
- `src/components/MarkdownRenderer.vue` - Markdown 渲染组件
- `src/data/tutorial-series.ts` - 教程系列数据
- `src/content/tutorials/typescript/*.md` - 12 个 markdown 教程文件
- `src/views/SeriesIndex.vue` - 系列索引页
- `src/views/ChapterView.vue` - 章节内容页
- `src/views/LifeIndex.vue` - 个人生活记录页
- `src/views/TodoIndex.vue` - 待办事项页

### 修改文件
- `src/assets/themes.css` - 扩展为 7 个主题
- `src/composables/useTheme.ts` - 扩展主题列表
- `src/router/index.ts` - 动态路由
- `src/views/HomePage.vue` - 门户首页
- `src/views/TutorialIndex.vue` - 教程总索引
- `src/layouts/TutorialLayout.vue` - 适配动态路由
- `src/components/TutorialSidebar.vue` - 多系列导航
- `src/components/TableOfContents.vue` - markdown 标题提取
- `src/components/TutorialNavFooter.vue` - 新数据结构
- `src/assets/doc-styles.css` - markdown 样式
- `src/App.vue` - 适配新路由

### 删除文件
- `src/views/tutorials/Tut01~12.vue`（12 个）
- `src/views/HomeView.vue`
- `src/views/AboutView.vue`
- `src/components/HelloWorld.vue`
- `src/data/tutorials.ts`（被 tutorial-series.ts 替代）

## 关键技术决策

1. **Markdown 解析**：使用 markdown-it（轻量、可扩展）
2. **代码高亮**：使用 highlight.js
3. **Frontmatter**：使用 gray-matter 解析 YAML 头部
4. **动态加载**：使用 Vite 的 `import.meta.glob` 懒加载 .md 文件
5. **路由策略**：动态参数路由 `/tutorials/:seriesId/:chapterSlug`

## 迁移策略

将现有 12 个 TypeScript 教程的 .vue 内容转为 .md 格式：
- `<h1>` → `# 标题`
- `<p class="desc">` → frontmatter 中的 description
- `<div class="section"><h2>` → `## 标题`
- `<pre><code>` → ` ```typescript 代码块 `
- `<div class="result-card">` → 普通列表或表格
- `<table class="compare-table">` → Markdown 表格
- `<div class="tip">` → `::: tip 提示内容 :::`

## 验收标准
- [ ] 首页展示全栈教程分类（5 类）+ 生活记录 + 待办入口
- [ ] 教程通过 markdown 文件驱动，新增教程只需加 .md 文件
- [ ] 动态路由 /tutorials/:seriesId/:chapterSlug 正常工作
- [ ] 7 种主题可切换，配色精致
- [ ] 现有 12 个 TypeScript 教程成功迁移为 markdown
- [ ] 代码高亮正常显示
- [ ] 侧边栏按系列+分类显示
- [ ] 目录自动从 markdown 标题生成
- [ ] 上下章导航正常
- [ ] 构建无错误
- [ ] 响应式正常

## 注意事项
- 保留现有 Apple 风格设计语言（大圆角、毛玻璃、多层阴影）
- Markdown 渲染样式需与现有 doc-styles.css 保持一致
- 个人生活记录和待办功能先做基础占位，后续可扩展
- 主题切换组件保持下拉设计
