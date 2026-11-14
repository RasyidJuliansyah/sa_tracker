import { afterEach, describe, expect, it, vi } from 'vitest'
import { log } from '../../src/utils/logger.js'

describe('log', () => {
  afterEach(() => vi.restoreAllMocks())

  it('menulis satu baris JSON ke stdout', () => {
    const write = vi.spyOn(process.stdout, 'write').mockReturnValue(true)
    log('info', 'halo', { port: 3011 })
    const out = String(write.mock.calls[0]?.[0])
    expect(out.endsWith('\n')).toBe(true)
    expect(out.trim().split('\n')).toHaveLength(1)
    expect(JSON.parse(out)).toMatchObject({ level: 'info', message: 'halo', port: 3011 })
  })
})
