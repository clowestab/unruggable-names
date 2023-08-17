// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Networks
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
import { arbitrum, arbitrumGoerli, baseGoerli, goerli, hardhat, mainnet, optimism, optimismGoerli, polygon, sepolia, foundry } from '@wagmi/chains'
import { configureChains } from 'wagmi'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { infuraProvider } from 'wagmi/providers/infura'
import { publicProvider } from 'wagmi/providers/public'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'

// @ts-ignore
goerli.iconUrl = '/icons/NetworkEthereumTest.svg'
// @ts-ignore
sepolia.iconUrl = '/icons/NetworkEthereumTest.svg'
// @ts-ignore
arbitrumGoerli.iconUrl = '/icons/NetworkArbitrumTest.svg'
// @ts-ignore
baseGoerli.iconUrl = '/icons/NetworkBaseTest.svg'

export const ETH_CHAINS_TEST = [/*mainnet, baseGoerli, optimismGoerli, arbitrumGoerli, sepolia, */goerli, optimismGoerli]
export const ETH_CHAINS_PROD = [/*mainnet, optimism, arbitrum, polygon, */goerli, optimismGoerli]

export const CHAINS = process.env.NODE_ENV === 'production' ? ETH_CHAINS_PROD : ETH_CHAINS_TEST

const PROVIDERS = [
  /*alchemyProvider({
    apiKey: "rTbd7myQ6pGvD1L4SEN171Sft4BG-uVZ" as string,
  }),*/
];

PROVIDERS.push(jsonRpcProvider({
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

      /*default:
        return ({
          http: `http://127.0.0.1:8545`,
        });*/
    }
  }
}))

console.log("deebug CHAINS", CHAINS);


// @ts-ignore
export const { chains, provider } = configureChains(CHAINS, [...PROVIDERS])
