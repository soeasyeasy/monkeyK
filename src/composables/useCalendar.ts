/**
 * 日历数据组合 Composable
 * 聚合待办、习惯、记账、目标的数据，按日期组织为统一事件
 */
import { computed } from 'vue'
import { useTodos } from './useTodos'
import { useHabits } from './useHabits'
import { useAccounting } from './useAccounting'
import { useGoals } from './useGoals'

export type CalendarEventType = 'todo' | 'habit' | 'expense' | 'goal'

export interface CalendarEvent {
  id: string
  type: CalendarEventType
  title: string
  date: string
  color: string
  data: unknown
}

export interface DayEvents {
  date: string
  events: CalendarEvent[]
}

export function useCalendar() {
  const { todos } = useTodos()
  const { habits } = useHabits()
  const { expenses } = useAccounting()
  const { goals } = useGoals()

  // 待办事件（按截止日期）
  const todoEvents = computed<CalendarEvent[]>(() => {
    return todos.value
      .filter(t => !t.done && t.dueDate)
      .map(t => ({
        id: `todo-${t.id}`,
        type: 'todo' as CalendarEventType,
        title: t.text,
        date: t.dueDate,
        color: '#3b82f6',
        data: t
      }))
  })

  // 习惯事件（按打卡日期）
  const habitEvents = computed<CalendarEvent[]>(() => {
    const events: CalendarEvent[] = []
    habits.value.forEach(habit => {
      habit.records.forEach(record => {
        if (record.completed) {
          events.push({
            id: `habit-${habit.id}-${record.date}`,
            type: 'habit' as CalendarEventType,
            title: habit.name,
            date: record.date,
            color: '#f59e0b',
            data: { habit, record }
          })
        }
      })
    })
    return events
  })

  // 记账事件（按支出日期）
  const expenseEvents = computed<CalendarEvent[]>(() => {
    return expenses.value.map(e => ({
      id: `expense-${e.id}`,
      type: 'expense' as CalendarEventType,
      title: `${e.category}: ¥${e.amount.toFixed(2)}`,
      date: e.date,
      color: '#10b981',
      data: e
    }))
  })

  // 目标事件（按截止日期）
  const goalEvents = computed<CalendarEvent[]>(() => {
    return goals.value
      .filter(g => g.deadline)
      .map(g => ({
        id: `goal-${g.id}`,
        type: 'goal' as CalendarEventType,
        title: g.title,
        date: g.deadline,
        color: g.progress >= 100 ? '#22c55e' : '#8b5cf6',
        data: g
      }))
  })

  const allEvents = computed<CalendarEvent[]>(() => {
    return [
      ...todoEvents.value,
      ...habitEvents.value,
      ...expenseEvents.value,
      ...goalEvents.value
    ]
  })

  /**
   * 获取指定月份每一天的事件
   */
  function getMonthEvents(year: number, month: number): DayEvents[] {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const result: DayEvents[] = []

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      result.push({
        date: dateStr,
        events: allEvents.value.filter(e => e.date === dateStr)
      })
    }

    return result
  }

  /**
   * 获取某一天的所有事件
   */
  function getEventsByDate(dateStr: string): CalendarEvent[] {
    return allEvents.value.filter(e => e.date === dateStr)
  }

  /**
   * 判断某一天是否有事件
   */
  function hasEvents(dateStr: string): boolean {
    return allEvents.value.some(e => e.date === dateStr)
  }

  return {
    allEvents,
    todoEvents,
    habitEvents,
    expenseEvents,
    goalEvents,
    getMonthEvents,
    getEventsByDate,
    hasEvents
  }
}
