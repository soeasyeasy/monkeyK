<script setup lang="ts">
/**
 * 教程系列索引页
 * 显示某个教程系列的所有章节，按分组展示
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getSeriesById, getSeriesSections } from '../data/tutorial-series'
import { unlocked } from '../utils/unlock'

const route = useRoute()
// 从路由参数获取系列 ID
const seriesId = computed(() => route.params.seriesId as string)
const series = computed(() => getSeriesById(seriesId.value))
// 获取章节分组
const sections = computed(() => {
  if (!series.value) return []
  return getSeriesSections(series.value)
})

function isChapterAccessible(chapter: { number: string }): boolean {
  // 前6节免费，第7节起需要解锁
  const chapterNum = parseInt(chapter.number, 10)
  if (chapterNum <= 6) return true
  return unlocked.value
}
</script>

<template>
  <div class="series-index" v-if="series">
    <div class="series-header">
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
          v-for="chapter in series.chapters.filter((c) => c.section === section)"
          :key="chapter.number"
          :to="`/tutorials/${series.id}/${chapter.slug}`"
          class="chapter-link"
          :class="{ locked: !isChapterAccessible(chapter) }"
        >
          <div class="chapter-num">{{ chapter.number }}</div>
          <div class="chapter-info">
            <h3>{{ chapter.title }}</h3>
            <p>{{ chapter.description }}</p>
          </div>
          <div v-if="!isChapterAccessible(chapter)" class="lock-badge"></div>
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

.chapter-link.locked {
  opacity: 0.6;
}

.chapter-link.locked:hover {
  opacity: 0.8;
}

.lock-badge {
  width: 16px;
  height: 16px;
  margin-right: 0.5rem;
  background: var(--text-muted);
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Crect x='3' y='11' width='18' height='11' rx='2' ry='2'/%3E%3Cpath d='M7 11V7a5 5 0 0 1 10 0v4'/%3E%3C/svg%3E") center/contain no-repeat;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Crect x='3' y='11' width='18' height='11' rx='2' ry='2'/%3E%3Cpath d='M7 11V7a5 5 0 0 1 10 0v4'/%3E%3C/svg%3E") center/contain no-repeat;
  opacity: 0.5;
  flex-shrink: 0;
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
