<script setup lang="ts">
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import { useWorkspace } from '../../composables/useWorkspace'
import ModuleCard from './ModuleCard.vue'
import WsIcon from './WsIcon.vue'
import TodoModule from './TodoModule.vue'
import HabitModule from './HabitModule.vue'
import AccountingModule from './AccountingModule.vue'
import GoalModule from './GoalModule.vue'
import FavoriteModule from './FavoriteModule.vue'

const { modules, toggleModuleCollapsed } = useWorkspace()

const moduleMeta: Record<string, { icon: string; color: string }> = {
  todo: { icon: 'checklist', color: '#3b82f6' },
  habit: { icon: 'flame', color: '#f59e0b' },
  accounting: { icon: 'wallet', color: '#10b981' },
  goal: { icon: 'target', color: '#8b5cf6' },
  favorite: { icon: 'bookmark', color: '#ec4899' },
}

const dragList = ref([...modules.value].filter((m) => m.visible).sort((a, b) => a.order - b.order))

watch(
  () => modules.value.map((m) => ({ id: m.id, visible: m.visible, order: m.order })),
  () => {
    dragList.value = [...modules.value].filter((m) => m.visible).sort((a, b) => a.order - b.order)
  },
  { deep: true },
)

function handleDragEnd() {
  dragList.value.forEach((m, index) => {
    const original = modules.value.find((orig) => orig.id === m.id)
    if (original) {
      original.order = index
    }
  })
  try {
    localStorage.setItem('workspace-layout', JSON.stringify(modules.value))
  } catch (e) {
    console.error('Failed to save layout:', e)
  }
}
</script>

<template>
  <div class="dashboard">
    <draggable
      v-model="dragList"
      item-key="id"
      class="module-grid"
      ghost-class="ghost"
      @end="handleDragEnd"
    >
      <template #item="{ element, index }">
        <div class="grid-item" :style="{ animationDelay: `${index * 0.06}s` }">
          <ModuleCard
            :title="element.title"
            :icon="moduleMeta[element.type]?.icon || ''"
            :collapsed="element.collapsed"
            :color="moduleMeta[element.type]?.color"
            @toggle-collapse="toggleModuleCollapsed(element.id)"
          >
            <TodoModule v-if="element.type === 'todo'" />
            <HabitModule v-else-if="element.type === 'habit'" />
            <AccountingModule v-else-if="element.type === 'accounting'" />
            <GoalModule v-else-if="element.type === 'goal'" />
            <FavoriteModule v-else-if="element.type === 'favorite'" />
          </ModuleCard>
        </div>
      </template>
    </draggable>

    <div v-if="modules.filter((m) => m.visible).length === 0" class="empty-dashboard">
      <WsIcon name="grid" :size="48" class="empty-icon" />
      <h3>暂无模块</h3>
      <p>点击左侧"管理模块"添加你需要的模块</p>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  width: 100%;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.grid-item {
  animation: cardEnter 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ghost {
  opacity: 0.3;
  background: var(--accent-light);
  border-radius: var(--radius-md);
}

.empty-dashboard {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-secondary);
}

.empty-icon {
  margin-bottom: 1rem;
  opacity: 0.4;
  color: var(--text-secondary);
}

.empty-dashboard h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.empty-dashboard p {
  margin: 0;
  font-size: 0.8rem;
}

@media (max-width: 900px) {
  .module-grid {
    grid-template-columns: 1fr;
  }
}
</style>
