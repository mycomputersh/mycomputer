import { devToolsMiddleware } from "@ai-sdk/devtools"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import { wrapLanguageModel, type LanguageModelMiddleware } from "ai"
import type { OrgSettings } from "@/db/settings-schema"

export type { OrgSettings }

// ─── Rate-limit backoff middleware ────────────────────────────────────────────
// Retries up to MAX_RETRIES times with exponential backoff when a 429 is hit.

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

// ─── Model factories ──────────────────────────────────────────────────────────

export function createLanguageModel(settings: OrgSettings | null) {
  if (settings?.aiProvider === "openai") {
    const client = createOpenAI({
      apiKey: settings.aiApiKey ?? process.env.OPENAI_API_KEY,
      baseURL: settings.aiBaseUrl ?? undefined,
    })
    return wrapLanguageModel({
      model: client(settings.aiModel ?? "gpt-4o"),
      middleware: [rateLimitBackoffMiddleware, devToolsMiddleware()],
    })
  }

  // Google (default)
  const client = createGoogleGenerativeAI({
    apiKey: settings?.aiApiKey ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  })
  return wrapLanguageModel({
    model: client(settings?.aiModel ?? "gemini-2.5-flash"),
    middleware: [rateLimitBackoffMiddleware, devToolsMiddleware()],
  })
}

export function createEmbeddingModel(settings: OrgSettings | null) {
  const provider = settings?.embeddingProvider ?? settings?.aiProvider ?? "google"
  const apiKey = settings?.embeddingApiKey ?? settings?.aiApiKey

  if (provider === "openai") {
    const client = createOpenAI({
      apiKey: apiKey ?? process.env.OPENAI_API_KEY,
      baseURL: settings?.embeddingBaseUrl ?? settings?.aiBaseUrl ?? undefined,
    })
    return client.embedding(settings?.embeddingModel ?? "text-embedding-3-small")
  }

  // Google (default)
  const client = createGoogleGenerativeAI({
    apiKey: apiKey ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  })
  return client.embedding(settings?.embeddingModel ?? "gemini-embedding-001")
}

// Default model for static contexts (type inference, subagents without settings)
export const geminiModel = createLanguageModel(null)
