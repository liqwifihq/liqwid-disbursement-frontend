import { createHmac, scrypt as scryptCallback, timingSafeEqual } from 'crypto'
import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next'
import { promisify } from 'util'

export const SESSION_COOKIE = process.env.NODE_ENV === 'production' ? '__Host-liqwifi_admin_session' : 'liqwifi_admin_session'
const SESSION_DURATION_SECONDS = 60 * 60
const scrypt = promisify(scryptCallback)

export type AdminRole = 'maker' | 'approver' | 'admin'
type SessionPayload = { email: string; role: AdminRole; exp: number }

function authSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not configured.')
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('AUTH_SECRET must be at least 32 characters in production.')
  }
  return secret
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

function sign(encodedPayload: string) {
  return createHmac('sha256', authSecret()).update(encodedPayload).digest('base64url')
}

export function createSession(email: string, role: AdminRole) {
  const payload: SessionPayload = {
    email,
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encoded}.${sign(encoded)}`
}

export function verifySession(token?: string): SessionPayload | null {
  if (!token) return null
  try {
    const [encoded, signature] = token.split('.')
    if (!encoded || !signature || !safeEqual(sign(encoded), signature)) return null
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload
    if (!payload.email || !['maker', 'approver', 'admin'].includes(payload.role) || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

function cookieValue(header?: string, name = SESSION_COOKIE) {
  const cookie = header?.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : undefined
}

export function requestSession(req: NextApiRequest) {
  return verifySession(cookieValue(req.headers.cookie))
}

export function setSessionCookie(res: NextApiResponse, token: string) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DURATION_SECONDS}${secure}`)
}

export function clearSessionCookie(res: NextApiResponse) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`)
}

export async function verifyAdminCredentials(email: string, password: string) {
  const configuredUsers = process.env.ADMIN_USERS_JSON
  if (configuredUsers) {
    let users: Array<{ email?: string; role?: AdminRole; passwordHash?: string }>
    try {
      users = JSON.parse(configuredUsers)
    } catch {
      throw new Error('ADMIN_USERS_JSON must be valid JSON.')
    }
    if (!Array.isArray(users) || !users.length) throw new Error('ADMIN_USERS_JSON must contain at least one user.')
    const user = users.find((item) => typeof item.email === 'string' && safeEqual(email.trim().toLowerCase(), item.email.trim().toLowerCase()))
    if (!user) return null
    if (!user.role || !['maker', 'approver', 'admin'].includes(user.role)) throw new Error('An admin user has an invalid role.')
    if (!user.passwordHash) throw new Error('Every configured admin user must use a passwordHash.')
    const [scheme, salt, expectedHash] = user.passwordHash.split('$')
    if (scheme !== 'scrypt' || !salt || !expectedHash) throw new Error('An admin passwordHash has an invalid format.')
    const derived = (await scrypt(password, salt, 64)) as Buffer
    return safeEqual(derived.toString('hex'), expectedHash)
      ? { email: user.email!.trim().toLowerCase(), role: user.role }
      : null
  }

  const expectedEmail = process.env.ADMIN_EMAIL
  if (!expectedEmail) throw new Error('ADMIN_EMAIL is not configured.')
  if (!safeEqual(email.trim().toLowerCase(), expectedEmail.trim().toLowerCase())) return null

  const passwordHash = process.env.ADMIN_PASSWORD_HASH
  if (passwordHash) {
    const [scheme, salt, expectedHash] = passwordHash.split('$')
    if (scheme !== 'scrypt' || !salt || !expectedHash) throw new Error('ADMIN_PASSWORD_HASH has an invalid format.')
    const derived = (await scrypt(password, salt, 64)) as Buffer
    return safeEqual(derived.toString('hex'), expectedHash)
      ? { email: expectedEmail.trim().toLowerCase(), role: 'admin' as const }
      : null
  }

  const expectedPassword = process.env.ADMIN_PASSWORD
  if (!expectedPassword) throw new Error('ADMIN_PASSWORD or ADMIN_PASSWORD_HASH is not configured.')
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Plaintext ADMIN_PASSWORD is disabled in production. Configure ADMIN_PASSWORD_HASH or ADMIN_USERS_JSON.')
  }
  return safeEqual(password, expectedPassword)
    ? { email: expectedEmail.trim().toLowerCase(), role: 'admin' as const }
    : null
}

export function hasTrustedOrigin(req: NextApiRequest) {
  const origin = String(req.headers.origin || '')
  if (!origin) return process.env.NODE_ENV !== 'production'
  const configuredOrigin = process.env.APP_ORIGIN
  if (configuredOrigin) return origin === configuredOrigin.replace(/\/$/, '')
  const protocol = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim()
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim()
  return Boolean(host) && origin === `${protocol}://${host}`
}

export async function requireAdminPage(context: GetServerSidePropsContext) {
  const session = verifySession(cookieValue(context.req.headers.cookie))
  if (!session) {
    const returnTo = encodeURIComponent(context.resolvedUrl || '/')
    return { redirect: { destination: `/login?returnTo=${returnTo}`, permanent: false } }
  }
  return { props: {} }
}
