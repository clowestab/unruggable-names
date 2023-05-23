import { NextApiRequest, NextApiResponse } from 'next'

import { prisma } from '@/lib/prisma'
import { withSessionRoute } from '@/lib/server'

export default withSessionRoute(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      console.log("prisma", prisma);
      const renewalControllers = await prisma["renewal-controllers"].findMany()
      return res.send({ renewalControllers, object: 'RenewalControllers' })
    } catch (error: any) {
      console.log(error)
      return res.status(500).send(error?.message)
    }
  }

  res.setHeader('Allow', ['GET'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
})
