<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTheme } from '../composables/useTheme'

const { currentTheme, themes, setTheme } = useTheme()
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function selectTheme(themeName: string) {
  setTheme(themeName as any)
  isOpen.value = false
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

const currentThemeData = () => {
  return themes.find(t => t.name === currentTheme.value)
}
</script>

<template>
  <div class="theme-switcher" ref="dropdownRef">
    <button class="theme-trigger" @click="toggleDropdown">
      <span class="theme-icon">{{ currentThemeData()?.icon }}</span>
      <span class="theme-label">{{ currentThemeData()?.label }}</span>
      <svg class="theme-arrow" :class="{ open: isOpen }" width="12" height="12" viewBox="0 0 12 12">
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <Transition name="dropdown">
      <div v-if="isOpen" class="theme-dropdown">
        <button
          v-for="theme in themes"
          :key="theme.name"
          class="theme-option"
          :class="{ active: currentTheme === theme.name }"
          @click="selectTheme(theme.name)"
        >
          <span class="option-icon">{{ theme.icon }}</span>
          <span class="option-label">{{ theme.label }}</span>
          <svg v-if="currentTheme === theme.name" class="option-check" width="16" height="16" viewBox="0 0 16 16">
            <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
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

.theme-icon {
  font-size: 1rem;
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
  min-width: 140px;
  background: var(--bg-glass-strong);
  backdrop-filter: blur(var(--blur-strong));
  -webkit-backdrop-filter: blur(var(--blur-strong));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: 1000;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
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

.option-icon {
  font-size: 1rem;
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
