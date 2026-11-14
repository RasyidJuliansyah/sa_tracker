import { z } from 'zod'
import { dateKey, timezoneEnum } from './common.js'

const optText = (n: number) => z.string().trim().max(n).optional().nullable().transform((v) => (v ? v : null))
const optDate = dateKey.optional().nullable().transform((v) => v ?? null)

export const contractInput = z.object({
  signedDate: dateKey.optional().nullable(), start: dateKey, end: dateKey,
  value: z.number().positive('Nilai kontrak harus lebih dari 0').max(9_999_999_999_999),
  note: optText(255),
})

export const schoolBody = z.object({
  name: z.string().trim().min(1).max(200),
  npsn: z.string().trim().regex(/^\d{8}$/, 'NPSN harus 8 digit angka'),
  lmsSchoolId: z.number().int().positive().optional().nullable().transform((v) => v ?? null),
  jenjangId: z.number().int().positive(), packageId: z.number().int().positive(),
  timezone: timezoneEnum,
  city: optText(100), address: optText(255), picName: optText(120), picContact: optText(60),
  partnershipStartDate: dateKey, onboardingDate: optDate, activeSinceDate: optDate, partnershipEndDate: optDate,
})

export const createSchoolBody = schoolBody.extend({ contract: contractInput, agentId: z.number().int().positive().optional().nullable() })
export const updateSchoolBody = schoolBody.partial().strict()
export const renewalBody = contractInput.extend({ previousContractId: z.number().int().positive(), signedDate: dateKey })

export const listSchoolQuery = z.object({
  query: z.string().max(100).optional(),
  jenjangId: z.coerce.number().int().positive().optional(), packageId: z.coerce.number().int().positive().optional(),
  status: z.enum(['RENEWED', 'EXPIRED', 'ENDING_SOON', 'RUNNING']).optional(),
  agentId: z.string().regex(/^(\d+|NONE)$/).optional(),
  page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(200).default(50),
})
