-- Run this SQL once on your PostgreSQL database to enable pgvectorscale.
-- Requires: PostgreSQL with the pgvectorscale extension installed.
-- See: https://github.com/timescale/pgvectorscale#get-started-with-pgvectorscale

-- 1. Enable extensions (vectorscale also enables pgvector)
CREATE EXTENSION IF NOT EXISTS vectorscale CASCADE;

-- 2. Create the agent_memories table (also done via drizzle push/migrate)
CREATE TABLE IF NOT EXISTS agent_memories (
  id          TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  key         TEXT NOT NULL,
  content     TEXT NOT NULL,
  embedding   vector(3072) NOT NULL,
  created_at  TIMESTAMP DEFAULT now() NOT NULL
);

-- 3. Create standard indexes
CREATE INDEX IF NOT EXISTS agent_memories_org_idx ON agent_memories (organization_id);
CREATE INDEX IF NOT EXISTS agent_memories_key_idx ON agent_memories (organization_id, key);

-- 4. Create the DiskANN index for fast approximate nearest-neighbor search
--    (pgvectorscale required — this cannot be done via drizzle-kit automatically)
CREATE INDEX IF NOT EXISTS agent_memories_embedding_diskann_idx
  ON agent_memories USING diskann (embedding vector_cosine_ops);
