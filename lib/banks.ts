import bankList from './banks.json'

export type Bank = {
  name: string
  code: string
}

export const BANKS: Bank[] = bankList

const banksByCode = new Map(BANKS.map((bank) => [bank.code.trim().toLowerCase(), bank.name]))

export function bankNameForCode(code?: string | null) {
  if (!code) return undefined
  return banksByCode.get(code.trim().toLowerCase())
}
