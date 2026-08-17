import type { RowError, UploadRow } from './types'

export const ACCOUNT_NUMBER_LENGTH = 10

const REQUIRED_COLUMNS: (keyof UploadRow)[] = [
  'recipient_name',
  'recipient_email',
  'account_number',
  'bank_code',
  'amount',
  'currency',
  'transaction_reference',
]

const MONEY_PATTERN = /^(0|[1-9]\d{0,15})(?:\.(\d{1,2}))?$/
const MAX_TRANSACTION = 10_000_000
const MAX_BATCH = 100_000_000
const ALLOWED_CURRENCIES = new Set(['NGN'])

export function accountNumberIssue(value: string) {
  const account = value.trim()
  if (!account) return 'Account number is required.'
  if (!/^\d+$/.test(account)) return 'Account number must contain digits only and be exactly 10 digits.'
  if (account.length < ACCOUNT_NUMBER_LENGTH) {
    return `Account number is ${account.length} digit${account.length === 1 ? '' : 's'}; it must be exactly 10.`
  }
  if (account.length > ACCOUNT_NUMBER_LENGTH) {
    return `Account number is ${account.length} digits; it must be exactly 10.`
  }
  return null
}

export function accountNumberHint(value: string) {
  const digits = value.replace(/\D/g, '')
  if (/^\d{10}$/.test(value.trim())) return { text: '10 digits', ok: true }
  if (digits.length < ACCOUNT_NUMBER_LENGTH) {
    return { text: `${digits.length} of 10 digits — too short`, ok: false }
  }
  return { text: `${digits.length} of 10 digits — too long`, ok: false }
}

export function fieldErrorsForRow(rowErrors: RowError[], csvRow: number) {
  const fields: Partial<Record<keyof UploadRow, string>> = {}
  for (const error of rowErrors) {
    if (error.row !== csvRow) continue
    for (const field of error.fields) {
      const key = field as keyof UploadRow
      if (fields[key]) continue
      fields[key] = error.message
    }
  }
  return fields
}

export function validateRows(rows: UploadRow[]): RowError[] {
  const rowErrors: RowError[] = []
  const destinations = new Set<string>()
  const currencies = new Set<string>()
  let batchTotal = 0

  rows.forEach((row, index) => {
    const csvRow = index + 2
    const missing = REQUIRED_COLUMNS.filter((column) => !String(row[column] ?? '').trim())
    if (missing.length) {
      rowErrors.push({ row: csvRow, fields: [...missing], message: 'Required value is missing.' })
      return
    }

    const invalid: (keyof UploadRow)[] = []
    const amount = parseAmount(row.amount)
    if (amount === null) invalid.push('amount')
    else {
      if (amount > MAX_TRANSACTION) invalid.push('amount')
      batchTotal += amount
    }

    const accountIssue = accountNumberIssue(row.account_number)
    if (accountIssue) {
      rowErrors.push({ row: csvRow, fields: ['account_number'], message: accountIssue })
    }

    if (!/^[A-Za-z0-9_-]{2,20}$/.test(row.bank_code.trim())) invalid.push('bank_code')
    const currency = row.currency.trim().toUpperCase()
    if (!/^[A-Za-z]{3}$/.test(currency) || !ALLOWED_CURRENCIES.has(currency)) invalid.push('currency')
    if (row.recipient_name.trim().length < 2 || row.recipient_name.trim().length > 120) invalid.push('recipient_name')
    if (row.recipient_email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.recipient_email.trim())) {
      invalid.push('recipient_email')
    }
    const narration = row.transaction_reference.trim().replace(/\s+/g, ' ')
    if (narration.length < 3) {
      rowErrors.push({ row: csvRow, fields: ['transaction_reference'], message: 'Transaction reference must be at least 3 characters.' })
    } else if (narration.length > 80) {
      rowErrors.push({ row: csvRow, fields: ['transaction_reference'], message: 'Transaction reference must be 80 characters or fewer.' })
    }

    const destination = `${currency}:${row.bank_code.trim().toUpperCase()}:${row.account_number.trim()}`
    if (destinations.has(destination)) {
      rowErrors.push({
        row: csvRow,
        fields: ['bank_code', 'account_number'],
        message: 'This bank account is duplicated in the batch.',
      })
    }
    destinations.add(destination)
    currencies.add(currency)

    if (invalid.length) {
      rowErrors.push({ row: csvRow, fields: invalid, message: 'One or more values have an invalid format.' })
    }
  })

  if (currencies.size > 1) {
    rowErrors.push({ row: 0, fields: ['currency'], message: 'A batch must contain a single currency.' })
  }
  if (batchTotal > MAX_BATCH) {
    rowErrors.push({ row: 0, fields: ['amount'], message: `Batch total exceeds the configured ${MAX_BATCH.toLocaleString()} limit.` })
  }

  return rowErrors
}

function parseAmount(value: string) {
  const match = MONEY_PATTERN.exec(String(value || '').trim())
  if (!match) return null
  const amount = Number(match[1]) + Number((match[2] || '0').padEnd(2, '0')) / 100
  if (!Number.isFinite(amount) || amount <= 0) return null
  return amount
}
