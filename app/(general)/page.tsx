'use client'

import {
  useChainModal,
}                                       from '@rainbow-me/rainbowkit';

import ConfettiExplosion                from 'react-confetti-explosion';

import { 
    chains, 
    provider as rkprovider 
}                                       from '@/config/networks'

import { 
    useNetwork, 
    useProvider, 
    useChainId 
}                                       from 'wagmi'

import { motion }                       from 'framer-motion'

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

import { sepolia }              from 'wagmi/chains'

import { 
    getCookie,
    setCookie,
    deleteCookie
}                                       from '@/helpers/Helpers.ts';

import {
    ETHEREUM_CHAIN_ID,
    OPTIMISM_CHAIN_ID
}                                       from '@/helpers/constants'

import { SubnameSearchResultRow }       from '@/components/ens/subname-search-result-row'
import { NameSearchResultRow }          from '@/components/ens/name-search-result-row'

import {ens_normalize}                  from '@adraffy/ens-normalize'; // or require()

interface SearchResult {
    name:  string,
    type:  string,
    nonce: number
}

//Get any stored cookies
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

//We need all 6 cookies for it to be valid data
const cookiedCommitment = allCookies.length == 6 ? {
    name:                     committedName,
    addressToRegisterTo:      committedAddressToRegisterTo,
    registerForTimeInSeconds: committedRegisterForTimeInSeconds,
    salt:                     committedSalt,
    addressToResolveTo:       committedAddressToResolveTo,
    commitmentReadyTimestamp: committedCommitmentReadyTimestamp
} : null;

//Properties for opening a names profile by default
interface RegistrationFormProps {
    nameToOpen: string
}

