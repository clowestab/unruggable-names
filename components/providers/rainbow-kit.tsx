'use client'
import '@rainbow-me/rainbowkit/styles.css'
import { ReactNode } from 'react'

import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import { coinbaseWallet, injectedWallet, metaMaskWallet, rainbowWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets'
import { WagmiConfig, createClient } from 'wagmi'

import { chains, provider } from '@/config/networks'
import { siteConfig } from '@/config/site'
import { useColorMode } from '@/lib/state/color-mode'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'

interface Props {
  children: ReactNode
  autoConnect?: boolean
}

const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      injectedWallet({ chains }),
      metaMaskWallet({ chains }),
      rainbowWallet({ chains }),
      coinbaseWallet({ chains, appName: siteConfig.name }),
      walletConnectWallet({ chains }),
    ],
  },
])

    console.log("deebug lala prov function", provider.toString());

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider: (chain) => { 

    console.log("deebug lala", chain);

    const prov = provider(chain);

    console.log("deebug lala prov prov", prov);

    return prov;

/*

    const prov = jsonRpcProvider({
  rpc: (chain) => {

    console.log("deebug chain", chain);

    switch (chain.id) {

      case 5:
        return ({
          http: `https://eth-goerli.g.alchemy.com/v2/vrPUMZ7TORr_WepAY2PaOFhwSiSqxxa0`,
        });

      case 420:
        return ({
          http: `https://opt-goerli.g.alchemy.com/v2/rTbd7myQ6pGvD1L4SEN171Sft4BG-uVZ`,
        });

      default:
        return ({
          http: `http://127.0.0.1:8545`,
        });
    }*/
  }
})



export function RainbowKit(props: Props) {
  const [colorMode] = useColorMode()
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains} theme={colorMode == 'dark' ? darkTheme() : lightTheme()}>
        {props.children}
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
