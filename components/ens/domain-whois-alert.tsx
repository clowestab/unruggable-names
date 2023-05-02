import React                              from 'react'
import { ethers }                         from "ethers";
import { 
    useAccount, 
    useWaitForTransaction, 
    useProvider, 
    useSigner 
}                                         from 'wagmi'
import { foundry }                        from 'wagmi/chains'
import { 
    useRenewalController, 
    useSubnameWrapperRead, 
    useNameWrapper, 
    useNameWrapperRead, 
    useEnsRegistryRead, 
    useSubnameWrapper, 
    useSubnameRegistrar, 
    useSubnameRegistrarRenew, 
    useSubnameRegistrarRead, 
    useEthRegistrarController 
}                                         from '../../lib/blockchain'

import CommonIcons                        from '../shared/common-icons';
import { TransactionConfirmationState }   from '../shared/transaction-confirmation-state'
import { Toaster }                        from "@/components/ui/toaster"
import { useToast }                       from '@/lib/hooks/use-toast'

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
}                                         from "@/components/ui/alert-dialog"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
}                                         from "@/components/ui/accordion"

import { Input }                          from "@/components/ui/input"
import { Label }                          from "@/components/ui/label"
import { Button }                         from "@/components/ui/button"
import { Checkbox }                       from "@/components/ui/checkbox"

import { 
    formatExpiry, 
    hexEncodeName 
}                                         from '../../helpers/Helpers.jsx';

import {
    renewalControllerAddress,
    subnameRegistrarAddress,
    subnameWrapperAddress,
    nameWrapperAddress,
    ensRegistryAddress,
    ethRegistrarControllerAddress
}                                         from '../../helpers/contract-addresses.tsx';

interface SubdomainWhoisAlertProps {
    txFunction:  Function,
    txArgs:      Array<any>,
    children?:   React.ReactElement | Array<React.ReactElement>,
    inComplete?: Function
}

