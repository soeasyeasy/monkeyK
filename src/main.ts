import './assets/base.css'
import './assets/themes.css'
import './assets/doc-styles.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import animateDirective from './directives/animate'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 注册动画指令
app.directive('animate', animateDirective)

app.mount('#app')
