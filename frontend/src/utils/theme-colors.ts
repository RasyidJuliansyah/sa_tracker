export interface DesignToken {
  name: string
  value: string
}

// Token yang dipetakan ke warna bawaan Vuetify (docs/design-system.md, bagian Tema Vuetify).
// Semantik error/success/warning/info memakai token -text, bukan -solid.
const VUETIFY_MAP: Record<string, string> = {
  background: 'canvas',
  surface: 'surface',
  'on-background': 'text',
  'on-surface': 'text',
  primary: 'brand',
  'on-primary': 'text-on-brand',
  secondary: 'brand-strong',
  error: 'error-text',
  success: 'success-text',
  warning: 'warning-text',
  info: 'info-text',
}

// Sudah terwakili oleh warna bawaan Vuetify di atas, jangan didaftarkan ganda.
const NOT_EXTRA = new Set(['surface', 'canvas', 'text', 'text-on-brand'])

export function buildThemeColors(tokens: DesignToken[]): Record<string, string> {
  const byName = new Map(tokens.map((t) => [t.name, t.value]))
  const colors: Record<string, string> = {}

  for (const [vuetifyName, tokenName] of Object.entries(VUETIFY_MAP)) {
    const value = byName.get(tokenName)
    if (!value) throw new Error(`Token "${tokenName}" tidak ada di tokens.json`)
    colors[vuetifyName] = value
  }

  // Teks di atas warna semantik selalu putih, supaya tidak bergeser oleh pilihan otomatis Vuetify.
  for (const role of ['error', 'success', 'warning', 'info']) colors[`on-${role}`] = '#ffffff'

  for (const token of tokens) {
    if (!NOT_EXTRA.has(token.name)) colors[token.name] = token.value
  }
  return colors
}
