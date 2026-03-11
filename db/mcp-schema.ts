import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const mcpServers = pgTable(
  "mcp_servers",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    installedAt: timestamp("installed_at").defaultNow().notNull(),
  },
  (table) => [index("mcp_servers_org_idx").on(table.organizationId)],
)
