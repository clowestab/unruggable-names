import { Icon } from '@iconify/react';

export default {
	miniLoader: (
		<Icon 
			className   = "inline-block"
			icon        = "eos-icons:three-dots-loading"  
			width       = "24" 
			height      = "24" />
	),
	save: (
		<Icon 
			className   = "inline-block"
			icon        = "ant-design:save-outlined"  
			width       = "24" 
			height      = "24" />
	),
	copy: (
		<Icon 
			className   = "inline-block"
			icon        = "clarity:copy-line"  
			width       = "24" 
			height      = "24" />
	),
	tooltip: (
    	<Icon 
			className 	= "inline-block"
            icon 		= "ant-design:question-circle-outlined" />
	),
	alert: (
    	<Icon 
			className 	= "inline-block ml-2"
            icon 		= "akar-icons:triangle-alert" />
	),
	check: (
    	<Icon 
			className 	= "inline-block ml-2"
            icon 		= "ant-design:check-circle-outlined"
            color 		= "green" />
	),
	cross: (
    	<Icon 
			className 	= "inline-block ml-2"
            icon 		= "ant-design:close-circle-outlined"
            color 		= "red" />
	),
	upload: (
    	<Icon 
			className 	= "inline-block ml-2"
            icon 		= "ic:baseline-file-upload" />
	)
}