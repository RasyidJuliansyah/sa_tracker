import { describe, expect, it } from 'vitest'
import { qs } from '../../src/services/manager-plans'

describe('manager-plans qs (filter querystring)', () => {
  it('kosong tanpa filter', () => {
    expect(qs({})).toBe('')
  })
  it('hanya menyertakan filter yang terisi (agentId/schoolId 0 tidak valid, diabaikan)', () => {
    expect(qs({ agentId: 0, schoolId: null, status: null } as never)).toBe('')
  })
  it('menyusun semua filter yang terisi', () => {
    const s = qs({ from: '2026-11-01', to: '2026-11-30', agentId: 3, schoolId: 7, source: 'SELF', upcoming: true })
    expect(s).toContain('from=2026-11-01')
    expect(s).toContain('agentId=3')
    expect(s).toContain('schoolId=7')
    expect(s).toContain('source=SELF')
    expect(s).toContain('upcoming=true')
  })
})
