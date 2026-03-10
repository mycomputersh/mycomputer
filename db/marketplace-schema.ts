import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"

export const installedTools = pgTable(
  "installed_tools",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    itemId: text("item_id").notNull(),
    installedAt: timestamp("installed_at").defaultNow().notNull(),
  },
  (table) => [
    index("installed_tools_org_idx").on(table.organizationId),
    uniqueIndex("installed_tools_org_item_uidx").on(
      table.organizationId,
      table.itemId,
    ),
  ],
)
