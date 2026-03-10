import { config } from "dotenv"
import { drizzle } from "drizzle-orm/node-postgres"
import * as authSchema from "./auth-schema"
import * as memorySchema from "./memory-schema"

config({ path: ".env" }) // or .env.local

export const db = drizzle(process.env.DATABASE_URL, {
  schema: {
    ...authSchema,
    ...memorySchema,
  },
})
