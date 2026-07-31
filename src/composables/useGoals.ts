/**
 * 目标管理 Composable
 * 负责管理目标的添加、进度更新、统计等
 */
import { ref, computed } from 'vue'
import type { Goal, KeyResult } from '../types/workspace'

const STORAGE_KEY = 'workspace-goals'

function migrateGoal(goal: any): Goal {
  return {
    id: goal.id ?? Date.now(),
    title: goal.title ?? '',
    description: goal.description ?? '',
    type: goal.type ?? 'monthly',
    progress: goal.progress ?? 0,
    keyResults: Array.isArray(goal.keyResults) ? goal.keyResults : [],
    deadline: goal.deadline ?? '',
    createdAt: goal.createdAt ?? Date.now(),
    updatedAt: goal.updatedAt ?? goal.createdAt ?? Date.now()
  }
}

function loadGoals(): Goal[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as any[]
      return parsed.map(migrateGoal)
    }
  } catch (e) {
    console.error('Failed to load goals:', e)
  }
  return []
}

function saveGoals(goals: Goal[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
  } catch (e) {
    console.error('Failed to save goals:', e)
  }
}

export function useGoals() {
  const goals = ref<Goal[]>(loadGoals())

  // 添加目标
  function addGoal(
    title: string,
    description: string = '',
    type: 'yearly' | 'quarterly' | 'monthly' | 'weekly' = 'monthly',
    deadline: string = ''
  ) {
    const now = Date.now()
    const newGoal: Goal = {
      id: now,
      title,
      description,
      type,
      progress: 0,
      keyResults: [],
      deadline,
      createdAt: now,
      updatedAt: now
    }
    goals.value.push(newGoal)
    saveGoals(goals.value)
  }

  // 删除目标
  function deleteGoal(id: number) {
    goals.value = goals.value.filter(g => g.id !== id)
    saveGoals(goals.value)
  }

  // 更新目标进度
  function updateGoalProgress(id: number, progress: number) {
    const goal = goals.value.find(g => g.id === id)
    if (goal) {
      goal.progress = Math.max(0, Math.min(100, progress))
      goal.updatedAt = Date.now()
      saveGoals(goals.value)
    }
  }

  // 添加关键结果
  function addKeyResult(goalId: number, title: string) {
    const goal = goals.value.find(g => g.id === goalId)
    if (goal) {
      const newKR: KeyResult = {
        id: Date.now(),
        title,
        progress: 0
      }
      goal.keyResults.push(newKR)
      goal.updatedAt = Date.now()
      saveGoals(goals.value)
    }
  }

  // 更新关键结果进度
  function updateKeyResultProgress(goalId: number, krId: number, progress: number) {
    const goal = goals.value.find(g => g.id === goalId)
    if (goal) {
      const kr = goal.keyResults.find(k => k.id === krId)
      if (kr) {
        kr.progress = Math.max(0, Math.min(100, progress))
        goal.updatedAt = Date.now()
        // 自动计算目标整体进度
        updateGoalProgressFromKeyResults(goalId)
        saveGoals(goals.value)
      }
    }
  }

  // 删除关键结果
  function deleteKeyResult(goalId: number, krId: number) {
    const goal = goals.value.find(g => g.id === goalId)
    if (goal) {
      goal.keyResults = goal.keyResults.filter(k => k.id !== krId)
      goal.updatedAt = Date.now()
      updateGoalProgressFromKeyResults(goalId)
      saveGoals(goals.value)
    }
  }

  // 根据关键结果自动计算目标进度
  function updateGoalProgressFromKeyResults(goalId: number) {
    const goal = goals.value.find(g => g.id === goalId)
    if (goal && goal.keyResults.length > 0) {
      const avgProgress = goal.keyResults.reduce((sum, kr) => sum + kr.progress, 0) / goal.keyResults.length
      goal.progress = Math.round(avgProgress)
    }
  }

  // 获取进行中的目标
  function getActiveGoals(): Goal[] {
    return goals.value.filter(g => g.progress < 100)
  }

  // 获取已完成的目标
  function getCompletedGoals(): Goal[] {
    return goals.value.filter(g => g.progress >= 100)
  }

  // 获取按类型分组的目标
  function getGoalsByType(): Record<string, Goal[]> {
    const result: Record<string, Goal[]> = {
      yearly: [],
      quarterly: [],
      monthly: [],
      weekly: []
    }
    
    goals.value.forEach(g => {
      const arr = result[g.type]
      if (arr) {
        arr.push(g)
      }
    })
    
    return result
  }

  // 获取即将到期的目标（7天内）
  function getUpcomingDeadlines(): Goal[] {
    const now = new Date()
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return goals.value
      .filter(g => {
        if (!g.deadline || g.progress >= 100) return false
        const deadline = new Date(g.deadline)
        return deadline >= now && deadline <= weekLater
      })
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
  }

  // 获取过期的目标
  function getOverdueGoals(): Goal[] {
    const now = new Date()
    
    return goals.value
      .filter(g => {
        if (!g.deadline || g.progress >= 100) return false
        const deadline = new Date(g.deadline)
        return deadline < now
      })
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
  }

  // 通用更新目标信息
  function updateGoal(id: number, updates: Partial<Goal>) {
    const goal = goals.value.find(g => g.id === id)
    if (goal) {
      Object.assign(goal, updates)
      goal.updatedAt = Date.now()
      saveGoals(goals.value)
    }
  }

  // 按状态筛选目标
  function filterByStatus(status: 'all' | 'active' | 'completed' | 'overdue'): Goal[] {
    switch (status) {
      case 'active':
        return getActiveGoals()
      case 'completed':
        return getCompletedGoals()
      case 'overdue':
        return getOverdueGoals()
      default:
        return [...goals.value]
    }
  }

  // 估算目标完成剩余天数
  function estimateCompletion(goalId: number): number | null {
    const goal = goals.value.find(g => g.id === goalId)
    if (!goal || goal.progress >= 100 || !goal.createdAt) return null

    const now = Date.now()
    const elapsedDays = Math.max(1, Math.floor((now - goal.createdAt) / (1000 * 60 * 60 * 24)))
    const progressPerDay = goal.progress / elapsedDays
    if (progressPerDay <= 0) return null

    const remaining = 100 - goal.progress
    return Math.ceil(remaining / progressPerDay)
  }

  // 获取最近活动动态
  function getRecentActivity(limit: number = 5): { goalId: number; title: string; text: string; time: number }[] {
    return [...goals.value]
      .filter(g => g.updatedAt > g.createdAt)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit)
      .map(g => ({
        goalId: g.id,
        title: g.title,
        text: g.progress >= 100 ? '目标已完成' : `进度更新至 ${g.progress}%`,
        time: g.updatedAt
      }))
  }

  // 获取目标统计
  function getStats() {
    const total = goals.value.length
    const completed = goals.value.filter(g => g.progress >= 100).length
    const active = goals.value.filter(g => g.progress < 100).length
    const overdue = getOverdueGoals().length

    return {
      total,
      completed,
      active,
      overdue
    }
  }

  return {
    goals,
    addGoal,
    deleteGoal,
    updateGoal,
    updateGoalProgress,
    addKeyResult,
    updateKeyResultProgress,
    deleteKeyResult,
    getActiveGoals,
    getCompletedGoals,
    getGoalsByType,
    getUpcomingDeadlines,
    getOverdueGoals,
    filterByStatus,
    estimateCompletion,
    getRecentActivity,
    getStats
  }
}
