/**
 * 教程解锁状态管理
 * 控制教程内容的访问权限，使用 localStorage 持久化解锁状态
 */
import { ref } from 'vue'

// localStorage 存储键名
const UNLOCK_KEY = 'tutorial_unlocked'

// 全局响应式解锁状态，从 localStorage 读取初始值
export const unlocked = ref(localStorage.getItem(UNLOCK_KEY) === 'true')

// 判断当前是否已解锁
export function isUnlocked(): boolean {
  return unlocked.value
}

// 设置解锁状态，同时写入 localStorage
export function setUnlocked(): void {
  localStorage.setItem(UNLOCK_KEY, 'true')
  unlocked.value = true
}

// 清除解锁状态（登出或重置时使用）
export function clearUnlock(): void {
  localStorage.removeItem(UNLOCK_KEY)
  unlocked.value = false
}
