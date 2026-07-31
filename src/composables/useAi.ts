/**
 * AI 能力 Composable
 * 负责 AI 对话、意图解析、智能建议、报告生成等
 * 支持多厂家：OpenAI、DeepSeek、通义千问、Moonshot/Kimi、智谱 GLM
 */
import { ref, computed } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useTodos } from './useTodos'
import { useHabits } from './useHabits'
import { useAccounting } from './useAccounting'
import { useGoals } from './useGoals'
import type { AiMessage, AiIntent, ModuleData } from '../types/workspace'

const AI_MESSAGES_KEY = 'workspace-ai-messages'

function loadMessages(): AiMessage[] {
  try {
    const saved = localStorage.getItem(AI_MESSAGES_KEY)
    if (saved) return JSON.parse(saved)
  } catch (e) {
    // ignore
  }
  return []
}

function saveMessages(messages: AiMessage[]) {
  try {
    // 只保存最近 50 条
    const toSave = messages.slice(-50)
    localStorage.setItem(AI_MESSAGES_KEY, JSON.stringify(toSave))
  } catch (e) {
    // ignore
  }
}

export function useAi() {
  const settingsStore = useSettingsStore()
  const { todos } = useTodos()
  const { habits } = useHabits()
  const { expenses, budget } = useAccounting()
  const { goals } = useGoals()

  const messages = ref<AiMessage[]>(loadMessages())
  const isLoading = ref(false)

  // 检查 AI 是否已配置
  const isConfigured = computed(() => settingsStore.isAiConfigured)

  // 收集所有模块数据用于 AI 分析
  function collectModuleData(): ModuleData {
    return {
      todos: todos.value,
      habits: habits.value,
      expenses: expenses.value,
      goals: goals.value
    }
  }

  // 根据厂家构建请求 URL
  function buildApiUrl(config: typeof settingsStore.aiConfig): string {
    const baseUrl = config.apiUrl.replace(/\/$/, '')
    const provider = config.provider

    if (provider === 'zhipu') {
      // 智谱 GLM 使用 /chat/completions 路径
      return `${baseUrl}/chat/completions`
    }
    // 其他厂家均兼容 OpenAI 格式
    return `${baseUrl}/chat/completions`
  }

  // 调用 AI API（流式）
  async function callAiApi(messages: AiMessage[], onChunk?: (text: string) => void): Promise<string> {
    if (!isConfigured.value) {
      throw new Error('AI 未配置，请先在设置中配置 API Key')
    }

    const config = settingsStore.aiConfig
    const url = buildApiUrl(config)

    isLoading.value = true

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: !!onChunk
        })
      })

      if (!response.ok) {
        const errText = await response.text().catch(() => '')
        throw new Error(`API 请求失败: ${response.status} ${errText}`)
      }

      // 流式响应
      if (onChunk && response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullText = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

          for (const line of lines) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ''
              if (content) {
                fullText += content
                onChunk(content)
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }

        return fullText
      } else {
        // 非流式响应
        const data = await response.json()
        return data.choices?.[0]?.message?.content || ''
      }
    } catch (error) {
      console.error('AI API 调用失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 对话
  async function chat(userMessage: string, onChunk?: (text: string) => void): Promise<string> {
    const userMsg: AiMessage = { role: 'user', content: userMessage }
    messages.value.push(userMsg)

    try {
      const systemPrompt = buildSystemPrompt()
      const allMessages: AiMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages.value.slice(-10)
      ]

      const assistantMsg: AiMessage = { role: 'assistant', content: '' }
      messages.value.push(assistantMsg)

      const response = await callAiApi(allMessages, onChunk)
      
      if (onChunk) {
        assistantMsg.content = response
      } else {
        assistantMsg.content = response
      }

      saveMessages(messages.value)
      return response
    } catch (error) {
      messages.value.pop()
      throw error
    }
  }

  // 构建系统提示词
  function buildSystemPrompt(): string {
    const data = collectModuleData()
    const today = new Date().toLocaleDateString('zh-CN')
    
    return `你是一个智能工作台助手，帮助用户管理待办事项、习惯打卡、记账和目标。
今天是 ${today}。

当前数据概览：
- 待办事项：${data.todos.length} 个，其中 ${data.todos.filter(t => !t.done).length} 个未完成
- 习惯：${data.habits.length} 个
- 本月记账：${data.expenses.length} 条记录
- 目标：${data.goals.length} 个，其中 ${data.goals.filter(g => g.progress < 100).length} 个进行中

你可以：
1. 回答用户关于工作台的问题
2. 提供智能建议（如：待办优先级、预算控制、习惯坚持等）
3. 解析用户的自然语言指令，返回 JSON 格式的意图

当用户想要执行操作时，请返回 JSON 格式：
{
  "action": "add_todo" | "add_expense" | "check_habit" | "set_goal" | "query" | "chat",
  "params": { ... }
}

例如：
- 用户说"添加一个待办：明天开会" → {"action": "add_todo", "params": {"text": "明天开会", "priority": "medium"}}
- 用户说"记一笔：午饭35元" → {"action": "add_expense", "params": {"amount": 35, "category": "餐饮", "description": "午饭"}}
- 用户说"打卡：跑步" → {"action": "check_habit", "params": {"habitName": "跑步"}}

请用简洁友好的中文回复，支持使用 Markdown 格式（加粗、列表、代码块等）来组织内容。`
  }

  // 解析用户意图
  async function parseIntent(text: string): Promise<AiIntent | null> {
    const systemPrompt = `你是一个意图解析助手。分析用户的自然语言，提取操作意图。
只返回 JSON 格式，不要其他内容。

支持的 action：
- add_todo: 添加待办，params: {text, priority?, dueDate?}
- add_expense: 添加记账，params: {amount, category, description?}
- check_habit: 打卡习惯，params: {habitName}
- set_goal: 设置目标，params: {title, type?}
- query: 查询数据，params: {query}
- chat: 普通对话，params: {}

示例：
用户："添加待办：买牛奶"
返回：{"action": "add_todo", "params": {"text": "买牛奶", "priority": "medium"}}`

    try {
      const response = await callAiApi([
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: text }
      ])

      const match = response.match(/\{[\s\S]*\}/)
      if (match) {
        return JSON.parse(match[0])
      }
      return null
    } catch (error) {
      console.error('意图解析失败:', error)
      return null
    }
  }

  // 获取智能建议
  async function getSuggestions(): Promise<string> {
    const data = collectModuleData()
    const prompt = `基于以下数据，给出 3-5 条实用的建议：

待办事项：${data.todos.filter(t => !t.done).length} 个未完成
${data.todos.filter(t => !t.done && t.priority === 'high').length > 0 ? '有高优先级待办' : ''}
${data.todos.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length > 0 ? '有过期待办' : ''}

习惯打卡：${data.habits.length} 个习惯
${data.habits.length > 0 ? '最近打卡情况：' + data.habits.map(h => `${h.name} ${h.records.length}次`).join('、') : ''}

记账：本月 ${data.expenses.length} 条记录
${data.expenses.length > 0 ? `总支出：¥${data.expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}` : ''}
${budget.value.monthly > 0 ? `预算：¥${budget.value.monthly}` : ''}

目标：${data.goals.length} 个
${data.goals.filter(g => g.progress < 100).map(g => `${g.title} ${g.progress}%`).join('、')}

请给出简洁、可执行的建议，使用 Markdown 格式。`

    try {
      return await callAiApi([
        { role: 'system' as const, content: '你是一个智能助手，基于用户数据给出实用建议。' },
        { role: 'user' as const, content: prompt }
      ])
    } catch (error) {
      return 'AI 建议获取失败，请检查配置。'
    }
  }

  // 生成报告
  async function generateReport(type: 'weekly' | 'monthly' = 'weekly'): Promise<string> {
    const data = collectModuleData()
    const now = new Date()
    const days = type === 'weekly' ? 7 : 30
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    
    const periodExpenses = data.expenses.filter(e => new Date(e.date) >= startDate)
    const totalExpense = periodExpenses.reduce((sum, e) => sum + e.amount, 0)
    
    const prompt = `生成${type === 'weekly' ? '周报' : '月报'}：

时间范围：${startDate.toLocaleDateString('zh-CN')} 至 ${now.toLocaleDateString('zh-CN')}

待办完成情况：
- 总待办：${data.todos.length}
- 已完成：${data.todos.filter(t => t.done).length}
- 未完成：${data.todos.filter(t => !t.done).length}

习惯打卡：
${data.habits.map(h => `- ${h.name}：打卡 ${h.records.filter(r => new Date(r.date) >= startDate).length} 次`).join('\n') || '无习惯'}

记账统计：
- 总支出：¥${totalExpense.toFixed(2)}
- 记录数：${periodExpenses.length}
${budget.value.monthly > 0 ? `- 预算：¥${budget.value.monthly}\n- 预算使用：${((totalExpense / budget.value.monthly) * 100).toFixed(1)}%` : ''}

目标进度：
${data.goals.map(g => `- ${g.title}：${g.progress}%`).join('\n') || '无目标'}

请生成一份简洁的${type === 'weekly' ? '周报' : '月报'}，使用 Markdown 格式，包含总结、亮点和改进建议。`

    try {
      return await callAiApi([
        { role: 'system' as const, content: '你是一个报告生成助手，生成简洁、有洞察的报告。' },
        { role: 'user' as const, content: prompt }
      ])
    } catch (error) {
      return '报告生成失败，请检查 AI 配置。'
    }
  }

  // 清空对话历史
  function clearMessages() {
    messages.value = []
    saveMessages(messages.value)
  }

  return {
    messages,
    isLoading,
    isConfigured,
    chat,
    parseIntent,
    getSuggestions,
    generateReport,
    clearMessages
  }
}
