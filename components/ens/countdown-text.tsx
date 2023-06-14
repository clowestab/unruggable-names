import React           from 'react'
import { useInterval } from '../../helpers/Helpers.jsx';

interface CountdownTextProps {
    timestamp:   number,
    onComplete?: () => void
}

export function CountdownText({ timestamp, onComplete }: CountdownTextProps) {
	
	const currentTimestamp                      = Math.floor(Date.now() / 1000);
	const [currentTimeLeft, setCurrentTimeLeft] = React.useState(timestamp - currentTimestamp);
	const [isCompleted, setIsCompleted]         = React.useState(false);

	useInterval(async () => {

		setCurrentTimeLeft(currentTimeLeft - 1);

		if (currentTimeLeft <= 0 && !isCompleted) {

			console.log("Countdown complete");
			
			onComplete?.();
			setIsCompleted(true);
		}
			
	}, 1000);

	if (currentTimeLeft > 0) {

		return (
			<>
			  	{currentTimeLeft}
			</>
		);
	}

	return null;
}