import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const orgSettings = pgTable("org_settings", {
  organizationId: text("organization_id").primaryKey(),
  providerConfigs: text("provider_configs"), // JSON: Record<string, ProviderConfig>
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type OrgSettings = typeof orgSettings.$inferSelect

export type ProviderConfig = {
  apiKey?: string
  baseUrl?: string
  models?: string[] // models the user wants to use with this provider
}

export type ProviderConfigs = Record<string, ProviderConfig>
