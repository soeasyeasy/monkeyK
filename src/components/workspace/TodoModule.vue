<script setup lang="ts">
/**
 * 待办事项模块组件
 * 支持清单、标签、子任务、筛选、分组、排序、批量操作
 */
import { ref, computed, watch } from 'vue'
import { useTodos } from '../../composables/useTodos'
import { priorityOptions, projectOptions, tagSuggestions } from '../../data/workspace-defaults'
import WsIcon from './WsIcon.vue'
import Modal from './Modal.vue'
import MarkdownEditor from './MarkdownEditor.vue'
import MarkdownRenderer from '../MarkdownRenderer.vue'
import Pagination from './Pagination.vue'
import type { Todo } from '../../types/workspace'

const {
  todos,
  addTodo,
  deleteTodo,
  toggleTodo,
  updateTodo,
  addSubTodo,
  toggleSubTodo,
  deleteSubTodo,
  filterByStatus,
  filterByProject,
  filterByTag,
  searchTodos,
  groupByDueDate,
  sortTodos,
  completeAll,
  clearCompleted,
  getStats,
  getProjects,
  getTags,
  getWeekDailyStats,
  getMonthDailyStats,
  getYearMonthlyStats,
  getPeriodStats
} = useTodos()

// 添加表单
const newTodoText = ref('')
const newTodoPriority = ref<'high' | 'medium' | 'low'>('medium')
const newTodoDueDate = ref('')
const newTodoProject = ref('')
const newTodoTags = ref<string[]>([])
const newTodoNotes = ref('')
const showAddModal = ref(false)

const canAddTodo = computed(() => newTodoText.value.trim().length > 0)

function openAddModal() {
  showAddModal.value = true
}

function handleAddTodo() {
  if (!canAddTodo.value) return
  addTodo(
    newTodoText.value.trim(),
    newTodoPriority.value,
    newTodoDueDate.value,
    newTodoTags.value,
    newTodoProject.value,
    newTodoNotes.value
  )
  resetForm()
  showAddModal.value = false
}

function resetForm() {
  newTodoText.value = ''
  newTodoPriority.value = 'medium'
  newTodoDueDate.value = ''
  newTodoProject.value = ''
  newTodoTags.value = []
  newTodoNotes.value = ''
}

function toggleNewTag(tag: string) {
  if (newTodoTags.value.includes(tag)) {
    newTodoTags.value = newTodoTags.value.filter(t => t !== tag)
  } else {
    newTodoTags.value.push(tag)
  }
}

// 筛选与排序
const statusFilter = ref<'all' | 'active' | 'completed' | 'overdue'>('all')
const projectFilter = ref('')
const tagFilter = ref('')
const searchKeyword = ref('')
const sortBy = ref<'priority' | 'dueDate' | 'createdAt'>('priority')

const allProjects = computed(() => {
  const custom = getProjects().map(p => ({ value: p, label: p }))
  const base = projectOptions.filter(p => p.value)
  const map = new Map<string, string>()
  base.forEach(p => map.set(p.value, p.label))
  custom.forEach(p => map.set(p.value, p.label))
  return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
})

const allTags = computed(() => {
  const existing = getTags()
  return Array.from(new Set([...tagSuggestions, ...existing]))
})

const filteredTodos = computed(() => {
  let result = filterByStatus(statusFilter.value)
  if (projectFilter.value) result = result.filter(t => t.project === projectFilter.value)
  if (tagFilter.value) result = result.filter(t => t.tags.includes(tagFilter.value))
  if (searchKeyword.value.trim()) result = searchTodos(searchKeyword.value).filter(t => result.includes(t))
  return sortTodos(result, sortBy.value)
})

const groupedTodos = computed(() => groupByDueDate(filteredTodos.value))

// 分页（仅按实际待办条数分页）
const PAGE_SIZE = 5
const currentPage = ref(1)

// 扁平化待办列表（不含分组头）
const flatTodos = computed(() => {
  const todos: Todo[] = []
  const grouped = groupedTodos.value
  for (const key of groupOrder) {
    const group = grouped[key as keyof typeof grouped]
    if (group && group.length > 0) {
      todos.push(...group)
    }
  }
  return todos
})

