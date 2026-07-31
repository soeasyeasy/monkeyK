/**
 * 记账管理 Composable
 * 负责管理记账记录、预算设置、统计分析等
 */
import { ref, computed } from 'vue'
import type { Expense, Budget } from '../types/workspace'

const STORAGE_KEY = 'workspace-accounting'
const BUDGET_KEY = 'workspace-budget'

function loadExpenses(): Expense[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load expenses:', e)
  }
  return []
}

function saveExpenses(expenses: Expense[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
  } catch (e) {
    console.error('Failed to save expenses:', e)
  }
}

function loadBudget(): Budget {
  try {
    const saved = localStorage.getItem(BUDGET_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load budget:', e)
  }
  return {
    monthly: 0,
    categoryBudgets: {}
  }
}

function saveBudget(budget: Budget) {
  try {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budget))
  } catch (e) {
    console.error('Failed to save budget:', e)
  }
}

// 获取当前月份字符串 YYYY-MM
function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// 获取指定月份字符串
function getMonthString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function useAccounting() {
  const expenses = ref<Expense[]>(loadExpenses())
  const budget = ref<Budget>(loadBudget())

  // 添加记账记录
  function addExpense(amount: number, category: string, description: string = '', date?: string) {
    const newExpense: Expense = {
      id: Date.now(),
      amount,
      category,
      description,
      date: date || (new Date().toISOString().split('T')[0] ?? ''),
      createdAt: Date.now()
    }
    expenses.value.push(newExpense)
    saveExpenses(expenses.value)
  }

  // 删除记账记录
  function deleteExpense(id: number) {
    expenses.value = expenses.value.filter(e => e.id !== id)
    saveExpenses(expenses.value)
  }

  // 更新预算
  function updateBudget(monthly: number, categoryBudgets: Record<string, number> = {}) {
    budget.value = { monthly, categoryBudgets }
    saveBudget(budget.value)
  }

  // 获取本月支出
  function getCurrentMonthExpenses(): Expense[] {
    const currentMonth = getCurrentMonth()
    return expenses.value.filter(e => e.date.startsWith(currentMonth))
  }

  // 获取本月总支出
  function getCurrentMonthTotal(): number {
    return getCurrentMonthExpenses().reduce((sum, e) => sum + e.amount, 0)
  }

  // 获取本月分类统计
  function getCurrentMonthByCategory(): Record<string, number> {
    const currentMonthExpenses = getCurrentMonthExpenses()
    const result: Record<string, number> = {}
    
    currentMonthExpenses.forEach(e => {
      if (!result[e.category]) {
        result[e.category] = 0
      }
      result[e.category]! += e.amount
    })
    
    return result
  }

  // 获取指定月份支出
  function getMonthExpenses(month: string): Expense[] {
    return expenses.value.filter(e => e.date.startsWith(month))
  }

  // 获取指定月份总支出
  function getMonthTotal(month: string): number {
    return getMonthExpenses(month).reduce((sum, e) => sum + e.amount, 0)
  }

  // 获取预算使用进度
  function getBudgetProgress(): { spent: number; budget: number; percentage: number } {
    const spent = getCurrentMonthTotal()
    const budgetAmount = budget.value.monthly
    const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0
    
    return {
      spent,
      budget: budgetAmount,
      percentage: Math.min(percentage, 100)
    }
  }

  // 获取分类预算使用进度
  function getCategoryBudgetProgress(category: string): { spent: number; budget: number; percentage: number } {
    const categoryExpenses = getCurrentMonthExpenses().filter(e => e.category === category)
    const spent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0)
    const budgetAmount = budget.value.categoryBudgets[category] || 0
    const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0
    
    return {
      spent,
      budget: budgetAmount,
      percentage: Math.min(percentage, 100)
    }
  }

  // 获取最近 N 天的支出
  function getRecentExpenses(days: number = 7): Expense[] {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    return expenses.value
      .filter(e => new Date(e.date) >= cutoff)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  // 获取最近 N 天每天的总支出（用于迷你柱状图）
  function getRecentDailyTotal(days: number = 7): { date: string; amount: number }[] {
    const result: { date: string; amount: number }[] = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0] ?? ''
      const amount = expenses.value
        .filter(e => e.date === dateStr)
        .reduce((sum, e) => sum + e.amount, 0)
      result.push({ date: dateStr, amount })
    }

    return result
  }

  // 获取上月总支出
  function getLastMonthTotal(): number {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const monthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`
    return getMonthTotal(monthStr)
  }

  // 获取本月 vs 上月对比
  function getMonthComparison(): {
    current: number
    last: number
    diff: number
    percentage: number
  } {
    const current = getCurrentMonthTotal()
    const last = getLastMonthTotal()
    const diff = current - last
    const percentage = last > 0 ? Math.round((diff / last) * 100) : 0
    return { current, last, diff, percentage }
  }

  // 搜索支出记录
  function searchExpenses(keyword: string, category: string = ''): Expense[] {
    let result = [...expenses.value]

    if (category) {
      result = result.filter(e => e.category === category)
    }

    if (keyword.trim()) {
      const lower = keyword.toLowerCase()
      result = result.filter(
        e =>
          e.description.toLowerCase().includes(lower) ||
          e.category.toLowerCase().includes(lower)
      )
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  // 获取超预算的分类
  function getOverBudgetCategories(): { category: string; spent: number; budget: number; percentage: number }[] {
    const result: { category: string; spent: number; budget: number; percentage: number }[] = []
    Object.entries(budget.value.categoryBudgets).forEach(([category, budgetAmount]) => {
      if (!budgetAmount) return
      const spent = getCurrentMonthExpenses()
        .filter(e => e.category === category)
        .reduce((sum, e) => sum + e.amount, 0)
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0
      if (percentage >= 100) {
        result.push({ category, spent, budget: budgetAmount, percentage })
      }
    })
    return result.sort((a, b) => b.percentage - a.percentage)
  }

  // 获取所有分类（去重）
  function getAllCategories(): string[] {
    const categories = new Set(expenses.value.map(e => e.category))
    return Array.from(categories)
  }

  return {
    expenses,
    budget,
    addExpense,
    deleteExpense,
    updateBudget,
    getCurrentMonthExpenses,
    getCurrentMonthTotal,
    getCurrentMonthByCategory,
    getMonthExpenses,
    getMonthTotal,
    getBudgetProgress,
    getCategoryBudgetProgress,
    getRecentExpenses,
    getRecentDailyTotal,
    getLastMonthTotal,
    getMonthComparison,
    searchExpenses,
    getOverBudgetCategories,
    getAllCategories
  }
}
