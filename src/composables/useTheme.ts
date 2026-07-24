import { ref, watch } from 'vue'

export type ThemeMode = 'light' | 'dark'
export type AccentColor = 'default' | 'ocean' | 'forest' | 'violet' | 'sunset' | 'rose'

const MODE_KEY = 'ts-tutorial-mode'
const ACCENT_KEY = 'ts-tutorial-accent'

const modes: { name: ThemeMode; label: string }[] = [
  { name: 'light', label: '浅色' },
  { name: 'dark', label: '深色' },
]

const accentColors: { name: AccentColor; label: string }[] = [
  { name: 'default', label: '默认' },
  { name: 'ocean', label: '海洋蓝' },
  { name: 'forest', label: '森林绿' },
  { name: 'violet', label: '紫罗兰' },
  { name: 'sunset', label: '暮光橙' },
  { name: 'rose', label: '玫瑰粉' },
]

function getInitialMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(MODE_KEY)
    if (saved && modes.some((t) => t.name === saved)) {
      return saved as ThemeMode
    }
  } catch {}
  return 'light'
}

function getInitialAccent(): AccentColor {
  try {
    const saved = localStorage.getItem(ACCENT_KEY)
    if (saved && accentColors.some((t) => t.name === saved)) {
      return saved as AccentColor
    }
  } catch {}
  return 'default'
}

const currentMode = ref<ThemeMode>(getInitialMode())
const currentAccent = ref<AccentColor>(getInitialAccent())

function applyTheme() {
  const mode = currentMode.value
  const accent = currentAccent.value

  // 应用 mode（light/dark）
  if (mode === 'light') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', mode)
  }

  // 应用 accent color
  if (accent === 'default') {
    document.documentElement.removeAttribute('data-theme-accent')
  } else {
    document.documentElement.setAttribute('data-theme-accent', accent)
  }

  try {
    localStorage.setItem(MODE_KEY, mode)
    localStorage.setItem(ACCENT_KEY, accent)
  } catch {}
}

// 初始化
applyTheme()

export function useTheme() {
  function setMode(mode: ThemeMode) {
    currentMode.value = mode
    applyTheme()
  }

  function setAccent(accent: AccentColor) {
    currentAccent.value = accent
    applyTheme()
  }

  function toggleMode() {
    currentMode.value = currentMode.value === 'light' ? 'dark' : 'light'
    applyTheme()
  }

  watch([currentMode, currentAccent], () => {
    applyTheme()
  })

  return {
    currentMode,
    currentAccent,
    modes,
    accentColors,
    setMode,
    setAccent,
    toggleMode,
  }
}
