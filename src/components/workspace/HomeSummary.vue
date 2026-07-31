<script setup lang="ts">
/**
 * 首页可操作内容面板
 * 展示具体事项列表，支持快捷操作
 */
import { computed } from 'vue'
import { useTodos } from '../../composables/useTodos'
import { useHabits } from '../../composables/useHabits'
import { useAccounting } from '../../composables/useAccounting'
import { useGoals } from '../../composables/useGoals'
import WsIcon from './WsIcon.vue'

const emit = defineEmits<{
  navigate: [module: 'todo' | 'habit' | 'accounting' | 'goal']
}>()

const { todos, toggleTodo } = useTodos()
const { habits, checkIn, isCompletedToday, getStreak } = useHabits()
const { getRecentExpenses } = useAccounting()
const { goals, updateGoalProgress } = useGoals()

// 待办列表 - 显示最近未完成的待办
const pendingTodos = computed(() =>
  todos.value
    .filter(t => !t.done)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5)
)

// 习惯列表 - 显示今日活跃习惯
const todayHabits = computed(() =>
  habits.value
    .filter(h => h.active)
    .map(h => {
      // 检查今天是否有打卡记录（无论是否完成目标）
      const today = new Date().toISOString().split('T')[0] ?? ''
      const todayRecord = h.records.find(r => r.date === today)
      return {
        id: h.id,
        name: h.name,
        icon: h.icon,
        completed: isCompletedToday(h.id),
        hasCheckedIn: !!todayRecord,
        todayCount: todayRecord?.count || 0,
        targetCount: h.targetCount,
        streak: getStreak(h.id)
      }
    })
    .slice(0, 5)
)

// 最近支出记录
const recentExpenses = computed(() =>
  getRecentExpenses(7).slice(0, 5)
)

// 进行中的目标
const activeGoals = computed(() =>
  goals.value
    .filter(g => g.progress < 100)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 4)
)

// 快捷操作函数
function handleToggleTodo(id: number, event: Event) {
  event.stopPropagation()
  toggleTodo(id)
}

function handleCheckIn(habitId: number, event: Event) {
  event.stopPropagation()
  checkIn(habitId)
}

function handleUpdateProgress(goalId: number, newProgress: number, event: Event) {
  event.stopPropagation()
  updateGoalProgress(goalId, newProgress)
}
</script>

<template>
  <div class="home-summary">
    <!-- 待办事项面板 -->
    <div class="summary-panel todo" @click="emit('navigate', 'todo')">
      <div class="panel-header">
        <WsIcon name="checklist" :size="18" class="panel-icon" />
        <span class="panel-title">待办事项</span>
        <span class="panel-arrow">→</span>
      </div>
      <div v-if="pendingTodos.length > 0" class="action-list">
        <div v-for="t in pendingTodos" :key="t.id" class="action-item">
          <button class="checkbox-btn" @click.stop="handleToggleTodo(t.id, $event)" title="标记完成">
            <WsIcon name="check" :size="14" />
          </button>
          <span class="item-text">{{ t.text }}</span>
          <span v-if="t.dueDate" class="item-date">{{ t.dueDate }}</span>
        </div>
      </div>
      <div v-else class="empty-state">
        <span>暂无待办事项</span>
      </div>
    </div>

    <!-- 习惯打卡面板 -->
    <div class="summary-panel habit" @click="emit('navigate', 'habit')">
      <div class="panel-header">
        <WsIcon name="flame" :size="18" class="panel-icon" />
        <span class="panel-title">习惯打卡</span>
        <span class="panel-arrow">→</span>
      </div>
      <div v-if="todayHabits.length > 0" class="action-list" @click.stop>
        <div v-for="h in todayHabits" :key="h.id" class="action-item">
          <button
            class="checkin-btn"
            :class="{
              completed: h.completed,
              'partial': h.hasCheckedIn && !h.completed
            }"
            @click="handleCheckIn(h.id, $event)"
            :title="h.completed ? '已完成' : h.hasCheckedIn ? `已打卡 ${h.todayCount}/${h.targetCount}` : '点击打卡'"
          >
            <WsIcon :name="h.completed ? 'check' : 'plus'" :size="14" />
          </button>
          <span class="item-text">{{ h.name }}</span>
          <span v-if="h.hasCheckedIn && !h.completed" class="count-badge">
            {{ h.todayCount }}/{{ h.targetCount }}
          </span>
          <span v-else-if="h.streak > 0" class="streak-badge">🔥 {{ h.streak }}天</span>
        </div>
      </div>
      <div v-else class="empty-state">
        <span>暂无活跃习惯</span>
      </div>
    </div>

    <!-- 记账面板 -->
    <div class="summary-panel accounting" @click="emit('navigate', 'accounting')">
      <div class="panel-header">
        <WsIcon name="wallet" :size="18" class="panel-icon" />
        <span class="panel-title">记账管理</span>
        <span class="panel-arrow">→</span>
      </div>
      <div v-if="recentExpenses.length > 0" class="action-list">
        <div v-for="(e, idx) in recentExpenses" :key="idx" class="action-item">
          <span class="item-text">{{ e.description }}</span>
          <span class="amount-badge">¥{{ e.amount.toFixed(2) }}</span>
          <span class="item-date">{{ e.date.slice(5) }}</span>
        </div>
      </div>
      <div v-else class="empty-state">
        <span>暂无支出记录</span>
      </div>
    </div>

    <!-- 目标面板 -->
    <div class="summary-panel goal" @click="emit('navigate', 'goal')">
      <div class="panel-header">
        <WsIcon name="target" :size="18" class="panel-icon" />
        <span class="panel-title">目标追踪</span>
        <span class="panel-arrow">→</span>
      </div>
      <div v-if="activeGoals.length > 0" class="action-list">
        <div v-for="g in activeGoals" :key="g.id" class="action-item goal-item">
          <span class="item-text">{{ g.title }}</span>
          <div class="progress-row">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: g.progress + '%' }"></div>
            </div>
            <span class="progress-label">{{ g.progress }}%</span>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <span>暂无进行中的目标</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.summary-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  min-height: 180px;
}

