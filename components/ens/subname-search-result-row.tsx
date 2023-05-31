const ethPrice = 1820;

import React                                from 'react'

import classNames                           from 'clsx'
import { ethers }                           from "ethers";
import { 
    useAccount, 
    useProvider, 
    useSigner,
    useNetwork,
    useChainId
}                                           from 'wagmi'

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
}                                           from "@/components/ui/alert-dialog"
import { Button }                           from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
}                                           from "@/components/ui/tooltip"

import { CountdownText }                    from './countdown-text'

import { 
    generateSalt, 
    hexEncodeName,
    getCookie,
    setCookie,
    buildErrorMessage 
}                                           from '../../helpers/Helpers.jsx';

import { 
    useNameWrapperRead,
    useSubnameRegistrar, 
    useSubnameRegistrarCommit, 
    useSubnameRegistrarMakeCommitment, 
    useSubnameRegistrarMinCommitmentAge, 
    useSubnameRegistrarRead, 
    useRenewalControllerRead,
    subnameRegistrarAddress,
    useEthRegistrarControllerRead,
    useEnsRegistryRead 
}                                           from '../../lib/blockchain'
import { SubnameWhoisAlert }                from '../ens/subname-whois-alert'
import CommonIcons                          from '../shared/common-icons';
import { TransactionConfirmationState }     from '../shared/transaction-confirmation-state'

import { useToast }                         from '@/lib/hooks/use-toast'

interface SearchResultRowProps {
    className?:  string,
    name:        string,
    resultIndex: number,
    onRegister?: () => void,
    doLookup?:   any
}


