/**
 * 收藏夹管理 Composable
 * 负责管理网址收藏、分类、跳转等
 */
import { ref, computed } from 'vue'
import type { Favorite } from '../types/workspace'
import { getFavorites, saveFavorites } from '../utils/storage'

const STORAGE_KEY = 'workspace-favorites'
const CATEGORIES_KEY = 'workspace-favorite-categories'

function migrateFavorite(favorite: any): Favorite {
  return {
    id: favorite.id ?? Date.now(),
    title: favorite.title ?? '',
    url: favorite.url ?? '',
    category: favorite.category ?? '未分类',
    createdAt: favorite.createdAt ?? Date.now(),
  }
}

function loadFavorites(): Favorite[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as any[]
      return parsed.map(migrateFavorite)
    }
    const legacy = getFavorites()
    if (legacy.length) return legacy
  } catch (e) {
    console.error('Failed to load favorites:', e)
  }
  return []
}

function persistFavorites(favorites: Favorite[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    saveFavorites(favorites)
  } catch (e) {
    console.error('Failed to save favorites:', e)
  }
}

function loadCategories(): string[] {
  try {
    const saved = localStorage.getItem(CATEGORIES_KEY)
    if (saved) {
      return JSON.parse(saved) as string[]
    }
  } catch (e) {
    console.error('Failed to load favorite categories:', e)
  }
  return []
}

function persistCategories(categories: string[]) {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
  } catch (e) {
    console.error('Failed to save favorite categories:', e)
  }
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function useFavorites() {
  const favorites = ref<Favorite[]>(loadFavorites())
  const customCategories = ref<string[]>(loadCategories())

  const categories = computed(() => {
    const set = new Set(customCategories.value)
    favorites.value.forEach((f) => {
      if (f.category) set.add(f.category)
    })
    return Array.from(set).sort()
  })

  function ensureCategory(category: string) {
    const trimmed = category.trim()
    if (trimmed && !customCategories.value.includes(trimmed)) {
      customCategories.value.push(trimmed)
      persistCategories(customCategories.value)
    }
  }

  function addFavorite(title: string, url: string, category: string = '未分类') {
    const now = Date.now()
    const newFavorite: Favorite = {
      id: now,
      title: title.trim() || url.trim(),
      url: normalizeUrl(url),
      category: category.trim() || '未分类',
      createdAt: now,
    }
    favorites.value.push(newFavorite)
    ensureCategory(newFavorite.category)
    persistFavorites(favorites.value)
    return newFavorite.id
  }

  function deleteFavorite(id: number) {
    favorites.value = favorites.value.filter((f) => f.id !== id)
    persistFavorites(favorites.value)
  }

  function updateFavorite(id: number, updates: Partial<Omit<Favorite, 'id' | 'createdAt'>>) {
    favorites.value = favorites.value.map((f) => {
      if (f.id !== id) return f
      const next: Favorite = {
        ...f,
        title: updates.title?.trim() ?? f.title,
        url: updates.url !== undefined ? normalizeUrl(updates.url) : f.url,
        category: updates.category?.trim() || f.category,
      }
      return next
    })
    if (updates.category) ensureCategory(updates.category)
    persistFavorites(favorites.value)
  }

  function addCategory(name: string) {
    const trimmed = name.trim()
    if (trimmed && !customCategories.value.includes(trimmed)) {
      customCategories.value.push(trimmed)
      persistCategories(customCategories.value)
    }
  }

  function deleteCategory(name: string) {
    const trimmed = name.trim()
    customCategories.value = customCategories.value.filter((c) => c !== trimmed)
    favorites.value = favorites.value.map((f) =>
      f.category === trimmed ? { ...f, category: '未分类' } : f,
    )
    persistCategories(customCategories.value)
    persistFavorites(favorites.value)
  }

  function openUrl(url: string) {
    const normalized = normalizeUrl(url)
    if (normalized) {
      window.open(normalized, '_blank', 'noopener,noreferrer')
    }
  }

  function getFavoritesByCategory(category: string) {
    return favorites.value.filter((f) => f.category === category)
  }

  return {
    favorites,
    categories,
    customCategories,
    addFavorite,
    deleteFavorite,
    updateFavorite,
    addCategory,
    deleteCategory,
    openUrl,
    getFavoritesByCategory,
  }
}
