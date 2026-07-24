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
