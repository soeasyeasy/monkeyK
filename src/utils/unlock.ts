import { ref } from 'vue'

const UNLOCK_KEY = 'tutorial_unlocked'

export const unlocked = ref(localStorage.getItem(UNLOCK_KEY) === 'true')

export function isUnlocked(): boolean {
  return unlocked.value
}

export function setUnlocked(): void {
  localStorage.setItem(UNLOCK_KEY, 'true')
  unlocked.value = true
}

export function clearUnlock(): void {
  localStorage.removeItem(UNLOCK_KEY)
  unlocked.value = false
}
