/**
 * 待办事项管理 Composable
 * 负责管理待办事项的添加、删除、更新、筛选、分组、统计等
 */
import { ref } from 'vue'
import type { Todo, SubTodo } from '../types/workspace'

const STORAGE_KEY = 'workspace-todos'

function migrateTodo(todo: any): Todo {
  return {
    id: todo.id ?? Date.now(),
    text: todo.text ?? '',
    done: todo.done ?? false,
    createdAt: todo.createdAt ?? Date.now(),
    updatedAt: todo.updatedAt ?? todo.createdAt ?? Date.now(),
    priority: todo.priority ?? 'medium',
    dueDate: todo.dueDate ?? '',
    tags: Array.isArray(todo.tags) ? todo.tags : [],
    project: todo.project ?? '',
    subtasks: Array.isArray(todo.subtasks)
      ? todo.subtasks.map((s: any) => ({
          id: s.id ?? Date.now(),
          text: s.text ?? '',
          done: s.done ?? false
        }))
      : [],
    notes: todo.notes ?? ''
  }
}

function loadTodos(): Todo[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as any[]
      return parsed.map(migrateTodo)
    }
  } catch (e) {
    console.error('Failed to load todos:', e)
  }
  return []
}

function saveTodos(todos: Todo[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  } catch (e) {
    console.error('Failed to save todos:', e)
  }
}

function getToday(): string {
  return new Date().toISOString().split('T')[0] ?? ''
}

function getTomorrow(): string {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0] ?? ''
}

