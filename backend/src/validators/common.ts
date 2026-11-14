import { z } from 'zod'

export const idParam = z.object({ id: z.coerce.number().int().positive() })
export const timezoneEnum = z.enum(['WIB', 'WITA', 'WIT'])
export const roleEnum = z.enum(['ADMIN', 'MANAGER', 'AGENT'])
export const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal yyyy-mm-dd')
export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export const tempPassword = z.string().min(8, 'Password minimal 8 karakter').max(100)