const totalPages = computed(() => Math.ceil(flatTodos.value.length / PAGE_SIZE))

const pagedTodos = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return flatTodos.value.slice(start, start + PAGE_SIZE)
})

// 按分组重新组装（含分组头）
interface FlatItem {
  isGroupHeader: boolean
  groupKey?: string
  groupLabel?: string
  groupCount?: number
  todo?: Todo
}

const pagedItems = computed<FlatItem[]>(() => {
  const items: FlatItem[] = []
  const grouped = groupedTodos.value
  const pagedIds = new Set(pagedTodos.value.map(t => t.id))
  for (const key of groupOrder) {
    const group = grouped[key as keyof typeof grouped]
    if (group && group.length > 0) {
      const visibleTodos = group.filter(t => pagedIds.has(t.id))
      if (visibleTodos.length > 0) {
        items.push({ isGroupHeader: true, groupKey: key, groupLabel: groupLabels[key], groupCount: visibleTodos.length })
        for (const todo of visibleTodos) {
          items.push({ isGroupHeader: false, todo })
        }
      }
    }
  }
  return items
})

watch([statusFilter, projectFilter, tagFilter, searchKeyword, sortBy], () => {
  currentPage.value = 1
})

// 批量操作
function handleCompleteAll() {
  const ids = filteredTodos.value.filter(t => !t.done).map(t => t.id)
  if (ids.length) completeAll(ids)
}

// 弹窗详情/编辑
const showDetailModal = ref(false)
const showEditModal = ref(false)
const viewingTodo = ref<Todo | null>(null)
const editingTodo = ref<Todo | null>(null)

function openDetail(todo: Todo) {
  viewingTodo.value = JSON.parse(JSON.stringify(todo))
  showDetailModal.value = true
}

function openEdit(todo: Todo) {
  editingTodo.value = JSON.parse(JSON.stringify(todo))
  showEditModal.value = true
}

function closeDetail() {
  showDetailModal.value = false
  viewingTodo.value = null
}

function closeEdit() {
  showEditModal.value = false
  editingTodo.value = null
}

function saveAndCloseEdit() {
  if (!editingTodo.value) return
  updateTodo(editingTodo.value.id, {
    text: editingTodo.value.text,
    priority: editingTodo.value.priority,
    dueDate: editingTodo.value.dueDate,
    project: editingTodo.value.project,
    tags: editingTodo.value.tags,
    notes: editingTodo.value.notes
  })
  closeEdit()
}

const newSubTodoText = ref('')
function handleAddSubTodo(todoId: number) {
  if (!newSubTodoText.value.trim()) return
  addSubTodo(todoId, newSubTodoText.value.trim())
  newSubTodoText.value = ''
}

function toggleTag(tag: string) {
  if (!editingTodo.value) return
  const tags = editingTodo.value.tags
  if (tags.includes(tag)) {
    editingTodo.value.tags = tags.filter(t => t !== tag)
  } else {
    editingTodo.value.tags = [...tags, tag]
  }
}

function getPriorityColor(priority: string): string {
  return priorityOptions.find(p => p.value === priority)?.color || '#6b7280'
}

function getProjectLabel(value: string): string {
  return projectOptions.find(p => p.value === value)?.label || value || '无清单'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffTime = date.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '明天'
  if (diffDays === -1) return '昨天'
  if (diffDays < 0) return `已过期 ${Math.abs(diffDays)} 天`
  if (diffDays <= 7) return `${diffDays} 天后`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const stats = computed(() => getStats())
const completionRate = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((stats.value.completed / stats.value.total) * 100)
})

// 统计周期选择
type StatsPeriod = 'week' | 'month' | 'year'
const statsPeriod = ref<StatsPeriod>('week')

const now = new Date()
const statsYear = ref(now.getFullYear())
const statsMonth = ref(now.getMonth() + 1)

const periodStats = computed(() => getPeriodStats(statsPeriod.value, statsYear.value, statsMonth.value))

