import { devToolsMiddleware } from "@ai-sdk/devtools"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import { wrapLanguageModel } from "ai"
import type { OrgSettings } from "@/db/settings-schema"

export type { OrgSettings }

export function createLanguageModel(settings: OrgSettings | null) {
  if (settings?.aiProvider === "openai") {
    const client = createOpenAI({
      apiKey: settings.aiApiKey ?? process.env.OPENAI_API_KEY,
      baseURL: settings.aiBaseUrl ?? undefined,
    })
    return wrapLanguageModel({
      model: client(settings.aiModel ?? "gpt-4o"),
      middleware: devToolsMiddleware(),
    })
  }

  // Google (default)
  const client = createGoogleGenerativeAI({
    apiKey: settings?.aiApiKey ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  })
  return wrapLanguageModel({
    model: client(settings?.aiModel ?? "gemini-2.5-flash"),
    middleware: devToolsMiddleware(),
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

  // Google (default) — use outputDimensionality: 1536 to match DB column
  const client = createGoogleGenerativeAI({
    apiKey: apiKey ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  })
  return client.embedding(settings?.embeddingModel ?? "gemini-embedding-001")
}

// Default model for static contexts (type inference, subagents without settings)
export const geminiModel = createLanguageModel(null)
