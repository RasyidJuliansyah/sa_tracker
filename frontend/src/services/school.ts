// Pintu masuk layanan sekolah: data tiruan di mode dev:mock, selain itu API sungguhan.
// Impor/ekspor CSV (existingNpsnSet, commitImport, listExports, addExportLog, allContracts, allVisits) tetap tiruan sampai B9.
import { MOCK_AUTH } from '@/stores/session'
import * as api from './school.api'
import * as mock from './school.mock'

export type { AgentSummary, RenewalSave, SchoolDetail, SchoolFilter, SchoolInput, SchoolRow } from './school.mock'
export { addExportLog, allContracts, allVisits, commitImport, existingNpsnSet, listExports, MAX_AGENTS_PER_SCHOOL } from './school.mock'

const impl = MOCK_AUTH ? mock : api
export const listAgents = impl.listAgents
export const listSchools = impl.listSchools
export const getSchool = impl.getSchool
export const npsnOwner = impl.npsnOwner
export const createSchool = impl.createSchool
export const addRenewal = impl.addRenewal
export const listAssignmentsByAgent = impl.listAssignmentsByAgent
export const assignSchool = impl.assignSchool
export const listTargets = impl.listTargets
export const saveTarget = impl.saveTarget
