<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTheme } from '../composables/useTheme'

const { currentMode, currentAccent, modes, accentColors, setMode, setAccent } = useTheme()
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function selectMode(modeName: string) {
  setMode(modeName as any)
}

function selectAccent(accentName: string) {
  setAccent(accentName as any)
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const currentModeData = () => {
  return modes.find((t) => t.name === currentMode.value)
}
</script>

<template>
  <div class="theme-switcher" ref="dropdownRef">
    <button class="theme-trigger" @click="toggleDropdown">
      <span class="theme-label">{{ currentModeData()?.label }}</span>
      <svg class="theme-arrow" :class="{ open: isOpen }" width="12" height="12" viewBox="0 0 12 12">
        <path
          d="M3 4.5L6 7.5L9 4.5"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <Transition name="dropdown">
      <div v-if="isOpen" class="theme-dropdown">
        <!-- 模式选择（浅色/深色） -->
        <div class="theme-section">
          <div class="section-title">模式</div>
          <button
            v-for="mode in modes"
            :key="mode.name"
            class="theme-option"
            :class="{ active: currentMode === mode.name }"
            @click="selectMode(mode.name)"
          >
            <span class="option-label">{{ mode.label }}</span>
            <svg
              v-if="currentMode === mode.name"
              class="option-check"
              width="16"
              height="16"
              viewBox="0 0 16 16"
            >
              <path
                d="M3.5 8.5L6.5 11.5L12.5 4.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        <!-- 强调色选择 -->
        <div class="theme-section">
          <div class="section-title">强调色</div>
          <button
            v-for="accent in accentColors"
            :key="accent.name"
            class="theme-option"
            :class="{ active: currentAccent === accent.name }"
            @click="selectAccent(accent.name)"
          >
            <span class="option-label">{{ accent.label }}</span>
            <svg
              v-if="currentAccent === accent.name"
              class="option-check"
              width="16"
              height="16"
              viewBox="0 0 16 16"
            >
              <path
                d="M3.5 8.5L6.5 11.5L12.5 4.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.theme-switcher {
  position: relative;
}

.theme-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur));
  -webkit-backdrop-filter: blur(var(--blur));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.theme-trigger:hover {
  background: var(--bg-glass-hover);
  border-color: var(--border-hover);
}

.theme-label {
  font-weight: 500;
}

.theme-arrow {
  transition: transform 0.2s;
  color: var(--text-secondary);
}

.theme-arrow.open {
  transform: rotate(180deg);
}

.theme-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 160px;
  background: var(--bg-glass-strong);
  backdrop-filter: blur(var(--blur-strong));
  -webkit-backdrop-filter: blur(var(--blur-strong));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: 1000;
  padding: 0.5rem 0;
}

.theme-section {
  padding: 0.25rem 0;
}

.theme-section + .theme-section {
  border-top: 1px solid var(--border-color);
  margin-top: 0.25rem;
  padding-top: 0.5rem;
}

.section-title {
  padding: 0.25rem 1rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 0.9rem;
  color: var(--text-primary);
  text-align: left;
}

.theme-option:hover {
  background: var(--accent-light);
}

.theme-option.active {
  background: var(--accent-light);
  color: var(--text-link);
}

.option-label {
  flex: 1;
  font-weight: 500;
}

.option-check {
  color: var(--text-link);
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 640px) {
  .theme-label {
    display: none;
  }

  .theme-trigger {
    padding: 0.5rem;
  }
}
</style>
