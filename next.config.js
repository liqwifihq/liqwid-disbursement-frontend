const isDev = process.env.NODE_ENV === 'development'
const csp = `default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'; img-src 'self' blob: data:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}; connect-src 'self'${isDev ? ' ws: wss:' : ''};${isDev ? '' : ' upgrade-insecure-requests;'}`

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  {
    key: 'Content-Security-Policy',
    value: csp,
  },
  ...(!isDev ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
]

module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { useTypeScriptCli: false },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
};
