<script setup lang="ts">
/**
 * 待办事项页面
 * 支持添加、编辑、删除、筛选待办事项
 * 数据通过 localStorage 持久化存储
 */
import { ref, computed } from 'vue'
import MarkdownIt from 'markdown-it'

// Markdown 解析器，用于渲染待办内容
const md = new MarkdownIt({ breaks: true, linkify: true })

// 待办事项类型定义
interface Todo {
  id: number
  text: string
  done: boolean
  createdAt: number
  priority: 'high' | 'medium' | 'low'
  dueDate: string
  tags: string[]
}

// 筛选类型
type Filter = 'all' | 'active' | 'done'
type PriorityFilter = 'all' | 'high' | 'medium' | 'low'

// localStorage 存储键名
const STORAGE_KEY = 'todos-data'

function loadTodos(): Todo[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return []
}

const todos = ref<Todo[]>(loadTodos())
const newTodoText = ref('')
const newTodoPriority = ref<'high' | 'medium' | 'low'>('medium')
const newTodoDueDate = ref('')
const newTodoTags = ref('')
const filter = ref<Filter>('all')
const priorityFilter = ref<PriorityFilter>('all')
const tagFilter = ref('')
const searchQuery = ref('')
const editingId = ref<number | null>(null)
const editingText = ref('')
const editingPriority = ref<'high' | 'medium' | 'low'>('medium')
const editingDueDate = ref('')
const editingTags = ref('')

// 所有已使用的标签
const allTags = computed(() => {
  const tagSet = new Set<string>()
  todos.value.forEach((t) => t.tags.forEach((tag) => tagSet.add(tag)))
  return Array.from(tagSet).sort()
})

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos.value))
  } catch {}
}

function addTodo() {
  const text = newTodoText.value.trim()
  if (!text) return
  const tags = newTodoTags.value
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
  todos.value.unshift({
    id: Date.now(),
    text,
    done: false,
    createdAt: Date.now(),
    priority: newTodoPriority.value,
    dueDate: newTodoDueDate.value,
    tags,
  })
  newTodoText.value = ''
  newTodoPriority.value = 'medium'
  newTodoDueDate.value = ''
  newTodoTags.value = ''
  saveTodos()
}

function toggleTodo(id: number) {
  const todo = todos.value.find((t) => t.id === id)
  if (todo) {
    todo.done = !todo.done
    saveTodos()
  }
}

function deleteTodo(id: number) {
  todos.value = todos.value.filter((t) => t.id !== id)
  saveTodos()
}

function clearDone() {
  todos.value = todos.value.filter((t) => !t.done)
  saveTodos()
}

function startEdit(todo: Todo) {
  editingId.value = todo.id
  editingText.value = todo.text
  editingPriority.value = todo.priority
  editingDueDate.value = todo.dueDate
  editingTags.value = todo.tags.join(', ')
}

function saveEdit(todo: Todo) {
  const text = editingText.value.trim()
  if (text) {
    todo.text = text
    todo.priority = editingPriority.value
    todo.dueDate = editingDueDate.value
    todo.tags = editingTags.value
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean)
    saveTodos()
  }
  editingId.value = null
}

function cancelEdit() {
  editingId.value = null
}

function isOverdue(todo: Todo): boolean {
  if (!todo.dueDate || todo.done) return false
  return new Date(todo.dueDate) < new Date(new Date().toDateString())
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const filteredTodos = computed(() => {
  let result = todos.value

  // 状态筛选
  if (filter.value === 'active') result = result.filter((t) => !t.done)
  if (filter.value === 'done') result = result.filter((t) => t.done)

  // 优先级筛选
  if (priorityFilter.value !== 'all')
    result = result.filter((t) => t.priority === priorityFilter.value)

  // 标签筛选
  if (tagFilter.value) result = result.filter((t) => t.tags.includes(tagFilter.value))

  // 搜索
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    result = result.filter(
      (t) => t.text.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q)),
    )
  }

  return result
})

const stats = computed(() => ({
  total: todos.value.length,
  active: todos.value.filter((t) => !t.done).length,
  done: todos.value.filter((t) => t.done).length,
  overdue: todos.value.filter((t) => isOverdue(t)).length,
}))

const completionRate = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((stats.value.done / stats.value.total) * 100)
})

const priorityLabels: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

function renderMarkdown(text: string): string {
  return md.renderInline(text)
}

// 展开/收起添加表单
const showAddForm = ref(false)
</script>

