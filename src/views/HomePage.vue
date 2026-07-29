<script setup lang="ts">
/**
 * 首页组件
 * 展示 Hero 区域、教程分类 3D 轮播、推荐教程和其他功能模块
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { tutorialCategories, tutorialSeries } from '../data/tutorial-series'
import { useHitokoto } from '../composables/useHitokoto'

// 使用一言 composable
const { hitokoto, loading: hitokotoLoading, progress: hitokotoProgress, refresh: refreshHitokoto } = useHitokoto()

// 分类图标 SVG
const categoryIcons: Record<string, string> = {
  frontend: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M7 8h4"/><path d="M7 12h3"/></svg>`,
  backend: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="18" r="1" fill="currentColor"/></svg>`,
  mobile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>`,
  database: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>`,
  'cs-fundamentals': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
  ai: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M12 12v4"/><path d="M8 20h8"/><path d="M6 8H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2"/><path d="M18 8h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"/></svg>`,
  'cloud-native': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`,
  devops: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>`,
  more: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`,
}

// 分类渐变色
const categoryGradients: Record<string, [string, string]> = {
  frontend: ['#667eea', '#764ba2'],
  backend: ['#f093fb', '#f5576c'],
  mobile: ['#4facfe', '#00f2fe'],
  database: ['#43e97b', '#38f9d7'],
  'cs-fundamentals': ['#fa709a', '#fee140'],
  ai: ['#a18cd1', '#fbc2eb'],
  'cloud-native': ['#fccb90', '#d57eeb'],
  devops: ['#96fbc4', '#f9f586'],
  more: ['#667eea', '#764ba2'],
}

// 3D 轮播 - 正面展示 3 张卡片
const carouselIndex = ref(0)
const carouselPaused = ref(false)
const totalCards = tutorialCategories.length

// 获取每个卡片相对于当前索引的偏移位置
const getCardPosition = (index: number) => {
  const offset = ((index - carouselIndex.value + totalCards) % totalCards + totalCards) % totalCards
  let pos = offset
  if (offset >= totalCards / 2) pos = offset - totalCards
  return pos
}

const getCardTransform = (index: number) => {
  const pos = getCardPosition(index) // -4, -3, -2, -1, 0, 1, 2, 3
  const isMobile = windowWidth.value <= 768
  const cardGap = isMobile ? 140 : 230
  const maxVisible = 1 // 中间 3 张高亮：-1, 0, 1

  const absPos = Math.abs(pos)
  const isHighlight = absPos <= maxVisible

  const x = pos * cardGap
  const z = isHighlight ? -absPos * 50 : -300
  const scale = isHighlight ? (1 - absPos * 0.1) : 0.65
  const opacity = isHighlight ? (1 - absPos * 0.12) : 0.35
  const rotateY = isHighlight ? pos * -5 : 0
  const blurAmount = isHighlight ? 0 : 1

  return {
    transform: `translateX(${x}px) translateZ(${z}px) rotateY(${rotateY}deg) scale(${scale})`,
    opacity: Math.max(opacity, 0.2),
    zIndex: isHighlight ? (100 - absPos) : 10,
    filter: blurAmount > 0 ? `blur(${blurAmount}px)` : 'none',
    pointerEvents: 'auto' as const,
  }
}

const rotateCarousel = (dir: number) => {
  carouselIndex.value = (carouselIndex.value + dir + totalCards) % totalCards
}

let autoPlayTimer: ReturnType<typeof setInterval>
const startAutoPlay = () => {
  autoPlayTimer = setInterval(() => {
    if (!carouselPaused.value) rotateCarousel(1)
  }, 3500)
}
const stopAutoPlay = () => clearInterval(autoPlayTimer)

const windowWidth = ref(window.innerWidth)
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  startAutoPlay()
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  stopAutoPlay()
  window.removeEventListener('resize', handleResize)
})

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  rotateCarousel(e.deltaY > 0 ? 1 : -1)
}

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

const recentSeries = tutorialSeries.filter(s => s.featured).slice(0, 6)
</script>

<template>
  <div class="home-page">
    <!-- Hero 区域 -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title hero-animate">全栈学习<br />知识中心</h1>
        <p class="hero-subtitle hero-animate delay-1">
          前端、后端、操作系统、网络、运维全栈教程<br />
          配合个人生活记录与待办管理，构建你的专属学习空间。
        </p>
        <div class="hero-actions hero-animate delay-2">
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
        <!-- 一言 -->
        <div class="hero-widgets hero-animate delay-3">
          <div class="hitokoto-widget" @click="refreshHitokoto" title="点击刷新一言">
            <div class="hitokoto-content">
              <span v-if="hitokotoLoading" class="widget-loading">加载一言中...</span>
              <template v-else-if="hitokoto">
                <span class="hitokoto-text">{{ hitokoto.hitokoto }}</span>
                <span v-if="hitokoto.from" class="hitokoto-from">—— {{ hitokoto.from }}</span>
              </template>
            </div>
            <div class="hitokoto-progress">
              <div class="progress-bar" :style="{ width: hitokotoProgress + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="hero-decoration">
        <div class="decoration-blob blob-1"></div>
        <div class="decoration-blob blob-2"></div>
        <div class="decoration-blob blob-3"></div>
      </div>
    </section>

    <!-- 全栈教程入口 - 3D 轮播 -->
    <section class="section tutorials-section">
      <div class="section-header">
        <h2 class="section-title">全栈教程</h2>
        <p class="section-subtitle">覆盖前端、后端、移动端、数据库、计算机基础、人工智能、云原生、运维等领域</p>
      </div>
      <div
        class="carousel-wrapper"
        @mouseenter="carouselPaused = true"
        @mouseleave="carouselPaused = false"
        @wheel.prevent="handleWheel"
      >
        <button class="carousel-btn carousel-btn-prev" @click="rotateCarousel(-1)" aria-label="上一个">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="carousel-viewport">
          <RouterLink
            v-for="(category, index) in tutorialCategories"
            :key="category.id"
            :to="category.id === 'more' ? '/tutorials' : `/tutorials?category=${category.id}`"
            class="category-card-3d"
            :class="{ 'is-front': index === carouselIndex }"
            :style="getCardTransform(index)"
          >
            <div
              class="card-icon-wrapper"
              :style="{ background: `linear-gradient(135deg, ${categoryGradients[category.id]?.[0] ?? '#667eea'}, ${categoryGradients[category.id]?.[1] ?? '#764ba2'})` }"
            >
              <span class="card-icon" v-html="categoryIcons[category.id]"></span>
            </div>
            <h3 class="category-title">{{ category.label }}</h3>
            <p class="category-desc">{{ category.description }}</p>
            <div v-if="category.id !== 'more'" class="category-count">
              <span class="count-number">{{ tutorialSeries.filter((s) => s.category === category.id).length }}</span>
              <span class="count-label">个系列</span>
            </div>
            <div v-else class="category-count category-count-placeholder">
              <span class="count-label">查看全部</span>
            </div>
          </RouterLink>
        </div>
        <button class="carousel-btn carousel-btn-next" @click="rotateCarousel(1)" aria-label="下一个">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div class="carousel-dots">
        <span
          v-for="(_, index) in tutorialCategories"
          :key="index"
          class="carousel-dot"
          :class="{ active: index === carouselIndex }"
          @click="carouselIndex = index"
        ></span>
      </div>
    </section>

    <!-- 推荐教程 -->
    <section class="section recent-section">
      <div class="section-header">
        <h2 class="section-title">推荐教程</h2>
        <p class="section-subtitle">精选优质教程，持续更新中</p>
      </div>
      <div class="recent-grid">
        <RouterLink
          v-for="(series, index) in recentSeries"
          :key="series.id"
          :to="`/tutorials/${series.id}`"
          class="recent-card"
          v-animate.slide-up
          :style="{ transitionDelay: `${index * 120}ms` }"
        >
          <div class="recent-content">
            <h3 class="recent-title">{{ series.title }}</h3>
            <p class="recent-desc">{{ series.description }}</p>
          </div>
          <div class="recent-card-footer">
            <div class="recent-chapters">
              <span class="chapter-count">{{ series.chapters.length }}</span>
              <span class="chapter-label">章节</span>
            </div>
            <div class="recent-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
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
          v-for="(module, index) in otherModules"
          :key="module.path"
          :to="module.path"
          class="other-card"
          v-animate.scale
          :style="{ transitionDelay: `${index * 100}ms` }"
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

/* Hero 入场动画 */
.hero-animate {
  opacity: 0;
  animation: heroFadeIn 0.8s ease-out forwards;
}

