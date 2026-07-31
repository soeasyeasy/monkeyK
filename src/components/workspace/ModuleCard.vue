<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import WsIcon from './WsIcon.vue'

const props = defineProps<{
  title: string
  icon?: string
  collapsed?: boolean
  color?: string
}>()

const emit = defineEmits<{
  (e: 'toggle-collapse'): void
}>()

const bodyRef = ref<HTMLElement>()
const bodyHeight = ref(0)

onMounted(async () => {
  await nextTick()
  if (bodyRef.value) {
    bodyHeight.value = bodyRef.value.scrollHeight
    const observer = new ResizeObserver(() => {
      if (bodyRef.value) bodyHeight.value = bodyRef.value.scrollHeight
    })
    observer.observe(bodyRef.value)
  }
})
</script>

<template>
  <div
    class="module-card"
    :class="{ collapsed }"
    :style="{ '--card-color': color || 'var(--accent)' }"
  >
    <header class="card-header" @click="emit('toggle-collapse')">
      <div class="card-title">
        <span class="card-accent"></span>
        <WsIcon v-if="icon" :name="icon" :size="17" class="card-icon" />
        <h3 class="card-title-text">{{ title }}</h3>
      </div>
      <svg
        class="chevron"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </header>
    <div
      class="card-body-wrapper"
      :style="{ maxHeight: collapsed ? '0px' : bodyHeight + 'px' }"
    >
      <div ref="bodyRef" class="card-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.module-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: all 0.25s ease;
}

.module-card:hover {
  border-color: var(--border-hover);
  background: var(--bg-card-hover);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1.15rem;
  cursor: pointer;
  user-select: none;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.card-accent {
  width: 3px;
  height: 18px;
  background: var(--card-color);
  border-radius: 2px;
  flex-shrink: 0;
}

.card-icon {
  color: var(--card-color);
}

.card-title-text {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
}

.chevron {
  color: var(--text-secondary);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.collapsed .chevron {
  transform: rotate(-90deg);
}

.card-body-wrapper {
  overflow: hidden;
  transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-body {
  padding: 0 1.15rem 1.15rem;
  min-height: 0;
}

@media (max-width: 768px) {
  .card-header {
    padding: 0.75rem 1rem;
  }
  .card-body {
    padding: 0 1rem 1rem;
  }
}
</style>
