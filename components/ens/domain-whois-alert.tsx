const ethPrice = 1854;

import * as React                         from 'react'

import { Icon }                           from '@iconify/react';

import { ethers }                         from "ethers";
const yearInSeconds = ethers.BigNumber.from("31536000");

import { 
    useAccount, 
    useProvider, 
    useSigner, 
    useWaitForTransaction 
}                                         from 'wagmi'
import { foundry }                        from 'wagmi/chains'

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
}                                         from "@/components/ui/accordion"
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
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
}                                         from "@/components/ui/table"

import { FuseList }                       from '@/components/ens/fuse-list';

import { Button }                         from "@/components/ui/button"
import { Checkbox }                       from "@/components/ui/checkbox"
import { Input }                          from "@/components/ui/input"
import { ScrollArea }                     from "@/components/ui/scroll-area"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
}                                         from "@/components/ui/select"

import { Label }                          from "@/components/ui/label"
import { useToast }                       from '@/lib/hooks/use-toast'

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
}                                         from "@/components/ui/tooltip"

import {
    ensRegistryAddress,
    ethRegistrarControllerAddress,
    nameWrapperAddress,
    renewalControllerAddress,
    subnameRegistrarAddress,
    subnameWrapperAddress
}                                         from '../../helpers/contract-addresses';

import {
    renewalLengthOptions,
    renewalControllerOptions
}                                         from '../../helpers/select-options';

import { 
    formatExpiry, 
    hexEncodeName 
}                                         from '../../helpers/Helpers.jsx';
import { 
    useEnsRegistryRead, 
    useEthRegistrarController, 
    useEthRegistrarControllerRead, 
    useNameWrapper, 
    useNameWrapperRead, 
    useRenewalController, 
    useRenewalControllerRead,
    useSubnameRegistrar, 
    useSubnameRegistrarRead, 
    useSubnameWrapper, 
    useSubnameWrapperRead 
}                                         from '../../lib/blockchain'
import CommonIcons                        from '../shared/common-icons';
import { TransactionConfirmationState }   from '../shared/transaction-confirmation-state'

interface DomainWhoisAlertProps {
    name:        string,
}

