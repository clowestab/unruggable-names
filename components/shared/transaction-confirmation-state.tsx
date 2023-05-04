import React                    from 'react'

import { 
    useAccount, 
    useProvider, 
    useSigner 
}                               from 'wagmi'
import { foundry }              from 'wagmi/chains'

import { useSubnameRegistrar }  from '../../lib/blockchain'

interface TransactionConfirmationStateProps {
    contract:     any,
    txFunction:   string,
    txArgs:       Object<any>,
    children:     Array<React.ReactElement>,
    onConfirmed?: Function,
    onAlways?:    Function,
}

// @ts-ignore
export function TransactionConfirmationState({ contract, txFunction, txArgs, children, onConfirmed, onAlways }: TransactionConfirmationStateProps): React.ReactElement | null {

    console.log("txFunction", txFunction);
    console.log("txArgs", txArgs);

    const { address }                                       = useAccount()
    const provider                                          = useProvider();
    const { data: signer }                                  = useSigner()

    const [hasStarted, setHasStarted]                       = React.useState(false);

    const [isConfirmed, setIsConfirmed]                     = React.useState(false);
    const [confirmationData, setConfirmationData]           = React.useState(null);
    const [confirmationError, setConfirmationError]         = React.useState(null);

    console.log("provider", provider);
    console.log("SIGNER", signer);


    React.useEffect(() => {

        if (!hasStarted && signer !== undefined) {
            console.log("Lets write..");
            
            contract.callStatic[txFunction](...txArgs.args, txArgs.overrides)
                .then(() => {

                    return contract[txFunction](...txArgs.args, txArgs.overrides);
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

                    //return lookupDomain();
                })
                .catch((error: any) => {

                    console.log("ERROR method response - " + error.reason, error);
                    console.log("Werrorname", error.errorName);

                    setConfirmationError(error.errorName != null ? error.errorName : "Something went wrong");
                    setIsConfirmed(true);

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
