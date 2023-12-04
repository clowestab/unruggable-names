import React      from 'react'
import { ethers } from "ethers";
const packet = require('dns-packet')


export function useInterval(callback: () => {}, delay: number) {
	const intervalRef = React.useRef<any>(null);
	const savedCallback = React.useRef(callback);
	React.useEffect(() => {
		savedCallback.current = callback;
	}, [callback]);
	React.useEffect(() => {
		const tick = () => savedCallback.current();
		if (typeof delay === 'number') {
			intervalRef.current = window.setInterval(tick, delay);
			return () => window.clearInterval(intervalRef.current);
		}
	}, [delay]);
	return intervalRef;
}

export const pluralize = (count: number, noun: string, suffix = 's') =>
  `${noun}${count !== 1 ? suffix : ''}`;

export const arrayDiff = (a: Array<any>, b: Array<any>) => a.filter((v) => !b.includes(v));
export const arrayUnique = (a: Array<any>) => [...new Set(a)];

export function timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function toHexString(byteArray: Uint8Array) {
  return Array.prototype.map.call(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}
function toByteArray(hexString: string) {
  var result = [];
  for (var i = 0; i < hexString.length; i += 2) {
    result.push(parseInt(hexString.substr(i, 2), 16));
  }
  return result;
}


export function generateSalt() {

	const array = new Uint8Array(32);
	self.crypto.getRandomValues(array);

    return toHexString(array);
}

//Helper function to discern if the user is using a browser with the Metamask extension
export function isMetaMask(ethereum: any) {

	if (ethereum === undefined) {
		return false;
	}

  	// Logic borrowed from wagmi's MetaMaskConnector
  	// https://github.com/tmm/wagmi/blob/main/packages/core/src/connectors/metaMask.ts
  	const isMetaMask = Boolean(ethereum.isMetaMask);

  	if (!isMetaMask) {
    	return false;
  	}

  	// Brave tries to make itself look like MetaMask
  	// Could also try RPC `web3_clientVersion` if following is unreliable
  	if (ethereum.isBraveWallet && !ethereum._events && !ethereum._state) {
    	return false;
  	}

  	if (ethereum.isTokenary) {
    	return false;
  	}

  	return true;
}


export function roundBigNumber(bigNumber: number, decimalPlaces: number) {

	const asEtherString = ethers.utils.formatEther(bigNumber.toString())

	const multiplier: number 		= parseInt("1".padEnd(decimalPlaces + 1, "0"))

	//console.log("Multiplier", multiplier);
	const rounded 			= Math.round(bigNumber * multiplier / multiplier);

	return rounded.toFixed(decimalPlaces);
}


//Helper function to format the amount of time until expiry
export const formatExpiry = (expirationTimestamp: number) => {

	const expirationDate    = new Date(expirationTimestamp);
	const nowDate           = new Date();
	const nowTimestamp      = Math.abs(nowDate.getTime() / 1000);

	console.log("Expiration", expirationTimestamp);
	console.log("Now", nowTimestamp);

	var timeDiffInSeconds   = expirationTimestamp - nowTimestamp;
	timeDiffInSeconds       = timeDiffInSeconds || 0;
	timeDiffInSeconds       = Number(timeDiffInSeconds);
	timeDiffInSeconds       = Math.abs(timeDiffInSeconds);

	const d = Math.floor(timeDiffInSeconds / (3600 * 24));
	const h = Math.floor(timeDiffInSeconds % (3600 * 24) / 3600);
	const m = Math.floor(timeDiffInSeconds % 3600 / 60);
	const s = Math.floor(timeDiffInSeconds % 60);
	const parts = [];

	if (d > 0) {
		parts.push(d + ' day' + (d > 1 ? 's' : ''));
	}

	if (h > 0) {
		parts.push(h + ' hour' + (h > 1 ? 's' : ''));
	}

	if (m > 0) {
		parts.push(m + ' minute' + (m > 1 ? 's' : ''));
	}

	if (s > 0) {
		parts.push(s + ' second' + (s > 1 ? 's' : ''));
	}

	return parts.join(', ');
}


export const hexEncodeName = (name: string) => {
	return '0x' + packet.name.encode(name).toString('hex')
}

export function setCookie(name: string, value: any, days: number) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
export function getCookie(name: string) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
export function deleteCookie(name: string) {   
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}


export function buildErrorMessage(error: any) {

	if (error.code == "ACTION_REJECTED") {
		return "Transaction rejected.";
	}

	if (error.errorName) {
		return error.errorName;
	}

	return "There was a problem";
}

type NameData = {
	name: string,
	namehash: `0x${string}`,
	namehashAsInt:           ethers.BigNumber,
	label:                   string,
	labelhash:               `0x${string}`,
	labelhashAsInt:          ethers.BigNumber,
	parentName:              string,
	isDotEth:                boolean,
	isEth2ld:                boolean,
	dnsEncodedName:          `0x${string}`
};

export function parseName(name: string): NameData {

	const namehash                          = ethers.utils.namehash(name) as `0x${string}`;

	//Split the name at each dot
	const nameParts                         = name.split(".");

	//Get the first part and remove it from the array
	const label		                    	= nameParts.shift();
	const labelhash          				= ethers.utils.keccak256(ethers.utils.toUtf8Bytes(label!)) as `0x${string}`;
	const labelhashAsInt                    = ethers.BigNumber.from(labelhash);

	//Join the remainder of the name to get the parent name
	const parentName                    	= nameParts.join(".");

	const isDotEth                          = parentName == "eth";
	const isEth2ld                          = isDotEth && nameParts.length == 1;
	
	//For the NameWrapper this is the token ID.
	const namehashAsInt                     = ethers.BigNumber.from(namehash);

	const dnsEncodedName 					= hexEncodeName(name) as `0x${string}`;


	return {
		name:                    name,
		namehash:                namehash,
		namehashAsInt:           namehashAsInt,
		label:                   label!,
		labelhash:               labelhash,
		labelhashAsInt:          labelhashAsInt,
		parentName:              parentName,
		isDotEth:                isDotEth,
		isEth2ld:                isEth2ld,
		dnsEncodedName:          dnsEncodedName
	};
}

export function getUnruggableName(name: string): NameData {

	//Split the name at each dot
	const nameParts                 = name.split(".");
	nameParts[nameParts.length - 1] = "unruggable";
	const unruggableName            = nameParts.join(".");

	console.log("parsedData", unruggableName);

	const parsedData 		 		= parseName(unruggableName);

	console.log("parsedData", parsedData);

	return parsedData;
}
