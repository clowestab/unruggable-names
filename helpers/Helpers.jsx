import React from 'react'
const packet = require('dns-packet')

export function useInterval(callback, delay) {
	const intervalRef = React.useRef(null);
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

export const pluralize = (count, noun, suffix = 's') =>
  `${noun}${count !== 1 ? suffix : ''}`;

export const arrayDiff = (a, b) => a.filter((v) => !b.includes(v));
export const arrayUnique = (a) => [...new Set(a)];

export function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function toHexString(byteArray) {
  return Array.prototype.map.call(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}
function toByteArray(hexString) {
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
export function isMetaMask(ethereum) {

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


export function roundBigNumber(bigNumber, decimalPlaces) {

	const asEtherString = ethers.utils.formatEther(bigNumber.toString())

	const multiplier 		= "1".padEnd(decimalPlaces + 1, 0)

	//console.log("Multiplier", multiplier);
	const rounded 			= Math.round(asEtherString * multiplier) / multiplier;

	return rounded.toFixed(decimalPlaces);
}


//Helper function to format the amount of time until expiry
export const formatExpiry = (expirationTimestamp) => {

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


export const hexEncodeName = (name) => {
	return '0x' + packet.name.encode(name).toString('hex')
}

export function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
export function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
export function deleteCookie(name) {   
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}


export function buildErrorMessage(error) {

	if (error.code == "ACTION_REJECTED") {
		return "Transaction rejected.";
	}

	if (error.errorName) {
		return error.errorName;
	}

	return "There was a problem";
}
