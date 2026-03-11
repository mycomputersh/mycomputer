import { embed } from "ai"
import { tool, type UIToolInvocation } from "ai"
import { z } from "zod"
import { and, eq, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { db } from "@/db/drizzle"
import { agentMemories } from "@/db/memory-schema"
import { createEmbeddingModel } from "@/lib/models"
import type { ProviderConfigs } from "@/db/settings-schema"

type EmbeddingModelInstance = ReturnType<typeof createEmbeddingModel>

async function getEmbedding(
  text: string,
  model: EmbeddingModelInstance,
  isGoogle: boolean,
): Promise<number[]> {
  const { embedding } = await embed({
    model,
    value: text,
    ...(isGoogle
      ? { providerOptions: { google: { taskType: "SEMANTIC_SIMILARITY", outputDimensionality: 1536 } } }
      : {}),
  })
  return embedding
}

// ─── Tool factory ────────────────────────────────────────────────────────────

export function createMemoryTools(organizationId: string, providerConfigs: ProviderConfigs | null = null) {
  const embeddingModel = createEmbeddingModel(providerConfigs)
  const isGoogle = !providerConfigs?.["openai"]?.apiKey && !process.env.OPENAI_API_KEY
  const memoryStoreTool = tool({
    description:
      "Store information in persistent semantic memory. Use for facts, preferences, or context to recall later.",
    inputSchema: z.object({
      key: z.string().describe("A short unique label for this memory"),
      content: z.string().describe("The content to remember"),
    }),
    execute: async ({ key, content }) => {
      const embedding = await getEmbedding(content, embeddingModel, isGoogle)
      // Upsert: delete existing memory with same key first
      await db
        .delete(agentMemories)
        .where(
          and(
            eq(agentMemories.organizationId, organizationId),
            eq(agentMemories.key, key),
          ),
        )
      await db.insert(agentMemories).values({
        id: nanoid(),
        organizationId,
        key,
        content,
        embedding,
      })
      return { stored: true, key }
    },
  })

  const memoryRecallTool = tool({
    description:
      "Search memory semantically to recall relevant stored information.",
    inputSchema: z.object({
      query: z.string().describe("What to search for in memory"),
      limit: z.number().optional().describe("Max results to return (default 5)"),
    }),
    execute: async ({ query, limit }) => {
      const queryEmbedding = await getEmbedding(query, embeddingModel, isGoogle)
      const embeddingStr = `[${queryEmbedding.join(",")}]`

      const results = await db
        .select({
          key: agentMemories.key,
          content: agentMemories.content,
          createdAt: agentMemories.createdAt,
          similarity: sql<number>`1 - (${agentMemories.embedding} <=> ${embeddingStr}::vector)`,
        })
        .from(agentMemories)
        .where(eq(agentMemories.organizationId, organizationId))
        .orderBy(sql`${agentMemories.embedding} <=> ${embeddingStr}::vector`)
        .limit(limit ?? 5)

      return { results, count: results.length }
    },
  })

  const memoryForgetTool = tool({
    description: "Delete a stored memory by its key.",
    inputSchema: z.object({
      key: z.string().describe("The key of the memory to delete"),
    }),
    execute: async ({ key }) => {
      await db
        .delete(agentMemories)
        .where(
          and(
            eq(agentMemories.organizationId, organizationId),
            eq(agentMemories.key, key),
          ),
        )
      return { deleted: true, key }
    },
  })

  return { memoryStoreTool, memoryRecallTool, memoryForgetTool }
}

// ─── Type exports ─────────────────────────────────────────────────────────────
// Dummy instance used only for type inference — no DB calls at module load time

const _ref = createMemoryTools("__type_ref__", null)

export type MemoryStoreInvocation = UIToolInvocation<typeof _ref.memoryStoreTool>
export type MemoryRecallInvocation = UIToolInvocation<typeof _ref.memoryRecallTool>
export type MemoryForgetInvocation = UIToolInvocation<typeof _ref.memoryForgetTool>
