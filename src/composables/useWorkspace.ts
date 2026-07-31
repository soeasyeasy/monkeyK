/**
 * 工作台管理 Composable
 * 负责管理模块布局、显示/隐藏、排序等
 */
import { ref, computed } from 'vue'
import type { WorkspaceModule } from '../types/workspace'
import { defaultModules } from '../data/workspace-defaults'

const STORAGE_KEY = 'workspace-layout'

function mergeWithDefaults(saved: WorkspaceModule[]): WorkspaceModule[] {
  const map = new Map(saved.map((m) => [m.id, m]))
  const merged: WorkspaceModule[] = []
  let nextOrder = 0

  defaultModules.forEach((def) => {
    const existing = map.get(def.id)
    if (existing) {
      merged.push({ ...existing, type: def.type, title: def.title, order: nextOrder++ })
      map.delete(def.id)
    } else {
      merged.push({ ...def, order: nextOrder++ })
    }
  })

  // 保留已移除默认模块中的自定义模块（如有），放在最后
  map.forEach((m) => {
    merged.push({ ...m, order: nextOrder++ })
  })

  return merged
}

function loadLayout(): WorkspaceModule[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as WorkspaceModule[]
      return mergeWithDefaults(parsed)
    }
  } catch (e) {
    console.error('Failed to load workspace layout:', e)
  }
  return [...defaultModules]
}

function saveLayout(modules: WorkspaceModule[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modules))
  } catch (e) {
    console.error('Failed to save workspace layout:', e)
  }
}

export function useWorkspace() {
  const modules = ref<WorkspaceModule[]>(loadLayout())

  // 可见模块（按 order 排序）
  const visibleModules = computed(() => {
    return modules.value.filter((m) => m.visible).sort((a, b) => a.order - b.order)
  })

  // 所有模块（按 order 排序）
  const allModules = computed(() => {
    return [...modules.value].sort((a, b) => a.order - b.order)
  })

  // 切换模块可见性
  function toggleModuleVisibility(moduleId: string) {
    const module = modules.value.find((m) => m.id === moduleId)
    if (module) {
      module.visible = !module.visible
      saveLayout(modules.value)
    }
  }

  // 切换模块折叠状态
  function toggleModuleCollapsed(moduleId: string) {
    const module = modules.value.find((m) => m.id === moduleId)
    if (module) {
      module.collapsed = !module.collapsed
      saveLayout(modules.value)
    }
  }

  // 更新模块顺序
  function updateModuleOrder(newOrder: WorkspaceModule[]) {
    modules.value = newOrder.map((m, index) => ({
      ...m,
      order: index,
    }))
    saveLayout(modules.value)
  }

  // 重置布局
  function resetLayout() {
    modules.value = [...defaultModules]
    saveLayout(modules.value)
  }

  return {
    modules,
    visibleModules,
    allModules,
    toggleModuleVisibility,
    toggleModuleCollapsed,
    updateModuleOrder,
    resetLayout,
  }
}
