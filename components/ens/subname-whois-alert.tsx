import React                            from 'react'

import { ethers }                       from "ethers";
import { 
    useAccount,
    useNetwork, 
    useSigner,
    useChainId 
}                                       from 'wagmi'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
}                                       from "@/components/ui/alert-dialog"

import { 
    Tabs, 
    TabsContent, 
    TabsList, 
    TabsTrigger 
}                                       from "@/components/ui/tabs"

import {
    Table,
    TableBody,
    TableCell,
    TableRow,
}                                       from "@/components/ui/table"

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
}                                       from "@/components/ui/tooltip"

import { Button }                       from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
}                                       from "@/components/ui/select"

import {
    renewalLengthOptions,
    getRenewalControllerOptions
}                                       from '../../helpers/select-options';

import { FuseList }                     from '@/components/ens/fuse-list';

import { 
    formatExpiry, 
    hexEncodeName 
}      
                                        from '../../helpers/Helpers.jsx';

import {
    ZERO_ADDRESS,
}                                       from '../../helpers/constants'

import { 
    useEnsRegistryRead, 
    useNameWrapperRead, 
    useIRenewalController, 
    useSubnameWrapperRead,
    useIRenewalControllerRead,
    subnameRegistrarAddress,
    subnameWrapperAddress,
    nameWrapperAddress 
}                                       from '../../lib/blockchain'
import CommonIcons                      from '../shared/common-icons';
import { TransactionConfirmationState } from '../shared/transaction-confirmation-state'

interface SubnameWhoisAlertProps {
    name: string,
}

