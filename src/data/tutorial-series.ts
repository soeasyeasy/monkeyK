export type TutorialCategory = 'frontend' | 'backend' | 'system' | 'network' | 'devops'

export interface ChapterMeta {
  number: string
  title: string
  description: string
  section: string
  slug: string
}

export interface TutorialSeries {
  id: string
  title: string
  description: string
  category: TutorialCategory
  chapters: ChapterMeta[]
}

export interface TutorialCategoryInfo {
  id: TutorialCategory
  label: string
  description: string
}

export const tutorialCategories: TutorialCategoryInfo[] = [
  { id: 'frontend', label: '前端', description: '前端开发技术教程' },
  { id: 'backend', label: '后端', description: '后端开发技术教程' },
  { id: 'system', label: '操作系统', description: '操作系统相关教程' },
  { id: 'network', label: '网络', description: '网络协议与架构教程' },
  { id: 'devops', label: '运维', description: 'DevOps 与运维教程' },
]

export const tutorialSeries: TutorialSeries[] = [
  {
    id: 'html',
    title: 'HTML 基础到精通',
    description: '从零开始学习 HTML，构建语义化的网页结构',
    category: 'frontend',
    chapters: [
      {
        number: '01',
        title: 'HTML 简介',
        description: '什么是 HTML，Web 的基础',
        section: '基础篇',
        slug: 'introduction',
      },
      {
        number: '02',
        title: '文档结构',
        description: 'DOCTYPE、html、head、body',
        section: '基础篇',
        slug: 'document-structure',
      },
      {
        number: '03',
        title: '文本标签',
        description: '标题、段落、强调、引用',
        section: '基础篇',
        slug: 'text-elements',
      },
      {
        number: '04',
        title: '链接与图片',
        description: '超链接、锚点、图片插入',
        section: '基础篇',
        slug: 'links-images',
      },
      {
        number: '05',
        title: '列表',
        description: '无序列表、有序列表、定义列表',
        section: '基础篇',
        slug: 'lists',
      },
      {
        number: '06',
        title: '表格',
        description: '表格结构、表头、合并单元格',
        section: '基础篇',
        slug: 'tables',
      },
      {
        number: '07',
        title: '表单基础',
        description: 'input、textarea、button、label',
        section: '进阶篇',
        slug: 'forms-basics',
      },
      {
        number: '08',
        title: '表单进阶',
        description: '表单验证、fieldset、datalist',
        section: '进阶篇',
        slug: 'forms-advanced',
      },
      {
        number: '09',
        title: '语义化标签',
        description: 'header、nav、main、article、section、footer',
        section: '进阶篇',
        slug: 'semantic-elements',
      },
      {
        number: '10',
        title: '多媒体',
        description: 'audio、video、picture、source',
        section: '进阶篇',
        slug: 'multimedia',
      },
      {
        number: '11',
        title: '元数据与 SEO',
        description: 'meta、Open Graph、结构化数据',
        section: '实战篇',
        slug: 'metadata-seo',
      },
      {
        number: '12',
        title: '无障碍访问',
        description: 'ARIA 属性、可访问性最佳实践',
        section: '实战篇',
        slug: 'accessibility',
      },
    ],
  },
  {
    id: 'css',
    title: 'CSS 完全指南',
    description: '从基础样式到现代布局，掌握 CSS 核心技术',
    category: 'frontend',
    chapters: [
      {
        number: '01',
        title: 'CSS 简介',
        description: '什么是 CSS，样式表基础概念',
        section: '基础篇',
        slug: 'introduction',
      },
      {
        number: '02',
        title: '选择器',
        description: '元素、类、ID、属性选择器',
        section: '基础篇',
        slug: 'selectors',
      },
      {
        number: '03',
        title: '盒模型',
        description: 'content、padding、border、margin',
        section: '基础篇',
        slug: 'box-model',
      },
      {
        number: '04',
        title: '文本与字体',
        description: 'font-family、text-align、line-height',
        section: '基础篇',
        slug: 'text-fonts',
      },
      {
        number: '05',
        title: '颜色与背景',
        description: '颜色值、渐变、背景图片',
        section: '基础篇',
        slug: 'colors-backgrounds',
      },
      {
        number: '06',
        title: 'Flexbox 布局',
        description: '弹性盒子、主轴、交叉轴',
        section: '进阶篇',
        slug: 'flexbox',
      },
      {
        number: '07',
        title: 'Grid 布局',
        description: '网格容器、行列定义、区域划分',
        section: '进阶篇',
        slug: 'grid',
      },
      {
        number: '08',
        title: '定位',
        description: 'static、relative、absolute、fixed、sticky',
        section: '进阶篇',
        slug: 'positioning',
      },
      {
        number: '09',
        title: '响应式设计',
        description: '媒体查询、移动优先、断点设计',
        section: '进阶篇',
        slug: 'responsive-design',
      },
      {
        number: '10',
        title: '过渡与动画',
        description: 'transition、animation、keyframes',
        section: '实战篇',
        slug: 'transitions-animations',
      },
      {
        number: '11',
        title: 'CSS 变量',
        description: '自定义属性、作用域、动态主题',
        section: '实战篇',
        slug: 'css-variables',
      },
      {
        number: '12',
        title: '现代 CSS 特性',
        description: '容器查询、层叠层、嵌套规则',
        section: '实战篇',
        slug: 'modern-css',
      },
    ],
  },
  {
    id: 'javascript',
    title: 'JavaScript 核心教程',
    description: '掌握 JavaScript 核心概念，从入门到实战',
    category: 'frontend',
    chapters: [
      {
        number: '01',
        title: '变量与数据类型',
        description: 'let、const、var 与基本数据类型',
        section: '基础篇',
        slug: 'variables-types',
      },
      {
        number: '02',
        title: '运算符',
        description: '算术、比较、逻辑、三元运算符',
        section: '基础篇',
        slug: 'operators',
      },
      {
        number: '03',
        title: '条件语句',
        description: 'if、else、switch、三元表达式',
        section: '基础篇',
        slug: 'conditionals',
      },
      {
        number: '04',
        title: '循环',
        description: 'for、while、do-while、for...of',
        section: '基础篇',
        slug: 'loops',
      },
      {
        number: '05',
        title: '函数',
        description: '函数声明、箭头函数、参数',
        section: '基础篇',
        slug: 'functions',
      },
      {
        number: '06',
        title: '数组',
        description: '数组方法、解构、展开运算符',
        section: '进阶篇',
        slug: 'arrays',
      },
      {
        number: '07',
        title: '对象',
        description: '对象字面量、this、解构赋值',
        section: '进阶篇',
        slug: 'objects',
      },
      {
        number: '08',
        title: 'DOM 操作',
        description: '选择元素、修改内容、创建节点',
        section: '进阶篇',
        slug: 'dom-manipulation',
      },
      {
        number: '09',
        title: '事件处理',
        description: '事件监听、事件冒泡、事件委托',
        section: '进阶篇',
        slug: 'event-handling',
      },
      {
        number: '10',
        title: '异步编程',
        description: '回调、Promise、async/await',
        section: '实战篇',
        slug: 'async-programming',
      },
      {
        number: '11',
        title: 'Fetch API',
        description: '网络请求、响应处理、错误处理',
        section: '实战篇',
        slug: 'fetch-api',
      },
      {
        number: '12',
        title: '模块化开发',
        description: 'ES Modules、import、export',
        section: '实战篇',
        slug: 'modules',
      },
    ],
  },
  {
    id: 'typescript',
    title: 'TypeScript 从零到精通',
    description: '一套完整的 TypeScript 教程，从基础到实战',
    category: 'frontend',
    chapters: [
      {
        number: '01',
        title: '基础类型',
        description: 'string, number, boolean 等基础类型',
        section: '基础篇',
        slug: 'basic-types',
      },
      {
        number: '02',
        title: '数组与元组',
        description: '数组类型、元组、只读元组',
        section: '基础篇',
        slug: 'array-tuple',
      },
      {
        number: '03',
        title: '对象与接口',
        description: 'interface 定义、可选属性、继承',
        section: '基础篇',
        slug: 'object-interface',
      },
      {
        number: '04',
        title: '类型别名与联合类型',
        description: 'type、联合类型、交叉类型',
        section: '基础篇',
        slug: 'type-alias-union',
      },
      {
        number: '05',
        title: '函数类型',
        description: '参数类型、重载、高阶函数',
        section: '基础篇',
        slug: 'function',
      },
      {
        number: '06',
        title: '类与面向对象',
        description: 'class、访问修饰符、抽象类',
        section: '进阶篇',
        slug: 'class',
      },
      {
        number: '07',
        title: '泛型',
        description: '泛型函数、接口、约束',
        section: '进阶篇',
        slug: 'generics',
      },
      {
        number: '08',
        title: '枚举',
        description: '数字枚举、字符串枚举、反向映射',
        section: '进阶篇',
        slug: 'enum',
      },
      {
        number: '09',
        title: '类型断言与类型收窄',
        description: 'as、typeof、instanceof、satisfies',
        section: '进阶篇',
        slug: 'type-assertion',
      },
      {
        number: '10',
        title: '高级类型',
        description: 'keyof、条件类型、映射类型',
        section: '进阶篇',
        slug: 'advanced-types',
      },
      {
        number: '11',
        title: '工具类型实战',
        description: 'Partial、Pick、Omit、Record 等',
        section: '实战篇',
        slug: 'utility-types',
      },
      {
        number: '12',
        title: 'Vue 中的 TypeScript',
        description: 'ref<T>、defineProps、API 类型',
        section: '实战篇',
        slug: 'vue-with-ts',
      },
    ],
  },
  {
    id: 'vue2',
    title: 'Vue 2 经典教程',
    description: '系统学习 Vue 2 选项式 API 与生态，理解 Vue 演进历程',
    category: 'frontend',
    chapters: [
      {
        number: '01',
        title: 'Vue 2 简介与环境搭建',
        description: 'Vue 实例、Vue CLI 项目初始化',
        section: '基础篇',
        slug: 'introduction',
      },
      {
        number: '02',
        title: '模板语法',
        description: '插值、指令、过滤器',
        section: '基础篇',
        slug: 'template-syntax',
      },
      {
        number: '03',
        title: '计算属性与侦听器',
        description: 'computed、watch、深度侦听',
        section: '基础篇',
        slug: 'computed-watchers',
      },
      {
        number: '04',
        title: '条件渲染与列表渲染',
        description: 'v-if、v-show、v-for 及 key',
        section: '基础篇',
        slug: 'conditional-list-rendering',
      },
      {
        number: '05',
        title: '事件处理',
        description: 'v-on、事件修饰符、按键修饰符',
        section: '基础篇',
        slug: 'event-handling',
      },
      {
        number: '06',
        title: '表单输入绑定',
        description: 'v-model 修饰符与各类表单控件',
        section: '基础篇',
        slug: 'form-input-bindings',
      },
      {
        number: '07',
        title: '组件基础',
        description: '组件注册、Props、自定义事件',
        section: '进阶篇',
        slug: 'components-basics',
      },
      {
        number: '08',
        title: '组件通信',
        description: 'Props/Emit、provide/inject、EventBus',
        section: '进阶篇',
        slug: 'component-communication',
      },
      {
        number: '09',
        title: '插槽',
        description: '默认插槽、具名插槽、作用域插槽',
        section: '进阶篇',
        slug: 'slots',
      },
      {
        number: '10',
        title: '生命周期',
        description: 'created、mounted、updated、destroyed',
        section: '进阶篇',
        slug: 'lifecycle',
      },
      {
        number: '11',
        title: '混入与自定义指令',
        description: 'mixins、自定义指令钩子',
        section: '进阶篇',
        slug: 'mixins-directives',
      },
      {
        number: '12',
        title: '渲染函数',
        description: 'render 函数、JSX、createElement',
        section: '进阶篇',
        slug: 'render-functions',
      },
      {
        number: '13',
        title: 'Vue Router',
        description: '路由配置、嵌套路由、导航守卫',
        section: '实战篇',
        slug: 'vue-router',
      },
      {
        number: '14',
        title: 'Vuex 状态管理',
        description: 'state、getters、mutations、actions',
        section: '实战篇',
        slug: 'vuex',
      },
      {
        number: '15',
        title: '过渡与动画',
        description: 'transition、transition-group、JavaScript 钩子',
        section: '实战篇',
        slug: 'transitions-animations',
      },
      {
        number: '16',
        title: 'Vue 2 到 Vue 3 迁移指南',
        description: '破坏性变更、Composition API 迁移',
        section: '实战篇',
        slug: 'migration-guide',
      },
    ],
  },
  {
    id: 'vue3',
    title: 'Vue 3 完全指南',
    description: '深入掌握 Vue 3 组合式 API 与核心特性，构建现代前端应用',
    category: 'frontend',
    chapters: [
      {
        number: '01',
        title: 'Vue 3 简介与项目创建',
        description: 'Vue 3 新特性概览、Vite 项目搭建',
        section: '基础篇',
        slug: 'introduction',
      },
      {
        number: '02',
        title: '模板语法',
        description: '插值、指令、绑定表达式',
        section: '基础篇',
        slug: 'template-syntax',
      },
      {
        number: '03',
        title: '响应式基础',
        description: 'ref、reactive、computed',
        section: '基础篇',
        slug: 'reactivity-basics',
      },
      {
        number: '04',
        title: '条件渲染与列表渲染',
        description: 'v-if、v-show、v-for 及 key 的作用',
        section: '基础篇',
        slug: 'conditional-list-rendering',
      },
      {
        number: '05',
        title: '事件处理',
        description: '事件绑定、修饰符、事件对象',
        section: '基础篇',
        slug: 'event-handling',
      },
      {
        number: '06',
        title: '表单输入绑定',
        description: 'v-model 在各类表单元素中的使用',
        section: '基础篇',
        slug: 'form-input-bindings',
      },
      {
        number: '07',
        title: '组合式 API',
        description: 'setup 语法糖、响应式状态组织',
        section: '进阶篇',
        slug: 'composition-api',
      },
      {
        number: '08',
        title: '组件基础',
        description: '组件注册、Props、Emits',
        section: '进阶篇',
        slug: 'components-basics',
      },
      {
        number: '09',
        title: '生命周期',
        description: 'onMounted、onUpdated、onUnmounted',
        section: '进阶篇',
        slug: 'lifecycle',
      },
      {
        number: '10',
        title: '侦听器',
        description: 'watch、watchEffect 与深度侦听',
        section: '进阶篇',
        slug: 'watchers',
      },
      {
        number: '11',
        title: '插槽与动态组件',
        description: '默认插槽、具名插槽、作用域插槽、keep-alive',
        section: '进阶篇',
        slug: 'slots-dynamic-components',
      },
      {
        number: '12',
        title: '自定义 Hooks',
        description: '封装可复用的组合式函数',
        section: '进阶篇',
        slug: 'custom-composables',
      },
      {
        number: '13',
        title: 'Vue Router',
        description: '路由配置、导航守卫、动态路由',
        section: '实战篇',
        slug: 'vue-router',
      },
      {
        number: '14',
        title: 'Pinia 状态管理',
        description: 'Store 定义、状态派生、插件机制',
        section: '实战篇',
        slug: 'pinia',
      },
      {
        number: '15',
        title: 'Teleport 与 Suspense',
        description: '传送门、异步组件处理',
        section: '实战篇',
        slug: 'teleport-suspense',
      },
      {
        number: '16',
        title: '性能优化与最佳实践',
        description: '懒加载、虚拟列表、响应式优化',
        section: '实战篇',
        slug: 'performance',
      },
    ],
  },
]

export function getSeriesById(id: string): TutorialSeries | undefined {
  return tutorialSeries.find((s) => s.id === id)
}

export function getSeriesByCategory(category: TutorialCategory): TutorialSeries[] {
  return tutorialSeries.filter((s) => s.category === category)
}

export function getChapter(series: TutorialSeries, slug: string): ChapterMeta | undefined {
  return series.chapters.find((c) => c.slug === slug)
}

export function getAdjacentChapters(
  series: TutorialSeries,
  slug: string,
): {
  prev?: ChapterMeta
  next?: ChapterMeta
} {
  const index = series.chapters.findIndex((c) => c.slug === slug)
  if (index === -1) return {}
  return {
    prev: index > 0 ? series.chapters[index - 1] : undefined,
    next: index < series.chapters.length - 1 ? series.chapters[index + 1] : undefined,
  }
}

export function getSeriesSections(series: TutorialSeries): string[] {
  return [...new Set(series.chapters.map((c) => c.section))]
}
