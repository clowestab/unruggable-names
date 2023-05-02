import { ThemeProvider } from 'styled-components'
import { ThorinGlobalStyles, lightTheme } from '@ensdomains/thorin'

//import Layout from '../components/layout'

export default function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider theme={lightTheme}>
      <ThorinGlobalStyles />
      <Component {...pageProps} className = "m-8" />
    </ThemeProvider>      
  )
}