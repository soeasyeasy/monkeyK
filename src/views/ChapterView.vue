<script setup lang="ts">
import { ref, computed, watch, onMounted, inject } from 'vue'
import { useRoute } from 'vue-router'
import { getSeriesById, getAdjacentChapters } from '../data/tutorial-series'
import { parseMarkdown } from '../utils/markdown'
import MarkdownRenderer from '../components/MarkdownRenderer.vue'

interface TocItem {
  id: string
  text: string
  level: number
}

const tocItems = inject<ReturnType<typeof ref<TocItem[]>>>('tocItems', ref<TocItem[]>([]))

function handleHeadings(headings: TocItem[]) {
  tocItems.value = headings
}

const route = useRoute()
const seriesId = computed(() => route.params.seriesId as string)
const chapterSlug = computed(() => route.params.chapterSlug as string)

const series = computed(() => getSeriesById(seriesId.value))
const chapter = computed(() => {
  if (!series.value) return undefined
  return series.value.chapters.find((c) => c.slug === chapterSlug.value)
})

const adjacent = computed(() => {
  if (!series.value || !chapter.value) return {}
  return getAdjacentChapters(series.value, chapter.value.slug)
})

const markdownContent = ref('')
const frontmatter = ref<Record<string, any>>({})
const loading = ref(true)
const error = ref('')

// 使用 Vite 的 import.meta.glob 懒加载 markdown 文件
const markdownModules = import.meta.glob('/src/content/tutorials/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: false,
})

async function loadMarkdown() {
  loading.value = true
  error.value = ''

  if (!series.value || !chapter.value) {
    error.value = '章节不存在'
    loading.value = false
    return
  }

  const path = `/src/content/tutorials/${series.value.id}/${chapter.value.number}-${chapter.value.slug}.md`
  const loader = markdownModules[path]

  if (!loader) {
    error.value = `文件不存在: ${path}`
    loading.value = false
    return
  }

  try {
    const raw = (await loader()) as string
    const parsed = parseMarkdown(raw)
    markdownContent.value = parsed.content
    frontmatter.value = parsed.frontmatter
  } catch (e: any) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

watch([seriesId, chapterSlug], loadMarkdown, { immediate: false })

onMounted(() => {
  loadMarkdown()
})
</script>

<template>
  <div class="chapter-view">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error">
      <h2>加载失败</h2>
      <p>{{ error }}</p>
      <RouterLink :to="`/tutorials/${seriesId}`" class="back-link"> ← 返回系列目录 </RouterLink>
    </div>

    <div v-else class="doc-content">
      <MarkdownRenderer :content="markdownContent" @headings="handleHeadings" />

      <!-- 上下章导航 -->
      <div class="chapter-footer" v-if="adjacent.prev || adjacent.next">
        <RouterLink
          v-if="adjacent.prev"
          :to="`/tutorials/${seriesId}/${adjacent.prev.slug}`"
          class="footer-link prev"
        >
          <span class="footer-label">上一章</span>
          <span class="footer-title">{{ adjacent.prev.title }}</span>
        </RouterLink>
        <div v-else class="footer-spacer"></div>

        <RouterLink
          v-if="adjacent.next"
          :to="`/tutorials/${seriesId}/${adjacent.next.slug}`"
          class="footer-link next"
        >
          <span class="footer-label">下一章</span>
          <span class="footer-title">{{ adjacent.next.title }}</span>
        </RouterLink>
        <div v-else class="footer-spacer"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chapter-view {
  min-height: 60vh;
}

.loading,
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-secondary);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.doc-content {
  max-width: 1020px;
  margin: 0 auto;
  padding: 2rem 2.5rem 4rem;
}

.chapter-footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.footer-link {
  display: flex;
  flex-direction: column;
  padding: 1rem 1.25rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: all 0.2s;
  max-width: 48%;
  min-width: 160px;
  background: var(--bg-card);
}

.footer-link:hover {
  border-color: var(--border-hover);
  background: var(--bg-card-hover);
}

.footer-link.next {
  text-align: right;
  margin-left: auto;
}

.footer-label {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
}

.footer-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-link);
}

.footer-spacer {
  flex: 1;
}

.back-link {
  display: inline-block;
  margin-top: 1rem;
  color: var(--text-link);
  text-decoration: none;
}
</style>
