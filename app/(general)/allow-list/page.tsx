'use client'
import React                            from 'react'

import { Label }                        from "@/components/ui/label"
import { Input }                        from "@/components/ui/input"
import { Button }                       from "@/components/ui/button"
import { TransactionConfirmationState } from '@/components/shared/transaction-confirmation-state'
import CommonIcons                      from '@/components/shared/common-icons';

import { ethers }                       from "ethers";

import { 
		useSubnameRegistrar, 
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

export default function AllowList() {

	const { 
			data: signer, 
	}                             = useSigner()
	const provider                = useProvider()

	const  chainId                = useChainId();

	//SubnameRegistrar instance
	const subnameRegistrar        = useSubnameRegistrar({
			chainId: chainId,
			signerOrProvider: signer ?? provider
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
						contract  = {subnameRegistrar}
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
