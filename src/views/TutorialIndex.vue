<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { tutorialCategories, tutorialSubcategories, tutorialSeries, getSeriesByCategory, getSeriesBySubcategory } from '../data/tutorial-series'

const route = useRoute()
const activeCategory = computed(() => (route.query.category as string) || '')
const activeSubcategory = computed(() => (route.query.subcategory as string) || '')

const filteredSeries = computed(() => {
  if (activeSubcategory.value) {
    return getSeriesBySubcategory(activeSubcategory.value as any)
  }
  if (activeCategory.value) {
    return getSeriesByCategory(activeCategory.value as any)
  }
  return tutorialSeries
})

const currentSubcategories = computed(() => {
  if (!activeCategory.value) return []
  return tutorialSubcategories.filter(sub => sub.parent === activeCategory.value)
})

const seriesByCategory = computed(() => {
  const cats = activeCategory.value
    ? tutorialCategories.filter(c => c.id === activeCategory.value)
    : tutorialCategories
  return cats.map((cat) => {
    const series = getSeriesByCategory(cat.id)
    const subcategories = tutorialSubcategories.filter(sub => sub.parent === cat.id)
    const grouped = subcategories.map(sub => ({
      subcategory: sub,
      series: series.filter(s => s.subcategory === sub.id),
    })).filter(g => g.series.length > 0)
    const ungrouped = series.filter(s => !subcategories.find(sub => sub.id === s.subcategory))
    return {
      category: cat,
      grouped,
      ungrouped,
    }
  }).filter(g => g.grouped.length > 0 || g.ungrouped.length > 0)
})
</script>

<template>
  <div class="tutorial-index">
    <div class="index-header" v-animate.slide-up>
      <h1>教程中心</h1>
      <p class="subtitle">全栈技术教程，持续更新中</p>
      <div class="category-tabs">
        <RouterLink to="/tutorials" class="tab" :class="{ active: !activeCategory }">
          全部
        </RouterLink>
        <RouterLink
          v-for="cat in tutorialCategories.filter(c => c.id !== 'more')"
          :key="cat.id"
          :to="`/tutorials?category=${cat.id}`"
          class="tab"
          :class="{ active: activeCategory === cat.id && !activeSubcategory }"
        >
          {{ cat.label }}
        </RouterLink>
      </div>
      <div v-if="currentSubcategories.length > 0" class="subcategory-tabs">
        <RouterLink
          :to="`/tutorials?category=${activeCategory}`"
          class="sub-tab"
          :class="{ active: !activeSubcategory }"
        >
          全部
        </RouterLink>
        <RouterLink
          v-for="sub in currentSubcategories"
          :key="sub.id"
          :to="`/tutorials?category=${activeCategory}&subcategory=${sub.id}`"
          class="sub-tab"
          :class="{ active: activeSubcategory === sub.id }"
        >
          {{ sub.label }}
        </RouterLink>
      </div>
    </div>

    <div v-if="activeSubcategory" class="series-list">
      <div
        v-for="(series, index) in filteredSeries"
        :key="series.id"
        class="series-card"
        v-animate.slide-right
        :style="{ transitionDelay: `${index * 80}ms` }"
      >
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
        <div class="group-header" v-animate.slide-up>
          <h2 class="group-title">{{ group.category.label }}</h2>
        </div>
        <div v-for="subGroup in group.grouped" :key="subGroup.subcategory.id" class="subcategory-group">
          <h3 class="subcategory-title">{{ subGroup.subcategory.label }}</h3>
          <div class="series-list">
            <div
              v-for="(series, index) in subGroup.series"
              :key="series.id"
              class="series-card"
              v-animate.slide-right
              :style="{ transitionDelay: `${index * 80}ms` }"
            >
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
        <div v-if="group.ungrouped.length > 0" class="subcategory-group">
          <div class="series-list">
            <div
              v-for="(series, index) in group.ungrouped"
              :key="series.id"
              class="series-card"
              v-animate.slide-right
              :style="{ transitionDelay: `${index * 80}ms` }"
            >
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 2.5rem 4rem;
}

.index-header {
  margin-bottom: 2rem;
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  padding: 1.5rem;
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
  margin-bottom: 1rem;
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

.subcategory-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}

.sub-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.9rem;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.sub-tab:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.sub-tab.active {
  background: var(--accent-light, var(--accent));
  color: var(--accent);
  border-color: var(--accent);
  font-weight: 500;
}

.category-group {
  margin-bottom: 1.75rem;
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

.subcategory-group {
  margin-bottom: 1.5rem;
}

.subcategory-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
  padding-left: 0.25rem;
  border-left: 3px solid var(--accent);
  padding-left: 0.75rem;
}

.series-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
  align-items: stretch;
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
  gap: 1rem;
  padding: 1rem 1.25rem;
  text-decoration: none;
  color: inherit;
  height: 100%;
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
  line-height: 1.5;
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