.hero-animate.delay-1 {
  animation-delay: 0.2s;
}

.hero-animate.delay-2 {
  animation-delay: 0.4s;
}

@keyframes heroFadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

/* Hero Widgets */
.hero-widgets {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  margin-top: 3rem;
}

.hitokoto-widget {
  position: relative;
  max-width: 600px;
  width: 100%;
  padding: 1.25rem 1.5rem;
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
}

.hitokoto-widget:hover {
  background: var(--bg-glass-hover);
  border-color: var(--border-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.hitokoto-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: center;
  position: relative;
  z-index: 1;
}

.hitokoto-text {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-primary);
  font-style: italic;
}

.hitokoto-from {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.hitokoto-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--border-color);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--accent);
  transition: width 0.05s linear;
}

.widget-loading,
.widget-error {
  color: var(--text-muted);
  font-size: 0.9rem;
  text-align: center;
}

.hero-animate.delay-3 {
  animation-delay: 0.6s;
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
  filter: blur(120px);
  animation: float 10s infinite ease-in-out;
  will-change: transform, opacity;
}

.blob-1 {
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
  top: -250px;
  right: -200px;
  opacity: 0.4;
  animation-name: float1;
}

.blob-2 {
  width: 700px;
  height: 700px;
  background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
  bottom: -200px;
  left: -200px;
  opacity: 0.35;
  animation-name: float2;
  animation-delay: -5s;
}

