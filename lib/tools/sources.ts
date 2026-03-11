import { tool, type UIToolInvocation } from "ai"
import { z } from "zod"

export const citationSourceSchema = z.object({
  number: z.number().describe("Citation number used in text as [n]"),
  title: z.string().describe("Source title"),
  url: z.string().describe("Source URL"),
  description: z.string().optional().describe("Brief excerpt or description"),
})

export type CitationSource = z.infer<typeof citationSourceSchema>

export const registerSourcesTool = tool({
  description:
    "Register the sources you are about to cite in your response. " +
    "Call this BEFORE writing any response that uses [1], [2], … citation markers. " +
    "Every [n] marker in your text must correspond to a source registered here.",
  inputSchema: z.object({
    sources: z.array(citationSourceSchema),
  }),
  execute: async ({ sources }) => ({ registered: true, count: sources.length }),
})

export type RegisterSourcesInvocation = UIToolInvocation<typeof registerSourcesTool>
