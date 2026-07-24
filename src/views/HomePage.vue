<script setup lang="ts">
import { tutorialCategories, tutorialSeries } from '../data/tutorial-series'

const otherModules = [
  {
    title: '个人生活记录',
    description: '记录生活点滴，分享成长故事',
    path: '/life',
    color: '#FF9800',
  },
  {
    title: '待办事项',
    description: '管理日常任务，提高效率',
    path: '/todo',
    color: '#4CAF50',
  },
]

const recentSeries = tutorialSeries.slice(0, 3)
</script>

<template>
  <div class="home-page">
    <!-- Hero 区域 -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">全栈学习<br />知识中心</h1>
        <p class="hero-subtitle">
          前端、后端、操作系统、网络、运维全栈教程<br />
          配合个人生活记录与待办管理，构建你的专属学习空间。
        </p>
        <div class="hero-actions">
          <RouterLink to="/tutorials" class="btn-primary">
            浏览教程
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M6 12L10 8L6 4"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </RouterLink>
          <RouterLink to="/todo" class="btn-secondary"> 待办管理 </RouterLink>
        </div>
      </div>
      <div class="hero-decoration">
        <div class="decoration-blob blob-1"></div>
        <div class="decoration-blob blob-2"></div>
        <div class="decoration-blob blob-3"></div>
      </div>
    </section>

    <!-- 全栈教程入口 -->
    <section class="section tutorials-section">
      <div class="section-header">
        <h2 class="section-title">全栈教程</h2>
        <p class="section-subtitle">覆盖前端、后端、系统、网络、运维五大领域</p>
      </div>
      <div class="categories-grid">
        <RouterLink
          v-for="category in tutorialCategories"
          :key="category.id"
          :to="`/tutorials?category=${category.id}`"
          class="category-card"
        >
          <h3 class="category-title">{{ category.label }}</h3>
          <p class="category-desc">{{ category.description }}</p>
          <div class="category-count">
            {{ tutorialSeries.filter((s) => s.category === category.id).length }} 个系列
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- 最近更新 -->
    <section class="section recent-section">
      <div class="section-header">
        <h2 class="section-title">推荐教程</h2>
        <p class="section-subtitle">精选优质教程，持续更新中</p>
      </div>
      <div class="recent-grid">
        <RouterLink
          v-for="series in recentSeries"
          :key="series.id"
          :to="`/tutorials/${series.id}`"
          class="recent-card"
        >
          <div class="recent-content">
            <h3 class="recent-title">{{ series.title }}</h3>
            <p class="recent-desc">{{ series.description }}</p>
            <div class="recent-meta">{{ series.chapters.length }} 章节</div>
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- 其他功能 -->
    <section class="section other-section">
      <div class="section-header">
        <h2 class="section-title">更多功能</h2>
        <p class="section-subtitle">不止教程，还有生活与效率工具</p>
      </div>
      <div class="other-grid">
        <RouterLink
          v-for="module in otherModules"
          :key="module.path"
          :to="module.path"
          class="other-card"
        >
          <div class="other-content">
            <h3 class="other-title">{{ module.title }}</h3>
            <p class="other-desc">{{ module.description }}</p>
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <p class="footer-text">基于 Vue 3 + TypeScript 构建 · 个人全栈学习中心</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: var(--bg-primary);
  overflow-x: hidden;
}

/* Hero */
.hero {
  position: relative;
  padding: 8rem 2rem 6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  overflow: hidden;
}

.hero-content {
  max-width: 800px;
  text-align: center;
  position: relative;
  z-index: 2;
}

.hero-title {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: clamp(1rem, 2vw, 1.25rem);
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: 2.5rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: var(--accent);
  color: white;
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: var(--shadow-md);
}

.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 0.875rem 2rem;
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--bg-glass-hover);
  border-color: var(--border-hover);
  transform: translateY(-2px);
}

.hero-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.decoration-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: float 20s infinite ease-in-out;
}

.blob-1 {
  width: 500px;
  height: 500px;
  background: var(--accent);
  top: -150px;
  right: -100px;
  opacity: 0.15;
}

.blob-2 {
  width: 400px;
  height: 400px;
  background: var(--accent);
  bottom: -100px;
  left: -100px;
  opacity: 0.1;
  animation-delay: -7s;
}

.blob-3 {
  width: 300px;
  height: 300px;
  background: var(--accent);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
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

/* Sections */
.section {
  padding: 5rem 2rem;
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-title {
  font-size: clamp(1.75rem, 3.5vw, 2.25rem);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  letter-spacing: -0.02em;
}

.section-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
}

.tutorials-section {
  background: var(--bg-secondary);
}

.categories-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 1.5rem;
  background: var(--bg-card);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  text-decoration: none;
  transition: all 0.3s;
}

.category-card:hover {
  background: var(--bg-card-hover);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.category-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.category-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.category-count {
  font-size: 0.85rem;
  color: var(--text-link);
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  background: var(--bg-stat);
  border-radius: 12px;
}

/* Recent */
.recent-grid {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  gap: 1.5rem;
}

.recent-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--bg-card);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  text-decoration: none;
  transition: all 0.3s;
}

.recent-card:hover {
  background: var(--bg-card-hover);
  transform: translateX(8px);
  box-shadow: var(--shadow-lg);
}

.recent-content {
  flex: 1;
}

.recent-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.recent-desc {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.recent-meta {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* Other modules */
.other-section {
  background: var(--bg-secondary);
}

.other-grid {
  max-width: 900px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.other-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  background: var(--bg-card);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  text-decoration: none;
  transition: all 0.3s;
}

.other-card:hover {
  background: var(--bg-card-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.other-content {
  flex: 1;
}

.other-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.other-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* Footer */
.footer {
  padding: 3rem 2rem;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.footer-text {
  color: var(--text-muted);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .hero {
    padding: 6rem 1.5rem 4rem;
    min-height: 70vh;
  }

  .hero-subtitle br {
    display: none;
  }

  .section {
    padding: 4rem 1.5rem;
  }

  .categories-grid {
    grid-template-columns: 1fr 1fr;
  }

  .recent-card,
  .other-card {
    padding: 1.25rem;
  }
}
</style>
