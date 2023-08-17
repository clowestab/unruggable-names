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
    ETHEREUM_CHAIN_ID,
    OPTIMISM_CHAIN_ID
}                                       from '../../helpers/constants'

import { 
    useEnsRegistryRead, 
    useL2NameWrapperRead, 
    useIRenewalController,
    useIRenewalControllerRead,
    l2SubnameRegistrarAddress,
    l2NameWrapperAddress 
}                                       from '../../lib/blockchain'
import CommonIcons                      from '../shared/common-icons';
import { TransactionConfirmationState } from '../shared/transaction-confirmation-state'

interface SubnameWhoisAlertProps {
    name: string,
    onClickClose?: any
}


// @ts-ignore
export function SubnameWhoisAlert({ name, onClickClose }: SubnameWhoisAlertProps): React.ReactElement | null {

    const { address }                       = useAccount()
    const { chain }                         = useNetwork()
    const  chainId                          = useChainId();

    const renewalControllerOptions          = getRenewalControllerOptions(OPTIMISM_CHAIN_ID);

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
    const referrerAddress                   = "0xFC04D70bea992Da2C67995BbddC3500767394513";

    const  { 
        data:    nameData, 
        refetch: refetchData  
    }                                       = useL2NameWrapperRead({
        chainId:      OPTIMISM_CHAIN_ID,
        functionName: 'getData',
        args:         [tokenId],
    });

    const  { 
        data:    renewalControllerAddress, 
        refetch: refetchRenewalControllerAddress  
    }                                       = useL2NameWrapperRead({
        chainId:      OPTIMISM_CHAIN_ID,
        functionName: 'getApproved',
        args:         [tokenId],
     });

    const  { data: renewalPriceData }        = useIRenewalControllerRead({
        address:      renewalControllerAddress,
        chainId:      OPTIMISM_CHAIN_ID,
        functionName: 'rentPrice',
        args:         [encodedNameToRenew, renewForTimeInSeconds]
    });

    console.log("renewalControllerAddress", renewalControllerAddress);

    const { 
        weiPrice: renewalPriceWei, 
        usdPrice: renewalPriceUsd 
    }                                        = renewalPriceData ?? {weiPrice: 0, usdPrice: 0};

    console.log("renewalPriceUsd", renewalPriceUsd);

    const renewalControllerToUseInstance     = useIRenewalController({
        address:          renewalControllerAddress,
        chainId:          OPTIMISM_CHAIN_ID,
        signerOrProvider: signer
    });

    const  { data: canRegistrarModifyName }  = useL2NameWrapperRead({
        chainId:      OPTIMISM_CHAIN_ID,
        functionName: 'canModifyName',
        args:         [namehash, l2SubnameRegistrarAddress[OPTIMISM_CHAIN_ID]],
    });

    console.log("canRegistrarModifyName", canRegistrarModifyName);

    const  { 
        data: nameWrapperOwnerAddress 
    }                                        = useL2NameWrapperRead({
        chainId:      OPTIMISM_CHAIN_ID,
        functionName: 'ownerOf',
        args:         [tokenId],
    });

    const  { data: registryOwnerAddress }    = useEnsRegistryRead({
        chainId:      OPTIMISM_CHAIN_ID,
        functionName: 'owner',
        args:         [namehash],
    });

    const isOwnedByUser                     = nameData?.owner == address;

    //@ts-ignore
    const expiryDate                        = new Date(parseInt(nameData?.expiry) * 1000);
    const expiryString                      = expiryDate.toLocaleString();

    const currentRenewalControllerData      = renewalControllerOptions.find((option) => option.value == renewalControllerAddress);

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
                                            <TableCell className = "font-medium">Expiry</TableCell>
                                            <TableCell>
                                                
                                                <p>{expiryString}</p>
                                                <div className = "mt-1 text-xs text-blue-800 dark:text-blue-200">
                                                    {formatExpiry(nameData?.expiry)}
                                                </div>

                                                {!isRenewing ? (  

                                                    <>
                                                         {renewalControllerAddress != null ? (
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
                                                                    This name is using the <span className = "font-bold">{currentRenewalControllerData?.label}</span> renewal controller (<a href = {"https://goerli-optimism.etherscan.io/address/" + renewalControllerAddress} target="_blank" rel="noreferrer" className = "underline">{renewalControllerAddress}</a>).
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
                                                                    referrerAddress, //referrer
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
                                                {l2NameWrapperAddress[OPTIMISM_CHAIN_ID] == nameWrapperOwnerAddress ? (
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
                                                {l2NameWrapperAddress[OPTIMISM_CHAIN_ID] == registryOwnerAddress ? (
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
                <AlertDialogAction onClick = {onClickClose}>Close</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    )
}
