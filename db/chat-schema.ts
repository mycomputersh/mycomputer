import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import type { UIMessage } from "ai"

export const chatFolders = pgTable(
  "chat_folders",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("chat_folders_org_idx").on(table.organizationId)],
)

export const chats = pgTable(
  "chats",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    folderId: text("folder_id").references(() => chatFolders.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    messages: jsonb("messages").$type<UIMessage[]>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("chats_org_idx").on(table.organizationId),
    index("chats_folder_idx").on(table.folderId),
    index("chats_updated_idx").on(table.organizationId, table.updatedAt),
  ],
)
