import formidable, { File } from 'formidable'
import { promises as fs } from 'fs'
import type { NextApiRequest, NextApiResponse } from 'next'
import { hasTrustedOrigin, requestSession } from '../../lib/session'

export const config = { api: { bodyParser: false } }

function firstFile(value: File | File[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }
  const session = requestSession(req)
  if (!session) return res.status(401).json({ message: 'Your session has expired. Please sign in again.' })
  if (!hasTrustedOrigin(req)) return res.status(403).json({ message: 'Untrusted request origin.' })

  const form = formidable({
    maxFiles: 1,
    maxFileSize: 5 * 1024 * 1024,
    filter: ({ originalFilename, mimetype }) =>
      Boolean(originalFilename?.toLowerCase().endsWith('.csv') || mimetype === 'text/csv'),
  })

  try {
    const [, files] = await form.parse(req)
    const file = firstFile(files.file)
    if (!file) return res.status(400).json({ message: 'Choose a valid CSV file.' })

    const buffer = await fs.readFile(file.filepath)
    const data = new FormData()
    data.append('file', new Blob([new Uint8Array(buffer)], { type: file.mimetype || 'text/csv' }), file.originalFilename || 'payments.csv')

    const headers: Record<string, string> = {}
    if (!process.env.INTERNAL_API_TOKEN || process.env.INTERNAL_API_TOKEN.length < 32) {
      return res.status(503).json({ message: 'The internal API connection is not securely configured.' })
    }
    headers['X-Admin-Token'] = process.env.INTERNAL_API_TOKEN
    headers['X-Admin-Actor'] = session.email
    headers['X-Admin-Role'] = session.role
    const upstream = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3000'}/files/upload`, {
      method: 'POST',
      headers,
      body: data,
      signal: AbortSignal.timeout(30_000),
    })
    const contentType = upstream.headers.get('content-type') || ''
    const response = contentType.includes('application/json') ? await upstream.json() : { message: await upstream.text() }
    return res.status(upstream.status).json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The upload could not be processed.'
    const parserStatus = Number((error as { httpCode?: number }).httpCode)
    if (parserStatus >= 400 && parserStatus < 500) return res.status(parserStatus).json({ message })
    if (message.toLowerCase().includes('maxfilesize')) return res.status(413).json({ message: 'The CSV exceeds the 5 MB upload limit.' })
    console.error('Upload proxy error', error)
    return res.status(503).json({ message: 'The backend service is unavailable. Start the API, PostgreSQL, and Redis, then try again.' })
  }
}
