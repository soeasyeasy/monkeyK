<script setup lang="ts">
/**
 * 教程布局组件
 * 提供教程页面的三栏布局：左侧边栏、主内容区、右侧目录
 */
import { ref, provide, computed } from 'vue'
import TutorialSidebar from '../components/TutorialSidebar.vue'
import TableOfContents from '../components/TableOfContents.vue'
import ThemeSwitcher from '../components/ThemeSwitcher.vue'
import SearchBar from '../components/SearchBar.vue'

// 侧边栏状态
const sidebarOpen = ref(false)
const isMobile = ref(window.innerWidth < 960)
window.addEventListener('resize', () => {
  isMobile.value = window.innerWidth < 960
})

// 目录数据，通过 provide 提供给子组件
interface TocItem {
  id: string
  text: string
  level: number
}

const tocItems = ref<TocItem[]>([])
provide('tocItems', tocItems)

// 是否有目录内容
const hasToc = computed(() => tocItems.value.length > 0)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div class="doc-layout">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="bg-blob bg-blob-1"></div>
      <div class="bg-blob bg-blob-2"></div>
      <div class="bg-blob bg-blob-3"></div>
    </div>

    <!-- 顶部导航栏 -->
    <header class="doc-header">
      <div class="header-left">
        <button class="menu-btn" @click="toggleSidebar" aria-label="菜单">
          <span class="hamburger" :class="{ open: sidebarOpen }">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        <RouterLink :to="isMobile ? '/' : '/tutorials'" class="header-logo">
          <span class="logo-badge">MonkeyK</span>
          <span class="logo-name">知新</span>
        </RouterLink>
      </div>
      <nav class="header-nav">
        <RouterLink to="/" class="home-link">首页</RouterLink>
        <RouterLink to="/tutorials" class="active">教程</RouterLink>
        <!-- <a href="https://www.typescriptlang.org/docs/" target="_blank" rel="noopener">官方文档</a> -->
        <SearchBar />
        <ThemeSwitcher />
      </nav>
    </header>

    <!-- 左侧边栏遮罩（移动端） -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>

    <!-- 左侧边栏 -->
    <TutorialSidebar :class="{ mobileOpen: sidebarOpen }" />

    <!-- 右侧目录栏 -->
    <TableOfContents />

    <!-- 主内容区 -->
    <main class="doc-main" :class="{ 'no-toc': !hasToc }">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.doc-layout {
  min-height: 100vh;
  background: var(--bg-primary);
  position: relative;
  overflow-x: hidden;
}

/* 背景装饰 */
.bg-decoration {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: float 20s infinite ease-in-out;
}

.bg-blob-1 {
  width: 400px;
  height: 400px;
  background: var(--accent);
  top: -100px;
  right: -100px;
  opacity: 0.15;
}

.bg-blob-2 {
  width: 500px;
  height: 500px;
  background: var(--accent);
  bottom: -150px;
  left: -150px;
  opacity: 0.1;
  animation-delay: -7s;
}

.bg-blob-3 {
  width: 300px;
  height: 300px;
  background: var(--accent);
  top: 50%;
  left: 50%;
  opacity: 0.08;
  animation-delay: -14s;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

/* 顶部导航栏 */
.doc-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--bg-glass-strong);
  backdrop-filter: blur(var(--blur-strong));
  -webkit-backdrop-filter: blur(var(--blur-strong));
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  z-index: 100;
  box-shadow: var(--shadow-sm);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.menu-btn {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.4rem;
}

.hamburger {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 20px;
}

.hamburger span {
  display: block;
  height: 2px;
  background: var(--text-primary);
  border-radius: 2px;
  transition: all 0.3s;
}

.hamburger.open span:nth-child(1) {
  transform: rotate(45deg) translate(4px, 4px);
}

.hamburger.open span:nth-child(2) {
  opacity: 0;
}

.hamburger.open span:nth-child(3) {
  transform: rotate(-45deg) translate(4px, -4px);
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: inherit;
}

.logo-badge {
  background: var(--accent);
  color: var(--bg-badge-text);
  font-weight: 700;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  box-shadow: var(--shadow-sm);
}

.logo-name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-primary);
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-nav a {
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 0.9rem;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.header-nav a:hover {
  color: var(--text-link);
  background: var(--accent-light);
}

.header-nav a.active {
  color: var(--text-link);
  font-weight: 500;
}

/* 主内容区 */
.doc-main {
  margin-left: 260px;
  margin-right: 220px;
  margin-top: 60px;
  min-height: calc(100vh - 60px);
  position: relative;
  z-index: 1;
}

.doc-main.no-toc {
  margin-right: 0;
}

/* 侧边栏遮罩 */
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  backdrop-filter: blur(4px);
  z-index: 9;
}

/* 响应式 */
@media (max-width: 959px) {
  .menu-btn {
    display: block;
  }

  .sidebar-overlay {
    display: block;
  }

  .doc-main {
    margin-left: 0;
    margin-right: 0;
  }

  .header-nav a:not(.theme-switcher-wrapper) {
    display: none;
  }

  .logo-name {
    display: none;
  }
}
</style>
