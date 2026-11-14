// Galat aplikasi: pesan berbahasa Indonesia untuk pengguna, kode untuk UI.
export type ErrorCode =
  | 'VALIDATION' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'RATE_LIMITED' | 'INTERNAL'

const STATUS: Record<ErrorCode, number> = {
  VALIDATION: 400, UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404, CONFLICT: 409, RATE_LIMITED: 429, INTERNAL: 500,
}

export class AppError extends Error {
  readonly status: number
  constructor(readonly code: ErrorCode, message: string, readonly details?: unknown) {
    super(message)
    this.status = STATUS[code]
  }
}