// @ts-ignore
export function DomainWhoisAlert({ name }: DomainWhoisAlertProps): React.ReactElement | null {

    //References for the Subdomain registration configuration inputs so we can get the values when saving
    const offerSubnamesRef                = React.useRef<HTMLButtonElement & { checked: boolean }>(null);
    const minRegistrationDurationInputRef = React.useRef<HTMLInputElement>(null);
    const minCharactersInputRef           = React.useRef<HTMLInputElement>(null);
    const maxCharactersInputRef           = React.useRef<HTMLInputElement>(null);
    const [
        renewalControllerInput, 
        setRenewalControllerInput
    ]                                     = React.useState<string | null>(null);

    //Holds the prices per character for our default renewal controller pulled from chain
    const [
        renewalPricingData, 
        setRenewalPricingData
    ]                                     = React.useState<array>([]);

    const [
        renewalPriceInput, 
        setRenewalPriceInput
    ]                                     = React.useState<array>([]);

    const [
        isSavingRegistrationConfigurationData, 
        setIsSavingRegistrationConfigurationData
    ]                                     = React.useState<boolean>(false);
    const [
        isSavingRenewalConfigurationData, 
        setIsSavingRenewalConfigurationData
    ]                                     = React.useState<boolean>(false);

    const domainParts                     = name.split(".");
    const label                           = domainParts[0];
    const namehash                        = ethers.utils.namehash(name);
    const namehashHex: `0x${string}`      = namehash as `0x${string}`;

    console.log("namehash", typeof namehash);
    console.log("namehashHex", namehashHex);

    const tokenId                         = ethers.BigNumber.from(namehash);
    const encodedNameToRenew              = hexEncodeName(name);

    //Holds the selected time in seconds for a renewal
    const [
        renewForTimeInSeconds, 
        setRenewForTimeInSeconds
    ]                                     = React.useState(ethers.BigNumber.from(renewalLengthOptions[0].value));

    const { toast, dismiss }              = useToast()

    const { address }                     = useAccount()
    const { 
        data: signer, 
    }                                     = useSigner()
    const { 
        data: provider, 
    }                                     = useProvider()

    console.log("lastRenewalPriceIndex Signer", signer);
    console.log("lastRenewalPriceIndex Signerp", provider);
    console.log("lastRenewalPriceIndex Signerreal", typeof signer !== "undefined");

    //ETHRegistrarController instance
    const ethRegistrarController          = useEthRegistrarController({
        signerOrProvider: signer
    });

    //RenewalController instance
    const renewalController               = useRenewalController({
        signerOrProvider: signer
    });


    //Gets the number of characters for which prices have been set from our basic renewal controller
    const  { data: lastRenewalPriceIndex, refetch: refetchLastRenewalPriceIndex }  = useRenewalControllerRead({
        functionName:  'getLastCharIndex',
        args:          [],
    });


    const refetchRenewalConfiguration = async () => {

        console.log("lastRenewalPriceIndex changedDD", renewalController);

        var secondsPricingData = [];
        var pricingData = [];

        console.log("lastRenewalPriceIndex do work", parseInt(lastRenewalPriceIndex.toString()));
        console.log("lastRenewalPriceIndex do work1", renewalController);

        for (var i = 0; i <= lastRenewalPriceIndex; i++) {

            const price = await renewalController.charAmounts(i);
            secondsPricingData.push(price.toString());

            console.log("lastRenewalPriceIndex price wut " + i, price);

            const pricePerYear = (price.mul(yearInSeconds));
            const formatted = ethers.utils.formatEther(pricePerYear.toString())
            const rounded = new Intl.NumberFormat('en-EN', {
                maximumFractionDigits: 2
            }).format(formatted);
            pricingData.push(rounded);
        }

        console.log("lastRenewalPriceIndex price do work2", pricingData);

        setRenewalPricingData(pricingData);
        setRenewalPriceInput(pricingData);
    }

    /**
     * Effect which pulls pricing data from our basic renewal controller
     * Once the signer has been loaded
     * Was having issues whereby the lastRenewalPriceIndex was being pulled but the signer was still returning undefined
     */ 
    React.useEffect(() => {
        
        console.log("lastRenewalPriceIndex changed", lastRenewalPriceIndex);
        console.log("lastRenewalPriceIndex changedb", signer);
        console.log("lastRenewalPriceIndex changedc", renewalController);

        console.log("lastRenewalPriceIndex WUT", renewalController);
        if (signer) {
            console.log("lastRenewalPriceIndex", lastRenewalPriceIndex);
            refetchRenewalConfiguration();
        }

    }, [signer, lastRenewalPriceIndex]);


    const  { data: renewalPrice }  = useRenewalControllerRead({
        functionName:  'rentPrice',
        args:          [encodedNameToRenew, renewForTimeInSeconds],
    });

    console.log("renewalPrice", renewalPrice);

    //SubnameWrapper instance
    const subnameWrapper = useSubnameWrapper({
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
        isEditingSubdomainRegistrationConfig, 
        setIsEditingSubdomainRegistrationConfig
    ]                                         = React.useState(false);
    const [
        isEditingSubdomainRenewalConfig, 
        setIsEditingSubdomainRenewalConfig
    ]                                         = React.useState(false);

    //TODO get renewal price and implement renewals
    const  { data: rentPrice }  = useSubnameRegistrarRead({
         functionName: 'rentPrice',
         args:         [`${encodedNameToRenew}`, renewForTimeInSeconds],
     });

    console.log("renewal price for " + name, rentPrice);

    //Gets Pricing Data from the subname registrar for a specific parent nam
    const  { data: registerPricingData, refetch: refetchRegisterPricingData }  = useSubnameRegistrarRead({
         functionName: 'pricingData',
         args:         [namehashHex],
     });

    //SubnameRegistrar instance
    const subnameRegistrar = useSubnameRegistrar({
        signerOrProvider: signer
    });

    //NameWrapper instance
    const nameWrapper = useNameWrapper({
        signerOrProvider: signer
    });

    //Gets owner/expiry/fuses from the namewrapper
    const  { data: nameData, refetch: refetchData }  = useNameWrapperRead({
         functionName: 'getData',
         args:         [tokenId],
     });
    const {owner: nameWrapperOwnerAddress, fuses: wrapperFuses} = nameData ?? {};


    //if (nameData === undefined) {

        //Check if the Subname Registrar has been approved for this names owner on the Subname Wrapper
        const  { data: isApprovedForAllSubdomainWrapper, refetch: refetchIsApprovedForAllSubdomainWrapper  }  = useSubnameWrapperRead({
            functionName: 'isApprovedForAll',
            //@ts-ignore
            args:         [nameData?.owner, subnameRegistrarAddress],
        });

        //Check if the Subname Wrapper has been approved for this names owner on the Name Wrapper
        const  { data: isApprovedForAllNameWrapper, refetch: refetchIsApprovedForAllNameWrapper }  = useNameWrapperRead({
            functionName: 'isApprovedForAll',
            //@ts-ignore
            args:         [nameData?.owner, subnameWrapperAddress],
         });

        console.log("isApprovedForAllSubdomainWrapper", isApprovedForAllSubdomainWrapper);
        console.log("isApprovedForAllNameWrapper", isApprovedForAllNameWrapper);
    //}

    //Get the owner address as set in the ENS Registry
    const  { data: registryOwnerAddress }  = useEnsRegistryRead({
         functionName: 'owner',
         args:         [namehashHex],
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
        setIsRenewing(true);
    }


    //Indicates if this name is owned by the connected user
    const isOwnedByUser = nameData?.owner == address;

    //@ts-ignore
    const expiryDate    = new Date(parseInt(nameData?.expiry) * 1000);
    const expiryString  = expiryDate.toLocaleString();


    console.log("CURRENT RC OPTIONS", renewalControllerOptions);
    console.log("CURRENT RC", registerPricingData?.renewalController);

    const currentRenewalController = (renewalControllerOptions.find((option) => option.value == registerPricingData?.renewalController));

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{name}</AlertDialogTitle>
                <AlertDialogDescription asChild>
                    <Accordion type="single" collapsible className="w-full" defaultValue="item-whois">
                        <AccordionItem value="item-whois">
                            <AccordionTrigger>Whois</AccordionTrigger>
                            <AccordionContent>

                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="font-medium">Expiry</TableCell>
                                            <TableCell>
                                                <p>{expiryString}</p>
                                                <div className = "mt-1 text-xs text-blue-800 dark:text-blue-200">{formatExpiry(nameData?.expiry)}</div>
                                            
                                                <div className = "mt-2">

                                                    <div className = "flex mt-8">
                                                        <Select 
                                                            disabled        = {isRenewing}
                                                            onValueChange   = {(value) => setRenewForTimeInSeconds(ethers.BigNumber.from(value))}>
                                                            <SelectTrigger className="w-[180px]">
                                                                <SelectValue placeholder={renewalLengthOptions[0].label} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectGroup>
                                                                    {renewalLengthOptions.map((option) => {
                                                                        
                                                                        return (
                                                                            <SelectItem 
                                                                                key   = {"renew-option-" + option.value}
                                                                                value = {option.value.toString()}>
                                                                                {option.label}
                                                                            </SelectItem>
                                                                        );
                                                                    })}
                                                                </SelectGroup>
                                                            </SelectContent>
                                                        </Select>

                                                        <div className="w-2" />

                                                        <Button 
                                                            type     = "submit" 
                                                            disabled = {isRenewing} 
                                                            onClick  = {onClickRenew}>
                                                            {isRenewing ? CommonIcons.miniLoader : "Renew"}
                                                        </Button>
                                                    </div>


                                                    {!isOwnedByUser && (
                                                        <div className = "mt-1 text-xs text-red-800 dark:text-red-200">
                                                            <span className = "font-bold">{name}</span> is <span className = "font-bold">not owned by you</span>. You can still renew it for the owner.</div>
                                                    )}

                                                    {renewalPrice && (
                                                        <p className = "text-xs mt-2">
                                                            The cost is <span className = "font-bold">Ξ{ethers.utils.formatEther(renewalPrice)}</span> (~${(ethers.utils.formatEther(renewalPrice) * ethPrice).toFixed(2)}).
                                                        </p>
                                                    )}

                                                    {isRenewing && (
                                                        <TransactionConfirmationState 
                                                            key       = {"domain-renewal-" + name}
                                                            contract  = {ethRegistrarController}
                                                            txArgs    = {{
                                                                args: [
                                                                    label,
                                                                    renewForTimeInSeconds
                                                                ],
                                                                overrides: {
                                                                    gasLimit: ethers.BigNumber.from("5000000"),
                                                                    value:    renewalPrice
                                                                }
                                                            }}
                                                            txFunction  = 'renew'
                                                            onConfirmed = {() => {
                                                                console.log("2ld renewal confirmed");

                                                                toast({
                                                                    duration: 5000,
                                                                    className: "bg-green-200 dark:bg-green-800 border-0",
                                                                    description: (<p><span className = "font-bold">{name}</span> was successfully renewed.</p>),
                                                                });
                                                            }}
                                                            onAlways  = {() => {
                                                                console.log("2ld renewal onAlways");
                                                                setIsRenewing(false);
                                                                refetchData();
                                                            }}
                                                            onError = {() => {

                                                                toast({
                                                                    duration: 5000,
                                                                    className: "bg-red-200 dark:bg-red-800 border-0",
                                                                    description: (<p>There was a problem renewing <span className = "font-bold">{name}</span>.</p>),
                                                                });
                                                            }}>
                                                            <div>
                                                                {/* Renewing interface handled manually*/}
                                                            </div>
                                                            <div>
                                                                {/* Success interface handled manually*/}
                                                            </div>
                                                        </ TransactionConfirmationState>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">NameWrapper Owner</TableCell>
                                            <TableCell>
                                                {nameWrapperOwnerAddress}
                                                {isOwnedByUser && (
                                                    <div className = "mt-1 text-xs text-red-800 dark:text-red-200">This is you.</div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">Registry owner</TableCell>
                                            <TableCell>
                                                {registryOwnerAddress}
                                                {registryOwnerAddress == nameWrapperAddress && (
                                                    <div className = "mt-1 text-xs text-red-800 dark:text-red-200">This is the NameWrapper.</div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>

                        {/*Subdomain controls - displayed to owner*/}
                        {isOwnedByUser && (
                            <AccordionItem value="item-subdomain-controls">
                                <AccordionTrigger>Subdomain Controls</AccordionTrigger>
                                <AccordionContent>

                                    <>
                                        <div>
                                            <div className = "mt-1 text-xs text-red-800 dark:text-red-200">
                                                These controls are visible to you because you own <span className = "font-bold">{name}</span>.
                                            </div>

                                            <h3 className = "mt-4 text-base">Approvals</h3>
                                            <div className = "mt-2 text-xs">
                                                Before utilising the subdomain offering you must approve access to our smart contracts to manage your names.
                                            </div>

                                            <div className = "mt-4 text-xs">
                                                1. Approve the <span className = "font-bold">Subdomain Wrapper</span> on the <span className = "font-bold">Name Wrapper</span>.
                                            </div>

                                            {/* The Subname wrapper needs to be approved on the Name Wrapper*/}
                                            {!isApprovedForAllNameWrapper ? (
                                                <>
                                                    <Button 
                                                        type      = "submit" 
                                                        disabled  = {isNameWrapperApprovalPending} 
                                                        onClick   = {onClickApproveForAllNameWrapper} 
                                                        className = "mt-2 disabled:cursor-not-allowed">
                                                        {isNameWrapperApprovalPending ? CommonIcons.miniLoader : "Approve Subdomain Wrapper in Name Wrapper"}
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
                                                                    gasLimit: ethers.BigNumber.from("5000000"),
                                                                    //value: "10000000000000000000"
                                                                }
                                                            }}
                                                            txFunction    = 'setApprovalForAll'
                                                            onConfirmed   = {() => {
                                                                console.log("setApprovalforall done");

                                                                toast({
                                                                    duration: 5000,
                                                                    className: "bg-green-200 dark:bg-green-800 border-0",
                                                                    description: (
                                                                        <p>
                                                                            <span className = "font-bold">SubnameWrapper</span> successfiully approved on the <span className = "font-bold">NameWrapper</span>.
                                                                        </p>
                                                                    ),
                                                                });
                                                            }}
                                                            onAlways = {() => {
                                                                setIsNameWrapperApprovalPending(false);
                                                                refetchIsApprovedForAllNameWrapper?.();
                                                            }}
                                                            onError = {() => {
                                                                toast({
                                                                    duration: 5000,
                                                                    className: "bg-red-200 dark:bg-red-800 border-0",
                                                                    description: (
                                                                        <p>
                                                                            There was a problem approving the <span className = "font-bold">SubnameWrapper</span> on the <span className = "font-bold">NameWrapper</span>.
                                                                        </p>
                                                                    ),
                                                                });
                                                            }}>
                                                            <div>
                                                                {/*Show nothing when approving - we do it on the button*/}
                                                            </div>
                                                            <div>
                                                                {/*Show nothing when approved - we do it in the else*/}
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

                                        <div className = "mt-8 text-xs">
                                            2. Approve the <span className = "font-bold">Subdomain Registrar</span> on the <span className = "font-bold">Subdomain Wrapper</span>.
                                        </div>
                                        
                                        {!isApprovedForAllSubdomainWrapper ? (

                                            <>
                                                <Button 
                                                    type      = "submit" 
                                                    disabled  = {isSubdomainRegistrarApprovalPending} 
                                                    onClick   = {onClickApproveSubdomainRegistrar} 
                                                    className = "mt-2 disabled:cursor-not-allowed">
                                                        {isSubdomainRegistrarApprovalPending ? CommonIcons.miniLoader : "Approve Subdomain Registrar in Subdomain Wrapper"}
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
                                                                gasLimit: ethers.BigNumber.from("5000000"),
                                                                //value: "10000000000000000000"
                                                            }
                                                        }}
                                                        txFunction  = 'setApprovalForAll'
                                                        onConfirmed = {() => {
                                                            console.log("setApprovalforall done");

                                                            toast({
                                                                duration: 5000,
                                                                className: "bg-green-200 dark:bg-green-800 border-0",
                                                                description: (
                                                                    <p>
                                                                        <span className = "font-bold">Subdomain Registrar</span> successfully approved on the <span className = "font-bold">NameWrapper</span>.
                                                                    </p>
                                                                ),
                                                            });
                                                        }}
                                                        onAlways = {() => {
                                                            setIsSubdomainRegistrarApprovalPending(false);
                                                            refetchIsApprovedForAllSubdomainWrapper?.();
                                                        }}
                                                        onError = {() => {
                                                            toast({
                                                                duration: 5000,
                                                                className: "bg-red-200 dark:bg-red-800 border-0",
                                                                description: (
                                                                    <p>
                                                                        There was a problem approving the <span className = "font-bold">Subdomain Registrar</span> on the <span className = "font-bold">NameWrapper</span>.
                                                                    </p>
                                                                ),
                                                            });
                                                        }}>
                                                        <div>
                                                            {/*Show nothing when approving - we do it on the button*/}
                                                        </div>
                                                        <div>
                                                            {/*Show nothing when approved - we do it in the else*/}
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
                            
                                </AccordionContent>
                            </AccordionItem>
                        )}


    
                        <AccordionItem value="item-subdomain-registration-config">
                            <AccordionTrigger>Subdomain Registration Configuration</AccordionTrigger>
                            <AccordionContent asChild>

                                <>

                                    <div className = "text-xs text-red-800 dark:text-red-200 mb-4">
                                        This section details configuration options for registration of subdomains under <span className = "font-bold">{name}</span>.
                                    </div>

                                    {!isEditingSubdomainRegistrationConfig ? (
                                        <>
                                            {registerPricingData ? (
                                                <Table>
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell className="font-medium">Offers subdomains</TableCell>
                                                            <TableCell>{registerPricingData?.offerSubnames ? CommonIcons.check : CommonIcons.cross}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-medium">Renewal Controller</TableCell>
                                                            <TableCell>{registerPricingData?.renewalController}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-medium">Min Duration</TableCell>
                                                            <TableCell>{registerPricingData?.minRegistrationDuration}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-medium">Min Characters</TableCell>
                                                            <TableCell>{registerPricingData?.minChars}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-medium">Max Characters</TableCell>
                                                            <TableCell>{registerPricingData?.maxChars}</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>  
                                            ) : (
                                                <div>No pricing data</div>
                                            )}

                                            {isOwnedByUser && (
                                                <div className = "text-center mt-4">
                                                    <Button 
                                                        type    ="submit" 
                                                        onClick   = {(e) => {
                                                            setIsEditingSubdomainRegistrationConfig(true);
                                                        }} 
                                                        className = "mt-4">
                                                        Edit Configuration
                                                    </Button>

                                                    <div className = "mt-1 text-xs text-red-800 dark:text-red-200">
                                                        You have this option because you own <span className = "font-bold">{name}</span>.
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>

                                            <div className = "my-2">
                                                <Checkbox 
                                                    id             = "offerSubdomains"
                                                    ref            = {offerSubnamesRef} 
                                                    defaultChecked = {registerPricingData?.offerSubnames}
                                                    disabled       = {isSavingRegistrationConfigurationData} />
                                                <label
                                                    htmlFor="offerSubdomains"
                                                    className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Offer subdomains
                                                </label>
                                            </div>

                                            <Label htmlFor="renewalController">Renewal Controller</Label>

                                            <Select 
                                                value           = {(currentRenewalController?.value)}
                                                onValueChange   = {(value) => setRenewalControllerInput(value)}
                                                disabled        = {isSavingRegistrationConfigurationData}>
                                                <SelectTrigger className = "my-2">
                                                    <SelectValue placeholder="Select a renewal controller" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {renewalControllerOptions.map((option) => {
                                                            
                                                            return (
                                                                <SelectItem 
                                                                    key   = {"renewal-controller-option-" + option.value}
                                                                    value = {option.value}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>

                                            <Label htmlFor="minRegistrationDuration">Minimum Registration Duration</Label>
                                            <Input 
                                                type         = "text" 
                                                id           = "minRegistrationDuration" 
                                                ref          = {minRegistrationDurationInputRef} 
                                                defaultValue = {registerPricingData?.minRegistrationDuration} 
                                                className    = "my-2"
                                                disabled     = {isSavingRegistrationConfigurationData} />

                                            <Label htmlFor="minChars">Minimum Characters</Label>
                                            <Input 
                                                type         = "text" 
                                                id           = "minChars" 
                                                ref          = {minCharactersInputRef} 
                                                defaultValue = {registerPricingData?.minChars} 
                                                className    = "my-2"
                                                disabled     = {isSavingRegistrationConfigurationData} />

                                            <Label htmlFor="maxChars">Maximum Characters</Label>
                                            <Input 
                                                type         = "text" 
                                                id           = "maxChars" 
                                                ref          = {maxCharactersInputRef} 
                                                defaultValue = {registerPricingData?.maxChars} 
                                                className    = "my-2"
                                                disabled     = {isSavingRegistrationConfigurationData} />

                                            <Button 
                                                type        = "submit" 
                                                onClick     = {(e) => {
                                                    setIsSavingRegistrationConfigurationData(true);
                                                }} 
                                                disabled    = {isSavingRegistrationConfigurationData}
                                                className   = "mt-2 disabled:cursor-not-allowed">
                                                {isSavingRegistrationConfigurationData ? CommonIcons.miniLoader : "Save Configuration"}
                                            </Button>

                                            {isSavingRegistrationConfigurationData && (
                                                <TransactionConfirmationState 
                                                    key = {"save-subdomain-registration-config-" + name}
                                                    contract = {subnameRegistrar}
                                                    txArgs = {{
                                                        args: [
                                                            namehashHex,
                                                            true,
                                                            //offerSubnamesRef.current ? offerSubnamesRef.current!.checked : null,
                                                            renewalControllerInput,
                                                            minRegistrationDurationInputRef ? minRegistrationDurationInputRef.current?.value : null,
                                                            minCharactersInputRef ? minCharactersInputRef.current?.value : null,
                                                            maxCharactersInputRef ? maxCharactersInputRef.current?.value : null,
                                                        ],
                                                        overrides: {
                                                            gasLimit: ethers.BigNumber.from("5000000"),
                                                            //value: "10000000000000000000"
                                                        }
                                                    }}
                                                    txFunction = 'setParams'
                                                    onConfirmed = {() => {
                                                        console.log("setParams done");

                                                        toast({
                                                            duration: 5000,
                                                            className: "bg-green-200 dark:bg-green-800 border-0",
                                                            description: (
                                                                <p>
                                                                    Subdomain registration configuration changes saved on chain.
                                                                </p>
                                                            ),
                                                        });
                                                    }}
                                                    onAlways = {() => {
                                                        setIsEditingSubdomainRegistrationConfig(false);
                                                        refetchRegisterPricingData();
                                                    }}
                                                    onError = {() => {
                                                        toast({
                                                            duration: 5000,
                                                            className: "bg-red-200 dark:bg-red-800 border-0",
                                                            description: (
                                                                <p>
                                                                    There was a problem saving your subdomain registration configuration changes.
                                                                </p>
                                                            ),
                                                        });
                                                    }}>
                                                    <div>
                                                        {/*Handled manually*/}
                                                    </div>
                                                    <div>
                                                        {/*Handled manually*/}
                                                    </div>
                                                </ TransactionConfirmationState>
                                            )}
                                        </> 
                                    )}
                                </>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-subdomain-renewal-config">
                            <AccordionTrigger>Subdomain Renewal Configuration</AccordionTrigger>
                            <AccordionContent>

                                <div className = "text-xs text-red-800 dark:text-red-200 mb-4">
                                    This section details configuration options for renewal of subdomains under <span className = "font-bold">{name}</span>.
                                </div>


                            
                                {registerPricingData?.renewalController == "0x0000000000000000000000000000000000000000" ? (

                                    <p className = "text-xs text-red-800">This domain <span className = "font-bold">does not</span> have a renewal controller set.</p>
                                ) : (

                                    <>
                                        <div className = "text-xs text-red-800 dark:text-red-200 mb-4">
                                            The <span className="font-bold">{currentRenewalController?.label}</span> renewal controller allows you to set pricing <span className="font-bold">{currentRenewalController?.controlDescription}</span> 
                                        </div>



                                        {!isEditingSubdomainRenewalConfig ? (
                                            <>
                                                {renewalPricingData ? (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="font-medium">Characters</TableHead>
                                                                <TableHead>Price (USD)</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {renewalPricingData.map((value, index) => {

                                                                return (
                                                                    <TableRow
                                                                        key = {"renewal-price-" + index}>
                                                                        <TableCell className="font-medium">
                                                                            {lastRenewalPriceIndex && (""+(index) == lastRenewalPriceIndex?.toString()) ? "All others" : (index)}
                                                                        </TableCell>
                                                                        <TableCell>${value}</TableCell>
                                                                    </TableRow>
                                                                );

                                                            })}      
                                                        </TableBody>
                                                    </Table>  
                                                ) : (
                                                    <div>No renewal configuration data is available.</div>
                                                )}

                                                {isOwnedByUser && (
                                                    <div className = "text-center mt-4">
                                                        <Button 
                                                            type    ="submit" 
                                                            onClick   = {(e) => {
                                                                setIsEditingSubdomainRenewalConfig(true);
                                                            }} 
                                                            className = "mt-4">
                                                            {isSavingRenewalConfigurationData ? CommonIcons.miniLoader : "Edit Configuration"}
                                                        </Button>

                                                        <div className = "mt-1 text-xs text-red-800 dark:text-red-200">
                                                            You have this option because you own <span className = "font-bold">{name}</span>.
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>

                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="font-medium">Characters</TableHead>
                                                            <TableHead>Price (USD)</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {renewalPriceInput.map((value, index) => {

                                                            return (
                                                                <TableRow
                                                                    key = {"renewal-price-" + index}>
                                                                    <TableCell className="font-medium">
                                                                        {index + 1 == (renewalPriceInput.length) ? "All others" : (index)}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Input 
                                                                            type         = "text" 
                                                                            value = {value} 
                                                                            disabled     = {isSavingRenewalConfigurationData}
                                                                            onChange = {(e) => {

                                                                                const newInput = [...renewalPriceInput];
                                                                                newInput[index] = e.target.value;

                                                                                console.log("renewalPriceInput", newInput);

                                                                                setRenewalPriceInput(newInput)
                                                                            }} 
                                                                            />
                                                                    </TableCell>
                                                                </TableRow>
                                                            );

                                                        })}      
                                                    </TableBody>
                                                </Table>  

                                                <div className = "flex">
                                                    <Button 
                                                        type="submit" 
                                                        onClick = {(e) => {
                                                            const newInput = [...renewalPriceInput];
                                                            newInput.splice(newInput.length - 1, 0, 0);
                                                            setRenewalPriceInput(newInput)

                                                            console.log("NEWWW", newInput);

                                                        }} 
                                                        className = "mt-2"
                                                        disabled     = {isSavingRenewalConfigurationData}>
                                                        Add Another
                                                    </Button>

                                                    <div className = "w-1"></div>

                                                    <Button 
                                                        type="submit" 
                                                        onClick = {(e) => {
                                                            setIsSavingRenewalConfigurationData(true);

                                                            console.log("tosend", renewalPriceInput.map((value) => {
                                                                        return Math.floor((value / 31536000) * 1e18);
                                                                    }));
                                                        }} 
                                                        className = "mt-2"
                                                        disabled     = {isSavingRenewalConfigurationData}>
                                                        {isSavingRenewalConfigurationData ? CommonIcons.miniLoader : "Save Configuration"}
                                                    </Button>
                                                </div>

                                                {isSavingRenewalConfigurationData && (
                                                    <TransactionConfirmationState 
                                                        key = {"save-subdomain-renewal-config-" + name}
                                                        contract = {renewalController}
                                                        txArgs = {{
                                                            args: [
                                                                renewalPriceInput.map((value) => {
                                                                    return Math.floor((value / 31536000) * 1e18);
                                                                })
                                                            ],
                                                            overrides: {
                                                                gasLimit: ethers.BigNumber.from("5000000"),
                                                                //value: "10000000000000000000"
                                                            }
                                                        }}
                                                        txFunction = 'setPricingForAllLengths'
                                                        onConfirmed = {() => {
                                                            console.log("setPricingForAllLengths done");

                                                            toast({
                                                                duration: 5000,
                                                                className: "bg-green-200 dark:bg-green-800 border-0",
                                                                description: (
                                                                    <p>
                                                                        Subdomain renewal configuration saved on chain.
                                                                    </p>
                                                                ),
                                                            });
                                                        }}
                                                        onAlways = {() => {
                                                            setIsSavingRenewalConfigurationData(false);
                                                            setIsEditingSubdomainRenewalConfig(false);
                                                            refetchLastRenewalPriceIndex();
                                                        }}
                                                        onError = {() => {
                                                            toast({
                                                                duration: 5000,
                                                                className: "bg-red-200 dark:bg-red-800 border-0",
                                                                description: (
                                                                    <p>
                                                                        There was a problem updating your subdomain renewal configuration.
                                                                    </p>
                                                                ),
                                                            });
                                                        }}>
                                                        <div>
                                                            {/*Handled manually*/}
                                                        </div>
                                                        <div>
                                                            {/*Handled manually*/}
                                                        </div>
                                                    </ TransactionConfirmationState>
                                                )}
                                            </> 
                                        )}
                                    </>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-fuses">
                            <AccordionTrigger>Fuses</AccordionTrigger>
                            <AccordionContent>
                                <>
                                    <p className = "text-xs text-red-800">This section details the fuses that have been burned on this domain.
                                    </p> 
                                    <p className = "text-xs text-red-800 mt-2">
                                        For more information on fuses please see the <a className = "underline" href = "https://support.ens.domains/dev-basics/namewrapper/fuses" target = "_blank">ENS documentation</a>.</p>

                                    <FuseList name = {name} />
                                </>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogAction className = "mt-8">Close</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    )
}
