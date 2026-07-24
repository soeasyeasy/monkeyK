<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import TutorialLayout from './layouts/TutorialLayout.vue'
import AppHeader from './components/AppHeader.vue'

const route = useRoute()
const isTutorialRoute = computed(() => route.path.startsWith('/tutorials'))
</script>

<template>
  <TutorialLayout v-if="isTutorialRoute">
    <RouterView v-slot="{ Component }">
      <Transition name="page-fade" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </RouterView>
  </TutorialLayout>
  <div v-else class="app-container">
    <AppHeader />
    <main class="app-main">
      <RouterView v-slot="{ Component }">
        <Transition name="page-fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background: var(--bg-primary);
}

.app-main {
  padding-top: 60px;
}

/* 页面过渡 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