const periodRate = computed(() => periodStats.value.rate)

const chartData = computed(() => {
  if (statsPeriod.value === 'week') {
    return getWeekDailyStats().map(d => ({
      label: d.label,
      completed: d.completed,
      total: d.total
    }))
  } else if (statsPeriod.value === 'month') {
    return getMonthDailyStats(statsYear.value, statsMonth.value).map(d => ({
      label: d.label,
      completed: d.completed,
      total: d.total
    }))
  } else {
    return getYearMonthlyStats(statsYear.value).map(d => ({
      label: d.label,
      completed: d.completed,
      total: d.total
    }))
  }
})

const chartMax = computed(() => Math.max(...chartData.value.map(d => d.total), 1))

const periodTitle = computed(() => {
  if (statsPeriod.value === 'week') return '最近 7 天'
  if (statsPeriod.value === 'month') return `${statsYear.value}年${statsMonth.value}月`
  return `${statsYear.value}年`
})

function circleDash(percent: number): string {
  const r = 28
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  return `${c} ${offset}`
}

const groupLabels: Record<string, string> = {
  overdue: '已过期',
  today: '今天',
  tomorrow: '明天',
  upcoming: '未来',
  noDate: '无截止日期'
}

const groupOrder = ['overdue', 'today', 'tomorrow', 'upcoming', 'noDate']
</script>

