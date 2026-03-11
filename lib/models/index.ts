import { devToolsMiddleware } from "@ai-sdk/devtools"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createMistral } from "@ai-sdk/mistral"
import { createGroq } from "@ai-sdk/groq"
import { createOpenAI } from "@ai-sdk/openai"
import { wrapLanguageModel, type LanguageModelMiddleware } from "ai"
import type { ProviderConfigs } from "@/db/settings-schema"
import { createTelemetryMiddleware, type TelemetryContext } from "@/lib/middleware/telemetry"

// ─── Rate-limit backoff middleware ────────────────────────────────────────────

const MAX_RETRIES = 5
const BASE_DELAY_MS = 2_000

function isRateLimit(err: unknown) {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  return (
    msg.includes("too many requests") ||
    msg.includes("rate limit") ||
    (err as { statusCode?: number }).statusCode === 429
  )
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function withBackoff<T>(fn: () => PromiseLike<T>, label: string): Promise<T> {
  let delay = BASE_DELAY_MS
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (isRateLimit(err) && attempt < MAX_RETRIES) {
        console.warn(`Rate limit hit (${label}). Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`)
        await sleep(delay)
        delay = Math.min(delay * 2, 60_000)
        continue
      }
      throw err
    }
  }
  throw new Error("unreachable")
}

const rateLimitBackoffMiddleware: LanguageModelMiddleware = {
  specificationVersion: "v3",
  wrapGenerate: (options) => withBackoff(() => options.doGenerate(), "generate"),
  wrapStream: (options) => withBackoff(() => options.doStream(), "stream"),
}

// ─── Model factory ────────────────────────────────────────────────────────────
// modelString format: "provider:modelId"  e.g. "google:gemini-2.5-flash"

export function createLanguageModel(
  providerConfigs: ProviderConfigs | null,
  modelString: string,
  telemetry?: TelemetryContext,
) {
  const sepIdx = modelString.indexOf(":")
  const providerId = sepIdx === -1 ? "google" : modelString.slice(0, sepIdx)
  const modelId = sepIdx === -1 ? modelString : modelString.slice(sepIdx + 1)

  const config = providerConfigs?.[providerId] ?? {}

  const middleware: LanguageModelMiddleware[] = []
  if (telemetry) middleware.push(createTelemetryMiddleware(telemetry))
  middleware.push(rateLimitBackoffMiddleware, devToolsMiddleware())

  const wrap = (model: Parameters<typeof wrapLanguageModel>[0]["model"]) =>
    wrapLanguageModel({ model, middleware })

  switch (providerId) {
    case "openai": {
      const client = createOpenAI({
        apiKey: config.apiKey ?? process.env.OPENAI_API_KEY,
        baseURL: config.baseUrl ?? undefined,
      })
      return wrap(client(modelId || "gpt-4o"))
    }
    case "anthropic": {
      const client = createAnthropic({
        apiKey: config.apiKey ?? process.env.ANTHROPIC_API_KEY,
      })
      return wrap(client(modelId || "claude-sonnet-4-6"))
    }
    case "groq": {
      const client = createGroq({
        apiKey: config.apiKey ?? process.env.GROQ_API_KEY,
        baseURL: config.baseUrl ?? undefined,
      })
      return wrap(client(modelId || "llama-3.3-70b-versatile"))
    }
    case "mistral": {
      const client = createMistral({
        apiKey: config.apiKey ?? process.env.MISTRAL_API_KEY,
      })
      return wrap(client(modelId || "mistral-large-latest"))
    }
    case "ollama": {
      // Ollama is OpenAI-compatible
      const client = createOpenAI({
        apiKey: config.apiKey ?? "ollama",
        baseURL: config.baseUrl ?? "http://localhost:11434/v1",
      })
      return wrap(client(modelId || "llama3.2"))
    }
    default: {
      // Google (default)
      const client = createGoogleGenerativeAI({
        apiKey: config.apiKey ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      })
      return wrap(client(modelId || "gemini-2.5-flash"))
    }
  }
}

export function createEmbeddingModel(providerConfigs: ProviderConfigs | null) {
  // Use google for embeddings by default, fall back to openai if google not configured
  const googleConfig = providerConfigs?.["google"]
  const openaiConfig = providerConfigs?.["openai"]

  if (googleConfig?.apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    const client = createGoogleGenerativeAI({
      apiKey: googleConfig?.apiKey ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    })
    return client.embedding("gemini-embedding-001")
  }

  const client = createOpenAI({
    apiKey: openaiConfig?.apiKey ?? process.env.OPENAI_API_KEY,
    baseURL: openaiConfig?.baseUrl ?? undefined,
  })
  return client.embedding("text-embedding-3-small")
}

// Default model for static contexts (type inference, subagents without settings)
export const geminiModel = createLanguageModel(null, "google:gemini-2.5-flash")
