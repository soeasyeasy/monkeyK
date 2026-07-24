<script setup lang="ts">
import ThemeSwitcher from './ThemeSwitcher.vue'
</script>

<template>
  <header class="app-header">
    <div class="header-content">
      <RouterLink to="/" class="header-logo">
        <span class="logo-icon">📚</span>
        <span class="logo-text">全栈学习中心</span>
      </RouterLink>

      <nav class="header-nav">
        <RouterLink to="/tutorials" class="nav-link">教程</RouterLink>
        <RouterLink to="/todo" class="nav-link">待办</RouterLink>
        <RouterLink to="/life" class="nav-link">生活</RouterLink>
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
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  color: inherit;
}

.logo-icon {
  font-size: 1.5rem;
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

@media (max-width: 640px) {
  .header-content {
    padding: 0 1rem;
  }

  .logo-text {
    display: none;
  }

  .nav-link {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }
}
</style>
