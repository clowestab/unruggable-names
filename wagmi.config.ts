import { defineConfig } from '@wagmi/cli'
import { react, foundry } from '@wagmi/cli/plugins'
import { erc20ABI } from 'wagmi'

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
        'NameWrapper.sol/**',
        'ENSRegistry.sol/**',
        'ETHRegistrarController.sol/**'
      ]
    })
  ],
})
