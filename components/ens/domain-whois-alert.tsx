const ethPrice = 1800;

import * as React from 'react'

import { Icon }                           from '@iconify/react';

import { ethers }                         from "ethers";
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

import { FuseList }                           from '@/components/ens/fuse-list';

import { Button }                         from "@/components/ui/button"
import { Checkbox }                       from "@/components/ui/checkbox"
import { Input }                          from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

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

    //References for the Pricing Data inputs so we can get the values when saving
    const offerSubnamesRef                = React.useRef<HTMLButtonElement & { checked: boolean }>(null);
    const minRegistrationDurationInputRef = React.useRef<HTMLInputElement>(null);
    const minCharactersInputRef           = React.useRef<HTMLInputElement>(null);
    const maxCharactersInputRef           = React.useRef<HTMLInputElement>(null);
    const [renewalControllerInput, setRenewalControllerInput]           = React.useState<string | null>(null);
    const [renewalPricingData, setRenewalPricingData]           = React.useState<array>([]);
    const [isSavingRegistrationPricingData, setIsSavingRegistrationPricingData]           = React.useState<boolean>(false);
    const [isSavingRenewalPricingData, setIsSavingRenewalPricingData]           = React.useState<boolean>(false);

    const domainParts                     = name.split(".");
    const label                           = domainParts[0];
    const namehash                        = ethers.utils.namehash(name);
    const namehashHex: `0x${string}`      = namehash as `0x${string}`;

    console.log("namehash", typeof namehash);
    console.log("namehashHex", namehashHex);

    const tokenId                         = ethers.BigNumber.from(namehash);
    const encodedNameToRenew              = hexEncodeName(name);
    const [renewForTimeInSeconds, setRenewForTimeInSeconds]           = React.useState(ethers.BigNumber.from("31536000"));

    const { toast, dismiss } = useToast()

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
    const ethRegistrarController = useEthRegistrarController({
        signerOrProvider: signer
    });

    //RenewalController instance
    const renewalController = useRenewalController({
        signerOrProvider: signer
    });


  const [enabled, setEnabled] = React.useState(false)

    const  { data: lastRenewalPriceIndex }  = useRenewalControllerRead({
        functionName:  'getLastCharIndex',
        args:          [],
        enabled,
        //typeof signer !== "undefined"
    });


    React.useEffect(() => {
        
        console.log("lastRenewalPriceIndex changed", lastRenewalPriceIndex);
        console.log("lastRenewalPriceIndex changedb", signer);
        console.log("lastRenewalPriceIndex changedc", renewalController);

        const doWork = async () => {

        console.log("lastRenewalPriceIndex changedDD", renewalController);

            var pricingData = [];

            console.log("lastRenewalPriceIndex do work", parseInt(lastRenewalPriceIndex.toString()));
            console.log("lastRenewalPriceIndex do work1", renewalController);

            for (var i = 0; i < 3; i++) {

                const price = await renewalController.charAmounts(i);

                console.log("lastRenewalPriceIndex price wut " + i, price);

                const pricePerYear = (price.mul(ethers.BigNumber.from("31536000")));
                const formatted = ethers.utils.formatEther(pricePerYear.toString())
                const rounded = new Intl.NumberFormat('en-EN', {
                    maximumFractionDigits: 2
                }).format(formatted);
                pricingData.push(rounded);
            }

console.log("lastRenewalPriceIndex price do work2", pricingData);


            setRenewalPricingData(pricingData);
        }

        console.log("lastRenewalPriceIndex WUT", renewalController);
        if (signer) {
            console.log("lastRenewalPriceIndex", lastRenewalPriceIndex);
            doWork();
        }

    }, [signer]);


    const  { data: registrationPriceData }  = useEthRegistrarControllerRead({
        functionName:  'rentPrice',
        args:          [name, renewForTimeInSeconds],
    });

    console.log("registrationPriceData", registrationPriceData);

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


    const currentRenewalController = (renewalControllerOptions.find((option) => option.value == registerPricingData?.renewalController));

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{name}</AlertDialogTitle>
                <AlertDialogDescription>


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

                                                    {!isRenewing ? (
                                                        <>
                                                            <div className = "flex">
                                                                <Select onValueChange = {(value) => setRenewForTimeInSeconds(ethers.BigNumber.from(value))}>
                                                                    <SelectTrigger className="w-[180px]">
                                                                        <SelectValue placeholder="Select a duration" />
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

                                                                <div className="w-2" />

                                                                <Button 
                                                                    type     = "submit" 
                                                                    disabled = {isRenewing} 
                                                                    onClick  = {onClickRenew}>
                                                                    {isRenewing && CommonIcons.miniLoader}
                                                                    Renew
                                                                </Button>
                                                            </div>


                                                            {registrationPriceData && (
                                                                <p className = "text-xs mt-2">
                                                                    The cost is <span className = "font-bold">Ξ{ethers.utils.formatEther(registrationPriceData.base.add(registrationPriceData.premium))}</span> (~${(ethers.utils.formatEther(registrationPriceData.base.add(registrationPriceData.premium)) * ethPrice).toFixed(2)}).
                                                                </p>
                                                            )}
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
                                                                    gasLimit: ethers.BigNumber.from("5000000"),
                                                                    value:    "1000000000000000000"
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
                                                                {CommonIcons.miniLoader} Renewing domain..
                                                            </div>
                                                            <div>
                                                                SUCCESS
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
                        <AccordionItem value="item-subdomain-controls">
                            <AccordionTrigger>Subdomain Controls</AccordionTrigger>
                            <AccordionContent>


                                {/*Subdomain controls - displayed to owner*/}
                                {isOwnedByUser && (
                                    <>
                                        <div>
                                            <div className = "mt-1 text-xs text-red-800 dark:text-red-200">
                                                These controls are visible to you because you own <span className = "font-bold">{name}</span>.
                                            </div>

                                            <h3 className = "mt-4 text-base">Approvals</h3>
                                            <div className = "mt-2 text-xs">
                                                Before utilising the subdomain offering you must approve access to our smart contracts to manage your names.
                                            </div>

                                            <div className = "mt-2 text-xs">
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
                                                                    description: (<p>SubnameWrapper successfiully approved on the NameWrapper.</p>),
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
                                                                    description: (<p>There was a problem aproving the SubnameWrapper on the NameWrapper.</p>),
                                                                });
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

                                        <div className = "mt-4 text-xs">
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
                                                                description: (<p>Subdomain registrar successfully approved on the NameWrapper.</p>),
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
                                                                description: (<p>There was a problem aproving the subdomain registrar on the NameWrapper.</p>),
                                                            });
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

                        <AccordionItem value="item-subdomain-registration-config">
                            <AccordionTrigger>Subdomain Registration Config</AccordionTrigger>
                            <AccordionContent>

                                <div className = "text-xs text-red-800 dark:text-red-200 mb-4">
                                    This section details configuration options for registration of subdomains under {name}.
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
                                                    Edit
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
                                                defaultChecked = {registerPricingData?.offerSubnames} />
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
                                            onValueChange   = {(value) => setRenewalControllerInput(value)}>
                                            <SelectTrigger className = "my-2">
                                                <SelectValue placeholder="Select a renewal controller" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {renewalControllerOptions.map((option) => {
                                                        
                                                        return (
                                                            <SelectItem 
                                                                key   = {option.value}
                                                                value = {option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>

                                        <Label htmlFor="minRegistrationDuration">Minimum Registration Duration</Label>
                                        <Input type = "text" id = "minRegistrationDuration" ref = {minRegistrationDurationInputRef} defaultValue = {registerPricingData?.minRegistrationDuration} className = "my-2" />

                                        <Label htmlFor="minChars">Minimum Characters</Label>
                                        <Input type = "text" id = "minChars" ref = {minCharactersInputRef} defaultValue = {registerPricingData?.minChars} className = "my-2" />

                                        <Label htmlFor="maxChars">Maximum Characters</Label>
                                        <Input type = "text" id = "maxChars" ref = {maxCharactersInputRef} defaultValue = {registerPricingData?.maxChars} className = "my-2" />

                                        {!isSavingRegistrationPricingData ? (
                                            <Button 
                                                type="submit" 
                                                onClick = {(e) => {
                                                    setIsSavingRegistrationPricingData(true);
                                                }} className = "mt-2">
                                                Save Changes
                                            </Button>
                                        ) : (
                                            <TransactionConfirmationState 
                                                key = {"save-subdomain-registration-config-" + name}
                                                contract = {subnameRegistrar}
                                                txArgs = {{
                                                    args: [
                                                        namehashHex,
                                                        true,
                                                        //offerSubnamesRef.current ? offerSubnamesRef.current!.checked : null,
                                                        renewalControllerInput,
                                                        minRegistrationDurationInputRef ? minRegistrationDurationInputRef.current!.value : null,
                                                        minCharactersInputRef ? minCharactersInputRef.current!.value : null,
                                                        maxCharactersInputRef ? maxCharactersInputRef.current!.value : null,
                                                    ],
                                                    overrides: {
                                                        gasLimit: ethers.BigNumber.from("5000000"),
                                                        //value: "10000000000000000000"
                                                    }
                                                }}
                                                txFunction = 'setParams'
                                                onConfirmed = {() => {
                                                    console.log("setParams done");
                                                    setIsEditingSubdomainRegistrationConfig(false);

                                                    toast({
                                                        duration: 5000,
                                                        className: "bg-green-200 dark:bg-green-800 border-0",
                                                        description: (<p>Subdomain registration config confirmed on chain.</p>),
                                                    });
                                                }}
                                                onAlways = {() => {
                                                    refetchRegisterPricingData();
                                                }}
                                                onError = {() => {
                                                    toast({
                                                        duration: 5000,
                                                        className: "bg-red-200 dark:bg-red-800 border-0",
                                                        description: (<p>There was a problem updating your subdomain registration config.</p>),
                                                    });
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

                        <AccordionItem value="item-subdomain-renewal-config">
                            <AccordionTrigger>Subdomain Renewal Config</AccordionTrigger>
                            <AccordionContent>

                                <div className = "text-xs text-red-800 dark:text-red-200 mb-4">
                                    This section details configuration options for renewal of subdomains under <span className = "font-bold">{name}</span>.
                                </div>

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
                                                            <TableRow>
                                                                <TableCell className="font-medium">
                                                                    {lastRenewalPriceIndex && (""+(index + 1) == lastRenewalPriceIndex?.toString()) ? "All others" : (index + 1)}
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
                                                    Edit
                                                </Button>

                                                <div className = "mt-1 text-xs text-red-800 dark:text-red-200">
                                                    You have this option because you own <span className = "font-bold">{name}</span>.
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>

                                        <Label htmlFor="minRegistrationDuration">Minimum Registration Duration</Label>
                                        <Input type = "text" id = "minRegistrationDuration" ref = {minRegistrationDurationInputRef} defaultValue = {pricingData?.minRegistrationDuration} className = "my-2" />

                                        {!isSavingRenewalPricingData ? (
                                            <Button 
                                                type="submit" 
                                                onClick = {(e) => {
                                                    setIsSavingRenewalPricingData(true);
                                                }} className = "mt-2">
                                                Save Changes
                                            </Button>
                                        ) : (
                                            <TransactionConfirmationState 
                                                key = {"save-subdomain-registration-config-" + name}
                                                contract = {subnameRegistrar}
                                                txArgs = {{
                                                    args: [
                                                        namehashHex,
                                                        true,
                                                        //offerSubnamesRef.current ? offerSubnamesRef.current!.checked : null,
                                                        renewalControllerInput,
                                                        minRegistrationDurationInputRef ? minRegistrationDurationInputRef.current!.value : null,
                                                        minCharactersInputRef ? minCharactersInputRef.current!.value : null,
                                                        maxCharactersInputRef ? maxCharactersInputRef.current!.value : null,
                                                    ],
                                                    overrides: {
                                                        gasLimit: ethers.BigNumber.from("5000000"),
                                                        //value: "10000000000000000000"
                                                    }
                                                }}
                                                txFunction = 'setParams'
                                                onConfirmed = {() => {
                                                    console.log("setParams done");
                                                    setIsSavingRenewalPricingData(false);
                                                    setIsEditingSubdomainRegistrationConfig(false);

                                                    toast({
                                                        duration: 5000,
                                                        className: "bg-green-200 dark:bg-green-800 border-0",
                                                        description: (<p>Subdomain registration config confirmed on chain.</p>),
                                                    });
                                                }}
                                                onAlways = {() => {
                                                    refetchRenewalPricingData();
                                                }}
                                                onError = {() => {
                                                    toast({
                                                        duration: 5000,
                                                        className: "bg-red-200 dark:bg-red-800 border-0",
                                                        description: (<p>There was a problem updating your subdomain registration config.</p>),
                                                    });
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
                        <AccordionItem value="item-fuses">
                            <AccordionTrigger>Fuses</AccordionTrigger>
                            <AccordionContent>
                                <FuseList name = {name} />
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
