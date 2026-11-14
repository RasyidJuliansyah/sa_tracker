// Satu-satunya modul rumus retention (docs/PLAN.md, "Retention dan target"). Murni, tanpa database.
export interface ContractRow {
  id: number
  schoolId: number
  endDate: string // yyyy-mm-dd
  value: number
  /** Kontrak yang memperpanjang baris ini (RENEWAL dengan previous_contract_id = id) */
  previousContractId: number | null
  type: 'NEW' | 'RENEWAL'
  signedDate: string | null
}
export interface Assignment { schoolId: number; agentId: number; sharePercent: number }

export type RetentionStatus = 'MET' | 'BELOW' | 'NO_DATA'
export interface RetentionResult {
  cohortValue: number
  retainedValue: number
  /** persen, tidak dibatasi 100; null bila kohort kosong */
  percent: number | null
  targetValue: number
  decidedValue: number
  decidedRetained: number
  status: RetentionStatus
}

export const DEFAULT_TARGET_PERCENT = 65

/** Nilai perpanjangan yang sudah ditandatangani untuk kontrak `c` (0 bila belum). */
export function retainedFor(c: ContractRow, all: ContractRow[]): number {
  const r = all.find((x) => x.type === 'RENEWAL' && x.previousContractId === c.id && x.signedDate)
  return r ? r.value : 0
}

const yearOf = (d: string) => Number(d.slice(0, 4))

function compute(rows: { c: ContractRow; weight: number }[], all: ContractRow[], todayWib: string, targetPercent: number): RetentionResult {
  let cohortValue = 0, retainedValue = 0, decidedValue = 0, decidedRetained = 0
  for (const { c, weight } of rows) {
    const v = c.value * weight
    const r = retainedFor(c, all) * weight
    cohortValue += v
    retainedValue += r
    if (r > 0 || c.endDate < todayWib) { decidedValue += v; decidedRetained += r }
  }
  const status: RetentionStatus =
    decidedValue === 0 ? 'NO_DATA' : (decidedRetained / decidedValue) * 100 >= targetPercent ? 'MET' : 'BELOW'
  return {
    cohortValue, retainedValue,
    percent: cohortValue === 0 ? null : (retainedValue / cohortValue) * 100,
    targetValue: (cohortValue * targetPercent) / 100,
    decidedValue, decidedRetained, status,
  }
}

/** Retention agregat (manager) untuk kohort tahun `year`: kontrak yang berakhir di tahun itu (kalender WIB). */
export function retentionForYear(contracts: ContractRow[], year: number, todayWib: string, targetPercent = DEFAULT_TARGET_PERCENT): RetentionResult {
  const cohort = contracts.filter((c) => yearOf(c.endDate) === year)
  return compute(cohort.map((c) => ({ c, weight: 1 })), contracts, todayWib, targetPercent)
}

/** Retention satu agent: kontrak kohort milik sekolah yang sedang ditugaskan, dikali porsi penugasan. */
export function retentionForAgent(
  contracts: ContractRow[], assignments: Assignment[], agentId: number, year: number, todayWib: string, targetPercent = DEFAULT_TARGET_PERCENT,
): RetentionResult {
  const rows: { c: ContractRow; weight: number }[] = []
  for (const a of assignments.filter((x) => x.agentId === agentId)) {
    for (const c of contracts) {
      if (c.schoolId === a.schoolId && yearOf(c.endDate) === year) rows.push({ c, weight: a.sharePercent / 100 })
    }
  }
  return compute(rows, contracts, todayWib, targetPercent)
}

export interface CohortBreakdown {
  renewed: { count: number; amount: number }
  lapsed: { count: number; amount: number }
  pending: { count: number; amount: number }
}

/** Rincian kohort tahun T: sudah diperpanjang (nilai perpanjangan), berakhir belum diperpanjang, belum jatuh tempo. */
export function cohortBreakdown(contracts: ContractRow[], year: number, todayWib: string): CohortBreakdown {
  const out: CohortBreakdown = { renewed: { count: 0, amount: 0 }, lapsed: { count: 0, amount: 0 }, pending: { count: 0, amount: 0 } }
  for (const c of contracts.filter((x) => yearOf(x.endDate) === year)) {
    const r = retainedFor(c, contracts)
    const bucket = r > 0 ? out.renewed : c.endDate < todayWib ? out.lapsed : out.pending
    bucket.count += 1
    bucket.amount += r > 0 ? r : c.value
  }
  return out
}
