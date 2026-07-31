<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import { aiProviders } from '../data/workspace-defaults'
import type { AiProvider } from '../types/workspace'
import * as storage from '../utils/storage'
import WsIcon from '../components/workspace/WsIcon.vue'

const router = useRouter()
const settingsStore = useSettingsStore()

// 表单数据
const selectedProvider = ref<AiProvider>('openai')
const apiUrl = ref('')
const apiKey = ref('')
const model = ref('')
const customModel = ref('')
const nickname = ref('')
const testStatus = ref<'idle' | 'testing' | 'success' | 'error'>('idle')
const testMessage = ref('')

// 当前选中的厂家配置
const currentProvider = computed(() => aiProviders.find(p => p.id === selectedProvider.value))
const isCustom = computed(() => selectedProvider.value === 'custom')

// 加载设置
onMounted(() => {
  selectedProvider.value = settingsStore.aiConfig.provider || 'openai'
  apiUrl.value = settingsStore.aiConfig.apiUrl
  apiKey.value = settingsStore.aiConfig.apiKey
  model.value = settingsStore.aiConfig.model
  nickname.value = settingsStore.settings.nickname

  // 如果是自定义厂家，且模型不在预设列表中，使用 customModel
  if (isCustom.value) {
    customModel.value = model.value
  }
})

// 切换厂家
function handleProviderChange(providerId: AiProvider) {
  selectedProvider.value = providerId
  const provider = aiProviders.find(p => p.id === providerId)
  if (provider && providerId !== 'custom') {
    apiUrl.value = provider.defaultApiUrl
    model.value = provider.models[0]?.value || ''
  } else if (providerId === 'custom') {
    apiUrl.value = ''
    model.value = ''
    customModel.value = ''
  }
}

// 保存 AI 配置
const saveAiConfig = () => {
  const finalModel = isCustom.value ? customModel.value : model.value
  settingsStore.updateAiConfig({
    provider: selectedProvider.value,
    apiUrl: apiUrl.value,
    apiKey: apiKey.value,
    model: finalModel
  })
  testStatus.value = 'success'
  testMessage.value = 'AI 配置已保存'
  setTimeout(() => { testStatus.value = 'idle' }, 2000)
}

// 测试 AI 连接
const testConnection = async () => {
  const finalModel = isCustom.value ? customModel.value : model.value
  if (!apiUrl.value || !apiKey.value) {
    testStatus.value = 'error'
    testMessage.value = '请先填写 API URL 和 API Key'
    return
  }

  testStatus.value = 'testing'
  testMessage.value = '正在测试连接...'

  try {
    const baseUrl = apiUrl.value.replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.value}`
      },
      body: JSON.stringify({
        model: finalModel || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      })
    })

    if (response.ok) {
      testStatus.value = 'success'
      testMessage.value = '连接测试成功！'
    } else {
      const error = await response.text()
      testStatus.value = 'error'
      testMessage.value = `连接失败：${response.status} ${error.slice(0, 100)}`
    }
  } catch (error) {
    testStatus.value = 'error'
    testMessage.value = `连接失败：${error instanceof Error ? error.message : '未知错误'}`
  }
}

// 保存用户设置
const saveUserSettings = () => {
  settingsStore.updateNickname(nickname.value)
  testStatus.value = 'success'
  testMessage.value = '用户设置已保存'
  setTimeout(() => { testStatus.value = 'idle' }, 2000)
}

// 导出数据
const exportData = () => {
  const data = storage.exportAllData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `workspace-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 导入数据
const importFileInput = ref<HTMLInputElement>()
const importData = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      storage.importAllData(data)
      alert('数据导入成功！页面将重新加载。')
      window.location.reload()
    } catch (error) {
      alert('导入失败：文件格式错误')
    }
  }
  reader.readAsText(file)
}

// 清除所有数据
const clearAllData = () => {
  if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
    if (confirm('再次确认：这将删除所有待办、习惯、记账、目标数据，确定继续？')) {
      storage.clearAllData()
      alert('所有数据已清除，页面将重新加载。')
      window.location.reload()
    }
  }
}

const goBack = () => {
  router.push('/workspace')
}
</script>

