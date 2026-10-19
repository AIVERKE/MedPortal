import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import vuetify from './plugins/vuetify'
import { APP_NAME } from '@/config/app'
import { installAuthFetch } from '@/utils/authFetch'
import { useAuthStore } from '@/stores/auth'

document.title = APP_NAME

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(vuetify)
installAuthFetch(() => useAuthStore(pinia))
app.mount('#app')
