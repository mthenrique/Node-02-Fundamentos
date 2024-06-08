import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import TransactionType from '../enum/transaction-type'
import { ParametersError } from '../errors/parameters-error'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function transactionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req) => {
    console.log(`[${req.method}] ${req.url}`)
  })

  app.get('/', { preHandler: [checkSessionIdExists] }, async (req) => {
    const { sessionId } = req.cookies

    const transactions = await knex('transactions')
      .where('session_id', sessionId)
      .select()

    return { transactions }
  })

  app.get('/:id', { preHandler: [checkSessionIdExists] }, async (req) => {
    const { sessionId } = req.cookies

    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const params = getTransactionParamsSchema.safeParse(req.params)

    if (!params.success) {
      throw new ParametersError(
        '[PARAMETERS_ERROR] Invalid parameters',
        params.error,
      )
    }

    const { id } = params.data

    const transaction = await knex('transactions')
      .where({
        session_id: sessionId,
        id,
      })
      .first()

    return { transaction }
  })

  app.get('/summary', { preHandler: [checkSessionIdExists] }, async (req) => {
    const { sessionId } = req.cookies

    const summary = await knex('transactions')
      .where('session_id', sessionId)
      .sum('amount', { as: 'amount' })
      .first()

    return { summary }
  })

  app.post('/', async (req, res) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.nativeEnum(TransactionType),
    })

    const body = createTransactionBodySchema.safeParse(req.body)

    if (!body.success) {
      throw new ParametersError(
        '[PARAMETERS_ERROR] Invalid parameters',
        body.error,
      )
    }

    let sessionId = req.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      res.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    const { type, title, amount } = body.data

    await knex('transactions').insert({
      id: randomUUID(),
      type,
      title,
      amount: type === TransactionType.CREDIT ? amount : amount * -1,
      session_id: sessionId,
    })

    return res.status(201).send()
  })
}
