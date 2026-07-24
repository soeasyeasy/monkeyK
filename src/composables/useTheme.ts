import { ref, watch } from 'vue'

export type ThemeName = 'light' | 'dark' | 'ocean' | 'forest' | 'violet' | 'sunset' | 'rose'

const STORAGE_KEY = 'ts-tutorial-theme'

const themes: { name: ThemeName; label: string; icon: string }[] = [
  { name: 'light', label: '浅色', icon: '☀️' },
  { name: 'dark', label: '深色', icon: '🌙' },
  { name: 'ocean', label: '海洋蓝', icon: '🌊' },
  { name: 'forest', label: '森林绿', icon: '🌿' },
  { name: 'violet', label: '紫罗兰', icon: '💜' },
  { name: 'sunset', label: '暮光橙', icon: '🌅' },
  { name: 'rose', label: '玫瑰粉', icon: '🌸' },
]

function getInitialTheme(): ThemeName {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && themes.some((t) => t.name === saved)) {
      return saved as ThemeName
    }
  } catch {}
  return 'light'
}

const currentTheme = ref<ThemeName>(getInitialTheme())

function applyTheme(theme: ThemeName) {
  if (theme === 'light') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', theme)
  }
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {}
}

// 初始化
applyTheme(currentTheme.value)

export function useTheme() {
  function setTheme(theme: ThemeName) {
    currentTheme.value = theme
    applyTheme(theme)
  }

  function toggleTheme() {
    const idx = themes.findIndex((t) => t.name === currentTheme.value)
    const nextTheme = themes[(idx + 1) % themes.length]
    if (nextTheme) {
      setTheme(nextTheme.name)
    }
  }

  watch(currentTheme, (theme) => {
    applyTheme(theme)
  })

  return {
    currentTheme,
    themes,
    setTheme,
    toggleTheme,
  }
}