// @ts-ignore
export function DomainWhoisAlert({ name }: SubdomainWhoisAlertProps): React.ReactElement | null {

    //References for the Pricing Data inputs so we can get the values when saving
    const offerSubnamesRef                = React.useRef(null);
    const renewalControllerInputRef       = React.useRef(null);
    const minRegistrationDurationInputRef = React.useRef(null);
    const minCharactersInputRef           = React.useRef(null);
    const maxCharactersInputRef           = React.useRef(null);

    const domainParts                     = name.split(".");
    const label                           = domainParts[0];
    const namehash                        = ethers.utils.namehash(name);
    const tokenId                         = ethers.BigNumber.from(namehash).toString();
    const encodedNameToRenew              = hexEncodeName(name);
    const renewForTimeInSeconds           = 31536000;

    const { toast }                       = useToast();
    const { address }                     = useAccount()
    const { 
        data: signer, 
        isErrorSigner, 
        isLoadingSigner 
    }                                     = useSigner()

    //ETHRegistrarController instance
    const ethRegistrarController = useEthRegistrarController({
        address:          ethRegistrarControllerAddress,
        chainId:          foundry.id,
        signerOrProvider: signer
    });

    //RenewalController instance
    const renewalController = useRenewalController({
        address:          renewalControllerAddress,
        chainId:          foundry.id,
        signerOrProvider: signer
    });

    //SubnameWrapper instance
    const subnameWrapper = useSubnameWrapper({
        address:          subnameWrapperAddress,
        chainId:          foundry.id,
        signerOrProvider: signer
    });

    const [isRenewing, setIsRenewing]         = React.useState(false);
    const [
        isSubdomainRegistrarApprovalPending, 
        setIsSubdomainRegistrarApprovalPending
    ]                                         = React.useState(false);
    const [
        isNameWrapperApprovalPending, 
        setIsNameWrapperApprovalPending
    ]                                         = React.useState(false);
    const [
        isEditingPricingData, 
        setIsEditingPricingData
        ]                                       = React.useState(false);
    const [
        isSavingPricingData, 
        setIsSavingPricingData
    ]                                         = React.useState(false);

    //TODO get renewal price and implement renewals
    const  { data: rentPrice }  = useSubnameRegistrarRead({
         address:      subnameRegistrarAddress,
         functionName: 'rentPrice',
         args:         [encodedNameToRenew, renewForTimeInSeconds],
         chainId:      foundry.id
     });

    console.log("renewal price for " + name, rentPrice);

    //Gets Pricing Data from the subname registrar for a specific parent nam
    const  { data: pricingData, refetch: refetchPricingData }  = useSubnameRegistrarRead({
         address:      subnameRegistrarAddress,
         functionName: 'pricingData',
         args:         [namehash],
         chainId:      foundry.id
     });

    //SubnameRegistrar instance
    const subnameRegistrar = useSubnameRegistrar({
        address:          subnameRegistrarAddress,
        chainId:          foundry.id,
        signerOrProvider: signer
    });

    //NameWrapper instance
    const nameWrapper = useNameWrapper({
        address:          nameWrapperAddress,
        chainId:          foundry.id,
        signerOrProvider: signer
    });

    //Gets owner/expiry/fuses from the namewrapper
    const  { data: nameData, refetch: refetchData }  = useNameWrapperRead({
         address:      nameWrapperAddress,
         functionName: 'getData',
         args:         [namehash],
         chainId:      foundry.id
     });
    const {owner: nameWrapperOwnerAddress} = nameData ?? {};

    console.log("name data", nameData);

    //Check if the Subname Registrar has been approved for this names owner on the Subname Wrapper
    const  { data: isApprovedForAllSubdomainWrapper, refetch: refetchIsApprovedForAllSubdomainWrapper  }  = useSubnameWrapperRead({
        address:      subnameWrapperAddress,
        functionName: 'isApprovedForAll',
        args:         [nameData?.owner, subnameRegistrarAddress],
        chainId:      foundry.id
    });

    //Check if the Subname Wrapper has been approved for this names owner on the Name Wrapper
    const  { data: isApprovedForAllNameWrapper, refetch: refetchIsApprovedForAllNameWrapper }  = useNameWrapperRead({
        address:      nameWrapperAddress,
        functionName: 'isApprovedForAll',
        args:         [nameData?.owner, subnameWrapperAddress],
        chainId:      foundry.id
     });

    console.log("isApprovedForAllSubdomainWrapper", isApprovedForAllSubdomainWrapper);
    console.log("isApprovedForAllNameWrapper", isApprovedForAllNameWrapper);

    //Get the owner address as set in the ENS Registry
    const  { data: registryOwnerAddress }  = useEnsRegistryRead({
         address:      ensRegistryAddress,
         functionName: 'owner',
         args:         [namehash],
         chainId:      foundry.id
     });

    //Triggers the transaction to approve the 
    const onClickApproveSubdomainRegistrar = () => {

        console.log("onClickApproveSubdomainRegistrar");
        setIsSubdomainRegistrarApprovalPending(true);
    }

    //Triggers the transaction to approve the 
    const onClickApproveForAllNameWrapper = () => {

        console.log("onClickApproveForAllNameWrapper");
        setIsNameWrapperApprovalPending(true);
    }


    const onClickRenew = () => {

        console.log("renew");

        toast({
            title: "Scheduled: Catch up",
            description: "Friday, February 10, 2023 at 5:57 PM",
        });

        setIsRenewing(true);
    }

    //Indicates if this name is owned by the connected user
    const isOwnedByUser = nameData?.owner == address;

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{name}</AlertDialogTitle>
                <AlertDialogDescription>

                    <Accordion type="single" collapsible className="w-full" defaultValue="item-whois">
                        <AccordionItem value="item-whois">
                            <AccordionTrigger>Whois</AccordionTrigger>
                            <AccordionContent>

                                <div>
                                    Expiry: <span className = "font-bold">{formatExpiry(nameData?.expiry)}</span>

                                    <div className = "mt-2">

                                        {!isRenewing ? (
                                            <>
                                                <Button 
                                                    type     = "submit" 
                                                    disabled = {isRenewing} 
                                                    onClick  = {onClickRenew}>
                                                    {isRenewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Renew
                                                </Button>
                                            </>
                                        ) : (
                                            <TransactionConfirmationState 
                                                key       = {"domain-renewal-" + name}
                                                contract  = {ethRegistrarController}
                                                txArgs    = {{
                                                    args: [
                                                        label,
                                                        renewForTimeInSeconds
                                                    ],
                                                    overrides: {
                                                        gasLimit: 5000000,
                                                        value:    "1000000000000000000"
                                                    }
                                                }}
                                                txFunction  = 'renew'
                                                onConfirmed = {() => {
                                                    console.log("2ld renewal confirmed");
                                                }}
                                                onAlways  = {() => {
                                                    console.log("2ld renewal onAlways");
                                                    setIsRenewing(false);
                                                    refetchData();
                                                }}>
                                                <div>
                                                    {CommonIcons.miniLoader} Renewing domain..
                                                </div>
                                                <div>
                                                    SUCCESS
                                                </div>
                                            </ TransactionConfirmationState>
                                        )}
                                    </div>

                                </div>

                                <div className = "mt-4">
                                    NameWrapper owner: <span className = "block font-bold mt-1">{nameWrapperOwnerAddress}</span>

                                    {isOwnedByUser && (
                                        <div className = "text-xs text-red-800 mt-1">This is you.</div>
                                    )}

                                </div>

                                <div className = "mt-4">
                                    Registry owner: <span className = "block font-bold mt-1">{registryOwnerAddress}</span>

                                    {registryOwnerAddress == nameWrapperAddress && (
                                        <div className = "text-xs text-red-800 mt-1">This is the NameWrapper.</div>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-subdomain-controls">
                            <AccordionTrigger>Subdomain Controls</AccordionTrigger>
                            <AccordionContent>


                                {/*Subdomain controls - displayed to owner*/}
                                {isOwnedByUser && (
                                    <>
                                        <div>
                                            <div className = "text-xs text-red-800 mt-1">
                                                These controls are visible to you because you own {name}.
                                            </div>

                                            <h3 className = "text-md mt-4">Approvals</h3>
                                            <div className = "text-xs mt-2">
                                                Before utilising the subdomain offering you must approve access to our smart contracts to manage your names.
                                            </div>

                                            <div className = "text-xs mt-2">
                                                1. Approve the <span className = "font-bold">Subdomain Wrapper</span> on the <span className = "font-bold">Name Wrapper</span>.
                                            </div>

                                            {/* The Subname wrapper needs to be approved on the Name Wrapper*/}
                                            {!isApprovedForAllNameWrapper ? (
                                                <>
                                                    <Button 
                                                        type      = "submit" 
                                                        disabled  = {isNameWrapperApprovalPending} 
                                                        onClick   = {onClickApproveForAllNameWrapper} 
                                                        className = "mt-2">
                                                        {isNameWrapperApprovalPending && (CommonIcons.miniLoader)}
                                                        Approve Subdomain Wrapper in Name Wrapper
                                                    </Button>

                                                    {isNameWrapperApprovalPending && (

                                                        <TransactionConfirmationState 
                                                            key       = {"approve-wrapper-" + name}
                                                            contract    = {nameWrapper}
                                                            txArgs      = {{
                                                                args: [
                                                                    subnameWrapperAddress
                                                                ],
                                                                overrides: {
                                                                    gasLimit: 5000000,
                                                                    //value: "10000000000000000000"
                                                                }
                                                            }}
                                                            txFunction    = 'setApprovalForAll'
                                                            onConfirmed   = {() => {
                                                                console.log("setApprovalforall done");
                                                            }}
                                                            onAlways = {() => {
                                                                setIsNameWrapperApprovalPending(false);
                                                                refetchIsApprovedForAllNameWrapper();
                                                            }}>
                                                            <div>
                                                                {/*Show nothing when approving - we do it on the button*/}
                                                            </div>
                                                            <div>
                                                                {CommonIcons.check} Approved
                                                            </div>
                                                        </ TransactionConfirmationState>
                                                    )}
                                                </>
                                            ) : (
                                                <div className = "mt-2">
                                                    {CommonIcons.check} Approved
                                                </div>
                                            )}
                                        </div>

                                        <div className = "text-xs mt-4">
                                            2. Approve the <span className = "font-bold">Subdomain Registrar</span> on the <span className = "font-bold">Subdomain Wrapper</span>.
                                        </div>
                                        
                                        {!isApprovedForAllSubdomainWrapper ? (

                                            <>
                                                <Button 
                                                    type      = "submit" 
                                                    disabled  = {isSubdomainRegistrarApprovalPending} 
                                                    onClick   = {onClickApproveSubdomainRegistrar} 
                                                    className = "mt-2">
                                                        {isSubdomainRegistrarApprovalPending && (CommonIcons.miniLoader)}
                                                        Approve Subdomain Registrar in Subdomain Wrapper
                                                </Button>
                                        
                                                {/* The Subname registrar needs to be approved on the Subname Wrapper*/}

                                                {isSubdomainRegistrarApprovalPending && (
                                                    <TransactionConfirmationState 
                                                        key     = {"offer-subdomains-" + name}
                                                        contract  = {subnameWrapper}
                                                        txArgs    = {{
                                                            args: [
                                                                subnameRegistrarAddress
                                                            ],
                                                            overrides: {
                                                                gasLimit: 5000000,
                                                                //value: "10000000000000000000"
                                                            }
                                                        }}
                                                        txFunction  = 'setApprovalForAll'
                                                        onConfirmed = {() => {
                                                            console.log("setApprovalforall done");
                                                        }}
                                                        onAlways = {() => {
                                                            setIsSubdomainRegistrarApprovalPending(false);
                                                            refetchIsApprovedForAllSubdomainWrapper();
                                                        }}>
                                                        <div>
                                                            {/*Show nothing when approving - we do it on the button*/}
                                                        </div>
                                                        <div>
                                                            <div>
                                                                {CommonIcons.check} Approved
                                                            </div>
                                                        </div>
                                                    </ TransactionConfirmationState>
                                                )}
                                            </>
                                        ) : (
                                            <div className = "mt-2">
                                                {CommonIcons.check} Approved
                                            </div>
                                        )}
                                    </>
                                )}
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-pricing-data">
                            <AccordionTrigger>Pricing Data</AccordionTrigger>
                            <AccordionContent>

                                <div className = "text-xs text-red-800">
                                    This section details pricing data for registration of subdomains under {name}.
                                </div>

                                {!isEditingPricingData ? (
                                    <>
                                        {pricingData ? (

                                            <div className = "mt-4">
                                                <div className = "mt-2">Offers subdomains: <span className = "font-bold">{pricingData.offerSubnames ? "YES":"NO"}</span></div>
                                                <div>Renewal Controller: <span className = "font-bold">{pricingData.renewalController}</span></div>
                                                <div>Min Duration: <span className = "font-bold">{pricingData.minRegistrationDuration}</span></div>
                                                <div>Min characters: <span className = "font-bold">{pricingData.minChars}</span></div>
                                                <div>Max characters: <span className = "font-bold">{pricingData.maxChars}</span></div>
                                            </div>
                                        ) : (
                                            <div>No pricing data</div>
                                        )}

                                        {isOwnedByUser && (
                                            <>
                                                <Button 
                                                    type    ="submit" 
                                                    onClick   = {(e) => {
                                                        setIsEditingPricingData(true);
                                                    }} 
                                                    className = "mt-4">
                                                    Modify Pricing Data
                                                </Button>

                                                <div className = "text-xs text-red-800 mt-1">
                                                    You have this option because you own {name}.
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <>

                                        <div className = "my-2">
                                            <Checkbox id="offerSubdomains" defaultValue = {pricingData.offerSubnames} ref = {offerSubnamesRef} defaultChecked = {pricingData.offerSubnames} />
                                            <label
                                                htmlFor="offerSubdomains"
                                                className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Offer subdomains
                                            </label>
                                        </div>

                                        <Label htmlFor="renewalController">Renewal Controller</Label>
                                        <Input type = "text" id = "renewalController" ref = {renewalControllerInputRef} defaultValue = {pricingData.renewalController} className = "my-2" />

                                        <div className = "text-xs text-red-800 mt-1 mb-2">Why not try <span className = "font-bold">{renewalControllerAddress}</span>.</div>
                                        

                                        <Label htmlFor="minRegistrationDuration">Minimum Registration Duration</Label>
                                        <Input type = "text" id = "minRegistrationDuration" ref = {minRegistrationDurationInputRef} defaultValue = {pricingData.minRegistrationDuration} className = "my-2" />

                                        <Label htmlFor="minChars">Minimum Characters</Label>
                                        <Input type = "text" id = "minChars" ref = {minCharactersInputRef} defaultValue = {pricingData.minChars} className = "my-2" />

                                        <Label htmlFor="maxChars">Maximum Characters</Label>
                                        <Input type = "text" id = "maxChars" ref = {maxCharactersInputRef} defaultValue = {pricingData.maxChars} className = "my-2" />

                                        {!isSavingPricingData ? (
                                            <Button 
                                                type="submit" 
                                                onClick = {(e) => {

                                                    console.log("changing", offerSubnamesRef.current.checked);
                                                    setIsSavingPricingData(true);

                                                }} className = "mt-2">
                                                Save Changes
                                            </Button>
                                        ) : (
                                            <TransactionConfirmationState 
                                                key = {"save-pricing-data-" + name}
                                                contract = {subnameRegistrar}
                                                txArgs = {{
                                                    args: [
                                                        namehash,
                                                        offerSubnamesRef.current.checked,
                                                        renewalControllerInputRef.current.value,
                                                        minRegistrationDurationInputRef.current.value,
                                                        minCharactersInputRef.current.value,
                                                        maxCharactersInputRef.current.value
                                                    ],
                                                    overrides: {
                                                        gasLimit: 5000000,
                                                        //value: "10000000000000000000"
                                                    }
                                                }}
                                                txFunction = 'setParams'
                                                onConfirmed = {() => {
                                                    console.log("setParams done");
                                                    setIsSavingPricingData(false);
                                                    setIsEditingPricingData(false);
                                                }}
                                                onAlways = {() => {
                                                    refetchPricingData();
                                                }}>
                                                <div>
                                                    {CommonIcons.miniLoader} Saving pricing data..
                                                </div>
                                                <div>
                                                    SUCCESS
                                                </div>
                                            </ TransactionConfirmationState>
                                        )}
                                    </> 
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogAction>Close</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    )
}
