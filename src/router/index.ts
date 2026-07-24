import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    // 教程中心
    {
      path: '/tutorials',
      name: 'tutorials',
      component: () => import('../views/TutorialIndex.vue'),
    },
    // 系列索引
    {
      path: '/tutorials/:seriesId',
      name: 'series',
      component: () => import('../views/SeriesIndex.vue'),
    },
    // 章节内容
    {
      path: '/tutorials/:seriesId/:chapterSlug',
      name: 'chapter',
      component: () => import('../views/ChapterView.vue'),
    },
    // 个人模块
    {
      path: '/life',
      name: 'life',
      component: () => import('../views/LifeIndex.vue'),
    },
    {
      path: '/todo',
      name: 'todo',
      component: () => import('../views/TodoIndex.vue'),
    },
  ],
})

export default router
