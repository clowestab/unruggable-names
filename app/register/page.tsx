'use client'

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

export default function RegistrationForm() {

	const [searchTerm, setSearchTerm]       = React.useState("");
	const [searchError, setSearchError]     = React.useState(null);
	const [searchResults, setSearchResults] = React.useState([]);
	const [isSearching, setIsSearching]     = React.useState(false);

	/**
	 * Effect to hide the loader when searching ends
	 */ 
	React.useEffect(() => {
		
		setIsSearching(false);

	}, [searchResults]);


	/**
	 * 
	 */ 
	const doSearch = () => {

		setSearchResults([]);

		//Show error if no input
		if (searchTerm == "") { setSearchError("Please enter an input"); return; }

		const domainParts     	= searchTerm.split(".");
		const domainExtension 	= domainParts[domainParts.length - 1];
		const isSubdomain     	= domainParts.length == 3 && domainExtension == 'eth';
		const isEth2ld     		= domainParts.length == 2 && domainExtension == 'eth';

		//Show error if input not a valid domain or subdomain
		if (!isSubdomain && !isEth2ld) { setSearchError("Please enter a valid domain/subdomain"); return; }

		setIsSearching(true);

		const newResults = [];
		if (isSubdomain) { 
			newResults.push({
				name:  searchTerm, 
				type:  'subdomain', 
				nonce: Math.floor(Math.random() * 100000)
			}); 
		}

		if (isEth2ld) { 
			newResults.push({
				name:  searchTerm, 
				type:  'domain', 
				nonce: Math.floor(Math.random() * 100000)
			}); 
		}

		setSearchResults(newResults);
	}


	return (
		<div className = "m-8">

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
								setSearchError(false);
								setSearchTerm(e.target.value)
							}} />
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
										key = {"result-row-" + result.name + "-" + result.nonce} {...result} 
										resultIndex={resultIndex} 
										onRegister = {() => {    
											setSearchResults([]);
											doSearch();
										}} />

								<div data-orientation = "horizontal" role = "none" className = "bg-slate-200 dark:bg-slate-700 h-[1px] w-full my-4"></div>
								</div>
									
							);
						} else if (result.type == "domain") {
							return (
								<div key = {"result-" + resultIndex}>
									<DomainSearchResultRow 
										key = {"domain-result-row-" + result.name + "-" + result.nonce} {...result} 
										resultIndex={resultIndex} 
										onRegister = {() => {     
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
