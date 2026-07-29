/**
 * Vue Router 路由配置
 * 定义应用的页面路由和导航规则
 */
import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'

// 创建路由实例，使用 HTML5 History 模式
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 首页
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    // 教程中心 - 教程列表页
    {
      path: '/tutorials',
      name: 'tutorials',
      component: () => import('../views/TutorialIndex.vue'),
    },
    // 教程系列索引 - 显示某个系列的所有章节
    {
      path: '/tutorials/:seriesId',
      name: 'series',
      component: () => import('../views/SeriesIndex.vue'),
    },
    // 教程章节内容 - 显示具体章节的 Markdown 内容
    {
      path: '/tutorials/:seriesId/:chapterSlug',
      name: 'chapter',
      component: () => import('../views/ChapterView.vue'),
    },
    // 个人生活记录页
    {
      path: '/life',
      name: 'life',
      component: () => import('../views/LifeIndex.vue'),
    },
    // 待办事项页
    {
      path: '/todo',
      name: 'todo',
      component: () => import('../views/TodoIndex.vue'),
    },
  ],
})

export default router
