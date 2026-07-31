<script setup lang="ts">
/**
 * 目标模块组件
 * 支持关键结果 KR、状态筛选、动态、完成估算
 */
import { ref, computed, watch } from 'vue'
import { useGoals } from '../../composables/useGoals'
import { goalTypes } from '../../data/workspace-defaults'
import WsIcon from './WsIcon.vue'
import Modal from './Modal.vue'
import MarkdownEditor from './MarkdownEditor.vue'
import Pagination from './Pagination.vue'
import type { KeyResult } from '../../types/workspace'

const {
  goals,
  addGoal,
  deleteGoal,
  updateGoalProgress,
  addKeyResult,
  updateKeyResultProgress,
  deleteKeyResult,
  filterByStatus,
  estimateCompletion,
  getRecentActivity,
  getStats
} = useGoals()

const showAddModal = ref(false)
const newTitle = ref('')
const newDescription = ref('')
const newType = ref<'yearly' | 'quarterly' | 'monthly' | 'weekly'>('monthly')
const newDeadline = ref('')

const statusFilter = ref<'all' | 'active' | 'completed' | 'overdue'>('all')
const expandedGoalId = ref<number | null>(null)
const newKrText = ref('')

const canAddGoal = computed(() => newTitle.value.trim().length > 0)

function openAddModal() {
  showAddModal.value = true
}

function handleAddGoal() {
  if (!canAddGoal.value) return
  addGoal(newTitle.value.trim(), newDescription.value.trim(), newType.value, newDeadline.value)
  resetForm()
  showAddModal.value = false
}

function resetForm() {
  newTitle.value = ''
  newDescription.value = ''
  newType.value = 'monthly'
  newDeadline.value = ''
}

function handleProgressChange(goalId: number, event: Event) {
  const target = event.target as HTMLInputElement
  const progress = parseInt(target.value)
  updateGoalProgress(goalId, progress)
}

function handleKrProgressChange(goalId: number, krId: number, event: Event) {
  const target = event.target as HTMLInputElement
  const progress = parseInt(target.value)
  updateKeyResultProgress(goalId, krId, progress)
}

function handleAddKeyResult(goalId: number) {
  if (!newKrText.value.trim()) return
  addKeyResult(goalId, newKrText.value.trim())
  newKrText.value = ''
}

function toggleExpand(goalId: number) {
  expandedGoalId.value = expandedGoalId.value === goalId ? null : goalId
}

function getGoalTypeName(type: string): string {
  return goalTypes.find(t => t.value === type)?.label || type
}

function getDaysUntilDeadline(deadline: string): number | null {
  if (!deadline) return null
  const deadlineDate = new Date(deadline)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  deadlineDate.setHours(0, 0, 0, 0)
  return Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatEstimate(days: number | null): string {
  if (days === null) return '无法估算'
  if (days <= 0) return '即将完成'
  return `预计 ${days} 天后完成`
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

const filteredGoals = computed(() => filterByStatus(statusFilter.value))

// 分页
const PAGE_SIZE = 10
const currentPage = ref(1)
const totalPages = computed(() => Math.ceil(filteredGoals.value.length / PAGE_SIZE))
const pagedGoals = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredGoals.value.slice(start, start + PAGE_SIZE)
})
watch(statusFilter, () => { currentPage.value = 1 })

const recentActivity = computed(() => getRecentActivity(5))
const stats = computed(() => getStats())
</script>

