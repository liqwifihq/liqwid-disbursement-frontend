import type { NextApiRequest, NextApiResponse } from 'next'
import { createSession, hasTrustedOrigin, setSessionCookie, verifyAdminCredentials } from '../../../lib/session'

const attempts = new Map<string, { count: number; resetAt: number }>()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }
  if (!hasTrustedOrigin(req)) return res.status(403).json({ message: 'Untrusted request origin.' })

  const forwarded = process.env.TRUST_PROXY === 'true' ? req.headers['x-forwarded-for'] : undefined
  const client = String(forwarded || req.socket.remoteAddress || 'unknown').split(',')[0].trim()
  const now = Date.now()
  const current = attempts.get(client)
  if (current && current.resetAt > now && current.count >= 5) {
    res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000))
    return res.status(429).json({ message: 'Too many login attempts. Try again in 15 minutes.' })
  }

  const email = typeof req.body?.email === 'string' ? req.body.email : ''
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' })

  try {
    const identity = await verifyAdminCredentials(email, password)
    if (!identity) {
      const nextAttempt = current && current.resetAt > now
        ? { count: current.count + 1, resetAt: current.resetAt }
        : { count: 1, resetAt: now + 15 * 60 * 1000 }
      attempts.set(client, nextAttempt)
      return res.status(401).json({ message: 'The email or password is incorrect.' })
    }

    attempts.delete(client)
    setSessionCookie(res, createSession(identity.email, identity.role))
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Admin login configuration error', error)
    return res.status(503).json({ message: 'Admin login is not configured. Check the frontend environment variables.' })
  }
}
