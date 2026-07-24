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
