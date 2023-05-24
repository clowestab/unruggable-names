const ethPrice = 1800;

import React                            from 'react'

import { ethers }                       from "ethers";
import { 
    useAccount,
    useNetwork, 
    useSigner, 
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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
}                                       from "@/components/ui/accordion"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
}                                       from "@/components/ui/table"

import { Button }                       from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
    useEnsRegistryRead, 
    useNameWrapperRead, 
    useRenewalController, 
    useSubnameRegistrar, 
    useSubnameRegistrarRead, 
    useSubnameWrapperRead,
    useRenewalControllerRead,
    subnameRegistrarAddress 
}                                       from '../../lib/blockchain'
import CommonIcons                      from '../shared/common-icons';
import { TransactionConfirmationState } from '../shared/transaction-confirmation-state'

interface SubnameWhoisAlertProps {
    name:        string,
}

// @ts-ignore
export function SubnameWhoisAlert({ name }: SubnameWhoisAlertProps): React.ReactElement | null {

    const { address }                       = useAccount()
    const { chain }                         = useNetwork()

    const renewalControllerOptions          = getRenewalControllerOptions(chain.id);


    const { 
        data: signer, 
    }                                       = useSigner()

    //Basic RenewalController Instance
    const renewalController                 = useRenewalController({
        signerOrProvider: signer
    });

    //Boolean indicating if we are in the process of renewing the subname
    const [isRenewing, setIsRenewing]       = React.useState(false);

    const namehash: `0x${string}`           = ethers.utils.namehash(name) as `0x${string}`;
    const tokenId                           = ethers.BigNumber.from(namehash);
    const encodedNameToRenew: `0x${string}` = hexEncodeName(name) as `0x${string}`;
    //Holds the selected time in seconds for a renewal
    const [
        renewForTimeInSeconds, 
        setRenewForTimeInSeconds
    ]                                     = React.useState(ethers.BigNumber.from(renewalLengthOptions[0].value));
    const refererAddress                    = "0x0000000000000000000000000000000000005627";

    //Owner of the subdoomain in the SubnameWrapper
    const  { data: ownerAddress }           = useSubnameWrapperRead({
        functionName:  'ownerOf',
        args:          [tokenId],
    });

    //The renewal price as pulled from the basic renewal controller
    //In reality this should be pulled from the specific renewal controller set for the subname
    const  { data: renewalPrice }           = useRenewalControllerRead({
        functionName:  'rentPrice',
        args:          [encodedNameToRenew, renewForTimeInSeconds],
    });

    console.log("renewal price for " + name, renewalPrice);


    const  { 
        data: nameData, 
        refetch: refetchData  
    }                                       = useSubnameWrapperRead({
        functionName:  'getData',
        args:          [tokenId],
    });

    const  { data: canRegistrarModifyName } = useSubnameWrapperRead({
        functionName:  'canModifyName',
        args:          [namehash, subnameRegistrarAddress],
    });

    console.log("canRegistrarModifyName", canRegistrarModifyName);


    console.log("name data", nameData);

    const  { 
        data: nameWrapperOwnerAddress 
    }                                       = useNameWrapperRead({
        functionName:  'ownerOf',
        args:          [tokenId],
    });

    const  { data: registryOwnerAddress }   = useEnsRegistryRead({
        functionName:  'owner',
        args:          [namehash],
    });

    console.log("owner address " + name, ownerAddress);

    const onClickRenew = () => {

        console.log("renew");
        setIsRenewing(true);
    }

    const isOwnedByUser = nameData?.owner == address;

    //const canRenewThroughSubnameRegistrar = nameData && nameData.renewalController == "0x0000000000000000000000000000000000000000" && isOwnedByUser && canRegistrarModifyName;

    var renewalControllerToUse = null;

    //if (canRenewThroughSubnameRegistrar) { renewalControllerToUse = subnameRegistrar; } 
    if (nameData && nameData.renewalController != "0x0000000000000000000000000000000000000000") { renewalControllerToUse = nameData.renewalController; } 

    console.log("renewalControllerToUse", renewalControllerToUse);

    //@ts-ignore
    const expiryDate    = new Date(parseInt(nameData?.expiry) * 1000);
    const expiryString  = expiryDate.toLocaleString();

    const currentRenewalControllerData = renewalControllerOptions.find((option) => option.value == renewalControllerToUse);

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{name}</AlertDialogTitle>
                <AlertDialogDescription asChild>


                    <Tabs defaultValue="item-profile">
                        <TabsList className="flex w-fit mx-auto">
                            <TabsTrigger value="item-profile">Profile</TabsTrigger>
                            <TabsTrigger value="item-fuses">Fuses</TabsTrigger>
                        </TabsList>

                        <TabsContent value="item-profile" asChild>

                            <>
                                <h1 className = "my-4 text-lg">Profile</h1>

                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="font-medium">SubnameWrapper Owner</TableCell>
                                            <TableCell>
                                                {ownerAddress}
                                                <div className = "mt-1 text-xs text-red-800 dark:text-red-200">This is me</div>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">Expiry</TableCell>
                                            <TableCell>
                                                
                                                <p>{expiryString}</p>
                                                <div className = "mt-1 text-xs text-blue-800 dark:text-blue-200">{formatExpiry(nameData?.expiry)}</div>

                                                {!isRenewing ? (  

                                                    <>
                                                         {renewalControllerToUse != null ? (
                                                            <>
                                                                <div className = "flex mt-8">

                                                                    <Select onValueChange = {(value) => setRenewForTimeInSeconds(ethers.BigNumber.from(value))}>
                                                                        <SelectTrigger className="w-[180px]">
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
                                                                        The cost is <span className = "font-bold">Ξ{ethers.utils.formatEther(renewalPrice)}</span> (~${Math.round((ethers.utils.formatEther(renewalPrice) * ethPrice).toFixed(2))}).
                                                                    </p>
                                                                )}

                                                                <p className = "text-xs mt-2">
                                                                    This name is using the <span className = "font-bold">{currentRenewalControllerData?.label}</span> renewal controller (<a href = {"https://etherscan.io/address/" + renewalControllerToUse} target="_blank" rel="noreferrer" className = "underline">{renewalControllerToUse}</a>).
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <div className = "mt-1 text-xs text-red-800 dark:text-red-200">This subname cannot be renewed because it does not have a renewal controller set.</div>
                                                        )}
                                                    </>

                                                ) : (
                                                    <TransactionConfirmationState 
                                                        key      = {"renewal-" + name}
                                                        contract = {renewalController}
                                                        txArgs   = {{
                                                                args: [
                                                                    encodedNameToRenew,
                                                                    refererAddress, //referer
                                                                    renewForTimeInSeconds
                                                                ],
                                                                overrides: {
                                                                    gasLimit: ethers.BigNumber.from("5000000"),
                                                                    value:    "10000000000000000000"
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
                                                        }}>
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
                                            <TableCell className="font-medium">NameWrapper Owner</TableCell>
                                            <TableCell>
                                                {nameWrapperOwnerAddress}
                                                <div className = "mt-1 text-xs text-red-800 dark:text-red-200">This is the SubnameWrapper</div>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">Registry Owner</TableCell>
                                            <TableCell>
                                                {registryOwnerAddress}
                                                <div className = "mt-1 text-xs text-red-800 dark:text-red-200">This is the NameWrapper</div>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table> 
                            </>         
                        </TabsContent>

                        <TabsContent value="item-fuses" asChild>
                            <>
                                <h1 className = "my-4 text-lg">Fuses</h1>

                                <p className = "text-xs text-red-800">This section details the fuses that have been burned on this name.
                                </p> 
                                <p className = "text-xs text-red-800 mt-2">
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
