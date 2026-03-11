import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const orgSettings = pgTable("org_settings", {
  organizationId: text("organization_id").primaryKey(),
  aiProvider: text("ai_provider").notNull().default("google"),
  aiApiKey: text("ai_api_key"),
  aiBaseUrl: text("ai_base_url"),
  aiModel: text("ai_model"),
  embeddingProvider: text("embedding_provider").notNull().default("google"),
  embeddingModel: text("embedding_model"),
  embeddingApiKey: text("embedding_api_key"),
  embeddingBaseUrl: text("embedding_base_url"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type OrgSettings = typeof orgSettings.$inferSelect
