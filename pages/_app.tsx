import '../styles/globals.css'
import Head from 'next/head'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>LiqWiFi PayOps</title>
        <meta name="description" content="Secure batch disbursement operations" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/Images/Liqwifi_Icon_Circle_Full_DarkM.png" />
        <link rel="apple-touch-icon" href="/Images/Liqwifi_Icon_Circle_Full_DarkM.png" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
