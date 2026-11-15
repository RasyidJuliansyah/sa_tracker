import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { id } from 'vuetify/locale'
import tokens from '@tokens'
import { buildThemeColors } from '@/utils/theme-colors'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

const colors = buildThemeColors(tokens.color.tokens)
const border = tokens.color.tokens.find((t) => t.name === 'border')?.value ?? '#d7dfe9'

const fieldDefaults = { variant: 'outlined', density: 'compact' } as const

export const vuetify = createVuetify({
  components,
  directives,
  locale: { locale: 'id', fallback: 'id', messages: { id } },
  theme: {
    defaultTheme: 'skolla',
    themes: {
      skolla: {
        dark: false,
        colors,
        variables: { 'border-color': border, 'border-opacity': 1 },
      },
    },
  },
  defaults: {
    VBtn: { color: 'primary', variant: 'flat', rounded: 'pill', height: 40 },
    VCard: { flat: true, border: true, rounded: 'lg' },
    VChip: { rounded: 'pill', variant: 'flat' },
    VTextField: fieldDefaults,
    VSelect: fieldDefaults,
    VAutocomplete: fieldDefaults,
    VCombobox: fieldDefaults,
    VTextarea: { variant: 'outlined' },
    VAppBar: { flat: true, height: 70 },
    VNavigationDrawer: { width: 220, border: 'e' },
    VCheckbox: { color: 'primary' },
    VCheckboxBtn: { color: 'primary' },
  },
})
