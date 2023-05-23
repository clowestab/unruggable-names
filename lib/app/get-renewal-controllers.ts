import axios from 'axios'

export async function getRenewalControllers(): Promise<
  | {
      renewalControllers?: Array<any>
    }
  | undefined
  | void
> {
  try {
    const { data } = await axios.get('/api/app/renewal-controllers')
    return data
  } catch (error: any) {
    throw error
  }
}
