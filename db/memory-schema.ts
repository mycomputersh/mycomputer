import { customType, index, pgTable, text, timestamp } from "drizzle-orm/pg-core"

// Custom vector type for pgvector/pgvectorscale
// Requires: CREATE EXTENSION IF NOT EXISTS vectorscale CASCADE;
const vector = customType<{ data: number[]; driverData: string; config: { dimensions: number } }>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1536})`
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`
  },
  fromDriver(value: string): number[] {
    return value
      .slice(1, -1)
      .split(",")
      .map(Number)
  },
})

export const agentMemories = pgTable(
  "agent_memories",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    key: text("key").notNull(),
    content: text("content").notNull(),
    // gemini-embedding-001 produces 3072-dimensional embeddings
    embedding: vector("embedding", { dimensions: 3072 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("agent_memories_org_idx").on(table.organizationId),
    index("agent_memories_key_idx").on(table.organizationId, table.key),
    // DiskANN index must be created manually after enabling vectorscale:
    // CREATE INDEX ON agent_memories USING diskann (embedding vector_cosine_ops);
  ],
)
