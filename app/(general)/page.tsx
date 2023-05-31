'use client'

import {
  useConnectModal,
  useAccountModal,
  useChainModal,
} from '@rainbow-me/rainbowkit';


import { chains, provider as rkprovider } from '@/config/networks'

console.log("RK PROVIDER", rkprovider)

import { useNetwork, useProvider, useChainId }                   from 'wagmi'

import { 
    WalletAddress, 
}                                       from '@turbo-eth/core-wagmi'
import { motion }                       from 'framer-motion'

import { BranchIsWalletConnected }      from '@/components/shared/branch-is-wallet-connected'
import { WalletConnect }                from '@/components/blockchain/wallet-connect'

import { FADE_DOWN_ANIMATION_VARIANTS } from '@/config/design'

import { 
    Alert, 
    AlertDescription, 
    AlertTitle 
}                                       from "@/components/ui/alert"
import { Input }                        from "@/components/ui/input"
import { Button }                       from "@/components/ui/button"
import CommonIcons                      from '@/components/shared/common-icons';

import React                            from 'react'
import { 
    useSubnameRegistrarRead, 
    useSubnameRegistrarMinCommitmentAge 
}                                       from '../../lib/blockchain'

import { foundry, goerli }              from 'wagmi/chains'

import { 
    hexEncodeName,
    getCookie,
    setCookie,
    deleteCookie
}                                       from '../../helpers/Helpers.jsx';

import { SubnameSearchResultRow }     from '@/components/ens/subname-search-result-row'
import { NameSearchResultRow }        from '@/components/ens/name-search-result-row'

import { Toaster }                        from "@/components/ui/toaster"

interface SearchResult {
    name:  string,
    type:  string,
    nonce: number
}

//setCookie("committedName", "thomas.eth", 7);
const committedName                     = getCookie("committedName");
const committedAddressToRegisterTo      = getCookie("committedAddressToRegisterTo");
const committedRegisterForTimeInSeconds = getCookie("committedRegisterForTimeInSeconds");
const committedSalt                     = getCookie("committedSalt");
const committedAddressToResolveTo       = getCookie("committedAddressToResolveTo");
const committedCommitmentReadyTimestamp = getCookie("committedCommitmentReadyTimestamp");

const allCookies = [
    committedName,
    committedAddressToRegisterTo,
    committedRegisterForTimeInSeconds,
    committedSalt,
    committedAddressToResolveTo,
    committedCommitmentReadyTimestamp
].filter(Boolean);

console.log("all cookies", allCookies);

const cookiedCommitment = allCookies.length == 6 ? {
    name:                     committedName,
    addressToRegisterTo:      committedAddressToRegisterTo,
    registerForTimeInSeconds: committedRegisterForTimeInSeconds,
    salt:                     committedSalt,
    addressToResolveTo:       committedAddressToResolveTo,
    commitmentReadyTimestamp: committedCommitmentReadyTimestamp
} : null;

console.log("cookiedCommitment", cookiedCommitment);

