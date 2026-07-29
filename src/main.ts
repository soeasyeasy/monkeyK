/**
 * 应用入口文件
 * 负责初始化 Vue 应用、注册插件和挂载到 DOM
 */

// 导入全局样式
import './assets/base.css'
import './assets/themes.css'
import './assets/doc-styles.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import animateDirective from './directives/animate'

// 创建 Vue 应用实例
const app = createApp(App)

// 注册 Pinia 状态管理
app.use(createPinia())
// 注册 Vue Router 路由
app.use(router)

// 注册自定义动画指令 v-animate
app.directive('animate', animateDirective)

// 挂载应用到 #app 元素
app.mount('#app')
