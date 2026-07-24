<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useWeather } from '../composables/useWeather'

const { weather, loading, error } = useWeather()
const showDetail = ref(false)
const widgetRef = ref<HTMLElement | null>(null)

function toggleDetail() {
  if (!loading.value && weather.value) {
    showDetail.value = !showDetail.value
  }
}

function handleClickOutside(event: MouseEvent) {
  if (widgetRef.value && !widgetRef.value.contains(event.target as Node)) {
    showDetail.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  if (date.toDateString() === today.toDateString()) return '今天'
  if (date.toDateString() === tomorrow.toDateString()) return '明天'
  
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[date.getDay()]
}
</script>

<template>
  <div class="weather-widget-wrapper" ref="widgetRef">
    <div class="weather-compact" @click="toggleDetail">
      <span v-if="loading" class="weather-loading">...</span>
      <span v-else-if="error" class="weather-error">--</span>
      <template v-else-if="weather">
        <span class="weather-icon">{{ weather.icon }}</span>
        <span class="weather-temp">{{ weather.temperature }}°</span>
      </template>
    </div>

    <Transition name="dropdown">
      <div v-if="showDetail && weather" class="weather-dropdown" @click.stop>
        <div class="weather-header">
          <div class="weather-main-info">
            <span class="weather-icon-large">{{ weather.icon }}</span>
            <div class="weather-details">
              <div class="weather-temp-large">{{ weather.temperature }}°C</div>
              <div class="weather-desc">{{ weather.description }}</div>
              <div class="weather-city">{{ weather.city }}</div>
            </div>
          </div>
          <button class="close-btn" @click="showDetail = false">×</button>
        </div>

        <div class="weather-stats">
          <div class="stat-item">
            <span class="stat-label">体感</span>
            <span class="stat-value">{{ weather.apparentTemperature }}°C</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">湿度</span>
            <span class="stat-value">{{ weather.humidity }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">风速</span>
            <span class="stat-value">{{ weather.windSpeed }} km/h</span>
          </div>
        </div>

        <div v-if="weather.forecast && weather.forecast.length > 0" class="weather-forecast">
          <div class="forecast-title">7天预报</div>
          <div class="forecast-list">
            <div v-for="(day, index) in weather.forecast" :key="index" class="forecast-item">
              <div class="forecast-date">{{ formatDate(day.date) }}</div>
              <div class="forecast-icon">{{ day.icon }}</div>
              <div class="forecast-desc">{{ day.description }}</div>
              <div class="forecast-temp">
                <span class="temp-max">{{ day.tempMax }}°</span>
                <span class="temp-min">{{ day.tempMin }}°</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.weather-widget-wrapper {
  position: relative;
}

.weather-compact {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  background: var(--bg-glass);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.weather-compact:hover {
  background: var(--bg-glass-hover);
  border-color: var(--border-hover);
  transform: translateY(-1px);
}

.weather-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.weather-temp {
  font-weight: 600;
  color: var(--text-primary);
}

.weather-loading,
.weather-error {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.weather-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 320px;
  background: var(--bg-card);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 1rem;
  z-index: 200;
}

.weather-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.weather-main-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.weather-icon-large {
  font-size: 2.5rem;
  line-height: 1;
}

.weather-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.weather-temp-large {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.weather-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.weather-city {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-glass-hover);
  color: var(--text-primary);
}

.weather-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: center;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.weather-forecast {
  margin-top: 0.5rem;
}

.forecast-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.forecast-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.forecast-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: var(--bg-glass);
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.forecast-item:hover {
  background: var(--bg-glass-hover);
}

.forecast-date {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
  min-width: 50px;
}

.forecast-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.forecast-desc {
  flex: 1;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.forecast-temp {
  display: flex;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.temp-max {
  font-weight: 600;
  color: var(--text-primary);
}

.temp-min {
  color: var(--text-muted);
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