<template>
  <div class="goal-module">
    <div class="goal-stats">
      <div class="stat-item">
        <span class="stat-value">{{ stats.active }}</span>
        <span class="stat-label">进行中</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.completed }}</span>
        <span class="stat-label">已完成</span>
      </div>
      <div class="stat-item" v-if="stats.overdue > 0">
        <span class="stat-value overdue">{{ stats.overdue }}</span>
        <span class="stat-label">已过期</span>
      </div>
    </div>

    <div class="goal-toolbar">
      <select v-model="statusFilter" class="filter-select">
        <option value="all">全部目标</option>
        <option value="active">进行中</option>
        <option value="completed">已完成</option>
        <option value="overdue">已过期</option>
      </select>
      <button @click="openAddModal" class="add-goal-btn">
        <WsIcon name="plus" :size="16" />
        添加目标
      </button>
    </div>

    <Modal
      title="添加新目标"
      :visible="showAddModal"
      :confirm-disabled="!canAddGoal"
      @close="showAddModal = false; resetForm()"
      @confirm="handleAddGoal"
    >
      <div class="modal-form">
        <div class="form-group">
          <label>目标名称</label>
          <input v-model="newTitle" type="text" class="form-input" placeholder="例如：完成项目交付" @keyup.enter="handleAddGoal" autofocus />
        </div>
        <div class="form-group">
          <label>描述（可选）</label>
          <MarkdownEditor v-model="newDescription" placeholder="详细描述你的目标，支持 Markdown..." :rows="3" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>目标类型</label>
            <select v-model="newType" class="form-select">
              <option v-for="type in goalTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>截止日期（可选）</label>
            <input v-model="newDeadline" type="date" class="form-input" />
          </div>
        </div>
      </div>
    </Modal>

    <!-- 最近动态 -->
    <div v-if="recentActivity.length > 0" class="activity-card">
      <div class="activity-title">最近动态</div>
      <div v-for="activity in recentActivity" :key="activity.goalId + '-' + activity.time" class="activity-item">
        <span class="activity-goal">{{ activity.title }}</span>
        <span class="activity-text">{{ activity.text }}</span>
        <span class="activity-time">{{ formatTime(activity.time) }}</span>
      </div>
    </div>

    <div class="goal-list">
      <div
        v-for="goal in pagedGoals"
        :key="goal.id"
        class="goal-item"
        :class="{ completed: goal.progress >= 100 }"
      >
        <div class="goal-header">
          <div class="goal-title">{{ goal.title }}</div>
          <div class="goal-badges">
            <div class="goal-type-badge">{{ getGoalTypeName(goal.type) }}</div>
            <button @click="deleteGoal(goal.id)" class="delete-btn" title="删除目标">
              <WsIcon name="trash" :size="16" />
            </button>
          </div>
        </div>

        <div class="goal-description" v-if="goal.description">{{ goal.description }}</div>

        <div class="goal-progress">
          <div class="progress-header">
            <span class="progress-label">总进度</span>
            <span class="progress-value">{{ goal.progress }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: goal.progress + '%' }" :class="{ completed: goal.progress >= 100 }"></div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            :value="goal.progress"
            @input="handleProgressChange(goal.id, $event)"
            class="progress-slider"
          />
        </div>

        <!-- 关键结果 -->
        <div v-if="goal.keyResults.length > 0" class="kr-section">
          <div class="kr-title">关键结果</div>
          <div v-for="kr in goal.keyResults" :key="kr.id" class="kr-item">
            <span class="kr-text">{{ kr.title }}</span>
            <div class="kr-progress">
              <div class="kr-bar">
                <div class="kr-fill" :style="{ width: kr.progress + '%' }"></div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                :value="kr.progress"
                @input="handleKrProgressChange(goal.id, kr.id, $event)"
                class="kr-slider"
              />
              <span class="kr-value">{{ kr.progress }}%</span>
            </div>
            <button class="kr-delete" @click="deleteKeyResult(goal.id, kr.id)">
              <WsIcon name="x" :size="12" />
            </button>
          </div>
        </div>

        <div v-if="expandedGoalId === goal.id" class="kr-add">
          <input
            v-model="newKrText"
            type="text"
            placeholder="添加关键结果..."
            class="form-input"
            @keyup.enter="handleAddKeyResult(goal.id)"
          />
          <button class="confirm-btn small" @click="handleAddKeyResult(goal.id)">添加</button>
        </div>

        <div class="goal-footer">
          <span v-if="goal.deadline" class="deadline" :class="{ overdue: getDaysUntilDeadline(goal.deadline) !== null && getDaysUntilDeadline(goal.deadline)! < 0 }">
            <WsIcon name="clock" :size="14" />
            <span v-if="getDaysUntilDeadline(goal.deadline) !== null">
              <template v-if="getDaysUntilDeadline(goal.deadline)! < 0">已过期 {{ Math.abs(getDaysUntilDeadline(goal.deadline)!) }} 天</template>
              <template v-else-if="getDaysUntilDeadline(goal.deadline) === 0">今天截止</template>
              <template v-else>还剩 {{ getDaysUntilDeadline(goal.deadline) }} 天</template>
            </span>
          </span>
          <span class="estimate">{{ formatEstimate(estimateCompletion(goal.id)) }}</span>
          <button class="toggle-kr-btn" @click="toggleExpand(goal.id)">
            {{ expandedGoalId === goal.id ? '收起' : 'KR 管理' }}
          </button>
        </div>
      </div>
      <div v-if="filteredGoals.length === 0" class="empty-state">
        <WsIcon name="target" :size="48" />
        <span>暂无符合条件的目标</span>
      </div>
      <Pagination
        v-model:current-page="currentPage"
        :total-pages="totalPages"
        :total="filteredGoals.length"
      />
    </div>
  </div>
