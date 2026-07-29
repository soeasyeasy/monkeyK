<script setup lang="ts">
/**
 * 应用顶部导航栏组件
 * 包含 Logo、导航链接、搜索栏、天气组件和主题切换器
 */
import ThemeSwitcher from './ThemeSwitcher.vue'
import SearchBar from './SearchBar.vue'
import WeatherWidget from './WeatherWidget.vue'
</script>

<template>
  <header class="app-header">
    <div class="header-content">
      <RouterLink to="/" class="header-logo">
        <span class="logo-text">MonkeyK</span>
      </RouterLink>

      <nav class="header-nav">
        <SearchBar />
        <RouterLink to="/tutorials" class="nav-link">教程</RouterLink>
        <RouterLink to="/todo" class="nav-link">待办</RouterLink>
        <RouterLink to="/life" class="nav-link">生活</RouterLink>
        <a href="https://github.com/soeasyeasy/monkeyK" target="_blank" rel="noopener" class="nav-link github-link">GitHub</a>
        <WeatherWidget />
        <ThemeSwitcher />
      </nav>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--bg-glass-strong);
  backdrop-filter: blur(var(--blur-strong));
  -webkit-backdrop-filter: blur(var(--blur-strong));
  border-bottom: 1px solid var(--border-color);
  z-index: 100;
  box-shadow: var(--shadow-sm);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
}

.header-logo {
  text-decoration: none;
  color: inherit;
}

.logo-text {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link {
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  transition: all 0.2s;
  font-weight: 500;
}

.nav-link:hover {
  color: var(--text-link);
  background: var(--accent-light);
}

.nav-link.router-link-active {
  color: var(--text-link);
  background: var(--accent-light);
}

.github-link {
  display: inline-flex;
  align-items: center;
}

.github-link::before {
  content: '';
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 0.4rem;
  background: currentColor;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z'/%3E%3C/svg%3E") no-repeat center;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z'/%3E%3C/svg%3E") no-repeat center;
}

@media (max-width: 640px) {
  .header-content {
    padding: 0 0.75rem;
  }

  .logo-text {
    display: none;
  }

  .header-nav {
    gap: 0.15rem;
  }

  .nav-link {
    padding: 0.35rem 0.5rem;
    font-size: 0.78rem;
    white-space: nowrap;
  }
}
</style>
