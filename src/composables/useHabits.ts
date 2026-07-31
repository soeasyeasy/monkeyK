/**
 * 习惯打卡管理 Composable
 * 负责管理习惯的添加、打卡、统计等
 */
import { ref, computed } from 'vue'
import type { Habit, HabitRecord } from '../types/workspace'

const STORAGE_KEY = 'workspace-habits'

function migrateHabit(habit: any): Habit {
  return {
    id: habit.id ?? Date.now(),
    name: habit.name ?? '',
    icon: habit.icon ?? 'flame',
    frequency: habit.frequency ?? 'daily',
    targetCount: habit.targetCount ?? 1,
    records: Array.isArray(habit.records) ? habit.records : [],
    active: habit.active !== undefined ? habit.active : true,
    createdAt: habit.createdAt ?? Date.now()
  }
}

function loadHabits(): Habit[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as any[]
      return parsed.map(migrateHabit)
    }
  } catch (e) {
    console.error('Failed to load habits:', e)
  }
  return []
}

function saveHabits(habits: Habit[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits))
  } catch (e) {
    console.error('Failed to save habits:', e)
  }
}

// 获取今天的日期字符串
function getToday(): string {
  return new Date().toISOString().split('T')[0] ?? ''
}

// 计算连续打卡天数
function calculateStreak(records: HabitRecord[]): number {
  if (!records.length) return 0
  
  const sortedRecords = [...records]
    .filter(r => r.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  if (!sortedRecords.length) return 0
  
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // 检查今天是否打卡
  const todayStr = today.toISOString().split('T')[0]
  const hasToday = sortedRecords.some(r => r.date === todayStr)
  
  // 从昨天开始检查（如果今天没打卡）或从今天开始（如果今天打卡了）
  const startDate = new Date(today)
  if (!hasToday) {
    startDate.setDate(startDate.getDate() - 1)
  }
  
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(startDate)
    checkDate.setDate(checkDate.getDate() - i)
    const dateStr = checkDate.toISOString().split('T')[0]
    
    if (sortedRecords.some(r => r.date === dateStr)) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

export function useHabits() {
  const habits = ref<Habit[]>(loadHabits())

  // 添加习惯
  function addHabit(name: string, icon: string, frequency: 'daily' | 'weekly' = 'daily', targetCount: number = 1) {
    const newHabit: Habit = {
      id: Date.now(),
      name,
      icon,
      frequency,
      targetCount,
      records: [],
      active: true,
      createdAt: Date.now()
    }
    habits.value.push(newHabit)
    saveHabits(habits.value)
  }

  // 删除习惯
  function deleteHabit(id: number) {
    habits.value = habits.value.filter(h => h.id !== id)
    saveHabits(habits.value)
  }

  // 打卡
  function checkIn(habitId: number, count: number = 1) {
    const habit = habits.value.find(h => h.id === habitId)
    if (!habit) return
    
    const today = getToday()
    const existingRecord = habit.records.find(r => r.date === today)
    
    if (existingRecord) {
      existingRecord.count += count
      existingRecord.completed = existingRecord.count >= habit.targetCount
    } else {
      habit.records.push({
        date: today,
        count,
        completed: count >= habit.targetCount
      })
    }
    
    saveHabits(habits.value)
  }

  // 取消今天的打卡
  function uncheckToday(habitId: number) {
    const habit = habits.value.find(h => h.id === habitId)
    if (!habit) return
    
    const today = getToday()
    habit.records = habit.records.filter(r => r.date !== today)
    saveHabits(habits.value)
  }

  // 获取习惯的连续打卡天数
  function getStreak(habitId: number): number {
    const habit = habits.value.find(h => h.id === habitId)
    if (!habit) return 0
    return calculateStreak(habit.records)
  }

  // 获取今天是否已打卡
  function isCompletedToday(habitId: number): boolean {
    const habit = habits.value.find(h => h.id === habitId)
    if (!habit) return false
    
    const today = getToday()
    const record = habit.records.find(r => r.date === today)
    return record?.completed || false
  }

  // 获取今天的打卡次数
  function getTodayCount(habitId: number): number {
    const habit = habits.value.find(h => h.id === habitId)
    if (!habit) return 0
    
    const today = getToday()
    const record = habit.records.find(r => r.date === today)
    return record?.count || 0
  }

  // 获取最近 N 天的打卡记录（用于热力图）
  function getRecentRecords(habitId: number, days: number = 30): HabitRecord[] {
    const habit = habits.value.find(h => h.id === habitId)
    if (!habit) return []

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    return habit.records
      .filter(r => new Date(r.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  // 获取最近 7 天每天的打卡状态
  function getWeeklyRecords(habitId: number): { date: string; completed: boolean }[] {
    const habit = habits.value.find(h => h.id === habitId)
    if (!habit) return []

    const result: { date: string; completed: boolean }[] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0] ?? ''
      const record = habit.records.find(r => r.date === dateStr)
      result.push({
        date: dateStr,
        completed: record ? record.completed : false
      })
    }
    return result
  }

  // 获取习惯完成率（总打卡天数 / 创建以来应打卡天数）
  function getCompletionRate(habitId: number): number {
    const habit = habits.value.find(h => h.id === habitId)
    if (!habit || !habit.records.length) return 0

    const created = new Date(habit.createdAt)
    const today = new Date()
    const daysDiff = Math.max(1, Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    const completedDays = habit.records.filter(r => r.completed).length
    return Math.min(100, Math.round((completedDays / daysDiff) * 100))
  }

  // 获取习惯总打卡次数
  function getTotalCheckIns(habitId: number): number {
    const habit = habits.value.find(h => h.id === habitId)
    if (!habit) return 0
    return habit.records.reduce((sum, r) => sum + r.count, 0)
  }

  // 暂停/启用习惯
  function toggleActive(habitId: number) {
    const habit = habits.value.find(h => h.id === habitId)
    if (habit) {
      habit.active = !habit.active
      saveHabits(habits.value)
    }
  }

  return {
    habits,
    addHabit,
    deleteHabit,
    checkIn,
    uncheckToday,
    getStreak,
    isCompletedToday,
    getTodayCount,
    getRecentRecords,
    getWeeklyRecords,
    getCompletionRate,
    getTotalCheckIns,
    toggleActive
  }
}
