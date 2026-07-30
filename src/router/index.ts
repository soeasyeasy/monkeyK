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
    // 知识库 - 知识列表页
    {
      path: '/tutorials',
      name: 'tutorials',
      component: () => import('../views/TutorialIndex.vue'),
    },
    // 知识系列索引 - 显示某个系列的所有章节
    {
      path: '/tutorials/:seriesId',
      name: 'series',
      component: () => import('../views/SeriesIndex.vue'),
    },
    // 知识章节内容 - 显示具体章节的 Markdown 内容
    {
      path: '/tutorials/:seriesId/:chapterSlug',
      name: 'chapter',
      component: () => import('../views/ChapterView.vue'),
    },
    // 工作台（待办 + 生活合并）
    {
      path: '/todo',
      name: 'workspace',
      component: () => import('../views/TodoIndex.vue'),
    },
    // 旧路由兼容重定向
    {
      path: '/life',
      redirect: '/todo',
    },
  ],
})

export default router
