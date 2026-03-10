import { devToolsMiddleware } from "@ai-sdk/devtools"
import { google } from "@ai-sdk/google"
import { wrapLanguageModel } from "ai"

export const geminiModel = wrapLanguageModel({
  model: google("gemini-2.5-flash"),
  middleware: devToolsMiddleware(),
})
