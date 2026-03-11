import type { LanguageModelMiddleware } from "ai"
import type {
  LanguageModelV3StreamPart,
  LanguageModelV3Usage,
  LanguageModelV3FinishReason,
} from "@ai-sdk/provider"
import { db } from "@/db/drizzle"
import { llmTraces } from "@/db/telemetry-schema"

export interface TelemetryContext {
  chatId: string | null
  organizationId: string
}

function finishReasonStr(r: LanguageModelV3FinishReason | string): string {
  if (typeof r === "string") return r
  return r.unified
}

function extractToolNames(params: { tools?: Array<{ name: string }> }): string[] {
  return params.tools?.map((t) => t.name) ?? []
}

function serializeUsage(usage: LanguageModelV3Usage | null) {
  if (!usage) return {}
  return {
    inputTokensTotal: usage.inputTokens.total ?? null,
    inputTokensNoCache: usage.inputTokens.noCache ?? null,
    inputTokensCacheRead: usage.inputTokens.cacheRead ?? null,
    inputTokensCacheWrite: usage.inputTokens.cacheWrite ?? null,
    outputTokensTotal: usage.outputTokens.total ?? null,
    outputTokensText: usage.outputTokens.text ?? null,
    outputTokensReasoning: usage.outputTokens.reasoning ?? null,
  }
}

type TraceInsert = typeof llmTraces.$inferInsert

async function saveTrace(data: TraceInsert) {
  try {
    await db.insert(llmTraces).values(data)
  } catch (err) {
    console.error("[telemetry] failed to save trace:", err)
  }
}

export function createTelemetryMiddleware(ctx: TelemetryContext): LanguageModelMiddleware {
  return {
    specificationVersion: "v3",

    wrapGenerate: async ({ doGenerate, params, model }) => {
      const startAt = Date.now()
      const id = crypto.randomUUID()
      const toolsAvailable = extractToolNames(params)

      try {
        const result = await doGenerate()
        const durationMs = Date.now() - startAt

        const textContent = result.content
          .filter((c) => c.type === "text")
          .map((c) => ("text" in c ? (c.text as string) : ""))
          .join("")

        void saveTrace({
          id,
          chatId: ctx.chatId,
          organizationId: ctx.organizationId,
          type: "generate",
          model: model.modelId,
          provider: model.provider,
          promptMessages: params.prompt as TraceInsert["promptMessages"],
          toolsAvailable: toolsAvailable as TraceInsert["toolsAvailable"],
          temperature: params.temperature != null ? String(params.temperature) : null,
          maxOutputTokens: params.maxOutputTokens ?? null,
          responseContent: result.content as TraceInsert["responseContent"],
          textContent: textContent || null,
          finishReason: finishReasonStr(result.finishReason),
          ...serializeUsage(result.usage),
          durationMs,
          warnings: result.warnings as TraceInsert["warnings"],
          requestBody: result.request?.body as TraceInsert["requestBody"],
          responseMetadata: result.response
            ? ({
                id: result.response.id,
                modelId: result.response.modelId,
                timestamp: result.response.timestamp?.toISOString(),
              } as TraceInsert["responseMetadata"])
            : null,
        })

        return result
      } catch (err) {
        const durationMs = Date.now() - startAt
        void saveTrace({
          id,
          chatId: ctx.chatId,
          organizationId: ctx.organizationId,
          type: "generate",
          model: model.modelId,
          provider: model.provider,
          promptMessages: params.prompt as TraceInsert["promptMessages"],
          toolsAvailable: toolsAvailable as TraceInsert["toolsAvailable"],
          temperature: params.temperature != null ? String(params.temperature) : null,
          maxOutputTokens: params.maxOutputTokens ?? null,
          finishReason: "error",
          durationMs,
          error: err instanceof Error ? err.message : String(err),
        })
        throw err
      }
    },

    wrapStream: async ({ doStream, params, model }) => {
      const startAt = Date.now()
      const id = crypto.randomUUID()
      const toolsAvailable = extractToolNames(params)

      const { stream, ...rest } = await doStream()

      let firstTokenMs: number | null = null
      let usage: LanguageModelV3Usage | null = null
      let finishReason = "unknown"
      let error: string | null = null
      let textContent = ""
      const toolCalls: Array<{ id: string; name: string; input: string }> = []
      const responseMetadata: Record<string, unknown> = {}

      const intercepted = stream.pipeThrough(
        new TransformStream<LanguageModelV3StreamPart, LanguageModelV3StreamPart>({
          transform(chunk, controller) {
            switch (chunk.type) {
              case "text-delta":
                if (firstTokenMs === null) firstTokenMs = Date.now() - startAt
                textContent += chunk.delta
                break
              case "tool-input-start":
                toolCalls.push({ id: chunk.id, name: chunk.toolName, input: "" })
                break
              case "tool-input-delta": {
                const tc = toolCalls.find((t) => t.id === chunk.id)
                if (tc) tc.input += chunk.delta
                break
              }
              case "finish":
                usage = chunk.usage
                finishReason = finishReasonStr(chunk.finishReason)
                break
              case "response-metadata":
                if (chunk.id) responseMetadata.id = chunk.id
                if (chunk.modelId) responseMetadata.modelId = chunk.modelId
                if (chunk.timestamp) responseMetadata.timestamp = chunk.timestamp.toISOString()
                break
              case "error":
                error = String(chunk.error)
                break
            }
            controller.enqueue(chunk)
          },
          flush() {
            const durationMs = Date.now() - startAt
            const parsedToolCalls = toolCalls.map((tc) => {
              try {
                return { ...tc, input: JSON.parse(tc.input) }
              } catch {
                return tc
              }
            })

            void saveTrace({
              id,
              chatId: ctx.chatId,
              organizationId: ctx.organizationId,
              type: "stream",
              model: model.modelId,
              provider: model.provider,
              promptMessages: params.prompt as TraceInsert["promptMessages"],
              toolsAvailable: toolsAvailable as TraceInsert["toolsAvailable"],
              temperature: params.temperature != null ? String(params.temperature) : null,
              maxOutputTokens: params.maxOutputTokens ?? null,
              textContent: textContent || null,
              toolCalls: parsedToolCalls.length > 0 ? (parsedToolCalls as TraceInsert["toolCalls"]) : null,
              finishReason,
              ...serializeUsage(usage),
              durationMs,
              firstTokenMs,
              error,
              responseMetadata: Object.keys(responseMetadata).length > 0
                ? (responseMetadata as TraceInsert["responseMetadata"])
                : null,
            })
          },
        }),
      )

      return { stream: intercepted, ...rest }
    },
  }
}
