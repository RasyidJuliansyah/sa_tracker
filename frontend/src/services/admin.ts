// Pintu masuk layanan admin: data tiruan di mode dev:mock (VITE_MOCK_AUTH=1), selain itu API sungguhan.
import { MOCK_AUTH } from '@/stores/session'
import * as api from './admin.api'
import * as mock from './admin.mock'

export type { AccountFilter, AccountInput, AuditFilter, MasterKind, MockAccountExportLog } from './admin.mock'
export { auditDataTypes, existingAccountEmails, generateTempPassword, isValidEmail } from './admin.mock'

const impl = MOCK_AUTH ? mock : api
export const listAccounts = impl.listAccounts
export const listAccountExports = impl.listAccountExports
export const createAccount = impl.createAccount
export const updateAccount = impl.updateAccount
export const setAccountActive = impl.setAccountActive
export const resetAccountPassword = impl.resetAccountPassword
export const emailExists = impl.emailExists
export const listMaster = impl.listMaster
export const masterNameExists = impl.masterNameExists
export const createMaster = impl.createMaster
export const renameMaster = impl.renameMaster
export const setMasterActive = impl.setMasterActive
export const listAudit = impl.listAudit
export const listAuditActors = impl.listAuditActors
