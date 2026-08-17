import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { BANKS } from '../lib/banks'
import { requireAdminPage } from '../lib/session'

export const getServerSideProps = requireAdminPage

export default function BanksPage() {
  const [query, setQuery] = useState('')
  const [copiedCode, setCopiedCode] = useState('')

  const filteredBanks = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return BANKS
    return BANKS.filter((bank) => bank.name.toLowerCase().includes(term) || bank.code.toLowerCase().includes(term))
  }, [query])

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      window.setTimeout(() => setCopiedCode((current) => (current === code ? '' : current)), 1600)
    } catch {
      setCopiedCode('')
    }
  }

  return (
    <Layout
      eyebrow="Reference / Bank codes"
      title="Bank codes"
      description="Search by bank name or code. Use the matching code in your disbursement CSV."
    >
      <section className="panel bank-list-panel">
        <div className="panel-heading compact">
          <div>
            <div>
              <h2>{query.trim() ? 'Search results' : 'All banks'}</h2>
              <p>
                {query.trim()
                  ? `${filteredBanks.length} match${filteredBanks.length === 1 ? '' : 'es'} for “${query.trim()}”`
                  : `${BANKS.length} banks · click a code to copy`}
              </p>
            </div>
          </div>
          <label className="bank-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search bank name or code"
              aria-label="Search bank name or code"
              autoComplete="off"
            />
          </label>
        </div>

        {filteredBanks.length === 0 ? (
          <div className="empty-state compact-empty">
            <span>⌕</span>
            <h3>No matching banks</h3>
            <p>Try a bank name such as GTBank, or a code such as 058.</p>
            <button type="button" className="btn btn-ghost" onClick={() => setQuery('')}>Clear search</button>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="bank-table">
              <thead>
                <tr>
                  <th>Bank name</th>
                  <th>Bank code</th>
                </tr>
              </thead>
              <tbody>
                {filteredBanks.map((bank) => (
                  <tr key={`${bank.code}-${bank.name}`}>
                    <td><strong>{bank.name}</strong></td>
                    <td>
                      <button
                        type="button"
                        className="bank-code-copy"
                        onClick={() => copyCode(bank.code)}
                        title="Copy bank code"
                      >
                        <span className="mono">{bank.code}</span>
                        <small>{copiedCode === bank.code ? 'Copied' : 'Copy'}</small>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Layout>
  )
}
