'use client'

import {
  useConnectModal,
  useAccountModal,
  useChainModal,
} from '@rainbow-me/rainbowkit';


import { useNetwork } 					from 'wagmi'

import { 
	WalletAddress, 
	WalletBalance, 
	WalletNonce, 
	WalletEnsName 
}                                       from '@turbo-eth/core-wagmi'
import { motion }                       from 'framer-motion'

import { BranchIsWalletConnected }      from '@/components/shared/branch-is-wallet-connected'
import { WalletConnect }                from '@/components/blockchain/wallet-connect'

import { FADE_DOWN_ANIMATION_VARIANTS } from '@/config/design'

import { Input }                        from "@/components/ui/input"
import { Button }                       from "@/components/ui/button"
import CommonIcons                      from '@/components/shared/common-icons';

import React                            from 'react'
import { 
	useSubnameRegistrarRead, 
	useSubnameRegistrarMinCommitmentAge 
}                                       from '../../lib/blockchain'

import { foundry }                      from 'wagmi/chains'

import { 
	hexEncodeName 
} 										from '../../helpers/Helpers.jsx';

import { SubdomainSearchResultRow } 	from '@/components/ens/subdomain-search-result-row'
import { DomainSearchResultRow } 		from '@/components/ens/domain-search-result-row'


interface SearchResult {
  	name:  string,
  	type:  string,
  	nonce: number
}

export default function RegistrationForm() {

	const { chain, chains }  = useNetwork();
	const { openChainModal } = useChainModal();

	console.log("chain", chain);

	const [searchTerm, setSearchTerm]       = React.useState<string>("");
	const [searchError, setSearchError]     = React.useState<string | null>(null);
	const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
	const [isSearching, setIsSearching]     = React.useState<boolean>(false);

	/**
	 * Effect to hide the loader when searching ends
	 */ 
	React.useEffect(() => {
		
		setIsSearching(false);

	}, [searchResults]);


	/**
	 * 
	 */ 
	const doSearch = (manualSearchTerm?: any) => {

		console.log("search man", manualSearchTerm);
		console.log("search", searchTerm);

		const searchTermToUse = typeof manualSearchTerm === "string" ? manualSearchTerm : searchTerm;

		setSearchResults([]);

		//Show error if no input
		if (searchTermToUse == "") { setSearchError("Please enter an input"); return; }

		const domainParts     	= searchTermToUse.split(".");
		const domainExtension 	= domainParts[domainParts.length - 1];
		const isSubdomain     	= domainParts.length == 3 && domainExtension == 'eth';
		const isEth2ld     		= domainParts.length == 2 && domainExtension == 'eth';

		//Show error if input not a valid domain or subdomain
		if (!isSubdomain && !isEth2ld) { setSearchError("Please enter a valid domain/subdomain"); return; }

		setIsSearching(true);

		const newResults = [];
		if (isSubdomain) { 
			newResults.push({
				name:  searchTermToUse, 
				type:  'subdomain', 
				nonce: Math.floor(Math.random() * 100000)
			}); 
		}

		if (isEth2ld) { 
			newResults.push({
				name:  searchTermToUse, 
				type:  'domain', 
				nonce: Math.floor(Math.random() * 100000)
			}); 
		}

		setSearchResults(newResults);
	}


	return (
		<div className = "m-8">

			{chain && (chain.id != foundry.id) && (
				<>
					<p>This interface only currently works with foundry.</p>
					<Button 
						type     = "submit" 
						onClick  = {openChainModal}>
						Change Network
					</Button>
				</>
			)}

			<div className="flex-center col-span-12 flex flex-col lg:col-span-9">
				<div className="text-center">
					<h3 className="font-primary text-2xl font-bold lg:text-4xl">
						<span className="text-gradient-secondary">
							Lets find you the perfect domain <WalletEnsName />
						</span>
					</h3>

					<BranchIsWalletConnected>
						<span className="font-light">
							<WalletAddress className="mt-4 block text-xl font-light" />
						</span>
						<div>
							<h3 className="text-lg font-normal mt-4">Connect your wallet to register a domain.</h3>
							<WalletConnect className = "table mx-auto mt-2" />
						</div>
					</BranchIsWalletConnected>
				</div>
			</div>

			<motion.div
				className   = "flex-center flex h-full w-full mt-8"
				variants    = {FADE_DOWN_ANIMATION_VARIANTS}
				initial     = "hidden"
				whileInView = "show"
				animate     = "show"
				viewport    = {{ once: true }}>

				<div className = "flex items-start space-x-2">
					<div className = "flex flex-col">
						<Input 
							type        = "text" 
							placeholder = "Enter a domain.." 
							onChange    = {(e) => {
								setSearchError(null);
								setSearchTerm(e.target.value)
							}}
							value 		= {searchTerm} />
						{searchError != null && (
							<div className = "text-sm text-red-500 flex flex-center mt-2">{searchError}</div>
						)}
					</div>
					<Button 
						type     = "submit" 
						disabled = {isSearching} 
						onClick  = {doSearch}>
						{isSearching && (<>{CommonIcons.miniLoader}</>)}
						Search
					</Button>
				</div>
			</motion.div>

			{searchResults.length > 0 && (
				<div>
					<h2 className = "text-2xl font-semibold tracking-tight mt-8">Search results</h2>
					<p className = "text-sm text-slate-500 dark:text-slate-400 mb-4">
						Top picks for you based on your search input.
					</p>

					{searchResults.map((result, resultIndex) => {

						if (result.type == "subdomain") {
							return (
								<div key = {"result-" + resultIndex}>
									<SubdomainSearchResultRow 
										key 			= {"result-row-" + result.name + "-" + result.nonce} {...result} 
										resultIndex		= {resultIndex} 
										onRegister 		= {() => {    
											setSearchResults([]);
											doSearch();
										}}
										doLookup = {(domain: any) => {

											setSearchError(null);
											setSearchTerm(domain);
											doSearch(domain);
										}} />

								<div data-orientation = "horizontal" role = "none" className = "bg-slate-200 dark:bg-slate-700 h-[1px] w-full my-4"></div>
								</div>
									
							);
						} else if (result.type == "domain") {
							return (
								<div key = {"result-" + resultIndex}>
									<DomainSearchResultRow 
										key 		= {"domain-result-row-" + result.name + "-" + result.nonce} {...result} 
										resultIndex	= {resultIndex} 
										onRegister 	= {() => {     
											setSearchResults([]);
											doSearch();
										}} />

									<div data-orientation = "horizontal" role = "none" className = "bg-slate-200 dark:bg-slate-700 h-[1px] w-full my-4"></div>
								</div>	
							);
						}
					})}
				</div>
			)}
		</div>
	)
}
