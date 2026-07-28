<script setup lang="ts">
import { ref } from 'vue'
import { verifyPassword } from '../utils/password'

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const password = ref('')
const showPassword = ref(false)
const error = ref('')
const shaking = ref(false)

function handleConfirm() {
  error.value = ''

  if (!password.value.trim()) {
    error.value = '请输入验证码'
    triggerShake()
    return
  }

  if (verifyPassword(password.value)) {
    emit('confirm')
  } else {
    error.value = '验证码错误，请重新输入'
    triggerShake()
  }
}

function triggerShake() {
  shaking.value = true
  setTimeout(() => {
    shaking.value = false
  }, 500)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    handleConfirm()
  }
}

function handleOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    emit('cancel')
  }
}
</script>

<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" :class="{ shake: shaking }">
      <div class="modal-header">
        <h2 class="modal-title">关注公众号解锁</h2>
        <p class="modal-subtitle">扫描下方二维码关注公众号，输入验证码即可解锁</p>
      </div>

      <div class="qrcode-container">
        <img src="/wechat-qrcode.png" alt="微信公众号二维码" class="qrcode-image" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'qrcode-placeholder\\'>请放置二维码图片到<br/>public/wechat-qrcode.png</div>'" />
      </div>

      <div class="account-info">
        <div class="account-name">monkeyk.cn</div>
        <div class="account-description">微信搜一搜 monkeyk.cn</div>
      </div>

      <div class="password-section">
        <div class="password-input-wrapper" :class="{ 'has-error': error }">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            class="password-input"
            placeholder="请输入验证码"
            @keydown="handleKeydown"
          />
          <button
            class="toggle-password"
            type="button"
            @click="showPassword = !showPassword"
            tabindex="-1"
          >
            {{ showPassword ? '隐藏' : '显示' }}
          </button>
        </div>
        <p v-if="error" class="password-error">{{ error }}</p>
      </div>

      <div class="modal-actions">
        <button class="modal-button cancel" @click="emit('cancel')">
          取消
        </button>
        <button class="modal-button confirm" @click="handleConfirm">
          确认解锁
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: var(--bg-card);
  padding: 2.5rem;
  border-radius: var(--radius-lg);
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

.modal-content.shake {
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
  20%, 40%, 60%, 80% { transform: translateX(6px); }
}

.modal-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.modal-title {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
  color: var(--text-primary);
}

.modal-subtitle {
  color: var(--text-secondary);
  font-size: 0.88rem;
}

.qrcode-container {
  background: white;
  padding: 1.25rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.25rem;
  text-align: center;
}

.qrcode-image {
  width: 300px;
  /* height: 200px; */
  object-fit: contain;
}

.account-info {
  text-align: center;
  margin-bottom: 1.5rem;
}

.account-name {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.2rem;
}

.account-description {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.password-section {
  margin-bottom: 1.5rem;
}

.password-input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-glass);
  transition: border-color 0.2s;
  overflow: hidden;
}

.password-input-wrapper:focus-within {
  border-color: var(--accent);
}

.password-input-wrapper.has-error {
  border-color: #ef4444;
}

.password-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  color: var(--text-primary);
  outline: none;
}

.password-input::placeholder {
  color: var(--text-muted);
}

.toggle-password {
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.82rem;
  cursor: pointer;
  transition: color 0.2s;
  white-space: nowrap;
}

.toggle-password:hover {
  color: var(--text-secondary);
}

.password-error {
  margin: 0.5rem 0 0;
  font-size: 0.82rem;
  color: #ef4444;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
}

.modal-button {
  flex: 1;
  padding: 0.8rem;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.modal-button.cancel {
  background: var(--bg-glass);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.modal-button.cancel:hover {
  background: var(--bg-glass-hover);
}

.modal-button.confirm {
  background: #07c160;
  color: white;
}

.modal-button.confirm:hover {
  background: #06ad56;
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

@media (max-width: 480px) {
  .modal-content {
    padding: 1.75rem 1.25rem;
  }

  .qrcode-image {
    width: 180px;
    height: 180px;
  }
}
</style>
