export type { TutorialCategory, ChapterMeta, TutorialSeries, TutorialCategoryInfo } from './types'
export { tutorialCategories } from './categories'
export { getChapter, getAdjacentChapters, getSeriesSections } from './utils'

import type { TutorialSeries, TutorialCategory } from './types'
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