export default function RegistrationForm({ nameToOpen } : RegistrationFormProps) {

    const { chain, chains }  = useNetwork();

    const ethereumProvider   = useProvider({chainId: ETHEREUM_CHAIN_ID});
    const optimismProvider   = useProvider({chainId: OPTIMISM_CHAIN_ID});
    const chainId            = useChainId();
    const { openChainModal } = useChainModal();

    console.log("chain", chain);
    console.log("ethereumProvider", ethereumProvider);
    console.log("optimismProvider", optimismProvider);
    console.log("chainId", chainId);

    const [
        currentlyOpenName, 
        setCurrentlyOpenName
    ]                                           = React.useState<string | null>(nameToOpen ? nameToOpen : null);
    const [searchTerm, setSearchTerm]           = React.useState<string>(nameToOpen ?? "");
    const [searchError, setSearchError]         = React.useState<string | null>(null);
    const [searchResults, setSearchResults]     = React.useState<SearchResult[]>([]);
    const [isSearching, setIsSearching]         = React.useState<boolean>(false);

    const [isExploding, setIsExploding]         = React.useState(false);


    /**
     * Effect to hide the loader when searching ends
     */ 
    /*React.useEffect(() => {
        
        if (isExploding) {

            console.log("reset explosion");

            setTimeout(() => {
                setIsExploding(false);
            }, 2000);
        }

    }, [isExploding]);*/


    /**
     * Effect to hide the loader when searching ends
     */ 
    React.useEffect(() => {
        
        setIsSearching(false);

    }, [searchResults]);


    React.useEffect(() => {
        
        console.log("cookie effect", committedName);

        if (committedName != null || nameToOpen != null) {

            const nameToSet = committedName ?? nameToOpen;

            console.log("nameToSeti", nameToOpen);
            console.log("nameToSet", nameToSet);

            setSearchTerm(nameToSet);
            doSearch(nameToSet);
        }

    }, [committedName, nameToOpen]);


    /**
     * 
     */ 
    const doSearch = (manualSearchTerm?: any) => {

        const hasManualSearchTerm = typeof manualSearchTerm === "string";

        console.log("manualSearchTerm", manualSearchTerm);
        console.log("manualSearchTerm " + manualSearchTerm, hasManualSearchTerm);

        if (!hasManualSearchTerm) {
            clearCookies();
            setCurrentlyOpenName(null);
        }

        console.log("search man", manualSearchTerm);
        console.log("search", searchTerm);

        var searchTermToUse = hasManualSearchTerm ? manualSearchTerm : searchTerm;

        try {
            searchTermToUse = ens_normalize(searchTermToUse);
        } catch (error) {

            console.log("error", error);
            console.log("error", error.message);
            setSearchError(error.message); return;
        }

        setSearchResults([]);

        //Show error if no input
        if (searchTermToUse == "") { setSearchError("Please enter an input"); return; }

        const nameParts       = searchTermToUse.split(".");
        if (nameParts.length == 1 || nameParts[nameParts.length - 1] != "eth") {
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
                name:  nameParts[0] + ".fivedollars.eth", 
                type:  'subname', 
                nonce: Math.floor(Math.random() * 100000)
            }); 

            newResults.push({
                name:  nameParts[0] + ".pricepercharacter.eth", 
                type:  'subname', 
                nonce: Math.floor(Math.random() * 100000)
            });
        }

        setSearchResults(newResults);
    }

    const hasValidNetwork = [sepolia.id, OPTIMISM_CHAIN_ID].includes(chain?.id);

    console.log("VALID net", hasValidNetwork);
    console.log("VALID net chain", chainId);

    const clearCookies = () => {

        console.log("DELETE COOKIES");

        deleteCookie("committedName");
        deleteCookie("committedAddressToRegisterTo");
        deleteCookie("committedRegisterForTimeInSeconds");
        deleteCookie("committedSalt");
        deleteCookie("committedAddressToResolveTo");
        deleteCookie("committedCommitmentReadyTimestamp");
    }

    const onRegisterComplete = (registeredName) => {

        //Redo the search to update availability
        setSearchResults([]);
        doSearch();

        //Clear any commitment cookies
        clearCookies();

        //Display confetti
        setIsExploding(registeredName); 
    }

    const rowSeparator = (<div data-orientation = "horizontal" role = "none" className = "bg-slate-200 dark:bg-slate-700 h-[1px] w-full my-4"></div>);

    return (
        <div className = "mx-8 p-4 w-full">

            {isExploding && <ConfettiExplosion onComplete = {() => { 
                
                setCurrentlyOpenName(isExploding);
                window.history.pushState({page: "another"}, "another page", "/" + isExploding);
                setIsExploding(false);

            }} />}


            <Alert className="border-red-800 bg-red-200 dark:bg-red-800 mb-8" variant="destructive">
                {CommonIcons.alert}
                <AlertTitle>ENS Chain L2 Demo</AlertTitle>
                <AlertDescription>
                    <p className = "mt-2">This version of Unruggable Names runs using custom smart contract deployments on <span className = "font-bold">Sepolia</span> (L1) and our OP stack based <span className = "font-bold">ENS Chain</span> (L2).</p>

                    <p className = "mt-2">These smart contract are open source and accessible on <a href = "https://github.com/unruggable-labs/L2-ens/" target = "_blank" className = "underline">Github</a>. We welcome contributions.</p>

                    <p className = "mt-2">Please help us develop and improve the product by completing our <a href = "https://forms.gle/6oFshRMvXxJBcG6B6" target = "_blank" className = "underline">Feedback Form</a>.</p>
                </AlertDescription>
            </Alert>

            {!hasValidNetwork && (
                <Alert className="border-red-800 bg-red-200 dark:bg-red-800 my-8" variant="destructive">
                    {CommonIcons.alert}
                    <AlertTitle>Invalid network</AlertTitle>
                    <AlertDescription>
                        <p>This demo works with the <span className = "font-bold">Sepolia</span> testnetwork (L1) and our OP stack based <span className = "font-bold">ENS Chain</span> (L2).</p>
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
                                setSearchTerm(e.target.value.toLowerCase())
                                if (true) {

                                    const path = window.location.pathname;

                                    console.log("changing", path);
                                    window.history.pushState({page: "another"}, "another page", "/");

                                }
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
                <>
                    <h2 className = "text-2xl font-semibold tracking-tight mt-8">Search results</h2>
                    <p className = "text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Top picks for you based on your search input.
                    </p>

                    {searchResults.map((result, resultIndex) => {

                        if (result.type == "subname") {
                            
                            return (
                                <div key = {"result-row-" + result.name + "-" + result.nonce + (currentlyOpenName == result.name ? "-open" : "-closed")}>
                                    <SubnameSearchResultRow 
                                        {...result} 
                                        resultIndex     = {resultIndex} 
                                        onRegister      = {() => onRegisterComplete(result.name)}
                                        doLookup        = {(name: any) => {

                                            //Clear any errors
                                            setSearchError(null);

                                            setSearchTerm(name);
                                            doSearch(name);
                                        }}
                                        cookiedCommitment = {result.name == committedName ? cookiedCommitment : null}
                                        clearCookies      = {clearCookies}
                                        dialogStartsOpen  = {currentlyOpenName == result.name} />

                                    {rowSeparator}
                                </div>
                                    
                            );
                        } else if (result.type == "name") {
                            return (
                                <div key = {"name-result-row-" + result.name + "-" + result.nonce + (currentlyOpenName == result.name ? "-open" : "-closed")}>
                                    <NameSearchResultRow 
                                        {...result} 
                                        resultIndex         = {resultIndex} 
                                        onRegister          = {() => onRegisterComplete(result.name)}

                                        cookiedCommitment   = {result.name == committedName ? cookiedCommitment : null}
                                        clearCookies        = {clearCookies}
                                        dialogStartsOpen    = {currentlyOpenName == result.name} />

                                    {rowSeparator}
                                </div>  
                            );
                        }
                    })}
                </>
            )}
        </div>
    )
}
