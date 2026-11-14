import { describe, expect, it } from 'vitest'

process.env.DATABASE_URL ??= 'mysql://x:x@localhost:3306/x'
const { sanitizeChanges } = await import('../../src/services/audit.js')

describe('sanitizeChanges', () => {
  it('membuang kolom rahasia secara rekursif', () => {
    const out = sanitizeChanges({ before: { name: 'A', passwordHash: 'x' }, after: { name: 'B', nested: [{ token: 't', ok: 1 }] } })
    expect(out).toEqual({ before: { name: 'A' }, after: { name: 'B', nested: [{ ok: 1 }] } })
  })
  it('Date menjadi ISO', () => {
    expect(sanitizeChanges({ d: new Date('2026-01-01T00:00:00Z') })).toEqual({ d: '2026-01-01T00:00:00.000Z' })
  })
})
