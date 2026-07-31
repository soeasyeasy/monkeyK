/**
 * 工作台类型定义
 */

// 子任务
export interface SubTodo {
  id: number
  text: string
  done: boolean
}

// 待办事项
export interface Todo {
  id: number
  text: string
  done: boolean
  createdAt: number
  updatedAt: number
  priority: 'high' | 'medium' | 'low'
  dueDate: string
  tags: string[]
  project: string
  subtasks: SubTodo[]
  notes: string
}

// 习惯打卡
export interface Habit {
  id: number
  name: string
  icon: string
  frequency: 'daily' | 'weekly'
  targetCount: number
  records: HabitRecord[]
  active: boolean
  createdAt: number
}

export interface HabitRecord {
  date: string // YYYY-MM-DD
  count: number
  completed: boolean
}

// 记账
export interface Expense {
  id: number
  amount: number
  category: string
  description: string
  date: string // YYYY-MM-DD
  createdAt: number
}

export interface Budget {
  monthly: number
  categoryBudgets: Record<string, number>
}

// 目标/OKR
export interface Goal {
  id: number
  title: string
  description: string
  type: 'yearly' | 'quarterly' | 'monthly' | 'weekly'
  progress: number // 0-100
  keyResults: KeyResult[]
  deadline: string
  createdAt: number
  updatedAt: number
}

export interface KeyResult {
  id: number
  title: string
  progress: number // 0-100
}

// 收藏夹
export interface Favorite {
  id: number
  title: string
  url: string
  category: string
  createdAt: number
}

// 工作台模块
export interface WorkspaceModule {
  id: string
  type: 'todo' | 'habit' | 'accounting' | 'goal' | 'favorite'
  title: string
  visible: boolean
  order: number
  collapsed: boolean
}

// AI 厂家
export type AiProvider = 'openai' | 'deepseek' | 'qwen' | 'moonshot' | 'zhipu' | 'custom'

// AI 厂家配置
export interface AiProviderConfig {
  id: AiProvider
  name: string
  icon: string
  defaultApiUrl: string
  models: { value: string; label: string }[]
  color: string
}

// AI 配置
export interface AiConfig {
  provider: AiProvider
  apiUrl: string
  apiKey: string
  model: string
}

// 用户设置
export interface UserSettings {
  nickname: string
  aiConfig: AiConfig
}

// AI 消息
export interface AiMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: number
}

// AI 意图
export interface AiIntent {
  action: 'add_todo' | 'add_expense' | 'check_habit' | 'set_goal' | 'query' | 'chat'
  params: Record<string, any>
}

// 模块数据（用于 AI 分析）
export interface ModuleData {
  todos: Todo[]
  habits: Habit[]
  expenses: Expense[]
  goals: Goal[]
}