</template>

<style scoped>
.goal-module {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.goal-stats {
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--bg-card);
  border-radius: var(--radius-md);
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
}

.stat-value.overdue { color: #ef4444; }

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.goal-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.add-goal-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.add-goal-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
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

.form-label {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 500;
}

.form-input,
.form-textarea,
.form-select {
  padding: 0.4rem 0.65rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.825rem;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: var(--accent);
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
}

.confirm-btn,
.cancel-btn {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.confirm-btn {
  background: var(--accent);
  color: white;
}

.confirm-btn:hover { opacity: 0.9; }

.confirm-btn.small {
  flex: none;
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
}

.cancel-btn {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.cancel-btn:hover { background: var(--bg-card); }

.activity-card {
  padding: 1rem;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.activity-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.activity-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.8rem;
  flex-wrap: wrap;
}

.activity-goal {
  color: var(--text-primary);
  font-weight: 500;
}

.activity-text {
  color: var(--text-secondary);
}

.activity-time {
  margin-left: auto;
  color: var(--text-secondary);
  font-size: 0.7rem;
}

.goal-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.goal-item {
  position: relative;
  padding: 1rem;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.goal-item:hover {
  background: var(--bg-card-hover);
}

.goal-item.completed {
  background: var(--accent-light);
  border: 1px solid var(--accent);
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.goal-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.goal-badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.goal-type-badge {
  padding: 0.25rem 0.5rem;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.goal-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.goal-progress {
  margin-bottom: 0.75rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.progress-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--accent);
}

.progress-bar {
  height: 8px;
  background: var(--bg-card-hover);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.3s ease;
}

.progress-fill.completed { background: #22c55e; }

.progress-slider {
  width: 100%;
  height: 4px;
  background: transparent;
  appearance: none;
  cursor: pointer;
}

.progress-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.progress-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.kr-section {
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.kr-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.kr-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.kr-text {
  flex: 1;
  font-size: 0.8rem;
  color: var(--text-primary);
  min-width: 80px;
}

.kr-progress {
  flex: 2;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.kr-bar {
  flex: 1;
  height: 5px;
  background: var(--bg-card-hover);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.kr-fill {
  height: 100%;
  background: var(--accent);
  border-radius: var(--radius-sm);
  transition: width 0.3s ease;
}

.kr-slider {
  flex: 1;
  appearance: none;
  height: 3px;
  background: transparent;
  cursor: pointer;
}

.kr-slider::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
}

.kr-value {
  font-size: 0.7rem;
  color: var(--text-secondary);
  width: 35px;
  text-align: right;
}

.kr-delete {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.2rem;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.kr-delete:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.kr-add {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.goal-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.deadline {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.deadline.overdue { color: #ef4444; }

.estimate {
  font-size: 0.75rem;
  color: var(--accent);
}

.toggle-kr-btn {
  margin-left: auto;
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-secondary);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
}

.toggle-kr-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.delete-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
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
</style>
