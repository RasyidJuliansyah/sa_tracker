import { describe, expect, it } from 'vitest'
import tokens from '../../../docs/design-system/skolla-lms/tokens.json'
import { buildThemeColors } from '../../src/utils/theme-colors'

const colors = buildThemeColors(tokens.color.tokens)

describe('buildThemeColors', () => {
  it('memetakan primary ke brand dan secondary ke brand-strong', () => {
    expect(colors.primary).toBe('#040abe')
    expect(colors.secondary).toBe('#02219e')
    expect(colors['on-primary']).toBe('#ffffff')
  })

  it('memetakan warna semantik ke token -text, bukan -solid', () => {
    expect(colors.error).toBe('#b01b13')
    expect(colors.success).toBe('#006f36')
    expect(colors.warning).toBe('#8a5a00')
    expect(colors.info).toBe('#00548d')
  })

  it('menulis on-warna semantik sebagai putih eksplisit', () => {
    for (const role of ['error', 'success', 'warning', 'info']) {
      expect(colors[`on-${role}`]).toBe('#ffffff')
    }
  })

  it('mendaftarkan token tambahan dengan nama yang sama', () => {
    expect(colors['brand-soft']).toBe('#eef5ff')
    expect(colors['error-solid']).toBe('#eb3123')
    expect(colors['canvas-table']).toBe('#f8fafc')
    expect(colors['chart-1']).toBe('#8c7bff')
  })

  it('melempar galat jika token wajib tidak ada', () => {
    expect(() => buildThemeColors([{ name: 'brand', value: '#000000' }])).toThrow(/tidak ada/)
  })
})
