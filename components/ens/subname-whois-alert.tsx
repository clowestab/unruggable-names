import React                            from 'react'

import { ethers }                       from "ethers";
import { 
    useAccount,
    useNetwork, 
    useSigner,
    useChainId,
    useProvider 
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
import { Input }                        from "@/components/ui/input"
import { Label }                        from "@/components/ui/label"

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
    hexEncodeName,
    parseName,
    getUnruggableName 
}      
                                        from '../../helpers/Helpers.ts';

import {
    ZERO_ADDRESS,
    ETHEREUM_CHAIN_ID,
    OPTIMISM_CHAIN_ID
}                                       from '../../helpers/constants'

import { useToast }                     from '@/lib/hooks/use-toast'

import { 
    useEnsRegistryRead, 
    useL2NameWrapper,
    useL2NameWrapperRead, 
    useL2PublicResolver,
    useL2PublicResolverRead,
    l2PublicResolverAddress,
    useIRenewalController,
    useIRenewalControllerRead,
    l2SubnameRegistrarAddress,
    l2NameWrapperAddress,
    opVerifierAddress, 
    l1ResolverAddress,
    l1UnruggableResolverAddress
}                                       from '../../lib/blockchain'
import CommonIcons                      from '../shared/common-icons';
import { TransactionConfirmationState } from '../shared/transaction-confirmation-state'

const UNRUGGABLE_RESOLVER_ADDRESS = l1UnruggableResolverAddress[ETHEREUM_CHAIN_ID];

interface SubnameWhoisAlertProps {
    name: string,
    onClickClose?: any
}

