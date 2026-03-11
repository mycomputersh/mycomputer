import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const llmTraces = pgTable(
  "llm_traces",
  {
    id: text("id").primaryKey(),
    // nullable so traces can exist even if chat is deleted later
    chatId: text("chat_id"),
    organizationId: text("organization_id").notNull(),
    /** 'generate' | 'stream' */
    type: text("type").notNull(),
    model: text("model").notNull(),
    provider: text("provider").notNull(),

    // Input
    promptMessages: jsonb("prompt_messages"),
    toolsAvailable: jsonb("tools_available"),
    temperature: text("temperature"),
    maxOutputTokens: integer("max_output_tokens"),

    // Output
    responseContent: jsonb("response_content"),
    textContent: text("text_content"),
    toolCalls: jsonb("tool_calls"),
    finishReason: text("finish_reason"),

    // Token usage
    inputTokensTotal: integer("input_tokens_total"),
    inputTokensNoCache: integer("input_tokens_no_cache"),
    inputTokensCacheRead: integer("input_tokens_cache_read"),
    inputTokensCacheWrite: integer("input_tokens_cache_write"),
    outputTokensTotal: integer("output_tokens_total"),
    outputTokensText: integer("output_tokens_text"),
    outputTokensReasoning: integer("output_tokens_reasoning"),

    // Timing
    durationMs: integer("duration_ms"),
    /** Time from request start to first token (streams only) */
    firstTokenMs: integer("first_token_ms"),

    // Metadata
    warnings: jsonb("warnings"),
    requestBody: jsonb("request_body"),
    responseMetadata: jsonb("response_metadata"),

    // Error (if the call failed)
    error: text("error"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("llm_traces_chat_idx").on(table.chatId),
    index("llm_traces_org_idx").on(table.organizationId),
    index("llm_traces_created_idx").on(table.chatId, table.createdAt),
  ],
)

export type LlmTrace = typeof llmTraces.$inferSelect
