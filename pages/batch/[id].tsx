import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import ConfirmModal from '../../components/ConfirmModal'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import { api, batchDisplayName, errorMessage, formatDate, formatMoney } from '../../lib/api'
import type { Batch } from '../../lib/types'
import { requireAdminPage } from '../../lib/session'

export const getServerSideProps = requireAdminPage

export default function BatchPage() {
  const router = useRouter()
  const id = typeof router.query.id === 'string' ? router.query.id : ''
  const [batch, setBatch] = useState<Batch | null>(null)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState<'approve' | 'disburse' | ''>('')
  const [confirmKind, setConfirmKind] = useState<'approve' | 'disburse' | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const fetchBatch = useCallback(async (quiet = false) => {
    if (!id) return
    if (!quiet) setLoading(true)
    try {
      const response = await api.get<Batch>(`/batches/${id}`)
      setBatch(response.data)
      setError('')
    } catch (fetchError) {
      setError(errorMessage(fetchError, 'The batch could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchBatch() }, [fetchBatch])
  useEffect(() => {
    if (batch?.status !== 'processing') return
    const timer = window.setInterval(() => fetchBatch(true), 5_000)
    return () => window.clearInterval(timer)
  }, [batch?.status, fetchBatch])

  const metrics = useMemo(() => {
    const transactions = batch?.transactions || []
    return {
      pending: transactions.filter((item) => item.status === 'pending').length,
      processing: transactions.filter((item) => ['processing', 'pending_review'].includes(item.status)).length,
      succeeded: transactions.filter((item) => item.status === 'succeeded').length,
      failed: transactions.filter((item) => item.status === 'failed').length,
    }
  }, [batch])

  async function approve() {
    if (!batch) return
    setConfirmKind(null)
    setAction('approve'); setError(''); setNotice('')
    try {
      await api.post(`/batches/${id}/approve`)
      setNotice('Batch approved for disbursement.')
      await fetchBatch(true)
    } catch (actionError) {
      setError(errorMessage(actionError, 'The batch could not be approved.'))
    } finally { setAction('') }
  }

  async function disburse() {
    if (!batch || !metrics.pending) return
    setConfirmKind(null)
    setAction('disburse'); setError(''); setNotice('')
    try {
      const response = await api.post<{ enqueued: number }>(`/batches/${id}/disburse`)
      setNotice(`${response.data.enqueued} payment${response.data.enqueued === 1 ? '' : 's'} queued successfully.`)
      await fetchBatch(true)
    } catch (actionError) {
      setError(errorMessage(actionError, 'Payments could not be queued.'))
    } finally { setAction('') }
  }

  if (loading && !batch) {
    return <Layout eyebrow="Disbursements / Batch" title="Loading batch…"><div className="detail-skeleton"><i /><i /><i /></div></Layout>
  }

  if (!batch) {
    return <Layout eyebrow="Disbursements / Batch" title="Batch unavailable"><div className="alert alert-error"><strong>We could not open this batch</strong><span>{error}</span><Link href="/batches" className="btn btn-small">Back to batches</Link></div></Layout>
  }

  const currency = batch.transactions[0]?.currency || 'NGN'

  return (
    <Layout
      eyebrow="Disbursements / Batch detail"
      title={batchDisplayName(batch)}
      description={`Created ${formatDate(batch.createdAt)} by ${batch.uploadedBy}`}
      actions={<>
        {batch.status === 'ready' && <button className="btn btn-primary" onClick={() => setConfirmKind('approve')} disabled={Boolean(action)}>{action === 'approve' ? 'Approving…' : 'Approve batch'}</button>}
        {batch.status === 'approved' && <button className="btn btn-primary" onClick={() => setConfirmKind('disburse')} disabled={!metrics.pending || Boolean(action)}>{action === 'disburse' ? 'Queuing…' : `Disburse pending (${metrics.pending})`}</button>}
      </>}
    >
      <Link href="/batches" className="back-link">← Back to batches</Link>
      {error && <div className="alert alert-error"><strong>Action failed</strong><span>{error}</span></div>}
      {notice && <div className="alert alert-success"><strong>Update complete</strong><span>{notice}</span></div>}

      <section className="batch-hero">
        <div><span>Batch total</span><strong>{formatMoney(batch.totalAmount, currency)}</strong><small>{batch.transactions.length.toLocaleString()} payments · {currency}</small></div>
        <div className="batch-status-block"><span>Batch status</span><StatusBadge status={batch.status} /><small>{batch.approvedBy ? `Approved by ${batch.approvedBy}` : `Last updated ${formatDate(batch.updatedAt)}`}</small></div>
        <div className="batch-id-block"><span>Batch ID</span><strong className="mono">{batch.id}</strong><button onClick={() => navigator.clipboard?.writeText(batch.id)}>Copy ID</button></div>
      </section>

      <div className="transaction-metrics">
        <div><span className="dot pending" /><p><span>Pending</span><strong>{metrics.pending}</strong></p></div>
        <div><span className="dot processing" /><p><span>Processing / review</span><strong>{metrics.processing}</strong></p></div>
        <div><span className="dot success" /><p><span>Succeeded</span><strong>{metrics.succeeded}</strong></p></div>
        <div><span className="dot failed" /><p><span>Failed</span><strong>{metrics.failed}</strong></p></div>
      </div>

      <section className="panel transaction-panel">
        <div className="panel-heading compact"><div><div><h2>Transactions</h2><p>Individual payout status and destination details</p></div></div><span className="muted-label">Auto-refreshes while processing</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Recipient</th><th>Account</th><th>Bank</th><th>Reference</th><th className="right">Amount</th><th>Status</th></tr></thead>
            <tbody>
              {batch.transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td><strong>{transaction.recipientName || '—'}</strong>{transaction.recipientEmail && <small className="table-subtext">{transaction.recipientEmail}</small>}</td>
                  <td className="mono">{transaction.accountNumber || '—'}</td>
                  <td>{transaction.bankCode || '—'}</td>
                  <td className="mono">{transaction.reference || '—'}</td>
                  <td className="right"><strong>{formatMoney(transaction.amount || 0, transaction.currency)}</strong></td>
                  <td><StatusBadge status={transaction.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {confirmKind === 'approve' && (
        <ConfirmModal
          title="Approve batch"
          message="Approve this batch for payment?"
          confirmLabel="Approve batch"
          onCancel={() => setConfirmKind(null)}
          onConfirm={approve}
        />
      )}
      {confirmKind === 'disburse' && (
        <ConfirmModal
          title="Disburse payments"
          message={`Disburse ${metrics.pending} pending payment${metrics.pending === 1 ? '' : 's'}?`}
          confirmLabel="Disburse"
          onCancel={() => setConfirmKind(null)}
          onConfirm={disburse}
        />
      )}
    </Layout>
  )
}
