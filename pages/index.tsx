import axios from 'axios'
import Link from 'next/link'
import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import Layout from '../components/Layout'
import { api, errorMessage, formatMoney } from '../lib/api'
import type { Preview, UploadRow } from '../lib/types'
import { requireAdminPage } from '../lib/session'
import { accountNumberHint, fieldErrorsForRow, validateRows } from '../lib/validateRows'

export const getServerSideProps = requireAdminPage

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const [batchName, setBatchName] = useState('')
  const [createdBatchId, setCreatedBatchId] = useState('')
  const [uploadToast, setUploadToast] = useState<{
    tone: 'success' | 'warning' | 'error'
    title: string
    message: string
  } | null>(null)

  useEffect(() => {
    if (!uploadToast) return
    const timer = window.setTimeout(() => setUploadToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [uploadToast])

  const issues = (preview?.rowErrors.length || 0) + (preview?.parseErrors?.length || 0)
  const currency = preview?.rows[0]?.currency || 'NGN'
  const total = useMemo(
    () => preview?.rows.reduce((sum, row) => sum + Number(row.amount || 0), 0) || 0,
    [preview],
  )
  const invalidRows = useMemo(
    () => new Set(preview?.rowErrors.filter((item) => item.row > 0).map((item) => item.row) || []),
    [preview],
  )
  const accountIssues = useMemo(
    () => preview?.rowErrors.filter((item) => item.fields.includes('account_number') && item.message.includes('10')).length || 0,
    [preview],
  )

  function chooseFile(nextFile?: File) {
    if (!nextFile) return
    if (!nextFile.name.toLowerCase().endsWith('.csv')) {
      const message = 'Only CSV files are supported.'
      setError(message)
      setUploadToast({ tone: 'error', title: 'Upload rejected', message })
      return
    }
    setFile(nextFile)
    setPreview(null)
    setCreatedBatchId('')
    setError('')
    if (!batchName.trim()) {
      setBatchName(nextFile.name.replace(/\.csv$/i, '').replace(/[_-]+/g, ' ').trim().slice(0, 80))
    }
  }

  async function upload(event: FormEvent) {
    event.preventDefault()
    if (!file) return setError('Choose a CSV file first.')
    const data = new FormData()
    data.append('file', file)
    setIsUploading(true)
    setError('')
    try {
      const response = await axios.post<Preview>('/api/upload', data)
      const nextPreview = {
        ...response.data,
        rowErrors: validateRows(response.data.rows),
      }
      setPreview(nextPreview)
      const uploadIssues = nextPreview.rowErrors.length + (nextPreview.parseErrors?.length || 0)
      setUploadToast({
        tone: uploadIssues ? 'warning' : 'success',
        title: 'Upload complete',
        message: uploadIssues
          ? `${response.data.rows.length.toLocaleString()} rows loaded with ${uploadIssues.toLocaleString()} issue${uploadIssues === 1 ? '' : 's'} to review.`
          : `${response.data.rows.length.toLocaleString()} payment row${response.data.rows.length === 1 ? '' : 's'} uploaded and validated.`,
      })
    } catch (uploadError) {
      const message = errorMessage(uploadError, 'The file could not be uploaded.')
      setPreview(null)
      setError(message)
      setUploadToast({ tone: 'error', title: 'Upload failed', message })
    } finally {
      setIsUploading(false)
    }
  }

  async function createBatch() {
    if (!preview || issues) return
    const name = batchName.trim().replace(/\s+/g, ' ')
    if (name.length < 2) return setError('Enter a batch name of at least 2 characters.')
    if (name.length > 80) return setError('Batch name must be 80 characters or fewer.')
    setIsCreating(true)
    setError('')
    try {
      const response = await api.post<{ batchId: string }>('/files/create-batch', {
        name,
        rows: preview.rows,
      })
      setCreatedBatchId(response.data.batchId)
    } catch (createError) {
      setError(errorMessage(createError, 'The batch could not be created.'))
    } finally {
      setIsCreating(false)
    }
  }

  function updateRow(index: number, field: keyof UploadRow, value: string) {
    setPreview((current) => {
      if (!current) return current
      const rows = current.rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row))
      return { ...current, rows, rowErrors: validateRows(rows) }
    })
    setError('')
  }

  function resetUpload() {
    setFile(null)
    setPreview(null)
    setBatchName('')
    setCreatedBatchId('')
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    chooseFile(event.dataTransfer.files?.[0])
  }

  return (
    <Layout
      eyebrow="Disbursements / New batch"
      title="Create a payment batch"
      description="Upload a CSV, correct any issues in the table, then create a batch ready for approval."
    >
      {uploadToast && (
        <div className={`upload-toast upload-toast-${uploadToast.tone}`} role={uploadToast.tone === 'error' ? 'alert' : 'status'} aria-live="polite">
          <span className="upload-toast-icon" aria-hidden="true">{uploadToast.tone === 'success' ? '✓' : uploadToast.tone === 'warning' ? '!' : '×'}</span>
          <div><strong>{uploadToast.title}</strong><p>{uploadToast.message}</p></div>
          <button type="button" onClick={() => setUploadToast(null)} aria-label="Dismiss notification">×</button>
        </div>
      )}
      <div className="steps" aria-label="Batch creation progress">
        <span className="step active"><b>1</b> Upload</span><i />
        <span className={`step ${preview ? 'active' : ''}`}><b>2</b> Validate</span><i />
        <span className={`step ${createdBatchId ? 'active' : ''}`}><b>3</b> Create batch</span>
      </div>

      {error && <div className="alert alert-error" role="alert"><strong>Action needed</strong><span>{error}</span></div>}
      {createdBatchId && (
        <div className="alert alert-success" role="status">
          <strong>Batch created successfully</strong>
          <span>Your payment batch is ready for review and disbursement.</span>
          <Link className="btn btn-small" href={`/batch/${createdBatchId}`}>Open batch</Link>
        </div>
      )}

      {!preview && (
        <section className="panel upload-panel">
          <div className="panel-heading">
            <div><span className="panel-number">01</span><div><h2>Upload payment file</h2><p>Use the standard CSV format. Maximum file size is 5 MB.</p></div></div>
            <a href="/sample-disbursement.csv" download className="text-link">Download template</a>
          </div>
          <form onSubmit={upload}>
            <div
              className={`dropzone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(event: ChangeEvent<HTMLInputElement>) => chooseFile(event.target.files?.[0])}
                aria-label="Choose CSV file"
              />
              <div className="upload-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></svg>
              </div>
              {file ? (
                <><h3>{file.name}</h3><p>{(file.size / 1024).toFixed(1)} KB · Ready to validate</p></>
              ) : (
                <><h3>Drop your CSV file here</h3><p>or <button type="button" className="inline-button" onClick={() => inputRef.current?.click()}>browse your computer</button></p></>
              )}
              <small>Required: recipient_name, recipient_email, account_number (10 digits), bank_code, amount, currency, transaction_reference (for example Salary Payment). A unique payment ID is still generated automatically.</small>
            </div>
            <div className="form-actions">
              {file && <button type="button" className="btn btn-ghost" onClick={resetUpload}>Clear</button>}
              <button className="btn btn-primary" type="submit" disabled={!file || isUploading}>
                {isUploading ? <><span className="spinner" />Validating file…</> : 'Upload & validate'}
              </button>
            </div>
          </form>
        </section>
      )}

      {preview && (
        <section className="panel preview-panel">
          <div className="panel-heading">
            <div><span className="panel-number">02</span><div><h2>Review and correct payments</h2><p>Edit any cell to fix errors without re-uploading the file.</p></div></div>
            <div className="preview-heading-actions">
              <button type="button" className="inline-button" onClick={resetUpload}>Upload a different file</button>
              <span className={`validation-result ${issues ? 'invalid' : 'valid'}`}>{issues ? `${issues} issue${issues === 1 ? '' : 's'}` : 'All rows valid'}</span>
            </div>
          </div>

          <div className="summary-grid">
            <div><span>Transactions</span><strong>{preview.rows.length.toLocaleString()}</strong></div>
            <div><span>Batch total</span><strong>{formatMoney(total, currency)}</strong></div>
            <div><span>Currency</span><strong>{currency}</strong></div>
            <div><span>Validation</span><strong className={issues ? 'danger-text' : 'success-text'}>{issues ? 'Needs attention' : 'Passed'}</strong></div>
          </div>

          <div className="batch-name-bar">
            <label>
              Batch name
              <input
                type="text"
                value={batchName}
                onChange={(event) => setBatchName(event.target.value)}
                placeholder="e.g. August vendor payouts"
                maxLength={80}
                autoComplete="off"
                disabled={Boolean(createdBatchId)}
                aria-required="true"
              />
            </label>
            <p className="muted-label">This name appears in batch history.</p>
          </div>

          {accountIssues > 0 && (
            <div className="alert alert-error account-alert" role="alert">
              <strong>{accountIssues} account number{accountIssues === 1 ? '' : 's'} need attention</strong>
              <span>Bank accounts must be exactly 10 digits. Correct the highlighted account fields below.</span>
            </div>
          )}

          {issues > 0 && (
            <div className="issue-list">
              {[...preview.rowErrors.map((item) => ({ key: `row-${item.row}-${item.fields.join('-')}-${item.message}`, row: item.row, label: item.row ? `Row ${item.row}` : 'File', message: item.message })),
                ...(preview.parseErrors || []).map((item, index) => ({ key: `parse-${index}`, row: item.row, label: item.row ? `Row ${item.row}` : 'CSV', message: item.message }))]
                .map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className="issue-item"
                    onClick={() => item.row ? document.getElementById(`preview-row-${item.row}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }) : undefined}
                  >
                    <strong>{item.label}</strong><span>{item.message}</span>
                  </button>
                ))}
            </div>
          )}

          <div className="table-wrap">
            <table className="preview-table">
              <thead><tr><th>Recipient</th><th>Account</th><th>Bank</th><th>Transaction reference</th><th className="right">Amount</th><th>Check</th></tr></thead>
              <tbody>
                {preview.rows.map((row, index) => {
                  const csvRow = index + 2
                  const hasError = invalidRows.has(csvRow)
                  const fieldErrors = fieldErrorsForRow(preview.rowErrors, csvRow)
                  const accountHint = accountNumberHint(row.account_number)
                  const accountInvalid = !accountHint.ok || Boolean(fieldErrors.account_number)
                  const accountHintText = !accountHint.ok ? accountHint.text : fieldErrors.account_number || accountHint.text
                  const locked = Boolean(createdBatchId)
                  return (
                    <tr key={index} id={`preview-row-${csvRow}`} className={hasError ? 'row-error' : ''}>
                      <td>
                        <div className="preview-name-cell">
                          <PreviewField
                            value={row.recipient_name}
                            onChange={(value) => updateRow(index, 'recipient_name', value)}
                            invalid={Boolean(fieldErrors.recipient_name)}
                            hint={fieldErrors.recipient_name}
                            placeholder="Recipient name"
                            disabled={locked}
                            ariaLabel={`Recipient name for row ${index + 1}`}
                          />
                          <PreviewField
                            value={row.recipient_email}
                            onChange={(value) => updateRow(index, 'recipient_email', value)}
                            invalid={Boolean(fieldErrors.recipient_email)}
                            hint={fieldErrors.recipient_email}
                            placeholder="email@example.com"
                            disabled={locked}
                            ariaLabel={`Recipient email for row ${index + 1}`}
                          />
                        </div>
                      </td>
                      <td>
                        <PreviewField
                          value={row.account_number}
                          onChange={(value) => updateRow(index, 'account_number', value)}
                          invalid={accountInvalid}
                          hint={accountHintText}
                          hintOk={!accountInvalid}
                          className="mono"
                          placeholder="10-digit account"
                          inputMode="numeric"
                          disabled={locked}
                          ariaLabel={`Account number for row ${index + 1}`}
                        />
                      </td>
                      <td>
                        <PreviewField
                          value={row.bank_code}
                          onChange={(value) => updateRow(index, 'bank_code', value)}
                          invalid={Boolean(fieldErrors.bank_code)}
                          hint={fieldErrors.bank_code}
                          placeholder="Bank code"
                          disabled={locked}
                          ariaLabel={`Bank code for row ${index + 1}`}
                        />
                      </td>
                      <td>
                        <PreviewField
                          value={row.transaction_reference}
                          onChange={(value) => updateRow(index, 'transaction_reference', value)}
                          invalid={Boolean(fieldErrors.transaction_reference)}
                          hint={fieldErrors.transaction_reference}
                          placeholder="e.g. Salary Payment"
                          disabled={locked}
                          ariaLabel={`Transaction reference for row ${index + 1}`}
                        />
                      </td>
                      <td className="right">
                        <PreviewField
                          value={row.amount}
                          onChange={(value) => updateRow(index, 'amount', value)}
                          invalid={Boolean(fieldErrors.amount)}
                          hint={fieldErrors.amount}
                          placeholder="0.00"
                          className="right"
                          disabled={locked}
                          ariaLabel={`Amount for row ${index + 1}`}
                        />
                      </td>
                      <td><span className={hasError ? 'row-check bad' : 'row-check'}>{hasError ? '!' : '✓'}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="create-footer">
            <p className="muted-label">Your operator identity is recorded automatically.</p>
            <button className="btn btn-primary btn-large" onClick={createBatch} disabled={Boolean(issues) || isCreating || Boolean(createdBatchId) || batchName.trim().length < 2}>
              {isCreating ? <><span className="spinner" />Creating batch…</> : createdBatchId ? 'Batch created' : 'Create payment batch'}
            </button>
          </div>
        </section>
      )}
    </Layout>
  )
}

type PreviewFieldProps = {
  value: string
  onChange: (value: string) => void
  invalid?: boolean
  hint?: string
  hintOk?: boolean
  placeholder?: string
  className?: string
  inputMode?: 'numeric' | 'text'
  disabled?: boolean
  ariaLabel: string
}

function PreviewField({
  value,
  onChange,
  invalid,
  hint,
  hintOk,
  placeholder,
  className,
  inputMode,
  disabled,
  ariaLabel,
}: PreviewFieldProps) {
  return (
    <label className="preview-field">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`preview-input ${invalid ? 'invalid' : ''} ${className || ''}`}
        inputMode={inputMode}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={invalid}
      />
      {hint && <small className={`field-hint ${hintOk ? 'ok' : 'bad'}`}>{hint}</small>}
    </label>
  )
}
