import { useQuery } from 'wagmi'

import { getRenewalControllers } from '../../app/get-renewal-controllers'

export const useGetRenewalControllers = (queryKey?: any) => {
  return useQuery(['renewalControllers', queryKey], () => getRenewalControllers(), {
    cacheTime: 0,
  })
}
