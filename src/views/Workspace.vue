<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import { useWorkspace } from '../composables/useWorkspace'
import { useTodos } from '../composables/useTodos'
import { useHabits } from '../composables/useHabits'
import { useAccounting } from '../composables/useAccounting'
import HomeSummary from '../components/workspace/HomeSummary.vue'
import AiAssistant from '../components/workspace/AiAssistant.vue'
import ModuleManager from '../components/workspace/ModuleManager.vue'
import OverviewCard from '../components/workspace/OverviewCard.vue'
import TodoModule from '../components/workspace/TodoModule.vue'
import HabitModule from '../components/workspace/HabitModule.vue'
import AccountingModule from '../components/workspace/AccountingModule.vue'
import GoalModule from '../components/workspace/GoalModule.vue'
import CalendarView from '../components/workspace/CalendarView.vue'
import SmallCalendar from '../components/workspace/SmallCalendar.vue'
import FavoriteModule from '../components/workspace/FavoriteModule.vue'
import ModuleCard from '../components/workspace/ModuleCard.vue'
import WsIcon from '../components/workspace/WsIcon.vue'

const router = useRouter()
const settingsStore = useSettingsStore()
const { modules } = useWorkspace()
const { getTodayStats, addTodo } = useTodos()
const { habits } = useHabits()
const { getBudgetProgress } = useAccounting()

const showAiAssistant = ref(false)
const showModuleManager = ref(false)
const sidebarCollapsed = ref(false)
const quickTodoText = ref('')

const greeting = computed(() => {
  const hour = new Date().getHours()
  const nickname = settingsStore.settings.nickname || '朋友'
  if (hour < 6) return `夜深了，${nickname}`
  if (hour < 9) return `早上好，${nickname}`
  if (hour < 12) return `上午好，${nickname}`
  if (hour < 14) return `中午好，${nickname}`
  if (hour < 18) return `下午好，${nickname}`
  if (hour < 22) return `晚上好，${nickname}`
  return `夜深了，${nickname}`
})

