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

    //ETHRegistrarController instance
    const ethRegistrarController = useEthRegistrarController({
        address:          ethRegistrarControllerAddress,
        signerOrProvider: signer
    });

    //RenewalController instance
    const renewalController = useRenewalController({
        address:          renewalControllerAddress,
        signerOrProvider: signer
    });

    const  { data: renewalPrice }  = useEthRegistrarControllerRead({
        address:       ethRegistrarControllerAddress,
        functionName:  'rentPrice',
        args:          [name, renewForTimeInSeconds],
    });

    console.log("renewalPrice", renewalPrice);

    //SubnameWrapper instance
    const subnameWrapper = useSubnameWrapper({
        address:          subnameWrapperAddress,
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
         args:         [`0x${encodedNameToRenew}`, renewForTimeInSeconds],
     });

    console.log("renewal price for " + name, rentPrice);

    //Gets Pricing Data from the subname registrar for a specific parent nam
    const  { data: pricingData, refetch: refetchPricingData }  = useSubnameRegistrarRead({
         address:      subnameRegistrarAddress,
         functionName: 'pricingData',
         args:         [namehashHex],
     });

    //SubnameRegistrar instance
    const subnameRegistrar = useSubnameRegistrar({
        address:          subnameRegistrarAddress,
        signerOrProvider: signer
    });

    //NameWrapper instance
    const nameWrapper = useNameWrapper({
        address:          nameWrapperAddress,
        signerOrProvider: signer
    });

    //Gets owner/expiry/fuses from the namewrapper
    const  { data: nameData, refetch: refetchData }  = useNameWrapperRead({
         address:      nameWrapperAddress,
         functionName: 'getData',
         args:         [tokenId],
     });
    const {owner: nameWrapperOwnerAddress, fuses: wrapperFuses} = nameData ?? {};


    //if (nameData === undefined) {

        //Check if the Subname Registrar has been approved for this names owner on the Subname Wrapper
        const  { data: isApprovedForAllSubdomainWrapper, refetch: refetchIsApprovedForAllSubdomainWrapper  }  = useSubnameWrapperRead({
            address:      subnameWrapperAddress,
            functionName: 'isApprovedForAll',
            //@ts-ignore
            args:         [nameData?.owner, subnameRegistrarAddress],
        });

        //Check if the Subname Wrapper has been approved for this names owner on the Name Wrapper
        const  { data: isApprovedForAllNameWrapper, refetch: refetchIsApprovedForAllNameWrapper }  = useNameWrapperRead({
            address:      nameWrapperAddress,
            functionName: 'isApprovedForAll',
            //@ts-ignore
            args:         [nameData?.owner, subnameWrapperAddress],
         });

        console.log("isApprovedForAllSubdomainWrapper", isApprovedForAllSubdomainWrapper);
        console.log("isApprovedForAllNameWrapper", isApprovedForAllNameWrapper);
    //}

    //Get the owner address as set in the ENS Registry
    const  { data: registryOwnerAddress }  = useEnsRegistryRead({
         address:      ensRegistryAddress,
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


                                                            {renewalPrice && (
                                                                <p className = "text-xs mt-2">
                                                                    The cost is <span className = "font-bold">Ξ{ethers.utils.formatEther(renewalPrice.base.add(renewalPrice.premium))}</span> (~${(ethers.utils.formatEther(renewalPrice.base.add(renewalPrice.premium)) * ethPrice).toFixed(2)}).
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
                                                These controls are visible to you because you own {name}.
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
                                                            }}
                                                            onAlways = {() => {
                                                                setIsNameWrapperApprovalPending(false);
                                                                refetchIsApprovedForAllNameWrapper?.();
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
                                                        }}
                                                        onAlways = {() => {
                                                            setIsSubdomainRegistrarApprovalPending(false);
                                                            refetchIsApprovedForAllSubdomainWrapper?.();
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

                                <div className = "text-xs text-red-800 dark:text-red-200 mb-4">
                                    This section details pricing data for registration of subdomains under {name}.
                                </div>

                                {!isEditingPricingData ? (
                                    <>
                                        {pricingData ? (
                                            <Table>
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell className="font-medium">Offers subdomains</TableCell>
                                                        <TableCell>{pricingData?.offerSubnames ? CommonIcons.check : CommonIcons.cross}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">Renewal Controller</TableCell>
                                                        <TableCell>{pricingData?.renewalController}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">Min Duration</TableCell>
                                                        <TableCell>{pricingData?.minRegistrationDuration}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">Min Characters</TableCell>
                                                        <TableCell>{pricingData?.minChars}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">Max Characters</TableCell>
                                                        <TableCell>{pricingData?.maxChars}</TableCell>
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
                                                        setIsEditingPricingData(true);
                                                    }} 
                                                    className = "mt-4">
                                                    Modify Pricing Data
                                                </Button>

                                                <div className = "mt-1 text-xs text-red-800 dark:text-red-200">
                                                    You have this option because you own {name}.
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
                                                defaultChecked = {pricingData?.offerSubnames} />
                                            <label
                                                htmlFor="offerSubdomains"
                                                className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Offer subdomains
                                            </label>
                                        </div>

                                        <Label htmlFor="renewalController">Renewal Controller</Label>

                                        <Select 
                                            value           = {(renewalControllerOptions.find((option) => option.value == pricingData?.renewalController))?.value}
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
                                        <Input type = "text" id = "minRegistrationDuration" ref = {minRegistrationDurationInputRef} defaultValue = {pricingData?.minRegistrationDuration} className = "my-2" />

                                        <Label htmlFor="minChars">Minimum Characters</Label>
                                        <Input type = "text" id = "minChars" ref = {minCharactersInputRef} defaultValue = {pricingData?.minChars} className = "my-2" />

                                        <Label htmlFor="maxChars">Maximum Characters</Label>
                                        <Input type = "text" id = "maxChars" ref = {maxCharactersInputRef} defaultValue = {pricingData?.maxChars} className = "my-2" />

                                        {!isSavingPricingData ? (
                                            <Button 
                                                type="submit" 
                                                onClick = {(e) => {
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