<template>
  <div class="todo-module">
    <!-- 顶部统计 -->
    <div class="todo-stats">
      <div class="stats-header">
        <span class="stats-period-title">{{ periodTitle }}</span>
        <div class="period-tabs">
          <button
            v-for="p in (['week', 'month', 'year'] as StatsPeriod[])"
            :key="p"
            class="period-tab"
            :class="{ active: statsPeriod === p }"
            @click="statsPeriod = p"
          >{{ p === 'week' ? '周' : p === 'month' ? '月' : '年' }}</button>
        </div>
      </div>
      <div class="stats-body">
        <div class="stats-ring">
          <svg class="ring-svg" viewBox="0 0 70 70">
            <circle cx="35" cy="35" r="28" class="ring-bg" />
            <circle cx="35" cy="35" r="28" class="ring-fill" :stroke-dasharray="circleDash(periodRate)" />
          </svg>
          <div class="ring-center">
            <span class="ring-pct">{{ periodRate }}%</span>
            <span class="ring-label">完成率</span>
          </div>
        </div>
        <div class="stats-numbers">
          <div class="stat-item">
            <span class="stat-value">{{ periodStats.total }}</span>
            <span class="stat-label">总计</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ periodStats.active }}</span>
            <span class="stat-label">待完成</span>
          </div>
          <div class="stat-item">
            <span class="stat-value completed">{{ periodStats.completed }}</span>
            <span class="stat-label">已完成</span>
          </div>
          <div class="stat-item" v-if="periodStats.overdue > 0">
            <span class="stat-value overdue">{{ periodStats.overdue }}</span>
            <span class="stat-label">已过期</span>
          </div>
        </div>
      </div>
      <!-- 完成趋势柱状图 -->
      <div class="todo-chart" :class="{ 'month-chart': statsPeriod === 'month' }">
        <div v-for="(item, idx) in chartData" :key="idx" class="chart-col">
          <div class="chart-bar-wrap">
            <div class="chart-bar-bg">
              <div
                class="chart-bar"
                :style="{ height: `${(item.total / chartMax) * 100}%` }"
              ></div>
              <div
                class="chart-bar-done"
                :style="{ height: `${(item.completed / chartMax) * 100}%` }"
              ></div>
            </div>
          </div>
          <span class="chart-label" :class="{ 'hide-odd': statsPeriod === 'month' }">{{ item.label }}</span>
        </div>
      </div>
      <div class="stats-actions" v-if="todos.length > 0">
        <button class="action-btn" @click="handleCompleteAll">
          <WsIcon name="check" :size="14" />
          全部完成
        </button>
        <button class="action-btn danger" @click="clearCompleted">
          <WsIcon name="x" :size="14" />
          清空已完成
        </button>
      </div>
    </div>

    <!-- 添加表单 -->
    <div class="add-todo-section">
      <button class="add-toggle-btn" @click="openAddModal">
        <WsIcon name="plus" :size="16" />
        添加新待办
      </button>
      <Modal
        title="添加新待办"
        :visible="showAddModal"
        :confirm-disabled="!canAddTodo"
        @close="showAddModal = false; resetForm()"
        @confirm="handleAddTodo"
      >
        <div class="modal-form">
          <div class="form-group">
            <label>任务内容</label>
            <MarkdownEditor v-model="newTodoText" placeholder="例如：完成项目周报..." :rows="2" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>优先级</label>
              <div class="priority-picker">
                <button
                  v-for="p in priorityOptions"
                  :key="p.value"
                  class="priority-option"
                  :class="{ active: newTodoPriority === p.value }"
                  :style="{ '--priority-color': p.color }"
                  @click="newTodoPriority = p.value"
                >
                  <span class="priority-dot"></span>
                  {{ p.label }}
                </button>
              </div>
            </div>
            <div class="form-group">
              <label>截止日期</label>
              <input v-model="newTodoDueDate" type="date" class="detail-input" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>所属清单</label>
              <select v-model="newTodoProject" class="detail-input">
                <option value="">无清单</option>
                <option v-for="p in allProjects" :key="p.value" :value="p.value">{{ p.label }}</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>标签</label>
            <div class="tag-picker">
              <button
                v-for="tag in allTags"
                :key="tag"
                class="tag-option"
                :class="{ active: newTodoTags.includes(tag) }"
                @click="toggleNewTag(tag)"
              >{{ tag }}</button>
            </div>
          </div>
          <div class="form-group">
            <label>备注</label>
            <MarkdownEditor v-model="newTodoNotes" placeholder="添加备注，支持 Markdown..." :rows="3" />
          </div>
        </div>
      </Modal>
    </div>

    <!-- 筛选与排序 -->
    <div class="filter-bar" v-if="todos.length > 0">
      <div class="filter-group">
        <select v-model="statusFilter" class="filter-select">
          <option value="all">全部</option>
          <option value="active">进行中</option>
          <option value="completed">已完成</option>
          <option value="overdue">已过期</option>
        </select>
        <select v-model="projectFilter" class="filter-select">
          <option value="">所有清单</option>
          <option v-for="p in allProjects" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
        <select v-model="tagFilter" class="filter-select">
          <option value="">所有标签</option>
          <option v-for="tag in allTags" :key="tag" :value="tag">{{ tag }}</option>
        </select>
        <select v-model="sortBy" class="filter-select">
          <option value="priority">按优先级</option>
          <option value="dueDate">按截止日期</option>
          <option value="createdAt">按创建时间</option>
        </select>
      </div>
      <div class="search-box">
        <WsIcon name="search" :size="14" />
        <input v-model="searchKeyword" type="text" placeholder="搜索待办..." class="search-input" />
      </div>
    </div>

    <!-- 待办列表 -->
    <div class="todo-list">
      <template v-if="filteredTodos.length === 0">
        <div class="empty-state">
          <WsIcon name="checklist" :size="48" />
          <span>暂无符合条件的待办事项</span>
        </div>
      </template>

      <template v-for="(item, idx) in pagedItems" :key="item.isGroupHeader ? 'g-' + item.groupKey : item.todo!.id">
        <div v-if="item.isGroupHeader" class="todo-group">
          <div class="group-header">
            <span class="group-title">{{ item.groupLabel }}</span>
            <span class="group-count">{{ item.groupCount }}</span>
          </div>
        </div>
        <div
          v-else
          class="todo-item"
          :class="{ completed: item.todo!.done, overdue: item.todo!.dueDate && new Date(item.todo!.dueDate) < new Date(new Date().toDateString()) }"
          :style="{ '--priority-color': getPriorityColor(item.todo!.priority) }"
        >
          <label class="todo-check" @click.stop>
            <input type="checkbox" :checked="item.todo!.done" @change="toggleTodo(item.todo!.id)" />
            <span class="checkmark"></span>
          </label>
          <div class="todo-content" @click="openDetail(item.todo!)">
            <div class="todo-text">
              <MarkdownRenderer :content="item.todo!.text" />
            </div>
            <div class="todo-meta">
              <span class="priority-dot"></span>
              <span class="priority-name">{{ priorityOptions.find(p => p.value === item.todo!.priority)?.label }}</span>
              <span v-if="item.todo!.dueDate" class="due-date">{{ formatDate(item.todo!.dueDate) }}</span>
              <span v-if="item.todo!.project" class="project-badge">{{ getProjectLabel(item.todo!.project) }}</span>
              <span v-for="tag in item.todo!.tags" :key="tag" class="tag-badge">{{ tag }}</span>
              <span v-if="item.todo!.subtasks.length > 0" class="subtask-count">
                {{ item.todo!.subtasks.filter(s => s.done).length }}/{{ item.todo!.subtasks.length }}
              </span>
            </div>
          </div>
          <button @click.stop="openEdit(item.todo!)" class="edit-btn" title="编辑">
            <WsIcon name="edit" :size="14" />
          </button>
          <button @click.stop="deleteTodo(item.todo!.id)" class="delete-btn" title="删除">
            <WsIcon name="x" :size="14" />
          </button>
        </div>
      </template>

      <Pagination
        v-model:current-page="currentPage"
        :total-pages="totalPages"
        :total="flatTodos.length"
      />
    </div>

    <!-- 详情弹窗 -->
    <Modal
      title="待办详情"
      :visible="showDetailModal"
      confirm-text="编辑"
      cancel-text="关闭"
      @close="closeDetail"
      @confirm="if (viewingTodo) { closeDetail(); openEdit(viewingTodo) }"
    >
      <div class="modal-detail" v-if="viewingTodo">
        <div class="detail-row">
          <label>任务</label>
          <div class="detail-preview">
            <MarkdownRenderer :content="viewingTodo.text" />
          </div>
        </div>
        <div class="detail-row">
          <label>优先级</label>
          <span class="detail-preview-text">{{ priorityOptions.find(p => p.value === viewingTodo!.priority)?.label }}</span>
        </div>
        <div class="detail-row">
          <label>截止日期</label>
          <span class="detail-preview-text">{{ viewingTodo.dueDate || '无' }}</span>
        </div>
        <div class="detail-row">
          <label>清单</label>
          <span class="detail-preview-text">{{ getProjectLabel(viewingTodo.project) }}</span>
        </div>
        <div class="detail-row">
          <label>标签</label>
          <div class="detail-preview-text">
            <span v-if="viewingTodo.tags.length === 0" class="text-muted">无</span>
            <span v-for="tag in viewingTodo.tags" :key="tag" class="tag-badge">{{ tag }}</span>
          </div>
        </div>
        <div class="detail-row" v-if="viewingTodo.notes">
          <label>备注</label>
          <div class="detail-preview">
            <MarkdownRenderer :content="viewingTodo.notes" />
          </div>
        </div>
        <div class="detail-row" v-if="viewingTodo.subtasks.length > 0">
          <label>子任务</label>
          <div v-for="sub in viewingTodo.subtasks" :key="sub.id" class="subtask-item">
            <label class="subtask-check">
              <input type="checkbox" :checked="sub.done" @change="toggleSubTodo(viewingTodo!.id, sub.id)" />
              <span class="checkmark small"></span>
            </label>
            <span class="subtask-text" :class="{ done: sub.done }">{{ sub.text }}</span>
          </div>
        </div>
      </div>
    </Modal>

    <!-- 编辑弹窗 -->
    <Modal
      title="编辑待办"
      :visible="showEditModal"
      confirm-text="保存"
      cancel-text="取消"
      :confirm-disabled="!editingTodo?.text.trim()"
      @close="closeEdit"
      @confirm="saveAndCloseEdit"
    >
      <div class="modal-form" v-if="editingTodo">
        <div class="form-group">
          <label>任务内容</label>
          <MarkdownEditor v-model="editingTodo.text" :rows="2" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>优先级</label>
            <select v-model="editingTodo.priority" class="detail-input">
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
          <div class="form-group">
            <label>截止日期</label>
            <input v-model="editingTodo.dueDate" type="date" class="detail-input" />
          </div>
        </div>
        <div class="form-group">
          <label>所属清单</label>
          <select v-model="editingTodo.project" class="detail-input">
            <option value="">无清单</option>
            <option v-for="p in allProjects" :key="p.value" :value="p.value">{{ p.label }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>标签</label>
          <div class="tag-picker">
            <button
              v-for="tag in allTags"
              :key="tag"
              class="tag-option"
              :class="{ active: editingTodo.tags.includes(tag) }"
              @click="toggleTag(tag)"
            >{{ tag }}</button>
          </div>
        </div>
        <div class="form-group">
          <label>备注</label>
          <textarea v-model="editingTodo.notes" class="detail-textarea" rows="2"></textarea>
        </div>
        <div class="form-group" v-if="editingTodo.subtasks.length > 0">
          <label>子任务</label>
          <div v-for="sub in editingTodo.subtasks" :key="sub.id" class="subtask-item">
            <label class="subtask-check">
              <input type="checkbox" :checked="sub.done" @change="toggleSubTodo(editingTodo!.id, sub.id)" />
              <span class="checkmark small"></span>
            </label>
            <span class="subtask-text" :class="{ done: sub.done }">{{ sub.text }}</span>
            <button class="subtask-delete" @click="deleteSubTodo(editingTodo!.id, sub.id)">
              <WsIcon name="x" :size="12" />
            </button>
          </div>
          <div class="subtask-add">
            <input
              v-model="newSubTodoText"
              type="text"
              placeholder="添加子任务..."
              class="detail-input"
              @keyup.enter="handleAddSubTodo(editingTodo!.id)"
            />
            <button class="add-btn small" @click="handleAddSubTodo(editingTodo!.id)">添加</button>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.todo-module {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.todo-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-card);
  border-radius: var(--radius-md);
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-period-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.period-tabs {
  display: flex;
  gap: 0.25rem;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  padding: 2px;
}

.period-tab {
  padding: 0.2rem 0.6rem;
  font-size: 0.72rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
  font-weight: 500;
}

.period-tab:hover {
  color: var(--text-primary);
}

.period-tab.active {
  background: var(--accent);
  color: white;
}

.stats-body {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.stats-ring {
  position: relative;
  width: 70px;
  height: 70px;
  flex-shrink: 0;
}

.ring-svg {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.ring-bg {
  fill: none;
  stroke: var(--border-color);
  stroke-width: 5;
}

.ring-fill {
  fill: none;
  stroke: var(--accent);
  stroke-width: 5;
  stroke-linecap: round;
  transition: stroke-dasharray 0.5s ease;
}

.ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ring-pct {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.ring-label {
  font-size: 0.55rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.stats-numbers {
  flex: 1;
  display: flex;
  gap: 1rem;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
}

.stat-value.completed { color: #22c55e; }
.stat-value.overdue { color: #ef4444; }

.stat-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.stats-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.7rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-hover);
}

.action-btn.danger:hover {
  border-color: #ef4444;
  color: #ef4444;
}

/* 完成趋势柱状图 */
.todo-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.4rem;
  height: 56px;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-color);
}

.todo-chart .chart-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.todo-chart .chart-bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 40px;
}

.chart-bar-bg {
  position: relative;
  width: 14px;
  height: 100%;
}

.chart-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: var(--bg-input);
  border-radius: 3px 3px 0 0;
  transition: height 0.3s ease;
  min-height: 2px;
}

.chart-bar-done {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: var(--accent);
  border-radius: 3px 3px 0 0;
  transition: height 0.3s ease;
  min-height: 0;
}

.chart-label {
  font-size: 0.6rem;
  color: var(--text-secondary);
}

.todo-chart.month-chart {
  gap: 0.1rem;
}

.todo-chart.month-chart .chart-col {
  min-width: 0;
}

.todo-chart.month-chart .chart-bar-bg {
  width: 6px;
}

.todo-chart.month-chart .chart-label {
  font-size: 0.5rem;
}

.hide-odd {
  visibility: hidden;
}

.hide-odd:nth-child(5n) {
  visibility: visible;
}

.add-todo-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.add-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.65rem;
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s;
}