export function SubnameSearchResultRow({ className, name, resultIndex, onRegister, doLookup, cookiedCommitment, clearCookies }: SearchResultRowProps) {

    const provider         = useProvider();
    const chainId          = useChainId();
    const { data: signer } = useSigner()
    const { chain }        = useNetwork()
    const { address }      = useAccount()
    const { toast }        = useToast()

    //SubnameRegistrar instance
    const subnameRegistrar = useSubnameRegistrar({
        signerOrProvider: signer
    });

    //Boolean indiciating if the subname is being registered
    const [isRegistering, setIsRegistering]                             = React.useState(cookiedCommitment != null ? true : false);

    //The unix timestamp at which the commitment becomes valid on chain
    const [commitmentReadyTimestamp, setCommitmentReadyTimestamp]       = React.useState<number | null>(cookiedCommitment?.commitmentReadyTimestamp ?? null);

    //Set once the commitment validity countdown has completed
    const [commitmentCompleteTimestamp, setCommitmentCompleteTimestamp] = React.useState<number | null>(null);


    const namehash: `0x${string}`        = ethers.utils.namehash(name)  as `0x${string}`;

    const nameParts                          = name.split(".");
    nameParts.shift();
    const parentLabel                          = nameParts[0];
    const parentName                           = nameParts.join(".");
    const parentNamehash: `0x${string}`        = ethers.utils.namehash(parentName)  as `0x${string}`;
    const encodedNameToRegister: `0x${string}` = hexEncodeName(name) as `0x${string}`;

    const parentTokenId                         = ethers.BigNumber.from(parentNamehash);


    const  { data: registryOwner }    = useEnsRegistryRead({
        chainId:      chainId,
        functionName: 'owner',
        args:         [namehash],
    });

    const isAvailableRegistry = registryOwner == "0x0000000000000000000000000000000000000000";
    console.log("isAvailableRegistry", isAvailableRegistry);

    //Discern if the subname is available in the SubnameRegistrar
    const  { data: isAvailable }    = useSubnameRegistrarRead({
        chainId: chainId,
        functionName: 'available',
        args:         [encodedNameToRegister],
    });

    console.log("isAvailable", !isAvailable);

    const  { data: isParentAvailable }    = useEthRegistrarControllerRead({
        chainId:      chainId,
        functionName: 'available',
        args:         [parentLabel],
    });

    //Get pricing data for the parent name from the SubnameRegistrar
    const  { data: pricingData }  = useSubnameRegistrarRead({
        chainId: chainId,
        functionName: 'pricingData',
        args:         [parentNamehash],
    });
    const isOfferingSubnames = pricingData && pricingData.offerSubnames;

    console.log("Pricing data", pricingData);

    //Gets owner/expiry/fuses from the namewrapper
    const  { data: parentNameData, refetch: refetchParentData }  = useNameWrapperRead({
        chainId: chainId,
         functionName: 'getData',
         args:         [parentTokenId],
     });
    const {owner: nameWrapperParentOwnerAddress, expiry: parentExpiry, fuses: parentWrapperFuses} = parentNameData ?? {};

    const currentTimestamp = Math.ceil(Date.now() / 1000);
    const maxRegistrationTime = parseInt(parentExpiry?.toString()) - currentTimestamp;
    console.log("PARENT EXPIRY", parentExpiry);
    console.log("PARENT EXPIRY maxRegistrationTime", maxRegistrationTime);

    const addressToRegisterTo      = cookiedCommitment?.addressToRegisterTo ?? address;
    const registerForTimeInSeconds = ethers.BigNumber.from(cookiedCommitment?.registerForTimeInSeconds ?? "31536000");
    const addressToResolveTo       = cookiedCommitment?.addressToResolveTo ?? "0x0000000000000000000000000000000000000000";

    const  { data: rentPrice }  = useSubnameRegistrarRead({
         chainId: chainId,
        functionName: 'rentPrice',
        args:         [encodedNameToRegister, registerForTimeInSeconds],
    });

    console.log("rentprice", rentPrice);

    //A salt for the registration commitment
    const [salt, setSalt] = React.useState<`0x${string}`>(cookiedCommitment?.salt ?? "0x" + generateSalt() as `0x${string}`);

    console.log("encodedNameToRegister", encodedNameToRegister);
    console.log("addressToRegisterTo", addressToRegisterTo);
    console.log("registerForTimeInSeconds", registerForTimeInSeconds);
    console.log("salt", salt);
    console.log("addressToResolveTo", addressToResolveTo);

    //Get the minimum commitment time required for a valid commitment from the SubnameRegistrar
    const { 
        data: MIN_COMMITMENT_TIME_IN_SECONDS 
    }                               = useSubnameRegistrarMinCommitmentAge({
        chainId: chainId,
    });

    //Generate a commitment hash
    const { data: commitment }      = useSubnameRegistrarMakeCommitment({
        chainId: chainId,
        args: [
            encodedNameToRegister, 
            addressToRegisterTo!, 
            salt
        ],
        overrides: {
            gasLimit: ethers.BigNumber.from("200000")
        },
    });


    /**
     * Triggered when register button clicked
     */ 
    const doRegister = () => {

        //Setting this will update the UI
        setIsRegistering(true);
        console.log("register", commitment);
    }


    /**
     * Called back from TransactionConfirmationState component
     */ 
    const onCommitmentConfirmed = async (subnameRegistrar: any) => {

        const time  = await subnameRegistrar.commitments(commitment);
        const block = await provider.getBlock('latest');

        console.log("onCommitmentConfirmed", time.toString());
        console.log("onCommitmentConfirmed block", block);
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const newCommitmentReadyTimestamp = currentTimestamp + parseInt(MIN_COMMITMENT_TIME_IN_SECONDS!.toString()) + 5;

        setCommitmentReadyTimestamp(newCommitmentReadyTimestamp);

        toast({
            duration: 5000,
            className: "bg-green-200 dark:bg-green-800 border-0",
            description: "Your commitment has been confirmed on chain.",
        })

        console.log("SETTING COOKIES");

        setCookie("committedName", name);
        setCookie("committedAddressToRegisterTo", addressToRegisterTo);
        setCookie("committedRegisterForTimeInSeconds", registerForTimeInSeconds);
        setCookie("committedSalt", salt);
        setCookie("committedAddressToResolveTo", addressToResolveTo);
        setCookie("committedCommitmentReadyTimestamp", newCommitmentReadyTimestamp);
    }


    /**
     * Called back from CountdownText when the commitment countdown has completed
     */ 
    const onCommitmentBecomesValid = () => {

        console.log("onCommitmentBecomesValid");
        const currentTimestamp = Math.floor(Date.now() / 1000);
        setCommitmentCompleteTimestamp(currentTimestamp);
    }

    console.log("LAAA", subnameRegistrarAddress[chainId]);

    return (
        <div className = {classNames(className)}>
            <div className = {classNames("bg-slate-50 dark:bg-slate-800", "p-4", 'flex flex-wrap justify-between items-center align-center w-full')}>
                <div className = "text-center m-2 grow basis-0 min-w-[200px]">
                    {name}
                    <div 
                        className   = "cursor-pointer text-xs underline" 
                        onClick     = {() => { doLookup(parentName); }}>
                        view parent
                    </div>
                </div>
                
                <div className = "m-2 grow basis-0 text-center min-w-[200px]">

                    {isParentAvailable && (
                        <p><span className = "font-bold">{parentName}</span> is not registered.</p>
                    )}

                    {!isParentAvailable && !isAvailableRegistry && (
                        <>
                            {CommonIcons.cross} 
                            <div className = "ml-2">   
                                <span>Registered</span>
                                <div className = "w-1" />
                                <AlertDialog key = {"whois-" + name} >
                                    <AlertDialogTrigger asChild>
                                        <span className = "cursor-pointer text-xs underline">more info</span>
                                    </AlertDialogTrigger>
                                    <SubnameWhoisAlert key = {"alert-" + name} name = {name} />
                                </AlertDialog>
                            </div>
                        </>
                    )}

                    {!isParentAvailable && isAvailableRegistry && !isOfferingSubnames && (
                        <div className = "p-2 text-center">Not offering subnames</div>
                    )}

                    {!isParentAvailable && isAvailableRegistry && isOfferingSubnames && isAvailable && (
                        <div key = {"available-" + name}>
                            {CommonIcons.check}<span className = "ml-1">Available</span>
                        </div>
                    )}
                </div>

                <div className = "m-2 grow basis-0 text-center min-w-[200px]">
                    {isAvailable && rentPrice && (
                        <>
                            {rentPrice > 0 ? (
                                <>
                                    <span>Ξ {ethers.utils.formatEther(rentPrice.toString())}</span>
                                    <div className = "text-xs text-center text-green-800 mt-2">${Math.round(ethers.utils.formatEther(rentPrice.toString()) * ethPrice)}</div>
                                </>
                            ) : (
                                <span>FREE</span>
                            )}
                        </>
                    )}
                </div>

                {isAvailable && (
                    <div className = "m-2 grow basis-0 text-center min-w-[200px]">
                        {isRegistering ? (
                            <>
                                {/* Set when the transaction is committed and 60 seconds has passed */}
                                {!commitmentCompleteTimestamp ? (
                                    <>
                                        {commitmentReadyTimestamp ? (
                                            <CountdownText 
                                                timestamp  = {commitmentReadyTimestamp}
                                                onComplete = {onCommitmentBecomesValid} />
                                        ) : (
                                            <>
                                                {commitment != null && (
                                                    <TransactionConfirmationState 
                                                        key      = {"commitment-" + resultIndex}
                                                        contract = {subnameRegistrar}
                                                        txArgs   = {{
                                                            address: subnameRegistrarAddress[chainId],
                                                            args: [
                                                                commitment, //secret
                                                            ],
                                                            overrides: {
                                                                gasLimit: ethers.BigNumber.from("200000")
                                                            }
                                                        }}
                                                        txFunction  = 'commit'
                                                        onConfirmed = {onCommitmentConfirmed}
                                                        onError     = {(error) => {

                                                            console.log("error", error.code);

                                                            toast({
                                                                duration: 5000,
                                                                className: "bg-red-200 dark:bg-red-800 border-0",
                                                                description: (<p>{buildErrorMessage(error)}</p>),
                                                            });
                                                        }}>
                                                            <div>
                                                                {CommonIcons.miniLoader} Submitting registration commitment..
                                                            </div>
                                                            <div>
                                                                {commitmentReadyTimestamp && (
                                                                    <CountdownText 
                                                                        timestamp  = {commitmentReadyTimestamp}
                                                                        onComplete = {onCommitmentBecomesValid} />
                                                                )}
                                                            </div>
                                                    </ TransactionConfirmationState>
                                                )}
                                            </>
                                        )}
                                    </>

                                ) : (

                                    <TransactionConfirmationState 
                                        key      = {"registration-" + resultIndex}
                                        contract = {subnameRegistrar}
                                        txArgs   = {{
                                            address: subnameRegistrarAddress[chainId],
                                            args: [
                                                encodedNameToRegister,
                                                addressToRegisterTo, //owner
                                                '0x9A676e781A523b5d0C0e43731313A708CB607508', //referer
                                                registerForTimeInSeconds,
                                                salt, //secret
                                                addressToResolveTo, //resolver
                                                [], //calldata
                                                0 //fuses
                                            ],
                                            overrides: {
                                                gasLimit: ethers.BigNumber.from("500000"),
                                                value:    rentPrice?.mul("2").toString()
                                            }
                                        }}
                                        txFunction  = 'register'
                                        onBefore    = {clearCookies}
                                        onConfirmed = {() => {
                                            console.log("Registration confirmed la");
                                            toast({
                                                duration: 5000,
                                                className: "bg-green-200 dark:bg-green-800 border-0",
                                                description: (
                                                    <p>
                                                        You have successfully registered <span className = "font-bold">{name}</span>.
                                                    </p>
                                                ),
                                            });
                                            onRegister?.();
                                        }}
                                        onError = {(error) => {

                                            console.log("error", error);
                                            toast({
                                                duration: 5000,
                                                className: "bg-red-200 dark:bg-red-800 border-0",
                                                description: (<p>{buildErrorMessage(error)}</p>),
                                            });
                                        }}>
                                        <div>
                                            {CommonIcons.miniLoader} Registering name..
                                        </div>
                                        <div>
                                            SUCCESS
                                        </div>
                                    </ TransactionConfirmationState>
                                )}
                            </>

                        ) : (
                            <>
                                {!address ? (
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button 
                                                type      = "submit" 
                                                disabled  = {isRegistering || !address} 
                                                onClick   = {doRegister}>
                                                    {isRegistering && CommonIcons.miniLoader}
                                                    Register
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Connect a wallet to register <span className = "font-bold">{name}</span></p>
                                        </TooltipContent>
                                    </Tooltip>
                                ) : (
                                    <Button 
                                        type      = "submit" 
                                        disabled  = {isRegistering || !address} 
                                        onClick   = {doRegister}>
                                            {isRegistering && CommonIcons.miniLoader}
                                            Register
                                    </Button>
                                )}
                            </>
                        )}  
                    </div>
                )}
            </div>
        </div>
    )
}
