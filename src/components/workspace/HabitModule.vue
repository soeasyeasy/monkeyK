<script setup lang="ts">
/**
 * 习惯打卡模块组件
 * 支持本周打卡网格、统计、暂停/启用
 */
import { ref, computed, watch } from 'vue'
import { useHabits } from '../../composables/useHabits'
import { habitIcons } from '../../data/workspace-defaults'
import WsIcon from './WsIcon.vue'
import Modal from './Modal.vue'
import Pagination from './Pagination.vue'

const {
  habits,
  addHabit,
  deleteHabit,
  checkIn,
  uncheckToday,
  getStreak,
  isCompletedToday,
  getTodayCount,
  getWeeklyRecords,
  getCompletionRate,
  getTotalCheckIns,
  toggleActive
} = useHabits()

const showAddModal = ref(false)
const newHabitName = ref('')
const newHabitIcon = ref('target')
const newHabitFrequency = ref<'daily' | 'weekly'>('daily')
const newHabitTarget = ref(1)
const showPaused = ref(false)

const canAddHabit = computed(() => newHabitName.value.trim().length > 0)

function openAddModal() {
  showAddModal.value = true
}

function handleAddHabit() {
  if (!canAddHabit.value) return
  addHabit(
    newHabitName.value.trim(),
    newHabitIcon.value,
    newHabitFrequency.value,
    newHabitTarget.value
  )
  resetForm()
  showAddModal.value = false
}

function resetForm() {
  newHabitName.value = ''
  newHabitIcon.value = 'target'
  newHabitFrequency.value = 'daily'
  newHabitTarget.value = 1
}

const visibleHabits = computed(() => {
  if (showPaused.value) return habits.value.filter(h => !h.active)
  return habits.value.filter(h => h.active)
})

// 分页
const PAGE_SIZE = 10
const currentPage = ref(1)
const totalPages = computed(() => Math.ceil(visibleHabits.value.length / PAGE_SIZE))
const pagedHabits = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return visibleHabits.value.slice(start, start + PAGE_SIZE)
})
watch(showPaused, () => { currentPage.value = 1 })

const today = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })

const activeCount = computed(() => habits.value.filter(h => h.active).length)
const completedCount = computed(() => habits.value.filter(h => h.active && isCompletedToday(h.id)).length)
const completionRate = computed(() => {
  if (activeCount.value === 0) return 0
  return Math.round((completedCount.value / activeCount.value) * 100)
})

const weekDays = computed(() => {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  const today = new Date()
  const result: { label: string; date: string }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().slice(0, 10) as string
    result.push({
      label: days[date.getDay()] as string,
      date: dateStr
    })
  }
  return result
})

function getDayRecord(habitId: number, date: string): boolean {
  const habit = habits.value.find(h => h.id === habitId)
  if (!habit) return false
  const record = habit.records.find(r => r.date === date)
  return record ? record.completed : false
}

const weeklyHeatmap = computed(() => {
  const days = weekDays.value
  return days.map(day => {
    const completed = habits.value
      .filter(h => h.active)
      .filter(h => getDayRecord(h.id, day.date)).length
    const total = activeCount.value
    return { ...day, completed, total }
  })
})
</script>

