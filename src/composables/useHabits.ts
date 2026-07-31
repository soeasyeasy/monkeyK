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
    const today = getToday()
    
    // 创建新的 habits 数组以触发响应式更新
    habits.value = habits.value.map(h => {
      if (h.id !== habitId) return h
      
      const existingRecord = h.records.find(r => r.date === today)
      let newRecords: HabitRecord[]
      
      if (existingRecord) {
        // 更新现有记录
        newRecords = h.records.map(r => {
          if (r.date !== today) return r
          const newCount = r.count + count
          return { ...r, count: newCount, completed: newCount >= h.targetCount }
        })
      } else {
        // 添加新记录
        newRecords = [...h.records, {
          date: today,
          count,
          completed: count >= h.targetCount
        }]
      }
      
      return { ...h, records: newRecords }
    })
    
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

  // 获取指定月份的所有日期
  function getMonthDays(year: number, month: number): { label: string; date: string }[] {
    const days = ['日', '一', '二', '三', '四', '五', '六']
    const daysInMonth = new Date(year, month, 0).getDate()
    const result: { label: string; date: string }[] = []

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d)
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      result.push({
        label: days[date.getDay()]!,
        date: dateStr
      })
    }

    return result
  }

  // 获取指定月份每天的全局打卡统计（用于月热力图）
  function getMonthlyHeatmap(year: number, month: number): { date: string; label: string; completed: number; total: number }[] {
    const days = getMonthDays(year, month)
    const activeHabits = habits.value.filter(h => h.active)
    const total = activeHabits.length

    return days.map(day => {
      const completed = activeHabits.filter(h => {
        const record = h.records.find(r => r.date === day.date)
        return record?.completed || false
      }).length
      return { date: day.date, label: day.label, completed, total }
    })
  }

  // 获取指定年份每月的打卡统计（用于年视图）
  function getYearlyStats(year: number): { month: number; label: string; completedDays: number; totalDays: number; rate: number }[] {
    const result: { month: number; label: string; completedDays: number; totalDays: number; rate: number }[] = []
    const now = new Date()
    const currentMonth = now.getFullYear() === year ? now.getMonth() + 1 : 12

    for (let m = 1; m <= currentMonth; m++) {
      const daysInMonth = new Date(year, m, 0).getDate()
      const today = new Date()
      // 如果是当月，只算到今天为止的天数
      const effectiveDays = (year === now.getFullYear() && m === now.getMonth() + 1)
        ? now.getDate()
        : daysInMonth

      let completedDays = 0
      for (let d = 1; d <= effectiveDays; d++) {
        const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const activeHabits = habits.value.filter(h => h.active)
        if (activeHabits.length === 0) continue
        const doneCount = activeHabits.filter(h => {
          const record = h.records.find(r => r.date === dateStr)
          return record?.completed || false
        }).length
        // 当天超过半数习惯完成算作一个完成日
        if (doneCount >= Math.ceil(activeHabits.length / 2)) completedDays++
      }

      const rate = effectiveDays > 0 ? Math.round((completedDays / effectiveDays) * 100) : 0
      result.push({ month: m, label: `${m}月`, completedDays, totalDays: effectiveDays, rate })
    }

    return result
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
    toggleActive,
    getMonthDays,
    getMonthlyHeatmap,
    getYearlyStats
  }
}
