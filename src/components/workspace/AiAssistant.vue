<script setup lang="ts">
/**
 * AI 助手浮窗组件
 * 提供对话界面，支持流式输出和快捷操作
 */
import { ref, computed, nextTick } from 'vue'
import { useAi } from '../../composables/useAi'
import { useSettingsStore } from '../../stores/settings'
import WsIcon from './WsIcon.vue'

const settingsStore = useSettingsStore()
const { messages, isLoading, isConfigured, chat, clearMessages } = useAi()

const userInput = ref('')
const messagesContainer = ref<HTMLElement>()

// 快捷操作按钮
const quickActions = [
  { label: '今日总结', prompt: '帮我生成今日总结' },
  { label: '智能建议', prompt: '基于我的数据给出建议' },
  { label: '周报', prompt: '生成本周周报' },
  { label: '月报', prompt: '生成本月月报' }
]

// 发送消息
async function handleSend() {
  if (!userInput.value.trim() || isLoading.value) return
  
  const message = userInput.value.trim()
  userInput.value = ''
  
  try {
    // 添加用户消息到列表
    messages.value.push({
      role: 'user',
      content: message,
      timestamp: Date.now()
    })
    
    // 添加空的助手消息占位
    const assistantMessage = {
      role: 'assistant' as const,
      content: '',
      timestamp: Date.now()
    }
    messages.value.push(assistantMessage)
    
    // 调用 AI，使用流式输出
    await chat(message, (chunk) => {
      // 更新最后一条助手消息
      const lastMessage = messages.value[messages.value.length - 1]
      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.content += chunk
        scrollToBottom()
      }
    })
  } catch (error) {
    console.error('AI 对话失败:', error)
    // 移除空的助手消息
    const lastMessage = messages.value[messages.value.length - 1]
    if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.content) {
      messages.value.pop()
    }
    // 添加错误消息
    messages.value.push({
      role: 'assistant',
      content: '抱歉，AI 服务暂时不可用，请稍后重试。',
      timestamp: Date.now()
    })
  }
  
  scrollToBottom()
}

// 使用快捷操作
function handleQuickAction(prompt: string) {
  userInput.value = prompt
  handleSend()
}

// 清空对话
function handleClear() {
  if (confirm('确定要清空对话记录吗？')) {
    clearMessages()
  }
}

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="ai-assistant">
    <div class="assistant-header">
      <div class="header-left">
        <span class="header-icon"><WsIcon name="ai" :size="22" /></span>
        <h3>AI 助手</h3>
      </div>
      <button @click="handleClear" class="clear-btn" title="清空对话">
        <WsIcon name="trash" :size="16" />
      </button>
    </div>

    <div v-if="!isConfigured" class="not-configured">
      <div class="config-icon"><WsIcon name="settings" :size="40" /></div>
      <p>AI 助手尚未配置</p>
      <p class="config-hint">请先在设置中配置 API Key</p>
    </div>

    <div v-else class="messages-container" ref="messagesContainer">
      <div v-if="messages.length === 0" class="welcome-message">
        <div class="welcome-icon"><WsIcon name="ai" :size="40" /></div>
        <p>你好！我是你的 AI 助手</p>
        <p class="welcome-hint">你可以问我关于工作台的问题，或者让我帮你生成总结和建议</p>
      </div>

      <div
        v-for="(message, index) in messages"
        :key="index"
        class="message"
        :class="message.role"
      >
        <div class="message-avatar">
          <WsIcon :name="message.role === 'user' ? 'user' : 'ai'" :size="18" />
        </div>
        <div class="message-content">
          <div class="message-text">{{ message.content }}</div>
          <div class="message-time">{{ formatTime(message.timestamp || Date.now()) }}</div>
        </div>
      </div>

      <div v-if="isLoading" class="message assistant loading">
        <div class="message-avatar"><WsIcon name="ai" :size="18" /></div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isConfigured" class="input-area">
      <div class="quick-actions">
        <button
          v-for="action in quickActions"
          :key="action.label"
          @click="handleQuickAction(action.prompt)"
          class="quick-action-btn"
          :disabled="isLoading"
        >
          {{ action.label }}
        </button>
      </div>
      <div class="input-container">
        <input
          v-model="userInput"
          type="text"
          placeholder="输入消息..."
          class="message-input"
          @keyup.enter="handleSend"
          :disabled="isLoading"
        />
        <button
          @click="handleSend"
          class="send-btn"
          :disabled="!userInput.trim() || isLoading"
        >
          <WsIcon name="send" :size="20" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-assistant {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.assistant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-icon {
  font-size: 1.5rem;
}

.header-left h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.clear-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.not-configured {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
}

.config-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.not-configured p {
  margin: 0.5rem 0;
}

.config-hint {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.welcome-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
}

.welcome-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.welcome-message p {
  margin: 0.5rem 0;
}

.welcome-hint {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.message {
  display: flex;
  gap: 0.75rem;
  animation: messageSlideIn 0.3s ease;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.message.user .message-content {
  align-items: flex-end;
}

.message-text {
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  line-height: 1.5;
  word-wrap: break-word;
}

.message.user .message-text {
  background: var(--accent);
  color: white;
  border-bottom-right-radius: var(--radius-md);
}

.message.assistant .message-text {
  background: var(--bg-card);
  color: var(--text-primary);
  border-bottom-left-radius: var(--radius-md);
}

.message-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.typing-indicator {
  display: flex;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border-bottom-left-radius: var(--radius-md);
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-10px);
  }
}

.input-area {
  border-top: 1px solid var(--border-color);
  background: var(--bg-card);
}

.quick-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  overflow-x: auto;
  scrollbar-width: thin;
}

.quick-action-btn {
  padding: 0.5rem 1rem;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.quick-action-btn:hover:not(:disabled) {
  background: var(--bg-card-hover);
  border-color: var(--accent);
}

.quick-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-container {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
}

.message-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.message-input:focus {
  outline: none;
  border-color: var(--accent);
}

.message-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn {
  padding: 0.75rem;
  background: var(--accent);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 滚动条样式 */
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
</style>
