export type TutorialCategory = 'frontend' | 'backend' | 'mobile' | 'database' | 'cs-fundamentals' | 'ai' | 'cloud-native' | 'devops' | 'more'

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
  chapters: ChapterMeta[]
  featured?: boolean
}

export interface TutorialCategoryInfo {
  id: TutorialCategory
  label: string
  description: string
}
