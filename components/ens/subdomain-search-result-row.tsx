import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
}                                           from "@/components/ui/alert-dialog"

import React                                from 'react'

import classNames                           from 'clsx'

import { TransactionConfirmationState }     from '../shared/transaction-confirmation-state'
import { SubdomainWhoisAlert }              from '../ens/subdomain-whois-alert'
import { CountdownText }                    from './countdown-text'

import { foundry }                          from 'wagmi/chains'

import { HiCheckCircle, HiXCircle }         from 'react-icons/hi'
import { Button }                           from "@/components/ui/button"

import { 
    useSubnameRegistrar, 
    useSubnameRegistrarRegister, 
    useSubnameRegistrarRead, 
    useSubnameRegistrarMinCommitmentAge, 
    useSubnameRegistrarCommit, 
    useSubnameRegistrarMakeCommitment, 
    useSubnameRegistrarCommitments 
}                                           from '../../lib/blockchain'

import { 
    useAccount, 
    useProvider, 
    useSigner,
    useWaitForTransaction 
}                                           from 'wagmi'

import { 
  generateSalt,
  hexEncodeName 
}                                           from '../../helpers/Helpers.jsx';

import { ethers }                           from "ethers";
import CommonIcons                          from '../shared/common-icons';

import {
    renewalControllerAddress,
    subnameRegistrarAddress,
    subnameWrapperAddress,
}                                           from '../../helpers/contract-addresses.tsx';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
}                                           from "@/components/ui/tooltip"

const REGISTRATION_STATE = {
    COMMITTED:  'COMMITTED',
    REGISTERED: 'REGISTERED',
}

interface SearchResultRowProps {
  className?: string
}


