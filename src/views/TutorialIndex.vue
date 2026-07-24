<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { tutorialCategories, tutorialSeries, getSeriesByCategory } from '../data/tutorial-series'

const route = useRoute()
const activeCategory = computed(() => (route.query.category as string) || '')

const filteredSeries = computed(() => {
  if (activeCategory.value) {
    return getSeriesByCategory(activeCategory.value as any)
  }
  return tutorialSeries
})

const seriesByCategory = computed(() => {
  return tutorialCategories.map((cat) => ({
    category: cat,
    series: getSeriesByCategory(cat.id),
  }))
})
</script>

<template>
  <div class="tutorial-index">
    <div class="index-header">
      <h1>教程中心</h1>
      <p class="subtitle">全栈技术教程，持续更新中</p>
      <div class="category-tabs">
        <RouterLink to="/tutorials" class="tab" :class="{ active: !activeCategory }">
          全部
        </RouterLink>
        <RouterLink
          v-for="cat in tutorialCategories"
          :key="cat.id"
          :to="`/tutorials?category=${cat.id}`"
          class="tab"
          :class="{ active: activeCategory === cat.id }"
        >
          {{ cat.label }}
        </RouterLink>
      </div>
    </div>

    <div v-if="activeCategory" class="series-list">
      <div v-for="series in filteredSeries" :key="series.id" class="series-card">
        <RouterLink :to="`/tutorials/${series.id}`" class="series-link">
          <div class="series-info">
            <h2>{{ series.title }}</h2>
            <p>{{ series.description }}</p>
            <div class="series-meta">{{ series.chapters.length }} 章节</div>
          </div>
          <div class="series-arrow">→</div>
        </RouterLink>
      </div>
      <div v-if="filteredSeries.length === 0" class="empty-state">
        <p>该分类暂无教程系列</p>
      </div>
    </div>

    <div v-else>
      <div v-for="group in seriesByCategory" :key="group.category.id" class="category-group">
        <div v-if="group.series.length > 0">
          <div class="group-header">
            <h2 class="group-title">{{ group.category.label }}</h2>
          </div>
          <div class="series-list">
            <div v-for="series in group.series" :key="series.id" class="series-card">
              <RouterLink :to="`/tutorials/${series.id}`" class="series-link">
                <div class="series-info">
                  <h3>{{ series.title }}</h3>
                  <p>{{ series.description }}</p>
                  <div class="series-meta">{{ series.chapters.length }} 章节</div>
                </div>
                <div class="series-arrow">→</div>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tutorial-index {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 2.5rem 4rem;
}

.index-header {
  margin-bottom: 3rem;
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  padding: 2rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-glass);
  box-shadow: var(--shadow-md);
}

.index-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.category-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.tab:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.tab.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.category-group {
  margin-bottom: 2.5rem;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.group-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.series-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.series-card {
  background: var(--bg-card);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  transition: all 0.2s;
}

.series-card:hover {
  background: var(--bg-card-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.series-link {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem 1.5rem;
  text-decoration: none;
  color: inherit;
}

.series-info {
  flex: 1;
}

.series-info h2,
.series-info h3 {
  margin: 0 0 0.5rem;
  color: var(--text-primary);
  font-weight: 600;
}

.series-info h2 {
  font-size: 1.2rem;
}

.series-info h3 {
  font-size: 1.1rem;
}

.series-info p {
  margin: 0 0 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.series-meta {
  font-size: 0.85rem;
  color: var(--text-link);
  font-weight: 500;
}

.series-arrow {
  color: var(--text-muted);
  font-size: 1.25rem;
  transition: transform 0.2s;
}

.series-card:hover .series-arrow {
  transform: translateX(4px);
  color: var(--text-link);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
}
</style>
