import './assets/styles/main.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// i18n
import i18n from './plugins/i18n'

//--- FontAwesome ---
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
library.add(fab, fas, far)

import Vue3Toastify from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

const app = createApp(App)
app.use(createPinia())
app.use(i18n)
app.component('font-awesome-icon', FontAwesomeIcon)

app.use(Vue3Toastify, {
  autoClose: 3000,
})

// ⬇️  Викликаємо initAuth перед router
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()

authStore.initAuth().then(() => {
  app.use(router) // ⬅️ Тільки після initAuth!
  app.mount('#app')
})
