<script setup lang="ts">
/**
 * 应用根组件
 * 根据路由判断使用教程布局还是普通布局
 */
import { computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import TutorialLayout from './layouts/TutorialLayout.vue'
import AppHeader from './components/AppHeader.vue'

const route = useRoute()
// 判断当前是否为教程相关路由，用于切换布局
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
