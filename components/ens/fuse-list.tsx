import React                            from 'react'
import { ethers }                       from "ethers";

import { 
    useSigner, 
    useNetwork,
    useChainId 
}                                       from 'wagmi'

import { Icon }                         from '@iconify/react';

import { Button }                       from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
}                                       from "@/components/ui/tooltip"

import { 
    useNameWrapper,
    useSubnameWrapper,
    useNameWrapperRead,
    nameWrapperAddress
}                                       from '../../lib/blockchain'

import CommonIcons                      from '../shared/common-icons';

import {
    ZERO_ADDRESS,
    FUSES,
    PARENT_CONTROLLED_FUSES,
    USER_SETTABLE_FUSES,
    DAY,
    GRACE_PERIOD
}                                           from '../../helpers/constants'

import { useToast }                     from '@/lib/hooks/use-toast'

interface FuseListProps {
    name:        string,
}

export function FuseList({ name }: FuseListProps) {

    const nameParts                         = name.split(".");
    const label: string                     = nameParts.shift()!;
    const labelhash: `0x${string}`          = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(label)) as `0x${string}`;
    const namehash                          = ethers.utils.namehash(name)

    const nameNodeString                    = nameParts.join(".");
    const isDotEth                          = nameNodeString == "eth";
    const is2ld                             = isDotEth && nameParts.length == 1;
    const nameNodeNamehash: `0x${string}`   = ethers.utils.namehash(nameNodeString)  as `0x${string}`;
    
    const tokenId                           = ethers.BigNumber.from(namehash);
    const nameNodeTokenId                   = ethers.BigNumber.from(nameNodeNamehash);


    const { toast }                         = useToast()

    const { 
        data: signer, 
    }                                       = useSigner()

    const { 
        chain, 
    }                                       = useNetwork()

    const  chainId                          = useChainId();

    //NameWrapper instance
    const nameWrapper                       = useNameWrapper({
        signerOrProvider: signer
    });

    //SubnameWrapper instance
    const subnameWrapper                    = useSubnameWrapper({
        chainId: chainId,
        signerOrProvider: signer
    });


    //Gets owner/expiry/fuses from the namewrapper
    const  { 
        data: nameData, 
        refetch: refetchData 
    }                                       = useNameWrapperRead({
        chainId: chainId,
         functionName: 'getData',
         args:         [tokenId],
     });
    const {owner: nameWrapperOwnerAddress, fuses: wrapperFuses, expiry: wrapperExpiry} = nameData ?? {};
    const isAvailable = String(nameWrapperAddress[chainId]) == ZERO_ADDRESS;

    //Gets owner/expiry/fuses from the namewrapper
    const  { 
        data: parentNameData, 
        refetch: refetchParentData 
    }                                       = useNameWrapperRead({
        chainId: chainId,
         functionName: 'getData',
         args:         [nameNodeTokenId],
    });

    const {owner: nameWrapperParentOwnerAddress, fuses: parentWrapperFuses} = parentNameData ?? {};

    const  { 
        data: isWrapped, 
        refetch: refetchIsWrapped 
    }                                       = useNameWrapperRead({
        chainId: chainId,
         functionName: 'isWrapped',
         args:         [nameNodeNamehash, labelhash],
    });

    const [
        fuseBeingBurned, 
        setFuseBeingBurned
    ]                                       = React.useState<string | null>(null);

    const addError = (error: any) => {

        toast({
            duration:    5000,
            className:   "bg-red-200 dark:bg-red-800 border-0",
            description: (
                <>
                    <div className = "text-center mb-4">
                        <Icon 
                            className = "inline-block"
                            icon      = "akar-icons:triangle-alert"
                            width     = "48"
                            height    = "48" />
                    </div> 
                    {error}
                </>
            ),
            variant: "destructive",
        })
    }


    const parseError = (error: any) => {

        console.log("Error Name: ", error.errorName);

        var errorString     = "Something went wrong..";

        if (error.errorName != null) {

            errorString = error.errorSignature;

            if (error.errorArgs.length > 0) {
                errorString += " - " + error.errorArgs.toString();
            }

        } else if (error.reason != null) {

            errorString = error.reason;
        }

        console.log("Error String: ", errorString);
        addError(errorString);
    }

    /**
     * Burns a fuse on a .eth or a subname
     */ 
    const burnFuse = async (fuseKey: string) => {

        setFuseBeingBurned(fuseKey);

        //Can't burn a fuse on an unregistered name
        if (isAvailable) { 

            addError("The name is not registered. Fuses can not be burned on unregistered names.");
            setFuseBeingBurned(null);
            return;
        }

        //Can't burn a fuse on an unwrapped name
        if (!isWrapped) { 

            addError("The name is not wrapped. Fuses can not be burned on an unwrapped name.");
            setFuseBeingBurned(null);
            return;
        }

        //Fuses that can be burned by the owner of the parent name
        const isParentControlled = (PARENT_CONTROLLED_FUSES & FUSES[fuseKey as keyof typeof FUSES]) == FUSES[fuseKey as keyof typeof FUSES];

        //When using a mnemonic the signer property is an instance of Wallet which has an address property
        //When using Metamask/WalletConnect the signer property is an instance of JsonRpcSigner which has an _address property
        //@ts-ignore
        const signerAddress = nameWrapper?.signer.address ?? nameWrapper?.signer._address;

        //Only the parent can burn parent controlled fuses
        if (isParentControlled) {

            console.log("Burning parent controlled fuse");

            //If we are not signing as the parent, throw an error
            if (nameWrapperParentOwnerAddress != signerAddress) {

                addError("You are not the owner of the parent name. This is a parent controlled fuse."); 
                setFuseBeingBurned(null);
                return;
            }

            //console.log("wth", ((parentWrapperFuses & FUSES.CANNOT_UNWRAP) == FUSES.CANNOT_UNWRAP));

            //PARENT_CANNOT_CONTROL can not be burned unless CANNOT_UNWRAP burned on the parent
            //Correction - no parent controlled fuse can be burned unless CANNOT_UNWRAP
            //See _checkParentFuses
            if (!((parentWrapperFuses! & FUSES.CANNOT_UNWRAP) == FUSES.CANNOT_UNWRAP)) {

                addError("The parent name is not locked. CANNOT_UNWRAP must be burned on the parent first."); 
                setFuseBeingBurned(null);
                return;
            }

            //Check that the PARENT_CANNOT_CONTROL has not been burned
            if ((wrapperFuses! & FUSES.PARENT_CANNOT_CONTROL) == FUSES.PARENT_CANNOT_CONTROL) {

                addError("This name is emancipated. The parent owner has burned the PARENT_CANNOT_CONTROL fuse."); 
                setFuseBeingBurned(null);
                return;
            }

            console.log("Burning child fuse on subname", fuseKey);
            console.log("nameNodeNamehash", nameNodeNamehash);
            console.log("labelhash", labelhash);

            await nameWrapper
                .callStatic
                .setChildFuses(
                    nameNodeNamehash, 
                    labelhash, 
                    FUSES[fuseKey], 
                    0, 
                    {gasLimit: 500000}
                )
                .then(() => {

                    return nameWrapper  
                        .setChildFuses(
                            nameNodeNamehash, 
                            labelhash, 
                            FUSES[fuseKey], 
                            0, 
                            {gasLimit: 500000}
                        );
                })
                .then((childFuseResponse) => {
                    return childFuseResponse.wait();
                })
                .then((childFuseReceipt) => {
                    return refetchData();
                })
                .catch((error) => {
                    console.log("ERROR child fuse response - " + error.reason, error);
                    console.log("Werror", error.error);

                    parseError(error);
                    return;
                })
                .then(() => {

                });

        //The owner or parent (of not emancipated names) can burn the other kinds of fuses
        } else {
            
            console.log("Burning owner controlled fuse", signerAddress);
            console.log("Burning owner controlled fuse", nameWrapperOwnerAddress);

            if (signerAddress != nameWrapperOwnerAddress && signerAddress != nameWrapperParentOwnerAddress) { 

                const isApproved = await nameWrapper.isApprovedForAll(nameWrapperOwnerAddress, signerAddress);

                if (!isApproved) {
                    addError("You are not the owner of the name (or its parent), nor are you an approved controller."); 
                    setFuseBeingBurned(null);
                    return;
                }
            }

            const currentTimestamp = Math.floor(Date.now() / 1000);
            const calculatedExpiry = wrapperExpiry - (isDotEth ? GRACE_PERIOD : 0);

            if (calculatedExpiry < currentTimestamp) {
                addError("The name you entered has expired (" + formatExpiry(calculatedExpiry) + " ago).");
                setFuseBeingBurned(null);
                return;
            }

            if ((wrapperFuses & FUSES.CANNOT_BURN_FUSES) == FUSES.CANNOT_BURN_FUSES) {

                addError((<p>The <span className = "font-bold">CANNOT_BURN_FUSES</span> fuse has been burned.</p>));
                setFuseBeingBurned(null);
                return;
            }

            const lockedFuses = (FUSES.PARENT_CANNOT_CONTROL | FUSES.CANNOT_UNWRAP);

            if ((fuseKey != 'CANNOT_UNWRAP') && !((wrapperFuses & lockedFuses) == lockedFuses)) {

                addError("The name is not locked (PARENT_CANNOT_CONTROL and CANNOT_UNWRAP have not both been burned).");
                setFuseBeingBurned(null);
                return;
            }

            console.log("Burning fuse on second level .eth", fuseKey);

            const contractToUse = is2ld ? nameWrapper : subnameWrapper;


            console.log("is2ld", is2ld);
            console.log("isDotEth", isDotEth);
            console.log("nameParts", nameParts.length);
            console.log("contractToUse", contractToUse);

            console.log("subnameWrapper",subnameWrapper);
            await contractToUse
                .callStatic
                .setFuses(namehash, FUSES[fuseKey], {gasLimit: 500000})
                .then(() => {

                    return contractToUse  
                        .setFuses(namehash, FUSES[fuseKey], {gasLimit: 500000})
                })
                .then((fuseResponse) => {
                    return fuseResponse.wait();
                })
                .then((fuseReceipt) => {

                    toast({
                        duration: 5000,
                        className: "bg-green-200 dark:bg-green-800 border-0",
                        description: (<p><span className = "font-bold">{fuseKey}</span> successfully burned.</p>),
                    })

                    return refetchData();
                })
                .catch(async (error) => {

                    console.log("ERROR fuse response - " + error.reason, error);
                    parseError(error);
                    return;
                })
                .then(() => {

                });

        }

        setFuseBeingBurned(null);
    }



    return (
        <div>
            {wrapperFuses != null && (
                <table className = "mt-8 items-center bg-transparent w-full border-collapse ">
                    <thead>
                        <tr>
                            <th className = "px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                                Fuse
                            </th>
                            <th className = "px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                                Type
                            </th>
                            <th className = "px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                                Burned?
                            </th>
                            <th className = "px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {Object.keys(FUSES).map((fuseKey) => {

                            //console.log(fuse.key, (PARENT_CONTROLLED_FUSES & fuse.value));
                            //console.log(fuse.key, fuse.value);
                            //console.log(fuse.key, (PARENT_CONTROLLED_FUSES & fuse.value) == fuse.value);

                            const isParentControlled = (PARENT_CONTROLLED_FUSES & FUSES[fuseKey]) == FUSES[fuseKey];

                            const isBurned = (wrapperFuses & FUSES[fuseKey]) == FUSES[fuseKey]; 

                            return (
                                <tr key = {fuseKey}>
                                    <th className = "border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-left text-blueGray-700 ">
                                            {fuseKey}
                                    </th>

                                  

                                    <td className = "border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 ">

                                        <Tooltip delayDuration = {0}>
                                            <TooltipTrigger asChild>
                                                <Icon 
                                                    className   = "inline-block"
                                                    icon        = {isParentControlled ? "raphael:parent" : "mdi:user"}  
                                                    width       = "24" 
                                                    height      = "24" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{isParentControlled ? "PARENT" : "OWNER"} controlled</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </td>

                                    <td className = "border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 ">
                                            {isBurned ? CommonIcons.check : CommonIcons.cross}
                                    </td>
                                    <td className = "border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 ">
                                        {!isBurned && (
                                            <Button 
                                                type      = "submit" 
                                                disabled  = {typeof signer === "undefined" || fuseBeingBurned == fuseKey} 
                                                onClick   = {(e) => burnFuse(fuseKey)}>
                                                {fuseBeingBurned == fuseKey ? CommonIcons.miniLoader : "Burn Fuse"}
                                            </Button>
                                        )}
                                    </td>

                                </tr> 
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    )
}