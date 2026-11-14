import { createApp } from 'vue'
import App from './App.vue'
import { pinia } from './plugins/pinia'
import { vuetify } from './plugins/vuetify'
import { router } from './router'
import '@fontsource/rubik/400.css'
import '@fontsource/rubik/500.css'
import '@fontsource/rubik/600.css'
import '@fontsource/rubik/700.css'
import './styles/global.css'

createApp(App).use(pinia).use(router).use(vuetify).mount('#app')
