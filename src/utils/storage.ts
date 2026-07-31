/**
 * 工作台数据存储工具
 * 统一管理所有模块的 localStorage 数据
 */

import type { Todo, Habit, Expense, Goal, Favorite, UserSettings } from '../types/workspace'

const STORAGE_KEYS = {
  TODOS: 'workspace-todos',
  HABITS: 'workspace-habits',
  EXPENSES: 'workspace-expenses',
  GOALS: 'workspace-goals',
  FAVORITES: 'workspace-favorites',
  SETTINGS: 'workspace-settings',
  MODULES: 'workspace-modules',
}

// 待办事项
export function getTodos(): Todo[] {
  const data = localStorage.getItem(STORAGE_KEYS.TODOS)
  return data ? JSON.parse(data) : []
}

export function saveTodos(todos: Todo[]): void {
  localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos))
}

// 习惯
export function getHabits(): Habit[] {
  const data = localStorage.getItem(STORAGE_KEYS.HABITS)
  return data ? JSON.parse(data) : []
}

export function saveHabits(habits: Habit[]): void {
  localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits))
}

// 记账
export function getExpenses(): Expense[] {
  const data = localStorage.getItem(STORAGE_KEYS.EXPENSES)
  return data ? JSON.parse(data) : []
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses))
}

// 目标
export function getGoals(): Goal[] {
  const data = localStorage.getItem(STORAGE_KEYS.GOALS)
  return data ? JSON.parse(data) : []
}

export function saveGoals(goals: Goal[]): void {
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals))
}

// 收藏夹
export function getFavorites(): Favorite[] {
  const data = localStorage.getItem(STORAGE_KEYS.FAVORITES)
  return data ? JSON.parse(data) : []
}

export function saveFavorites(favorites: Favorite[]): void {
  localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites))
}

// 设置
export function getSettings(): UserSettings {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS)
  return data
    ? JSON.parse(data)
    : {
        aiConfig: {
          provider: 'openai',
          apiUrl: 'https://api.openai.com/v1',
          apiKey: '',
          model: 'gpt-3.5-turbo',
        },
        nickname: '',
      }
}

export function saveSettings(settings: UserSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
}

// 导出所有数据
export function exportAllData(): object {
  return {
    todos: getTodos(),
    habits: getHabits(),
    expenses: getExpenses(),
    goals: getGoals(),
    favorites: getFavorites(),
    settings: getSettings(),
    exportDate: new Date().toISOString(),
  }
}

// 导入所有数据
export function importAllData(data: any): void {
  if (data.todos) saveTodos(data.todos)
  if (data.habits) saveHabits(data.habits)
  if (data.expenses) saveExpenses(data.expenses)
  if (data.goals) saveGoals(data.goals)
  if (data.favorites) saveFavorites(data.favorites)
  if (data.settings) saveSettings(data.settings)
}

// 清除所有数据
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key)
  })
}

// 获取存储统计
export function getStorageStats(): {
  todos: number
  habits: number
  expenses: number
  goals: number
  favorites: number
} {
  return {
    todos: getTodos().length,
    habits: getHabits().length,
    expenses: getExpenses().length,
    goals: getGoals().length,
    favorites: getFavorites().length,
  }
}
