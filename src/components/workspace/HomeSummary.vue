<script setup lang="ts">
/**
 * 首页只读摘要组件
 * 展示各模块的进度统计，不可操作，点击可跳转详情页
 */
import { computed } from 'vue'
import { useTodos } from '../../composables/useTodos'
import { useHabits } from '../../composables/useHabits'
import { useAccounting } from '../../composables/useAccounting'
import { useGoals } from '../../composables/useGoals'
import { expenseCategories } from '../../data/workspace-defaults'
import WsIcon from './WsIcon.vue'

const emit = defineEmits<{
  navigate: [module: 'todo' | 'habit' | 'accounting' | 'goal']
}>()

const { todos, getStats: getTodoStats, getTodayStats, getOverdueTodos } = useTodos()
const { habits, isCompletedToday, getStreak, getTotalCheckIns } = useHabits()
const { getCurrentMonthTotal, getBudgetProgress, getCurrentMonthByCategory } = useAccounting()
const { goals, getStats: getGoalStats, getOverdueGoals } = useGoals()

// 待办摘要
const todoStats = computed(() => getTodoStats())
const todayStats = computed(() => getTodayStats())
const recentTodos = computed(() =>
  todos.value
    .filter(t => !t.done)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3)
)

// 习惯摘要
const activeHabits = computed(() => habits.value.filter(h => h.active))
const todayHabitCompleted = computed(() =>
  activeHabits.value.filter(h => isCompletedToday(h.id)).length
)
const topStreaks = computed(() =>
  [...activeHabits.value]
    .map(h => ({ name: h.name, icon: h.icon, streak: getStreak(h.id) }))
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 3)
)
const totalCheckIns = computed(() =>
  habits.value.reduce((sum, h) => sum + getTotalCheckIns(h.id), 0)
)

