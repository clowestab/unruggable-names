import { defineConfig }                             from '@wagmi/cli'
import { react, foundry }                           from '@wagmi/cli/plugins'
import { erc20ABI }                                 from 'wagmi'
import { foundry as foundryChain, mainnet, goerli } from 'wagmi/chains'
import { default as contractsJson }                 from './exported-contracts.json' assert {type: 'json'}

const mainnetContracts   = contractsJson["1"][0]["contracts"];
const goerliContracts    = contractsJson["5"][0]["contracts"];
const localhostContracts = contractsJson["31337"][0]["contracts"];

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
        'LengthBasedRenewalController.sol/**',
        'FixedPriceRenewalController.sol/**',
        'IRenewalController.sol/**',
        'NameWrapper.sol/**',
        'ENSRegistry.sol/**',
        'ETHRegistrarController.sol/**',
        'BaseRegistrarImplementation.sol/**'
      ],
      deployments: {
        LengthBasedRenewalController: {
          5:     goerliContracts["LengthBasedRenewalController"]?.address,
          31337: localhostContracts["LengthBasedRenewalController"]?.address,
        },
        FixedPriceRenewalController: {
          5:     goerliContracts["FixedPriceRenewalController"]?.address,
          31337: localhostContracts["FixedPriceRenewalController"]?.address,
        },
        SubnameRegistrar: {
          5:     goerliContracts["SubnameRegistrar"]?.address,
          31337: localhostContracts["SubnameRegistrar"]?.address,
        },
        SubnameWrapper: {
          5:     goerliContracts["SubnameWrapper"]?.address,
          31337: localhostContracts["SubnameWrapper"]?.address,
        },
        NameWrapper: {
          5:     goerliContracts["NameWrapper"]?.address,
          31337: localhostContracts["NameWrapper"]?.address,
        },
        ENSRegistry: {
          5:     goerliContracts["ENSRegistry"]?.address,
          31337: localhostContracts["ENSRegistry"]?.address,
        },
        ETHRegistrarController: {
          5:     goerliContracts["ETHRegistrarController"]?.address,
          31337: localhostContracts["ETHRegistrarController"]?.address,
        },        
        BaseRegistrarImplementation: {
          5:     goerliContracts["BaseRegistrarImplementation"]?.address,
          31337: localhostContracts["BaseRegistrarImplementation"]?.address,
        },
      },
    })
  ],
})