const currentDate = computed(() => {
  const date = new Date()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 星期${weekdays[date.getDay()]}`
})

type NavId = 'home' | 'todo' | 'habit' | 'accounting' | 'goal' | 'calendar' | 'favorite'

const activeNav = ref<NavId>('home')

const navItems = computed(() =>
  [
    { id: 'home' as NavId, icon: 'home', label: '首页控制台' },
    { id: 'todo' as NavId, icon: 'checklist', label: '待办事项' },
    { id: 'habit' as NavId, icon: 'flame', label: '习惯打卡' },
    { id: 'accounting' as NavId, icon: 'wallet', label: '记账管理' },
    { id: 'goal' as NavId, icon: 'target', label: '目标追踪' },
    { id: 'calendar' as NavId, icon: 'calendar', label: '我的日程' },
    { id: 'favorite' as NavId, icon: 'bookmark', label: '我的收藏' },
  ].map((item) => ({ ...item, active: item.id === activeNav.value })),
)

const pageTitle = computed(() => {
  const titles: Record<NavId, string> = {
    home: '首页控制台',
    todo: '待办事项',
    habit: '习惯打卡',
    accounting: '记账管理',
    goal: '目标追踪',
    calendar: '我的日程',
    favorite: '我的收藏',
  }
  return titles[activeNav.value]
})

function goToCalendar() {
  activeNav.value = 'calendar'
}

const todayTodoStats = computed(() => getTodayStats())

const todayHabitStats = computed(() => {
  const activeHabits = habits.value.filter((h) => h.active)
  const completed = activeHabits.filter((h) => {
    const today = new Date().toISOString().split('T')[0] ?? ''
    return h.records.some((r) => r.date === today && r.completed)
  }).length
  return { total: activeHabits.length, completed }
})

const budgetStats = computed(() => getBudgetProgress())

const quickAddTodo = () => {
  const text = quickTodoText.value.trim()
  if (!text) return
  addTodo(text, 'medium', new Date().toISOString().split('T')[0] ?? '')
  quickTodoText.value = ''
}

const goToSettings = () => router.push('/settings')
</script>

<template>
  <div class="workspace-page">
    <!-- 左侧导航栏 -->
    <nav class="ws-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-brand">
        <WsIcon name="puzzle" :size="22" class="brand-icon" />
        <span v-if="!sidebarCollapsed" class="brand-text">AI 工作台</span>
      </div>

      <div class="sidebar-nav">
        <button
          v-for="item in navItems"
          :key="item.label"
          class="nav-item"
          :class="{ active: item.active }"
          :title="item.label"
          @click="activeNav = item.id"
        >
          <WsIcon :name="item.icon" :size="18" />
          <span v-if="!sidebarCollapsed" class="nav-label">{{ item.label }}</span>
        </button>
      </div>

      <div class="sidebar-bottom">
        <button class="nav-item" @click="showModuleManager = true" title="管理模块">
          <WsIcon name="grid" :size="18" />
          <span v-if="!sidebarCollapsed" class="nav-label">管理模块</span>
        </button>
        <button class="nav-item" @click="goToSettings" title="设置">
          <WsIcon name="settings" :size="18" />
          <span v-if="!sidebarCollapsed" class="nav-label">设置</span>
        </button>
        <button
          class="collapse-toggle"
          @click="sidebarCollapsed = !sidebarCollapsed"
          :title="sidebarCollapsed ? '展开侧栏' : '收起侧栏'"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            :style="{ transform: sidebarCollapsed ? 'rotate(180deg)' : '' }"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>
    </nav>

    <!-- 右侧主区域 -->
    <div class="ws-main">
      <!-- 顶部标题栏 -->
      <header class="ws-header">
        <div class="header-left">
          <span class="header-date">{{ currentDate }}</span>
          <h1 class="header-title">{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <div class="header-search">
            <WsIcon name="search" :size="16" />
            <input type="text" placeholder="搜索任务、目标..." class="search-input" />
          </div>
          <button @click="showAiAssistant = !showAiAssistant" class="ai-toggle-btn">
            <WsIcon name="ai" :size="18" />
            AI 助手
          </button>
        </div>
      </header>

      <!-- 内容区 -->
      <div class="ws-body">
        <!-- 左中区域 -->
        <div class="ws-center">
          <div class="greeting-bar">
            <span class="greeting-text">{{ greeting }}</span>
          </div>

          <OverviewCard v-if="activeNav === 'home'" @navigate="activeNav = $event" />

          <template v-if="activeNav === 'home'">
            <HomeSummary @navigate="activeNav = $event" />
          </template>

          <template v-if="activeNav === 'todo'">
            <ModuleCard title="待办事项" icon="checklist" :color="'#3b82f6'">
              <TodoModule />
            </ModuleCard>
          </template>

          <template v-if="activeNav === 'habit'">
            <ModuleCard title="习惯打卡" icon="flame" :color="'#f59e0b'">
              <HabitModule />
            </ModuleCard>
          </template>

          <template v-if="activeNav === 'accounting'">
            <ModuleCard title="记账管理" icon="wallet" :color="'#10b981'">
              <AccountingModule />
            </ModuleCard>
          </template>

          <template v-if="activeNav === 'goal'">
            <ModuleCard title="目标追踪" icon="target" :color="'#8b5cf6'">
              <GoalModule />
            </ModuleCard>
          </template>

          <template v-if="activeNav === 'calendar'">
            <ModuleCard title="我的日程" icon="calendar" :color="'#ec4899'">
              <CalendarView />
            </ModuleCard>
          </template>

          <template v-if="activeNav === 'favorite'">
            <ModuleCard title="我的收藏" icon="bookmark" :color="'#ec4899'">
              <FavoriteModule />
            </ModuleCard>
          </template>
        </div>

        <!-- 右侧信息面板 -->
        <aside class="ws-right-panel">
          <div class="info-card">
            <span class="info-label">当前时间</span>
            <span class="info-big">{{
              new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            }}</span>
            <span class="info-sub">{{ currentDate }}</span>
          </div>

          <SmallCalendar @select-date="goToCalendar" />

          <!-- 快捷操作区 -->
          <div class="info-card quick-add-card">
            <span class="info-label">快速添加待办</span>
            <div class="quick-add-row">
              <input
                v-model="quickTodoText"
                type="text"
                placeholder="输入后回车..."
                class="quick-add-input"
                @keyup.enter="quickAddTodo"
              />
              <button class="quick-add-btn" @click="quickAddTodo">
                <WsIcon name="send" :size="14" />
              </button>
            </div>
          </div>

          <!-- 今日概览 -->
          <div class="info-card overview-card" v-if="activeNav === 'home'">
            <span class="info-label">今日概览</span>
            <div class="overview-stats">
              <div class="overview-item">
                <span class="overview-value"
                  >{{ todayTodoStats.completed }}/{{ todayTodoStats.total }}</span
                >
                <span class="overview-label">待办完成</span>
              </div>
              <div class="overview-item">
                <span class="overview-value"
                  >{{ todayHabitStats.completed }}/{{ todayHabitStats.total }}</span
                >
                <span class="overview-label">习惯打卡</span>
              </div>
            </div>
          </div>

          <button class="info-card ai-card" @click="showAiAssistant = true">
            <span class="info-label">AI 助手</span>
            <WsIcon name="zap" :size="28" class="info-icon" />
            <span class="info-sub">点击开启智能助手</span>
          </button>
        </aside>
      </div>
    </div>

    <!-- AI 助手侧边栏 -->
    <Transition name="slide">
      <aside v-if="showAiAssistant" class="ai-sidebar">
        <div class="ai-sidebar-header">
          <div class="ai-sidebar-title">
            <WsIcon name="ai" :size="20" />
            <h2>AI 助手</h2>
          </div>
          <button @click="showAiAssistant = false" class="ai-close-btn">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <AiAssistant />
      </aside>
    </Transition>

    <!-- 模块管理器弹窗 -->
    <Transition name="fade">
      <div v-if="showModuleManager" class="modal-overlay" @click="showModuleManager = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>管理模块</h2>
            <button @click="showModuleManager = false" class="ai-close-btn">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <ModuleManager @close="showModuleManager = false" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.workspace-page {
  display: flex;
  min-height: calc(100vh - 60px);
  background: var(--bg-primary);
  color: var(--text-primary);
}

/* ===== 左侧导航栏 ===== */
.ws-sidebar {
  width: 220px;
  background: var(--bg-glass-strong);
  backdrop-filter: blur(var(--blur-strong));
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 1rem 0.75rem;
  flex-shrink: 0;
  transition: width 0.25s ease;
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
  overflow-y: auto;
}

.ws-sidebar.collapsed {
  width: 60px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0.75rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.brand-icon {
  flex-shrink: 0;
}

.brand-text {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem 0.75rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.15s;
  text-align: left;
  white-space: nowrap;
}

.nav-item:hover {
  background: var(--accent-light);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--accent-light);
  color: var(--accent);
  font-weight: 600;
}

.nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-bottom {
  border-top: 1px solid var(--border-color);
  padding-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.collapse-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.15s;
  margin-top: 0.25rem;
}

.collapse-toggle:hover {
  background: var(--accent-light);
  color: var(--text-primary);
}

.collapse-toggle svg {
  transition: transform 0.25s;
}

/* ===== 右侧主区域 ===== */
.ws-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow-x: hidden;
}

.ws-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 2rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-glass-strong);
  backdrop-filter: blur(var(--blur-strong));
  flex-shrink: 0;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.header-date {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.header-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
}

.search-input {
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.85rem;
  outline: none;
  width: 180px;
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.ai-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--accent-light);
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  color: var(--accent);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
}

.ai-toggle-btn:hover {
  background: var(--accent);
  color: white;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* ===== 内容区 ===== */
.ws-body {
  flex: 1;
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem 2rem;
  overflow-y: auto;
}

.ws-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
}

.greeting-text {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* ===== 右侧信息面板 ===== */
.ws-right-panel {
  width: 230px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 1.1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all 0.2s;
  text-align: left;
}

.info-card:hover {
  border-color: var(--border-hover);
  background: var(--bg-card-hover);
}

.info-label {
  font-size: 0.68rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.info-big {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.1;
}

.info-sub {
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.info-icon {
  color: var(--accent);
}

.summary-card {
  cursor: pointer;
}

.summary-card:hover {
  border-color: var(--accent);
  background: var(--bg-card-hover);
}

.progress-bar {
  height: 4px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-top: 0.2rem;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: var(--radius-sm);
  transition: width 0.3s ease;
}

.progress-fill.danger {
  background: var(--danger, #ef4444);
}

.quick-add-card {
  gap: 0.5rem;
}

.quick-add-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.quick-add-input {
  flex: 1;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.8rem;
  outline: none;
}

.quick-add-input:focus {
  border-color: var(--accent);
}

.quick-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: white;
  cursor: pointer;
  transition: all 0.15s;
}

.quick-add-btn:hover {
  opacity: 0.9;
}

/* 今日概览卡片 */
.overview-card {
  gap: 0.6rem;
}

.overview-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.overview-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.5rem;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
}

.overview-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.overview-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.ai-card {
  cursor: pointer;
  border-color: var(--accent-light);
}

.ai-card:hover {
  border-color: var(--accent);
  background: var(--accent-light);
}

/* ===== AI 侧边栏 ===== */
.ai-sidebar {
  position: fixed;
  right: 0;
  top: 60px;
  bottom: 0;
  width: 400px;
  background: var(--bg-card);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  z-index: 200;
  box-shadow: -8px 0 30px rgba(0, 0, 0, 0.15);
}

.ai-sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.ai-sidebar-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
}

.ai-sidebar-title h2 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.ai-close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.4rem;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  transition: all 0.15s;
}

.ai-close-btn:hover {
  background: var(--accent-light);
  color: var(--text-primary);
}

/* ===== 弹窗 ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

/* ===== 动画 ===== */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1024px) {
  .ws-sidebar {
    width: 60px;
  }
  .nav-label,
  .brand-text {
    display: none;
  }
  .ws-right-panel {
    display: none;
  }
  .ws-body {
    padding: 1rem;
  }
  .ws-header {
    padding: 1rem;
  }
  .header-search {
    display: none;
  }
}

@media (max-width: 768px) {
  .ws-sidebar {
    display: none;
  }
  .ai-sidebar {
    width: 100%;
  }
}
</style>
