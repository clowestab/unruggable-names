
# SubnameWrapper Demo Interface

## For Foundry

 - Start an anvil node

```bash
anvil --block-time 5
```

 - Run the hardhat deploy scripts from the [SubnameWrapper](https://github.com/nxt3d/SubnameWrapper/tree/version/no-XAP) repo

```bash
npx hardhat deploy --network localhost --tags renewal-controllers
```

**Note:** These deploy scripts depend on the ENS core contracts (registry, registrar controller, name wrapper etc) being deployed and the path to those deployments being specified in `hardhat.config.ts`

 - Run the server

```bash
pnpm dev
```

 - Or view the live version: [Unruggable Names](https://unruggablenames.com).

**Note:** Make sure you are connected to the Foundry network. If you are using Metamask etc you might have to add a custom network.


## For Goerli

 - Deploy the core [ENS contracts](https://github.com/ensdomains/ens-contracts).
 
 **Note:** We can't use the ENS Labs deployed contracts because we need to have appropriate control to authorise the various subname contracts at the various levels. 

```bash
npx hardhat deploy --network goerli --tags wrapper
npx hardhat deploy --network goerli --tags ethregistrar
npx hardhat deploy --network goerli --tags PublicResolver
```

 - Run the hardhat deploy scripts from the [SubnameWrapper](https://github.com/nxt3d/SubnameWrapper/tree/version/no-XAP) repo

```bash
npx hardhat deploy --network goerli --tags renewal-controllers
```

## Always

 - Export the data for our deployed contracts using `hardhat-deploy` from the SubnameWrapper repo

 ```bash
 npx hardhat export --export-all ../nextjs/turbo-eth/exported-contracts.json
 ```

 *Note:* Our `wagmi.config.ts` sources address data from this exported JSON file.

 - Regenerate `blockchain.ts` using `wagmi-cli`

```bash
pnpm wagmi generate
```

**Note:** Optionally add `--watch` to automatically watch for changes to our contracts and rebuild our `blockchain.ts` file.

---

![image](https://user-images.githubusercontent.com/3408362/230732083-1c98e451-08af-41c2-b522-126370e8c6a5.png)

# ⚡ TurboETH - Web3 App Template
Web3 App Template built using Next.js, RainbowKit, SIWE, Disco, and more!

### Start Kit Examples
- [Main](https://light.turboeth.xyz) - `main` branch
- [Heavy](https://turboeth.xyz) - `integrations` branch

Deploy TurboETH `main` directly to [Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fturbo-eth%2Ftemplate-web3-app&project-name=TurboETH&repository-name=turbo-eth&demo-title=TurboETH&env=APP_ADMINS,NEXT_PUBLIC_ALCHEMY_API_KEY,NEXTAUTH_SECRET,ETHERSCAN_API_KEY,ETHERSCAN_API_KEY_OPTIMISM,ETHERSCAN_API_KEY_ARBITRUM,ETHERSCAN_API_KEY_POLYGON,DATABASE_URL&envDescription=How%20to%20get%20these%20env%20variables%3A&envLink=https%3A%2F%2Fgithub.com%2Fturbo-eth%2Ftemplate-web3-app%2Fblob%2Fmain%2F.env.example)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fturbo-eth%2Ftemplate-web3-app&project-name=TurboETH&repository-name=turbo-eth&demo-title=TurboETH&env=APP_ADMINS,NEXT_PUBLIC_ALCHEMY_API_KEY,NEXTAUTH_SECRET,ETHERSCAN_API_KEY,ETHERSCAN_API_KEY_OPTIMISM,ETHERSCAN_API_KEY_ARBITRUM,ETHERSCAN_API_KEY_POLYGON,DATABASE_URL&envDescription=How%20to%20get%20these%20env%20variables%3A&envLink=https%3A%2F%2Fgithub.com%2Fturbo-eth%2Ftemplate-web3-app%2Fblob%2Fmain%2F.env.example)


### [Documentation](https://docs.turboeth.xyz)
- Getting Started
  - [Environment Variables](https://docs.turboeth.xyz/getting-started/environment)
  - [JSON-RPC](https://docs.turboeth.xyz/getting-started/json-rpc)
  - [WAGMI CLI](https://docs.turboeth.xyz/getting-started/wagmi-cli)
  - [UI Components](https://docs.turboeth.xyz/getting-started/design-system)
  - [Backend Database](https://docs.turboeth.xyz/getting-started/database)
 - Core Integrations
   - [🌈 RainbowKit](https://docs.turboeth.xyz/integration/rainbowkit)
   - [🔏 Sign-In With Ethereum](https://docs.turboeth.xyz/integration/sign-in-with-ethereum)
- Smart Contract Integrations
  - [ERC20](https://docs.turboeth.xyz/integration/smart-contract-erc20)
- API Integrations
  - [Disco](https://docs.turboeth.xyz/integration/disco)
  - [Etherscan](https://docs.turboeth.xyz/integration/etherscan)

# Getting Started

The `pnpm` CLI is the recommended package manager but `npm` and `yarn` should work too.

```bash
pnpm install
```

#### Development
```bash
pnpm dev
```

#### Build
```bash
pnpm build
```

### Web3 Core
- [WAGMI CLI](https://wagmi.sh/cli/getting-started) - Automatic React Hook Generation
- [RainbowKit](https://www.rainbowkit.com/) - Wallet connection manager
- [Sign-In With Ethereum](https://login.xyz/) - Account authentication

### Web2 Frameworks
- [Vercel](https://vercel.com/) - App Infrastructure
- [Prisma](https://www.prisma.io/) - Database ORM 

### Developer Experience
- [TypeScript](https://www.typescriptlang.org/) – Static type checker for end-to-end typesafety
- [Prettier](https://prettier.io/) – Opinionated code formatter for consistent code style
- [ESLint](https://eslint.org/) – Pluggable linter for Next.js and TypeScript

### User Interface
- [TailwindCSS](https://tailwindcss.com) – Utility-first CSS framework for rapid UI development
- [Radix](https://www.radix-ui.com/) – Primitives like modal, popover, etc. to build a stellar user experience
- [Framer Motion](https://www.framer.com/motion/) – Motion library for React to animate components with ease
- [Lucide](https://lucide.dev/docs/lucide-react) – Beautifully simple, pixel-perfect icons

The [ui.shadcn.com](https://ui.shadcn.com) components are included in the `/components/shared/ui` folder.

# 💻 Developer Experience

### 🐕 What is husky
Husky improves your git commits.

You can use it to lint your commit messages, run tests, lint code, etc... when you commit or push. Husky supports all Git hooks.

#### 🪝 Hooks
- pre-commit: lint app codebase
- commit-msg: apply commintlint

### 📋 What is commitlint

commitlint checks if your commit messages meet the [conventional commit format](https://conventionalcommits.org).

In general the pattern mostly looks like this:

```sh
type(scope?): subject  #scope is optional; multiple scopes are supported (current delimiter options: "/", "\" and ",")
```

Real world examples can look like this:

```
chore: run tests on travis ci
```

```
fix(server): send cors headers
```

```
feat(blog): add comment section
```

Common types according to [commitlint-config-conventional (based on the Angular convention)](https://github.com/conventional-changelog/commitlint/tree/master/@commitlint/config-conventional#type-enum) can be:

- build
- chore
- ci
- docs
- feat
- fix
- perf
- refactor
- revert
- style
- test

# Acknowledgements

Original template was forked from https://github.com/wslyvh/nexth

Thank you @wslyvh 🙏

<hr/>

Copyright 2023 [Kames Geraghty](https://twitter.com/KamesGeraghty)