// @ts-ignore
export function SubnameWhoisAlert({ name, onClickClose }: SubnameWhoisAlertProps): React.ReactElement | null {

    const { toast, dismiss }                = useToast()

    const { address }                       = useAccount()
    const { chain }                         = useNetwork()
    const  chainId                          = useChainId();

    const renewalControllerOptions          = getRenewalControllerOptions(OPTIMISM_CHAIN_ID);

    const { data: optimismProvider }        = useProvider({
        chainId: OPTIMISM_CHAIN_ID,
    })

    const { 
        data: optimismSigner, 
    }                                       = useSigner({
        chainId: OPTIMISM_CHAIN_ID
    })

    const hasOptimismSigner                 = typeof optimismSigner !== "undefined";


    const [resolvesTo, setResolvesTo]       = React.useState("");
    const [
        isSettingResolvesTo, 
        setIsSettingResolvesTo
    ]                                       = React.useState(false);

    //Boolean indicating if we are in the process of renewing the subname
    const [isRenewing, setIsRenewing]       = React.useState(false);

    const { 
        labelhash, 
        namehash, 
        isDotEth, 
        namehashAsInt, 
        parentName,
        isEth2ld,
        dnsEncodedName 
    }                                       = parseName(name);


    const { 
        namehash: parentNameNamehash, 
    }                                       = parseName(parentName);

    const { 
        namehash:                unruggableNamehash,
        namehashAsInt:           unruggableNamehashAsInt,
        dnsEncodedName:          unruggableDnsEncodedName 
    }                                       = getUnruggableName(name);

    //Get the resolver for the subname from L1
    const  { 
        data:    registryResolver, 
        refetch: refetchRegistryResolver 
    }                                       = useEnsRegistryRead({
        chainId:      ETHEREUM_CHAIN_ID,
        functionName: 'resolver',
        args:         [namehash],
    });

    //Check the parent name resolver in the registry.
    //For now we only go up 1 level
    const  { 
        data:    parentRegistryResolver, 
        refetch: refetchParentRegistryResolver 
    }                                       = useEnsRegistryRead({
        chainId:      ETHEREUM_CHAIN_ID,
        functionName: 'resolver',
        args:         [parentNameNamehash],
    });

    console.log("registryResolver", registryResolver);
    console.log("parentRegistryResolver", parentRegistryResolver);

    //L2 NameWrapper instance
    const l2NameWrapper                     = useL2NameWrapper({
        chainId:          OPTIMISM_CHAIN_ID,
        signerOrProvider: optimismSigner ?? optimismProvider
    });

    //L2 Public Resolver
    const l2PublicResolver                  = useL2PublicResolver({
        chainId:          OPTIMISM_CHAIN_ID,
        signerOrProvider: optimismSigner ?? optimismProvider
    });

    //L1 Unruggable Resolver instance
    /*const  { 
        data:    verifierData, 
        refetch: refetchVerifierData 
    }                                       = useUnruggableErc3668ResolverRead({
        chainId:      ETHEREUM_CHAIN_ID,
        functionName: 'getVerifierOfDomain',
        args:         [dnsEncodedName],
    });

    const [verifier, verifierSourceNode]    = verifierData || [null, null];

    console.log("verifierData subna", verifierData);
    console.log("verifierSourceNode", verifierSourceNode);*/

    //Holds the selected time in seconds for a renewal
    const [
        renewForTimeInSeconds, 
        setRenewForTimeInSeconds
    ]                                       = React.useState(ethers.BigNumber.from(renewalLengthOptions[0].value));

    const referrerAddress                   = "0xFC04D70bea992Da2C67995BbddC3500767394513";

    //Get ownership/fuses/expiry data for the subname from the L2 NameWrapper
    const  { 
        data:    nameData, 
        refetch: refetchData  
    }                                       = useL2NameWrapperRead({
        chainId:      OPTIMISM_CHAIN_ID,
        functionName: 'getData',
        args:         [unruggableNamehashAsInt],
    });

    const {owner: nameWrapperOwnerAddress, fuses: wrapperFuses} = nameData ?? {};

    //Get the address approved to control this name in the NameWrapper
    //Only 1 can be set at any given time
    const  { 
        data:    renewalControllerAddress, 
        refetch: refetchRenewalControllerAddress  
    }                                       = useL2NameWrapperRead({
        chainId:      OPTIMISM_CHAIN_ID,
        functionName: 'getApproved',
        args:         [unruggableNamehashAsInt],
     });

    //Get the renewal price for the name from the renewal controller
    const  { data: renewalPriceData }        = useIRenewalControllerRead({
        address:      renewalControllerAddress,
        chainId:      OPTIMISM_CHAIN_ID,
        functionName: 'rentPrice',
        args:         [unruggableDnsEncodedName, renewForTimeInSeconds]
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
        signerOrProvider: optimismSigner
    });

    console.log("renewalControllerToUseInstance", renewalControllerToUseInstance);

    //Checks if the registrar is the owner or an approved operator for the name
    const  { data: canRegistrarModifyName }  = useL2NameWrapperRead({
        chainId:      OPTIMISM_CHAIN_ID,
        functionName: 'canModifyName',
        args:         [unruggableNamehash, l2SubnameRegistrarAddress[OPTIMISM_CHAIN_ID]],
    });

    console.log("canRegistrarModifyName", canRegistrarModifyName);

    //Get the owner of the name in the registry.
    //Probably the NameWrapper
    const  { data: registryOwnerAddress }    = useEnsRegistryRead({
        chainId:      OPTIMISM_CHAIN_ID,
        functionName: 'owner',
        args:         [unruggableNamehash],
    });


    //For now the interface only supports our public resolver
    //If they are not using it.. we show a button to use it..
    const  { 
        data:    resolvesToAddress, 
        refetch: refetchResolvesToAddress 
    }                                     = useL2PublicResolverRead({
        chainId:      OPTIMISM_CHAIN_ID,
        functionName: 'addr(bytes32)',
        args:         [unruggableNamehash],
    });

    console.log("resolvesToAddress", resolvesToAddress);

    //An effect to set the value displayed in the input to the value resolved from the chain
    React.useEffect(() => {

        if (resolvesToAddress) {

            setResolvesTo(resolvesToAddress);
        }

    }, [resolvesToAddress])

    const isOwnedByUser                     = nameWrapperOwnerAddress == address;

    //@ts-ignore
    const expiryDate                        = new Date(parseInt(nameData?.expiry) * 1000);
    const expiryString                      = expiryDate.toLocaleString();

    const currentRenewalControllerData      = renewalControllerOptions.find((option) => option.value == renewalControllerAddress);

    //Handler for when the 'Renew' button is clicked
    const onClickRenew = () => {

        //Setting this will show the relevant TransactionConfirmationState component
        setIsRenewing(true);
    }


    const onClickSetResolvesTo = () => {

        //Setting this will show the relevant TransactionConfirmationState component
        setIsSettingResolvesTo(true);
    }

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{name}</AlertDialogTitle>
                <AlertDialogDescription asChild>

                    <Tabs defaultValue = "item-profile">
                        <TabsList className = "flex flex-wrap w-fit mx-auto">
                            <TabsTrigger value = "item-profile">Profile</TabsTrigger>
                            <TabsTrigger value = "item-configure">Configure</TabsTrigger>
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
                                                                        disabled = {isRenewing || !hasOptimismSigner} 
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
                                                                    This name is using the <span className = "font-bold">{currentRenewalControllerData?.label}</span> renewal controller (<a href = {"https://" + (OPTIMISM_CHAIN_ID == 420 ? "goerli-" : "") + "optimism.etherscan.io/address/" + renewalControllerAddress} target="_blank" rel="noreferrer" className = "underline">{renewalControllerAddress}</a>).
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <div className = "mt-1 text-xs text-red-800 dark:text-red-200">This subname cannot be renewed because it does not have a renewal controller set.</div>
                                                        )}
                                                    </>

                                                {isRenewing && (
                                                    <TransactionConfirmationState 
                                                        key      = {"renewal-" + name}
                                                        contract = {renewalControllerToUseInstance}
                                                        txArgs   = {{
                                                                args: [
                                                                    unruggableDnsEncodedName,
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

                                                            toast({
                                                                duration:    5000,
                                                                className:   "bg-green-200 dark:bg-green-800 border-0",
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
                                                        }}
                                                        checkStatic = {false}>
                                                        <div>
                                                            {/* Renewing interface handled manually*/}
                                                        </div>
                                                        <div>
                                                            {/* Success interface handled manually*/}
                                                        </div>
                                                    </ TransactionConfirmationState>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className = "font-medium">NameWrapper Owner</TableCell>
                                            <TableCell>
                                                {l2NameWrapperAddress[OPTIMISM_CHAIN_ID] == nameWrapperOwnerAddress ? (
                                                    <Tooltip delayDuration = {0}>
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

                        <TabsContent value = "item-configure" asChild>
                            <>
                                <h1 className = "my-4 text-lg">Configure</h1>

                                {(registryResolver == UNRUGGABLE_RESOLVER_ADDRESS || parentRegistryResolver == UNRUGGABLE_RESOLVER_ADDRESS) && (

                                    <>
                                        {registryResolver == ZERO_ADDRESS && (
                                            <p className = "text-xs text-red-800 dark:text-red-200 mt-8 mb-4">This subname is being resolved by its parent subject to <a className = "underline" href = "https://docs.ens.domains/ens-improvement-proposals/ensip-10-wildcard-resolution" target="_blank">ENSIP10</a>.
                                            </p> 
                                        )}

                                        <Table>
                                            <TableBody>

                                                    <>
                                                        <TableRow>
                                                            <TableCell className="font-medium">
                                                                Resolver
                                                            </TableCell>
                                                            <TableCell>
                                                                <p>
                                                                    <a href = {"https://" + (OPTIMISM_CHAIN_ID == 420 ? "goerli-" : "") + "optimism.etherscan.io/address/" + l2PublicResolverAddress[OPTIMISM_CHAIN_ID]} target="_blank" rel="noreferrer" className = "underline">{l2PublicResolverAddress[OPTIMISM_CHAIN_ID]}</a>
                                                                </p>
                                                                <p className = "text-xs text-red-800 dark:text-red-200 mt-2">
                                                                    This is the Layer 2 (Optimism) public resolver.
                                                                </p>
                                                            </TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell className="font-medium">
                                                                Verifier
                                                            </TableCell>
                                                            <TableCell>
                                                                <>
                                                                    <a href = {"https://" + (ETHEREUM_CHAIN_ID == 5 ? "goerli." : "") + "etherscan.io/address/" + opVerifierAddress[ETHEREUM_CHAIN_ID]} target="_blank" rel="noreferrer" className = "underline">{opVerifierAddress[ETHEREUM_CHAIN_ID]}</a>
                                                                </>
                                                            </TableCell>
                                                        </TableRow>
                                                        {/*verifierData[0].gatewayUrls && (
                                                            <>
                                                                <TableRow>
                                                                    <TableCell className="font-medium">
                                                                        Gateway URL(s)
                                                                    </TableCell>
                                                                    <TableCell>

                                                                        <ul>
                                                                            {verifierData[0].gatewayUrls.map((gatewayUrl, index) => {

                                                                                return (<li key = {"gateway-" + index}>{gatewayUrl}</li>);
                                                                            })}
                                                                        </ul>
                                                                    </TableCell>
                                                                </TableRow>
                                                            </>
                                                                        )*/}
                                                    </>
                                                

                                            </TableBody>
                                        </Table>  

                                        <p className = "text-xs text-red-800 dark:text-red-200 mt-8 mb-4">Configure where this name resolves to.
                                        </p> 

                                        <Label htmlFor = "resolvesTo">
                                            Resolves to
                                        </Label>

                                        <Input 
                                            type     = "text" 
                                            className = "mt-2"
                                            value    = {resolvesTo} 
                                            onChange = {(e) => setResolvesTo(e.target.value)} 
                                            />

                                        <Button 
                                            type     = "submit" 
                                            disabled = {isSettingResolvesTo || !hasOptimismSigner} 
                                            onClick  = {onClickSetResolvesTo}
                                            className = "mt-2">
                                            {isSettingResolvesTo && CommonIcons.miniLoader}
                                            Configure
                                        </Button>

                                        {isSettingResolvesTo && (
                                            <TransactionConfirmationState 
                                                key      = {"set-resolves-to-" + name}
                                                chainId  = {OPTIMISM_CHAIN_ID}
                                                contract = {l2PublicResolver}
                                                txArgs   = {{
                                                        args: [
                                                            unruggableNamehash,
                                                            resolvesTo
                                                        ],
                                                        overrides: {
                                                            gasLimit: ethers.BigNumber.from("5000000"),
                                                        }
                                                }}
                                                txFunction  = 'setAddr(bytes32,address)'
                                                onConfirmed = {() => {
                                                    console.log("resolves to set");

                                                    toast({
                                                        duration:    5000,
                                                        className:   "bg-green-200 dark:bg-green-800 border-0",
                                                        description: (<p>You have set the address that <span className = "font-bold">{name}</span> resolves to.</p>),
                                                    });
                                                }}
                                                onAlways  = {() => {
                                                    console.log("set resolves to address onAlways");
                                                    setIsSettingResolvesTo(false);
                                                }}
                                                onError = {() => {

                                                    toast({
                                                        duration:    5000,
                                                        className:   "bg-red-200 dark:bg-red-800 border-0",
                                                        description: (<p>There was a problem setting the address that <span className = "font-bold">{name}</span> resolves to.</p>),
                                                    });
                                                }}
                                                checkStatic = {false}>
                                                <div>
                                                    {/*interface handled manually*/}
                                                </div>
                                                <div>
                                                    {/* Success interface handled manually*/}
                                                </div>
                                            </ TransactionConfirmationState>
                                        )}
                                    </>
                                )}
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