<template>
  <div class="settings-page">
    <div class="settings-header">
      <button @click="goBack" class="back-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        返回工作台
      </button>
      <h1>设置</h1>
    </div>

    <div class="settings-content">
      <!-- AI 配置 -->
      <div class="settings-section ai-section">
        <h2>
          <span class="section-icon"><WsIcon name="ai" :size="20" /></span>
          AI 配置
        </h2>
        <p class="section-desc">选择 AI 厂家并配置 API 密钥，支持多家主流大模型服务</p>

        <!-- 厂家选择卡片 -->
        <div class="provider-grid">
          <button
            v-for="provider in aiProviders"
            :key="provider.id"
            class="provider-card"
            :class="{ active: selectedProvider === provider.id }"
            :style="selectedProvider === provider.id ? { borderColor: provider.color, '--provider-color': provider.color } : { '--provider-color': provider.color }"
            @click="handleProviderChange(provider.id)"
          >
            <span class="provider-icon" :style="{ background: provider.color + '15', color: provider.color }">{{ provider.icon }}</span>
            <span class="provider-name">{{ provider.name }}</span>
            <span v-if="selectedProvider === provider.id" class="provider-check"><WsIcon name="check" :size="12" /></span>
          </button>
        </div>

        <!-- API 配置 -->
        <div class="api-config">
          <div class="form-group">
            <label>API URL</label>
            <input
              v-model="apiUrl"
              type="text"
              :placeholder="currentProvider?.defaultApiUrl || 'https://api.example.com/v1'"
              class="form-input"
              :disabled="!isCustom && !!currentProvider?.defaultApiUrl"
            />
            <p class="form-hint" v-if="!isCustom && currentProvider?.defaultApiUrl">
              已自动填充为 {{ currentProvider.name }} 的官方 API 地址
            </p>
            <p class="form-hint" v-else>
              输入兼容 OpenAI 格式的 API 端点
            </p>
          </div>

          <div class="form-group">
            <label>API Key</label>
            <input
              v-model="apiKey"
              type="password"
              placeholder="sk-..."
              class="form-input"
            />
            <p class="form-hint">你的 API 密钥将安全存储在浏览器本地</p>
          </div>

          <div class="form-group">
            <label>模型</label>
            <select v-if="!isCustom && currentProvider?.models?.length" v-model="model" class="form-input">
              <option v-for="m in currentProvider.models" :key="m.value" :value="m.value">
                {{ m.label }}
              </option>
            </select>
            <input
              v-else
              v-model="customModel"
              type="text"
              placeholder="输入模型名称，如 gpt-4o"
              class="form-input"
            />
            <p class="form-hint">{{ isCustom ? '手动输入模型名称' : '选择要使用的 AI 模型' }}</p>
          </div>

          <!-- 测试状态提示 -->
          <Transition name="fade">
            <div v-if="testStatus !== 'idle'" class="test-status" :class="testStatus">
              <span v-if="testStatus === 'testing'" class="spinner"></span>
              <span v-else-if="testStatus === 'success'" class="status-icon"><WsIcon name="check" :size="14" /></span>
              <span v-else class="status-icon"><WsIcon name="x" :size="14" /></span>
              {{ testMessage }}
            </div>
          </Transition>

          <div class="button-group">
            <button @click="saveAiConfig" class="btn btn-primary">保存配置</button>
            <button @click="testConnection" class="btn btn-secondary" :disabled="testStatus === 'testing'">
              {{ testStatus === 'testing' ? '测试中...' : '测试连接' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 用户设置 -->
      <div class="settings-section">
        <h2>
          <span class="section-icon"><WsIcon name="user" :size="20" /></span>
          用户设置
        </h2>
        <div class="form-group">
          <label>昵称</label>
          <input
            v-model="nickname"
            type="text"
            placeholder="输入你的昵称"
            class="form-input"
          />
          <p class="form-hint">AI 助手会用这个名称称呼你</p>
        </div>

        <div class="button-group">
          <button @click="saveUserSettings" class="btn btn-primary">保存设置</button>
        </div>
      </div>

      <!-- 数据管理 -->
      <div class="settings-section">
        <h2>
          <span class="section-icon"><WsIcon name="save" :size="20" /></span>
          数据管理
        </h2>
        <p class="section-description">
          所有数据都存储在浏览器本地，建议定期备份重要数据。
        </p>

        <div class="button-group">
          <button @click="exportData" class="btn btn-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            导出数据
          </button>

          <button @click="importFileInput?.click()" class="btn btn-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            导入数据
          </button>

          <button @click="clearAllData" class="btn btn-danger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            清除所有数据
          </button>
        </div>

        <input
          ref="importFileInput"
          type="file"
          accept=".json"
          @change="importData"
          style="display: none"
        />
      </div>

      <!-- 关于 -->
      <div class="settings-section">
        <h2>
          <span class="section-icon">ℹ️</span>
          关于
        </h2>
        <div class="about-info">
          <p><strong>AI 个人工作台</strong> v1.0</p>
          <p>一个集成待办、习惯、记账、目标管理的智能工作台</p>
          <p class="muted">所有数据仅存储在您的浏览器本地，不会上传到任何服务器</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 2rem;
}

.settings-header {
  max-width: 800px;
  margin: 0 auto 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
}

.settings-header h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--text-primary);
}

.settings-content {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-section {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 2rem;
  backdrop-filter: blur(10px);
}

.settings-section h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-icon {
  font-size: 1.25rem;
}

.section-desc {
  margin: 0 0 1.5rem 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.section-description {
  margin: 0 0 1.5rem 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* 厂家选择网格 */
.provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.provider-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.75rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.provider-card:hover {
  border-color: var(--provider-color, var(--accent));
  background: var(--bg-hover);
  transform: translateY(-2px);
}

.provider-card.active {
  border-color: var(--provider-color, var(--accent));
  background: color-mix(in srgb, var(--provider-color, var(--accent)) 10%, var(--bg-secondary));
}

.provider-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
}

.provider-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}

.provider-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--provider-color, var(--accent));
  color: white;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

/* API 配置区 */
.api-config {
  padding-top: 0.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent);
  background: var(--bg-hover);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-hint {
  margin: 0.5rem 0 0 0;
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* 测试状态 */
.test-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.test-status.testing {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.test-status.success {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.test-status.error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.status-icon {
  font-weight: bold;
}

.button-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--accent);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--accent);
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
  transform: translateY(-1px);
}

.btn-info {
  background: #3b82f6;
  color: white;
}

.btn-info:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.about-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.about-info p {
  margin: 0;
  color: var(--text-primary);
}

.about-info .muted {
  color: var(--text-muted);
  font-size: 0.875rem;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .settings-page {
    padding: 1rem;
  }

  .settings-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .settings-section {
    padding: 1.5rem;
  }

  .provider-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .button-group {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
