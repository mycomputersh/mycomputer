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
    // 1536 dims — works for both OpenAI (text-embedding-3-small) and Google
    // (gemini-embedding-001 with outputDimensionality: 1536)
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("agent_memories_org_idx").on(table.organizationId),
    index("agent_memories_key_idx").on(table.organizationId, table.key),
    // DiskANN index must be created manually after enabling vectorscale:
    // CREATE INDEX ON agent_memories USING diskann (embedding vector_cosine_ops);
  ],
)