// @ts-ignore
export function SubnameWhoisAlert({ name }: SubnameWhoisAlertProps): React.ReactElement | null {

    const { address }                       = useAccount()
    const { chain }                         = useNetwork()
    const  chainId                          = useChainId();

    const renewalControllerOptions          = getRenewalControllerOptions(chainId);

    const { 
        data: signer, 
    }                                       = useSigner()

    const hasSigner = typeof signer !== "undefined";

    //Boolean indicating if we are in the process of renewing the subname
    const [isRenewing, setIsRenewing]       = React.useState(false);

    const namehash: `0x${string}`           = ethers.utils.namehash(name) as `0x${string}`;
    const tokenId                           = ethers.BigNumber.from(namehash);
    const encodedNameToRenew: `0x${string}` = hexEncodeName(name) as `0x${string}`;
    //Holds the selected time in seconds for a renewal
    const [
        renewForTimeInSeconds, 
        setRenewForTimeInSeconds
    ]                                       = React.useState(ethers.BigNumber.from(renewalLengthOptions[0].value));
    const refererAddress                    = "0x0000000000000000000000000000000000005627";

    //Owner of the subdoomain in the SubnameWrapper
    const  { data: ownerAddress }           = useSubnameWrapperRead({
        chainId:      chainId,
        functionName: 'ownerOf',
        args:         [tokenId],
    });

    const  { 
        data:    nameData, 
        refetch: refetchData  
    }                                       = useSubnameWrapperRead({
        chainId:      chainId,
        functionName: 'getData',
        args:         [tokenId],
    });

    var renewalControllerToUse = null;

    if (nameData && nameData.renewalController != ZERO_ADDRESS) { 
        renewalControllerToUse = nameData.renewalController; 
    } 

    const  { data: renewalPriceData }        = useIRenewalControllerRead({
        address:      renewalControllerToUse,
        chainId:      chainId,
        functionName: 'rentPrice',
        args:         [encodedNameToRenew, renewForTimeInSeconds]
    });

    const { 
        weiPrice: renewalPriceWei, 
        usdPrice: renewalPriceUsd 
    }                                        = renewalPriceData ?? {weiPrice: 0, usdPrice: 0};

    console.log("renewalPriceUsd", renewalPriceUsd);

    const renewalControllerToUseInstance     = useIRenewalController({
        address:          renewalControllerToUse,
        chainId:          chainId,
        signerOrProvider: signer
    });

    const  { data: canRegistrarModifyName }  = useSubnameWrapperRead({
        chainId:      chainId,
        functionName: 'canModifyName',
        args:         [namehash, subnameRegistrarAddress[chainId]],
    });

    console.log("canRegistrarModifyName", canRegistrarModifyName);

    const  { 
        data: nameWrapperOwnerAddress 
    }                                        = useNameWrapperRead({
        chainId:      chainId,
        functionName: 'ownerOf',
        args:         [tokenId],
    });

    const  { data: registryOwnerAddress }    = useEnsRegistryRead({
        chainId:      chainId,
        functionName: 'owner',
        args:         [namehash],
    });

    const isOwnedByUser                     = nameData?.owner == address;

    //@ts-ignore
    const expiryDate                        = new Date(parseInt(nameData?.expiry) * 1000);
    const expiryString                      = expiryDate.toLocaleString();

    const currentRenewalControllerData      = renewalControllerOptions.find((option) => option.value == renewalControllerToUse);

    //Handler for when the 'Renew' button is clicked
    const onClickRenew = () => {

        setIsRenewing(true);
    }

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{name}</AlertDialogTitle>
                <AlertDialogDescription asChild>

                    <Tabs defaultValue = "item-profile">
                        <TabsList className = "flex flex-wrap w-fit mx-auto">
                            <TabsTrigger value = "item-profile">Profile</TabsTrigger>
                            <TabsTrigger value = "item-fuses">Fuses</TabsTrigger>
                        </TabsList>

                        <TabsContent value = "item-profile" asChild>

                            <>
                                <h1 className = "my-4 text-lg">Profile</h1>

                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className = "font-medium">
                                                SubnameWrapper Owner
                                            </TableCell>
                                            <TableCell>
                                                {address == ownerAddress ? (
                                                    <Tooltip delayDuration = {0}>
                                                        <TooltipTrigger asChild>
                                                            <span>{ownerAddress}</span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>This is you.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ) : (<span>{ownerAddress}</span>)}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className = "font-medium">Expiry</TableCell>
                                            <TableCell>
                                                
                                                <p>{expiryString}</p>
                                                <div className = "mt-1 text-xs text-blue-800 dark:text-blue-200">
                                                    {formatExpiry(nameData?.expiry)}
                                                </div>

                                                {!isRenewing ? (  

                                                    <>
                                                         {renewalControllerToUse != null ? (
                                                            <>
                                                                <div className = "flex mt-8">

                                                                    <Select onValueChange = {(value) => setRenewForTimeInSeconds(ethers.BigNumber.from(value))}>
                                                                        <SelectTrigger className = "w-[180px]">
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

                                                                    <div className = "w-2" />

                                                                    <Button 
                                                                        type     = "submit" 
                                                                        disabled = {isRenewing || !hasSigner} 
                                                                        onClick  = {onClickRenew}>
                                                                        {isRenewing && CommonIcons.miniLoader}
                                                                        Renew
                                                                    </Button>
                                                                </div>

                                                                {renewalPriceData && (
                                                                    <p className = "text-xs mt-2">
                                                                        The cost is <span className = "font-bold">Ξ{(+ethers.utils.formatEther(renewalPriceWei)).toFixed(4)}</span> (${(renewalPriceUsd.toString()/1e18).toFixed(2)}).
                                                                    </p>
                                                                )}

                                                                <p className = "text-xs mt-2">
                                                                    This name is using the <span className = "font-bold">{currentRenewalControllerData?.label}</span> renewal controller (<a href = {"https://" + (chainId == 5 ? "goerli." : "") + "etherscan.io/address/" + renewalControllerToUse} target="_blank" rel="noreferrer" className = "underline">{renewalControllerToUse}</a>).
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <div className = "mt-1 text-xs text-red-800 dark:text-red-200">This subname cannot be renewed because it does not have a renewal controller set.</div>
                                                        )}
                                                    </>

                                                ) : (
                                                    <TransactionConfirmationState 
                                                        key      = {"renewal-" + name}
                                                        contract = {renewalControllerToUseInstance}
                                                        txArgs   = {{
                                                                args: [
                                                                    encodedNameToRenew,
                                                                    refererAddress, //referer
                                                                    renewForTimeInSeconds
                                                                ],
                                                                overrides: {
                                                                    gasLimit: ethers.BigNumber.from("5000000"),
                                                                    value:    renewalPriceWei
                                                                }
                                                        }}
                                                        txFunction = 'renew'
                                                        onConfirmed = {() => {
                                                            console.log("renewal confirmed");
                                                        }}
                                                        onAlways  = {() => {
                                                            console.log("2ld renewal onAlways");
                                                            setIsRenewing(false);
                                                            refetchData();
                                                        }}
                                                        checkStatic = {true}>
                                                        <div>
                                                            {CommonIcons.miniLoader} Renewing name..
                                                        </div>
                                                        <div>
                                                            SUCCESS
                                                        </div>
                                                    </ TransactionConfirmationState>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className = "font-medium">NameWrapper Owner</TableCell>
                                            <TableCell>
                                                {subnameWrapperAddress[chainId] == nameWrapperOwnerAddress ? (
                                                    <Tooltip delayDuration={0}>
                                                        <TooltipTrigger asChild>
                                                            <span>{nameWrapperOwnerAddress}</span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>This is the SubnameWrapper</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ) : (<span>{nameWrapperOwnerAddress}</span>)}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className = "font-medium">Registry Owner</TableCell>
                                            <TableCell>
                                                {nameWrapperAddress[chainId] == registryOwnerAddress ? (
                                                    <Tooltip delayDuration={0}>
                                                        <TooltipTrigger asChild>
                                                            <span>{registryOwnerAddress}</span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>This is the NameWrapper</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ) : (<span>{registryOwnerAddress}</span>)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table> 
                            </>         
                        </TabsContent>

                        <TabsContent value = "item-fuses" asChild>
                            <>
                                <h1 className = "my-4 text-lg">Fuses</h1>

                                <p className = "text-xs text-red-800 dark:text-red-200">This section details the fuses that have been burned on this name.
                                </p> 
                                <p className = "text-xs text-red-800 dark:text-red-200 mt-2">
                                    For more information on fuses please see the <a className = "underline" href = "https://support.ens.names/dev-basics/namewrapper/fuses" target = "_blank">ENS documentation</a>.
                                </p>
                            
                                <FuseList name = {name} />
                            </>
                        </TabsContent>
                    </Tabs>
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogAction>Close</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    )
}
