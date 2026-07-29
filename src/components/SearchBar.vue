<script setup lang="ts">
/**
 * 搜索栏组件
 * 支持全局搜索教程内容，快捷键 Ctrl+K 唤起
 * 搜索结果实时显示，支持键盘导航
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { tutorialSeries } from '../data/tutorial-series'

const router = useRouter()
// 搜索关键词
const query = ref('')
// 下拉菜单展开状态
const isOpen = ref(false)
// 输入框 DOM 引用
const inputRef = ref<HTMLInputElement | null>(null)
// 下拉菜单 DOM 引用
const dropdownRef = ref<HTMLElement | null>(null)
// 当前选中的搜索结果索引（键盘导航用）
const selectedIndex = ref(0)

interface SearchResult {
  seriesId: string
  seriesTitle: string
  chapterSlug: string
  chapterTitle: string
  chapterDescription: string
  section: string
}

const results = computed<SearchResult[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []

  const items: SearchResult[] = []
  for (const series of tutorialSeries) {
    for (const chapter of series.chapters) {
      const text = `${series.title} ${chapter.title} ${chapter.description} ${chapter.section}`.toLowerCase()
      if (text.includes(q)) {
        items.push({
          seriesId: series.id,
          seriesTitle: series.title,
          chapterSlug: chapter.slug,
          chapterTitle: chapter.title,
          chapterDescription: chapter.description,
          section: chapter.section,
        })
      }
    }
  }
  return items.slice(0, 10)
})

function open() {
  isOpen.value = true
}

function close() {
  isOpen.value = false
  selectedIndex.value = 0
}

function toggle() {
  if (isOpen.value) {
    close()
  } else {
    open()
    inputRef.value?.focus()
  }
}

function navigate(result: SearchResult) {
  router.push(`/tutorials/${result.seriesId}/${result.chapterSlug}`)
  query.value = ''
  close()
  inputRef.value?.blur()
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, results.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const item = results.value[selectedIndex.value]
    if (item) navigate(item)
  } else if (e.key === 'Escape') {
    close()
    inputRef.value?.blur()
  }
}

function handleClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    close()
  }
}

function handleGlobalKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    inputRef.value?.focus()
    open()
  }
}

watch(query, () => {
  selectedIndex.value = 0
  if (query.value.trim()) {
    open()
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <div class="search-bar" ref="dropdownRef">
    <div class="search-input-wrapper">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5" />
        <path d="M11 11L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        class="search-input"
        placeholder="搜索教程..."
        @focus="open"
        @keydown="onKeyDown"
      />
      <kbd class="search-shortcut">Ctrl+K</kbd>
    </div>

    <Transition name="dropdown">
      <div v-if="isOpen && query.trim()" class="search-dropdown">
        <div v-if="results.length === 0" class="search-empty">
          没有找到匹配的结果
        </div>
        <div v-else class="search-results">
          <button
            v-for="(result, index) in results"
            :key="`${result.seriesId}-${result.chapterSlug}`"
            class="search-result-item"
            :class="{ selected: index === selectedIndex }"
            @click="navigate(result)"
            @mouseenter="selectedIndex = index"
          >
            <div class="result-title">{{ result.chapterTitle }}</div>
            <div class="result-meta">{{ result.seriesTitle }} / {{ result.section }}</div>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.search-bar {
  position: relative;
  width: 240px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.search-input-wrapper:focus-within {
  border-color: var(--text-link);
  background: var(--bg-glass-hover);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--text-link) 15%, transparent);
}

.search-icon {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.85rem;
  color: var(--text-primary);
  min-width: 0;
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.search-shortcut {
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  background: var(--bg-glass);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: inherit;
  flex-shrink: 0;
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  max-height: 400px;
  overflow-y: auto;
  background: var(--bg-glass-strong);
  backdrop-filter: blur(var(--blur-strong));
  -webkit-backdrop-filter: blur(var(--blur-strong));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
}

.search-empty {
  padding: 1.5rem 1rem;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.search-result-item {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover,
.search-result-item.selected {
  background: var(--accent-light);
}

.result-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.2rem;
}

.result-meta {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 768px) {
  .search-bar {
    width: 180px;
  }

  .search-shortcut {
    display: none;
  }
}

@media (max-width: 640px) {
  .search-bar {
    width: 140px;
  }
}
</style>