export default function RegistrationForm() {

    const { chain, chains }  = useNetwork();
    const  provider          = useProvider();
    const  chainId           = useChainId();
    const { openChainModal } = useChainModal();

    console.log("chain", chain);
    console.log("provider", provider);
    console.log("chainId", chainId);

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


    React.useEffect(() => {
        
        console.log("cookie effect", committedName);

        if (committedName != null) {
            setSearchTerm(committedName);
            doSearch(committedName);
        }

    }, [committedName]);


    /**
     * 
     */ 
    const doSearch = (manualSearchTerm?: any) => {

        if (!manualSearchTerm) {
            clearCookies();
        }

        console.log("search man", manualSearchTerm);
        console.log("search", searchTerm);

        var searchTermToUse = typeof manualSearchTerm === "string" ? manualSearchTerm : searchTerm;

        setSearchResults([]);

        //Show error if no input
        if (searchTermToUse == "") { setSearchError("Please enter an input"); return; }

        const nameParts       = searchTermToUse.split(".");
        if (nameParts.length == 1) {
            nameParts.push("eth");
            searchTermToUse = searchTermToUse + ".eth";
        }
        const nameExtension   = nameParts[nameParts.length - 1];
        const isSubname       = nameParts.length == 3 && nameExtension == 'eth';
        const isEth2ld          = nameParts.length == 2 && nameExtension == 'eth';

        //Show error if input not a valid name or subname
        if (!isSubname && !isEth2ld) { setSearchError("Please enter a valid name/subname"); return; }

        setIsSearching(true);

        const newResults = [];
        if (isSubname) { 
            newResults.push({
                name:  searchTermToUse, 
                type:  'subname', 
                nonce: Math.floor(Math.random() * 100000)
            }); 
        }

        if (isEth2ld) { 
            newResults.push({
                name:  searchTermToUse, 
                type:  'name', 
                nonce: Math.floor(Math.random() * 100000)
            }); 

            newResults.push({
                name:  nameParts[0] + ".testing.eth", 
                type:  'subname', 
                nonce: Math.floor(Math.random() * 100000)
            }); 
        }

        setSearchResults(newResults);
    }

    const hasValidNetwork = [foundry.id, goerli.id].includes(chainId);


    const clearCookies = () => {

        console.log("DELETE COOKIES");

        deleteCookie("committedName");
        deleteCookie("committedAddressToRegisterTo");
        deleteCookie("committedRegisterForTimeInSeconds");
        deleteCookie("committedSalt");
        deleteCookie("committedAddressToResolveTo");
        deleteCookie("committedCommitmentReadyTimestamp");
    }

    return (
        <div className = "m-8">

            <Alert className="border-red-800 bg-red-200 dark:bg-red-800 my-8" variant="destructive">
                {CommonIcons.alert}
                <AlertTitle>Testnet</AlertTitle>
                <AlertDescription>
                    <p>Unruggable Names currently only works on <span className = "font-bold">Goerli</span> or on a locally deployed <span className = "font-bold">Foundry</span> node.</p>
                </AlertDescription>
            </Alert>

            <Alert className="border-red-800 bg-red-200 dark:bg-red-800 my-8" variant="destructive">
                {CommonIcons.alert}
                <AlertTitle>Feedback</AlertTitle>
                <AlertDescription>
                    <p>Please help us develop and improve the product by completing our <a href = "https://forms.gle/6oFshRMvXxJBcG6B6" target = "_blank" className = "underline">Feedback Form</a>.</p>
                </AlertDescription>
            </Alert>


            {!hasValidNetwork && (
                <Alert className="border-red-800 bg-red-200 dark:bg-red-800 my-8" variant="destructive">
                    {CommonIcons.alert}
                    <AlertTitle>Invalid network</AlertTitle>
                    <AlertDescription>
                        <p>Unruggable Names currently only works on <span className = "font-bold">Goerli</span> or on a locally deployed <span className = "font-bold">Foundry</span> node.</p>
                        <Button 
                            type      = "submit" 
                            className = "mt-2"
                            onClick   = {openChainModal}>
                            Change Network
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex-center col-span-12 flex flex-col lg:col-span-9">
                <div className="text-center">
                    <h3 className="font-primary text-2xl font-bold lg:text-4xl">
                        <span className="text-gradient-secondary">
                            Let's find you the perfect name
                        </span>
                    </h3>
                </div>
            </div>

            <motion.div
                className   = "flex-center flex h-full w-full my-8"
                variants    = {FADE_DOWN_ANIMATION_VARIANTS}
                initial     = "hidden"
                whileInView = "show"
                animate     = "show"
                viewport    = {{ once: true }}>

                <div className = "flex items-start space-x-2">
                    <div className = "flex flex-col">
                        <Input 
                            type        = "text" 
                            placeholder = "Enter a name.." 
                            onChange    = {(e) => {
                                setSearchError(null);
                                setSearchTerm(e.target.value)
                            }}
                            value       = {searchTerm} />
                        {searchError != null && (
                            <div className = "text-sm text-red-500 flex flex-center mt-2">{searchError}</div>
                        )}
                    </div>
                    <Button 
                        type     = "submit" 
                        disabled = {isSearching || !hasValidNetwork} 
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

                        if (result.type == "subname") {
                            return (
                                <div key = {"result-" + resultIndex}>
                                    <SubnameSearchResultRow 
                                        key             = {"result-row-" + result.name + "-" + result.nonce} {...result} 
                                        resultIndex     = {resultIndex} 
                                        onRegister      = {() => {    
                                            setSearchResults([]);
                                            doSearch();
                                            clearCookies();
                                        }}
                                        doLookup = {(name: any) => {

                                            setSearchError(null);
                                            setSearchTerm(name);
                                            doSearch(name);
                                        }}
                                        cookiedCommitment = {result.name == committedName ? cookiedCommitment : null}
                                        clearCookies = {clearCookies} />

                                <div data-orientation = "horizontal" role = "none" className = "bg-slate-200 dark:bg-slate-700 h-[1px] w-full my-4"></div>
                                </div>
                                    
                            );
                        } else if (result.type == "name") {
                            return (
                                <div key = {"result-" + resultIndex}>
                                    <NameSearchResultRow 
                                        key         = {"name-result-row-" + result.name + "-" + result.nonce} {...result} 
                                        resultIndex = {resultIndex} 
                                        onRegister  = {() => {     
                                            setSearchResults([]);
                                            doSearch();
                                            clearCookies();
                                        }}
                                        cookiedCommitment = {result.name == committedName ? cookiedCommitment : null}
                                        clearCookies = {clearCookies} />

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
