import React                    from 'react'

import { 
    useAccount, 
    useProvider, 
    useSigner,
    useChainId 
}                               from 'wagmi'
import { foundry }              from 'wagmi/chains'
import { switchNetwork }        from "@wagmi/core";

import { useSubnameRegistrar }  from '../../lib/blockchain'

import { useToast }             from '@/lib/hooks/use-toast'

interface TransactionConfirmationStateProps {
    contract:     any,
    txFunction:   string,
    txArgs:       any,
    children:     Array<React.ReactElement>,
    onBefore?:    Function,
    onConfirmed?: Function,
    onAlways?:    Function,
    onError?:     Function,
    checkStatic:  boolean
}

//
// @ts-ignore
export function TransactionConfirmationState({ contract, txFunction, txArgs, children, onBefore, onConfirmed, onAlways, onError, checkStatic, chainId: expectedChainId = 42070 }: TransactionConfirmationStateProps): React.ReactElement | null {

    const  chainId         = useChainId();

    const { toast }        = useToast()

    console.log("txFunction", txFunction);
    console.log("txContract", contract);
    console.log("txArgs", txArgs);

    const { address, connector, isConnected }               = useAccount()
    const provider                                          = useProvider();
    const { data: signer }                                  = useSigner()

    const [hasStarted, setHasStarted]                       = React.useState(false);

    const [isConfirmed, setIsConfirmed]                     = React.useState(false);
    const [confirmationData, setConfirmationData]           = React.useState(null);
    const [confirmationError, setConfirmationError]         = React.useState(null);

    console.log("provider", provider);
    console.log("SIGNER", signer);

    console.log("method connector", connector);


    const doWork = async () => {

        console.log("chain id", chainId);

        if (chainId != expectedChainId) {

            console.log("switch network", expectedChainId);
            await switchNetwork({chainId: expectedChainId});

            //03/09/23 This return is important
            //Previously the switch network metamask dialog would appear we'd approve it then we'd instantly get
            //Error: underlying network changed and the appropriate UI error messages as well as the actual transaction being submitted again when the rerender of this component is triggered
            //This component is a bit shit, but no time..
            return;
        }

        //This is important for stopping transactions being sent multiple times
        setHasStarted(true);

        console.log("Lets write..", txFunction);
        
        onBefore?.();

        toast({
            duration: 8000,
            className: "bg-blue-200 dark:bg-blue-800 border-0",
            description: (<>Please confirm the transaction using your wallet provider (<span className = "font-bold">{connector?.name}</span>).</>),
        });

        (checkStatic ? contract.callStatic : contract)[txFunction](...txArgs.args, txArgs.overrides)
            .then((thing: any) => {

                if (checkStatic) {

                    return contract[txFunction](...txArgs.args, txArgs.overrides);

                } else {

                    return thing;
                }
            })
            .then((methodResponse: any) => {

                console.log("methodResponse", methodResponse);

                return methodResponse.wait();
            })
            .then((methodReceipt: any) => {

                console.log("methodReceipt", methodReceipt);

                if (methodReceipt.status == 1) {

                    setIsConfirmed(true);
                    onConfirmed?.(contract);
                }

                //return lookupName();
            })
            .catch((error: any) => {

                console.log("ERROR method response - " + error.reason, error);
                console.log("Werrorname", error.errorName);

                setConfirmationError(error.errorName != null ? error.errorName : "Something went wrong");
                setIsConfirmed(true);

                onError?.(error);

                //parseError(error);
                return;
            })
            .then(() => {
                //refreshBalance();
                onAlways?.();
            });
    }

    React.useEffect(() => {

        if (!hasStarted && signer !== undefined) {

            doWork();
        }

    }, [signer]);


    if (isConfirmed) {

        const output: any = confirmationError == null ? children[1] : confirmationError;
        
        return output;

    } else {

        return children[0];
    }
}
