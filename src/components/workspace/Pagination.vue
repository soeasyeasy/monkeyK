<script setup lang="ts">
/**
 * 通用分页组件
 */
import { computed } from 'vue'
import WsIcon from './WsIcon.vue'

const props = defineProps<{
  currentPage: number
  totalPages: number
  total: number
}>()

const emit = defineEmits<{
  'update:currentPage': [page: number]
}>()

const pageNumbers = computed(() => {
  const pages: (number | '...')[] = []
  const tp = props.totalPages
  const cp = props.currentPage

  if (tp <= 7) {
    for (let i = 1; i <= tp; i++) pages.push(i)
  } else {
    pages.push(1)
    if (cp > 3) pages.push('...')
    const start = Math.max(2, cp - 1)
    const end = Math.min(tp - 1, cp + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (cp < tp - 2) pages.push('...')
    pages.push(tp)
  }
  return pages
})

function go(page: number) {
  if (page >= 1 && page <= props.totalPages) {
    emit('update:currentPage', page)
  }
}
</script>

<template>
  <div class="pagination" v-if="totalPages > 1">
    <span class="page-total">共 {{ total }} 条</span>
    <div class="page-controls">
      <button
        class="page-btn"
        :disabled="currentPage <= 1"
        @click="go(currentPage - 1)"
        title="上一页"
      >
        <WsIcon name="chevron-left" :size="14" />
      </button>
      <template v-for="(p, i) in pageNumbers" :key="i">
        <span v-if="p === '...'" class="page-ellipsis">...</span>
        <button
          v-else
          class="page-btn"
          :class="{ active: p === currentPage }"
          @click="go(p as number)"
        >{{ p }}</button>
      </template>
      <button
        class="page-btn"
        :disabled="currentPage >= totalPages"
        @click="go(currentPage + 1)"
        title="下一页"
      >
        <WsIcon name="chevron-right" :size="14" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  gap: 0.5rem;
}

.page-total {
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.page-controls {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 0.35rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
}

.page-btn:hover:not(:disabled):not(.active) {
  background: var(--bg-card-hover);
  border-color: var(--accent);
}

.page-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
  font-weight: 600;
}

.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.page-ellipsis {
  padding: 0 0.25rem;
  color: var(--text-secondary);
  font-size: 0.75rem;
}
</style>
