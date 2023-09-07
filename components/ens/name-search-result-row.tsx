import React                            from 'react'

import classNames                       from 'clsx'
import { ethers }                       from "ethers";
import { 
    useAccount,
    useProvider, 
    useSigner, 
    useNetwork,
    useChainId 
}                                       from 'wagmi'

import {
  AlertDialog,
  AlertDialogTrigger,
}                                       from "@/components/ui/alert-dialog"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
}                                       from "@/components/ui/select"

import { Button }                       from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
}                                       from "@/components/ui/tooltip"

import { CountdownText }                from './countdown-text'
import { 
    generateSalt, 
    hexEncodeName,
    setCookie,
    buildErrorMessage,
    parseName,
    getUnruggableName  
}                                       from '../../helpers/Helpers.jsx';
import {
    ZERO_ADDRESS,
    FUSES,
    ETHEREUM_CHAIN_ID,
    OPTIMISM_CHAIN_ID
}                                       from '../../helpers/constants'
import { 
    useL2EthRegistrar, 
    useL2EthRegistrarMakeCommitment, 
    useL2EthRegistrarMinCommitmentAge, 
    useL2EthRegistrarRead, 
    useL2SubnameRegistrarPricingData,
    l2EthRegistrarAddress,
    ethRegistrarControllerAddress,
    useEthRegistrarController,
    useEthRegistrarControllerRead,
    useEthRegistrarControllerMinCommitmentAge,
    useEthRegistrarControllerMakeCommitment
}                                       from '../../lib/blockchain'
import { NameWhoisAlert }               from '../ens/name-whois-alert'
import CommonIcons                      from '../shared/common-icons';
import { TransactionConfirmationState } from '../shared/transaction-confirmation-state'

import { useToast }                     from '@/lib/hooks/use-toast'

import {
    renewalLengthOptions,
}                                       from '../../helpers/select-options';

interface SearchResultRowProps {
    name:              string,      //The name
    resultIndex:       number,      //Index of the result
    onRegister?:       () => void,  //Callback for after the name is registered
    doLookup?:         any,         //Allows us to lookup a name
    dialogStartsOpen?: boolean      //Indicates if the profile dialog for this name should be open initially
}


