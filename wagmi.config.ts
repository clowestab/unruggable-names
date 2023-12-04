import { defineConfig }                             from '@wagmi/cli'
import { react, foundry }                           from '@wagmi/cli/plugins'
import { erc20ABI }                                 from 'wagmi'
import { foundry as foundryChain, mainnet, goerli } from 'wagmi/chains'
import { default as contractsJson }                 from './exported-contracts.json' assert {type: 'json'}
//import { default as l2ContractsJson }               from './exported-l2-contracts.json' assert {type: 'json'}

//const mainnetContracts        = contractsJson["1"][0]["contracts"];
const goerliContracts           = contractsJson["5"][0]["contracts"];
const sepoliaContracts          = contractsJson["11155111"][0]["contracts"];
//const localhostContracts        = contractsJson["31337"][0]["contracts"];

//const optimismGoerliContracts   = contractsJson["420"][0]["contracts"];
const ensChainContracts         = contractsJson["42070"][0]["contracts"];

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

console.log("L2PUBLIC", ensChainContracts);

export default defineConfig({
  out: 'lib/blockchain.ts',
  plugins: [
    react(),
    foundry({
      project: '../../L2-ens',
      include: [
        'L1Resolver.sol/**',
        'L1UnruggableResolver.sol/**',
        'IRenewalController.sol/**',
        'L2PricePerCharRenewalController.sol/**',
        'L2FixedPriceRenewalController.sol/**',
        'L2EthRegistrar.sol/**',
        'L2SubnameRegistrar.sol/**',
        'L2NameWrapper.sol/**',
        'L2PublicResolver.sol/**',
        'OPVerifier.sol/**',
      ],
      exclude: [],
      deployments: {
        L1Resolver: {
          11155111: sepoliaContracts["L1Resolver"]["address"]
        },
        L1UnruggableResolver: {
          11155111: sepoliaContracts["L1UnruggableResolver"]["address"]
        },
        L2PricePerCharRenewalController: {
          //420: optimismGoerliContracts["L2PricePerCharRenewalController"]?.address,
          42070: ensChainContracts["L2PricePerCharRenewalController"]?.address,
        },
        L2FixedPriceRenewalController: {
          //420: optimismGoerliContracts["L2FixedPriceRenewalController"]?.address,
          42070: ensChainContracts["L2FixedPriceRenewalController"]?.address,
        },
        L2EthRegistrar: {
          //420: optimismGoerliContracts["L2EthRegistrar"]?.address,
          42070: ensChainContracts["L2EthRegistrar"]?.address
        },
        L2SubnameRegistrar: {
          //420: optimismGoerliContracts["L2SubnameRegistrar"]?.address,
          42070: ensChainContracts["L2SubnameRegistrar"]?.address
        },
        L2NameWrapper: {
          //420: optimismGoerliContracts["L2NameWrapper"]?.address,
          42070: ensChainContracts["L2NameWrapper"]?.address
        },
        L2PublicResolver: {
          42070: ensChainContracts["L2PublicResolver"]?.address
        },
        OPVerifier: {
          11155111: sepoliaContracts["OPVerifier"]?.address
        },
      },
    }),
    foundry({
      forge: {
        clean: true,
        build: true,
        //path: 'path/to/forge',
        //rebuild: true,
      },
      project: '../../ens-contracts',
      include: [
        'NameWrapper.sol/**',
        'ENSRegistry.sol/**',
        'ETHRegistrarController.sol/**',
        'BaseRegistrarImplementation.sol/**',
      ],
      exclude: [],
      deployments: {
        NameWrapper: {
          //5:     goerliContracts["NameWrapper"]?.address,
          //31337: localhostContracts["NameWrapper"] ? localhostContracts["NameWrapper"]?.address : ZERO_ADDRESS,
          11155111: sepoliaContracts["NameWrapper"]["address"]
        },
        ENSRegistry: {
          //5:     goerliContracts["ENSRegistry"]?.address,
          //31337: localhostContracts["ENSRegistry"] ? localhostContracts["ENSRegistry"]?.address : ZERO_ADDRESS,
          //420: optimismGoerliContracts["ENSRegistry"] ? optimismGoerliContracts["ENSRegistry"]?.address : ZERO_ADDRESS,
          42070: ensChainContracts["ENSRegistry"] ? ensChainContracts["ENSRegistry"]?.address : ZERO_ADDRESS,
          11155111: sepoliaContracts["ENSRegistry"]["address"]
        },
        ETHRegistrarController: {
          //5:     goerliContracts["ETHRegistrarController"]?.address,
          //31337: localhostContracts["ETHRegistrarController"] ? localhostContracts["ETHRegistrarController"]?.address : ZERO_ADDRESS,
          11155111: sepoliaContracts["ETHRegistrarController"]["address"]
        },        
        BaseRegistrarImplementation: {
          //5:     goerliContracts["BaseRegistrarImplementation"]?.address,
          //31337: localhostContracts["BaseRegistrarImplementation"] ? localhostContracts["BaseRegistrarImplementation"]?.address : ZERO_ADDRESS,
          11155111: sepoliaContracts["BaseRegistrarImplementation"]["address"]
        }
      },
    }),
  ],
})
