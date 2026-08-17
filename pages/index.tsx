import axios from 'axios'
import Link from 'next/link'
import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import Layout from '../components/Layout'
import { api, errorMessage, formatMoney } from '../lib/api'
import type { Preview } from '../lib/types'
import { requireAdminPage } from '../lib/session'

export const getServerSideProps = requireAdminPage

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
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
      setPreview(response.data)
      const uploadIssues = response.data.rowErrors.length + (response.data.parseErrors?.length || 0)
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
    setIsCreating(true)
    setError('')
    try {
      const response = await api.post<{ batchId: string }>('/files/create-batch', {
        rows: preview.rows,
      })
      setCreatedBatchId(response.data.batchId)
    } catch (createError) {
      setError(errorMessage(createError, 'The batch could not be created.'))
    } finally {
      setIsCreating(false)
    }
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
      description="Upload a validated CSV, review every payment, then create a batch ready for approval."
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
            <small>Required: recipient_name, recipient_email, account_number, bank_code, amount, currency. Payment references are generated automatically.</small>
          </div>
          <div className="form-actions">
            {file && <button type="button" className="btn btn-ghost" onClick={() => { setFile(null); setPreview(null); if (inputRef.current) inputRef.current.value = '' }}>Clear</button>}
            <button className="btn btn-primary" type="submit" disabled={!file || isUploading}>
              {isUploading ? <><span className="spinner" />Validating file…</> : 'Upload & validate'}
            </button>
          </div>
        </form>
      </section>

      {preview && (
        <section className="panel preview-panel">
          <div className="panel-heading">
            <div><span className="panel-number">02</span><div><h2>Review payments</h2><p>Check the summary and resolve any highlighted rows.</p></div></div>
            <span className={`validation-result ${issues ? 'invalid' : 'valid'}`}>{issues ? `${issues} issue${issues === 1 ? '' : 's'}` : 'All rows valid'}</span>
          </div>

          <div className="summary-grid">
            <div><span>Transactions</span><strong>{preview.rows.length.toLocaleString()}</strong></div>
            <div><span>Batch total</span><strong>{formatMoney(total, currency)}</strong></div>
            <div><span>Currency</span><strong>{currency}</strong></div>
            <div><span>Validation</span><strong className={issues ? 'danger-text' : 'success-text'}>{issues ? 'Needs attention' : 'Passed'}</strong></div>
          </div>

          {issues > 0 && (
            <div className="issue-list">
              {[...preview.rowErrors.map((item) => ({ key: `row-${item.row}-${item.message}`, label: item.row ? `Row ${item.row}` : 'File', message: item.message })),
                ...(preview.parseErrors || []).map((item, index) => ({ key: `parse-${index}`, label: item.row ? `Row ${item.row}` : 'CSV', message: item.message }))]
                .map((item) => <div key={item.key}><strong>{item.label}</strong><span>{item.message}</span></div>)}
            </div>
          )}

          <div className="table-wrap">
            <table>
              <thead><tr><th>Recipient</th><th>Account</th><th>Bank</th><th>Reference</th><th className="right">Amount</th><th>Check</th></tr></thead>
              <tbody>
                {preview.rows.slice(0, 250).map((row, index) => {
                  const hasError = invalidRows.has(index + 2)
                  return (
                    <tr key={`${row.bank_code}-${row.account_number}-${index}`} className={hasError ? 'row-error' : ''}>
                      <td><strong>{row.recipient_name || 'Missing name'}</strong><small className="table-subtext">{row.recipient_email}</small></td>
                      <td className="mono">{row.account_number}</td>
                      <td>{row.bank_code}</td>
                      <td className="muted-label">Generated automatically</td>
                      <td className="right"><strong>{formatMoney(row.amount, row.currency)}</strong></td>
                      <td><span className={hasError ? 'row-check bad' : 'row-check'}>{hasError ? '!' : '✓'}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {preview.rows.length > 250 && <p className="table-note">Showing the first 250 of {preview.rows.length.toLocaleString()} payments.</p>}

          <div className="create-footer">
            <p className="muted-label">Your authenticated operator identity will be recorded automatically.</p>
            <button className="btn btn-primary btn-large" onClick={createBatch} disabled={Boolean(issues) || isCreating || Boolean(createdBatchId)}>
              {isCreating ? <><span className="spinner" />Creating batch…</> : createdBatchId ? 'Batch created' : 'Create payment batch'}
            </button>
          </div>
        </section>
      )}
    </Layout>
  )
}