.add-toggle-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group label {
  font-size: 0.72rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.priority-picker {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.priority-option {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-secondary);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
}

.priority-option:hover {
  background: var(--bg-card-hover);
}

.priority-option.active {
  border-color: var(--priority-color);
  color: var(--priority-color);
  background: rgba(from var(--priority-color) r g b / 0.1);
}

.todo-input,
.priority-select,
.date-input,
.project-select,
.filter-select,
.search-input,
.detail-input,
.detail-textarea {
  padding: 0.4rem 0.65rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.825rem;
  outline: none;
}

.todo-input:focus,
.priority-select:focus,
.date-input:focus,
.project-select:focus,
.filter-select:focus,
.search-input:focus,
.detail-input:focus,
.detail-textarea:focus {
  border-color: var(--accent);
}

.todo-input {
  min-width: 180px;
}

.tag-picker {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tag-option {
  padding: 0.25rem 0.55rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-secondary);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
}

.tag-option.active {
  background: var(--accent-light);
  border-color: var(--accent);
  color: var(--accent);
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.add-btn,
.cancel-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn {
  background: var(--accent);
  color: white;
}

.add-btn:hover {
  opacity: 0.9;
}

.add-btn.small {
  padding: 0.35rem 0.7rem;
  font-size: 0.8rem;
}

.cancel-btn {
  background: var(--bg-input);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.cancel-btn:hover {
  background: var(--bg-card-hover);
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.7rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-secondary);
}

.search-input {
  border: none;
  background: transparent;
  padding: 0;
  width: 140px;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  opacity: 0.6;
}

.todo-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.2rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.group-title {
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.group-count {
  padding: 0.1rem 0.4rem;
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
}

.todo-item {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--priority-color, var(--border-color));
  transition: all 0.2s;
}

.todo-item:hover {
  background: var(--bg-card-hover);
}

.todo-item.completed {
  opacity: 0.55;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
}

.todo-item.overdue {
  border-left-color: #ef4444;
}

.todo-check {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 0.15rem;
}

.todo-check input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkmark.small {
  width: 14px;
  height: 14px;
}

.todo-check input:checked + .checkmark {
  background: var(--accent);
  border-color: var(--accent);
}

.todo-check input:checked + .checkmark::after {
  content: '';
  width: 5px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin-top: -2px;
}

.todo-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  cursor: pointer;
}

.todo-text :deep(.markdown-body) {
  font-size: 0.875rem;
  color: var(--text-primary);
  line-height: 1.4;
}

.todo-text :deep(.markdown-body p) {
  margin: 0;
}

.todo-text :deep(.markdown-body p + p) {
  margin-top: 0.25rem;
}

.todo-text {
  font-size: 0.875rem;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-meta {
  display: flex;
  gap: 0.4rem;
  align-items: center;
  flex-wrap: wrap;
  font-size: 0.7rem;
}

.priority-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--priority-color, var(--text-secondary));
  flex-shrink: 0;
}

.priority-name {
  color: var(--text-secondary);
}

.due-date {
  color: var(--text-secondary);
}

.project-badge,
.tag-badge {
  padding: 0.1rem 0.35rem;
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-secondary);
  font-size: 0.65rem;
}

.subtask-count {
  color: var(--accent);
  font-size: 0.65rem;
}

.edit-btn,
.delete-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.3rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.edit-btn {
  opacity: 0;
}

.todo-item:hover .edit-btn {
  opacity: 1;
}

.edit-btn:hover {
  background: var(--accent-light);
  color: var(--accent);
}

.delete-btn {
  opacity: 0;
}

.todo-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.detail-textarea {
  resize: vertical;
  font-family: inherit;
}

@media (max-width: 768px) {
  .add-todo-form {
    grid-template-columns: 1fr;
  }
}
</style>