function isOverdue(todo: Todo): boolean {
  if (todo.done || !todo.dueDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(todo.dueDate)
  return due < today
}

export function useTodos() {
  const todos = ref<Todo[]>(loadTodos())

  // 添加待办
  function addTodo(
    text: string,
    priority: 'high' | 'medium' | 'low' = 'medium',
    dueDate: string = '',
    tags: string[] = [],
    project: string = '',
    notes: string = ''
  ) {
    const now = Date.now()
    const newTodo: Todo = {
      id: now,
      text: text.trim(),
      done: false,
      createdAt: now,
      updatedAt: now,
      priority,
      dueDate,
      tags,
      project,
      subtasks: [],
      notes: notes.trim()
    }
    todos.value.push(newTodo)
    saveTodos(todos.value)
    return newTodo.id
  }

  // 删除待办
  function deleteTodo(id: number) {
    todos.value = todos.value.filter(t => t.id !== id)
    saveTodos(todos.value)
  }

  // 切换待办完成状态
  function toggleTodo(id: number) {
    const todo = todos.value.find(t => t.id === id)
    if (todo) {
      todo.done = !todo.done
      todo.updatedAt = Date.now()
      saveTodos(todos.value)
    }
  }

  // 更新待办
  function updateTodo(id: number, updates: Partial<Todo>) {
    const todo = todos.value.find(t => t.id === id)
    if (todo) {
      Object.assign(todo, updates)
      todo.updatedAt = Date.now()
      saveTodos(todos.value)
    }
  }

  // 添加子任务
  function addSubTodo(todoId: number, text: string) {
    const todo = todos.value.find(t => t.id === todoId)
    if (!todo || !text.trim()) return
    todo.subtasks.push({
      id: Date.now(),
      text: text.trim(),
      done: false
    })
    todo.updatedAt = Date.now()
    saveTodos(todos.value)
  }

  // 切换子任务完成状态
  function toggleSubTodo(todoId: number, subTodoId: number) {
    const todo = todos.value.find(t => t.id === todoId)
    if (!todo) return
    const sub = todo.subtasks.find(s => s.id === subTodoId)
    if (sub) {
      sub.done = !sub.done
      todo.updatedAt = Date.now()
      saveTodos(todos.value)
    }
  }

  // 删除子任务
  function deleteSubTodo(todoId: number, subTodoId: number) {
    const todo = todos.value.find(t => t.id === todoId)
    if (!todo) return
    todo.subtasks = todo.subtasks.filter(s => s.id !== subTodoId)
    todo.updatedAt = Date.now()
    saveTodos(todos.value)
  }

  // 获取未完成的待办
  function getActiveTodos(): Todo[] {
    return todos.value.filter(t => !t.done)
  }

  // 获取已完成的待办
  function getCompletedTodos(): Todo[] {
    return todos.value.filter(t => t.done)
  }

  // 获取过期的待办
  function getOverdueTodos(): Todo[] {
    return todos.value.filter(t => isOverdue(t))
  }

  // 获取今天到期的待办
  function getTodayTodos(): Todo[] {
    const today = getToday()
    return todos.value.filter(t => !t.done && t.dueDate === today)
  }

  // 获取明天到期的待办
  function getTomorrowTodos(): Todo[] {
    const tomorrow = getTomorrow()
    return todos.value.filter(t => !t.done && t.dueDate === tomorrow)
  }

  // 按状态筛选
  function filterByStatus(status: 'all' | 'active' | 'completed' | 'overdue'): Todo[] {
    switch (status) {
      case 'active':
        return getActiveTodos()
      case 'completed':
        return getCompletedTodos()
      case 'overdue':
        return getOverdueTodos()
      default:
        return [...todos.value]
    }
  }

  // 按项目筛选
  function filterByProject(project: string): Todo[] {
    if (!project) return [...todos.value]
    return todos.value.filter(t => t.project === project)
  }

  // 按标签筛选
  function filterByTag(tag: string): Todo[] {
    if (!tag) return [...todos.value]
    return todos.value.filter(t => t.tags.includes(tag))
  }

  // 搜索待办
  function searchTodos(keyword: string): Todo[] {
    if (!keyword.trim()) return [...todos.value]
    const lower = keyword.toLowerCase()
    return todos.value.filter(
      t =>
        t.text.toLowerCase().includes(lower) ||
        t.notes.toLowerCase().includes(lower) ||
        t.tags.some(tag => tag.toLowerCase().includes(lower)) ||
        t.project.toLowerCase().includes(lower)
    )
  }

  // 按截止日期分组
  function groupByDueDate(items: Todo[]): {
    today: Todo[]
    tomorrow: Todo[]
    upcoming: Todo[]
    noDate: Todo[]
    overdue: Todo[]
  } {
    const today = getToday()
    const tomorrow = getTomorrow()
    const result = {
      today: [] as Todo[],
      tomorrow: [] as Todo[],
      upcoming: [] as Todo[],
      noDate: [] as Todo[],
      overdue: [] as Todo[]
    }

    items.forEach(t => {
      if (t.done) return
      if (isOverdue(t)) {
        result.overdue.push(t)
      } else if (!t.dueDate) {
        result.noDate.push(t)
      } else if (t.dueDate === today) {
        result.today.push(t)
      } else if (t.dueDate === tomorrow) {
        result.tomorrow.push(t)
      } else {
        result.upcoming.push(t)
      }
    })

    return result
  }

  // 排序待办
  function sortTodos(items: Todo[], sortBy: 'priority' | 'dueDate' | 'createdAt' = 'priority'): Todo[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return [...items].sort((a, b) => {
      // 未完成的排在前面
      if (a.done !== b.done) return a.done ? 1 : -1

      if (sortBy === 'priority') {
        if (a.priority !== b.priority) {
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
      }

      if (sortBy === 'dueDate') {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }
        if (a.dueDate) return -1
        if (b.dueDate) return 1
      }

      return b.createdAt - a.createdAt
    })
  }

  // 批量完成全部进行中的待办
  function completeAll(ids: number[]) {
    todos.value.forEach(t => {
      if (ids.includes(t.id) && !t.done) {
        t.done = true
        t.updatedAt = Date.now()
      }
    })
    saveTodos(todos.value)
  }

  // 清空已完成的待办
  function clearCompleted() {
    todos.value = todos.value.filter(t => !t.done)
    saveTodos(todos.value)
  }

  // 获取所有项目列表
  function getProjects(): string[] {
    const set = new Set<string>()
    todos.value.forEach(t => {
      if (t.project) set.add(t.project)
    })
    return Array.from(set).sort()
  }

  // 获取所有标签列表
  function getTags(): string[] {
    const set = new Set<string>()
    todos.value.forEach(t => t.tags.forEach(tag => set.add(tag)))
    return Array.from(set).sort()
  }

  // 获取统计信息
  function getStats() {
    const total = todos.value.length
    const completed = todos.value.filter(t => t.done).length
    const active = todos.value.filter(t => !t.done).length
    const overdue = getOverdueTodos().length
    return { total, completed, active, overdue }
  }

  // 获取今日统计
  function getTodayStats() {
    const today = getToday()
    const todayTodos = todos.value.filter(t => t.dueDate === today)
    const completed = todayTodos.filter(t => t.done).length
    const total = todayTodos.length
    return { total, completed, rate: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  return {
    todos,
    addTodo,
    deleteTodo,
    toggleTodo,
    updateTodo,
    addSubTodo,
    toggleSubTodo,
    deleteSubTodo,
    getActiveTodos,
    getCompletedTodos,
    getOverdueTodos,
    getTodayTodos,
    getTomorrowTodos,
    filterByStatus,
    filterByProject,
    filterByTag,
    searchTodos,
    groupByDueDate,
    sortTodos,
    completeAll,
    clearCompleted,
    getProjects,
    getTags,
    getStats,
    getTodayStats
  }
}
