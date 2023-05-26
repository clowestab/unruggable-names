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
  hexEncodeName 
}                                           from '../../helpers/Helpers.jsx';
import { 
    useNameWrapperRead,
    useSubnameRegistrar, 
    useSubnameRegistrarCommit, 
    useSubnameRegistrarMakeCommitment, 
    useSubnameRegistrarMinCommitmentAge, 
    useSubnameRegistrarRead, 
    useRenewalControllerRead,
    subnameRegistrarAddress 
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


export function SubnameSearchResultRow({ className, name, resultIndex, onRegister, doLookup }: SearchResultRowProps) {

    const provider         = useProvider();
    const  chainId   = useChainId();
    const { data: signer } = useSigner()
    const { chain }        = useNetwork()
    const { address }      = useAccount()
    const { toast }        = useToast()

    //SubnameRegistrar instance
    const subnameRegistrar = useSubnameRegistrar({
        signerOrProvider: signer
    });

    //Boolean indiciating if the subname is being registered
    const [isRegistering, setIsRegistering]                             = React.useState(false);

    //The unix timestamp at which the commitment becomes valid on chain
    const [commitmentReadyTimestamp, setCommitmentReadyTimestamp]       = React.useState<number | null>(null);

    //Set once the commitment validity countdown has completed
    const [commitmentCompleteTimestamp, setCommitmentCompleteTimestamp] = React.useState<number | null>(null);

    const nameParts                          = name.split(".");
    nameParts.shift();
    const parentName                           = nameParts.join(".");
    const parentNamehash: `0x${string}`        = ethers.utils.namehash(parentName)  as `0x${string}`;
    const encodedNameToRegister: `0x${string}` = hexEncodeName(name) as `0x${string}`;

    const parentTokenId                         = ethers.BigNumber.from(parentNamehash);


    //Discern if the subname is available in the SubnameRegistrar
    const  { data: isAvailable }    = useSubnameRegistrarRead({
        chainId: chainId,
        functionName: 'available',
        args:         [encodedNameToRegister],
    });

    console.log("isAvailable", !isAvailable);

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

    const addressToRegisterTo      = address;
    const registerForTimeInSeconds = ethers.BigNumber.from("31536000");;
    const addressToResolveTo       = "0x0000000000000000000000000000000000000000";

    const  { data: rentPrice }  = useSubnameRegistrarRead({
         chainId: chainId,
        functionName: 'rentPrice',
        args:         [encodedNameToRegister, registerForTimeInSeconds],
    });

    console.log("rentprice", rentPrice);

    //A salt for the registration commitment
    const [salt, setSalt] = React.useState<`0x${string}`>(`0x${generateSalt()}`);

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
        setCommitmentReadyTimestamp(currentTimestamp + parseInt(MIN_COMMITMENT_TIME_IN_SECONDS!.toString()) + 2);
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
        <div className = {classNames(className, 'flex')}>
            <div className = {classNames("bg-slate-50 dark:bg-slate-800", "p-4", 'flex justify-center items-center w-full')}>
                <div className = "text-center">
                    {name}
                    <div 
                        className   = "cursor-pointer text-xs underline" 
                        onClick     = {() => { doLookup(parentName); }}>
                        view parent
                    </div>
                </div>
                <div className = "w-8" />
                <div className = "flex items-center justify-center">
                    {isAvailable ? (
                        <React.Fragment key = {"available-" + name}>
                            {CommonIcons.check}<div className = "w-1" /> Available
                        </React.Fragment>
                    ) : (
                        <React.Fragment key = {"taken-" + name}>
                            {CommonIcons.cross}<div className = "w-1" /> 
                            {isOfferingSubnames ? (
                                <div>
                                    <span>Registered</span>
                                    <div className = "w-1" />
                                    <AlertDialog key = {"whois-" + name} >
                                        <AlertDialogTrigger asChild>
                                            <span className = "cursor-pointer text-xs underline">more info</span>
                                        </AlertDialogTrigger>
                                        <SubnameWhoisAlert key = {"alert-" + name} name = {name} />
                                    </AlertDialog>
                                </div>
                            ) : (
                                <span>Not offering subnames</span>
                            )}
                        </React.Fragment>
                    )}
                </div>

                <div className = "w-8" />

                <div className = "flex items-center justify-center">
                    {isAvailable && rentPrice && (
                        <div>
                        <span>Ξ {ethers.utils.formatEther(rentPrice.toString())}</span>
                        <div className = "text-xs text-center text-green-800 mt-2">${Math.round(ethers.utils.formatEther(rentPrice.toString()) * ethPrice)}</div>

                        </div>
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
                                                    address: subnameRegistrarAddress[chainId],
                                                    args: [
                                                        commitment, //secret
                                                    ],
                                                    overrides: {
                                                        gasLimit: ethers.BigNumber.from("200000")
                                                    }
                                                }}
                                                txFunction  = 'commit'
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
                            <Button 
                                type      = "submit" 
                                disabled  = {isRegistering || !address} 
                                onClick   = {doRegister}>
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