import type { TutorialSeries, ChapterMeta } from './types'

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