<template>
  <div class="habit-module">
    <div class="habit-header">
      <div class="header-left">
        <span class="today-date">{{ today }}</span>
        <span class="completion-badge" :class="{ done: completionRate === 100 }">
          {{ completedCount }}/{{ activeCount }} 完成
        </span>
      </div>
      <button @click="openAddModal" class="add-habit-btn">
        <WsIcon name="plus" :size="14" />
        添加习惯
      </button>
    </div>

    <!-- 本周热力条 -->
    <div class="weekly-heatmap">
      <div v-for="day in weeklyHeatmap" :key="day.date" class="heat-day">
        <span class="heat-label">{{ day.label }}</span>
        <div class="heat-bar">
          <div
            class="heat-fill"
            :style="{ height: day.total > 0 ? `${(day.completed / day.total) * 100}%` : '0%' }"
          />
        </div>
        <span class="heat-count">{{ day.completed }}</span>
      </div>
    </div>

    <Modal
      title="添加新习惯"
      :visible="showAddModal"
      :confirm-disabled="!canAddHabit"
      @close="showAddModal = false; resetForm()"
      @confirm="handleAddHabit"
    >
      <div class="modal-form">
        <div class="form-group">
          <label>习惯名称</label>
          <input
            v-model="newHabitName"
            type="text"
            placeholder="例如：阅读 30 分钟..."
            class="habit-input"
            @keyup.enter="handleAddHabit"
            autofocus
          />
        </div>
        <div class="form-group">
          <label>图标</label>
          <div class="icon-selector">
            <button
              v-for="icon in habitIcons"
              :key="icon"
              @click="newHabitIcon = icon"
              class="icon-btn"
              :class="{ active: newHabitIcon === icon }"
              :title="icon"
            >
              <WsIcon :name="icon" :size="18" />
            </button>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>频率</label>
            <select v-model="newHabitFrequency" class="frequency-select">
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
            </select>
          </div>
          <div class="form-group">
            <label>目标次数</label>
            <input
              v-model.number="newHabitTarget"
              type="number"
              min="1"
              placeholder="目标次数"
              class="target-input"
            />
          </div>
        </div>
      </div>
    </Modal>

    <div class="habit-list-header">
      <span class="list-title">{{ showPaused ? '已暂停' : '进行中' }}</span>
      <button class="toggle-paused" @click="showPaused = !showPaused">
        {{ showPaused ? '返回进行中' : `查看已暂停 (${habits.filter(h => !h.active).length})` }}
      </button>
    </div>

    <div class="habit-list">
      <div
        v-for="habit in pagedHabits"
        :key="habit.id"
        class="habit-item"
        :class="{ completed: isCompletedToday(habit.id), paused: !habit.active }"
      >
        <div class="habit-icon-wrap">
          <WsIcon :name="habit.icon" :size="20" />
        </div>
        <div class="habit-info">
          <div class="habit-name">{{ habit.name }}</div>
          <div class="habit-stats">
            <span class="streak" v-if="getStreak(habit.id) > 0">
              <WsIcon name="flame" :size="12" />
              {{ getStreak(habit.id) }} 天
            </span>
            <span class="stat">完成率 {{ getCompletionRate(habit.id) }}%</span>
            <span class="stat">累计 {{ getTotalCheckIns(habit.id) }} 次</span>
            <span class="today-count">今日: {{ getTodayCount(habit.id) }}/{{ habit.targetCount }}</span>
          </div>
          <div class="weekly-grid">
            <div
              v-for="day in weekDays"
              :key="day.date"
              class="grid-cell"
              :class="{ done: getDayRecord(habit.id, day.date) }"
              :title="day.date"
            >
              {{ day.label }}
            </div>
          </div>
        </div>
        <div class="habit-actions">
          <button
            v-if="habit.active && !isCompletedToday(habit.id)"
            @click="checkIn(habit.id)"
            class="checkin-btn"
            title="打卡"
          >
            <WsIcon name="check" :size="18" />
          </button>
          <button
            v-else-if="habit.active"
            @click="uncheckToday(habit.id)"
            class="uncheck-btn"
            title="取消打卡"
          >
            <WsIcon name="check" :size="18" />
          </button>
          <button
            @click="toggleActive(habit.id)"
            class="pause-btn"
            :title="habit.active ? '暂停习惯' : '启用习惯'"
          >
            <WsIcon :name="habit.active ? 'moon' : 'refresh'" :size="16" />
          </button>
          <button
            @click="deleteHabit(habit.id)"
            class="delete-btn"
            title="删除习惯"
          >
            <WsIcon name="x" :size="14" />
          </button>
        </div>
      </div>
      <div v-if="visibleHabits.length === 0" class="empty-state">
        <WsIcon name="flame" :size="48" />
        <span>{{ showPaused ? '没有已暂停的习惯' : '暂无习惯，添加一个开始打卡吧！' }}</span>
      </div>
      <Pagination
        v-model:current-page="currentPage"
        :total-pages="totalPages"
        :total="visibleHabits.length"
      />
    </div>
  </div>
</template>

<style scoped>
.habit-module {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.habit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.today-date {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.completion-badge {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: var(--bg-card);
  color: var(--text-secondary);
  font-weight: 500;
}

.completion-badge.done {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.add-habit-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.45rem 0.75rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s;
}

.add-habit-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.weekly-heatmap {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--bg-card);
  border-radius: var(--radius-md);
}

.heat-day {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

.heat-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.heat-bar {
  width: 12px;
  height: 40px;
  background: var(--bg-input);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}

.heat-fill {
  width: 100%;
  background: var(--accent);
  border-radius: 6px;
  transition: height 0.3s ease;
}

.heat-count {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-primary);
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

.habit-input {
  padding: 0.4rem 0.65rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.825rem;
}

.habit-input:focus {
  outline: none;
  border-color: var(--accent);
}

.icon-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.icon-btn {
  width: 34px;
  height: 34px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  transition: all 0.2s;
}

.icon-btn:hover {
  background: var(--bg-card-hover);
  transform: scale(1.1);
}

.icon-btn.active {
  border-color: var(--accent);
  background: var(--accent-light);
}

.habit-options {
  display: flex;
  gap: 0.5rem;
}

.frequency-select,
.target-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.875rem;
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

.cancel-btn {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.cancel-btn:hover { background: var(--bg-card); }

.habit-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.toggle-paused {
  background: transparent;
  border: none;
  color: var(--accent);
  font-size: 0.75rem;
  cursor: pointer;
}

.habit-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.habit-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  transition: all 0.25s;
}

.habit-item:hover {
  background: var(--bg-card-hover);
}

.habit-item.completed {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.habit-item.paused {
  opacity: 0.6;
}

.habit-icon-wrap {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.habit-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.habit-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.habit-stats {
  display: flex;
  gap: 0.75rem;
  font-size: 0.7rem;
  color: var(--text-secondary);
  flex-wrap: wrap;
}

.streak {
  color: #f59e0b;
  font-weight: 600;
}

.weekly-grid {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.2rem;
}

.grid-cell {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-secondary);
}

.grid-cell.done {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  font-weight: 600;
}

.habit-actions {
  display: flex;
  gap: 0.4rem;
}

.checkin-btn,
.uncheck-btn,
.pause-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.checkin-btn {
  background: var(--accent);
  color: white;
}

.checkin-btn:hover {
  opacity: 0.9;
  transform: scale(1.08);
}

.uncheck-btn {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.uncheck-btn:hover {
  background: rgba(245, 158, 11, 0.25);
}

.pause-btn {
  background: var(--bg-input);
  color: var(--text-secondary);
}

.pause-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.delete-btn {
  width: 30px;
  height: 30px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  opacity: 0;
}

.habit-item:hover .delete-btn {
  opacity: 1;
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