.blob-3 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
  top: 20%;
  left: 10%;
  opacity: 0.3;
  animation-name: float3;
  animation-delay: -10s;
}

@keyframes float1 {
  0%,
  100% {
    transform: translate(0, 0) scale(1) rotate(0deg);
    opacity: 0.4;
  }
  25% {
    transform: translate(60px, -60px) scale(1.3) rotate(90deg);
    opacity: 0.5;
  }
  50% {
    transform: translate(-40px, 50px) scale(0.8) rotate(180deg);
    opacity: 0.3;
  }
  75% {
    transform: translate(50px, 40px) scale(1.2) rotate(270deg);
    opacity: 0.45;
  }
}

@keyframes float2 {
  0%,
  100% {
    transform: translate(0, 0) scale(1) rotate(0deg);
    opacity: 0.35;
  }
  25% {
    transform: translate(-50px, -40px) scale(1.25) rotate(-90deg);
    opacity: 0.45;
  }
  50% {
    transform: translate(60px, -50px) scale(0.85) rotate(-180deg);
    opacity: 0.25;
  }
  75% {
    transform: translate(-40px, 60px) scale(1.15) rotate(-270deg);
    opacity: 0.4;
  }
}

@keyframes float3 {
  0%,
  100% {
    transform: translate(0, 0) scale(1) rotate(0deg);
    opacity: 0.3;
  }
  33% {
    transform: translate(80px, -50px) scale(1.4) rotate(120deg);
    opacity: 0.4;
  }
  66% {
    transform: translate(-60px, 40px) scale(0.75) rotate(240deg);
    opacity: 0.2;
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

/* 3D 轮播 */
.carousel-wrapper {
  position: relative;
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.carousel-btn {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 50%;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.25s ease;
  z-index: 20;
  box-shadow: var(--shadow-sm);
}

.carousel-btn:hover {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
  transform: scale(1.1);
  box-shadow: var(--shadow-md);
}

.carousel-viewport {
  flex: 1;
  height: 300px;
  perspective: 1000px;
  overflow: visible;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-card-3d {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 200px;
  margin-left: -110px;
  margin-top: -140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.75rem 1.25rem 1.5rem;
  background: var(--bg-card);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  text-decoration: none;
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              opacity 0.5s ease,
              filter 0.5s ease,
              box-shadow 0.3s ease,
              border-color 0.3s ease;
  cursor: pointer;
  will-change: transform, opacity;
}

.category-card-3d.is-front {
  border-color: var(--accent);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px var(--accent);
}

.category-card-3d:hover {
  box-shadow: var(--shadow-lg);
}

.card-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  width: 24px;
  height: 24px;
}

.card-icon svg {
  width: 24px;
  height: 24px;
}

.category-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.35rem;
  letter-spacing: -0.01em;
}

.category-desc {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.65rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.category-count {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  padding: 0.3rem 0.85rem;
  background: var(--bg-stat);
  border-radius: 20px;
}

.count-number {
  font-size: 1rem;
  font-weight: 700;
  color: var(--accent);
}

.count-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 2rem;
}

.carousel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-color);
  cursor: pointer;
  transition: all 0.3s ease;
}

.carousel-dot.active {
  background: var(--accent);
  width: 24px;
  border-radius: 4px;
}

.carousel-dot:hover {
  background: var(--accent);
}

/* Recent */
.recent-grid {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.recent-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--bg-card);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.recent-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent), var(--accent-light));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.recent-card:hover {
  background: var(--bg-card-hover);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--accent);
}

.recent-card:hover::before {
  opacity: 1;
}

.recent-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.recent-card-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.recent-card-icon svg {
  width: 22px;
  height: 22px;
}

.recent-card-tag {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--accent);
  background: var(--bg-stat);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
}

.recent-content {
  flex: 1;
}

.recent-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  letter-spacing: -0.01em;
}

.recent-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.recent-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}

.recent-chapters {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.chapter-count {
  font-size: 1rem;
  font-weight: 700;
  color: var(--accent);
}

.chapter-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.recent-arrow {
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.recent-card:hover .recent-arrow {
  color: var(--accent);
  transform: translateX(4px);
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

  .carousel-viewport {
    height: 280px;
  }

  .category-card-3d {
    width: 140px;
    margin-left: -70px;
    margin-top: -100px;
    padding: 1rem 0.5rem 0.75rem;
  }

  .card-icon-wrapper {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    margin-bottom: 0.6rem;
  }

  .card-icon svg {
    width: 20px;
    height: 20px;
  }

  .carousel-btn {
    width: 38px;
    height: 38px;
  }

  .recent-card,
  .other-card {
    padding: 1.25rem;
  }

  .recent-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .hitokoto-widget {
    padding: 1rem 1.25rem;
  }

  .hitokoto-text {
    font-size: 0.9rem;
  }
}
</style>
