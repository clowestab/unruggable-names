import React                    from 'react'

import { 
    useAccount, 
    useProvider, 
    useSigner 
}                               from 'wagmi'
import { foundry }              from 'wagmi/chains'

import { useSubnameRegistrar }  from '../../lib/blockchain'

import { useToast }             from '@/lib/hooks/use-toast'

interface TransactionConfirmationStateProps {
    contract:     any,
    txFunction:   string,
    txArgs:       any,
    children:     Array<React.ReactElement>,
    onConfirmed?: Function,
    onAlways?:    Function,
    checkStatic:  boolean
}

//
// @ts-ignore
export function TransactionConfirmationState({ contract, txFunction, txArgs, children, onBefore, onConfirmed, onAlways, onError, checkStatic }: TransactionConfirmationStateProps): React.ReactElement | null {

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


    React.useEffect(() => {

        if (!hasStarted && signer !== undefined) {
            console.log("Lets write..");
            
            onBefore?.();

            toast({
                duration: 8000,
                className: "bg-blue-200 dark:bg-blue-800 border-0",
                description: (<>Please confirm the transaction using your wallet provider (<span className = "font-bold">{connector.name}</span>).</>),
            });

            (checkStatic ? contract.callStatic : contract)[txFunction](...txArgs.args, txArgs.overrides)
                .then((thing) => {

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
                    setHasStarted(true);
                    onAlways?.();
                });
        }

    }, [signer]);


    if (isConfirmed) {

        const output: any = confirmationError == null ? children[1] : confirmationError;
        
        return output;

    } else {

        return children[0];
    }
}
