<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'

interface TocItem {
  id: string
  text: string
  level: number
}

const route = useRoute()
const tocItems = ref<TocItem[]>([])
const activeId = ref('')

function extractHeadings() {
  const content = document.querySelector('.markdown-body')
  if (!content) return

  const headings = content.querySelectorAll('h2, h3')
  const items: TocItem[] = []

  headings.forEach((heading) => {
    const el = heading as HTMLElement
    if (!el.id) {
      el.id = el.textContent?.trim().replace(/\s+/g, '-').toLowerCase() || ''
    }
    items.push({
      id: el.id,
      text: el.textContent || '',
      level: el.tagName === 'H2' ? 2 : 3,
    })
  })

  tocItems.value = items
}

function updateActiveHeading() {
  const headings = document.querySelectorAll('.markdown-body h2, .markdown-body h3')
  let current = ''

  headings.forEach((heading) => {
    const el = heading as HTMLElement
    const rect = el.getBoundingClientRect()
    if (rect.top <= 120) {
      current = el.id
    }
  })

  activeId.value = current
}

function handleScroll() {
  updateActiveHeading()
}

function scrollToHeading(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

onMounted(() => {
  nextTick(() => {
    extractHeadings()
    updateActiveHeading()
  })
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

watch(
  () => route.path,
  () => {
    nextTick(() => {
      setTimeout(() => {
        extractHeadings()
        updateActiveHeading()
        window.scrollTo(0, 0)
      }, 100)
    })
  },
)
</script>

<template>
  <aside class="toc" v-if="tocItems.length > 0">
    <div class="toc-title">本页目录</div>
    <nav class="toc-nav">
      <a
        v-for="item in tocItems"
        :key="item.id"
        :href="`#${item.id}`"
        class="toc-link"
        :class="{
          active: activeId === item.id,
          'toc-h3': item.level === 3,
        }"
        @click.prevent="scrollToHeading(item.id)"
      >
        {{ item.text }}
      </a>
    </nav>
  </aside>
</template>

<style scoped>
.toc {
  position: fixed;
  top: 60px;
  right: 0;
  bottom: 0;
  width: 220px;
  padding: 1.5rem 1rem;
  overflow-y: auto;
  border-left: 1px solid var(--border-color);
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  box-shadow: var(--shadow-sm);
}

.toc-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.toc-nav {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.toc-link {
  display: block;
  padding: 0.3rem 0.5rem;
  font-size: 0.82rem;
  color: var(--text-secondary);
  text-decoration: none;
  border-left: 2px solid transparent;
  transition: all 0.2s;
  line-height: 1.5;
  border-radius: 0 6px 6px 0;
}

.toc-link:hover {
  color: var(--text-link);
  background: var(--bg-glass-hover);
}

.toc-link.active {
  color: var(--text-link);
  border-left-color: var(--accent);
  font-weight: 500;
  background: var(--accent-light);
}

.toc-h3 {
  padding-left: 1.2rem;
  font-size: 0.78rem;
}

@media (max-width: 1279px) {
  .toc {
    display: none;
  }
}
</style>
