import React                            from 'react'
import { ethers }                       from "ethers";

import { 
  useAccount, 
  useWaitForTransaction, 
  useProvider, 
  useSigner 
}                                       from 'wagmi'
import { foundry }                      from 'wagmi/chains'

import { 
  useRenewalController, 
  useSubnameWrapperRead, 
  useNameWrapperRead, 
  useEnsRegistryRead, 
  useSubnameRegistrarRenew, 
  useSubnameRegistrarRead 
}                                       from '../../lib/blockchain'

import CommonIcons                      from '../shared/common-icons';
import { TransactionConfirmationState } from '../shared/transaction-confirmation-state'

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

import { Button }                       from "@/components/ui/button"

import { 
  formatExpiry, 
  hexEncodeName 
}                               from '../../helpers/Helpers.jsx';

import {
  renewalControllerAddress,
  subnameRegistrarAddress,
  subnameWrapperAddress,
  nameWrapperAddress,
  ensRegistryAddress,
  ethRegistrarControllerAddress
}                                       from '../../helpers/contract-addresses.tsx';

interface SubdomainWhoisAlertProps {
  txFunction:  Function,
  txArgs:      Array<any>,
  children?:   React.ReactElement | Array<React.ReactElement>,
  inComplete?: Function
}

// @ts-ignore
export function SubdomainWhoisAlert({ name }: SubdomainWhoisAlertProps): React.ReactElement | null {

    const { address }       = useAccount()

    const { 
      data: signer, 
      isErrorSigner, 
      isLoadingSigner 
    }             = useSigner()

    console.log("SIGNER", signer);

    const renewalController = useRenewalController({
    address:          renewalControllerAddress,
    chainId:          foundry.id,
    signerOrProvider: signer
  });

    const [isRenewing, setIsRenewing]     = React.useState(false);

    const namehash              = ethers.utils.namehash(name);
    const tokenId               = ethers.BigNumber.from(namehash).toString();
    const encodedNameToRenew    = hexEncodeName(name);
    const renewForTimeInSeconds = 31536000;
    const refererAddress        = "0x0000000000000000000000000000000000005627";

    const  { data: ownerAddress }  = useSubnameWrapperRead({
    address:       subnameWrapperAddress,
    functionName:  'ownerOf',
    args:          [namehash],
    chainId:       foundry.id
    });

    const  { data: rentPrice }  = useSubnameRegistrarRead({
    address:       subnameRegistrarAddress,
    functionName:  'rentPrice',
    args:          [encodedNameToRenew, renewForTimeInSeconds],
    chainId:       foundry.id
    });

    console.log("renewal price for " + name, rentPrice);

    const  { data: nameData, refetch: refetchData  }  = useSubnameWrapperRead({
    address:       subnameWrapperAddress,
    functionName:  'getData',
    args:          [tokenId],
    chainId:       foundry.id
    });

    console.log("name data", nameData);

    const  { data: nameWrapperOwnerAddress }  = useNameWrapperRead({
    address:       nameWrapperAddress,
    functionName:  'ownerOf',
    args:          [namehash],
    chainId:       foundry.id
    });

    const  { data: registryOwnerAddress }  = useEnsRegistryRead({
    address:       ensRegistryAddress,
    functionName:  'owner',
    args:          [namehash],
    chainId:       foundry.id
    });

    console.log("owner address " + name, ownerAddress);

    const doRenew = () => {

    console.log("renew");
    setIsRenewing(true);
    }

    const isOwnedByUser = nameData?.owner == address;

  return (
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{name}</AlertDialogTitle>
          <AlertDialogDescription>
          <div>This name is registered to: <span className = "font-bold">{ownerAddress}</span>

              <div className = "text-xs text-red-800 mt-1">This is me</div>
          </div>

          <div className = "mt-2">Expiry: <span className = "font-bold">{formatExpiry(nameData?.expiry)}</span>

            <div className = "mt-2">

            {!isRenewing ? (
                <>
                <Button type="submit" disabled = {isRenewing} onClick = {doRenew}>
                    {isRenewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Renew
                </Button>

                {isOwnedByUser && nameData && nameData.renewalController == "0x0000000000000000000000000000000000000000" && (
                    <div className = "text-xs text-red-800 mt-1">You can renew this because you own it and there is no renewal controller set.</div>
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
                    gasLimit: 5000000,
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
            </div>
        </div>

        <div className = "mt-2">
          NameWrapper owner: <span className = "font-bold">{nameWrapperOwnerAddress}</span>
            <div className = "text-xs text-red-800 mt-1">This is the SubnameWrapper</div>
        </div>

        <div className = "mt-2">
          Registry owner: <span className = "font-bold">{registryOwnerAddress}</span>
            <div className = "text-xs text-red-800 mt-1">This is the NameWrapper</div>
        </div>
       </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogAction>Close</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
  )
}
