import type { NextApiRequest, NextApiResponse } from 'next'
import { hasTrustedOrigin, requestSession } from '../../../lib/session'

export const config = { api: { bodyParser: { sizeLimit: '6mb' } } }

const ALLOWED_ROUTES = [
  /^batches(?:\/[a-f\d-]+(?:\/(?:approve|disburse))?)?$/i,
  /^files\/create-batch$/,
  /^reconcile\/batch$/,
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requestSession(req)
  if (!session) return res.status(401).json({ message: 'Your session has expired. Please sign in again.' })

  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path || '')
  if (!ALLOWED_ROUTES.some((route) => route.test(path))) return res.status(404).json({ message: 'API route not found.' })
  if (!['GET', 'POST'].includes(req.method || '')) return res.status(405).json({ message: 'Method not allowed.' })
  if (req.method === 'POST' && !hasTrustedOrigin(req)) return res.status(403).json({ message: 'Untrusted request origin.' })

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (!process.env.INTERNAL_API_TOKEN || process.env.INTERNAL_API_TOKEN.length < 32) {
      return res.status(503).json({ message: 'The internal API connection is not securely configured.' })
    }
    headers['X-Admin-Token'] = process.env.INTERNAL_API_TOKEN
    headers['X-Admin-Actor'] = session.email
    headers['X-Admin-Role'] = session.role
    const upstream = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3000'}/${path}`, {
      method: req.method,
      headers,
      body: req.method === 'GET' ? undefined : JSON.stringify(req.body || {}),
      signal: AbortSignal.timeout(30_000),
    })
    const contentType = upstream.headers.get('content-type') || ''
    const data = contentType.includes('application/json') ? await upstream.json() : { message: await upstream.text() }
    return res.status(upstream.status).json(data)
  } catch (error) {
    console.error('Backend proxy error', error)
    return res.status(503).json({ message: 'The backend service is unavailable. Start the API, PostgreSQL, and Redis, then try again.' })
  }
}