<template>
  <div class="todo-page">
    <div class="todo-container">
      <!-- 头部 -->
      <header class="page-header">
        <h1>待办事项</h1>
        <p class="subtitle">管理日常任务，提高效率</p>
      </header>

      <!-- 统计卡片 -->
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">全部任务</div>
          </div>
          <div class="stat-card active">
            <div class="stat-value">{{ stats.active }}</div>
            <div class="stat-label">进行中</div>
          </div>
          <div class="stat-card completed">
            <div class="stat-value">{{ stats.done }}</div>
            <div class="stat-label">已完成</div>
          </div>
          <div v-if="stats.overdue > 0" class="stat-card overdue">
            <div class="stat-value">{{ stats.overdue }}</div>
            <div class="stat-label">已过期</div>
          </div>
        </div>
        <!-- 进度条 -->
        <div v-if="stats.total > 0" class="progress-section">
          <div class="progress-info">
            <span>完成率</span>
            <span class="progress-percent">{{ completionRate }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: completionRate + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- 搜索和添加区域 -->
      <div class="main-actions">
        <!-- 搜索栏 -->
        <div class="search-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索任务..."
            class="search-input"
          />
        </div>

        <!-- 添加待办 -->
        <div class="add-section">
          <div class="add-form-compact" v-if="!showAddForm">
            <input
              v-model="newTodoText"
              type="text"
              placeholder="添加新任务..."
              class="todo-input"
              @keyup.enter="newTodoText.trim() ? addTodo() : (showAddForm = true)"
            />
            <button
              type="button"
              class="add-btn"
              :disabled="!newTodoText.trim()"
              @click="addTodo"
            >
              添加
            </button>
            <button type="button" class="expand-btn" @click="showAddForm = true" title="更多选项">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>

          <form v-else class="add-form-full" @submit.prevent="addTodo">
            <input
              v-model="newTodoText"
              type="text"
              placeholder="任务内容（支持 Markdown）"
              class="todo-input"
              autofocus
            />
            <div class="form-options">
              <select v-model="newTodoPriority" class="form-select">
                <option value="high">高优先级</option>
                <option value="medium">中优先级</option>
                <option value="low">低优先级</option>
              </select>
              <input v-model="newTodoDueDate" type="date" class="form-date" />
              <input
                v-model="newTodoTags"
                type="text"
                placeholder="标签（逗号分隔）"
                class="form-tags"
              />
            </div>
            <div class="form-actions">
              <button type="submit" class="add-btn" :disabled="!newTodoText.trim()">添加</button>
              <button type="button" class="cancel-btn" @click="showAddForm = false">取消</button>
            </div>
          </form>
        </div>
      </div>

      <!-- 筛选栏 -->
      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-group">
            <button
              v-for="f in (['all', 'active', 'done'] as const)"
              :key="f"
              class="filter-btn"
              :class="{ active: filter === f }"
              @click="filter = f"
            >
              {{ f === 'all' ? '全部' : f === 'active' ? '进行中' : '已完成' }}
              <span v-if="f === 'all'" class="filter-count">{{ stats.total }}</span>
              <span v-else-if="f === 'active'" class="filter-count">{{ stats.active }}</span>
              <span v-else class="filter-count">{{ stats.done }}</span>
            </button>
          </div>
          <button v-if="stats.done > 0" class="clear-btn" @click="clearDone">
            清除已完成
          </button>
        </div>

        <div class="filter-row secondary-filters">
          <div class="filter-group">
            <button
              v-for="p in (['all', 'high', 'medium', 'low'] as const)"
              :key="p"
              class="filter-btn priority-btn"
              :class="{ active: priorityFilter === p, ['p-' + p]: p !== 'all' }"
              @click="priorityFilter = p"
            >
              {{ p === 'all' ? '全部优先级' : priorityLabels[p] }}
            </button>
          </div>
          <div v-if="allTags.length" class="filter-group tag-filters">
            <button
              class="filter-btn"
              :class="{ active: !tagFilter }"
              @click="tagFilter = ''"
            >
              全部标签
            </button>
            <button
              v-for="tag in allTags"
              :key="tag"
              class="filter-btn tag-btn"
              :class="{ active: tagFilter === tag }"
              @click="tagFilter = tagFilter === tag ? '' : tag"
            >
              {{ tag }}
            </button>
          </div>
        </div>
      </div>

      <!-- 待办列表 -->
      <div class="todo-list">
        <div v-if="filteredTodos.length === 0" class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <p class="empty-title">
            {{ todos.length === 0 ? '暂无待办事项' : '没有匹配的任务' }}
          </p>
          <p class="empty-hint">
            {{ todos.length === 0 ? '在上方输入框添加你的第一个任务吧' : '尝试调整筛选条件' }}
          </p>
        </div>
        <TransitionGroup name="list">
          <div
            v-for="todo in filteredTodos"
            :key="todo.id"
            class="todo-item"
            :class="{
              done: todo.done,
              overdue: isOverdue(todo),
              ['priority-' + todo.priority]: true,
            }"
          >
            <button class="checkbox" @click="toggleTodo(todo.id)">
              <svg v-if="todo.done" viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
                <path d="M20 6L9 17l-5-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <div class="todo-content">
              <!-- 编辑模式 -->
              <template v-if="editingId === todo.id">
                <div class="edit-form">
                  <input
                    v-model="editingText"
                    class="edit-input"
                    @keyup.enter="saveEdit(todo)"
                    @keyup.esc="cancelEdit"
                    autofocus
                  />
                  <div class="edit-options">
                    <select v-model="editingPriority" class="edit-select">
                      <option value="high">高优先级</option>
                      <option value="medium">中优先级</option>
                      <option value="low">低优先级</option>
                    </select>
                    <input v-model="editingDueDate" type="date" class="edit-date" />
                    <input
                      v-model="editingTags"
                      type="text"
                      placeholder="标签（逗号分隔）"
                      class="edit-tags"
                    />
                  </div>
                  <div class="edit-actions">
                    <button class="save-btn" @click="saveEdit(todo)">保存</button>
                    <button class="cancel-btn" @click="cancelEdit">取消</button>
                  </div>
                </div>
              </template>
              <!-- 显示模式 -->
              <template v-else>
                <div class="todo-main">
                  <span
                    class="todo-text"
                    @dblclick="startEdit(todo)"
                    v-html="renderMarkdown(todo.text)"
                  />
                </div>
                <div class="todo-meta">
                  <span class="priority-badge" :class="'p-' + todo.priority">
                    {{ priorityLabels[todo.priority] }}
                  </span>
                  <span v-if="todo.dueDate" class="due-date" :class="{ overdue: isOverdue(todo) }">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="12" height="12">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {{ formatDate(todo.dueDate) }}
                  </span>
                  <span v-for="tag in todo.tags" :key="tag" class="tag">{{ tag }}</span>
                </div>
              </template>
            </div>

            <div class="todo-actions">
              <button class="action-btn edit-btn" @click="startEdit(todo)" title="编辑">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="action-btn delete-btn" @click="deleteTodo(todo.id)" title="删除">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<style scoped>
