export type Transaction = {
  id: string
  recipientName?: string
  recipientEmail?: string | null
  accountNumber?: string
  bankCode?: string
  amount?: string
  currency: string
  reference?: string
  status: string
  createdAt?: string
}

export type Batch = {
  id: string
  name?: string | null
  uploadedBy: string
  totalAmount: string
  status: string
  approvedBy?: string | null
  approvedAt?: string | null
  transactions: Transaction[]
  createdAt: string
  updatedAt: string
}

export type UploadRow = {
  recipient_name: string
  recipient_email: string
  account_number: string
  bank_code: string
  amount: string
  currency: string
}

export type RowError = { row: number; fields: string[]; message: string }

export type Preview = {
  rows: UploadRow[]
  rowErrors: RowError[]
  parseErrors: { row: number | null; message: string }[]
}
