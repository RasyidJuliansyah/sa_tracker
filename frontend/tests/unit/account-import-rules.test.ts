import { describe, expect, it } from 'vitest'
import { previewAccountImport, summarizeAccountImport } from '../../src/components/admin/account-import-rules'

const HEAD = 'nama,email,peran,zona_waktu,password'

describe('impor akun', () => {
  it('baris valid (baru dan perbarui), ganda, peran tidak dikenal, email kosong', () => {
    const csv = [HEAD,
      'Budi Baru,budi@contoh.id,AGENT,WIB,',
      'Rina Lama,rina@contoh.id,MANAGER,WITA,',
      'Dobel,budi@contoh.id,AGENT,,',
      'Tanpa Email,,AGENT,,',
      'Peran Salah,x@contoh.id,SUPERADMIN,,',
    ].join('\n')
    const { rows, fileError } = previewAccountImport(csv, new Set(['rina@contoh.id']))
    expect(fileError).toBe('')
    expect(rows.map((r) => r.ok)).toEqual([true, true, false, false, false])
    expect(rows[0]!.isNew).toBe(true)
    expect(rows[1]!.isNew).toBe(false)
    expect(rows[2]!.message).toContain('ganda')
    expect(rows[3]!.message).toContain('wajib')
    expect(rows[4]!.message).toContain('ADMIN, MANAGER, atau AGENT')
    expect(summarizeAccountImport(rows)).toEqual({ total: 5, created: 1, updated: 1, failed: 3 })
  })
  it('kolom wajib tidak ada', () => {
    expect(previewAccountImport('a,b\n1,2', new Set()).fileError).toContain('Kolom wajib')
  })
  it('password terlalu pendek ditolak', () => {
    const csv = `${HEAD}\nBudi,budi@contoh.id,AGENT,WIB,pendek`
    expect(previewAccountImport(csv, new Set()).rows[0]!.message).toContain('minimal 8 karakter')
  })
})