export function SubdomainSearchResultRow({ className, name, resultIndex, onRegister }: SearchResultRowProps) {

    const provider                                          = useProvider();
    const { data: signer, isErrorSigner, isLoadingSigner }  = useSigner()
    const { address }                                       = useAccount()

    const subnameRegistrar = useSubnameRegistrar({
        address:          subnameRegistrarAddress,
        chainId:          foundry.id,
        signerOrProvider: signer
    });

    console.log("subnameRegistrar", subnameRegistrar);

    const [isRegistering, setIsRegistering]                             = React.useState(false);
    const [commitmentReadyTimestamp, setCommitmentReadyTimestamp]       = React.useState(false);
    const [commitmentCompleteTimestamp, setCommitmentCompleteTimestamp] = React.useState(false);

    const domainParts           = name.split(".");
    domainParts.shift();
    const parentName        = domainParts.join(".");
    const parentNamehash      = ethers.utils.namehash(parentName);
    const encodedNameToRegister     = hexEncodeName(name);

    const  { data: isAvailable }    = useSubnameRegistrarRead({
        address:      subnameRegistrarAddress,
        functionName: 'available',
        args:         [encodedNameToRegister],
        chainId:      foundry.id
    });

    console.log("isAvailable", !isAvailable);

    const  { data: pricingData }  = useSubnameRegistrarRead({
        address:      subnameRegistrarAddress,
        functionName: 'pricingData',
        args:         [parentNamehash],
        chainId:      foundry.id
    });
    const isOfferingSubdomains = pricingData && pricingData.offerSubnames;

    console.log("Pricing data", pricingData);

    const addressToRegisterTo      = address;
    const registerForTimeInSeconds = 10000000;//31536000;
    const addressToResolveTo       = "0x0000000000000000000000000000000000000000";

    const  { data: rentPrice }  = useSubnameRegistrarRead({
        address:      subnameRegistrarAddress,
        functionName: 'rentPrice',
        args:         [encodedNameToRegister, registerForTimeInSeconds],
        chainId:      foundry.id
    });

    console.log("rentprice", rentPrice);

    const [salt, setSalt] = React.useState("0x" + generateSalt());

    console.log("encodedNameToRegister", encodedNameToRegister);
    console.log("addressToRegisterTo", addressToRegisterTo);
    console.log("registerForTimeInSeconds", registerForTimeInSeconds);
    console.log("salt", salt);
    console.log("addressToResolveTo", addressToResolveTo);

    const { data: MIN_COMMITMENT_TIME_IN_SECONDS } = useSubnameRegistrarMinCommitmentAge({
        address: subnameRegistrarAddress,
        chainId: foundry.id
    });

    console.log("MIN_COMMITMENT_TIME_IN_SECONDS", MIN_COMMITMENT_TIME_IN_SECONDS?.toString());

    const { data: commitment } = useSubnameRegistrarMakeCommitment({
        address: subnameRegistrarAddress,
        args: [
            encodedNameToRegister, 
            addressToRegisterTo, 
            registerForTimeInSeconds, 
            salt, 
            addressToResolveTo, 
            [], 
            0
        ],
        overrides: {
            gasLimit: 200000
        },
        //chainId: foundry.id
    });


    /**
     * Triggered when register button clicked
     */ 
    const doRegister = () => {
        setIsRegistering(true);

        console.log("register", commitment);
    }


    /**
     * Called back from TransactionConfirmationState component
     */ 
    const onCommitmentConfirmed = async (subnameRegistrar) => {

        const time  = await subnameRegistrar.commitments(commitment);
        const block = await provider.getBlock('latest');

        console.log("onCommitmentConfirmed", time.toString());
        console.log("onCommitmentConfirmed block", block);
        const currentTimestamp = Math.floor(Date.now() / 1000);
        setCommitmentReadyTimestamp(currentTimestamp + parseInt(MIN_COMMITMENT_TIME_IN_SECONDS.toString()));
    }


    /**
     * Called back from CountdownText when the commitment countdown has completed
     */ 
    const onCommitmentBecomesValid = () => {

        console.log("onCommitmentBecomesValid");
        const currentTimestamp = Math.floor(Date.now() / 1000);
        setCommitmentCompleteTimestamp(currentTimestamp);
    }


    const classes = classNames(className, 'flex');


  return (
    <div className = {classes}>
        <div className = {classNames({ "bg-green-100": isAvailable, "bg-red-100": isOfferingSubdomains && !isAvailable, "bg-orange-100": !isOfferingSubdomains }, "p-4", 'flex justify-center items-center')}>
            <>{name}</>
            <div className = "w-8" />
            <div className = "flex justify-center items-center">
                {isAvailable ? (
                    <React.Fragment key = {"available-" + name}>
                        <HiCheckCircle /><div className = "w-1" /> Available
                    </React.Fragment>
                ) : (
                    <React.Fragment key = {"taken-" + name}>
                        <HiXCircle /><div className = "w-1" /> 
                        {isOfferingSubdomains ? (
                            <div>
                                <span>Registered</span>
                                <div className = "w-1" />
                                <AlertDialog key = {"whois-" + name} >
                                    <AlertDialogTrigger asChild>
                                        <span className = "text-xs underline cursor-pointer">whois</span>
                                    </AlertDialogTrigger>
                                    <SubdomainWhoisAlert key = {"alert-" + name} name = {name} />
                                </AlertDialog>
                            </div>
                        ) : (
                            <span>Not offering subdomains</span>
                        )}
                    </React.Fragment>
                )}
            </div>

            <div className = "w-8" />

            <div className = "flex justify-center items-center">
                {isAvailable && rentPrice && (
                    <span>Ξ {ethers.utils.formatEther(rentPrice.toString())}</span>
                )}
            </div>

            <div className = "w-8" />

            {isAvailable && (
                <>
                    {isRegistering ? (
                        <>
                            {/* Set when the transaction is committed and 60 seconds has passed */}
                            {!commitmentCompleteTimestamp ? (

                                <>
                                    {commitment != null && (
                                        <TransactionConfirmationState 
                                            key      = {"commitment-" + resultIndex}
                                            contract = {subnameRegistrar}
                                            txArgs   = {{
                                                address: subnameRegistrarAddress,
                                                args: [
                                                    commitment, //secret
                                                ],
                                                overrides: {
                                                    gasLimit: 200000
                                                }
                                            }}
                                            txFunction = 'commit'
                                            onConfirmed = {onCommitmentConfirmed}>
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
                        ) : (

                            <TransactionConfirmationState 
                                key      = {"registration-" + resultIndex}
                                contract = {subnameRegistrar}
                                txArgs   = {{
                                    address: subnameRegistrarAddress,
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
                                        gasLimit: 500000,
                                        value:    rentPrice.toString()
                                    }
                                }}
                                txFunction  = 'register'
                                onConfirmed = {() => {
                                    console.log("Registration confirmed");
                                    onRegister?.();
                                }}>
                                <div>
                                    {CommonIcons.miniLoader} Registering domain..
                                </div>
                                <div>
                                    SUCCESS
                                </div>
                            </ TransactionConfirmationState>
                        )}
                    </>

                ) : (
                    <>
                        <Button 
                            type      = "submit" 
                            disabled  = {isRegistering || !address} 
                            onClick   = {doRegister} 
                            className = "disabled:cursor-not-allowed">
                                {isRegistering && CommonIcons.miniLoader}
                                Register
                        </Button>

                        {!address && (
                            <div className = "ml-2">
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <span className = "cursor-pointer">{CommonIcons.tooltip}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Connect a wallet to register <span className = "font-bold">{name}</span></p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        )}
                    </>
                )}  
                </>
            )}
        </div>
    </div>
  )
}
