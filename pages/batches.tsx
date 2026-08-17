import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import { api, batchDisplayName, errorMessage, formatDate, formatMoney } from '../lib/api'
import type { Batch } from '../lib/types'
import { requireAdminPage } from '../lib/session'

export const getServerSideProps = requireAdminPage

const PAGE_SIZE = 10

export default function Batches() {
  const router = useRouter()
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  async function fetchBatches(isRefresh = false) {
    isRefresh ? setRefreshing(true) : setLoading(true)
    setError('')
    try {
      const response = await api.get<Batch[]>('/batches')
      setBatches(response.data)
    } catch (fetchError) {
      setError(errorMessage(fetchError, 'Batches could not be loaded.'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchBatches() }, [])

  const metrics = useMemo(() => {
    const transactions = batches.flatMap((batch) => batch.transactions || [])
    return {
      total: batches.length,
      processing: batches.filter((batch) => batch.status === 'processing').length,
      successful: transactions.filter((transaction) => transaction.status === 'succeeded').length,
      attention: transactions.filter((transaction) => ['failed', 'pending_review'].includes(transaction.status)).length,
      volume: batches.reduce((total, batch) => total + Number(batch.totalAmount || 0), 0),
      transactions: transactions.length,
    }
  }, [batches])

  const query = typeof router.query.q === 'string' ? router.query.q.trim().toLowerCase() : ''
  const filteredBatches = useMemo(() => {
    if (!query) return batches
    return batches.filter((batch) => [
      batch.id,
      batch.name,
      batch.uploadedBy,
    ].some((value) => value?.toLowerCase().includes(query)))
  }, [batches, query])
  useEffect(() => { setPage(1) }, [query])

  const pageCount = Math.max(1, Math.ceil(filteredBatches.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pagedBatches = filteredBatches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const rangeStart = filteredBatches.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredBatches.length)
  const primaryCurrency = batches[0]?.transactions?.[0]?.currency || 'NGN'

  return (
    <Layout>
      {error && <div className="alert alert-error" role="alert"><strong>Could not load batches</strong><span>{error}</span><button className="btn btn-small" onClick={() => fetchBatches()}>Retry</button></div>}

      <div className="dashboard-content-grid">
        <div className="dashboard-primary">
          <p className="period-label">In the last 30 days,</p>
          <div className="metric-grid figma-metrics">
            <div className="metric-card figma-stat tone-olive"><div><strong>{metrics.total.toLocaleString()}</strong><span>Payment batches</span></div><i /><b /></div>
            <div className="metric-card figma-stat tone-sage"><div><strong>{metrics.successful.toLocaleString()}</strong><span>Successful payouts</span></div><i /><b /></div>
            <div className="metric-card figma-stat tone-forest"><div><strong>{formatMoney(metrics.volume, primaryCurrency)}</strong><span>Total batch value</span></div><i /><b /></div>
          </div>

          <section className="panel batch-list-panel">
          <div className="panel-heading compact">
            <div><div><h2>{query ? 'Search results' : 'All payment batches'}</h2><p>{query ? `${filteredBatches.length} match${filteredBatches.length === 1 ? '' : 'es'} for “${query}”` : 'Most recently uploaded first · 10 per page'}</p></div></div>
            <button className="btn btn-ghost btn-small" onClick={() => fetchBatches(true)} disabled={refreshing}>{refreshing ? 'Refreshing…' : 'Refresh'}</button>
          </div>

          {loading ? (
            <div className="skeleton-list" aria-label="Loading batches">{[1, 2, 3].map((item) => <div key={item}><i /><span /><b /></div>)}</div>
          ) : batches.length === 0 && !error ? (
            <div className="empty-state"><span>▦</span><h3>No payment batches yet</h3><p>Upload your first CSV to start a controlled disbursement run.</p><Link href="/" className="btn btn-primary">Create first batch</Link></div>
          ) : filteredBatches.length === 0 ? (
            <div className="empty-state compact-empty"><span>⌕</span><h3>No matching batches</h3><p>Try a batch name, ID, or operator email.</p><Link href="/batches" className="btn btn-ghost">Clear search</Link></div>
          ) : (
            <>
            <div className="table-wrap">
              <table className="batch-table">
                <thead><tr><th>Batch</th><th>Created</th><th>Transactions</th><th className="right">Total</th><th>Status</th><th aria-label="Actions" /></tr></thead>
                <tbody>
                  {pagedBatches.map((batch) => {
                    const currency = batch.transactions?.[0]?.currency || 'NGN'
                    return (
                      <tr key={batch.id}>
                        <td><Link href={`/batch/${batch.id}`} className="batch-name">{batchDisplayName(batch)}</Link><small>{batch.uploadedBy}</small></td>
                        <td>{formatDate(batch.createdAt)}</td>
                        <td><strong>{(batch.transactions?.length || 0).toLocaleString()}</strong> payments</td>
                        <td className="right"><strong>{formatMoney(batch.totalAmount, currency)}</strong></td>
                        <td><StatusBadge status={batch.status} /></td>
                        <td className="right"><Link href={`/batch/${batch.id}`} className="row-link" aria-label={`View batch ${batch.id}`}>→</Link></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filteredBatches.length > PAGE_SIZE && (
              <div className="table-pagination" aria-label="Batch list pages">
                <span>Showing {rangeStart}–{rangeEnd} of {filteredBatches.length}</span>
                <div>
                  <button type="button" className="btn btn-ghost btn-small" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>Previous</button>
                  {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      className={`page-number${pageNumber === currentPage ? ' active' : ''}`}
                      onClick={() => setPage(pageNumber)}
                      aria-current={pageNumber === currentPage ? 'page' : undefined}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button type="button" className="btn btn-ghost btn-small" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= pageCount}>Next</button>
                </div>
              </div>
            )}
            </>
          )}
          </section>
        </div>

        <aside className="insights-rail">
          <section className="insight-card">
            <div className="insight-heading"><h2>Recent batches</h2><Link href="/batches">View all</Link></div>
            <div className="insight-list">
              {batches.slice(0, 4).map((batch, index) => (
                <Link href={`/batch/${batch.id}`} key={batch.id} className="insight-row">
                  <span className={`insight-avatar avatar-${index % 3}`}>{String(index + 1).padStart(2, '0')}</span>
                  <p><strong>{batchDisplayName(batch)}</strong><small>{batch.transactions.length} payments</small></p>
                  <StatusBadge status={batch.status} />
                </Link>
              ))}
              {!batches.length && <p className="insight-empty">Recent batches will appear here.</p>}
            </div>
          </section>
          <section className="insight-card">
            <div className="insight-heading"><h2>Payout health</h2></div>
            <div className="health-list">
              <div><span><i className="health-dot success" />Successful</span><strong>{metrics.successful}</strong></div>
              <div><span><i className="health-dot processing" />In progress</span><strong>{metrics.processing}</strong></div>
              <div><span><i className="health-dot failed" />Needs attention</span><strong>{metrics.attention}</strong></div>
            </div>
            <div className="health-total"><span>Transactions tracked</span><strong>{metrics.transactions.toLocaleString()}</strong></div>
          </section>
          <div className="dashboard-date"><span>{new Intl.DateTimeFormat('en', { day: '2-digit' }).format(new Date())}</span><span>{new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date())}</span><strong>{new Intl.DateTimeFormat('en', { year: 'numeric' }).format(new Date())}</strong></div>
        </aside>
      </div>
    </Layout>
  )
}
