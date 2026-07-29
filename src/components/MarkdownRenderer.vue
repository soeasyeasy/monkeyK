<script setup lang="ts">
/**
 * Markdown 渲染器组件
 * 将 Markdown 内容渲染为 HTML，并提取标题用于目录导航
 */
import { computed, watch, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { renderMarkdown } from '../utils/markdown'

// 接收 Markdown 内容作为 prop
const props = defineProps<{
  content: string
}>()

// 渲染后的 HTML 内容
const html = computed(() => renderMarkdown(props.content))
// 渲染后的 DOM 元素引用
const renderedEl = ref<HTMLElement | null>(null)

// 提取标题用于目录
const emit = defineEmits<{
  (e: 'headings', headings: { id: string; text: string; level: number }[]): void
}>()

function extractHeadingsAndIds() {
  if (!renderedEl.value) return
  const headings = renderedEl.value.querySelectorAll('h2, h3')
  const result: { id: string; text: string; level: number }[] = []
  const idCount: Record<string, number> = {}
  headings.forEach((heading) => {
    const el = heading as HTMLElement
    const text = el.textContent || ''
    let id = text.trim().replace(/\s+/g, '-').toLowerCase()
    const count = idCount[id]
    if (count !== undefined) {
      const newCount = count + 1
      idCount[id] = newCount
      id = `${id}-${newCount}`
    } else {
      idCount[id] = 0
    }
    el.id = id
    result.push({ id, text, level: el.tagName === 'H2' ? 2 : 3 })
  })
  emit('headings', result)
}

onMounted(() => {
  nextTick(extractHeadingsAndIds)
})

watch(html, () => {
  nextTick(extractHeadingsAndIds)
})
</script>

<template>
  <div ref="renderedEl" class="markdown-body" v-html="html"></div>
</template>

<style scoped>
.markdown-body {
  font-family: inherit;
  line-height: 1.7;
  color: var(--text-primary);
}

.markdown-body :deep(h1) {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.markdown-body :deep(h2) {
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.markdown-body :deep(h3) {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.markdown-body :deep(p) {
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.markdown-body :deep(li) {
  margin-bottom: 0.25rem;
  color: var(--text-primary);
}

.markdown-body :deep(pre.hljs) {
  background: var(--bg-code);
  color: var(--text-code);
  padding: 1rem 1.25rem;
  border-radius: var(--radius-md);
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
  box-shadow: var(--shadow-sm);
}

.markdown-body :deep(code) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.markdown-body :deep(p code),
.markdown-body :deep(li code) {
  background: var(--bg-card);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
  color: var(--text-inline-code);
  border: 1px solid var(--border-color);
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid var(--accent);
  padding: 0.5rem 1rem;
  margin: 1rem 0;
  background: var(--bg-stat);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  color: var(--text-secondary);
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin: 1rem 0;
  background: var(--bg-card);
}

.markdown-body :deep(th) {
  background: var(--bg-table-header);
  color: var(--bg-badge-text);
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 500;
}

.markdown-body :deep(td) {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.9rem;
  color: var(--text-primary);
}

.markdown-body :deep(tr:nth-child(even)) {
  background: var(--bg-table-stripe);
}

.markdown-body :deep(tr:last-child td) {
  border-bottom: none;
}

.markdown-body :deep(a) {
  color: var(--text-link);
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 2rem 0;
}

/* 自定义容器样式 */
.markdown-body :deep(.tip-container),
.markdown-body :deep(.info-container),
.markdown-body :deep(.warning-container),
.markdown-body :deep(.danger-container) {
  padding: 1rem 1.25rem;
  border-radius: var(--radius-md);
  margin: 1rem 0;
  border-left: 4px solid;
}

.markdown-body :deep(.tip-container) {
  background: var(--bg-best);
  border-left-color: var(--accent);
}

.markdown-body :deep(.info-container) {
  background: var(--bg-stat);
  border-left-color: var(--text-link);
}

.markdown-body :deep(.warning-container) {
  background: var(--bg-tip);
  border-left-color: #ffc107;
}

.markdown-body :deep(.danger-container) {
  background: rgba(239, 68, 68, 0.1);
  border-left-color: #ef4444;
}

.markdown-body :deep(.container-title) {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.markdown-body :deep(.container-content) {
  color: var(--text-primary);
}

.markdown-body :deep(.container-content p:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(.container-content ul),
.markdown-body :deep(.container-content ol) {
  margin-bottom: 0;
}

/* 代码高亮（基础） */
.markdown-body :deep(.hljs-keyword) {
  color: #c678dd;
}
.markdown-body :deep(.hljs-string) {
  color: #98c379;
}
.markdown-body :deep(.hljs-number) {
  color: #d19a66;
}
.markdown-body :deep(.hljs-comment) {
  color: #7c7c7c;
  font-style: italic;
}
.markdown-body :deep(.hljs-function) {
  color: #61afef;
}
.markdown-body :deep(.hljs-class) {
  color: #e5c07b;
}
.markdown-body :deep(.hljs-title) {
  color: #61afef;
}
.markdown-body :deep(.hljs-attr) {
  color: #d19a66;
}
.markdown-body :deep(.hljs-built_in) {
  color: #e6c07b;
}
.markdown-body :deep(.hljs-meta) {
  color: #abb2bf;
}
.markdown-body :deep(.hljs-tag) {
  color: #e06c75;
}
.markdown-body :deep(.hljs-name) {
  color: #e06c75;
}
</style>