export function NameSearchResultRow({ name, resultIndex, onRegister, cookiedCommitment, clearCookies, dialogStartsOpen }: SearchResultRowProps) {

    console.log("received cookiedCommitment", cookiedCommitment);

    const provider                      = useProvider();
    const chainId                       = useChainId();
    const { data: ethereumSigner }      = useSigner({
        chainId: ETHEREUM_CHAIN_ID,
    })
    const { data: optimismSigner }      = useSigner({
        chainId: OPTIMISM_CHAIN_ID,
    })
    const { address }                   = useAccount()
    const { chain }                     = useNetwork()
    const { toast }                     = useToast()

    //EthRegistrarController instance
    const ethRegistrarController        = useEthRegistrarController({
        chainId: ETHEREUM_CHAIN_ID,
        signerOrProvider: ethereumSigner
    });

    const l2EthRegistrar                = useL2EthRegistrar({
        chainId:          OPTIMISM_CHAIN_ID,
        signerOrProvider: optimismSigner
    });

    //If the profile dialog for this name is open
    const [
        isDialogOpen, 
        setIsDialogOpen
    ]                                   = React.useState(dialogStartsOpen ? true : false);

    //Boolean indiciating if the name is being registered
    const [
        isRegistering, 
        setIsRegistering
    ]                                   = React.useState(cookiedCommitment != null ? true : false);

    //Holds the selected time in seconds for a registration
    const [
        registerForTimeInSeconds, 
        setRegisterForTimeInSeconds
    ]                                   = React.useState(ethers.BigNumber.from(cookiedCommitment?.registerForTimeInSeconds ?? renewalLengthOptions[0].value));

    //The unix timestamp at which the commitment becomes valid on chain
    const [
        commitmentReadyTimestamp, 
        setCommitmentReadyTimestamp
    ]                                   = React.useState<number | null>(cookiedCommitment?.commitmentReadyTimestamp ?? null);

    //Set once the commitment validity countdown has completed
    const [
        commitmentCompleteTimestamp, 
        setCommitmentCompleteTimestamp
    ]                                   = React.useState<number | null>(null);

    const { 
        label,
        namehash, 
        dnsEncodedName 
    }                                     = parseName(name);

    const  { 
        data:      isValid, 
        isLoading: isLoadingValid 
    }                                   = useEthRegistrarControllerRead({
        chainId:      ETHEREUM_CHAIN_ID,
        functionName: 'valid',
        args:         [label],
    });

    console.log("b4 isAval", isValid);

    const  { 
        data:      isAvailable, 
        isLoading: isLoadingAvailability 
    }                                   = useEthRegistrarControllerRead({
        chainId:      ETHEREUM_CHAIN_ID,
        functionName: 'available',
        args:         [label],
    });

    console.log("isAval", isAvailable);

    const  { data: pricingData }        = useL2SubnameRegistrarPricingData({
        chainId: OPTIMISM_CHAIN_ID,
        args:    [namehash],
     });

    const addressToRegisterTo           = cookiedCommitment?.addressToRegisterTo ?? address;
    const addressToResolveTo            = cookiedCommitment?.addressToResolveTo ?? ZERO_ADDRESS;

    const  { data: rentPrice }          = useEthRegistrarControllerRead({
        chainId:      ETHEREUM_CHAIN_ID,
        functionName: 'rentPrice',
        args:         [label, registerForTimeInSeconds],
     });

    console.log("rentPrice", rentPrice);

    const  { data: registerPriceData }          = useL2EthRegistrarRead({
        chainId:      OPTIMISM_CHAIN_ID,
        functionName: 'rentPrice',
        args:         [dnsEncodedName, registerForTimeInSeconds],
     });

    //A salt for the registration commitment
    const [salt, setSalt]               = React.useState<`0x${string}`>(cookiedCommitment?.salt ?? "0x" + generateSalt() as `0x${string}`);

    console.log("salt", salt);

    console.log("addressToRegisterTo", addressToRegisterTo);
    console.log("registerForTimeInSeconds", registerForTimeInSeconds);
    console.log("salt", salt);
    console.log("addressToResolveTo", addressToResolveTo);

    const { 
        data: MIN_COMMITMENT_TIME_IN_SECONDS 
    }                                   = useEthRegistrarControllerMinCommitmentAge({
        chainId: ETHEREUM_CHAIN_ID
    });


    const { data: commitment }          = useEthRegistrarControllerMakeCommitment({
        chainId: ETHEREUM_CHAIN_ID,
        args: [
            label, 
            addressToRegisterTo!, 
            registerForTimeInSeconds, 
            salt, 
            addressToResolveTo, 
            [], 
            false,
            (FUSES.CANNOT_UNWRAP)
        ],
        overrides: {
            gasLimit: ethers.BigNumber.from("200000")
        },
    });

    console.log("COMMITMENT", commitment);

    /**
     * Triggered when register button clicked
     */ 
    const doRegister = () => {

        //Setting this will update the UI
        setIsRegistering(true);
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

        const newCommitmentReadyTimestamp = currentTimestamp + parseInt(MIN_COMMITMENT_TIME_IN_SECONDS!.toString()) + 1;
        //Discern and set the time at which the commitment will be valid on chain
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

    return (
        <div>
            <div className = {classNames("bg-slate-50 dark:bg-slate-800", "p-4", 'flex flex-wrap justify-between items-center align-center w-full')}>
                <div className = "text-center m-2 grow basis-0 min-w-[200px]">{name}</div>
                <div className = "m-2 grow basis-0 text-center min-w-[200px]">

                    {isLoadingAvailability ? CommonIcons.miniLoader : (

                        <>
                            {isAvailable ? (
                                <>{CommonIcons.check} <span className = "ml-1">Available</span></>
                            ) : (
                                <>
                                    {CommonIcons.cross} 
                                    <div className = "ml-2">
                                        {isValid ? (
                                            <>
                                                <span>Registered</span>
                                                <div className = "w-1" />
                                                <AlertDialog 
                                                    key          = {"whois-" + name} 
                                                    open         = {isDialogOpen}
                                                    onOpenChange = {setIsDialogOpen} >
                                                    <AlertDialogTrigger asChild>
                                                        <span 
                                                            className   = "cursor-pointer text-xs underline" 
                                                            onClick     = {() => { 
                                                                window.history.pushState({page: "another"}, "another page", "/" + name) }
                                                        }>more info</span>
                                                    </AlertDialogTrigger>
                                                    <NameWhoisAlert 
                                                        name         = {name} 
                                                        onClickClose = {(e) => {

                                                            window.history.pushState({page: "another"}, "another page", "/");
                                                            setIsDialogOpen(false);
                                                        }} />
                                                </AlertDialog>
                                            </>
                                        ) : (
                                            <span>Invalid name</span>
                                        )}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                <div className = "m-2 grow basis-0 text-center min-w-[200px]">
                    {isLoadingAvailability ? CommonIcons.miniLoader : (

                        <>
                            {isAvailable && (
                                <>
                                    <Select 
                                        onValueChange = {(value) => setRegisterForTimeInSeconds(ethers.BigNumber.from(value))}
                                        disabled      = {isRegistering}>
                                        <SelectTrigger className="w-[180px] mx-auto mb-4">
                                            <SelectValue placeholder={renewalLengthOptions[0].label} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {renewalLengthOptions.map((option) => {
                                                    
                                                    return (
                                                        <SelectItem 
                                                            key   = {option.value}
                                                            value = {option.value.toString()}>
                                                            {option.label}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>

                                    {rentPrice && (
                                        <span className = "text-xs">Ξ {(+ethers.utils.formatEther(rentPrice.base.toString())).toFixed(4)}</span>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>

                <div className = "m-2 grow basis-0 text-center min-w-[200px]">

                    {isLoadingAvailability ? CommonIcons.miniLoader : (

                        <>
                            {isAvailable && (
                                <>
                                    {isRegistering ? (

                                        <>
                                            {/* Set when the transaction is committed and 60 seconds has passed */}
                                            {commitmentCompleteTimestamp == null ? (
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
                                                                    contract = {ethRegistrarController}
                                                                    chainId  = {ETHEREUM_CHAIN_ID}
                                                                    txArgs   = {{
                                                                        address: ethRegistrarControllerAddress[ETHEREUM_CHAIN_ID],
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
                                                                            duration:    5000,
                                                                            className:   "bg-red-200 dark:bg-red-800 border-0",
                                                                            description: (<p>{buildErrorMessage(error)}</p>),
                                                                        });
                                                                    }}
                                                                    checkStatic = {true}>
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
                                                    key      = {"name-registration-" + resultIndex}
                                                    contract = {ethRegistrarController}
                                                    chainId  = {ETHEREUM_CHAIN_ID}
                                                    txArgs   = {{
                                                        address: ethRegistrarControllerAddress[ETHEREUM_CHAIN_ID],
                                                        args: [
                                                            label,
                                                            addressToRegisterTo, //owner
                                                            registerForTimeInSeconds,
                                                            salt, //secret
                                                            addressToResolveTo, //resolver
                                                            [], //calldata
                                                            false,
                                                            (FUSES.CANNOT_UNWRAP) //fuses
                                                        ],
                                                        overrides: {
                                                            gasLimit:   ethers.BigNumber.from("500000"),
                                                            value:      rentPrice!.base.toString()
                                                        }
                                                    }}
                                                    txFunction  = 'register'
                                                    onBefore    = {clearCookies}
                                                    onConfirmed = {() => {
                                                        console.log("Registration confirmed");
                                                        toast({
                                                            duration:    5000,
                                                            className:   "bg-green-200 dark:bg-green-800 border-0",
                                                            description: (<p>You have successfully registered <span className = "font-bold">{name}</span>.</p>),
                                                        });
                                                        onRegister?.();
                                                    }}
                                                    onError = {(error) => {

                                                        console.log("error", error);
                                                        toast({
                                                            duration:    5000,
                                                            className:   "bg-red-200 dark:bg-red-800 border-0",
                                                            description: (<p>{buildErrorMessage(error)}</p>),
                                                        });
                                                    }}
                                                    checkStatic = {false}>
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
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}