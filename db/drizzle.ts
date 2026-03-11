import { config } from "dotenv"
import { drizzle } from "drizzle-orm/node-postgres"
import * as authSchema from "./auth-schema"
import * as chatSchema from "./chat-schema"
import * as marketplaceSchema from "./marketplace-schema"
import * as memorySchema from "./memory-schema"
import * as settingsSchema from "./settings-schema"
import * as telemetrySchema from "./telemetry-schema"

config({ path: ".env" }) // or .env.local

export const db = drizzle(process.env.DATABASE_URL, {
  schema: {
    ...authSchema,
    ...chatSchema,
    ...marketplaceSchema,
    ...memorySchema,
    ...settingsSchema,
    ...telemetrySchema,
  },
})
