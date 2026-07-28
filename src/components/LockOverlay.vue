<script setup lang="ts">
const emit = defineEmits<{
  unlock: []
}>()
</script>

<template>
  <div class="lock-overlay">
    <div class="lock-content">
      <div class="lock-icon"></div>
      <h2 class="lock-title">此章节需要解锁</h2>
      <p class="lock-description">
        关注微信公众号 <strong>monkeyk.cn</strong><br />
        获取解锁验证码，即可永久访问所有内容
      </p>
      <button class="unlock-button" @click="emit('unlock')">
        立即解锁
      </button>
      <p class="lock-footer">关注后可永久查看所有解锁内容</p>
    </div>
  </div>
</template>

<style scoped>
.lock-overlay {
  position: fixed;
  top: 60px;
  left: 260px;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.lock-content {
  background: var(--bg-card);
  padding: 3rem 2.5rem;
  border-radius: var(--radius-lg);
  text-align: center;
  max-width: 420px;
  width: 90%;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.lock-icon {
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
}

.lock-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.lock-description {
  color: var(--text-secondary);
  margin-bottom: 2rem;
  line-height: 1.6;
  font-size: 0.95rem;
}

.lock-description strong {
  color: var(--text-primary);
}

.unlock-button {
  background: var(--accent);
  color: white;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.unlock-button:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.lock-footer {
  margin-top: 1.5rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

@media (max-width: 959px) {
  .lock-overlay {
    left: 0;
  }
}
</style>
