import React                            from 'react'

import { ethers }                       from "ethers";
import { 
    useAccount, 
    useProvider, 
    useSigner, 
    useWaitForTransaction 
}                                       from 'wagmi'
import { foundry }                      from 'wagmi/chains'

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

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
}                                         from "@/components/ui/accordion"

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
}                                         from "@/components/ui/table"

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
    ensRegistryAddress,
    ethRegistrarControllerAddress,
    nameWrapperAddress,
    renewalControllerAddress,
    subnameRegistrarAddress,
    subnameWrapperAddress
}                                       from '../../helpers/contract-addresses';

import {
    renewalLengthOptions,
    renewalControllerOptions
}                                         from '../../helpers/select-options';

import { FuseList }                           from '@/components/ens/fuse-list';

import { 
    formatExpiry, 
    hexEncodeName 
}                               from '../../helpers/Helpers.jsx';
import { 
    useEnsRegistryRead, 
    useNameWrapperRead, 
    useRenewalController, 
    useSubnameRegistrar, 
    useSubnameRegistrarRead, 
    useSubnameRegistrarRenew, 
    useSubnameWrapperRead 
}                                       from '../../lib/blockchain'
import CommonIcons                      from '../shared/common-icons';
import { TransactionConfirmationState } from '../shared/transaction-confirmation-state'




interface SubdomainWhoisAlertProps {
    name:        string,
}

// @ts-ignore
export function SubdomainWhoisAlert({ name }: SubdomainWhoisAlertProps): React.ReactElement | null {

    const { address }       = useAccount()

    const { 
        data: signer, 
    }             = useSigner()

    console.log("SIGNER", signer);

    const subnameRegistrar = useSubnameRegistrar({
        address:          subnameRegistrarAddress,
        signerOrProvider: signer
    });

    const renewalController = useRenewalController({
        address:          renewalControllerAddress,
        signerOrProvider: signer
    });

    const [isRenewing, setIsRenewing]       = React.useState(false);

    const namehash: `0x${string}`           = ethers.utils.namehash(name) as `0x${string}`;
    const tokenId                           = ethers.BigNumber.from(namehash);
    const encodedNameToRenew: `0x${string}` = hexEncodeName(name) as `0x${string}`;
    const [renewForTimeInSeconds, setRenewForTimeInSeconds]           = React.useState(ethers.BigNumber.from("31536000"));
    const refererAddress                    = "0x0000000000000000000000000000000000005627";

    const  { data: ownerAddress }  = useSubnameWrapperRead({
        address:       subnameWrapperAddress,
        functionName:  'ownerOf',
        args:          [tokenId],
    });

    const  { data: rentPrice }  = useSubnameRegistrarRead({
        address:       subnameRegistrarAddress,
        functionName:  'rentPrice',
        args:          [encodedNameToRenew, renewForTimeInSeconds],
    });

    console.log("renewal price for " + name, rentPrice);

    const  { data: nameData, refetch: refetchData  }  = useSubnameWrapperRead({
        address:       subnameWrapperAddress,
        functionName:  'getData',
        args:          [tokenId],
    });

    const  { data: canRegistrarModifyName }  = useSubnameWrapperRead({
        address:       subnameWrapperAddress,
        functionName:  'canModifyName',
        args:          [namehash, subnameRegistrarAddress],
    });

    console.log("canRegistrarModifyName", canRegistrarModifyName);


    console.log("name data", nameData);

    const  { data: nameWrapperOwnerAddress }  = useNameWrapperRead({
        address:       nameWrapperAddress,
        functionName:  'ownerOf',
        args:          [tokenId],
    });

    const  { data: registryOwnerAddress }  = useEnsRegistryRead({
        address:       ensRegistryAddress,
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
                                            <TableCell className="font-medium">SubnameWrapper Owner</TableCell>
                                            <TableCell>
                                                {ownerAddress}
                                                <div className = "mt-1 text-xs text-red-800">This is me</div>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">Expiry</TableCell>
                                            <TableCell>
                                                
                                                <p>{expiryString}</p>
                                                <div className = "mt-1 text-xs text-blue-800">{formatExpiry(nameData?.expiry)}</div>

                                                {!isRenewing ? (  

                                                    <>
                                                         {renewalControllerToUse != null ? (
                                                            <>
                                                                <div className = "flex mt-2">

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

                                                                <p className = "text-xs mt-2">
                                                                    This domain is using the <span className = "font-bold">{(renewalControllerOptions.find((option) => option.value == renewalControllerToUse)).label}</span> renewal controller (<a href = {"https://etherscan.io/address/" + renewalControllerToUse} target="_blank" rel="noreferrer" className = "underline">{renewalControllerToUse}</a>).
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <div className = "mt-1 text-xs text-red-800">This subdomain cannot be renewed because it does not have a renewal controller set.</div>
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
                                                                {CommonIcons.miniLoader} Renewing domain..
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
                                                <div className = "mt-1 text-xs text-red-800">This is the SubnameWrapper</div>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">Registry Owner</TableCell>
                                            <TableCell>
                                                {registryOwnerAddress}
                                                <div className = "mt-1 text-xs text-red-800">This is the NameWrapper</div>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>          
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
