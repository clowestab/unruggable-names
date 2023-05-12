//Useful constants
const REQUIRED_CHAIN_ID         = 5;
const ETH_NODE                  = ethers.utils.namehash('eth');
const ZERO_ADDRESS              = '0x0000000000000000000000000000000000000000'
const DUMMY_ADDRESS             = '0x0000000000000000000000000000000000000001'
const DAY                       = 86400
const GRACE_PERIOD              = 90 * DAY
const ONE_YEAR_IN_SECONDS       = 360 * 24 * 60 * 60;

//Fuses
const FUSES = {
  CAN_DO_EVERYTHING:       0,
  CANNOT_UNWRAP:          1,
  CANNOT_BURN_FUSES:       2,
  CANNOT_TRANSFER:         4,
  CANNOT_SET_RESOLVER:     8,
  CANNOT_SET_TTL:          16,
  CANNOT_CREATE_SUBDOMAIN: 32,
  CANNOT_APPROVE:          64,
  PARENT_CANNOT_CONTROL:   2 ** 16,
  IS_DOT_ETH:              2 ** 17,
  CAN_EXTEND_EXPIRY:       2 ** 18,
}

const PARENT_CONTROLLED_FUSES   = 0xFFFF0000;
// all fuses apart from IS_DOT_ETH
const USER_SETTABLE_FUSES           = 0xFFFDFFFF;

import React                            from 'react'
import { ethers }                         from "ethers";

import { 
    useAccount,
    useProvider, 
    useSigner, 
    useWaitForTransaction 
}                                       from 'wagmi'

import { Icon }                         from '@iconify/react';

import { Button }                       from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
}                                       from "@/components/ui/tooltip"

import {
    nameWrapperAddress,
    subnameWrapperAddress
}                                       from '../../helpers/contract-addresses';
import { 
    useNameWrapper,
    useSubnameWrapper,
    useNameWrapperRead
}                                       from '../../lib/blockchain'

import CommonIcons                      from '../shared/common-icons';
import { TransactionConfirmationState } from '../shared/transaction-confirmation-state'

import { ToastAction }                  from "@/components/ui/toast"
import { useToast }                     from '@/lib/hooks/use-toast'

interface FuseListProps {
    name:        string,
}

export function FuseList({ name }: FuseListProps) {


    const domainParts                     = name.split(".");
    const label: string                           = domainParts.shift()!;
    const labelhash: `0x${string}`        = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(label)) as `0x${string}`;
    const namehash                        = ethers.utils.namehash(name)
    const namehashHex: `0x${string}`      = namehash as `0x${string}`;

    const domainNodeString                                      = domainParts.join(".");
    const isDotEth                                              = domainNodeString == "eth";
    const domainNodeNamehash: `0x${string}`                     = ethers.utils.namehash(domainNodeString)  as `0x${string}`;
    

    console.log("namehash", typeof namehash);
    console.log("namehashHex", namehashHex);

    const tokenId                         = ethers.BigNumber.from(namehash);
    const domainNodeTokenId                         = ethers.BigNumber.from(domainNodeNamehash);


    const { 
        data: signer, 
    }                                     = useSigner()

    //NameWrapper instance
    const nameWrapper = useNameWrapper({
        address:          nameWrapperAddress,
        signerOrProvider: signer
    });

    //SubnameWrapper instance
    const subnameWrapper = useSubnameWrapper({
        address:          subnameWrapperAddress,
        signerOrProvider: signer
    });


    //Gets owner/expiry/fuses from the namewrapper
    const  { data: nameData, refetch: refetchData }  = useNameWrapperRead({
         address:      nameWrapperAddress,
         functionName: 'getData',
         args:         [tokenId],
     });
    const {owner: nameWrapperOwnerAddress, fuses: wrapperFuses, expiry: wrapperExpiry} = nameData ?? {};
    const isAvailable = String(nameWrapperAddress) == String("0x0000000000000000000000000000000000000000");

    console.log("name data", nameData);


    //Gets owner/expiry/fuses from the namewrapper
    const  { data: parentNameData, refetch: refetchParentData }  = useNameWrapperRead({
         address:      nameWrapperAddress,
         functionName: 'getData',
         args:         [domainNodeTokenId],
     });
    const {owner: nameWrapperParentOwnerAddress, fuses: parentWrapperFuses} = parentNameData ?? {};

    console.log("PARENT name data", parentNameData);

    const  { data: isWrapped, refetch: refetchIsWrapped }  = useNameWrapperRead({
         address:      nameWrapperAddress,
         functionName: 'isWrapped',
         args:         [domainNodeNamehash, labelhash],
     });


    console.log("iswrapped", isWrapped);


    const [fuseBeingBurned, setFuseBeingBurned]                 = React.useState<string | null>(null);

    const { toast } = useToast()

    const addError = (error: any) => {

        console.log("adderror", error);

        toast({
            duration: 5000,
            className: "bg-red-200 border-0",
          //title: "Scheduled: Catch up ",
          description: error,
          variant: "destructive",
          //action: (
          //  <ToastAction altText="Goto schedule to undo">Undo</ToastAction>
          //),
        })

        console.log("post toast");
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
     * Burns a fuse on a .eth or a subdomain
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

            console.log("Burning child fuse on subdomain", fuseKey);
            console.log("domainNodeNamehash", domainNodeNamehash);
            console.log("labelhash", labelhash);

            await nameWrapper
                .callStatic
                .setChildFuses(
                    domainNodeNamehash, 
                    labelhash, 
                    FUSES[fuseKey], 
                    0, 
                    {gasLimit: 500000}
                )
                .then(() => {

                    return nameWrapper  
                        .setChildFuses(
                            domainNodeNamehash, 
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
                addError("The domain you entered has expired (" + formatExpiry(calculatedExpiry) + " ago).");
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

                addError("The domain is not locked (PARENT_CANNOT_CONTROL and CANNOT_UNWRAP have not both been burned).");
                setFuseBeingBurned(null);
                return;
            }

            console.log("Burning fuse on second level .eth", fuseKey);

            console.log("subnameWrapper",subnameWrapper);
            await subnameWrapper
                .callStatic
                .setFuses(namehash, FUSES[fuseKey], {gasLimit: 500000})
                .then(() => {

                    return subnameWrapper  
                        .setFuses(namehash, FUSES[fuseKey], {gasLimit: 500000})
                })
                .then((fuseResponse) => {
                    return fuseResponse.wait();
                })
                .then((fuseReceipt) => {
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
                            <th className="px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                                Fuse
                            </th>
                            <th className="px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                                Type
                            </th>
                            <th className="px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                                Burned?
                            </th>
                            <th className="px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
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
                                    <th className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-left text-blueGray-700 ">
                                            {fuseKey}
                                    </th>

                                  

                                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 ">

                                        <Tooltip delayDuration={0}>
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

                                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 ">
                                            {isBurned ? CommonIcons.check : CommonIcons.cross}
                                    </td>
                                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 ">
                                        {!isBurned && (
                                            <Button 
                                                type      = "submit" 
                                                disabled  = {typeof signer === "undefined"} 
                                                onClick   = {(e) => burnFuse(fuseKey)}
                                                className = "disabled:cursor-not-allowed">
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
