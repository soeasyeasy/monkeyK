<script setup lang="ts">
/**
 * 小型月历组件
 * 显示在右侧信息面板，展示当月事项的分布
 */
import { ref, computed } from 'vue'
import { useCalendar } from '../../composables/useCalendar'
import WsIcon from './WsIcon.vue'

const emit = defineEmits<{
  selectDate: [date: string]
}>()

const { hasEvents } = useCalendar()

const currentDate = ref(new Date())
const year = computed(() => currentDate.value.getFullYear())
const month = computed(() => currentDate.value.getMonth())

const monthLabel = computed(() => {
  return currentDate.value.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
})

const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const todayStr = new Date().toISOString().slice(0, 10)

const calendarDays = computed(() => {
  const firstDay = new Date(year.value, month.value, 1)
  const startDayOfWeek = firstDay.getDay()
  const daysInMonth = new Date(year.value, month.value + 1, 0).getDate()
  const days = []

  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null)
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year.value}-${String(month.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({
      day: d,
      date: dateStr,
      hasEvents: hasEvents(dateStr),
      isToday: dateStr === todayStr
    })
  }

  return days
})

function prevMonth() {
  currentDate.value = new Date(year.value, month.value - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(year.value, month.value + 1, 1)
}

function handleSelect(date: string) {
  emit('selectDate', date)
}
</script>

<template>
  <div class="small-calendar">
    <div class="calendar-header">
      <span class="month-label">{{ monthLabel }}</span>
      <div class="nav-btns">
        <button class="nav-btn" @click="prevMonth">
          <WsIcon name="chevron-left" :size="12" />
        </button>
        <button class="nav-btn" @click="nextMonth">
          <WsIcon name="chevron-right" :size="12" />
        </button>
      </div>
    </div>
    <div class="calendar-grid">
      <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
      <div
        v-for="(cell, index) in calendarDays"
        :key="index"
        class="calendar-cell"
        :class="{ empty: !cell, today: cell?.isToday, 'has-events': cell?.hasEvents }"
        @click="cell && handleSelect(cell.date)"
      >
        <template v-if="cell">
          <span class="cell-day">{{ cell.day }}</span>
          <span v-if="cell.hasEvents" class="event-dot"></span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.small-calendar {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.month-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.nav-btns {
  display: flex;
  gap: 0.2rem;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.nav-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.2rem;
}

.weekday {
  text-align: center;
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 0.2rem 0;
}

.calendar-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
  font-size: 0.75rem;
  color: var(--text-primary);
}

.calendar-cell:hover {
  background: var(--bg-input);
}

.calendar-cell.empty {
  cursor: default;
}

.calendar-cell.today {
  background: var(--accent-light);
  color: var(--accent);
  font-weight: 700;
}

.calendar-cell.has-events .event-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent);
}
</style>
