<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getSeriesById, getSeriesSections } from '../data/tutorial-series'

const route = useRoute()
const router = useRouter()

const seriesId = computed(() => route.params.seriesId as string)
const chapterSlug = computed(() => route.params.chapterSlug as string)
const series = computed(() => getSeriesById(seriesId.value))
const sections = computed(() => {
  if (!series.value) return []
  return getSeriesSections(series.value)
})

function isActive(slug: string): boolean {
  return chapterSlug.value === slug
}

function navigate(slug: string) {
  router.push(`/tutorials/${seriesId.value}/${slug}`)
}
</script>

<template>
  <aside class="sidebar" :class="{ open: true }">
    <div class="sidebar-content">
      <div class="sidebar-header">
        <RouterLink to="/tutorials" class="sidebar-logo">
          <span class="logo-text">教程中心</span>
        </RouterLink>
      </div>

      <nav v-if="series" class="sidebar-nav">
        <RouterLink :to="`/tutorials/${series.id}`" class="series-title">
          {{ series.title }}
        </RouterLink>
        <div v-for="section in sections" :key="section" class="nav-group">
          <div class="nav-group-title">{{ section }}</div>
          <div
            v-for="chapter in series.chapters.filter((c) => c.section === section)"
            :key="chapter.number"
            class="nav-item"
            :class="{ active: isActive(chapter.slug) }"
            @click="navigate(chapter.slug)"
          >
            <span class="nav-num">{{ chapter.number }}</span>
            <span class="nav-title">{{ chapter.title }}</span>
          </div>
        </div>
      </nav>

      <nav v-else class="sidebar-nav">
        <div class="nav-group">
          <div class="nav-group-title">浏览</div>
          <RouterLink to="/tutorials" class="nav-item">
            <span class="nav-title">所有教程</span>
          </RouterLink>
        </div>
      </nav>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 60px;
  left: 0;
  bottom: 0;
  width: 260px;
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
  z-index: 10;
  transition: transform 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.sidebar-content {
  padding: 1.25rem 0;
}

.sidebar-header {
  padding: 0 1.25rem;
  margin-bottom: 1rem;
}

.sidebar-logo {
  text-decoration: none;
  color: inherit;
}

.logo-text {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.sidebar-nav {
  padding: 0 0.75rem;
}

.series-title {
  display: block;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.series-title:hover {
  background: var(--bg-glass-hover);
}

.nav-group {
  margin-bottom: 1rem;
}

.nav-group-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.4rem 0.5rem;
  margin-bottom: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.45rem 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  gap: 0.6rem;
  user-select: none;
  background: transparent;
  text-decoration: none;
  color: var(--text-secondary);
}

.nav-item:hover {
  background: var(--bg-glass-hover);
  transform: translateX(2px);
}

.nav-item.active {
  background: var(--accent-light);
  color: var(--text-link);
  box-shadow: var(--shadow-sm);
}

.nav-num {
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-weight: 600;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-item.active .nav-num {
  background: var(--accent);
  color: var(--bg-badge-text);
}

.nav-title {
  font-size: 0.88rem;
  line-height: 1.4;
}

@media (max-width: 959px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.mobileOpen {
    transform: translateX(0);
  }
}
</style>
