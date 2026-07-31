/**
 * 工作台默认配置
 */
import type { WorkspaceModule, AiConfig, UserSettings, AiProviderConfig } from '../types/workspace'

// 默认工作台模块配置
export const defaultModules: WorkspaceModule[] = [
  {
    id: 'todo',
    type: 'todo',
    title: '待办事项',
    visible: true,
    order: 0,
    collapsed: false,
  },
  {
    id: 'habit',
    type: 'habit',
    title: '习惯打卡',
    visible: true,
    order: 1,
    collapsed: false,
  },
  {
    id: 'accounting',
    type: 'accounting',
    title: '记账',
    visible: true,
    order: 2,
    collapsed: false,
  },
  {
    id: 'goal',
    type: 'goal',
    title: '目标',
    visible: true,
    order: 3,
    collapsed: false,
  },
]

// AI 厂家预设配置
export const aiProviders: AiProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: 'O',
    defaultApiUrl: 'https://api.openai.com/v1',
    color: '#10a37f',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: 'D',
    defaultApiUrl: 'https://api.deepseek.com/v1',
    color: '#4f6ef7',
    models: [
      { value: 'deepseek-chat', label: 'DeepSeek Chat' },
      { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
    ]
  },
  {
    id: 'qwen',
    name: '通义千问',
    icon: '通',
    defaultApiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    color: '#7c3aed',
    models: [
      { value: 'qwen-turbo', label: 'Qwen Turbo' },
      { value: 'qwen-plus', label: 'Qwen Plus' },
      { value: 'qwen-max', label: 'Qwen Max' },
    ]
  },
  {
    id: 'moonshot',
    name: 'Moonshot / Kimi',
    icon: 'K',
    defaultApiUrl: 'https://api.moonshot.cn/v1',
    color: '#1e293b',
    models: [
      { value: 'moonshot-v1-8k', label: 'Moonshot v1 8K' },
      { value: 'moonshot-v1-32k', label: 'Moonshot v1 32K' },
      { value: 'moonshot-v1-128k', label: 'Moonshot v1 128K' },
    ]
  },
  {
    id: 'zhipu',
    name: '智谱 GLM',
    icon: 'G',
    defaultApiUrl: 'https://open.bigmodel.cn/api/paas/v4',
    color: '#059669',
    models: [
      { value: 'glm-4-flash', label: 'GLM-4 Flash' },
      { value: 'glm-4', label: 'GLM-4' },
      { value: 'glm-4-plus', label: 'GLM-4 Plus' },
    ]
  },
  {
    id: 'custom',
    name: '自定义',
    icon: '自',
    defaultApiUrl: '',
    color: '#6b7280',
    models: []
  },
]

// 默认 AI 配置
export const defaultAiConfig: AiConfig = {
  provider: 'openai',
  apiUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
}

// 默认用户设置
export const defaultUserSettings: UserSettings = {
  nickname: '',
  aiConfig: defaultAiConfig,
}

// 记账分类
export const expenseCategories = [
  { id: 'food', name: '餐饮', color: '#f97316' },
  { id: 'transport', name: '交通', color: '#3b82f6' },
  { id: 'shopping', name: '购物', color: '#ec4899' },
  { id: 'entertainment', name: '娱乐', color: '#8b5cf6' },
  { id: 'medical', name: '医疗', color: '#ef4444' },
  { id: 'education', name: '教育', color: '#22c55e' },
  { id: 'housing', name: '住房', color: '#a16207' },
  { id: 'utilities', name: '水电', color: '#f59e0b' },
  { id: 'other', name: '其他', color: '#6b7280' },
]

// 习惯图标选项（使用 WsIcon 名称）
export const habitIcons = [
  'book', 'run', 'flame', 'target', 'pen', 'palette', 'music', 'moon',
  'salad', 'droplet', 'sun', 'note', 'brain', 'monitor', 'smartphone', 'zap',
]

// 目标类型选项
export const goalTypes = [
  { value: 'yearly', label: '年度目标' },
  { value: 'quarterly', label: '季度目标' },
  { value: 'monthly', label: '月度目标' },
  { value: 'weekly', label: '周目标' },
] as const

// 优先级选项
export const priorityOptions = [
  { value: 'high', label: '高优先级', color: '#ef4444' },
  { value: 'medium', label: '中优先级', color: '#f59e0b' },
  { value: 'low', label: '低优先级', color: '#22c55e' },
] as const

// 待办项目/清单选项
export const projectOptions = [
  { value: '', label: '无清单' },
  { value: 'work', label: '工作' },
  { value: 'study', label: '学习' },
  { value: 'life', label: '生活' },
  { value: 'health', label: '健康' },
  { value: 'finance', label: '财务' },
]

// 待办标签建议
export const tagSuggestions = ['重要', '紧急', '长期', '日常', '会议', '阅读', '运动', '写作']
