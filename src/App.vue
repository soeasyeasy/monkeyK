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
    <RouterView />
  </TutorialLayout>
  <div v-else class="app-container">
    <AppHeader />
    <main class="app-main">
      <RouterView />
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
</style>
