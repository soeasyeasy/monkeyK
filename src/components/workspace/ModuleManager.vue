<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWorkspace } from '../../composables/useWorkspace'
import WsIcon from './WsIcon.vue'

const emit = defineEmits<{
  close: []
}>()

const { modules, toggleModuleVisibility, resetLayout } = useWorkspace()

const moduleIcons: Record<string, string> = {
  todo: 'checklist',
  habit: 'flame',
  accounting: 'wallet',
  goal: 'target'
}

const moduleNames: Record<string, string> = {
  todo: '待办事项',
  habit: '习惯打卡',
  accounting: '记账管理',
  goal: '目标追踪'
}

const moduleDescs: Record<string, string> = {
  todo: '管理日常待办，追踪任务进度',
  habit: '养成好习惯，每日打卡记录',
  accounting: '记录日常支出，管理财务预算',
  goal: '设定目标，追踪实现进度'
}

const localModules = ref(modules.value)

const handleToggleVisibility = (moduleId: string) => {
  toggleModuleVisibility(moduleId)
  localModules.value = modules.value
}

const handleReset = () => {
  if (confirm('确定要重置所有模块到默认状态吗？这将恢复所有模块的可见性和顺序。')) {
    resetLayout()
    localModules.value = modules.value
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div class="module-manager">
    <div class="manager-header">
      <h2>模块管理</h2>
      <button @click="handleClose" class="close-btn">
        <WsIcon name="x" :size="20" />
      </button>
    </div>

    <div class="manager-content">
      <p class="description">
        选择要显示的模块。你可以在工作台上拖拽模块来调整顺序。
      </p>

      <div class="module-list">
        <div
          v-for="module in localModules"
          :key="module.id"
          class="module-item"
        >
          <div class="module-info">
            <div class="module-icon">
              <WsIcon :name="moduleIcons[module.type] || 'grid'" :size="24" />
            </div>
            <div class="module-details">
              <div class="module-name">{{ moduleNames[module.type] }}</div>
              <div class="module-desc">{{ moduleDescs[module.type] }}</div>
            </div>
          </div>
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="module.visible"
              @change="handleToggleVisibility(module.id)"
            />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="manager-actions">
        <button @click="handleReset" class="reset-btn">
          <WsIcon name="refresh" :size="16" />
          重置为默认
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.module-manager {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.manager-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.manager-content {
  padding: 1.5rem;
  overflow-y: auto;
}

.description {
  margin: 0 0 1.5rem 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
}

.module-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.module-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.module-item:hover {
  border-color: var(--accent);
  background: var(--bg-card-hover);
}

.module-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.module-icon {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  background: var(--bg-card);
  border-radius: var(--radius-md);
}

.module-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.module-name {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
}

.module-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-card-hover);
  transition: 0.3s;
  border-radius: 24px;
  border: 1px solid var(--border-color);
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background-color: var(--text-secondary);
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--accent);
  border-color: var(--accent);
}

input:checked + .slider:before {
  transform: translateX(24px);
  background-color: white;
}

.manager-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: var(--bg-card-hover);
  border-color: var(--accent);
  color: var(--text-primary);
}
</style>
