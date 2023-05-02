import React           from 'react'
import classNames      from 'classnames'
import { useInterval } from '../../helpers/Helpers.jsx';

export function CountdownText(props) {
	
	const currentTimestamp                      = Math.floor(Date.now() / 1000);
	const [currentTimeLeft, setCurrentTimeLeft] = React.useState(props.timestamp - currentTimestamp);
	const [isCompleted, setIsCompleted]         = React.useState(false);

	useInterval(async () => {

		setCurrentTimeLeft(currentTimeLeft - 1);

		if (currentTimeLeft <= 0 && !isCompleted) {
			console.log("Countdown complete");
			props.onComplete?.();
			setIsCompleted(true);
		}
			
	}, 1000);

	if (currentTimeLeft > 0) {

		return (
			<div>
			  	{currentTimeLeft}
			</div>
		);
	}

	return null;
}