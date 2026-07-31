<script setup lang="ts">
/**
 * 日历视图组件
 * 月视图展示所有模块事项的分布，支持查看某天详情
 */
import { ref, computed } from 'vue'
import { useCalendar } from '../../composables/useCalendar'
import WsIcon from './WsIcon.vue'
import MarkdownRenderer from '../MarkdownRenderer.vue'
import type { CalendarEvent, CalendarEventType } from '../../composables/useCalendar'

const { getMonthEvents, getEventsByDate } = useCalendar()

const currentDate = ref(new Date())
const selectedDate = ref<string>('')

const year = computed(() => currentDate.value.getFullYear())
const month = computed(() => currentDate.value.getMonth())

const monthLabel = computed(() => {
  return currentDate.value.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
})

const calendarDays = computed(() => {
  const firstDay = new Date(year.value, month.value, 1)
  const startDayOfWeek = firstDay.getDay()
  const daysInMonth = new Date(year.value, month.value + 1, 0).getDate()
  const days = []

  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null)
  }

  const monthEvents = getMonthEvents(year.value, month.value)
  for (let d = 1; d <= daysInMonth; d++) {
    const dayEvents = monthEvents.find(m => new Date(m.date).getDate() === d)?.events || []
    days.push({
      day: d,
      date: `${year.value}-${String(month.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      events: dayEvents
    })
  }

  return days
})

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const todayStr = new Date().toISOString().slice(0, 10)

function isToday(date: string): boolean {
  return date === todayStr
}

function prevMonth() {
  currentDate.value = new Date(year.value, month.value - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(year.value, month.value + 1, 1)
}

function goToday() {
  currentDate.value = new Date()
  selectedDate.value = todayStr
}

function selectDate(date: string) {
  selectedDate.value = selectedDate.value === date ? '' : date
}

const selectedEvents = computed(() => {
  if (!selectedDate.value) return []
  return getEventsByDate(selectedDate.value)
})

const eventTypeNames: Record<CalendarEventType, string> = {
  todo: '待办',
  habit: '习惯',
  expense: '支出',
  goal: '目标'
}

const eventTypeIcons: Record<CalendarEventType, string> = {
  todo: 'checklist',
  habit: 'flame',
  expense: 'wallet',
  goal: 'target'
}

function formatSelectedDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })
}
</script>

<template>
  <div class="calendar-view">
    <div class="calendar-header">
      <div class="calendar-title">
        <WsIcon name="calendar" :size="20" />
        <span>{{ monthLabel }}</span>
      </div>
      <div class="calendar-nav">
        <button class="nav-btn" @click="prevMonth">
          <WsIcon name="chevron-left" :size="16" />
        </button>
        <button class="nav-btn today" @click="goToday">今天</button>
        <button class="nav-btn" @click="nextMonth">
          <WsIcon name="chevron-right" :size="16" />
        </button>
      </div>
    </div>

    <div class="calendar-legend">
      <span class="legend-item"><span class="dot todo"></span>待办</span>
      <span class="legend-item"><span class="dot habit"></span>习惯</span>
      <span class="legend-item"><span class="dot expense"></span>支出</span>
      <span class="legend-item"><span class="dot goal"></span>目标</span>
    </div>

    <div class="calendar-grid">
      <div v-for="day in weekDays" :key="day" class="weekday-header">{{ day }}</div>
      <div
        v-for="(cell, index) in calendarDays"
        :key="index"
        class="calendar-cell"
        :class="{
          empty: !cell,
          today: cell && isToday(cell.date),
          selected: cell && selectedDate === cell.date
        }"
        @click="cell && selectDate(cell.date)"
      >
        <template v-if="cell">
          <span class="cell-day">{{ cell.day }}</span>
          <div class="cell-dots">
            <span
              v-for="event in cell.events.slice(0, 4)"
              :key="event.id"
              class="event-dot"
              :style="{ background: event.color }"
              :title="event.title"
            ></span>
          </div>
          <div v-if="cell.events.length > 4" class="cell-more">+{{ cell.events.length - 4 }}</div>
        </template>
      </div>
    </div>

    <div v-if="selectedDate" class="day-detail">
      <div class="detail-header">
        <span class="detail-date">{{ formatSelectedDate(selectedDate) }}</span>
        <button class="close-detail" @click="selectedDate = ''">
          <WsIcon name="x" :size="14" />
        </button>
      </div>
      <div v-if="selectedEvents.length === 0" class="detail-empty">
        当天没有事项
      </div>
      <div v-else class="detail-list">
        <div
          v-for="event in selectedEvents"
          :key="event.id"
          class="detail-item"
          :class="event.type"
        >
          <div class="detail-icon">
            <WsIcon :name="eventTypeIcons[event.type]" :size="16" />
          </div>
          <div class="detail-content">
            <div class="detail-title">{{ event.title }}</div>
            <div class="detail-type">{{ eventTypeNames[event.type] }}</div>
            <MarkdownRenderer
              v-if="event.type === 'todo' && (event.data as any).notes"
              :content="(event.data as any).notes"
            />
            <MarkdownRenderer
              v-if="event.type === 'goal' && (event.data as any).description"
              :content="(event.data as any).description"
            />
            <MarkdownRenderer
              v-if="event.type === 'expense' && (event.data as any).description"
              :content="(event.data as any).description"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-view {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.calendar-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.calendar-nav {
  display: flex;
  gap: 0.25rem;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
}

.nav-btn:hover {
  background: var(--bg-card-hover);
  border-color: var(--accent);
}

.nav-btn.today {
  min-width: 48px;
}

.calendar-legend {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.25rem 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.dot.todo { background: #3b82f6; }
.dot.habit { background: #f59e0b; }
.dot.expense { background: #10b981; }
.dot.goal { background: #8b5cf6; }

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}

.weekday-header {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 0.4rem 0;
}

.calendar-cell {
  min-height: 64px;
  padding: 0.45rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}

.calendar-cell:hover {
  border-color: var(--accent);
  background: var(--bg-card-hover);
}

.calendar-cell.empty {
  background: transparent;
  border-color: transparent;
  cursor: default;
}

.calendar-cell.today {
  border-color: var(--accent);
  background: var(--accent-light);
}

.calendar-cell.today .cell-day {
  color: var(--accent);
  font-weight: 700;
}

.calendar-cell.selected {
  box-shadow: 0 0 0 2px var(--accent);
}

.cell-day {
  font-size: 0.85rem;
  color: var(--text-primary);
}

.cell-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem;
  margin-top: auto;
}

.event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.cell-more {
  font-size: 0.6rem;
  color: var(--text-secondary);
}

.day-detail {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-date {
  font-weight: 600;
  color: var(--text-primary);
}

.close-detail {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--radius-sm);
}

.close-detail:hover {
  color: var(--text-primary);
  background: var(--bg-input);
}

.detail-empty {
  color: var(--text-secondary);
  font-size: 0.875rem;
  text-align: center;
  padding: 1rem 0;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  gap: 0.6rem;
  padding: 0.6rem;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--border-color);
}

.detail-item.todo { border-left-color: #3b82f6; }
.detail-item.habit { border-left-color: #f59e0b; }
.detail-item.expense { border-left-color: #10b981; }
.detail-item.goal { border-left-color: #8b5cf6; }

.detail-icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.detail-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.detail-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.detail-type {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.detail-content :deep(.markdown-body) {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.detail-content :deep(.markdown-body p) {
  margin-bottom: 0.25rem;
}

@media (max-width: 768px) {
  .calendar-cell {
    min-height: 48px;
    padding: 0.25rem;
  }

  .cell-day {
    font-size: 0.75rem;
  }

  .event-dot {
    width: 5px;
    height: 5px;
  }
}
</style>
