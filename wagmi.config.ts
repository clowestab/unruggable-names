import { defineConfig } from '@wagmi/cli'
import { react, foundry } from '@wagmi/cli/plugins'
import { erc20ABI } from 'wagmi'
import { foundry as foundryChain, mainnet, goerli }                      from 'wagmi/chains'

export default defineConfig({
  out: 'lib/blockchain.ts',
  contracts: [
    {
      name: 'erc20',
      abi: erc20ABI,
    },
  ],
  plugins: [
    react(),
    foundry({
      project: '../../SubnameWrapper',
      include: [
        'SubnameWrapper.sol/**',
        'SubnameRegistrar.sol/**',
        'RenewalController.sol/**',
        'FixedPriceRenewalController.sol/**',
        'NameWrapper.sol/**',
        'ENSRegistry.sol/**',
        'ETHRegistrarController.sol/**'
      ],
      deployments: {
        RenewalController: {
          5:     '0xe80e73A7A42AD0f82315b361Bd0a3c3a95A88F5C',
          31337: '0x0B306BF915C4d645ff596e518fAf3F9669b97016',
        },
        FixedPriceRenewalController: {
          5:     '0xf7941569BaA791E80059cbB8E0b5104bd70adC99',
          31337: '0x7B4f352Cd40114f12e82fC675b5BA8C7582FC513',
        },
        SubnameRegistrar: {
          5:     '0xbbf178ef94694d18dcabd5ebc2e1d4152f96b110',
          31337: '0x9A676e781A523b5d0C0e43731313A708CB607508',
        },
        SubnameWrapper: {
          5:     '0x467e32AF4BA47CcC47ac383922E41EF725Dad37B',
          31337: '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82',
        },
        NameWrapper: {
          5:     '0x709f9958541FD5E699149572D3675ed86585DEAD',
          31337: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
        },
        ENSRegistry: {
          5:     '0xba086797534A836Eb05a5E8D777Ea31657EcD935',
          31337: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        },
        ETHRegistrarController: {
          5:     '0x1CA5F841eD0377a4FbB2669b70cA1c963828BF57',
          31337: '0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1',
        },
      },
    })
  ],
})
