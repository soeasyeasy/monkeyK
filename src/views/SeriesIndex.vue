<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getSeriesById, getSeriesSections } from '../data/tutorial-series'

const route = useRoute()
const seriesId = computed(() => route.params.seriesId as string)
const series = computed(() => getSeriesById(seriesId.value))
const sections = computed(() => {
  if (!series.value) return []
  return getSeriesSections(series.value)
})
</script>

<template>
  <div class="series-index" v-if="series">
    <div class="series-header">
      <div class="series-icon">{{ series.icon }}</div>
      <h1>{{ series.title }}</h1>
      <p class="subtitle">{{ series.description }}</p>
      <div class="stats">
        <span class="stat">{{ series.chapters.length }} 章节</span>
        <span class="stat">{{ sections.length }} 个分类</span>
      </div>
    </div>

    <div v-for="section in sections" :key="section" class="section-group">
      <div class="section-badge">{{ section }}</div>
      <div class="chapter-list">
        <RouterLink
          v-for="chapter in series.chapters.filter(c => c.section === section)"
          :key="chapter.number"
          :to="`/tutorials/${series.id}/${chapter.slug}`"
          class="chapter-link"
        >
          <div class="chapter-num">{{ chapter.number }}</div>
          <div class="chapter-info">
            <h3>{{ chapter.title }}</h3>
            <p>{{ chapter.description }}</p>
          </div>
          <div class="chapter-arrow">→</div>
        </RouterLink>
      </div>
    </div>
  </div>
  <div v-else class="not-found">
    <h2>教程系列不存在</h2>
    <RouterLink to="/tutorials" class="back-link">← 返回教程列表</RouterLink>
  </div>
</template>

<style scoped>
.series-index {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 2.5rem 4rem;
}

.series-header {
  margin-bottom: 3rem;
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  padding: 2rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-glass);
  box-shadow: var(--shadow-md);
  text-align: center;
}

.series-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.series-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.stats {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.stat {
  background: var(--bg-stat);
  color: var(--text-stat);
  padding: 0.35rem 0.9rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid var(--border-color);
}

.section-group {
  margin-bottom: 2rem;
}

.section-badge {
  display: inline-block;
  background: var(--accent);
  color: var(--bg-badge-text);
  padding: 0.3rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  box-shadow: var(--shadow-sm);
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.chapter-link {
  display: flex;
  align-items: center;
  padding: 0.85rem 1rem;
  border: 1px solid var(--border-color);
  border-bottom: none;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  background: var(--bg-card);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
}

.chapter-link:first-child {
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.chapter-link:last-child {
  border-bottom: 1px solid var(--border-color);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}

.chapter-link:hover {
  background: var(--bg-card-hover);
  transform: translateX(4px);
}

.chapter-num {
  background: var(--accent);
  color: var(--bg-badge-text);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.8rem;
  flex-shrink: 0;
  margin-right: 1rem;
  box-shadow: var(--shadow-sm);
}

.chapter-info {
  flex: 1;
}

.chapter-info h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.chapter-info p {
  margin: 0.15rem 0 0;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.chapter-arrow {
  color: var(--text-muted);
  transition: transform 0.2s;
}

.chapter-link:hover .chapter-arrow {
  transform: translateX(4px);
  color: var(--text-link);
}

.not-found {
  text-align: center;
  padding: 4rem 2rem;
}

.back-link {
  display: inline-block;
  margin-top: 1rem;
  color: var(--text-link);
  text-decoration: none;
}
</style>