.todo-page {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 2rem 1rem;
}

.todo-container {
  max-width: 680px;
  margin: 0 auto;
}

/* 头部 */
.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}

/* 统计区域 */
.stats-section {
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.875rem 0.75rem;
  text-align: center;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.stat-card.active .stat-value {
  color: var(--accent);
}

.stat-card.completed .stat-value {
  color: #22c55e;
}

.stat-card.overdue {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.stat-card.overdue .stat-value {
  color: #ef4444;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

/* 进度条 */
.progress-section {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.progress-percent {
  font-weight: 600;
  color: var(--accent);
}

.progress-bar {
  height: 6px;
  background: var(--bg-input);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), #22c55e);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* 主操作区 */
.main-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

/* 搜索框 */
.search-wrapper {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.625rem 1rem 0.625rem 2.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.875rem;
  box-sizing: border-box;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb, 59, 130, 246), 0.1);
}

/* 添加区域 */
.add-form-compact {
  display: flex;
  gap: 0.5rem;
}

.add-form-full {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.form-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.form-select,
.form-date,
.form-tags {
  padding: 0.5rem 0.75rem;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.8rem;
  flex: 1;
  min-width: 100px;
}

.form-select:focus,
.form-date:focus,
.form-tags:focus {
  outline: none;
  border-color: var(--accent);
}

.form-actions {
  display: flex;
  gap: 0.5rem;
}

.todo-input {
  flex: 1;
  padding: 0.625rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.todo-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb, 59, 130, 246), 0.1);
}

.add-btn {
  padding: 0.625rem 1.25rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s;
  flex-shrink: 0;
}

.add-btn:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.expand-btn {
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.expand-btn:hover {
  background: var(--bg-card-hover);
  color: var(--accent);
}

.cancel-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: var(--bg-card-hover);
}

/* 筛选区域 */
.filter-section {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.secondary-filters {
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-color);
}

.filter-group {
  display: flex;
  gap: 0.25rem;
}

.filter-btn {
  padding: 0.35rem 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.filter-btn:hover {
  background: var(--bg-card-hover);
}

.filter-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.filter-count {
  font-size: 0.7rem;
  opacity: 0.8;
}

.filter-btn.p-high.active {
  background: #ef4444;
  border-color: #ef4444;
}

.filter-btn.p-medium.active {
  background: #f59e0b;
  border-color: #f59e0b;
}

.filter-btn.p-low.active {
  background: #22c55e;
  border-color: #22c55e;
}

.tag-btn.active {
  background: var(--text-link);
  border-color: var(--text-link);
}

.clear-btn {
  margin-left: auto;
  padding: 0.35rem 0.75rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.clear-btn:hover {
  color: #ef4444;
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

/* 待办列表 */
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  opacity: 0.4;
}

.empty-title {
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 0.25rem 0;
  color: var(--text-secondary);
}

.empty-hint {
  font-size: 0.8rem;
  margin: 0;
}

/* 待办项 */
.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.todo-item.priority-high {
  border-left-color: #ef4444;
}

.todo-item.priority-medium {
  border-left-color: #f59e0b;
}

.todo-item.priority-low {
  border-left-color: #22c55e;
}

.todo-item:hover {
  background: var(--bg-card-hover);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.todo-item.overdue {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.03);
}

.todo-item.done {
  opacity: 0.55;
}

.todo-item.done:hover {
  opacity: 0.75;
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.2s;
  padding: 0;
}

.checkbox:hover {
  border-color: var(--accent);
}

.todo-item.done .checkbox {
  background: var(--accent);
  border-color: var(--accent);
}

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-main {
  margin-bottom: 0.375rem;
}

.todo-text {
  color: var(--text-primary);
  word-break: break-word;
  cursor: default;
  line-height: 1.5;
  font-size: 0.9rem;
}

.todo-item.done .todo-text {
  text-decoration: line-through;
  color: var(--text-muted);
}

.todo-text :deep(code) {
  background: rgba(0, 0, 0, 0.06);
  padding: 0.1em 0.3em;
  border-radius: 3px;
  font-size: 0.85em;
}

.todo-text :deep(a) {
  color: var(--text-link);
}

.todo-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  align-items: center;
}

.priority-badge {
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.priority-badge.p-high {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

.priority-badge.p-medium {
  background: rgba(245, 158, 11, 0.12);
  color: #d97706;
}

.priority-badge.p-low {
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
}

.due-date {
  font-size: 0.7rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.due-date.overdue {
  color: #ef4444;
  font-weight: 600;
}

.tag {
  font-size: 0.65rem;
  padding: 0.15rem 0.5rem;
  background: rgba(var(--text-link-rgb, 59, 130, 246), 0.1);
  color: var(--text-link);
  border-radius: 10px;
  font-weight: 500;
}

/* 操作按钮 */
.todo-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.todo-item:hover .todo-actions {
  opacity: 1;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
}

.edit-btn:hover {
  color: var(--text-link);
  background: rgba(var(--text-link-rgb, 59, 130, 246), 0.1);
}

.delete-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* 编辑表单 */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.edit-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: var(--bg-input);
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.9rem;
  box-sizing: border-box;
}

.edit-input:focus {
  outline: none;
}

.edit-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.edit-select,
.edit-date,
.edit-tags {
  padding: 0.4rem 0.6rem;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.8rem;
  flex: 1;
  min-width: 100px;
}

.edit-select:focus,
.edit-date:focus,
.edit-tags:focus {
  outline: none;
  border-color: var(--accent);
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

.save-btn {
  padding: 0.4rem 0.8rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s;
}

.save-btn:hover {
  background: var(--accent-hover);
}

/* 列表动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.list-move {
  transition: transform 0.3s ease;
}

/* 响应式 */
@media (max-width: 600px) {
  .todo-page {
    padding: 1.5rem 0.75rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-options {
    flex-direction: column;
  }

  .form-select,
  .form-date,
  .form-tags {
    min-width: unset;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    flex-wrap: wrap;
  }

  .clear-btn {
    margin-left: 0;
  }

  .todo-actions {
    opacity: 1;
  }
}
</style>
