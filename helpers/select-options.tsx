import { 
    pricePerCharRenewalControllerAddress,
    fixedPriceRenewalControllerAddress 
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
            label:              "$5 Renewal Controller", 
            value:              fixedPriceRenewalControllerAddress[chainId], 
            controlDescription: "sell subnames for a fixed $5 fee.",
            showConfig:         false
        },
        {
            label:              "Length Based Renewal Controller", 
            value:              pricePerCharRenewalControllerAddress[chainId], 
            controlDescription: "set pricing on a per character basis.",
            showConfig:         true
        },
    ]
}