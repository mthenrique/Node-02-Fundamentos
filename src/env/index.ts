import { config } from 'dotenv'
import { z } from 'zod'
import { ParametersError } from '../errors/parameters-error'

if (process.env.NODE_ENV === 'test') {
  config({ path: '.env.test' })
} else {
  config()
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_CLIENT: z.enum(['sqlite', 'pg']),
  DATABASE_URL: z.string().trim().min(1),
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  console.error('Invalid environment variables', _env.error.format())

  throw new ParametersError(
    '[PARAMETERS_ERROR] Invalid environment variables',
    _env.error.format(),
  )
}

export const env = _env.data