.summary-panel:hover {
  border-color: var(--border-hover);
  background: var(--bg-card-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.summary-panel.todo { border-left: 3px solid #3b82f6; }
.summary-panel.habit { border-left: 3px solid #f59e0b; }
.summary-panel.accounting { border-left: 3px solid #10b981; }
.summary-panel.goal { border-left: 3px solid #8b5cf6; }

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.panel-icon {
  color: var(--text-secondary);
}

.summary-panel.todo .panel-icon { color: #3b82f6; }
.summary-panel.habit .panel-icon { color: #f59e0b; }
.summary-panel.accounting .panel-icon { color: #10b981; }
.summary-panel.goal .panel-icon { color: #8b5cf6; }

.panel-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.panel-arrow {
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0;
  transition: opacity 0.15s;
}

.summary-panel:hover .panel-arrow {
  opacity: 1;
}

/* 可操作列表样式 */
.action-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.6rem;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  transition: all 0.15s;
}

.action-item:hover {
  background: var(--bg-glass);
}

/* 待办勾选按钮 */
.checkbox-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 1.5px solid var(--border-color);
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.checkbox-btn:hover {
  border-color: #3b82f6;
  background: #3b82f620;
  color: #3b82f6;
}

/* 习惯打卡按钮 */
.checkin-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 1.5px solid var(--border-color);
  border-radius: 50%;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.checkin-btn:hover {
  border-color: #f59e0b;
  background: #f59e0b20;
  color: #f59e0b;
}

.checkin-btn.completed {
  border-color: #f59e0b;
  background: #f59e0b;
  color: white;
}

/* 项目文本 */
.item-text {
  flex: 1;
  font-size: 0.8rem;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 日期标签 */
.item-date {
  font-size: 0.7rem;
  color: var(--text-muted);
  flex-shrink: 0;
}

/* 连续打卡徽章 */
.streak-badge {
  font-size: 0.7rem;
  color: #f59e0b;
  background: #f59e0b15;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  flex-shrink: 0;
}

/* 金额徽章 */
.amount-badge {
  font-size: 0.8rem;
  font-weight: 600;
  color: #10b981;
  flex-shrink: 0;
}

/* 目标进度条 */
.goal-item {
  flex-direction: column;
  align-items: stretch;
  gap: 0.4rem;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: var(--bg-input);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #8b5cf6;
  border-radius: 2px;
  transition: width 0.3s;
}

.progress-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  min-width: 32px;
  text-align: right;
}

/* 空状态 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 100px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

@media (max-width: 900px) {
  .home-summary {
    grid-template-columns: 1fr;
  }
}
</style>
