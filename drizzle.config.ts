import "dotenv/config"
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  out: "./drizzle",
  schema: [
    "./db/schema.ts",
    "./db/auth-schema.ts",
    "./db/chat-schema.ts",
    "./db/marketplace-schema.ts",
    "./db/mcp-schema.ts",
    "./db/memory-schema.ts",
    "./db/settings-schema.ts",
    "./db/telemetry-schema.ts",
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
})
