export type { TutorialCategory, TutorialSubcategory, ChapterMeta, TutorialSeries, TutorialCategoryInfo, TutorialSubcategoryInfo } from './types'
export { tutorialCategories } from './categories'
export { tutorialSubcategories } from './subcategories'
export { getChapter, getAdjacentChapters, getSeriesSections } from './utils'

import type { TutorialSeries, TutorialCategory, TutorialSubcategory } from './types'
import { frontendSeries } from './series/frontend'
import { backendSeries } from './series/backend'
import { databaseSeries } from './series/database'
import { csFundamentalsSeries } from './series/cs-fundamentals'
import { aiSeries } from './series/ai'
import { cloudNativeSeries } from './series/cloud-native'
import { devopsSeries } from './series/devops'
import { mobileSeries } from './series/mobile'

export const tutorialSeries: TutorialSeries[] = [
  ...frontendSeries,
  ...backendSeries,
  ...databaseSeries,
  ...csFundamentalsSeries,
  ...aiSeries,
  ...cloudNativeSeries,
  ...devopsSeries,
  ...mobileSeries,
]

export function getSeriesById(id: string): TutorialSeries | undefined {
  return tutorialSeries.find((s) => s.id === id)
}

export function getSeriesByCategory(category: TutorialCategory): TutorialSeries[] {
  return tutorialSeries.filter((s) => s.category === category)
}

export function getSeriesBySubcategory(subcategory: TutorialSubcategory): TutorialSeries[] {
  return tutorialSeries.filter((s) => s.subcategory === subcategory)
}
