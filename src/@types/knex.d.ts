// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Knex } from 'knex'
import TransactionType from '../enum/transaction-type'

declare module 'knex/types/tables' {
  export interface Tables {
    transactions: {
      id: string
      title: string
      amount: number
      type: TransactionType
      session_id?: string
      created_at: string
      updated_at: string
      deleted_at?: string
    }
  }
}
