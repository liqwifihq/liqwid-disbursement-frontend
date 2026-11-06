import Head from 'next/head'
import Link from 'next/link'

const PAYOUTS = [
  { initials: 'AN', name: 'Amara N.', method: 'Bank transfer', amount: '₦50,000.00', status: 'Paid' },
  { initials: 'TA', name: 'Tunde A.', method: 'Mobile wallet', amount: '₦75,000.00', status: 'Paid' },
  { initials: 'ZM', name: 'Zainab M.', method: 'Cash pickup', amount: '₦35,000.00', status: 'Ready for pickup' },
]

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Fund your balance',
    body: 'Top up your Liqwifi balance by bank transfer, or link an account to refill it automatically.',
  },
  {
    step: '2',
    title: 'Add your recipients',
    body: 'Upload a CSV, connect the tool you already use, or call the API. We check every account before money moves.',
  },
  {
    step: '3',
    title: 'Approve and send',
    body: 'A teammate reviews the batch and approves it. Liqwifi pays everyone at once, or on the schedule you set.',
  },
]

const FEATURES = [
  {
    title: 'Bulk payouts',
    body: 'Send to thousands of recipients in one batch, from a CSV upload or the API.',
  },
  {
    title: 'Three ways to receive',
    body: 'Bank accounts, mobile wallets and cash pickup points, so people get paid the way that works for them.',
  },
  {
    title: 'Instant or scheduled',
    body: 'Pay now, or set weekly and monthly runs that go out on their own.',
  },
  {
    title: 'Approvals you control',
    body: 'Choose who can create, review and release a batch, with spending limits per person.',
  },
  {
    title: 'Live tracking',
    body: 'Watch each payment move from sent to received, and retry any failure in one click.',
  },
  {
    title: 'Automatic reconciliation',
    body: 'Every payout matches back to your ledger, with exports ready for your accountant.',
  },
]

const USE_CASES = [
  {
    title: 'Payroll and wages',
    body: 'Pay casual and field staff on payday, without the bank queue.',
    tone: 'sky',
  },
  {
    title: 'Gigs and creators',
    body: 'Settle earnings daily or weekly to drivers, sellers and freelancers.',
    tone: 'mint',
  },
  {
    title: 'Grants and aid',
    body: 'Reach beneficiaries directly, with a clear record of who received what.',
    tone: 'lime',
  },
  {
    title: 'Claims and refunds',
    body: 'Pay insurance claims and customer refunds in minutes, not days.',
    tone: 'ink',
  },
]

const DEVELOPER_POINTS = [
  'Sandbox keys in minutes',
  'Idempotent requests, so a retry never pays twice',
  'Webhooks for paid, failed and reversed payments',
]

const CONTROLS = [
  {
    title: 'Role-based access',
    body: 'Give each teammate only the permissions their job needs.',
    accent: 'cyan',
  },
  {
    title: 'Two-person approval',
    body: 'Require a second person to release any batch over a limit you set.',
    accent: 'teal',
  },
  {
    title: 'Full audit trail',
    body: 'See who created, approved and changed every payout, and when.',
    accent: 'lime',
  },
  {
    title: 'Encrypted end to end',
    body: 'Recipient details and payment data are protected in transit and at rest.',
    accent: 'teal',
  },
]

const FAQ = [
  {
    question: 'Who can receive a payout?',
    answer:
      'Anyone with a bank account, a mobile wallet or a nearby pickup point. You only need their name and one way to reach them.',
  },
  {
    question: 'How fast do recipients get paid?',
    answer:
      'Payouts leave as soon as a batch is approved. The expected arrival time for each channel is shown before you confirm.',
  },
  {
    question: 'What happens if a payment fails?',
    answer:
      'We flag it with a reason, return the money to your balance, and let you retry or switch to another channel.',
  },
  {
    question: 'Do I need a developer?',
    answer:
      'No. Upload a CSV from the dashboard and you’re done. The API is there when you’re ready for it.',
  },
]

const API_SNIPPET = `POST /v1/disbursements
{
  "reference": "payroll-nov-2026",
  "currency": "NGN",
  "recipients": [
    {
      "name": "Amara N.",
      "amount": 50000.00,
      "channel": "bank",
      "account": "0123456789"
    },
    {
      "name": "Tunde A.",
      "amount": 75000.00,
      "channel": "wallet",
      "phone": "+2348000000000"
    }
  ],
  "approval": "required"
}`

