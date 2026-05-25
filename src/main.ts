import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/variables.css'
import './styles/base.css'

// Vue 应用入口：注册 Pinia 状态管理，并挂载到 index.html 的 #app。
createApp(App).use(createPinia()).mount('#app')
