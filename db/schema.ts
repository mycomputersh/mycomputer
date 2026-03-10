import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`uuidv7()`),
  name: text().notNull(),
  email: text().notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})