export default function LandingPage() {
  return (
    <div className="landing-page">
      <Head>
        <title>Liqwifi Disburse · Bulk payouts made simple</title>
        <meta
          name="description"
          content="Liqwifi Disburse sends cash payouts in bulk to bank accounts, mobile wallets and pickup points, with approvals, live tracking and automatic reconciliation."
        />
      </Head>

      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Link href="/" className="landing-brand" aria-label="Liqwifi Disburse home">
            <img src="/Images/Liqwifi_CombMark_Midnight_Sub.png" alt="Liqwifi" />
          </Link>
          <nav className="landing-nav-links" aria-label="Landing">
            <a href="#how-it-works">How it works</a>
            <a href="#features">Features</a>
            <a href="#use-cases">Use cases</a>
            <a href="#developers">Developers</a>
            <a href="#faq">FAQ</a>
          </nav>
          <a
            href="mailto:hello@liqwifi.com?subject=Book%20a%20Liqwifi%20Disburse%20demo"
            className="landing-btn landing-btn-primary landing-nav-cta"
          >
            Book a demo
          </a>
        </div>
      </header>

      <section className="landing-hero" aria-label="Liqwifi Disburse">
        <div className="landing-hero-inner">
          <div className="landing-hero-copy">
            <h1>Pay a thousand people as easily as one.</h1>
            <p>
              Liqwifi Disburse sends cash payouts in bulk to bank accounts, mobile wallets and pickup points,
              with approvals, live tracking and automatic reconciliation.
            </p>
            <div className="landing-hero-actions">
              <Link href="/login" className="landing-btn landing-btn-primary">Start disbursing</Link>
              <a href="mailto:hello@liqwifi.com?subject=Book%20a%20Liqwifi%20Disburse%20demo" className="landing-btn landing-btn-outline">
                Book a demo
              </a>
            </div>
            <p className="landing-hero-note">Already on Liqwifi? Turn on Disburse from your dashboard.</p>
          </div>

          <aside className="landing-hero-card" aria-label="Live payout tracking preview">
            <div className="landing-card-top">
              <div>
                <p className="landing-card-meta">Payout batch #2048 · Field team, November</p>
                <strong className="landing-card-amount">₦5,000,000.00</strong>
              </div>
              <span className="landing-card-badge">Sending</span>
            </div>

            <div className="landing-progress" aria-hidden="true">
              <span style={{ width: '72%' }} />
            </div>
            <div className="landing-progress-meta">
              <span>72 of 100 paid</span>
              <span>72% complete</span>
            </div>

            <ul className="landing-payout-list">
              {PAYOUTS.map((payout) => (
                <li key={payout.initials}>
                  <span className="landing-avatar" aria-hidden="true">{payout.initials}</span>
                  <div className="landing-payout-person">
                    <strong>{payout.name}</strong>
                    <small>{payout.method}</small>
                  </div>
                  <div className="landing-payout-value">
                    <strong>{payout.amount}</strong>
                    <small>{payout.status}</small>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section id="how-it-works" className="landing-how" aria-labelledby="how-it-works-heading">
        <div className="landing-how-inner">
          <div className="landing-how-copy">
            <h2 id="how-it-works-heading">From spreadsheet to paid in three steps.</h2>
            <p>No chasing account numbers. No one-by-one transfers.</p>
          </div>
          <ol className="landing-how-steps">
            {HOW_IT_WORKS.map((item) => (
              <li key={item.step}>
                <span className="landing-how-number" aria-hidden="true">{item.step}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="features" className="landing-features" aria-labelledby="features-heading">
        <div className="landing-features-inner">
          <h2 id="features-heading">Everything a payout run needs.</h2>
          <ul className="landing-features-grid">
            {FEATURES.map((feature) => (
              <li key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="use-cases" className="landing-use-cases" aria-labelledby="use-cases-heading">
        <div className="landing-use-cases-inner">
          <h2 id="use-cases-heading">Built for anyone who pays people.</h2>
          <ul className="landing-use-cases-grid">
            {USE_CASES.map((item) => (
              <li key={item.title} className={`landing-use-case landing-use-case-${item.tone}`}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="developers" className="landing-developers" aria-labelledby="developers-heading">
        <div className="landing-developers-inner">
          <div className="landing-developers-copy">
            <h2 id="developers-heading">Disburse from your own product.</h2>
            <p>One endpoint creates a batch. Webhooks tell you about every status change.</p>
            <ul>
              {DEVELOPER_POINTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
          <pre className="landing-developers-code" aria-label="Sample disbursement API request">
            <code>{API_SNIPPET}</code>
          </pre>
        </div>
      </section>

      <section id="security" className="landing-controls" aria-labelledby="controls-heading">
        <div className="landing-controls-inner">
          <h2 id="controls-heading">Money out, under control.</h2>
          <ul className="landing-controls-grid">
            {CONTROLS.map((item) => (
              <li key={item.title} className={`landing-control landing-control-${item.accent}`}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="faq" className="landing-faq" aria-labelledby="faq-heading">
        <div className="landing-faq-inner">
          <h2 id="faq-heading">Questions people ask first.</h2>
          <ul className="landing-faq-grid">
            {FAQ.map((item) => (
              <li key={item.question}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="landing-cta" aria-labelledby="cta-heading">
        <div className="landing-cta-band">
          <div className="landing-cta-copy">
            <h2 id="cta-heading">Get your first batch out today.</h2>
            <p>Set up Disburse in minutes from your Liqwifi dashboard.</p>
            <div className="landing-cta-actions">
              <Link href="/login" className="landing-btn landing-btn-lime">Start disbursing</Link>
              <a
                href="mailto:hello@liqwifi.com?subject=Talk%20to%20Liqwifi%20sales"
                className="landing-btn landing-btn-ghost"
              >
                Talk to sales
              </a>
            </div>
          </div>
          <div className="landing-cta-visual">
            <img
              src="/Images/landing-cta-mark.png"
              alt=""
              width={354}
              height={350}
            />
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-top">
            <div className="landing-footer-brand">
              <Link href="/" aria-label="Liqwifi Disburse home">
                <img src="/Images/Liqwifi_CombMark_Duo_White.png" alt="Liqwifi" />
              </Link>
              <p>Money that reaches people.</p>
            </div>
            <div className="landing-footer-nav">
              <div>
                <h4>Disburse</h4>
                <a href="#how-it-works">Overview</a>
                <a href="#use-cases">Pricing</a>
                <a href="#security">Security</a>
                <a href="#developers">API docs</a>
              </div>
              <div>
                <h4>Company</h4>
                <a href="mailto:hello@liqwifi.com">About</a>
                <a href="mailto:hello@liqwifi.com">Careers</a>
                <a href="mailto:hello@liqwifi.com">Contact</a>
              </div>
              <div>
                <h4>Legal</h4>
                <a href="mailto:hello@liqwifi.com?subject=Terms">Terms</a>
                <a href="mailto:hello@liqwifi.com?subject=Privacy">Privacy</a>
              </div>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <p>© 2026 Liqwifi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
