<script setup lang="ts">
/**
 * Markdown 编辑器组件
 * 支持编辑模式和实时预览模式切换
 */
import { ref, computed } from 'vue'
import MarkdownRenderer from '../MarkdownRenderer.vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  rows?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

type Mode = 'write' | 'preview'
const mode = ref<Mode>('write')

const value = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})
</script>

<template>
  <div class="markdown-editor">
    <div class="editor-toolbar">
      <button
        class="tool-btn"
        :class="{ active: mode === 'write' }"
        @click="mode = 'write'"
      >编辑</button>
      <button
        class="tool-btn"
        :class="{ active: mode === 'preview' }"
        @click="mode = 'preview'"
      >预览</button>
    </div>
    <div class="editor-body">
      <textarea
        v-if="mode === 'write'"
        v-model="value"
        class="editor-textarea"
        :placeholder="placeholder || '支持 Markdown 语法...'"
        :rows="rows || 4"
      ></textarea>
      <div v-else class="editor-preview">
        <MarkdownRenderer v-if="value.trim()" :content="value" />
        <span v-else class="preview-empty">暂无内容</span>
      </div>
    </div>
    <div class="editor-hint">支持 Markdown：# 标题、**粗体**、- 列表、`代码` 等</div>
  </div>
</template>

<style scoped>
.markdown-editor {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-input);
}

.editor-toolbar {
  display: flex;
  gap: 0.25rem;
  padding: 0.35rem;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
}

.tool-btn {
  padding: 0.2rem 0.5rem;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
}

.tool-btn:hover {
  color: var(--text-primary);
}

.tool-btn.active {
  background: var(--accent-light);
  color: var(--accent);
  font-weight: 500;
}

.editor-body {
  min-height: 80px;
}

.editor-textarea {
  width: 100%;
  padding: 0.5rem 0.65rem;
  border: none;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.825rem;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  outline: none;
}

.editor-preview {
  padding: 0.5rem 0.65rem;
  min-height: 80px;
  max-height: 200px;
  overflow-y: auto;
}

.preview-empty {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.editor-hint {
  padding: 0.25rem 0.65rem;
  background: var(--bg-card);
  border-top: 1px solid var(--border-color);
  font-size: 0.65rem;
  color: var(--text-secondary);
}

.editor-preview :deep(.markdown-body) {
  font-size: 0.875rem;
}

.editor-preview :deep(.markdown-body h1),
.editor-preview :deep(.markdown-body h2),
.editor-preview :deep(.markdown-body h3) {
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
}

.editor-preview :deep(.markdown-body p) {
  margin-bottom: 0.5rem;
}

.editor-preview :deep(.markdown-body pre.hljs) {
  margin-bottom: 0.75rem;
}
</style>