// 记账摘要
const monthTotal = computed(() => getCurrentMonthTotal())
const budgetProgress = computed(() => getBudgetProgress())
const topCategories = computed(() => {
  const byCategory = getCurrentMonthByCategory()
  return Object.entries(byCategory)
    .map(([id, amount]) => ({
      name: expenseCategories.find(c => c.id === id)?.name || id,
      color: expenseCategories.find(c => c.id === id)?.color || '#6b7280',
      amount: amount as number
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
})

// 目标摘要
const goalStats = computed(() => getGoalStats())
const recentGoals = computed(() =>
  [...goals.value]
    .filter(g => g.progress < 100)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3)
)
const overdueGoalCount = computed(() => getOverdueGoals().length)
</script>

<template>
  <div class="home-summary">
    <!-- 待办摘要 -->
    <div class="summary-panel todo" @click="emit('navigate', 'todo')">
      <div class="panel-header">
        <WsIcon name="checklist" :size="18" class="panel-icon" />
        <span class="panel-title">待办事项</span>
        <span class="panel-arrow">→</span>
      </div>
      <div class="panel-stats">
        <div class="stat-big">
          <span class="stat-num">{{ todayStats.completed }}/{{ todayStats.total }}</span>
          <span class="stat-label">今日完成</span>
        </div>
        <div class="stat-big">
          <span class="stat-num accent">{{ todayStats.rate }}%</span>
          <span class="stat-label">完成率</span>
        </div>
        <div class="stat-big" v-if="todoStats.overdue > 0">
          <span class="stat-num danger">{{ todoStats.overdue }}</span>
          <span class="stat-label">已过期</span>
        </div>
      </div>
      <div v-if="recentTodos.length > 0" class="preview-list">
        <div v-for="t in recentTodos" :key="t.id" class="preview-item">
          <span class="preview-dot"></span>
          <span class="preview-text">{{ t.text }}</span>
        </div>
      </div>
    </div>

    <!-- 习惯摘要 -->
    <div class="summary-panel habit" @click="emit('navigate', 'habit')">
      <div class="panel-header">
        <WsIcon name="flame" :size="18" class="panel-icon" />
        <span class="panel-title">习惯打卡</span>
        <span class="panel-arrow">→</span>
      </div>
      <div class="panel-stats">
        <div class="stat-big">
          <span class="stat-num">{{ todayHabitCompleted }}/{{ activeHabits.length }}</span>
          <span class="stat-label">今日打卡</span>
        </div>
        <div class="stat-big">
          <span class="stat-num accent">{{ totalCheckIns }}</span>
          <span class="stat-label">累计打卡</span>
        </div>
      </div>
      <div v-if="topStreaks.length > 0" class="preview-list">
        <div v-for="s in topStreaks" :key="s.name" class="preview-item">
          <span class="preview-dot habit-dot"></span>
          <span class="preview-text">{{ s.name }}</span>
          <span class="streak-badge" v-if="s.streak > 0">{{ s.streak }}天</span>
        </div>
      </div>
    </div>

    <!-- 记账摘要 -->
    <div class="summary-panel accounting" @click="emit('navigate', 'accounting')">
      <div class="panel-header">
        <WsIcon name="wallet" :size="18" class="panel-icon" />
        <span class="panel-title">记账管理</span>
        <span class="panel-arrow">→</span>
      </div>
      <div class="panel-stats">
        <div class="stat-big">
          <span class="stat-num">¥{{ monthTotal.toLocaleString() }}</span>
          <span class="stat-label">本月支出</span>
        </div>
        <div class="stat-big">
          <span class="stat-num" :class="{ danger: budgetProgress.percentage >= 80 }">
            {{ budgetProgress.percentage.toFixed(0) }}%
          </span>
          <span class="stat-label">预算使用</span>
        </div>
      </div>
      <div v-if="topCategories.length > 0" class="preview-list">
        <div v-for="cat in topCategories" :key="cat.name" class="preview-item">
          <span class="preview-dot" :style="{ background: cat.color }"></span>
          <span class="preview-text">{{ cat.name }}</span>
          <span class="amount-badge">¥{{ cat.amount.toLocaleString() }}</span>
        </div>
      </div>
    </div>

    <!-- 目标摘要 -->
    <div class="summary-panel goal" @click="emit('navigate', 'goal')">
      <div class="panel-header">
        <WsIcon name="target" :size="18" class="panel-icon" />
        <span class="panel-title">目标追踪</span>
        <span class="panel-arrow">→</span>
      </div>
      <div class="panel-stats">
        <div class="stat-big">
          <span class="stat-num accent">{{ goalStats.active }}</span>
          <span class="stat-label">进行中</span>
        </div>
        <div class="stat-big">
          <span class="stat-num">{{ goalStats.completed }}</span>
          <span class="stat-label">已完成</span>
        </div>
        <div class="stat-big" v-if="overdueGoalCount > 0">
          <span class="stat-num danger">{{ overdueGoalCount }}</span>
          <span class="stat-label">已逾期</span>
        </div>
      </div>
      <div v-if="recentGoals.length > 0" class="preview-list">
        <div v-for="g in recentGoals" :key="g.id" class="preview-item goal-preview">
          <span class="preview-text">{{ g.title }}</span>
          <div class="mini-progress">
            <div class="mini-progress-fill" :style="{ width: g.progress + '%' }"></div>
          </div>
          <span class="progress-label">{{ g.progress }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.85rem;
}

.summary-panel {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.9rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.summary-panel:hover {
  border-color: var(--border-hover);
  background: var(--bg-card-hover);
  transform: translateY(-1px);
}

.summary-panel.todo { border-left: 3px solid #3b82f6; }
.summary-panel.habit { border-left: 3px solid #f59e0b; }
.summary-panel.accounting { border-left: 3px solid #10b981; }
.summary-panel.goal { border-left: 3px solid #8b5cf6; }

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.panel-icon {
  color: var(--text-secondary);
}

.summary-panel.todo .panel-icon { color: #3b82f6; }
.summary-panel.habit .panel-icon { color: #f59e0b; }
.summary-panel.accounting .panel-icon { color: #10b981; }
.summary-panel.goal .panel-icon { color: #8b5cf6; }

.panel-title {
  font-size: 0.825rem;
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

.panel-stats {
  display: flex;
  gap: 1rem;
}

.stat-big {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.stat-num {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}

.stat-num.accent { color: var(--accent); }
.stat-num.danger { color: #ef4444; }

.stat-label {
  font-size: 0.65rem;
  color: var(--text-secondary);
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding-top: 0.35rem;
  border-top: 1px solid var(--border-color);
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.preview-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--text-secondary);
  flex-shrink: 0;
}

.preview-dot.habit-dot { background: #f59e0b; }

.preview-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
}

.streak-badge,
.amount-badge {
  font-size: 0.65rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.goal-preview {
  gap: 0.5rem;
}

.mini-progress {
  flex: 1;
  height: 3px;
  background: var(--bg-input);
  border-radius: 2px;
  overflow: hidden;
}

.mini-progress-fill {
  height: 100%;
  background: #8b5cf6;
  border-radius: 2px;
  transition: width 0.3s;
}

.progress-label {
  font-size: 0.65rem;
  color: var(--text-secondary);
  flex-shrink: 0;
  min-width: 28px;
  text-align: right;
}

@media (max-width: 900px) {
  .home-summary {
    grid-template-columns: 1fr;
  }
}
</style>
