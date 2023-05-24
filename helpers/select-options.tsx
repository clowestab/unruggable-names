import { 
    renewalControllerAddress 
}                                       from '@/lib/blockchain'

export const renewalLengthOptions = [
    {label: "365 days", value: 365 * 24 * 60 * 60},
    {label: "180 days", value: 180 * 24 * 60 * 60},
    {label: "60 days", value: 60 * 24 * 60 * 60},
    {label: "30 days", value: 30 * 24 * 60 * 60},
]

export const getRenewalControllerOptions = (chainId) => {

    return [
        {
            label:              "Basic Renewal Controller", 
            value:              renewalControllerAddress[chainId], 
            controlDescription: "on a per character basis."
        },
    ]
}