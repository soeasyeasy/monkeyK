export type TutorialCategory = 'frontend' | 'backend' | 'mobile' | 'database' | 'cs-fundamentals' | 'ai' | 'cloud-native' | 'devops' | 'more'

export type TutorialSubcategory =
  // 前端二级分类
  | 'web-basics' | 'vue' | 'frontend-tooling' | 'frontend-advanced'
  // 后端二级分类
  | 'java-basics' | 'spring' | 'jvm' | 'messaging' | 'orm'
  // 数据库二级分类
  | 'mysql' | 'redis' | 'nosql' | 'search-engine' | 'postgresql'
  // 计算机基础二级分类
  | 'web-fundamentals' | 'operating-system' | 'algorithms' | 'computer-network'
  // 人工智能二级分类
  | 'python-basics' | 'machine-learning' | 'deep-learning' | 'nlp-speech' | 'llm' | 'ai-engineering'
  // 云原生二级分类
  | 'container' | 'orchestration' | 'commands'
  // 运维二级分类
  | 'version-control' | 'system-ops'

export interface ChapterMeta {
  number: string
  title: string
  description: string
  section: string
  slug: string
  locked?: boolean
}

export interface TutorialSeries {
  id: string
  title: string
  description: string
  category: TutorialCategory
  subcategory: TutorialSubcategory
  chapters: ChapterMeta[]
  featured?: boolean
}

export interface TutorialCategoryInfo {
  id: TutorialCategory
  label: string
  description: string
}

export interface TutorialSubcategoryInfo {
  id: TutorialSubcategory
  label: string
  description: string
  parent: TutorialCategory
}
