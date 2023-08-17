'use client'
import React                            from 'react'

import { Label }                        from "@/components/ui/label"
import { Input }                        from "@/components/ui/input"
import { Button }                       from "@/components/ui/button"
import { TransactionConfirmationState } from '@/components/shared/transaction-confirmation-state'
import CommonIcons                      from '@/components/shared/common-icons';

import { ethers }                       from "ethers";

import { 
		useL2SubnameRegistrar, 
}                                       from '@/lib/blockchain'

import { 
		hexEncodeName,
}                                       from '@/helpers/Helpers.jsx';

import { 
		useAccount, 
		useProvider, 
		useSigner, 
		useNetwork,
		useChainId,
}                                         from 'wagmi'

import { useToast }                       from '@/lib/hooks/use-toast'

import {
    ETHEREUM_CHAIN_ID,
    OPTIMISM_CHAIN_ID
}                                       from '@/helpers/constants'


export default function AllowList() {

	const { 
			data: optimismSigner, 
	}                             = useSigner({ chainId: OPTIMISM_CHAIN_ID })
	const optimismProvider        = useProvider({ chainId: OPTIMISM_CHAIN_ID })

	const  chainId                = useChainId();

	//Eth registrar instance
	const ethRegistrar        = useL2SubnameRegistrar({
			chainId:          OPTIMISM_CHAIN_ID,
			signerOrProvider: optimismSigner ?? optimismProvider
	});

	const nameInputRef            = React.useRef<HTMLInputElement>(null);
	const [isAdding, setIsAdding] = React.useState(false);

	const { toast }               = useToast()


	const onClickAdd = () => {

		setIsAdding(true);
	}


	return (
		<>
			<Label htmlFor = "minRegistrationDuration">Name</Label>
			<Input 
				type         = "text" 
				id           = "nameInput" 
				ref          = {nameInputRef} 
				className    = "my-2" />

			<Button 
				type     = "submit" 
				disabled = {isAdding} 
				onClick  = {onClickAdd}>
				{isAdding ? CommonIcons.miniLoader : "Add to Allow List"}
			</Button>


			{isAdding && (
				<TransactionConfirmationState 
						key       = {"allow-list-add"}
						contract  = {ethRegistrar}
						txArgs    = {{
								args: [
									hexEncodeName(nameInputRef.current.value),
									true
								],
								overrides: {
									gasLimit: ethers.BigNumber.from("5000000"),
								}
						}}
						txFunction  = 'allowName'
						onConfirmed = {() => {

							toast({
								duration: 5000,
								className: "bg-green-200 dark:bg-green-800 border-0",
								description: (<p><span className = "font-bold">{nameInputRef.current.value}</span> was successfully added to the allow list.</p>),
							});
						}}
						onAlways  = {() => {
							console.log("ALLOW onAlways");
							setIsAdding(false);
						}}
						onError = {() => {

							toast({
								duration: 5000,
								className: "bg-red-200 dark:bg-red-800 border-0",
								description: (<p>Failed to add name to allow list.</p>),
							});
						}}
						checkStatic = {true}>
						<div>
							{/* Interface handled manually*/}
						</div>
						<div>
							{/* Interface handled manually*/}
						</div>
				</ TransactionConfirmationState>
			)}
		</>
	)
}
