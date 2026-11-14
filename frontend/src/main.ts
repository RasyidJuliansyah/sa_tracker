import { createApp } from 'vue'
import App from './App.vue'
import { pinia } from './plugins/pinia'
import { vuetify } from './plugins/vuetify'
import { router } from './router'
import { ApiError } from './services/http'
import '@fontsource/rubik/400.css'
import '@fontsource/rubik/500.css'
import '@fontsource/rubik/600.css'
import '@fontsource/rubik/700.css'
import './styles/global.css'

const app = createApp(App)
// Galat API sudah ditampilkan lewat snackbar; jangan dobel di konsol.
app.config.errorHandler = (err) => {
  if (!(err instanceof ApiError)) console.error(err)
}
app.use(pinia).use(router).use(vuetify).mount('#app')
