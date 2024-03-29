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
    ZERO_ADDRESS,
    ONE_YEAR_IN_SECONDS
}                                           from '../../helpers/constants'
import { 
    useNameWrapperRead,
    useSubnameRegistrar, 
    useSubnameRegistrarMakeCommitment, 
    useSubnameRegistrarMinCommitmentAge, 
    useSubnameRegistrarRead, 
    useIRenewalControllerRead,
    subnameRegistrarAddress,
    useEthRegistrarControllerRead,
    useEnsRegistryRead,
    useSubnameRegistrarPricingData 
}                                           from '../../lib/blockchain'
import { SubnameWhoisAlert }                from '../ens/subname-whois-alert'
import CommonIcons                          from '../shared/common-icons';
import { TransactionConfirmationState }     from '../shared/transaction-confirmation-state'

import { useToast }                         from '@/lib/hooks/use-toast'

interface SearchResultRowProps {
    name:              string,      //The name
    resultIndex:       number,      //Index of the result
    onRegister?:       () => void,  //Callback for after the name is registered
    doLookup?:         any,         //Allows us to lookup a name
    dialogStartsOpen?: boolean      //Indicates if the profile dialog for this name should be open initially
}

export function SubnameSearchResultRow({ name, resultIndex, onRegister, doLookup, cookiedCommitment, clearCookies, dialogStartsOpen }: SearchResultRowProps) {

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

    //If the profile dialog for this name is open
    const [
        isDialogOpen, 
        setIsDialogOpen
    ]                                   = React.useState(dialogStartsOpen ? true : false);

    //Boolean indiciating if the subname is being registered
    const [
        isRegistering, 
        setIsRegistering
    ]                                   = React.useState(cookiedCommitment != null ? true : false);

    //The unix timestamp at which the commitment becomes valid on chain
    //Use cookie data if passed in
    const [
        commitmentReadyTimestamp, 
        setCommitmentReadyTimestamp
    ]                                   = React.useState<number | null>(cookiedCommitment?.commitmentReadyTimestamp ?? null);

    //Set once the commitment validity countdown has completed
    const [
        commitmentCompleteTimestamp, 
        setCommitmentCompleteTimestamp
    ]                                   = React.useState<number | null>(null);

    console.log("hexencode", hexEncodeName("sfsdfds.eth"));

    const namehash: `0x${string}`               = ethers.utils.namehash(name)  as `0x${string}`;
    const tokenId                               = ethers.BigNumber.from(namehash);

    const nameParts                             = name.split(".");
    nameParts.shift();
    const parentLabel                           = nameParts[0];
    const parentName                            = nameParts.join(".");
    const parentNamehash: `0x${string}`         = ethers.utils.namehash(parentName)  as `0x${string}`;
    const encodedNameToRegister: `0x${string}`  = hexEncodeName(name) as `0x${string}`;

    const parentTokenId                         = ethers.BigNumber.from(parentNamehash);

    const  { 
        data:      registryOwner, 
        isLoading: isLoadingRegistryOwner 
    }                                           = useEnsRegistryRead({
        chainId:      chainId,
        functionName: 'owner',
        args:         [namehash],
    });

    const isAvailableRegistry = registryOwner == ZERO_ADDRESS;

    //Discern if the subname is available in the SubnameRegistrar
    const  { 
        data:      isAvailable, 
        isLoading: isLoadingRegistrarAvailability 
    }                                           = useSubnameRegistrarRead({
        chainId:      chainId,
        functionName: 'available',
        args:         [encodedNameToRegister],
    });

    console.log("isAvailable", parentLabel);

    //If the parent second level name is available
    const  { 
        data:      isParentAvailable, 
        isLoading: isLoadingParentAvailability 
    }                                           = useEthRegistrarControllerRead({
        chainId:      chainId,
        functionName: 'available',
        args:         [parentLabel],
    });


    //Get pricing data for subnames of the parent name from the SubnameRegistrar
    const  { 
        data:      nameData, 
        isLoading: isLoadingNameData,
        refetch:   refetchData  
    }                                       = useSubnameRegistrarPricingData({
        chainId: chainId,
        args:    [parentNamehash],
    });


    console.log("namedata", nameData);
    const isOfferingSubnames = nameData && nameData.offerSubnames;

    const isLoading = isLoadingRegistryOwner || isLoadingRegistrarAvailability || isLoadingParentAvailability || isLoadingNameData;

    //Gets owner/expiry/fuses from the namewrapper for the parent 2nd level name
    const  { 
        data:    parentNameData, 
        refetch: refetchParentData 
    }                                       = useNameWrapperRead({
        chainId:      chainId,
        functionName: 'getData',
        args:         [parentTokenId],
     });
    const {
        owner:  nameWrapperParentOwnerAddress, 
        expiry: parentExpiry, 
        fuses:  parentWrapperFuses
    } = parentNameData ?? {};

    const currentTimestamp    = Math.ceil(Date.now() / 1000);
    const maxRegistrationTime = parseInt(parentExpiry?.toString()) - currentTimestamp;
    console.log("PARENT EXPIRY", parentExpiry);
    console.log("PARENT EXPIRY maxRegistrationTime", maxRegistrationTime);

    const addressToRegisterTo      = cookiedCommitment?.addressToRegisterTo ?? address;
    const registerForTimeInSeconds = ethers.BigNumber.from(cookiedCommitment?.registerForTimeInSeconds ?? ONE_YEAR_IN_SECONDS);
    const addressToResolveTo       = cookiedCommitment?.addressToResolveTo ?? ZERO_ADDRESS;

    const  { data: registerPriceData }  = useSubnameRegistrarRead({
        chainId:      chainId,
        functionName: 'rentPrice',
        args:         [encodedNameToRegister, registerForTimeInSeconds],
    });

    const { 
        weiPrice: registerPriceWei, 
        usdPrice: registerPriceUsd 
    }                               = registerPriceData ?? { weiPrice: 0, usdPrice: 0 };

    console.log("registerPriceData", registerPriceData);
    console.log("registerPriceWei", registerPriceWei);

    //Discern the renewal controller for this subname
    var renewalControllerToUse = null;

    if (nameData && nameData.renewalController != ZERO_ADDRESS) { 
        renewalControllerToUse = nameData.renewalController; 
    } 

    const renewForTimeInSeconds = ONE_YEAR_IN_SECONDS;
    const encodedNameToRenew    = encodedNameToRegister;

    //The renewal price as pulled from the subnames renewal controller
    const  { data: renewalPriceData }           = useIRenewalControllerRead({
        address:      renewalControllerToUse,
        chainId:      chainId,
        functionName: 'rentPrice',
        args:         [encodedNameToRenew, renewForTimeInSeconds]
    });

    const { 
        weiPrice: renewalPriceWei, 
        usdPrice: renewalPriceUsd 
    }                                           = renewalPriceData ?? { weiPrice: 0, usdPrice: 0 };

    console.log("renewalPrice", renewalPriceData);

    //A salt for the registration commitment
    const [salt, setSalt] = React.useState<`0x${string}`>(cookiedCommitment?.salt ?? "0x" + generateSalt() as `0x${string}`);

    console.log("encodedNameToRegister", encodedNameToRegister);
    console.log("addressToRegisterTo", addressToRegisterTo);
    console.log("registerForTimeInSeconds", registerForTimeInSeconds);
    console.log("salt", salt);
    console.log("addressToResolveTo", addressToResolveTo);
    console.log("chainId", chainId);

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
        console.log("register clicked", commitment);
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

        setCommitmentReadyTimestamp(newCommitmentReadyTimestamp);

        toast({
            duration:    5000,
            className:   "bg-green-200 dark:bg-green-800 border-0",
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

    return(
        <div>
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

                    {isLoading ? CommonIcons.miniLoader :  (
                        <>
                            {isParentAvailable && (
                                <p><span className = "font-bold">{parentName}</span> is not registered.</p>
                            )}

                            {!isParentAvailable && !isAvailableRegistry && (
                                <>
                                    {CommonIcons.cross} 
                                    <div className = "ml-2">   
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
                                            <SubnameWhoisAlert 
                                                key          = {"alert-" + name} 
                                                name         = {name} 
                                                onClickClose = {(e) => {

                                                    window.history.pushState({page: "another"}, "another page", "/");
                                                    setIsDialogOpen(false);
                                                }} />
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
                        </>
                    )}
                </div>

                <div className = "m-2 grow basis-0 text-center min-w-[200px]">
                    {isLoading ? CommonIcons.miniLoader :  (
                        <>
                            {isAvailable && registerPriceWei && (
                                <>
                                    {registerPriceWei > 0 ? (
                                        <>
                                            <span>Ξ {ethers.utils.formatEther(registerPriceWei)}</span>
                                            <div className = "text-xs text-center text-green-800 mt-2">${registerPriceUsd.toString()}</div>
                                        </>
                                    ) : (
                                        <span>FREE</span>
                                    )}

                                    {renewalPriceWei && (
                                        <p className = "text-xs mt-2">
                                            Renews at <span className = "font-bold">Ξ{(+ethers.utils.formatEther(renewalPriceWei)).toFixed(4)}</span> (${(renewalPriceUsd.toString()/1e18).toFixed(2)}) per year.
                                        </p>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>

                <div className = "m-2 grow basis-0 text-center min-w-[200px]">

                    {isLoading ? CommonIcons.miniLoader :  (
                        <>
                            {isAvailable && (
                                <>
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
                                                    key      = {"registration-" + resultIndex}
                                                    contract = {subnameRegistrar}
                                                    txArgs   = {{
                                                        address: subnameRegistrarAddress[chainId],
                                                        args: [
                                                            encodedNameToRegister,
                                                            addressToRegisterTo, //owner
                                                            '0xAC50cE326de14dDF9b7e9611Cd2F33a1Af8aC039', //referer
                                                            registerForTimeInSeconds,
                                                            salt, //secret
                                                            addressToResolveTo, //resolver
                                                            0 //fuses
                                                        ],
                                                        overrides: {
                                                            gasLimit: ethers.BigNumber.from("500000"),
                                                            value:    registerPriceWei?.mul("2").toString()
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

                                                        console.log('error this');
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
                                                <Tooltip delayDuration = {0}>
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
