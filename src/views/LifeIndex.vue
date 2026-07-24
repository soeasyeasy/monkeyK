<script setup lang="ts">
// 个人生活记录页 - 占位实现
</script>

<template>
  <div class="life-page">
    <div class="page-header">
      <h1>个人生活记录</h1>
      <p class="subtitle">记录生活点滴，分享成长故事</p>
    </div>

    <div class="empty-state">
      <h2>即将上线</h2>
      <p>个人生活记录功能正在开发中，敬请期待</p>
      <RouterLink to="/" class="back-btn">返回首页</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.life-page {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 4rem 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 4rem;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
}

.empty-state {
  max-width: 500px;
  margin: 0 auto;
  text-align: center;
  padding: 3rem 2rem;
  background: var(--bg-card);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.empty-state h2 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.back-btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: var(--accent);
  color: white;
  border-radius: var(--radius-md);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
}
</style>
