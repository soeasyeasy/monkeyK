<script setup lang="ts">
/**
 * KPI 统计卡片行
 * 4 个统计卡片横排展示关键指标，跟随网站主题
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

const { getStats: getTodoStats, getTodayStats } = useTodos()
const { habits, isCompletedToday, getTotalCheckIns } = useHabits()
const { getCurrentMonthTotal, getMonthComparison } = useAccounting()
const { getStats: getGoalStats, getOverdueGoals } = useGoals()

const todoStats = computed(() => getTodoStats())
const todayTodoStats = computed(() => getTodayStats())
const habitCompleted = computed(() => habits.value.filter((h) => isCompletedToday(h.id)).length)
const habitTotal = computed(() => habits.value.filter(h => h.active).length)
const monthTotal = computed(() => getCurrentMonthTotal())
const monthComparison = computed(() => getMonthComparison())
const goalStats = computed(() => getGoalStats())
const overdueGoals = computed(() => getOverdueGoals().length)
const totalCheckIns = computed(() => habits.value.reduce((sum, h) => sum + getTotalCheckIns(h.id), 0))

const kpiCards = computed(() => [
  {
    label: '风险待办',
    value: todoStats.value.overdue + overdueGoals.value,
    icon: 'alert',
    color: '#ef4444',
    nav: 'todo' as const,
    status: todoStats.value.overdue > 0 ? `有 ${todoStats.value.overdue} 项已过期` : '暂无逾期事项'
  },
  {
    label: '待完成目标',
    value: goalStats.value.active,
    icon: 'target',
    color: '#8b5cf6',
    nav: 'goal' as const,
    status: `${goalStats.value.completed} 个已完成 · ${overdueGoals.value} 个已逾期`
  },
  {
    label: '今日任务',
    value: todayTodoStats.value.total - todayTodoStats.value.completed,
    icon: 'clock',
    color: '#3b82f6',
    nav: 'todo' as const,
    status: `完成率 ${todayTodoStats.value.rate}% · 共 ${todayTodoStats.value.total} 项`
  },
  {
    label: '习惯 / 记账',
    value: `${habitCompleted.value}/${habitTotal.value}`,
    icon: 'flame',
    color: '#f59e0b',
    nav: 'habit' as const,
    status: `累计打卡 ${totalCheckIns.value} 次 · 本月支出 ¥${monthTotal.value.toLocaleString()}`
  }
])
</script>

<template>
  <div class="kpi-row">
    <div
      v-for="(card, idx) in kpiCards"
      :key="idx"
      class="kpi-card"
      @click="emit('navigate', card.nav)"
    >
      <div class="kpi-icon-wrap" :style="{ background: card.color + '15', color: card.color }">
        <WsIcon :name="card.icon" :size="22" />
      </div>
      <div class="kpi-body">
        <span class="kpi-value">{{ card.value }}</span>
        <span class="kpi-label">{{ card.label }}</span>
        <span class="kpi-status">{{ card.status }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.kpi-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all 0.2s;
  cursor: pointer;
}

.kpi-card:hover {
  border-color: var(--border-hover);
  background: var(--bg-card-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.kpi-icon-wrap {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.kpi-body {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.kpi-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}

.kpi-label {
  font-size: 0.72rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.kpi-status {
  font-size: 0.72rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-top: 0.15rem;
}

@media (max-width: 900px) {
  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
