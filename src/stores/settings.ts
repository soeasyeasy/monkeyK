/**
 * Pinia 状态管理 - 设置 Store
 * 管理 AI 配置和用户偏好设置
 * 配置通过 localStorage 持久化
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { AiConfig, UserSettings } from '../types/workspace'
import { defaultAiConfig, defaultUserSettings } from '../data/workspace-defaults'

// localStorage 存储键名
const SETTINGS_KEY = 'workspace-settings'

// 从 localStorage 加载设置
function loadSettings(): UserSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // 兼容旧版配置：若无 provider 字段，默认 openai
      if (parsed.aiConfig && !parsed.aiConfig.provider) {
        parsed.aiConfig.provider = 'openai'
      }
      return parsed
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
  return { ...defaultUserSettings }
}

// 保存设置到 localStorage
function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

// 定义设置 Store，使用组合式 API 风格
export const useSettingsStore = defineStore('settings', () => {
  // 响应式状态：用户设置
  const settings = ref<UserSettings>(loadSettings())

  // 计算属性：AI 配置
  const aiConfig = computed(() => settings.value.aiConfig)

  // 计算属性：用户昵称
  const nickname = computed(() => settings.value.nickname)

  // 计算属性：AI 是否已配置
  const isAiConfigured = computed(() => {
    return !!(
      settings.value.aiConfig.apiKey &&
      settings.value.aiConfig.apiUrl &&
      settings.value.aiConfig.model
    )
  })

  // 动作：更新 AI 配置
  function updateAiConfig(config: Partial<AiConfig>) {
    settings.value.aiConfig = {
      ...settings.value.aiConfig,
      ...config,
    }
    saveSettings(settings.value)
  }

  // 动作：更新用户昵称
  function updateNickname(name: string) {
    settings.value.nickname = name
    saveSettings(settings.value)
  }

  // 动作：重置所有设置
  function resetSettings() {
    settings.value = { ...defaultUserSettings }
    saveSettings(settings.value)
  }

  // 动作：导出设置
  function exportSettings(): string {
    return JSON.stringify(settings.value, null, 2)
  }

  // 动作：导入设置
  function importSettings(json: string) {
    try {
      const imported = JSON.parse(json)
      settings.value = {
        ...defaultUserSettings,
        ...imported,
        aiConfig: {
          ...defaultAiConfig,
          ...imported.aiConfig,
        },
      }
      saveSettings(settings.value)
      return true
    } catch (e) {
      console.error('Failed to import settings:', e)
      return false
    }
  }

  // 返回暴露的状态和方法
  return {
    settings,
    aiConfig,
    nickname,
    isAiConfigured,
    updateAiConfig,
    updateNickname,
    resetSettings,
    exportSettings,
    importSettings,
  }
})
