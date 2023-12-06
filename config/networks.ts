// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Networks
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
import { arbitrum, arbitrumGoerli, baseGoerli, goerli, hardhat, mainnet, optimism, optimismGoerli, polygon, sepolia, foundry } from '@wagmi/chains'
import { configureChains } from 'wagmi'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { infuraProvider } from 'wagmi/providers/infura'
import { publicProvider } from 'wagmi/providers/public'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { Chain, getDefaultWallets } from '@rainbow-me/rainbowkit';

// @ts-ignore
goerli.iconUrl = '/icons/NetworkEthereumTest.svg'
// @ts-ignore
sepolia.iconUrl = '/icons/NetworkEthereumTest.svg'
// @ts-ignore
arbitrumGoerli.iconUrl = '/icons/NetworkArbitrumTest.svg'
// @ts-ignore
baseGoerli.iconUrl = '/icons/NetworkBaseTest.svg'


const ensChain: Chain = {
  id: 42_070,
  name: 'ENS Chain',
  network: 'ensChain',
  iconUrl: '/icons/NetworkEthereumTest.svg',
  iconBackground: '#fff',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://chain.enstools.com'] },
    default: { http: ['https://chain.enstools.com'] },
  },
  blockExplorers: {
    default: { name: 'ENSChain', url: 'https://explorer.enstools.com' },
    //etherscan: { name: 'SnowTrace', url: 'https://snowtrace.io' },
  },
  contracts: {
    /*multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 11_907_934,
    },*/
  },
  testnet: false,
};


export const ETH_CHAINS_TEST = [/*mainnet, baseGoerli, optimismGoerli, arbitrumGoerli, sepolia, */sepolia, ensChain]
export const ETH_CHAINS_PROD = [/*mainnet, optimism, arbitrum, polygon, */sepolia, ensChain]

export const CHAINS = process.env.NODE_ENV === 'production' ? ETH_CHAINS_PROD : ETH_CHAINS_TEST


console.log("goerli", goerli);

const PROVIDERS = [
  /*alchemyProvider({
    apiKey: "rTbd7myQ6pGvD1L4SEN171Sft4BG-uVZ" as string,
  }),*/
];

PROVIDERS.push(jsonRpcProvider({
  rpc: (chain: Chain) => {

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

      case 11155111:
        return ({
          http: `https://eth-sepolia.g.alchemy.com/v2/wU2GqCbHRv7zR36dbSRH0sHKM72poxIE`,
        });

      case 42070:
        return ({
          http: `https://chain.enstools.com`,
        });

      default:
        return ({
          http: `http://127.0.0.1:8545`,
        })
    }
  }
}))

console.log("deebug CHAINS", CHAINS);


// @ts-ignore
export const { chains, provider } = configureChains(CHAINS, [...PROVIDERS])
