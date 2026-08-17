import type { NextApiRequest, NextApiResponse } from 'next'
import { clearSessionCookie, hasTrustedOrigin } from '../../../lib/session'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }
  if (!hasTrustedOrigin(req)) return res.status(403).json({ message: 'Untrusted request origin.' })
  clearSessionCookie(res)
  return res.status(200).json({ ok: true })
}
