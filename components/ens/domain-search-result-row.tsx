//Fuses
const FUSES = {
  CAN_DO_EVERYTHING:       0,
  CANNOT_UNWRAP:          1,
  CANNOT_BURN_FUSES:       2,
  CANNOT_TRANSFER:         4,
  CANNOT_SET_RESOLVER:     8,
  CANNOT_SET_TTL:          16,
  CANNOT_CREATE_SUBDOMAIN: 32,
  CANNOT_APPROVE:          64,
  PARENT_CANNOT_CONTROL:   2 ** 16,
  IS_DOT_ETH:              2 ** 17,
  CAN_EXTEND_EXPIRY:       2 ** 18,
}

import React                            from 'react'

import classNames                       from 'clsx'
import { ethers }                       from "ethers";
import { HiCheckCircle, HiXCircle }     from 'react-icons/hi'
import { 
    useAccount,
    useProvider, 
    useSigner, 
    useWaitForTransaction 
}                                       from 'wagmi'

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
}                                       from "@/components/ui/alert-dialog"
import { Button }                       from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
}                                       from "@/components/ui/tooltip"

import { CountdownText }                from './countdown-text'
import {
    ethRegistrarControllerAddress,
    renewalControllerAddress,
    subnameRegistrarAddress,
    subnameWrapperAddress
}                                       from '../../helpers/contract-addresses';
import { 
    generateSalt, 
    hexEncodeName 
}                                       from '../../helpers/Helpers.jsx';
import { 
    useEthRegistrarController, 
    useEthRegistrarControllerMakeCommitment, 
    useEthRegistrarControllerMinCommitmentAge, 
    useEthRegistrarControllerRead, 
    useSubnameRegistrarPricingData 
}                                       from '../../lib/blockchain'
import { DomainWhoisAlert }             from '../ens/domain-whois-alert'
import CommonIcons                      from '../shared/common-icons';
import { TransactionConfirmationState } from '../shared/transaction-confirmation-state'

const REGISTRATION_STATE = {
    COMMITTED:  'COMMITTED',
    REGISTERED: 'REGISTERED',
}
 

interface SearchResultRowProps {
    className?:  string,
    name:        string,
    resultIndex: number,
    onRegister?: () => void
}


export function DomainSearchResultRow({ className, name, resultIndex, onRegister }: SearchResultRowProps) {

    const provider                                          = useProvider();
    const { data: signer }  = useSigner()
    const { address }                                       = useAccount()

    console.log("SIGNER", signer);

    const ethRegistrarController = useEthRegistrarController({
        address:          ethRegistrarControllerAddress,
        signerOrProvider: signer
    });

    console.log("ethRegistrarController", ethRegistrarController);

    const [isRegistering, setIsRegistering]                             = React.useState(false);
    const [commitmentReadyTimestamp, setCommitmentReadyTimestamp]       = React.useState<number | null>(null);
    const [commitmentCompleteTimestamp, setCommitmentCompleteTimestamp] = React.useState<number | null>(null);

    const domainParts               = name.split(".");
    const label                     = domainParts[0];
    const encodedNameToRegister     = hexEncodeName(name);
    const domainNamehash            = ethers.utils.namehash(name);

    const  { data: isAvailable }    = useEthRegistrarControllerRead({
         address:      ethRegistrarControllerAddress,
         functionName: 'available',
         args:         [label],
    });

    console.log("isAvailable data", isAvailable);

    const  { data: pricingData }  = useSubnameRegistrarPricingData({
         address: subnameRegistrarAddress,
         args:    [`0x${domainNamehash}`],
     });

    console.log("Pricing data", pricingData);

    const addressToRegisterTo      = address;
    const registerForTimeInSeconds = ethers.BigNumber.from("10000000");//31536000;
    const addressToResolveTo       = "0x0000000000000000000000000000000000000000";


    const  { data: rentPrice }  = useEthRegistrarControllerRead({
         address:      ethRegistrarControllerAddress,
         functionName: 'rentPrice',
         args:         [encodedNameToRegister, registerForTimeInSeconds],
     });


    console.log("rentprice", rentPrice);


    const [salt, setSalt] = React.useState<`0x${string}`>(`0x${generateSalt()}`);

    console.log("encodedNameToRegister", encodedNameToRegister);
    console.log("addressToRegisterTo", addressToRegisterTo);
    console.log("registerForTimeInSeconds", registerForTimeInSeconds);
    console.log("salt", salt);
    console.log("addressToResolveTo", addressToResolveTo);


    const { data: MIN_COMMITMENT_TIME_IN_SECONDS } = useEthRegistrarControllerMinCommitmentAge({
        address: ethRegistrarControllerAddress,
    });

    console.log("MIN_COMMITMENT_TIME_IN_SECONDS", MIN_COMMITMENT_TIME_IN_SECONDS?.toString());

    const { data: commitment } = useEthRegistrarControllerMakeCommitment({
        address: ethRegistrarControllerAddress,
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


    /**
     * Triggered when register button clicked
     */ 
    const doRegister = () => {
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

        //Discern and set the time at which the commitment will be valid on chain
        setCommitmentReadyTimestamp(currentTimestamp + parseInt(MIN_COMMITMENT_TIME_IN_SECONDS!.toString()));
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
            <div className = {classNames({ "bg-green-100": isAvailable, "bg-red-100": !isAvailable}, "p-4", 'flex justify-center items-center')}>
                <>{name}</>
                <div className = "w-8" />
                <div className = "flex items-center justify-center">
                    {isAvailable ? (
                        <><HiCheckCircle /><div className = "w-1" /> Available</>
                    ) : (
                        <>
                            <HiXCircle /><div className = "w-1" />
                            <div>
                                <span>Registered</span>
                                <div className = "w-1" />
                                <AlertDialog key = {"whois-" + name} >
                                    <AlertDialogTrigger asChild>
                                        <span className = "cursor-pointer text-xs underline">whois</span>
                                    </AlertDialogTrigger>
                                    <DomainWhoisAlert name = {name} />
                                </AlertDialog>
                            </div>
                        </>
                    )}
                </div>

                <div className = "w-8" />

                <div className = "flex items-center justify-center">
                    {isAvailable && rentPrice && (
                        <span>Ξ {ethers.utils.formatEther(rentPrice.base.toString())}</span>
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
                                                key         = {"commitment-" + resultIndex}
                                                contract    = {ethRegistrarController}
                                                txArgs      = {{
                                                    address: ethRegistrarControllerAddress,
                                                    args: [
                                                        commitment, //secret
                                                    ],
                                                    overrides: {
                                                        gasLimit: ethers.BigNumber.from("200000")
                                                    }
                                                }}
                                                txFunction  = 'commit'
                                                onConfirmed = {onCommitmentConfirmed}
                                            >
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
                                        key         = {"domain-registration-" + resultIndex}
                                        contract    = {ethRegistrarController}
                                        txArgs      = {{
                                            address: ethRegistrarControllerAddress,
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
                                                <p>Connect a wallet to register a domain</p>
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