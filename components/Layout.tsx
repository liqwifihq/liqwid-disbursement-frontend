import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  eyebrow?: string
  title?: string
  description?: string
  actions?: ReactNode
}

const NAV_COLLAPSED_KEY = 'liqwifi-sidebar-collapsed'

function NavIcon({ name }: { name: 'overview' | 'batch' | 'banks' | 'settings' | 'logout' | 'collapse' | 'expand' }) {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    batch: <><path d="M6 3h12v4H6zM5 9h14v12H5z" /><path d="M9 13h6M9 17h4" /></>,
    banks: <><rect x="3" y="10" width="18" height="11" rx="1" /><path d="M7 10V7a5 5 0 0 1 10 0v3M8 14v3M12 14v3M16 14v3" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" /></>,
    collapse: <><path d="M15 6 9 12l6 6" /></>,
    expand: <><path d="M9 6l6 6-6 6" /></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

export default function Layout({ children, eyebrow, title, description, actions }: Props) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(NAV_COLLAPSED_KEY) === '1')
    } catch {
      /* ignore storage access */
    }
  }, [])

  function toggleNav() {
    setCollapsed((current) => {
      const next = !current
      try {
        window.localStorage.setItem(NAV_COLLAPSED_KEY, next ? '1' : '0')
      } catch {
        /* ignore storage access */
      }
      return next
    })
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.assign('/login')
  }

  return (
    <div className={`app-shell figma-shell${collapsed ? ' nav-collapsed' : ''}`}>
      <aside className="side-nav" id="app-side-nav">
        <Link href="/batches" className="brand" aria-label="LiqWiFi PayOps overview">
          <img
            className="brand-logo"
            src={collapsed ? '/Images/Liqwifi_Icon_Circle_Full_DarkM.png' : '/Images/Liqwifi_CombMark_Midnight_Sub.png'}
            alt=""
          />
        </Link>
        <button
          type="button"
          className="nav-toggle"
          onClick={toggleNav}
          aria-controls="app-side-nav"
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <NavIcon name={collapsed ? 'expand' : 'collapse'} />
        </button>
        <nav className="main-nav" aria-label="Primary navigation">
          <Link href="/batches" className={router.pathname.startsWith('/batch') ? 'active' : ''} title="Overview"><NavIcon name="overview" /><span>Overview</span></Link>
          <Link href="/" className={router.pathname === '/' ? 'active' : ''} title="New batch"><NavIcon name="batch" /><span>New batch</span></Link>
          <Link href="/banks" className={router.pathname === '/banks' ? 'active' : ''} title="Bank codes"><NavIcon name="banks" /><span>Bank codes</span></Link>
        </nav>
        <div className="side-nav-footer">
          <button type="button" className="sidebar-action" title="Settings"><NavIcon name="settings" /><span>Settings</span></button>
          <button type="button" className="sidebar-action logout-action" onClick={logout} title="Logout"><NavIcon name="logout" /><span>Logout</span></button>
        </div>
      </aside>

      <div className="app-workspace">
        <header className="topbar">
          <form className="global-search" action="/batches" method="get">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>
            <input name="q" defaultValue={typeof router.query.q === 'string' ? router.query.q : ''} placeholder="Search batch names, references" aria-label="Search batches" />
          </form>
          <div className="topbar-account">
            <button className="notification-button" type="button" aria-label="Notifications"><span /></button>
            <div className="operator"><span>AO</span><div><strong>Admin operator</strong><small>Finance operations</small></div></div>
          </div>
        </header>

        <main className="page-shell">
          {(eyebrow || title || description || actions) && <section className="page-heading">
            <div>
              {eyebrow && <p className="eyebrow">{eyebrow}</p>}
              {title && <h1>{title}</h1>}
              {description && <p className="page-description">{description}</p>}
            </div>
            {actions && <div className="heading-actions">{actions}</div>}
          </section>}
          {children}
        </main>
        <footer><span>LIQWIFI FINANCE OPERATIONS</span><span>Secure disbursement workspace</span></footer>
      </div>
    </div>
  )
}
