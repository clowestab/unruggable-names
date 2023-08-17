import { defineConfig }                             from '@wagmi/cli'
import { react, foundry }                           from '@wagmi/cli/plugins'
import { erc20ABI }                                 from 'wagmi'
import { foundry as foundryChain, mainnet, goerli } from 'wagmi/chains'
import { default as contractsJson }                 from './exported-contracts.json' assert {type: 'json'}
import { default as l2ContractsJson }               from './exported-l2-contracts.json' assert {type: 'json'}

const mainnetContracts   = contractsJson["1"][0]["contracts"];
const goerliContracts    = contractsJson["5"][0]["contracts"];
const localhostContracts = contractsJson["31337"][0]["contracts"];
const optimismGoerliSNContracts = contractsJson["420"][0]["contracts"];


const optimismGoerliContracts = l2ContractsJson["420"][0]["contracts"];


const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

console.log("goerli", goerliContracts["FixedPriceRenewalController"]?.address);
console.log("lo", localhostContracts);
console.log("local", localhostContracts["FixedPriceRenewalController"] ? localhostContracts["FixedPriceRenewalController"]?.address : "0x0");

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
        'IRenewalController.sol/**',
        'NameWrapper.sol/**',
        'ENSRegistry.sol/**',
        'ETHRegistrarController.sol/**',
        'BaseRegistrarImplementation.sol/**'
      ],
      deployments: {
        SubnameRegistrar: {
          5:     goerliContracts["SubnameRegistrar"]?.address,
          31337: localhostContracts["SubnameRegistrar"] ? localhostContracts["SubnameRegistrar"]?.address : ZERO_ADDRESS,
        },
        SubnameWrapper: {
          5:     goerliContracts["SubnameWrapper"]?.address,
          31337: localhostContracts["SubnameWrapper"] ? localhostContracts["SubnameWrapper"]?.address : ZERO_ADDRESS,
        },
        NameWrapper: {
          5:     goerliContracts["NameWrapper"]?.address,
          31337: localhostContracts["NameWrapper"] ? localhostContracts["NameWrapper"]?.address : ZERO_ADDRESS,
        },
        ENSRegistry: {
          5:     goerliContracts["ENSRegistry"]?.address,
          31337: localhostContracts["ENSRegistry"] ? localhostContracts["ENSRegistry"]?.address : ZERO_ADDRESS,
          420: optimismGoerliSNContracts["ENSRegistry"] ? optimismGoerliSNContracts["ENSRegistry"]?.address : ZERO_ADDRESS,
        },
        ETHRegistrarController: {
          5:     goerliContracts["ETHRegistrarController"]?.address,
          31337: localhostContracts["ETHRegistrarController"] ? localhostContracts["ETHRegistrarController"]?.address : ZERO_ADDRESS,
        },        
        BaseRegistrarImplementation: {
          5:     goerliContracts["BaseRegistrarImplementation"]?.address,
          31337: localhostContracts["BaseRegistrarImplementation"] ? localhostContracts["BaseRegistrarImplementation"]?.address : ZERO_ADDRESS,
        }
      },
    }),
    foundry({
      project: '../../L2-ens',
      include: [
        'L2PricePerCharRenewalController.sol/**',
        'L2FixedPriceRenewalController.sol/**',
        'L2EthRegistrar.sol/**',
        'L2SubnameRegistrar.sol/**',
        'L2NameWrapper.sol/**'
      ],
      deployments: {
        L2PricePerCharRenewalController: {
          420: optimismGoerliContracts["L2PricePerCharRenewalController"]?.address,
        },
        L2FixedPriceRenewalController: {
          420: optimismGoerliContracts["L2FixedPriceRenewalController"]?.address,
        },
        L2EthRegistrar: {
          420: optimismGoerliContracts["L2EthRegistrar"]?.address
        },
        L2SubnameRegistrar: {
          420: optimismGoerliContracts["L2SubnameRegistrar"]?.address
        },
        L2NameWrapper: {
          420: optimismGoerliContracts["L2NameWrapper"]?.address
        }
      },
    })
  ],
})
