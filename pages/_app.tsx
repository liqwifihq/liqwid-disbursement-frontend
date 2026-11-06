import '../styles/globals.css'
import Head from 'next/head'
import { Inter, Outfit } from 'next/font/google'
import type { AppProps } from 'next/app'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-outfit',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-inter',
  display: 'swap',
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`app-font-root ${outfit.variable} ${inter.variable}`}>
      <Head>
        <title>LiqWiFi PayOps</title>
        <meta name="description" content="Secure batch disbursement operations" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/Images/Liqwifi_Icon_Circle_Full_DarkM.png" />
        <link rel="apple-touch-icon" href="/Images/Liqwifi_Icon_Circle_Full_DarkM.png" />
      </Head>
      <Component {...pageProps} />
    </div>
  )
}
